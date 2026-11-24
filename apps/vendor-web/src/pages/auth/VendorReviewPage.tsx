import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useVendorAuthStore } from '../../store/useVendorAuthStore';
import { vendorApi } from '../../services/vendorApi';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Copy,
  Check,
  FileText,
  Building2,
  User,
  MapPin,
  CreditCard,
  Download,
  LogOut,
  Mail,
  Phone,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  HelpCircle
} from 'lucide-react';

export const VendorReviewPage: React.FC = () => {
  const { applicationId: routeAppId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const { vendor, logout } = useVendorAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [applicationData, setApplicationData] = useState<any>(null);

  // Expanded sections state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    account: true,
    business: true,
    address: true,
    kyc: true,
    bank: true
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const effectiveAppId = routeAppId || vendor?.applicationId || (vendor?.id ? `APP-BLR-2026-${vendor.id.slice(-6)}` : '');

  const fetchDetails = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      if (effectiveAppId) {
        try {
          const res = await vendorApi.getApplicationDetails(effectiveAppId);
          if (res?.application) {
            setApplicationData(res.application);
            if (res.application.status === 'APPROVED' || res.application.status === 'ACTIVE') {
              navigate('/dashboard');
              return;
            }
            return;
          }
        } catch {
          // Fall back to getRegistrationStatus
        }
      }

      // Fallback to getRegistrationStatus
      const statusRes = await vendorApi.getRegistrationStatus();
      if (statusRes?.status === 'APPROVED' || statusRes?.status === 'ACTIVE') {
        navigate('/dashboard');
        return;
      }
      setApplicationData({
        applicationId: statusRes.applicationId || effectiveAppId || 'APP-BLR-2026-PENDING',
        status: statusRes.status || 'SUBMITTED',
        submittedAt: statusRes.submittedAt || statusRes.updatedAt || new Date().toISOString(),
        storeName: statusRes.storeName || vendor?.storeName || 'N/A',
        businessName: statusRes.legalName || vendor?.businessInfo?.businessName || 'N/A',
        ownerName: vendor?.name || 'N/A',
        email: statusRes.email || vendor?.email || 'N/A',
        phone: statusRes.phone || vendor?.phone || 'N/A',
        accountDetails: {
          ownerName: vendor?.name || 'N/A',
          email: vendor?.email || 'N/A',
          phone: vendor?.phone || 'N/A',
          isEmailVerified: true,
          isPhoneVerified: true
        },
        businessDetails: {
          legalBusinessName: statusRes.legalName || vendor?.businessInfo?.businessName || 'N/A',
          storeName: statusRes.storeName || vendor?.storeName || 'N/A',
          businessType: vendor?.businessInfo?.businessType || 'N/A',
          categories: vendor?.categories || []
        },
        addressDetails: {
          completeAddress: vendor?.businessInfo?.address?.building || 'Address on file',
          city: vendor?.businessInfo?.address?.city || 'Bengaluru',
          state: vendor?.businessInfo?.address?.state || 'Karnataka',
          pincode: vendor?.businessInfo?.address?.pincode || '560001'
        },
        kycDetails: {
          gstin: vendor?.businessInfo?.gstin || 'Not Provided',
          pan: statusRes.maskedPan || (vendor?.businessInfo?.pan ? `${vendor.businessInfo.pan.slice(0, 5)}••••${vendor.businessInfo.pan.slice(-1)}` : '••••••••••')
        },
        bankDetails: {
          accountHolderName: vendor?.businessInfo?.bankDetails?.accountHolderName || 'On File',
          bankName: vendor?.businessInfo?.bankDetails?.bankName || 'On File',
          accountNumber: statusRes.maskedBankAcc || (vendor?.businessInfo?.bankDetails?.accountNumber ? `••••••••${vendor.businessInfo.bankDetails.accountNumber.slice(-4)}` : '••••••••'),
          ifsc: vendor?.businessInfo?.bankDetails?.ifsc || 'On File',
          accountType: 'CURRENT'
        },
        documents: (statusRes.kycDocuments || vendor?.kycDocuments || []).map((d: any) => ({
          id: d.id,
          title: d.title || d.fileName || 'KYC Document',
          fileName: d.fileName || 'Document.pdf',
          fileSize: d.fileSize || 0,
          verificationStatus: d.verificationStatus || 'PENDING'
        }))
      });
    } catch (err: any) {
      setError(err.message || 'Unable to load application details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [effectiveAppId]);

  const copyApplicationId = () => {
    const idToCopy = applicationData?.applicationId || effectiveAppId;
    if (idToCopy) {
      navigator.clipboard.writeText(idToCopy);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleDownloadSummary = () => {
    if (!applicationData) return;
    const summaryText = `BUILDORA 60 - VENDOR APPLICATION SUMMARY
==================================================
Application ID: ${applicationData.applicationId}
Status: ${applicationData.status}
Submission Date: ${new Date(applicationData.submittedAt).toLocaleString()}

BUSINESS INFORMATION
--------------------
Store / Trade Name: ${applicationData.storeName || 'N/A'}
Legal Entity: ${applicationData.businessName || 'N/A'}
Business Type: ${applicationData.businessDetails?.businessType || 'N/A'}

AUTHORIZED CONTACT
------------------
Authorized Person: ${applicationData.ownerName || 'N/A'}
Registered Email: ${applicationData.email || 'N/A'}
Registered Mobile: ${applicationData.phone || 'N/A'}

REGISTERED ADDRESS
------------------
Address: ${applicationData.addressDetails?.completeAddress || 'N/A'}
City: ${applicationData.addressDetails?.city || 'N/A'}
State: ${applicationData.addressDetails?.state || 'N/A'}
Pincode: ${applicationData.addressDetails?.pincode || 'N/A'}

TAX & KYC (MASKED FOR SECURITY)
-------------------------------
GSTIN: ${applicationData.kycDetails?.gstin || 'N/A'}
PAN: ${applicationData.kycDetails?.pan || 'N/A'}

BANK SETTLEMENT (MASKED)
------------------------
Bank Name: ${applicationData.bankDetails?.bankName || 'N/A'}
Account Holder: ${applicationData.bankDetails?.accountHolderName || 'N/A'}
Account Number: ${applicationData.bankDetails?.accountNumber || 'N/A'}
IFSC Code: ${applicationData.bankDetails?.ifsc || 'N/A'}

UPLOADED DOCUMENTS (${applicationData.documents?.length || 0})
------------------
${(applicationData.documents || []).map((d: any, idx: number) => `${idx + 1}. ${d.title || d.fileName} [Status: ${d.verificationStatus || 'PENDING'}]`).join('\n')}

==================================================
Buildora Tech Pvt Ltd | Peenya Dark Store Network
Need assistance? Contact vendors@buildora.in
`;

    const blob = new Blob([summaryText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Buildora_Vendor_Application_${applicationData.applicationId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Render Status Badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#203D91] border border-blue-200">
            <Clock className="w-3.5 h-3.5 text-[#203D91]" />
            Submitted
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Under Review
          </span>
        );
      case 'APPROVED':
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3.5 h-3.5" />
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="w-full bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-[#E2E8F0] flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <RefreshCw className="w-8 h-8 text-[#203D91] animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Retrieving application details...</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-[#E2E8F0] space-y-7 animate-in fade-in-0 duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-[#203D91] text-white flex items-center justify-center font-black text-sm">
              B
            </div>
            <span className="text-xs font-black tracking-wider text-[#203D91] uppercase">
              BUILDORA 60
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#17233C] tracking-tight">
            Registration Submitted Successfully
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Your vendor application has been received and queued for compliance verification.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchDetails(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#203D91] border border-blue-200 bg-blue-50/60 hover:bg-blue-100 self-start sm:self-center cursor-pointer transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Status'}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Application Information Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
              Application Reference ID
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-lg sm:text-xl font-mono font-black text-[#203D91]">
                {applicationData?.applicationId || effectiveAppId}
              </span>
              <button
                type="button"
                onClick={copyApplicationId}
                className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-500 transition-colors"
                title="Copy Application ID"
              >
                {copiedId ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Current Status:</span>
            {renderStatusBadge(applicationData?.status || 'SUBMITTED')}
          </div>
        </div>

        {/* 4 Metadata Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs pt-1">
          <div>
            <span className="text-slate-500 text-[11px] block">Business / Store Name</span>
            <p className="font-bold text-[#17233C] mt-0.5 truncate">
              {applicationData?.storeName || 'N/A'}
            </p>
          </div>
          <div>
            <span className="text-slate-500 text-[11px] block">Registered Email</span>
            <p className="font-bold text-[#17233C] mt-0.5 truncate">
              {applicationData?.email || 'N/A'}
            </p>
          </div>
          <div>
            <span className="text-slate-500 text-[11px] block">Registered Mobile</span>
            <p className="font-bold text-[#17233C] mt-0.5">
              {applicationData?.phone || 'N/A'}
            </p>
          </div>
          <div>
            <span className="text-slate-500 text-[11px] block">Submission Date</span>
            <p className="font-bold text-[#17233C] mt-0.5">
              {applicationData?.submittedAt
                ? new Date(applicationData.submittedAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })
                : 'Today'}
            </p>
          </div>
        </div>
      </div>

      {/* Grouped Application Summary Sections */}
      <div className="space-y-3">
        <h3 className="text-sm font-black text-[#17233C] uppercase tracking-wider">
          Submitted Application Summary
        </h3>

        {/* 1. Account Details */}
        <div className="border border-[#E2E8F0] rounded-2xl overflow-hidden bg-white">
          <button
            type="button"
            onClick={() => toggleSection('account')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/70 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#203D91] flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#17233C]">1. Account Details</h4>
                <p className="text-[11px] text-slate-500">Authorized signatory and primary contact credentials</p>
              </div>
            </div>
            {expandedSections.account ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>
          {expandedSections.account && (
            <div className="p-4 pt-1 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-[#FBFCFE]">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[11px] block">Owner / Authorized Name</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {applicationData?.accountDetails?.ownerName || applicationData?.ownerName || 'N/A'}
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[11px] block">Official Email</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {applicationData?.accountDetails?.email || applicationData?.email || 'N/A'}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold inline-flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3 h-3" /> OTP Verified
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[11px] block">Mobile Number</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {applicationData?.accountDetails?.phone || applicationData?.phone || 'N/A'}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold inline-flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3 h-3" /> OTP Verified
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 2. Business Details */}
        <div className="border border-[#E2E8F0] rounded-2xl overflow-hidden bg-white">
          <button
            type="button"
            onClick={() => toggleSection('business')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/70 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#FF7417] flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#17233C]">2. Business Details</h4>
                <p className="text-[11px] text-slate-500">Legal entity, trade name, and supply capabilities</p>
              </div>
            </div>
            {expandedSections.business ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>
          {expandedSections.business && (
            <div className="p-4 pt-1 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs bg-[#FBFCFE]">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[11px] block">Legal Entity Name</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {applicationData?.businessDetails?.legalBusinessName || applicationData?.businessName || 'N/A'}
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[11px] block">Store / Trade Name</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {applicationData?.businessDetails?.storeName || applicationData?.storeName || 'N/A'}
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[11px] block">Business Type</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {applicationData?.businessDetails?.businessType || 'N/A'}
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[11px] block">Supplied Categories</span>
                <span className="font-semibold text-slate-800 mt-0.5 block truncate">
                  {Array.isArray(applicationData?.businessDetails?.categories) && applicationData.businessDetails.categories.length > 0
                    ? applicationData.businessDetails.categories.join(', ')
                    : 'General Building Materials'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 3. Address Details */}
        <div className="border border-[#E2E8F0] rounded-2xl overflow-hidden bg-white">
          <button
            type="button"
            onClick={() => toggleSection('address')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/70 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#203D91] flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#17233C]">3. Registered Address</h4>
                <p className="text-[11px] text-slate-500">Official business location and dispatch hub</p>
              </div>
            </div>
            {expandedSections.address ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>
          {expandedSections.address && (
            <div className="p-4 pt-1 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-[#FBFCFE]">
              <div className="sm:col-span-2 p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[11px] block">Registered Address</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {applicationData?.addressDetails?.completeAddress || 'N/A'}
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[11px] block">City, State & Pincode</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {[
                    applicationData?.addressDetails?.city,
                    applicationData?.addressDetails?.state,
                    applicationData?.addressDetails?.pincode
                  ]
                    .filter(Boolean)
                    .join(', ') || 'N/A'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 4. KYC & Tax Details (Masked) */}
        <div className="border border-[#E2E8F0] rounded-2xl overflow-hidden bg-white">
          <button
            type="button"
            onClick={() => toggleSection('kyc')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/70 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#17233C]">4. KYC & Tax Identifiers</h4>
                <p className="text-[11px] text-slate-500">GSTIN and masked PAN details</p>
              </div>
            </div>
            {expandedSections.kyc ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>
          {expandedSections.kyc && (
            <div className="p-4 pt-1 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#FBFCFE]">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[11px] block">GSTIN</span>
                <span className="font-mono font-bold text-[#203D91] mt-0.5 block">
                  {applicationData?.kycDetails?.gstin || 'Not Provided'}
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[11px] block">PAN (Masked)</span>
                <span className="font-mono font-bold text-slate-800 mt-0.5 block">
                  {applicationData?.kycDetails?.pan || '••••••••••'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 5. Bank Settlement Details (Masked) */}
        <div className="border border-[#E2E8F0] rounded-2xl overflow-hidden bg-white">
          <button
            type="button"
            onClick={() => toggleSection('bank')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/70 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#17233C]">5. Bank Settlement Information</h4>
                <p className="text-[11px] text-slate-500">Bank name, IFSC, and masked account number for payouts</p>
              </div>
            </div>
            {expandedSections.bank ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>
          {expandedSections.bank && (
            <div className="p-4 pt-1 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-[#FBFCFE]">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[11px] block">Bank Name</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {applicationData?.bankDetails?.bankName || 'N/A'}
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[11px] block">Account Number (Masked)</span>
                <span className="font-mono font-bold text-slate-800 mt-0.5 block">
                  {applicationData?.bankDetails?.accountNumber || '••••••••'}
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[11px] block">IFSC Code</span>
                <span className="font-mono font-bold text-[#203D91] mt-0.5 block">
                  {applicationData?.bankDetails?.ifsc || 'N/A'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Uploaded Documents */}
      <div className="space-y-3">
        <h3 className="text-sm font-black text-[#17233C] uppercase tracking-wider">
          Uploaded Documents
        </h3>
        {applicationData?.documents && applicationData.documents.length > 0 ? (
          <div className="space-y-2">
            {applicationData.documents.map((doc: any) => {
              const status = doc.verificationStatus || 'PENDING';
              const isVerified = status === 'VERIFIED';
              return (
                <div
                  key={doc.id || doc.fileName}
                  className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#203D91] flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{doc.title || doc.fileName}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {doc.fileName} • {doc.fileSize ? `${Math.round(doc.fileSize / 1024)} KB` : 'Uploaded'}
                      </p>
                    </div>
                  </div>
                  <div>
                    {isVerified ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        Pending Review
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
            No document attachments submitted.
          </div>
        )}
      </div>

      {/* Next Steps Notification Note */}
      <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-[#203D91] text-xs flex items-start gap-3">
        <Clock className="w-5 h-5 text-[#203D91] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-[#17233C] text-sm">Next Steps & Verification Notice</p>
          <p className="text-slate-600 leading-relaxed">
            Your application is now awaiting verification. We will notify you through your registered email or mobile number when the review is completed.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadSummary}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold bg-white text-[#203D91] border border-blue-200 hover:bg-blue-50 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download Application Summary
          </button>
          <a
            href="mailto:vendors@buildora.in?subject=Application%20Inquiry%20-%20"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-slate-600 hover:text-[#203D91] hover:bg-slate-100 transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            Contact Support (vendors@buildora.in)
          </a>
        </div>

        <button
          type="button"
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="inline-flex items-center gap-1.5 font-bold text-slate-500 hover:text-rose-600 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <LogOut className="w-3.5 h-3.5" />
          Return to Login
        </button>
      </div>
    </div>
  );
};

export default VendorReviewPage;
