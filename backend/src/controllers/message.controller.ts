import { Response } from 'express';
import supabase from '../lib/supabase';
import { AuthRequest } from '../types';
import { getPagination, createPaginationResponse } from '../utils/helpers';

export const getConversations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

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

    // Build conversations map
    const conversationsMap = new Map();
    for (const msg of messages || []) {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!conversationsMap.has(partnerId)) {
        const partner = msg.senderId === userId ? msg.receiver : msg.sender;
        conversationsMap.set(partnerId, { partnerId, partner, lastMessage: msg, unreadCount: 0 });
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

    res.json({ success: true, data: Array.from(conversationsMap.values()) });
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

    const { data: message, error } = await supabase.from('Message').insert({ senderId: req.user!.userId, receiverId, content: content.trim() }).select().single();
    if (error) throw error;

    await supabase.from('Notification').insert({ userId: receiverId, title: 'New Message', message: 'You have a new message', type: 'MESSAGE', link: `/messages/${req.user!.userId}` });

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
