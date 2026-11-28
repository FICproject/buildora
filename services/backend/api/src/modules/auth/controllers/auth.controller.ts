import * as crypto from 'crypto';
import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  Req,
  HttpException,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  signCustomerToken,
  verifyCustomerToken,
  signCustomerRefreshToken,
  verifyCustomerRefreshToken,
} from '../../../common/customer-auth.util';
import { companyAdminDataService } from '../../company-admin/services/company-admin-data.service';
import {
  companyAdminPersistenceService,
  CompanyCustomerModel,
} from '../../company-admin/services/company-admin-persistence.service';
import { vendorNotificationService } from '../../vendors/services/vendor-notification.service';

const OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_SECONDS = 30;
const RESEND_COOLDOWN_MS = RESEND_COOLDOWN_SECONDS * 1000;
const MAX_VERIFY_ATTEMPTS = 5;
const SEND_WINDOW_MS = 10 * 60 * 1000;
const MAX_SENDS_PER_WINDOW = 5;
const IP_RATE_WINDOW_MS = 5 * 60 * 1000;
const MAX_REQUESTS_PER_IP = 30;

export interface OtpChallengeRecord {
  challengeId: string;
  otpHash: string;
  expiresAt: number;
  createdAt: number;
  lastSentAt: number;
  used: boolean;
  attempts: number;
  sendCount: number;
  sendWindowStart: number;
}

const otpChallenges = new Map<string, OtpChallengeRecord>();
const ipRateLimits = new Map<string, { count: number; windowStart: number }>();
const revokedRefreshJtis = new Set<string>();

/**
 * Development OTP mode is strictly limited to non-production backends with
 * CUSTOMER_OTP_MODE=development configured on the server. Client flags/headers
 * are never trusted to enable development OTP exposure.
 */
export function isCustomerDevOtpMode(env: NodeJS.ProcessEnv = process.env): boolean {
  const nodeEnv = String(env.NODE_ENV || 'development').trim().toLowerCase();
  const otpMode = String(env.CUSTOMER_OTP_MODE || '').trim().toLowerCase();
  return nodeEnv !== 'production' && otpMode === 'development';
}

export function generateCustomerOtp(): string {
  return crypto.randomInt(1000, 10000).toString();
}

export function hashCustomerOtp(challengeId: string, cleanPhone: string, otp: string): string {
  const secret =
    process.env.CUSTOMER_JWT_SECRET ||
    process.env.JWT_SECRET ||
    'buildora-customer-otp-hmac-key-2026';
  return crypto
    .createHmac('sha256', secret)
    .update(`${challengeId}:${cleanPhone}:${otp}`)
    .digest('hex');
}

function constantTimeHashEquals(expectedHex: string, actualHex: string): boolean {
  const a = Buffer.from(expectedHex, 'hex');
  const b = Buffer.from(actualHex, 'hex');
  if (a.length !== b.length || a.length === 0) return false;
  return crypto.timingSafeEqual(a, b);
}

function getClientIp(req?: any): string {
  const forwarded = req?.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return String(req?.ip || req?.socket?.remoteAddress || 'unknown');
}

function enforceIpRateLimit(key: string): void {
  const now = Date.now();
  const entry = ipRateLimits.get(key);
  if (!entry || now - entry.windowStart > IP_RATE_WINDOW_MS) {
    ipRateLimits.set(key, { count: 1, windowStart: now });
    return;
  }
  if (entry.count >= MAX_REQUESTS_PER_IP) {
    throw new HttpException(
      'Too many authentication requests from this network. Please wait a few minutes and try again.',
      HttpStatus.TOO_MANY_REQUESTS
    );
  }
  entry.count += 1;
}

@Controller('api/v1/auth')
export class AuthController {
  @Post('request-otp')
  async requestOtp(@Body() body: { phone?: string }, @Req() req?: any) {
    enforceIpRateLimit(`send:${getClientIp(req)}`);

    const cleanPhone = String(body?.phone || '').replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      throw new BadRequestException('Please provide a valid 10-digit Indian mobile number.');
    }

    const now = Date.now();
    const existing = otpChallenges.get(cleanPhone);

    if (existing) {
      const inSameWindow = now - existing.sendWindowStart < SEND_WINDOW_MS;
      const effectiveSendCount = inSameWindow ? existing.sendCount : 0;
      if (effectiveSendCount >= MAX_SENDS_PER_WINDOW) {
        const retryAfterSeconds = Math.max(
          1,
          Math.ceil((SEND_WINDOW_MS - (now - existing.sendWindowStart)) / 1000)
        );
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            code: 'OTP_RATE_LIMITED',
            retryAfterSeconds,
            message: `Too many OTP requests for +91 ${cleanPhone}. Please wait ${retryAfterSeconds}s before trying again.`,
          },
          HttpStatus.TOO_MANY_REQUESTS
        );
      }

      if (!existing.used && now < existing.expiresAt && now - existing.lastSentAt < RESEND_COOLDOWN_MS) {
        const retryAfterSeconds = Math.max(
          1,
          Math.ceil((RESEND_COOLDOWN_MS - (now - existing.lastSentAt)) / 1000)
        );
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            code: 'OTP_COOLDOWN',
            retryAfterSeconds,
            message: `Please wait ${retryAfterSeconds}s before requesting a new OTP.`,
          },
          HttpStatus.TOO_MANY_REQUESTS
        );
      }
    }

    // Generate dynamic 4-digit OTP and invalidate any previous challenge immediately
    const otp = generateCustomerOtp();
    const challengeId = crypto.randomUUID();
    const otpHash = hashCustomerOtp(challengeId, cleanPhone, otp);

    const sameWindow = existing && now - existing.sendWindowStart < SEND_WINDOW_MS;
    const challenge: OtpChallengeRecord = {
      challengeId,
      otpHash,
      expiresAt: now + OTP_TTL_MS,
      createdAt: now,
      lastSentAt: now,
      used: false,
      attempts: 0,
      sendCount: sameWindow ? existing.sendCount + 1 : 1,
      sendWindowStart: sameWindow ? existing.sendWindowStart : now,
    };

    otpChallenges.set(cleanPhone, challenge);

    const devOtpEnabled = isCustomerDevOtpMode();

    if (!devOtpEnabled) {
      const smsResult = await vendorNotificationService.sendSms({
        phone: cleanPhone,
        message: `Your BUILDORA 60 login OTP is ${otp}. Valid for 5 minutes. Do not share this code with anyone.`,
        otp,
      });

      if (!smsResult.delivered) {
        otpChallenges.delete(cleanPhone);
        throw new ServiceUnavailableException(
          'Unable to send OTP via SMS right now. Please contact support or try again shortly.'
        );
      }

      return {
        success: true,
        message: `OTP sent successfully to +91 ${cleanPhone}`,
        cooldownSeconds: RESEND_COOLDOWN_SECONDS,
        expiresInSeconds: OTP_TTL_MS / 1000,
      };
    }

    // Never expose dev OTP if somehow evaluated under NODE_ENV=production
    const exposeDevOtp = process.env.NODE_ENV !== 'production' && devOtpEnabled;

    return {
      success: true,
      message: `OTP sent successfully to +91 ${cleanPhone}`,
      cooldownSeconds: RESEND_COOLDOWN_SECONDS,
      expiresInSeconds: OTP_TTL_MS / 1000,
      ...(exposeDevOtp
        ? {
            otpMode: 'development',
            devOtp: otp,
            devOtpHint: otp,
          }
        : {}),
    };
  }

  @Post('verify-otp')
  async verifyOtp(
    @Body() body: { phone?: string; otp?: string; name?: string; email?: string },
    @Req() req?: any
  ) {
    enforceIpRateLimit(`verify:${getClientIp(req)}`);

    const cleanPhone = String(body?.phone || '').replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      throw new BadRequestException('Please provide a valid 10-digit Indian mobile number.');
    }

    const cleanOtp = String(body?.otp || '').trim();
    if (!/^\d{4}$/.test(cleanOtp)) {
      throw new BadRequestException('Please enter a valid 4-digit numeric OTP.');
    }

    const challenge = otpChallenges.get(cleanPhone);
    if (!challenge) {
      throw new UnauthorizedException('OTP session expired or not found. Please request a new OTP.');
    }

    if (challenge.used) {
      throw new UnauthorizedException('This OTP has already been used. Please request a new OTP.');
    }

    if (Date.now() > challenge.expiresAt) {
      throw new UnauthorizedException('OTP has expired. Please request a new OTP.');
    }

    if (challenge.attempts >= MAX_VERIFY_ATTEMPTS) {
      throw new HttpException(
        'Too many invalid OTP attempts. Please request a new OTP.',
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    const candidateHash = hashCustomerOtp(challenge.challengeId, cleanPhone, cleanOtp);
    if (!constantTimeHashEquals(challenge.otpHash, candidateHash)) {
      challenge.attempts += 1;
      if (challenge.attempts >= MAX_VERIFY_ATTEMPTS) {
        throw new HttpException(
          'Too many invalid OTP attempts. Please request a new OTP.',
          HttpStatus.TOO_MANY_REQUESTS
        );
      }
      throw new UnauthorizedException('Invalid OTP. Please check the 4-digit code and try again.');
    }

    // Consume synchronously before any async persistence work to prevent replay races
    challenge.used = true;

    const existing = Array.from(companyAdminDataService.customers.values()).find(
      (c) =>
        String(c.phone || '').replace(/\D/g, '').slice(-10) === cleanPhone ||
        c.id === `cust-${cleanPhone}`
    );

    if (existing && (existing.status === 'BLOCKED' || (existing.status as string) === 'SUSPENDED')) {
      throw new ForbiddenException(
        'Your account has been suspended by Buildora Compliance. Please contact support.'
      );
    }

    const customerId = existing?.id || `cust-${cleanPhone}`;
    const isSeedDemo = cleanPhone === '9876543210';
    const customerRecord: any = existing || {
      id: customerId,
      tenantId: 'tenant-buildora-blr',
      name: body?.name || (isSeedDemo ? 'Arjun Verma' : 'Buildora Customer'),
      phone: cleanPhone,
      email:
        body?.email ||
        (isSeedDemo ? 'arjun.verma@buildora.com' : `customer.${cleanPhone}@buildora.com`),
      customerType: 'CONTRACTOR' as const,
      gstin: isSeedDemo ? '29AABCB1234F1Z8' : undefined,
      businessName: isSeedDemo ? 'Apex Infra Construction Ltd' : undefined,
      totalOrders: 0,
      totalSpent: 0,
      walletBalance: isSeedDemo ? 1250 : 0,
      status: 'ACTIVE' as const,
      city: 'Bengaluru',
      pincode: '560001',
      recentActivity: [],
      createdAt: new Date().toISOString(),
    };

    if (!existing) {
      companyAdminDataService.customers.set(customerId, customerRecord);
      await companyAdminPersistenceService.upsert(CompanyCustomerModel, customerRecord);
    }

    const { accessToken, expiresIn } = signCustomerToken({
      id: customerRecord.id,
      phone: customerRecord.phone,
      email: customerRecord.email,
      name: customerRecord.name,
      tenantId: customerRecord.tenantId,
      role: customerRecord.customerType === 'BUILDER' ? 'BUILDER' : 'CONTRACTOR',
    });

    const { refreshToken, refreshExpiresIn } = signCustomerRefreshToken({
      id: customerRecord.id,
      phone: customerRecord.phone,
      tenantId: customerRecord.tenantId,
    });

    const user = {
      id: customerRecord.id,
      name: customerRecord.name,
      phone: customerRecord.phone,
      email: customerRecord.email,
      isPhoneVerified: true,
      isEmailVerified: true,
      gstin: customerRecord.gstin || '',
      businessName: customerRecord.businessName || '',
      walletBalance: customerRecord.walletBalance ?? 0,
      rewardPoints: 480,
      status: customerRecord.status,
      role: customerRecord.customerType,
      createdAt: customerRecord.createdAt,
    };

    return {
      success: true,
      message: 'Authentication successful',
      token: accessToken,
      refreshToken,
      expiresIn,
      refreshExpiresIn,
      user,
    };
  }

  @Post('refresh')
  refreshSession(@Body() body: { refreshToken?: string }) {
    const refreshToken = String(body?.refreshToken || '').trim();
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required.');
    }

    const verified = verifyCustomerRefreshToken(refreshToken);
    if (!verified || revokedRefreshJtis.has(verified.jti)) {
      throw new UnauthorizedException('Invalid or expired refresh token. Please sign in again.');
    }

    const customer = companyAdminDataService.customers.get(verified.sub) as any;
    if (customer && (customer.status === 'BLOCKED' || (customer.status as string) === 'SUSPENDED')) {
      throw new ForbiddenException(
        'Your account has been suspended by Buildora Compliance. Please contact support.'
      );
    }

    const { accessToken, expiresIn } = signCustomerToken({
      id: customer?.id || verified.sub,
      phone: customer?.phone || verified.phone,
      email: customer?.email,
      name: customer?.name,
      tenantId: customer?.tenantId || verified.tenantId,
      role: customer?.customerType === 'BUILDER' ? 'BUILDER' : 'CONTRACTOR',
    });

    return {
      success: true,
      token: accessToken,
      expiresIn,
    };
  }

  @Get('session')
  getSession(@Headers('authorization') authHeader?: string) {
    if (!authHeader) {
      return {
        authenticated: false,
        user: null,
      };
    }

    const verified = verifyCustomerToken(authHeader);
    if (!verified) {
      return {
        authenticated: false,
        user: null,
      };
    }

    const customer = companyAdminDataService.customers.get(verified.sub) as any;
    if (customer && (customer.status === 'BLOCKED' || (customer.status as string) === 'SUSPENDED')) {
      return {
        authenticated: false,
        suspended: true,
        user: null,
      };
    }

    return {
      authenticated: true,
      user: customer
        ? {
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            isPhoneVerified: true,
            gstin: customer.gstin || '',
            businessName: customer.businessName || '',
            walletBalance: customer.walletBalance ?? 0,
            rewardPoints: 480,
            status: customer.status,
          }
        : {
            id: verified.sub,
            name: verified.name || 'Buildora Customer',
            phone: verified.phone,
            email: verified.email || '',
            isPhoneVerified: true,
            walletBalance: 0,
            rewardPoints: 0,
            status: 'ACTIVE',
          },
    };
  }

  @Post('logout')
  logout(@Body() body?: { refreshToken?: string }) {
    if (body?.refreshToken) {
      const verified = verifyCustomerRefreshToken(body.refreshToken);
      if (verified?.jti) {
        revokedRefreshJtis.add(verified.jti);
      }
    }
    return {
      success: true,
      message: 'Logged out successfully',
    };
  }
}
