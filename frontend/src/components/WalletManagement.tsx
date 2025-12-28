import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, History, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import api from '../lib/api';

interface WalletData {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

interface WalletTransaction {
  id: string;
  userId: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string;
  balanceAfter: number;
  resourceType?: string;
  resourceId?: string;
  transactionId?: string;
  createdAt: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface WalletManagementProps {
  onBalanceUpdate?: () => void;
}

const WalletManagement: React.FC<WalletManagementProps> = ({ onBalanceUpdate }) => {
  const { token } = useAuthStore();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingMoney, setAddingMoney] = useState(false);
  const [amount, setAmount] = useState('');
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchWalletData();
    fetchTransactions();
  }, []);

  const fetchWalletData = async () => {
    try {
      const response = await api.get('/billing/wallet');
      if (response.data.success) {
        setWallet(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      toast.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (pageNum = 1) => {
    try {
      const response = await api.get(`/billing/wallet/transactions?page=${pageNum}&limit=20`);
      if (response.data.success) {
        if (pageNum === 1) {
          setTransactions(response.data.data);
        } else {
          setTransactions(prev => [...prev, ...response.data.data]);
        }
        setHasMore(response.data.pagination.page < response.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleAddMoney = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);

    if (amountNum < 10) {
      toast.error('Minimum amount is ₹10');
      return;
    }

    if (amountNum > 50000) {
      toast.error('Maximum amount is ₹50,000');
      return;
    }

    setAddingMoney(true);

    try {
      // Create Razorpay order
      const response = await api.post('/billing/wallet/create-order', {
        amount: amountNum
      });

      if (response.data.success) {
        const { razorpayOrder } = response.data.data;

        // Initialize Razorpay
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: 'Adfluencer',
          description: `Add ₹${amountNum} to wallet`,
          order_id: razorpayOrder.id,
          handler: async (paymentResponse: any) => {
            try {
              // Verify payment
              const verifyResponse = await api.post('/billing/wallet/verify-payment', {
                orderId: paymentResponse.razorpay_order_id,
                paymentId: paymentResponse.razorpay_payment_id,
                signature: paymentResponse.razorpay_signature,
                amount: amountNum
              });

              if (verifyResponse.data.success) {
                // Update wallet balance immediately from response
                const newBalance = verifyResponse.data.data.newBalance;
                setWallet(prev => prev ? { ...prev, balance: newBalance } : null);
                
                toast.success(`₹${amountNum} added to wallet successfully!`);
                setAmount('');
                setShowAddMoney(false);
                setAddingMoney(false);
                
                // Also refresh transactions
                setPage(1);
                fetchTransactions(1);
                
                // Notify parent to refresh stats
                if (onBalanceUpdate) {
                  onBalanceUpdate();
                }
              } else {
                toast.error('Payment verification failed');
                setAddingMoney(false);
              }
            } catch (error) {
              console.error('Payment verification error:', error);
              toast.error('Payment verification failed');
              setAddingMoney(false);
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
              setAddingMoney(false);
            }
          }
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } else {
        toast.error(response.data.error || 'Failed to create payment order');
        setAddingMoney(false);
      }
    } catch (error: any) {
      console.error('Add money error:', error);
      toast.error(error.response?.data?.error || 'Failed to process payment');
      setAddingMoney(false);
    }
  };

  const loadMoreTransactions = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchTransactions(nextPage);
  };

  const getTransactionIcon = (type: string, resourceType?: string) => {
    if (type === 'CREDIT') {
      return <ArrowDownLeft className="w-5 h-5 text-green-600" />;
    } else {
      switch (resourceType) {
        case 'BID':
          return <ArrowUpRight className="w-5 h-5 text-blue-600" />;
        case 'ADVERTISEMENT':
          return <ArrowUpRight className="w-5 h-5 text-purple-600" />;
        case 'MESSAGE':
          return <ArrowUpRight className="w-5 h-5 text-orange-600" />;
        default:
          return <ArrowUpRight className="w-5 h-5 text-red-600" />;
      }
    }
  };

  const getTransactionColor = (type: string) => {
    return type === 'CREDIT' ? 'text-green-600' : 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Wallet Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-8 text-white mb-8 border border-slate-600/50"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <Wallet className="w-8 h-8" />
              <h2 className="text-2xl font-bold">My Wallet</h2>
            </div>
            <div className="text-4xl font-bold mb-2">
              ₹{wallet?.balance?.toLocaleString('en-IN') || '0'}
            </div>
            <p className="text-slate-300">Available Balance</p>
          </div>
          <div className="text-right">
            <button
              onClick={() => setShowAddMoney(true)}
              className="bg-slate-700/50 hover:bg-slate-600/50 backdrop-blur-sm px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 border border-slate-600/50"
            >
              <Plus className="w-5 h-5" />
              <span>Add Money</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-800/50 border border-slate-600/50 backdrop-blur-sm rounded-xl p-6 shadow-lg shadow-black/10">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-green-900/30 rounded-lg">
              <ArrowDownLeft className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="font-semibold text-white">Add Money</h3>
          </div>
          <p className="text-slate-400 text-sm mb-4">Top up your wallet for seamless transactions</p>
          <button
            onClick={() => setShowAddMoney(true)}
            className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Add Funds
          </button>
        </div>

        <div className="bg-slate-800/50 border border-slate-600/50 backdrop-blur-sm rounded-xl p-6 shadow-lg shadow-black/10">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-purple-900/30 rounded-lg">
              <History className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="font-semibold text-white">Transaction History</h3>
          </div>
          <p className="text-slate-400 text-sm mb-4">View all your transactions</p>
          <button
            onClick={() => fetchTransactions(1)}
            className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-slate-800/50 border border-slate-600/50 backdrop-blur-sm rounded-xl shadow-lg shadow-black/10">
        <div className="p-6 border-b border-slate-600/50">
          <h3 className="text-xl font-bold text-white">Recent Transactions</h3>
        </div>

        <div className="divide-y divide-slate-600/50">
          {transactions.length === 0 ? (
            <div className="p-8 text-center">
              <History className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-white mb-2">No transactions yet</h4>
              <p className="text-slate-400">Your transaction history will appear here</p>
            </div>
          ) : (
            transactions.map((transaction) => (
              <div key={transaction.id} className="p-6 hover:bg-slate-700/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-slate-700 rounded-lg">
                      {getTransactionIcon(transaction.type, transaction.resourceType)}
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{transaction.description}</h4>
                      <p className="text-sm text-slate-400">
                        {new Date(transaction.createdAt).toLocaleString('en-IN')}
                      </p>
                      {transaction.transactionId && (
                        <p className="text-xs text-slate-500">ID: {transaction.transactionId}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-semibold ${getTransactionColor(transaction.type)}`}>
                      {transaction.type === 'CREDIT' ? '+' : '-'}₹{transaction.amount}
                    </div>
                    <div className="text-sm text-slate-400">
                      Balance: ₹{transaction.balanceAfter}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {hasMore && transactions.length > 0 && (
          <div className="p-6 border-t border-slate-600/50 text-center">
            <button
              onClick={loadMoreTransactions}
              className="px-6 py-2 text-blue-400 border border-blue-500/50 rounded-lg hover:bg-blue-500/10 transition-colors"
            >
              Load More Transactions
            </button>
          </div>
        )}
      </div>

      {/* Add Money Modal */}
      {showAddMoney && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800 border border-slate-600/50 rounded-2xl p-8 max-w-md w-full mx-4"
          >
            <h3 className="text-2xl font-bold text-white mb-6">Add Money to Wallet</h3>

            <form onSubmit={handleAddMoney}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="10"
                  max="50000"
                  step="1"
                  className="w-full px-4 py-3 border border-slate-600 bg-slate-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  placeholder="Enter amount"
                  required
                />
                <p className="text-sm text-slate-400 mt-2">
                  Minimum: ₹10 | Maximum: ₹50,000
                </p>
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-4 gap-2 mb-6">
                {[100, 500, 1000, 2000].map((quickAmount) => (
                  <button
                    key={quickAmount}
                    type="button"
                    onClick={() => setAmount(quickAmount.toString())}
                    className={`py-2 px-3 text-sm border rounded-lg transition-colors ${
                      amount === quickAmount.toString()
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-slate-600 bg-slate-700 text-white hover:bg-slate-600'
                    }`}
                  >
                    ₹{quickAmount}
                  </button>
                ))}
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowAddMoney(false)}
                  className="flex-1 py-3 px-4 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingMoney || !amount}
                  className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {addingMoney ? 'Processing...' : 'Add Money'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default WalletManagement;
