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

  const navItems: NavItem[] = [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/products', label: 'Products', icon: Package },
    { to: '/inventory', label: 'Inventory', icon: Boxes },
    {
      to: '/orders',
      label: 'Orders',
      icon: ShoppingCart,
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
    },
    { to: '/quotations', label: 'Bulk Orders / Quotations', icon: FileSpreadsheet },
    { to: '/pricing-offers', label: 'Pricing & Offers', icon: Tag },
    { to: '/warehouses', label: 'Warehouses', icon: Warehouse },
    { to: '/delivery', label: 'Delivery & Dispatch', icon: Truck },
    { to: '/customers', label: 'Customers', icon: Users },
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
  ];

  const storeName =
    vendor?.businessInfo?.storeName || vendor?.storeName || 'Supreme Materials BLR';

  return (
    <aside
      className={`${
        collapsed ? 'w-[72px]' : 'w-64'
      } bg-white text-[#263247] flex flex-col h-screen border-r border-[#E5E9F0] shrink-0 select-none transition-all duration-200`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#E5E9F0] shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#23438F] flex items-center justify-center text-white font-bold text-sm shrink-0">
            B
          </div>
          {!collapsed && (
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-bold text-[#23438F] text-base tracking-tight">
                BUILDORA
              </span>
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-[#F58220] text-white">
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
            className="hidden md:flex p-1.5 rounded-lg text-[#718096] hover:text-[#23438F] hover:bg-[#EEF3FA] transition-colors cursor-pointer"
          >
            {collapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-0.5" aria-label="Vendor Portal Navigation">
        {navItems.map((item) => {
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
                    ? 'bg-[#EEF3FA] text-[#23438F] font-semibold'
                    : 'text-[#718096] hover:text-[#263247] hover:bg-[#F7F8FA]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-[#23438F]' : 'text-[#718096]'
                      }`}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!collapsed && item.badge !== undefined && (
                    <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-[#F58220] text-white shrink-0">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Simple Footer */}
      <div className="p-3 border-t border-[#E5E9F0] shrink-0">
        {collapsed ? (
          <button
            type="button"
            onClick={() => logout()}
            title="Sign Out"
            aria-label="Sign Out"
            className="w-full flex items-center justify-center p-2 rounded-lg text-[#718096] hover:text-[#DC4545] hover:bg-[#DC4545]/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex items-center justify-between gap-2 px-2 py-1.5">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#263247] truncate">{storeName}</p>
              <p className="text-[11px] text-[#718096] truncate">
                {vendor?.businessInfo?.email || vendor?.email || 'vendor@buildora.in'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => logout()}
              title="Sign Out"
              aria-label="Sign Out"
              className="p-1.5 rounded-lg text-[#718096] hover:text-[#DC4545] hover:bg-[#DC4545]/10 transition-colors shrink-0 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
