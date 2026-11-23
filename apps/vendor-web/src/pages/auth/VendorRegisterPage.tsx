import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useVendorAuthStore } from '../../store/useVendorAuthStore';
import { Button } from '../../components/common/Button';
import { Store, Mail, Phone, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

export const VendorRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useVendorAuthStore();

  const [storeName, setStoreName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const success = await register({ storeName, email, phone });
    if (success) {
      navigate('/onboarding');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Partner Registration
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Join the BUILDORA 60 supply chain network across Bengaluru.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Store / Business Legal Name
          </label>
          <div className="relative">
            <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              required
              placeholder="e.g. Apex Hardware & Electricals"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Official Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="supplier@domain.com"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Primary Contact Number (WhatsApp Enabled)
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="+91 98765 43210"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1.5">
          <div className="flex items-center gap-1.5 font-medium text-slate-800">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            Requirements for live dispatch:
          </div>
          <ul className="list-disc list-inside text-[11px] text-slate-500 space-y-0.5 ml-2">
            <li>Active GSTIN registration in Karnataka (Code 29)</li>
            <li>Current Bank Account for weekly automated settlements</li>
            <li>Stock dispatch readiness within 60 minutes SLA</li>
          </ul>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full py-2.5"
          isLoading={isLoading}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Create Partner Account
        </Button>
      </form>

      <div className="text-center text-xs text-slate-500 pt-2">
        Already registered?{' '}
        <Link to="/login" className="font-semibold text-blue-600 hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
};
