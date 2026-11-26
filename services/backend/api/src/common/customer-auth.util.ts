import * as crypto from 'crypto';

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
