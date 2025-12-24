import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Lock, ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../lib/api';
import Button from '../../components/ui/Button';

interface ResetPasswordForm {
    newPassword: string;
    confirmPassword: string;
}

export default function ResetPassword() {
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const resetToken = location.state?.resetToken;

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<ResetPasswordForm>();

    const newPassword = watch('newPassword');

    // Redirect if no reset token
    useEffect(() => {
        if (!resetToken) {
            toast.error('Invalid reset session. Please start over.');
            navigate('/forgot-password');
        }
    }, [resetToken, navigate]);

    const onSubmit = async (data: ResetPasswordForm) => {
        setLoading(true);
        try {
            const response = await api.post('/auth/reset-password', {
                resetToken,
                newPassword: data.newPassword,
            });

            if (response.data.success) {
                toast.success('Password reset successfully!');
                // Navigate to login after a brief delay
                setTimeout(() => {
                    navigate('/login');
                }, 1500);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to reset password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Password strength indicator
    const getPasswordStrength = (password: string) => {
        if (!password) return { strength: 0, label: '', color: '' };

        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;

        const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
        const colors = ['', 'bg-rose-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500', 'bg-emerald-400'];

        return { strength, label: labels[strength], color: colors[strength] };
    };

    const passwordStrength = getPasswordStrength(newPassword);

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-slate-950 to-slate-950" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full max-w-md"
            >
                {/* Back Link */}
                <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Login</span>
                </Link>

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500/20 to-rose-500/20 border border-white/10 mb-6">
                        <Lock className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Reset Password</h1>
                    <p className="text-slate-400">
                        Create a strong new password for your account.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* New Password */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">New Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                {...register('newPassword', {
                                    required: 'Password is required',
                                    minLength: { value: 8, message: 'Password must be at least 8 characters' },
                                    pattern: {
                                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                                        message: 'Must contain uppercase, lowercase, and number',
                                    },
                                })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 pl-11 pr-11 text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all placeholder:text-slate-600"
                                placeholder="Enter new password"
                            />
                            <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                        {errors.newPassword && (
                            <span className="text-rose-500 text-xs">{errors.newPassword.message}</span>
                        )}

                        {/* Password Strength Indicator */}
                        {newPassword && (
                            <div className="mt-2">
                                <div className="flex gap-1 mb-1">
                                    {[1, 2, 3, 4, 5].map((level) => (
                                        <div
                                            key={level}
                                            className={`h-1 flex-1 rounded-full transition-all ${level <= passwordStrength.strength ? passwordStrength.color : 'bg-slate-700'
                                                }`}
                                        />
                                    ))}
                                </div>
                                <p className="text-xs text-slate-400">
                                    Strength: <span className="font-medium">{passwordStrength.label}</span>
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Confirm Password</label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                {...register('confirmPassword', {
                                    required: 'Please confirm your password',
                                    validate: (value) => value === newPassword || 'Passwords do not match',
                                })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 pl-11 pr-11 text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all placeholder:text-slate-600"
                                placeholder="Confirm new password"
                            />
                            <CheckCircle2 className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                            >
                                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                        {errors.confirmPassword && (
                            <span className="text-rose-500 text-xs">{errors.confirmPassword.message}</span>
                        )}
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-12 text-base bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 shadow-lg shadow-rose-900/20"
                        loading={loading}
                    >
                        Reset Password
                    </Button>
                </form>

                {/* Password Requirements */}
                <div className="mt-6 p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
                    <p className="text-xs text-slate-400 mb-2 font-medium">Password must contain:</p>
                    <ul className="text-xs text-slate-500 space-y-1">
                        <li className="flex items-center gap-2">
                            <span className={newPassword?.length >= 8 ? 'text-emerald-400' : ''}>✓</span>
                            At least 8 characters
                        </li>
                        <li className="flex items-center gap-2">
                            <span className={/[A-Z]/.test(newPassword || '') ? 'text-emerald-400' : ''}>✓</span>
                            One uppercase letter
                        </li>
                        <li className="flex items-center gap-2">
                            <span className={/[a-z]/.test(newPassword || '') ? 'text-emerald-400' : ''}>✓</span>
                            One lowercase letter
                        </li>
                        <li className="flex items-center gap-2">
                            <span className={/[0-9]/.test(newPassword || '') ? 'text-emerald-400' : ''}>✓</span>
                            One number
                        </li>
                    </ul>
                </div>

                {/* Footer */}
                <p className="mt-8 text-center text-sm text-slate-400">
                    Remember your password?{' '}
                    <Link to="/login" className="text-rose-400 hover:text-rose-300 font-bold hover:underline">
                        Sign In
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
