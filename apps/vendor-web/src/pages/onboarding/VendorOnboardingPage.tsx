import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVendorAuthStore } from '../../store/useVendorAuthStore';
import { vendorApi } from '../../services/vendorApi';
import {
  PageHeader,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Button,
  Badge,
} from '../../components/common';
import {
  Building,
  MapPin,
  CreditCard,
  Package,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { toast } from '../../store/useToastStore';

export const VendorOnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { vendor, updateOnboarding, isLoading, error } = useVendorAuthStore();

  const [categoryList, setCategoryList] = useState<string[]>([]);
  const [hubList, setHubList] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      vendorApi.getTaxonomy().catch(() => null),
      vendorApi.getWarehouses().catch(() => null),
    ]).then(([tax, wh]) => {
      if (tax) {
        const names = (tax.childCategories || tax.mainCategories || []).map((c: any) => c.name);
        setCategoryList(Array.from(new Set(names)));
      }
      if (wh?.darkStores) {
        setHubList(wh.darkStores);
      }
    });
  }, []);

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const [legalName, setLegalName] = useState(
    vendor?.businessInfo?.businessName || vendor?.business?.legalName || ''
  );
  const [tradeName, setTradeName] = useState(
    vendor?.businessInfo?.storeName || vendor?.business?.tradeName || vendor?.storeName || ''
  );
  const [gstin, setGstin] = useState(
    vendor?.businessInfo?.gstin || vendor?.business?.gstin || ''
  );
  const [pan, setPan] = useState(
    vendor?.businessInfo?.pan || vendor?.business?.pan || ''
  );

  const [street, setStreet] = useState(
    vendor?.businessInfo?.address?.street ||
      vendor?.business?.address?.street ||
      ''
  );
  const [city] = useState(
    vendor?.businessInfo?.address?.city || vendor?.business?.address?.city || 'Bengaluru'
  );
  const [pincode, setPincode] = useState(
    vendor?.businessInfo?.address?.pincode || vendor?.business?.address?.pincode || ''
  );
  const [selectedHub, setSelectedHub] = useState(
    vendor?.businessInfo?.assignedDarkStoreId || ''
  );

  const [accountNumber, setAccountNumber] = useState(
    vendor?.businessInfo?.bankDetails?.accountNumber || vendor?.bankDetails?.accountNumber || ''
  );
  const [ifscCode, setIfscCode] = useState(
    vendor?.businessInfo?.bankDetails?.ifsc || vendor?.bankDetails?.ifscCode || ''
  );
  const [bankName, setBankName] = useState(
    vendor?.businessInfo?.bankDetails?.bankName || vendor?.bankDetails?.bankName || ''
  );
  const [beneficiaryName, setBeneficiaryName] = useState(
    vendor?.businessInfo?.bankDetails?.accountHolderName ||
      vendor?.bankDetails?.beneficiaryName ||
      vendor?.storeName ||
      ''
  );

  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    vendor?.businessInfo?.categories && vendor.businessInfo.categories.length > 0
      ? vendor.businessInfo.categories
      : vendor?.categories && vendor.categories.length > 0
      ? vendor.categories
      : ['Cement & Concrete', 'Steel & Structural Metals']
  );

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSubmit = async () => {
    const success = await updateOnboarding({
      business: {
        businessName: legalName,
        storeName: tradeName,
        gstin,
        pan,
        address: {
          building: 'Main Depot',
          street,
          area: 'Peenya',
          city,
          state: 'Karnataka',
          pincode,
        },
      },
      bank: {
        accountNumber,
        ifsc: ifscCode,
        bankName,
        accountHolderName: beneficiaryName,
        branch: 'Bengaluru Main',
        isVerified: true,
      },
      categories: selectedCategories,
    });

    if (success) {
      toast.success('Onboarding details saved.');
      navigate('/dashboard');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      <PageHeader
        title="Vendor Onboarding"
        description="Complete your business, warehouse, bank, and product category details."
        actions={
          <Badge variant="brand">
            Step {currentStep} of {totalSteps}
          </Badge>
        }
      />

      {/* Stepper */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { step: 1, title: 'Business & Tax', icon: Building },
          { step: 2, title: 'Warehouse & Hub', icon: MapPin },
          { step: 3, title: 'Bank Details', icon: CreditCard },
          { step: 4, title: 'Categories & Review', icon: Package },
        ].map((item) => {
          const Icon = item.icon;
          const isDone = currentStep > item.step;
          const isCurrent = currentStep === item.step;
          return (
            <div
              key={item.step}
              className={`p-3 rounded-xl border flex items-center gap-3 ${
                isCurrent
                  ? 'border-[#943D24] bg-[#FBF3F0]'
                  : isDone
                  ? 'border-[#15966B]/40 bg-[#15966B]/5'
                  : 'border-[#E7E5E4] bg-white'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  isCurrent
                    ? 'bg-[#943D24] text-white'
                    : isDone
                    ? 'bg-[#15966B] text-white'
                    : 'bg-[#F8F7F5] text-[#78716C]'
                }`}
              >
                {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-[#78716C]">Step {item.step}</p>
                <p className="text-xs font-semibold text-[#292524] truncate">{item.title}</p>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-[#DC4545]/10 border border-[#DC4545]/20 text-[#DC4545] text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Card>
        {currentStep === 1 && (
          <>
            <CardHeader
              title="Business Identification & GST"
              subtitle="Enter your registered legal business details."
            />
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="portal-label">Legal Business Name *</label>
                <input
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  className="portal-input"
                />
              </div>
              <div>
                <label className="portal-label">Store Display Name *</label>
                <input
                  type="text"
                  value={tradeName}
                  onChange={(e) => setTradeName(e.target.value)}
                  className="portal-input"
                />
              </div>
              <div>
                <label className="portal-label">GSTIN *</label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  className="portal-input font-mono uppercase"
                />
              </div>
              <div>
                <label className="portal-label">PAN *</label>
                <input
                  type="text"
                  value={pan}
                  onChange={(e) => setPan(e.target.value.toUpperCase())}
                  className="portal-input font-mono uppercase"
                />
              </div>
            </CardContent>
          </>
        )}

        {currentStep === 2 && (
          <>
            <CardHeader
              title="Warehouse & Hub Selection"
              subtitle="Enter your dispatch address and select your primary hub."
            />
            <CardContent className="space-y-4">
              <div>
                <label className="portal-label">Warehouse Street Address *</label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="portal-input"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="portal-label">City</label>
                  <input type="text" value={city} disabled className="portal-input" />
                </div>
                <div>
                  <label className="portal-label">Pincode *</label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="portal-input font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="portal-label">Primary Fulfillment Hub *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {hubList.length === 0 ? (
                    <p className="text-xs text-[#78716C] sm:col-span-2 py-2">Loading configured tenant hubs...</p>
                  ) : (
                    hubList.map((hub) => (
                      <div
                        key={hub.id}
                        onClick={() => setSelectedHub(hub.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-colors ${
                          selectedHub === hub.id
                            ? 'border-[#943D24] bg-[#FBF3F0]/60'
                            : 'border-[#E7E5E4] bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#292524]">{hub.id}</span>
                          <Badge variant={selectedHub === hub.id ? 'brand' : 'neutral'} size="sm">
                            {hub.city || hub.zone || 'Hub'}
                          </Badge>
                        </div>
                        <p className="text-xs text-[#78716C] mt-1">{hub.name}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </>
        )}

        {currentStep === 3 && (
          <>
            <CardHeader
              title="Bank Account Details"
              subtitle="Provide bank details for settlement payouts."
            />
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="portal-label">Beneficiary Name *</label>
                <input
                  type="text"
                  value={beneficiaryName}
                  onChange={(e) => setBeneficiaryName(e.target.value)}
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
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  className="portal-input font-mono uppercase"
                />
              </div>
            </CardContent>
          </>
        )}

        {currentStep === 4 && (
          <>
            <CardHeader
              title="Supply Categories & Review"
              subtitle="Select the categories you supply."
            />
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto p-1">
                {categoryList.map((cat) => {
                  const isSelected = selectedCategories.includes(cat);
                  return (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`p-3 rounded-xl border text-xs font-medium text-left flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-[#943D24] text-white border-[#943D24]'
                          : 'bg-white text-[#292524] border-[#E7E5E4] hover:border-[#943D24]/50'
                      }`}
                    >
                      <span className="truncate">{cat}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>

              <div className="p-4 rounded-xl bg-[#F8F7F5] border border-[#E7E5E4] text-xs grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#78716C]">
                <div className="break-words">
                  <strong className="text-[#292524]">Legal Entity:</strong> {legalName || '—'}
                </div>
                <div className="break-all">
                  <strong className="text-[#292524]">GSTIN:</strong> {gstin}
                </div>
                <div>
                  <strong className="text-[#292524]">Primary Hub:</strong> {selectedHub}
                </div>
                <div>
                  <strong className="text-[#292524]">Account:</strong>{' '}
                  {accountNumber ? `•••• ${accountNumber.slice(-4)}` : '—'}
                </div>
              </div>
            </CardContent>
          </>
        )}

        <CardFooter>
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep((p) => Math.max(1, p - 1))}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back
            </Button>
          ) : (
            <div />
          )}

          {currentStep < totalSteps ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setCurrentStep((p) => Math.min(totalSteps, p + 1))}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Next
            </Button>
          ) : (
            <Button
              type="button"
              variant="accent"
              size="sm"
              onClick={handleSubmit}
              isLoading={isLoading}
              rightIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Complete Onboarding
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default VendorOnboardingPage;
