import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Trash2, Zap, Truck, Tag, Info, ShieldCheck, ChevronRight } from 'lucide-react';
import { useNotificationStore, NotificationItem } from '../store/useNotificationStore';
import { useAuthStore } from '../store/useAuthStore';

const TYPE_ICONS = {
  DISPATCH: Truck,
  WALLET: Zap,
  OFFER: Tag,
  ANNOUNCEMENT: Info
};

const TYPE_COLORS = {
  DISPATCH: 'bg-amber-500 text-white',
  WALLET: 'bg-emerald-600 text-white',
  OFFER: 'bg-brand-blue-900 text-white',
  ANNOUNCEMENT: 'bg-purple-600 text-white'
};

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const {
    getVisibleNotifications,
    markAsRead,
    markAllAsRead,
    clearAll
  } = useNotificationStore();

  const notifications = getVisibleNotifications(isAuthenticated);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-black text-slate-900">Notifications &amp; Site Alerts</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time material dispatch alerts, warehouse updates, and wallet notifications.
          </p>
        </div>
        <div className="flex gap-3 text-xs">
          <button
            type="button"
            onClick={() => markAllAsRead(isAuthenticated)}
            className="text-brand-blue-800 font-bold hover:underline"
          >
            Mark all read
          </button>
          <span className="text-slate-300">|</span>
          <button
            type="button"
            onClick={clearAll}
            className="text-slate-400 font-semibold hover:text-red-600"
          >
            Clear all
          </button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400 space-y-2">
          <Bell className="w-10 h-10 mx-auto text-slate-300" />
          <p>You have no notifications at the moment.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 space-y-1">
          {notifications.map((n) => {
            const Icon = TYPE_ICONS[n.type] || Info;
            const colorCls = TYPE_COLORS[n.type] || 'bg-slate-700 text-white';

            return (
              <div
                key={n.id}
                onClick={() => {
                  markAsRead(n.id);
                  if (n.link) navigate(n.link);
                }}
                className={`py-3.5 px-3 rounded-xl flex items-start gap-3 transition-colors cursor-pointer ${
                  !n.read ? 'bg-brand-blue-50/40' : 'hover:bg-slate-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${colorCls}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-bold ${!n.read ? 'text-slate-900' : 'text-slate-700'}`}>
                      {n.title}
                    </h4>
                    <span className="text-[10px] text-slate-400">{n.time}</span>
                  </div>
                  <p className="text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                </div>
                {n.link && (
                  <ChevronRight className="w-4 h-4 text-slate-400 self-center flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
