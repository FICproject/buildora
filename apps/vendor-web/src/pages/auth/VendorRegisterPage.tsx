import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useVendorAuthStore } from '../../store/useVendorAuthStore';
import { vendorApi } from '../../services/vendorApi';
import {
  VendorKycDocument,
  VendorWarehouse,
  VendorRegistrationWizardData,
  VendorLogoMetadata
} from '@buildora/types';
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
  validatePassword,
  validateConfirmPassword,
  validateAddress,
  validateYearOfEstablishment,
  validateWebsite,
  validateLogoFileMetadata
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
  ShieldCheck,
  Clock,
  Loader2,
  RotateCcw,
  Search,
  Sparkles,
  Check,
  Image as ImageIcon
} from 'lucide-react';

export const VendorRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const requestedStep = Number(searchParams.get('step'));
  const { setSession, vendor: activeVendor } = useVendorAuthStore();

  // Wizard Step: 1 to 5
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [vendorId, setVendorId] = useState<string | null>(null);

  // Loading & Alert states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (error) setError(null);
  };

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
  const [isEmailOtpSent, setIsEmailOtpSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  // Mobile verification state
  const [mobileOtp, setMobileOtp] = useState('');
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
  const [sameDispatchAddress, setSameDispatchAddress] = useState(true);
  const [dispatchAddress, setDispatchAddress] = useState('');
  const [warehouses, setWarehouses] = useState<VendorWarehouse[]>([]);

  // Pincode Lookup States
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);
  const [pincodeLookupSuccess, setPincodeLookupSuccess] = useState(false);
  const [pincodeLookupError, setPincodeLookupError] = useState<string | null>(null);
  const [availableLocalities, setAvailableLocalities] = useState<string[]>([]);
  const [selectedLocality, setSelectedLocality] = useState('');
  const [isManualAddress, setIsManualAddress] = useState(false);

  // Helper to transition steps cleanly with no lingering notices
  const goToStep = (targetStep: number) => {
    setSuccessNotice(null);
    setError(null);
    setCurrentStep(targetStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ----------------------------------------------------
  // STEP 4: KYC & TAX DOCUMENTS (Initially 100% empty)
  // ----------------------------------------------------
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [documents, setDocuments] = useState<VendorKycDocument[]>([]);

  // ----------------------------------------------------
  // STEP 5: BANK & PRODUCT INFORMATION (Initially 100% empty)
  // ----------------------------------------------------
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [accountType, setAccountType] = useState<'CURRENT' | 'SAVINGS'>('CURRENT');
  const [chequeDocName, setChequeDocName] = useState<string | null>(null);

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

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
      if (d.gstin) setGstin(d.gstin);
      if (d.pan) setPan(d.pan);
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
    const clean = code.trim().replace(/\D/g, '');
    if (clean.length !== 6) return;

    const pinCheck = validatePincode(clean);
    if (!pinCheck.isValid) {
      setFieldErrors((prev) => ({ ...prev, pincode: pinCheck.error || 'Invalid 6-digit Indian Postal Pincode.' }));
      return;
    }

    setIsPincodeLoading(true);
    setPincodeLookupError(null);
    clearFieldError('pincode');

    try {
      const data = await vendorApi.lookupPincode(clean);
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

  // Debounced effect: triggers automatic lookup upon 6 numeric digits
  useEffect(() => {
    const clean = pincode.trim().replace(/\D/g, '');
    if (clean.length === 6) {
      const timer = setTimeout(() => {
        performPincodeLookup(clean);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      // Clear previously fetched location if user edits pincode
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

  // ----------------------------------------------------
  // STEP 1 HANDLERS
  // ----------------------------------------------------
  const handleSendEmailOtp = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldErrors((prev) => ({ ...prev, email: 'Please provide a valid official business email.' }));
      setError('Please provide a valid official business email.');
      return;
    }
    setError(null);
    clearFieldError('email');
    try {
      const res = await vendorApi.sendOtp(email.trim(), 'REGISTRATION_EMAIL');
      setIsEmailOtpSent(true);
      if (res.devOtpHint) {
        setEmailOtp(res.devOtpHint);
      }
      setSuccessNotice(`Verification code sent to ${email}`);
    } catch (err: any) {
      setError(err.message || 'Failed to send email verification code.');
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!emailOtp || emailOtp.length < 4) {
      setError('Please enter the 6-digit email verification code.');
      return;
    }
    try {
      await vendorApi.verifyOtp(email.trim(), 'REGISTRATION_EMAIL', emailOtp);
      setIsEmailVerified(true);
      setSuccessNotice('Business email verified successfully!');
      setError(null);
      clearFieldError('email');
    } catch (err: any) {
      setError(err.message || 'Invalid email verification code.');
    }
  };

  const handleSendMobileOtp = async () => {
    const clean = phone.replace(/\D/g, '').slice(-10);
    if (clean.length !== 10) {
      setFieldErrors((prev) => ({ ...prev, phone: 'Please provide a valid 10-digit mobile number.' }));
      setError('Please provide a valid 10-digit mobile number.');
      return;
    }
    setError(null);
    clearFieldError('phone');
    try {
      const res = await vendorApi.sendOtp(clean, 'REGISTRATION_MOBILE');
      setIsMobileOtpSent(true);
      if (res.devOtpHint) {
        setMobileOtp(res.devOtpHint);
      }
      setSuccessNotice(`Verification code sent to +91 ${clean}`);
    } catch (err: any) {
      setError(err.message || 'Failed to send mobile verification code.');
    }
  };

  const handleVerifyMobileOtp = async () => {
    const clean = phone.replace(/\D/g, '').slice(-10);
    if (!mobileOtp || mobileOtp.length < 4) {
      setError('Please enter the 6-digit SMS OTP code.');
      return;
    }
    try {
      await vendorApi.verifyOtp(clean, 'REGISTRATION_MOBILE', mobileOtp);
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
    const errors: Record<string, string> = {};

    const nameCheck = validateName(ownerName);
    if (!nameCheck.isValid) {
      errors.ownerName = nameCheck.error || 'Authorized person name is required (letters only, min 2 chars).';
    }

    const emailCheck = validateEmail(email);
    if (!emailCheck.isValid) {
      errors.email = emailCheck.error || 'Please provide a valid business email address.';
    } else if (!isEmailVerified) {
      errors.email = 'Please verify your business email with the OTP code.';
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const phoneCheck = validateIndianMobile(phone);
    if (!phoneCheck.isValid) {
      errors.phone = phoneCheck.error || 'Please provide a valid 10-digit mobile number.';
    } else if (!isMobileVerified) {
      errors.phone = 'Please verify your mobile number with the SMS OTP.';
    }

    const passCheck = validatePassword(password);
    if (!passCheck.isValid) {
      errors.password = passCheck.error || 'Password must be min 8 chars with uppercase, lowercase, number, and special character.';
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
      const res = await vendorApi.registerStep1({
        ownerName: ownerName.trim(),
        email: email.trim(),
        phone: cleanPhone,
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
      // Clean step transition with NO previous-step message
      goToStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to register account credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Build normalized wizard payload
  const buildWizardPayload = (stepOverride?: number): VendorRegistrationWizardData => ({
    ownerName: ownerName.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.replace(/\D/g, '').slice(-10),
    isEmailVerified: true,
    isPhoneVerified: true,
    legalBusinessName: legalBusinessName.trim(),
    storeName: storeName.trim(),
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
    gstin: gstin.trim().toUpperCase(),
    pan: pan.trim().toUpperCase(),
    documents,
    bankDetails: {
      accountHolderName: accountHolderName.trim(),
      bankName: bankName.trim(),
      accountNumber: accountNumber.replace(/\D/g, ''),
      ifsc: ifsc.trim().toUpperCase(),
      accountType,
      chequeDocUrl: chequeDocName || undefined
    },
    termsAccepted,
    privacyAccepted,
    currentStep: stepOverride ?? currentStep
  });

  // Save draft & optionally navigate back to Review Page if editing from Review
  const saveDraftAndSyncStore = async (stepNum: number) => {
    const payload = buildWizardPayload(stepNum);
    try {
      const res = await vendorApi.saveRegistrationDraft(payload, stepNum, vendorId || undefined);
      if (res?.vendor) {
        const token = localStorage.getItem('buildora_vendor_token') || '';
        setSession(token, res.vendor, returnTo === 'review' ? '/registration/review' : '/register');
      }
    } catch {
      // Also update local store registrationData so review page always sees latest edits
      if (activeVendor) {
        const token = localStorage.getItem('buildora_vendor_token') || '';
        setSession(token, { ...activeVendor, registrationData: payload, logoUrl: payload.logoUrl, logoMetadata: payload.logoMetadata });
      }
    }
  };

  // ----------------------------------------------------
  // LOGO UPLOAD HANDLER (STEP 2)
  // ----------------------------------------------------
  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoError(null);
    const check = validateLogoFileMetadata(file.type, file.size, file.name);
    if (!check.isValid) {
      setLogoError(check.error || 'Invalid logo file.');
      e.target.value = '';
      return;
    }

    // Immediate local preview
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
    const errors: Record<string, string> = {};

    const legalCheck = validateBusinessName(legalBusinessName, 'Legal Entity Business Name');
    if (!legalCheck.isValid) {
      errors.legalBusinessName = legalCheck.error || 'Legal Entity Business Name is required (min 2 chars).';
    }

    const storeCheck = validateBusinessName(storeName, 'Store / Brand Trade Name');
    if (!storeCheck.isValid) {
      errors.storeName = storeCheck.error || 'Store / Brand Trade Name is required (min 2 chars).';
    }

    if (!businessType) {
      errors.businessType = 'Please select your Business Supplier Type.';
    }

    if (!businessRegistrationType) {
      errors.businessRegistrationType = 'Please select your Business Registration Constitution.';
    }

    const yearCheck = validateYearOfEstablishment(yearOfEstablishment);
    if (!yearCheck.isValid) {
      errors.yearOfEstablishment = yearCheck.error || 'Invalid year of establishment.';
    }

    const webCheck = validateWebsite(website);
    if (!webCheck.isValid) {
      errors.website = webCheck.error || 'Invalid website URL.';
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
    const errors: Record<string, string> = {};

    const pinCheck = validatePincode(pincode);
    if (!pinCheck.isValid) {
      errors.pincode = pinCheck.error || 'Please enter a valid 6-digit Indian Postal Pincode.';
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
      errors.completeAddress = addrCheck.error || 'Please enter your complete registered business address (min 5 chars).';
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
    const errors: Record<string, string> = {};

    const cleanGst = gstin.trim().toUpperCase();
    const cleanPan = pan.trim().toUpperCase();

    if (!cleanGst && !cleanPan) {
      errors.gstin = 'At least GSTIN or PAN is mandatory for B2B supplier verification.';
      errors.pan = 'At least GSTIN or PAN is mandatory for B2B supplier verification.';
    } else {
      if (cleanGst) {
        const gstCheck = validateGSTIN(cleanGst);
        if (!gstCheck.isValid) {
          errors.gstin = gstCheck.error || 'Invalid GSTIN format (15 characters, e.g. 29AABCB9876F1Z2).';
        }
      }
      if (cleanPan) {
        const panCheck = validatePAN(cleanPan);
        if (!panCheck.isValid) {
          errors.pan = panCheck.error || 'Invalid PAN format (10 characters, e.g. AABCB9876F).';
        }
      }
    }

    if (documents.length === 0) {
      errors.documents = 'Please upload at least one required KYC document (GST Certificate or PAN Card).';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Please provide valid tax identification and upload required verification documents.');
      return;
    }

    setFieldErrors({});
    if (returnTo === 'review') {
      await saveDraftAndSyncStore(5);
      navigate('/registration/review');
      return;
    }
    goToStep(5);
  };

  // ----------------------------------------------------
  // SAVE PROGRESS HANDLER
  // ----------------------------------------------------
  const handleSaveProgress = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await saveDraftAndSyncStore(currentStep);
      setSuccessNotice(`Registration progress saved successfully! You can resume from Step ${currentStep} at any time.`);
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
        pincode: pincode || '560001',
        isPrimary: warehouses.length === 0
      }
    ]);
  };

  const handleRemoveWarehouse = (id: string) => {
    setWarehouses(warehouses.filter((w) => w.id !== id));
  };

  // Document Upload Handler
  const handleFileUpload = (type: VendorKycDocument['type'], title: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be 5 MB or less.');
        return;
      }

      const doc: VendorKycDocument = {
        id: `doc-${Date.now()}`,
        type,
        title,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || 'application/pdf',
        fileUrl: `/secure/vault/documents/${file.name}`,
        uploadedAt: new Date().toISOString(),
        verificationStatus: 'PENDING'
      };

      setDocuments((prev) => [...prev.filter((d) => d.type !== type), doc]);
      clearFieldError('documents');
    };
    input.click();
  };

  // ----------------------------------------------------
  // STEP 5: VALIDATE BANK & COMPLIANCE -> NAVIGATE TO REVIEW PAGE
  // ----------------------------------------------------
  const handleProceedToReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const errors: Record<string, string> = {};

    const nameCheck = validateName(accountHolderName);
    if (!nameCheck.isValid) {
      errors.accountHolderName = nameCheck.error || 'Account Beneficiary Name is required (letters and spaces only).';
    }

    const bankCheck = validateBankName(bankName);
    if (!bankCheck.isValid) {
      errors.bankName = bankCheck.error || 'Bank Name is required.';
    }

    const cleanAcc = accountNumber.trim().replace(/\D/g, '');
    const accCheck = validateBankAccount(cleanAcc);
    if (!accCheck.isValid) {
      errors.accountNumber = accCheck.error || 'Bank account number must be between 9 and 18 digits.';
    }

    if (accountNumber !== confirmAccountNumber) {
      errors.confirmAccountNumber = 'Bank account numbers do not match.';
    }

    const cleanIfsc = ifsc.trim().toUpperCase();
    const ifscCheck = validateIFSC(cleanIfsc);
    if (!ifscCheck.isValid) {
      errors.ifsc = ifscCheck.error || 'Invalid IFSC format (11 characters, e.g. HDFC0000053).';
    }

    if (!termsAccepted) {
      errors.termsAccepted = 'You must accept the Supplier Terms of Partnership.';
    }

    if (!privacyAccepted) {
      errors.privacyAccepted = 'You must confirm the accuracy of submitted documents.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Please correct the highlighted fields before continuing to review.');
      return;
    }

    setFieldErrors({});
    setIsLoading(true);
    try {
      await saveDraftAndSyncStore(5);
      // Phase 3: Navigate to Final Registration Review Page (DO NOT auto-submit!)
      navigate('/registration/review');
    } catch (err: any) {
      setError(err.message || 'Failed to save step details. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-[#E2E8F0] space-y-7 animate-in fade-in-0 duration-200">
      {/* Header and Step Indicators */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-50 text-[#203D91] text-[11px] font-bold mb-1">
              Supplier Partner Onboarding
            </div>
            <h2 className="text-2xl font-black text-[#17233C] tracking-tight">
              Register as a Certified Vendor
            </h2>
          </div>
          <button
            type="button"
            onClick={handleSaveProgress}
            disabled={isLoading}
            className="text-xs font-bold text-[#FF7417] hover:underline self-start sm:self-center cursor-pointer"
          >
            💾 Save Progress & Continue Later
          </button>
        </div>

        {/* 5-Step Horizontal Progress Stepper */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
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
                className={`p-2 rounded-xl text-center border transition-all ${
                  isCurrent
                    ? 'bg-[#203D91] text-white border-[#203D91] shadow-sm'
                    : isCompleted
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-[#F4F7FC] text-slate-400 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-center mb-1">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <span className="text-xs font-black">0{item.step}</span>
                  )}
                </div>
                <div className="text-[10px] sm:text-xs font-bold truncate">
                  {item.title}
                </div>
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
        <form onSubmit={handleStep1Submit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#17233C] mb-1">
                Owner / Authorized Person Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => {
                    setOwnerName(e.target.value);
                    clearFieldError('ownerName');
                  }}
                  required
                  placeholder="e.g. Vikramaditya Rao"
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#203D91] ${
                    fieldErrors.ownerName ? 'border-rose-400 bg-rose-50/20' : 'border-[#E2E8F0]'
                  }`}
                />
              </div>
              {fieldErrors.ownerName && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.ownerName}</p>
              )}
            </div>

            {/* Email + OTP Verification */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-[#17233C]">
                Official Business Email Address *
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setIsEmailVerified(false);
                      setIsEmailOtpSent(false);
                      clearFieldError('email');
                    }}
                    required
                    disabled={isEmailVerified}
                    placeholder="partner@supplierdomain.com"
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#203D91] disabled:bg-slate-50 ${
                      fieldErrors.email ? 'border-rose-400 bg-rose-50/20' : 'border-[#E2E8F0]'
                    }`}
                  />
                </div>
                {!isEmailVerified && (
                  <button
                    type="button"
                    onClick={handleSendEmailOtp}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#FF7417] text-white hover:bg-[#e05e07] shrink-0 cursor-pointer"
                  >
                    {isEmailOtpSent ? 'Resend' : 'Send Code'}
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
                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-blue-900">Enter Email Code:</span>
                    <input
                      type="text"
                      maxLength={6}
                      value={emailOtp}
                      onChange={(e) => setEmailOtp(e.target.value)}
                      placeholder="6-digit"
                      className="w-24 px-2 py-1 text-xs font-mono rounded-lg border border-blue-300 bg-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleVerifyEmailOtp}
                    className="px-3 py-1 rounded-lg text-xs font-bold bg-[#203D91] text-white cursor-pointer"
                  >
                    Verify
                  </button>
                </div>
              )}
            </div>

            {/* Mobile + OTP Verification */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-[#17233C]">
                Mobile Number (For Dispatch & Dark Store SMS) *
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setIsMobileVerified(false);
                      setIsMobileOtpSent(false);
                      clearFieldError('phone');
                    }}
                    required
                    disabled={isMobileVerified}
                    placeholder="9845012345"
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#203D91] disabled:bg-slate-50 ${
                      fieldErrors.phone ? 'border-rose-400 bg-rose-50/20' : 'border-[#E2E8F0]'
                    }`}
                  />
                </div>
                {!isMobileVerified && (
                  <button
                    type="button"
                    onClick={handleSendMobileOtp}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#FF7417] text-white hover:bg-[#e05e07] shrink-0 cursor-pointer"
                  >
                    {isMobileOtpSent ? 'Resend' : 'Send OTP'}
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
                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-blue-900">Enter SMS OTP:</span>
                    <input
                      type="text"
                      maxLength={6}
                      value={mobileOtp}
                      onChange={(e) => setMobileOtp(e.target.value)}
                      placeholder="6-digit"
                      className="w-24 px-2 py-1 text-xs font-mono rounded-lg border border-blue-300 bg-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleVerifyMobileOtp}
                    className="px-3 py-1 rounded-lg text-xs font-bold bg-[#203D91] text-white cursor-pointer"
                  >
                    Verify
                  </button>
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-[#17233C] mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearFieldError('password');
                  }}
                  required
                  placeholder="Min 8 characters (letters & numbers)"
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#203D91] ${
                    fieldErrors.password ? 'border-rose-400 bg-rose-50/20' : 'border-[#E2E8F0]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.password}</p>
              )}
              {password && (
                <div className="mt-2 space-y-1.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  {(() => {
                    const str = validatePassword(password);
                    return (
                      <>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-600">Password Strength:</span>
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
                        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-slate-500 mt-1">
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
              <label className="block text-xs font-bold text-[#17233C] mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    clearFieldError('confirmPassword');
                  }}
                  required
                  placeholder="Repeat password"
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#203D91] ${
                    fieldErrors.confirmPassword ? 'border-rose-400 bg-rose-50/20' : 'border-[#E2E8F0]'
                  }`}
                />
              </div>
              {fieldErrors.confirmPassword && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.confirmPassword}</p>
              )}
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <Link to="/login" className="text-xs font-bold text-slate-500 hover:underline">
              Already have an account? Sign In
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="py-3 px-6 rounded-xl text-sm font-bold bg-[#203D91] text-white hover:bg-[#162b66] transition-all shadow-md shadow-[#203D91]/20 flex items-center gap-2 cursor-pointer"
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
              <label className="block text-xs font-bold text-[#17233C] mb-1">
                Legal Entity Business Name *
              </label>
              <input
                type="text"
                value={legalBusinessName}
                onChange={(e) => {
                  setLegalBusinessName(e.target.value);
                  clearFieldError('legalBusinessName');
                }}
                required
                placeholder="e.g. Supreme Materials Private Limited"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#203D91] ${
                  fieldErrors.legalBusinessName ? 'border-rose-400 bg-rose-50/20' : 'border-[#E2E8F0]'
                }`}
              />
              {fieldErrors.legalBusinessName && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.legalBusinessName}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17233C] mb-1">
                Store / Brand Trade Name *
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => {
                  setStoreName(e.target.value);
                  clearFieldError('storeName');
                }}
                required
                placeholder="e.g. Supreme Materials BLR"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#203D91] ${
                  fieldErrors.storeName ? 'border-rose-400 bg-rose-50/20' : 'border-[#E2E8F0]'
                }`}
              />
              {fieldErrors.storeName && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.storeName}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17233C] mb-1">
                Business Supplier Type *
              </label>
              <select
                value={businessType}
                onChange={(e) => {
                  setBusinessType(e.target.value);
                  clearFieldError('businessType');
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#203D91] ${
                  fieldErrors.businessType ? 'border-rose-400 bg-rose-50/20' : 'border-[#E2E8F0]'
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
              <label className="block text-xs font-bold text-[#17233C] mb-1">
                Business Registration Constitution *
              </label>
              <select
                value={businessRegistrationType}
                onChange={(e) => {
                  setBusinessRegistrationType(e.target.value);
                  clearFieldError('businessRegistrationType');
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#203D91] ${
                  fieldErrors.businessRegistrationType ? 'border-rose-400 bg-rose-50/20' : 'border-[#E2E8F0]'
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
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.businessRegistrationType}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17233C] mb-1">
                Year of Establishment (Optional)
              </label>
              <input
                type="text"
                value={yearOfEstablishment}
                onChange={(e) => setYearOfEstablishment(e.target.value)}
                placeholder="e.g. 2018"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#203D91]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17233C] mb-1">
                Website URL (Optional)
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://company.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#203D91]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#17233C] mb-1">
                Business & Inventory Capabilities Description (Optional)
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your manufacturing, storage capacities, inventory lines, and Bengaluru distribution readiness..."
                className="w-full px-3.5 py-2 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#203D91]"
              />
            </div>
          </div>

          {/* Upload Your Business Logo (Phase 2) */}
          <div className="p-4 rounded-2xl bg-[#F4F7FC] border border-[#E2E8F0] space-y-3">
            <div>
              <h4 className="text-xs font-bold text-[#17233C] flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-[#203D91]" />
                Upload Your Business Logo
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                JPG, JPEG, PNG or WEBP • Maximum 5 MB. Appears on your store profile & review summary.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-2xs relative">
                {isUploadingLogo ? (
                  <Loader2 className="w-6 h-6 text-[#203D91] animate-spin" />
                ) : logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Business Logo Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                    <Building2 className="w-6 h-6 text-[#203D91]/50 mb-0.5" />
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      {storeName ? storeName.slice(0, 2).toUpperCase() : 'LOGO'}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#203D91] text-white hover:bg-[#162b66] transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs">
                    <UploadCloud className="w-3.5 h-3.5 text-[#FF7417]" />
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

                {logoError && (
                  <p className="text-[11px] text-rose-600 font-medium">{logoError}</p>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={() => goToStep(1)}
              className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Account
            </button>
            <button
              type="button"
              onClick={handleStep2Next}
              className="py-3 px-6 rounded-xl text-sm font-bold bg-[#203D91] text-white hover:bg-[#162b66] transition-all shadow-md shadow-[#203D91]/20 flex items-center gap-2 cursor-pointer"
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
            {/* 1. PINCODE (First Field - Required) */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-[#17233C]">
                  1. Pincode (Postal Code) *
                </label>
                <button
                  type="button"
                  onClick={() => setIsManualAddress(!isManualAddress)}
                  className="text-[11px] font-semibold text-[#203D91] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  {isManualAddress ? 'Switch to Auto Lookup' : 'Cannot find your pincode? Enter location manually'}
                </button>
              </div>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => {
                    const cleanVal = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setPincode(cleanVal);
                    clearFieldError('pincode');
                  }}
                  required
                  placeholder="Enter 6-digit Indian Pincode (e.g. 560072, 110001, 400001)"
                  className={`w-full pl-10 pr-12 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#203D91] font-mono ${
                    fieldErrors.pincode || pincodeLookupError ? 'border-rose-400 bg-rose-50/20' : 'border-[#E2E8F0]'
                  }`}
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {isPincodeLoading && (
                    <Loader2 className="w-4 h-4 text-[#203D91] animate-spin" />
                  )}
                  {!isPincodeLoading && pincodeLookupSuccess && (
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
                <div className="mt-1.5 p-2.5 bg-rose-50 rounded-xl border border-rose-200 flex items-center justify-between text-[11px] text-rose-700">
                  <span>{pincodeLookupError}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => performPincodeLookup(pincode)}
                      className="font-bold underline text-rose-800 hover:text-rose-900 cursor-pointer"
                    >
                      Retry
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsManualAddress(true);
                        setPincodeLookupError(null);
                      }}
                      className="font-bold underline text-[#203D91] cursor-pointer"
                    >
                      Enter Manually
                    </button>
                  </div>
                </div>
              )}
              {!pincodeLookupError && !fieldErrors.pincode && (
                <p className="text-[11px] text-slate-500 mt-1">
                  Enter 6 digits to automatically populate Country, State, City and Localities.
                </p>
              )}
            </div>

            {/* If multiple localities exist: Sub-locality / Area Dropdown */}
            {availableLocalities.length > 1 && (
              <div className="md:col-span-2 p-3 bg-blue-50/60 rounded-xl border border-blue-200">
                <label className="block text-xs font-bold text-[#17233C] mb-1">
                  Select Area / Locality (Post Office) *
                </label>
                <select
                  value={selectedLocality}
                  onChange={(e) => {
                    setSelectedLocality(e.target.value);
                    setArea(e.target.value);
                  }}
                  className="w-full px-3.5 py-2 rounded-lg border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#203D91] bg-white font-medium text-[#17233C]"
                >
                  {availableLocalities.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-blue-700 mt-1">
                  Multiple delivery postal circles found for pincode {pincode}. Please pick your exact trade locality.
                </p>
              </div>
            )}

            {/* 2. Country (Auto-filled) */}
            <div>
              <label className="block text-xs font-bold text-[#17233C] mb-1">
                2. Country (Auto-filled)
              </label>
              <input
                type="text"
                value="India"
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500 cursor-not-allowed font-medium"
              />
            </div>

            {/* 3. State (Auto-filled) */}
            <div>
              <label className="block text-xs font-bold text-[#17233C] mb-1">
                3. State {isManualAddress ? '*' : '(Auto-filled)'}
              </label>
              <input
                type="text"
                value={state}
                readOnly={!isManualAddress}
                disabled={!isManualAddress && !state}
                onChange={(e) => {
                  setState(e.target.value);
                  clearFieldError('state');
                }}
                required
                placeholder={isManualAddress ? 'Enter state (e.g. Karnataka)' : 'Auto-populated from Pincode'}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#203D91] ${
                  !isManualAddress
                    ? 'bg-slate-50 text-slate-700 cursor-not-allowed border-slate-200'
                    : 'bg-white border-[#E2E8F0]'
                } ${fieldErrors.state ? 'border-rose-400 bg-rose-50/20' : ''}`}
              />
              {fieldErrors.state && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.state}</p>
              )}
            </div>

            {/* 4. City / Region (Auto-filled) */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#17233C] mb-1">
                4. City / Region {isManualAddress ? '*' : '(Auto-filled)'}
              </label>
              <input
                type="text"
                value={city}
                readOnly={!isManualAddress}
                disabled={!isManualAddress && !city}
                onChange={(e) => {
                  setCity(e.target.value);
                  clearFieldError('city');
                }}
                required
                placeholder={isManualAddress ? 'Enter city (e.g. Bengaluru)' : 'Auto-populated from Pincode'}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#203D91] ${
                  !isManualAddress
                    ? 'bg-slate-50 text-slate-700 cursor-not-allowed border-slate-200'
                    : 'bg-white border-[#E2E8F0]'
                } ${fieldErrors.city ? 'border-rose-400 bg-rose-50/20' : ''}`}
              />
              {fieldErrors.city && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.city}</p>
              )}
            </div>

            {/* 5. Complete Registered Business Address (Required) */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#17233C] mb-1">
                5. Complete Registered Business Address *
              </label>
              <textarea
                rows={3}
                value={completeAddress}
                onChange={(e) => {
                  setCompleteAddress(e.target.value);
                  clearFieldError('completeAddress');
                }}
                required
                placeholder="Building number / shed, Street name, Industrial layout or Commercial estate, Landmark..."
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#203D91] ${
                  fieldErrors.completeAddress ? 'border-rose-400 bg-rose-50/20' : 'border-[#E2E8F0]'
                }`}
              />
              {fieldErrors.completeAddress && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.completeAddress}</p>
              )}
              <p className="text-[11px] text-slate-500 mt-1">
                Must match the official registered address on your GST REG-06 or Company PAN card.
              </p>
            </div>
          </div>

          {/* Dispatch Hubs / Warehouses */}
          <div className="p-4 bg-[#F4F7FC] rounded-2xl border border-[#E2E8F0] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-[#17233C]">Dispatch Warehouses & Dark Store Hubs</h4>
                <p className="text-[11px] text-slate-500">
                  Locations from where BUILDORA 60 mini-trucks pick up orders for 60-min delivery.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddWarehouse}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-[#203D91] border border-blue-200 hover:bg-blue-50 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Warehouse
              </button>
            </div>

            {warehouses.length > 0 ? (
              <div className="space-y-2">
                {warehouses.map((wh) => (
                  <div
                    key={wh.id}
                    className="p-3 bg-white rounded-xl border border-[#E2E8F0] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <Building2 className="w-4 h-4 text-[#203D91]" />
                      <div>
                        <span className="font-bold text-[#17233C]">{wh.name}</span>
                        <p className="text-[11px] text-slate-500">{wh.address}, Pincode: {wh.pincode}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveWarehouse(wh.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-white rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-500">
                Primary business address will be used as default dispatch hub. Click "+ Add Warehouse" to add additional depots.
              </div>
            )}
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={() => goToStep(2)}
              className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Business
            </button>
            <button
              type="button"
              onClick={handleStep3Next}
              className="py-3 px-6 rounded-xl text-sm font-bold bg-[#203D91] text-white hover:bg-[#162b66] transition-all shadow-md shadow-[#203D91]/20 flex items-center gap-2 cursor-pointer"
            >
              Next: KYC & Tax Documents
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* STEP 4: KYC & TAX DOCUMENTS                          */}
      {/* ==================================================== */}
      {currentStep === 4 && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#17233C] mb-1">
                GSTIN (15 Characters) *
              </label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => {
                  setGstin(e.target.value.toUpperCase());
                  clearFieldError('gstin');
                }}
                required
                placeholder="e.g. 29AABCB9876F1Z2"
                className={`w-full px-3.5 py-2.5 rounded-xl border font-mono text-sm tracking-wide focus:outline-none focus:ring-2 focus:ring-[#203D91] ${
                  fieldErrors.gstin ? 'border-rose-400 bg-rose-50/20' : 'border-[#E2E8F0]'
                }`}
              />
              {fieldErrors.gstin && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.gstin}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17233C] mb-1">
                Company / Proprietor PAN *
              </label>
              <input
                type="text"
                maxLength={10}
                value={pan}
                onChange={(e) => {
                  setPan(e.target.value.toUpperCase());
                  clearFieldError('pan');
                }}
                required
                placeholder="e.g. AABCB9876F"
                className={`w-full px-3.5 py-2.5 rounded-xl border font-mono text-sm tracking-wide focus:outline-none focus:ring-2 focus:ring-[#203D91] ${
                  fieldErrors.pan ? 'border-rose-400 bg-rose-50/20' : 'border-[#E2E8F0]'
                }`}
              />
              {fieldErrors.pan && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.pan}</p>
              )}
            </div>
          </div>

          {/* Secure Document Vault Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#17233C]">
                Verification Documents (Max 5 MB each) *
              </h4>
              {fieldErrors.documents && (
                <span className="text-[11px] text-rose-600 font-medium">{fieldErrors.documents}</span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { type: 'GST_CERTIFICATE' as const, title: 'GST Registration Certificate (REG-06)' },
                { type: 'PAN_CARD' as const, title: 'PAN Card Document' },
                { type: 'BUSINESS_REGISTRATION' as const, title: 'Trade License / Incorporation Certificate' },
                { type: 'AUTHORIZED_ID' as const, title: 'Authorized Signatory Govt ID (Aadhaar / Passport)' }
              ].map((docType) => {
                const uploaded = documents.find((d) => d.type === docType.type);
                return (
                  <div
                    key={docType.type}
                    className="p-3.5 rounded-2xl border border-[#E2E8F0] bg-white hover:border-blue-300 transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-[#17233C]">{docType.title}</span>
                        <p className="text-[11px] text-slate-500">PDF, JPG, or PNG</p>
                      </div>
                      {uploaded ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Pending Review
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                          Required
                        </span>
                      )}
                    </div>

                    {uploaded ? (
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 truncate">
                          <FileText className="w-3.5 h-3.5 text-[#203D91]" />
                          <span className="truncate font-medium">{uploaded.fileName}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDocuments(documents.filter((d) => d.id !== uploaded.id))}
                          className="text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleFileUpload(docType.type, docType.title)}
                        className="w-full py-2 px-3 rounded-xl border border-dashed border-[#203D91]/40 text-[#203D91] text-xs font-bold bg-blue-50/50 hover:bg-blue-50 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <UploadCloud className="w-3.5 h-3.5 text-[#FF7417]" />
                        Upload Document
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={() => goToStep(3)}
              className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Address
            </button>
            <button
              type="button"
              onClick={handleStep4Next}
              className="py-3 px-6 rounded-xl text-sm font-bold bg-[#203D91] text-white hover:bg-[#162b66] transition-all shadow-md shadow-[#203D91]/20 flex items-center gap-2 cursor-pointer"
            >
              Next: Bank & Product Details
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* STEP 5: BANK & COMPLIANCE INFORMATION                */}
      {/* ==================================================== */}
      {currentStep === 5 && (
        <form onSubmit={handleProceedToReview} className="space-y-6">
          {/* Bank Settlement Section */}
          <div className="p-4 bg-[#F4F7FC] rounded-2xl border border-[#E2E8F0] space-y-3">
            <h4 className="text-xs font-bold text-[#17233C] flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-[#203D91]" />
              Settlement Bank Account Details (7-Day Direct Payouts)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#17233C] mb-1">
                  Account Beneficiary Name *
                </label>
                <input
                  type="text"
                  value={accountHolderName}
                  onChange={(e) => {
                    setAccountHolderName(e.target.value);
                    clearFieldError('accountHolderName');
                  }}
                  required
                  placeholder="As per bank passbook / statement"
                  className={`w-full px-3.5 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-[#203D91] ${
                    fieldErrors.accountHolderName ? 'border-rose-400 bg-rose-50/20' : 'border-white bg-white'
                  }`}
                />
                {fieldErrors.accountHolderName && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.accountHolderName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17233C] mb-1">Bank Name *</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => {
                    setBankName(e.target.value);
                    clearFieldError('bankName');
                  }}
                  required
                  placeholder="e.g. HDFC Bank, ICICI Bank, SBI"
                  className={`w-full px-3.5 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-[#203D91] ${
                    fieldErrors.bankName ? 'border-rose-400 bg-rose-50/20' : 'border-white bg-white'
                  }`}
                />
                {fieldErrors.bankName && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.bankName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17233C] mb-1">
                  Bank Account Number *
                </label>
                <input
                  type="password"
                  value={accountNumber}
                  onChange={(e) => {
                    setAccountNumber(e.target.value);
                    clearFieldError('accountNumber');
                  }}
                  required
                  placeholder="Account number (9-18 digits)"
                  className={`w-full px-3.5 py-2 rounded-xl border font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#203D91] ${
                    fieldErrors.accountNumber ? 'border-rose-400 bg-rose-50/20' : 'border-white bg-white'
                  }`}
                />
                {fieldErrors.accountNumber && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.accountNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17233C] mb-1">
                  Confirm Account Number *
                </label>
                <input
                  type="text"
                  value={confirmAccountNumber}
                  onChange={(e) => {
                    setConfirmAccountNumber(e.target.value);
                    clearFieldError('confirmAccountNumber');
                  }}
                  required
                  placeholder="Re-enter account number"
                  className={`w-full px-3.5 py-2 rounded-xl border font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#203D91] ${
                    fieldErrors.confirmAccountNumber ? 'border-rose-400 bg-rose-50/20' : 'border-white bg-white'
                  }`}
                />
                {fieldErrors.confirmAccountNumber && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.confirmAccountNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17233C] mb-1">IFSC Code *</label>
                <input
                  type="text"
                  value={ifsc}
                  onChange={(e) => {
                    setIfsc(e.target.value.toUpperCase());
                    clearFieldError('ifsc');
                  }}
                  required
                  placeholder="e.g. HDFC0000053"
                  className={`w-full px-3.5 py-2 rounded-xl border font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#203D91] ${
                    fieldErrors.ifsc ? 'border-rose-400 bg-rose-50/20' : 'border-white bg-white'
                  }`}
                />
                {fieldErrors.ifsc && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.ifsc}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17233C] mb-1">Account Type</label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl border border-white bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#203D91]"
                >
                  <option value="CURRENT">Current Account (Recommended for B2B)</option>
                  <option value="SAVINGS">Savings Account</option>
                </select>
              </div>
            </div>
          </div>

          {/* Terms & Conditions Acceptance */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => {
                  setTermsAccepted(e.target.checked);
                  clearFieldError('termsAccepted');
                }}
                className="w-4 h-4 mt-0.5 rounded text-[#203D91] focus:ring-[#203D91]"
              />
              <span className="text-slate-700">
                I agree to the <strong>BUILDORA 60 Supplier Terms of Partnership</strong>, 60-minute dispatch SLAs, and batch compressive testing standards. *
              </span>
            </label>
            {fieldErrors.termsAccepted && (
              <p className="text-[11px] text-rose-600 pl-6 font-medium">{fieldErrors.termsAccepted}</p>
            )}

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={privacyAccepted}
                onChange={(e) => {
                  setPrivacyAccepted(e.target.checked);
                  clearFieldError('privacyAccepted');
                }}
                className="w-4 h-4 mt-0.5 rounded text-[#203D91] focus:ring-[#203D91]"
              />
              <span className="text-slate-700">
                I confirm that all uploaded documents, GST credentials, and bank settlement details belong to the authorized entity. *
              </span>
            </label>
            {fieldErrors.privacyAccepted && (
              <p className="text-[11px] text-rose-600 pl-6 font-medium">{fieldErrors.privacyAccepted}</p>
            )}
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={() => goToStep(4)}
              className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Documents
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="py-3 px-8 rounded-xl text-sm font-bold bg-[#203D91] text-white hover:bg-[#162b66] transition-all shadow-md shadow-[#203D91]/20 flex items-center gap-2 cursor-pointer disabled:opacity-60"
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
      )}
    </div>
  );
};

export default VendorRegisterPage;
