import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Megaphone, Building2, User } from 'lucide-react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
}

export default function Register() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'CLIENT' | 'INFLUENCER'>(
    (searchParams.get('role') as 'CLIENT' | 'INFLUENCER') || 'CLIENT'
  );
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>();
  const password = watch('password');

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/register', {
        email: data.email,
        password: data.password,
        role: selectedRole,
      });
      const { user, token } = response.data.data;
      setAuth(user, token);
      toast.success('Account created successfully!');

      navigate(selectedRole === 'CLIENT' ? '/client/dashboard' : '/influencer/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center mb-4">
            <Megaphone className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white">Create an account</h2>
          <p className="mt-2 text-slate-400">Join our marketplace today</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 shadow-lg p-8">
          {/* Role Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-3">I am a...</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSelectedRole('CLIENT')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedRole === 'CLIENT'
                    ? 'border-rose-500 bg-rose-500/10'
                    : 'border-slate-600 hover:border-slate-500 bg-slate-800/50'
                }`}
              >
                <Building2
                  className={`mx-auto h-8 w-8 ${selectedRole === 'CLIENT' ? 'text-rose-400' : 'text-slate-400'}`}
                />
                <p className={`mt-2 font-medium ${selectedRole === 'CLIENT' ? 'text-rose-400' : 'text-slate-300'}`}>
                  Brand / Client
                </p>
                <p className="text-xs text-slate-500 mt-1">Post campaigns</p>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('INFLUENCER')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedRole === 'INFLUENCER'
                    ? 'border-rose-500 bg-rose-500/10'
                    : 'border-slate-600 hover:border-slate-500 bg-slate-800/50'
                }`}
              >
                <User
                  className={`mx-auto h-8 w-8 ${selectedRole === 'INFLUENCER' ? 'text-rose-400' : 'text-slate-400'}`}
                />
                <p className={`mt-2 font-medium ${selectedRole === 'INFLUENCER' ? 'text-rose-400' : 'text-slate-300'}`}>
                  Influencer
                </p>
                <p className="text-xs text-slate-500 mt-1">Find campaigns</p>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="Email"
              type="email"
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' },
              })}
              error={errors.email?.message}
            />

            <Input
              label="Password"
              type="password"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'Password must be at least 8 characters' },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message: 'Password must contain uppercase, lowercase, and number',
                },
              })}
              error={errors.password?.message}
            />

            <Input
              label="Confirm Password"
              type="password"
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value) => value === password || 'Passwords do not match',
              })}
              error={errors.confirmPassword?.message}
            />

            <Button type="submit" className="w-full" loading={loading}>
              Create Account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-rose-400 hover:text-rose-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
