import { Response } from 'express';
import supabase from '../lib/supabase';
import { AuthRequest, UserStatus, AdStatus } from '../types';
import { getPagination, createPaginationResponse } from '../utils/helpers';

// Enhanced Admin Stats with more metrics
export const getEnhancedStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [
      { count: totalUsers },
      { count: totalClients },
      { count: totalInfluencers },
      { count: pendingUsers },
      { count: activeUsers },
      { count: blockedUsers },
      { count: totalAds },
      { count: openAds },
      { count: closedAds },
      { count: pendingAds },
      { count: totalBids },
      { count: pendingBids },
      { count: acceptedBids },
      { count: totalContracts },
      { count: activeContracts },
      { count: completedContracts },
      { count: totalReviews },
      { count: totalCategories },
      { count: totalMessages },
    ] = await Promise.all([
      supabase.from('User').select('*', { count: 'exact', head: true }),
      supabase.from('User').select('*', { count: 'exact', head: true }).eq('role', 'CLIENT'),
      supabase.from('User').select('*', { count: 'exact', head: true }).eq('role', 'INFLUENCER'),
      supabase.from('User').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
      supabase.from('User').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
      supabase.from('User').select('*', { count: 'exact', head: true }).eq('status', 'BLOCKED'),
      supabase.from('Advertisement').select('*', { count: 'exact', head: true }),
      supabase.from('Advertisement').select('*', { count: 'exact', head: true }).eq('status', 'OPEN'),
      supabase.from('Advertisement').select('*', { count: 'exact', head: true }).eq('status', 'CLOSED'),
      supabase.from('Advertisement').select('*', { count: 'exact', head: true }).eq('status', 'PENDING_APPROVAL'),
      supabase.from('Bid').select('*', { count: 'exact', head: true }),
      supabase.from('Bid').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
      supabase.from('Bid').select('*', { count: 'exact', head: true }).eq('status', 'ACCEPTED'),
      supabase.from('Contract').select('*', { count: 'exact', head: true }),
      supabase.from('Contract').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
      supabase.from('Contract').select('*', { count: 'exact', head: true }).eq('status', 'COMPLETED'),
      supabase.from('Review').select('*', { count: 'exact', head: true }),
      supabase.from('Category').select('*', { count: 'exact', head: true }),
      supabase.from('Message').select('*', { count: 'exact', head: true }),
    ]);

    // Get total revenue from completed contracts
    const { data: contracts } = await supabase.from('Contract').select('agreedPrice').eq('status', 'COMPLETED');
    const totalRevenue = contracts?.reduce((sum, c) => sum + (c.agreedPrice || 0), 0) || 0;

    // Get recent activity
    const { data: recentUsers } = await supabase.from('User').select('id, email, role, status, createdAt').order('createdAt', { ascending: false }).limit(5);
    const { data: recentAds } = await supabase.from('Advertisement').select('id, title, status, createdAt').order('createdAt', { ascending: false }).limit(5);

    res.json({
      success: true,
      data: {
        users: { total: totalUsers || 0, clients: totalClients || 0, influencers: totalInfluencers || 0, pending: pendingUsers || 0, active: activeUsers || 0, blocked: blockedUsers || 0 },
        advertisements: { total: totalAds || 0, open: openAds || 0, closed: closedAds || 0, pending: pendingAds || 0 },
        bids: { total: totalBids || 0, pending: pendingBids || 0, accepted: acceptedBids || 0 },
        contracts: { total: totalContracts || 0, active: activeContracts || 0, completed: completedContracts || 0 },
        reviews: totalReviews || 0,
        categories: totalCategories || 0,
        messages: totalMessages || 0,
        revenue: totalRevenue,
        recentUsers: recentUsers || [],
        recentAds: recentAds || [],
      },
    });
  } catch (error) {
    console.error('Get enhanced stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to get stats' });
  }
};

// Get all contracts for admin
export const getContracts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page, limit, skip } = getPagination(req);
    const { status } = req.query;

    let query = supabase
      .from('Contract')
      .select(`*, client:User!Contract_clientId_fkey(email, clientProfile:ClientProfile(companyName)), influencer:User!Contract_influencerId_fkey(email, influencerProfile:InfluencerProfile(displayName)), advertisement:Advertisement(title)`, { count: 'exact' })
      .order('createdAt', { ascending: false })
      .range(skip, skip + limit - 1);

    if (status) query = query.eq('status', status as string);

    const { data: contracts, count, error } = await query;
    if (error) throw error;

    res.json({ success: true, data: contracts, pagination: createPaginationResponse(page, limit, count || 0) });
  } catch (error) {
    console.error('Get contracts error:', error);
    res.status(500).json({ success: false, error: 'Failed to get contracts' });
  }
};

// Get all bids for admin
export const getBids = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page, limit, skip } = getPagination(req);
    const { status } = req.query;

    let query = supabase
      .from('Bid')
      .select(`*, influencer:User!Bid_influencerId_fkey(email, influencerProfile:InfluencerProfile(displayName)), advertisement:Advertisement(title, client:User(email, clientProfile:ClientProfile(companyName)))`, { count: 'exact' })
      .order('createdAt', { ascending: false })
      .range(skip, skip + limit - 1);

    if (status) query = query.eq('status', status as string);

    const { data: bids, count, error } = await query;
    if (error) throw error;

    res.json({ success: true, data: bids, pagination: createPaginationResponse(page, limit, count || 0) });
  } catch (error) {
    console.error('Get bids error:', error);
    res.status(500).json({ success: false, error: 'Failed to get bids' });
  }
};

// Get all reviews for admin
export const getReviews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page, limit, skip } = getPagination(req);

    const { data: reviews, count, error } = await supabase
      .from('Review')
      .select(`*, client:User!Review_clientId_fkey(email, clientProfile:ClientProfile(companyName)), influencer:User!Review_influencerId_fkey(email, influencerProfile:InfluencerProfile(displayName)), advertisement:Advertisement(title)`, { count: 'exact' })
      .order('createdAt', { ascending: false })
      .range(skip, skip + limit - 1);

    if (error) throw error;

    res.json({ success: true, data: reviews, pagination: createPaginationResponse(page, limit, count || 0) });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ success: false, error: 'Failed to get reviews' });
  }
};

// Delete review (moderation)
export const deleteReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('Review').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete review' });
  }
};

// Categories CRUD
export const getCategories = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data: categories, error } = await supabase.from('Category').select('*').order('name');
    if (error) throw error;

    // Get ad count per category
    const categoriesWithCount = await Promise.all(
      (categories || []).map(async (cat) => {
        const { count } = await supabase.from('Advertisement').select('*', { count: 'exact', head: true }).eq('categoryId', cat.id);
        return { ...cat, adCount: count || 0 };
      })
    );

    res.json({ success: true, data: categoriesWithCount });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, error: 'Failed to get categories' });
  }
};

export const createCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    const slug = name.toLowerCase().replace(/\s+/g, '-');

    const { data: category, error } = await supabase
      .from('Category')
      .insert({ name, slug, description, isActive: true })
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data: category });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ success: false, error: 'Failed to create category' });
  }
};

export const updateCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;
    const slug = name ? name.toLowerCase().replace(/\s+/g, '-') : undefined;

    const { data: category, error } = await supabase
      .from('Category')
      .update({ name, slug, description, isActive, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data: category });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ success: false, error: 'Failed to update category' });
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Check if category has ads
    const { count } = await supabase.from('Advertisement').select('*', { count: 'exact', head: true }).eq('categoryId', id);
    if (count && count > 0) {
      res.status(400).json({ success: false, error: 'Cannot delete category with existing advertisements' });
      return;
    }

    const { error } = await supabase.from('Category').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete category' });
  }
};

// Get user details with full profile
export const getUserDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: user, error } = await supabase
      .from('User')
      .select(`*, clientProfile:ClientProfile(*), influencerProfile:InfluencerProfile(*)`)
      .eq('id', id)
      .single();

    if (error) throw error;

    // Get user's activity stats
    let stats: any = {};
    if (user.role === 'CLIENT') {
      const [{ count: adsCount }, { count: contractsCount }] = await Promise.all([
        supabase.from('Advertisement').select('*', { count: 'exact', head: true }).eq('clientId', id),
        supabase.from('Contract').select('*', { count: 'exact', head: true }).eq('clientId', id),
      ]);
      stats = { advertisements: adsCount || 0, contracts: contractsCount || 0 };
    } else if (user.role === 'INFLUENCER') {
      const [{ count: bidsCount }, { count: contractsCount }, { count: reviewsCount }] = await Promise.all([
        supabase.from('Bid').select('*', { count: 'exact', head: true }).eq('influencerId', id),
        supabase.from('Contract').select('*', { count: 'exact', head: true }).eq('influencerId', id),
        supabase.from('Review').select('*', { count: 'exact', head: true }).eq('influencerId', id),
      ]);
      stats = { bids: bidsCount || 0, contracts: contractsCount || 0, reviews: reviewsCount || 0 };
    }

    res.json({ success: true, data: { ...user, stats } });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ success: false, error: 'Failed to get user details' });
  }
};

// Delete user (soft delete by blocking)
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Don't allow deleting admins
    const { data: user } = await supabase.from('User').select('role').eq('id', id).single();
    if (user?.role === 'ADMIN') {
      res.status(400).json({ success: false, error: 'Cannot delete admin users' });
      return;
    }

    const { error } = await supabase.from('User').update({ status: 'BLOCKED' as UserStatus }).eq('id', id);
    if (error) throw error;

    res.json({ success: true, message: 'User blocked successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
};

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

// Analytics Chart Data for Dashboard Visualizations
export const getAnalyticsChartData = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get date range for last 12 months
    const now = new Date();
    const months: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(date.toISOString().slice(0, 7)); // YYYY-MM format
    }

    // Fetch all required data in parallel
    const [
      { data: allUsers },
      { data: allAds },
      { data: allBids },
      { data: allContracts },
      { data: allCategories },
      { data: allReviews },
    ] = await Promise.all([
      supabase.from('User').select('id, role, status, createdAt'),
      supabase.from('Advertisement').select('id, platform, status, categoryId, budgetMin, budgetMax, createdAt'),
      supabase.from('Bid').select('id, status, proposedPrice, createdAt'),
      supabase.from('Contract').select('id, status, agreedPrice, createdAt, completedAt'),
      supabase.from('Category').select('id, name'),
      supabase.from('Review').select('id, rating, createdAt'),
    ]);

    // 1. Monthly Growth Trends (Users, Ads, Bids, Revenue)
    const monthlyData = months.map(month => {
      const usersInMonth = (allUsers || []).filter(u => u.createdAt?.startsWith(month)).length;
      const adsInMonth = (allAds || []).filter(a => a.createdAt?.startsWith(month)).length;
      const bidsInMonth = (allBids || []).filter(b => b.createdAt?.startsWith(month)).length;
      const contractsInMonth = (allContracts || []).filter(c => c.completedAt?.startsWith(month));
      const revenueInMonth = contractsInMonth.reduce((sum, c) => sum + (c.agreedPrice || 0), 0);
      
      return {
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
        fullMonth: month,
        users: usersInMonth,
        advertisements: adsInMonth,
        bids: bidsInMonth,
        revenue: revenueInMonth,
      };
    });

    // 2. User Distribution by Role
    const usersByRole = [
      { name: 'Clients', value: (allUsers || []).filter(u => u.role === 'CLIENT').length, color: '#3b82f6' },
      { name: 'Influencers', value: (allUsers || []).filter(u => u.role === 'INFLUENCER').length, color: '#8b5cf6' },
      { name: 'Admins', value: (allUsers || []).filter(u => u.role === 'ADMIN').length, color: '#f43f5e' },
    ];

    // 3. User Status Distribution
    const usersByStatus = [
      { name: 'Active', value: (allUsers || []).filter(u => u.status === 'ACTIVE').length, color: '#10b981' },
      { name: 'Pending', value: (allUsers || []).filter(u => u.status === 'PENDING').length, color: '#f59e0b' },
      { name: 'Blocked', value: (allUsers || []).filter(u => u.status === 'BLOCKED').length, color: '#ef4444' },
    ];

    // 4. Advertisements by Platform
    const platforms = ['INSTAGRAM', 'YOUTUBE', 'TWITTER', 'TIKTOK', 'FACEBOOK', 'LINKEDIN'];
    const platformColors: Record<string, string> = {
      INSTAGRAM: '#E1306C',
      YOUTUBE: '#FF0000',
      TWITTER: '#1DA1F2',
      TIKTOK: '#00F2EA',
      FACEBOOK: '#4267B2',
      LINKEDIN: '#0077B5',
    };
    const adsByPlatform = platforms.map(platform => ({
      name: platform.charAt(0) + platform.slice(1).toLowerCase(),
      value: (allAds || []).filter(a => a.platform === platform).length,
      color: platformColors[platform],
    })).filter(p => p.value > 0);

    // 5. Advertisements by Status
    const adsByStatus = [
      { name: 'Open', value: (allAds || []).filter(a => a.status === 'OPEN').length, color: '#10b981' },
      { name: 'Closed', value: (allAds || []).filter(a => a.status === 'CLOSED').length, color: '#6b7280' },
      { name: 'Pending', value: (allAds || []).filter(a => a.status === 'PENDING_APPROVAL').length, color: '#f59e0b' },
      { name: 'Rejected', value: (allAds || []).filter(a => a.status === 'REJECTED').length, color: '#ef4444' },
    ];

    // 6. Bids by Status
    const bidsByStatus = [
      { name: 'Pending', value: (allBids || []).filter(b => b.status === 'PENDING').length, color: '#f59e0b' },
      { name: 'Shortlisted', value: (allBids || []).filter(b => b.status === 'SHORTLISTED').length, color: '#3b82f6' },
      { name: 'Accepted', value: (allBids || []).filter(b => b.status === 'ACCEPTED').length, color: '#10b981' },
      { name: 'Rejected', value: (allBids || []).filter(b => b.status === 'REJECTED').length, color: '#ef4444' },
    ];

    // 7. Contracts by Status
    const contractsByStatus = [
      { name: 'Active', value: (allContracts || []).filter(c => c.status === 'ACTIVE').length, color: '#3b82f6' },
      { name: 'Completed', value: (allContracts || []).filter(c => c.status === 'COMPLETED').length, color: '#10b981' },
      { name: 'Cancelled', value: (allContracts || []).filter(c => c.status === 'CANCELLED').length, color: '#6b7280' },
      { name: 'Disputed', value: (allContracts || []).filter(c => c.status === 'DISPUTED').length, color: '#ef4444' },
    ];

    // 8. Ads by Category
    const adsByCategory = (allCategories || []).map(cat => ({
      name: cat.name,
      value: (allAds || []).filter(a => a.categoryId === cat.id).length,
    })).filter(c => c.value > 0).sort((a, b) => b.value - a.value).slice(0, 8);

    // 9. Budget Distribution
    const budgetRanges = [
      { range: '$0-500', min: 0, max: 500 },
      { range: '$500-1K', min: 500, max: 1000 },
      { range: '$1K-5K', min: 1000, max: 5000 },
      { range: '$5K-10K', min: 5000, max: 10000 },
      { range: '$10K+', min: 10000, max: Infinity },
    ];
    const adsByBudget = budgetRanges.map(range => ({
      range: range.range,
      count: (allAds || []).filter(a => {
        const avgBudget = ((a.budgetMin || 0) + (a.budgetMax || 0)) / 2;
        return avgBudget >= range.min && avgBudget < range.max;
      }).length,
    }));

    // 10. Rating Distribution
    const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
      rating: `${rating} Stars`,
      count: (allReviews || []).filter(r => Math.floor(r.rating) === rating).length,
    }));

    // 11. Average Rating
    const avgRating = (allReviews || []).length > 0
      ? (allReviews || []).reduce((sum, r) => sum + r.rating, 0) / (allReviews || []).length
      : 0;

    // 12. Key Metrics Summary
    const totalRevenue = (allContracts || [])
      .filter(c => c.status === 'COMPLETED')
      .reduce((sum, c) => sum + (c.agreedPrice || 0), 0);
    
    const successRate = (allBids || []).length > 0
      ? ((allBids || []).filter(b => b.status === 'ACCEPTED').length / (allBids || []).length) * 100
      : 0;

    const avgContractValue = (allContracts || []).length > 0
      ? totalRevenue / (allContracts || []).filter(c => c.status === 'COMPLETED').length
      : 0;

    res.json({
      success: true,
      data: {
        monthlyTrends: monthlyData,
        usersByRole,
        usersByStatus,
        adsByPlatform,
        adsByStatus,
        bidsByStatus,
        contractsByStatus,
        adsByCategory,
        adsByBudget,
        ratingDistribution,
        summary: {
          totalUsers: (allUsers || []).length,
          totalAds: (allAds || []).length,
          totalBids: (allBids || []).length,
          totalContracts: (allContracts || []).length,
          totalRevenue,
          avgRating: avgRating.toFixed(1),
          successRate: successRate.toFixed(1),
          avgContractValue: avgContractValue.toFixed(0),
        },
      },
    });
  } catch (error) {
    console.error('Get analytics chart data error:', error);
    res.status(500).json({ success: false, error: 'Failed to get analytics data' });
  }
};
