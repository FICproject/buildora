import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingCart,
  Boxes,
  Truck,
  IndianRupee,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  Building2,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useVendorAuthStore } from '../store/useVendorAuthStore';
import { useVendorOrderStore } from '../store/useVendorOrderStore';
import { useVendorInventoryStore } from '../store/useVendorInventoryStore';
import { useVendorNotificationStore } from '../store/useVendorNotificationStore';

interface VendorSidebarProps {
  onCloseMobile?: () => void;
}

export const VendorSidebar: React.FC<VendorSidebarProps> = ({ onCloseMobile }) => {
  const { vendor, logout } = useVendorAuthStore();
  const { orders } = useVendorOrderStore();
  const { inventory } = useVendorInventoryStore();
  const { unreadCount } = useVendorNotificationStore();

  const pendingOrdersCount = orders.filter(
    (o) => o.status === 'NEW' || o.status === 'ACCEPTED'
  ).length;

  const lowStockCount = inventory.filter(
    (i) => i.status === 'LOW_STOCK' || i.status === 'OUT_OF_STOCK'
  ).length;

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      to: '/products',
      label: 'Products & Catalog',
      icon: Package,
    },
    {
      to: '/bulk-pricing',
      label: 'Bulk Pricing',
      icon: Layers,
    },
    {
      to: '/orders',
      label: 'Orders & Dispatch',
      icon: ShoppingCart,
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
      badgeColor: 'bg-amber-500',
    },
    {
      to: '/inventory',
      label: 'Inventory & Stock',
      icon: Boxes,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: 'bg-rose-500',
    },
    {
      to: '/delivery',
      label: 'Delivery & Warehousing',
      icon: Truck,
    },
    {
      to: '/earnings',
      label: 'Payouts & Settlements',
      icon: IndianRupee,
    },
    {
      to: '/reports',
      label: 'Reports & Analytics',
      icon: BarChart3,
    },
    {
      to: '/notifications',
      label: 'Notifications',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined,
      badgeColor: 'bg-blue-600',
    },
    {
      to: '/settings',
      label: 'Store Settings',
      icon: Settings,
    },
  ];

  const isVerified = vendor?.status === 'ACTIVE';

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen border-r border-slate-800 shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
            B
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-base tracking-tight">BUILDORA</span>
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded-sm bg-amber-500/20 text-amber-400 border border-amber-500/30">
                60
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Vendor Partner Portal</p>
          </div>
        </div>
      </div>

      {/* Store Quick Status */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/20">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 truncate">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-medium text-slate-200 truncate">
              {vendor?.businessInfo?.storeName || vendor?.storeName || 'Supreme Materials BLR'}
            </span>
          </div>
          {isVerified ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400">
              <Clock className="w-3 h-3" />
              Review
            </span>
          )}
        </div>
        <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
          <span>Dark Store: WH-BLR-04</span>
          <span>SLA: 60 Mins</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`
              }
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-xs uppercase">
              {(vendor?.businessInfo?.contactPerson || vendor?.name || 'V').charAt(0)}
            </div>
            <div className="truncate">
              <p className="text-xs font-medium text-slate-200 truncate">
                {vendor?.businessInfo?.contactPerson || vendor?.name || 'Vendor Admin'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {vendor?.businessInfo?.email || vendor?.email || 'vendor@buildora.in'}
              </p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            title="Sign Out"
            className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-700/50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
