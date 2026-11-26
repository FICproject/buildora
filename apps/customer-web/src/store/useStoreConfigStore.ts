import { create } from 'zustand';
import { api } from '../services/api';

export interface StoreConfigState {
  config: {
    tenantId?: string;
    storeName?: string;
    legalName?: string;
    city?: string;
    state?: string;
    supportEmail?: string;
    supportPhone?: string;
    logoUrl?: string;
    websiteUrl?: string;
    paymentConfig?: {
      razorpayEnabled: boolean;
      codEnabled: boolean;
      codMaxOrderValue: number;
    };
    deliveryConfig?: {
      defaultShippingCharge: number;
      freeShippingThreshold: number;
      expressDeliveryFee: number;
      estimatedDeliveryDays: number;
      baseUnloadingFee: number;
      expressEtaText: string;
      standardEtaText: string;
      supportedSpeeds: string[];
    };
    taxConfig?: {
      defaultGstRate: number;
      gstStateCode: string;
      gstSlabs: number[];
    };
    coupons?: any[];
    warehouses?: any[];
    content?: {
      announcements: any[];
      banners: any[];
      deals: any[];
      newLaunches: any[];
      sections: any[];
    };
    serviceablePincodesCount?: number;
    updatedAt?: string;
  } | null;
  isLoading: boolean;
  hasLoaded: boolean;
  loadConfig: (force?: boolean) => Promise<void>;
}

export const useStoreConfigStore = create<StoreConfigState>((set, get) => ({
  config: null,
  isLoading: false,
  hasLoaded: false,
  loadConfig: async (force = false) => {
    if (!force && (get().isLoading || get().hasLoaded)) return;
    set({ isLoading: true });
    try {
      const data = await api.getStoreConfig();
      if (data) {
        set({ config: data, isLoading: false, hasLoaded: true });
        return;
      }
    } catch {
      // keep existing state cleanly
    }
    set({ isLoading: false, hasLoaded: true });
  },
}));
