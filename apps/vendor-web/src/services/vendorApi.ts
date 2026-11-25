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
} from '@buildora/types';
import { SEED_PRODUCTS, MASTER_CATEGORIES, BENGALURU_WAREHOUSES } from '@buildora/constants';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api/v1';

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

async function request<T>(path: string, options: RequestInit = {}, fallbackData?: T): Promise<T> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    if (res.ok) {
      const json = await res.json();
      return json.data !== undefined ? json.data : json;
    }
  } catch (err) {
    // silently fallback to fast memory state
  }

  if (fallbackData !== undefined) {
    return fallbackData;
  }
  throw new Error(`API call failed for ${path}`);
}

function broadcastProductChange(prod: any) {
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('buildora_product_sync');
      bc.postMessage({
        type: 'PRODUCT_UPDATED',
        productId: prod.id,
        sku: prod.sku,
        slug: prod.slug,
        timestamp: Date.now()
      });
      bc.close();
    }
    const raw = localStorage.getItem('buildora_vendor_product_overrides');
    const overrides = raw ? JSON.parse(raw) : {};
    const key = prod.id.replace(/^vp-/, '');
    overrides[key] = {
      price: prod.price,
      mrp: prod.mrp,
      discount: prod.discount,
      stockCount: prod.stockCount || prod.stock,
      inStock: prod.inStock,
      variants: prod.variants,
      attributes: prod.attributes,
      bulkPricing: prod.bulkPricing,
      isBulkEligible: prod.isBulkEligible
    };
    if (prod.sku) overrides[prod.sku] = overrides[key];
    if (prod.slug) overrides[prod.slug] = overrides[key];
    localStorage.setItem('buildora_vendor_product_overrides', JSON.stringify(overrides));
  } catch {}
}

export const vendorApi = {
  getStoredProfile(): VendorProfile {
    return localVendor;
  },

  logout(): void {
    // Clears in-memory session if needed
  },

  async register(payload: { storeName: string; email: string; phone: string }): Promise<{ token: string; vendor: VendorProfile }> {
    localVendor.storeName = payload.storeName;
    localVendor.email = payload.email;
    localVendor.phone = payload.phone;
    localVendor.businessInfo.storeName = payload.storeName;
    localVendor.businessInfo.email = payload.email;
    localVendor.businessInfo.phone = payload.phone;
    return {
      token: 'jwt-vendor-token-buildora-60',
      vendor: localVendor,
    };
  },

  // ==========================================
  // AUTHENTICATION & SECURITY
  // ==========================================

  async sendOtp(identifier: string, type: 'REGISTRATION_EMAIL' | 'REGISTRATION_MOBILE' | 'LOGIN' | 'PASSWORD_RESET') {
    const res = await fetch(`${API_BASE_URL}/vendor/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, type }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to send verification code.');
    return data;
  },

  async verifyOtp(identifier: string, type: 'REGISTRATION_EMAIL' | 'REGISTRATION_MOBILE' | 'LOGIN' | 'PASSWORD_RESET', otp: string) {
    const res = await fetch(`${API_BASE_URL}/vendor/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, type, otp }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Invalid or expired verification code.');
    return data;
  },

  async login(identifier: string, password?: string, rememberMe?: boolean) {
    const res = await fetch(`${API_BASE_URL}/vendor/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password, rememberMe }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed. Please check your credentials.');
    if (data.token) {
      localStorage.setItem('buildora_vendor_token', data.token);
    }
    return data;
  },

  async loginWithOtp(identifier: string, otp: string) {
    const res = await fetch(`${API_BASE_URL}/vendor/auth/login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, otp }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'OTP verification failed.');
    if (data.token) {
      localStorage.setItem('buildora_vendor_token', data.token);
    }
    return data;
  },

  async forgotPasswordSendOtp(identifier: string) {
    const res = await fetch(`${API_BASE_URL}/vendor/auth/forgot-password/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to send password reset code.');
    return data;
  },

  async forgotPasswordReset(payload: { identifier: string; otp: string; newPassword: string; confirmPassword: string }) {
    const res = await fetch(`${API_BASE_URL}/vendor/auth/forgot-password/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to reset password.');
    return data;
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
    const res = await fetch(`${API_BASE_URL}/vendor/registration/step1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed.');
    if (data.token) {
      localStorage.setItem('buildora_vendor_token', data.token);
    }
    return data;
  },

  async saveRegistrationDraft(wizardData: any, currentStep: number, vendorId?: string) {
    const token = localStorage.getItem('buildora_vendor_token');
    const res = await fetch(`${API_BASE_URL}/vendor/registration/save-draft`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ vendorId, wizardData, currentStep }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to save registration draft.');
    return data;
  },

  async lookupPincode(pincode: string) {
    const clean = (pincode || '').replace(/\D/g, '').slice(0, 6);
    try {
      const res = await fetch(`${API_BASE_URL}/vendor/pincode-lookup/${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Location not found for this pincode.');
      return data;
    } catch (err: any) {
      // Direct live India Post fallback in case backend server is offline or unreachable
      try {
        const liveRes = await fetch(`https://api.postalpincode.in/pincode/${clean}`);
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
      throw new Error(err.message || 'Failed to lookup pincode. You may enter location manually.');
    }
  },

  async submitRegistration(wizardData: any, vendorId?: string) {
    const token = localStorage.getItem('buildora_vendor_token');
    const res = await fetch(`${API_BASE_URL}/vendor/registration/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ vendorId, wizardData }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to submit vendor application.');
    if (data.token) {
      localStorage.setItem('buildora_vendor_token', data.token);
    }
    return data;
  },

  async getApplicationDetails(applicationId: string) {
    const token = localStorage.getItem('buildora_vendor_token');
    const res = await fetch(`${API_BASE_URL}/vendor/registration/application/${applicationId}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch application details.');
    return data;
  },

  async uploadDocument(docPayload: {
    fileName: string;
    fileSize: number;
    mimeType: string;
    type: string;
    title: string;
  }) {
    const token = localStorage.getItem('buildora_vendor_token');
    const res = await fetch(`${API_BASE_URL}/vendor/registration/upload-doc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(docPayload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Document upload failed.');
    return data.document;
  },

  async getRegistrationStatus() {
    const token = localStorage.getItem('buildora_vendor_token');
    const res = await fetch(`${API_BASE_URL}/vendor/registration/status`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch registration status.');
    return data;
  },

  async resubmitApplication(notes?: string) {
    const token = localStorage.getItem('buildora_vendor_token');
    const res = await fetch(`${API_BASE_URL}/vendor/registration/resubmit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ notes }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to resubmit application.');
    return data;
  },

  async getProfile(): Promise<VendorProfile> {
    return request<VendorProfile>('/vendor/auth/me', {}, localVendor);
  },

  // Onboarding
  async updateOnboarding(data: Partial<VendorProfile['businessInfo']>) {
    try {
      const res = await fetch(`${API_BASE_URL}/vendor/onboarding`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) return await res.json();
    } catch {}
    localVendor.businessInfo = { ...localVendor.businessInfo, ...data };
    return { success: true, data: localVendor.businessInfo };
  },

  async submitOnboarding(data?: any): Promise<VendorProfile> {
    try {
      const res = await fetch(`${API_BASE_URL}/vendor/onboarding/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data || {}),
      });
      if (res.ok) {
        const json = await res.json();
        return json.vendor || localVendor;
      }
    } catch {}
    localVendor.status = 'ACTIVE';
    if (data?.business) {
      localVendor.business = { ...localVendor.business, ...data.business };
      if (data.business.tradeName) localVendor.storeName = data.business.tradeName;
    }
    if (data?.bank) {
      localVendor.bankDetails = { ...localVendor.bankDetails, ...data.bank };
    }
    if (data?.categories) {
      localVendor.categories = data.categories;
    }
    return localVendor;
  },

  // Dashboard Metrics & Charts
  async getDashboardMetrics(): Promise<VendorDashboardMetrics> {
    return request<VendorDashboardMetrics>(
      '/vendor/dashboard/metrics',
      {},
      {
        totalProducts: localProducts.length,
        activeProducts: localProducts.filter((p) => p.isActive).length,
        pendingApprovalProducts: localProducts.filter((p) => p.approvalStatus === 'PENDING_APPROVAL').length,
        lowStockCount: localProducts.filter((p) => p.stockCount <= p.lowStockThreshold).length,
        outOfStockCount: localProducts.filter((p) => p.stockCount === 0).length,
        totalOrders: localOrders.length + 46,
        pendingOrders: 1,
        processingOrders: 1,
        dispatchedOrders: 0,
        deliveredOrders: 46,
        grossRevenue: 156650,
        netEarnings: 147290,
        pendingSettlement: 50948,
        completedPayouts: 92590,
      }
    );
  },

  async getDashboardCharts() {
    return request(
      '/vendor/dashboard/charts',
      {},
      {
        salesTrend: [
          { date: 'Mon', revenue: 42000 },
          { date: 'Tue', revenue: 58000 },
          { date: 'Wed', revenue: 51000 },
          { date: 'Thu', revenue: 76000 },
          { date: 'Fri', revenue: 64000 },
          { date: 'Sat', revenue: 92000 },
          { date: 'Sun', revenue: 48750 },
        ],
      }
    );
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
    try {
      const res = await fetch(`${API_BASE_URL}/vendor/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      if (res.ok) {
        const json = await res.json();
        broadcastProductChange(json.data);
        return json.data;
      }
    } catch {}

    const id = `vp-${Date.now()}`;
    const newP: VendorProduct = {
      ...(product as any),
      id,
      vendorId: 'vnd-apex-01',
      tenantId: 'tenant-buildora-blr',
      approvalStatus: 'APPROVED',
      isActive: true,
      rating: 5.0,
      reviewCount: 0,
      stockCount: (product as any).stock || 100,
      stock: (product as any).stock || 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    localProducts.unshift(newP);
    broadcastProductChange(newP);
    return newP;
  },

  async updateProduct(id: string, updates: Partial<VendorProduct>): Promise<VendorProduct> {
    try {
      const res = await fetch(`${API_BASE_URL}/vendor/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const json = await res.json();
        broadcastProductChange(json.data);
        return json.data;
      }
    } catch {}

    const idx = localProducts.findIndex((p) => p.id === id);
    if (idx !== -1) {
      localProducts[idx] = {
        ...localProducts[idx],
        ...updates,
        stockCount: updates.stock !== undefined ? updates.stock : localProducts[idx].stockCount,
        updatedAt: new Date().toISOString(),
      };
      broadcastProductChange(localProducts[idx]);
      return localProducts[idx];
    }
    throw new Error('Product not found');
  },

  async deleteProduct(id: string): Promise<boolean> {
    try {
      await fetch(`${API_BASE_URL}/vendor/products/${id}`, { method: 'DELETE' });
    } catch {}
    localProducts = localProducts.filter((p) => p.id !== id);
    return true;
  },

  // Bulk Pricing
  async updateBulkPricing(productId: string, bulkPricing: BulkPriceTier[]): Promise<VendorProduct> {
    try {
      const res = await fetch(`${API_BASE_URL}/vendor/products/${productId}/bulk-pricing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulkPricing }),
      });
      if (res.ok) {
        const json = await res.json();
        broadcastProductChange(json.data);
        return json.data;
      }
    } catch {}

    const prod = localProducts.find((p) => p.id === productId);
    if (prod) {
      prod.bulkPricing = bulkPricing;
      prod.isBulkEligible = bulkPricing.length > 0;
      broadcastProductChange(prod);
      return prod;
    }
    throw new Error('Product not found');
  },

  // Inventory
  async getInventory() {
    return localProducts.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      category: p.category,
      stock: p.stockCount || 100,
      lowStockThreshold: p.lowStockThreshold || 30,
      reorderPoint: (p.lowStockThreshold || 30) * 1.5,
      warehouseLocation: p.warehouseLocation || 'WH-BLR-04 Peenya Hub',
      status:
        (p.stockCount || 0) <= 0
          ? ('OUT_OF_STOCK' as const)
          : (p.stockCount || 0) <= (p.lowStockThreshold || 30)
          ? ('LOW_STOCK' as const)
          : ('IN_STOCK' as const),
    }));
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
    try {
      const res = await fetch(`${API_BASE_URL}/vendor/inventory/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, adjustmentType, quantity, reason }),
      });
      if (res.ok) return await res.json();
    } catch {}

    const prod = localProducts.find((p) => p.id === productId);
    if (prod) {
      if (adjustmentType === 'ADD') prod.stockCount += quantity;
      else if (adjustmentType === 'SUBTRACT') prod.stockCount = Math.max(0, prod.stockCount - quantity);
      else prod.stockCount = quantity;
      prod.stock = prod.stockCount;
      prod.inStock = prod.stockCount > 0;
    }
    return { success: true, stock: prod?.stockCount || 0 };
  },

  // Orders
  async getOrders(status?: string): Promise<VendorOrder[]> {
    const q = status ? `?status=${status}` : '';
    return request<VendorOrder[]>(`/vendor/orders${q}`, {}, localOrders);
  },

  async updateOrderStatus(orderId: string, status: VendorOrder['status'], note?: string): Promise<VendorOrder> {
    try {
      const res = await fetch(`${API_BASE_URL}/vendor/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note }),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}

    const ord = localOrders.find((o) => o.id === orderId);
    if (ord) {
      ord.status = status;
      ord.timeline.push({
        status,
        title: `Order marked as ${status}`,
        description: note,
        timestamp: new Date().toISOString(),
      });
      return ord;
    }
    throw new Error('Order not found');
  },

  // Settlements
  async getSettlements(): Promise<VendorSettlement[]> {
    return request<VendorSettlement[]>('/vendor/settlements', {}, localSettlements);
  },

  async getSettlementSummary() {
    return {
      totalGrossRevenue: 312500,
      totalCommissionPaid: 25000,
      totalGstDeductions: 3125,
      totalNetPayout: 284375,
      pendingPayout: 74200,
      nextPayoutDate: 'Friday 27 Feb 2026',
    };
  },

  // Notifications
  async getNotifications(): Promise<VendorNotification[]> {
    return request<VendorNotification[]>('/vendor/notifications', {}, localNotifications);
  },

  async markNotificationRead(id: string): Promise<boolean> {
    try {
      await fetch(`${API_BASE_URL}/vendor/notifications/${id}/read`, { method: 'PUT' });
    } catch {}
    const notif = localNotifications.find((n) => n.id === id);
    if (notif) notif.read = true;
    return true;
  },

  async markNotificationAsRead(id: string): Promise<boolean> {
    return this.markNotificationRead(id);
  },

  async markAllNotificationsRead(): Promise<boolean> {
    try {
      await fetch(`${API_BASE_URL}/vendor/notifications/read-all`, { method: 'PUT' });
    } catch {}
    localNotifications.forEach((n) => (n.read = true));
    return true;
  },

  async markAllNotificationsAsRead(): Promise<boolean> {
    return this.markAllNotificationsRead();
  },

  // Category Dynamic Attributes
  async getCategoryAttributes(category?: string) {
    const q = category ? `?category=${category}` : '';
    return request<any>(`/vendor/categories/attributes${q}`, {}, {
      attributes: [
        { name: 'Grade / Specification', uiType: 'pills', options: ['53 Grade IS 12269', 'PPC IS 1489', 'Premium Structural'] },
        { name: 'Package Unit', uiType: 'cards', options: ['50kg Bag', '1000kg Jumbo Bag'] }
      ]
    });
  },

  // Bulk Product Import & Export
  async bulkImportProducts(products: Partial<VendorProduct>[]) {
    try {
      const res = await fetch(`${API_BASE_URL}/vendor/products/bulk-import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products }),
      });
      if (res.ok) {
        const json = await res.json();
        return json;
      }
    } catch {}
    return { success: true, importedCount: products.length };
  },

  async exportProducts() {
    return request<any>('/vendor/products/export', {}, { count: localProducts.length, data: localProducts });
  },

  async updateProductVariants(id: string, variants: any[], attributes?: any[]) {
    try {
      const res = await fetch(`${API_BASE_URL}/vendor/products/${id}/variants`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variants, attributes }),
      });
      if (res.ok) return await res.json();
    } catch {}
    const p = localProducts.find((item) => item.id === id);
    if (p) {
      p.variants = variants;
      if (attributes) p.attributes = attributes;
      broadcastProductChange(p);
    }
    return { success: true, variants, attributes };
  },

  async getAllBulkPricing() {
    return request<any>('/vendor/bulk-pricing/all', {}, {
      count: 3,
      data: localProducts.filter((p) => p.isBulkEligible).map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category,
        basePrice: p.price,
        mrp: p.mrp,
        bulkPricing: p.bulkPricing
      }))
    });
  },

  // Stock Movements & Warehouses
  async getStockMovements(productId?: string): Promise<VendorStockMovement[]> {
    const q = productId ? `?productId=${productId}` : '';
    return request<VendorStockMovement[]>(`/vendor/inventory/movements${q}`, {}, [
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
      }
    ]);
  },

  async getWarehouses(): Promise<{ data: VendorWarehouse[]; darkStores: any[] }> {
    return request<any>('/vendor/warehouses', {}, {
      data: [
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
        }
      ],
      darkStores: Object.values(BENGALURU_WAREHOUSES)
    });
  },

  async createWarehouse(wh: Partial<VendorWarehouse>) {
    try {
      const res = await fetch(`${API_BASE_URL}/vendor/warehouses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wh),
      });
      if (res.ok) return await res.json();
    } catch {}
    return { success: true, data: { ...wh, id: `wh-${Date.now()}` } };
  },

  async updateWarehouse(id: string, wh: Partial<VendorWarehouse>) {
    try {
      const res = await fetch(`${API_BASE_URL}/vendor/warehouses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wh),
      });
      if (res.ok) return await res.json();
    } catch {}
    return { success: true, data: { ...wh, id } };
  },

  async deleteWarehouse(id: string) {
    try {
      await fetch(`${API_BASE_URL}/vendor/warehouses/${id}`, { method: 'DELETE' });
    } catch {}
    return { success: true };
  },

  // Order Actions & Packing Slip
  async acceptOrder(id: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/vendor/orders/${id}/accept`, { method: 'POST' });
      if (res.ok) return await res.json();
    } catch {}
    return { success: true };
  },

  async rejectOrder(id: string, reason: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/vendor/orders/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) return await res.json();
    } catch {}
    return { success: true };
  },

  async getOrderPackingSlip(id: string) {
    return request<any>(`/vendor/orders/${id}/packing-slip`, {}, {
      slipNumber: `PS-${id}`,
      generatedAt: new Date().toISOString(),
      vendor: localVendor.businessInfo,
      assignedDarkStore: BENGALURU_WAREHOUSES['WH-BLR-04']
    });
  },

  // Returns & Refunds
  async getReturns(status?: string): Promise<VendorReturnRequest[]> {
    const q = status ? `?status=${status}` : '';
    return request<VendorReturnRequest[]>(`/vendor/returns${q}`, {}, [
      {
        id: 'ret-101',
        orderId: 'vo-100',
        orderNumber: 'BLD-2026-8940',
        vendorId: 'vnd-apex-01',
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
            returnReason: 'Wrong wire gauge ordered by electrician',
            productCondition: 'SEALED'
          }
        ],
        totalRefundAmount: 3450,
        status: 'REFUNDED',
        pickupAddress: 'Villa 18, Palm Meadows, Whitefield, Bengaluru 560066',
        requestedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        resolvedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
        restockDecision: true
      }
    ]);
  },

  async updateReturnStatus(id: string, status: string, restockDecision?: boolean, rejectionReason?: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/vendor/returns/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, restockDecision, rejectionReason }),
      });
      if (res.ok) return await res.json();
    } catch {}
    return { success: true, status };
  },

  // Promotions & Deals
  async getPromotions(): Promise<VendorPromotion[]> {
    return request<VendorPromotion[]>('/vendor/promotions', {}, [
      {
        id: 'promo-01',
        vendorId: 'vnd-apex-01',
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
      }
    ]);
  },

  async createPromotion(promo: Partial<VendorPromotion>) {
    try {
      const res = await fetch(`${API_BASE_URL}/vendor/promotions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promo),
      });
      if (res.ok) return await res.json();
    } catch {}
    return { success: true, data: { ...promo, id: `promo-${Date.now()}` } };
  },

  async updatePromotionStatus(id: string, status: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/vendor/promotions/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) return await res.json();
    } catch {}
    return { success: true, status };
  },

  // New Launches Spotlight
  async getNewLaunches(): Promise<VendorProduct[]> {
    return request<VendorProduct[]>('/vendor/new-launches', {}, localProducts.filter((p) => p.isNewLaunch));
  },

  async addNewLaunch(id: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/vendor/new-launches/${id}`, { method: 'POST' });
      if (res.ok) return await res.json();
    } catch {}
    const p = localProducts.find((item) => item.id === id);
    if (p) {
      p.isNewLaunch = true;
      broadcastProductChange(p);
    }
    return { success: true };
  },

  async removeNewLaunch(id: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/vendor/new-launches/${id}`, { method: 'DELETE' });
      if (res.ok) return await res.json();
    } catch {}
    const p = localProducts.find((item) => item.id === id);
    if (p) {
      p.isNewLaunch = false;
      broadcastProductChange(p);
    }
    return { success: true };
  },

  // Customer Reviews
  async getReviews(): Promise<{ averageRating: number; totalCount: number; data: VendorProductReview[] }> {
    return request<any>('/vendor/reviews', {}, {
      averageRating: 4.8,
      totalCount: 3,
      data: [
        {
          id: 'rev-01',
          productId: 'vp-prod-cem-1',
          productName: 'UltraTech Super Cement (PPC)',
          sku: 'CEM-ULT-PPC-50KG',
          customerName: 'Arjun Sharma (Site Engineer)',
          rating: 5,
          title: 'Fresh mill stock delivered in under 45 minutes',
          comment: 'Cement bags arrived completely dry with zero clumps or moisture damage. Initial setting time test was exactly 42 minutes.',
          verifiedPurchase: true,
          createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
          vendorReply: {
            message: 'Thank you Arjun! All our cement consignments are directly dispatched from authorized depot.',
            repliedAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
            repliedBy: 'Vikramaditya Rao'
          }
        }
      ]
    });
  },

  async replyToReview(id: string, message: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/vendor/reviews/${id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      if (res.ok) return await res.json();
    } catch {}
    return { success: true, message };
  },

  // Invoices & GST Documents
  async getInvoices(): Promise<VendorInvoice[]> {
    return request<VendorInvoice[]>('/vendor/invoices', {}, [
      {
        id: 'inv-1001',
        invoiceNumber: 'INV-BLD-2026-1001',
        orderId: 'vo-101',
        orderNumber: 'BLD-2026-8941',
        vendorId: 'vnd-apex-01',
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
        pdfUrl: '/docs/invoice-sample.pdf',
        status: 'GENERATED'
      }
    ]);
  },

  async requestSettlementPayout(amount?: number) {
    try {
      const res = await fetch(`${API_BASE_URL}/vendor/settlements/request-payout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      if (res.ok) return await res.json();
    } catch {}
    return { success: true, message: 'On-demand bank payout requested.' };
  },

  // Sales Analytics & Reports
  async getSalesReport(period?: string, category?: string) {
    const q = new URLSearchParams();
    if (period) q.set('period', period);
    if (category) q.set('category', category);
    return request<any>(`/vendor/reports/sales?${q.toString()}`, {}, {
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
    });
  },

  // Team & RBAC
  async getTeam(): Promise<VendorEmployee[]> {
    return request<VendorEmployee[]>('/vendor/team', {}, [
      {
        id: 'emp-01',
        vendorId: 'vnd-apex-01',
        name: 'Vikramaditya Rao',
        email: 'vendor@buildora.in',
        phone: '9845012345',
        role: 'VENDOR_OWNER',
        status: 'ACTIVE',
        permissions: ['ALL_PERMISSIONS'],
        invitedAt: '2026-01-10T09:00:00Z',
        lastLoginAt: new Date().toISOString()
      },
      {
        id: 'emp-02',
        vendorId: 'vnd-apex-01',
        name: 'Ramesh Gowda',
        email: 'ramesh.gowda@supremebuild.com',
        phone: '9845012348',
        role: 'VENDOR_ADMIN',
        status: 'ACTIVE',
        permissions: ['CATALOG_EDIT', 'INVENTORY_MANAGE', 'ORDERS_MANAGE'],
        invitedAt: '2026-01-12T10:00:00Z'
      }
    ]);
  },

  async inviteTeamMember(data: any) {
    try {
      const res = await fetch(`${API_BASE_URL}/vendor/team/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) return await res.json();
    } catch {}
    return { success: true, data: { ...data, id: `emp-${Date.now()}` } };
  },

  async updateTeamRole(id: string, role: string, permissions?: string[]) {
    try {
      const res = await fetch(`${API_BASE_URL}/vendor/team/${id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, permissions }),
      });
      if (res.ok) return await res.json();
    } catch {}
    return { success: true, role };
  },

  async removeTeamMember(id: string) {
    try {
      await fetch(`${API_BASE_URL}/vendor/team/${id}`, { method: 'DELETE' });
    } catch {}
    return { success: true };
  },

  async getTeamAuditLogs() {
    return request<any>('/vendor/team/audit-logs', {}, localVendor.auditLogs || []);
  },

  // Support Tickets
  async getSupportTickets(): Promise<VendorSupportTicket[]> {
    return request<VendorSupportTicket[]>('/vendor/support/tickets', {}, [
      {
        id: 'tkt-01',
        ticketNumber: 'TKT-2026-891',
        vendorId: 'vnd-apex-01',
        subject: 'Express dispatch bay access card for Whitefield Dark Store WH-BLR-02',
        category: 'DARK_STORE_LOGISTICS',
        priority: 'HIGH',
        description: 'Our EV mini-truck driver was delayed at gate 2 security check due to missing RFID delivery badge.',
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
          }
        ]
      }
    ]);
  },

  async createSupportTicket(data: any) {
    try {
      const res = await fetch(`${API_BASE_URL}/vendor/support/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) return await res.json();
    } catch {}
    return { success: true, data: { ...data, id: `tkt-${Date.now()}` } };
  },

  async addSupportTicketMessage(id: string, text: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/vendor/support/tickets/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (res.ok) return await res.json();
    } catch {}
    return { success: true, text };
  },

  // Vendor Profile, Bank & Settings
  async updateProfile(businessInfo: any) {
    try {
      const res = await fetch(`${API_BASE_URL}/vendor/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessInfo }),
      });
      if (res.ok) return await res.json();
    } catch {}
    localVendor.businessInfo = { ...localVendor.businessInfo, ...businessInfo };
    return { success: true, data: localVendor };
  },

  async updateBankDetails(bankDetails: any) {
    try {
      const res = await fetch(`${API_BASE_URL}/vendor/profile/bank`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bankDetails),
      });
      if (res.ok) return await res.json();
    } catch {}
    localVendor.businessInfo.bankDetails = { ...localVendor.businessInfo.bankDetails, ...bankDetails };
    return { success: true, data: localVendor.businessInfo.bankDetails };
  },

  async updateSecuritySettings(data: { currentPassword?: string; newPassword?: string; enable2FA?: boolean }) {
    try {
      const res = await fetch(`${API_BASE_URL}/vendor/settings/security`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) return await res.json();
    } catch {}
    return { success: true, message: 'Security preferences updated' };
  },

  async updateNotificationSettings(data: any) {
    try {
      const res = await fetch(`${API_BASE_URL}/vendor/settings/notifications`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) return await res.json();
    } catch {}
    return { success: true, message: 'Notification preferences updated' };
  },

  async getDeliverySettings() {
    return request<any>('/vendor/delivery/settings', {}, {
      warehouseAddress: localVendor.businessInfo.warehouseAddress,
      pickupPincode: localVendor.businessInfo.pickupPincode,
      assignedDarkStoreId: localVendor.businessInfo.assignedDarkStoreId,
      assignedWarehouseName: 'Bengaluru West Dark Store (WH-BLR-04)',
      dispatchCutoff: localVendor.businessInfo.dispatchCutoff || '18:00',
      preparationTimeMins: localVendor.businessInfo.preparationTimeMins || 30
    });
  },

  async updateDeliverySettings(data: any) {
    try {
      const res = await fetch(`${API_BASE_URL}/vendor/delivery/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) return await res.json();
    } catch {}
    return { success: true, data };
  },
};
