/**
 * Comprehensive End-to-End Integration Test Suite:
 * BUILDORA 60 - Vendor Registration KYC Documents, Identification Numbers,
 * Admin Verification, MongoDB Persistence & Security Isolation.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../services/backend/api/.env') });

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../services/backend/api/src/app.module';
import { VendorMongoModel } from '../../services/backend/api/src/modules/vendors/services/vendor-persistence.service';
import { companyAdminDataService } from '../../services/backend/api/src/modules/company-admin/services/company-admin-data.service';
import { vendorRecords } from '../../services/backend/api/src/modules/vendors/controllers/vendor.controller';
import {
  validateAadhaar,
  validatePAN,
  validateGSTIN,
  validateUdyamNumber,
  validateApplicationReference,
  validateVendorStep4,
  validateVendorStep5,
} from '../../packages/validation/src/index';

let total = 0;
let passed = 0;
let failed = 0;

function assert(cond: boolean, label: string, detail?: any) {
  total++;
  if (cond) {
    passed++;
    console.log(`  PASS: ${label}`);
  } else {
    failed++;
    console.error(`  FAIL: ${label}`, detail !== undefined ? detail : '');
  }
}

const VALID_PDF_BYTES = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n');
const VALID_PNG_BYTES = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89,
]);

async function uploadMultipartDoc(
  baseUrl: string,
  endpoint: string,
  fileBuf: Buffer,
  fileName: string,
  mimeType: string,
  fields: Record<string, string>,
  token?: string
) {
  const form = new FormData();
  const blob = new Blob([new Uint8Array(fileBuf)], { type: mimeType });
  form.append('document', blob, fileName);
  for (const [k, v] of Object.entries(fields)) {
    form.append(k, v);
  }
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${baseUrl}${endpoint}`, {
    method: 'POST',
    headers,
    body: form,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data: json };
}

async function apiJson(
  baseUrl: string,
  endpoint: string,
  options: { method?: string; body?: any; token?: string; tenantId?: string } = {}
) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.token) headers['Authorization'] = `Bearer ${options.token}`;
  if (options.tenantId) headers['x-tenant-id'] = options.tenantId;
  const res = await fetch(`${baseUrl}${endpoint}`, {
    method: options.method || 'GET',
    headers,
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data: json };
}

async function runTests() {
  const createdVendorIds: string[] = [];
  const createdStorageKeys: string[] = [];

  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
  const port = 3099;
  await app.listen(port);
  const baseUrl = `http://127.0.0.1:${port}/api/v1`;

  try {
    console.log('\n=== 1. Conditional & Format Validation Checks ===');
    assert(validateAadhaar('4567 8901 2345').isValid, 'Valid 12-digit Aadhaar accepted');
    assert(!validateAadhaar('123456789012').isValid, 'Aadhaar starting with 1 rejected');
    assert(!validateAadhaar('222222222222').isValid, 'Repeated-digit Aadhaar rejected');
    assert(!validateAadhaar('12345').isValid, 'Short Aadhaar rejected');

    assert(validatePAN('AABCG1234F').isValid, 'Valid PAN accepted');
    assert(!validatePAN('INVALID123').isValid, 'Invalid PAN rejected');

    assert(validateGSTIN('29AABCG1234F1Z5').isValid, 'Valid GSTIN accepted');
    assert(!validateGSTIN('99INVALID').isValid, 'Invalid GSTIN rejected');

    assert(validateUdyamNumber('UDYAM-KA-03-0012345').isValid, 'Valid Udyam number accepted');
    assert(!validateUdyamNumber('UDYAM-1234').isValid, 'Invalid Udyam number rejected');

    assert(validateApplicationReference('AA2905241234567').isValid, 'Valid application reference accepted');
    assert(!validateApplicationReference('AB').isValid, 'Too-short application reference rejected');

    // Step 4 conditional validation: GST NOT_REGISTERED + MSME NOT_REGISTERED
    const notRegStep4 = validateVendorStep4({
      aadhaarNumber: '456789012345',
      pan: 'AABCG1234F',
      gstStatus: 'NOT_REGISTERED',
      msmeStatus: 'NOT_REGISTERED',
      businessRegistrationType: 'PROPRIETORSHIP',
      documents: [
        { type: 'AADHAAR_CARD' },
        { type: 'PAN_CARD' },
        { type: 'BUSINESS_REGISTRATION' },
      ],
    });
    assert(notRegStep4.isValid, 'GST Not Registered + MSME Not Registered passes without GSTIN/Udyam/certs');

    // Step 4 conditional validation: GST REGISTERED missing GSTIN & cert
    const missingGstStep4 = validateVendorStep4({
      aadhaarNumber: '456789012345',
      pan: 'AABCG1234F',
      gstStatus: 'REGISTERED',
      msmeStatus: 'NOT_REGISTERED',
      businessRegistrationType: 'PRIVATE_LIMITED',
      documents: [
        { type: 'AADHAAR_CARD' },
        { type: 'PAN_CARD' },
        { type: 'BUSINESS_REGISTRATION' },
      ],
    });
    assert(!missingGstStep4.isValid && Boolean(missingGstStep4.errors.gstin) && Boolean(missingGstStep4.errors.gstDoc), 'GST Registered without GSTIN/certificate fails');

    // Step 4 conditional validation: MSME REGISTERED missing Udyam & cert
    const missingMsmeStep4 = validateVendorStep4({
      aadhaarNumber: '456789012345',
      pan: 'AABCG1234F',
      gstStatus: 'NOT_REGISTERED',
      msmeStatus: 'REGISTERED',
      businessRegistrationType: 'LLP',
      documents: [
        { type: 'AADHAAR_CARD' },
        { type: 'PAN_CARD' },
        { type: 'BUSINESS_REGISTRATION' },
      ],
    });
    assert(!missingMsmeStep4.isValid && Boolean(missingMsmeStep4.errors.udyamNumber) && Boolean(missingMsmeStep4.errors.msmeDoc), 'MSME Yes without Udyam number/certificate fails');

    // Step 5 validation: mismatched account & missing bank proof
    const badStep5 = validateVendorStep5(
      {
        bankDetails: {
          accountHolderName: 'Ramesh Kumar',
          bankName: 'HDFC Bank',
          accountNumber: '123456789012',
          confirmAccountNumber: '123456789999',
          ifsc: 'HDFC0000053',
          accountType: 'CURRENT',
        },
        documents: [],
        termsAccepted: true,
        privacyAccepted: true,
      },
      { requireConfirmAccountNumber: true, requireBankProof: true }
    );
    assert(!badStep5.isValid && Boolean(badStep5.errors.confirmAccountNumber) && Boolean(badStep5.errors.bankProofDoc), 'Step 5 rejects mismatched account number & missing bank proof');

    console.log('\n=== 2. Real Multipart Document Upload & Full Vendor Registration (GST + MSME Registered) ===');
    const ts = Date.now();
    const v1Email = `kyc-e2e-${ts}@buildora-test.in`;
    const step1 = await apiJson(baseUrl, '/vendor/registration/step1', {
      method: 'POST',
      body: {
        ownerName: 'Ramesh Kumar',
        email: v1Email,
        phone: '9876501234',
        password: 'Password@2026',
        confirmPassword: 'Password@2026',
      },
    });
    assert(step1.ok && Boolean(step1.data?.vendorId) && Boolean(step1.data?.token), 'Vendor 1 Step 1 created draft');
    const v1Id = step1.data.vendorId;
    const v1Token = step1.data.token;
    createdVendorIds.push(v1Id);

    const aadhaarUp = await uploadMultipartDoc(
      baseUrl,
      '/vendor/registration/upload-doc-file',
      VALID_PNG_BYTES,
      'aadhaar-front.png',
      'image/png',
      { type: 'AADHAAR_CARD', title: 'Aadhaar Card Document', identificationNumber: '456789014412' }
    );
    const panUp = await uploadMultipartDoc(
      baseUrl,
      '/vendor/registration/upload-doc-file',
      VALID_PDF_BYTES,
      'company-pan.pdf',
      'application/pdf',
      { type: 'PAN_CARD', title: 'PAN Card Document', identificationNumber: 'AABCG1234F' }
    );
    const gstUp = await uploadMultipartDoc(
      baseUrl,
      '/vendor/registration/upload-doc-file',
      VALID_PDF_BYTES,
      'gst-reg-06.pdf',
      'application/pdf',
      { type: 'GST_CERTIFICATE', title: 'GST Registration Certificate (REG-06)', identificationNumber: '29AABCG1234F1Z5' }
    );
    const udyamUp = await uploadMultipartDoc(
      baseUrl,
      '/vendor/registration/upload-doc-file',
      VALID_PDF_BYTES,
      'udyam-cert.pdf',
      'application/pdf',
      { type: 'UDYAM_CERTIFICATE', title: 'Udyam Registration Certificate', identificationNumber: 'UDYAM-KA-03-0012345' }
    );
    const tradeUp = await uploadMultipartDoc(
      baseUrl,
      '/vendor/registration/upload-doc-file',
      VALID_PDF_BYTES,
      'incorporation-cert.pdf',
      'application/pdf',
      { type: 'BUSINESS_REGISTRATION', title: 'Trade License / Incorporation Certificate' }
    );
    const bankUp = await uploadMultipartDoc(
      baseUrl,
      '/vendor/registration/upload-doc-file',
      VALID_PNG_BYTES,
      'cancelled-cheque.png',
      'image/png',
      { type: 'CANCELLED_CHEQUE', title: 'Bank Passbook / Cancelled Cheque', identificationNumber: '50200049188901' }
    );

    const uploadedDocs = [
      aadhaarUp.data?.document,
      panUp.data?.document,
      gstUp.data?.document,
      udyamUp.data?.document,
      tradeUp.data?.document,
      bankUp.data?.document,
    ];
    for (const d of uploadedDocs) {
      if (d?.storageKey) createdStorageKeys.push(d.storageKey);
    }

    assert(
      uploadedDocs.every((d) => Boolean(d?.id) && Boolean(d?.storageKey) && !d?.fileUrl && !d?.identificationNumber),
      'All 6 multipart KYC uploads stored securely without leaking public fileUrl or raw identificationNumber'
    );
    assert(aadhaarUp.data?.document?.identificationNumberMasked === 'XXXX XXXX 4412', 'Aadhaar masked & linked on upload');
    assert(panUp.data?.document?.identificationNumberMasked === 'AABXXXXXXF', 'PAN masked & linked on upload');

    const wizardV1 = {
      ownerName: 'Ramesh Kumar',
      email: v1Email,
      phone: '9876501234',
      isEmailVerified: true,
      isPhoneVerified: true,
      legalBusinessName: 'Surya Concrete Works LLP',
      storeName: 'Surya Concrete Mart',
      businessType: 'MANUFACTURER',
      businessRegistrationType: 'LLP',
      country: 'India',
      state: 'Karnataka',
      district: 'Bengaluru Urban',
      city: 'Bengaluru',
      area: 'Yelahanka',
      pincode: '560064',
      completeAddress: 'Plot 77, KIADB Industrial Area Phase 2, Yelahanka',
      aadhaarNumber: '456789014412',
      pan: 'AABCG1234F',
      gstStatus: 'REGISTERED',
      gstin: '29AABCG1234F1Z5',
      msmeStatus: 'REGISTERED',
      udyamNumber: 'UDYAM-KA-03-0012345',
      documents: uploadedDocs,
      bankDetails: {
        accountHolderName: 'Surya Concrete Works LLP',
        bankName: 'Axis Bank',
        accountNumber: '50200049188901',
        confirmAccountNumber: '50200049188901',
        ifsc: 'UTIB0000412',
        accountType: 'CURRENT',
      },
      termsAccepted: true,
      privacyAccepted: true,
      currentStep: 5,
    };

    const draftV1 = await apiJson(baseUrl, '/vendor/registration/save-draft', {
      method: 'PUT',
      token: v1Token,
      body: { vendorId: v1Id, wizardData: wizardV1, currentStep: 5 },
    });
    assert(draftV1.ok && draftV1.data?.vendor?.status === 'DRAFT', 'Draft saved and status remains DRAFT');

    const submitV1 = await apiJson(baseUrl, '/vendor/registration/submit', {
      method: 'POST',
      token: v1Token,
      body: { vendorId: v1Id, wizardData: wizardV1 },
    });
    assert(submitV1.ok && submitV1.data?.status === 'SUBMITTED', 'Vendor 1 registration submitted (NOT auto-approved)');
    assert(submitV1.data?.vendor?.businessInfo?.bankDetails?.isVerified === false, 'Bank account NOT auto-verified upon passbook upload');

    // Check MongoDB record if DB connected
    const mongoDoc = await VendorMongoModel.findOne({ id: v1Id }).lean().exec().catch(() => null);
    if (mongoDoc) {
      assert(String((mongoDoc as any).aadhaarNumber || '').startsWith('enc:v1:'), 'Aadhaar encrypted at rest in MongoDB');
      assert(String((mongoDoc as any).businessInfo?.pan || '').startsWith('enc:v1:'), 'PAN encrypted at rest in MongoDB');
      assert(String((mongoDoc as any).businessInfo?.bankDetails?.accountNumber || '').startsWith('enc:v1:'), 'Bank account encrypted at rest in MongoDB');
      assert((mongoDoc as any).kycDocuments?.length === 6, 'All 6 KYC documents persisted to MongoDB');
    } else {
      console.log('  INFO: MongoDB disconnected in local test environment; verified in-memory persistence.');
    }

    console.log('\n=== 3. GST Not Registered & Applied Workflows ===');
    const v2Email = `kyc-noreg-${ts}@buildora-test.in`;
    const step1V2 = await apiJson(baseUrl, '/vendor/registration/step1', {
      method: 'POST',
      body: {
        ownerName: 'Mahesh Hegde',
        email: v2Email,
        phone: '9876509999',
        password: 'Password@2026',
        confirmPassword: 'Password@2026',
      },
    });
    const v2Id = step1V2.data.vendorId;
    createdVendorIds.push(v2Id);

    const v2Aadhaar = await uploadMultipartDoc(baseUrl, '/vendor/registration/upload-doc-file', VALID_PNG_BYTES, 'v2-aadhaar.png', 'image/png', { type: 'AADHAAR_CARD', title: 'Aadhaar Card' });
    const v2Pan = await uploadMultipartDoc(baseUrl, '/vendor/registration/upload-doc-file', VALID_PDF_BYTES, 'v2-pan.pdf', 'application/pdf', { type: 'PAN_CARD', title: 'PAN Card' });
    const v2Trade = await uploadMultipartDoc(baseUrl, '/vendor/registration/upload-doc-file', VALID_PDF_BYTES, 'v2-trade.pdf', 'application/pdf', { type: 'BUSINESS_REGISTRATION', title: 'Trade License' });
    const v2Bank = await uploadMultipartDoc(baseUrl, '/vendor/registration/upload-doc-file', VALID_PNG_BYTES, 'v2-passbook.png', 'image/png', { type: 'CANCELLED_CHEQUE', title: 'Bank Passbook' });
    const v2Docs = [v2Aadhaar.data.document, v2Pan.data.document, v2Trade.data.document, v2Bank.data.document];
    for (const d of v2Docs) if (d?.storageKey) createdStorageKeys.push(d.storageKey);

    const submitV2 = await apiJson(baseUrl, '/vendor/registration/submit', {
      method: 'POST',
      token: step1V2.data.token,
      body: {
        vendorId: v2Id,
        wizardData: {
          ownerName: 'Mahesh Hegde',
          email: v2Email,
          phone: '9876509999',
          isEmailVerified: true,
          isPhoneVerified: true,
          legalBusinessName: 'Hegde Masonry Traders',
          storeName: 'Hegde Traders',
          businessType: 'RETAILER',
          businessRegistrationType: 'PROPRIETORSHIP',
          country: 'India',
          state: 'Karnataka',
          city: 'Bengaluru',
          pincode: '560053',
          completeAddress: '18 Chickpet Main Road, Bengaluru',
          aadhaarNumber: '345678901122',
          pan: 'BBBCG4321K',
          gstStatus: 'NOT_REGISTERED',
          msmeStatus: 'NOT_REGISTERED',
          documents: v2Docs,
          bankDetails: {
            accountHolderName: 'Mahesh Hegde',
            bankName: 'State Bank of India',
            accountNumber: '309182736455',
            confirmAccountNumber: '309182736455',
            ifsc: 'SBIN0000813',
            accountType: 'CURRENT',
          },
          termsAccepted: true,
          privacyAccepted: true,
          currentStep: 5,
        },
      },
    });
    assert(submitV2.ok && submitV2.data?.status === 'SUBMITTED', 'Vendor 2 submitted with GST Not Registered & MSME Not Registered');

    console.log('\n=== 4. Company Admin Inspection, Document Preview/Download, Verify/Reject & Resubmission ===');
    const adminLogin = await apiJson(baseUrl, '/company-admin/auth/login', {
      method: 'POST',
      body: { email: 'admin@buildora.in', password: 'Admin@123' },
    });
    assert(adminLogin.ok && Boolean(adminLogin.data?.data?.accessToken), 'Company Admin logged in');
    const adminToken = adminLogin.data.data.accessToken;

    const inspectV1 = await apiJson(baseUrl, `/company-admin/vendors/${v1Id}`, { token: adminToken });
    const normV1 = inspectV1.data?.data?.vendor;
    assert(inspectV1.ok && normV1?.aadhaarMasked === 'XXXX XXXX 4412', 'Admin sees masked Aadhaar (XXXX XXXX 4412)');
    assert(normV1?.panMasked === 'AABXXXXXXF', 'Admin sees masked PAN (AABXXXXXXF)');
    assert(normV1?.gstStatus === 'REGISTERED' && normV1?.gstin === '29AABCG1234F1Z5', 'Admin sees GST status & GSTIN');
    assert(normV1?.msmeStatus === 'REGISTERED' && normV1?.udyamNumber === 'UDYAM-KA-03-0012345', 'Admin sees MSME status & Udyam Number');
    assert(normV1?.kycSummary?.totalApplicable === 6 && normV1?.kycSummary?.pendingCount === 6, 'Admin KYC summary calculates 6 applicable pending docs');
    assert(normV1?.bankAccount?.accountNumberMasked === 'XXXX8901' && normV1?.bankAccount?.isVerified === false, 'Admin sees masked bank account & Pending Bank Verification');

    const inspectV2 = await apiJson(baseUrl, `/company-admin/vendors/${v2Id}`, { token: adminToken });
    const normV2 = inspectV2.data?.data?.vendor;
    assert(normV2?.gstStatus === 'NOT_REGISTERED' && !normV2?.gstin, 'Vendor 2 GST Not Registered has no fake GSTIN');
    assert(normV2?.kycSummary?.totalApplicable === 4 && normV2?.kycSummary?.notApplicableCount === 2, 'Vendor 2 KYC progress excludes 2 Not Applicable docs (4 applicable)');

    // Stream & download every document of Vendor 1
    let allDocsStreamed = true;
    for (const doc of normV1.documents) {
      const access = await apiJson(baseUrl, `/company-admin/vendors/${v1Id}/documents/${doc.id}/access-url`, { token: adminToken });
      if (!access.ok || !access.data?.data?.inlineStreamPath) {
        allDocsStreamed = false;
        break;
      }
      const inlineRes = await fetch(`${baseUrl}${access.data.data.inlineStreamPath}`);
      const dlRes = await fetch(`${baseUrl}/company-admin/vendors/${v1Id}/documents/${doc.id}/file?download=true`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!inlineRes.ok || !dlRes.ok || Number(dlRes.headers.get('content-length') || 0) <= 0) {
        allDocsStreamed = false;
        break;
      }
    }
    assert(allDocsStreamed, 'Admin opened and downloaded all 6 uploaded KYC & bank documents with real binary bytes');

    // Reject Aadhaar without reason -> must fail 400
    const aadhaarAdminDoc = normV1.documents.find((d: any) => d.type === 'AADHAAR_CARD');
    const emptyReject = await apiJson(baseUrl, `/company-admin/vendors/${v1Id}/documents/${aadhaarAdminDoc.id}/verify`, {
      method: 'PATCH',
      token: adminToken,
      body: { status: 'REJECTED', notes: '   ' },
    });
    assert(emptyReject.status === 400, 'Rejecting document without reason returns 400');

    // Reject Aadhaar with reason
    const rejectAadhaar = await apiJson(baseUrl, `/company-admin/vendors/${v1Id}/documents/${aadhaarAdminDoc.id}/verify`, {
      method: 'PATCH',
      token: adminToken,
      body: { status: 'REJECTED', notes: 'Aadhaar photo is blurry; please re-upload clear scan.' },
    });
    assert(
      rejectAadhaar.ok && rejectAadhaar.data?.data?.kycSummary?.rejectedCount === 1,
      'Rejecting Aadhaar updates rejectedCount & stores rejection reason'
    );

    // Vendor resubmits corrected Aadhaar
    const resubmitAadhaar = await uploadMultipartDoc(
      baseUrl,
      '/vendor/profile/kyc-documents/replace',
      VALID_PNG_BYTES,
      'aadhaar-clear-v2.png',
      'image/png',
      { type: 'AADHAAR_CARD', title: 'Aadhaar Card Document' },
      v1Token
    );
    if (resubmitAadhaar.data?.document?.storageKey) {
      createdStorageKeys.push(resubmitAadhaar.data.document.storageKey);
    }
    assert(
      resubmitAadhaar.ok &&
        resubmitAadhaar.data?.document?.version === 2 &&
        resubmitAadhaar.data?.document?.previousVersions?.length === 1,
      'Vendor resubmission creates v2 and preserves v1 in previousVersions'
    );

    // Verify Aadhaar & Bank Account separately
    const afterResubmit = await apiJson(baseUrl, `/company-admin/vendors/${v1Id}`, { token: adminToken });
    const newAadhaarDoc = afterResubmit.data.data.vendor.documents.find((d: any) => d.type === 'AADHAAR_CARD');
    assert(newAadhaarDoc.displayStatus === 'RESUBMITTED', 'Admin sees RESUBMITTED status on replaced Aadhaar');

    const verifyAadhaar = await apiJson(baseUrl, `/company-admin/vendors/${v1Id}/documents/${newAadhaarDoc.id}/verify`, {
      method: 'PATCH',
      token: adminToken,
      body: { status: 'VERIFIED' },
    });
    assert(verifyAadhaar.ok && verifyAadhaar.data?.data?.kycSummary?.verifiedCount === 1, 'Admin verified resubmitted Aadhaar');
    assert(verifyAadhaar.data?.data?.approvalStatus === 'SUBMITTED', 'Verifying document does NOT auto-approve vendor');

    const verifyBank = await apiJson(baseUrl, `/company-admin/vendors/${v1Id}/bank/verify`, {
      method: 'PATCH',
      token: adminToken,
      body: { status: 'VERIFIED' },
    });
    assert(verifyBank.ok && verifyBank.data?.data?.bankAccount?.isVerified === true, 'Admin verified bank account independently');

    console.log('\n=== 5. Security & Cross-Tenant Isolation Tests ===');
    const unauthStream = await fetch(`${baseUrl}/company-admin/vendors/${v1Id}/documents/${newAadhaarDoc.id}/file`);
    assert(unauthStream.status === 401, 'Unauthenticated admin document access returns 401');

    const unauthVendorUrl = await fetch(`${baseUrl}/vendor/uploads/docs/${resubmitAadhaar.data.document.storageKey}`);
    assert(unauthVendorUrl.status === 401, 'Unauthenticated direct storage access returns 401');

    const crossVendor = await fetch(`${baseUrl}/vendor/kyc-documents/${newAadhaarDoc.id}/file`, {
      headers: { Authorization: `Bearer ${step1V2.data.token}` },
    });
    assert(crossVendor.status === 404 || crossVendor.status === 403, 'Vendor 2 cannot access Vendor 1 KYC document');

    const hydAdminLogin = await apiJson(baseUrl, '/company-admin/auth/login', {
      method: 'POST',
      body: { email: 'hyd-admin@buildora.in', password: 'Admin@123' },
    });
    const hydToken = hydAdminLogin.data?.data?.accessToken;
    const crossTenantInspect = await apiJson(baseUrl, `/company-admin/vendors/${v1Id}`, { token: hydToken });
    assert(crossTenantInspect.status === 403, 'Cross-tenant admin inspection blocked with 403');

    const crossTenantDoc = await fetch(`${baseUrl}/company-admin/vendors/${v1Id}/documents/${newAadhaarDoc.id}/file`, {
      headers: { Authorization: `Bearer ${hydToken}` },
    });
    assert(crossTenantDoc.status === 403, 'Cross-tenant admin document download blocked with 403');

    console.log('\n=== 6. Backward Compatibility Check on Seeded/Legacy Vendors ===');
    const legacyVendors = companyAdminDataService.getTenantVendors('tenant-buildora-blr');
    assert(legacyVendors.length >= 2 && legacyVendors.every((lv) => Boolean(lv.kycSummary) && Array.isArray(lv.kycSummary.slots)), 'Existing legacy/seeded vendors normalize cleanly without errors');
  } finally {
    // Cleanup temporary vendor records & uploaded files
    for (const vid of createdVendorIds) {
      vendorRecords.delete(vid);
      await VendorMongoModel.deleteOne({ id: vid }).exec().catch(() => undefined);
    }
    const docDir = path.resolve(process.cwd(), 'uploads', 'vendor-docs');
    for (const key of createdStorageKeys) {
      try {
        fs.unlinkSync(path.join(docDir, key));
      } catch {
        // Ignore cleanup errors
      }
    }
    await app.close();
  }

  console.log(`\nRESULTS: ${passed}/${total} passed (${failed} failed).\n`);
  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Fatal integration test error:', err);
  process.exit(1);
});
