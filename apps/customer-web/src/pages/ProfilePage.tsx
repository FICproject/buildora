import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, Building2, CheckCircle2, Save, AlertCircle, ShieldCheck, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/ui/Button';
import { ChangePhoneNumberModal } from '../components/profile/ChangePhoneNumberModal';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuthStore();

  // Split existing user name into First and Last name
  const nameParts = (user?.name || 'Arjun Verma').trim().split(' ');
  const initialFirst = nameParts[0] || 'Arjun';
  const initialLast = nameParts.slice(1).join(' ') || (nameParts.length === 1 ? '' : 'Verma');

  // Card 1: Personal & Contact Information State
  const [firstName, setFirstName] = useState(initialFirst);
  const [lastName, setLastName] = useState(initialLast);
  const [email, setEmail] = useState(user?.email || 'arjun.verma@buildora.com');
  const [isSavingPersonal, setIsSavingPersonal] = useState(false);
  const [personalSaved, setPersonalSaved] = useState(false);
  const [personalError, setPersonalError] = useState('');

  // Phone Change Modal State
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [phoneSuccessMessage, setPhoneSuccessMessage] = useState<string | null>(null);

  // Card 2: GST & Business Tax Information State
  const [businessName, setBusinessName] = useState(user?.businessName || 'Apex Infra Construction Ltd');
  const [gstin, setGstin] = useState(user?.gstin || '29AABCB1234F1Z8');
  const [isSavingGst, setIsSavingGst] = useState(false);
  const [gstSaved, setGstSaved] = useState(false);
  const [gstError, setGstError] = useState('');

  // Synchronize with store user state on mount and updates
  useEffect(() => {
    if (user) {
      const parts = (user.name || '').trim().split(' ');
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' '));
      if (user.email) setEmail(user.email);
      if (user.businessName) setBusinessName(user.businessName);
      if (user.gstin) setGstin(user.gstin);
    }
  }, [user]);

  // Dedicated Save 1: Personal Information
  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    setPersonalError('');

    if (!firstName.trim() || firstName.trim().length < 2) {
      setPersonalError('First Name is required (minimum 2 characters).');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setPersonalError('Please enter a valid email address.');
      return;
    }

    setIsSavingPersonal(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      await updateProfile({
        name: fullName,
        email: email.trim()
      });
      setPersonalSaved(true);
      setTimeout(() => setPersonalSaved(false), 3500);
    } catch (err: any) {
      setPersonalError(err?.message || 'Failed to update personal information. Please try again.');
    } finally {
      setIsSavingPersonal(false);
    }
  };

  // Dedicated Save 2: GST Information
  const handleSaveGst = async (e: React.FormEvent) => {
    e.preventDefault();
    setGstError('');
    const cleanGstin = gstin.trim().toUpperCase();

    if (cleanGstin.length > 0) {
      // 15-character Indian GSTIN format check
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstinRegex.test(cleanGstin)) {
        setGstError('GSTIN Number must be a valid 15-character format (e.g. 29AABCB1234F1Z8).');
        return;
      }
      if (!businessName.trim() || businessName.trim().length < 2) {
        setGstError('Company / Firm Name is required when providing a GSTIN.');
        return;
      }
    }

    setIsSavingGst(true);
    try {
      await updateProfile({
        businessName: businessName.trim(),
        gstin: cleanGstin
      });
      setGstSaved(true);
      setTimeout(() => setGstSaved(false), 3500);
    } catch (err: any) {
      setGstError(err?.message || 'Failed to update GST information. Please try again.');
    } finally {
      setIsSavingGst(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* CARD 1: PERSONAL & BUSINESS PROFILE                     */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 sm:p-8 space-y-5">
        <div className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900">Personal &amp; Business Profile</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage your personal credentials, contact email, and verified phone number.
            </p>
          </div>
          <span className="self-start sm:self-auto text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
            Profile Details
          </span>
        </div>

        {personalSaved && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Personal profile updated successfully!</span>
          </div>
        )}

        {phoneSuccessMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{phoneSuccessMessage}</span>
          </div>
        )}

        {personalError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{personalError}</span>
          </div>
        )}

        <form onSubmit={handleSavePersonal} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">First Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Arjun"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue-500 font-medium text-xs"
                />
              </div>
            </div>

            {/* Last Name */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Last Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. Verma"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue-500 font-medium text-xs"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue-500 font-medium text-xs"
                />
              </div>
            </div>

            {/* Registered Phone (Verified with Secure Change Flow) */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                <label className="font-bold text-slate-700">Phone Number</label>
                <button
                  type="button"
                  onClick={() => setIsPhoneModalOpen(true)}
                  className="text-[11px] font-bold text-brand-blue-900 hover:text-brand-orange-600 hover:underline flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className="w-3 h-3 text-brand-orange-500" />
                  <span>Change Phone Number</span>
                </button>
              </div>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={user?.phone || '9876543210'}
                  disabled
                  className="w-full pl-9 pr-24 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 font-mono font-bold cursor-not-allowed text-xs"
                />
                <button
                  type="button"
                  onClick={() => setIsPhoneModalOpen(true)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-white border border-slate-200 hover:border-brand-blue-500 text-brand-blue-900 rounded-lg text-[10px] font-black tracking-tight shadow-xs transition-all hover:bg-brand-blue-50"
                  title="Initiate secure phone change"
                >
                  Change
                </button>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Verified with mobile OTP. Click <strong className="text-slate-600 font-bold">Change Phone Number</strong> to update via dual-OTP security verification.
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <Button
              variant="primary"
              size="md"
              type="submit"
              disabled={isSavingPersonal}
              className="bg-brand-blue-900 hover:bg-brand-blue-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm"
              leftIcon={<Save className="w-4 h-4" />}
            >
              {isSavingPersonal ? 'Saving...' : 'Save Personal Information'}
            </Button>
          </div>
        </form>
      </div>

      {/* ======================================================== */}
      {/* CARD 2: GST INFORMATION (INDEPENDENT SECTION)             */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 sm:p-8 space-y-5">
        <div className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-orange-500" />
              GST Information
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Registered business tax details for eligible 18% &amp; 28% Input Tax Credit (ITC) tax invoice downloads.
            </p>
          </div>
          <span className="self-start sm:self-auto text-[10px] font-black uppercase tracking-wider bg-brand-orange-50 text-brand-orange-800 border border-brand-orange-200 px-2.5 py-1 rounded-lg">
            Tax &amp; B2B ITC
          </span>
        </div>

        {gstSaved && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>GST details updated successfully!</span>
          </div>
        )}

        {gstError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{gstError}</span>
          </div>
        )}

        <form onSubmit={handleSaveGst} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Company / Firm Name */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Company / Firm Name</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. Apex Infra Construction Ltd"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue-500 font-medium text-xs"
                />
              </div>
            </div>

            {/* 15-Digit GSTIN Number */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">15-Digit GSTIN Number</label>
              <input
                type="text"
                maxLength={15}
                placeholder="29AABCB1234F1Z8"
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-blue-500 text-xs"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-600 text-[11px] leading-relaxed">
            <strong className="text-slate-900 font-bold">Why provide GSTIN?</strong> A valid 15-digit GSTIN is automatically applied to all construction material dispatches, enabling instant GST tax invoice downloads with eligible Input Tax Credit (ITC) for your registered firm.
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <Button
              variant="primary"
              size="md"
              type="submit"
              disabled={isSavingGst}
              className="bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm"
              leftIcon={<Save className="w-4 h-4" />}
            >
              {isSavingGst ? 'Saving...' : 'Save GST Information'}
            </Button>
          </div>
        </form>
      </div>

      {/* Secure Dual-OTP Change Phone Number Modal */}
      <ChangePhoneNumberModal
        isOpen={isPhoneModalOpen}
        onClose={() => setIsPhoneModalOpen(false)}
        currentPhone={user?.phone || '9876543210'}
        onPhoneUpdated={(newPhone) => {
          setPhoneSuccessMessage(`Registered mobile number updated successfully to +91 ${newPhone}!`);
          setTimeout(() => setPhoneSuccessMessage(null), 5000);
        }}
      />
    </div>
  );
};
