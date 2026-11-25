import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { vendorApi } from '../../services/vendorApi';
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ShieldAlert,
  Building2,
  FileText,
  CreditCard,
  MapPin,
  User,
  RefreshCw,
  ArrowLeft,
  ShieldCheck,
  Ban,
  RotateCcw
} from 'lucide-react';

const STATUS_FILTERS = [
  'ALL',
  'SUBMITTED',
  'UNDER_REVIEW',
  'RESUBMISSION_REQUIRED',
  'APPROVED',
  'REJECTED',
  'SUSPENDED'
];

export const DevAdminVendorApprovalPage: React.FC = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Modal / inline reason prompt state
  const [pendingAction, setPendingAction] = useState<'REJECT' | 'RESUBMIT' | 'SUSPEND' | null>(null);
  const [actionReason, setActionReason] = useState('');

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await vendorApi.devAdmin.listApplications(search, statusFilter);
      const list = res.applications || [];
      setApplications(list);
      if (selectedApp) {
        const updated = list.find((a: any) => a.id === selectedApp.id);
        if (updated) setSelectedApp(updated);
      } else if (list.length > 0) {
        setSelectedApp(list[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load vendor applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchApplications();
  };

  const handleSelectApplication = async (app: any) => {
    setSelectedApp(app);
    setPendingAction(null);
    setActionReason('');
    setNotice(null);
    try {
      const res = await vendorApi.devAdmin.getApplication(app.id);
      if (res?.application) setSelectedApp(res.application);
    } catch {}
  };

  const handleApprove = async () => {
    if (!selectedApp) return;
    setActionLoading(true);
    setError(null);
    setNotice(null);
    try {
      const res = await vendorApi.devAdmin.approveApplication(selectedApp.id);
      setSelectedApp(res.application);
      setNotice(`Approved ${res.application.storeName} (${res.application.applicationId}).`);
      await fetchApplications();
    } catch (err: any) {
      setError(err.message || 'Approval failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkUnderReview = async () => {
    if (!selectedApp) return;
    setActionLoading(true);
    setError(null);
    setNotice(null);
    try {
      const res = await vendorApi.devAdmin.markUnderReview(selectedApp.id);
      setSelectedApp(res.application);
      setNotice(`Marked ${res.application.storeName} as Under Review.`);
      await fetchApplications();
    } catch (err: any) {
      setError(err.message || 'Status update failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReasonActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp || !pendingAction) return;
    if (actionReason.trim().length < 5) {
      setError('Please enter a detailed reason (minimum 5 characters).');
      return;
    }

    setActionLoading(true);
    setError(null);
    setNotice(null);

    try {
      let res: any;
      if (pendingAction === 'REJECT') {
        res = await vendorApi.devAdmin.rejectApplication(selectedApp.id, actionReason.trim());
        setNotice(`Application rejected with reason recorded.`);
      } else if (pendingAction === 'RESUBMIT') {
        res = await vendorApi.devAdmin.requestResubmission(selectedApp.id, actionReason.trim());
        setNotice(`Resubmission requested from vendor.`);
      } else if (pendingAction === 'SUSPEND') {
        res = await vendorApi.devAdmin.suspendVendor(selectedApp.id, actionReason.trim());
        setNotice(`Vendor account suspended.`);
      }
      if (res?.application) setSelectedApp(res.application);
      setPendingAction(null);
      setActionReason('');
      await fetchApplications();
    } catch (err: any) {
      setError(err.message || 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      SUBMITTED: 'bg-blue-50 text-[#203D91] border-blue-200',
      UNDER_REVIEW: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      RESUBMISSION_REQUIRED: 'bg-amber-50 text-amber-800 border-amber-200',
      REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
      SUSPENDED: 'bg-slate-100 text-rose-800 border-rose-300'
    };
    return map[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="min-h-screen bg-[#F4F7FC] text-[#17233C]">
      {/* Top Dev Admin Header */}
      <header className="bg-[#203D91] text-white px-6 py-4 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#FF7417] flex items-center justify-center font-black text-lg">
            B
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight">BUILDORA 60 Admin Approval Console</h1>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-400 text-slate-900">
                Development Only
              </span>
            </div>
            <p className="text-[11px] text-blue-200">
              Compliance & KYC Verification Queue • Real Backend & MongoDB State
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-xs font-bold px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Vendor Login
          </Link>
          <button
            type="button"
            onClick={fetchApplications}
            className="text-xs font-bold px-3.5 py-2 rounded-xl bg-[#FF7417] hover:bg-[#e05e07] text-white inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Queue
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-5">
        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-2xs space-y-3">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by business name, store name, email, or application ID (e.g. APP-BLR-...)"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E2E8F0] text-xs focus:outline-none focus:ring-2 focus:ring-[#203D91]"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#203D91] text-white hover:bg-[#162b66] cursor-pointer"
            >
              Search
            </button>
          </form>

          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[#203D91] text-white border-[#203D91]'
                    : 'bg-[#F4F7FC] text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {notice && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {/* Two-Column Queue & Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Queue List */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E2E8F0] shadow-2xs overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-[#F4F7FC]">
              <span className="text-xs font-bold text-[#17233C]">
                Applications ({applications.length})
              </span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading applications...</div>
            ) : applications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No vendor applications match your filter.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[680px] overflow-y-auto">
                {applications.map((app) => {
                  const isSelected = selectedApp?.id === app.id;
                  return (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => handleSelectApplication(app)}
                      className={`w-full text-left p-4 transition-colors flex items-start gap-3 cursor-pointer ${
                        isSelected ? 'bg-blue-50/70 border-l-4 border-[#203D91]' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center overflow-hidden shrink-0">
                        {app.logoUrl ? (
                          <img src={app.logoUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Building2 className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[#17233C] truncate">
                            {app.storeName}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${getStatusBadge(app.status)}`}>
                            {app.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{app.email}</p>
                        <p className="text-[10px] font-mono text-[#203D91] mt-1">{app.applicationId}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Application Detail Inspector */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E2E8F0] shadow-2xs p-6 space-y-5">
            {!selectedApp ? (
              <div className="p-12 text-center text-xs text-slate-500">
                Select a vendor application from the queue to inspect details and take action.
              </div>
            ) : (
              <>
                {/* Top Summary */}
                <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3.5">
                    <div className="w-16 h-16 rounded-2xl border border-[#E2E8F0] bg-[#F4F7FC] flex items-center justify-center overflow-hidden shrink-0">
                      {selectedApp.logoUrl ? (
                        <img src={selectedApp.logoUrl} alt="Vendor Logo" className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="w-7 h-7 text-[#203D91]/50" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-black text-[#17233C]">{selectedApp.storeName}</h2>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusBadge(selectedApp.status)}`}>
                          {selectedApp.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{selectedApp.legalBusinessName}</p>
                      <p className="text-[11px] font-mono font-bold text-[#203D91] mt-0.5">
                        {selectedApp.applicationId}
                      </p>
                    </div>
                  </div>

                  {/* Primary Decision Controls */}
                  <div className="flex flex-wrap gap-2">
                    {selectedApp.status === 'SUBMITTED' && (
                      <button
                        type="button"
                        onClick={handleMarkUnderReview}
                        disabled={actionLoading}
                        className="px-3 py-2 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 cursor-pointer"
                      >
                        Mark Under Review
                      </button>
                    )}

                    {selectedApp.status !== 'APPROVED' && selectedApp.status !== 'ACTIVE' && (
                      <button
                        type="button"
                        onClick={handleApprove}
                        disabled={actionLoading}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Approve Vendor
                      </button>
                    )}

                    {selectedApp.status !== 'REJECTED' && (
                      <button
                        type="button"
                        onClick={() => {
                          setPendingAction('REJECT');
                          setActionReason('');
                        }}
                        disabled={actionLoading}
                        className="px-3 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setPendingAction('RESUBMIT');
                        setActionReason('');
                      }}
                      disabled={actionLoading}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Request Resubmission
                    </button>

                    {(selectedApp.status === 'APPROVED' || selectedApp.status === 'ACTIVE') && (
                      <button
                        type="button"
                        onClick={() => {
                          setPendingAction('SUSPEND');
                          setActionReason('');
                        }}
                        disabled={actionLoading}
                        className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        Suspend Vendor
                      </button>
                    )}
                  </div>
                </div>

                {/* Mandatory Reason Form for Reject / Resubmit / Suspend */}
                {pendingAction && (
                  <form onSubmit={handleReasonActionSubmit} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-[#17233C]">
                      {pendingAction === 'REJECT' && 'Mandatory Rejection Reason'}
                      {pendingAction === 'RESUBMIT' && 'Mandatory Resubmission Instructions'}
                      {pendingAction === 'SUSPEND' && 'Mandatory Suspension Reason'}
                    </h4>
                    <textarea
                      rows={2}
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      required
                      placeholder="Provide a clear explanation for the vendor..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#203D91]"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setPendingAction(null)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#203D91] text-white hover:bg-[#162b66] cursor-pointer"
                      >
                        Confirm Action
                      </button>
                    </div>
                  </form>
                )}

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#F4F7FC] border border-[#E2E8F0] space-y-1.5">
                    <h4 className="font-bold text-[#17233C] flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#203D91]" /> Contact & Owner
                    </h4>
                    <p><span className="text-slate-500">Name:</span> <strong>{selectedApp.ownerName}</strong></p>
                    <p><span className="text-slate-500">Email:</span> <strong>{selectedApp.email}</strong></p>
                    <p><span className="text-slate-500">Phone:</span> <strong>+91 {selectedApp.phone}</strong></p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#F4F7FC] border border-[#E2E8F0] space-y-1.5">
                    <h4 className="font-bold text-[#17233C] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#203D91]" /> Business Address
                    </h4>
                    <p className="font-medium text-[#17233C]">{selectedApp.address?.completeAddress || '—'}</p>
                    <p className="text-slate-600">
                      {selectedApp.address?.city}, {selectedApp.address?.state} - {selectedApp.address?.pincode}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#F4F7FC] border border-[#E2E8F0] space-y-1.5">
                    <h4 className="font-bold text-[#17233C] flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#203D91]" /> Tax & KYC ({selectedApp.kyc?.documents?.length || 0} Docs)
                    </h4>
                    <p><span className="text-slate-500">GSTIN:</span> <strong className="font-mono">{selectedApp.kyc?.gstin}</strong></p>
                    <p><span className="text-slate-500">PAN:</span> <strong className="font-mono">{selectedApp.kyc?.pan}</strong></p>
                    {(selectedApp.kyc?.documents || []).map((d: any) => (
                      <div key={d.id} className="text-[11px] text-slate-600 truncate">
                        • {d.title} ({d.fileName})
                      </div>
                    ))}
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#F4F7FC] border border-[#E2E8F0] space-y-1.5">
                    <h4 className="font-bold text-[#17233C] flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-[#203D91]" /> Bank Details (Masked)
                    </h4>
                    <p><span className="text-slate-500">Holder:</span> <strong>{selectedApp.bankDetails?.accountHolderName}</strong></p>
                    <p><span className="text-slate-500">Bank:</span> <strong>{selectedApp.bankDetails?.bankName}</strong></p>
                    <p><span className="text-slate-500">Account:</span> <strong className="font-mono">{selectedApp.bankDetails?.accountNumber}</strong></p>
                    <p><span className="text-slate-500">IFSC:</span> <strong className="font-mono">{selectedApp.bankDetails?.ifsc}</strong></p>
                  </div>
                </div>

                {/* Audit Log */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-[#17233C]">Audit Trail</h4>
                  <div className="max-h-40 overflow-y-auto space-y-1.5">
                    {(selectedApp.auditLogs || []).map((log: any) => (
                      <div key={log.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] flex items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-[#203D91]">{log.action}</span>
                          <span className="text-slate-500"> — {log.details}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {log.performedBy} • {new Date(log.performedAt).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevAdminVendorApprovalPage;
