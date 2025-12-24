import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Search, Users, Building2, User, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '../../lib/api';
import { User as UserType, Pagination } from '../../types';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import PaginationComponent from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';

export default function ManageUsers() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);
      const response = await api.get(`/admin/users?${params}`);
      setUsers(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [roleFilter, statusFilter]);
  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchUsers(); };

  const handleStatusChange = async (userId: string, status: string) => {
    setActionLoading(userId);
    try {
      await api.patch(`/admin/users/${userId}/status`, { status });
      toast.success(`User ${status.toLowerCase()} successfully`);
      fetchUsers(pagination?.page || 1);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update user');
    } finally { setActionLoading(null); }
  };

  const viewUserDetails = async (userId: string) => {
    setDetailsLoading(true); setShowDetailsModal(true);
    try {
      const response = await api.get(`/admin/users/${userId}`);
      setSelectedUser(response.data.data);
    } catch (error) { toast.error('Failed to load user details'); setShowDetailsModal(false); }
    finally { setDetailsLoading(false); }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'CLIENT': return <Badge variant="info">Client</Badge>;
      case 'INFLUENCER': return <Badge variant="success">Influencer</Badge>;
      case 'ADMIN': return <Badge variant="warning">Admin</Badge>;
      default: return <Badge>{role}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <Badge variant="success">Active</Badge>;
      case 'PENDING': return <Badge variant="warning">Pending</Badge>;
      case 'BLOCKED': return <Badge variant="danger">Blocked</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Manage Users</h1>
        <p className="text-slate-400 mt-1">View and manage platform users</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: pagination?.total || 0, icon: Users, color: 'blue' },
          { label: 'Clients', value: users.filter(u => u.role === 'CLIENT').length, icon: Building2, color: 'purple' },
          { label: 'Influencers', value: users.filter(u => u.role === 'INFLUENCER').length, icon: User, color: 'emerald' },
          { label: 'Pending', value: users.filter(u => u.status === 'PENDING').length, icon: Clock, color: 'amber' },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-${stat.color}-500/10`}>
                <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
              </div>
              <div>
                <p className="text-slate-400 text-xs">{stat.label}</p>
                <p className="text-xl font-bold text-white">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by email..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50" />
            </div>
            <Button type="submit">Search</Button>
          </form>
          <div className="flex flex-wrap gap-4">
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50">
              <option value="">All Roles</option>
              <option value="CLIENT">Clients</option>
              <option value="INFLUENCER">Influencers</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50">
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      {loading ? <PageLoader /> : users.length === 0 ? (
        <EmptyState icon={Users} title="No users found" description="Try adjusting your search or filters." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Joined</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {(user.clientProfile?.avatar || user.influencerProfile?.avatar) ? (
                          <img
                            src={user.clientProfile?.avatar || user.influencerProfile?.avatar}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                            {user.email.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-white font-medium">{user.email}</p>
                          <p className="text-slate-400 text-sm">{user.clientProfile?.companyName || user.influencerProfile?.displayName || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                    <td className="px-6 py-4">{getStatusBadge(user.status)}</td>
                    <td className="px-6 py-4 text-slate-400 text-sm">{format(new Date(user.createdAt), 'MMM d, yyyy')}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => viewUserDetails(user.id)}><Eye className="w-4 h-4" /></Button>
                        {user.role !== 'ADMIN' && (
                          <>
                            {user.status === 'PENDING' && <Button size="sm" onClick={() => handleStatusChange(user.id, 'ACTIVE')} loading={actionLoading === user.id}><CheckCircle className="w-4 h-4 mr-1" />Approve</Button>}
                            {user.status === 'ACTIVE' && <Button size="sm" variant="danger" onClick={() => handleStatusChange(user.id, 'BLOCKED')} loading={actionLoading === user.id}><XCircle className="w-4 h-4 mr-1" />Block</Button>}
                            {user.status === 'BLOCKED' && <Button size="sm" onClick={() => handleStatusChange(user.id, 'ACTIVE')} loading={actionLoading === user.id}>Unblock</Button>}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination && pagination.totalPages > 1 && <div className="p-4 border-t border-slate-700/50"><PaginationComponent currentPage={pagination.page} totalPages={pagination.totalPages} onPageChange={fetchUsers} /></div>}
        </Card>
      )}

      {/* User Details Modal */}
      <Modal isOpen={showDetailsModal} onClose={() => { setShowDetailsModal(false); setSelectedUser(null); }} title="User Details">
        {detailsLoading ? <div className="py-8 text-center"><PageLoader /></div> : selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {(selectedUser.clientProfile?.avatar || selectedUser.influencerProfile?.avatar) ? (
                <img
                  src={selectedUser.clientProfile?.avatar || selectedUser.influencerProfile?.avatar}
                  alt=""
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                  {selectedUser.email.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-white text-lg font-semibold">{selectedUser.email}</p>
                <div className="flex gap-2 mt-1">{getRoleBadge(selectedUser.role)}{getStatusBadge(selectedUser.status)}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
              <div><p className="text-slate-400 text-sm">Joined</p><p className="text-white">{format(new Date(selectedUser.createdAt), 'MMM d, yyyy')}</p></div>
              {selectedUser.role === 'CLIENT' && selectedUser.clientProfile && (
                <>
                  <div><p className="text-slate-400 text-sm">Company</p><p className="text-white">{selectedUser.clientProfile.companyName || '-'}</p></div>
                  <div><p className="text-slate-400 text-sm">Industry</p><p className="text-white">{selectedUser.clientProfile.industry || '-'}</p></div>
                </>
              )}
              {selectedUser.role === 'INFLUENCER' && selectedUser.influencerProfile && (
                <>
                  <div><p className="text-slate-400 text-sm">Display Name</p><p className="text-white">{selectedUser.influencerProfile.displayName || '-'}</p></div>
                  <div><p className="text-slate-400 text-sm">Niche</p><p className="text-white">{selectedUser.influencerProfile.primaryNiche || '-'}</p></div>
                </>
              )}
            </div>
            {selectedUser.stats && (
              <div className="pt-4 border-t border-slate-700">
                <p className="text-slate-400 text-sm mb-2">Activity Stats</p>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(selectedUser.stats).map(([key, value]) => (
                    <div key={key} className="bg-slate-800/50 rounded-lg p-3 text-center">
                      <p className="text-white text-lg font-bold">{String(value)}</p>
                      <p className="text-slate-400 text-xs capitalize">{key}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
