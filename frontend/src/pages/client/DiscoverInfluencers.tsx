import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star, Users, Instagram, Youtube, Twitter } from 'lucide-react';
import api from '../../lib/api';
import { InfluencerProfile } from '../../types';
import { Card, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';

interface InfluencerWithUser extends InfluencerProfile {
  user: { id: string; status: string; createdAt: string };
}

export default function DiscoverInfluencers() {
  const [influencers, setInfluencers] = useState<InfluencerWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [niches, setNiches] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    search: '',
    niche: '',
    sortBy: 'rating',
    minRating: '',
  });
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  useEffect(() => {
    fetchNiches();
  }, []);

  useEffect(() => {
    fetchInfluencers();
  }, [filters, pagination.page]);

  const fetchNiches = async () => {
    try {
      const res = await api.get('/influencers/niches');
      setNiches(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch niches:', error);
    }
  };

  const fetchInfluencers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: '12',
        ...(filters.search && { search: filters.search }),
        ...(filters.niche && { niche: filters.niche }),
        ...(filters.sortBy && { sortBy: filters.sortBy }),
        ...(filters.minRating && { minRating: filters.minRating }),
      });
      const res = await api.get(`/influencers/discover?${params}`);
      setInfluencers(res.data.data || []);
      if (res.data.pagination) {
        setPagination(prev => ({ ...prev, ...res.data.pagination }));
      }
    } catch (error) {
      console.error('Failed to fetch influencers:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFollowers = (count?: number) => {
    if (!count) return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const getTotalFollowers = (profile: InfluencerProfile) => {
    return (profile.instagramFollowers || 0) + 
           (profile.youtubeSubscribers || 0) + 
           (profile.twitterFollowers || 0) + 
           (profile.tiktokFollowers || 0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Discover Influencers</h1>
        <p className="text-slate-400 mt-1">Find the perfect influencer for your campaign</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
              <Input
                placeholder="Search influencers..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>
            <Select
              value={filters.niche}
              onChange={(e) => setFilters(prev => ({ ...prev, niche: e.target.value }))}
            >
              <option value="">All Niches</option>
              {niches.map(niche => (
                <option key={niche} value={niche}>{niche}</option>
              ))}
            </Select>
            <Select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
            >
              <option value="rating">Highest Rated</option>
              <option value="followers">Most Followers</option>
              <option value="campaigns">Most Campaigns</option>
            </Select>
            <Select
              value={filters.minRating}
              onChange={(e) => setFilters(prev => ({ ...prev, minRating: e.target.value }))}
            >
              <option value="">Any Rating</option>
              <option value="4">4+ Stars</option>
              <option value="4.5">4.5+ Stars</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : influencers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No influencers found"
          description="Try adjusting your filters"
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {influencers.map((influencer) => (
              <Card key={influencer.id} className="hover:border-rose-500/30 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center text-white text-xl font-bold overflow-hidden">
                      {influencer.avatar ? (
                        <img src={influencer.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        influencer.displayName?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">{influencer.displayName}</h3>
                      {influencer.primaryNiche && (
                        <p className="text-sm text-rose-400">{influencer.primaryNiche}</p>
                      )}
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="text-sm font-medium text-white">{influencer.averageRating?.toFixed(1) || '0.0'}</span>
                        <span className="text-sm text-slate-400">({influencer.totalReviews || 0} reviews)</span>
                      </div>
                    </div>
                  </div>

                  {influencer.bio && (
                    <p className="text-sm text-slate-300 mt-4 line-clamp-2">{influencer.bio}</p>
                  )}

                  <div className="flex items-center gap-4 mt-4 text-sm text-slate-400">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{formatFollowers(getTotalFollowers(influencer))} total</span>
                    </div>
                    <span>•</span>
                    <span>{influencer.completedCampaigns || 0} campaigns</span>
                  </div>

                  <div className="flex items-center gap-3 mt-4">
                    {influencer.instagramFollowers && (
                      <div className="flex items-center gap-1 text-pink-400">
                        <Instagram className="w-4 h-4" />
                        <span className="text-xs">{formatFollowers(influencer.instagramFollowers)}</span>
                      </div>
                    )}
                    {influencer.youtubeSubscribers && (
                      <div className="flex items-center gap-1 text-red-400">
                        <Youtube className="w-4 h-4" />
                        <span className="text-xs">{formatFollowers(influencer.youtubeSubscribers)}</span>
                      </div>
                    )}
                    {influencer.twitterFollowers && (
                      <div className="flex items-center gap-1 text-sky-400">
                        <Twitter className="w-4 h-4" />
                        <span className="text-xs">{formatFollowers(influencer.twitterFollowers)}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-600/50">
                    <Link to={`/client/influencers/${influencer.userId}`}>
                      <Button variant="secondary" className="w-full">View Profile</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
            />
          )}
        </>
      )}
    </div>
  );
}
