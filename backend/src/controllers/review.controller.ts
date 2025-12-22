import { Response } from 'express';
import supabase from '../lib/supabase';
import { AuthRequest } from '../types';
import { getPagination, createPaginationResponse } from '../utils/helpers';

export const createReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { influencerId, advertisementId, rating, comment } = req.body;

    // Verify the client has a completed contract with this influencer for this ad
    const { data: contract } = await supabase
      .from('Contract')
      .select('id')
      .eq('clientId', req.user!.userId)
      .eq('influencerId', influencerId)
      .eq('advertisementId', advertisementId)
      .eq('status', 'COMPLETED')
      .single();

    if (!contract) {
      res.status(400).json({ success: false, error: 'Can only review after contract completion' });
      return;
    }

    // Check if review already exists
    const { data: existingReview } = await supabase
      .from('Review')
      .select('id')
      .eq('clientId', req.user!.userId)
      .eq('influencerId', influencerId)
      .eq('advertisementId', advertisementId)
      .single();

    if (existingReview) {
      res.status(400).json({ success: false, error: 'Review already submitted' });
      return;
    }

    const { data: review, error } = await supabase
      .from('Review')
      .insert({
        clientId: req.user!.userId,
        influencerId,
        advertisementId,
        rating: parseInt(rating),
        comment,
      })
      .select()
      .single();

    if (error) throw error;

    // Update influencer's average rating
    const { data: reviews } = await supabase
      .from('Review')
      .select('rating')
      .eq('influencerId', influencerId);

    if (reviews && reviews.length > 0) {
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      await supabase
        .from('InfluencerProfile')
        .update({ 
          averageRating: Math.round(avgRating * 10) / 10,
          totalReviews: reviews.length,
        })
        .eq('userId', influencerId);
    }

    await supabase.from('Notification').insert({
      userId: influencerId,
      title: 'New Review',
      message: `You received a ${rating}-star review!`,
      type: 'REVIEW',
    });

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ success: false, error: 'Failed to create review' });
  }
};

export const getInfluencerReviews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { influencerId } = req.params;
    const { page, limit, skip } = getPagination(req);

    const { data: reviews, count, error } = await supabase
      .from('Review')
      .select(`
        *,
        client:User!clientId(clientProfile:ClientProfile(companyName, avatar)),
        advertisement:Advertisement(title)
      `, { count: 'exact' })
      .eq('influencerId', influencerId)
      .order('createdAt', { ascending: false })
      .range(skip, skip + limit - 1);

    if (error) throw error;

    res.json({
      success: true,
      data: reviews,
      pagination: createPaginationResponse(page, limit, count || 0),
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ success: false, error: 'Failed to get reviews' });
  }
};

export const getMyReviews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page, limit, skip } = getPagination(req);

    const { data: reviews, count, error } = await supabase
      .from('Review')
      .select(`
        *,
        client:User!clientId(clientProfile:ClientProfile(companyName, avatar)),
        advertisement:Advertisement(title)
      `, { count: 'exact' })
      .eq('influencerId', req.user!.userId)
      .order('createdAt', { ascending: false })
      .range(skip, skip + limit - 1);

    if (error) throw error;

    res.json({
      success: true,
      data: reviews,
      pagination: createPaginationResponse(page, limit, count || 0),
    });
  } catch (error) {
    console.error('Get my reviews error:', error);
    res.status(500).json({ success: false, error: 'Failed to get reviews' });
  }
};
