import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { FileCheck, Clock, CheckCircle, XCircle, DollarSign, Eye } from 'lucide-react';
import api from '../../lib/api';
import { Pagination } from '../../types';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import PaginationComponent from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';

interface Contract {
  id: string; bidId: string; clientId: string; influencerId: string; advertisementId: string;
  agreedPrice: number; deliveryDeadline: string; status: string; completedAt?: string; createdAt: string;
  client?: { email: string; clientProfile?: { companyName: string } };
  influencer?: { email: string; influencerProfile?: { displayName: string } };
  advertisement?: { title: string };
}

export default function AdminContracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  const fetchContracts = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (statusFilter) params.append('status', statusFilter);
      const response = await api.get(`/admin/contracts?${params}`);
      setContracts(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) { console.error('Failed to fetch contracts:', error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchContracts(); }, [statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <Badge variant="info">Active</Badge>;
      case 'COMPLETED': return <Badge variant="success">Completed</Badge>;
      case 'CANCELLED': return <Badge variant="danger">Cancelled</Badge>;
      case 'DISPUTED': return <Badge variant="warning">Disputed</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const totalRevenue = contracts.filter(c => c.status === 'COMPLETED').reduce((sum, c) => sum + c.agreedPrice, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Contracts Management</h1>
        <p className="text-slate-400 mt-1">Monitor all platform contracts</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Contracts', value: pagination?.total || 0, icon: FileCheck, color: 'purple' },
          { label: 'Active', value: contracts.filter(c => c.status === 'ACTIVE').length, icon: Clock, color: 'blue' },
          { label: 'Completed', value: contracts.filter(c => c.status === 'COMPLETED').length, icon: CheckCircle, color: 'emerald' },
          { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'amber' },
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
          <option value="ACTIVE">Active</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="DISPUTED">Disputed</option>
        </select>
      </CardContent></Card>

      {loading ? <PageLoader /> : contracts.length === 0 ? (
        <EmptyState icon={FileCheck} title="No contracts found" description="Contracts will appear when bids are accepted." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Campaign</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Influencer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Deadline</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {contracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4"><p className="text-white font-medium max-w-[200px] truncate">{contract.advertisement?.title || 'N/A'}</p></td>
                    <td className="px-6 py-4 text-slate-300 text-sm">{contract.client?.clientProfile?.companyName || contract.client?.email}</td>
                    <td className="px-6 py-4 text-slate-300 text-sm">{contract.influencer?.influencerProfile?.displayName || contract.influencer?.email}</td>
                    <td className="px-6 py-4 text-emerald-400 font-semibold">${contract.agreedPrice.toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-400 text-sm">{format(new Date(contract.deliveryDeadline), 'MMM d, yyyy')}</td>
                    <td className="px-6 py-4">{getStatusBadge(contract.status)}</td>
                    <td className="px-6 py-4 text-right">
                      <Button size="sm" variant="secondary" onClick={() => setSelectedContract(contract)}><Eye className="w-4 h-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination && pagination.totalPages > 1 && <div className="p-4 border-t border-slate-700/50"><PaginationComponent currentPage={pagination.page} totalPages={pagination.totalPages} onPageChange={fetchContracts} /></div>}
        </Card>
      )}

      {/* Contract Details Modal */}
      <Modal isOpen={!!selectedContract} onClose={() => setSelectedContract(null)} title="Contract Details">
        {selectedContract && (
          <div className="space-y-4">
            <div><p className="text-slate-400 text-sm">Campaign</p><p className="text-white text-lg font-semibold">{selectedContract.advertisement?.title}</p></div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-slate-400 text-sm">Client</p><p className="text-white">{selectedContract.client?.clientProfile?.companyName || selectedContract.client?.email}</p></div>
              <div><p className="text-slate-400 text-sm">Influencer</p><p className="text-white">{selectedContract.influencer?.influencerProfile?.displayName || selectedContract.influencer?.email}</p></div>
              <div><p className="text-slate-400 text-sm">Agreed Price</p><p className="text-emerald-400 font-semibold">${selectedContract.agreedPrice.toLocaleString()}</p></div>
              <div><p className="text-slate-400 text-sm">Status</p>{getStatusBadge(selectedContract.status)}</div>
              <div><p className="text-slate-400 text-sm">Deadline</p><p className="text-white">{format(new Date(selectedContract.deliveryDeadline), 'MMM d, yyyy')}</p></div>
              <div><p className="text-slate-400 text-sm">Created</p><p className="text-white">{format(new Date(selectedContract.createdAt), 'MMM d, yyyy')}</p></div>
            </div>
            {selectedContract.completedAt && <div><p className="text-slate-400 text-sm">Completed</p><p className="text-emerald-400">{format(new Date(selectedContract.completedAt), 'MMM d, yyyy')}</p></div>}
          </div>
        )}
      </Modal>
    </div>
  );
}
