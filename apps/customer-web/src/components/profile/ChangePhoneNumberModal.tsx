import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  Lock
} from 'lucide-react';
import { Button } from '../ui/Button';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';

interface ChangePhoneNumberModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPhone: string;
  onPhoneUpdated: (newPhone: string) => void;
}

type Step = 'ENTER_NEW' | 'VERIFY_OLD' | 'VERIFY_NEW' | 'CONFIRM' | 'SUCCESS';

export const ChangePhoneNumberModal: React.FC<ChangePhoneNumberModalProps> = ({
  isOpen,
  onClose,
  currentPhone,
  onPhoneUpdated
}) => {
  const { user, updateProfile } = useAuthStore();

  const [step, setStep] = useState<Step>('ENTER_NEW');
  const [newPhone, setNewPhone] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [maskedOldPhone, setMaskedOldPhone] = useState('');
  const [maskedNewPhone, setMaskedNewPhone] = useState('');

  const [oldOtp, setOldOtp] = useState('');
  const [newOtp, setNewOtp] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  // Resend cooldown timer
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean old mobile for masking
  const cleanCurrentPhone = (currentPhone || user?.phone || '9876543210').replace(/\D/g, '').slice(-10);
  const defaultMaskedCurrent = '******' + cleanCurrentPhone.slice(-4);

  // Reset modal state on open/close
  useEffect(() => {
    if (isOpen) {
      setStep('ENTER_NEW');
      setNewPhone('');
      setSessionId(null);
      setOldOtp('');
      setNewOtp('');
      setError(null);
      setCooldown(0);
      setMaskedOldPhone(defaultMaskedCurrent);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }, [isOpen, defaultMaskedCurrent]);

  // Countdown handler
  useEffect(() => {
    if (cooldown > 0) {
      timerRef.current = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [cooldown]);

  if (!isOpen) return null;

  // Step 1: Initiate Phone Change
  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanNew = newPhone.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanNew)) {
      setError('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    if (cleanNew === cleanCurrentPhone) {
      setError('New mobile number cannot be the same as your currently registered number.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.initiatePhoneChange(cleanNew, cleanCurrentPhone);
      if (res.success && res.sessionId) {
        setSessionId(res.sessionId);
        setMaskedOldPhone(res.maskedOldPhone || defaultMaskedCurrent);
        setMaskedNewPhone(res.maskedNewPhone || '******' + cleanNew.slice(-4));
        setCooldown(res.cooldownSeconds || 30);
        setDevOtpHint(res.devOtpHint || '6060');
        setStep('VERIFY_OLD');
      } else {
        setError(res.message || 'Failed to initiate verification. Please check the number.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify Old Phone OTP
  const handleVerifyOld = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId) return;
    setError(null);

    if (!oldOtp.trim()) {
      setError('Please enter the OTP sent to your currently registered mobile number.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.verifyOldPhoneChange(sessionId, oldOtp.trim());
      if (res.success) {
        setCooldown(res.cooldownSeconds || 30);
        setDevOtpHint(res.devOtpHint || '6060');
        setStep('VERIFY_NEW');
      } else {
        setError(res.message || 'Incorrect OTP for current number. Please try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Verify New Phone OTP
  const handleVerifyNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId) return;
    setError(null);

    if (!newOtp.trim()) {
      setError('Please enter the OTP sent to your new mobile number.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.verifyNewPhoneChange(sessionId, newOtp.trim());
      if (res.success && res.readyForConfirmation) {
        setStep('CONFIRM');
      } else {
        setError(res.message || 'Incorrect OTP for new number. Please try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 4: Final Confirmation
  const handleConfirm = async () => {
    if (!sessionId) return;
    setError(null);
    setIsLoading(true);

    try {
      const res = await api.confirmPhoneChange(sessionId);
      if (res.success && res.newPhone) {
        // Update user state in Zustand store and localStorage
        await updateProfile({ phone: res.newPhone, isPhoneVerified: true });
        onPhoneUpdated(res.newPhone);
        setStep('SUCCESS');
      } else {
        setError(res.message || 'Confirmation failed. Both numbers must be verified first.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to update phone number. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async (target: 'OLD' | 'NEW') => {
    if (!sessionId || cooldown > 0) return;
    setError(null);

    try {
      const res = await api.resendPhoneChangeOtp(sessionId, target);
      if (res.success) {
        setCooldown(res.cooldownSeconds || 30);
        if (res.devOtpHint) setDevOtpHint(res.devOtpHint);
      } else {
        setError(res.message || 'Failed to resend OTP.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to resend OTP.');
    }
  };

  // Cancel & Close
  const handleCancelAndClose = () => {
    if (sessionId && step !== 'SUCCESS') {
      api.cancelPhoneChange(sessionId).catch(() => {});
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-blue-900 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-4 h-4 text-brand-orange-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Change Registered Phone</h3>
              <p className="text-[10px] text-slate-500 font-medium">Dual-OTP secure authentication</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCancelAndClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span className="leading-tight">{error}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6">
          {/* ======================================================== */}
          {/* STEP 1: ENTER NEW PHONE NUMBER                           */}
          {/* ======================================================== */}
          {step === 'ENTER_NEW' && (
            <form onSubmit={handleInitiate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Current Registered Number</label>
                <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200/80 text-xs font-mono font-bold text-slate-600 flex items-center justify-between">
                  <span>+91 {maskedOldPhone || defaultMaskedCurrent}</span>
                  <span className="text-[10px] uppercase font-black tracking-wider text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                    Verified
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900 block">Proposed New Mobile Number</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs font-bold text-slate-500 font-mono">+91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="9876543210"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-12 pr-4 py-2.5 border border-slate-300 rounded-xl font-mono text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                    autoFocus
                  />
                </div>
                <span className="text-[10px] text-slate-500 block leading-tight">
                  Enter a 10-digit Indian mobile number. Both your current and new numbers will receive an OTP.
                </span>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isLoading || newPhone.length !== 10}
                  className="flex-1 bg-brand-blue-900 hover:bg-brand-blue-800 text-white font-bold text-xs py-2.5 rounded-xl shadow-sm"
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  {isLoading ? 'Initiating Verification...' : 'Continue & Send OTP'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={handleCancelAndClose}
                  className="px-4 py-2.5 text-xs font-bold rounded-xl"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* STEP 2: VERIFY OLD PHONE NUMBER                          */}
          {/* ======================================================== */}
          {step === 'VERIFY_OLD' && (
            <form onSubmit={handleVerifyOld} className="space-y-4">
              <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-2xl space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-black text-brand-blue-900">
                  <Lock className="w-3.5 h-3.5 text-brand-orange-500" />
                  <span>Step 1 of 2: Verify Currently Registered Number</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Enter the 4 or 6-digit OTP sent via SMS to your registered phone{' '}
                  <strong className="text-slate-900 font-mono">+91 {maskedOldPhone}</strong>.
                </p>
                {devOtpHint && (
                  <span className="inline-block text-[10px] font-mono bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold mt-1">
                    Demo OTP: {devOtpHint}
                  </span>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Enter Security OTP</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="6060"
                  value={oldOtp}
                  onChange={(e) => setOldOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-widest text-lg font-mono font-black py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                {cooldown > 0 ? (
                  <span className="text-slate-400 font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Resend OTP in {cooldown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleResend('OLD')}
                    className="text-brand-orange-600 font-bold hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Resend OTP
                  </button>
                )}
                <span className="text-[11px] text-slate-400">Valid for 5 mins</span>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isLoading || !oldOtp.trim()}
                  className="flex-1 bg-brand-blue-900 hover:bg-brand-blue-800 text-white font-bold text-xs py-2.5 rounded-xl shadow-sm"
                >
                  {isLoading ? 'Verifying Current Number...' : 'Verify Current Number'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={handleCancelAndClose}
                  className="px-4 py-2.5 text-xs font-bold rounded-xl"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* STEP 3: VERIFY NEW PHONE NUMBER                          */}
          {/* ======================================================== */}
          {step === 'VERIFY_NEW' && (
            <form onSubmit={handleVerifyNew} className="space-y-4">
              <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-black text-emerald-900">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Step 2 of 2: Verify Proposed New Number</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Current number verified! Now enter the OTP sent to your new mobile number{' '}
                  <strong className="text-slate-900 font-mono">+91 {maskedNewPhone}</strong>.
                </p>
                {devOtpHint && (
                  <span className="inline-block text-[10px] font-mono bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold mt-1">
                    Demo OTP: {devOtpHint}
                  </span>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Enter New Number OTP</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="6060"
                  value={newOtp}
                  onChange={(e) => setNewOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-widest text-lg font-mono font-black py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                {cooldown > 0 ? (
                  <span className="text-slate-400 font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Resend OTP in {cooldown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleResend('NEW')}
                    className="text-brand-orange-600 font-bold hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Resend OTP
                  </button>
                )}
                <span className="text-[11px] text-slate-400">Valid for 5 mins</span>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isLoading || !newOtp.trim()}
                  className="flex-1 bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-bold text-xs py-2.5 rounded-xl shadow-sm"
                >
                  {isLoading ? 'Verifying New Number...' : 'Verify New Number'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={handleCancelAndClose}
                  className="px-4 py-2.5 text-xs font-bold rounded-xl"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* STEP 4: FINAL CONFIRMATION                               */}
          {/* ======================================================== */}
          {step === 'CONFIRM' && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-brand-blue-50 text-brand-blue-900 mx-auto flex items-center justify-center shadow-xs">
                  <ShieldCheck className="w-6 h-6 text-brand-blue-900" />
                </div>
                <h4 className="text-sm font-black text-slate-900">Confirm Mobile Number Update</h4>
                <p className="text-xs text-slate-500">
                  Both current and new numbers have been verified successfully.
                </p>
              </div>

              {/* Dual verification comparison summary */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Previous Number</span>
                    <span className="font-mono font-bold text-slate-700">+91 {maskedOldPhone}</span>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                </div>

                <div className="border-t border-slate-200/60 pt-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-brand-blue-700 block">New Registered Mobile</span>
                    <span className="font-mono font-black text-slate-900 text-sm">+91 {maskedNewPhone}</span>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                </div>
              </div>

              <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 leading-relaxed">
                <strong>Important:</strong> Updating your mobile number will permanently update your contractor profile credentials. All future OTPs, dispatch alerts, and invoices will be routed exclusively to this new number.
              </div>

              <div className="pt-2 flex items-center gap-2">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className="flex-1 bg-brand-blue-900 hover:bg-brand-blue-800 text-white font-bold text-xs py-2.5 rounded-xl shadow-md"
                >
                  {isLoading ? 'Updating Database...' : 'Confirm Change Phone Number'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={handleCancelAndClose}
                  className="px-4 py-2.5 text-xs font-bold rounded-xl"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 5: SUCCESS NOTIFICATION                             */}
          {/* ======================================================== */}
          {step === 'SUCCESS' && (
            <div className="text-center py-4 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-black text-slate-900">Phone Number Updated!</h4>
                <p className="text-xs text-slate-600 max-w-xs mx-auto">
                  Your registered mobile number has been changed successfully to{' '}
                  <strong className="text-slate-900 font-mono">+91 {newPhone}</strong>.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-[11px] text-slate-600 font-medium">
                Your profile details, orders, wallet balance, and GST details remain fully preserved.
              </div>

              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={onClose}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-sm"
              >
                Done
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
