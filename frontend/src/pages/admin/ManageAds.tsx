import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Megaphone, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import api from '../../lib/api';
import { Advertisement, Pagination } from '../../types';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import PaginationComponent from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';

export default function ManageAds() {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedAd, setSelectedAd] = useState<Advertisement | null>(null);

  const fetchAds = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (statusFilter) params.append('status', statusFilter);
      const response = await api.get(`/admin/advertisements?${params}`);
      setAds(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) { console.error('Failed to fetch ads:', error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAds(); }, [statusFilter]);

  const handleStatusChange = async (adId: string, status: string) => {
    setActionLoading(adId);
    try {
      await api.patch(`/admin/advertisements/${adId}/status`, { status });
      toast.success('Advertisement updated successfully');
      fetchAds(pagination?.page || 1);
    } catch (error: any) { toast.error(error.response?.data?.error || 'Failed to update advertisement'); }
    finally { setActionLoading(null); }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN': return <Badge variant="success">Open</Badge>;
      case 'CLOSED': return <Badge variant="gray">Closed</Badge>;
      case 'PENDING_APPROVAL': return <Badge variant="warning">Pending</Badge>;
      case 'REJECTED': return <Badge variant="danger">Rejected</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Manage Advertisements</h1>
        <p className="text-slate-400 mt-1">Review and moderate platform advertisements</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Ads', value: pagination?.total || 0, icon: Megaphone, color: 'rose' },
          { label: 'Open', value: ads.filter(a => a.status === 'OPEN').length, icon: CheckCircle, color: 'emerald' },
          { label: 'Pending', value: ads.filter(a => a.status === 'PENDING_APPROVAL').length, icon: Clock, color: 'amber' },
          { label: 'Closed', value: ads.filter(a => a.status === 'CLOSED').length, icon: XCircle, color: 'slate' },
        ].map((stat, i) => (
          <Card key={i}><CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-${stat.color}-500/10`}><stat.icon className={`w-5 h-5 text-${stat.color}-400`} /></div>
            <div><p className="text-slate-400 text-xs">{stat.label}</p><p className="text-xl font-bold text-white">{stat.value}</p></div>
          </CardContent></Card>
        ))}
      </div>

      {/* Filters */}
      <Card><CardContent className="p-4">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50">
          <option value="">All Status</option>
          <option value="OPEN">Open</option>
          <option value="CLOSED">Closed</option>
          <option value="PENDING_APPROVAL">Pending Approval</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </CardContent></Card>

      {loading ? <PageLoader /> : ads.length === 0 ? (
        <EmptyState icon={Megaphone} title="No advertisements found" description="Try adjusting your filters." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Advertisement</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Budget</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Bids</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {ads.map((ad) => (
                  <tr key={ad.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center"><Megaphone className="w-5 h-5 text-rose-400" /></div>
                        <div><p className="text-white font-medium max-w-[200px] truncate">{ad.title}</p><p className="text-slate-400 text-sm">{ad.platform} • {ad.category?.name}</p></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300 text-sm">{ad.client?.clientProfile?.companyName || ad.client?.email}</td>
                    <td className="px-6 py-4 text-white font-medium">${ad.budgetMin} - ${ad.budgetMax}</td>
                    <td className="px-6 py-4 text-slate-300">{ad._count?.bids || 0}</td>
                    <td className="px-6 py-4">{getStatusBadge(ad.status)}</td>
                    <td className="px-6 py-4 text-slate-400 text-sm">{format(new Date(ad.createdAt), 'MMM d, yyyy')}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setSelectedAd(ad)}><Eye className="w-4 h-4" /></Button>
                        {ad.status === 'PENDING_APPROVAL' && (
                          <>
                            <Button size="sm" onClick={() => handleStatusChange(ad.id, 'OPEN')} loading={actionLoading === ad.id}>Approve</Button>
                            <Button size="sm" variant="danger" onClick={() => handleStatusChange(ad.id, 'REJECTED')} loading={actionLoading === ad.id}>Reject</Button>
                          </>
                        )}
                        {ad.status === 'OPEN' && <Button size="sm" variant="secondary" onClick={() => handleStatusChange(ad.id, 'CLOSED')} loading={actionLoading === ad.id}>Close</Button>}
                        {ad.status === 'REJECTED' && <Button size="sm" onClick={() => handleStatusChange(ad.id, 'OPEN')} loading={actionLoading === ad.id}>Reopen</Button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination && pagination.totalPages > 1 && <div className="p-4 border-t border-slate-700/50"><PaginationComponent currentPage={pagination.page} totalPages={pagination.totalPages} onPageChange={fetchAds} /></div>}
        </Card>
      )}

      {/* Ad Details Modal */}
      <Modal isOpen={!!selectedAd} onClose={() => setSelectedAd(null)} title="Advertisement Details">
        {selectedAd && (
          <div className="space-y-4">
            <div><p className="text-slate-400 text-sm">Title</p><p className="text-white text-lg font-semibold">{selectedAd.title}</p></div>
            <div><p className="text-slate-400 text-sm">Description</p><p className="text-slate-300">{selectedAd.description}</p></div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-slate-400 text-sm">Platform</p><p className="text-white">{selectedAd.platform}</p></div>
              <div><p className="text-slate-400 text-sm">Content Type</p><p className="text-white">{selectedAd.contentType}</p></div>
              <div><p className="text-slate-400 text-sm">Budget</p><p className="text-white">${selectedAd.budgetMin} - ${selectedAd.budgetMax}</p></div>
              <div><p className="text-slate-400 text-sm">Deadline</p><p className="text-white">{format(new Date(selectedAd.deadline), 'MMM d, yyyy')}</p></div>
            </div>
            {selectedAd.requirements && <div><p className="text-slate-400 text-sm">Requirements</p><p className="text-slate-300">{selectedAd.requirements}</p></div>}
          </div>
        )}
      </Modal>
    </div>
  );
}
