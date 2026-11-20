import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { ShieldCheck, Lock, PhoneCall } from 'lucide-react';
import { ScrollToTop } from '../components/common/ScrollToTop';

export const CheckoutLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <ScrollToTop />
      {/* Focused Checkout Header */}
      <header className="bg-white border-b border-slate-200 py-3.5 px-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-blue-900 flex items-center justify-center text-white font-black text-lg">
              B
            </div>
            <div className="flex flex-col">
              <span className="font-black text-lg tracking-tight text-slate-900 leading-none">
                BUILDORA<span className="text-brand-orange-500 ml-0.5">60</span>
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                Secure Checkout
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4 text-xs">
            <div className="hidden sm:flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <Lock className="w-3.5 h-3.5" />
              <span>256-Bit SSL Encrypted</span>
            </div>
            <a
              href="tel:18006028453"
              className="flex items-center gap-1 text-slate-600 hover:text-brand-blue-900 font-medium"
            >
              <PhoneCall className="w-3.5 h-3.5 text-brand-orange-500" />
              <span className="hidden sm:inline">Order Support: 1800-60-BUILD</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Checkout Outlet */}
      <main className="flex-grow py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Outlet />
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="flex items-center justify-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Razorpay Verified Payment Gateway &bull; 100% Tax Invoice Guaranteed</span>
        </div>
        <div>&copy; {new Date().getFullYear()} BUILDORA 60 Technologies Pvt Ltd.</div>
      </footer>
    </div>
  );
};
