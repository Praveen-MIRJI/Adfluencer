import { Router, Request, Response } from 'express';
import supabase from '../lib/supabase';

const router = Router();

// Public landing page data - no authentication required
router.get('/landing-data', async (req: Request, res: Response): Promise<void> => {
    try {
        // Fetch all data in parallel for performance
        const [
            { count: totalUsers },
            { count: totalInfluencers },
            { count: totalClients },
            { count: totalAds },
            { count: completedContracts },
            { data: featuredAds },
            { data: topInfluencers },
            { data: recentReviews },
            { data: categories },
            { data: contracts },
        ] = await Promise.all([
            supabase.from('User').select('*', { count: 'exact', head: true }),
            supabase.from('User').select('*', { count: 'exact', head: true }).eq('role', 'INFLUENCER').eq('status', 'ACTIVE'),
            supabase.from('User').select('*', { count: 'exact', head: true }).eq('role', 'CLIENT').eq('status', 'ACTIVE'),
            supabase.from('Advertisement').select('*', { count: 'exact', head: true }),
            supabase.from('Contract').select('*', { count: 'exact', head: true }).eq('status', 'COMPLETED'),
            // Featured ads for carousel - open ads with images
            supabase
                .from('Advertisement')
                .select('id, title, description, platform, budgetMin, budgetMax, imageUrl, category:Category(name, slug), client:User(clientProfile:ClientProfile(companyName, avatar))')
                .eq('status', 'OPEN')
                .not('imageUrl', 'is', null)
                .order('createdAt', { ascending: false })
                .limit(10),
            // Top influencers with profiles
            supabase
                .from('InfluencerProfile')
                .select('id, displayName, avatar, primaryNiche, followerCount, engagementRate, userId, user:User!InfluencerProfile_userId_fkey(email, status)')
                .eq('user.status', 'ACTIVE')
                .order('followerCount', { ascending: false })
                .limit(8),
            // Recent reviews for testimonials
            supabase
                .from('Review')
                .select('id, rating, comment, createdAt, client:User!Review_clientId_fkey(email, clientProfile:ClientProfile(companyName, avatar)), influencer:User!Review_influencerId_fkey(influencerProfile:InfluencerProfile(displayName, avatar))')
                .gte('rating', 4)
                .order('createdAt', { ascending: false })
                .limit(6),
            // Categories for showcase
            supabase.from('Category').select('id, name, slug').eq('isActive', true).order('name'),
            // Completed contracts for revenue calculation
            supabase.from('Contract').select('agreedPrice').eq('status', 'COMPLETED'),
        ]);

        // Calculate total revenue
        const totalRevenue = contracts?.reduce((sum, c) => sum + (c.agreedPrice || 0), 0) || 0;

        // Get ads without images as fallback
        let heroAds = featuredAds || [];
        if (heroAds.length < 3) {
            const { data: moreAds } = await supabase
                .from('Advertisement')
                .select('id, title, description, platform, budgetMin, budgetMax, imageUrl, category:Category(name, slug), client:User(clientProfile:ClientProfile(companyName, avatar))')
                .eq('status', 'OPEN')
                .order('createdAt', { ascending: false })
                .limit(10);
            heroAds = moreAds || [];
        }

        res.json({
            success: true,
            data: {
                stats: {
                    totalUsers: totalUsers || 0,
                    totalInfluencers: totalInfluencers || 0,
                    totalClients: totalClients || 0,
                    totalCampaigns: totalAds || 0,
                    completedCampaigns: completedContracts || 0,
                    totalRevenue: totalRevenue,
                },
                heroAds: heroAds,
                topInfluencers: topInfluencers?.filter(i => {
                    const user = i.user as any;
                    return (Array.isArray(user) ? user[0]?.status : user?.status) === 'ACTIVE';
                }) || [],
                testimonials: recentReviews || [],
                categories: categories || [],
            },
        });
    } catch (error) {
        console.error('Get landing data error:', error);
        res.status(500).json({ success: false, error: 'Failed to get landing data' });
    }
});

// Public categories list
router.get('/categories', async (req: Request, res: Response): Promise<void> => {
    try {
        const { data: categories, error } = await supabase
            .from('Category')
            .select('id, name, slug')
            .eq('isActive', true)
            .order('name');

        if (error) throw error;
        res.json({ success: true, data: categories });
    } catch (error) {
        console.error('Get public categories error:', error);
        res.status(500).json({ success: false, error: 'Failed to get categories' });
    }
});

export default router;
