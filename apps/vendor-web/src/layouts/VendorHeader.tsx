import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  Bell,
  HelpCircle,
  ChevronDown,
  Building2,
  Settings,
  LogOut,
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useVendorAuthStore } from '../store/useVendorAuthStore';
import { useVendorNotificationStore } from '../store/useVendorNotificationStore';

interface VendorHeaderProps {
  onOpenMobileMenu: () => void;
  title: string;
}

export const VendorHeader: React.FC<VendorHeaderProps> = ({ onOpenMobileMenu, title }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { vendor, logout } = useVendorAuthStore();
  const { notifications, unreadCount, markAsRead } = useVendorNotificationStore();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [quickSearch, setQuickSearch] = useState('');

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showSearchInput = ['/dashboard', '/products', '/orders', '/inventory'].some((p) =>
    location.pathname.startsWith(p)
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = quickSearch.trim();
    if (!q) return;
    if (q.toUpperCase().startsWith('ORD') || q.toUpperCase().startsWith('BLD')) {
      navigate(`/orders?search=${encodeURIComponent(q)}`);
    } else {
      navigate(`/products?search=${encodeURIComponent(q)}`);
    }
  };

  const storeName =
    vendor?.businessInfo?.storeName || vendor?.storeName || 'Supreme Materials BLR';
  const contactName =
    vendor?.businessInfo?.contactPerson || vendor?.name || 'Vendor Partner';

  return (
    <header className="h-16 bg-white border-b border-[#E7E5E4] px-3 sm:px-4 md:px-6 flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-30">
      {/* Left: Mobile trigger, Mobile Logo & Page Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          className="lg:hidden p-2 -ml-1 rounded-lg text-[#78716C] hover:text-[#943D24] hover:bg-[#F8F7F5] cursor-pointer shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/dashboard" className="flex lg:hidden items-center gap-1.5 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-[#943D24] text-white font-bold text-xs flex items-center justify-center">
            B
          </div>
          <span className="font-bold text-xs xs:text-sm text-[#943D24]">BUILDORA</span>
          <span className="text-[10px] font-bold px-1 py-0.5 rounded bg-[#F6C453] text-[#292524]">
            60
          </span>
        </Link>

        <h2 className="text-base sm:text-lg font-semibold text-[#292524] truncate hidden sm:block">
          {title}
        </h2>
      </div>

      {/* Middle: Relevant Search */}
      {showSearchInput && (
        <form onSubmit={handleSearchSubmit} className="hidden lg:block flex-1 max-w-sm">
          <div className="relative">
            <Search className="w-4 h-4 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              placeholder="Search products, SKUs, or order ID..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[#E7E5E4] bg-[#F8F7F5] text-[#292524] placeholder:text-[#78716C] focus:bg-white focus:outline-none focus:border-[#943D24]"
            />
          </div>
        </form>
      )}

      {/* Right: Notifications, Help/Support, Vendor Profile Menu */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setShowNotifications((v) => !v)}
            aria-label="Notifications"
            className="relative p-2 rounded-lg text-[#78716C] hover:text-[#943D24] hover:bg-[#F8F7F5] transition-colors cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#F6C453] text-[#292524] text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="fixed left-4 right-4 top-[4.25rem] sm:left-auto sm:right-0 sm:top-auto sm:absolute sm:mt-2 sm:w-80 bg-white rounded-xl shadow-lg border border-[#E7E5E4] py-2 z-50">
              <div className="px-4 py-2 border-b border-[#E7E5E4] flex items-center justify-between">
                <span className="font-semibold text-xs text-[#292524]">Notifications</span>
                <Link
                  to="/notifications"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-medium text-[#943D24] hover:underline"
                >
                  View All
                </Link>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-[#E7E5E4]">
                {notifications.length === 0 ? (
                  <p className="text-xs text-[#78716C] text-center py-6">No notifications</p>
                ) : (
                  notifications.slice(0, 4).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markAsRead(n.id);
                        setShowNotifications(false);
                        if (n.actionUrl) navigate(n.actionUrl);
                      }}
                      className={`p-3 text-xs cursor-pointer hover:bg-[#F8F7F5] transition-colors ${
                        !n.read ? 'bg-[#FEF9EB]/80' : ''
                      }`}
                    >
                      <p className="text-[#292524] font-medium line-clamp-1">{n.title}</p>
                      <p className="text-[#78716C] text-[11px] line-clamp-2 mt-0.5">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Help / Support */}
        <Link
          to="/support"
          title="Help & Support"
          aria-label="Help & Support"
          className="p-2 rounded-lg text-[#78716C] hover:text-[#943D24] hover:bg-[#F8F7F5] transition-colors"
        >
          <HelpCircle className="w-5 h-5" />
        </Link>

        {/* Vendor Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setShowProfileMenu((v) => !v)}
            className="flex items-center gap-2 pl-2 pr-2 py-1 rounded-lg hover:bg-[#F8F7F5] transition-colors cursor-pointer"
          >
            {vendor?.logoUrl || vendor?.businessInfo?.logo ? (
              <img
                src={vendor.logoUrl || vendor.businessInfo?.logo}
                alt={storeName}
                className="w-8 h-8 rounded-lg object-cover border border-[#E7E5E4] bg-white"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-[#943D24] text-white flex items-center justify-center font-semibold text-xs">
                {storeName.charAt(0)}
              </div>
            )}
            <div className="hidden md:block text-left max-w-[140px]">
              <p className="text-xs font-semibold text-[#292524] truncate">{storeName}</p>
              <p className="text-[11px] text-[#78716C] truncate">{contactName}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#78716C] hidden md:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-[#E7E5E4] py-1.5 z-50 text-xs">
              <Link
                to="/business-profile"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2.5 px-3.5 py-2 text-[#292524] hover:bg-[#F8F7F5]"
              >
                <Building2 className="w-4 h-4 text-[#78716C]" />
                <span>Business Profile</span>
              </Link>
              <Link
                to="/settings"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2.5 px-3.5 py-2 text-[#292524] hover:bg-[#F8F7F5]"
              >
                <Settings className="w-4 h-4 text-[#78716C]" />
                <span>Settings</span>
              </Link>
              <div className="my-1 border-t border-[#E7E5E4]" />
              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[#943D24] hover:bg-[#FBF3F0] text-left cursor-pointer font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
