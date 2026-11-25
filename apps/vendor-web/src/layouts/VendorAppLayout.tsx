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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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

  const getPageTitle = (pathname: string) => {
    if (pathname.includes('/products')) return 'Products';
    if (pathname.includes('/inventory')) return 'Inventory';
    if (pathname.includes('/orders') || pathname.includes('/shipping')) return 'Orders';
    if (pathname.includes('/quotations')) return 'Bulk Orders / Quotations';
    if (
      pathname.includes('/pricing-offers') ||
      pathname.includes('/bulk-pricing') ||
      pathname.includes('/promotions')
    )
      return 'Pricing & Offers';
    if (pathname.includes('/warehouses')) return 'Warehouses';
    if (pathname.includes('/delivery')) return 'Delivery & Dispatch';
    if (pathname.includes('/customers') || pathname.includes('/reviews')) return 'Customers';
    if (pathname.includes('/earnings') || pathname.includes('/invoices'))
      return 'Payments & Settlements';
    if (pathname.includes('/reports')) return 'Reports & Analytics';
    if (pathname.includes('/notifications')) return 'Notifications';
    if (pathname.includes('/support')) return 'Support';
    if (pathname.includes('/business-profile') || pathname.includes('/onboarding'))
      return 'Business Profile';
    if (pathname.includes('/settings') || pathname.includes('/team')) return 'Settings';
    if (pathname.includes('/returns')) return 'Returns';
    if (pathname.includes('/new-launches')) return 'New Launches';
    return 'Overview';
  };

  const isKycIncomplete =
    vendor?.status === 'DRAFT' || vendor?.status === 'PENDING_VERIFICATION';

  return (
    <div className="flex h-screen bg-[#F8F7F5] text-[#292524] antialiased overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <VendorSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        />
      </div>

      {/* Mobile Drawer Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-[#292524]/40"
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

        {/* KYC Incomplete Promotional / Attention Banner */}
        {isKycIncomplete && showBanner && location.pathname !== '/onboarding' && (
          <div className="bg-[#FEF9EB] border-b border-[#F6C453] text-[#292524] px-4 py-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#943D24]" />
              <span>
                <strong>Action Required:</strong> Complete onboarding verification to enable live
                order fulfillment.
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link
                to="/onboarding"
                className="font-semibold text-[#943D24] hover:underline flex items-center gap-1"
              >
                Complete Setup <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setShowBanner(false)}
                aria-label="Dismiss alert"
                className="text-[#78716C] hover:text-[#292524] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Main Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
