import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useVendorAuthStore } from '../store/useVendorAuthStore';
import { VendorAccountStatus } from '@buildora/types';

export function getVendorRedirect(status?: VendorAccountStatus): string {
  switch (status) {
    case 'APPROVED':
    case 'ACTIVE':
      return '/dashboard';
    case 'DRAFT':
      return '/register';
    case 'SUBMITTED':
    case 'UNDER_REVIEW':
      return '/application-status';
    case 'REJECTED':
      return '/rejection-details';
    case 'SUSPENDED':
      return '/account-restricted';
    default:
      return '/login';
  }
}

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, vendor } = useVendorAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const status = vendor?.status;

  // Only APPROVED or ACTIVE vendors can access the main Vendor App & Dashboard
  if (status !== 'APPROVED' && status !== 'ACTIVE') {
    const targetRoute = getVendorRedirect(status);
    return <Navigate to={targetRoute} replace />;
  }

  return <Outlet />;
};

export const PublicRoute: React.FC = () => {
  const { isAuthenticated, vendor } = useVendorAuthStore();
  const location = useLocation();

  // If already authenticated, redirect them to the proper page based on their status
  if (isAuthenticated) {
    const targetRoute = getVendorRedirect(vendor?.status);
    // Allow users to visit their own designated status route or register/login without infinite loop
    const statusRoutes = ['/application-status', '/rejection-details', '/account-restricted', '/register', '/forgot-password'];
    if (!statusRoutes.includes(location.pathname) && location.pathname !== targetRoute) {
      return <Navigate to={targetRoute} replace />;
    }
  }

  return <Outlet />;
};
