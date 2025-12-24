import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../lib/api';
import Button from '../../components/ui/Button';

interface ForgotPasswordForm {
    email: string;
}

export default function ForgotPassword() {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordForm>();

    const onSubmit = async (data: ForgotPasswordForm) => {
        setLoading(true);
        try {
            const response = await api.post('/auth/forgot-password', { email: data.email });

            if (response.data.success) {
                toast.success('OTP sent to your email!');
                // Navigate to OTP verification page with email
                navigate('/verify-otp', { state: { email: data.email } });
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

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
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-rose-500/20 to-indigo-500/20 border border-white/10 mb-6">
                        <Mail className="w-8 h-8 text-rose-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Forgot Password?</h1>
                    <p className="text-slate-400">
                        No worries! Enter your email and we'll send you a 6-digit OTP to reset your password.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Email Address</label>
                        <div className="relative">
                            <input
                                type="email"
                                {...register('email', {
                                    required: 'Email is required',
                                    pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' },
                                })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 pl-11 text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all placeholder:text-slate-600"
                                placeholder="Enter your email"
                            />
                            <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
                        </div>
                        {errors.email && <span className="text-rose-500 text-xs">{errors.email.message}</span>}
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-12 text-base bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 shadow-lg shadow-rose-900/20"
                        loading={loading}
                    >
                        <Send className="w-4 h-4 mr-2" />
                        Send OTP
                    </Button>
                </form>

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
