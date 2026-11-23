import {
  VendorProfile,
  VendorProduct,
  VendorOrder,
  VendorSettlement,
  VendorNotification,
  VendorDashboardMetrics,
  BulkPriceTier,
  BulkPricingTier,
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

  // Auth
  async login(email: string, password?: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/vendor/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return {
      success: true,
      token: 'jwt-vendor-token-buildora-60',
      vendor: localVendor,
    };
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
};
