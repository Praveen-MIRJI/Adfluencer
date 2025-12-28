import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Mail, Lock, CheckCircle2, TrendingUp, Activity, Building2, User as UserIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/ui/Button';
import { User } from '../../types';

interface AuthForm {
  email: string;
  password: string;
  confirmPassword?: string;
}

export default function Login() {
  const [searchParams] = useSearchParams();
  const [isRegister, setIsRegister] = useState(false);

  useEffect(() => {
    if (searchParams.get('mode') === 'register') {
      setIsRegister(true);
    }
  }, [searchParams]);

  const [selectedRole, setSelectedRole] = useState<'CLIENT' | 'INFLUENCER'>('CLIENT');
  const [loading, setLoading] = useState(false);
  const [socialModal, setSocialModal] = useState<{ isOpen: boolean; provider: 'google' | 'linkedin' | null }>({
    isOpen: false,
    provider: null
  });

  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<AuthForm>();

  const password = watch('password');

  const toggleMode = () => {
    setIsRegister(!isRegister);
    reset();
  };

  const onSubmit = async (data: AuthForm) => {
    setLoading(true);
    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const payload = isRegister
        ? { email: data.email, password: data.password, role: selectedRole }
        : { email: data.email, password: data.password };

      const response = await api.post(endpoint, payload);
      const { user, token } = response.data.data;
      setAuth(user, token);

      toast.success(isRegister ? 'Account created successfully!' : 'Welcome back!');
      
      // Navigate to dashboard - spin wheel will be shown there if needed
      setTimeout(() => {
        switch (user.role) {
          case 'CLIENT':
            navigate('/client/dashboard');
            break;
          case 'INFLUENCER':
            navigate('/influencer/dashboard');
            break;
          case 'ADMIN':
            navigate('/admin/dashboard');
            break;
        }
      }, 500);

    } catch (error: any) {
      toast.error(error.response?.data?.error || (isRegister ? 'Registration failed' : 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  const openSocialModal = (provider: 'google' | 'linkedin') => {
    setSocialModal({ isOpen: true, provider });
  };

  const handleSocialSelect = (accountType: 'BRAND' | 'CREATOR') => {
    const provider = socialModal.provider;
    setSocialModal({ isOpen: false, provider: null });

    toast.loading(`Authenticating with ${provider === 'google' ? 'Google' : 'LinkedIn'}...`, {
      duration: 1000,
    });

    setTimeout(() => {
      toast.dismiss();
      toast.success(`Successfully logged in via ${provider === 'google' ? 'Google' : 'LinkedIn'}`);

      // Create Demo User
      const demoUser: User = {
        id: `demo-${provider}-${Date.now()}`,
        email: `demo.${accountType.toLowerCase()}@${provider}.com`,
        role: accountType === 'BRAND' ? 'CLIENT' : 'INFLUENCER',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        clientProfile: accountType === 'BRAND' ? {
          id: 'demo-client-profile',
          userId: 'demo-client-id',
          companyName: provider === 'google' ? 'TechGiant Inc.' : 'Professional Corp',
          industry: 'Technology',
          avatar: `https://ui-avatars.com/api/?name=${provider === 'google' ? 'Google+Brand' : 'LinkedIn+Corp'}&background=0D8ABC&color=fff`
        } : undefined,
        influencerProfile: accountType === 'CREATOR' ? {
          id: 'demo-inf-profile',
          userId: 'demo-inf-id',
          displayName: provider === 'google' ? 'YouTube Star' : 'LinkedIn Thought Leader',
          avatar: `https://ui-avatars.com/api/?name=${provider === 'google' ? 'Creator' : 'Professional'}&background=random&color=fff`
        } : undefined
      };

      const demoToken = 'demo-jwt-token';
      setAuth(demoUser, demoToken);

      if (demoUser.role === 'CLIENT') {
        navigate('/client/dashboard');
      } else {
        navigate('/influencer/dashboard');
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex relative">
      {/* Social Login Modal */}
      <AnimatePresence>
        {socialModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <img
                    src={socialModal.provider === 'google'
                      ? "https://www.svgrepo.com/show/475656/google-color.svg"
                      : "https://www.svgrepo.com/show/448234/linkedin.svg"}
                    className="w-6 h-6"
                    alt="Logo"
                  />
                  Sign in with {socialModal.provider === 'google' ? 'Google' : 'LinkedIn'}
                </h3>
                <button
                  onClick={() => setSocialModal({ isOpen: false, provider: null })}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-500 mb-2">Choose an account to continue to Adfluencer</p>

                {/* Account Option 1: Brand */}
                <button
                  onClick={() => handleSocialSelect('BRAND')}
                  className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all group text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg">
                    {socialModal.provider === 'google' ? 'T' : 'P'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
                      {socialModal.provider === 'google' ? 'TechGiant Inc.' : 'Professional Corp'}
                    </p>
                    <p className="text-xs text-gray-500">demo.brand@{socialModal.provider}.com</p>
                  </div>
                </button>

                {/* Account Option 2: Creator */}
                <button
                  onClick={() => handleSocialSelect('CREATOR')}
                  className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all group text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-lg">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 group-hover:text-rose-600 transition-colors">
                      {socialModal.provider === 'google' ? 'Demo Creator' : 'Linked Influencer'}
                    </p>
                    <p className="text-xs text-gray-500">demo.creator@{socialModal.provider}.com</p>
                  </div>
                </button>

                <div className="pt-4 border-t border-gray-100">
                  <button className="w-full text-center text-sm font-medium text-gray-600 hover:text-gray-900 py-2">
                    Use another account
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Visual Side (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-slate-950 items-center justify-center">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-slate-950 to-slate-950" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light" />

        {/* Tech Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        {/* Floating Abstract Shapes */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-[100px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] animate-pulse-slow delay-1000" />

        <div className="relative z-10 w-full max-w-lg px-8">
          {/* Logo Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-12"
          >
            <div className="p-3 bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl">
              <img src="/adfluencer-logo.png" alt="Adfluencer" className="w-8 h-8 object-contain" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Adfluencer</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl font-black text-white leading-tight mb-8"
          >
            Scale your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-indigo-400">influence</span> with
            precision.
          </motion.h1>

          {/* Feature Stats Grid */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 gap-4 mb-12"
          >
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-4 rounded-2xl">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white">3.5x</div>
              <div className="text-sm text-slate-400">Average ROI</div>
            </div>
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-4 rounded-2xl">
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center mb-3">
                <Activity className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="text-2xl font-bold text-white">95%</div>
              <div className="text-sm text-slate-400">Campaign Success</div>
            </div>
          </motion.div>

          {/* Testimonial Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-2xl relative"
          >
            <div className="absolute -top-4 -right-4 w-12 h-12 bg-rose-500/20 backdrop-blur-md rounded-full flex items-center justify-center border border-rose-500/20">
              <span className="text-xl">💬</span>
            </div>
            <p className="text-slate-300 text-sm italic mb-4 leading-relaxed">
              "The analytics dashboard is a game-changer. We've scaled our creator network by 400% in just two months using Adfluencer's tools."
            </p>
            <div className="flex items-center gap-3">
              <img src="https://i.pravatar.cc/100?img=32" className="w-10 h-10 rounded-full border-2 border-slate-800" alt="User" />
              <div>
                <p className="text-white font-semibold text-sm">Elena Rodriguez</p>
                <p className="text-rose-400 text-xs font-medium">Head of Growth, Visionary</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Form Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-950">
        <motion.div
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full"
        >
          {/* Mobile Logo - Only visible when visual side is hidden */}
          <div className="flex items-center justify-center gap-3 mb-6 lg:mb-8 lg:hidden">
            <div className="p-3 bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl">
              <img src="/adfluencer-logo.png" alt="Adfluencer" className="w-8 h-8 object-contain" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Adfluencer</span>
          </div>

          <div className="mb-8 lg:mb-10 text-center lg:text-left">
            <motion.h2 layout className="text-2xl lg:text-3xl font-bold text-white mb-2">
              {isRegister ? 'Create Account' : 'Welcome Back'}
            </motion.h2>
            <motion.p layout className="text-slate-400 text-sm lg:text-base">
              {isRegister ? 'Join the leading marketplace for creators.' : 'Please enter your details to sign in.'}
            </motion.p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* Role Selection (Only Register) */}
            <AnimatePresence>
              {isRegister && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="overflow-hidden"
                >
                  <label className="block text-sm font-medium text-slate-300 mb-3">I am a...</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setSelectedRole('CLIENT')}
                      className={`p-3 rounded-xl border transition-all flex flex-col items-center justify-center gap-2 ${selectedRole === 'CLIENT'
                        ? 'border-rose-500 bg-rose-500/10'
                        : 'border-slate-700 hover:border-slate-600 bg-slate-900'
                        }`}
                    >
                      <Building2 className={`w-6 h-6 ${selectedRole === 'CLIENT' ? 'text-rose-400' : 'text-slate-400'}`} />
                      <span className={`text-sm font-medium ${selectedRole === 'CLIENT' ? 'text-white' : 'text-slate-400'}`}>Brand</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRole('INFLUENCER')}
                      className={`p-3 rounded-xl border transition-all flex flex-col items-center justify-center gap-2 ${selectedRole === 'INFLUENCER'
                        ? 'border-rose-500 bg-rose-500/10'
                        : 'border-slate-700 hover:border-slate-600 bg-slate-900'
                        }`}
                    >
                      <UserIcon className={`w-6 h-6 ${selectedRole === 'INFLUENCER' ? 'text-rose-400' : 'text-slate-400'}`} />
                      <span className={`text-sm font-medium ${selectedRole === 'INFLUENCER' ? 'text-white' : 'text-slate-400'}`}>Creator</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' },
                  })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 pl-11 text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all placeholder:text-slate-600"
                  placeholder="name@company.com"
                />
                <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
              </div>
              {errors.email && <span className="text-rose-500 text-xs">{errors.email.message}</span>}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-300">Password</label>
                {!isRegister && <Link to="/forgot-password" className="text-xs text-rose-400 hover:text-rose-300 font-medium">Forgot password?</Link>}
              </div>
              <div className="relative">
                <input
                  type="password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: isRegister ? { value: 8, message: 'Min 8 chars' } : undefined
                  })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 pl-11 text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all placeholder:text-slate-600"
                  placeholder="••••••••"
                />
                <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
              </div>
              {errors.password && <span className="text-rose-500 text-xs">{errors.password.message}</span>}
            </div>

            {/* Confirm Password (Only Register) */}
            <AnimatePresence>
              {isRegister && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="overflow-hidden space-y-2"
                >
                  <label className="text-sm font-medium text-slate-300">Confirm Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      {...register('confirmPassword', {
                        required: isRegister ? 'Confirm password' : false,
                        validate: (val) => !isRegister || val === password || 'Passwords do not match'
                      })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 pl-11 text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all placeholder:text-slate-600"
                      placeholder="••••••••"
                    />
                    <CheckCircle2 className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
                  </div>
                  {errors.confirmPassword && <span className="text-rose-500 text-xs">{errors.confirmPassword.message}</span>}
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              className="w-full h-12 text-base bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 shadow-lg shadow-rose-900/20"
              loading={loading}
            >
              {isRegister ? 'Create Account' : 'Sign In'}
            </Button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-950 px-2 text-slate-500">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => openSocialModal('google')}
                className="flex items-center justify-center gap-2 bg-slate-900 border border-slate-700 hover:bg-slate-800 rounded-xl py-2.5 transition-all hover:border-slate-600 hover:shadow-lg active:scale-95"
              >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                <span className="text-slate-300 text-sm font-medium">Google</span>
              </button>
              <button
                type="button"
                onClick={() => openSocialModal('linkedin')}
                className="flex items-center justify-center gap-2 bg-slate-900 border border-slate-700 hover:bg-slate-800 rounded-xl py-2.5 transition-all hover:border-slate-600 hover:shadow-lg active:scale-95"
              >
                <img src="https://www.svgrepo.com/show/448234/linkedin.svg" className="w-5 h-5" alt="LinkedIn" />
                <span className="text-slate-300 text-sm font-medium">LinkedIn</span>
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-slate-400">
            {isRegister ? 'Already have an account? ' : "Don't have an account? "}
            <button
              onClick={toggleMode}
              className="text-rose-400 hover:text-rose-300 font-bold hover:underline decoration-2 underline-offset-4"
            >
              {isRegister ? 'Sign In' : 'Create an account'}
            </button>
          </p>

          <div className="mt-12 flex items-center justify-center gap-2 text-slate-600 text-xs">
            <Lock className="w-3 h-3" />
            <span>Secured by 256-bit encryption</span>
          </div>

        </motion.div>
      </div>
    </div>
  );
}
