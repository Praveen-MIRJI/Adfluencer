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
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/Spinner';
import ActionBanner from '../../components/ActionBanner';

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
  const displayName = profile?.displayName || user?.email?.split('@')[0] || 'Creator';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

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
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden box-border">
      {/* Action Banner */}
      <ActionBanner />

      {/* Welcome Header Card */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-800 to-slate-700 rounded-2xl p-3 sm:p-4 lg:p-6 text-white overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4 lg:gap-6">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-slate-400 text-xs sm:text-sm mb-2">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="truncate">{format(new Date(), 'EEEE, d MMMM yyyy')}</span>
            </div>
            <h1 className="text-lg sm:text-xl lg:text-3xl font-bold mb-1 truncate">
              {getGreeting()}, {displayName}! 👋
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm lg:text-base truncate">Here's what's happening with your campaigns today.</p>
          </div>
          <div className="flex gap-2 sm:gap-3 lg:gap-4 flex-shrink-0">
            <div className="bg-slate-700/50 backdrop-blur rounded-xl px-2 sm:px-3 lg:px-6 py-2 sm:py-3 lg:py-4 text-center flex-1 min-w-0">
              <p className="text-lg sm:text-xl lg:text-3xl font-bold">{stats?.activeBids || 0}</p>
              <p className="text-slate-400 text-[10px] sm:text-xs lg:text-sm truncate">Active Bids</p>
            </div>
            <div className="bg-slate-700/50 backdrop-blur rounded-xl px-2 sm:px-3 lg:px-6 py-2 sm:py-3 lg:py-4 text-center flex-1 min-w-0">
              <p className="text-lg sm:text-xl lg:text-3xl font-bold">{stats?.shortlistedBids || 0}</p>
              <p className="text-slate-400 text-[10px] sm:text-xs lg:text-sm truncate">Shortlisted</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
        <Card>
          <CardContent className="p-2 sm:p-3 lg:p-4">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-slate-300" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">{stats?.totalBids || 0}</p>
                <p className="text-[10px] sm:text-xs lg:text-sm text-slate-400 truncate">Total Bids</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 sm:p-3 lg:p-4">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">{stats?.activeBids || 0}</p>
                <p className="text-[10px] sm:text-xs lg:text-sm text-slate-400 truncate">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 sm:p-3 lg:p-4">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-yellow-400" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">{stats?.shortlistedBids || 0}</p>
                <p className="text-[10px] sm:text-xs lg:text-sm text-slate-400 truncate">Shortlisted</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 sm:p-3 lg:p-4">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-green-400" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">{stats?.acceptedBids || 0}</p>
                <p className="text-[10px] sm:text-xs lg:text-sm text-slate-400 truncate">Won</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 w-full min-w-0">
        {/* Recent Bids - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-4 lg:space-y-6 min-w-0">
          {/* Profile Completeness Alert */}
          {completeness < 80 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 rounded-lg">
                    <User className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="font-medium text-amber-200">Complete your profile</p>
                    <p className="text-sm text-amber-300/70">
                      Profiles with complete info get 3x more responses
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-center sm:text-right">
                    <p className="text-xl lg:text-2xl font-bold text-amber-200">{completeness}%</p>
                    <p className="text-xs text-amber-400">complete</p>
                  </div>
                  <Link to="/influencer/profile">
                    <Button size="sm">Complete</Button>
                  </Link>
                </div>
              </div>
              <div className="mt-3 h-2 bg-amber-500/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{ width: `${completeness}%` }}
                />
              </div>
            </div>
          )}

          {/* Recent Bids */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-white truncate">Your Recent Bids</h2>
              <Link to="/influencer/my-bids" className="text-xs sm:text-sm text-slate-400 hover:text-white flex items-center gap-1 flex-shrink-0">
                View All <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {recentBids.length === 0 ? (
                <div className="p-6 text-center">
                  <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 mb-4">No bids yet</p>
                  <Link to="/influencer/browse">
                    <Button size="sm">Browse Campaigns</Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-700">
                  {recentBids.map((bid) => (
                    <div
                      key={bid.id}
                      className="flex items-start justify-between p-4 hover:bg-slate-700/50 transition-colors gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-medium text-white truncate">
                            {bid.advertisement?.title || 'Campaign'}
                          </p>
                          {getBidStatusBadge(bid.status)}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-slate-400">
                          <span className="flex items-center gap-1 flex-shrink-0">
                            <DollarSign className="w-3 h-3" />
                            ${bid.proposedPrice}
                          </span>
                          <span className="flex items-center gap-1 flex-shrink-0">
                            <Calendar className="w-3 h-3" />
                            {bid.deliveryDays} days
                          </span>
                          <span className="truncate">
                            {bid.advertisement?.client?.clientProfile?.companyName || 'Client'}
                          </span>
                        </div>
                      </div>
                      <Link to={`/influencer/ads/${bid.advertisementId}`}>
                        <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white flex-shrink-0">
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
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-white truncate">Recommended for You</h2>
              <Link to="/influencer/browse" className="text-xs sm:text-sm text-slate-400 hover:text-white flex items-center gap-1 flex-shrink-0">
                Browse All <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </Link>
            </CardHeader>
            <CardContent>
              {recommendedAds.length === 0 ? (
                <p className="text-slate-400 text-center py-4 text-sm">No campaigns available right now</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {recommendedAds.map((ad) => (
                    <Link
                      key={ad.id}
                      to={`/influencer/ads/${ad.id}`}
                      className="block p-4 bg-slate-700/50 border border-slate-600 rounded-lg hover:border-rose-500/50 hover:bg-slate-700 transition-all"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="info">{ad.platform}</Badge>
                        <Badge variant="secondary">{ad.contentType}</Badge>
                      </div>
                      <h3 className="font-medium text-white mb-1 line-clamp-1">{ad.title}</h3>
                      <p className="text-sm text-slate-400 mb-2">
                        {ad.client?.clientProfile?.companyName || 'Client'}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-400 font-medium">
                          ${ad.budgetMin} - ${ad.budgetMax}
                        </span>
                        <span className="text-slate-500">
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
        <div className="space-y-3 sm:space-y-4 lg:space-y-6 min-w-0">
          {/* Quick Actions */}
          <Card>
            <CardHeader className="p-3 sm:p-4">
              <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-white">Quick Actions</h2>
            </CardHeader>
            <CardContent className="space-y-2 p-3 sm:p-4 pt-0 sm:pt-0">
              <Link
                to="/influencer/browse"
                className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-rose-600 hover:bg-rose-500 transition-colors"
              >
                <div className="p-1.5 sm:p-2 bg-rose-500 rounded-lg flex-shrink-0">
                  <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-white text-xs sm:text-sm lg:text-base truncate">Find Work</p>
                  <p className="text-[10px] sm:text-xs text-rose-200 truncate">Browse campaigns</p>
                </div>
              </Link>
              <Link
                to="/influencer/portfolio"
                className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <div className="p-1.5 sm:p-2 bg-slate-700 rounded-lg flex-shrink-0">
                  <Image className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-300" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-white text-xs sm:text-sm lg:text-base truncate">Portfolio</p>
                  <p className="text-[10px] sm:text-xs text-slate-400 truncate">Showcase work</p>
                </div>
              </Link>
              <Link
                to="/influencer/saved"
                className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <div className="p-1.5 sm:p-2 bg-slate-700 rounded-lg flex-shrink-0">
                  <Bookmark className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-300" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-white text-xs sm:text-sm lg:text-base truncate">Saved Ads</p>
                  <p className="text-[10px] sm:text-xs text-slate-400 truncate">View later</p>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Your Stats */}
          <Card>
            <CardHeader className="p-3 sm:p-4">
              <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-white">Your Profile Stats</h2>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 pt-0 sm:pt-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 flex-shrink-0" />
                  <span className="text-[10px] sm:text-xs lg:text-sm text-slate-400 truncate">Rating</span>
                </div>
                <span className="font-semibold text-white text-[10px] sm:text-xs lg:text-sm flex-shrink-0">
                  {profile?.averageRating?.toFixed(1) || '0.0'} ({profile?.totalReviews || 0})
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
                  <span className="text-[10px] sm:text-xs lg:text-sm text-slate-400 truncate">Completed</span>
                </div>
                <span className="font-semibold text-white text-[10px] sm:text-xs lg:text-sm flex-shrink-0">{profile?.completedCampaigns || 0} campaigns</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 flex-shrink-0" />
                  <span className="text-[10px] sm:text-xs lg:text-sm text-slate-400 truncate">Success Rate</span>
                </div>
                <span className="font-semibold text-white text-[10px] sm:text-xs lg:text-sm flex-shrink-0">
                  {stats?.totalBids ? Math.round((stats.acceptedBids / stats.totalBids) * 100) : 0}%
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 flex-shrink-0" />
                  <span className="text-[10px] sm:text-xs lg:text-sm text-slate-400 truncate">Engagement</span>
                </div>
                <span className="font-semibold text-white text-[10px] sm:text-xs lg:text-sm flex-shrink-0">{profile?.engagementRate?.toFixed(1) || '0'}%</span>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader className="p-3 sm:p-4">
              <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-white">Pro Tips</h2>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-start gap-1.5 sm:gap-2">
                  <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] sm:text-xs lg:text-sm text-slate-300">Write personalized proposals for each campaign</p>
                </div>
                <div className="flex items-start gap-1.5 sm:gap-2">
                  <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] sm:text-xs lg:text-sm text-slate-300">Keep your portfolio updated with recent work</p>
                </div>
                <div className="flex items-start gap-1.5 sm:gap-2">
                  <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] sm:text-xs lg:text-sm text-slate-300">Respond to messages within 24 hours</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
