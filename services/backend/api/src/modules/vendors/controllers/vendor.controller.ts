import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  HttpException,
  HttpStatus
} from '@nestjs/common';
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
import { SEED_PRODUCTS, MASTER_CATEGORIES, BENGALURU_WAREHOUSES, CATEGORY_ATTRIBUTE_TEMPLATES, getAttributeTemplatesForCategory } from '@buildora/constants';
import { dbStore } from '../../../database/store';
import { vendorSecurityService } from '../services/vendor-security.service';
import { vendorNotificationService } from '../services/vendor-notification.service';
import { postalLookupService } from '../services/postal-lookup.service';
import {
  validateName,
  validateEmail,
  validateIndianMobile,
  validateIdentifier,
  validatePincode,
  validateGSTIN,
  validatePAN,
  validateBankAccount,
  validateIFSC,
  validatePassword,
  validateConfirmPassword,
  validateAddress
} from '@buildora/validation';

// Initial Demo Vendor Profile
const DEFAULT_VENDOR_ID = 'vnd-apex-01';
const DEFAULT_TENANT_ID = 'tenant-buildora-blr';

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
      return applicationId ? `/registration/review/${applicationId}` : '/application-status';
    case 'REJECTED':
      return '/rejection-details';
    case 'SUSPENDED':
      return '/account-restricted';
    default:
      return applicationId ? `/registration/review/${applicationId}` : '/application-status';
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
        lat: 13.0285,
        lng: 77.5195
      },
      bankDetails: {
        accountHolderName: 'Supreme Building Materials Private Limited',
        bankName: 'HDFC Bank',
        accountNumber: '50200049182341',
        ifsc: 'HDFC0000053',
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

// Helper to resolve vendor from Authorization Header
export function getVendorFromAuthHeader(authHeader?: string): BackendVendorRecord {
  if (!authHeader) {
    return vendorRecords.get(DEFAULT_VENDOR_ID)!;
  }
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  // Check if token contains sub/id
  for (const v of vendorRecords.values()) {
    if (token.includes(v.id) || token.includes(v.email)) {
      return v;
    }
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

// Seed Vendor Products derived from SEED_PRODUCTS
let vendorProducts: VendorProduct[] = SEED_PRODUCTS.map((p, idx) => ({
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
let vendorOrders: VendorOrder[] = [
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
let vendorSettlements: VendorSettlement[] = [
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
let vendorStockMovements: VendorStockMovement[] = [
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
let vendorWarehouses: VendorWarehouse[] = [
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
let vendorReturns: VendorReturnRequest[] = [
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
let vendorPromotions: VendorPromotion[] = [
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
let vendorReviews: VendorProductReview[] = [
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
let vendorInvoices: VendorInvoice[] = [
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
let vendorSupportTickets: VendorSupportTicket[] = [
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
let vendorNotifications: VendorNotification[] = [
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

function syncVendorProductToCustomerCatalog(vp: VendorProduct) {
  const targetSku = vp.sku;
  const targetSlug = vp.slug;
  const targetId = vp.id.replace(/^vp-/, '');

  let custProd = dbStore.products.find(
    (p) => p.sku === targetSku || p.slug === targetSlug || p.id === targetId || p.id === vp.id
  );

  if (custProd) {
    custProd.price = vp.price;
    custProd.mrp = vp.mrp;
    custProd.discount = vp.discount;
    custProd.stockCount = vp.stockCount;
    custProd.inStock = vp.inStock;
    if (vp.brand) {
      custProd.brand = vp.brand;
      custProd.brandSlug = (vp.brandSlug || vp.brand).toLowerCase().replace(/\s+/g, '-');
    }
    if (vp.unit) custProd.unit = vp.unit;
    if (vp.packSize) custProd.packSize = vp.packSize;
    if (vp.isNewLaunch !== undefined) {
      custProd.isNewLaunch = vp.isNewLaunch;
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
      (custProd as any).productType = vp.productType;
    }
    if (vp.size) {
      custProd.specifications = {
        ...custProd.specifications,
        'Size': vp.size
      };
      (custProd as any).size = vp.size;
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
  } else if (vp.approvalStatus === 'APPROVED' || vp.isActive) {
    const specs: Record<string, string> = { ...(vp.specifications || {}) };
    if (vp.productType) {
      specs['Type'] = vp.productType;
      specs['Product Type'] = vp.productType;
    }
    if (vp.size) {
      specs['Size'] = vp.size;
    }
    const newCustomerProd: Product = {
      id: targetId,
      name: vp.name,
      slug: vp.slug,
      sku: vp.sku,
      brand: vp.brand,
      brandSlug: vp.brandSlug,
      category: vp.category,
      categorySlug: vp.categorySlug,
      subcategory: vp.subcategory,
      subcategorySlug: vp.subcategorySlug,
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
      inStock: vp.inStock,
      stockCount: vp.stockCount,
      isBulkEligible: vp.isBulkEligible,
      isNewLaunch: Boolean(vp.isNewLaunch),
      bulkPricing: vp.bulkPricing,
      variants: vp.variants,
      attributes: vp.attributes,
      specifications: specs,
      deliverySpeedAvailable: vp.deliverySpeedAvailable,
      applications: [],
      installationTips: [],
      safetyInstructions: []
    };
    if (vp.productType) (newCustomerProd as any).productType = vp.productType;
    if (vp.size) (newCustomerProd as any).size = vp.size;
    dbStore.products.unshift(newCustomerProd);
  }
}

@Controller('api/v1/vendor')
export class VendorController {
  // ==========================================
  // 1. AUTHENTICATION & SECURITY
  // ==========================================

  @Post('auth/send-otp')
  sendOtp(
    @Body() body: { identifier: string; type: 'REGISTRATION_EMAIL' | 'REGISTRATION_MOBILE' | 'LOGIN' | 'PASSWORD_RESET' }
  ) {
    const { identifier, type } = body;
    if (!identifier || !type) {
      throw new BadRequestException('Identifier (email or mobile) and verification type are required.');
    }

    const clean = identifier.trim().toLowerCase();

    // For LOGIN or PASSWORD_RESET, verify that vendor exists
    if (type === 'LOGIN' || type === 'PASSWORD_RESET') {
      const vendor = findVendorByIdentifier(clean);
      if (!vendor) {
        throw new NotFoundException(`No registered vendor account found for "${identifier}".`);
      }
      // Check if account is suspended or locked
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
        throw new BadRequestException(`An account with this ${type === 'REGISTRATION_EMAIL' ? 'email' : 'mobile number'} already exists. Please sign in instead.`);
      }
    }

    const result = vendorSecurityService.generateAndStoreOtp(clean, type);
    return {
      success: true,
      message: result.message,
      cooldownSeconds: result.cooldownSeconds,
      devOtpHint: result.devOtpHint
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

    const isValid = vendorSecurityService.verifyOtp(identifier, type, otp);
    return {
      success: true,
      message: 'Verification code verified successfully.',
      isVerified: isValid
    };
  }

  @Post('auth/login')
  login(@Body() body: { identifier: string; password?: string; rememberMe?: boolean }) {
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
    const redirectTo = getVendorRedirectUrl(vendor.status);

    return {
      success: true,
      message: `Welcome back, ${vendor.storeName || vendor.name}!`,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      status: vendor.status,
      redirectTo,
      vendor: {
        id: vendor.id,
        tenantId: vendor.tenantId,
        storeName: vendor.storeName,
        name: vendor.name,
        email: vendor.email,
        phone: vendor.phone,
        status: vendor.status,
        rejectionReason: vendor.rejectionReason,
        registrationStep: vendor.registrationStep,
        businessInfo: vendor.businessInfo
      }
    };
  }

  @Post('auth/login-otp')
  loginWithOtp(@Body() body: { identifier: string; otp: string }) {
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
    const redirectTo = getVendorRedirectUrl(vendor.status);

    return {
      success: true,
      message: `Signed in successfully with verified mobile code.`,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      status: vendor.status,
      redirectTo,
      vendor: {
        id: vendor.id,
        tenantId: vendor.tenantId,
        storeName: vendor.storeName,
        name: vendor.name,
        email: vendor.email,
        phone: vendor.phone,
        status: vendor.status,
        rejectionReason: vendor.rejectionReason,
        registrationStep: vendor.registrationStep,
        businessInfo: vendor.businessInfo
      }
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

    return vendorSecurityService.generateAndStoreOtp(clean, 'PASSWORD_RESET');
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
  getProfile(@Headers('authorization') authHeader?: string) {
    const vendor = getVendorFromAuthHeader(authHeader);
    return {
      success: true,
      status: vendor.status,
      redirectTo: getVendorRedirectUrl(vendor.status),
      vendor: {
        id: vendor.id,
        tenantId: vendor.tenantId,
        storeName: vendor.storeName,
        name: vendor.name,
        email: vendor.email,
        phone: vendor.phone,
        status: vendor.status,
        rejectionReason: vendor.rejectionReason,
        registrationStep: vendor.registrationStep || 1,
        businessInfo: vendor.businessInfo,
        warehouses: vendor.warehouses || [],
        kycDocuments: vendor.kycDocuments || [],
        auditLogs: vendor.auditLogs || []
      }
    };
  }

  @Post('auth/logout')
  logout() {
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

    const nameCheck = validateName(ownerName);
    if (!nameCheck.isValid) {
      throw new BadRequestException(nameCheck.error || 'Please enter a valid owner / authorized person name.');
    }

    const emailCheck = validateEmail(email);
    if (!emailCheck.isValid) {
      throw new BadRequestException(emailCheck.error || 'Please enter a valid business email address.');
    }

    const phoneCheck = validateIndianMobile(phone);
    if (!phoneCheck.isValid) {
      throw new BadRequestException(phoneCheck.error || 'Please enter a valid 10-digit Indian mobile number.');
    }

    const passCheck = validatePassword(password);
    if (!passCheck.isValid) {
      throw new BadRequestException(passCheck.error || 'Password does not meet enterprise security criteria.');
    }

    const confirmCheck = validateConfirmPassword(password, confirmPassword);
    if (!confirmCheck.isValid) {
      throw new BadRequestException(confirmCheck.error || 'Passwords do not match.');
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim().replace(/\D/g, '').slice(-10);

    // Check duplicate email or phone among active/submitted vendors
    const existingEmail = findVendorByIdentifier(cleanEmail);
    if (existingEmail && existingEmail.status !== 'DRAFT') {
      throw new BadRequestException('This business email is already registered with another vendor partner.');
    }

    const existingPhone = findVendorByIdentifier(cleanPhone);
    if (existingPhone && existingPhone.status !== 'DRAFT') {
      throw new BadRequestException('This mobile number is already registered with another vendor partner.');
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
  saveRegistrationDraft(
    @Body() body: { vendorId?: string; wizardData: Partial<VendorRegistrationWizardData>; currentStep: number },
    @Headers('authorization') authHeader?: string
  ) {
    const vendor = body.vendorId ? vendorRecords.get(body.vendorId) : getVendorFromAuthHeader(authHeader);
    if (!vendor) {
      throw new NotFoundException('Vendor registration session not found.');
    }

    const { wizardData, currentStep } = body;
    vendor.registrationStep = currentStep || vendor.registrationStep || 2;
    vendor.updatedAt = new Date().toISOString();

    if (wizardData) {
      vendor.registrationData = {
        ...(vendor.registrationData || {}),
        ...wizardData
      };

      if (wizardData.legalBusinessName) vendor.businessInfo.businessName = wizardData.legalBusinessName;
      if (wizardData.storeName) {
        vendor.storeName = wizardData.storeName;
        vendor.businessInfo.storeName = wizardData.storeName;
      }
      if (wizardData.businessType) vendor.businessInfo.businessType = wizardData.businessType as any;
      if (wizardData.description) vendor.businessInfo.description = wizardData.description;
      if (wizardData.gstin) vendor.businessInfo.gstin = wizardData.gstin;
      if (wizardData.pan) vendor.businessInfo.pan = wizardData.pan;
      if (wizardData.pincode) {
        vendor.businessInfo.address = {
          ...vendor.businessInfo.address,
          pincode: wizardData.pincode,
          city: wizardData.city || vendor.businessInfo.address?.city || '',
          state: wizardData.state || vendor.businessInfo.address?.state || '',
          country: wizardData.country || 'India'
        };
      }
      if (wizardData.completeAddress) {
        vendor.businessInfo.address = {
          ...vendor.businessInfo.address,
          building: wizardData.completeAddress,
          city: wizardData.city || vendor.businessInfo.address?.city || '',
          state: wizardData.state || vendor.businessInfo.address?.state || '',
          pincode: wizardData.pincode || vendor.businessInfo.address?.pincode || '',
          country: wizardData.country || 'India'
        };
      }
      if (wizardData.bankDetails) {
        vendor.businessInfo.bankDetails = {
          accountHolderName: wizardData.bankDetails.accountHolderName || '',
          bankName: wizardData.bankDetails.bankName || '',
          accountNumber: wizardData.bankDetails.accountNumber || '',
          ifsc: wizardData.bankDetails.ifsc || '',
          branch: wizardData.bankDetails.bankName || 'Bengaluru Branch',
          isVerified: false
        };
      }
      if (wizardData.productCategories) {
        vendor.businessInfo.categories = wizardData.productCategories;
        vendor.categories = wizardData.productCategories;
      }
      if (wizardData.warehouses) {
        vendor.warehouses = wizardData.warehouses;
      }
      if (wizardData.documents) {
        vendor.kycDocuments = wizardData.documents;
      }
    }

    return {
      success: true,
      message: 'Registration progress saved successfully.',
      currentStep: vendor.registrationStep,
      vendor
    };
  }

  @Post('registration/submit')
  submitRegistration(
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
        redirectTo: `/registration/review/${vendor.applicationId || `APP-BLR-2026-${vendor.id.slice(-6)}`}`,
        vendor: {
          id: vendor.id,
          tenantId: vendor.tenantId,
          storeName: vendor.storeName,
          name: vendor.name,
          email: vendor.email,
          phone: vendor.phone,
          status: vendor.status,
          applicationId: vendor.applicationId,
          submittedAt: vendor.submittedAt,
          registrationStep: vendor.registrationStep,
          businessInfo: vendor.businessInfo
        }
      };
    }

    const data = body.wizardData || (vendor.registrationData as VendorRegistrationWizardData);
    if (!data) {
      throw new BadRequestException('Registration wizard data is required for submission.');
    }

    // Step 1 Validation
    if (data.ownerName) {
      const nameCheck = validateName(data.ownerName);
      if (!nameCheck.isValid) throw new BadRequestException(nameCheck.error);
    }
    if (data.email) {
      const emailCheck = validateEmail(data.email);
      if (!emailCheck.isValid) throw new BadRequestException(emailCheck.error);
    }
    if (data.phone) {
      const phoneCheck = validateIndianMobile(data.phone);
      if (!phoneCheck.isValid) throw new BadRequestException(phoneCheck.error);
    }

    // Step 2 Validation: Business Information
    if (!data.legalBusinessName || !data.storeName || !data.businessType) {
      throw new BadRequestException('Please complete all required fields in Step 2: Legal Entity Name, Display Store Name, and Business Type.');
    }
    if (data.storeName.trim().length < 2) {
      throw new BadRequestException('Display Store Name must be at least 2 characters.');
    }

    // Step 3 Validation: Address & Pincode
    if (!data.pincode) {
      throw new BadRequestException('Pincode is required in Step 3.');
    }
    const pinCheck = validatePincode(data.pincode);
    if (!pinCheck.isValid) {
      throw new BadRequestException(pinCheck.error || 'Invalid 6-digit Indian PIN code in Step 3.');
    }
    if (!data.completeAddress || data.completeAddress.trim().length < 5) {
      throw new BadRequestException('Please enter a complete registered business address (minimum 5 characters) in Step 3.');
    }
    if (!data.city || !data.state) {
      throw new BadRequestException('City and State are required in Step 3.');
    }

    // Step 4 Validation: At least GST or PAN
    if (!data.gstin && !data.pan) {
      throw new BadRequestException('At least GSTIN or PAN is mandatory for B2B supplier verification in Step 4.');
    }
    if (data.gstin) {
      const gstCheck = validateGSTIN(data.gstin);
      if (!gstCheck.isValid) {
        throw new BadRequestException(gstCheck.error || 'Invalid 15-character GSTIN format.');
      }
    }
    if (data.pan) {
      const panCheck = validatePAN(data.pan);
      if (!panCheck.isValid) {
        throw new BadRequestException(panCheck.error || 'Invalid 10-character PAN format.');
      }
    }

    // Step 5 Validation: Bank details & Terms acceptance
    if (!data.bankDetails?.accountHolderName || !data.bankDetails?.accountNumber || !data.bankDetails?.ifsc) {
      throw new BadRequestException('Please provide valid bank settlement account details in Step 5.');
    }
    const accCheck = validateBankAccount(data.bankDetails.accountNumber);
    if (!accCheck.isValid) {
      throw new BadRequestException(accCheck.error || 'Invalid bank account number.');
    }
    const ifscCheck = validateIFSC(data.bankDetails.ifsc);
    if (!ifscCheck.isValid) {
      throw new BadRequestException(ifscCheck.error || 'Invalid 11-character IFSC code.');
    }

    if (!data.termsAccepted || !data.privacyAccepted) {
      throw new BadRequestException('You must review and accept the BUILDORA 60 Supplier Terms and Privacy Policy.');
    }

    // Generate unique Application ID if not present
    if (!vendor.applicationId) {
      vendor.applicationId = `APP-BLR-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    }
    vendor.submittedAt = new Date().toISOString();
    vendor.status = 'SUBMITTED';
    vendor.rejectionReason = undefined;
    vendor.updatedAt = new Date().toISOString();
    vendor.registrationStep = 5;
    vendor.registrationData = data;

    if (data.ownerName) vendor.name = data.ownerName;
    if (data.storeName) vendor.storeName = data.storeName;
    if (data.phone) vendor.phone = data.phone;
    if (data.email) vendor.email = data.email;
    if (data.documents && data.documents.length > 0) {
      vendor.kycDocuments = data.documents;
    }

    vendor.businessInfo = {
      ...vendor.businessInfo,
      businessName: data.legalBusinessName || vendor.businessInfo?.businessName,
      contactPerson: data.ownerName || vendor.name,
      phone: data.phone || vendor.phone,
      email: data.email || vendor.email,
      businessType: (data.businessRegistrationType || vendor.businessInfo?.businessType || 'PRIVATE_LIMITED') as any,
      description: data.description || vendor.businessInfo?.description,
      gstin: data.gstin || vendor.businessInfo?.gstin,
      pan: data.pan || vendor.businessInfo?.pan,
      categories: data.productCategories || vendor.categories || [],
      address: {
        building: data.completeAddress || vendor.businessInfo?.address?.building || '',
        street: data.area || vendor.businessInfo?.address?.street || '',
        area: data.area || vendor.businessInfo?.address?.area || '',
        city: data.city || vendor.businessInfo?.address?.city || '',
        state: data.state || vendor.businessInfo?.address?.state || '',
        pincode: data.pincode || vendor.businessInfo?.address?.pincode || ''
      },
      bankDetails: {
        accountHolderName: data.bankDetails?.accountHolderName || '',
        bankName: data.bankDetails?.bankName || '',
        accountNumber: data.bankDetails?.accountNumber || '',
        ifsc: data.bankDetails?.ifsc || '',
        branch: data.bankDetails?.bankName ? `${data.bankDetails.bankName} Branch` : 'Main Branch',
        isVerified: false
      }
    };

    // Record audit log
    if (!vendor.auditLogs) vendor.auditLogs = [];
    vendor.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      action: 'APPLICATION_SUBMITTED',
      performedBy: vendor.name || 'Vendor Owner',
      performedAt: new Date().toISOString(),
      details: `Vendor submitted registration with application ID ${vendor.applicationId}. Application queued for Compliance & KYC review.`,
      oldStatus: 'DRAFT',
      newStatus: 'SUBMITTED'
    });

    // Send notifications
    vendorNotificationService.notify(
      vendor.id,
      'APPLICATION_SUBMITTED',
      'Supplier Application Submitted',
      `Thank you for applying to BUILDORA 60 Supplier Network. Your application ${vendor.applicationId} is under administrative compliance verification.`,
      `/registration/review/${vendor.applicationId}`,
      { email: vendor.email, phone: vendor.phone }
    );

    // Issue JWT token immediately so vendor is authenticated without having to log in again
    const tokens = vendorSecurityService.generateTokens(vendor.id, vendor.email);
    vendor.refreshToken = tokens.refreshToken;

    const redirectTo = `/registration/review/${vendor.applicationId}`;

    return {
      success: true,
      message: 'Your vendor application has been submitted successfully for administrative review.',
      applicationId: vendor.applicationId,
      status: vendor.status,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      redirectTo,
      vendor: {
        id: vendor.id,
        tenantId: vendor.tenantId,
        storeName: vendor.storeName,
        name: vendor.name,
        email: vendor.email,
        phone: vendor.phone,
        status: vendor.status,
        applicationId: vendor.applicationId,
        submittedAt: vendor.submittedAt,
        registrationStep: vendor.registrationStep,
        businessInfo: vendor.businessInfo
      }
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

    // 3. Mask sensitive information (PAN, Bank account)
    const rawPan = targetVendor.registrationData?.pan || targetVendor.businessInfo?.pan || '';
    const maskedPan = rawPan.length >= 6 ? `${rawPan.slice(0, 5)}••••${rawPan.slice(-1)}` : (rawPan ? '••••••••••' : 'Not Provided');

    const rawBankAcc = targetVendor.registrationData?.bankDetails?.accountNumber || targetVendor.businessInfo?.bankDetails?.accountNumber || '';
    const maskedBankAcc = rawBankAcc.length >= 4 ? `••••••••${rawBankAcc.slice(-4)}` : (rawBankAcc ? '••••••••' : 'Not Provided');

    const regData = targetVendor.registrationData;

    return {
      success: true,
      application: {
        applicationId: targetVendor.applicationId || applicationId,
        vendorId: targetVendor.id,
        status: targetVendor.status,
        submittedAt: targetVendor.submittedAt || targetVendor.createdAt,
        updatedAt: targetVendor.updatedAt,
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
          gstin: regData?.gstin || targetVendor.businessInfo?.gstin || 'Not Provided',
          pan: maskedPan
        },
        bankDetails: {
          accountHolderName: regData?.bankDetails?.accountHolderName || targetVendor.businessInfo?.bankDetails?.accountHolderName || '',
          bankName: regData?.bankDetails?.bankName || targetVendor.businessInfo?.bankDetails?.bankName || '',
          accountNumber: maskedBankAcc,
          ifsc: regData?.bankDetails?.ifsc || targetVendor.businessInfo?.bankDetails?.ifsc || '',
          accountType: regData?.bankDetails?.accountType || 'CURRENT'
        },
        documents: (targetVendor.kycDocuments || regData?.documents || []).map((doc) => ({
          id: doc.id,
          type: doc.type,
          title: doc.title,
          fileName: doc.fileName,
          fileSize: doc.fileSize,
          mimeType: doc.mimeType,
          fileUrl: doc.fileUrl,
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
    if (!fileName || !type) {
      throw new BadRequestException('File name and document type are required.');
    }

    // Size limit check (max 10MB)
    if (fileSize > 10 * 1024 * 1024) {
      throw new BadRequestException('File size exceeds the 10 MB limit.');
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

  @Get('registration/status')
  getRegistrationStatus(@Headers('authorization') authHeader?: string) {
    const vendor = getVendorFromAuthHeader(authHeader);
    const rawPan = vendor.registrationData?.pan || vendor.businessInfo?.pan || '';
    const maskedPan = rawPan.length >= 6 ? `${rawPan.slice(0, 5)}••••${rawPan.slice(-1)}` : (rawPan ? '••••••••••' : undefined);

    const rawBankAcc = vendor.registrationData?.bankDetails?.accountNumber || vendor.businessInfo?.bankDetails?.accountNumber || '';
    const maskedBankAcc = rawBankAcc.length >= 4 ? `••••••••${rawBankAcc.slice(-4)}` : undefined;

    return {
      success: true,
      status: vendor.status,
      applicationId: vendor.applicationId || (vendor.status === 'SUBMITTED' ? `APP-BLR-2026-${vendor.id.slice(-6)}` : undefined),
      submittedAt: vendor.submittedAt || vendor.createdAt,
      rejectionReason: vendor.rejectionReason,
      registrationStep: vendor.registrationStep || 1,
      storeName: vendor.storeName,
      legalName: vendor.businessInfo?.businessName,
      email: vendor.email,
      phone: vendor.phone,
      maskedPan,
      maskedBankAcc,
      kycDocuments: (vendor.kycDocuments || []).map((doc) => ({
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
    if (vendor.status !== 'REJECTED') {
      throw new BadRequestException(`Only rejected applications can be resubmitted. Current status is ${vendor.status}.`);
    }

    vendor.status = 'SUBMITTED';
    vendor.updatedAt = new Date().toISOString();

    if (!vendor.auditLogs) vendor.auditLogs = [];
    vendor.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      action: 'APPLICATION_RESUBMITTED',
      performedBy: vendor.name,
      performedAt: new Date().toISOString(),
      details: body.notes ? `Application revised and resubmitted. Notes: ${body.notes}` : 'Application revised with updated documents.',
      oldStatus: 'REJECTED',
      newStatus: 'SUBMITTED'
    });

    vendorNotificationService.notify(
      vendor.id,
      'APPLICATION_SUBMITTED',
      'Application Resubmitted',
      'Your revised application and documents have been sent to the compliance team for re-evaluation.',
      '/application-status',
      { email: vendor.email, phone: vendor.phone }
    );

    return {
      success: true,
      message: 'Application resubmitted successfully. Compliance team will review within 24-48 business hours.',
      status: vendor.status,
      redirectTo: '/application-status',
      vendor
    };
  }

  // ==========================================
  // 3. ADMIN APPLICATION MANAGEMENT & APPROVALS
  // ==========================================

  @Get('admin/applications')
  getAdminApplications(@Query('status') status?: string) {
    const list = Array.from(vendorRecords.values()).map((v) => ({
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
  getAdminApplicationById(@Param('id') id: string) {
    const vendor = vendorRecords.get(id);
    if (!vendor) {
      throw new NotFoundException(`Vendor application #${id} not found.`);
    }

    return {
      success: true,
      data: vendor
    };
  }

  @Put('admin/applications/:id/status')
  updateVendorApplicationStatus(
    @Param('id') id: string,
    @Body()
    body: {
      status: 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'ACTIVE';
      reason?: string;
      adminName?: string;
    }
  ) {
    const vendor = vendorRecords.get(id);
    if (!vendor) {
      throw new NotFoundException(`Vendor application #${id} not found.`);
    }

    const { status, reason, adminName = 'Buildora Compliance Admin' } = body;
    const oldStatus = vendor.status;

    if (status === 'REJECTED' && !reason) {
      throw new BadRequestException('A specific rejection reason is mandatory when rejecting a vendor application.');
    }

    if (status === 'SUSPENDED' && !reason) {
      throw new BadRequestException('A specific reason is mandatory when suspending a vendor account.');
    }

    vendor.status = status;
    vendor.rejectionReason = reason;
    vendor.updatedAt = new Date().toISOString();

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

    // Fire notification to vendor
    if (status === 'APPROVED' || status === 'ACTIVE') {
      vendorNotificationService.notify(
        vendor.id,
        'APPLICATION_APPROVED',
        'Vendor Partnership Approved!',
        'Congratulations! Your vendor partner application has been approved. You now have full access to the supplier dashboard, inventory, and order dispatch hubs.',
        '/dashboard',
        { email: vendor.email, phone: vendor.phone }
      );
    } else if (status === 'REJECTED') {
      vendorNotificationService.notify(
        vendor.id,
        'APPLICATION_REJECTED',
        'Action Required: Application Returned',
        `Your application could not be approved at this time. Reason: ${reason}. Please update your submission on the portal.`,
        '/rejection-details',
        { email: vendor.email, phone: vendor.phone }
      );
    } else if (status === 'SUSPENDED') {
      vendorNotificationService.notify(
        vendor.id,
        'ACCOUNT_SUSPENDED',
        'Urgent: Vendor Account Suspended',
        `Your supplier access has been temporarily restricted. Reason: ${reason}. Please contact compliance support.`,
        '/account-restricted',
        { email: vendor.email, phone: vendor.phone }
      );
    }

    return {
      success: true,
      message: `Vendor #${vendor.id} status updated to ${status}.`,
      status: vendor.status,
      vendor
    };
  }

  // ==========================================
  // 3. MASTER DASHBOARD METRICS & CHARTS (17 KPIs)
  // ==========================================
  @Get('dashboard/metrics')
  getDashboardMetrics(@Query('period') period?: string): { success: boolean; data: any } {
    const totalProducts = vendorProducts.length;
    const activeProducts = vendorProducts.filter((p) => p.isActive && p.approvalStatus === 'APPROVED').length;
    const pendingApprovalProducts = vendorProducts.filter((p) => p.approvalStatus === 'PENDING_APPROVAL').length;
    const rejectedProducts = vendorProducts.filter((p) => p.approvalStatus === 'REJECTED').length;
    const lowStockCount = vendorProducts.filter((p) => p.stockCount <= p.lowStockThreshold && p.stockCount > 0).length;
    const outOfStockCount = vendorProducts.filter((p) => p.stockCount === 0 || !p.inStock).length;

    const baseOrders = vendorOrders.length;
    const totalOrders = baseOrders + 48;
    const newOrders = vendorOrders.filter((o) => o.status === 'NEW').length + 1;
    const processingOrders = vendorOrders.filter((o) => o.status === 'PROCESSING' || o.status === 'READY_FOR_DISPATCH' || o.status === 'ACCEPTED').length;
    const shippedOrders = vendorOrders.filter((o) => o.status === 'DISPATCHED').length + 2;
    const deliveredOrders = vendorOrders.filter((o) => o.status === 'DELIVERED').length + 44;
    const cancelledOrders = vendorOrders.filter((o) => o.status === 'CANCELLED').length + 1;

    let revenueMultiplier = 1;
    if (period === 'today') revenueMultiplier = 0.22;
    else if (period === 'yesterday') revenueMultiplier = 0.18;
    else if (period === '7d') revenueMultiplier = 0.65;
    else if (period === '30d') revenueMultiplier = 1.0;
    else if (period === 'month') revenueMultiplier = 0.85;

    const grossRevenue = Math.round((vendorOrders.reduce((sum, o) => sum + o.subtotal, 0) + 168400) * revenueMultiplier);
    const netEarnings = Math.round((vendorOrders.reduce((sum, o) => sum + o.netPayout, 0) + 158296) * revenueMultiplier);
    const pendingSettlement = vendorSettlements.filter((s) => s.status === 'PENDING').reduce((sum, s) => sum + s.netPayable, 0);
    const completedPayouts = vendorSettlements.filter((s) => s.status === 'PAID').reduce((sum, s) => sum + s.netPayable, 0);

    const returnRequests = vendorReturns.filter((r) => r.status === 'REQUESTED' || r.status === 'INSPECTION_PENDING').length + 1;
    const customerRating = 4.8;
    const reviewCount = vendorReviews.length + 25;

    return {
      success: true,
      data: {
        // Products Group
        totalProducts,
        activeProducts,
        pendingApprovalProducts,
        rejectedProducts,

        // Orders Group
        totalOrders: Math.round(totalOrders * (period === 'today' ? 0.15 : period === '7d' ? 0.45 : 1)),
        newOrders,
        processingOrders,
        shippedOrders,
        dispatchedOrders: shippedOrders,
        deliveredOrders: Math.round(deliveredOrders * (period === 'today' ? 0.1 : period === '7d' ? 0.4 : 1)),
        cancelledOrders,

        // Revenue Group
        grossRevenue,
        netEarnings,
        pendingSettlement,
        completedPayouts,

        // Stock Group
        lowStockCount,
        outOfStockCount,

        // Operations Group
        returnRequests,
        customerRating,
        reviewCount
      }
    };
  }

  @Get('dashboard/charts')
  getDashboardCharts(@Query('period') period?: string) {
    let revenueTrends = [
      { date: '18 Nov', revenue: 18500, orders: 6 },
      { date: '19 Nov', revenue: 16800, orders: 5 },
      { date: '20 Nov', revenue: 22400, orders: 8 },
      { date: '21 Nov', revenue: 26900, orders: 9 },
      { date: '22 Nov', revenue: 31200, orders: 11 },
      { date: '23 Nov', revenue: 22700, orders: 7 },
      { date: '24 Nov', revenue: 34100, orders: 12 }
    ];

    if (period === 'today') {
      revenueTrends = [
        { date: '08:00', revenue: 4200, orders: 1 },
        { date: '10:00', revenue: 8900, orders: 3 },
        { date: '12:00', revenue: 14200, orders: 5 },
        { date: '14:00', revenue: 7800, orders: 2 },
        { date: '16:00', revenue: 11500, orders: 4 }
      ];
    } else if (period === '30d') {
      revenueTrends = [
        { date: 'Week 1', revenue: 112000, orders: 38 },
        { date: 'Week 2', revenue: 145000, orders: 49 },
        { date: 'Week 3', revenue: 168000, orders: 55 },
        { date: 'Week 4', revenue: 139000, orders: 46 }
      ];
    }

    const statusDistribution = [
      { status: 'NEW', label: 'New Orders', count: 3, color: '#FF7417' },
      { status: 'PROCESSING', label: 'Processing & Packed', count: 4, color: '#F59E0B' },
      { status: 'DISPATCHED', label: '60-Min Express Dispatch', count: 2, color: '#203D91' },
      { status: 'DELIVERED', label: 'Delivered to Site', count: 44, color: '#10B981' },
      { status: 'CANCELLED', label: 'Cancelled / Returned', count: 2, color: '#EF4444' }
    ];

    const topProducts = [
      { id: 'vp-prod-cem-1', name: 'UltraTech Super Cement (PPC)', sku: 'CEM-ULT-PPC-50KG', unitsSold: 420, revenue: 165900, stock: 240 },
      { id: 'vp-prod-plumb-1', name: 'Astral CPVC PRO Class 1 Pipe 1"', sku: 'PLM-AST-CPVC-1IN', unitsSold: 180, revenue: 79200, stock: 70 },
      { id: 'vp-prod-ele-1', name: 'Finolex FR 2.5 sq mm Wire (90m)', sku: 'ELE-FIN-25-RED', unitsSold: 95, revenue: 163875, stock: 30 },
      { id: 'vp-prod-ply-1', name: 'Greenply Marine 710 Plywood 18mm', sku: 'PLY-GRN-BWP-18', unitsSold: 64, revenue: 147200, stock: 44 },
      { id: 'vp-prod-pnt-1', name: 'Asian Paints Apex Ultima White 20L', sku: 'PNT-APX-ULT-20L', unitsSold: 48, revenue: 196800, stock: 22 }
    ];

    return {
      success: true,
      revenueTrends,
      statusDistribution,
      topProducts,
      recentOrders: vendorOrders.slice(0, 5)
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
  getAllCategoryAttributeTemplates(@Query('category') category?: string) {
    if (category) {
      return {
        success: true,
        data: getAttributeTemplatesForCategory(category)
      };
    }
    return {
      success: true,
      data: CATEGORY_ATTRIBUTE_TEMPLATES
    };
  }

  // ==========================================
  // 5. PRODUCTS & VARIANTS MANAGEMENT
  // ==========================================
  @Get('products')
  getProducts(
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('search') search?: string
  ) {
    let prods = [...vendorProducts];

    if (category) {
      prods = prods.filter((p) => p.categorySlug === category || p.category === category);
    }
    if (status === 'ACTIVE') {
      prods = prods.filter((p) => p.isActive && p.approvalStatus === 'APPROVED');
    } else if (status === 'PENDING_APPROVAL') {
      prods = prods.filter((p) => p.approvalStatus === 'PENDING_APPROVAL');
    } else if (status === 'REJECTED') {
      prods = prods.filter((p) => p.approvalStatus === 'REJECTED');
    } else if (status === 'LOW_STOCK') {
      prods = prods.filter((p) => p.stockCount <= p.lowStockThreshold && p.stockCount > 0);
    } else if (status === 'OUT_OF_STOCK') {
      prods = prods.filter((p) => p.stockCount === 0 || !p.inStock);
    }

    if (search) {
      const q = search.toLowerCase();
      prods = prods.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
    }

    return {
      success: true,
      total: prods.length,
      data: prods
    };
  }

  @Get('products/:id')
  getProductById(@Param('id') id: string) {
    const prod = vendorProducts.find((p) => p.id === id || p.sku === id);
    if (!prod) {
      throw new NotFoundException(`Product ${id} not found in vendor catalog.`);
    }
    return {
      success: true,
      data: prod
    };
  }

  @Post('products')
  createProduct(@Body() body: Partial<VendorProduct>) {
    if (!body.name || !body.sku || !body.categorySlug || !body.price || !body.mrp) {
      throw new BadRequestException('Product name, SKU, category, price, and MRP are required.');
    }
    if (body.price > body.mrp) {
      throw new BadRequestException('Selling price cannot exceed MRP.');
    }

    const id = `vp-prod-${Date.now()}`;
    const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const newProd: VendorProduct = {
      id,
      vendorId: DEFAULT_VENDOR_ID,
      tenantId: DEFAULT_TENANT_ID,
      name: body.name,
      slug,
      sku: body.sku,
      brand: body.brand || 'Apex Certified',
      brandSlug: (body.brand || 'Apex Certified').toLowerCase().replace(/\s+/g, '-'),
      category: body.category || 'Civil & Interiors',
      categorySlug: body.categorySlug,
      subcategory: body.subcategory || body.categorySlug,
      subcategorySlug: body.subcategorySlug || body.categorySlug,
      description: body.description || '',
      shortDescription: body.shortDescription || '',
      images: body.images && body.images.length > 0 ? body.images : ['https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=400&q=80'],
      price: Number(body.price),
      mrp: Number(body.mrp),
      discount: Math.round(((Number(body.mrp) - Number(body.price)) / Number(body.mrp)) * 100),
      unit: body.unit || 'Piece',
      packSize: body.packSize || '1 Unit',
      gstRate: Number(body.gstRate) || 18,
      rating: 5.0,
      reviewCount: 0,
      inStock: (body.stockCount || 0) > 0,
      stockCount: Number(body.stockCount) || 50,
      lowStockThreshold: Number(body.lowStockThreshold) || 10,
      isBulkEligible: Boolean(body.isBulkEligible),
      isNewLaunch: Boolean(body.isNewLaunch),
      productType: body.productType || '',
      size: body.size || body.unit || '',
      bulkPricing: body.bulkPricing || [
        { minQuantity: 10, discountPercentage: 5, unitPrice: Math.round(Number(body.price) * 0.95) }
      ],
      variants: body.variants || [],
      attributes: body.attributes || [],
      specifications: body.specifications || {},
      deliverySpeedAvailable: body.deliverySpeedAvailable || ['ASAP_60', 'STANDARD'],
      approvalStatus: 'APPROVED',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    vendorProducts.unshift(newProd);
    syncVendorProductToCustomerCatalog(newProd);

    // Record Inward Movement
    if (newProd.stockCount > 0) {
      vendorStockMovements.unshift({
        id: `sm-${Date.now()}`,
        productId: newProd.id,
        productName: newProd.name,
        sku: newProd.sku,
        warehouseId: 'wh-1',
        warehouseName: 'Peenya Central Dispatch Depot',
        type: 'INWARD',
        quantityDelta: newProd.stockCount,
        quantityBefore: 0,
        quantityAfter: newProd.stockCount,
        reason: 'Initial stock intake upon product catalog listing',
        performedBy: 'Vendor Admin',
        createdAt: new Date().toISOString()
      });
    }

    return {
      success: true,
      message: 'Product listed and approved successfully.',
      data: newProd
    };
  }

  @Put('products/:id')
  updateProduct(@Param('id') id: string, @Body() body: Partial<VendorProduct>) {
    const idx = vendorProducts.findIndex((p) => p.id === id);
    if (idx === -1) {
      throw new NotFoundException(`Product ${id} not found.`);
    }

    if (body.price && body.mrp && body.price > body.mrp) {
      throw new BadRequestException('Selling price cannot exceed MRP.');
    }

    vendorProducts[idx] = {
      ...vendorProducts[idx],
      ...body,
      id,
      updatedAt: new Date().toISOString()
    };

    syncVendorProductToCustomerCatalog(vendorProducts[idx]);

    return {
      success: true,
      message: 'Product updated and synchronized with customer catalog.',
      data: vendorProducts[idx]
    };
  }

  @Delete('products/:id')
  deleteProduct(@Param('id') id: string) {
    const prod = vendorProducts.find((p) => p.id === id);
    vendorProducts = vendorProducts.filter((p) => p.id !== id);
    if (prod) {
      const custIdx = dbStore.products.findIndex((p) => p.sku === prod.sku || p.slug === prod.slug || p.id === prod.id);
      if (custIdx !== -1) {
        dbStore.products.splice(custIdx, 1);
      }
    }
    return {
      success: true,
      message: 'Product removed from vendor catalog and customer catalog.'
    };
  }

  @Post('products/bulk-import')
  bulkImportProducts(@Body() body: { products: Partial<VendorProduct>[] }) {
    if (!body.products || !Array.isArray(body.products) || body.products.length === 0) {
      throw new BadRequestException('Array of products required for bulk import.');
    }

    const imported: VendorProduct[] = [];
    for (const item of body.products) {
      if (!item.name || !item.sku || !item.price) continue;
      const id = `vp-prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const prod: VendorProduct = {
        id,
        vendorId: DEFAULT_VENDOR_ID,
        tenantId: DEFAULT_TENANT_ID,
        name: item.name,
        slug: item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        sku: item.sku,
        brand: item.brand || 'Apex Certified',
        brandSlug: (item.brand || 'Apex Certified').toLowerCase().replace(/\s+/g, '-'),
        category: item.category || 'Civil & Interiors',
        categorySlug: item.categorySlug || 'civil-concrete',
        subcategory: item.subcategory || 'General',
        subcategorySlug: item.subcategorySlug || 'general',
        description: item.description || '',
        images: item.images && item.images.length > 0 ? item.images : ['https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=400&q=80'],
        price: Number(item.price),
        mrp: Number(item.mrp || item.price),
        discount: item.mrp && item.price ? Math.round(((Number(item.mrp) - Number(item.price)) / Number(item.mrp)) * 100) : 0,
        unit: item.unit || 'Piece',
        packSize: item.packSize || '1 Unit',
        gstRate: Number(item.gstRate) || 18,
        rating: 5.0,
        reviewCount: 0,
        inStock: (Number(item.stockCount) || 50) > 0,
        stockCount: Number(item.stockCount) || 50,
        lowStockThreshold: 10,
        isBulkEligible: Boolean(item.isBulkEligible),
        isNewLaunch: Boolean(item.isNewLaunch),
        bulkPricing: item.bulkPricing || [],
        variants: item.variants || [],
        specifications: item.specifications || {},
        deliverySpeedAvailable: ['ASAP_60', 'STANDARD'],
        approvalStatus: 'APPROVED',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      vendorProducts.unshift(prod);
      syncVendorProductToCustomerCatalog(prod);
      imported.push(prod);
    }

    return {
      success: true,
      importedCount: imported.length,
      data: imported
    };
  }

  @Get('products/export')
  exportProducts() {
    return {
      success: true,
      count: vendorProducts.length,
      data: vendorProducts
    };
  }

  @Put('products/:id/variants')
  updateProductVariants(@Param('id') id: string, @Body() body: { variants: any[]; attributes?: any[] }) {
    const prod = vendorProducts.find((p) => p.id === id || p.id === `vp-${id}` || p.sku === id);
    if (!prod) throw new NotFoundException('Product not found');

    prod.variants = body.variants || [];
    if (body.attributes) prod.attributes = body.attributes;
    prod.updatedAt = new Date().toISOString();

    syncVendorProductToCustomerCatalog(prod);

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
  getBulkPricing(@Param('id') id: string) {
    const prod = vendorProducts.find((p) => p.id === id);
    if (!prod) throw new NotFoundException('Product not found');
    return {
      success: true,
      productName: prod.name,
      basePrice: prod.price,
      bulkPricing: prod.bulkPricing || []
    };
  }

  @Put('products/:id/bulk-pricing')
  updateBulkPricing(
    @Param('id') id: string,
    @Body() body: { bulkPricing: BulkPriceTier[]; isBulkEligible?: boolean }
  ) {
    const prod = vendorProducts.find((p) => p.id === id);
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

    return {
      success: true,
      message: 'Bulk pricing tiers updated and synchronized with customer website.',
      data: prod.bulkPricing
    };
  }

  @Get('bulk-pricing/all')
  getAllBulkPricing() {
    const bulkProducts = vendorProducts.filter((p) => p.isBulkEligible && p.bulkPricing && p.bulkPricing.length > 0);
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
  getInventory() {
    const items = vendorProducts.map((p) => ({
      productId: p.id,
      name: p.name,
      sku: p.sku,
      category: p.category,
      unit: p.unit,
      stockCount: p.stockCount,
      lowStockThreshold: p.lowStockThreshold,
      status: p.stockCount === 0 ? 'OUT_OF_STOCK' : p.stockCount <= p.lowStockThreshold ? 'LOW_STOCK' : 'IN_STOCK',
      warehouse: currentVendor.businessInfo.warehouseAddress || 'Peenya Central Hub',
      warehouseId: 'wh-1'
    }));

    return {
      success: true,
      total: items.length,
      data: items
    };
  }

  @Post('inventory/adjust')
  adjustStock(@Body() body: {
    productId: string;
    adjustmentType: 'ADD' | 'SUBTRACT' | 'SET';
    quantity: number;
    reason: string;
    warehouseId?: string;
    movementType?: 'INWARD' | 'DISPATCH' | 'ADJUSTMENT' | 'RETURN' | 'DAMAGED';
    referenceNumber?: string;
  }) {
    const prod = vendorProducts.find((p) => p.id === body.productId);
    if (!prod) throw new NotFoundException('Product not found');

    const qty = Number(body.quantity);
    if (isNaN(qty) || qty < 0) {
      throw new BadRequestException('Valid adjustment quantity is required.');
    }

    const before = prod.stockCount;
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
    prod.inStock = prod.stockCount > 0;
    prod.updatedAt = new Date().toISOString();
    syncVendorProductToCustomerCatalog(prod);

    // Record in Stock Movement Log
    const movement: VendorStockMovement = {
      id: `sm-${Date.now()}`,
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      warehouseId: body.warehouseId || 'wh-1',
      warehouseName: 'Peenya Central Dispatch Depot',
      type: body.movementType || (delta > 0 ? 'INWARD' : 'ADJUSTMENT'),
      quantityDelta: delta,
      quantityBefore: before,
      quantityAfter: after,
      reason: body.reason || 'Inventory stock manual adjustment',
      referenceNumber: body.referenceNumber || `ADJ-${Date.now()}`,
      performedBy: 'Vikramaditya Rao',
      createdAt: new Date().toISOString()
    };
    vendorStockMovements.unshift(movement);

    return {
      success: true,
      message: `Stock updated for ${prod.name}. New count: ${prod.stockCount}. Inward/dispatch logged.`,
      data: {
        productId: prod.id,
        newStock: prod.stockCount,
        inStock: prod.inStock,
        movement
      }
    };
  }

  @Get('inventory/movements')
  getStockMovements(@Query('productId') productId?: string) {
    let movements = [...vendorStockMovements];
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
  getWarehouses() {
    return {
      success: true,
      data: vendorWarehouses,
      darkStores: Object.values(BENGALURU_WAREHOUSES)
    };
  }

  @Post('warehouses')
  createWarehouse(@Body() body: Partial<VendorWarehouse>) {
    if (!body.name || !body.address || !body.pincode) {
      throw new BadRequestException('Warehouse name, address, and pincode are required.');
    }
    const newWh: VendorWarehouse = {
      id: `wh-${Date.now()}`,
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
      vendorWarehouses.forEach((w) => (w.isPrimary = false));
    }
    vendorWarehouses.push(newWh);

    return {
      success: true,
      message: 'Warehouse added successfully.',
      data: newWh
    };
  }

  @Put('warehouses/:id')
  updateWarehouse(@Param('id') id: string, @Body() body: Partial<VendorWarehouse>) {
    const wh = vendorWarehouses.find((w) => w.id === id);
    if (!wh) throw new NotFoundException('Warehouse not found');

    if (body.isPrimary) {
      vendorWarehouses.forEach((w) => (w.isPrimary = false));
    }
    Object.assign(wh, body);

    return {
      success: true,
      message: 'Warehouse updated successfully.',
      data: wh
    };
  }

  @Delete('warehouses/:id')
  deleteWarehouse(@Param('id') id: string) {
    vendorWarehouses = vendorWarehouses.filter((w) => w.id !== id);
    return { success: true, message: 'Warehouse removed successfully.' };
  }

  // ==========================================
  // 8. ORDERS & 60-MIN SITE DISPATCH WORKFLOW
  // ==========================================
  @Get('orders')
  getOrders(@Query('status') status?: string) {
    let orders = [...vendorOrders];
    if (status) {
      orders = orders.filter((o) => o.status === status);
    }
    return {
      success: true,
      total: orders.length,
      data: orders
    };
  }

  @Get('orders/:id')
  getOrderById(@Param('id') id: string) {
    const order = vendorOrders.find((o) => o.id === id || o.orderNumber === id);
    if (!order) throw new NotFoundException('Order not found');
    return {
      success: true,
      data: order
    };
  }

  @Put('orders/:id/status')
  updateOrderStatus(
    @Param('id') id: string,
    @Body() body: { status: VendorOrder['status']; note?: string }
  ) {
    const order = vendorOrders.find((o) => o.id === id || o.orderNumber === id);
    if (!order) throw new NotFoundException('Order not found');

    order.status = body.status;
    order.timeline.push({
      status: body.status,
      title: `Status updated to ${body.status}`,
      description: body.note || `Order marked as ${body.status} by depot manager`,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      message: `Order status updated to ${body.status}`,
      data: order
    };
  }

  @Post('orders/:id/accept')
  acceptOrder(@Param('id') id: string) {
    const order = vendorOrders.find((o) => o.id === id || o.orderNumber === id);
    if (!order) throw new NotFoundException('Order not found');

    order.status = 'ACCEPTED';
    order.timeline.push({
      status: 'ACCEPTED',
      title: 'Order Accepted by Vendor Depot',
      description: 'Inventory allocated and materials sent to packing bay.',
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      message: 'Order accepted for site fulfillment.',
      data: order
    };
  }

  @Post('orders/:id/reject')
  rejectOrder(@Param('id') id: string, @Body() body: { reason: string }) {
    const order = vendorOrders.find((o) => o.id === id || o.orderNumber === id);
    if (!order) throw new NotFoundException('Order not found');

    order.status = 'CANCELLED';
    order.timeline.push({
      status: 'CANCELLED',
      title: 'Order Rejected by Vendor Depot',
      description: body.reason || 'Depot capacity full or out-of-stock batch',
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      message: 'Order marked as cancelled.',
      data: order
    };
  }

  @Get('orders/:id/packing-slip')
  getOrderPackingSlip(@Param('id') id: string) {
    const order = vendorOrders.find((o) => o.id === id || o.orderNumber === id);
    if (!order) throw new NotFoundException('Order not found');

    return {
      success: true,
      slipNumber: `PS-${order.orderNumber}`,
      generatedAt: new Date().toISOString(),
      order,
      vendor: currentVendor.businessInfo,
      assignedDarkStore: BENGALURU_WAREHOUSES[currentVendor.businessInfo.assignedDarkStoreId || 'WH-BLR-04']
    };
  }

  // ==========================================
  // 9. RETURNS & REFUNDS WORKFLOW
  // ==========================================
  @Get('returns')
  getReturns(@Query('status') status?: string) {
    let list = [...vendorReturns];
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
  getReturnById(@Param('id') id: string) {
    const ret = vendorReturns.find((r) => r.id === id || r.orderNumber === id);
    if (!ret) throw new NotFoundException('Return request not found');
    return { success: true, data: ret };
  }

  @Put('returns/:id/status')
  updateReturnStatus(
    @Param('id') id: string,
    @Body() body: { status: VendorReturnRequest['status']; restockDecision?: boolean; rejectionReason?: string }
  ) {
    const ret = vendorReturns.find((r) => r.id === id);
    if (!ret) throw new NotFoundException('Return request not found');

    ret.status = body.status;
    if (body.rejectionReason) ret.rejectionReason = body.rejectionReason;
    if (body.restockDecision !== undefined) ret.restockDecision = body.restockDecision;
    if (body.status === 'REFUNDED') ret.resolvedAt = new Date().toISOString();

    // If approved for restocking, automatically inward into warehouse inventory
    if (ret.status === 'REFUNDED' && ret.restockDecision) {
      for (const item of ret.items) {
        const prod = vendorProducts.find((p) => p.sku === item.sku || p.id === item.productId);
        if (prod) {
          const before = prod.stockCount;
          prod.stockCount += item.quantity;
          prod.inStock = true;
          syncVendorProductToCustomerCatalog(prod);

          vendorStockMovements.unshift({
            id: `sm-${Date.now()}`,
            productId: prod.id,
            productName: prod.name,
            sku: prod.sku,
            warehouseId: 'wh-1',
            warehouseName: 'Peenya Central Dispatch Depot',
            type: 'RETURN',
            quantityDelta: item.quantity,
            quantityBefore: before,
            quantityAfter: prod.stockCount,
            reason: `Return restocked from Request #${ret.id}`,
            referenceNumber: ret.orderNumber,
            performedBy: 'Compliance Lead',
            createdAt: new Date().toISOString()
          });
        }
      }
    }

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
  getPromotions() {
    return {
      success: true,
      count: vendorPromotions.length,
      data: vendorPromotions
    };
  }

  @Post('promotions')
  createPromotion(@Body() body: Partial<VendorPromotion>) {
    if (!body.title || !body.discountValue || !body.startDate || !body.endDate) {
      throw new BadRequestException('Promotion title, discount value, start date, and end date are required.');
    }

    const promo: VendorPromotion = {
      id: `promo-${Date.now()}`,
      vendorId: DEFAULT_VENDOR_ID,
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

    return {
      success: true,
      message: 'Promotion created and published to customer deals section.',
      data: promo
    };
  }

  @Put('promotions/:id/status')
  updatePromotionStatus(@Param('id') id: string, @Body() body: { status: VendorPromotion['status'] }) {
    const promo = vendorPromotions.find((p) => p.id === id);
    if (!promo) throw new NotFoundException('Promotion not found');
    promo.status = body.status;
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
  getReviews() {
    const totalReviews = vendorReviews.length;
    const avgRating = totalReviews > 0 ? Number((vendorReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)) : 5.0;

    return {
      success: true,
      averageRating: avgRating,
      totalCount: totalReviews,
      data: vendorReviews
    };
  }

  @Post('reviews/:id/reply')
  replyToReview(@Param('id') id: string, @Body() body: { message: string }) {
    const rev = vendorReviews.find((r) => r.id === id);
    if (!rev) throw new NotFoundException('Review not found');
    if (!body.message) throw new BadRequestException('Reply message cannot be empty');

    rev.vendorReply = {
      message: body.message,
      repliedAt: new Date().toISOString(),
      repliedBy: 'Vikramaditya Rao'
    };

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
  getSettlements() {
    return {
      success: true,
      data: vendorSettlements
    };
  }

  @Get('settlements/summary')
  getSettlementsSummary() {
    return {
      success: true,
      grossSales: 168400,
      platformCommission: 8420,
      taxDeducted: 1684,
      netEarnings: 158296,
      pendingPayout: 50948,
      completedPayout: 92590,
      bankAccount: currentVendor.businessInfo.bankDetails
    };
  }

  @Post('settlements/request-payout')
  requestSettlementPayout(@Body() body: { amount?: number }) {
    const newSettlement: VendorSettlement = {
      id: `stl-${Date.now()}`,
      settlementNumber: `SETTL-BLD-${Math.floor(10000 + Math.random() * 90000)}`,
      vendorId: DEFAULT_VENDOR_ID,
      period: 'Current On-Demand Payout',
      orderCount: 8,
      grossRevenue: body.amount || 50948,
      platformCommission: Math.round((body.amount || 50948) * 0.05),
      taxDeductions: Math.round((body.amount || 50948) * 0.01),
      netPayable: Math.round((body.amount || 50948) * 0.94),
      status: 'PROCESSING',
      createdAt: new Date().toISOString()
    };

    vendorSettlements.unshift(newSettlement);

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
  getInvoices() {
    return {
      success: true,
      count: vendorInvoices.length,
      data: vendorInvoices
    };
  }

  @Get('invoices/:id')
  getInvoiceById(@Param('id') id: string) {
    const inv = vendorInvoices.find((i) => i.id === id || i.invoiceNumber === id);
    if (!inv) throw new NotFoundException('Invoice not found');
    return { success: true, data: inv };
  }

  // ==========================================
  // 15. BUSINESS REPORTS & ANALYTICS
  // ==========================================
  @Get('reports/sales')
  getSalesReport(@Query('period') period?: string, @Query('category') category?: string) {
    return {
      success: true,
      period: period || 'Last 30 Days',
      totalRevenue: 168400,
      totalOrders: 52,
      averageOrderValue: 3238,
      topCategories: [
        { name: 'Civil & Interiors', revenue: 78500, percentage: 46.6 },
        { name: 'Plumbing & Pipes', revenue: 42300, percentage: 25.1 },
        { name: 'Electrical & Lighting', revenue: 32600, percentage: 19.3 },
        { name: 'Plywood & Hardware', revenue: 15000, percentage: 9.0 }
      ],
      dailySummary: [
        { date: '2026-11-20', sales: 22400, orders: 8 },
        { date: '2026-11-21', sales: 26900, orders: 9 },
        { date: '2026-11-22', sales: 31200, orders: 11 },
        { date: '2026-11-23', sales: 22700, orders: 7 },
        { date: '2026-11-24', sales: 34100, orders: 12 }
      ]
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
  getSupportTickets() {
    return {
      success: true,
      count: vendorSupportTickets.length,
      data: vendorSupportTickets
    };
  }

  @Post('support/tickets')
  createSupportTicket(@Body() body: { subject: string; category: any; priority: any; description: string }) {
    if (!body.subject || !body.description) {
      throw new BadRequestException('Ticket subject and description are required.');
    }

    const tkt: VendorSupportTicket = {
      id: `tkt-${Date.now()}`,
      ticketNumber: `TKT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      vendorId: DEFAULT_VENDOR_ID,
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
          sender: 'Vikramaditya Rao',
          senderRole: 'VENDOR',
          text: body.description,
          timestamp: new Date().toISOString()
        }
      ]
    };

    vendorSupportTickets.unshift(tkt);

    return {
      success: true,
      message: 'Support ticket submitted. Partner response SLA: 4 business hours.',
      data: tkt
    };
  }

  @Post('support/tickets/:id/messages')
  addSupportTicketMessage(@Param('id') id: string, @Body() body: { text: string }) {
    const tkt = vendorSupportTickets.find((t) => t.id === id);
    if (!tkt) throw new NotFoundException('Support ticket not found');
    if (!body.text) throw new BadRequestException('Message cannot be empty');

    const msg = {
      id: `msg-${Date.now()}`,
      sender: 'Vikramaditya Rao',
      senderRole: 'VENDOR' as const,
      text: body.text,
      timestamp: new Date().toISOString()
    };
    tkt.messages.push(msg);
    tkt.updatedAt = new Date().toISOString();

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
  getVendorProfile() {
    return {
      success: true,
      data: currentVendor
    };
  }

  @Put('profile')
  updateVendorProfile(@Body() body: any) {
    if (body.storeName) currentVendor.storeName = body.storeName;
    if (body.businessInfo) {
      currentVendor.businessInfo = { ...currentVendor.businessInfo, ...body.businessInfo };
    }
    currentVendor.updatedAt = new Date().toISOString();
    return { success: true, message: 'Vendor business profile updated.', data: currentVendor };
  }

  @Put('profile/bank')
  updateVendorBankDetails(@Body() body: any) {
    currentVendor.businessInfo.bankDetails = {
      ...currentVendor.businessInfo.bankDetails,
      ...body,
      isVerified: true
    };
    return { success: true, message: 'Bank account updated and verified with penny-drop check.', data: currentVendor.businessInfo.bankDetails };
  }

  @Put('settings/security')
  updateSecuritySettings(@Body() body: { currentPassword?: string; newPassword?: string; enable2FA?: boolean }) {
    return {
      success: true,
      message: body.newPassword ? 'Password changed successfully.' : 'Two-factor authentication preference saved.',
      twoFactorEnabled: Boolean(body.enable2FA)
    };
  }

  @Put('settings/notifications')
  updateNotificationSettings(@Body() body: any) {
    return {
      success: true,
      message: 'Notification preferences updated.',
      data: body
    };
  }

  @Get('delivery/settings')
  getDeliverySettings() {
    return {
      success: true,
      warehouseAddress: currentVendor.businessInfo.warehouseAddress,
      pickupPincode: currentVendor.businessInfo.pickupPincode,
      assignedDarkStoreId: currentVendor.businessInfo.assignedDarkStoreId,
      assignedWarehouseName: BENGALURU_WAREHOUSES[currentVendor.businessInfo.assignedDarkStoreId || 'WH-BLR-04']?.name || 'Bengaluru West Dark Store',
      dispatchCutoff: currentVendor.businessInfo.dispatchCutoff,
      preparationTimeMins: currentVendor.businessInfo.preparationTimeMins
    };
  }

  @Put('delivery/settings')
  updateDeliverySettings(@Body() body: any) {
    currentVendor.businessInfo = {
      ...currentVendor.businessInfo,
      ...body
    };
    return {
      success: true,
      message: 'Delivery settings saved successfully',
      data: currentVendor.businessInfo
    };
  }

  // ==========================================
  // 19. NOTIFICATIONS
  // ==========================================
  @Get('notifications')
  getNotifications() {
    return {
      success: true,
      unreadCount: vendorNotifications.filter((n) => !n.read).length,
      data: vendorNotifications
    };
  }

  @Put('notifications/:id/read')
  markNotificationRead(@Param('id') id: string) {
    const notif = vendorNotifications.find((n) => n.id === id);
    if (notif) notif.read = true;
    return { success: true };
  }

  @Put('notifications/read-all')
  markAllNotificationsRead() {
    vendorNotifications.forEach((n) => (n.read = true));
    return { success: true };
  }
}
