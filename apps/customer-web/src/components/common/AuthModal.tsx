import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, KeyRound, CheckCircle2, ShieldCheck, Lock, AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAuthStore } from '../../store/useAuthStore';

export interface AuthModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen: propIsOpen, onClose: propOnClose }) => {
  const navigate = useNavigate();
  const {
    isAuthModalOpen: storeIsOpen,
    closeAuthModal,
    authPromptReason,
    intendedDestination,
    requestOtp,
    verifyOtp
  } = useAuthStore();

  const isOpen = propIsOpen !== undefined ? propIsOpen : storeIsOpen;
  const handleClose = propOnClose || closeAuthModal;

  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);
    const res = await requestOtp(cleanPhone);
    setIsLoading(false);
    if (res.success) {
      setStep('OTP');
      setSuccessMsg(res.message);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 4) {
      setErrorMsg('Please enter a 4-digit verification code');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);
    const res = await verifyOtp(phone, otp);
    setIsLoading(false);
    if (res.success) {
      setSuccessMsg('Logged in successfully!');
      setTimeout(() => {
        handleClose();
        setStep('PHONE');
        setOtp('');
        setPhone('');
        setSuccessMsg('');
        if (intendedDestination) {
          navigate(intendedDestination);
        }
      }, 700);
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={step === 'PHONE' ? 'Sign In to BUILDORA 60' : 'Verify Mobile OTP'}
      maxWidth="sm"
    >
      <div className="space-y-4 text-xs">
        {/* Context message if prompted for protected feature */}
        {authPromptReason && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl flex items-start gap-2.5 font-medium">
            <Lock className="w-4 h-4 text-brand-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Authentication Required</div>
              <div className="text-[11px] text-amber-800 mt-0.5">{authPromptReason}</div>
            </div>
          </div>
        )}

        {step === 'PHONE' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <p className="text-slate-600 leading-relaxed">
              Enter your mobile number to sign in or create an account for live dispatch tracking, wallet management, and site orders.
            </p>

            <div className="space-y-1">
              <label className="block font-bold text-slate-800">Mobile Number</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-500 text-sm">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/\D/g, ''));
                    setErrorMsg('');
                  }}
                  placeholder="98765 43210"
                  className="w-full pl-12 pr-4 py-2.5 text-sm font-bold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue-500 tracking-wide"
                  autoFocus
                />
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-red-600 font-bold">{errorMsg}</p>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full font-black shadow-md"
              isLoading={isLoading}
              leftIcon={<Smartphone className="w-4 h-4" />}
            >
              Get OTP Verification Code
            </Button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>100% Secure &bull; Direct Carrier Verified</span>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <p className="text-slate-600">
              We sent a 4-digit verification code to <strong className="text-slate-900">+91 {phone}</strong>
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
                maxLength={4}
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, ''));
                  setErrorMsg('');
                }}
                placeholder="• • • •"
                className="w-44 text-center tracking-[0.5em] text-3xl font-black py-2.5 border-2 border-brand-blue-500 rounded-2xl focus:outline-none shadow-sm"
                autoFocus
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-red-600 font-bold text-center">{errorMsg}</p>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full font-black shadow-md"
              isLoading={isLoading}
              leftIcon={<KeyRound className="w-4 h-4" />}
            >
              Verify OTP &amp; Proceed
            </Button>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep('PHONE')}
                className="hover:underline text-slate-600 font-semibold"
              >
                Change Number
              </button>
              <button
                type="button"
                onClick={handleSendOtp}
                className="font-bold text-brand-blue-800 hover:underline"
              >
                Resend OTP
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
