import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Image, Video, Link as LinkIcon, ExternalLink } from 'lucide-react';
import api from '../../lib/api';
import { PortfolioItem } from '../../types';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

export default function Portfolio() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    mediaUrl: '',
    mediaType: 'IMAGE' as 'IMAGE' | 'VIDEO' | 'LINK',
    platform: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      const res = await api.get('/portfolio/my-portfolio');
      setItems(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item?: PortfolioItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title,
        description: item.description || '',
        mediaUrl: item.mediaUrl,
        mediaType: item.mediaType,
        platform: item.platform || '',
      });
    } else {
      setEditingItem(null);
      setFormData({ title: '', description: '', mediaUrl: '', mediaType: 'IMAGE', platform: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingItem) {
        const res = await api.put(`/portfolio/${editingItem.id}`, formData);
        setItems(prev => prev.map(i => i.id === editingItem.id ? res.data.data : i));
        toast.success('Portfolio item updated');
      } else {
        const res = await api.post('/portfolio', formData);
        setItems(prev => [res.data.data, ...prev]);
        toast.success('Portfolio item added');
      }
      setIsModalOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save portfolio item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.delete(`/portfolio/${id}`);
      setItems(prev => prev.filter(i => i.id !== id));
      toast.success('Portfolio item deleted');
    } catch (error) {
      toast.error('Failed to delete portfolio item');
    }
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'IMAGE': return <Image className="w-5 h-5" />;
      case 'VIDEO': return <Video className="w-5 h-5" />;
      case 'LINK': return <LinkIcon className="w-5 h-5" />;
      default: return <Image className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Portfolio</h1>
          <p className="text-slate-400 mt-1">Showcase your best work to attract clients</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Image}
          title="No portfolio items yet"
          description="Add your best work to showcase your skills to potential clients"
          action={<Button onClick={() => openModal()}>Add Your First Item</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden group">
              <div className="relative h-48 bg-slate-900/50">
                {item.mediaType === 'IMAGE' ? (
                  <img src={item.mediaUrl} alt={item.title} className="w-full h-full object-cover" />
                ) : item.mediaType === 'VIDEO' ? (
                  <video src={item.mediaUrl} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ExternalLink className="w-12 h-12 text-slate-500" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => openModal(item)}
                    className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 bg-slate-800 rounded-full text-red-400 hover:bg-red-500/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {item.mediaType === 'LINK' && (
                    <a
                      href={item.mediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-slate-800 rounded-full text-rose-400 hover:bg-rose-500/20"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2 text-slate-400">
                  {getMediaIcon(item.mediaType)}
                  {item.platform && (
                    <span className="text-xs text-slate-500">{item.platform}</span>
                  )}
                </div>
                <h3 className="font-semibold text-white">{item.title}</h3>
                {item.description && (
                  <p className="text-sm text-slate-300 mt-1 line-clamp-2">{item.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Portfolio Item' : 'Add Portfolio Item'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            required
          />
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
          />
          <Select
            label="Media Type"
            value={formData.mediaType}
            onChange={(e) => setFormData(prev => ({ ...prev, mediaType: e.target.value as any }))}
          >
            <option value="IMAGE">Image</option>
            <option value="VIDEO">Video</option>
            <option value="LINK">External Link</option>
          </Select>
          <Input
            label="Media URL"
            type="url"
            value={formData.mediaUrl}
            onChange={(e) => setFormData(prev => ({ ...prev, mediaUrl: e.target.value }))}
            placeholder="https://..."
            required
          />
          <Select
            label="Platform (optional)"
            value={formData.platform}
            onChange={(e) => setFormData(prev => ({ ...prev, platform: e.target.value }))}
          >
            <option value="">Select platform</option>
            <option value="Instagram">Instagram</option>
            <option value="YouTube">YouTube</option>
            <option value="TikTok">TikTok</option>
            <option value="Twitter">Twitter</option>
            <option value="Other">Other</option>
          </Select>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {editingItem ? 'Update' : 'Add'} Item
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
