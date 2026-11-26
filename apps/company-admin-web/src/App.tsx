import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { initAdminRealtime, disconnectAdminRealtime } from './services/realtime';
import { AdminLayout, ProtectedRoute } from './components/layout/AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { VendorsPage } from './pages/VendorsPage';
import { CatalogProductsPage } from './pages/CatalogProductsPage';
import { InventoryPage } from './pages/InventoryWarehousesPage';
import { OrdersPage } from './pages/OrdersPage';
import { QuotationsPage } from './pages/QuotationsPage';
import { PricingPromotionsPage } from './pages/PricingPromotionsPage';
import { WebsiteContentPage } from './pages/WebsiteContentPage';
import { CustomersPage, DeliveryLogisticsPage } from './pages/CustomersLogisticsPage';
import { FinancePage, ReportsPage } from './pages/FinanceReportsPage';
import {
  TeamAccessPage,
  SupportNotificationsPage,
  CompanySettingsPage,
} from './pages/TeamSupportSettingsPage';

export function App() {
  useEffect(() => {
    initAdminRealtime();
    return () => disconnectAdminRealtime();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="vendors" element={<VendorsPage />} />
          <Route path="products" element={<CatalogProductsPage initialSection="PRODUCTS" />} />
          <Route path="catalog/navigation" element={<CatalogProductsPage initialSection="NAVIGATION" />} />
          <Route path="catalog/main-categories" element={<CatalogProductsPage initialSection="MAIN_CATEGORIES" />} />
          <Route path="catalog/child-categories" element={<CatalogProductsPage initialSection="CHILD_CATEGORIES" />} />
          <Route path="catalog/product-types" element={<CatalogProductsPage initialSection="PRODUCT_TYPES" />} />
          <Route path="inventory" element={<InventoryPage defaultTab="INVENTORY" />} />
          <Route path="warehouses" element={<InventoryPage defaultTab="WAREHOUSES" />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="quotations" element={<QuotationsPage />} />
          <Route path="pricing" element={<PricingPromotionsPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="delivery" element={<DeliveryLogisticsPage />} />
          <Route path="finance" element={<FinancePage />} />
          <Route path="content" element={<WebsiteContentPage />} />
          <Route path="team" element={<TeamAccessPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="support" element={<SupportNotificationsPage />} />
          <Route path="settings" element={<CompanySettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
