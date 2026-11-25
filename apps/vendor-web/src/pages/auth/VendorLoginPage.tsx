import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useVendorAuthStore } from '../../store/useVendorAuthStore';
import { vendorApi } from '../../services/vendorApi';
import { CircularCollage } from '../../components/auth/CircularCollage';
import { SkylineIllustration } from '../../components/auth/SkylineIllustration';
import { WaveDecorations } from '../../components/auth/WaveDecorations';
import {
  validateIdentifier,
  validatePassword,
  validateConfirmPassword
} from '@buildora/validation';
import {
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  KeyRound,
  X
} from 'lucide-react';

export const VendorLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginWithOtp, isLoading, error, clearError } = useVendorAuthStore();

  // Active Login Method Tab: 'password' | 'otp'
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');

  // Form Fields - initially clean and empty
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const clearFieldError = (key: string) => {
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  // OTP Login States
  const [otpCode, setOtpCode] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  // Status & Success notices
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Forgot Password Modal States
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<'IDENTIFIER' | 'RESET'>('IDENTIFIER');
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);

  // Demo Accounts Drawer (Discreet testing tool for all 5 statuses)
  const [isDemoDrawerOpen, setIsDemoDrawerOpen] = useState(false);

  // OTP Countdown Timer
  useEffect(() => {
    let timer: any;
    if (otpCooldown > 0) {
      timer = setInterval(() => {
        setOtpCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpCooldown]);

  // Handle Password Login Submit
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setStatusNotice(null);
    const errors: Record<string, string> = {};

    const identCheck = validateIdentifier(identifier);
    if (!identCheck.isValid) {
      errors.identifier = identCheck.error || 'Please enter a valid registered email or 10-digit mobile number.';
    }

    if (!password) {
      errors.password = 'Please enter your account password.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    const res = await login(identifier.trim(), password, rememberMe);
    if (res.success && res.redirectTo) {
      navigate(res.redirectTo);
    }
  };

  // Handle Request OTP
  const handleRequestOtp = async () => {
    clearError();
    setStatusNotice(null);

    const identCheck = validateIdentifier(identifier);
    if (!identCheck.isValid) {
      setFieldErrors({ identifier: identCheck.error || 'Please enter a valid registered mobile number or email.' });
      return;
    }

    setFieldErrors({});
    setIsSendingOtp(true);

    try {
      const res = await vendorApi.sendOtp(identifier.trim(), 'LOGIN');
      setOtpSent(true);
      setOtpCooldown(res.cooldownSeconds || 60);
      if (res.devOtpHint) {
        setDevOtpHint(res.devOtpHint);
        setOtpCode(res.devOtpHint);
      }
      setStatusNotice(`Verification code sent to ${identifier.trim()}`);
    } catch (err: any) {
      setFieldErrors({ identifier: err.message || 'Failed to send OTP. Please check your credentials.' });
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handle OTP Login Submit
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setStatusNotice(null);
    const errors: Record<string, string> = {};

    const identCheck = validateIdentifier(identifier);
    if (!identCheck.isValid) {
      errors.identifier = identCheck.error || 'Please enter a valid email or 10-digit mobile number.';
    }

    if (!otpCode || otpCode.replace(/\D/g, '').length !== 6) {
      errors.otpCode = 'Please enter the 6-digit verification code.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    const res = await loginWithOtp(identifier.trim(), otpCode.trim());
    if (res.success && res.redirectTo) {
      navigate(res.redirectTo);
    }
  };

  // Forgot Password: Request OTP
  const handleForgotSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    if (!forgotIdentifier.trim()) {
      setForgotError('Please enter your registered Email or Mobile number.');
      return;
    }
    setIsForgotLoading(true);
    try {
      const res = await vendorApi.forgotPasswordSendOtp(forgotIdentifier.trim());
      setForgotStep('RESET');
      if (res.devOtpHint) {
        setForgotOtp(res.devOtpHint);
      }
      setForgotSuccess(`Verification code sent to ${forgotIdentifier.trim()}`);
    } catch (err: any) {
      setForgotError(err.message || 'Failed to send password reset code.');
    } finally {
      setIsForgotLoading(false);
    }
  };

  // Forgot Password: Reset Submit
  const handleForgotReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    if (!forgotOtp || forgotOtp.length < 6) {
      setForgotError('Please enter the 6-digit verification code.');
      return;
    }
    if (newPassword.length < 8) {
      setForgotError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match.');
      return;
    }

    setIsForgotLoading(true);
    try {
      await vendorApi.forgotPasswordReset({
        identifier: forgotIdentifier.trim(),
        otp: forgotOtp.trim(),
        newPassword,
        confirmPassword
      });
      setForgotSuccess('Password updated successfully! You can now log in.');
      setTimeout(() => {
        setIsForgotPasswordOpen(false);
        setPassword(newPassword);
        setIdentifier(forgotIdentifier);
        setForgotStep('IDENTIFIER');
        setForgotSuccess(null);
      }, 1500);
    } catch (err: any) {
      setForgotError(err.message || 'Failed to reset password. Please verify the code.');
    } finally {
      setIsForgotLoading(false);
    }
  };

  // Select Demo Account Persona
  const selectDemoPersona = (email: string, pass = 'Vendor@123', label: string) => {
    setIdentifier(email);
    setPassword(pass);
    setLoginMethod('password');
    clearError();
    setIsDemoDrawerOpen(false);
    setStatusNotice(`Loaded: ${label}. Click "Login ->" to test role status.`);
  };

  return (
    <div className="min-h-screen w-full bg-[#FFFFFF] relative overflow-hidden flex flex-col justify-between font-sans text-[#292524] selection:bg-[#F6C453]/20 selection:text-[#943D24]">
      {/* Soft Background Tint Accents */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-[#FBF3F0] via-white to-transparent pointer-events-none -z-10" />

      {/* TOP HEADER: Brand Logo & QA Switcher */}
      <header className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 pt-6 sm:pt-8 flex items-center justify-between z-20">
        {/* Brand Logo & Tagline (Matches reference top-left) */}
        <Link to="/login" className="flex items-center gap-3 group select-none">
          {/* Orange B Icon Container */}
          <div className="w-11 h-11 rounded-2xl bg-[#943D24] flex items-center justify-center text-white font-black text-2xl shadow-md shadow-[#F6C453]/20 group-hover:scale-105 transition-transform">
            B
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-black text-2xl tracking-tight text-[#943D24]">BUILDORA</span>
              <span className="px-2 py-0.5 rounded-md bg-[#F6C453] font-black text-lg tracking-tight text-[#292524]">60</span>
            </div>
            <p className="text-[11px] font-semibold text-[#78716C] tracking-tight leading-none mt-0.5">
              Build Smart. Supply Better.
            </p>
          </div>
        </Link>

        {/* Quick Demo Accounts Pill Button (Discrete developer/testing convenience) */}
        <button
          type="button"
          onClick={() => setIsDemoDrawerOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#943D24] bg-[#FBF3F0] hover:bg-[#FBF3F0] border border-[#E7E5E4] transition-colors shadow-2xs cursor-pointer select-none"
          title="Click to quickly switch test vendor accounts across all 5 review statuses"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#F6C453]" />
          <span className="hidden sm:inline">Quick Test Accounts</span>
          <span className="sm:hidden">Test</span>
        </button>
      </header>

      {/* MAIN CONTENT AREA: 2-Column Split Matching Reference Screenshot */}
      <main className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 py-8 lg:py-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center flex-1 z-10 relative">
        {/* LEFT COLUMN: Headings + Circular Segmented Collage + Skyline Illustration */}
        <div className="lg:col-span-7 flex flex-col justify-center relative">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Text Copy Section */}
            <div className="md:col-span-5 space-y-3 z-10 text-center md:text-left">
              <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-black text-[#943D24] tracking-tight leading-[1.15]">
                Partner with <br />
                <span className="text-[#943D24]">BUILDORA</span>{' '}
                <span className="inline-block px-2.5 py-0.5 rounded-xl bg-[#F6C453] text-[#292524]">60</span>
              </h1>
              <p className="text-sm sm:text-base text-[#78716C] font-normal leading-relaxed max-w-sm mx-auto md:mx-0">
                Bring your construction products to a larger market and grow with us.
              </p>
            </div>

            {/* Circular Segmented Construction Collage */}
            <div className="md:col-span-7 flex justify-center md:justify-end z-10">
              <CircularCollage size={460} className="w-full max-w-[420px] lg:max-w-[460px]" />
            </div>
          </div>

          {/* City Skyline Outline Illustration (Anchored near bottom-left) */}
          <div className="relative mt-4 md:mt-2">
            <SkylineIllustration className="hidden md:block absolute -bottom-6 left-2" />
          </div>
        </div>

        {/* RIGHT COLUMN: Reference-Based White Login Card */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end z-20">
          <div className="w-full max-w-[420px] bg-white rounded-[28px] border border-[#F6C453] shadow-[0_20px_50px_rgba(16,43,99,0.08)] p-7 sm:p-9 relative transition-all">
            {/* Card Top Storefront Icon Badge */}
            <div className="w-14 h-14 rounded-full bg-[#943D24] flex items-center justify-center text-white shadow-lg shadow-[#F6C453]/25 mx-auto mb-3.5 select-none">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
                <path d="M2 7h20" />
                <path d="M22 7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2" />
              </svg>
            </div>

            {/* Card Titles */}
            <div className="text-center space-y-1 mb-5">
              <h2 className="text-2xl font-black text-[#943D24] tracking-tight">Vendor Login</h2>
              <p className="text-xs font-medium text-[#78716C]">Access your vendor portal</p>
            </div>

            {/* Login Method Toggle Tabs (Password | OTP) */}
            <div className="bg-[#FBF3F0] p-1 rounded-full flex max-w-[260px] mx-auto border border-[#E7E5E4]/70 mb-5 select-none">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('password');
                  clearError();
                  setStatusNotice(null);
                }}
                className={`flex-1 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${loginMethod === 'password'
                    ? 'bg-[#943D24] text-white shadow-sm'
                    : 'text-[#78716C] hover:text-[#943D24]'
                  }`}
              >
                Password
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('otp');
                  clearError();
                  setStatusNotice(null);
                }}
                className={`flex-1 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${loginMethod === 'otp'
                    ? 'bg-[#943D24] text-white shadow-sm'
                    : 'text-[#78716C] hover:text-[#943D24]'
                  }`}
              >
                OTP
              </button>
            </div>

            {/* Error Notification Banner */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in-0 duration-200">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="flex-1 font-medium leading-snug">{error}</span>
                <button
                  type="button"
                  onClick={clearError}
                  className="text-rose-400 hover:text-rose-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Status / Success Notice Banner */}
            {statusNotice && (
              <div className="mb-4 p-3 rounded-xl bg-[#FBF3F0] border border-[#943D24]/25 text-[#943D24] text-xs flex items-center gap-2 animate-in fade-in-0 duration-200">
                <CheckCircle2 className="w-4 h-4 text-[#F6C453] shrink-0" />
                <span className="font-medium flex-1">{statusNotice}</span>
              </div>
            )}

            {/* TAB 1: Password Login Form */}
            {loginMethod === 'password' ? (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {/* Email or Mobile Input */}
                <div className="space-y-1">
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        clearFieldError('identifier');
                      }}
                      required
                      placeholder="Email or Mobile"
                      className={`w-full pl-10 pr-3.5 py-3 rounded-xl border text-sm text-[#292524] placeholder:text-[#78716C] focus:outline-none focus:border-[#943D24] focus:ring-2 focus:ring-[#943D24]/15 bg-white transition-all shadow-2xs ${fieldErrors.identifier ? 'border-rose-400 bg-rose-50/20' : 'border-[#E7E5E4]'
                        }`}
                    />
                  </div>
                  {fieldErrors.identifier && (
                    <p className="text-[11px] text-rose-600 font-medium pl-1">{fieldErrors.identifier}</p>
                  )}
                </div>

                {/* Password Input */}
                <div className="space-y-1">
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        clearFieldError('password');
                      }}
                      required
                      placeholder="Password"
                      className={`w-full pl-10 pr-10 py-3 rounded-xl border text-sm text-[#292524] placeholder:text-[#78716C] focus:outline-none focus:border-[#943D24] focus:ring-2 focus:ring-[#943D24]/15 bg-white transition-all shadow-2xs ${fieldErrors.password ? 'border-rose-400 bg-rose-50/20' : 'border-[#E7E5E4]'
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#78716C] focus:outline-none cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-[11px] text-rose-600 font-medium pl-1">{fieldErrors.password}</p>
                  )}
                </div>

                {/* Forgot Password Right-Aligned Link (Matches reference) */}
                <div className="text-right pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotIdentifier(identifier);
                      setIsForgotPasswordOpen(true);
                      setForgotStep('IDENTIFIER');
                      setForgotError(null);
                    }}
                    className="text-xs font-bold text-[#943D24] hover:text-[#7D331E] transition-colors cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Login Button with Right Arrow */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-full text-base font-bold text-white bg-[#943D24] hover:bg-[#7D331E] shadow-md shadow-[#F6C453]/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] disabled:opacity-60"
                >
                  {isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <Clock className="w-4 h-4 animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    <>
                      <span>Login</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* TAB 2: OTP Login Form */
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                {/* Mobile Number / Email Input */}
                <div className="space-y-1">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Phone className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={identifier}
                        onChange={(e) => {
                          setIdentifier(e.target.value);
                          clearFieldError('identifier');
                        }}
                        required
                        placeholder="Registered Mobile (+91) or Email"
                        className={`w-full pl-10 pr-3.5 py-3 rounded-xl border text-sm text-[#292524] placeholder:text-[#78716C] focus:outline-none focus:border-[#943D24] focus:ring-2 focus:ring-[#943D24]/15 bg-white transition-all shadow-2xs ${fieldErrors.identifier ? 'border-rose-400 bg-rose-50/20' : 'border-[#E7E5E4]'
                          }`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      disabled={isSendingOtp || otpCooldown > 0}
                      className="px-4 py-3 rounded-xl text-xs font-bold bg-[#943D24] text-white hover:bg-[#7D331E] transition-all shrink-0 cursor-pointer disabled:opacity-50 shadow-2xs"
                    >
                      {isSendingOtp ? 'Sending...' : otpCooldown > 0 ? `${otpCooldown}s` : 'Send OTP'}
                    </button>
                  </div>
                  {fieldErrors.identifier && (
                    <p className="text-[11px] text-rose-600 font-medium pl-1">{fieldErrors.identifier}</p>
                  )}
                </div>

                {/* 6-Digit OTP Code Input */}
                {otpSent && (
                  <div className="space-y-2 animate-in fade-in-0 duration-200">
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => {
                          setOtpCode(e.target.value.replace(/\D/g, ''));
                          clearFieldError('otpCode');
                        }}
                        required
                        placeholder="Enter 6-digit OTP"
                        className={`w-full pl-10 pr-3.5 py-3 rounded-xl border text-sm font-mono tracking-widest text-[#292524] placeholder:text-[#78716C] focus:outline-none focus:border-[#943D24] focus:ring-2 focus:ring-[#943D24]/15 bg-white transition-all shadow-2xs ${fieldErrors.otpCode ? 'border-rose-400 bg-rose-50/20' : 'border-[#E7E5E4]'
                          }`}
                      />
                    </div>
                    {fieldErrors.otpCode && (
                      <p className="text-[11px] text-rose-600 font-medium pl-1">{fieldErrors.otpCode}</p>
                    )}
                    {devOtpHint && (
                      <p className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center justify-between">
                        <span>Development Demo OTP:</span>
                        <strong className="font-mono text-xs">{devOtpHint}</strong>
                      </p>
                    )}
                  </div>
                )}

                {/* Verify and Login Button */}
                <button
                  type="submit"
                  disabled={isLoading || (!otpSent && !otpCode)}
                  className="w-full py-3.5 rounded-full text-base font-bold text-white bg-[#943D24] hover:bg-[#7D331E] shadow-md shadow-[#F6C453]/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] disabled:opacity-60"
                >
                  {isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <Clock className="w-4 h-4 animate-spin" />
                      Verifying...
                    </span>
                  ) : (
                    <>
                      <span>Verify and Login</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Bottom Registration CTA (Matches Reference Screenshot) */}
            <div className="mt-6 pt-5 border-t border-[#E7E5E4] flex flex-col items-center gap-2.5">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#943D24] hover:text-[#943D24] transition-colors cursor-pointer group"
              >
                <UserPlus className="w-4 h-4 text-[#F6C453] group-hover:scale-110 transition-transform" />
                <span>Register as Vendor Partner</span>
              </Link>
              {!import.meta.env.PROD && (
                <Link
                  to="/dev-admin/vendor-approvals"
                  className="text-[11px] font-semibold text-[#78716C] hover:text-[#943D24] transition-colors"
                >
                  Dev Admin Approval Console →
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Decorative Bottom Colored Waves Component */}
      <WaveDecorations />

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: Forgot Password Workflow                             */}
      {/* ------------------------------------------------------------- */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in-0 duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-[#E7E5E4] relative space-y-4">
            <button
              type="button"
              onClick={() => setIsForgotPasswordOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#78716C] hover:text-[#78716C] hover:bg-[#F8F7F5]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-[#943D24]">Reset Vendor Password</h3>
              <p className="text-xs text-[#78716C]">
                {forgotStep === 'IDENTIFIER'
                  ? 'Enter your registered email address or mobile number to receive a verification OTP.'
                  : 'Enter the 6-digit code and choose a new secure password.'}
              </p>
            </div>

            {forgotError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            {forgotStep === 'IDENTIFIER' ? (
              <form onSubmit={handleForgotSendOtp} className="space-y-4">
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    required
                    placeholder="Registered Email or Mobile"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E7E5E4] text-sm focus:outline-none focus:border-[#943D24] focus:ring-2 focus:ring-[#943D24]/15"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isForgotLoading}
                  className="w-full py-3 rounded-xl text-xs font-bold text-white bg-[#943D24] hover:bg-[#7D331E] shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isForgotLoading ? 'Sending Verification Code...' : 'Send Reset Code'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleForgotReset} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#292524] mb-1">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    required
                    placeholder="123456"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E5E4] text-sm font-mono tracking-widest focus:outline-none focus:border-[#943D24] focus:ring-2 focus:ring-[#943D24]/15"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#292524] mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="At least 8 characters"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E5E4] text-sm focus:outline-none focus:border-[#943D24] focus:ring-2 focus:ring-[#943D24]/15"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#292524] mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Confirm new password"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E5E4] text-sm focus:outline-none focus:border-[#943D24] focus:ring-2 focus:ring-[#943D24]/15"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep('IDENTIFIER')}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#78716C] bg-[#F8F7F5] hover:bg-slate-200"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isForgotLoading}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-[#943D24] hover:bg-[#7D331E] shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isForgotLoading ? 'Updating Password...' : 'Reset Password & Login'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* DRAWER 2: Discreet QA & Developer Test Persona Switcher      */}
      {/* ------------------------------------------------------------- */}
      {isDemoDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/30 backdrop-blur-xs p-4 animate-in fade-in-0 duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-[#E7E5E4] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E7E5E4]">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#F6C453]" />
                <h3 className="text-sm font-bold text-[#943D24]">Quick Test Vendor Accounts</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDemoDrawerOpen(false)}
                className="p-1 rounded-full text-[#78716C] hover:text-[#78716C]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#78716C]">
              Click any account persona to populate credentials and test role-based status redirection:
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() =>
                  selectDemoPersona('vendor@buildora.in', 'Vendor@123', 'Active Approved Store (Apex Depot)')
                }
                className="w-full p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-left border border-emerald-200 transition-colors cursor-pointer"
              >
                <div className="font-bold text-xs text-emerald-900 flex items-center justify-between">
                  <span>✓ Approved Active Store</span>
                  <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded">
                    /dashboard
                  </span>
                </div>
                <div className="text-[11px] text-emerald-700 mt-0.5">vendor@buildora.in</div>
              </button>

              <button
                type="button"
                onClick={() =>
                  selectDemoPersona('underreview@buildora.in', 'Vendor@123', 'Under Review Account')
                }
                className="w-full p-2.5 rounded-xl bg-[#FBF3F0] hover:bg-[#FBF3F0] text-left border border-[#943D24]/25 transition-colors cursor-pointer"
              >
                <div className="font-bold text-xs text-[#943D24] flex items-center justify-between">
                  <span>⏳ Application Under Review</span>
                  <span className="text-[10px] bg-blue-200 text-[#943D24] px-1.5 py-0.5 rounded">
                    /application-status
                  </span>
                </div>
                <div className="text-[11px] text-[#943D24] mt-0.5">underreview@buildora.in</div>
              </button>

              <button
                type="button"
                onClick={() =>
                  selectDemoPersona('draft@buildora.in', 'Vendor@123', 'Incomplete Draft Registration')
                }
                className="w-full p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-left border border-amber-200 transition-colors cursor-pointer"
              >
                <div className="font-bold text-xs text-amber-900 flex items-center justify-between">
                  <span>📝 Incomplete Draft Onboarding</span>
                  <span className="text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded">
                    /onboarding
                  </span>
                </div>
                <div className="text-[11px] text-amber-700 mt-0.5">draft@buildora.in</div>
              </button>

              <button
                type="button"
                onClick={() =>
                  selectDemoPersona('rejected@buildora.in', 'Vendor@123', 'Rejected Application')
                }
                className="w-full p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-left border border-rose-200 transition-colors cursor-pointer"
              >
                <div className="font-bold text-xs text-rose-900 flex items-center justify-between">
                  <span>✕ Rejected Application</span>
                  <span className="text-[10px] bg-rose-200 text-rose-800 px-1.5 py-0.5 rounded">
                    /rejection-details
                  </span>
                </div>
                <div className="text-[11px] text-rose-700 mt-0.5">rejected@buildora.in</div>
              </button>

              <button
                type="button"
                onClick={() =>
                  selectDemoPersona('suspended@buildora.in', 'Vendor@123', 'Suspended Account')
                }
                className="w-full p-2.5 rounded-xl bg-[#F8F7F5] hover:bg-slate-200 text-left border border-[#E7E5E4] transition-colors cursor-pointer"
              >
                <div className="font-bold text-xs text-[#292524] flex items-center justify-between">
                  <span>🚫 Suspended Account</span>
                  <span className="text-[10px] bg-slate-300 text-[#292524] px-1.5 py-0.5 rounded">
                    /account-restricted
                  </span>
                </div>
                <div className="text-[11px] text-[#78716C] mt-0.5">suspended@buildora.in</div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
