import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import * as crypto from 'crypto';

export type CompanyAdminRole =
  | 'COMPANY_OWNER'
  | 'COMPANY_ADMIN'
  | 'OPERATIONS_MANAGER'
  | 'CATALOG_MANAGER'
  | 'INVENTORY_MANAGER'
  | 'FINANCE_MANAGER'
  | 'SUPPORT_MANAGER';

export const COMPANY_ADMIN_PERMISSION_MATRIX: Record<CompanyAdminRole, string[]> = {
  COMPANY_OWNER: ['*'],
  COMPANY_ADMIN: [
    'dashboard:read',
    'vendors:read',
    'vendors:manage',
    'products:read',
    'products:manage',
    'inventory:read',
    'inventory:manage',
    'orders:read',
    'orders:manage',
    'quotations:read',
    'quotations:manage',
    'pricing:read',
    'pricing:manage',
    'content:read',
    'content:publish',
    'customers:read',
    'customers:manage',
    'warehouses:read',
    'warehouses:manage',
    'delivery:read',
    'delivery:manage',
    'finance:read',
    'finance:settle',
    'team:read',
    'team:manage',
    'reports:read',
    'support:read',
    'support:manage',
    'settings:read',
    'settings:manage',
  ],
  OPERATIONS_MANAGER: [
    'dashboard:read',
    'vendors:read',
    'inventory:read',
    'inventory:manage',
    'orders:read',
    'orders:manage',
    'quotations:read',
    'quotations:manage',
    'warehouses:read',
    'warehouses:manage',
    'delivery:read',
    'delivery:manage',
    'reports:read',
    'support:read',
  ],
  CATALOG_MANAGER: [
    'dashboard:read',
    'products:read',
    'products:manage',
    'pricing:read',
    'pricing:manage',
    'content:read',
    'content:publish',
    'reports:read',
  ],
  INVENTORY_MANAGER: [
    'dashboard:read',
    'inventory:read',
    'inventory:manage',
    'warehouses:read',
    'warehouses:manage',
    'orders:read',
    'reports:read',
  ],
  FINANCE_MANAGER: [
    'dashboard:read',
    'vendors:read',
    'orders:read',
    'finance:read',
    'finance:settle',
    'pricing:read',
    'reports:read',
  ],
  SUPPORT_MANAGER: [
    'dashboard:read',
    'customers:read',
    'customers:manage',
    'orders:read',
    'support:read',
    'support:manage',
    'vendors:read',
  ],
};

export interface CompanyAdminTokenPayload {
  sub: string;
  email: string;
  name: string;
  role: CompanyAdminRole;
  tenantId: string;
  permissions: string[];
  tokenType: 'COMPANY_ADMIN';
  iat: number;
  exp: number;
}

@Injectable()
export class CompanyAdminSecurityService {
  private lockoutStore: Map<string, { attempts: number; lockedUntil: number }> = new Map();
  private refreshTokenStore: Map<
    string,
    { userId: string; tenantId: string; email: string; expiresAt: number }
  > = new Map();
  private rateLimitStore: Map<string, number[]> = new Map();

  private getJwtSecret(): string {
    return (
      process.env.COMPANY_ADMIN_JWT_SECRET ||
      process.env.JWT_SECRET ||
      'buildora-company-admin-secret-2026'
    );
  }

  hashPassword(password: string): string {
    if (!password || password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long.');
    }
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  verifyPassword(password: string, storedHash: string): boolean {
    if (!password || !storedHash || !storedHash.includes(':')) return false;
    try {
      const [salt, originalHash] = storedHash.split(':');
      const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
      const bufA = Buffer.from(verifyHash, 'hex');
      const bufB = Buffer.from(originalHash, 'hex');
      if (bufA.length !== bufB.length) return false;
      return crypto.timingSafeEqual(bufA, bufB);
    } catch {
      return false;
    }
  }

  checkRateLimit(key: string, maxRequests = 120, windowMs = 60_000): void {
    const now = Date.now();
    const recent = (this.rateLimitStore.get(key) || []).filter((t) => now - t < windowMs);
    if (recent.length >= maxRequests) {
      throw new HttpException(
        { success: false, message: 'Rate limit exceeded. Please retry shortly.' },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }
    recent.push(now);
    this.rateLimitStore.set(key, recent);
  }

  checkLockout(email: string): void {
    const clean = email.trim().toLowerCase();
    const record = this.lockoutStore.get(clean);
    if (!record) return;
    if (Date.now() < record.lockedUntil) {
      const mins = Math.ceil((record.lockedUntil - Date.now()) / 60000);
      throw new HttpException(
        {
          success: false,
          message: `Account temporarily locked after 5 failed attempts. Try again in ${mins} minute(s).`,
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }
    if (record.lockedUntil > 0 && Date.now() >= record.lockedUntil) {
      this.lockoutStore.delete(clean);
    }
  }

  recordFailedLogin(email: string): { isLocked: boolean; remaining: number } {
    const clean = email.trim().toLowerCase();
    const current = this.lockoutStore.get(clean) || { attempts: 0, lockedUntil: 0 };
    current.attempts += 1;
    if (current.attempts >= 5) {
      current.lockedUntil = Date.now() + 15 * 60 * 1000;
      this.lockoutStore.set(clean, current);
      return { isLocked: true, remaining: 0 };
    }
    this.lockoutStore.set(clean, current);
    return { isLocked: false, remaining: 5 - current.attempts };
  }

  clearFailedLogins(email: string): void {
    this.lockoutStore.delete(email.trim().toLowerCase());
  }

  generateTokens(user: {
    id: string;
    email: string;
    name: string;
    role: CompanyAdminRole;
    tenantId: string;
    permissions?: string[];
  }): { accessToken: string; refreshToken: string; expiresIn: number } {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const now = Math.floor(Date.now() / 1000);
    const resolvedPermissions =
      user.permissions && user.permissions.length > 0
        ? user.permissions
        : COMPANY_ADMIN_PERMISSION_MATRIX[user.role] || [];

    const payloadObj: CompanyAdminTokenPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      permissions: resolvedPermissions,
      tokenType: 'COMPANY_ADMIN',
      iat: now,
      exp: now + 8 * 3600,
    };

    const payload = Buffer.from(JSON.stringify(payloadObj)).toString('base64url');
    const sig = crypto
      .createHmac('sha256', this.getJwtSecret())
      .update(`${header}.${payload}`)
      .digest('base64url');

    const accessToken = `${header}.${payload}.${sig}`;
    const refreshToken = `ca_rf_${crypto.randomBytes(32).toString('hex')}`;
    this.refreshTokenStore.set(refreshToken, {
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      expiresAt: Date.now() + 7 * 24 * 3600 * 1000,
    });

    return { accessToken, refreshToken, expiresIn: 8 * 3600 };
  }

  verifyAccessToken(authHeader?: string): CompanyAdminTokenPayload {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Company Admin bearer token is required.');
    }
    const token = authHeader.slice(7).trim();
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('Invalid Company Admin access token format.');
    }

    const [header, payload, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', this.getJwtSecret())
      .update(`${header}.${payload}`)
      .digest('base64url');

    if (signature.length !== expectedSig.length) {
      throw new UnauthorizedException('Invalid token signature.');
    }
    const sigMatch = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig));
    if (!sigMatch) {
      throw new UnauthorizedException('Invalid token signature.');
    }

    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('Session expired. Please sign in again.');
    }
    if (decoded.tokenType !== 'COMPANY_ADMIN' || !decoded.tenantId) {
      throw new ForbiddenException(
        'Access denied: Token does not belong to an authorized Company Admin account.'
      );
    }
    if ((decoded.role as string) === 'PLATFORM_ADMIN' || (decoded.role as string) === 'VENDOR') {
      throw new ForbiddenException('Role isolation violation: Unauthorized portal role.');
    }

    return decoded as CompanyAdminTokenPayload;
  }

  consumeRefreshToken(refreshToken: string) {
    const entry = this.refreshTokenStore.get(refreshToken);
    if (!entry || Date.now() > entry.expiresAt) {
      if (entry) this.refreshTokenStore.delete(refreshToken);
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }
    this.refreshTokenStore.delete(refreshToken);
    return entry;
  }

  revokeRefreshToken(refreshToken?: string): void {
    if (refreshToken) this.refreshTokenStore.delete(refreshToken);
  }

  assertPermission(admin: CompanyAdminTokenPayload, permission: string): void {
    if (admin.role === 'COMPANY_OWNER' || admin.permissions.includes('*')) return;
    if (!admin.permissions.includes(permission)) {
      throw new ForbiddenException(`Missing required permission: ${permission}`);
    }
  }

  assertTenantAccess(admin: CompanyAdminTokenPayload, requestedTenantId?: string): string {
    if (requestedTenantId && requestedTenantId !== admin.tenantId) {
      throw new ForbiddenException(
        'Tenant isolation violation: Cannot access resources belonging to another company.'
      );
    }
    return admin.tenantId;
  }
}

export const companyAdminSecurityService = new CompanyAdminSecurityService();
