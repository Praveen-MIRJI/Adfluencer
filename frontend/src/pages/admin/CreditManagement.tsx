import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Coins, 
  Users, 
  TrendingUp, 
  DollarSign,
  ToggleLeft,
  ToggleRight,
  Save,
  Plus,
  Minus,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../lib/api';
import Button from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/Spinner';

interface CreditSettings {
  id: string;
  creditSystemEnabled: boolean;
  bidCreditPrice: number;
  postCreditPrice: number;
  freeBidsPerMonth: number;
  freePostsPerMonth: number;
  updatedAt: string;
  updatedBy: string;
}

interface CreditStats {
  credits: {
    totalBidCreditsInCirculation: number;
    totalPostCreditsInCirculation: number;
    totalBidCreditsUsed: number;
    totalPostCreditsUsed: number;
    totalBidCreditsPurchased: number;
    totalPostCreditsPurchased: number;
  };
  revenue: {
    totalRevenue: number;
    bidCreditRevenue: number;
    postCreditRevenue: number;
  };
  activity: {
    totalUsers: number;
    recentTransactions: number;
  };
}

interface UserCredit {
  id: string;
  userId: string;
  bidCredits: number;
  postCredits: number;
  totalBidCreditsUsed: number;
  totalPostCreditsUsed: number;
  totalBidCreditsPurchased: number;
  totalPostCreditsPurchased: number;
  User: {
    id: string;
    email: string;
    role: string;
    status: string;
  };
}

export default function CreditManagement() {
  const [settings, setSettings] = useState<CreditSettings | null>(null);
  const [stats, setStats] = useState<CreditStats | null>(null);
  const [users, setUsers] = useState<UserCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adjusting, setAdjusting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserCredit | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState(0);
  const [adjustmentType, setAdjustmentType] = useState<'BID' | 'POST'>('BID');
  const [adjustmentReason, setAdjustmentReason] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [settingsRes, statsRes, usersRes] = await Promise.all([
        api.get('/admin/credits/settings'),
        api.get('/admin/credits/stats'),
        api.get('/admin/credits/users?limit=50')
      ]);

      if (settingsRes.data.success) setSettings(settingsRes.data.data);
      if (statsRes.data.success) setStats(statsRes.data.data);
      if (usersRes.data.success) setUsers(usersRes.data.data);
    } catch (error) {
      console.error('Failed to fetch credit data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<CreditSettings>) => {
    try {
      setSaving(true);
      const response = await api.put('/admin/credits/settings', newSettings);
      
      if (response.data.success) {
        setSettings(response.data.data);
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const adjustUserCredits = async () => {
    if (!selectedUser || adjustmentAmount === 0) return;

    try {
      setAdjusting(selectedUser.id);
      const response = await api.post('/admin/credits/adjust-credits', {
        userId: selectedUser.userId,
        creditType: adjustmentType,
        amount: adjustmentAmount,
        reason: adjustmentReason
      });

      if (response.data.success) {
        // Refresh user data
        fetchData();
        setSelectedUser(null);
        setAdjustmentAmount(0);
        setAdjustmentReason('');
      }
    } catch (error) {
      console.error('Failed to adjust credits:', error);
    } finally {
      setAdjusting(null);
    }
  };

  const filteredUsers = users.filter(user =>
    user.User.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Credit System Management</h1>
          <p className="text-slate-400">Manage credit settings, pricing, and user balances</p>
        </div>
        <Button onClick={fetchData} variant="ghost" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Coins className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {(stats?.credits.totalBidCreditsInCirculation || 0) + (stats?.credits.totalPostCreditsInCirculation || 0)}
                </p>
                <p className="text-sm text-slate-400">Total Credits in Circulation</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">₹{stats?.revenue.totalRevenue || 0}</p>
                <p className="text-sm text-slate-400">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats?.activity.totalUsers || 0}</p>
                <p className="text-sm text-slate-400">Users with Credits</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats?.activity.recentTransactions || 0}</p>
                <p className="text-sm text-slate-400">Recent Transactions (30d)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Credit System Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-400" />
            <h2 className="text-lg font-semibold text-white">Credit System Settings</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* System Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
            <div>
              <h3 className="font-medium text-white">Enable Credit System</h3>
              <p className="text-sm text-slate-400">
                When enabled, users must purchase credits to bid or post ads
              </p>
            </div>
            <button
              onClick={() => updateSettings({ creditSystemEnabled: !settings?.creditSystemEnabled })}
              disabled={saving}
              className="flex items-center gap-2"
            >
              {settings?.creditSystemEnabled ? (
                <ToggleRight className="w-8 h-8 text-green-400" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-slate-500" />
              )}
            </button>
          </div>

          {/* Pricing Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Bid Credit Price (₹)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={settings?.bidCreditPrice || 5}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, bidCreditPrice: parseFloat(e.target.value) } : null)}
                  className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  min="0"
                  max="1000"
                  step="0.1"
                />
                <Button
                  onClick={() => updateSettings({ bidCreditPrice: settings?.bidCreditPrice })}
                  disabled={saving}
                  size="sm"
                >
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Post Credit Price (₹)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={settings?.postCreditPrice || 10}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, postCreditPrice: parseFloat(e.target.value) } : null)}
                  className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  min="0"
                  max="1000"
                  step="0.1"
                />
                <Button
                  onClick={() => updateSettings({ postCreditPrice: settings?.postCreditPrice })}
                  disabled={saving}
                  size="sm"
                >
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-700">
            <div className="text-center p-4 bg-blue-500/10 rounded-lg">
              <p className="text-2xl font-bold text-blue-400">₹{stats?.revenue.bidCreditRevenue || 0}</p>
              <p className="text-sm text-slate-400">Bid Credit Revenue</p>
            </div>
            <div className="text-center p-4 bg-green-500/10 rounded-lg">
              <p className="text-2xl font-bold text-green-400">₹{stats?.revenue.postCreditRevenue || 0}</p>
              <p className="text-sm text-slate-400">Post Credit Revenue</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Credit Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-400" />
              <h2 className="text-lg font-semibold text-white">User Credit Management</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900 border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Bid Credits</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Post Credits</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Total Used</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-700/50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-white">{user.User.email}</p>
                        <Badge variant={user.User.status === 'ACTIVE' ? 'success' : 'gray'} className="text-xs">
                          {user.User.status}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-xs">
                        {user.User.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-center">
                        <p className="font-medium text-white">{user.bidCredits}</p>
                        <p className="text-xs text-slate-400">Used: {user.totalBidCreditsUsed}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-center">
                        <p className="font-medium text-white">{user.postCredits}</p>
                        <p className="text-xs text-slate-400">Used: {user.totalPostCreditsUsed}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">
                        {user.totalBidCreditsUsed + user.totalPostCreditsUsed}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedUser(user)}
                        disabled={adjusting === user.id}
                      >
                        Adjust
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Credit Adjustment Modal */}
      {selectedUser && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedUser(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Adjust Credits for {selectedUser.User.email}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Credit Type
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAdjustmentType('BID')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      adjustmentType === 'BID'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    Bid Credits ({selectedUser.bidCredits})
                  </button>
                  <button
                    onClick={() => setAdjustmentType('POST')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      adjustmentType === 'POST'
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    Post Credits ({selectedUser.postCredits})
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Adjustment Amount
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAdjustmentAmount(Math.max(-1000, adjustmentAmount - 1))}
                    className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                  >
                    <Minus className="w-4 h-4 text-slate-300" />
                  </button>
                  <input
                    type="number"
                    value={adjustmentAmount}
                    onChange={(e) => setAdjustmentAmount(Math.max(-1000, Math.min(1000, parseInt(e.target.value) || 0)))}
                    className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-center"
                    min="-1000"
                    max="1000"
                  />
                  <button
                    onClick={() => setAdjustmentAmount(Math.min(1000, adjustmentAmount + 1))}
                    className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4 text-slate-300" />
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Positive values add credits, negative values remove credits
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Reason (Optional)
                </label>
                <textarea
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="Reason for adjustment..."
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="ghost"
                  onClick={() => setSelectedUser(null)}
                  className="flex-1"
                  disabled={adjusting === selectedUser.id}
                >
                  Cancel
                </Button>
                <Button
                  onClick={adjustUserCredits}
                  className="flex-1"
                  loading={adjusting === selectedUser.id}
                  disabled={adjustmentAmount === 0 || adjusting === selectedUser.id}
                >
                  Apply Adjustment
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}