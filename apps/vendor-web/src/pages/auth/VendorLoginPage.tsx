import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useVendorAuthStore } from '../../store/useVendorAuthStore';
import { vendorApi } from '../../services/vendorApi';
import {
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Sparkles,
  ShieldAlert,
  KeyRound,
  CheckCircle2,
  Clock
} from 'lucide-react';

export const VendorLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithOtp, isLoading, error, clearError } = useVendorAuthStore();

  // Tabs: 'password' | 'otp'
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');

  // Form states
  const [identifier, setIdentifier] = useState('vendor@buildora.in');
  const [password, setPassword] = useState('Vendor@123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // OTP states
  const [otpCode, setOtpCode] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Cooldown countdown timer
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

    const res = await login(identifier, password, rememberMe);
    if (res.success && res.redirectTo) {
      navigate(res.redirectTo);
    }
  };

  // Handle Request OTP
  const handleRequestOtp = async () => {
    if (!identifier.trim()) {
      alert('Please enter your registered email address or mobile number.');
      return;
    }
    setIsSendingOtp(true);
    clearError();
    setStatusNotice(null);

    try {
      const res = await vendorApi.sendOtp(identifier.trim(), 'LOGIN');
      setOtpSent(true);
      setOtpCooldown(res.cooldownSeconds || 60);
      if (res.devOtpHint) {
        setDevOtpHint(res.devOtpHint);
        setOtpCode(res.devOtpHint);
      }
    } catch (err: any) {
      // Error handled by store or alert
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handle OTP Login Submit
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      alert('Please enter the 6-digit verification code.');
      return;
    }
    clearError();
    setStatusNotice(null);

    const res = await loginWithOtp(identifier, otpCode);
    if (res.success && res.redirectTo) {
      navigate(res.redirectTo);
    }
  };

  // Switch demo persona credentials
  const selectDemoPersona = (email: string, pass = 'Vendor@123', label: string) => {
    setIdentifier(email);
    setPassword(pass);
    setLoginMethod('password');
    clearError();
    setStatusNotice(`Selected persona: ${label}. Click "Sign In" to test status redirection.`);
  };

  return (
    <div className="w-full bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-[#E2E8F0] space-y-6 animate-in fade-in-0 duration-200">
      {/* Mobile Brand Header */}
      <div className="lg:hidden flex items-center gap-2.5 pb-4 border-b border-slate-100">
        <div className="w-9 h-9 rounded-xl bg-[#203D91] flex items-center justify-center text-white font-black text-lg shadow-sm">
          B
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-black text-xl tracking-tight text-[#17233C]">BUILDORA</span>
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-[#FF7417] text-white">60</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Build Smart. Supply Better.</p>
        </div>
      </div>

      {/* Heading & Subtitle */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#17233C]">
          Vendor Partner Login
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
          Manage your dark store stock, real-time builder dispatches, and automated weekly payouts.
        </p>
      </div>

      {/* Error / Lockout Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-800 text-xs flex items-start gap-3 shadow-xs animate-shake">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold text-rose-900">Authentication Alert</p>
            <p className="text-rose-700 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Status Notice */}
      {statusNotice && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-[#203D91] shrink-0" />
          <span>{statusNotice}</span>
        </div>
      )}

      {/* Demo Persona Switcher */}
      <div className="p-3.5 rounded-2xl bg-[#F4F7FC] border border-[#E2E8F0]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#FF7417]" />
            Quick Test Accounts (All 5 Statuses)
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => selectDemoPersona('vendor@buildora.in', 'Vendor@123', 'Active Approved Store')}
            className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            ✓ Approved (Apex Depot)
          </button>
          <button
            type="button"
            onClick={() => selectDemoPersona('underreview@buildora.in', 'Vendor@123', 'Under Review Account')}
            className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-blue-50 text-[#203D91] border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
          >
            ⏳ Under Review
          </button>
          <button
            type="button"
            onClick={() => selectDemoPersona('draft@buildora.in', 'Vendor@123', 'Incomplete Draft Registration')}
            className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
          >
            📝 Resume Draft
          </button>
          <button
            type="button"
            onClick={() => selectDemoPersona('rejected@buildora.in', 'Vendor@123', 'Rejected Application')}
            className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
          >
            ✕ Rejected (Re-submit)
          </button>
          <button
            type="button"
            onClick={() => selectDemoPersona('suspended@buildora.in', 'Vendor@123', 'Suspended Account')}
            className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            🚫 Suspended
          </button>
        </div>
      </div>

      {/* Login Mode Tabs */}
      <div className="flex p-1 bg-[#F4F7FC] rounded-xl border border-[#E2E8F0]">
        <button
          type="button"
          onClick={() => {
            setLoginMethod('password');
            clearError();
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            loginMethod === 'password'
              ? 'bg-white text-[#203D91] shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Password Login
        </button>
        <button
          type="button"
          onClick={() => {
            setLoginMethod('otp');
            clearError();
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            loginMethod === 'otp'
              ? 'bg-white text-[#203D91] shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Login with Mobile OTP
        </button>
      </div>

      {/* Method 1: Password Login Form */}
      {loginMethod === 'password' ? (
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
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

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[#17233C]">Password</label>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-[#203D91] hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-[#203D91] border-slate-300 focus:ring-[#203D91]"
              />
              <span className="text-xs text-slate-600 font-medium">Remember this browser</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-[#203D91] text-white hover:bg-[#162b66] transition-all shadow-md shadow-[#203D91]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <Clock className="w-4 h-4 animate-spin" />
                Signing in...
              </span>
            ) : (
              <>
                Sign In to Vendor Portal
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      ) : (
        /* Method 2: OTP Login Form */
        <form onSubmit={handleOtpSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#17233C] mb-1.5">
              Registered Email or Mobile Number
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  placeholder="9845012345 or vendor@buildora.in"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#17233C] focus:outline-none focus:ring-2 focus:ring-[#203D91] focus:border-transparent transition-all"
                />
              </div>
              <button
                type="button"
                onClick={handleRequestOtp}
                disabled={isSendingOtp || otpCooldown > 0}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#FF7417] text-white hover:bg-[#e05e07] transition-all shrink-0 cursor-pointer disabled:opacity-50"
              >
                {isSendingOtp ? 'Sending...' : otpCooldown > 0 ? `Resend (${otpCooldown}s)` : 'Send OTP'}
              </button>
            </div>
          </div>

          {otpSent && (
            <div className="space-y-3 pt-1 animate-in fade-in-0 duration-200">
              {devOtpHint && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                  <span>Dev Test OTP: <strong className="font-mono text-sm tracking-widest">{devOtpHint}</strong></span>
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
                <label className="block text-xs font-bold text-[#17233C] mb-1.5">
                  Enter 6-Digit Verification Code
                </label>
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-[#203D91] text-white hover:bg-[#162b66] transition-all shadow-md shadow-[#203D91]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Clock className="w-4 h-4 animate-spin" />
                    Verifying OTP...
                  </span>
                ) : (
                  <>
                    Verify & Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      )}

      {/* Registration Link */}
      <div className="pt-2 border-t border-slate-100 text-center space-y-2">
        <p className="text-xs text-slate-500">
          Want to become a certified BUILDORA 60 Supplier Partner?
        </p>
        <Link
          to="/register"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF7417] hover:underline"
        >
          Register your distribution store or mill
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Legal Footer Links */}
      <div className="pt-3 text-center text-[11px] text-slate-400 flex items-center justify-center gap-3">
        <a href="#" className="hover:underline">Supplier Terms</a>
        <span>•</span>
        <a href="#" className="hover:underline">Privacy Policy</a>
        <span>•</span>
        <a href="#" className="hover:underline">Compliance Standards</a>
      </div>
    </div>
  );
};
