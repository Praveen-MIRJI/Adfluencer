import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Megaphone, FileText, UserCheck, Building2, User } from 'lucide-react';
import api from '../../lib/api';
import StatsCard from '../../components/ui/StatsCard';
import { PageLoader } from '../../components/ui/Spinner';

interface AdminStats {
  totalUsers: number;
  totalClients: number;
  totalInfluencers: number;
  pendingUsers: number;
  totalAds: number;
  openAds: number;
  totalBids: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/admin/stats');
        setStats(response.data.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Platform overview and management</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon={Users}
        />
        <StatsCard
          title="Clients"
          value={stats?.totalClients || 0}
          icon={Building2}
        />
        <StatsCard
          title="Influencers"
          value={stats?.totalInfluencers || 0}
          icon={User}
        />
        <StatsCard
          title="Pending Approval"
          value={stats?.pendingUsers || 0}
          icon={UserCheck}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <StatsCard
          title="Total Ads"
          value={stats?.totalAds || 0}
          icon={Megaphone}
        />
        <StatsCard
          title="Open Ads"
          value={stats?.openAds || 0}
          icon={Megaphone}
        />
        <StatsCard
          title="Total Bids"
          value={stats?.totalBids || 0}
          icon={FileText}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link to="/admin/users" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Users className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Manage Users</p>
                <p className="text-sm text-gray-500">Approve, block, or manage users</p>
              </div>
            </Link>
            <Link to="/admin/advertisements" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Megaphone className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Manage Advertisements</p>
                <p className="text-sm text-gray-500">Review and moderate ads</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Platform Health</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Active Campaigns</span>
              <span className="font-medium text-green-600">{stats?.openAds || 0} running</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Pending Users</span>
              <span className={`font-medium ${(stats?.pendingUsers || 0) > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                {stats?.pendingUsers || 0} awaiting
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Bid Activity</span>
              <span className="font-medium text-primary-600">{stats?.totalBids || 0} total</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
