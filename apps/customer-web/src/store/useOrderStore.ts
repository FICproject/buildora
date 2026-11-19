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

const DEMO_INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-101',
    orderNumber: 'BLD-2026-8941',
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    status: 'OUT_FOR_DELIVERY',
    items: [
      {
        productId: 'prod-cem-1',
        sku: 'CEM-ULT-PPC-50KG',
        name: 'UltraTech Super Cement (PPC)',
        slug: 'ultratech-super-cement-ppc-50kg',
        brand: 'UltraTech Cement',
        image: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=400&q=80',
        unit: '50 kg Bag',
        unitPrice: 395,
        quantity: 10,
        gstAmount: 864,
        totalAmount: 3950
      },
      {
        productId: 'prod-adh-1',
        sku: 'ADH-FEV-MAR-5KG',
        name: 'Fevicol Marine Waterproof Wood Adhesive (5 kg)',
        slug: 'fevicol-marine-waterproof-wood-adhesive-5kg',
        brand: 'Pidilite (Fevicol & Dr. Fixit)',
        image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=400&q=80',
        unit: '5 kg Bucket',
        unitPrice: 1390,
        quantity: 2,
        gstAmount: 424,
        totalAmount: 2780
      }
    ],
    deliveryAddress: {
      id: 'addr-1',
      type: 'CONSTRUCTION_SITE',
      recipientName: 'Arjun Verma (Site Engineer)',
      mobile: '9876543210',
      building: 'Plot 42, Green Horizon Enclave',
      street: '14th Cross, 4th Main Road',
      area: 'Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
      isDefault: true,
      isConstructionSite: true
    },
    deliveryOption: 'ASAP_60',
    estimatedDeliveryTime: 'Within 25 minutes',
    paymentMethod: 'RAZORPAY_UPI',
    paymentStatus: 'CAPTURED',
    subtotal: 6730,
    itemDiscount: 0,
    couponDiscount: 300,
    couponCode: 'BUILD60',
    gstTotal: 1288,
    deliveryFee: 0,
    walletUsed: 200,
    grandTotal: 6230,
    isBusinessOrder: true,
    gstin: '29AABCB1234F1Z8',
    companyName: 'Apex Infra Construction Ltd',
    timeline: [
      {
        status: 'ORDER_PLACED',
        title: 'Order Placed',
        description: 'Order received and digital payment confirmed.',
        timestamp: '35 mins ago',
        completed: true
      },
      {
        status: 'CONFIRMED',
        title: 'Order Confirmed',
        description: 'Verified with Indiranagar Dark Store (WH-BLR-01).',
        timestamp: '30 mins ago',
        completed: true
      },
      {
        status: 'PACKED',
        title: 'Materials Picked & Palletized',
        description: 'Quality inspected and loaded onto electric delivery mini-truck.',
        timestamp: '18 mins ago',
        completed: true
      },
      {
        status: 'OUT_FOR_DELIVERY',
        title: 'Out for Delivery',
        description: 'Driver Ramesh Kumar (KA-03-EZ-4412) is en route to Indiranagar site.',
        timestamp: '8 mins ago',
        completed: true
      },
      {
        status: 'DELIVERED',
        title: 'Delivered',
        description: 'Materials safely offloaded at site gate.',
        timestamp: 'Pending',
        completed: false
      }
    ],
    deliveryPartner: {
      name: 'Ramesh Kumar',
      phone: '+91-9876543299',
      vehicleNumber: 'KA-03-EZ-4412 (Tata Ace EV)'
    }
  }
];

export const useOrderStore = create<OrderStoreState>()(
  persist(
    (set, get) => ({
      orders: DEMO_INITIAL_ORDERS,

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

      updateOrderStatus: (orderId, status) => {
        set((state) => ({
          orders: state.orders.map((o) => (o.id === orderId ? { ...o, status } : o))
        }));
      }
    }),
    {
      name: 'buildora-orders-storage'
    }
  )
);
