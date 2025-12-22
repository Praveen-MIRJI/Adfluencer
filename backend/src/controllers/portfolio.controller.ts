import { Response } from 'express';
import supabase from '../lib/supabase';
import { AuthRequest } from '../types';

export const getMyPortfolio = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data: items, error } = await supabase
      .from('PortfolioItem')
      .select('*')
      .eq('userId', req.user!.userId)
      .order('createdAt', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Get portfolio error:', error);
    res.status(500).json({ success: false, error: 'Failed to get portfolio' });
  }
};

export const getInfluencerPortfolio = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { influencerId } = req.params;

    const { data: items, error } = await supabase
      .from('PortfolioItem')
      .select('*')
      .eq('userId', influencerId)
      .order('createdAt', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Get portfolio error:', error);
    res.status(500).json({ success: false, error: 'Failed to get portfolio' });
  }
};

export const addPortfolioItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, mediaUrl, mediaType, platform, metrics } = req.body;

    const { data: item, error } = await supabase
      .from('PortfolioItem')
      .insert({
        userId: req.user!.userId,
        title,
        description,
        mediaUrl,
        mediaType,
        platform,
        metrics: metrics || null,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data: item });
  } catch (error) {
    console.error('Add portfolio item error:', error);
    res.status(500).json({ success: false, error: 'Failed to add portfolio item' });
  }
};

export const updatePortfolioItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, mediaUrl, mediaType, platform, metrics } = req.body;

    const { data: item, error } = await supabase
      .from('PortfolioItem')
      .update({ title, description, mediaUrl, mediaType, platform, metrics })
      .eq('id', id)
      .eq('userId', req.user!.userId)
      .select()
      .single();

    if (error) throw error;
    if (!item) {
      res.status(404).json({ success: false, error: 'Portfolio item not found' });
      return;
    }

    res.json({ success: true, data: item });
  } catch (error) {
    console.error('Update portfolio item error:', error);
    res.status(500).json({ success: false, error: 'Failed to update portfolio item' });
  }
};

export const deletePortfolioItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('PortfolioItem')
      .delete()
      .eq('id', id)
      .eq('userId', req.user!.userId)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      res.status(404).json({ success: false, error: 'Portfolio item not found' });
      return;
    }

    res.json({ success: true, message: 'Portfolio item deleted' });
  } catch (error) {
    console.error('Delete portfolio item error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete portfolio item' });
  }
};
