import { Response } from 'express';
import supabase from '../lib/supabase';
import { AuthRequest } from '../types';
import { getPagination, createPaginationResponse } from '../utils/helpers';

export const createContract = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { bidId } = req.body;

    const { data: bid } = await supabase
      .from('Bid')
      .select('*, advertisement:Advertisement(clientId, title)')
      .eq('id', bidId)
      .eq('status', 'ACCEPTED')
      .single();

    if (!bid || bid.advertisement.clientId !== req.user!.userId) {
      res.status(404).json({ success: false, error: 'Accepted bid not found' });
      return;
    }

    const { data: existingContract } = await supabase
      .from('Contract')
      .select('id')
      .eq('bidId', bidId)
      .single();

    if (existingContract) {
      res.status(400).json({ success: false, error: 'Contract already exists for this bid' });
      return;
    }

    const deliveryDeadline = new Date();
    deliveryDeadline.setDate(deliveryDeadline.getDate() + bid.deliveryDays);

    const { data: contract, error } = await supabase
      .from('Contract')
      .insert({
        bidId,
        clientId: req.user!.userId,
        influencerId: bid.influencerId,
        advertisementId: bid.advertisementId,
        agreedPrice: bid.proposedPrice,
        deliveryDeadline: deliveryDeadline.toISOString(),
        status: 'ACTIVE',
      })
      .select()
      .single();

    if (error) throw error;

    await supabase.from('Notification').insert({
      userId: bid.influencerId,
      title: 'Contract Created',
      message: `A contract has been created for "${bid.advertisement.title}"`,
      type: 'CONTRACT',
      link: `/contracts/${contract.id}`,
    });

    res.status(201).json({ success: true, data: contract });
  } catch (error) {
    console.error('Create contract error:', error);
    res.status(500).json({ success: false, error: 'Failed to create contract' });
  }
};

export const getMyContracts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page, limit, skip } = getPagination(req);
    const { status } = req.query;
    const { userId, role } = req.user!;

    const filterField = role === 'CLIENT' ? 'clientId' : 'influencerId';

    let query = supabase
      .from('Contract')
      .select(`
        *,
        advertisement:Advertisement(title, platform, contentType),
        client:User!clientId(email, clientProfile:ClientProfile(companyName, avatar)),
        influencer:User!influencerId(email, influencerProfile:InfluencerProfile(displayName, avatar))
      `, { count: 'exact' })
      .eq(filterField, userId)
      .order('createdAt', { ascending: false })
      .range(skip, skip + limit - 1);

    if (status) query = query.eq('status', status as string);

    const { data: contracts, count, error } = await query;
    if (error) throw error;

    res.json({
      success: true,
      data: contracts,
      pagination: createPaginationResponse(page, limit, count || 0),
    });
  } catch (error) {
    console.error('Get contracts error:', error);
    res.status(500).json({ success: false, error: 'Failed to get contracts' });
  }
};


export const getContractById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { userId } = req.user!;

    const { data: contract, error } = await supabase
      .from('Contract')
      .select(`
        *,
        bid:Bid(proposal, deliveryDays),
        advertisement:Advertisement(*),
        client:User!clientId(email, clientProfile:ClientProfile(*)),
        influencer:User!influencerId(email, influencerProfile:InfluencerProfile(*))
      `)
      .eq('id', id)
      .or(`clientId.eq.${userId},influencerId.eq.${userId}`)
      .single();

    if (error || !contract) {
      res.status(404).json({ success: false, error: 'Contract not found' });
      return;
    }

    res.json({ success: true, data: contract });
  } catch (error) {
    console.error('Get contract error:', error);
    res.status(500).json({ success: false, error: 'Failed to get contract' });
  }
};

export const completeContract = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: contract } = await supabase
      .from('Contract')
      .select('*, advertisement:Advertisement(title)')
      .eq('id', id)
      .eq('clientId', req.user!.userId)
      .eq('status', 'ACTIVE')
      .single();

    if (!contract) {
      res.status(404).json({ success: false, error: 'Active contract not found' });
      return;
    }

    const { error } = await supabase
      .from('Contract')
      .update({ 
        status: 'COMPLETED', 
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;

    // Update influencer's completed campaigns count
    await supabase.rpc('increment_completed_campaigns', { user_id: contract.influencerId });

    await supabase.from('Notification').insert({
      userId: contract.influencerId,
      title: 'Contract Completed',
      message: `The contract for "${contract.advertisement.title}" has been marked as completed!`,
      type: 'CONTRACT_COMPLETED',
    });

    res.json({ success: true, message: 'Contract completed' });
  } catch (error) {
    console.error('Complete contract error:', error);
    res.status(500).json({ success: false, error: 'Failed to complete contract' });
  }
};

export const cancelContract = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const { userId } = req.user!;

    const { data: contract } = await supabase
      .from('Contract')
      .select('*, advertisement:Advertisement(title)')
      .eq('id', id)
      .or(`clientId.eq.${userId},influencerId.eq.${userId}`)
      .eq('status', 'ACTIVE')
      .single();

    if (!contract) {
      res.status(404).json({ success: false, error: 'Active contract not found' });
      return;
    }

    const { error } = await supabase
      .from('Contract')
      .update({ status: 'CANCELLED', updatedAt: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    const notifyUserId = contract.clientId === userId ? contract.influencerId : contract.clientId;
    await supabase.from('Notification').insert({
      userId: notifyUserId,
      title: 'Contract Cancelled',
      message: `The contract for "${contract.advertisement.title}" has been cancelled. ${reason ? `Reason: ${reason}` : ''}`,
      type: 'CONTRACT_CANCELLED',
    });

    res.json({ success: true, message: 'Contract cancelled' });
  } catch (error) {
    console.error('Cancel contract error:', error);
    res.status(500).json({ success: false, error: 'Failed to cancel contract' });
  }
};
