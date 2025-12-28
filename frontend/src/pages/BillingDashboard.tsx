import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Wallet, 
  Crown, 
  History, 
  TrendingUp,
  Calendar,
  Download,
  Plus,
  Coins
} from 'lucide-react';
import MembershipPlans from '../components/MembershipPlans';
import WalletManagement from '../components/WalletManagement';
import CreditBalance from '../components/CreditBalance';
import api from '../lib/api';

interface BillingStats {
  totalSpent: number;
  currentBalance: number;
  activeSubscription: any;
  monthlySpending: number;
  transactionCount: number;
}

const BillingDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'credits' | 'subscription' | 'wallet' | 'history'>('overview');
  const [stats, setStats] = useState<BillingStats>({
    totalSpent: 0,
    currentBalance: 0,
    activeSubscription: null,
    monthlySpending: 0,
    transactionCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBillingStats();
  }, []);

  const fetchBillingStats = async () => {
    try {
      const [walletResponse, subscriptionResponse, paymentsResponse] = await Promise.all([
        api.get('/billing/wallet').catch(() => ({ data: { success: false, data: { balance: 0 } } })),
        api.get('/billing/subscription').catch(() => ({ data: { success: false, data: { status: 'NO_SUBSCRIPTION' } } })),
        api.get('/billing/payments?limit=100').catch(() => ({ data: { success: false, data: [] } }))
      ]);

      const walletData = walletResponse.data;
      const subscriptionData = subscriptionResponse.data;
      const paymentsData = paymentsResponse.data;

      let totalSpent = 0;
      let monthlySpending = 0;
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      if (paymentsData.success && paymentsData.data) {
        totalSpent = paymentsData.data.reduce((sum: number, payment: any) => sum + payment.amount, 0);
        monthlySpending = paymentsData.data
          .filter((payment: any) => {
            const paymentDate = new Date(payment.createdAt);
            return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
          })
          .reduce((sum: number, payment: any) => sum + payment.amount, 0);
      }

      setStats({
        totalSpent,
        currentBalance: walletData.success ? walletData.data?.balance || 0 : 0,
        activeSubscription: subscriptionData.success && subscriptionData.data?.status !== 'NO_SUBSCRIPTION' 
          ? subscriptionData.data : null,
        monthlySpending,
        transactionCount: paymentsData.success ? paymentsData.data?.length || 0 : 0
      });
    } catch (error) {
      console.error('Error fetching billing stats:', error);
      setStats({
        totalSpent: 0,
        currentBalance: 0,
        activeSubscription: null,
        monthlySpending: 0,
        transactionCount: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'credits', label: 'Credits', icon: Coins },
    { id: 'subscription', label: 'Subscription', icon: Crown },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'history', label: 'History', icon: History }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-800 via-slate-800 to-slate-700 rounded-2xl p-6 text-white">
        <h1 className="text-3xl font-bold text-white mb-2">Billing & Payments</h1>
        <p className="text-slate-300">Manage your subscription, wallet, and payment history</p>
      </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 border border-slate-600/50 backdrop-blur-sm rounded-xl p-6 shadow-lg shadow-black/10"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Wallet Balance</p>
                <p className="text-2xl font-bold text-white">
                  ₹{stats.currentBalance.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-3 bg-green-900/30 rounded-lg">
                <Wallet className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-800/50 border border-slate-600/50 backdrop-blur-sm rounded-xl p-6 shadow-lg shadow-black/10"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Total Spent</p>
                <p className="text-2xl font-bold text-white">
                  ₹{stats.totalSpent.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-3 bg-blue-900/30 rounded-lg">
                <CreditCard className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-800/50 border border-slate-600/50 backdrop-blur-sm rounded-xl p-6 shadow-lg shadow-black/10"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">This Month</p>
                <p className="text-2xl font-bold text-white">
                  ₹{stats.monthlySpending.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-3 bg-purple-900/30 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-800/50 border border-slate-600/50 backdrop-blur-sm rounded-xl p-6 shadow-lg shadow-black/10"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Subscription</p>
                <p className="text-lg font-bold text-white">
                  {stats.activeSubscription ? stats.activeSubscription.plan.name : 'None'}
                </p>
              </div>
              <div className="p-3 bg-orange-900/30 rounded-lg">
                <Crown className="w-6 h-6 text-orange-400" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Active Subscription Banner */}
        {stats.activeSubscription && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-4 lg:p-6 text-white mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <Crown className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg lg:text-xl font-bold">{stats.activeSubscription.plan.name} Plan</h3>
                  <p className="text-purple-100 text-sm lg:text-base">
                    Active until {new Date(stats.activeSubscription.endDate).toLocaleDateString('en-IN')}
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-xl lg:text-2xl font-bold">
                  ₹{stats.activeSubscription.plan.price}
                </div>
                <div className="text-purple-100 text-sm">
                  /{stats.activeSubscription.plan.billingCycle.toLowerCase()}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-slate-800/50 border border-slate-600/50 backdrop-blur-sm rounded-xl shadow-lg shadow-black/10 mb-8">
          <div className="border-b border-slate-600/50">
            <nav className="flex space-x-4 lg:space-x-8 px-4 lg:px-6 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-rose-500 text-rose-400'
                        : 'border-transparent text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Quick Actions */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => setActiveTab('credits')}
                        className="w-full p-4 text-left border border-slate-600/50 rounded-lg hover:bg-slate-700/50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <Coins className="w-5 h-5 text-amber-400" />
                          <div>
                            <div className="font-medium text-white">Buy Credits</div>
                            <div className="text-sm text-slate-400">Purchase post or bid credits</div>
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => setActiveTab('wallet')}
                        className="w-full p-4 text-left border border-slate-600/50 rounded-lg hover:bg-slate-700/50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <Plus className="w-5 h-5 text-green-400" />
                          <div>
                            <div className="font-medium text-white">Add Money to Wallet</div>
                            <div className="text-sm text-slate-400">Top up your wallet balance</div>
                          </div>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => setActiveTab('subscription')}
                        className="w-full p-4 text-left border border-slate-600/50 rounded-lg hover:bg-slate-700/50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <Crown className="w-5 h-5 text-purple-400" />
                          <div>
                            <div className="font-medium text-white">
                              {stats.activeSubscription ? 'Manage Subscription' : 'Subscribe to Plan'}
                            </div>
                            <div className="text-sm text-slate-400">
                              {stats.activeSubscription ? 'View or modify your subscription' : 'Get unlimited access'}
                            </div>
                          </div>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => setActiveTab('history')}
                        className="w-full p-4 text-left border border-slate-600/50 rounded-lg hover:bg-slate-700/50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <Download className="w-5 h-5 text-blue-400" />
                          <div>
                            <div className="font-medium text-white">Download Statements</div>
                            <div className="text-sm text-slate-400">Get your payment history</div>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                      <div className="text-center py-8 text-slate-400">
                        <History className="w-12 h-12 mx-auto mb-3 text-slate-500" />
                        <p>No recent activity</p>
                        <p className="text-sm">Your recent transactions will appear here</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'subscription' && (
              <div>
                <MembershipPlans />
              </div>
            )}

            {activeTab === 'credits' && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-white mb-2">Purchase Credits</h3>
                  <p className="text-slate-400">Buy credits to post campaigns or bid on opportunities</p>
                </div>
                <div className="max-w-md mx-auto">
                  <CreditBalance showPurchaseButton={true} className="w-full" onPurchaseSuccess={fetchBillingStats} />
                </div>
                <div className="mt-8 p-4 bg-slate-700/30 rounded-lg">
                  <h4 className="font-medium text-white mb-3">How Credits Work</h4>
                  <ul className="space-y-2 text-sm text-slate-400">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400">•</span>
                      <span><strong className="text-white">Post Credits (Brands):</strong> Use 1 credit to post a campaign. ₹10 per credit.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400">•</span>
                      <span><strong className="text-white">Bid Credits (Creators):</strong> Use 1 credit to bid on a campaign. ₹5 per credit.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400">•</span>
                      <span>Credits never expire and can be used anytime.</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'wallet' && (
              <div>
                <WalletManagement onBalanceUpdate={fetchBillingStats} />
              </div>
            )}

            {activeTab === 'history' && (
              <PaymentHistory />
            )}
          </div>
        </div>
    </div>
  );
};

// Payment History Component
const PaymentHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'wallet' | 'credits'>('all');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const [walletRes, creditsRes, paymentsRes] = await Promise.all([
        api.get('/billing/wallet/transactions?limit=50').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/credits/history?limit=50').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/billing/payments?limit=50').catch(() => ({ data: { success: false, data: [] } }))
      ]);

      const allTransactions: any[] = [];

      // Add wallet transactions
      if (walletRes.data.success && walletRes.data.data) {
        walletRes.data.data.forEach((t: any) => {
          allTransactions.push({
            ...t,
            source: 'wallet',
            displayType: t.type === 'CREDIT' ? 'Wallet Top-up' : 'Wallet Debit',
            displayAmount: t.amount,
            isCredit: t.type === 'CREDIT'
          });
        });
      }

      // Add credit transactions
      if (creditsRes.data.success && creditsRes.data.data) {
        creditsRes.data.data.forEach((t: any) => {
          allTransactions.push({
            ...t,
            source: 'credits',
            displayType: t.transactionType?.includes('PURCHASE') ? 'Credit Purchase' : 'Credit Used',
            displayAmount: t.amount || 0,
            isCredit: t.credits > 0
          });
        });
      }

      // Add payment transactions
      if (paymentsRes.data.success && paymentsRes.data.data) {
        paymentsRes.data.data.forEach((t: any) => {
          allTransactions.push({
            ...t,
            source: 'payment',
            displayType: 'Payment',
            displayAmount: t.amount,
            isCredit: false
          });
        });
      }

      // Sort by date descending
      allTransactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setTransactions(allTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'wallet') return t.source === 'wallet';
    if (activeFilter === 'credits') return t.source === 'credits';
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {['all', 'wallet', 'credits'].map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === filter
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </button>
        ))}
        <button
          onClick={fetchTransactions}
          className="ml-auto px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors text-sm"
        >
          Refresh
        </button>
      </div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <div className="text-center py-12">
          <History className="w-16 h-16 text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No transactions yet</h3>
          <p className="text-slate-400">Your transaction history will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTransactions.map((transaction, index) => (
            <div
              key={`${transaction.source}-${transaction.id}-${index}`}
              className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${
                  transaction.isCredit ? 'bg-green-500/20' : 'bg-red-500/20'
                }`}>
                  {transaction.isCredit ? (
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  ) : (
                    <CreditCard className="w-5 h-5 text-red-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-white">{transaction.description || transaction.displayType}</p>
                  <p className="text-sm text-slate-400">
                    {new Date(transaction.createdAt).toLocaleString('en-IN')}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    transaction.source === 'wallet' ? 'bg-blue-500/20 text-blue-400' :
                    transaction.source === 'credits' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-purple-500/20 text-purple-400'
                  }`}>
                    {transaction.source}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${transaction.isCredit ? 'text-green-400' : 'text-red-400'}`}>
                  {transaction.isCredit ? '+' : '-'}₹{transaction.displayAmount?.toLocaleString('en-IN') || '0'}
                </p>
                {transaction.balanceAfter !== undefined && (
                  <p className="text-xs text-slate-500">
                    Balance: ₹{transaction.balanceAfter?.toLocaleString('en-IN')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BillingDashboard;