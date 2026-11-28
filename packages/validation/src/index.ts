// Shared schema validations and data integrity checkers for BUILDORA 60
// Single source of truth used by both frontend (apps/vendor-web) and backend (services/backend/api).

export const VALIDATION_PATTERNS = {
  // Unicode-aware name: letters, combining marks, spaces, dots, apostrophes, hyphens (min 2, max 100)
  NAME: /^[\p{L}][\p{L}\p{M} .'-]{1,99}$/u,
  // Strict business email pattern
  EMAIL: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/,
  // Strict Indian 10-digit mobile number starting with 6, 7, 8, or 9
  INDIAN_MOBILE: /^[6-9][0-9]{9}$/,
  // Strict 6-digit Indian postal pincode starting with 1-9
  PINCODE: /^[1-9][0-9]{5}$/,
  // Indian PAN: 5 uppercase letters + 4 digits + 1 uppercase letter
  PAN: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
  // Indian Aadhaar: 12 numeric digits starting with 2-9
  AADHAAR: /^[2-9][0-9]{11}$/,
  // Indian Udyam MSME Registration Number: UDYAM-XX-00-0000000
  UDYAM: /^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$/,
  // Indian GSTIN structural pattern: 2-digit state + 10-char PAN + entity + 'Z' + check char
  GSTIN: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/,
  // Indian IFSC: 4 uppercase letters + '0' + 6 alphanumeric characters
  IFSC: /^[A-Z]{4}0[A-Z0-9]{6}$/,
  // Numeric bank account number (9 to 18 digits)
  BANK_ACCOUNT: /^[0-9]{9,18}$/,
  // Legal business name (letters, numbers, spaces, business punctuation, Unicode letters)
  LEGAL_BUSINESS_NAME: /^[\p{L}\p{N}][\p{L}\p{N}\p{M}\s.&,'\-\/()]{1,149}$/u,
  // Store / trade name
  STORE_NAME: /^[\p{L}\p{N}][\p{L}\p{N}\p{M}\s.&,'\-\/()]{1,99}$/u,
  // Location (city/state)
  CITY_OR_STATE: /^[\p{L}][\p{L}\p{M}\s.\-\/()]{1,79}$/u,
  // Registered address
  ADDRESS: /^[\p{L}\p{N}\p{M}\s.,\-\/#()&:'\r\n]{5,250}$/u,
  // Bank name
  BANK_NAME: /^[\p{L}\p{N}][\p{L}\p{N}\s.&'\-()]{1,79}$/u,
  // Website URL
  WEBSITE: /^https?:\/\/([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/[^\s]*)?$/i
} as const;

export const VALIDATION_LIMITS = {
  NAME_MIN: 2,
  NAME_MAX: 100,
  EMAIL_MAX: 100,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 128,
  LEGAL_BUSINESS_NAME_MIN: 2,
  LEGAL_BUSINESS_NAME_MAX: 150,
  STORE_NAME_MIN: 2,
  STORE_NAME_MAX: 100,
  DESCRIPTION_MAX: 1000,
  ADDRESS_MIN: 5,
  ADDRESS_MAX: 250,
  BANK_NAME_MIN: 2,
  BANK_NAME_MAX: 80,
  BANK_ACCOUNT_MIN: 9,
  BANK_ACCOUNT_MAX: 18,
  MAX_LOGO_SIZE_BYTES: 5 * 1024 * 1024, // 5 MB
  MAX_KYC_DOC_SIZE_BYTES: 5 * 1024 * 1024 // 5 MB
} as const;

export const ALLOWED_BUSINESS_TYPES = [
  'MANUFACTURER',
  'DISTRIBUTOR',
  'WHOLESALER',
  'DEALER',
  'RETAILER',
  'OTHER'
] as const;

export const ALLOWED_BUSINESS_REGISTRATION_TYPES = [
  'PRIVATE_LIMITED',
  'PUBLIC_LIMITED',
  'LLP',
  'PARTNERSHIP',
  'PROPRIETORSHIP',
  'OTHER'
] as const;

export const ALLOWED_BANK_ACCOUNT_TYPES = ['CURRENT', 'SAVINGS'] as const;
export const ALLOWED_GST_STATUSES = ['REGISTERED', 'NOT_REGISTERED', 'APPLIED'] as const;
export const ALLOWED_MSME_STATUSES = ['REGISTERED', 'NOT_REGISTERED', 'APPLIED'] as const;

export const ALLOWED_KYC_DOCUMENT_TYPES = [
  'AADHAAR_CARD',
  'PAN_CARD',
  'GST_CERTIFICATE',
  'GST_ACKNOWLEDGEMENT',
  'MSME_CERTIFICATE',
  'UDYAM_CERTIFICATE',
  'MSME_ACKNOWLEDGEMENT',
  'BUSINESS_REGISTRATION',
  'AUTHORIZED_ID',
  'CANCELLED_CHEQUE',
  'CATALOGUE',
  'OTHER'
] as const;

export const ALLOWED_LOGO_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] as const;
export const ALLOWED_KYC_DOC_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
] as const;

export const MAX_LOGO_SIZE_BYTES = VALIDATION_LIMITS.MAX_LOGO_SIZE_BYTES;
export const MAX_KYC_DOC_SIZE_BYTES = VALIDATION_LIMITS.MAX_KYC_DOC_SIZE_BYTES;

// Valid Indian GST State Codes (01-38, 97 Other Territory, 99 Centre Jurisdiction)
const VALID_GST_STATE_CODES = new Set([
  '01', '02', '03', '04', '05', '06', '07', '08', '09', '10',
  '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
  '21', '22', '23', '24', '25', '26', '27', '28', '29', '30',
  '31', '32', '33', '34', '35', '36', '37', '38', '97', '99'
]);

const GSTIN_CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export interface FieldValidationResult {
  isValid: boolean;
  error?: string;
  normalized?: string;
}

/**
 * Validates full name fields (Owner / Authorized Person Full Name, Account Beneficiary Name).
 * Accepts Unicode letters, spaces, dots, apostrophes, and hyphens (2 to 100 chars).
 * Strictly rejects numbers and unnecessary special symbols.
 */
export function validateName(name: string, fieldLabel = 'Full Name'): FieldValidationResult {
  if (typeof name !== 'string' || !name.trim()) {
    return { isValid: false, error: `${fieldLabel} is required.` };
  }
  const clean = name.trim().replace(/\s+/g, ' ');
  if (clean.length < VALIDATION_LIMITS.NAME_MIN) {
    return { isValid: false, error: `${fieldLabel} must be at least ${VALIDATION_LIMITS.NAME_MIN} characters long.` };
  }
  if (clean.length > VALIDATION_LIMITS.NAME_MAX) {
    return { isValid: false, error: `${fieldLabel} cannot exceed ${VALIDATION_LIMITS.NAME_MAX} characters.` };
  }
  if (/\d/.test(clean)) {
    return { isValid: false, error: `${fieldLabel} must not contain numbers.` };
  }
  if (!VALIDATION_PATTERNS.NAME.test(clean)) {
    return {
      isValid: false,
      error: `${fieldLabel} must contain only letters, spaces, dots, hyphens, or apostrophes.`
    };
  }
  // Ensure it contains at least 2 actual letters (prevents strings like "A...")
  const letterCount = (clean.match(/\p{L}/gu) || []).length;
  if (letterCount < 2) {
    return { isValid: false, error: `${fieldLabel} must contain at least 2 alphabetic letters.` };
  }
  return { isValid: true, normalized: clean };
}

export function isValidName(name: string): boolean {
  return validateName(name).isValid;
}

export function validateAccountBeneficiaryName(name: string): FieldValidationResult {
  return validateName(name, 'Account Beneficiary Name');
}

/**
 * Validates official business email address.
 * Rejects spaces, invalid domains, consecutive dots, and malformed addresses.
 */
export function validateEmail(email: string): FieldValidationResult {
  if (typeof email !== 'string' || !email.trim()) {
    return { isValid: false, error: 'Please enter a valid business email address.' };
  }
  const clean = email.trim().toLowerCase();
  if (clean.length > VALIDATION_LIMITS.EMAIL_MAX) {
    return { isValid: false, error: `Email address cannot exceed ${VALIDATION_LIMITS.EMAIL_MAX} characters.` };
  }
  if (/\s/.test(clean) || clean.includes('..')) {
    return { isValid: false, error: 'Please enter a valid business email address.' };
  }
  if (!VALIDATION_PATTERNS.EMAIL.test(clean)) {
    return { isValid: false, error: 'Please enter a valid business email address.' };
  }
  const [localPart, domainPart] = clean.split('@');
  if (!localPart || !domainPart || localPart.startsWith('.') || localPart.endsWith('.')) {
    return { isValid: false, error: 'Please enter a valid business email address.' };
  }
  const domainLabels = domainPart.split('.');
  const tld = domainLabels[domainLabels.length - 1];
  if (!tld || tld.length < 2 || !/^[a-z]{2,}$/i.test(tld)) {
    return { isValid: false, error: 'Please enter a valid business email address.' };
  }
  return { isValid: true, normalized: clean };
}

export function isValidEmail(email: string): boolean {
  return validateEmail(email).isValid;
}

/**
 * Strictly validates Indian 10-digit mobile number using ^[6-9][0-9]{9}$.
 * Does NOT strip characters or silently truncate invalid numbers.
 * Rejects spaces, alphabets, special characters, <10 digits, >10 digits, or numbers starting with 0-5.
 */
export function validateIndianMobile(phone: string): FieldValidationResult {
  if (typeof phone !== 'string' || phone.length === 0 || !phone.trim()) {
    return { isValid: false, error: 'Enter a valid 10-digit mobile number starting with 6–9.' };
  }
  if (!VALIDATION_PATTERNS.INDIAN_MOBILE.test(phone)) {
    return { isValid: false, error: 'Enter a valid 10-digit mobile number starting with 6–9.' };
  }
  return { isValid: true, normalized: phone };
}

export function isValidMobile(phone: string): boolean {
  return validateIndianMobile(phone).isValid;
}

/**
 * Validates login identifier which can be either an email address or a 10-digit mobile number
 * (optionally prefixed with +91 on login forms).
 */
export function validateIdentifier(identifier: string): {
  isValid: boolean;
  type: 'EMAIL' | 'MOBILE' | 'INVALID';
  error?: string;
  normalized?: string;
} {
  if (typeof identifier !== 'string' || !identifier.trim()) {
    return { isValid: false, type: 'INVALID', error: 'Please enter your registered email or 10-digit mobile number.' };
  }
  const clean = identifier.trim();
  if (clean.includes('@')) {
    const res = validateEmail(clean);
    return { isValid: res.isValid, type: res.isValid ? 'EMAIL' : 'INVALID', error: res.error, normalized: res.normalized };
  }
  // Allow optional +91 prefix only for login identifier lookup while enforcing strict 10-digit rule
  const candidate = clean.startsWith('+91') ? clean.slice(3).replace(/\s+/g, '') : clean;
  const res = validateIndianMobile(candidate);
  return {
    isValid: res.isValid,
    type: res.isValid ? 'MOBILE' : 'INVALID',
    error: res.isValid ? undefined : 'Enter a valid business email or 10-digit mobile number starting with 6–9.',
    normalized: res.normalized
  };
}

/**
 * Strictly validates 6-digit Indian Postal Pincode using ^[1-9][0-9]{5}$.
 */
export function validatePincode(pincode: string): FieldValidationResult {
  if (typeof pincode !== 'string' || !pincode.trim()) {
    return { isValid: false, error: 'Enter a valid 6-digit pincode starting with 1–9.' };
  }
  if (!VALIDATION_PATTERNS.PINCODE.test(pincode)) {
    return { isValid: false, error: 'Enter a valid 6-digit pincode starting with 1–9.' };
  }
  return { isValid: true, normalized: pincode };
}

export function isValidPincode(pincode: string): boolean {
  return validatePincode(pincode).isValid;
}

/**
 * Computes official Mod-36 GSTIN check digit for the first 14 characters.
 */
export function computeGstinChecksum(gstin14: string): string {
  const clean = (gstin14 || '').trim().toUpperCase();
  if (clean.length < 14) return '';
  let factor = 1;
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const code = GSTIN_CHARSET.indexOf(clean[i]);
    if (code === -1) return '';
    const product = code * factor;
    sum += Math.floor(product / 36) + (product % 36);
    factor = factor === 1 ? 2 : 1;
  }
  const remainder = sum % 36;
  return GSTIN_CHARSET[(36 - remainder) % 36];
}

/**
 * Validates Indian GSTIN structural pattern, valid state code, embedded PAN holder code,
 * and evaluates the official Mod-36 checksum.
 */
export function validateGSTIN(
  gstin: string,
  options?: { strictChecksum?: boolean }
): FieldValidationResult & { checksumValid?: boolean; warning?: string } {
  if (typeof gstin !== 'string' || !gstin.trim()) {
    return { isValid: false, error: 'Enter a valid GSTIN.' };
  }
  const clean = gstin.trim().toUpperCase();
  if (clean.length !== 15 || !VALIDATION_PATTERNS.GSTIN.test(clean)) {
    return { isValid: false, error: 'Enter a valid GSTIN.' };
  }
  const stateCode = clean.slice(0, 2);
  if (!VALID_GST_STATE_CODES.has(stateCode)) {
    return { isValid: false, error: 'GSTIN has an invalid Indian state code.' };
  }
  const panEntityCode = clean[5];
  if (!/[CPHFATBLJG]/.test(panEntityCode)) {
    return { isValid: false, error: 'Enter a valid GSTIN.' };
  }

  const expectedChecksum = computeGstinChecksum(clean);
  const checksumValid = Boolean(expectedChecksum && clean[14] === expectedChecksum);

  if (options?.strictChecksum && !checksumValid) {
    return {
      isValid: false,
      checksumValid: false,
      error: 'GSTIN checksum verification failed. Please check the 15th character.'
    };
  }

  return {
    isValid: true,
    normalized: clean,
    checksumValid,
    warning: checksumValid
      ? undefined
      : 'Structure matches GSTIN format, but check digit does not match Mod-36 checksum — verify against your GST REG-06 certificate.'
  };
}

export function isValidGSTIN(gstin: string): boolean {
  return validateGSTIN(gstin).isValid;
}

/**
 * Validates Indian PAN (Permanent Account Number): ^[A-Z]{5}[0-9]{4}[A-Z]$.
 * Normalizes to uppercase and validates 4th-character entity status [CPHFATBLJG].
 */
export function validatePAN(pan: string): FieldValidationResult {
  if (typeof pan !== 'string' || !pan.trim()) {
    return { isValid: false, error: 'Enter a valid 10-character PAN.' };
  }
  const clean = pan.trim().toUpperCase();
  if (clean.length !== 10 || !VALIDATION_PATTERNS.PAN.test(clean)) {
    return { isValid: false, error: 'Enter a valid 10-character PAN.' };
  }
  const fourthChar = clean[3];
  if (!/[CPHFATBLJG]/.test(fourthChar)) {
    return {
      isValid: false,
      error: 'Invalid PAN entity code at 4th position (must be C, P, H, F, A, T, B, L, J, or G).'
    };
  }
  return { isValid: true, normalized: clean };
}

export function isValidPAN(pan: string): boolean {
  return validatePAN(pan).isValid;
}

/**
 * Validates 12-digit Indian Aadhaar Number (must start with 2-9, rejects repeated digits).
 */
export function validateAadhaar(aadhaar: string): FieldValidationResult {
  if (typeof aadhaar !== 'string' || !aadhaar.trim()) {
    return { isValid: false, error: 'Aadhaar Number is required.' };
  }
  const clean = aadhaar.replace(/[\s-]+/g, '').trim();
  if (!/^\d+$/.test(clean)) {
    return { isValid: false, error: 'Aadhaar Number must contain 12 numeric digits only.' };
  }
  if (clean.length !== 12) {
    return { isValid: false, error: 'Aadhaar Number must be exactly 12 digits.' };
  }
  if (!VALIDATION_PATTERNS.AADHAAR.test(clean)) {
    return { isValid: false, error: 'Enter a valid 12-digit Aadhaar Number (cannot start with 0 or 1).' };
  }
  if (/^(\d)\1+$/.test(clean)) {
    return { isValid: false, error: 'Enter a valid 12-digit Aadhaar Number.' };
  }
  return { isValid: true, normalized: clean };
}

export function isValidAadhaar(aadhaar: string): boolean {
  return validateAadhaar(aadhaar).isValid;
}

/**
 * Validates Indian Udyam MSME Registration Number: UDYAM-XX-00-0000000.
 */
export function validateUdyamNumber(udyam: string): FieldValidationResult {
  if (typeof udyam !== 'string' || !udyam.trim()) {
    return { isValid: false, error: 'Udyam Registration Number is required.' };
  }
  const clean = udyam.trim().toUpperCase();
  if (!VALIDATION_PATTERNS.UDYAM.test(clean)) {
    return {
      isValid: false,
      error: 'Enter a valid Udyam Number in format UDYAM-XX-00-0000000 (e.g. UDYAM-KA-03-0012345).'
    };
  }
  return { isValid: true, normalized: clean };
}

/**
 * Validates optional GST / MSME Application Reference / ARN Number when provided.
 */
export function validateApplicationReference(
  ref: string,
  fieldLabel = 'Application Reference Number'
): FieldValidationResult {
  const clean = typeof ref === 'string' ? ref.trim().toUpperCase() : '';
  if (!clean) {
    return { isValid: true, normalized: '' };
  }
  if (clean.length < 6 || clean.length > 35 || !/^[A-Z0-9\-\/]+$/.test(clean)) {
    return {
      isValid: false,
      error: `${fieldLabel} must be 6–35 alphanumeric characters (letters, digits, '-' or '/').`
    };
  }
  return { isValid: true, normalized: clean };
}

/**
 * Preserves existing business-type verification rules for Trade License / Incorporation Certificate.
 */
export function isTradeLicenseRequired(businessRegistrationType?: string): boolean {
  const clean = String(businessRegistrationType || '').trim().toUpperCase();
  if (!clean) return true;
  return ALLOWED_BUSINESS_REGISTRATION_TYPES.includes(clean as any);
}

export function maskAadhaar(aadhaar?: string): string {
  const digits = String(aadhaar || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length < 4) return 'XXXX XXXX XXXX';
  return `XXXX XXXX ${digits.slice(-4)}`;
}

export function maskPan(pan?: string): string {
  const clean = String(pan || '').trim().toUpperCase();
  if (!clean) return '';
  if (clean.length <= 4) return 'XXXXXX';
  return `${clean.slice(0, 3)}XXXXXX${clean.slice(-1)}`;
}

export function maskBankAccount(acc?: string): string {
  const clean = String(acc || '').replace(/\s+/g, '');
  if (!clean) return '';
  if (clean.length <= 4) return clean;
  return `XXXX${clean.slice(-4)}`;
}

/**
 * Validates Indian Bank Account Number (numeric only, 9 to 18 digits).
 */
export function validateBankAccount(accountNumber: string): FieldValidationResult {
  if (typeof accountNumber !== 'string' || !accountNumber.trim()) {
    return { isValid: false, error: 'Bank account number is required.' };
  }
  if (!VALIDATION_PATTERNS.BANK_ACCOUNT.test(accountNumber)) {
    if (/\D/.test(accountNumber)) {
      return { isValid: false, error: 'Bank account number must contain numeric digits only.' };
    }
    return { isValid: false, error: 'Bank account number must be between 9 and 18 digits.' };
  }
  // Reject trivial repeated single digit like 000000000
  if (/^(\d)\1+$/.test(accountNumber)) {
    return { isValid: false, error: 'Enter a valid bank account number.' };
  }
  return { isValid: true, normalized: accountNumber };
}

export function isValidBankAccount(accountNumber: string): boolean {
  return validateBankAccount(accountNumber).isValid;
}

export function validateConfirmBankAccount(accountNumber: string, confirmAccountNumber: string): FieldValidationResult {
  if (typeof confirmAccountNumber !== 'string' || !confirmAccountNumber) {
    return { isValid: false, error: 'Please confirm your bank account number.' };
  }
  if (/\D/.test(confirmAccountNumber)) {
    return { isValid: false, error: 'Confirm account number must contain numeric digits only.' };
  }
  if (accountNumber !== confirmAccountNumber) {
    return { isValid: false, error: 'Bank account numbers do not match.' };
  }
  return { isValid: true, normalized: confirmAccountNumber };
}

/**
 * Validates Indian Financial System Code (IFSC): ^[A-Z]{4}0[A-Z0-9]{6}$.
 */
export function validateIFSC(ifsc: string): FieldValidationResult {
  if (typeof ifsc !== 'string' || !ifsc.trim()) {
    return { isValid: false, error: 'Enter a valid 11-character IFSC code.' };
  }
  const clean = ifsc.trim().toUpperCase();
  if (clean.length !== 11 || !VALIDATION_PATTERNS.IFSC.test(clean)) {
    return { isValid: false, error: 'Enter a valid 11-character IFSC code.' };
  }
  return { isValid: true, normalized: clean };
}

export function isValidIFSC(ifsc: string): boolean {
  return validateIFSC(ifsc).isValid;
}

/**
 * Validates enterprise password and computes security strength.
 * Requirements: min 8 characters (max 128), at least 1 uppercase, 1 lowercase, 1 digit, 1 special character.
 */
export function validatePassword(password: string): {
  isValid: boolean;
  score: number;
  strength: 'WEAK' | 'MEDIUM' | 'STRONG';
  error?: string;
  criteria: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
} {
  const val = typeof password === 'string' ? password : '';
  const criteria = {
    length: val.length >= VALIDATION_LIMITS.PASSWORD_MIN && val.length <= VALIDATION_LIMITS.PASSWORD_MAX,
    uppercase: /[A-Z]/.test(val),
    lowercase: /[a-z]/.test(val),
    number: /[0-9]/.test(val),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(val)
  };

  const score = Object.values(criteria).filter(Boolean).length;
  let strength: 'WEAK' | 'MEDIUM' | 'STRONG' = 'WEAK';
  if (score >= 5) strength = 'STRONG';
  else if (score >= 3) strength = 'MEDIUM';

  const isValid = score === 5 && !/\s/.test(val);
  let error: string | undefined;
  if (!val) {
    error = 'Password is required.';
  } else if (val.length > VALIDATION_LIMITS.PASSWORD_MAX) {
    error = `Password cannot exceed ${VALIDATION_LIMITS.PASSWORD_MAX} characters.`;
  } else if (/\s/.test(val)) {
    error = 'Password must not contain spaces.';
  } else if (!isValid) {
    error = 'Password does not meet the required security criteria.';
  }

  return { isValid, score, strength, error, criteria };
}

/**
 * Validates confirm password matches password.
 */
export function validateConfirmPassword(password: string, confirmPassword: string): FieldValidationResult {
  if (!confirmPassword) {
    return { isValid: false, error: 'Please confirm your password.' };
  }
  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match.' };
  }
  return { isValid: true };
}

/**
 * Validates registered business address.
 */
export function validateAddress(address: string): FieldValidationResult {
  if (typeof address !== 'string' || !address.trim()) {
    return { isValid: false, error: 'Registered business address is required.' };
  }
  const clean = address.trim();
  if (clean.length < VALIDATION_LIMITS.ADDRESS_MIN) {
    return { isValid: false, error: 'Address must be at least 5 characters long.' };
  }
  if (clean.length > VALIDATION_LIMITS.ADDRESS_MAX) {
    return { isValid: false, error: 'Address cannot exceed 250 characters.' };
  }
  if (!VALIDATION_PATTERNS.ADDRESS.test(clean)) {
    return { isValid: false, error: 'Address contains unsupported special characters.' };
  }
  if (!/[\p{L}\p{N}]/u.test(clean)) {
    return { isValid: false, error: 'Enter a valid street and building address.' };
  }
  return { isValid: true, normalized: clean };
}

/**
 * Validates year of establishment (optional).
 */
export function validateYearOfEstablishment(year: string): FieldValidationResult {
  if (!year || !year.trim()) {
    return { isValid: true, normalized: '' };
  }
  const clean = year.trim();
  if (!/^\d{4}$/.test(clean)) {
    return { isValid: false, error: 'Year must be a 4-digit number (e.g. 2018).' };
  }
  const currentYear = new Date().getFullYear();
  const num = parseInt(clean, 10);
  if (num < 1800 || num > currentYear) {
    return { isValid: false, error: `Year must be between 1800 and ${currentYear}.` };
  }
  return { isValid: true, normalized: clean };
}

/**
 * Validates website URL (optional).
 */
export function validateWebsite(website: string): FieldValidationResult {
  if (!website || !website.trim()) {
    return { isValid: true, normalized: '' };
  }
  const clean = website.trim();
  if (clean.length > 200 || !VALIDATION_PATTERNS.WEBSITE.test(clean)) {
    return { isValid: false, error: 'Enter a valid website URL starting with http:// or https://.' };
  }
  return { isValid: true, normalized: clean };
}

/**
 * Validates business description (optional, max 1000 chars).
 */
export function validateBusinessDescription(description: string): FieldValidationResult {
  if (!description || !description.trim()) {
    return { isValid: true, normalized: '' };
  }
  const clean = description.trim();
  if (clean.length > VALIDATION_LIMITS.DESCRIPTION_MAX) {
    return { isValid: false, error: `Description cannot exceed ${VALIDATION_LIMITS.DESCRIPTION_MAX} characters.` };
  }
  return { isValid: true, normalized: clean };
}

/**
 * Validates Legal Entity Business Name (max 150) or Store / Trade Name (max 100).
 */
export function validateBusinessName(
  name: string,
  fieldLabel = 'Business Name',
  maxLength: number = VALIDATION_LIMITS.LEGAL_BUSINESS_NAME_MAX
): FieldValidationResult {
  if (typeof name !== 'string' || !name.trim()) {
    return { isValid: false, error: `${fieldLabel} is required.` };
  }
  const clean = name.trim().replace(/\s+/g, ' ');
  if (clean.length < 2) {
    return { isValid: false, error: `${fieldLabel} must be at least 2 characters long.` };
  }
  if (clean.length > maxLength) {
    return { isValid: false, error: `${fieldLabel} cannot exceed ${maxLength} characters.` };
  }
  const pattern =
    maxLength <= VALIDATION_LIMITS.STORE_NAME_MAX
      ? VALIDATION_PATTERNS.STORE_NAME
      : VALIDATION_PATTERNS.LEGAL_BUSINESS_NAME;
  if (!pattern.test(clean)) {
    return { isValid: false, error: `${fieldLabel} contains unsupported special characters.` };
  }
  // Reject meaningless values without at least 2 letters
  const letterCount = (clean.match(/\p{L}/gu) || []).length;
  if (letterCount < 2) {
    return { isValid: false, error: `Enter a valid ${fieldLabel.toLowerCase()}.` };
  }
  return { isValid: true, normalized: clean };
}

export function validateLegalBusinessName(name: string): FieldValidationResult {
  return validateBusinessName(name, 'Legal Entity Business Name', VALIDATION_LIMITS.LEGAL_BUSINESS_NAME_MAX);
}

export function validateStoreName(name: string): FieldValidationResult {
  return validateBusinessName(name, 'Trade Name / Store Name', VALIDATION_LIMITS.STORE_NAME_MAX);
}

export function validateBusinessType(value: string): FieldValidationResult {
  if (!value || !ALLOWED_BUSINESS_TYPES.includes(value as any)) {
    return { isValid: false, error: 'Please select a valid Business Supplier Type.' };
  }
  return { isValid: true, normalized: value };
}

export function validateBusinessRegistrationType(value: string): FieldValidationResult {
  if (!value || !ALLOWED_BUSINESS_REGISTRATION_TYPES.includes(value as any)) {
    return { isValid: false, error: 'Please select a valid Business Registration Constitution.' };
  }
  return { isValid: true, normalized: value };
}

/**
 * Validates City or State name.
 */
export function validateCityOrState(value: string, fieldLabel = 'Location'): FieldValidationResult {
  if (typeof value !== 'string' || !value.trim()) {
    return { isValid: false, error: `${fieldLabel} is required.` };
  }
  const clean = value.trim().replace(/\s+/g, ' ');
  if (clean.length < 2 || clean.length > 80) {
    return { isValid: false, error: `${fieldLabel} must be between 2 and 80 characters.` };
  }
  if (!VALIDATION_PATTERNS.CITY_OR_STATE.test(clean)) {
    return { isValid: false, error: `${fieldLabel} must contain alphabetic characters only.` };
  }
  return { isValid: true, normalized: clean };
}

/**
 * Validates Bank Name (requires letters, rejects numeric-only or meaningless values).
 */
export function validateBankName(bankName: string): FieldValidationResult {
  if (typeof bankName !== 'string' || !bankName.trim()) {
    return { isValid: false, error: 'Bank Name is required.' };
  }
  const clean = bankName.trim().replace(/\s+/g, ' ');
  if (clean.length < VALIDATION_LIMITS.BANK_NAME_MIN || clean.length > VALIDATION_LIMITS.BANK_NAME_MAX) {
    return { isValid: false, error: 'Bank Name must be between 2 and 80 characters.' };
  }
  if (!VALIDATION_PATTERNS.BANK_NAME.test(clean)) {
    return { isValid: false, error: 'Bank Name contains invalid characters.' };
  }
  const letterCount = (clean.match(/\p{L}/gu) || []).length;
  if (letterCount < 2) {
    return { isValid: false, error: 'Enter a valid Bank Name.' };
  }
  return { isValid: true, normalized: clean };
}

export function validateBankAccountType(accountType: string): FieldValidationResult {
  if (!accountType || !ALLOWED_BANK_ACCOUNT_TYPES.includes(accountType as any)) {
    return { isValid: false, error: 'Select a valid bank account type (Current or Savings).' };
  }
  return { isValid: true, normalized: accountType };
}

/**
 * Inspects leading magic bytes to detect genuine JPEG, PNG, or WEBP image signatures.
 * Works with both browser Uint8Array and Node Buffer.
 */
export function detectImageSignature(bytes: Uint8Array): { mimeType: string; ext: string } | null {
  if (!bytes || bytes.length < 12) return null;

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mimeType: 'image/jpeg', ext: 'jpg' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { mimeType: 'image/png', ext: 'png' };
  }

  // WEBP: "RIFF" .... "WEBP"
  const riff = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
  const webp = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
  if (riff === 'RIFF' && webp === 'WEBP') {
    return { mimeType: 'image/webp', ext: 'webp' };
  }

  return null;
}

/**
 * Inspects leading magic bytes to detect genuine PDF, JPEG, or PNG document signatures.
 */
export function detectKycDocumentSignature(bytes: Uint8Array): { mimeType: string; ext: string } | null {
  if (!bytes || bytes.length < 8) return null;

  // PDF: "%PDF-"
  if (
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  ) {
    return { mimeType: 'application/pdf', ext: 'pdf' };
  }

  // JPEG, PNG, or WEBP
  const img = detectImageSignature(bytes);
  if (img && (img.mimeType === 'image/jpeg' || img.mimeType === 'image/png' || img.mimeType === 'image/webp')) {
    return img;
  }

  return null;
}

/**
 * Validates logo file MIME type, extension, and size on client & server.
 */
export function validateLogoFileMetadata(
  mimeType: string,
  sizeBytes: number,
  fileName?: string
): FieldValidationResult {
  if (!mimeType || !ALLOWED_LOGO_MIME_TYPES.includes(mimeType.toLowerCase() as any)) {
    return { isValid: false, error: 'Only JPG, JPEG, PNG, and WEBP image formats are supported for business logos.' };
  }
  if (fileName) {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (!ext || !['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
      return { isValid: false, error: 'Invalid file extension. Allowed extensions: .jpg, .jpeg, .png, .webp.' };
    }
  }
  if (!sizeBytes || sizeBytes <= 0) {
    return { isValid: false, error: 'Uploaded image file is empty.' };
  }
  if (sizeBytes > MAX_LOGO_SIZE_BYTES) {
    return { isValid: false, error: 'Business logo file size must not exceed 5 MB.' };
  }
  return { isValid: true };
}

/**
 * Validates KYC document file MIME type, extension, and size (PDF, JPG, JPEG, PNG, WEBP <= 5 MB).
 */
export function validateKycDocumentMetadata(
  mimeType: string,
  sizeBytes: number,
  fileName?: string
): FieldValidationResult {
  if (!mimeType || !ALLOWED_KYC_DOC_MIME_TYPES.includes(mimeType.toLowerCase() as any)) {
    return {
      isValid: false,
      error: 'Only PDF, JPG, JPEG, PNG, and WEBP formats are supported for KYC documents.',
    };
  }
  if (fileName) {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (!ext || !['pdf', 'jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
      return {
        isValid: false,
        error: 'Invalid document extension. Allowed: .pdf, .jpg, .jpeg, .png, .webp.',
      };
    }
  }
  if (!sizeBytes || sizeBytes <= 0) {
    return { isValid: false, error: 'Uploaded document file is empty.' };
  }
  if (sizeBytes > MAX_KYC_DOC_SIZE_BYTES) {
    return { isValid: false, error: 'KYC document file size must not exceed 5 MB.' };
  }
  return { isValid: true };
}

export interface StepValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validates Step 1 registration payload consistently across frontend & backend.
 */
export function validateVendorStep1(data: {
  ownerName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}): StepValidationResult {
  const errors: Record<string, string> = {};

  const nameCheck = validateName(data.ownerName || '', 'Owner / Authorized Person Full Name');
  if (!nameCheck.isValid && nameCheck.error) errors.ownerName = nameCheck.error;

  const emailCheck = validateEmail(data.email || '');
  if (!emailCheck.isValid && emailCheck.error) errors.email = emailCheck.error;

  const phoneCheck = validateIndianMobile(data.phone || '');
  if (!phoneCheck.isValid && phoneCheck.error) errors.phone = phoneCheck.error;

  if (data.password !== undefined) {
    const passCheck = validatePassword(data.password || '');
    if (!passCheck.isValid && passCheck.error) errors.password = passCheck.error;

    if (data.confirmPassword !== undefined) {
      const confirmCheck = validateConfirmPassword(data.password || '', data.confirmPassword || '');
      if (!confirmCheck.isValid && confirmCheck.error) errors.confirmPassword = confirmCheck.error;
    }
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

/**
 * Validates Step 2 Business Information payload consistently across frontend & backend.
 */
export function validateVendorStep2(data: {
  legalBusinessName?: string;
  storeName?: string;
  businessType?: string;
  businessRegistrationType?: string;
  yearOfEstablishment?: string;
  website?: string;
  description?: string;
}): StepValidationResult {
  const errors: Record<string, string> = {};

  const legalCheck = validateLegalBusinessName(data.legalBusinessName || '');
  if (!legalCheck.isValid && legalCheck.error) errors.legalBusinessName = legalCheck.error;

  const storeCheck = validateStoreName(data.storeName || '');
  if (!storeCheck.isValid && storeCheck.error) errors.storeName = storeCheck.error;

  const bizTypeCheck = validateBusinessType(data.businessType || '');
  if (!bizTypeCheck.isValid && bizTypeCheck.error) errors.businessType = bizTypeCheck.error;

  const regTypeCheck = validateBusinessRegistrationType(data.businessRegistrationType || '');
  if (!regTypeCheck.isValid && regTypeCheck.error) errors.businessRegistrationType = regTypeCheck.error;

  const yearCheck = validateYearOfEstablishment(data.yearOfEstablishment || '');
  if (!yearCheck.isValid && yearCheck.error) errors.yearOfEstablishment = yearCheck.error;

  const webCheck = validateWebsite(data.website || '');
  if (!webCheck.isValid && webCheck.error) errors.website = webCheck.error;

  const descCheck = validateBusinessDescription(data.description || '');
  if (!descCheck.isValid && descCheck.error) errors.description = descCheck.error;

  return { isValid: Object.keys(errors).length === 0, errors };
}

/**
 * Validates Step 3 Address Information payload consistently across frontend & backend.
 */
export function validateVendorStep3(data: {
  pincode?: string;
  country?: string;
  state?: string;
  city?: string;
  completeAddress?: string;
}): StepValidationResult {
  const errors: Record<string, string> = {};

  const pinCheck = validatePincode(data.pincode || '');
  if (!pinCheck.isValid && pinCheck.error) errors.pincode = pinCheck.error;

  if (data.country && data.country.trim().toLowerCase() !== 'india') {
    errors.country = 'Currently only Indian vendor locations are supported.';
  }

  const stateCheck = validateCityOrState(data.state || '', 'State');
  if (!stateCheck.isValid && stateCheck.error) errors.state = stateCheck.error;

  const cityCheck = validateCityOrState(data.city || '', 'City / Region');
  if (!cityCheck.isValid && cityCheck.error) errors.city = cityCheck.error;

  const addrCheck = validateAddress(data.completeAddress || '');
  if (!addrCheck.isValid && addrCheck.error) errors.completeAddress = addrCheck.error;

  return { isValid: Object.keys(errors).length === 0, errors };
}

/**
 * Validates Step 4 KYC & Tax Information payload consistently across frontend & backend.
 */
export function validateVendorStep4(data: {
  aadhaarNumber?: string;
  gstStatus?: string;
  gstin?: string;
  gstApplicationNumber?: string;
  pan?: string;
  msmeStatus?: string;
  udyamNumber?: string;
  msmeApplicationNumber?: string;
  businessRegistrationType?: string;
  documents?: Array<{ type?: string; fileName?: string; fileSize?: number; mimeType?: string }>;
}): StepValidationResult {
  const errors: Record<string, string> = {};

  // A. Aadhaar validation
  const aadhaarCheck = validateAadhaar(data.aadhaarNumber || '');
  if (!aadhaarCheck.isValid && aadhaarCheck.error) {
    errors.aadhaarNumber = aadhaarCheck.error;
  }

  // B. PAN validation
  const panCheck = validatePAN(data.pan || '');
  if (!panCheck.isValid && panCheck.error) {
    errors.pan = panCheck.error;
  }

  // C. GST Status & conditional validation
  const gstStatus = String(data.gstStatus || '').trim().toUpperCase();
  if (!ALLOWED_GST_STATUSES.includes(gstStatus as any)) {
    errors.gstStatus = 'Please select your GST Registration Status.';
  } else if (gstStatus === 'REGISTERED') {
    const gstCheck = validateGSTIN(data.gstin || '');
    if (!gstCheck.isValid && gstCheck.error) errors.gstin = gstCheck.error;
  } else if (gstStatus === 'APPLIED' && data.gstApplicationNumber?.trim()) {
    const arnCheck = validateApplicationReference(
      data.gstApplicationNumber,
      'GST Application / ARN Reference Number'
    );
    if (!arnCheck.isValid && arnCheck.error) errors.gstApplicationNumber = arnCheck.error;
  }

  // D. MSME Status & conditional validation (MSME itself is optional; Udyam is required if Yes)
  const msmeStatus = String(data.msmeStatus || 'NOT_REGISTERED').trim().toUpperCase();
  if (msmeStatus && !ALLOWED_MSME_STATUSES.includes(msmeStatus as any)) {
    errors.msmeStatus = 'Please select a valid MSME Status.';
  } else if (msmeStatus === 'REGISTERED') {
    const udyamCheck = validateUdyamNumber(data.udyamNumber || '');
    if (!udyamCheck.isValid && udyamCheck.error) errors.udyamNumber = udyamCheck.error;
  } else if (msmeStatus === 'APPLIED' && data.msmeApplicationNumber?.trim()) {
    const msmeRefCheck = validateApplicationReference(
      data.msmeApplicationNumber,
      'MSME Application Reference Number'
    );
    if (!msmeRefCheck.isValid && msmeRefCheck.error) {
      errors.msmeApplicationNumber = msmeRefCheck.error;
    }
  }

  // E. Document format & applicability checks
  const docs = Array.isArray(data.documents) ? data.documents : [];
  for (const doc of docs) {
    if (!doc.type || !ALLOWED_KYC_DOCUMENT_TYPES.includes(doc.type as any)) {
      errors.documents = 'Invalid KYC document category.';
      break;
    }
    if (doc.mimeType && doc.fileSize !== undefined) {
      const meta = validateKycDocumentMetadata(doc.mimeType, doc.fileSize, doc.fileName);
      if (!meta.isValid) {
        errors.documents = meta.error || 'Invalid KYC document file.';
        break;
      }
    }
  }

  const hasDoc = (types: string[]) => docs.some((d) => d.type && types.includes(d.type));

  if (!hasDoc(['AADHAAR_CARD', 'AUTHORIZED_ID'])) {
    errors.aadhaarDoc = 'Please upload your Aadhaar Card document.';
  }
  if (!hasDoc(['PAN_CARD'])) {
    errors.panDoc = 'Please upload your PAN Card document.';
  }
  if (gstStatus === 'REGISTERED' && !hasDoc(['GST_CERTIFICATE'])) {
    errors.gstDoc = 'Please upload your GST Registration Certificate (REG-06).';
  }
  if (msmeStatus === 'REGISTERED' && !hasDoc(['MSME_CERTIFICATE', 'UDYAM_CERTIFICATE'])) {
    errors.msmeDoc = 'Please upload your Udyam Registration Certificate.';
  }
  if (isTradeLicenseRequired(data.businessRegistrationType) && !hasDoc(['BUSINESS_REGISTRATION'])) {
    errors.businessRegDoc = 'Please upload your Trade License / Incorporation Certificate.';
  }

  if (
    !errors.documents &&
    (errors.aadhaarDoc || errors.panDoc || errors.gstDoc || errors.msmeDoc || errors.businessRegDoc)
  ) {
    errors.documents =
      errors.aadhaarDoc ||
      errors.panDoc ||
      errors.gstDoc ||
      errors.msmeDoc ||
      errors.businessRegDoc;
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

/**
 * Validates Step 5 Bank & Compliance Information payload consistently across frontend & backend.
 */
export function validateVendorStep5(
  data: {
    bankDetails?: {
      accountHolderName?: string;
      bankName?: string;
      accountNumber?: string;
      confirmAccountNumber?: string;
      ifsc?: string;
      accountType?: string;
      chequeDocUrl?: string;
    };
    documents?: Array<{ type?: string }>;
    termsAccepted?: boolean;
    privacyAccepted?: boolean;
  },
  options?: { requireConfirmAccountNumber?: boolean; requireBankProof?: boolean }
): StepValidationResult {
  const errors: Record<string, string> = {};
  const bank = data.bankDetails || {};

  const holderCheck = validateAccountBeneficiaryName(bank.accountHolderName || '');
  if (!holderCheck.isValid && holderCheck.error) errors.accountHolderName = holderCheck.error;

  const bankCheck = validateBankName(bank.bankName || '');
  if (!bankCheck.isValid && bankCheck.error) errors.bankName = bankCheck.error;

  const accCheck = validateBankAccount(bank.accountNumber || '');
  if (!accCheck.isValid && accCheck.error) errors.accountNumber = accCheck.error;

  if (options?.requireConfirmAccountNumber || bank.confirmAccountNumber !== undefined) {
    const confirmAccCheck = validateConfirmBankAccount(
      bank.accountNumber || '',
      bank.confirmAccountNumber || ''
    );
    if (!confirmAccCheck.isValid && confirmAccCheck.error) {
      errors.confirmAccountNumber = confirmAccCheck.error;
    }
  }

  const ifscCheck = validateIFSC(bank.ifsc || '');
  if (!ifscCheck.isValid && ifscCheck.error) errors.ifsc = ifscCheck.error;

  if (bank.accountType !== undefined) {
    const typeCheck = validateBankAccountType(bank.accountType);
    if (!typeCheck.isValid && typeCheck.error) errors.accountType = typeCheck.error;
  }

  if (options?.requireBankProof !== false) {
    const docs = Array.isArray(data.documents) ? data.documents : [];
    const hasBankProof = docs.some((d) => d.type === 'CANCELLED_CHEQUE') || Boolean(bank.chequeDocUrl);
    if (!hasBankProof) {
      errors.bankProofDoc = 'Please upload your Bank Passbook or Cancelled Cheque.';
    }
  }

  if (!data.termsAccepted) {
    errors.termsAccepted = 'You must accept the BUILDORA 60 Supplier Terms of Partnership.';
  }
  if (!data.privacyAccepted) {
    errors.privacyAccepted = 'You must confirm the accuracy of submitted documents.';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

/**
 * Validates complete 5-step registration submission payload.
 */
export function validateVendorRegistrationPayload(data: any): StepValidationResult {
  const s1 = validateVendorStep1({
    ownerName: data?.ownerName,
    email: data?.email,
    phone: data?.phone
  });
  const s2 = validateVendorStep2({
    legalBusinessName: data?.legalBusinessName,
    storeName: data?.storeName,
    businessType: data?.businessType,
    businessRegistrationType: data?.businessRegistrationType,
    yearOfEstablishment: data?.yearOfEstablishment,
    website: data?.website,
    description: data?.description
  });
  const s3 = validateVendorStep3({
    pincode: data?.pincode,
    country: data?.country,
    state: data?.state,
    city: data?.city,
    completeAddress: data?.completeAddress
  });
  const s4 = validateVendorStep4({
    aadhaarNumber: data?.aadhaarNumber,
    gstStatus: data?.gstStatus,
    gstin: data?.gstin,
    gstApplicationNumber: data?.gstApplicationNumber,
    pan: data?.pan,
    msmeStatus: data?.msmeStatus,
    udyamNumber: data?.udyamNumber,
    msmeApplicationNumber: data?.msmeApplicationNumber,
    businessRegistrationType: data?.businessRegistrationType,
    documents: data?.documents
  });
  const s5 = validateVendorStep5(
    {
      bankDetails: data?.bankDetails,
      documents: data?.documents,
      termsAccepted: data?.termsAccepted,
      privacyAccepted: data?.privacyAccepted
    },
    { requireBankProof: true }
  );

  const errors = {
    ...s1.errors,
    ...s2.errors,
    ...s3.errors,
    ...s4.errors,
    ...s5.errors
  };

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
