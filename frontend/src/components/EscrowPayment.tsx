import React, { useState, useEffect } from 'react';
import {
  Shield, CheckCircle, Clock, AlertTriangle, Wallet, ArrowRight,
  CreditCard, FileCheck, DollarSign, Info, Loader2
} from 'lucide-react';
import { initiatePayment } from '../utils/razorpay';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface EscrowPaymentProps {
  contractId: string;
  amount: number;
  providerName: string;
  isClient: boolean;
  onUpdate?: () => void;
}

interface EscrowData {
  id: string;
  escrowStatus: string;
  grossAmount: number;
  razorpayFee: number;
  platformFee: number;
  providerPayout: number;
  paymentCapturedAt?: string;
  workSubmittedAt?: string;
  approvedAt?: string;
  paidOutAt?: string;
}

interface FeeBreakdown {
  grossAmount: number;
  razorpayFee: number;
  platformFee: number;
  providerPayout: number;
  platformFeePercent: number;
}

const statusFlow = [
  { key: 'CREATED', label: 'Payment Pending', icon: CreditCard },
  { key: 'HELD_IN_ESCROW', label: 'Payment Held', icon: Shield },
  { key: 'WORK_SUBMITTED', label: 'Work Submitted', icon: FileCheck },
  { key: 'APPROVED', label: 'Approved', icon: CheckCircle },
  { key: 'PAID_OUT', label: 'Paid Out', icon: Wallet },
];

const EscrowPayment: React.FC<EscrowPaymentProps> = ({
  contractId,
  amount,
  providerName,
  isClient,
  onUpdate,
}) => {
  const { user } = useAuthStore();
  const [escrow, setEscrow] = useState<EscrowData | null>(null);
  const [feeBreakdown, setFeeBreakdown] = useState<FeeBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [contractId]);

  const fetchData = async () => {
    try {
      // Fetch escrow if exists
      const { data: escrowRes } = await api.get(`/escrow/contract/${contractId}`);
      if (escrowRes.data) {
        setEscrow(escrowRes.data);
      }

      // Fetch fee breakdown
      const { data: feeRes } = await api.get(`/escrow/fee-breakdown?amount=${amount}`);
      if (feeRes.success) {
        setFeeBreakdown(feeRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch escrow data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAndPay = async () => {
    setProcessing(true);
    try {
      // Create escrow
      const { data } = await api.post('/escrow', { contractId });

      if (data.success && data.data.paymentOrder) {
        const { paymentOrder, escrow: newEscrow } = data.data;

        // Initiate Razorpay payment
        initiatePayment({
          amount: feeBreakdown?.grossAmount || amount,
          purpose: 'ESCROW',
          resourceId: newEscrow.id,
          prefill: { email: user?.email },
          onSuccess: async (response) => {
            // Verify payment
            try {
              await api.post('/escrow/verify-payment', {
                escrowId: newEscrow.id,
                orderId: paymentOrder.orderId,
                paymentId: response.data?.razorpay_payment_id || response.razorpay_payment_id,
                signature: response.data?.razorpay_signature || response.razorpay_signature,
              });
              toast.success('Payment secured in escrow!');
              fetchData();
              onUpdate?.();
            } catch (err) {
              toast.error('Payment verification failed');
            }
          },
          onError: (error) => {
            toast.error(error.message || 'Payment failed');
          },
        });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create escrow');
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmitWork = async () => {
    if (!escrow) return;
    setProcessing(true);
    try {
      await api.post(`/escrow/${escrow.id}/submit-work`);
      toast.success('Work submitted for review!');
      fetchData();
      onUpdate?.();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to submit work');
    } finally {
      setProcessing(false);
    }
  };

  const handleApprove = async () => {
    if (!escrow) return;
    setProcessing(true);
    try {
      await api.post(`/escrow/${escrow.id}/approve`);
      toast.success('Payment released to provider!');
      fetchData();
      onUpdate?.();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to release payment');
    } finally {
      setProcessing(false);
    }
  };

  const handleRefund = async () => {
    if (!escrow) return;
    if (!confirm('Are you sure? Razorpay fee is non-refundable.')) return;

    setProcessing(true);
    try {
      await api.post(`/escrow/${escrow.id}/refund`, { reason: 'Client requested refund' });
      toast.success('Refund processed!');
      fetchData();
      onUpdate?.();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to process refund');
    } finally {
      setProcessing(false);
    }
  };

  const getCurrentStatusIndex = () => {
    if (!escrow) return -1;
    return statusFlow.findIndex(s => s.key === escrow.escrowStatus);
  };

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      </div>
    );
  }

  const fees = escrow || feeBreakdown;
  const currentStatusIndex = getCurrentStatusIndex();

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-500/20 rounded-lg">
          <Shield className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Secure Escrow Payment</h3>
          <p className="text-sm text-slate-400">Protected by Razorpay</p>
        </div>
      </div>

      {/* Status Flow */}
      {escrow && (
        <div className="mb-6">
          <div className="flex items-center justify-between">
            {statusFlow.map((status, index) => {
              const Icon = status.icon;
              const isActive = index <= currentStatusIndex;
              const isCurrent = index === currentStatusIndex;

              return (
                <React.Fragment key={status.key}>
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isActive 
                        ? isCurrent 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-green-600 text-white'
                        : 'bg-slate-700 text-slate-400'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-xs mt-2 text-center ${isActive ? 'text-white' : 'text-slate-500'}`}>
                      {status.label}
                    </span>
                  </div>
                  {index < statusFlow.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 ${
                      index < currentStatusIndex ? 'bg-green-600' : 'bg-slate-700'
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Fee Breakdown */}
      {fees && (
        <div className="bg-slate-900/50 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Payment Breakdown
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between text-slate-300">
              <span>Total Amount</span>
              <span className="font-medium">₹{fees.grossAmount?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-400 text-sm">
              <span className="flex items-center gap-1">
                Payment Gateway Fee
                <Info className="w-3 h-3" title="Razorpay: 2% + 18% GST" />
              </span>
              <span>-₹{fees.razorpayFee?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-400 text-sm">
              <span>Platform Service Fee (10%)</span>
              <span>-₹{fees.platformFee?.toLocaleString()}</span>
            </div>
            <div className="border-t border-slate-700 pt-2 mt-2">
              <div className="flex justify-between text-white font-medium">
                <span>{providerName} receives</span>
                <span className="text-green-400">₹{fees.providerPayout?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Escrow Info */}
      <div className="bg-slate-900/30 rounded-lg p-4 mb-6">
        <h4 className="text-sm font-medium text-slate-300 mb-3">How Escrow Protects You</h4>
        <ul className="space-y-2 text-sm text-slate-400">
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <span>Payment is held securely until work is approved</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <span>Provider gets paid only after you approve deliverables</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <span>Dispute resolution available if issues arise</span>
          </li>
        </ul>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {/* No escrow - Client can create */}
        {!escrow && isClient && (
          <button
            onClick={handleCreateAndPay}
            disabled={processing}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {processing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Pay ₹{feeBreakdown?.grossAmount?.toLocaleString()} Securely
              </>
            )}
          </button>
        )}

        {/* Escrow held - Provider can submit work */}
        {escrow?.escrowStatus === 'HELD_IN_ESCROW' && !isClient && (
          <button
            onClick={handleSubmitWork}
            disabled={processing}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                <FileCheck className="w-5 h-5" />
                Submit Work for Review
              </>
            )}
          </button>
        )}

        {/* Work submitted - Client can approve */}
        {escrow?.escrowStatus === 'WORK_SUBMITTED' && isClient && (
          <>
            <button
              onClick={handleApprove}
              disabled={processing}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Approve & Release ₹{escrow.providerPayout?.toLocaleString()}
                </>
              )}
            </button>
            <button
              onClick={() => toast.error('Please review deliverables before raising a dispute')}
              className="w-full py-2 text-orange-400 hover:text-orange-300 text-sm"
            >
              Raise Dispute
            </button>
          </>
        )}

        {/* Escrow held - Client can refund (before work submitted) */}
        {escrow?.escrowStatus === 'HELD_IN_ESCROW' && isClient && (
          <button
            onClick={handleRefund}
            disabled={processing}
            className="w-full py-2 text-red-400 hover:text-red-300 text-sm"
          >
            Cancel & Request Refund
          </button>
        )}

        {/* Paid out */}
        {escrow?.escrowStatus === 'PAID_OUT' && (
          <div className="text-center py-4">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
            <p className="text-green-400 font-medium">Payment Completed</p>
            <p className="text-sm text-slate-400 mt-1">
              ₹{escrow.providerPayout?.toLocaleString()} released on{' '}
              {new Date(escrow.paidOutAt!).toLocaleDateString()}
            </p>
          </div>
        )}

        {/* Disputed */}
        {escrow?.escrowStatus === 'DISPUTED' && (
          <div className="text-center py-4">
            <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
            <p className="text-yellow-400 font-medium">Under Dispute</p>
            <p className="text-sm text-slate-400 mt-1">Our team is reviewing this case</p>
          </div>
        )}

        {/* Refunded */}
        {escrow?.escrowStatus === 'REFUNDED' && (
          <div className="text-center py-4">
            <ArrowRight className="w-12 h-12 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-400 font-medium">Refunded</p>
            <p className="text-sm text-slate-500 mt-1">Payment has been refunded</p>
          </div>
        )}
      </div>

      {/* Security Badge */}
      <div className="mt-6 pt-4 border-t border-slate-700 flex items-center justify-center gap-2 text-xs text-slate-500">
        <Shield className="w-4 h-4" />
        <span>Secured by Razorpay • 256-bit SSL Encryption</span>
      </div>
    </div>
  );
};

export default EscrowPayment;
