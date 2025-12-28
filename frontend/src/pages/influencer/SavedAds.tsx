import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, DollarSign, Trash2, Building2, Clock, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../lib/api';
import { SavedAd } from '../../types';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import toast from 'react-hot-toast';

export default function SavedAds() {
  const [savedAds, setSavedAds] = useState<SavedAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  useEffect(() => {
    fetchSavedAds();
  }, [pagination.page]);

  const fetchSavedAds = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/saved-ads?page=${pagination.page}&limit=10`);
      setSavedAds(res.data.data || []);
      if (res.data.pagination) {
        setPagination(prev => ({ ...prev, ...res.data.pagination }));
      }
    } catch (error) {
      console.error('Failed to fetch saved ads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (e: React.MouseEvent, advertisementId: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.delete(`/saved-ads/${advertisementId}`);
      setSavedAds(prev => prev.filter(s => s.advertisementId !== advertisementId));
      toast.success('Removed from saved');
    } catch (error) {
      toast.error('Failed to remove');
    }
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Bookmark className="w-5 h-5 sm:w-6 sm:h-6 text-rose-400" />
            Saved Campaigns
          </h1>
          <p className="text-slate-400 mt-1 text-sm sm:text-base">
            {savedAds.length > 0 ? `${savedAds.length} campaign${savedAds.length > 1 ? 's' : ''} saved` : 'Campaigns you\'ve bookmarked'}
          </p>
        </div>
        <Link to="/influencer/browse">
          <Button size="sm" className="w-full sm:w-auto">Browse More</Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : savedAds.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No saved campaigns"
          description="Save interesting campaigns while browsing to review them later"
          action={
            <Link to="/influencer/browse">
              <Button>Browse Campaigns</Button>
            </Link>
          }
        />
      ) : (
        <>
          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
            {savedAds.map((saved) => {
              const ad = saved.advertisement;
              if (!ad) return null;

              const daysLeft = getDaysUntilDeadline(ad.deadline);
              const isUrgent = daysLeft <= 3 && daysLeft > 0;
              const isExpired = daysLeft <= 0;

              return (
                <Link
                  key={saved.id}
                  to={`/influencer/ads/${ad.id}`}
                  className="group relative bg-gradient-to-br from-slate-800/90 via-slate-800/80 to-slate-900/90 rounded-2xl border border-slate-700/50 hover:border-rose-500/40 transition-all duration-300 overflow-hidden hover:shadow-xl hover:shadow-rose-500/10 hover:-translate-y-1"
                >
                  {/* Gradient accent bar */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-400" />

                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-rose-500/0 via-transparent to-pink-500/0 group-hover:from-rose-500/5 group-hover:to-pink-500/5 transition-all duration-300" />

                  <div className="relative p-4 sm:p-5">
                    {/* Top Row: Tags & Remove Button */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-full text-[10px] sm:text-xs font-medium text-blue-300">
                          {ad.platform}
                        </span>
                        <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium border ${ad.status === 'OPEN'
                          ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                          : 'bg-slate-500/20 border-slate-500/30 text-slate-300'
                          }`}>
                          {ad.status}
                        </span>
                        {isUrgent && (
                          <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded-full text-[10px] font-medium text-amber-300 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                            Urgent
                          </span>
                        )}
                      </div>
                      <button
                        onClick={(e) => handleUnsave(e, ad.id)}
                        className="p-1.5 sm:p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-all flex-shrink-0"
                        title="Remove from saved"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-white mb-1.5 line-clamp-2 text-sm sm:text-base group-hover:text-rose-300 transition-colors leading-tight">
                      {ad.title}
                    </h3>

                    {/* Category */}
                    <p className="text-[11px] sm:text-xs text-slate-400 mb-3 truncate flex items-center gap-1.5">
                      <span className="w-1 h-1 bg-rose-400 rounded-full" />
                      {ad.category?.name || 'Uncategorized'}
                    </p>

                    {/* Description - hide on mobile */}
                    <p className="text-xs sm:text-sm text-slate-400 line-clamp-2 mb-4 leading-relaxed hidden sm:block">
                      {ad.description}
                    </p>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4">
                      <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/5 backdrop-blur-sm border border-emerald-500/20 rounded-xl p-2 sm:p-2.5">
                        <div className="flex items-center gap-1 text-emerald-400 mb-0.5">
                          <DollarSign className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide">Budget</span>
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-white truncate">
                          ${ad.budgetMin?.toLocaleString()} - ${ad.budgetMax?.toLocaleString()}
                        </p>
                      </div>
                      <div className={`backdrop-blur-sm rounded-xl p-2 sm:p-2.5 ${isExpired
                        ? 'bg-gradient-to-br from-red-500/15 to-rose-500/10 border border-red-500/30'
                        : isUrgent
                          ? 'bg-gradient-to-br from-amber-500/15 to-orange-500/10 border border-amber-500/30'
                          : 'bg-gradient-to-br from-slate-600/20 to-slate-700/20 border border-slate-600/30'
                        }`}>
                        <div className={`flex items-center gap-1 mb-0.5 ${isExpired ? 'text-red-400' : isUrgent ? 'text-amber-400' : 'text-slate-400'
                          }`}>
                          <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide">
                            {isExpired ? 'Expired' : 'Deadline'}
                          </span>
                        </div>
                        <p className={`text-xs sm:text-sm font-bold ${isExpired ? 'text-red-300' : isUrgent ? 'text-amber-300' : 'text-white'
                          }`}>
                          {isExpired ? 'Closed' : daysLeft > 0 ? `${daysLeft} days left` : 'Due today'}
                        </p>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-rose-500/20 to-pink-500/20 border border-rose-500/30 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" />
                        </div>
                        <span className="text-xs sm:text-sm text-slate-300 truncate font-medium">
                          {ad.client?.clientProfile?.companyName || 'Client'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-rose-400 text-xs font-medium group-hover:text-rose-300 flex-shrink-0">
                        <span className="hidden sm:inline">View</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    {/* Saved date */}
                    <p className="text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-700/30">
                      Saved {format(new Date(saved.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>

                  {/* Bottom gradient line on hover */}
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Link>
              );
            })}
          </div>

          {pagination.totalPages > 1 && (
            <div className="mt-4 sm:mt-6">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

