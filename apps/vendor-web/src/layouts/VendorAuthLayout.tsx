import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Truck, ShieldCheck, Zap, Layers, CheckCircle2, Building2, TrendingUp } from 'lucide-react';

export const VendorAuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F4F7FC] flex text-[#17233C]">
      {/* Left Branding Panel (Desktop Only) - Navy Blue #203D91 Background */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#203D91] text-white flex-col justify-between p-12 xl:p-16 relative overflow-hidden shadow-2xl">
        {/* Subtle decorative glow accents with brand orange & blue */}
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 rounded-full bg-[#FF7417]/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#FF7417] to-[#e05e07] flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-black/20">
            B
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-2xl tracking-tight text-white">BUILDORA</span>
              <span className="text-xs font-black px-2 py-0.5 rounded-md bg-[#FF7417] text-white shadow-sm">
                60
              </span>
            </div>
            <p className="text-xs font-semibold text-blue-200 tracking-wide mt-0.5">
              Build Smart. Supply Better.
            </p>
          </div>
        </div>

        {/* Hero Copy & B2B Construction Supplier Visuals */}
        <div className="relative z-10 max-w-lg space-y-6 my-auto py-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/20 text-white text-xs font-semibold backdrop-blur-md">
            <Zap className="w-3.5 h-3.5 text-[#FF7417]" />
            Enterprise Supplier & Distribution Portal
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
            Directly connect your inventory to Bengaluru’s premier builder network.
          </h1>

          <p className="text-blue-100/90 text-sm leading-relaxed">
            Partner with BUILDORA 60 to dispatch construction materials, architectural hardware, electricals, and plumbing supplies across 5 regional dark stores in under 60 minutes.
          </p>

          {/* Business Value Cards */}
          <div className="grid grid-cols-2 gap-3.5 pt-2">
            <div className="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm transition-all hover:bg-white/15">
              <div className="w-8 h-8 rounded-lg bg-[#FF7417]/20 flex items-center justify-center text-[#FF7417] mb-2.5">
                <Truck className="w-4 h-4 text-[#FF7417]" />
              </div>
              <h4 className="text-xs font-bold text-white">60-Min Dispatch Hubs</h4>
              <p className="text-[11px] text-blue-200 mt-1 leading-snug">
                Dark store networks in Peenya, Whitefield, Electronic City, and Indiranagar.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm transition-all hover:bg-white/15">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white mb-2.5">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <h4 className="text-xs font-bold text-white">Automated Settlements</h4>
              <p className="text-[11px] text-blue-200 mt-1 leading-snug">
                Guaranteed 7-day NEFT/RTGS payouts with automated GST compliance credit.
              </p>
            </div>
          </div>

          {/* Trust Checkmarks */}
          <div className="space-y-2 pt-2 border-t border-white/15 text-xs text-blue-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#FF7417] shrink-0" />
              <span>Zero setup fees • Direct enterprise B2B contractor procurement</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#FF7417] shrink-0" />
              <span>Multi-tier bulk pricing & live stock sync across Bangalore</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-blue-200/80 flex items-center justify-between border-t border-white/15 pt-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#FF7417]" />
            <span>ISO 9001:2015 Certified Supply Chain</span>
          </div>
          <span>&copy; {new Date().getFullYear()} Buildora Tech Pvt Ltd</span>
        </div>
      </div>

      {/* Right Content Form Area - Background #F4F7FC */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-xl">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
