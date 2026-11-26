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

@Controller('api/v1/auth')
export class AuthController {
  @Post('request-otp')
  requestOtp(@Body() body: { phone: string }) {
    const cleanPhone = (body.phone || '').replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      return {
        success: false,
        message: 'Please provide a valid 10-digit Indian mobile number.',
      };
    }

    return {
      success: true,
      message: 'OTP sent successfully to +91 ' + cleanPhone,
      devOtpHint: '6060',
    };
  }

  @Post('verify-otp')
  async verifyOtp(@Body() body: { phone: string; otp: string; name?: string; email?: string }) {
    const { phone, otp } = body;
    if (!phone || !otp) {
      throw new UnauthorizedException('Phone and OTP are required');
    }

    if (otp !== '6060' && otp.length !== 4) {
      throw new UnauthorizedException('Invalid OTP. Use test OTP 6060.');
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      throw new UnauthorizedException('Invalid 10-digit phone number.');
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
    const customerRecord: any = existing || {
      id: customerId,
      tenantId: 'tenant-buildora-blr',
      name: body.name || 'Arjun Verma',
      phone: cleanPhone,
      email: body.email || `customer.${cleanPhone}@buildora.com`,
      customerType: 'CONTRACTOR' as const,
      gstin: cleanPhone === '9876543210' ? '29AABCB1234F1Z8' : undefined,
      businessName: cleanPhone === '9876543210' ? 'Apex Infra Construction Ltd' : undefined,
      totalOrders: 0,
      totalSpent: 0,
      walletBalance: 1250,
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
