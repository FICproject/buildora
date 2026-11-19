import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  unreadCount: (isAuthenticated: boolean) => number;
  getVisibleNotifications: (isAuthenticated: boolean) => NotificationItem[];
  markAsRead: (id: string) => void;
  markAllAsRead: (isAuthenticated: boolean) => void;
  clearAll: () => void;
  addNotification: (notification: Omit<NotificationItem, 'id' | 'time' | 'read'>) => void;
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: '60-Minute Site Delivery Active in Bengaluru',
    message: 'Instant EV mini-truck dispatch is operational across 105+ Bengaluru pincodes with zero minimum order.',
    time: '10 mins ago',
    read: false,
    type: 'ANNOUNCEMENT',
    link: '/serviceability',
    isGuestVisible: true
  },
  {
    id: 'notif-2',
    title: 'Order Dispatched to Site',
    message: 'Driver Ramesh Kumar (KA-03-EZ-4412) has departed from Dark Store WH-BLR-01. Expected at site in 22 mins.',
    time: '25 mins ago',
    read: false,
    type: 'DISPATCH',
    link: '/orders/BLD-2026-8941/track',
    isGuestVisible: false
  },
  {
    id: 'notif-3',
    title: '₹500 Cashback Credited',
    message: 'Promotional cashback on your UltraTech cement order has been credited to your Buildora Wallet.',
    time: 'Yesterday',
    read: true,
    type: 'WALLET',
    link: '/account/wallet',
    isGuestVisible: false
  },
  {
    id: 'notif-4',
    title: 'Contractor Price Drop: Greenply BWP Plywood',
    message: 'Calibrated 19mm BWP marine sheets now available with an extra 10% volume discount for orders this week.',
    time: '2 days ago',
    read: false,
    type: 'OFFER',
    link: '/categories/plywood-mdf-hdhmr',
    isGuestVisible: true
  }
];

export const useNotificationStore = create<NotificationStoreState>()(
  persist(
    (set, get) => ({
      notifications: DEFAULT_NOTIFICATIONS,

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
