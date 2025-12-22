import { Response } from 'express';
import supabase from '../lib/supabase';
import { AuthRequest } from '../types';
import { getPagination, createPaginationResponse } from '../utils/helpers';

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page, limit, skip } = getPagination(req);
    const { unreadOnly } = req.query;

    let query = supabase
      .from('Notification')
      .select('*', { count: 'exact' })
      .eq('userId', req.user!.userId)
      .order('createdAt', { ascending: false })
      .range(skip, skip + limit - 1);

    if (unreadOnly === 'true') query = query.eq('isRead', false);

    const { data: notifications, count, error } = await query;
    if (error) throw error;

    res.json({
      success: true,
      data: notifications,
      pagination: createPaginationResponse(page, limit, count || 0),
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, error: 'Failed to get notifications' });
  }
};

export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { count, error } = await supabase
      .from('Notification')
      .select('*', { count: 'exact', head: true })
      .eq('userId', req.user!.userId)
      .eq('isRead', false);

    if (error) throw error;

    res.json({ success: true, data: { count: count || 0 } });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ success: false, error: 'Failed to get unread count' });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('Notification')
      .update({ isRead: true })
      .eq('id', id)
      .eq('userId', req.user!.userId);

    if (error) throw error;

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ success: false, error: 'Failed to mark as read' });
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { error } = await supabase
      .from('Notification')
      .update({ isRead: true })
      .eq('userId', req.user!.userId)
      .eq('isRead', false);

    if (error) throw error;

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ success: false, error: 'Failed to mark all as read' });
  }
};

export const deleteNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('Notification')
      .delete()
      .eq('id', id)
      .eq('userId', req.user!.userId);

    if (error) throw error;

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete notification' });
  }
};
