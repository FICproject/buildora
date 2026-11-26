import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as crypto from 'crypto';
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
  vendorReviews,
  vendorInvoices,
  vendorSupportTickets,
  vendorNotifications,
} from '../../vendors/controllers/vendor.controller';
import {
  CompanyAdminRole,
  COMPANY_ADMIN_PERMISSION_MATRIX,
  companyAdminSecurityService,
} from './company-admin-security.service';
import {
  companyAdminPersistenceService,
  CompanyTenantModel,
  CompanyAdminUserModel,
  CompanyQuotationModel,
  CompanyContentModel,
  CompanyAuditLogModel,
  CompanyDeliveryPartnerModel,
  CompanyCustomerModel,
} from './company-admin-persistence.service';

export interface CompanyTenantRecord {
  id: string;
  name: string;
  legalName: string;
  slug: string;
  city: string;
  state: string;
  gstin: string;
  pan: string;
  supportEmail: string;
  supportPhone: string;
  logoUrl: string;
  websiteUrl: string;
  status: 'ACTIVE' | 'SUSPENDED';
  bankDetails: {
    bankName: string;
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    branch: string;
  };
  paymentConfig: {
    razorpayEnabled: boolean;
    codEnabled: boolean;
    codMaxOrderValue: number;
    settlementCycleDays: number;
    platformCommissionPercent: number;
  };
  deliveryConfig: {
    defaultShippingCharge: number;
    freeShippingThreshold: number;
    expressDeliveryFee: number;
    estimatedDeliveryDays: number;
  };
  taxConfig: {
    defaultGstRate: number;
    gstStateCode: string;
    autoInvoicePrefix: string;
  };
  notificationPrefs: {
    emailAlerts: boolean;
    smsAlerts: boolean;
    lowStockThreshold: number;
    dailyDigestTime: string;
  };
  securitySettings: {
    enforce2FA: boolean;
    sessionTimeoutMinutes: number;
    maxFailedLogins: number;
  };
  updatedAt: string;
}

export interface CompanyAdminUserRecord {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string;
  role: CompanyAdminRole;
  permissions: string[];
  passwordHash: string;
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
  department: string;
  lastLoginAt?: string;
  createdAt: string;
}

export interface CompanyQuotationRecord {
  id: string;
  tenantId: string;
  quoteNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  projectName: string;
  siteAddress: string;
  pincode: string;
  status:
    | 'INCOMING'
    | 'VENDOR_ASSIGNED'
    | 'QUOTES_RECEIVED'
    | 'UNDER_NEGOTIATION'
    | 'APPROVED'
    | 'CONVERTED_TO_ORDER'
    | 'REJECTED';
  items: Array<{
    productId: string;
    sku: string;
    name: string;
    unit: string;
    quantity: number;
    targetPrice: number;
  }>;
  assignedVendorIds: string[];
  vendorQuotes: Array<{
    vendorId: string;
    vendorName: string;
    totalQuotedAmount: number;
    deliveryDays: number;
    notes: string;
    status: 'PENDING' | 'SUBMITTED' | 'SELECTED' | 'DECLINED';
    submittedAt?: string;
  }>;
  selectedVendorId?: string;
  finalApprovedAmount?: number;
  convertedOrderId?: string;
  negotiationHistory: Array<{
    id: string;
    actor: string;
    role: string;
    message: string;
    proposedTotal?: number;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyContentRecord {
  id: string;
  tenantId: string;
  contentType:
    | 'BANNER'
    | 'HOMEPAGE_SECTION'
    | 'ANNOUNCEMENT'
    | 'DEAL'
    | 'NEW_LAUNCH'
    | 'CATEGORY_NAV';
  title: string;
  subtitle: string;
  badge?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  imageUrl?: string;
  position: number;
  status: 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED';
  draftPayload: Record<string, any>;
  publishedPayload?: Record<string, any>;
  startDate?: string;
  endDate?: string;
  updatedBy: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface CompanyDeliveryPartnerRecord {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  contactPerson: string;
  phone: string;
  vehicleTypes: string[];
  servicePincodes: string[];
  activeDeliveries: number;
  completedDeliveries: number;
  onTimeRate: number;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  baseCharge: number;
  perKmCharge: number;
  createdAt: string;
}

export interface CompanyCustomerRecord {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string;
  customerType: 'HOMEOWNER' | 'CONTRACTOR' | 'BUILDER' | 'ARCHITECT';
  city: string;
  pincode: string;
  gstin?: string;
  status: 'ACTIVE' | 'BLOCKED';
  totalOrders: number;
  totalSpent: number;
  walletBalance: number;
  lastOrderAt?: string;
  createdAt: string;
  recentActivity: string[];
}

export interface CompanyAuditLogRecord {
  id: string;
  tenantId: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  module: string;
  entityType: string;
  entityId: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}

export interface ProductAttributeRecord {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  categoryName: string;
  values: string[];
  isRequired: boolean;
  isFilterable: boolean;
}

export interface NotificationTemplateRecord {
  id: string;
  tenantId: string;
  name: string;
  channel: 'EMAIL' | 'SMS' | 'WHATSAPP' | 'IN_APP';
  eventKey: string;
  subject: string;
  body: string;
  isActive: boolean;
  updatedAt: string;
}

export const HYD_TENANT_ID = 'tenant-buildora-hyd';

@Injectable()
export class CompanyAdminDataService implements OnModuleInit {
  private readonly logger = new Logger(CompanyAdminDataService.name);

  readonly tenants: Map<string, CompanyTenantRecord> = new Map();
  readonly adminUsers: Map<string, CompanyAdminUserRecord> = new Map();
  readonly quotations: Map<string, CompanyQuotationRecord> = new Map();
  readonly contentItems: Map<string, CompanyContentRecord> = new Map();
  readonly deliveryPartners: Map<string, CompanyDeliveryPartnerRecord> = new Map();
  readonly customers: Map<string, CompanyCustomerRecord> = new Map();
  readonly auditLogs: CompanyAuditLogRecord[] = [];
  readonly attributes: ProductAttributeRecord[] = [];
  readonly notificationTemplates: NotificationTemplateRecord[] = [];
  readonly dispatchAssignments: Map<
    string,
    {
      orderId: string;
      tenantId: string;
      partnerId: string;
      partnerName: string;
      vehicleNumber: string;
      driverName: string;
      driverPhone: string;
      status: 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED';
      assignedAt: string;
      updatedAt: string;
      eta: string;
      proofOfDeliveryUrl?: string;
    }
  > = new Map();

  readonly tenantOrders: Array<any> = [];
  readonly notificationAlerts: Array<{
    id: string;
    tenantId: string;
    title: string;
    message: string;
    type: 'ORDER' | 'VENDOR' | 'INVENTORY' | 'FINANCE' | 'SYSTEM';
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    isRead: boolean;
    createdAt: string;
    link?: string;
  }> = [];

  constructor() {
    this.seedInitialData();
  }

  async onModuleInit(): Promise<void> {
    await this.hydrateFromMongo();
  }

  private seedInitialData(): void {
    const nowIso = new Date().toISOString();
    const defaultPwdHash = companyAdminSecurityService.hashPassword('Admin@123');

    this.tenants.set(DEFAULT_TENANT_ID, {
      id: DEFAULT_TENANT_ID,
      name: 'Buildora Bengaluru Enterprise',
      legalName: 'Buildora 60 Building Materials Pvt Ltd',
      slug: 'buildora-blr',
      city: 'Bengaluru',
      state: 'Karnataka',
      gstin: '29AABCB6012H1Z8',
      pan: 'AABCB6012H',
      supportEmail: 'company-support@buildora.in',
      supportPhone: '+91 80 4123 6060',
      logoUrl: '/logo-buildora.svg',
      websiteUrl: 'https://buildora.in',
      status: 'ACTIVE',
      bankDetails: {
        bankName: 'HDFC Bank Ltd',
        accountHolderName: 'Buildora 60 Building Materials Pvt Ltd',
        accountNumber: '50200048192837',
        ifscCode: 'HDFC0000142',
        branch: 'Koramangala 4th Block, Bengaluru',
      },
      paymentConfig: {
        razorpayEnabled: true,
        codEnabled: true,
        codMaxOrderValue: 50000,
        settlementCycleDays: 7,
        platformCommissionPercent: 6,
      },
      deliveryConfig: {
        defaultShippingCharge: 199,
        freeShippingThreshold: 5000,
        expressDeliveryFee: 499,
        estimatedDeliveryDays: 1,
      },
      taxConfig: {
        defaultGstRate: 18,
        gstStateCode: '29',
        autoInvoicePrefix: 'BLR-INV-',
      },
      notificationPrefs: {
        emailAlerts: true,
        smsAlerts: true,
        lowStockThreshold: 25,
        dailyDigestTime: '09:00',
      },
      securitySettings: {
        enforce2FA: false,
        sessionTimeoutMinutes: 480,
        maxFailedLogins: 5,
      },
      updatedAt: nowIso,
    });

    this.tenants.set(HYD_TENANT_ID, {
      id: HYD_TENANT_ID,
      name: 'Buildora Hyderabad Operations',
      legalName: 'Buildora Hyderabad Infra Supply Pvt Ltd',
      slug: 'buildora-hyd',
      city: 'Hyderabad',
      state: 'Telangana',
      gstin: '36AAHCB9911D1Z2',
      pan: 'AAHCB9911D',
      supportEmail: 'hyd-support@buildora.in',
      supportPhone: '+91 40 4455 7070',
      logoUrl: '/logo-buildora.svg',
      websiteUrl: 'https://hyd.buildora.in',
      status: 'ACTIVE',
      bankDetails: {
        bankName: 'ICICI Bank',
        accountHolderName: 'Buildora Hyderabad Infra Supply Pvt Ltd',
        accountNumber: '004205008821',
        ifscCode: 'ICIC0000042',
        branch: 'Gachibowli, Hyderabad',
      },
      paymentConfig: {
        razorpayEnabled: true,
        codEnabled: false,
        codMaxOrderValue: 0,
        settlementCycleDays: 14,
        platformCommissionPercent: 7,
      },
      deliveryConfig: {
        defaultShippingCharge: 249,
        freeShippingThreshold: 10000,
        expressDeliveryFee: 599,
        estimatedDeliveryDays: 2,
      },
      taxConfig: {
        defaultGstRate: 18,
        gstStateCode: '36',
        autoInvoicePrefix: 'HYD-INV-',
      },
      notificationPrefs: {
        emailAlerts: true,
        smsAlerts: false,
        lowStockThreshold: 30,
        dailyDigestTime: '08:30',
      },
      securitySettings: {
        enforce2FA: true,
        sessionTimeoutMinutes: 240,
        maxFailedLogins: 5,
      },
      updatedAt: nowIso,
    });

    const seededAdmins: Array<Omit<CompanyAdminUserRecord, 'passwordHash' | 'permissions'>> = [
      {
        id: 'ca-usr-owner-1',
        tenantId: DEFAULT_TENANT_ID,
        name: 'Vikramaditya Rao',
        email: 'admin@buildora.in',
        phone: '+91 98450 60001',
        role: 'COMPANY_OWNER',
        status: 'ACTIVE',
        department: 'Executive Management',
        lastLoginAt: nowIso,
        createdAt: nowIso,
      },
      {
        id: 'ca-usr-ops-1',
        tenantId: DEFAULT_TENANT_ID,
        name: 'Ananya Deshmukh',
        email: 'ops@buildora.in',
        phone: '+91 98450 60002',
        role: 'OPERATIONS_MANAGER',
        status: 'ACTIVE',
        department: 'Supply Chain & Logistics',
        createdAt: nowIso,
      },
      {
        id: 'ca-usr-cat-1',
        tenantId: DEFAULT_TENANT_ID,
        name: 'Karthik Subramanian',
        email: 'catalog@buildora.in',
        phone: '+91 98450 60003',
        role: 'CATALOG_MANAGER',
        status: 'ACTIVE',
        department: 'Merchandising & Catalog',
        createdAt: nowIso,
      },
      {
        id: 'ca-usr-inv-1',
        tenantId: DEFAULT_TENANT_ID,
        name: 'Meghana Kulkarni',
        email: 'inventory@buildora.in',
        phone: '+91 98450 60004',
        role: 'INVENTORY_MANAGER',
        status: 'ACTIVE',
        department: 'Warehouse & Stock Control',
        createdAt: nowIso,
      },
      {
        id: 'ca-usr-fin-1',
        tenantId: DEFAULT_TENANT_ID,
        name: 'Suresh Pai',
        email: 'finance@buildora.in',
        phone: '+91 98450 60005',
        role: 'FINANCE_MANAGER',
        status: 'ACTIVE',
        department: 'Finance & Settlements',
        createdAt: nowIso,
      },
      {
        id: 'ca-usr-sup-1',
        tenantId: DEFAULT_TENANT_ID,
        name: 'Divya Menon',
        email: 'support@buildora.in',
        phone: '+91 98450 60006',
        role: 'SUPPORT_MANAGER',
        status: 'ACTIVE',
        department: 'Customer Care',
        createdAt: nowIso,
      },
      {
        id: 'ca-usr-hyd-owner',
        tenantId: HYD_TENANT_ID,
        name: 'Raghavendra Reddy',
        email: 'hyd-admin@buildora.in',
        phone: '+91 98490 70001',
        role: 'COMPANY_OWNER',
        status: 'ACTIVE',
        department: 'Hyderabad Executive',
        createdAt: nowIso,
      },
    ];

    for (const u of seededAdmins) {
      this.adminUsers.set(u.id, {
        ...u,
        passwordHash: defaultPwdHash,
        permissions: [...COMPANY_ADMIN_PERMISSION_MATRIX[u.role]],
      });
    }

    if (!vendorRecords.has('vnd-hyd-01')) {
      vendorRecords.set('vnd-hyd-01', {
        id: 'vnd-hyd-01',
        tenantId: HYD_TENANT_ID,
        status: 'PENDING_VERIFICATION',
        storeName: 'Deccan Steel & Cement Co',
        name: 'Deccan Steel & Cement Co',
        email: 'vendor@deccansteel.in',
        phone: '+91 98490 11223',
        rating: 4.5,
        productCount: 1,
        orderCount: 14,
        businessInfo: {
          businessName: 'Deccan Steel & Cement Private Limited',
          storeName: 'Deccan Steel & Cement Co',
          contactPerson: 'Muralidhar Rao',
          email: 'vendor@deccansteel.in',
          phone: '+91 98490 11223',
          businessType: 'PRIVATE_LIMITED',
          gstin: '36AABCD1122E1Z5',
          pan: 'AABCD1122E',
          address: {
            building: 'Plot 88',
            street: 'Financial District',
            area: 'Gachibowli',
            city: 'Hyderabad',
            state: 'Telangana',
            pincode: '500032',
          },
          bankDetails: {
            accountHolderName: 'Deccan Steel & Cement Co',
            bankName: 'SBI',
            accountNumber: 'XXXXXX3311',
            ifsc: 'SBIN0020111',
            branch: 'Gachibowli',
            isVerified: true,
          },
          categories: ['cement', 'tmt-steel'],
        },
        kycDocuments: [],
        fulfillmentRate: 92,
        onTimeDispatchRate: 90,
        commissionRate: 6,
        createdAt: nowIso,
        updatedAt: nowIso,
      } as any);
    }

    if (!vendorRecords.has('vnd-blr-pending-01')) {
      vendorRecords.set('vnd-blr-pending-01', {
        id: 'vnd-blr-pending-01',
        tenantId: DEFAULT_TENANT_ID,
        status: 'PENDING_VERIFICATION',
        storeName: 'Nandi Eco Bricks & Blocks',
        name: 'Nandi Eco Bricks & Blocks',
        email: 'accounts@nandiecobricks.in',
        phone: '+91 99001 44556',
        rating: 0,
        productCount: 0,
        orderCount: 0,
        businessInfo: {
          businessName: 'Nandi Eco Building Solutions LLP',
          storeName: 'Nandi Eco Bricks & Blocks',
          contactPerson: 'Suresh Gowda',
          email: 'accounts@nandiecobricks.in',
          phone: '+91 99001 44556',
          businessType: 'LLP',
          gstin: '29AABFN8821K1Z4',
          pan: 'AABFN8821K',
          address: {
            building: 'Sy No 42',
            street: 'Yelahanka Industrial Area',
            area: 'Yelahanka',
            city: 'Bengaluru',
            state: 'Karnataka',
            pincode: '560064',
          },
          bankDetails: {
            accountHolderName: 'Nandi Eco Building Solutions LLP',
            bankName: 'HDFC Bank',
            accountNumber: '502000778811',
            ifsc: 'HDFC0001822',
            branch: 'Yelahanka',
            isVerified: false,
          },
          categories: ['bricks-blocks', 'aggregates-sand'],
        },
        kycDocuments: [
          {
            id: 'doc-nandi-gst',
            type: 'GST_CERTIFICATE',
            title: 'GST Registration Certificate',
            fileName: 'nandi_gst_2026.pdf',
            fileSize: 245000,
            mimeType: 'application/pdf',
            fileUrl: '/uploads/nandi_gst_2026.pdf',
            uploadedAt: nowIso,
            verificationStatus: 'PENDING',
          },
          {
            id: 'doc-nandi-pan',
            type: 'PAN_CARD',
            title: 'Company PAN Card',
            fileName: 'nandi_pan.pdf',
            fileSize: 180000,
            mimeType: 'application/pdf',
            fileUrl: '/uploads/nandi_pan.pdf',
            uploadedAt: nowIso,
            verificationStatus: 'PENDING',
          },
          {
            id: 'doc-nandi-bank',
            type: 'CANCELLED_CHEQUE',
            title: 'Cancelled Bank Cheque',
            fileName: 'nandi_hdfc_cheque.jpg',
            fileSize: 310000,
            mimeType: 'image/jpeg',
            fileUrl: '/uploads/nandi_hdfc_cheque.jpg',
            uploadedAt: nowIso,
            verificationStatus: 'PENDING',
          },
        ],
        fulfillmentRate: 100,
        onTimeDispatchRate: 100,
        commissionRate: 5.5,
        createdAt: nowIso,
        updatedAt: nowIso,
      } as any);
    }

    if (!vendorProducts.some((p) => p.id === 'vprod-pending-aac-01')) {
      vendorProducts.push({
        id: 'vprod-pending-aac-01',
        vendorId: DEFAULT_VENDOR_ID,
        tenantId: DEFAULT_TENANT_ID,
        name: 'Biltech AAC Light Weight Block 600x200x150mm',
        slug: 'biltech-aac-block-150mm',
        sku: 'BLD-AAC-150-PEND',
        brand: 'Biltech',
        categoryId: 'cat-bricks',
        categoryName: 'Bricks & Blocks',
        unit: 'Block',
        packSize: '1 Block (150mm)',
        mrp: 78,
        sellingPrice: 69,
        gstRate: 18,
        hsnCode: '68101190',
        stock: 2400,
        reservedStock: 0,
        lowStockThreshold: 200,
        minOrderQty: 50,
        maxOrderQty: 5000,
        isActive: true,
        approvalStatus: 'PENDING_APPROVAL',
        description:
          'Autoclaved Aerated Concrete blocks with superior thermal insulation and faster masonry speed.',
        images: [
          'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=600&q=80',
        ],
        specifications: {
          Dimensions: '600 x 200 x 150 mm',
          CompressiveStrength: '3.5 - 4.0 N/mm2',
          DryDensity: '550 - 650 kg/m3',
        },
        bulkPricing: [
          { minQuantity: 200, discountPercentage: 4, unitPrice: 66 },
          { minQuantity: 1000, discountPercentage: 10, unitPrice: 62 },
        ],
        variants: [],
        createdAt: nowIso,
        updatedAt: nowIso,
      } as any);
    }

    if (!vendorProducts.some((p) => p.id === 'vprod-hyd-01')) {
      vendorProducts.push({
        id: 'vprod-hyd-01',
        vendorId: 'vnd-hyd-01',
        tenantId: HYD_TENANT_ID,
        name: 'Deccan 550D TMT Steel Bar 12mm',
        slug: 'deccan-tmt-12mm-hyd',
        sku: 'HYD-TMT-12',
        brand: 'Deccan Steel',
        categoryId: 'cat-steel',
        categoryName: 'TMT Steel Bars',
        unit: 'Rod',
        packSize: '12 Meter Rod',
        mrp: 690,
        sellingPrice: 645,
        gstRate: 18,
        hsnCode: '72142090',
        stock: 950,
        reservedStock: 40,
        lowStockThreshold: 100,
        minOrderQty: 10,
        maxOrderQty: 2000,
        isActive: true,
        approvalStatus: 'APPROVED',
        description: 'High tensile Fe550D steel rebar for Hyderabad projects.',
        images: [],
        specifications: { Grade: 'Fe 550D' },
        bulkPricing: [],
        variants: [],
        createdAt: nowIso,
        updatedAt: nowIso,
      } as any);
    }

    const quoteSeeds: CompanyQuotationRecord[] = [
      {
        id: 'quote-blr-001',
        tenantId: DEFAULT_TENANT_ID,
        quoteNumber: 'RFQ-BLR-2026-041',
        customerId: 'cust-blr-02',
        customerName: 'Prestige Civil Contractors LLP',
        customerPhone: '+91 98451 22019',
        customerEmail: 'procurement@prestigecivil.in',
        projectName: 'Whitefield G+4 Commercial Shell',
        siteAddress: 'ITPL Main Road, Whitefield, Bengaluru 560066',
        pincode: '560066',
        status: 'QUOTES_RECEIVED',
        items: [
          {
            productId: 'p-1',
            sku: 'BLD-CEM-UT53',
            name: 'UltraTech OPC 53 Grade Cement (50kg)',
            unit: 'Bag',
            quantity: 500,
            targetPrice: 375,
          },
          {
            productId: 'p-2',
            sku: 'BLD-TMT-12',
            name: 'JSW Neosteel Fe550D 12mm TMT Bar',
            unit: 'Rod',
            quantity: 400,
            targetPrice: 635,
          },
        ],
        assignedVendorIds: [DEFAULT_VENDOR_ID],
        vendorQuotes: [
          {
            vendorId: DEFAULT_VENDOR_ID,
            vendorName: 'Apex Building Supplies',
            totalQuotedAmount: 438500,
            deliveryDays: 2,
            notes: 'Unloading crane support included at Whitefield site.',
            status: 'SUBMITTED',
            submittedAt: nowIso,
          },
        ],
        negotiationHistory: [
          {
            id: 'neg-1',
            actor: 'Prestige Civil Contractors LLP',
            role: 'CUSTOMER',
            message: 'Requesting competitive bulk pricing for 500 bags cement & 400 rods.',
            proposedTotal: 441500,
            createdAt: nowIso,
          },
          {
            id: 'neg-2',
            actor: 'Apex Building Supplies',
            role: 'VENDOR',
            message: 'Submitted best bulk rate Rs 4,38,500 inclusive of GST & unloading.',
            proposedTotal: 438500,
            createdAt: nowIso,
          },
        ],
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      {
        id: 'quote-blr-002',
        tenantId: DEFAULT_TENANT_ID,
        quoteNumber: 'RFQ-BLR-2026-042',
        customerId: 'cust-blr-03',
        customerName: 'Sobha Modular Builders',
        customerPhone: '+91 98802 33110',
        customerEmail: 'materials@sobhamodular.in',
        projectName: 'Sarjapur Villa Phase 2',
        siteAddress: 'Sarjapur Road, Bengaluru 560102',
        pincode: '560102',
        status: 'INCOMING',
        items: [
          {
            productId: 'vprod-pending-aac-01',
            sku: 'BLD-AAC-150-PEND',
            name: 'Biltech AAC Block 150mm',
            unit: 'Block',
            quantity: 2000,
            targetPrice: 62,
          },
        ],
        assignedVendorIds: [],
        vendorQuotes: [],
        negotiationHistory: [
          {
            id: 'neg-3',
            actor: 'Sobha Modular Builders',
            role: 'CUSTOMER',
            message: 'Need staggered delivery over 5 days starting Monday.',
            proposedTotal: 124000,
            createdAt: nowIso,
          },
        ],
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      {
        id: 'quote-hyd-001',
        tenantId: HYD_TENANT_ID,
        quoteNumber: 'RFQ-HYD-2026-011',
        customerId: 'cust-hyd-01',
        customerName: 'Cyberabad Infra Builders',
        customerPhone: '+91 98492 99001',
        customerEmail: 'rfq@cyberabadinfra.in',
        projectName: 'Madhapur Tech Park Annex',
        siteAddress: 'HITEC City, Hyderabad 500081',
        pincode: '500081',
        status: 'INCOMING',
        items: [
          {
            productId: 'vprod-hyd-01',
            sku: 'HYD-TMT-12',
            name: 'Deccan 550D TMT Steel Bar 12mm',
            unit: 'Rod',
            quantity: 600,
            targetPrice: 620,
          },
        ],
        assignedVendorIds: [],
        vendorQuotes: [],
        negotiationHistory: [],
        createdAt: nowIso,
        updatedAt: nowIso,
      },
    ];
    for (const q of quoteSeeds) this.quotations.set(q.id, q);

    const contentSeeds: CompanyContentRecord[] = [
      {
        id: 'cnt-banner-1',
        tenantId: DEFAULT_TENANT_ID,
        contentType: 'BANNER',
        title: '60-Minute Site Delivery Across Bengaluru',
        subtitle:
          'Cement, TMT Steel, Electricals & Plumbing dispatched direct from verified warehouses.',
        badge: 'EXPRESS 60-MIN',
        ctaLabel: 'Order Materials Now',
        ctaUrl: '/products',
        imageUrl:
          'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
        position: 1,
        status: 'PUBLISHED',
        draftPayload: {
          headline: '60-Minute Site Delivery Across Bengaluru',
          subheadline:
            'Cement, TMT Steel, Electricals & Plumbing dispatched direct from verified warehouses.',
          themeColor: '#23438F',
        },
        publishedPayload: {
          headline: '60-Minute Site Delivery Across Bengaluru',
          subheadline:
            'Cement, TMT Steel, Electricals & Plumbing dispatched direct from verified warehouses.',
          themeColor: '#23438F',
        },
        updatedBy: 'admin@buildora.in',
        updatedAt: nowIso,
        publishedAt: nowIso,
      },
      {
        id: 'cnt-announce-1',
        tenantId: DEFAULT_TENANT_ID,
        contentType: 'ANNOUNCEMENT',
        title: 'Monsoon Protection Offer: Zero Delivery Fee on Cement Orders Above Rs 15,000',
        subtitle: 'Valid across all Bengaluru South & East zones with promo code BUILD60PRO.',
        badge: 'LIVE PROMO',
        ctaLabel: 'Apply BUILD60PRO',
        ctaUrl: '/deals',
        position: 1,
        status: 'PUBLISHED',
        draftPayload: { couponCode: 'BUILD60PRO', bannerType: 'TOP_BAR' },
        publishedPayload: { couponCode: 'BUILD60PRO', bannerType: 'TOP_BAR' },
        updatedBy: 'catalog@buildora.in',
        updatedAt: nowIso,
        publishedAt: nowIso,
      },
      {
        id: 'cnt-deal-1',
        tenantId: DEFAULT_TENANT_ID,
        contentType: 'DEAL',
        title: 'Steel & Cement Contractor Super Saver',
        subtitle: 'Up to 12% extra volume discount on combined Cement + TMT Steel dispatches.',
        badge: 'SAVE 12%',
        ctaLabel: 'View Bulk Deals',
        ctaUrl: '/bulk-quote',
        position: 2,
        status: 'DRAFT',
        draftPayload: { discountPercent: 12, minOrderValue: 75000 },
        updatedBy: 'catalog@buildora.in',
        updatedAt: nowIso,
      },
      {
        id: 'cnt-hyd-1',
        tenantId: HYD_TENANT_ID,
        contentType: 'BANNER',
        title: 'Hyderabad Express Construction Supply',
        subtitle: 'Dedicated Gachibowli & HITEC City fulfillment.',
        badge: 'HYD LIVE',
        ctaLabel: 'Browse Catalog',
        ctaUrl: '/products',
        position: 1,
        status: 'PUBLISHED',
        draftPayload: { headline: 'Hyderabad Express Construction Supply' },
        publishedPayload: { headline: 'Hyderabad Express Construction Supply' },
        updatedBy: 'hyd-admin@buildora.in',
        updatedAt: nowIso,
        publishedAt: nowIso,
      },
    ];
    for (const c of contentSeeds) this.contentItems.set(c.id, c);

    const partnerSeeds: CompanyDeliveryPartnerRecord[] = [
      {
        id: 'dp-blr-01',
        tenantId: DEFAULT_TENANT_ID,
        name: 'SwiftHaul Heavy Logistics',
        code: 'SWIFTHAUL',
        contactPerson: 'Mahesh Gowda',
        phone: '+91 98860 55112',
        vehicleTypes: ['Tata Ace', 'Eicher 14ft', 'Flatbed 10T'],
        servicePincodes: ['560001', '560034', '560038', '560066', '560102'],
        activeDeliveries: 6,
        completedDeliveries: 412,
        onTimeRate: 96.4,
        status: 'ACTIVE',
        baseCharge: 199,
        perKmCharge: 18,
        createdAt: nowIso,
      },
      {
        id: 'dp-blr-02',
        tenantId: DEFAULT_TENANT_ID,
        name: 'MetroBuild 60-Min Fleet',
        code: 'METRO60',
        contactPerson: 'Prakash Shetty',
        phone: '+91 99020 77889',
        vehicleTypes: ['EV 3-Wheeler', 'Bolero Pickup'],
        servicePincodes: ['560034', '560064', '560092', '560103'],
        activeDeliveries: 4,
        completedDeliveries: 289,
        onTimeRate: 98.1,
        status: 'ACTIVE',
        baseCharge: 149,
        perKmCharge: 15,
        createdAt: nowIso,
      },
      {
        id: 'dp-hyd-01',
        tenantId: HYD_TENANT_ID,
        name: 'Telangana Freight Carriers',
        code: 'TFC-HYD',
        contactPerson: 'Srinivas Rao',
        phone: '+91 98490 55441',
        vehicleTypes: ['14ft Truck'],
        servicePincodes: ['500032', '500081'],
        activeDeliveries: 2,
        completedDeliveries: 98,
        onTimeRate: 94.0,
        status: 'ACTIVE',
        baseCharge: 249,
        perKmCharge: 20,
        createdAt: nowIso,
      },
    ];
    for (const dp of partnerSeeds) this.deliveryPartners.set(dp.id, dp);

    const customerSeeds: CompanyCustomerRecord[] = [
      {
        id: 'cust-blr-01',
        tenantId: DEFAULT_TENANT_ID,
        name: 'Arjun Constructions (Rajesh Sharma)',
        email: 'rajesh@arjunconstructions.in',
        phone: '+91 98450 12345',
        customerType: 'CONTRACTOR',
        city: 'Bengaluru',
        pincode: '560034',
        gstin: '29AABCA4412M1Z1',
        status: 'ACTIVE',
        totalOrders: 18,
        totalSpent: 482500,
        walletBalance: 15000,
        lastOrderAt: nowIso,
        createdAt: nowIso,
        recentActivity: [
          'Placed Cement & Steel order ORD-BLR-9012',
          'Topped up Buildora Wallet by Rs 10,000',
        ],
      },
      {
        id: 'cust-blr-02',
        tenantId: DEFAULT_TENANT_ID,
        name: 'Prestige Civil Contractors LLP',
        email: 'procurement@prestigecivil.in',
        phone: '+91 98451 22019',
        customerType: 'BUILDER',
        city: 'Bengaluru',
        pincode: '560066',
        gstin: '29AABCP7781N1Z9',
        status: 'ACTIVE',
        totalOrders: 34,
        totalSpent: 1945000,
        walletBalance: 42500,
        lastOrderAt: nowIso,
        createdAt: nowIso,
        recentActivity: ['Submitted Bulk RFQ RFQ-BLR-2026-041'],
      },
      {
        id: 'cust-blr-03',
        tenantId: DEFAULT_TENANT_ID,
        name: 'Sobha Modular Builders',
        email: 'materials@sobhamodular.in',
        phone: '+91 98802 33110',
        customerType: 'ARCHITECT',
        city: 'Bengaluru',
        pincode: '560102',
        status: 'ACTIVE',
        totalOrders: 9,
        totalSpent: 268000,
        walletBalance: 5000,
        lastOrderAt: nowIso,
        createdAt: nowIso,
        recentActivity: ['Requested AAC blocks bulk quotation'],
      },
      {
        id: 'cust-hyd-01',
        tenantId: HYD_TENANT_ID,
        name: 'Cyberabad Infra Builders',
        email: 'rfq@cyberabadinfra.in',
        phone: '+91 98492 99001',
        customerType: 'BUILDER',
        city: 'Hyderabad',
        pincode: '500081',
        gstin: '36AABCC1122K1Z3',
        status: 'ACTIVE',
        totalOrders: 6,
        totalSpent: 390000,
        walletBalance: 8000,
        lastOrderAt: nowIso,
        createdAt: nowIso,
        recentActivity: ['Submitted Hyderabad steel RFQ'],
      },
    ];
    for (const c of customerSeeds) this.customers.set(c.id, c);

    this.tenantOrders.push({
      id: 'ord-hyd-001',
      orderNumber: 'ORD-HYD-8001',
      tenantId: HYD_TENANT_ID,
      vendorId: 'vnd-hyd-01',
      customerId: 'cust-hyd-01',
      customerName: 'Cyberabad Infra Builders',
      customerPhone: '+91 98492 99001',
      status: 'PROCESSING',
      paymentStatus: 'PAID',
      paymentMethod: 'RAZORPAY',
      totalAmount: 193500,
      deliveryAddress: 'HITEC City, Hyderabad 500081',
      items: [
        {
          productId: 'vprod-hyd-01',
          sku: 'HYD-TMT-12',
          name: 'Deccan 550D TMT Steel Bar 12mm',
          quantity: 300,
          price: 645,
        },
      ],
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    this.attributes.push(
      {
        id: 'attr-grade',
        tenantId: DEFAULT_TENANT_ID,
        name: 'Strength Grade',
        code: 'grade',
        categoryName: 'Cement & Concrete',
        values: ['OPC 53', 'OPC 43', 'PPC', 'PSC'],
        isRequired: true,
        isFilterable: true,
      },
      {
        id: 'attr-diameter',
        tenantId: DEFAULT_TENANT_ID,
        name: 'Bar Diameter',
        code: 'diameter',
        categoryName: 'TMT Steel Bars',
        values: ['8mm', '10mm', '12mm', '16mm', '20mm', '25mm'],
        isRequired: true,
        isFilterable: true,
      },
      {
        id: 'attr-warranty',
        tenantId: DEFAULT_TENANT_ID,
        name: 'Manufacturer Warranty',
        code: 'warranty',
        categoryName: 'Electricals & Wires',
        values: ['1 Year', '2 Years', '5 Years', '10 Years'],
        isRequired: false,
        isFilterable: true,
      }
    );

    this.notificationTemplates.push(
      {
        id: 'tpl-vendor-approved',
        tenantId: DEFAULT_TENANT_ID,
        name: 'Vendor Application Approved',
        channel: 'EMAIL',
        eventKey: 'VENDOR_APPROVED',
        subject: 'Welcome to Buildora 60 — Your Vendor Account is Live',
        body: 'Congratulations {{businessName}}, your KYC and GST verification is complete. You can now publish SKUs and receive orders.',
        isActive: true,
        updatedAt: nowIso,
      },
      {
        id: 'tpl-order-dispatched',
        tenantId: DEFAULT_TENANT_ID,
        name: 'Customer Dispatch Alert',
        channel: 'SMS',
        eventKey: 'ORDER_DISPATCHED',
        subject: 'Order Dispatched',
        body: 'Your Buildora order {{orderNumber}} is out for 60-min delivery with {{partnerName}}. Track live in your portal.',
        isActive: true,
        updatedAt: nowIso,
      },
      {
        id: 'tpl-settlement-paid',
        tenantId: DEFAULT_TENANT_ID,
        name: 'Vendor Settlement UTR Confirmation',
        channel: 'EMAIL',
        eventKey: 'SETTLEMENT_PAID',
        subject: 'Payout Processed — UTR {{utr}}',
        body: 'Net payout of Rs {{netAmount}} has been transferred via NEFT/IMPS (Ref: {{utr}}).',
        isActive: true,
        updatedAt: nowIso,
      }
    );

    this.notificationAlerts.push(
      {
        id: 'alt-1',
        tenantId: DEFAULT_TENANT_ID,
        title: '1 New Vendor Application Pending Verification',
        message: 'Nandi Eco Bricks & Blocks submitted GST, PAN & bank proof for review.',
        type: 'VENDOR',
        severity: 'WARNING',
        isRead: false,
        createdAt: nowIso,
        link: '/vendors?tab=pending',
      },
      {
        id: 'alt-2',
        tenantId: DEFAULT_TENANT_ID,
        title: '1 Product Pending Catalog Approval',
        message: 'Biltech AAC Block 600x200x150mm is awaiting quality & GST verification.',
        type: 'VENDOR',
        severity: 'INFO',
        isRead: false,
        createdAt: nowIso,
        link: '/products?tab=pending',
      },
      {
        id: 'alt-3',
        tenantId: DEFAULT_TENANT_ID,
        title: 'Bulk RFQ Quotes Received (Rs 4,38,500)',
        message: 'Apex Building Supplies submitted a formal quote for Prestige Civil Contractors.',
        type: 'ORDER',
        severity: 'INFO',
        isRead: false,
        createdAt: nowIso,
        link: '/quotations',
      }
    );

    this.auditLogs.push({
      id: 'audit-seed-1',
      tenantId: DEFAULT_TENANT_ID,
      actorId: 'system',
      actorName: 'System Bootstrap',
      actorRole: 'SYSTEM',
      action: 'PORTAL_INITIALIZED',
      module: 'Security',
      entityType: 'CompanyTenant',
      entityId: DEFAULT_TENANT_ID,
      details:
        'Company Admin workspace initialized with multi-tenant RBAC and shared backend stores.',
      ipAddress: '127.0.0.1',
      createdAt: nowIso,
    });
  }

  private async hydrateFromMongo(): Promise<void> {
    if (!companyAdminPersistenceService.isDbConnected()) return;
    try {
      const [tenants, users, quotes, contents, logs, partners, custs] = await Promise.all([
        companyAdminPersistenceService.loadCollection<CompanyTenantRecord>(CompanyTenantModel),
        companyAdminPersistenceService.loadCollection<CompanyAdminUserRecord>(CompanyAdminUserModel),
        companyAdminPersistenceService.loadCollection<CompanyQuotationRecord>(CompanyQuotationModel),
        companyAdminPersistenceService.loadCollection<CompanyContentRecord>(CompanyContentModel),
        companyAdminPersistenceService.loadCollection<CompanyAuditLogRecord>(CompanyAuditLogModel),
        companyAdminPersistenceService.loadCollection<CompanyDeliveryPartnerRecord>(
          CompanyDeliveryPartnerModel
        ),
        companyAdminPersistenceService.loadCollection<CompanyCustomerRecord>(CompanyCustomerModel),
      ]);

      for (const t of tenants) this.tenants.set(t.id, t);
      for (const u of users) this.adminUsers.set(u.id, u);
      for (const q of quotes) this.quotations.set(q.id, q);
      for (const c of contents) this.contentItems.set(c.id, c);
      for (const dp of partners) this.deliveryPartners.set(dp.id, dp);
      for (const c of custs) this.customers.set(c.id, c);
      if (logs.length > 0) {
        this.auditLogs.splice(0, this.auditLogs.length, ...logs.slice(-500));
      }
      this.logger.log('Company Admin collections hydrated from MongoDB.');
    } catch (err: any) {
      this.logger.warn(`Mongo hydration skipped: ${err.message}`);
    }
  }

  normalizeVendor(v: any) {
    const biz = v.businessInfo || v.business || {};
    const addr = biz.address || {};
    const status = String(v.status || v.approvalStatus || 'PENDING_VERIFICATION').toUpperCase();
    const docs = Array.isArray(v.kycDocuments)
      ? v.kycDocuments
      : Array.isArray(v.documents)
        ? v.documents
        : [];
    return {
      ...v,
      id: v.id,
      tenantId: v.tenantId || DEFAULT_TENANT_ID,
      businessName: biz.businessName || v.storeName || v.name || 'Vendor',
      storeName: v.storeName || biz.storeName || biz.businessName || v.name || 'Vendor',
      contactPerson: biz.contactPerson || v.name || '',
      email: v.email || biz.email || '',
      phone: v.phone || biz.phone || '',
      gstin: biz.gstin || v.gstin || '',
      pan: biz.pan || v.pan || '',
      vendorType: biz.businessType || 'DISTRIBUTOR',
      city: addr.city || v.city || 'Bengaluru',
      state: addr.state || v.state || 'Karnataka',
      pincode: addr.pincode || v.pincode || '',
      approvalStatus: status,
      isActive: status === 'APPROVED' || status === 'ACTIVE',
      documents: docs.map((d: any) => ({
        ...d,
        status: d.verificationStatus || d.status || 'PENDING',
      })),
      bankAccount: biz.bankDetails || v.bankAccount || null,
      fulfillmentRate: v.fulfillmentRate ?? 96,
      onTimeDispatchRate: v.onTimeDispatchRate ?? 95,
      commissionRate: v.commissionRate ?? 6,
      rating: v.rating ?? 4.5,
    };
  }

  recordAuditLog(entry: Omit<CompanyAuditLogRecord, 'id' | 'createdAt'>): CompanyAuditLogRecord {
    const record: CompanyAuditLogRecord = {
      id: `audit-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      createdAt: new Date().toISOString(),
      ...entry,
    };
    this.auditLogs.unshift(record);
    if (this.auditLogs.length > 1000) this.auditLogs.length = 1000;
    void companyAdminPersistenceService.upsert(CompanyAuditLogModel, record);
    return record;
  }

  getTenantVendors(tenantId: string) {
    return Array.from(vendorRecords.values())
      .filter((v) => (v.tenantId || DEFAULT_TENANT_ID) === tenantId)
      .map((v) => this.normalizeVendor(v));
  }

  getTenantProducts(tenantId: string) {
    const tenantVendors = this.getTenantVendors(tenantId);
    const tenantVendorIds = new Set(tenantVendors.map((v) => v.id));
    const vendorNameMap = new Map(tenantVendors.map((v) => [v.id, v.businessName]));
    const merged: any[] = [];
    const seenIds = new Set<string>();

    for (const vp of vendorProducts) {
      const anyVp = vp as any;
      const vpTenant = anyVp.tenantId || DEFAULT_TENANT_ID;
      if (vpTenant === tenantId || tenantVendorIds.has(vp.vendorId)) {
        const custProd = dbStore.products.find((cp) => cp.id === vp.id || cp.sku === vp.sku) as any;
        merged.push({
          ...vp,
          tenantId: vpTenant,
          vendorName: vendorNameMap.get(vp.vendorId) || 'Apex Building Supplies',
          isVisibleOnStorefront: custProd ? custProd.inStock !== false && vp.isActive : false,
        });
        seenIds.add(vp.id);
      }
    }

    if (tenantId === DEFAULT_TENANT_ID) {
      for (const cp of dbStore.products) {
        const anyCp = cp as any;
        if (seenIds.has(cp.id) || merged.some((m) => m.sku === cp.sku)) continue;
        merged.push({
          id: cp.id,
          vendorId: anyCp.vendorId || DEFAULT_VENDOR_ID,
          tenantId: DEFAULT_TENANT_ID,
          vendorName: anyCp.vendorName || 'Apex Building Supplies',
          name: cp.name,
          slug: cp.slug,
          sku: cp.sku,
          brand: cp.brand || 'Buildora',
          categoryId: cp.categorySlug || 'cat-cement',
          categoryName: cp.category || 'Building Materials',
          unit: cp.unit || 'Unit',
          packSize: cp.packSize || 'Standard',
          mrp: cp.mrp,
          sellingPrice: cp.price,
          gstRate: cp.gstRate || 18,
          stock: cp.stockCount ?? 0,
          reservedStock: 0,
          lowStockThreshold: 25,
          isActive: anyCp.isActive !== false && cp.inStock !== false,
          approvalStatus: anyCp.approvalStatus || 'APPROVED',
          isVisibleOnStorefront: anyCp.isActive !== false && cp.inStock !== false,
          images: cp.images || [],
          specifications: cp.specifications || {},
          bulkPricing: cp.bulkPricing || [],
          variants: cp.variants || [],
          createdAt: anyCp.createdAt || new Date().toISOString(),
          updatedAt: anyCp.updatedAt || new Date().toISOString(),
        });
      }
    }

    return merged;
  }

  getTenantOrders(tenantId: string) {
    const results: any[] = [];
    const seen = new Set<string>();

    if (tenantId === DEFAULT_TENANT_ID) {
      for (const ord of dbStore.orders) {
        const anyOrd = ord as any;
        const addr = ord.deliveryAddress as any;
        const assignment = this.dispatchAssignments.get(ord.id);
        const mapped = {
          ...ord,
          tenantId: DEFAULT_TENANT_ID,
          totalAmount: anyOrd.totalAmount ?? ord.grandTotal ?? 0,
          customerName: anyOrd.customerName || addr?.recipientName || 'Customer',
          customerPhone: anyOrd.customerPhone || addr?.mobile || '',
          deliveryAddress:
            typeof addr === 'string'
              ? addr
              : [addr?.building, addr?.street, addr?.area, addr?.city, addr?.pincode]
                  .filter(Boolean)
                  .join(', '),
          dispatchInfo: assignment || null,
        };
        results.push(mapped);
        seen.add(ord.id);
      }

      for (const vo of vendorOrders) {
        if (seen.has(vo.id) || results.some((r) => r.orderNumber === vo.orderNumber)) continue;
        const assignment = this.dispatchAssignments.get(vo.id);
        results.push({
          ...vo,
          tenantId: DEFAULT_TENANT_ID,
          dispatchInfo: assignment || null,
        });
        seen.add(vo.id);
      }
    }

    for (const extra of this.tenantOrders) {
      if (extra.tenantId === tenantId && !seen.has(extra.id)) {
        results.push({
          ...extra,
          dispatchInfo: this.dispatchAssignments.get(extra.id) || null,
        });
      }
    }

    return results.sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  getTenantSettlements(tenantId: string) {
    const vendors = this.getTenantVendors(tenantId);
    const tenantVendorIds = new Set(vendors.map((v) => v.id));
    const vendorMap = new Map(vendors.map((v) => [v.id, v.businessName]));
    return vendorSettlements
      .filter((s) => tenantVendorIds.has(s.vendorId))
      .map((s) => ({
        ...s,
        tenantId,
        vendorName: vendorMap.get(s.vendorId) || 'Vendor',
      }));
  }

  getTenantReturns(tenantId: string) {
    const vendors = this.getTenantVendors(tenantId);
    const tenantVendorIds = new Set(vendors.map((v) => v.id));
    const vendorMap = new Map(vendors.map((v) => [v.id, v.businessName]));
    return vendorReturns
      .filter((r) => tenantVendorIds.has(r.vendorId))
      .map((r) => ({
        ...r,
        tenantId,
        vendorName: vendorMap.get(r.vendorId) || 'Vendor',
      }));
  }

  getTenantWarehouses(tenantId: string) {
    const tenantVendorIds = new Set(this.getTenantVendors(tenantId).map((v) => v.id));
    return vendorWarehouses
      .map((w: any) => ({ ...w, vendorId: w.vendorId || DEFAULT_VENDOR_ID }))
      .filter((w) => tenantVendorIds.has(w.vendorId));
  }

  getTenantStockMovements(tenantId: string) {
    const tenantVendorIds = new Set(this.getTenantVendors(tenantId).map((v) => v.id));
    return vendorStockMovements
      .map((m: any) => ({ ...m, vendorId: m.vendorId || DEFAULT_VENDOR_ID }))
      .filter((m) => tenantVendorIds.has(m.vendorId));
  }

  getTenantInvoices(tenantId: string) {
    const tenantVendorIds = new Set(this.getTenantVendors(tenantId).map((v) => v.id));
    return vendorInvoices.filter((inv) => tenantVendorIds.has(inv.vendorId));
  }

  getTenantReviews(tenantId: string) {
    const tenantVendorIds = new Set(this.getTenantVendors(tenantId).map((v) => v.id));
    return vendorReviews
      .map((r: any) => ({ ...r, vendorId: r.vendorId || DEFAULT_VENDOR_ID }))
      .filter((r) => tenantVendorIds.has(r.vendorId));
  }

  getTenantSupportTickets(tenantId: string) {
    const list: any[] = [];
    if (tenantId === DEFAULT_TENANT_ID) {
      const vendors = this.getTenantVendors(tenantId);
      const vendorMap = new Map(vendors.map((v) => [v.id, v.businessName]));
      for (const t of dbStore.tickets) {
        list.push({ ...t, source: 'CUSTOMER', tenantId });
      }
      for (const vt of vendorSupportTickets) {
        list.push({
          ...vt,
          source: 'VENDOR',
          tenantId,
          vendorName: vendorMap.get(vt.vendorId) || 'Vendor',
        });
      }
    }
    return list;
  }

  getTenantPromotions(tenantId: string) {
    const tenantVendorIds = new Set(this.getTenantVendors(tenantId).map((v) => v.id));
    return {
      coupons: tenantId === DEFAULT_TENANT_ID ? dbStore.coupons : [],
      promotions: vendorPromotions.filter((p) => tenantVendorIds.has(p.vendorId)),
    };
  }

  getPublishedStorefrontContent(tenantId: string) {
    const items = Array.from(this.contentItems.values())
      .filter((c) => c.tenantId === tenantId && c.status === 'PUBLISHED')
      .sort((a, b) => a.position - b.position);

    return {
      tenantId,
      banners: items.filter((i) => i.contentType === 'BANNER'),
      announcements: items.filter((i) => i.contentType === 'ANNOUNCEMENT'),
      sections: items.filter((i) => i.contentType === 'HOMEPAGE_SECTION'),
      deals: items.filter((i) => i.contentType === 'DEAL'),
      newLaunches: items.filter((i) => i.contentType === 'NEW_LAUNCH'),
      categoryNav: items.filter((i) => i.contentType === 'CATEGORY_NAV'),
      updatedAt: new Date().toISOString(),
    };
  }

  syncCustomerPortalProduct(vp: any): void {
    const cleanId = String(vp.id || '').replace(/^vp-/, '');
    const idx = dbStore.products.findIndex(
      (p) => p.id === vp.id || p.id === cleanId || p.sku === vp.sku
    );
    const vendor = vp.vendorId ? vendorRecords.get(vp.vendorId) : undefined;
    const vendorActive = !vendor || vendor.status === 'APPROVED' || (vendor.status as string) === 'ACTIVE';
    const shouldShow =
      vp.approvalStatus === 'APPROVED' &&
      vp.isActive !== false &&
      vp.isSuspended !== true &&
      vendorActive;

    if (!shouldShow) {
      if (idx >= 0) {
        const existing = dbStore.products[idx] as any;
        existing.inStock = false;
        existing.isActive = false;
        existing.isSuspended = Boolean(vp.isSuspended);
        existing.approvalStatus = vp.approvalStatus || 'PENDING_APPROVAL';
      }
      return;
    }

    const sellingPrice = vp.sellingPrice ?? vp.price ?? 0;
    const stockCount = vp.stock ?? vp.stockCount ?? 0;
    const reservedStock = vp.reservedStock ?? 0;
    const mrp = vp.mrp || sellingPrice;

    const mapped: any = {
      id: idx >= 0 ? dbStore.products[idx].id : cleanId || vp.id,
      name: vp.name,
      slug: vp.slug || vp.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      sku: vp.sku,
      brand: vp.brand || 'Buildora Verified',
      brandSlug: (vp.brand || 'buildora').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category: vp.category || vp.categoryName || 'Building Materials',
      categorySlug: vp.categorySlug || vp.categoryId || 'cement-concrete',
      subcategory: vp.subcategory || vp.categoryName || 'General',
      subcategorySlug: vp.subcategorySlug || vp.categoryId || 'general',
      description: vp.description || '',
      unit: vp.unit || 'Unit',
      packSize: vp.packSize || 'Standard',
      mrp,
      price: sellingPrice,
      discount: mrp > sellingPrice ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0,
      gstRate: vp.gstRate ?? 18,
      stockCount,
      reservedStock,
      inStock: Math.max(0, stockCount - reservedStock) > 0,
      rating: vp.rating ?? 4.6,
      reviewCount: vp.reviewCount ?? 0,
      isBulkEligible: vp.isBulkEligible ?? true,
      vendorId: vp.vendorId,
      vendorName: vendor?.storeName || vendor?.businessInfo?.businessName || 'Buildora Verified Supplier',
      isActive: true,
      isSuspended: false,
      approvalStatus: 'APPROVED',
      images: vp.images || [],
      specifications: vp.specifications || {},
      bulkPricing: vp.bulkPricing || [],
      variants: vp.variants || [],
      deliverySpeedAvailable: vp.deliverySpeedAvailable || ['ASAP_60', 'EXPRESS_90', 'SCHEDULED'],
      updatedAt: new Date().toISOString(),
    };

    if (idx >= 0) {
      dbStore.products[idx] = { ...dbStore.products[idx], ...mapped };
    } else {
      dbStore.products.push(mapped);
    }
  }
}

export const companyAdminDataService = new CompanyAdminDataService();
