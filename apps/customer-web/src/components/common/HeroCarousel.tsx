import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Zap,
  ArrowRight,
  ShieldCheck,
  Building2,
  Layers,
  Wrench,
  Compass,
  CheckCircle2,
  Package
} from 'lucide-react';
import { useLocationStore } from '../../store/useLocationStore';
import { useStoreConfigStore } from '../../store/useStoreConfigStore';

interface SlideData {
  id: string | number;
  tag: string;
  tagColor: string;
  headline: string;
  subheadline: string;
  description: string;
  highlights: string[];
  ctaText: string;
  ctaLink: string;
  imageUrl: string;
  fallbackGradient: string;
  icon: React.ElementType;
}

const SLIDE_STYLE_DEFAULTS = [
  { tagColor: 'bg-brand-orange-500 text-white', fallbackGradient: 'from-blue-950 via-slate-900 to-indigo-950', icon: Zap },
  { tagColor: 'bg-amber-400 text-slate-950', fallbackGradient: 'from-amber-950 via-slate-900 to-stone-900', icon: Building2 },
  { tagColor: 'bg-emerald-500 text-white', fallbackGradient: 'from-emerald-950 via-slate-900 to-teal-950', icon: Layers },
  { tagColor: 'bg-cyan-500 text-slate-950', fallbackGradient: 'from-cyan-950 via-slate-900 to-blue-950', icon: Compass },
  { tagColor: 'bg-orange-600 text-white', fallbackGradient: 'from-orange-950 via-slate-900 to-stone-900', icon: Wrench },
];

export const HeroCarousel: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string | number, boolean>>({});
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const { pincode, locality, warehouseName, etaMinutes } = useLocationStore();
  const storeConfig = useStoreConfigStore((s) => s.config);
  const apiBanners: any[] = storeConfig?.content?.banners || [];

  const slides: SlideData[] = React.useMemo(() => {
    if (apiBanners.length > 0) {
      return apiBanners.map((b, idx) => {
        const style = SLIDE_STYLE_DEFAULTS[idx % SLIDE_STYLE_DEFAULTS.length];
        return {
          id: b.id || idx + 1,
          tag: b.badge || 'FEATURED SUPPLY',
          tagColor: style.tagColor,
          headline: b.title || 'Certified Building Materials Delivered Fast',
          subheadline: b.subtitle || '',
          description: b.subtitle || 'Verified suppliers with live dark-store fulfillment and GST tax invoices.',
          highlights: Array.isArray(b.publishedPayload?.highlights) ? b.publishedPayload.highlights : [storeConfig?.city || 'Bengaluru', 'GST Verified'],
          ctaText: b.ctaLabel || 'Browse Catalog',
          ctaLink: b.ctaUrl || '/products',
          imageUrl: b.imageUrl || b.publishedPayload?.imageUrl || '',
          fallbackGradient: style.fallbackGradient,
          icon: style.icon,
        };
      });
    }
    return [
      {
        id: 'default-store-hero',
        tag: `${etaMinutes || 60}-MIN SITE DISPATCH`,
        tagColor: SLIDE_STYLE_DEFAULTS[0].tagColor,
        headline: storeConfig?.storeName ? `${storeConfig.storeName} — Site Supply Hub` : 'Certified Construction Materials Delivered Fast.',
        subheadline: locality || storeConfig?.city || 'Bengaluru',
        description: `Order verified construction supplies for ${pincode || 'your project'} with transparent GST billing and live tracking.`,
        highlights: [storeConfig?.city || 'Bengaluru', 'Direct Verified Brands', 'GST Invoices'],
        ctaText: 'Order Materials Now',
        ctaLink: '/products',
        imageUrl: '',
        fallbackGradient: SLIDE_STYLE_DEFAULTS[0].fallbackGradient,
        icon: Zap,
      },
    ];
  }, [apiBanners, storeConfig, etaMinutes, locality, pincode]);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % Math.max(1, slides.length));
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + Math.max(1, slides.length)) % Math.max(1, slides.length));
  }, [slides.length]);

  // Auto-play timer
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 5500);
    return () => clearInterval(timer);
  }, [isPaused, nextSlide]);

  // Handle Touch Swipes for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50) {
      nextSlide();
    } else if (diff < -50) {
      prevSlide();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleImageError = (slideId: number) => {
    setFailedImages((prev) => ({ ...prev, [slideId]: true }));
  };

  return (
    <div
      className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-white/15 shadow-2xl bg-slate-900 aspect-[16/11] sm:aspect-[16/10] lg:aspect-auto lg:h-[390px] xl:h-[410px] flex flex-col justify-between group select-none w-full max-w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slides Deck */}
      {slides.map((slide, idx) => {
        const isActive = idx === currentSlide % Math.max(1, slides.length);
        const isFailed = !slide.imageUrl || Boolean(failedImages[slide.id]);
        const IconComponent = slide.icon;

        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            {/* Background Image / Rich Fallback */}
            {!isFailed ? (
              <img
                src={slide.imageUrl}
                alt={slide.headline}
                onError={() => setFailedImages((prev) => ({ ...prev, [slide.id]: true }))}
                className={`w-full h-full object-cover transition-transform duration-1000 ${
                  isActive ? 'scale-105' : 'scale-100'
                }`}
                loading={idx === 0 ? 'eager' : 'lazy'}
              />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${slide.fallbackGradient} relative overflow-hidden flex items-center justify-center`}>
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#f97316_1px,transparent_1px)] [background-size:20px_20px]" />
                <IconComponent className="w-48 h-48 text-white/5 absolute -right-8 -bottom-8 pointer-events-none" />
              </div>
            )}

            {/* Contrast Gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/30" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/40 to-transparent" />

            {/* Slide Content Overlay */}
            <div className="absolute inset-0 p-5 sm:p-7 lg:p-8 flex flex-col justify-between z-20">
              {/* Top Tag & Slide Counter */}
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${slide.tagColor}`}>
                  <slide.icon className="w-3.5 h-3.5" />
                  {slide.tag}
                </span>

                <span className="text-[11px] font-mono font-bold text-white/60 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10">
                  0{idx + 1} / 0{slides.length}
                </span>
              </div>

              {/* Center Headlines & Description */}
              <div className="space-y-1.5 sm:space-y-2.5 max-w-xl my-auto">
                <h3 className="text-lg sm:text-2xl lg:text-2xl xl:text-3xl font-black text-white leading-tight drop-shadow-md">
                  {slide.headline}
                </h3>
                <p className="text-xs sm:text-sm text-slate-200 line-clamp-2 leading-relaxed drop-shadow-sm font-normal">
                  {slide.description}
                </p>

                {/* Highlights Pills */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap pt-0.5 sm:pt-1">
                  {slide.highlights.map((item, hIdx) => (
                    <span
                      key={hIdx}
                      className="bg-white/15 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white text-[9.5px] sm:text-[11px] font-bold px-2 sm:px-2.5 py-0.5 rounded-lg flex items-center gap-1 shadow-xs"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      {item}
                    </span>
                  ))}
                </div>

                {/* Slide CTA */}
                <div className="pt-1 sm:pt-2">
                  <Link
                    to={slide.ctaLink}
                    className="inline-flex items-center gap-2 bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-black text-xs sm:text-sm px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl shadow-lg transition-transform hover:scale-105"
                  >
                    <span>{slide.ctaText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Bottom Spacer for Indicators */}
              <div className="h-8 sm:h-10" />
            </div>
          </div>
        );
      })}

      {/* Floating Live Dark Store Network Status Pill (Bottom) */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:bottom-3 sm:left-3 sm:right-3 z-30 bg-slate-950/90 backdrop-blur-md px-3 py-2 rounded-xl sm:rounded-2xl border border-white/15 flex items-center justify-between text-xs shadow-xl">
        <div className="flex items-center gap-2 min-w-0 pr-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          <div className="truncate">
            <span className="text-[9px] uppercase font-black tracking-wider text-brand-orange-400 block leading-tight">
              Live Bengaluru Dark Store Network
            </span>
            <span className="font-bold text-white text-[10.5px] sm:text-xs truncate block leading-tight">
              {warehouseName || 'Bengaluru Central WH-BLR-01'} Online
            </span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <span className="bg-emerald-950/90 text-emerald-300 font-black text-[9.5px] sm:text-[10.5px] px-2 py-0.5 rounded-md border border-emerald-500/30">
            {etaMinutes > 0 ? `${etaMinutes}m ETA` : 'Active Fleet'}
          </span>
        </div>
      </div>

      {/* Left / Right Arrow Controls */}
      <button
        type="button"
        onClick={prevSlide}
        aria-label="Previous Slide"
        className="absolute left-2.5 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-900/60 hover:bg-brand-orange-500 text-white backdrop-blur-md flex items-center justify-center border border-white/20 transition-all opacity-0 group-hover:opacity-100 hover:scale-110 shadow-lg"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        type="button"
        onClick={nextSlide}
        aria-label="Next Slide"
        className="absolute right-2.5 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-900/60 hover:bg-brand-orange-500 text-white backdrop-blur-md flex items-center justify-center border border-white/20 transition-all opacity-0 group-hover:opacity-100 hover:scale-110 shadow-lg"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Pagination Dots */}
      <div className="absolute bottom-16 sm:bottom-18 left-0 right-0 z-30 flex items-center justify-center gap-1.5">
        {slides.map((_, dotIdx) => {
          const isCurrent = dotIdx === currentSlide % Math.max(1, slides.length);
          return (
            <button
              key={dotIdx}
              type="button"
              onClick={() => setCurrentSlide(dotIdx)}
              aria-label={`Jump to slide ${dotIdx + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                isCurrent
                  ? 'w-6 bg-brand-orange-500 shadow-sm'
                  : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};
