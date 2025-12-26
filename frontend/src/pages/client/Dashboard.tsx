import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Megaphone, FileText, Users, Plus, ArrowRight,
  Calendar, DollarSign, CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { Advertisement, Bid } from '../../types';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/Spinner';
import ActionBanner from '../../components/ActionBanner';

interface DashboardStats {
  totalAds: number;
  activeAds: number;
  totalBids: number;
  closedAds: number;
}

export default function ClientDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentAds, setRecentAds] = useState<Advertisement[]>([]);
  const [recentBids, setRecentBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);

  const displayName = user?.clientProfile?.companyName || user?.email?.split('@')[0] || 'User';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, adsRes] = await Promise.all([
          api.get('/users/dashboard/stats'),
          api.get('/advertisements/client/my-ads?limit=5'),
        ]);
        setStats(statsRes.data.data);
        setRecentAds(adsRes.data.data || []);

        if (adsRes.data.data?.length > 0) {
          const adWithBids = adsRes.data.data.find((ad: Advertisement) => (ad._count?.bids || 0) > 0);
          if (adWithBids) {
            const bidsRes = await api.get(`/bids/advertisement/${adWithBids.id}?limit=5`);
            setRecentBids(bidsRes.data.data || []);
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <PageLoader />;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN': return <Badge variant="success">Open</Badge>;
      case 'CLOSED': return <Badge variant="gray">Closed</Badge>;
      case 'PENDING_APPROVAL': return <Badge variant="warning">Pending</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getBidStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <Badge variant="warning">Pending</Badge>;
      case 'SHORTLISTED': return <Badge variant="info">Shortlisted</Badge>;
      case 'ACCEPTED': return <Badge variant="success">Accepted</Badge>;
      case 'REJECTED': return <Badge variant="danger">Rejected</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Banner */}
      <ActionBanner />

      {/* Welcome Header Card */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-800 to-slate-700 rounded-2xl p-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
              <Calendar className="w-4 h-4" />
              {format(new Date(), 'EEEE, d MMMM yyyy')}
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold mb-1">
              {getGreeting()}, {displayName}! 👋
            </h1>
            <p className="text-slate-300">Here's what's happening with your campaigns today.</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-slate-700/50 backdrop-blur rounded-xl px-6 py-4 text-center min-w-[120px]">
              <p className="text-3xl font-bold">{stats?.totalBids || 0}</p>
              <p className="text-slate-400 text-sm">Pending Bids</p>
            </div>
            <div className="bg-slate-700/50 backdrop-blur rounded-xl px-6 py-4 text-center min-w-[120px]">
              <p className="text-3xl font-bold">{stats?.activeAds || 0}</p>
              <p className="text-slate-400 text-sm">Active Campaigns</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                <Megaphone className="w-5 h-5 text-slate-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats?.totalAds || 0}</p>
                <p className="text-sm text-slate-400">Total Campaigns</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats?.activeAds || 0}</p>
                <p className="text-sm text-slate-400">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats?.totalBids || 0}</p>
                <p className="text-sm text-slate-400">Total Bids</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats?.closedAds || 0}</p>
                <p className="text-sm text-slate-400">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Campaigns */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Recent Campaigns</h2>
              <Link to="/client/my-ads" className="text-sm text-slate-400 hover:text-white flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {recentAds.length === 0 ? (
                <div className="p-6 text-center">
                  <Megaphone className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 mb-4">No campaigns yet</p>
                  <Link to="/client/post-ad">
                    <Button size="sm">Create Your First Campaign</Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-700">
                  {recentAds.map((ad) => (
                    <Link
                      key={ad.id}
                      to={`/client/advertisements/${ad.id}`}
                      className="flex items-center justify-between p-4 hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-white truncate">{ad.title}</p>
                          {getStatusBadge(ad.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            ${ad.budgetMin} - ${ad.budgetMax}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {ad._count?.bids || 0} bids
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(ad.deadline), 'MMM d')}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-500" />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link
                to="/client/post-ad"
                className="flex items-center gap-3 p-3 rounded-lg bg-rose-600 hover:bg-rose-500 transition-colors"
              >
                <div className="p-2 bg-rose-500 rounded-lg">
                  <Plus className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-white">Post Campaign</p>
                  <p className="text-xs text-rose-200">Create new ad</p>
                </div>
              </Link>
              <Link
                to="/client/discover"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <div className="p-2 bg-slate-700 rounded-lg">
                  <Users className="h-4 w-4 text-slate-300" />
                </div>
                <div>
                  <p className="font-medium text-white">Find Influencers</p>
                  <p className="text-xs text-slate-400">Browse creators</p>
                </div>
              </Link>
              <Link
                to="/client/contracts"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <div className="p-2 bg-slate-700 rounded-lg">
                  <FileText className="h-4 w-4 text-slate-300" />
                </div>
                <div>
                  <p className="font-medium text-white">Contracts</p>
                  <p className="text-xs text-slate-400">Manage deals</p>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Performance Summary */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-white">Performance</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">Bid Response Rate</span>
                    <span className="font-medium text-white">
                      {stats?.totalAds ? Math.round((stats.totalBids / stats.totalAds) * 100) / 100 : 0} avg
                    </span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full"
                      style={{ width: `${Math.min((stats?.totalBids || 0) * 10, 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">Campaign Completion</span>
                    <span className="font-medium text-white">
                      {stats?.totalAds ? Math.round((stats.closedAds / stats.totalAds) * 100) : 0}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${stats?.totalAds ? (stats.closedAds / stats.totalAds) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Bids Section */}
      {recentBids.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Recent Bids on Your Campaigns</h2>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900 border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Influencer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Proposed Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Delivery</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {recentBids.map((bid) => (
                    <tr key={bid.id} className="hover:bg-slate-700/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-medium text-sm">
                            {bid.influencer?.influencerProfile?.displayName?.charAt(0) || 'I'}
                          </div>
                          <span className="font-medium text-white">
                            {bid.influencer?.influencerProfile?.displayName || 'Influencer'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-white">${bid.proposedPrice}</td>
                      <td className="px-4 py-3 text-slate-300">{bid.deliveryDays} days</td>
                      <td className="px-4 py-3">{getBidStatusBadge(bid.status)}</td>
                      <td className="px-4 py-3 text-slate-400 text-sm">
                        {format(new Date(bid.createdAt), 'MMM d, yyyy')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Getting Started Guide */}
      {recentAds.length === 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-white">Getting Started</h2>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="text-center p-4">
                <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                  1
                </div>
                <h3 className="font-medium text-white mb-1">Post Your Campaign</h3>
                <p className="text-sm text-slate-400">Describe your requirements, budget, and timeline</p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                  2
                </div>
                <h3 className="font-medium text-white mb-1">Review Proposals</h3>
                <p className="text-sm text-slate-400">Compare bids from qualified influencers</p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                  3
                </div>
                <h3 className="font-medium text-white mb-1">Collaborate & Launch</h3>
                <p className="text-sm text-slate-400">Select the best fit and start your campaign</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
