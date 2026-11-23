import { Controller, Get, Put, Patch, Post, Delete, Body, Param } from '@nestjs/common';
import * as crypto from 'crypto';
import { Address, CustomerProfile } from '@buildora/types';

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
  @Get('profile')
  getProfile() {
    return {
      success: true,
      data: mockProfile
    };
  }

  @Put('profile')
  updateProfile(@Body() body: Partial<CustomerProfile>) {
    mockProfile = { ...mockProfile, ...body };
    return {
      success: true,
      message: 'Profile updated successfully',
      data: mockProfile
    };
  }

  @Patch('profile')
  patchProfile(@Body() body: Partial<CustomerProfile>) {
    return this.updateProfile(body);
  }

  @Get('addresses')
  getAddresses() {
    return {
      success: true,
      data: mockAddresses
    };
  }

  @Post('addresses')
  addAddress(@Body() body: Omit<Address, 'id'>) {
    const id = 'addr-' + Date.now();
    const newAddress: Address = {
      ...body,
      id,
      isDefault: body.isDefault || mockAddresses.length === 0
    };
    if (newAddress.isDefault) {
      mockAddresses = mockAddresses.map((a) => ({ ...a, isDefault: false }));
    }
    mockAddresses.push(newAddress);
    return {
      success: true,
      message: 'Address added successfully',
      data: newAddress
    };
  }

  @Delete('addresses/:id')
  deleteAddress(@Param('id') id: string) {
    mockAddresses = mockAddresses.filter((a) => a.id !== id);
    return {
      success: true,
      message: 'Address removed successfully'
    };
  }

  @Put('addresses/:id')
  updateAddress(@Param('id') id: string, @Body() body: Partial<Address>) {
    const index = mockAddresses.findIndex((a) => a.id === id);
    if (index === -1) {
      return { success: false, message: 'Address not found' };
    }
    mockAddresses[index] = { ...mockAddresses[index], ...body, id };
    if (body.isDefault) {
      mockAddresses = mockAddresses.map((a) => ({
        ...a,
        isDefault: a.id === id
      }));
    }
    return {
      success: true,
      message: 'Address updated successfully',
      data: mockAddresses[index]
    };
  }

  @Patch('addresses/:id')
  patchAddress(@Param('id') id: string, @Body() body: Partial<Address>) {
    return this.updateAddress(id, body);
  }

  // ========================================================
  // SECURE DUAL OTP PHONE NUMBER CHANGE ENDPOINTS
  // ========================================================

  @Post('phone-change/initiate')
  initiatePhoneChange(@Body() body: { newPhone: string; currentPhone?: string }) {
    const rawNewPhone = (body.newPhone || '').replace(/\D/g, '').slice(-10);
    const currentRegisteredPhone = (body.currentPhone || mockProfile.phone || '').replace(/\D/g, '').slice(-10);

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
    for (const [sId, sess] of phoneChangeSessions.entries()) {
      if (sess.userId === mockProfile.id && sess.status !== 'COMPLETED' && sess.status !== 'CANCELLED') {
        sess.status = 'CANCELLED';
      }
    }

    // 5. Generate secure session & OTP for old phone
    const sessionId = 'pcs-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex');
    const rawOtp = generateOtp();
    const otpHash = hashOtpValue(rawOtp, sessionId);

    const session: PhoneChangeSession = {
      sessionId,
      userId: mockProfile.id,
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
  verifyOldPhone(@Body() body: { sessionId: string; otp: string }) {
    const { sessionId, otp } = body;
    const session = phoneChangeSessions.get(sessionId);

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
  verifyNewPhone(@Body() body: { sessionId: string; otp: string }) {
    const { sessionId, otp } = body;
    const session = phoneChangeSessions.get(sessionId);

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
  resendPhoneChangeOtp(@Body() body: { sessionId: string; target: 'OLD' | 'NEW' }) {
    const { sessionId, target } = body;
    const session = phoneChangeSessions.get(sessionId);

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
  confirmPhoneChange(@Body() body: { sessionId: string }) {
    const { sessionId } = body;
    const session = phoneChangeSessions.get(sessionId);

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
    const oldNumber = mockProfile.phone;
    mockProfile.phone = session.newPhone;
    mockProfile.isPhoneVerified = true;

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
      user: mockProfile
    };
  }

  @Post('phone-change/cancel')
  cancelPhoneChange(@Body() body: { sessionId: string }) {
    const { sessionId } = body;
    const session = phoneChangeSessions.get(sessionId);
    if (session) {
      session.status = 'CANCELLED';
    }
    return {
      success: true,
      message: 'Phone change session cancelled successfully.'
    };
  }

  @Get('phone-change/audit-logs')
  getPhoneChangeAuditLogs() {
    return {
      success: true,
      data: phoneChangeAuditLogs
    };
  }
}
