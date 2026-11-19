import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Package,
  MapPin,
  Wallet,
  Award,
  Bell,
  FolderKanban,
  LifeBuoy,
  ShieldCheck,
  ChevronRight,
  Truck,
  ArrowRight,
  Building2,
  Clock,
  Sparkles,
  CreditCard,
  Heart
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useOrderStore } from '../store/useOrderStore';
import { useProjectStore } from '../store/useProjectStore';
import { useWishlistStore } from '../store/useWishlistStore';
import { formatCurrency } from '@buildora/utils';
import { Button } from '../components/ui/Button';

export const AccountDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { orders } = useOrderStore();
  const { projects } = useProjectStore();
  const { items: wishlistItems } = useWishlistStore();

  const activeOrders = orders.filter((o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
  const recentOrders = orders.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* 1. Welcome Header Banner */}
      <div className="bg-gradient-to-r from-brand-blue-950 via-brand-blue-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-4 z-10">
          <div className="w-16 h-16 rounded-2xl bg-brand-orange-500 text-white flex items-center justify-center font-black text-2xl shadow-lg border-2 border-white/20">
            {user?.name ? user.name.charAt(0) : 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black">{user?.name || 'Customer Account'}</h1>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Verified Contractor
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              +91 {user?.phone || '9876543210'} &bull; {user?.email || 'customer@buildora.com'}
            </p>
            {user?.businessName && (
              <div className="text-xs text-amber-300 font-semibold flex items-center gap-1.5 mt-1">
                <Building2 className="w-3.5 h-3.5" />
                <span>{user.businessName} (GSTIN: {user.gstin})</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 z-10">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/account/profile')}
            className="bg-white/10 text-white border-white/20 hover:bg-white/20 text-xs"
          >
            Edit Profile
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/products')}
            className="text-xs"
          >
            Order Materials
          </Button>
        </div>
      </div>

      {/* 2. Key Stats Cards: Wallet, Rewards, Active Orders, Wishlist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Wallet Balance Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Buildora Wallet</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {formatCurrency(user?.walletBalance || 0)}
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
            <Link to="/account/wallet" className="font-bold text-brand-blue-800 hover:underline">
              Top Up &amp; Ledger &rarr;
            </Link>
            <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
              Instant
            </span>
          </div>
        </div>

        {/* Contractor Rewards Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reward Points</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {user?.rewardPoints || 0} <span className="text-sm font-semibold text-slate-400">pts</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
            <Link to="/account/rewards" className="font-bold text-brand-blue-800 hover:underline">
              Tier Benefits &rarr;
            </Link>
            <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">
              Gold Club
            </span>
          </div>
        </div>

        {/* Active Dispatches Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Dispatches</span>
            <div className="w-8 h-8 rounded-xl bg-brand-orange-50 text-brand-orange-600 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {activeOrders.length} <span className="text-sm font-semibold text-slate-400">on road</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
            <Link to="/account/orders" className="font-bold text-brand-blue-800 hover:underline">
              View Dispatches &rarr;
            </Link>
            {activeOrders.length > 0 && (
              <span className="text-[10px] text-brand-orange-700 font-semibold bg-brand-orange-50 px-1.5 py-0.5 rounded animate-pulse">
                Live
              </span>
            )}
          </div>
        </div>

        {/* Saved Materials / Wishlist */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Saved Materials</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Heart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {wishlistItems.length} <span className="text-sm font-semibold text-slate-400">items</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
            <Link to="/account/wishlist" className="font-bold text-brand-blue-800 hover:underline">
              View Wishlist &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Active Order Alert Banner if any */}
      {activeOrders.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent p-5 rounded-2xl border border-brand-orange-300/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-orange-500 text-white flex items-center justify-center flex-shrink-0 animate-bounce">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Active Site Dispatch En Route
              </div>
              <div className="text-sm font-bold text-slate-800">
                Order #{activeOrders[0].orderNumber} &bull; Estimated: {activeOrders[0].estimatedDeliveryTime}
              </div>
              <div className="text-xs text-slate-500">
                Vehicle: {activeOrders[0].deliveryPartner?.vehicleNumber} &bull; Driver: {activeOrders[0].deliveryPartner?.name}
              </div>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/orders/${activeOrders[0].orderNumber}/track`)}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Live GPS Tracking
          </Button>
        </div>
      )}

      {/* 4. Recent Orders Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-black text-slate-900">Recent Material Orders</h2>
            <p className="text-xs text-slate-500">Your latest site deliveries and status.</p>
          </div>
          <Link to="/account/orders" className="text-xs font-bold text-brand-blue-800 hover:underline">
            View All ({orders.length}) &rarr;
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No orders placed yet. Explore 28 categories to place your first site order.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentOrders.map((order) => (
              <div key={order.id} className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-700 flex-shrink-0">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">
                      Order #{order.orderNumber}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {order.items.length} items &bull; {formatCurrency(order.grandTotal)} &bull; {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    order.status === 'DELIVERED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : order.status === 'CANCELLED'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800 animate-pulse'
                  }`}>
                    {order.status.replace(/_/g, ' ')}
                  </span>
                  <Link
                    to={`/account/orders/${order.orderNumber}`}
                    className="font-bold text-brand-blue-800 hover:underline px-2 py-1"
                  >
                    Details &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Shortcuts Grid: Projects, Addresses, Support, Security */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Project Lists Shortcut */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-brand-blue-700 flex items-center justify-center">
            <FolderKanban className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900">Project Shopping Lists</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Manage bill-of-materials across multiple sites ({projects.length} active projects).
          </p>
          <Link to="/account/projects" className="inline-block text-xs font-bold text-brand-blue-800 hover:underline">
            Manage Projects &rarr;
          </Link>
        </div>

        {/* Site Delivery Addresses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="w-9 h-9 rounded-xl bg-orange-50 text-brand-orange-600 flex items-center justify-center">
            <MapPin className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900">Site Addresses</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Save delivery locations with gate unloading and site engineer contact instructions.
          </p>
          <Link to="/account/addresses" className="inline-block text-xs font-bold text-brand-blue-800 hover:underline">
            Manage Addresses &rarr;
          </Link>
        </div>

        {/* Customer Support Desk */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <LifeBuoy className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900">Dedicated Site Support</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Need material replacements or offloading crane assistance? Create a direct ticket.
          </p>
          <Link to="/account/support" className="inline-block text-xs font-bold text-brand-blue-800 hover:underline">
            Open Helpdesk &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};
