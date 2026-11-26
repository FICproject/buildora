import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  UploadCloud,
  Trash2,
  Loader2,
  Image as ImageIcon,
  Save,
  FileText,
  CreditCard,
  Warehouse,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { VendorProfile } from '@buildora/types';
import {
  validateLogoFileMetadata,
  validateEmail,
  validateIndianMobile,
  validatePincode,
  validateAccountBeneficiaryName,
  validateBankName,
  validateBankAccount,
  validateIFSC,
} from '@buildora/validation';
import { useVendorAuthStore } from '../../store/useVendorAuthStore';
import { vendorApi } from '../../services/vendorApi';
import {
  PageHeader,
  Card,
  CardHeader,
  CardContent,
  Button,
  Badge,
} from '../../components/common';
import { toast } from '../../store/useToastStore';

function getApprovalBadgeProps(status?: string): {
  label: string;
  variant: 'success' | 'warning' | 'info' | 'danger' | 'neutral';
} {
  const s = String(status || '').toUpperCase();
  switch (s) {
    case 'APPROVED':
    case 'ACTIVE':
      return { label: 'Approved', variant: 'success' };
    case 'UNDER_REVIEW':
      return { label: 'Under Review', variant: 'info' };
    case 'SUBMITTED':
    case 'PENDING':
    case 'PENDING_VERIFICATION':
    case 'DRAFT':
      return { label: s === 'DRAFT' ? 'Draft' : 'Pending', variant: 'warning' };
    case 'RESUBMISSION_REQUIRED':
      return { label: 'Correction Requested', variant: 'warning' };
    case 'REJECTED':
    case 'SUSPENDED':
      return { label: s === 'SUSPENDED' ? 'Suspended' : 'Rejected', variant: 'danger' };
    default:
      return { label: s || 'Pending', variant: 'neutral' };
  }
}

function getDocumentBadgeVariant(status?: string): 'success' | 'warning' | 'danger' | 'neutral' {
  const s = String(status || '').toUpperCase();
  if (s === 'VERIFIED' || s === 'APPROVED') return 'success';
  if (s === 'REJECTED') return 'danger';
  if (s === 'PENDING' || s === 'UNDER_REVIEW') return 'warning';
  return 'neutral';
}

export const VendorBusinessProfilePage: React.FC = () => {
  const { vendor, fetchProfile } = useVendorAuthStore();

  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [storeName, setStoreName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [businessType, setBusinessType] = useState('');
  const [businessRegistrationType, setBusinessRegistrationType] = useState('');
  const [yearOfEstablishment, setYearOfEstablishment] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');

  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');

  const [addressStreet, setAddressStreet] = useState('');
  const [addressCountry, setAddressCountry] = useState('India');
  const [addressState, setAddressState] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [addressPincode, setAddressPincode] = useState('');

  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [accountType, setAccountType] = useState<'CURRENT' | 'SAVINGS'>('CURRENT');

  const [logoPreview, setLogoPreview] = useState('');
  const [logoFileName, setLogoFileName] = useState('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const applyVendorToForm = useCallback((rawVendor: VendorProfile | any) => {
    if (!rawVendor) return;
    const v: any = rawVendor?.vendor || rawVendor;
    const reg = v.registrationData || {};
    const biz = v.businessInfo || {};
    const bizLegacy = v.business || {};
    const addr = biz.address || bizLegacy.address || {};
    const bank = biz.bankDetails || reg.bankDetails || v.bankDetails || {};

    setStoreName(v.storeName || biz.storeName || reg.storeName || bizLegacy.tradeName || '');
    setLegalName(biz.businessName || reg.legalBusinessName || bizLegacy.legalName || '');
    setOwnerName(v.name || biz.contactPerson || reg.ownerName || '');
    setEmail(v.email || biz.email || reg.email || '');
    setPhone(v.phone || biz.phone || reg.phone || '');

    setBusinessType(reg.businessType || biz.businessType || '');
    setBusinessRegistrationType(
      reg.businessRegistrationType || biz.businessRegistrationType || biz.businessType || ''
    );
    setYearOfEstablishment(reg.yearOfEstablishment || biz.yearOfEstablishment || '');
    setWebsite(reg.website || biz.website || '');
    setDescription(biz.description || reg.description || '');

    setGstin(biz.gstin || reg.gstin || bizLegacy.gstin || '');
    setPan(biz.pan || reg.pan || bizLegacy.pan || '');

    setAddressStreet(
      reg.completeAddress ||
        [addr.building, addr.street].filter(Boolean).join(', ') ||
        ''
    );
    setAddressCountry(addr.country || reg.country || 'India');
    setAddressState(addr.state || reg.state || '');
    setAddressCity(addr.city || reg.city || '');
    setAddressPincode(addr.pincode || reg.pincode || '');

    setAccountHolderName(bank.accountHolderName || bank.beneficiaryName || '');
    setBankName(bank.bankName || '');
    setAccountNumber(bank.accountNumber || '');
    setIfsc((bank.ifsc || bank.ifscCode || '').toUpperCase());
    setAccountType(bank.accountType === 'SAVINGS' ? 'SAVINGS' : 'CURRENT');

    setLogoPreview(v.logoUrl || biz.logo || reg.logoUrl || '');
    setLogoFileName(
      v.logoMetadata?.fileName ||
        biz.logoMetadata?.fileName ||
        reg.logoMetadata?.fileName ||
        ''
    );
  }, []);

  const loadVendorProfile = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true);
      else setInitialLoading(true);
      setLoadError(null);
      try {
        const fresh = await fetchProfile();
        if (!fresh) {
          if (!vendor) {
            setLoadError('Unable to load your registered business profile from the server.');
          }
        } else {
          applyVendorToForm(fresh);
        }
      } catch (err: any) {
        setLoadError(err?.message || 'Unable to load your business profile.');
      } finally {
        setInitialLoading(false);
        setRefreshing(false);
      }
    },
    [fetchProfile, applyVendorToForm, vendor]
  );

  // Fetch authenticated vendor's full registration data from backend on page mount
  useEffect(() => {
    loadVendorProfile(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep form synced when store vendor updates (e.g., after upload/save)
  useEffect(() => {
    if (vendor && (vendor as any).id) {
      applyVendorToForm(vendor);
    }
  }, [vendor, applyVendorToForm]);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoError(null);

    const check = validateLogoFileMetadata(file.type, file.size, file.name);
    if (!check.isValid) {
      setLogoError(check.error || 'Invalid logo file.');
      e.target.value = '';
      return;
    }

    setIsUploadingLogo(true);
    try {
      const res = await vendorApi.uploadProfileLogo(file);
      setLogoPreview(res.logoUrl);
      setLogoFileName(res.logoMetadata?.fileName || file.name);
      await fetchProfile();
      toast.success('Business logo updated.');
    } catch (err: any) {
      setLogoError(err.message || 'Failed to upload logo.');
    } finally {
      setIsUploadingLogo(false);
      e.target.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    setLogoError(null);
    try {
      await vendorApi.updateProfile({ logoUrl: '', logoMetadata: null });
      setLogoPreview('');
      setLogoFileName('');
      await fetchProfile();
      toast.success('Business logo removed.');
    } catch (err: any) {
      setLogoError(err.message || 'Failed to remove logo.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setFormError(null);

    const emailCheck = validateEmail(email);
    if (!emailCheck.isValid) {
      setFormError(emailCheck.error || 'Please enter a valid business email address.');
      return;
    }

    const phoneCheck = validateIndianMobile(phone);
    if (!phoneCheck.isValid) {
      setFormError(phoneCheck.error || 'Enter a valid 10-digit mobile number starting with 6–9.');
      return;
    }

    if (addressPincode.trim()) {
      const pinCheck = validatePincode(addressPincode);
      if (!pinCheck.isValid) {
        setFormError(pinCheck.error || 'Enter a valid 6-digit Indian pincode.');
        return;
      }
    }

    if (accountHolderName.trim() || bankName.trim() || accountNumber.trim() || ifsc.trim()) {
      const holderCheck = validateAccountBeneficiaryName(accountHolderName);
      if (!holderCheck.isValid) {
        setFormError(holderCheck.error || 'Please enter a valid account beneficiary name.');
        return;
      }
      const bankCheck = validateBankName(bankName);
      if (!bankCheck.isValid) {
        setFormError(bankCheck.error || 'Please enter a valid bank name.');
        return;
      }
      const accCheck = validateBankAccount(accountNumber);
      if (!accCheck.isValid) {
        setFormError(accCheck.error || 'Bank account number must be 9 to 18 digits.');
        return;
      }
      const ifscCheck = validateIFSC(ifsc);
      if (!ifscCheck.isValid) {
        setFormError(ifscCheck.error || 'Enter a valid 11-character IFSC code.');
        return;
      }
    }

    setSaving(true);
    try {
      await vendorApi.updateProfile({
        storeName: storeName.trim(),
        name: ownerName.trim(),
        email: email.trim().toLowerCase(),
        phone: phoneCheck.normalized || phone.trim(),
        businessInfo: {
          storeName: storeName.trim(),
          businessName: legalName.trim(),
          contactPerson: ownerName.trim(),
          email: email.trim().toLowerCase(),
          phone: phoneCheck.normalized || phone.trim(),
          businessRegistrationType: businessRegistrationType.trim(),
          yearOfEstablishment: yearOfEstablishment.trim(),
          website: website.trim(),
          description: description.trim(),
          address: {
            building: addressStreet.trim(),
            street: addressStreet.trim(),
            country: addressCountry.trim() || 'India',
            state: addressState.trim(),
            city: addressCity.trim(),
            pincode: addressPincode.trim(),
          },
        },
      });

      await vendorApi.updateBankDetails({
        accountHolderName: accountHolderName.trim(),
        bankName: bankName.trim(),
        accountNumber: accountNumber.replace(/\D/g, ''),
        ifsc: ifsc.trim().toUpperCase(),
        accountType,
      });

      const refreshed = await fetchProfile();
      if (refreshed) applyVendorToForm(refreshed);
      toast.success('Business profile saved and synced.');
    } catch (err: any) {
      const msg = err?.message || 'Failed to update business profile.';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const activeVendor: any = (vendor as any)?.vendor || vendor;
  const docs =
    activeVendor?.kycDocuments ||
    activeVendor?.registrationData?.documents ||
    activeVendor?.businessInfo?.documents ||
    [];
  const warehouses =
    activeVendor?.warehouses || activeVendor?.registrationData?.warehouses || [];
  const approvalBadge = getApprovalBadgeProps(activeVendor?.status);

  if (initialLoading && !activeVendor?.id) {
    return (
      <div className="space-y-6 pb-8 max-w-4xl">
        <PageHeader
          title="Business Profile"
          description="Loading your registered vendor details, KYC documents, and bank records..."
        />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-44 rounded-xl border border-[#E7E5E4] bg-white animate-pulse p-6"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!activeVendor?.id && loadError) {
    return (
      <div className="space-y-6 pb-8 max-w-4xl">
        <PageHeader title="Business Profile" />
        <Card>
          <CardContent className="py-10 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-[#DC4545] mx-auto" />
            <p className="text-sm font-semibold text-[#292524]">{loadError}</p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => loadVendorProfile(true)}
              isLoading={refreshing}
            >
              Retry Loading Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 max-w-4xl">
      <PageHeader
        title="Business Profile"
        description="Manage your registered business details, GST & PAN records, KYC documents, and bank information."
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => loadVendorProfile(true)}
              isLoading={refreshing}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
            <Link to="/onboarding">
              <Button variant="secondary" size="sm">
                Onboarding Wizard
              </Button>
            </Link>
          </div>
        }
      />

      {loadError && (
        <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#DC4545] flex items-center justify-between gap-3">
          <span>{loadError}</span>
          <button
            type="button"
            onClick={() => loadVendorProfile(true)}
            className="font-semibold underline shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {formError && (
        <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#DC4545] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Business Details & Logo */}
        <Card>
          <CardHeader
            title="Business Information"
            subtitle="Store identity and registered legal details"
            action={
              <Badge variant={approvalBadge.variant} size="sm">
                {approvalBadge.label}
              </Badge>
            }
          />
          <CardContent className="space-y-5">
            <div className="p-4 rounded-xl bg-[#F8F7F5] border border-[#E7E5E4] flex flex-wrap items-center gap-4">
              <div className="w-16 h-16 rounded-xl border border-[#E7E5E4] bg-white flex items-center justify-center overflow-hidden shrink-0">
                {isUploadingLogo ? (
                  <Loader2 className="w-5 h-5 text-[#943D24] animate-spin" />
                ) : logoPreview ? (
                  <img
                    src={logoPreview}
                    alt={`${storeName || 'Business'} Logo`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-6 h-6 text-[#78716C]" />
                )}
              </div>
              <div className="flex-1 min-w-[200px] space-y-1.5">
                <p className="text-xs font-semibold text-[#292524]">Business Logo</p>
                <p className="text-[11px] text-[#78716C]">
                  {logoFileName ? `Uploaded: ${logoFileName}` : 'JPG, PNG, or WEBP up to 5 MB'}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <label className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#943D24] text-white hover:bg-[#7D331E] cursor-pointer inline-flex items-center gap-1.5">
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>{logoPreview ? 'Change Logo' : 'Upload Logo'}</span>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      onChange={handleLogoChange}
                      disabled={isUploadingLogo}
                      className="hidden"
                    />
                  </label>
                  {logoPreview && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#DC4545] bg-white border border-[#E7E5E4] hover:bg-[#DC4545]/10 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  )}
                </div>
                {logoError && <p className="text-xs text-[#DC4545]">{logoError}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="portal-label">Store Display Name *</label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="portal-input"
                />
              </div>
              <div>
                <label className="portal-label">Legal Business Name *</label>
                <input
                  type="text"
                  required
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  className="portal-input"
                />
              </div>
              <div>
                <label className="portal-label">Authorized Contact / Owner Name *</label>
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="portal-input"
                />
              </div>
              <div>
                <label className="portal-label">Business Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="portal-input"
                />
              </div>
              <div>
                <label className="portal-label">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="portal-input"
                />
              </div>
              <div>
                <label className="portal-label">Business Constitution / Registration Type</label>
                <input
                  type="text"
                  value={businessRegistrationType || businessType}
                  onChange={(e) => setBusinessRegistrationType(e.target.value)}
                  className="portal-input"
                  placeholder="e.g. Private Limited, LLP, Sole Proprietorship"
                />
              </div>
              <div>
                <label className="portal-label">Year of Establishment</label>
                <input
                  type="text"
                  value={yearOfEstablishment}
                  onChange={(e) => setYearOfEstablishment(e.target.value)}
                  className="portal-input"
                  placeholder="e.g. 2018"
                />
              </div>
              <div>
                <label className="portal-label">Website URL</label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="portal-input"
                  placeholder="https://company.com"
                />
              </div>
              <div className="md:col-span-2">
                <label className="portal-label">Business &amp; Inventory Capabilities</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="portal-input"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-[#E7E5E4] grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="portal-label">Registered Address</label>
                <input
                  type="text"
                  value={addressStreet}
                  onChange={(e) => setAddressStreet(e.target.value)}
                  className="portal-input"
                />
              </div>
              <div>
                <label className="portal-label">Country</label>
                <input
                  type="text"
                  value={addressCountry}
                  onChange={(e) => setAddressCountry(e.target.value)}
                  className="portal-input"
                />
              </div>
              <div>
                <label className="portal-label">State</label>
                <input
                  type="text"
                  value={addressState}
                  onChange={(e) => setAddressState(e.target.value)}
                  className="portal-input"
                />
              </div>
              <div>
                <label className="portal-label">City</label>
                <input
                  type="text"
                  value={addressCity}
                  onChange={(e) => setAddressCity(e.target.value)}
                  className="portal-input"
                />
              </div>
              <div>
                <label className="portal-label">Pincode</label>
                <input
                  type="text"
                  maxLength={6}
                  value={addressPincode}
                  onChange={(e) => setAddressPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="portal-input font-mono"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* GST & KYC Documents */}
        <Card>
          <CardHeader
            title="GST & Verification Documents"
            subtitle="Registered tax identifiers and uploaded KYC compliance documents"
          />
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="portal-label">GSTIN</label>
                <input
                  type="text"
                  value={gstin || 'Not Provided'}
                  disabled
                  className="portal-input font-mono"
                />
              </div>
              <div>
                <label className="portal-label">PAN</label>
                <input
                  type="text"
                  value={pan || 'Not Provided'}
                  disabled
                  className="portal-input font-mono"
                />
              </div>
            </div>

            {docs.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-[#E7E5E4] bg-[#F8F7F5] text-xs text-[#78716C] text-center">
                No KYC documents uploaded yet. You can upload compliance certificates in the{' '}
                <Link to="/register?step=4" className="text-[#943D24] font-semibold underline">
                  Onboarding KYC Step
                </Link>
                .
              </div>
            ) : (
              <div className="divide-y divide-[#E7E5E4] border border-[#E7E5E4] rounded-xl">
                {docs.map((doc: any, idx: number) => {
                  const status = doc.verificationStatus || doc.status || 'PENDING';
                  const docUrl = doc.fileUrl || doc.url;
                  return (
                    <div
                      key={doc.id || idx}
                      className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-4 h-4 text-[#943D24] shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-[#292524] truncate">
                            {doc.title || doc.name || doc.type}
                          </p>
                          <p className="text-[11px] text-[#78716C] truncate">
                            {doc.fileName || doc.type}
                            {doc.fileSize
                              ? ` • ${Math.max(1, Math.round(doc.fileSize / 1024))} KB`
                              : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {docUrl && !String(docUrl).startsWith('/secure/') && (
                          <a
                            href={docUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#943D24] hover:underline"
                          >
                            View <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        <Badge variant={getDocumentBadgeVariant(status)} size="sm">
                          {status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bank Details */}
        <Card>
          <CardHeader
            title="Bank Account Details"
            subtitle="Settlement account details verified during registration"
            action={
              <div className="flex items-center gap-2">
                {activeVendor?.businessInfo?.bankDetails?.isVerified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#15966B]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                )}
                <CreditCard className="w-4 h-4 text-[#78716C]" />
              </div>
            }
          />
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="portal-label">Beneficiary Name *</label>
                <input
                  type="text"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  className="portal-input"
                />
              </div>
              <div>
                <label className="portal-label">Bank Name *</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="portal-input"
                />
              </div>
              <div>
                <label className="portal-label">Account Number *</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                  className="portal-input font-mono"
                />
              </div>
              <div>
                <label className="portal-label">IFSC Code *</label>
                <input
                  type="text"
                  maxLength={11}
                  value={ifsc}
                  onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                  className="portal-input font-mono uppercase"
                />
              </div>
              <div>
                <label className="portal-label">Account Type *</label>
                <select
                  value={accountType}
                  onChange={(e) =>
                    setAccountType(e.target.value === 'SAVINGS' ? 'SAVINGS' : 'CURRENT')
                  }
                  className="portal-input"
                >
                  <option value="CURRENT">Current Account</option>
                  <option value="SAVINGS">Savings Account</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registered Warehouses */}
        <Card>
          <CardHeader
            title="Registered Warehouses & Dispatch Hubs"
            action={
              <Link to="/warehouses" className="text-xs font-medium text-[#943D24] hover:underline">
                Manage Warehouses
              </Link>
            }
          />
          <CardContent className="space-y-3 text-xs text-[#78716C]">
            {warehouses.length > 0 ? (
              warehouses.map((wh: any, idx: number) => (
                <div
                  key={wh.id || idx}
                  className="p-3 rounded-xl border border-[#E7E5E4] bg-[#F8F7F5] flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-2.5">
                    <Warehouse className="w-4 h-4 text-[#943D24] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-[#292524]">
                        {wh.name || `Warehouse Hub ${idx + 1}`}
                      </p>
                      <p className="mt-0.5">
                        {[wh.address, wh.city, wh.state, wh.pincode].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </div>
                  {wh.isPrimary && (
                    <Badge variant="info" size="sm">
                      Primary
                    </Badge>
                  )}
                </div>
              ))
            ) : activeVendor?.businessInfo?.warehouseAddress || addressStreet ? (
              <div className="flex items-center gap-3">
                <Warehouse className="w-4 h-4 text-[#943D24] shrink-0" />
                <span>
                  {activeVendor?.businessInfo?.warehouseAddress ||
                    [addressStreet, addressCity, addressState, addressPincode]
                      .filter(Boolean)
                      .join(', ')}
                </span>
              </div>
            ) : (
              <p>No fulfillment warehouse address recorded yet.</p>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            isLoading={saving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Business Profile
          </Button>
        </div>
      </form>
    </div>
  );
};

export default VendorBusinessProfilePage;
