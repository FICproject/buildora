/**
 * Comprehensive Automated Test Suite
 * BUILDORA 60: Vendor Login & Registration - Smart Pincode Lookup and Strict Field-Level Validation
 * Covers all 19 mandated verification scenarios across frontend validation, backend endpoints, and data persistence.
 */

import {
  validateName,
  isValidName,
  validateEmail,
  isValidEmail,
  validateIndianMobile,
  isValidMobile,
  validateIdentifier,
  validatePincode,
  isValidPincode,
  validateGSTIN,
  isValidGSTIN,
  validatePAN,
  isValidPAN,
  validateBankAccount,
  isValidBankAccount,
  validateIFSC,
  isValidIFSC,
  validatePassword,
  validateConfirmPassword,
  validateAddress
} from '../../packages/validation/src/index';

import { postalLookupService } from '../../services/backend/api/src/modules/vendors/services/postal-lookup.service';
import { VendorController } from '../../services/backend/api/src/modules/vendors/controllers/vendor.controller';
import { vendorSecurityService } from '../../services/backend/api/src/modules/vendors/services/vendor-security.service';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, details?: any) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${testName}`, details || '');
  }
}

async function runTestSuite() {
  console.log('\n========================================================================');
  console.log('BUILDORA 60: SMART PINCODE LOOKUP & STRICT FIELD-LEVEL VALIDATION SUITE');
  console.log('========================================================================\n');

  const controller = new VendorController();

  // --------------------------------------------------------------------------
  // SCENARIO 1: Name field validation (valid names, numbers rejected, special chars rejected)
  // --------------------------------------------------------------------------
  console.log('Scenario 1: Name Field Validation');
  assert(validateName('Vikramaditya Rao').isValid === true, 'Valid English full name accepted');
  assert(validateName('Dr. S. K. Narayana-Swamy').isValid === true, 'Valid name with dots and hyphens accepted');
  assert(validateName('ಆನಂದ್ ಕುಮಾರ್').isValid === true, 'Valid Indian regional Kannada Unicode name accepted');
  assert(validateName('Rajesh Kumar 123').isValid === false, 'Name with numbers strictly rejected');
  assert(validateName('R@jesh#Sharma').isValid === false, 'Name with symbols @ and # strictly rejected');
  assert(validateName('A').isValid === false, 'Name with less than 2 characters rejected');
  assert(validateName('').isValid === false, 'Empty name rejected');

  // --------------------------------------------------------------------------
  // SCENARIO 2: Email field format validation
  // --------------------------------------------------------------------------
  console.log('\nScenario 2: Email Field Format Validation');
  assert(validateEmail('partner@buildora.in').isValid === true, 'Standard business email accepted');
  assert(validateEmail('procurement.lead@apex-supplies.co.in').isValid === true, 'Multi-part domain email accepted');
  assert(validateEmail('invalid-email-no-at.com').isValid === false, 'Missing @ symbol rejected');
  assert(validateEmail('user@domain').isValid === false, 'Missing top-level domain rejected');
  assert(validateEmail('user @domain.com').isValid === false, 'Spaces inside email rejected');
  assert(validateEmail('').isValid === false, 'Empty email rejected');

  // --------------------------------------------------------------------------
  // SCENARIO 3: Mobile number validation (10 digits starting with 6, 7, 8, 9)
  // --------------------------------------------------------------------------
  console.log('\nScenario 3: Mobile Number Validation');
  assert(validateIndianMobile('9845012345').isValid === true, 'Valid 10-digit starting with 9 accepted');
  assert(validateIndianMobile('8765432109').isValid === true, 'Valid 10-digit starting with 8 accepted');
  assert(validateIndianMobile('7019876543').isValid === true, 'Valid 10-digit starting with 7 accepted');
  assert(validateIndianMobile('6362145890').isValid === true, 'Valid 10-digit starting with 6 accepted');
  assert(validateIndianMobile('+91 98450 12345').isValid === true, '+91 prefix formatted mobile accepted');
  assert(validateIndianMobile('5845012345').isValid === false, 'Mobile starting with 5 rejected');
  assert(validateIndianMobile('1234567890').isValid === false, 'Mobile starting with 1 rejected');
  assert(validateIndianMobile('98450ABCD5').isValid === false, 'Alphabets in mobile rejected');
  assert(validateIndianMobile('98450123').isValid === false, 'Incomplete 8-digit mobile rejected');

  // --------------------------------------------------------------------------
  // SCENARIO 4: Valid pincode entry & auto-lookup (e.g. 560072 fills Karnataka & Bengaluru)
  // --------------------------------------------------------------------------
  console.log('\nScenario 4: Valid Pincode Entry & Auto-Lookup (e.g. 560072)');
  const res560072 = await postalLookupService.lookup('560072');
  assert(res560072.success === true, 'Pincode 560072 lookup returned success');
  assert(res560072.state === 'Karnataka', 'Pincode 560072 state is Karnataka');
  assert(res560072.city === 'Bengaluru', 'Pincode 560072 city is Bengaluru');
  assert(res560072.country === 'India', 'Pincode 560072 country is India');

  // Controller API check
  const controllerLookup = await controller.lookupPincode('560072');
  assert(controllerLookup.state === 'Karnataka' && controllerLookup.city === 'Bengaluru', 'Controller endpoint @Get("pincode-lookup/:pincode") returns valid data');

  // --------------------------------------------------------------------------
  // SCENARIO 5: Pincode with multiple post offices / localities
  // --------------------------------------------------------------------------
  console.log('\nScenario 5: Pincode with Multiple Post Offices / Localities');
  assert(Array.isArray(res560072.localities) && res560072.localities.length > 1, 'Pincode 560072 has multiple localities returned');
  assert(res560072.localities.includes('Nagarbhavi') || res560072.localities.includes('Bangalore University') || res560072.localities.includes('RVCE'), 'Locality list includes expected post offices (Nagarbhavi/RVCE/Bangalore University)');

  // --------------------------------------------------------------------------
  // SCENARIO 6: Pincode changed after lookup (e.g., from 560072 to 110001)
  // --------------------------------------------------------------------------
  console.log('\nScenario 6: Pincode Changed After Lookup (New location returned)');
  const res110001 = await postalLookupService.lookup('110001');
  assert(res110001.state === 'Delhi', 'New pincode 110001 returns Delhi, replacing previous state Karnataka');
  assert(res110001.city === 'New Delhi', 'New pincode 110001 returns New Delhi');
  assert(res110001.localities.includes('Connaught Place'), 'Localities updated to Delhi areas (Connaught Place)');

  // --------------------------------------------------------------------------
  // SCENARIO 7: Invalid pincode format (rejected upfront)
  // --------------------------------------------------------------------------
  console.log('\nScenario 7: Invalid Pincode Format Validation');
  assert(validatePincode('012345').isValid === false, 'Pincode starting with 0 rejected');
  assert(validatePincode('56005').isValid === false, '5-digit pincode rejected');
  assert(validatePincode('5600589').isValid === false, '7-digit pincode rejected');
  assert(validatePincode('56005A').isValid === false, 'Alphanumeric pincode rejected');
  assert(validatePincode('ABCDEF').isValid === false, 'Non-digit pincode rejected');

  // --------------------------------------------------------------------------
  // SCENARIO 8: Non-existent / out-of-range pincode
  // --------------------------------------------------------------------------
  console.log('\nScenario 8: Non-Existent Pincode Exception Handling');
  let nonExistentHandled = false;
  try {
    await postalLookupService.lookup('999999');
  } catch (err: any) {
    nonExistentHandled = err.status === 404 || err.message.includes('not found') || err.message.includes('No location');
  }
  assert(nonExistentHandled, 'Unknown pincode 999999 throws 404 NotFoundException allowing manual fallback');

  // --------------------------------------------------------------------------
  // SCENARIO 9: Lookup API failure and manual entry fallback
  // --------------------------------------------------------------------------
  console.log('\nScenario 9: Manual Entry Fallback Support');
  // Manual address validation
  const manualAddressValid = validateAddress('Plot 45-B, Sector 18, Industrial Hub');
  assert(manualAddressValid.isValid === true, 'Manual address entry passes validation');
  assert(validateAddress('abc').isValid === false, 'Too short manual address (<5 chars) rejected');

  // --------------------------------------------------------------------------
  // SCENARIO 10: GSTIN format validation (valid vs invalid)
  // --------------------------------------------------------------------------
  console.log('\nScenario 10: GSTIN Format Validation');
  assert(validateGSTIN('29AABCB9876F1Z2').isValid === true, 'Valid 15-char Karnataka GSTIN accepted');
  assert(validateGSTIN('27AAACG0567D1Z5').isValid === true, 'Valid 15-char Maharashtra GSTIN accepted');
  assert(validateGSTIN('29AABCB9876F1Z').isValid === false, '14-char GSTIN rejected');
  assert(validateGSTIN('29AABCB9876F1Z2A').isValid === false, '16-char GSTIN rejected');
  assert(validateGSTIN('29AABCB9876F199').isValid === false, 'GSTIN missing entity code or Z rejected');

  // --------------------------------------------------------------------------
  // SCENARIO 11: PAN format validation (valid vs invalid)
  // --------------------------------------------------------------------------
  console.log('\nScenario 11: PAN Format Validation');
  assert(validatePAN('AABCB9876F').isValid === true, 'Valid Company PAN (C at 4th position) accepted');
  assert(validatePAN('AAACG0567D').isValid === true, 'Valid Company PAN accepted');
  assert(validatePAN('BPKPR1234K').isValid === true, 'Valid Individual PAN (P at 4th position) accepted');
  assert(validatePAN('AABC9876F').isValid === false, '9-char PAN rejected');
  assert(validatePAN('12345ABCDE').isValid === false, 'PAN starting with digits rejected');
  assert(validatePAN('AABXB9876F').isValid === false, 'PAN with invalid entity code (X) rejected');

  // --------------------------------------------------------------------------
  // SCENARIO 12: Bank account validation (9 to 18 digits)
  // --------------------------------------------------------------------------
  console.log('\nScenario 12: Bank Account Validation');
  assert(validateBankAccount('50200049182341').isValid === true, 'Valid 14-digit bank account accepted');
  assert(validateBankAccount('123456789').isValid === true, 'Valid 9-digit account accepted');
  assert(validateBankAccount('123456789012345678').isValid === true, 'Valid 18-digit account accepted');
  assert(validateBankAccount('12345678').isValid === false, '8-digit account (<9) rejected');
  assert(validateBankAccount('1234567890123456789').isValid === false, '19-digit account (>18) rejected');
  assert(validateBankAccount('5020004918234A').isValid === false, 'Alphabets in account number rejected');

  // --------------------------------------------------------------------------
  // SCENARIO 13: IFSC format validation (11 characters)
  // --------------------------------------------------------------------------
  console.log('\nScenario 13: IFSC Format Validation');
  assert(validateIFSC('HDFC0000053').isValid === true, 'Valid HDFC IFSC code accepted');
  assert(validateIFSC('SBIN0001234').isValid === true, 'Valid SBI IFSC code accepted');
  assert(validateIFSC('ICIC0000102').isValid === true, 'Valid ICICI IFSC code accepted');
  assert(validateIFSC('HDFC000053').isValid === false, '10-char IFSC rejected');
  assert(validateIFSC('HDFC1000053').isValid === false, 'IFSC with 5th character not 0 rejected');
  assert(validateIFSC('12340000053').isValid === false, 'IFSC starting with numbers rejected');

  // --------------------------------------------------------------------------
  // SCENARIO 14: Password complexity and mismatch validation
  // --------------------------------------------------------------------------
  console.log('\nScenario 14: Password Complexity & Mismatch Validation');
  const strongPass = validatePassword('Buildora@2026!');
  assert(strongPass.isValid === true && strongPass.strength === 'STRONG', 'Strong password accepted with all criteria satisfied');
  const weakPass = validatePassword('weak');
  assert(weakPass.isValid === false, 'Short password (<8 chars) rejected');
  const noUpper = validatePassword('buildora@123');
  assert(noUpper.isValid === false, 'Password without uppercase rejected');
  const noNumber = validatePassword('Buildora@Special');
  assert(noNumber.isValid === false, 'Password without numbers rejected');

  assert(validateConfirmPassword('Buildora@2026!', 'Buildora@2026!').isValid === true, 'Matching confirm password accepted');
  assert(validateConfirmPassword('Buildora@2026!', 'Different@123').isValid === false, 'Mismatched confirm password rejected');

  // --------------------------------------------------------------------------
  // SCENARIO 15: Invalid OTP vs Correct OTP
  // --------------------------------------------------------------------------
  console.log('\nScenario 15: OTP Generation and Verification');
  const testPhone = '9876543210';
  const otpRes = vendorSecurityService.generateAndStoreOtp(testPhone, 'REGISTRATION_MOBILE');
  assert(Boolean(otpRes.devOtpHint), 'OTP generated with dev hint');

  let invalidOtpCaught = false;
  try {
    vendorSecurityService.verifyOtp(testPhone, 'REGISTRATION_MOBILE', '000000');
  } catch (err) {
    invalidOtpCaught = true;
  }
  assert(invalidOtpCaught, 'Invalid OTP 000000 rejected with error');

  const validOtpVerified = vendorSecurityService.verifyOtp(testPhone, 'REGISTRATION_MOBILE', otpRes.devOtpHint!);
  assert(validOtpVerified === true, 'Correct OTP verified successfully');

  // --------------------------------------------------------------------------
  // SCENARIO 16: Empty required fields validation
  // --------------------------------------------------------------------------
  console.log('\nScenario 16: Empty Required Fields Rejected');
  let emptyStep1Caught = false;
  try {
    controller.registrationStep1({
      ownerName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: ''
    });
  } catch (err: any) {
    emptyStep1Caught = err.status === 400 || err.message.includes('required');
  }
  assert(emptyStep1Caught, 'Empty fields in Step 1 rejected by backend controller');

  // --------------------------------------------------------------------------
  // SCENARIO 17: Backend API validation bypass attempts (Strict server-side validation)
  // --------------------------------------------------------------------------
  console.log('\nScenario 17: Backend API Bypass Prevention');
  let invalidNameCaught = false;
  try {
    controller.registrationStep1({
      ownerName: 'Hacker123',
      email: 'hacker@example.com',
      phone: '9845012345',
      password: 'StrongPass@123',
      confirmPassword: 'StrongPass@123'
    });
  } catch (err: any) {
    invalidNameCaught = err.status === 400 && err.message.includes('numbers');
  }
  assert(invalidNameCaught, 'Backend rejects numeric characters in owner name during registrationStep1');

  let invalidMobileCaught = false;
  try {
    controller.registrationStep1({
      ownerName: 'Ramesh Patel',
      email: 'ramesh@example.com',
      phone: '5845012345', // Starts with 5
      password: 'StrongPass@123',
      confirmPassword: 'StrongPass@123'
    });
  } catch (err: any) {
    invalidMobileCaught = err.status === 400;
  }
  assert(invalidMobileCaught, 'Backend rejects non-compliant mobile number starting with 5');

  // --------------------------------------------------------------------------
  // SCENARIO 18: Registration draft save and resume (Pincode & location integrity)
  // --------------------------------------------------------------------------
  console.log('\nScenario 18: Registration Draft Save & Clean Address Integrity');
  const testEmail = `vendor-${Date.now()}@buildora-test.in`;
  const step1Result = controller.registrationStep1({
    ownerName: 'Sunil Kumar',
    email: testEmail,
    phone: '9988776655',
    password: 'Password@123',
    confirmPassword: 'Password@123'
  });
  assert(step1Result.success === true && Boolean(step1Result.vendorId), 'Step 1 registration created draft session');

  // Verify that draft address is initially clean (NOT hardcoded to Bengaluru/Karnataka)
  assert(step1Result.vendor.businessInfo.address.city === '', 'Draft city is not hardcoded to Bengaluru');
  assert(step1Result.vendor.businessInfo.address.state === '', 'Draft state is not hardcoded to Karnataka');
  assert(step1Result.vendor.businessInfo.address.pincode === '', 'Draft pincode is empty');

  // Save Step 3 address with specific pincode 560072
  const saveDraftRes = controller.saveRegistrationDraft(
    {
      vendorId: step1Result.vendorId,
      currentStep: 3,
      wizardData: {
        legalBusinessName: 'Sunil Steels Private Limited',
        storeName: 'Sunil Steels',
        businessType: 'MANUFACTURER',
        pincode: '560072',
        city: 'Bengaluru',
        state: 'Karnataka',
        country: 'India',
        completeAddress: 'Survey 14, Nagarbhavi Main Road, Bengaluru 560072'
      }
    }
  );
  assert(saveDraftRes.success === true, 'Draft address saved successfully');
  assert(saveDraftRes.vendor.businessInfo.address.pincode === '560072', 'Saved pincode 560072 persisted accurately');
  assert(saveDraftRes.vendor.businessInfo.address.city === 'Bengaluru', 'Saved city persisted accurately');
  assert(saveDraftRes.vendor.businessInfo.address.building.includes('Nagarbhavi'), 'Complete address persisted accurately');

  // --------------------------------------------------------------------------
  // SCENARIO 19: Full 5-step submission & Direct Review Page Navigation
  // --------------------------------------------------------------------------
  console.log('\nScenario 19: Full 5-Step Submission & Review Page Navigation');
  const submitRes = controller.submitRegistration({
    vendorId: step1Result.vendorId,
    wizardData: {
      ownerName: 'Sunil Kumar',
      email: testEmail,
      phone: '9988776655',
      isEmailVerified: true,
      isPhoneVerified: true,
      legalBusinessName: 'Sunil Steels Private Limited',
      storeName: 'Sunil Steels',
      businessType: 'MANUFACTURER',
      businessRegistrationType: 'PRIVATE_LIMITED',
      yearOfEstablishment: '2018',
      website: 'https://sunilsteels.com',
      description: 'Manufacturer of high tensile TMT structural steel rebars.',
      country: 'India',
      state: 'Karnataka',
      city: 'Bengaluru',
      area: 'Nagarbhavi',
      pincode: '560072',
      completeAddress: 'Survey 14, Nagarbhavi Main Road, Bengaluru 560072',
      dispatchAddress: 'Survey 14, Nagarbhavi Main Road, Bengaluru 560072',
      warehouses: [],
      gstin: '29AABCS1234F1Z8',
      pan: 'AABCS1234F',
      documents: [
        {
          id: `doc-${Date.now()}`,
          type: 'GST_CERTIFICATE',
          title: 'GST REG-06 Certificate',
          fileName: 'gst_certificate.pdf',
          fileSize: 102400,
          mimeType: 'application/pdf',
          fileUrl: '/secure/vault/documents/gst_certificate.pdf',
          uploadedAt: new Date().toISOString(),
          verificationStatus: 'PENDING'
        }
      ],
      bankDetails: {
        accountHolderName: 'Sunil Steels Private Limited',
        bankName: 'HDFC Bank',
        accountNumber: '50200049182341',
        ifsc: 'HDFC0000053',
        accountType: 'CURRENT'
      },
      productCategories: ['steel-structural-metals'],
      brandsSupplied: ['Tata Tiscon', 'Jindal Panther'],
      operatingLocations: ['Bengaluru Urban'],
      termsAccepted: true,
      privacyAccepted: true,
      currentStep: 5
    }
  });

  assert(submitRes.success === true, 'Vendor registration submitted successfully');
  assert(Boolean(submitRes.applicationId), 'Application ID generated: ' + submitRes.applicationId);
  assert(submitRes.status === 'SUBMITTED', 'Vendor status updated to SUBMITTED');
  assert(Boolean(submitRes.token), 'Authenticated session JWT token generated immediately');
  assert(
    submitRes.redirectTo === `/registration/review/${submitRes.applicationId}`,
    'Direct navigation route is strictly /registration/review/:id (NEVER /login)'
  );

  console.log('\n========================================================================');
  console.log(`RESULTS: ${passedTests} passed out of ${totalTests} assertions (${failedTests} failures).`);
  console.log('========================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
