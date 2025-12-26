import React, { useState } from 'react';
import { Wallet, Plus, CreditCard, Smartphone } from 'lucide-react';
import { initiatePayment } from '../utils/razorpay';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

interface WalletTopupProps {
  currentBalance: number;
  onSuccess?: () => void;
}

const presetAmounts = [100, 500, 1000, 2000, 5000];

const WalletTopup: React.FC<WalletTopupProps> = ({ currentBalance, onSuccess }) => {
  const { user } = useAuthStore();
  const [amount, setAmount] = useState<number>(500);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [processing, setProcessing] = useState(false);

  const handleAmountSelect = (value: number) => {
    setAmount(value);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomAmount(value);
    if (value && !isNaN(Number(value))) {
      setAmount(Number(value));
    }
  };

  const handleTopup = async () => {
    if (amount < 10) {
      toast.error('Minimum top-up amount is ₹10');
      return;
    }

    if (amount > 50000) {
      toast.error('Maximum top-up amount is ₹50,000');
      return;
    }

    setProcessing(true);

    initiatePayment({
      amount,
      purpose: 'WALLET_TOPUP',
      prefill: {
        email: user?.email,
      },
      onSuccess: () => {
        toast.success(`₹${amount} added to wallet successfully!`);
        onSuccess?.();
        setProcessing(false);
      },
      onError: (error) => {
        toast.error(error.message || 'Payment failed');
        setProcessing(false);
      },
    });
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-500/20 rounded-lg">
          <Wallet className="w-6 h-6 text-green-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Add Money to Wallet</h3>
          <p className="text-sm text-slate-400">Current Balance: ₹{currentBalance.toLocaleString()}</p>
        </div>
      </div>

      {/* Preset Amounts */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-300 mb-3">Select Amount</label>
        <div className="grid grid-cols-5 gap-2">
          {presetAmounts.map((preset) => (
            <button
              key={preset}
              onClick={() => handleAmountSelect(preset)}
              className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                amount === preset && !customAmount
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              ₹{preset}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Amount */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-300 mb-2">Or Enter Custom Amount</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
          <input
            type="number"
            value={customAmount}
            onChange={handleCustomAmountChange}
            placeholder="Enter amount"
            min="10"
            max="50000"
            className="w-full pl-8 pr-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <p className="text-xs text-slate-500 mt-1">Min: ₹10 | Max: ₹50,000</p>
      </div>

      {/* Payment Methods Info */}
      <div className="bg-slate-900/50 rounded-lg p-4 mb-6">
        <p className="text-sm text-slate-400 mb-3">Accepted Payment Methods</p>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 text-slate-300">
            <CreditCard className="w-5 h-5" />
            <span className="text-sm">Cards</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Smartphone className="w-5 h-5" />
            <span className="text-sm">UPI</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Wallet className="w-5 h-5" />
            <span className="text-sm">Net Banking</span>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-slate-900/50 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-slate-300">Amount to Add</span>
          <span className="text-xl font-bold text-white">₹{amount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center mt-2 text-sm">
          <span className="text-slate-400">New Balance</span>
          <span className="text-green-400">₹{(currentBalance + amount).toLocaleString()}</span>
        </div>
      </div>

      {/* Pay Button */}
      <button
        onClick={handleTopup}
        disabled={processing || amount < 10}
        className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {processing ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            Processing...
          </>
        ) : (
          <>
            <Plus className="w-5 h-5" />
            Add ₹{amount.toLocaleString()} to Wallet
          </>
        )}
      </button>

      <p className="text-xs text-slate-500 text-center mt-4">
        Secured by Razorpay. Your payment information is encrypted.
      </p>
    </div>
  );
};

export default WalletTopup;
