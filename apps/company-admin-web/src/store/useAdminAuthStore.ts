import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AdminUserProfile {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  permissions: string[];
  department: string;
  status: string;
}

export interface CompanyTenantSummary {
  id: string;
  name: string;
  legalName: string;
  slug: string;
  city: string;
  state: string;
  gstin: string;
}

interface AdminAuthState {
  user: AdminUserProfile | null;
  tenant: CompanyTenantSummary | null;
  accessToken: string | null;
  refreshToken: string | null;
  setSession: (payload: {
    user: AdminUserProfile;
    tenant: CompanyTenantSummary;
    accessToken: string;
    refreshToken: string;
  }) => void;
  clearSession: () => void;
  hasPermission: (perm: string) => boolean;
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tenant: null,
      accessToken: null,
      refreshToken: null,
      setSession: ({ user, tenant, accessToken, refreshToken }) =>
        set({ user, tenant, accessToken, refreshToken }),
      clearSession: () =>
        set({ user: null, tenant: null, accessToken: null, refreshToken: null }),
      hasPermission: (perm: string) => {
        const u = get().user;
        if (!u) return false;
        if (u.role === 'COMPANY_OWNER' || u.permissions?.includes('*')) return true;
        return Boolean(u.permissions?.includes(perm));
      },
    }),
    {
      name: 'buildora-company-admin-auth',
    }
  )
);
