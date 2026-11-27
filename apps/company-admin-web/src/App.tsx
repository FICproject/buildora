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
          {/* Centralized Products & Catalog Routes */}
          <Route path="products" element={<CatalogProductsPage initialSection="PRODUCTS" initialStatusFilter="ALL" />} />
          <Route path="products/pending" element={<CatalogProductsPage initialSection="PRODUCTS" initialStatusFilter="PENDING_APPROVAL" />} />
          <Route path="products/approved" element={<CatalogProductsPage initialSection="PRODUCTS" initialStatusFilter="APPROVED" />} />
          <Route path="products/rejected" element={<CatalogProductsPage initialSection="PRODUCTS" initialStatusFilter="REJECTED" />} />
          <Route path="products/navigation" element={<CatalogProductsPage initialSection="NAVIGATION" />} />
          <Route path="products/categories" element={<CatalogProductsPage initialSection="CATEGORY_MANAGEMENT" />} />
          <Route path="products/main-categories" element={<Navigate to="/products/categories" replace />} />
          <Route path="products/child-categories" element={<Navigate to="/products/categories" replace />} />
          <Route path="products/product-types" element={<CatalogProductsPage initialSection="PRODUCT_TYPES" />} />
          <Route path="products/filters" element={<CatalogProductsPage initialSection="FILTERS" />} />
          <Route path="products/new-launches" element={<CatalogProductsPage initialSection="NEW_LAUNCHES" />} />
          {/* Legacy /catalog/* route redirects */}
          <Route path="catalog" element={<Navigate to="/products" replace />} />
          <Route path="catalog/navigation" element={<Navigate to="/products/navigation" replace />} />
          <Route path="catalog/categories" element={<Navigate to="/products/categories" replace />} />
          <Route path="catalog/main-categories" element={<Navigate to="/products/categories" replace />} />
          <Route path="catalog/child-categories" element={<Navigate to="/products/categories" replace />} />
          <Route path="catalog/product-types" element={<Navigate to="/products/product-types" replace />} />
          <Route path="catalog/filters" element={<Navigate to="/products/filters" replace />} />
          <Route path="catalog/new-launches" element={<Navigate to="/products/new-launches" replace />} />
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
