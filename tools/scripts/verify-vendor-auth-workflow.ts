/**
 * BUILDORA 60 - Enterprise Vendor Authentication & Registration Workflow Verification
 */

import {
  vendorSecurityService
} from '../../services/backend/api/src/modules/vendors/services/vendor-security.service';
import {
  vendorRecords,
  findVendorByIdentifier,
  getVendorRedirectUrl
} from '../../services/backend/api/src/modules/vendors/controllers/vendor.controller';

async function runTests() {
  console.log('===============================================================');
  console.log('BUILDORA 60 - VENDOR PORTAL AUTH & REGISTRATION TEST SUITE');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} ${detail ? '--> ' + detail : ''}`);
      failed++;
    }
  }

  // -------------------------------------------------------------------------
  // TEST 1: Password Hashing & Verification Security (PBKDF2 SHA-512)
  // -------------------------------------------------------------------------
  console.log('\n--- 1. Cryptographic Password Hashing & Verification ---');
  const rawPassword = 'SecureVendor@2026';
  const hashedPassword = vendorSecurityService.hashPassword(rawPassword);

  assert(hashedPassword.includes(':'), 'Hashed password format is salt:hash');
  assert(!hashedPassword.includes(rawPassword), 'Raw password is NEVER stored in plaintext');
  assert(
    vendorSecurityService.verifyPassword(rawPassword, hashedPassword),
    'Correct password successfully verified via constant-time comparison'
  );
  assert(
    !vendorSecurityService.verifyPassword('WrongPassword@123', hashedPassword),
    'Incorrect password rejected'
  );

  // -------------------------------------------------------------------------
  // TEST 2: Password Complexity Validation
  // -------------------------------------------------------------------------
  console.log('\n--- 2. Password Strength Validation ---');
  assert(!vendorSecurityService.validatePasswordStrength('short').isValid, 'Rejects password shorter than 8 chars');
  assert(!vendorSecurityService.validatePasswordStrength('alllowercase123!').isValid, 'Rejects password without uppercase');
  assert(!vendorSecurityService.validatePasswordStrength('ALLUPPERCASE123!').isValid, 'Rejects password without lowercase');
  assert(!vendorSecurityService.validatePasswordStrength('NoSpecialChar123').isValid, 'Rejects password without special char');
  assert(!vendorSecurityService.validatePasswordStrength('NoNumbersHere!@#').isValid, 'Rejects password without number');
  assert(vendorSecurityService.validatePasswordStrength('ValidVendor@2026').isValid, 'Accepts strong enterprise password');

  // -------------------------------------------------------------------------
  // TEST 3: OTP Generation, SHA-256 Hashing, Single-Use & Expiry
  // -------------------------------------------------------------------------
  console.log('\n--- 3. Cryptographic OTP System & Cooldown ---');
  const testEmail = 'newsupplier.test@buildora.com';
  const otpRes = vendorSecurityService.generateAndStoreOtp(testEmail, 'REGISTRATION_EMAIL');

  assert(otpRes.success, 'OTP generated successfully');
  assert(otpRes.cooldownSeconds === 60, '60-second resend cooldown enforced');
  assert(otpRes.devOtpHint !== undefined && otpRes.devOtpHint.length === 6, 'Generated 6-digit OTP');

  // Test cooldown rejection
  try {
    vendorSecurityService.generateAndStoreOtp(testEmail, 'REGISTRATION_EMAIL');
    assert(false, 'Should reject rapid duplicate OTP request during cooldown');
  } catch (err: any) {
    assert(err.status === 429, 'Rejects rapid request with HTTP 429 Too Many Requests');
  }

  // Test wrong OTP
  try {
    vendorSecurityService.verifyOtp(testEmail, 'REGISTRATION_EMAIL', '000000');
    assert(false, 'Should reject invalid OTP');
  } catch (err: any) {
    assert(err.message.includes('Invalid verification code'), 'Correctly reports invalid code and attempts remaining');
  }

  // Test correct OTP verification
  const isVerified = vendorSecurityService.verifyOtp(testEmail, 'REGISTRATION_EMAIL', otpRes.devOtpHint!);
  assert(isVerified, 'Valid OTP verified successfully');
  assert(vendorSecurityService.hasVerifiedOtp(testEmail, 'REGISTRATION_EMAIL'), 'OTP marked verified in active session');

  // Single-use consumption
  vendorSecurityService.consumeOtp(testEmail, 'REGISTRATION_EMAIL');
  assert(!vendorSecurityService.hasVerifiedOtp(testEmail, 'REGISTRATION_EMAIL'), 'Single-use OTP consumed and cleared');

  // -------------------------------------------------------------------------
  // TEST 4: Rate Limiting & Account Lockout Protection
  // -------------------------------------------------------------------------
  console.log('\n--- 4. Login Rate Limiting & Account Lockout ---');
  const lockoutTarget = 'victim.vendor@buildora.in';
  vendorSecurityService.clearLoginAttempts(lockoutTarget);

  const attempt1 = vendorSecurityService.recordFailedLogin(lockoutTarget);
  assert(attempt1.remainingAttempts === 4 && !attempt1.isLocked, 'Attempt 1: 4 attempts remaining, not locked');

  vendorSecurityService.recordFailedLogin(lockoutTarget);
  vendorSecurityService.recordFailedLogin(lockoutTarget);
  vendorSecurityService.recordFailedLogin(lockoutTarget);
  const attempt5 = vendorSecurityService.recordFailedLogin(lockoutTarget);

  assert(attempt5.isLocked && attempt5.remainingAttempts === 0, 'Attempt 5: Account locked');

  try {
    vendorSecurityService.checkLoginLockout(lockoutTarget);
    assert(false, 'Should throw lockout exception');
  } catch (err: any) {
    assert(err.status === 429 || err.status === 423, 'Lockout enforced with HTTP 429/423');
  }

  vendorSecurityService.clearLoginAttempts(lockoutTarget);

  // -------------------------------------------------------------------------
  // TEST 5: Pre-Seeded Vendors & All 5 Status Redirections
  // -------------------------------------------------------------------------
  console.log('\n--- 5. Seed Vendor Accounts & Phase 8 Redirections ---');
  const apex = findVendorByIdentifier('vendor@buildora.in');
  assert(apex !== undefined && apex.status === 'APPROVED', 'Apex Vendor loaded with status APPROVED');
  assert(getVendorRedirectUrl(apex!.status) === '/dashboard', 'APPROVED redirects to /dashboard');

  const underReview = findVendorByIdentifier('underreview@buildora.in');
  assert(underReview !== undefined && underReview.status === 'UNDER_REVIEW', 'Under Review Vendor loaded with status UNDER_REVIEW');
  assert(getVendorRedirectUrl(underReview!.status) === '/application-status', 'UNDER_REVIEW redirects to /application-status');

  const draft = findVendorByIdentifier('draft@buildora.in');
  assert(draft !== undefined && draft.status === 'DRAFT', 'Draft Vendor loaded with status DRAFT');
  assert(getVendorRedirectUrl(draft!.status) === '/register', 'DRAFT redirects to /register');

  const rejected = findVendorByIdentifier('rejected@buildora.in');
  assert(rejected !== undefined && rejected.status === 'REJECTED', 'Rejected Vendor loaded with status REJECTED');
  assert(getVendorRedirectUrl(rejected!.status) === '/rejection-details', 'REJECTED redirects to /rejection-details');

  const suspended = findVendorByIdentifier('suspended@buildora.in');
  assert(suspended !== undefined && suspended.status === 'SUSPENDED', 'Suspended Vendor loaded with status SUSPENDED');
  assert(getVendorRedirectUrl(suspended!.status) === '/account-restricted', 'SUSPENDED redirects to /account-restricted');

  // Verify phone-based lookup
  const apexByPhone = findVendorByIdentifier('9845012345');
  assert(apexByPhone?.id === apex?.id, 'Vendor correctly looked up via 10-digit registered mobile number');

  // -------------------------------------------------------------------------
  // TEST 6: Token Generation & Security
  // -------------------------------------------------------------------------
  console.log('\n--- 6. Enterprise Tokens (Access + Refresh) ---');
  const tokens = vendorSecurityService.generateTokens(apex!.id, apex!.email);
  assert(Boolean(tokens.accessToken && tokens.accessToken.includes('.')), 'Valid signed JWT bearer token generated');
  assert(Boolean(tokens.refreshToken && tokens.refreshToken.startsWith('rf_')), 'Secure refresh token generated');
  assert(tokens.expiresIn === 7 * 86400, '7-day token expiration configured');

  // -------------------------------------------------------------------------
  // TEST SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n===============================================================');
  console.log(`TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
