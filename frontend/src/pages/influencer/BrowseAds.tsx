import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, DollarSign, Users, Clock, Building2,
  Filter, X
} from 'lucide-react';
import api from '../../lib/api';
import { Advertisement, Category, Pagination } from '../../types';
import Button from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import PaginationComponent from '../../components/ui/Pagination';

const platforms = [
  { value: '', label: 'All Platforms' },
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'YOUTUBE', label: 'YouTube' },
  { value: 'TWITTER', label: 'Twitter' },
  { value: 'TIKTOK', label: 'TikTok' },
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'LINKEDIN', label: 'LinkedIn' },
];



export default function BrowseAds() {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [platform, setPlatform] = useState('');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');

  const activeFiltersCount = [category, platform, minBudget, maxBudget].filter(Boolean).length;

  const fetchAds = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '12', status: 'OPEN' });
      if (search) params.append('search', search);
      if (category) params.append('category', category);
      if (platform) params.append('platform', platform);
      if (minBudget) params.append('minBudget', minBudget);
      if (maxBudget) params.append('maxBudget', maxBudget);

      const response = await api.get(`/advertisements?${params}`);
      setAds(response.data.data);
      setPagination(response.data.pagination);
      setTotalCount(response.data.pagination?.total || 0);
    } catch (error) {
      console.error('Failed to fetch ads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        setCategories(response.data.data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchAds();
  }, [category, platform, minBudget, maxBudget]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAds();
  };

  const clearFilters = () => {
    setCategory('');
    setPlatform('');
    setMinBudget('');
    setMaxBudget('');
    setSearch('');
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-white">Browse Campaigns</h1>
          <p className="text-slate-400 mt-1 text-sm sm:text-base">
            {totalCount > 0 ? `${totalCount} open opportunities` : 'Find your next campaign'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${showFilters || activeFiltersCount > 0
              ? 'border-rose-500 bg-rose-500/20 text-rose-400'
              : 'border-slate-600 text-slate-300 hover:bg-slate-700'
              }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 bg-rose-600 text-white text-xs rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <form onSubmit={handleSearch} className="flex gap-2 sm:gap-3">
            <div className="flex-1 relative min-w-0">
              <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search campaigns..."
                className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm sm:text-base"
              />
            </div>
            <Button type="submit" className="flex-shrink-0 text-sm sm:text-base px-3 sm:px-4">Search</Button>
          </form>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-slate-700">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Platform</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    {platforms.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex-1 min-w-[120px]">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Min Budget</label>
                  <input
                    type="number"
                    value={minBudget}
                    onChange={(e) => setMinBudget(e.target.value)}
                    placeholder="$0"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="flex-1 min-w-[120px]">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Max Budget</label>
                  <input
                    type="number"
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(e.target.value)}
                    placeholder="$10,000"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="mt-3 text-sm text-rose-400 hover:text-rose-300 flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <PageLoader />
      ) : ads.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No campaigns found"
          description="Try adjusting your filters or check back later for new opportunities."
          action={
            activeFiltersCount > 0 ? (
              <Button variant="secondary" onClick={clearFilters}>Clear Filters</Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 w-full min-w-0">
            {ads.map((ad) => {
              const daysLeft = getDaysUntilDeadline(ad.deadline);
              const isUrgent = daysLeft <= 3;

              return (
                <Link
                  key={ad.id}
                  to={`/influencer/ads/${ad.id}`}
                  className="group relative bg-gradient-to-br from-slate-800/90 via-slate-800/80 to-slate-900/90 rounded-2xl border border-slate-700/50 hover:border-rose-500/40 transition-all duration-300 overflow-hidden min-w-0 hover:shadow-xl hover:shadow-rose-500/10 hover:-translate-y-1"
                >
                  {/* Gradient accent bar */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-400" />

                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-rose-500/0 via-transparent to-pink-500/0 group-hover:from-rose-500/5 group-hover:to-pink-500/5 transition-all duration-300" />

                  <div className="relative p-4 sm:p-5">
                    {/* Tags Row */}
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-3">
                      <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-full text-[10px] sm:text-xs font-medium text-blue-300">
                        {ad.platform}
                      </span>
                      <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-slate-700/50 border border-slate-600/50 rounded-full text-[10px] sm:text-xs font-medium text-slate-300">
                        {ad.contentType}
                      </span>
                      {isUrgent && daysLeft > 0 && (
                        <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-full text-[10px] sm:text-xs font-medium text-amber-300 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                          Urgent
                        </span>
                      )}
                    </div>

                    {/* Title & Category */}
                    <h3 className="font-bold text-white mb-1.5 line-clamp-2 group-hover:text-rose-300 transition-colors text-sm sm:text-base leading-tight">
                      {ad.title}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-400 mb-3 truncate flex items-center gap-1.5">
                      <span className="w-1 h-1 bg-rose-400 rounded-full" />
                      {ad.category?.name}
                    </p>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-slate-400 line-clamp-2 mb-4 leading-relaxed hidden sm:block">
                      {ad.description}
                    </p>

                    {/* Stats Grid - Glassmorphism style */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4">
                      <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/5 backdrop-blur-sm border border-emerald-500/20 rounded-xl p-2.5 sm:p-3">
                        <div className="flex items-center gap-1.5 text-emerald-400 mb-1">
                          <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide">Budget</span>
                        </div>
                        <p className="text-sm sm:text-base font-bold text-white truncate">
                          ${ad.budgetMin.toLocaleString()} - ${ad.budgetMax.toLocaleString()}
                        </p>
                      </div>
                      <div className={`backdrop-blur-sm rounded-xl p-2.5 sm:p-3 ${isUrgent
                        ? 'bg-gradient-to-br from-amber-500/15 to-orange-500/10 border border-amber-500/30'
                        : 'bg-gradient-to-br from-slate-600/20 to-slate-700/20 border border-slate-600/30'
                        }`}>
                        <div className={`flex items-center gap-1.5 mb-1 ${isUrgent ? 'text-amber-400' : 'text-slate-400'}`}>
                          <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide">Deadline</span>
                        </div>
                        <p className={`text-sm sm:text-base font-bold ${isUrgent ? 'text-amber-300' : 'text-white'}`}>
                          {daysLeft > 0 ? `${daysLeft} days left` : 'Due today'}
                        </p>
                      </div>
                    </div>

                    {/* Footer with Company & Bids */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-rose-500/20 to-pink-500/20 border border-rose-500/30 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-rose-400" />
                        </div>
                        <span className="text-xs sm:text-sm text-slate-300 truncate font-medium">
                          {ad.client?.clientProfile?.companyName || 'Client'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-700/40 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full flex-shrink-0">
                        <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" />
                        <span className="text-xs sm:text-sm font-semibold text-white">{ad._count?.bids || 0}</span>
                        <span className="text-[10px] sm:text-xs text-slate-400 hidden sm:inline">bids</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom gradient line on hover */}
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Link>
              );
            })}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="mt-8">
              <PaginationComponent
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={fetchAds}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
