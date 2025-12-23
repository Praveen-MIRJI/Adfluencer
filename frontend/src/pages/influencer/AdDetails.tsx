import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { ArrowLeft, Calendar, DollarSign, Clock, Building2, Users, Bookmark, BookmarkCheck, MessageCircle } from 'lucide-react';
import api from '../../lib/api';
import { Advertisement } from '../../types';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/Spinner';

interface BidForm {
  proposedPrice: number;
  proposal: string;
  deliveryDays: number;
}

export default function AdDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [ad, setAd] = useState<Advertisement | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savingAd, setSavingAd] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<BidForm>();

  useEffect(() => {
    const fetchAd = async () => {
      try {
        const [adResponse, savedResponse] = await Promise.all([
          api.get(`/advertisements/${id}`),
          api.get(`/saved-ads/check/${id}`),
        ]);
        setAd(adResponse.data.data);
        setIsSaved(savedResponse.data.data?.isSaved || false);
        
        // Check if user has already applied
        const userBid = adResponse.data.data.bids?.find(
          (bid: any) => bid.influencerId === user?.id
        );
        setHasApplied(!!userBid);
      } catch (error) {
        toast.error('Failed to load advertisement');
        navigate('/influencer/browse');
      } finally {
        setLoading(false);
      }
    };
    fetchAd();
  }, [id, navigate, user?.id]);

  const toggleSave = async () => {
    setSavingAd(true);
    try {
      if (isSaved) {
        await api.delete(`/saved-ads/${id}`);
        setIsSaved(false);
        toast.success('Removed from saved');
      } else {
        await api.post('/saved-ads', { advertisementId: id });
        setIsSaved(true);
        toast.success('Saved for later');
      }
    } catch (error) {
      toast.error('Failed to update saved status');
    } finally {
      setSavingAd(false);
    }
  };

  const onSubmit = async (data: BidForm) => {
    setSubmitting(true);
    try {
      await api.post('/bids', {
        advertisementId: id,
        ...data,
      });
      toast.success('Bid submitted successfully!');
      navigate('/influencer/my-bids');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to submit bid');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!ad) return null;

  const isDeadlinePassed = new Date(ad.deadline) < new Date();
  const canApply = ad.status === 'OPEN' && !isDeadlinePassed && !hasApplied;

  return (
    <div>
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to Browse
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="info">{ad.platform}</Badge>
                  <Badge>{ad.contentType}</Badge>
                </div>
                <h1 className="text-xl font-bold text-white">{ad.title}</h1>
                <p className="text-slate-400 mt-1">{ad.category?.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleSave}
                  disabled={savingAd}
                  className={`p-2 rounded-lg transition-colors ${
                    isSaved 
                      ? 'bg-rose-500/20 text-rose-400' 
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                  title={isSaved ? 'Remove from saved' : 'Save for later'}
                >
                  {isSaved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                </button>
                <Badge variant={ad.status === 'OPEN' ? 'success' : 'gray'}>
                  {ad.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 whitespace-pre-wrap">{ad.description}</p>
              
              {ad.requirements && (
                <div className="mt-6">
                  <h3 className="font-medium text-white mb-2">Requirements</h3>
                  <p className="text-slate-300">{ad.requirements}</p>
                </div>
              )}

              {ad.targetAudience && (
                <div className="mt-4">
                  <h3 className="font-medium text-white mb-2">Target Audience</h3>
                  <p className="text-slate-300">{ad.targetAudience}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bid Form */}
          {canApply && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-white">Submit Your Bid</h2>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <Input
                      label="Proposed Price ($)"
                      type="number"
                      min="1"
                      placeholder={`${ad.budgetMin} - ${ad.budgetMax}`}
                      {...register('proposedPrice', {
                        required: 'Price is required',
                        min: { value: 1, message: 'Price must be at least $1' },
                      })}
                      error={errors.proposedPrice?.message}
                    />

                    <Input
                      label="Delivery Time (days)"
                      type="number"
                      min="1"
                      {...register('deliveryDays', {
                        required: 'Delivery time is required',
                        min: { value: 1, message: 'Must be at least 1 day' },
                      })}
                      error={errors.deliveryDays?.message}
                    />
                  </div>

                  <Textarea
                    label="Your Proposal"
                    rows={5}
                    placeholder="Explain why you're the best fit for this campaign..."
                    {...register('proposal', {
                      required: 'Proposal is required',
                      minLength: { value: 20, message: 'Proposal must be at least 20 characters' },
                    })}
                    error={errors.proposal?.message}
                  />

                  <Button type="submit" loading={submitting}>
                    Submit Bid
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {hasApplied && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <p className="text-green-400 font-medium">You have already submitted a bid for this advertisement.</p>
              <p className="text-green-400/70 text-sm mt-1">Check your bids page to track its status.</p>
            </div>
          )}

          {isDeadlinePassed && !hasApplied && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <p className="text-yellow-400 font-medium">The deadline for this advertisement has passed.</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-400">Budget</p>
                  <p className="font-medium text-white">${ad.budgetMin} - ${ad.budgetMax}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-400">Deadline</p>
                  <p className={`font-medium ${isDeadlinePassed ? 'text-red-400' : 'text-white'}`}>
                    {format(new Date(ad.deadline), 'MMM d, yyyy')}
                    {isDeadlinePassed && ' (Passed)'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-400">Duration</p>
                  <p className="font-medium text-white">{ad.duration}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-400">Bids Received</p>
                  <p className="font-medium text-white">{ad.bids?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-semibold text-white">Posted By</h3>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-rose-400" />
                </div>
                <div>
                  <p className="font-medium text-white">
                    {ad.client?.clientProfile?.companyName || 'Client'}
                  </p>
                  {ad.client?.clientProfile?.industry && (
                    <p className="text-sm text-slate-400">{ad.client.clientProfile.industry}</p>
                  )}
                </div>
              </div>
              <Link to={`/influencer/messages?user=${ad.clientId}`}>
                <Button variant="secondary" className="w-full">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message Client
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
