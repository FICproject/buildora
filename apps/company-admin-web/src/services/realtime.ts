import { io, Socket } from 'socket.io-client';
import { ADMIN_APP_CONFIG } from '../config';
import { useAdminAuthStore } from '../store/useAdminAuthStore';

const SOCKET_ORIGIN = ADMIN_APP_CONFIG.apiBaseUrl.replace(/\/api\/v1\/?$/, '');
let socket: Socket | null = null;

export function initAdminRealtime(): Socket | null {
  const store = useAdminAuthStore.getState();
  const token = store.accessToken || '';
  if (!token) return null;
  if (socket?.connected) return socket;

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = io(`${SOCKET_ORIGIN}/realtime`, {
    transports: ['websocket', 'polling'],
    auth: {
      token,
      tenantId: store.tenant?.id || ADMIN_APP_CONFIG.defaultTenantId,
      portal: 'COMPANY_ADMIN',
    },
    reconnection: true,
    reconnectionDelay: 2000,
    reconnectionAttempts: 10,
  });

  const emitAdminEvent = (event: string, payload?: any) => {
    window.dispatchEvent(new CustomEvent('buildora:admin:realtime', { detail: { event, payload } }));
  };

  for (const evt of [
    'vendor.application.submitted',
    'vendor.application.approved',
    'vendor.application.rejected',
    'product.submitted',
    'product.approved',
    'product.rejected',
    'product.updated',
    'product.suspended',
    'inventory.updated',
    'order.created',
    'order.status.updated',
    'payment.status.updated',
    'settlement.status.updated',
    'notification.created',
  ]) {
    socket.on(evt, (payload) => emitAdminEvent(evt, payload));
  }

  return socket;
}

export function disconnectAdminRealtime() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
