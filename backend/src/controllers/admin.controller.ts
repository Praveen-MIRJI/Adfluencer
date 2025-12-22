import { Response } from 'express';
import supabase from '../lib/supabase';
import { AuthRequest, UserStatus, AdStatus } from '../types';
import { getPagination, createPaginationResponse } from '../utils/helpers';

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page, limit, skip } = getPagination(req);
    const { role, status, search } = req.query;

    let query = supabase
      .from('User')
      .select('id, email, role, status, createdAt, clientProfile:ClientProfile(companyName), influencerProfile:InfluencerProfile(displayName)', { count: 'exact' })
      .order('createdAt', { ascending: false })
      .range(skip, skip + limit - 1);

    if (role) query = query.eq('role', role as string);
    if (status) query = query.eq('status', status as string);
    if (search) query = query.ilike('email', `%${search}%`);

    const { data: users, count, error } = await query;
    if (error) throw error;

    res.json({ success: true, data: users, pagination: createPaginationResponse(page, limit, count || 0) });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, error: 'Failed to get users' });
  }
};

export const updateUserStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'BLOCKED', 'PENDING'].includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid status' });
      return;
    }

    const { data: user, error } = await supabase
      .from('User')
      .update({ status: status as UserStatus, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select('id, email, status')
      .single();

    if (error) throw error;

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ success: false, error: 'Failed to update user status' });
  }
};

export const getAdvertisements = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page, limit, skip } = getPagination(req);
    const { status } = req.query;

    let query = supabase
      .from('Advertisement')
      .select('*, category:Category(*), client:User(email, clientProfile:ClientProfile(companyName))', { count: 'exact' })
      .order('createdAt', { ascending: false })
      .range(skip, skip + limit - 1);

    if (status) query = query.eq('status', status as string);

    const { data: advertisements, count, error } = await query;
    if (error) throw error;

    const adsWithCounts = await Promise.all(
      (advertisements || []).map(async (ad) => {
        const { count: bidCount } = await supabase.from('Bid').select('*', { count: 'exact', head: true }).eq('advertisementId', ad.id);
        return { ...ad, _count: { bids: bidCount || 0 } };
      })
    );

    res.json({ success: true, data: adsWithCounts, pagination: createPaginationResponse(page, limit, count || 0) });
  } catch (error) {
    console.error('Get advertisements error:', error);
    res.status(500).json({ success: false, error: 'Failed to get advertisements' });
  }
};

export const updateAdStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['OPEN', 'CLOSED', 'PENDING_APPROVAL', 'REJECTED'].includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid status' });
      return;
    }

    const { data: advertisement, error } = await supabase
      .from('Advertisement')
      .update({ status: status as AdStatus, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data: advertisement });
  } catch (error) {
    console.error('Update ad status error:', error);
    res.status(500).json({ success: false, error: 'Failed to update advertisement status' });
  }
};

export const getAdminStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [
      { count: totalUsers },
      { count: totalClients },
      { count: totalInfluencers },
      { count: pendingUsers },
      { count: totalAds },
      { count: openAds },
      { count: totalBids },
    ] = await Promise.all([
      supabase.from('User').select('*', { count: 'exact', head: true }),
      supabase.from('User').select('*', { count: 'exact', head: true }).eq('role', 'CLIENT'),
      supabase.from('User').select('*', { count: 'exact', head: true }).eq('role', 'INFLUENCER'),
      supabase.from('User').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
      supabase.from('Advertisement').select('*', { count: 'exact', head: true }),
      supabase.from('Advertisement').select('*', { count: 'exact', head: true }).eq('status', 'OPEN'),
      supabase.from('Bid').select('*', { count: 'exact', head: true }),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers: totalUsers || 0, totalClients: totalClients || 0, totalInfluencers: totalInfluencers || 0,
        pendingUsers: pendingUsers || 0, totalAds: totalAds || 0, openAds: openAds || 0, totalBids: totalBids || 0,
      },
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to get stats' });
  }
};
