import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  User, Instagram, Youtube, Twitter, Camera, Upload, X,
  Globe, TrendingUp, Play
} from 'lucide-react';
import api from '../../lib/api';
import { InfluencerProfile, Category } from '../../types';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Select from '../../components/ui/Select';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/Spinner';
import Spinner from '../../components/ui/Spinner';

interface ProfileForm {
  displayName: string;
  bio: string;
  avatar: string;
  primaryNiche: string;
  instagramHandle: string;
  instagramFollowers: number;
  youtubeHandle: string;
  youtubeSubscribers: number;
  twitterHandle: string;
  twitterFollowers: number;
  tiktokHandle: string;
  tiktokFollowers: number;
  engagementRate: number;
}

export default function Profile() {
  const { updateUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [avatarUrl, setAvatarUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<ProfileForm>();
  const displayName = watch('displayName');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, categoriesRes] = await Promise.all([
          api.get('/users/influencer/profile'),
          api.get('/categories'),
        ]);

        if (profileRes.data.data) {
          reset(profileRes.data.data);
          setAvatarUrl(profileRes.data.data.avatar || '');
        }
        setCategories(categoriesRes.data.data);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [reset]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;

        const res = await api.post('/users/upload-avatar', {
          fileData: base64,
          fileType: file.type,
          oldAvatarUrl: avatarUrl,
        });

        if (res.data.success) {
          setAvatarUrl(res.data.data.url);
          setValue('avatar', res.data.data.url);
          toast.success('Image uploaded successfully');
        }
        setUploadingImage(false);
      };
      reader.onerror = () => {
        toast.error('Failed to read image file');
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to upload image');
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setAvatarUrl('');
    setValue('avatar', '');
    toast.success('Image removed. Save changes to update.');
  };

  const onSubmit = async (data: ProfileForm) => {
    setSaving(true);
    try {
      const res = await api.put('/users/influencer/profile', { ...data, avatar: avatarUrl });
      // Update auth store with new profile data
      updateUser({ influencerProfile: res.data.data });
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">My Profile</h1>
        <p className="text-slate-400 mt-1">Manage your influencer profile</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Profile Photo */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-white">Profile Photo</h2>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    displayName?.charAt(0).toUpperCase() || 'I'
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  {uploadingImage ? <Spinner size="sm" className="text-white" /> : <Camera className="w-6 h-6 text-white" />}
                </button>
              </div>
              <div className="flex-1">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                <div className="flex flex-wrap gap-3">
                  <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}>
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadingImage ? 'Uploading...' : 'Upload Photo'}
                  </Button>
                  {avatarUrl && (
                    <Button type="button" variant="ghost" onClick={handleRemoveImage} className="text-red-400 hover:text-red-300 hover:bg-red-500/20">
                      <X className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-2">JPG, PNG or GIF. Max size 5MB.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <User className="h-5 w-5 text-slate-400" />
              Basic Information
            </h2>
          </CardHeader>
          <CardContent className="space-y-6">
            <Input label="Display Name" {...register('displayName', { required: 'Display name is required' })} error={errors.displayName?.message} />
            <Textarea label="Bio" rows={4} placeholder="Tell brands about yourself..." {...register('bio')} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Select label="Primary Niche" options={[{ value: '', label: 'Select your niche' }, ...categories.map(c => ({ value: c.slug, label: c.name }))]} {...register('primaryNiche')} />
              <Input label="Engagement Rate (%)" type="number" step="0.1" min="0" max="100" {...register('engagementRate', { min: 0, max: 100 })} />
            </div>
          </CardContent>
        </Card>

        {/* Social Media */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Globe className="h-5 w-5 text-slate-400" />
              Social Media Accounts
            </h2>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-500/30">
              <div className="flex items-center gap-2 mb-4">
                <Instagram className="w-5 h-5 text-pink-400" />
                <span className="font-medium text-white">Instagram</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Handle" placeholder="@username" {...register('instagramHandle')} />
                <Input label="Followers" type="number" min="0" {...register('instagramFollowers', { min: 0 })} />
              </div>
            </div>
            <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/30">
              <div className="flex items-center gap-2 mb-4">
                <Youtube className="w-5 h-5 text-red-400" />
                <span className="font-medium text-white">YouTube</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Channel Name" placeholder="Channel name" {...register('youtubeHandle')} />
                <Input label="Subscribers" type="number" min="0" {...register('youtubeSubscribers', { min: 0 })} />
              </div>
            </div>
            <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
              <div className="flex items-center gap-2 mb-4">
                <Twitter className="w-5 h-5 text-blue-400" />
                <span className="font-medium text-white">Twitter / X</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Handle" placeholder="@username" {...register('twitterHandle')} />
                <Input label="Followers" type="number" min="0" {...register('twitterFollowers', { min: 0 })} />
              </div>
            </div>
            <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
              <div className="flex items-center gap-2 mb-4">
                <Play className="w-5 h-5 text-slate-300" />
                <span className="font-medium text-white">TikTok</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Handle" placeholder="@username" {...register('tiktokHandle')} />
                <Input label="Followers" type="number" min="0" {...register('tiktokFollowers', { min: 0 })} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" loading={saving}>Save Changes</Button>
        </div>
      </form>
    </div>
  );
}
