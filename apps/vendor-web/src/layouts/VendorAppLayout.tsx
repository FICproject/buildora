import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { VendorSidebar } from './VendorSidebar';
import { VendorHeader } from './VendorHeader';
import { useVendorAuthStore } from '../store/useVendorAuthStore';
import { useVendorOrderStore } from '../store/useVendorOrderStore';
import { useVendorInventoryStore } from '../store/useVendorInventoryStore';
import { useVendorNotificationStore } from '../store/useVendorNotificationStore';
import { AlertCircle, ArrowRight, X } from 'lucide-react';

export const VendorAppLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const location = useLocation();

  const { vendor, fetchProfile } = useVendorAuthStore();
  const { fetchOrders } = useVendorOrderStore();
  const { fetchInventory } = useVendorInventoryStore();
  const { fetchNotifications } = useVendorNotificationStore();

  useEffect(() => {
    fetchProfile();
    fetchOrders();
    fetchInventory();
    fetchNotifications();
  }, []);

  // Compute page title from path
  const getPageTitle = (pathname: string) => {
    if (pathname.includes('/products')) return 'Product & Catalog Management';
    if (pathname.includes('/bulk-pricing')) return 'Bulk Pricing & Tier Discounts';
    if (pathname.includes('/orders')) return 'Order Dispatch & Fulfillment';
    if (pathname.includes('/inventory')) return 'Real-Time Inventory & Dark Store Stock';
    if (pathname.includes('/delivery')) return 'Delivery Hub & SLA Settings';
    if (pathname.includes('/earnings')) return 'Settlements & Payout Statements';
    if (pathname.includes('/reports')) return 'Sales & Performance Reports';
    if (pathname.includes('/notifications')) return 'Store Notifications';
    if (pathname.includes('/settings')) return 'Store & Business Settings';
    if (pathname.includes('/onboarding')) return 'Vendor Onboarding & KYC';
    return 'Vendor Dashboard Overview';
  };

  const isKycIncomplete =
    vendor?.status === 'DRAFT' || vendor?.status === 'PENDING_VERIFICATION';

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 antialiased overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <VendorSidebar />
      </div>

      {/* Mobile Drawer Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10">
            <VendorSidebar onCloseMobile={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <VendorHeader
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          title={getPageTitle(location.pathname)}
        />

        {/* KYC Incomplete Banner */}
        {isKycIncomplete && showBanner && location.pathname !== '/onboarding' && (
          <div className="bg-amber-500 text-slate-950 px-4 py-2.5 flex items-center justify-between text-xs font-medium shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-slate-900" />
              <span>
                <strong>KYC Action Required:</strong> Your store is currently under onboarding review.
                Complete bank verification and dark store allocation to enable live ordering.
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link
                to="/onboarding"
                className="inline-flex items-center gap-1 bg-slate-950 text-white px-2.5 py-1 rounded text-xs hover:bg-slate-800 transition-colors"
              >
                Complete Onboarding
                <ArrowRight className="w-3 h-3" />
              </Link>
              <button
                onClick={() => setShowBanner(false)}
                className="text-slate-900 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
