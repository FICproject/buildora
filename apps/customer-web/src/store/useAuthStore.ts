import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CustomerProfile, Address, Product } from '@buildora/types';
import { api, registerUnauthorizedHandler } from '../services/api';
import { useCartStore } from './useCartStore';
import { useWishlistStore } from './useWishlistStore';

export type PendingAuthAction =
  | { type: 'NAVIGATE'; destination: string }
  | { type: 'WISHLIST_ADD'; product: Product }
  | { type: 'CHECKOUT'; source: 'CART_PAGE' | 'CART_DRAWER' | 'CHECKOUT_PAGE' }
  | { type: 'CALLBACK' };

let pendingCallbackRef: (() => void) | null = null;

interface AuthStoreState {
  isAuthenticated: boolean;
  user: CustomerProfile | null;
  token: string | null;
  addresses: Address[];
  isAuthModalOpen: boolean;
  authPromptReason: string | null;
  intendedDestination: string | null;
  pendingAction: PendingAuthAction | null;
  postLoginEvent: { type: string; payload?: any; timestamp: number } | null;
  openAuthModal: (
    destination?: string,
    reason?: string,
    action?: PendingAuthAction,
    callback?: () => void
  ) => void;
  closeAuthModal: (clearPending?: boolean) => void;
  requireAuth: (
    action: PendingAuthAction,
    options?: { destination?: string; reason?: string; callback?: () => void }
  ) => boolean;
  consumePostLoginEvent: (expectedType?: string) => { type: string; payload?: any; timestamp: number } | null;
  validateSession: () => Promise<void>;
  requestOtp: (phone: string) => Promise<{ success: boolean; message: string; cooldownSeconds?: number }>;
  verifyOtp: (phone: string, otp: string) => Promise<{
    success: boolean;
    message: string;
    redirectTo?: string | null;
  }>;
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
      pendingAction: null,
      postLoginEvent: null,

      openAuthModal: (destination, reason, action, callback) => {
        pendingCallbackRef = callback || null;
        set({
          isAuthModalOpen: true,
          intendedDestination: destination || null,
          authPromptReason: reason || null,
          pendingAction: action || (destination ? { type: 'NAVIGATE', destination } : null),
        });
      },

      closeAuthModal: (clearPending = true) => {
        if (clearPending) {
          pendingCallbackRef = null;
        }
        set((state) => ({
          isAuthModalOpen: false,
          authPromptReason: null,
          ...(clearPending ? { intendedDestination: null, pendingAction: null } : { intendedDestination: state.intendedDestination }),
        }));
      },

      requireAuth: (action, options) => {
        if (get().isAuthenticated && get().token) {
          return true;
        }
        get().openAuthModal(options?.destination, options?.reason, action, options?.callback);
        return false;
      },

      consumePostLoginEvent: (expectedType) => {
        const evt = get().postLoginEvent;
        if (!evt) return null;
        if (expectedType && evt.type !== expectedType) return null;
        set({ postLoginEvent: null });
        return evt;
      },

      validateSession: async () => {
        const { isAuthenticated, token } = get();
        if (!isAuthenticated || !token) return;
        const session = await api.getAuthSession();
        if (!session.authenticated) {
          get().logout();
          return;
        }
        if (session.user) {
          set((state) => ({
            user: state.user ? { ...state.user, ...session.user } : session.user,
          }));
        }
        const [addrs] = await Promise.all([
          api.getAddresses().catch(() => null),
          useCartStore.getState().syncMergeWithServer(),
          useWishlistStore.getState().syncMergeWithServer(),
        ]);
        if (Array.isArray(addrs) && addrs.length > 0) {
          set({ addresses: addrs });
        }
      },

      requestOtp: async (phone) => {
        try {
          return await api.requestOtp(phone);
        } catch (err: any) {
          return {
            success: false,
            message: err?.message || 'Unable to send OTP. Please check your connection.',
          };
        }
      },

      verifyOtp: async (phone, otp) => {
        try {
          const res = await api.verifyOtp(phone, otp);
          if (res.success && res.user && res.token) {
            const pending = get().pendingAction;
            const dest = get().intendedDestination;
            const callback = pendingCallbackRef;
            pendingCallbackRef = null;

            const userAddrs = Array.isArray((res.user as any)?.addresses) ? (res.user as any).addresses : [];
            set({
              isAuthenticated: true,
              user: res.user,
              addresses: userAddrs,
              token: res.token,
            });

            // Sync & merge guest cart, wishlist, and addresses against authenticated backend
            const [serverAddrs] = await Promise.all([
              api.getAddresses().catch(() => userAddrs),
              useCartStore.getState().syncMergeWithServer(),
              useWishlistStore.getState().syncMergeWithServer(),
            ]);

            if (Array.isArray(serverAddrs) && serverAddrs.length > 0) {
              set({ addresses: serverAddrs });
            }

            // Continue original action automatically without auto-placing any order
            let redirectTo: string | null = dest || null;

            if (pending?.type === 'WISHLIST_ADD' && pending.product) {
              const wl = useWishlistStore.getState();
              if (!wl.isInWishlist(pending.product.id)) {
                wl.addItem(pending.product);
              }
              set({
                postLoginEvent: {
                  type: 'WISHLIST_ADDED',
                  payload: { productId: pending.product.id, productName: pending.product.name },
                  timestamp: Date.now(),
                },
              });
            } else if (pending?.type === 'CHECKOUT') {
              set({
                postLoginEvent: {
                  type: 'CHECKOUT',
                  payload: { source: pending.source },
                  timestamp: Date.now(),
                },
              });
              if (pending.source === 'CART_DRAWER') {
                redirectTo = '/cart';
              }
            } else if (pending?.type === 'NAVIGATE' && pending.destination) {
              redirectTo = pending.destination;
            }

            if (callback) {
              setTimeout(() => {
                try {
                  callback();
                } catch {
                  // Ignore stale callback if component unmounted
                }
              }, 0);
            }

            set({
              pendingAction: null,
              intendedDestination: null,
            });

            return {
              success: true,
              message: res.message || 'Signed in successfully!',
              redirectTo,
            };
          }
          return { success: false, message: res.message || 'Invalid OTP' };
        } catch (err: any) {
          return { success: false, message: err.message || 'OTP verification failed' };
        }
      },

      logout: () => {
        pendingCallbackRef = null;
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          addresses: [],
          intendedDestination: null,
          authPromptReason: null,
          pendingAction: null,
          postLoginEvent: null,
        });
      },

      updateProfile: async (profile) => {
        try {
          const updated = await api.updateProfile(profile);
          if (updated) {
            set((state) => ({
              user: state.user ? { ...state.user, ...updated } : updated,
            }));
            return;
          }
        } catch {
          // ignore network error
        }
        set((state) => ({
          user: state.user ? { ...state.user, ...profile } : null,
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
              addresses: [...newAddresses, { ...serverAddr, isDefault: serverAddr.isDefault || isFirst }],
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
            addresses: [...newAddresses, { ...addr, id, isDefault: addr.isDefault || isFirst }],
          };
        });
      },

      updateAddress: (id, updated) => {
        set((state) => ({
          addresses: state.addresses.map((addr) =>
            addr.id === id ? { ...addr, ...updated } : addr
          ),
        }));
      },

      deleteAddress: async (id) => {
        try {
          await api.deleteAddress(id);
        } catch {
          // ignore
        }
        set((state) => ({
          addresses: state.addresses.filter((addr) => addr.id !== id),
        }));
      },

      setDefaultAddress: (id) => {
        set((state) => ({
          addresses: state.addresses.map((addr) => ({
            ...addr,
            isDefault: addr.id === id,
          })),
        }));
      },

      deductWalletBalance: (amount) => {
        set((state) => ({
          user: state.user
            ? { ...state.user, walletBalance: Math.max(0, state.user.walletBalance - amount) }
            : null,
        }));
      },

      addWalletBalance: (amount) => {
        set((state) => ({
          user: state.user
            ? { ...state.user, walletBalance: state.user.walletBalance + amount }
            : null,
        }));
      },
    }),
    {
      name: 'buildora-auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        token: state.token,
        addresses: state.addresses,
      }),
    }
  )
);

registerUnauthorizedHandler(() => {
  const store = useAuthStore.getState();
  if (store.isAuthenticated) {
    store.logout();
    store.openAuthModal(
      window.location.pathname,
      'Your session expired. Please sign in again to continue.'
    );
  }
});
