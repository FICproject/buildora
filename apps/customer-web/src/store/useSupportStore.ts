import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SupportTicket } from '@buildora/types';

interface SupportStoreState {
  tickets: SupportTicket[];
  createTicket: (data: {
    category: SupportTicket['category'];
    priority: SupportTicket['priority'];
    subject: string;
    description: string;
    orderId?: string;
  }) => SupportTicket;
  addMessage: (ticketId: string, message: string) => void;
  getTicket: (ticketId: string) => SupportTicket | undefined;
}

const INITIAL_DEMO_TICKETS: SupportTicket[] = [
  {
    id: 'tkt-1',
    ticketNumber: 'TKT-2026-4410',
    category: 'DELIVERY',
    orderId: 'BLD-2026-8941',
    priority: 'HIGH',
    subject: 'Request offloading assistance for 10 bags of cement',
    description: 'Our site gate has a narrow ramp. Kindly instruct the delivery partner to bring a trolley for offloading.',
    status: 'IN_PROGRESS',
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60000).toISOString(),
    messages: [
      {
        sender: 'CUSTOMER',
        message: 'Our site gate has a narrow ramp. Kindly instruct the delivery partner to bring a trolley for offloading.',
        timestamp: '25 mins ago'
      },
      {
        sender: 'SUPPORT_AGENT',
        message: 'Hello Arjun, we have notified driver Ramesh Kumar. His mini-truck is equipped with a hydraulic tail-lift and hand trolley. Arrival expected in 15 mins.',
        timestamp: '10 mins ago'
      }
    ]
  }
];

export const useSupportStore = create<SupportStoreState>()(
  persist(
    (set, get) => ({
      tickets: INITIAL_DEMO_TICKETS,

      createTicket: (data) => {
        const id = 'tkt-' + Date.now();
        const ticketNumber = 'TKT-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
        const now = new Date().toISOString();

        const newTicket: SupportTicket = {
          ...data,
          id,
          ticketNumber,
          status: 'OPEN',
          createdAt: now,
          updatedAt: now,
          messages: [
            {
              sender: 'CUSTOMER',
              message: data.description,
              timestamp: 'Just now'
            }
          ]
        };

        set((state) => ({ tickets: [newTicket, ...state.tickets] }));
        return newTicket;
      },

      addMessage: (ticketId, message) => {
        set((state) => ({
          tickets: state.tickets.map((t) => {
            if (t.id !== ticketId) return t;
            return {
              ...t,
              updatedAt: new Date().toISOString(),
              messages: [
                ...t.messages,
                {
                  sender: 'CUSTOMER',
                  message,
                  timestamp: 'Just now'
                }
              ]
            };
          })
        }));
      },

      getTicket: (ticketId) => {
        const needle = ticketId.trim().toLowerCase();
        return get().tickets.find(
          (t) => t.id.toLowerCase() === needle || t.ticketNumber.toLowerCase() === needle
        );
      }
    }),
    {
      name: 'buildora-support-storage'
    }
  )
);
