import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Megaphone,
  FileCheck, FileText,
  Activity,
} from 'lucide-react';
import api from '../../lib/api';
import { PageLoader } from '../../components/ui/Spinner';
import AnalyticsCharts from '../../components/charts/AnalyticsCharts';
import SummaryCard from '../../components/ui/SummaryCard';

interface EnhancedStats {
  users: { total: number; clients: number; influencers: number; pending: number; active: number; blocked: number };
  advertisements: { total: number; open: number; closed: number; pending: number };
  bids: { total: number; pending: number; accepted: number };
  contracts: { total: number; active: number; completed: number };
  reviews: number;
  categories: number;
  messages: number;
  revenue: number;
  recentUsers: Array<{ id: string; email: string; role: string; status: string; createdAt: string }>;
  recentAds: Array<{ id: string; title: string; status: string; createdAt: string }>;
}


export default function AdminDashboard() {
  const [stats, setStats] = useState<EnhancedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/admin/enhanced-stats');
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-400 mt-1">Platform overview and management</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-400 text-sm font-medium">System Online</span>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Users"
          value={stats?.users.total || 0}
          icon={Users}
          color="blue"
          onClick={() => navigate('/admin/users')}
        />
        <SummaryCard
          title="Total Campaigns"
          value={stats?.advertisements.total || 0}
          icon={Megaphone}
          color="rose"
          onClick={() => navigate('/admin/advertisements')}
        />
        <SummaryCard
          title="Total Bids"
          value={stats?.bids.total || 0}
          icon={FileText}
          color="amber"
          onClick={() => navigate('/admin/bids')}
        />
        <SummaryCard
          title="Active Contracts"
          value={stats?.contracts.active || 0}
          icon={FileCheck}
          color="purple"
          onClick={() => navigate('/admin/contracts')}
        />
      </div>

      {/* Analytics & Charts Section */}
      <AnalyticsCharts />
    </div>
  );
}
