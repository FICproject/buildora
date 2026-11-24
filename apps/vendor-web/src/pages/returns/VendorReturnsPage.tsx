import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  Boxes,
  ShieldAlert,
  ArrowRight,
  Package,
  Calendar,
  IndianRupee,
} from 'lucide-react';
import { vendorApi } from '../../services/vendorApi';
import { VendorReturnRequest } from '@buildora/types';

export const VendorReturnsPage: React.FC = () => {
  const [returns, setReturns] = useState<VendorReturnRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Inspection modal
  const [inspectingReturn, setInspectingReturn] = useState<VendorReturnRequest | null>(null);
  const [restockDecision, setRestockDecision] = useState(true);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadReturns = async () => {
    setLoading(true);
    try {
      const data = await vendorApi.getReturns(statusFilter === 'ALL' ? undefined : statusFilter);
      setReturns(data);
    } catch (err) {
      console.error('Failed to load returns', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReturns();
  }, [statusFilter]);

  const handleApproveInspection = async () => {
    if (!inspectingReturn) return;
    setSubmitting(true);
    try {
      await vendorApi.updateReturnStatus(inspectingReturn.id, 'REFUNDED', restockDecision);
      setInspectingReturn(null);
      loadReturns();
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectReturn = async () => {
    if (!inspectingReturn || !rejectionReason) return;
    setSubmitting(true);
    try {
      await vendorApi.updateReturnStatus(inspectingReturn.id, 'REJECTED', false, rejectionReason);
      setInspectingReturn(null);
      loadReturns();
    } finally {
      setSubmitting(false);
    }
  };

  const filteredReturns = returns.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.orderNumber.toLowerCase().includes(q) ||
      r.customerName.toLowerCase().includes(q) ||
      r.items.some((i) => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#203D91]/10 text-[#203D91] border border-[#203D91]/20">
              REVERSE LOGISTICS & QUALITY
            </span>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
              Physical Yard Inspection
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#17233C] tracking-tight">
            Customer Returns & Refund Management
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Inspect returned contractor materials, approve customer refunds, and restock sealed inventory automatically.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#17233C] bg-[#F4F7FC] px-3.5 py-2 rounded-xl border border-[#E2E8F0]">
            Pending Inspection: <strong className="text-[#203D91]">{returns.filter((r) => r.status === 'INSPECTION_PENDING' || r.status === 'REQUESTED').length}</strong>
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#E2E8F0] shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {['ALL', 'REQUESTED', 'INSPECTION_PENDING', 'REFUNDED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === st
                  ? 'bg-[#203D91] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#203D91] hover:bg-[#F4F7FC]'
              }`}
            >
              {st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order #, customer, SKU..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-[#E2E8F0] focus:border-[#203D91] outline-hidden"
          />
        </div>
      </div>

      {/* Returns List Cards */}
      <div className="space-y-3">
        {filteredReturns.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-[#E2E8F0] text-slate-500 text-xs">
            No return requests found matching current filter.
          </div>
        ) : (
          filteredReturns.map((ret) => (
            <div
              key={ret.id}
              className="bg-white p-5 rounded-2xl border border-[#E2E8F0] hover:border-[#203D91] shadow-xs transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-[#17233C]">#{ret.orderNumber}</span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs font-semibold text-slate-600">Customer: <strong className="text-[#17233C]">{ret.customerName}</strong></span>
                  {ret.customerPhone && <span className="text-xs text-slate-400">({ret.customerPhone})</span>}
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      ret.status === 'REFUNDED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : ret.status === 'REJECTED'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : ret.status === 'INSPECTION_PENDING'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-blue-50 text-[#203D91] border-blue-200'
                    }`}
                  >
                    {ret.status.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs font-extrabold text-[#17233C]">
                    Refund: ₹{ret.totalRefundAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Items in Return */}
              <div className="space-y-2">
                {ret.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#F4F7FC] border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-[#17233C] truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-500">
                        SKU: <strong className="text-[#17233C]">{item.sku}</strong> • Qty: <strong>{item.quantity}</strong>
                      </p>
                      <p className="text-[10px] text-amber-700 mt-0.5">
                        Reason: {item.returnReason}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-white border border-[#E2E8F0] text-slate-700">
                        Condition: {item.productCondition}
                      </span>
                      <span className="font-extrabold text-[#17233C]">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 text-xs">
                <span className="text-[11px] text-slate-400">
                  Requested on {new Date(ret.requestedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  {ret.resolvedAt && ` • Resolved: ${new Date(ret.resolvedAt).toLocaleDateString('en-IN')}`}
                </span>

                {(ret.status === 'INSPECTION_PENDING' || ret.status === 'REQUESTED') && (
                  <button
                    onClick={() => {
                      setInspectingReturn(ret);
                      setRestockDecision(true);
                      setRejectionReason('');
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-[#203D91] text-white hover:bg-[#17233C] transition-colors shadow-2xs"
                  >
                    <Boxes className="w-3.5 h-3.5 text-[#FF7417]" />
                    Conduct Yard Inspection
                  </button>
                )}

                {ret.restockDecision && (
                  <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Automatically Restocked in Inventory
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* INSPECTION MODAL */}
      {inspectingReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-[#E2E8F0] shadow-xl space-y-4">
            <div>
              <h3 className="text-lg font-black text-[#17233C]">Physical Yard Return Inspection</h3>
              <p className="text-xs text-slate-500">Order #{inspectingReturn.orderNumber} • {inspectingReturn.customerName}</p>
            </div>

            <div className="p-3 rounded-xl bg-[#F4F7FC] border border-[#E2E8F0] text-xs space-y-1">
              <p className="font-bold text-[#17233C]">Items under inspection:</p>
              {inspectingReturn.items.map((item, idx) => (
                <p key={idx} className="text-slate-600">
                  • {item.quantity}x {item.name} (Condition declared: {item.productCondition})
                </p>
              ))}
              <p className="text-emerald-700 font-extrabold pt-1">
                Total Refund Value: ₹{inspectingReturn.totalRefundAmount.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-[#E2E8F0] bg-white cursor-pointer hover:border-[#203D91]">
                <input
                  type="checkbox"
                  checked={restockDecision}
                  onChange={(e) => setRestockDecision(e.target.checked)}
                  className="w-4 h-4 rounded text-[#203D91] mt-0.5"
                />
                <div className="text-xs">
                  <strong className="text-[#17233C] block">Restock directly into Yard Inventory</strong>
                  <span className="text-slate-500 text-[11px]">
                    Material passed QA check (sealed, unpunctured, zero water damage). Stock count will be automatically increased.
                  </span>
                </div>
              </label>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rejection Reason (If refusing return):
                </label>
                <input
                  type="text"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Broken tiles, cement bags water hardened on customer site"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E2E8F0] outline-hidden focus:border-rose-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setInspectingReturn(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-[#F4F7FC] rounded-xl"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={submitting || !rejectionReason}
                  onClick={handleRejectReturn}
                  className="px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors disabled:opacity-50"
                >
                  Reject Return
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleApproveInspection}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#203D91] hover:bg-[#17233C] rounded-xl transition-colors shadow-xs"
                >
                  Approve & Issue Refund
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default VendorReturnsPage;