import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  FileText, 
  User, 
  Calendar, 
  MapPin, 
  Phone,
  Filter,
  Search,
  Download
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface KycVerification {
  id: string;
  userId: string;
  documentType: string;
  documentNumber: string;
  fullName: string;
  dateOfBirth: string;
  address: string;
  phoneNumber: string;
  documentFrontUrl: string;
  documentBackUrl?: string;
  selfieUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  user: {
    id: string;
    email: string;
    role: string;
    clientProfile?: { companyName: string };
    influencerProfile?: { displayName: string };
  };
}

const AdminKycReview: React.FC = () => {
  const { user } = useAuthStore();
  const [verifications, setVerifications] = useState<KycVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState<KycVerification | null>(null);
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    page: 1
  });
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    currentPage: 1
  });

  useEffect(() => {
    fetchVerifications();
  }, [filters]);

  const fetchVerifications = async () => {
    try {
      const params = new URLSearchParams({
        page: filters.page.toString(),
        limit: '20'
      });

      if (filters.status) {
        params.append('status', filters.status);
      }

      const response = await api.get(`/kyc/admin/all?${params}`);
      const data = response.data;
      
      if (data.success) {
        setVerifications(data.data || []);
        setPagination({
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 0,
          currentPage: data.pagination?.page || 1
        });
      } else {
        console.error('API error:', data.error);
        toast.error(data.error || 'Failed to load KYC verifications');
      }
    } catch (error: any) {
      console.error('Error fetching verifications:', error);
      toast.error(error.response?.data?.error || 'Failed to load KYC verifications');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    if (!selectedVerification) return;

    if (reviewStatus === 'REJECTED' && !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.put(`/kyc/admin/review/${selectedVerification.id}`, {
        status: reviewStatus,
        rejectionReason: reviewStatus === 'REJECTED' ? rejectionReason : undefined
      });

      const data = response.data;

      if (data.success) {
        toast.success(`KYC ${reviewStatus.toLowerCase()} successfully`);
        setReviewModal(false);
        setSelectedVerification(null);
        setRejectionReason('');
        fetchVerifications();
      } else {
        toast.error(data.error || 'Failed to review KYC');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to review KYC');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-900/30 text-green-400 border border-green-500/30';
      case 'PENDING': return 'bg-yellow-900/30 text-yellow-400 border border-yellow-500/30';
      case 'REJECTED': return 'bg-red-900/30 text-red-400 border border-red-500/30';
      default: return 'bg-slate-700 text-slate-300 border border-slate-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle className="w-4 h-4" />;
      case 'REJECTED': return <XCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const filteredVerifications = verifications.filter(verification => {
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return (
        verification.fullName.toLowerCase().includes(searchTerm) ||
        verification.user.email.toLowerCase().includes(searchTerm) ||
        verification.documentNumber.toLowerCase().includes(searchTerm)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">KYC Verification Review</h1>
        <p className="text-slate-400">Review and approve user KYC verification requests</p>
      </div>

      {/* Filters and Search */}
      <div className="bg-slate-800/50 border border-slate-600/50 backdrop-blur-sm rounded-xl p-6 mb-6 shadow-lg shadow-black/10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, email, or document..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10 pr-4 py-2 border border-slate-600 bg-slate-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80"
              />
            </div>
            
            <div className="relative">
              <Filter className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                className="pl-10 pr-8 py-2 border border-slate-600 bg-slate-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-400">
              Total: {pagination.total} verifications
            </span>
          </div>
        </div>
      </div>

      {/* Verifications List */}
      <div className="bg-slate-800/50 border border-slate-600/50 backdrop-blur-sm rounded-xl shadow-lg shadow-black/10">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900/50 border-b border-slate-600/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">User</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">Document</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">Submitted</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-600/50">
              {filteredVerifications.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <FileText className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No verifications found</h3>
                    <p className="text-slate-400">No KYC verifications match your current filters</p>
                  </td>
                </tr>
              ) : (
                filteredVerifications.map((verification) => (
                  <tr key={verification.id} className="hover:bg-slate-700/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-slate-300" />
                        </div>
                        <div>
                          <div className="font-medium text-white">{verification.fullName}</div>
                          <div className="text-sm text-slate-400">{verification.user.email}</div>
                          <div className="text-xs text-slate-500">
                            {verification.user.role} • {
                              verification.user.clientProfile?.companyName || 
                              verification.user.influencerProfile?.displayName || 
                              'No profile'
                            }
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-white">{verification.documentType}</div>
                        <div className="text-sm text-slate-400">****{verification.documentNumber.slice(-4)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(verification.status)}`}>
                        {getStatusIcon(verification.status)}
                        <span>{verification.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-white">
                        {new Date(verification.submittedAt).toLocaleDateString('en-IN')}
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(verification.submittedAt).toLocaleTimeString('en-IN')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedVerification(verification)}
                          className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {verification.status === 'PENDING' && (
                          <button
                            onClick={() => {
                              setSelectedVerification(verification);
                              setReviewModal(true);
                            }}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Review
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-600/50 flex items-center justify-between">
            <div className="text-sm text-slate-400">
              Page {pagination.currentPage} of {pagination.totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                disabled={filters.page === 1}
                className="px-3 py-1 text-sm border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                disabled={filters.page === pagination.totalPages}
                className="px-3 py-1 text-sm border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Verification Details Modal */}
      {selectedVerification && !reviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800 border border-slate-600/50 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-slate-600/50">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white">KYC Verification Details</h3>
                <button
                  onClick={() => setSelectedVerification(null)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <XCircle className="w-6 h-6 text-slate-400" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* User Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-white mb-4">Personal Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-slate-400" />
                      <div>
                        <div className="font-medium text-white">{selectedVerification.fullName}</div>
                        <div className="text-sm text-slate-400">Full Name</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-slate-400" />
                      <div>
                        <div className="font-medium text-white">
                          {new Date(selectedVerification.dateOfBirth).toLocaleDateString('en-IN')}
                        </div>
                        <div className="text-sm text-slate-400">Date of Birth</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-slate-400" />
                      <div>
                        <div className="font-medium text-white">{selectedVerification.phoneNumber}</div>
                        <div className="text-sm text-slate-400">Phone Number</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-slate-400 mt-1" />
                      <div>
                        <div className="font-medium text-white">{selectedVerification.address}</div>
                        <div className="text-sm text-slate-400">Address</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-4">Document Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-slate-400" />
                      <div>
                        <div className="font-medium text-white">{selectedVerification.documentType}</div>
                        <div className="text-sm text-slate-400">Document Type</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-slate-400" />
                      <div>
                        <div className="font-medium text-white">{selectedVerification.documentNumber}</div>
                        <div className="text-sm text-slate-400">Document Number</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Images */}
              <div>
                <h4 className="font-semibold text-white mb-4">Uploaded Documents</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h5 className="text-sm font-medium text-slate-300 mb-2">Document Front</h5>
                    <img
                      src={selectedVerification.documentFrontUrl}
                      alt="Document Front"
                      className="w-full h-48 object-cover rounded-lg border border-slate-600"
                    />
                  </div>
                  {selectedVerification.documentBackUrl && (
                    <div>
                      <h5 className="text-sm font-medium text-slate-300 mb-2">Document Back</h5>
                      <img
                        src={selectedVerification.documentBackUrl}
                        alt="Document Back"
                        className="w-full h-48 object-cover rounded-lg border border-slate-600"
                      />
                    </div>
                  )}
                  <div>
                    <h5 className="text-sm font-medium text-slate-300 mb-2">Selfie</h5>
                    <img
                      src={selectedVerification.selfieUrl}
                      alt="Selfie"
                      className="w-full h-48 object-cover rounded-lg border border-slate-600"
                    />
                  </div>
                </div>
              </div>

              {/* Review Actions */}
              {selectedVerification.status === 'PENDING' && (
                <div className="flex justify-end space-x-4 pt-6 border-t border-slate-600/50">
                  <button
                    onClick={() => setReviewModal(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Review Application
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && selectedVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800 border border-slate-600/50 rounded-2xl max-w-md w-full"
          >
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-6">Review KYC Verification</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Review Decision
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="APPROVED"
                        checked={reviewStatus === 'APPROVED'}
                        onChange={(e) => setReviewStatus(e.target.value as 'APPROVED' | 'REJECTED')}
                        className="mr-2"
                      />
                      <span className="text-green-400 font-medium">Approve</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="REJECTED"
                        checked={reviewStatus === 'REJECTED'}
                        onChange={(e) => setReviewStatus(e.target.value as 'APPROVED' | 'REJECTED')}
                        className="mr-2"
                      />
                      <span className="text-red-400 font-medium">Reject</span>
                    </label>
                  </div>
                </div>

                {reviewStatus === 'REJECTED' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Rejection Reason *
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-slate-600 bg-slate-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Please provide a detailed reason for rejection..."
                      required
                    />
                  </div>
                )}
              </div>

              <div className="flex space-x-4 mt-6">
                <button
                  onClick={() => {
                    setReviewModal(false);
                    setRejectionReason('');
                  }}
                  className="flex-1 py-3 px-4 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReview}
                  disabled={submitting || (reviewStatus === 'REJECTED' && !rejectionReason.trim())}
                  className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? 'Processing...' : 'Submit Review'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminKycReview;