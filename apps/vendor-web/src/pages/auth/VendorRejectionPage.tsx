import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVendorAuthStore } from '../../store/useVendorAuthStore';
import { vendorApi } from '../../services/vendorApi';
import {
  AlertTriangle,
  FileEdit,
  ArrowRight,
  LogOut,
  HelpCircle,
  UploadCloud,
  CheckCircle2,
  Clock
} from 'lucide-react';

export const VendorRejectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { vendor, logout, fetchProfile } = useVendorAuthStore();

  const [resubmitNotes, setResubmitNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const rejectionReason =
    vendor?.rejectionReason ||
    'The uploaded GST Registration Certificate is blurred and illegible. Please upload a clear original color PDF scan of Form GST REG-06 showing principal place of business.';

  const handleResubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await vendorApi.resubmitApplication(resubmitNotes);
      setSuccess(true);
      await fetchProfile();
      setTimeout(() => {
        navigate('/application-status');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to resubmit application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-[#E2E8F0] space-y-6 animate-in fade-in-0 duration-200">
      {/* Rejection Alert Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">
            Action Required
          </span>
          <h2 className="text-2xl font-black text-[#17233C] tracking-tight">
            Application Needs Revision
          </h2>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
          {error}
        </div>
      )}

      {/* Success notice */}
      {success && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Application revised and resubmitted successfully! Redirecting to review status...
        </div>
      )}

      {/* Rejection Reason Card */}
      <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200 space-y-2">
        <h4 className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          Compliance Officer Feedback & Reason:
        </h4>
        <p className="text-xs text-rose-800 leading-relaxed font-medium bg-white/70 p-3 rounded-xl border border-rose-200/70">
          "{rejectionReason}"
        </p>
      </div>

      {/* Guidance */}
      <div className="p-4 rounded-2xl bg-[#F4F7FC] border border-[#E2E8F0] text-xs text-slate-600 space-y-2">
        <h4 className="font-bold text-[#17233C]">How to Resolve This:</h4>
        <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600">
          <li>Ensure your GSTIN matches Karnataka tax jurisdiction code 29.</li>
          <li>Upload high-resolution original PDF scans (photocopies or camera screenshots may be rejected).</li>
          <li>Provide a clarification note below explaining the updates made to your submission.</li>
        </ol>
      </div>

      {/* Resubmission Form */}
      <form onSubmit={handleResubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-[#17233C] mb-1.5">
            Clarification Notes / Document Updates *
          </label>
          <textarea
            rows={3}
            value={resubmitNotes}
            onChange={(e) => setResubmitNotes(e.target.value)}
            required
            placeholder="Explain the changes made (e.g. Uploaded revised high-resolution Form GST REG-06 PDF certificate with clear address verification)..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-xs text-[#17233C] focus:outline-none focus:ring-2 focus:ring-[#203D91]"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-[#F4F7FC] text-[#203D91] border border-blue-200 hover:bg-blue-50 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <FileEdit className="w-4 h-4" />
            Edit Registration Wizard (Steps 1–5)
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-[#203D91] text-white hover:bg-[#162b66] shadow-md shadow-[#203D91]/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <Clock className="w-4 h-4 animate-spin" />
                Resubmitting...
              </span>
            ) : (
              <>
                Resubmit Application
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Footer */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-slate-400" />
          <span>Questions? Contact compliance: 1800-60-BUILD</span>
        </div>
        <button
          type="button"
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="font-bold text-slate-500 hover:text-rose-600 flex items-center gap-1"
        >
          <LogOut className="w-3.5 h-3.5" /> Sign Out
        </button>
      </div>
    </div>
  );
};
