import { Response } from 'express';
import supabase from '../lib/supabase';
import { AuthRequest } from '../types';
import { getPagination, createPaginationResponse } from '../utils/helpers';

export const createBid = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { advertisementId, proposedPrice, proposal, deliveryDays } = req.body;

    const { data: advertisement } = await supabase
      .from('Advertisement')
      .select('id, status, deadline, clientId, title')
      .eq('id', advertisementId)
      .single();

    if (!advertisement) {
      res.status(404).json({ success: false, error: 'Advertisement not found' });
      return;
    }

    if (advertisement.status !== 'OPEN') {
      res.status(400).json({ success: false, error: 'Advertisement is not accepting bids' });
      return;
    }

    if (new Date(advertisement.deadline) < new Date()) {
      res.status(400).json({ success: false, error: 'Bid deadline has passed' });
      return;
    }

    const { data: existingBid } = await supabase
      .from('Bid')
      .select('id')
      .eq('advertisementId', advertisementId)
      .eq('influencerId', req.user!.userId)
      .single();

    if (existingBid) {
      res.status(400).json({ success: false, error: 'You have already bid on this advertisement' });
      return;
    }

    const { data: bid, error } = await supabase
      .from('Bid')
      .insert({
        advertisementId,
        influencerId: req.user!.userId,
        proposedPrice: parseFloat(proposedPrice),
        proposal,
        deliveryDays: parseInt(deliveryDays),
      })
      .select()
      .single();

    if (error) throw error;

    // Create notification for client
    await supabase.from('Notification').insert({
      userId: advertisement.clientId,
      title: 'New Bid Received',
      message: `You received a new bid on "${advertisement.title}"`,
      type: 'BID',
      link: `/client/advertisements/${advertisementId}`,
    });

    res.status(201).json({ success: true, data: { ...bid, advertisement: { title: advertisement.title } } });
  } catch (error) {
    console.error('Create bid error:', error);
    res.status(500).json({ success: false, error: 'Failed to create bid' });
  }
};

export const getMyBids = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page, limit, skip } = getPagination(req);
    const { status } = req.query;

    let query = supabase
      .from('Bid')
      .select('*, advertisement:Advertisement(*, category:Category(*), client:User(clientProfile:ClientProfile(companyName)))', { count: 'exact' })
      .eq('influencerId', req.user!.userId)
      .order('createdAt', { ascending: false })
      .range(skip, skip + limit - 1);

    if (status) query = query.eq('status', status as string);

    const { data: bids, count, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: bids,
      pagination: createPaginationResponse(page, limit, count || 0),
    });
  } catch (error) {
    console.error('Get my bids error:', error);
    res.status(500).json({ success: false, error: 'Failed to get bids' });
  }
};

export const updateBid = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { proposedPrice, proposal, deliveryDays } = req.body;

    const { data: bid } = await supabase
      .from('Bid')
      .select('*, advertisement:Advertisement(deadline)')
      .eq('id', id)
      .eq('influencerId', req.user!.userId)
      .single();

    if (!bid) {
      res.status(404).json({ success: false, error: 'Bid not found' });
      return;
    }

    if (bid.status !== 'PENDING') {
      res.status(400).json({ success: false, error: 'Cannot update non-pending bid' });
      return;
    }

    if (new Date(bid.advertisement.deadline) < new Date()) {
      res.status(400).json({ success: false, error: 'Bid deadline has passed' });
      return;
    }

    const updateData: any = { updatedAt: new Date().toISOString() };
    if (proposedPrice) updateData.proposedPrice = parseFloat(proposedPrice);
    if (proposal) updateData.proposal = proposal;
    if (deliveryDays) updateData.deliveryDays = parseInt(deliveryDays);

    const { data: updatedBid, error } = await supabase
      .from('Bid')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data: updatedBid });
  } catch (error) {
    console.error('Update bid error:', error);
    res.status(500).json({ success: false, error: 'Failed to update bid' });
  }
};

export const withdrawBid = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('Bid')
      .delete()
      .eq('id', id)
      .eq('influencerId', req.user!.userId)
      .eq('status', 'PENDING')
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      res.status(404).json({ success: false, error: 'Bid not found or cannot be withdrawn' });
      return;
    }

    res.json({ success: true, message: 'Bid withdrawn' });
  } catch (error) {
    console.error('Withdraw bid error:', error);
    res.status(500).json({ success: false, error: 'Failed to withdraw bid' });
  }
};

export const getBidsForAdvertisement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { advertisementId } = req.params;
    const { page, limit, skip } = getPagination(req);

    const { data: advertisement } = await supabase
      .from('Advertisement')
      .select('id')
      .eq('id', advertisementId)
      .eq('clientId', req.user!.userId)
      .single();

    if (!advertisement) {
      res.status(404).json({ success: false, error: 'Advertisement not found' });
      return;
    }

    const { data: bids, count, error } = await supabase
      .from('Bid')
      .select('*, influencer:User(id, email, influencerProfile:InfluencerProfile(*))', { count: 'exact' })
      .eq('advertisementId', advertisementId)
      .order('createdAt', { ascending: false })
      .range(skip, skip + limit - 1);

    if (error) throw error;

    res.json({
      success: true,
      data: bids,
      pagination: createPaginationResponse(page, limit, count || 0),
    });
  } catch (error) {
    console.error('Get bids for advertisement error:', error);
    res.status(500).json({ success: false, error: 'Failed to get bids' });
  }
};

export const shortlistBid = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: bid } = await supabase
      .from('Bid')
      .select('*, advertisement:Advertisement(clientId, title)')
      .eq('id', id)
      .single();

    if (!bid || bid.advertisement.clientId !== req.user!.userId) {
      res.status(404).json({ success: false, error: 'Bid not found' });
      return;
    }

    const { data: updatedBid, error } = await supabase
      .from('Bid')
      .update({ status: 'SHORTLISTED', updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await supabase.from('Notification').insert({
      userId: bid.influencerId,
      title: 'Bid Shortlisted',
      message: `Your bid on "${bid.advertisement.title}" has been shortlisted!`,
      type: 'BID_UPDATE',
      link: `/influencer/bids`,
    });

    res.json({ success: true, data: updatedBid });
  } catch (error) {
    console.error('Shortlist bid error:', error);
    res.status(500).json({ success: false, error: 'Failed to shortlist bid' });
  }
};

export const acceptBid = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: bid } = await supabase
      .from('Bid')
      .select('*, advertisement:Advertisement(clientId, title)')
      .eq('id', id)
      .single();

    if (!bid || bid.advertisement.clientId !== req.user!.userId) {
      res.status(404).json({ success: false, error: 'Bid not found' });
      return;
    }

    // Accept this bid
    await supabase
      .from('Bid')
      .update({ status: 'ACCEPTED', updatedAt: new Date().toISOString() })
      .eq('id', id);

    // Reject other bids
    await supabase
      .from('Bid')
      .update({ status: 'REJECTED', updatedAt: new Date().toISOString() })
      .eq('advertisementId', bid.advertisementId)
      .neq('id', id);

    // Close advertisement
    await supabase
      .from('Advertisement')
      .update({ status: 'CLOSED', updatedAt: new Date().toISOString() })
      .eq('id', bid.advertisementId);

    // Create contract automatically
    const deliveryDeadline = new Date();
    deliveryDeadline.setDate(deliveryDeadline.getDate() + bid.deliveryDays);

    await supabase
      .from('Contract')
      .insert({
        bidId: id,
        clientId: req.user!.userId,
        influencerId: bid.influencerId,
        advertisementId: bid.advertisementId,
        agreedPrice: bid.proposedPrice,
        deliveryDeadline: deliveryDeadline.toISOString(),
        status: 'ACTIVE',
      });

    await supabase.from('Notification').insert({
      userId: bid.influencerId,
      title: 'Bid Accepted!',
      message: `Congratulations! Your bid on "${bid.advertisement.title}" has been accepted! A contract has been created.`,
      type: 'BID_ACCEPTED',
      link: `/influencer/contracts`,
    });

    res.json({ success: true, message: 'Bid accepted and contract created' });
  } catch (error) {
    console.error('Accept bid error:', error);
    res.status(500).json({ success: false, error: 'Failed to accept bid' });
  }
};

export const rejectBid = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: bid } = await supabase
      .from('Bid')
      .select('*, advertisement:Advertisement(clientId)')
      .eq('id', id)
      .single();

    if (!bid || bid.advertisement.clientId !== req.user!.userId) {
      res.status(404).json({ success: false, error: 'Bid not found' });
      return;
    }

    await supabase
      .from('Bid')
      .update({ status: 'REJECTED', updatedAt: new Date().toISOString() })
      .eq('id', id);

    res.json({ success: true, message: 'Bid rejected' });
  } catch (error) {
    console.error('Reject bid error:', error);
    res.status(500).json({ success: false, error: 'Failed to reject bid' });
  }
};
