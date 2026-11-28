import { VENDOR_APP_CONFIG } from '../config';

export class ApiClientError extends Error {
  status?: number;
  errors?: Record<string, string>;
  code?: string;

  constructor(
    message: string,
    options?: { status?: number; errors?: Record<string, string>; code?: string }
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.status = options?.status;
    this.errors = options?.errors;
    this.code = options?.code;
  }
}

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  timeoutMs?: number;
  includeAuth?: boolean;
  fallbackErrorMessage?: string;
  retryOnTransient?: boolean;
}

const TOKEN_STORAGE_KEY = 'buildora_vendor_token';
const REFRESH_TOKEN_STORAGE_KEY = 'buildora_vendor_refresh_token';
const PROFILE_STORAGE_KEY = 'buildora_vendor_profile';
let warmupAttempted = false;
let inFlightRefreshPromise: Promise<string | null> | null = null;
const inFlightGetMap = new Map<string, Promise<any>>();

export function saveVendorSessionTokens(token?: string, refreshToken?: string, vendor?: unknown): void {
  if (typeof localStorage === 'undefined') return;
  if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
  if (vendor) localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(vendor));
}

export function clearVendorSessionTokens(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  localStorage.removeItem(PROFILE_STORAGE_KEY);
}

async function refreshVendorAccessToken(): Promise<string | null> {
  if (typeof localStorage === 'undefined') return null;
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
  if (!refreshToken || !VENDOR_APP_CONFIG.apiBaseUrl) {
    return null;
  }
  if (inFlightRefreshPromise) {
    return inFlightRefreshPromise;
  }

  inFlightRefreshPromise = (async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(`${VENDOR_APP_CONFIG.apiBaseUrl}/vendor/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': VENDOR_APP_CONFIG.defaultTenantId
        },
        body: JSON.stringify({ refreshToken }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!res.ok) return null;
      const json = await res.json().catch(() => null);
      if (!json?.token) return null;
      saveVendorSessionTokens(json.token, json.refreshToken || refreshToken, json.vendor);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('buildora:vendor:session-refreshed', { detail: json }));
      }
      return json.token as string;
    } catch {
      return null;
    } finally {
      inFlightRefreshPromise = null;
    }
  })();

  return inFlightRefreshPromise;
}

/**
 * Quietly pings /health once on auth page load so sleeping Free-tier hosts (e.g. Render)
 * begin waking up before the vendor clicks Send Code or Sign In.
 */
export function warmupBackend(): void {
  if (warmupAttempted || !VENDOR_APP_CONFIG.isApiConfigured || !VENDOR_APP_CONFIG.apiBaseUrl) {
    return;
  }
  warmupAttempted = true;
  fetch(`${VENDOR_APP_CONFIG.apiBaseUrl}/health`, {
    method: 'GET',
    headers: { 'X-Tenant-ID': VENDOR_APP_CONFIG.defaultTenantId },
    signal: AbortSignal.timeout(VENDOR_APP_CONFIG.requestTimeoutMs)
  }).catch(() => {
    // Allow future warmup if initial attempt failed
    warmupAttempted = false;
  });
}

function isNetworkOrFetchFailure(err: unknown): boolean {
  if (!err) return false;
  if (err instanceof TypeError) return true;
  const msg = String((err as any)?.message || '').toLowerCase();
  return (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('network request failed') ||
    msg.includes('load failed') ||
    msg.includes('err_connection') ||
    msg.includes('econnrefused')
  );
}

export function mapFriendlyApiError(err: unknown, contextFallback?: string): ApiClientError {
  if (err instanceof ApiClientError) {
    return err;
  }

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return new ApiClientError('Network connection failed. Please check your internet connection.', {
      code: 'OFFLINE'
    });
  }

  if ((err as any)?.name === 'AbortError') {
    return new ApiClientError('Unable to connect to the server. Please try again.', {
      code: 'TIMEOUT'
    });
  }

  if (isNetworkOrFetchFailure(err)) {
    return new ApiClientError('Unable to connect to the server. Please try again.', {
      code: 'NETWORK_OR_SERVER_UNAVAILABLE'
    });
  }

  const rawMsg = (err as any)?.message;
  if (typeof rawMsg === 'string' && rawMsg.trim() && !/failed to fetch/i.test(rawMsg)) {
    return new ApiClientError(rawMsg, {
      status: (err as any)?.status,
      errors: (err as any)?.errors
    });
  }

  return new ApiClientError(contextFallback || 'Unable to connect to the server. Please try again.', {
    code: 'UNKNOWN'
  });
}

/**
 * Centralized HTTP client for BUILDORA 60 Vendor Portal.
 * Handles environment base URLs, auth headers, request timeouts, CORS-safe JSON parsing,
 * and maps technical network errors into clean vendor-facing messages.
 */
export async function apiRequest<T = any>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  if (!VENDOR_APP_CONFIG.isApiConfigured || !VENDOR_APP_CONFIG.apiBaseUrl) {
    throw new ApiClientError('Unable to connect to the server. Please try again.', {
      code: 'API_NOT_CONFIGURED'
    });
  }

  const {
    body,
    timeoutMs = body instanceof FormData
      ? VENDOR_APP_CONFIG.uploadTimeoutMs
      : VENDOR_APP_CONFIG.requestTimeoutMs,
    includeAuth = true,
    fallbackErrorMessage,
    retryOnTransient = (options.method || 'GET').toUpperCase() === 'GET',
    headers: customHeaders,
    ...restInit
  } = options;

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${VENDOR_APP_CONFIG.apiBaseUrl}${cleanPath}`;
  const method = (restInit.method || 'GET').toUpperCase();

  const execute = async (): Promise<T> => {
    const headers: Record<string, string> = {
      'X-Tenant-ID': VENDOR_APP_CONFIG.defaultTenantId,
      ...(customHeaders as Record<string, string>)
    };

    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    if (!isFormData && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    if (includeAuth && typeof localStorage !== 'undefined') {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (token && !headers['Authorization']) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const executeFetch = async (): Promise<Response> => {
      const maxAttempts = retryOnTransient ? 2 : 1;
      let resp: Response | undefined;
      let lastFetchErr: unknown;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
          resp = await fetch(url, {
            ...restInit,
            cache: restInit.cache || (method === 'GET' ? 'no-store' : undefined),
            headers: {
              ...(method === 'GET' ? { 'Cache-Control': 'no-cache' } : {}),
              ...headers,
            },
            body: isFormData ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (attempt < maxAttempts && [502, 503, 504].includes(resp.status)) {
            await new Promise((r) => setTimeout(r, 1500));
            continue;
          }
          return resp;
        } catch (err) {
          clearTimeout(timeoutId);
          lastFetchErr = err;
          const canRetry =
            attempt < maxAttempts &&
            (typeof navigator === 'undefined' || navigator.onLine !== false) &&
            ((err as any)?.name === 'AbortError' || isNetworkOrFetchFailure(err));
          if (canRetry) {
            await new Promise((r) => setTimeout(r, 1500));
            continue;
          }
          throw mapFriendlyApiError(err, fallbackErrorMessage);
        }
      }

      if (!resp) {
        throw mapFriendlyApiError(lastFetchErr, fallbackErrorMessage);
      }
      return resp;
    };

    let response = await executeFetch();

    // Handle 401 Unauthorized via automatic refresh-token replay or session expiry cleanup
    const isAuthEndpoint =
      cleanPath.startsWith('/vendor/auth/login') ||
      cleanPath.startsWith('/vendor/auth/refresh') ||
      cleanPath.startsWith('/vendor/auth/send-otp') ||
      cleanPath.startsWith('/vendor/auth/verify-otp') ||
      cleanPath.startsWith('/vendor/auth/forgot-password');

    if (response.status === 401 && includeAuth && !isAuthEndpoint) {
      const nextToken = await refreshVendorAccessToken();
      if (nextToken) {
        headers['Authorization'] = `Bearer ${nextToken}`;
        response = await executeFetch();
      } else {
        clearVendorSessionTokens();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('buildora:vendor:session-expired'));
        }
      }
    }

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    let parsed: any = null;

    try {
      parsed = isJson ? await response.json() : await response.text();
    } catch {
      parsed = null;
    }

    if (!response.ok) {
      if (!isJson && (response.status === 404 || response.status >= 500)) {
        throw new ApiClientError('Unable to connect to the server. Please try again.', {
          status: response.status,
          code: 'UPSTREAM_UNAVAILABLE'
        });
      }

      const rawMessage =
        typeof parsed === 'object' && parsed !== null
          ? Array.isArray(parsed.message)
            ? parsed.message[0]
            : parsed.message
          : undefined;
      const backendCode =
        typeof parsed === 'object' && parsed !== null && typeof parsed.code === 'string'
          ? parsed.code
          : undefined;

      if (response.status === 401) {
        throw new ApiClientError(rawMessage || 'Your session has expired. Please sign in again.', {
          status: 401,
          code: backendCode || 'SESSION_EXPIRED'
        });
      }

      if (response.status === 429) {
        throw new ApiClientError(
          rawMessage || 'Too many attempts. Please wait before trying again.',
          {
            status: 429,
            code: backendCode || 'ACCOUNT_LOCKED'
          }
        );
      }

      if (response.status >= 500 && !rawMessage) {
        throw new ApiClientError(
          fallbackErrorMessage || 'Unable to connect to the server. Please try again.',
          { status: response.status, code: backendCode || 'SERVER_ERROR' }
        );
      }

      throw new ApiClientError(
        rawMessage || fallbackErrorMessage || `Request failed (${response.status}).`,
        {
          status: response.status,
          code: backendCode,
          errors: typeof parsed === 'object' && parsed !== null ? parsed.errors : undefined
        }
      );
    }

    return parsed as T;
  };

  if (method === 'GET' && !body) {
    const tokenSuffix = includeAuth && typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) || '' : '';
    const dedupKey = `${url}::${tokenSuffix}`;
    const existing = inFlightGetMap.get(dedupKey);
    if (existing) {
      return existing as Promise<T>;
    }
    const promise = execute().finally(() => {
      inFlightGetMap.delete(dedupKey);
    });
    inFlightGetMap.set(dedupKey, promise);
    return promise;
  }

  return execute();
}
