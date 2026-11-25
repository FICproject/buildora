import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useVendorAuthStore } from '../../store/useVendorAuthStore';
import {
  ShieldAlert,
  PhoneCall,
  Mail,
  LogOut,
  AlertOctagon,
  FileText
} from 'lucide-react';

export const VendorRestrictedPage: React.FC = () => {
  const navigate = useNavigate();
  const { vendor, logout } = useVendorAuthStore();

  const reason =
    vendor?.rejectionReason ||
    'Account suspended due to compliance review on material test certificates for dispatches to Bengaluru dark store hubs.';

  return (
    <div className="w-full bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-[#E7E5E4] space-y-6 animate-in fade-in-0 duration-200">
      {/* Restricted Header */}
      <div className="flex items-center gap-3.5 pb-4 border-b border-[#E7E5E4]">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
          <AlertOctagon className="w-6 h-6" />
        </div>
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
            Account Restricted
          </span>
          <h2 className="text-2xl font-black text-[#292524] tracking-tight">
            Supplier Access Suspended
          </h2>
        </div>
      </div>

      {/* Notice Card */}
      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2 text-xs">
        <h4 className="font-bold text-amber-950 flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-amber-700" />
          Reason for Account Restriction:
        </h4>
        <p className="text-amber-900 leading-relaxed font-medium bg-white/80 p-3 rounded-xl border border-amber-200">
          "{reason}"
        </p>
      </div>

      {/* Guidance */}
      <div className="p-4 rounded-2xl bg-[#FBF3F0] border border-[#E7E5E4] text-xs text-[#78716C] space-y-2 leading-relaxed">
        <p>
          While your account is in restricted status, live dark store dispatch notifications and catalog editing are temporarily frozen. Existing delivered order settlements will continue through regular audit reconciliation.
        </p>
        <p>
          To reinstate active dispatch privileges, please contact the <strong>Buildora Merchant Compliance Team</strong> with the necessary batch test certificates or compliance documents.
        </p>
      </div>

      {/* Escalation Contact Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <a
          href="tel:18006028453"
          className="p-3.5 rounded-2xl border border-[#E7E5E4] bg-white hover:border-blue-300 transition-all flex items-center gap-3 text-xs"
        >
          <div className="w-9 h-9 rounded-xl bg-[#FBF3F0] text-[#943D24] flex items-center justify-center shrink-0">
            <PhoneCall className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-[#292524]">Call Compliance Lead</span>
            <p className="text-[11px] text-[#78716C]">1800-60-BUILD (Toll-Free)</p>
          </div>
        </a>

        <a
          href="mailto:compliance@buildora.in"
          className="p-3.5 rounded-2xl border border-[#E7E5E4] bg-white hover:border-blue-300 transition-all flex items-center gap-3 text-xs"
        >
          <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#943D24] flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-[#292524]">Email Merchant Desk</span>
            <p className="text-[11px] text-[#78716C]">compliance@buildora.in</p>
          </div>
        </a>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-[#E7E5E4] flex items-center justify-between">
        <span className="text-[11px] text-[#78716C]">
          Store ID: {vendor?.id || 'VND-BLR-00'}
        </span>
        <button
          type="button"
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#78716C] hover:text-rose-600 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </div>
  );
};
