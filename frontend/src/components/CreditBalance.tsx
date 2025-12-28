import React, { useState, useEffect } from 'react';
import { Coins, Plus, History, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import CreditPurchaseModal from './CreditPurchaseModal';

interface CreditBalanceProps {
  showPurchaseButton?: boolean;
  className?: string;
  onPurchaseSuccess?: () => void;
}

interface UserCredits {
  bidCredits: number;
  postCredits: number;
  totalBidCreditsUsed: number;
  totalPostCreditsUsed: number;
}

interface CreditSettings {
  creditSystemEnabled: boolean;
  bidCreditPrice: number;
  postCreditPrice: number;
}

const CreditBalance: React.FC<CreditBalanceProps> = ({
  showPurchaseButton = true,
  className = "",
  onPurchaseSuccess
}) => {
  const { user } = useAuthStore();
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [settings, setSettings] = useState<CreditSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseType, setPurchaseType] = useState<'BID' | 'POST'>('BID');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [creditsRes, settingsRes] = await Promise.all([
        api.get('/credits/balance').catch(err => ({ data: { success: false, error: err.message } })),
        api.get('/credits/settings').catch(err => ({ data: { success: false, error: err.message } }))
      ]);

      if (creditsRes.data.success) {
        setCredits(creditsRes.data.data);
      } else {
        // Set default credits if API fails
        setCredits({
          bidCredits: 0,
          postCredits: 0,
          totalBidCreditsUsed: 0,
          totalPostCreditsUsed: 0
        });
      }

      if (settingsRes.data.success) {
        setSettings(settingsRes.data.data);
      } else {
        // Set default settings if API fails
        setSettings({
          creditSystemEnabled: true,
          bidCreditPrice: 5,
          postCreditPrice: 10
        });
      }
    } catch (error: any) {
      console.error('Failed to fetch credit data:', error);
      // Set default values on any error
      setSettings({
        creditSystemEnabled: true,
        bidCreditPrice: 5,
        postCreditPrice: 10
      });
      setCredits({
        bidCredits: 0,
        postCredits: 0,
        totalBidCreditsUsed: 0,
        totalPostCreditsUsed: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseClick = (type: 'BID' | 'POST') => {
    setPurchaseType(type);
    setShowPurchaseModal(true);
  };

  const handlePurchaseSuccess = async () => {
    setShowPurchaseModal(false);
    // Small delay to ensure backend has processed the transaction
    await new Promise(resolve => setTimeout(resolve, 300));
    await fetchData(); // Refresh credit balance

    // Notify parent to refresh its data (e.g., wallet balance in BillingDashboard)
    if (onPurchaseSuccess) {
      onPurchaseSuccess();
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 ${className}`}>
        <div className="h-6 bg-slate-700 rounded-lg w-32 mb-4"></div>
        <div className="h-24 bg-slate-700 rounded-xl w-full"></div>
      </div>
    );
  }

  if (!settings) {
    return null; // Don't show if settings haven't loaded yet
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`relative overflow-hidden ${className}`}
      >
        {/* Main Card */}
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl p-8 shadow-2xl shadow-black/20">
          {/* Decorative gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 via-purple-500/5 to-blue-500/5 rounded-2xl pointer-events-none"></div>

          {/* Header */}
          <div className="relative flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-rose-500 to-purple-600 rounded-xl blur-xl opacity-50"></div>
                <div className="relative p-3 bg-gradient-to-br from-rose-500 to-purple-600 rounded-xl shadow-lg">
                  <Coins className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Credits</h3>
                <p className="text-sm text-slate-400 mt-0.5">Manage your credit balance</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to={`/${user?.role?.toLowerCase()}/credits`}
                className="p-2.5 hover:bg-slate-700/50 rounded-xl transition-all duration-200 hover:scale-110 group"
                title="View credit history"
              >
                <History className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
              </Link>
            </div>
          </div>

          {/* Credit Cards Grid */}
          <div className="relative space-y-4 mb-6">

            {/* Bid Credits */}
            {(user?.role === 'INFLUENCER' || user?.role === 'ADMIN') && (
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="relative bg-gradient-to-br from-blue-900/20 to-blue-800/10 backdrop-blur-sm border border-blue-500/20 rounded-xl p-5 group hover:border-blue-500/40 transition-all duration-300 shadow-lg hover:shadow-blue-500/20"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-3 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                      <Coins className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-300 mb-1">Bid Credits</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-white">{credits?.bidCredits || 0}</span>
                        <span className="text-sm text-slate-400">available</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">₹{settings?.bidCreditPrice} per credit</p>
                    </div>
                  </div>
                  {showPurchaseButton && (
                    <button
                      onClick={() => handlePurchaseClick('BID')}
                      className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl font-semibold transition-all duration-200 hover:scale-105 shadow-lg shadow-blue-500/30 flex items-center gap-2"
                      title="Buy bid credits"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Buy</span>
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* Post Credits */}
            {(user?.role === 'CLIENT' || user?.role === 'ADMIN') && (
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="relative bg-gradient-to-br from-rose-900/20 to-purple-900/10 backdrop-blur-sm border border-rose-500/20 rounded-xl p-5 group hover:border-rose-500/40 transition-all duration-300 shadow-lg hover:shadow-rose-500/20"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-3 bg-rose-500/20 rounded-lg group-hover:bg-rose-500/30 transition-colors">
                      <Coins className="w-5 h-5 text-rose-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-rose-300 mb-1">Post Credits</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-white">{credits?.postCredits || 0}</span>
                        <span className="text-sm text-slate-400">available</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">₹{settings?.postCreditPrice} per credit</p>
                    </div>
                  </div>
                  {showPurchaseButton && (
                    <button
                      onClick={() => handlePurchaseClick('POST')}
                      className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white rounded-xl font-semibold transition-all duration-200 hover:scale-105 shadow-lg shadow-rose-500/30 flex items-center gap-2"
                      title="Buy post credits"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Buy</span>
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Info Banner */}
          <div className="relative bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-500/20 rounded-lg">
                <ShoppingCart className="w-4 h-4 text-rose-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-white mb-1">How Credits Work</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {!settings?.creditSystemEnabled ? (
                    'Credit system is currently disabled. You can still purchase credits for future use.'
                  ) : (
                    user?.role === 'CLIENT'
                      ? 'Use 1 Post Credit to publish a campaign. Credits never expire and can be used anytime.'
                      : 'Use 1 Bid Credit to bid on a campaign. Credits never expire and can be used anytime.'
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Purchase Modal */}
      <AnimatePresence>
        {showPurchaseModal && (
          <CreditPurchaseModal
            creditType={purchaseType}
            settings={settings}
            onClose={() => setShowPurchaseModal(false)}
            onSuccess={handlePurchaseSuccess}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default CreditBalance;