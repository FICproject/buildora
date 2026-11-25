import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, Building2 } from 'lucide-react';
import { adminApi } from '../services/adminApi';
import { useAdminAuthStore } from '../store/useAdminAuthStore';
import { Button, ToastContainer, useToastStore } from '../components/ui';

const DEMO_ACCOUNTS = [
  { label: 'Company Owner (BLR)', email: 'admin@buildora.in', role: 'Full Access' },
  { label: 'Operations Mgr (BLR)', email: 'ops@buildora.in', role: 'Orders & Logistics' },
  { label: 'Catalog Mgr (BLR)', email: 'catalog@buildora.in', role: 'Catalog & CMS' },
  { label: 'Finance Mgr (BLR)', email: 'finance@buildora.in', role: 'Settlements & GST' },
  { label: 'Hyderabad Owner (Isolated)', email: 'hyd-admin@buildora.in', role: 'Tenant HYD' },
];

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const setSession = useAdminAuthStore((s) => s.setSession);
  const pushToast = useToastStore((s) => s.push);

  const [email, setEmail] = useState('admin@buildora.in');
  const [password, setPassword] = useState('Admin@123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await adminApi.login({ email, password });
      setSession({
        user: res.user,
        tenant: res.tenant,
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
      });
      pushToast({
        title: `Welcome, ${res.user.name}`,
        message: `Signed in to ${res.tenant.name}`,
      });
      navigate('/');
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F4] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 bg-white border border-[#E5DCD3] rounded-2xl overflow-hidden shadow-elevated">
        {/* Left Info Panel */}
        <div className="md:col-span-5 bg-[#5E5946] text-white p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-9 h-9 rounded-lg bg-[#AE887B] text-white font-bold flex items-center justify-center shadow-sm">
                B60
              </div>
              <div>
                <p className="font-bold tracking-tight text-base text-white">BUILDORA 60</p>
                <p className="text-xs text-[#F0DED0]/85">Company Admin Portal</p>
              </div>
            </div>

            <h1 className="text-2xl font-bold leading-snug mb-3 text-white">
              Unified Enterprise Control Tower
            </h1>
            <p className="text-sm text-[#F0DED0]/90 leading-relaxed">
              Manage vendor onboarding, catalog approvals, warehouse stock, bulk RFQs, 60-minute dispatch, settlements, and customer storefront content in real time.
            </p>
          </div>

          <div className="mt-8 space-y-2.5 text-xs text-[#F0DED0]/90">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#AE887B] shrink-0" />
              <span>Strict Tenant Isolation & Role-Based Access</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#AE887B] shrink-0" />
              <span>Synced Live with Customer Web & Vendor Portal</span>
            </div>
          </div>
        </div>

        {/* Right Login Form */}
        <div className="md:col-span-7 p-7 sm:p-9 bg-white">
          <h2 className="text-lg font-bold text-[#5E5946]">Company Admin Sign In</h2>
          <p className="text-xs text-[#6E6859] mt-1 mb-6">
            Authenticate with your assigned company credentials.
          </p>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#C94444] font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#5E5946] mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#6E6859] absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#E5DCD3] rounded-lg focus:outline-none focus:border-[#AE887B]"
                  placeholder="admin@buildora.in"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5E5946] mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#6E6859] absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#E5DCD3] rounded-lg focus:outline-none focus:border-[#AE887B]"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full py-2.5">
              {loading ? 'Verifying Credentials...' : 'Sign In to Workspace'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {/* Demo Role Switcher */}
          <div className="mt-6 pt-5 border-t border-[#E5DCD3]">
            <p className="text-[11px] font-semibold text-[#5E5946] uppercase tracking-wider mb-2.5">
              Quick Role Select (Password: Admin@123)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword('Admin@123');
                  }}
                  className={`text-left px-3 py-2 rounded-lg border text-xs transition-colors ${
                    email === acc.email
                      ? 'border-[#AE887B] bg-[#F0DED0]/70 text-[#5E5946]'
                      : 'border-[#E5DCD3] bg-white hover:bg-[#FAF7F4] text-[#3D392C]'
                  }`}
                >
                  <p className="font-semibold truncate text-[#5E5946]">{acc.label}</p>
                  <p className="text-[10px] text-[#6E6859] truncate">
                    {acc.email} • {acc.role}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};
