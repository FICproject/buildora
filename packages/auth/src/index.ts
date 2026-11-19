// Authentication structures for BUILDORA 60

export interface JwtPayload {
  sub: string; // customer or user ID
  phone: string;
  tenantId: string;
  role: 'CUSTOMER' | 'CONTRACTOR' | 'VENDOR' | 'DELIVERY_PARTNER' | 'COMPANY_ADMIN' | 'PLATFORM_ADMIN';
  iat?: number;
  exp?: number;
}

export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: string;
    phone: string;
    name?: string;
    email?: string;
    role: string;
    tenantId: string;
  };
}

export function isValidIndianMobile(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return /^[6-9]\d{9}$/.test(cleaned.slice(-10));
}
