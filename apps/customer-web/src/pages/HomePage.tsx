import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Zap,
  Clock,
  ShieldCheck,
  Truck,
  ArrowRight,
  Calculator,
  Building2,
  PhoneCall,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Layers,
  Award,
  Star,
  CheckCircle2,
  Smartphone,
  Flame,
  Tag,
  Package,
  Wrench,
  Compass,
  FolderKanban,
  FileText
} from 'lucide-react';
import {
  MASTER_CATEGORIES,
  MASTER_BRANDS,
  SEED_PRODUCTS,
  SEED_KNOWLEDGE_ARTICLES
} from '@buildora/constants';
import { Category, Brand, Product } from '@buildora/types';
import { api } from '../services/api';
import { ProductCard } from '../components/common/ProductCard';
import { CategoryCard } from '../components/common/CategoryCard';
import { BrandCard } from '../components/common/BrandCard';
import { Button } from '../components/ui/Button';
import { useLocationStore } from '../store/useLocationStore';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { pincode, cityName, etaMinutes, openLocationModal } = useLocationStore();

  // Dynamic live backend state initialized with defaults
  const [products, setProducts] = useState<Product[]>(SEED_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(MASTER_CATEGORIES);
  const [brands, setBrands] = useState<Brand[]>(MASTER_BRANDS);

  // Fetch real data from Backend API on mount
  useEffect(() => {
    let isMounted = true;
    api.getProducts().then((p) => {
      if (isMounted && p && p.length > 0) setProducts(p);
    });
    api.getCategories().then((c) => {
      if (isMounted && c && c.length > 0) setCategories(c);
    });
    api.getBrands().then((b) => {
      if (isMounted && b && b.length > 0) setBrands(b);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Flash Deals Countdown Timer
  const [timeLeft, setTimeLeft] = useState({ hours: 8, minutes: 42, seconds: 19 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filtered product slices using real API data
  const dealsOfTheDay = products.filter((p) => p.isDealOfTheDay || p.discount >= 10);
  const bestSellers = products.filter((p) => p.isBestSeller);
  const newArrivals = products.slice(4, 8);
  const civilSpotlight = products.filter((p) => p.categorySlug === 'cement-concrete');
  const electricalSpotlight = products.filter((p) => p.categorySlug === 'wires-mcb-distribution-boards');

  return (
    <div className="space-y-8 sm:space-y-12 pb-16">
      {/* 1. HERO BANNER SECTION */}
      <section className="relative bg-gradient-to-br from-brand-blue-950 via-brand-blue-900 to-slate-900 text-white overflow-hidden py-8 sm:py-12 lg:py-16">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#f97316_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Headlines & CTAs */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-6">
              <div className="inline-flex items-center gap-2 bg-brand-orange-500/20 border border-brand-orange-500/40 text-brand-orange-300 text-xs font-black px-3 py-1.5 rounded-full backdrop-blur-sm">
                <Zap className="w-3.5 h-3.5 fill-current text-brand-orange-400 animate-pulse" />
                <span>60-MINUTE CONSTRUCTION QUICK-COMMERCE</span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                BUILD SMART. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-brand-orange-400 to-orange-500">
                  DELIVER FAST.
                </span>
              </h1>

              <p className="text-slate-300 text-xs sm:text-sm lg:text-base max-w-xl leading-relaxed">
                Direct-from-mill construction materials dispatched to your job site in as fast as 60 minutes.
                UltraTech cement, Astral CPVC, Havells wires, Greenply marine boards, and Bosch power tools with instant B2B GST ITC invoices.
              </p>

              {/* Serviceability & Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <div
                  onClick={openLocationModal}
                  className="cursor-pointer flex items-center justify-between sm:justify-start gap-2 bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/10 px-3.5 py-2.5 rounded-xl text-xs transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-brand-orange-400 flex-shrink-0" />
                    <div className="truncate">
                      <span className="text-slate-400">Site: </span>
                      <strong className="text-white underline">{pincode} ({cityName.split(',')[0]})</strong>
                    </div>
                  </div>
                  {etaMinutes > 0 && (
                    <span className="bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-md text-[10px] border border-emerald-400/30 flex-shrink-0">
                      {etaMinutes}m ETA
                    </span>
                  )}
                </div>

                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => navigate('/products')}
                  className="w-full sm:w-auto font-black shadow-lg"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Order Materials
                </Button>

                <Button
                  variant="outline"
                  size="md"
                  onClick={() => navigate('/tools/material-estimator')}
                  className="w-full sm:w-auto bg-white/10 text-white border-white/20 hover:bg-white/20 font-bold"
                  leftIcon={<Calculator className="w-4 h-4 text-brand-orange-400" />}
                >
                  Estimator
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4 pt-4 border-t border-white/10 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>100% Mill Fresh Stock</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span>Instant B2B GST Invoices</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Crane &amp; Tail-Lift Trucks</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Card */}
            <div className="lg:col-span-5 relative mt-4 lg:mt-0">
              <div className="relative rounded-3xl overflow-hidden border border-white/15 shadow-2xl bg-slate-800 aspect-[16/10] sm:aspect-[16/9] lg:aspect-auto lg:h-96">
                <img
                  src="https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=800&q=80"
                  alt="Construction Site Delivery"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                {/* Floating Live Dispatch Badge */}
                <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 bg-slate-900/90 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-white/15 flex items-center justify-between">
                  <div>
                    <div className="text-[9px] sm:text-[10px] text-brand-orange-400 font-black uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Live Dark Store Dispatch Network
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-white mt-0.5">Bengaluru Central WH-BLR-01 Online</div>
                    <div className="text-[10px] sm:text-[11px] text-slate-400">Average site turnaround: 38 minutes</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] sm:text-xs font-black text-emerald-400 bg-emerald-950/80 px-2 py-1 rounded-lg border border-emerald-500/30">
                      Fleet Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 4-PILLAR DELIVERY BENEFITS GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-2.5 sm:gap-3.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-orange-100 text-brand-orange-600 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-xs sm:text-sm">60-Min Site Delivery</div>
              <div className="text-[11px] sm:text-xs text-slate-500">Dedicated EV mini-truck fleet</div>
            </div>
          </div>

          <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-2.5 sm:gap-3.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-100 text-brand-blue-700 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-xs sm:text-sm">100% Genuine Stock</div>
              <div className="text-[11px] sm:text-xs text-slate-500">Direct from authorized plants</div>
            </div>
          </div>

          <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-2.5 sm:gap-3.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <Package className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-xs sm:text-sm">No Minimum Order</div>
              <div className="text-[11px] sm:text-xs text-slate-500">Order 1 bag or 500 bags</div>
            </div>
          </div>

          <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-2.5 sm:gap-3.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-xs sm:text-sm">Instant B2B GST</div>
              <div className="text-[11px] sm:text-xs text-slate-500">Full ITC tax compliance</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. QUICK CATEGORY SHORTCUTS STRIP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-3 sm:p-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-orange-500" />
              Quick Material Shortcuts
            </h3>
            <Link to="/products" className="text-xs font-bold text-brand-blue-800 hover:underline">
              View All 28 &rarr;
            </Link>
          </div>

          {/* Swipeable row on mobile, grid on desktop */}
          <div className="flex sm:grid sm:grid-cols-5 lg:grid-cols-10 gap-2 sm:gap-3 overflow-x-auto no-scrollbar pb-1 text-center">
            {categories.slice(0, 10).map((cat) => (
              <Link
                key={cat.id}
                to={`/categories/${cat.slug}`}
                className="group flex flex-col items-center p-2 rounded-xl hover:bg-slate-50 transition-colors min-w-[76px] sm:min-w-0 flex-shrink-0"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-brand-blue-50 border border-slate-200/60 flex items-center justify-center overflow-hidden mb-1.5 transition-colors">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    loading="lazy"
                  />
                </div>
                <span className="text-[11px] font-bold text-slate-700 group-hover:text-brand-blue-900 line-clamp-1 w-full">
                  {cat.name.split(' ')[0]}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. TOP DEALS OF THE DAY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent rounded-3xl border border-brand-orange-200/80 p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                <span className="bg-brand-orange-500 text-white text-[10px] sm:text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 fill-current" /> Deals of the Day
                </span>
                <div className="flex items-center gap-1 text-xs font-mono font-black text-slate-800 bg-white px-2.5 py-0.5 rounded-lg border border-brand-orange-200 shadow-sm">
                  <Clock className="w-3.5 h-3.5 text-brand-orange-500" />
                  <span>
                    {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                </div>
              </div>
              <h2 className="text-lg sm:text-2xl font-black text-slate-900 mt-1">
                Today's Special Site Material Discounts
              </h2>
            </div>
            <Link
              to="/deals"
              className="text-xs font-bold text-brand-orange-600 hover:text-brand-orange-700 flex items-center gap-1"
            >
              See All Deals ({dealsOfTheDay.length}) <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {dealsOfTheDay.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* 5. SHOP BY 28 MASTER CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-2xl font-black text-slate-900">
              Explore All 28 Master Categories
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Structural civil supplies, finishing boards, electrical, plumbing, and architectural hardware.
            </p>
          </div>
          <Link to="/products" className="text-xs font-bold text-brand-blue-800 hover:underline">
            View Catalogue
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3">
          {categories.map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>
      </section>

      {/* 6. NEWLY LAUNCHED SITE MATERIALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-brand-blue-800 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-black text-slate-900">Newly Launched Materials</h2>
              <p className="text-xs text-slate-500">Latest additions to our quick-commerce inventory catalog.</p>
            </div>
          </div>
          <Link to="/products?sort=newest" className="text-xs font-bold text-brand-blue-800 hover:underline">
            View New &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {newArrivals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 7. CONTRACTOR BEST SELLERS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-black text-slate-900">Contractor Best Sellers</h2>
              <p className="text-xs text-slate-500">Most reordered materials by builders and interior contractors this week.</p>
            </div>
          </div>
          <Link to="/products" className="text-xs font-bold text-brand-blue-800 hover:underline">
            View All &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {bestSellers.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 8. PROMOTIONAL BANNER: CONTRACTOR CLUB SAVINGS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-brand-blue-950 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden border border-white/10">
          <div className="space-y-2 z-10 max-w-xl">
            <span className="bg-amber-400 text-slate-900 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Contractor &amp; Builder Club
            </span>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-black">
              Unlock Tiered Bulk Discounts Up To 15%
            </h3>
            <p className="text-xs text-slate-300">
              Procuring for full residential floors or multi-apartment fit-outs? Get dedicated trade credit terms, tiered unit pricing, and a personal project dispatch manager.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 z-10 w-full sm:w-auto">
            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate('/bulk-orders')}
              className="font-bold text-xs"
            >
              Request Trade Pricing
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate('/account/projects')}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20 text-xs"
            >
              My Projects
            </Button>
          </div>
        </div>
      </section>

      {/* 9. CATEGORY SPOTLIGHT: STRUCTURAL CIVIL */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-100/80 rounded-3xl p-4 sm:p-8 border border-slate-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4 sm:mb-6">
            <div>
              <span className="text-xs font-bold text-brand-blue-700 uppercase tracking-wider">
                Structural &amp; Civil Infrastructure
              </span>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                Portland Pozzolana Cement, Mortar &amp; Admixtures
              </h3>
            </div>
            <Link
              to="/categories/cement-concrete"
              className="text-xs font-bold text-brand-blue-800 hover:underline"
            >
              Browse Category &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {civilSpotlight.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </div>
      </section>

      {/* 10. CATEGORY SPOTLIGHT: ELECTRICAL */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-100/80 rounded-3xl p-4 sm:p-8 border border-slate-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4 sm:mb-6">
            <div>
              <span className="text-xs font-bold text-brand-blue-700 uppercase tracking-wider">
                Electrical Infrastructure
              </span>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                FRLS Copper Wires, MCBs &amp; Modular Distribution
              </h3>
            </div>
            <Link
              to="/categories/wires-mcb-distribution-boards"
              className="text-xs font-bold text-brand-blue-800 hover:underline"
            >
              Browse Category &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {electricalSpotlight.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </div>
      </section>

      {/* 11. ESTIMATOR & COMMERCIAL BOQ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-gradient-to-br from-brand-blue-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-card relative overflow-hidden">
            <div className="space-y-3 z-10">
              <div className="w-10 h-10 rounded-xl bg-brand-orange-500 flex items-center justify-center text-white">
                <Calculator className="w-5 h-5" />
              </div>
              <h3 className="text-lg sm:text-2xl font-black">
                Civil Engineering Quantity Estimators
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md">
                Input room dimensions or roof area. Get instant calculations for cement bags, paint litres, floor tiles, waterproofing compound, and plywood sheets with direct "Add to Cart".
              </p>
            </div>
            <div className="pt-6 z-10">
              <Button
                variant="secondary"
                size="md"
                onClick={() => navigate('/tools/material-estimator')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                Launch Estimator Suite
              </Button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-card relative overflow-hidden">
            <div className="space-y-3 z-10">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg sm:text-2xl font-black">
                Commercial Projects &amp; BOQ Quotations
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md">
                Ordering full truckloads for towers, villas, or commercial fit-outs? Submit your material list for mill-direct pricing and dedicated logistics dispatch.
              </p>
            </div>
            <div className="pt-6 z-10">
              <Button
                variant="outline"
                size="md"
                onClick={() => navigate('/bulk-orders')}
                className="w-full sm:w-auto bg-white/10 text-white border-white/20 hover:bg-white/20"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Request Bulk Quotation
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 12. DIRECT AUTHORIZED BRANDS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-2xl font-black text-slate-900">Direct Authorized Brands</h2>
            <p className="text-xs text-slate-500">100% manufacturer guaranteed materials directly from tier-1 plants.</p>
          </div>
          <Link to="/brands" className="text-xs font-bold text-brand-blue-800 hover:underline">
            View All ({brands.length})
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 sm:gap-3">
          {brands.slice(0, 10).map((brand) => (
            <BrandCard key={brand.id} brand={brand} />
          ))}
        </div>
      </section>

      {/* 13. KNOWLEDGE HUB */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-2xl font-black text-slate-900">Knowledge Hub &amp; Construction Tips</h2>
            <p className="text-xs text-slate-500">Expert structural guidance, IS code standards, and renovation advice.</p>
          </div>
          <Link to="/knowledge-hub" className="text-xs font-bold text-brand-blue-800 hover:underline">
            Read Articles &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {SEED_KNOWLEDGE_ARTICLES.map((art) => (
            <Link
              key={art.id}
              to={`/knowledge-hub/${art.slug}`}
              className="group flex flex-col bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 shadow-card hover:shadow-card-hover transition-all overflow-hidden"
            >
              <div className="aspect-video bg-slate-100 overflow-hidden">
                <img
                  src={art.image}
                  alt={art.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
              <div className="p-4 flex flex-col flex-1 justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-orange-600">
                    {art.category}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-blue-800 mt-1 line-clamp-2">
                    {art.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">
                    {art.summary}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{art.readTimeMinutes} min read</span>
                  <span className="font-semibold text-brand-blue-800 group-hover:underline">Read Article &rarr;</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 14. CUSTOMER TESTIMONIALS */}
      <section className="bg-slate-100/80 py-8 sm:py-12 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-lg sm:text-2xl font-black text-slate-900">
              Trusted by 10,000+ Builders &amp; Site Engineers
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              See how BUILDORA 60 keeps construction projects running without site delays.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed italic">
                "Our tiling mason ran out of tile adhesive at 3 PM. Traditional suppliers asked for 2 days. Buildora 60 delivered 10 bags of Roff adhesive to our Indiranagar site in 48 minutes flat. Saved our daily labour cost!"
              </p>
              <div>
                <div className="text-xs font-bold text-slate-900">Kavita Narayanan</div>
                <div className="text-[11px] text-slate-400">Homeowner, Indiranagar, Bengaluru</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed italic">
                "As an electrical contractor managing 4 residential sites simultaneously, getting genuine Havells wires with instant B2B GST tax invoices directly to my phone is a game changer."
              </p>
              <div>
                <div className="text-xs font-bold text-slate-900">Ramesh Murthy</div>
                <div className="text-[11px] text-slate-400">Murthy Electricals &amp; Contractors</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed italic">
                "The material estimator tool is extremely accurate. It calculated my terrace waterproofing compound and cement requirements with zero wastage."
              </p>
              <div>
                <div className="text-xs font-bold text-slate-900">Deepak Shenoy</div>
                <div className="text-[11px] text-slate-400">Civil Project Consultant, Whitefield</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 15. MOBILE APP DOWNLOAD STRIP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-brand-blue-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-brand-orange-500/20 text-brand-orange-400 flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div>
              <h3 className="text-base sm:text-xl font-black">Download the BUILDORA 60 Contractor App</h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Track site deliveries live with vehicle GPS, manage multi-site projects, and repeat orders with 1-tap.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto justify-center">
            <span className="text-xs bg-white/10 border border-white/20 text-slate-300 px-3.5 py-2 rounded-xl font-bold">
              Android &bull; Coming Soon
            </span>
            <span className="text-xs bg-white/10 border border-white/20 text-slate-300 px-3.5 py-2 rounded-xl font-bold">
              iOS &bull; Coming Soon
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
