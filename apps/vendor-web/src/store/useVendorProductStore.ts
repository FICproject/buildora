import { create } from 'zustand';
import { VendorProduct, BulkPricingTier } from '@buildora/types';
import { vendorApi } from '../services/vendorApi';

interface VendorProductState {
  products: VendorProduct[];
  selectedProduct: VendorProduct | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  selectedCategory: string;
  selectedStatus: string;

  // Actions
  fetchProducts: () => Promise<void>;
  setSelectedProduct: (product: VendorProduct | null) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  setSelectedStatus: (status: string) => void;
  addProduct: (product: Omit<VendorProduct, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateProduct: (id: string, updates: Partial<VendorProduct>) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
  saveBulkPricing: (productId: string, tiers: BulkPricingTier[]) => Promise<boolean>;
}

export const useVendorProductStore = create<VendorProductState>((set, get) => ({
  products: [],
  selectedProduct: null,
  isLoading: false,
  error: null,
  searchQuery: '',
  selectedCategory: 'all',
  selectedStatus: 'all',

  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const products = await vendorApi.getProducts();
      set({ products, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch products', isLoading: false });
    }
  },

  setSelectedProduct: (product) => set({ selectedProduct: product }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
  setSelectedStatus: (selectedStatus) => set({ selectedStatus }),

  addProduct: async (productData) => {
    set({ isLoading: true, error: null });
    try {
      const created = await vendorApi.createProduct(productData);
      set((state) => ({
        products: [created, ...state.products],
        isLoading: false,
      }));
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Failed to add product', isLoading: false });
      return false;
    }
  },

  updateProduct: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await vendorApi.updateProduct(id, updates);
      set((state) => ({
        products: state.products.map((p) => (p.id === id ? updated : p)),
        selectedProduct: state.selectedProduct?.id === id ? updated : state.selectedProduct,
        isLoading: false,
      }));
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Failed to update product', isLoading: false });
      return false;
    }
  },

  deleteProduct: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await vendorApi.deleteProduct(id);
      set((state) => ({
        products: state.products.filter((p) => p.id !== id),
        selectedProduct: state.selectedProduct?.id === id ? null : state.selectedProduct,
        isLoading: false,
      }));
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete product', isLoading: false });
      return false;
    }
  },

  saveBulkPricing: async (productId, tiers) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await vendorApi.updateBulkPricing(productId, tiers);
      set((state) => ({
        products: state.products.map((p) => (p.id === productId ? updated : p)),
        selectedProduct: state.selectedProduct?.id === productId ? updated : state.selectedProduct,
        isLoading: false,
      }));
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Failed to save bulk pricing', isLoading: false });
      return false;
    }
  },
}));
