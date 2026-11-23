import { create } from 'zustand';
import { vendorApi } from '../services/vendorApi';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  lowStockThreshold: number;
  reorderPoint: number;
  warehouseLocation: string;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

interface VendorInventoryState {
  inventory: InventoryItem[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;

  // Actions
  fetchInventory: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  adjustStock: (
    productId: string,
    adjustmentType: 'ADD' | 'SUBTRACT' | 'SET',
    quantity: number,
    reason: string
  ) => Promise<boolean>;
}

export const useVendorInventoryStore = create<VendorInventoryState>((set, get) => ({
  inventory: [],
  isLoading: false,
  error: null,
  searchQuery: '',

  fetchInventory: async () => {
    set({ isLoading: true, error: null });
    try {
      const inventory = await vendorApi.getInventory();
      set({ inventory, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch inventory', isLoading: false });
    }
  },

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  adjustStock: async (productId, adjustmentType, quantity, reason) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await vendorApi.adjustInventory(productId, adjustmentType, quantity, reason);
      set((state) => ({
        inventory: state.inventory.map((item) =>
          item.id === productId
            ? {
                ...item,
                stock: updated.stock,
                status:
                  updated.stock <= 0
                    ? 'OUT_OF_STOCK'
                    : updated.stock <= item.lowStockThreshold
                    ? 'LOW_STOCK'
                    : 'IN_STOCK',
              }
            : item
        ),
        isLoading: false,
      }));
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Failed to adjust stock', isLoading: false });
      return false;
    }
  },
}));
