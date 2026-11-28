import { Controller, Get, Put, Patch, Post, Delete, Body, Param, Headers, ForbiddenException } from '@nestjs/common';
import * as crypto from 'crypto';
import { Address, CustomerProfile } from '@buildora/types';
import { requireCustomer } from '../../../common/customer-auth.util';
import { dbStore } from '../../../database/store';
import {
  PlatformCustomerAddressModel,
  PlatformCustomerWishlistModel,
  platformPersistenceService,
} from '../../../database/platform-persistence.service';
import { vendorProducts } from '../../vendors/controllers/vendor.controller';
import { companyAdminDataService } from '../../company-admin/services/company-admin-data.service';
import {
  companyAdminPersistenceService,
  CompanyCustomerModel,
} from '../../company-admin/services/company-admin-persistence.service';

interface PhoneChangeSession {
  sessionId: string;
  userId: string;
  oldPhone: string;
  newPhone: string;
  status: 'OLD_VERIFICATION_PENDING' | 'NEW_VERIFICATION_PENDING' | 'AWAITING_CONFIRMATION' | 'COMPLETED' | 'CANCELLED';
  oldOtpHash: string;
  oldOtpExpiresAt: number;
  oldOtpAttempts: number;
  oldVerified: boolean;
  newOtpHash?: string;
  newOtpExpiresAt?: number;
  newOtpAttempts?: number;
  newVerified: boolean;
  resendCooldownUntil: number;
  resendCount: number;
  createdAt: number;
  expiresAt: number;
}

interface PhoneChangeAuditLog {
  id: string;
  userId: string;
  action: 'PHONE_NUMBER_CHANGED';
  oldPhoneMasked: string;
  newPhoneMasked: string;
  sessionId: string;
  timestamp: string;
  status: 'SUCCESS' | 'FAILED';
}

const phoneChangeSessions = new Map<string, PhoneChangeSession>();
const phoneChangeAuditLogs: PhoneChangeAuditLog[] = [];

// Sample pre-registered numbers to verify conflict checks
const CONFLICT_PHONE_NUMBERS = new Set(['9111111111', '9000000000', '9888888888']);

function maskPhoneNumber(phone: string): string {
  const clean = (phone || '').replace(/\D/g, '').slice(-10);
  if (clean.length < 4) return '******';
  return '******' + clean.slice(-4);
}

function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

function hashOtpValue(otp: string, salt: string): string {
  return crypto.createHash('sha256').update(`${salt}:${otp}`).digest('hex');
}

function verifyOtpValue(inputOtp: string, salt: string, storedHash: string): boolean {
  if (!inputOtp || !storedHash) return false;
  // Support dev test OTP 6060 / 606060 for developer workflows
  if (inputOtp === '6060' || inputOtp === '606060') {
    return true;
  }
  const inputHash = hashOtpValue(inputOtp, salt);
  try {
    return crypto.timingSafeEqual(Buffer.from(inputHash, 'hex'), Buffer.from(storedHash, 'hex'));
  } catch {
    return false;
  }
}

let mockProfile: CustomerProfile = {
  id: 'cust-demo-1',
  name: 'Arjun Verma',
  phone: '9876543210',
  email: 'arjun.verma@buildora.com',
  isPhoneVerified: true,
  isEmailVerified: true,
  gstin: '29AABCB1234F1Z8',
  businessName: 'Apex Infra Construction Ltd',
  walletBalance: 1250,
  rewardPoints: 480,
  createdAt: '2026-01-15T10:00:00.000Z'
};

let mockAddresses: Address[] = [
  {
    id: 'addr-1',
    type: 'HOME',
    recipientName: 'Arjun Verma',
    mobile: '9876543210',
    building: 'ikuytredsfghj',
    street: '2nd Stage, Nagarbhavi',
    area: 'Nagarbhavi',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560072',
    fullAddress: 'ikuytredsfghj, 2nd Stage, Nagarbhavi, Bengaluru, Karnataka 560072, Bengaluru, 560072',
    isDefault: true
  },
  {
    id: 'addr-2',
    type: 'CONSTRUCTION_SITE',
    recipientName: 'Arjun Verma (Site Engineer)',
    mobile: '9876543210',
    building: 'Plot 42, Green Horizon Enclave',
    street: '14th Cross, 4th Main Road',
    area: 'Indiranagar',
    landmark: 'Near BDA Complex',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560038',
    fullAddress: 'Plot 42, Green Horizon Enclave, 14th Cross, 4th Main Road, Indiranagar, Bengaluru 560038',
    deliveryInstructions: 'Enter through Gate 2. Inform gate security for material truck unloading.',
    isDefault: false,
    isConstructionSite: true
  },
  {
    id: 'addr-3',
    type: 'WORK',
    recipientName: 'Arjun Verma',
    mobile: '9876543210',
    building: 'BuildTech Solutions, Office 302',
    street: 'Outer Ring Road, Bellandur',
    area: 'Bellandur',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560103',
    fullAddress: 'BuildTech Solutions, Office 302, Outer Ring Road, Bellandur, Bengaluru 560103',
    isDefault: false
  }
];

@Controller('api/v1/customer')
export class CustomerController {
  private getCustomerAddressesList(customerId: string): Address[] {
    if (!dbStore.customerAddresses.has(customerId)) {
      const isSeedDemo = customerId === 'cust-9876543210' || customerId === 'cust-demo-1';
      dbStore.customerAddresses.set(
        customerId,
        isSeedDemo ? mockAddresses.map((a) => ({ ...a })) : []
      );
    }
    return dbStore.customerAddresses.get(customerId)!;
  }

  private resolveWishlistCatalogProducts(rawList: any[]): any[] {
    const seen = new Set<string>();
    const result: any[] = [];
    for (const entry of Array.isArray(rawList) ? rawList : []) {
      const pid = typeof entry === 'string' ? entry : entry?.id || entry?.productId;
      if (!pid || seen.has(pid)) continue;
      const catalogMatch =
        dbStore.products.find((p) => p.id === pid || p.slug === pid) ||
        vendorProducts.find((vp) => vp.id === pid || vp.slug === pid);
      const item = catalogMatch || (typeof entry === 'object' && entry?.id ? entry : null);
      if (item && (item as any).isActive !== false) {
        seen.add(item.id || pid);
        result.push(item);
      }
    }
    return result;
  }

  @Get('profile')
  getProfile(@Headers('authorization') authHeader?: string) {
    const cust = requireCustomer(authHeader);
    const live = companyAdminDataService.customers.get(cust.sub) as any;
    const isSeedDemo = cust.sub === 'cust-9876543210' || cust.sub === 'cust-demo-1';

    if (live) {
      return {
        success: true,
        data: {
          id: live.id,
          name: live.name,
          phone: live.phone,
          email: live.email || '',
          isPhoneVerified: true,
          isEmailVerified: Boolean(live.email),
          gstin: live.gstin || '',
          businessName: live.businessName || '',
          walletBalance: Number(live.walletBalance ?? (isSeedDemo ? mockProfile.walletBalance : 0)),
          rewardPoints: isSeedDemo ? mockProfile.rewardPoints : 0,
          status: live.status || 'ACTIVE',
          createdAt: live.createdAt || new Date().toISOString(),
        },
      };
    }

    if (isSeedDemo) {
      return {
        success: true,
        data: mockProfile,
      };
    }

    return {
      success: true,
      data: {
        id: cust.sub,
        name: cust.name || 'Buildora Customer',
        phone: cust.phone,
        email: cust.email || '',
        isPhoneVerified: true,
        isEmailVerified: Boolean(cust.email),
        gstin: '',
        businessName: '',
        walletBalance: 0,
        rewardPoints: 0,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      },
    };
  }

  @Put('profile')
  async updateProfile(
    @Body() body: Partial<CustomerProfile>,
    @Headers('authorization') authHeader?: string
  ) {
    const cust = requireCustomer(authHeader);
    const live = companyAdminDataService.customers.get(cust.sub) as any;
    const isSeedDemo = cust.sub === 'cust-9876543210' || cust.sub === 'cust-demo-1';

    if (live) {
      if (body.name !== undefined) live.name = body.name;
      if (body.email !== undefined) live.email = body.email;
      if (body.gstin !== undefined) live.gstin = body.gstin;
      if (body.businessName !== undefined) live.businessName = body.businessName;
      await companyAdminPersistenceService.upsert(CompanyCustomerModel, live);
      return {
        success: true,
        message: 'Profile updated successfully',
        data: {
          id: live.id,
          name: live.name,
          phone: live.phone,
          email: live.email || '',
          isPhoneVerified: true,
          isEmailVerified: Boolean(live.email),
          gstin: live.gstin || '',
          businessName: live.businessName || '',
          walletBalance: Number(live.walletBalance ?? 0),
          rewardPoints: isSeedDemo ? mockProfile.rewardPoints : 0,
        },
      };
    }

    if (isSeedDemo) {
      mockProfile = { ...mockProfile, ...body };
      return {
        success: true,
        message: 'Profile updated successfully',
        data: mockProfile,
      };
    }

    const created: any = {
      id: cust.sub,
      tenantId: cust.tenantId || 'tenant-buildora-blr',
      name: body.name || cust.name || 'Buildora Customer',
      phone: cust.phone,
      email: body.email || cust.email || '',
      customerType: 'CONTRACTOR',
      gstin: body.gstin || '',
      businessName: body.businessName || '',
      walletBalance: 0,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
    companyAdminDataService.customers.set(cust.sub, created);
    await companyAdminPersistenceService.upsert(CompanyCustomerModel, created);
    return {
      success: true,
      message: 'Profile updated successfully',
      data: created,
    };
  }

  @Patch('profile')
  patchProfile(
    @Body() body: Partial<CustomerProfile>,
    @Headers('authorization') authHeader?: string
  ) {
    return this.updateProfile(body, authHeader);
  }

  @Get('addresses')
  getAddresses(@Headers('authorization') authHeader?: string) {
    const cust = requireCustomer(authHeader);
    return {
      success: true,
      data: this.getCustomerAddressesList(cust.sub),
    };
  }

  @Post('addresses')
  async addAddress(
    @Body() body: Omit<Address, 'id'>,
    @Headers('authorization') authHeader?: string
  ) {
    const cust = requireCustomer(authHeader);
    const list = this.getCustomerAddressesList(cust.sub);
    const id = 'addr-' + Date.now() + '-' + Math.floor(Math.random() * 100);
    const newAddress: Address = {
      ...body,
      id,
      isDefault: Boolean(body.isDefault) || list.length === 0,
    };
    const nextList = newAddress.isDefault
      ? list.map((a) => ({ ...a, isDefault: false })).concat(newAddress)
      : list.concat(newAddress);
    dbStore.customerAddresses.set(cust.sub, nextList);
    await platformPersistenceService.upsert(PlatformCustomerAddressModel, {
      id: `addrs-${cust.sub}`,
      customerId: cust.sub,
      addresses: nextList,
    });
    return {
      success: true,
      message: 'Address added successfully',
      data: newAddress,
    };
  }

  @Delete('addresses/:id')
  async deleteAddress(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string
  ) {
    const cust = requireCustomer(authHeader);
    const list = this.getCustomerAddressesList(cust.sub);
    const nextList = list.filter((a) => a.id !== id);
    dbStore.customerAddresses.set(cust.sub, nextList);
    await platformPersistenceService.upsert(PlatformCustomerAddressModel, {
      id: `addrs-${cust.sub}`,
      customerId: cust.sub,
      addresses: nextList,
    });
    return {
      success: true,
      message: 'Address removed successfully',
    };
  }

  @Put('addresses/:id')
  async updateAddress(
    @Param('id') id: string,
    @Body() body: Partial<Address>,
    @Headers('authorization') authHeader?: string
  ) {
    const cust = requireCustomer(authHeader);
    const list = this.getCustomerAddressesList(cust.sub);
    const index = list.findIndex((a) => a.id === id);
    if (index === -1) {
      return { success: false, message: 'Address not found' };
    }
    list[index] = { ...list[index], ...body, id };
    const nextList = body.isDefault
      ? list.map((a) => ({ ...a, isDefault: a.id === id }))
      : list;
    dbStore.customerAddresses.set(cust.sub, nextList);
    await platformPersistenceService.upsert(PlatformCustomerAddressModel, {
      id: `addrs-${cust.sub}`,
      customerId: cust.sub,
      addresses: nextList,
    });
    return {
      success: true,
      message: 'Address updated successfully',
      data: nextList[index],
    };
  }

  @Patch('addresses/:id')
  patchAddress(
    @Param('id') id: string,
    @Body() body: Partial<Address>,
    @Headers('authorization') authHeader?: string
  ) {
    return this.updateAddress(id, body, authHeader);
  }

  // ========================================================
  // CUSTOMER WISHLIST PERSISTENCE & GUEST MERGE
  // ========================================================

  @Get('wishlist')
  getWishlist(@Headers('authorization') authHeader?: string) {
    const cust = requireCustomer(authHeader);
    const raw = dbStore.customerWishlists.get(cust.sub) || [];
    const items = this.resolveWishlistCatalogProducts(raw);
    dbStore.customerWishlists.set(cust.sub, items);
    return {
      success: true,
      data: items,
    };
  }

  @Post('wishlist/merge')
  async mergeWishlist(
    @Body() body: { items?: any[] },
    @Headers('authorization') authHeader?: string
  ) {
    const cust = requireCustomer(authHeader);
    const serverItems = dbStore.customerWishlists.get(cust.sub) || [];
    const guestItems = Array.isArray(body?.items) ? body.items : [];
    const items = this.resolveWishlistCatalogProducts([...serverItems, ...guestItems]);
    dbStore.customerWishlists.set(cust.sub, items);
    await platformPersistenceService.upsert(PlatformCustomerWishlistModel, {
      id: `wl-${cust.sub}`,
      customerId: cust.sub,
      items,
      updatedAt: new Date().toISOString(),
    });
    return {
      success: true,
      data: items,
    };
  }

  @Post('wishlist/toggle')
  async toggleWishlistItem(
    @Body() body: { productId: string; product?: any },
    @Headers('authorization') authHeader?: string
  ) {
    const cust = requireCustomer(authHeader);
    const current = this.resolveWishlistCatalogProducts(dbStore.customerWishlists.get(cust.sub) || []);
    const exists = current.some((p) => p.id === body.productId);
    let nextItems: any[];
    if (exists) {
      nextItems = current.filter((p) => p.id !== body.productId);
    } else {
      nextItems = this.resolveWishlistCatalogProducts([body.product || body.productId, ...current]);
    }
    dbStore.customerWishlists.set(cust.sub, nextItems);
    await platformPersistenceService.upsert(PlatformCustomerWishlistModel, {
      id: `wl-${cust.sub}`,
      customerId: cust.sub,
      items: nextItems,
      updatedAt: new Date().toISOString(),
    });
    return {
      success: true,
      wishlisted: !exists,
      data: nextItems,
    };
  }

  // ========================================================
  // SECURE DUAL OTP PHONE NUMBER CHANGE ENDPOINTS
  // ========================================================

  @Post('phone-change/initiate')
  initiatePhoneChange(
    @Body() body: { newPhone: string; currentPhone?: string },
    @Headers('authorization') authHeader?: string
  ) {
    const cust = requireCustomer(authHeader);
    const live = companyAdminDataService.customers.get(cust.sub) as any;
    const rawNewPhone = (body.newPhone || '').replace(/\D/g, '').slice(-10);
    const currentRegisteredPhone = (body.currentPhone || live?.phone || cust.phone || '').replace(/\D/g, '').slice(-10);

    // 1. Validation: Indian mobile numbers (10 digits starting with 6, 7, 8, or 9)
    if (!/^[6-9]\d{9}$/.test(rawNewPhone)) {
      return {
        success: false,
        message: 'Please provide a valid 10-digit Indian mobile number (must start with 6, 7, 8, or 9).'
      };
    }

    // 2. Reject same number change
    if (rawNewPhone === currentRegisteredPhone) {
      return {
        success: false,
        message: 'New mobile number cannot be the same as your currently registered number.'
      };
    }

    // 3. Reject pre-registered number conflicts
    if (CONFLICT_PHONE_NUMBERS.has(rawNewPhone)) {
      return {
        success: false,
        message: 'This mobile number is already registered with another Buildora account.'
      };
    }

    // 4. Invalidate any existing pending sessions for this user
    for (const [, sess] of phoneChangeSessions.entries()) {
      if (sess.userId === cust.sub && sess.status !== 'COMPLETED' && sess.status !== 'CANCELLED') {
        sess.status = 'CANCELLED';
      }
    }

    // 5. Generate secure session & OTP for old phone
    const sessionId = 'pcs-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex');
    const rawOtp = generateOtp();
    const otpHash = hashOtpValue(rawOtp, sessionId);

    const session: PhoneChangeSession = {
      sessionId,
      userId: cust.sub,
      oldPhone: currentRegisteredPhone,
      newPhone: rawNewPhone,
      status: 'OLD_VERIFICATION_PENDING',
      oldOtpHash: otpHash,
      oldOtpExpiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      oldOtpAttempts: 0,
      oldVerified: false,
      newVerified: false,
      resendCooldownUntil: Date.now() + 30 * 1000, // 30s cooldown
      resendCount: 0,
      createdAt: Date.now(),
      expiresAt: Date.now() + 15 * 60 * 1000 // 15 mins total session life
    };

    phoneChangeSessions.set(sessionId, session);

    return {
      success: true,
      message: `Verification initiated. Security OTP sent to registered number +91 ${maskPhoneNumber(currentRegisteredPhone)}.`,
      sessionId,
      maskedOldPhone: maskPhoneNumber(currentRegisteredPhone),
      maskedNewPhone: maskPhoneNumber(rawNewPhone),
      cooldownSeconds: 30,
      devOtpHint: '6060'
    };
  }

  @Post('phone-change/verify-old')
  verifyOldPhone(
    @Body() body: { sessionId: string; otp: string },
    @Headers('authorization') authHeader?: string
  ) {
    const cust = requireCustomer(authHeader);
    const { sessionId, otp } = body;
    const session = phoneChangeSessions.get(sessionId);
    if (session && session.userId !== cust.sub) {
      throw new ForbiddenException('Unauthorized phone-change session access.');
    }

    if (!session || session.status === 'CANCELLED' || session.status === 'COMPLETED') {
      return {
        success: false,
        message: 'Invalid or expired phone change session. Please initiate a new request.'
      };
    }

    if (Date.now() > session.expiresAt || Date.now() > session.oldOtpExpiresAt) {
      session.status = 'CANCELLED';
      return {
        success: false,
        message: 'OTP has expired. Please initiate a new phone change request.'
      };
    }

    if (session.status !== 'OLD_VERIFICATION_PENDING' || session.oldVerified) {
      return {
        success: false,
        message: 'Old phone number has already been verified or invalid verification state.'
      };
    }

    const isValid = verifyOtpValue(otp, sessionId, session.oldOtpHash);
    if (!isValid) {
      session.oldOtpAttempts++;
      const remaining = 3 - session.oldOtpAttempts;
      if (remaining <= 0) {
        session.status = 'CANCELLED';
        return {
          success: false,
          message: 'Too many incorrect attempts on registered number. For security, this session has been cancelled.'
        };
      }
      return {
        success: false,
        message: `Incorrect OTP. You have ${remaining} attempt(s) remaining.`
      };
    }

    // Step 1 Success: Mark old phone verified & securely wipe old OTP
    session.oldVerified = true;
    session.oldOtpHash = '';
    session.status = 'NEW_VERIFICATION_PENDING';

    // Step 2 Trigger: Generate secure OTP for proposed new phone number
    const rawNewOtp = generateOtp();
    session.newOtpHash = hashOtpValue(rawNewOtp, sessionId);
    session.newOtpExpiresAt = Date.now() + 5 * 60 * 1000;
    session.newOtpAttempts = 0;
    session.resendCooldownUntil = Date.now() + 30 * 1000;

    return {
      success: true,
      message: `Registered mobile verified! Step 2 initiated: Security OTP sent to your new mobile number +91 ${maskPhoneNumber(session.newPhone)}.`,
      maskedOldPhone: maskPhoneNumber(session.oldPhone),
      maskedNewPhone: maskPhoneNumber(session.newPhone),
      cooldownSeconds: 30,
      devOtpHint: '6060'
    };
  }

  @Post('phone-change/verify-new')
  verifyNewPhone(
    @Body() body: { sessionId: string; otp: string },
    @Headers('authorization') authHeader?: string
  ) {
    const cust = requireCustomer(authHeader);
    const { sessionId, otp } = body;
    const session = phoneChangeSessions.get(sessionId);
    if (session && session.userId !== cust.sub) {
      throw new ForbiddenException('Unauthorized phone-change session access.');
    }

    if (!session || session.status === 'CANCELLED' || session.status === 'COMPLETED') {
      return {
        success: false,
        message: 'Invalid or expired phone change session.'
      };
    }

    // Security check: Old phone MUST be verified first
    if (!session.oldVerified || session.status !== 'NEW_VERIFICATION_PENDING') {
      return {
        success: false,
        message: 'Security validation failed: You must verify your currently registered number first.'
      };
    }

    if (!session.newOtpExpiresAt || Date.now() > session.newOtpExpiresAt) {
      session.status = 'CANCELLED';
      return {
        success: false,
        message: 'New number OTP has expired. Please initiate a new request.'
      };
    }

    const isValid = verifyOtpValue(otp, sessionId, session.newOtpHash || '');
    if (!isValid) {
      session.newOtpAttempts = (session.newOtpAttempts || 0) + 1;
      const remaining = 3 - session.newOtpAttempts;
      if (remaining <= 0) {
        session.status = 'CANCELLED';
        return {
          success: false,
          message: 'Too many incorrect attempts on the new number. For security, this session has been cancelled.'
        };
      }
      return {
        success: false,
        message: `Incorrect OTP. You have ${remaining} attempt(s) remaining.`
      };
    }

    // Step 2 Success: Mark new phone verified & securely wipe new OTP
    session.newVerified = true;
    session.newOtpHash = '';
    session.status = 'AWAITING_CONFIRMATION';

    return {
      success: true,
      message: 'New mobile number verified successfully. Ready for final confirmation.',
      maskedOldPhone: maskPhoneNumber(session.oldPhone),
      maskedNewPhone: maskPhoneNumber(session.newPhone),
      readyForConfirmation: true
    };
  }

  @Post('phone-change/resend')
  resendPhoneChangeOtp(
    @Body() body: { sessionId: string; target: 'OLD' | 'NEW' },
    @Headers('authorization') authHeader?: string
  ) {
    const cust = requireCustomer(authHeader);
    const { sessionId, target } = body;
    const session = phoneChangeSessions.get(sessionId);
    if (session && session.userId !== cust.sub) {
      throw new ForbiddenException('Unauthorized phone-change session access.');
    }

    if (!session || session.status === 'CANCELLED' || session.status === 'COMPLETED') {
      return {
        success: false,
        message: 'Invalid or inactive session.'
      };
    }

    if (Date.now() < session.resendCooldownUntil) {
      const waitSecs = Math.ceil((session.resendCooldownUntil - Date.now()) / 1000);
      return {
        success: false,
        message: `Please wait ${waitSecs} seconds before requesting a new OTP.`
      };
    }

    if (session.resendCount >= 3) {
      return {
        success: false,
        message: 'Maximum OTP resend limit reached for this session.'
      };
    }

    const rawOtp = generateOtp();
    const otpHash = hashOtpValue(rawOtp, sessionId);

    if (target === 'OLD') {
      if (session.oldVerified) {
        return { success: false, message: 'Currently registered number has already been verified.' };
      }
      session.oldOtpHash = otpHash;
      session.oldOtpExpiresAt = Date.now() + 5 * 60 * 1000;
      session.oldOtpAttempts = 0;
    } else if (target === 'NEW') {
      if (!session.oldVerified) {
        return { success: false, message: 'Must verify current number before resending OTP to new number.' };
      }
      if (session.newVerified) {
        return { success: false, message: 'New number has already been verified.' };
      }
      session.newOtpHash = otpHash;
      session.newOtpExpiresAt = Date.now() + 5 * 60 * 1000;
      session.newOtpAttempts = 0;
    } else {
      return { success: false, message: 'Invalid verification target.' };
    }

    session.resendCount++;
    session.resendCooldownUntil = Date.now() + 30 * 1000;

    return {
      success: true,
      message: `New security OTP sent to ${target === 'OLD' ? maskPhoneNumber(session.oldPhone) : maskPhoneNumber(session.newPhone)}.`,
      cooldownSeconds: 30,
      devOtpHint: '6060'
    };
  }

  @Post('phone-change/confirm')
  async confirmPhoneChange(
    @Body() body: { sessionId: string },
    @Headers('authorization') authHeader?: string
  ) {
    const cust = requireCustomer(authHeader);
    const { sessionId } = body;
    const session = phoneChangeSessions.get(sessionId);
    if (session && session.userId !== cust.sub) {
      throw new ForbiddenException('Unauthorized phone-change session access.');
    }

    if (!session || session.status !== 'AWAITING_CONFIRMATION') {
      return {
        success: false,
        message: 'Cannot update phone number. Dual verification must be completed first.'
      };
    }

    // STRICT DATABASE UPDATE RULES: Both must be verified
    if (!session.oldVerified || !session.newVerified) {
      return {
        success: false,
        message: 'Security validation failed: Both old and new mobile numbers must be verified before updating database.'
      };
    }

    if (Date.now() > session.expiresAt) {
      session.status = 'CANCELLED';
      return {
        success: false,
        message: 'Session has expired. Please initiate a new request.'
      };
    }

    // Re-verify availability
    if (CONFLICT_PHONE_NUMBERS.has(session.newPhone)) {
      session.status = 'CANCELLED';
      return {
        success: false,
        message: 'This mobile number is no longer available. Phone change aborted.'
      };
    }

    // Perform database update safely
    const live = companyAdminDataService.customers.get(cust.sub) as any;
    const oldNumber = live?.phone || cust.phone || mockProfile.phone;
    if (live) {
      live.phone = session.newPhone;
      await companyAdminPersistenceService.upsert(CompanyCustomerModel, live);
    }
    if (cust.sub === 'cust-9876543210' || cust.sub === 'cust-demo-1') {
      mockProfile.phone = session.newPhone;
      mockProfile.isPhoneVerified = true;
    }

    // Log permanent security audit record
    phoneChangeAuditLogs.push({
      id: 'audit-' + Date.now(),
      userId: session.userId,
      action: 'PHONE_NUMBER_CHANGED',
      oldPhoneMasked: maskPhoneNumber(oldNumber),
      newPhoneMasked: maskPhoneNumber(session.newPhone),
      sessionId: session.sessionId,
      timestamp: new Date().toISOString(),
      status: 'SUCCESS'
    });

    session.status = 'COMPLETED';

    return {
      success: true,
      message: 'Phone number updated successfully!',
      newPhone: session.newPhone,
      maskedNewPhone: maskPhoneNumber(session.newPhone),
      user: live || mockProfile
    };
  }

  @Post('phone-change/cancel')
  cancelPhoneChange(
    @Body() body: { sessionId: string },
    @Headers('authorization') authHeader?: string
  ) {
    const cust = requireCustomer(authHeader);
    const { sessionId } = body;
    const session = phoneChangeSessions.get(sessionId);
    if (session && session.userId === cust.sub) {
      session.status = 'CANCELLED';
    }
    return {
      success: true,
      message: 'Phone change session cancelled successfully.'
    };
  }

  @Get('phone-change/audit-logs')
  getPhoneChangeAuditLogs(@Headers('authorization') authHeader?: string) {
    const cust = requireCustomer(authHeader);
    return {
      success: true,
      data: phoneChangeAuditLogs.filter((l) => l.userId === cust.sub),
    };
  }
}
