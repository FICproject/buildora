import * as crypto from 'crypto';
import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { signCustomerToken, verifyCustomerToken } from '../../../common/customer-auth.util';
import { companyAdminDataService } from '../../company-admin/services/company-admin-data.service';
import {
  companyAdminPersistenceService,
  CompanyCustomerModel,
} from '../../company-admin/services/company-admin-persistence.service';

interface OtpChallengeRecord {
  otp: string;
  expiresAt: number;
  used: boolean;
  attempts: number;
}

const otpChallenges = new Map<string, OtpChallengeRecord>();

@Controller('api/v1/auth')
export class AuthController {
  @Post('request-otp')
  requestOtp(@Body() body: { phone: string }) {
    const cleanPhone = (body.phone || '').replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      return {
        success: false,
        message: 'Please provide a valid 10-digit Indian mobile number.',
      };
    }

    const isProd = process.env.NODE_ENV === 'production';
    const otp = isProd ? crypto.randomInt(1000, 9999).toString() : '6060';
    otpChallenges.set(cleanPhone, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
      used: false,
      attempts: 0,
    });

    return {
      success: true,
      message: 'OTP sent successfully to +91 ' + cleanPhone,
      cooldownSeconds: 30,
      ...(isProd ? {} : { devOtpHint: otp }),
    };
  }

  @Post('verify-otp')
  async verifyOtp(@Body() body: { phone: string; otp: string; name?: string; email?: string }) {
    const { phone, otp } = body;
    const cleanOtp = String(otp || '').trim();
    if (!phone || !cleanOtp) {
      throw new UnauthorizedException('Phone and OTP are required');
    }

    const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      throw new UnauthorizedException('Invalid 10-digit Indian mobile number.');
    }

    const isProd = process.env.NODE_ENV === 'production';
    const challenge = otpChallenges.get(cleanPhone);

    if (challenge) {
      if (challenge.used) {
        throw new UnauthorizedException('This OTP has already been used. Please request a new OTP.');
      }
      if (Date.now() > challenge.expiresAt) {
        throw new UnauthorizedException('OTP has expired. Please request a new OTP.');
      }
      if (challenge.attempts >= 5) {
        throw new UnauthorizedException('Too many invalid OTP attempts. Please request a new OTP.');
      }
      if (cleanOtp !== challenge.otp) {
        challenge.attempts += 1;
        throw new UnauthorizedException('Invalid OTP. Please check the 4-digit code and try again.');
      }
      challenge.used = true;
    } else if (!isProd && cleanOtp === '6060') {
      // Allow direct dev OTP once without prior request-otp, then mark consumed to prevent replay
      otpChallenges.set(cleanPhone, {
        otp: '6060',
        expiresAt: Date.now() + 5 * 60 * 1000,
        used: true,
        attempts: 0,
      });
    } else {
      throw new UnauthorizedException('Invalid or expired OTP. Please request a fresh OTP.');
    }

    const existing = Array.from(companyAdminDataService.customers.values()).find(
      (c) => c.phone === cleanPhone || c.id === `cust-${cleanPhone}`
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
      name: body.name || (isSeedDemo ? 'Arjun Verma' : 'Buildora Customer'),
      phone: cleanPhone,
      email: body.email || (isSeedDemo ? 'arjun.verma@buildora.com' : `customer.${cleanPhone}@buildora.com`),
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

    const { accessToken } = signCustomerToken({
      id: customerRecord.id,
      phone: customerRecord.phone,
      email: customerRecord.email,
      name: customerRecord.name,
      tenantId: customerRecord.tenantId,
      role: customerRecord.customerType === 'BUILDER' ? 'BUILDER' : 'CONTRACTOR',
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
      user,
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
  logout() {
    return {
      success: true,
      message: 'Logged out successfully',
    };
  }
}
