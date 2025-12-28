import React, { useState, useEffect } from 'react';
import { ArrowLeft, Coins, Plus, Minus, Calendar, Filter, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { PageLoader } from '../components/ui/Spinner';
import CreditBalance from '../components/CreditBalance';

interface CreditTransaction {
  id: string;
  transactionType: string;
  creditType: 'BID' | 'POST';
  amount?: number;
  credits: number;
  balanceAfter: number;
  description: string;
  paymentStatus: string;
  createdAt: string;
  metadata?: any;
}

export default function CreditHistory() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'BID' | 'POST'>('ALL');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await api.get('/credits/history?limit=50');
      if (response.data.success) {
        setTransactions(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch credit history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string, credits: number) => {
    if (credits > 0) {
      return <Plus className="w-4 h-4 text-green-400" />;
    } else {
      return <Minus className="w-4 h-4 text-red-400" />;
    }
  };

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case 'PURCHASE_BID_CREDITS':
      case 'PURCHASE_POST_CREDITS':
        return <Badge variant="success">Purchase</Badge>;
      case 'USE_BID_CREDIT':
      case 'USE_POST_CREDIT':
        return <Badge variant="warning">Used</Badge>;
      case 'ADMIN_ADJUSTMENT':
        return <Badge variant="info">Admin Adjustment</Badge>;
      default:
        return <Badge variant="gray">{type}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success">Completed</Badge>;
      case 'PENDING':
        return <Badge variant="warning">Pending</Badge>;
      case 'FAILED':
        return <Badge variant="danger">Failed</Badge>;
      default:
        return <Badge variant="gray">{status}</Badge>;
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'ALL') return true;
    return tx.creditType === filter;
  });

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Credit History</h1>
            <p className="text-slate-400">Track your credit purchases and usage</p>
          </div>
        </div>
        <Button onClick={fetchTransactions} variant="ghost" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Credit Balance */}
      <CreditBalance />

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-400" />
              <h2 className="text-lg font-semibold text-white">Transaction History</h2>
            </div>
            <div className="flex gap-2">
              {['ALL', 'BID', 'POST'].map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType as any)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filter === filterType
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {filterType === 'ALL' ? 'All' : `${filterType} Credits`}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredTransactions.length === 0 ? (
            <div className="p-8 text-center">
              <Coins className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 mb-2">No transactions found</p>
              <p className="text-sm text-slate-500">
                {filter === 'ALL' 
                  ? 'Your credit transactions will appear here'
                  : `No ${filter.toLowerCase()} credit transactions found`
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {filteredTransactions.map((transaction) => (
                <div key={transaction.id} className="p-4 hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-slate-700 rounded-lg flex-shrink-0">
                        {getTransactionIcon(transaction.transactionType, transaction.credits)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-white truncate">
                            {transaction.description}
                          </p>
                          {getTransactionBadge(transaction.transactionType)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(transaction.createdAt), 'MMM d, yyyy HH:mm')}
                          </span>
                          <Badge 
                            variant={transaction.creditType === 'BID' ? 'info' : 'success'}
                            className="text-xs"
                          >
                            {transaction.creditType}
                          </Badge>
                          {getStatusBadge(transaction.paymentStatus)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-semibold ${
                          transaction.credits > 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {transaction.credits > 0 ? '+' : ''}{transaction.credits}
                        </span>
                        <span className="text-slate-400 text-sm">credits</span>
                      </div>
                      {transaction.amount && (
                        <p className="text-sm text-slate-400">₹{transaction.amount}</p>
                      )}
                      <p className="text-xs text-slate-500">
                        Balance: {transaction.balanceAfter}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {filteredTransactions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-400">
                +{filteredTransactions.filter(tx => tx.credits > 0).reduce((sum, tx) => sum + tx.credits, 0)}
              </p>
              <p className="text-sm text-slate-400">Credits Purchased</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-400">
                {filteredTransactions.filter(tx => tx.credits < 0).reduce((sum, tx) => sum + Math.abs(tx.credits), 0)}
              </p>
              <p className="text-sm text-slate-400">Credits Used</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-400">
                ₹{filteredTransactions.filter(tx => tx.amount).reduce((sum, tx) => sum + (tx.amount || 0), 0)}
              </p>
              <p className="text-sm text-slate-400">Total Spent</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}