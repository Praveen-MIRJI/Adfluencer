import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Users, Instagram, Youtube, Twitter, ExternalLink, MessageCircle, Calendar, Award } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../lib/api';
import { InfluencerProfile as IInfluencerProfile, PortfolioItem, Review } from '../../types';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';

interface ProfileData extends IInfluencerProfile {
  user: { id: string; createdAt: string };
  portfolio: PortfolioItem[];
  reviews: Review[];
  stats: { completedCampaigns: number; totalReviews: number; averageRating: number };
}

export default function InfluencerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/influencers/${id}`);
      setProfile(res.data.data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
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

  if (loading) {
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  }

  if (!profile) {
    return <div className="text-center py-12 text-gray-500">Influencer not found</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-4xl font-bold flex-shrink-0">
              {profile.avatar ? (
                <img src={profile.avatar} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                profile.displayName?.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{profile.displayName}</h1>
                  {profile.primaryNiche && (
                    <Badge variant="info" className="mt-2">{profile.primaryNiche}</Badge>
                  )}
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                      <span className="font-semibold">{profile.stats.averageRating.toFixed(1)}</span>
                      <span className="text-gray-500">({profile.stats.totalReviews} reviews)</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                      <Award className="w-5 h-5" />
                      <span>{profile.stats.completedCampaigns} campaigns</span>
                    </div>
                  </div>
                </div>
                <Link to={`/client/messages?user=${id}`}>
                  <Button>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                </Link>
              </div>
              {profile.bio && (
                <p className="text-gray-600 mt-4">{profile.bio}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {profile.instagramFollowers && (
          <Card>
            <CardContent className="p-4 text-center">
              <Instagram className="w-6 h-6 mx-auto text-pink-600" />
              <p className="text-2xl font-bold mt-2">{formatFollowers(profile.instagramFollowers)}</p>
              <p className="text-sm text-gray-500">Instagram</p>
              {profile.instagramHandle && (
                <a href={`https://instagram.com/${profile.instagramHandle}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 hover:underline">
                  @{profile.instagramHandle}
                </a>
              )}
            </CardContent>
          </Card>
        )}
        {profile.youtubeSubscribers && (
          <Card>
            <CardContent className="p-4 text-center">
              <Youtube className="w-6 h-6 mx-auto text-red-600" />
              <p className="text-2xl font-bold mt-2">{formatFollowers(profile.youtubeSubscribers)}</p>
              <p className="text-sm text-gray-500">YouTube</p>
            </CardContent>
          </Card>
        )}
        {profile.twitterFollowers && (
          <Card>
            <CardContent className="p-4 text-center">
              <Twitter className="w-6 h-6 mx-auto text-blue-400" />
              <p className="text-2xl font-bold mt-2">{formatFollowers(profile.twitterFollowers)}</p>
              <p className="text-sm text-gray-500">Twitter</p>
            </CardContent>
          </Card>
        )}
        {profile.engagementRate && (
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="w-6 h-6 mx-auto text-green-600" />
              <p className="text-2xl font-bold mt-2">{profile.engagementRate.toFixed(1)}%</p>
              <p className="text-sm text-gray-500">Engagement</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolio */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Portfolio</h2>
          </CardHeader>
          <CardContent>
            {profile.portfolio.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No portfolio items yet</p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {profile.portfolio.map((item) => (
                  <div key={item.id} className="group relative">
                    {item.mediaType === 'IMAGE' ? (
                      <img src={item.mediaUrl} alt={item.title} className="w-full h-32 object-cover rounded-lg" />
                    ) : item.mediaType === 'VIDEO' ? (
                      <video src={item.mediaUrl} className="w-full h-32 object-cover rounded-lg" />
                    ) : (
                      <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                        <ExternalLink className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <p className="text-white text-sm font-medium px-2 text-center">{item.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reviews */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Reviews</h2>
          </CardHeader>
          <CardContent>
            {profile.reviews.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No reviews yet</p>
            ) : (
              <div className="space-y-4">
                {profile.reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                          {review.client?.clientProfile?.companyName?.charAt(0) || 'C'}
                        </div>
                        <span className="font-medium text-sm">{review.client?.clientProfile?.companyName || 'Client'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-600 mt-2">{review.comment}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {format(new Date(review.createdAt), 'MMM d, yyyy')} • {review.advertisement?.title}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
