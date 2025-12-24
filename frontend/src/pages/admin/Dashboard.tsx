import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, Megaphone,
  DollarSign, FileCheck,
  ArrowUpRight, ArrowDownRight, Activity,
} from 'lucide-react';
import api from '../../lib/api';
import { Card, CardContent } from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/Spinner';
import AnalyticsCharts from '../../components/charts/AnalyticsCharts';

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

function StatCard({ title, value, icon: Icon, trend, trendUp, color = 'rose', href }: any) {
  return (
    <Link to={href || '#'}>
      <motion.div whileHover={{ y: -2, scale: 1.01 }} transition={{ duration: 0.2 }}>
        <Card className="hover:border-rose-500/30 transition-colors cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">{title}</p>
                <p className="text-3xl font-bold text-white mt-2">{typeof value === 'number' ? value.toLocaleString() : value}</p>
                {trend && (
                  <div className={`flex items-center gap-1 mt-2 text-sm ${trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
                    {trendUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    <span>{trend}</span>
                  </div>
                )}
              </div>
              <div className={`p-3 rounded-xl bg-${color}-500/10`}>
                <Icon className={`w-6 h-6 text-${color}-400`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<EnhancedStats | null>(null);
  const [loading, setLoading] = useState(true);

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
        <StatCard title="Total Users" value={stats?.users.total || 0} icon={Users} href="/admin/users" color="blue" />
        <StatCard title="Total Revenue" value={`$${(stats?.revenue || 0).toLocaleString()}`} icon={DollarSign} href="/admin/contracts" color="emerald" />
        <StatCard title="Active Campaigns" value={stats?.advertisements.open || 0} icon={Megaphone} href="/admin/advertisements" color="rose" />
        <StatCard title="Active Contracts" value={stats?.contracts.active || 0} icon={FileCheck} href="/admin/contracts" color="purple" />
      </div>

      {/* Analytics & Charts Section */}
      <AnalyticsCharts />
    </div>
  );
}
