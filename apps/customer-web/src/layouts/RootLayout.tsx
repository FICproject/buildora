import React, { useEffect } from 'react';
import { Outlet, ScrollRestoration } from 'react-router-dom';
import { ScrollToTop } from '../components/common/ScrollToTop';
import { BulkPricingModal } from '../components/common/BulkPricingModal';
import { AuthModal } from '../components/common/AuthModal';
import { useAuthStore } from '../store/useAuthStore';

/**
 * Root Application Layout for BUILDORA 60
 *
 * Provides global session hydration/validation, Sign In modal, scroll restoration,
 * and navigation management across all public, checkout, and account route trees.
 */
export const RootLayout: React.FC = () => {
  const validateSession = useAuthStore((s) => s.validateSession);

  useEffect(() => {
    void validateSession();
  }, [validateSession]);

  return (
    <>
      <ScrollToTop />
      <ScrollRestoration getKey={(location) => location.pathname} />
      <Outlet />
      <BulkPricingModal />
      <AuthModal />
    </>
  );
};
