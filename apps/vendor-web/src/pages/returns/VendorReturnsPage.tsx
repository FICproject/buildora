import React, { useState, useEffect } from 'react';
import { RotateCcw, Search, Boxes, CheckCircle2 } from 'lucide-react';
import { vendorApi } from '../../services/vendorApi';
import { VendorReturnRequest } from '@buildora/types';
import {
  PageHeader,
  Card,
  CardContent,
  Button,
  Badge,
  Modal,
  EmptyState,
} from '../../components/common';
import { toast } from '../../store/useToastStore';

export const VendorReturnsPage: React.FC = () => {
  const [returns, setReturns] = useState<VendorReturnRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [inspectingReturn, setInspectingReturn] = useState<VendorReturnRequest | null>(null);
  const [restockDecision, setRestockDecision] = useState(true);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadReturns = async () => {
    try {
      const data = await vendorApi.getReturns(statusFilter === 'ALL' ? undefined : statusFilter);
      setReturns(data || []);
    } catch {}
  };

  useEffect(() => {
    loadReturns();
  }, [statusFilter]);

  const handleApproveInspection = async () => {
    if (!inspectingReturn || submitting) return;
    setSubmitting(true);
    try {
      await vendorApi.updateReturnStatus(inspectingReturn.id, 'REFUNDED', restockDecision);
      toast.success('Return approved and refund processed.');
      setInspectingReturn(null);
      loadReturns();
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectReturn = async () => {
    if (!inspectingReturn || !rejectionReason.trim() || submitting) return;
    setSubmitting(true);
    try {
      await vendorApi.updateReturnStatus(
        inspectingReturn.id,
        'REJECTED',
        false,
        rejectionReason.trim()
      );
      toast.success('Return request rejected.');
      setInspectingReturn(null);
      loadReturns();
    } finally {
      setSubmitting(false);
    }
  };

  const filteredReturns = returns.filter((r) => {
    const q = search.toLowerCase();
    return (
      !q ||
      r.orderNumber.toLowerCase().includes(q) ||
      r.customerName.toLowerCase().includes(q) ||
      r.items.some((i) => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Returns & Inspections"
        description="Inspect returned materials, approve refunds, and restock eligible inventory."
      />

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap gap-1.5 border-b border-[#E5E9F0] pb-3">
            {['ALL', 'REQUESTED', 'INSPECTION_PENDING', 'REFUNDED', 'REJECTED'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[#23438F] text-white'
                    : 'text-[#718096] hover:text-[#263247] hover:bg-[#F7F8FA]'
                }`}
              >
                {st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-[#718096] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order number, customer, or SKU..."
              className="portal-input pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {filteredReturns.length === 0 ? (
          <Card>
            <EmptyState
              icon={<RotateCcw className="w-5 h-5" />}
              title="No return requests"
              description="No return requests match the selected filter."
            />
          </Card>
        ) : (
          filteredReturns.map((ret) => (
            <Card key={ret.id}>
              <CardContent className="p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E5E9F0]">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono font-semibold text-sm text-[#263247]">
                      #{ret.orderNumber}
                    </span>
                    <span className="text-[#718096]">• {ret.customerName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        ret.status === 'REFUNDED'
                          ? 'success'
                          : ret.status === 'REJECTED'
                          ? 'danger'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {ret.status.replace(/_/g, ' ')}
                    </Badge>
                    <span className="text-xs font-semibold text-[#263247]">
                      ₹{ret.totalRefundAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {ret.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-[#F7F8FA] border border-[#E5E9F0] flex flex-wrap items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <p className="font-medium text-[#263247]">{item.name}</p>
                        <p className="text-[11px] text-[#718096]">
                          SKU: {item.sku} • Qty: {item.quantity} • Reason: {item.returnReason}
                        </p>
                      </div>
                      <Badge variant="neutral" size="sm">
                        {item.productCondition}
                      </Badge>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-[#718096]">
                    Requested {new Date(ret.requestedAt).toLocaleDateString('en-IN')}
                  </span>
                  {(ret.status === 'INSPECTION_PENDING' || ret.status === 'REQUESTED') && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        setInspectingReturn(ret);
                        setRestockDecision(true);
                        setRejectionReason('');
                      }}
                      leftIcon={<Boxes className="w-3.5 h-3.5" />}
                    >
                      Inspect Return
                    </Button>
                  )}
                  {ret.restockDecision && (
                    <span className="text-[#15966B] font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Restocked in inventory
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Modal
        isOpen={Boolean(inspectingReturn)}
        onClose={() => setInspectingReturn(null)}
        title="Return Inspection"
        subtitle={inspectingReturn ? `Order #${inspectingReturn.orderNumber}` : ''}
        maxWidth="md"
      >
        {inspectingReturn && (
          <div className="space-y-4 text-xs">
            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-[#E5E9F0] cursor-pointer">
              <input
                type="checkbox"
                checked={restockDecision}
                onChange={(e) => setRestockDecision(e.target.checked)}
                className="w-4 h-4 rounded text-[#23438F] mt-0.5"
              />
              <div>
                <p className="font-semibold text-[#263247]">Restock into Inventory</p>
                <p className="text-[#718096]">
                  Return is sealed and undamaged. Add quantity back to available stock.
                </p>
              </div>
            </label>

            <div>
              <label className="portal-label">Rejection Reason (only if rejecting)</label>
              <input
                type="text"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Damaged packaging or opened material"
                className="portal-input"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#E5E9F0]">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setInspectingReturn(null)}
              >
                Cancel
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  disabled={submitting || !rejectionReason.trim()}
                  onClick={handleRejectReturn}
                >
                  Reject
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  isLoading={submitting}
                  onClick={handleApproveInspection}
                >
                  Approve & Refund
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default VendorReturnsPage;
