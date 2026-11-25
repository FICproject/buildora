// Shared schema validations for BUILDORA 60

/**
 * Validates full name fields (Owner Name, Authorized Person, Account Holder, Contact Person).
 * Accepts alphabetic letters, spaces, dots, hyphens, and Unicode letters (e.g. Indian regional characters).
 * Strictly rejects numbers and special symbols.
 */
export function validateName(name: string): { isValid: boolean; error?: string } {
  if (!name || !name.trim()) {
    return { isValid: false, error: 'Name is required.' };
  }
  const clean = name.trim();
  if (clean.length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters long.' };
  }
  if (clean.length > 70) {
    return { isValid: false, error: 'Name cannot exceed 70 characters.' };
  }
  // Reject digits
  if (/\d/.test(clean)) {
    return { isValid: false, error: 'Name must not contain numbers.' };
  }
  // Accept letters, spaces, dots, single quotes, hyphens, and Unicode alphabetic scripts
  const nameRegex = /^[a-zA-Z\s.'\-\u00C0-\u024F\u0900-\u0D7F]+$/;
  if (!nameRegex.test(clean)) {
    return { isValid: false, error: 'Name must contain only alphabetic letters, spaces, and dots.' };
  }
  return { isValid: true };
}

export function isValidName(name: string): boolean {
  return validateName(name).isValid;
}

/**
 * Validates official business email address.
 * Standard RFC-compliant format check.
 */
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  if (!email || !email.trim()) {
    return { isValid: false, error: 'Email address is required.' };
  }
  const clean = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(clean)) {
    return { isValid: false, error: 'Please enter a valid business email address (e.g. partner@supplierdomain.com).' };
  }
  if (clean.length > 100) {
    return { isValid: false, error: 'Email address cannot exceed 100 characters.' };
  }
  return { isValid: true };
}

export function isValidEmail(email: string): boolean {
  return validateEmail(email).isValid;
}

/**
 * Validates Indian 10-digit mobile number.
 * Must start with 6, 7, 8, or 9 and be exactly 10 numeric digits.
 */
export function validateIndianMobile(phone: string): { isValid: boolean; error?: string } {
  if (!phone || !phone.trim()) {
    return { isValid: false, error: 'Mobile number is required.' };
  }
  // Check if non-digits are present
  const clean = phone.trim().replace(/\D/g, '');
  if (phone.trim().length !== clean.length && !phone.trim().startsWith('+91')) {
    return { isValid: false, error: 'Mobile number must contain digits only.' };
  }
  const digits10 = clean.slice(-10);
  if (digits10.length !== 10) {
    return { isValid: false, error: 'Enter a valid 10-digit Indian mobile number.' };
  }
  if (!/^[6-9]\d{9}$/.test(digits10)) {
    return { isValid: false, error: 'Indian mobile numbers must start with 6, 7, 8, or 9.' };
  }
  return { isValid: true };
}

export function isValidMobile(phone: string): boolean {
  return validateIndianMobile(phone).isValid;
}

/**
 * Validates login identifier which can be either an email address or a 10-digit mobile number.
 */
export function validateIdentifier(identifier: string): { isValid: boolean; type: 'EMAIL' | 'MOBILE' | 'INVALID'; error?: string } {
  if (!identifier || !identifier.trim()) {
    return { isValid: false, type: 'INVALID', error: 'Please enter your registered email or 10-digit mobile number.' };
  }
  const clean = identifier.trim();
  if (clean.includes('@')) {
    const res = validateEmail(clean);
    return { isValid: res.isValid, type: res.isValid ? 'EMAIL' : 'INVALID', error: res.error };
  }
  const digitsOnly = clean.replace(/\D/g, '');
  if (digitsOnly.length === 10) {
    const res = validateIndianMobile(clean);
    return { isValid: res.isValid, type: res.isValid ? 'MOBILE' : 'INVALID', error: res.error };
  }
  return { isValid: false, type: 'INVALID', error: 'Enter a valid business email or 10-digit mobile number.' };
}

/**
 * Validates 6-digit Indian Postal Pincode.
 * Must be exactly 6 digits and cannot start with 0.
 */
export function validatePincode(pincode: string): { isValid: boolean; error?: string } {
  if (!pincode || !pincode.trim()) {
    return { isValid: false, error: 'Pincode is required.' };
  }
  const clean = pincode.trim();
  if (/\D/.test(clean)) {
    return { isValid: false, error: 'Pincode must contain numeric digits only.' };
  }
  if (clean.length !== 6) {
    return { isValid: false, error: 'Pincode must be exactly 6 digits.' };
  }
  if (!/^[1-9][0-9]{5}$/.test(clean)) {
    return { isValid: false, error: 'Enter a valid 6-digit Indian Postal Pincode (e.g. 560058).' };
  }
  return { isValid: true };
}

export function isValidPincode(pincode: string): boolean {
  return validatePincode(pincode).isValid;
}

/**
 * Validates Indian GSTIN (Goods and Services Tax Identification Number).
 * Format: 2-digit state code + 10-char PAN + 1 entity code + 'Z' + 1 checksum.
 */
export function validateGSTIN(gstin: string): { isValid: boolean; error?: string } {
  if (!gstin || !gstin.trim()) {
    return { isValid: false, error: 'GSTIN is required.' };
  }
  const clean = gstin.trim().toUpperCase();
  if (clean.length !== 15) {
    return { isValid: false, error: 'GSTIN must be exactly 15 alphanumeric characters.' };
  }
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstinRegex.test(clean)) {
    return { isValid: false, error: 'Invalid GSTIN format (e.g. 29AABCB9876F1Z2).' };
  }
  return { isValid: true };
}

export function isValidGSTIN(gstin: string): boolean {
  return validateGSTIN(gstin).isValid;
}

/**
 * Validates Indian PAN (Permanent Account Number).
 * Format: 5 uppercase letters + 4 digits + 1 uppercase letter.
 * 4th character indicates holder status: [CPHFATBLJG].
 */
export function validatePAN(pan: string): { isValid: boolean; error?: string } {
  if (!pan || !pan.trim()) {
    return { isValid: false, error: 'PAN is required.' };
  }
  const clean = pan.trim().toUpperCase();
  if (clean.length !== 10) {
    return { isValid: false, error: 'PAN must be exactly 10 alphanumeric characters.' };
  }
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!panRegex.test(clean)) {
    return { isValid: false, error: 'Invalid PAN format (e.g. AABCB9876F).' };
  }
  // Check 4th character status
  const fourthChar = clean[3];
  if (!/[CPHFATBLJG]/.test(fourthChar)) {
    return { isValid: false, error: 'Invalid PAN entity code at 4th position (must be C, P, H, F, A, T, B, L, J, or G).' };
  }
  return { isValid: true };
}

export function isValidPAN(pan: string): boolean {
  return validatePAN(pan).isValid;
}

/**
 * Validates Indian Bank Account Number.
 * Standard Indian banking account numbers range from 9 to 18 numeric digits.
 */
export function validateBankAccount(accountNumber: string): { isValid: boolean; error?: string } {
  if (!accountNumber || !accountNumber.trim()) {
    return { isValid: false, error: 'Bank account number is required.' };
  }
  const clean = accountNumber.trim();
  if (/\D/.test(clean)) {
    return { isValid: false, error: 'Account number must contain digits only.' };
  }
  if (clean.length < 9 || clean.length > 18) {
    return { isValid: false, error: 'Bank account number must be between 9 and 18 digits.' };
  }
  return { isValid: true };
}

export function isValidBankAccount(accountNumber: string): boolean {
  return validateBankAccount(accountNumber).isValid;
}

/**
 * Validates Indian Financial System Code (IFSC).
 * Format: 4 uppercase alphabetic bank code + '0' + 6 alphanumeric branch code (11 characters total).
 */
export function validateIFSC(ifsc: string): { isValid: boolean; error?: string } {
  if (!ifsc || !ifsc.trim()) {
    return { isValid: false, error: 'IFSC code is required.' };
  }
  const clean = ifsc.trim().toUpperCase();
  if (clean.length !== 11) {
    return { isValid: false, error: 'IFSC code must be exactly 11 characters.' };
  }
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  if (!ifscRegex.test(clean)) {
    return { isValid: false, error: 'Invalid IFSC format (e.g. HDFC0000053: 4 letters + 0 + 6 alphanumeric).' };
  }
  return { isValid: true };
}

export function isValidIFSC(ifsc: string): boolean {
  return validateIFSC(ifsc).isValid;
}

/**
 * Validates enterprise password and computes security strength.
 * Requirements: min 8 characters, at least 1 uppercase, 1 lowercase, 1 digit, 1 special character.
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
  const criteria = {
    length: (password || '').length >= 8,
    uppercase: /[A-Z]/.test(password || ''),
    lowercase: /[a-z]/.test(password || ''),
    number: /[0-9]/.test(password || ''),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password || '')
  };

  const score = Object.values(criteria).filter(Boolean).length;
  let strength: 'WEAK' | 'MEDIUM' | 'STRONG' = 'WEAK';
  if (score >= 5) strength = 'STRONG';
  else if (score >= 3) strength = 'MEDIUM';

  const isValid = score === 5;
  let error: string | undefined;
  if (!criteria.length) {
    error = 'Password must be at least 8 characters long.';
  } else if (!criteria.uppercase) {
    error = 'Password must include at least one uppercase letter (A-Z).';
  } else if (!criteria.lowercase) {
    error = 'Password must include at least one lowercase letter (a-z).';
  } else if (!criteria.number) {
    error = 'Password must include at least one number (0-9).';
  } else if (!criteria.special) {
    error = 'Password must include at least one special character (!@#$%^&*).';
  }

  return { isValid, score, strength, error, criteria };
}

/**
 * Validates confirm password matches password.
 */
export function validateConfirmPassword(password: string, confirmPassword: string): { isValid: boolean; error?: string } {
  if (!confirmPassword) {
    return { isValid: false, error: 'Please confirm your password.' };
  }
  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match.' };
  }
  return { isValid: true };
}

/**
 * Validates registered address.
 */
export function validateAddress(address: string): { isValid: boolean; error?: string } {
  if (!address || !address.trim()) {
    return { isValid: false, error: 'Registered business address is required.' };
  }
  const clean = address.trim();
  if (clean.length < 5) {
    return { isValid: false, error: 'Address must be at least 5 characters long.' };
  }
  if (clean.length > 250) {
    return { isValid: false, error: 'Address cannot exceed 250 characters.' };
  }
  return { isValid: true };
}

/**
 * Validates year of establishment.
 */
export function validateYearOfEstablishment(year: string): { isValid: boolean; error?: string } {
  if (!year || !year.trim()) {
    return { isValid: true }; // Optional field
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
  return { isValid: true };
}

/**
 * Validates website URL.
 */
export function validateWebsite(website: string): { isValid: boolean; error?: string } {
  if (!website || !website.trim()) {
    return { isValid: true }; // Optional
  }
  const clean = website.trim();
  const urlRegex = /^https?:\/\/([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/[^\s]*)?$/i;
  if (!urlRegex.test(clean)) {
    return { isValid: false, error: 'Please enter a valid website URL starting with http:// or https://' };
  }
  return { isValid: true };
}

/**
 * Validates Legal Entity Business Name or Store/Trade Name.
 * Allows letters, numbers, spaces, &, ., -, ', (, ), / and regional scripts.
 */
export function validateBusinessName(name: string, fieldLabel = 'Business Name'): { isValid: boolean; error?: string } {
  if (!name || !name.trim()) {
    return { isValid: false, error: `${fieldLabel} is required.` };
  }
  const clean = name.trim();
  if (clean.length < 2) {
    return { isValid: false, error: `${fieldLabel} must be at least 2 characters long.` };
  }
  if (clean.length > 120) {
    return { isValid: false, error: `${fieldLabel} cannot exceed 120 characters.` };
  }
  const bizRegex = /^[a-zA-Z0-9\s.&,'\-\/()\u00C0-\u024F\u0900-\u0D7F]+$/;
  if (!bizRegex.test(clean)) {
    return { isValid: false, error: `${fieldLabel} contains unsupported special characters.` };
  }
  return { isValid: true };
}

/**
 * Validates City or State name.
 * Letters, spaces, dots, hyphens, slashes only (no digits or symbols).
 */
export function validateCityOrState(value: string, fieldLabel = 'Location'): { isValid: boolean; error?: string } {
  if (!value || !value.trim()) {
    return { isValid: false, error: `${fieldLabel} is required.` };
  }
  const clean = value.trim();
  if (clean.length < 2 || clean.length > 80) {
    return { isValid: false, error: `${fieldLabel} must be between 2 and 80 characters.` };
  }
  const locRegex = /^[a-zA-Z\s.\-\/\u00C0-\u024F\u0900-\u0D7F]+$/;
  if (!locRegex.test(clean)) {
    return { isValid: false, error: `${fieldLabel} must contain alphabetic characters only.` };
  }
  return { isValid: true };
}

/**
 * Validates Bank Name.
 */
export function validateBankName(bankName: string): { isValid: boolean; error?: string } {
  if (!bankName || !bankName.trim()) {
    return { isValid: false, error: 'Bank Name is required.' };
  }
  const clean = bankName.trim();
  if (clean.length < 2 || clean.length > 80) {
    return { isValid: false, error: 'Bank Name must be between 2 and 80 characters.' };
  }
  const bankRegex = /^[a-zA-Z0-9\s.&'\-()]+$/;
  if (!bankRegex.test(clean)) {
    return { isValid: false, error: 'Bank Name contains invalid characters.' };
  }
  return { isValid: true };
}

export const ALLOWED_LOGO_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] as const;
export const MAX_LOGO_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Validates logo file MIME type and size on client & server.
 */
export function validateLogoFileMetadata(mimeType: string, sizeBytes: number, fileName?: string): { isValid: boolean; error?: string } {
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
