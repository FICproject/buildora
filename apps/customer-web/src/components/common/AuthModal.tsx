import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, KeyRound, CheckCircle2, ShieldCheck, Lock, AlertCircle, RotateCcw } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAuthStore } from '../../store/useAuthStore';

export interface AuthModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const RESEND_COOLDOWN_SECONDS = 30;

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen: propIsOpen, onClose: propOnClose }) => {
  const navigate = useNavigate();
  const {
    isAuthModalOpen: storeIsOpen,
    closeAuthModal,
    authPromptReason,
    requestOtp,
    verifyOtp,
  } = useAuthStore();

  const isOpen = propIsOpen !== undefined ? propIsOpen : storeIsOpen;
  const handleClose = () => {
    setStep('PHONE');
    setOtp('');
    setErrorMsg('');
    setSuccessMsg('');
    setCountdown(0);
    if (propOnClose) {
      propOnClose();
    } else {
      closeAuthModal(true);
    }
  };

  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setStep('PHONE');
      setOtp('');
      setErrorMsg('');
      setSuccessMsg('');
      setCountdown(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((c) => (c > 1 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const sendOtpRequest = async () => {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);
    try {
      const res = await requestOtp(cleanPhone);
      if (res.success) {
        setStep('OTP');
        setOtp('');
        setCountdown(res.cooldownSeconds || RESEND_COOLDOWN_SECONDS);
        setSuccessMsg(res.message || `OTP sent to +91 ${cleanPhone}`);
      } else {
        setErrorMsg(res.message || 'Unable to send OTP. Please try again.');
      }
    } catch {
      setErrorMsg('Network error while requesting OTP. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendOtpRequest();
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || isLoading) return;
    await sendOtpRequest();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otp.replace(/\D/g, '');
    if (cleanOtp.length !== 4) {
      setErrorMsg('Please enter the 4-digit OTP code.');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);
    try {
      const res = await verifyOtp(phone, cleanOtp);
      if (res.success) {
        setSuccessMsg('Signed in! Continuing...');
        const nextRoute = res.redirectTo;
        setTimeout(() => {
          closeAuthModal(false);
          setStep('PHONE');
          setOtp('');
          setPhone('');
          setSuccessMsg('');
          setCountdown(0);
          if (nextRoute) {
            navigate(nextRoute);
          }
        }, 350);
      } else {
        setErrorMsg(res.message || 'Invalid OTP. Please check and try again.');
      }
    } catch {
      setErrorMsg('Network error during OTP verification. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Welcome to BUILDORA 60"
      maxWidth="sm"
    >
      <div className="space-y-4 text-xs">
        <p className="text-sm text-slate-600 font-medium -mt-1">
          Sign in to continue with your selected action.
        </p>

        {authPromptReason && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl flex items-start gap-2.5 font-medium">
            <Lock className="w-4 h-4 text-brand-orange-500 flex-shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-900 leading-relaxed">{authPromptReason}</div>
          </div>
        )}

        {step === 'PHONE' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Mobile Number
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">
                  +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                    setErrorMsg('');
                  }}
                  placeholder="Enter 10-digit mobile number"
                  className="w-full pl-12 pr-4 py-2.5 text-sm font-bold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue-500 tracking-wide"
                  autoFocus
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full font-black shadow-md"
              isLoading={isLoading}
              leftIcon={<Smartphone className="w-4 h-4" />}
            >
              Continue
            </Button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Instant OTP Verification &bull; Safe &amp; Encrypted</span>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <p className="text-slate-600">
              Enter the 4-digit OTP sent to{' '}
              <strong className="text-slate-900">+91 {phone}</strong>
            </p>

            {successMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 font-bold flex items-center gap-1.5 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="flex justify-center py-2">
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, '').slice(0, 4));
                  setErrorMsg('');
                }}
                placeholder="• • • •"
                className="w-44 text-center tracking-[0.5em] text-3xl font-black py-2.5 border-2 border-brand-blue-500 rounded-2xl focus:outline-none shadow-sm"
                autoFocus
              />
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 font-semibold flex items-center justify-center gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full font-black shadow-md"
              isLoading={isLoading}
              leftIcon={<KeyRound className="w-4 h-4" />}
            >
              Verify OTP &amp; Continue
            </Button>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => {
                  setStep('PHONE');
                  setOtp('');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="hover:underline text-slate-600 font-semibold cursor-pointer disabled:opacity-50"
              >
                Change mobile number
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={countdown > 0 || isLoading}
                className={`inline-flex items-center gap-1 font-bold ${
                  countdown > 0 || isLoading
                    ? 'text-slate-400 cursor-not-allowed'
                    : 'text-brand-blue-800 hover:underline cursor-pointer'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {countdown > 0 ? `Resend OTP (${countdown}s)` : 'Resend OTP'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
