import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, Star } from 'lucide-react';
import { format } from 'date-fns';
import api from '../lib/api';
import { Contract } from '../types';
import { useAuthStore } from '../store/authStore';
import { Card, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import ReviewModal from '../components/ReviewModal';
import toast from 'react-hot-toast';

export default function Contracts() {
  const { user } = useAuthStore();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [actionModal, setActionModal] = useState<{ type: 'complete' | 'cancel'; contract: Contract } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [reviewModal, setReviewModal] = useState<Contract | null>(null);

  useEffect(() => {
    fetchContracts();
  }, [statusFilter, pagination.page]);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: '10',
        ...(statusFilter && { status: statusFilter }),
      });
      const res = await api.get(`/contracts/my-contracts?${params}`);
      setContracts(res.data.data || []);
      if (res.data.pagination) {
        setPagination(prev => ({ ...prev, ...res.data.pagination }));
      }
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!actionModal?.contract) return;
    setActionLoading(true);
    try {
      await api.patch(`/contracts/${actionModal.contract.id}/complete`);
      toast.success('Contract marked as completed');
      setReviewModal(actionModal.contract);
      setActionModal(null);
      fetchContracts();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to complete contract');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!actionModal?.contract) return;
    setActionLoading(true);
    try {
      await api.patch(`/contracts/${actionModal.contract.id}/cancel`);
      toast.success('Contract cancelled');
      setActionModal(null);
      fetchContracts();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to cancel contract');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <Badge variant="info">Active</Badge>;
      case 'COMPLETED': return <Badge variant="success">Completed</Badge>;
      case 'CANCELLED': return <Badge variant="danger">Cancelled</Badge>;
      case 'DISPUTED': return <Badge variant="warning">Disputed</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <Clock className="w-5 h-5 text-blue-500" />;
      case 'COMPLETED': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'CANCELLED': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'DISPUTED': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default: return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const isClient = user?.role === 'CLIENT';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Contracts</h1>
          <p className="text-slate-400 mt-1">Manage your active and past contracts</p>
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-40"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : contracts.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No contracts found"
          description={statusFilter ? 'Try changing the filter' : 'Contracts will appear here when bids are accepted'}
        />
      ) : (
        <>
          <div className="space-y-4">
            {contracts.map((contract) => (
              <Card key={contract.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      {getStatusIcon(contract.status)}
                      <div>
                        <h3 className="font-semibold text-white">
                          {contract.advertisement?.title || 'Campaign'}
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">
                          {isClient ? (
                            <>With: {contract.influencer?.influencerProfile?.displayName || contract.influencer?.email}</>
                          ) : (
                            <>Client: {contract.client?.clientProfile?.companyName || contract.client?.email}</>
                          )}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                          <span>Agreed: ${contract.agreedPrice.toLocaleString()}</span>
                          <span>•</span>
                          <span>Due: {format(new Date(contract.deliveryDeadline), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(contract.status)}
                      {contract.status === 'ACTIVE' && isClient && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => setActionModal({ type: 'complete', contract })}
                          >
                            Complete
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => setActionModal({ type: 'cancel', contract })}
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  {contract.completedAt && (
                    <div className="flex items-center gap-2 mt-3">
                      <p className="text-sm text-green-600">
                        Completed on {format(new Date(contract.completedAt), 'MMM d, yyyy')}
                      </p>
                      {isClient && (
                        <button
                          onClick={() => setReviewModal(contract)}
                          className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                        >
                          <Star className="w-4 h-4" />
                          Leave Review
                        </button>
                      )}
                    </div>
                  )}
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

      {/* Action Modal */}
      <Modal
        isOpen={!!actionModal}
        onClose={() => setActionModal(null)}
        title={actionModal?.type === 'complete' ? 'Complete Contract' : 'Cancel Contract'}
      >
        <div className="space-y-4">
          <p className="text-slate-300">
            {actionModal?.type === 'complete'
              ? 'Are you sure you want to mark this contract as completed? This will allow you to leave a review.'
              : 'Are you sure you want to cancel this contract? This action cannot be undone.'}
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setActionModal(null)}>
              Cancel
            </Button>
            <Button
              variant={actionModal?.type === 'complete' ? 'primary' : 'danger'}
              loading={actionLoading}
              onClick={actionModal?.type === 'complete' ? handleComplete : handleCancel}
            >
              {actionModal?.type === 'complete' ? 'Complete' : 'Cancel Contract'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Review Modal */}
      {reviewModal && (
        <ReviewModal
          isOpen={!!reviewModal}
          onClose={() => setReviewModal(null)}
          influencerId={reviewModal.influencerId}
          advertisementId={reviewModal.advertisementId}
          influencerName={reviewModal.influencer?.influencerProfile?.displayName || reviewModal.influencer?.email || 'Influencer'}
        />
      )}
    </div>
  );
}
