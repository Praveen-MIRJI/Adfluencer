import React, { useState, useEffect } from 'react';
import { X, Coins, CreditCard, AlertCircle, CheckCircle, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Button from './ui/Button';
import api from '../lib/api';

interface CreditPurchaseModalProps {
  creditType: 'BID' | 'POST';
  settings: {
    bidCreditPrice: number;
    postCreditPrice: number;
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}

const CreditPurchaseModal: React.FC<CreditPurchaseModalProps> = ({
  creditType,
  settings,
  onClose,
  onSuccess
}) => {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);

  const pricePerCredit = creditType === 'BID' ? settings?.bidCreditPrice || 5 : settings?.postCreditPrice || 10;
  const totalAmount = quantity * pricePerCredit;
  const canPayWithWallet = walletBalance >= totalAmount;

  useEffect(() => {
    fetchWalletBalance();
  }, []);

  const fetchWalletBalance = async () => {
    try {
      const response = await api.get('/billing/wallet');
      if (response.data.success) {
        setWalletBalance(response.data.data?.balance || 0);
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
    }
  };

  const handlePurchase = async () => {
    try {
      setLoading(true);
      setError('');

      // Try to purchase (backend will use wallet if sufficient balance)
      const response = await api.post('/credits/purchase', {
        creditType,
        quantity,
        useWallet: true
      });

      if (response.data.success) {
        const { paymentMethod, requiresRazorpay, razorpayOrder } = response.data.data;

        // If paid with wallet, we're done
        if (paymentMethod === 'WALLET') {
          toast.success(`Successfully purchased ${quantity} ${creditType.toLowerCase()} credits from wallet!`);
          setLoading(false);
          onSuccess();
          onClose();
          return;
        }

        // If requires Razorpay (insufficient wallet balance)
        if (requiresRazorpay) {
          // Create Razorpay order
          const razorpayResponse = await api.post('/credits/purchase', {
            creditType,
            quantity,
            useWallet: false
          });

          if (razorpayResponse.data.success && razorpayResponse.data.data.razorpayOrder) {
            const order = razorpayResponse.data.data.razorpayOrder;
            openRazorpay(order);
          } else {
            setError('Failed to create payment order');
            setLoading(false);
          }
          return;
        }

        // If Razorpay order was created directly
        if (razorpayOrder) {
          openRazorpay(razorpayOrder);
        } else {
          setLoading(false);
        }
      } else {
        setError(response.data.error || 'Purchase failed');
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      setError(error.response?.data?.error || 'Failed to create purchase order');
      setLoading(false);
    }
  };

  const openRazorpay = (razorpayOrder: any) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      name: 'Adfluencer',
      description: `Purchase ${quantity} ${creditType.toLowerCase()} credits`,
      order_id: razorpayOrder.id,
      handler: async (response: any) => {
        try {
          const verifyResponse = await api.post('/credits/verify-payment', {
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature
          });

          if (verifyResponse.data.success) {
            toast.success(`Successfully purchased ${quantity} ${creditType.toLowerCase()} credits!`);
            onSuccess();
          } else {
            setError('Payment verification failed');
            setLoading(false);
          }
        } catch (error) {
          console.error('Payment verification error:', error);
          setError('Payment verification failed');
          setLoading(false);
        }
      },
      prefill: {
        name: 'User',
        email: 'user@example.com'
      },
      theme: {
        color: '#3B82F6'
      },
      modal: {
        ondismiss: () => {
          setLoading(false);
        }
      }
    };

    const razorpay = new (window as any).Razorpay(options);
    razorpay.open();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Coins className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Buy {creditType === 'BID' ? 'Bid' : 'Post'} Credits
              </h3>
              <p className="text-sm text-slate-400">
                ₹{pricePerCredit} per credit
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Wallet Balance Info */}
        <div className={`flex items-center gap-3 p-3 rounded-lg mb-4 ${canPayWithWallet ? 'bg-green-500/10 border border-green-500/30' : 'bg-amber-500/10 border border-amber-500/30'}`}>
          <Wallet className={`w-5 h-5 ${canPayWithWallet ? 'text-green-400' : 'text-amber-400'}`} />
          <div className="flex-1">
            <p className={`text-sm font-medium ${canPayWithWallet ? 'text-green-400' : 'text-amber-400'}`}>
              Wallet Balance: ₹{walletBalance.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-slate-400">
              {canPayWithWallet 
                ? 'Will be deducted from wallet' 
                : `Need ₹${(totalAmount - walletBalance).toLocaleString('en-IN')} more (will use Razorpay)`
              }
            </p>
          </div>
        </div>

        {/* Quantity Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Quantity
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              disabled={quantity <= 1}
            >
              -
            </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(1000, parseInt(e.target.value) || 1)))}
              className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-center"
              min="1"
              max="1000"
            />
            <button
              onClick={() => setQuantity(Math.min(1000, quantity + 1))}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              disabled={quantity >= 1000}
            >
              +
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Minimum: 1, Maximum: 1000 credits
          </p>
        </div>

        {/* Quick Select */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Quick Select
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[5, 10, 25, 50].map((amount) => (
              <button
                key={amount}
                onClick={() => setQuantity(amount)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  quantity === amount
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {amount}
              </button>
            ))}
          </div>
        </div>

        {/* Total Amount */}
        <div className="bg-slate-700/50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-300">Credits:</span>
            <span className="text-white">{quantity}</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-300">Price per credit:</span>
            <span className="text-white">₹{pricePerCredit}</span>
          </div>
          <div className="border-t border-slate-600 pt-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Total:</span>
              <span className="font-semibold text-xl text-blue-400">₹{totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg mb-4">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Benefits */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-slate-300 mb-2">What you get:</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>
                {quantity} {creditType === 'BID' ? 'bid' : 'post'} credit{quantity > 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>Instant activation</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>No expiration date</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            className="flex-1"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePurchase}
            className="flex-1"
            loading={loading}
            disabled={loading}
          >
            {canPayWithWallet ? (
              <>
                <Wallet className="w-4 h-4 mr-2" />
                Pay from Wallet
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Pay ₹{totalAmount}
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CreditPurchaseModal;
