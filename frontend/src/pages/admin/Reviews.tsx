import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Star, Trash2, Eye } from 'lucide-react';
import api from '../../lib/api';
import { Pagination } from '../../types';
import Button from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import PaginationComponent from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';

interface Review {
  id: string; clientId: string; influencerId: string; advertisementId: string;
  rating: number; comment?: string; createdAt: string;
  client?: { email: string; clientProfile?: { companyName: string } };
  influencer?: { email: string; influencerProfile?: { displayName: string } };
  advertisement?: { title: string };
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchReviews = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      const response = await api.get(`/admin/reviews?${params}`);
      setReviews(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) { console.error('Failed to fetch reviews:', error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReviews(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    setDeleting(id);
    try {
      await api.delete(`/admin/reviews/${id}`);
      toast.success('Review deleted');
      fetchReviews(pagination?.page || 1);
    } catch (error: any) { toast.error(error.response?.data?.error || 'Failed to delete review'); }
    finally { setDeleting(null); }
  };

  const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : '0';

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Reviews Management</h1>
        <p className="text-slate-400 mt-1">Moderate platform reviews</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Reviews', value: pagination?.total || 0, icon: Star, color: 'amber' },
          { label: 'Average Rating', value: avgRating, icon: Star, color: 'yellow' },
          { label: '5 Star', value: reviews.filter(r => r.rating === 5).length, icon: Star, color: 'emerald' },
          { label: '1-2 Star', value: reviews.filter(r => r.rating <= 2).length, icon: Star, color: 'red' },
        ].map((stat, i) => (
          <Card key={i}><CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-${stat.color}-500/10`}><stat.icon className={`w-5 h-5 text-${stat.color}-400`} /></div>
            <div><p className="text-slate-400 text-xs">{stat.label}</p><p className="text-xl font-bold text-white">{stat.value}</p></div>
          </CardContent></Card>
        ))}
      </div>

      {loading ? <PageLoader /> : reviews.length === 0 ? (
        <EmptyState icon={Star} title="No reviews found" description="Reviews will appear when clients rate completed campaigns." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Campaign</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Influencer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {reviews.map((review) => (
                  <tr key={review.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4"><p className="text-white font-medium max-w-[180px] truncate">{review.advertisement?.title || 'N/A'}</p></td>
                    <td className="px-6 py-4 text-slate-300 text-sm">{review.client?.clientProfile?.companyName || review.client?.email}</td>
                    <td className="px-6 py-4 text-slate-300 text-sm">{review.influencer?.influencerProfile?.displayName || review.influencer?.email}</td>
                    <td className="px-6 py-4">{renderStars(review.rating)}</td>
                    <td className="px-6 py-4 text-slate-400 text-sm">{format(new Date(review.createdAt), 'MMM d, yyyy')}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setSelectedReview(review)}><Eye className="w-4 h-4" /></Button>
                        <Button size="sm" variant="danger" onClick={() => handleDelete(review.id)} loading={deleting === review.id}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination && pagination.totalPages > 1 && <div className="p-4 border-t border-slate-700/50"><PaginationComponent currentPage={pagination.page} totalPages={pagination.totalPages} onPageChange={fetchReviews} /></div>}
        </Card>
      )}

      {/* Review Details Modal */}
      <Modal isOpen={!!selectedReview} onClose={() => setSelectedReview(null)} title="Review Details">
        {selectedReview && (
          <div className="space-y-4">
            <div><p className="text-slate-400 text-sm">Campaign</p><p className="text-white text-lg font-semibold">{selectedReview.advertisement?.title}</p></div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-slate-400 text-sm">Client</p><p className="text-white">{selectedReview.client?.clientProfile?.companyName || selectedReview.client?.email}</p></div>
              <div><p className="text-slate-400 text-sm">Influencer</p><p className="text-white">{selectedReview.influencer?.influencerProfile?.displayName || selectedReview.influencer?.email}</p></div>
            </div>
            <div><p className="text-slate-400 text-sm mb-1">Rating</p>{renderStars(selectedReview.rating)}</div>
            {selectedReview.comment && <div><p className="text-slate-400 text-sm">Comment</p><p className="text-slate-300 mt-1">{selectedReview.comment}</p></div>}
            <div><p className="text-slate-400 text-sm">Date</p><p className="text-white">{format(new Date(selectedReview.createdAt), 'MMMM d, yyyy')}</p></div>
          </div>
        )}
      </Modal>
    </div>
  );
}
