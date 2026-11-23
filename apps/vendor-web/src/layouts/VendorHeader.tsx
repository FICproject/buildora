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
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile trigger & Page title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
        >
          <Menu className="w-5 h-5" />
        </button>

        {title && (
          <h1 className="text-lg font-bold text-slate-900 hidden sm:block">
            {title}
          </h1>
        )}
      </div>

      {/* Middle: Hub Location Pill */}
      <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs border border-slate-200">
        <MapPin className="w-3.5 h-3.5 text-blue-600" />
        <span className="font-semibold">Bengaluru Hub:</span>
        <span className="text-slate-600">WH-BLR-04 (Nagarabhavi / Peenya)</span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1" />
        <span className="text-emerald-700 font-semibold text-[11px]">60-Min Express Live</span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Customer Site Preview Link */}
        <a
          href="http://localhost:5173"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-2xs"
          title="Open Customer Website in a new tab"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Customer Site</span>
        </a>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="font-semibold text-xs text-slate-900">Notifications</span>
                <Link
                  to="/notifications"
                  onClick={() => setShowNotifications(false)}
                  className="text-[11px] text-blue-600 hover:underline"
                >
                  View All
                </Link>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">No notifications yet</p>
                ) : (
                  notifications.slice(0, 4).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`p-3 text-xs cursor-pointer hover:bg-slate-50 transition-colors ${
                        !n.read ? 'bg-blue-50/40 font-medium' : ''
                      }`}
                    >
                      <p className="text-slate-900 line-clamp-1">{n.title}</p>
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
          className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
            {(vendor?.businessInfo?.storeName || vendor?.storeName || 'V').charAt(0)}
          </div>
          <span className="text-xs font-semibold text-slate-800 hidden md:inline truncate max-w-[120px]">
            {vendor?.businessInfo?.storeName || vendor?.storeName || 'Vendor Portal'}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:inline" />
        </Link>
      </div>
    </header>
  );
};
