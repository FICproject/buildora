import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Store,
  Package,
  Boxes,
  ShoppingCart,
  FileSpreadsheet,
  Tags,
  Users,
  Warehouse,
  Truck,
  IndianRupee,
  Globe,
  UserCheck,
  BarChart3,
  BellRing,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  LogOut,
  ShieldCheck,
  KeyRound,
  Building2,
  FolderTree,
  Clock,
  CheckCircle2,
  XCircle,
  Monitor,
  Layers,
  Compass,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { useAdminAuthStore } from '../../store/useAdminAuthStore';
import { ToastContainer, Modal, Button, useToastStore, inputClassName } from '../ui';
import { adminApi } from '../../services/adminApi';

export interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  permission: string;
  group: 'Command' | 'Supply & Orders' | 'Customers & Finance' | 'Administration';
  children?: Array<{ path: string; label: string; icon?: React.ReactNode; end?: boolean }>;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" />, permission: 'dashboard:read', group: 'Command' },
  { path: '/vendors', label: 'Vendors', icon: <Store className="w-4 h-4" />, permission: 'vendors:read', group: 'Supply & Orders' },
  { path: '/products', label: 'Products & Catalog', icon: <Package className="w-4 h-4" />, permission: 'products:read', group: 'Supply & Orders' },
  { path: '/inventory', label: 'Inventory', icon: <Boxes className="w-4 h-4" />, permission: 'inventory:read', group: 'Supply & Orders' },
  { path: '/warehouses', label: 'Warehouses', icon: <Warehouse className="w-4 h-4" />, permission: 'warehouses:read', group: 'Supply & Orders' },
  { path: '/orders', label: 'Orders & Returns', icon: <ShoppingCart className="w-4 h-4" />, permission: 'orders:read', group: 'Supply & Orders' },
  { path: '/quotations', label: 'Bulk Quotations', icon: <FileSpreadsheet className="w-4 h-4" />, permission: 'quotations:read', group: 'Supply & Orders' },
  { path: '/pricing', label: 'Pricing & Offers', icon: <Tags className="w-4 h-4" />, permission: 'pricing:read', group: 'Customers & Finance' },
  { path: '/customers', label: 'Customers', icon: <Users className="w-4 h-4" />, permission: 'customers:read', group: 'Customers & Finance' },
  { path: '/delivery', label: 'Delivery & Dispatch', icon: <Truck className="w-4 h-4" />, permission: 'delivery:read', group: 'Customers & Finance' },
  { path: '/finance', label: 'Payments & Finance', icon: <IndianRupee className="w-4 h-4" />, permission: 'finance:read', group: 'Customers & Finance' },
  { path: '/reports', label: 'Reports & Analytics', icon: <BarChart3 className="w-4 h-4" />, permission: 'reports:read', group: 'Customers & Finance' },
  { path: '/content', label: 'Website Content', icon: <Globe className="w-4 h-4" />, permission: 'content:read', group: 'Administration' },
  { path: '/team', label: 'Team & Roles', icon: <UserCheck className="w-4 h-4" />, permission: 'team:read', group: 'Administration' },
  { path: '/support', label: 'Support & Alerts', icon: <BellRing className="w-4 h-4" />, permission: 'dashboard:read', group: 'Administration' },
  { path: '/settings', label: 'Company Settings', icon: <Settings className="w-4 h-4" />, permission: 'settings:read', group: 'Administration' },
];

const NAV_GROUPS: NavItem['group'][] = [
  'Command',
  'Supply & Orders',
  'Customers & Finance',
  'Administration',
];

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { accessToken, user } = useAdminAuthStore();
  if (!accessToken || !user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const AdminLayout: React.FC = () => {
  const { user, tenant, refreshToken, clearSession, hasPermission } = useAdminAuthStore();
  const pushToast = useToastStore((s) => s.push);
  const location = useLocation();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>('/products');
  const [globalSearch, setGlobalSearch] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '' });
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  useEffect(() => {
    let active = true;
    const loadUnread = () => {
      adminApi
        .getSupportNotifications()
        .then((res) => {
          if (!active) return;
          const unread = Array.isArray(res?.alerts)
            ? res.alerts.filter((a: any) => !a.isRead).length
            : 0;
          setUnreadAlerts(unread);
        })
        .catch(() => {});
    };
    loadUnread();
    const onRealtime = () => loadUnread();
    window.addEventListener('buildora:admin:realtime', onRealtime);
    return () => {
      active = false;
      window.removeEventListener('buildora:admin:realtime', onRealtime);
    };
  }, [location.pathname]);

  const allowedNav = NAV_ITEMS.filter((item) => hasPermission(item.permission));
  const currentNav = NAV_ITEMS.find((n) =>
    n.path === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(n.path) || Boolean(n.children?.some((c) => location.pathname.startsWith(c.path)))
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalSearch.trim()) return;
    navigate(`/orders?q=${encodeURIComponent(globalSearch.trim())}`);
  };

  const handleLogout = async () => {
    try {
      await adminApi.logout(refreshToken || undefined);
    } catch {
      // ignore
    }
    clearSession();
    navigate('/login');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.changePassword(pwdForm);
      pushToast({ title: 'Password Updated', message: 'Your admin password has been changed.' });
      setPwdModalOpen(false);
      setPwdForm({ currentPassword: '', newPassword: '' });
    } catch (err: any) {
      pushToast({ title: 'Update Failed', message: err.message, variant: 'error' });
    }
  };

  const renderSidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full bg-[#5E5946] text-white border-r border-[#4C4838]">
      {/* Brand Bar */}
      <div className="h-16 px-4 border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#AE887B] text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
            B60
          </div>
          {(!collapsed || isMobile) && (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-white tracking-tight">BUILDORA 60</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#F0DED0]" />
              </div>
              <p className="text-[11px] text-[#F0DED0]/80 truncate">Company Admin</p>
            </div>
          )}
        </div>
        {isMobile ? (
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-[#F0DED0]/15 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-[#F0DED0]/15 transition-colors hidden lg:inline-flex"
            aria-label="Toggle sidebar"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Company Tenant Pill */}
      {(!collapsed || isMobile) && tenant && (
        <div className="mx-3 mt-3 px-3 py-2.5 rounded-lg bg-[#F0DED0]/12 border border-[#F0DED0]/20 flex items-center gap-2.5">
          <Building2 className="w-4 h-4 text-[#F0DED0] shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">{tenant.name}</p>
            <p className="text-[10px] text-[#F0DED0]/80 truncate">
              {tenant.city}, {tenant.state}
            </p>
          </div>
        </div>
      )}

      {/* Navigation Links (Grouped Modules) */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
        {NAV_GROUPS.map((group) => {
          const items = allowedNav.filter((item) => item.group === group);
          if (!items.length) return null;
          return (
            <div key={group} className="space-y-0.5">
              {(!collapsed || isMobile) && (
                <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#F0DED0]/65">
                  {group}
                </p>
              )}
              {items.map((item) => {
                if (item.children && item.children.length > 0) {
                  const childActive = item.children.some((c) => location.pathname.startsWith(c.path));
                  const isOpen = expandedMenu === item.path || childActive;
                  return (
                    <div key={item.path} className="space-y-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (collapsed && !isMobile) {
                            navigate(item.children![0].path);
                          } else {
                            if (!childActive) {
                              setExpandedMenu(item.path);
                              navigate(item.children![0].path);
                            } else {
                              setExpandedMenu(isOpen ? null : item.path);
                            }
                          }
                        }}
                        className={`w-full relative flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                          childActive
                            ? 'bg-[#F0DED0]/18 text-white shadow-sm'
                            : 'text-white/80 hover:bg-[#F0DED0]/10 hover:text-white'
                        }`}
                        title={collapsed && !isMobile ? item.label : undefined}
                      >
                        <span className="flex items-center gap-3 min-w-0">
                          {childActive && (
                            <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[#AE887B]" />
                          )}
                          <span className={`shrink-0 ${childActive ? 'text-[#F0DED0]' : 'text-white/75'}`}>
                            {item.icon}
                          </span>
                          {(!collapsed || isMobile) && <span className="truncate">{item.label}</span>}
                        </span>
                        {(!collapsed || isMobile) && (
                          <ChevronDown
                            className={`w-3.5 h-3.5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                          />
                        )}
                      </button>
                      {(!collapsed || isMobile) && isOpen && (
                        <div className="pl-6 pr-1 space-y-0.5">
                          {item.children.map((sub) => (
                            <NavLink
                              key={sub.path}
                              to={sub.path}
                              end={Boolean(sub.end)}
                              onClick={() => isMobile && setMobileOpen(false)}
                              className={({ isActive }) =>
                                `flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                  isActive
                                    ? 'bg-[#AE887B] text-white shadow-xs'
                                    : 'text-[#F0DED0]/80 hover:bg-[#F0DED0]/10 hover:text-white'
                                }`
                              }
                            >
                              {sub.icon && <span className="shrink-0 opacity-85">{sub.icon}</span>}
                              <span className="truncate">{sub.label}</span>
                            </NavLink>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    onClick={() => isMobile && setMobileOpen(false)}
                    className={({ isActive }) =>
                      `relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-[#F0DED0]/18 text-white shadow-sm'
                          : 'text-white/80 hover:bg-[#F0DED0]/10 hover:text-white'
                      }`
                    }
                    title={collapsed && !isMobile ? item.label : undefined}
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[#AE887B]" />
                        )}
                        <span className={`shrink-0 ${isActive ? 'text-[#F0DED0]' : 'text-white/75'}`}>
                          {item.icon}
                        </span>
                        {(!collapsed || isMobile) && <span className="truncate">{item.label}</span>}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Bottom Security Badge */}
      {(!collapsed || isMobile) && (
        <div className="p-3 border-t border-white/10 bg-[#4C4838]/40 text-[11px] text-[#F0DED0]/85 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#F0DED0] shrink-0" />
          <span className="truncate">Tenant Isolated • {user?.role?.replace(/_/g, ' ')}</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen min-h-dvh bg-[#FAF7F4] text-[#3D392C] flex overflow-x-clip">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 transition-all duration-200 ease-out ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        <div className="sticky top-0 h-screen h-dvh">{renderSidebarContent(false)}</div>
      </aside>

      {/* Tablet & Mobile Drawer Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#5E5946]/45 backdrop-blur-[1px]"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full h-dvh z-10">{renderSidebarContent(true)}</div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-[#E5DCD3] px-3 sm:px-4 lg:px-6 flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 -ml-1 rounded-lg text-[#5E5946] hover:bg-[#F0DED0]/50 transition-colors shrink-0"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0 flex items-center gap-2.5">
              <span className="hidden sm:inline-block w-1.5 h-5 rounded-full bg-[#AE887B] shrink-0" />
              <h2 className="text-sm sm:text-base font-semibold text-[#5E5946] truncate">
                {currentNav?.label || 'Company Admin Portal'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Mobile Search Toggle (< md) */}
            <button
              type="button"
              onClick={() => setMobileSearchOpen((v) => !v)}
              className="md:hidden p-2 rounded-lg text-[#5E5946] hover:bg-[#F0DED0]/60 transition-colors"
              aria-label="Toggle order search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Desktop Search */}
            <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative">
              <Search className="w-4 h-4 text-[#6E6859] absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Search order #, customer..."
                className="pl-9 pr-3 py-1.5 w-48 lg:w-64 text-sm bg-[#FAF7F4] border border-[#E5DCD3] rounded-lg focus:outline-none focus:bg-white focus:border-[#AE887B]"
              />
            </form>

            {/* Notifications */}
            <button
              onClick={() => navigate('/support')}
              className="p-2 rounded-lg text-[#5E5946] hover:bg-[#F0DED0]/60 transition-colors relative"
              title="Notifications & Support"
            >
              <BellRing className="w-5 h-5" />
              {unreadAlerts > 0 && (
                <span className="min-w-[16px] h-4 px-1 rounded-full bg-[#AE887B] text-white text-[10px] font-bold flex items-center justify-center absolute top-0.5 right-0.5 ring-2 ring-white">
                  {unreadAlerts > 99 ? '99+' : unreadAlerts}
                </span>
              )}
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen((v) => !v)}
                className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg border border-[#E5DCD3] bg-white hover:bg-[#FAF7F4] transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-[#AE887B] text-white text-xs font-semibold flex items-center justify-center">
                  {user?.name?.charAt(0) || 'A'}
                </div>
                <div className="hidden sm:block text-left max-w-[140px]">
                  <p className="text-xs font-semibold text-[#5E5946] truncate">{user?.name}</p>
                  <p className="text-[10px] text-[#6E6859] truncate">
                    {user?.role?.replace(/_/g, ' ')}
                  </p>
                </div>
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-2rem)] bg-white border border-[#E5DCD3] rounded-xl shadow-lg py-1.5 z-40">
                  <div className="px-3.5 py-2 border-b border-[#E5DCD3] bg-[#FAF7F4]">
                    <p className="text-xs font-semibold text-[#5E5946]">{user?.name}</p>
                    <p className="text-[11px] text-[#6E6859] truncate">{user?.email}</p>
                    <p className="text-[10px] text-[#AE887B] font-semibold mt-0.5">{tenant?.name}</p>
                  </div>
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      setPwdModalOpen(true);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-[#5E5946] hover:bg-[#F0DED0]/50 flex items-center gap-2 transition-colors"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-[#AE887B]" /> Change Password
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3.5 py-2 text-xs text-[#C94444] hover:bg-[#FEF2F2] flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Search Bar Dropdown (< md) */}
        {mobileSearchOpen && (
          <div className="md:hidden bg-white border-b border-[#E5DCD3] px-3 py-2.5">
            <form
              onSubmit={(e) => {
                setMobileSearchOpen(false);
                handleSearchSubmit(e);
              }}
              className="relative flex items-center gap-2"
            >
              <div className="relative flex-1 min-w-0">
                <Search className="w-4 h-4 text-[#6E6859] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  autoFocus
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  placeholder="Search order #, customer..."
                  className="w-full pl-9 pr-3 py-1.5 text-sm bg-[#FAF7F4] border border-[#E5DCD3] rounded-lg focus:outline-none focus:bg-white focus:border-[#AE887B]"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-[#AE887B] text-white text-xs font-semibold shrink-0"
              >
                Go
              </button>
            </form>
          </div>
        )}

        {/* Page Body */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 max-w-[1680px] w-full mx-auto min-w-0">
          <Outlet />
        </main>
      </div>

      {/* Password Modal */}
      <Modal
        open={pwdModalOpen}
        onClose={() => setPwdModalOpen(false)}
        title="Change Account Password"
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#5E5946] mb-1">
              Current Password
            </label>
            <input
              type="password"
              required
              value={pwdForm.currentPassword}
              onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
              className={inputClassName}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5E5946] mb-1">
              New Password (min 8 chars)
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={pwdForm.newPassword}
              onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
              className={inputClassName}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setPwdModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Update Password</Button>
          </div>
        </form>
      </Modal>

      <ToastContainer />
    </div>
  );
};
