import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { FileText, ExternalLink, DollarSign, Clock, Building2, ArrowRight } from 'lucide-react';
import api from '../../lib/api';
import { Bid, Pagination } from '../../types';
import { PageLoader } from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import PaginationComponent from '../../components/ui/Pagination';
import Button from '../../components/ui/Button';

export default function MyBids() {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchBids = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (statusFilter) params.append('status', statusFilter);

      const response = await api.get(`/bids/my-bids?${params}`);
      setBids(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch bids:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBids();
  }, [statusFilter]);

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-500/20 border-amber-500/30 text-amber-300';
      case 'SHORTLISTED':
        return 'bg-blue-500/20 border-blue-500/30 text-blue-300';
      case 'ACCEPTED':
        return 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300';
      case 'REJECTED':
        return 'bg-red-500/20 border-red-500/30 text-red-300';
      default:
        return 'bg-slate-500/20 border-slate-500/30 text-slate-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pending';
      case 'SHORTLISTED': return 'Shortlisted';
      case 'ACCEPTED': return 'Accepted';
      case 'REJECTED': return 'Rejected';
      default: return status;
    }
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">My Bids</h1>
          <p className="text-slate-400 mt-1 text-sm sm:text-base">Track your submitted proposals</p>
        </div>
        <Link to="/influencer/browse">
          <Button size="sm" className="w-full sm:w-auto">Browse More Ads</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl border border-slate-700/50 p-3 sm:p-4">
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {['', 'PENDING', 'SHORTLISTED', 'ACCEPTED', 'REJECTED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${statusFilter === status
                ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/25'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 border border-slate-600/50'
                }`}
            >
              {status === '' ? 'All' : getStatusLabel(status)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <PageLoader />
      ) : bids.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No bids yet"
          description="Start browsing advertisements and submit your first bid."
          action={
            <Link to="/influencer/browse">
              <Button>Browse Ads</Button>
            </Link>
          }
        />
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:hidden">
            {bids.map((bid) => (
              <Link
                key={bid.id}
                to={`/influencer/ads/${bid.advertisementId}`}
                className="group relative bg-gradient-to-br from-slate-800/90 via-slate-800/80 to-slate-900/90 rounded-2xl border border-slate-700/50 hover:border-rose-500/40 transition-all duration-300 overflow-hidden hover:shadow-xl hover:shadow-rose-500/10"
              >
                {/* Top gradient bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-400" />

                <div className="p-4">
                  {/* Status & Date Row */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusStyles(bid.status)}`}>
                      {getStatusLabel(bid.status)}
                    </span>
                    <span className="text-xs text-slate-500">
                      {format(new Date(bid.createdAt), 'MMM d, yyyy')}
                    </span>
                  </div>

                  {/* Ad Title */}
                  <h3 className="font-bold text-white mb-2 line-clamp-2 text-sm group-hover:text-rose-300 transition-colors">
                    {bid.advertisement?.title}
                  </h3>

                  {/* Category */}
                  <p className="text-xs text-slate-400 mb-3 flex items-center gap-1.5">
                    <span className="w-1 h-1 bg-rose-400 rounded-full" />
                    {bid.advertisement?.category?.name}
                  </p>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/5 border border-emerald-500/20 rounded-lg p-2 text-center">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400 mx-auto mb-0.5" />
                      <p className="text-xs font-bold text-white">${bid.proposedPrice}</p>
                      <p className="text-[10px] text-slate-400">Your Bid</p>
                    </div>
                    <div className="bg-slate-700/30 border border-slate-600/30 rounded-lg p-2 text-center">
                      <Clock className="w-3.5 h-3.5 text-slate-400 mx-auto mb-0.5" />
                      <p className="text-xs font-bold text-white">{bid.deliveryDays}</p>
                      <p className="text-[10px] text-slate-400">Days</p>
                    </div>
                    <div className="bg-gradient-to-br from-rose-500/10 to-pink-500/10 border border-rose-500/20 rounded-lg p-2 text-center">
                      <Building2 className="w-3.5 h-3.5 text-rose-400 mx-auto mb-0.5" />
                      <p className="text-xs font-bold text-white truncate">{bid.advertisement?.client?.clientProfile?.companyName?.slice(0, 8) || 'Client'}</p>
                      <p className="text-[10px] text-slate-400">Client</p>
                    </div>
                  </div>

                  {/* View Details */}
                  <div className="flex items-center justify-end text-rose-400 text-xs font-medium group-hover:text-rose-300">
                    View Details <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl border border-slate-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-700/50">
                <thead className="bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Advertisement
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Your Bid
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Delivery
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {bids.map((bid) => (
                    <tr key={bid.id} className="hover:bg-slate-700/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-white max-w-xs truncate group-hover:text-rose-300 transition-colors">
                          {bid.advertisement?.title}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span className="w-1 h-1 bg-rose-400 rounded-full" />
                          {bid.advertisement?.category?.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500/20 to-pink-500/20 border border-rose-500/30 flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-rose-400" />
                          </div>
                          <span className="text-sm text-slate-300">
                            {bid.advertisement?.client?.clientProfile?.companyName || 'Client'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-emerald-400">${bid.proposedPrice}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {bid.deliveryDays} days
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                        {format(new Date(bid.createdAt), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusStyles(bid.status)}`}>
                          {getStatusLabel(bid.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link
                          to={`/influencer/ads/${bid.advertisementId}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 rounded-lg text-rose-400 hover:text-rose-300 text-sm font-medium transition-all"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="mt-4 sm:mt-6">
              <PaginationComponent
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={fetchBids}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

