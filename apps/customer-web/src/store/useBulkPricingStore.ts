import { create } from 'zustand';
import { Product } from '@buildora/types';

export interface BulkPricingState {
  isOpen: boolean;
  product: Product | null;
  openBulkPricing: (product: Product) => void;
  closeBulkPricing: () => void;
}

export const useBulkPricingStore = create<BulkPricingState>((set) => ({
  isOpen: false,
  product: null,
  openBulkPricing: (product) => set({ isOpen: true, product }),
  closeBulkPricing: () => set({ isOpen: false, product: null })
}));
