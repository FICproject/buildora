import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CustomerProfile, Address } from '@buildora/types';
import { api } from '../services/api';

interface AuthStoreState {
  isAuthenticated: boolean;
  user: CustomerProfile | null;
  token: string | null;
  addresses: Address[];
  isAuthModalOpen: boolean;
  authPromptReason: string | null;
  intendedDestination: string | null;
  openAuthModal: (destination?: string, reason?: string) => void;
  closeAuthModal: () => void;
  requestOtp: (phone: string) => Promise<{ success: boolean; message: string }>;
  verifyOtp: (phone: string, otp: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateProfile: (profile: Partial<CustomerProfile>) => Promise<void>;
  addAddress: (address: Omit<Address, 'id'>) => Promise<void>;
  updateAddress: (id: string, address: Partial<Address>) => void;
  deleteAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => void;
  deductWalletBalance: (amount: number) => void;
  addWalletBalance: (amount: number) => void;
}

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      addresses: [],
      isAuthModalOpen: false,
      authPromptReason: null,
      intendedDestination: null,

      openAuthModal: (destination, reason) => {
        set({
          isAuthModalOpen: true,
          intendedDestination: destination || null,
          authPromptReason: reason || null
        });
      },

      closeAuthModal: () => {
        set({
          isAuthModalOpen: false,
          authPromptReason: null
        });
      },

      requestOtp: async (phone) => {
        try {
          return await api.requestOtp(phone);
        } catch (err: any) {
          return {
            success: false,
            message: err?.message || 'Unable to send OTP. Please check your connection.'
          };
        }
      },

      verifyOtp: async (phone, otp) => {
        try {
          const res = await api.verifyOtp(phone, otp);
          if (res.success && res.user && res.token) {
            const userAddrs = Array.isArray((res.user as any)?.addresses) ? (res.user as any).addresses : [];
            set({
              isAuthenticated: true,
              user: res.user,
              addresses: get().addresses.length > 0 ? get().addresses : userAddrs,
              token: res.token
            });
            return { success: true, message: res.message || 'Signed in successfully!' };
          }
          return { success: false, message: res.message || 'Invalid OTP' };
        } catch (err: any) {
          return { success: false, message: err.message || 'OTP verification failed' };
        }
      },

      logout: () => {
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          addresses: [],
          intendedDestination: null,
          authPromptReason: null
        });
      },

      updateProfile: async (profile) => {
        try {
          const updated = await api.updateProfile(profile);
          if (updated) {
            set((state) => ({
              user: state.user ? { ...state.user, ...updated } : updated
            }));
            return;
          }
        } catch {
          // ignore network error
        }
        set((state) => ({
          user: state.user ? { ...state.user, ...profile } : null
        }));
      },

      addAddress: async (addr) => {
        const id = 'addr-' + Date.now();
        try {
          const serverAddr = await api.addAddress(addr);
          if (serverAddr) {
            const isFirst = get().addresses.length === 0;
            const newAddresses = get().addresses.map((a) =>
              serverAddr.isDefault || isFirst ? { ...a, isDefault: false } : a
            );
            set({
              addresses: [...newAddresses, { ...serverAddr, isDefault: serverAddr.isDefault || isFirst }]
            });
            return;
          }
        } catch {
          // Fallback to local persistence
        }

        set((state) => {
          const isFirst = state.addresses.length === 0;
          const newAddresses = state.addresses.map((a) =>
            addr.isDefault || isFirst ? { ...a, isDefault: false } : a
          );
          return {
            addresses: [...newAddresses, { ...addr, id, isDefault: addr.isDefault || isFirst }]
          };
        });
      },

      updateAddress: (id, updated) => {
        set((state) => ({
          addresses: state.addresses.map((addr) =>
            addr.id === id ? { ...addr, ...updated } : addr
          )
        }));
      },

      deleteAddress: async (id) => {
        try {
          await api.deleteAddress(id);
        } catch {
          // ignore
        }
        set((state) => ({
          addresses: state.addresses.filter((addr) => addr.id !== id)
        }));
      },

      setDefaultAddress: (id) => {
        set((state) => ({
          addresses: state.addresses.map((addr) => ({
            ...addr,
            isDefault: addr.id === id
          }))
        }));
      },

      deductWalletBalance: (amount) => {
        set((state) => ({
          user: state.user
            ? { ...state.user, walletBalance: Math.max(0, state.user.walletBalance - amount) }
            : null
        }));
      },

      addWalletBalance: (amount) => {
        set((state) => ({
          user: state.user
            ? { ...state.user, walletBalance: state.user.walletBalance + amount }
            : null
        }));
      }
    }),
    {
      name: 'buildora-auth-storage'
    }
  )
);
