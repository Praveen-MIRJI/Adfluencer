import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Megaphone } from 'lucide-react';
import api from '../../lib/api';
import { Advertisement, Pagination } from '../../types';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import PaginationComponent from '../../components/ui/Pagination';

export default function ManageAds() {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAds = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (statusFilter) params.append('status', statusFilter);
      
      const response = await api.get(`/admin/advertisements?${params}`);
      setAds(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch ads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, [statusFilter]);

  const handleStatusChange = async (adId: string, status: string) => {
    setActionLoading(adId);
    try {
      await api.patch(`/admin/advertisements/${adId}/status`, { status });
      toast.success('Advertisement updated successfully');
      fetchAds(pagination?.page || 1);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update advertisement');
    } finally {
      setActionLoading(null);
    }
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
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Manage Advertisements</h1>
        <p className="text-gray-600 mt-1">Review and moderate platform advertisements</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Status</option>
            <option value="OPEN">Open</option>
            <option value="CLOSED">Closed</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {loading ? (
        <PageLoader />
      ) : ads.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No advertisements found"
          description="Try adjusting your filters."
        />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Advertisement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Budget
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bids
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ads.map((ad) => (
                  <tr key={ad.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                        {ad.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {ad.platform} • {ad.category?.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ad.client?.clientProfile?.companyName || ad.client?.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${ad.budgetMin} - ${ad.budgetMax}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ad._count?.bids || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(ad.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(ad.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex justify-end gap-2">
                        {ad.status === 'PENDING_APPROVAL' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleStatusChange(ad.id, 'OPEN')}
                              loading={actionLoading === ad.id}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleStatusChange(ad.id, 'REJECTED')}
                              loading={actionLoading === ad.id}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {ad.status === 'OPEN' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleStatusChange(ad.id, 'CLOSED')}
                            loading={actionLoading === ad.id}
                          >
                            Close
                          </Button>
                        )}
                        {ad.status === 'REJECTED' && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(ad.id, 'OPEN')}
                            loading={actionLoading === ad.id}
                          >
                            Reopen
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination && (
            <PaginationComponent
              page={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={fetchAds}
            />
          )}
        </div>
      )}
    </div>
  );
}
