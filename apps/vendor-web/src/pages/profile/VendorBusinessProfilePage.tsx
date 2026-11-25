import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  UploadCloud,
  Trash2,
  Loader2,
  Image as ImageIcon,
  Save,
  FileText,
  CreditCard,
  Warehouse,
} from 'lucide-react';
import { useVendorAuthStore } from '../../store/useVendorAuthStore';
import { vendorApi } from '../../services/vendorApi';
import { validateLogoFileMetadata } from '@buildora/validation';
import {
  PageHeader,
  Card,
  CardHeader,
  CardContent,
  Button,
  Badge,
} from '../../components/common';
import { toast } from '../../store/useToastStore';

export const VendorBusinessProfilePage: React.FC = () => {
  const { vendor, fetchProfile } = useVendorAuthStore();

  const [storeName, setStoreName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [addressStreet, setAddressStreet] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [addressPincode, setAddressPincode] = useState('');

  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');

  const [logoPreview, setLogoPreview] = useState('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!vendor) return;
    setStoreName(vendor.businessInfo?.storeName || vendor.storeName || '');
    setLegalName(vendor.businessInfo?.businessName || vendor.business?.legalName || '');
    setEmail(vendor.businessInfo?.email || vendor.email || '');
    setPhone(vendor.businessInfo?.phone || vendor.phone || '');
    setGstin(vendor.businessInfo?.gstin || vendor.business?.gstin || '');
    setPan(vendor.businessInfo?.pan || vendor.business?.pan || '');
    setAddressStreet(
      vendor.businessInfo?.address?.street || vendor.business?.address?.street || ''
    );
    setAddressCity(vendor.businessInfo?.address?.city || vendor.business?.address?.city || 'Bengaluru');
    setAddressPincode(
      vendor.businessInfo?.address?.pincode || vendor.business?.address?.pincode || ''
    );

    const bank = vendor.businessInfo?.bankDetails || vendor.bankDetails || {};
    setAccountHolderName(bank.accountHolderName || bank.beneficiaryName || '');
    setBankName(bank.bankName || '');
    setAccountNumber(bank.accountNumber || '');
    setIfsc(bank.ifsc || bank.ifscCode || '');
    setLogoPreview(vendor.logoUrl || vendor.businessInfo?.logo || '');
  }, [vendor]);

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
      await fetchProfile();
      toast.success('Business logo removed.');
    } catch (err: any) {
      setLogoError(err.message || 'Failed to remove logo.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await vendorApi.updateProfile({
        storeName: storeName.trim(),
        businessInfo: {
          storeName: storeName.trim(),
          businessName: legalName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          address: {
            ...(vendor?.businessInfo?.address || {}),
            street: addressStreet.trim(),
            city: addressCity.trim(),
            pincode: addressPincode.trim(),
          },
        },
      });
      await vendorApi.updateBankDetails({
        accountHolderName: accountHolderName.trim(),
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        ifsc: ifsc.trim().toUpperCase(),
      });
      await fetchProfile();
      toast.success('Business profile updated.');
    } catch {
      toast.error('Failed to update business profile.');
    } finally {
      setSaving(false);
    }
  };

  const docs = vendor?.kycDocuments || vendor?.businessInfo?.documents || [];

  return (
    <div className="space-y-6 pb-8 max-w-4xl">
      <PageHeader
        title="Business Profile"
        description="Manage your registered business details, GST & PAN records, KYC documents, and bank information."
        actions={
          <Link to="/onboarding">
            <Button variant="secondary" size="sm">
              Onboarding Wizard
            </Button>
          </Link>
        }
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Business Details & Logo */}
        <Card>
          <CardHeader
            title="Business Information"
            subtitle="Store identity and registered legal details"
            action={
              <Badge variant="success" size="sm">
                {vendor?.status || 'ACTIVE'}
              </Badge>
            }
          />
          <CardContent className="space-y-5">
            <div className="p-4 rounded-xl bg-[#F8F7F5] border border-[#E7E5E4] flex flex-wrap items-center gap-4">
              <div className="w-16 h-16 rounded-xl border border-[#E7E5E4] bg-white flex items-center justify-center overflow-hidden shrink-0">
                {isUploadingLogo ? (
                  <Loader2 className="w-5 h-5 text-[#943D24] animate-spin" />
                ) : logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-[#78716C]" />
                )}
              </div>
              <div className="flex-1 min-w-[200px] space-y-1.5">
                <p className="text-xs font-semibold text-[#292524]">Business Logo</p>
                <p className="text-[11px] text-[#78716C]">JPG, PNG, or WEBP up to 5 MB</p>
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
                <label className="portal-label">Registered Address</label>
                <input
                  type="text"
                  value={addressStreet}
                  onChange={(e) => setAddressStreet(e.target.value)}
                  className="portal-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
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
                    value={addressPincode}
                    onChange={(e) => setAddressPincode(e.target.value)}
                    className="portal-input font-mono"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* GST & KYC Documents */}
        <Card>
          <CardHeader
            title="GST & Verification Documents"
            subtitle="Tax identifiers and uploaded KYC documents"
          />
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="portal-label">GSTIN</label>
                <input type="text" value={gstin} disabled className="portal-input font-mono" />
              </div>
              <div>
                <label className="portal-label">PAN</label>
                <input type="text" value={pan} disabled className="portal-input font-mono" />
              </div>
            </div>

            {docs.length > 0 && (
              <div className="divide-y divide-[#E7E5E4] border border-[#E7E5E4] rounded-xl">
                {docs.map((doc: any, idx: number) => (
                  <div
                    key={doc.id || idx}
                    className="px-4 py-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-[#943D24]" />
                      <div>
                        <p className="font-medium text-[#292524]">
                          {doc.title || doc.name || doc.type}
                        </p>
                        <p className="text-[11px] text-[#78716C]">{doc.fileName || doc.type}</p>
                      </div>
                    </div>
                    <Badge variant="success" size="sm">
                      {doc.verificationStatus || 'VERIFIED'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bank Details */}
        <Card>
          <CardHeader
            title="Bank Account Details"
            subtitle="Account used for settlements and payouts"
            action={<CreditCard className="w-4 h-4 text-[#78716C]" />}
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
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="portal-input font-mono"
                />
              </div>
              <div>
                <label className="portal-label">IFSC Code *</label>
                <input
                  type="text"
                  value={ifsc}
                  onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                  className="portal-input font-mono uppercase"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warehouse Overview */}
        <Card>
          <CardHeader
            title="Primary Warehouse"
            action={
              <Link to="/warehouses" className="text-xs font-medium text-[#943D24] hover:underline">
                Manage Warehouses
              </Link>
            }
          />
          <CardContent className="flex items-center gap-3 text-xs text-[#78716C]">
            <Warehouse className="w-4 h-4 text-[#943D24] shrink-0" />
            <span>
              {vendor?.businessInfo?.warehouseAddress ||
                'Plot 88, Peenya 2nd Stage, Bengaluru, Karnataka 560058'}
            </span>
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
