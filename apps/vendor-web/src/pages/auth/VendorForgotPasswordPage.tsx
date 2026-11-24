import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { vendorApi } from '../../services/vendorApi';
import {
  Mail,
  Lock,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  ShieldCheck
} from 'lucide-react';

export const VendorForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  // Multi-step flow: 'REQUEST_OTP' | 'VERIFY_AND_RESET' | 'SUCCESS'
  const [step, setStep] = useState<'REQUEST_OTP' | 'VERIFY_AND_RESET' | 'SUCCESS'>('REQUEST_OTP');

  // Fields
  const [identifier, setIdentifier] = useState('vendor@buildora.in');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  // Password validation indicators
  const passwordCriteria = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)
  };

  const isPasswordValid = Object.values(passwordCriteria).every(Boolean);

  // Cooldown timer
  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Handle Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!identifier.trim()) {
      setError('Please enter your registered business email or mobile number.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await vendorApi.forgotPasswordSendOtp(identifier.trim());
      setStep('VERIFY_AND_RESET');
      setCooldown(res.cooldownSeconds || 60);
      if (res.devOtpHint) {
        setDevOtpHint(res.devOtpHint);
        setOtpCode(res.devOtpHint);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Reset Password Submit
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!otpCode || otpCode.length < 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    if (!isPasswordValid) {
      setError('Password does not satisfy enterprise security requirements.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify your new password.');
      return;
    }

    setIsLoading(true);

    try {
      await vendorApi.forgotPasswordReset({
        identifier: identifier.trim(),
        otp: otpCode.trim(),
        newPassword,
        confirmPassword
      });
      setStep('SUCCESS');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please verify the verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-[#E2E8F0] space-y-6 animate-in fade-in-0 duration-200">
      {/* Back button */}
      <Link
        to="/login"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#203D91] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Login
      </Link>

      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#17233C]">
          Reset Supplier Password
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
          {step === 'REQUEST_OTP'
            ? 'Enter your registered email address or mobile number to receive a secure single-use recovery code.'
            : step === 'VERIFY_AND_RESET'
            ? `Enter the 6-digit code sent to ${identifier} and configure a new strong password.`
            : 'Your password has been successfully updated.'}
        </p>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3 animate-shake">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold text-rose-900">Security Notice</p>
            <p className="text-rose-700">{error}</p>
          </div>
        </div>
      )}

      {/* Step 1: Request OTP */}
      {step === 'REQUEST_OTP' && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#17233C] mb-1.5">
              Registered Email or Mobile Number
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                placeholder="vendor@company.com or 9845012345"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#17233C] focus:outline-none focus:ring-2 focus:ring-[#203D91] focus:border-transparent transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-[#203D91] text-white hover:bg-[#162b66] transition-all shadow-md shadow-[#203D91]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <Clock className="w-4 h-4 animate-spin" />
                Sending Recovery Code...
              </span>
            ) : (
              <>
                Send Verification Code
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* Step 2: Verify & Reset Password */}
      {step === 'VERIFY_AND_RESET' && (
        <form onSubmit={handleResetSubmit} className="space-y-4">
          {devOtpHint && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
              <span>Dev Recovery OTP: <strong className="font-mono text-sm tracking-widest">{devOtpHint}</strong></span>
              <button
                type="button"
                onClick={() => setOtpCode(devOtpHint)}
                className="text-xs font-bold text-[#203D91] underline"
              >
                Auto-fill
              </button>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[#17233C]">
                6-Digit Verification Code
              </label>
              <button
                type="button"
                onClick={() => handleSendOtp()}
                disabled={isLoading || cooldown > 0}
                className="text-xs font-bold text-[#FF7417] hover:underline disabled:opacity-50"
              >
                {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend Code'}
              </button>
            </div>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                required
                placeholder="123456"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-mono tracking-widest text-[#17233C] focus:outline-none focus:ring-2 focus:ring-[#203D91] focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#17233C] mb-1.5">
              New Enterprise Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#17233C] focus:outline-none focus:ring-2 focus:ring-[#203D91] focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#17233C] mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#17233C] focus:outline-none focus:ring-2 focus:ring-[#203D91] focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Password strength checklist */}
          <div className="p-3 bg-[#F4F7FC] rounded-xl border border-[#E2E8F0] space-y-1 text-[11px]">
            <p className="font-bold text-slate-700 mb-1">Password Strength Requirements:</p>
            <div className="grid grid-cols-2 gap-1 text-slate-600">
              <div className={passwordCriteria.length ? 'text-emerald-700 font-semibold' : ''}>
                {passwordCriteria.length ? '✓' : '○'} Min 8 characters
              </div>
              <div className={passwordCriteria.uppercase ? 'text-emerald-700 font-semibold' : ''}>
                {passwordCriteria.uppercase ? '✓' : '○'} Uppercase letter (A-Z)
              </div>
              <div className={passwordCriteria.lowercase ? 'text-emerald-700 font-semibold' : ''}>
                {passwordCriteria.lowercase ? '✓' : '○'} Lowercase letter (a-z)
              </div>
              <div className={passwordCriteria.number ? 'text-emerald-700 font-semibold' : ''}>
                {passwordCriteria.number ? '✓' : '○'} Number (0-9)
              </div>
              <div className={passwordCriteria.special ? 'text-emerald-700 font-semibold' : ''}>
                {passwordCriteria.special ? '✓' : '○'} Special character (!@#$)
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !isPasswordValid}
            className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-[#203D91] text-white hover:bg-[#162b66] transition-all shadow-md shadow-[#203D91]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <Clock className="w-4 h-4 animate-spin" />
                Resetting Password...
              </span>
            ) : (
              <>
                Confirm & Update Password
                <ShieldCheck className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* Step 3: Success */}
      {step === 'SUCCESS' && (
        <div className="text-center space-y-4 py-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#17233C]">Password Reset Complete</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Your vendor portal credentials have been successfully updated. You can now log in to access your supplier catalog and dispatch management.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-[#203D91] text-white hover:bg-[#162b66] transition-all shadow-md shadow-[#203D91]/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            Go to Vendor Login
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
