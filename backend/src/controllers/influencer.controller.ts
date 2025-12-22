import { Response } from 'express';
import supabase from '../lib/supabase';
import { AuthRequest } from '../types';
import { getPagination, createPaginationResponse } from '../utils/helpers';

// Public influencer discovery for clients
export const discoverInfluencers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page, limit, skip } = getPagination(req);
    const { niche, platform, minFollowers, maxFollowers, minRating, search, sortBy } = req.query;

    let query = supabase
      .from('InfluencerProfile')
      .select(`
        *,
        user:User!inner(id, status, createdAt)
      `, { count: 'exact' })
      .eq('user.status', 'ACTIVE')
      .range(skip, skip + limit - 1);

    if (niche) query = query.eq('primaryNiche', niche as string);
    if (search) query = query.or(`displayName.ilike.%${search}%,bio.ilike.%${search}%`);
    if (minRating) query = query.gte('averageRating', parseFloat(minRating as string));

    // Platform-specific follower filters
    if (platform && minFollowers) {
      const followerField = `${(platform as string).toLowerCase()}Followers`;
      query = query.gte(followerField, parseInt(minFollowers as string));
    }
    if (platform && maxFollowers) {
      const followerField = `${(platform as string).toLowerCase()}Followers`;
      query = query.lte(followerField, parseInt(maxFollowers as string));
    }

    // Sorting
    switch (sortBy) {
      case 'rating':
        query = query.order('averageRating', { ascending: false, nullsFirst: false });
        break;
      case 'followers':
        query = query.order('instagramFollowers', { ascending: false, nullsFirst: false });
        break;
      case 'campaigns':
        query = query.order('completedCampaigns', { ascending: false, nullsFirst: false });
        break;
      default:
        query = query.order('createdAt', { ascending: false });
    }

    const { data: influencers, count, error } = await query;
    if (error) throw error;

    res.json({
      success: true,
      data: influencers,
      pagination: createPaginationResponse(page, limit, count || 0),
    });
  } catch (error) {
    console.error('Discover influencers error:', error);
    res.status(500).json({ success: false, error: 'Failed to discover influencers' });
  }
};

export const getInfluencerPublicProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: profile, error } = await supabase
      .from('InfluencerProfile')
      .select(`
        *,
        user:User(id, createdAt, status)
      `)
      .eq('userId', id)
      .single();

    if (error || !profile) {
      res.status(404).json({ success: false, error: 'Influencer not found' });
      return;
    }

    // Get portfolio items
    const { data: portfolio } = await supabase
      .from('PortfolioItem')
      .select('*')
      .eq('userId', id)
      .order('createdAt', { ascending: false })
      .limit(6);

    // Get recent reviews
    const { data: reviews } = await supabase
      .from('Review')
      .select(`
        *,
        client:User!clientId(clientProfile:ClientProfile(companyName, avatar)),
        advertisement:Advertisement(title)
      `)
      .eq('influencerId', id)
      .order('createdAt', { ascending: false })
      .limit(5);

    // Get stats
    const { count: completedContracts } = await supabase
      .from('Contract')
      .select('*', { count: 'exact', head: true })
      .eq('influencerId', id)
      .eq('status', 'COMPLETED');

    res.json({
      success: true,
      data: {
        ...profile,
        portfolio: portfolio || [],
        reviews: reviews || [],
        stats: {
          completedCampaigns: completedContracts || 0,
          totalReviews: profile.totalReviews || 0,
          averageRating: profile.averageRating || 0,
        },
      },
    });
  } catch (error) {
    console.error('Get influencer profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to get influencer profile' });
  }
};

export const getNiches = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('InfluencerProfile')
      .select('primaryNiche')
      .not('primaryNiche', 'is', null);

    if (error) throw error;

    const niches = [...new Set(data?.map(d => d.primaryNiche).filter(Boolean))];
    res.json({ success: true, data: niches });
  } catch (error) {
    console.error('Get niches error:', error);
    res.status(500).json({ success: false, error: 'Failed to get niches' });
  }
};
