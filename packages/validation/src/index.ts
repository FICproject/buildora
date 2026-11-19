// Shared schema validations for BUILDORA 60

export function validatePincode(pincode: string): boolean {
  return /^[1-9][0-9]{5}$/.test(pincode.trim());
}

export function validateGSTIN(gstin: string): boolean {
  // Indian GST format: 2 digits state code + 10 alphanumeric PAN + 1 entity code + 'Z' + 1 checksum
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin.trim().toUpperCase());
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
