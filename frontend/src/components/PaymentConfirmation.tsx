import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Wallet, AlertTriangle, CheckCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface PaymentConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  description: string;
  amount: number;
  actionType: 'BID' | 'ADVERTISEMENT' | 'MESSAGE' | 'SUBSCRIPTION';
  currentBalance?: number;
  requiresSubscription?: boolean;
}

const PaymentConfirmation: React.FC<PaymentConfirmationProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  amount,
  actionType,
  currentBalance = 0,
  requiresSubscription = false
}) => {
  const [processing, setProcessing] = useState(false);

  const handleConfirm = async () => {
    setProcessing(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Payment confirmation error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const getActionIcon = () => {
    switch (actionType) {
      case 'BID':
        return <CreditCard className="w-8 h-8 text-blue-600" />;
      case 'ADVERTISEMENT':
        return <CreditCard className="w-8 h-8 text-purple-600" />;
      case 'MESSAGE':
        return <CreditCard className="w-8 h-8 text-green-600" />;
      case 'SUBSCRIPTION':
        return <CreditCard className="w-8 h-8 text-orange-600" />;
      default:
        return <CreditCard className="w-8 h-8 text-gray-600" />;
    }
  };

  const getActionColor = () => {
    switch (actionType) {
      case 'BID': return 'from-blue-500 to-blue-600';
      case 'ADVERTISEMENT': return 'from-purple-500 to-purple-600';
      case 'MESSAGE': return 'from-green-500 to-green-600';
      case 'SUBSCRIPTION': return 'from-orange-500 to-orange-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const hasInsufficientBalance = currentBalance < amount;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-800 border border-slate-600/50 rounded-2xl max-w-md w-full shadow-2xl"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-600/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getActionIcon()}
              <h3 className="text-xl font-bold text-white">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-6">{description}</p>

          {/* Payment Details */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-300 font-medium">Amount to Pay</span>
              <span className="text-2xl font-bold text-white">₹{amount}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Current Wallet Balance</span>
              <span className={`font-medium ${hasInsufficientBalance ? 'text-red-600' : 'text-green-600'}`}>
                ₹{currentBalance.toLocaleString('en-IN')}
              </span>
            </div>

            {!hasInsufficientBalance && (
              <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-slate-600/50">
                <span className="text-slate-400">Balance After Payment</span>
                <span className="font-medium text-white">
                  ₹{(currentBalance - amount).toLocaleString('en-IN')}
                </span>
              </div>
            )}
          </div>

          {/* Insufficient Balance Warning */}
          {hasInsufficientBalance && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800 mb-1">Insufficient Balance</h4>
                  <p className="text-red-700 text-sm">
                    You need ₹{(amount - currentBalance).toLocaleString('en-IN')} more to complete this action.
                    Please add money to your wallet first.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Subscription Alternative */}
          {requiresSubscription && actionType === 'MESSAGE' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800 mb-1">Save with Subscription</h4>
                  <p className="text-blue-700 text-sm">
                    Get unlimited messaging with our Basic plan for just ₹100/month.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div className="mb-6">
            <h4 className="font-medium text-white mb-3">Payment Method</h4>
            <div className="border border-slate-600/50 rounded-lg p-3 flex items-center space-x-3">
              <Wallet className="w-5 h-5 text-blue-400" />
              <div>
                <div className="font-medium text-white">Wallet Balance</div>
                <div className="text-sm text-slate-400">Pay from your wallet balance</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            
            {hasInsufficientBalance ? (
              <button
                onClick={() => {
                  onClose();
                  // Navigate to wallet top-up
                  window.location.href = '/billing/wallet';
                }}
                className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Add Money
              </button>
            ) : (
              <button
                onClick={handleConfirm}
                disabled={processing}
                className={`flex-1 py-3 px-4 bg-gradient-to-r ${getActionColor()} text-white rounded-lg hover:opacity-90 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {processing ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  `Pay ₹${amount}`
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentConfirmation;