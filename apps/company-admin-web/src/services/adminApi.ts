import { useAdminAuthStore } from '../store/useAdminAuthStore';
import { ADMIN_APP_CONFIG } from '../config';

const API_BASE = ADMIN_APP_CONFIG.apiBaseUrl;

export const formatINR = (val: number | string | undefined) => {
  const n = Number(val || 0);
  return `₹${n.toLocaleString('en-IN')}`;
};

export const formatDate = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatDateTime = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

async function rawRequest<T = any>(
  path: string,
  options: RequestInit = {},
  retryRefresh = true
): Promise<T> {
  const store = useAdminAuthStore.getState();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (store.accessToken) {
    headers['Authorization'] = `Bearer ${store.accessToken}`;
  }
  if (store.tenant?.id) {
    headers['x-tenant-id'] = store.tenant.id;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ADMIN_APP_CONFIG.requestTimeoutMs);
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: controller.signal,
      headers,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (res.status === 401 && retryRefresh && store.refreshToken) {
    try {
      const refreshRes = await fetch(`${API_BASE}/company-admin/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: store.refreshToken }),
      });
      if (refreshRes.ok) {
        const refreshJson = await refreshRes.json();
        if (refreshJson?.data?.accessToken) {
          useAdminAuthStore.getState().setSession({
            user: refreshJson.data.user,
            tenant: refreshJson.data.tenant,
            accessToken: refreshJson.data.accessToken,
            refreshToken: refreshJson.data.refreshToken,
          });
          return rawRequest<T>(path, options, false);
        }
      }
      useAdminAuthStore.getState().clearSession();
    } catch {
      useAdminAuthStore.getState().clearSession();
    }
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.message || `Request failed with status ${res.status}`);
  }
  return json.data !== undefined ? json.data : json;
}

export const adminApi = {
  // Auth
  login: (payload: { email: string; password: string; tenantId?: string }) =>
    rawRequest<any>(
      '/company-admin/auth/login',
      { method: 'POST', body: JSON.stringify(payload) },
      false
    ),
  me: () => rawRequest<any>('/company-admin/auth/me'),
  logout: (refreshToken?: string) =>
    rawRequest<any>(
      '/company-admin/auth/logout',
      { method: 'POST', body: JSON.stringify({ refreshToken }) },
      false
    ),
  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    rawRequest<any>('/company-admin/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // Dashboard & Activity
  getDashboard: (period = '30d', from?: string, to?: string) => {
    const params = new URLSearchParams({ period });
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    return rawRequest<any>(`/company-admin/dashboard?${params.toString()}`);
  },
  getAuditLogs: (mod?: string) =>
    rawRequest<any[]>(
      `/company-admin/audit-logs${mod ? `?module=${encodeURIComponent(mod)}` : ''}`
    ),

  // Vendors
  getVendors: (status = 'ALL', search = '') =>
    rawRequest<any[]>(
      `/company-admin/vendors?status=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}`
    ),
  getVendorDetail: (id: string) => rawRequest<any>(`/company-admin/vendors/${id}`),
  approveVendor: (id: string, body?: { notes?: string; commissionRate?: number }) =>
    rawRequest<any>(`/company-admin/vendors/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify(body || {}),
    }),
  rejectVendor: (id: string, reason: string) =>
    rawRequest<any>(`/company-admin/vendors/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    }),
  requestVendorCorrection: (id: string, reason: string) =>
    rawRequest<any>(`/company-admin/vendors/${id}/request-correction`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    }),
  suspendVendor: (id: string, reason?: string) =>
    rawRequest<any>(`/company-admin/vendors/${id}/suspend`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    }),
  activateVendor: (id: string) =>
    rawRequest<any>(`/company-admin/vendors/${id}/activate`, { method: 'PATCH' }),
  verifyVendorDocument: (
    vendorId: string,
    docId: string,
    status: 'VERIFIED' | 'REJECTED',
    notes?: string
  ) =>
    rawRequest<any>(`/company-admin/vendors/${vendorId}/documents/${docId}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    }),

  // Products & Catalog
  getProducts: (status = 'ALL', search = '') =>
    rawRequest<any[]>(
      `/company-admin/products?status=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}`
    ),
  approveProduct: (id: string) =>
    rawRequest<any>(`/company-admin/products/${id}/approve`, { method: 'PATCH' }),
  rejectProduct: (id: string, reason: string) =>
    rawRequest<any>(`/company-admin/products/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    }),
  bulkApproveProducts: (productIds: string[]) =>
    rawRequest<any>('/company-admin/products/bulk-approve', {
      method: 'POST',
      body: JSON.stringify({ productIds }),
    }),
  updateProduct: (id: string, payload: Record<string, any>) =>
    rawRequest<any>(`/company-admin/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  toggleProductVisibility: (id: string, isActive: boolean) =>
    rawRequest<any>(`/company-admin/products/${id}/visibility`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    }),
  suspendProduct: (id: string, reason?: string) =>
    rawRequest<any>(`/company-admin/products/${id}/suspend`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    }),
  unsuspendProduct: (id: string) =>
    rawRequest<any>(`/company-admin/products/${id}/unsuspend`, {
      method: 'PATCH',
    }),
  getCatalogTaxonomy: () => rawRequest<any>('/company-admin/catalog/categories'),
  createMainCategory: (payload: any) =>
    rawRequest<any>('/company-admin/catalog/main-categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateMainCategory: (id: string, payload: any) =>
    rawRequest<any>(`/company-admin/catalog/main-categories/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  createChildCategory: (payload: any) =>
    rawRequest<any>('/company-admin/catalog/child-categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateChildCategory: (id: string, payload: any) =>
    rawRequest<any>(`/company-admin/catalog/child-categories/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  createProductType: (payload: any) =>
    rawRequest<any>('/company-admin/catalog/product-types', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateProductType: (id: string, payload: any) =>
    rawRequest<any>(`/company-admin/catalog/product-types/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  createNewLaunchCollection: (payload: any) =>
    rawRequest<any>('/company-admin/catalog/new-launches', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateNewLaunchCollection: (id: string, payload: any) =>
    rawRequest<any>(`/company-admin/catalog/new-launches/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  createCategory: (payload: any) =>
    rawRequest<any>('/company-admin/catalog/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  createBrand: (payload: any) =>
    rawRequest<any>('/company-admin/catalog/brands', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  createAttribute: (payload: any) =>
    rawRequest<any>('/company-admin/catalog/attributes', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Inventory & Warehouses
  getInventory: (filter = 'ALL', search = '') =>
    rawRequest<any>(
      `/company-admin/inventory?filter=${encodeURIComponent(filter)}&search=${encodeURIComponent(search)}`
    ),
  adjustInventory: (payload: {
    productId: string;
    adjustmentType: 'ADD' | 'SUBTRACT' | 'SET';
    quantity: number;
    reason?: string;
  }) =>
    rawRequest<any>('/company-admin/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getWarehouses: () => rawRequest<any[]>('/company-admin/warehouses'),
  createWarehouse: (payload: any) =>
    rawRequest<any>('/company-admin/warehouses', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Orders & Returns
  getOrders: (status = 'ALL', search = '') =>
    rawRequest<any[]>(
      `/company-admin/orders?status=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}`
    ),
  updateOrderStatus: (id: string, status: string, note?: string) =>
    rawRequest<any>(`/company-admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    }),
  getReturns: () => rawRequest<any[]>('/company-admin/returns'),
  reviewReturn: (id: string, status: 'APPROVED' | 'REJECTED' | 'REFUNDED', resolutionNote?: string) =>
    rawRequest<any>(`/company-admin/returns/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, resolutionNote }),
    }),

  // Quotations
  getQuotations: (status = 'ALL') =>
    rawRequest<any[]>(`/company-admin/quotations?status=${encodeURIComponent(status)}`),
  createQuotation: (payload: any) =>
    rawRequest<any>('/company-admin/quotations', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  assignVendorsToQuote: (id: string, vendorIds: string[]) =>
    rawRequest<any>(`/company-admin/quotations/${id}/assign-vendors`, {
      method: 'POST',
      body: JSON.stringify({ vendorIds }),
    }),
  recordVendorQuote: (id: string, payload: any) =>
    rawRequest<any>(`/company-admin/quotations/${id}/vendor-quote`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  negotiateQuotation: (id: string, message: string, proposedTotal?: number) =>
    rawRequest<any>(`/company-admin/quotations/${id}/negotiate`, {
      method: 'POST',
      body: JSON.stringify({ message, proposedTotal }),
    }),
  approveQuotation: (id: string, vendorId?: string, finalAmount?: number) =>
    rawRequest<any>(`/company-admin/quotations/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ vendorId, finalAmount }),
    }),
  rejectQuotation: (id: string, reason: string) =>
    rawRequest<any>(`/company-admin/quotations/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  convertQuotationToOrder: (id: string) =>
    rawRequest<any>(`/company-admin/quotations/${id}/convert-to-order`, { method: 'POST' }),

  // Pricing & Promotions
  getPricingPromotions: () => rawRequest<any>('/company-admin/pricing-promotions'),
  createCoupon: (payload: any) =>
    rawRequest<any>('/company-admin/coupons', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updatePromotionStatus: (id: string, status: 'ACTIVE' | 'EXPIRED') =>
    rawRequest<any>(`/company-admin/promotions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // Website Content
  getContent: (type = 'ALL') =>
    rawRequest<any[]>(`/company-admin/content?type=${encodeURIComponent(type)}`),
  createContent: (payload: any) =>
    rawRequest<any>('/company-admin/content', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateContentDraft: (id: string, payload: any) =>
    rawRequest<any>(`/company-admin/content/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  publishContent: (id: string) =>
    rawRequest<any>(`/company-admin/content/${id}/publish`, { method: 'POST' }),
  unpublishContent: (id: string) =>
    rawRequest<any>(`/company-admin/content/${id}/unpublish`, { method: 'POST' }),
  getKnowledgeHub: () => rawRequest<any>('/company-admin/content/knowledge-hub'),
  createKnowledgeArticle: (payload: any) =>
    rawRequest<any>('/company-admin/content/knowledge-hub', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Customers
  getCustomers: (type = 'ALL', search = '') =>
    rawRequest<any[]>(
      `/company-admin/customers?type=${encodeURIComponent(type)}&search=${encodeURIComponent(search)}`
    ),
  getCustomerDetail: (id: string) => rawRequest<any>(`/company-admin/customers/${id}`),
  toggleCustomerStatus: (id: string, status: 'ACTIVE' | 'BLOCKED') =>
    rawRequest<any>(`/company-admin/customers/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // Delivery & Logistics
  getDeliveryOverview: () => rawRequest<any>('/company-admin/delivery/overview'),
  createDeliveryPartner: (payload: any) =>
    rawRequest<any>('/company-admin/delivery/partners', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  assignDelivery: (payload: any) =>
    rawRequest<any>('/company-admin/delivery/assign', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateDeliveryStatus: (orderId: string, status: string) =>
    rawRequest<any>(`/company-admin/delivery/assignments/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // Finance
  getFinanceOverview: () => rawRequest<any>('/company-admin/finance/overview'),
  generateSettlement: (vendorId: string) =>
    rawRequest<any>('/company-admin/finance/settlements/generate', {
      method: 'POST',
      body: JSON.stringify({ vendorId }),
    }),
  markSettlementPaid: (
    id: string,
    payload: { paymentReference: string; paymentMode: string; remarks?: string }
  ) =>
    rawRequest<any>(`/company-admin/finance/settlements/${id}/mark-paid`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  // Team & Roles
  getTeam: () => rawRequest<any>('/company-admin/team'),
  inviteTeamMember: (payload: any) =>
    rawRequest<any>('/company-admin/team', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateTeamMember: (id: string, payload: any) =>
    rawRequest<any>(`/company-admin/team/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  // Reports
  getReports: (type = 'sales') =>
    rawRequest<any>(`/company-admin/reports?type=${encodeURIComponent(type)}`),

  // Support & Notifications
  getSupportNotifications: () => rawRequest<any>('/company-admin/support-notifications'),
  markAlertRead: (id: string) =>
    rawRequest<any>(`/company-admin/alerts/${id}/read`, { method: 'PATCH' }),
  markAllAlertsRead: () => rawRequest<any>('/company-admin/alerts/read-all', { method: 'POST' }),
  updateTicket: (id: string, status: string, resolutionNote?: string) =>
    rawRequest<any>(`/company-admin/tickets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, resolutionNote }),
    }),
  updateTemplate: (id: string, payload: any) =>
    rawRequest<any>(`/company-admin/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // Settings
  getSettings: () => rawRequest<any>('/company-admin/settings'),
  updateSettings: (payload: any) =>
    rawRequest<any>('/company-admin/settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
};
