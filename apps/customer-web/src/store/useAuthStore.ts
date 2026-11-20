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

const DEFAULT_DEMO_USER: CustomerProfile = {
  id: 'cust-demo-1',
  name: 'Arjun Verma',
  phone: '9876543210',
  email: 'arjun.verma@buildora.com',
  isPhoneVerified: true,
  isEmailVerified: true,
  gstin: '29AABCB1234F1Z8',
  businessName: 'Apex Infra Construction Ltd',
  walletBalance: 1250,
  rewardPoints: 480,
  createdAt: '2026-01-15T10:00:00.000Z'
};

const DEFAULT_DEMO_ADDRESSES: Address[] = [
  {
    id: 'addr-1',
    type: 'CONSTRUCTION_SITE',
    recipientName: 'Arjun Verma (Site Engineer)',
    mobile: '9876543210',
    building: 'Plot 42, Green Horizon Enclave',
    street: '14th Cross, 4th Main Road',
    area: 'Indiranagar',
    landmark: 'Near BDA Complex',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560038',
    deliveryInstructions: 'Enter through Gate 2. Inform gate security for material truck unloading.',
    isDefault: true,
    isConstructionSite: true
  },
  {
    id: 'addr-2',
    type: 'WORK',
    recipientName: 'Arjun Verma',
    mobile: '9876543210',
    building: 'BuildTech Solutions, Office 302',
    street: 'Outer Ring Road, Bellandur',
    area: 'Bellandur',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560103',
    isDefault: false
  }
];

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
          const res = await api.requestOtp(phone);
          return res;
        } catch {
          return {
            success: true,
            message: 'OTP sent (Development OTP: 6060)'
          };
        }
      },

      verifyOtp: async (phone, otp) => {
        try {
          const res = await api.verifyOtp(phone, otp);
          if (res.success && res.user) {
            const userAddrs = (res.user as any)?.addresses || DEFAULT_DEMO_ADDRESSES;
            set({
              isAuthenticated: true,
              user: res.user,
              addresses: get().addresses.length > 0 ? get().addresses : userAddrs,
              token: res.token || 'demo-jwt-token-buildora-60'
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
              isAuthenticated: true,
              user: { ...(state.user || DEFAULT_DEMO_USER), ...updated }
            }));
            return;
          }
        } catch {
          // Fallback to local state
        }
        set((state) => ({
          isAuthenticated: true,
          user: { ...(state.user || DEFAULT_DEMO_USER), ...profile }
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
