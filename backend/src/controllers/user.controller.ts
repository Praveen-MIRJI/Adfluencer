import { Response } from 'express';
import supabase from '../lib/supabase';
import { AuthRequest } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const uploadAvatar = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { fileData, fileType, oldAvatarUrl } = req.body;

    if (!fileData || !fileType) {
      res.status(400).json({ success: false, error: 'File data and type are required' });
      return;
    }

    // Delete old avatar if exists
    if (oldAvatarUrl) {
      try {
        const oldPath = oldAvatarUrl.split('/avatars/')[1];
        if (oldPath) {
          await supabase.storage.from('avatars').remove([oldPath]);
        }
      } catch (err) {
        console.log('Failed to delete old avatar:', err);
      }
    }

    // Convert base64 to buffer
    const base64Data = fileData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Generate unique filename
    const ext = fileType.split('/')[1] || 'jpg';
    const fileName = `${userId}/${uuidv4()}.${ext}`;

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, buffer, {
        contentType: fileType,
        upsert: true,
      });

    if (error) {
      console.error('Upload error:', error);
      res.status(500).json({ success: false, error: 'Failed to upload image' });
      return;
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);

    res.json({ success: true, data: { url: urlData.publicUrl } });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ success: false, error: 'Failed to upload avatar' });
  }
};

export const getClientProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data: profile } = await supabase
      .from('ClientProfile')
      .select('*')
      .eq('userId', req.user!.userId)
      .single();

    res.json({ success: true, data: profile });
  } catch (error) {
    console.error('Get client profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to get profile' });
  }
};

export const updateClientProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { companyName, industry, website, phone, avatar, description } = req.body;

    const { data: existing } = await supabase
      .from('ClientProfile')
      .select('id')
      .eq('userId', req.user!.userId)
      .single();

    let profile;
    if (existing) {
      const { data } = await supabase
        .from('ClientProfile')
        .update({ companyName, industry, website, phone, avatar, description, updatedAt: new Date().toISOString() })
        .eq('userId', req.user!.userId)
        .select()
        .single();
      profile = data;
    } else {
      const { data } = await supabase
        .from('ClientProfile')
        .insert({ userId: req.user!.userId, companyName, industry, website, phone, avatar, description })
        .select()
        .single();
      profile = data;
    }

    res.json({ success: true, data: profile });
  } catch (error) {
    console.error('Update client profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
};

export const getInfluencerProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data: profile } = await supabase
      .from('InfluencerProfile')
      .select('*')
      .eq('userId', req.user!.userId)
      .single();

    res.json({ success: true, data: profile });
  } catch (error) {
    console.error('Get influencer profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to get profile' });
  }
};

export const updateInfluencerProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      displayName, bio, avatar, primaryNiche, secondaryNiches,
      instagramHandle, instagramFollowers, youtubeHandle, youtubeSubscribers,
      twitterHandle, twitterFollowers, tiktokHandle, tiktokFollowers,
      engagementRate, portfolioUrls,
    } = req.body;

    const { data: existing } = await supabase
      .from('InfluencerProfile')
      .select('id')
      .eq('userId', req.user!.userId)
      .single();

    const profileData = {
      displayName, bio, avatar, primaryNiche, secondaryNiches,
      instagramHandle, instagramFollowers, youtubeHandle, youtubeSubscribers,
      twitterHandle, twitterFollowers, tiktokHandle, tiktokFollowers,
      engagementRate, portfolioUrls,
      updatedAt: new Date().toISOString(),
    };

    let profile;
    if (existing) {
      const { data } = await supabase
        .from('InfluencerProfile')
        .update(profileData)
        .eq('userId', req.user!.userId)
        .select()
        .single();
      profile = data;
    } else {
      const { data } = await supabase
        .from('InfluencerProfile')
        .insert({ ...profileData, userId: req.user!.userId, displayName: displayName || req.user!.email.split('@')[0] })
        .select()
        .single();
      profile = data;
    }

    res.json({ success: true, data: profile });
  } catch (error) {
    console.error('Update influencer profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
};

export const getPublicInfluencerProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: profile } = await supabase
      .from('InfluencerProfile')
      .select('*, user:User(email, createdAt)')
      .eq('userId', id)
      .single();

    if (!profile) {
      res.status(404).json({ success: false, error: 'Profile not found' });
      return;
    }

    res.json({ success: true, data: profile });
  } catch (error) {
    console.error('Get public profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to get profile' });
  }
};

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, role } = req.user!;

    if (role === 'CLIENT') {
      const [{ count: totalAds }, { count: activeAds }, { count: totalBids }] = await Promise.all([
        supabase.from('Advertisement').select('*', { count: 'exact', head: true }).eq('clientId', userId),
        supabase.from('Advertisement').select('*', { count: 'exact', head: true }).eq('clientId', userId).eq('status', 'OPEN'),
        supabase.from('Bid').select('*, advertisement:Advertisement!inner(clientId)', { count: 'exact', head: true }).eq('advertisement.clientId', userId),
      ]);

      res.json({
        success: true,
        data: { totalAds: totalAds || 0, activeAds: activeAds || 0, totalBids: totalBids || 0, closedAds: (totalAds || 0) - (activeAds || 0) },
      });
    } else if (role === 'INFLUENCER') {
      const [{ count: totalBids }, { count: activeBids }, { count: acceptedBids }, { count: shortlistedBids }] = await Promise.all([
        supabase.from('Bid').select('*', { count: 'exact', head: true }).eq('influencerId', userId),
        supabase.from('Bid').select('*', { count: 'exact', head: true }).eq('influencerId', userId).eq('status', 'PENDING'),
        supabase.from('Bid').select('*', { count: 'exact', head: true }).eq('influencerId', userId).eq('status', 'ACCEPTED'),
        supabase.from('Bid').select('*', { count: 'exact', head: true }).eq('influencerId', userId).eq('status', 'SHORTLISTED'),
      ]);

      res.json({
        success: true,
        data: { totalBids: totalBids || 0, activeBids: activeBids || 0, acceptedBids: acceptedBids || 0, shortlistedBids: shortlistedBids || 0 },
      });
    } else {
      const [{ count: totalUsers }, { count: totalAds }, { count: totalBids }, { count: pendingUsers }] = await Promise.all([
        supabase.from('User').select('*', { count: 'exact', head: true }),
        supabase.from('Advertisement').select('*', { count: 'exact', head: true }),
        supabase.from('Bid').select('*', { count: 'exact', head: true }),
        supabase.from('User').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
      ]);

      res.json({
        success: true,
        data: { totalUsers: totalUsers || 0, totalAds: totalAds || 0, totalBids: totalBids || 0, pendingUsers: pendingUsers || 0 },
      });
    }
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to get stats' });
  }
};

// Get general user profile (for VerificationBadge and other components)
export const getUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    // Get user data with profiles
    const { data: user, error: userError } = await supabase
      .from('User')
      .select(`
        id,
        email,
        role,
        isVerified,
        emailVerified,
        phoneVerified,
        createdAt,
        clientProfile:ClientProfile(*),
        influencerProfile:InfluencerProfile(*)
      `)
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user profile:', userError);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user profile'
      });
      return;
    }

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile'
    });
  }
};