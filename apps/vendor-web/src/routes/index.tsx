import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, PublicRoute, getVendorRedirect } from './ProtectedRoute';
import { VendorAppLayout, VendorAuthLayout } from '../layouts';
import { useVendorAuthStore } from '../store/useVendorAuthStore';

// Auth & Status Pages
import { VendorLoginPage } from '../pages/auth/VendorLoginPage';
import { VendorRegisterPage } from '../pages/auth/VendorRegisterPage';
import { VendorForgotPasswordPage } from '../pages/auth/VendorForgotPasswordPage';
import { VendorApplicationStatusPage } from '../pages/auth/VendorApplicationStatusPage';
import { VendorRejectionPage } from '../pages/auth/VendorRejectionPage';
import { VendorRestrictedPage } from '../pages/auth/VendorRestrictedPage';

// Vendor Portal Dashboard & Management Pages
import { VendorOnboardingPage } from '../pages/onboarding/VendorOnboardingPage';
import { VendorDashboardPage } from '../pages/dashboard/VendorDashboardPage';
import { VendorProductsPage } from '../pages/products/VendorProductsPage';
import { VendorBulkPricingPage } from '../pages/bulk-pricing/VendorBulkPricingPage';
import { VendorOrdersPage } from '../pages/orders/VendorOrdersPage';
import { VendorInventoryPage } from '../pages/inventory/VendorInventoryPage';
import { VendorDeliveryPage } from '../pages/delivery/VendorDeliveryPage';
import { VendorEarningsPage } from '../pages/earnings/VendorEarningsPage';
import { VendorReportsPage } from '../pages/reports/VendorReportsPage';
import { VendorNotificationsPage } from '../pages/notifications/VendorNotificationsPage';
import { VendorSettingsPage } from '../pages/settings/VendorSettingsPage';
import { VendorWarehousesPage } from '../pages/warehouses/VendorWarehousesPage';
import { VendorReturnsPage } from '../pages/returns/VendorReturnsPage';
import { VendorPromotionsPage } from '../pages/promotions/VendorPromotionsPage';
import { VendorNewLaunchesPage } from '../pages/new-launches/VendorNewLaunchesPage';
import { VendorReviewsPage } from '../pages/reviews/VendorReviewsPage';
import { VendorInvoicesPage } from '../pages/invoices/VendorInvoicesPage';
import { VendorTeamPage } from '../pages/team/VendorTeamPage';
import { VendorSupportPage } from '../pages/support/VendorSupportPage';

export const AppRoutes: React.FC = () => {
  const { isAuthenticated, vendor } = useVendorAuthStore();
  const defaultHome = isAuthenticated ? getVendorRedirect(vendor?.status) : '/login';

  return (
    <Routes>
      {/* Public & Auth Layout Routes */}
      <Route element={<VendorAuthLayout />}>
        <Route path="/login" element={<VendorLoginPage />} />
        <Route path="/register" element={<VendorRegisterPage />} />
        <Route path="/forgot-password" element={<VendorForgotPasswordPage />} />
        
        {/* Status Views under Brand Auth Layout */}
        <Route path="/application-status" element={<VendorApplicationStatusPage />} />
        <Route path="/rejection-details" element={<VendorRejectionPage />} />
        <Route path="/account-restricted" element={<VendorRestrictedPage />} />
      </Route>

      {/* Protected Vendor App Routes (Only APPROVED / ACTIVE Vendors) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<VendorAppLayout />}>
          <Route path="/dashboard" element={<VendorDashboardPage />} />
          <Route path="/onboarding" element={<VendorOnboardingPage />} />
          <Route path="/products" element={<VendorProductsPage />} />
          <Route path="/bulk-pricing" element={<VendorBulkPricingPage />} />
          <Route path="/new-launches" element={<VendorNewLaunchesPage />} />
          <Route path="/orders" element={<VendorOrdersPage />} />
          <Route path="/shipping" element={<VendorOrdersPage />} />
          <Route path="/inventory" element={<VendorInventoryPage />} />
          <Route path="/warehouses" element={<VendorWarehousesPage />} />
          <Route path="/returns" element={<VendorReturnsPage />} />
          <Route path="/promotions" element={<VendorPromotionsPage />} />
          <Route path="/reviews" element={<VendorReviewsPage />} />
          <Route path="/delivery" element={<VendorDeliveryPage />} />
          <Route path="/earnings" element={<VendorEarningsPage />} />
          <Route path="/invoices" element={<VendorInvoicesPage />} />
          <Route path="/reports" element={<VendorReportsPage />} />
          <Route path="/team" element={<VendorTeamPage />} />
          <Route path="/support" element={<VendorSupportPage />} />
          <Route path="/notifications" element={<VendorNotificationsPage />} />
          <Route path="/settings" element={<VendorSettingsPage />} />
        </Route>
      </Route>

      {/* Catch-all redirect */}
      <Route path="/" element={<Navigate to={defaultHome} replace />} />
      <Route path="*" element={<Navigate to={defaultHome} replace />} />
    </Routes>
  );
};

export default AppRoutes;
