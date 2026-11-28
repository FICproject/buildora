import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';

export interface GstinModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialGstin?: string;
  initialCompanyName?: string;
  onConfirm: (gstin: string, companyName: string, saveToProfile: boolean) => void;
}

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export const GstinModal: React.FC<GstinModalProps> = ({
  isOpen,
  onClose,
  initialGstin = '',
  initialCompanyName = '',
  onConfirm
}) => {
  const [gstinInput, setGstinInput] = useState(initialGstin);
  const [companyName, setCompanyName] = useState(initialCompanyName);
  const [saveToProfile, setSaveToProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const cleanGst = gstinInput.trim().toUpperCase();
  const isValidFormat = GSTIN_REGEX.test(cleanGst);

  const handleConfirm = () => {
    if (!isValidFormat) {
      setError('Please enter a valid 15-character Indian GSTIN (e.g. 29AAFCH7949K1ZT)');
      return;
    }
    setError(null);
    onConfirm(cleanGst, companyName.trim(), saveToProfile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-md max-h-[90vh] max-h-[90dvh] overflow-y-auto bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 p-5 sm:p-8 space-y-5 animate-in zoom-in-95 duration-150 text-center my-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close GSTIN dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* GST Illustration matching Reference Screenshot 5 */}
        <div className="flex justify-center pt-2">
          <div className="relative w-24 h-24 flex items-center justify-center">
            {/* Folder Body with Documents */}
            <svg
              className="w-24 h-24 drop-shadow-sm"
              viewBox="0 0 96 96"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Back Folder / Background glow */}
              <rect x="12" y="14" width="72" height="68" rx="20" fill="#F1F5F9" />
              {/* Documents sticking out */}
              <rect x="22" y="16" width="52" height="40" rx="4" fill="#FEF3C7" stroke="#FDE68A" strokeWidth="1.5" />
              <line x1="28" y1="26" x2="68" y2="26" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />
              <line x1="28" y1="32" x2="56" y2="32" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />
              <line x1="28" y1="38" x2="64" y2="38" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />
              {/* Green Pocket Folder */}
              <path
                d="M14 42C14 37.5817 17.5817 34 22 34H40L48 42H74C78.4183 42 82 45.5817 82 50V74C82 78.4183 78.4183 82 74 82H22C17.5817 82 14 78.4183 14 74V42Z"
                fill="url(#gst_green_gradient)"
              />
              {/* GST Badge */}
              <rect x="28" y="24" width="40" height="18" rx="5" fill="#166534" />
              <text x="48" y="37" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="900" letterSpacing="0.05em">
                GST
              </text>
              <defs>
                <linearGradient id="gst_green_gradient" x1="14" y1="34" x2="82" y2="82" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#22C55E" />
                  <stop offset="1" stopColor="#15803D" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-1">
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            Enter Your GSTIN
          </h3>
          <p className="text-xs text-slate-500">
            If you're a business owner, add your GST details.
          </p>
        </div>

        {/* Form Inputs */}
        <div className="space-y-3 text-left">
          {/* GSTIN Input */}
          <div className="space-y-1">
            <input
              type="text"
              placeholder="E.g. 29AAFCH7949K1ZT"
              value={gstinInput}
              maxLength={15}
              onChange={(e) => {
                setGstinInput(e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, ''));
                if (error) setError(null);
              }}
              className={`w-full px-4 py-3 rounded-xl border text-sm font-mono font-bold tracking-wider uppercase transition-all bg-white ${
                isValidFormat
                  ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-200'
                  : gstinInput.length > 0 && !isValidFormat
                  ? 'border-amber-400 focus:ring-2 focus:ring-amber-200'
                  : 'border-slate-300 focus:border-brand-blue-500 focus:ring-2 focus:ring-brand-blue-100'
              }`}
            />
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>Standard 15-character Indian GST identifier</span>
              <span>{cleanGst.length}/15</span>
            </div>
          </div>

          {/* Company Name Input */}
          <div className="space-y-1">
            <input
              type="text"
              placeholder="Company / Legal Entity Name (Optional)"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:border-brand-blue-500 focus:ring-2 focus:ring-brand-blue-100 bg-white"
            />
          </div>

          {/* Profile Save Options */}
          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2.5 p-2 rounded-lg border border-slate-200/80 hover:bg-slate-50 cursor-pointer text-xs">
              <input
                type="radio"
                name="gstinProfileOption"
                checked={saveToProfile}
                onChange={() => setSaveToProfile(true)}
                className="text-brand-blue-900 cursor-pointer"
              />
              <span className="font-semibold text-slate-800">
                Save to profile for future orders
              </span>
            </label>

            <label className="flex items-center gap-2.5 p-2 rounded-lg border border-slate-200/80 hover:bg-slate-50 cursor-pointer text-xs">
              <input
                type="radio"
                name="gstinProfileOption"
                checked={!saveToProfile}
                onChange={() => setSaveToProfile(false)}
                className="text-brand-blue-900 cursor-pointer"
              />
              <span className="font-semibold text-slate-800">
                Use only for this order
              </span>
            </label>
          </div>

          {error && (
            <div className="text-xs text-red-600 font-semibold flex items-center gap-1.5 p-2 bg-red-50 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isValidFormat}
            className={`w-full py-3 px-6 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer ${
              isValidFormat
                ? 'bg-neutral-800 hover:bg-neutral-900 text-white'
                : 'bg-neutral-300 text-neutral-500 cursor-not-allowed shadow-none'
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};
