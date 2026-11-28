import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  MapPin,
  ShoppingCart,
  Heart,
  User,
  Menu,
  X,
  Zap,
  ChevronDown,
  ChevronRight,
  Truck,
  PhoneCall,
  Clock,
  Sparkles,
  ArrowRight,
  Building2,
  Compass,
  Wrench,
  Layers,
  Wallet,
  ShieldCheck,
  Award,
  Home,
  Rocket
} from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import { useLocationStore } from '../../store/useLocationStore';
import { useWishlistStore } from '../../store/useWishlistStore';
import { useAuthStore } from '../../store/useAuthStore';
import {
  MASTER_CATEGORIES,
  CONSTRUCTION_DEPARTMENTS,
  SUPPLIED_NEW_LAUNCH_DEFINITIONS,
  MAIN_CATEGORIES_SEED,
  PRODUCT_TYPES_SEED,
  LEGACY_CATEGORY_SLUG_ALIASES
} from '@buildora/constants';
import { Category, MainCategory, DesktopNavItem } from '@buildora/types';
import { api } from '../../services/api';
import { formatCurrency } from '@buildora/utils';
import { formatLocationDisplay } from '../../utils';
import { LocationModal } from './LocationModal';
import { CartDrawer } from './CartDrawer';
import { SmartSearchBar } from './SmartSearchBar';
import { NotificationPopover } from './NotificationPopover';

const DEPARTMENT_ICONS: Record<string, React.ElementType> = {
  'civil-interiors': Building2,
  'furniture-hardware': Layers,
  'electrical': Zap,
  'plumbing-sanitary': Compass,
  'hardware-appliances': Wrench
};

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Stores
  const { getSummary } = useCartStore();
  const summary = getSummary();
  const { pincode, locality, cityName, isServiceable, etaMinutes, etaText, selectedAddressLabel, selectedAddressFull, openLocationModal } = useLocationStore();
  const { items: wishlistItems } = useWishlistStore();
  const { isAuthenticated, user, logout, openAuthModal } = useAuthStore();

  // Modals & Drawers state
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Active mega menu department dropdown & click-selected category state
  const [activeDepartment, setActiveDepartment] = useState<string | null>(null);
  const [selectedParentCategorySlug, setSelectedParentCategorySlug] = useState<string | null>(null);
  const [isAllCategoriesOpen, setIsAllCategoriesOpen] = useState(false);

  // Live navigation sections & Desktop Navigation items (100% backend-driven)
  const [mainCategories, setMainCategories] = useState<MainCategory[]>(MAIN_CATEGORIES_SEED);
  const [desktopNavigation, setDesktopNavigation] = useState<DesktopNavItem[]>([]);
  const [navigationSections, setNavigationSections] = useState<any[]>([]);
  const [catalogCategories, setCatalogCategories] = useState<Category[]>(MASTER_CATEGORIES);
  const [newLaunchCollections, setNewLaunchCollections] = useState<any[]>([]);
  const [hasLoadedTaxonomy, setHasLoadedTaxonomy] = useState(false);

  // Mobile navigation accordion state
  const [mobileExpandedDept, setMobileExpandedDept] = useState<string | null>(null);
  const [mobileExpandedCat, setMobileExpandedCat] = useState<string | null>(null);

  const headerContainerRef = useRef<HTMLElement>(null);
  const megaMenuRef = useRef<HTMLDivElement>(null);

  // Load live backend taxonomy + desktop navigation (syncs automatically on Admin publish or focus)
  useEffect(() => {
    let active = true;
    const fetchHeaderCatalog = async () => {
      try {
        const [taxonomy, cats] = await Promise.all([
          api.getTaxonomy(),
          api.getCategories()
        ]);
        if (!active) return;

        if (Array.isArray(taxonomy?.mainCategories)) {
          setMainCategories(taxonomy.mainCategories);
        }

        if (Array.isArray(taxonomy?.desktopNavigation)) {
          setDesktopNavigation(taxonomy.desktopNavigation);
        }

        if (Array.isArray(taxonomy?.navigationSections)) {
          setNavigationSections(taxonomy.navigationSections);
        }

        if (Array.isArray(taxonomy?.newLaunchCollections)) {
          setNewLaunchCollections(taxonomy.newLaunchCollections);
        }
        setHasLoadedTaxonomy(true);

        if (Array.isArray(taxonomy?.childCategories)) {
          const typePool = Array.isArray(taxonomy.productTypes) ? taxonomy.productTypes : PRODUCT_TYPES_SEED;
          const hydratedMainCategories: Category[] = taxonomy.childCategories
            .filter((child: any) => child.isActive !== false)
            .sort((a: any, b: any) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
            .map((child: any) => {
              const masterMatch = (cats || MASTER_CATEGORIES).find((m) => m.slug === child.slug || m.id === child.id) as any;
              const pts = typePool
                .filter((pt: any) => (pt.childCategoryId === child.id || pt.childCategorySlug === child.slug) && pt.isActive !== false)
                .sort((a: any, b: any) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
              return {
                ...(masterMatch || {}),
                id: child.id,
                name: child.name,
                slug: child.slug,
                description: child.description || masterMatch?.description || '',
                image: child.image || masterMatch?.image || '',
                department: child.mainCategoryName || masterMatch?.department,
                departmentSlug: child.mainCategorySlug || masterMatch?.departmentSlug,
                mainCategoryId: child.mainCategoryId,
                mainCategorySlug: child.mainCategorySlug,
                productCount: child.productCount ?? masterMatch?.productCount,
                subcategories: pts.length > 0 ? pts : masterMatch?.subcategories || [],
              } as any;
            });
          setCatalogCategories(hydratedMainCategories);
        } else if (cats && cats.length > 0) {
          setCatalogCategories(cats);
        }
      } catch {
        // Fallback to seed taxonomy cleanly
      }
    };
    void fetchHeaderCatalog();

    const onRealtimeCatalog = () => {
      void fetchHeaderCatalog();
    };
    const onFocusRefresh = () => {
      if (document.visibilityState === 'visible') void fetchHeaderCatalog();
    };
    window.addEventListener('buildora:realtime:catalog', onRealtimeCatalog);
    window.addEventListener('focus', onRealtimeCatalog);
    document.addEventListener('visibilitychange', onFocusRefresh);
    const syncTimer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void fetchHeaderCatalog();
      }
    }, 15000);
    return () => {
      active = false;
      window.clearInterval(syncTimer);
      window.removeEventListener('buildora:realtime:catalog', onRealtimeCatalog);
      window.removeEventListener('focus', onRealtimeCatalog);
      document.removeEventListener('visibilitychange', onFocusRefresh);
    };
  }, []);

  const visibleMainCategories = React.useMemo(() => {
    const source = hasLoadedTaxonomy ? mainCategories : MAIN_CATEGORIES_SEED;
    return [...source]
      .filter((m) => m.isActive !== false && m.showInNavigation !== false)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }, [hasLoadedTaxonomy, mainCategories]);

  const visibleDesktopNavigation = React.useMemo(() => {
    if (hasLoadedTaxonomy) {
      return [...desktopNavigation]
        .filter((nav) => nav.isActive !== false && nav.isVisible !== false)
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    }
    return [
      { id: 'nav-home', label: 'Home', slug: 'home', itemType: 'HOME', route: '/', hasDropdown: false, displayOrder: 1, isVisible: true, isActive: true },
      ...visibleMainCategories.map((mc, idx) => ({
        id: `nav-${mc.id}`,
        label: mc.name,
        slug: mc.slug,
        itemType: 'MAIN_CATEGORY',
        mainCategoryId: mc.id,
        mainCategorySlug: mc.slug,
        route: `/categories/${mc.slug}`,
        hasDropdown: true,
        displayOrder: idx + 2,
        isVisible: true,
        isActive: true,
      })),
      { id: 'nav-new-launches', label: 'New Launches', slug: 'new-launches', itemType: 'NEW_LAUNCHES', route: '/new-launches', hasDropdown: true, displayOrder: 98, isVisible: true, isActive: true },
      { id: 'nav-deals', label: 'Deals', slug: 'deals', itemType: 'DEALS', route: '/deals', hasDropdown: false, highlight: true, displayOrder: 99, isVisible: true, isActive: true },
    ] as DesktopNavItem[];
  }, [hasLoadedTaxonomy, desktopNavigation, visibleMainCategories]);

  // Live Admin-published New Launches promotional collections
  const liveNewLaunchCollections = React.useMemo(() => {
    const source = hasLoadedTaxonomy
      ? newLaunchCollections
      : SUPPLIED_NEW_LAUNCH_DEFINITIONS.map((d) => ({
          id: d.id,
          title: d.title,
          name: d.title,
          slug: d.slug,
          displayOrder: d.displayOrder,
          isActive: true,
          publishStatus: 'PUBLISHED',
          categoryMappings: [],
        }));
    return [...source]
      .filter((c) => c && c.isActive !== false && c.publishStatus !== 'DRAFT')
      .sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0))
      .map((c) => ({
        ...c,
        name: c.title || c.name || c.slug,
      }));
  }, [hasLoadedTaxonomy, newLaunchCollections]);

  // Helper to get Main Categories (previously Child Categories) under a top-bar section
  const getMainChildCategories = (deptSlug: string) => {
    const navSec = navigationSections.find((s) => s.slug === deptSlug);
    if (navSec && Array.isArray(navSec.mainCategories) && navSec.mainCategories.length > 0) {
      return navSec.mainCategories.map((mc: any) => ({
        ...mc,
        subcategories: mc.childCategories || mc.subcategories || [],
      }));
    }
    const deptFallback = CONSTRUCTION_DEPARTMENTS.find((d) => d.slug === deptSlug);
    const source = catalogCategories.length > 0 ? catalogCategories : MASTER_CATEGORIES;
    return source.filter((c: any) => {
      const mSlug = c.mainCategorySlug || c.departmentSlug;
      if (mSlug) return mSlug === deptSlug;
      return deptFallback ? deptFallback.categorySlugs.includes(c.slug) : false;
    });
  };

  // Click-controlled mega menu toggle (no hover-triggered opening)
  const handleToggleDepartment = (deptSlug: string) => {
    if (activeDepartment === deptSlug) {
      setActiveDepartment(null);
      return;
    }
    setActiveDepartment(deptSlug);
    const isNL = deptSlug === 'new-launches';
    const cats = isNL ? liveNewLaunchCollections : getMainChildCategories(deptSlug);
    setSelectedParentCategorySlug(cats[0]?.slug || 'all');
  };

  // Close menus on route change, outside click, or escape
  useEffect(() => {
    setActiveDepartment(null);
    setIsMobileMenuOpen(false);
    setMobileExpandedDept(null);
    setMobileExpandedCat(null);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerContainerRef.current && !headerContainerRef.current.contains(event.target as Node)) {
        setActiveDepartment(null);
        setIsAllCategoriesOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveDepartment(null);
        setIsAllCategoriesOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleWalletClick = () => {
    if (isAuthenticated) {
      navigate('/account/wallet');
    } else {
      openAuthModal('/account/wallet', 'Sign in to access your Buildora Cash Wallet and promotional cashbacks.');
    }
  };

  const handleWishlistClick = () => {
    if (isAuthenticated) {
      navigate('/wishlist');
    } else {
      openAuthModal('/wishlist', 'Sign in to view and sync your saved Wishlist.');
    }
  };

  const getDepartmentCategories = (deptSlug: string) => getMainChildCategories(deptSlug);

  const getLocationDisplaySubtitle = () => {
    if (selectedAddressLabel && pincode) {
      const loc = locality ? locality.split(/[/,]/)[0].trim() : (cityName || 'Bengaluru');
      return `${selectedAddressLabel} - ${loc}, ${pincode}`;
    }
    if (selectedAddressFull) {
      return selectedAddressFull;
    }
    if (pincode) {
      const loc = locality ? locality.split(/[/,]/)[0].trim() : (cityName || 'Bengaluru Urban');
      return `${pincode} - ${loc}`;
    }
    return 'Enter Pincode';
  };

  const getLocationDisplayETA = () => {
    if (pincode && !isServiceable) {
      return 'Check Serviceability';
    }
    if (!pincode && !selectedAddressFull) {
      return 'Check Delivery Time';
    }
    return etaMinutes > 0 ? `${etaMinutes} mins` : '60 mins';
  };

  // Single-active navigation resolution (strictly at most ONE item highlighted at any time)
  const routeActiveNavKey = React.useMemo<string | null>(() => {
    const pathname = location.pathname;
    if (pathname === '/') return 'home';
    if (pathname.startsWith('/new-launches')) return 'new-launches';
    if (pathname.startsWith('/deals') || pathname.startsWith('/offers')) return 'deals';

    // Determine category slug from /categories/:slug/* or /products?category=...
    let rawCatSlug: string | null = null;
    if (pathname.startsWith('/categories/')) {
      rawCatSlug = pathname.split('/')[2] || null;
    } else if (pathname === '/products') {
      rawCatSlug = new URLSearchParams(location.search).get('category');
    }

    if (rawCatSlug) {
      const lowerRaw = rawCatSlug.toLowerCase();
      const canonicalSlug = (LEGACY_CATEGORY_SLUG_ALIASES[lowerRaw] || lowerRaw).toLowerCase();

      // Pass 1: exact match on a Main Category / top-level Desktop Nav item
      for (const nav of visibleDesktopNavigation) {
        if (nav.itemType === 'HOME' || nav.itemType === 'NEW_LAUNCHES' || nav.itemType === 'DEALS') continue;
        const targetSlug = (nav.mainCategorySlug || nav.slug || '').toLowerCase();
        if (targetSlug === canonicalSlug || targetSlug === lowerRaw) {
          return nav.mainCategorySlug || nav.slug;
        }
      }

      // Pass 2: match a Child Category belonging to a top-level Desktop Nav section
      for (const nav of visibleDesktopNavigation) {
        if (nav.itemType === 'HOME' || nav.itemType === 'NEW_LAUNCHES' || nav.itemType === 'DEALS') continue;
        const key = nav.mainCategorySlug || nav.slug;
        const children = getMainChildCategories(key);
        const fallbackDept = CONSTRUCTION_DEPARTMENTS.find((d) => d.slug === key);
        if (
          children.some(
            (c: any) =>
              String(c.slug || '').toLowerCase() === canonicalSlug ||
              String(c.id || '').toLowerCase() === lowerRaw
          ) ||
          Boolean(fallbackDept?.categorySlugs?.some((s) => s.toLowerCase() === canonicalSlug))
        ) {
          return key;
        }
      }
    }

    return null;
  }, [location.pathname, location.search, visibleDesktopNavigation, navigationSections, catalogCategories]);

  // When a mega-menu dropdown is open, ONLY that clicked dropdown item stays highlighted;
  // when closed, ONLY the routeActiveNavKey (e.g. Home on '/') is highlighted.
  const highlightedNavKey = activeDepartment || routeActiveNavKey;
  const isHomeActive = highlightedNavKey === 'home';
  const isNewLaunchesActive = highlightedNavKey === 'new-launches';
  const isDealsActive = highlightedNavKey === 'deals';
  const isRouteHomeActive = routeActiveNavKey === 'home';
  const isRouteNewLaunchesActive = routeActiveNavKey === 'new-launches';
  const isRouteDealsActive = routeActiveNavKey === 'deals';

  const isDeptActive = (dept: { slug: string }) => highlightedNavKey === dept.slug;
  const isRouteDeptActive = (dept: { slug: string }) => routeActiveNavKey === dept.slug;

  return (
    <>
      <header ref={headerContainerRef} className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm transition-all duration-200">
        {/* MAIN HEADER ROW (Compact Vertical Height, Full Screen Width) */}
        <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-1.5 lg:py-2">
          {/* A. DESKTOP LAYOUT (lg & above)
              3 CLEAR SECTIONS: [Brand & Location] → [Flexible Center Search] → [User Actions]
          */}
          <div className="hidden lg:flex items-center justify-between gap-4 xl:gap-6">
            {/* 1. LEFT SECTION — Brand & Location */}
            <div
              onClick={openLocationModal}
              className="flex items-center gap-2.5 p-1 -ml-1 rounded-xl hover:bg-slate-50 transition-all cursor-pointer flex-shrink-0 group select-none"
              title="Click to check pincode or select delivery address"
            >
              <div className="w-8 h-8 rounded-lg bg-brand-blue-900 flex items-center justify-center text-white font-black text-base shadow-sm group-hover:bg-brand-orange-500 transition-colors flex-shrink-0">
                B
              </div>
              <div className="flex flex-col text-left leading-none">
                <span className="font-black text-base xl:text-lg tracking-tight text-slate-900 leading-none">
                  BUILDORA <span className="text-brand-orange-500">60</span>
                </span>
                <div className="flex items-center gap-1 text-[11px] font-black text-slate-900 group-hover:text-brand-blue-900 transition-colors mt-0.5">
                  <span>{getLocationDisplayETA()}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-brand-blue-600 transition-all" />
                </div>
                <span className="text-[10px] text-slate-500 font-medium truncate max-w-[175px] xl:max-w-[215px] leading-tight">
                  {getLocationDisplaySubtitle()}
                </span>
              </div>
            </div>

            {/* 2. CENTER SECTION — Expanded Flexible Search Bar */}
            <div className="flex-1 min-w-0 mx-2 xl:mx-4">
              <SmartSearchBar />
            </div>

            {/* 3. RIGHT SECTION — User Actions (Order: Profile → Wishlist → Notifications → Wallet → Cart) */}
            <div className="flex-shrink-0 flex items-center gap-1.5 xl:gap-2">
              {/* 1. Profile / Account */}
              {isAuthenticated && user ? (
                <Link
                  to="/account"
                  className="h-9 flex items-center gap-1.5 px-2.5 rounded-xl border border-slate-200 hover:border-brand-blue-400 hover:bg-slate-50 text-xs font-bold text-slate-800 bg-white shadow-2xs hover:shadow-xs transition-all flex-shrink-0"
                  title="My Account Dashboard"
                >
                  <div className="w-6 h-6 rounded-md bg-brand-blue-900 text-white flex items-center justify-center font-black text-[11px] shadow-xs flex-shrink-0">
                    {user.name ? user.name.charAt(0) : 'U'}
                  </div>
                  <span className="hidden xl:inline truncate max-w-[90px] xl:max-w-[110px] text-xs font-bold text-slate-800">
                    {user.name ? user.name.split(' ')[0] : (user.phone || 'Account')}
                  </span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuthModal(undefined, 'Sign in to access your Buildora account and saved details.')}
                  className="h-9 flex items-center gap-1.5 px-2.5 xl:px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 transition-colors shadow-2xs flex-shrink-0 cursor-pointer"
                  title="Sign In to Account"
                >
                  <User className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                  <span className="font-bold">Sign In</span>
                </button>
              )}

              {/* 2. Wishlist */}
              <button
                type="button"
                onClick={handleWishlistClick}
                className="h-9 w-9 relative rounded-xl text-slate-700 hover:text-brand-blue-900 hover:bg-slate-100 transition-colors flex items-center justify-center flex-shrink-0 cursor-pointer"
                title={isAuthenticated ? 'View Saved Materials (Wishlist)' : 'Sign In to View Wishlist'}
              >
                <Heart className="w-[18px] h-[18px]" />
                {wishlistItems.length > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-xs">
                    {wishlistItems.length}
                  </span>
                )}
              </button>

              {/* 3. Notifications */}
              <div className="flex-shrink-0">
                <NotificationPopover />
              </div>

              {/* 4. Wallet */}
              <button
                type="button"
                onClick={handleWalletClick}
                className="h-9 flex items-center gap-1.5 px-2.5 rounded-xl border border-slate-200 hover:border-emerald-400 bg-white hover:bg-emerald-50/40 text-xs font-bold text-slate-800 transition-all shadow-2xs hover:shadow-xs flex-shrink-0 cursor-pointer"
                title={isAuthenticated ? 'Buildora Wallet Balance' : 'Sign in to access Buildora Cash'}
              >
                <Wallet className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                {isAuthenticated && user ? (
                  <span className="text-emerald-700 font-extrabold truncate max-w-[85px]">
                    {formatCurrency(user.walletBalance)}
                  </span>
                ) : (
                  <span className="text-slate-700">Wallet</span>
                )}
              </button>

              {/* 5. Cart */}
              <Link
                to="/cart"
                className="h-9 flex items-center gap-1.5 bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-black px-3 xl:px-3.5 rounded-xl shadow-xs hover:shadow-md transition-all flex-shrink-0"
                title="View Shopping Cart"
              >
                <ShoppingCart className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-xs font-black tracking-tight whitespace-nowrap">
                  Cart ({summary.itemCount})
                </span>
              </Link>
            </div>
          </div>

          {/* B. TABLET LAYOUT (md: 768px - 1023px) */}
          <div className="hidden md:flex lg:hidden flex-col gap-2.5">
            <div className="flex items-center justify-between gap-3">
              {/* Tablet Logo & Location Block (HomeRun Reference Stack) */}
              <div
                onClick={openLocationModal}
                className="flex items-center gap-2.5 p-1 -ml-1 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer flex-shrink-0 group select-none"
                title="Click to check pincode or select delivery address"
              >
                <div className="w-9 h-9 rounded-xl bg-brand-blue-900 flex items-center justify-center text-white font-black text-base shadow-sm group-hover:bg-brand-orange-500 transition-colors flex-shrink-0">
                  B
                </div>
                <div className="flex flex-col text-left leading-none">
                  <span className="font-black text-base tracking-tight text-slate-900 leading-none">
                    BUILDORA <span className="text-brand-orange-500">60</span>
                  </span>
                  <div className="flex items-center gap-1 text-[11px] font-black text-slate-900 group-hover:text-brand-blue-900 transition-colors mt-1">
                    <span>{getLocationDisplayETA()}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-brand-blue-600 transition-transform" />
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium truncate max-w-[150px] leading-tight mt-0.5">
                    {getLocationDisplaySubtitle()}
                  </span>
                </div>
              </div>

              {/* Tablet Actions Group */}
              <div className="flex items-center gap-1.5">
                {/* Account */}
                {isAuthenticated && user ? (
                  <Link
                    to="/account"
                    className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center gap-1"
                    title="Account"
                  >
                    <User className="w-4 h-4 text-brand-blue-900" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => openAuthModal(undefined, 'Sign in to access your Buildora account and saved details.')}
                    className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                    title="Sign In"
                  >
                    <User className="w-4 h-4" />
                  </button>
                )}

                {/* Wishlist */}
                <button
                  type="button"
                  onClick={handleWishlistClick}
                  className="relative p-2 rounded-xl text-slate-700 hover:bg-slate-100 cursor-pointer"
                  title={isAuthenticated ? 'Wishlist' : 'Sign In for Wishlist'}
                >
                  <Heart className="w-4 h-4" />
                  {wishlistItems.length > 0 && (
                    <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                      {wishlistItems.length}
                    </span>
                  )}
                </button>

                {/* Notifications */}
                <NotificationPopover />

                {/* Wallet */}
                <button
                  type="button"
                  onClick={handleWalletClick}
                  className="p-2 rounded-xl text-emerald-700 hover:bg-emerald-50"
                  title="Wallet"
                >
                  <Wallet className="w-4 h-4" />
                </button>

                {/* Cart - Product Count Only & Direct Navigation */}
                <Link
                  to="/cart"
                  className="flex items-center gap-1.5 bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-bold py-1.5 px-3 rounded-xl text-xs shadow-sm"
                  title="Shopping Cart"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Cart ({summary.itemCount})</span>
                </Link>

                {/* Hamburger */}
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 rounded-xl text-slate-700 hover:bg-slate-100"
                  aria-label="Navigation Menu"
                >
                  {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Tablet Row 2: Search Bar */}
            <div className="w-full">
              <SmartSearchBar />
            </div>
          </div>

          {/* C. MOBILE LAYOUT (< 768px: 320px - 767px)
              Row 1: Menu + Brand & Location Stack + Right Actions (Wallet, Wishlist, Notifications, Cart)
              Row 2: Clean, Full-Width Smart Search Bar
          */}
          <div className="flex md:hidden flex-col gap-2">
            {/* Mobile Row 1: Menu + Brand Logo & Location Stack + Right Actions */}
            <div className="flex items-center justify-between gap-1.5 min-h-[44px]">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-1.5 -ml-1 rounded-xl text-slate-700 hover:bg-slate-100 min-w-[36px] min-h-[36px] flex items-center justify-center flex-shrink-0"
                  aria-label="Open Navigation Menu"
                >
                  {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>

                <div
                  onClick={openLocationModal}
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-50 cursor-pointer min-w-0 flex-1 group select-none"
                  title="Click to check pincode or select delivery address"
                >
                  <div className="w-8 h-8 rounded-lg bg-brand-blue-900 flex items-center justify-center text-white font-black text-sm shadow-xs flex-shrink-0">
                    B
                  </div>
                  <div className="flex flex-col text-left leading-none min-w-0">
                    <span className="font-black text-sm tracking-tight text-slate-900 leading-none truncate">
                      BUILDORA <span className="text-brand-orange-500">60</span>
                    </span>
                    <div className="flex items-center gap-0.5 text-[10.5px] font-black text-slate-900 mt-1">
                      <span>{getLocationDisplayETA()}</span>
                      <ChevronDown className="w-2.5 h-2.5 text-slate-400 group-hover:text-brand-blue-600 transition-transform flex-shrink-0" />
                    </div>
                    <span className="text-[9.5px] text-slate-500 font-medium truncate max-w-[125px] leading-tight mt-0.5">
                      {getLocationDisplaySubtitle()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Wallet Button (visible >= 375px; also inside mobile drawer for <=374px) */}
                <button
                  type="button"
                  onClick={handleWalletClick}
                  className="hidden xs:flex p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-emerald-50/50 text-slate-800 min-w-[36px] min-h-[36px] items-center justify-center"
                  title={isAuthenticated ? 'Buildora Wallet' : 'Sign in for Wallet'}
                >
                  <Wallet className="w-4 h-4 text-emerald-600" />
                </button>

                {/* Wishlist */}
                <button
                  type="button"
                  onClick={handleWishlistClick}
                  className="relative p-1.5 rounded-xl text-slate-700 hover:bg-slate-100 min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
                  title={isAuthenticated ? 'Saved Materials' : 'Sign In for Wishlist'}
                >
                  <Heart className="w-4 h-4" />
                  {wishlistItems.length > 0 && (
                    <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                      {wishlistItems.length}
                    </span>
                  )}
                </button>

                {/* Notifications */}
                <NotificationPopover />

                {/* Cart Button - Product Count Only & Direct Navigation */}
                <Link
                  to="/cart"
                  className="flex items-center gap-1 bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-black py-1.5 px-2 xs:px-2.5 rounded-xl shadow-sm text-xs min-h-[36px] flex-shrink-0"
                  title="Shopping Cart"
                >
                  <ShoppingCart className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-[11px] font-bold whitespace-nowrap">
                    <span className="hidden xs:inline">Cart </span>({summary.itemCount})
                  </span>
                </Link>
              </div>
            </div>

            {/* Mobile Row 2: Full-Width Search Bar */}
            <div className="w-full">
              <SmartSearchBar />
            </div>
          </div>
        </div>

        {/* 3. DESKTOP ROW 2: API-DRIVEN COMPACT NAVIGATION (CLICK-BASED DROPDOWNS) */}
        <div ref={megaMenuRef} className="bg-slate-50 border-t border-slate-200/80 px-4 sm:px-6 lg:px-8 hidden lg:block relative">
          <div className="w-full max-w-[1680px] mx-auto flex items-center justify-center">
            <div className="flex items-center justify-center gap-1 xl:gap-1.5 text-xs font-bold text-slate-700 py-1 flex-wrap">
              {visibleDesktopNavigation.map((nav) => {
                if (nav.itemType === 'HOME') {
                  return (
                    <Link
                      key={nav.id}
                      to={nav.route || '/'}
                      onClick={() => setActiveDepartment(null)}
                      className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl font-black text-xs transition-all mr-0.5 shadow-2xs ${
                        isHomeActive
                          ? 'bg-brand-blue-900 text-white'
                          : 'text-slate-700 hover:text-brand-blue-900 hover:bg-slate-200/70 bg-white border border-slate-200/80'
                      }`}
                      title="BUILDORA 60 Homepage"
                    >
                      <Home className={`w-3.5 h-3.5 ${isHomeActive ? 'text-white' : 'text-brand-orange-500'}`} />
                      <span>{nav.label}</span>
                    </Link>
                  );
                }

                if (nav.itemType === 'NEW_LAUNCHES') {
                  const nlKey = 'new-launches';
                  const isOpen = nav.hasDropdown && activeDepartment === nlKey;
                  const btnClass = `flex items-center gap-1.5 py-1.5 px-2.5 xl:px-3 rounded-xl transition-all font-bold text-xs cursor-pointer select-none ${
                    isOpen
                      ? 'bg-slate-900 text-white shadow-xs'
                      : isNewLaunchesActive
                      ? 'bg-brand-blue-900 text-white shadow-sm'
                      : 'text-slate-700 hover:text-brand-blue-900 hover:bg-slate-200/70'
                  }`;

                  if (nav.hasDropdown) {
                    return (
                      <button
                        key={nav.id}
                        type="button"
                        aria-expanded={isOpen}
                        aria-haspopup="true"
                        onClick={() => handleToggleDepartment(nlKey)}
                        className={btnClass}
                      >
                        <Rocket
                          className={`w-3.5 h-3.5 ${
                            isNewLaunchesActive || isOpen ? 'text-white' : 'text-brand-orange-500'
                          }`}
                        />
                        <span>{nav.label}</span>
                        <ChevronDown
                          className={`w-3 h-3 transition-transform duration-150 ${
                            isNewLaunchesActive || isOpen ? 'text-white/80' : 'text-slate-400'
                          } ${isOpen ? 'rotate-180' : ''}`}
                        />
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={nav.id}
                      to={nav.route || '/new-launches'}
                      onClick={() => setActiveDepartment(null)}
                      className={btnClass}
                    >
                      <Rocket
                        className={`w-3.5 h-3.5 ${isNewLaunchesActive ? 'text-white' : 'text-brand-orange-500'}`}
                      />
                      <span>{nav.label}</span>
                    </Link>
                  );
                }

                if (nav.itemType === 'DEALS' || (nav.highlight && !nav.hasDropdown)) {
                  const isCustomRouteActive =
                    !activeDepartment &&
                    nav.itemType !== 'DEALS' &&
                    nav.route &&
                    location.pathname === nav.route;
                  const dealsHighlight = isDealsActive || Boolean(isCustomRouteActive);
                  return (
                    <Link
                      key={nav.id}
                      to={nav.route || '/deals'}
                      onClick={() => setActiveDepartment(null)}
                      className={`py-1.5 px-2.5 xl:px-3 rounded-xl font-black text-xs flex items-center gap-1 transition-all ${
                        dealsHighlight
                          ? 'bg-brand-blue-900 text-white shadow-sm'
                          : 'text-brand-orange-600 hover:bg-orange-50'
                      }`}
                    >
                      <Sparkles
                        className={`w-3.5 h-3.5 fill-current ${
                          dealsHighlight ? 'text-white' : 'text-brand-orange-600'
                        }`}
                      />
                      <span>{nav.label}</span>
                    </Link>
                  );
                }

                // MAIN_CATEGORY or CUSTOM_LINK
                const targetSlug = nav.mainCategorySlug || nav.slug;
                const linkedMain =
                  nav.mainCategoryId
                    ? visibleMainCategories.find((m) => m.id === nav.mainCategoryId || m.slug === targetSlug)
                    : visibleMainCategories.find((m) => m.slug === targetSlug);
                const dropdownKey = linkedMain?.slug || targetSlug;
                const Icon = DEPARTMENT_ICONS[dropdownKey] || Building2;
                const hasDrop = Boolean(nav.hasDropdown && linkedMain);
                const isOpen = hasDrop && activeDepartment === dropdownKey;
                const isActive = isDeptActive({ slug: dropdownKey });
                const isExternalRoute = /^https?:\/\//i.test(String(nav.route || ''));
                const resolvedHref = nav.route || `/categories/${dropdownKey}`;
                const navLinkClass = `flex items-center gap-1.5 py-1.5 px-2.5 xl:px-3 rounded-xl transition-all font-bold text-xs cursor-pointer select-none ${
                  isOpen
                    ? 'bg-slate-900 text-white shadow-xs'
                    : isActive
                    ? 'bg-brand-blue-900 text-white shadow-sm'
                    : 'text-slate-700 hover:text-brand-blue-900 hover:bg-slate-200/70'
                }`;

                if (hasDrop) {
                  return (
                    <button
                      key={nav.id}
                      type="button"
                      aria-expanded={isOpen}
                      aria-haspopup="true"
                      onClick={() => handleToggleDepartment(dropdownKey)}
                      className={navLinkClass}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive || isOpen ? 'text-white' : 'text-brand-orange-500'}`} />
                      <span>{nav.label}</span>
                      <ChevronDown
                        className={`w-3 h-3 transition-transform duration-150 ${
                          isActive || isOpen ? 'text-white/80' : 'text-slate-400'
                        } ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                  );
                }

                return isExternalRoute ? (
                  <a
                    key={nav.id}
                    href={resolvedHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setActiveDepartment(null)}
                    className={navLinkClass}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-brand-orange-500'}`} />
                    <span>{nav.label}</span>
                  </a>
                ) : (
                  <Link
                    key={nav.id}
                    to={resolvedHref}
                    onClick={() => setActiveDepartment(null)}
                    className={navLinkClass}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-brand-orange-500'}`} />
                    <span>{nav.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* TWO-PANEL WIDE RECTANGULAR MEGA-MENU DROPDOWN (PANEL 1: MAIN CATEGORIES, PANEL 2: CHILD CATEGORIES) */}
          {activeDepartment && (() => {
            const isNewLaunches = activeDepartment === 'new-launches';
            const activeDept = !isNewLaunches
              ? visibleMainCategories.find((d) => d.slug === activeDepartment) ||
                CONSTRUCTION_DEPARTMENTS.find((d) => d.slug === activeDepartment)
              : null;

            if (!isNewLaunches && !activeDept) return null;

            const menuCategories = isNewLaunches
              ? liveNewLaunchCollections
              : getMainChildCategories(activeDept!.slug);

            const currentCat = menuCategories.find((c: any) => c.slug === selectedParentCategorySlug);

            type MenuChildCategory = {
              id: string;
              name: string;
              slug: string;
              targetMasterSlug: string;
              targetMasterName: string;
              targetUrl?: string;
              productCount?: number;
            };

            const mapNewLaunchShortcuts = (col: any): MenuChildCategory[] => {
              const mappings = Array.isArray(col?.categoryMappings) ? col.categoryMappings : [];
              return mappings
                .filter(
                  (m: any) =>
                    m &&
                    m.isActive !== false &&
                    m.mappingStatus === 'MAPPED' &&
                    m.categoryGroupSlug &&
                    m.childCategorySlug
                )
                .map((m: any) => ({
                  id: `${col.slug}-${m.id}`,
                  name: m.displayLabel || m.childCategoryName,
                  slug: m.childCategorySlug,
                  targetMasterSlug: m.categoryGroupSlug,
                  targetMasterName: col.title || col.name,
                  targetUrl: `/categories/${m.categoryGroupSlug}/${m.childCategorySlug}`,
                  productCount: typeof m.productCount === 'number' ? m.productCount : undefined,
                }));
            };

            let childCategories: MenuChildCategory[] = [];
            if (currentCat) {
              if (isNewLaunches) {
                childCategories = mapNewLaunchShortcuts(currentCat);
              } else {
                const deptCat = currentCat as Category;
                const rawChildren = (deptCat as any).childCategories || deptCat.subcategories || [];
                childCategories = rawChildren.map((sub: any) => ({
                  id: sub.id,
                  name: sub.name,
                  slug: sub.slug,
                  targetMasterSlug: deptCat.slug,
                  targetMasterName: deptCat.name,
                  productCount: sub.productCount ?? sub.itemCount,
                }));
              }
            }

            const allChildCategories: MenuChildCategory[] = menuCategories.flatMap((cat: any) => {
              if (isNewLaunches) {
                return mapNewLaunchShortcuts(cat);
              }
              const deptCat = cat as Category;
              const rawChildren = (deptCat as any).childCategories || deptCat.subcategories || [];
              return rawChildren.map((sub: any) => ({
                id: sub.id,
                name: sub.name,
                slug: sub.slug,
                targetMasterSlug: deptCat.slug,
                targetMasterName: deptCat.name,
                productCount: sub.productCount ?? sub.itemCount,
              }));
            });

            const displayedChildCategories =
              selectedParentCategorySlug === 'all' ? allChildCategories : childCategories;

            const viewAllUrl = currentCat
              ? isNewLaunches
                ? `/new-launches/${currentCat.slug}`
                : `/categories/${currentCat.slug}`
              : isNewLaunches
              ? '/new-launches'
              : `/categories/${activeDept?.slug}`;

            return (
              <div className="absolute top-full left-0 right-0 pt-1.5 z-50 flex justify-center px-4 sm:px-6 lg:px-8 pointer-events-none">
                <div className="w-full max-w-[1160px] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden transition-all duration-150 animate-in fade-in-0 slide-in-from-top-1 pointer-events-auto">
                  <div className="flex min-h-[260px] max-h-[min(410px,calc(100vh-130px))]">
                    {/* LEFT PANEL: MAIN CATEGORIES (Hover to preview Child Categories, Click to view Main Category PLP) */}
                    <div className="w-[260px] xl:w-[295px] flex-shrink-0 border-r border-slate-100 bg-white p-3.5 overflow-y-auto">
                      <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2 px-2.5">
                        {isNewLaunches ? 'FEATURED COLLECTIONS' : 'MAIN CATEGORIES'}
                      </div>
                      <div className="space-y-1">
                        {/* ALL option */}
                        <Link
                          to={isNewLaunches ? '/new-launches' : `/categories/${activeDept?.slug}`}
                          onMouseEnter={() => setSelectedParentCategorySlug('all')}
                          onFocus={() => setSelectedParentCategorySlug('all')}
                          onClick={() => setActiveDepartment(null)}
                          className={`w-full group flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all text-left cursor-pointer ${
                            selectedParentCategorySlug === 'all'
                              ? 'bg-slate-900 text-white font-black shadow-xs'
                              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-bold'
                          }`}
                        >
                          <span className="truncate">
                            {isNewLaunches ? 'All New Launches' : `All in ${activeDept?.name}`}
                          </span>
                          <ChevronRight
                            className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${
                              selectedParentCategorySlug === 'all'
                                ? 'text-brand-orange-400 translate-x-0.5'
                                : 'text-slate-300 group-hover:text-slate-500'
                            }`}
                          />
                        </Link>

                        {/* Main Category / Collection Items */}
                        {menuCategories.map((cat: any) => {
                          const isSelected = selectedParentCategorySlug === cat.slug;
                          const mainCatUrl = isNewLaunches
                            ? `/new-launches/${cat.slug}`
                            : `/categories/${cat.slug}`;
                          return (
                            <Link
                              key={cat.id}
                              to={mainCatUrl}
                              onMouseEnter={() => setSelectedParentCategorySlug(cat.slug)}
                              onFocus={() => setSelectedParentCategorySlug(cat.slug)}
                              onClick={() => setActiveDepartment(null)}
                              className={`w-full group flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all text-left cursor-pointer ${
                                isSelected
                                  ? 'bg-slate-900 text-white font-black shadow-xs'
                                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-bold'
                              }`}
                              title={`Browse all products in ${cat.name}`}
                            >
                              <span className="truncate flex-1 min-w-0 pr-2">{cat.name}</span>
                              <ChevronRight
                                className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${
                                  isSelected
                                    ? 'text-brand-orange-400 translate-x-0.5'
                                    : 'text-slate-300 group-hover:text-slate-500'
                                }`}
                              />
                            </Link>
                          );
                        })}
                      </div>
                    </div>

                    {/* RIGHT PANEL: CHILD CATEGORIES FOR SELECTED MAIN CATEGORY */}
                    <div className="flex-1 min-w-0 bg-slate-50/40 p-4 sm:p-5 overflow-y-auto flex flex-col">
                      <div className="flex items-center justify-between gap-3 mb-3 pb-2 border-b border-slate-200/70">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 truncate">
                          {currentCat
                            ? `${currentCat.name} → Child Categories`
                            : isNewLaunches
                            ? 'All New Launches → Child Categories'
                            : `All in ${activeDept?.name} → Child Categories`}
                        </span>
                        <Link
                          to={viewAllUrl}
                          onClick={() => setActiveDepartment(null)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-brand-blue-800 hover:text-brand-blue-950 hover:underline flex-shrink-0"
                        >
                          <span>View all</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>

                      {displayedChildCategories.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                          {displayedChildCategories.map((sub) => {
                            const subUrl = sub.targetUrl || `/categories/${sub.targetMasterSlug}/${sub.slug}`;
                            return (
                              <Link
                                key={`${sub.targetMasterSlug}-${sub.id}`}
                                to={subUrl}
                                onClick={() => setActiveDepartment(null)}
                                className="group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-white/80 hover:bg-white border border-slate-200/60 hover:border-brand-blue-300 hover:text-brand-blue-900 hover:shadow-xs transition-all cursor-pointer"
                              >
                                <div className="min-w-0 flex-1 pr-2">
                                  <div className="truncate font-semibold">{sub.name}</div>
                                  {selectedParentCategorySlug === 'all' && (
                                    <div className="text-[10px] text-slate-400 truncate mt-0.5">
                                      {sub.targetMasterName}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  {typeof sub.productCount === 'number' && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600 group-hover:bg-brand-blue-50 group-hover:text-brand-blue-800">
                                      {sub.productCount}
                                    </span>
                                  )}
                                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-brand-blue-800 group-hover:translate-x-0.5 transition-all" />
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-center text-xs font-medium text-slate-400 text-center px-3">
                          No child categories configured.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* 4. DEDICATED RESPONSIVE MOBILE DRAWER */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-200 px-4 py-4 space-y-4 shadow-2xl max-h-[calc(100vh-105px)] max-h-[calc(100dvh-105px)] overflow-y-auto safe-pb">
            {/* Mobile Account Status */}
            {isAuthenticated && user ? (
              <div className="p-3 bg-brand-blue-50/60 rounded-xl border border-brand-blue-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-brand-blue-900 text-white flex items-center justify-center font-black text-xs">
                    {user.name ? user.name.charAt(0) : 'U'}
                  </div>
                  <div>
                    <div className="font-black text-xs text-slate-900">{user.name}</div>
                    <div className="text-[11px] text-slate-500">Wallet: {formatCurrency(user.walletBalance)}</div>
                  </div>
                </div>
                <Link
                  to="/account"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-xs font-bold text-brand-blue-900 underline"
                >
                  Dashboard
                </Link>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  openAuthModal('/account', 'Sign in to access your Buildora account');
                }}
                className="w-full py-2.5 bg-brand-blue-900 hover:bg-brand-blue-800 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                Sign In to Account
              </button>
            )}

            {/* Mobile Wallet Quick Status */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-slate-800">Buildora Cash Wallet</span>
              </div>
              {isAuthenticated && user ? (
                <Link
                  to="/account/wallet"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="font-extrabold text-emerald-700"
                >
                  {formatCurrency(user.walletBalance)}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openAuthModal('/account/wallet', 'Sign in to view your Buildora Cash balance');
                  }}
                  className="text-brand-blue-900 font-bold underline"
                >
                  Sign In
                </button>
              )}
            </div>

            {/* Primary Mobile Navigation Links (Synced with Desktop Navigation) */}
            <div className="space-y-1.5">
              {visibleDesktopNavigation
                .filter((nav) => nav.itemType === 'HOME' || nav.itemType === 'CUSTOM_LINK' || nav.itemType === 'DEALS')
                .map((nav) => {
                  const isLinkActive = nav.route === '/' ? isHomeActive : location.pathname === nav.route;
                  const isExternal = /^https?:\/\//i.test(String(nav.route || ''));
                  const linkClasses = `flex items-center gap-2.5 p-3 rounded-xl text-xs font-black transition-colors ${
                    isLinkActive
                      ? 'bg-brand-blue-900 text-white shadow-sm'
                      : nav.itemType === 'DEALS'
                        ? 'bg-orange-50 hover:bg-orange-100 text-brand-orange-600 border border-orange-200/70'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200'
                  }`;
                  const iconEl =
                    nav.itemType === 'DEALS' ? (
                      <Sparkles className={`w-4 h-4 ${isLinkActive ? 'text-white' : 'text-brand-orange-500'}`} />
                    ) : (
                      <Home className={`w-4 h-4 ${isLinkActive ? 'text-white' : 'text-brand-orange-500'}`} />
                    );
                  return isExternal ? (
                    <a
                      key={nav.id}
                      href={nav.route}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={linkClasses}
                    >
                      {iconEl}
                      <span>{nav.label}</span>
                    </a>
                  ) : (
                    <Link
                      key={nav.id}
                      to={nav.route || '/'}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={linkClasses}
                    >
                      {iconEl}
                      <span>{nav.label}</span>
                    </Link>
                  );
                })}
            </div>

            {/* Main Categories Mobile Accordion */}
            <div className="space-y-1.5">
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-extrabold px-1">
                Main Categories
              </div>
              <div className="space-y-1">
                {visibleMainCategories
                  .filter(
                    (dept) =>
                      !hasLoadedTaxonomy ||
                      visibleDesktopNavigation.some(
                        (n) => n.itemType === 'MAIN_CATEGORY' && (n.mainCategoryId === dept.id || n.mainCategorySlug === dept.slug)
                      )
                  )
                  .map((dept) => {
                  const Icon = DEPARTMENT_ICONS[dept.slug] || Building2;
                  const isActive = isRouteDeptActive({ slug: dept.slug });
                  const isDeptExpanded = mobileExpandedDept === dept.slug;
                  const deptCats = getMainChildCategories(dept.slug);

                  return (
                    <div key={dept.id} className="rounded-xl border border-slate-100 overflow-hidden bg-white">
                      {/* Main Category Trigger Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setMobileExpandedDept(isDeptExpanded ? null : dept.slug);
                          if (!isDeptExpanded && deptCats.length > 0) {
                            setMobileExpandedCat(deptCats[0].slug);
                          }
                        }}
                        className={`w-full flex items-center justify-between p-2.5 text-xs font-bold transition-colors ${
                          isActive
                            ? 'bg-brand-blue-900 text-white'
                            : isDeptExpanded
                            ? 'bg-slate-100 text-brand-blue-900'
                            : 'hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-brand-orange-500'}`} />
                          <span>{dept.name}</span>
                        </div>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            isActive ? 'text-white' : 'text-slate-400'
                          } ${isDeptExpanded ? 'rotate-180' : ''}`}
                        />
                      </button>

                      {/* Expanded Child Categories on Mobile */}
                      {isDeptExpanded && (
                        <div className="p-2 bg-slate-50 border-t border-slate-100 space-y-1.5 animate-in fade-in-0 duration-150">
                          <Link
                            to={`/categories/${dept.slug}`}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block px-2.5 py-1.5 rounded-lg bg-brand-blue-50 text-[11px] font-black text-brand-blue-900 hover:bg-brand-blue-100"
                          >
                            View all in {dept.name} →
                          </Link>
                          {deptCats.map((cat: any) => {
                            const isCatExpanded = mobileExpandedCat === cat.slug;
                            const catChildren = cat.childCategories || cat.subcategories || [];
                            return (
                              <div key={cat.id} className="bg-white rounded-lg border border-slate-200/70 overflow-hidden">
                                <div className="flex items-center justify-between p-2 text-xs font-bold text-slate-800">
                                  <Link
                                    to={`/categories/${cat.slug}`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center gap-1.5 truncate text-brand-blue-950 hover:underline flex-1"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-orange-500 flex-shrink-0" />
                                    <span className="truncate">{cat.name}</span>
                                  </Link>
                                  {catChildren.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => setMobileExpandedCat(isCatExpanded ? null : cat.slug)}
                                      className="p-1 text-slate-400 hover:text-slate-600 flex-shrink-0"
                                      aria-label={`Toggle child categories for ${cat.name}`}
                                    >
                                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isCatExpanded ? 'rotate-180' : ''}`} />
                                    </button>
                                  )}
                                </div>

                                {/* Child Categories list */}
                                {isCatExpanded && catChildren.length > 0 && (
                                  <div className="pl-6 pr-2 py-1.5 bg-slate-50/80 border-t border-slate-100 space-y-1 text-[11px]">
                                    {catChildren.map((sub: any) => (
                                      <Link
                                        key={sub.id}
                                        to={`/categories/${cat.slug}/${sub.slug}`}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="block py-1 text-slate-600 hover:text-brand-blue-900 truncate"
                                      >
                                        &bull; {sub.name}
                                      </Link>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Mobile New Launches Accordion */}
                <div className="rounded-xl border border-brand-orange-200/70 overflow-hidden bg-white shadow-2xs">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileExpandedDept(mobileExpandedDept === 'new-launches' ? null : 'new-launches');
                      if (mobileExpandedDept !== 'new-launches') {
                        setMobileExpandedCat(liveNewLaunchCollections[0]?.slug || null);
                      }
                    }}
                    className={`w-full flex items-center justify-between p-2.5 text-xs font-bold transition-colors cursor-pointer ${
                      isNewLaunchesActive
                        ? 'bg-brand-blue-900 text-white'
                        : mobileExpandedDept === 'new-launches'
                        ? 'bg-brand-orange-50/80 text-brand-blue-900'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Rocket className={`w-4 h-4 ${isNewLaunchesActive ? 'text-white' : 'text-brand-orange-500'}`} />
                      <span>New Launches</span>
                      <span className="text-[9px] font-black bg-brand-orange-500 text-white px-1.5 py-0.5 rounded-full">
                        HOT
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        isNewLaunchesActive ? 'text-white' : 'text-slate-400'
                      } ${mobileExpandedDept === 'new-launches' ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {mobileExpandedDept === 'new-launches' && (
                    <div className="p-2 bg-slate-50 border-t border-slate-100 space-y-1.5 animate-in fade-in-0 duration-150">
                      <Link
                        to="/new-launches"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-between p-2 rounded-lg bg-brand-blue-900 text-white text-xs font-bold shadow-xs"
                      >
                        <span className="flex items-center gap-1.5">
                          <Rocket className="w-3.5 h-3.5 text-brand-orange-400" />
                          All New Launches
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>

                      {liveNewLaunchCollections.map((cat: any) => {
                        const isCatExpanded = mobileExpandedCat === cat.slug;
                        const subs = (cat.categoryMappings || []).filter(
                          (m: any) =>
                            m &&
                            m.isActive !== false &&
                            m.mappingStatus === 'MAPPED' &&
                            m.categoryGroupSlug &&
                            m.childCategorySlug
                        );

                        return (
                          <div key={cat.id} className="bg-white rounded-lg border border-slate-200/70 overflow-hidden">
                            <div className="flex items-center justify-between p-2 text-xs font-bold text-slate-800">
                              <Link
                                to={`/new-launches/${cat.slug}`}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-1.5 truncate text-brand-blue-950 hover:underline flex-1"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-orange-500 flex-shrink-0" />
                                <span className="truncate">{cat.name}</span>
                              </Link>
                              {subs.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setMobileExpandedCat(isCatExpanded ? null : cat.slug)}
                                  className="p-1 text-slate-400 hover:text-slate-600 flex-shrink-0 cursor-pointer"
                                  aria-label={`Toggle subcategories for ${cat.name}`}
                                >
                                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isCatExpanded ? 'rotate-180' : ''}`} />
                                </button>
                              )}
                            </div>

                            {isCatExpanded && subs.length > 0 && (
                              <div className="pl-6 pr-2 py-1.5 bg-slate-50/80 border-t border-slate-100 space-y-1 text-[11px]">
                                {subs.map((sub: any) => (
                                  <Link
                                    key={sub.id}
                                    to={`/categories/${sub.categoryGroupSlug}/${sub.childCategorySlug}`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="block py-1 text-slate-600 hover:text-brand-blue-900 truncate"
                                  >
                                    &bull; {sub.displayLabel || sub.childCategoryName}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-1 text-xs font-bold text-slate-700 pt-2 border-t border-slate-100">
              <Link
                to="/deals"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-1.5 py-2 px-2.5 rounded-lg ${
                  isDealsActive
                    ? 'bg-brand-blue-900 text-white shadow-sm font-black'
                    : 'text-brand-orange-600 hover:bg-slate-50'
                }`}
              >
                <Sparkles className={`w-3.5 h-3.5 ${isDealsActive ? 'text-white' : 'text-brand-orange-600'}`} />
                <span>Deals &amp; Offers</span>
              </Link>
              <Link
                to="/new-launches"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-2 py-2 px-2.5 rounded-lg transition-colors ${
                  isNewLaunchesActive
                    ? 'bg-brand-blue-900 text-white shadow-sm font-black'
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Rocket
                  className={`w-3.5 h-3.5 ${
                    isNewLaunchesActive ? 'text-white' : 'text-brand-orange-500'
                  }`}
                />
                <span>New Launches</span>
              </Link>
              <Link
                to="/products"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2 px-2.5 hover:bg-slate-50 rounded-lg"
              >
                All 28 Master Categories
              </Link>
              <Link
                to="/tools/material-estimator"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2 px-2.5 hover:bg-slate-50 rounded-lg text-brand-blue-900"
              >
                Material Quantity Estimator
              </Link>
              <Link
                to="/tools/home-construction-calculator"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2 px-2.5 hover:bg-slate-50 rounded-lg text-brand-orange-600 font-semibold"
              >
                Home Construction Calculator
              </Link>
              <Link
                to="/knowledge-hub"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2 px-2.5 hover:bg-slate-50 rounded-lg"
              >
                Knowledge Hub &amp; Guides
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Persistent Modals */}
      <LocationModal />
      <CartDrawer isOpen={isCartDrawerOpen} onClose={() => setIsCartDrawerOpen(false)} />
    </>
  );
};
