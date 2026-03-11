'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authAPI } from '../../services/auth';
import { AuthUser } from '../../types/auth';

interface LoginFormData {
  username: string;
  password: string;
}

export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const { showError } = useToast();

  const [formData, setFormData] = useState<LoginFormData>({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { token } = await authAPI.login(formData);
      const userInfo = await authAPI.getUserInfo(token);

      const userData: AuthUser = {
        email: userInfo.email || '',
        name: userInfo.username || '',
        hasAccessToMarketplace: !!userInfo.has_access_to_marketplace,
        businessType: userInfo.business_type,
        role: userInfo.role,
        shopId: userInfo.shop_id,
        b2b_verified: userInfo.b2b_verified || false,
      };

      login(token, userData);
      router.push('/home');

    //   const roleLower = (userInfo.role || '').toLowerCase();
    //   if (
    //     !userInfo.has_access_to_marketplace &&
    //     userInfo.business_type === null &&
    //     roleLower !== 'transporter'
    //   ) {
    //     router.push('/');
    //   } else {
    //     router.push('/home');
    //   }
    } catch (error: any) {
      const message =
        error.response?.data?.non_field_errors?.[0] ||
        error.response?.data?.error ||
        error.response?.data?.detail ||
        'Invalid username or password.';
      showError('Login Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-rice px-4">
      {/* Logo / Brand */}
      <div className="mb-8 text-center">
        <div
          className="w-14 h-14 bg-vermilion flex items-center justify-center text-white text-2xl font-bold font-serif mx-auto mb-4"
          style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }}
        >
          市
        </div>
        <h1 className="font-serif text-2xl font-extrabold text-ink tracking-wide">Mulya</h1>
        <p className="font-mono text-xs text-vermilion tracking-widest uppercase mt-1">
          Japan Marketplace
        </p>
      </div>

      {/* Card */}
      <div className="bg-white border border-black/8 shadow-xl w-full max-w-md p-8 sm:p-10">
        <h2 className="font-serif text-2xl text-ink font-bold mb-1">Welcome back</h2>
        <p className="text-sm text-gray-500 mb-8">Sign in to your business account</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-xs font-semibold text-slate mb-1.5 tracking-wide uppercase">
              Username or Email <span className="text-vermilion">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                placeholder="Enter your username or email"
                className="w-full pl-10 pr-4 py-3 border border-black/12 text-sm text-ink outline-none focus:border-vermilion transition-colors"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-slate mb-1.5 tracking-wide uppercase">
              Password <span className="text-vermilion">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
                className="w-full pl-10 pr-4 py-3 border border-black/12 text-sm text-ink outline-none focus:border-vermilion transition-colors"
              />
            </div>
            <div className="text-right mt-1.5">
              <button
                type="button"
                onClick={() => router.push('/support')}
                className="text-xs text-vermilion hover:text-deep-red font-medium transition-colors"
              >
                Forgot password?
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-vermilion hover:bg-deep-red disabled:opacity-60 text-white font-semibold py-3.5 transition-colors flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
