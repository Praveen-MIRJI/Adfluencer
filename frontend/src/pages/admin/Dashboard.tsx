import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, Megaphone, FileText, Building2, User, TrendingUp,
  DollarSign, FileCheck, Star, Clock, CheckCircle, XCircle, AlertCircle,
  ArrowUpRight, ArrowDownRight, Activity, BarChart3,
} from 'lucide-react';
import api from '../../lib/api';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import { format } from 'date-fns';
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

function MiniStatCard({ title, value, icon: Icon, color }: any) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
      <div className={`p-2 rounded-lg bg-${color}-500/10`}>
        <Icon className={`w-4 h-4 text-${color}-400`} />
      </div>
      <div>
        <p className="text-xs text-slate-400">{title}</p>
        <p className="text-lg font-semibold text-white">{value}</p>
      </div>
    </div>
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': case 'OPEN': return <Badge variant="success">{status}</Badge>;
      case 'PENDING': case 'PENDING_APPROVAL': return <Badge variant="warning">Pending</Badge>;
      case 'BLOCKED': case 'REJECTED': case 'CLOSED': return <Badge variant="danger">{status}</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'CLIENT': return <Badge variant="info">Client</Badge>;
      case 'INFLUENCER': return <Badge variant="success">Influencer</Badge>;
      default: return <Badge>{role}</Badge>;
    }
  };

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

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users Breakdown */}
        <Card>
          <CardHeader className="border-b border-slate-700/50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Users Overview</h3>
              <Link to="/admin/users" className="text-rose-400 text-sm hover:text-rose-300">View All</Link>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-3">
              <MiniStatCard title="Clients" value={stats?.users.clients || 0} icon={Building2} color="blue" />
              <MiniStatCard title="Influencers" value={stats?.users.influencers || 0} icon={User} color="purple" />
              <MiniStatCard title="Pending" value={stats?.users.pending || 0} icon={Clock} color="amber" />
              <MiniStatCard title="Blocked" value={stats?.users.blocked || 0} icon={XCircle} color="red" />
            </div>
          </CardContent>
        </Card>

        {/* Ads Breakdown */}
        <Card>
          <CardHeader className="border-b border-slate-700/50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Advertisements</h3>
              <Link to="/admin/advertisements" className="text-rose-400 text-sm hover:text-rose-300">View All</Link>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-3">
              <MiniStatCard title="Total" value={stats?.advertisements.total || 0} icon={Megaphone} color="rose" />
              <MiniStatCard title="Open" value={stats?.advertisements.open || 0} icon={CheckCircle} color="emerald" />
              <MiniStatCard title="Pending" value={stats?.advertisements.pending || 0} icon={AlertCircle} color="amber" />
              <MiniStatCard title="Closed" value={stats?.advertisements.closed || 0} icon={XCircle} color="slate" />
            </div>
          </CardContent>
        </Card>

        {/* Activity Stats */}
        <Card>
          <CardHeader className="border-b border-slate-700/50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Platform Activity</h3>
              <BarChart3 className="w-5 h-5 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-3">
              <MiniStatCard title="Total Bids" value={stats?.bids.total || 0} icon={FileText} color="blue" />
              <MiniStatCard title="Contracts" value={stats?.contracts.total || 0} icon={FileCheck} color="purple" />
              <MiniStatCard title="Reviews" value={stats?.reviews || 0} icon={Star} color="amber" />
              <MiniStatCard title="Categories" value={stats?.categories || 0} icon={TrendingUp} color="emerald" />
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card>
          <CardHeader className="border-b border-slate-700/50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Recent Users</h3>
              <Link to="/admin/users" className="text-rose-400 text-sm hover:text-rose-300">View All</Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-700/50">
              {stats?.recentUsers.map((user) => (
                <motion.div key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                      {user.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{user.email}</p>
                      <p className="text-slate-400 text-xs">{format(new Date(user.createdAt), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getRoleBadge(user.role)}
                    {getStatusBadge(user.status)}
                  </div>
                </motion.div>
              ))}
              {(!stats?.recentUsers || stats.recentUsers.length === 0) && (
                <div className="p-8 text-center text-slate-400">No recent users</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Ads */}
        <Card>
          <CardHeader className="border-b border-slate-700/50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Recent Advertisements</h3>
              <Link to="/admin/advertisements" className="text-rose-400 text-sm hover:text-rose-300">View All</Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-700/50">
              {stats?.recentAds.map((ad) => (
                <motion.div key={ad.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
                      <Megaphone className="w-5 h-5 text-rose-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm truncate max-w-[200px]">{ad.title}</p>
                      <p className="text-slate-400 text-xs">{format(new Date(ad.createdAt), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                  {getStatusBadge(ad.status)}
                </motion.div>
              ))}
              {(!stats?.recentAds || stats.recentAds.length === 0) && (
                <div className="p-8 text-center text-slate-400">No recent advertisements</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="border-b border-slate-700/50">
          <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { title: 'Manage Users', desc: 'Approve or block users', icon: Users, href: '/admin/users', color: 'blue' },
              { title: 'Review Ads', desc: 'Moderate advertisements', icon: Megaphone, href: '/admin/advertisements', color: 'rose' },
              { title: 'View Contracts', desc: 'Monitor all contracts', icon: FileCheck, href: '/admin/contracts', color: 'purple' },
              { title: 'Categories', desc: 'Manage ad categories', icon: TrendingUp, href: '/admin/categories', color: 'emerald' },
            ].map((action, i) => (
              <Link key={i} to={action.href}>
                <motion.div whileHover={{ scale: 1.02 }} className={`p-4 rounded-xl bg-${action.color}-500/10 border border-${action.color}-500/20 hover:border-${action.color}-500/40 transition-colors cursor-pointer`}>
                  <action.icon className={`w-8 h-8 text-${action.color}-400 mb-3`} />
                  <p className="text-white font-medium">{action.title}</p>
                  <p className="text-slate-400 text-sm">{action.desc}</p>
                </motion.div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Analytics & Charts Section */}
      <AnalyticsCharts />
    </div>
  );
}
