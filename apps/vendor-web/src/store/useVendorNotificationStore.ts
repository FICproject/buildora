import { create } from 'zustand';
import { VendorNotification } from '@buildora/types';
import { vendorApi } from '../services/vendorApi';

interface VendorNotificationState {
  notifications: VendorNotification[];
  unreadCount: number;
  isLoading: boolean;

  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useVendorNotificationStore = create<VendorNotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const notifications = await vendorApi.getNotifications();
      const unreadCount = notifications.filter((n) => !n.read).length;
      set({ notifications, unreadCount, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
    }
  },

  markAsRead: async (id: string) => {
    try {
      await vendorApi.markNotificationAsRead(id);
      set((state) => {
        const updated = state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        );
        return {
          notifications: updated,
          unreadCount: updated.filter((n) => !n.read).length,
        };
      });
    } catch (err) {
      console.error(err);
    }
  },

  markAllAsRead: async () => {
    try {
      await vendorApi.markAllNotificationsAsRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch (err) {
      console.error(err);
    }
  },
}));
