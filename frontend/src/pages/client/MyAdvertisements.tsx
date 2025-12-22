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
          <h1 className="text-2xl font-bold text-gray-900">My Campaigns</h1>
          <p className="text-gray-600 mt-1">Manage and track your advertisement campaigns</p>
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
              <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-500">Total Campaigns</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.open}</p>
                <p className="text-sm text-gray-500">Active Campaigns</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalBids}</p>
                <p className="text-sm text-gray-500">Total Bids Received</p>
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search campaigns..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </form>
            <div className="flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="">All Status</option>
                <option value="OPEN">Open</option>
                <option value="CLOSED">Closed</option>
                <option value="PENDING_APPROVAL">Pending</option>
              </select>
              <div className="hidden sm:flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  <BarChart3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:bg-gray-50'}`}
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
                className="group bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all overflow-hidden"
              >
                {/* Header */}
                <div className="h-1.5 bg-primary-500" />

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
                      <span className="flex items-center gap-1 text-sm text-gray-500">
                        <Users className="w-4 h-4" />
                        {ad._count.bids}
                      </span>
                    ) : null}
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-primary-600 transition-colors">
                    {ad.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-3">{ad.category?.name}</p>

                  {/* Description */}
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">{ad.description}</p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 rounded-lg p-2.5">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-xs font-medium">Budget</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">
                        ${ad.budgetMin.toLocaleString()} - ${ad.budgetMax.toLocaleString()}
                      </p>
                    </div>
                    <div className={`rounded-lg p-2.5 ${isExpired ? 'bg-gray-100' : isUrgent ? 'bg-amber-50' : 'bg-gray-50'}`}>
                      <div className={`flex items-center gap-1.5 ${isExpired ? 'text-gray-500' : isUrgent ? 'text-amber-600' : 'text-gray-600'}`}>
                        <Clock className="w-4 h-4" />
                        <span className="text-xs font-medium">Deadline</span>
                      </div>
                      <p className={`text-sm font-semibold mt-0.5 ${isExpired ? 'text-gray-500' : isUrgent ? 'text-amber-700' : 'text-gray-900'}`}>
                        {isExpired ? 'Expired' : daysLeft === 0 ? 'Due today' : `${daysLeft} days left`}
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-500">
                      Created {formatDistanceToNow(new Date(ad.createdAt), { addSuffix: true })}
                    </span>
                    <span className="text-sm text-primary-600 font-medium group-hover:underline">
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
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaign
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Budget
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bids
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deadline
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ads.map((ad) => {
                  const status = statusConfig[ad.status] || statusConfig.OPEN;
                  const StatusIcon = status.icon;

                  return (
                    <tr key={ad.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-primary-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                              {ad.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-500">{ad.platform}</span>
                              <span className="text-gray-300">•</span>
                              <span className="text-xs text-gray-500">{ad.category?.name}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-medium text-gray-900">
                          ${ad.budgetMin.toLocaleString()} - ${ad.budgetMax.toLocaleString()}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{ad._count?.bids || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-900">{format(new Date(ad.deadline), 'MMM d, yyyy')}</p>
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
                          className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
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
