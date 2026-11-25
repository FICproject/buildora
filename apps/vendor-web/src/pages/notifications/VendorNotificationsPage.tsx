import React, { useState } from 'react';
import { Bell, CheckCheck, ShoppingCart, Boxes, IndianRupee, Info } from 'lucide-react';
import { useVendorNotificationStore } from '../../store/useVendorNotificationStore';
import { PageHeader, Card, Button, Badge, EmptyState } from '../../components/common';

export const VendorNotificationsPage: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useVendorNotificationStore();

  const [filterType, setFilterType] = useState('ALL');

  const filtered = notifications.filter((n) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'STOCK') return n.type === 'STOCK' || (n.type as string) === 'INVENTORY';
    return n.type === filterType;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'ORDER':
        return <ShoppingCart className="w-4 h-4 text-[#23438F]" />;
      case 'STOCK':
      case 'INVENTORY':
        return <Boxes className="w-4 h-4 text-[#E6A23C]" />;
      case 'SETTLEMENT':
        return <IndianRupee className="w-4 h-4 text-[#15966B]" />;
      default:
        return <Info className="w-4 h-4 text-[#718096]" />;
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Notifications"
        description="Order alerts, low-stock warnings, and settlement updates."
        actions={
          unreadCount > 0 ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => markAllAsRead()}
              leftIcon={<CheckCheck className="w-3.5 h-3.5" />}
            >
              Mark All Read ({unreadCount})
            </Button>
          ) : null
        }
      />

      <div className="flex flex-wrap gap-2">
        {[
          { id: 'ALL', label: 'All Alerts' },
          { id: 'ORDER', label: 'Orders' },
          { id: 'STOCK', label: 'Stock Alerts' },
          { id: 'SETTLEMENT', label: 'Settlements' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setFilterType(t.id)}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              filterType === t.id
                ? 'bg-[#23438F] text-white'
                : 'bg-white border border-[#E5E9F0] text-[#718096] hover:text-[#263247]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card>
        <div className="divide-y divide-[#E5E9F0]">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Bell className="w-5 h-5" />}
              title="No notifications"
              description="There are no alerts in this category."
            />
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => markAsRead(item.id)}
                className={`p-4 flex items-start gap-3.5 cursor-pointer transition-colors ${
                  !item.read ? 'bg-[#EEF3FA]/60 hover:bg-[#EEF3FA]' : 'hover:bg-[#F7F8FA]'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-white border border-[#E5E9F0] flex items-center justify-center shrink-0">
                  {getIcon(item.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-semibold text-[#263247]">{item.title}</h4>
                    <span className="text-[11px] text-[#718096] whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-[#718096] mt-0.5">{item.message}</p>
                </div>

                {!item.read && (
                  <Badge variant="accent" size="sm">
                    New
                  </Badge>
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default VendorNotificationsPage;
