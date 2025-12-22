import { Request, Response } from 'express';
import supabase from '../lib/supabase';
import { AuthRequest, AdStatus } from '../types';
import { getPagination, createPaginationResponse } from '../utils/helpers';

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

    res.status(201).json({ success: true, data: advertisement });
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
