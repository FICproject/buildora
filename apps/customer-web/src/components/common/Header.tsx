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
  Calculator,
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
  FolderKanban,
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
  NEW_LAUNCHES_CATEGORIES,
  MAIN_CATEGORIES_SEED,
  PRODUCT_TYPES_SEED
} from '@buildora/constants';
import { Category, Product, MainCategory } from '@buildora/types';
import { api } from '../../services/api';
import { formatCurrency } from '@buildora/utils';
import { formatLocationDisplay } from '../../utils';
import { LocationModal } from './LocationModal';
import { AuthModal } from './AuthModal';
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

  // Active mega menu department dropdown & hierarchy hover states
  const [activeDepartment, setActiveDepartment] = useState<string | null>(null);
  const [selectedParentCategorySlug, setSelectedParentCategorySlug] = useState<string | null>(null);
  const [hoveredChildCategorySlug, setHoveredChildCategorySlug] = useState<string | null>(null);
  const [hoveredChildMasterSlug, setHoveredChildMasterSlug] = useState<string | null>(null);
  const [isAllCategoriesOpen, setIsAllCategoriesOpen] = useState(false);

  // Live 4-level taxonomy & customer-visible products for hover panels
  const [mainCategories, setMainCategories] = useState<MainCategory[]>(MAIN_CATEGORIES_SEED);
  const [catalogCategories, setCatalogCategories] = useState<Category[]>(MASTER_CATEGORIES);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [newLaunchProducts, setNewLaunchProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);

  // Mobile navigation accordion state
  const [mobileExpandedDept, setMobileExpandedDept] = useState<string | null>(null);
  const [mobileExpandedCat, setMobileExpandedCat] = useState<string | null>(null);

  const headerContainerRef = useRef<HTMLElement>(null);
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load live 4-level backend taxonomy and customer-visible products
  useEffect(() => {
    let active = true;
    const fetchHeaderCatalog = async () => {
      setIsLoadingProducts(true);
      try {
        const [taxonomy, cats, prods, newLaunchesRes] = await Promise.all([
          api.getTaxonomy(),
          api.getCategories(),
          api.getProducts(),
          api.getNewLaunches()
        ]);
        if (!active) return;

        if (Array.isArray(taxonomy?.mainCategories) && taxonomy.mainCategories.length > 0) {
          setMainCategories(taxonomy.mainCategories);
        }

        if (Array.isArray(taxonomy?.childCategories) && taxonomy.childCategories.length > 0) {
          const typePool = Array.isArray(taxonomy.productTypes) ? taxonomy.productTypes : PRODUCT_TYPES_SEED;
          const hydratedChildren: Category[] = taxonomy.childCategories
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
          setCatalogCategories(hydratedChildren);
        } else if (cats && cats.length > 0) {
          setCatalogCategories(cats);
        }

        if (Array.isArray(prods)) setCatalogProducts(prods);
        if (Array.isArray(newLaunchesRes?.products)) setNewLaunchProducts(newLaunchesRes.products);
      } finally {
        if (active) setIsLoadingProducts(false);
      }
    };
    void fetchHeaderCatalog();

    const onRealtimeCatalog = () => {
      void fetchHeaderCatalog();
    };
    window.addEventListener('buildora:realtime:catalog', onRealtimeCatalog);
    return () => {
      active = false;
      window.removeEventListener('buildora:realtime:catalog', onRealtimeCatalog);
    };
  }, []);

  const visibleMainCategories = React.useMemo(() => {
    const source = mainCategories.length > 0 ? mainCategories : MAIN_CATEGORIES_SEED;
    return [...source]
      .filter((m) => m.isActive !== false && m.showInNavigation !== false)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }, [mainCategories]);

  // Helper to get Child Categories belonging to a Main Category
  const getMainChildCategories = (mainSlug: string) => {
    const deptFallback = CONSTRUCTION_DEPARTMENTS.find((d) => d.slug === mainSlug);
    const source = catalogCategories.length > 0 ? catalogCategories : MASTER_CATEGORIES;
    return source.filter((c: any) => {
      const mSlug = c.mainCategorySlug || c.departmentSlug;
      if (mSlug) return mSlug === mainSlug;
      return deptFallback ? deptFallback.categorySlugs.includes(c.slug) : false;
    });
  };

  // Debounced hover handlers for smooth, flicker-free mega menu opening/closing
  const handleDeptMouseEnter = (deptSlug: string) => {
    setIsToolsOpen(false);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (activeDepartment !== deptSlug) {
      setActiveDepartment(deptSlug);
      const isNL = deptSlug === 'new-launches';
      const cats = isNL ? NEW_LAUNCHES_CATEGORIES : getMainChildCategories(deptSlug);
      setSelectedParentCategorySlug(cats[0]?.slug || 'all');
      setHoveredChildCategorySlug(null);
      setHoveredChildMasterSlug(null);
    }
  };

  const handleDeptMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveDepartment(null);
      setHoveredChildCategorySlug(null);
      setHoveredChildMasterSlug(null);
      setIsToolsOpen(false);
    }, 180);
  };

  // Close menus on route change, outside click, or escape
  useEffect(() => {
    setActiveDepartment(null);
    setHoveredChildCategorySlug(null);
    setHoveredChildMasterSlug(null);
    setIsToolsOpen(false);
    setIsMobileMenuOpen(false);
    setMobileExpandedDept(null);
    setMobileExpandedCat(null);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerContainerRef.current && !headerContainerRef.current.contains(event.target as Node)) {
        setActiveDepartment(null);
        setHoveredChildCategorySlug(null);
        setHoveredChildMasterSlug(null);
        setIsAllCategoriesOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveDepartment(null);
        setHoveredChildCategorySlug(null);
        setHoveredChildMasterSlug(null);
        setIsAllCategoriesOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const handleWalletClick = () => {
    if (isAuthenticated) {
      navigate('/account/wallet');
    } else {
      openAuthModal('/account/wallet', 'Sign in to access your Buildora Cash Wallet and promotional cashbacks.');
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

  // Active navigation route helpers
  const isHomeActive = location.pathname === '/';
  const isNewLaunchesActive = location.pathname.startsWith('/new-launches');
  const isBrandsActive = location.pathname.startsWith('/brands');
  const isDealsActive = location.pathname.startsWith('/deals') || location.pathname.startsWith('/offers');

  const isDeptActive = (dept: { slug: string; categorySlugs?: string[] }) => {
    if (location.pathname === `/categories/${dept.slug}`) return true;
    if (location.pathname.startsWith('/categories/')) {
      const catSlug = location.pathname.split('/')[2];
      const children = getMainChildCategories(dept.slug);
      return (
        dept.slug === catSlug ||
        children.some((c) => c.slug === catSlug) ||
        Boolean(dept.categorySlugs?.includes(catSlug))
      );
    }
    return false;
  };

  return (
    <>
      <header ref={headerContainerRef} className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm transition-all duration-200">
        {/* MAIN HEADER ROW */}
        <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3">
          {/* A. DESKTOP LAYOUT (lg & above)
              3 CLEAR SECTIONS: [Brand & Location] → [Flexible Center Search] → [User Actions]
          */}
          <div className="hidden lg:flex items-center justify-between gap-4 xl:gap-8">
            {/* 1. LEFT SECTION — Brand & Location */}
            <div
              onClick={openLocationModal}
              className="flex items-center gap-3 p-1.5 -ml-1.5 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer flex-shrink-0 group select-none"
              title="Click to check pincode or select delivery address"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-blue-900 flex items-center justify-center text-white font-black text-xl shadow-md group-hover:bg-brand-orange-500 transition-colors flex-shrink-0">
                B
              </div>
              <div className="flex flex-col text-left leading-none">
                <span className="font-black text-xl xl:text-2xl tracking-tight text-slate-900 leading-none">
                  BUILDORA <span className="text-brand-orange-500">60</span>
                </span>
                <div className="flex items-center gap-1 text-xs font-black text-slate-900 group-hover:text-brand-blue-900 transition-colors mt-1.5">
                  <span>{getLocationDisplayETA()}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-blue-600 group-hover:translate-y-0.5 transition-all" />
                </div>
                <span className="text-[11px] text-slate-500 font-medium truncate max-w-[170px] xl:max-w-[210px] leading-tight mt-0.5">
                  {getLocationDisplaySubtitle()}
                </span>
              </div>
            </div>

            {/* 2. CENTER SECTION — Expanded Flexible Search Bar */}
            <div className="flex-1 min-w-0 mx-2 xl:mx-4">
              <SmartSearchBar />
            </div>

            {/* 3. RIGHT SECTION — User Actions (Order: Profile → Wishlist → Notifications → Wallet → Cart) */}
            <div className="flex-shrink-0 flex items-center gap-2 xl:gap-2.5">
              {/* 1. Profile / Account */}
              {isAuthenticated && user ? (
                <Link
                  to="/account"
                  className="h-10 flex items-center gap-2 px-2.5 xl:px-3 rounded-xl border border-slate-200 hover:border-brand-blue-400 hover:bg-slate-50 text-xs font-bold text-slate-800 bg-white shadow-2xs hover:shadow-xs transition-all flex-shrink-0"
                  title="My Account Dashboard"
                >
                  <div className="w-7 h-7 rounded-lg bg-brand-blue-900 text-white flex items-center justify-center font-black text-xs shadow-xs flex-shrink-0">
                    {user.name ? user.name.charAt(0) : 'U'}
                  </div>
                  <span className="hidden xl:inline truncate max-w-[90px] xl:max-w-[110px] text-xs font-bold text-slate-800">
                    {user.name ? user.name.split(' ')[0] : (user.phone || 'Account')}
                  </span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuthModal('/account', 'Sign in to access your Buildora account and saved details')}
                  className="h-10 flex items-center gap-1.5 px-3 xl:px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 transition-colors shadow-2xs flex-shrink-0"
                  title="Sign In to Account"
                >
                  <User className="w-4 h-4 text-slate-600 flex-shrink-0" />
                  <span className="font-bold">Sign In</span>
                </button>
              )}

              {/* 2. Wishlist */}
              <Link
                to="/wishlist"
                className="h-10 w-10 relative rounded-xl text-slate-700 hover:text-brand-blue-900 hover:bg-slate-100 transition-colors flex items-center justify-center flex-shrink-0"
                title="View Saved Materials (Wishlist)"
              >
                <Heart className="w-5 h-5" />
                {wishlistItems.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs">
                    {wishlistItems.length}
                  </span>
                )}
              </Link>

              {/* 3. Notifications */}
              <div className="flex-shrink-0">
                <NotificationPopover />
              </div>

              {/* 4. Wallet */}
              <button
                type="button"
                onClick={handleWalletClick}
                className="h-10 flex items-center gap-1.5 px-2.5 xl:px-3 rounded-xl border border-slate-200 hover:border-emerald-400 bg-white hover:bg-emerald-50/40 text-xs font-bold text-slate-800 transition-all shadow-2xs hover:shadow-xs flex-shrink-0"
                title={isAuthenticated ? 'Buildora Wallet Balance' : 'Sign in to access Buildora Cash'}
              >
                <Wallet className="w-4 h-4 text-emerald-600 flex-shrink-0" />
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
                className="h-10 flex items-center gap-2 bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-black px-3.5 xl:px-4 rounded-xl shadow-xs hover:shadow-md transition-all flex-shrink-0"
                title="View Shopping Cart"
              >
                <ShoppingCart className="w-4 h-4 flex-shrink-0" />
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
                    onClick={() => openAuthModal('/account')}
                    className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 text-xs font-bold"
                    title="Sign In"
                  >
                    <User className="w-4 h-4" />
                  </button>
                )}

                {/* Wishlist */}
                <Link to="/wishlist" className="relative p-2 rounded-xl text-slate-700 hover:bg-slate-100" title="Wishlist">
                  <Heart className="w-4 h-4" />
                  {wishlistItems.length > 0 && (
                    <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                      {wishlistItems.length}
                    </span>
                  )}
                </Link>

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
                {/* Wallet Button */}
                <button
                  type="button"
                  onClick={handleWalletClick}
                  className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-emerald-50/50 text-slate-800 min-h-[36px] flex items-center justify-center"
                  title={isAuthenticated ? 'Buildora Wallet' : 'Sign in for Wallet'}
                >
                  <Wallet className="w-4 h-4 text-emerald-600" />
                </button>

                {/* Wishlist */}
                <Link
                  to="/wishlist"
                  className="relative p-1.5 rounded-xl text-slate-700 hover:bg-slate-100 min-h-[36px] flex items-center justify-center"
                  title="Saved Materials"
                >
                  <Heart className="w-4 h-4" />
                  {wishlistItems.length > 0 && (
                    <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                      {wishlistItems.length}
                    </span>
                  )}
                </Link>

                {/* Notifications */}
                <NotificationPopover />

                {/* Cart Button - Product Count Only & Direct Navigation */}
                <Link
                  to="/cart"
                  className="flex items-center gap-1 bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-black py-1.5 px-2 rounded-xl shadow-sm text-xs min-h-[36px]"
                  title="Shopping Cart"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-bold">
                    Cart ({summary.itemCount})
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

        {/* 3. DESKTOP ROW 2: HOME + 5 CONSTRUCTION DEPARTMENTS */}
        <div ref={megaMenuRef} className="bg-slate-50 border-t border-slate-200/80 px-4 sm:px-6 lg:px-8 hidden lg:block relative">
          <div className="w-full max-w-[1680px] mx-auto flex items-center justify-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 py-1.5 flex-wrap">
              {/* Home Navigation Item */}
              <Link
                to="/"
                className={`flex items-center gap-1.5 py-2 px-3.5 rounded-xl font-black text-xs transition-all mr-1 shadow-sm ${
                  isHomeActive
                    ? 'bg-brand-blue-900 text-white'
                    : 'text-slate-700 hover:text-brand-blue-900 hover:bg-slate-200/70 bg-white border border-slate-200/80'
                }`}
                title="BUILDORA 60 Homepage"
              >
                <Home className={`w-3.5 h-3.5 ${isHomeActive ? 'text-white' : 'text-brand-orange-500'}`} />
                <span>Home</span>
              </Link>

              {/* 5 Main Categories */}
              {visibleMainCategories.map((dept) => {
                const Icon = DEPARTMENT_ICONS[dept.slug] || Building2;
                const isOpen = activeDepartment === dept.slug;
                const fallbackDept = CONSTRUCTION_DEPARTMENTS.find((d) => d.slug === dept.slug);
                const isActive = isDeptActive({ slug: dept.slug, categorySlugs: fallbackDept?.categorySlugs });

                return (
                  <div
                    key={dept.id}
                    onMouseEnter={() => handleDeptMouseEnter(dept.slug)}
                    onMouseLeave={handleDeptMouseLeave}
                  >
                    <Link
                      to={`/categories/${dept.slug}`}
                      aria-expanded={isOpen}
                      aria-haspopup="true"
                      onFocus={() => handleDeptMouseEnter(dept.slug)}
                      onClick={() => {
                        setActiveDepartment(null);
                        setHoveredChildCategorySlug(null);
                      }}
                      className={`flex items-center gap-1.5 py-2 px-3 rounded-xl transition-all font-bold text-xs ${
                        isActive
                          ? 'bg-brand-blue-900 text-white shadow-sm'
                          : isOpen
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-700 hover:text-brand-blue-900 hover:bg-slate-200/70'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive || isOpen ? 'text-white' : 'text-brand-orange-500'}`} />
                      <span>{dept.name}</span>
                      <ChevronDown
                        className={`w-3 h-3 transition-transform duration-150 ${
                          isActive || isOpen ? 'text-white/80' : 'text-slate-400'
                        } ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </Link>
                  </div>
                );
              })}

              {/* New Launches (Promotional Collection) */}
              <div
                onMouseEnter={() => handleDeptMouseEnter('new-launches')}
                onMouseLeave={handleDeptMouseLeave}
              >
                <Link
                  to="/new-launches"
                  aria-expanded={activeDepartment === 'new-launches'}
                  aria-haspopup="true"
                  onFocus={() => handleDeptMouseEnter('new-launches')}
                  onClick={() => setActiveDepartment(null)}
                  className={`flex items-center gap-1.5 py-2 px-3 rounded-xl transition-all font-bold text-xs cursor-pointer select-none ${
                    isNewLaunchesActive
                      ? 'bg-brand-blue-900 text-white shadow-sm'
                      : activeDepartment === 'new-launches'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-700 hover:text-brand-blue-900 hover:bg-slate-200/70'
                  }`}
                  title="Explore New Launches Collection"
                >
                  <Rocket
                    className={`w-3.5 h-3.5 ${
                      isNewLaunchesActive || activeDepartment === 'new-launches'
                        ? 'text-white'
                        : 'text-brand-orange-500'
                    }`}
                  />
                  <span>New Launches</span>
                  <ChevronDown
                    className={`w-3 h-3 transition-transform duration-150 ${
                      isNewLaunchesActive || activeDepartment === 'new-launches'
                        ? 'text-white/80'
                        : 'text-slate-400'
                    } ${activeDepartment === 'new-launches' ? 'rotate-180' : ''}`}
                  />
                </Link>
              </div>

              <Link
                to="/deals"
                className={`py-2 px-3 rounded-xl font-black text-xs flex items-center gap-1 transition-all ${
                  isDealsActive
                    ? 'bg-brand-blue-900 text-white shadow-sm'
                    : 'text-brand-orange-600 hover:bg-orange-50'
                }`}
              >
                <Sparkles className={`w-3.5 h-3.5 fill-current ${isDealsActive ? 'text-white' : 'text-brand-orange-600'}`} />
                <span>Deals</span>
              </Link>

              {/* Separated Utility Navigation: Tools */}
              <div className="h-5 w-px bg-slate-300/80 mx-1" aria-hidden="true" />
              <div
                className="relative"
                onMouseEnter={() => {
                  setActiveDepartment(null);
                  setIsToolsOpen(true);
                }}
                onMouseLeave={() => setIsToolsOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setIsToolsOpen((v) => !v)}
                  className={`flex items-center gap-1.5 py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    location.pathname.startsWith('/tools') || isToolsOpen
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-700 hover:text-brand-blue-900 hover:bg-slate-200/70'
                  }`}
                >
                  <Calculator className={`w-3.5 h-3.5 ${location.pathname.startsWith('/tools') || isToolsOpen ? 'text-white' : 'text-brand-blue-900'}`} />
                  <span>Tools</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${isToolsOpen ? 'rotate-180' : ''}`} />
                </button>
                {isToolsOpen && (
                  <div className="absolute right-0 top-full pt-1.5 w-64 z-50">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-2 space-y-1">
                      <Link
                        to="/tools/material-estimator"
                        onClick={() => setIsToolsOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-50 hover:text-brand-blue-900"
                      >
                        <Calculator className="w-4 h-4 text-brand-blue-900" />
                        <span>Material Quantity Estimator</span>
                      </Link>
                      <Link
                        to="/tools/home-construction-calculator"
                        onClick={() => setIsToolsOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-50 hover:text-brand-orange-600"
                      >
                        <Compass className="w-4 h-4 text-brand-orange-500" />
                        <span>Home Construction Calculator</span>
                      </Link>
                      <Link
                        to="/knowledge-hub"
                        onClick={() => setIsToolsOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-50 hover:text-brand-blue-900"
                      >
                        <FolderKanban className="w-4 h-4 text-emerald-600" />
                        <span>Knowledge Hub &amp; Guides</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* FULL-SIZE SPACIOUS 4-LEVEL HOVER MEGA MENU */}
          {activeDepartment && (() => {
            const isNewLaunches = activeDepartment === 'new-launches';
            const activeDept = !isNewLaunches
              ? visibleMainCategories.find((d) => d.slug === activeDepartment) ||
                CONSTRUCTION_DEPARTMENTS.find((d) => d.slug === activeDepartment)
              : null;

            if (!isNewLaunches && !activeDept) return null;

            // Categories list for Panel 1: Child Categories under active Main Category (or New Launch featured groups)
            const menuCategories = isNewLaunches
              ? NEW_LAUNCHES_CATEGORIES
              : getMainChildCategories(activeDept!.slug);

            const categorySource = catalogCategories.length > 0 ? catalogCategories : MASTER_CATEGORIES;

            // Currently hovered Child Category in Panel 1
            const currentCat = menuCategories.find((c) => c.slug === selectedParentCategorySlug);

            // Product Types for Panel 2
            type MenuProductType = {
              id: string;
              name: string;
              slug: string;
              targetMasterSlug: string;
              targetMasterName: string;
              productCount?: number;
            };

            let subcategories: MenuProductType[] = [];
            if (currentCat) {
              if (isNewLaunches) {
                const nlCat = currentCat as (typeof NEW_LAUNCHES_CATEGORIES)[0];
                const masterCat = categorySource.find((m) => m.slug === nlCat.masterCategorySlug);
                subcategories = (masterCat?.subcategories || []).map((sub: any) => ({
                  id: sub.id,
                  name: sub.name,
                  slug: sub.slug,
                  targetMasterSlug: masterCat?.slug || nlCat.masterCategorySlug || nlCat.slug,
                  targetMasterName: masterCat?.name || nlCat.name,
                  productCount: sub.productCount ?? sub.itemCount,
                }));
              } else {
                const deptCat = currentCat as Category;
                subcategories = (deptCat.subcategories || []).map((sub: any) => ({
                  id: sub.id,
                  name: sub.name,
                  slug: sub.slug,
                  targetMasterSlug: deptCat.slug,
                  targetMasterName: deptCat.name,
                  productCount: sub.productCount ?? sub.itemCount,
                }));
              }
            }

            // All Product Types when 'all' is hovered
            const allSubcategories: MenuProductType[] = menuCategories.flatMap((cat) => {
              if (isNewLaunches) {
                const nlCat = cat as (typeof NEW_LAUNCHES_CATEGORIES)[0];
                const masterCat = categorySource.find((m) => m.slug === nlCat.masterCategorySlug);
                return (masterCat?.subcategories || []).map((sub: any) => ({
                  id: sub.id,
                  name: sub.name,
                  slug: sub.slug,
                  targetMasterSlug: masterCat?.slug || nlCat.masterCategorySlug || nlCat.slug,
                  targetMasterName: masterCat?.name || nlCat.name,
                  productCount: sub.productCount ?? sub.itemCount,
                }));
              } else {
                const deptCat = cat as Category;
                return (deptCat.subcategories || []).map((sub: any) => ({
                  id: sub.id,
                  name: sub.name,
                  slug: sub.slug,
                  targetMasterSlug: deptCat.slug,
                  targetMasterName: deptCat.name,
                  productCount: sub.productCount ?? sub.itemCount,
                }));
              }
            });

            const displayedSubcategories =
              selectedParentCategorySlug === 'all' ? allSubcategories : subcategories;

            const activeChildCat =
              displayedSubcategories.find(
                (s) =>
                  s.slug === hoveredChildCategorySlug &&
                  (!hoveredChildMasterSlug || s.targetMasterSlug === hoveredChildMasterSlug)
              ) || null;

            const currentMainSlug =
              selectedParentCategorySlug !== 'all'
                ? isNewLaunches
                  ? (currentCat as any)?.masterCategorySlug || currentCat?.slug
                  : currentCat?.slug
                : undefined;

            const productSource =
              isNewLaunches && newLaunchProducts.length > 0 ? newLaunchProducts : catalogProducts;

            const matchingPanelProducts = productSource.filter((p) => {
              if (activeChildCat) {
                const pChildSlug = (p.childCategorySlug || p.categorySlug || '').toLowerCase();
                const matchChild =
                  pChildSlug === activeChildCat.slug.toLowerCase() ||
                  pChildSlug === activeChildCat.targetMasterSlug.toLowerCase() ||
                  (p as any).childCategoryId === activeChildCat.targetMasterSlug;
                const pTypeSlug = (p.productTypeSlug || p.subcategorySlug || '').toLowerCase();
                const pTypeName = (p.productTypeName || p.subcategory || '').toLowerCase();
                const matchSub =
                  pTypeSlug === activeChildCat.slug.toLowerCase() ||
                  pTypeName === activeChildCat.name.toLowerCase() ||
                  (p as any).productTypeId === activeChildCat.id ||
                  (p as any).subcategoryId === activeChildCat.id;
                return matchChild && matchSub;
              }
              if (currentMainSlug) {
                return (
                  (p.childCategorySlug || p.categorySlug) === currentMainSlug ||
                  (p as any).childCategoryId === currentMainSlug
                );
              }
              if (isNewLaunches) {
                return Boolean(p.isNewLaunch);
              }
              const activeChildSlugs = menuCategories.map((c) => c.slug);
              return (
                p.mainCategorySlug === activeDept?.slug ||
                p.mainCategoryId === activeDept?.id ||
                activeChildSlugs.includes(p.childCategorySlug || p.categorySlug)
              );
            });

            const previewProducts = matchingPanelProducts.slice(0, 6);
            const panelHeading = activeChildCat
              ? activeChildCat.name
              : currentCat
              ? `Featured in ${currentCat.name}`
              : isNewLaunches
              ? 'Featured New Launches Collection'
              : `Top in ${activeDept?.name}`;
            const panelViewAllUrl = activeChildCat
              ? `/categories/${activeChildCat.targetMasterSlug}/${activeChildCat.slug}`
              : currentMainSlug
              ? `/categories/${currentMainSlug}`
              : isNewLaunches
              ? '/new-launches'
              : `/categories/${activeDept?.slug || ''}`;

            return (
              <div
                className="absolute top-full left-0 right-0 pt-2 z-50 flex justify-center px-4 sm:px-6 lg:px-8 pointer-events-auto"
                onMouseEnter={() => {
                  if (hoverTimeoutRef.current) {
                    clearTimeout(hoverTimeoutRef.current);
                    hoverTimeoutRef.current = null;
                  }
                }}
                onMouseLeave={handleDeptMouseLeave}
              >
                <div className="w-full max-w-[1320px] xl:max-w-[1440px] bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden transition-all duration-150 animate-in fade-in-0 slide-in-from-top-1">
                  <div className="flex min-h-[420px] max-h-[540px]">
                    {/* PANEL 1: CHILD CATEGORIES UNDER ACTIVE MAIN CATEGORY */}
                    <div className="w-[240px] sm:w-[270px] flex-shrink-0 border-r border-slate-100 bg-white p-4 sm:p-5 overflow-y-auto no-scrollbar">
                      <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-3 px-3">
                        {isNewLaunches ? 'FEATURED COLLECTIONS' : 'CHILD CATEGORIES'}
                      </div>
                      <div className="space-y-1">
                        {/* ALL Category Item */}
                        <button
                          type="button"
                          onMouseEnter={() => {
                            setSelectedParentCategorySlug('all');
                            setHoveredChildCategorySlug(null);
                            setHoveredChildMasterSlug(null);
                          }}
                          onFocus={() => {
                            setSelectedParentCategorySlug('all');
                            setHoveredChildCategorySlug(null);
                            setHoveredChildMasterSlug(null);
                          }}
                          onClick={() => {
                            setActiveDepartment(null);
                            navigate(isNewLaunches ? '/new-launches' : `/categories/${activeDept?.slug}`);
                          }}
                          className={`w-full group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                            selectedParentCategorySlug === 'all'
                              ? 'bg-slate-900 text-white font-black shadow-xs'
                              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-bold'
                          }`}
                        >
                          <span className="truncate">
                            {isNewLaunches ? 'ALL NEW LAUNCHES' : `All in ${activeDept?.name}`}
                          </span>
                          <ChevronRight
                            className={`w-4 h-4 flex-shrink-0 transition-transform ${
                              selectedParentCategorySlug === 'all'
                                ? 'text-brand-orange-400 translate-x-0.5'
                                : 'text-slate-300 group-hover:text-slate-500'
                            }`}
                          />
                        </button>

                        {/* Child Category Items */}
                        {menuCategories.map((cat) => {
                          const isSelected = selectedParentCategorySlug === cat.slug;
                          const targetUrl = isNewLaunches
                            ? `/categories/${(cat as (typeof NEW_LAUNCHES_CATEGORIES)[0]).masterCategorySlug || cat.slug}`
                            : `/categories/${cat.slug}`;

                          return (
                            <Link
                              key={cat.id}
                              to={targetUrl}
                              onClick={() => {
                                setActiveDepartment(null);
                                setHoveredChildCategorySlug(null);
                              }}
                              onMouseEnter={() => {
                                setSelectedParentCategorySlug(cat.slug);
                                setHoveredChildCategorySlug(null);
                                setHoveredChildMasterSlug(null);
                              }}
                              onFocus={() => {
                                setSelectedParentCategorySlug(cat.slug);
                                setHoveredChildCategorySlug(null);
                                setHoveredChildMasterSlug(null);
                              }}
                              className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-slate-900 text-white font-black shadow-xs'
                                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-bold'
                              }`}
                              title={`View all ${cat.name}`}
                            >
                              <span className="truncate flex-1 min-w-0">{cat.name}</span>
                              <ChevronRight
                                className={`w-4 h-4 flex-shrink-0 transition-transform ${
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

                    {/* PANEL 2: PRODUCT TYPES FOR HOVERED CHILD CATEGORY */}
                    <div className="w-[270px] sm:w-[300px] flex-shrink-0 border-r border-slate-100 bg-slate-50/40 p-4 sm:p-5 overflow-y-auto no-scrollbar flex flex-col">
                      <div className="flex items-center justify-between gap-2 mb-3 px-1">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 truncate">
                          {currentCat ? `${currentCat.name} → Product Types` : 'PRODUCT TYPES'}
                        </span>
                      </div>

                      {displayedSubcategories.length > 0 ? (
                        <div className="space-y-1">
                          {displayedSubcategories.map((sub) => {
                            const subUrl = `/categories/${sub.targetMasterSlug}/${sub.slug}`;
                            const isChildHovered =
                              hoveredChildCategorySlug === sub.slug &&
                              (!hoveredChildMasterSlug || hoveredChildMasterSlug === sub.targetMasterSlug);

                            return (
                              <Link
                                key={`${sub.targetMasterSlug}-${sub.id}`}
                                to={subUrl}
                                onClick={() => {
                                  setActiveDepartment(null);
                                  setHoveredChildCategorySlug(null);
                                }}
                                onMouseEnter={() => {
                                  setHoveredChildCategorySlug(sub.slug);
                                  setHoveredChildMasterSlug(sub.targetMasterSlug);
                                }}
                                onFocus={() => {
                                  setHoveredChildCategorySlug(sub.slug);
                                  setHoveredChildMasterSlug(sub.targetMasterSlug);
                                }}
                                className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                  isChildHovered
                                    ? 'bg-brand-blue-900 text-white font-bold shadow-xs'
                                    : 'text-slate-700 hover:text-brand-blue-900 hover:bg-white border border-transparent hover:border-slate-200/80'
                                }`}
                              >
                                <div className="min-w-0 flex-1 pr-2">
                                  <div className="truncate">{sub.name}</div>
                                  {selectedParentCategorySlug === 'all' && (
                                    <div
                                      className={`text-[10px] truncate ${
                                        isChildHovered ? 'text-blue-200' : 'text-slate-400'
                                      }`}
                                    >
                                      {sub.targetMasterName}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  {typeof sub.productCount === 'number' && (
                                    <span
                                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                        isChildHovered
                                          ? 'bg-white/20 text-white'
                                          : 'bg-slate-200/70 text-slate-600'
                                      }`}
                                    >
                                      {sub.productCount}
                                    </span>
                                  )}
                                  <ChevronRight
                                    className={`w-3.5 h-3.5 transition-all ${
                                      isChildHovered
                                        ? 'text-brand-orange-400 translate-x-0.5'
                                        : 'text-slate-300 group-hover:text-brand-blue-900'
                                    }`}
                                  />
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-center text-xs font-medium text-slate-400 text-center px-3">
                          No product types configured.
                        </div>
                      )}
                    </div>

                    {/* PANEL 3: SECONDARY MATCHING PRODUCTS PANEL */}
                    <div className="flex-1 bg-white p-5 sm:p-6 overflow-y-auto no-scrollbar flex flex-col">
                      <div className="flex items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-100">
                        <div className="min-w-0">
                          <div className="text-[10px] font-black uppercase tracking-wider text-brand-orange-600">
                            {activeChildCat
                              ? `${activeChildCat.targetMasterName} › ${activeChildCat.name}`
                              : currentCat
                              ? currentCat.name
                              : activeDept?.name || 'Matching Products'}
                          </div>
                          <h4 className="text-sm font-black text-slate-900 truncate mt-0.5">
                            {panelHeading}
                          </h4>
                        </div>
                        <Link
                          to={panelViewAllUrl}
                          onClick={() => setActiveDepartment(null)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-brand-blue-900 hover:text-brand-orange-600 transition-colors flex-shrink-0"
                        >
                          <span>View all ({matchingPanelProducts.length})</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>

                      {isLoadingProducts && catalogProducts.length === 0 ? (
                        <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 animate-pulse">
                          {Array.from({ length: 6 }).map((_, idx) => (
                            <div key={idx} className="h-24 rounded-xl bg-slate-100" />
                          ))}
                        </div>
                      ) : previewProducts.length > 0 ? (
                        <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                          {previewProducts.map((prod) => (
                            <Link
                              key={prod.id}
                              to={`/products/${prod.slug}`}
                              onClick={() => {
                                setActiveDepartment(null);
                                setHoveredChildCategorySlug(null);
                              }}
                              className="group flex items-start gap-3 p-3 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-brand-blue-200 hover:shadow-md transition-all"
                            >
                              <div className="w-14 h-14 rounded-xl bg-white border border-slate-100 overflow-hidden flex-shrink-0">
                                {prod.images?.[0] ? (
                                  <img
                                    src={prod.images[0]}
                                    alt={prod.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-400">
                                    SKU
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-[10px] font-bold text-slate-400 uppercase truncate">
                                  {prod.brand}
                                </div>
                                <div className="text-xs font-bold text-slate-800 group-hover:text-brand-blue-900 line-clamp-2 leading-snug mt-0.5">
                                  {prod.name}
                                </div>
                                <div className="flex items-center gap-1.5 mt-1.5">
                                  <span className="text-xs font-black text-slate-900">
                                    ₹{Number(prod.price || 0).toLocaleString('en-IN')}
                                  </span>
                                  {prod.mrp > prod.price && (
                                    <span className="text-[10px] text-slate-400 line-through">
                                      ₹{Number(prod.mrp).toLocaleString('en-IN')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="flex-1 min-h-[220px] flex flex-col items-center justify-center text-center px-4">
                          <p className="text-xs font-semibold text-slate-500">
                            No approved products available yet in this category.
                          </p>
                          <Link
                            to={panelViewAllUrl}
                            onClick={() => setActiveDepartment(null)}
                            className="mt-2 text-xs font-bold text-brand-blue-900 hover:underline"
                          >
                            Browse category page →
                          </Link>
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
          <div className="lg:hidden bg-white border-t border-slate-200 px-4 py-4 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
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

            {/* Primary Mobile Navigation: Home */}
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 p-3 rounded-xl text-xs font-black transition-colors ${
                isHomeActive
                  ? 'bg-brand-blue-900 text-white shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200'
              }`}
            >
              <Home className={`w-4 h-4 ${isHomeActive ? 'text-white' : 'text-brand-orange-500'}`} />
              <span>Home</span>
            </Link>

            {/* Main Categories Mobile Accordion */}
            <div className="space-y-1.5">
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-extrabold px-1">
                Main Categories
              </div>
              <div className="space-y-1">
                {visibleMainCategories.map((dept) => {
                  const Icon = DEPARTMENT_ICONS[dept.slug] || Building2;
                  const fallbackDept = CONSTRUCTION_DEPARTMENTS.find((d) => d.slug === dept.slug);
                  const isActive = isDeptActive({ slug: dept.slug, categorySlugs: fallbackDept?.categorySlugs });
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
                          {deptCats.map((cat) => {
                            const isCatExpanded = mobileExpandedCat === cat.slug;
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
                                  {cat.subcategories && cat.subcategories.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => setMobileExpandedCat(isCatExpanded ? null : cat.slug)}
                                      className="p-1 text-slate-400 hover:text-slate-600 flex-shrink-0"
                                      aria-label={`Toggle product types for ${cat.name}`}
                                    >
                                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isCatExpanded ? 'rotate-180' : ''}`} />
                                    </button>
                                  )}
                                </div>

                                {/* Product Types list */}
                                {isCatExpanded && cat.subcategories && cat.subcategories.length > 0 && (
                                  <div className="pl-6 pr-2 py-1.5 bg-slate-50/80 border-t border-slate-100 space-y-1 text-[11px]">
                                    {cat.subcategories.map((sub) => (
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
                        setMobileExpandedCat(NEW_LAUNCHES_CATEGORIES[0]?.slug || null);
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

                      {NEW_LAUNCHES_CATEGORIES.map((cat) => {
                        const isCatExpanded = mobileExpandedCat === cat.slug;
                        const mCat = MASTER_CATEGORIES.find((m) => m.slug === cat.masterCategorySlug);
                        const subs = mCat ? mCat.subcategories || [] : [];
                        const targetCategorySlug = mCat?.slug || cat.masterCategorySlug || cat.slug;

                        return (
                          <div key={cat.id} className="bg-white rounded-lg border border-slate-200/70 overflow-hidden">
                            <div className="flex items-center justify-between p-2 text-xs font-bold text-slate-800">
                              <Link
                                to={`/categories/${targetCategorySlug}`}
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
                                {subs.map((sub) => (
                                  <Link
                                    key={sub.id}
                                    to={`/categories/${targetCategorySlug}/${sub.slug}`}
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
      <AuthModal />
      <CartDrawer isOpen={isCartDrawerOpen} onClose={() => setIsCartDrawerOpen(false)} />
    </>
  );
};
