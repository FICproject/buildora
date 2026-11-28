import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useVendorAuthStore, useRegistrationStepStore } from '../../store';
import { vendorApi } from '../../services/vendorApi';
import {
  VendorKycDocument,
  VendorWarehouse,
  VendorRegistrationWizardData,
  VendorLogoMetadata,
  VendorGstStatus,
  VendorMsmeStatus
} from '@buildora/types';
import {
  validateName,
  validateAccountBeneficiaryName,
  validateLegalBusinessName,
  validateStoreName,
  validateBusinessType,
  validateBusinessRegistrationType,
  validateBusinessDescription,
  validateEmail,
  validateIndianMobile,
  validatePincode,
  validateCityOrState,
  validateGSTIN,
  validatePAN,
  validateAadhaar,
  validateUdyamNumber,
  validateApplicationReference,
  isTradeLicenseRequired,
  validateVendorStep4,
  validateVendorStep5,
  validateBankName,
  validateBankAccount,
  validateConfirmBankAccount,
  validateBankAccountType,
  validateIFSC,
  validatePassword,
  validateConfirmPassword,
  validateAddress,
  validateYearOfEstablishment,
  validateWebsite,
  validateLogoFileMetadata,
  validateKycDocumentMetadata,
  detectImageSignature,
  detectKycDocumentSignature
} from '@buildora/validation';
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Building2,
  MapPin,
  FileText,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  UploadCloud,
  Trash2,
  Plus,
  Clock,
  Loader2,
  RotateCcw,
  Image as ImageIcon,
  X,
  ShieldCheck
} from 'lucide-react';

export const VendorRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const requestedStep = Number(searchParams.get('step'));
  const { setSession, vendor: activeVendor } = useVendorAuthStore();
  const { setActiveStep, resetStep } = useRegistrationStepStore();

  // Wizard Step: 1 to 5
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [vendorId, setVendorId] = useState<string | null>(null);

  // Loading & Alert states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [fieldWarnings, setFieldWarnings] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // ----------------------------------------------------
  // STEP 1: ACCOUNT INFORMATION (Initially 100% empty)
  // ----------------------------------------------------
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Email verification state
  const [emailOtp, setEmailOtp] = useState('');
  const [isSendingEmailOtp, setIsSendingEmailOtp] = useState(false);
  const [isEmailOtpSent, setIsEmailOtpSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  // Mobile verification state
  const [mobileOtp, setMobileOtp] = useState('');
  const [isSendingMobileOtp, setIsSendingMobileOtp] = useState(false);
  const [isMobileOtpSent, setIsMobileOtpSent] = useState(false);
  const [isMobileVerified, setIsMobileVerified] = useState(false);

  // ----------------------------------------------------
  // STEP 2: BUSINESS INFORMATION (Initially 100% empty)
  // ----------------------------------------------------
  const [legalBusinessName, setLegalBusinessName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [businessType, setBusinessType] = useState<string>('');
  const [businessRegistrationType, setBusinessRegistrationType] = useState<string>('');
  const [yearOfEstablishment, setYearOfEstablishment] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [logoMetadata, setLogoMetadata] = useState<VendorLogoMetadata | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  // ----------------------------------------------------
  // STEP 3: BUSINESS ADDRESS & WAREHOUSES (Initially 100% empty)
  // ----------------------------------------------------
  const [country] = useState('India');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [pincode, setPincode] = useState('');
  const [completeAddress, setCompleteAddress] = useState('');
  const [sameDispatchAddress] = useState(true);
  const [dispatchAddress] = useState('');
  const [warehouses, setWarehouses] = useState<VendorWarehouse[]>([]);

  // Pincode Lookup States
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);
  const [pincodeLookupSuccess, setPincodeLookupSuccess] = useState(false);
  const [pincodeLookupError, setPincodeLookupError] = useState<string | null>(null);
  const [availableLocalities, setAvailableLocalities] = useState<string[]>([]);
  const [selectedLocality, setSelectedLocality] = useState('');
  const [isManualAddress, setIsManualAddress] = useState(false);

  // ----------------------------------------------------
  // STEP 4: KYC & TAX DOCUMENTS (Initially 100% empty)
  // ----------------------------------------------------
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [showAadhaar, setShowAadhaar] = useState(false);
  const [gstStatus, setGstStatus] = useState<VendorGstStatus>('REGISTERED');
  const [gstin, setGstin] = useState('');
  const [gstApplicationNumber, setGstApplicationNumber] = useState('');
  const [pan, setPan] = useState('');
  const [msmeStatus, setMsmeStatus] = useState<VendorMsmeStatus>('NOT_REGISTERED');
  const [udyamNumber, setUdyamNumber] = useState('');
  const [msmeApplicationNumber, setMsmeApplicationNumber] = useState('');
  const [documents, setDocuments] = useState<VendorKycDocument[]>([]);
  const [isUploadingDocType, setIsUploadingDocType] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [localPreviewUrls, setLocalPreviewUrls] = useState<Record<string, string>>({});
  const [previewDoc, setPreviewDoc] = useState<VendorKycDocument | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // ----------------------------------------------------
  // STEP 5: BANK & COMPLIANCE INFORMATION (Initially 100% empty)
  // ----------------------------------------------------
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [ifsc, setIfsc] = useState('');
  const [accountType, setAccountType] = useState<'CURRENT' | 'SAVINGS'>('CURRENT');

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  // ----------------------------------------------------
  // REUSABLE REAL-TIME VALIDATION ENGINE
  // ----------------------------------------------------
  const setSingleFieldError = (field: string, msg?: string) => {
    setFieldErrors((prev) => {
      if (!msg) {
        if (!prev[field]) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      }
      return { ...prev, [field]: msg };
    });
  };

  const setSingleFieldWarning = (field: string, msg?: string) => {
    setFieldWarnings((prev) => {
      if (!msg) {
        if (!prev[field]) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      }
      return { ...prev, [field]: msg };
    });
  };

  const clearFieldError = (field: string) => {
    setSingleFieldError(field, undefined);
    if (error) setError(null);
  };

  const validateSingleField = (
    field: string,
    rawValue: any,
    overrides?: {
      password?: string;
      confirmPassword?: string;
      accountNumber?: string;
      confirmAccountNumber?: string;
      gstin?: string;
      pan?: string;
    }
  ): string | undefined => {
    const val = typeof rawValue === 'string' ? rawValue : '';

    switch (field) {
      case 'ownerName':
        return validateName(val, 'Owner / Authorized Person Full Name').error;
      case 'email':
        return validateEmail(val).error;
      case 'phone':
        return validateIndianMobile(val).error;
      case 'password':
        return validatePassword(val).error;
      case 'confirmPassword':
        return validateConfirmPassword(overrides?.password ?? password, val).error;
      case 'legalBusinessName':
        return validateLegalBusinessName(val).error;
      case 'storeName':
        return validateStoreName(val).error;
      case 'businessType':
        return validateBusinessType(val).error;
      case 'businessRegistrationType':
        return validateBusinessRegistrationType(val).error;
      case 'yearOfEstablishment':
        return validateYearOfEstablishment(val).error;
      case 'website':
        return validateWebsite(val).error;
      case 'description':
        return validateBusinessDescription(val).error;
      case 'pincode':
        return validatePincode(val).error;
      case 'state':
        return validateCityOrState(val, 'State').error;
      case 'city':
        return validateCityOrState(val, 'City / Region').error;
      case 'completeAddress':
        return validateAddress(val).error;
      case 'aadhaarNumber':
        return validateAadhaar(val).error;
      case 'gstin': {
        if (gstStatus !== 'REGISTERED') {
          setSingleFieldWarning('gstin', undefined);
          return undefined;
        }
        const cleanGst = val.trim().toUpperCase();
        const gstRes = validateGSTIN(cleanGst);
        setSingleFieldWarning('gstin', gstRes.isValid ? gstRes.warning : undefined);
        return gstRes.error;
      }
      case 'gstApplicationNumber': {
        if (gstStatus !== 'APPLIED' || !val.trim()) return undefined;
        return validateApplicationReference(val, 'GST Application / ARN Reference Number').error;
      }
      case 'pan': {
        const cleanPan = val.trim().toUpperCase();
        return validatePAN(cleanPan).error;
      }
      case 'udyamNumber': {
        if (msmeStatus !== 'REGISTERED') return undefined;
        return validateUdyamNumber(val).error;
      }
      case 'msmeApplicationNumber': {
        if (msmeStatus !== 'APPLIED' || !val.trim()) return undefined;
        return validateApplicationReference(val, 'MSME Application Reference Number').error;
      }
      case 'accountHolderName':
        return validateAccountBeneficiaryName(val).error;
      case 'bankName':
        return validateBankName(val).error;
      case 'accountNumber':
        return validateBankAccount(val).error;
      case 'confirmAccountNumber':
        return validateConfirmBankAccount(overrides?.accountNumber ?? accountNumber, val).error;
      case 'ifsc':
        return validateIFSC(val).error;
      case 'accountType':
        return validateBankAccountType(val).error;
      case 'termsAccepted':
        return rawValue ? undefined : 'You must accept the BUILDORA 60 Supplier Terms of Partnership.';
      case 'privacyAccepted':
        return rawValue ? undefined : 'You must confirm the accuracy of submitted documents.';
      default:
        return undefined;
    }
  };

  const handleFieldChange = (
    field: string,
    nextValue: string,
    setter: (v: string) => void,
    options?: {
      autoTouchOnInput?: boolean;
      onExtraChange?: (v: string) => void;
    }
  ) => {
    setter(nextValue);
    if (error) setError(null);
    if (options?.onExtraChange) options.onExtraChange(nextValue);

    const isAlreadyTouched = Boolean(touched[field]);
    const shouldValidateNow =
      isAlreadyTouched || (options?.autoTouchOnInput && nextValue.length > 0);

    if (options?.autoTouchOnInput && nextValue.length > 0 && !isAlreadyTouched) {
      setTouched((prev) => ({ ...prev, [field]: true }));
    }

    if (shouldValidateNow) {
      const errMsg = validateSingleField(field, nextValue);
      setSingleFieldError(field, errMsg);
    } else {
      clearFieldError(field);
    }

    // Cross-field real-time sync
    if (field === 'password' && (touched.confirmPassword || confirmPassword.length > 0)) {
      const confirmErr = validateConfirmPassword(nextValue, confirmPassword).error;
      setSingleFieldError('confirmPassword', confirmErr);
    }
    if (field === 'accountNumber' && (touched.confirmAccountNumber || confirmAccountNumber.length > 0)) {
      const confirmAccErr = validateConfirmBankAccount(nextValue, confirmAccountNumber).error;
      setSingleFieldError('confirmAccountNumber', confirmAccErr);
    }
  };

  const handleFieldBlur = (
    field: string,
    currentValue: string,
    options?: { normalize?: (v: string) => string; setter?: (v: string) => void }
  ) => {
    const finalVal = options?.normalize ? options.normalize(currentValue) : currentValue;
    if (options?.setter && finalVal !== currentValue) {
      options.setter(finalVal);
    }
    setTouched((prev) => ({ ...prev, [field]: true }));
    const errMsg = validateSingleField(field, finalVal);
    setSingleFieldError(field, errMsg);
  };

  // Helper to transition steps cleanly with no lingering notices
  const goToStep = (targetStep: number) => {
    setSuccessNotice(null);
    setError(null);
    setCurrentStep(targetStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Wake up Render backend container while vendor fills out onboarding Step 1
  useEffect(() => {
    vendorApi.warmupBackend();
    return () => {
      resetStep();
    };
  }, [resetStep]);

  // Sync current wizard step to VendorAuthLayout left-panel dynamic visuals
  useEffect(() => {
    setActiveStep(currentStep);
  }, [currentStep, setActiveStep]);

  // Resume saved draft OR resubmission data
  useEffect(() => {
    if (
      activeVendor &&
      (activeVendor.status === 'DRAFT' || activeVendor.status === 'RESUBMISSION_REQUIRED') &&
      activeVendor.registrationData
    ) {
      const d = activeVendor.registrationData;
      setVendorId(activeVendor.id);
      if (d.ownerName) setOwnerName(d.ownerName);
      if (d.email) {
        setEmail(d.email);
        setIsEmailVerified(!!d.isEmailVerified);
      }
      if (d.phone) {
        setPhone(d.phone);
        setIsMobileVerified(!!d.isPhoneVerified);
      }
      if (d.legalBusinessName) setLegalBusinessName(d.legalBusinessName);
      if (d.storeName) setStoreName(d.storeName);
      if (d.businessType) setBusinessType(d.businessType);
      if (d.businessRegistrationType) setBusinessRegistrationType(d.businessRegistrationType);
      if (d.yearOfEstablishment) setYearOfEstablishment(d.yearOfEstablishment);
      if (d.website) setWebsite(d.website);
      if (d.description) setDescription(d.description);
      if (d.logoUrl) {
        setLogoUrl(d.logoUrl);
        setLogoPreview(d.logoUrl);
      }
      if (d.logoMetadata) setLogoMetadata(d.logoMetadata);
      if (d.state) setState(d.state);
      if (d.district) setDistrict(d.district);
      if (d.city) setCity(d.city);
      if (d.area) setArea(d.area);
      if (d.pincode) setPincode(d.pincode);
      if (d.completeAddress) setCompleteAddress(d.completeAddress);
      if (d.warehouses && d.warehouses.length) setWarehouses(d.warehouses);
      if (d.aadhaarNumber) setAadhaarNumber(d.aadhaarNumber);
      if (d.gstStatus) setGstStatus(d.gstStatus);
      else if (d.gstin) setGstStatus('REGISTERED');
      if (d.gstin) setGstin(d.gstin);
      if (d.gstApplicationNumber) setGstApplicationNumber(d.gstApplicationNumber);
      if (d.pan) setPan(d.pan);
      if (d.msmeStatus) setMsmeStatus(d.msmeStatus);
      else if (d.udyamNumber) setMsmeStatus('REGISTERED');
      if (d.udyamNumber) setUdyamNumber(d.udyamNumber);
      if (d.msmeApplicationNumber) setMsmeApplicationNumber(d.msmeApplicationNumber);
      if (d.documents && d.documents.length) setDocuments(d.documents);
      if (d.bankDetails?.accountHolderName) setAccountHolderName(d.bankDetails.accountHolderName);
      if (d.bankDetails?.bankName) setBankName(d.bankDetails.bankName);
      if (d.bankDetails?.accountNumber) {
        setAccountNumber(d.bankDetails.accountNumber);
        setConfirmAccountNumber(d.bankDetails.accountNumber);
      }
      if (d.bankDetails?.ifsc) setIfsc(d.bankDetails.ifsc);
      if (d.bankDetails?.accountType) setAccountType(d.bankDetails.accountType as any);
      if (d.termsAccepted) setTermsAccepted(true);
      if (d.privacyAccepted) setPrivacyAccepted(true);

      if (requestedStep >= 1 && requestedStep <= 5) {
        setCurrentStep(requestedStep);
      } else if (d.currentStep && d.currentStep >= 1 && d.currentStep <= 5) {
        setCurrentStep(d.currentStep);
      }
    } else if (requestedStep >= 1 && requestedStep <= 5) {
      setCurrentStep(requestedStep);
    }
  }, []);

  // ----------------------------------------------------
  // SMART PINCODE LOOKUP (DEBOUNCED ~300MS)
  // ----------------------------------------------------
  const performPincodeLookup = async (code: string) => {
    const pinCheck = validatePincode(code);
    if (!pinCheck.isValid) {
      setFieldErrors((prev) => ({
        ...prev,
        pincode: pinCheck.error || 'Enter a valid 6-digit pincode starting with 1–9.'
      }));
      return;
    }

    setIsPincodeLoading(true);
    setPincodeLookupError(null);
    clearFieldError('pincode');

    try {
      const data = await vendorApi.lookupPincode(code);
      if (data && data.success) {
        setState(data.state || '');
        setCity(data.city || '');
        setDistrict(data.district || data.city || '');
        setPincodeLookupSuccess(true);
        setPincodeLookupError(null);
        clearFieldError('state');
        clearFieldError('city');

        if (Array.isArray(data.localities) && data.localities.length > 0) {
          setAvailableLocalities(data.localities);
          setSelectedLocality(data.localities[0]);
          setArea(data.localities[0]);
        } else {
          setAvailableLocalities([]);
          setSelectedLocality('');
        }
      } else {
        setPincodeLookupSuccess(false);
        setPincodeLookupError('Pincode details not found in postal directory. Please enter location manually.');
      }
    } catch (err: any) {
      setPincodeLookupSuccess(false);
      setPincodeLookupError(err.message || 'Pincode not found. Please verify or enter location manually.');
    } finally {
      setIsPincodeLoading(false);
    }
  };

  // Debounced effect: triggers lookup ONLY when exact 6-digit pincode matches ^[1-9][0-9]{5}$
  useEffect(() => {
    if (validatePincode(pincode).isValid) {
      const timer = setTimeout(() => {
        performPincodeLookup(pincode);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      if (pincodeLookupSuccess) {
        setPincodeLookupSuccess(false);
        if (!isManualAddress) {
          setState('');
          setCity('');
          setDistrict('');
          setArea('');
          setAvailableLocalities([]);
          setSelectedLocality('');
        }
      }
      setPincodeLookupError(null);
    }
  }, [pincode]);

  const isEmailFormatValid = validateEmail(email).isValid;
  const isMobileFormatValid = validateIndianMobile(phone).isValid;

  // ----------------------------------------------------
  // STEP 1 HANDLERS
  // ----------------------------------------------------
  const handleSendEmailOtp = async () => {
    setTouched((prev) => ({ ...prev, email: true }));
    const emailCheck = validateEmail(email);
    if (!emailCheck.isValid) {
      const msg = emailCheck.error || 'Please enter a valid business email address.';
      setFieldErrors((prev) => ({ ...prev, email: msg }));
      setError(msg);
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    setEmail(cleanEmail);
    setError(null);
    clearFieldError('email');
    setIsSendingEmailOtp(true);
    try {
      const res = await vendorApi.sendOtp(cleanEmail, 'REGISTRATION_EMAIL');
      setIsEmailOtpSent(true);
      if (res.devOtpHint) {
        setEmailOtp(res.devOtpHint);
        setSuccessNotice(`Verification code sent to ${cleanEmail} (Demo OTP: ${res.devOtpHint})`);
      } else {
        setSuccessNotice(`Verification code sent to ${cleanEmail}`);
      }
    } catch (err: any) {
      const raw = String(err?.message || '');
      const msg =
        !raw || /failed to fetch/i.test(raw)
          ? 'Unable to send verification code. Please try again.'
          : raw;
      setFieldErrors((prev) => ({ ...prev, email: msg }));
      setError(msg);
    } finally {
      setIsSendingEmailOtp(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!/^\d{6}$/.test(emailOtp.trim())) {
      setError('Please enter the 6-digit email verification code.');
      return;
    }
    try {
      await vendorApi.verifyOtp(cleanEmail, 'REGISTRATION_EMAIL', emailOtp.trim());
      setIsEmailVerified(true);
      setSuccessNotice('Business email verified successfully!');
      setError(null);
      clearFieldError('email');
    } catch (err: any) {
      setError(err.message || 'Invalid email verification code.');
    }
  };

  const handleSendMobileOtp = async () => {
    setTouched((prev) => ({ ...prev, phone: true }));
    const phoneCheck = validateIndianMobile(phone);
    if (!phoneCheck.isValid) {
      const msg = phoneCheck.error || 'Enter a valid 10-digit mobile number starting with 6–9.';
      setFieldErrors((prev) => ({ ...prev, phone: msg }));
      setError(msg);
      return;
    }
    setError(null);
    clearFieldError('phone');
    setIsSendingMobileOtp(true);
    try {
      const res = await vendorApi.sendOtp(phone, 'REGISTRATION_MOBILE');
      setIsMobileOtpSent(true);
      if (res.devOtpHint) {
        setMobileOtp(res.devOtpHint);
        setSuccessNotice(`Verification code sent to +91 ${phone} (Demo OTP: ${res.devOtpHint})`);
      } else {
        setSuccessNotice(`Verification code sent to +91 ${phone}`);
      }
    } catch (err: any) {
      const raw = String(err?.message || '');
      const msg =
        !raw || /failed to fetch/i.test(raw)
          ? 'Unable to send OTP to this mobile number.'
          : raw;
      setFieldErrors((prev) => ({ ...prev, phone: msg }));
      setError(msg);
    } finally {
      setIsSendingMobileOtp(false);
    }
  };

  const handleVerifyMobileOtp = async () => {
    const phoneCheck = validateIndianMobile(phone);
    if (!phoneCheck.isValid) {
      setFieldErrors((prev) => ({
        ...prev,
        phone: phoneCheck.error || 'Enter a valid 10-digit mobile number starting with 6–9.'
      }));
      return;
    }
    if (!/^\d{6}$/.test(mobileOtp.trim())) {
      setError('Please enter the 6-digit SMS OTP code.');
      return;
    }
    try {
      await vendorApi.verifyOtp(phone, 'REGISTRATION_MOBILE', mobileOtp.trim());
      setIsMobileVerified(true);
      setSuccessNotice('Mobile number verified successfully!');
      setError(null);
      clearFieldError('phone');
    } catch (err: any) {
      setError(err.message || 'Invalid mobile verification code.');
    }
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setTouched((prev) => ({
      ...prev,
      ownerName: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true
    }));

    const errors: Record<string, string> = {};

    const nameCheck = validateName(ownerName, 'Owner / Authorized Person Full Name');
    if (!nameCheck.isValid) {
      errors.ownerName = nameCheck.error || 'Authorized person name is required.';
    }

    const emailCheck = validateEmail(email);
    if (!emailCheck.isValid) {
      errors.email = emailCheck.error || 'Enter a valid business email address.';
    } else if (!isEmailVerified) {
      errors.email = 'Please verify your business email with the OTP code.';
    }

    const phoneCheck = validateIndianMobile(phone);
    if (!phoneCheck.isValid) {
      errors.phone = phoneCheck.error || 'Enter a valid 10-digit mobile number starting with 6–9.';
    } else if (!isMobileVerified) {
      errors.phone = 'Please verify your mobile number with the SMS OTP.';
    }

    const passCheck = validatePassword(password);
    if (!passCheck.isValid) {
      errors.password = passCheck.error || 'Password does not meet the required security criteria.';
    }

    const confirmCheck = validateConfirmPassword(password, confirmPassword);
    if (!confirmCheck.isValid) {
      errors.confirmPassword = confirmCheck.error || 'Passwords do not match.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Please correct the highlighted errors before continuing.');
      return;
    }

    setFieldErrors({});
    setIsLoading(true);
    try {
      const cleanName = ownerName.trim().replace(/\s+/g, ' ');
      const cleanEmail = email.trim().toLowerCase();
      setOwnerName(cleanName);
      setEmail(cleanEmail);

      const res = await vendorApi.registerStep1({
        ownerName: cleanName,
        email: cleanEmail,
        phone,
        password,
        confirmPassword
      });

      setVendorId(res.vendorId);
      if (res.vendor) {
        setSession(res.token, res.vendor, returnTo === 'review' ? '/registration/review' : '/register');
      }
      if (returnTo === 'review') {
        await saveDraftAndSyncStore(5);
        navigate('/registration/review');
        return;
      }
      goToStep(2);
    } catch (err: any) {
      if (err.errors && typeof err.errors === 'object') {
        setFieldErrors((prev) => ({ ...prev, ...err.errors }));
      }
      setError(err.message || 'Failed to register account credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Build normalized wizard payload
  const buildWizardPayload = (stepOverride?: number): VendorRegistrationWizardData => {
    const bankProofDoc = documents.find((d) => d.type === 'CANCELLED_CHEQUE');
    return {
      ownerName: ownerName.trim().replace(/\s+/g, ' '),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      isEmailVerified,
      isPhoneVerified: isMobileVerified,
      legalBusinessName: legalBusinessName.trim().replace(/\s+/g, ' '),
      storeName: storeName.trim().replace(/\s+/g, ' '),
      businessType: businessType as any,
      businessRegistrationType,
      yearOfEstablishment: yearOfEstablishment.trim(),
      website: website.trim(),
      description: description.trim(),
      logoUrl: logoUrl || undefined,
      logoMetadata: logoMetadata || undefined,
      country,
      state: state.trim(),
      district: district.trim(),
      city: city.trim(),
      area: area.trim(),
      pincode: pincode.trim(),
      completeAddress: completeAddress.trim(),
      dispatchAddress: sameDispatchAddress ? completeAddress.trim() : dispatchAddress.trim(),
      warehouses,
      aadhaarNumber: aadhaarNumber.replace(/[\s-]+/g, '').trim(),
      gstStatus,
      gstin: gstStatus === 'REGISTERED' ? gstin.trim().toUpperCase() : undefined,
      gstApplicationNumber:
        gstStatus === 'APPLIED' && gstApplicationNumber.trim()
          ? gstApplicationNumber.trim().toUpperCase()
          : undefined,
      pan: pan.trim().toUpperCase(),
      msmeStatus,
      udyamNumber: msmeStatus === 'REGISTERED' ? udyamNumber.trim().toUpperCase() : undefined,
      msmeApplicationNumber:
        msmeStatus === 'APPLIED' && msmeApplicationNumber.trim()
          ? msmeApplicationNumber.trim().toUpperCase()
          : undefined,
      documents,
      bankDetails: {
        accountHolderName: accountHolderName.trim().replace(/\s+/g, ' '),
        bankName: bankName.trim().replace(/\s+/g, ' '),
        accountNumber: accountNumber.trim(),
        confirmAccountNumber: confirmAccountNumber.trim(),
        ifsc: ifsc.trim().toUpperCase(),
        accountType,
        chequeDocUrl: bankProofDoc?.id || undefined,
        proofDocumentId: bankProofDoc?.id || undefined,
        proofFileName: bankProofDoc?.fileName || undefined,
      },
      termsAccepted,
      privacyAccepted,
      currentStep: stepOverride ?? currentStep
    };
  };

  // Save draft & optionally navigate back to Review Page if editing from Review
  const saveDraftAndSyncStore = async (stepNum: number) => {
    const payload = buildWizardPayload(stepNum);
    try {
      const res = await vendorApi.saveRegistrationDraft(payload, stepNum, vendorId || undefined);
      if (res?.vendor) {
        const token = localStorage.getItem('buildora_vendor_token') || '';
        setSession(token, res.vendor, returnTo === 'review' ? '/registration/review' : '/register');
      }
    } catch (err: any) {
      if (err?.errors) {
        setFieldErrors((prev) => ({ ...prev, ...err.errors }));
        throw err;
      }
      if (activeVendor) {
        const token = localStorage.getItem('buildora_vendor_token') || '';
        setSession(token, {
          ...activeVendor,
          registrationData: payload,
          logoUrl: payload.logoUrl,
          logoMetadata: payload.logoMetadata
        });
      }
    }
  };

  // ----------------------------------------------------
  // LOGO UPLOAD HANDLER (STEP 2) WITH MAGIC BYTE CHECK
  // ----------------------------------------------------
  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoError(null);
    const metaCheck = validateLogoFileMetadata(file.type, file.size, file.name);
    if (!metaCheck.isValid) {
      setLogoError(metaCheck.error || 'Invalid logo file.');
      e.target.value = '';
      return;
    }

    // Verify actual image binary signature before previewing or uploading
    try {
      const headerBuffer = await file.slice(0, 12).arrayBuffer();
      const detected = detectImageSignature(new Uint8Array(headerBuffer));
      if (!detected) {
        setLogoError('Invalid image file content. Only genuine JPG, JPEG, PNG, or WEBP images are allowed.');
        e.target.value = '';
        return;
      }
    } catch {
      setLogoError('Unable to read image file. Please select a valid image.');
      e.target.value = '';
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setLogoPreview(objectUrl);
    setIsUploadingLogo(true);

    try {
      const res = await vendorApi.uploadRegistrationLogo(file);
      setLogoUrl(res.logoUrl);
      setLogoMetadata(res.logoMetadata);
      setLogoPreview(res.logoUrl);
      setLogoError(null);
    } catch (err: any) {
      setLogoError(err.message || 'Logo upload failed. Please try another image.');
      setLogoPreview(logoUrl || '');
    } finally {
      setIsUploadingLogo(false);
      e.target.value = '';
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl('');
    setLogoMetadata(null);
    setLogoPreview('');
    setLogoError(null);
  };

  // ----------------------------------------------------
  // STEP 2 VALIDATION & PROCEED
  // ----------------------------------------------------
  const handleStep2Next = async () => {
    setError(null);
    setTouched((prev) => ({
      ...prev,
      legalBusinessName: true,
      storeName: true,
      businessType: true,
      businessRegistrationType: true,
      yearOfEstablishment: true,
      website: true,
      description: true
    }));

    const errors: Record<string, string> = {};

    const legalCheck = validateLegalBusinessName(legalBusinessName);
    if (!legalCheck.isValid) {
      errors.legalBusinessName = legalCheck.error || 'Legal Entity Business Name is required.';
    }

    const storeCheck = validateStoreName(storeName);
    if (!storeCheck.isValid) {
      errors.storeName = storeCheck.error || 'Trade Name / Store Name is required.';
    }

    const bizTypeCheck = validateBusinessType(businessType);
    if (!bizTypeCheck.isValid) {
      errors.businessType = bizTypeCheck.error || 'Please select your Business Supplier Type.';
    }

    const regTypeCheck = validateBusinessRegistrationType(businessRegistrationType);
    if (!regTypeCheck.isValid) {
      errors.businessRegistrationType =
        regTypeCheck.error || 'Please select your Business Registration Constitution.';
    }

    const yearCheck = validateYearOfEstablishment(yearOfEstablishment);
    if (!yearCheck.isValid) {
      errors.yearOfEstablishment = yearCheck.error || 'Invalid year of establishment.';
    }

    const webCheck = validateWebsite(website);
    if (!webCheck.isValid) {
      errors.website = webCheck.error || 'Invalid website URL.';
    }

    const descCheck = validateBusinessDescription(description);
    if (!descCheck.isValid) {
      errors.description = descCheck.error || 'Invalid description.';
    }

    if (logoError) {
      errors.logo = logoError;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Please complete all required business information fields.');
      return;
    }

    setFieldErrors({});
    if (returnTo === 'review') {
      await saveDraftAndSyncStore(5);
      navigate('/registration/review');
      return;
    }
    goToStep(3);
  };

  // ----------------------------------------------------
  // STEP 3 VALIDATION & PROCEED
  // ----------------------------------------------------
  const handleStep3Next = async () => {
    setError(null);
    setTouched((prev) => ({
      ...prev,
      pincode: true,
      state: true,
      city: true,
      completeAddress: true
    }));

    const errors: Record<string, string> = {};

    const pinCheck = validatePincode(pincode);
    if (!pinCheck.isValid) {
      errors.pincode = pinCheck.error || 'Enter a valid 6-digit pincode starting with 1–9.';
    } else if (!isManualAddress && !pincodeLookupSuccess) {
      errors.pincode =
        pincodeLookupError || 'Please wait for pincode verification or switch to manual address entry.';
    }

    const stateCheck = validateCityOrState(state, 'State');
    if (!stateCheck.isValid) {
      errors.state = stateCheck.error || 'State is required.';
    }

    const cityCheck = validateCityOrState(city, 'City / Region');
    if (!cityCheck.isValid) {
      errors.city = cityCheck.error || 'City / Region is required.';
    }

    const addrCheck = validateAddress(completeAddress);
    if (!addrCheck.isValid) {
      errors.completeAddress =
        addrCheck.error || 'Please enter your complete registered business address (min 5 chars).';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Please provide valid address details.');
      return;
    }

    setFieldErrors({});
    if (returnTo === 'review') {
      await saveDraftAndSyncStore(5);
      navigate('/registration/review');
      return;
    }
    goToStep(4);
  };

  // ----------------------------------------------------
  // STEP 4 VALIDATION & PROCEED
  // ----------------------------------------------------
  const handleStep4Next = async () => {
    setError(null);
    setTouched((prev) => ({
      ...prev,
      aadhaarNumber: true,
      gstStatus: true,
      gstin: true,
      gstApplicationNumber: true,
      pan: true,
      msmeStatus: true,
      udyamNumber: true,
      msmeApplicationNumber: true,
      documents: true
    }));

    const check = validateVendorStep4({
      aadhaarNumber,
      gstStatus,
      gstin: gstStatus === 'REGISTERED' ? gstin : undefined,
      gstApplicationNumber: gstStatus === 'APPLIED' ? gstApplicationNumber : undefined,
      pan,
      msmeStatus,
      udyamNumber: msmeStatus === 'REGISTERED' ? udyamNumber : undefined,
      msmeApplicationNumber: msmeStatus === 'APPLIED' ? msmeApplicationNumber : undefined,
      businessRegistrationType,
      documents
    });

    if (gstStatus === 'REGISTERED' && gstin.trim()) {
      const gstCheck = validateGSTIN(gstin.trim().toUpperCase());
      setSingleFieldWarning('gstin', gstCheck.isValid ? gstCheck.warning : undefined);
    } else {
      setSingleFieldWarning('gstin', undefined);
    }

    if (!check.isValid) {
      setFieldErrors(check.errors);
      setError(
        Object.values(check.errors)[0] ||
          'Please complete all required identification numbers and upload required verification documents.'
      );
      return;
    }

    setFieldErrors({});
    setIsLoading(true);
    try {
      if (returnTo === 'review') {
        await saveDraftAndSyncStore(5);
        navigate('/registration/review');
        return;
      }
      await saveDraftAndSyncStore(5);
      goToStep(5);
    } catch (err: any) {
      if (err?.errors) setFieldErrors((prev) => ({ ...prev, ...err.errors }));
      setError(err?.message || 'Failed to save KYC step progress.');
    } finally {
      setIsLoading(false);
    }
  };

  // ----------------------------------------------------
  // SAVE PROGRESS HANDLER
  // ----------------------------------------------------
  const handleSaveProgress = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await saveDraftAndSyncStore(currentStep);
      setSuccessNotice(
        `Registration progress saved successfully! You can resume from Step ${currentStep} at any time.`
      );
    } catch (err: any) {
      setError(err.message || 'Failed to save progress.');
    } finally {
      setIsLoading(false);
    }
  };

  // Add Warehouse row
  const handleAddWarehouse = () => {
    const newIdx = warehouses.length + 1;
    setWarehouses([
      ...warehouses,
      {
        id: `wh-${Date.now()}`,
        name: `Warehouse Hub #${newIdx}`,
        address: city ? `${city} Distribution Hub` : 'Main Dispatch Warehouse',
        city: city || 'Bengaluru',
        state: state || 'Karnataka',
        pincode: validatePincode(pincode).isValid ? pincode : '560001',
        isPrimary: warehouses.length === 0
      }
    ]);
  };

  const handleRemoveWarehouse = (id: string) => {
    setWarehouses(warehouses.filter((w) => w.id !== id));
  };

  const getLinkedIdentificationForDocType = (type: VendorKycDocument['type']): string | undefined => {
    switch (type) {
      case 'AADHAAR_CARD':
      case 'AUTHORIZED_ID':
        return aadhaarNumber.replace(/[\s-]+/g, '').trim() || undefined;
      case 'PAN_CARD':
        return pan.trim().toUpperCase() || undefined;
      case 'GST_CERTIFICATE':
        return gstStatus === 'REGISTERED' ? gstin.trim().toUpperCase() || undefined : undefined;
      case 'GST_ACKNOWLEDGEMENT':
        return gstStatus === 'APPLIED'
          ? gstApplicationNumber.trim().toUpperCase() || undefined
          : undefined;
      case 'UDYAM_CERTIFICATE':
      case 'MSME_CERTIFICATE':
        return msmeStatus === 'REGISTERED'
          ? udyamNumber.trim().toUpperCase() || undefined
          : undefined;
      case 'MSME_ACKNOWLEDGEMENT':
        return msmeStatus === 'APPLIED'
          ? msmeApplicationNumber.trim().toUpperCase() || undefined
          : undefined;
      case 'CANCELLED_CHEQUE':
        return accountNumber.replace(/\D/g, '') || undefined;
      default:
        return undefined;
    }
  };

  const handleRemoveDocument = (doc: VendorKycDocument) => {
    setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    setLocalPreviewUrls((prev) => {
      const next = { ...prev };
      if (next[doc.id]) {
        URL.revokeObjectURL(next[doc.id]);
        delete next[doc.id];
      }
      return next;
    });
  };

  const handleOpenPreview = async (doc: VendorKycDocument) => {
    setPreviewDoc(doc);
    setPreviewError(null);
    if (localPreviewUrls[doc.id]) {
      setPreviewBlobUrl(localPreviewUrls[doc.id]);
      setPreviewLoading(false);
      return;
    }
    setPreviewLoading(true);
    setPreviewBlobUrl(null);
    try {
      const blob = await vendorApi.fetchOwnKycDocumentBlob(doc.id, false);
      const url = URL.createObjectURL(blob);
      setPreviewBlobUrl(url);
    } catch (err: any) {
      setPreviewError(err?.message || 'Unable to load document preview. You can replace and re-upload it.');
    } finally {
      setPreviewLoading(false);
    }
  };

  // Document Upload Handler (Validates MIME, size <= 5MB, magic bytes, and uploads to backend)
  const handleFileUpload = (
    type: VendorKycDocument['type'],
    title: string,
    errorKey = 'documents'
  ) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';
    input.onchange = async (e: any) => {
      const file: File | undefined = e.target.files?.[0];
      if (!file) return;

      clearFieldError('documents');
      clearFieldError(errorKey);
      const metaCheck = validateKycDocumentMetadata(file.type, file.size, file.name);
      if (!metaCheck.isValid) {
        const msg = metaCheck.error || 'Unsupported KYC document file.';
        setFieldErrors((prev) => ({ ...prev, [errorKey]: msg, documents: msg }));
        setError(msg);
        return;
      }

      try {
        const headerBuffer = await file.slice(0, 12).arrayBuffer();
        const detected = detectKycDocumentSignature(new Uint8Array(headerBuffer));
        if (!detected) {
          const msg =
            'Corrupted or unsupported file content. Upload a genuine PDF, JPG, JPEG, or PNG document.';
          setFieldErrors((prev) => ({ ...prev, [errorKey]: msg, documents: msg }));
          setError(msg);
          return;
        }
      } catch {
        const msg = 'Unable to read selected document file.';
        setFieldErrors((prev) => ({ ...prev, [errorKey]: msg, documents: msg }));
        setError(msg);
        return;
      }

      setIsUploadingDocType(type);
      setUploadProgress(25);
      try {
        const linkedId = getLinkedIdentificationForDocType(type);
        setUploadProgress(60);
        const uploadedDoc = await vendorApi.uploadDocumentFile(file, type, title, linkedId);
        setUploadProgress(100);
        const objectUrl = URL.createObjectURL(file);
        setLocalPreviewUrls((prev) => ({ ...prev, [uploadedDoc.id]: objectUrl }));
        setDocuments((prev) => {
          const existing = prev.find((d) => d.type === type);
          const previousVersions = existing
            ? [
                ...(Array.isArray(existing.previousVersions) ? existing.previousVersions : []),
                {
                  id: existing.id,
                  version: existing.version || 1,
                  fileName: existing.fileName,
                  fileSize: existing.fileSize,
                  mimeType: existing.mimeType,
                  storageKey: existing.storageKey,
                  storageProvider: existing.storageProvider,
                  identificationNumberMasked: existing.identificationNumberMasked,
                  uploadedAt: existing.uploadedAt,
                  verificationStatus: existing.verificationStatus || 'PENDING',
                  rejectionReason: existing.rejectionReason,
                  reviewedAt: existing.reviewedAt,
                  reviewedBy: existing.reviewedBy,
                  replacedAt: new Date().toISOString(),
                },
              ]
            : [];
          return [
            ...prev.filter((d) => d.type !== type),
            {
              ...uploadedDoc,
              version: previousVersions.length + 1,
              ...(previousVersions.length > 0 ? { previousVersions } : {}),
            },
          ];
        });
        clearFieldError('documents');
        clearFieldError(errorKey);
      } catch (err: any) {
        const msg = err.message || 'Document upload failed on verification server.';
        setFieldErrors((prev) => ({ ...prev, [errorKey]: msg, documents: msg }));
        setError(msg);
      } finally {
        setIsUploadingDocType(null);
        setUploadProgress(0);
      }
    };
    input.click();
  };

  // ----------------------------------------------------
  // STEP 5: VALIDATE BANK & COMPLIANCE -> NAVIGATE TO REVIEW PAGE
  // ----------------------------------------------------
  const handleProceedToReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setTouched((prev) => ({
      ...prev,
      accountHolderName: true,
      bankName: true,
      accountNumber: true,
      confirmAccountNumber: true,
      ifsc: true,
      accountType: true,
      bankProofDoc: true,
      termsAccepted: true,
      privacyAccepted: true
    }));

    const step5Check = validateVendorStep5(
      {
        bankDetails: {
          accountHolderName,
          bankName,
          accountNumber,
          confirmAccountNumber,
          ifsc: ifsc.trim().toUpperCase(),
          accountType
        },
        documents,
        termsAccepted,
        privacyAccepted
      },
      { requireConfirmAccountNumber: true, requireBankProof: true }
    );

    if (!step5Check.isValid) {
      setFieldErrors(step5Check.errors);
      setError(
        Object.values(step5Check.errors)[0] ||
          'Please complete all bank details, upload bank proof, and accept the terms.'
      );
      return;
    }

    setFieldErrors({});
    setIsLoading(true);
    try {
      await saveDraftAndSyncStore(5);
      navigate('/registration/review');
    } catch (err: any) {
      if (err.errors && typeof err.errors === 'object') {
        setFieldErrors((prev) => ({ ...prev, ...err.errors }));
      }
      setError(err.message || 'Failed to save step details. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 lg:p-10 shadow-xl border border-[#E7E5E4] space-y-6 sm:space-y-7 animate-in fade-in-0 duration-200">
      {/* Header and Step Indicators */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E7E5E4] pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#FBF3F0] text-[#943D24] text-[11px] font-bold mb-1">
              Supplier Partner Onboarding
            </div>
            <h2 className="text-2xl font-black text-[#292524] tracking-tight">
              Register as a Certified Vendor
            </h2>
          </div>
          <button
            type="button"
            onClick={handleSaveProgress}
            disabled={isLoading}
            className="text-xs font-bold text-[#943D24] hover:underline self-start sm:self-center cursor-pointer"
          >
            💾 Save Progress &amp; Continue Later
          </button>
        </div>

        {/* 5-Step Horizontal Progress Stepper */}
        <div className="grid grid-cols-5 gap-1 sm:gap-2">
          {[
            { step: 1, title: 'Account', icon: User },
            { step: 2, title: 'Business', icon: Building2 },
            { step: 3, title: 'Address', icon: MapPin },
            { step: 4, title: 'KYC & Tax', icon: FileText },
            { step: 5, title: 'Bank & Terms', icon: CreditCard }
          ].map((item) => {
            const isCompleted = item.step < currentStep;
            const isCurrent = item.step === currentStep;
            return (
              <div
                key={item.step}
                className={`p-1.5 sm:p-2 rounded-xl text-center border transition-all min-w-0 ${
                  isCurrent
                    ? 'bg-[#943D24] text-white border-[#943D24] shadow-sm'
                    : isCompleted
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-[#FBF3F0] text-[#78716C] border-[#E7E5E4]'
                }`}
              >
                <div className="flex items-center justify-center mb-0.5 sm:mb-1">
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                  ) : (
                    <span className="text-[11px] sm:text-xs font-black">0{item.step}</span>
                  )}
                </div>
                <div className="hidden xs:block text-[9.5px] sm:text-xs font-bold truncate">{item.title}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* ==================================================== */}
      {/* STEP 1: ACCOUNT INFORMATION                         */}
      {/* ==================================================== */}
      {currentStep === 1 && (
        <form onSubmit={handleStep1Submit} noValidate className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#292524] mb-1">
                Owner / Authorized Person Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="ownerName"
                  value={ownerName}
                  maxLength={100}
                  onChange={(e) =>
                    handleFieldChange('ownerName', e.target.value, setOwnerName, {
                      autoTouchOnInput: true
                    })
                  }
                  onBlur={() =>
                    handleFieldBlur('ownerName', ownerName, {
                      normalize: (v) => v.trim().replace(/\s+/g, ' '),
                      setter: setOwnerName
                    })
                  }
                  required
                  placeholder="e.g. Vikramaditya Rao"
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                    fieldErrors.ownerName
                      ? 'border-rose-500 bg-rose-50/30 focus:ring-rose-500/30'
                      : 'border-[#E7E5E4] focus:ring-[#943D24]'
                  }`}
                />
              </div>
              {fieldErrors.ownerName && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.ownerName}</p>
              )}
            </div>

            {/* Email + OTP Verification */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-[#292524]">
                Official Business Email Address *
              </label>
              <div className="flex flex-wrap xs:flex-nowrap gap-2">
                <div className="relative flex-1 min-w-0">
                  <Mail className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    name="email"
                    value={email}
                    maxLength={100}
                    onChange={(e) =>
                      handleFieldChange('email', e.target.value, setEmail, {
                        autoTouchOnInput: true,
                        onExtraChange: () => {
                          setIsEmailVerified(false);
                          setIsEmailOtpSent(false);
                        }
                      })
                    }
                    onBlur={() =>
                      handleFieldBlur('email', email, {
                        normalize: (v) => v.trim().toLowerCase(),
                        setter: setEmail
                      })
                    }
                    required
                    disabled={isEmailVerified}
                    placeholder="partner@supplierdomain.com"
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 disabled:bg-[#F8F7F5] ${
                      fieldErrors.email
                        ? 'border-rose-500 bg-rose-50/30 focus:ring-rose-500/30'
                        : 'border-[#E7E5E4] focus:ring-[#943D24]'
                    }`}
                  />
                </div>
                {!isEmailVerified && (
                  <button
                    type="button"
                    onClick={handleSendEmailOtp}
                    disabled={!isEmailFormatValid || isSendingEmailOtp}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#F6C453] text-[#292524] hover:bg-[#F6C453] shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSendingEmailOtp ? 'Sending...' : isEmailOtpSent ? 'Resend' : 'Send Code'}
                  </button>
                )}
                {isEmailVerified && (
                  <span className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                )}
              </div>
              {fieldErrors.email && (
                <p className="text-[11px] text-rose-600 mt-0.5 font-medium">{fieldErrors.email}</p>
              )}

              {isEmailOtpSent && !isEmailVerified && (
                <div className="p-3 bg-[#FBF3F0]/70 rounded-xl border border-[#943D24]/25 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-[#943D24]">Enter Email Code:</span>
                    <input
                      type="text"
                      maxLength={6}
                      value={emailOtp}
                      onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="6-digit"
                      className="w-24 px-2 py-1 text-xs font-mono rounded-lg border border-blue-300 bg-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleVerifyEmailOtp}
                    className="px-3 py-1 rounded-lg text-xs font-bold bg-[#943D24] text-white cursor-pointer"
                  >
                    Verify
                  </button>
                </div>
              )}
            </div>

            {/* Mobile + OTP Verification (Strict ^[6-9][0-9]{9}$ Real-Time) */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-[#292524]">
                Mobile Number (For Dispatch &amp; Dark Store SMS) *
              </label>
              <div className="flex flex-wrap xs:flex-nowrap gap-2">
                <div className="relative flex-1 min-w-0">
                  <Phone className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    name="phone"
                    inputMode="numeric"
                    maxLength={10}
                    pattern="[6-9][0-9]{9}"
                    autoComplete="tel-national"
                    value={phone}
                    onChange={(e) => {
                      // Strictly allow numeric digits only, maximum 10 digits
                      const sanitized = e.target.value.replace(/\D/g, '').slice(0, 10);
                      handleFieldChange('phone', sanitized, setPhone, {
                        autoTouchOnInput: true,
                        onExtraChange: () => {
                          setIsMobileVerified(false);
                          setIsMobileOtpSent(false);
                        }
                      });
                    }}
                    onBlur={() => handleFieldBlur('phone', phone)}
                    required
                    disabled={isMobileVerified}
                    placeholder="9845012345"
                    aria-invalid={Boolean(fieldErrors.phone)}
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 disabled:bg-[#F8F7F5] ${
                      fieldErrors.phone
                        ? 'border-rose-500 bg-rose-50/30 focus:ring-rose-500/30'
                        : 'border-[#E7E5E4] focus:ring-[#943D24]'
                    }`}
                  />
                </div>
                {!isMobileVerified && (
                  <button
                    type="button"
                    onClick={handleSendMobileOtp}
                    disabled={!isMobileFormatValid || isSendingMobileOtp}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#F6C453] text-[#292524] hover:bg-[#F6C453] shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSendingMobileOtp ? 'Sending...' : isMobileOtpSent ? 'Resend' : 'Send OTP'}
                  </button>
                )}
                {isMobileVerified && (
                  <span className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                )}
              </div>
              {fieldErrors.phone && (
                <p className="text-[11px] text-rose-600 mt-0.5 font-medium">{fieldErrors.phone}</p>
              )}

              {isMobileOtpSent && !isMobileVerified && (
                <div className="p-3 bg-[#FBF3F0]/70 rounded-xl border border-[#943D24]/25 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-[#943D24]">Enter SMS OTP:</span>
                    <input
                      type="text"
                      maxLength={6}
                      value={mobileOtp}
                      onChange={(e) => setMobileOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="6-digit"
                      className="w-24 px-2 py-1 text-xs font-mono rounded-lg border border-blue-300 bg-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleVerifyMobileOtp}
                    className="px-3 py-1 rounded-lg text-xs font-bold bg-[#943D24] text-white cursor-pointer"
                  >
                    Verify
                  </button>
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-[#292524] mb-1">Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={password}
                  onChange={(e) =>
                    handleFieldChange('password', e.target.value, setPassword, {
                      autoTouchOnInput: true
                    })
                  }
                  onBlur={() => handleFieldBlur('password', password)}
                  required
                  placeholder="Min 8 characters (letters & numbers)"
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                    fieldErrors.password
                      ? 'border-rose-500 bg-rose-50/30 focus:ring-rose-500/30'
                      : 'border-[#E7E5E4] focus:ring-[#943D24]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#78716C] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.password}</p>
              )}
              {password && (
                <div className="mt-2 space-y-1.5 p-2.5 bg-[#F8F7F5] rounded-xl border border-[#E7E5E4]">
                  {(() => {
                    const str = validatePassword(password);
                    return (
                      <>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-[#78716C]">Password Strength:</span>
                          <span
                            className={`font-bold ${
                              str.strength === 'STRONG'
                                ? 'text-emerald-600'
                                : str.strength === 'MEDIUM'
                                ? 'text-amber-600'
                                : 'text-rose-600'
                            }`}
                          >
                            {str.strength}
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-1 h-1.5">
                          {[1, 2, 3, 4, 5].map((lvl) => (
                            <div
                              key={lvl}
                              className={`rounded-full transition-all ${
                                lvl <= str.score
                                  ? str.score >= 5
                                    ? 'bg-emerald-500'
                                    : str.score >= 3
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                  : 'bg-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-[#78716C] mt-1">
                          <span className={str.criteria.length ? 'text-emerald-700 font-medium' : ''}>
                            {str.criteria.length ? '✓' : '•'} 8+ characters
                          </span>
                          <span className={str.criteria.uppercase ? 'text-emerald-700 font-medium' : ''}>
                            {str.criteria.uppercase ? '✓' : '•'} Uppercase (A-Z)
                          </span>
                          <span className={str.criteria.lowercase ? 'text-emerald-700 font-medium' : ''}>
                            {str.criteria.lowercase ? '✓' : '•'} Lowercase (a-z)
                          </span>
                          <span className={str.criteria.number ? 'text-emerald-700 font-medium' : ''}>
                            {str.criteria.number ? '✓' : '•'} Number (0-9)
                          </span>
                          <span className={`col-span-2 ${str.criteria.special ? 'text-emerald-700 font-medium' : ''}`}>
                            {str.criteria.special ? '✓' : '•'} Special symbol (!@#$%^&*)
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-[#292524] mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) =>
                    handleFieldChange('confirmPassword', e.target.value, setConfirmPassword, {
                      autoTouchOnInput: true
                    })
                  }
                  onBlur={() => handleFieldBlur('confirmPassword', confirmPassword)}
                  required
                  placeholder="Repeat password"
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                    fieldErrors.confirmPassword
                      ? 'border-rose-500 bg-rose-50/30 focus:ring-rose-500/30'
                      : 'border-[#E7E5E4] focus:ring-[#943D24]'
                  }`}
                />
              </div>
              {fieldErrors.confirmPassword && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.confirmPassword}</p>
              )}
            </div>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-between gap-2.5">
            <Link to="/login" className="text-xs font-bold text-[#78716C] hover:underline">
              Already have an account? Sign In
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="py-3 px-6 rounded-xl text-sm font-bold bg-[#943D24] text-white hover:bg-[#7D331E] transition-all shadow-md shadow-[#943D24]/20 flex items-center gap-2 cursor-pointer"
            >
              Next: Business Information
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* ==================================================== */}
      {/* STEP 2: BUSINESS INFORMATION                         */}
      {/* ==================================================== */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#292524] mb-1">
                Legal Entity Business Name *
              </label>
              <input
                type="text"
                name="legalBusinessName"
                maxLength={150}
                value={legalBusinessName}
                onChange={(e) =>
                  handleFieldChange('legalBusinessName', e.target.value, setLegalBusinessName, {
                    autoTouchOnInput: true
                  })
                }
                onBlur={() =>
                  handleFieldBlur('legalBusinessName', legalBusinessName, {
                    normalize: (v) => v.trim().replace(/\s+/g, ' '),
                    setter: setLegalBusinessName
                  })
                }
                required
                placeholder="e.g. Supreme Materials Private Limited"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                  fieldErrors.legalBusinessName
                    ? 'border-rose-500 bg-rose-50/30 focus:ring-rose-500/30'
                    : 'border-[#E7E5E4] focus:ring-[#943D24]'
                }`}
              />
              {fieldErrors.legalBusinessName && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">
                  {fieldErrors.legalBusinessName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#292524] mb-1">
                Store / Brand Trade Name *
              </label>
              <input
                type="text"
                name="storeName"
                maxLength={100}
                value={storeName}
                onChange={(e) =>
                  handleFieldChange('storeName', e.target.value, setStoreName, {
                    autoTouchOnInput: true
                  })
                }
                onBlur={() =>
                  handleFieldBlur('storeName', storeName, {
                    normalize: (v) => v.trim().replace(/\s+/g, ' '),
                    setter: setStoreName
                  })
                }
                required
                placeholder="e.g. Supreme Materials BLR"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                  fieldErrors.storeName
                    ? 'border-rose-500 bg-rose-50/30 focus:ring-rose-500/30'
                    : 'border-[#E7E5E4] focus:ring-[#943D24]'
                }`}
              />
              {fieldErrors.storeName && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.storeName}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#292524] mb-1">
                Business Supplier Type *
              </label>
              <select
                name="businessType"
                value={businessType}
                onChange={(e) =>
                  handleFieldChange('businessType', e.target.value, setBusinessType, {
                    autoTouchOnInput: true
                  })
                }
                onBlur={() => handleFieldBlur('businessType', businessType)}
                className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-sm focus:outline-none focus:ring-2 ${
                  fieldErrors.businessType
                    ? 'border-rose-500 bg-rose-50/30 focus:ring-rose-500/30'
                    : 'border-[#E7E5E4] focus:ring-[#943D24]'
                }`}
              >
                <option value="">Select Supplier Type...</option>
                <option value="MANUFACTURER">Manufacturer (Direct-from-mill)</option>
                <option value="DISTRIBUTOR">Authorized Distributor</option>
                <option value="WHOLESALER">Master Wholesaler</option>
                <option value="DEALER">Stockist / Dealer</option>
                <option value="RETAILER">Specialty Retailer</option>
                <option value="OTHER">Other Enterprise Supplier</option>
              </select>
              {fieldErrors.businessType && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.businessType}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#292524] mb-1">
                Business Registration Constitution *
              </label>
              <select
                name="businessRegistrationType"
                value={businessRegistrationType}
                onChange={(e) =>
                  handleFieldChange(
                    'businessRegistrationType',
                    e.target.value,
                    setBusinessRegistrationType,
                    { autoTouchOnInput: true }
                  )
                }
                onBlur={() => handleFieldBlur('businessRegistrationType', businessRegistrationType)}
                className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-sm focus:outline-none focus:ring-2 ${
                  fieldErrors.businessRegistrationType
                    ? 'border-rose-500 bg-rose-50/30 focus:ring-rose-500/30'
                    : 'border-[#E7E5E4] focus:ring-[#943D24]'
                }`}
              >
                <option value="">Select Constitution...</option>
                <option value="PRIVATE_LIMITED">Private Limited Company (Pvt Ltd)</option>
                <option value="PUBLIC_LIMITED">Public Limited Company</option>
                <option value="LLP">Limited Liability Partnership (LLP)</option>
                <option value="PARTNERSHIP">Partnership Firm</option>
                <option value="PROPRIETORSHIP">Sole Proprietorship</option>
                <option value="OTHER">Other Registered Entity</option>
              </select>
              {fieldErrors.businessRegistrationType && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">
                  {fieldErrors.businessRegistrationType}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#292524] mb-1">
                Year of Establishment (Optional)
              </label>
              <input
                type="text"
                name="yearOfEstablishment"
                maxLength={4}
                value={yearOfEstablishment}
                onChange={(e) =>
                  handleFieldChange('yearOfEstablishment', e.target.value, setYearOfEstablishment, {
                    autoTouchOnInput: true
                  })
                }
                onBlur={() =>
                  handleFieldBlur('yearOfEstablishment', yearOfEstablishment, {
                    normalize: (v) => v.trim(),
                    setter: setYearOfEstablishment
                  })
                }
                placeholder="e.g. 2018"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                  fieldErrors.yearOfEstablishment
                    ? 'border-rose-500 bg-rose-50/30 focus:ring-rose-500/30'
                    : 'border-[#E7E5E4] focus:ring-[#943D24]'
                }`}
              />
              {fieldErrors.yearOfEstablishment && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">
                  {fieldErrors.yearOfEstablishment}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#292524] mb-1">
                Website URL (Optional)
              </label>
              <input
                type="url"
                name="website"
                value={website}
                onChange={(e) =>
                  handleFieldChange('website', e.target.value, setWebsite, {
                    autoTouchOnInput: true
                  })
                }
                onBlur={() =>
                  handleFieldBlur('website', website, {
                    normalize: (v) => v.trim(),
                    setter: setWebsite
                  })
                }
                placeholder="https://company.com"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                  fieldErrors.website
                    ? 'border-rose-500 bg-rose-50/30 focus:ring-rose-500/30'
                    : 'border-[#E7E5E4] focus:ring-[#943D24]'
                }`}
              />
              {fieldErrors.website && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.website}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#292524] mb-1">
                Business &amp; Inventory Capabilities Description (Optional)
              </label>
              <textarea
                rows={3}
                name="description"
                maxLength={1000}
                value={description}
                onChange={(e) =>
                  handleFieldChange('description', e.target.value, setDescription, {
                    autoTouchOnInput: true
                  })
                }
                onBlur={() => handleFieldBlur('description', description)}
                placeholder="Describe your manufacturing, storage capacities, inventory lines, and Bengaluru distribution readiness..."
                className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                  fieldErrors.description
                    ? 'border-rose-500 bg-rose-50/30 focus:ring-rose-500/30'
                    : 'border-[#E7E5E4] focus:ring-[#943D24]'
                }`}
              />
              {fieldErrors.description && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.description}</p>
              )}
            </div>
          </div>

          {/* Upload Your Business Logo */}
          <div className="p-4 rounded-2xl bg-[#FBF3F0] border border-[#E7E5E4] space-y-3">
            <div>
              <h4 className="text-xs font-bold text-[#292524] flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-[#943D24]" />
                Upload Your Business Logo
              </h4>
              <p className="text-[11px] text-[#78716C] mt-0.5">
                JPG, JPEG, PNG or WEBP &bull; Maximum 5 MB. Appears on your store profile &amp; review summary.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-[#E7E5E4] bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-2xs relative">
                {isUploadingLogo ? (
                  <Loader2 className="w-6 h-6 text-[#943D24] animate-spin" />
                ) : logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Business Logo Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-[#78716C] p-2 text-center">
                    <Building2 className="w-6 h-6 text-[#943D24]/50 mb-0.5" />
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#78716C]">
                      {storeName ? storeName.slice(0, 2).toUpperCase() : 'LOGO'}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#943D24] text-white hover:bg-[#7D331E] transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs">
                    <UploadCloud className="w-3.5 h-3.5 text-[#F6C453]" />
                    <span>{logoPreview ? 'Replace Logo' : 'Choose Logo Image'}</span>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      onChange={handleLogoSelect}
                      disabled={isUploadingLogo}
                      className="hidden"
                    />
                  </label>

                  {logoPreview && !isUploadingLogo && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  )}
                </div>

                {logoMetadata && !logoError && (
                  <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Uploaded ({Math.round(logoMetadata.fileSize / 1024)} KB)
                  </p>
                )}

                {logoError && <p className="text-[11px] text-rose-600 font-medium">{logoError}</p>}
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-between gap-2.5 border-t border-[#E7E5E4]">
            <button
              type="button"
              onClick={() => goToStep(1)}
              className="py-2.5 px-4 rounded-xl text-xs font-bold text-[#78716C] border border-[#E7E5E4] hover:bg-[#F8F7F5] flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Account
            </button>
            <button
              type="button"
              onClick={handleStep2Next}
              className="py-3 px-6 rounded-xl text-sm font-bold bg-[#943D24] text-white hover:bg-[#7D331E] transition-all shadow-md shadow-[#943D24]/20 flex items-center gap-2 cursor-pointer"
            >
              {returnTo === 'review' ? 'Save & Return to Review' : 'Next: Address & Hubs'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* STEP 3: BUSINESS ADDRESS & DISPATCH HUBS             */}
      {/* ==================================================== */}
      {currentStep === 3 && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. PINCODE (First Field - Required, Strict ^[1-9][0-9]{5}$) */}
            <div className="md:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                <label className="block text-xs font-bold text-[#292524]">
                  1. Pincode (Postal Code) *
                </label>
                <button
                  type="button"
                  onClick={() => setIsManualAddress(!isManualAddress)}
                  className="text-[11px] font-semibold text-[#943D24] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  {isManualAddress
                    ? 'Switch to Auto Lookup'
                    : 'Cannot find your pincode? Enter location manually'}
                </button>
              </div>
              <div className="relative">
                <MapPin className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="pincode"
                  inputMode="numeric"
                  value={pincode}
                  onChange={(e) =>
                    handleFieldChange('pincode', e.target.value, setPincode, {
                      autoTouchOnInput: true
                    })
                  }
                  onBlur={() => handleFieldBlur('pincode', pincode)}
                  required
                  placeholder="Enter 6-digit Indian Pincode (e.g. 560072, 110001, 400001)"
                  className={`w-full pl-10 pr-24 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 font-mono ${
                    fieldErrors.pincode || pincodeLookupError
                      ? 'border-rose-500 bg-rose-50/30 focus:ring-rose-500/30'
                      : 'border-[#E7E5E4] focus:ring-[#943D24]'
                  }`}
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {isPincodeLoading && <Loader2 className="w-4 h-4 text-[#943D24] animate-spin" />}
                  {!isPincodeLoading && pincodeLookupSuccess && !fieldErrors.pincode && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                    </span>
                  )}
                </div>
              </div>
              {fieldErrors.pincode && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.pincode}</p>
              )}
              {pincodeLookupError && !fieldErrors.pincode && (
                <div className="mt-1.5 p-2.5 bg-rose-50 rounded-xl border border-rose-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-rose-700">
                  <span>{pincodeLookupError}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => performPincodeLookup(pincode)}
                      className="font-bold underline text-rose-800 hover:text-rose-900 cursor-pointer"
                    >
                      Retry
                    </button>
                    <span>&bull;</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsManualAddress(true);
                        setPincodeLookupError(null);
                      }}
                      className="font-bold underline text-[#943D24] cursor-pointer"
                    >
                      Enter Manually
                    </button>
                  </div>
                </div>
              )}
              {!pincodeLookupError && !fieldErrors.pincode && (
                <p className="text-[11px] text-[#78716C] mt-1">
                  Enter 6 digits starting with 1–9 to automatically populate Country, State, City and Localities.
                </p>
              )}
            </div>

            {/* If multiple localities exist: Sub-locality / Area Dropdown */}
            {availableLocalities.length > 1 && (
              <div className="md:col-span-2 p-3 bg-[#FBF3F0]/60 rounded-xl border border-[#943D24]/25">
                <label className="block text-xs font-bold text-[#292524] mb-1">
                  Select Area / Locality (Post Office) *
                </label>
                <select
                  value={selectedLocality}
                  onChange={(e) => {
                    setSelectedLocality(e.target.value);
                    setArea(e.target.value);
                  }}
                  className="w-full px-3.5 py-2 rounded-lg border border-[#943D24]/25 text-sm focus:outline-none focus:ring-2 focus:ring-[#943D24] bg-white font-medium text-[#292524]"
                >
                  {availableLocalities.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[#943D24] mt-1">
                  Multiple delivery postal circles found for pincode {pincode}. Please pick your exact trade locality.
                </p>
              </div>
            )}

            {/* 2. Country (Auto-filled) */}
            <div>
              <label className="block text-xs font-bold text-[#292524] mb-1">
                2. Country (Auto-filled)
              </label>
              <input
                type="text"
                value="India"
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E5E4] bg-[#F8F7F5] text-sm text-[#78716C] cursor-not-allowed font-medium"
              />
            </div>

            {/* 3. State (Auto-filled or Manual) */}
            <div>
              <label className="block text-xs font-bold text-[#292524] mb-1">
                3. State {isManualAddress ? '*' : '(Auto-filled)'}
              </label>
              <input
                type="text"
                name="state"
                value={state}
                readOnly={!isManualAddress}
                disabled={!isManualAddress && !state}
                onChange={(e) =>
                  handleFieldChange('state', e.target.value, setState, {
                    autoTouchOnInput: true
                  })
                }
                onBlur={() => isManualAddress && handleFieldBlur('state', state)}
                required
                placeholder={isManualAddress ? 'Enter state (e.g. Karnataka)' : 'Auto-populated from Pincode'}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                  !isManualAddress
                    ? 'bg-[#F8F7F5] text-[#292524] cursor-not-allowed border-[#E7E5E4]'
                    : 'bg-white border-[#E7E5E4] focus:ring-[#943D24]'
                } ${fieldErrors.state ? 'border-rose-500 bg-rose-50/30' : ''}`}
              />
              {fieldErrors.state && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.state}</p>
              )}
            </div>

            {/* 4. City / Region (Auto-filled or Manual) */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#292524] mb-1">
                4. City / Region {isManualAddress ? '*' : '(Auto-filled)'}
              </label>
              <input
                type="text"
                name="city"
                value={city}
                readOnly={!isManualAddress}
                disabled={!isManualAddress && !city}
                onChange={(e) =>
                  handleFieldChange('city', e.target.value, setCity, {
                    autoTouchOnInput: true
                  })
                }
                onBlur={() => isManualAddress && handleFieldBlur('city', city)}
                required
                placeholder={isManualAddress ? 'Enter city (e.g. Bengaluru)' : 'Auto-populated from Pincode'}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                  !isManualAddress
                    ? 'bg-[#F8F7F5] text-[#292524] cursor-not-allowed border-[#E7E5E4]'
                    : 'bg-white border-[#E7E5E4] focus:ring-[#943D24]'
                } ${fieldErrors.city ? 'border-rose-500 bg-rose-50/30' : ''}`}
              />
              {fieldErrors.city && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.city}</p>
              )}
            </div>

            {/* 5. Complete Registered Business Address (Required) */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#292524] mb-1">
                5. Complete Registered Business Address *
              </label>
              <textarea
                rows={3}
                name="completeAddress"
                maxLength={250}
                value={completeAddress}
                onChange={(e) =>
                  handleFieldChange('completeAddress', e.target.value, setCompleteAddress, {
                    autoTouchOnInput: true
                  })
                }
                onBlur={() =>
                  handleFieldBlur('completeAddress', completeAddress, {
                    normalize: (v) => v.trim(),
                    setter: setCompleteAddress
                  })
                }
                required
                placeholder="Building number / shed, Street name, Industrial layout or Commercial estate, Landmark..."
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                  fieldErrors.completeAddress
                    ? 'border-rose-500 bg-rose-50/30 focus:ring-rose-500/30'
                    : 'border-[#E7E5E4] focus:ring-[#943D24]'
                }`}
              />
              {fieldErrors.completeAddress && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">
                  {fieldErrors.completeAddress}
                </p>
              )}
              <p className="text-[11px] text-[#78716C] mt-1">
                Must match the official registered address on your GST REG-06 or Company PAN card.
              </p>
            </div>
          </div>

          {/* Dispatch Hubs / Warehouses */}
          <div className="p-4 bg-[#FBF3F0] rounded-2xl border border-[#E7E5E4] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-[#292524]">
                  Dispatch Warehouses &amp; Dark Store Hubs
                </h4>
                <p className="text-[11px] text-[#78716C]">
                  Locations from where BUILDORA 60 mini-trucks pick up orders for 60-min delivery.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddWarehouse}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-[#943D24] border border-[#943D24]/25 hover:bg-[#FBF3F0] flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Warehouse
              </button>
            </div>

            {warehouses.length > 0 ? (
              <div className="space-y-2">
                {warehouses.map((wh) => (
                  <div
                    key={wh.id}
                    className="p-3 bg-white rounded-xl border border-[#E7E5E4] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <Building2 className="w-4 h-4 text-[#943D24]" />
                      <div>
                        <span className="font-bold text-[#292524]">{wh.name}</span>
                        <p className="text-[11px] text-[#78716C]">
                          {wh.address}, Pincode: {wh.pincode}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveWarehouse(wh.id)}
                      className="text-[#78716C] hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-white rounded-xl border border-dashed border-[#E7E5E4] text-center text-xs text-[#78716C]">
                Primary business address will be used as default dispatch hub. Click &quot;+ Add Warehouse&quot; to add additional depots.
              </div>
            )}
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-between gap-2.5 border-t border-[#E7E5E4]">
            <button
              type="button"
              onClick={() => goToStep(2)}
              className="py-2.5 px-4 rounded-xl text-xs font-bold text-[#78716C] border border-[#E7E5E4] hover:bg-[#F8F7F5] flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Business
            </button>
            <button
              type="button"
              onClick={handleStep3Next}
              className="py-3 px-6 rounded-xl text-sm font-bold bg-[#943D24] text-white hover:bg-[#7D331E] transition-all shadow-md shadow-[#943D24]/20 flex items-center gap-2 cursor-pointer"
            >
              Next: KYC &amp; Tax Documents
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* STEP 4: KYC & TAX DOCUMENTS                          */}
      {/* ==================================================== */}
      {currentStep === 4 && (() => {
        const aadhaarDoc = documents.find((d) => d.type === 'AADHAAR_CARD' || d.type === 'AUTHORIZED_ID');
        const panDoc = documents.find((d) => d.type === 'PAN_CARD');
        const gstDoc = documents.find((d) => d.type === 'GST_CERTIFICATE');
        const gstAckDoc = documents.find((d) => d.type === 'GST_ACKNOWLEDGEMENT');
        const udyamDoc = documents.find((d) => d.type === 'UDYAM_CERTIFICATE' || d.type === 'MSME_CERTIFICATE');
        const msmeAckDoc = documents.find((d) => d.type === 'MSME_ACKNOWLEDGEMENT');
        const tradeDoc = documents.find((d) => d.type === 'BUSINESS_REGISTRATION');
        const tradeRequired = isTradeLicenseRequired(businessRegistrationType);

        const renderDocUploadBox = (
          docType: VendorKycDocument['type'],
          title: string,
          uploaded: VendorKycDocument | undefined,
          required: boolean,
          errorKey: string,
          helperText = 'PDF, JPG, JPEG, or PNG (Max 5 MB)'
        ) => {
          const isUploadingThis = isUploadingDocType === docType;
          const specificError = fieldErrors[errorKey];
          return (
            <div className="p-3.5 rounded-2xl border border-[#E7E5E4] bg-white space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-[#292524]">
                    {title} {required ? '*' : '(Optional)'}
                  </span>
                  <p className="text-[11px] text-[#78716C]">{helperText}</p>
                </div>
                {uploaded ? (
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${
                      uploaded.verificationStatus === 'VERIFIED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : uploaded.verificationStatus === 'REJECTED'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {uploaded.verificationStatus === 'VERIFIED'
                      ? 'Verified'
                      : uploaded.verificationStatus === 'REJECTED'
                        ? 'Rejected'
                        : 'Uploaded • Pending Review'}
                  </span>
                ) : (
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                      required ? 'bg-[#FBF3F0] text-[#943D24]' : 'bg-[#F8F7F5] text-[#78716C]'
                    }`}
                  >
                    {required ? 'Required' : 'Optional'}
                  </span>
                )}
              </div>

              {uploaded?.verificationStatus === 'REJECTED' && uploaded.rejectionReason && (
                <p className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1.5">
                  Rejected: {uploaded.rejectionReason}
                </p>
              )}

              {uploaded ? (
                <div className="p-2.5 rounded-xl bg-[#F8F7F5] border border-[#E7E5E4] flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <FileText className="w-3.5 h-3.5 text-[#943D24] shrink-0" />
                    <span className="truncate font-medium text-[#292524]">{uploaded.fileName}</span>
                    {uploaded.fileSize > 0 && (
                      <span className="text-[10px] text-[#78716C] shrink-0">
                        ({Math.max(1, Math.round(uploaded.fileSize / 1024))} KB)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => void handleOpenPreview(uploaded)}
                      className="text-[11px] font-semibold text-[#292524] hover:text-[#943D24] inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" /> Preview
                    </button>
                    <button
                      type="button"
                      disabled={Boolean(isUploadingDocType)}
                      onClick={() => handleFileUpload(docType, title, errorKey)}
                      className="text-[11px] font-semibold text-[#943D24] hover:underline cursor-pointer disabled:opacity-50"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveDocument(uploaded)}
                      title="Remove document"
                      className="text-[#78716C] hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={Boolean(isUploadingDocType)}
                  onClick={() => handleFileUpload(docType, title, errorKey)}
                  className="w-full py-2.5 px-3 rounded-xl border border-dashed border-[#943D24]/40 text-[#943D24] text-xs font-bold bg-[#FBF3F0]/50 hover:bg-[#FBF3F0] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {isUploadingThis ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Uploading ({uploadProgress || 50}%)...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-3.5 h-3.5 text-[#F6C453]" />
                      Upload {title}
                    </>
                  )}
                </button>
              )}

              {specificError && (
                <p className="text-[11px] text-rose-600 font-medium">{specificError}</p>
              )}
            </div>
          );
        };

        return (
          <div className="space-y-5">
            {/* A. Aadhaar Details */}
            <div className="p-4 rounded-2xl border border-[#E7E5E4] bg-[#FAF7F4] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-xs font-bold text-[#292524]">
                  A. Authorized Signatory Aadhaar Details *
                </h4>
                <span className="px-2 py-0.5 rounded bg-white border border-[#E7E5E4] text-[10px] font-bold text-[#5E5946] shrink-0">
                  Document Type: Aadhaar Card
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <div>
                  <label className="block text-xs font-bold text-[#292524] mb-1">
                    Aadhaar Number (12 Digits) *
                  </label>
                  <div className="relative">
                    <input
                      type={showAadhaar ? 'text' : 'password'}
                      name="aadhaarNumber"
                      inputMode="numeric"
                      maxLength={14}
                      value={aadhaarNumber}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 12);
                        handleFieldChange('aadhaarNumber', digits, setAadhaarNumber, {
                          autoTouchOnInput: true
                        });
                      }}
                      onBlur={() =>
                        handleFieldBlur('aadhaarNumber', aadhaarNumber, {
                          normalize: (v) => v.replace(/\D/g, '').slice(0, 12),
                          setter: setAadhaarNumber
                        })
                      }
                      required
                      placeholder="Enter 12-digit Aadhaar number"
                      className={`w-full px-3.5 pr-9 py-2.5 rounded-xl border bg-white font-mono text-sm tracking-wide focus:outline-none focus:ring-2 ${
                        fieldErrors.aadhaarNumber
                          ? 'border-rose-500 bg-rose-50/30 focus:ring-rose-500/30'
                          : 'border-[#E7E5E4] focus:ring-[#943D24]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowAadhaar(!showAadhaar)}
                      aria-label={showAadhaar ? 'Hide Aadhaar number' : 'Show Aadhaar number'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#78716C] cursor-pointer"
                    >
                      {showAadhaar ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-[#78716C] mt-1">
                    Encrypted at rest and masked in Admin views (XXXX XXXX 1234).
                  </p>
                  {fieldErrors.aadhaarNumber && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">
                      {fieldErrors.aadhaarNumber}
                    </p>
                  )}
                </div>

                {renderDocUploadBox(
                  'AADHAAR_CARD',
                  'Aadhaar Card Document',
                  aadhaarDoc,
                  true,
                  'aadhaarDoc'
                )}
              </div>
            </div>

            {/* B. PAN Details */}
            <div className="p-4 rounded-2xl border border-[#E7E5E4] bg-[#FAF7F4] space-y-3">
              <h4 className="text-xs font-bold text-[#292524]">
                B. Company / Proprietor PAN Details *
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <div>
                  <label className="block text-xs font-bold text-[#292524] mb-1">
                    PAN Number (10 Characters) *
                  </label>
                  <input
                    type="text"
                    name="pan"
                    maxLength={10}
                    value={pan}
                    onChange={(e) =>
                      handleFieldChange('pan', e.target.value.toUpperCase(), setPan, {
                        autoTouchOnInput: true
                      })
                    }
                    onBlur={() =>
                      handleFieldBlur('pan', pan, {
                        normalize: (v) => v.trim().toUpperCase(),
                        setter: setPan
                      })
                    }
                    required
                    placeholder="e.g. AABCB9876F"
                    className={`w-full px-3.5 py-2.5 rounded-xl border bg-white font-mono text-sm tracking-wide focus:outline-none focus:ring-2 ${
                      fieldErrors.pan
                        ? 'border-rose-500 bg-rose-50/30 focus:ring-rose-500/30'
                        : 'border-[#E7E5E4] focus:ring-[#943D24]'
                    }`}
                  />
                  {fieldErrors.pan && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.pan}</p>
                  )}
                </div>

                {renderDocUploadBox('PAN_CARD', 'PAN Card Document', panDoc, true, 'panDoc')}
              </div>
            </div>

            {/* C. GST Registration Details */}
            <div className="p-4 rounded-2xl border border-[#E7E5E4] bg-[#FAF7F4] space-y-3">
              <h4 className="text-xs font-bold text-[#292524]">C. GST Registration Details *</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <div>
                  <label className="block text-xs font-bold text-[#292524] mb-1">
                    GST Registration Status *
                  </label>
                  <select
                    name="gstStatus"
                    value={gstStatus}
                    onChange={(e) => {
                      const next = e.target.value as VendorGstStatus;
                      setGstStatus(next);
                      clearFieldError('gstStatus');
                      clearFieldError('gstin');
                      clearFieldError('gstDoc');
                      clearFieldError('gstApplicationNumber');
                      setSingleFieldWarning('gstin', undefined);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E5E4] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#943D24]"
                  >
                    <option value="REGISTERED">Registered</option>
                    <option value="NOT_REGISTERED">Not Registered</option>
                    <option value="APPLIED">Applied for Registration</option>
                  </select>
                </div>

                {gstStatus === 'REGISTERED' && (
                  <div>
                    <label className="block text-xs font-bold text-[#292524] mb-1">
                      GSTIN Number (15 Characters) *
                    </label>
                    <input
                      type="text"
                      name="gstin"
                      maxLength={15}
                      value={gstin}
                      onChange={(e) =>
                        handleFieldChange('gstin', e.target.value.toUpperCase(), setGstin, {
                          autoTouchOnInput: true
                        })
                      }
                      onBlur={() =>
                        handleFieldBlur('gstin', gstin, {
                          normalize: (v) => v.trim().toUpperCase(),
                          setter: setGstin
                        })
                      }
                      required
                      placeholder="e.g. 29AABCB9876F1Z8"
                      className={`w-full px-3.5 py-2.5 rounded-xl border bg-white font-mono text-sm tracking-wide focus:outline-none focus:ring-2 ${
                        fieldErrors.gstin
                          ? 'border-rose-500 bg-rose-50/30 focus:ring-rose-500/30'
                          : 'border-[#E7E5E4] focus:ring-[#943D24]'
                      }`}
                    />
                    {fieldErrors.gstin && (
                      <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.gstin}</p>
                    )}
                    {!fieldErrors.gstin && fieldWarnings.gstin && (
                      <p className="text-[11px] text-amber-700 mt-1 font-medium">{fieldWarnings.gstin}</p>
                    )}
                  </div>
                )}

                {gstStatus === 'APPLIED' && (
                  <div>
                    <label className="block text-xs font-bold text-[#292524] mb-1">
                      GST Application / ARN Reference Number (Optional)
                    </label>
                    <input
                      type="text"
                      name="gstApplicationNumber"
                      maxLength={35}
                      value={gstApplicationNumber}
                      onChange={(e) =>
                        handleFieldChange(
                          'gstApplicationNumber',
                          e.target.value.toUpperCase(),
                          setGstApplicationNumber,
                          { autoTouchOnInput: true }
                        )
                      }
                      placeholder="e.g. AA2905241234567"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E5E4] bg-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#943D24]"
                    />
                    {fieldErrors.gstApplicationNumber && (
                      <p className="text-[11px] text-rose-600 mt-1 font-medium">
                        {fieldErrors.gstApplicationNumber}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {gstStatus === 'REGISTERED' &&
                renderDocUploadBox(
                  'GST_CERTIFICATE',
                  'GST Registration Certificate (REG-06)',
                  gstDoc,
                  true,
                  'gstDoc'
                )}

              {gstStatus === 'APPLIED' &&
                renderDocUploadBox(
                  'GST_ACKNOWLEDGEMENT',
                  'GST Application Acknowledgement',
                  gstAckDoc,
                  false,
                  'gstDoc'
                )}

              {gstStatus === 'NOT_REGISTERED' && (
                <p className="text-[11px] text-[#78716C] bg-white border border-[#E7E5E4] rounded-xl px-3 py-2">
                  GST is marked as <strong>Not Registered</strong>. GSTIN and GST Certificate are not
                  required to continue.
                </p>
              )}
            </div>

            {/* D. MSME Details */}
            <div className="p-4 rounded-2xl border border-[#E7E5E4] bg-[#FAF7F4] space-y-3">
              <h4 className="text-xs font-bold text-[#292524]">D. MSME / Udyam Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <div>
                  <label className="block text-xs font-bold text-[#292524] mb-1">
                    MSME Registration Status
                  </label>
                  <select
                    name="msmeStatus"
                    value={msmeStatus}
                    onChange={(e) => {
                      const next = e.target.value as VendorMsmeStatus;
                      setMsmeStatus(next);
                      clearFieldError('msmeStatus');
                      clearFieldError('udyamNumber');
                      clearFieldError('msmeDoc');
                      clearFieldError('msmeApplicationNumber');
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E5E4] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#943D24]"
                  >
                    <option value="REGISTERED">Yes – MSME Registered</option>
                    <option value="NOT_REGISTERED">No – Not MSME Registered</option>
                    <option value="APPLIED">Applied for MSME Registration</option>
                  </select>
                </div>

                {msmeStatus === 'REGISTERED' && (
                  <div>
                    <label className="block text-xs font-bold text-[#292524] mb-1">
                      Udyam Registration Number *
                    </label>
                    <input
                      type="text"
                      name="udyamNumber"
                      maxLength={20}
                      value={udyamNumber}
                      onChange={(e) =>
                        handleFieldChange('udyamNumber', e.target.value.toUpperCase(), setUdyamNumber, {
                          autoTouchOnInput: true
                        })
                      }
                      onBlur={() =>
                        handleFieldBlur('udyamNumber', udyamNumber, {
                          normalize: (v) => v.trim().toUpperCase(),
                          setter: setUdyamNumber
                        })
                      }
                      required
                      placeholder="e.g. UDYAM-KA-03-0012345"
                      className={`w-full px-3.5 py-2.5 rounded-xl border bg-white font-mono text-sm tracking-wide focus:outline-none focus:ring-2 ${
                        fieldErrors.udyamNumber
                          ? 'border-rose-500 bg-rose-50/30 focus:ring-rose-500/30'
                          : 'border-[#E7E5E4] focus:ring-[#943D24]'
                      }`}
                    />
                    {fieldErrors.udyamNumber && (
                      <p className="text-[11px] text-rose-600 mt-1 font-medium">
                        {fieldErrors.udyamNumber}
                      </p>
                    )}
                  </div>
                )}

                {msmeStatus === 'APPLIED' && (
                  <div>
                    <label className="block text-xs font-bold text-[#292524] mb-1">
                      MSME Application Reference Number (Optional)
                    </label>
                    <input
                      type="text"
                      name="msmeApplicationNumber"
                      maxLength={35}
                      value={msmeApplicationNumber}
                      onChange={(e) =>
                        handleFieldChange(
                          'msmeApplicationNumber',
                          e.target.value.toUpperCase(),
                          setMsmeApplicationNumber,
                          { autoTouchOnInput: true }
                        )
                      }
                      placeholder="e.g. UDYAM-APP-2026-00912"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E5E4] bg-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#943D24]"
                    />
                    {fieldErrors.msmeApplicationNumber && (
                      <p className="text-[11px] text-rose-600 mt-1 font-medium">
                        {fieldErrors.msmeApplicationNumber}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {msmeStatus === 'REGISTERED' &&
                renderDocUploadBox(
                  'UDYAM_CERTIFICATE',
                  'Udyam Registration Certificate',
                  udyamDoc,
                  true,
                  'msmeDoc'
                )}

              {msmeStatus === 'APPLIED' &&
                renderDocUploadBox(
                  'MSME_ACKNOWLEDGEMENT',
                  'MSME Application Acknowledgement',
                  msmeAckDoc,
                  false,
                  'msmeDoc'
                )}
            </div>

            {/* E. Trade License / Incorporation Certificate */}
            <div className="p-4 rounded-2xl border border-[#E7E5E4] bg-[#FAF7F4] space-y-3">
              <h4 className="text-xs font-bold text-[#292524]">
                E. Business Entity Proof (Trade License / Incorporation Certificate)
              </h4>
              {renderDocUploadBox(
                'BUSINESS_REGISTRATION',
                'Trade License / Incorporation Certificate',
                tradeDoc,
                tradeRequired,
                'businessRegDoc'
              )}
            </div>

            <div className="pt-4 flex flex-wrap items-center justify-between gap-2.5 border-t border-[#E7E5E4]">
              <button
                type="button"
                onClick={() => goToStep(3)}
                className="py-2.5 px-4 rounded-xl text-xs font-bold text-[#78716C] border border-[#E7E5E4] hover:bg-[#F8F7F5] flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Address
              </button>
              <button
                type="button"
                disabled={isLoading || Boolean(isUploadingDocType)}
                onClick={handleStep4Next}
                className="py-3 px-6 rounded-xl text-sm font-bold bg-[#943D24] text-white hover:bg-[#7D331E] transition-all shadow-md shadow-[#943D24]/20 flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                Next: Bank &amp; Settlement Details
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })()}

      {/* ==================================================== */}
      {/* STEP 5: BANK & COMPLIANCE INFORMATION                */}
      {/* ==================================================== */}
      {currentStep === 5 && (() => {
        const bankProofDoc = documents.find((d) => d.type === 'CANCELLED_CHEQUE');
        return (
        <form onSubmit={handleProceedToReview} noValidate className="space-y-6">
          {/* Bank Settlement Section */}
          <div className="p-4 bg-[#FBF3F0] rounded-2xl border border-[#E7E5E4] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-xs font-bold text-[#292524] flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-[#943D24]" />
                Settlement Bank Account Details (7-Day Direct Payouts)
              </h4>
              <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-700">
                Bank Verification: Pending Admin Check
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#292524] mb-1">
                  Account Holder / Beneficiary Name *
                </label>
                <input
                  type="text"
                  name="accountHolderName"
                  maxLength={100}
                  value={accountHolderName}
                  onChange={(e) =>
                    handleFieldChange('accountHolderName', e.target.value, setAccountHolderName, {
                      autoTouchOnInput: true
                    })
                  }
                  onBlur={() =>
                    handleFieldBlur('accountHolderName', accountHolderName, {
                      normalize: (v) => v.trim().replace(/\s+/g, ' '),
                      setter: setAccountHolderName
                    })
                  }
                  required
                  placeholder="As per bank passbook / statement"
                  className={`w-full px-3.5 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 ${
                    fieldErrors.accountHolderName
                      ? 'border-rose-500 bg-rose-50/30 focus:ring-rose-500/30'
                      : 'border-white bg-white focus:ring-[#943D24]'
                  }`}
                />
                {fieldErrors.accountHolderName && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">
                    {fieldErrors.accountHolderName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#292524] mb-1">Bank Name *</label>
                <input
                  type="text"
                  name="bankName"
                  maxLength={80}
                  value={bankName}
                  onChange={(e) =>
                    handleFieldChange('bankName', e.target.value, setBankName, {
                      autoTouchOnInput: true
                    })
                  }
                  onBlur={() =>
                    handleFieldBlur('bankName', bankName, {
                      normalize: (v) => v.trim().replace(/\s+/g, ' '),
                      setter: setBankName
                    })
                  }
                  required
                  placeholder="e.g. HDFC Bank, ICICI Bank, SBI"
                  className={`w-full px-3.5 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 ${
                    fieldErrors.bankName
                      ? 'border-rose-500 bg-rose-50/30 focus:ring-rose-500/30'
                      : 'border-white bg-white focus:ring-[#943D24]'
                  }`}
                />
                {fieldErrors.bankName && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.bankName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#292524] mb-1">
                  Account Number *
                </label>
                <div className="relative">
                  <input
                    type={showAccountNumber ? 'text' : 'password'}
                    name="accountNumber"
                    inputMode="numeric"
                    value={accountNumber}
                    onChange={(e) =>
                      handleFieldChange('accountNumber', e.target.value, setAccountNumber, {
                        autoTouchOnInput: true
                      })
                    }
                    onBlur={() => handleFieldBlur('accountNumber', accountNumber)}
                    required
                    placeholder="Account number (9-18 digits)"
                    className={`w-full px-3.5 pr-9 py-2 rounded-xl border font-mono text-xs focus:outline-none focus:ring-2 ${
                      fieldErrors.accountNumber
                        ? 'border-rose-500 bg-rose-50/30 focus:ring-rose-500/30'
                        : 'border-white bg-white focus:ring-[#943D24]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAccountNumber(!showAccountNumber)}
                    aria-label={showAccountNumber ? 'Hide account number' : 'Show account number'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#78716C] cursor-pointer"
                  >
                    {showAccountNumber ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                {fieldErrors.accountNumber && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">
                    {fieldErrors.accountNumber}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#292524] mb-1">
                  Confirm Account Number *
                </label>
                <input
                  type="text"
                  name="confirmAccountNumber"
                  inputMode="numeric"
                  value={confirmAccountNumber}
                  onChange={(e) =>
                    handleFieldChange(
                      'confirmAccountNumber',
                      e.target.value,
                      setConfirmAccountNumber,
                      { autoTouchOnInput: true }
                    )
                  }
                  onBlur={() => handleFieldBlur('confirmAccountNumber', confirmAccountNumber)}
                  required
                  placeholder="Re-enter account number"
                  className={`w-full px-3.5 py-2 rounded-xl border font-mono text-xs focus:outline-none focus:ring-2 ${
                    fieldErrors.confirmAccountNumber
                      ? 'border-rose-500 bg-rose-50/30 focus:ring-rose-500/30'
                      : 'border-white bg-white focus:ring-[#943D24]'
                  }`}
                />
                {fieldErrors.confirmAccountNumber && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">
                    {fieldErrors.confirmAccountNumber}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#292524] mb-1">IFSC Code *</label>
                <input
                  type="text"
                  name="ifsc"
                  value={ifsc}
                  onChange={(e) =>
                    handleFieldChange('ifsc', e.target.value.toUpperCase(), setIfsc, {
                      autoTouchOnInput: true
                    })
                  }
                  onBlur={() =>
                    handleFieldBlur('ifsc', ifsc, {
                      normalize: (v) => v.trim().toUpperCase(),
                      setter: setIfsc
                    })
                  }
                  required
                  placeholder="e.g. HDFC0000053"
                  className={`w-full px-3.5 py-2 rounded-xl border font-mono text-xs focus:outline-none focus:ring-2 ${
                    fieldErrors.ifsc
                      ? 'border-rose-500 bg-rose-50/30 focus:ring-rose-500/30'
                      : 'border-white bg-white focus:ring-[#943D24]'
                  }`}
                />
                {fieldErrors.ifsc && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.ifsc}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#292524] mb-1">Account Type *</label>
                <select
                  name="accountType"
                  value={accountType}
                  onChange={(e) => {
                    const next = e.target.value as 'CURRENT' | 'SAVINGS';
                    setAccountType(next);
                    setTouched((prev) => ({ ...prev, accountType: true }));
                    setSingleFieldError('accountType', validateBankAccountType(next).error);
                  }}
                  className={`w-full px-3.5 py-2 rounded-xl border bg-white text-xs focus:outline-none focus:ring-2 ${
                    fieldErrors.accountType
                      ? 'border-rose-500 bg-rose-50/30 focus:ring-rose-500/30'
                      : 'border-white focus:ring-[#943D24]'
                  }`}
                >
                  <option value="CURRENT">Current Account (Recommended for B2B)</option>
                  <option value="SAVINGS">Savings Account</option>
                </select>
                {fieldErrors.accountType && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">
                    {fieldErrors.accountType}
                  </p>
                )}
              </div>
            </div>

            {/* Bank Passbook / Cancelled Cheque Upload */}
            <div className="p-3.5 rounded-2xl border border-[#E7E5E4] bg-white space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-[#292524]">
                    Bank Passbook or Cancelled Cheque *
                  </span>
                  <p className="text-[11px] text-[#78716C]">
                    Upload front page of passbook or cancelled cheque leaf showing Account Number &amp;
                    IFSC (PDF, JPG, JPEG, PNG — Max 5 MB)
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                    bankProofDoc
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-[#FBF3F0] text-[#943D24]'
                  }`}
                >
                  {bankProofDoc ? 'Uploaded • Pending Review' : 'Required'}
                </span>
              </div>

              {bankProofDoc ? (
                <div className="p-2.5 rounded-xl bg-[#F8F7F5] border border-[#E7E5E4] flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <FileText className="w-3.5 h-3.5 text-[#943D24] shrink-0" />
                    <span className="truncate font-medium text-[#292524]">{bankProofDoc.fileName}</span>
                    {bankProofDoc.fileSize > 0 && (
                      <span className="text-[10px] text-[#78716C] shrink-0">
                        ({Math.max(1, Math.round(bankProofDoc.fileSize / 1024))} KB)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => void handleOpenPreview(bankProofDoc)}
                      className="text-[11px] font-semibold text-[#292524] hover:text-[#943D24] inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" /> Preview
                    </button>
                    <button
                      type="button"
                      disabled={Boolean(isUploadingDocType)}
                      onClick={() =>
                        handleFileUpload(
                          'CANCELLED_CHEQUE',
                          'Bank Passbook / Cancelled Cheque',
                          'bankProofDoc'
                        )
                      }
                      className="text-[11px] font-semibold text-[#943D24] hover:underline cursor-pointer disabled:opacity-50"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveDocument(bankProofDoc)}
                      title="Remove document"
                      className="text-[#78716C] hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={Boolean(isUploadingDocType)}
                  onClick={() =>
                    handleFileUpload(
                      'CANCELLED_CHEQUE',
                      'Bank Passbook / Cancelled Cheque',
                      'bankProofDoc'
                    )
                  }
                  className="w-full py-2.5 px-3 rounded-xl border border-dashed border-[#943D24]/40 text-[#943D24] text-xs font-bold bg-[#FBF3F0]/50 hover:bg-[#FBF3F0] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {isUploadingDocType === 'CANCELLED_CHEQUE' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Uploading ({uploadProgress || 50}%)...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-3.5 h-3.5 text-[#F6C453]" />
                      Upload Bank Passbook / Cancelled Cheque
                    </>
                  )}
                </button>
              )}

              {fieldErrors.bankProofDoc && (
                <p className="text-[11px] text-rose-600 font-medium">{fieldErrors.bankProofDoc}</p>
              )}
            </div>
          </div>

          {/* Terms & Conditions Acceptance */}
          <div className="p-3.5 bg-[#F8F7F5] rounded-2xl border border-[#E7E5E4] space-y-2 text-xs">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setTermsAccepted(checked);
                  setTouched((prev) => ({ ...prev, termsAccepted: true }));
                  setSingleFieldError(
                    'termsAccepted',
                    checked ? undefined : 'You must accept the BUILDORA 60 Supplier Terms of Partnership.'
                  );
                }}
                className="w-4 h-4 mt-0.5 rounded text-[#943D24] focus:ring-[#943D24]"
              />
              <span className="text-[#292524]">
                I agree to the <strong>BUILDORA 60 Supplier Terms of Partnership</strong>, 60-minute
                dispatch SLAs, and batch compressive testing standards. *
              </span>
            </label>
            {fieldErrors.termsAccepted && (
              <p className="text-[11px] text-rose-600 pl-6 font-medium">
                {fieldErrors.termsAccepted}
              </p>
            )}

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={privacyAccepted}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setPrivacyAccepted(checked);
                  setTouched((prev) => ({ ...prev, privacyAccepted: true }));
                  setSingleFieldError(
                    'privacyAccepted',
                    checked ? undefined : 'You must confirm the accuracy of submitted documents.'
                  );
                }}
                className="w-4 h-4 mt-0.5 rounded text-[#943D24] focus:ring-[#943D24]"
              />
              <span className="text-[#292524]">
                I confirm that all uploaded documents, GST credentials, and bank settlement details
                belong to the authorized entity. *
              </span>
            </label>
            {fieldErrors.privacyAccepted && (
              <p className="text-[11px] text-rose-600 pl-6 font-medium">
                {fieldErrors.privacyAccepted}
              </p>
            )}
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-2.5 border-t border-[#E7E5E4]">
            <button
              type="button"
              onClick={() => goToStep(4)}
              className="py-2.5 px-4 rounded-xl text-xs font-bold text-[#78716C] border border-[#E7E5E4] hover:bg-[#F8F7F5] flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Documents
            </button>
            <button
              type="submit"
              disabled={isLoading || Boolean(isUploadingDocType)}
              className="py-3 px-8 rounded-xl text-sm font-bold bg-[#943D24] text-white hover:bg-[#7D331E] transition-all shadow-md shadow-[#943D24]/20 flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Clock className="w-4 h-4 animate-spin" />
                  Preparing Review...
                </span>
              ) : (
                <>
                  Review Your Application
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
        );
      })()}

      {/* Inline KYC Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-[#E7E5E4] overflow-hidden flex flex-col max-h-[92vh] max-h-[92dvh] my-auto">
            <div className="px-4 py-3 bg-[#FAF7F4] border-b border-[#E7E5E4] flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#292524] truncate">{previewDoc.title}</p>
                <p className="text-[11px] text-[#78716C] truncate">{previewDoc.fileName}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPreviewDoc(null);
                  setPreviewBlobUrl(null);
                  setPreviewError(null);
                }}
                className="p-1.5 rounded-lg text-[#78716C] hover:bg-[#E7E5E4]/60 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 min-h-[260px] bg-[#F8F7F5] flex items-center justify-center p-3 sm:p-4 overflow-auto">
              {previewLoading ? (
                <div className="flex flex-col items-center gap-2 text-xs text-[#78716C]">
                  <Loader2 className="w-6 h-6 animate-spin text-[#943D24]" />
                  <span>Loading secure document preview...</span>
                </div>
              ) : previewError ? (
                <div className="text-center space-y-2 text-xs text-rose-700 max-w-sm">
                  <AlertCircle className="w-6 h-6 mx-auto" />
                  <p>{previewError}</p>
                </div>
              ) : previewBlobUrl ? (
                previewDoc.mimeType === 'application/pdf' ||
                previewDoc.fileName.toLowerCase().endsWith('.pdf') ? (
                  <iframe
                    src={previewBlobUrl}
                    title={previewDoc.fileName}
                    className="w-full h-[65vh] h-[65dvh] rounded-lg border border-[#E7E5E4] bg-white"
                  />
                ) : (
                  <img
                    src={previewBlobUrl}
                    alt={previewDoc.fileName}
                    className="max-h-[65vh] max-h-[65dvh] max-w-full object-contain rounded-lg border border-[#E7E5E4] bg-white"
                  />
                )
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorRegisterPage;
