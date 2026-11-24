import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Layers,
  Sparkles,
  Boxes,
  Warehouse,
  ShoppingCart,
  RotateCcw,
  Tag,
  Star,
  IndianRupee,
  FileText,
  BarChart3,
  Users,
  HelpCircle,
  Settings,
  LogOut,
  Building2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { useVendorAuthStore } from '../store/useVendorAuthStore';
import { useVendorOrderStore } from '../store/useVendorOrderStore';
import { useVendorInventoryStore } from '../store/useVendorInventoryStore';
import { useVendorNotificationStore } from '../store/useVendorNotificationStore';

interface VendorSidebarProps {
  onCloseMobile?: () => void;
}

interface NavGroup {
  title: string;
  items: {
    to: string;
    label: string;
    icon: React.ElementType;
    badge?: number | string;
    badgeColor?: string;
  }[];
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

  const navGroups: NavGroup[] = [
    {
      title: 'OVERVIEW',
      items: [
        {
          to: '/dashboard',
          label: 'Dashboard Overview',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: 'CATALOG & PRODUCTS',
      items: [
        {
          to: '/products',
          label: 'Products & Attributes',
          icon: Package,
        },
        {
          to: '/bulk-pricing',
          label: 'Bulk Pricing Tiers',
          icon: Layers,
        },
        {
          to: '/new-launches',
          label: 'New Launches Spotlight',
          icon: Sparkles,
        },
      ],
    },
    {
      title: 'INVENTORY & DEPOTS',
      items: [
        {
          to: '/inventory',
          label: 'Real-Time Inventory',
          icon: Boxes,
          badge: lowStockCount > 0 ? lowStockCount : undefined,
          badgeColor: 'bg-rose-500 text-white',
        },
        {
          to: '/warehouses',
          label: 'Warehouses & Dark Stores',
          icon: Warehouse,
        },
      ],
    },
    {
      title: 'ORDERS & FULFILLMENT',
      items: [
        {
          to: '/orders',
          label: 'Orders & 60-Min Dispatch',
          icon: ShoppingCart,
          badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
          badgeColor: 'bg-[#FF7417] text-white',
        },
        {
          to: '/returns',
          label: 'Returns & Refunds',
          icon: RotateCcw,
        },
      ],
    },
    {
      title: 'GROWTH & ENGAGEMENT',
      items: [
        {
          to: '/promotions',
          label: 'Offers & Promotions',
          icon: Tag,
        },
        {
          to: '/reviews',
          label: 'Customer Reviews & Ratings',
          icon: Star,
        },
      ],
    },
    {
      title: 'FINANCE & ACCOUNTS',
      items: [
        {
          to: '/earnings',
          label: 'Payouts & Settlements',
          icon: IndianRupee,
        },
        {
          to: '/invoices',
          label: 'Invoices & GST ITC',
          icon: FileText,
        },
        {
          to: '/reports',
          label: 'Analytics & Reports',
          icon: BarChart3,
        },
      ],
    },
    {
      title: 'ORGANIZATION & SETTINGS',
      items: [
        {
          to: '/team',
          label: 'Team & RBAC (7 Roles)',
          icon: Users,
        },
        {
          to: '/support',
          label: 'Partner Support Tickets',
          icon: HelpCircle,
        },
        {
          to: '/settings',
          label: 'Store & Security Settings',
          icon: Settings,
        },
      ],
    },
  ];

  const isVerified = vendor?.status === 'ACTIVE' || vendor?.status === 'APPROVED';

  return (
    <aside className="w-68 bg-white text-[#17233C] flex flex-col h-screen border-r border-[#E2E8F0] shrink-0 select-none shadow-xs">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-[#E2E8F0] bg-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#203D91] flex items-center justify-center text-white font-extrabold text-base shadow-sm">
            B
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-[#203D91] text-base tracking-tight">BUILDORA</span>
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-[#FF7417] text-white">
                60
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-semibold tracking-wide">Build Smart. Supply Better.</p>
          </div>
        </div>
      </div>

      {/* Store Badge & Location */}
      <div className="px-4 py-3 border-b border-[#E2E8F0] bg-[#F4F7FC]">
        <div className="flex items-center justify-between text-xs mb-1">
          <div className="flex items-center gap-2 truncate font-bold text-[#17233C]">
            <Building2 className="w-3.5 h-3.5 text-[#203D91] shrink-0" />
            <span className="truncate">
              {vendor?.businessInfo?.storeName || vendor?.storeName || 'Supreme Materials BLR'}
            </span>
          </div>
          {isVerified ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="w-3 h-3 text-amber-600" />
              Review
            </span>
          )}
        </div>
        <div className="text-[10px] text-slate-500 flex items-center justify-between font-medium">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            WH-BLR-04 Peenya Hub
          </span>
          <span className="font-semibold text-[#203D91]">60-Min SLA Live</span>
        </div>
      </div>

      {/* Grouped Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <h3 className="px-3 text-[10px] font-extrabold text-slate-600 tracking-wider">
              {group.title}
            </h3>
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#203D91] text-white shadow-xs font-bold'
                        : 'text-slate-600 hover:text-[#203D91] hover:bg-[#F4F7FC]'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${item.badgeColor || 'bg-[#203D91] text-white'}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Footer with Role & Logout */}
      <div className="p-3 border-t border-[#E2E8F0] bg-[#F4F7FC]">
        <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#203D91]/10 text-[#203D91] flex items-center justify-center font-black text-xs uppercase border border-[#203D91]/20">
              {(vendor?.businessInfo?.contactPerson || vendor?.name || 'V').charAt(0)}
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-[#17233C] truncate">
                  {vendor?.businessInfo?.contactPerson || vendor?.name || 'Vikramaditya Rao'}
                </p>
                <span className="text-[9px] font-extrabold px-1 py-0.2 bg-[#FF7417]/10 text-[#FF7417] rounded border border-[#FF7417]/20">
                  OWNER
                </span>
              </div>
              <p className="text-[10px] text-slate-600 truncate font-medium">
                {vendor?.businessInfo?.email || vendor?.email || 'vendor@buildora.in'}
              </p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            title="Sign Out of Vendor Portal"
            className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
