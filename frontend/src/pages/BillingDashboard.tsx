import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Wallet, 
  Crown, 
  History, 
  Settings,
  TrendingUp,
  Calendar,
  Download,
  Plus
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import MembershipPlans from '../components/MembershipPlans';
import WalletManagement from '../components/WalletManagement';
import toast from 'react-hot-toast';

interface BillingStats {
  totalSpent: number;
  currentBalance: number;
  activeSubscription: any;
  monthlySpending: number;
  transactionCount: number;
}

const BillingDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'subscription' | 'wallet' | 'history'>('overview');
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
      // Test if backend is accessible first
      const healthResponse = await fetch('/api/health');
      if (!healthResponse.ok) {
        console.error('Backend health check failed');
        return;
      }

      const [walletResponse, subscriptionResponse, paymentsResponse] = await Promise.all([
        fetch('/api/billing/wallet', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/billing/subscription', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/billing/payments?limit=100', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      // Handle responses more gracefully
      let walletData = { success: false, data: { balance: 0 } };
      let subscriptionData = { success: false, data: { status: 'NO_SUBSCRIPTION' } };
      let paymentsData = { success: false, data: [] };

      if (walletResponse.ok) {
        walletData = await walletResponse.json();
      } else {
        console.warn('Wallet endpoint failed:', walletResponse.status);
      }

      if (subscriptionResponse.ok) {
        subscriptionData = await subscriptionResponse.json();
      } else {
        console.warn('Subscription endpoint failed:', subscriptionResponse.status);
      }

      if (paymentsResponse.ok) {
        paymentsData = await paymentsResponse.json();
      } else {
        console.warn('Payments endpoint failed:', paymentsResponse.status);
      }

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
        currentBalance: walletData.success ? walletData.data.balance : 0,
        activeSubscription: subscriptionData.success && subscriptionData.data.status !== 'NO_SUBSCRIPTION' 
          ? subscriptionData.data : null,
        monthlySpending,
        transactionCount: paymentsData.success ? paymentsData.data.length : 0
      });
    } catch (error) {
      console.error('Error fetching billing stats:', error);
      // Set default values on error
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
            className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white mb-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <Crown className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{stats.activeSubscription.plan.name} Plan</h3>
                  <p className="text-purple-100">
                    Active until {new Date(stats.activeSubscription.endDate).toLocaleDateString('en-IN')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
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
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
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

            {activeTab === 'wallet' && (
              <div>
                <WalletManagement />
              </div>
            )}

            {activeTab === 'history' && (
              <div className="text-center py-12">
                <History className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Payment History</h3>
                <p className="text-slate-400 mb-6">
                  View and download your complete payment history
                </p>
                <button className="px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors">
                  View Full History
                </button>
              </div>
            )}
          </div>
        </div>
    </div>
  );
};

export default BillingDashboard;