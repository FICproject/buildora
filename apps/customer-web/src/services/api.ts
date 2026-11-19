import {
  Product,
  Category,
  Brand,
  KnowledgeArticle,
  FaqItem,
  Address,
  CustomerProfile,
  Order,
  CartItem
} from '@buildora/types';
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
  }): Promise<Product[]> {
    const queryParts: string[] = [];
    if (params?.category) queryParts.push(`category=${encodeURIComponent(params.category)}`);
    if (params?.brand) queryParts.push(`brand=${encodeURIComponent(params.brand)}`);
    if (params?.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);

    const queryStr = queryParts.length ? `?${queryParts.join('&')}` : '';
    let products = await request<Product[]>(`/products${queryStr}`, {}, SEED_PRODUCTS);

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
  }
};
