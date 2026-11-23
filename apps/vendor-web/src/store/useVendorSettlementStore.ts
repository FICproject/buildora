import { create } from 'zustand';
import { VendorSettlement } from '@buildora/types';
import { vendorApi } from '../services/vendorApi';

interface SettlementSummary {
  totalGrossRevenue: number;
  totalCommissionPaid: number;
  totalGstDeductions: number;
  totalNetPayout: number;
  pendingPayout: number;
  nextPayoutDate: string;
}

interface VendorSettlementState {
  settlements: VendorSettlement[];
  summary: SettlementSummary | null;
  isLoading: boolean;
  error: string | null;

  fetchSettlements: () => Promise<void>;
  fetchSummary: () => Promise<void>;
}

export const useVendorSettlementStore = create<VendorSettlementState>((set) => ({
  settlements: [],
  summary: null,
  isLoading: false,
  error: null,

  fetchSettlements: async () => {
    set({ isLoading: true, error: null });
    try {
      const settlements = await vendorApi.getSettlements();
      set({ settlements, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch settlements', isLoading: false });
    }
  },

  fetchSummary: async () => {
    try {
      const summary = await vendorApi.getSettlementSummary();
      set({ summary });
    } catch (err: any) {
      console.error('Failed to load settlement summary', err);
    }
  },
}));
