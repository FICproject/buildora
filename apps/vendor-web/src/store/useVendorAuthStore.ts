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
const SAVED_VENDOR_KEY = 'buildora_vendor_profile';

export const useVendorAuthStore = create<VendorAuthState>((set, get) => {
  const savedProfileRaw = localStorage.getItem(SAVED_VENDOR_KEY);
  let initialVendor: VendorProfile | null = null;
  try {
    initialVendor = savedProfileRaw ? JSON.parse(savedProfileRaw) : vendorApi.getStoredProfile();
  } catch {
    initialVendor = vendorApi.getStoredProfile();
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
      set({ isLoading: true });
      try {
        const profile = await vendorApi.getProfile();
        if (profile) {
          localStorage.setItem(SAVED_VENDOR_KEY, JSON.stringify(profile));
          set({ vendor: profile, isLoading: false });
        }
        return profile;
      } catch (err: any) {
        set({ isLoading: false });
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
