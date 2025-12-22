import { Response } from 'express';
import supabase from '../lib/supabase';
import { AuthRequest } from '../types';
import { getPagination, createPaginationResponse } from '../utils/helpers';

export const getSavedAds = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page, limit, skip } = getPagination(req);

    const { data: savedAds, count, error } = await supabase
      .from('SavedAd')
      .select(`
        *,
        advertisement:Advertisement(
          *,
          category:Category(*),
          client:User(clientProfile:ClientProfile(companyName, avatar))
        )
      `, { count: 'exact' })
      .eq('userId', req.user!.userId)
      .order('createdAt', { ascending: false })
      .range(skip, skip + limit - 1);

    if (error) throw error;

    res.json({
      success: true,
      data: savedAds,
      pagination: createPaginationResponse(page, limit, count || 0),
    });
  } catch (error) {
    console.error('Get saved ads error:', error);
    res.status(500).json({ success: false, error: 'Failed to get saved ads' });
  }
};

export const saveAd = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { advertisementId } = req.body;

    const { data: existing } = await supabase
      .from('SavedAd')
      .select('id')
      .eq('userId', req.user!.userId)
      .eq('advertisementId', advertisementId)
      .single();

    if (existing) {
      res.status(400).json({ success: false, error: 'Advertisement already saved' });
      return;
    }

    const { data: savedAd, error } = await supabase
      .from('SavedAd')
      .insert({
        userId: req.user!.userId,
        advertisementId,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data: savedAd });
  } catch (error) {
    console.error('Save ad error:', error);
    res.status(500).json({ success: false, error: 'Failed to save advertisement' });
  }
};

export const unsaveAd = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { advertisementId } = req.params;

    const { data, error } = await supabase
      .from('SavedAd')
      .delete()
      .eq('userId', req.user!.userId)
      .eq('advertisementId', advertisementId)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      res.status(404).json({ success: false, error: 'Saved ad not found' });
      return;
    }

    res.json({ success: true, message: 'Advertisement unsaved' });
  } catch (error) {
    console.error('Unsave ad error:', error);
    res.status(500).json({ success: false, error: 'Failed to unsave advertisement' });
  }
};

export const checkSaved = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { advertisementId } = req.params;

    const { data } = await supabase
      .from('SavedAd')
      .select('id')
      .eq('userId', req.user!.userId)
      .eq('advertisementId', advertisementId)
      .single();

    res.json({ success: true, data: { isSaved: !!data } });
  } catch (error) {
    console.error('Check saved error:', error);
    res.status(500).json({ success: false, error: 'Failed to check saved status' });
  }
};
