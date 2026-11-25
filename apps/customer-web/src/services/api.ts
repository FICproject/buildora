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
  MASTER_CATEGORIES,
  MASTER_BRANDS,
  SEED_PRODUCTS,
  SEED_KNOWLEDGE_ARTICLES,
  SEED_FAQS
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
  const timeoutId = setTimeout(() => controller.abort(), 4000);

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
    // Network failure or backend unreachable -> fallback to rich local data
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

function applyLocalOverrides(products: Product[]): Product[] {
  try {
    const raw = localStorage.getItem('buildora_vendor_product_overrides');
    if (!raw) return products;
    const overrides: Record<string, Partial<Product>> = JSON.parse(raw);
    return products.map((p) => {
      const match = overrides[p.id] || overrides[p.sku] || overrides[p.slug];
      if (match) {
        return { ...p, ...match };
      }
      return p;
    });
  } catch {
    return products;
  }
}

export const api = {
  // Health & Diagnostics
  async getHealth() {
    return request<any>('/health', {}, { status: 'DEGRADED', mode: 'CLIENT_FALLBACK' });
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    return request<Category[]>('/categories', {}, MASTER_CATEGORIES);
  },

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const categories = await api.getCategories();
    return categories.find((c) => c.slug === slug);
  },

  // Brands
  async getBrands(): Promise<Brand[]> {
    return request<Brand[]>('/brands', {}, MASTER_BRANDS);
  },

  async getBrandBySlug(slug: string): Promise<Brand | undefined> {
    const brands = await api.getBrands();
    return brands.find((b) => b.slug === slug);
  },

  // Products
  async getProducts(params?: {
    category?: string;
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
    if (params?.category) queryParts.push(`category=${encodeURIComponent(params.category)}`);
    if (params?.brand) queryParts.push(`brand=${encodeURIComponent(params.brand)}`);
    if (params?.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
    if (params?.newLaunch) queryParts.push(`newLaunch=true`);

    const queryStr = queryParts.length ? `?${queryParts.join('&')}` : '';
    let products = await request<Product[]>(`/products${queryStr}`, {}, SEED_PRODUCTS);
    products = applyLocalOverrides(products);

    if (!params) return products;

    if (params.category) {
      products = products.filter((p) => p.categorySlug === params.category);
    }
    if (params.subcategory) {
      products = products.filter((p) => p.subcategorySlug === params.subcategory);
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
    const products = await api.getProducts();
    return products.find((p) => p.slug === slug);
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
  async requestOtp(phone: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(
      '/auth/request-otp',
      {
        method: 'POST',
        body: JSON.stringify({ phone })
      },
      { success: true, message: 'OTP sent (Dev OTP: 6060)' }
    );
  },

  async verifyOtp(
    phone: string,
    otp: string
  ): Promise<{ success: boolean; message: string; token?: string; user?: CustomerProfile }> {
    return request<any>(
      '/auth/verify-otp',
      {
        method: 'POST',
        body: JSON.stringify({ phone, otp })
      },
      {
        success: true,
        message: 'Signed in (fallback)',
        token: 'dev-token-6060',
        user: {
          id: 'cust-demo-1',
          name: 'Arjun Verma',
          phone: phone.replace(/\D/g, '').slice(-10),
          email: 'arjun.verma@buildora.com',
          isPhoneVerified: true,
          isEmailVerified: true,
          gstin: '29AABCB1234F1Z8',
          businessName: 'Apex Infra Construction Ltd',
          walletBalance: 1250,
          rewardPoints: 480,
          createdAt: new Date().toISOString()
        }
      }
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

  // Orders
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
    return request<any>('/wallet', {}, { balance: 1250, pendingBalance: 0, transactions: [] });
  },

  // Knowledge Hub & FAQ
  async getArticles(): Promise<KnowledgeArticle[]> {
    return request<KnowledgeArticle[]>('/knowledge-hub', {}, SEED_KNOWLEDGE_ARTICLES);
  },

  async getArticleBySlug(slug: string): Promise<KnowledgeArticle | undefined> {
    const articles = await api.getArticles();
    return articles.find((a) => a.slug === slug);
  },

  async getFaqs(): Promise<FaqItem[]> {
    return request<FaqItem[]>('/faqs', {}, SEED_FAQS);
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
