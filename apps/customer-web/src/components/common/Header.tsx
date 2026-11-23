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
  NEW_LAUNCHES_CATEGORIES
} from '@buildora/constants';
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

  // Active mega menu department dropdown
  const [activeDepartment, setActiveDepartment] = useState<string | null>(null);
  const [selectedParentCategorySlug, setSelectedParentCategorySlug] = useState<string | null>(null);
  const [isAllCategoriesOpen, setIsAllCategoriesOpen] = useState(false);

  // Mobile navigation accordion state
  const [mobileExpandedDept, setMobileExpandedDept] = useState<string | null>(null);
  const [mobileExpandedCat, setMobileExpandedCat] = useState<string | null>(null);

  const megaMenuRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced hover handlers for smooth, flicker-free mega menu opening/closing
  const handleDeptMouseEnter = (deptSlug: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (activeDepartment !== deptSlug) {
      setActiveDepartment(deptSlug);
      const isNL = deptSlug === 'new-launches';
      const cats = isNL ? NEW_LAUNCHES_CATEGORIES : getDepartmentCategories(deptSlug);
      setSelectedParentCategorySlug(cats[0]?.slug || 'all');
    }
  };

  const handleDeptMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveDepartment(null);
    }, 200);
  };

  // Close menus on route change, outside click, or escape
  useEffect(() => {
    setActiveDepartment(null);
    setIsMobileMenuOpen(false);
    setMobileExpandedDept(null);
    setMobileExpandedCat(null);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (megaMenuRef.current && !megaMenuRef.current.contains(event.target as Node)) {
        setActiveDepartment(null);
        setIsAllCategoriesOpen(false);
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

  const getDepartmentCategories = (deptSlug: string) => {
    const dept = CONSTRUCTION_DEPARTMENTS.find((d) => d.slug === deptSlug);
    if (!dept) return [];
    return MASTER_CATEGORIES.filter((c) => dept.categorySlugs.includes(c.slug));
  };

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

  const isDeptActive = (dept: (typeof CONSTRUCTION_DEPARTMENTS)[0]) => {
    if (location.pathname === `/categories/${dept.slug}`) return true;
    if (location.pathname.startsWith('/categories/')) {
      const catSlug = location.pathname.split('/')[2];
      return dept.categorySlugs.includes(catSlug) || dept.slug === catSlug;
    }
    return false;
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm transition-all duration-200">
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

              {/* 5 Main Construction Departments */}
              {CONSTRUCTION_DEPARTMENTS.map((dept) => {
                const Icon = DEPARTMENT_ICONS[dept.slug] || Building2;
                const isOpen = activeDepartment === dept.slug;
                const isActive = isDeptActive(dept);

                return (
                  <div
                    key={dept.id}
                    onMouseEnter={() => handleDeptMouseEnter(dept.slug)}
                    onMouseLeave={handleDeptMouseLeave}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (activeDepartment === dept.slug) {
                          setActiveDepartment(null);
                        } else {
                          setActiveDepartment(dept.slug);
                          const cats = getDepartmentCategories(dept.slug);
                          setSelectedParentCategorySlug(cats[0]?.slug || 'all');
                        }
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
                    </button>
                  </div>
                );
              })}

              {/* New Launches with Mega Menu trigger */}
              <div
                onMouseEnter={() => handleDeptMouseEnter('new-launches')}
                onMouseLeave={handleDeptMouseLeave}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (activeDepartment === 'new-launches') {
                      setActiveDepartment(null);
                    } else {
                      setActiveDepartment('new-launches');
                      setSelectedParentCategorySlug(NEW_LAUNCHES_CATEGORIES[0]?.slug || 'all');
                    }
                  }}
                  className={`flex items-center gap-1.5 py-2 px-3 rounded-xl transition-all font-bold text-xs cursor-pointer select-none ${
                    isNewLaunchesActive
                      ? 'bg-brand-blue-900 text-white shadow-sm'
                      : activeDepartment === 'new-launches'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-700 hover:text-brand-blue-900 hover:bg-slate-200/70'
                  }`}
                  title="Explore New Launches"
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
                </button>
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
            </div>
          </div>

          {/* FULL-SIZE SPACIOUS MEGA MENU CONTAINER */}
          {activeDepartment && (() => {
            const isNewLaunches = activeDepartment === 'new-launches';
            const activeDept = !isNewLaunches
              ? CONSTRUCTION_DEPARTMENTS.find((d) => d.slug === activeDepartment)
              : null;

            if (!isNewLaunches && !activeDept) return null;

            // Categories list for left panel: New Launches or Department categories
            const menuCategories = isNewLaunches
              ? NEW_LAUNCHES_CATEGORIES
              : getDepartmentCategories(activeDept!.slug);

            // Currently active category in mega menu
            const currentCat = menuCategories.find((c) => c.slug === selectedParentCategorySlug);

            // Subcategories for right panel
            let subcategories: { id: string; name: string; slug: string; targetMasterSlug: string }[] = [];
            if (currentCat) {
              if (isNewLaunches) {
                const nlCat = currentCat as (typeof NEW_LAUNCHES_CATEGORIES)[0];
                const masterCat = MASTER_CATEGORIES.find((m) => m.slug === nlCat.masterCategorySlug);
                subcategories = (masterCat?.subcategories || []).map((sub) => ({
                  ...sub,
                  targetMasterSlug: masterCat?.slug || nlCat.masterCategorySlug || nlCat.slug
                }));
              } else {
                const deptCat = currentCat as (typeof MASTER_CATEGORIES)[0];
                subcategories = (deptCat.subcategories || []).map((sub) => ({
                  ...sub,
                  targetMasterSlug: deptCat.slug
                }));
              }
            }

            // All subcategories when 'all' is selected
            const allSubcategories = menuCategories.flatMap((cat) => {
              if (isNewLaunches) {
                const nlCat = cat as (typeof NEW_LAUNCHES_CATEGORIES)[0];
                const masterCat = MASTER_CATEGORIES.find((m) => m.slug === nlCat.masterCategorySlug);
                return (masterCat?.subcategories || []).map((sub) => ({
                  ...sub,
                  targetMasterSlug: masterCat?.slug || nlCat.masterCategorySlug || nlCat.slug
                }));
              } else {
                const deptCat = cat as (typeof MASTER_CATEGORIES)[0];
                return (deptCat.subcategories || []).map((sub) => ({
                  ...sub,
                  targetMasterSlug: deptCat.slug
                }));
              }
            });

            const displayedSubcategories =
              selectedParentCategorySlug === 'all' ? allSubcategories : subcategories;

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
                <div className="w-full max-w-[1240px] xl:max-w-[1360px] bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden animate-in fade-in-0 slide-in-from-top-1 duration-150">
                  <div className="flex min-h-[400px] max-h-[540px]">
                    {/* LEFT PANEL: MAIN CATEGORIES */}
                    <div className="w-[280px] sm:w-[320px] flex-shrink-0 border-r border-slate-100 bg-white p-5 overflow-y-auto no-scrollbar">
                      <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-3 px-3">
                        MAIN CATEGORIES
                      </div>
                      <div className="space-y-1.5">
                        {/* ALL Category Item */}
                        <button
                          type="button"
                          onMouseEnter={() => setSelectedParentCategorySlug('all')}
                          onClick={() => {
                            setActiveDepartment(null);
                            navigate(isNewLaunches ? '/new-launches' : '/products');
                          }}
                          className={`w-full group flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                            selectedParentCategorySlug === 'all'
                              ? 'bg-slate-900 text-white font-black shadow-xs'
                              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-bold'
                          }`}
                        >
                          <span className="uppercase">ALL</span>
                          <ChevronRight
                            className={`w-4 h-4 flex-shrink-0 transition-transform ${
                              selectedParentCategorySlug === 'all'
                                ? 'text-brand-orange-400 translate-x-0.5'
                                : 'text-slate-300 group-hover:text-slate-500'
                            }`}
                          />
                        </button>

                        {/* Category Items */}
                        {menuCategories.map((cat) => {
                          const isSelected = selectedParentCategorySlug === cat.slug;
                          const targetUrl = isNewLaunches
                            ? `/categories/${(cat as (typeof NEW_LAUNCHES_CATEGORIES)[0]).masterCategorySlug || cat.slug}`
                            : `/categories/${cat.slug}`;

                          return (
                            <Link
                              key={cat.id}
                              to={targetUrl}
                              onClick={() => setActiveDepartment(null)}
                              onMouseEnter={() => setSelectedParentCategorySlug(cat.slug)}
                              className={`group flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-slate-900 text-white font-black shadow-xs'
                                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-bold'
                              }`}
                              title={`View ${cat.name}`}
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

                    {/* RIGHT PANEL: ALL CHILD CATEGORIES */}
                    <div className="flex-1 bg-white p-6 sm:p-8 overflow-y-auto no-scrollbar flex flex-col">
                      <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-4">
                        ALL CHILD CATEGORIES
                      </div>

                      {displayedSubcategories.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                          {displayedSubcategories.map((sub) => {
                            const subUrl = `/categories/${sub.targetMasterSlug}/${sub.slug}`;

                            return (
                              <Link
                                key={`${sub.targetMasterSlug}-${sub.id}`}
                                to={subUrl}
                                onClick={() => setActiveDepartment(null)}
                                className="group flex items-center justify-between p-3.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-brand-blue-900 bg-slate-50/70 hover:bg-brand-blue-50/60 border border-slate-100/90 hover:border-brand-blue-200/70 transition-all shadow-2xs hover:shadow-xs"
                              >
                                <span className="truncate group-hover:font-bold">{sub.name}</span>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-brand-blue-900 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                              </Link>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex-1 min-h-[240px] flex items-center justify-center text-xs font-medium text-slate-400">
                          No third-level categories configured for Products.
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

            {/* Construction Departments Accordion */}
            <div className="space-y-1.5">
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-extrabold px-1">
                Construction Departments
              </div>
              <div className="space-y-1">
                {CONSTRUCTION_DEPARTMENTS.map((dept) => {
                  const Icon = DEPARTMENT_ICONS[dept.slug] || Building2;
                  const isActive = isDeptActive(dept);
                  const isDeptExpanded = mobileExpandedDept === dept.slug;
                  const deptCats = getDepartmentCategories(dept.slug);

                  return (
                    <div key={dept.id} className="rounded-xl border border-slate-100 overflow-hidden bg-white">
                      {/* Department Trigger Button */}
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

                      {/* Expanded Parent Categories on Mobile */}
                      {isDeptExpanded && (
                        <div className="p-2 bg-slate-50 border-t border-slate-100 space-y-1.5 animate-in fade-in-0 duration-150">
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
                                      aria-label={`Toggle subcategories for ${cat.name}`}
                                    >
                                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isCatExpanded ? 'rotate-180' : ''}`} />
                                    </button>
                                  )}
                                </div>

                                {/* Child subcategories list */}
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
                to="/bulk-orders"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2 px-2.5 hover:bg-slate-50 rounded-lg text-brand-orange-600"
              >
                Commercial Bulk Quotations
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
