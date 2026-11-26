const rawApiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api/v1';

function normalizeApiUrl(url: string): string {
  const clean = url.trim().replace(/\/+$/, '');
  return clean.endsWith('/api/v1') ? clean : `${clean}/api/v1`;
}

export const ADMIN_APP_CONFIG = {
  apiBaseUrl: normalizeApiUrl(rawApiUrl),
  defaultTenantId: (import.meta as any).env?.VITE_DEFAULT_TENANT_ID || 'tenant-buildora-blr',
  requestTimeoutMs: 45000,
};
