import React from 'react';
import { Outlet } from 'react-router-dom';
import { Truck, ShieldCheck, Zap, Layers } from 'lucide-react';

export const VendorAuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left Branding Panel (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Background glow accents */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-xl shadow-md">
            B
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-2xl tracking-tight text-white">BUILDORA</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                60
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Vendor Partner Network</p>
          </div>
        </div>

        {/* Hero Copy */}
        <div className="relative z-10 max-w-lg space-y-6 my-auto py-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-900/60 border border-blue-700/50 text-blue-300 text-xs font-medium">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Bengaluru's First 60-Minute Construction Materials Network
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Scale your material supply to thousands of active builders & contractors.
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Directly connect your inventory to 5 Dark Stores across Bengaluru. Manage catalog,
            configure quantity-based bulk discounts, and track automated 7-day settlements.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <Truck className="w-5 h-5 text-blue-400 mb-2" />
              <h4 className="text-xs font-semibold text-white">60-Min Dispatch Hubs</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Dark stores in Peenya, Whitefield, Electronic City & more.</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <Layers className="w-5 h-5 text-amber-400 mb-2" />
              <h4 className="text-xs font-semibold text-white">Dynamic Bulk Pricing</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Automated contractor tiers for 10+, 50+, 100+ units.</p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-slate-500 flex items-center justify-between border-t border-slate-800 pt-6">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>ISO 9001:2015 Certified Supply Chain</span>
          </div>
          <span>&copy; {new Date().getFullYear()} Buildora Tech Pvt Ltd</span>
        </div>
      </div>

      {/* Right Content Form Area */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
