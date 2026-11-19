import { create } from 'zustand';
import { Product } from '@buildora/types';

interface CompareStoreState {
  items: Product[];
  addItem: (product: Product) => { success: boolean; message: string };
  removeItem: (productId: string) => void;
  clearCompare: () => void;
  isInCompare: (productId: string) => boolean;
}

export const useCompareStore = create<CompareStoreState>((set, get) => ({
  items: [],
  addItem: (product) => {
    const current = get().items;
    if (current.some((i) => i.id === product.id)) {
      return { success: false, message: 'Product already in comparison' };
    }
    if (current.length >= 4) {
      return { success: false, message: 'You can compare up to 4 products at a time' };
    }
    set({ items: [...current, product] });
    return { success: true, message: 'Added to comparison list' };
  },
  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((i) => i.id !== productId)
    }));
  },
  clearCompare: () => set({ items: [] }),
  isInCompare: (productId) => get().items.some((i) => i.id === productId)
}));
