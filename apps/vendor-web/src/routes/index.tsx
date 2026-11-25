import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, getVendorRedirect } from './ProtectedRoute';
import { VendorAppLayout, VendorAuthLayout } from '../layouts';
import { useVendorAuthStore } from '../store/useVendorAuthStore';

// Auth & Status Pages
import { VendorLoginPage } from '../pages/auth/VendorLoginPage';
import { VendorRegisterPage } from '../pages/auth/VendorRegisterPage';
import { VendorForgotPasswordPage } from '../pages/auth/VendorForgotPasswordPage';
import { VendorApplicationStatusPage } from '../pages/auth/VendorApplicationStatusPage';
import { VendorReviewPage } from '../pages/auth/VendorReviewPage';
import { VendorRejectionPage } from '../pages/auth/VendorRejectionPage';
import { VendorRestrictedPage } from '../pages/auth/VendorRestrictedPage';
import { DevAdminVendorApprovalPage } from '../pages/admin/DevAdminVendorApprovalPage';

// Vendor Portal Dashboard & Management Pages
import { VendorOnboardingPage } from '../pages/onboarding/VendorOnboardingPage';
import { VendorDashboardPage } from '../pages/dashboard/VendorDashboardPage';
import { VendorProductsPage } from '../pages/products/VendorProductsPage';
import { VendorOrdersPage } from '../pages/orders/VendorOrdersPage';
import { VendorInventoryPage } from '../pages/inventory/VendorInventoryPage';
import { VendorQuotationsPage } from '../pages/quotations/VendorQuotationsPage';
import { VendorPricingOffersPage } from '../pages/pricing/VendorPricingOffersPage';
import { VendorWarehousesPage } from '../pages/warehouses/VendorWarehousesPage';
import { VendorDeliveryPage } from '../pages/delivery/VendorDeliveryPage';
import { VendorCustomersPage } from '../pages/customers/VendorCustomersPage';
import { VendorEarningsPage } from '../pages/earnings/VendorEarningsPage';
import { VendorReportsPage } from '../pages/reports/VendorReportsPage';
import { VendorNotificationsPage } from '../pages/notifications/VendorNotificationsPage';
import { VendorSupportPage } from '../pages/support/VendorSupportPage';
import { VendorBusinessProfilePage } from '../pages/profile/VendorBusinessProfilePage';
import { VendorSettingsPage } from '../pages/settings/VendorSettingsPage';
import { VendorReturnsPage } from '../pages/returns/VendorReturnsPage';
import { VendorNewLaunchesPage } from '../pages/new-launches/VendorNewLaunchesPage';
import { VendorInvoicesPage } from '../pages/invoices/VendorInvoicesPage';

export const AppRoutes: React.FC = () => {
  const { isAuthenticated, vendor } = useVendorAuthStore();
  const defaultHome = isAuthenticated ? getVendorRedirect(vendor?.status, vendor?.applicationId) : '/login';

  return (
    <Routes>
      {/* Standalone Vendor Login Page */}
      <Route path="/login" element={<VendorLoginPage />} />

      {/* Public & Auth Layout Routes */}
      <Route element={<VendorAuthLayout />}>
        <Route path="/register" element={<VendorRegisterPage />} />
        <Route path="/vendor/register" element={<VendorRegisterPage />} />
        <Route path="/forgot-password" element={<VendorForgotPasswordPage />} />

        {/* Status & Review Views */}
        <Route path="/registration/review/:applicationId" element={<VendorReviewPage />} />
        <Route path="/registration/review" element={<VendorReviewPage />} />
        <Route path="/vendor/registration/review/:applicationId" element={<VendorReviewPage />} />
        <Route path="/vendor/registration/review" element={<VendorReviewPage />} />
        <Route path="/application-status/:applicationId" element={<VendorApplicationStatusPage />} />
        <Route path="/application-status" element={<VendorApplicationStatusPage />} />
        <Route path="/rejection-details" element={<VendorRejectionPage />} />
        <Route path="/account-restricted" element={<VendorRestrictedPage />} />
      </Route>

      {/* Development-Only Admin Approval Console */}
      {!import.meta.env.PROD && (
        <Route path="/dev-admin/vendor-approvals" element={<DevAdminVendorApprovalPage />} />
      )}

      {/* Protected Vendor App Routes (Only APPROVED / ACTIVE Vendors) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<VendorAppLayout />}>
          <Route path="/dashboard" element={<VendorDashboardPage />} />
          <Route path="/onboarding" element={<VendorOnboardingPage />} />
          <Route path="/products" element={<VendorProductsPage />} />
          <Route path="/inventory" element={<VendorInventoryPage />} />
          <Route path="/orders" element={<VendorOrdersPage />} />
          <Route path="/shipping" element={<VendorOrdersPage />} />
          <Route path="/quotations" element={<VendorQuotationsPage />} />
          <Route path="/pricing-offers" element={<VendorPricingOffersPage initialTab="BULK_TIERS" />} />
          <Route path="/bulk-pricing" element={<VendorPricingOffersPage initialTab="BULK_TIERS" />} />
          <Route path="/promotions" element={<VendorPricingOffersPage initialTab="PROMOTIONS" />} />
          <Route path="/new-launches" element={<VendorNewLaunchesPage />} />
          <Route path="/warehouses" element={<VendorWarehousesPage />} />
          <Route path="/delivery" element={<VendorDeliveryPage />} />
          <Route path="/customers" element={<VendorCustomersPage initialTab="DIRECTORY" />} />
          <Route path="/reviews" element={<VendorCustomersPage initialTab="REVIEWS" />} />
          <Route path="/returns" element={<VendorReturnsPage />} />
          <Route path="/earnings" element={<VendorEarningsPage />} />
          <Route path="/invoices" element={<VendorInvoicesPage />} />
          <Route path="/reports" element={<VendorReportsPage />} />
          <Route path="/notifications" element={<VendorNotificationsPage />} />
          <Route path="/support" element={<VendorSupportPage />} />
          <Route path="/business-profile" element={<VendorBusinessProfilePage />} />
          <Route path="/team" element={<VendorSettingsPage initialTab="TEAM" />} />
          <Route path="/settings" element={<VendorSettingsPage initialTab="TEAM" />} />
        </Route>
      </Route>

      {/* Catch-all redirect */}
      <Route path="/" element={<Navigate to={defaultHome} replace />} />
      <Route path="*" element={<Navigate to={defaultHome} replace />} />
    </Routes>
  );
};

export default AppRoutes;
