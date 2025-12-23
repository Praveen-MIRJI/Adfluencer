import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Search, Calendar, DollarSign, Users, Clock, Building2,
  Filter, X
} from 'lucide-react';
import api from '../../lib/api';
import { Advertisement, Category, Pagination } from '../../types';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Browse Campaigns</h1>
          <p className="text-slate-400 mt-1">
            {totalCount > 0 ? `${totalCount} open opportunities` : 'Find your next campaign'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              showFilters || activeFiltersCount > 0
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
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, description, or company..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              />
            </div>
            <Button type="submit">Search</Button>
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
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {ads.map((ad) => {
              const daysLeft = getDaysUntilDeadline(ad.deadline);
              const isUrgent = daysLeft <= 3;

              return (
                <Link
                  key={ad.id}
                  to={`/influencer/ads/${ad.id}`}
                  className="group bg-slate-800 rounded-xl border border-slate-700 hover:border-rose-500/50 hover:shadow-lg transition-all overflow-hidden"
                >
                  {/* Header */}
                  <div className="h-1.5 bg-rose-500" />

                  <div className="p-5">
                    {/* Tags */}
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary">{ad.platform}</Badge>
                      <Badge variant="secondary">{ad.contentType}</Badge>
                      {isUrgent && daysLeft > 0 && (
                        <Badge variant="warning">Urgent</Badge>
                      )}
                    </div>

                    {/* Title & Category */}
                    <h3 className="font-semibold text-white mb-1 line-clamp-2 group-hover:text-rose-400 transition-colors">
                      {ad.title}
                    </h3>
                    <p className="text-sm text-slate-400 mb-3">{ad.category?.name}</p>

                    {/* Description */}
                    <p className="text-sm text-slate-300 line-clamp-2 mb-4">{ad.description}</p>

                    {/* Stats Grid */}
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
                      <div className={`rounded-lg p-2.5 ${isUrgent ? 'bg-amber-500/20' : 'bg-slate-700/50'}`}>
                        <div className={`flex items-center gap-1.5 ${isUrgent ? 'text-amber-400' : 'text-slate-400'}`}>
                          <Clock className="w-4 h-4" />
                          <span className="text-xs font-medium">Deadline</span>
                        </div>
                        <p className={`text-sm font-semibold mt-0.5 ${isUrgent ? 'text-amber-300' : 'text-white'}`}>
                          {daysLeft > 0 ? `${daysLeft} days left` : 'Due today'}
                        </p>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-700">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-slate-400" />
                        </div>
                        <span className="text-sm text-slate-300 truncate max-w-[120px]">
                          {ad.client?.clientProfile?.companyName || 'Client'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <Users className="w-4 h-4" />
                        <span className="text-sm">{ad._count?.bids || 0} bids</span>
                      </div>
                    </div>
                  </div>
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
