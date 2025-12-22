import { useState, useEffect } from 'react';
import { Star, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../lib/api';
import { Review } from '../../types';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [stats, setStats] = useState({ average: 0, total: 0, distribution: [0, 0, 0, 0, 0] });

  useEffect(() => {
    fetchReviews();
  }, [pagination.page]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reviews/my-reviews?page=${pagination.page}&limit=10`);
      const reviewsData = res.data.data || [];
      setReviews(reviewsData);
      if (res.data.pagination) {
        setPagination(prev => ({ ...prev, ...res.data.pagination }));
      }
      
      // Calculate stats
      if (reviewsData.length > 0) {
        const total = res.data.pagination?.total || reviewsData.length;
        const sum = reviewsData.reduce((acc: number, r: Review) => acc + r.rating, 0);
        const distribution = [0, 0, 0, 0, 0];
        reviewsData.forEach((r: Review) => distribution[r.rating - 1]++);
        setStats({
          average: sum / reviewsData.length,
          total,
          distribution,
        });
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Reviews</h1>
        <p className="text-gray-600 mt-1">See what clients are saying about your work</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No reviews yet"
          description="Complete campaigns to receive reviews from clients"
        />
      ) : (
        <>
          {/* Stats Overview */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="text-center">
                  <div className="text-5xl font-bold text-gray-900">{stats.average.toFixed(1)}</div>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${i < Math.round(stats.average) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{stats.total} reviews</p>
                </div>
                <div className="flex-1 w-full">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <div key={rating} className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-gray-600 w-3">{rating}</span>
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400 rounded-full"
                          style={{ width: `${stats.total > 0 ? (stats.distribution[rating - 1] / stats.total) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-500 w-8">{stats.distribution[rating - 1]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reviews List */}
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                        {review.client?.clientProfile?.avatar ? (
                          <img src={review.client.clientProfile.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          review.client?.clientProfile?.companyName?.charAt(0) || 'C'
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {review.client?.clientProfile?.companyName || 'Client'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {review.advertisement?.title}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                        />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <div className="mt-4 flex gap-3">
                      <MessageSquare className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <p className="text-gray-600">{review.comment}</p>
                    </div>
                  )}
                  <p className="text-sm text-gray-400 mt-4">
                    {format(new Date(review.createdAt), 'MMMM d, yyyy')}
                  </p>
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
