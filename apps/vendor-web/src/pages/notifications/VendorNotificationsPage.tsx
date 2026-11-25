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
        return <ShoppingCart className="w-4 h-4 text-[#943D24]" />;
      case 'STOCK':
      case 'INVENTORY':
        return <Boxes className="w-4 h-4 text-[#D99B16]" />;
      case 'SETTLEMENT':
        return <IndianRupee className="w-4 h-4 text-[#15966B]" />;
      default:
        return <Info className="w-4 h-4 text-[#78716C]" />;
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
                ? 'bg-[#943D24] text-white'
                : 'bg-white border border-[#E7E5E4] text-[#78716C] hover:text-[#292524]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card>
        <div className="divide-y divide-[#E7E5E4]">
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
                  !item.read ? 'bg-[#FBF3F0]/60 hover:bg-[#FBF3F0]' : 'hover:bg-[#F8F7F5]'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-white border border-[#E7E5E4] flex items-center justify-center shrink-0">
                  {getIcon(item.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-semibold text-[#292524]">{item.title}</h4>
                    <span className="text-[11px] text-[#78716C] whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-[#78716C] mt-0.5">{item.message}</p>
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
