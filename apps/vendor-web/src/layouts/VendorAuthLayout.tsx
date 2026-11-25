import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Truck, ShieldCheck, Zap, CheckCircle2, TrendingUp } from 'lucide-react';
import vendorSupplyHero from '../assets/vendor-supply-hero.jpg';

export const VendorAuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-[#F4F7FC] flex flex-col lg:flex-row text-[#17233C]">
      {/* Mobile & Tablet Compact Brand Header (< lg) */}
      <div className="lg:hidden bg-gradient-to-br from-[#173076] via-[#203D91] to-[#132866] text-white px-5 py-5 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#FF7417]/15 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between gap-4">
          <Link to="/login" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF7417] to-[#e05e07] flex items-center justify-center text-white font-black text-xl shadow-md shadow-black/20">
              B
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg tracking-tight text-white">BUILDORA</span>
                <span className="text-[11px] font-black px-1.5 py-0.5 rounded bg-[#FF7417] text-white">
                  60
                </span>
              </div>
              <p className="text-[11px] font-medium text-blue-200 leading-none mt-0.5">
                Build Smart. Supply Better.
              </p>
            </div>
          </Link>

          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-semibold text-blue-100">
            <Zap className="w-3 h-3 text-[#FF7417]" />
            Supplier Portal
          </span>
        </div>

        <div className="relative z-10 mt-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 space-y-1.5">
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-white leading-snug">
              Directly connect your inventory to Bengaluru&apos;s premier builder network.
            </h1>
            <p className="text-xs text-blue-100/85 leading-relaxed">
              Dispatch construction materials across 5 Bengaluru dark stores in under 60 minutes.
            </p>
          </div>
          <div className="w-full sm:w-44 aspect-[16/9] rounded-xl overflow-hidden border border-white/15 shadow-lg shrink-0 relative">
            <img
              src={vendorSupplyHero}
              alt="Construction materials ready for dispatch including cement bags, bricks, steel rods, plywood, and pipes"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#132866]/55 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Left Branding Panel (Desktop Only - Fixed & Non-Scrolling, ~48% viewport) */}
      <aside className="hidden lg:flex lg:w-[48%] xl:w-[49%] lg:h-screen lg:sticky lg:top-0 bg-gradient-to-br from-[#193482] via-[#203D91] to-[#132763] text-white flex-col justify-between px-8 py-7 xl:px-12 xl:py-9 relative overflow-hidden shadow-2xl shrink-0">
        {/* Soft Lighting & Depth Accents */}
        <div className="absolute -top-28 -right-24 w-96 h-96 rounded-full bg-[#FF7417]/14 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-28 -left-24 w-96 h-96 rounded-full bg-blue-300/10 blur-3xl pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)',
            backgroundSize: '26px 26px'
          }}
        />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center justify-between gap-4">
          <Link to="/login" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF7417] to-[#e05e07] flex items-center justify-center text-white font-black text-xl shadow-lg shadow-black/25 group-hover:scale-105 transition-transform">
              B
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl xl:text-2xl tracking-tight text-white">BUILDORA</span>
                <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-[#FF7417] text-white shadow-sm">
                  60
                </span>
              </div>
              <p className="text-[11px] font-semibold text-blue-200/90 tracking-wide mt-0.5">
                Build Smart. Supply Better.
              </p>
            </div>
          </Link>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-blue-50 text-[11px] font-semibold backdrop-blur-md">
            <Zap className="w-3.5 h-3.5 text-[#FF7417]" />
            <span>Supplier Portal</span>
          </div>
        </div>

        {/* Centerpiece Composition: Copy + Integrated Construction Supply Visual + Compact Features */}
        <div className="relative z-10 w-full max-w-xl mx-auto my-auto py-4 space-y-4 xl:space-y-5">
          <div className="space-y-2">
            <h1 className="text-2xl xl:text-[31px] font-black tracking-tight text-white leading-[1.18]">
              Directly connect your inventory to Bengaluru&apos;s premier builder network.
            </h1>
            <p className="text-blue-100/85 text-xs xl:text-[13px] leading-relaxed max-w-lg">
              Partner with BUILDORA 60 to dispatch cement, steel, hardware, and plumbing supplies across 5 regional dark stores in under 60 minutes.
            </p>
          </div>

          {/* Primary Construction Materials Visual - Integrated naturally with blue panel */}
          <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-[#132763] shadow-[0_22px_50px_rgba(7,15,43,0.45)] aspect-[16/9]">
            <img
              src={vendorSupplyHero}
              alt="Modern construction materials hub featuring cement bags, bricks, steel rebar, plywood sheets, and plumbing pipes"
              className="w-full h-full object-cover object-center"
            />
            {/* Soft navy vignette & ambient blend so the photo sits naturally inside the dark blue panel */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#132763]/80 via-[#193482]/10 to-[#193482]/25 pointer-events-none" />
            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl pointer-events-none" />
          </div>

          {/* Neatly Arranged Feature Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-white/[0.08] border border-white/12 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 rounded-md bg-[#FF7417]/20 flex items-center justify-center shrink-0">
                  <Truck className="w-3.5 h-3.5 text-[#FF7417]" />
                </span>
                <h4 className="text-xs font-bold text-white">60-Min Dispatch Hubs</h4>
              </div>
              <p className="text-[11px] text-blue-200/85 leading-snug">
                Dark stores in Peenya, Whitefield, Electronic City &amp; Indiranagar.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.08] border border-white/12 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 rounded-md bg-white/15 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-3.5 h-3.5 text-white" />
                </span>
                <h4 className="text-xs font-bold text-white">Automated Settlements</h4>
              </div>
              <p className="text-[11px] text-blue-200/85 leading-snug">
                Guaranteed 7-day NEFT/RTGS payouts with automated GST credit.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11px] text-blue-100/90 pt-0.5">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#FF7417] shrink-0" />
              <span>Zero setup fees &bull; Direct B2B procurement</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#FF7417] shrink-0" />
              <span>Multi-tier bulk pricing &amp; live stock sync</span>
            </div>
          </div>
        </div>

        {/* Footer Info (Fixed at Bottom of Left Panel) */}
        <div className="relative z-10 text-[11px] text-blue-200/80 flex items-center justify-between border-t border-white/15 pt-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#FF7417]" />
            <span>ISO 9001:2015 Certified Supply Chain</span>
          </div>
          <span>&copy; {new Date().getFullYear()} Buildora Tech Pvt Ltd</span>
        </div>
      </aside>

      {/* Right Content Form Area - Independently Scrollable on Desktop (~52% viewport) */}
      <main className="w-full lg:w-[52%] xl:w-[51%] lg:h-screen lg:overflow-y-auto flex flex-col p-5 sm:p-8 lg:p-10 xl:p-12">
        <div className="w-full max-w-xl mx-auto my-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
