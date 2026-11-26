import { io, Socket } from 'socket.io-client';
import { VENDOR_APP_CONFIG } from '../config';
import { useVendorOrderStore } from '../store/useVendorOrderStore';
import { useVendorInventoryStore } from '../store/useVendorInventoryStore';
import { useVendorNotificationStore } from '../store/useVendorNotificationStore';
import { useVendorSettlementStore } from '../store/useVendorSettlementStore';
import { toast } from '../store/useToastStore';

const SOCKET_ORIGIN = VENDOR_APP_CONFIG.apiBaseUrl.replace(/\/api\/v1\/?$/, '');
let socket: Socket | null = null;

export function initVendorRealtime() {
  const token = localStorage.getItem('buildora_vendor_token') || '';
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
      tenantId: VENDOR_APP_CONFIG.defaultTenantId,
      portal: 'VENDOR',
    },
    reconnection: true,
    reconnectionDelay: 2000,
    reconnectionAttempts: 10,
  });

  const refreshAll = (event: string, payload?: any) => {
    window.dispatchEvent(new CustomEvent('buildora:vendor:realtime', { detail: { event, payload } }));
  };

  socket.on('vendor.application.approved', (payload) => {
    toast.success('Your vendor application was approved by Company Admin!');
    refreshAll('vendor.application.approved', payload);
  });

  socket.on('vendor.application.rejected', (payload) => {
    toast.error(payload?.reason || 'Vendor application status updated.');
    refreshAll('vendor.application.rejected', payload);
  });

  socket.on('product.approved', (payload) => {
    toast.success(`Product approved: ${payload?.product?.name || ''}`);
    refreshAll('product.approved', payload);
  });

  socket.on('product.rejected', (payload) => {
    toast.error(`Product rejected: ${payload?.reason || ''}`);
    refreshAll('product.rejected', payload);
  });

  socket.on('product.suspended', (payload) => {
    refreshAll('product.suspended', payload);
  });

  socket.on('taxonomy.published', (payload) => {
    toast.info('Catalog categories updated by Company Admin.');
    refreshAll('taxonomy.published', payload);
  });

  socket.on('product.updated', (payload) => {
    if (payload?.taxonomyUpdated) {
      refreshAll('taxonomy.published', payload);
    } else {
      refreshAll('product.updated', payload);
    }
  });

  socket.on('inventory.updated', (payload) => {
    void useVendorInventoryStore.getState().fetchInventory();
    refreshAll('inventory.updated', payload);
  });

  socket.on('order.created', (payload) => {
    void useVendorOrderStore.getState().fetchOrders();
    toast.success(`New order received #${payload?.order?.orderNumber || ''}`);
    refreshAll('order.created', payload);
  });

  socket.on('order.status.updated', (payload) => {
    void useVendorOrderStore.getState().fetchOrders();
    refreshAll('order.status.updated', payload);
  });

  socket.on('payment.status.updated', (payload) => {
    void useVendorOrderStore.getState().fetchOrders();
    refreshAll('payment.status.updated', payload);
  });

  socket.on('settlement.status.updated', (payload) => {
    void useVendorSettlementStore.getState().fetchSettlements();
    refreshAll('settlement.status.updated', payload);
  });

  for (const extraEvt of ['settings.updated', 'serviceability.updated', 'pricing.updated', 'content.published', 'filters.updated']) {
    socket.on(extraEvt, (payload) => refreshAll(extraEvt, payload));
  }

  socket.on('notification.created', (payload) => {
    void useVendorNotificationStore.getState().fetchNotifications();
    refreshAll('notification.created', payload);
  });

  return socket;
}

export function disconnectVendorRealtime() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
