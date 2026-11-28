import { Injectable, BadRequestException, UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import * as crypto from 'crypto';

export interface OtpRecord {
  identifier: string; // email or 10-digit mobile
  type: 'REGISTRATION_EMAIL' | 'REGISTRATION_MOBILE' | 'LOGIN' | 'PASSWORD_RESET';
  hashedOtp: string;
  expiresAt: number;
  attempts: number;
  verified: boolean;
  createdAt: number;
  cooldownUntil: number;
  plainOtpForDev?: string;
}

export interface LockoutRecord {
  identifier: string;
  failedAttempts: number;
  lockedUntil: number;
  lastAttemptAt: number;
}

@Injectable()
export class VendorSecurityService {
  // In-memory security records (isolated per tenant / process)
  private otpStore: Map<string, OtpRecord> = new Map();
  private otpRateLimitStore: Map<string, number[]> = new Map();
  private lockoutStore: Map<string, LockoutRecord> = new Map();

  private readonly OTP_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  private readonly OTP_MAX_REQUESTS_PER_WINDOW = 5;

  /**
   * Hashes a password using PBKDF2 with SHA-512 and a cryptographically secure random salt.
   * Returns "salt:hash" string.
   */
  hashPassword(password: string): string {
    if (!password || password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters long.');
    }
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  /**
   * Verifies password against "salt:hash" string using constant-time comparison.
   */
  verifyPassword(password: string, storedHash: string): boolean {
    if (!password || !storedHash || !storedHash.includes(':')) {
      return false;
    }
    try {
      const [salt, originalHash] = storedHash.split(':');
      const hashToVerify = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
      const bufA = Buffer.from(hashToVerify, 'hex');
      const bufB = Buffer.from(originalHash, 'hex');
      if (bufA.length !== bufB.length) return false;
      return crypto.timingSafeEqual(bufA, bufB);
    } catch {
      return false;
    }
  }

  /**
   * Generates a 6-digit cryptographic OTP and stores its SHA-256 hash.
   * Enforces 60-second resend cooldown and sliding-window rate limiting (5 per 15 mins).
   */
  generateAndStoreOtp(
    identifier: string,
    type: OtpRecord['type']
  ): { success: boolean; message: string; cooldownSeconds: number; devOtpHint?: string; otpForDelivery: string } {
    const cleanId = identifier.trim().toLowerCase();
    const now = Date.now();
    const storeKey = `${cleanId}:${type}`;

    // 1. Check Resend Cooldown (60 seconds)
    const existing = this.otpStore.get(storeKey);
    if (existing && now < existing.cooldownUntil) {
      const remainingSeconds = Math.ceil((existing.cooldownUntil - now) / 1000);
      throw new HttpException(
        {
          success: false,
          message: `Please wait ${remainingSeconds} seconds before requesting another verification code.`,
          remainingSeconds
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    // 2. Check sliding-window rate limit (max 5 requests per 15 minutes)
    const recentTimestamps = (this.otpRateLimitStore.get(storeKey) || []).filter(
      (ts) => now - ts < this.OTP_WINDOW_MS
    );
    if (recentTimestamps.length >= this.OTP_MAX_REQUESTS_PER_WINDOW) {
      throw new HttpException(
        {
          success: false,
          message: 'Too many verification code requests. Please wait 15 minutes before trying again.'
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }
    recentTimestamps.push(now);
    this.otpRateLimitStore.set(storeKey, recentTimestamps);

    // 3. Generate 6-digit random code
    const rawOtp = Math.floor(100000 + crypto.randomInt(900000)).toString();
    const hashedOtp = crypto.createHash('sha256').update(rawOtp).digest('hex');

    const record: OtpRecord = {
      identifier: cleanId,
      type,
      hashedOtp,
      expiresAt: now + 10 * 60 * 1000, // 10 minutes expiry
      attempts: 0,
      verified: false,
      createdAt: now,
      cooldownUntil: now + 60 * 1000, // 60s cooldown
      plainOtpForDev: rawOtp
    };

    this.otpStore.set(storeKey, record);

    const exposeDevHint =
      process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEV_OTP_FALLBACK === 'true';

    return {
      success: true,
      message: `Verification code sent to ${identifier}. Valid for 10 minutes.`,
      cooldownSeconds: 60,
      otpForDelivery: rawOtp,
      ...(exposeDevHint ? { devOtpHint: rawOtp } : {})
    };
  }

  /**
   * Verifies the supplied OTP against the SHA-256 hash in storage.
   * Prevents OTP reuse once verified.
   */
  verifyOtp(identifier: string, type: OtpRecord['type'], otp: string): boolean {
    const cleanId = identifier.trim().toLowerCase();
    const storeKey = `${cleanId}:${type}`;
    const entry = this.otpStore.get(storeKey);

    if (!entry) {
      throw new BadRequestException('No verification code requested or session expired. Please request a new code.');
    }

    if (entry.verified) {
      throw new BadRequestException('This verification code has already been used. Please request a new code.');
    }

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.otpStore.delete(storeKey);
      throw new BadRequestException('Verification code has expired. Please request a new code.');
    }

    if (entry.attempts >= 4) {
      this.otpStore.delete(storeKey);
      throw new BadRequestException('Too many incorrect attempts. Code invalidated. Please request a new code.');
    }

    entry.attempts += 1;

    const testHash = crypto.createHash('sha256').update(otp.trim()).digest('hex');
    const isMatch = crypto.timingSafeEqual(Buffer.from(testHash, 'hex'), Buffer.from(entry.hashedOtp, 'hex'));

    if (!isMatch) {
      const remaining = 4 - entry.attempts;
      throw new BadRequestException(`Invalid verification code. ${remaining} attempt(s) remaining.`);
    }

    entry.verified = true;
    return true;
  }

  /**
   * Checks whether the given identifier has an active verified OTP session.
   */
  hasVerifiedOtp(identifier: string, type: OtpRecord['type']): boolean {
    const cleanId = identifier.trim().toLowerCase();
    const storeKey = `${cleanId}:${type}`;
    const entry = this.otpStore.get(storeKey);
    return Boolean(entry && entry.verified && Date.now() <= entry.expiresAt);
  }

  /**
   * Invalidate OTP after consumption (Single-use enforcement).
   */
  consumeOtp(identifier: string, type: OtpRecord['type']): void {
    const cleanId = identifier.trim().toLowerCase();
    this.otpStore.delete(`${cleanId}:${type}`);
  }

  /**
   * Check login rate limit and account lockout.
   */
  checkLoginLockout(identifier: string): void {
    const cleanId = identifier.trim().toLowerCase();
    const entry = this.lockoutStore.get(cleanId);
    if (!entry) return;

    const now = Date.now();
    if (now < entry.lockedUntil) {
      const minutesRemaining = Math.ceil((entry.lockedUntil - now) / 60000);
      throw new HttpException(
        {
          success: false,
          message: `Account is temporarily locked due to 5 consecutive failed login attempts. Please try again after ${minutesRemaining} minute(s) or reset your password.`,
          isLocked: true,
          minutesRemaining
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    // If lockout period passed, reset
    if (entry.lockedUntil > 0 && now >= entry.lockedUntil) {
      this.lockoutStore.delete(cleanId);
    }
  }

  /**
   * Record a failed login attempt. If >= 5 attempts, locks for 15 minutes.
   */
  recordFailedLogin(identifier: string): { remainingAttempts: number; isLocked: boolean } {
    const cleanId = identifier.trim().toLowerCase();
    const now = Date.now();
    let entry = this.lockoutStore.get(cleanId);

    if (!entry) {
      entry = {
        identifier: cleanId,
        failedAttempts: 1,
        lockedUntil: 0,
        lastAttemptAt: now
      };
    } else {
      entry.failedAttempts += 1;
      entry.lastAttemptAt = now;
    }

    if (entry.failedAttempts >= 5) {
      entry.lockedUntil = now + 15 * 60 * 1000; // 15 mins
      this.lockoutStore.set(cleanId, entry);
      return { remainingAttempts: 0, isLocked: true };
    }

    this.lockoutStore.set(cleanId, entry);
    return { remainingAttempts: 5 - entry.failedAttempts, isLocked: false };
  }

  /**
   * Clear failed login count upon successful authentication.
   */
  clearLoginAttempts(identifier: string): void {
    this.lockoutStore.delete(identifier.trim().toLowerCase());
  }

  /**
   * Generate secure JWT-like bearer token and refresh token.
   */
  generateTokens(vendorId: string, email: string): { accessToken: string; refreshToken: string; expiresIn: number } {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const now = Math.floor(Date.now() / 1000);
    const payload = Buffer.from(
      JSON.stringify({
        sub: vendorId,
        email,
        iss: 'buildora-60',
        iat: now,
        exp: now + 86400 * 7 // 7 days
      })
    ).toString('base64url');

    const secret = process.env.JWT_SECRET || 'buildora-vendor-enterprise-secret-key-2026';
    const signature = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');

    const accessToken = `${header}.${payload}.${signature}`;
    const refreshToken = `rf_${crypto.randomBytes(32).toString('hex')}`;

    return {
      accessToken,
      refreshToken,
      expiresIn: 86400 * 7
    };
  }

  /**
   * Verify an access token and extract the vendorId and email.
   */
  verifyToken(token: string): { vendorId: string; email: string } | null {
    if (!token || typeof token !== 'string') return null;
    const parts = token.replace(/^Bearer\s+/i, '').trim().split('.');
    if (parts.length !== 3) return null;
    try {
      const [header, payload, signature] = parts;
      const secret = process.env.JWT_SECRET || 'buildora-vendor-enterprise-secret-key-2026';
      const expectedSig = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
      if (signature !== expectedSig) return null;
      const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
      const now = Math.floor(Date.now() / 1000);
      if (data.exp && data.exp < now) return null;
      return { vendorId: data.sub, email: data.email };
    } catch {
      return null;
    }
  }

  /**
   * Validate password complexity requirements.
   */
  validatePasswordStrength(password: string): { isValid: boolean; message?: string } {
    if (!password || password.length < 8) {
      return { isValid: false, message: 'Password must be at least 8 characters long.' };
    }
    if (!/[A-Z]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one uppercase letter (A-Z).' };
    }
    if (!/[a-z]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one lowercase letter (a-z).' };
    }
    if (!/[0-9]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one number (0-9).' };
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one special character (!@#$%^&*).' };
    }
    return { isValid: true };
  }

  private getEncryptionKey(): Buffer {
    const raw =
      process.env.KYC_ENCRYPTION_KEY ||
      process.env.JWT_SECRET ||
      'buildora-vendor-enterprise-secret-key-2026';
    return crypto.createHash('sha256').update(raw).digest();
  }

  /**
   * Encrypts sensitive KYC/bank values (Aadhaar, PAN, account number) at rest with AES-256-GCM.
   */
  encryptSensitive(plain?: string): string {
    const val = String(plain || '').trim();
    if (!val) return '';
    if (val.startsWith('enc:v1:')) return val;
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.getEncryptionKey(), iv);
    const encrypted = Buffer.concat([cipher.update(val, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `enc:v1:${iv.toString('base64url')}:${tag.toString('base64url')}:${encrypted.toString('base64url')}`;
  }

  /**
   * Decrypts AES-256-GCM protected values; transparently returns legacy plaintext values.
   */
  decryptSensitive(stored?: string): string {
    const val = String(stored || '').trim();
    if (!val) return '';
    if (!val.startsWith('enc:v1:')) return val;
    try {
      const parts = val.split(':');
      if (parts.length !== 5) return '';
      const iv = Buffer.from(parts[2], 'base64url');
      const tag = Buffer.from(parts[3], 'base64url');
      const data = Buffer.from(parts[4], 'base64url');
      const decipher = crypto.createDecipheriv('aes-256-gcm', this.getEncryptionKey(), iv);
      decipher.setAuthTag(tag);
      return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
    } catch {
      return '';
    }
  }
}

export const vendorSecurityService = new VendorSecurityService();
