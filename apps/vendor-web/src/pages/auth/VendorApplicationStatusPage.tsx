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
  ShieldAlert
} from 'lucide-react';

export const VendorApplicationStatusPage: React.FC = () => {
  const { applicationId: routeAppId } = useParams<{ applicationId?: string }>();
  const navigate = useNavigate();
  const { vendor, logout, fetchProfile } = useVendorAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
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
        suspendedReason: res.suspendedReason || freshProfile?.suspendedReason
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
          suspendedReason: vendor.suspendedReason
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
      <div className="flex items-start justify-between gap-4 border-b border-[#E7E5E4] pb-4">
        <div>
          <span className="inline-block px-2.5 py-0.5 rounded-md bg-[#FBF3F0] text-[#943D24] text-[10px] font-extrabold uppercase tracking-wider mb-1">
            Application Status
          </span>
          <h2 className="text-2xl font-black text-[#292524] tracking-tight">
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
      <div className="p-5 rounded-2xl bg-[#FBF3F0] border border-[#E7E5E4] space-y-4">
        <div className="flex items-center justify-between border-b border-[#E7E5E4]/80 pb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#78716C] block">
              Application Reference ID
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-base font-black text-[#943D24]">
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
