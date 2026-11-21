import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Rocket,
  ChevronRight,
  SlidersHorizontal,
  Search,
  RotateCcw,
  Sparkles,
  Zap,
  Star,
  CheckCircle2,
  Package,
  Layers,
  Box,
  Wrench,
  Feather,
  Columns,
  Compass,
  Coffee,
  BatteryCharging,
  Sun,
  ShieldCheck,
  Truck,
  ArrowRight
} from 'lucide-react';
import {
  NEW_LAUNCHES_CATEGORIES,
  MASTER_CATEGORIES,
  SEED_PRODUCTS
} from '@buildora/constants';
import { Product, NewLaunchCategory } from '@buildora/types';
import { api } from '../services/api';
import { ProductCard } from '../components/common/ProductCard';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'Layers': Layers,
  'Box': Box,
  'Wrench': Wrench,
  'Feather': Feather,
  'Columns': Columns,
  'Compass': Compass,
  'Coffee': Coffee,
  'BatteryCharging': BatteryCharging,
  'Sun': Sun
};

export const NewLaunchesPage: React.FC = () => {
  const { categorySlug, subcategorySlug } = useParams<{
    categorySlug?: string;
    subcategorySlug?: string;
  }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // State
  const [products, setProducts] = useState<Product[]>(SEED_PRODUCTS);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'latest');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [asapOnly, setAsapOnly] = useState(false);

  // Active category determination: either from route param (:categorySlug) or search param (?category=)
  const activeCategorySlug = categorySlug || searchParams.get('category') || 'all';

  // Find active New Launch Category object
  const activeCategory: NewLaunchCategory | undefined = useMemo(() => {
    if (activeCategorySlug === 'all') return undefined;
    return NEW_LAUNCHES_CATEGORIES.find(
      (c) => c.slug === activeCategorySlug || c.masterCategorySlug === activeCategorySlug
    );
  }, [activeCategorySlug]);

  // Find underlying master category to get dynamic child subcategories
  const activeMasterCategory = useMemo(() => {
    if (!activeCategory) return undefined;
    return MASTER_CATEGORIES.find((m) => m.slug === activeCategory.masterCategorySlug);
  }, [activeCategory]);

  // Active subcategory / child category
  const activeSubcategorySlug = subcategorySlug || searchParams.get('subcategory') || 'all';

  // Load products from API / fallback
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    api.getProducts().then((allProducts) => {
      if (isMounted) {
        if (allProducts && allProducts.length > 0) {
          setProducts(allProducts);
        }
        setIsLoading(false);
      }
    }).catch(() => {
      if (isMounted) setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter products for New Launches
  const newLaunchProducts = useMemo(() => {
    // 1. Base pool: products marked as isNewLaunch OR belonging to any New Launches category
    const validMasterSlugs = new Set(NEW_LAUNCHES_CATEGORIES.map((c) => c.masterCategorySlug));

    let pool = products.filter((p) => p.isNewLaunch || validMasterSlugs.has(p.categorySlug));

    // 2. Filter by Category
    if (activeCategory) {
      pool = pool.filter((p) => p.categorySlug === activeCategory.masterCategorySlug);
    }

    // 3. Filter by Child Subcategory
    if (activeSubcategorySlug !== 'all') {
      pool = pool.filter((p) => p.subcategorySlug === activeSubcategorySlug);
    }

    // 4. In Stock Filter
    if (inStockOnly) {
      pool = pool.filter((p) => p.inStock);
    }

    // 5. 60-Minute Fast Delivery Filter
    if (asapOnly) {
      pool = pool.filter((p) => p.deliverySpeedAvailable.includes('ASAP_60'));
    }

    // 6. Local Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      pool = pool.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.subcategory.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)
      );
    }

    // 7. Sorting
    const sorted = [...pool];
    if (sortBy === 'price_asc') {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      sorted.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      sorted.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'discount') {
      sorted.sort((a, b) => b.discount - a.discount);
    } else {
      // Latest arrivals first: priority to isNewLaunch, then id
      sorted.sort((a, b) => {
        if (a.isNewLaunch && !b.isNewLaunch) return -1;
        if (!a.isNewLaunch && b.isNewLaunch) return 1;
        return b.id.localeCompare(a.id);
      });
    }

    return sorted;
  }, [
    products,
    activeCategory,
    activeSubcategorySlug,
    inStockOnly,
    asapOnly,
    searchQuery,
    sortBy
  ]);

  const handleCategoryChange = (slug: string) => {
    if (slug === 'all') {
      navigate('/new-launches');
    } else {
      navigate(`/new-launches/${slug}`);
    }
  };

  const handleSubcategoryChange = (subSlug: string) => {
    if (!activeCategory) return;
    if (subSlug === 'all') {
      navigate(`/new-launches/${activeCategory.slug}`);
    } else {
      navigate(`/new-launches/${activeCategory.slug}/${subSlug}`);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSortBy('latest');
    setInStockOnly(false);
    setAsapOnly(false);
    navigate('/new-launches');
  };

  return (
    <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-in fade-in-0 duration-200">
      {/* 1. BREADCRUMBS NAVIGATION */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto no-scrollbar whitespace-nowrap">
        <Link to="/" className="hover:text-brand-blue-900 flex-shrink-0 transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <Link
          to="/new-launches"
          className={`flex-shrink-0 transition-colors ${
            !activeCategory ? 'font-bold text-brand-blue-900' : 'hover:text-brand-blue-900'
          }`}
        >
          New Launches
        </Link>

        {activeCategory && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <Link
              to={`/new-launches/${activeCategory.slug}`}
              className={`flex-shrink-0 transition-colors ${
                activeSubcategorySlug === 'all'
                  ? 'font-bold text-brand-blue-900'
                  : 'hover:text-brand-blue-900'
              }`}
            >
              {activeCategory.name}
            </Link>
          </>
        )}

        {activeCategory && activeSubcategorySlug !== 'all' && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="font-bold text-brand-orange-600 flex-shrink-0">
              {activeMasterCategory?.subcategories.find((s) => s.slug === activeSubcategorySlug)?.name ||
                activeSubcategorySlug}
            </span>
          </>
        )}
      </nav>

      {/* 2. HERO / HEADER BANNER */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-brand-blue-950 to-slate-900 text-white p-6 sm:p-10 shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-brand-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-brand-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-orange-500/20 border border-brand-orange-400/30 text-brand-orange-400 text-xs font-black tracking-wide">
            <Rocket className="w-3.5 h-3.5 animate-pulse" />
            <span>JUST INTRODUCED &bull; 60-MIN SITE DISPATCH</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
            {activeCategory ? activeCategory.name : 'New Launches'}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            {activeCategory
              ? activeCategory.description
              : 'Discover the latest additions to BUILDORA 60 — direct-from-mill construction supplies, heavy-duty architectural hardware, conduits, bath renovation fixtures, and smart site appliances.'}
          </p>

          <div className="flex items-center gap-4 pt-2 text-xs font-semibold text-slate-400 flex-wrap">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>100% Genuine Direct from Brand</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <Truck className="w-4 h-4 text-brand-orange-400" />
              <span>EV Mini-Truck Dispatch Across Bengaluru</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. NEW LAUNCHES SUBCATEGORY PILLS / CARDS (REFERENCE HOME-RUN TAXONOMY) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-orange-500" />
            <span>Curated Categories ({NEW_LAUNCHES_CATEGORIES.length})</span>
          </div>
          {activeCategorySlug !== 'all' && (
            <button
              type="button"
              onClick={() => handleCategoryChange('all')}
              className="text-xs font-bold text-brand-blue-900 hover:text-brand-orange-600 transition-colors"
            >
              Show All Categories
            </button>
          )}
        </div>

        {/* Horizontal Category Chips */}
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1 text-xs whitespace-nowrap">
          <button
            type="button"
            onClick={() => handleCategoryChange('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all flex-shrink-0 cursor-pointer ${
              activeCategorySlug === 'all'
                ? 'bg-brand-blue-900 text-white shadow-md'
                : 'bg-white text-slate-700 hover:text-brand-blue-900 hover:bg-slate-100 border border-slate-200 shadow-2xs'
            }`}
          >
            <Rocket className="w-3.5 h-3.5 text-brand-orange-400" />
            <span>All New Launches</span>
          </button>

          {NEW_LAUNCHES_CATEGORIES.map((cat) => {
            const isSelected = activeCategorySlug === cat.slug;
            const Icon = CATEGORY_ICONS[cat.icon] || Package;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.slug)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all flex-shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-brand-blue-900 text-white shadow-md font-black'
                    : 'bg-white text-slate-700 hover:text-brand-blue-900 hover:bg-slate-100 border border-slate-200 shadow-2xs'
                }`}
                title={cat.description}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-brand-orange-500'}`} />
                <span>{cat.name}</span>
                {cat.badge && (
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-orange-100 text-brand-orange-600'
                    }`}
                  >
                    {cat.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. DYNAMIC CHILD CATEGORIES (WHEN A CATEGORY IS SELECTED) */}
      {activeCategory && activeMasterCategory && activeMasterCategory.subcategories.length > 0 && (
        <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/80 space-y-2.5 animate-in fade-in-0 duration-150">
          <div className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>{activeCategory.name} &bull; Child Categories</span>
            <Link
              to={`/categories/${activeCategory.masterCategorySlug}`}
              className="text-[11px] text-brand-blue-900 font-bold hover:underline flex items-center gap-1"
            >
              <span>View Master Catalogue</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 text-xs whitespace-nowrap">
            <button
              type="button"
              onClick={() => handleSubcategoryChange('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubcategorySlug === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200'
              }`}
            >
              All {activeCategory.name}
            </button>

            {activeMasterCategory.subcategories.map((sub) => {
              const isSelected = activeSubcategorySlug === sub.slug;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => handleSubcategoryChange(sub.slug)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white font-bold shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200'
                  }`}
                >
                  {sub.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. SEARCH & CONTROLS TOOLBAR */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
        {/* Left: Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search within New Launches..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-brand-blue-500 focus:ring-1 focus:ring-brand-blue-500 bg-slate-50/50"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Right: Quick Toggles & Sort Dropdown */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* In-Stock Toggle */}
          <button
            type="button"
            onClick={() => setInStockOnly(!inStockOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              inStockOnly
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            ⚡ In-Stock Only
          </button>

          {/* 60-min delivery toggle */}
          <button
            type="button"
            onClick={() => setAsapOnly(!asapOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              asapOnly
                ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-2xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            🚚 60-Min Express
          </button>

          {/* Sort selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="py-2 px-3 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-blue-500 cursor-pointer"
          >
            <option value="latest">Latest Arrivals (Newest)</option>
            <option value="rating">Customer Rating (Highest)</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="discount">Biggest Discounts</option>
          </select>

          {/* Clear Filters */}
          {(searchQuery || inStockOnly || asapOnly || sortBy !== 'latest' || activeCategorySlug !== 'all') && (
            <button
              type="button"
              onClick={resetFilters}
              className="p-2 text-slate-500 hover:text-brand-orange-600 transition-colors cursor-pointer"
              title="Reset all filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 6. PRODUCTS LISTING GRID */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="font-bold text-slate-800">
            Showing <span className="text-brand-orange-600 font-black">{newLaunchProducts.length}</span> Materials
            {activeCategory && ` in ${activeCategory.name}`}
          </div>
          <div className="text-[11px] text-slate-400">
            Real-time inventory dispatched from Indiranagar, Koramangala &amp; Rajajinagar dark stores
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-slate-200 p-4 h-72 animate-pulse space-y-3">
                <div className="bg-slate-100 rounded-xl h-36 w-full" />
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
                <div className="h-8 bg-slate-100 rounded w-full mt-4" />
              </div>
            ))}
          </div>
        ) : newLaunchProducts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 max-w-xl mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-brand-orange-50 text-brand-orange-600 flex items-center justify-center mx-auto">
              <Rocket className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900">No products match your criteria</h3>
              <p className="text-xs text-slate-500">
                Try resetting your filters or search terms to explore all newly launched construction materials.
              </p>
            </div>
            <button
              type="button"
              onClick={resetFilters}
              className="px-5 py-2.5 bg-brand-blue-900 hover:bg-brand-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              Reset Filters &amp; View All
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {newLaunchProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* 7. QUALITY ASSURANCE & DISPATCH BANNER */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-card">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-brand-orange-400 flex-shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-white">60-Minute Site Delivery</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Dispatched from 5 hyper-local dark stores across Bengaluru with real-time GPS tracking.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-white">100% Genuine Materials</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Direct-from-mill authorized sourcing with test certificates and manufacturer warranty.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-sky-400 flex-shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-white">Instant B2B GST Invoicing</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Automated 18% &amp; 28% Input Tax Credit (ITC) tax invoices generated instantly upon dispatch.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
