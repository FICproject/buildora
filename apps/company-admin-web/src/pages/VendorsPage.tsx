import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  PauseCircle,
  PlayCircle,
  FileText,
  Store,
  Eye,
  Download,
  History,
  X,
  Users,
  Clock,
  FileCheck2,
  Ban,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { adminApi, formatINR, formatDateTime } from '../services/adminApi';
import { KycDocumentPreviewModal } from '../components/KycDocumentPreviewModal';
import {
  PageHeader,
  Card,
  Badge,
  Button,
  Drawer,
  Modal,
  EmptyState,
  statusBadgeVariant,
  useToastStore,
} from '../components/ui';

const VENDOR_TABS = [
  { id: 'ALL', label: 'All Vendors', countKey: 'ALL' },
  { id: 'SUBMITTED', label: 'New Applications', countKey: 'SUBMITTED' },
  { id: 'PENDING_VERIFICATION', label: 'Pending Approvals', countKey: 'PENDING_VERIFICATION' },
  { id: 'RESUBMISSION_REQUIRED', label: 'Correction Requested', countKey: 'RESUBMISSION_REQUIRED' },
  { id: 'APPROVED', label: 'Approved Vendors', countKey: 'APPROVED' },
  { id: 'REJECTED', label: 'Rejected', countKey: 'REJECTED' },
  { id: 'SUSPENDED', label: 'Suspended', countKey: 'SUSPENDED' },
];

export const VendorsPage: React.FC = () => {
  const pushToast = useToastStore((s) => s.push);
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'ALL';
  const initialVendorId = searchParams.get('vendorId') || '';

  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'updated'>('newest');
  const [page, setPage] = useState(1);
  const limit = 10;

  const [vendors, setVendors] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    totalVendors: 0,
    newApplications: 0,
    pendingKyc: 0,
    documentsAwaitingVerification: 0,
    approvedVendors: 0,
    rejectedOrSuspendedVendors: 0,
  });
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<any>(null);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  const [approveConfirmVendor, setApproveConfirmVendor] = useState<any | null>(null);
  const [approving, setApproving] = useState(false);

  const [actionModal, setActionModal] = useState<{
    type: 'REJECT' | 'CORRECTION' | 'SUSPEND' | 'DOC_REJECT';
    vendor: any;
    doc?: any;
  } | null>(null);
  const [selectedCorrectionDocId, setSelectedCorrectionDocId] = useState('');
  const [reasonText, setReasonText] = useState('');

  // Sync ?status= or ?vendorId= URL parameters
  useEffect(() => {
    const stParam = searchParams.get('status');
    if (stParam && stParam !== statusFilter) {
      setStatusFilter(stParam);
      setPage(1);
    }
  }, [searchParams]);

  // 300ms live debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      const cleaned = searchInput.trim();
      setDebouncedSearch(cleaned);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadVendors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getVendorsDirectory({
        status: statusFilter,
        search: debouncedSearch,
        sort: sortBy,
        page,
        limit,
      });
      setVendors(res?.items || []);
      if (res?.summary) setSummary(res.summary);
      if (res?.tabCounts) setTabCounts(res.tabCounts);
      if (res?.meta) setMeta(res.meta);
    } catch (err: any) {
      pushToast({ title: 'Failed to load vendors', message: err.message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearch, sortBy, page]);

  useEffect(() => {
    void loadVendors();
  }, [loadVendors]);

  useEffect(() => {
    if (initialVendorId) {
      void openVendorDetail(initialVendorId);
    }
  }, [initialVendorId]);

  useEffect(() => {
    const onRealtime = () => {
      void loadVendors();
      if (detailOpen && selectedDetail?.vendor?.id) {
        void openVendorDetail(selectedDetail.vendor.id);
      }
    };
    window.addEventListener('buildora:admin:realtime', onRealtime);
    return () => window.removeEventListener('buildora:admin:realtime', onRealtime);
  }, [loadVendors, detailOpen, selectedDetail?.vendor?.id]);

  const openVendorDetail = async (id: string) => {
    try {
      const res = await adminApi.getVendorDetail(id);
      setSelectedDetail(res);
      setDetailOpen(true);
    } catch (err: any) {
      pushToast({ title: 'Error', message: err.message, variant: 'error' });
    }
  };

  const confirmApproveVendor = async () => {
    if (!approveConfirmVendor) return;
    setApproving(true);
    try {
      await adminApi.approveVendor(approveConfirmVendor.id, {
        notes: 'Approved after KYC & Business Profile Review',
      });
      pushToast({
        title: 'Vendor Approved',
        message: `${approveConfirmVendor.businessName} is now active.`,
      });
      const vid = approveConfirmVendor.id;
      setApproveConfirmVendor(null);
      await loadVendors();
      if (detailOpen && selectedDetail?.vendor?.id === vid) {
        await openVendorDetail(vid);
      }
    } catch (err: any) {
      pushToast({ title: 'Approval Blocked', message: err.message, variant: 'error' });
    } finally {
      setApproving(false);
    }
  };

  const handleActivate = async (v: any) => {
    try {
      await adminApi.activateVendor(v.id);
      pushToast({ title: 'Vendor Activated', message: `${v.businessName} re-activated.` });
      await loadVendors();
      if (detailOpen) await openVendorDetail(v.id);
    } catch (err: any) {
      pushToast({ title: 'Action Failed', message: err.message, variant: 'error' });
    }
  };

  const handleVerifyDoc = async (
    vendorId: string,
    docId: string,
    status: 'VERIFIED' | 'REJECTED',
    notes?: string
  ) => {
    try {
      await adminApi.verifyVendorDocument(vendorId, docId, status, notes);
      pushToast({ title: `Document ${status}` });
      await Promise.all([openVendorDetail(vendorId), loadVendors()]);
      setPreviewDoc((prev: any) =>
        prev && prev.id === docId
          ? {
              ...prev,
              verificationStatus: status,
              status,
              rejectionReason: status === 'REJECTED' ? notes : undefined,
            }
          : prev
      );
    } catch (err: any) {
      pushToast({ title: 'Failed', message: err.message, variant: 'error' });
    }
  };

  const handleDownloadDoc = async (vendorId: string, doc: any) => {
    try {
      const { blob, fileName } = await adminApi.fetchVendorDocumentBlob(vendorId, doc.id, true);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName || fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      pushToast({ title: 'Download Started', message: doc.fileName || fileName });
    } catch (err: any) {
      pushToast({ title: 'Download Failed', message: err.message, variant: 'error' });
    }
  };

  const openRejectDocModal = (vendor: any, doc: any) => {
    setReasonText('');
    setActionModal({ type: 'DOC_REJECT', vendor, doc });
  };

  const openCorrectionModal = (vendor: any) => {
    setReasonText('');
    setSelectedCorrectionDocId('');
    setActionModal({ type: 'CORRECTION', vendor });
  };

  const submitReasonModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal) return;
    try {
      if (actionModal.type === 'DOC_REJECT' && actionModal.doc) {
        await handleVerifyDoc(
          actionModal.vendor.id,
          actionModal.doc.id,
          'REJECTED',
          reasonText.trim()
        );
        setActionModal(null);
        setReasonText('');
        return;
      }
      if (actionModal.type === 'REJECT') {
        await adminApi.rejectVendor(actionModal.vendor.id, reasonText.trim());
        pushToast({ title: 'Vendor Rejected' });
      } else if (actionModal.type === 'CORRECTION') {
        await adminApi.requestVendorCorrection(actionModal.vendor.id, {
          reason: reasonText.trim(),
          ...(selectedCorrectionDocId ? { docId: selectedCorrectionDocId } : {}),
        });
        pushToast({ title: 'Correction Requested', variant: 'info' });
      } else if (actionModal.type === 'SUSPEND') {
        await adminApi.suspendVendor(actionModal.vendor.id, reasonText.trim());
        pushToast({ title: 'Vendor Suspended', variant: 'warning' });
      }
      setActionModal(null);
      setReasonText('');
      await loadVendors();
      if (detailOpen) await openVendorDetail(actionModal.vendor.id);
    } catch (err: any) {
      pushToast({ title: 'Error', message: err.message, variant: 'error' });
    }
  };

  const selectTab = (nextStatus: string) => {
    setStatusFilter(nextStatus);
    setPage(1);
  };

  const summaryCards = [
    {
      label: 'Total Vendors',
      value: summary.totalVendors,
      icon: <Users className="w-4 h-4" />,
      tone: 'bg-[#F0DED0] text-[#5E5946]',
      filter: 'ALL',
    },
    {
      label: 'New Applications',
      value: summary.newApplications,
      icon: <Store className="w-4 h-4" />,
      tone: 'bg-[#FFFBEB] text-[#B45309]',
      filter: 'SUBMITTED',
    },
    {
      label: 'Pending KYC',
      value: summary.pendingKyc,
      icon: <Clock className="w-4 h-4" />,
      tone: 'bg-[#AE887B]/15 text-[#AE887B]',
      filter: 'PENDING_VERIFICATION',
    },
    {
      label: 'Docs Awaiting Review',
      value: summary.documentsAwaitingVerification,
      icon: <FileCheck2 className="w-4 h-4" />,
      tone: 'bg-[#F9F2EC] text-[#5E5946]',
      filter: 'PENDING_VERIFICATION',
    },
    {
      label: 'Approved Vendors',
      value: summary.approvedVendors,
      icon: <CheckCircle2 className="w-4 h-4" />,
      tone: 'bg-[#ECFDF5] text-[#15966B]',
      filter: 'APPROVED',
    },
    {
      label: 'Rejected / Suspended',
      value: summary.rejectedOrSuspendedVendors,
      icon: <Ban className="w-4 h-4" />,
      tone: 'bg-[#FEF2F2] text-[#C94444]',
      filter: 'REJECTED_OR_SUSPENDED',
    },
  ];

  // Build chronological document verification history for drawer Section D
  const chronologicalDocHistory = React.useMemo(() => {
    const docs: any[] = selectedDetail?.vendor?.documents || [];
    const entries: Array<{
      id: string;
      docTitle: string;
      docType: string;
      fileName: string;
      event: string;
      timestamp: string;
      actor?: string;
      reason?: string;
      status: string;
      versionDoc?: any;
    }> = [];

    for (const d of docs) {
      if (d.uploadedAt) {
        entries.push({
          id: `${d.id}-up`,
          docTitle: d.title || d.type,
          docType: d.type,
          fileName: d.fileName,
          event: Array.isArray(d.previousVersions) && d.previousVersions.length > 0 ? 'Document Resubmitted' : 'Document Uploaded',
          timestamp: d.uploadedAt,
          status: d.verificationStatus || 'PENDING',
        });
      }
      if (d.reviewedAt) {
        entries.push({
          id: `${d.id}-rev`,
          docTitle: d.title || d.type,
          docType: d.type,
          fileName: d.fileName,
          event: d.verificationStatus === 'REJECTED' ? 'Document Rejected' : 'Document Verified',
          timestamp: d.reviewedAt,
          actor: d.reviewedBy,
          reason: d.rejectionReason,
          status: d.verificationStatus,
        });
      }
      for (const pv of d.previousVersions || []) {
        if (pv.uploadedAt) {
          entries.push({
            id: `${pv.id}-prev-up`,
            docTitle: d.title || d.type,
            docType: d.type,
            fileName: pv.fileName,
            event: 'Previous Version Uploaded',
            timestamp: pv.uploadedAt,
            status: pv.verificationStatus || 'PENDING',
            versionDoc: { ...pv, type: d.type, title: `${d.title || d.type} (Previous Version)`, isHistoricalVersion: true },
          });
        }
        if (pv.reviewedAt || pv.replacedAt) {
          entries.push({
            id: `${pv.id}-prev-rev`,
            docTitle: d.title || d.type,
            docType: d.type,
            fileName: pv.fileName,
            event: pv.verificationStatus === 'REJECTED' ? 'Previous Version Rejected & Replaced' : 'Previous Version Replaced',
            timestamp: pv.reviewedAt || pv.replacedAt,
            actor: pv.reviewedBy,
            reason: pv.rejectionReason,
            status: pv.verificationStatus || 'REJECTED',
            versionDoc: { ...pv, type: d.type, title: `${d.title || d.type} (Previous Version)`, isHistoricalVersion: true },
          });
        }
      }
    }

    return entries.sort(
      (a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
    );
  }, [selectedDetail]);

  return (
    <div className="space-y-5 pb-8">
      {/* Header + Live Debounced Search */}
      <PageHeader
        title="Vendor Management"
        description="Manage vendor registrations, review KYC documents, and monitor vendor verification status."
        actions={
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-[#6E6859] absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, email, phone, GSTIN, Aadhaar or address..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-[#E5DCD3] rounded-lg focus:outline-none focus:border-[#AE887B] text-[#5E5946]"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute right-2.5 top-2 text-[#6E6859] hover:text-[#5E5946] cursor-pointer"
                title="Clear search"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        }
      />

      {/* Compact Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {summaryCards.map((card) => {
          const isActive = statusFilter === card.filter;
          return (
            <button
              key={card.label}
              type="button"
              onClick={() => selectTab(card.filter)}
              className={`text-left bg-white border rounded-xl p-3.5 shadow-card transition-all cursor-pointer ${
                isActive
                  ? 'border-[#AE887B] ring-1 ring-[#AE887B]/30'
                  : 'border-[#E5DCD3] hover:border-[#AE887B]/60'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-[#6E6859] truncate">{card.label}</span>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${card.tone}`}>
                  {card.icon}
                </div>
              </div>
              <p className="text-xl font-bold text-[#5E5946] mt-1.5">{card.value}</p>
            </button>
          );
        })}
      </div>

      {/* Filter Tabs + Sorting Control */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {VENDOR_TABS.map((t) => {
            const count = tabCounts[t.countKey];
            const active = statusFilter === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => selectTab(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                  active
                    ? 'bg-[#AE887B] text-white border-[#AE887B] shadow-sm'
                    : 'bg-white text-[#5E5946] border-[#E5DCD3] hover:bg-[#F0DED0]/45'
                }`}
              >
                <span>{t.label}</span>
                {typeof count === 'number' && (
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      active ? 'bg-white/25 text-white' : 'bg-[#F0DED0]/70 text-[#5E5946]'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <label htmlFor="vendor-sort" className="text-xs text-[#6E6859] font-medium">
            Sort:
          </label>
          <select
            id="vendor-sort"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as any);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs bg-white border border-[#E5DCD3] rounded-lg text-[#5E5946] focus:outline-none focus:border-[#AE887B]"
          >
            <option value="newest">Newest KYC Application First</option>
            <option value="oldest">Oldest First</option>
            <option value="updated">Recently Updated</option>
          </select>
        </div>
      </div>

      {/* Improved Vendor List Table */}
      <Card noPadding>
        {loading && vendors.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#6E6859]">Loading vendor directory...</div>
        ) : vendors.length === 0 ? (
          <EmptyState
            icon={<Store className="w-5 h-5" />}
            title="No matching vendors found"
            description="No vendor records match your active status filter or search query."
            action={
              (searchInput || statusFilter !== 'ALL') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSearchInput('');
                    setDebouncedSearch('');
                    setStatusFilter('ALL');
                    setPage(1);
                  }}
                >
                  Reset Filters
                </Button>
              )
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto rounded-t-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F0DED0]/75 border-b border-[#E5DCD3] text-[11px] font-semibold text-[#5E5946] uppercase">
                    <th className="py-3 px-4">Vendor / Business</th>
                    <th className="py-3 px-3">Contact Details</th>
                    <th className="py-3 px-3">GSTIN</th>
                    <th className="py-3 px-3">Location</th>
                    <th className="py-3 px-3">KYC Progress</th>
                    <th className="py-3 px-3">Application Date</th>
                    <th className="py-3 px-3">Last Updated</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5DCD3] text-xs bg-white">
                  {vendors.map((v) => {
                    const verifiedCount = v.kycSummary?.verifiedCount ?? 0;
                    const totalReq = v.kycSummary?.totalRequired ?? 4;
                    const appDate = v.applicationSubmittedAt || v.submittedAt;
                    const docUpdatedDate = v.lastDocumentUploadedAt || v.lastKycUpdatedAt || v.updatedAt;

                    return (
                      <tr key={v.id} className="hover:bg-[#FAF7F4] transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-[#5E5946]">{v.businessName}</p>
                          <p className="text-[11px] text-[#6E6859]">{v.contactPerson || '—'}</p>
                        </td>
                        <td className="py-3 px-3">
                          <p className="text-[#5E5946]">{v.email}</p>
                          <p className="text-[11px] text-[#6E6859]">{v.phone || '—'}</p>
                        </td>
                        <td className="py-3 px-3 font-mono text-[#5E5946]">
                          {v.gstin || 'Pending'}
                        </td>
                        <td className="py-3 px-3">
                          <p className="text-[#5E5946]">
                            {v.city}, {v.state}
                          </p>
                          {v.pincode && (
                            <p className="text-[11px] text-[#6E6859] font-mono">{v.pincode}</p>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <Badge
                            variant={
                              verifiedCount >= totalReq
                                ? 'success'
                                : (v.kycSummary?.rejectedCount || 0) > 0
                                  ? 'error'
                                  : 'warning'
                            }
                          >
                            {verifiedCount}/{totalReq} Documents Verified
                          </Badge>
                          {(v.kycSummary?.uploadedCount ?? 0) > 0 && verifiedCount < totalReq && (
                            <p className="text-[10px] text-[#6E6859] mt-0.5">
                              {v.kycSummary.uploadedCount}/{totalReq} uploaded
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-[#5E5946]">
                          {appDate ? formatDateTime(appDate) : <span className="text-[#6E6859]">Not submitted</span>}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-[#6E6859]">
                          {docUpdatedDate ? formatDateTime(docUpdatedDate) : '—'}
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant={statusBadgeVariant(v.approvalStatus)}>
                            {String(v.approvalStatus || '').replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <Button
                            size="sm"
                            variant={
                              ['SUBMITTED', 'PENDING_VERIFICATION', 'UNDER_REVIEW'].includes(v.approvalStatus)
                                ? 'primary'
                                : 'outline'
                            }
                            onClick={() => openVendorDetail(v.id)}
                          >
                            {['SUBMITTED', 'PENDING_VERIFICATION', 'UNDER_REVIEW', 'RESUBMISSION_REQUIRED'].includes(
                              v.approvalStatus
                            )
                              ? 'Review'
                              : 'Inspect'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar */}
            <div className="px-4 py-3 border-t border-[#E5DCD3] bg-[#FAF7F4] rounded-b-xl flex flex-wrap items-center justify-between gap-3 text-xs text-[#6E6859]">
              <span>
                Showing <strong className="text-[#5E5946]">{vendors.length}</strong> of{' '}
                <strong className="text-[#5E5946]">{meta.total}</strong> vendor(s)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={meta.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </Button>
                <span className="font-medium text-[#5E5946]">
                  Page {meta.page} of {meta.totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Detailed Vendor Profile / KYC Review Panel */}
      <Drawer
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={selectedDetail?.vendor?.businessName || 'Vendor KYC Review'}
        subtitle={`GSTIN: ${selectedDetail?.vendor?.gstin || 'N/A'} • ${selectedDetail?.vendor?.city}, ${selectedDetail?.vendor?.state}`}
      >
        {selectedDetail && (
          <div className="space-y-6">
            {/* Section A: Business Information */}
            <div className="p-4 border border-[#E5DCD3] rounded-xl bg-[#FAF7F4] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5DCD3] pb-2.5">
                <h4 className="text-sm font-semibold text-[#5E5946]">A. Business Information</h4>
                <Badge variant={statusBadgeVariant(selectedDetail.vendor.approvalStatus)}>
                  {String(selectedDetail.vendor.approvalStatus || '').replace(/_/g, ' ')}
                </Badge>
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                <div>
                  <dt className="text-[#6E6859]">Business Name</dt>
                  <dd className="font-semibold text-[#5E5946]">{selectedDetail.vendor.businessName}</dd>
                </div>
                <div>
                  <dt className="text-[#6E6859]">Contact Person</dt>
                  <dd className="font-semibold text-[#5E5946]">{selectedDetail.vendor.contactPerson || '—'}</dd>
                </div>
                <div>
                  <dt className="text-[#6E6859]">Registered Email</dt>
                  <dd className="font-medium text-[#5E5946] break-all">{selectedDetail.vendor.email}</dd>
                </div>
                <div>
                  <dt className="text-[#6E6859]">Phone Number</dt>
                  <dd className="font-medium text-[#5E5946]">{selectedDetail.vendor.phone || '—'}</dd>
                </div>
                <div>
                  <dt className="text-[#6E6859]">Business Type</dt>
                  <dd className="font-medium text-[#5E5946]">{selectedDetail.vendor.vendorType || '—'}</dd>
                </div>
                <div>
                  <dt className="text-[#6E6859]">GSTIN</dt>
                  <dd className="font-mono font-medium text-[#5E5946]">{selectedDetail.vendor.gstin || 'Pending'}</dd>
                </div>
                <div>
                  <dt className="text-[#6E6859]">PAN (Masked)</dt>
                  <dd className="font-mono font-medium text-[#5E5946]">
                    {selectedDetail.vendor.panMasked || 'Not provided'}
                  </dd>
                </div>
                {selectedDetail.vendor.aadhaarMasked && (
                  <div>
                    <dt className="text-[#6E6859]">Aadhaar (Masked)</dt>
                    <dd className="font-mono font-medium text-[#5E5946]">
                      {selectedDetail.vendor.aadhaarMasked}
                    </dd>
                  </div>
                )}
                <div className="sm:col-span-2">
                  <dt className="text-[#6E6859]">Registered Address</dt>
                  <dd className="font-medium text-[#5E5946]">{selectedDetail.vendor.fullAddress || '—'}</dd>
                </div>
                <div>
                  <dt className="text-[#6E6859]">City / District / State / Pincode</dt>
                  <dd className="font-medium text-[#5E5946]">
                    {[
                      selectedDetail.vendor.city,
                      selectedDetail.vendor.district,
                      selectedDetail.vendor.state,
                      selectedDetail.vendor.pincode,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#6E6859]">Registration Date</dt>
                  <dd className="font-medium text-[#5E5946]">{formatDateTime(selectedDetail.vendor.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-[#6E6859]">Latest KYC Application Date</dt>
                  <dd className="font-semibold text-[#5E5946]">
                    {selectedDetail.vendor.applicationSubmittedAt
                      ? formatDateTime(selectedDetail.vendor.applicationSubmittedAt)
                      : 'Draft / Not submitted'}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Section B: KYC Verification Progress */}
            <div className="p-4 border border-[#E5DCD3] rounded-xl bg-white space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-[#5E5946]">B. KYC Verification Progress</h4>
                <Badge
                  variant={
                    (selectedDetail.vendor.kycSummary?.verifiedCount || 0) >= 4 ? 'success' : 'warning'
                  }
                >
                  Overall Progress: {selectedDetail.vendor.kycSummary?.verifiedCount || 0}/
                  {selectedDetail.vendor.kycSummary?.totalRequired || 4} Documents Verified
                </Badge>
              </div>
              <div className="divide-y divide-[#F0EAE2] border border-[#E5DCD3] rounded-lg text-xs">
                {(selectedDetail.vendor.kycSummary?.slots || []).map((slot: any) => (
                  <div key={slot.type} className="px-3 py-2 flex items-center justify-between gap-2">
                    <span className="font-medium text-[#5E5946]">{slot.title}</span>
                    <Badge variant={statusBadgeVariant(slot.status)}>
                      {String(slot.status || '').replace(/_/g, ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Section C: KYC & Compliance Documents */}
            <div>
              <h4 className="text-sm font-semibold text-[#5E5946] mb-2">C. KYC & Compliance Documents</h4>
              {(selectedDetail.vendor.documents || []).length === 0 ? (
                <p className="text-xs text-[#6E6859] p-3 border border-[#E5DCD3] rounded-lg">
                  No KYC documents uploaded yet.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {selectedDetail.vendor.documents.map((doc: any) => {
                    const docStatus = doc.displayStatus || doc.verificationStatus || doc.status || 'PENDING';
                    const rawVerStatus = doc.verificationStatus || doc.status || 'PENDING';
                    const prevVersions: any[] = Array.isArray(doc.previousVersions)
                      ? doc.previousVersions
                      : [];
                    return (
                      <div
                        key={doc.id}
                        className="p-3.5 border border-[#E5DCD3] rounded-xl text-xs bg-white space-y-2.5 hover:border-[#AE887B]/60 transition-colors"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            className="flex items-start gap-2.5 text-left min-w-0 flex-1 group cursor-pointer"
                            title="Click to inspect uploaded KYC document"
                          >
                            <div className="w-8 h-8 rounded-lg bg-[#F9F2EC] border border-[#E5DCD3] flex items-center justify-center text-[#AE887B] shrink-0 group-hover:bg-[#F0DED0]">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-[#5E5946] group-hover:text-[#AE887B] transition-colors">
                                {doc.title || doc.type}
                              </p>
                              <p className="text-[#6E6859] truncate">
                                File: <span className="font-medium text-[#5E5946]">{doc.fileName}</span>
                                {doc.fileSize
                                  ? ` • ${Math.max(1, Math.round(doc.fileSize / 1024))} KB`
                                  : ''}
                              </p>
                              <p className="text-[11px] text-[#6E6859]">
                                Uploaded: {doc.uploadedAt ? formatDateTime(doc.uploadedAt) : '—'}
                                {doc.reviewedAt ? ` • Reviewed: ${formatDateTime(doc.reviewedAt)}` : ''}
                              </p>
                            </div>
                          </button>
                          <Badge variant={statusBadgeVariant(docStatus)}>{docStatus}</Badge>
                        </div>

                        {rawVerStatus === 'REJECTED' && doc.rejectionReason && (
                          <div className="px-3 py-2 rounded-lg bg-[#FEF2F2] border border-[#C94444]/25 text-[11px] text-[#C94444]">
                            <span className="font-semibold">Rejection Reason:</span> {doc.rejectionReason}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#F0EAE2]">
                          <Button size="sm" variant="primary" onClick={() => setPreviewDoc(doc)}>
                            <Eye className="w-3.5 h-3.5" /> View Document
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadDoc(selectedDetail.vendor.id, doc)}
                          >
                            <Download className="w-3.5 h-3.5" /> Download
                          </Button>
                          {rawVerStatus !== 'VERIFIED' && (
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => handleVerifyDoc(selectedDetail.vendor.id, doc.id, 'VERIFIED')}
                            >
                              Verify
                            </Button>
                          )}
                          {rawVerStatus !== 'REJECTED' && (
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => openRejectDocModal(selectedDetail.vendor, doc)}
                            >
                              Reject
                            </Button>
                          )}
                        </div>

                        {prevVersions.length > 0 && (
                          <div className="pt-2 border-t border-dashed border-[#E5DCD3] space-y-1">
                            <p className="text-[11px] font-semibold text-[#6E6859] flex items-center gap-1">
                              <History className="w-3 h-3" /> Previous Submissions ({prevVersions.length})
                            </p>
                            {prevVersions.map((pv: any) => (
                              <div
                                key={pv.id}
                                className="flex flex-wrap items-center justify-between gap-2 text-[11px] bg-[#FAF7F4] px-2.5 py-1.5 rounded-lg"
                              >
                                <div className="min-w-0 truncate">
                                  <span className="font-medium text-[#5E5946]">{pv.fileName}</span>
                                  {pv.rejectionReason && (
                                    <span className="text-[#C94444]"> — {pv.rejectionReason}</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <Badge variant={statusBadgeVariant(pv.verificationStatus)}>
                                    {pv.verificationStatus}
                                  </Badge>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPreviewDoc({
                                        ...pv,
                                        type: doc.type,
                                        title: `${doc.title || doc.type} (Previous Version)`,
                                        isHistoricalVersion: true,
                                      })
                                    }
                                    className="text-[#AE887B] hover:underline font-medium cursor-pointer"
                                  >
                                    View
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Section D: Document Verification History */}
            <div>
              <h4 className="text-sm font-semibold text-[#5E5946] mb-2">D. Document Verification History</h4>
              {chronologicalDocHistory.length === 0 ? (
                <p className="text-xs text-[#6E6859] p-3 border border-[#E5DCD3] rounded-lg">
                  No document verification history recorded yet.
                </p>
              ) : (
                <div className="divide-y divide-[#E5DCD3] border border-[#E5DCD3] rounded-xl bg-white text-xs">
                  {chronologicalDocHistory.map((h) => (
                    <div key={h.id} className="p-3 flex flex-wrap items-start justify-between gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <p className="font-semibold text-[#5E5946]">
                          {h.event}: {h.docTitle}
                        </p>
                        <p className="text-[#6E6859]">
                          File: {h.fileName}
                          {h.actor ? ` • Reviewed by ${h.actor}` : ''}
                        </p>
                        {h.reason && (
                          <p className="text-[#C94444] font-medium">Reason: {h.reason}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0 space-y-1">
                        <p className="text-[11px] text-[#6E6859]">{formatDateTime(h.timestamp)}</p>
                        <Badge variant={statusBadgeVariant(h.status)}>{h.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section E: Settlement Bank Account */}
            <div>
              <h4 className="text-sm font-semibold text-[#5E5946] mb-2">E. Settlement Bank Account</h4>
              {selectedDetail.vendor.bankAccount ? (
                <div className="p-3.5 border border-[#E5DCD3] rounded-xl text-xs space-y-1.5 bg-[#FAF7F4]">
                  <div className="flex items-center justify-between">
                    <p>
                      <span className="text-[#6E6859]">Beneficiary Name:</span>{' '}
                      <span className="font-semibold text-[#5E5946]">
                        {selectedDetail.vendor.bankAccount.accountHolderName || '—'}
                      </span>
                    </p>
                    <Badge variant={selectedDetail.vendor.bankAccount.isVerified ? 'success' : 'warning'}>
                      {selectedDetail.vendor.bankAccount.isVerified ? 'Bank Verified' : 'Pending Bank Check'}
                    </Badge>
                  </div>
                  <p>
                    <span className="text-[#6E6859]">Bank / IFSC:</span>{' '}
                    <span className="font-semibold text-[#5E5946]">
                      {selectedDetail.vendor.bankAccount.bankName || '—'} (
                      {selectedDetail.vendor.bankAccount.ifsc ||
                        selectedDetail.vendor.bankAccount.ifscCode ||
                        '—'}
                      )
                    </span>
                  </p>
                  <p>
                    <span className="text-[#6E6859]">Account Number (Masked):</span>{' '}
                    <span className="font-mono text-[#5E5946]">
                      {selectedDetail.vendor.bankAccount.accountNumberMasked || '—'}
                    </span>
                  </p>
                </div>
              ) : (
                <p className="text-xs text-[#6E6859] p-3 border border-[#E5DCD3] rounded-lg">
                  Bank settlement details not provided yet.
                </p>
              )}
            </div>

            {/* Section F: Vendor Business Summary */}
            <div>
              <h4 className="text-sm font-semibold text-[#5E5946] mb-2">F. Vendor Business Summary</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 border border-[#E5DCD3] rounded-lg bg-white">
                  <p className="text-[11px] text-[#6E6859]">Total Products</p>
                  <p className="text-base font-bold text-[#5E5946]">
                    {selectedDetail.metrics?.totalProducts || 0}
                  </p>
                </div>
                <div className="p-3 border border-[#E5DCD3] rounded-lg bg-white">
                  <p className="text-[11px] text-[#6E6859]">Approved / Live SKUs</p>
                  <p className="text-base font-bold text-[#15966B]">
                    {selectedDetail.metrics?.liveProducts || 0}
                  </p>
                </div>
                <div className="p-3 border border-[#E5DCD3] rounded-lg bg-white">
                  <p className="text-[11px] text-[#6E6859]">Pending Product Approvals</p>
                  <p className="text-base font-bold text-[#B45309]">
                    {selectedDetail.metrics?.pendingProductApprovals || 0}
                  </p>
                </div>
                <div className="p-3 border border-[#E5DCD3] rounded-lg bg-white">
                  <p className="text-[11px] text-[#6E6859]">Total Orders</p>
                  <p className="text-base font-bold text-[#5E5946]">
                    {selectedDetail.metrics?.totalOrders || 0}
                  </p>
                </div>
                <div className="p-3 border border-[#E5DCD3] rounded-lg bg-white">
                  <p className="text-[11px] text-[#6E6859]">Completed Orders</p>
                  <p className="text-base font-bold text-[#15966B]">
                    {selectedDetail.metrics?.completedOrders || 0}
                  </p>
                </div>
                <div className="p-3 border border-[#E5DCD3] rounded-lg bg-[#F9F2EC]">
                  <p className="text-[11px] text-[#6E6859]">Pending Settlements</p>
                  <p className="text-base font-bold text-[#AE887B]">
                    {formatINR(selectedDetail.metrics?.pendingSettlementAmount)}
                  </p>
                </div>
              </div>
            </div>

            {/* KYC Review Actions Footer */}
            <div className="pt-4 border-t border-[#E5DCD3] flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                {selectedDetail.vendor.approvalStatus !== 'APPROVED' &&
                  selectedDetail.vendor.approvalStatus !== 'DRAFT' && (
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => setApproveConfirmVendor(selectedDetail.vendor)}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve Vendor
                    </Button>
                  )}
                {selectedDetail.vendor.approvalStatus !== 'APPROVED' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openCorrectionModal(selectedDetail.vendor)}
                  >
                    <AlertCircle className="w-3.5 h-3.5" /> Request Correction
                  </Button>
                )}
                {selectedDetail.vendor.approvalStatus !== 'REJECTED' &&
                  selectedDetail.vendor.approvalStatus !== 'APPROVED' && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        setReasonText('');
                        setActionModal({ type: 'REJECT', vendor: selectedDetail.vendor });
                      }}
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject Vendor
                    </Button>
                  )}
              </div>
              <div>
                {selectedDetail.vendor.approvalStatus === 'APPROVED' ? (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      setReasonText('');
                      setActionModal({ type: 'SUSPEND', vendor: selectedDetail.vendor });
                    }}
                  >
                    <PauseCircle className="w-3.5 h-3.5" /> Suspend Vendor
                  </Button>
                ) : selectedDetail.vendor.approvalStatus === 'SUSPENDED' ? (
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => handleActivate(selectedDetail.vendor)}
                  >
                    <PlayCircle className="w-3.5 h-3.5" /> Re-Activate Vendor
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Approve Vendor Confirmation Dialog */}
      <Modal
        open={Boolean(approveConfirmVendor)}
        onClose={() => !approving && setApproveConfirmVendor(null)}
        title="Confirm Vendor Approval"
      >
        {approveConfirmVendor && (
          <div className="space-y-4 text-xs">
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#FAF7F4] border border-[#E5DCD3]">
              <ShieldCheck className="w-5 h-5 text-[#15966B] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-[#5E5946]">
                  Approve {approveConfirmVendor.businessName}?
                </p>
                <p className="text-[#6E6859]">
                  Verified KYC progress: {approveConfirmVendor.kycSummary?.verifiedCount || 0}/
                  {approveConfirmVendor.kycSummary?.totalRequired || 4} documents verified. GSTIN:{' '}
                  <span className="font-mono">{approveConfirmVendor.gstin || 'Pending'}</span>.
                </p>
              </div>
            </div>

            {(approveConfirmVendor.kycSummary?.rejectedCount || 0) > 0 && (
              <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#C94444]/30 text-[#C94444] font-medium">
                Warning: This vendor has rejected KYC documents. Replace or verify rejected documents before approving.
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={approving}
                onClick={() => setApproveConfirmVendor(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="success"
                disabled={approving || (approveConfirmVendor.kycSummary?.rejectedCount || 0) > 0}
                onClick={confirmApproveVendor}
              >
                {approving ? 'Approving...' : 'Confirm & Approve Vendor'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reason / Request Correction Modal */}
      <Modal
        open={Boolean(actionModal)}
        onClose={() => setActionModal(null)}
        title={
          actionModal?.type === 'DOC_REJECT'
            ? `Reject Document: ${actionModal.doc?.title || actionModal.doc?.type || ''}`
            : actionModal?.type === 'REJECT'
              ? 'Reject Vendor Application'
              : actionModal?.type === 'CORRECTION'
                ? 'Request Document / Profile Correction'
                : 'Suspend Vendor Account'
        }
      >
        <form onSubmit={submitReasonModal} className="space-y-4">
          <p className="text-xs text-[#6E6859]">
            Target Vendor: <strong className="text-[#5E5946]">{actionModal?.vendor?.businessName}</strong>
          </p>

          {actionModal?.type === 'CORRECTION' &&
            Array.isArray(actionModal.vendor?.documents) &&
            actionModal.vendor.documents.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-[#5E5946] mb-1">
                  Document Requiring Correction (Optional)
                </label>
                <select
                  value={selectedCorrectionDocId}
                  onChange={(e) => setSelectedCorrectionDocId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E5DCD3] rounded-lg focus:outline-none focus:border-[#AE887B]"
                >
                  <option value="">General Profile / Multiple Documents</option>
                  {actionModal.vendor.documents.map((d: any) => (
                    <option key={d.id} value={d.id}>
                      {d.title || d.type} ({d.fileName})
                    </option>
                  ))}
                </select>
              </div>
            )}

          <div>
            <label className="block text-xs font-semibold text-[#5E5946] mb-1">
              Reason / Instructions (visible to vendor)
            </label>
            <textarea
              required
              rows={3}
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-[#E5DCD3] rounded-lg focus:outline-none focus:border-[#AE887B]"
              placeholder={
                actionModal?.type === 'DOC_REJECT'
                  ? 'e.g., Document scan is blurry or GSTIN does not match registered legal name...'
                  : 'Provide clear audit reason or required corrections...'
              }
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setActionModal(null)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={
                actionModal?.type === 'REJECT' || actionModal?.type === 'DOC_REJECT'
                  ? 'danger'
                  : 'primary'
              }
            >
              Confirm Action
            </Button>
          </div>
        </form>
      </Modal>

      {/* Secure KYC Document Preview Modal */}
      <KycDocumentPreviewModal
        open={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        vendorId={selectedDetail?.vendor?.id || ''}
        vendorName={selectedDetail?.vendor?.businessName}
        doc={previewDoc}
        onVerify={(doc) => handleVerifyDoc(selectedDetail.vendor.id, doc.id, 'VERIFIED')}
        onRequestReject={(doc) => openRejectDocModal(selectedDetail.vendor, doc)}
        onDownload={(doc) => handleDownloadDoc(selectedDetail.vendor.id, doc)}
      />
    </div>
  );
};
