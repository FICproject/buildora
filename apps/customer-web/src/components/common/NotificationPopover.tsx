import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Truck,
  Wallet,
  Tag,
  Info,
  Check,
  ChevronRight,
  X,
  Sparkles,
  Inbox
} from 'lucide-react';
import { useNotificationStore, NotificationItem } from '../../store/useNotificationStore';
import { useAuthStore } from '../../store/useAuthStore';

const TYPE_ICONS = {
  DISPATCH: Truck,
  WALLET: Wallet,
  OFFER: Tag,
  ANNOUNCEMENT: Info
};

const TYPE_COLORS = {
  DISPATCH: 'bg-blue-100 text-blue-700',
  WALLET: 'bg-emerald-100 text-emerald-700',
  OFFER: 'bg-amber-100 text-amber-700',
  ANNOUNCEMENT: 'bg-purple-100 text-purple-700'
};

export const NotificationPopover: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { isAuthenticated, openAuthModal } = useAuthStore();
  const {
    getVisibleNotifications,
    unreadCount,
    markAsRead,
    markAllAsRead
  } = useNotificationStore();

  const visibleNotifications = getVisibleNotifications(isAuthenticated);
  const unread = unreadCount(isAuthenticated);

  // Close on outside click or Esc
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const handleNotificationClick = (n: NotificationItem) => {
    markAsRead(n.id);
    setIsOpen(false);
    if (n.link) {
      navigate(n.link);
    }
  };

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label="View notifications"
        aria-expanded={isOpen}
        className="h-10 w-10 relative rounded-xl text-slate-700 hover:text-brand-blue-900 hover:bg-slate-100 transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-brand-blue-500/20 flex-shrink-0"
        title="Notifications & Dispatches"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-brand-orange-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-sm animate-pulse">
            {unread}
          </span>
        )}
      </button>

      {/* Popover / Drawer when open */}
      {isOpen && (
        <>
          {/* MOBILE BACKDROP & BOTTOM SHEET (< 640px) */}
          <div className="sm:hidden">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 transition-opacity"
              onClick={() => setIsOpen(false)}
            />

            {/* Mobile Bottom Sheet Drawer */}
            <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 max-h-[82vh] flex flex-col animate-in slide-in-from-bottom duration-200">
              {/* Sheet Drag Indicator */}
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-2.5 mb-1" />

              {/* Mobile Header */}
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-base text-slate-900">Notifications</h3>
                  {unread > 0 && (
                    <span className="bg-brand-orange-100 text-brand-orange-800 text-xs font-black px-2 py-0.5 rounded-full">
                      {unread} New
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unread > 0 && (
                    <button
                      type="button"
                      onClick={() => markAllAsRead(isAuthenticated)}
                      className="text-xs font-bold text-brand-blue-900 hover:underline flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Mark read
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                    aria-label="Close notifications"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Mobile Notification List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
                {visibleNotifications.length > 0 ? (
                  visibleNotifications.map((n) => {
                    const Icon = TYPE_ICONS[n.type] || Info;
                    const colorCls = TYPE_COLORS[n.type] || 'bg-slate-100 text-slate-700';

                    return (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => handleNotificationClick(n)}
                        className={`w-full text-left p-3 rounded-2xl hover:bg-slate-50 transition-colors flex items-start gap-3 ${
                          !n.read ? 'bg-brand-blue-50/40 border border-brand-blue-100/60' : ''
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${colorCls}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-xs font-bold truncate ${!n.read ? 'text-slate-900' : 'text-slate-700'}`}>
                              {n.title}
                            </span>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap flex-shrink-0">
                              {n.time}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                            {n.message}
                          </p>
                        </div>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-brand-orange-500 mt-1.5 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <Inbox className="w-10 h-10 mx-auto text-slate-300" />
                    <div className="font-bold text-slate-700 text-sm">No notifications yet</div>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                      Updates about your orders, truck dispatches, and account will appear here.
                    </p>
                  </div>
                )}
              </div>

              {/* Guest Sign-In Banner if Unauthenticated */}
              {!isAuthenticated && (
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <div className="font-bold text-slate-800 truncate">Private Dispatch Tracking</div>
                    <div className="text-[11px] text-slate-500">Sign in to view site orders &amp; wallet updates</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      openAuthModal('/account/notifications', 'Sign in to access your notification feed');
                    }}
                    className="bg-brand-blue-900 hover:bg-brand-blue-800 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl flex-shrink-0 transition-colors shadow-sm"
                  >
                    Sign In
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* DESKTOP & TABLET ANCHORED DROPDOWN PANEL (sm and above) */}
          <div className="hidden sm:block absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-4 pb-2.5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-slate-900">Notifications</span>
                {unread > 0 && (
                  <span className="bg-brand-orange-100 text-brand-orange-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                    {unread} New
                  </span>
                )}
              </div>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={() => markAllAsRead(isAuthenticated)}
                  className="text-xs font-bold text-brand-blue-900 hover:underline flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
            </div>

            {/* List of Notifications */}
            <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
              {visibleNotifications.length > 0 ? (
                visibleNotifications.map((n) => {
                  const Icon = TYPE_ICONS[n.type] || Info;
                  const colorCls = TYPE_COLORS[n.type] || 'bg-slate-100 text-slate-700';

                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => handleNotificationClick(n)}
                      className={`w-full text-left p-3.5 hover:bg-slate-50 transition-colors flex items-start gap-3 ${
                        !n.read ? 'bg-brand-blue-50/30' : ''
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${colorCls}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-xs font-bold truncate ${!n.read ? 'text-slate-900' : 'text-slate-700'}`}>
                            {n.title}
                          </span>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap flex-shrink-0">
                            {n.time}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                          {n.message}
                        </p>
                      </div>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-brand-orange-500 mt-1 flex-shrink-0" />
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="py-10 text-center text-slate-400 space-y-1.5 px-4">
                  <Inbox className="w-8 h-8 mx-auto text-slate-300" />
                  <div className="font-bold text-slate-700 text-xs">No notifications yet</div>
                  <p className="text-[11px] text-slate-400">
                    Updates about your orders and account will appear here.
                  </p>
                </div>
              )}
            </div>

            {/* Guest Sign-In Banner if Unauthenticated */}
            {!isAuthenticated && (
              <div className="p-3 bg-slate-50 border-t border-slate-100 mt-1 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <div className="font-bold text-slate-800 truncate">Private Dispatch Tracking</div>
                  <div className="text-[10px] text-slate-500">Sign in to view site orders &amp; wallet updates</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    openAuthModal('/account/notifications', 'Sign in to access your notification feed');
                  }}
                  className="bg-brand-blue-900 hover:bg-brand-blue-800 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex-shrink-0 transition-colors"
                >
                  Sign In
                </button>
              </div>
            )}

            {/* View All Footer */}
            <div className="px-4 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <Link
                to="/account/notifications"
                onClick={() => setIsOpen(false)}
                className="font-bold text-brand-blue-900 hover:underline flex items-center gap-1 w-full justify-center py-1"
              >
                <span>View All Notifications</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
