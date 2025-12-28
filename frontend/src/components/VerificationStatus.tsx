import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Mail,
  Phone,
  FileText,
  Shield,
  ArrowRight,
  X
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

interface VerificationStatusData {
  kycStatus: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';
  emailVerified: boolean;
  phoneVerified: boolean;
  isVerified: boolean;
  rejectionReason?: string;
}

interface VerificationStatusProps {
  showModal?: boolean;
  onClose?: () => void;
  compact?: boolean;
}

const VerificationStatus: React.FC<VerificationStatusProps> = ({
  showModal = false,
  onClose,
  compact = false
}) => {
  const { user, token } = useAuthStore();
  const [verificationData, setVerificationData] = useState<VerificationStatusData>({
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
        fetch('/api/kyc/status', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/users/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const kycData = await kycResponse.json();
      const userData = await userResponse.json();

      if (kycData.success && userData.success) {
        setVerificationData({
          kycStatus: kycData.data.status || 'NOT_SUBMITTED',
          emailVerified: userData.data.emailVerified || false,
          phoneVerified: userData.data.phoneVerified || false,
          isVerified: userData.data.isVerified || false,
          rejectionReason: kycData.data.rejectionReason
        });
      }
    } catch (error) {
      console.error('Error fetching verification status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string, verified: boolean) => {
    if (verified || status === 'APPROVED') {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    } else if (status === 'PENDING') {
      return <Clock className="w-5 h-5 text-yellow-600" />;
    } else if (status === 'REJECTED') {
      return <AlertCircle className="w-5 h-5 text-red-600" />;
    } else {
      return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string, verified: boolean) => {
    if (verified || status === 'APPROVED') {
      return 'text-green-600 bg-green-50 border-green-200';
    } else if (status === 'PENDING') {
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    } else if (status === 'REJECTED') {
      return 'text-red-400 bg-red-900/30 border-red-500/50';
    } else {
      return 'text-slate-400 bg-slate-700/50 border-slate-600/50';
    }
  };

  const getOverallProgress = () => {
    let completed = 0;
    let total = 3;

    if (verificationData.emailVerified) completed++;
    if (verificationData.phoneVerified) completed++;
    if (verificationData.kycStatus === 'APPROVED') completed++;

    return { completed, total, percentage: (completed / total) * 100 };
  };

  const progress = getOverallProgress();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const content = (
    <div className={compact ? 'space-y-4' : 'space-y-6'}>
      {!compact && (
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Account Verification</h3>
          <p className="text-slate-400">
            Complete your verification to unlock all platform features
          </p>
        </div>
      )}

      {/* Progress Bar */}
      <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress.percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-blue-500 to-green-500"
        />
      </div>

      <div className="text-center text-sm text-gray-600">
        {progress.completed} of {progress.total} steps completed ({Math.round(progress.percentage)}%)
      </div>

      {/* Verification Steps */}
      <div className="space-y-4">
        {/* Email Verification */}
        <div className={`p-4 rounded-lg border ${getStatusColor('', verificationData.emailVerified)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5" />
              <div>
                <h4 className="font-medium">Email Verification</h4>
                <p className="text-sm opacity-75">
                  {verificationData.emailVerified ? 'Email verified' : 'Verify your email address'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon('', verificationData.emailVerified)}
              {!verificationData.emailVerified && (
                <ArrowRight className="w-4 h-4" />
              )}
            </div>
          </div>
        </div>

        {/* Phone Verification */}
        <div className={`p-4 rounded-lg border ${getStatusColor('', verificationData.phoneVerified)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5" />
              <div>
                <h4 className="font-medium">Phone Verification</h4>
                <p className="text-sm opacity-75">
                  {verificationData.phoneVerified ? 'Phone number verified' : 'Verify your phone number'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon('', verificationData.phoneVerified)}
              {!verificationData.phoneVerified && (
                <ArrowRight className="w-4 h-4" />
              )}
            </div>
          </div>
        </div>

        {/* KYC Verification */}
        <div className={`p-4 rounded-lg border ${getStatusColor(verificationData.kycStatus, false)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5" />
              <div>
                <h4 className="font-medium">KYC Verification</h4>
                <p className="text-sm opacity-75">
                  {verificationData.kycStatus === 'APPROVED' && 'Identity verified'}
                  {verificationData.kycStatus === 'PENDING' && 'Under review (24-48 hours)'}
                  {verificationData.kycStatus === 'REJECTED' && 'Verification rejected'}
                  {verificationData.kycStatus === 'NOT_SUBMITTED' && 'Submit identity documents'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(verificationData.kycStatus, false)}
              {verificationData.kycStatus !== 'APPROVED' && (
                <ArrowRight className="w-4 h-4" />
              )}
            </div>
          </div>

          {verificationData.kycStatus === 'REJECTED' && verificationData.rejectionReason && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                <strong>Rejection Reason:</strong> {verificationData.rejectionReason}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {!compact && (
        <div className="space-y-3">
          {!verificationData.emailVerified && (
            <button
              onClick={() => window.location.href = '/profile/verification'}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Verify Email
            </button>
          )}

          {!verificationData.phoneVerified && (
            <button
              onClick={() => window.location.href = '/profile/verification'}
              className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Verify Phone
            </button>
          )}

          {(verificationData.kycStatus === 'NOT_SUBMITTED' || verificationData.kycStatus === 'REJECTED') && (
            <button
              onClick={() => window.location.href = '/profile/kyc'}
              className="w-full py-3 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              {verificationData.kycStatus === 'REJECTED' ? 'Resubmit KYC' : 'Complete KYC'}
            </button>
          )}
        </div>
      )}

      {/* Benefits */}
      {!compact && progress.percentage < 100 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">Benefits of Full Verification</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Verified badge on your profile</li>
            <li>• Access to premium features</li>
            <li>• Higher trust from other users</li>
            <li>• Priority customer support</li>
          </ul>
        </div>
      )}
    </div>
  );

  if (showModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-800 border border-slate-600/50 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6 border-b border-slate-600/50">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Verification Required</h3>
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              )}
            </div>
          </div>
          <div className="p-6">
            {content}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={compact ? 'p-4' : 'p-6'}>
      {content}
    </div>
  );
};

export default VerificationStatus;