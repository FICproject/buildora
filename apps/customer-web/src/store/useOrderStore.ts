import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Order, OrderStatus } from '@buildora/types';
import { api } from '../services/api';

interface OrderStoreState {
  orders: Order[];
  syncWithBackend: () => Promise<void>;
  placeOrder: (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'timeline'>) => Promise<Order>;
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
          if (serverOrders && serverOrders.length > 0) {
            set({ orders: serverOrders });
          }
        } catch {
          // Keep local state
        }
      },

      placeOrder: async (orderData) => {
        try {
          const serverOrder = await api.createOrder(orderData);
          if (serverOrder) {
            set((state) => ({
              orders: [serverOrder, ...state.orders.filter((o) => o.id !== serverOrder.id)]
            }));
            return serverOrder;
          }
        } catch {
          // Fallback to local creation
        }

        const id = 'ord-' + Date.now();
        const orderNumber = 'BLD-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
        const createdAt = new Date().toISOString();

        const timeline: Order['timeline'] = [
          {
            status: 'ORDER_PLACED',
            title: 'Order Placed',
            description: 'Your order has been recorded in the BUILDORA 60 dispatch system.',
            timestamp: 'Just now',
            completed: true
          },
          {
            status: 'CONFIRMED',
            title: 'Inventory Reserved',
            description: 'Allocated from nearest regional warehouse.',
            timestamp: 'In progress',
            completed: true
          },
          {
            status: 'PACKED',
            title: 'Picking & Packing',
            description: 'Heavy materials undergoing barcode and weight check.',
            timestamp: 'Scheduled',
            completed: false
          },
          {
            status: 'OUT_FOR_DELIVERY',
            title: 'Dispatched to Site',
            description: 'Driver assigned with route optimization.',
            timestamp: 'Pending',
            completed: false
          },
          {
            status: 'DELIVERED',
            title: 'Delivered & Offloaded',
            description: 'Confirmation OTP and digital signature receipt.',
            timestamp: 'Pending',
            completed: false
          }
        ];

        const newOrder: Order = {
          ...orderData,
          id,
          orderNumber,
          createdAt,
          timeline,
          deliveryPartner: {
            name: 'Prakash Gowda',
            phone: '+91-9845012345',
            vehicleNumber: 'KA-04-MB-1029'
          }
        };

        set((state) => ({
          orders: [newOrder, ...state.orders]
        }));

        return newOrder;
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
