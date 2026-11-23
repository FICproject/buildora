import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  ShoppingCart,
  Boxes,
  IndianRupee,
  AlertCircle,
  Clock,
  Info,
} from 'lucide-react';
import { useVendorNotificationStore } from '../../store/useVendorNotificationStore';
import { Card, CardHeader, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const VendorNotificationsPage: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useVendorNotificationStore();

  const [filterType, setFilterType] = useState('ALL');

  const filtered = notifications.filter((n) => {
    if (filterType === 'ALL') return true;
    return n.type === filterType;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'ORDER':
        return <ShoppingCart className="w-4 h-4 text-blue-600" />;
      case 'INVENTORY':
        return <Boxes className="w-4 h-4 text-amber-500" />;
      case 'SETTLEMENT':
        return <IndianRupee className="w-4 h-4 text-emerald-600" />;
      default:
        return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Store Notifications
            </h1>
            {unreadCount > 0 && (
              <Badge variant="brand">{unreadCount} New</Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time fulfillment alerts, customer order placements, and payout confirmations.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => markAllAsRead()}
            leftIcon={<CheckCheck className="w-3.5 h-3.5" />}
          >
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['ALL', 'ORDER', 'INVENTORY', 'SETTLEMENT'].map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              filterType === t
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t === 'ALL'
              ? 'All Alerts'
              : t === 'ORDER'
              ? 'Orders'
              : t === 'INVENTORY'
              ? 'Stock Alerts'
              : 'Settlements'}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <Card>
        <div className="divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No notifications found in this category.
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => markAsRead(item.id)}
                className={`p-4 flex items-start gap-3.5 cursor-pointer transition-colors ${
                  !item.read ? 'bg-blue-50/40 hover:bg-blue-50/70' : 'hover:bg-slate-50'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 shadow-2xs flex items-center justify-center shrink-0">
                  {getIcon(item.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">{item.message}</p>
                </div>

                {!item.read && (
                  <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 self-center" />
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
