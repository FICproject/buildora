import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Header,
  Body,
  Param,
  Query,
  Headers,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  Res,
  Req,
  OnModuleInit
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import {
  VendorProfile,
  VendorProduct,
  VendorOrder,
  VendorSettlement,
  VendorNotification,
  VendorDashboardMetrics,
  BulkPriceTier,
  Product,
  VendorAccountStatus,
  VendorWarehouse,
  VendorKycDocument,
  VendorAuditLog,
  VendorRegistrationWizardData,
  VendorRole,
  VendorEmployee,
  VendorStockMovement,
  VendorReturnItem,
  VendorReturnRequest,
  VendorPromotion,
  VendorProductReview,
  VendorInvoice,
  VendorSupportTicket
} from '@buildora/types';
import {
  SEED_PRODUCTS,
  MASTER_CATEGORIES,
  BENGALURU_WAREHOUSES,
  CATEGORY_ATTRIBUTE_TEMPLATES,
  getAttributeTemplatesForCategory,
  resolveCanonicalCategoryHierarchy,
} from '@buildora/constants';
import { dbStore } from '../../../database/store';
import { vendorSecurityService } from '../services/vendor-security.service';
import { vendorNotificationService } from '../services/vendor-notification.service';
import { postalLookupService } from '../services/postal-lookup.service';
import { storageService } from '../services/storage.service';
import { vendorPersistenceService } from '../services/vendor-persistence.service';
import {
  PlatformProductModel,
  PlatformOrderModel,
  PlatformReturnModel,
  PlatformSettlementModel,
  PlatformStockMovementModel,
  PlatformWarehouseModel,
  PlatformSupportTicketModel,
  PlatformWalletTxnModel,
  PlatformPromotionModel,
  PlatformReviewModel,
  PlatformShipmentModel,
  VendorInvoiceModel,
  DispatchAssignmentModel,
  platformPersistenceService
} from '../../../database/platform-persistence.service';
import { realtimeBus } from '../../realtime/realtime-bus';
import { platformNotificationService } from '../../notifications/platform-notification.service';
import { companyAdminSecurityService } from '../../company-admin/services/company-admin-security.service';
import { companyAdminDataService } from '../../company-admin/services/company-admin-data.service';
import {
  companyAdminPersistenceService,
  CompanyQuotationModel,
} from '../../company-admin/services/company-admin-persistence.service';
import { orderSyncService } from '../../orders/services/order-sync.service';
import { gstInvoiceService } from '../../orders/services/gst-invoice.service';
import {
  fulfilmentLifecycleService,
  VEHICLE_CAPACITY_SPECS,
} from '../../orders/services/fulfilment-lifecycle.service';
import {
  AnalyticsGranularity,
  vendorAnalyticsService,
} from '../services/vendor-analytics.service';
import { taxonomyService } from '../../catalogue/services/taxonomy.service';
import {
  validateName,
  validateBusinessName,
  validateLegalBusinessName,
  validateStoreName,
  validateBusinessType,
  validateBusinessRegistrationType,
  validateBusinessDescription,
  validateEmail,
  validateIndianMobile,
  validateIdentifier,
  validatePincode,
  validateCityOrState,
  validateGSTIN,
  validatePAN,
  validateBankName,
  validateBankAccount,
  validateBankAccountType,
  validateIFSC,
  validatePassword,
  validateConfirmPassword,
  validateAddress,
  validateYearOfEstablishment,
  validateWebsite,
  validateKycDocumentMetadata,
  validateAadhaar,
  validateUdyamNumber,
  validateApplicationReference,
  isTradeLicenseRequired,
  maskAadhaar,
  maskPan,
  maskBankAccount,
  validateVendorStep1,
  validateVendorRegistrationPayload,
  ALLOWED_GST_STATUSES,
  ALLOWED_MSME_STATUSES,
  ALLOWED_KYC_DOCUMENT_TYPES,
  MAX_LOGO_SIZE_BYTES,
  MAX_KYC_DOC_SIZE_BYTES
} from '@buildora/validation';

// Initial Demo Vendor Profile
export const DEFAULT_VENDOR_ID = 'vnd-apex-01';
export const DEFAULT_TENANT_ID = 'tenant-buildora-blr';

export interface BackendVendorRecord extends VendorProfile {
  passwordHash: string;
  refreshToken?: string;
  failedLoginAttempts: number;
  lockedUntil: number;
}

// Pre-seeded hashed password for all demo accounts: "Vendor@123"
const SEED_PASSWORD_HASH = vendorSecurityService.hashPassword('Vendor@123');

// Multi-tenant Vendor In-Memory / Persisted Store
export const vendorRecords: Map<string, BackendVendorRecord> = new Map();

// Helper to determine route redirection based on vendor account status
export function getVendorRedirectUrl(status: VendorAccountStatus, applicationId?: string): string {
  switch (status) {
    case 'APPROVED':
    case 'ACTIVE':
      return '/dashboard';
    case 'DRAFT':
      return '/register';
    case 'SUBMITTED':
    case 'UNDER_REVIEW':
    case 'RESUBMISSION_REQUIRED':
    case 'REJECTED':
      return applicationId ? `/application-status/${applicationId}` : '/application-status';
    case 'SUSPENDED':
      return '/account-restricted';
    default:
      return applicationId ? `/application-status/${applicationId}` : '/application-status';
  }
}

// Initialize seed vendor accounts
function initSeedVendors() {
  // 1. APPROVED / ACTIVE Vendor: Supreme Materials BLR
  const apexVendor: BackendVendorRecord = {
    id: DEFAULT_VENDOR_ID,
    tenantId: DEFAULT_TENANT_ID,
    status: 'APPROVED',
    rating: 4.8,
    productCount: 12,
    orderCount: 48,
    createdAt: '2026-01-10T09:00:00.000Z',
    updatedAt: new Date().toISOString(),
    storeName: 'Supreme Materials BLR',
    name: 'Vikramaditya Rao',
    email: 'vendor@buildora.in',
    phone: '9845012345',
    passwordHash: SEED_PASSWORD_HASH,
    failedLoginAttempts: 0,
    lockedUntil: 0,
    isEmailVerified: true,
    isPhoneVerified: true,
    registrationStep: 5,
    businessInfo: {
      businessName: 'Supreme Building Materials Private Limited',
      contactPerson: 'Vikramaditya Rao',
      phone: '9845012345',
      email: 'vendor@buildora.in',
      businessType: 'PRIVATE_LIMITED',
      description: 'Premier authorized distributor of tier-1 cement, plumbing fittings, and architectural hardware across Karnataka.',
      logo: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=300&q=80',
      gstin: '29AABCB9876F1Z2',
      pan: 'AABCB9876F',
      businessRegNumber: 'U45200KA2020PTC123456',
      address: {
        building: 'Shed 14, Peenya Industrial Area',
        street: '4th Phase, 2nd Cross Road',
        area: 'Peenya',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560058',
        country: 'India',
        lat: 13.0285,
        lng: 77.5195
      },
      bankDetails: {
        accountHolderName: 'Supreme Building Materials Private Limited',
        bankName: 'HDFC Bank',
        accountNumber: '50200049182341',
        ifsc: 'HDFC0000053',
        accountType: 'CURRENT',
        branch: 'Peenya Industrial Branch, Bengaluru',
        isVerified: true
      },
      categories: ['cement-concrete', 'tiling-tile-adhesives', 'cpvc-pipes-overhead-tanks', 'hinges-channels-handles'],
      storeName: 'Supreme Materials BLR',
      storeDescription: 'Direct plant certified building materials with guaranteed batch test certificates.',
      warehouseAddress: 'Plot 88, Peenya 2nd Stage, Bengaluru, Karnataka 560058',
      pickupPincode: '560058',
      assignedDarkStoreId: 'WH-BLR-04',
      dispatchCutoff: '18:00',
      preparationTimeMins: 30,
      documents: [
        { type: 'GST_CERTIFICATE', name: 'GST_Registration_Certificate.pdf', url: '/docs/gst.pdf', uploadedAt: '2026-01-10T10:00:00Z' },
        { type: 'PAN_CARD', name: 'Company_PAN_Card.pdf', url: '/docs/pan.pdf', uploadedAt: '2026-01-10T10:05:00Z' }
      ]
    },
    warehouses: [
      {
        id: 'wh-1',
        name: 'Peenya Central Dispatch Depot',
        address: 'Plot 88, Peenya 2nd Stage, Bengaluru, Karnataka',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560058',
        contactPerson: 'Ramesh Gowda',
        phone: '9845012348',
        isPrimary: true
      }
    ],
    kycDocuments: [
      {
        id: 'doc-1',
        type: 'GST_CERTIFICATE',
        title: 'GST REG-06 Certificate',
        fileName: 'GST_Certificate_Supreme.pdf',
        fileSize: 1024500,
        mimeType: 'application/pdf',
        fileUrl: '/secure/docs/gst-supreme.pdf',
        uploadedAt: '2026-01-10T10:00:00Z',
        verificationStatus: 'VERIFIED'
      },
      {
        id: 'doc-2',
        type: 'PAN_CARD',
        title: 'Company PAN Card',
        fileName: 'Company_PAN_AABCB9876F.pdf',
        fileSize: 524000,
        mimeType: 'application/pdf',
        fileUrl: '/secure/docs/pan-supreme.pdf',
        uploadedAt: '2026-01-10T10:05:00Z',
        verificationStatus: 'VERIFIED'
      }
    ],
    auditLogs: [
      {
        id: 'audit-1',
        action: 'VENDOR_APPROVED',
        performedBy: 'Compliance Admin (Priya Sundaram)',
        performedAt: '2026-01-12T11:00:00Z',
        details: 'KYC verified and compliance check completed. Activated for Peenya Dark Store fulfillment.',
        oldStatus: 'UNDER_REVIEW',
        newStatus: 'APPROVED'
      }
    ]
  };

  // 2. SUBMITTED / UNDER_REVIEW Vendor
  const reviewVendor: BackendVendorRecord = {
    id: 'vnd-review-02',
    tenantId: DEFAULT_TENANT_ID,
    status: 'UNDER_REVIEW',
    rating: 0,
    productCount: 0,
    orderCount: 0,
    createdAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    storeName: 'Bangalore Steel & Hardware Mart',
    name: 'Karthik Somayaji',
    email: 'underreview@buildora.in',
    phone: '9845000003',
    passwordHash: SEED_PASSWORD_HASH,
    failedLoginAttempts: 0,
    lockedUntil: 0,
    isEmailVerified: true,
    isPhoneVerified: true,
    registrationStep: 5,
    businessInfo: {
      businessName: 'Somayaji Steels & Building Supplies LLP',
      contactPerson: 'Karthik Somayaji',
      phone: '9845000003',
      email: 'underreview@buildora.in',
      businessType: 'LLP',
      description: 'Stockist and distributor of TMT reinforcement steel bars, structural channels, and binding wire.',
      address: {
        building: 'No. 44, New Timber Yard Layout',
        street: 'Mysore Road',
        area: 'Avalahalli',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560026'
      },
      bankDetails: {
        accountHolderName: 'Somayaji Steels LLP',
        bankName: 'ICICI Bank',
        accountNumber: '000205001294',
        ifsc: 'ICIC0000002',
        branch: 'M.G. Road, Bengaluru',
        isVerified: false
      },
      categories: ['civil-structural-steel', 'general-hardware-tools'],
      storeName: 'Bangalore Steel & Hardware Mart'
    },
    kycDocuments: [
      {
        id: 'doc-3',
        type: 'GST_CERTIFICATE',
        title: 'GST Certificate',
        fileName: 'Somayaji_GST.pdf',
        fileSize: 840000,
        mimeType: 'application/pdf',
        fileUrl: '/secure/docs/gst-somayaji.pdf',
        uploadedAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
        verificationStatus: 'PENDING'
      }
    ],
    auditLogs: [
      {
        id: 'audit-rev-1',
        action: 'APPLICATION_SUBMITTED',
        performedBy: 'Karthik Somayaji (Owner)',
        performedAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
        details: 'Initial registration application submitted for compliance review.',
        oldStatus: 'DRAFT',
        newStatus: 'SUBMITTED'
      },
      {
        id: 'audit-rev-2',
        action: 'STATUS_CHANGED',
        performedBy: 'Admin Verification System',
        performedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
        details: 'Assigned to compliance verification queue.',
        oldStatus: 'SUBMITTED',
        newStatus: 'UNDER_REVIEW'
      }
    ]
  };

  // 3. DRAFT Vendor (Resume Registration)
  const draftVendor: BackendVendorRecord = {
    id: 'vnd-draft-03',
    tenantId: DEFAULT_TENANT_ID,
    status: 'DRAFT',
    rating: 0,
    productCount: 0,
    orderCount: 0,
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    storeName: 'Karnataka Electrical Wholesale',
    name: 'Suresh Hegde',
    email: 'draft@buildora.in',
    phone: '9845000001',
    passwordHash: SEED_PASSWORD_HASH,
    failedLoginAttempts: 0,
    lockedUntil: 0,
    isEmailVerified: true,
    isPhoneVerified: true,
    registrationStep: 3,
    businessInfo: {
      businessName: 'Karnataka Electrical Supplies & Fittings',
      contactPerson: 'Suresh Hegde',
      phone: '9845000001',
      email: 'draft@buildora.in',
      businessType: 'PROPRIETORSHIP',
      address: {
        building: 'Shop 12, BVK Iyengar Road',
        street: 'Chickpet',
        area: 'Chickpet',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560053'
      },
      bankDetails: {
        accountHolderName: '',
        bankName: '',
        accountNumber: '',
        ifsc: '',
        branch: '',
        isVerified: false
      },
      categories: ['electrical-lighting'],
      storeName: 'Karnataka Electrical Wholesale'
    }
  };

  // 4. REJECTED Vendor (Needs Resubmission)
  const rejectedVendor: BackendVendorRecord = {
    id: 'vnd-reject-04',
    tenantId: DEFAULT_TENANT_ID,
    status: 'REJECTED',
    rejectionReason: 'The uploaded GST Registration Certificate is blurred and illegible. Please upload a clear original color PDF scan of Form GST REG-06 showing principal place of business.',
    rating: 0,
    productCount: 0,
    orderCount: 0,
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    storeName: 'Namma Pipes & Sanitary Depot',
    name: 'Manoj Kumar',
    email: 'rejected@buildora.in',
    phone: '9845000004',
    passwordHash: SEED_PASSWORD_HASH,
    failedLoginAttempts: 0,
    lockedUntil: 0,
    isEmailVerified: true,
    isPhoneVerified: true,
    registrationStep: 4,
    businessInfo: {
      businessName: 'Namma Sanitary Ware & PVC Solutions',
      contactPerson: 'Manoj Kumar',
      phone: '9845000004',
      email: 'rejected@buildora.in',
      businessType: 'PARTNERSHIP',
      address: {
        building: 'Plot 10, Ring Road',
        street: 'Kengeri Satellite Town',
        area: 'Kengeri',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560060'
      },
      bankDetails: {
        accountHolderName: 'Namma Sanitary Ware',
        bankName: 'State Bank of India',
        accountNumber: '31092841920',
        ifsc: 'SBIN0001824',
        branch: 'Kengeri Branch',
        isVerified: false
      },
      categories: ['plumbing-sanitary-bath'],
      storeName: 'Namma Pipes & Sanitary Depot'
    },
    kycDocuments: [
      {
        id: 'doc-rej-1',
        type: 'GST_CERTIFICATE',
        title: 'GST Certificate (Rejected)',
        fileName: 'GST_scan_sample.jpg',
        fileSize: 180000,
        mimeType: 'image/jpeg',
        fileUrl: '/secure/docs/gst-scan-blurred.jpg',
        uploadedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
        verificationStatus: 'REJECTED',
        rejectionReason: 'Document scan illegible / low resolution. Upload original PDF.'
      }
    ],
    auditLogs: [
      {
        id: 'audit-rej-1',
        action: 'APPLICATION_REJECTED',
        performedBy: 'Compliance Officer (Anand Kumar)',
        performedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        details: 'The uploaded GST Registration Certificate is blurred and illegible. Please upload a clear original color PDF scan of Form GST REG-06 showing principal place of business.',
        oldStatus: 'UNDER_REVIEW',
        newStatus: 'REJECTED'
      }
    ]
  };

  // 5. SUSPENDED Vendor
  const suspendedVendor: BackendVendorRecord = {
    id: 'vnd-suspend-05',
    tenantId: DEFAULT_TENANT_ID,
    status: 'SUSPENDED',
    rejectionReason: 'Account suspended due to material quality dispute: batch test certificates were not provided for delivery dispatched to Whitefield dark store.',
    rating: 3.2,
    productCount: 4,
    orderCount: 19,
    createdAt: new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    storeName: 'Metro Aggregates & Ready-Mix',
    name: 'Dilip Rathi',
    email: 'suspended@buildora.in',
    phone: '9845000005',
    passwordHash: SEED_PASSWORD_HASH,
    failedLoginAttempts: 0,
    lockedUntil: 0,
    isEmailVerified: true,
    isPhoneVerified: true,
    registrationStep: 5,
    businessInfo: {
      businessName: 'Metro Concrete Aggregates Pvt Ltd',
      contactPerson: 'Dilip Rathi',
      phone: '9845000005',
      email: 'suspended@buildora.in',
      businessType: 'PRIVATE_LIMITED',
      address: {
        building: 'Quarry Site 4',
        street: 'Bannerghatta Main Road',
        area: 'Jigani Industrial Area',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560105'
      },
      bankDetails: {
        accountHolderName: 'Metro Concrete Aggregates Pvt Ltd',
        bankName: 'Canara Bank',
        accountNumber: '0412101089241',
        ifsc: 'CNRB0000412',
        branch: 'Jigani Branch',
        isVerified: true
      },
      categories: ['cement-concrete'],
      storeName: 'Metro Aggregates & Ready-Mix'
    },
    auditLogs: [
      {
        id: 'audit-susp-1',
        action: 'ACCOUNT_SUSPENDED',
        performedBy: 'Quality Assurance Lead (Dr. S. Nair)',
        performedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
        details: 'Account suspended due to material quality dispute: batch test certificates were not provided for delivery dispatched to Whitefield dark store.',
        oldStatus: 'ACTIVE',
        newStatus: 'SUSPENDED'
      }
    ]
  };

  vendorRecords.set(apexVendor.id, apexVendor);
  vendorRecords.set(reviewVendor.id, reviewVendor);
  vendorRecords.set(draftVendor.id, draftVendor);
  vendorRecords.set(rejectedVendor.id, rejectedVendor);
  vendorRecords.set(suspendedVendor.id, suspendedVendor);
}

// Initialize seed vendors
initSeedVendors();

// Export current primary vendor for backwards compatibility
let currentVendor: VendorProfile = vendorRecords.get(DEFAULT_VENDOR_ID)!;

// Helper to look up a vendor by email or 10-digit phone number
export function findVendorByIdentifier(identifier: string): BackendVendorRecord | undefined {
  if (!identifier) return undefined;
  const clean = identifier.trim().toLowerCase();
  const digitsOnly = clean.replace(/\D/g, '').slice(-10);

  for (const v of vendorRecords.values()) {
    if (v.email.toLowerCase() === clean) return v;
    if (v.businessInfo?.email?.toLowerCase() === clean) return v;
    if (v.phone.replace(/\D/g, '').slice(-10) === digitsOnly && digitsOnly.length === 10) return v;
    if (v.businessInfo?.phone?.replace(/\D/g, '').slice(-10) === digitsOnly && digitsOnly.length === 10) return v;
  }
  return undefined;
}

// Helper to resolve vendor from Authorization Header (verifies signed JWT first)
export function getVendorFromAuthHeader(authHeader?: string): BackendVendorRecord {
  const authenticated = getAuthenticatedVendor(authHeader);
  if (authenticated) {
    return authenticated;
  }
  return vendorRecords.get(DEFAULT_VENDOR_ID)!;
}

// Helper to strictly resolve authenticated vendor without falling back to default
export function getAuthenticatedVendor(authHeader?: string): BackendVendorRecord | null {
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  const verified = vendorSecurityService.verifyToken(token);
  if (verified?.vendorId && vendorRecords.has(verified.vendorId)) {
    return vendorRecords.get(verified.vendorId)!;
  }
  for (const v of vendorRecords.values()) {
    if (token.includes(v.id) || token.includes(v.email)) {
      return v;
    }
  }
  return null;
}

// Async strict resolver: checks in-memory map and hydrates from MongoDB on demand if needed
export async function resolveStrictAuthenticatedVendor(authHeader?: string): Promise<BackendVendorRecord> {
  if (!authHeader) {
    throw new UnauthorizedException('Authentication token is required.');
  }
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    throw new UnauthorizedException('Invalid authorization token.');
  }
  const verified = vendorSecurityService.verifyToken(token);
  if (verified?.vendorId) {
    const cached = vendorRecords.get(verified.vendorId);
    if (cached) return cached;
    const fromDb = await vendorPersistenceService.loadVendorById(verified.vendorId, vendorRecords);
    if (fromDb) return fromDb as BackendVendorRecord;
    throw new UnauthorizedException('Authenticated vendor account not found. Please sign in again.');
  }
  const fallbackMatch = getAuthenticatedVendor(authHeader);
  if (fallbackMatch) return fallbackMatch;
  throw new UnauthorizedException('Session expired or invalid token. Please sign in again.');
}

function linkIdentificationNumbersToDocuments(
  docs: any[],
  ids: {
    aadhaarPlain?: string;
    panPlain?: string;
    gstStatus?: string;
    gstin?: string;
    gstApplicationNumber?: string;
    msmeStatus?: string;
    udyamNumber?: string;
    msmeApplicationNumber?: string;
    bankAccountPlain?: string;
  }
): VendorKycDocument[] {
  return (Array.isArray(docs) ? docs : []).map((doc: any) => {
    const type = String(doc?.type || '').toUpperCase();
    let identificationNumber = doc?.identificationNumber;
    let identificationNumberMasked = doc?.identificationNumberMasked;

    if ((type === 'AADHAAR_CARD' || type === 'AUTHORIZED_ID') && ids.aadhaarPlain) {
      identificationNumber = vendorSecurityService.encryptSensitive(ids.aadhaarPlain);
      identificationNumberMasked = maskAadhaar(ids.aadhaarPlain);
    } else if (type === 'PAN_CARD' && ids.panPlain) {
      identificationNumber = vendorSecurityService.encryptSensitive(ids.panPlain);
      identificationNumberMasked = maskPan(ids.panPlain);
    } else if (type === 'GST_CERTIFICATE' && ids.gstin) {
      identificationNumber = ids.gstin;
      identificationNumberMasked = ids.gstin;
    } else if (type === 'GST_ACKNOWLEDGEMENT' && ids.gstApplicationNumber) {
      identificationNumber = ids.gstApplicationNumber;
      identificationNumberMasked = ids.gstApplicationNumber;
    } else if ((type === 'UDYAM_CERTIFICATE' || type === 'MSME_CERTIFICATE') && ids.udyamNumber) {
      identificationNumber = ids.udyamNumber;
      identificationNumberMasked = ids.udyamNumber;
    } else if (type === 'MSME_ACKNOWLEDGEMENT' && ids.msmeApplicationNumber) {
      identificationNumber = ids.msmeApplicationNumber;
      identificationNumberMasked = ids.msmeApplicationNumber;
    } else if (type === 'CANCELLED_CHEQUE' && ids.bankAccountPlain) {
      identificationNumber = vendorSecurityService.encryptSensitive(ids.bankAccountPlain);
      identificationNumberMasked = maskBankAccount(ids.bankAccountPlain);
    }

    const prevCount = Array.isArray(doc?.previousVersions) ? doc.previousVersions.length : 0;
    const sanitized = { ...doc };
    // Avoid storing public URLs for sensitive documents when storageKey is present
    if (sanitized.storageKey) {
      delete sanitized.fileUrl;
    }

    return {
      ...sanitized,
      version: doc?.version || prevCount + 1,
      ...(identificationNumber ? { identificationNumber } : {}),
      ...(identificationNumberMasked ? { identificationNumberMasked } : {}),
      verificationStatus: doc?.verificationStatus || 'PENDING',
    };
  });
}

function sanitizeDocumentForClient(doc: any): VendorKycDocument {
  const clean = { ...doc };
  delete clean.identificationNumber;
  delete clean.fileUrl;
  if (Array.isArray(clean.previousVersions)) {
    clean.previousVersions = clean.previousVersions.map((pv: any) => {
      const cleanPv = { ...pv };
      delete cleanPv.identificationNumber;
      delete cleanPv.fileUrl;
      return cleanPv;
    });
  }
  return clean;
}

// Normalizes and merges registrationData + businessInfo + top-level fields without leaking secrets
export function serializeVendorProfile(vendor: BackendVendorRecord): VendorProfile {
  const reg = (vendor.registrationData || {}) as Partial<VendorRegistrationWizardData>;
  const biz = (vendor.businessInfo || {}) as any;
  const bizAddr = biz.address || {};
  const regBank = reg.bankDetails || ({} as any);
  const bizBank = biz.bankDetails || {};
  const isDraftOrEditable = vendor.status === 'DRAFT' || vendor.status === 'RESUBMISSION_REQUIRED';

  const rawAadhaar = vendorSecurityService.decryptSensitive(
    (vendor as any).aadhaarNumber || biz.aadhaarNumber || reg.aadhaarNumber || ''
  );
  const rawPan = vendorSecurityService.decryptSensitive(biz.pan || reg.pan || '');
  const rawBankAcc = vendorSecurityService.decryptSensitive(
    bizBank.accountNumber || regBank.accountNumber || ''
  );

  const aadhaarMasked = (vendor as any).aadhaarMasked || biz.aadhaarMasked || maskAadhaar(rawAadhaar);
  const panMasked = (vendor as any).panMasked || biz.panMasked || maskPan(rawPan);
  const accountNumberMasked = bizBank.accountNumberMasked || maskBankAccount(rawBankAcc);

  const rawGstin = String(biz.gstin || reg.gstin || '').trim().toUpperCase();
  const gstStatus =
    ((vendor as any).gstStatus || biz.gstStatus || reg.gstStatus || (rawGstin ? 'REGISTERED' : 'NOT_REGISTERED')) as any;
  const gstApplicationNumber =
    (vendor as any).gstApplicationNumber || biz.gstApplicationNumber || reg.gstApplicationNumber || '';
  const resolvedGstin = gstStatus === 'REGISTERED' ? rawGstin : '';

  const rawUdyam = String(
    (vendor as any).udyamNumber || biz.udyamNumber || reg.udyamNumber || ''
  )
    .trim()
    .toUpperCase();
  const msmeStatus =
    ((vendor as any).msmeStatus || biz.msmeStatus || reg.msmeStatus || (rawUdyam ? 'REGISTERED' : 'NOT_REGISTERED')) as any;
  const msmeApplicationNumber =
    (vendor as any).msmeApplicationNumber || biz.msmeApplicationNumber || reg.msmeApplicationNumber || '';
  const resolvedUdyam = msmeStatus === 'REGISTERED' ? rawUdyam : '';

  const resolvedAddress = {
    building: bizAddr.building || reg.completeAddress || '',
    street: bizAddr.street || reg.area || '',
    area: bizAddr.area || reg.area || '',
    city: bizAddr.city || reg.city || '',
    state: bizAddr.state || reg.state || '',
    pincode: bizAddr.pincode || reg.pincode || '',
    country: bizAddr.country || reg.country || 'India',
    lat: bizAddr.lat,
    lng: bizAddr.lng
  };

  const resolvedDocs = (
    (vendor.kycDocuments && vendor.kycDocuments.length > 0
      ? vendor.kycDocuments
      : reg.documents && reg.documents.length > 0
        ? reg.documents
        : biz.documents) || []
  ).map((d: any) => sanitizeDocumentForClient(d));

  const bankProofDoc = resolvedDocs.find((d: any) => d.type === 'CANCELLED_CHEQUE');
  const resolvedBank = {
    accountHolderName: bizBank.accountHolderName || regBank.accountHolderName || '',
    bankName: bizBank.bankName || regBank.bankName || '',
    accountNumber: isDraftOrEditable ? rawBankAcc : accountNumberMasked,
    accountNumberMasked,
    ifsc: bizBank.ifsc || regBank.ifsc || '',
    accountType: bizBank.accountType || regBank.accountType || 'CURRENT',
    branch: bizBank.branch || (bizBank.bankName ? `${bizBank.bankName} Branch` : ''),
    isVerified: Boolean(bizBank.isVerified ?? regBank.isVerified ?? false),
    verificationStatus:
      bizBank.verificationStatus ||
      regBank.verificationStatus ||
      (bizBank.isVerified ? 'VERIFIED' : 'PENDING'),
    rejectionReason: bizBank.rejectionReason || regBank.rejectionReason,
    reviewedAt: bizBank.reviewedAt || regBank.reviewedAt,
    reviewedBy: bizBank.reviewedBy || regBank.reviewedBy,
    proofDocumentId: bankProofDoc?.id || bizBank.proofDocumentId || regBank.proofDocumentId,
    proofFileName: bankProofDoc?.fileName || bizBank.proofFileName || regBank.proofFileName
  };

  const resolvedLogo = vendor.logoUrl || biz.logo || reg.logoUrl || undefined;
  const resolvedLogoMeta = vendor.logoMetadata || biz.logoMetadata || reg.logoMetadata || undefined;
  const resolvedWarehouses =
    (vendor.warehouses && vendor.warehouses.length > 0
      ? vendor.warehouses
      : reg.warehouses) || [];

  return {
    id: vendor.id,
    tenantId: vendor.tenantId,
    storeName: vendor.storeName || biz.storeName || reg.storeName || '',
    name: vendor.name || biz.contactPerson || reg.ownerName || '',
    email: vendor.email || biz.email || reg.email || '',
    phone: vendor.phone || biz.phone || reg.phone || '',
    status: vendor.status,
    applicationId: vendor.applicationId,
    submittedAt: vendor.submittedAt,
    latestKycSubmittedAt: (vendor as any).latestKycSubmittedAt,
    lastDocumentUploadedAt: (vendor as any).lastDocumentUploadedAt,
    logoUrl: resolvedLogo,
    logoMetadata: resolvedLogoMeta,
    aadhaarMasked: aadhaarMasked || undefined,
    panMasked: panMasked || undefined,
    gstStatus,
    gstApplicationNumber: gstStatus === 'APPLIED' ? gstApplicationNumber || undefined : undefined,
    msmeStatus,
    udyamNumber: resolvedUdyam || undefined,
    msmeApplicationNumber: msmeStatus === 'APPLIED' ? msmeApplicationNumber || undefined : undefined,
    rating: vendor.rating || 0,
    productCount: vendor.productCount || 0,
    orderCount: vendor.orderCount || 0,
    categories: vendor.categories || biz.categories || reg.productCategories || [],
    isEmailVerified: vendor.isEmailVerified,
    isPhoneVerified: vendor.isPhoneVerified,
    rejectionReason: vendor.rejectionReason,
    resubmissionReason: vendor.resubmissionReason,
    suspendedReason: vendor.suspendedReason,
    approvedBy: vendor.approvedBy,
    approvedAt: vendor.approvedAt,
    rejectedBy: vendor.rejectedBy,
    rejectedAt: vendor.rejectedAt,
    suspendedAt: vendor.suspendedAt,
    registrationStep: vendor.registrationStep || 1,
    createdAt: vendor.createdAt,
    updatedAt: vendor.updatedAt,
    businessInfo: {
      ...biz,
      businessName: biz.businessName || reg.legalBusinessName || vendor.storeName || '',
      storeName: biz.storeName || vendor.storeName || reg.storeName || '',
      contactPerson: biz.contactPerson || vendor.name || reg.ownerName || '',
      email: biz.email || vendor.email || reg.email || '',
      phone: biz.phone || vendor.phone || reg.phone || '',
      businessType: biz.businessType || reg.businessType || 'PROPRIETORSHIP',
      businessRegistrationType: biz.businessRegistrationType || reg.businessRegistrationType || '',
      yearOfEstablishment: biz.yearOfEstablishment || reg.yearOfEstablishment || '',
      website: biz.website || reg.website || '',
      description: biz.description || reg.description || '',
      logo: resolvedLogo,
      logoMetadata: resolvedLogoMeta,
      gstStatus,
      gstin: resolvedGstin,
      gstApplicationNumber: gstStatus === 'APPLIED' ? gstApplicationNumber : undefined,
      pan: panMasked,
      panMasked,
      aadhaarNumber: aadhaarMasked,
      aadhaarMasked,
      msmeStatus,
      udyamNumber: resolvedUdyam,
      msmeApplicationNumber: msmeStatus === 'APPLIED' ? msmeApplicationNumber : undefined,
      categories: biz.categories || vendor.categories || reg.productCategories || [],
      address: resolvedAddress,
      bankDetails: resolvedBank
    },
    registrationData: {
      ...reg,
      ownerName: reg.ownerName || vendor.name || biz.contactPerson || '',
      email: reg.email || vendor.email || biz.email || '',
      phone: reg.phone || vendor.phone || biz.phone || '',
      legalBusinessName: reg.legalBusinessName || biz.businessName || '',
      storeName: reg.storeName || vendor.storeName || biz.storeName || '',
      businessType: (reg.businessType || biz.businessType || 'OTHER') as any,
      businessRegistrationType: reg.businessRegistrationType || biz.businessRegistrationType || '',
      yearOfEstablishment: reg.yearOfEstablishment || biz.yearOfEstablishment || '',
      website: reg.website || biz.website || '',
      description: reg.description || biz.description || '',
      logoUrl: resolvedLogo,
      logoMetadata: resolvedLogoMeta,
      country: resolvedAddress.country,
      state: resolvedAddress.state,
      city: resolvedAddress.city,
      pincode: resolvedAddress.pincode,
      completeAddress: reg.completeAddress || resolvedAddress.building || resolvedAddress.street || '',
      gstStatus,
      gstin: resolvedGstin,
      gstApplicationNumber: gstStatus === 'APPLIED' ? gstApplicationNumber : undefined,
      pan: isDraftOrEditable ? rawPan : panMasked,
      aadhaarNumber: isDraftOrEditable ? rawAadhaar : aadhaarMasked,
      msmeStatus,
      udyamNumber: resolvedUdyam,
      msmeApplicationNumber: msmeStatus === 'APPLIED' ? msmeApplicationNumber : undefined,
      documents: resolvedDocs as any,
      warehouses: resolvedWarehouses,
      bankDetails: {
        ...resolvedBank,
        accountType: resolvedBank.accountType as any
      }
    },
    warehouses: resolvedWarehouses,
    kycDocuments: resolvedDocs as any,
    auditLogs: vendor.auditLogs || []
  };
}

// Seed Vendor Products derived from SEED_PRODUCTS
export let vendorProducts: VendorProduct[] = SEED_PRODUCTS.map((p, idx) => ({
  id: `vp-${p.id}`,
  vendorId: DEFAULT_VENDOR_ID,
  tenantId: DEFAULT_TENANT_ID,
  name: p.name,
  slug: p.slug,
  sku: p.sku,
  brand: p.brand,
  brandSlug: p.brandSlug,
  category: p.category,
  categorySlug: p.categorySlug,
  subcategory: p.subcategory,
  subcategorySlug: p.subcategorySlug,
  description: p.description,
  shortDescription: p.shortDescription,
  images: p.images,
  price: p.price,
  mrp: p.mrp,
  discount: p.discount,
  unit: p.unit,
  packSize: p.packSize,
  gstRate: p.gstRate,
  rating: p.rating,
  reviewCount: p.reviewCount,
  inStock: p.inStock,
  stockCount: p.stockCount || 150,
  lowStockThreshold: 20,
  isBulkEligible: p.isBulkEligible,
  bulkPricing: p.bulkPricing || [
    { minQuantity: 10, discountPercentage: 5, unitPrice: Math.round(p.price * 0.95) },
    { minQuantity: 30, discountPercentage: 8, unitPrice: Math.round(p.price * 0.92) },
    { minQuantity: 60, discountPercentage: 12, unitPrice: Math.round(p.price * 0.88) }
  ],
  attributes: p.attributes,
  variants: p.variants,
  specifications: p.specifications || {},
  deliverySpeedAvailable: p.deliverySpeedAvailable,
  approvalStatus: idx >= 50 ? 'PENDING_APPROVAL' : 'APPROVED',
  isActive: true,
  createdAt: '2026-01-15T10:00:00.000Z',
  updatedAt: new Date().toISOString()
}));

// Seed Vendor Orders
export let vendorOrders: VendorOrder[] = [
  {
    id: 'vo-101',
    orderNumber: 'BLD-2026-8941',
    customerOrderId: 'ord-101',
    vendorId: DEFAULT_VENDOR_ID,
    tenantId: DEFAULT_TENANT_ID,
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    status: 'READY_FOR_DISPATCH',
    items: [
      {
        productId: 'prod-cem-1',
        sku: 'CEM-ULT-PPC-50KG',
        name: 'UltraTech Super Cement (PPC)',
        image: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=400&q=80',
        unitPrice: 395,
        quantity: 10,
        gstAmount: 864,
        totalAmount: 3950,
        commissionRate: 5,
        commissionAmount: 197.5,
        netPayout: 3752.5
      }
    ],
    subtotal: 3950,
    gstTotal: 864,
    commissionTotal: 197.5,
    netPayout: 3752.5,
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
      isDefault: true
    },
    deliveryOption: 'ASAP_60',
    estimatedDispatchTime: 'Ready in 10 mins',
    timeline: [
      { status: 'NEW', title: 'Order Placed by Customer', timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString() },
      { status: 'ACCEPTED', title: 'Accepted by Vendor Depot', timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
      { status: 'PROCESSING', title: 'Loading & Pallet Packing', timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString() },
      { status: 'READY_FOR_DISPATCH', title: 'Material Ready at Peenya Depot Gate', timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString() }
    ]
  },
  {
    id: 'vo-102',
    orderNumber: 'BLD-2026-8920',
    customerOrderId: 'ord-102',
    vendorId: DEFAULT_VENDOR_ID,
    tenantId: DEFAULT_TENANT_ID,
    createdAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    status: 'DELIVERED',
    items: [
      {
        productId: 'prod-tile-1',
        sku: 'TIL-KAJ-GVT-600',
        name: 'Kajaria Double Charge Glazed Vitrified Tiles (2x2 ft)',
        image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80',
        unitPrice: 880,
        quantity: 5,
        gstAmount: 792,
        totalAmount: 4400,
        commissionRate: 6,
        commissionAmount: 264,
        netPayout: 4136
      }
    ],
    subtotal: 4400,
    gstTotal: 792,
    commissionTotal: 264,
    netPayout: 4136,
    deliveryAddress: {
      id: 'addr-2',
      type: 'HOME',
      recipientName: 'Suresh Kumar',
      mobile: '9845099887',
      building: 'Villa 18, Palm Meadows',
      street: 'Nallurahalli Road',
      area: 'Whitefield',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560066',
      isDefault: true
    },
    deliveryOption: 'SCHEDULED',
    estimatedDispatchTime: 'Delivered',
    timeline: [
      { status: 'NEW', title: 'Order Placed', timestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString() },
      { status: 'ACCEPTED', title: 'Accepted by Depot', timestamp: new Date(Date.now() - 170 * 60 * 1000).toISOString() },
      { status: 'DISPATCHED', title: 'Dispatched via EV Mini-Truck', timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString() },
      { status: 'DELIVERED', title: 'Delivered at Site Gate', timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString() }
    ]
  }
];

// Seed Settlements
export let vendorSettlements: VendorSettlement[] = [
  {
    id: 'stl-2026-04',
    settlementNumber: 'SETTL-BLD-09241',
    vendorId: DEFAULT_VENDOR_ID,
    period: '11 Nov 2026 - 17 Nov 2026',
    orderCount: 22,
    grossRevenue: 98500,
    platformCommission: 4925,
    taxDeductions: 985,
    netPayable: 92590,
    status: 'PAID',
    paidAt: '2026-11-18T14:30:00Z',
    paymentReference: 'NEFT-HDFC-9128491024',
    createdAt: '2026-11-18T14:30:00Z'
  },
  {
    id: 'stl-2026-05',
    settlementNumber: 'SETTL-BLD-09242',
    vendorId: DEFAULT_VENDOR_ID,
    period: '18 Nov 2026 - 24 Nov 2026',
    orderCount: 14,
    grossRevenue: 54200,
    platformCommission: 2710,
    taxDeductions: 542,
    netPayable: 50948,
    status: 'PENDING',
    createdAt: '2026-11-23T10:00:00Z'
  }
];

// Seed Stock Movements
export let vendorStockMovements: VendorStockMovement[] = [
  {
    id: 'sm-1',
    productId: 'vp-prod-cem-1',
    productName: 'UltraTech Super Cement (PPC)',
    sku: 'CEM-ULT-PPC-50KG',
    warehouseId: 'wh-1',
    warehouseName: 'Peenya Central Dispatch Depot',
    type: 'INWARD',
    quantityDelta: 200,
    quantityBefore: 50,
    quantityAfter: 250,
    reason: 'Direct plant consignment receipt from Rajashree Cement Works',
    referenceNumber: 'GRN-2026-0819',
    performedBy: 'Ramesh Gowda',
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString()
  },
  {
    id: 'sm-2',
    productId: 'vp-prod-cem-1',
    productName: 'UltraTech Super Cement (PPC)',
    sku: 'CEM-ULT-PPC-50KG',
    warehouseId: 'wh-1',
    warehouseName: 'Peenya Central Dispatch Depot',
    type: 'DISPATCH',
    quantityDelta: -10,
    quantityBefore: 250,
    quantityAfter: 240,
    reason: '60-Min express site dispatch for Order #BLD-2026-8941',
    referenceNumber: 'DSP-2026-4410',
    performedBy: 'Mohan Reddy',
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString()
  },
  {
    id: 'sm-3',
    productId: 'vp-prod-ele-1',
    productName: 'Finolex Flame Retardant 2.5 sq mm PVC Insulated Copper Wire (90m)',
    sku: 'ELE-FIN-25-RED',
    warehouseId: 'wh-1',
    warehouseName: 'Peenya Central Dispatch Depot',
    type: 'RETURN',
    quantityDelta: 2,
    quantityBefore: 28,
    quantityAfter: 30,
    reason: 'Customer return #RET-2026-01 verified sealed and restocked',
    referenceNumber: 'RET-RESTOCK-01',
    performedBy: 'Priya Sundaram',
    createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
  },
  {
    id: 'sm-4',
    productId: 'vp-prod-ply-1',
    productName: 'Greenply Marine 710 BWP Waterproof Plywood (18mm)',
    sku: 'PLY-GRN-BWP-18',
    warehouseId: 'wh-1',
    warehouseName: 'Peenya Central Dispatch Depot',
    type: 'DAMAGED',
    quantityDelta: -1,
    quantityBefore: 45,
    quantityAfter: 44,
    reason: 'Rain water edge ingress during heavy downpour unloading',
    referenceNumber: 'DMG-WRITEOFF-92',
    performedBy: 'Priya Sundaram',
    createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString()
  },
  {
    id: 'sm-5',
    productId: 'vp-prod-plumb-1',
    productName: 'Astral CPVC PRO Class 1 Pipe (1 inch, 3m)',
    sku: 'PLM-AST-CPVC-1IN',
    warehouseId: 'wh-1',
    warehouseName: 'Peenya Central Dispatch Depot',
    type: 'ADJUSTMENT',
    quantityDelta: 5,
    quantityBefore: 65,
    quantityAfter: 70,
    reason: 'Physical cycle count audit surplus adjustment',
    referenceNumber: 'AUDIT-ADJ-44',
    performedBy: 'Vikramaditya Rao',
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  }
];

// Seed Warehouses
export let vendorWarehouses: VendorWarehouse[] = [
  {
    id: 'wh-1',
    name: 'Peenya Central Dispatch Depot',
    address: 'Plot 88, Peenya 2nd Stage, Industrial Area',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560058',
    contactPerson: 'Ramesh Gowda',
    phone: '9845012348',
    isPrimary: true
  },
  {
    id: 'wh-blr-02',
    name: 'Whitefield Dark Store Hub',
    address: 'Survey No. 42, ITPL Main Road, Hoodi',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560066',
    contactPerson: 'Anand Murthy',
    phone: '9845099881',
    isPrimary: false
  },
  {
    id: 'wh-blr-03',
    name: 'Electronic City Express Hub',
    address: 'Plot 19, Phase 1, Hosur Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560100',
    contactPerson: 'Kishore Kumar',
    phone: '9845099882',
    isPrimary: false
  },
  {
    id: 'wh-blr-01',
    name: 'Hebbal North Logistics Center',
    address: 'Near Bellary Road Flyover, Hebbal',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560024',
    contactPerson: 'Manjunath Swamy',
    phone: '9845099883',
    isPrimary: false
  },
  {
    id: 'wh-blr-05',
    name: 'Koramangala 60-Min Quick Hub',
    address: '80 Feet Road, 4th Block, Koramangala',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560034',
    contactPerson: 'Srinivas Rao',
    phone: '9845099884',
    isPrimary: false
  }
];

// Seed Return Requests
export let vendorReturns: VendorReturnRequest[] = [
  {
    id: 'ret-101',
    orderId: 'vo-100',
    orderNumber: 'BLD-2026-8940',
    vendorId: DEFAULT_VENDOR_ID,
    customerId: 'cust-8821',
    customerName: 'Suresh Kumar',
    customerPhone: '9845099887',
    items: [
      {
        productId: 'prod-ele-1',
        name: 'Finolex Flame Retardant 2.5 sq mm Copper Wire',
        sku: 'ELE-FIN-25-RED',
        quantity: 2,
        price: 1725,
        returnReason: 'Wrong wire gauge ordered by electrician (needed 4.0 sq mm)',
        productCondition: 'SEALED'
      }
    ],
    totalRefundAmount: 3450,
    status: 'REFUNDED',
    pickupAddress: 'Villa 18, Palm Meadows, Whitefield, Bengaluru 560066',
    requestedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    restockDecision: true
  },
  {
    id: 'ret-102',
    orderId: 'vo-99',
    orderNumber: 'BLD-2026-8938',
    vendorId: DEFAULT_VENDOR_ID,
    customerId: 'cust-7712',
    customerName: 'Raghavan Pillai',
    customerPhone: '9845044321',
    items: [
      {
        productId: 'prod-cem-1',
        name: 'UltraTech Super Cement (PPC)',
        sku: 'CEM-ULT-PPC-50KG',
        quantity: 2,
        price: 395,
        returnReason: 'Bags punctured in transit and hardened due to moisture',
        productCondition: 'DAMAGED'
      }
    ],
    totalRefundAmount: 790,
    status: 'REFUNDED',
    pickupAddress: 'Site 44, 1st Main, HSR Layout Sector 2, Bengaluru 560102',
    requestedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    restockDecision: false
  },
  {
    id: 'ret-103',
    orderId: 'vo-102',
    orderNumber: 'BLD-2026-8945',
    vendorId: DEFAULT_VENDOR_ID,
    customerId: 'cust-9941',
    customerName: 'Maheshwari Infra',
    customerPhone: '9845055667',
    items: [
      {
        productId: 'prod-plumb-1',
        name: 'Astral CPVC PRO Class 1 Pipe (1 inch, 3m)',
        sku: 'PLM-AST-CPVC-1IN',
        quantity: 3,
        price: 440,
        returnReason: 'Excess quantity ordered on site estimation',
        productCondition: 'SEALED'
      }
    ],
    totalRefundAmount: 1320,
    status: 'INSPECTION_PENDING',
    pickupAddress: 'Commercial Site, Outer Ring Road, Mahadevapura, Bengaluru 560048',
    requestedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString()
  }
];

// Seed Promotions & Deals
export let vendorPromotions: VendorPromotion[] = [
  {
    id: 'promo-01',
    vendorId: DEFAULT_VENDOR_ID,
    title: 'Monsoon Foundation & Structural Cement Sale',
    description: 'Flat 8% instant discount on orders above 25 bags of UltraTech & ACC Cement.',
    discountType: 'PERCENTAGE',
    discountValue: 8,
    startDate: '2026-11-01T00:00:00Z',
    endDate: '2026-11-30T23:59:59Z',
    applicableProductIds: ['vp-prod-cem-1'],
    status: 'ACTIVE',
    bannerText: 'EXTRA 8% OFF ON 25+ BAGS',
    usageCount: 42,
    salesGenerated: 184500
  },
  {
    id: 'promo-02',
    vendorId: DEFAULT_VENDOR_ID,
    title: 'Whole-House Wiring Coil Bundle Savings',
    description: 'Flat ₹500 off when ordering 10 or more coils of FR wire.',
    discountType: 'FLAT',
    discountValue: 500,
    startDate: '2026-11-15T00:00:00Z',
    endDate: '2026-12-15T23:59:59Z',
    applicableProductIds: ['vp-prod-ele-1'],
    status: 'ACTIVE',
    bannerText: 'FLAT ₹500 OFF ON 10+ COILS',
    usageCount: 19,
    salesGenerated: 98000
  },
  {
    id: 'promo-03',
    vendorId: DEFAULT_VENDOR_ID,
    title: 'Diwali Site Prep Clearance',
    description: 'Exclusive 12% discount on BWP marine plywood sheets.',
    discountType: 'PERCENTAGE',
    discountValue: 12,
    startDate: '2026-10-15T00:00:00Z',
    endDate: '2026-11-05T23:59:59Z',
    applicableProductIds: ['vp-prod-ply-1'],
    status: 'EXPIRED',
    bannerText: 'DIWALI CLEARANCE 12% OFF',
    usageCount: 68,
    salesGenerated: 320000
  }
];

// Seed Product Reviews
export let vendorReviews: VendorProductReview[] = [
  {
    id: 'rev-01',
    productId: 'vp-prod-cem-1',
    productName: 'UltraTech Super Cement (PPC)',
    sku: 'CEM-ULT-PPC-50KG',
    customerName: 'Arjun Sharma (Site Engineer)',
    rating: 5,
    title: 'Fresh mill stock delivered in under 45 minutes',
    comment: 'Cement bags arrived completely dry with zero clumps or moisture damage. Initial setting time test was exactly 42 minutes, ideal for our slab casting work. 60-minute site delivery was seamless.',
    verifiedPurchase: true,
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    vendorReply: {
      message: 'Thank you Arjun! All our cement consignments are directly dispatched from authorized depot with mill test certificates.',
      repliedAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
      repliedBy: 'Vikramaditya Rao'
    }
  },
  {
    id: 'rev-02',
    productId: 'vp-prod-plumb-1',
    productName: 'Astral CPVC PRO Class 1 Pipe (1 inch, 3m)',
    sku: 'PLM-AST-CPVC-1IN',
    customerName: 'Naveen Contractors',
    rating: 5,
    title: 'Genuine Astral pipes with batch laser etching',
    comment: 'Uniform wall thickness and clean SDR 11 pressure rating. Zero defects on hydro testing at 18 bar pressure.',
    verifiedPurchase: true,
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    vendorReply: {
      message: 'Great to hear Naveen! We are an authorized Astral Gold distributor for Bengaluru West.',
      repliedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
      repliedBy: 'Vikramaditya Rao'
    }
  },
  {
    id: 'rev-03',
    productId: 'vp-prod-ele-1',
    productName: 'Finolex FR 2.5 sq mm PVC Insulated Copper Wire (90m)',
    sku: 'ELE-FIN-25-RED',
    customerName: 'Karthik Somayaji',
    rating: 4,
    title: 'Good quality original wire, fast dispatch',
    comment: 'Wire is flexible with genuine holographic seal. Packaging could have had additional bubble wrap for heavy site transport.',
    verifiedPurchase: true,
    createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
  }
];

// Seed GST Invoices
export let vendorInvoices: VendorInvoice[] = [
  {
    id: 'inv-1001',
    invoiceNumber: 'INV-BLD-2026-1001',
    orderId: 'vo-101',
    orderNumber: 'BLD-2026-8941',
    vendorId: DEFAULT_VENDOR_ID,
    customerName: 'Arjun Sharma',
    customerGstin: '29AAFCS8291K1Z5',
    invoiceDate: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    subtotal: 3950,
    discount: 0,
    taxableAmount: 3950,
    cgstAmount: 355.5,
    sgstAmount: 355.5,
    igstAmount: 0,
    totalAmount: 4661,
    pdfUrl: '/api/v1/vendor/invoices/inv-1001/download',
    status: 'GENERATED'
  },
  {
    id: 'inv-1002',
    invoiceNumber: 'INV-BLD-2026-1002',
    orderId: 'vo-102',
    orderNumber: 'BLD-2026-8942',
    vendorId: DEFAULT_VENDOR_ID,
    customerName: 'Suresh Kumar',
    customerGstin: '29AAACH1289P1Z8',
    invoiceDate: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    subtotal: 4400,
    discount: 220,
    taxableAmount: 4180,
    cgstAmount: 376.2,
    sgstAmount: 376.2,
    igstAmount: 0,
    totalAmount: 4932.4,
    pdfUrl: '/api/v1/vendor/invoices/inv-1002/download',
    status: 'PAID'
  }
];

// Seed Team & Employees (7 Roles)
let vendorEmployees: VendorEmployee[] = [
  {
    id: 'emp-01',
    vendorId: DEFAULT_VENDOR_ID,
    name: 'Vikramaditya Rao',
    email: 'vendor@buildora.in',
    phone: '9845012345',
    role: 'VENDOR_OWNER',
    status: 'ACTIVE',
    permissions: ['ALL_PERMISSIONS', 'FINANCE_FULL', 'TEAM_MANAGEMENT', 'STORE_SETTINGS'],
    invitedAt: '2026-01-10T09:00:00Z',
    lastLoginAt: new Date().toISOString()
  },
  {
    id: 'emp-02',
    vendorId: DEFAULT_VENDOR_ID,
    name: 'Ramesh Gowda',
    email: 'ramesh.gowda@supremebuild.com',
    phone: '9845012348',
    role: 'VENDOR_ADMIN',
    status: 'ACTIVE',
    permissions: ['CATALOG_EDIT', 'INVENTORY_MANAGE', 'ORDERS_MANAGE', 'WAREHOUSE_MANAGE'],
    invitedAt: '2026-01-12T10:00:00Z',
    lastLoginAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
  },
  {
    id: 'emp-03',
    vendorId: DEFAULT_VENDOR_ID,
    name: 'Priya Sundaram',
    email: 'priya.s@supremebuild.com',
    phone: '9845012349',
    role: 'INVENTORY_MANAGER',
    status: 'ACTIVE',
    permissions: ['INVENTORY_MANAGE', 'STOCK_INWARD', 'CYCLE_COUNT', 'WAREHOUSE_VIEW'],
    invitedAt: '2026-01-15T11:00:00Z',
    lastLoginAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString()
  },
  {
    id: 'emp-04',
    vendorId: DEFAULT_VENDOR_ID,
    name: 'Mohan Reddy',
    email: 'mohan.reddy@supremebuild.com',
    phone: '9845012350',
    role: 'ORDER_MANAGER',
    status: 'ACTIVE',
    permissions: ['ORDERS_MANAGE', 'DISPATCH_HANDOVER', 'PACKING_SLIPS', 'RETURNS_VIEW'],
    invitedAt: '2026-01-15T11:30:00Z',
    lastLoginAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString()
  },
  {
    id: 'emp-05',
    vendorId: DEFAULT_VENDOR_ID,
    name: 'Kavita Nair',
    email: 'kavita.nair@supremebuild.com',
    phone: '9845012351',
    role: 'FINANCE_MANAGER',
    status: 'ACTIVE',
    permissions: ['FINANCE_FULL', 'SETTLEMENTS_VIEW', 'INVOICES_EXPORT', 'TAX_DOCS'],
    invitedAt: '2026-01-18T14:00:00Z',
    lastLoginAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString()
  }
];

// Seed Support Tickets
export let vendorSupportTickets: VendorSupportTicket[] = [
  {
    id: 'tkt-01',
    ticketNumber: 'TKT-2026-891',
    vendorId: DEFAULT_VENDOR_ID,
    subject: 'Express dispatch bay access card for Whitefield Dark Store WH-BLR-02',
    category: 'DARK_STORE_LOGISTICS',
    priority: 'HIGH',
    description: 'Our EV mini-truck driver was delayed at gate 2 security check due to missing RFID delivery badge. Need authorized QR pass for priority 60-min intake.',
    status: 'IN_PROGRESS',
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    messages: [
      {
        id: 'msg-1',
        sender: 'Mohan Reddy',
        senderRole: 'VENDOR',
        text: 'Driver vehicle KA-04-MB-4819 needs fast-lane RFID tag for Whitefield depot intake.',
        timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'msg-2',
        sender: 'Sanjay Deshmukh',
        senderRole: 'SUPPORT_AGENT',
        text: 'Depot Operations manager has been informed. RFID sticker can be collected today from Gate 1 admin office.',
        timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
      }
    ]
  },
  {
    id: 'tkt-02',
    ticketNumber: 'TKT-2026-842',
    vendorId: DEFAULT_VENDOR_ID,
    subject: 'GST ITC Invoice GSTR-1 matching discrepancy for October batch',
    category: 'PAYMENT_SETTLEMENT',
    priority: 'MEDIUM',
    description: 'Invoice INV-BLD-2026-0812 reflected in portal with 18% GST but credit note dated 28th October needs to be reconciled.',
    status: 'RESOLVED',
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    messages: [
      {
        id: 'msg-3',
        sender: 'Kavita Nair',
        senderRole: 'VENDOR',
        text: 'Please reconcile credit note CN-2026-094 with final settlement payout ledger.',
        timestamp: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'msg-4',
        sender: 'Anita Roy',
        senderRole: 'SUPPORT_AGENT',
        text: 'Credit note has been matched and updated in November statement. Ledger updated.',
        timestamp: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
      }
    ]
  }
];

// Seed Notifications
export let vendorNotifications: VendorNotification[] = [
  {
    id: 'notif-1',
    vendorId: DEFAULT_VENDOR_ID,
    type: 'ORDER',
    title: 'New High-Value Order #BLD-2026-8941',
    message: 'Customer requested 60-min express dispatch for 10 bags of UltraTech PPC Cement.',
    read: false,
    actionUrl: '/orders',
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString()
  },
  {
    id: 'notif-2',
    vendorId: DEFAULT_VENDOR_ID,
    type: 'STOCK',
    title: 'Low Stock Alert: CPVC Hot & Cold Pipes',
    message: 'Current inventory has fallen below the safety threshold (12 units remaining).',
    read: false,
    actionUrl: '/inventory',
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
  },
  {
    id: 'notif-3',
    vendorId: DEFAULT_VENDOR_ID,
    type: 'SETTLEMENT',
    title: 'Payout Processed: ₹92,590 Credited',
    message: 'Settlement SETTL-BLD-09241 has been credited to your verified HDFC Bank account.',
    read: true,
    actionUrl: '/earnings',
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
  }
];

export function resolveVendorProductDisplayStatus(p: any): string {
  if (!p) return 'DRAFT';
  if (p.isSuspended === true) return 'SUSPENDED';
  if (p.approvalStatus === 'DRAFT') return 'DRAFT';
  if (p.approvalStatus === 'REJECTED') return 'REJECTED';
  if (p.approvalStatus === 'PENDING_APPROVAL') return 'PENDING_APPROVAL';
  if (p.isActive === false) return 'INACTIVE';
  const stockNum = Number(p.stockCount ?? p.stock ?? 0);
  if (stockNum <= 0 || p.inStock === false) return 'OUT_OF_STOCK';
  return 'ACTIVE';
}

export function syncVendorProductToCustomerCatalog(vp: VendorProduct) {
  const targetSku = vp.sku;
  const targetSlug = vp.slug;
  const targetId = vp.id.replace(/^vp-/, '');

  const vendor = vp.vendorId ? vendorRecords.get(vp.vendorId) : undefined;
  const vendorActive = !vendor || vendor.status === 'APPROVED' || (vendor.status as string) === 'ACTIVE';
  const anyVp = vp as any;
  const isApproved = vp.approvalStatus === 'APPROVED';
  const isPublic = isApproved && vp.isActive !== false && anyVp.isSuspended !== true && vendorActive;

  let custProd = dbStore.products.find(
    (p) => p.sku === targetSku || p.slug === targetSlug || p.id === targetId || p.id === vp.id
  ) as any;

  if (!isPublic) {
    if (custProd) {
      custProd.isActive = false;
      custProd.inStock = false;
      custProd.isSuspended = Boolean(anyVp.isSuspended);
      custProd.approvalStatus = vp.approvalStatus;
      custProd.stockCount = vp.stockCount;
    }
    return;
  }

  const effectiveAvailable = Math.max(0, Number(vp.stockCount || 0) - Number(anyVp.reservedStock || 0));
  const hierarchy = taxonomyService.resolveAndValidateProductTaxonomy(
    {
      mainCategoryId: anyVp.mainCategoryId || anyVp.mainCategorySlug,
      childCategoryId: anyVp.childCategoryId || anyVp.categoryId || vp.categorySlug || vp.category,
      productTypeId: anyVp.productTypeId || anyVp.subcategoryId || vp.subcategorySlug || vp.subcategory || anyVp.subCategory,
      brand: vp.brand,
      brandId: anyVp.brandId,
    },
    { strictChildMatch: false, tenantId: vp.tenantId }
  );
  const resolvedMainCategoryId = hierarchy.mainCategoryId || anyVp.mainCategoryId || '';
  const resolvedMainCategorySlug = hierarchy.mainCategorySlug || anyVp.mainCategorySlug || '';
  const resolvedMainCategoryName = hierarchy.mainCategoryName || anyVp.mainCategoryName || '';
  const resolvedCategoryId = hierarchy.childCategoryId || anyVp.childCategoryId || anyVp.categoryId || '';
  const resolvedCategoryName = hierarchy.childCategoryName || vp.category;
  const resolvedCategorySlug = hierarchy.childCategorySlug || vp.categorySlug;
  const resolvedSubcategoryId = hierarchy.productTypeId || anyVp.productTypeId || anyVp.subcategoryId || '';
  const resolvedSubcategoryName = hierarchy.productTypeName || vp.subcategory;
  const resolvedSubcategorySlug = hierarchy.productTypeSlug || vp.subcategorySlug;
  const resolvedBrandId = hierarchy.brandId || anyVp.brandId || '';

  if (custProd) {
    custProd.name = vp.name;
    custProd.description = vp.description;
    custProd.images = vp.images;
    custProd.price = vp.price;
    custProd.mrp = vp.mrp;
    custProd.discount = vp.discount;
    custProd.mainCategoryId = resolvedMainCategoryId;
    custProd.mainCategorySlug = resolvedMainCategorySlug;
    custProd.mainCategoryName = resolvedMainCategoryName;
    custProd.childCategoryId = resolvedCategoryId;
    custProd.childCategorySlug = resolvedCategorySlug;
    custProd.childCategoryName = resolvedCategoryName;
    custProd.productTypeId = resolvedSubcategoryId;
    custProd.productTypeSlug = resolvedSubcategorySlug;
    custProd.productTypeName = resolvedSubcategoryName;
    custProd.brandId = resolvedBrandId;
    custProd.categoryId = resolvedCategoryId;
    custProd.category = resolvedCategoryName;
    custProd.categorySlug = resolvedCategorySlug;
    custProd.subcategoryId = resolvedSubcategoryId;
    custProd.subcategory = resolvedSubcategoryName;
    custProd.subcategorySlug = resolvedSubcategorySlug;
    custProd.stockCount = vp.stockCount;
    custProd.reservedStock = anyVp.reservedStock || 0;
    custProd.moq = anyVp.moq ?? 1;
    custProd.categoryAttributes = anyVp.categoryAttributes || {};
    custProd.inStock = effectiveAvailable > 0;
    custProd.isActive = true;
    custProd.isSuspended = false;
    custProd.approvalStatus = 'APPROVED';
    custProd.vendorId = vp.vendorId;
    custProd.vendorName = vendor?.storeName || vendor?.businessInfo?.businessName || 'Buildora Verified Supplier';
    if (vp.brand) {
      custProd.brand = vp.brand;
      custProd.brandSlug = (vp.brandSlug || vp.brand).toLowerCase().replace(/\s+/g, '-');
    }
    if (vp.unit) custProd.unit = vp.unit;
    if (vp.packSize) custProd.packSize = vp.packSize;
    if (vp.isNewLaunch !== undefined) {
      custProd.isNewLaunch = vp.isNewLaunch;
    }
    if (anyVp.newLaunchCollectionId !== undefined) {
      custProd.newLaunchCollectionId = anyVp.newLaunchCollectionId || undefined;
      custProd.newLaunchCollectionSlug = anyVp.newLaunchCollectionSlug || undefined;
      custProd.newLaunchCollectionTitle = anyVp.newLaunchCollectionTitle || undefined;
      if (anyVp.newLaunchCollectionId) custProd.isNewLaunch = true;
    }
    if (vp.specifications) {
      custProd.specifications = {
        ...custProd.specifications,
        ...vp.specifications
      };
    }
    if (vp.productType) {
      custProd.specifications = {
        ...custProd.specifications,
        'Type': vp.productType,
        'Product Type': vp.productType
      };
      custProd.productType = vp.productType;
    }
    if (vp.size) {
      custProd.specifications = {
        ...custProd.specifications,
        'Size': vp.size
      };
      custProd.size = vp.size;
    }
    if (vp.variants && vp.variants.length > 0) {
      custProd.variants = vp.variants;
    }
    if (vp.attributes && vp.attributes.length > 0) {
      custProd.attributes = vp.attributes;
    }
    if (vp.bulkPricing) {
      custProd.bulkPricing = vp.bulkPricing;
    }
    if (vp.isBulkEligible !== undefined) {
      custProd.isBulkEligible = vp.isBulkEligible;
    }
  } else {
    const specs: Record<string, string> = { ...(vp.specifications || {}) };
    if (vp.productType) {
      specs['Type'] = vp.productType;
      specs['Product Type'] = vp.productType;
    }
    if (vp.size) {
      specs['Size'] = vp.size;
    }
    const newCustomerProd: Product & Record<string, any> = {
      id: targetId,
      vendorId: vp.vendorId,
      vendorName: vendor?.storeName || vendor?.businessInfo?.businessName || 'Buildora Verified Supplier',
      approvalStatus: 'APPROVED',
      isActive: true,
      isSuspended: false,
      reservedStock: anyVp.reservedStock || 0,
      name: vp.name,
      slug: vp.slug,
      sku: vp.sku,
      brand: vp.brand,
      brandId: resolvedBrandId,
      brandSlug: vp.brandSlug,
      mainCategoryId: resolvedMainCategoryId,
      mainCategorySlug: resolvedMainCategorySlug,
      mainCategoryName: resolvedMainCategoryName,
      childCategoryId: resolvedCategoryId,
      childCategorySlug: resolvedCategorySlug,
      childCategoryName: resolvedCategoryName,
      productTypeId: resolvedSubcategoryId,
      productTypeSlug: resolvedSubcategorySlug,
      productTypeName: resolvedSubcategoryName,
      categoryId: resolvedCategoryId,
      category: resolvedCategoryName,
      categorySlug: resolvedCategorySlug,
      subcategoryId: resolvedSubcategoryId,
      subcategory: resolvedSubcategoryName,
      subcategorySlug: resolvedSubcategorySlug,
      description: vp.description,
      shortDescription: vp.shortDescription,
      images: vp.images,
      price: vp.price,
      mrp: vp.mrp,
      discount: vp.discount,
      unit: vp.unit,
      packSize: vp.packSize || vp.size,
      gstRate: vp.gstRate,
      rating: vp.rating,
      reviewCount: vp.reviewCount,
      inStock: effectiveAvailable > 0,
      stockCount: vp.stockCount,
      moq: anyVp.moq ?? 1,
      isBulkEligible: vp.isBulkEligible,
      isNewLaunch: Boolean(vp.isNewLaunch || anyVp.newLaunchCollectionId),
      newLaunchCollectionId: anyVp.newLaunchCollectionId || undefined,
      newLaunchCollectionSlug: anyVp.newLaunchCollectionSlug || undefined,
      newLaunchCollectionTitle: anyVp.newLaunchCollectionTitle || undefined,
      bulkPricing: vp.bulkPricing,
      variants: vp.variants,
      attributes: vp.attributes,
      categoryAttributes: anyVp.categoryAttributes || {},
      specifications: specs,
      deliverySpeedAvailable: vp.deliverySpeedAvailable,
      applications: [],
      installationTips: [],
      safetyInstructions: []
    };
    if (vp.productType) newCustomerProd.productType = vp.productType;
    if (vp.size) newCustomerProd.size = vp.size;
    dbStore.products.unshift(newCustomerProd);
  }
}

@Controller('api/v1/vendor')
export class VendorController implements OnModuleInit {
  async onModuleInit() {
    await vendorPersistenceService.loadAllVendorsIntoMap(vendorRecords);

    const mergeById = <T extends { id: string }>(target: T[], loaded: T[]) => {
      if (!loaded.length) return;
      const seen = new Set(target.map((x) => x.id));
      for (const item of loaded) {
        if (!seen.has(item.id)) {
          target.unshift(item);
        } else {
          const idx = target.findIndex((x) => x.id === item.id);
          if (idx >= 0) target[idx] = { ...target[idx], ...item };
        }
      }
    };

    const [pProducts, pMovements, pWarehouses, pOrders, pReturns, pSettlements, pTickets, pPromotions, pReviews, pInvoices, pShipments] =
      await Promise.all([
        platformPersistenceService.loadAll<VendorProduct>(PlatformProductModel),
        platformPersistenceService.loadAll<VendorStockMovement>(PlatformStockMovementModel),
        platformPersistenceService.loadAll<VendorWarehouse>(PlatformWarehouseModel),
        platformPersistenceService.loadAll<VendorOrder>(PlatformOrderModel),
        platformPersistenceService.loadAll<VendorReturnRequest>(PlatformReturnModel),
        platformPersistenceService.loadAll<VendorSettlement>(PlatformSettlementModel),
        platformPersistenceService.loadAll<VendorSupportTicket>(PlatformSupportTicketModel),
        platformPersistenceService.loadAll<VendorPromotion>(PlatformPromotionModel),
        platformPersistenceService.loadAll<VendorProductReview>(PlatformReviewModel),
        platformPersistenceService.loadAll<VendorInvoice>(VendorInvoiceModel),
        platformPersistenceService.loadAll<any>(PlatformShipmentModel),
      ]);

    mergeById(vendorProducts, pProducts);
    mergeById(vendorStockMovements, pMovements);
    mergeById(vendorWarehouses, pWarehouses);
    mergeById(vendorOrders, pOrders.filter((o: any) => o.vendorId));
    mergeById(vendorReturns, pReturns);
    mergeById(vendorSettlements, pSettlements);
    mergeById(vendorSupportTickets, pTickets);
    mergeById(vendorPromotions, pPromotions);
    mergeById(vendorReviews, pReviews);
    mergeById(vendorInvoices, pInvoices);
    mergeById(dbStore.shipments, pShipments);

    gstInvoiceService.registerStores(
      (vendorId: string) => vendorRecords.get(vendorId),
      () => vendorInvoices
    );

    fulfilmentLifecycleService.registerStores({
      getVendorOrders: () => vendorOrders,
      getVendorProducts: () => vendorProducts,
      getVendorRecords: () => vendorRecords,
      getVendorWarehouses: () => vendorWarehouses,
      getVendorInvoices: () => vendorInvoices,
      releaseStockForVendorOrder: async (vo, _reason) => {
        const custOrder = dbStore.orders.find((o) => o.orderNumber === vo.orderNumber);
        if (custOrder && (custOrder as any).stockReserved) {
          await orderSyncService.releaseOrderStock(
            (vo.items || []).map((i: any) => ({ productId: i.productId, sku: i.sku, quantity: i.quantity, name: i.name })),
            vo.orderNumber
          );
        }
      },
      ensureFinancials: async (vo, masterOrder) => {
        await orderSyncService.ensureDeliveredFinancials(vo, masterOrder);
      },
    });

    taxonomyService.migrateLegacyCatalogRecords(vendorProducts);

    for (const vp of vendorProducts) {
      syncVendorProductToCustomerCatalog(vp);
    }
  }

  // ==========================================
  // 1. AUTHENTICATION & SECURITY
  // ==========================================

  @Post('auth/send-otp')
  async sendOtp(
    @Body() body: { identifier: string; type: 'REGISTRATION_EMAIL' | 'REGISTRATION_MOBILE' | 'LOGIN' | 'PASSWORD_RESET' }
  ) {
    const { identifier, type } = body;
    if (!identifier || !type) {
      throw new BadRequestException('Identifier (email or mobile) and verification type are required.');
    }

    let normalized = String(identifier).trim();

    if (type === 'REGISTRATION_EMAIL') {
      const emailCheck = validateEmail(normalized);
      if (!emailCheck.isValid) {
        throw new BadRequestException({
          message: emailCheck.error || 'Please enter a valid business email address.',
          errors: { email: emailCheck.error || 'Please enter a valid business email address.' }
        });
      }
      normalized = emailCheck.normalized || normalized.toLowerCase();
    } else if (type === 'REGISTRATION_MOBILE') {
      const phoneCheck = validateIndianMobile(normalized);
      if (!phoneCheck.isValid) {
        throw new BadRequestException({
          message: phoneCheck.error || 'Enter a valid 10-digit mobile number starting with 6–9.',
          errors: { phone: phoneCheck.error || 'Enter a valid 10-digit mobile number starting with 6–9.' }
        });
      }
      normalized = phoneCheck.normalized || normalized;
    } else if (type === 'LOGIN' || type === 'PASSWORD_RESET') {
      const identCheck = validateIdentifier(normalized);
      if (!identCheck.isValid) {
        throw new BadRequestException(identCheck.error || 'Enter a valid business email or 10-digit mobile number.');
      }
      normalized = identCheck.normalized || normalized.toLowerCase();
    }

    const clean = normalized.toLowerCase();

    // For LOGIN or PASSWORD_RESET, verify that vendor exists
    if (type === 'LOGIN' || type === 'PASSWORD_RESET') {
      const vendor = findVendorByIdentifier(clean);
      if (!vendor) {
        throw new NotFoundException(`No registered vendor account found for "${identifier}".`);
      }
      if (vendor.status === 'SUSPENDED') {
        throw new HttpException(
          {
            success: false,
            message: 'This vendor account is suspended. Please contact Buildora Compliance Support.',
            status: 'SUSPENDED'
          },
          HttpStatus.FORBIDDEN
        );
      }
      vendorSecurityService.checkLoginLockout(clean);
    }

    // For registration email/phone, check if already in use
    if (type === 'REGISTRATION_EMAIL' || type === 'REGISTRATION_MOBILE') {
      const existing = findVendorByIdentifier(clean);
      if (existing && existing.status !== 'DRAFT') {
        throw new BadRequestException(
          `An account with this ${type === 'REGISTRATION_EMAIL' ? 'email' : 'mobile number'} already exists. Please sign in instead.`
        );
      }
    }

    const result = vendorSecurityService.generateAndStoreOtp(clean, type);

    let delivery: { delivered: boolean; provider: string; reason?: string } = {
      delivered: false,
      provider: 'DEV_CONSOLE'
    };

    if (type === 'REGISTRATION_EMAIL' || (type === 'PASSWORD_RESET' && clean.includes('@'))) {
      delivery = await vendorNotificationService.sendOtpEmail(clean, result.otpForDelivery);
    } else if (type === 'REGISTRATION_MOBILE' || (type === 'PASSWORD_RESET' && !clean.includes('@')) || type === 'LOGIN') {
      if (clean.includes('@')) {
        delivery = await vendorNotificationService.sendOtpEmail(clean, result.otpForDelivery);
      } else {
        delivery = await vendorNotificationService.sendOtpSms(clean, result.otpForDelivery);
      }
    }

    const devOtpHint =
      result.devOtpHint || (delivery.provider === 'DUMMY_OTP' ? result.otpForDelivery : undefined);

    return {
      success: true,
      message: result.message,
      cooldownSeconds: result.cooldownSeconds,
      deliveryProvider: delivery.provider,
      ...(devOtpHint ? { devOtpHint } : {})
    };
  }

  @Post('auth/verify-otp')
  verifyOtp(
    @Body() body: { identifier: string; type: 'REGISTRATION_EMAIL' | 'REGISTRATION_MOBILE' | 'LOGIN' | 'PASSWORD_RESET'; otp: string }
  ) {
    const { identifier, type, otp } = body;
    if (!identifier || !type || !otp) {
      throw new BadRequestException('Identifier, verification type, and OTP code are required.');
    }

    if (type === 'REGISTRATION_EMAIL') {
      const emailCheck = validateEmail(identifier);
      if (!emailCheck.isValid) {
        throw new BadRequestException(emailCheck.error || 'Enter a valid business email address.');
      }
    } else if (type === 'REGISTRATION_MOBILE') {
      const phoneCheck = validateIndianMobile(identifier);
      if (!phoneCheck.isValid) {
        throw new BadRequestException(phoneCheck.error || 'Enter a valid 10-digit mobile number starting with 6–9.');
      }
    }

    if (!/^\d{6}$/.test(String(otp).trim())) {
      throw new BadRequestException('Verification code must be exactly 6 digits.');
    }

    const isValid = vendorSecurityService.verifyOtp(identifier, type, otp);
    return {
      success: true,
      message: 'Verification code verified successfully.',
      isVerified: isValid
    };
  }

  @Post('auth/login')
  async login(@Body() body: { identifier: string; password?: string; rememberMe?: boolean }) {
    const { identifier, password } = body;
    if (!identifier || !password) {
      throw new BadRequestException('Registered email/mobile and password are required.');
    }

    const identCheck = validateIdentifier(identifier);
    if (!identCheck.isValid) {
      throw new BadRequestException(identCheck.error || 'Please enter a valid registered email or 10-digit mobile number.');
    }

    const clean = identifier.trim().toLowerCase();

    // 1. Check account lockout
    vendorSecurityService.checkLoginLockout(clean);

    // 2. Find vendor
    const vendor = findVendorByIdentifier(clean);
    if (!vendor) {
      const lockResult = vendorSecurityService.recordFailedLogin(clean);
      throw new UnauthorizedException(
        lockResult.isLocked
          ? 'Account is temporarily locked due to 5 consecutive failed login attempts. Please try again after 15 minutes or reset your password.'
          : `Invalid email/mobile or password. ${lockResult.remainingAttempts} attempt(s) remaining before temporary account lockout.`
      );
    }

    // 3. Verify password hash using PBKDF2
    const passwordMatch = vendorSecurityService.verifyPassword(password, vendor.passwordHash);
    if (!passwordMatch) {
      const lockResult = vendorSecurityService.recordFailedLogin(clean);
      throw new UnauthorizedException(
        lockResult.isLocked
          ? 'Account is temporarily locked due to 5 consecutive failed login attempts. Please try again after 15 minutes or reset your password.'
          : `Invalid credentials. ${lockResult.remainingAttempts} attempt(s) remaining before temporary account lockout.`
      );
    }

    // 4. Successful login: clear failed attempts
    vendorSecurityService.clearLoginAttempts(clean);

    // 5. Generate secure JWT tokens
    const tokens = vendorSecurityService.generateTokens(vendor.id, vendor.email);
    vendor.refreshToken = tokens.refreshToken;
    await vendorPersistenceService.saveVendorRecord(vendor);
    const redirectTo = getVendorRedirectUrl(vendor.status, vendor.applicationId);

    return {
      success: true,
      message: `Welcome back, ${vendor.storeName || vendor.name}!`,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      status: vendor.status,
      redirectTo,
      vendor: serializeVendorProfile(vendor)
    };
  }

  @Post('auth/login-otp')
  async loginWithOtp(@Body() body: { identifier: string; otp: string }) {
    const { identifier, otp } = body;
    if (!identifier || !otp) {
      throw new BadRequestException('Identifier and OTP code are required.');
    }

    const identCheck = validateIdentifier(identifier);
    if (!identCheck.isValid) {
      throw new BadRequestException(identCheck.error || 'Please enter a valid registered email or 10-digit mobile number.');
    }

    if (!/^\d{6}$/.test(otp.trim())) {
      throw new BadRequestException('Verification code must be exactly 6 digits.');
    }

    const clean = identifier.trim().toLowerCase();
    vendorSecurityService.checkLoginLockout(clean);

    const vendor = findVendorByIdentifier(clean);
    if (!vendor) {
      throw new NotFoundException(`No registered vendor account found for "${identifier}".`);
    }

    // Verify OTP
    vendorSecurityService.verifyOtp(clean, 'LOGIN', otp);
    vendorSecurityService.consumeOtp(clean, 'LOGIN');
    vendorSecurityService.clearLoginAttempts(clean);

    const tokens = vendorSecurityService.generateTokens(vendor.id, vendor.email);
    vendor.refreshToken = tokens.refreshToken;
    await vendorPersistenceService.saveVendorRecord(vendor);
    const redirectTo = getVendorRedirectUrl(vendor.status, vendor.applicationId);

    return {
      success: true,
      message: `Signed in successfully with verified mobile code.`,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      status: vendor.status,
      redirectTo,
      vendor: serializeVendorProfile(vendor)
    };
  }

  @Post('auth/forgot-password/send-otp')
  forgotPasswordSendOtp(@Body() body: { identifier: string }) {
    const { identifier } = body;
    if (!identifier) {
      throw new BadRequestException('Registered business email or mobile number is required.');
    }

    const identCheck = validateIdentifier(identifier);
    if (!identCheck.isValid) {
      throw new BadRequestException(identCheck.error || 'Please enter a valid registered email or 10-digit mobile number.');
    }

    const clean = identifier.trim().toLowerCase();
    const vendor = findVendorByIdentifier(clean);
    if (!vendor) {
      throw new NotFoundException(`No registered vendor account found for "${identifier}".`);
    }

    const result = vendorSecurityService.generateAndStoreOtp(clean, 'PASSWORD_RESET');
    const providerStatus = vendorNotificationService.getOtpProviderStatus();
    const exposeDummy = !providerStatus.emailConfigured && !providerStatus.smsConfigured;
    const devOtpHint = result.devOtpHint || (exposeDummy ? result.otpForDelivery : undefined);
    return {
      ...result,
      ...(devOtpHint ? { devOtpHint } : {})
    };
  }

  @Post('auth/forgot-password/reset')
  forgotPasswordReset(
    @Body() body: { identifier: string; otp: string; newPassword: string; confirmPassword: string }
  ) {
    const { identifier, otp, newPassword, confirmPassword } = body;
    if (!identifier || !otp || !newPassword || !confirmPassword) {
      throw new BadRequestException('Identifier, OTP code, new password, and confirmation are required.');
    }

    const identCheck = validateIdentifier(identifier);
    if (!identCheck.isValid) {
      throw new BadRequestException(identCheck.error || 'Please enter a valid registered email or 10-digit mobile number.');
    }

    if (!/^\d{6}$/.test(otp.trim())) {
      throw new BadRequestException('Verification code must be exactly 6 digits.');
    }

    const passCheck = validatePassword(newPassword);
    if (!passCheck.isValid) {
      throw new BadRequestException(passCheck.error || 'Password does not meet security requirements.');
    }

    const confirmCheck = validateConfirmPassword(newPassword, confirmPassword);
    if (!confirmCheck.isValid) {
      throw new BadRequestException(confirmCheck.error || 'New password and confirm password do not match.');
    }

    const clean = identifier.trim().toLowerCase();
    const vendor = findVendorByIdentifier(clean);
    if (!vendor) {
      throw new NotFoundException(`Vendor account not found for "${identifier}".`);
    }

    // 1. Verify OTP code
    vendorSecurityService.verifyOtp(clean, 'PASSWORD_RESET', otp);

    // 2. Validate password complexity
    const strength = vendorSecurityService.validatePasswordStrength(newPassword);
    if (!strength.isValid) {
      throw new BadRequestException(strength.message);
    }

    // 3. Update password hash
    vendor.passwordHash = vendorSecurityService.hashPassword(newPassword);
    vendor.failedLoginAttempts = 0;
    vendor.lockedUntil = 0;
    vendor.updatedAt = new Date().toISOString();

    // 4. Invalidate single-use OTP & clear lockout
    vendorSecurityService.consumeOtp(clean, 'PASSWORD_RESET');
    vendorSecurityService.clearLoginAttempts(clean);

    // 5. Audit log & notification
    if (!vendor.auditLogs) vendor.auditLogs = [];
    vendor.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      action: 'PASSWORD_RESET',
      performedBy: vendor.email,
      performedAt: new Date().toISOString(),
      details: 'Password was successfully reset using verified OTP code.'
    });

    vendorNotificationService.notify(
      vendor.id,
      'PASSWORD_RESET',
      'Password Reset Successful',
      'Your vendor portal password has been successfully reset. If you did not perform this action, please alert Buildora Security immediately.',
      '/login',
      { email: vendor.email, phone: vendor.phone }
    );

    return {
      success: true,
      message: 'Password reset successfully. You can now sign in with your new password.'
    };
  }

  @Get('auth/me')
  async getProfile(@Headers('authorization') authHeader?: string) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    return {
      success: true,
      status: vendor.status,
      redirectTo: getVendorRedirectUrl(vendor.status, vendor.applicationId),
      vendor: serializeVendorProfile(vendor)
    };
  }

  @Post('auth/refresh')
  async refreshSession(
    @Body() body: { refreshToken?: string },
    @Headers('x-refresh-token') headerRefreshToken?: string
  ) {
    const incomingToken = (body?.refreshToken || headerRefreshToken || '').trim();
    if (!incomingToken) {
      throw new UnauthorizedException('Refresh token is required.');
    }

    let matched: BackendVendorRecord | undefined;
    for (const v of vendorRecords.values()) {
      if (v.refreshToken && v.refreshToken === incomingToken) {
        matched = v;
        break;
      }
    }

    if (!matched) {
      const fromDb = await vendorPersistenceService.loadVendorByRefreshToken(incomingToken, vendorRecords);
      if (fromDb) {
        matched = fromDb as BackendVendorRecord;
      }
    }

    if (!matched) {
      throw new UnauthorizedException('Invalid or expired refresh token. Please sign in again.');
    }

    const tokens = vendorSecurityService.generateTokens(matched.id, matched.email);
    matched.refreshToken = tokens.refreshToken;
    matched.updatedAt = new Date().toISOString();
    await vendorPersistenceService.saveVendorRecord(matched);

    return {
      success: true,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      status: matched.status,
      redirectTo: getVendorRedirectUrl(matched.status, matched.applicationId),
      vendor: serializeVendorProfile(matched)
    };
  }

  @Post('auth/logout')
  async logout(@Headers('authorization') authHeader?: string) {
    const vendor = getAuthenticatedVendor(authHeader);
    if (vendor) {
      vendor.refreshToken = undefined;
      await vendorPersistenceService.saveVendorRecord(vendor);
    }
    return {
      success: true,
      message: 'Vendor logged out successfully'
    };
  }

  // ==========================================
  // 2. VENDOR REGISTRATION WIZARD (STEPS 1 TO 5)
  // ==========================================

  @Post('registration/step1')
  registrationStep1(
    @Body()
    body: {
      ownerName: string;
      email: string;
      phone: string;
      password: string;
      confirmPassword: string;
    }
  ) {
    const { ownerName, email, phone, password, confirmPassword } = body;

    const step1Check = validateVendorStep1({ ownerName, email, phone, password, confirmPassword });
    if (!step1Check.isValid) {
      const firstError = Object.values(step1Check.errors)[0] || 'Invalid account registration details.';
      throw new BadRequestException({
        message: firstError,
        errors: step1Check.errors
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    // Check duplicate email or phone among active/submitted vendors
    const existingEmail = findVendorByIdentifier(cleanEmail);
    if (existingEmail && existingEmail.status !== 'DRAFT') {
      throw new BadRequestException({
        message: 'This business email is already registered with another vendor partner.',
        errors: { email: 'This business email is already registered with another vendor partner.' }
      });
    }

    const existingPhone = findVendorByIdentifier(cleanPhone);
    if (existingPhone && existingPhone.status !== 'DRAFT') {
      throw new BadRequestException({
        message: 'This mobile number is already registered with another vendor partner.',
        errors: { phone: 'This mobile number is already registered with another vendor partner.' }
      });
    }

    // Create or update DRAFT vendor record
    const draftId = existingEmail?.id || `vnd-reg-${Date.now()}`;
    const cleanOwnerName = ownerName.trim();
    const newDraft: BackendVendorRecord = {
      id: draftId,
      tenantId: DEFAULT_TENANT_ID,
      status: 'DRAFT',
      rating: 0,
      productCount: 0,
      orderCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      storeName: '',
      name: cleanOwnerName,
      email: cleanEmail,
      phone: cleanPhone,
      passwordHash: vendorSecurityService.hashPassword(password),
      failedLoginAttempts: 0,
      lockedUntil: 0,
      isEmailVerified: true,
      isPhoneVerified: true,
      registrationStep: 2,
      businessInfo: {
        businessName: '',
        contactPerson: cleanOwnerName,
        phone: cleanPhone,
        email: cleanEmail,
        businessType: 'PROPRIETORSHIP',
        address: {
          building: '',
          street: '',
          area: '',
          city: '',
          state: '',
          pincode: '',
          country: 'India'
        },
        bankDetails: {
          accountHolderName: '',
          bankName: '',
          accountNumber: '',
          ifsc: '',
          branch: '',
          isVerified: false
        },
        categories: [],
        storeName: ''
      },
      warehouses: [],
      kycDocuments: [],
      auditLogs: [
        {
          id: `audit-${Date.now()}`,
          action: 'DRAFT_ACCOUNT_CREATED',
          performedBy: ownerName,
          performedAt: new Date().toISOString(),
          details: 'Account credentials and contact verification initiated.'
        }
      ]
    };

    vendorRecords.set(draftId, newDraft);
    void vendorPersistenceService.saveVendorRecord(newDraft);

    const tokens = vendorSecurityService.generateTokens(newDraft.id, newDraft.email);

    return {
      success: true,
      message: 'Account credentials registered. Please proceed to Step 2: Business Information.',
      vendorId: newDraft.id,
      step: 2,
      token: tokens.accessToken,
      vendor: newDraft
    };
  }

  @Put('registration/save-draft')
  async saveRegistrationDraft(
    @Body() body: { vendorId?: string; wizardData: Partial<VendorRegistrationWizardData>; currentStep: number },
    @Headers('authorization') authHeader?: string
  ) {
    const vendor = body.vendorId ? vendorRecords.get(body.vendorId) : getVendorFromAuthHeader(authHeader);
    if (!vendor) {
      throw new NotFoundException('Vendor registration session not found.');
    }

    const { wizardData, currentStep } = body;

    // Validate any populated fields before persisting draft to prevent malformed data in MongoDB
    if (wizardData) {
      const draftErrors: Record<string, string> = {};
      if (wizardData.ownerName) {
        const res = validateName(wizardData.ownerName, 'Owner / Authorized Person Full Name');
        if (!res.isValid && res.error) draftErrors.ownerName = res.error;
      }
      if (wizardData.email) {
        const res = validateEmail(wizardData.email);
        if (!res.isValid && res.error) draftErrors.email = res.error;
      }
      if (wizardData.phone) {
        const res = validateIndianMobile(wizardData.phone);
        if (!res.isValid && res.error) draftErrors.phone = res.error;
      }
      if (wizardData.legalBusinessName) {
        const res = validateLegalBusinessName(wizardData.legalBusinessName);
        if (!res.isValid && res.error) draftErrors.legalBusinessName = res.error;
      }
      if (wizardData.storeName) {
        const res = validateStoreName(wizardData.storeName);
        if (!res.isValid && res.error) draftErrors.storeName = res.error;
      }
      if (wizardData.businessType) {
        const res = validateBusinessType(wizardData.businessType);
        if (!res.isValid && res.error) draftErrors.businessType = res.error;
      }
      if (wizardData.businessRegistrationType) {
        const res = validateBusinessRegistrationType(wizardData.businessRegistrationType);
        if (!res.isValid && res.error) draftErrors.businessRegistrationType = res.error;
      }
      if (wizardData.yearOfEstablishment) {
        const res = validateYearOfEstablishment(wizardData.yearOfEstablishment);
        if (!res.isValid && res.error) draftErrors.yearOfEstablishment = res.error;
      }
      if (wizardData.website) {
        const res = validateWebsite(wizardData.website);
        if (!res.isValid && res.error) draftErrors.website = res.error;
      }
      if (wizardData.description) {
        const res = validateBusinessDescription(wizardData.description);
        if (!res.isValid && res.error) draftErrors.description = res.error;
      }
      if (wizardData.pincode) {
        const res = validatePincode(wizardData.pincode);
        if (!res.isValid && res.error) draftErrors.pincode = res.error;
      }
      if (wizardData.state) {
        const res = validateCityOrState(wizardData.state, 'State');
        if (!res.isValid && res.error) draftErrors.state = res.error;
      }
      if (wizardData.city) {
        const res = validateCityOrState(wizardData.city, 'City / Region');
        if (!res.isValid && res.error) draftErrors.city = res.error;
      }
      if (wizardData.completeAddress) {
        const res = validateAddress(wizardData.completeAddress);
        if (!res.isValid && res.error) draftErrors.completeAddress = res.error;
      }
      if (wizardData.aadhaarNumber) {
        const res = validateAadhaar(wizardData.aadhaarNumber);
        if (!res.isValid && res.error) draftErrors.aadhaarNumber = res.error;
      }
      if (wizardData.gstStatus) {
        const gs = String(wizardData.gstStatus).trim().toUpperCase();
        if (!ALLOWED_GST_STATUSES.includes(gs as any)) {
          draftErrors.gstStatus = 'Please select a valid GST Registration Status.';
        }
      }
      if (wizardData.gstin && (!wizardData.gstStatus || wizardData.gstStatus === 'REGISTERED')) {
        const res = validateGSTIN(wizardData.gstin);
        if (!res.isValid && res.error) draftErrors.gstin = res.error;
      }
      if (wizardData.gstStatus === 'APPLIED' && wizardData.gstApplicationNumber) {
        const res = validateApplicationReference(
          wizardData.gstApplicationNumber,
          'GST Application / ARN Reference Number'
        );
        if (!res.isValid && res.error) draftErrors.gstApplicationNumber = res.error;
      }
      if (wizardData.pan) {
        const res = validatePAN(wizardData.pan);
        if (!res.isValid && res.error) draftErrors.pan = res.error;
      }
      if (wizardData.msmeStatus) {
        const ms = String(wizardData.msmeStatus).trim().toUpperCase();
        if (!ALLOWED_MSME_STATUSES.includes(ms as any)) {
          draftErrors.msmeStatus = 'Please select a valid MSME Status.';
        }
      }
      if (wizardData.udyamNumber && wizardData.msmeStatus === 'REGISTERED') {
        const res = validateUdyamNumber(wizardData.udyamNumber);
        if (!res.isValid && res.error) draftErrors.udyamNumber = res.error;
      }
      if (wizardData.msmeStatus === 'APPLIED' && wizardData.msmeApplicationNumber) {
        const res = validateApplicationReference(
          wizardData.msmeApplicationNumber,
          'MSME Application Reference Number'
        );
        if (!res.isValid && res.error) draftErrors.msmeApplicationNumber = res.error;
      }
      if (wizardData.bankDetails) {
        if (wizardData.bankDetails.accountHolderName) {
          const res = validateName(wizardData.bankDetails.accountHolderName, 'Account Beneficiary Name');
          if (!res.isValid && res.error) draftErrors.accountHolderName = res.error;
        }
        if (wizardData.bankDetails.bankName) {
          const res = validateBankName(wizardData.bankDetails.bankName);
          if (!res.isValid && res.error) draftErrors.bankName = res.error;
        }
        if (wizardData.bankDetails.accountNumber) {
          const res = validateBankAccount(wizardData.bankDetails.accountNumber);
          if (!res.isValid && res.error) draftErrors.accountNumber = res.error;
        }
        if (wizardData.bankDetails.ifsc) {
          const res = validateIFSC(wizardData.bankDetails.ifsc);
          if (!res.isValid && res.error) draftErrors.ifsc = res.error;
        }
        if (wizardData.bankDetails.accountType) {
          const res = validateBankAccountType(wizardData.bankDetails.accountType);
          if (!res.isValid && res.error) draftErrors.accountType = res.error;
        }
      }

      if (Object.keys(draftErrors).length > 0) {
        const firstError = Object.values(draftErrors)[0];
        throw new BadRequestException({
          message: firstError,
          errors: draftErrors
        });
      }
    }

    vendor.registrationStep = currentStep || vendor.registrationStep || 2;
    vendor.updatedAt = new Date().toISOString();

    if (wizardData) {
      vendor.registrationData = {
        ...(vendor.registrationData || {}),
        ...wizardData
      };

      if (wizardData.legalBusinessName) vendor.businessInfo.businessName = wizardData.legalBusinessName;
      if (wizardData.ownerName) {
        vendor.name = wizardData.ownerName.trim();
        vendor.businessInfo.contactPerson = wizardData.ownerName.trim();
      }
      if (wizardData.storeName) {
        vendor.storeName = wizardData.storeName;
        vendor.businessInfo.storeName = wizardData.storeName;
      }
      if (wizardData.businessType) vendor.businessInfo.businessType = wizardData.businessType as any;
      if (wizardData.businessRegistrationType) {
        vendor.businessInfo.businessRegistrationType = wizardData.businessRegistrationType;
      }
      if (wizardData.yearOfEstablishment !== undefined) {
        vendor.businessInfo.yearOfEstablishment = wizardData.yearOfEstablishment;
      }
      if (wizardData.website !== undefined) {
        vendor.businessInfo.website = wizardData.website;
      }
      if (wizardData.description !== undefined) vendor.businessInfo.description = wizardData.description;
      if (wizardData.logoUrl !== undefined) {
        vendor.logoUrl = wizardData.logoUrl || undefined;
        vendor.businessInfo.logo = wizardData.logoUrl || undefined;
      }
      if (wizardData.logoMetadata !== undefined) {
        vendor.logoMetadata = wizardData.logoMetadata || undefined;
        vendor.businessInfo.logoMetadata = wizardData.logoMetadata || undefined;
      }
      const gstStatus = (
        wizardData.gstStatus ||
        (vendor as any).gstStatus ||
        (wizardData.gstin ? 'REGISTERED' : 'NOT_REGISTERED')
      ) as VendorRegistrationWizardData['gstStatus'];
      const cleanGstin =
        gstStatus === 'REGISTERED' && wizardData.gstin
          ? wizardData.gstin.trim().toUpperCase()
          : gstStatus === 'REGISTERED'
            ? vendor.businessInfo?.gstin || ''
            : '';
      const cleanGstAppNo =
        gstStatus === 'APPLIED' && wizardData.gstApplicationNumber
          ? wizardData.gstApplicationNumber.trim().toUpperCase()
          : gstStatus === 'APPLIED'
            ? (vendor as any).gstApplicationNumber || ''
            : '';

      const msmeStatus = (
        wizardData.msmeStatus ||
        (vendor as any).msmeStatus ||
        (wizardData.udyamNumber ? 'REGISTERED' : 'NOT_REGISTERED')
      ) as VendorRegistrationWizardData['msmeStatus'];
      const cleanUdyam =
        msmeStatus === 'REGISTERED' && wizardData.udyamNumber
          ? wizardData.udyamNumber.trim().toUpperCase()
          : msmeStatus === 'REGISTERED'
            ? (vendor as any).udyamNumber || ''
            : '';
      const cleanMsmeAppNo =
        msmeStatus === 'APPLIED' && wizardData.msmeApplicationNumber
          ? wizardData.msmeApplicationNumber.trim().toUpperCase()
          : msmeStatus === 'APPLIED'
            ? (vendor as any).msmeApplicationNumber || ''
            : '';

      const cleanAadhaar = wizardData.aadhaarNumber
        ? String(wizardData.aadhaarNumber).replace(/[\s-]+/g, '').trim()
        : vendorSecurityService.decryptSensitive((vendor as any).aadhaarNumber || '');
      const cleanPan = wizardData.pan
        ? wizardData.pan.trim().toUpperCase()
        : vendorSecurityService.decryptSensitive(vendor.businessInfo?.pan || '');

      (vendor as any).gstStatus = gstStatus;
      vendor.businessInfo.gstStatus = gstStatus;
      vendor.businessInfo.gstin = cleanGstin || undefined;
      (vendor as any).gstApplicationNumber = cleanGstAppNo || undefined;
      vendor.businessInfo.gstApplicationNumber = cleanGstAppNo || undefined;

      (vendor as any).msmeStatus = msmeStatus;
      vendor.businessInfo.msmeStatus = msmeStatus;
      (vendor as any).udyamNumber = cleanUdyam || undefined;
      vendor.businessInfo.udyamNumber = cleanUdyam || undefined;
      (vendor as any).msmeApplicationNumber = cleanMsmeAppNo || undefined;
      vendor.businessInfo.msmeApplicationNumber = cleanMsmeAppNo || undefined;

      if (cleanAadhaar) {
        const encAadhaar = vendorSecurityService.encryptSensitive(cleanAadhaar);
        const maskedAadhaarVal = maskAadhaar(cleanAadhaar);
        (vendor as any).aadhaarNumber = encAadhaar;
        (vendor as any).aadhaarMasked = maskedAadhaarVal;
        vendor.businessInfo.aadhaarNumber = encAadhaar;
        vendor.businessInfo.aadhaarMasked = maskedAadhaarVal;
      }
      if (cleanPan) {
        const encPan = vendorSecurityService.encryptSensitive(cleanPan);
        const maskedPanVal = maskPan(cleanPan);
        vendor.businessInfo.pan = encPan;
        vendor.businessInfo.panMasked = maskedPanVal;
        (vendor as any).panMasked = maskedPanVal;
      }

      if (vendor.registrationData) {
        vendor.registrationData.gstStatus = gstStatus;
        vendor.registrationData.gstin = cleanGstin || undefined;
        vendor.registrationData.gstApplicationNumber = cleanGstAppNo || undefined;
        vendor.registrationData.msmeStatus = msmeStatus;
        vendor.registrationData.udyamNumber = cleanUdyam || undefined;
        vendor.registrationData.msmeApplicationNumber = cleanMsmeAppNo || undefined;
        if (cleanAadhaar) {
          vendor.registrationData.aadhaarNumber = vendorSecurityService.encryptSensitive(cleanAadhaar);
        }
        if (cleanPan) {
          vendor.registrationData.pan = vendorSecurityService.encryptSensitive(cleanPan);
        }
      }

      if (wizardData.pincode || wizardData.city || wizardData.state || wizardData.country || wizardData.completeAddress) {
        vendor.businessInfo.address = {
          ...vendor.businessInfo.address,
          ...(wizardData.completeAddress ? { building: wizardData.completeAddress } : {}),
          ...(wizardData.area ? { street: wizardData.area, area: wizardData.area } : {}),
          ...(wizardData.city ? { city: wizardData.city } : {}),
          ...(wizardData.state ? { state: wizardData.state } : {}),
          ...(wizardData.pincode ? { pincode: wizardData.pincode } : {}),
          country: wizardData.country || vendor.businessInfo.address?.country || 'India'
        };
      }
      const cleanBankAcc = wizardData.bankDetails?.accountNumber
        ? String(wizardData.bankDetails.accountNumber).replace(/\D/g, '')
        : vendorSecurityService.decryptSensitive(vendor.businessInfo?.bankDetails?.accountNumber || '');
      if (wizardData.bankDetails) {
        const encAcc = cleanBankAcc ? vendorSecurityService.encryptSensitive(cleanBankAcc) : '';
        const maskedAcc = cleanBankAcc ? maskBankAccount(cleanBankAcc) : '';
        vendor.businessInfo.bankDetails = {
          accountHolderName: wizardData.bankDetails.accountHolderName || '',
          bankName: wizardData.bankDetails.bankName || '',
          accountNumber: encAcc,
          accountNumberMasked: maskedAcc,
          ifsc: (wizardData.bankDetails.ifsc || '').trim().toUpperCase(),
          accountType: wizardData.bankDetails.accountType || 'CURRENT',
          branch: wizardData.bankDetails.bankName || 'Main Branch',
          isVerified: false,
          verificationStatus: 'PENDING'
        };
        if (vendor.registrationData?.bankDetails) {
          vendor.registrationData.bankDetails = {
            ...vendor.registrationData.bankDetails,
            accountNumber: encAcc,
            isVerified: false,
            verificationStatus: 'PENDING'
          };
        }
      }
      if (wizardData.productCategories) {
        vendor.businessInfo.categories = wizardData.productCategories;
        vendor.categories = wizardData.productCategories;
      }
      if (wizardData.warehouses) {
        vendor.warehouses = wizardData.warehouses;
        const primaryWh = wizardData.warehouses.find((w: any) => w.isPrimary) || wizardData.warehouses[0];
        if (primaryWh) {
          vendor.businessInfo.warehouseAddress = `${primaryWh.address}, ${primaryWh.city}, ${primaryWh.state} ${primaryWh.pincode}`.replace(/^,\s*/, '');
          vendor.businessInfo.pickupPincode = primaryWh.pincode || vendor.businessInfo.pickupPincode;
        }
      }
      if (wizardData.documents) {
        const prevDocs: any[] = Array.isArray(vendor.kycDocuments) ? vendor.kycDocuments : [];
        const mergedDocs = (wizardData.documents || []).map((incoming: any) => {
          const existingSameType = prevDocs.find(
            (d) => d.type === incoming.type && d.id !== incoming.id
          );
          const mergedPrevVersions = [
            ...(Array.isArray(incoming.previousVersions) ? incoming.previousVersions : []),
            ...(existingSameType
              ? [
                  ...(Array.isArray(existingSameType.previousVersions)
                    ? existingSameType.previousVersions
                    : []),
                  {
                    id: existingSameType.id,
                    version: existingSameType.version,
                    fileName: existingSameType.fileName,
                    fileSize: existingSameType.fileSize,
                    mimeType: existingSameType.mimeType,
                    storageKey: existingSameType.storageKey,
                    storageProvider: existingSameType.storageProvider,
                    identificationNumber: existingSameType.identificationNumber,
                    identificationNumberMasked: existingSameType.identificationNumberMasked,
                    uploadedAt: existingSameType.uploadedAt,
                    verificationStatus: existingSameType.verificationStatus || 'PENDING',
                    rejectionReason: existingSameType.rejectionReason,
                    reviewedAt: existingSameType.reviewedAt,
                    reviewedBy: existingSameType.reviewedBy,
                    replacedAt: new Date().toISOString(),
                  },
                ]
              : []),
          ].filter((v, idx, arr) => arr.findIndex((x) => x.id === v.id) === idx);

          return {
            ...incoming,
            verificationStatus: incoming.verificationStatus || 'PENDING',
            ...(mergedPrevVersions.length > 0 ? { previousVersions: mergedPrevVersions } : {}),
          };
        });
        const linkedDocs = linkIdentificationNumbersToDocuments(mergedDocs, {
          aadhaarPlain: cleanAadhaar,
          panPlain: cleanPan,
          gstStatus,
          gstin: cleanGstin,
          gstApplicationNumber: cleanGstAppNo,
          msmeStatus,
          udyamNumber: cleanUdyam,
          msmeApplicationNumber: cleanMsmeAppNo,
          bankAccountPlain: cleanBankAcc,
        });
        vendor.kycDocuments = linkedDocs;
        if (vendor.registrationData) {
          vendor.registrationData.documents = linkedDocs;
        }
        const bankProof = linkedDocs.find((d) => d.type === 'CANCELLED_CHEQUE');
        if (bankProof && vendor.businessInfo?.bankDetails) {
          vendor.businessInfo.bankDetails.proofDocumentId = bankProof.id;
          vendor.businessInfo.bankDetails.proofFileName = bankProof.fileName;
        }
        const maxDocMs = linkedDocs.reduce(
          (max: number, d: any) => Math.max(max, new Date(d.uploadedAt || 0).getTime() || 0),
          0
        );
        if (maxDocMs > 0) {
          (vendor as any).lastDocumentUploadedAt = new Date(maxDocMs).toISOString();
        }
      }
      if ((wizardData as any).district && vendor.businessInfo?.address) {
        (vendor.businessInfo.address as any).district = (wizardData as any).district;
      }
      vendor.updatedAt = new Date().toISOString();
    }

    await vendorPersistenceService.saveVendorRecord(vendor);

    return {
      success: true,
      message: 'Registration progress saved successfully.',
      currentStep: vendor.registrationStep,
      vendor: serializeVendorProfile(vendor)
    };
  }

  @Post('registration/submit')
  async submitRegistration(
    @Body() body: { vendorId?: string; wizardData?: VendorRegistrationWizardData },
    @Headers('authorization') authHeader?: string
  ) {
    const vendor = body.vendorId ? vendorRecords.get(body.vendorId) : getVendorFromAuthHeader(authHeader);
    if (!vendor) {
      throw new NotFoundException('Vendor registration draft not found.');
    }

    // Check if already submitted (duplicate submission prevention)
    if (vendor.status === 'SUBMITTED' || vendor.status === 'UNDER_REVIEW') {
      const tokens = vendorSecurityService.generateTokens(vendor.id, vendor.email);
      vendor.refreshToken = tokens.refreshToken;
      return {
        success: true,
        message: 'Your application has already been submitted and is currently under review.',
        applicationId: vendor.applicationId || `APP-BLR-2026-${vendor.id.slice(-6)}`,
        status: vendor.status,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        redirectTo: `/application-status/${vendor.applicationId || `APP-BLR-2026-${vendor.id.slice(-6)}`}`,
        vendor: serializeVendorProfile(vendor)
      };
    }

    const data = body.wizardData || (vendor.registrationData as VendorRegistrationWizardData);
    if (!data) {
      throw new BadRequestException('Registration wizard data is required for submission.');
    }

    // Decrypt any previously encrypted draft fields if client didn't overwrite them
    const rawDraftAadhaar = data.aadhaarNumber
      ? vendorSecurityService.decryptSensitive(data.aadhaarNumber)
      : vendorSecurityService.decryptSensitive((vendor as any).aadhaarNumber || '');
    const rawDraftPan = data.pan
      ? vendorSecurityService.decryptSensitive(data.pan)
      : vendorSecurityService.decryptSensitive(vendor.businessInfo?.pan || '');
    const rawDraftAcc = data.bankDetails?.accountNumber
      ? vendorSecurityService.decryptSensitive(data.bankDetails.accountNumber)
      : vendorSecurityService.decryptSensitive(vendor.businessInfo?.bankDetails?.accountNumber || '');

    const gstStatus = (
      data.gstStatus ||
      (vendor as any).gstStatus ||
      (data.gstin ? 'REGISTERED' : 'NOT_REGISTERED')
    ) as VendorRegistrationWizardData['gstStatus'];
    const cleanGstin =
      gstStatus === 'REGISTERED' && data.gstin ? data.gstin.trim().toUpperCase() : '';
    const cleanGstAppNo =
      gstStatus === 'APPLIED' && data.gstApplicationNumber
        ? data.gstApplicationNumber.trim().toUpperCase()
        : '';

    const msmeStatus = (
      data.msmeStatus ||
      (vendor as any).msmeStatus ||
      (data.udyamNumber ? 'REGISTERED' : 'NOT_REGISTERED')
    ) as VendorRegistrationWizardData['msmeStatus'];
    const cleanUdyam =
      msmeStatus === 'REGISTERED' && data.udyamNumber ? data.udyamNumber.trim().toUpperCase() : '';
    const cleanMsmeAppNo =
      msmeStatus === 'APPLIED' && data.msmeApplicationNumber
        ? data.msmeApplicationNumber.trim().toUpperCase()
        : '';

    // Never trust client-only flags; validate every step's fields on the backend
    const mergedValidationData = {
      ...data,
      ownerName: data.ownerName ?? vendor.name,
      email: data.email ?? vendor.email,
      phone: data.phone ?? vendor.phone,
      country: data.country || 'India',
      aadhaarNumber: rawDraftAadhaar,
      pan: rawDraftPan,
      gstStatus,
      gstin: cleanGstin || undefined,
      gstApplicationNumber: cleanGstAppNo || undefined,
      msmeStatus,
      udyamNumber: cleanUdyam || undefined,
      msmeApplicationNumber: cleanMsmeAppNo || undefined,
      bankDetails: {
        ...data.bankDetails,
        accountNumber: rawDraftAcc,
        confirmAccountNumber:
          data.bankDetails?.confirmAccountNumber !== undefined
            ? vendorSecurityService.decryptSensitive(data.bankDetails.confirmAccountNumber)
            : rawDraftAcc,
      },
    };

    const fullCheck = validateVendorRegistrationPayload(mergedValidationData);
    if (!fullCheck.isValid) {
      const firstError = Object.values(fullCheck.errors)[0] || 'Invalid registration data submitted.';
      throw new BadRequestException({
        message: firstError,
        errors: fullCheck.errors
      });
    }

    const oldStatus = vendor.status;

    // Normalize and persist
    if (!vendor.applicationId) {
      vendor.applicationId = `APP-BLR-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    }
    const submittedIso = new Date().toISOString();
    vendor.submittedAt = submittedIso;
    (vendor as any).latestKycSubmittedAt = submittedIso;
    vendor.status = 'SUBMITTED';
    vendor.rejectionReason = undefined;
    vendor.resubmissionReason = undefined;
    vendor.updatedAt = submittedIso;
    vendor.registrationStep = 5;

    const cleanAadhaar = rawDraftAadhaar.replace(/[\s-]+/g, '').trim();
    const cleanPan = rawDraftPan.trim().toUpperCase();
    const cleanBankAcc = rawDraftAcc.replace(/\D/g, '');
    const encAadhaar = vendorSecurityService.encryptSensitive(cleanAadhaar);
    const encPan = vendorSecurityService.encryptSensitive(cleanPan);
    const encBankAcc = vendorSecurityService.encryptSensitive(cleanBankAcc);
    const maskedAadhaarVal = maskAadhaar(cleanAadhaar);
    const maskedPanVal = maskPan(cleanPan);
    const maskedBankVal = maskBankAccount(cleanBankAcc);

    (vendor as any).aadhaarNumber = encAadhaar;
    (vendor as any).aadhaarMasked = maskedAadhaarVal;
    (vendor as any).panMasked = maskedPanVal;
    (vendor as any).gstStatus = gstStatus;
    (vendor as any).gstApplicationNumber = cleanGstAppNo || undefined;
    (vendor as any).msmeStatus = msmeStatus;
    (vendor as any).udyamNumber = cleanUdyam || undefined;
    (vendor as any).msmeApplicationNumber = cleanMsmeAppNo || undefined;

    if (mergedValidationData.ownerName) vendor.name = mergedValidationData.ownerName.trim();
    if (data.storeName) vendor.storeName = data.storeName.trim();
    if (mergedValidationData.phone) vendor.phone = mergedValidationData.phone.trim();
    if (mergedValidationData.email) vendor.email = mergedValidationData.email.trim().toLowerCase();
    if (data.logoUrl !== undefined) vendor.logoUrl = data.logoUrl || undefined;
    if (data.logoMetadata !== undefined) vendor.logoMetadata = data.logoMetadata || undefined;

    const existingDocs: any[] = Array.isArray(vendor.kycDocuments) ? vendor.kycDocuments : [];
    const incomingDocs = Array.isArray(data.documents) && data.documents.length > 0 ? data.documents : existingDocs;
    const mergedDocs = incomingDocs.map((incoming: any) => {
      const oldDoc = existingDocs.find((d) => d.type === incoming.type && d.id !== incoming.id);
      const history = [
        ...(Array.isArray(incoming.previousVersions) ? incoming.previousVersions : []),
        ...(oldDoc
          ? [
              ...(Array.isArray(oldDoc.previousVersions) ? oldDoc.previousVersions : []),
              {
                id: oldDoc.id,
                version: oldDoc.version,
                fileName: oldDoc.fileName,
                fileSize: oldDoc.fileSize,
                mimeType: oldDoc.mimeType,
                storageKey: oldDoc.storageKey,
                storageProvider: oldDoc.storageProvider,
                identificationNumber: oldDoc.identificationNumber,
                identificationNumberMasked: oldDoc.identificationNumberMasked,
                uploadedAt: oldDoc.uploadedAt,
                verificationStatus: oldDoc.verificationStatus || 'PENDING',
                rejectionReason: oldDoc.rejectionReason,
                reviewedAt: oldDoc.reviewedAt,
                reviewedBy: oldDoc.reviewedBy,
                replacedAt: new Date().toISOString(),
              },
            ]
          : []),
      ].filter((v, idx, arr) => arr.findIndex((x) => x.id === v.id) === idx);
      return {
        ...incoming,
        verificationStatus: incoming.verificationStatus || 'PENDING',
        ...(history.length > 0 ? { previousVersions: history } : {}),
      };
    });

    vendor.kycDocuments = linkIdentificationNumbersToDocuments(mergedDocs, {
      aadhaarPlain: cleanAadhaar,
      panPlain: cleanPan,
      gstStatus,
      gstin: cleanGstin,
      gstApplicationNumber: cleanGstAppNo,
      msmeStatus,
      udyamNumber: cleanUdyam,
      msmeApplicationNumber: cleanMsmeAppNo,
      bankAccountPlain: cleanBankAcc,
    });
    const maxDocMs = vendor.kycDocuments.reduce(
      (max: number, d: any) => Math.max(max, new Date(d.uploadedAt || 0).getTime() || 0),
      0
    );
    if (maxDocMs > 0) {
      (vendor as any).lastDocumentUploadedAt = new Date(maxDocMs).toISOString();
    }

    const bankProofDoc = vendor.kycDocuments.find((d) => d.type === 'CANCELLED_CHEQUE');

    vendor.registrationData = {
      ...data,
      ownerName: mergedValidationData.ownerName.trim(),
      email: mergedValidationData.email.trim().toLowerCase(),
      phone: mergedValidationData.phone.trim(),
      legalBusinessName: data.legalBusinessName.trim(),
      storeName: data.storeName.trim(),
      pincode: data.pincode.trim(),
      state: data.state.trim(),
      city: data.city.trim(),
      completeAddress: data.completeAddress.trim(),
      gstStatus,
      gstin: cleanGstin || undefined,
      gstApplicationNumber: cleanGstAppNo || undefined,
      pan: encPan,
      aadhaarNumber: encAadhaar,
      msmeStatus,
      udyamNumber: cleanUdyam || undefined,
      msmeApplicationNumber: cleanMsmeAppNo || undefined,
      documents: vendor.kycDocuments,
      bankDetails: {
        ...data.bankDetails,
        accountHolderName: data.bankDetails.accountHolderName.trim(),
        bankName: data.bankDetails.bankName.trim(),
        accountNumber: encBankAcc,
        ifsc: data.bankDetails.ifsc.trim().toUpperCase(),
        isVerified: false,
        verificationStatus: 'PENDING',
        proofDocumentId: bankProofDoc?.id,
        proofFileName: bankProofDoc?.fileName,
      }
    };

    vendor.businessInfo = {
      ...vendor.businessInfo,
      businessName: data.legalBusinessName.trim(),
      storeName: data.storeName.trim(),
      contactPerson: data.ownerName?.trim() || vendor.name,
      phone: vendor.phone,
      email: vendor.email,
      businessType: (data.businessType || vendor.businessInfo?.businessType || 'PRIVATE_LIMITED') as any,
      businessRegistrationType: data.businessRegistrationType || vendor.businessInfo?.businessRegistrationType,
      yearOfEstablishment: data.yearOfEstablishment || vendor.businessInfo?.yearOfEstablishment,
      website: data.website || vendor.businessInfo?.website,
      description: data.description || vendor.businessInfo?.description,
      logo: data.logoUrl || vendor.logoUrl || vendor.businessInfo?.logo,
      logoMetadata: data.logoMetadata || vendor.logoMetadata || vendor.businessInfo?.logoMetadata,
      gstStatus,
      gstin: cleanGstin || undefined,
      gstApplicationNumber: cleanGstAppNo || undefined,
      pan: encPan,
      panMasked: maskedPanVal,
      aadhaarNumber: encAadhaar,
      aadhaarMasked: maskedAadhaarVal,
      msmeStatus,
      udyamNumber: cleanUdyam || undefined,
      msmeApplicationNumber: cleanMsmeAppNo || undefined,
      categories: data.productCategories || vendor.categories || [],
      address: {
        building: data.completeAddress.trim(),
        street: data.area || vendor.businessInfo?.address?.street || '',
        area: data.area || vendor.businessInfo?.address?.area || '',
        district: (data as any).district || (vendor.businessInfo?.address as any)?.district || '',
        city: data.city.trim(),
        state: data.state.trim(),
        pincode: data.pincode.trim(),
        country: data.country || 'India'
      },
      bankDetails: {
        accountHolderName: data.bankDetails.accountHolderName.trim(),
        bankName: data.bankDetails.bankName.trim(),
        accountNumber: encBankAcc,
        accountNumberMasked: maskedBankVal,
        ifsc: data.bankDetails.ifsc.trim().toUpperCase(),
        accountType: data.bankDetails.accountType || 'CURRENT',
        branch: data.bankDetails.bankName ? `${data.bankDetails.bankName.trim()} Branch` : 'Main Branch',
        isVerified: false,
        verificationStatus: 'PENDING',
        proofDocumentId: bankProofDoc?.id,
        proofFileName: bankProofDoc?.fileName,
      }
    };

    if (data.warehouses && data.warehouses.length > 0) {
      vendor.warehouses = data.warehouses;
      const primaryWh = data.warehouses.find((w) => w.isPrimary) || data.warehouses[0];
      if (primaryWh) {
        vendor.businessInfo.warehouseAddress = `${primaryWh.address}, ${primaryWh.city}, ${primaryWh.state} ${primaryWh.pincode}`.replace(/^,\s*/, '');
        vendor.businessInfo.pickupPincode = primaryWh.pincode || data.pincode.trim();
      }
    } else if (!vendor.businessInfo.warehouseAddress) {
      vendor.businessInfo.warehouseAddress = `${data.completeAddress.trim()}, ${data.city.trim()}, ${data.state.trim()} ${data.pincode.trim()}`;
      vendor.businessInfo.pickupPincode = data.pincode.trim();
    }

    // Record audit log
    if (!vendor.auditLogs) vendor.auditLogs = [];
    vendor.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      action: oldStatus === 'RESUBMISSION_REQUIRED' ? 'APPLICATION_RESUBMITTED' : 'APPLICATION_SUBMITTED',
      performedBy: vendor.name || 'Vendor Owner',
      performedAt: new Date().toISOString(),
      details: `Vendor submitted registration with application ID ${vendor.applicationId}. Application queued for Compliance & KYC review.`,
      oldStatus,
      newStatus: 'SUBMITTED'
    });

    // Persist to MongoDB
    await vendorPersistenceService.saveVendorRecord(vendor);

    // Send notifications
    vendorNotificationService.notify(
      vendor.id,
      'APPLICATION_SUBMITTED',
      'Supplier Application Submitted',
      `Thank you for applying to BUILDORA 60 Supplier Network. Your application ${vendor.applicationId} is under administrative compliance verification.`,
      `/application-status/${vendor.applicationId}`,
      { email: vendor.email, phone: vendor.phone }
    );

    const tenantId = vendor.tenantId || DEFAULT_TENANT_ID;
    void platformNotificationService.dispatch({
      tenantId,
      recipientRole: 'ADMIN',
      recipientId: 'TENANT_ADMIN',
      type: 'VENDOR_ONBOARDING',
      title: `New Vendor Application: ${vendor.storeName}`,
      message: `${vendor.businessInfo?.businessName || vendor.storeName} (${vendor.applicationId}) submitted onboarding & KYC for approval.`,
      severity: 'INFO',
      actionUrl: '/vendor-approvals',
      metadata: { vendorId: vendor.id, applicationId: vendor.applicationId },
    });
    realtimeBus.emitToAdmin(
      'vendor.application.submitted',
      {
        vendorId: vendor.id,
        applicationId: vendor.applicationId,
        storeName: vendor.storeName,
        status: vendor.status,
      },
      tenantId
    );

    // Issue JWT token immediately so vendor is authenticated without having to log in again
    const tokens = vendorSecurityService.generateTokens(vendor.id, vendor.email);
    vendor.refreshToken = tokens.refreshToken;

    const redirectTo = `/application-status/${vendor.applicationId}`;

    return {
      success: true,
      message: 'Your vendor application has been submitted successfully for administrative review.',
      applicationId: vendor.applicationId,
      status: vendor.status,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      redirectTo,
      vendor: serializeVendorProfile(vendor)
    };
  }

  // ==========================================
  // SMART PINCODE LOOKUP ENDPOINT
  // ==========================================
  @Get('pincode-lookup/:pincode')
  async lookupPincode(@Param('pincode') pincode: string) {
    if (!pincode) {
      throw new BadRequestException('Pincode is required.');
    }
    const cleanPin = pincode.trim().replace(/\D/g, '');
    const pinCheck = validatePincode(cleanPin);
    if (!pinCheck.isValid) {
      throw new BadRequestException(pinCheck.error || 'Invalid 6-digit Indian Postal Pincode.');
    }
    return await postalLookupService.lookup(cleanPin);
  }

  @Get('registration/application/:applicationId')
  getApplicationDetails(
    @Param('applicationId') applicationId: string,
    @Headers('authorization') authHeader?: string
  ) {
    if (!applicationId) {
      throw new BadRequestException('Application ID is required.');
    }

    // 1. Find the application in vendor records
    let targetVendor: BackendVendorRecord | undefined;
    for (const v of vendorRecords.values()) {
      if (v.applicationId === applicationId || v.id === applicationId) {
        targetVendor = v;
        break;
      }
    }

    if (!targetVendor) {
      throw new NotFoundException(`Application "${applicationId}" was not found.`);
    }

    // 2. Security & Ownership check
    const caller = getAuthenticatedVendor(authHeader);
    if (!caller) {
      throw new UnauthorizedException('Authentication token is required to view application details.');
    }

    if (caller.id !== targetVendor.id && caller.applicationId !== targetVendor.applicationId) {
      throw new ForbiddenException('You are not authorized to view this vendor application.');
    }

    // 3. Mask sensitive information (Aadhaar, PAN, Bank account)
    const serialized = serializeVendorProfile(targetVendor);
    const maskedPan = serialized.panMasked || 'Not Provided';
    const maskedAadhaar = serialized.aadhaarMasked || 'Not Provided';
    const maskedBankAcc = serialized.businessInfo?.bankDetails?.accountNumberMasked || 'Not Provided';
    const regData = targetVendor.registrationData;

    return {
      success: true,
      application: {
        applicationId: targetVendor.applicationId || applicationId,
        vendorId: targetVendor.id,
        status: targetVendor.status,
        submittedAt: targetVendor.submittedAt || targetVendor.createdAt,
        updatedAt: targetVendor.updatedAt,
        approvedAt: targetVendor.approvedAt,
        rejectionReason: targetVendor.rejectionReason,
        resubmissionReason: targetVendor.resubmissionReason,
        suspendedReason: targetVendor.suspendedReason,
        logoUrl: targetVendor.logoUrl || targetVendor.businessInfo?.logo,
        logoMetadata: targetVendor.logoMetadata || targetVendor.businessInfo?.logoMetadata,
        storeName: targetVendor.storeName || regData?.storeName || 'N/A',
        businessName: targetVendor.businessInfo?.businessName || regData?.legalBusinessName || 'N/A',
        ownerName: targetVendor.name || regData?.ownerName || 'N/A',
        email: targetVendor.email,
        phone: targetVendor.phone,
        accountDetails: {
          ownerName: targetVendor.name || regData?.ownerName || '',
          email: targetVendor.email,
          phone: targetVendor.phone,
          isEmailVerified: !!targetVendor.isEmailVerified,
          isPhoneVerified: !!targetVendor.isPhoneVerified
        },
        businessDetails: {
          legalBusinessName: targetVendor.businessInfo?.businessName || regData?.legalBusinessName || '',
          storeName: targetVendor.storeName || regData?.storeName || '',
          businessType: targetVendor.businessInfo?.businessType || regData?.businessType || 'N/A',
          businessRegistrationType: regData?.businessRegistrationType || 'N/A',
          yearOfEstablishment: regData?.yearOfEstablishment || '',
          description: targetVendor.businessInfo?.description || regData?.description || '',
          categories: targetVendor.categories || regData?.productCategories || []
        },
        addressDetails: {
          completeAddress: regData?.completeAddress || targetVendor.businessInfo?.address?.building || '',
          city: regData?.city || targetVendor.businessInfo?.address?.city || '',
          state: regData?.state || targetVendor.businessInfo?.address?.state || '',
          district: regData?.district || '',
          pincode: regData?.pincode || targetVendor.businessInfo?.address?.pincode || '',
          dispatchAddress: regData?.dispatchAddress || ''
        },
        kycDetails: {
          gstStatus: serialized.gstStatus || 'NOT_REGISTERED',
          gstin: serialized.businessInfo?.gstin || 'Not Applicable',
          gstApplicationNumber: serialized.gstApplicationNumber,
          msmeStatus: serialized.msmeStatus || 'NOT_REGISTERED',
          udyamNumber: serialized.udyamNumber || 'Not Applicable',
          msmeApplicationNumber: serialized.msmeApplicationNumber,
          pan: maskedPan,
          aadhaar: maskedAadhaar
        },
        bankDetails: {
          accountHolderName: regData?.bankDetails?.accountHolderName || targetVendor.businessInfo?.bankDetails?.accountHolderName || '',
          bankName: regData?.bankDetails?.bankName || targetVendor.businessInfo?.bankDetails?.bankName || '',
          accountNumber: maskedBankAcc,
          ifsc: regData?.bankDetails?.ifsc || targetVendor.businessInfo?.bankDetails?.ifsc || '',
          accountType: regData?.bankDetails?.accountType || 'CURRENT',
          isVerified: Boolean(serialized.businessInfo?.bankDetails?.isVerified),
          verificationStatus: serialized.businessInfo?.bankDetails?.verificationStatus || 'PENDING'
        },
        documents: (serialized.kycDocuments || []).map((doc) => ({
          id: doc.id,
          type: doc.type,
          title: doc.title,
          fileName: doc.fileName,
          fileSize: doc.fileSize,
          mimeType: doc.mimeType,
          version: doc.version || 1,
          identificationNumberMasked: doc.identificationNumberMasked,
          uploadedAt: doc.uploadedAt,
          verificationStatus: doc.verificationStatus || 'PENDING'
        }))
      }
    };
  }

  @Post('registration/upload-doc')
  uploadDocument(
    @Body()
    body: {
      fileName: string;
      fileSize: number;
      mimeType: string;
      type: VendorKycDocument['type'];
      title: string;
    }
  ) {
    const { fileName, fileSize, mimeType, type, title } = body;
    if (!fileName || !type || !ALLOWED_KYC_DOCUMENT_TYPES.includes(type as any)) {
      throw new BadRequestException('Valid file name and KYC document type are required.');
    }

    const metaCheck = validateKycDocumentMetadata(mimeType, fileSize, fileName);
    if (!metaCheck.isValid) {
      throw new BadRequestException(metaCheck.error);
    }

    const docId = `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const secureUrl = `/secure/vault/documents/${docId}_${encodeURIComponent(fileName)}`;

    const kycDoc: VendorKycDocument = {
      id: docId,
      type,
      title: title || fileName,
      fileName,
      fileSize,
      mimeType: mimeType || 'application/pdf',
      fileUrl: secureUrl,
      uploadedAt: new Date().toISOString(),
      verificationStatus: 'PENDING'
    };

    return {
      success: true,
      message: 'Document uploaded securely to vendor private vault.',
      document: kycDoc
    };
  }

  @Post('registration/upload-doc-file')
  @UseInterceptors(
    FileInterceptor('document', {
      limits: { fileSize: MAX_KYC_DOC_SIZE_BYTES }
    })
  )
  async uploadRegistrationDocFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { type?: VendorKycDocument['type']; title?: string; identificationNumber?: string },
    @Req() req?: Request
  ) {
    if (!file) {
      throw new BadRequestException('Please attach a valid KYC document (PDF, JPG, JPEG, or PNG up to 5 MB).');
    }

    const docType = (body?.type || 'OTHER') as VendorKycDocument['type'];
    const rawId = String(body?.identificationNumber || '').trim();
    let identification: { identificationNumber?: string; identificationNumberMasked?: string } | undefined;
    if (rawId) {
      if (docType === 'AADHAAR_CARD' || docType === 'AUTHORIZED_ID') {
        const cleanAadhaar = rawId.replace(/[\s-]+/g, '');
        identification = {
          identificationNumber: vendorSecurityService.encryptSensitive(cleanAadhaar),
          identificationNumberMasked: maskAadhaar(cleanAadhaar),
        };
      } else if (docType === 'PAN_CARD') {
        const cleanPan = rawId.toUpperCase();
        identification = {
          identificationNumber: vendorSecurityService.encryptSensitive(cleanPan),
          identificationNumberMasked: maskPan(cleanPan),
        };
      } else if (docType === 'CANCELLED_CHEQUE') {
        const cleanAcc = rawId.replace(/\D/g, '');
        identification = {
          identificationNumber: vendorSecurityService.encryptSensitive(cleanAcc),
          identificationNumberMasked: maskBankAccount(cleanAcc),
        };
      } else {
        const cleanVal = rawId.toUpperCase();
        identification = {
          identificationNumber: cleanVal,
          identificationNumberMasked: cleanVal,
        };
      }
    }

    const host = req?.get?.('host') || `localhost:${process.env.PORT || 3000}`;
    const protocol = req?.protocol || 'http';
    const baseUrl = `${protocol}://${host}`;

    const document = await storageService.uploadKycDocument(
      file.buffer,
      file.originalname,
      file.mimetype,
      docType,
      body?.title || file.originalname,
      baseUrl,
      identification
    );

    return {
      success: true,
      message: 'Document uploaded and verified securely.',
      document: sanitizeDocumentForClient(document)
    };
  }

  @Get('uploads/docs/:filename')
  serveUploadedDocument(
    @Param('filename') filename: string,
    @Res() res: Response,
    @Headers('authorization') authHeader?: string,
    @Query('token') token?: string,
    @Query('download') download?: string
  ) {
    // Enforce strict authentication & ownership/tenant isolation for private KYC files
    const cleanFilename = filename.split('?')[0];
    let authorized = false;

    if (token) {
      const decoded = companyAdminSecurityService.verifyDocumentAccessToken(token);
      const ownerVendor = vendorRecords.get(decoded.vendorId);
      if (!ownerVendor || (ownerVendor.tenantId || DEFAULT_TENANT_ID) !== decoded.tenantId) {
        throw new ForbiddenException('Access denied: Document tenant mismatch.');
      }
      const docs = ownerVendor.kycDocuments || [];
      const matchesDoc = docs.some(
        (d: any) =>
          (d.id === decoded.docId &&
            (d.storageKey === cleanFilename || String(d.fileUrl || '').includes(cleanFilename))) ||
          (Array.isArray(d.previousVersions) &&
            d.previousVersions.some(
              (pv: any) =>
                pv.id === decoded.docId &&
                (pv.storageKey === cleanFilename || String(pv.fileUrl || '').includes(cleanFilename))
            ))
      );
      if (!matchesDoc) {
        throw new ForbiddenException('Access denied: Signed token does not match requested file.');
      }
      authorized = true;
    } else if (authHeader) {
      try {
        const admin = companyAdminSecurityService.verifyAccessToken(authHeader);
        companyAdminSecurityService.assertPermission(admin, 'vendors:read');
        const matchingVendor = Array.from(vendorRecords.values()).find((v) =>
          (v.kycDocuments || []).some(
            (d: any) =>
              d.storageKey === cleanFilename ||
              String(d.fileUrl || '').includes(cleanFilename) ||
              (Array.isArray(d.previousVersions) &&
                d.previousVersions.some(
                  (pv: any) =>
                    pv.storageKey === cleanFilename || String(pv.fileUrl || '').includes(cleanFilename)
                ))
          )
        );
        if (matchingVendor && (matchingVendor.tenantId || DEFAULT_TENANT_ID) !== admin.tenantId) {
          throw new ForbiddenException('Tenant isolation violation: Document belongs to another company.');
        }
        authorized = true;
      } catch (err) {
        if (err instanceof ForbiddenException) throw err;
        // Fallback: check authenticated vendor ownership
        const vendor = getVendorFromAuthHeader(authHeader);
        const ownsDoc = (vendor.kycDocuments || []).some(
          (d: any) =>
            d.storageKey === cleanFilename ||
            String(d.fileUrl || '').includes(cleanFilename) ||
            (Array.isArray(d.previousVersions) &&
              d.previousVersions.some(
                (pv: any) =>
                  pv.storageKey === cleanFilename || String(pv.fileUrl || '').includes(cleanFilename)
              ))
        );
        if (!ownsDoc) {
          throw new ForbiddenException('Ownership violation: You cannot access another vendor’s KYC documents.');
        }
        authorized = true;
      }
    }

    if (!authorized) {
      throw new UnauthorizedException('Authentication or a valid signed access token is required to view KYC documents.');
    }

    const { filePath, mimeType, fileSize } = storageService.getDocumentFilePath(cleanFilename);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `${download === 'true' ? 'attachment' : 'inline'}; filename="${cleanFilename}"`);
    res.setHeader('Content-Length', String(fileSize));
    res.setHeader('Cache-Control', 'no-store, private');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.sendFile(filePath);
  }

  @Get('kyc-documents/:docId/file')
  serveOwnKycDocument(
    @Param('docId') docId: string,
    @Res() res: Response,
    @Headers('authorization') authHeader?: string,
    @Query('download') download?: string
  ) {
    const vendor = getVendorFromAuthHeader(authHeader);
    const docs: any[] = vendor.kycDocuments || [];
    let targetDoc: any = null;
    for (const d of docs) {
      if (d.id === docId) {
        targetDoc = d;
        break;
      }
      if (Array.isArray(d.previousVersions)) {
        const pv = d.previousVersions.find((x: any) => x.id === docId);
        if (pv) {
          targetDoc = pv;
          break;
        }
      }
    }
    if (!targetDoc) {
      throw new NotFoundException('KYC document not found in your vendor profile.');
    }

    const resolved = storageService.resolveDocumentFile(targetDoc);
    const safeName = resolved.originalFileName.replace(/["\\\r\n]/g, '_');
    res.setHeader('Content-Type', resolved.mimeType);
    res.setHeader('Content-Disposition', `${download === 'true' ? 'attachment' : 'inline'}; filename="${safeName}"`);
    res.setHeader('Content-Length', String(resolved.fileSize));
    res.setHeader('Cache-Control', 'no-store, private');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.sendFile(resolved.filePath);
  }

  @Post('profile/kyc-documents/replace')
  @UseInterceptors(
    FileInterceptor('document', {
      limits: { fileSize: MAX_KYC_DOC_SIZE_BYTES }
    })
  )
  async replaceVendorKycDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { type?: VendorKycDocument['type']; title?: string },
    @Headers('authorization') authHeader?: string,
    @Req() req?: Request
  ) {
    const vendor = getVendorFromAuthHeader(authHeader);
    if (!file) {
      throw new BadRequestException('Please attach a valid replacement KYC document (PDF, JPG, JPEG, PNG, or WEBP up to 5 MB).');
    }
    const docType = (body?.type || 'OTHER') as VendorKycDocument['type'];
    if (!ALLOWED_KYC_DOCUMENT_TYPES.includes(docType as any)) {
      throw new BadRequestException('Invalid KYC document type.');
    }

    const host = req?.get?.('host') || `localhost:${process.env.PORT || 3000}`;
    const protocol = req?.protocol || 'http';
    const baseUrl = `${protocol}://${host}`;
    const nextDoc = await storageService.uploadKycDocument(
      file.buffer,
      file.originalname,
      file.mimetype,
      docType,
      body?.title || file.originalname,
      baseUrl
    );

    const existingDocs: any[] = Array.isArray(vendor.kycDocuments) ? vendor.kycDocuments : [];
    const oldDoc = existingDocs.find((d) => d.type === docType);
    const previousVersions = oldDoc
      ? [
          ...(Array.isArray(oldDoc.previousVersions) ? oldDoc.previousVersions : []),
          {
            id: oldDoc.id,
            version: oldDoc.version || (Array.isArray(oldDoc.previousVersions) ? oldDoc.previousVersions.length + 1 : 1),
            fileName: oldDoc.fileName,
            fileSize: oldDoc.fileSize,
            mimeType: oldDoc.mimeType,
            storageKey: oldDoc.storageKey,
            storageProvider: oldDoc.storageProvider,
            identificationNumber: oldDoc.identificationNumber,
            identificationNumberMasked: oldDoc.identificationNumberMasked,
            uploadedAt: oldDoc.uploadedAt,
            verificationStatus: oldDoc.verificationStatus || 'PENDING',
            rejectionReason: oldDoc.rejectionReason,
            reviewedAt: oldDoc.reviewedAt,
            reviewedBy: oldDoc.reviewedBy,
            replacedAt: new Date().toISOString(),
          },
        ]
      : [];

    const docWithHistory: VendorKycDocument = {
      ...nextDoc,
      title: body?.title || oldDoc?.title || nextDoc.title,
      version: previousVersions.length + 1,
      verificationStatus: 'PENDING',
      ...(previousVersions.length > 0 ? { previousVersions } : {}),
    };

    const updatedDocs = linkIdentificationNumbersToDocuments(
      [...existingDocs.filter((d) => d.type !== docType), docWithHistory],
      {
        aadhaarPlain: vendorSecurityService.decryptSensitive(
          (vendor as any).aadhaarNumber || vendor.businessInfo?.aadhaarNumber || ''
        ),
        panPlain: vendorSecurityService.decryptSensitive(
          vendor.businessInfo?.pan || vendor.registrationData?.pan || ''
        ),
        gstStatus: (vendor as any).gstStatus || vendor.businessInfo?.gstStatus,
        gstin: vendor.businessInfo?.gstin || vendor.registrationData?.gstin,
        gstApplicationNumber:
          (vendor as any).gstApplicationNumber || vendor.businessInfo?.gstApplicationNumber,
        msmeStatus: (vendor as any).msmeStatus || vendor.businessInfo?.msmeStatus,
        udyamNumber: (vendor as any).udyamNumber || vendor.businessInfo?.udyamNumber,
        msmeApplicationNumber:
          (vendor as any).msmeApplicationNumber || vendor.businessInfo?.msmeApplicationNumber,
        bankAccountPlain: vendorSecurityService.decryptSensitive(
          vendor.businessInfo?.bankDetails?.accountNumber || ''
        ),
      }
    );
    vendor.kycDocuments = updatedDocs;
    const savedReplacement = updatedDocs.find((d) => d.id === docWithHistory.id) || docWithHistory;

    if (docType === 'CANCELLED_CHEQUE' && vendor.businessInfo?.bankDetails) {
      vendor.businessInfo.bankDetails.proofDocumentId = savedReplacement.id;
      vendor.businessInfo.bankDetails.proofFileName = savedReplacement.fileName;
      vendor.businessInfo.bankDetails.isVerified = false;
      vendor.businessInfo.bankDetails.verificationStatus = 'PENDING';
      vendor.businessInfo.bankDetails.rejectionReason = undefined;
    }
    if (vendor.registrationData) {
      vendor.registrationData.documents = vendor.kycDocuments;
    }
    if (vendor.status === 'RESUBMISSION_REQUIRED') {
      vendor.status = 'SUBMITTED';
      vendor.resubmissionReason = undefined;
    }
    const repIso = new Date().toISOString();
    (vendor as any).lastDocumentUploadedAt = repIso;
    (vendor as any).latestKycSubmittedAt = repIso;
    (vendor as any).resubmittedAt = repIso;
    vendor.updatedAt = repIso;

    if (!vendor.auditLogs) vendor.auditLogs = [];
    vendor.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      action: oldDoc ? 'DOCUMENT_REPLACED' : 'DOCUMENT_UPLOADED',
      performedBy: vendor.name || vendor.email,
      performedAt: vendor.updatedAt,
      details: `${oldDoc ? 'Replaced' : 'Uploaded'} ${docType} (${file.originalname})${oldDoc ? ` replacing ${oldDoc.fileName}` : ''}.`,
    });

    await vendorPersistenceService.saveVendorRecord(vendor);

    const tenantId = vendor.tenantId || DEFAULT_TENANT_ID;
    companyAdminDataService.recordAuditLog({
      tenantId,
      actorId: vendor.id,
      actorName: vendor.businessInfo?.businessName || vendor.name || vendor.email,
      actorRole: 'VENDOR',
      action: oldDoc ? 'VENDOR_DOCUMENT_REPLACED' : 'VENDOR_DOCUMENT_UPLOADED',
      module: 'Vendors',
      entityType: 'VendorDocument',
      entityId: docWithHistory.id,
      details: `${vendor.storeName || vendor.name} ${oldDoc ? 'replaced' : 'uploaded'} ${docType} (${file.originalname}).`,
      ipAddress: (req as any)?.ip || '127.0.0.1',
    });

    await platformNotificationService.dispatch({
      tenantId,
      recipientRole: 'ADMIN',
      recipientId: 'TENANT_ADMIN',
      type: 'VENDOR_ONBOARDING',
      title: `KYC Document ${oldDoc ? 'Replaced' : 'Uploaded'}: ${vendor.storeName || vendor.name}`,
      message: `${docWithHistory.title} (${file.originalname}) is ready for Company Admin verification.`,
      severity: 'INFO',
      actionUrl: `/vendors?status=PENDING_VERIFICATION&vendorId=${encodeURIComponent(vendor.id)}`,
      metadata: { vendorId: vendor.id, docId: docWithHistory.id, type: docType },
    });

    realtimeBus.emitVendorAndAdmin(
      vendor.id,
      'vendor.document.uploaded',
      { vendorId: vendor.id, document: docWithHistory },
      tenantId
    );

    return {
      success: true,
      message: oldDoc
        ? 'Corrected KYC document uploaded and queued for Admin verification.'
        : 'KYC document uploaded successfully.',
      document: docWithHistory,
      vendor: serializeVendorProfile(vendor),
    };
  }

  @Post('registration/upload-logo')
  @UseInterceptors(
    FileInterceptor('logo', {
      limits: { fileSize: MAX_LOGO_SIZE_BYTES }
    })
  )
  async uploadRegistrationLogo(
    @UploadedFile() file: Express.Multer.File,
    @Headers('authorization') authHeader?: string,
    @Req() req?: Request
  ) {
    const vendor = getVendorFromAuthHeader(authHeader);
    if (!file) {
      throw new BadRequestException('Please attach an image file (JPG, JPEG, PNG, or WEBP) under field "logo".');
    }

    const host = req?.get?.('host') || `localhost:${process.env.PORT || 3000}`;
    const protocol = req?.protocol || 'http';
    const baseUrl = `${protocol}://${host}`;

    const logoMetadata = await storageService.uploadVendorLogo(
      file.buffer,
      file.originalname,
      file.mimetype,
      baseUrl
    );

    vendor.logoUrl = logoMetadata.url;
    vendor.logoMetadata = logoMetadata;
    vendor.businessInfo = {
      ...vendor.businessInfo,
      logo: logoMetadata.url,
      logoMetadata
    };
    if (vendor.registrationData) {
      vendor.registrationData.logoUrl = logoMetadata.url;
      vendor.registrationData.logoMetadata = logoMetadata;
    }
    vendor.updatedAt = new Date().toISOString();
    void vendorPersistenceService.saveVendorRecord(vendor);

    return {
      success: true,
      message: 'Business logo uploaded securely.',
      logoUrl: logoMetadata.url,
      logoMetadata
    };
  }

  @Post('profile/upload-logo')
  @UseInterceptors(
    FileInterceptor('logo', {
      limits: { fileSize: MAX_LOGO_SIZE_BYTES }
    })
  )
  async uploadProfileLogo(
    @UploadedFile() file: Express.Multer.File,
    @Headers('authorization') authHeader?: string,
    @Req() req?: Request
  ) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    if (!file) {
      throw new BadRequestException('Please attach an image file (JPG, JPEG, PNG, or WEBP).');
    }

    const host = req?.get?.('host') || `localhost:${process.env.PORT || 3000}`;
    const protocol = req?.protocol || 'http';
    const baseUrl = `${protocol}://${host}`;

    const logoMetadata = await storageService.uploadVendorLogo(
      file.buffer,
      file.originalname,
      file.mimetype,
      baseUrl
    );

    vendor.logoUrl = logoMetadata.url;
    vendor.logoMetadata = logoMetadata;
    vendor.businessInfo = {
      ...vendor.businessInfo,
      logo: logoMetadata.url,
      logoMetadata
    };
    if (vendor.registrationData) {
      vendor.registrationData = {
        ...vendor.registrationData,
        logoUrl: logoMetadata.url,
        logoMetadata
      };
    }
    vendor.updatedAt = new Date().toISOString();
    await vendorPersistenceService.saveVendorRecord(vendor);

    return {
      success: true,
      message: 'Business logo updated.',
      logoUrl: logoMetadata.url,
      logoMetadata,
      vendor: serializeVendorProfile(vendor)
    };
  }

  @Get('uploads/logos/:filename')
  serveUploadedLogo(@Param('filename') filename: string, @Res() res: Response) {
    const { filePath, mimeType } = storageService.getLogoFilePath(filename);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.sendFile(filePath);
  }

  @Get('registration/status')
  getRegistrationStatus(@Headers('authorization') authHeader?: string) {
    const vendor = getVendorFromAuthHeader(authHeader);
    const serialized = serializeVendorProfile(vendor);

    return {
      success: true,
      status: vendor.status,
      applicationId: vendor.applicationId || (vendor.status === 'SUBMITTED' ? `APP-BLR-2026-${vendor.id.slice(-6)}` : undefined),
      submittedAt: vendor.submittedAt || vendor.createdAt,
      rejectionReason: vendor.rejectionReason,
      resubmissionReason: vendor.resubmissionReason,
      suspendedReason: vendor.suspendedReason,
      approvedAt: vendor.approvedAt,
      registrationStep: vendor.registrationStep || 1,
      storeName: vendor.storeName,
      legalName: vendor.businessInfo?.businessName,
      email: vendor.email,
      phone: vendor.phone,
      logoUrl: vendor.logoUrl || vendor.businessInfo?.logo,
      logoMetadata: vendor.logoMetadata || vendor.businessInfo?.logoMetadata,
      maskedPan: serialized.panMasked,
      maskedAadhaar: serialized.aadhaarMasked,
      maskedBankAcc: serialized.businessInfo?.bankDetails?.accountNumberMasked,
      gstStatus: serialized.gstStatus,
      gstin: serialized.businessInfo?.gstin,
      gstApplicationNumber: serialized.gstApplicationNumber,
      msmeStatus: serialized.msmeStatus,
      udyamNumber: serialized.udyamNumber,
      msmeApplicationNumber: serialized.msmeApplicationNumber,
      bankVerificationStatus: serialized.businessInfo?.bankDetails?.verificationStatus || 'PENDING',
      kycDocuments: (serialized.kycDocuments || []).map((doc) => ({
        ...doc,
        verificationStatus: doc.verificationStatus || 'PENDING'
      })),
      auditLogs: vendor.auditLogs || [],
      updatedAt: vendor.updatedAt,
      redirectTo: getVendorRedirectUrl(vendor.status, vendor.applicationId)
    };
  }

  @Post('registration/resubmit')
  resubmitApplication(
    @Body() body: { notes?: string },
    @Headers('authorization') authHeader?: string
  ) {
    const vendor = getVendorFromAuthHeader(authHeader);
    if (vendor.status !== 'REJECTED' && vendor.status !== 'RESUBMISSION_REQUIRED') {
      throw new BadRequestException(`Only rejected or resubmission-required applications can be resubmitted. Current status is ${vendor.status}.`);
    }

    const oldStatus = vendor.status;
    const nowIso = new Date().toISOString();
    vendor.status = 'SUBMITTED';
    (vendor as any).resubmittedAt = nowIso;
    (vendor as any).latestKycSubmittedAt = nowIso;
    vendor.rejectionReason = undefined;
    vendor.resubmissionReason = undefined;
    vendor.updatedAt = nowIso;

    if (!vendor.auditLogs) vendor.auditLogs = [];
    vendor.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      action: 'APPLICATION_RESUBMITTED',
      performedBy: vendor.name,
      performedAt: new Date().toISOString(),
      details: body.notes ? `Application revised and resubmitted. Notes: ${body.notes}` : 'Application revised with updated details.',
      oldStatus,
      newStatus: 'SUBMITTED'
    });
    void vendorPersistenceService.saveVendorRecord(vendor);

    vendorNotificationService.notify(
      vendor.id,
      'APPLICATION_SUBMITTED',
      'Application Resubmitted',
      'Your revised application and documents have been sent to the compliance team for re-evaluation.',
      '/application-status',
      { email: vendor.email, phone: vendor.phone }
    );

    const tenantId = vendor.tenantId || DEFAULT_TENANT_ID;
    void platformNotificationService.dispatch({
      tenantId,
      recipientRole: 'ADMIN',
      recipientId: 'TENANT_ADMIN',
      type: 'VENDOR_ONBOARDING',
      title: `Vendor Application Resubmitted: ${vendor.storeName}`,
      message: body.notes || `${vendor.storeName} resubmitted corrected onboarding details for review.`,
      severity: 'INFO',
      actionUrl: '/vendor-approvals',
      metadata: { vendorId: vendor.id, applicationId: vendor.applicationId },
    });
    realtimeBus.emitToAdmin(
      'vendor.application.submitted',
      {
        vendorId: vendor.id,
        applicationId: vendor.applicationId,
        storeName: vendor.storeName,
        status: vendor.status,
        resubmitted: true,
      },
      tenantId
    );

    return {
      success: true,
      message: 'Application resubmitted successfully. Compliance team will review within 24-48 business hours.',
      status: vendor.status,
      redirectTo: '/application-status',
      vendor: serializeVendorProfile(vendor)
    };
  }

  // ==========================================
  // 3. ADMIN APPLICATION MANAGEMENT & APPROVALS (COMPANY ADMIN RBAC)
  // ==========================================

  @Get('admin/applications')
  getAdminApplications(
    @Headers('authorization') authHeader?: string,
    @Query('status') status?: string
  ) {
    const admin = companyAdminSecurityService.verifyAccessToken(authHeader);
    companyAdminSecurityService.assertPermission(admin, 'vendors:read');
    const list = Array.from(vendorRecords.values())
      .filter((v) => (v.tenantId || DEFAULT_TENANT_ID) === admin.tenantId)
      .map((v) => ({
        id: v.id,
        storeName: v.storeName,
        legalName: v.businessInfo?.businessName,
        contactPerson: v.name,
        email: v.email,
        phone: v.phone,
        businessType: v.businessInfo?.businessType,
        status: v.status,
        rejectionReason: v.rejectionReason,
        categories: v.categories || v.businessInfo?.categories || [],
        documentsCount: v.kycDocuments?.length || 0,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt
      }));

    if (status) {
      return {
        success: true,
        data: list.filter((item) => item.status.toLowerCase() === status.toLowerCase())
      };
    }

    return {
      success: true,
      data: list
    };
  }

  @Get('admin/applications/:id')
  getAdminApplicationById(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string
  ) {
    const admin = companyAdminSecurityService.verifyAccessToken(authHeader);
    companyAdminSecurityService.assertPermission(admin, 'vendors:read');
    const vendor = vendorRecords.get(id);
    if (!vendor) {
      throw new NotFoundException(`Vendor application #${id} not found.`);
    }
    companyAdminSecurityService.assertTenantAccess(admin, vendor.tenantId || DEFAULT_TENANT_ID);

    return {
      success: true,
      data: serializeVendorProfile(vendor)
    };
  }

  @Put('admin/applications/:id/status')
  async updateVendorApplicationStatus(
    @Param('id') id: string,
    @Body()
    body: {
      status: 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'ACTIVE';
      reason?: string;
      adminName?: string;
    },
    @Headers('authorization') authHeader?: string
  ) {
    const admin = companyAdminSecurityService.verifyAccessToken(authHeader);
    companyAdminSecurityService.assertPermission(admin, 'vendors:manage');

    const vendor = vendorRecords.get(id);
    if (!vendor) {
      throw new NotFoundException(`Vendor application #${id} not found.`);
    }
    const tenantId = companyAdminSecurityService.assertTenantAccess(
      admin,
      vendor.tenantId || DEFAULT_TENANT_ID
    );

    const { status, reason } = body;
    const adminName = admin.name || body.adminName || admin.email;
    const oldStatus = vendor.status;

    if (status === 'REJECTED' && !reason) {
      throw new BadRequestException('A specific rejection reason is mandatory when rejecting a vendor application.');
    }

    if (status === 'SUSPENDED' && !reason) {
      throw new BadRequestException('A specific reason is mandatory when suspending a vendor account.');
    }

    vendor.status = status;
    vendor.rejectionReason = status === 'REJECTED' ? reason : undefined;
    vendor.suspendedReason = status === 'SUSPENDED' ? reason : undefined;
    vendor.updatedAt = new Date().toISOString();
    await vendorPersistenceService.saveVendorRecord(vendor);

    for (const vp of vendorProducts) {
      if (vp.vendorId === vendor.id) {
        if (status === 'SUSPENDED' || status === 'REJECTED') {
          vp.isActive = false;
        } else if ((status === 'APPROVED' || status === 'ACTIVE') && vp.approvalStatus === 'APPROVED' && !(vp as any).isSuspended) {
          vp.isActive = true;
        }
        syncVendorProductToCustomerCatalog(vp);
      }
    }

    if (!vendor.auditLogs) vendor.auditLogs = [];
    vendor.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      action: `STATUS_CHANGED_TO_${status}`,
      performedBy: adminName,
      performedAt: new Date().toISOString(),
      details: reason ? `Status changed to ${status}. Notes: ${reason}` : `Status changed to ${status}.`,
      oldStatus,
      newStatus: status
    });

    if (status === 'APPROVED' || status === 'ACTIVE') {
      await platformNotificationService.dispatch({
        tenantId,
        recipientRole: 'VENDOR',
        recipientId: vendor.id,
        type: 'VENDOR_ONBOARDING',
        title: 'Vendor Partnership Approved!',
        message: 'Congratulations! Your vendor partner application has been approved.',
        severity: 'SUCCESS',
        actionUrl: '/overview',
        email: vendor.email,
        phone: vendor.phone,
      });
      realtimeBus.emitVendorAndAdmin(vendor.id, 'vendor.application.approved', { vendor: serializeVendorProfile(vendor) }, tenantId);
    } else if (status === 'REJECTED' || status === 'SUSPENDED') {
      await platformNotificationService.dispatch({
        tenantId,
        recipientRole: 'VENDOR',
        recipientId: vendor.id,
        type: 'VENDOR_ONBOARDING',
        title: status === 'SUSPENDED' ? 'Urgent: Vendor Account Suspended' : 'Action Required: Application Returned',
        message: reason || 'Please contact compliance support.',
        severity: status === 'SUSPENDED' ? 'CRITICAL' : 'WARNING',
        actionUrl: '/application-status',
        email: vendor.email,
        phone: vendor.phone,
      });
      realtimeBus.emitVendorAndAdmin(vendor.id, 'vendor.application.rejected', { vendor: serializeVendorProfile(vendor), reason }, tenantId);
    }

    return {
      success: true,
      message: `Vendor #${vendor.id} status updated to ${status}.`,
      status: vendor.status,
      vendor: serializeVendorProfile(vendor)
    };
  }

  // ==========================================
  // 3. MASTER DASHBOARD METRICS & CHARTS (17 KPIs)
  // ==========================================
  @Get('dashboard/metrics')
  async getDashboardMetrics(
    @Headers('authorization') authHeader?: string,
    @Query('period') period?: string
  ): Promise<{ success: boolean; data: any }> {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const myProducts = vendorProducts.filter((p) => p.vendorId === vendor.id);
    const myOrders = vendorOrders.filter((o) => o.vendorId === vendor.id);
    const mySettlements = vendorSettlements.filter((s) => s.vendorId === vendor.id);
    const myReturns = vendorReturns.filter((r) => r.vendorId === vendor.id);
    const myReviews = vendorReviews.filter((r: any) => !r.vendorId || r.vendorId === vendor.id);

    const nowMs = Date.now();
    const periodOrders = myOrders.filter((o) => {
      if (!period || period === 'all' || period === '30d') return true;
      const created = new Date(o.createdAt || 0).getTime();
      if (period === 'today') return nowMs - created <= 24 * 3600 * 1000;
      if (period === 'yesterday') return nowMs - created <= 48 * 3600 * 1000 && nowMs - created > 24 * 3600 * 1000;
      if (period === '7d') return nowMs - created <= 7 * 24 * 3600 * 1000;
      return true;
    });

    const totalProducts = myProducts.length;
    const activeProducts = myProducts.filter((p) => p.isActive && p.approvalStatus === 'APPROVED').length;
    const pendingApprovalProducts = myProducts.filter(
      (p) => p.approvalStatus === 'PENDING_APPROVAL' || (p as any).revisionStatus === 'PENDING_APPROVAL'
    ).length;
    const rejectedProducts = myProducts.filter((p) => p.approvalStatus === 'REJECTED').length;
    const lowStockCount = myProducts.filter((p) => p.stockCount <= p.lowStockThreshold && p.stockCount > 0).length;
    const outOfStockCount = myProducts.filter((p) => p.stockCount === 0 || !p.inStock).length;

    const totalOrders = periodOrders.length;
    const newOrders = periodOrders.filter((o) => o.status === 'NEW').length;
    const processingOrders = periodOrders.filter((o) =>
      ['ACCEPTED', 'PROCESSING', 'PACKED', 'READY_FOR_DISPATCH'].includes(o.status)
    ).length;
    const shippedOrders = periodOrders.filter((o) => o.status === 'DISPATCHED').length;
    const deliveredOrders = periodOrders.filter((o) => o.status === 'DELIVERED').length;
    const cancelledOrders = periodOrders.filter((o) => o.status === 'CANCELLED' || o.status === 'REJECTED').length;

    const validOrders = periodOrders.filter((o) => o.status !== 'CANCELLED' && o.status !== 'REJECTED');
    const grossRevenue = Math.round(validOrders.reduce((sum, o) => sum + Number(o.subtotal || 0), 0));
    const netEarnings = Math.round(validOrders.reduce((sum, o) => sum + Number(o.netPayout || 0), 0));
    const pendingSettlement = mySettlements
      .filter((s) => s.status !== 'PAID')
      .reduce((sum, s: any) => sum + Number(s.netPayable ?? s.netAmount ?? 0), 0);
    const completedPayouts = mySettlements
      .filter((s) => s.status === 'PAID')
      .reduce((sum, s: any) => sum + Number(s.netPayable ?? s.netAmount ?? 0), 0);

    const returnRequests = myReturns.filter((r) =>
      ['REQUESTED', 'INSPECTION_PENDING', 'APPROVED'].includes(r.status)
    ).length;
    const customerRating =
      myReviews.length > 0
        ? Number((myReviews.reduce((s, r) => s + Number(r.rating || 5), 0) / myReviews.length).toFixed(1))
        : 0;
    const reviewCount = myReviews.length;

    return {
      success: true,
      data: {
        totalProducts,
        activeProducts,
        pendingApprovalProducts,
        rejectedProducts,
        totalOrders,
        newOrders,
        processingOrders,
        shippedOrders,
        dispatchedOrders: shippedOrders,
        deliveredOrders,
        cancelledOrders,
        grossRevenue,
        netEarnings,
        pendingSettlement,
        completedPayouts,
        lowStockCount,
        outOfStockCount,
        returnRequests,
        customerRating,
        reviewCount,
      },
    };
  }

  @Get('dashboard/charts')
  async getDashboardCharts(
    @Headers('authorization') authHeader?: string,
    @Query('period') period?: string
  ) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const myOrders = vendorOrders.filter((o) => o.vendorId === vendor.id);
    const myProducts = vendorProducts.filter((p) => p.vendorId === vendor.id);

    // Group real orders by day label
    const bucketMap = new Map<string, { revenue: number; orders: number }>();
    for (const o of myOrders) {
      const d = new Date(o.createdAt || Date.now());
      const label = period === 'today'
        ? `${String(d.getHours()).padStart(2, '0')}:00`
        : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      const prev = bucketMap.get(label) || { revenue: 0, orders: 0 };
      if (o.status !== 'CANCELLED' && o.status !== 'REJECTED') {
        prev.revenue += Number(o.subtotal || 0);
      }
      prev.orders += 1;
      bucketMap.set(label, prev);
    }

    const revenueTrends = Array.from(bucketMap.entries())
      .slice(-7)
      .map(([date, val]) => ({ date, revenue: Math.round(val.revenue), orders: val.orders }));

    const statusDistribution = [
      { status: 'NEW', label: 'New Orders', count: myOrders.filter((o) => o.status === 'NEW').length, color: '#FF7417' },
      { status: 'PROCESSING', label: 'Processing & Packed', count: myOrders.filter((o) => ['ACCEPTED', 'PROCESSING', 'PACKED', 'READY_FOR_DISPATCH'].includes(o.status)).length, color: '#F59E0B' },
      { status: 'DISPATCHED', label: 'Dispatched', count: myOrders.filter((o) => o.status === 'DISPATCHED').length, color: '#203D91' },
      { status: 'DELIVERED', label: 'Delivered to Site', count: myOrders.filter((o) => o.status === 'DELIVERED').length, color: '#10B981' },
      { status: 'CANCELLED', label: 'Cancelled / Rejected', count: myOrders.filter((o) => ['CANCELLED', 'REJECTED'].includes(o.status)).length, color: '#EF4444' },
    ];

    const salesByProduct = new Map<string, { id: string; name: string; sku: string; unitsSold: number; revenue: number; stock: number }>();
    for (const p of myProducts) {
      salesByProduct.set(p.id, {
        id: p.id,
        name: p.name,
        sku: p.sku,
        unitsSold: 0,
        revenue: 0,
        stock: p.stockCount,
      });
    }
    for (const o of myOrders) {
      if (o.status === 'CANCELLED' || o.status === 'REJECTED') continue;
      for (const it of (o.items as any[]) || []) {
        const entry = salesByProduct.get(it.productId) ||
          Array.from(salesByProduct.values()).find((x) => x.sku === it.sku || x.id.replace(/^vp-/, '') === it.productId);
        if (entry) {
          entry.unitsSold += Number(it.quantity || 0);
          entry.revenue += Number(it.totalPrice ?? it.totalAmount ?? (it.unitPrice || 0) * (it.quantity || 0));
        }
      }
    }

    const topProducts = Array.from(salesByProduct.values())
      .sort((a, b) => b.revenue - a.revenue || b.stock - a.stock)
      .slice(0, 5);

    return {
      success: true,
      revenueTrends,
      statusDistribution,
      topProducts,
      recentOrders: myOrders.slice(0, 5),
    };
  }

  @Get('analytics/overview')
  async getAnalyticsOverview(
    @Headers('authorization') authHeader?: string,
    @Query('ordersFilter') ordersFilter?: AnalyticsGranularity,
    @Query('salesFilter') salesFilter?: AnalyticsGranularity,
    @Query('ordersStartDate') ordersStartDate?: string,
    @Query('ordersEndDate') ordersEndDate?: string,
    @Query('salesStartDate') salesStartDate?: string,
    @Query('salesEndDate') salesEndDate?: string
  ) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const dataset = await vendorAnalyticsService.loadVendorDataset(
      vendor.id,
      vendorProducts,
      vendorOrders,
      vendorSettlements
    );
    const overview = vendorAnalyticsService.buildOverview(
      vendor.id,
      dataset.products,
      dataset.orders,
      dataset.settlements,
      {
        ordersFilter,
        salesFilter,
        ordersStartDate,
        ordersEndDate,
        salesStartDate,
        salesEndDate,
      }
    );

    return {
      success: true,
      data: overview,
    };
  }

  @Get('analytics/bucket-details')
  async getAnalyticsBucketDetails(
    @Headers('authorization') authHeader?: string,
    @Query('startIso') startIso?: string,
    @Query('endIso') endIso?: string,
    @Query('metric') metric: 'orders' | 'sales' = 'orders',
    @Query('page') page = '1',
    @Query('limit') limit = '10'
  ) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    if (!startIso || !endIso) {
      throw new BadRequestException('startIso and endIso query parameters are required.');
    }
    const dataset = await vendorAnalyticsService.loadVendorDataset(
      vendor.id,
      vendorProducts,
      vendorOrders,
      vendorSettlements
    );
    const details = vendorAnalyticsService.getBucketOrders(
      dataset.orders,
      startIso,
      endIso,
      metric,
      Number(page) || 1,
      Number(limit) || 10
    );
    return {
      success: true,
      data: details,
    };
  }

  @Get('analytics/brands')
  async getAnalyticsBrands(
    @Headers('authorization') authHeader?: string,
    @Query('status') status: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ALL',
    @Query('period') period: AnalyticsGranularity = 'monthly',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10'
  ) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const dataset = await vendorAnalyticsService.loadVendorDataset(
      vendor.id,
      vendorProducts,
      vendorOrders,
      vendorSettlements
    );
    const overview = vendorAnalyticsService.buildOverview(
      vendor.id,
      dataset.products,
      dataset.orders,
      dataset.settlements,
      {
        salesFilter: period,
        salesStartDate: startDate,
        salesEndDate: endDate,
      }
    );

    let items = overview.allBrandsRanked;
    if (status === 'ACTIVE') items = items.filter((b) => b.isActive);
    else if (status === 'INACTIVE') items = items.filter((b) => !b.isActive);

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter((b) => b.brandName.toLowerCase().includes(q));
    }

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(50, Math.max(1, Number(limit) || 10));
    const offset = (safePage - 1) * safeLimit;

    return {
      success: true,
      data: {
        total: items.length,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.max(1, Math.ceil(items.length / safeLimit)),
        summary: overview.productBrandOverview.brands,
        items: items.slice(offset, offset + safeLimit),
      },
    };
  }

  // ==========================================
  // 4. CATEGORY DYNAMIC SPECIFICATIONS HELPER
  // ==========================================
  @Get('categories/attributes')
  getCategoryDynamicAttributes(@Query('category') category?: string) {
    const attributeTemplates: Record<string, any[]> = {
      'cement-concrete': [
        { name: 'Cement Grade', uiType: 'pills', options: ['OPC 53 Grade', 'OPC 43 Grade', 'PPC (IS 1489 Part 1)', 'PSC Portland Slag', 'White Cement'] },
        { name: 'Packaging Type', uiType: 'dropdown', options: ['50 kg HDPE Bag', '50 kg Paper Bag', '1000 kg Jumbo Bag'] },
        { name: 'Setting Time', uiType: 'pills', options: ['Initial: 30 mins / Final: 600 mins', 'Rapid Hardening (Initial: 15 mins)'] },
        { name: 'IS Certification', uiType: 'pills', options: ['IS 12269:2013 (53 Grade)', 'IS 1489:2015 (PPC)', 'IS 269:2015'] }
      ],
      'electrical-lighting': [
        { name: 'Wire Conductor Size', uiType: 'cards', options: ['1.0 sq mm', '1.5 sq mm', '2.5 sq mm', '4.0 sq mm', '6.0 sq mm', '10.0 sq mm'] },
        { name: 'Coil Length', uiType: 'pills', options: ['90 meters', '180 meters', '270 meters'] },
        { name: 'Fire Retardant Grade', uiType: 'pills', options: ['FR (Flame Retardant)', 'FRLS (Low Smoke)', 'ZHFR (Zero Halogen)'] },
        { name: 'Voltage Rating', uiType: 'dropdown', options: ['1100V', '650V', '415V 3-Phase'] },
        { name: 'Insulation Colour', uiType: 'color_swatches', options: ['Red', 'Black', 'Blue', 'Yellow', 'Green (Earth)'] }
      ],
      'cpvc-pipes-overhead-tanks': [
        { name: 'Nominal Pipe Diameter', uiType: 'cards', options: ['1/2" (15mm)', '3/4" (20mm)', '1" (25mm)', '1-1/4" (32mm)', '1-1/2" (40mm)', '2" (50mm)'] },
        { name: 'Pressure Class', uiType: 'pills', options: ['SDR 11 (Class 1 - 28 bar)', 'SDR 13.5 (Class 2 - 22 bar)', 'SCH 40', 'SCH 80 Industrial'] },
        { name: 'Pipe Length', uiType: 'pills', options: ['3 meters (10 ft)', '5 meters (16.4 ft)'] },
        { name: 'Material Type', uiType: 'dropdown', options: ['CPVC Hot & Cold', 'UPVC Cold Water Plumbing', 'SWR Drainage'] }
      ],
      'plywood-boards': [
        { name: 'Sheet Thickness', uiType: 'cards', options: ['6mm', '9mm', '12mm', '16mm', '18mm', '19mm Calibrated', '25mm'] },
        { name: 'Plywood Grade', uiType: 'pills', options: ['BWP IS:710 Marine Grade', 'BWR Boiling Water Resistant', 'MR Commercial Moisture Resistant', 'Calibrated HDHMR'] },
        { name: 'Core Timber', uiType: 'pills', options: ['100% Gurjan Core', 'Hardwood Eucalyptus', 'Combi Pine/Poplar'] },
        { name: 'Standard Sheet Size', uiType: 'dropdown', options: ['8ft x 4ft (2440 x 1220 mm)', '7ft x 4ft', '8ft x 3ft'] }
      ],
      'hinges-channels-handles': [
        { name: 'Hardware Finish', uiType: 'pills', options: ['SS Matte Brushed', 'Antique Brass', 'Rose Gold PVD', 'Matt Black', 'Gloss Chrome'] },
        { name: 'Material Grade', uiType: 'pills', options: ['SS 304 Marine Grade Stainless', 'SS 202', 'High Density Zinc Alloy', 'Virgin Brass'] },
        { name: 'Size / Capacity', uiType: 'cards', options: ['4 Inch (100mm)', '5 Inch (125mm)', '12 Inch Channel (300mm)', '18 Inch Heavy Duty (450mm)'] }
      ],
      'paints-waterproofing': [
        { name: 'Paint Sheen / Finish', uiType: 'pills', options: ['Matt Finish', 'Soft Sheen', 'Silky Satin', 'High Gloss Exterior'] },
        { name: 'Pack Volume', uiType: 'cards', options: ['1 Litre', '4 Litres', '10 Litres', '20 Litres Site Drum'] },
        { name: 'Coverage Area', uiType: 'pills', options: ['120 - 140 sq ft/L (2 coats)', '55 - 65 sq ft/L (Exterior)'] }
      ]
    };

    if (category && attributeTemplates[category]) {
      return { success: true, category, attributes: attributeTemplates[category] };
    }
    return { success: true, templates: attributeTemplates };
  }

  @Get('categories/attribute-templates')
  getAllCategoryAttributeTemplates(
    @Query('category') category?: string,
    @Headers('x-tenant-id') tenantId?: string
  ) {
    const activeTenant = tenantId || DEFAULT_TENANT_ID;
    const dynamicAttrs = companyAdminDataService.attributes.filter(
      (a) => !a.tenantId || a.tenantId === activeTenant
    );
    const merged: Record<string, any[]> = { ...CATEGORY_ATTRIBUTE_TEMPLATES };
    for (const attr of dynamicAttrs) {
      const catKey = (attr.categoryName || 'general').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const existing = merged[catKey] ? [...merged[catKey]] : [];
      if (!existing.some((item) => item.name?.toLowerCase() === attr.name.toLowerCase())) {
        existing.push({
          name: attr.name,
          code: attr.code,
          uiType: 'pills',
          options: attr.values || [],
          required: Boolean(attr.isRequired),
        });
      }
      merged[catKey] = existing;
    }
    if (category) {
      return {
        success: true,
        data: merged[category.toLowerCase()] || getAttributeTemplatesForCategory(category)
      };
    }
    return {
      success: true,
      data: merged
    };
  }

  // ==========================================
  // 5. PRODUCTS & VARIANTS MANAGEMENT
  // ==========================================
  // 5. PRODUCTS MANAGEMENT (VENDOR-SCOPED + VERSIONING + APPROVAL SYNC)
  // ==========================================
  @Get('taxonomy')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  async getVendorTaxonomy(@Headers('authorization') authHeader?: string) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const tenantId = vendor.tenantId || DEFAULT_TENANT_ID;
    const pool = taxonomyService.getTenantPool(tenantId);
    const activeMains = pool.mainCategories.filter(
      (m) => m.isActive !== false && taxonomyService.isMainCategoryActiveForPortals(tenantId, m.id)
    );
    const activeMainIds = new Set(activeMains.map((m) => m.id));
    const activeChildren = pool.childCategories.filter(
      (c) => c.isActive !== false && activeMainIds.has(c.mainCategoryId)
    );
    const activeChildIds = new Set(activeChildren.map((c) => c.id));
    const activeTypes = pool.productTypes.filter(
      (pt) => pt.isActive !== false && activeChildIds.has(pt.childCategoryId)
    );
    const myWarehouses = vendorWarehouses.filter((w: any) => !w.vendorId || w.vendorId === vendor.id);
    const tenantCfg = companyAdminDataService.getTenantConfig(tenantId);
    const brands = (dbStore.brands as any[]).filter(
      (b: any) => (!b.tenantId || b.tenantId === tenantId) && b.isActive !== false
    );
    return {
      success: true,
      data: {
        mainCategories: activeMains,
        childCategories: activeChildren,
        productTypes: activeTypes,
        newLaunchCollections: taxonomyService.getNewLaunchCollections(tenantId, true),
        desktopNavigation: taxonomyService.getPublishedDesktopNavigation(tenantId, false),
        fieldSchemas: taxonomyService.getVendorCombinedCategoryFields(tenantId, undefined),
        filterConfigs: taxonomyService.getCategoryFilterConfigs(tenantId, {
          useDraft: false,
          showInVendor: true,
          includeInactive: false,
        }),
        publishMetadata: taxonomyService.getPublishMetadata(tenantId),
        filterConfigVersion: taxonomyService.getFilterSyncVersion(tenantId),
        warehouses: myWarehouses,
        brands,
        config: {
          gstSlabs: tenantCfg.taxConfig?.gstSlabs || [0, 5, 12, 18, 28],
          tdsRate: tenantCfg.taxConfig?.tdsRate ?? 0.01,
          supportedSpeeds: tenantCfg.deliveryConfig?.supportedSpeeds || ['60-min Express', 'Standard Same-Day'],
          expressEtaText: tenantCfg.deliveryConfig?.expressEtaText || '60 mins',
          standardEtaText: tenantCfg.deliveryConfig?.standardEtaText || 'Same-day',
          commissionRate: (vendor as any).commissionRate ?? tenantCfg.paymentConfig?.platformCommissionPercent ?? 6,
          freeShippingThreshold: tenantCfg.deliveryConfig?.freeShippingThreshold ?? 1000,
        },
      },
    };
  }

  @Get('taxonomy/fields/:childCategoryId')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  async getVendorCategoryFields(
    @Param('childCategoryId') childCategoryId: string,
    @Query('productTypeId') productTypeId?: string,
    @Query('newLaunchCollectionId') newLaunchCollectionId?: string,
    @Headers('authorization') authHeader?: string
  ) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const tenantId = vendor.tenantId || DEFAULT_TENANT_ID;
    const fields = taxonomyService.getVendorCombinedCategoryFields(
      tenantId,
      childCategoryId,
      productTypeId,
      newLaunchCollectionId
    );
    return {
      success: true,
      data: fields,
      filterConfigVersion: taxonomyService.getFilterSyncVersion(tenantId),
    };
  }

  @Post('products/upload-image')
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: 5 * 1024 * 1024 },
    })
  )
  async uploadVendorProductImage(
    @UploadedFile() file: Express.Multer.File,
    @Headers('authorization') authHeader?: string,
    @Req() req?: Request
  ) {
    await resolveStrictAuthenticatedVendor(authHeader);
    if (!file) {
      throw new BadRequestException('Please attach a valid image file (JPG, PNG, or WEBP).');
    }
    const host = req?.get?.('host') || `localhost:${process.env.PORT || 3000}`;
    const protocol = req?.protocol || 'http';
    const baseUrl = `${protocol}://${host}`;
    const meta = await storageService.uploadVendorLogo(
      file.buffer,
      file.originalname,
      file.mimetype,
      baseUrl
    );
    return { success: true, data: { url: meta.url, fileName: file.originalname } };
  }

  @Get('products')
  async getProducts(
    @Headers('authorization') authHeader?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('search') search?: string
  ) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    let prods = vendorProducts.filter((p) => p.vendorId === vendor.id);

    if (category) {
      const catLow = category.trim().toLowerCase();
      prods = prods.filter((p: any) =>
        [p.childCategoryId, p.childCategorySlug, p.childCategoryName, p.categoryId, p.categorySlug, p.category]
          .filter(Boolean)
          .some((val) => String(val).toLowerCase() === catLow)
      );
    }
    if (status === 'ACTIVE') {
      prods = prods.filter((p) => p.isActive && p.approvalStatus === 'APPROVED' && !(p as any).isSuspended);
    } else if (status === 'INACTIVE') {
      prods = prods.filter((p) => p.approvalStatus === 'APPROVED' && !p.isActive && !(p as any).isSuspended);
    } else if (status === 'DRAFT') {
      prods = prods.filter((p) => p.approvalStatus === 'DRAFT');
    } else if (status === 'PENDING_APPROVAL') {
      prods = prods.filter((p) => p.approvalStatus === 'PENDING_APPROVAL' || (p as any).revisionStatus === 'PENDING_APPROVAL');
    } else if (status === 'REJECTED') {
      prods = prods.filter((p) => p.approvalStatus === 'REJECTED');
    } else if (status === 'SUSPENDED') {
      prods = prods.filter((p) => (p as any).isSuspended === true);
    } else if (status === 'LOW_STOCK') {
      prods = prods.filter((p) => p.stockCount <= p.lowStockThreshold && p.stockCount > 0);
    } else if (status === 'OUT_OF_STOCK') {
      prods = prods.filter((p) => p.stockCount === 0 || !p.inStock);
    }

    if (search) {
      const q = search.toLowerCase();
      prods = prods.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q)
      );
    }

    return {
      success: true,
      total: prods.length,
      data: prods.map((p) => ({
        ...p,
        status: resolveVendorProductDisplayStatus(p),
        categoryHierarchyActive: taxonomyService.isProductCategoryHierarchyActive(
          p,
          vendor.tenantId || DEFAULT_TENANT_ID
        ),
      })),
    };
  }

  @Get('products/:id')
  async getProductById(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string
  ) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const prod = vendorProducts.find((p) => (p.id === id || p.sku === id) && p.vendorId === vendor.id);
    if (!prod) {
      throw new NotFoundException(`Product ${id} not found in your vendor catalog.`);
    }
    return {
      success: true,
      data: {
        ...prod,
        status: resolveVendorProductDisplayStatus(prod),
        categoryHierarchyActive: taxonomyService.isProductCategoryHierarchyActive(
          prod,
          vendor.tenantId || DEFAULT_TENANT_ID
        ),
      },
    };
  }

  @Post('products')
  async createProduct(
    @Body() body: Partial<VendorProduct> & Record<string, any>,
    @Headers('authorization') authHeader?: string
  ) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const isDraft = body.isDraft === true || body.approvalStatus === 'DRAFT' || body.status === 'DRAFT';

    if (!isDraft && vendor.status !== 'APPROVED' && (vendor.status as string) !== 'ACTIVE') {
      throw new ForbiddenException(
        `Your vendor account status (${vendor.status}) does not permit submitting live products yet. Save as DRAFT or await Company Admin approval.`
      );
    }

    if (
      !body.name ||
      !body.sku ||
      (!body.childCategoryId &&
        !body.childCategorySlug &&
        !body.childCategoryName &&
        !body.categorySlug &&
        !body.category &&
        !body.categoryId) ||
      !body.price ||
      !body.mrp
    ) {
      throw new BadRequestException('Product name, SKU, category, price, and MRP are required.');
    }
    if (Number(body.price) > Number(body.mrp)) {
      throw new BadRequestException('Selling price cannot exceed MRP.');
    }

    const rawMainInput = body.mainCategoryId || body.mainCategorySlug || body.mainCategoryName;
    const rawCatInput = body.childCategoryId || body.categorySlug || body.categoryId || body.category;
    const rawSubInput = body.productTypeId || body.productTypeSlug || body.productTypeName || body.subcategorySlug || body.subcategoryId || body.subcategory || body.subCategory;
    const tenantId = vendor.tenantId || DEFAULT_TENANT_ID;

    const hierarchy = taxonomyService.resolveAndValidateProductTaxonomy(
      {
        mainCategoryId: rawMainInput,
        childCategoryId: rawCatInput,
        productTypeId: rawSubInput,
        brand: body.brand,
        brandId: body.brandId,
      },
      { strictChildMatch: Boolean(rawMainInput), tenantId }
    );

    if (!hierarchy.mainCategoryId || !hierarchy.childCategoryId) {
      throw new BadRequestException(`Unknown category "${rawCatInput}". Vendors must choose from Admin-approved categories.`);
    }
    const activePool = taxonomyService.getTenantPool(tenantId);
    const matchedMain = activePool.mainCategories.find((m) => m.id === hierarchy.mainCategoryId);
    const matchedChild = activePool.childCategories.find((c) => c.id === hierarchy.childCategoryId);
    const matchedType = hierarchy.productTypeId
      ? activePool.productTypes.find((pt) => pt.id === hierarchy.productTypeId)
      : undefined;
    if (
      matchedMain?.isActive === false ||
      !taxonomyService.isMainCategoryActiveForPortals(tenantId, matchedMain?.id || hierarchy.mainCategoryId) ||
      matchedChild?.isActive === false ||
      matchedType?.isActive === false
    ) {
      throw new BadRequestException('This category is currently inactive and cannot be selected for new products.');
    }
    if (rawSubInput && !hierarchy.productTypeId) {
      throw new BadRequestException(
        `Product Type "${rawSubInput}" does not belong to "${hierarchy.childCategoryName}".`
      );
    }
    const defaultPoolType = activePool.productTypes.find(
      (pt) => pt.childCategoryId === hierarchy.childCategoryId && pt.isActive !== false
    );

    const requestedCollectionNeedle = String(
      body.newLaunchCollectionId || body.newLaunchCollectionSlug || ''
    ).trim();
    const matchedNewLaunchCollection = requestedCollectionNeedle
      ? taxonomyService.resolveNewLaunchCollectionScope(tenantId, requestedCollectionNeedle, false, true)
      : undefined;
    if (requestedCollectionNeedle && !matchedNewLaunchCollection) {
      throw new BadRequestException('Selected New Launches collection is currently inactive or unavailable.');
    }

    const shouldValidateDynamic = Boolean(
      !isDraft && (body.categoryAttributes !== undefined || body.enforceCategoryFields === true)
    );
    const fieldValidation = taxonomyService.validateAndNormalizeCategoryAttributes(
      tenantId,
      hierarchy.childCategoryId,
      body.categoryAttributes,
      {
        strictRequired: shouldValidateDynamic,
        productTypeId: hierarchy.productTypeId,
        newLaunchCollectionId: matchedNewLaunchCollection?.id,
      }
    );
    const mergedSpecifications = {
      ...fieldValidation.specificationEntries,
      ...(body.specifications || {}),
    };
    const resolvedPackSize = Array.isArray(fieldValidation.validatedAttributes.packSize)
      ? fieldValidation.validatedAttributes.packSize[0]
      : fieldValidation.validatedAttributes.packSize;

    const id = `vp-prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const slugBase = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const slug = `${slugBase}-${id.slice(-4)}`;
    const stockCount = Math.max(0, Number(body.stockCount ?? body.stock ?? 0));
    const approvalStatus = isDraft ? 'DRAFT' : 'PENDING_APPROVAL';

    const newProd: VendorProduct & Record<string, any> = {
      id,
      vendorId: vendor.id,
      tenantId,
      name: body.name,
      slug,
      sku: body.sku,
      brand: body.brand || vendor.storeName || 'Buildora Verified',
      brandId: hierarchy.brandId,
      brandSlug: (body.brand || vendor.storeName || 'buildora').toLowerCase().replace(/\s+/g, '-'),
      mainCategoryId: hierarchy.mainCategoryId,
      mainCategorySlug: hierarchy.mainCategorySlug,
      mainCategoryName: hierarchy.mainCategoryName,
      childCategoryId: hierarchy.childCategoryId,
      childCategorySlug: hierarchy.childCategorySlug,
      childCategoryName: hierarchy.childCategoryName,
      productTypeId: hierarchy.productTypeId || defaultPoolType?.id || '',
      productTypeSlug: hierarchy.productTypeSlug || defaultPoolType?.slug || '',
      productTypeName: hierarchy.productTypeName || defaultPoolType?.name || '',
      category: hierarchy.childCategoryName,
      categorySlug: hierarchy.childCategorySlug,
      categoryId: hierarchy.childCategoryId,
      categoryName: hierarchy.childCategoryName,
      subcategory: hierarchy.productTypeName || defaultPoolType?.name || '',
      subcategorySlug: hierarchy.productTypeSlug || defaultPoolType?.slug || '',
      subcategoryId: hierarchy.productTypeId || defaultPoolType?.id || '',
      description: body.description || '',
      shortDescription: body.shortDescription || '',
      images:
        body.images && body.images.length > 0
          ? body.images
          : ['https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=400&q=80'],
      price: Number(body.price),
      sellingPrice: Number(body.price),
      mrp: Number(body.mrp),
      discount: Math.round(((Number(body.mrp) - Number(body.price)) / Number(body.mrp)) * 100),
      unit: body.unit || 'Piece',
      packSize: body.packSize || resolvedPackSize || fieldValidation.specificationEntries['Pack Size'] || body.unit || '1 Unit',
      gstRate: Number(body.gstRate) || 18,
      rating: 5.0,
      reviewCount: 0,
      inStock: stockCount > 0,
      stockCount,
      stock: stockCount,
      reservedStock: 0,
      moq: Math.max(1, Number(body.moq) || 1),
      warehouseId: body.warehouseId || undefined,
      warehouseLocation: body.warehouseLocation || 'WH-BLR-04 Peenya Hub',
      lowStockThreshold: Number(body.lowStockThreshold) || 10,
      isBulkEligible: Boolean(body.isBulkEligible ?? (Array.isArray(body.bulkPricing) && body.bulkPricing.length > 0)),
      isNewLaunch: Boolean(matchedNewLaunchCollection || body.isNewLaunch),
      newLaunchCollectionId: matchedNewLaunchCollection?.id || undefined,
      newLaunchCollectionSlug: matchedNewLaunchCollection?.slug || undefined,
      newLaunchCollectionTitle: matchedNewLaunchCollection?.title || undefined,
      productType: body.productType || '',
      size: body.size || body.unit || '',
      bulkPricing: body.bulkPricing || [
        { minQuantity: 10, discountPercentage: 5, unitPrice: Math.round(Number(body.price) * 0.95) }
      ],
      variants: body.variants || [],
      attributes: body.attributes || [],
      categoryAttributes: fieldValidation.validatedAttributes,
      specifications: mergedSpecifications,
      applications: Array.isArray(body.applications) ? body.applications : [],
      deliverySpeedAvailable: body.deliverySpeedAvailable || ['ASAP_60', 'STANDARD'],
      approvalStatus,
      isActive: false,
      isSuspended: false,
      version: 1,
      versionHistory: [
        {
          version: 1,
          action: isDraft ? 'CREATED_DRAFT' : 'SUBMITTED_FOR_APPROVAL',
          actor: vendor.email,
          timestamp: new Date().toISOString(),
          snapshot: {
            name: body.name,
            price: Number(body.price),
            mrp: Number(body.mrp),
            stockCount,
          },
        },
      ],
      auditLogs: [
        {
          id: `paud-${Date.now()}`,
          action: isDraft ? 'PRODUCT_DRAFT_CREATED' : 'PRODUCT_SUBMITTED',
          actor: vendor.email,
          timestamp: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    vendorProducts.unshift(newProd);
    // Explicitly enforce non-publication for DRAFT / PENDING_APPROVAL
    syncVendorProductToCustomerCatalog(newProd);
    await platformPersistenceService.upsert(PlatformProductModel, newProd);

    if (stockCount > 0) {
      const vendorPrimaryWh = vendorWarehouses.find((w: any) => w.vendorId === vendor.id) || vendorWarehouses[0];
      const movement: VendorStockMovement = {
        id: `sm-${Date.now()}`,
        vendorId: vendor.id,
        productId: newProd.id,
        productName: newProd.name,
        sku: newProd.sku,
        warehouseId: vendorPrimaryWh?.id || 'wh-1',
        warehouseName: vendorPrimaryWh?.name || 'Primary Depot',
        type: 'INWARD',
        quantityDelta: stockCount,
        quantityBefore: 0,
        quantityAfter: stockCount,
        reason: 'Initial stock intake upon product catalog listing',
        performedBy: vendor.name || vendor.email,
        createdAt: new Date().toISOString()
      } as any;
      vendorStockMovements.unshift(movement);
      await platformPersistenceService.upsert(PlatformStockMovementModel, movement);
    }

    if (!isDraft) {
      await platformNotificationService.dispatch({
        tenantId,
        recipientRole: 'ADMIN',
        recipientId: 'TENANT_ADMIN',
        type: 'PRODUCT',
        title: `New Product Submitted: ${newProd.name}`,
        message: `${vendor.storeName} submitted SKU ${newProd.sku} for quality & catalog approval.`,
        severity: 'INFO',
        actionUrl: '/products',
        metadata: { productId: newProd.id, vendorId: vendor.id, sku: newProd.sku },
      });
      realtimeBus.emitVendorAndAdmin(vendor.id, 'product.submitted', { product: newProd }, tenantId);
    }

    return {
      success: true,
      message: isDraft
        ? 'Product saved as draft (hidden from customers).'
        : 'Product submitted for Company Admin approval.',
      data: {
        ...newProd,
        status: resolveVendorProductDisplayStatus(newProd),
      },
    };
  }

  @Put('products/:id')
  async updateProduct(
    @Param('id') id: string,
    @Body() body: Partial<VendorProduct> & Record<string, any>,
    @Headers('authorization') authHeader?: string
  ) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const idx = vendorProducts.findIndex((p) => p.id === id || p.sku === id);
    if (idx === -1) {
      throw new NotFoundException(`Product ${id} not found.`);
    }
    const existing = vendorProducts[idx] as VendorProduct & Record<string, any>;
    if (existing.vendorId !== vendor.id) {
      throw new ForbiddenException('Ownership violation: You cannot modify another vendor product.');
    }

    const nextPrice = body.price !== undefined ? Number(body.price) : existing.price;
    const nextMrp = body.mrp !== undefined ? Number(body.mrp) : existing.mrp;
    if (nextPrice > nextMrp) {
      throw new BadRequestException('Selling price cannot exceed MRP.');
    }

    const tenantId = vendor.tenantId || DEFAULT_TENANT_ID;
    const categoryAssignmentInBody = [
      'mainCategoryId',
      'mainCategorySlug',
      'mainCategoryName',
      'childCategoryId',
      'categoryId',
      'categorySlug',
      'category',
      'productTypeId',
      'productTypeSlug',
      'subcategoryId',
      'subcategorySlug',
      'subcategory',
      'subCategory',
    ].some((k) => body[k] !== undefined);

    const requestedMain = body.mainCategoryId || body.mainCategorySlug || body.mainCategoryName;
    const requestedChild = body.childCategoryId || body.categorySlug || body.categoryId || body.category;
    const requestedType =
      body.productTypeId ||
      body.productTypeSlug ||
      body.subcategorySlug ||
      body.subcategoryId ||
      body.subcategory ||
      (body as any).subCategory;

    const categoryChanged =
      (requestedMain &&
        String(requestedMain) !== String(existing.mainCategoryId || '') &&
        String(requestedMain) !== String(existing.mainCategorySlug || '')) ||
      (requestedChild &&
        String(requestedChild) !== String(existing.childCategoryId || existing.categoryId || '') &&
        String(requestedChild) !== String(existing.childCategorySlug || existing.categorySlug || '')) ||
      (requestedType &&
        String(requestedType) !== String(existing.productTypeId || existing.subcategoryId || '') &&
        String(requestedType) !== String(existing.productTypeSlug || existing.subcategorySlug || ''));

    const isResubmittingForApproval =
      (existing.approvalStatus === 'DRAFT' || existing.approvalStatus === 'REJECTED') &&
      !body.isDraft &&
      body.submitForApproval !== false;

    if (categoryAssignmentInBody || isResubmittingForApproval) {
      const checkHierarchy = taxonomyService.resolveAndValidateProductTaxonomy(
        {
          mainCategoryId: requestedMain || existing.mainCategoryId,
          childCategoryId: requestedChild || existing.childCategoryId || existing.categorySlug,
          productTypeId: requestedType || existing.productTypeId || existing.subcategorySlug,
          brand: body.brand || existing.brand,
          brandId: body.brandId || existing.brandId,
        },
        { strictChildMatch: Boolean(requestedMain), tenantId }
      );
      const hierarchyActive = taxonomyService.isProductCategoryHierarchyActive(
        {
          mainCategoryId: checkHierarchy.mainCategoryId || existing.mainCategoryId,
          childCategoryId: checkHierarchy.childCategoryId || existing.childCategoryId,
          productTypeId: checkHierarchy.productTypeId || existing.productTypeId,
        },
        tenantId
      );
      if (!hierarchyActive && (categoryChanged || isResubmittingForApproval)) {
        throw new BadRequestException(
          'This category is currently inactive and cannot be selected for new products.'
        );
      }
    }

    const catalogFieldsChanged = [
      'name',
      'description',
      'price',
      'mrp',
      'images',
      'categoryAttributes',
      'specifications',
      'variants',
      'categorySlug',
      'bulkPricing',
      'newLaunchCollectionId',
      'isNewLaunch',
    ].some((k) => body[k] !== undefined);

    const nextVersion = (Number(existing.version) || 1) + 1;
    if (!Array.isArray(existing.versionHistory)) existing.versionHistory = [];
    if (!Array.isArray(existing.auditLogs)) existing.auditLogs = [];

    // Stock/availability updates synchronize immediately without hiding approved SKU
    if (body.stockCount !== undefined) {
      const nextStock = Math.max(0, Number(body.stockCount));
      existing.stockCount = nextStock;
      existing.stock = nextStock;
      existing.inStock = nextStock > 0;
    }

    const updatedHierarchyPreview = taxonomyService.resolveAndValidateProductTaxonomy(
      {
        mainCategoryId: body.mainCategoryId || body.mainCategorySlug || existing.mainCategoryId,
        childCategoryId: body.childCategoryId || body.categorySlug || body.categoryId || body.category || existing.childCategoryId || existing.categorySlug,
        productTypeId: body.productTypeId || body.productTypeSlug || body.subcategorySlug || body.subcategoryId || body.subcategory || (body as any).subCategory || existing.productTypeId || existing.subcategorySlug,
        brand: body.brand || existing.brand,
        brandId: body.brandId || existing.brandId,
      },
      { strictChildMatch: Boolean(body.mainCategoryId), tenantId }
    );

    const requestedCollectionInUpdate =
      body.newLaunchCollectionId !== undefined
        ? String(body.newLaunchCollectionId || '').trim()
        : existing.newLaunchCollectionId || '';
    const matchedEditNewLaunchCol = requestedCollectionInUpdate
      ? taxonomyService.resolveNewLaunchCollectionScope(tenantId, requestedCollectionInUpdate, false, true)
      : undefined;
    if (
      body.newLaunchCollectionId !== undefined &&
      String(body.newLaunchCollectionId || '').trim() &&
      !matchedEditNewLaunchCol
    ) {
      throw new BadRequestException('Selected New Launches collection is currently inactive or unavailable.');
    }

    let validatedEditAttrs: { validatedAttributes: Record<string, any>; specificationEntries: Record<string, string> } | null = null;
    if (body.categoryAttributes !== undefined || body.enforceCategoryFields === true) {
      const targetChildId = updatedHierarchyPreview.childCategoryId || existing.childCategoryId || existing.categoryId || existing.categorySlug;
      validatedEditAttrs = taxonomyService.validateAndNormalizeCategoryAttributes(
        tenantId,
        targetChildId,
        body.categoryAttributes ?? existing.categoryAttributes,
        {
          strictRequired: !body.isDraft && (body.categoryAttributes !== undefined || body.enforceCategoryFields === true),
          productTypeId: updatedHierarchyPreview.productTypeId || existing.productTypeId,
          newLaunchCollectionId: matchedEditNewLaunchCol?.id,
          existingAttributes: existing.categoryAttributes,
        }
      );
    }

    if (existing.approvalStatus === 'APPROVED' && catalogFieldsChanged && body.requiresApproval !== false) {
      // Stage revision changes so public storefront keeps showing approved version until Admin approves
      const staged: Record<string, any> = {};
      for (const k of [
        'name',
        'description',
        'shortDescription',
        'price',
        'mrp',
        'images',
        'categoryAttributes',
        'specifications',
        'variants',
        'attributes',
        'bulkPricing',
        'moq',
        'warehouseId',
        'warehouseLocation',
        'applications',
        'categorySlug',
        'category',
        'subcategory',
        'unit',
        'packSize',
        'gstRate',
        'deliverySpeedAvailable',
        'newLaunchCollectionId',
        'isNewLaunch',
      ]) {
        if (body[k] !== undefined) staged[k] = body[k];
      }
      if (body.newLaunchCollectionId !== undefined) {
        staged.newLaunchCollectionId = matchedEditNewLaunchCol?.id || undefined;
        staged.newLaunchCollectionSlug = matchedEditNewLaunchCol?.slug || undefined;
        staged.newLaunchCollectionTitle = matchedEditNewLaunchCol?.title || undefined;
        if (matchedEditNewLaunchCol) staged.isNewLaunch = true;
      }
      if (validatedEditAttrs) {
        staged.categoryAttributes = validatedEditAttrs.validatedAttributes;
        staged.specifications = {
          ...(existing.specifications || {}),
          ...validatedEditAttrs.specificationEntries,
          ...(body.specifications || {}),
        };
      }
      existing.pendingRevision = { ...(existing.pendingRevision || {}), ...staged };
      existing.revisionStatus = 'PENDING_APPROVAL';
      existing.hasPendingChanges = true;
      existing.version = nextVersion;
      existing.versionHistory.unshift({
        version: nextVersion,
        action: 'REVISION_PENDING_APPROVAL',
        actor: vendor.email,
        timestamp: new Date().toISOString(),
        snapshot: staged,
      });
      existing.auditLogs.unshift({
        id: `paud-${Date.now()}`,
        action: 'PRODUCT_REVISION_SUBMITTED',
        actor: vendor.email,
        timestamp: new Date().toISOString(),
      });
      existing.updatedAt = new Date().toISOString();
      syncVendorProductToCustomerCatalog(existing);
      await platformPersistenceService.upsert(PlatformProductModel, existing);

      await platformNotificationService.dispatch({
        tenantId,
        recipientRole: 'ADMIN',
        recipientId: 'TENANT_ADMIN',
        type: 'PRODUCT',
        title: `Product Revision Pending Review: ${existing.name}`,
        message: `${vendor.storeName} updated SKU ${existing.sku}. Changes await approval before going live.`,
        severity: 'INFO',
        actionUrl: '/products',
        metadata: { productId: existing.id, vendorId: vendor.id },
      });
      realtimeBus.emitVendorAndAdmin(vendor.id, 'product.submitted', { product: existing, isRevision: true }, tenantId);

      return {
        success: true,
        pendingApproval: true,
        message: 'Catalog changes submitted for Company Admin approval. Previous approved version stays live until approved.',
        data: existing
      };
    }

    // Apply direct update (e.g., DRAFT/REJECTED resubmission or stock-only update)
    const {
      vendorId: _ignoreVendor,
      approvalStatus: _ignoreApproval,
      isDraft,
      status: _ignoreStatus,
      isActive: _ignoreActive,
      isSuspended: _ignoreSuspended,
      pendingRevision: _ignoreRevision,
      approvedBy: _ignoreApprovedBy,
      approvedAt: _ignoreApprovedAt,
      rejectedBy: _ignoreRejectedBy,
      rejectedAt: _ignoreRejectedAt,
      ...safeBody
    } = body;
    Object.assign(existing, safeBody);
    existing.isActive = existing.approvalStatus === 'APPROVED' ? existing.isActive !== false : false;
    const updatedHierarchy = taxonomyService.resolveAndValidateProductTaxonomy(
      {
        mainCategoryId: body.mainCategoryId || body.mainCategorySlug || existing.mainCategoryId,
        childCategoryId: body.childCategoryId || body.categorySlug || body.categoryId || body.category || existing.childCategoryId || existing.categorySlug,
        productTypeId: body.productTypeId || body.productTypeSlug || body.subcategorySlug || body.subcategoryId || body.subcategory || (body as any).subCategory || existing.productTypeId || existing.subcategorySlug,
        brand: body.brand || existing.brand,
        brandId: body.brandId || existing.brandId,
      },
      { strictChildMatch: Boolean(body.mainCategoryId), tenantId }
    );
    if (updatedHierarchy.mainCategoryId && updatedHierarchy.childCategoryId) {
      existing.mainCategoryId = updatedHierarchy.mainCategoryId;
      existing.mainCategorySlug = updatedHierarchy.mainCategorySlug;
      existing.mainCategoryName = updatedHierarchy.mainCategoryName;
      existing.childCategoryId = updatedHierarchy.childCategoryId;
      existing.childCategorySlug = updatedHierarchy.childCategorySlug;
      existing.childCategoryName = updatedHierarchy.childCategoryName;
      existing.productTypeId = updatedHierarchy.productTypeId;
      existing.productTypeSlug = updatedHierarchy.productTypeSlug;
      existing.productTypeName = updatedHierarchy.productTypeName;
      existing.brandId = updatedHierarchy.brandId;
      existing.categoryId = updatedHierarchy.childCategoryId;
      existing.category = updatedHierarchy.childCategoryName;
      existing.categorySlug = updatedHierarchy.childCategorySlug;
      if (updatedHierarchy.productTypeId) {
        existing.subcategoryId = updatedHierarchy.productTypeId;
        existing.subcategory = updatedHierarchy.productTypeName;
        existing.subcategorySlug = updatedHierarchy.productTypeSlug;
      }
    }
    if (validatedEditAttrs) {
      existing.categoryAttributes = validatedEditAttrs.validatedAttributes;
      existing.specifications = {
        ...(existing.specifications || {}),
        ...validatedEditAttrs.specificationEntries,
        ...(body.specifications || {}),
      };
    } else if (body.categoryAttributes !== undefined || body.enforceCategoryFields === true) {
      const targetChildId = existing.childCategoryId || existing.categoryId || existing.categorySlug;
      const fv = taxonomyService.validateAndNormalizeCategoryAttributes(
        tenantId,
        targetChildId,
        body.categoryAttributes ?? existing.categoryAttributes,
        {
          strictRequired: !isDraft && (body.categoryAttributes !== undefined || body.enforceCategoryFields === true),
          productTypeId: existing.productTypeId,
          newLaunchCollectionId: matchedEditNewLaunchCol?.id,
          existingAttributes: existing.categoryAttributes,
        }
      );
      existing.categoryAttributes = fv.validatedAttributes;
      existing.specifications = {
        ...(existing.specifications || {}),
        ...fv.specificationEntries,
        ...(body.specifications || {}),
      };
    }
    if (body.newLaunchCollectionId !== undefined) {
      existing.newLaunchCollectionId = matchedEditNewLaunchCol?.id || undefined;
      existing.newLaunchCollectionSlug = matchedEditNewLaunchCol?.slug || undefined;
      existing.newLaunchCollectionTitle = matchedEditNewLaunchCol?.title || undefined;
      if (matchedEditNewLaunchCol) existing.isNewLaunch = true;
    }
    existing.vendorId = vendor.id;
    existing.sellingPrice = Number(existing.price);
    existing.discount = existing.mrp > existing.price
      ? Math.round(((existing.mrp - existing.price) / existing.mrp) * 100)
      : 0;

    if ((existing.approvalStatus === 'DRAFT' || existing.approvalStatus === 'REJECTED') && !isDraft && body.submitForApproval !== false) {
      existing.approvalStatus = 'PENDING_APPROVAL';
      existing.isActive = false;
      existing.rejectionReason = undefined;
    }

    existing.version = nextVersion;
    existing.versionHistory.unshift({
      version: nextVersion,
      action: 'UPDATED',
      actor: vendor.email,
      timestamp: new Date().toISOString(),
      snapshot: { name: existing.name, price: existing.price, mrp: existing.mrp, stockCount: existing.stockCount },
    });
    existing.auditLogs.unshift({
      id: `paud-${Date.now()}`,
      action: 'PRODUCT_UPDATED',
      actor: vendor.email,
      timestamp: new Date().toISOString(),
    });
    existing.updatedAt = new Date().toISOString();

    syncVendorProductToCustomerCatalog(existing);
    await platformPersistenceService.upsert(PlatformProductModel, existing);

    if (existing.approvalStatus === 'PENDING_APPROVAL') {
      await platformNotificationService.dispatch({
        tenantId,
        recipientRole: 'ADMIN',
        recipientId: 'TENANT_ADMIN',
        type: 'PRODUCT',
        title: `Product Submitted for Approval: ${existing.name}`,
        message: `${vendor.storeName} submitted SKU ${existing.sku} for review.`,
        severity: 'INFO',
        actionUrl: '/products',
        metadata: { productId: existing.id, vendorId: vendor.id },
      });
      realtimeBus.emitVendorAndAdmin(vendor.id, 'product.submitted', { product: existing }, tenantId);
    } else if (existing.approvalStatus === 'APPROVED' && existing.isActive) {
      realtimeBus.emitPublic(
        'inventory.updated',
        { productId: existing.id, sku: existing.sku, stockCount: existing.stockCount, inStock: existing.inStock },
        tenantId
      );
    }

    return {
      success: true,
      message: existing.approvalStatus === 'PENDING_APPROVAL'
        ? 'Product updated and submitted for Company Admin approval.'
        : 'Product updated and synchronized.',
      data: existing
    };
  }

  @Delete('products/:id')
  async deleteProduct(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string
  ) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const prod = vendorProducts.find((p) => p.id === id);
    if (!prod) {
      throw new NotFoundException(`Product ${id} not found.`);
    }
    if (prod.vendorId !== vendor.id) {
      throw new ForbiddenException('Ownership violation: Cannot delete another vendor product.');
    }

    vendorProducts = vendorProducts.filter((p) => p.id !== id);
    const custIdx = dbStore.products.findIndex((p) => p.sku === prod.sku || p.slug === prod.slug || p.id === prod.id);
    if (custIdx !== -1) {
      dbStore.products.splice(custIdx, 1);
    }
    await platformPersistenceService.remove(PlatformProductModel, prod.id);
    realtimeBus.emitPublic('product.suspended', { productId: prod.id, sku: prod.sku }, vendor.tenantId || DEFAULT_TENANT_ID);

    return {
      success: true,
      message: 'Product removed from vendor catalog and customer catalog.'
    };
  }

  @Post('products/bulk-import')
  async bulkImportProducts(
    @Body() body: { products: Partial<VendorProduct>[]; isDraft?: boolean },
    @Headers('authorization') authHeader?: string
  ) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    if (!body.products || !Array.isArray(body.products) || body.products.length === 0) {
      throw new BadRequestException('Array of products required for bulk import.');
    }

    const tenantId = vendor.tenantId || DEFAULT_TENANT_ID;
    const isDraft = Boolean(body.isDraft);
    const approvalStatus = isDraft ? 'DRAFT' : 'PENDING_APPROVAL';
    const imported: VendorProduct[] = [];

    for (const item of body.products) {
      if (!item.name || !item.sku || !item.price) continue;
      const id = `vp-prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const stockCount = Math.max(0, Number(item.stockCount ?? 50));
      const prod: VendorProduct & Record<string, any> = {
        id,
        vendorId: vendor.id,
        tenantId,
        name: item.name,
        slug: `${item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${id.slice(-4)}`,
        sku: item.sku,
        brand: item.brand || vendor.storeName || 'Buildora Verified',
        brandSlug: (item.brand || vendor.storeName || 'buildora').toLowerCase().replace(/\s+/g, '-'),
        category: item.category || 'Civil & Interiors',
        categorySlug: item.categorySlug || 'civil-concrete',
        categoryId: item.categorySlug || 'civil-concrete',
        categoryName: item.category || 'Civil & Interiors',
        subcategory: item.subcategory || 'General',
        subcategorySlug: item.subcategorySlug || 'general',
        description: item.description || '',
        images: item.images && item.images.length > 0 ? item.images : ['https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=400&q=80'],
        price: Number(item.price),
        sellingPrice: Number(item.price),
        mrp: Number(item.mrp || item.price),
        discount: item.mrp && item.price ? Math.round(((Number(item.mrp) - Number(item.price)) / Number(item.mrp)) * 100) : 0,
        unit: item.unit || 'Piece',
        packSize: item.packSize || '1 Unit',
        gstRate: Number(item.gstRate) || 18,
        rating: 5.0,
        reviewCount: 0,
        inStock: stockCount > 0,
        stockCount,
        stock: stockCount,
        reservedStock: 0,
        lowStockThreshold: 10,
        isBulkEligible: Boolean(item.isBulkEligible),
        isNewLaunch: Boolean(item.isNewLaunch),
        bulkPricing: item.bulkPricing || [],
        variants: item.variants || [],
        specifications: item.specifications || {},
        deliverySpeedAvailable: ['ASAP_60', 'STANDARD'],
        approvalStatus,
        isActive: false,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      vendorProducts.unshift(prod);
      syncVendorProductToCustomerCatalog(prod);
      await platformPersistenceService.upsert(PlatformProductModel, prod);
      imported.push(prod);
    }

    if (!isDraft && imported.length > 0) {
      await platformNotificationService.dispatch({
        tenantId,
        recipientRole: 'ADMIN',
        recipientId: 'TENANT_ADMIN',
        type: 'PRODUCT',
        title: `Bulk Import: ${imported.length} Products Awaiting Review`,
        message: `${vendor.storeName} imported ${imported.length} catalog SKUs pending admin approval.`,
        severity: 'INFO',
        actionUrl: '/products',
      });
    }

    return {
      success: true,
      importedCount: imported.length,
      data: imported
    };
  }

  @Get('products/export')
  async exportProducts(@Headers('authorization') authHeader?: string) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const mine = vendorProducts.filter((p) => p.vendorId === vendor.id);
    return {
      success: true,
      count: mine.length,
      data: mine
    };
  }

  @Put('products/:id/variants')
  async updateProductVariants(
    @Param('id') id: string,
    @Body() body: { variants: any[]; attributes?: any[] },
    @Headers('authorization') authHeader?: string
  ) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const prod = vendorProducts.find(
      (p) => (p.id === id || p.id === `vp-${id}` || p.sku === id) && p.vendorId === vendor.id
    );
    if (!prod) throw new NotFoundException('Product not found');

    prod.variants = body.variants || [];
    if (body.attributes) prod.attributes = body.attributes;
    prod.updatedAt = new Date().toISOString();

    syncVendorProductToCustomerCatalog(prod);
    await platformPersistenceService.upsert(PlatformProductModel, prod);
    if (prod.approvalStatus === 'APPROVED' && prod.isActive) {
      realtimeBus.emitPublic('product.updated', { product: prod }, vendor.tenantId || DEFAULT_TENANT_ID);
    }

    return {
      success: true,
      message: 'Product variants updated successfully.',
      variants: prod.variants,
      attributes: prod.attributes
    };
  }

  // ==========================================
  // 6. BULK PRICING TIERS
  // ==========================================
  @Get('products/:id/bulk-pricing')
  async getBulkPricing(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string
  ) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const prod = vendorProducts.find((p) => p.id === id && p.vendorId === vendor.id);
    if (!prod) throw new NotFoundException('Product not found');
    return {
      success: true,
      productName: prod.name,
      basePrice: prod.price,
      bulkPricing: prod.bulkPricing || []
    };
  }

  @Put('products/:id/bulk-pricing')
  async updateBulkPricing(
    @Param('id') id: string,
    @Body() body: { bulkPricing: BulkPriceTier[]; isBulkEligible?: boolean },
    @Headers('authorization') authHeader?: string
  ) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const prod = vendorProducts.find((p) => p.id === id && p.vendorId === vendor.id);
    if (!prod) throw new NotFoundException('Product not found');

    for (const tier of body.bulkPricing || []) {
      if (tier.minQuantity < 2) {
        throw new BadRequestException('Minimum quantity must be 2 or greater.');
      }
      if (tier.unitPrice >= prod.price) {
        throw new BadRequestException(`Bulk unit price (₹${tier.unitPrice}) must be lower than base price (₹${prod.price}).`);
      }
    }

    prod.bulkPricing = body.bulkPricing;
    if (body.isBulkEligible !== undefined) {
      prod.isBulkEligible = body.isBulkEligible;
    }
    prod.updatedAt = new Date().toISOString();
    syncVendorProductToCustomerCatalog(prod);
    await platformPersistenceService.upsert(PlatformProductModel, prod);

    return {
      success: true,
      message: 'Bulk pricing tiers updated and synchronized.',
      data: prod.bulkPricing
    };
  }

  @Get('bulk-pricing/all')
  async getAllBulkPricing(@Headers('authorization') authHeader?: string) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const bulkProducts = vendorProducts.filter(
      (p) => p.vendorId === vendor.id && p.isBulkEligible && p.bulkPricing && p.bulkPricing.length > 0
    );
    return {
      success: true,
      count: bulkProducts.length,
      data: bulkProducts.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category,
        basePrice: p.price,
        mrp: p.mrp,
        bulkPricing: p.bulkPricing
      }))
    };
  }

  // ==========================================
  // 7. INVENTORY, WAREHOUSES & ATOMIC MOVEMENTS
  // ==========================================
  @Get('inventory')
  async getInventory(@Headers('authorization') authHeader?: string) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const tenantId = vendor.tenantId || DEFAULT_TENANT_ID;
    const mine = vendorProducts.filter((p) => p.vendorId === vendor.id);
    const myWarehouses = vendorWarehouses.filter((w: any) => !w.vendorId || w.vendorId === vendor.id);
    const vendorPrimaryWh = myWarehouses.find((w: any) => w.isPrimary) || myWarehouses[0];
    const tenantWarehouses = companyAdminDataService.getTenantWarehouses(tenantId);
    const fallbackDarkStore = tenantWarehouses.find(
      (w: any) => w.id === vendor.businessInfo?.assignedDarkStoreId
    ) || tenantWarehouses[0];

    const items = mine.map((p: any) => {
      const reserved = Number(p.reservedStock || 0);
      const stockCount = Number(p.stockCount || 0);
      const available = Math.max(0, stockCount - reserved);
      const primaryWhId = vendorPrimaryWh?.id || fallbackDarkStore?.id || 'WH-BLR-04';
      const warehouseStocks =
        p.warehouseStocks && Object.keys(p.warehouseStocks).length > 0
          ? p.warehouseStocks
          : { [primaryWhId]: stockCount };
      return {
        productId: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category,
        unit: p.unit,
        stockCount,
        reservedStock: reserved,
        availableStock: available,
        lowStockThreshold: p.lowStockThreshold,
        status:
          available === 0 ? 'OUT_OF_STOCK' : available <= p.lowStockThreshold ? 'LOW_STOCK' : 'IN_STOCK',
        warehouse: vendorPrimaryWh?.name || fallbackDarkStore?.name || vendor.businessInfo?.warehouseAddress || 'Primary Depot',
        warehouseId: primaryWhId,
        warehouseStocks,
      };
    });

    return {
      success: true,
      total: items.length,
      data: items
    };
  }

  @Post('inventory/adjust')
  async adjustStock(
    @Body()
    body: {
      productId: string;
      adjustmentType: 'ADD' | 'SUBTRACT' | 'SET';
      quantity: number;
      reason: string;
      warehouseId?: string;
      movementType?: 'INWARD' | 'DISPATCH' | 'ADJUSTMENT' | 'RETURN' | 'DAMAGED';
      referenceNumber?: string;
    },
    @Headers('authorization') authHeader?: string
  ) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const prod = vendorProducts.find((p) => p.id === body.productId && p.vendorId === vendor.id) as any;
    if (!prod) throw new NotFoundException('Product not found in your vendor catalog');

    const qty = Number(body.quantity);
    if (isNaN(qty) || qty < 0) {
      throw new BadRequestException('Valid adjustment quantity is required.');
    }

    const before = Number(prod.stockCount || 0);
    let after = before;
    let delta = qty;

    if (body.adjustmentType === 'ADD') {
      after = before + qty;
      delta = qty;
    } else if (body.adjustmentType === 'SUBTRACT') {
      after = Math.max(0, before - qty);
      delta = -(before - after);
    } else {
      after = qty;
      delta = qty - before;
    }

    prod.stockCount = after;
    prod.stock = after;
    prod.inStock = Math.max(0, after - Number(prod.reservedStock || 0)) > 0;
    prod.updatedAt = new Date().toISOString();

    if (body.warehouseId) {
      prod.warehouseStocks = prod.warehouseStocks || {};
      prod.warehouseStocks[body.warehouseId] = after;
    }

    syncVendorProductToCustomerCatalog(prod);
    await platformPersistenceService.upsert(PlatformProductModel, prod);

    const wh = vendorWarehouses.find((w: any) => w.id === body.warehouseId) || vendorWarehouses[0];
    const movement: VendorStockMovement & Record<string, any> = {
      id: `sm-${Date.now()}`,
      vendorId: vendor.id,
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      warehouseId: wh?.id || body.warehouseId || 'wh-1',
      warehouseName: wh?.name || 'Primary Dispatch Depot',
      type: body.movementType || (delta > 0 ? 'INWARD' : 'ADJUSTMENT'),
      quantityDelta: delta,
      quantityBefore: before,
      quantityAfter: after,
      reason: body.reason || 'Inventory stock manual adjustment',
      referenceNumber: body.referenceNumber || `ADJ-${Date.now()}`,
      performedBy: vendor.name || vendor.email,
      createdAt: new Date().toISOString()
    };
    vendorStockMovements.unshift(movement);
    await platformPersistenceService.upsert(PlatformStockMovementModel, movement);

    const tenantId = vendor.tenantId || DEFAULT_TENANT_ID;
    realtimeBus.emitPublic(
      'inventory.updated',
      { productId: prod.id, sku: prod.sku, stockCount: after, inStock: prod.inStock },
      tenantId
    );
    realtimeBus.emitVendorAndAdmin(
      vendor.id,
      'inventory.updated',
      { productId: prod.id, sku: prod.sku, stockCount: after, movement },
      tenantId
    );

    if (after <= Number(prod.lowStockThreshold || 10)) {
      await platformNotificationService.dispatch({
        tenantId,
        recipientRole: 'VENDOR',
        recipientId: vendor.id,
        type: 'STOCK',
        title: after === 0 ? `Out of Stock: ${prod.name}` : `Low Stock Alert: ${prod.name}`,
        message: `${prod.name} (${prod.sku}) now has ${after} units available.`,
        severity: after === 0 ? 'CRITICAL' : 'WARNING',
        actionUrl: '/inventory',
        metadata: { productId: prod.id, stockCount: after },
      });
    }

    return {
      success: true,
      message: `Stock updated for ${prod.name}. New count: ${prod.stockCount}.`,
      data: {
        productId: prod.id,
        newStock: prod.stockCount,
        inStock: prod.inStock,
        movement
      }
    };
  }

  @Get('inventory/movements')
  async getStockMovements(
    @Headers('authorization') authHeader?: string,
    @Query('productId') productId?: string
  ) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    let movements = vendorStockMovements.filter(
      (m: any) => !m.vendorId || m.vendorId === vendor.id
    );
    if (productId) {
      movements = movements.filter((m) => m.productId === productId);
    }
    return {
      success: true,
      count: movements.length,
      data: movements
    };
  }

  @Get('warehouses')
  async getWarehouses(@Headers('authorization') authHeader?: string) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const tenantId = vendor.tenantId || DEFAULT_TENANT_ID;
    const mine = vendorWarehouses.filter(
      (w: any) => !w.vendorId || w.vendorId === vendor.id
    );
    const myProds = vendorProducts.filter((p) => p.vendorId === vendor.id) as any[];
    const primaryWh = mine.find((w: any) => w.isPrimary) || mine[0];

    const enriched = mine.map((wh: any) => {
      let skuCount = 0;
      let totalUnits = 0;
      for (const p of myProds) {
        const ws = p.warehouseStocks || (primaryWh ? { [primaryWh.id]: Number(p.stockCount || 0) } : {});
        const units = Number(ws[wh.id] ?? 0);
        if (units > 0 || (primaryWh?.id === wh.id && Object.keys(ws).length === 0)) {
          skuCount += 1;
          totalUnits += units;
        }
      }
      return {
        ...wh,
        skuCount,
        totalUnits,
      };
    });

    const tenantDarkStores = companyAdminDataService.getTenantWarehouses(tenantId);
    return {
      success: true,
      data: enriched,
      darkStores: tenantDarkStores.length > 0 ? tenantDarkStores : Object.values(BENGALURU_WAREHOUSES)
    };
  }

  @Post('warehouses')
  async createWarehouse(
    @Body() body: Partial<VendorWarehouse>,
    @Headers('authorization') authHeader?: string
  ) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    if (!body.name || !body.address || !body.pincode) {
      throw new BadRequestException('Warehouse name, address, and pincode are required.');
    }
    const newWh: VendorWarehouse & Record<string, any> = {
      id: `wh-${Date.now()}`,
      vendorId: vendor.id,
      tenantId: vendor.tenantId || DEFAULT_TENANT_ID,
      name: body.name,
      address: body.address,
      city: body.city || 'Bengaluru',
      state: body.state || 'Karnataka',
      pincode: body.pincode,
      contactPerson: body.contactPerson,
      phone: body.phone,
      isPrimary: Boolean(body.isPrimary)
    };

    if (newWh.isPrimary) {
      vendorWarehouses.forEach((w: any) => {
        if (!w.vendorId || w.vendorId === vendor.id) w.isPrimary = false;
      });
    }
    vendorWarehouses.push(newWh);
    await platformPersistenceService.upsert(PlatformWarehouseModel, newWh);

    return {
      success: true,
      message: 'Warehouse added successfully.',
      data: newWh
    };
  }

  @Put('warehouses/:id')
  async updateWarehouse(
    @Param('id') id: string,
    @Body() body: Partial<VendorWarehouse>,
    @Headers('authorization') authHeader?: string
  ) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const wh = vendorWarehouses.find(
      (w: any) => w.id === id && (!w.vendorId || w.vendorId === vendor.id)
    ) as any;
    if (!wh) throw new NotFoundException('Warehouse not found');

    if (body.isPrimary) {
      vendorWarehouses.forEach((w: any) => {
        if (!w.vendorId || w.vendorId === vendor.id) w.isPrimary = false;
      });
    }
    Object.assign(wh, body, { vendorId: vendor.id });
    await platformPersistenceService.upsert(PlatformWarehouseModel, wh);

    return {
      success: true,
      message: 'Warehouse updated successfully.',
      data: wh
    };
  }

  @Delete('warehouses/:id')
  async deleteWarehouse(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string
  ) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const target = vendorWarehouses.find((w: any) => w.id === id) as any;
    if (!target) throw new NotFoundException('Warehouse not found');
    if (target.vendorId && target.vendorId !== vendor.id) {
      throw new ForbiddenException('Ownership violation: Cannot delete another vendor warehouse.');
    }
    vendorWarehouses = vendorWarehouses.filter((w) => w.id !== id);
    await platformPersistenceService.remove(PlatformWarehouseModel, id);
    return { success: true, message: 'Warehouse removed successfully.' };
  }

  // ==========================================
  // 8. ORDERS & 60-MIN SITE DISPATCH WORKFLOW
  // ==========================================
  @Get('orders')
  async getOrders(
    @Headers('authorization') authHeader?: string,
    @Query('status') status?: string,
    @Query('search') search?: string
  ) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    let orders = vendorOrders.filter((o) => o.vendorId === vendor.id);
    if (status && status !== 'ALL') {
      const targetSt = status.toUpperCase();
      orders = orders.filter((o) => String(o.status).toUpperCase() === targetSt);
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      orders = orders.filter(
        (o) =>
          String(o.orderNumber || o.id).toLowerCase().includes(q) ||
          String(o.customerName || '').toLowerCase().includes(q) ||
          (o.items || []).some(
            (i: any) =>
              String(i.name || '').toLowerCase().includes(q) ||
              String(i.sku || '').toLowerCase().includes(q)
          )
      );
    }
    const enriched = orders.map((o: any) => {
      const master = dbStore.orders.find((m: any) => m.orderNumber === o.orderNumber) as any;
      const shipment = fulfilmentLifecycleService.getOrderShipments(o.orderNumber, o.id)[0] || null;
      const invoice = gstInvoiceService.getExistingVendorInvoice(o.id) || null;
      return {
        ...o,
        paymentMethod: master?.paymentMethod || o.paymentMethod || 'COD',
        paymentStatus: master?.paymentStatus || o.paymentStatus || 'PENDING',
        deliverySpeed: master?.deliverySpeed || 'ASAP_60',
        deliveryAddress: master?.deliveryAddress || o.deliveryAddress,
        customerPhone: master?.customerPhone || o.customerPhone,
        buyerGstin: master?.gstin,
        companyName: master?.companyName,
        shipment,
        invoice,
      };
    });
    return {
      success: true,
      total: enriched.length,
      data: enriched
    };
  }

  @Get('orders/:id')
  async getOrderById(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string
  ) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const anyOrder = vendorOrders.find((o) => o.id === id || o.orderNumber === id) as any;
    if (anyOrder && anyOrder.vendorId !== vendor.id) {
      const mineForNum = vendorOrders.find((o) => o.orderNumber === id && o.vendorId === vendor.id);
      if (!mineForNum) {
        throw new ForbiddenException('Access denied: this order belongs to another vendor.');
      }
    }
    const order = vendorOrders.find(
      (o) => (o.id === id || o.orderNumber === id) && o.vendorId === vendor.id
    ) as any;
    if (!order) throw new NotFoundException('Order not found for your vendor account');

    const master = dbStore.orders.find((m: any) => m.orderNumber === order.orderNumber) as any;
    const shipment = fulfilmentLifecycleService.getOrderShipments(order.orderNumber, order.id)[0] || null;
    const invoice = gstInvoiceService.getExistingVendorInvoice(order.id) || null;

    return {
      success: true,
      data: {
        ...order,
        paymentMethod: master?.paymentMethod || order.paymentMethod || 'COD',
        paymentStatus: master?.paymentStatus || order.paymentStatus || 'PENDING',
        deliverySpeed: master?.deliverySpeed || 'ASAP_60',
        deliveryAddress: master?.deliveryAddress || order.deliveryAddress,
        customerPhone: master?.customerPhone || order.customerPhone,
        buyerGstin: master?.gstin,
        companyName: master?.companyName,
        shipment,
        invoice,
      }
    };
  }

  @Put('orders/:id/status')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() body: { status: VendorOrder['status']; note?: string },
    @Headers('authorization') authHeader?: string
  ) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const anyOrder = vendorOrders.find((o) => o.id === id || o.orderNumber === id) as any;
    if (anyOrder && anyOrder.vendorId !== vendor.id && !vendorOrders.some((o) => o.orderNumber === id && o.vendorId === vendor.id)) {
      throw new ForbiddenException('Access denied: you cannot update another vendor order.');
    }
    const order = vendorOrders.find(
      (o) => (o.id === id || o.orderNumber === id) && o.vendorId === vendor.id
    ) as any;
    if (!order) throw new NotFoundException('Order not found for your vendor account');

    const requestedStatus = String(body.status || '').toUpperCase();
    if (requestedStatus === 'DELIVERED' || requestedStatus === 'COMPLETED') {
      throw new ForbiddenException(
        'Vendors cannot mark site delivery COMPLETED/DELIVERED without customer Delivery OTP confirmation.'
      );
    }

    await orderSyncService.syncVendorOrderStatusToCustomer(order, body.status, body.note);

    return {
      success: true,
      message: `Order status updated to ${body.status} and synchronized with customer`,
      data: order
    };
  }

  @Post('orders/:id/accept')
  async acceptOrder(
    @Param('id') id: string,
    @Body() body?: { note?: string },
    @Headers('authorization') authHeader?: string
  ) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const order = await fulfilmentLifecycleService.vendorAcceptOrder(
      vendor.id,
      id,
      vendor.name || vendor.storeName,
      body?.note
    );

    return {
      success: true,
      message: 'Order accepted for site fulfillment.',
      data: order
    };
  }

  @Post('orders/:id/reject')
  async rejectOrder(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Headers('authorization') authHeader?: string
  ) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const order = await fulfilmentLifecycleService.vendorRejectOrder(
      vendor.id,
      id,
      body?.reason,
      vendor.name || vendor.storeName
    );

    return {
      success: true,
      message: 'Order rejected and reserved stock released.',
      data: order
    };
  }

  @Get('orders/:id/packing-slip')
  async getOrderPackingSlip(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string
  ) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const order = vendorOrders.find(
      (o) => (o.id === id || o.orderNumber === id) && o.vendorId === vendor.id
    );
    if (!order) throw new NotFoundException('Order not found for your vendor account');

    const tenantStores = companyAdminDataService.getTenantWarehouses(vendor.tenantId || DEFAULT_TENANT_ID);
    const darkStoreId = vendor.businessInfo?.assignedDarkStoreId || 'WH-BLR-04';
    return {
      success: true,
      slipNumber: `PS-${order.orderNumber}`,
      generatedAt: new Date().toISOString(),
      order,
      vendor: vendor.businessInfo,
      assignedDarkStore:
        tenantStores.find((w: any) => w.id === darkStoreId) ||
        tenantStores[0] ||
        BENGALURU_WAREHOUSES[darkStoreId]
    };
  }

  // ==========================================
  // 9. RETURNS & REFUNDS WORKFLOW
  // ==========================================
  @Get('returns')
  async getReturns(
    @Headers('authorization') authHeader?: string,
    @Query('status') status?: string
  ) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    let list = vendorReturns.filter((r) => r.vendorId === vendor.id);
    if (status) {
      list = list.filter((r) => r.status === status);
    }
    return {
      success: true,
      count: list.length,
      data: list
    };
  }

  @Get('returns/:id')
  async getReturnById(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string
  ) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const ret = vendorReturns.find(
      (r) => (r.id === id || r.orderNumber === id) && r.vendorId === vendor.id
    );
    if (!ret) throw new NotFoundException('Return request not found');
    return { success: true, data: ret };
  }

  @Put('returns/:id/status')
  async updateReturnStatus(
    @Param('id') id: string,
    @Body() body: { status: VendorReturnRequest['status']; restockDecision?: boolean; rejectionReason?: string },
    @Headers('authorization') authHeader?: string
  ) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const ret = vendorReturns.find((r) => r.id === id && r.vendorId === vendor.id) as any;
    if (!ret) throw new NotFoundException('Return request not found');

    ret.status = body.status;
    if (body.rejectionReason) ret.rejectionReason = body.rejectionReason;
    if (body.restockDecision !== undefined) ret.restockDecision = body.restockDecision;
    if (body.status === 'REFUNDED') ret.resolvedAt = new Date().toISOString();

    if (ret.status === 'REFUNDED') {
      if (ret.restockDecision) {
        for (const item of ret.items || []) {
          const prod = vendorProducts.find(
            (p) => (p.sku === item.sku || p.id === item.productId || p.id.replace(/^vp-/, '') === item.productId) && p.vendorId === vendor.id
          ) as any;
          if (prod) {
            const before = Number(prod.stockCount || 0);
            prod.stockCount = before + Number(item.quantity || 1);
            prod.stock = prod.stockCount;
            prod.inStock = true;
            syncVendorProductToCustomerCatalog(prod);
            await platformPersistenceService.upsert(PlatformProductModel, prod);

            const movement: any = {
              id: `sm-${Date.now()}`,
              vendorId: vendor.id,
              productId: prod.id,
              productName: prod.name,
              sku: prod.sku,
              warehouseId: 'wh-1',
              warehouseName: 'Primary Dispatch Depot',
              type: 'RETURN',
              quantityDelta: Number(item.quantity || 1),
              quantityBefore: before,
              quantityAfter: prod.stockCount,
              reason: `Return restocked from Request #${ret.id}`,
              referenceNumber: ret.orderNumber,
              performedBy: vendor.name || vendor.email,
              createdAt: new Date().toISOString()
            };
            vendorStockMovements.unshift(movement);
            await platformPersistenceService.upsert(PlatformStockMovementModel, movement);
            realtimeBus.emitPublic('inventory.updated', {
              productId: prod.id,
              sku: prod.sku,
              stockCount: prod.stockCount,
              inStock: true,
            });
          }
        }
      }

      // Credit refund to customer wallet & sync order status
      const custOrder = dbStore.orders.find(
        (o) => o.orderNumber === ret.orderNumber || o.id === ret.orderId
      ) as any;
      if (custOrder && !ret.refundCredited) {
        ret.refundCredited = true;
        custOrder.status = 'RETURNED';
        custOrder.paymentStatus = 'REFUNDED';
        custOrder.timeline.push({
          status: 'RETURNED',
          title: 'Return Completed & Refund Credited',
          description: `₹${ret.totalRefundAmount || 0} credited to customer wallet.`,
          timestamp: new Date().toISOString(),
          completed: true,
        });
        dbStore.walletBalance += Number(ret.totalRefundAmount || 0);
        const refundTx: any = {
          id: `tx-ret-${Date.now()}`,
          customerId: custOrder.customerId,
          referenceNumber: `WRF-${Date.now().toString().slice(-6)}`,
          type: 'CREDIT',
          amount: Number(ret.totalRefundAmount || 0),
          category: 'REFUND',
          status: 'COMPLETED',
          orderId: custOrder.orderNumber,
          description: `Return refund for Order #${custOrder.orderNumber}`,
          createdAt: new Date().toISOString(),
          balanceAfter: dbStore.walletBalance,
        };
        dbStore.walletTransactions.unshift(refundTx);
        await platformPersistenceService.upsert(PlatformWalletTxnModel, refundTx);
        await platformPersistenceService.upsert(PlatformOrderModel, custOrder);
        if (custOrder.customerId) {
          await platformNotificationService.dispatch({
            tenantId: vendor.tenantId || DEFAULT_TENANT_ID,
            recipientRole: 'CUSTOMER',
            recipientId: custOrder.customerId,
            type: 'PAYMENT',
            title: `Return Refunded for #${custOrder.orderNumber}`,
            message: `₹${ret.totalRefundAmount || 0} credited to your Buildora Wallet.`,
            severity: 'SUCCESS',
            actionUrl: `/orders/${custOrder.orderNumber}`,
          });
          realtimeBus.emitToCustomer(custOrder.customerId, 'order.status.updated', {
            orderNumber: custOrder.orderNumber,
            status: 'RETURNED',
            refundAmount: ret.totalRefundAmount,
          });
        }
      }
    }

    await platformPersistenceService.upsert(PlatformReturnModel, ret);
    realtimeBus.emitToAdmin('order.status.updated', { returnId: ret.id, status: ret.status });

    return {
      success: true,
      message: `Return request status updated to ${body.status}`,
      data: ret
    };
  }

  // ==========================================
  // 10. OFFERS, DEALS & PROMOTIONS
  // ==========================================
  @Get('promotions')
  async getPromotions(@Headers('authorization') authHeader?: string) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const mine = vendorPromotions.filter((p) => p.vendorId === vendor.id);
    return {
      success: true,
      count: mine.length,
      data: mine
    };
  }

  @Post('promotions')
  async createPromotion(
    @Body() body: Partial<VendorPromotion>,
    @Headers('authorization') authHeader?: string
  ) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    if (!body.title || !body.discountValue || !body.startDate || !body.endDate) {
      throw new BadRequestException('Promotion title, discount value, start date, and end date are required.');
    }

    const promo: VendorPromotion & Record<string, any> = {
      id: `promo-${Date.now()}`,
      vendorId: vendor.id,
      tenantId: vendor.tenantId || DEFAULT_TENANT_ID,
      title: body.title,
      description: body.description || '',
      discountType: body.discountType || 'PERCENTAGE',
      discountValue: Number(body.discountValue),
      startDate: body.startDate,
      endDate: body.endDate,
      applicableProductIds: body.applicableProductIds || [],
      status: 'ACTIVE',
      bannerText: body.bannerText || `SAVE ${body.discountValue}% NOW`,
      usageCount: 0,
      salesGenerated: 0
    };

    vendorPromotions.unshift(promo);
    await platformPersistenceService.upsert(PlatformPromotionModel, promo);
    realtimeBus.emitPublic('pricing.updated', { source: 'vendor_promotion', promotion: promo }, vendor.tenantId || DEFAULT_TENANT_ID);

    return {
      success: true,
      message: 'Promotion created and published to customer deals section.',
      data: promo
    };
  }

  @Put('promotions/:id/status')
  async updatePromotionStatus(
    @Param('id') id: string,
    @Body() body: { status: VendorPromotion['status'] },
    @Headers('authorization') authHeader?: string
  ) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const promo = vendorPromotions.find((p) => p.id === id && p.vendorId === vendor.id);
    if (!promo) throw new NotFoundException('Promotion not found');
    promo.status = body.status;
    await platformPersistenceService.upsert(PlatformPromotionModel, promo);
    realtimeBus.emitPublic('pricing.updated', { source: 'vendor_promotion', promotion: promo }, vendor.tenantId || DEFAULT_TENANT_ID);
    return { success: true, message: `Promotion marked as ${body.status}`, data: promo };
  }

  // ==========================================
  // 11. NEW LAUNCHES SPOTLIGHT & SYNC
  // ==========================================
  @Get('new-launches')
  getNewLaunches() {
    const list = vendorProducts.filter((p) => p.isNewLaunch);
    return {
      success: true,
      count: list.length,
      data: list
    };
  }

  @Post('new-launches/:id')
  addNewLaunch(@Param('id') id: string) {
    const prod = vendorProducts.find((p) => p.id === id);
    if (!prod) throw new NotFoundException('Product not found');
    prod.isNewLaunch = true;
    prod.updatedAt = new Date().toISOString();
    syncVendorProductToCustomerCatalog(prod);

    return {
      success: true,
      message: `${prod.name} spotlighted in customer New Launches collection.`,
      data: prod
    };
  }

  @Delete('new-launches/:id')
  removeNewLaunch(@Param('id') id: string) {
    const prod = vendorProducts.find((p) => p.id === id);
    if (!prod) throw new NotFoundException('Product not found');
    prod.isNewLaunch = false;
    prod.updatedAt = new Date().toISOString();
    syncVendorProductToCustomerCatalog(prod);

    return {
      success: true,
      message: `${prod.name} removed from New Launches spotlight.`
    };
  }

  // ==========================================
  // 12. CUSTOMER RATINGS & REVIEWS
  // ==========================================
  @Get('reviews')
  async getReviews(@Headers('authorization') authHeader?: string) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const myProductIds = new Set(
      vendorProducts.filter((p) => p.vendorId === vendor.id).map((p) => p.id)
    );
    const mine = vendorReviews.filter(
      (r: any) => !r.vendorId ? myProductIds.has(r.productId) || vendor.id === DEFAULT_VENDOR_ID : r.vendorId === vendor.id
    );
    const totalReviews = mine.length;
    const avgRating = totalReviews > 0 ? Number((mine.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)) : 5.0;

    return {
      success: true,
      averageRating: avgRating,
      totalCount: totalReviews,
      data: mine
    };
  }

  @Post('reviews/:id/reply')
  async replyToReview(
    @Param('id') id: string,
    @Body() body: { message: string },
    @Headers('authorization') authHeader?: string
  ) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const myProductIds = new Set(
      vendorProducts.filter((p) => p.vendorId === vendor.id).map((p) => p.id)
    );
    const rev = vendorReviews.find(
      (r: any) => r.id === id && (!r.vendorId ? myProductIds.has(r.productId) || vendor.id === DEFAULT_VENDOR_ID : r.vendorId === vendor.id)
    );
    if (!rev) throw new NotFoundException('Review not found');
    if (!body.message) throw new BadRequestException('Reply message cannot be empty');

    rev.vendorReply = {
      message: body.message,
      repliedAt: new Date().toISOString(),
      repliedBy: vendor.name || vendor.storeName || vendor.businessInfo?.businessName || 'Vendor Admin'
    };
    await platformPersistenceService.upsert(PlatformReviewModel, rev);

    return {
      success: true,
      message: 'Vendor reply posted successfully.',
      data: rev
    };
  }

  // ==========================================
  // 13. SETTLEMENTS & FINANCIAL LEDGER
  // ==========================================
  @Get('settlements')
  async getSettlements(@Headers('authorization') authHeader?: string) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const mine = vendorSettlements.filter((s) => s.vendorId === vendor.id);
    return {
      success: true,
      data: mine
    };
  }

  @Get('settlements/summary')
  async getSettlementsSummary(@Headers('authorization') authHeader?: string) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const myOrders = vendorOrders.filter(
      (o) => o.vendorId === vendor.id && o.status !== 'CANCELLED' && o.status !== 'REJECTED'
    );
    const mine = vendorSettlements.filter((s) => s.vendorId === vendor.id);
    const grossSales = Math.round(myOrders.reduce((s, o) => s + Number(o.subtotal || 0), 0));
    const platformCommission = Math.round(myOrders.reduce((s, o: any) => s + Number(o.platformFee ?? o.commissionTotal ?? 0), 0));
    const taxDeducted = Math.round(grossSales * 0.01);
    const netEarnings = Math.max(0, grossSales - platformCommission - taxDeducted);
    const pendingPayout = mine
      .filter((s) => s.status !== 'PAID')
      .reduce((s, x: any) => s + Number(x.netPayable ?? x.netAmount ?? 0), 0);
    const completedPayout = mine
      .filter((s) => s.status === 'PAID')
      .reduce((s, x: any) => s + Number(x.netPayable ?? x.netAmount ?? 0), 0);

    return {
      success: true,
      grossSales,
      platformCommission,
      taxDeducted,
      netEarnings,
      pendingPayout,
      completedPayout,
      bankAccount: vendor.businessInfo?.bankDetails || {}
    };
  }

  @Post('settlements/request-payout')
  async requestSettlementPayout(
    @Body() body: { amount?: number },
    @Headers('authorization') authHeader?: string
  ) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const myOrders = vendorOrders.filter((o) => o.vendorId === vendor.id && o.status === 'DELIVERED');
    const deliveredSum = myOrders.reduce((s, o) => s + Number(o.subtotal || 0), 0);
    const gross = Number(body.amount || deliveredSum || 0);
    if (gross <= 0) {
      throw new BadRequestException('No eligible delivered balance available for payout request.');
    }

    const commission = Math.round(gross * 0.06);
    const tds = Math.round(gross * 0.01);
    const net = Math.max(0, gross - commission - tds);
    const newSettlement: VendorSettlement & Record<string, any> = {
      id: `stl-${Date.now()}`,
      settlementNumber: `SETTL-BLD-${Math.floor(10000 + Math.random() * 90000)}`,
      vendorId: vendor.id,
      period: 'Current On-Demand Payout',
      orderCount: myOrders.length || 1,
      ordersCount: myOrders.length || 1,
      grossRevenue: gross,
      grossAmount: gross,
      platformCommission: commission,
      commissionAmount: commission,
      taxDeductions: tds,
      tdsAmount: tds,
      netPayable: net,
      netAmount: net,
      status: 'PROCESSING',
      createdAt: new Date().toISOString()
    };

    vendorSettlements.unshift(newSettlement);
    await platformPersistenceService.upsert(PlatformSettlementModel, newSettlement);

    const tenantId = vendor.tenantId || DEFAULT_TENANT_ID;
    await platformNotificationService.dispatch({
      tenantId,
      recipientRole: 'ADMIN',
      recipientId: 'TENANT_ADMIN',
      type: 'SETTLEMENT',
      title: `Payout Requested: ${newSettlement.settlementNumber}`,
      message: `${vendor.storeName} requested payout of ₹${net.toLocaleString()}.`,
      severity: 'INFO',
      actionUrl: '/finance',
      metadata: { settlementId: newSettlement.id, vendorId: vendor.id },
    });
    realtimeBus.emitVendorAndAdmin(vendor.id, 'settlement.status.updated', { settlement: newSettlement }, tenantId);

    return {
      success: true,
      message: 'On-demand bank payout request submitted for NEFT/RTGS transfer.',
      data: newSettlement
    };
  }

  // ==========================================
  // 14. INVOICES & GST DOCUMENTS
  // ==========================================
  @Get('invoices')
  async getInvoices(@Headers('authorization') authHeader?: string) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const mine = vendorInvoices.filter((i) => i.vendorId === vendor.id);
    return {
      success: true,
      count: mine.length,
      data: mine
    };
  }

  @Get('invoices/:id')
  async getInvoiceById(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string
  ) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const anyInv = vendorInvoices.find((i) => i.id === id || i.invoiceNumber === id);
    if (anyInv && anyInv.vendorId !== vendor.id) {
      throw new ForbiddenException('Access denied: cannot view another vendor tax invoice.');
    }
    if (!anyInv) throw new NotFoundException('Invoice not found');
    return { success: true, data: anyInv };
  }

  @Get('invoices/:id/pdf')
  async downloadVendorInvoicePdf(
    @Param('id') id: string,
    @Res() res: Response,
    @Headers('authorization') authHeader?: string
  ) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const anyInv = vendorInvoices.find((i) => i.id === id || i.invoiceNumber === id);
    if (anyInv && anyInv.vendorId !== vendor.id) {
      throw new ForbiddenException('Access denied: cannot download another vendor tax invoice.');
    }
    if (!anyInv) throw new NotFoundException('Invoice not found');
    const pdfBuf = await gstInvoiceService.renderGstInvoicePdfBuffer(anyInv);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${anyInv.invoiceNumber}.pdf"`,
      'Content-Length': pdfBuf.length,
    });
    res.end(pdfBuf);
  }

  @Post('orders/:id/picking')
  async confirmOrderPicking(
    @Param('id') id: string,
    @Body() body: { pickedItems?: Array<{ productId: string; sku?: string; pickedQuantity: number; shortageReason?: string }>; notes?: string },
    @Headers('authorization') authHeader?: string
  ) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const order = await fulfilmentLifecycleService.vendorConfirmPicking(
      vendor.id,
      id,
      body || {},
      vendor.name || vendor.storeName
    );
    return {
      success: true,
      message: 'Material picking recorded.',
      data: order,
    };
  }

  @Post('orders/:id/packing')
  async confirmOrderPacking(
    @Param('id') id: string,
    @Body() body: any,
    @Headers('authorization') authHeader?: string
  ) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const order = await fulfilmentLifecycleService.vendorConfirmPacking(
      vendor.id,
      id,
      body || {},
      vendor.name || vendor.storeName
    );
    return {
      success: true,
      message: 'Construction packing specifications recorded.',
      data: order,
    };
  }

  @Post('orders/:id/ready-for-dispatch')
  async markOrderReadyForDispatch(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string
  ) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const resData = await fulfilmentLifecycleService.vendorMarkReadyForDispatch(
      vendor.id,
      id,
      vendor.name || vendor.storeName
    );
    return {
      success: true,
      message: `Staged for dispatch (${resData.shipment.id}).`,
      data: resData,
    };
  }

  @Post('orders/:id/handover')
  async handoverToDriver(
    @Param('id') id: string,
    @Body() body: { vehicleNumber?: string; driverName?: string; driverPhone?: string; handoverRef?: string; notes?: string },
    @Headers('authorization') authHeader?: string
  ) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const resData = await fulfilmentLifecycleService.vendorHandoverToDriver(
      vendor.id,
      id,
      body || {},
      vendor.name || vendor.storeName
    );
    return {
      success: true,
      message: `Dispatched and GST Tax Invoice ${resData.invoice.invoiceNumber} generated.`,
      data: resData,
    };
  }

  // ==========================================
  // 15. BUSINESS REPORTS & ANALYTICS
  // ==========================================
  @Get('reports/sales')
  async getSalesReport(
    @Headers('authorization') authHeader?: string,
    @Query('period') period?: string
  ) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const myOrders = vendorOrders.filter(
      (o) => o.vendorId === vendor.id && o.status !== 'CANCELLED' && o.status !== 'REJECTED'
    );
    const totalRevenue = Math.round(myOrders.reduce((s, o) => s + Number(o.subtotal || 0), 0));
    const totalOrders = myOrders.length;
    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    return {
      success: true,
      period: period || 'Last 30 Days',
      totalRevenue,
      totalOrders,
      averageOrderValue,
      topCategories: [],
      dailySummary: myOrders.slice(0, 10).map((o) => ({
        date: String(o.createdAt || '').split('T')[0],
        sales: Number(o.subtotal || 0),
        orders: 1,
      }))
    };
  }

  // ==========================================
  // 16. EMPLOYEE & TEAM MANAGEMENT (7 ROLES)
  // ==========================================
  @Get('team')
  getTeam() {
    return {
      success: true,
      count: vendorEmployees.length,
      data: vendorEmployees
    };
  }

  @Post('team/invite')
  inviteTeamMember(@Body() body: { name: string; email: string; phone: string; role: VendorRole; permissions: string[] }) {
    if (!body.name || !body.email || !body.role) {
      throw new BadRequestException('Employee name, email, and role are required.');
    }

    const newEmp: VendorEmployee = {
      id: `emp-${Date.now()}`,
      vendorId: DEFAULT_VENDOR_ID,
      name: body.name,
      email: body.email,
      phone: body.phone || '',
      role: body.role,
      status: 'INVITED',
      permissions: body.permissions || ['CATALOG_VIEW', 'ORDERS_VIEW'],
      invitedAt: new Date().toISOString()
    };

    vendorEmployees.push(newEmp);

    return {
      success: true,
      message: `Invitation email dispatched to ${body.email} with ${body.role} credentials.`,
      data: newEmp
    };
  }

  @Put('team/:id/role')
  updateTeamRole(@Param('id') id: string, @Body() body: { role: VendorRole; permissions?: string[] }) {
    const emp = vendorEmployees.find((e) => e.id === id);
    if (!emp) throw new NotFoundException('Team member not found');
    emp.role = body.role;
    if (body.permissions) emp.permissions = body.permissions;
    return { success: true, message: 'Member role updated successfully.', data: emp };
  }

  @Delete('team/:id')
  removeTeamMember(@Param('id') id: string) {
    vendorEmployees = vendorEmployees.filter((e) => e.id !== id);
    return { success: true, message: 'Team member removed from vendor organization.' };
  }

  @Get('team/audit-logs')
  getTeamAuditLogs() {
    return {
      success: true,
      data: currentVendor.auditLogs || []
    };
  }

  // ==========================================
  // 17. SUPPORT TICKETS & HELPDESK
  // ==========================================
  @Get('support/tickets')
  async getSupportTickets(@Headers('authorization') authHeader?: string) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const mine = vendorSupportTickets.filter((t) => t.vendorId === vendor.id);
    return {
      success: true,
      count: mine.length,
      data: mine
    };
  }

  @Post('support/tickets')
  async createSupportTicket(
    @Body() body: { subject: string; category: any; priority: any; description: string },
    @Headers('authorization') authHeader?: string
  ) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    if (!body.subject || !body.description) {
      throw new BadRequestException('Ticket subject and description are required.');
    }

    const tkt: VendorSupportTicket = {
      id: `tkt-${Date.now()}`,
      ticketNumber: `TKT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      vendorId: vendor.id,
      subject: body.subject,
      category: body.category || 'TECHNICAL',
      priority: body.priority || 'MEDIUM',
      description: body.description,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: vendor.name || vendor.storeName,
          senderRole: 'VENDOR',
          text: body.description,
          timestamp: new Date().toISOString()
        }
      ]
    };

    vendorSupportTickets.unshift(tkt);
    await platformPersistenceService.upsert(PlatformSupportTicketModel, tkt);

    await platformNotificationService.dispatch({
      tenantId: vendor.tenantId || DEFAULT_TENANT_ID,
      recipientRole: 'ADMIN',
      recipientId: 'TENANT_ADMIN',
      type: 'SUPPORT',
      title: `Vendor Ticket ${tkt.ticketNumber}: ${vendor.storeName}`,
      message: tkt.subject,
      severity: tkt.priority === 'HIGH' ? 'WARNING' : 'INFO',
      actionUrl: '/notifications',
      metadata: { ticketId: tkt.id, vendorId: vendor.id },
    });

    return {
      success: true,
      message: 'Support ticket submitted. Partner response SLA: 4 business hours.',
      data: tkt
    };
  }

  @Post('support/tickets/:id/messages')
  async addSupportTicketMessage(
    @Param('id') id: string,
    @Body() body: { text: string },
    @Headers('authorization') authHeader?: string
  ) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const tkt = vendorSupportTickets.find((t) => t.id === id && t.vendorId === vendor.id);
    if (!tkt) throw new NotFoundException('Support ticket not found');
    if (!body.text) throw new BadRequestException('Message cannot be empty');

    const msg = {
      id: `msg-${Date.now()}`,
      sender: vendor.name || vendor.storeName,
      senderRole: 'VENDOR' as const,
      text: body.text,
      timestamp: new Date().toISOString()
    };
    tkt.messages.push(msg);
    tkt.updatedAt = new Date().toISOString();
    await platformPersistenceService.upsert(PlatformSupportTicketModel, tkt);
    realtimeBus.emitToAdmin('notification.created', { ticketId: tkt.id, vendorId: vendor.id }, vendor.tenantId || DEFAULT_TENANT_ID);

    return {
      success: true,
      message: 'Message sent.',
      data: msg
    };
  }

  // ==========================================
  // 18. VENDOR PROFILE, BANK & SETTINGS
  // ==========================================
  @Get('profile')
  async getVendorProfile(@Headers('authorization') authHeader?: string) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const serialized = serializeVendorProfile(vendor);
    return {
      success: true,
      data: serialized,
      vendor: serialized
    };
  }

  @Put('profile')
  async updateVendorProfile(@Body() body: any, @Headers('authorization') authHeader?: string) {
    const target = await resolveStrictAuthenticatedVendor(authHeader);
    const incomingInfo = body?.businessInfo || {};

    if (typeof body?.storeName === 'string' && body.storeName.trim()) {
      target.storeName = body.storeName.trim();
    } else if (typeof incomingInfo.storeName === 'string' && incomingInfo.storeName.trim()) {
      target.storeName = incomingInfo.storeName.trim();
    }

    const updatedOwner =
      (typeof body?.name === 'string' && body.name.trim()) ||
      (typeof incomingInfo.contactPerson === 'string' && incomingInfo.contactPerson.trim()) ||
      undefined;
    if (updatedOwner) {
      target.name = updatedOwner;
    }

    const updatedEmail =
      (typeof body?.email === 'string' && body.email.trim().toLowerCase()) ||
      (typeof incomingInfo.email === 'string' && incomingInfo.email.trim().toLowerCase()) ||
      undefined;
    if (updatedEmail) {
      const emailCheck = validateEmail(updatedEmail);
      if (!emailCheck.isValid) {
        throw new BadRequestException(emailCheck.error || 'Invalid business email address.');
      }
      target.email = updatedEmail;
    }

    const updatedPhone =
      (typeof body?.phone === 'string' && body.phone.trim()) ||
      (typeof incomingInfo.phone === 'string' && incomingInfo.phone.trim()) ||
      undefined;
    if (updatedPhone) {
      const phoneCheck = validateIndianMobile(updatedPhone);
      if (!phoneCheck.isValid) {
        throw new BadRequestException(phoneCheck.error || 'Enter a valid 10-digit Indian mobile number.');
      }
      target.phone = phoneCheck.normalized || updatedPhone;
    }

    if (body?.logoUrl !== undefined) {
      target.logoUrl = body.logoUrl || undefined;
      target.businessInfo.logo = body.logoUrl || undefined;
    }
    if (body?.logoMetadata !== undefined) {
      target.logoMetadata = body.logoMetadata || undefined;
      target.businessInfo.logoMetadata = body.logoMetadata || undefined;
    }

    const existingAddr = target.businessInfo?.address || ({} as any);
    const incomingAddr = incomingInfo.address || {};
    const mergedAddress = {
      ...existingAddr,
      ...(incomingAddr.building !== undefined && incomingAddr.building !== '' ? { building: String(incomingAddr.building).trim() } : {}),
      ...(incomingAddr.street !== undefined && incomingAddr.street !== '' ? { street: String(incomingAddr.street).trim() } : {}),
      ...(incomingAddr.area !== undefined && incomingAddr.area !== '' ? { area: String(incomingAddr.area).trim() } : {}),
      ...(incomingAddr.city !== undefined && incomingAddr.city !== '' ? { city: String(incomingAddr.city).trim() } : {}),
      ...(incomingAddr.state !== undefined && incomingAddr.state !== '' ? { state: String(incomingAddr.state).trim() } : {}),
      ...(incomingAddr.pincode !== undefined && incomingAddr.pincode !== '' ? { pincode: String(incomingAddr.pincode).trim() } : {}),
      ...(incomingAddr.country !== undefined && incomingAddr.country !== '' ? { country: String(incomingAddr.country).trim() } : {})
    };

    if (mergedAddress.pincode) {
      const pinCheck = validatePincode(mergedAddress.pincode);
      if (!pinCheck.isValid) {
        throw new BadRequestException(pinCheck.error || 'Enter a valid 6-digit Indian pincode.');
      }
    }

    target.businessInfo = {
      ...target.businessInfo,
      ...(incomingInfo.businessName?.trim() ? { businessName: incomingInfo.businessName.trim() } : {}),
      storeName: target.storeName,
      contactPerson: target.name,
      email: target.email,
      phone: target.phone,
      ...(incomingInfo.businessType ? { businessType: incomingInfo.businessType } : {}),
      ...(incomingInfo.businessRegistrationType !== undefined ? { businessRegistrationType: incomingInfo.businessRegistrationType } : {}),
      ...(incomingInfo.yearOfEstablishment !== undefined ? { yearOfEstablishment: incomingInfo.yearOfEstablishment } : {}),
      ...(incomingInfo.website !== undefined ? { website: incomingInfo.website } : {}),
      ...(incomingInfo.description !== undefined ? { description: incomingInfo.description } : {}),
      address: mergedAddress
    };

    target.registrationData = {
      ...(target.registrationData || {}),
      ownerName: target.name,
      email: target.email,
      phone: target.phone,
      storeName: target.storeName,
      legalBusinessName: target.businessInfo.businessName,
      businessType: (target.businessInfo.businessType as any) || target.registrationData?.businessType,
      businessRegistrationType:
        target.businessInfo.businessRegistrationType || target.registrationData?.businessRegistrationType,
      yearOfEstablishment:
        target.businessInfo.yearOfEstablishment ?? target.registrationData?.yearOfEstablishment,
      website: target.businessInfo.website ?? target.registrationData?.website,
      description: target.businessInfo.description ?? target.registrationData?.description,
      logoUrl: target.logoUrl,
      logoMetadata: target.logoMetadata,
      country: mergedAddress.country || 'India',
      state: mergedAddress.state || target.registrationData?.state || '',
      city: mergedAddress.city || target.registrationData?.city || '',
      pincode: mergedAddress.pincode || target.registrationData?.pincode || '',
      completeAddress:
        mergedAddress.building || mergedAddress.street || target.registrationData?.completeAddress || ''
    };

    target.updatedAt = new Date().toISOString();
    await vendorPersistenceService.saveVendorRecord(target);

    const serialized = serializeVendorProfile(target);
    return {
      success: true,
      message: 'Vendor business profile updated.',
      data: serialized,
      vendor: serialized
    };
  }

  @Put('profile/bank')
  async updateVendorBankDetails(@Body() body: any, @Headers('authorization') authHeader?: string) {
    const target = await resolveStrictAuthenticatedVendor(authHeader);

    const holder = String(body?.accountHolderName || '').trim();
    const bankName = String(body?.bankName || '').trim();
    const rawAccInput = String(body?.accountNumber || '').trim();
    const isMaskedInput = /X|•|\*/i.test(rawAccInput);
    const existingPlainAcc = vendorSecurityService.decryptSensitive(
      target.businessInfo?.bankDetails?.accountNumber || ''
    );
    const accNo = isMaskedInput ? existingPlainAcc : rawAccInput.replace(/\D/g, '');
    const ifsc = String(body?.ifsc || '').trim().toUpperCase();
    const accType: 'CURRENT' | 'SAVINGS' = body?.accountType === 'SAVINGS' ? 'SAVINGS' : 'CURRENT';

    if (holder) {
      const nameCheck = validateName(holder, 'Account Beneficiary Name');
      if (!nameCheck.isValid) throw new BadRequestException(nameCheck.error);
    }
    if (bankName) {
      const bankCheck = validateBankName(bankName);
      if (!bankCheck.isValid) throw new BadRequestException(bankCheck.error);
    }
    if (accNo && !isMaskedInput) {
      const accCheck = validateBankAccount(accNo);
      if (!accCheck.isValid) throw new BadRequestException(accCheck.error);
    }
    if (ifsc) {
      const ifscCheck = validateIFSC(ifsc);
      if (!ifscCheck.isValid) throw new BadRequestException(ifscCheck.error);
    }

    const accountChanged =
      (Boolean(accNo) && !isMaskedInput && accNo !== existingPlainAcc) ||
      (Boolean(ifsc) && ifsc !== String(target.businessInfo?.bankDetails?.ifsc || '').toUpperCase());

    const encAcc = accNo ? vendorSecurityService.encryptSensitive(accNo) : target.businessInfo?.bankDetails?.accountNumber || '';
    const maskedAcc = accNo ? maskBankAccount(accNo) : target.businessInfo?.bankDetails?.accountNumberMasked || '';

    const updatedBank = {
      ...target.businessInfo?.bankDetails,
      ...(holder ? { accountHolderName: holder } : {}),
      ...(bankName ? { bankName } : {}),
      ...(encAcc ? { accountNumber: encAcc, accountNumberMasked: maskedAcc } : {}),
      ...(ifsc ? { ifsc } : {}),
      accountType: accType,
      branch: bankName ? `${bankName} Branch` : target.businessInfo?.bankDetails?.branch || 'Main Branch',
      isVerified: accountChanged ? false : Boolean(target.businessInfo?.bankDetails?.isVerified),
      verificationStatus: accountChanged
        ? ('PENDING' as const)
        : target.businessInfo?.bankDetails?.verificationStatus ||
          (target.businessInfo?.bankDetails?.isVerified ? ('VERIFIED' as const) : ('PENDING' as const)),
      ...(accountChanged ? { rejectionReason: undefined } : {}),
    };

    target.businessInfo = {
      ...target.businessInfo,
      bankDetails: updatedBank
    };

    if (target.registrationData) {
      target.registrationData = {
        ...target.registrationData,
        bankDetails: {
          ...(target.registrationData.bankDetails || ({} as any)),
          accountHolderName: updatedBank.accountHolderName,
          bankName: updatedBank.bankName,
          accountNumber: updatedBank.accountNumber,
          ifsc: updatedBank.ifsc,
          accountType: accType as any,
          isVerified: updatedBank.isVerified,
          verificationStatus: updatedBank.verificationStatus,
        }
      };
    }

    target.updatedAt = new Date().toISOString();
    await vendorPersistenceService.saveVendorRecord(target);

    const serialized = serializeVendorProfile(target);
    return {
      success: true,
      message: 'Bank account details updated.',
      data: serialized.businessInfo.bankDetails,
      vendor: serialized
    };
  }

  @Get('settings')
  async getVendorSettings(@Headers('authorization') authHeader?: string) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const anyBiz = vendor.businessInfo as any;
    const notifPrefs = anyBiz?.notificationPreferences || {
      newOrdersSms: true,
      newOrdersWhatsapp: true,
      lowStockEmail: true,
      payoutSummaryEmail: true,
    };
    return {
      success: true,
      data: {
        twoFactorEnabled: Boolean(anyBiz?.twoFactorEnabled),
        notificationPreferences: notifPrefs,
        deliverySettings: {
          warehouseAddress: vendor.businessInfo?.warehouseAddress || '',
          pickupPincode: vendor.businessInfo?.pickupPincode || '',
          assignedDarkStoreId: vendor.businessInfo?.assignedDarkStoreId || '',
          dispatchCutoff: vendor.businessInfo?.dispatchCutoff || '18:00',
          preparationTimeMins: vendor.businessInfo?.preparationTimeMins ?? 25,
        },
      },
    };
  }

  @Put('settings/security')
  async updateSecuritySettings(
    @Body() body: { currentPassword?: string; newPassword?: string; enable2FA?: boolean },
    @Headers('authorization') authHeader?: string
  ) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    if (body.newPassword) {
      if (!body.currentPassword || !vendorSecurityService.verifyPassword(body.currentPassword, vendor.passwordHash)) {
        throw new BadRequestException('Current password is incorrect.');
      }
      const pwCheck = validatePassword(body.newPassword);
      if (!pwCheck.isValid) throw new BadRequestException(pwCheck.error);
      vendor.passwordHash = vendorSecurityService.hashPassword(body.newPassword);
    }
    if (typeof body.enable2FA === 'boolean') {
      (vendor.businessInfo as any).twoFactorEnabled = body.enable2FA;
    }
    vendor.updatedAt = new Date().toISOString();
    await vendorPersistenceService.saveVendorRecord(vendor);
    return {
      success: true,
      message: body.newPassword ? 'Password changed successfully.' : 'Two-factor authentication preference saved.',
      twoFactorEnabled: Boolean((vendor.businessInfo as any)?.twoFactorEnabled)
    };
  }

  @Put('settings/notifications')
  async updateNotificationSettings(@Body() body: any, @Headers('authorization') authHeader?: string) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const updated = {
      ...((vendor.businessInfo as any)?.notificationPreferences || {}),
      ...(body || {}),
    };
    (vendor.businessInfo as any).notificationPreferences = updated;
    vendor.updatedAt = new Date().toISOString();
    await vendorPersistenceService.saveVendorRecord(vendor);
    return {
      success: true,
      message: 'Notification preferences updated.',
      data: updated
    };
  }

  @Get('delivery/settings')
  async getDeliverySettings(@Headers('authorization') authHeader?: string) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const tenantId = vendor.tenantId || DEFAULT_TENANT_ID;
    const tenantStores = companyAdminDataService.getTenantWarehouses(tenantId);
    const darkStoreId = vendor.businessInfo?.assignedDarkStoreId || tenantStores[0]?.id || 'WH-BLR-04';
    const matchedStore = tenantStores.find((w: any) => w.id === darkStoreId) || BENGALURU_WAREHOUSES[darkStoreId];
    return {
      success: true,
      warehouseAddress: vendor.businessInfo?.warehouseAddress || '',
      pickupPincode: vendor.businessInfo?.pickupPincode || '',
      assignedDarkStoreId: darkStoreId,
      assignedWarehouseName: matchedStore?.name || 'Bengaluru Dark Store',
      dispatchCutoff: vendor.businessInfo?.dispatchCutoff || '18:00',
      preparationTimeMins: vendor.businessInfo?.preparationTimeMins ?? 25,
      tenantDarkStores: tenantStores,
    };
  }

  @Put('delivery/settings')
  async updateDeliverySettings(@Body() body: any, @Headers('authorization') authHeader?: string) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    vendor.businessInfo = {
      ...vendor.businessInfo,
      ...body
    };
    vendor.updatedAt = new Date().toISOString();
    await vendorPersistenceService.saveVendorRecord(vendor);
    return {
      success: true,
      message: 'Delivery settings saved successfully',
      data: vendor.businessInfo
    };
  }

  @Put('onboarding')
  async updateOnboardingDraft(@Body() body: any, @Headers('authorization') authHeader?: string) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    vendor.registrationData = {
      ...(vendor.registrationData || ({} as any)),
      ...(body || {}),
    };
    if (body?.legalBusinessName || body?.storeName) {
      vendor.storeName = body.storeName || vendor.storeName;
      vendor.businessInfo = {
        ...vendor.businessInfo,
        businessName: body.legalBusinessName || vendor.businessInfo?.businessName,
        storeName: body.storeName || vendor.businessInfo?.storeName,
      };
    }
    vendor.updatedAt = new Date().toISOString();
    await vendorPersistenceService.saveVendorRecord(vendor);
    return {
      success: true,
      message: 'Onboarding details saved.',
      data: serializeVendorProfile(vendor),
    };
  }

  @Get('quotations')
  async getVendorQuotations(@Headers('authorization') authHeader?: string) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const tenantId = vendor.tenantId || DEFAULT_TENANT_ID;
    const list = Array.from(companyAdminDataService.quotations.values())
      .filter(
        (q) =>
          (q.tenantId || DEFAULT_TENANT_ID) === tenantId &&
          (q.assignedVendorIds.length === 0 ||
            q.assignedVendorIds.includes(vendor.id) ||
            q.selectedVendorId === vendor.id)
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return {
      success: true,
      count: list.length,
      data: list,
    };
  }

  @Post('quotations/:id/quote')
  async submitVendorQuotation(
    @Param('id') id: string,
    @Body() body: { quotedAmount?: number; totalQuotedAmount?: number; deliveryDays?: number; notes?: string },
    @Headers('authorization') authHeader?: string
  ) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const tenantId = vendor.tenantId || DEFAULT_TENANT_ID;
    const quote = companyAdminDataService.quotations.get(id);
    if (!quote || (quote.tenantId || DEFAULT_TENANT_ID) !== tenantId) {
      throw new NotFoundException('Quotation request not found');
    }
    if (
      quote.assignedVendorIds.length > 0 &&
      !quote.assignedVendorIds.includes(vendor.id) &&
      quote.selectedVendorId !== vendor.id
    ) {
      throw new ForbiddenException('Quotation belongs to another vendor');
    }
    const targetEstimate = quote.items.reduce((s, it) => s + Number(it.quantity || 0) * Number(it.targetPrice || 0), 0);
    const amt = Number(body.quotedAmount ?? body.totalQuotedAmount ?? targetEstimate);
    if (isNaN(amt) || amt <= 0) {
      throw new BadRequestException('Valid quoted amount is required');
    }
    if (!quote.assignedVendorIds.includes(vendor.id)) {
      quote.assignedVendorIds.push(vendor.id);
    }
    const nowIso = new Date().toISOString();
    const vendorName = vendor.storeName || vendor.businessInfo?.businessName || vendor.name;
    const idx = quote.vendorQuotes.findIndex((vq) => vq.vendorId === vendor.id);
    const entry = {
      vendorId: vendor.id,
      vendorName,
      totalQuotedAmount: amt,
      deliveryDays: Number(body.deliveryDays || 1),
      notes: body.notes || '',
      status: 'SUBMITTED' as const,
      submittedAt: nowIso,
    };
    if (idx >= 0) quote.vendorQuotes[idx] = entry;
    else quote.vendorQuotes.push(entry);

    quote.status = 'QUOTES_RECEIVED';
    quote.negotiationHistory.push({
      id: `neg-${Date.now()}`,
      actor: vendorName,
      role: 'VENDOR',
      message: body.notes || `Submitted vendor quote for ₹${amt.toLocaleString('en-IN')}`,
      proposedTotal: amt,
      createdAt: nowIso,
    });
    quote.updatedAt = nowIso;
    companyAdminDataService.quotations.set(quote.id, quote);
    await companyAdminPersistenceService.upsert(CompanyQuotationModel, quote);
    realtimeBus.emitVendorAndAdmin(vendor.id, 'order.status.updated', { quotation: quote }, tenantId);
    return {
      success: true,
      message: 'Quotation submitted to buyer.',
      data: quote,
    };
  }

  @Put('quotations/:id/status')
  async updateVendorQuotationStatus(
    @Param('id') id: string,
    @Body()
    body: {
      status:
        | 'INCOMING'
        | 'VENDOR_ASSIGNED'
        | 'QUOTES_RECEIVED'
        | 'UNDER_NEGOTIATION'
        | 'APPROVED'
        | 'CONVERTED_TO_ORDER'
        | 'REJECTED';
      notes?: string;
    },
    @Headers('authorization') authHeader?: string
  ) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const tenantId = vendor.tenantId || DEFAULT_TENANT_ID;
    const quote = companyAdminDataService.quotations.get(id);
    if (!quote || (quote.tenantId || DEFAULT_TENANT_ID) !== tenantId) {
      throw new NotFoundException('Quotation request not found');
    }
    quote.status = body.status;
    if (body.notes) {
      quote.negotiationHistory.push({
        id: `neg-${Date.now()}`,
        actor: vendor.storeName || vendor.name,
        role: 'VENDOR',
        message: body.notes,
        createdAt: new Date().toISOString(),
      });
    }
    quote.updatedAt = new Date().toISOString();
    companyAdminDataService.quotations.set(quote.id, quote);
    await companyAdminPersistenceService.upsert(CompanyQuotationModel, quote);
    return {
      success: true,
      message: `Quotation status updated to ${body.status}`,
      data: quote,
    };
  }

  @Get('customers')
  async getVendorCustomers(@Headers('authorization') authHeader?: string) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const tenantId = vendor.tenantId || DEFAULT_TENANT_ID;
    const myOrders = vendorOrders.filter((o) => o.vendorId === vendor.id);
    const buyerMap = new Map<string, any>();

    for (const o of myOrders) {
      const key = String(o.customerPhone || o.customerName || 'buyer').toLowerCase();
      const existing = buyerMap.get(key) || {
        id: `cust-${key.replace(/[^a-z0-9]/g, '')}`,
        name: o.customerName,
        phone: o.customerPhone,
        address: o.deliveryAddress,
        totalOrders: 0,
        totalSpend: 0,
        lastOrderAt: o.createdAt,
        lastOrderNumber: o.orderNumber,
      };
      existing.totalOrders += 1;
      existing.totalSpend += Number(o.subtotal || 0);
      if (String(o.createdAt || '') > String(existing.lastOrderAt || '')) {
        existing.lastOrderAt = o.createdAt;
        existing.lastOrderNumber = o.orderNumber;
      }
      buyerMap.set(key, existing);
    }

    for (const c of companyAdminDataService.customers.values()) {
      if ((c.tenantId || DEFAULT_TENANT_ID) !== tenantId) continue;
      const key = String(c.phone || c.name || '').toLowerCase();
      if (buyerMap.has(key)) {
        const entry = buyerMap.get(key);
        entry.email = c.email;
        entry.gstin = c.gstin;
        entry.customerType = c.customerType;
      }
    }

    const list = Array.from(buyerMap.values()).sort((a, b) => b.totalSpend - a.totalSpend);
    return {
      success: true,
      count: list.length,
      data: list,
    };
  }

  @Get('dispatches')
  async getVendorDispatches(@Headers('authorization') authHeader?: string) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const tenantId = vendor.tenantId || DEFAULT_TENANT_ID;
    const myOrders = vendorOrders.filter((o) => o.vendorId === vendor.id);
    const partners = Array.from(companyAdminDataService.deliveryPartners.values()).filter(
      (p) => (p.tenantId || DEFAULT_TENANT_ID) === tenantId
    );
    const darkStores = companyAdminDataService.getTenantWarehouses(tenantId);

    const dispatches = myOrders.map((o: any) => {
      const assignment = companyAdminDataService.dispatchAssignments.get(o.id);
      return {
        id: `disp-${o.id}`,
        orderId: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        deliveryAddress: o.deliveryAddress,
        deliverySpeed: o.deliverySpeed,
        status: assignment?.status || o.status,
        totalAmount: o.subtotal ?? 0,
        driverName: assignment?.driverName || o.deliveryPartnerName || '',
        driverPhone: assignment?.driverPhone || o.deliveryPartnerPhone || '',
        vehicleNumber: assignment?.vehicleNumber || o.vehicleNumber || '',
        partnerId: assignment?.partnerId || o.deliveryPartnerId || '',
        partnerName: assignment?.partnerName || '',
        eta: assignment?.eta || 'Within 60 mins',
        assignedAt: assignment?.assignedAt || null,
        createdAt: o.createdAt,
      };
    });

    return {
      success: true,
      count: dispatches.length,
      data: dispatches,
      deliveryPartners: partners,
      darkStores,
    };
  }

  @Post('orders/:id/assign-delivery')
  async assignDeliveryPartner(
    @Param('id') id: string,
    @Body() body: { partnerId?: string; driverName?: string; driverPhone?: string; vehicleNumber?: string; vehicleType?: string; eta?: string; reassignReason?: string },
    @Headers('authorization') authHeader?: string
  ) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const tenantId = vendor.tenantId || DEFAULT_TENANT_ID;
    const order = vendorOrders.find((o) => (o.id === id || o.orderNumber === id) && o.vendorId === vendor.id) as any;
    if (!order) throw new NotFoundException('Order not found for your vendor account');

    const fallbackPartnerId = body.partnerId || Array.from(companyAdminDataService.deliveryPartners.values())[0]?.id || '';
    if (!fallbackPartnerId) {
      throw new BadRequestException('Delivery partner ID is required.');
    }

    const resData = await fulfilmentLifecycleService.assignDispatchVehicle(tenantId, {
      orderIdOrNumber: order.orderNumber,
      vendorOrderId: order.id,
      partnerId: fallbackPartnerId,
      driverName: body.driverName,
      driverPhone: body.driverPhone,
      vehicleNumber: body.vehicleNumber || 'KA-01-BLD-6060',
      vehicleType: body.vehicleType,
      reassignReason: body.reassignReason,
      actorName: vendor.storeName || vendor.name,
    });

    return {
      success: true,
      message: `Assigned ${resData.assignment.driverName} (${resData.assignment.vehicleType}) for order #${order.orderNumber}`,
      data: resData.assignment,
    };
  }

  // ==========================================
  // 19. NOTIFICATIONS (UNIFIED + REALTIME)
  // ==========================================
  @Get('notifications')
  async getNotifications(@Headers('authorization') authHeader?: string) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    const tenantId = vendor.tenantId || DEFAULT_TENANT_ID;
    const unified = platformNotificationService.listForRecipient(tenantId, 'VENDOR', vendor.id);
    const legacy = vendorNotifications.filter((n) => n.vendorId === vendor.id);
    const seen = new Set(unified.items.map((n) => n.id));
    const combined = [
      ...unified.items,
      ...legacy.filter((n) => !seen.has(n.id)),
    ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return {
      success: true,
      unreadCount: combined.filter((n) => !n.read).length,
      data: combined
    };
  }

  @Put('notifications/:id/read')
  async markNotificationRead(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string
  ) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    await platformNotificationService.markRead(id, vendor.tenantId || DEFAULT_TENANT_ID, 'VENDOR', vendor.id);
    const notif = vendorNotifications.find((n) => n.id === id && n.vendorId === vendor.id);
    if (notif) notif.read = true;
    return { success: true };
  }

  @Put('notifications/read-all')
  async markAllNotificationsRead(@Headers('authorization') authHeader?: string) {
    const vendor = await resolveStrictAuthenticatedVendor(authHeader);
    await platformNotificationService.markAllRead(vendor.tenantId || DEFAULT_TENANT_ID, 'VENDOR', vendor.id);
    vendorNotifications.forEach((n) => {
      if (n.vendorId === vendor.id) n.read = true;
    });
    return { success: true };
  }
}
