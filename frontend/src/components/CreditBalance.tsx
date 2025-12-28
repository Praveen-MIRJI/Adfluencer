import React, { useState, useEffect } from 'react';
import { Coins, Plus, History, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import Button from './ui/Button';
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
    // Only fetch data if credit system might be available
    // This prevents 500 errors when database tables don't exist
    const creditSystemAvailable = import.meta.env.VITE_CREDIT_SYSTEM_ENABLED === 'true';
    
    if (creditSystemAvailable) {
      fetchData();
    } else {
      // Set default disabled state
      setSettings({
        creditSystemEnabled: false,
        bidCreditPrice: 5,
        postCreditPrice: 10
      });
      setCredits({
        bidCredits: 0,
        postCredits: 0,
        totalBidCreditsUsed: 0,
        totalPostCreditsUsed: 0
      });
      setLoading(false);
    }
  }, []);

  const fetchData = async () => {
    try {
      const [creditsRes, settingsRes] = await Promise.all([
        api.get('/credits/balance'),
        api.get('/credits/settings')
      ]);

      if (creditsRes.data.success) {
        setCredits(creditsRes.data.data);
      }

      if (settingsRes.data.success) {
        setSettings(settingsRes.data.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch credit data:', error);
      // If the error is due to missing tables, set default values
      if (error.response?.status === 500) {
        setSettings({
          creditSystemEnabled: false,
          bidCreditPrice: 5,
          postCreditPrice: 10
        });
        setCredits({
          bidCredits: 0,
          postCredits: 0,
          totalBidCreditsUsed: 0,
          totalPostCreditsUsed: 0
        });
      }
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
      <div className={`animate-pulse bg-slate-800 rounded-lg p-4 ${className}`}>
        <div className="h-4 bg-slate-700 rounded w-24 mb-2"></div>
        <div className="h-6 bg-slate-700 rounded w-16"></div>
      </div>
    );
  }

  if (!settings?.creditSystemEnabled) {
    return null; // Don't show if credit system is disabled
  }

  return (
    <>
      <div className={`bg-slate-800 border border-slate-700 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-medium text-slate-300">Credits</span>
          </div>
          <div className="flex items-center gap-1">
            <Link
              to={`/${user?.role?.toLowerCase()}/credits`}
              className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
              title="View credit history"
            >
              <History className="w-3.5 h-3.5 text-slate-400 hover:text-slate-300" />
            </Link>
            {showPurchaseButton && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handlePurchaseClick(user?.role === 'CLIENT' ? 'POST' : 'BID')}
                className="text-xs px-2 py-1 h-auto"
              >
                <Plus className="w-3 h-3 mr-1" />
                Buy
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          {/* Bid Credits */}
          {(user?.role === 'INFLUENCER' || user?.role === 'ADMIN') && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                <span className="text-sm text-slate-400">Bid Credits</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">{credits?.bidCredits || 0}</span>
                {showPurchaseButton && (
                  <button
                    onClick={() => handlePurchaseClick('BID')}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                    title="Buy bid credits"
                  >
                    <ShoppingCart className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Post Credits */}
          {(user?.role === 'CLIENT' || user?.role === 'ADMIN') && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <span className="text-sm text-slate-400">Post Credits</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">{credits?.postCredits || 0}</span>
                {showPurchaseButton && (
                  <button
                    onClick={() => handlePurchaseClick('POST')}
                    className="text-green-400 hover:text-green-300 transition-colors"
                    title="Buy post credits"
                  >
                    <ShoppingCart className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pricing Info */}
        <div className="mt-3 pt-3 border-t border-slate-700">
          <div className="text-xs text-slate-500 space-y-1">
            {(user?.role === 'INFLUENCER' || user?.role === 'ADMIN') && (
              <div>Bid: ₹{settings?.bidCreditPrice} per credit</div>
            )}
            {(user?.role === 'CLIENT' || user?.role === 'ADMIN') && (
              <div>Post: ₹{settings?.postCreditPrice} per credit</div>
            )}
          </div>
        </div>
      </div>

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