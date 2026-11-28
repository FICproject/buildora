import React from 'react';
import { NavLink, Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  User,
  Package,
  MapPin,
  Wallet,
  Award,
  Bell,
  FolderKanban,
  LifeBuoy,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Heart,
  LayoutDashboard,
  Lock,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { Header } from '../components/common/Header';
import { Footer } from '../components/common/Footer';
import { useAuthStore } from '../store/useAuthStore';
import { useWishlistStore } from '../store/useWishlistStore';
import { formatCurrency } from '@buildora/utils';
import { Button } from '../components/ui/Button';
import { ScrollToTop } from '../components/common/ScrollToTop';

export const CustomerAccountLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout, openAuthModal } = useAuthStore();
  const { items: wishlistItems } = useWishlistStore();

  const navItems = [
    { label: 'Overview', path: '/account', icon: LayoutDashboard, exact: true },
    { label: 'Profile', path: '/account/profile', icon: User },
    { label: 'My Orders', path: '/account/orders', icon: Package },
    { label: 'Site Addresses', path: '/account/addresses', icon: MapPin },
    { label: 'Buildora Wallet', path: '/account/wallet', icon: Wallet },
    { label: 'Rewards', path: '/account/rewards', icon: Award },
    {
      label: 'Saved Materials',
      path: '/account/wishlist',
      icon: Heart,
      badge: wishlistItems.length > 0 ? `${wishlistItems.length}` : undefined
    },
    { label: 'Shopping Lists', path: '/account/projects', icon: FolderKanban },
    { label: 'Support Desk', path: '/account/support', icon: LifeBuoy }
  ];

  const currentTab = navItems.find((n) =>
    n.exact ? location.pathname === n.path : location.pathname.startsWith(n.path)
  ) || navItems[0];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <ScrollToTop />
      <Header />
      <main className="flex-grow py-4 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* GUEST ACCESS CONTROL GATE */}
          {!isAuthenticated ? (
            <div className="max-w-2xl mx-auto my-6 sm:my-12 bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-6 sm:p-10 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-2xl bg-brand-blue-50 border border-brand-blue-100 text-brand-blue-900 mx-auto flex items-center justify-center shadow-inner">
                <Lock className="w-8 h-8 text-brand-orange-500" />
              </div>

              <div className="space-y-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Sign In to Access {currentTab.label}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                  Account management, live GPS truck dispatch tracking, Buildora Wallet cashback, and saved site addresses require verified contractor authentication.
                </p>
              </div>

              {/* Guest Allowed vs Protected Matrix Preview */}
              <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 text-left border border-slate-200/60 space-y-3">
                <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  Guest Permissions Active
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-slate-700">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Explore All 28 Master Categories</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Material Quantity Estimators</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Add to Cart &amp; Saved Wishlist</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Dark Store Pincode ETA Check</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full sm:w-auto px-8"
                  onClick={() => openAuthModal(location.pathname, `Sign in to access your ${currentTab.label}`)}
                >
                  Sign In with Mobile OTP
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  className="w-full sm:w-auto px-6"
                  onClick={() => navigate('/products')}
                >
                  Continue Browsing Materials
                </Button>
              </div>
            </div>
          ) : (
            /* AUTHENTICATED USER LAYOUT */
            <div className="space-y-6">
              {/* Mobile Account Horizontal Nav Strip (lg:hidden) */}
              <div className="lg:hidden bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-brand-blue-900 text-white font-black text-xs flex items-center justify-center">
                      {user?.name ? user.name.charAt(0) : 'U'}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">{user?.name}</div>
                      <div className="text-[10px] text-slate-500">Wallet: {formatCurrency(user?.walletBalance || 0)}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      navigate('/');
                    }}
                    className="text-xs font-bold text-red-600 hover:underline"
                  >
                    Sign Out
                  </button>
                </div>

                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 text-xs whitespace-nowrap">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.exact
                      ? location.pathname === item.path
                      : location.pathname.startsWith(item.path);

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all flex-shrink-0 ${
                          isActive
                            ? 'bg-brand-blue-900 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>

              {/* Main Desktop Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Account Sidebar (Desktop only) */}
                <aside className="hidden lg:block lg:col-span-1">
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5 space-y-6 sticky top-28">
                    {/* User Card */}
                    <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
                      <div className="w-12 h-12 rounded-xl bg-brand-blue-900 text-white font-black text-lg flex items-center justify-center shadow-md">
                        {user?.name ? user.name.charAt(0) : 'U'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-black text-slate-900 truncate">
                          {user?.name || 'Customer Account'}
                        </div>
                        <div className="text-xs text-slate-500 font-medium">
                          +91 {user?.phone || '9876543210'}
                        </div>
                        {user?.businessName && (
                          <div className="text-[11px] text-brand-blue-700 font-bold truncate mt-0.5">
                            {user.businessName}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Navigation Links */}
                    <nav className="space-y-1">
                      {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.exact
                          ? location.pathname === item.path
                          : location.pathname.startsWith(item.path);

                        return (
                          <NavLink
                            key={item.path}
                            to={item.path}
                            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                              isActive
                                ? 'bg-brand-blue-900 text-white shadow-sm'
                                : 'text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <Icon className="w-4 h-4" />
                              <span>{item.label}</span>
                            </div>
                            {item.badge ? (
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                isActive ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {item.badge}
                              </span>
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                            )}
                          </NavLink>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          navigate('/');
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors mt-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </nav>
                  </div>
                </aside>

                {/* Account Content Area */}
                <div className="lg:col-span-3 min-w-0">
                  <Outlet />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};
