import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '../layouts/RootLayout';
import { PublicStoreLayout } from '../layouts/PublicStoreLayout';
import { CustomerAccountLayout } from '../layouts/CustomerAccountLayout';
import { CheckoutLayout } from '../layouts/CheckoutLayout';

import { HomePage } from '../pages/HomePage';
import { ProductListingPage } from '../pages/ProductListingPage';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { CategoryPage } from '../pages/CategoryPage';
import { SearchPage } from '../pages/SearchPage';
import { BrandsPage } from '../pages/BrandsPage';
import { NewLaunchesPage } from '../pages/NewLaunchesPage';
import { DealsPage } from '../pages/DealsPage';
import { HomeConstructionCalculatorPage } from '../pages/HomeConstructionCalculatorPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { AccountDashboardPage } from '../pages/AccountDashboardPage';
import { OrdersPage } from '../pages/OrdersPage';
import { OrderTrackingPage } from '../pages/OrderTrackingPage';
import { ProfilePage } from '../pages/ProfilePage';
import { AddressesPage } from '../pages/AddressesPage';
import { WishlistPage } from '../pages/WishlistPage';
import { WalletPage } from '../pages/WalletPage';
import { RewardsPage } from '../pages/RewardsPage';
import { ProjectsPage } from '../pages/ProjectsPage';
import { MaterialEstimatorPage } from '../pages/MaterialEstimatorPage';
import { ComparePage } from '../pages/ComparePage';
import { NotificationsPage } from '../pages/NotificationsPage';
import { SupportPage } from '../pages/SupportPage';
import { SecurityPage } from '../pages/SecurityPage';
import { KnowledgeHubPage } from '../pages/KnowledgeHubPage';
import {
  AboutPage,
  ContactPage,
  FaqPage,
  PolicyPage
} from '../pages/StaticPages';
import { NotFoundPage } from '../pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      // Public Storefront Routes
      {
        path: '/',
        element: <PublicStoreLayout />,
        children: [
      { index: true, element: <HomePage /> },
      { path: 'products', element: <ProductListingPage /> },
      { path: 'products/:slug', element: <ProductDetailPage /> },
      { path: 'categories/:slug', element: <CategoryPage /> },
      { path: 'categories/:slug/:subcategorySlug', element: <CategoryPage /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'new-launches', element: <NewLaunchesPage /> },
      { path: 'new-launches/:collectionSlug', element: <NewLaunchesPage /> },
      { path: 'new-launches/:collectionSlug/:childSlug', element: <NewLaunchesPage /> },
      { path: 'brands', element: <BrandsPage /> },
      { path: 'brands/:slug', element: <BrandsPage /> },
      { path: 'deals', element: <DealsPage /> },
      { path: 'offers', element: <DealsPage /> },
      { path: 'tools/home-construction-calculator', element: <HomeConstructionCalculatorPage /> },
      { path: 'home-construction-calculator', element: <HomeConstructionCalculatorPage /> },
      { path: 'construction-calculator', element: <HomeConstructionCalculatorPage /> },
      { path: 'cart', element: <CartPage /> },
      { path: 'wishlist', element: <WishlistPage /> },
      { path: 'compare', element: <ComparePage /> },
      { path: 'tools/material-estimator', element: <MaterialEstimatorPage /> },
      { path: 'estimator', element: <MaterialEstimatorPage /> },
      { path: 'knowledge-hub', element: <KnowledgeHubPage /> },
      { path: 'knowledge-hub/:slug', element: <KnowledgeHubPage /> },
      { path: 'orders/:orderId/track', element: <OrderTrackingPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'faq', element: <FaqPage /> },
      { path: 'shipping-policy', element: <PolicyPage type="SHIPPING" /> },
      { path: 'return-policy', element: <PolicyPage type="RETURN" /> },
      { path: 'refund-policy', element: <PolicyPage type="REFUND" /> },
      { path: 'cancellation-policy', element: <PolicyPage type="REFUND" /> },
      { path: 'privacy-policy', element: <PolicyPage type="PRIVACY" /> },
      { path: 'terms-and-conditions', element: <PolicyPage type="TERMS" /> },
      { path: 'payment-information', element: <PolicyPage type="TERMS" /> },
      { path: 'serviceability', element: <PolicyPage type="SERVICEABILITY" /> },
      { path: '*', element: <NotFoundPage /> }
    ]
  },

  // Checkout Flow
  {
    path: '/checkout',
    element: <CheckoutLayout />,
    children: [{ index: true, element: <CheckoutPage /> }]
  },

  // Complete Customer Account Area
  {
    path: '/account',
    element: <CustomerAccountLayout />,
    children: [
      { index: true, element: <AccountDashboardPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'orders', element: <OrdersPage /> },
      { path: 'orders/:orderId', element: <OrdersPage /> },
      { path: 'addresses', element: <AddressesPage /> },
      { path: 'wallet', element: <WalletPage /> },
      { path: 'rewards', element: <RewardsPage /> },
      { path: 'wishlist', element: <WishlistPage /> },
      { path: 'notifications', element: <NotificationsPage /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'projects/:projectId', element: <ProjectsPage /> },
      { path: 'support', element: <SupportPage /> },
      { path: 'support/:ticketId', element: <SupportPage /> },
      { path: 'security', element: <SecurityPage /> }
    ]
  },

  // Legacy direct redirects to maintain full backwards compatibility
  {
    path: '/orders',
    element: <CustomerAccountLayout />,
    children: [
      { index: true, element: <OrdersPage /> },
      { path: ':orderId', element: <OrdersPage /> }
    ]
  },
  {
    path: '/projects',
    element: <CustomerAccountLayout />,
    children: [
      { index: true, element: <ProjectsPage /> },
      { path: ':projectId', element: <ProjectsPage /> }
    ]
  },
  {
    path: '/support',
    element: <CustomerAccountLayout />,
    children: [
      { index: true, element: <SupportPage /> },
      { path: 'tickets', element: <SupportPage /> },
      { path: 'tickets/:ticketId', element: <SupportPage /> }
    ]
  }
    ]
  }
]);
