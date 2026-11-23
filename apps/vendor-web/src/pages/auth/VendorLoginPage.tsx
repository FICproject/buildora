import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useVendorAuthStore } from '../../store/useVendorAuthStore';
import { Button } from '../../components/common/Button';
import { Mail, Lock, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';

export const VendorLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useVendorAuthStore();

  const [email, setEmail] = useState('vendor@buildora.in');
  const [password, setPassword] = useState('Vendor@123');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const success = await login(email, password);
    if (success) {
      navigate('/dashboard');
    }
  };

  const handleDemoLogin = async () => {
    setEmail('vendor@buildora.in');
    setPassword('Vendor@123');
    const success = await login('vendor@buildora.in', 'Vendor@123');
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="space-y-6">
      {/* Mobile Brand Header */}
      <div className="lg:hidden flex items-center gap-2 mb-8">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold text-lg">
          B
        </div>
        <span className="font-extrabold text-xl tracking-tight text-slate-900">
          BUILDORA <span className="text-amber-600 text-sm">60</span>
        </span>
      </div>

      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Vendor Partner Login</h2>
        <p className="text-sm text-slate-500 mt-1">
          Access your supplier catalog, dark store dispatch, and live contractor orders.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Demo 1-Click Login Card */}
      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            Quick Demo Access
          </div>
          <p className="text-[11px] text-blue-700 mt-0.5">
            Log in directly as <strong>Supreme Materials BLR</strong> (Pre-configured store).
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleDemoLogin}
          isLoading={isLoading}
        >
          1-Click Login
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Business Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="supplier@company.com"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700">Password</label>
            <a href="#" className="text-xs font-medium text-blue-600 hover:underline">
              Forgot password?
            </a>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full py-2.5"
          isLoading={isLoading}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Sign In to Vendor Portal
        </Button>
      </form>

      <div className="text-center text-xs text-slate-500 pt-2">
        Want to become a certified vendor?{' '}
        <Link to="/register" className="font-semibold text-blue-600 hover:underline">
          Register your store
        </Link>
      </div>
    </div>
  );
};
