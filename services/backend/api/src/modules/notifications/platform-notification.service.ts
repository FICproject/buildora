import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  PlatformNotificationModel,
  PlatformNotificationPrefModel,
  platformPersistenceService,
} from '../../database/platform-persistence.service';
import { realtimeBus } from '../realtime/realtime-bus';
import { vendorNotificationService } from '../vendors/services/vendor-notification.service';

export type NotificationRecipientRole = 'CUSTOMER' | 'VENDOR' | 'ADMIN';

export type UnifiedNotificationType =
  | 'ORDER'
  | 'PRODUCT'
  | 'STOCK'
  | 'VENDOR_ONBOARDING'
  | 'SETTLEMENT'
  | 'PAYMENT'
  | 'SUPPORT'
  | 'SYSTEM';

export interface UnifiedNotificationRecord {
  id: string;
  tenantId: string;
  recipientRole: NotificationRecipientRole;
  recipientId: string;
  type: UnifiedNotificationType;
  title: string;
  message: string;
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
  deliveryStatus: {
    inApp: 'DELIVERED';
    email: 'DELIVERED' | 'FAILED' | 'SKIPPED_NOT_CONFIGURED' | 'DISABLED';
    sms: 'DELIVERED' | 'FAILED' | 'SKIPPED_NOT_CONFIGURED' | 'DISABLED';
  };
  createdAt: string;
  readAt?: string;
}

export interface NotificationPreferenceRecord {
  id: string;
  tenantId: string;
  role: NotificationRecipientRole;
  userId: string;
  inApp: boolean;
  email: boolean;
  sms: boolean;
  orderUpdates: boolean;
  stockAlerts: boolean;
  settlementUpdates: boolean;
  promotions: boolean;
  updatedAt: string;
}

@Injectable()
export class PlatformNotificationService implements OnModuleInit {
  private readonly logger = new Logger(PlatformNotificationService.name);
  private readonly notifications: UnifiedNotificationRecord[] = [];
  private readonly preferences = new Map<string, NotificationPreferenceRecord>();

  async onModuleInit() {
    const persisted = await platformPersistenceService.loadAll<UnifiedNotificationRecord>(
      PlatformNotificationModel
    );
    if (persisted.length > 0) {
      const seen = new Set(this.notifications.map((n) => n.id));
      for (const n of persisted) {
        if (!seen.has(n.id)) this.notifications.push(n);
      }
      this.notifications.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    const prefs = await platformPersistenceService.loadAll<NotificationPreferenceRecord>(
      PlatformNotificationPrefModel
    );
    for (const p of prefs) {
      this.preferences.set(p.id, p);
    }

    if (this.notifications.length === 0) {
      this.seedDefaults();
    }
  }

  private seedDefaults() {
    const now = new Date().toISOString();
    const initial: UnifiedNotificationRecord[] = [
      {
        id: 'unotif-seed-cust-1',
        tenantId: 'tenant-buildora-blr',
        recipientRole: 'CUSTOMER',
        recipientId: 'cust-9876543210',
        type: 'ORDER',
        title: 'Delivery En Route',
        message: 'Order BLD-2026-8941 is out for delivery via Indiranagar Hub.',
        severity: 'INFO',
        read: false,
        actionUrl: '/orders/BLD-2026-8941',
        deliveryStatus: { inApp: 'DELIVERED', email: 'SKIPPED_NOT_CONFIGURED', sms: 'SKIPPED_NOT_CONFIGURED' },
        createdAt: now,
      },
      {
        id: 'unotif-seed-vnd-1',
        tenantId: 'tenant-buildora-blr',
        recipientRole: 'VENDOR',
        recipientId: 'vnd-apex-01',
        type: 'SYSTEM',
        title: 'Storefront Live',
        message: 'Apex Materials BLR is active and receiving real-time BUILDORA 60 orders.',
        severity: 'SUCCESS',
        read: false,
        actionUrl: '/overview',
        deliveryStatus: { inApp: 'DELIVERED', email: 'SKIPPED_NOT_CONFIGURED', sms: 'SKIPPED_NOT_CONFIGURED' },
        createdAt: now,
      },
      {
        id: 'unotif-seed-adm-1',
        tenantId: 'tenant-buildora-blr',
        recipientRole: 'ADMIN',
        recipientId: 'TENANT_ADMIN',
        type: 'SYSTEM',
        title: 'Platform Integration Active',
        message: 'Real-time Socket.IO sync active across Customer, Vendor & Admin portals.',
        severity: 'INFO',
        read: false,
        actionUrl: '/notifications',
        deliveryStatus: { inApp: 'DELIVERED', email: 'SKIPPED_NOT_CONFIGURED', sms: 'SKIPPED_NOT_CONFIGURED' },
        createdAt: now,
      },
    ];
    this.notifications.push(...initial);
  }

  private prefKey(tenantId: string, role: NotificationRecipientRole, userId: string): string {
    return `${tenantId}:${role}:${userId}`;
  }

  getPreferences(tenantId: string, role: NotificationRecipientRole, userId: string): NotificationPreferenceRecord {
    const id = this.prefKey(tenantId, role, userId);
    const existing = this.preferences.get(id);
    if (existing) return existing;
    const defaults: NotificationPreferenceRecord = {
      id,
      tenantId,
      role,
      userId,
      inApp: true,
      email: true,
      sms: false,
      orderUpdates: true,
      stockAlerts: true,
      settlementUpdates: true,
      promotions: false,
      updatedAt: new Date().toISOString(),
    };
    this.preferences.set(id, defaults);
    return defaults;
  }

  async updatePreferences(
    tenantId: string,
    role: NotificationRecipientRole,
    userId: string,
    patch: Partial<NotificationPreferenceRecord>
  ): Promise<NotificationPreferenceRecord> {
    const current = this.getPreferences(tenantId, role, userId);
    const updated: NotificationPreferenceRecord = {
      ...current,
      inApp: patch.inApp ?? current.inApp,
      email: patch.email ?? current.email,
      sms: patch.sms ?? current.sms,
      orderUpdates: patch.orderUpdates ?? current.orderUpdates,
      stockAlerts: patch.stockAlerts ?? current.stockAlerts,
      settlementUpdates: patch.settlementUpdates ?? current.settlementUpdates,
      promotions: patch.promotions ?? current.promotions,
      updatedAt: new Date().toISOString(),
    };
    this.preferences.set(updated.id, updated);
    await platformPersistenceService.upsert(PlatformNotificationPrefModel, updated);
    return updated;
  }

  async dispatch(input: {
    tenantId?: string;
    recipientRole: NotificationRecipientRole;
    recipientId: string;
    type: UnifiedNotificationType;
    title: string;
    message: string;
    severity?: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';
    actionUrl?: string;
    metadata?: Record<string, any>;
    email?: string;
    phone?: string;
  }): Promise<UnifiedNotificationRecord> {
    const tenantId = input.tenantId || 'tenant-buildora-blr';
    const pref = this.getPreferences(tenantId, input.recipientRole, input.recipientId);

    const deliveryStatus: UnifiedNotificationRecord['deliveryStatus'] = {
      inApp: 'DELIVERED',
      email: pref.email ? 'SKIPPED_NOT_CONFIGURED' : 'DISABLED',
      sms: pref.sms ? 'SKIPPED_NOT_CONFIGURED' : 'DISABLED',
    };

    const status = vendorNotificationService.getOtpProviderStatus();
    if (pref.email && input.email && status.emailConfigured) {
      try {
        const res = await vendorNotificationService.sendEmail({
          to: input.email,
          subject: `[BUILDORA 60] ${input.title}`,
          html: `<p><strong>${input.title}</strong></p><p>${input.message}</p>`,
          text: `${input.title}: ${input.message}`,
        });
        deliveryStatus.email = res.delivered ? 'DELIVERED' : 'FAILED';
      } catch {
        deliveryStatus.email = 'FAILED';
      }
    }

    if (pref.sms && input.phone && status.smsConfigured) {
      try {
        const res = await vendorNotificationService.sendSms({
          phone: input.phone,
          message: `BUILDORA 60: ${input.title} - ${input.message}`,
        });
        deliveryStatus.sms = res.delivered ? 'DELIVERED' : 'FAILED';
      } catch {
        deliveryStatus.sms = 'FAILED';
      }
    }

    const record: UnifiedNotificationRecord = {
      id: `unotif-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      tenantId,
      recipientRole: input.recipientRole,
      recipientId: input.recipientId,
      type: input.type,
      title: input.title,
      message: input.message,
      severity: input.severity || 'INFO',
      read: false,
      actionUrl: input.actionUrl,
      metadata: input.metadata,
      deliveryStatus,
      createdAt: new Date().toISOString(),
    };

    this.notifications.unshift(record);
    if (this.notifications.length > 2000) {
      this.notifications.length = 2000;
    }

    await platformPersistenceService.upsert(PlatformNotificationModel, record);

    if (record.recipientRole === 'ADMIN') {
      realtimeBus.emitToAdmin('notification.created', { notification: record }, tenantId);
    } else if (record.recipientRole === 'VENDOR') {
      realtimeBus.emitToVendor(record.recipientId, 'notification.created', { notification: record }, tenantId);
    } else if (record.recipientRole === 'CUSTOMER') {
      realtimeBus.emitToCustomer(record.recipientId, 'notification.created', { notification: record }, tenantId);
    }

    return record;
  }

  listForRecipient(
    tenantId: string,
    role: NotificationRecipientRole,
    recipientId: string,
    unreadOnly = false
  ) {
    const items = this.notifications.filter((n) => {
      if (n.tenantId !== tenantId) return false;
      if (n.recipientRole !== role) return false;
      if (role === 'ADMIN') return n.recipientId === 'TENANT_ADMIN' || n.recipientId === recipientId;
      return n.recipientId === recipientId;
    });
    const filtered = unreadOnly ? items.filter((n) => !n.read) : items;
    return {
      items: filtered,
      unreadCount: items.filter((n) => !n.read).length,
      total: items.length,
    };
  }

  async markRead(
    id: string,
    tenantId: string,
    role: NotificationRecipientRole,
    recipientId: string
  ): Promise<UnifiedNotificationRecord | null> {
    const target = this.notifications.find(
      (n) =>
        n.id === id &&
        n.tenantId === tenantId &&
        n.recipientRole === role &&
        (role === 'ADMIN' || n.recipientId === recipientId)
    );
    if (!target) return null;
    target.read = true;
    target.readAt = new Date().toISOString();
    await platformPersistenceService.upsert(PlatformNotificationModel, target);
    return target;
  }

  async markAllRead(tenantId: string, role: NotificationRecipientRole, recipientId: string): Promise<number> {
    let updated = 0;
    const now = new Date().toISOString();
    for (const n of this.notifications) {
      if (
        !n.read &&
        n.tenantId === tenantId &&
        n.recipientRole === role &&
        (role === 'ADMIN' || n.recipientId === recipientId)
      ) {
        n.read = true;
        n.readAt = now;
        updated++;
        await platformPersistenceService.upsert(PlatformNotificationModel, n);
      }
    }
    return updated;
  }
}

export const platformNotificationService = new PlatformNotificationService();
