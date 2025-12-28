import React, { useState, useEffect } from 'react';
import { AlertTriangle, Shield, Wallet, X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';

interface BannerData {
  kycStatus: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';
  isVerified: boolean;
  walletBalance: number;
}

const ActionBanner: React.FC = () => {
  const { user } = useAuthStore();
  const [bannerData, setBannerData] = useState<BannerData>({
    kycStatus: 'NOT_SUBMITTED',
    isVerified: false,
    walletBalance: 0
  });
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    fetchBannerData();
    // Load dismissed banners from localStorage
    const dismissedBanners = JSON.parse(localStorage.getItem('dismissedBanners') || '[]');
    setDismissed(dismissedBanners);
  }, []);

  const fetchBannerData = async () => {
    try {
      const [kycResponse, creditsResponse] = await Promise.all([
        api.get('/kyc/status'),
        api.get('/credits/balance')
      ]);

      const kycData = kycResponse.data;
      const creditsData = creditsResponse.data;

      setBannerData({
        kycStatus: kycData.success ? kycData.data.status || 'NOT_SUBMITTED' : 'NOT_SUBMITTED',
        isVerified: kycData.success ? kycData.data.isVerified || false : false,
        walletBalance: creditsData.success 
          ? (creditsData.data.bidCredits || 0) + (creditsData.data.postCredits || 0) 
          : 0
      });
    } catch (error) {
      console.error('Error fetching banner data:', error);
    } finally {
      setLoading(false);
    }
  };

  const dismissBanner = (bannerId: string) => {
    const newDismissed = [...dismissed, bannerId];
    setDismissed(newDismissed);
    localStorage.setItem('dismissedBanners', JSON.stringify(newDismissed));
  };

  if (loading || !user || user.role === 'ADMIN') return null;

  const banners = [];
  const basePath = user.role === 'CLIENT' ? '/client' : '/influencer';

  // KYC Verification Banner
  if (!bannerData.isVerified && bannerData.kycStatus !== 'PENDING' && !dismissed.includes('kyc-verification')) {
    banners.push({
      id: 'kyc-verification',
      type: 'warning',
      icon: Shield,
      title: 'Complete KYC Verification',
      message: bannerData.kycStatus === 'REJECTED' 
        ? 'Your KYC was rejected. Please resubmit with correct information.'
        : 'Verify your identity to unlock all platform features and build trust.',
      action: 'Verify Now',
      link: `${basePath}/kyc`,
      color: 'bg-yellow-50 border-yellow-200 text-yellow-800'
    });
  }

  // Low Credits Banner
  if (bannerData.walletBalance < 5 && !dismissed.includes('low-balance')) {
    banners.push({
      id: 'low-balance',
      type: 'info',
      icon: Wallet,
      title: 'Low Credits',
      message: `You have ${bannerData.walletBalance} credits remaining. Purchase more to continue posting ads or bidding.`,
      action: 'Buy Credits',
      link: `${basePath}/credits`,
      color: 'bg-blue-50 border-blue-200 text-blue-800'
    });
  }

  // KYC Under Review Banner
  if (bannerData.kycStatus === 'PENDING' && !dismissed.includes('kyc-pending')) {
    banners.push({
      id: 'kyc-pending',
      type: 'info',
      icon: Shield,
      title: 'KYC Under Review',
      message: 'Your KYC verification is being reviewed. This typically takes 24-48 hours.',
      action: 'View Status',
      link: `${basePath}/kyc`,
      color: 'bg-blue-50 border-blue-200 text-blue-800'
    });
  }

  if (banners.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      {banners.map((banner) => {
        const Icon = banner.icon;
        return (
          <div
            key={banner.id}
            className={`rounded-lg border p-4 ${banner.color}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <Icon className="w-5 h-5 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">{banner.title}</h3>
                  <p className="text-sm mt-1 opacity-90">{banner.message}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Link
                  to={banner.link}
                  className="inline-flex items-center space-x-1 text-sm font-medium hover:underline"
                >
                  <span>{banner.action}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => dismissBanner(banner.id)}
                  className="p-1 hover:bg-black/10 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ActionBanner;