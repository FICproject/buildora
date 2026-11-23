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
  FileText,
  Home
} from 'lucide-react';
import {
  MASTER_CATEGORIES,
  SEED_PRODUCTS,
  SEED_KNOWLEDGE_ARTICLES
} from '@buildora/constants';
import { Category, Product } from '@buildora/types';
import { api } from '../services/api';
import { ProductCard } from '../components/common/ProductCard';
import { CategoryCard } from '../components/common/CategoryCard';
import { Button } from '../components/ui/Button';
import { HeroCarousel } from '../components/common/HeroCarousel';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  // Dynamic live backend state initialized with defaults
  const [products, setProducts] = useState<Product[]>(SEED_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(MASTER_CATEGORIES);

  // Fetch real data from Backend API on mount
  useEffect(() => {
    let isMounted = true;
    api.getProducts().then((p) => {
      if (isMounted && p && p.length > 0) setProducts(p);
    });
    api.getCategories().then((c) => {
      if (isMounted && c && c.length > 0) setCategories(c);
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
      {/* 1. HERO BANNER SECTION - BALANCED SPACING & 4-CORNER ROUNDED CARD */}
      <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <section className="relative bg-gradient-to-br from-brand-blue-950 via-brand-blue-900 to-slate-900 text-white rounded-3xl sm:rounded-[2rem] overflow-hidden shadow-xl border border-brand-blue-800/40 py-6 sm:py-8 lg:py-10 xl:py-12 px-6 sm:px-10 lg:px-12 xl:px-16">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#f97316_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          <div className="relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-14 items-center">
              {/* Left Column: Headlines & CTAs */}
              <div className="lg:col-span-7 space-y-3 sm:space-y-4 lg:space-y-5">
                <div className="inline-flex items-center gap-2 bg-brand-orange-500/20 border border-brand-orange-500/40 text-brand-orange-300 text-[11px] sm:text-xs font-black px-3 py-1 rounded-full backdrop-blur-sm">
                  <Zap className="w-3.5 h-3.5 fill-current text-brand-orange-400 animate-pulse" />
                  <span>60-MINUTE CONSTRUCTION QUICK-COMMERCE</span>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black tracking-tight leading-tight">
                  BUILD SMART. <br className="hidden sm:inline" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-brand-orange-400 to-orange-500">
                    DELIVER FAST.
                  </span>
                </h1>

                <p className="text-slate-300 text-xs sm:text-sm lg:text-[14px] xl:text-base max-w-xl leading-relaxed">
                  Direct-from-mill construction materials dispatched to your job site in as fast as 60 minutes.
                  UltraTech cement, Astral CPVC, Havells wires, Greenply marine boards, and Bosch power tools with instant B2B GST ITC invoices.
                </p>

                {/* Action CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-1 sm:pt-2">
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => navigate('/products')}
                    className="w-full sm:w-auto font-black shadow-lg px-6 py-2.5 bg-brand-orange-500 hover:bg-brand-orange-600 text-white text-xs sm:text-sm"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Order Materials
                  </Button>

                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => navigate('/tools/material-estimator')}
                    className="w-full sm:w-auto bg-white/10 text-white border-white/20 hover:bg-white/20 font-bold px-5 py-2.5 text-xs sm:text-sm"
                    leftIcon={<Calculator className="w-4 h-4 text-brand-orange-400" />}
                  >
                    Material Estimator
                  </Button>

                  <Link
                    to="/tools/home-construction-calculator"
                    className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-amber-300 hover:text-white px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 transition-all shadow-xs"
                  >
                    <Calculator className="w-4 h-4 text-brand-orange-400" />
                    <span>Home Construction Calculator &rarr;</span>
                  </Link>
                </div>

                {/* Trust Indicators */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-white/10 text-xs text-slate-300">
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

              {/* Right Column: Premium Animated Hero Carousel */}
              <div className="lg:col-span-5 relative mt-3 sm:mt-5 lg:mt-0 w-full max-w-full">
                <HeroCarousel />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 2. TOP DEALS OF THE DAY */}
      <section className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
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

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4">
            {dealsOfTheDay.slice(0, 6).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* 5. SHOP BY 28 MASTER CATEGORIES */}
      <section className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 space-y-4 sm:space-y-6">
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
      <section className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 space-y-4 sm:space-y-6">
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

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4">
          {newArrivals.slice(0, 6).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 7. CONTRACTOR BEST SELLERS SECTION */}
      <section className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 space-y-4 sm:space-y-6">
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

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4">
          {bestSellers.slice(0, 6).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 8. PROMOTIONAL BANNER: HOME CONSTRUCTION CALCULATOR */}
      <section className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="bg-gradient-to-r from-brand-blue-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xl relative overflow-hidden border border-brand-orange-500/20">
          <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-brand-orange-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative z-10">
            <div className="space-y-4 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 bg-brand-orange-500 text-white text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                <Sparkles className="w-3.5 h-3.5" /> SMART CONSTRUCTION PLANNING
              </span>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
                Plan Your Dream Home. Know Your Budget.
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                Estimate your home construction cost, material quantities, labour expenses and category-wise budget before starting construction.
              </p>

              {/* Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs text-slate-300">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-orange-400 flex-shrink-0" />
                  <span>Instant Cost &amp; Qty</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-orange-400 flex-shrink-0" />
                  <span>Basic/Std/Premium</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-orange-400 flex-shrink-0" />
                  <span>13 Categories</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-orange-400 flex-shrink-0" />
                  <span>Download PDF</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/tools/home-construction-calculator')}
                className="font-black text-xs sm:text-sm px-6 py-3 bg-brand-orange-500 hover:bg-brand-orange-600 text-white shadow-lg shadow-orange-500/25"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Calculate Construction Cost
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/products')}
                className="bg-white/10 text-white border-white/20 hover:bg-white/20 text-xs sm:text-sm font-bold px-5 py-3"
              >
                Explore Materials
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 9. CATEGORY SPOTLIGHT: STRUCTURAL CIVIL */}
      <section className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
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

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4">
            {civilSpotlight.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </div>
      </section>

      {/* 9. CATEGORY SPOTLIGHT: ELECTRICAL */}
      <section className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
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

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4">
            {electricalSpotlight.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </div>
      </section>

      {/* 10. ESTIMATOR & HOME CONSTRUCTION CALCULATOR */}
      <section className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
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
                className="w-full sm:w-auto font-bold"
              >
                Launch Estimator Suite
              </Button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-card relative overflow-hidden border border-white/10">
            <div className="space-y-3 z-10">
              <div className="w-10 h-10 rounded-xl bg-brand-orange-500 flex items-center justify-center text-white">
                <Home className="w-5 h-5" />
              </div>
              <h3 className="text-lg sm:text-2xl font-black">
                Home Construction Calculator
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md">
                Planning to build an independent house, villa, or floors? Calculate total estimated cost, stage-wise budget, cement bags, steel tonnage, and add matching catalog materials to cart.
              </p>
            </div>
            <div className="pt-6 z-10">
              <Button
                variant="secondary"
                size="md"
                onClick={() => navigate('/tools/home-construction-calculator')}
                className="w-full sm:w-auto font-bold"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Calculate Construction Cost
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 12. KNOWLEDGE HUB */}
      <section className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 space-y-4 sm:space-y-6">
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

      {/* 13. CUSTOMER TESTIMONIALS */}
      <section className="bg-slate-100/80 py-8 sm:py-12 border-y border-slate-200">
        <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 space-y-6">
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

      {/* 14. MOBILE APP DOWNLOAD STRIP */}
      <section className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
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
