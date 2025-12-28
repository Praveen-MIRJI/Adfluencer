import { Response } from 'express';
import supabase from '../lib/supabase';
import { AuthRequest } from '../types';
import { getPagination, createPaginationResponse } from '../utils/helpers';

export const getConversations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    // Get all contracts where user is either client or influencer with partner details
    const { data: contracts, error: contractError } = await supabase
      .from('Contract')
      .select(`
        id,
        clientId,
        influencerId,
        client:User!Contract_clientId_fkey(id, email, role, clientProfile:ClientProfile(companyName, avatar)),
        influencer:User!Contract_influencerId_fkey(id, email, role, influencerProfile:InfluencerProfile(displayName, avatar))
      `)
      .or(`clientId.eq.${userId},influencerId.eq.${userId}`)
      .in('status', ['ACTIVE', 'COMPLETED']);

    if (contractError) {
      console.error('Contract error:', contractError);
      throw contractError;
    }

    // Build conversations map from contracts (this ensures all contract partners appear)
    const conversationsMap = new Map();

    for (const contract of contracts || []) {
      const partnerId = contract.clientId === userId ? contract.influencerId : contract.clientId;
      const partner = contract.clientId === userId ? contract.influencer : contract.client;

      if (!conversationsMap.has(partnerId)) {
        conversationsMap.set(partnerId, {
          partnerId,
          partner,
          lastMessage: null,
          unreadCount: 0
        });
      }
    }

    // Get all messages where user is sender or receiver
    const { data: messages, error } = await supabase
      .from('Message')
      .select(`
        *,
        sender:User!Message_senderId_fkey(id, email, role, clientProfile:ClientProfile(companyName, avatar), influencerProfile:InfluencerProfile(displayName, avatar)),
        receiver:User!Message_receiverId_fkey(id, email, role, clientProfile:ClientProfile(companyName, avatar), influencerProfile:InfluencerProfile(displayName, avatar))
      `)
      .or(`senderId.eq.${userId},receiverId.eq.${userId}`)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    // Update conversations with latest messages (only for partners we have contracts with)
    for (const msg of messages || []) {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;

      if (conversationsMap.has(partnerId)) {
        const conv = conversationsMap.get(partnerId);
        // Only update if this is the first message (most recent due to ordering)
        if (!conv.lastMessage) {
          conv.lastMessage = msg;
        }
      }
    }

    // Get unread counts
    const { data: unreadData } = await supabase
      .from('Message')
      .select('senderId')
      .eq('receiverId', userId)
      .eq('isRead', false);

    const unreadCounts: Record<string, number> = {};
    for (const msg of unreadData || []) {
      unreadCounts[msg.senderId] = (unreadCounts[msg.senderId] || 0) + 1;
    }

    for (const [partnerId, conv] of conversationsMap) {
      conv.unreadCount = unreadCounts[partnerId] || 0;
    }

    // Sort conversations: those with messages first (by last message time), then those without
    const conversationsArray = Array.from(conversationsMap.values()).sort((a, b) => {
      if (a.lastMessage && b.lastMessage) {
        return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
      }
      if (a.lastMessage) return -1;
      if (b.lastMessage) return 1;
      return 0;
    });

    res.json({ success: true, data: conversationsArray });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ success: false, error: 'Failed to get conversations' });
  }
};

export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId: partnerId } = req.params;
    const userId = req.user!.userId;
    const { page, limit, skip } = getPagination(req);

    const { data: messages, count, error } = await supabase
      .from('Message')
      .select('*', { count: 'exact' })
      .or(`and(senderId.eq.${userId},receiverId.eq.${partnerId}),and(senderId.eq.${partnerId},receiverId.eq.${userId})`)
      .order('createdAt', { ascending: false })
      .range(skip, skip + limit - 1);

    if (error) throw error;

    await supabase.from('Message').update({ isRead: true }).eq('senderId', partnerId).eq('receiverId', userId).eq('isRead', false);

    res.json({ success: true, data: (messages || []).reverse(), pagination: createPaginationResponse(page, limit, count || 0) });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, error: 'Failed to get messages' });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { receiverId, content } = req.body;
    if (!content?.trim()) { res.status(400).json({ success: false, error: 'Message content is required' }); return; }

    const userId = req.user!.userId;

    // Check if there's an active or completed contract between sender and receiver
    const { data: contract, error: contractError } = await supabase
      .from('Contract')
      .select('id')
      .or(`and(clientId.eq.${userId},influencerId.eq.${receiverId}),and(clientId.eq.${receiverId},influencerId.eq.${userId})`)
      .in('status', ['ACTIVE', 'COMPLETED'])
      .limit(1)
      .single();

    if (contractError || !contract) {
      res.status(403).json({
        success: false,
        error: 'You can only message users after a bid has been accepted and a contract is created'
      });
      return;
    }

    const { data: message, error } = await supabase.from('Message').insert({ senderId: userId, receiverId, content: content.trim() }).select().single();
    if (error) throw error;

    await supabase.from('Notification').insert({ userId: receiverId, title: 'New Message', message: 'You have a new message', type: 'MESSAGE', link: `/messages/${userId}` });

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await supabase.from('Message').update({ isRead: true }).eq('id', id).eq('receiverId', req.user!.userId);
    res.json({ success: true, message: 'Message marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ success: false, error: 'Failed to mark as read' });
  }
};
