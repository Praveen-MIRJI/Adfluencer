import { useState, useEffect } from 'react';
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, Star, DollarSign, Calendar, Building2, User } from 'lucide-react';
import { format } from 'date-fns';
import api from '../lib/api';
import { Contract } from '../types';
import { useAuthStore } from '../store/authStore';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import ReviewModal from '../components/ReviewModal';
import toast from 'react-hot-toast';

export default function Contracts() {
  const { user } = useAuthStore();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
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

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return {
          badge: 'bg-blue-500/20 border-blue-500/30 text-blue-300',
          border: 'border-blue-500/30 hover:border-blue-400/50',
          gradient: 'from-blue-500 via-cyan-500 to-blue-400',
          icon: <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />,
          shadow: 'hover:shadow-blue-500/15'
        };
      case 'COMPLETED':
        return {
          badge: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300',
          border: 'border-emerald-500/30 hover:border-emerald-400/50',
          gradient: 'from-emerald-500 via-green-500 to-emerald-400',
          icon: <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />,
          shadow: 'hover:shadow-emerald-500/15'
        };
      case 'CANCELLED':
        return {
          badge: 'bg-red-500/20 border-red-500/30 text-red-300',
          border: 'border-red-500/30 hover:border-red-400/50',
          gradient: 'from-red-500 via-rose-500 to-red-400',
          icon: <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />,
          shadow: 'hover:shadow-red-500/15'
        };
      case 'DISPUTED':
        return {
          badge: 'bg-amber-500/20 border-amber-500/30 text-amber-300',
          border: 'border-amber-500/30 hover:border-amber-400/50',
          gradient: 'from-amber-500 via-yellow-500 to-amber-400',
          icon: <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />,
          shadow: 'hover:shadow-amber-500/15'
        };
      default:
        return {
          badge: 'bg-slate-500/20 border-slate-500/30 text-slate-300',
          border: 'border-slate-700/50 hover:border-slate-600',
          gradient: 'from-slate-500 via-slate-400 to-slate-500',
          icon: <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />,
          shadow: 'hover:shadow-slate-500/15'
        };
    }
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const isClient = user?.role === 'CLIENT';

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-rose-400" />
            My Contracts
          </h1>
          <p className="text-slate-400 mt-1 text-sm sm:text-base">
            {contracts.length > 0 ? `${contracts.length} contract${contracts.length > 1 ? 's' : ''}` : 'Manage your contracts'}
          </p>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {[
          { value: '', label: 'All', icon: '📋' },
          { value: 'ACTIVE', label: 'Active', icon: '🔵' },
          { value: 'COMPLETED', label: 'Completed', icon: '✅' },
          { value: 'CANCELLED', label: 'Cancelled', icon: '❌' }
        ].map(({ value, label, icon }) => (
          <button
            key={value}
            onClick={() => setStatusFilter(value)}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 ${statusFilter === value
              ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/25'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700/50 hover:border-slate-600'
              }`}
          >
            <span>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
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
          {/* Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
            {contracts.map((contract) => {
              const statusStyles = getStatusStyles(contract.status);
              const daysLeft = getDaysUntilDeadline(contract.deliveryDeadline);
              const isOverdue = daysLeft < 0 && contract.status === 'ACTIVE';

              return (
                <div
                  key={contract.id}
                  className={`group relative bg-gradient-to-br from-slate-800/90 via-slate-800/80 to-slate-900/90 rounded-2xl border ${statusStyles.border} transition-all duration-300 overflow-hidden hover:shadow-xl ${statusStyles.shadow}`}
                >
                  {/* Status-based gradient bar */}
                  <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${statusStyles.gradient}`} />

                  <div className="p-4 sm:p-5">
                    {/* Top Row: Status Badge & Icon */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 sm:p-2 rounded-lg bg-gradient-to-br ${statusStyles.gradient.replace('from-', 'from-').split(' ')[0]}/20`}>
                          {statusStyles.icon}
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${statusStyles.badge}`}>
                          {contract.status}
                        </span>
                      </div>
                      {contract.status === 'ACTIVE' && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${isOverdue
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : daysLeft <= 3
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-700/50 text-slate-300 border border-slate-600/50'
                          }`}>
                          {isOverdue ? 'Overdue' : `${daysLeft} days left`}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-white mb-2 line-clamp-2 text-sm sm:text-base leading-tight">
                      {contract.advertisement?.title || 'Campaign'}
                    </h3>

                    {/* Partner Info */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-rose-500/20 to-pink-500/20 border border-rose-500/30 flex items-center justify-center flex-shrink-0">
                        {isClient ? (
                          <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" />
                        ) : (
                          <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500">{isClient ? 'Influencer' : 'Client'}</p>
                        <p className="text-xs sm:text-sm text-slate-300 truncate font-medium">
                          {isClient
                            ? (contract.influencer?.influencerProfile?.displayName || contract.influencer?.email)
                            : (contract.client?.clientProfile?.companyName || contract.client?.email)
                          }
                        </p>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4">
                      <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/5 border border-emerald-500/20 rounded-xl p-2 sm:p-2.5">
                        <div className="flex items-center gap-1 text-emerald-400 mb-0.5">
                          <DollarSign className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide">Agreed</span>
                        </div>
                        <p className="text-sm sm:text-base font-bold text-white">
                          ${contract.agreedPrice?.toLocaleString()}
                        </p>
                      </div>
                      <div className={`rounded-xl p-2 sm:p-2.5 ${isOverdue
                        ? 'bg-gradient-to-br from-red-500/15 to-rose-500/10 border border-red-500/30'
                        : 'bg-gradient-to-br from-slate-600/20 to-slate-700/20 border border-slate-600/30'
                        }`}>
                        <div className={`flex items-center gap-1 mb-0.5 ${isOverdue ? 'text-red-400' : 'text-slate-400'}`}>
                          <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide">Due</span>
                        </div>
                        <p className={`text-xs sm:text-sm font-bold ${isOverdue ? 'text-red-300' : 'text-white'}`}>
                          {format(new Date(contract.deliveryDeadline), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>

                    {/* Completed Info */}
                    {contract.completedAt && (
                      <div className="flex items-center justify-between py-2 px-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg mb-3">
                        <p className="text-xs sm:text-sm text-emerald-400">
                          ✓ Completed {format(new Date(contract.completedAt), 'MMM d, yyyy')}
                        </p>
                        {isClient && (
                          <button
                            onClick={() => setReviewModal(contract)}
                            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium"
                          >
                            <Star className="w-3.5 h-3.5" />
                            Review
                          </button>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    {contract.status === 'ACTIVE' && isClient && (
                      <div className="flex gap-2 pt-3 border-t border-slate-700/50">
                        <Button
                          size="sm"
                          className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
                          onClick={() => setActionModal({ type: 'complete', contract })}
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
                          Complete
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          className="flex-1"
                          onClick={() => setActionModal({ type: 'cancel', contract })}
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {pagination.totalPages > 1 && (
            <div className="mt-4 sm:mt-6">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
              />
            </div>
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

