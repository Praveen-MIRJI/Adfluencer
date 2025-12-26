import React, { useState, useEffect } from 'react';
import {
  Upload, Image, Link as LinkIcon, Video, FileText, BarChart3,
  CheckCircle, XCircle, Clock, RefreshCw, Eye, Trash2, Plus
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface Deliverable {
  id: string;
  title: string;
  description?: string;
  type: 'SCREENSHOT' | 'LINK' | 'VIDEO' | 'IMAGE' | 'DOCUMENT' | 'ANALYTICS';
  fileUrl?: string;
  externalLink?: string;
  platform?: string;
  metrics?: Record<string, any>;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED';
  clientFeedback?: string;
  submittedAt: string;
  reviewedAt?: string;
}

interface DeliverablesProps {
  contractId: string;
  isClient: boolean;
  onUpdate?: () => void;
}

const typeIcons = {
  SCREENSHOT: Image,
  LINK: LinkIcon,
  VIDEO: Video,
  IMAGE: Image,
  DOCUMENT: FileText,
  ANALYTICS: BarChart3,
};

const statusConfig = {
  PENDING: { color: 'bg-yellow-500/20 text-yellow-400', icon: Clock, text: 'Pending Review' },
  APPROVED: { color: 'bg-green-500/20 text-green-400', icon: CheckCircle, text: 'Approved' },
  REJECTED: { color: 'bg-red-500/20 text-red-400', icon: XCircle, text: 'Rejected' },
  REVISION_REQUESTED: { color: 'bg-orange-500/20 text-orange-400', icon: RefreshCw, text: 'Revision Requested' },
};

const Deliverables: React.FC<DeliverablesProps> = ({ contractId, isClient, onUpdate }) => {
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'LINK' as Deliverable['type'],
    externalLink: '',
    platform: '',
  });

  useEffect(() => {
    fetchDeliverables();
  }, [contractId]);

  const fetchDeliverables = async () => {
    try {
      const { data } = await api.get(`/deliverables/contract/${contractId}`);
      setDeliverables(data.data || []);
    } catch (error) {
      console.error('Failed to fetch deliverables:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post('/deliverables', { contractId, ...formData });
      toast.success('Deliverable submitted successfully!');
      setShowForm(false);
      setFormData({ title: '', description: '', type: 'LINK', externalLink: '', platform: '' });
      fetchDeliverables();
      onUpdate?.();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to submit deliverable');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (id: string, status: 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED', feedback?: string) => {
    setReviewingId(id);
    try {
      await api.put(`/deliverables/${id}/review`, { status, feedback });
      toast.success(`Deliverable ${status.toLowerCase().replace('_', ' ')}`);
      fetchDeliverables();
      onUpdate?.();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to review deliverable');
    } finally {
      setReviewingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this deliverable?')) return;
    try {
      await api.delete(`/deliverables/${id}`);
      toast.success('Deliverable deleted');
      fetchDeliverables();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete deliverable');
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-700 rounded w-1/3"></div>
          <div className="h-32 bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Upload className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Deliverables</h3>
            <p className="text-sm text-slate-400">{deliverables.length} submitted</p>
          </div>
        </div>
        {!isClient && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Deliverable
          </button>
        )}
      </div>

      {showForm && !isClient && (
        <form onSubmit={handleSubmit} className="bg-slate-900/50 rounded-lg p-4 mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., Instagram Story Post"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as Deliverable['type'] })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="LINK">Link</option>
                <option value="SCREENSHOT">Screenshot</option>
                <option value="VIDEO">Video</option>
                <option value="IMAGE">Image</option>
                <option value="ANALYTICS">Analytics</option>
                <option value="DOCUMENT">Document</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Link/URL</label>
            <input
              type="url"
              value={formData.externalLink}
              onChange={(e) => setFormData({ ...formData, externalLink: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
              placeholder="https://instagram.com/p/..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 resize-none"
              rows={2}
              placeholder="Brief description..."
            />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {submitting ? 'Submitting...' : 'Submit Deliverable'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium">
              Cancel
            </button>
          </div>
        </form>
      )}

      {deliverables.length === 0 ? (
        <div className="text-center py-8">
          <Upload className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No deliverables submitted yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {deliverables.map((deliverable) => {
            const Icon = typeIcons[deliverable.type];
            const status = statusConfig[deliverable.status];
            const StatusIcon = status.icon;

            return (
              <div key={deliverable.id} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-800 rounded-lg">
                      <Icon className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{deliverable.title}</h4>
                      {deliverable.description && <p className="text-sm text-slate-400 mt-1">{deliverable.description}</p>}
                      {deliverable.externalLink && (
                        <a href={deliverable.externalLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300 mt-2">
                          <Eye className="w-4 h-4" /> View Content
                        </a>
                      )}
                      <p className="text-xs text-slate-500 mt-2">Submitted {new Date(deliverable.submittedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                      <StatusIcon className="w-3.5 h-3.5" /> {status.text}
                    </span>
                    {!isClient && deliverable.status === 'PENDING' && (
                      <button onClick={() => handleDelete(deliverable.id)} className="p-1.5 text-slate-400 hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                {deliverable.clientFeedback && (
                  <div className="mt-3 p-3 bg-slate-800 rounded-lg">
                    <p className="text-sm text-slate-300"><span className="font-medium">Feedback:</span> {deliverable.clientFeedback}</p>
                  </div>
                )}
                {isClient && deliverable.status === 'PENDING' && (
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => handleReview(deliverable.id, 'APPROVED')} disabled={reviewingId === deliverable.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                      <CheckCircle className="w-4 h-4" /> Approve
                    </button>
                    <button onClick={() => { const fb = prompt('Feedback for revision:'); if (fb) handleReview(deliverable.id, 'REVISION_REQUESTED', fb); }} disabled={reviewingId === deliverable.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                      <RefreshCw className="w-4 h-4" /> Request Revision
                    </button>
                    <button onClick={() => { const fb = prompt('Reason for rejection:'); if (fb) handleReview(deliverable.id, 'REJECTED', fb); }} disabled={reviewingId === deliverable.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Deliverables;
