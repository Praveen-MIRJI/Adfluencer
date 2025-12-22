import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { ArrowLeft, Calendar, DollarSign, Clock, Users, MessageSquare, Star, Check, X } from 'lucide-react';
import api from '../../lib/api';
import { Advertisement, Bid } from '../../types';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';

export default function ClientAdDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ad, setAd] = useState<Advertisement | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [messageModal, setMessageModal] = useState<{ open: boolean; influencerId: string; name: string }>({
    open: false, influencerId: '', name: ''
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchAd = async () => {
      try {
        const response = await api.get(`/advertisements/${id}`);
        setAd(response.data.data);
      } catch (error) {
        toast.error('Failed to load advertisement');
        navigate('/client/my-ads');
      } finally {
        setLoading(false);
      }
    };
    fetchAd();
  }, [id, navigate]);

  const handleBidAction = async (bidId: string, action: 'shortlist' | 'accept' | 'reject') => {
    setActionLoading(bidId);
    try {
      await api.patch(`/bids/${bidId}/${action}`);
      toast.success(`Bid ${action}ed successfully`);
      // Refresh data
      const response = await api.get(`/advertisements/${id}`);
      setAd(response.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || `Failed to ${action} bid`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCloseAd = async () => {
    if (!confirm('Are you sure you want to close this advertisement?')) return;
    try {
      await api.patch(`/advertisements/${id}/close`);
      toast.success('Advertisement closed');
      navigate('/client/my-ads');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to close advertisement');
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    try {
      await api.post('/messages', {
        receiverId: messageModal.influencerId,
        content: message,
      });
      toast.success('Message sent!');
      setMessageModal({ open: false, influencerId: '', name: '' });
      setMessage('');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const getBidStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <Badge variant="warning">Pending</Badge>;
      case 'SHORTLISTED': return <Badge variant="info">Shortlisted</Badge>;
      case 'ACCEPTED': return <Badge variant="success">Accepted</Badge>;
      case 'REJECTED': return <Badge variant="danger">Rejected</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  if (loading) return <PageLoader />;
  if (!ad) return null;

  return (
    <div>
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to My Ads
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{ad.title}</h1>
                <p className="text-gray-500 mt-1">{ad.category?.name}</p>
              </div>
              <Badge variant={ad.status === 'OPEN' ? 'success' : 'gray'}>
                {ad.status}
              </Badge>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{ad.description}</p>
              
              {ad.requirements && (
                <div className="mt-6">
                  <h3 className="font-medium text-gray-900 mb-2">Requirements</h3>
                  <p className="text-gray-600">{ad.requirements}</p>
                </div>
              )}

              {ad.targetAudience && (
                <div className="mt-4">
                  <h3 className="font-medium text-gray-900 mb-2">Target Audience</h3>
                  <p className="text-gray-600">{ad.targetAudience}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bids Section */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Bids ({ad.bids?.length || 0})
              </h2>
            </CardHeader>
            <CardContent>
              {!ad.bids?.length ? (
                <p className="text-gray-500 text-center py-8">No bids received yet</p>
              ) : (
                <div className="space-y-4">
                  {ad.bids.map((bid: Bid) => (
                    <div key={bid.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-600 font-medium">
                              {bid.influencer?.influencerProfile?.displayName?.[0] || 'I'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {bid.influencer?.influencerProfile?.displayName || 'Influencer'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {bid.influencer?.influencerProfile?.primaryNiche}
                            </p>
                          </div>
                        </div>
                        {getBidStatusBadge(bid.status)}
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                        <div>
                          <span className="text-gray-500">Proposed Price:</span>
                          <span className="ml-2 font-medium text-gray-900">${bid.proposedPrice}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Delivery:</span>
                          <span className="ml-2 font-medium text-gray-900">{bid.deliveryDays} days</span>
                        </div>
                      </div>

                      <p className="text-gray-600 text-sm mb-4">{bid.proposal}</p>

                      {bid.status === 'PENDING' && ad.status === 'OPEN' && (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleBidAction(bid.id, 'shortlist')}
                            loading={actionLoading === bid.id}
                          >
                            <Star className="h-4 w-4 mr-1" />
                            Shortlist
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleBidAction(bid.id, 'accept')}
                            loading={actionLoading === bid.id}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleBidAction(bid.id, 'reject')}
                            loading={actionLoading === bid.id}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setMessageModal({
                              open: true,
                              influencerId: bid.influencerId,
                              name: bid.influencer?.influencerProfile?.displayName || 'Influencer'
                            })}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Message
                          </Button>
                        </div>
                      )}

                      {bid.status === 'SHORTLISTED' && ad.status === 'OPEN' && (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleBidAction(bid.id, 'accept')}
                            loading={actionLoading === bid.id}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setMessageModal({
                              open: true,
                              influencerId: bid.influencerId,
                              name: bid.influencer?.influencerProfile?.displayName || 'Influencer'
                            })}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Message
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Budget</p>
                  <p className="font-medium">${ad.budgetMin} - ${ad.budgetMax}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Deadline</p>
                  <p className="font-medium">{format(new Date(ad.deadline), 'MMM d, yyyy')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-medium">{ad.duration}</p>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500 mb-1">Platform</p>
                <Badge variant="info">{ad.platform}</Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Content Type</p>
                <Badge>{ad.contentType}</Badge>
              </div>
            </CardContent>
          </Card>

          {ad.status === 'OPEN' && (
            <Button variant="danger" className="w-full" onClick={handleCloseAd}>
              Close Advertisement
            </Button>
          )}
        </div>
      </div>

      {/* Message Modal */}
      <Modal
        isOpen={messageModal.open}
        onClose={() => setMessageModal({ open: false, influencerId: '', name: '' })}
        title={`Message ${messageModal.name}`}
      >
        <div className="space-y-4">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your message..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            rows={4}
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setMessageModal({ open: false, influencerId: '', name: '' })}>
              Cancel
            </Button>
            <Button onClick={handleSendMessage} disabled={!message.trim()}>
              Send Message
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
