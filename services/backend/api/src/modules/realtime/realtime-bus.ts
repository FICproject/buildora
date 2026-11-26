import type { Server } from 'socket.io';

export type RealtimeEventName =
  | 'vendor.application.submitted'
  | 'vendor.application.approved'
  | 'vendor.application.rejected'
  | 'product.submitted'
  | 'product.approved'
  | 'product.rejected'
  | 'product.updated'
  | 'product.suspended'
  | 'inventory.updated'
  | 'taxonomy.draft_saved'
  | 'taxonomy.published'
  | 'content.published'
  | 'pricing.updated'
  | 'settings.updated'
  | 'serviceability.updated'
  | 'filters.updated'
  | 'order.created'
  | 'order.status.updated'
  | 'payment.status.updated'
  | 'settlement.status.updated'
  | 'notification.created';

class RealtimeBus {
  private server: Server | null = null;
  private readonly defaultTenant = 'tenant-buildora-blr';

  attachServer(server: Server) {
    this.server = server;
  }

  private wrapPayload(event: RealtimeEventName, data: Record<string, any>) {
    return {
      event,
      timestamp: new Date().toISOString(),
      ...data,
    };
  }

  emitPublic(event: RealtimeEventName, data: Record<string, any>, tenantId = this.defaultTenant) {
    if (!this.server) return;
    const payload = this.wrapPayload(event, { tenantId, ...data });
    this.server.to('public').to(`tenant:${tenantId}:public`).emit(event, payload);
  }

  emitToAdmin(event: RealtimeEventName, data: Record<string, any>, tenantId = this.defaultTenant) {
    if (!this.server) return;
    const payload = this.wrapPayload(event, { tenantId, ...data });
    this.server.to(`tenant:${tenantId}:admin`).emit(event, payload);
  }

  emitToVendor(vendorId: string, event: RealtimeEventName, data: Record<string, any>, tenantId = this.defaultTenant) {
    if (!this.server || !vendorId) return;
    const payload = this.wrapPayload(event, { tenantId, vendorId, ...data });
    this.server.to(`vendor:${vendorId}`).to(`tenant:${tenantId}:vendor:${vendorId}`).emit(event, payload);
  }

  emitToCustomer(customerId: string, event: RealtimeEventName, data: Record<string, any>, tenantId = this.defaultTenant) {
    if (!this.server || !customerId) return;
    const payload = this.wrapPayload(event, { tenantId, customerId, ...data });
    this.server.to(`customer:${customerId}`).to(`tenant:${tenantId}:customer:${customerId}`).emit(event, payload);
  }

  emitVendorAndAdmin(vendorId: string, event: RealtimeEventName, data: Record<string, any>, tenantId = this.defaultTenant) {
    this.emitToVendor(vendorId, event, data, tenantId);
    this.emitToAdmin(event, data, tenantId);
  }
}

export const realtimeBus = new RealtimeBus();
