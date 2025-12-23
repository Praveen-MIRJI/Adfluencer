import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Calendar, DollarSign, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../lib/api';
import { SavedAd } from '../../types';
import { Card, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
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

  const handleUnsave = async (advertisementId: string) => {
    try {
      await api.delete(`/saved-ads/${advertisementId}`);
      setSavedAds(prev => prev.filter(s => s.advertisementId !== advertisementId));
      toast.success('Advertisement removed from saved');
    } catch (error) {
      toast.error('Failed to remove advertisement');
    }
  };

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      INSTAGRAM: 'bg-pink-500/20 text-pink-400 border border-pink-500/30',
      YOUTUBE: 'bg-red-500/20 text-red-400 border border-red-500/30',
      TWITTER: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      TIKTOK: 'bg-slate-700 text-white border border-slate-600',
      FACEBOOK: 'bg-blue-600/20 text-blue-400 border border-blue-500/30',
      LINKEDIN: 'bg-blue-700/20 text-blue-400 border border-blue-600/30',
    };
    return colors[platform] || 'bg-slate-700 text-slate-300 border border-slate-600';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Saved Advertisements</h1>
        <p className="text-slate-400 mt-1">Campaigns you've bookmarked for later</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : savedAds.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No saved advertisements"
          description="Save interesting campaigns while browsing to review them later"
          action={
            <Link to="/influencer/browse">
              <Button>Browse Campaigns</Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="space-y-4">
            {savedAds.map((saved) => {
              const ad = saved.advertisement;
              if (!ad) return null;
              
              return (
                <Card key={saved.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPlatformColor(ad.platform)}`}>
                            {ad.platform}
                          </span>
                          <Badge variant={ad.status === 'OPEN' ? 'success' : 'gray'}>
                            {ad.status}
                          </Badge>
                        </div>
                        <Link to={`/influencer/ads/${ad.id}`}>
                          <h3 className="font-semibold text-white hover:text-rose-400">
                            {ad.title}
                          </h3>
                        </Link>
                        <p className="text-sm text-slate-400 mt-1">
                          {ad.client?.clientProfile?.companyName || 'Client'}
                        </p>
                        <p className="text-sm text-slate-300 mt-2 line-clamp-2">
                          {ad.description}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-sm text-slate-400">
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            <span>${ad.budgetMin.toLocaleString()} - ${ad.budgetMax.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Due {format(new Date(ad.deadline), 'MMM d, yyyy')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleUnsave(ad.id)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                          title="Remove from saved"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        {ad.status === 'OPEN' && (
                          <Link to={`/influencer/ads/${ad.id}`}>
                            <Button size="sm">View & Bid</Button>
                          </Link>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-3">
                      Saved on {format(new Date(saved.createdAt), 'MMM d, yyyy')}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
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
