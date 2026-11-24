import React, { useState } from 'react';
import {
  Menu,
  Search,
  Bell,
  MapPin,
  ExternalLink,
  Store,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';
import { useVendorAuthStore } from '../store/useVendorAuthStore';
import { useVendorNotificationStore } from '../store/useVendorNotificationStore';
import { Link } from 'react-router-dom';

interface VendorHeaderProps {
  onOpenMobileMenu: () => void;
  title?: string;
}

export const VendorHeader: React.FC<VendorHeaderProps> = ({ onOpenMobileMenu, title }) => {
  const { vendor } = useVendorAuthStore();
  const { notifications, unreadCount, markAsRead } = useVendorNotificationStore();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-[#E2E8F0] px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Left: Mobile trigger & Page title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-lg text-slate-500 hover:text-[#203D91] hover:bg-[#F4F7FC]"
        >
          <Menu className="w-5 h-5" />
        </button>

        {title && (
          <h1 className="text-lg font-extrabold text-[#17233C] hidden sm:block tracking-tight">
            {title}
          </h1>
        )}
      </div>

      {/* Middle: Hub Location Pill */}
      <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F4F7FC] text-[#17233C] text-xs border border-[#E2E8F0]">
        <MapPin className="w-3.5 h-3.5 text-[#203D91]" />
        <span className="font-bold text-[#203D91]">Fulfillment Hub:</span>
        <span className="text-slate-600 font-medium">WH-BLR-04 (Peenya Industrial Area)</span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1" />
        <span className="text-emerald-700 font-bold text-[11px]">60-Min Express Live</span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Customer Site Preview Link */}
        <a
          href="http://localhost:5173"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-[#203D91] bg-white hover:bg-[#F4F7FC] hover:border-[#203D91] transition-all shadow-2xs"
          title="Open Customer Website in a new tab"
        >
          <ExternalLink className="w-3.5 h-3.5 text-[#FF7417]" />
          <span>Customer Site</span>
        </a>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-slate-600 hover:text-[#203D91] hover:bg-[#F4F7FC] transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#FF7417] text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-[#E2E8F0] py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2 border-b border-[#E2E8F0] flex items-center justify-between">
                <span className="font-bold text-xs text-[#17233C]">Notifications</span>
                <Link
                  to="/notifications"
                  onClick={() => setShowNotifications(false)}
                  className="text-[11px] font-bold text-[#203D91] hover:underline"
                >
                  View All
                </Link>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-[#E2E8F0]">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">No notifications yet</p>
                ) : (
                  notifications.slice(0, 4).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`p-3 text-xs cursor-pointer hover:bg-[#F4F7FC] transition-colors ${
                        !n.read ? 'bg-blue-50/50 font-medium' : ''
                      }`}
                    >
                      <p className="text-[#17233C] font-bold line-clamp-1">{n.title}</p>
                      <p className="text-slate-500 text-[11px] line-clamp-2 mt-0.5">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Store Profile Avatar */}
        <Link
          to="/settings"
          className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-xl hover:bg-[#F4F7FC] transition-colors border border-transparent hover:border-[#E2E8F0]"
        >
          <div className="w-8 h-8 rounded-lg bg-[#203D91] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
            {(vendor?.businessInfo?.storeName || vendor?.storeName || 'V').charAt(0)}
          </div>
          <span className="text-xs font-bold text-[#17233C] hidden md:inline truncate max-w-[130px]">
            {vendor?.businessInfo?.storeName || vendor?.storeName || 'Supreme Materials BLR'}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:inline" />
        </Link>
      </div>
    </header>
  );
};
