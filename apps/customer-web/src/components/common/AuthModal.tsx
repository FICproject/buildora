import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Smartphone,
  KeyRound,
  CheckCircle2,
  ShieldCheck,
  Lock,
  AlertCircle,
  RotateCcw,
  Terminal,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAuthStore } from '../../store/useAuthStore';

export interface AuthModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const RESEND_COOLDOWN_SECONDS = 30;
const EMPTY_OTP_DIGITS = ['', '', '', ''];

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

  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phone, setPhone] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(EMPTY_OTP_DIGITS);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [resendUnlockAt, setResendUnlockAt] = useState(0);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const isSubmittingRef = useRef(false);

  const startCooldown = (seconds: number) => {
    const cleanSeconds = Math.max(0, Math.ceil(seconds));
    setCountdown(cleanSeconds);
    setResendUnlockAt(cleanSeconds > 0 ? Date.now() + cleanSeconds * 1000 : 0);
  };

  const resetModalState = () => {
    setStep('PHONE');
    setOtpDigits([...EMPTY_OTP_DIGITS]);
    setDevOtp(null);
    setErrorMsg('');
    setSuccessMsg('');
    setCountdown(0);
    setResendUnlockAt(0);
    isSubmittingRef.current = false;
  };

  const handleClose = () => {
    resetModalState();
    if (propOnClose) {
      propOnClose();
    } else {
      closeAuthModal(true);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      resetModalState();
    }
  }, [isOpen]);

  useEffect(() => {
    if (step === 'OTP') {
      const focusTimer = setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 60);
      return () => clearTimeout(focusTimer);
    }
  }, [step]);

  useEffect(() => {
    if (!resendUnlockAt) {
      setCountdown(0);
      return;
    }
    const updateRemaining = () => {
      const remaining = Math.max(0, Math.ceil((resendUnlockAt - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining <= 0) {
        setResendUnlockAt(0);
      }
    };
    updateRemaining();
    const timer = setInterval(updateRemaining, 250);
    return () => clearInterval(timer);
  }, [resendUnlockAt]);

  const cleanOtp = otpDigits.join('');
  const cleanPhone = phone.replace(/\D/g, '').slice(-10);

  const sendOtpRequest = async () => {
    if (isSubmittingRef.current || isLoading) return;
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    isSubmittingRef.current = true;
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);
    try {
      const res = await requestOtp(cleanPhone);
      if (res.success) {
        const returnedDevOtp =
          res.otpMode === 'development' && (res.devOtp || res.devOtpHint)
            ? String(res.devOtp || res.devOtpHint)
            : null;
        setStep('OTP');
        setOtpDigits([...EMPTY_OTP_DIGITS]);
        setDevOtp(returnedDevOtp);
        startCooldown(res.cooldownSeconds || RESEND_COOLDOWN_SECONDS);
        setSuccessMsg(res.message || `OTP sent successfully to +91 ${cleanPhone}`);
        setTimeout(() => {
          otpInputRefs.current[0]?.focus();
        }, 60);
      } else {
        if (typeof res.retryAfterSeconds === 'number' && res.retryAfterSeconds > 0) {
          startCooldown(res.retryAfterSeconds);
        }
        setErrorMsg(res.message || 'Unable to send OTP. Please try again.');
      }
    } catch {
      setErrorMsg('Network error while requesting OTP. Please check your connection.');
    } finally {
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendOtpRequest();
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || isLoading || isSubmittingRef.current) return;
    await sendOtpRequest();
  };

  const handleFillDevOtp = () => {
    if (!devOtp || !/^\d{4}$/.test(devOtp)) return;
    setErrorMsg('');
    setOtpDigits(devOtp.split(''));
    otpInputRefs.current[3]?.focus();
  };

  const handleOtpDigitChange = (index: number, rawValue: string) => {
    const digitsOnly = rawValue.replace(/\D/g, '');
    setErrorMsg('');

    if (!digitsOnly) {
      const next = [...otpDigits];
      next[index] = '';
      setOtpDigits(next);
      return;
    }

    // Handle multi-digit input (paste or SMS autofill)
    if (digitsOnly.length > 1) {
      const next = [...otpDigits];
      const chars = digitsOnly.slice(0, 4).split('');
      chars.forEach((ch, offset) => {
        if (index + offset < 4) {
          next[index + offset] = ch;
        }
      });
      setOtpDigits(next);
      const nextFocusIndex = Math.min(3, index + chars.length);
      otpInputRefs.current[nextFocusIndex]?.focus();
      return;
    }

    const next = [...otpDigits];
    next[index] = digitsOnly[0];
    setOtpDigits(next);
    if (index < 3) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      setErrorMsg('');
      if (otpDigits[index]) {
        const next = [...otpDigits];
        next[index] = '';
        setOtpDigits(next);
        e.preventDefault();
      } else if (index > 0) {
        const next = [...otpDigits];
        next[index - 1] = '';
        setOtpDigits(next);
        otpInputRefs.current[index - 1]?.focus();
        e.preventDefault();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 3) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (!pasted) return;
    e.preventDefault();
    setErrorMsg('');
    const next = ['', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setOtpDigits(next);
    const focusIndex = Math.min(3, pasted.length - 1);
    otpInputRefs.current[Math.max(0, focusIndex)]?.focus();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || isLoading) return;
    if (cleanOtp.length !== 4 || !/^\d{4}$/.test(cleanOtp)) {
      setErrorMsg('Please enter all 4 numeric digits of the OTP.');
      return;
    }

    isSubmittingRef.current = true;
    setErrorMsg('');
    setIsLoading(true);
    try {
      const res = await verifyOtp(cleanPhone, cleanOtp);
      if (res.success) {
        setSuccessMsg('Signed in successfully! Continuing...');
        const nextRoute = res.redirectTo;
        setTimeout(() => {
          closeAuthModal(false);
          setPhone('');
          resetModalState();
          if (nextRoute) {
            navigate(nextRoute);
          }
        }, 180);
      } else {
        setErrorMsg(res.message || 'Invalid OTP. Please check the 4-digit code and try again.');
      }
    } catch {
      setErrorMsg('Network error during OTP verification. Please try again.');
    } finally {
      isSubmittingRef.current = false;
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
              disabled={isLoading || cleanPhone.length !== 10}
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
              <strong className="text-slate-900">+91 {cleanPhone}</strong>
            </p>

            {successMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 font-bold flex items-center gap-1.5 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {devOtp && (
              <div
                data-testid="dev-otp-banner"
                className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-brand-blue-900 flex items-center justify-between gap-2.5"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Terminal className="w-4 h-4 text-brand-blue-700 flex-shrink-0" />
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-brand-blue-700">
                      Development Mode
                    </p>
                    <p className="text-xs font-semibold text-slate-700">
                      Your Development OTP:{' '}
                      <span
                        data-testid="dev-otp-value"
                        className="font-mono font-black text-sm tracking-[0.2em] text-brand-blue-900 bg-white px-2 py-0.5 rounded-md border border-blue-200 ml-1"
                      >
                        {devOtp}
                      </span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleFillDevOtp}
                  disabled={isLoading}
                  className="px-2.5 py-1.5 rounded-lg bg-brand-blue-900 hover:bg-brand-blue-800 text-white text-[11px] font-bold whitespace-nowrap flex-shrink-0 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Fill OTP
                </button>
              </div>
            )}

            <div className="flex justify-center gap-2.5 py-1.5" role="group" aria-label="4-digit OTP input">
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    otpInputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete={index === 0 ? 'one-time-code' : 'off'}
                  aria-label={`OTP digit ${index + 1}`}
                  maxLength={index === 0 ? 4 : 1}
                  value={digit}
                  onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  onPaste={handleOtpPaste}
                  className="w-12 h-13 text-center text-2xl font-black border-2 border-slate-300 focus:border-brand-blue-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue-200 shadow-sm text-slate-900 transition-colors"
                />
              ))}
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 font-semibold flex items-center justify-center gap-1.5 text-center"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full font-black shadow-md"
              isLoading={isLoading}
              disabled={isLoading || cleanOtp.length !== 4}
              leftIcon={<KeyRound className="w-4 h-4" />}
            >
              Verify &amp; Login
            </Button>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => {
                  resetModalState();
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
