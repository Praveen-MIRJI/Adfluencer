import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Upload, FileText, User, Phone, Mail, CreditCard } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface KycStatus {
  status: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';
  documentType?: string;
  fullName?: string;
  submittedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

const KycVerification: React.FC = () => {
  const { user } = useAuthStore();
  const [kycStatus, setKycStatus] = useState<KycStatus>({ status: 'NOT_SUBMITTED' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    documentType: 'AADHAAR',
    documentNumber: '',
    fullName: '',
    dateOfBirth: '',
    address: '',
    phoneNumber: '',
    documentFrontUrl: '',
    documentBackUrl: '',
    selfieUrl: ''
  });

  useEffect(() => {
    fetchKycStatus();
  }, []);

  const fetchKycStatus = async () => {
    try {
      const response = await api.get('/kyc/status');
      const data = response.data;
      
      if (data.success) {
        setKycStatus(data.data);
      }
    } catch (error) {
      console.error('Error fetching KYC status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await api.post('/kyc/submit', formData);
      const data = response.data;

      if (data.success) {
        toast.success('KYC verification submitted successfully!');
        fetchKycStatus();
      } else {
        toast.error(data.error || 'Failed to submit KYC verification');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to submit KYC verification');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'text-green-600 bg-green-50';
      case 'PENDING': return 'text-yellow-600 bg-yellow-50';
      case 'REJECTED': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'PENDING': return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'REJECTED': return <AlertCircle className="w-5 h-5 text-red-600" />;
      default: return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 border border-slate-600/50 backdrop-blur-sm rounded-xl shadow-lg shadow-black/10">
        <div className="p-6 border-b border-slate-600/50">
          <h2 className="text-2xl font-bold text-white mb-2">KYC Verification</h2>
          <p className="text-slate-300">
            Complete your KYC verification to access all platform features and build trust with other users.
          </p>
        </div>

        {/* Current Status */}
        <div className="p-6 border-b border-slate-600/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon(kycStatus.status)}
              <div>
                <h3 className="font-semibold text-white">Verification Status</h3>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(kycStatus.status)}`}>
                  {kycStatus.status.replace('_', ' ')}
                </div>
              </div>
            </div>
            
            {kycStatus.status === 'APPROVED' && (
              <div className="text-right">
                <p className="text-sm text-slate-400">Verified on</p>
                <p className="font-medium text-white">
                  {new Date(kycStatus.reviewedAt!).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {kycStatus.status === 'REJECTED' && kycStatus.rejectionReason && (
            <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              <h4 className="font-medium text-red-400 mb-2">Rejection Reason</h4>
              <p className="text-red-300">{kycStatus.rejectionReason}</p>
            </div>
          )}

          {kycStatus.status === 'PENDING' && (
            <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
              <h4 className="font-medium text-yellow-400 mb-2">Under Review</h4>
              <p className="text-yellow-300">
                Your KYC verification is being reviewed. This typically takes 24-48 hours.
              </p>
            </div>
          )}
        </div>

        {/* Verification Benefits */}
        <div className="p-6 border-b border-slate-600/50">
          <h3 className="font-semibold text-white mb-4">Benefits of KYC Verification</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-white">Verified Badge</h4>
                <p className="text-sm text-slate-400">Display a verified badge on your profile</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CreditCard className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-white">Payment Features</h4>
                <p className="text-sm text-slate-400">Access to premium payment features</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <User className="w-5 h-5 text-purple-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-white">Higher Trust</h4>
                <p className="text-sm text-slate-400">Build trust with clients and influencers</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Mail className="w-5 h-5 text-indigo-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-white">Priority Support</h4>
                <p className="text-sm text-slate-400">Get priority customer support</p>
              </div>
            </div>
          </div>
        </div>

        {/* KYC Form */}
        {(kycStatus.status === 'NOT_SUBMITTED' || kycStatus.status === 'REJECTED') && (
          <div className="p-6">
            <h3 className="font-semibold text-white mb-6">Submit KYC Verification</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Type
                  </label>
                  <select
                    value={formData.documentType}
                    onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="AADHAAR">Aadhaar Card</option>
                    <option value="PAN">PAN Card</option>
                    <option value="VOTER_ID">Voter ID</option>
                    <option value="PASSPORT">Passport</option>
                    <option value="DRIVING_LICENSE">Driving License</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Number
                  </label>
                  <input
                    type="text"
                    value={formData.documentNumber}
                    onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter document number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name (as per document)
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+91 XXXXX XXXXX"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter complete address"
                  required
                />
              </div>

              {/* Document Upload Section */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Document Upload</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-900">Document Front</p>
                    <p className="text-xs text-gray-500">Upload front side</p>
                    <input
                      type="url"
                      value={formData.documentFrontUrl}
                      onChange={(e) => setFormData({ ...formData, documentFrontUrl: e.target.value })}
                      className="mt-2 w-full px-2 py-1 text-xs border border-gray-300 rounded"
                      placeholder="Image URL"
                      required
                    />
                  </div>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-900">Document Back</p>
                    <p className="text-xs text-gray-500">Upload back side</p>
                    <input
                      type="url"
                      value={formData.documentBackUrl}
                      onChange={(e) => setFormData({ ...formData, documentBackUrl: e.target.value })}
                      className="mt-2 w-full px-2 py-1 text-xs border border-gray-300 rounded"
                      placeholder="Image URL (optional)"
                    />
                  </div>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-900">Selfie</p>
                    <p className="text-xs text-gray-500">Upload selfie</p>
                    <input
                      type="url"
                      value={formData.selfieUrl}
                      onChange={(e) => setFormData({ ...formData, selfieUrl: e.target.value })}
                      className="mt-2 w-full px-2 py-1 text-xs border border-gray-300 rounded"
                      placeholder="Image URL"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <motion.button
                  type="submit"
                  disabled={submitting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit for Verification'}
                </motion.button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default KycVerification;