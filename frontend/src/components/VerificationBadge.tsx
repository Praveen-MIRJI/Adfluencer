import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';

interface VerificationData {
  kycStatus: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';
  emailVerified: boolean;
  phoneVerified: boolean;
  isVerified: boolean;
}

const VerificationBadge: React.FC = () => {
  const { user } = useAuthStore();
  const [verificationData, setVerificationData] = useState<VerificationData>({
    kycStatus: 'NOT_SUBMITTED',
    emailVerified: false,
    phoneVerified: false,
    isVerified: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVerificationStatus();
  }, []);

  const fetchVerificationStatus = async () => {
    try {
      const [kycResponse, userResponse] = await Promise.all([
        api.get('/kyc/status').catch(() => ({ data: { success: false } })),
        api.get('/users/profile').catch(() => ({ data: { success: false } }))
      ]);

      const kycData = kycResponse.data;
      const userData = userResponse.data;

      if (kycData.success || userData.success) {
        setVerificationData({
          kycStatus: kycData.data?.status || 'NOT_SUBMITTED',
          emailVerified: userData.data?.emailVerified || false,
          phoneVerified: userData.data?.phoneVerified || false,
          isVerified: userData.data?.isVerified || false
        });
      }
    } catch (error) {
      // Silently handle errors - user may not be logged in
    } finally {
      setLoading(false);
    }
  };

  const getVerificationStatus = () => {
    if (verificationData.isVerified) {
      return { status: 'verified', color: 'text-green-400', icon: CheckCircle, text: 'Verified' };
    } else if (verificationData.kycStatus === 'PENDING') {
      return { status: 'pending', color: 'text-yellow-400', icon: Clock, text: 'Under Review' };
    } else if (verificationData.kycStatus === 'REJECTED') {
      return { status: 'rejected', color: 'text-red-400', icon: AlertTriangle, text: 'Rejected' };
    } else {
      return { status: 'unverified', color: 'text-slate-400', icon: Shield, text: 'Unverified' };
    }
  };

  if (loading) return null;

  const verification = getVerificationStatus();
  const Icon = verification.icon;
  const kycPath = user?.role === 'CLIENT' ? '/client/kyc' : '/influencer/kyc';

  return (
    <Link
      to={kycPath}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700"
    >
      <Icon className={`w-4 h-4 ${verification.color}`} />
      <span className={`text-sm font-medium ${verification.color}`}>
        {verification.text}
      </span>
    </Link>
  );
};

export default VerificationBadge;