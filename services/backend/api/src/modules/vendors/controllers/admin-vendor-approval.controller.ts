import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Headers,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException
} from '@nestjs/common';
import {
  vendorRecords,
  vendorProducts,
  syncVendorProductToCustomerCatalog,
  BackendVendorRecord
} from './vendor.controller';
import { vendorSecurityService } from '../services/vendor-security.service';
import { vendorNotificationService } from '../services/vendor-notification.service';
import { vendorPersistenceService } from '../services/vendor-persistence.service';
import { realtimeBus } from '../../realtime/realtime-bus';
import { platformNotificationService } from '../../notifications/platform-notification.service';

const DEV_ADMIN_KEY = process.env.ADMIN_APPROVAL_KEY || 'buildora-dev-admin-2026';

@Controller('api/v1/admin/vendors')
export class AdminVendorApprovalController {
  /**
   * Server-side authorization guard for Admin Approval endpoints.
   * - Blocks dev mock key in production.
   * - Explicitly rejects vendor tokens so vendors can NEVER self-approve.
   */
  private authorizeAdmin(headers: Record<string, string | undefined>): { adminId: string } {
    const authHeader = headers['authorization'] || headers['Authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      try {
        const decoded = vendorSecurityService.verifyToken(token);
        if (decoded?.vendorId) {
          throw new ForbiddenException(
            'Security violation: Vendor accounts are not authorized to perform administrative approval actions.'
          );
        }
      } catch (err: any) {
        if (err instanceof ForbiddenException) throw err;
      }
    }

    if (process.env.NODE_ENV === 'production' && !process.env.ADMIN_APPROVAL_KEY) {
      throw new ForbiddenException('Development admin approval module is disabled in production.');
    }

    const adminKey = headers['x-admin-key'];
    const adminId = headers['x-admin-id'] || 'admin-compliance-01';
    if (!adminKey || adminKey !== DEV_ADMIN_KEY) {
      throw new UnauthorizedException('Valid administrative authorization key is required.');
    }

    return { adminId };
  }

  private findTargetVendor(idOrAppId: string): BackendVendorRecord {
    for (const v of vendorRecords.values()) {
      if (v.id === idOrAppId || v.applicationId === idOrAppId) {
        return v;
      }
    }
    throw new NotFoundException(`Vendor application "${idOrAppId}" not found.`);
  }

  private sanitizeApplicationSummary(v: BackendVendorRecord) {
    const reg = v.registrationData;
    const rawPan = reg?.pan || v.businessInfo?.pan || '';
    const maskedPan =
      rawPan.length >= 6 ? `${rawPan.slice(0, 5)}••••${rawPan.slice(-1)}` : rawPan ? '••••••••••' : 'Not Provided';
    const rawBank = reg?.bankDetails?.accountNumber || v.businessInfo?.bankDetails?.accountNumber || '';
    const maskedBankAccount = rawBank.length >= 4 ? `••••••••${rawBank.slice(-4)}` : 'Not Provided';

    return {
      id: v.id,
      applicationId: v.applicationId || `DRAFT-${v.id.slice(-6)}`,
      status: v.status,
      storeName: v.storeName || reg?.storeName || 'Unnamed Store',
      legalBusinessName: v.businessInfo?.businessName || reg?.legalBusinessName || 'N/A',
      ownerName: v.name || reg?.ownerName || 'N/A',
      email: v.email,
      phone: v.phone,
      logoUrl: v.logoUrl || v.businessInfo?.logo || null,
      logoMetadata: v.logoMetadata || v.businessInfo?.logoMetadata || null,
      businessType: v.businessInfo?.businessType || reg?.businessType || 'N/A',
      submittedAt: v.submittedAt || v.createdAt,
      updatedAt: v.updatedAt,
      approvedBy: v.approvedBy,
      approvedAt: v.approvedAt,
      rejectedBy: v.rejectedBy,
      rejectedAt: v.rejectedAt,
      rejectionReason: v.rejectionReason,
      resubmissionReason: v.resubmissionReason,
      suspendedReason: v.suspendedReason,
      suspendedAt: v.suspendedAt,
      address: {
        pincode: reg?.pincode || v.businessInfo?.address?.pincode || '',
        country: reg?.country || v.businessInfo?.address?.country || 'India',
        state: reg?.state || v.businessInfo?.address?.state || '',
        city: reg?.city || v.businessInfo?.address?.city || '',
        area: reg?.area || v.businessInfo?.address?.area || '',
        completeAddress: reg?.completeAddress || v.businessInfo?.address?.building || ''
      },
      kyc: {
        gstin: reg?.gstin || v.businessInfo?.gstin || 'Not Provided',
        pan: maskedPan,
        documents: v.kycDocuments || reg?.documents || []
      },
      bankDetails: {
        accountHolderName: reg?.bankDetails?.accountHolderName || v.businessInfo?.bankDetails?.accountHolderName || '',
        bankName: reg?.bankDetails?.bankName || v.businessInfo?.bankDetails?.bankName || '',
        accountNumber: maskedBankAccount,
        ifsc: reg?.bankDetails?.ifsc || v.businessInfo?.bankDetails?.ifsc || '',
        accountType: reg?.bankDetails?.accountType || 'CURRENT'
      },
      auditLogs: v.auditLogs || []
    };
  }

  @Get('applications')
  listApplications(
    @Headers() headers: Record<string, string | undefined>,
    @Query('search') search?: string,
    @Query('status') status?: string
  ) {
    this.authorizeAdmin(headers);

    let list = Array.from(vendorRecords.values()).filter((v) => v.status !== 'DRAFT');

    if (status && status !== 'ALL') {
      list = list.filter((v) => v.status === status);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (v) =>
          (v.storeName || '').toLowerCase().includes(q) ||
          (v.businessInfo?.businessName || '').toLowerCase().includes(q) ||
          (v.email || '').toLowerCase().includes(q) ||
          (v.applicationId || '').toLowerCase().includes(q) ||
          (v.name || '').toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());

    return {
      success: true,
      count: list.length,
      applications: list.map((v) => this.sanitizeApplicationSummary(v))
    };
  }

  @Get('applications/:id')
  getApplication(
    @Param('id') id: string,
    @Headers() headers: Record<string, string | undefined>
  ) {
    this.authorizeAdmin(headers);
    const vendor = this.findTargetVendor(id);
    return {
      success: true,
      application: this.sanitizeApplicationSummary(vendor)
    };
  }

  @Post('applications/:id/under-review')
  markUnderReview(
    @Param('id') id: string,
    @Headers() headers: Record<string, string | undefined>
  ) {
    const { adminId } = this.authorizeAdmin(headers);
    const vendor = this.findTargetVendor(id);
    const oldStatus = vendor.status;

    vendor.status = 'UNDER_REVIEW';
    vendor.updatedAt = new Date().toISOString();
    if (!vendor.auditLogs) vendor.auditLogs = [];
    vendor.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      action: 'APPLICATION_UNDER_REVIEW',
      performedBy: adminId,
      performedAt: new Date().toISOString(),
      details: 'Application opened and marked Under Review by compliance team.',
      oldStatus,
      newStatus: 'UNDER_REVIEW'
    });

    void vendorPersistenceService.saveVendorRecord(vendor);

    return {
      success: true,
      message: 'Application marked as Under Review.',
      application: this.sanitizeApplicationSummary(vendor)
    };
  }

  @Post('applications/:id/approve')
  approveApplication(
    @Param('id') id: string,
    @Headers() headers: Record<string, string | undefined>,
    @Body() body?: { notes?: string }
  ) {
    const { adminId } = this.authorizeAdmin(headers);
    const vendor = this.findTargetVendor(id);
    if (vendor.status === 'DRAFT') {
      throw new BadRequestException('Cannot approve an unsubmitted draft application.');
    }

    const oldStatus = vendor.status;
    const now = new Date().toISOString();
    vendor.status = 'APPROVED';
    vendor.approvedBy = adminId;
    vendor.approvedAt = now;
    vendor.rejectionReason = undefined;
    vendor.resubmissionReason = undefined;
    vendor.suspendedReason = undefined;
    vendor.updatedAt = now;

    if (!vendor.auditLogs) vendor.auditLogs = [];
    vendor.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      action: 'VENDOR_APPROVED',
      performedBy: adminId,
      performedAt: now,
      details: body?.notes ? `Vendor approved. Notes: ${body.notes}` : 'Vendor KYC and business details verified and approved.',
      oldStatus,
      newStatus: 'APPROVED'
    });

    void vendorPersistenceService.saveVendorRecord(vendor);

    vendorNotificationService.notify(
      vendor.id,
      'APPLICATION_APPROVED',
      'Vendor Account Approved!',
      `Congratulations ${vendor.storeName || vendor.name}! Your BUILDORA 60 supplier account has been approved. You can now access your Vendor Dashboard.`,
      '/dashboard',
      { email: vendor.email, phone: vendor.phone }
    );

    return {
      success: true,
      message: `Vendor ${vendor.storeName || vendor.name} approved successfully.`,
      application: this.sanitizeApplicationSummary(vendor)
    };
  }

  @Post('applications/:id/reject')
  rejectApplication(
    @Param('id') id: string,
    @Headers() headers: Record<string, string | undefined>,
    @Body() body: { reason: string }
  ) {
    const { adminId } = this.authorizeAdmin(headers);
    if (!body?.reason || body.reason.trim().length < 5) {
      throw new BadRequestException('A mandatory rejection reason (minimum 5 characters) is required.');
    }

    const vendor = this.findTargetVendor(id);
    const oldStatus = vendor.status;
    const now = new Date().toISOString();

    vendor.status = 'REJECTED';
    vendor.rejectionReason = body.reason.trim();
    vendor.rejectedBy = adminId;
    vendor.rejectedAt = now;
    vendor.updatedAt = now;

    for (const vp of vendorProducts) {
      if (vp.vendorId === vendor.id) {
        vp.isActive = false;
        syncVendorProductToCustomerCatalog(vp);
      }
    }

    if (!vendor.auditLogs) vendor.auditLogs = [];
    vendor.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      action: 'VENDOR_REJECTED',
      performedBy: adminId,
      performedAt: now,
      details: `Application rejected. Reason: ${vendor.rejectionReason}`,
      oldStatus,
      newStatus: 'REJECTED'
    });

    void vendorPersistenceService.saveVendorRecord(vendor);
    void platformNotificationService.dispatch({
      tenantId: vendor.tenantId || 'tenant-buildora-blr',
      recipientRole: 'VENDOR',
      recipientId: vendor.id,
      type: 'VENDOR_ONBOARDING',
      title: 'Application Not Approved',
      message: `Your vendor application was not approved. Reason: ${vendor.rejectionReason}`,
      severity: 'WARNING',
      actionUrl: `/application-status/${vendor.applicationId}`,
    });
    realtimeBus.emitVendorAndAdmin(vendor.id, 'vendor.application.rejected', {
      vendor: this.sanitizeApplicationSummary(vendor),
      reason: vendor.rejectionReason,
    });

    vendorNotificationService.notify(
      vendor.id,
      'APPLICATION_REJECTED',
      'Application Not Approved',
      `Your vendor application was not approved. Reason: ${vendor.rejectionReason}`,
      `/application-status/${vendor.applicationId}`,
      { email: vendor.email, phone: vendor.phone }
    );

    return {
      success: true,
      message: 'Application rejected with reason recorded.',
      application: this.sanitizeApplicationSummary(vendor)
    };
  }

  @Post('applications/:id/request-resubmission')
  requestResubmission(
    @Param('id') id: string,
    @Headers() headers: Record<string, string | undefined>,
    @Body() body: { reason: string }
  ) {
    const { adminId } = this.authorizeAdmin(headers);
    if (!body?.reason || body.reason.trim().length < 5) {
      throw new BadRequestException('A mandatory explanation of required changes (minimum 5 characters) is required.');
    }

    const vendor = this.findTargetVendor(id);
    const oldStatus = vendor.status;
    const now = new Date().toISOString();

    vendor.status = 'RESUBMISSION_REQUIRED';
    vendor.resubmissionReason = body.reason.trim();
    vendor.updatedAt = now;

    if (!vendor.auditLogs) vendor.auditLogs = [];
    vendor.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      action: 'RESUBMISSION_REQUESTED',
      performedBy: adminId,
      performedAt: now,
      details: `Resubmission requested. Instructions: ${vendor.resubmissionReason}`,
      oldStatus,
      newStatus: 'RESUBMISSION_REQUIRED'
    });

    void vendorPersistenceService.saveVendorRecord(vendor);

    vendorNotificationService.notify(
      vendor.id,
      'DOCUMENTS_REQUESTED',
      'Action Required: Application Resubmission',
      `Please update the requested information and resubmit your application: ${vendor.resubmissionReason}`,
      `/application-status/${vendor.applicationId}`,
      { email: vendor.email, phone: vendor.phone }
    );

    return {
      success: true,
      message: 'Resubmission requested successfully.',
      application: this.sanitizeApplicationSummary(vendor)
    };
  }

  @Post('applications/:id/suspend')
  suspendVendor(
    @Param('id') id: string,
    @Headers() headers: Record<string, string | undefined>,
    @Body() body: { reason: string }
  ) {
    const { adminId } = this.authorizeAdmin(headers);
    if (!body?.reason || body.reason.trim().length < 5) {
      throw new BadRequestException('A mandatory suspension reason (minimum 5 characters) is required.');
    }

    const vendor = this.findTargetVendor(id);
    if (vendor.status !== 'APPROVED' && vendor.status !== 'ACTIVE') {
      throw new BadRequestException('Only approved or active vendors can be suspended.');
    }

    const oldStatus = vendor.status;
    const now = new Date().toISOString();
    vendor.status = 'SUSPENDED';
    vendor.suspendedReason = body.reason.trim();
    vendor.suspendedAt = now;
    vendor.updatedAt = now;

    for (const vp of vendorProducts) {
      if (vp.vendorId === vendor.id) {
        vp.isActive = false;
        syncVendorProductToCustomerCatalog(vp);
        realtimeBus.emitPublic('product.suspended', { productId: vp.id, vendorId: vendor.id });
      }
    }

    if (!vendor.auditLogs) vendor.auditLogs = [];
    vendor.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      action: 'VENDOR_SUSPENDED',
      performedBy: adminId,
      performedAt: now,
      details: `Vendor account suspended. Reason: ${vendor.suspendedReason}`,
      oldStatus,
      newStatus: 'SUSPENDED'
    });

    void vendorPersistenceService.saveVendorRecord(vendor);
    void platformNotificationService.dispatch({
      tenantId: vendor.tenantId || 'tenant-buildora-blr',
      recipientRole: 'VENDOR',
      recipientId: vendor.id,
      type: 'VENDOR_ONBOARDING',
      title: 'Vendor Account Suspended',
      message: `Your vendor account has been suspended. Reason: ${vendor.suspendedReason}`,
      severity: 'CRITICAL',
      actionUrl: '/account-restricted',
    });
    realtimeBus.emitVendorAndAdmin(vendor.id, 'vendor.application.rejected', {
      vendor: this.sanitizeApplicationSummary(vendor),
      reason: vendor.suspendedReason,
      action: 'SUSPENDED',
    });

    vendorNotificationService.notify(
      vendor.id,
      'ACCOUNT_SUSPENDED',
      'Vendor Account Suspended',
      `Your vendor account has been suspended. Reason: ${vendor.suspendedReason}`,
      '/account-restricted',
      { email: vendor.email, phone: vendor.phone }
    );

    return {
      success: true,
      message: 'Vendor account suspended.',
      application: this.sanitizeApplicationSummary(vendor)
    };
  }
}
