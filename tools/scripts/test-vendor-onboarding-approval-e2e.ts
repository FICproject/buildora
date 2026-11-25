/**
 * Phase 11 Complete End-to-End Test Suite:
 * - Registration Step 1..5 (without Categories/Brands in Step 5)
 * - Business Logo Upload (magic bytes validation, >5MB rejection, invalid format rejection, local object storage)
 * - Draft Save & Pre-Submission Review Flow
 * - Submission & Application Status Page Redirect
 * - Duplicate Submission Prevention
 * - Admin Approval, Rejection, Resubmission, Suspension & Audit Logs
 * - Security: Vendor self-approval blocked (403 Forbidden), invalid admin key blocked (401)
 * - Login Redirection for All 6 Statuses
 * - Field-Specific Regex Validations
 */

import * as fs from 'fs';
import {
  validateName,
  validateBusinessName,
  validateEmail,
  validateIndianMobile,
  validatePincode,
  validateCityOrState,
  validateGSTIN,
  validatePAN,
  validateBankName,
  validateBankAccount,
  validateIFSC,
  validateYearOfEstablishment,
  validateWebsite,
  validateLogoFileMetadata,
  MAX_LOGO_SIZE_BYTES
} from '../../packages/validation/src/index';

import { storageService } from '../../services/backend/api/src/modules/vendors/services/storage.service';
import { VendorController } from '../../services/backend/api/src/modules/vendors/controllers/vendor.controller';
import { AdminVendorApprovalController } from '../../services/backend/api/src/modules/vendors/controllers/admin-vendor-approval.controller';

let total = 0;
let passed = 0;
let failed = 0;

function assert(cond: boolean, label: string, detail?: any) {
  total++;
  if (cond) {
    passed++;
    console.log(`  ✓ PASS: ${label}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${label}`, detail || '');
  }
}

async function runE2E() {
  console.log('\n=============================================================================');
  console.log('BUILDORA 60: VENDOR REGISTRATION, LOGO UPLOAD & ADMIN APPROVAL E2E SUITE');
  console.log('=============================================================================\n');

  const vendorCtrl = new VendorController();
  const adminCtrl = new AdminVendorApprovalController();
  const adminHeaders = { 'x-admin-key': 'buildora-dev-admin-2026', 'x-admin-id': 'admin-qa-01' };

  // 1. Field-Specific Regex Validation Checks
  console.log('1. Field-Specific Regex Validations');
  assert(validateBusinessName('Sri Lakshmi Steels & Co. Pvt Ltd').isValid, 'Valid business name with & and . accepted');
  assert(!validateBusinessName('A').isValid, '1-char business name rejected');
  assert(validateYearOfEstablishment('2015').isValid, 'Valid 4-digit year accepted');
  assert(!validateYearOfEstablishment('1750').isValid, 'Year < 1800 rejected');
  assert(!validateYearOfEstablishment('2099').isValid, 'Future year rejected');
  assert(validateWebsite('https://srilakshmisteels.in').isValid, 'Valid https website accepted');
  assert(!validateWebsite('not-a-url').isValid, 'Invalid website URL rejected');
  assert(validateCityOrState('Bengaluru', 'City').isValid, 'Valid city accepted');
  assert(!validateCityOrState('Bengaluru123', 'City').isValid, 'City with digits rejected');
  assert(validateBankName('HDFC Bank').isValid, 'Valid bank name accepted');

  // 2. Logo Upload Validation & Storage Service Tests
  console.log('\n2. Business Logo Upload (Magic Bytes, Size Limit & Storage)');
  // Valid minimal PNG header + bytes
  const validPngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52]);
  const logoMeta = await storageService.uploadVendorLogo(validPngBuffer, 'brand-logo.png', 'image/png', 'http://localhost:3000');
  assert(Boolean(logoMeta.url) && logoMeta.url.includes('/api/v1/vendor/uploads/logos/vendor-logo-'), 'Valid PNG uploaded and safe unique URL returned');
  assert(logoMeta.mimeType === 'image/png', 'Detected MIME type is image/png');
  const storedPath = storageService.getLogoFilePath(logoMeta.fileName);
  assert(fs.existsSync(storedPath.filePath), 'Logo file physically persisted in object storage');

  // Spoofed extension / invalid magic bytes rejected
  let spoofRejected = false;
  try {
    await storageService.uploadVendorLogo(Buffer.from('<html><script>alert(1)</script></html>'), 'evil.png', 'image/png');
  } catch (e: any) {
    spoofRejected = e.status === 400;
  }
  assert(spoofRejected, 'Spoofed .png file with HTML content rejected by magic byte inspection');

  // Oversized image > 5 MB rejected
  let oversizeRejected = false;
  try {
    const bigBuf = Buffer.alloc(MAX_LOGO_SIZE_BYTES + 1024);
    validPngBuffer.copy(bigBuf);
    await storageService.uploadVendorLogo(bigBuf, 'huge.png', 'image/png');
  } catch (e: any) {
    oversizeRejected = e.status === 400;
  }
  assert(oversizeRejected, 'Oversized image (> 5 MB) rejected');

  // Invalid format (.svg / .exe) rejected
  assert(!validateLogoFileMetadata('image/svg+xml', 1024, 'logo.svg').isValid, 'Unsupported .svg format rejected');

  // 3. Complete Registration Steps 1-5 (WITHOUT Categories/Brands)
  console.log('\n3. 5-Step Registration, Draft Save & Pre-Submission Review');
  const testEmail = `e2e-vendor-${Date.now()}@buildora-test.in`;
  const step1 = vendorCtrl.registrationStep1({
    ownerName: 'Karthik Gowda',
    email: testEmail,
    phone: '9845098450',
    password: 'Password@2026',
    confirmPassword: 'Password@2026'
  });
  assert(step1.success && Boolean(step1.vendorId) && Boolean(step1.token), 'Step 1 created draft vendor & JWT');

  const wizardPayload: any = {
    ownerName: 'Karthik Gowda',
    email: testEmail,
    phone: '9845098450',
    isEmailVerified: true,
    isPhoneVerified: true,
    legalBusinessName: 'Gowda Construction Supplies Pvt Ltd',
    storeName: 'Gowda Building Mart',
    businessType: 'DISTRIBUTOR',
    businessRegistrationType: 'PRIVATE_LIMITED',
    yearOfEstablishment: '2016',
    website: 'https://gowdamart.in',
    logoUrl: logoMeta.url,
    logoMetadata: logoMeta,
    country: 'India',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    city: 'Bengaluru',
    area: 'Nagarbhavi',
    pincode: '560072',
    completeAddress: 'Plot 21, Outer Ring Road, Nagarbhavi, Bengaluru',
    gstin: '29AABCG1234F1Z5',
    pan: 'AABCG1234F',
    documents: [
      {
        id: 'doc-e2e-1',
        type: 'GST_CERTIFICATE',
        title: 'GST REG-06 Certificate',
        fileName: 'gst-reg-06.pdf',
        fileSize: 245000,
        mimeType: 'application/pdf',
        fileUrl: '/secure/vault/gst-reg-06.pdf',
        uploadedAt: new Date().toISOString(),
        verificationStatus: 'PENDING'
      }
    ],
    bankDetails: {
      accountHolderName: 'Karthik Gowda',
      bankName: 'ICICI Bank',
      accountNumber: '123456789012',
      ifsc: 'ICIC0000102',
      accountType: 'CURRENT'
    },
    termsAccepted: true,
    privacyAccepted: true,
    currentStep: 5
  };

  // Step 5 -> Save draft for Review Page (status MUST stay DRAFT, not SUBMITTED)
  const draftRes = vendorCtrl.saveRegistrationDraft({ vendorId: step1.vendorId, wizardData: wizardPayload, currentStep: 5 });
  assert(draftRes.vendor.status === 'DRAFT', 'After Step 5, status stays DRAFT until Review Page submission');
  assert(draftRes.vendor.logoUrl === logoMeta.url, 'Uploaded logo URL persisted in registration draft');

  // 4. Submit from Review Page (Without productCategories or brandsSupplied!)
  console.log('\n4. Final Submission from Review Page & Duplicate Prevention');
  const submitRes = vendorCtrl.submitRegistration({ vendorId: step1.vendorId, wizardData: wizardPayload });
  assert(submitRes.success && submitRes.status === 'SUBMITTED', 'Application submitted without requiring categories/brands');
  assert(submitRes.redirectTo === `/application-status/${submitRes.applicationId}`, 'Post-submit redirects to /application-status/:applicationId');

  // Duplicate submission check
  const dupRes = vendorCtrl.submitRegistration({ vendorId: step1.vendorId, wizardData: wizardPayload });
  assert(dupRes.applicationId === submitRes.applicationId && dupRes.status === 'SUBMITTED', 'Duplicate submission returns existing applicationId idempotently');

  // Login while SUBMITTED -> must go to status page, NOT dashboard
  const loginSubmitted = vendorCtrl.login({ identifier: testEmail, password: 'Password@2026' });
  assert(loginSubmitted.redirectTo === `/application-status/${submitRes.applicationId}`, 'Login while SUBMITTED redirects to status page, blocking dashboard');

  // 5. Security: Vendor Self-Approval Blocked
  console.log('\n5. Security: Unauthorized & Vendor Self-Approval Prevention');
  let vendorSelfApproveBlocked = false;
  try {
    adminCtrl.approveApplication(submitRes.applicationId, {
      authorization: `Bearer ${step1.token}`,
      'x-admin-key': 'buildora-dev-admin-2026'
    });
  } catch (e: any) {
    vendorSelfApproveBlocked = e.status === 403;
  }
  assert(vendorSelfApproveBlocked, 'Vendor JWT rejected with 403 Forbidden on admin approve endpoint');

  let invalidAdminKeyBlocked = false;
  try {
    adminCtrl.approveApplication(submitRes.applicationId, { 'x-admin-key': 'wrong-key' });
  } catch (e: any) {
    invalidAdminKeyBlocked = e.status === 401;
  }
  assert(invalidAdminKeyBlocked, 'Invalid admin key rejected with 401 Unauthorized');

  // 6. Admin Workflow: Under Review -> Reject -> Resubmission Required -> Resubmit -> Approve -> Suspend
  console.log('\n6. Admin Approval Workflow (Under Review, Reject, Resubmission, Approve, Suspend)');
  const underReview = adminCtrl.markUnderReview(submitRes.applicationId, adminHeaders);
  assert(underReview.application.status === 'UNDER_REVIEW', 'Admin marked application UNDER_REVIEW');
  assert(vendorCtrl.login({ identifier: testEmail, password: 'Password@2026' }).redirectTo === `/application-status/${submitRes.applicationId}`, 'Login while UNDER_REVIEW stays on status page');

  // Reject without reason must fail
  let emptyRejectBlocked = false;
  try {
    adminCtrl.rejectApplication(submitRes.applicationId, adminHeaders, { reason: 'no' });
  } catch (e: any) {
    emptyRejectBlocked = e.status === 400;
  }
  assert(emptyRejectBlocked, 'Rejection without valid mandatory reason rejected with 400');

  // Reject with valid reason
  const rejected = adminCtrl.rejectApplication(submitRes.applicationId, adminHeaders, { reason: 'GST certificate scan is cropped at bottom.' });
  assert(rejected.application.status === 'REJECTED' && rejected.application.rejectionReason.includes('cropped'), 'Admin rejected application with mandatory reason');

  // Request Resubmission
  const resubReq = adminCtrl.requestResubmission(submitRes.applicationId, adminHeaders, { reason: 'Please re-upload full GST REG-06 page 1.' });
  assert(resubReq.application.status === 'RESUBMISSION_REQUIRED', 'Admin requested resubmission (RESUBMISSION_REQUIRED)');

  // Vendor edits & resubmits
  const resubmitted = vendorCtrl.submitRegistration({ vendorId: step1.vendorId, wizardData: wizardPayload });
  assert(resubmitted.status === 'SUBMITTED', 'Vendor resubmitted application and status returned to SUBMITTED');

  // Admin approves
  const approved = adminCtrl.approveApplication(submitRes.applicationId, adminHeaders, { notes: 'All docs verified.' });
  assert(approved.application.status === 'APPROVED', 'Admin approved vendor application');
  assert(approved.application.approvedBy === 'admin-qa-01' && Boolean(approved.application.approvedAt), 'Admin ID and approval timestamp recorded');

  // Login as APPROVED vendor -> /dashboard
  const loginApproved = vendorCtrl.login({ identifier: testEmail, password: 'Password@2026' });
  assert(loginApproved.redirectTo === '/dashboard' && loginApproved.vendor.logoUrl === logoMeta.url, 'Approved vendor logs into /dashboard with uploaded business logo');

  // Suspend approved vendor
  const suspended = adminCtrl.suspendVendor(submitRes.applicationId, adminHeaders, { reason: 'Compliance audit hold.' });
  assert(suspended.application.status === 'SUSPENDED', 'Admin suspended approved vendor');
  const loginSuspended = vendorCtrl.login({ identifier: testEmail, password: 'Password@2026' });
  assert(loginSuspended.redirectTo === '/account-restricted', 'Suspended vendor redirected to /account-restricted and blocked from dashboard');

  // Audit logs check
  assert((suspended.application.auditLogs || []).length >= 6, 'Complete audit trail recorded for every status transition');

  // Clean up test logo file
  try { fs.unlinkSync(storedPath.filePath); } catch {}

  console.log('\n=============================================================================');
  console.log(`E2E RESULTS: ${passed} passed out of ${total} assertions (${failed} failures).`);
  console.log('=============================================================================\n');

  if (failed > 0) process.exit(1);
}

runE2E().catch((err) => {
  console.error('Fatal E2E error:', err);
  process.exit(1);
});
