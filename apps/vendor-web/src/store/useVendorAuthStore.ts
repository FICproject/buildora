import { create } from 'zustand';
import { VendorProfile, VendorBusinessInfo, VendorBankDetails } from '@buildora/types';
import { vendorApi } from '../services/vendorApi';

interface VendorAuthState {
  vendor: VendorProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password?: string) => Promise<boolean>;
  register: (payload: { storeName: string; email: string; phone: string }) => Promise<boolean>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  updateOnboarding: (data: {
    business?: Partial<VendorBusinessInfo>;
    bank?: Partial<VendorBankDetails>;
    categories?: string[];
  }) => Promise<boolean>;
  clearError: () => void;
}

const TOKEN_KEY = 'buildora_vendor_token';

export const useVendorAuthStore = create<VendorAuthState>((set, get) => ({
  vendor: vendorApi.getStoredProfile(),
  token: localStorage.getItem(TOKEN_KEY),
  isAuthenticated: !!localStorage.getItem(TOKEN_KEY),
  isLoading: false,
  error: null,

  login: async (email: string, password = 'demo') => {
    set({ isLoading: true, error: null });
    try {
      const response = await vendorApi.login(email, password);
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
        error: err.message || 'Login failed. Please check your credentials.',
        isLoading: false,
      });
      return false;
    }
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
    set({
      vendor: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  fetchProfile: async () => {
    set({ isLoading: true });
    try {
      const profile = await vendorApi.getProfile();
      set({ vendor: profile, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false });
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
}));
