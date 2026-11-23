import React from 'react';
import { Outlet, ScrollRestoration } from 'react-router-dom';
import { ScrollToTop } from '../components/common/ScrollToTop';
import { BulkPricingModal } from '../components/common/BulkPricingModal';

/**
 * Root Application Layout for BUILDORA 60
 * 
 * Provides global scroll restoration and reliable scroll-to-top navigation management
 * across all public, checkout, and account route trees.
 */
export const RootLayout: React.FC = () => {
  return (
    <>
      <ScrollToTop />
      <ScrollRestoration getKey={(location) => location.pathname} />
      <Outlet />
      <BulkPricingModal />
    </>
  );
};
