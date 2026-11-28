import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVendorAuthStore } from '../../store/useVendorAuthStore';
import { vendorApi } from '../../services/vendorApi';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Copy,
  Check,
  RefreshCw,
  LogOut,
  Building2,
  ArrowRight,
  FileEdit,
  ShieldAlert,
  FileText,
  UploadCloud
} from 'lucide-react';

export const VendorApplicationStatusPage: React.FC = () => {
  const { applicationId: routeAppId } = useParams<{ applicationId?: string }>();
  const navigate = useNavigate();
  const { vendor, logout, fetchProfile } = useVendorAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [replacingDocType, setReplacingDocType] = useState<string | null>(null);
  const [statusData, setStatusData] = useState<any>(null);

  const loadStatus = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const freshProfile = await fetchProfile();
      const res = await vendorApi.getRegistrationStatus();
      setStatusData({
        applicationId: res.applicationId || routeAppId || freshProfile?.applicationId || 'APP-BLR-PENDING',
        status: res.status || freshProfile?.status || 'SUBMITTED',
        storeName: res.storeName || freshProfile?.storeName || 'N/A',
        email: res.email || freshProfile?.email || 'N/A',
        phone: res.phone || freshProfile?.phone || '',
        submittedAt: res.submittedAt || freshProfile?.submittedAt || new Date().toISOString(),
        logoUrl: res.logoUrl || freshProfile?.logoUrl || freshProfile?.businessInfo?.logo,
        rejectionReason: res.rejectionReason || freshProfile?.rejectionReason,
        resubmissionReason: res.resubmissionReason || freshProfile?.resubmissionReason,
        suspendedReason: res.suspendedReason || freshProfile?.suspendedReason,
        kycDocuments: res.kycDocuments || freshProfile?.kycDocuments || [],
        gstStatus: res.gstStatus || freshProfile?.gstStatus,
        gstin: res.gstin || freshProfile?.businessInfo?.gstin,
        msmeStatus: res.msmeStatus || freshProfile?.msmeStatus,
        udyamNumber: res.udyamNumber || freshProfile?.udyamNumber,
        maskedPan: res.maskedPan || freshProfile?.panMasked,
        maskedAadhaar: res.maskedAadhaar || freshProfile?.aadhaarMasked,
        bankVerificationStatus:
          res.bankVerificationStatus || freshProfile?.businessInfo?.bankDetails?.verificationStatus,
      });
    } catch {
      if (vendor) {
        setStatusData({
          applicationId: routeAppId || vendor.applicationId || 'APP-BLR-PENDING',
          status: vendor.status,
          storeName: vendor.storeName || 'N/A',
          email: vendor.email || 'N/A',
          phone: vendor.phone || '',
          submittedAt: vendor.submittedAt || vendor.createdAt || new Date().toISOString(),
          logoUrl: vendor.logoUrl || vendor.businessInfo?.logo,
          rejectionReason: vendor.rejectionReason,
          resubmissionReason: vendor.resubmissionReason,
          suspendedReason: vendor.suspendedReason,
          kycDocuments: vendor.kycDocuments || [],
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStatus(false);
  }, [routeAppId]);

  const maskPhone = (phone?: string) => {
    if (!phone) return 'Not Provided';
    const digits = phone.replace(/\D/g, '').slice(-10);
    if (digits.length < 4) return '••••••••••';
    return `+91 ••••••${digits.slice(-4)}`;
  };

  const copyId = () => {
    if (!statusData?.applicationId) return;
    navigator.clipboard.writeText(statusData.applicationId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="w-full bg-white rounded-3xl p-10 shadow-xl border border-[#E7E5E4] text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-[#943D24] animate-spin mx-auto" />
        <p className="text-xs font-semibold text-[#78716C]">Loading application status...</p>
      </div>
    );
  }

  const currentStatus = statusData?.status || 'SUBMITTED';

  const getStatusMeta = (st: string) => {
    switch (st) {
      case 'APPROVED':
      case 'ACTIVE':
        return {
          label: 'Approved',
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
          message: 'Your vendor account has been approved. You can now access your Vendor Dashboard.'
        };
      case 'UNDER_REVIEW':
        return {
          label: 'Under Review',
          badgeClass: 'bg-[#FBF3F0] text-[#943D24] border-[#943D24]/25',
          icon: <Clock className="w-5 h-5 text-[#943D24]" />,
          message: 'Our team is reviewing your business and verification details.'
        };
      case 'REJECTED':
        return {
          label: 'Rejected',
          badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: <XCircle className="w-5 h-5 text-rose-600" />,
          message: 'Your application was not approved. Please review the reason provided.'
        };
      case 'RESUBMISSION_REQUIRED':
        return {
          label: 'Resubmission Required',
          badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
          icon: <AlertCircle className="w-5 h-5 text-amber-600" />,
          message: 'Please update the requested information and resubmit your application.'
        };
      case 'SUSPENDED':
        return {
          label: 'Suspended',
          badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: <ShieldAlert className="w-5 h-5 text-rose-600" />,
          message: 'Your vendor account has been suspended. Please contact BUILDORA support.'
        };
      case 'SUBMITTED':
      default:
        return {
          label: 'Submitted',
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
          message: 'Your application has been successfully submitted.'
        };
    }
  };

  const meta = getStatusMeta(currentStatus);

  return (
    <div className="w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#E7E5E4] space-y-6 animate-in fade-in-0 duration-200">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4 border-b border-[#E7E5E4] pb-4">
        <div className="min-w-0 flex-1">
          <span className="inline-block px-2.5 py-0.5 rounded-md bg-[#FBF3F0] text-[#943D24] text-[10px] font-extrabold uppercase tracking-wider mb-1">
            Application Status
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-[#292524] tracking-tight break-words">
            Vendor Application Submitted
          </h2>
        </div>

        <button
          type="button"
          onClick={() => loadStatus(true)}
          disabled={refreshing}
          className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#943D24] bg-[#FBF3F0] border border-[#E7E5E4] hover:bg-[#FBF3F0] flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Status Explanation Card */}
      <div className={`p-4 rounded-2xl border flex items-start gap-3 ${meta.badgeClass}`}>
        <div className="shrink-0 mt-0.5">{meta.icon}</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-wider">Status: {meta.label}</span>
          </div>
          <p className="text-xs font-medium leading-relaxed">{meta.message}</p>
        </div>
      </div>

      {/* Rejection / Resubmission / Suspension Reason */}
      {(statusData?.rejectionReason || statusData?.resubmissionReason || statusData?.suspendedReason) && (
        <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 block">
            {currentStatus === 'RESUBMISSION_REQUIRED' ? 'Requested Updates' : 'Reason Provided'}
          </span>
          <p className="text-xs text-rose-900 font-medium leading-relaxed">
            {statusData.resubmissionReason || statusData.rejectionReason || statusData.suspendedReason}
          </p>
        </div>
      )}

      {/* Application Summary Details */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#FBF3F0] border border-[#E7E5E4] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E7E5E4]/80 pb-3">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#78716C] block">
              Application Reference ID
            </span>
            <div className="flex items-center gap-2 mt-0.5 min-w-0">
              <span className="font-mono text-sm sm:text-base font-black text-[#943D24] break-all">
                {statusData?.applicationId}
              </span>
              <button
                type="button"
                onClick={copyId}
                className="p-1 rounded-md text-[#78716C] hover:text-[#943D24] hover:bg-white cursor-pointer"
                title="Copy Reference ID"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {statusData?.logoUrl ? (
            <img
              src={statusData.logoUrl}
              alt="Business Logo"
              className="w-12 h-12 rounded-xl object-cover border border-[#E7E5E4] bg-white"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl border border-[#E7E5E4] bg-white flex items-center justify-center text-[#943D24]/50">
              <Building2 className="w-5 h-5" />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-[#78716C] block text-[11px]">Business / Store Name</span>
            <span className="font-bold text-[#292524]">{statusData?.storeName}</span>
          </div>
          <div>
            <span className="text-[#78716C] block text-[11px]">Submission Date</span>
            <span className="font-bold text-[#292524]">
              {new Date(statusData?.submittedAt).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })}
            </span>
          </div>
          <div>
            <span className="text-[#78716C] block text-[11px]">Registered Email</span>
            <span className="font-semibold text-[#292524] break-all">{statusData?.email}</span>
          </div>
          <div>
            <span className="text-[#78716C] block text-[11px]">Registered Mobile</span>
            <span className="font-semibold text-[#292524]">{maskPhone(statusData?.phone)}</span>
          </div>
        </div>
      </div>

      {/* Submitted KYC Documents & Inline Correction Upload */}
      {Array.isArray(statusData?.kycDocuments) && statusData.kycDocuments.length > 0 && (
        <div className="p-4 rounded-2xl bg-white border border-[#E7E5E4] space-y-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#78716C] block">
            KYC & Verification Documents
          </span>
          <div className="divide-y divide-[#E7E5E4]">
            {statusData.kycDocuments.map((doc: any) => {
              const docSt = doc.verificationStatus || doc.status || 'PENDING';
              return (
                <div key={doc.id} className="py-2.5 space-y-1.5 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-3.5 h-3.5 text-[#943D24] shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-[#292524] truncate">{doc.title || doc.type}</p>
                        <p className="text-[11px] text-[#78716C] truncate">
                          {doc.fileName}
                          {doc.identificationNumberMasked ? ` • ID: ${doc.identificationNumberMasked}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          docSt === 'VERIFIED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : docSt === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {docSt}
                      </span>
                      {docSt === 'REJECTED' && (
                        <button
                          type="button"
                          disabled={replacingDocType === doc.type}
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept =
                              '.pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp';
                            input.onchange = async (ev: any) => {
                              const file: File | undefined = ev.target.files?.[0];
                              if (!file) return;
                              setReplacingDocType(doc.type);
                              try {
                                await vendorApi.replaceKycDocumentFile(
                                  file,
                                  doc.type,
                                  doc.title || doc.type
                                );
                                await loadStatus(true);
                              } finally {
                                setReplacingDocType(null);
                              }
                            };
                            input.click();
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#943D24] text-white text-[11px] font-semibold hover:bg-[#7D331E] cursor-pointer disabled:opacity-50"
                        >
                          <UploadCloud className="w-3 h-3" />
                          {replacingDocType === doc.type ? 'Uploading...' : 'Upload Corrected File'}
                        </button>
                      )}
                    </div>
                  </div>
                  {docSt === 'REJECTED' && doc.rejectionReason && (
                    <p className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1.5">
                      Rejection Reason: {doc.rejectionReason}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#E7E5E4]">
        {(currentStatus === 'APPROVED' || currentStatus === 'ACTIVE') && (
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto py-3 px-6 rounded-xl text-sm font-bold bg-[#943D24] text-white hover:bg-[#7D331E] flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#943D24]/20"
          >
            <span>Go to Vendor Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}

        {(currentStatus === 'RESUBMISSION_REQUIRED' || currentStatus === 'REJECTED') && (
          <button
            type="button"
            onClick={() => navigate('/register?step=1')}
            className="w-full sm:w-auto py-3 px-6 rounded-xl text-xs font-bold bg-[#F6C453] text-[#292524] hover:bg-[#F6C453] flex items-center justify-center gap-2 cursor-pointer"
          >
            <FileEdit className="w-4 h-4" />
            <span>Edit & Resubmit Application</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="w-full sm:w-auto py-2.5 px-4 rounded-xl text-xs font-bold text-[#78716C] border border-[#E7E5E4] hover:bg-[#F8F7F5] flex items-center justify-center gap-1.5 cursor-pointer ml-auto"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default VendorApplicationStatusPage;
