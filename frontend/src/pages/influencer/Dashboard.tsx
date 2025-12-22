import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, CheckCircle, Star, TrendingUp, Search, User, ArrowRight,
  DollarSign, Calendar, Bookmark, Image, Award, Target, Zap
} from 'lucide-react';
import { format } from 'date-fns';
import api from '../../lib/api';
import { Advertisement, Bid } from '../../types';
import { useAuthStore } from '../../store/authStore';
import StatsCard from '../../components/ui/StatsCard';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/Spinner';

interface DashboardStats {
  totalBids: number;
  activeBids: number;
  acceptedBids: number;
  shortlistedBids: number;
}

export default function InfluencerDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBids, setRecentBids] = useState<Bid[]>([]);
  const [recommendedAds, setRecommendedAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);

  const profile = user?.influencerProfile;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, bidsRes, adsRes] = await Promise.all([
          api.get('/users/dashboard/stats'),
          api.get('/bids/my-bids?limit=5'),
          api.get('/advertisements?limit=4&status=OPEN'),
        ]);
        setStats(statsRes.data.data);
        setRecentBids(bidsRes.data.data || []);
        setRecommendedAds(adsRes.data.data || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <PageLoader />;

  const getBidStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <Badge variant="warning">Pending</Badge>;
      case 'SHORTLISTED': return <Badge variant="info">Shortlisted</Badge>;
      case 'ACCEPTED': return <Badge variant="success">Accepted</Badge>;
      case 'REJECTED': return <Badge variant="danger">Rejected</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const profileCompleteness = () => {
    if (!profile) return 0;
    let score = 0;
    if (profile.displayName) score += 15;
    if (profile.bio) score += 15;
    if (profile.avatar) score += 10;
    if (profile.primaryNiche) score += 15;
    if (profile.instagramFollowers || profile.youtubeSubscribers || profile.twitterFollowers) score += 20;
    if (profile.engagementRate) score += 15;
    if (profile.portfolioUrls?.length) score += 10;
    return Math.min(score, 100);
  };

  const completeness = profileCompleteness();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {profile?.displayName || 'Creator'}!
          </h1>
          <p className="text-gray-600 mt-1">Here's what's happening with your campaigns.</p>
        </div>
        <Link to="/influencer/browse" className="mt-4 sm:mt-0">
          <Button>
            <Search className="h-4 w-4 mr-2" />
            Find Campaigns
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Bids" value={stats?.totalBids || 0} icon={FileText} />
        <StatsCard title="Active Bids" value={stats?.activeBids || 0} icon={TrendingUp} />
        <StatsCard title="Shortlisted" value={stats?.shortlistedBids || 0} icon={Star} />
        <StatsCard title="Won Campaigns" value={stats?.acceptedBids || 0} icon={CheckCircle} />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Bids - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Completeness Alert */}
          {completeness < 80 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <User className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium text-yellow-900">Complete your profile</p>
                      <p className="text-sm text-yellow-700">
                        Profiles with complete info get 3x more responses
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-yellow-900">{completeness}%</p>
                      <p className="text-xs text-yellow-600">complete</p>
                    </div>
                    <Link to="/influencer/profile">
                      <Button size="sm" variant="secondary">Complete</Button>
                    </Link>
                  </div>
                </div>
                <div className="mt-3 h-2 bg-yellow-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 rounded-full transition-all"
                    style={{ width: `${completeness}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Bids */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <h2 className="text-lg font-semibold">Your Recent Bids</h2>
              <Link to="/influencer/my-bids" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {recentBids.length === 0 ? (
                <div className="p-6 text-center">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">No bids yet</p>
                  <Link to="/influencer/browse">
                    <Button size="sm">Browse Campaigns</Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {recentBids.map((bid) => (
                    <div
                      key={bid.id}
                      className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900 truncate">
                            {bid.advertisement?.title || 'Campaign'}
                          </p>
                          {getBidStatusBadge(bid.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            ${bid.proposedPrice}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {bid.deliveryDays} days
                          </span>
                          <span>
                            {bid.advertisement?.client?.clientProfile?.companyName || 'Client'}
                          </span>
                        </div>
                      </div>
                      <Link to={`/influencer/ads/${bid.advertisementId}`}>
                        <Button size="sm" variant="ghost">
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recommended Campaigns */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <h2 className="text-lg font-semibold">Recommended for You</h2>
              <Link to="/influencer/browse" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
                Browse All <ArrowRight className="w-4 h-4" />
              </Link>
            </CardHeader>
            <CardContent>
              {recommendedAds.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No campaigns available right now</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {recommendedAds.map((ad) => (
                    <Link
                      key={ad.id}
                      to={`/influencer/ads/${ad.id}`}
                      className="block p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="info">{ad.platform}</Badge>
                        <Badge>{ad.contentType}</Badge>
                      </div>
                      <h3 className="font-medium text-gray-900 mb-1 line-clamp-1">{ad.title}</h3>
                      <p className="text-sm text-gray-500 mb-2">
                        {ad.client?.clientProfile?.companyName || 'Client'}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-600 font-medium">
                          ${ad.budgetMin} - ${ad.budgetMax}
                        </span>
                        <span className="text-gray-400">
                          Due {format(new Date(ad.deadline), 'MMM d')}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Quick Actions</h2>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link
                to="/influencer/browse"
                className="flex items-center gap-3 p-3 rounded-lg bg-primary-50 hover:bg-primary-100 transition-colors"
              >
                <div className="p-2 bg-primary-600 rounded-lg">
                  <Search className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-primary-900">Find Work</p>
                  <p className="text-xs text-primary-600">Browse campaigns</p>
                </div>
              </Link>
              <Link
                to="/influencer/portfolio"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Image className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Portfolio</p>
                  <p className="text-xs text-gray-500">Showcase work</p>
                </div>
              </Link>
              <Link
                to="/influencer/saved"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Bookmark className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Saved Ads</p>
                  <p className="text-xs text-gray-500">View later</p>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Your Stats */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Your Profile Stats</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-600">Rating</span>
                </div>
                <span className="font-semibold">
                  {profile?.averageRating?.toFixed(1) || '0.0'} ({profile?.totalReviews || 0})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-600">Completed</span>
                </div>
                <span className="font-semibold">{profile?.completedCampaigns || 0} campaigns</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">Success Rate</span>
                </div>
                <span className="font-semibold">
                  {stats?.totalBids ? Math.round((stats.acceptedBids / stats.totalBids) * 100) : 0}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-500" />
                  <span className="text-sm text-gray-600">Engagement</span>
                </div>
                <span className="font-semibold">{profile?.engagementRate?.toFixed(1) || '0'}%</span>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Pro Tips</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-600">Write personalized proposals for each campaign</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-600">Keep your portfolio updated with recent work</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-600">Respond to messages within 24 hours</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
