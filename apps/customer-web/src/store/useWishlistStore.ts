import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@buildora/types';

interface WishlistStoreState {
  items: Product[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  toggleItem: (product: Product) => boolean;
}

export const useWishlistStore = create<WishlistStoreState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) => {
        set((state) => {
          if (state.items.some((i) => i.id === product.id)) return state;
          return { items: [...state.items, product] };
        });
      },
      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== productId)
        }));
      },
      isInWishlist: (productId) => {
        return get().items.some((i) => i.id === productId);
      },
      toggleItem: (product) => {
        const exists = get().isInWishlist(product.id);
        if (exists) {
          get().removeItem(product.id);
          return false;
        } else {
          get().addItem(product);
          return true;
        }
      }
    }),
    {
      name: 'buildora-wishlist-storage'
    }
  )
);
