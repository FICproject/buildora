import React, { useEffect, useState } from 'react';
import {
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  PauseCircle,
  PlayCircle,
  FileText,
  Star,
  Store,
} from 'lucide-react';
import { adminApi, formatINR } from '../services/adminApi';
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
  { id: 'ALL', label: 'All Vendors' },
  { id: 'PENDING_VERIFICATION', label: 'Pending Approvals' },
  { id: 'RESUBMISSION_REQUIRED', label: 'Correction Requested' },
  { id: 'APPROVED', label: 'Approved Vendors' },
  { id: 'REJECTED', label: 'Rejected' },
  { id: 'SUSPENDED', label: 'Suspended' },
];

export const VendorsPage: React.FC = () => {
  const pushToast = useToastStore((s) => s.push);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<any>(null);

  const [actionModal, setActionModal] = useState<{
    type: 'REJECT' | 'CORRECTION' | 'SUSPEND';
    vendor: any;
  } | null>(null);
  const [reasonText, setReasonText] = useState('');

  const loadVendors = async (st = statusFilter, q = search) => {
    setLoading(true);
    try {
      const list = await adminApi.getVendors(st, q);
      setVendors(list || []);
    } catch (err: any) {
      pushToast({ title: 'Failed to load vendors', message: err.message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, [statusFilter]);

  const openVendorDetail = async (id: string) => {
    try {
      const res = await adminApi.getVendorDetail(id);
      setSelectedDetail(res);
      setDetailOpen(true);
    } catch (err: any) {
      pushToast({ title: 'Error', message: err.message, variant: 'error' });
    }
  };

  const handleApprove = async (v: any) => {
    try {
      await adminApi.approveVendor(v.id, { notes: 'Verified KYC & Bank Details' });
      pushToast({ title: 'Vendor Approved', message: `${v.businessName} is now active.` });
      await loadVendors();
      if (detailOpen && selectedDetail?.vendor?.id === v.id) openVendorDetail(v.id);
    } catch (err: any) {
      pushToast({ title: 'Approval Failed', message: err.message, variant: 'error' });
    }
  };

  const handleActivate = async (v: any) => {
    try {
      await adminApi.activateVendor(v.id);
      pushToast({ title: 'Vendor Activated', message: `${v.businessName} re-activated.` });
      await loadVendors();
      if (detailOpen) openVendorDetail(v.id);
    } catch (err: any) {
      pushToast({ title: 'Action Failed', message: err.message, variant: 'error' });
    }
  };

  const handleVerifyDoc = async (vendorId: string, docId: string, status: 'VERIFIED' | 'REJECTED') => {
    try {
      await adminApi.verifyVendorDocument(vendorId, docId, status);
      pushToast({ title: `Document ${status}` });
      await openVendorDetail(vendorId);
    } catch (err: any) {
      pushToast({ title: 'Failed', message: err.message, variant: 'error' });
    }
  };

  const submitReasonModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal) return;
    try {
      if (actionModal.type === 'REJECT') {
        await adminApi.rejectVendor(actionModal.vendor.id, reasonText);
        pushToast({ title: 'Vendor Rejected' });
      } else if (actionModal.type === 'CORRECTION') {
        await adminApi.requestVendorCorrection(actionModal.vendor.id, reasonText);
        pushToast({ title: 'Correction Requested', variant: 'info' });
      } else {
        await adminApi.suspendVendor(actionModal.vendor.id, reasonText);
        pushToast({ title: 'Vendor Suspended', variant: 'warning' });
      }
      setActionModal(null);
      setReasonText('');
      await loadVendors();
      if (detailOpen) openVendorDetail(actionModal.vendor.id);
    } catch (err: any) {
      pushToast({ title: 'Error', message: err.message, variant: 'error' });
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Vendor Management"
        description="Verify KYC documents, approve vendor applications, monitor fulfillment performance & settlements."
      />

      {/* Filter Tabs + Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {VENDOR_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setStatusFilter(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                statusFilter === t.id
                  ? 'bg-[#AE887B] text-white border-[#AE887B] shadow-sm'
                  : 'bg-white text-[#5E5946] border-[#E5DCD3] hover:bg-[#F0DED0]/45'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadVendors(statusFilter, search);
          }}
          className="relative flex items-center gap-2"
        >
          <div className="relative">
            <Search className="w-4 h-4 text-[#6E6859] absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search business, GSTIN, city..."
              className="pl-9 pr-3 py-2 text-xs bg-white border border-[#E5DCD3] rounded-lg w-64 focus:outline-none focus:border-[#AE887B]"
            />
          </div>
          <Button type="submit" size="sm" variant="secondary">
            Search
          </Button>
        </form>
      </div>

      {/* Vendors Table */}
      <Card noPadding>
        {loading ? (
          <div className="py-12 text-center text-xs text-[#6E6859]">Loading vendors...</div>
        ) : vendors.length === 0 ? (
          <EmptyState
            icon={<Store className="w-5 h-5" />}
            title="No vendors match this filter"
            description="Switch status filter or clear search query."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F0DED0]/75 border-b border-[#E5DCD3] text-[11px] font-semibold text-[#5E5946] uppercase">
                  <th className="py-3 px-4">Vendor / Store</th>
                  <th className="py-3 px-3">GSTIN & City</th>
                  <th className="py-3 px-3">Rating / SLA</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DCD3] text-xs bg-white">
                {vendors.map((v) => (
                  <tr key={v.id} className="hover:bg-[#FAF7F4] transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-[#5E5946]">{v.businessName}</p>
                      <p className="text-[#6E6859]">
                        {v.email} • {v.phone}
                      </p>
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-mono text-[#5E5946]">{v.gstin || 'Pending'}</p>
                      <p className="text-[#6E6859]">
                        {v.city}, {v.state}
                      </p>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1 text-[#5E5946] font-medium">
                        <Star className="w-3.5 h-3.5 text-[#AE887B] fill-[#AE887B]" />
                        {v.rating || 'New'} • {v.fulfillmentRate}% SLA
                      </div>
                      <p className="text-[#6E6859]">{v.commissionRate}% commission</p>
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant={statusBadgeVariant(v.approvalStatus)}>
                        {v.approvalStatus}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openVendorDetail(v.id)}
                      >
                        Inspect
                      </Button>
                      {(v.approvalStatus === 'PENDING_VERIFICATION' ||
                        v.approvalStatus === 'RESUBMISSION_REQUIRED') && (
                        <>
                          <Button size="sm" variant="success" onClick={() => handleApprove(v)}>
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setReasonText('');
                              setActionModal({ type: 'CORRECTION', vendor: v });
                            }}
                          >
                            Correction
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => {
                              setReasonText('');
                              setActionModal({ type: 'REJECT', vendor: v });
                            }}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {(v.approvalStatus === 'APPROVED' || v.approvalStatus === 'ACTIVE') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setReasonText('');
                            setActionModal({ type: 'SUSPEND', vendor: v });
                          }}
                        >
                          Suspend
                        </Button>
                      )}
                      {v.approvalStatus === 'SUSPENDED' && (
                        <Button size="sm" variant="success" onClick={() => handleActivate(v)}>
                          Activate
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Vendor Detail Drawer */}
      <Drawer
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={selectedDetail?.vendor?.businessName || 'Vendor Profile'}
        subtitle={`GSTIN: ${selectedDetail?.vendor?.gstin || 'N/A'} • ${selectedDetail?.vendor?.city}`}
      >
        {selectedDetail && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-[#F9F2EC] border border-[#E5DCD3]">
              <div>
                <p className="text-xs text-[#6E6859]">Current Status</p>
                <Badge variant={statusBadgeVariant(selectedDetail.vendor.approvalStatus)} className="mt-1">
                  {selectedDetail.vendor.approvalStatus}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedDetail.vendor.approvalStatus !== 'APPROVED' && (
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => handleApprove(selectedDetail.vendor)}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve Vendor
                  </Button>
                )}
                {selectedDetail.vendor.approvalStatus === 'APPROVED' ? (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => setActionModal({ type: 'SUSPEND', vendor: selectedDetail.vendor })}
                  >
                    <PauseCircle className="w-3.5 h-3.5" /> Suspend
                  </Button>
                ) : selectedDetail.vendor.approvalStatus === 'SUSPENDED' ? (
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => handleActivate(selectedDetail.vendor)}
                  >
                    <PlayCircle className="w-3.5 h-3.5" /> Re-Activate
                  </Button>
                ) : null}
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 border border-[#E5DCD3] rounded-lg bg-white">
                <p className="text-[11px] text-[#6E6859]">Total Products</p>
                <p className="text-lg font-bold text-[#5E5946]">{selectedDetail.metrics?.totalProducts || 0}</p>
              </div>
              <div className="p-3 border border-[#E5DCD3] rounded-lg bg-white">
                <p className="text-[11px] text-[#6E6859]">Live SKUs</p>
                <p className="text-lg font-bold text-[#15966B]">{selectedDetail.metrics?.liveProducts || 0}</p>
              </div>
              <div className="p-3 border border-[#E5DCD3] rounded-lg bg-white">
                <p className="text-[11px] text-[#6E6859]">Total Orders</p>
                <p className="text-lg font-bold text-[#5E5946]">{selectedDetail.metrics?.totalOrders || 0}</p>
              </div>
              <div className="p-3 border border-[#E5DCD3] rounded-lg bg-[#F9F2EC]">
                <p className="text-[11px] text-[#6E6859]">Pending Payout</p>
                <p className="text-lg font-bold text-[#AE887B]">
                  {formatINR(selectedDetail.metrics?.pendingSettlementAmount)}
                </p>
              </div>
            </div>

            {/* Submitted Documents */}
            <div>
              <h4 className="text-sm font-semibold text-[#5E5946] mb-2">KYC & Compliance Documents</h4>
              {(selectedDetail.vendor.documents || []).length === 0 ? (
                <p className="text-xs text-[#6E6859] p-3 border border-[#E5DCD3] rounded-lg">
                  Pre-verified onboarding vendor profile (no pending document uploads).
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedDetail.vendor.documents.map((doc: any) => (
                    <div
                      key={doc.id}
                      className="p-3 border border-[#E5DCD3] rounded-lg flex items-center justify-between gap-2 text-xs bg-white"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-[#AE887B]" />
                        <div>
                          <p className="font-semibold text-[#5E5946]">{doc.title || doc.type}</p>
                          <p className="text-[#6E6859]">{doc.fileName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={statusBadgeVariant(doc.status)}>{doc.status}</Badge>
                        {doc.status !== 'VERIFIED' && (
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => handleVerifyDoc(selectedDetail.vendor.id, doc.id, 'VERIFIED')}
                          >
                            Verify
                          </Button>
                        )}
                        {doc.status !== 'REJECTED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVerifyDoc(selectedDetail.vendor.id, doc.id, 'REJECTED')}
                          >
                            Reject
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bank Details */}
            {selectedDetail.vendor.bankAccount && (
              <div>
                <h4 className="text-sm font-semibold text-[#5E5946] mb-2">Settlement Bank Account</h4>
                <div className="p-3.5 border border-[#E5DCD3] rounded-lg text-xs space-y-1.5 bg-[#FAF7F4]">
                  <p>
                    <span className="text-[#6E6859]">Beneficiary:</span>{' '}
                    <span className="font-semibold text-[#5E5946]">{selectedDetail.vendor.bankAccount.accountHolderName}</span>
                  </p>
                  <p>
                    <span className="text-[#6E6859]">Bank / IFSC:</span>{' '}
                    <span className="font-semibold text-[#5E5946]">
                      {selectedDetail.vendor.bankAccount.bankName} ({selectedDetail.vendor.bankAccount.ifsc || selectedDetail.vendor.bankAccount.ifscCode})
                    </span>
                  </p>
                  <p>
                    <span className="text-[#6E6859]">Account Number:</span>{' '}
                    <span className="font-mono text-[#5E5946]">
                      {selectedDetail.vendor.bankAccount.accountNumber || selectedDetail.vendor.bankAccount.accountNumberMasked}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Reason Modal */}
      <Modal
        open={Boolean(actionModal)}
        onClose={() => setActionModal(null)}
        title={
          actionModal?.type === 'REJECT'
            ? 'Reject Vendor Application'
            : actionModal?.type === 'CORRECTION'
              ? 'Request Document / Profile Corrections'
              : 'Suspend Vendor Account'
        }
      >
        <form onSubmit={submitReasonModal} className="space-y-4">
          <p className="text-xs text-[#6E6859]">
            Target Vendor: <strong className="text-[#5E5946]">{actionModal?.vendor?.businessName}</strong>
          </p>
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
              placeholder="Provide clear audit reason or required corrections..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setActionModal(null)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={actionModal?.type === 'REJECT' ? 'danger' : 'primary'}
            >
              Confirm Action
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
