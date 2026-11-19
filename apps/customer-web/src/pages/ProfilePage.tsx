import React, { useState } from 'react';
import { User, Phone, Mail, Building2, CheckCircle2, Save } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/ui/Button';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuthStore();

  const [name, setName] = useState(user?.name || 'Arjun Verma');
  const [email, setEmail] = useState(user?.email || 'arjun.verma@buildora.com');
  const [businessName, setBusinessName] = useState(user?.businessName || 'Apex Infra Construction Ltd');
  const [gstin, setGstin] = useState(user?.gstin || '29AABCB1234F1Z8');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name,
      email,
      businessName,
      gstin
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 sm:p-8 space-y-6">
      <div className="pb-4 border-b border-slate-100">
        <h2 className="text-xl font-black text-slate-900">Personal &amp; Business Profile</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your contact credentials and business GST details for automatic tax invoice generation.
        </p>
      </div>

      {isSaved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Profile updated successfully!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-blue-500 font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Registered Phone</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={user?.phone || '9876543210'}
                disabled
                className="w-full pl-9 pr-3 py-2 border rounded-lg bg-slate-50 text-slate-500 font-medium cursor-not-allowed"
              />
            </div>
            <span className="text-[10px] text-slate-400">Phone verified for OTP authentication</span>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-blue-500 font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Company / Firm Name</label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-blue-500 font-medium"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="font-bold text-slate-700 block mb-1">15-Digit GSTIN Number</label>
            <input
              type="text"
              maxLength={15}
              value={gstin}
              onChange={(e) => setGstin(e.target.value.toUpperCase())}
              className="w-full p-2 border rounded-lg font-mono font-bold focus:outline-none focus:ring-1 focus:ring-brand-blue-500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Entering a valid GSTIN enables instant Input Tax Credit (ITC) tax invoice downloads on all material orders.
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <Button variant="primary" size="md" type="submit" leftIcon={<Save className="w-4 h-4" />}>
            Save Profile Changes
          </Button>
        </div>
      </form>
    </div>
  );
};
