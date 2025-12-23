import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { FileText, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import api from '../../lib/api';
import { Pagination } from '../../types';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import PaginationComponent from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';

interface Bid {
  id: string; advertisementId: string; influencerId: string; proposedPrice: number;
  proposal: string; deliveryDays: number; status: string; createdAt: string;
  influencer?: { email: string; influencerProfile?: { displayName: string } };
  advertisement?: { title: string; client?: { email: string; clientProfile?: { companyName: string } } };
}

export default function AdminBids() {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);

  const fetchBids = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (statusFilter) params.append('status', statusFilter);
      const response = await api.get(`/admin/bids?${params}`);
      setBids(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) { console.error('Failed to fetch bids:', error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBids(); }, [statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <Badge variant="warning">Pending</Badge>;
      case 'SHORTLISTED': return <Badge variant="info">Shortlisted</Badge>;
      case 'ACCEPTED': return <Badge variant="success">Accepted</Badge>;
      case 'REJECTED': return <Badge variant="danger">Rejected</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Bids Management</h1>
        <p className="text-slate-400 mt-1">Monitor all platform bids</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Bids', value: pagination?.total || 0, icon: FileText, color: 'blue' },
          { label: 'Pending', value: bids.filter(b => b.status === 'PENDING').length, icon: Clock, color: 'amber' },
          { label: 'Accepted', value: bids.filter(b => b.status === 'ACCEPTED').length, icon: CheckCircle, color: 'emerald' },
          { label: 'Rejected', value: bids.filter(b => b.status === 'REJECTED').length, icon: XCircle, color: 'red' },
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
          <option value="PENDING">Pending</option>
          <option value="SHORTLISTED">Shortlisted</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </CardContent></Card>

      {loading ? <PageLoader /> : bids.length === 0 ? (
        <EmptyState icon={FileText} title="No bids found" description="Bids will appear when influencers submit proposals." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Campaign</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Influencer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Delivery</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {bids.map((bid) => (
                  <tr key={bid.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4"><p className="text-white font-medium max-w-[180px] truncate">{bid.advertisement?.title || 'N/A'}</p></td>
                    <td className="px-6 py-4 text-slate-300 text-sm">{bid.influencer?.influencerProfile?.displayName || bid.influencer?.email}</td>
                    <td className="px-6 py-4 text-slate-300 text-sm">{bid.advertisement?.client?.clientProfile?.companyName || bid.advertisement?.client?.email}</td>
                    <td className="px-6 py-4 text-emerald-400 font-semibold">${bid.proposedPrice.toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-300">{bid.deliveryDays} days</td>
                    <td className="px-6 py-4">{getStatusBadge(bid.status)}</td>
                    <td className="px-6 py-4 text-slate-400 text-sm">{format(new Date(bid.createdAt), 'MMM d')}</td>
                    <td className="px-6 py-4 text-right">
                      <Button size="sm" variant="secondary" onClick={() => setSelectedBid(bid)}><Eye className="w-4 h-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination && pagination.totalPages > 1 && <div className="p-4 border-t border-slate-700/50"><PaginationComponent currentPage={pagination.page} totalPages={pagination.totalPages} onPageChange={fetchBids} /></div>}
        </Card>
      )}

      {/* Bid Details Modal */}
      <Modal isOpen={!!selectedBid} onClose={() => setSelectedBid(null)} title="Bid Details">
        {selectedBid && (
          <div className="space-y-4">
            <div><p className="text-slate-400 text-sm">Campaign</p><p className="text-white text-lg font-semibold">{selectedBid.advertisement?.title}</p></div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-slate-400 text-sm">Influencer</p><p className="text-white">{selectedBid.influencer?.influencerProfile?.displayName || selectedBid.influencer?.email}</p></div>
              <div><p className="text-slate-400 text-sm">Proposed Price</p><p className="text-emerald-400 font-semibold">${selectedBid.proposedPrice.toLocaleString()}</p></div>
              <div><p className="text-slate-400 text-sm">Delivery Time</p><p className="text-white">{selectedBid.deliveryDays} days</p></div>
              <div><p className="text-slate-400 text-sm">Status</p>{getStatusBadge(selectedBid.status)}</div>
            </div>
            <div><p className="text-slate-400 text-sm">Proposal</p><p className="text-slate-300">{selectedBid.proposal}</p></div>
          </div>
        )}
      </Modal>
    </div>
  );
}
