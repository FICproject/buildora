import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useVendorAuthStore } from '../../store/useVendorAuthStore';
import { vendorApi } from '../../services/vendorApi';
import { MASTER_CATEGORIES } from '@buildora/constants';
import {
  VendorKycDocument,
  VendorWarehouse,
  VendorRegistrationWizardData
} from '@buildora/types';
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Building2,
  Store,
  MapPin,
  FileText,
  CreditCard,
  Package,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  UploadCloud,
  Trash2,
  Plus,
  ShieldCheck,
  Clock,
  Sparkles,
  KeyRound
} from 'lucide-react';

export const VendorRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { setSession } = useVendorAuthStore();

  // Wizard Step: 1 to 5
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [vendorId, setVendorId] = useState<string | null>(null);

  // Loading & Alert states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // ----------------------------------------------------
  // STEP 1: ACCOUNT INFORMATION
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
  const [emailDevHint, setEmailDevHint] = useState<string | null>(null);

  // Mobile verification state
  const [mobileOtp, setMobileOtp] = useState('');
  const [isMobileOtpSent, setIsMobileOtpSent] = useState(false);
  const [isMobileVerified, setIsMobileVerified] = useState(false);
  const [mobileDevHint, setMobileDevHint] = useState<string | null>(null);

  // ----------------------------------------------------
  // STEP 2: BUSINESS INFORMATION
  // ----------------------------------------------------
  const [legalBusinessName, setLegalBusinessName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [businessType, setBusinessType] = useState<VendorRegistrationWizardData['businessType']>('DISTRIBUTOR');
  const [businessRegistrationType, setBusinessRegistrationType] = useState('PRIVATE_LIMITED');
  const [yearOfEstablishment, setYearOfEstablishment] = useState('2018');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');

  // ----------------------------------------------------
  // STEP 3: BUSINESS ADDRESS & WAREHOUSES
  // ----------------------------------------------------
  const [country] = useState('India');
  const [state, setState] = useState('Karnataka');
  const [district, setDistrict] = useState('Bengaluru Urban');
  const [city, setCity] = useState('Bengaluru');
  const [area, setArea] = useState('Peenya Industrial Area');
  const [pincode, setPincode] = useState('560058');
  const [completeAddress, setCompleteAddress] = useState('Shed 14, 4th Phase, 2nd Cross Road, Peenya Industrial Area');
  const [sameDispatchAddress, setSameDispatchAddress] = useState(true);
  const [dispatchAddress, setDispatchAddress] = useState('');
  const [warehouses, setWarehouses] = useState<VendorWarehouse[]>([
    {
      id: 'wh-1',
      name: 'Peenya Central Warehouse',
      address: 'Plot 88, Peenya 2nd Stage',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560058',
      isPrimary: true
    }
  ]);

  // ----------------------------------------------------
  // STEP 4: KYC & TAX DOCUMENTS
  // ----------------------------------------------------
  const [gstin, setGstin] = useState('29AABCB9876F1Z2');
  const [pan, setPan] = useState('AABCB9876F');
  const [documents, setDocuments] = useState<VendorKycDocument[]>([
    {
      id: 'doc-gst',
      type: 'GST_CERTIFICATE',
      title: 'GST Registration Certificate (Form GST REG-06)',
      fileName: 'GST_REG06_Certificate.pdf',
      fileSize: 1250000,
      mimeType: 'application/pdf',
      fileUrl: '/secure/vault/gst.pdf',
      uploadedAt: new Date().toISOString(),
      verificationStatus: 'PENDING'
    },
    {
      id: 'doc-pan',
      type: 'PAN_CARD',
      title: 'Company PAN Card Document',
      fileName: 'Company_PAN_AABCB9876F.pdf',
      fileSize: 620000,
      mimeType: 'application/pdf',
      fileUrl: '/secure/vault/pan.pdf',
      uploadedAt: new Date().toISOString(),
      verificationStatus: 'PENDING'
    }
  ]);

  // ----------------------------------------------------
  // STEP 5: BANK & PRODUCT INFORMATION
  // ----------------------------------------------------
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('HDFC Bank');
  const [accountNumber, setAccountNumber] = useState('50200049182341');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('50200049182341');
  const [ifsc, setIfsc] = useState('HDFC0000053');
  const [accountType, setAccountType] = useState<'CURRENT' | 'SAVINGS'>('CURRENT');
  const [chequeDocName, setChequeDocName] = useState<string | null>('Cancelled_Cheque_HDFC.pdf');

  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'cement-concrete',
    'plumbing-sanitary-bath',
    'electrical-lighting'
  ]);
  const [brandsSupplied, setBrandsSupplied] = useState<string[]>(['UltraTech', 'Astral', 'Havells']);
  const [brandInput, setBrandInput] = useState('');
  const [operatingLocations, setOperatingLocations] = useState<string[]>([
    'Peenya Industrial Hub',
    'Whitefield & East BLR',
    'Indiranagar & Central',
    'Electronic City & South BLR'
  ]);
  const [catalogueName, setCatalogueName] = useState<string | null>(null);

  const [termsAccepted, setTermsAccepted] = useState(true);
  const [privacyAccepted, setPrivacyAccepted] = useState(true);

  // ----------------------------------------------------
  // STEP 1 HANDLERS
  // ----------------------------------------------------
  const handleSendEmailOtp = async () => {
    if (!email || !email.includes('@')) {
      setError('Please provide a valid business email.');
      return;
    }
    setError(null);
    try {
      const res = await vendorApi.sendOtp(email.trim(), 'REGISTRATION_EMAIL');
      setIsEmailOtpSent(true);
      if (res.devOtpHint) {
        setEmailDevHint(res.devOtpHint);
        setEmailOtp(res.devOtpHint);
      }
      setSuccessNotice(`Verification code sent to ${email}`);
    } catch (err: any) {
      setError(err.message || 'Failed to send email verification code.');
    }
  };

  const handleVerifyEmailOtp = async () => {
    try {
      await vendorApi.verifyOtp(email.trim(), 'REGISTRATION_EMAIL', emailOtp);
      setIsEmailVerified(true);
      setSuccessNotice('Business email verified successfully!');
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Invalid email verification code.');
    }
  };

  const handleSendMobileOtp = async () => {
    const clean = phone.replace(/\D/g, '').slice(-10);
    if (clean.length !== 10) {
      setError('Please provide a valid 10-digit mobile number.');
      return;
    }
    setError(null);
    try {
      const res = await vendorApi.sendOtp(clean, 'REGISTRATION_MOBILE');
      setIsMobileOtpSent(true);
      if (res.devOtpHint) {
        setMobileDevHint(res.devOtpHint);
        setMobileOtp(res.devOtpHint);
      }
      setSuccessNotice(`Verification code sent to +91 ${clean}`);
    } catch (err: any) {
      setError(err.message || 'Failed to send mobile verification code.');
    }
  };

  const handleVerifyMobileOtp = async () => {
    const clean = phone.replace(/\D/g, '').slice(-10);
    try {
      await vendorApi.verifyOtp(clean, 'REGISTRATION_MOBILE', mobileOtp);
      setIsMobileVerified(true);
      setSuccessNotice('Mobile number verified successfully!');
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Invalid mobile verification code.');
    }
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!ownerName || !email || !phone || !password) {
      setError('Please complete all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long and contain letters and numbers.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await vendorApi.registerStep1({
        ownerName,
        email,
        phone,
        password,
        confirmPassword
      });

      setVendorId(res.vendorId);
      if (res.vendor) {
        setSession(res.token, res.vendor, '/register');
        if (!storeName) setStoreName(`${ownerName} Materials Depot`);
        if (!accountHolderName) setAccountHolderName(ownerName);
      }
      setCurrentStep(2);
      setSuccessNotice('Step 1 complete! Please provide your Business Information.');
    } catch (err: any) {
      setError(err.message || 'Failed to register account credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // ----------------------------------------------------
  // STEP 2 & 3 & 4 SAVE DRAFT / NEXT HANDLERS
  // ----------------------------------------------------
  const handleSaveProgress = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await vendorApi.saveRegistrationDraft(
        {
          ownerName,
          email,
          phone,
          legalBusinessName,
          storeName,
          businessType,
          description,
          completeAddress,
          city,
          state,
          pincode,
          gstin,
          pan,
          documents,
          bankDetails: {
            accountHolderName,
            bankName,
            accountNumber,
            ifsc,
            accountType,
            chequeDocUrl: chequeDocName || undefined
          },
          productCategories: selectedCategories,
          brandsSupplied,
          operatingLocations,
          termsAccepted,
          privacyAccepted,
          currentStep
        },
        currentStep,
        vendorId || undefined
      );
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
        address: 'Industrial Suburb, Outer Ring Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560010',
        isPrimary: false
      }
    ]);
  };

  const handleRemoveWarehouse = (id: string) => {
    setWarehouses(warehouses.filter((w) => w.id !== id));
  };

  // Add Brand Tag
  const handleAddBrand = () => {
    if (brandInput.trim() && !brandsSupplied.includes(brandInput.trim())) {
      setBrandsSupplied([...brandsSupplied, brandInput.trim()]);
      setBrandInput('');
    }
  };

  const handleRemoveBrand = (br: string) => {
    setBrandsSupplied(brandsSupplied.filter((b) => b !== br));
  };

  // Document Upload Mock / Secure Handler
  const handleFileUpload = (type: VendorKycDocument['type'], title: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be 5 MB or less.');
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
    };
    input.click();
  };

  // ----------------------------------------------------
  // STEP 5: FINAL REGISTRATION SUBMISSION
  // ----------------------------------------------------
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (accountNumber !== confirmAccountNumber) {
      setError('Bank account numbers do not match.');
      return;
    }

    if (!termsAccepted || !privacyAccepted) {
      setError('Please accept the Buildora Supplier Terms and Privacy Policy.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await vendorApi.submitRegistration(
        {
          ownerName,
          email,
          phone,
          isEmailVerified: true,
          isPhoneVerified: true,
          legalBusinessName: legalBusinessName || storeName,
          storeName: storeName || `${ownerName} Depot`,
          businessType,
          businessRegistrationType,
          yearOfEstablishment,
          website,
          description,
          country,
          state,
          district,
          city,
          area,
          pincode,
          completeAddress,
          dispatchAddress: sameDispatchAddress ? completeAddress : dispatchAddress,
          warehouses,
          gstin,
          pan,
          documents,
          bankDetails: {
            accountHolderName: accountHolderName || legalBusinessName,
            bankName,
            accountNumber,
            ifsc,
            accountType,
            chequeDocUrl: chequeDocName || undefined
          },
          productCategories: selectedCategories,
          brandsSupplied,
          operatingLocations,
          termsAccepted,
          privacyAccepted,
          currentStep: 5
        },
        vendorId || undefined
      );

      // Redirect to Application Status Page
      navigate('/application-status');
    } catch (err: any) {
      setError(err.message || 'Failed to submit registration application.');
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
            { step: 5, title: 'Bank & Catalog', icon: CreditCard }
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
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-shake">
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
                  onChange={(e) => setOwnerName(e.target.value)}
                  required
                  placeholder="e.g. Vikramaditya Rao"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#203D91]"
                />
              </div>
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
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isEmailVerified}
                    placeholder="partner@supplierdomain.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#203D91] disabled:bg-slate-50"
                  />
                </div>
                {!isEmailVerified && (
                  <button
                    type="button"
                    onClick={handleSendEmailOtp}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#FF7417] text-white hover:bg-[#e05e07] shrink-0"
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
                    className="px-3 py-1 rounded-lg text-xs font-bold bg-[#203D91] text-white"
                  >
                    Verify
                  </button>
                </div>
              )}
            </div>

            {/* Mobile + OTP Verification */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-[#17233C]">
                Mobile Number (For Dispatch & Dark Store Dispatch SMS) *
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    disabled={isMobileVerified}
                    placeholder="9845012345"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#203D91] disabled:bg-slate-50"
                  />
                </div>
                {!isMobileVerified && (
                  <button
                    type="button"
                    onClick={handleSendMobileOtp}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#FF7417] text-white hover:bg-[#e05e07] shrink-0"
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
                    className="px-3 py-1 rounded-lg text-xs font-bold bg-[#203D91] text-white"
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
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Min 8 characters"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#203D91]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
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
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Repeat password"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#203D91]"
                />
              </div>
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
                onChange={(e) => setLegalBusinessName(e.target.value)}
                required
                placeholder="e.g. Supreme Materials Private Limited"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#203D91]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17233C] mb-1">
                Store / Brand Trade Name *
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                required
                placeholder="e.g. Supreme Materials BLR"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#203D91]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17233C] mb-1">
                Business Supplier Type *
              </label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#203D91]"
              >
                <option value="MANUFACTURER">Manufacturer (Direct-from-mill)</option>
                <option value="DISTRIBUTOR">Authorized Distributor</option>
                <option value="WHOLESALER">Master Wholesaler</option>
                <option value="DEALER">Stockist / Dealer</option>
                <option value="RETAILER">Specialty Retailer</option>
                <option value="OTHER">Other Enterprise Supplier</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17233C] mb-1">
                Business Registration Constitution *
              </label>
              <select
                value={businessRegistrationType}
                onChange={(e) => setBusinessRegistrationType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#203D91]"
              >
                <option value="PRIVATE_LIMITED">Private Limited Company (Pvt Ltd)</option>
                <option value="PUBLIC_LIMITED">Public Limited Company</option>
                <option value="LLP">Limited Liability Partnership (LLP)</option>
                <option value="PARTNERSHIP">Partnership Firm</option>
                <option value="PROPRIETORSHIP">Sole Proprietorship</option>
                <option value="OTHER">Other Registered Entity</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17233C] mb-1">
                Year of Establishment
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
                Business & Inventory Capabilities Description
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

          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Account
            </button>
            <button
              type="button"
              onClick={() => {
                if (!legalBusinessName || !storeName) {
                  setError('Please provide Legal Entity Name and Store Name.');
                  return;
                }
                setError(null);
                setCurrentStep(3);
              }}
              className="py-3 px-6 rounded-xl text-sm font-bold bg-[#203D91] text-white hover:bg-[#162b66] transition-all shadow-md shadow-[#203D91]/20 flex items-center gap-2 cursor-pointer"
            >
              Next: Address & Hubs
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
            <div>
              <label className="block text-xs font-bold text-[#17233C] mb-1">Country</label>
              <input
                type="text"
                value="India"
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17233C] mb-1">State *</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#203D91]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17233C] mb-1">City / Region *</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#203D91]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17233C] mb-1">Pincode *</label>
              <input
                type="text"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#203D91]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#17233C] mb-1">
                Complete Registered Business Address *
              </label>
              <input
                type="text"
                value={completeAddress}
                onChange={(e) => setCompleteAddress(e.target.value)}
                required
                placeholder="Building name, Street, Industrial Layout, Landmark..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#203D91]"
              />
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

            <div className="space-y-2">
              {warehouses.map((wh, idx) => (
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
                  {warehouses.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveWarehouse(wh.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Business
            </button>
            <button
              type="button"
              onClick={() => {
                if (!completeAddress || !pincode) {
                  setError('Please fill in complete registered address and pincode.');
                  return;
                }
                setError(null);
                setCurrentStep(4);
              }}
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
                GSTIN (Karnataka Code 29) *
              </label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                required
                placeholder="29AABCB9876F1Z2"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] font-mono text-sm tracking-wide focus:outline-none focus:ring-2 focus:ring-[#203D91]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17233C] mb-1">
                Company / Proprietor PAN *
              </label>
              <input
                type="text"
                maxLength={10}
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase())}
                required
                placeholder="AABCB9876F"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] font-mono text-sm tracking-wide focus:outline-none focus:ring-2 focus:ring-[#203D91]"
              />
            </div>
          </div>

          {/* Secure Document Vault Cards */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#17233C]">Required Verification Documents (Max 5 MB each)</h4>

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
                          className="text-slate-400 hover:text-rose-600"
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
              onClick={() => setCurrentStep(3)}
              className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Address
            </button>
            <button
              type="button"
              onClick={() => {
                if (!gstin && !pan) {
                  setError('GSTIN or PAN is mandatory.');
                  return;
                }
                setError(null);
                setCurrentStep(5);
              }}
              className="py-3 px-6 rounded-xl text-sm font-bold bg-[#203D91] text-white hover:bg-[#162b66] transition-all shadow-md shadow-[#203D91]/20 flex items-center gap-2 cursor-pointer"
            >
              Next: Bank & Product Details
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* STEP 5: BANK & PRODUCT INFORMATION                  */}
      {/* ==================================================== */}
      {currentStep === 5 && (
        <form onSubmit={handleFinalSubmit} className="space-y-6">
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
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  required
                  placeholder="As per bank passbook"
                  className="w-full px-3.5 py-2 rounded-xl border border-white bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#203D91]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17233C] mb-1">Bank Name *</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  required
                  placeholder="e.g. HDFC Bank, ICICI Bank"
                  className="w-full px-3.5 py-2 rounded-xl border border-white bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#203D91]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17233C] mb-1">
                  Bank Account Number *
                </label>
                <input
                  type="password"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  required
                  placeholder="Account number"
                  className="w-full px-3.5 py-2 rounded-xl border border-white bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#203D91]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17233C] mb-1">
                  Confirm Account Number *
                </label>
                <input
                  type="text"
                  value={confirmAccountNumber}
                  onChange={(e) => setConfirmAccountNumber(e.target.value)}
                  required
                  placeholder="Re-enter account number"
                  className="w-full px-3.5 py-2 rounded-xl border border-white bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#203D91]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17233C] mb-1">IFSC Code *</label>
                <input
                  type="text"
                  value={ifsc}
                  onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                  required
                  placeholder="HDFC0000053"
                  className="w-full px-3.5 py-2 rounded-xl border border-white bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#203D91]"
                />
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

          {/* Product Categories Supplied */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#17233C]">
              Select Product Categories You Supply *
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 bg-[#F4F7FC] rounded-2xl border border-[#E2E8F0]">
              {MASTER_CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.includes(cat.slug);
                return (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedCategories(selectedCategories.filter((c) => c !== cat.slug));
                      } else {
                        setSelectedCategories([...selectedCategories, cat.slug]);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#203D91] text-white border-[#203D91]'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Brands Supplied Chips */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#17233C]">
              Brands / Manufacturers Supplied
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={brandInput}
                onChange={(e) => setBrandInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddBrand();
                  }
                }}
                placeholder="e.g. UltraTech, Havells, Astral, Jaquar"
                className="flex-1 px-3.5 py-2 rounded-xl border border-[#E2E8F0] text-xs focus:outline-none focus:ring-2 focus:ring-[#203D91]"
              />
              <button
                type="button"
                onClick={handleAddBrand}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#FF7417] text-white hover:bg-[#e05e07]"
              >
                + Add Brand
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {brandsSupplied.map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-[#203D91] text-xs font-bold border border-blue-200"
                >
                  {b}
                  <button type="button" onClick={() => handleRemoveBrand(b)} className="hover:text-rose-600">
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Terms & Conditions Acceptance */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-[#203D91] focus:ring-[#203D91]"
              />
              <span className="text-slate-700">
                I agree to the <strong>BUILDORA 60 Supplier Terms of Partnership</strong>, 60-minute dispatch SLAs, and batch compressive testing standards.
              </span>
            </label>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={privacyAccepted}
                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-[#203D91] focus:ring-[#203D91]"
              />
              <span className="text-slate-700">
                I confirm that all uploaded documents, GST credentials, and bank settlement details belong to the authorized entity.
              </span>
            </label>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Documents
            </button>
            <button
              type="submit"
              disabled={isLoading || !termsAccepted || !privacyAccepted}
              className="py-3 px-8 rounded-xl text-sm font-bold bg-[#203D91] text-white hover:bg-[#162b66] transition-all shadow-md shadow-[#203D91]/20 flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Clock className="w-4 h-4 animate-spin" />
                  Submitting Application...
                </span>
              ) : (
                <>
                  Submit Vendor Application
                  <ShieldCheck className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
