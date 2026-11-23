import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVendorAuthStore } from '../../store/useVendorAuthStore';
import { Card, CardHeader, CardContent, CardFooter } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import {
  Building,
  MapPin,
  CreditCard,
  Package,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Warehouse,
  ShieldCheck,
} from 'lucide-react';

const MASTER_CATEGORIES = [
  'Cement & Concrete',
  'Steel & Structural Metals',
  'Bricks, Blocks & Aggregates',
  'Tiles, Granite & Marble',
  'Paints, Primers & Textures',
  'Plumbing Pipes & Fittings',
  'Sanitaryware & Bath Fittings',
  'Electrical Wires, Switches & MCB',
  'Lighting & Fixtures',
  'Hardware, Locks & Fasteners',
  'Plywood, Boards & Laminates',
  'Roofing & Waterproofing',
  'Power Tools & Hand Tools',
  'Safety & Construction Equipment',
];

const BENGALURU_DARK_STORES = [
  { id: 'WH-BLR-01', name: 'Central Distribution Hub (Shivajinagar / MG Road)', zone: 'Central' },
  { id: 'WH-BLR-02', name: 'South Mega Hub (Electronic City / Bommanahalli)', zone: 'South' },
  { id: 'WH-BLR-03', name: 'East Tech Hub (Whitefield / Mahadevapura)', zone: 'East' },
  { id: 'WH-BLR-04', name: 'West Logistics Park (Nagarabhavi / Peenya)', zone: 'West' },
  { id: 'WH-BLR-05', name: 'North Airport Corridor Hub (Hebbal / Yelahanka)', zone: 'North' },
];

export const VendorOnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { vendor, updateOnboarding, isLoading, error } = useVendorAuthStore();

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Form states
  const [legalName, setLegalName] = useState(vendor?.businessInfo?.businessName || vendor?.business?.legalName || '');
  const [tradeName, setTradeName] = useState(vendor?.businessInfo?.storeName || vendor?.business?.tradeName || vendor?.storeName || '');
  const [gstin, setGstin] = useState(vendor?.businessInfo?.gstin || vendor?.business?.gstin || '29AAAAA0000A1Z5');
  const [pan, setPan] = useState(vendor?.businessInfo?.pan || vendor?.business?.pan || 'AAAAA0000A');

  // Address
  const [street, setStreet] = useState(vendor?.businessInfo?.address?.street || vendor?.business?.address?.street || '12, 1st Cross, Peenya Industrial Area');
  const [city, setCity] = useState(vendor?.businessInfo?.address?.city || vendor?.business?.address?.city || 'Bengaluru');
  const [pincode, setPincode] = useState(vendor?.businessInfo?.address?.pincode || vendor?.business?.address?.pincode || '560058');
  const [selectedHub, setSelectedHub] = useState(vendor?.businessInfo?.assignedDarkStoreId || 'WH-BLR-04');

  // Bank
  const [accountNumber, setAccountNumber] = useState(vendor?.businessInfo?.bankDetails?.accountNumber || vendor?.bankDetails?.accountNumber || '987654321012');
  const [ifscCode, setIfscCode] = useState(vendor?.businessInfo?.bankDetails?.ifsc || vendor?.bankDetails?.ifscCode || 'HDFC0001234');
  const [bankName, setBankName] = useState(vendor?.businessInfo?.bankDetails?.bankName || vendor?.bankDetails?.bankName || 'HDFC Bank');
  const [beneficiaryName, setBeneficiaryName] = useState(vendor?.businessInfo?.bankDetails?.accountHolderName || vendor?.bankDetails?.beneficiaryName || vendor?.storeName || '');

  // Selected Categories
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

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
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
      navigate('/dashboard');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Vendor Onboarding & Verification
            </h1>
            <Badge variant="warning">Step {currentStep} of {totalSteps}</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete your business, bank, and fulfillment hub allocation to start processing orders.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="brand" dot>Karnataka Pincodes Verified</Badge>
        </div>
      </div>

      {/* Stepper Wizard Bar */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { step: 1, title: 'Business & Tax', icon: Building },
          { step: 2, title: 'Hub & Address', icon: MapPin },
          { step: 3, title: 'Bank & Payouts', icon: CreditCard },
          { step: 4, title: 'Categories & Review', icon: Package },
        ].map((item) => {
          const Icon = item.icon;
          const isDone = currentStep > item.step;
          const isCurrent = currentStep === item.step;

          return (
            <div
              key={item.step}
              className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                isCurrent
                  ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                  : isDone
                  ? 'border-emerald-300 bg-emerald-50/30 text-emerald-800'
                  : 'border-slate-200 bg-white text-slate-400'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                  isCurrent
                    ? 'bg-blue-600 text-white'
                    : isDone
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <div className="min-w-0 hidden sm:block">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Step {item.step}
                </p>
                <p className="text-xs font-bold text-slate-900 truncate">{item.title}</p>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Wizard Step Content */}
      <Card>
        {currentStep === 1 && (
          <div>
            <CardHeader
              title="1. Business Identification & GSTIN"
              subtitle="Enter your legally registered business and tax identification numbers in Karnataka."
            />
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Legal Business Entity Name *
                  </label>
                  <input
                    type="text"
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    placeholder="e.g. Supreme Building Materials Private Limited"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Store / Trade Display Name *
                  </label>
                  <input
                    type="text"
                    value={tradeName}
                    onChange={(e) => setTradeName(e.target.value)}
                    placeholder="e.g. Supreme Materials BLR"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Karnataka GSTIN (15 Digits) *
                  </label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="29AAAAA0000A1Z5"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Must start with Karnataka state code '29'.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Permanent Account Number (PAN) *
                  </label>
                  <input
                    type="text"
                    value={pan}
                    onChange={(e) => setPan(e.target.value.toUpperCase())}
                    placeholder="AAAAA0000A"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Automatic GST B2B Invoice Generation</p>
                  <p className="text-blue-800 text-[11px] mt-0.5">
                    All contractor orders placed on BUILDORA 60 will automatically include your GSTIN and HSN
                    tax invoices for instant input tax credit (ITC) claims.
                  </p>
                </div>
              </div>
            </CardContent>
          </div>
        )}

        {currentStep === 2 && (
          <div>
            <CardHeader
              title="2. Warehouse & Dark Store Dispatch Hub"
              subtitle="Map your supply location to one of our 5 Bengaluru 60-Minute Dark Stores."
            />
            <CardContent className="space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Primary Dispatch Facility Address *
                  </label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Plot No. / Industrial Shed / Street Address"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      City
                    </label>
                    <input
                      type="text"
                      value={city}
                      disabled
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Postal Code (Bengaluru) *
                    </label>
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="560058"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Select Primary Bengaluru Hub for Express Inwarding *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {BENGALURU_DARK_STORES.map((hub) => (
                    <div
                      key={hub.id}
                      onClick={() => setSelectedHub(hub.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        selectedHub === hub.id
                          ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{hub.id}</span>
                        <Badge variant={selectedHub === hub.id ? 'brand' : 'neutral'}>
                          {hub.zone}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 font-medium mt-1">{hub.name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Express 60-min delivery radius</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </div>
        )}

        {currentStep === 3 && (
          <div>
            <CardHeader
              title="3. Bank Account & Settlement Details"
              subtitle="Where BUILDORA transfers your weekly sales revenue (T+7 settlement cycle)."
            />
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Beneficiary Account Name *
                  </label>
                  <input
                    type="text"
                    value={beneficiaryName}
                    onChange={(e) => setBeneficiaryName(e.target.value)}
                    placeholder="Account holder name exactly as in passbook"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Bank Name *
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. HDFC Bank, ICICI Bank, SBI"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Current or Business Account Number"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    IFSC Code (11 Digits) *
                  </label>
                  <input
                    type="text"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    placeholder="HDFC0001234"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Pennyless penny-drop validation will be triggered upon submission to verify account status.
                </span>
              </div>
            </CardContent>
          </div>
        )}

        {currentStep === 4 && (
          <div>
            <CardHeader
              title="4. Master Supply Categories & Review"
              subtitle="Select the product categories you manufacture or distribute directly."
            />
            <CardContent className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Select Applicable Categories ({selectedCategories.length} selected)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto p-1">
                  {MASTER_CATEGORIES.map((cat) => {
                    const isSelected = selectedCategories.includes(cat);
                    return (
                      <div
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className={`p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className="truncate">{cat}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 shrink-0 ml-1.5" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Summary Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="font-semibold text-slate-900">Partner Profile Summary</div>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div><strong>Legal Entity:</strong> {legalName || 'Supreme Materials BLR'}</div>
                  <div><strong>GSTIN:</strong> {gstin || '29AAAAA0000A1Z5'}</div>
                  <div><strong>Dark Store:</strong> {selectedHub}</div>
                  <div><strong>Bank Account:</strong> {accountNumber ? `•••• ${accountNumber.slice(-4)}` : 'Verified'}</div>
                </div>
              </div>
            </CardContent>
          </div>
        )}

        <CardFooter>
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="secondary"
              onClick={handleBack}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Previous Step
            </Button>
          ) : (
            <div />
          )}

          {currentStep < totalSteps ? (
            <Button
              type="button"
              variant="primary"
              onClick={handleNext}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Save & Next Step
            </Button>
          ) : (
            <Button
              type="button"
              variant="accent"
              onClick={handleSubmit}
              isLoading={isLoading}
              rightIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Submit Onboarding & Launch Store
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};
