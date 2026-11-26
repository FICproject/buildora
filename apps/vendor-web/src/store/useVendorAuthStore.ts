import { create } from 'zustand';
import { VendorProfile, VendorBusinessInfo, VendorBankDetails } from '@buildora/types';
import { vendorApi } from '../services/vendorApi';

interface VendorAuthState {
  vendor: VendorProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  redirectTo: string | null;
  
  // Actions
  login: (identifier: string, password?: string, rememberMe?: boolean) => Promise<{ success: boolean; redirectTo?: string; error?: string }>;
  loginWithOtp: (identifier: string, otp: string) => Promise<{ success: boolean; redirectTo?: string; error?: string }>;
  register: (payload: { storeName: string; email: string; phone: string }) => Promise<boolean>;
  setSession: (token: string, vendor: VendorProfile, redirectTo?: string) => void;
  logout: () => void;
  fetchProfile: () => Promise<VendorProfile | null>;
  updateOnboarding: (data: {
    business?: Partial<VendorBusinessInfo>;
    bank?: Partial<VendorBankDetails>;
    categories?: string[];
  }) => Promise<boolean>;
  clearError: () => void;
}

const TOKEN_KEY = 'buildora_vendor_token';
const REFRESH_TOKEN_KEY = 'buildora_vendor_refresh_token';
const SAVED_VENDOR_KEY = 'buildora_vendor_profile';

export const useVendorAuthStore = create<VendorAuthState>((set, get) => {
  const savedProfileRaw = localStorage.getItem(SAVED_VENDOR_KEY);
  let initialVendor: VendorProfile | null = null;
  try {
    initialVendor = savedProfileRaw ? JSON.parse(savedProfileRaw) : null;
  } catch {
    initialVendor = null;
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('buildora:vendor:session-expired', () => {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(SAVED_VENDOR_KEY);
      set({
        vendor: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Session expired. Please sign in again.',
        redirectTo: null,
      });
    });
    window.addEventListener('buildora:vendor:session-refreshed', (ev: any) => {
      const detail = ev?.detail;
      if (detail?.token) {
        set({
          token: detail.token,
          vendor: detail.vendor || get().vendor,
          isAuthenticated: true,
          error: null,
        });
      }
    });
  }

  return {
    vendor: initialVendor,
    token: localStorage.getItem(TOKEN_KEY),
    isAuthenticated: !!localStorage.getItem(TOKEN_KEY),
    isLoading: false,
    error: null,
    redirectTo: null,

    login: async (identifier: string, password?: string, rememberMe = true) => {
      set({ isLoading: true, error: null });
      try {
        const response = await vendorApi.login(identifier, password, rememberMe);
        localStorage.setItem(TOKEN_KEY, response.token);
        if (response.vendor) {
          localStorage.setItem(SAVED_VENDOR_KEY, JSON.stringify(response.vendor));
        }
        set({
          vendor: response.vendor,
          token: response.token,
          isAuthenticated: true,
          isLoading: false,
          redirectTo: response.redirectTo || '/dashboard'
        });
        return { success: true, redirectTo: response.redirectTo || '/dashboard' };
      } catch (err: any) {
        set({
          error: err.message || 'Login failed. Please check your credentials.',
          isLoading: false,
        });
        return { success: false, error: err.message || 'Login failed.' };
      }
    },

    loginWithOtp: async (identifier: string, otp: string) => {
      set({ isLoading: true, error: null });
      try {
        const response = await vendorApi.loginWithOtp(identifier, otp);
        localStorage.setItem(TOKEN_KEY, response.token);
        if (response.vendor) {
          localStorage.setItem(SAVED_VENDOR_KEY, JSON.stringify(response.vendor));
        }
        set({
          vendor: response.vendor,
          token: response.token,
          isAuthenticated: true,
          isLoading: false,
          redirectTo: response.redirectTo || '/dashboard'
        });
        return { success: true, redirectTo: response.redirectTo || '/dashboard' };
      } catch (err: any) {
        set({
          error: err.message || 'OTP verification failed.',
          isLoading: false,
        });
        return { success: false, error: err.message || 'OTP verification failed.' };
      }
    },

    setSession: (token: string, vendor: VendorProfile, redirectTo = '/dashboard') => {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(SAVED_VENDOR_KEY, JSON.stringify(vendor));
      set({
        token,
        vendor,
        isAuthenticated: true,
        redirectTo
      });
    },

    register: async (payload) => {
      set({ isLoading: true, error: null });
      try {
        const response = await vendorApi.register(payload);
        localStorage.setItem(TOKEN_KEY, response.token);
        set({
          vendor: response.vendor,
          token: response.token,
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      } catch (err: any) {
        set({
          error: err.message || 'Registration failed.',
          isLoading: false,
        });
        return false;
      }
    },

    logout: () => {
      vendorApi.logout();
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(SAVED_VENDOR_KEY);
      set({
        vendor: null,
        token: null,
        isAuthenticated: false,
        error: null,
        redirectTo: null
      });
    },

    fetchProfile: async () => {
      set({ isLoading: true, error: null });
      try {
        const raw: any = await vendorApi.getProfile();
        const profile: VendorProfile | null = raw?.vendor || raw;
        if (profile && profile.id) {
          localStorage.setItem(SAVED_VENDOR_KEY, JSON.stringify(profile));
          set({ vendor: profile, isLoading: false, error: null });
          return profile;
        }
        set({ isLoading: false });
        return null;
      } catch (err: any) {
        if (err?.status === 401 || err?.code === 'SESSION_EXPIRED') {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          localStorage.removeItem(SAVED_VENDOR_KEY);
          set({
            vendor: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: err?.message || 'Session expired. Please sign in again.',
          });
          return null;
        }
        set({
          isLoading: false,
          error: err?.message || 'Unable to load business profile.'
        });
        return null;
      }
    },

    updateOnboarding: async (data) => {
      set({ isLoading: true, error: null });
      try {
        const updated = await vendorApi.submitOnboarding(data);
        set({ vendor: updated, isLoading: false });
        return true;
      } catch (err: any) {
        set({
          error: err.message || 'Failed to submit onboarding details.',
          isLoading: false,
        });
        return false;
      }
    },

    clearError: () => set({ error: null }),
  };
});
