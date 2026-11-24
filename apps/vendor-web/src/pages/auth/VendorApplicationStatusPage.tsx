import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useVendorAuthStore } from '../../store/useVendorAuthStore';
import { vendorApi } from '../../services/vendorApi';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
  Building2,
  Mail,
  Phone,
  RefreshCw,
  LogOut,
  ArrowRight
} from 'lucide-react';

export const VendorApplicationStatusPage: React.FC = () => {
  const navigate = useNavigate();
  const { vendor, logout, fetchProfile } = useVendorAuthStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusData, setStatusData] = useState<any>(null);

  const loadStatus = async () => {
    setIsRefreshing(true);
    try {
      const data = await vendorApi.getRegistrationStatus();
      setStatusData(data);
      if (data.status === 'APPROVED' || data.status === 'ACTIVE') {
        navigate('/dashboard');
      } else if (data.status === 'REJECTED') {
        navigate('/rejection-details');
      } else if (data.status === 'SUSPENDED') {
        navigate('/account-restricted');
      }
    } catch {}
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const currentStatus = statusData?.status || vendor?.status || 'SUBMITTED';

  return (
    <div className="w-full bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-[#E2E8F0] space-y-7 animate-in fade-in-0 duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#203D91] border border-blue-200">
            <Clock className="w-3.5 h-3.5" />
            Application Under Review
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#17233C] tracking-tight mt-2">
            Supplier Verification in Progress
          </h2>
        </div>
        <button
          type="button"
          onClick={loadStatus}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#203D91] border border-blue-200 bg-blue-50/50 hover:bg-blue-100 self-start sm:self-center cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          Check Live Status
        </button>
      </div>

      {/* Progress Timeline */}
      <div className="p-5 rounded-2xl bg-[#F4F7FC] border border-[#E2E8F0] space-y-4">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Compliance Review Pipeline
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {[
            { step: '1', title: 'Submitted', done: true, desc: 'Completed online' },
            {
              step: '2',
              title: 'KYC & GST Review',
              done: currentStatus === 'UNDER_REVIEW' || currentStatus === 'APPROVED',
              desc: 'Tax & Entity validation'
            },
            {
              step: '3',
              title: 'Hub Allocation',
              done: currentStatus === 'APPROVED',
              desc: 'Dark Store connection'
            },
            {
              step: '4',
              title: 'Dashboard Live',
              done: currentStatus === 'APPROVED',
              desc: 'Live contractor dispatch'
            }
          ].map((item, idx) => (
            <div
              key={item.step}
              className={`p-3.5 rounded-xl border bg-white ${
                item.done
                  ? 'border-emerald-200 text-emerald-900 shadow-xs'
                  : 'border-slate-200 text-slate-500 opacity-70'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {item.done ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <span className="w-4 h-4 rounded-full border border-slate-300 text-[10px] flex items-center justify-center font-bold">
                    {item.step}
                  </span>
                )}
                <span className="text-xs font-bold truncate">{item.title}</span>
              </div>
              <p className="text-[11px] text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Turnaround Guarantee Banner */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
        <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold text-amber-950">Estimated Review Time: 24 to 48 Hours</p>
          <p className="text-amber-800 leading-relaxed">
            Our merchant onboarding compliance team in Peenya is reviewing your GST registration, bank mandate, and batch test certifications. You will receive an SMS and email notification the moment your account is activated.
          </p>
        </div>
      </div>

      {/* Summary of Submitted Details */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-[#17233C] uppercase tracking-wider">
          Submitted Application Summary
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-500 text-[11px]">Store Trade Name</span>
            <p className="font-bold text-[#17233C]">{statusData?.storeName || vendor?.storeName || 'N/A'}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-500 text-[11px]">Legal Entity</span>
            <p className="font-bold text-[#17233C]">{statusData?.legalName || vendor?.businessInfo?.businessName || 'Registered Enterprise'}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-500 text-[11px]">Official Email</span>
            <p className="font-bold text-[#17233C]">{vendor?.email}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-500 text-[11px]">Primary Mobile</span>
            <p className="font-bold text-[#17233C]">{vendor?.phone}</p>
          </div>
        </div>
      </div>

      {/* Uploaded Documents List */}
      {statusData?.kycDocuments && statusData.kycDocuments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-[#17233C]">Submitted Verification Documents</h4>
          <div className="space-y-1.5">
            {statusData.kycDocuments.map((doc: any) => (
              <div
                key={doc.id}
                className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#203D91]" />
                  <span className="font-medium text-slate-800">{doc.title}</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-[#203D91] border border-blue-200">
                  {doc.verificationStatus}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Support & Logout */}
      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="text-slate-500">
          Need priority onboarding assistance?{' '}
          <a href="mailto:vendors@buildora.com" className="font-bold text-[#203D91] hover:underline">
            vendors@buildora.com
          </a>
        </div>
        <button
          type="button"
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </div>
  );
};
