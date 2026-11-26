// Centralized Environment Configuration for BUILDORA 60 Vendor Portal

function resolveApiBaseUrl(): { baseUrl: string; misconfiguredReason?: string } {
  const raw =
    typeof import.meta.env?.VITE_API_URL === 'string'
      ? import.meta.env.VITE_API_URL.trim().replace(/\/+$/, '')
      : '';

  if (raw) {
    // Reject localhost URLs in production bundles
    if (import.meta.env.PROD && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(raw)) {
      return {
        baseUrl: '',
        misconfiguredReason: 'Production VITE_API_URL cannot point to localhost.'
      };
    }
    // Enforce HTTPS when frontend is served over HTTPS (prevent Mixed Content errors)
    if (
      typeof window !== 'undefined' &&
      window.location?.protocol === 'https:' &&
      raw.startsWith('http://') &&
      !/^http:\/\/(localhost|127\.0\.0\.1)/i.test(raw)
    ) {
      return {
        baseUrl: raw.replace(/^http:\/\//i, 'https://')
      };
    }
    return { baseUrl: raw };
  }

  if (import.meta.env.DEV) {
    return { baseUrl: 'http://localhost:3000/api/v1' };
  }

  // Production with no VITE_API_URL configured
  return {
    baseUrl: '',
    misconfiguredReason: 'VITE_API_URL is not configured for production deployment.'
  };
}

const resolved = resolveApiBaseUrl();

export const VENDOR_APP_CONFIG = {
  apiBaseUrl: resolved.baseUrl,
  isApiConfigured: Boolean(resolved.baseUrl),
  apiMisconfiguredReason: resolved.misconfiguredReason,
  defaultTenantId: import.meta.env?.VITE_DEFAULT_TENANT_ID || 'tenant-buildora-blr',
  appName: import.meta.env?.VITE_APP_NAME || 'BUILDORA 60 Vendor Portal',
  requestTimeoutMs: 65000,
  uploadTimeoutMs: 75000,
  isDev: Boolean(import.meta.env?.DEV),
  isProd: Boolean(import.meta.env?.PROD)
} as const;
