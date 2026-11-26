import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../services/api';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'DISPATCH' | 'WALLET' | 'OFFER' | 'ANNOUNCEMENT';
  link?: string;
  isGuestVisible?: boolean;
}

interface NotificationStoreState {
  notifications: NotificationItem[];
  syncNotifications: () => Promise<void>;
  unreadCount: (isAuthenticated: boolean) => number;
  getVisibleNotifications: (isAuthenticated: boolean) => NotificationItem[];
  markAsRead: (id: string) => void;
  markAllAsRead: (isAuthenticated: boolean) => void;
  clearAll: () => void;
  addNotification: (notification: Omit<NotificationItem, 'id' | 'time' | 'read'>) => void;
}

export const useNotificationStore = create<NotificationStoreState>()(
  persist(
    (set, get) => ({
      notifications: [],

      syncNotifications: async () => {
        const res = await api.getNotifications();
        if (res?.items && res.items.length > 0) {
          const mapped: NotificationItem[] = res.items.map((n: any) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            time: new Date(n.createdAt).toLocaleString(),
            read: Boolean(n.read),
            type: n.type === 'PAYMENT' ? 'WALLET' : n.type === 'ORDER' ? 'DISPATCH' : 'ANNOUNCEMENT',
            link: n.actionUrl || '/notifications',
            isGuestVisible: false,
          }));
          set({ notifications: mapped });
        }
      },

      unreadCount: (isAuthenticated: boolean) => {
        const visible = get().getVisibleNotifications(isAuthenticated);
        return visible.filter((n) => !n.read).length;
      },

      getVisibleNotifications: (isAuthenticated: boolean) => {
        const all = get().notifications;
        if (isAuthenticated) {
          return all;
        }
        return all.filter((n) => n.isGuestVisible);
      },

      markAsRead: (id: string) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          )
        }));
      },

      markAllAsRead: (isAuthenticated: boolean) => {
        set((state) => ({
          notifications: state.notifications.map((n) => {
            if (isAuthenticated || n.isGuestVisible) {
              return { ...n, read: true };
            }
            return n;
          })
        }));
      },

      clearAll: () => {
        set({ notifications: [] });
      },

      addNotification: (item) => {
        const id = 'notif-' + Date.now();
        const time = 'Just now';
        set((state) => ({
          notifications: [{ ...item, id, time, read: false }, ...state.notifications]
        }));
      }
    }),
    {
      name: 'buildora-notifications-storage'
    }
  )
);
