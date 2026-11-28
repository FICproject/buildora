import * as crypto from 'crypto';
import { UnauthorizedException } from '@nestjs/common';

export interface CustomerTokenPayload {
  sub: string;
  phone: string;
  email?: string;
  name?: string;
  tenantId: string;
  role: 'CUSTOMER' | 'CONTRACTOR' | 'BUILDER';
  tokenType: 'CUSTOMER';
  iat: number;
  exp: number;
}

export interface CustomerRefreshTokenPayload {
  sub: string;
  phone: string;
  tenantId: string;
  tokenType: 'CUSTOMER_REFRESH';
  jti: string;
  iat: number;
  exp: number;
}

function getCustomerJwtSecret(): string {
  return (
    process.env.CUSTOMER_JWT_SECRET ||
    process.env.JWT_SECRET ||
    'buildora-customer-enterprise-secret-key-2026'
  );
}

export function signCustomerToken(user: {
  id: string;
  phone: string;
  email?: string;
  name?: string;
  tenantId?: string;
  role?: 'CUSTOMER' | 'CONTRACTOR' | 'BUILDER';
}): { accessToken: string; expiresIn: number } {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = 86400 * 14;
  const payloadObj: CustomerTokenPayload = {
    sub: user.id,
    phone: user.phone,
    email: user.email,
    name: user.name,
    tenantId: user.tenantId || 'tenant-buildora-blr',
    role: user.role || 'CONTRACTOR',
    tokenType: 'CUSTOMER',
    iat: now,
    exp: now + expiresIn,
  };
  const payload = Buffer.from(JSON.stringify(payloadObj)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', getCustomerJwtSecret())
    .update(`${header}.${payload}`)
    .digest('base64url');

  return {
    accessToken: `${header}.${payload}.${signature}`,
    expiresIn,
  };
}

export function verifyCustomerToken(authHeaderOrToken?: string): CustomerTokenPayload | null {
  if (!authHeaderOrToken || typeof authHeaderOrToken !== 'string') return null;
  const token = authHeaderOrToken.replace(/^Bearer\s+/i, '').trim();
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const [header, payload, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', getCustomerJwtSecret())
      .update(`${header}.${payload}`)
      .digest('base64url');

    if (signature.length !== expectedSig.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) return null;

    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) return null;
    if (decoded.tokenType !== 'CUSTOMER' || !decoded.sub) return null;
    return decoded as CustomerTokenPayload;
  } catch {
    return null;
  }
}

export function requireCustomer(authHeaderOrToken?: string): CustomerTokenPayload {
  const verified = verifyCustomerToken(authHeaderOrToken);
  if (!verified) {
    throw new UnauthorizedException('Authentication required. Please sign in to continue.');
  }
  return verified;
}

export function signCustomerRefreshToken(user: {
  id: string;
  phone: string;
  tenantId?: string;
}): { refreshToken: string; refreshExpiresIn: number } {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const refreshExpiresIn = 86400 * 30;
  const payloadObj: CustomerRefreshTokenPayload = {
    sub: user.id,
    phone: user.phone,
    tenantId: user.tenantId || 'tenant-buildora-blr',
    tokenType: 'CUSTOMER_REFRESH',
    jti: crypto.randomUUID(),
    iat: now,
    exp: now + refreshExpiresIn,
  };
  const payload = Buffer.from(JSON.stringify(payloadObj)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', getCustomerJwtSecret())
    .update(`${header}.${payload}`)
    .digest('base64url');

  return {
    refreshToken: `${header}.${payload}.${signature}`,
    refreshExpiresIn,
  };
}

export function verifyCustomerRefreshToken(token?: string): CustomerRefreshTokenPayload | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.trim().split('.');
  if (parts.length !== 3) return null;

  try {
    const [header, payload, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', getCustomerJwtSecret())
      .update(`${header}.${payload}`)
      .digest('base64url');

    if (signature.length !== expectedSig.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) return null;

    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) return null;
    if (decoded.tokenType !== 'CUSTOMER_REFRESH' || !decoded.sub) return null;
    return decoded as CustomerRefreshTokenPayload;
  } catch {
    return null;
  }
}
