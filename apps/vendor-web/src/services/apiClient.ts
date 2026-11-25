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
let warmupAttempted = false;

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

  const maxAttempts = retryOnTransient ? 2 : 1;
  let response: Response | undefined;
  let lastFetchError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      response = await fetch(url, {
        ...restInit,
        headers,
        body: isFormData ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      // Retry once on transient Render cold-start / upstream gateway statuses
      if (attempt < maxAttempts && [502, 503, 504].includes(response.status)) {
        await new Promise((r) => setTimeout(r, 1500));
        continue;
      }
      break;
    } catch (err) {
      clearTimeout(timeoutId);
      lastFetchError = err;
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

  if (!response) {
    throw mapFriendlyApiError(lastFetchError, fallbackErrorMessage);
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
    // Non-JSON 404/502/503/504 typically comes from an unreachable upstream / Render routing 404
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

    if (response.status >= 500 && !rawMessage) {
      throw new ApiClientError(
        fallbackErrorMessage || 'Unable to connect to the server. Please try again.',
        { status: response.status }
      );
    }

    throw new ApiClientError(
      rawMessage || fallbackErrorMessage || `Request failed (${response.status}).`,
      {
        status: response.status,
        errors: typeof parsed === 'object' && parsed !== null ? parsed.errors : undefined
      }
    );
  }

  if (parsed && typeof parsed === 'object' && parsed.token && typeof localStorage !== 'undefined') {
    // Callers can still manage token explicitly, left untouched unless auth endpoints store it
  }

  return parsed as T;
}
