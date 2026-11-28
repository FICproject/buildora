import React, { useState } from 'react';
import { ShieldCheck, Lock, Smartphone, Key, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const SecurityPage: React.FC = () => {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isOtpEnabled, setIsOtpEnabled] = useState(true);
  const [successToast, setSuccessToast] = useState(false);

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin && newPin === confirmPin) {
      setSuccessToast(true);
      setTimeout(() => setSuccessToast(false), 3000);
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 sm:p-8 space-y-8">
      <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900">Account Security &amp; Site Access</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your credentials, site authorization PIN, and multi-factor authentication.
          </p>
        </div>
        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5" />
        </div>
      </div>

      {successToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Security credentials updated successfully!
        </div>
      )}

      {/* 1. Quick Contractor PIN */}
      <div className="space-y-4 max-w-lg">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-brand-orange-500" />
          <h3 className="font-bold text-sm text-slate-900">Fast 4-Digit Site Authorization PIN</h3>
        </div>
        <p className="text-xs text-slate-500">
          Used to authorize quick truck offloading and verify instant wallet transactions at checkout.
        </p>

        <form onSubmit={handleUpdatePin} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Current PIN</label>
            <input
              type="password"
              maxLength={4}
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-brand-blue-500 font-mono tracking-widest"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New 4-Digit PIN</label>
              <input
                type="password"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-brand-blue-500 font-mono tracking-widest"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New PIN</label>
              <input
                type="password"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-brand-blue-500 font-mono tracking-widest"
                required
              />
            </div>
          </div>
          <Button type="submit" variant="primary" size="sm">
            Save PIN
          </Button>
        </form>
      </div>

      {/* 2. Two-Factor Authentication */}
      <div className="pt-6 border-t border-slate-100 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-brand-blue-700 flex-shrink-0" />
              <h3 className="font-bold text-sm text-slate-900">SMS OTP Login Authentication</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Require a verified one-time password to your registered mobile number for every sign in.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsOtpEnabled(!isOtpEnabled)}
            className={`w-11 h-6 flex-shrink-0 flex items-center rounded-full p-1 transition-colors ${
              isOtpEnabled ? 'bg-brand-blue-900 justify-end' : 'bg-slate-300 justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-md" />
          </button>
        </div>
      </div>

      {/* 3. Active Sessions */}
      <div className="pt-6 border-t border-slate-100 space-y-3">
        <h3 className="font-bold text-sm text-slate-900">Active Site Sessions</h3>
        <div className="divide-y divide-slate-100 text-xs">
          <div className="py-2.5 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-900">Chrome on Windows (Current Session)</div>
              <div className="text-[11px] text-slate-400">Bengaluru, India &bull; IP: 103.212.x.x</div>
            </div>
            <span className="text-emerald-700 bg-emerald-50 text-[10px] font-bold px-2 py-0.5 rounded-full">
              Active Now
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
