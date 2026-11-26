import {
  Product,
  Category,
  Brand,
  KnowledgeArticle,
  FaqItem,
  Address,
  CustomerProfile,
  Order,
  CartItem,
  ConstructionCalculatorInput,
  ConstructionCalculatorResult,
  SavedConstructionProject,
  ConstructionQuotationRequest
} from '@buildora/types';
import {
  calculateFullConstructionEstimate,
  SUPPORTED_INDIAN_LOCATIONS
} from '@buildora/utils';
import {
  MAIN_CATEGORIES_SEED,
  CHILD_CATEGORIES_SEED,
  PRODUCT_TYPES_SEED,
  resolveFullTaxonomy
} from '@buildora/constants';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
const DEFAULT_TENANT_ID = import.meta.env.VITE_DEFAULT_TENANT_ID || 'tenant-buildora-blr';

function getStoredToken(): string | null {
  try {
    const raw = localStorage.getItem('buildora-auth-storage');
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed.state?.token || null;
    }
  } catch {
    // Ignore storage parse errors
  }
  return null;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  fallbackData: T
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-tenant-id': DEFAULT_TENANT_ID,
    ...(options.headers as Record<string, string>)
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      return json.data !== undefined ? json.data : json;
    }
  } catch (err: any) {
    console.warn(`[BUILDORA API] Endpoint ${endpoint} fallback triggered:`, err.message);
  }

  return fallbackData;
}

async function postJson<T>(endpoint: string, body: any): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-tenant-id': DEFAULT_TENANT_ID,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Network request failed. Please check connection.'
    } as unknown as T;
  }
}

export const api = {
  // Health & Diagnostics
  async getHealth() {
    return request<any>('/health', {}, { status: 'DEGRADED', mode: 'OFFLINE' });
  },

  // Tenant Storefront Public Configuration (delivery, COD, tax, coupons, banners, warehouses)
  async getStoreConfig() {
    return request<any>('/config/store', { cache: 'no-store' }, null);
  },

  async getDeals(): Promise<{ coupons: any[]; promotions: any[]; dealsContent: any[]; products: Product[] }> {
    return request<any>('/deals', { cache: 'no-store' }, { coupons: [], promotions: [], dealsContent: [], products: [] });
  },

  async getFilters(category?: string, subcategory?: string): Promise<any> {
    const q = new URLSearchParams();
    if (category) q.set('category', category);
    if (subcategory) q.set('subcategory', subcategory);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return request<any>(`/filters${qs}`, { cache: 'no-store' }, { filterConfigs: [], availableFilters: [], attributes: [], brands: [], priceRange: null });
  },

  async getCoupons(): Promise<any[]> {
    return request<any[]>('/coupons', { cache: 'no-store' }, []);
  },

  // Taxonomy (4-level: Main Category -> Child Category -> Product Type -> Product + Desktop Navigation)
  async getTaxonomy(): Promise<{
    mainCategories: any[];
    childCategories: any[];
    productTypes: any[];
    navigationSections?: any[];
    desktopNavigation?: any[];
    publishMetadata?: any;
    tree: any[];
    newLaunchCollections: any[];
  }> {
    const fallbackTree = MAIN_CATEGORIES_SEED.map((mc) => {
      const children = CHILD_CATEGORIES_SEED.filter((c) => c.mainCategoryId === mc.id);
      return {
        ...mc,
        children: children.map((child) => ({
          ...child,
          productTypes: PRODUCT_TYPES_SEED.filter((pt) => pt.childCategoryId === child.id),
        })),
      };
    });
    const fallbackNavigationSections = MAIN_CATEGORIES_SEED.map((mc) => ({
      id: mc.id,
      name: mc.name,
      slug: mc.slug,
      sortOrder: mc.sortOrder,
      mainCategories: CHILD_CATEGORIES_SEED.filter((c) => c.mainCategoryId === mc.id).map((child) => ({
        id: child.id,
        name: child.name,
        slug: child.slug,
        sortOrder: child.sortOrder,
        departmentId: mc.id,
        departmentSlug: mc.slug,
        departmentName: mc.name,
        childCategories: PRODUCT_TYPES_SEED.filter((pt) => pt.childCategoryId === child.id).map((pt) => ({
          id: pt.id,
          name: pt.name,
          slug: pt.slug,
          sortOrder: pt.sortOrder,
          parentMainSlug: child.slug,
          parentMainName: child.name,
        })),
      })),
    }));
    const fallbackDesktopNavigation = [
      { id: 'nav-home', label: 'Home', slug: 'home', itemType: 'HOME', route: '/', icon: 'Home', hasDropdown: false, displayOrder: 1, isVisible: true, isActive: true },
      ...MAIN_CATEGORIES_SEED.map((mc, idx) => ({
        id: `nav-${mc.id}`,
        label: mc.name,
        slug: mc.slug,
        itemType: 'MAIN_CATEGORY',
        mainCategoryId: mc.id,
        mainCategorySlug: mc.slug,
        route: `/categories/${mc.slug}`,
        hasDropdown: true,
        displayOrder: idx + 2,
        isVisible: true,
        isActive: true,
      })),
      { id: 'nav-new-launches', label: 'New Launches', slug: 'new-launches', itemType: 'NEW_LAUNCHES', route: '/new-launches', icon: 'Rocket', hasDropdown: true, displayOrder: 98, isVisible: true, isActive: true },
      { id: 'nav-deals', label: 'Deals', slug: 'deals', itemType: 'DEALS', route: '/deals', icon: 'Sparkles', hasDropdown: false, highlight: true, displayOrder: 99, isVisible: true, isActive: true },
    ];
    return request<any>('/taxonomy', { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } }, {
      mainCategories: MAIN_CATEGORIES_SEED,
      childCategories: CHILD_CATEGORIES_SEED,
      productTypes: PRODUCT_TYPES_SEED,
      navigationSections: fallbackNavigationSections,
      desktopNavigation: fallbackDesktopNavigation,
      tree: fallbackTree,
      newLaunchCollections: [],
    });
  },

  async getNewLaunches(): Promise<{
    collections: any[];
    activeCollection: any | null;
    products: Product[];
  }> {
    const data = await request<any>('/new-launches', {}, {
      collections: [],
      activeCollection: null,
      products: [],
    });
    if (Array.isArray(data?.products)) {
      return data;
    }
    return {
      collections: [],
      activeCollection: null,
      products: [],
    };
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    return request<Category[]>('/categories', { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } }, []);
  },

  async getCategoryBySlug(slug: string): Promise<any | undefined> {
    const direct = await request<any | null>(`/categories/${encodeURIComponent(slug)}`, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } }, null);
    if (direct && (direct.slug || direct.id)) {
      return direct;
    }
    const categories = await api.getCategories();
    const child = categories.find((c) => c.slug === slug);
    if (child) return { ...child, level: 'CHILD' };
    const main = MAIN_CATEGORIES_SEED.find((m) => m.slug === slug);
    if (main) {
      return {
        ...main,
        level: 'MAIN',
        childCategories: CHILD_CATEGORIES_SEED.filter((c) => c.mainCategoryId === main.id),
      };
    }
    return undefined;
  },

  // Brands
  async getBrands(): Promise<Brand[]> {
    return request<Brand[]>('/brands', { cache: 'no-store' }, []);
  },

  async getBrandBySlug(slug: string): Promise<Brand | undefined> {
    const brands = await api.getBrands();
    return brands.find((b) => b.slug === slug);
  },

  // Products
  async getProducts(params?: {
    mainCategory?: string;
    childCategory?: string;
    category?: string;
    productType?: string;
    subcategory?: string;
    brand?: string;
    search?: string;
    featured?: boolean;
    dealOfTheDay?: boolean;
    bestSeller?: boolean;
    trending?: boolean;
    newLaunch?: boolean;
  }): Promise<Product[]> {
    const queryParts: string[] = [];
    if (params?.mainCategory) queryParts.push(`mainCategory=${encodeURIComponent(params.mainCategory)}`);
    if (params?.childCategory) queryParts.push(`childCategory=${encodeURIComponent(params.childCategory)}`);
    if (params?.category) queryParts.push(`category=${encodeURIComponent(params.category)}`);
    if (params?.productType) queryParts.push(`productType=${encodeURIComponent(params.productType)}`);
    if (params?.subcategory) queryParts.push(`subcategory=${encodeURIComponent(params.subcategory)}`);
    if (params?.brand) queryParts.push(`brand=${encodeURIComponent(params.brand)}`);
    if (params?.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
    if (params?.newLaunch) queryParts.push(`newLaunch=true`);

    const queryStr = queryParts.length ? `?${queryParts.join('&')}` : '';
    let products = await request<Product[]>(`/products${queryStr}`, {}, []);
    products = products.map((p) => {
      const resolved = resolveFullTaxonomy({
        mainInput: p.mainCategoryId || p.mainCategorySlug || p.mainCategoryName,
        childInput: p.childCategoryId || p.childCategorySlug || p.categorySlug || p.category,
        typeInput: p.productTypeId || p.productTypeSlug || p.subcategorySlug || p.subcategory,
      });
      return resolved.childCategory
        ? {
            ...p,
            mainCategoryId: p.mainCategoryId || resolved.mainCategory?.id,
            mainCategorySlug: p.mainCategorySlug || resolved.mainCategory?.slug,
            mainCategoryName: p.mainCategoryName || resolved.mainCategory?.name,
            department: (p as any).department || resolved.mainCategory?.name,
            childCategoryId: p.childCategoryId || resolved.childCategory.id,
            childCategorySlug: p.childCategorySlug || resolved.childCategory.slug,
            childCategoryName: p.childCategoryName || resolved.childCategory.name,
            categoryId: p.categoryId || resolved.childCategory.id,
            categorySlug: p.categorySlug || resolved.childCategory.slug,
            category: p.category || resolved.childCategory.name,
            productTypeId: p.productTypeId || resolved.productType?.id || p.subcategoryId,
            productTypeSlug: p.productTypeSlug || resolved.productType?.slug || p.subcategorySlug,
            productTypeName: p.productTypeName || resolved.productType?.name || p.subcategory,
            subcategoryId: p.subcategoryId || resolved.productType?.id,
            subcategorySlug: p.subcategorySlug || resolved.productType?.slug,
            subcategory: p.subcategory || resolved.productType?.name || '',
          }
        : p;
    });

    if (!params) return products;

    if (params.mainCategory) {
      const mcNeedle = params.mainCategory.toLowerCase();
      products = products.filter(
        (p) =>
          String(p.mainCategorySlug || '').toLowerCase() === mcNeedle ||
          String(p.mainCategoryId || '').toLowerCase() === mcNeedle ||
          String(p.mainCategoryName || (p as any).department || '').toLowerCase() === mcNeedle
      );
    }
    const childNeedleRaw = params.childCategory || params.category;
    if (childNeedleRaw) {
      const catNeedle = childNeedleRaw.toLowerCase();
      products = products.filter(
        (p) =>
          String(p.childCategorySlug || p.categorySlug || '').toLowerCase() === catNeedle ||
          String(p.childCategoryName || p.category || '').toLowerCase() === catNeedle ||
          String(p.childCategoryId || p.categoryId || '').toLowerCase() === catNeedle
      );
    }
    const typeNeedleRaw = params.productType || params.subcategory;
    if (typeNeedleRaw) {
      const subNeedle = typeNeedleRaw.toLowerCase();
      products = products.filter(
        (p) =>
          String(p.productTypeSlug || p.subcategorySlug || '').toLowerCase() === subNeedle ||
          String(p.productTypeName || p.subcategory || '').toLowerCase() === subNeedle ||
          String(p.productTypeId || p.subcategoryId || '').toLowerCase() === subNeedle
      );
    }
    if (params.brand) {
      products = products.filter((p) => p.brandSlug === params.brand);
    }
    if (params.featured) {
      products = products.filter((p) => p.isFeatured);
    }
    if (params.dealOfTheDay) {
      products = products.filter((p) => p.isDealOfTheDay);
    }
    if (params.bestSeller) {
      products = products.filter((p) => p.isBestSeller);
    }
    if (params.trending) {
      products = products.filter((p) => p.isTrending);
    }
    if (params.newLaunch) {
      products = products.filter((p) => p.isNewLaunch);
    }
    if (params.search) {
      const q = params.search.toLowerCase().trim();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)
      );
    }

    return products;
  },

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const direct = await request<Product | undefined>(
      `/products/${encodeURIComponent(slug)}`,
      {},
      undefined
    );
    if (direct) return direct;
    const products = await api.getProducts();
    return products.find((p) => p.slug === slug || p.id === slug);
  },

  async getProductReviews(idOrSlug: string) {
    return request<{ averageRating: number; totalCount: number; reviews: any[] }>(
      `/products/${encodeURIComponent(idOrSlug)}/reviews`,
      {},
      { averageRating: 4.8, totalCount: 0, reviews: [] }
    );
  },

  async createProductReview(
    idOrSlug: string,
    payload: { rating: number; comment: string; title?: string; customerName?: string }
  ) {
    return postJson<{ success: boolean; data?: any; message?: string }>(
      `/products/${encodeURIComponent(idOrSlug)}/reviews`,
      payload
    );
  },

  // Cart & Calculation
  async calculateCart(payload: {
    items: CartItem[];
    coupon?: string | null;
    deliverySpeed?: string;
    unloadingOptions?: any;
    walletBalanceToUse?: number;
  }) {
    return request<any>(
      '/cart/calculate',
      {
        method: 'POST',
        body: JSON.stringify(payload)
      },
      null
    );
  },

  async validateCartItems(
    items: Array<{ productId: string; variantId?: string; quantity: number; unitPrice?: number }>
  ) {
    return postJson<{ success: boolean; isValid: boolean; issues: any[]; validatedItems: any[] }>(
      '/cart/validate',
      { items }
    );
  },

  async validateCoupon(code: string, cartSubtotal?: number) {
    return postJson<{ success: boolean; message: string; data?: any }>('/coupons/validate', {
      code,
      cartSubtotal
    });
  },

  async validateCheckout(payload: any) {
    return postJson<{ success: boolean; errors?: string[]; data?: any }>('/checkout/validate', payload);
  },

  async checkServiceability(pincode: string) {
    return request<any>(`/serviceability/check?pincode=${encodeURIComponent(pincode)}`, {}, null);
  },

  // Authentication
  async requestOtp(phone: string): Promise<{ success: boolean; message: string; devOtpHint?: string }> {
    return postJson<{ success: boolean; message: string; devOtpHint?: string }>('/auth/request-otp', {
      phone,
    });
  },

  async verifyOtp(
    phone: string,
    otp: string
  ): Promise<{ success: boolean; message: string; token?: string; user?: CustomerProfile }> {
    return postJson<{ success: boolean; message: string; token?: string; user?: CustomerProfile }>(
      '/auth/verify-otp',
      { phone, otp }
    );
  },

  // Customer Profile & Address Book
  async getProfile(): Promise<CustomerProfile | null> {
    return request<CustomerProfile | null>('/customer/profile', {}, null);
  },

  async updateProfile(profile: Partial<CustomerProfile>): Promise<CustomerProfile | null> {
    return request<CustomerProfile | null>(
      '/customer/profile',
      {
        method: 'PUT',
        body: JSON.stringify(profile)
      },
      null
    );
  },

  // Secure Dual OTP Phone Number Change Flow
  async initiatePhoneChange(newPhone: string, currentPhone?: string) {
    return postJson<{
      success: boolean;
      message: string;
      sessionId?: string;
      maskedOldPhone?: string;
      maskedNewPhone?: string;
      cooldownSeconds?: number;
      devOtpHint?: string;
    }>('/customer/phone-change/initiate', { newPhone, currentPhone });
  },

  async verifyOldPhoneChange(sessionId: string, otp: string) {
    return postJson<{
      success: boolean;
      message: string;
      maskedOldPhone?: string;
      maskedNewPhone?: string;
      cooldownSeconds?: number;
      devOtpHint?: string;
    }>('/customer/phone-change/verify-old', { sessionId, otp });
  },

  async verifyNewPhoneChange(sessionId: string, otp: string) {
    return postJson<{
      success: boolean;
      message: string;
      maskedOldPhone?: string;
      maskedNewPhone?: string;
      readyForConfirmation?: boolean;
    }>('/customer/phone-change/verify-new', { sessionId, otp });
  },

  async resendPhoneChangeOtp(sessionId: string, target: 'OLD' | 'NEW') {
    return postJson<{
      success: boolean;
      message: string;
      cooldownSeconds?: number;
      devOtpHint?: string;
    }>('/customer/phone-change/resend', { sessionId, target });
  },

  async confirmPhoneChange(sessionId: string) {
    return postJson<{
      success: boolean;
      message: string;
      newPhone?: string;
      maskedNewPhone?: string;
      user?: CustomerProfile;
    }>('/customer/phone-change/confirm', { sessionId });
  },

  async cancelPhoneChange(sessionId: string) {
    return postJson<{
      success: boolean;
      message: string;
    }>('/customer/phone-change/cancel', { sessionId });
  },

  async getAddresses(): Promise<Address[]> {
    return request<Address[]>('/customer/addresses', {}, []);
  },

  async addAddress(address: Omit<Address, 'id'>): Promise<Address | null> {
    return request<Address | null>(
      '/customer/addresses',
      {
        method: 'POST',
        body: JSON.stringify(address)
      },
      null
    );
  },

  async deleteAddress(id: string): Promise<boolean> {
    return request<any>(
      `/customer/addresses/${id}`,
      {
        method: 'DELETE'
      },
      { success: true }
    );
  },

  // Orders & Payments
  async createRazorpayOrder(amount: number, buildoraOrderId?: string) {
    return postJson<{
      success: boolean;
      data?: { id: string; amount: number; currency: string; keyId: string };
      message?: string;
    }>('/payments/razorpay/order', { amount, buildoraOrderId });
  },

  async verifyRazorpayPayment(payload: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature?: string;
    buildoraOrderId?: string;
  }) {
    return postJson<{ success: boolean; data?: any; message?: string }>(
      '/payments/razorpay/verify',
      payload
    );
  },

  async failRazorpayPayment(payload: {
    razorpayOrderId?: string;
    buildoraOrderId?: string;
    reason?: string;
  }) {
    return postJson<{ success: boolean; message?: string }>('/payments/razorpay/fail', payload);
  },

  async getOrders(): Promise<Order[]> {
    return request<Order[]>('/orders', {}, []);
  },

  async getOrderById(idOrNumber: string): Promise<Order | null> {
    return request<Order | null>(`/orders/${idOrNumber}`, {}, null);
  },

  async trackOrder(idOrNumber: string): Promise<any> {
    return request<any>(`/orders/${idOrNumber}/track`, {}, null);
  },

  async createOrder(orderPayload: any): Promise<Order | null> {
    return request<Order | null>(
      '/orders',
      {
        method: 'POST',
        body: JSON.stringify(orderPayload)
      },
      null
    );
  },

  async cancelOrder(orderId: string): Promise<Order | null> {
    return request<Order | null>(
      `/orders/${orderId}/cancel`,
      {
        method: 'POST'
      },
      null
    );
  },

  async requestReturn(orderId: string, payload: { reason: string; items?: string[]; comments?: string }): Promise<Order | null> {
    return request<Order | null>(
      `/orders/${orderId}/return`,
      {
        method: 'POST',
        body: JSON.stringify(payload)
      },
      null
    );
  },

  // Wallet
  async getWallet(): Promise<any> {
    return request<any>('/wallet', {}, { currentBalance: 0, availableBalance: 0, pendingBalance: 0 });
  },

  async getWalletTransactions(type?: string, category?: string): Promise<any[]> {
    const qs = new URLSearchParams();
    if (type) qs.set('type', type);
    if (category) qs.set('category', category);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return request<any[]>(`/wallet/transactions${suffix}`, {}, []);
  },

  async topupWallet(amount: number, paymentReference = 'UPI Instant Top-Up') {
    return postJson<{ success: boolean; message?: string; data?: { transaction: any; newBalance: number } }>(
      '/wallet/topup',
      { amount, paymentReference }
    );
  },

  // Support Tickets
  async getSupportTickets(): Promise<any[]> {
    return request<any[]>('/support/tickets', {}, []);
  },

  async createSupportTicket(payload: {
    category: string;
    priority: string;
    subject: string;
    description: string;
    orderId?: string;
  }) {
    return postJson<{ success: boolean; data?: any }>('/support/tickets', payload);
  },

  async addSupportMessage(ticketId: string, message: string) {
    return postJson<{ success: boolean; data?: any }>(`/support/tickets/${ticketId}/messages`, {
      message,
    });
  },

  // Unified Notifications
  async getNotifications(): Promise<{ items: any[]; unreadCount: number }> {
    return request<{ items: any[]; unreadCount: number }>(
      '/notifications',
      {},
      { items: [], unreadCount: 0 }
    );
  },

  async markNotificationRead(id: string) {
    return request<any>(`/notifications/${id}/read`, { method: 'PATCH' }, { success: false });
  },

  async markAllNotificationsRead() {
    return postJson<any>('/notifications/mark-all-read', {});
  },

  // Knowledge Hub & FAQ
  async getArticles(): Promise<KnowledgeArticle[]> {
    return request<KnowledgeArticle[]>('/knowledge-hub', { cache: 'no-store' }, []);
  },

  async getArticleBySlug(slug: string): Promise<KnowledgeArticle | undefined> {
    const direct = await request<KnowledgeArticle | undefined>(`/knowledge-hub/${encodeURIComponent(slug)}`, {}, undefined);
    if (direct && (direct as any).id) return direct;
    const articles = await api.getArticles();
    return articles.find((a) => a.slug === slug);
  },

  async getFaqs(): Promise<FaqItem[]> {
    return request<FaqItem[]>('/faqs', { cache: 'no-store' }, []);
  },

  async getBengaluruZones(): Promise<any> {
    return request<any>(
      '/serviceability/bengaluru-zones',
      { method: 'GET' },
      null
    );
  },

  async getPublishedStorefrontContent(): Promise<any> {
    return request<any>('/content/storefront', { method: 'GET' }, null);
  },

  // ==========================================
  // Construction Calculator API Methods
  // ==========================================

  async getConstructionCalculatorConfig(): Promise<any> {
    return request<any>(
      '/construction-calculator/config',
      {},
      {
        success: true,
        locations: SUPPORTED_INDIAN_LOCATIONS
      }
    );
  },

  async calculateConstructionCost(
    input: ConstructionCalculatorInput
  ): Promise<ConstructionCalculatorResult> {
    try {
      const res = await request<{ success: boolean; data: ConstructionCalculatorResult }>(
        '/construction-calculator/calculate',
        {
          method: 'POST',
          body: JSON.stringify(input)
        },
        null
      );
      if (res && res.data) {
        return res.data;
      }
    } catch (e) {
      // Fallback to client-side engine
    }
    return calculateFullConstructionEstimate(input);
  },

  async getSavedConstructionProjects(userId?: string): Promise<SavedConstructionProject[]> {
    try {
      const res = await request<{ success: boolean; data: SavedConstructionProject[] }>(
        userId ? `/construction-calculator/projects?userId=${encodeURIComponent(userId)}` : '/construction-calculator/projects',
        {},
        null
      );
      if (res && res.data) return res.data;
    } catch (e) {
      // Fallback to localStorage
    }
    const local = localStorage.getItem('buildora_saved_construction_projects');
    return local ? JSON.parse(local) : [];
  },

  async saveConstructionProject(payload: {
    projectName: string;
    input: ConstructionCalculatorInput;
    userId?: string;
  }): Promise<SavedConstructionProject> {
    const localProjects = await api.getSavedConstructionProjects(payload.userId);
    const resultSnapshot = calculateFullConstructionEstimate(payload.input);
    const newProj: SavedConstructionProject = {
      id: `proj-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      userId: payload.userId || 'usr-customer-1',
      projectName: payload.projectName,
      input: payload.input,
      resultSnapshot,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const res = await request<{ success: boolean; data: SavedConstructionProject }>(
        '/construction-calculator/projects',
        {
          method: 'POST',
          body: JSON.stringify(payload)
        },
        null
      );
      if (res && res.data) {
        localProjects.unshift(res.data);
        localStorage.setItem('buildora_saved_construction_projects', JSON.stringify(localProjects));
        return res.data;
      }
    } catch (e) {
      // Fallback save in localStorage
    }

    localProjects.unshift(newProj);
    localStorage.setItem('buildora_saved_construction_projects', JSON.stringify(localProjects));
    return newProj;
  },

  async updateConstructionProject(
    id: string,
    payload: { projectName?: string; input?: ConstructionCalculatorInput }
  ): Promise<SavedConstructionProject | null> {
    const localProjects = await api.getSavedConstructionProjects();
    const idx = localProjects.findIndex((p) => p.id === id);

    try {
      const res = await request<{ success: boolean; data: SavedConstructionProject }>(
        `/construction-calculator/projects/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify(payload)
        },
        null
      );
      if (res && res.data) {
        if (idx !== -1) {
          localProjects[idx] = res.data;
          localStorage.setItem('buildora_saved_construction_projects', JSON.stringify(localProjects));
        }
        return res.data;
      }
    } catch (e) {
      // Local fallback
    }

    if (idx !== -1) {
      const current = localProjects[idx];
      const updatedInput = payload.input || current.input;
      const updatedProj: SavedConstructionProject = {
        ...current,
        projectName: payload.projectName || current.projectName,
        input: updatedInput,
        resultSnapshot: payload.input ? calculateFullConstructionEstimate(payload.input) : current.resultSnapshot,
        updatedAt: new Date().toISOString()
      };
      localProjects[idx] = updatedProj;
      localStorage.setItem('buildora_saved_construction_projects', JSON.stringify(localProjects));
      return updatedProj;
    }
    return null;
  },

  async deleteConstructionProject(id: string): Promise<boolean> {
    const localProjects = await api.getSavedConstructionProjects();
    const filtered = localProjects.filter((p) => p.id !== id);
    localStorage.setItem('buildora_saved_construction_projects', JSON.stringify(filtered));

    try {
      await request(
        `/construction-calculator/projects/${id}`,
        { method: 'DELETE' },
        null
      );
      return true;
    } catch (e) {
      return true;
    }
  },

  async requestConstructionQuotation(payload: {
    customerName: string;
    phone: string;
    email?: string;
    state: string;
    city: string;
    builtUpArea: number;
    categoriesRequested: string[];
    notes?: string;
  }): Promise<ConstructionQuotationRequest> {
    const fallbackQuote: ConstructionQuotationRequest = {
      id: `quote-${Date.now()}`,
      customerName: payload.customerName,
      phone: payload.phone,
      email: payload.email,
      state: payload.state,
      city: payload.city,
      builtUpArea: payload.builtUpArea,
      categoriesRequested: payload.categoriesRequested,
      notes: payload.notes,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    try {
      const res = await request<{ success: boolean; data: ConstructionQuotationRequest }>(
        '/construction-calculator/quotes',
        {
          method: 'POST',
          body: JSON.stringify(payload)
        },
        null
      );
      if (res && res.data) return res.data;
    } catch (e) {
      // Fallback
    }
    return fallbackQuote;
  }
};
