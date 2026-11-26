import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Param,
  Query,
  Body,
  Headers,
  Req,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { dbStore } from '../../../database/store';
import {
  DEFAULT_TENANT_ID,
  DEFAULT_VENDOR_ID,
  vendorRecords,
  vendorProducts,
  vendorOrders,
  vendorSettlements,
  vendorStockMovements,
  vendorWarehouses,
  vendorReturns,
  vendorPromotions,
  vendorSupportTickets,
  vendorNotifications,
} from '../../vendors/controllers/vendor.controller';
import { vendorPersistenceService } from '../../vendors/services/vendor-persistence.service';
import { vendorNotificationService } from '../../vendors/services/vendor-notification.service';
import {
  PlatformProductModel,
  PlatformStockMovementModel,
  PlatformOrderModel,
  PlatformReturnModel,
  PlatformSettlementModel,
  PlatformSupportTicketModel,
  platformPersistenceService,
} from '../../../database/platform-persistence.service';
import { realtimeBus } from '../../realtime/realtime-bus';
import { platformNotificationService } from '../../notifications/platform-notification.service';
import { orderSyncService } from '../../orders/services/order-sync.service';
import {
  companyAdminSecurityService,
  CompanyAdminRole,
  CompanyAdminTokenPayload,
  COMPANY_ADMIN_PERMISSION_MATRIX,
} from '../services/company-admin-security.service';
import {
  companyAdminDataService,
  CompanyQuotationRecord,
  CompanyContentRecord,
} from '../services/company-admin-data.service';
import {
  companyAdminPersistenceService,
  CompanyTenantModel,
  CompanyAdminUserModel,
  CompanyQuotationModel,
  CompanyContentModel,
  CompanyDeliveryPartnerModel,
  CompanyCustomerModel,
} from '../services/company-admin-persistence.service';

@Controller('api/v1/company-admin')
export class CompanyAdminController {
  private requireAdmin(
    authHeader: string | undefined,
    permission: string,
    headerTenantId?: string,
    queryTenantId?: string
  ): { admin: CompanyAdminTokenPayload; tenantId: string } {
    const admin = companyAdminSecurityService.verifyAccessToken(authHeader);
    companyAdminSecurityService.checkRateLimit(`ca-api:${admin.sub}`, 300, 60_000);
    companyAdminSecurityService.assertTenantAccess(admin, headerTenantId);
    companyAdminSecurityService.assertTenantAccess(admin, queryTenantId);
    companyAdminSecurityService.assertPermission(admin, permission);
    return { admin, tenantId: admin.tenantId };
  }

  private isInRange(isoDate: string | undefined, startMs: number, endMs: number): boolean {
    if (!isoDate) return false;
    const ms = new Date(isoDate).getTime();
    if (Number.isNaN(ms)) return false;
    return ms >= startMs && ms <= endMs;
  }

  private resolveDateRange(period = '30d', from?: string, to?: string) {
    const now = new Date();
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    if (period === 'today') {
      return { startMs: startOfToday.getTime(), endMs: endOfToday.getTime(), label: 'Today' };
    }
    if (period === 'yesterday') {
      const yStart = new Date(startOfToday.getTime() - 86400000);
      const yEnd = new Date(startOfToday.getTime() - 1);
      return { startMs: yStart.getTime(), endMs: yEnd.getTime(), label: 'Yesterday' };
    }
    if (period === '7d') {
      return {
        startMs: startOfToday.getTime() - 6 * 86400000,
        endMs: endOfToday.getTime(),
        label: 'Last 7 Days',
      };
    }
    if (period === 'month') {
      const mStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      return { startMs: mStart.getTime(), endMs: endOfToday.getTime(), label: 'This Month' };
    }
    if (period === 'custom' && from && to) {
      const fMs = new Date(from).setHours(0, 0, 0, 0);
      const tMs = new Date(to).setHours(23, 59, 59, 999);
      if (!Number.isNaN(fMs) && !Number.isNaN(tMs)) {
        return { startMs: fMs, endMs: tMs, label: `${from} to ${to}` };
      }
    }
    return {
      startMs: startOfToday.getTime() - 29 * 86400000,
      endMs: endOfToday.getTime(),
      label: 'Last 30 Days',
    };
  }

  // ==================== 1. DASHBOARD & OVERVIEW ====================

  @Get('dashboard')
  getDashboard(
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Query('tenantId') queryTenantId?: string,
    @Query('period') period = '30d',
    @Query('from') from?: string,
    @Query('to') to?: string
  ) {
    const { tenantId } = this.requireAdmin(
      authHeader,
      'dashboard:read',
      headerTenantId,
      queryTenantId
    );
    const range = this.resolveDateRange(period, from, to);

    const vendors = companyAdminDataService.getTenantVendors(tenantId);
    const products = companyAdminDataService.getTenantProducts(tenantId);
    const allOrders = companyAdminDataService.getTenantOrders(tenantId);
    const filteredOrders = allOrders.filter((o) =>
      this.isInRange(o.createdAt, range.startMs, range.endMs)
    );
    const settlements = companyAdminDataService.getTenantSettlements(tenantId);
    const returns = companyAdminDataService.getTenantReturns(tenantId);
    const quotations = Array.from(companyAdminDataService.quotations.values()).filter(
      (q) => q.tenantId === tenantId
    );
    const customers = Array.from(companyAdminDataService.customers.values()).filter(
      (c) => c.tenantId === tenantId
    );
    const alerts = companyAdminDataService.notificationAlerts.filter((a) => a.tenantId === tenantId);
    const reviews = companyAdminDataService.getTenantReviews(tenantId);
    const tickets = companyAdminDataService.getTenantSupportTickets(tenantId);

    const totalRevenue = filteredOrders
      .filter((o) => o.status !== 'CANCELLED')
      .reduce((acc, o) => acc + Number(o.totalAmount || 0), 0);

    const activeVendors = vendors.filter(
      (v) => (v.approvalStatus === 'APPROVED' || v.approvalStatus === 'ACTIVE') && v.isActive
    );
    const pendingVendorApprovals = vendors.filter(
      (v) =>
        v.approvalStatus === 'PENDING_VERIFICATION' ||
        v.approvalStatus === 'UNDER_REVIEW' ||
        v.approvalStatus === 'SUBMITTED' ||
        v.approvalStatus === 'RESUBMISSION_REQUIRED'
    );
    const pendingProducts = products.filter((p) => p.approvalStatus === 'PENDING_APPROVAL');
    const approvedProducts = products.filter((p) => p.approvalStatus === 'APPROVED' && p.isActive);
    const lowStockAlerts = products.filter(
      (p) => Number(p.stock) > 0 && Number(p.stock) <= Number(p.lowStockThreshold || 25)
    );
    const outOfStockProducts = products.filter((p) => Number(p.stock) <= 0);
    const pendingOrders = allOrders.filter((o) =>
      [
        'NEW',
        'PLACED',
        'ORDER_PLACED',
        'CONFIRMED',
        'ACCEPTED',
        'PROCESSING',
        'READY_FOR_DISPATCH',
      ].includes(String(o.status).toUpperCase())
    );
    const activeDispatches = allOrders.filter((o) =>
      ['DISPATCHED', 'OUT_FOR_DELIVERY'].includes(String(o.status).toUpperCase())
    );
    const deliveredOrders = filteredOrders.filter(
      (o) => String(o.status).toUpperCase() === 'DELIVERED'
    );
    const pendingSettlements = settlements.filter((s) => s.status !== 'PAID');
    const pendingSettlementAmount = pendingSettlements.reduce(
      (sum, s) => sum + Number(s.netAmount || 0),
      0
    );
    const pendingQuotations = quotations.filter((q) =>
      ['INCOMING', 'VENDOR_ASSIGNED', 'QUOTES_RECEIVED', 'UNDER_NEGOTIATION'].includes(q.status)
    );
    const pendingReturns = returns.filter((r) => r.status === 'REQUESTED');
    const openTickets = tickets.filter((t) => ['OPEN', 'IN_PROGRESS'].includes(t.status));

    return {
      success: true,
      data: {
        tenant: companyAdminDataService.tenants.get(tenantId),
        dateRange: { period, label: range.label },
        kpis: {
          totalRevenue,
          totalOrders: filteredOrders.length,
          allTimeOrders: allOrders.length,
          pendingOrders: pendingOrders.length,
          activeDispatches: activeDispatches.length,
          deliveredOrders: deliveredOrders.length,
          activeVendors: activeVendors.length,
          totalVendors: vendors.length,
          pendingVendorApprovals: pendingVendorApprovals.length,
          totalProducts: products.length,
          liveProducts: approvedProducts.length,
          pendingProductApprovals: pendingProducts.length,
          lowStockCount: lowStockAlerts.length,
          outOfStockCount: outOfStockProducts.length,
          pendingSettlementAmount,
          pendingSettlementCount: pendingSettlements.length,
          pendingQuotations: pendingQuotations.length,
          totalCustomers: customers.length,
          pendingReturns: pendingReturns.length,
          openTickets: openTickets.length,
        },
        sections: {
          ordersRequiringAttention: pendingOrders.slice(0, 6),
          pendingVendorApprovals: pendingVendorApprovals.slice(0, 5),
          pendingProductApprovals: pendingProducts.slice(0, 5),
          recentOrders: allOrders.slice(0, 6),
          lowStockAlerts: [...outOfStockProducts, ...lowStockAlerts].slice(0, 6),
          recentQuotations: quotations.slice(0, 5),
          recentPayments: settlements.slice(0, 5),
          dailyActivitySummary: companyAdminDataService.auditLogs
            .filter((l) => l.tenantId === tenantId)
            .slice(0, 8),
          customerFeedbackAlerts: [...reviews.slice(0, 3), ...openTickets.slice(0, 3)],
          systemNotifications: alerts.slice(0, 6),
        },
      },
    };
  }

  @Get('audit-logs')
  getAuditLogs(
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Query('module') mod?: string
  ) {
    const { tenantId } = this.requireAdmin(authHeader, 'dashboard:read', headerTenantId);
    let logs = companyAdminDataService.auditLogs.filter((l) => l.tenantId === tenantId);
    if (mod) logs = logs.filter((l) => l.module.toLowerCase() === mod.toLowerCase());
    return { success: true, data: logs.slice(0, 150) };
  }

  // ==================== 2. VENDOR MANAGEMENT ====================

  @Get('vendors')
  listVendors(
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string
  ) {
    const { tenantId } = this.requireAdmin(authHeader, 'vendors:read', headerTenantId);
    let list = companyAdminDataService.getTenantVendors(tenantId);

    if (status && status !== 'ALL') {
      if (status === 'ACTIVE' || status === 'APPROVED') {
        list = list.filter((v) => v.approvalStatus === 'APPROVED' || v.approvalStatus === 'ACTIVE');
      } else {
        list = list.filter((v) => v.approvalStatus === status);
      }
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (v) =>
          v.businessName?.toLowerCase().includes(q) ||
          v.storeName?.toLowerCase().includes(q) ||
          v.email?.toLowerCase().includes(q) ||
          v.gstin?.toLowerCase().includes(q) ||
          v.city?.toLowerCase().includes(q)
      );
    }
    return { success: true, data: list };
  }

  @Get('vendors/:id')
  getVendorDetail(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string
  ) {
    const { tenantId } = this.requireAdmin(authHeader, 'vendors:read', headerTenantId);
    const rawVendor = vendorRecords.get(id);
    if (!rawVendor) throw new NotFoundException('Vendor not found.');
    if ((rawVendor.tenantId || DEFAULT_TENANT_ID) !== tenantId) {
      throw new ForbiddenException('Tenant isolation error: Vendor belongs to another company.');
    }
    const vendor = companyAdminDataService.normalizeVendor(rawVendor);
    const products = companyAdminDataService
      .getTenantProducts(tenantId)
      .filter((p) => p.vendorId === id);
    const settlements = companyAdminDataService
      .getTenantSettlements(tenantId)
      .filter((s) => s.vendorId === id);
    const orders = companyAdminDataService
      .getTenantOrders(tenantId)
      .filter((o) => o.vendorId === id);

    return {
      success: true,
      data: {
        vendor,
        metrics: {
          totalProducts: products.length,
          liveProducts: products.filter((p) => p.approvalStatus === 'APPROVED' && p.isActive).length,
          totalOrders: orders.length,
          pendingSettlementAmount: settlements
            .filter((s) => s.status !== 'PAID')
            .reduce((sum, s) => sum + Number(s.netAmount || 0), 0),
        },
        products,
        settlements,
      },
    };
  }

  @Patch('vendors/:id/approve')
  async approveVendor(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Body() body?: { notes?: string; commissionRate?: number },
    @Req() req?: any
  ) {
    const { admin, tenantId } = this.requireAdmin(authHeader, 'vendors:manage', headerTenantId);
    const vendor = vendorRecords.get(id) as any;
    if (!vendor) throw new NotFoundException('Vendor not found.');
    if ((vendor.tenantId || DEFAULT_TENANT_ID) !== tenantId) {
      throw new ForbiddenException('Tenant isolation error.');
    }

    vendor.status = 'APPROVED';
    vendor.approvedBy = admin.email;
    vendor.approvedAt = new Date().toISOString();
    if (typeof body?.commissionRate === 'number') {
      vendor.commissionRate = body.commissionRate;
    }
    if (Array.isArray(vendor.kycDocuments)) {
      vendor.kycDocuments = vendor.kycDocuments.map((d: any) => ({
        ...d,
        verificationStatus: d.verificationStatus === 'REJECTED' ? 'REJECTED' : 'VERIFIED',
      }));
    }
    vendor.updatedAt = new Date().toISOString();
    await vendorPersistenceService.saveVendorRecord(vendor);

    const normalized = companyAdminDataService.normalizeVendor(vendor);

    vendorNotifications.unshift({
      id: `vnotif-${Date.now()}`,
      vendorId: vendor.id,
      title: 'Vendor Application Approved',
      message: body?.notes || 'Your KYC and business profile have been verified and approved.',
      type: 'SYSTEM',
      read: false,
      createdAt: new Date().toISOString(),
    } as any);

    void vendorNotificationService.notify(
      vendor.id,
      'APPLICATION_APPROVED',
      'Your Buildora 60 Vendor Account is Approved',
      `Congratulations ${normalized.businessName}! Your vendor account is now active.`,
      '/overview',
      { email: normalized.email, phone: normalized.phone }
    );

    companyAdminDataService.recordAuditLog({
      tenantId,
      actorId: admin.sub,
      actorName: admin.name,
      actorRole: admin.role,
      action: 'VENDOR_APPROVED',
      module: 'Vendors',
      entityType: 'Vendor',
      entityId: vendor.id,
      details: `Approved vendor ${normalized.businessName} (${normalized.gstin || 'No GSTIN'}).`,
      ipAddress: req?.ip || '127.0.0.1',
    });

    await platformNotificationService.dispatch({
      tenantId,
      recipientRole: 'VENDOR',
      recipientId: vendor.id,
      type: 'VENDOR_ONBOARDING',
      title: 'Vendor Application Approved',
      message: body?.notes || `Congratulations ${normalized.businessName}! Your account is approved.`,
      severity: 'SUCCESS',
      actionUrl: '/overview',
      metadata: { vendorId: vendor.id, status: 'APPROVED' },
      email: normalized.email,
      phone: normalized.phone,
    });
    realtimeBus.emitVendorAndAdmin(
      vendor.id,
      'vendor.application.approved',
      { vendor: normalized, notes: body?.notes },
      tenantId
    );

    return { success: true, data: normalized, message: 'Vendor approved and activated.' };
  }

  @Patch('vendors/:id/reject')
  async rejectVendor(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Body() body?: { reason?: string },
    @Req() req?: any
  ) {
    const { admin, tenantId } = this.requireAdmin(authHeader, 'vendors:manage', headerTenantId);
    const vendor = vendorRecords.get(id) as any;
    if (!vendor) throw new NotFoundException('Vendor not found.');
    if ((vendor.tenantId || DEFAULT_TENANT_ID) !== tenantId) {
      throw new ForbiddenException('Tenant isolation error.');
    }
    if (!body?.reason?.trim()) {
      throw new BadRequestException('Rejection reason is required.');
    }

    vendor.status = 'REJECTED';
    vendor.rejectionReason = body.reason.trim();
    vendor.rejectedBy = admin.email;
    vendor.rejectedAt = new Date().toISOString();
    vendor.updatedAt = new Date().toISOString();
    await vendorPersistenceService.saveVendorRecord(vendor);

    for (const vp of vendorProducts) {
      if (vp.vendorId === id) {
        vp.isActive = false;
        companyAdminDataService.syncCustomerPortalProduct(vp);
      }
    }

    const normalized = companyAdminDataService.normalizeVendor(vendor);

    companyAdminDataService.recordAuditLog({
      tenantId,
      actorId: admin.sub,
      actorName: admin.name,
      actorRole: admin.role,
      action: 'VENDOR_REJECTED',
      module: 'Vendors',
      entityType: 'Vendor',
      entityId: vendor.id,
      details: `Rejected vendor ${normalized.businessName}: ${body.reason.trim()}`,
      ipAddress: req?.ip || '127.0.0.1',
    });

    await platformNotificationService.dispatch({
      tenantId,
      recipientRole: 'VENDOR',
      recipientId: vendor.id,
      type: 'VENDOR_ONBOARDING',
      title: 'Vendor Application Rejected',
      message: body.reason.trim(),
      severity: 'WARNING',
      actionUrl: '/application-status',
      metadata: { vendorId: vendor.id, status: 'REJECTED', reason: body.reason.trim() },
      email: normalized.email,
      phone: normalized.phone,
    });
    realtimeBus.emitVendorAndAdmin(
      vendor.id,
      'vendor.application.rejected',
      { vendor: normalized, reason: body.reason.trim() },
      tenantId
    );

    return { success: true, data: normalized, message: 'Vendor application rejected.' };
  }

  @Patch('vendors/:id/request-correction')
  async requestVendorCorrection(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Body() body?: { reason?: string },
    @Req() req?: any
  ) {
    const { admin, tenantId } = this.requireAdmin(authHeader, 'vendors:manage', headerTenantId);
    const vendor = vendorRecords.get(id) as any;
    if (!vendor) throw new NotFoundException('Vendor not found.');
    if ((vendor.tenantId || DEFAULT_TENANT_ID) !== tenantId) {
      throw new ForbiddenException('Tenant isolation error.');
    }
    if (!body?.reason?.trim()) {
      throw new BadRequestException('Correction notes are required.');
    }

    vendor.status = 'RESUBMISSION_REQUIRED';
    vendor.resubmissionReason = body.reason.trim();
    vendor.updatedAt = new Date().toISOString();
    await vendorPersistenceService.saveVendorRecord(vendor);

    const normalized = companyAdminDataService.normalizeVendor(vendor);

    vendorNotifications.unshift({
      id: `vnotif-${Date.now()}`,
      vendorId: vendor.id,
      title: 'Document / Profile Correction Requested',
      message: body.reason.trim(),
      type: 'SYSTEM',
      read: false,
      createdAt: new Date().toISOString(),
    } as any);

    companyAdminDataService.recordAuditLog({
      tenantId,
      actorId: admin.sub,
      actorName: admin.name,
      actorRole: admin.role,
      action: 'VENDOR_CORRECTION_REQUESTED',
      module: 'Vendors',
      entityType: 'Vendor',
      entityId: vendor.id,
      details: `Requested corrections for ${normalized.businessName}: ${body.reason.trim()}`,
      ipAddress: req?.ip || '127.0.0.1',
    });

    await platformNotificationService.dispatch({
      tenantId,
      recipientRole: 'VENDOR',
      recipientId: vendor.id,
      type: 'VENDOR_ONBOARDING',
      title: 'Action Required: Profile/KYC Corrections Needed',
      message: body.reason.trim(),
      severity: 'WARNING',
      actionUrl: '/application-status',
      metadata: { vendorId: vendor.id, status: 'RESUBMISSION_REQUIRED', reason: body.reason.trim() },
      email: normalized.email,
      phone: normalized.phone,
    });
    realtimeBus.emitVendorAndAdmin(
      vendor.id,
      'vendor.application.rejected',
      { vendor: normalized, reason: body.reason.trim(), action: 'CORRECTION_REQUESTED' },
      tenantId
    );

    return { success: true, data: normalized, message: 'Correction request sent to vendor.' };
  }

  @Patch('vendors/:id/suspend')
  async suspendVendor(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Body() body?: { reason?: string },
    @Req() req?: any
  ) {
    const { admin, tenantId } = this.requireAdmin(authHeader, 'vendors:manage', headerTenantId);
    const vendor = vendorRecords.get(id) as any;
    if (!vendor) throw new NotFoundException('Vendor not found.');
    if ((vendor.tenantId || DEFAULT_TENANT_ID) !== tenantId) {
      throw new ForbiddenException('Tenant isolation error.');
    }

    vendor.status = 'SUSPENDED';
    vendor.suspendedReason = body?.reason || 'Suspended by Company Admin';
    vendor.suspendedAt = new Date().toISOString();
    vendor.updatedAt = new Date().toISOString();
    await vendorPersistenceService.saveVendorRecord(vendor);

    for (const vp of vendorProducts) {
      if (vp.vendorId === id) {
        vp.isActive = false;
        companyAdminDataService.syncCustomerPortalProduct(vp);
        await platformPersistenceService.upsert(PlatformProductModel, vp);
        realtimeBus.emitPublic('product.suspended', { productId: vp.id, vendorId: id }, tenantId);
      }
    }

    const normalized = companyAdminDataService.normalizeVendor(vendor);

    companyAdminDataService.recordAuditLog({
      tenantId,
      actorId: admin.sub,
      actorName: admin.name,
      actorRole: admin.role,
      action: 'VENDOR_SUSPENDED',
      module: 'Vendors',
      entityType: 'Vendor',
      entityId: vendor.id,
      details: `Suspended vendor ${normalized.businessName}. Products hidden from storefront.`,
      ipAddress: req?.ip || '127.0.0.1',
    });

    await platformNotificationService.dispatch({
      tenantId,
      recipientRole: 'VENDOR',
      recipientId: vendor.id,
      type: 'VENDOR_ONBOARDING',
      title: 'Vendor Account Suspended',
      message: vendor.suspendedReason,
      severity: 'CRITICAL',
      actionUrl: '/account-restricted',
      metadata: { vendorId: vendor.id, status: 'SUSPENDED' },
      email: normalized.email,
      phone: normalized.phone,
    });
    realtimeBus.emitVendorAndAdmin(
      vendor.id,
      'vendor.application.rejected',
      { vendor: normalized, reason: vendor.suspendedReason, action: 'SUSPENDED' },
      tenantId
    );

    return { success: true, data: normalized };
  }

  @Patch('vendors/:id/activate')
  async activateVendor(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Req() req?: any
  ) {
    const { admin, tenantId } = this.requireAdmin(authHeader, 'vendors:manage', headerTenantId);
    const vendor = vendorRecords.get(id) as any;
    if (!vendor) throw new NotFoundException('Vendor not found.');
    if ((vendor.tenantId || DEFAULT_TENANT_ID) !== tenantId) {
      throw new ForbiddenException('Tenant isolation error.');
    }

    vendor.status = 'APPROVED';
    vendor.updatedAt = new Date().toISOString();
    await vendorPersistenceService.saveVendorRecord(vendor);

    for (const vp of vendorProducts) {
      if (vp.vendorId === id && vp.approvalStatus === 'APPROVED' && !(vp as any).isSuspended) {
        vp.isActive = true;
        companyAdminDataService.syncCustomerPortalProduct(vp);
        await platformPersistenceService.upsert(PlatformProductModel, vp);
        realtimeBus.emitPublic('product.updated', { product: vp }, tenantId);
      }
    }

    const normalized = companyAdminDataService.normalizeVendor(vendor);

    companyAdminDataService.recordAuditLog({
      tenantId,
      actorId: admin.sub,
      actorName: admin.name,
      actorRole: admin.role,
      action: 'VENDOR_ACTIVATED',
      module: 'Vendors',
      entityType: 'Vendor',
      entityId: vendor.id,
      details: `Re-activated vendor ${normalized.businessName}.`,
      ipAddress: req?.ip || '127.0.0.1',
    });

    await platformNotificationService.dispatch({
      tenantId,
      recipientRole: 'VENDOR',
      recipientId: vendor.id,
      type: 'VENDOR_ONBOARDING',
      title: 'Vendor Account Re-activated',
      message: `${normalized.businessName} has been re-activated. Approved catalog items are live.`,
      severity: 'SUCCESS',
      actionUrl: '/overview',
      metadata: { vendorId: vendor.id, status: 'APPROVED' },
      email: normalized.email,
      phone: normalized.phone,
    });
    realtimeBus.emitVendorAndAdmin(
      vendor.id,
      'vendor.application.approved',
      { vendor: normalized, action: 'ACTIVATED' },
      tenantId
    );

    return { success: true, data: normalized };
  }

  @Patch('vendors/:id/documents/:docId/verify')
  async verifyVendorDocument(
    @Param('id') id: string,
    @Param('docId') docId: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Body() body?: { status?: 'VERIFIED' | 'REJECTED'; notes?: string },
    @Req() req?: any
  ) {
    const { admin, tenantId } = this.requireAdmin(authHeader, 'vendors:manage', headerTenantId);
    const vendor = vendorRecords.get(id) as any;
    if (!vendor) throw new NotFoundException('Vendor not found.');
    if ((vendor.tenantId || DEFAULT_TENANT_ID) !== tenantId) {
      throw new ForbiddenException('Tenant isolation error.');
    }

    const docs = vendor.kycDocuments || vendor.documents || [];
    const doc = docs.find((d: any) => d.id === docId);
    if (!doc) throw new NotFoundException('Document not found.');
    doc.verificationStatus = body?.status || 'VERIFIED';
    doc.status = doc.verificationStatus;
    doc.rejectionReason = body?.status === 'REJECTED' ? body?.notes || '' : undefined;
    vendor.updatedAt = new Date().toISOString();
    await vendorPersistenceService.saveVendorRecord(vendor);

    const normalized = companyAdminDataService.normalizeVendor(vendor);

    companyAdminDataService.recordAuditLog({
      tenantId,
      actorId: admin.sub,
      actorName: admin.name,
      actorRole: admin.role,
      action: 'VENDOR_DOCUMENT_REVIEWED',
      module: 'Vendors',
      entityType: 'VendorDocument',
      entityId: docId,
      details: `Marked ${doc.type} as ${doc.verificationStatus} for ${normalized.businessName}.`,
      ipAddress: req?.ip || '127.0.0.1',
    });

    return { success: true, data: normalized };
  }

  // ==================== 3. PRODUCT & CATALOG MANAGEMENT ====================

  @Get('products')
  listProducts(
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Query('status') status?: string,
    @Query('categoryId') categoryId?: string,
    @Query('vendorId') vendorId?: string,
    @Query('search') search?: string
  ) {
    const { tenantId } = this.requireAdmin(authHeader, 'products:read', headerTenantId);
    let list = companyAdminDataService.getTenantProducts(tenantId);

    if (status && status !== 'ALL') {
      list = list.filter((p) => p.approvalStatus === status);
    }
    if (categoryId && categoryId !== 'ALL') {
      list = list.filter((p) => p.categoryId === categoryId || p.categoryName === categoryId);
    }
    if (vendorId && vendorId !== 'ALL') {
      list = list.filter((p) => p.vendorId === vendorId);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.vendorName?.toLowerCase().includes(q)
      );
    }
    return { success: true, data: list };
  }

  private findTenantProduct(tenantId: string, productId: string) {
    const vp = vendorProducts.find((p) => p.id === productId || p.sku === productId);
    if (vp) {
      const vpTenant = (vp as any).tenantId || DEFAULT_TENANT_ID;
      if (vpTenant !== tenantId) {
        throw new ForbiddenException('Tenant isolation violation: Product belongs to another company.');
      }
      return { source: 'vendor' as const, product: vp as any };
    }
    if (tenantId === DEFAULT_TENANT_ID) {
      const cp = dbStore.products.find((p) => p.id === productId || p.sku === productId);
      if (cp) return { source: 'storefront' as const, product: cp as any };
    }
    throw new NotFoundException('Product not found.');
  }

  @Patch('products/:id/approve')
  async approveProduct(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Body() body?: { notes?: string },
    @Req() req?: any
  ) {
    const { admin, tenantId } = this.requireAdmin(authHeader, 'products:manage', headerTenantId);
    const { product } = this.findTenantProduct(tenantId, id);

    // Apply staged pending revision changes upon approval
    if (product.pendingRevision && typeof product.pendingRevision === 'object') {
      Object.assign(product, product.pendingRevision);
      if (product.mrp && product.price) {
        product.discount = Math.max(0, Math.round(((Number(product.mrp) - Number(product.price)) / Number(product.mrp)) * 100));
        product.sellingPrice = Number(product.price);
      }
      delete product.pendingRevision;
      product.revisionStatus = 'APPROVED';
      product.hasPendingChanges = false;
    }

    product.approvalStatus = 'APPROVED';
    product.isActive = true;
    product.isSuspended = false;
    product.rejectionReason = undefined;
    product.approvedBy = admin.email;
    product.approvedAt = new Date().toISOString();
    product.version = (Number(product.version) || 1) + 1;
    if (!Array.isArray(product.versionHistory)) product.versionHistory = [];
    product.versionHistory.unshift({
      version: product.version,
      action: 'APPROVED',
      actor: admin.email,
      notes: body?.notes || 'Approved for Customer Storefront',
      timestamp: new Date().toISOString(),
      snapshot: {
        name: product.name,
        price: product.price ?? product.sellingPrice,
        mrp: product.mrp,
        stockCount: product.stockCount ?? product.stock,
      },
    });
    product.updatedAt = new Date().toISOString();
    companyAdminDataService.syncCustomerPortalProduct(product);
    await platformPersistenceService.upsert(PlatformProductModel, product);

    companyAdminDataService.recordAuditLog({
      tenantId,
      actorId: admin.sub,
      actorName: admin.name,
      actorRole: admin.role,
      action: 'PRODUCT_APPROVED',
      module: 'Catalog',
      entityType: 'Product',
      entityId: product.id,
      details: `Approved & published SKU ${product.sku} (${product.name}) to Customer Storefront.`,
      ipAddress: req?.ip || '127.0.0.1',
    });

    if (product.vendorId) {
      await platformNotificationService.dispatch({
        tenantId,
        recipientRole: 'VENDOR',
        recipientId: product.vendorId,
        type: 'PRODUCT',
        title: `Product Approved: ${product.name}`,
        message: body?.notes || `SKU ${product.sku} is now live on the BUILDORA 60 customer website.`,
        severity: 'SUCCESS',
        actionUrl: '/products',
        metadata: { productId: product.id, sku: product.sku, approvalStatus: 'APPROVED' },
      });
      realtimeBus.emitVendorAndAdmin(product.vendorId, 'product.approved', { product }, tenantId);
    }
    realtimeBus.emitPublic('product.approved', { product }, tenantId);

    return {
      success: true,
      data: product,
      message: 'Product approved and synced to Customer Website.',
    };
  }

  @Patch('products/:id/reject')
  async rejectProduct(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Body() body?: { reason?: string },
    @Req() req?: any
  ) {
    const { admin, tenantId } = this.requireAdmin(authHeader, 'products:manage', headerTenantId);
    if (!body?.reason?.trim()) throw new BadRequestException('Rejection reason is required.');
    const { product } = this.findTenantProduct(tenantId, id);

    // Clear pending revision without overwriting public snapshot if already approved
    if (product.pendingRevision) {
      delete product.pendingRevision;
      product.revisionStatus = 'REJECTED';
      product.hasPendingChanges = false;
    }

    product.approvalStatus = 'REJECTED';
    product.isActive = false;
    product.rejectionReason = body.reason.trim();
    product.rejectedBy = admin.email;
    product.rejectedAt = new Date().toISOString();
    if (!Array.isArray(product.versionHistory)) product.versionHistory = [];
    product.versionHistory.unshift({
      version: product.version || 1,
      action: 'REJECTED',
      actor: admin.email,
      notes: body.reason.trim(),
      timestamp: new Date().toISOString(),
    });
    product.updatedAt = new Date().toISOString();
    companyAdminDataService.syncCustomerPortalProduct(product);
    await platformPersistenceService.upsert(PlatformProductModel, product);

    companyAdminDataService.recordAuditLog({
      tenantId,
      actorId: admin.sub,
      actorName: admin.name,
      actorRole: admin.role,
      action: 'PRODUCT_REJECTED',
      module: 'Catalog',
      entityType: 'Product',
      entityId: product.id,
      details: `Rejected SKU ${product.sku}: ${body.reason.trim()}`,
      ipAddress: req?.ip || '127.0.0.1',
    });

    if (product.vendorId) {
      await platformNotificationService.dispatch({
        tenantId,
        recipientRole: 'VENDOR',
        recipientId: product.vendorId,
        type: 'PRODUCT',
        title: `Product Rejected: ${product.name}`,
        message: `Reason: ${body.reason.trim()}`,
        severity: 'WARNING',
        actionUrl: '/products',
        metadata: { productId: product.id, sku: product.sku, reason: body.reason.trim() },
      });
      realtimeBus.emitVendorAndAdmin(
        product.vendorId,
        'product.rejected',
        { product, reason: body.reason.trim() },
        tenantId
      );
    }

    return { success: true, data: product };
  }

  @Patch('products/:id/suspend')
  async suspendProduct(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Body() body?: { reason?: string },
    @Req() req?: any
  ) {
    const { admin, tenantId } = this.requireAdmin(authHeader, 'products:manage', headerTenantId);
    const { product } = this.findTenantProduct(tenantId, id);

    product.isSuspended = true;
    product.isActive = false;
    product.suspendedReason = body?.reason || 'Suspended by Company Admin';
    product.suspendedAt = new Date().toISOString();
    product.updatedAt = new Date().toISOString();
    companyAdminDataService.syncCustomerPortalProduct(product);
    await platformPersistenceService.upsert(PlatformProductModel, product);

    companyAdminDataService.recordAuditLog({
      tenantId,
      actorId: admin.sub,
      actorName: admin.name,
      actorRole: admin.role,
      action: 'PRODUCT_SUSPENDED',
      module: 'Catalog',
      entityType: 'Product',
      entityId: product.id,
      details: `Suspended SKU ${product.sku}: ${product.suspendedReason}`,
      ipAddress: req?.ip || '127.0.0.1',
    });

    if (product.vendorId) {
      await platformNotificationService.dispatch({
        tenantId,
        recipientRole: 'VENDOR',
        recipientId: product.vendorId,
        type: 'PRODUCT',
        title: `Product Suspended: ${product.name}`,
        message: product.suspendedReason,
        severity: 'CRITICAL',
        actionUrl: '/products',
        metadata: { productId: product.id, sku: product.sku },
      });
      realtimeBus.emitVendorAndAdmin(product.vendorId, 'product.suspended', { product }, tenantId);
    }
    realtimeBus.emitPublic('product.suspended', { productId: product.id, sku: product.sku }, tenantId);

    return { success: true, data: product, message: 'Product suspended and hidden from customers.' };
  }

  @Patch('products/:id/unsuspend')
  async unsuspendProduct(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Req() req?: any
  ) {
    const { admin, tenantId } = this.requireAdmin(authHeader, 'products:manage', headerTenantId);
    const { product } = this.findTenantProduct(tenantId, id);

    product.isSuspended = false;
    product.suspendedReason = undefined;
    if (product.approvalStatus === 'APPROVED') {
      product.isActive = true;
    }
    product.updatedAt = new Date().toISOString();
    companyAdminDataService.syncCustomerPortalProduct(product);
    await platformPersistenceService.upsert(PlatformProductModel, product);

    companyAdminDataService.recordAuditLog({
      tenantId,
      actorId: admin.sub,
      actorName: admin.name,
      actorRole: admin.role,
      action: 'PRODUCT_UNSUSPENDED',
      module: 'Catalog',
      entityType: 'Product',
      entityId: product.id,
      details: `Unsuspended SKU ${product.sku}.`,
      ipAddress: req?.ip || '127.0.0.1',
    });

    if (product.vendorId) {
      realtimeBus.emitVendorAndAdmin(product.vendorId, 'product.updated', { product }, tenantId);
    }
    if (product.approvalStatus === 'APPROVED' && product.isActive) {
      realtimeBus.emitPublic('product.updated', { product }, tenantId);
    }

    return { success: true, data: product, message: 'Product suspension lifted.' };
  }

  @Post('products/bulk-approve')
  async bulkApproveProducts(
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Body() body?: { productIds?: string[] },
    @Req() req?: any
  ) {
    const { admin, tenantId } = this.requireAdmin(authHeader, 'products:manage', headerTenantId);
    const ids = body?.productIds || [];
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('Select at least one product to approve.');
    }

    const updated: any[] = [];
    for (const id of ids) {
      const { product } = this.findTenantProduct(tenantId, id);
      product.approvalStatus = 'APPROVED';
      product.isActive = true;
      product.isSuspended = false;
      product.updatedAt = new Date().toISOString();
      companyAdminDataService.syncCustomerPortalProduct(product);
      await platformPersistenceService.upsert(PlatformProductModel, product);
      if (product.vendorId) {
        realtimeBus.emitVendorAndAdmin(product.vendorId, 'product.approved', { product }, tenantId);
      }
      realtimeBus.emitPublic('product.approved', { product }, tenantId);
      updated.push(product);
    }

    companyAdminDataService.recordAuditLog({
      tenantId,
      actorId: admin.sub,
      actorName: admin.name,
      actorRole: admin.role,
      action: 'PRODUCTS_BULK_APPROVED',
      module: 'Catalog',
      entityType: 'Product',
      entityId: ids.join(','),
      details: `Bulk approved ${updated.length} product(s).`,
      ipAddress: req?.ip || '127.0.0.1',
    });

    return { success: true, data: updated, count: updated.length };
  }

  @Patch('products/:id')
  async updateProduct(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Body() body?: Record<string, any>,
    @Req() req?: any
  ) {
    const { admin, tenantId } = this.requireAdmin(authHeader, 'products:manage', headerTenantId);
    const { product } = this.findTenantProduct(tenantId, id);

    const allowed = [
      'name',
      'description',
      'categoryId',
      'categoryName',
      'brand',
      'mrp',
      'sellingPrice',
      'price',
      'gstRate',
      'hsnCode',
      'unit',
      'packSize',
      'lowStockThreshold',
      'isActive',
      'specifications',
      'bulkPricing',
      'variants',
    ];
    for (const key of allowed) {
      if (body && body[key] !== undefined) {
        product[key] = body[key];
      }
    }
    if (body?.sellingPrice !== undefined) product.price = body.sellingPrice;
    if (body?.price !== undefined && body.sellingPrice === undefined) {
      product.sellingPrice = body.price;
    }
    product.updatedAt = new Date().toISOString();
    companyAdminDataService.syncCustomerPortalProduct(product);
    await platformPersistenceService.upsert(PlatformProductModel, product);

    companyAdminDataService.recordAuditLog({
      tenantId,
      actorId: admin.sub,
      actorName: admin.name,
      actorRole: admin.role,
      action: 'PRODUCT_UPDATED',
      module: 'Catalog',
      entityType: 'Product',
      entityId: product.id,
      details: `Updated catalog fields for SKU ${product.sku}.`,
      ipAddress: req?.ip || '127.0.0.1',
    });

    if (product.vendorId) {
      realtimeBus.emitVendorAndAdmin(product.vendorId, 'product.updated', { product }, tenantId);
    }
    if (product.approvalStatus === 'APPROVED' && product.isActive !== false) {
      realtimeBus.emitPublic('product.updated', { product }, tenantId);
    }

    return { success: true, data: product };
  }

  @Patch('products/:id/visibility')
  async toggleProductVisibility(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Body() body?: { isActive: boolean },
    @Req() req?: any
  ) {
    const { admin, tenantId } = this.requireAdmin(authHeader, 'products:manage', headerTenantId);
    const { product } = this.findTenantProduct(tenantId, id);

    product.isActive = Boolean(body?.isActive);
    product.updatedAt = new Date().toISOString();
    companyAdminDataService.syncCustomerPortalProduct(product);
    await platformPersistenceService.upsert(PlatformProductModel, product);

    companyAdminDataService.recordAuditLog({
      tenantId,
      actorId: admin.sub,
      actorName: admin.name,
      actorRole: admin.role,
      action: 'PRODUCT_VISIBILITY_CHANGED',
      module: 'Catalog',
      entityType: 'Product',
      entityId: product.id,
      details: `${product.name} visibility set to ${body?.isActive ? 'VISIBLE' : 'HIDDEN'}.`,
      ipAddress: req?.ip || '127.0.0.1',
    });

    if (product.vendorId) {
      realtimeBus.emitVendorAndAdmin(product.vendorId, 'product.updated', { product }, tenantId);
    }
    realtimeBus.emitPublic(
      product.isActive && product.approvalStatus === 'APPROVED' ? 'product.updated' : 'product.suspended',
      { productId: product.id, product },
      tenantId
    );

    return { success: true, data: product };
  }

  @Get('catalog/categories')
  listCategories(
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string
  ) {
    this.requireAdmin(authHeader, 'products:read', headerTenantId);
    return {
      success: true,
      data: {
        categories: dbStore.categories,
        brands: dbStore.brands,
        attributes: companyAdminDataService.attributes,
      },
    };
  }

  @Post('catalog/categories')
  createCategory(
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Body() body?: { name?: string; slug?: string; description?: string; parentId?: string },
    @Req() req?: any
  ) {
    const { admin, tenantId } = this.requireAdmin(authHeader, 'products:manage', headerTenantId);
    if (!body?.name?.trim()) throw new BadRequestException('Category name is required.');
    const cat = {
      id: `cat-${Date.now()}`,
      name: body.name.trim(),
      slug:
        body.slug?.trim() ||
        body.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      icon: 'Layers',
      image: '',
      description: body.description || '',
      subcategories: [],
      itemCount: 0,
      featured: false,
    };
    dbStore.categories.push(cat);
    companyAdminDataService.recordAuditLog({
      tenantId,
      actorId: admin.sub,
      actorName: admin.name,
      actorRole: admin.role,
      action: 'CATEGORY_CREATED',
      module: 'Catalog',
      entityType: 'Category',
      entityId: cat.id,
      details: `Created category ${cat.name}.`,
      ipAddress: req?.ip || '127.0.0.1',
    });
    return { success: true, data: cat };
  }

  @Post('catalog/brands')
  createBrand(
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Body() body?: { name?: string; description?: string },
    @Req() req?: any
  ) {
    const { admin, tenantId } = this.requireAdmin(authHeader, 'products:manage', headerTenantId);
    if (!body?.name?.trim()) throw new BadRequestException('Brand name is required.');
    const brand = {
      id: `brd-${Date.now()}`,
      name: body.name.trim(),
      slug: body.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      logo: '',
      description: body.description || 'Verified Buildora Partner Brand',
      categories: [],
      featured: true,
    };
    dbStore.brands.push(brand);
    companyAdminDataService.recordAuditLog({
      tenantId,
      actorId: admin.sub,
      actorName: admin.name,
      actorRole: admin.role,
      action: 'BRAND_CREATED',
      module: 'Catalog',
      entityType: 'Brand',
      entityId: brand.id,
      details: `Added verified brand ${brand.name}.`,
      ipAddress: req?.ip || '127.0.0.1',
    });
    return { success: true, data: brand };
  }

  @Post('catalog/attributes')
  createAttribute(
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Body() body?: { name?: string; categoryName?: string; values?: string[]; isRequired?: boolean }
  ) {
    const { tenantId } = this.requireAdmin(authHeader, 'products:manage', headerTenantId);
    if (!body?.name?.trim()) throw new BadRequestException('Attribute name required.');
    const attr = {
      id: `attr-${Date.now()}`,
      tenantId,
      name: body.name.trim(),
      code: body.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_'),
      categoryName: body.categoryName || 'General',
      values: body.values || [],
      isRequired: Boolean(body.isRequired),
      isFilterable: true,
    };
    companyAdminDataService.attributes.push(attr);
    return { success: true, data: attr };
  }

  // ==================== 4. INVENTORY & WAREHOUSES ====================

  @Get('inventory')
  getInventory(
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Query('filter') filter?: string,
    @Query('search') search?: string
  ) {
    const { tenantId } = this.requireAdmin(authHeader, 'inventory:read', headerTenantId);
    let items = companyAdminDataService.getTenantProducts(tenantId);
    const warehouses = companyAdminDataService.getTenantWarehouses(tenantId);
    const movements = companyAdminDataService.getTenantStockMovements(tenantId);

    if (filter === 'LOW_STOCK') {
      items = items.filter((i) => i.stock > 0 && i.stock <= (i.lowStockThreshold || 25));
    } else if (filter === 'OUT_OF_STOCK') {
      items = items.filter((i) => i.stock <= 0);
    } else if (filter === 'RESERVED') {
      items = items.filter((i) => (i.reservedStock || 0) > 0);
    }
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (i) => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q)
      );
    }

    return {
      success: true,
      data: {
        items,
        warehouses,
        movements: movements.slice(0, 60),
      },
    };
  }

  @Post('inventory/adjust')
  async adjustInventory(
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Body()
    body?: {
      productId: string;
      adjustmentType: 'ADD' | 'SUBTRACT' | 'SET';
      quantity: number;
      reason?: string;
    },
    @Req() req?: any
  ) {
    const { admin, tenantId } = this.requireAdmin(authHeader, 'inventory:manage', headerTenantId);
    if (!body?.productId || typeof body?.quantity !== 'number' || body.quantity < 0) {
      throw new BadRequestException('Valid productId and non-negative quantity are required.');
    }

    const { product } = this.findTenantProduct(tenantId, body.productId);
    const prevStock = Number(product.stock ?? product.stockCount ?? 0);
    let nextStock = prevStock;
    if (body.adjustmentType === 'ADD') nextStock = prevStock + body.quantity;
    else if (body.adjustmentType === 'SUBTRACT') nextStock = Math.max(0, prevStock - body.quantity);
    else if (body.adjustmentType === 'SET') nextStock = body.quantity;

    product.stock = nextStock;
    product.stockCount = nextStock;
    product.inStock = nextStock > 0;
    product.updatedAt = new Date().toISOString();
    companyAdminDataService.syncCustomerPortalProduct(product);
    await platformPersistenceService.upsert(PlatformProductModel, product);

    const cp = dbStore.products.find((p) => p.id === product.id || p.sku === product.sku);
    if (cp) {
      cp.stockCount = nextStock;
      cp.inStock = nextStock > 0;
    }

    const movement: any = {
      id: `stk-${Date.now()}`,
      vendorId: product.vendorId || DEFAULT_VENDOR_ID,
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      warehouseId: 'wh-blr-01',
      warehouseName: 'Central Hub',
      type: 'ADJUSTMENT',
      quantityDelta: nextStock - prevStock,
      quantityBefore: prevStock,
      quantityAfter: nextStock,
      reason: body.reason || `Company Admin adjustment (${body.adjustmentType})`,
      performedBy: admin.email,
      createdAt: new Date().toISOString(),
    };
    vendorStockMovements.unshift(movement);
    await platformPersistenceService.upsert(PlatformStockMovementModel, movement);

    const threshold = Number(product.lowStockThreshold ?? 15);
    if (nextStock <= threshold && product.vendorId) {
      await platformNotificationService.dispatch({
        tenantId,
        recipientRole: 'VENDOR',
        recipientId: product.vendorId,
        type: 'STOCK',
        title: nextStock === 0 ? `Out of Stock: ${product.name}` : `Low Stock Alert: ${product.name}`,
        message: `Available stock is ${nextStock} units (threshold: ${threshold}).`,
        severity: nextStock === 0 ? 'CRITICAL' : 'WARNING',
        actionUrl: '/inventory',
        metadata: { productId: product.id, stockCount: nextStock },
      });
    }

    realtimeBus.emitPublic(
      'inventory.updated',
      { productId: product.id, sku: product.sku, stockCount: nextStock, inStock: nextStock > 0 },
      tenantId
    );
    if (product.vendorId) {
      realtimeBus.emitVendorAndAdmin(
        product.vendorId,
        'inventory.updated',
        { productId: product.id, sku: product.sku, stockCount: nextStock, movement },
        tenantId
      );
    }

    companyAdminDataService.recordAuditLog({
      tenantId,
      actorId: admin.sub,
      actorName: admin.name,
      actorRole: admin.role,
      action: 'STOCK_ADJUSTED',
      module: 'Inventory',
      entityType: 'Product',
      entityId: product.id,
      details: `${product.sku}: ${prevStock} -> ${nextStock} (${body.reason || body.adjustmentType}).`,
      ipAddress: req?.ip || '127.0.0.1',
    });

    return { success: true, data: { product, movement } };
  }

  @Get('warehouses')
  listWarehouses(
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string
  ) {
    const { tenantId } = this.requireAdmin(authHeader, 'warehouses:read', headerTenantId);
    const warehouses = companyAdminDataService.getTenantWarehouses(tenantId);
    const products = companyAdminDataService.getTenantProducts(tenantId);
    return {
      success: true,
      data: warehouses.map((w: any) => ({
        ...w,
        skuCount: products.filter((p) => p.vendorId === (w.vendorId || DEFAULT_VENDOR_ID)).length,
        totalUnits: products
          .filter((p) => p.vendorId === (w.vendorId || DEFAULT_VENDOR_ID))
          .reduce((s, p) => s + Number(p.stock || 0), 0),
      })),
    };
  }

  @Post('warehouses')
  createWarehouse(
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Body()
    body?: {
      name: string;
      vendorId?: string;
      address: string;
      city: string;
      state: string;
      pincode: string;
      contactPerson: string;
      phone: string;
      servicePincodes?: string[];
    },
    @Req() req?: any
  ) {
    const { admin, tenantId } = this.requireAdmin(authHeader, 'warehouses:manage', headerTenantId);
    if (!body?.name || !body?.pincode) {
      throw new BadRequestException('Warehouse name and pincode are required.');
    }
    const vendorId =
      body.vendorId || companyAdminDataService.getTenantVendors(tenantId)[0]?.id || DEFAULT_VENDOR_ID;
    const wh: any = {
      id: `wh-${Date.now()}`,
      vendorId,
      name: body.name,
      address: body.address || `${body.city || 'Bengaluru'}, ${body.state || 'Karnataka'}`,
      city: body.city || 'Bengaluru',
      state: body.state || 'Karnataka',
      pincode: body.pincode,
      contactPerson: body.contactPerson || admin.name,
      phone: body.phone || '+91 98450 00000',
      servicePincodes: body.servicePincodes || [body.pincode],
      isPrimary: false,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    vendorWarehouses.push(wh);

    companyAdminDataService.recordAuditLog({
      tenantId,
      actorId: admin.sub,
      actorName: admin.name,
      actorRole: admin.role,
      action: 'WAREHOUSE_CREATED',
      module: 'Warehouses',
      entityType: 'Warehouse',
      entityId: wh.id,
      details: `Added warehouse ${wh.name} (${wh.pincode}).`,
      ipAddress: req?.ip || '127.0.0.1',
    });
    return { success: true, data: wh };
  }

  // ==================== 5. ORDERS & RETURNS ====================

  @Get('orders')
  listOrders(
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string
  ) {
    const { tenantId } = this.requireAdmin(authHeader, 'orders:read', headerTenantId);
    let orders = companyAdminDataService.getTenantOrders(tenantId);
    if (status && status !== 'ALL') {
      orders = orders.filter((o) => String(o.status).toUpperCase() === status.toUpperCase());
    }
    if (search) {
      const q = search.toLowerCase();
      orders = orders.filter(
        (o) =>
          String(o.orderNumber || o.id).toLowerCase().includes(q) ||
          String(o.customerName || '').toLowerCase().includes(q)
      );
    }
    return { success: true, data: orders };
  }

  @Get('orders/:id')
  getOrderDetail(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string
  ) {
    const { tenantId } = this.requireAdmin(authHeader, 'orders:read', headerTenantId);
    const all = companyAdminDataService.getTenantOrders(tenantId);
    const order = all.find((o) => o.id === id || o.orderNumber === id);
    if (!order) {
      const foreign = companyAdminDataService.tenantOrders.find((o) => o.id === id);
      if (foreign && foreign.tenantId !== tenantId) {
        throw new ForbiddenException('Tenant isolation violation: Order belongs to another company.');
      }
      throw new NotFoundException('Order not found.');
    }
    return { success: true, data: order };
  }

  @Patch('orders/:id/status')
  async updateOrderStatus(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Body() body?: { status: string; note?: string },
    @Req() req?: any
  ) {
    const { admin, tenantId } = this.requireAdmin(authHeader, 'orders:manage', headerTenantId);
    if (!body?.status) throw new BadRequestException('New order status is required.');

    const target = companyAdminDataService
      .getTenantOrders(tenantId)
      .find((o) => o.id === id || o.orderNumber === id);
    if (!target) throw new NotFoundException('Order not found in your company.');

    const nextStatus = body.status.toUpperCase();
    const nowIso = new Date().toISOString();

    for (const o of dbStore.orders) {
      if ((o.id === id || o.orderNumber === id || o.orderNumber === target.orderNumber) && tenantId === DEFAULT_TENANT_ID) {
        (o as any).status = nextStatus;
        (o as any).updatedAt = nowIso;
        if (!Array.isArray(o.timeline)) o.timeline = [];
        o.timeline.push({
          status: nextStatus as any,
          title: `Admin updated: ${nextStatus.replace(/_/g, ' ')}`,
          description: body.note || `Order marked ${nextStatus} by ${admin.name}`,
          timestamp: nowIso,
          completed: true,
        });
        await platformPersistenceService.upsert(PlatformOrderModel, o);
        if ((o as any).customerId) {
          await platformNotificationService.dispatch({
            tenantId,
            recipientRole: 'CUSTOMER',
            recipientId: (o as any).customerId,
            type: 'ORDER',
            title: `Order #${o.orderNumber} Updated`,
            message: body.note || `Your order is now ${nextStatus.replace(/_/g, ' ')}.`,
            severity: 'INFO',
            actionUrl: `/orders/${o.orderNumber}`,
          });
          realtimeBus.emitToCustomer(
            (o as any).customerId,
            'order.status.updated',
            { orderNumber: o.orderNumber, status: nextStatus, order: o },
            tenantId
          );
        }
      }
    }
    for (const vo of vendorOrders) {
      if ((vo.id === id || vo.orderNumber === id || vo.orderNumber === target.orderNumber) && tenantId === DEFAULT_TENANT_ID) {
        (vo as any).status = nextStatus;
        (vo as any).updatedAt = nowIso;
        if (!Array.isArray(vo.timeline)) vo.timeline = [];
        vo.timeline.push({
          status: nextStatus as any,
          title: `Admin override: ${nextStatus}`,
          description: body.note || `Updated by Company Admin (${admin.email})`,
          timestamp: nowIso,
        });
        await platformPersistenceService.upsert(PlatformOrderModel, vo);
        realtimeBus.emitToVendor(vo.vendorId, 'order.status.updated', {
          orderId: vo.id,
          orderNumber: vo.orderNumber,
          status: nextStatus,
        }, tenantId);
      }
    }
    for (const to of companyAdminDataService.tenantOrders) {
      if (to.tenantId === tenantId && (to.id === id || to.orderNumber === id)) {
        to.status = nextStatus;
        to.updatedAt = nowIso;
      }
    }

    if (nextStatus === 'CANCELLED') {
      const custOrd = dbStore.orders.find(
        (o) => o.id === id || o.orderNumber === id || o.orderNumber === target.orderNumber
      );
      if (custOrd) {
        await orderSyncService.releaseOrderStock(custOrd, `Cancelled by Admin (${admin.email})`);
      }
    }

    companyAdminDataService.recordAuditLog({
      tenantId,
      actorId: admin.sub,
      actorName: admin.name,
      actorRole: admin.role,
      action: 'ORDER_STATUS_UPDATED',
      module: 'Orders',
      entityType: 'Order',
      entityId: target.id,
      details: `Order ${target.orderNumber || target.id} moved to ${nextStatus}. ${body.note || ''}`,
      ipAddress: req?.ip || '127.0.0.1',
    });

    realtimeBus.emitToAdmin('order.status.updated', { orderNumber: target.orderNumber || target.id, status: nextStatus }, tenantId);

    return { success: true, data: { ...target, status: nextStatus } };
  }

  @Get('returns')
  listReturns(
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string
  ) {
    const { tenantId } = this.requireAdmin(authHeader, 'orders:read', headerTenantId);
    return { success: true, data: companyAdminDataService.getTenantReturns(tenantId) };
  }

  @Patch('returns/:id')
  async reviewReturn(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Body() body?: { status: 'APPROVED' | 'REJECTED' | 'REFUNDED'; resolutionNote?: string; restockDecision?: boolean },
    @Req() req?: any
  ) {
    const { admin, tenantId } = this.requireAdmin(authHeader, 'orders:manage', headerTenantId);
    const tenantVendorIds = new Set(
      companyAdminDataService.getTenantVendors(tenantId).map((v) => v.id)
    );
    const ret = vendorReturns.find((r) => r.id === id) as any;
    if (!ret || !tenantVendorIds.has(ret.vendorId)) {
      throw new NotFoundException('Return request not found in this tenant.');
    }
    ret.status = body?.status || 'APPROVED';
    ret.adminNote = body?.resolutionNote || '';
    ret.resolvedAt = new Date().toISOString();
    await platformPersistenceService.upsert(PlatformReturnModel, ret);

    await platformNotificationService.dispatch({
      tenantId,
      recipientRole: 'VENDOR',
      recipientId: ret.vendorId,
      type: 'ORDER',
      title: `Return #${ret.id} ${ret.status}`,
      message: body?.resolutionNote || `Company Admin marked return for order #${ret.orderNumber} as ${ret.status}.`,
      severity: ret.status === 'REJECTED' ? 'WARNING' : 'INFO',
      actionUrl: '/returns',
    });
    if (ret.customerId) {
      await platformNotificationService.dispatch({
        tenantId,
        recipientRole: 'CUSTOMER',
        recipientId: ret.customerId,
        type: 'ORDER',
        title: `Return ${ret.status}: #${ret.orderNumber}`,
        message: body?.resolutionNote || `Your return request status was updated to ${ret.status}.`,
        severity: 'INFO',
        actionUrl: `/orders/${ret.orderNumber}`,
      });
    }
    realtimeBus.emitVendorAndAdmin(ret.vendorId, 'order.status.updated', { returnId: ret.id, status: ret.status }, tenantId);

    companyAdminDataService.recordAuditLog({
      tenantId,
      actorId: admin.sub,
      actorName: admin.name,
      actorRole: admin.role,
      action: 'RETURN_REVIEWED',
      module: 'Orders',
      entityType: 'Return',
      entityId: ret.id,
      details: `Return ${ret.id} set to ${ret.status}.`,
      ipAddress: req?.ip || '127.0.0.1',
    });

    return { success: true, data: ret };
  }

  // ==================== 6. BULK ORDERS & QUOTATIONS ====================

  @Get('quotations')
  listQuotations(
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Query('status') status?: string
  ) {
    const { tenantId } = this.requireAdmin(authHeader, 'quotations:read', headerTenantId);
    let list = Array.from(companyAdminDataService.quotations.values()).filter(
      (q) => q.tenantId === tenantId
    );
    if (status && status !== 'ALL') {
      list = list.filter((q) => q.status === status);
    }
    return {
      success: true,
      data: list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    };
  }

  @Post('quotations')
  createQuotation(
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Body()
    body?: {
      customerName: string;
      customerPhone: string;
      customerEmail?: string;
      projectName: string;
      siteAddress: string;
      pincode: string;
      items: Array<{ name: string; sku?: string; unit: string; quantity: number; targetPrice: number }>;
    },
    @Req() req?: any
  ) {
    const { admin, tenantId } = this.requireAdmin(authHeader, 'quotations:manage', headerTenantId);
    if (!body?.customerName || !body?.items?.length) {
      throw new BadRequestException('Customer name and at least one material line item are required.');
    }

    const nowIso = new Date().toISOString();
    const record: CompanyQuotationRecord = {
      id: `quote-${Date.now()}`,
      tenantId,
      quoteNumber: `RFQ-${tenantId.slice(-3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: `cust-${Date.now()}`,
      customerName: body.customerName,
      customerPhone: body.customerPhone || '+91 98450 00000',
      customerEmail: body.customerEmail || '',
      projectName: body.projectName || 'Commercial Construction',
      siteAddress: body.siteAddress || 'Bengaluru',
      pincode: body.pincode || '560034',
      status: 'INCOMING',
      items: body.items.map((it, idx) => ({
        productId: `item-${idx + 1}`,
        sku: it.sku || `RFQ-SKU-${idx + 1}`,
        name: it.name,
        unit: it.unit || 'Unit',
        quantity: Number(it.quantity),
        targetPrice: Number(it.targetPrice),
      })),
      assignedVendorIds: [],
      vendorQuotes: [],
      negotiationHistory: [
        {
          id: `neg-${Date.now()}`,
          actor: admin.name,
          role: admin.role,
          message: 'Created bulk quotation request.',
          createdAt: nowIso,
        },
      ],
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    companyAdminDataService.quotations.set(record.id, record);
    void companyAdminPersistenceService.upsert(CompanyQuotationModel, record);

    companyAdminDataService.recordAuditLog({
      tenantId,
      actorId: admin.sub,
      actorName: admin.name,
      actorRole: admin.role,
      action: 'QUOTATION_CREATED',
      module: 'Quotations',
      entityType: 'Quotation',
      entityId: record.id,
      details: `Created RFQ ${record.quoteNumber} for ${record.customerName}.`,
      ipAddress: req?.ip || '127.0.0.1',
    });

    return { success: true, data: record };
  }

  private getTenantQuotationOrThrow(tenantId: string, id: string): CompanyQuotationRecord {
    const q = companyAdminDataService.quotations.get(id);
    if (!q) throw new NotFoundException('Quotation not found.');
    if (q.tenantId !== tenantId) {
      throw new ForbiddenException('Tenant isolation violation: Quotation belongs to another company.');
    }
    return q;
  }

  @Post('quotations/:id/assign-vendors')
  assignVendorsToQuotation(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Body() body?: { vendorIds: string[] },
    @Req() req?: any
  ) {
    const { admin, tenantId } = this.requireAdmin(authHeader, 'quotations:manage', headerTenantId);
    const quote = this.getTenantQuotationOrThrow(tenantId, id);
    const vendorIds = body?.vendorIds || [];
    if (!vendorIds.length) throw new BadRequestException('Select at least one vendor.');

    const validVendors = vendorIds
      .map((vid) => vendorRecords.get(vid))
      .filter((v) => v && (v.tenantId || DEFAULT_TENANT_ID) === tenantId)
      .map((v) => companyAdminDataService.normalizeVendor(v));

    if (validVendors.length === 0) {
      throw new BadRequestException('No valid company vendors found.');
    }

    for (const v of validVendors) {
      if (!quote.assignedVendorIds.includes(v.id)) {
        quote.assignedVendorIds.push(v.id);
        quote.vendorQuotes.push({
          vendorId: v.id,
          vendorName: v.businessName,
          totalQuotedAmount: 0,
          deliveryDays: 2,
          notes: 'Awaiting vendor price submission',
          status: 'PENDING',
        });
      }
    }
    quote.status = 'VENDOR_ASSIGNED';
    quote.updatedAt = new Date().toISOString();
    void companyAdminPersistenceService.upsert(CompanyQuotationModel, quote);

    companyAdminDataService.recordAuditLog({
      tenantId,
      actorId: admin.sub,
      actorName: admin.name,
      actorRole: admin.role,
      action: 'QUOTATION_VENDORS_ASSIGNED',
      module: 'Quotations',
      entityType: 'Quotation',
      entityId: quote.id,
      details: `Assigned ${validVendors.map((v) => v.businessName).join(', ')} to ${quote.quoteNumber}.`,
      ipAddress: req?.ip || '127.0.0.1',
    });

    return { success: true, data: quote };
  }

  @Post('quotations/:id/vendor-quote')
  recordVendorQuote(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Body()
    body?: { vendorId: string; totalQuotedAmount: number; deliveryDays?: number; notes?: string }
  ) {
    const { tenantId } = this.requireAdmin(authHeader, 'quotations:manage', headerTenantId);
    const quote = this.getTenantQuotationOrThrow(tenantId, id);
    const rawVendor = vendorRecords.get(body?.vendorId || '');
    if (!rawVendor || (rawVendor.tenantId || DEFAULT_TENANT_ID) !== tenantId) {
      throw new BadRequestException('Vendor not found in company.');
    }
    const vendor = companyAdminDataService.normalizeVendor(rawVendor);

    const existing = quote.vendorQuotes.find((vq) => vq.vendorId === vendor.id);
    if (existing) {
      existing.totalQuotedAmount = Number(body?.totalQuotedAmount || 0);
      existing.deliveryDays = Number(body?.deliveryDays || 2);
      existing.notes = body?.notes || 'Vendor quote updated';
      existing.status = 'SUBMITTED';
      existing.submittedAt = new Date().toISOString();
    } else {
      quote.vendorQuotes.push({
        vendorId: vendor.id,
        vendorName: vendor.businessName,
        totalQuotedAmount: Number(body?.totalQuotedAmount || 0),
        deliveryDays: Number(body?.deliveryDays || 2),
        notes: body?.notes || 'Submitted',
        status: 'SUBMITTED',
        submittedAt: new Date().toISOString(),
      });
    }
    quote.status = 'QUOTES_RECEIVED';
    quote.negotiationHistory.push({
      id: `neg-${Date.now()}`,
      actor: vendor.businessName,
      role: 'VENDOR',
      message: body?.notes || `Submitted quote Rs ${body?.totalQuotedAmount}`,
      proposedTotal: Number(body?.totalQuotedAmount || 0),
      createdAt: new Date().toISOString(),
    });
    quote.updatedAt = new Date().toISOString();
    void companyAdminPersistenceService.upsert(CompanyQuotationModel, quote);

    return { success: true, data: quote };
  }

  @Post('quotations/:id/negotiate')
  addQuotationNegotiation(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Body() body?: { message: string; proposedTotal?: number }
  ) {
    const { admin, tenantId } = this.requireAdmin(authHeader, 'quotations:manage', headerTenantId);
    const quote = this.getTenantQuotationOrThrow(tenantId, id);
    if (!body?.message?.trim()) throw new BadRequestException('Negotiation message required.');

    quote.status = 'UNDER_NEGOTIATION';
    quote.negotiationHistory.push({
      id: `neg-${Date.now()}`,
      actor: admin.name,
      role: admin.role,
      message: body.message.trim(),
      proposedTotal: body.proposedTotal,
      createdAt: new Date().toISOString(),
    });
    quote.updatedAt = new Date().toISOString();
    void companyAdminPersistenceService.upsert(CompanyQuotationModel, quote);

    return { success: true, data: quote };
  }

  @Post('quotations/:id/approve')
  approveQuotation(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Body() body?: { vendorId?: string; finalAmount?: number },
    @Req() req?: any
  ) {
    const { admin, tenantId } = this.requireAdmin(authHeader, 'quotations:manage', headerTenantId);
    const quote = this.getTenantQuotationOrThrow(tenantId, id);

    const selectedQuote =
      quote.vendorQuotes.find((v) => v.vendorId === body?.vendorId) ||
      quote.vendorQuotes.find((v) => v.status === 'SUBMITTED');

    const finalAmount =
      body?.finalAmount ||
      selectedQuote?.totalQuotedAmount ||
      quote.items.reduce((s, it) => s + it.quantity * it.targetPrice, 0);

    for (const vq of quote.vendorQuotes) {
      vq.status =
        selectedQuote && vq.vendorId === selectedQuote.vendorId ? 'SELECTED' : 'DECLINED';
    }
    quote.selectedVendorId = selectedQuote?.vendorId || body?.vendorId || DEFAULT_VENDOR_ID;
    quote.finalApprovedAmount = finalAmount;
    quote.status = 'APPROVED';
    quote.updatedAt = new Date().toISOString();
    void companyAdminPersistenceService.upsert(CompanyQuotationModel, quote);

    companyAdminDataService.recordAuditLog({
      tenantId,
      actorId: admin.sub,
      actorName: admin.name,
      actorRole: admin.role,
      action: 'QUOTATION_APPROVED',
      module: 'Quotations',
      entityType: 'Quotation',
      entityId: quote.id,
      details: `Approved ${quote.quoteNumber} at Rs ${finalAmount}.`,
      ipAddress: req?.ip || '127.0.0.1',
    });

    return { success: true, data: quote };
  }

  @Post('quotations/:id/reject')
  rejectQuotation(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Body() body?: { reason: string }
  ) {
    const { tenantId } = this.requireAdmin(authHeader, 'quotations:manage', headerTenantId);
    const quote = this.getTenantQuotationOrThrow(tenantId, id);
    quote.status = 'REJECTED';
    quote.negotiationHistory.push({
      id: `neg-${Date.now()}`,
      actor: 'Company Admin',
      role: 'COMPANY_ADMIN',
      message: `Rejected: ${body?.reason || 'No agreement reached'}`,
      createdAt: new Date().toISOString(),
    });
    quote.updatedAt = new Date().toISOString();
    void companyAdminPersistenceService.upsert(CompanyQuotationModel, quote);
    return { success: true, data: quote };
  }

  @Post('quotations/:id/convert-to-order')
  convertQuotationToOrder(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Req() req?: any
  ) {
    const { admin, tenantId } = this.requireAdmin(authHeader, 'quotations:manage', headerTenantId);
    const quote = this.getTenantQuotationOrThrow(tenantId, id);
    if (quote.status === 'CONVERTED_TO_ORDER' && quote.convertedOrderId) {
      throw new BadRequestException(`Quotation already converted to order ${quote.convertedOrderId}.`);
    }

    const total =
      quote.finalApprovedAmount ||
      quote.items.reduce((s, it) => s + it.quantity * it.targetPrice, 0);
    const orderNumber = `ORD-BLK-${Math.floor(10000 + Math.random() * 90000)}`;
    const nowIso = new Date().toISOString();

    const newOrder: any = {
      id: `ord-${Date.now()}`,
      orderNumber,
      tenantId,
      vendorId: quote.selectedVendorId || DEFAULT_VENDOR_ID,
      customerId: quote.customerId,
      customerName: quote.customerName,
      customerPhone: quote.customerPhone,
      status: 'CONFIRMED',
      paymentStatus: 'PENDING',
      paymentMethod: 'COD',
      grandTotal: total,
      totalAmount: total,
      subtotal: total,
      gstTotal: 0,
      deliveryFee: 0,
      itemDiscount: 0,
      couponDiscount: 0,
      walletUsed: 0,
      isBusinessOrder: true,
      deliveryOption: 'SCHEDULED',
      estimatedDeliveryTime: '48 Hours',
      deliveryAddress: {
        id: 'addr-rfq',
        type: 'CONSTRUCTION_SITE',
        recipientName: quote.customerName,
        mobile: quote.customerPhone,
        building: quote.projectName,
        street: quote.siteAddress,
        area: quote.projectName,
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: quote.pincode,
        isDefault: false,
      },
      timeline: [
        {
          status: 'CONFIRMED',
          title: 'Bulk Order Confirmed',
          description: `Converted from ${quote.quoteNumber}`,
          timestamp: nowIso,
          completed: true,
        },
      ],
      sourceQuotationId: quote.id,
      items: quote.items.map((it) => ({
        productId: it.productId,
        sku: it.sku,
        name: it.name,
        slug: it.sku.toLowerCase(),
        brand: 'Buildora Bulk',
        image: '',
        unit: it.unit,
        unitPrice: it.targetPrice,
        quantity: it.quantity,
        gstAmount: 0,
        totalAmount: it.quantity * it.targetPrice,
      })),
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    if (tenantId === DEFAULT_TENANT_ID) {
      dbStore.orders.unshift(newOrder);
      vendorOrders.unshift({ ...newOrder });
    } else {
      companyAdminDataService.tenantOrders.unshift(newOrder);
    }

    quote.status = 'CONVERTED_TO_ORDER';
    quote.convertedOrderId = orderNumber;
    quote.updatedAt = nowIso;
    void companyAdminPersistenceService.upsert(CompanyQuotationModel, quote);

    companyAdminDataService.recordAuditLog({
      tenantId,
      actorId: admin.sub,
      actorName: admin.name,
      actorRole: admin.role,
      action: 'QUOTATION_CONVERTED_TO_ORDER',
      module: 'Quotations',
      entityType: 'Order',
      entityId: newOrder.id,
      details: `Converted ${quote.quoteNumber} into Order ${orderNumber} (Rs ${total}).`,
      ipAddress: req?.ip || '127.0.0.1',
    });

    return { success: true, data: { quotation: quote, order: newOrder } };
  }

  // ==================== 7. PRICING & PROMOTIONS ====================

  @Get('pricing-promotions')
  getPricingPromotions(
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string
  ) {
    const { tenantId } = this.requireAdmin(authHeader, 'pricing:read', headerTenantId);
    const products = companyAdminDataService.getTenantProducts(tenantId);
    const { coupons, promotions } = companyAdminDataService.getTenantPromotions(tenantId);
    return {
      success: true,
      data: {
        productsWithBulkPricing: products.filter(
          (p) => Array.isArray(p.bulkPricing) && p.bulkPricing.length > 0
        ),
        discountedProducts: products.filter((p) => p.mrp > p.sellingPrice),
        coupons,
        vendorPromotions: promotions,
      },
    };
  }

  @Post('coupons')
  createCoupon(
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Body()
    body?: {
      code: string;
      type?: 'PERCENTAGE' | 'FIXED';
      value: number;
      minOrderValue?: number;
      maxDiscount?: number;
      description?: string;
    },
    @Req() req?: any
  ) {
    const { admin, tenantId } = this.requireAdmin(authHeader, 'pricing:manage', headerTenantId);
    if (!body?.code?.trim() || typeof body?.value !== 'number') {
      throw new BadRequestException('Coupon code and numeric value are required.');
    }
    const coupon: any = {
      code: body.code.trim().toUpperCase(),
      title: `${body.code.trim().toUpperCase()} Offer`,
      discountType: body.type || 'PERCENTAGE',
      discountValue: body.value,
      minOrderValue: body.minOrderValue || 1000,
      ...(body.type === 'FIXED' ? {} : { maxDiscount: body.maxDiscount || 2000 }),
      description: body.description || `${body.value}% off via Company Admin campaign`,
      expiryDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
    };
    dbStore.coupons.push(coupon);
    companyAdminDataService.recordAuditLog({
      tenantId,
      actorId: admin.sub,
      actorName: admin.name,
      actorRole: admin.role,
      action: 'COUPON_CREATED',
      module: 'Pricing',
      entityType: 'Coupon',
      entityId: coupon.code,
      details: `Created storefront coupon ${coupon.code}.`,
      ipAddress: req?.ip || '127.0.0.1',
    });
    return { success: true, data: coupon };
  }

  @Patch('promotions/:id/status')
  updateVendorPromotionStatus(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Body() body?: { status: 'ACTIVE' | 'EXPIRED' }
  ) {
    this.requireAdmin(authHeader, 'pricing:manage', headerTenantId);
    const promo = vendorPromotions.find((p) => p.id === id);
    if (!promo) throw new NotFoundException('Promotion not found.');
    promo.status = body?.status || 'ACTIVE';
    return { success: true, data: promo };
  }

  // ==================== 8. WEBSITE CONTENT MANAGEMENT ====================

  @Get('content')
  listContent(
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Query('type') type?: string
  ) {
    const { tenantId } = this.requireAdmin(authHeader, 'content:read', headerTenantId);
    let list = Array.from(companyAdminDataService.contentItems.values()).filter(
      (c) => c.tenantId === tenantId
    );
    if (type && type !== 'ALL') {
      list = list.filter((c) => c.contentType === type);
    }
    return {
      success: true,
      data: list.sort((a, b) => a.position - b.position),
    };
  }

  @Post('content')
  createContent(
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Body() body?: Partial<CompanyContentRecord>,
    @Req() req?: any
  ) {
    const { admin, tenantId } = this.requireAdmin(authHeader, 'content:publish', headerTenantId);
    if (!body?.title?.trim() || !body?.contentType) {
      throw new BadRequestException('Content title and contentType are required.');
    }
    const nowIso = new Date().toISOString();
    const record: CompanyContentRecord = {
      id: `cnt-${Date.now()}`,
      tenantId,
      contentType: body.contentType,
      title: body.title.trim(),
      subtitle: body.subtitle || '',
      badge: body.badge || '',
      ctaLabel: body.ctaLabel || 'Explore',
      ctaUrl: body.ctaUrl || '/products',
      imageUrl: body.imageUrl || '',
      position: Number(body.position || 1),
      status: 'DRAFT',
      draftPayload: {
        headline: body.title.trim(),
        subheadline: body.subtitle || '',
        badge: body.badge || '',
        ctaLabel: body.ctaLabel || 'Explore',
        ctaUrl: body.ctaUrl || '/products',
      },
      updatedBy: admin.email,
      updatedAt: nowIso,
    };
    companyAdminDataService.contentItems.set(record.id, record);
    void companyAdminPersistenceService.upsert(CompanyContentModel, record);

    companyAdminDataService.recordAuditLog({
      tenantId,
      actorId: admin.sub,
      actorName: admin.name,
      actorRole: admin.role,
      action: 'CONTENT_DRAFT_CREATED',
      module: 'WebsiteContent',
      entityType: 'ContentItem',
      entityId: record.id,
      details: `Saved draft ${record.contentType}: ${record.title}.`,
      ipAddress: req?.ip || '127.0.0.1',
    });

    return { success: true, data: record };
  }

  @Patch('content/:id')
  updateContentDraft(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Body() body?: Partial<CompanyContentRecord>
  ) {
    const { admin, tenantId } = this.requireAdmin(authHeader, 'content:publish', headerTenantId);
    const item = companyAdminDataService.contentItems.get(id);
    if (!item || item.tenantId !== tenantId) throw new NotFoundException('Content item not found.');

    if (body?.title !== undefined) item.title = body.title;
    if (body?.subtitle !== undefined) item.subtitle = body.subtitle;
    if (body?.badge !== undefined) item.badge = body.badge;
    if (body?.ctaLabel !== undefined) item.ctaLabel = body.ctaLabel;
    if (body?.ctaUrl !== undefined) item.ctaUrl = body.ctaUrl;
    if (body?.imageUrl !== undefined) item.imageUrl = body.imageUrl;
    if (typeof body?.position === 'number') item.position = body.position;
    item.draftPayload = {
      ...(item.draftPayload || {}),
      headline: item.title,
      subheadline: item.subtitle,
      badge: item.badge,
      ctaLabel: item.ctaLabel,
      ctaUrl: item.ctaUrl,
    };
    item.updatedBy = admin.email;
    item.updatedAt = new Date().toISOString();
    void companyAdminPersistenceService.upsert(CompanyContentModel, item);

    return { success: true, data: item };
  }

  @Post('content/:id/publish')
  publishContent(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Req() req?: any
  ) {
    const { admin, tenantId } = this.requireAdmin(authHeader, 'content:publish', headerTenantId);
    const item = companyAdminDataService.contentItems.get(id);
    if (!item || item.tenantId !== tenantId) throw new NotFoundException('Content item not found.');

    const nowIso = new Date().toISOString();
    item.status = 'PUBLISHED';
    item.publishedPayload = { ...item.draftPayload };
    item.publishedAt = nowIso;
    item.updatedBy = admin.email;
    item.updatedAt = nowIso;
    void companyAdminPersistenceService.upsert(CompanyContentModel, item);

    companyAdminDataService.recordAuditLog({
      tenantId,
      actorId: admin.sub,
      actorName: admin.name,
      actorRole: admin.role,
      action: 'CONTENT_PUBLISHED',
      module: 'WebsiteContent',
      entityType: 'ContentItem',
      entityId: item.id,
      details: `Published ${item.contentType} "${item.title}" to Customer Website.`,
      ipAddress: req?.ip || '127.0.0.1',
    });

    return { success: true, data: item, message: 'Published to live Customer Storefront.' };
  }

  @Post('content/:id/unpublish')
  unpublishContent(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string
  ) {
    const { admin, tenantId } = this.requireAdmin(authHeader, 'content:publish', headerTenantId);
    const item = companyAdminDataService.contentItems.get(id);
    if (!item || item.tenantId !== tenantId) throw new NotFoundException('Content item not found.');
    item.status = 'UNPUBLISHED';
    item.updatedBy = admin.email;
    item.updatedAt = new Date().toISOString();
    void companyAdminPersistenceService.upsert(CompanyContentModel, item);
    return { success: true, data: item };
  }

  @Get('content/knowledge-hub')
  listKnowledgeHub(@Headers('authorization') authHeader?: string) {
    this.requireAdmin(authHeader, 'content:read');
    return { success: true, data: { articles: dbStore.knowledgeArticles, faqs: dbStore.faqs } };
  }

  @Post('content/knowledge-hub')
  createKnowledgeArticle(
    @Headers('authorization') authHeader?: string,
    @Body() body?: { title: string; category: string; readTimeMinutes?: number; summary: string }
  ) {
    this.requireAdmin(authHeader, 'content:publish');
    if (!body?.title || !body?.summary) {
      throw new BadRequestException('Title and summary are required.');
    }
    const art = {
      id: `kh-${Date.now()}`,
      slug: body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title: body.title,
      category: body.category || 'Construction Guide',
      readTimeMinutes: body.readTimeMinutes || 4,
      summary: body.summary,
      content: body.summary,
      author: 'Buildora Editorial',
      image: '',
      tags: [body.category || 'Guide'],
      publishedAt: new Date().toISOString().split('T')[0],
    };
    dbStore.knowledgeArticles.unshift(art);
    return { success: true, data: art };
  }

  // ==================== 9. CUSTOMERS ====================

  @Get('customers')
  listCustomers(
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Query('type') customerType?: string,
    @Query('search') search?: string
  ) {
    const { tenantId } = this.requireAdmin(authHeader, 'customers:read', headerTenantId);
    let list = Array.from(companyAdminDataService.customers.values()).filter(
      (c) => c.tenantId === tenantId
    );
    if (customerType && customerType !== 'ALL') {
      list = list.filter((c) => c.customerType === customerType);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.includes(q)
      );
    }
    return { success: true, data: list };
  }

  @Get('customers/:id')
  getCustomerDetail(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string
  ) {
    const { tenantId } = this.requireAdmin(authHeader, 'customers:read', headerTenantId);
    const customer = companyAdminDataService.customers.get(id);
    if (!customer) throw new NotFoundException('Customer not found.');
    if (customer.tenantId !== tenantId) {
      throw new ForbiddenException('Tenant isolation violation: Customer belongs to another company.');
    }
    const orders = companyAdminDataService
      .getTenantOrders(tenantId)
      .filter((o) => o.customerId === id || o.customerName === customer.name);
    return { success: true, data: { customer, orders } };
  }

  @Patch('customers/:id/status')
  toggleCustomerStatus(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Body() body?: { status: 'ACTIVE' | 'BLOCKED' },
    @Req() req?: any
  ) {
    const { admin, tenantId } = this.requireAdmin(authHeader, 'customers:manage', headerTenantId);
    const customer = companyAdminDataService.customers.get(id);
    if (!customer || customer.tenantId !== tenantId) {
      throw new NotFoundException('Customer not found in this company.');
    }
    customer.status = body?.status || 'ACTIVE';
    void companyAdminPersistenceService.upsert(CompanyCustomerModel, customer);

    companyAdminDataService.recordAuditLog({
      tenantId,
      actorId: admin.sub,
      actorName: admin.name,
      actorRole: admin.role,
      action: 'CUSTOMER_STATUS_UPDATED',
      module: 'Customers',
      entityType: 'Customer',
      entityId: customer.id,
      details: `Customer ${customer.name} set to ${customer.status}.`,
      ipAddress: req?.ip || '127.0.0.1',
    });

    return { success: true, data: customer };
  }

  // ==================== 10. DELIVERY & LOGISTICS ====================

  @Get('delivery/overview')
  getDeliveryOverview(
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string
  ) {
    const { tenantId } = this.requireAdmin(authHeader, 'delivery:read', headerTenantId);
    const partners = Array.from(companyAdminDataService.deliveryPartners.values()).filter(
      (p) => p.tenantId === tenantId
    );
    const orders = companyAdminDataService.getTenantOrders(tenantId);
    const dispatches = Array.from(companyAdminDataService.dispatchAssignments.values()).filter(
      (d) => d.tenantId === tenantId
    );

    return {
      success: true,
      data: {
        partners,
        dispatches,
        readyForDispatchOrders: orders.filter((o) =>
          [
            'CONFIRMED',
            'ACCEPTED',
            'PROCESSING',
            'READY_FOR_DISPATCH',
            'ORDER_PLACED',
          ].includes(String(o.status).toUpperCase())
        ),
        pincodes:
          tenantId === DEFAULT_TENANT_ID
            ? Array.isArray(dbStore.pincodes)
              ? dbStore.pincodes
              : Object.entries(dbStore.pincodes || {}).map(([code, info]: any) => ({
                  pincode: code,
                  ...(typeof info === 'object' && info !== null ? info : { info }),
                }))
            : [],
      },
    };
  }

  @Post('delivery/partners')
  createDeliveryPartner(
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Body() body?: any
  ) {
    const { tenantId } = this.requireAdmin(authHeader, 'delivery:manage', headerTenantId);
    if (!body?.name || !body?.phone) {
      throw new BadRequestException('Partner name and phone are required.');
    }
    const partner = {
      id: `dp-${Date.now()}`,
      tenantId,
      name: body.name,
      code: (body.code || body.name.slice(0, 6)).toUpperCase(),
      contactPerson: body.contactPerson || 'Dispatch Desk',
      phone: body.phone,
      vehicleTypes: body.vehicleTypes || ['Tata Ace'],
      servicePincodes: body.servicePincodes || ['560034'],
      activeDeliveries: 0,
      completedDeliveries: 0,
      onTimeRate: 100,
      status: 'ACTIVE' as const,
      baseCharge: Number(body.baseCharge || 199),
      perKmCharge: Number(body.perKmCharge || 18),
      createdAt: new Date().toISOString(),
    };
    companyAdminDataService.deliveryPartners.set(partner.id, partner);
    void companyAdminPersistenceService.upsert(CompanyDeliveryPartnerModel, partner);
    return { success: true, data: partner };
  }

  @Post('delivery/assign')
  assignDelivery(
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Body()
    body?: {
      orderId: string;
      partnerId: string;
      vehicleNumber: string;
      driverName: string;
      driverPhone: string;
      eta?: string;
    },
    @Req() req?: any
  ) {
    const { tenantId } = this.requireAdmin(authHeader, 'delivery:manage', headerTenantId);
    if (!body?.orderId || !body?.partnerId) {
      throw new BadRequestException('orderId and partnerId are required.');
    }
    const partner = companyAdminDataService.deliveryPartners.get(body.partnerId);
    if (!partner || partner.tenantId !== tenantId) {
      throw new NotFoundException('Delivery partner not found in company.');
    }
    const order = companyAdminDataService
      .getTenantOrders(tenantId)
      .find((o) => o.id === body.orderId || o.orderNumber === body.orderId);
    if (!order) throw new NotFoundException('Order not found.');

    const nowIso = new Date().toISOString();
    const assignment = {
      orderId: order.id,
      tenantId,
      partnerId: partner.id,
      partnerName: partner.name,
      vehicleNumber: body.vehicleNumber || 'KA-01-BLD-6060',
      driverName: body.driverName || partner.contactPerson,
      driverPhone: body.driverPhone || partner.phone,
      status: 'ASSIGNED' as const,
      assignedAt: nowIso,
      updatedAt: nowIso,
      eta: body.eta || 'Within 60 mins',
    };
    companyAdminDataService.dispatchAssignments.set(order.id, assignment);
    partner.activeDeliveries += 1;

    this.updateOrderStatus(order.id, authHeader, headerTenantId, { status: 'DISPATCHED' }, req);

    return { success: true, data: assignment };
  }

  @Patch('delivery/assignments/:orderId/status')
  updateDeliveryStatus(
    @Param('orderId') orderId: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Body() body?: { status: 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED' },
    @Req() req?: any
  ) {
    const { admin, tenantId } = this.requireAdmin(authHeader, 'delivery:manage', headerTenantId);
    const assignment = companyAdminDataService.dispatchAssignments.get(orderId);
    if (!assignment || assignment.tenantId !== tenantId) {
      throw new NotFoundException('Dispatch assignment not found.');
    }
    assignment.status = body?.status || 'IN_TRANSIT';
    assignment.updatedAt = new Date().toISOString();

    if (assignment.status === 'DELIVERED') {
      this.updateOrderStatus(orderId, authHeader, headerTenantId, { status: 'DELIVERED' }, req);
    }

    companyAdminDataService.recordAuditLog({
      tenantId,
      actorId: admin.sub,
      actorName: admin.name,
      actorRole: admin.role,
      action: 'DELIVERY_STATUS_UPDATED',
      module: 'Delivery',
      entityType: 'Dispatch',
      entityId: orderId,
      details: `Delivery updated to ${assignment.status}.`,
      ipAddress: req?.ip || '127.0.0.1',
    });

    return { success: true, data: assignment };
  }

  // ==================== 11. PAYMENTS, SETTLEMENTS & FINANCE ====================

  @Get('finance/overview')
  getFinanceOverview(
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string
  ) {
    const { tenantId } = this.requireAdmin(authHeader, 'finance:read', headerTenantId);
    const orders = companyAdminDataService.getTenantOrders(tenantId);
    const settlements = companyAdminDataService.getTenantSettlements(tenantId);
    const invoices = companyAdminDataService.getTenantInvoices(tenantId);
    const tenant = companyAdminDataService.tenants.get(tenantId);

    const grossSales = orders
      .filter((o) => o.status !== 'CANCELLED')
      .reduce((s, o) => s + Number(o.totalAmount || 0), 0);
    const paidSettlements = settlements.filter((s) => s.status === 'PAID');
    const pendingSettlements = settlements.filter((s) => s.status !== 'PAID');
    const totalSettled = paidSettlements.reduce((s, x) => s + Number(x.netAmount || 0), 0);
    const totalPendingPayout = pendingSettlements.reduce((s, x) => s + Number(x.netAmount || 0), 0);
    const commissionRate = tenant?.paymentConfig?.platformCommissionPercent ?? 6;
    const totalCommission = Math.round((grossSales * commissionRate) / 100);
    const gstCollected = Math.round(grossSales * 0.18);

    return {
      success: true,
      data: {
        summary: {
          grossSales,
          totalCommission,
          gstCollected,
          totalSettled,
          totalPendingPayout,
          pendingSettlementCount: pendingSettlements.length,
        },
        settlements,
        invoices,
        transactions: orders.slice(0, 25).map((o) => ({
          id: `txn-${o.id}`,
          orderNumber: o.orderNumber || o.id,
          customerName: o.customerName,
          amount: o.totalAmount,
          method: o.paymentMethod || 'RAZORPAY',
          paymentStatus: o.paymentStatus || 'PAID',
          date: o.createdAt,
        })),
      },
    };
  }

  @Post('finance/settlements/generate')
  generateSettlementBatch(
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Body() body?: { vendorId: string },
    @Req() req?: any
  ) {
    const { admin, tenantId } = this.requireAdmin(authHeader, 'finance:settle', headerTenantId);
    const rawVendor = vendorRecords.get(body?.vendorId || '');
    if (!rawVendor || (rawVendor.tenantId || DEFAULT_TENANT_ID) !== tenantId) {
      throw new NotFoundException('Vendor not found in your company.');
    }
    const vendor = companyAdminDataService.normalizeVendor(rawVendor);

    const orders = companyAdminDataService
      .getTenantOrders(tenantId)
      .filter((o) => o.vendorId === vendor.id && o.status === 'DELIVERED');
    const gross = orders.reduce((s, o) => s + Number(o.totalAmount || 0), 0) || 48500;
    const commissionRate = vendor.commissionRate || 6;
    const commission = Math.round((gross * commissionRate) / 100);
    const tdsAmount = Math.round(gross * 0.01);
    const netAmount = gross - commission - tdsAmount;

    const batch: any = {
      id: `stl-${Date.now()}`,
      settlementNumber: `STL-${Math.floor(10000 + Math.random() * 90000)}`,
      vendorId: vendor.id,
      period: 'Admin Weekly Settlement',
      periodStart: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
      periodEnd: new Date().toISOString().split('T')[0],
      grossAmount: gross,
      grossRevenue: gross,
      commissionAmount: commission,
      platformCommission: commission,
      tdsAmount,
      taxDeductions: tdsAmount,
      netAmount,
      netPayable: netAmount,
      ordersCount: orders.length || 1,
      orderCount: orders.length || 1,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    vendorSettlements.unshift(batch);
    void platformPersistenceService.upsert(PlatformSettlementModel, batch);
    realtimeBus.emitVendorAndAdmin(vendor.id, 'settlement.status.updated', { settlement: batch }, tenantId);

    companyAdminDataService.recordAuditLog({
      tenantId,
      actorId: admin.sub,
      actorName: admin.name,
      actorRole: admin.role,
      action: 'SETTLEMENT_GENERATED',
      module: 'Finance',
      entityType: 'Settlement',
      entityId: batch.id,
      details: `Generated settlement ${batch.settlementNumber} (Net Rs ${batch.netAmount}) for ${vendor.businessName}.`,
      ipAddress: req?.ip || '127.0.0.1',
    });

    return { success: true, data: batch };
  }

  @Patch('finance/settlements/:id/mark-paid')
  markSettlementPaid(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Body()
    body?: {
      paymentReference?: string;
      paymentMode?: 'NEFT' | 'IMPS' | 'RTGS' | 'RAZORPAYX';
      remarks?: string;
    },
    @Req() req?: any
  ) {
    const { admin, tenantId } = this.requireAdmin(authHeader, 'finance:settle', headerTenantId);
    const tenantVendorIds = new Set(
      companyAdminDataService.getTenantVendors(tenantId).map((v) => v.id)
    );
    const settlement = vendorSettlements.find((s) => s.id === id) as any;
    if (!settlement || !tenantVendorIds.has(settlement.vendorId)) {
      throw new NotFoundException('Settlement not found in your company.');
    }
    if (settlement.status === 'PAID') {
      throw new BadRequestException('Settlement is already marked PAID.');
    }

    const utr = (body?.paymentReference || '').trim();
    if (utr.length < 6) {
      throw new BadRequestException(
        'Verified bank UTR / payout reference number (min 6 characters) is strictly required before completing settlement.'
      );
    }

    settlement.status = 'PAID';
    settlement.utrNumber = utr;
    settlement.paymentReference = utr;
    settlement.paymentMode = body?.paymentMode || 'NEFT';
    settlement.paidAt = new Date().toISOString();
    settlement.settledBy = admin.email;
    settlement.remarks = body?.remarks || 'Settled via Company Admin Finance Desk';
    if (settlement.netAmount === undefined) settlement.netAmount = settlement.netPayable ?? 0;
    if (settlement.netPayable === undefined) settlement.netPayable = settlement.netAmount ?? 0;
    void platformPersistenceService.upsert(PlatformSettlementModel, settlement);

    vendorNotifications.unshift({
      id: `vnotif-${Date.now()}`,
      vendorId: settlement.vendorId,
      title: 'Settlement Paid',
      message: `Rs ${settlement.netAmount} credited via ${settlement.paymentMode} (UTR: ${utr}).`,
      type: 'SETTLEMENT',
      read: false,
      createdAt: new Date().toISOString(),
    } as any);

    void platformNotificationService.dispatch({
      tenantId,
      recipientRole: 'VENDOR',
      recipientId: settlement.vendorId,
      type: 'SETTLEMENT',
      title: `Settlement Paid: ${settlement.settlementNumber || settlement.id}`,
      message: `₹${Number(settlement.netAmount || 0).toLocaleString()} credited via ${settlement.paymentMode} (UTR: ${utr}).`,
      severity: 'SUCCESS',
      actionUrl: '/payments',
      metadata: { settlementId: settlement.id, utrNumber: utr },
    });
    realtimeBus.emitVendorAndAdmin(
      settlement.vendorId,
      'settlement.status.updated',
      { settlement },
      tenantId
    );

    companyAdminDataService.recordAuditLog({
      tenantId,
      actorId: admin.sub,
      actorName: admin.name,
      actorRole: admin.role,
      action: 'SETTLEMENT_PAID',
      module: 'Finance',
      entityType: 'Settlement',
      entityId: settlement.id,
      details: `Marked settlement ${settlement.settlementNumber || settlement.id} PAID (Rs ${settlement.netAmount}, UTR: ${utr}).`,
      ipAddress: req?.ip || '127.0.0.1',
    });

    return { success: true, data: settlement };
  }

  // ==================== 12. EMPLOYEES, ROLES & TEAM ====================

  @Get('team')
  listTeam(
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string
  ) {
    const { tenantId } = this.requireAdmin(authHeader, 'team:read', headerTenantId);
    const members = Array.from(companyAdminDataService.adminUsers.values())
      .filter((u) => u.tenantId === tenantId)
      .map(({ passwordHash, ...safe }) => safe);
    return {
      success: true,
      data: {
        members,
        roles: Object.keys(COMPANY_ADMIN_PERMISSION_MATRIX),
        permissionMatrix: COMPANY_ADMIN_PERMISSION_MATRIX,
      },
    };
  }

  @Post('team')
  inviteEmployee(
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Body()
    body?: {
      name: string;
      email: string;
      phone?: string;
      role: CompanyAdminRole;
      department?: string;
      password?: string;
    },
    @Req() req?: any
  ) {
    const { admin, tenantId } = this.requireAdmin(authHeader, 'team:manage', headerTenantId);
    if (!body?.name?.trim() || !body?.email?.trim() || !body?.role) {
      throw new BadRequestException('Name, email and role are required.');
    }
    const cleanEmail = body.email.trim().toLowerCase();
    const exists = Array.from(companyAdminDataService.adminUsers.values()).some(
      (u) => u.email.toLowerCase() === cleanEmail
    );
    if (exists) {
      throw new BadRequestException('An admin user with this email already exists.');
    }

    const rolePerms = COMPANY_ADMIN_PERMISSION_MATRIX[body.role];
    if (!rolePerms) throw new BadRequestException('Invalid Company Admin role.');

    const record = {
      id: `ca-usr-${Date.now()}`,
      tenantId,
      name: body.name.trim(),
      email: cleanEmail,
      phone: body.phone || '+91 98450 00000',
      role: body.role,
      permissions: [...rolePerms],
      passwordHash: companyAdminSecurityService.hashPassword(body.password || 'Buildora@123'),
      status: 'ACTIVE' as const,
      department: body.department || 'Operations',
      createdAt: new Date().toISOString(),
    };

    companyAdminDataService.adminUsers.set(record.id, record);
    void companyAdminPersistenceService.upsert(CompanyAdminUserModel, record);

    companyAdminDataService.recordAuditLog({
      tenantId,
      actorId: admin.sub,
      actorName: admin.name,
      actorRole: admin.role,
      action: 'TEAM_MEMBER_ADDED',
      module: 'Team',
      entityType: 'CompanyAdminUser',
      entityId: record.id,
      details: `Invited ${record.email} as ${record.role}.`,
      ipAddress: req?.ip || '127.0.0.1',
    });

    const { passwordHash, ...safe } = record;
    return { success: true, data: safe };
  }

  @Patch('team/:id')
  updateEmployee(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Body()
    body?: { role?: CompanyAdminRole; status?: 'ACTIVE' | 'SUSPENDED'; permissions?: string[] },
    @Req() req?: any
  ) {
    const { admin, tenantId } = this.requireAdmin(authHeader, 'team:manage', headerTenantId);
    const user = companyAdminDataService.adminUsers.get(id);
    if (!user || user.tenantId !== tenantId) {
      throw new NotFoundException('Team member not found in this company.');
    }

    if (body?.role && COMPANY_ADMIN_PERMISSION_MATRIX[body.role]) {
      user.role = body.role;
      user.permissions = [...COMPANY_ADMIN_PERMISSION_MATRIX[body.role]];
    }
    if (body?.permissions) user.permissions = body.permissions;
    if (body?.status) user.status = body.status;
    void companyAdminPersistenceService.upsert(CompanyAdminUserModel, user);

    companyAdminDataService.recordAuditLog({
      tenantId,
      actorId: admin.sub,
      actorName: admin.name,
      actorRole: admin.role,
      action: 'TEAM_MEMBER_UPDATED',
      module: 'Team',
      entityType: 'CompanyAdminUser',
      entityId: user.id,
      details: `Updated ${user.email} -> role=${user.role}, status=${user.status}.`,
      ipAddress: req?.ip || '127.0.0.1',
    });

    const { passwordHash, ...safe } = user;
    return { success: true, data: safe };
  }

  // ==================== 13. REPORTS & ANALYTICS ====================

  @Get('reports')
  getReports(
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Query('type') reportType = 'sales'
  ) {
    const { tenantId } = this.requireAdmin(authHeader, 'reports:read', headerTenantId);
    const vendors = companyAdminDataService.getTenantVendors(tenantId);
    const products = companyAdminDataService.getTenantProducts(tenantId);
    const orders = companyAdminDataService.getTenantOrders(tenantId);
    const settlements = companyAdminDataService.getTenantSettlements(tenantId);
    const customers = Array.from(companyAdminDataService.customers.values()).filter(
      (c) => c.tenantId === tenantId
    );
    const partners = Array.from(companyAdminDataService.deliveryPartners.values()).filter(
      (p) => p.tenantId === tenantId
    );

    const salesByCategory = dbStore.categories.map((cat) => {
      const catProds = products.filter(
        (p) => p.categoryId === cat.id || p.categoryName === cat.name
      );
      return {
        category: cat.name,
        skuCount: catProds.length,
        stockValue: catProds.reduce(
          (s, p) => s + Number(p.stock || 0) * Number(p.sellingPrice || 0),
          0
        ),
      };
    });

    return {
      success: true,
      data: {
        reportType,
        generatedAt: new Date().toISOString(),
        salesSummary: {
          totalGross: orders.reduce((s, o) => s + Number(o.totalAmount || 0), 0),
          averageOrderValue: orders.length
            ? Math.round(
                orders.reduce((s, o) => s + Number(o.totalAmount || 0), 0) / orders.length
              )
            : 0,
          salesByCategory,
        },
        vendorPerformance: vendors.map((v) => ({
          id: v.id,
          businessName: v.businessName,
          approvalStatus: v.approvalStatus,
          fulfillmentRate: v.fulfillmentRate,
          onTimeDispatchRate: v.onTimeDispatchRate,
          skuCount: products.filter((p) => p.vendorId === v.id).length,
        })),
        inventorySummary: {
          totalSkus: products.length,
          totalStockValue: products.reduce(
            (s, p) => s + Number(p.stock || 0) * Number(p.sellingPrice || 0),
            0
          ),
          lowStockCount: products.filter(
            (p) => p.stock > 0 && p.stock <= (p.lowStockThreshold || 25)
          ).length,
          outOfStockCount: products.filter((p) => p.stock <= 0).length,
        },
        customerInsights: customers,
        deliveryMetrics: partners,
        financialSummary: {
          paidSettlements: settlements
            .filter((s) => s.status === 'PAID')
            .reduce((a, s) => a + Number(s.netAmount || 0), 0),
          pendingSettlements: settlements
            .filter((s) => s.status !== 'PAID')
            .reduce((a, s) => a + Number(s.netAmount || 0), 0),
        },
      },
    };
  }

  // ==================== 14. NOTIFICATIONS & SUPPORT ====================

  @Get('support-notifications')
  getSupportNotifications(
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string
  ) {
    const { tenantId } = this.requireAdmin(authHeader, 'dashboard:read', headerTenantId);
    return {
      success: true,
      data: {
        alerts: companyAdminDataService.notificationAlerts.filter((a) => a.tenantId === tenantId),
        tickets: companyAdminDataService.getTenantSupportTickets(tenantId),
        templates: companyAdminDataService.notificationTemplates.filter(
          (t) => t.tenantId === tenantId
        ),
      },
    };
  }

  @Patch('alerts/:id/read')
  markAlertRead(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string
  ) {
    const { tenantId } = this.requireAdmin(authHeader, 'dashboard:read', headerTenantId);
    const alert = companyAdminDataService.notificationAlerts.find(
      (a) => a.id === id && a.tenantId === tenantId
    );
    if (alert) alert.isRead = true;
    return { success: true, data: alert };
  }

  @Post('alerts/read-all')
  markAllAlertsRead(
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string
  ) {
    const { tenantId } = this.requireAdmin(authHeader, 'dashboard:read', headerTenantId);
    for (const a of companyAdminDataService.notificationAlerts) {
      if (a.tenantId === tenantId) a.isRead = true;
    }
    return { success: true };
  }

  @Patch('tickets/:id')
  updateTicket(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Body() body?: { status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'; resolutionNote?: string },
    @Req() req?: any
  ) {
    const { admin, tenantId } = this.requireAdmin(authHeader, 'support:manage', headerTenantId);
    const custTicket = dbStore.tickets.find((t) => t.id === id) as any;
    const vndTicket = vendorSupportTickets.find((t) => t.id === id) as any;
    const ticket = custTicket || vndTicket;
    if (!ticket) throw new NotFoundException('Support ticket not found.');

    ticket.status = body?.status || 'IN_PROGRESS';
    ticket.resolutionNote = body?.resolutionNote || '';
    ticket.updatedAt = new Date().toISOString();
    void platformPersistenceService.upsert(PlatformSupportTicketModel, ticket);

    if (vndTicket) {
      void platformNotificationService.dispatch({
        tenantId,
        recipientRole: 'VENDOR',
        recipientId: vndTicket.vendorId,
        type: 'SUPPORT',
        title: `Ticket ${ticket.ticketNumber || ticket.id}: ${ticket.status}`,
        message: ticket.resolutionNote || `Support ticket updated to ${ticket.status}.`,
        severity: 'INFO',
        actionUrl: '/support',
      });
    } else if (custTicket?.customerId) {
      void platformNotificationService.dispatch({
        tenantId,
        recipientRole: 'CUSTOMER',
        recipientId: custTicket.customerId,
        type: 'SUPPORT',
        title: `Support Ticket ${ticket.ticketNumber}: ${ticket.status}`,
        message: ticket.resolutionNote || `Your ticket was updated to ${ticket.status}.`,
        severity: 'INFO',
        actionUrl: '/support',
      });
    }

    companyAdminDataService.recordAuditLog({
      tenantId,
      actorId: admin.sub,
      actorName: admin.name,
      actorRole: admin.role,
      action: 'SUPPORT_TICKET_UPDATED',
      module: 'Support',
      entityType: 'Ticket',
      entityId: ticket.id,
      details: `Ticket ${ticket.id} marked ${ticket.status}.`,
      ipAddress: req?.ip || '127.0.0.1',
    });

    return { success: true, data: ticket };
  }

  @Put('templates/:id')
  updateNotificationTemplate(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Body() body?: { subject?: string; body?: string; isActive?: boolean }
  ) {
    const { tenantId } = this.requireAdmin(authHeader, 'support:manage', headerTenantId);
    const tpl = companyAdminDataService.notificationTemplates.find(
      (t) => t.id === id && t.tenantId === tenantId
    );
    if (!tpl) throw new NotFoundException('Template not found.');
    if (body?.subject !== undefined) tpl.subject = body.subject;
    if (body?.body !== undefined) tpl.body = body.body;
    if (body?.isActive !== undefined) tpl.isActive = body.isActive;
    tpl.updatedAt = new Date().toISOString();
    return { success: true, data: tpl };
  }

  // ==================== 15. COMPANY SETTINGS ====================

  @Get('settings')
  getSettings(
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string
  ) {
    const { tenantId } = this.requireAdmin(authHeader, 'settings:read', headerTenantId);
    return {
      success: true,
      data: companyAdminDataService.tenants.get(tenantId),
    };
  }

  @Put('settings')
  updateSettings(
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string,
    @Body() body?: Record<string, any>,
    @Req() req?: any
  ) {
    const { admin, tenantId } = this.requireAdmin(authHeader, 'settings:manage', headerTenantId);
    const tenant = companyAdminDataService.tenants.get(tenantId);
    if (!tenant) throw new NotFoundException('Tenant settings not found.');

    const updated = {
      ...tenant,
      ...body,
      id: tenantId,
      bankDetails: { ...tenant.bankDetails, ...(body?.bankDetails || {}) },
      paymentConfig: { ...tenant.paymentConfig, ...(body?.paymentConfig || {}) },
      deliveryConfig: { ...tenant.deliveryConfig, ...(body?.deliveryConfig || {}) },
      taxConfig: { ...tenant.taxConfig, ...(body?.taxConfig || {}) },
      notificationPrefs: { ...tenant.notificationPrefs, ...(body?.notificationPrefs || {}) },
      securitySettings: { ...tenant.securitySettings, ...(body?.securitySettings || {}) },
      updatedAt: new Date().toISOString(),
    };
    companyAdminDataService.tenants.set(tenantId, updated);
    void companyAdminPersistenceService.upsert(CompanyTenantModel, updated);

    companyAdminDataService.recordAuditLog({
      tenantId,
      actorId: admin.sub,
      actorName: admin.name,
      actorRole: admin.role,
      action: 'COMPANY_SETTINGS_UPDATED',
      module: 'Settings',
      entityType: 'CompanyTenant',
      entityId: tenantId,
      details: 'Updated company profile, tax, payment, or delivery settings.',
      ipAddress: req?.ip || '127.0.0.1',
    });

    return { success: true, data: updated };
  }
}
