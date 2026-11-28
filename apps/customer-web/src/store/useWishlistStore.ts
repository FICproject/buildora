import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@buildora/types';
import { api } from '../services/api';

function hasAuthToken(): boolean {
  try {
    const raw = localStorage.getItem('buildora-auth-storage');
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(parsed?.state?.isAuthenticated && parsed?.state?.token);
  } catch {
    return false;
  }
}

interface WishlistStoreState {
  items: Product[];
  isSyncing: boolean;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  setItems: (items: Product[]) => void;
  clearItems: () => void;
  isInWishlist: (productId: string) => boolean;
  toggleItem: (product: Product) => boolean;
  syncMergeWithServer: () => Promise<Product[]>;
}

export const useWishlistStore = create<WishlistStoreState>()(
  persist(
    (set, get) => ({
      items: [],
      isSyncing: false,

      addItem: (product) => {
        const already = get().items.some((i) => i.id === product.id);
        if (!already) {
          set((state) => ({ items: [product, ...state.items] }));
          if (hasAuthToken()) {
            void api.toggleWishlistItem(product.id, product);
          }
        }
      },

      removeItem: (productId) => {
        const exists = get().items.some((i) => i.id === productId);
        set((state) => ({
          items: state.items.filter((i) => i.id !== productId),
        }));
        if (exists && hasAuthToken()) {
          void api.toggleWishlistItem(productId);
        }
      },

      setItems: (items) => set({ items: Array.isArray(items) ? items : [] }),

      clearItems: () => set({ items: [] }),

      isInWishlist: (productId) => {
        return get().items.some((i) => i.id === productId);
      },

      toggleItem: (product) => {
        const exists = get().isInWishlist(product.id);
        if (exists) {
          get().removeItem(product.id);
          return false;
        }
        get().addItem(product);
        return true;
      },

      syncMergeWithServer: async () => {
        if (!hasAuthToken()) return get().items;
        set({ isSyncing: true });
        try {
          const guestItems = get().items;
          const res = await api.mergeWishlist(guestItems);
          if (res?.success && Array.isArray(res.data)) {
            set({ items: res.data, isSyncing: false });
            return res.data;
          }
          const serverItems = await api.getWishlist();
          if (Array.isArray(serverItems) && serverItems.length > 0) {
            set({ items: serverItems, isSyncing: false });
            return serverItems;
          }
        } catch {
          // Retain local items if network fails
        }
        set({ isSyncing: false });
        return get().items;
      },
    }),
    {
      name: 'buildora-wishlist-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
