import { useState, useEffect, useRef } from 'react';
import { Mail, Camera, Upload, X, User } from 'lucide-react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

export default function AdminProfilePage() {
    const { user, updateUser } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState({
        displayName: '',
        avatar: '',
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/admin/profile');
            const data = res.data.data;
            if (data) {
                setFormData({
                    displayName: data.displayName || '',
                    avatar: data.avatar || '',
                });
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error);
            // If profile doesn't exist yet, we might get 404 or just null.
            // We can fail silently or just init with empty.
        } finally {
            setLoading(false);
        }
    };

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
                    oldAvatarUrl: formData.avatar,
                });

                if (res.data.success) {
                    setFormData(prev => ({ ...prev, avatar: res.data.data.url }));
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

    const handleRemoveImage = async () => {
        if (!formData.avatar) return;
        setFormData(prev => ({ ...prev, avatar: '' }));
        toast.success('Image removed. Save changes to update.');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await api.put('/admin/profile', formData);
            updateUser({ adminProfile: res.data.data });
            toast.success('Profile updated successfully');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Admin Profile</h1>
                <p className="text-slate-400 mt-1">Manage your admin profile</p>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Avatar Section */}
                <Card className="mb-6">
                    <CardHeader>
                        <h2 className="text-lg font-semibold text-white">Profile Photo</h2>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-6">
                            {/* Avatar Preview */}
                            <div className="relative group">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                                    {formData.avatar ? (
                                        <img
                                            src={formData.avatar}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        formData.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'A'
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadingImage}
                                    className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                >
                                    {uploadingImage ? (
                                        <Spinner size="sm" className="text-white" />
                                    ) : (
                                        <Camera className="w-6 h-6 text-white" />
                                    )}
                                </button>
                            </div>

                            <div className="flex-1">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageSelect}
                                    className="hidden"
                                />
                                <div className="flex flex-wrap gap-3">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploadingImage}
                                    >
                                        <Upload className="w-4 h-4 mr-2" />
                                        {uploadingImage ? 'Uploading...' : 'Upload Photo'}
                                    </Button>
                                    {formData.avatar && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={handleRemoveImage}
                                            className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                        >
                                            <X className="w-4 h-4 mr-2" />
                                            Remove
                                        </Button>
                                    )}
                                </div>
                                <p className="text-xs text-slate-400 mt-2">
                                    JPG, PNG or GIF. Max size 5MB.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Profile Information */}
                <Card className="mb-6">
                    <CardHeader>
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <User className="w-5 h-5 text-slate-400" />
                            Information
                        </h2>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 gap-6">
                            <Input
                                label="Display Name"
                                value={formData.displayName}
                                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                                placeholder="Your display name"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Account Info */}
                <Card className="mb-6">
                    <CardHeader>
                        <h2 className="text-lg font-semibold text-white">Account Information</h2>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-3 text-slate-300">
                            <Mail className="w-5 h-5" />
                            <span>{user?.email}</span>
                        </div>
                        <p className="text-sm text-slate-400 mt-4">
                            Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </p>
                    </CardContent>
                </Card>

                {/* Save Button */}
                <div className="flex justify-end">
                    <Button type="submit" loading={saving}>
                        Save Changes
                    </Button>
                </div>
            </form>
        </div>
    );
}
