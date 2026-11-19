import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  ShoppingCart,
  Heart,
  User,
  Menu,
  X,
  Zap,
  ChevronDown,
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
  Award
} from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import { useLocationStore } from '../../store/useLocationStore';
import { useWishlistStore } from '../../store/useWishlistStore';
import { useAuthStore } from '../../store/useAuthStore';
import {
  MASTER_CATEGORIES,
  CONSTRUCTION_DEPARTMENTS
} from '@buildora/constants';
import { formatCurrency } from '@buildora/utils';
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

  // Stores
  const { getSummary } = useCartStore();
  const summary = getSummary();
  const { pincode, cityName, etaMinutes, openLocationModal } = useLocationStore();
  const { items: wishlistItems } = useWishlistStore();
  const { isAuthenticated, user, logout, openAuthModal } = useAuthStore();

  // Modals & Drawers state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  // Active mega menu department dropdown
  const [activeDepartment, setActiveDepartment] = useState<string | null>(null);
  const [isAllCategoriesOpen, setIsAllCategoriesOpen] = useState(false);

  const accountRef = useRef<HTMLDivElement>(null);
  const megaMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click or escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
      if (megaMenuRef.current && !megaMenuRef.current.contains(event.target as Node)) {
        setActiveDepartment(null);
        setIsAllCategoriesOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAccountMenuOpen(false);
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

  const getDepartmentCategories = (deptSlug: string) => {
    const dept = CONSTRUCTION_DEPARTMENTS.find((d) => d.slug === deptSlug);
    if (!dept) return [];
    return MASTER_CATEGORIES.filter((c) => dept.categorySlugs.includes(c.slug));
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm transition-all duration-200">
        {/* 1. TOP ANNOUNCEMENT BAR */}
        <div className="bg-brand-blue-950 text-slate-200 text-xs py-1 px-3 sm:px-4 font-medium border-b border-brand-blue-900">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 truncate">
              <span className="flex items-center gap-1.5 text-amber-400 font-bold tracking-wide flex-shrink-0">
                <Zap className="w-3.5 h-3.5 fill-current animate-pulse text-amber-400" />
                60-MIN SITE DISPATCH ACTIVE
              </span>
              <span className="hidden sm:inline text-slate-400">|</span>
              <span className="hidden md:inline text-slate-300 truncate">
                Direct Mill Materials from Indiranagar &amp; Regional Dark Stores
              </span>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 text-[11px] flex-shrink-0">
              <Link to="/tools/material-estimator" className="hover:text-amber-300 flex items-center gap-1 transition-colors">
                <Calculator className="w-3 h-3 text-brand-orange-400" />
                <span className="hidden sm:inline">Material Estimator</span>
              </Link>
              <Link to="/bulk-orders" className="hover:text-amber-300 flex items-center gap-1 transition-colors">
                <Truck className="w-3 h-3 text-emerald-400" />
                <span className="hidden sm:inline">Bulk Orders</span>
              </Link>
              <a href="tel:18006028453" className="hidden lg:flex items-center gap-1 hover:text-white transition-colors">
                <PhoneCall className="w-3 h-3 text-cyan-400" /> 1800-60-BUILD
              </a>
            </div>
          </div>
        </div>

        {/* 2. MAIN HEADER ROW */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3">
          {/* A. DESKTOP LAYOUT (lg & above)
              STRICT ORDER: Logo → Location → Search → My Account → Wishlist → Notifications → Wallet → Cart
          */}
          <div className="hidden lg:flex items-center justify-between gap-3 xl:gap-4">
            {/* 1. Logo */}
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
              <div className="w-10 h-10 rounded-xl bg-brand-blue-900 flex items-center justify-center text-white font-extrabold text-2xl shadow-md group-hover:bg-brand-orange-500 transition-colors">
                B
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xl tracking-tight text-slate-900 leading-none">
                  BUILDORA<span className="text-brand-orange-500 ml-0.5">60</span>
                </span>
                <span className="text-[9px] font-extrabold text-brand-blue-800 tracking-wider uppercase mt-1">
                  BUILD SMART. DELIVER FAST.
                </span>
              </div>
            </Link>

            {/* 2. Deliver-To Location Pill */}
            <button
              type="button"
              onClick={openLocationModal}
              className="flex items-center gap-2 py-1.5 px-2.5 xl:px-3 rounded-xl border border-slate-200 hover:border-brand-blue-400 bg-slate-50 hover:bg-brand-blue-50/40 transition-all text-left flex-shrink-0 group"
              title="Change Delivery Site Pincode"
            >
              <div className="w-8 h-8 rounded-lg bg-brand-orange-100 flex items-center justify-center text-brand-orange-600 group-hover:scale-105 transition-transform flex-shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-xs leading-tight min-w-0">
                <span className="text-[10px] text-slate-400 font-medium">Deliver to</span>
                <span className="font-bold text-slate-800 flex items-center gap-1 truncate max-w-[130px] xl:max-w-[150px]">
                  {pincode} ({cityName.split(',')[0]})
                  <ChevronDown className="w-3 h-3 text-slate-400 flex-shrink-0" />
                </span>
              </div>
              {etaMinutes > 0 && (
                <span className="ml-1 bg-emerald-100 text-emerald-800 text-[10px] font-black px-1.5 py-0.5 rounded-md flex-shrink-0">
                  {etaMinutes}m
                </span>
              )}
            </button>

            {/* 3. Search Bar */}
            <div className="flex-1 max-w-xl mx-1 xl:mx-2">
              <SmartSearchBar />
            </div>

            {/* 4. My Account */}
            <div ref={accountRef} className="relative flex-shrink-0">
              {isAuthenticated && user ? (
                <button
                  type="button"
                  onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                  className="flex items-center gap-2 p-1.5 xl:px-3 xl:py-2 rounded-xl border border-slate-200 hover:border-brand-blue-400 text-xs font-bold text-slate-800 bg-white shadow-sm transition-all"
                  title="My Account Menu"
                >
                  <div className="w-7 h-7 rounded-lg bg-brand-blue-900 text-white flex items-center justify-center font-black text-xs shadow-sm">
                    {user.name ? user.name.charAt(0) : 'U'}
                  </div>
                  <span className="hidden xl:inline truncate max-w-[100px]">{user.name || user.phone}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuthModal('/account', 'Sign in to access your Buildora account and saved details')}
                  className="flex items-center gap-1.5 py-2 px-3 xl:px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 transition-colors shadow-sm"
                  title="Sign In to Account"
                >
                  <User className="w-4 h-4 text-slate-600" />
                  <span className="hidden xl:inline">Sign In</span>
                </button>
              )}

              {/* Account Dropdown Menu */}
              {isAccountMenuOpen && isAuthenticated && user && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <div className="font-black text-slate-900 truncate">{user.name}</div>
                    <div className="text-[11px] text-slate-500">+91 {user.phone}</div>
                    {user.businessName && (
                      <div className="text-[10px] text-brand-blue-800 font-bold truncate mt-0.5">
                        {user.businessName}
                      </div>
                    )}
                  </div>
                  <div className="py-1">
                    <Link
                      to="/account"
                      onClick={() => setIsAccountMenuOpen(false)}
                      className="block px-4 py-2 hover:bg-slate-50 font-bold text-brand-blue-900"
                    >
                      Account Dashboard Overview
                    </Link>
                    <Link
                      to="/account/orders"
                      onClick={() => setIsAccountMenuOpen(false)}
                      className="block px-4 py-2 hover:bg-slate-50 font-medium text-slate-700"
                    >
                      My Orders &amp; Dispatches
                    </Link>
                    <Link
                      to="/account/wallet"
                      onClick={() => setIsAccountMenuOpen(false)}
                      className="flex items-center justify-between px-4 py-2 hover:bg-slate-50 font-medium text-slate-700"
                    >
                      <span>Buildora Wallet</span>
                      <span className="font-extrabold text-emerald-600">
                        {formatCurrency(user.walletBalance)}
                      </span>
                    </Link>
                    <Link
                      to="/account/rewards"
                      onClick={() => setIsAccountMenuOpen(false)}
                      className="flex items-center justify-between px-4 py-2 hover:bg-slate-50 font-medium text-slate-700"
                    >
                      <span>Contractor Rewards</span>
                      <span className="font-extrabold text-amber-600">{user.rewardPoints} pts</span>
                    </Link>
                    <Link
                      to="/account/addresses"
                      onClick={() => setIsAccountMenuOpen(false)}
                      className="block px-4 py-2 hover:bg-slate-50 font-medium text-slate-700"
                    >
                      Site Delivery Addresses
                    </Link>
                    <Link
                      to="/account/projects"
                      onClick={() => setIsAccountMenuOpen(false)}
                      className="block px-4 py-2 hover:bg-slate-50 font-medium text-slate-700"
                    >
                      Project Procurement Lists
                    </Link>
                    <Link
                      to="/account/profile"
                      onClick={() => setIsAccountMenuOpen(false)}
                      className="block px-4 py-2 hover:bg-slate-50 font-medium text-slate-700"
                    >
                      Profile Settings &amp; GSTIN
                    </Link>
                    <Link
                      to="/account/security"
                      onClick={() => setIsAccountMenuOpen(false)}
                      className="block px-4 py-2 hover:bg-slate-50 font-medium text-slate-700"
                    >
                      Security &amp; PIN Settings
                    </Link>
                  </div>
                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setIsAccountMenuOpen(false);
                        navigate('/');
                      }}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 font-bold"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Wishlist */}
            <Link
              to="/wishlist"
              className="relative p-2.5 rounded-xl text-slate-700 hover:text-brand-blue-900 hover:bg-slate-100 transition-colors flex items-center justify-center flex-shrink-0"
              title="View Saved Materials (Wishlist)"
            >
              <Heart className="w-5 h-5" />
              {wishlistItems.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-sm">
                  {wishlistItems.length}
                </span>
              )}
            </Link>

            {/* 6. Notifications */}
            <div className="flex-shrink-0">
              <NotificationPopover />
            </div>

            {/* 7. Wallet */}
            <button
              type="button"
              onClick={handleWalletClick}
              className="flex items-center gap-1.5 py-2 px-2.5 xl:px-3 rounded-xl border border-slate-200 hover:border-emerald-400 bg-white hover:bg-emerald-50/40 text-xs font-bold text-slate-800 transition-all shadow-sm flex-shrink-0"
              title={isAuthenticated ? 'Buildora Wallet Balance' : 'Sign in to access Buildora Cash'}
            >
              <Wallet className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              {isAuthenticated && user ? (
                <span className="text-emerald-700 font-extrabold truncate max-w-[80px]">
                  {formatCurrency(user.walletBalance)}
                </span>
              ) : (
                <span className="text-slate-700">Wallet</span>
              )}
            </button>

            {/* 8. Cart */}
            <button
              type="button"
              onClick={() => setIsCartDrawerOpen(true)}
              className="flex items-center gap-2 bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-black py-2 px-3 xl:px-4 rounded-xl shadow-md hover:shadow-lg transition-all flex-shrink-0"
              title="View Shopping Cart"
            >
              <div className="relative">
                <ShoppingCart className="w-4 h-4" />
                {summary.itemCount > 0 && (
                  <span className="absolute -top-2.5 -right-2.5 bg-brand-blue-950 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-brand-orange-500 shadow-sm">
                    {summary.itemCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-bold tracking-tight">
                {summary.grandTotal > 0 ? formatCurrency(summary.grandTotal) : 'Cart'}
              </span>
            </button>
          </div>

          {/* B. TABLET LAYOUT (md: 768px - 1023px) */}
          <div className="hidden md:flex lg:hidden flex-col gap-2.5">
            <div className="flex items-center justify-between gap-3">
              {/* Logo */}
              <Link to="/" className="flex items-center gap-2 flex-shrink-0">
                <div className="w-9 h-9 rounded-xl bg-brand-blue-900 flex items-center justify-center text-white font-black text-xl shadow-md">
                  B
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-lg tracking-tight text-slate-900 leading-none">
                    BUILDORA<span className="text-brand-orange-500 ml-0.5">60</span>
                  </span>
                  <span className="text-[8px] font-extrabold text-brand-blue-800 tracking-wider uppercase mt-0.5">
                    BUILD SMART. DELIVER FAST.
                  </span>
                </div>
              </Link>

              {/* Location Pill */}
              <button
                type="button"
                onClick={openLocationModal}
                className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl border border-slate-200 bg-slate-50 text-left text-xs"
              >
                <MapPin className="w-3.5 h-3.5 text-brand-orange-600 flex-shrink-0" />
                <span className="font-bold text-slate-800 truncate max-w-[110px]">{pincode} ({cityName.split(',')[0]})</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

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

                {/* Cart */}
                <button
                  type="button"
                  onClick={() => setIsCartDrawerOpen(true)}
                  className="flex items-center gap-1 bg-brand-orange-500 text-white font-bold py-1.5 px-3 rounded-xl text-xs shadow-sm"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>{summary.grandTotal > 0 ? formatCurrency(summary.grandTotal) : 'Cart'}</span>
                </button>

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
              Row 1: Menu + Logo + Wishlist + Notifications + Cart
              Row 2: Location selector + Wallet button
              Row 3: Full-width Smart Search Bar
          */}
          <div className="flex md:hidden flex-col gap-2">
            {/* Mobile Row 1: Menu + Brand Logo + (Wishlist, Notifications, Cart) */}
            <div className="flex items-center justify-between gap-2 min-h-[44px]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 -ml-1 rounded-xl text-slate-700 hover:bg-slate-100 min-w-[40px] min-h-[40px] flex items-center justify-center"
                  aria-label="Open Navigation Menu"
                >
                  {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>

                <Link to="/" className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-brand-blue-900 flex items-center justify-center text-white font-black text-base shadow-sm">
                    B
                  </div>
                  <span className="font-black text-base tracking-tight text-slate-900">
                    BUILDORA<span className="text-brand-orange-500">60</span>
                  </span>
                </Link>
              </div>

              <div className="flex items-center gap-1">
                {/* Wishlist */}
                <Link
                  to="/wishlist"
                  className="relative p-2 rounded-xl text-slate-700 hover:bg-slate-100 min-w-[40px] min-h-[40px] flex items-center justify-center"
                  title="Saved Materials"
                >
                  <Heart className="w-4 h-4" />
                  {wishlistItems.length > 0 && (
                    <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                      {wishlistItems.length}
                    </span>
                  )}
                </Link>

                {/* Notifications Popover */}
                <NotificationPopover />

                {/* Cart Button */}
                <button
                  type="button"
                  onClick={() => setIsCartDrawerOpen(true)}
                  className="flex items-center gap-1 bg-brand-orange-500 text-white font-black py-1.5 px-2.5 rounded-xl shadow-sm text-xs min-h-[38px]"
                  title="Shopping Cart"
                >
                  <div className="relative">
                    <ShoppingCart className="w-3.5 h-3.5" />
                    {summary.itemCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-brand-blue-950 text-white text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">
                        {summary.itemCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-bold">
                    {summary.grandTotal > 0 ? formatCurrency(summary.grandTotal) : 'Cart'}
                  </span>
                </button>
              </div>
            </div>

            {/* Mobile Row 2: Location Selector + Wallet Pill */}
            <div className="flex items-center gap-2">
              {/* Location Selector */}
              <button
                type="button"
                onClick={openLocationModal}
                className="flex-1 flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 min-h-[36px]"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-brand-orange-600 flex-shrink-0" />
                  <span className="truncate">Deliver to: <strong className="text-slate-900">{pincode}</strong></span>
                </div>
                {etaMinutes > 0 ? (
                  <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-1.5 py-0.5 rounded-md flex-shrink-0 ml-1">
                    {etaMinutes}m ETA
                  </span>
                ) : (
                  <ChevronDown className="w-3 h-3 text-slate-400 flex-shrink-0" />
                )}
              </button>

              {/* Wallet Button */}
              <button
                type="button"
                onClick={handleWalletClick}
                className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-emerald-50/50 text-xs font-bold text-slate-800 min-h-[36px] flex-shrink-0 shadow-sm"
              >
                <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                {isAuthenticated && user ? (
                  <span className="text-emerald-700 font-extrabold">{formatCurrency(user.walletBalance)}</span>
                ) : (
                  <span>Wallet</span>
                )}
              </button>
            </div>

            {/* Mobile Row 3: Full-Width Search Bar */}
            <div className="w-full">
              <SmartSearchBar />
            </div>
          </div>
        </div>

        {/* 3. DESKTOP ROW 2: 5 CONSTRUCTION DEPARTMENTS & MEGA MENU */}
        <div ref={megaMenuRef} className="bg-slate-50 border-t border-slate-200/80 px-4 hidden lg:block relative">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs font-bold text-slate-700 py-1.5">
              {/* All 28 Categories Mega Menu Dropdown */}
              <div className="relative mr-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAllCategoriesOpen(!isAllCategoriesOpen);
                    setActiveDepartment(null);
                  }}
                  className="flex items-center gap-1.5 bg-brand-blue-900 text-white py-2 px-3.5 rounded-xl hover:bg-brand-blue-800 transition-colors shadow-sm"
                >
                  <Menu className="w-3.5 h-3.5" />
                  <span>All 28 Categories</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {/* All Categories Grid Dropdown */}
                {isAllCategoriesOpen && (
                  <div className="absolute top-full left-0 mt-2 w-[760px] bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 grid grid-cols-3 gap-3 z-50 animate-in fade-in zoom-in-95 duration-150 max-h-[480px] overflow-y-auto">
                    {MASTER_CATEGORIES.map((cat) => (
                      <Link
                        key={cat.id}
                        to={`/categories/${cat.slug}`}
                        onClick={() => setIsAllCategoriesOpen(false)}
                        className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                          <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                        </div>
                        <span className="text-xs font-semibold text-slate-800 group-hover:text-brand-blue-900 truncate">
                          {cat.name}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* 5 Main Construction Departments */}
              {CONSTRUCTION_DEPARTMENTS.map((dept) => {
                const Icon = DEPARTMENT_ICONS[dept.slug] || Building2;
                const isOpen = activeDepartment === dept.slug;
                const deptCats = getDepartmentCategories(dept.slug);

                return (
                  <div
                    key={dept.id}
                    className="relative"
                    onMouseEnter={() => {
                      setActiveDepartment(dept.slug);
                      setIsAllCategoriesOpen(false);
                    }}
                  >
                    <button
                      type="button"
                      className={`flex items-center gap-1.5 py-2 px-3 rounded-xl transition-all ${
                        isOpen
                          ? 'bg-white text-brand-blue-900 shadow-sm'
                          : 'hover:bg-slate-200/70 text-slate-700'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 text-brand-orange-500" />
                      <span>{dept.name}</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </button>

                    {/* Department Mega Menu */}
                    {isOpen && (
                      <div
                        onMouseLeave={() => setActiveDepartment(null)}
                        className="absolute top-full left-0 mt-1 w-[680px] bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 z-50 animate-in fade-in zoom-in-95 duration-150"
                      >
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                          <div>
                            <div className="text-xs font-black text-brand-blue-900 uppercase tracking-wider">
                              {dept.name}
                            </div>
                            <p className="text-[11px] text-slate-500 font-normal">{dept.description}</p>
                          </div>
                          <Link
                            to={`/categories/${dept.categorySlugs[0]}`}
                            onClick={() => setActiveDepartment(null)}
                            className="text-xs font-bold text-brand-orange-600 hover:underline flex items-center gap-1"
                          >
                            Explore Department &rarr;
                          </Link>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          {deptCats.map((cat) => (
                            <div key={cat.id} className="space-y-1">
                              <Link
                                to={`/categories/${cat.slug}`}
                                onClick={() => setActiveDepartment(null)}
                                className="font-bold text-xs text-slate-900 hover:text-brand-blue-900 flex items-center gap-1.5"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-orange-500" />
                                {cat.name}
                              </Link>
                              <div className="pl-3 space-y-0.5 text-[11px] text-slate-500 font-normal">
                                {cat.subcategories.slice(0, 3).map((sub) => (
                                  <Link
                                    key={sub.id}
                                    to={`/categories/${cat.slug}/${sub.slug}`}
                                    onClick={() => setActiveDepartment(null)}
                                    className="block hover:text-brand-blue-900 truncate"
                                  >
                                    &bull; {sub.name}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Shortcut Links */}
              <Link
                to="/brands"
                className="py-2 px-3 rounded-xl hover:bg-slate-200/70 transition-colors text-slate-700"
              >
                Top Brands
              </Link>
              <Link
                to="/deals"
                className="py-2 px-3 rounded-xl text-brand-orange-600 font-black hover:bg-orange-50 flex items-center gap-1 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 fill-current" /> Deals
              </Link>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
              <span className="flex items-center gap-1 text-emerald-700 font-bold">
                <Clock className="w-3.5 h-3.5" /> 7:00 AM - 11:00 PM Site Delivery
              </span>
            </div>
          </div>
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

            {/* Construction Departments */}
            <div className="space-y-2">
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-extrabold px-1">
                Construction Departments
              </div>
              <div className="grid grid-cols-1 gap-1">
                {CONSTRUCTION_DEPARTMENTS.map((dept) => {
                  const Icon = DEPARTMENT_ICONS[dept.slug] || Building2;
                  return (
                    <Link
                      key={dept.id}
                      to={`/categories/${dept.categorySlugs[0]}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-slate-100 text-xs font-bold text-slate-800"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-brand-orange-500" />
                        <span>{dept.name}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-1 text-xs font-bold text-slate-700 pt-2 border-t border-slate-100">
              <Link
                to="/products"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2 px-2 hover:bg-slate-50 rounded-lg"
              >
                All 28 Master Categories
              </Link>
              <Link
                to="/tools/material-estimator"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2 px-2 hover:bg-slate-50 rounded-lg text-brand-blue-900"
              >
                Material Quantity Estimator
              </Link>
              <Link
                to="/bulk-orders"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2 px-2 hover:bg-slate-50 rounded-lg text-brand-orange-600"
              >
                Commercial Bulk Quotations
              </Link>
              <Link
                to="/deals"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2 px-2 hover:bg-slate-50 rounded-lg"
              >
                Deals &amp; Offers
              </Link>
              <Link
                to="/brands"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2 px-2 hover:bg-slate-50 rounded-lg"
              >
                Direct Authorized Brands
              </Link>
              <Link
                to="/knowledge-hub"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2 px-2 hover:bg-slate-50 rounded-lg"
              >
                Knowledge Hub &amp; Guides
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Persistent Modals */}
      <LocationModal />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <CartDrawer isOpen={isCartDrawerOpen} onClose={() => setIsCartDrawerOpen(false)} />
    </>
  );
};
