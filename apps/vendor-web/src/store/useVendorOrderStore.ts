import { create } from 'zustand';
import { VendorOrder } from '@buildora/types';
import { vendorApi } from '../services/vendorApi';

interface VendorOrderStore {
  orders: (VendorOrder & Record<string, any>)[];
  isLoading: boolean;
  error: string | null;
  fetchOrders: (status?: string, search?: string) => Promise<void>;
  acceptOrder: (id: string) => Promise<boolean>;
  rejectOrder: (id: string, reason: string) => Promise<boolean>;
  confirmPicking: (
    id: string,
    payload: {
      pickedItems?: Array<{ productId: string; sku?: string; pickedQuantity: number; shortageReason?: string }>;
      notes?: string;
    }
  ) => Promise<void>;
  confirmPacking: (id: string, payload: any) => Promise<void>;
  markReadyForDispatch: (id: string) => Promise<void>;
  handoverToDriver: (
    id: string,
    payload: { vehicleNumber?: string; driverName?: string; driverPhone?: string; handoverRef?: string; notes?: string }
  ) => Promise<void>;
  updateOrderStatus: (id: string, status: VendorOrder['status'], note?: string) => Promise<boolean>;
}

export const useVendorOrderStore = create<VendorOrderStore>((set, get) => ({
  orders: [],
  isLoading: false,
  error: null,

  fetchOrders: async (status, _search) => {
    set({ isLoading: true, error: null });
    try {
      const data = await vendorApi.getOrders(status);
      set({ orders: Array.isArray(data) ? data : [], isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err?.message || 'Failed to load orders.' });
    }
  },

  acceptOrder: async (id) => {
    await vendorApi.acceptOrder(id);
    await get().fetchOrders();
    return true;
  },

  rejectOrder: async (id, reason) => {
    await vendorApi.rejectOrder(id, reason);
    await get().fetchOrders();
    return true;
  },

  confirmPicking: async (id, payload) => {
    await vendorApi.confirmPicking(id, payload);
    await get().fetchOrders();
  },

  confirmPacking: async (id, payload) => {
    await vendorApi.confirmPacking(id, payload);
    await get().fetchOrders();
  },

  markReadyForDispatch: async (id) => {
    await vendorApi.markReadyForDispatch(id);
    await get().fetchOrders();
  },

  handoverToDriver: async (id, payload) => {
    await vendorApi.handoverToDriver(id, payload);
    await get().fetchOrders();
  },

  updateOrderStatus: async (id, status, note) => {
    await vendorApi.updateOrderStatus(id, status, note);
    await get().fetchOrders();
    return true;
  },
}));
