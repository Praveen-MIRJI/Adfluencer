import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Plus, Eye, FileText, Calendar, DollarSign, Users, Clock,
  MoreVertical, Edit, Trash2, TrendingUp, Filter, Search,
  CheckCircle, XCircle, AlertCircle, BarChart3
} from 'lucide-react';
import api from '../../lib/api';
import { Advertisement, Pagination } from '../../types';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import PaginationComponent from '../../components/ui/Pagination';

const statusConfig: Record<string, { label: string; variant: 'success' | 'gray' | 'warning' | 'danger'; icon: typeof CheckCircle }> = {
  OPEN: { label: 'Open', variant: 'success', icon: CheckCircle },
  CLOSED: { label: 'Closed', variant: 'gray', icon: XCircle },
  PENDING_APPROVAL: { label: 'Pending', variant: 'warning', icon: AlertCircle },
  REJECTED: { label: 'Rejected', variant: 'danger', icon: XCircle },
};

export default function MyAdvertisements() {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const fetchAds = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '12' });
      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('search', search);

      const response = await api.get(`/advertisements/client/my-ads?${params}`);
      setAds(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch ads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAds();
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const stats = {
    total: pagination?.total || ads.length,
    open: ads.filter(a => a.status === 'OPEN').length,
    totalBids: ads.reduce((sum, ad) => sum + (ad._count?.bids || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">My Campaigns</h1>
          <p className="text-slate-400 mt-1">Manage and track your advertisement campaigns</p>
        </div>
        <Link to="/client/post-ad">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </Link>
      </div>

      {/* Stats Overview - Premium Design */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700/50 p-5 overflow-hidden group hover:border-slate-600/50 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-slate-600/10 rounded-full -translate-y-8 translate-x-8" />
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center shadow-lg">
              <FileText className="w-6 h-6 text-slate-200" />
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{stats.total}</p>
              <p className="text-sm text-slate-400 font-medium">Total Campaigns</p>
            </div>
          </div>
        </div>

        <div className="relative bg-gradient-to-br from-emerald-500/10 to-slate-900 rounded-2xl border border-emerald-500/20 p-5 overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full -translate-y-8 translate-x-8" />
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/30 to-emerald-600/20 flex items-center justify-center shadow-lg ring-1 ring-emerald-500/30">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{stats.open}</p>
              <p className="text-sm text-emerald-400/80 font-medium">Active Campaigns</p>
            </div>
          </div>
        </div>

        <div className="relative bg-gradient-to-br from-blue-500/10 to-slate-900 rounded-2xl border border-blue-500/20 p-5 overflow-hidden group hover:border-blue-500/40 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full -translate-y-8 translate-x-8" />
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/30 to-blue-600/20 flex items-center justify-center shadow-lg ring-1 ring-blue-500/30">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{stats.totalBids}</p>
              <p className="text-sm text-blue-400/80 font-medium">Total Bids Received</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search campaigns..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>
            </form>
            <div className="flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="">All Status</option>
                <option value="OPEN">Open</option>
                <option value="CLOSED">Closed</option>
                <option value="PENDING_APPROVAL">Pending</option>
              </select>
              <div className="hidden sm:flex items-center border border-slate-600 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                >
                  <BarChart3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                >
                  <FileText className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {loading ? (
        <PageLoader />
      ) : ads.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No campaigns yet"
          description="Create your first campaign to start receiving bids from influencers."
          action={
            <Link to="/client/post-ad">
              <Button>Create Campaign</Button>
            </Link>
          }
        />
      ) : viewMode === 'grid' ? (
        /* Grid View - Premium Card Design */
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {ads.map((ad) => {
            const daysLeft = getDaysUntilDeadline(ad.deadline);
            const isExpired = daysLeft < 0;
            const isUrgent = daysLeft >= 0 && daysLeft <= 3;
            const status = statusConfig[ad.status] || statusConfig.OPEN;
            const StatusIcon = status.icon;

            return (
              <Link
                key={ad.id}
                to={`/client/advertisements/${ad.id}`}
                className="group relative"
              >
                {/* Card Container */}
                <div className="relative bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:border-slate-600/80 transition-all duration-300 overflow-hidden shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-0.5">

                  {/* Subtle Top Border */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-600/50 to-transparent" />

                  {/* Subtle Glow Effect on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-700/0 to-slate-600/0 group-hover:from-slate-700/5 group-hover:to-slate-600/5 transition-all duration-300 pointer-events-none" />

                  <div className="relative p-6">
                    {/* Status Row */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.variant === 'success' ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30' :
                          status.variant === 'warning' ? 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30' :
                            status.variant === 'danger' ? 'bg-red-500/15 text-red-400 ring-1 ring-red-500/30' :
                              'bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/30'
                          }`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-700/50 text-slate-300 ring-1 ring-slate-600/50">
                          {ad.platform}
                        </span>
                      </div>
                      {ad._count?.bids ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 ring-1 ring-blue-500/20">
                          <Users className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-xs font-semibold text-blue-300">{ad._count.bids} bids</span>
                        </div>
                      ) : null}
                    </div>

                    {/* Title & Category */}
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-white mb-1.5 line-clamp-2 group-hover:text-slate-200 transition-colors leading-snug">
                        {ad.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                        <span className="text-sm text-slate-400">{ad.category?.name}</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-slate-400 line-clamp-2 mb-5 leading-relaxed">
                      {ad.description}
                    </p>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      {/* Budget */}
                      <div className="bg-slate-900/40 rounded-lg p-3.5 border border-slate-700/30">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-6 h-6 rounded-lg bg-slate-700/50 flex items-center justify-center">
                            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                          </div>
                          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Budget</span>
                        </div>
                        <p className="text-sm font-semibold text-white">
                          ${ad.budgetMin.toLocaleString()} - ${ad.budgetMax.toLocaleString()}
                        </p>
                      </div>

                      {/* Deadline */}
                      <div className={`rounded-lg p-3.5 border ${isExpired
                        ? 'bg-slate-900/40 border-slate-700/30'
                        : isUrgent
                          ? 'bg-orange-500/5 border-orange-500/20'
                          : 'bg-slate-900/40 border-slate-700/30'
                        }`}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isExpired ? 'bg-slate-700/50' : isUrgent ? 'bg-orange-500/10' : 'bg-slate-700/50'
                            }`}>
                            <Clock className={`w-3.5 h-3.5 ${isExpired ? 'text-slate-500' : isUrgent ? 'text-orange-400' : 'text-slate-400'
                              }`} />
                          </div>
                          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Deadline</span>
                        </div>
                        <p className={`text-sm font-semibold ${isExpired ? 'text-slate-500' : isUrgent ? 'text-orange-300' : 'text-white'
                          }`}>
                          {isExpired ? 'Expired' : daysLeft === 0 ? 'Due today' : `${daysLeft} days left`}
                        </p>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                      <span className="text-xs text-slate-500">
                        Created {formatDistanceToNow(new Date(ad.createdAt), { addSuffix: true })}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 group-hover:text-white transition-colors">
                        View Details
                        <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        /* List View */
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Campaign
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Budget
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Bids
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Deadline
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {ads.map((ad) => {
                  const status = statusConfig[ad.status] || statusConfig.OPEN;
                  const StatusIcon = status.icon;

                  return (
                    <tr key={ad.id} className="hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-slate-300" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate max-w-[200px]">
                              {ad.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-slate-400">{ad.platform}</span>
                              <span className="text-slate-600">•</span>
                              <span className="text-xs text-slate-400">{ad.category?.name}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-medium text-white">
                          ${ad.budgetMin.toLocaleString()} - ${ad.budgetMax.toLocaleString()}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-white">{ad._count?.bids || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-slate-300">{format(new Date(ad.deadline), 'MMM d, yyyy')}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={status.variant}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link
                          to={`/client/advertisements/${ad.id}`}
                          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white font-medium transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6">
          <PaginationComponent
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={fetchAds}
          />
        </div>
      )}
    </div>
  );
}
