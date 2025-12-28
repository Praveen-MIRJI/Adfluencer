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
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl p-8 w-full max-w-lg shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-2xl pointer-events-none"></div>

        {/* Header */}
        <div className="relative flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl blur-lg opacity-50"></div>
              <div className="relative p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-lg">
                <Coins className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Purchase Credits
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                {creditType === 'BID' ? 'Bid' : 'Post'} Credits • ₹{pricePerCredit} per credit
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-slate-700/50 rounded-xl transition-all duration-200 hover:scale-110 group"
          >
            <X className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
          </button>
        </div>

        {/* Wallet Balance Info */}
        <div className={`relative flex items-center gap-4 p-4 rounded-xl mb-6 backdrop-blur-sm border transition-all duration-300 ${canPayWithWallet
            ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30 shadow-lg shadow-green-500/10'
            : 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30 shadow-lg shadow-amber-500/10'
          }`}>
          <div className={`p-2.5 rounded-lg ${canPayWithWallet ? 'bg-green-500/20' : 'bg-amber-500/20'}`}>
            <Wallet className={`w-5 h-5 ${canPayWithWallet ? 'text-green-400' : 'text-amber-400'}`} />
          </div>
          <div className="flex-1">
            <p className={`text-sm font-semibold ${canPayWithWallet ? 'text-green-400' : 'text-amber-400'}`}>
              Wallet Balance: ₹{walletBalance.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {canPayWithWallet
                ? '✓ Sufficient balance - will be deducted from wallet'
                : `Need ₹${(totalAmount - walletBalance).toLocaleString('en-IN')} more (Razorpay payment required)`
              }
            </p>
          </div>
        </div>

        {/* Quantity Selection */}
        <div className="relative mb-6">
          <label className="block text-sm font-semibold text-slate-300 mb-3">
            Select Quantity
          </label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="p-3 bg-gradient-to-br from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-105 font-bold text-white text-lg"
              disabled={quantity <= 1}
            >
              −
            </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(1000, parseInt(e.target.value) || 1)))}
              className="flex-1 px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white text-center font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              min="1"
              max="1000"
            />
            <button
              onClick={() => setQuantity(Math.min(1000, quantity + 1))}
              className="p-3 bg-gradient-to-br from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-105 font-bold text-white text-lg"
              disabled={quantity >= 1000}
            >
              +
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">
            Min: 1 credit • Max: 1,000 credits
          </p>
        </div>

        {/* Quick Select */}
        <div className="relative mb-6">
          <label className="block text-sm font-semibold text-slate-300 mb-3">
            Quick Select
          </label>
          <div className="grid grid-cols-4 gap-3">
            {[5, 10, 25, 50].map((amount) => (
              <button
                key={amount}
                onClick={() => setQuantity(amount)}
                className={`relative px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105 ${quantity === amount
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30 border border-blue-500/50'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 border border-slate-600/30'
                  }`}
              >
                {amount}
              </button>
            ))}
          </div>
        </div>

        {/* Total Amount */}
        <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl p-5 mb-6 border border-slate-700/50 shadow-xl">
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-700/50">
            <span className="text-sm text-slate-400">Credits</span>
            <span className="text-white font-semibold">{quantity} credits</span>
          </div>
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-700/50">
            <span className="text-sm text-slate-400">Price per credit</span>
            <span className="text-white font-semibold">₹{pricePerCredit}</span>
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="font-bold text-white text-lg">Total Amount</span>
            <div className="text-right">
              <div className="font-bold text-2xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                ₹{totalAmount.toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {quantity} × ₹{pricePerCredit}
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 bg-gradient-to-r from-red-500/20 to-rose-500/20 border border-red-500/30 rounded-xl mb-6 shadow-lg shadow-red-500/10"
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-300 font-medium">{error}</p>
          </motion.div>
        )}

        {/* Benefits */}
        <div className="relative mb-8 bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
          <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            What You'll Get
          </h4>
          <div className="space-y-2.5">
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
              <span>
                <strong className="text-white">{quantity}</strong> {creditType === 'BID' ? 'bid' : 'post'} credit{quantity > 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
              <span>Instant activation & ready to use</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
              <span>No expiration date - use anytime</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="relative flex gap-4">
          <Button
            variant="ghost"
            onClick={onClose}
            className="flex-1 py-3 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 rounded-xl font-semibold transition-all duration-200 hover:scale-105"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePurchase}
            className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 shadow-lg ${canPayWithWallet
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-green-500/30'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-blue-500/30'
              }`}
            loading={loading}
            disabled={loading}
          >
            {loading ? (
              <span>Processing...</span>
            ) : canPayWithWallet ? (
              <span className="flex items-center justify-center gap-2">
                <Wallet className="w-4 h-4" />
                Pay from Wallet
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <CreditCard className="w-4 h-4" />
                Pay ₹{totalAmount.toLocaleString('en-IN')}
              </span>
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CreditPurchaseModal;
