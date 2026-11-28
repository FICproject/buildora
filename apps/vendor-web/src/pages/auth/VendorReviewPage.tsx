import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useVendorAuthStore } from '../../store/useVendorAuthStore';
import { vendorApi } from '../../services/vendorApi';
import { maskAadhaar, maskPan, maskBankAccount } from '@buildora/validation';
import {
  User,
  Building2,
  MapPin,
  FileText,
  CreditCard,
  Edit3,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';

export const VendorReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { applicationId } = useParams<{ applicationId?: string }>();
  const { vendor, setSession } = useVendorAuthStore();

  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If the application is already submitted/under review/approved/rejected/suspended, redirect to Application Status Page
  useEffect(() => {
    if (
      vendor &&
      vendor.status !== 'DRAFT' &&
      vendor.status !== 'RESUBMISSION_REQUIRED'
    ) {
      const targetId = applicationId || vendor.applicationId;
      navigate(targetId ? `/application-status/${targetId}` : '/application-status', { replace: true });
    }
  }, [vendor?.status, applicationId]);

  const data = vendor?.registrationData;

  // Guard: If vendor has not completed registration steps yet, redirect back to /register
  if (!vendor || !data) {
    return (
      <div className="w-full bg-white rounded-3xl p-8 shadow-xl border border-[#E7E5E4] text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-xl font-black text-[#292524]">Incomplete Registration Session</h2>
        <p className="text-xs text-[#78716C]">
          Please complete all five registration steps before reviewing your vendor application.
        </p>
        <button
          type="button"
          onClick={() => navigate('/register')}
          className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#943D24] text-white hover:bg-[#7D331E] cursor-pointer"
        >
          Go to Registration
        </button>
      </div>
    );
  }

  const formatGstStatus = (status?: string) => {
    if (status === 'REGISTERED') return 'Registered';
    if (status === 'APPLIED') return 'Applied for Registration';
    return 'Not Registered';
  };

  const formatMsmeStatus = (status?: string) => {
    if (status === 'REGISTERED') return 'Yes – MSME Registered';
    if (status === 'APPLIED') return 'Applied for MSME Registration';
    return 'No – Not MSME Registered';
  };

  const bankProofDoc = (data.documents || []).find((d) => d.type === 'CANCELLED_CHEQUE');
  const logoSrc = data.logoUrl || vendor.logoUrl || vendor.businessInfo?.logo;

  const handleSubmitApplication = async () => {
    setError(null);
    if (!isConfirmed) {
      setError('Please confirm that the information provided is accurate and belongs to your authorized business.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await vendorApi.submitRegistration(data, vendor.id);
      if (res.token && res.vendor) {
        setSession(res.token, res.vendor, `/application-status/${res.applicationId}`);
      }
      navigate(`/application-status/${res.applicationId}`, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to submit vendor application. Please check your details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#E7E5E4] space-y-6 animate-in fade-in-0 duration-200">
      {/* Page Heading */}
      <div className="border-b border-[#E7E5E4] pb-4 flex items-center justify-between gap-4">
        <div>
          <span className="inline-block px-2.5 py-0.5 rounded-md bg-[#FBF3F0] text-[#943D24] text-[10px] font-extrabold uppercase tracking-wider mb-1">
            Final Review
          </span>
          <h2 className="text-2xl font-black text-[#292524] tracking-tight">
            Review Your Vendor Application
          </h2>
          <p className="text-xs text-[#78716C] mt-0.5">
            Verify all details carefully before final submission. Click Edit on any section to make changes.
          </p>
        </div>

        {/* Business Logo Preview or Placeholder */}
        <div className="w-16 h-16 rounded-2xl border border-[#E7E5E4] bg-[#FBF3F0] flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
          {logoSrc ? (
            <img src={logoSrc} alt="Business Logo" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center justify-center text-[#78716C]">
              <Building2 className="w-6 h-6 text-[#943D24]/60" />
              <span className="text-[9px] font-bold uppercase mt-0.5">
                {(data.storeName || 'B60').slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Account Information */}
      <section className="rounded-2xl border border-[#E7E5E4] overflow-hidden">
        <div className="px-4 py-3 bg-[#FBF3F0] border-b border-[#E7E5E4] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-[#943D24]" />
            <h3 className="text-xs font-bold text-[#292524]">1. Account Information</h3>
          </div>
          <button
            type="button"
            onClick={() => navigate('/register?step=1&returnTo=review')}
            className="text-xs font-bold text-[#943D24] hover:text-[#F6C453] inline-flex items-center gap-1 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit
          </button>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-[#78716C] block text-[11px]">Authorized Person</span>
            <span className="font-bold text-[#292524]">{data.ownerName || vendor.name}</span>
          </div>
          <div>
            <span className="text-[#78716C] block text-[11px]">Official Email</span>
            <span className="font-bold text-[#292524] break-all">{data.email || vendor.email}</span>
          </div>
          <div>
            <span className="text-[#78716C] block text-[11px]">Mobile Number</span>
            <span className="font-bold text-[#292524]">+91 {data.phone || vendor.phone}</span>
          </div>
        </div>
      </section>

      {/* 2. Business Information */}
      <section className="rounded-2xl border border-[#E7E5E4] overflow-hidden">
        <div className="px-4 py-3 bg-[#FBF3F0] border-b border-[#E7E5E4] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#943D24]" />
            <h3 className="text-xs font-bold text-[#292524]">2. Business Information</h3>
          </div>
          <button
            type="button"
            onClick={() => navigate('/register?step=2&returnTo=review')}
            className="text-xs font-bold text-[#943D24] hover:text-[#F6C453] inline-flex items-center gap-1 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit
          </button>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-[#78716C] block text-[11px]">Legal Business Name</span>
            <span className="font-bold text-[#292524]">{data.legalBusinessName || '—'}</span>
          </div>
          <div>
            <span className="text-[#78716C] block text-[11px]">Store / Brand Name</span>
            <span className="font-bold text-[#292524]">{data.storeName || '—'}</span>
          </div>
          <div>
            <span className="text-[#78716C] block text-[11px]">Supplier Type</span>
            <span className="font-semibold text-[#292524]">{data.businessType || '—'}</span>
          </div>
          <div>
            <span className="text-[#78716C] block text-[11px]">Constitution</span>
            <span className="font-semibold text-[#292524]">{data.businessRegistrationType || '—'}</span>
          </div>
          {data.yearOfEstablishment && (
            <div>
              <span className="text-[#78716C] block text-[11px]">Established</span>
              <span className="font-semibold text-[#292524]">{data.yearOfEstablishment}</span>
            </div>
          )}
          {data.website && (
            <div>
              <span className="text-[#78716C] block text-[11px]">Website</span>
              <span className="font-semibold text-[#943D24] break-all">{data.website}</span>
            </div>
          )}
        </div>
      </section>

      {/* 3. Business Address */}
      <section className="rounded-2xl border border-[#E7E5E4] overflow-hidden">
        <div className="px-4 py-3 bg-[#FBF3F0] border-b border-[#E7E5E4] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#943D24]" />
            <h3 className="text-xs font-bold text-[#292524]">3. Business Address</h3>
          </div>
          <button
            type="button"
            onClick={() => navigate('/register?step=3&returnTo=review')}
            className="text-xs font-bold text-[#943D24] hover:text-[#F6C453] inline-flex items-center gap-1 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit
          </button>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="sm:col-span-2">
            <span className="text-[#78716C] block text-[11px]">Registered Address</span>
            <span className="font-bold text-[#292524]">{data.completeAddress || '—'}</span>
          </div>
          <div>
            <span className="text-[#78716C] block text-[11px]">City / State</span>
            <span className="font-semibold text-[#292524]">
              {data.city || '—'}, {data.state || '—'}
            </span>
          </div>
          <div>
            <span className="text-[#78716C] block text-[11px]">Pincode & Country</span>
            <span className="font-semibold text-[#292524]">
              {data.pincode || '—'} • {data.country || 'India'}
            </span>
          </div>
        </div>
      </section>

      {/* 4. KYC & Tax Documents */}
      <section className="rounded-2xl border border-[#E7E5E4] overflow-hidden">
        <div className="px-4 py-3 bg-[#FBF3F0] border-b border-[#E7E5E4] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#943D24]" />
            <h3 className="text-xs font-bold text-[#292524]">4. KYC & Tax Documents</h3>
          </div>
          <button
            type="button"
            onClick={() => navigate('/register?step=4&returnTo=review')}
            className="text-xs font-bold text-[#943D24] hover:text-[#F6C453] inline-flex items-center gap-1 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit
          </button>
        </div>
        <div className="p-4 space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-[#78716C] block text-[11px]">Aadhaar Number (Masked)</span>
              <span className="font-mono font-bold text-[#292524]">
                {maskAadhaar(data.aadhaarNumber) || vendor.aadhaarMasked || 'Not Provided'}
              </span>
            </div>
            <div>
              <span className="text-[#78716C] block text-[11px]">Company / Proprietor PAN (Masked)</span>
              <span className="font-mono font-bold text-[#292524]">
                {maskPan(data.pan) || vendor.panMasked || 'Not Provided'}
              </span>
            </div>
            <div>
              <span className="text-[#78716C] block text-[11px]">GST Status</span>
              <span className="font-bold text-[#292524]">{formatGstStatus(data.gstStatus)}</span>
            </div>
            <div>
              <span className="text-[#78716C] block text-[11px]">
                {data.gstStatus === 'APPLIED' ? 'GST Application Ref' : 'GSTIN'}
              </span>
              <span className="font-mono font-bold text-[#292524]">
                {data.gstStatus === 'REGISTERED'
                  ? data.gstin || 'Not Provided'
                  : data.gstStatus === 'APPLIED'
                    ? data.gstApplicationNumber || 'Not Provided'
                    : 'Not Applicable'}
              </span>
            </div>
            <div>
              <span className="text-[#78716C] block text-[11px]">MSME Status</span>
              <span className="font-bold text-[#292524]">{formatMsmeStatus(data.msmeStatus)}</span>
            </div>
            <div>
              <span className="text-[#78716C] block text-[11px]">
                {data.msmeStatus === 'APPLIED' ? 'MSME Application Ref' : 'Udyam Registration Number'}
              </span>
              <span className="font-mono font-bold text-[#292524]">
                {data.msmeStatus === 'REGISTERED'
                  ? data.udyamNumber || 'Not Provided'
                  : data.msmeStatus === 'APPLIED'
                    ? data.msmeApplicationNumber || 'Not Provided'
                    : 'Not Applicable'}
              </span>
            </div>
          </div>
          {(data.documents || []).length > 0 && (
            <div className="pt-2 border-t border-[#E7E5E4] space-y-1.5">
              <span className="text-[11px] text-[#78716C] block">Uploaded Documents</span>
              {data.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#F8F7F5] border border-[#E7E5E4]"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-[#292524] truncate">{doc.title}</span>
                    <span className="text-[11px] text-[#78716C] truncate">({doc.fileName})</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                    {doc.verificationStatus || 'PENDING'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 5. Bank & Settlement Details */}
      <section className="rounded-2xl border border-[#E7E5E4] overflow-hidden">
        <div className="px-4 py-3 bg-[#FBF3F0] border-b border-[#E7E5E4] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#943D24]" />
            <h3 className="text-xs font-bold text-[#292524]">5. Bank & Settlement Details</h3>
          </div>
          <button
            type="button"
            onClick={() => navigate('/register?step=5&returnTo=review')}
            className="text-xs font-bold text-[#943D24] hover:text-[#F6C453] inline-flex items-center gap-1 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit
          </button>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-[#78716C] block text-[11px]">Account Holder</span>
            <span className="font-bold text-[#292524]">{data.bankDetails?.accountHolderName || '—'}</span>
          </div>
          <div>
            <span className="text-[#78716C] block text-[11px]">Bank Name</span>
            <span className="font-bold text-[#292524]">{data.bankDetails?.bankName || '—'}</span>
          </div>
          <div>
            <span className="text-[#78716C] block text-[11px]">Account Number (Masked)</span>
            <span className="font-mono font-bold text-[#292524]">
              {maskBankAccount(data.bankDetails?.accountNumber) || 'Not Provided'}
            </span>
          </div>
          <div>
            <span className="text-[#78716C] block text-[11px]">IFSC Code</span>
            <span className="font-mono font-bold text-[#292524]">{data.bankDetails?.ifsc || '—'}</span>
          </div>
          <div>
            <span className="text-[#78716C] block text-[11px]">Bank Proof Document</span>
            <span className="font-semibold text-[#292524]">
              {bankProofDoc?.fileName || data.bankDetails?.proofFileName || 'Not Uploaded'}
            </span>
          </div>
          <div>
            <span className="text-[#78716C] block text-[11px]">Bank Verification Status</span>
            <span className="inline-block font-bold text-amber-700">Pending Admin Verification</span>
          </div>
        </div>
      </section>

      {/* Final Confirmation Checkbox */}
      <label className="flex items-start gap-2.5 p-4 rounded-2xl bg-[#FBF3F0] border border-[#E7E5E4] text-xs cursor-pointer">
        <input
          type="checkbox"
          checked={isConfirmed}
          onChange={(e) => {
            setIsConfirmed(e.target.checked);
            if (error) setError(null);
          }}
          className="w-4 h-4 mt-0.5 rounded text-[#943D24] focus:ring-[#943D24]"
        />
        <span className="text-[#292524] font-medium leading-relaxed">
          I confirm that the information provided is accurate and belongs to my authorized business.
        </span>
      </label>

      {/* Actions */}
      <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 border-t border-[#E7E5E4]">
        <button
          type="button"
          onClick={() => navigate('/register?step=5')}
          className="w-full sm:w-auto py-2.5 px-4 rounded-xl text-xs font-bold text-[#78716C] border border-[#E7E5E4] hover:bg-[#F8F7F5] flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Registration
        </button>

        <button
          type="button"
          onClick={handleSubmitApplication}
          disabled={isSubmitting}
          className="w-full sm:w-auto py-3 px-7 rounded-xl text-sm font-bold bg-[#943D24] text-white hover:bg-[#7D331E] transition-all shadow-md shadow-[#943D24]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Clock className="w-4 h-4 animate-spin" />
              <span>Submitting Application...</span>
            </>
          ) : (
            <>
              <span>Submit Vendor Application</span>
              <ShieldCheck className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default VendorReviewPage;
