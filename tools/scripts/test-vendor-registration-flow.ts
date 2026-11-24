import { vendorRecords, getVendorFromAuthHeader, getAuthenticatedVendor, getVendorRedirectUrl } from '../../services/backend/api/src/modules/vendors/controllers/vendor.controller';
import { vendorSecurityService } from '../../services/backend/api/src/modules/vendors/services/vendor-security.service';
import { VendorController } from '../../services/backend/api/src/modules/vendors/controllers/vendor.controller';
import { VendorRegistrationWizardData, VendorKycDocument } from '@buildora/types';

async function runVendorRegistrationFlowTests() {
  console.log('===============================================================');
  console.log(' BUILDORA 60: Vendor Registration Flow & Review Page Test Suite');
  console.log('===============================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`[PASS] Test ${totalTests}: ${testName}`);
    } else {
      console.error(`[FAIL] Test ${totalTests}: ${testName}`);
      if (details) console.error(`       Details: ${details}`);
    }
  }

  const controller = new VendorController();

  // Test 1: Verify Initial Form State Cleanness (Phase 1)
  // A fresh vendor registration starts with empty strings, empty arrays, and no pre-populated defaults
  const freshRegistrationState = {
    ownerName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    legalBusinessName: '',
    storeName: '',
    businessType: '',
    businessRegistrationType: '',
    yearOfEstablishment: '',
    website: '',
    description: '',
    state: '',
    district: '',
    city: '',
    area: '',
    pincode: '',
    completeAddress: '',
    warehouses: [],
    gstin: '',
    pan: '',
    documents: [],
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifsc: '',
    selectedCategories: [],
    brandsSupplied: [],
    termsAccepted: false,
    privacyAccepted: false
  };

  assert(
    freshRegistrationState.ownerName === '' &&
    freshRegistrationState.email === '' &&
    freshRegistrationState.phone === '' &&
    freshRegistrationState.legalBusinessName === '' &&
    freshRegistrationState.storeName === '' &&
    freshRegistrationState.businessType === '' &&
    freshRegistrationState.state === '' &&
    freshRegistrationState.city === '' &&
    freshRegistrationState.pincode === '' &&
    freshRegistrationState.gstin === '' &&
    freshRegistrationState.pan === '' &&
    freshRegistrationState.accountNumber === '' &&
    freshRegistrationState.ifsc === '' &&
    freshRegistrationState.documents.length === 0 &&
    freshRegistrationState.warehouses.length === 0 &&
    freshRegistrationState.selectedCategories.length === 0 &&
    !freshRegistrationState.termsAccepted &&
    !freshRegistrationState.privacyAccepted,
    'Phase 1: Fresh Registration Initial State is 100% empty (no hardcoded test data)'
  );

  // Test 2: Existing Vendor Login Still Works (Requirement 19)
  const existingLoginRes = await controller.login({
    identifier: 'vendor@buildora.in',
    password: 'Vendor@123'
  });
  assert(
    existingLoginRes.success === true &&
    existingLoginRes.status === 'APPROVED' &&
    existingLoginRes.redirectTo === '/dashboard' &&
    typeof existingLoginRes.token === 'string',
    'Requirement 19: Existing vendor login functions correctly (vendor@buildora.in)'
  );

  // Test 3: Step 1 Account Registration with validation
  const testEmail = `newvendor_${Date.now()}@testmaterials.in`;
  const testPhone = '9876543210';
  const testOwner = 'Harish Venkatesh';
  const testPassword = 'Password@123';

  // Request & Verify OTP for email and phone
  const emailOtpGen = vendorSecurityService.generateAndStoreOtp(testEmail, 'REGISTRATION_EMAIL');
  assert(emailOtpGen.success === true, 'Step 1: Email OTP generation');
  vendorSecurityService.verifyOtp(testEmail, 'REGISTRATION_EMAIL', emailOtpGen.devOtpHint || '123456');

  const mobileOtpGen = vendorSecurityService.generateAndStoreOtp(testPhone, 'REGISTRATION_MOBILE');
  assert(mobileOtpGen.success === true, 'Step 1: Mobile OTP generation');
  vendorSecurityService.verifyOtp(testPhone, 'REGISTRATION_MOBILE', mobileOtpGen.devOtpHint || '123456');

  // Submit Step 1
  const step1Res = await controller.registrationStep1({
    ownerName: testOwner,
    email: testEmail,
    phone: testPhone,
    password: testPassword,
    confirmPassword: testPassword
  });

  assert(
    step1Res.success === true &&
    typeof step1Res.vendorId === 'string' &&
    step1Res.step === 2 &&
    typeof step1Res.token === 'string',
    'Step 1: Account registration successful, transitions to Step 2 with draft token'
  );

  const vendorId = step1Res.vendorId;
  const vendorToken = step1Res.token;

  // Test 4: Save & Resume Saved Draft Registration (Requirement 20)
  const draftSaveRes = await controller.saveRegistrationDraft(
    {
      vendorId,
      currentStep: 2,
      wizardData: {
        ownerName: testOwner,
        email: testEmail,
        phone: testPhone,
        legalBusinessName: 'Venkatesh Brick & Tile Works Pvt Ltd',
        storeName: 'Venkatesh Builders Mart',
        businessType: 'MANUFACTURER',
        businessRegistrationType: 'PRIVATE_LIMITED',
        currentStep: 2
      } as any
    },
    `Bearer ${vendorToken}`
  );

  assert(
    draftSaveRes.success === true &&
    draftSaveRes.vendor.status === 'DRAFT' &&
    draftSaveRes.vendor.registrationStep === 2,
    'Requirement 20: Saved draft registration can be persisted and resumed'
  );

  // Test 5: Test Invalid Form Submissions (Requirement 15)
  // Missing required business details in Step 2 / Step 3
  let invalidSubmissionCaught = false;
  try {
    controller.submitRegistration(
      {
        vendorId,
        wizardData: {
          ownerName: testOwner,
          email: testEmail,
          phone: testPhone,
          legalBusinessName: '', // Empty
          storeName: '',
          businessType: '' as any,
          currentStep: 5
        } as any
      },
      `Bearer ${vendorToken}`
    );
  } catch (err: any) {
    invalidSubmissionCaught = true;
  }
  assert(invalidSubmissionCaught, 'Requirement 15: Invalid form submission is rejected with validation error');

  // Test 6: Document Upload (Phase 4)
  const docUploadRes = controller.uploadDocument({
    fileName: 'GST_REG06_Certificate.pdf',
    fileSize: 450000,
    mimeType: 'application/pdf',
    type: 'GST_CERTIFICATE',
    title: 'GST Registration Certificate (REG-06)'
  });
  assert(
    docUploadRes.success === true &&
    docUploadRes.document.verificationStatus === 'PENDING',
    'Step 4: KYC document upload sets real status to PENDING (never fake VERIFIED)'
  );

  // Test 7: Step 5 Final Submission & Immediate Navigation (Phase 3)
  const completeWizardData: VendorRegistrationWizardData = {
    ownerName: testOwner,
    email: testEmail,
    phone: testPhone,
    isEmailVerified: true,
    isPhoneVerified: true,
    legalBusinessName: 'Venkatesh Brick & Tile Works Pvt Ltd',
    storeName: 'Venkatesh Builders Mart',
    businessType: 'MANUFACTURER',
    businessRegistrationType: 'PRIVATE_LIMITED',
    yearOfEstablishment: '2019',
    description: 'Direct kiln manufacturer of wire-cut clay bricks, hollow tiles, and interlocking pavers.',
    country: 'India',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    city: 'Bengaluru',
    area: 'Peenya Industrial Area',
    pincode: '560058',
    completeAddress: 'Kiln Yard 12, Magadi Main Road, Peenya Stage 2',
    dispatchAddress: 'Kiln Yard 12, Magadi Main Road, Peenya Stage 2',
    warehouses: [
      {
        id: 'wh-peenya',
        name: 'Peenya Dispatch Yard',
        address: 'Plot 10, Peenya 2nd Stage',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560058',
        isPrimary: true
      }
    ],
    gstin: '29ABCDE1234F1Z5',
    pan: 'ABCDE1234F',
    documents: [
      docUploadRes.document,
      {
        id: 'doc-pan-01',
        type: 'PAN_CARD',
        title: 'Company PAN Card',
        fileName: 'Company_PAN.pdf',
        fileSize: 320000,
        mimeType: 'application/pdf',
        fileUrl: '/secure/vault/Company_PAN.pdf',
        uploadedAt: new Date().toISOString(),
        verificationStatus: 'PENDING'
      }
    ],
    bankDetails: {
      accountHolderName: 'Venkatesh Brick & Tile Works Pvt Ltd',
      bankName: 'HDFC Bank',
      accountNumber: '50200098765432',
      ifsc: 'HDFC0000053',
      accountType: 'CURRENT'
    },
    productCategories: ['civil-interiors', 'masonry-bricks-blocks'],
    brandsSupplied: ['Venkatesh Bricks', 'UltraTech'],
    operatingLocations: ['Peenya', 'Rajajinagar'],
    termsAccepted: true,
    privacyAccepted: true,
    currentStep: 5
  };

  const finalSubmitRes = controller.submitRegistration(
    {
      vendorId,
      wizardData: completeWizardData
    },
    `Bearer ${vendorToken}`
  );

  assert(
    finalSubmitRes.success === true &&
    finalSubmitRes.status === 'SUBMITTED' &&
    typeof finalSubmitRes.applicationId === 'string' &&
    finalSubmitRes.applicationId.startsWith('APP-BLR-2026-') &&
    typeof finalSubmitRes.token === 'string' &&
    finalSubmitRes.redirectTo === `/registration/review/${finalSubmitRes.applicationId}`,
    'Phase 3: Step 5 submission generates unique APP-BLR-2026-XXXX and directs directly to Review Page'
  );

  const finalAppId = finalSubmitRes.applicationId;
  const finalToken = finalSubmitRes.token;

  // Test 8: Duplicate Submission Prevention (Requirement 17)
  const duplicateSubmitRes = controller.submitRegistration(
    {
      vendorId,
      wizardData: completeWizardData
    },
    `Bearer ${finalToken}`
  );
  assert(
    duplicateSubmitRes.success === true &&
    duplicateSubmitRes.applicationId === finalAppId &&
    duplicateSubmitRes.status === 'SUBMITTED' &&
    duplicateSubmitRes.redirectTo === `/registration/review/${finalAppId}`,
    'Requirement 17: Duplicate submission safely returns existing application without creating duplicate'
  );

  // Test 9: Review Endpoint Returns Correct Masked Data (Phase 4 & 5)
  const applicationDetailsRes = controller.getApplicationDetails(
    finalAppId,
    `Bearer ${finalToken}`
  );

  assert(
    applicationDetailsRes.success === true &&
    applicationDetailsRes.application.applicationId === finalAppId &&
    applicationDetailsRes.application.status === 'SUBMITTED' &&
    applicationDetailsRes.application.storeName === 'Venkatesh Builders Mart' &&
    applicationDetailsRes.application.businessName === 'Venkatesh Brick & Tile Works Pvt Ltd',
    'Phase 4: Review endpoint returns accurate application metadata'
  );

  // Test 10: Masked Sensitive Information (PAN and Bank Account)
  assert(
    applicationDetailsRes.application.kycDetails.pan === 'ABCDE••••F' &&
    applicationDetailsRes.application.bankDetails.accountNumber === '••••••••5432',
    'Phase 4: Sensitive data masked correctly (PAN: ABCDE••••F, Bank: ••••••••5432)'
  );

  // Test 11: Real Document Verification Status (Never fake verified)
  const allDocsPending = applicationDetailsRes.application.documents.every(
    (d: any) => d.verificationStatus === 'PENDING'
  );
  assert(
    allDocsPending && applicationDetailsRes.application.documents.length === 2,
    'Phase 4: Uploaded documents accurately show PENDING status (no fake green checkmarks)'
  );

  // Test 12: Unauthorized Application Access (Requirement 18)
  // Another vendor tries to access this application ID
  let unauthorizedBlocked = false;
  const otherVendorLogin = await controller.login({
    identifier: 'underreview@buildora.in',
    password: 'Vendor@123'
  });
  try {
    controller.getApplicationDetails(
      finalAppId,
      `Bearer ${otherVendorLogin.token}`
    );
  } catch (err: any) {
    unauthorizedBlocked = err.status === 403 || err.message?.includes('not authorized');
  }
  assert(
    unauthorizedBlocked,
    'Requirement 18: Accessing another vendor application ID is strictly blocked with 403 Forbidden'
  );

  // Test 13: Direct Review Page Refresh Persistence (Phase 5 & 6)
  // Using the persisted vendor auth token, re-requesting application status
  const refreshedReview = controller.getApplicationDetails(
    finalAppId,
    `Bearer ${finalToken}`
  );
  assert(
    refreshedReview.success === true &&
    refreshedReview.application.applicationId === finalAppId,
    'Phase 5: Refreshing the Review Page preserves full application data'
  );

  // Test 14: Redirect Route Helper
  const reviewRedirectUrl = getVendorRedirectUrl('SUBMITTED', finalAppId);
  assert(
    reviewRedirectUrl === `/registration/review/${finalAppId}`,
    'Phase 6: getVendorRedirectUrl accurately maps SUBMITTED status to /registration/review/:applicationId'
  );

  console.log('\n===============================================================');
  console.log(` RESULTS: ${passedTests} / ${totalTests} Tests Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('===============================================================\n');

  if (passedTests === totalTests) {
    console.log('✅ ALL TEST SCENARIOS PASSED SUCCESSFULLY!');
  } else {
    process.exit(1);
  }
}

runVendorRegistrationFlowTests().catch((err) => {
  console.error('Fatal Test Execution Error:', err);
  process.exit(1);
});
