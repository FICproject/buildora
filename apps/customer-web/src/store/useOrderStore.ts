import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Order, OrderStatus } from '@buildora/types';
import { api } from '../services/api';

interface OrderStoreState {
  orders: Order[];
  syncWithBackend: () => Promise<Order[]>;
  fetchOrderById: (orderIdOrNumber: string) => Promise<Order | null>;
  placeOrder: (
    orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'timeline'>,
    idempotencyKey?: string
  ) => Promise<Order>;
  addConfirmedOrder: (order: Order) => void;
  getOrder: (orderIdOrNumber: string) => Order | undefined;
  cancelOrder: (orderId: string, reason?: string) => Promise<boolean>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
}

export const useOrderStore = create<OrderStoreState>()(
  persist(
    (set, get) => ({
      orders: [],

      syncWithBackend: async () => {
        try {
          const serverOrders = await api.getOrders();
          if (Array.isArray(serverOrders)) {
            set({ orders: serverOrders });
            return serverOrders;
          }
        } catch {
          // Keep local state
        }
        return get().orders;
      },

      fetchOrderById: async (orderIdOrNumber) => {
        try {
          const fetched = await api.getOrderById(orderIdOrNumber);
          if (fetched && fetched.orderNumber) {
            set((state) => ({
              orders: [
                fetched,
                ...state.orders.filter(
                  (o) => o.id !== fetched.id && o.orderNumber !== fetched.orderNumber
                ),
              ],
            }));
            return fetched;
          }
        } catch {
          // Return null when unavailable or unauthorized
        }
        return null;
      },

      placeOrder: async (orderData, idempotencyKey) => {
        const serverOrder = await api.createOrder(orderData, idempotencyKey);
        set((state) => ({
          orders: [serverOrder, ...state.orders.filter((o) => o.id !== serverOrder.id)]
        }));
        return serverOrder;
      },

      addConfirmedOrder: (order) => {
        set((state) => ({
          orders: [order, ...state.orders.filter((o) => o.id !== order.id && o.orderNumber !== order.orderNumber)]
        }));
      },

      getOrder: (orderIdOrNumber) => {
        const needle = orderIdOrNumber.trim().toLowerCase();
        return get().orders.find(
          (o) => o.id.toLowerCase() === needle || o.orderNumber.toLowerCase() === needle
        );
      },

      cancelOrder: async (orderId) => {
        try {
          await api.cancelOrder(orderId);
        } catch {
          // ignore
        }

        let changed = false;
        set((state) => ({
          orders: state.orders.map((o) => {
            if (o.id === orderId && o.status !== 'DELIVERED' && o.status !== 'CANCELLED') {
              changed = true;
              return {
                ...o,
                status: 'CANCELLED',
                timeline: [
                  ...o.timeline,
                  {
                    status: 'CANCELLED',
                    title: 'Order Cancelled',
                    description: 'Order cancelled by customer. Refund credited to Buildora Wallet.',
                    timestamp: 'Just now',
                    completed: true
                  }
                ]
              };
            }
            return o;
          })
        }));
        return changed;
      },

      updateOrderStatus: (orderIdOrNumber, status) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderIdOrNumber || o.orderNumber === orderIdOrNumber ? { ...o, status } : o
          )
        }));
      }
    }),
    {
      name: 'buildora-orders-storage'
    }
  )
);
