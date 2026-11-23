import { create } from 'zustand';
import { VendorOrder, VendorOrderStatus } from '@buildora/types';
import { vendorApi } from '../services/vendorApi';

interface VendorOrderState {
  orders: VendorOrder[];
  selectedOrder: VendorOrder | null;
  isLoading: boolean;
  error: string | null;
  statusFilter: string;
  searchQuery: string;

  // Actions
  fetchOrders: () => Promise<void>;
  setSelectedOrder: (order: VendorOrder | null) => void;
  setStatusFilter: (status: string) => void;
  setSearchQuery: (query: string) => void;
  updateOrderStatus: (id: string, status: VendorOrderStatus, note?: string) => Promise<boolean>;
}

export const useVendorOrderStore = create<VendorOrderState>((set, get) => ({
  orders: [],
  selectedOrder: null,
  isLoading: false,
  error: null,
  statusFilter: 'ALL',
  searchQuery: '',

  fetchOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const orders = await vendorApi.getOrders();
      set({ orders, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch orders', isLoading: false });
    }
  },

  setSelectedOrder: (order) => set({ selectedOrder: order }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  updateOrderStatus: async (id, status, note) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await vendorApi.updateOrderStatus(id, status, note);
      set((state) => ({
        orders: state.orders.map((o) => (o.id === id ? updated : o)),
        selectedOrder: state.selectedOrder?.id === id ? updated : state.selectedOrder,
        isLoading: false,
      }));
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Failed to update order status', isLoading: false });
      return false;
    }
  },
}));
