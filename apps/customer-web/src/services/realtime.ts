import { io, Socket } from 'socket.io-client';
import type { QueryClient } from '@tanstack/react-query';
import { useOrderStore } from '../store/useOrderStore';
import { useNotificationStore } from '../store/useNotificationStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
const SOCKET_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
const DEFAULT_TENANT_ID = import.meta.env.VITE_DEFAULT_TENANT_ID || 'tenant-buildora-blr';

let socket: Socket | null = null;

function getCustomerToken(): string {
  try {
    const raw = localStorage.getItem('buildora-auth-storage');
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed.state?.token || '';
    }
  } catch {
    // Ignore parse errors
  }
  return '';
}

export function initCustomerRealtime(queryClient?: QueryClient) {
  if (socket?.connected) return socket;
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  const token = getCustomerToken();
  socket = io(`${SOCKET_ORIGIN}/realtime`, {
    transports: ['websocket', 'polling'],
    auth: {
      token,
      tenantId: DEFAULT_TENANT_ID,
      portal: 'CUSTOMER',
    },
    reconnection: true,
    reconnectionDelay: 2000,
    reconnectionAttempts: 10,
  });

  const refreshCatalog = (payload?: any) => {
    queryClient?.invalidateQueries({ queryKey: ['taxonomy'] });
    queryClient?.invalidateQueries({ queryKey: ['categories'] });
    queryClient?.invalidateQueries({ queryKey: ['products'] });
    queryClient?.invalidateQueries({ queryKey: ['product'] });
    window.dispatchEvent(new CustomEvent('buildora:realtime:catalog', { detail: payload }));
  };

  socket.on('taxonomy.published', refreshCatalog);
  socket.on('product.approved', refreshCatalog);
  socket.on('product.updated', refreshCatalog);
  socket.on('product.suspended', refreshCatalog);
  socket.on('inventory.updated', refreshCatalog);

  socket.on('order.created', (payload) => {
    void useOrderStore.getState().syncWithBackend();
    window.dispatchEvent(new CustomEvent('buildora:realtime:order', { detail: payload }));
  });

  socket.on('order.status.updated', (payload) => {
    if (payload?.orderNumber && payload?.status) {
      useOrderStore.getState().updateOrderStatus(payload.orderNumber, payload.status);
    }
    void useOrderStore.getState().syncWithBackend();
    window.dispatchEvent(new CustomEvent('buildora:realtime:order', { detail: payload }));
  });

  socket.on('payment.status.updated', (payload) => {
    void useOrderStore.getState().syncWithBackend();
    window.dispatchEvent(new CustomEvent('buildora:realtime:payment', { detail: payload }));
  });

  socket.on('notification.created', (payload) => {
    const n = payload?.notification;
    if (n) {
      useNotificationStore.getState().addNotification({
        title: n.title,
        message: n.message,
        type: n.type === 'PAYMENT' ? 'WALLET' : n.type === 'ORDER' ? 'DISPATCH' : 'ANNOUNCEMENT',
        link: n.actionUrl || '/notifications',
        isGuestVisible: false,
      });
    }
  });

  return socket;
}

export function disconnectCustomerRealtime() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
