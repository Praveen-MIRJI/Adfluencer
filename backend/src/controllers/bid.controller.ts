import { Response } from 'express';
import crypto from 'crypto';
import supabase from '../lib/supabase';
import { AuthRequest } from '../types';
import { getPagination, createPaginationResponse } from '../utils/helpers';

// Helper function to check and use credit
const checkAndUseCredit = async (userId: string, creditType: 'BID' | 'POST', resourceId: string) => {
  try {
    // Check if credit system is enabled
    const { data: settings, error: settingsError } = await supabase
      .from('CreditSettings')
      .select('creditSystemEnabled')
      .eq('id', 'default')
      .single();

    // If credit tables don't exist, allow the action (system not set up yet)
    if (settingsError && settingsError.code === 'PGRST205') {
      return { success: true, creditSystemDisabled: true };
    }

    if (settingsError) {
      console.error('Credit settings error:', settingsError);
      return { success: true, creditSystemDisabled: true };
    }

    if (!settings?.creditSystemEnabled) {
      return { success: true, creditSystemDisabled: true };
    }

    // Get user credits
    const { data: userCredits, error: creditsError } = await supabase
      .from('UserCredits')
      .select('*')
      .eq('userId', userId)
      .single();

    // If user credits table doesn't exist, allow the action
    if (creditsError && creditsError.code === 'PGRST205') {
      return { success: true, creditSystemDisabled: true };
    }

    if (creditsError && creditsError.code === 'PGRST116') {
      // User doesn't have credits record, create one
      const { error: insertError } = await supabase
        .from('UserCredits')
        .insert({
          userId,
          bidCredits: 0,
          postCredits: 0
        });
      
      if (insertError) {
        console.error('Failed to create user credits:', insertError);
        return { success: true, creditSystemDisabled: true };
      }
      
      return { 
        success: false, 
        error: `Insufficient ${creditType.toLowerCase()} credits`,
        availableCredits: 0
      };
    }

    if (creditsError) {
      console.error('User credits error:', creditsError);
      return { success: true, creditSystemDisabled: true };
    }

    if (!userCredits) {
      return { 
        success: false, 
        error: `Insufficient ${creditType.toLowerCase()} credits`,
        availableCredits: 0
      };
    }

    const availableCredits = creditType === 'BID' ? userCredits.bidCredits : userCredits.postCredits;

    if (availableCredits < 1) {
      return { 
        success: false, 
        error: `Insufficient ${creditType.toLowerCase()} credits`,
        availableCredits
      };
    }

    // Deduct credit
    const newBidCredits = creditType === 'BID' ? userCredits.bidCredits - 1 : userCredits.bidCredits;
    const newPostCredits = creditType === 'POST' ? userCredits.postCredits - 1 : userCredits.postCredits;
    const newTotalUsed = creditType === 'BID'
      ? userCredits.totalBidCreditsUsed + 1
      : userCredits.totalPostCreditsUsed + 1;

    const { error: updateError } = await supabase
      .from('UserCredits')
      .update({
        bidCredits: newBidCredits,
        postCredits: newPostCredits,
        ...(creditType === 'BID' 
          ? { totalBidCreditsUsed: newTotalUsed }
          : { totalPostCreditsUsed: newTotalUsed }
        ),
        updatedAt: new Date().toISOString()
      })
      .eq('userId', userId);

    if (updateError) {
      console.error('Failed to update user credits:', updateError);
      return { success: true, creditSystemDisabled: true };
    }

    // Record transaction
    const { error: transactionError } = await supabase
      .from('CreditTransaction')
      .insert({
        userId,
        transactionType: creditType === 'BID' ? 'USE_BID_CREDIT' : 'USE_POST_CREDIT',
        creditType,
        credits: -1,
        balanceAfter: creditType === 'BID' ? newBidCredits : newPostCredits,
        description: `Used ${creditType.toLowerCase()} credit`,
        paymentStatus: 'COMPLETED',
        metadata: { resourceId }
      });

    if (transactionError) {
      console.error('Failed to record credit transaction:', transactionError);
      // Don't fail the operation if transaction recording fails
    }

    return { 
      success: true, 
      creditsUsed: 1,
      remainingCredits: creditType === 'BID' ? newBidCredits : newPostCredits
    };
  } catch (error) {
    console.error('Credit check error:', error);
    return { success: false, error: 'Failed to process credit' };
  }
};

export const createBid = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log('Creating bid with data:', req.body);
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

    // Check and use bid credit
    console.log('Checking credit for user:', req.user!.userId);
    const creditResult = await checkAndUseCredit(req.user!.userId, 'BID', advertisementId);
    console.log('Credit check result:', creditResult);
    
    if (!creditResult.success && !creditResult.creditSystemDisabled) {
      res.status(400).json({
        success: false,
        error: creditResult.error,
        availableCredits: creditResult.availableCredits,
        requiresCredit: true
      });
      return;
    }

    // Create the bid
    console.log('Creating bid in database...');
    
    // Generate a UUID for the bid
    const bidId = crypto.randomUUID();
    
    const { error: insertError } = await supabase
      .from('Bid')
      .insert({
        id: bidId,
        advertisementId,
        influencerId: req.user!.userId,
        proposedPrice: parseFloat(proposedPrice),
        proposal,
        deliveryDays: parseInt(deliveryDays),
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

    if (insertError) {
      console.error('Bid insert error:', insertError);
      throw insertError;
    }

    // Fetch the created bid
    const { data: bid, error: fetchError } = await supabase
      .from('Bid')
      .select('*')
      .eq('id', bidId)
      .single();

    if (fetchError) {
      console.error('Bid fetch error:', fetchError);
      throw fetchError;
    }
    
    console.log('Bid created successfully:', bid.id);

    // Create notification for client
    try {
      await supabase.from('Notification').insert({
        userId: advertisement.clientId,
        title: 'New Bid Received',
        message: `You received a new bid on "${advertisement.title}"`,
        type: 'BID',
        link: `/client/advertisements/${advertisementId}`,
      });
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
      // Don't fail the bid creation if notification fails
    }

    // Log activity
    try {
      await supabase
        .from('UserActivity')
        .insert({
          userId: req.user!.userId,
          action: 'BID_CREATED',
          resource: 'BID',
          resourceId: bid.id,
          metadata: { 
            advertisementId, 
            proposedPrice: parseFloat(proposedPrice),
            creditUsed: creditResult.creditsUsed || 0,
            remainingCredits: creditResult.remainingCredits || 0,
            creditSystemDisabled: creditResult.creditSystemDisabled || false
          }
        });
    } catch (activityError) {
      console.error('Failed to log activity:', activityError);
      // Don't fail the bid creation if activity logging fails
    }

    const responseMessage = creditResult.creditSystemDisabled 
      ? 'Bid submitted successfully!'
      : creditResult.creditsUsed 
        ? `Bid submitted successfully! 1 bid credit used. ${creditResult.remainingCredits} credits remaining.`
        : 'Bid submitted successfully!';

    res.status(201).json({ 
      success: true, 
      data: { 
        ...bid, 
        advertisement: { title: advertisement.title },
        creditInfo: {
          creditUsed: creditResult.creditsUsed || 0,
          remainingCredits: creditResult.remainingCredits || 0,
          creditSystemDisabled: creditResult.creditSystemDisabled || false
        }
      },
      message: responseMessage
    });
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
