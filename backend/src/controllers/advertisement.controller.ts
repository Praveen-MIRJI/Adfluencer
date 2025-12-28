import { Request, Response } from 'express';
import supabase from '../lib/supabase';
import { AuthRequest, AdStatus } from '../types';
import { getPagination, createPaginationResponse } from '../utils/helpers';

// Helper function to check and use credit
const checkAndUseCredit = async (userId: string, creditType: 'BID' | 'POST', resourceId: string) => {
  try {
    console.log(`[checkAndUseCredit] Checking credit for user ${userId}, type: ${creditType}`);

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

    console.log(`[checkAndUseCredit] Available ${creditType} credits: ${availableCredits}`);

    if (availableCredits < 1) {
      return { 
        success: false, 
        error: `Insufficient ${creditType.toLowerCase()} credits`,
        availableCredits
      };
    }

    // Deduct credit
    console.log(`[checkAndUseCredit] Deducting 1 ${creditType} credit`);
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

    console.log(`[checkAndUseCredit] Credit deducted successfully. New balance: ${creditType === 'BID' ? newBidCredits : newPostCredits}`);

    return { 
      success: true, 
      creditsUsed: 1,
      remainingCredits: creditType === 'BID' ? newBidCredits : newPostCredits
    };
  } catch (error) {
    console.error('Credit check error:', error);
    return { success: true, creditSystemDisabled: true };
  }
};

export const getAdvertisements = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, skip } = getPagination(req);
    const { category, platform, status, minBudget, maxBudget, search } = req.query;

    let query = supabase
      .from('Advertisement')
      .select('*, category:Category(*), client:User(id, clientProfile:ClientProfile(companyName, avatar))', { count: 'exact' })
      .eq('status', (status as AdStatus) || 'OPEN')
      .order('createdAt', { ascending: false })
      .range(skip, skip + limit - 1);

    if (category) query = query.eq('categoryId', category as string);
    if (platform) query = query.eq('platform', platform as string);
    if (minBudget) query = query.gte('budgetMax', parseFloat(minBudget as string));
    if (maxBudget) query = query.lte('budgetMin', parseFloat(maxBudget as string));
    if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);

    const { data: advertisements, count, error } = await query;

    if (error) throw error;

    // Get bid counts for each advertisement
    const adsWithCounts = await Promise.all(
      (advertisements || []).map(async (ad) => {
        const { count: bidCount } = await supabase
          .from('Bid')
          .select('*', { count: 'exact', head: true })
          .eq('advertisementId', ad.id);
        return { ...ad, _count: { bids: bidCount || 0 } };
      })
    );

    res.json({
      success: true,
      data: adsWithCounts,
      pagination: createPaginationResponse(page, limit, count || 0),
    });
  } catch (error) {
    console.error('Get advertisements error:', error);
    res.status(500).json({ success: false, error: 'Failed to get advertisements' });
  }
};

export const getAdvertisementById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: advertisement, error } = await supabase
      .from('Advertisement')
      .select('*, category:Category(*), client:User(id, email, clientProfile:ClientProfile(companyName, avatar, industry))')
      .eq('id', id)
      .single();

    if (error || !advertisement) {
      res.status(404).json({ success: false, error: 'Advertisement not found' });
      return;
    }

    // Get bids with influencer info
    const { data: bids } = await supabase
      .from('Bid')
      .select('*, influencer:User(id, influencerProfile:InfluencerProfile(displayName, avatar, primaryNiche, engagementRate))')
      .eq('advertisementId', id)
      .order('createdAt', { ascending: false });

    res.json({ success: true, data: { ...advertisement, bids: bids || [] } });
  } catch (error) {
    console.error('Get advertisement error:', error);
    res.status(500).json({ success: false, error: 'Failed to get advertisement' });
  }
};

export const createAdvertisement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      title, description, categoryId, platform, contentType,
      duration, budgetMin, budgetMax, deadline, requirements, targetAudience,
    } = req.body;

    if (parseFloat(budgetMin) > parseFloat(budgetMax)) {
      res.status(400).json({ success: false, error: 'Minimum budget cannot exceed maximum' });
      return;
    }

    if (new Date(deadline) <= new Date()) {
      res.status(400).json({ success: false, error: 'Deadline must be in the future' });
      return;
    }

    // Check and use post credit
    const creditResult = await checkAndUseCredit(req.user!.userId, 'POST', 'advertisement');
    
    if (!creditResult.success && !creditResult.creditSystemDisabled) {
      res.status(400).json({
        success: false,
        error: creditResult.error,
        availableCredits: creditResult.availableCredits,
        requiresCredit: true
      });
      return;
    }

    const { data: advertisement, error } = await supabase
      .from('Advertisement')
      .insert({
        clientId: req.user!.userId,
        categoryId,
        title,
        description,
        platform,
        contentType,
        duration,
        budgetMin: parseFloat(budgetMin),
        budgetMax: parseFloat(budgetMax),
        deadline: new Date(deadline).toISOString(),
        requirements,
        targetAudience,
        status: 'OPEN',
      })
      .select('*, category:Category(*)')
      .single();

    if (error) throw error;

    // Log activity
    await supabase
      .from('UserActivity')
      .insert({
        userId: req.user!.userId,
        action: 'ADVERTISEMENT_CREATED',
        resource: 'ADVERTISEMENT',
        resourceId: advertisement.id,
        metadata: { 
          title,
          budgetMin: parseFloat(budgetMin),
          budgetMax: parseFloat(budgetMax),
          creditUsed: creditResult.creditsUsed || 0,
          remainingCredits: creditResult.remainingCredits || 0,
          creditSystemDisabled: creditResult.creditSystemDisabled || false
        }
      });

    const responseMessage = creditResult.creditSystemDisabled 
      ? 'Advertisement posted successfully!'
      : creditResult.creditsUsed 
        ? `Advertisement posted successfully! 1 post credit used. ${creditResult.remainingCredits} credits remaining.`
        : 'Advertisement posted successfully!';

    res.status(201).json({ 
      success: true, 
      data: {
        ...advertisement,
        creditInfo: {
          creditUsed: creditResult.creditsUsed || 0,
          remainingCredits: creditResult.remainingCredits || 0,
          creditSystemDisabled: creditResult.creditSystemDisabled || false
        }
      },
      message: responseMessage
    });
  } catch (error) {
    console.error('Create advertisement error:', error);
    res.status(500).json({ success: false, error: 'Failed to create advertisement' });
  }
};

export const updateAdvertisement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: existing } = await supabase
      .from('Advertisement')
      .select('id, status')
      .eq('id', id)
      .eq('clientId', req.user!.userId)
      .single();

    if (!existing) {
      res.status(404).json({ success: false, error: 'Advertisement not found' });
      return;
    }

    if (existing.status !== 'OPEN') {
      res.status(400).json({ success: false, error: 'Cannot edit closed advertisement' });
      return;
    }

    const { data: advertisement, error } = await supabase
      .from('Advertisement')
      .update({ ...req.body, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select('*, category:Category(*)')
      .single();

    if (error) throw error;

    res.json({ success: true, data: advertisement });
  } catch (error) {
    console.error('Update advertisement error:', error);
    res.status(500).json({ success: false, error: 'Failed to update advertisement' });
  }
};

export const closeAdvertisement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('Advertisement')
      .update({ status: 'CLOSED', updatedAt: new Date().toISOString() })
      .eq('id', id)
      .eq('clientId', req.user!.userId)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      res.status(404).json({ success: false, error: 'Advertisement not found' });
      return;
    }

    res.json({ success: true, message: 'Advertisement closed' });
  } catch (error) {
    console.error('Close advertisement error:', error);
    res.status(500).json({ success: false, error: 'Failed to close advertisement' });
  }
};

export const deleteAdvertisement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('Advertisement')
      .delete()
      .eq('id', id)
      .eq('clientId', req.user!.userId)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      res.status(404).json({ success: false, error: 'Advertisement not found' });
      return;
    }

    res.json({ success: true, message: 'Advertisement deleted' });
  } catch (error) {
    console.error('Delete advertisement error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete advertisement' });
  }
};

export const getMyAdvertisements = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page, limit, skip } = getPagination(req);
    const { status } = req.query;

    let query = supabase
      .from('Advertisement')
      .select('*, category:Category(*)', { count: 'exact' })
      .eq('clientId', req.user!.userId)
      .order('createdAt', { ascending: false })
      .range(skip, skip + limit - 1);

    if (status) query = query.eq('status', status as string);

    const { data: advertisements, count, error } = await query;

    if (error) throw error;

    const adsWithCounts = await Promise.all(
      (advertisements || []).map(async (ad) => {
        const { count: bidCount } = await supabase
          .from('Bid')
          .select('*', { count: 'exact', head: true })
          .eq('advertisementId', ad.id);
        return { ...ad, _count: { bids: bidCount || 0 } };
      })
    );

    res.json({
      success: true,
      data: adsWithCounts,
      pagination: createPaginationResponse(page, limit, count || 0),
    });
  } catch (error) {
    console.error('Get my advertisements error:', error);
    res.status(500).json({ success: false, error: 'Failed to get advertisements' });
  }
};
