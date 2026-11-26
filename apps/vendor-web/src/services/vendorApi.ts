import {
  VendorProfile,
  VendorProduct,
  VendorOrder,
  VendorSettlement,
  VendorNotification,
  VendorDashboardMetrics,
  BulkPriceTier,
  BulkPricingTier,
  VendorStockMovement,
  VendorReturnRequest,
  VendorPromotion,
  VendorProductReview,
  VendorInvoice,
  VendorSupportTicket,
  VendorEmployee,
  VendorWarehouse,
  CategoryFieldSchema,
} from '@buildora/types';
import {
  SEED_PRODUCTS,
  MASTER_CATEGORIES,
  BENGALURU_WAREHOUSES,
  getDefaultFieldSchemasForCategory,
} from '@buildora/constants';
import { VENDOR_APP_CONFIG } from '../config';
import {
  apiRequest,
  clearVendorSessionTokens,
  mapFriendlyApiError,
  saveVendorSessionTokens,
  warmupBackend,
} from './apiClient';

const API_BASE_URL = VENDOR_APP_CONFIG.apiBaseUrl;

// Initial local fallback data to guarantee 100% operational UI even if backend daemon is restarting
let localVendor: VendorProfile = {
  id: 'vnd-apex-01',
  tenantId: 'tenant-buildora-blr',
  status: 'ACTIVE',
  rating: 4.8,
  productCount: 12,
  orderCount: 48,
  createdAt: '2026-01-10T09:00:00.000Z',
  updatedAt: new Date().toISOString(),
  storeName: 'Supreme Materials BLR',
  name: 'Arjun Rao',
  email: 'vendor@buildora.in',
  phone: '+91 98450 12345',
  categories: ['Cement & Concrete', 'Steel & Structural Metals', 'Plumbing & Sanitary'],
  business: {
    legalName: 'Supreme Building Materials Private Limited',
    tradeName: 'Supreme Materials BLR',
    gstin: '29AABCB9876F1Z2',
    pan: 'AABCB9876F',
    address: {
      street: '12, 1st Cross, Peenya Industrial Area',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560058',
    },
  },
  bankDetails: {
    beneficiaryName: 'Supreme Materials BLR',
    accountHolderName: 'Supreme Materials BLR',
    bankName: 'HDFC Bank',
    accountNumber: '50200049182341',
    ifscCode: 'HDFC0000053',
    ifsc: 'HDFC0000053',
    branch: 'Peenya Industrial Branch, Bengaluru',
    isVerified: true,
  },
  businessInfo: {
    businessName: 'Supreme Building Materials Private Limited',
    contactPerson: 'Arjun Rao',
    phone: '+91 98450 12345',
    email: 'vendor@buildora.in',
    businessType: 'PRIVATE_LIMITED',
    description:
      'Premier authorized distributor of tier-1 cement, plumbing fittings, and architectural hardware across Karnataka.',
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
      lng: 77.5195,
    },
    bankDetails: {
      accountHolderName: 'Supreme Materials BLR',
      bankName: 'HDFC Bank',
      accountNumber: '50200049182341',
      ifsc: 'HDFC0000053',
      branch: 'Peenya Industrial Branch, Bengaluru',
      isVerified: true,
    },
    categories: ['cement-concrete', 'tiling-tile-adhesives', 'cpvc-pipes-fittings'],
    storeName: 'Supreme Materials BLR',
    storeDescription: 'Direct plant certified building materials with guaranteed batch test certificates.',
    warehouseAddress: 'Plot 88, Peenya 2nd Stage, Bengaluru, Karnataka 560058',
    pickupPincode: '560058',
    assignedDarkStoreId: 'WH-BLR-04',
    dispatchCutoff: '18:00',
    preparationTimeMins: 30,
  },
};

let localProducts: VendorProduct[] = SEED_PRODUCTS.slice(0, 12).map((p, idx) => ({
  id: `vp-${p.id}`,
  vendorId: 'vnd-apex-01',
  tenantId: 'tenant-buildora-blr',
  name: p.name,
  slug: p.slug,
  sku: p.sku,
  brand: p.brand,
  brandSlug: p.brandSlug,
  category: p.category,
  categorySlug: p.categorySlug,
  subcategory: p.subcategory,
  subcategorySlug: p.subcategorySlug,
  subCategory: p.subcategory,
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
  stock: p.stockCount || 150,
  lowStockThreshold: 30,
  isBulkEligible: p.isBulkEligible,
  bulkPricing: p.bulkPricing || [
    { minQuantity: 10, discountPercentage: 5, unitPrice: Math.round(p.price * 0.95) },
    { minQuantity: 30, discountPercentage: 8, unitPrice: Math.round(p.price * 0.92) },
    { minQuantity: 60, discountPercentage: 12, unitPrice: Math.round(p.price * 0.88) },
  ],
  variants: p.variants,
  specifications: p.specifications || {},
  deliverySpeedAvailable: p.deliverySpeedAvailable,
  approvalStatus: idx === 11 ? 'PENDING_APPROVAL' : 'APPROVED',
  isActive: true,
  status: p.inStock ? 'ACTIVE' : 'OUT_OF_STOCK',
  warehouseLocation: 'WH-BLR-04 Peenya Hub',
  createdAt: '2026-01-15T09:00:00.000Z',
  updatedAt: new Date().toISOString(),
}));

let localOrders: VendorOrder[] = [
  {
    id: 'vo-1001',
    orderNumber: 'ORD-BLR-2026-0891',
    customerOrderId: 'co-891',
    vendorId: 'vnd-apex-01',
    tenantId: 'tenant-buildora-blr',
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    status: 'NEW',
    customerName: 'Suresh Gowda (Gowda Constructions)',
    customerPhone: '+91 98451 22334',
    totalAmount: 38750,
    items: [
      {
        productId: 'p-cement-01',
        sku: 'CEN-B1R-WHT-50KG',
        name: 'UltraTech Super Cement OPC 53 Grade',
        image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=300&q=80',
        unitPrice: 380,
        quantity: 100,
        gstAmount: 7600,
        totalAmount: 38000,
        commissionRate: 0.08,
        commissionAmount: 3040,
        netPayout: 34960,
      },
    ],
    subtotal: 38000,
    gstTotal: 7600,
    commissionTotal: 3040,
    netPayout: 34960,
    deliveryOption: 'ASAP_60',
    deliveryAddress: {
      id: 'addr-1',
      recipientName: 'Suresh Gowda',
      mobile: '9845122334',
      type: 'CONSTRUCTION_SITE',
      building: 'Site #42',
      street: 'Outer Ring Road, Near Nagarabhavi',
      area: 'Nagarabhavi',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560072',
      isDefault: true,
    },
    timeline: [
      {
        status: 'NEW',
        title: 'Order Placed by Contractor',
        description: 'Assigned to WH-BLR-04 for 60-min express fulfillment',
        timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      },
    ],
  },
  {
    id: 'vo-1002',
    orderNumber: 'ORD-BLR-2026-0892',
    customerOrderId: 'co-892',
    vendorId: 'vnd-apex-01',
    tenantId: 'tenant-buildora-blr',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    status: 'ACCEPTED',
    customerName: 'Kavitha Reddy (Apex Builders)',
    customerPhone: '+91 99887 76655',
    totalAmount: 18400,
    items: [
      {
        productId: 'p-elec-01',
        sku: 'ELE-HAV-S3-2.5MM',
        name: 'Havells Life Line Plus S3 FRLS Wire (2.5 sq mm)',
        image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=300&q=80',
        unitPrice: 2680,
        quantity: 6,
        gstAmount: 2894,
        totalAmount: 16080,
        commissionRate: 0.08,
        commissionAmount: 1286,
        netPayout: 14794,
      },
    ],
    subtotal: 16080,
    gstTotal: 2894,
    commissionTotal: 1286,
    netPayout: 14794,
    deliveryOption: 'ASAP_60',
    deliveryAddress: {
      id: 'addr-2',
      recipientName: 'Kavitha Reddy',
      mobile: '9988776655',
      type: 'WORK',
      building: 'Plot 104',
      street: '2nd Main, Nagarabhavi 2nd Stage',
      area: 'Nagarabhavi',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560072',
      isDefault: false,
    },
    timeline: [
      {
        status: 'NEW',
        title: 'Order Placed',
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      },
      {
        status: 'ACCEPTED',
        title: 'Vendor Confirmed Order',
        description: 'Packing slip generated',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      },
    ],
  },
  {
    id: 'vo-1003',
    orderNumber: 'ORD-BLR-2026-0888',
    customerOrderId: 'co-888',
    vendorId: 'vnd-apex-01',
    tenantId: 'tenant-buildora-blr',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    status: 'DELIVERED',
    customerName: 'Vinay Kumar',
    customerPhone: '+91 97410 98765',
    totalAmount: 2680,
    items: [
      {
        productId: 'p-plumb-01',
        sku: 'PLM-AST-CPVC-1IN',
        name: 'Astral CPVC Pro Pipes Class-1 (1 inch, 3m)',
        image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=300&q=80',
        unitPrice: 420,
        quantity: 5,
        gstAmount: 378,
        totalAmount: 2100,
        commissionRate: 0.08,
        commissionAmount: 168,
        netPayout: 1932,
      },
    ],
    subtotal: 2100,
    gstTotal: 378,
    commissionTotal: 168,
    netPayout: 1932,
    deliveryOption: 'ASAP_60',
    deliveryAddress: {
      id: 'addr-3',
      recipientName: 'Vinay Kumar',
      mobile: '9741098765',
      type: 'HOME',
      building: 'B-402',
      street: 'Sobha Morzaria Grandeur, Bannerghatta Road',
      area: 'Bannerghatta Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560076',
      isDefault: false,
    },
    timeline: [
      {
        status: 'DELIVERED',
        title: 'Delivered in 42 Mins',
        timestamp: new Date(Date.now() - 1000 * 60 * 78).toISOString(),
      },
    ],
  },
];

let localSettlements: VendorSettlement[] = [
  {
    id: 'set-2026-w07',
    settlementNumber: 'SET-BLR-2026-W07',
    vendorId: 'vnd-apex-01',
    period: '09 Feb 2026 - 15 Feb 2026',
    periodStart: '09 Feb 2026',
    periodEnd: '15 Feb 2026',
    orderCount: 22,
    grossRevenue: 184500,
    grossAmount: 184500,
    platformCommission: 14760,
    commission: 14760,
    taxDeductions: 1845,
    deductions: 1845,
    netPayable: 167895,
    netAmount: 167895,
    status: 'PAID',
    paidAt: '2026-02-18T11:30:00.000Z',
    paymentReference: 'UTR-HDFC-992819284',
    utr: 'UTR-HDFC-992819284',
    createdAt: '2026-02-16T00:00:00.000Z',
  },
  {
    id: 'set-2026-w08',
    settlementNumber: 'SET-BLR-2026-W08',
    vendorId: 'vnd-apex-01',
    period: '16 Feb 2026 - 22 Feb 2026',
    periodStart: '16 Feb 2026',
    periodEnd: '22 Feb 2026',
    orderCount: 19,
    grossRevenue: 128000,
    grossAmount: 128000,
    platformCommission: 10240,
    commission: 10240,
    taxDeductions: 1280,
    deductions: 1280,
    netPayable: 116480,
    netAmount: 116480,
    status: 'PROCESSING',
    utr: 'Scheduled for Friday',
    createdAt: '2026-02-23T00:00:00.000Z',
  },
];

let localNotifications: VendorNotification[] = [
  {
    id: 'notif-1',
    vendorId: 'vnd-apex-01',
    type: 'ORDER',
    title: 'New 60-Min Express Order Received',
    message: 'Contractor order ORD-BLR-2026-0891 (₹38,750) assigned to WH-BLR-04 Peenya Hub.',
    read: false,
    actionUrl: '/orders',
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
  },
  {
    id: 'notif-2',
    vendorId: 'vnd-apex-01',
    type: 'STOCK',
    title: 'Low Stock Alert: UltraTech Cement 50kg',
    message: 'Stock level reached 35 units at WH-BLR-04. Please dispatch a replenishment batch.',
    read: false,
    actionUrl: '/inventory',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: 'notif-3',
    vendorId: 'vnd-apex-01',
    type: 'SETTLEMENT',
    title: 'Weekly Payout of ₹1,67,895 Credited',
    message: 'Settlement cycle SET-BLR-2026-W07 processed successfully to HDFC Bank.',
    read: true,
    actionUrl: '/earnings',
    createdAt: '2026-02-18T11:35:00.000Z',
  },
];

function getAuthHeaders(): Record<string, string> {
  try {
    const token = localStorage.getItem('buildora_vendor_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

async function request<T>(path: string, options: RequestInit = {}, _fallbackData?: T): Promise<T> {
  const { body, headers, method, ...rest } = options;
  let parsedBody: unknown = body;
  if (typeof body === 'string') {
    try {
      parsedBody = JSON.parse(body);
    } catch {
      parsedBody = body;
    }
  }

  const res = await apiRequest<any>(path, {
    ...rest,
    method: method || 'GET',
    headers: headers as Record<string, string> | undefined,
    body: parsedBody,
  });

  if (res && typeof res === 'object' && res.data !== undefined) {
    return res.data as T;
  }
  return res as T;
}

function broadcastProductChange(_prod: any) {
  // Handled server-side via NestJS -> MongoDB/Storefront & Socket.IO /realtime
}

export const vendorApi = {
  getStoredProfile(): VendorProfile | null {
    try {
      const raw = localStorage.getItem('buildora_vendor_profile');
      return raw ? (JSON.parse(raw) as VendorProfile) : null;
    } catch {
      return null;
    }
  },

  logout(): void {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('buildora_vendor_token') : null;
    clearVendorSessionTokens();
    if (token) {
      void apiRequest('/vendor/auth/logout', {
        method: 'POST',
        includeAuth: false,
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  },

  async register(_payload: { storeName: string; email: string; phone: string }): Promise<{ token: string; vendor: VendorProfile }> {
    throw new Error('Please use the multi-step vendor registration wizard.');
  },

  // ==========================================
  // AUTHENTICATION & SECURITY
  // ==========================================

  warmupBackend() {
    warmupBackend();
  },

  async sendOtp(identifier: string, type: 'REGISTRATION_EMAIL' | 'REGISTRATION_MOBILE' | 'LOGIN' | 'PASSWORD_RESET') {
    const fallbackMsg =
      type === 'REGISTRATION_EMAIL'
        ? 'Unable to send verification code. Please try again.'
        : type === 'REGISTRATION_MOBILE'
        ? 'Unable to send OTP to this mobile number.'
        : 'Unable to send verification code. Please try again.';

    return apiRequest('/vendor/auth/send-otp', {
      method: 'POST',
      includeAuth: false,
      retryOnTransient: true,
      body: { identifier, type },
      fallbackErrorMessage: fallbackMsg
    });
  },

  async verifyOtp(identifier: string, type: 'REGISTRATION_EMAIL' | 'REGISTRATION_MOBILE' | 'LOGIN' | 'PASSWORD_RESET', otp: string) {
    return apiRequest('/vendor/auth/verify-otp', {
      method: 'POST',
      includeAuth: false,
      body: { identifier, type, otp },
      fallbackErrorMessage: 'Invalid or expired verification code.'
    });
  },

  async login(identifier: string, password?: string, rememberMe?: boolean) {
    const data = await apiRequest<any>('/vendor/auth/login', {
      method: 'POST',
      includeAuth: false,
      body: { identifier, password, rememberMe },
      fallbackErrorMessage: 'Login failed. Please check your credentials.'
    });
    if (data.token) {
      saveVendorSessionTokens(data.token, data.refreshToken, data.vendor);
    }
    return data;
  },

  async loginWithOtp(identifier: string, otp: string) {
    const data = await apiRequest<any>('/vendor/auth/login-otp', {
      method: 'POST',
      includeAuth: false,
      body: { identifier, otp },
      fallbackErrorMessage: 'OTP verification failed.'
    });
    if (data.token) {
      saveVendorSessionTokens(data.token, data.refreshToken, data.vendor);
    }
    return data;
  },

  async forgotPasswordSendOtp(identifier: string) {
    return apiRequest('/vendor/auth/forgot-password/send-otp', {
      method: 'POST',
      includeAuth: false,
      body: { identifier },
      fallbackErrorMessage: 'Unable to send password reset code. Please try again.'
    });
  },

  async forgotPasswordReset(payload: { identifier: string; otp: string; newPassword: string; confirmPassword: string }) {
    return apiRequest('/vendor/auth/forgot-password/reset', {
      method: 'POST',
      includeAuth: false,
      body: payload,
      fallbackErrorMessage: 'Failed to reset password.'
    });
  },

  // ==========================================
  // REGISTRATION WIZARD (STEPS 1 TO 5)
  // ==========================================

  async registerStep1(payload: {
    ownerName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
  }) {
    const data = await apiRequest<any>('/vendor/registration/step1', {
      method: 'POST',
      includeAuth: false,
      body: payload,
      fallbackErrorMessage: 'Unable to complete account registration. Please try again.'
    });
    if (data.token) {
      saveVendorSessionTokens(data.token, data.refreshToken, data.vendor);
    }
    return data;
  },

  async saveRegistrationDraft(wizardData: any, currentStep: number, vendorId?: string) {
    return apiRequest('/vendor/registration/save-draft', {
      method: 'PUT',
      body: { vendorId, wizardData, currentStep },
      fallbackErrorMessage: 'Failed to save registration draft.'
    });
  },

  async lookupPincode(pincode: string) {
    const clean = (pincode || '').replace(/\D/g, '').slice(0, 6);
    try {
      return await apiRequest(`/vendor/pincode-lookup/${encodeURIComponent(clean)}`, {
        method: 'GET',
        includeAuth: false,
        fallbackErrorMessage: 'Location not found for this pincode.'
      });
    } catch (err: any) {
      // Direct live India Post fallback only if backend is unreachable
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const liveRes = await fetch(`https://api.postalpincode.in/pincode/${clean}`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (liveRes.ok) {
          const liveData = await liveRes.json();
          if (Array.isArray(liveData) && liveData[0]?.Status === 'Success' && Array.isArray(liveData[0]?.PostOffice) && liveData[0].PostOffice.length > 0) {
            const pos = liveData[0].PostOffice;
            const localities = Array.from(new Set<string>(pos.map((p: any) => p.Name || '').filter(Boolean)));
            return {
              success: true,
              pincode: clean,
              country: pos[0].Country || 'India',
              state: pos[0].State || 'Karnataka',
              city: pos[0].District || pos[0].Division || 'Bengaluru',
              district: pos[0].District || 'Bengaluru Urban',
              localities: localities.length > 0 ? localities : [pos[0].Name || 'Postal Area'],
              source: 'api'
            };
          }
        }
      } catch {}
      throw mapFriendlyApiError(err, 'Failed to lookup pincode. You may enter location manually.');
    }
  },

  async submitRegistration(wizardData: any, vendorId?: string) {
    const data = await apiRequest<any>('/vendor/registration/submit', {
      method: 'POST',
      body: { vendorId, wizardData },
      fallbackErrorMessage: 'Unable to submit vendor application. Please try again.'
    });
    if (data.token) {
      saveVendorSessionTokens(data.token, data.refreshToken, data.vendor);
    }
    return data;
  },

  async getApplicationDetails(applicationId: string) {
    return apiRequest(`/vendor/registration/application/${encodeURIComponent(applicationId)}`, {
      method: 'GET',
      fallbackErrorMessage: 'Failed to fetch application details.'
    });
  },

  async uploadDocument(docPayload: {
    fileName: string;
    fileSize: number;
    mimeType: string;
    type: string;
    title: string;
  }) {
    const data = await apiRequest<any>('/vendor/registration/upload-doc', {
      method: 'POST',
      body: docPayload,
      fallbackErrorMessage: 'Document upload failed.'
    });
    return data.document;
  },

  async uploadDocumentFile(file: File, type: string, title: string) {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('type', type);
    formData.append('title', title);

    const data = await apiRequest<any>('/vendor/registration/upload-doc-file', {
      method: 'POST',
      body: formData,
      fallbackErrorMessage: 'Document upload failed.'
    });
    return data.document;
  },

  async uploadRegistrationLogo(file: File) {
    const formData = new FormData();
    formData.append('logo', file);

    return apiRequest('/vendor/registration/upload-logo', {
      method: 'POST',
      body: formData,
      fallbackErrorMessage: 'Failed to upload business logo.'
    });
  },

  async uploadProfileLogo(file: File) {
    const formData = new FormData();
    formData.append('logo', file);

    return apiRequest('/vendor/profile/upload-logo', {
      method: 'POST',
      body: formData,
      fallbackErrorMessage: 'Failed to update business logo.'
    });
  },

  // ==========================================
  // DEV-ONLY ADMIN APPROVAL CLIENT
  // ==========================================
  devAdmin: {
    async listApplications(search?: string, status?: string) {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (status && status !== 'ALL') params.set('status', status);
      const res = await fetch(`${API_BASE_URL}/admin/vendors/applications?${params.toString()}`, {
        headers: {
          'x-admin-key': 'buildora-dev-admin-2026',
          'x-admin-id': 'admin-compliance-01'
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load vendor applications.');
      return data;
    },

    async getApplication(id: string) {
      const res = await fetch(`${API_BASE_URL}/admin/vendors/applications/${encodeURIComponent(id)}`, {
        headers: {
          'x-admin-key': 'buildora-dev-admin-2026',
          'x-admin-id': 'admin-compliance-01'
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load application details.');
      return data;
    },

    async markUnderReview(id: string) {
      const res = await fetch(`${API_BASE_URL}/admin/vendors/applications/${encodeURIComponent(id)}/under-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'buildora-dev-admin-2026',
          'x-admin-id': 'admin-compliance-01'
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update status.');
      return data;
    },

    async approveApplication(id: string, notes?: string) {
      const res = await fetch(`${API_BASE_URL}/admin/vendors/applications/${encodeURIComponent(id)}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'buildora-dev-admin-2026',
          'x-admin-id': 'admin-compliance-01'
        },
        body: JSON.stringify({ notes })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to approve application.');
      return data;
    },

    async rejectApplication(id: string, reason: string) {
      const res = await fetch(`${API_BASE_URL}/admin/vendors/applications/${encodeURIComponent(id)}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'buildora-dev-admin-2026',
          'x-admin-id': 'admin-compliance-01'
        },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to reject application.');
      return data;
    },

    async requestResubmission(id: string, reason: string) {
      const res = await fetch(`${API_BASE_URL}/admin/vendors/applications/${encodeURIComponent(id)}/request-resubmission`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'buildora-dev-admin-2026',
          'x-admin-id': 'admin-compliance-01'
        },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to request resubmission.');
      return data;
    },

    async suspendVendor(id: string, reason: string) {
      const res = await fetch(`${API_BASE_URL}/admin/vendors/applications/${encodeURIComponent(id)}/suspend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'buildora-dev-admin-2026',
          'x-admin-id': 'admin-compliance-01'
        },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to suspend vendor.');
      return data;
    }
  },

  async getRegistrationStatus() {
    return apiRequest('/vendor/registration/status', {
      method: 'GET',
      fallbackErrorMessage: 'Failed to fetch registration status.'
    });
  },

  async resubmitApplication(notes?: string) {
    return apiRequest('/vendor/registration/resubmit', {
      method: 'POST',
      body: { notes },
      fallbackErrorMessage: 'Failed to resubmit application.'
    });
  },

  async getProfile(): Promise<VendorProfile> {
    const res = await apiRequest<any>('/vendor/auth/me', {
      method: 'GET',
      retryOnTransient: true,
      fallbackErrorMessage: 'Unable to load vendor business profile.'
    });
    const profile = res?.vendor || res?.data || res;
    if (!profile || !profile.id) {
      throw new Error('Unable to load vendor business profile.');
    }
    return profile as VendorProfile;
  },

  // Onboarding
  async updateOnboarding(data: Partial<VendorProfile['businessInfo']>) {
    const res = await apiRequest<any>('/vendor/onboarding', {
      method: 'PUT',
      body: data,
      fallbackErrorMessage: 'Failed to save onboarding draft.'
    });
    return { success: true, data: res?.data || res };
  },

  async submitOnboarding(data?: any): Promise<VendorProfile> {
    const res = await apiRequest<any>('/vendor/onboarding', {
      method: 'PUT',
      body: data || {},
      fallbackErrorMessage: 'Failed to submit onboarding details.'
    });
    return (res?.data || res) as VendorProfile;
  },

  // Dashboard Metrics & Charts
  async getDashboardMetrics(period?: string): Promise<VendorDashboardMetrics & Record<string, any>> {
    const q = period ? `?period=${encodeURIComponent(period)}` : '';
    return request<VendorDashboardMetrics & Record<string, any>>(
      `/vendor/dashboard/metrics${q}`,
      {}
    );
  },

  async getDashboardCharts(period?: string) {
    const q = period ? `?period=${encodeURIComponent(period)}` : '';
    return request<any>(`/vendor/dashboard/charts${q}`, {});
  },

  async getAnalyticsOverview(params?: {
    ordersFilter?: string;
    salesFilter?: string;
    ordersStartDate?: string;
    ordersEndDate?: string;
    salesStartDate?: string;
    salesEndDate?: string;
  }) {
    const q = new URLSearchParams();
    if (params?.ordersFilter) q.set('ordersFilter', params.ordersFilter);
    if (params?.salesFilter) q.set('salesFilter', params.salesFilter);
    if (params?.ordersStartDate) q.set('ordersStartDate', params.ordersStartDate);
    if (params?.ordersEndDate) q.set('ordersEndDate', params.ordersEndDate);
    if (params?.salesStartDate) q.set('salesStartDate', params.salesStartDate);
    if (params?.salesEndDate) q.set('salesEndDate', params.salesEndDate);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return request<any>(`/vendor/analytics/overview${qs}`, {});
  },

  async getAnalyticsBucketDetails(params: {
    startIso: string;
    endIso: string;
    metric: 'orders' | 'sales';
    page?: number;
    limit?: number;
  }) {
    const q = new URLSearchParams({
      startIso: params.startIso,
      endIso: params.endIso,
      metric: params.metric,
      page: String(params.page || 1),
      limit: String(params.limit || 10),
    });
    return request<any>(`/vendor/analytics/bucket-details?${q.toString()}`, {});
  },

  async getAnalyticsBrands(params?: {
    status?: 'ALL' | 'ACTIVE' | 'INACTIVE';
    period?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.period) q.set('period', params.period);
    if (params?.startDate) q.set('startDate', params.startDate);
    if (params?.endDate) q.set('endDate', params.endDate);
    if (params?.search) q.set('search', params.search);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return request<any>(`/vendor/analytics/brands${qs}`, {});
  },

  // Taxonomy (4-level hierarchy + dynamic CategoryFieldSchemas from Company Admin)
  async getTaxonomy(): Promise<{
    mainCategories: any[];
    childCategories: any[];
    productTypes: any[];
    fieldSchemas: CategoryFieldSchema[];
    warehouses: any[];
    brands: any[];
    config?: {
      gstSlabs: number[];
      tdsRate: number;
      supportedSpeeds: string[];
      expressEtaText: string;
      standardEtaText: string;
      commissionRate: number;
      freeShippingThreshold: number;
    };
  }> {
    return request<any>('/vendor/taxonomy', {}, {
      mainCategories: [],
      childCategories: [],
      productTypes: [],
      fieldSchemas: [],
      warehouses: [],
      brands: [],
    });
  },

  async getCategoryFields(childCategoryId: string): Promise<CategoryFieldSchema[]> {
    return request<CategoryFieldSchema[]>(
      `/vendor/taxonomy/fields/${encodeURIComponent(childCategoryId)}`,
      {},
      getDefaultFieldSchemasForCategory(childCategoryId)
    );
  },

  async uploadProductImage(file: File): Promise<{ url: string; fileName?: string }> {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('buildora_vendor_token') : null;
    const formData = new FormData();
    formData.append('image', file);
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE_URL}/vendor/products/upload-image`, {
      method: 'POST',
      headers,
      body: formData,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.message || 'Failed to upload product image');
    return json.data || json;
  },

  // Products
  async getProducts(params?: { category?: string; status?: string; search?: string }): Promise<VendorProduct[]> {
    const q = new URLSearchParams();
    if (params?.category) q.set('category', params.category);
    if (params?.status) q.set('status', params.status);
    if (params?.search) q.set('search', params.search);

    const queryStr = q.toString() ? `?${q.toString()}` : '';
    return request<VendorProduct[]>(`/vendor/products${queryStr}`, {}, localProducts);
  },

  async createProduct(product: Partial<VendorProduct>): Promise<VendorProduct> {
    const created = await apiRequest<any>('/vendor/products', {
      method: 'POST',
      body: product,
      fallbackErrorMessage: 'Failed to submit product.'
    });
    return created?.data || created;
  },

  async updateProduct(id: string, updates: Partial<VendorProduct>): Promise<VendorProduct> {
    const updated = await apiRequest<any>(`/vendor/products/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: updates,
      fallbackErrorMessage: 'Failed to update product.'
    });
    return updated?.data || updated;
  },

  async deleteProduct(id: string): Promise<boolean> {
    await apiRequest(`/vendor/products/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      fallbackErrorMessage: 'Failed to remove product.'
    });
    return true;
  },

  // Bulk Pricing
  async updateBulkPricing(productId: string, bulkPricing: BulkPriceTier[]): Promise<VendorProduct> {
    const res = await apiRequest<any>(`/vendor/products/${encodeURIComponent(productId)}/bulk-pricing`, {
      method: 'PUT',
      body: { bulkPricing },
      fallbackErrorMessage: 'Failed to update bulk pricing.'
    });
    return res?.data || res;
  },

  // Inventory
  async getInventory() {
    const items = await request<any[]>('/vendor/inventory', {}, []);
    return items.map((item: any) => {
      const stock = Number(item.stockCount ?? item.stock ?? 0);
      const threshold = Number(item.lowStockThreshold ?? 30);
      return {
        id: item.productId || item.id,
        name: item.name,
        sku: item.sku,
        category: item.category,
        stock,
        reservedStock: Number(item.reservedStock ?? 0),
        lowStockThreshold: threshold,
        reorderPoint: threshold * 1.5,
        warehouseLocation: item.warehouse || item.warehouseLocation || 'Primary Depot',
        status:
          stock <= 0
            ? ('OUT_OF_STOCK' as const)
            : stock <= threshold
            ? ('LOW_STOCK' as const)
            : ('IN_STOCK' as const),
      };
    });
  },

  async adjustInventory(
    productId: string,
    adjustmentType: 'ADD' | 'SUBTRACT' | 'SET',
    quantity: number,
    reason: string
  ) {
    return this.adjustStock(productId, adjustmentType, quantity, reason);
  },

  async adjustStock(productId: string, adjustmentType: 'ADD' | 'SUBTRACT' | 'SET', quantity: number, reason: string) {
    const res = await apiRequest<any>('/vendor/inventory/adjust', {
      method: 'POST',
      body: { productId, adjustmentType, quantity, reason },
      fallbackErrorMessage: 'Failed to adjust inventory.'
    });
    return res?.data || res;
  },

  // Orders
  async getOrders(status?: string): Promise<VendorOrder[]> {
    const q = status ? `?status=${status}` : '';
    return request<VendorOrder[]>(`/vendor/orders${q}`, {}, []);
  },

  async updateOrderStatus(orderId: string, status: VendorOrder['status'], note?: string): Promise<VendorOrder> {
    const res = await apiRequest<any>(`/vendor/orders/${encodeURIComponent(orderId)}/status`, {
      method: 'PUT',
      body: { status, note },
      fallbackErrorMessage: 'Failed to update order status.'
    });
    return res?.data || res;
  },

  // Settlements
  async getSettlements(): Promise<VendorSettlement[]> {
    return request<VendorSettlement[]>('/vendor/settlements', {}, []);
  },

  async getSettlementSummary() {
    const json = await request<any>('/vendor/settlements/summary', {});
    return {
      totalGrossRevenue: json.grossSales ?? json.totalGrossRevenue ?? 0,
      totalCommissionPaid: json.platformCommission ?? json.totalCommissionPaid ?? 0,
      totalGstDeductions: json.taxDeducted ?? json.totalGstDeductions ?? 0,
      totalNetPayout: json.netEarnings ?? json.totalNetPayout ?? 0,
      pendingPayout: json.pendingPayout ?? 0,
      nextPayoutDate: json.nextPayoutDate ?? 'Weekly Cycle',
    };
  },

  // Notifications
  async getNotifications(): Promise<VendorNotification[]> {
    return request<VendorNotification[]>('/vendor/notifications', {}, []);
  },

  async markNotificationRead(id: string): Promise<boolean> {
    await apiRequest(`/vendor/notifications/${encodeURIComponent(id)}/read`, {
      method: 'PUT',
      fallbackErrorMessage: 'Failed to mark notification read.'
    });
    return true;
  },

  async markNotificationAsRead(id: string): Promise<boolean> {
    return this.markNotificationRead(id);
  },

  async markAllNotificationsRead(): Promise<boolean> {
    await apiRequest('/vendor/notifications/read-all', {
      method: 'PUT',
      fallbackErrorMessage: 'Failed to mark notifications read.'
    });
    return true;
  },

  async markAllNotificationsAsRead(): Promise<boolean> {
    return this.markAllNotificationsRead();
  },

  // Category Dynamic Attributes
  async getCategoryAttributes(category?: string) {
    const q = category ? `?category=${category}` : '';
    return request<any>(`/vendor/categories/attributes${q}`, {}, { attributes: [] });
  },

  // Bulk Product Import & Export
  async bulkImportProducts(products: Partial<VendorProduct>[]) {
    return apiRequest('/vendor/products/bulk-import', {
      method: 'POST',
      body: { products },
      fallbackErrorMessage: 'Bulk import failed.'
    });
  },

  async exportProducts() {
    return request<any>('/vendor/products/export', {}, { count: 0, data: [] });
  },

  async updateProductVariants(id: string, variants: any[], attributes?: any[]) {
    return apiRequest(`/vendor/products/${encodeURIComponent(id)}/variants`, {
      method: 'PUT',
      body: { variants, attributes },
      fallbackErrorMessage: 'Failed to update product variants.'
    });
  },

  async getAllBulkPricing() {
    return request<any>('/vendor/bulk-pricing/all', {}, { count: 0, data: [] });
  },

  // Stock Movements & Warehouses
  async getStockMovements(productId?: string): Promise<VendorStockMovement[]> {
    const q = productId ? `?productId=${productId}` : '';
    return request<VendorStockMovement[]>(`/vendor/inventory/movements${q}`, {}, []);
  },

  async getWarehouses(): Promise<{ data: VendorWarehouse[]; darkStores: any[] }> {
    const raw = await apiRequest<any>('/vendor/warehouses', { method: 'GET' });
    return {
      data: Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [],
      darkStores: raw?.darkStores || Object.values(BENGALURU_WAREHOUSES),
    };
  },

  async createWarehouse(wh: Partial<VendorWarehouse>) {
    return apiRequest('/vendor/warehouses', {
      method: 'POST',
      body: wh,
      fallbackErrorMessage: 'Failed to create warehouse.'
    });
  },

  async updateWarehouse(id: string, wh: Partial<VendorWarehouse>) {
    return apiRequest(`/vendor/warehouses/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: wh,
      fallbackErrorMessage: 'Failed to update warehouse.'
    });
  },

  async deleteWarehouse(id: string) {
    return apiRequest(`/vendor/warehouses/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      fallbackErrorMessage: 'Failed to delete warehouse.'
    });
  },

  // Order Actions & Packing Slip
  async acceptOrder(id: string) {
    return apiRequest(`/vendor/orders/${encodeURIComponent(id)}/accept`, {
      method: 'POST',
      fallbackErrorMessage: 'Failed to accept order.'
    });
  },

  async rejectOrder(id: string, reason: string) {
    return apiRequest(`/vendor/orders/${encodeURIComponent(id)}/reject`, {
      method: 'POST',
      body: { reason },
      fallbackErrorMessage: 'Failed to reject order.'
    });
  },

  async getOrderPackingSlip(id: string) {
    return request<any>(`/vendor/orders/${encodeURIComponent(id)}/packing-slip`, {});
  },

  // Returns & Refunds
  async getReturns(status?: string): Promise<VendorReturnRequest[]> {
    const q = status ? `?status=${status}` : '';
    return request<VendorReturnRequest[]>(`/vendor/returns${q}`, {}, []);
  },

  async updateReturnStatus(id: string, status: string, restockDecision?: boolean, rejectionReason?: string) {
    return apiRequest(`/vendor/returns/${encodeURIComponent(id)}/status`, {
      method: 'PUT',
      body: { status, restockDecision, rejectionReason },
      fallbackErrorMessage: 'Failed to update return status.'
    });
  },

  // Promotions & Deals
  async getPromotions(): Promise<VendorPromotion[]> {
    return request<VendorPromotion[]>('/vendor/promotions', {}, []);
  },

  async createPromotion(promo: Partial<VendorPromotion>) {
    return apiRequest('/vendor/promotions', {
      method: 'POST',
      body: promo,
      fallbackErrorMessage: 'Failed to create promotion.'
    });
  },

  async updatePromotionStatus(id: string, status: string) {
    return apiRequest(`/vendor/promotions/${encodeURIComponent(id)}/status`, {
      method: 'PUT',
      body: { status },
      fallbackErrorMessage: 'Failed to update promotion status.'
    });
  },

  // New Launches Spotlight
  async getNewLaunches(): Promise<VendorProduct[]> {
    return request<VendorProduct[]>('/vendor/new-launches', {}, []);
  },

  async addNewLaunch(id: string) {
    return apiRequest(`/vendor/new-launches/${encodeURIComponent(id)}`, { method: 'POST' });
  },

  async removeNewLaunch(id: string) {
    return apiRequest(`/vendor/new-launches/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  // Customer Reviews
  async getReviews(): Promise<{ averageRating: number; totalCount: number; data: VendorProductReview[] }> {
    return apiRequest<any>('/vendor/reviews', { method: 'GET' });
  },

  async replyToReview(id: string, message: string) {
    return apiRequest(`/vendor/reviews/${encodeURIComponent(id)}/reply`, {
      method: 'POST',
      body: { message },
      fallbackErrorMessage: 'Failed to reply to review.'
    });
  },

  // Invoices & GST Documents
  async getInvoices(): Promise<VendorInvoice[]> {
    return request<VendorInvoice[]>('/vendor/invoices', {}, []);
  },

  async requestSettlementPayout(amount?: number) {
    return apiRequest('/vendor/settlements/request-payout', {
      method: 'POST',
      body: { amount },
      fallbackErrorMessage: 'Failed to request settlement payout.'
    });
  },

  // Sales Analytics & Reports
  async getSalesReport(period?: string, category?: string) {
    const q = new URLSearchParams();
    if (period) q.set('period', period);
    if (category) q.set('category', category);
    return request<any>(`/vendor/reports/sales?${q.toString()}`, {});
  },

  // Team & RBAC
  async getTeam(): Promise<VendorEmployee[]> {
    return request<VendorEmployee[]>('/vendor/team', {}, []);
  },

  async inviteTeamMember(data: any) {
    return apiRequest('/vendor/team/invite', {
      method: 'POST',
      body: data,
      fallbackErrorMessage: 'Failed to invite team member.'
    });
  },

  async updateTeamRole(id: string, role: string, permissions?: string[]) {
    return apiRequest(`/vendor/team/${encodeURIComponent(id)}/role`, {
      method: 'PUT',
      body: { role, permissions },
      fallbackErrorMessage: 'Failed to update team role.'
    });
  },

  async removeTeamMember(id: string) {
    return apiRequest(`/vendor/team/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  async getTeamAuditLogs() {
    return request<any>('/vendor/team/audit-logs', {}, []);
  },

  // Support Tickets
  async getSupportTickets(): Promise<VendorSupportTicket[]> {
    return request<VendorSupportTicket[]>('/vendor/support/tickets', {}, []);
  },

  async createSupportTicket(data: any) {
    return apiRequest('/vendor/support/tickets', {
      method: 'POST',
      body: data,
      fallbackErrorMessage: 'Failed to submit support ticket.'
    });
  },

  async addSupportTicketMessage(id: string, text: string) {
    return apiRequest(`/vendor/support/tickets/${encodeURIComponent(id)}/messages`, {
      method: 'POST',
      body: { text },
      fallbackErrorMessage: 'Failed to send message.'
    });
  },

  // Vendor Profile, Bank & Settings
  async updateProfile(payload: any) {
    const res = await apiRequest<any>('/vendor/profile', {
      method: 'PUT',
      body:
        payload?.businessInfo ||
        payload?.storeName ||
        payload?.logoUrl !== undefined
          ? payload
          : { businessInfo: payload },
      fallbackErrorMessage: 'Failed to update business profile.'
    });
    return res;
  },

  async updateBankDetails(bankDetails: any) {
    return apiRequest<any>('/vendor/profile/bank', {
      method: 'PUT',
      body: bankDetails,
      fallbackErrorMessage: 'Failed to update bank account details.'
    });
  },

  async getSettings() {
    return request<any>('/vendor/settings', {});
  },

  async updateSecuritySettings(data: { currentPassword?: string; newPassword?: string; enable2FA?: boolean }) {
    return apiRequest<any>('/vendor/settings/security', {
      method: 'PUT',
      body: data,
      fallbackErrorMessage: 'Failed to update security settings.'
    });
  },

  async updateNotificationSettings(data: any) {
    return apiRequest<any>('/vendor/settings/notifications', {
      method: 'PUT',
      body: data,
      fallbackErrorMessage: 'Failed to update notification preferences.'
    });
  },

  async getDeliverySettings() {
    return request<any>('/vendor/delivery/settings', {});
  },

  async updateDeliverySettings(data: any) {
    return apiRequest<any>('/vendor/delivery/settings', {
      method: 'PUT',
      body: data,
      fallbackErrorMessage: 'Failed to update delivery settings.'
    });
  },

  // Bulk Orders & Quotations (RFQ)
  async getQuotations() {
    const raw = await request<any[]>('/vendor/quotations', {});
    return (Array.isArray(raw) ? raw : []).map((q: any) => {
      const mappedStatus =
        q.status === 'INCOMING' || q.status === 'VENDOR_ASSIGNED'
          ? 'PENDING_QUOTE'
          : q.status === 'QUOTES_RECEIVED' || q.status === 'UNDER_NEGOTIATION'
            ? 'QUOTED'
            : q.status === 'APPROVED' || q.status === 'CONVERTED_TO_ORDER'
              ? 'ACCEPTED'
              : q.status;
      const latestQuote = Array.isArray(q.vendorQuotes) && q.vendorQuotes.length > 0
        ? q.vendorQuotes[q.vendorQuotes.length - 1]
        : null;
      return {
        ...q,
        rfqNumber: q.rfqNumber || q.quoteNumber || q.id,
        contactPerson: q.contactPerson || q.customerName,
        phone: q.phone || q.customerPhone,
        siteLocation: q.siteLocation || q.siteAddress,
        status: mappedStatus,
        quotedTotal: q.quotedTotal ?? latestQuote?.totalQuotedAmount ?? q.finalApprovedAmount ?? 0,
        vendorNotes: q.vendorNotes || latestQuote?.notes || '',
      };
    });
  },

  async submitQuotation(id: string, payload: { quotedTotal: number; items: any[]; validUntil?: string; vendorNotes?: string }) {
    return request<any>(`/vendor/quotations/${encodeURIComponent(id)}/quote`, {
      method: 'POST',
      body: JSON.stringify({
        totalQuotedAmount: payload.quotedTotal,
        notes: payload.vendorNotes,
        validUntil: payload.validUntil,
        items: payload.items,
      }),
    });
  },

  async updateQuotationStatus(id: string, status: 'ACCEPTED' | 'REJECTED') {
    const backendStatus = status === 'ACCEPTED' ? 'APPROVED' : 'REJECTED';
    return request<any>(`/vendor/quotations/${encodeURIComponent(id)}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: backendStatus }),
    });
  },

  // Customers Directory
  async getCustomers() {
    const raw = await request<any[]>('/vendor/customers', {});
    return (Array.isArray(raw) ? raw : []).map((c: any) => ({
      ...c,
      company: c.company || c.companyName || (c.customerType ? `${c.customerType} Buyer` : 'Direct Buyer'),
      type: c.type || c.customerType || 'Direct Buyer',
      lastOrderDate: c.lastOrderDate || c.lastOrderAt,
      pincode: c.pincode || c.address?.pincode || '—',
      city: c.city || c.address?.city || 'Bengaluru',
    }));
  },

  // Delivery & Dispatch
  async getDispatches() {
    const res = await request<any>('/vendor/dispatches', {});
    return Array.isArray(res) ? res : res?.data || [];
  },

  async assignDelivery(orderId: string, details: { driverName: string; vehicleNumber: string; driverPhone: string; hubName?: string; partnerId?: string }) {
    return apiRequest<any>(`/vendor/orders/${encodeURIComponent(orderId)}/assign-delivery`, {
      method: 'POST',
      body: details,
      fallbackErrorMessage: 'Failed to assign delivery partner.'
    });
  },
};
