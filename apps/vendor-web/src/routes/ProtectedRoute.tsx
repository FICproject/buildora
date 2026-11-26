import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useVendorAuthStore } from '../store/useVendorAuthStore';
import { VendorAccountStatus } from '@buildora/types';

export function getVendorRedirect(status?: VendorAccountStatus, applicationId?: string): string {
  switch (status) {
    case 'APPROVED':
    case 'ACTIVE':
      return '/dashboard';
    case 'DRAFT':
      return '/register';
    case 'SUBMITTED':
    case 'UNDER_REVIEW':
    case 'RESUBMISSION_REQUIRED':
    case 'REJECTED':
      return applicationId ? `/application-status/${applicationId}` : '/application-status';
    case 'SUSPENDED':
      return '/account-restricted';
    default:
      return '/login';
  }
}

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, vendor, isLoading, error, fetchProfile, logout } = useVendorAuthStore();
  const location = useLocation();

  // Always verify status against the backend on mount/navigation rather than trusting localStorage alone
  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
    }
  }, [isAuthenticated, location.pathname]);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!vendor && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F7F5] text-sm text-[#78716C]">
        Verifying vendor session...
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F7F5] p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-[#E7E5E4] p-6 text-center space-y-4 shadow-sm">
          <p className="text-sm font-semibold text-[#292524]">
            {error || 'Unable to verify your vendor session with the server.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fetchProfile()}
              className="px-4 py-2 rounded-lg bg-[#943D24] text-white text-xs font-semibold cursor-pointer"
            >
              Retry Connection
            </button>
            <button
              type="button"
              onClick={() => logout()}
              className="px-4 py-2 rounded-lg border border-[#E7E5E4] text-xs font-semibold text-[#292524] cursor-pointer"
            >
              Sign In Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const status = vendor?.status;

  // Only APPROVED or ACTIVE vendors can access the main Vendor App & Dashboard
  if (status !== 'APPROVED' && status !== 'ACTIVE') {
    const targetRoute = getVendorRedirect(status, vendor?.applicationId);
    return <Navigate to={targetRoute} replace />;
  }

  return <Outlet />;
};

export const PublicRoute: React.FC = () => {
  const { isAuthenticated, vendor } = useVendorAuthStore();
  const location = useLocation();

  // If already authenticated, redirect them to the proper page based on their status
  if (isAuthenticated) {
    const targetRoute = getVendorRedirect(vendor?.status, vendor?.applicationId);
    // Allow users to visit their own designated status route or register/login without infinite loop
    const statusRoutes = [
      '/registration/review',
      '/application-status',
      '/rejection-details',
      '/account-restricted',
      '/register',
      '/forgot-password'
    ];
    if (!statusRoutes.some(r => location.pathname.startsWith(r)) && location.pathname !== targetRoute) {
      return <Navigate to={targetRoute} replace />;
    }
  }

  return <Outlet />;
};
