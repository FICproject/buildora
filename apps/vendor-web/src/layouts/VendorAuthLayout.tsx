import React, { useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Truck, ShieldCheck, Zap, CheckCircle2, TrendingUp } from 'lucide-react';
import { useRegistrationStepStore } from '../store';
import step1OwnerHero from '../assets/register-step-1-owner.jpg';
import step2MaterialsHero from '../assets/vendor-supply-hero.jpg';
import step3LogisticsHero from '../assets/register-step-3-logistics.jpg';
import step4KycHero from '../assets/register-step-4-kyc.jpg';
import step5BankingHero from '../assets/register-step-5-banking.jpg';

interface StepVisualConfig {
  step: number;
  tag: string;
  caption: string;
  image: string;
  alt: string;
  objectPosition?: string;
}

const STEP_VISUALS: Record<number, StepVisualConfig> = {
  1: {
    step: 1,
    tag: 'Account Details',
    caption: 'Verify authorized supplier owner & contact credentials',
    image: step1OwnerHero,
    alt: 'Construction materials supplier business owner inspecting inventory in warehouse',
    objectPosition: 'object-[center_20%]',
  },
  2: {
    step: 2,
    tag: 'Business Information',
    caption: 'Cement, bricks, steel, plywood & building supplies catalog',
    image: step2MaterialsHero,
    alt: 'Construction materials warehouse with cement bags, bricks, steel rebar, plywood, and pipes',
  },
  3: {
    step: 3,
    tag: 'Address & Warehouses',
    caption: 'Connect regional dispatch hubs for 60-minute fulfillment',
    image: step3LogisticsHero,
    alt: 'Modern warehouse and logistics distribution hub with delivery fleet and pallets',
  },
  4: {
    step: 4,
    tag: 'KYC & Tax Documents',
    caption: 'GSTIN, PAN & compliance verification for trusted B2B trade',
    image: step4KycHero,
    alt: 'Professional business documentation, compliance folders, and verification desk',
  },
  5: {
    step: 5,
    tag: 'Bank & Terms',
    caption: 'Automated 7-day NEFT/RTGS payouts to your verified account',
    image: step5BankingHero,
    alt: 'Secure corporate banking and digital payment transaction setup',
  },
};

export const VendorAuthLayout: React.FC = () => {
  const location = useLocation();
  const { activeStep, direction } = useRegistrationStepStore();

  const isRegistrationFlow =
    location.pathname === '/register' || location.pathname === '/vendor/register';

  const resolvedStep = isRegistrationFlow
    ? activeStep
    : location.pathname.includes('review')
      ? 5
      : 2;

  const activeHero = STEP_VISUALS[resolvedStep] || STEP_VISUALS[1];
  const animationClass =
    direction === 'backward' ? 'animate-hero-backward' : 'animate-hero-forward';

  // Preload all 5 step images silently so step transitions remain instant without flicker
  useEffect(() => {
    Object.values(STEP_VISUALS).forEach((item) => {
      const img = new Image();
      img.src = item.image;
    });
  }, []);

  return (
    <div className="min-h-screen min-h-dvh lg:h-screen lg:h-dvh lg:overflow-hidden bg-[#F8F7F5] flex flex-col lg:flex-row text-[#292524]">
      {/* Mobile & Tablet Compact Brand Header (< lg) */}
      <div className="lg:hidden bg-[#943D24] text-white px-5 py-5 relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between gap-4">
          <Link to="/login" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F6C453] flex items-center justify-center text-[#943D24] font-black text-xl shadow-md">
              B
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg tracking-tight text-white">BUILDORA</span>
                <span className="text-[11px] font-black px-1.5 py-0.5 rounded bg-[#F6C453] text-[#292524]">
                  60
                </span>
              </div>
              <p className="text-[11px] font-medium text-white/80 leading-none mt-0.5">
                Build Smart. Supply Better.
              </p>
            </div>
          </Link>

          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-semibold text-white">
            <Zap className="w-3 h-3 text-[#F6C453]" />
            Supplier Portal
          </span>
        </div>

        <div className="relative z-10 mt-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 space-y-1.5">
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-white leading-snug">
              Directly connect your inventory to Bengaluru&apos;s premier builder network.
            </h1>
            <p className="text-xs text-white/85 leading-relaxed">
              Dispatch construction materials across 5 Bengaluru dark stores in under 60 minutes.
            </p>
          </div>
          <div className="w-full sm:w-48 aspect-[16/9] rounded-xl overflow-hidden border border-white/20 bg-[#7D331E] shadow-lg shrink-0 relative">
            <div key={`mobile-${activeHero.step}-${direction}`} className={`w-full h-full ${animationClass}`}>
              <img
                src={activeHero.image}
                alt={activeHero.alt}
                className={`w-full h-full object-cover ${activeHero.objectPosition || 'object-center'}`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#5C2211]/85 via-[#943D24]/20 to-transparent pointer-events-none" />
              {isRegistrationFlow && (
                <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center gap-1.5 pointer-events-none">
                  <span className="px-1.5 py-0.5 rounded bg-[#F6C453] text-[#292524] text-[10px] font-black shrink-0">
                    0{activeHero.step}/05
                  </span>
                  <span className="text-[11px] font-semibold text-white truncate drop-shadow">
                    {activeHero.tag}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Left Branding Panel (Desktop Only - Fixed Terracotta #943D24) */}
      <aside className="hidden lg:flex lg:w-[46%] xl:w-[46%] lg:h-screen lg:h-dvh lg:sticky lg:top-0 bg-[#943D24] text-white flex-col justify-between px-8 py-7 xl:px-12 xl:py-9 relative overflow-y-auto shrink-0">
        {/* Subtle Warm Highlight */}
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(246,196,83,0.7) 1px, transparent 0)',
            backgroundSize: '26px 26px',
          }}
        />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center justify-between gap-4">
          <Link to="/login" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-[#F6C453] flex items-center justify-center text-[#943D24] font-black text-xl shadow-md group-hover:scale-105 transition-transform">
              B
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl xl:text-2xl tracking-tight text-white">
                  BUILDORA
                </span>
                <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-[#F6C453] text-[#292524] shadow-sm">
                  60
                </span>
              </div>
              <p className="text-[11px] font-semibold text-white/80 tracking-wide mt-0.5">
                Build Smart. Supply Better.
              </p>
            </div>
          </Link>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-[11px] font-semibold">
            <Zap className="w-3.5 h-3.5 text-[#F6C453]" />
            <span>Supplier Portal</span>
          </div>
        </div>

        {/* Centerpiece Composition */}
        <div className="relative z-10 w-full max-w-xl mx-auto my-auto py-4 space-y-4 xl:space-y-5">
          <div className="space-y-2">
            <h1 className="text-2xl xl:text-[30px] font-bold tracking-tight text-white leading-[1.2]">
              Directly connect your inventory to Bengaluru&apos;s premier builder network.
            </h1>
            <p className="text-white/85 text-xs xl:text-[13px] leading-relaxed max-w-lg">
              Partner with BUILDORA 60 to dispatch cement, steel, hardware, and plumbing supplies across 5 regional dark stores in under 60 minutes.
            </p>
          </div>

          {/* Dynamic Step Visual Frame with Fade + Slide Transition */}
          <div className="relative rounded-2xl overflow-hidden border border-white/25 bg-[#7D331E] shadow-xl aspect-[16/9]">
            <div key={`desktop-${activeHero.step}-${direction}`} className={`w-full h-full relative ${animationClass}`}>
              <img
                src={activeHero.image}
                alt={activeHero.alt}
                className={`w-full h-full object-cover ${activeHero.objectPosition || 'object-center'}`}
              />
              {/* Image readability overlays matching #943D24 */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#4A1B0D]/85 via-[#943D24]/15 to-transparent pointer-events-none" />
              <div className="absolute bottom-3 left-3.5 right-3.5 flex items-end justify-between gap-3 pointer-events-none">
                <div className="min-w-0">
                  {isRegistrationFlow && (
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#F6C453] text-[#292524] text-[10px] font-extrabold uppercase tracking-wide mb-1 shadow-sm">
                      Step 0{activeHero.step} / 05 &bull; {activeHero.tag}
                    </div>
                  )}
                  <p className="text-xs font-medium text-white/95 truncate drop-shadow">
                    {activeHero.caption}
                  </p>
                </div>
                {isRegistrationFlow && (
                  <div className="flex items-center gap-1 shrink-0 pb-1">
                    {[1, 2, 3, 4, 5].map((dot) => (
                      <span
                        key={dot}
                        className={`h-1.5 rounded-full transition-all duration-300 ${dot === activeHero.step
                            ? 'w-5 bg-[#F6C453]'
                            : dot < activeHero.step
                              ? 'w-2 bg-white/85'
                              : 'w-1.5 bg-white/40'
                          }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-white/10 border border-white/15">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 rounded-md bg-[#F6C453] flex items-center justify-center shrink-0">
                  <Truck className="w-3.5 h-3.5 text-[#943D24]" />
                </span>
                <h4 className="text-xs font-bold text-white">60-Min Dispatch Hubs</h4>
              </div>
              <p className="text-[11px] text-white/80 leading-snug">
                Dark stores in Peenya, Whitefield, Electronic City &amp; Indiranagar.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/10 border border-white/15">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-3.5 h-3.5 text-[#F6C453]" />
                </span>
                <h4 className="text-xs font-bold text-white">Automated Settlements</h4>
              </div>
              <p className="text-[11px] text-white/80 leading-snug">
                Guaranteed 7-day NEFT/RTGS payouts with automated GST credit.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11px] text-white/90 pt-0.5">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#F6C453] shrink-0" />
              <span>Zero setup fees &bull; Direct B2B procurement</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#F6C453] shrink-0" />
              <span>Multi-tier bulk pricing &amp; live stock sync</span>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="relative z-10 text-[11px] text-white/80 flex items-center justify-between border-t border-white/15 pt-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#F6C453]" />
            <span>ISO 9001:2015 Certified Supply Chain</span>
          </div>
          <span>&copy; {new Date().getFullYear()} Buildora Tech Pvt Ltd</span>
        </div>
      </aside>

      {/* Right Content Form Area */}
      <main className="w-full lg:w-[54%] xl:w-[54%] lg:h-screen lg:h-dvh lg:overflow-y-auto flex flex-col p-4 sm:p-8 lg:p-10 xl:p-12 bg-[#F8F7F5]">
        <div className="w-full max-w-xl mx-auto my-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
