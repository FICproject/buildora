import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, PublicRoute } from './ProtectedRoute';
import { VendorAppLayout, VendorAuthLayout } from '../layouts';

// Pages
import { VendorLoginPage } from '../pages/auth/VendorLoginPage';
import { VendorRegisterPage } from '../pages/auth/VendorRegisterPage';
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

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route element={<PublicRoute />}>
        <Route element={<VendorAuthLayout />}>
          <Route path="/login" element={<VendorLoginPage />} />
          <Route path="/register" element={<VendorRegisterPage />} />
        </Route>
      </Route>

      {/* Protected Vendor App Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<VendorAppLayout />}>
          <Route path="/dashboard" element={<VendorDashboardPage />} />
          <Route path="/onboarding" element={<VendorOnboardingPage />} />
          <Route path="/products" element={<VendorProductsPage />} />
          <Route path="/bulk-pricing" element={<VendorBulkPricingPage />} />
          <Route path="/orders" element={<VendorOrdersPage />} />
          <Route path="/inventory" element={<VendorInventoryPage />} />
          <Route path="/delivery" element={<VendorDeliveryPage />} />
          <Route path="/earnings" element={<VendorEarningsPage />} />
          <Route path="/reports" element={<VendorReportsPage />} />
          <Route path="/notifications" element={<VendorNotificationsPage />} />
          <Route path="/settings" element={<VendorSettingsPage />} />
        </Route>
      </Route>

      {/* Catch-all redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
