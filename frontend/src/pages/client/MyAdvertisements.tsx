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

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                <FileText className="w-5 h-5 text-slate-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-sm text-slate-400">Total Campaigns</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.open}</p>
                <p className="text-sm text-slate-400">Active Campaigns</p>
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
                <p className="text-2xl font-bold text-white">{stats.totalBids}</p>
                <p className="text-sm text-slate-400">Total Bids Received</p>
              </div>
            </div>
          </CardContent>
        </Card>
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
        /* Grid View */
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
                className="group bg-slate-800 rounded-xl border border-slate-700 hover:border-rose-500/50 hover:shadow-lg transition-all overflow-hidden"
              >
                {/* Header */}
                <div className="h-1.5 bg-rose-500" />

                <div className="p-5">
                  {/* Status & Platform */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={status.variant}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status.label}
                      </Badge>
                      <Badge variant="secondary">{ad.platform}</Badge>
                    </div>
                    {ad._count?.bids ? (
                      <span className="flex items-center gap-1 text-sm text-slate-400">
                        <Users className="w-4 h-4" />
                        {ad._count.bids}
                      </span>
                    ) : null}
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-white mb-1 line-clamp-2 group-hover:text-rose-400 transition-colors">
                    {ad.title}
                  </h3>
                  <p className="text-sm text-slate-400 mb-3">{ad.category?.name}</p>

                  {/* Description */}
                  <p className="text-sm text-slate-300 line-clamp-2 mb-4">{ad.description}</p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-slate-700/50 rounded-lg p-2.5">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-xs font-medium">Budget</span>
                      </div>
                      <p className="text-sm font-semibold text-white mt-0.5">
                        ${ad.budgetMin.toLocaleString()} - ${ad.budgetMax.toLocaleString()}
                      </p>
                    </div>
                    <div className={`rounded-lg p-2.5 ${isExpired ? 'bg-slate-700/50' : isUrgent ? 'bg-amber-500/20' : 'bg-slate-700/50'}`}>
                      <div className={`flex items-center gap-1.5 ${isExpired ? 'text-slate-500' : isUrgent ? 'text-amber-400' : 'text-slate-400'}`}>
                        <Clock className="w-4 h-4" />
                        <span className="text-xs font-medium">Deadline</span>
                      </div>
                      <p className={`text-sm font-semibold mt-0.5 ${isExpired ? 'text-slate-500' : isUrgent ? 'text-amber-300' : 'text-white'}`}>
                        {isExpired ? 'Expired' : daysLeft === 0 ? 'Due today' : `${daysLeft} days left`}
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-700">
                    <span className="text-xs text-slate-500">
                      Created {formatDistanceToNow(new Date(ad.createdAt), { addSuffix: true })}
                    </span>
                    <span className="text-sm text-rose-400 font-medium group-hover:underline">
                      View Details →
                    </span>
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
                          className="inline-flex items-center gap-1 text-sm text-rose-400 hover:text-rose-300 font-medium"
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
