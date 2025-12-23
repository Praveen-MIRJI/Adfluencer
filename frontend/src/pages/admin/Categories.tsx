import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Tag, Plus, Edit2, Trash2, Megaphone } from 'lucide-react';
import api from '../../lib/api';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';

interface Category {
  id: string; name: string; slug: string; description?: string; isActive: boolean; createdAt: string; adCount?: number;
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/categories');
      setCategories(response.data.data);
    } catch (error) { console.error('Failed to fetch categories:', error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCategories(); }, []);

  const openModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ name: category.name, description: category.description || '' });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', description: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      if (editingCategory) {
        await api.patch(`/admin/categories/${editingCategory.id}`, formData);
        toast.success('Category updated');
      } else {
        await api.post('/admin/categories', formData);
        toast.success('Category created');
      }
      setShowModal(false);
      fetchCategories();
    } catch (error: any) { toast.error(error.response?.data?.error || 'Failed to save category'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    setDeleting(id);
    try {
      await api.delete(`/admin/categories/${id}`);
      toast.success('Category deleted');
      fetchCategories();
    } catch (error: any) { toast.error(error.response?.data?.error || 'Failed to delete category'); }
    finally { setDeleting(null); }
  };

  const toggleActive = async (category: Category) => {
    try {
      await api.patch(`/admin/categories/${category.id}`, { isActive: !category.isActive });
      toast.success(`Category ${category.isActive ? 'disabled' : 'enabled'}`);
      fetchCategories();
    } catch (error: any) { toast.error(error.response?.data?.error || 'Failed to update category'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Categories Management</h1>
          <p className="text-slate-400 mt-1">Manage advertisement categories</p>
        </div>
        <Button onClick={() => openModal()}><Plus className="w-4 h-4 mr-2" />Add Category</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10"><Tag className="w-5 h-5 text-purple-400" /></div>
          <div><p className="text-slate-400 text-xs">Total Categories</p><p className="text-xl font-bold text-white">{categories.length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10"><Tag className="w-5 h-5 text-emerald-400" /></div>
          <div><p className="text-slate-400 text-xs">Active</p><p className="text-xl font-bold text-white">{categories.filter(c => c.isActive).length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-rose-500/10"><Megaphone className="w-5 h-5 text-rose-400" /></div>
          <div><p className="text-slate-400 text-xs">Total Ads</p><p className="text-xl font-bold text-white">{categories.reduce((sum, c) => sum + (c.adCount || 0), 0)}</p></div>
        </CardContent></Card>
      </div>

      {loading ? <PageLoader /> : categories.length === 0 ? (
        <EmptyState icon={Tag} title="No categories found" description="Create your first category to get started." action={<Button onClick={() => openModal()}><Plus className="w-4 h-4 mr-2" />Add Category</Button>} />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Slug</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Ads</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div><p className="text-white font-medium">{category.name}</p>{category.description && <p className="text-slate-400 text-sm truncate max-w-[200px]">{category.description}</p>}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-sm font-mono">{category.slug}</td>
                    <td className="px-6 py-4 text-white">{category.adCount || 0}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => toggleActive(category)}>
                        <Badge variant={category.isActive ? 'success' : 'gray'}>{category.isActive ? 'Active' : 'Inactive'}</Badge>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-sm">{format(new Date(category.createdAt), 'MMM d, yyyy')}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => openModal(category)}><Edit2 className="w-4 h-4" /></Button>
                        <Button size="sm" variant="danger" onClick={() => handleDelete(category.id)} loading={deleting === category.id} disabled={(category.adCount || 0) > 0}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingCategory ? 'Edit Category' : 'Add Category'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Fashion & Beauty" required />
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1.5">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Optional description..."
              className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 resize-none" rows={3} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editingCategory ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
