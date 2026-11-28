import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingCart,
  FileSpreadsheet,
  Tag,
  Warehouse,
  Truck,
  Users,
  IndianRupee,
  BarChart3,
  Bell,
  HelpCircle,
  Building2,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useVendorAuthStore } from '../store/useVendorAuthStore';
import { useVendorOrderStore } from '../store/useVendorOrderStore';
import { useVendorNotificationStore } from '../store/useVendorNotificationStore';

interface VendorSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onCloseMobile?: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

export const VendorSidebar: React.FC<VendorSidebarProps> = ({
  collapsed = false,
  onToggleCollapse,
  onCloseMobile,
}) => {
  const { vendor, logout } = useVendorAuthStore();
  const { orders } = useVendorOrderStore();
  const { unreadCount } = useVendorNotificationStore();

  const pendingOrdersCount = orders.filter(
    (o) => o.status === 'NEW' || o.status === 'ACCEPTED'
  ).length;

  const navGroups: NavGroup[] = [
    {
      group: 'Overview',
      items: [{ to: '/dashboard', label: 'Overview', icon: LayoutDashboard }],
    },
    {
      group: 'Catalog & Stock',
      items: [
        { to: '/products', label: 'Products', icon: Package },
        { to: '/inventory', label: 'Inventory', icon: Boxes },
        { to: '/warehouses', label: 'Warehouses', icon: Warehouse },
      ],
    },
    {
      group: 'Orders & Dispatch',
      items: [
        {
          to: '/orders',
          label: 'Orders',
          icon: ShoppingCart,
          badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
        },
        { to: '/quotations', label: 'Bulk Orders / Quotations', icon: FileSpreadsheet },
        { to: '/pricing-offers', label: 'Pricing & Offers', icon: Tag },
        { to: '/delivery', label: 'Delivery & Dispatch', icon: Truck },
        { to: '/customers', label: 'Customers', icon: Users },
      ],
    },
    {
      group: 'Finance & Account',
      items: [
        { to: '/earnings', label: 'Payments & Settlements', icon: IndianRupee },
        { to: '/reports', label: 'Reports & Analytics', icon: BarChart3 },
        {
          to: '/notifications',
          label: 'Notifications',
          icon: Bell,
          badge: unreadCount > 0 ? unreadCount : undefined,
        },
        { to: '/support', label: 'Support', icon: HelpCircle },
        { to: '/business-profile', label: 'Business Profile', icon: Building2 },
        { to: '/settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  const storeName =
    vendor?.businessInfo?.storeName || vendor?.storeName || 'Supreme Materials BLR';

  return (
    <aside
      className={`${
        collapsed ? 'w-[72px]' : 'w-64 max-w-[85vw]'
      } bg-[#943D24] text-white flex flex-col h-full border-r border-[#7D331E] shrink-0 select-none transition-all duration-200 ease-in-out`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/15 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#F6C453] flex items-center justify-center text-[#943D24] font-extrabold text-sm shrink-0 shadow-sm">
            B
          </div>
          {!collapsed && (
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-bold text-white text-base tracking-tight">
                BUILDORA
              </span>
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-[#F6C453] text-[#292524]">
                60
              </span>
            </div>
          )}
        </div>

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden lg:flex p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-[#A6482D] transition-colors cursor-pointer"
          >
            {collapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        )}

        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="lg:hidden p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-[#A6482D] transition-colors cursor-pointer"
          >
            <span className="text-base font-bold leading-none px-1">&times;</span>
          </button>
        )}
      </div>

      {/* Grouped Navigation Links */}
      <nav
        className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4"
        aria-label="Vendor Portal Navigation"
      >
        {navGroups.map((group) => (
          <div key={group.group} className="space-y-0.5">
            {!collapsed && (
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-white/60">
                {group.group}
              </p>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onCloseMobile}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center ${
                      collapsed ? 'justify-center px-2' : 'justify-between px-3'
                    } py-2 rounded-lg text-[13px] font-medium transition-colors ${
                      isActive
                        ? 'bg-[#F6C453] text-[#943D24] font-semibold shadow-sm'
                        : 'text-white/90 hover:text-white hover:bg-[#A6482D]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-[#943D24]' : 'text-white'
                          }`}
                        />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </div>
                      {!collapsed && item.badge !== undefined && (
                        <span
                          className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                            isActive
                              ? 'bg-[#943D24] text-white'
                              : 'bg-[#F6C453] text-[#292524]'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-white/15 shrink-0">
        {collapsed ? (
          <button
            type="button"
            onClick={() => logout()}
            title="Sign Out"
            aria-label="Sign Out"
            className="w-full flex items-center justify-center p-2 rounded-lg text-white/85 hover:text-white hover:bg-[#A6482D] transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg bg-black/10">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{storeName}</p>
              <p className="text-[11px] text-white/75 truncate">
                {vendor?.businessInfo?.email || vendor?.email || 'vendor@buildora.in'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => logout()}
              title="Sign Out"
              aria-label="Sign Out"
              className="p-1.5 rounded-lg text-white/80 hover:text-[#F6C453] hover:bg-[#A6482D] transition-colors shrink-0 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
