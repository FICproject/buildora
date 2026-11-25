import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Search, MapPin, CheckCircle2, XCircle } from 'lucide-react';
import { vendorApi } from '../../services/vendorApi';
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

export const VendorQuotationsPage: React.FC = () => {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedRfq, setSelectedRfq] = useState<any | null>(null);
  const [quotedItems, setQuotedItems] = useState<any[]>([]);
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10)
  );
  const [vendorNotes, setVendorNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadQuotations = async () => {
    try {
      const data = await vendorApi.getQuotations();
      setQuotations(data || []);
    } catch {
      toast.error('Failed to load quotation requests.');
    }
  };

  useEffect(() => {
    loadQuotations();
  }, []);

  const openQuoteModal = (rfq: any) => {
    setSelectedRfq(rfq);
    setQuotedItems(
      (rfq.items || []).map((item: any) => ({
        ...item,
        quotedPrice: item.quotedPrice ?? item.targetPrice ?? 0,
      }))
    );
    setValidUntil(
      rfq.validUntil
        ? new Date(rfq.validUntil).toISOString().slice(0, 10)
        : new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10)
    );
    setVendorNotes(rfq.vendorNotes || '');
  };

  const handleItemPriceChange = (idx: number, val: number) => {
    const next = [...quotedItems];
    next[idx] = { ...next[idx], quotedPrice: Math.max(0, val) };
    setQuotedItems(next);
  };

  const quotedTotal = quotedItems.reduce(
    (sum, item) => sum + (Number(item.quotedPrice) || 0) * (Number(item.quantity) || 0),
    0
  );

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRfq || submitting) return;
    setSubmitting(true);
    try {
      await vendorApi.submitQuotation(selectedRfq.id, {
        quotedTotal,
        items: quotedItems,
        validUntil,
        vendorNotes,
      });
      toast.success(`Quotation submitted for ${selectedRfq.rfqNumber}.`);
      setSelectedRfq(null);
      loadQuotations();
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: 'ACCEPTED' | 'REJECTED') => {
    await vendorApi.updateQuotationStatus(id, status);
    toast.success(`Quotation marked as ${status.toLowerCase()}.`);
    setSelectedRfq(null);
    loadQuotations();
  };

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return 'success';
      case 'PENDING_QUOTE':
        return 'accent';
      case 'QUOTED':
        return 'brand';
      case 'REJECTED':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  const filtered = quotations.filter((q) => {
    const matchesStatus = statusFilter === 'ALL' || q.status === statusFilter;
    const term = search.toLowerCase();
    const matchesSearch =
      !term ||
      q.rfqNumber.toLowerCase().includes(term) ||
      q.customerName.toLowerCase().includes(term) ||
      q.contactPerson.toLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Bulk Orders / Quotations"
        description="Review incoming bulk material requests, submit quoted prices, and track negotiation status."
      />

      {/* Filter & Search */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap gap-1.5 border-b border-[#E5E9F0] pb-3">
            {[
              { id: 'ALL', label: 'All Requests' },
              { id: 'PENDING_QUOTE', label: 'Incoming Requests' },
              { id: 'QUOTED', label: 'Quoted / Negotiating' },
              { id: 'ACCEPTED', label: 'Accepted' },
              { id: 'REJECTED', label: 'Rejected' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setStatusFilter(t.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  statusFilter === t.id
                    ? 'bg-[#23438F] text-white'
                    : 'text-[#718096] hover:text-[#263247] hover:bg-[#F7F8FA]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-[#718096] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by RFQ number, company, or contact name..."
              className="portal-input pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F8FA] text-[#718096] font-semibold border-b border-[#E5E9F0]">
              <tr>
                <th className="py-3 px-4">RFQ Number</th>
                <th className="py-3 px-4">Customer & Site</th>
                <th className="py-3 px-4">Materials Requested</th>
                <th className="py-3 px-4">Quoted Price</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E9F0]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={<FileSpreadsheet className="w-5 h-5" />}
                      title="No quotation requests found"
                      description="Bulk quotation requests from contractors will appear here."
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((rfq) => (
                  <tr
                    key={rfq.id}
                    onClick={() => openQuoteModal(rfq)}
                    className="hover:bg-[#F7F8FA] cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-semibold text-[#263247]">{rfq.rfqNumber}</div>
                      <div className="text-[11px] text-[#718096]">
                        Need by {new Date(rfq.requiredBy).toLocaleDateString('en-IN')}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-[#263247]">{rfq.customerName}</div>
                      <div className="text-[11px] text-[#718096] flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate max-w-[200px]">{rfq.siteLocation}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-[#263247]">
                        {rfq.items?.[0]?.name}
                        {rfq.items?.length > 1 ? ` +${rfq.items.length - 1} more` : ''}
                      </div>
                      <div className="text-[11px] text-[#718096]">
                        Total qty: {rfq.items?.reduce((s: number, i: any) => s + i.quantity, 0)} units
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#263247]">
                      {rfq.quotedTotal > 0 ? `₹${rfq.quotedTotal.toLocaleString('en-IN')}` : 'Pending'}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={getBadgeVariant(rfq.status)} size="sm">
                        {rfq.status.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant={rfq.status === 'PENDING_QUOTE' ? 'accent' : 'secondary'}
                        onClick={() => openQuoteModal(rfq)}
                      >
                        {rfq.status === 'PENDING_QUOTE' ? 'Submit Quote' : 'View Details'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Request Details & Submit Quotation Modal */}
      <Modal
        isOpen={Boolean(selectedRfq)}
        onClose={() => setSelectedRfq(null)}
        title={`Request ${selectedRfq?.rfqNumber || ''}`}
        subtitle={selectedRfq ? `${selectedRfq.customerName} • ${selectedRfq.contactPerson}` : ''}
        maxWidth="2xl"
      >
        {selectedRfq && (
          <form onSubmit={handleSubmitQuote} className="space-y-5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#F7F8FA] border border-[#E5E9F0]">
              <div>
                <span className="text-[#718096] block">Delivery Site</span>
                <span className="font-medium text-[#263247]">{selectedRfq.siteLocation}</span>
              </div>
              <div>
                <span className="text-[#718096] block">Negotiation Status</span>
                <span className="font-semibold text-[#23438F]">
                  {(selectedRfq.negotiationStatus || selectedRfq.status).replace(/_/g, ' ')}
                </span>
              </div>
              {selectedRfq.notes && (
                <div className="sm:col-span-2">
                  <span className="text-[#718096] block">Buyer Notes</span>
                  <span className="text-[#263247]">{selectedRfq.notes}</span>
                </div>
              )}
            </div>

            <div>
              <h4 className="font-semibold text-[#263247] mb-2">Material Requirements & Pricing</h4>
              <div className="border border-[#E5E9F0] rounded-xl overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7F8FA] text-[#718096] font-semibold border-b border-[#E5E9F0]">
                    <tr>
                      <th className="py-2.5 px-3">Material</th>
                      <th className="py-2.5 px-3 text-right">Qty</th>
                      <th className="py-2.5 px-3 text-right">Target Price</th>
                      <th className="py-2.5 px-3 text-right">Your Quote (₹/unit)</th>
                      <th className="py-2.5 px-3 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E9F0]">
                    {quotedItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-[#263247]">{item.name}</div>
                          <div className="text-[11px] font-mono text-[#718096]">{item.sku}</div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right text-[#718096]">
                          ₹{(item.targetPrice || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            min="1"
                            disabled={
                              selectedRfq.status === 'ACCEPTED' || selectedRfq.status === 'REJECTED'
                            }
                            value={item.quotedPrice}
                            onChange={(e) => handleItemPriceChange(idx, Number(e.target.value))}
                            className="w-24 px-2 py-1 text-right border border-[#E5E9F0] rounded-md font-semibold"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-[#263247]">
                          ₹
                          {(
                            (Number(item.quotedPrice) || 0) * (Number(item.quantity) || 0)
                          ).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="portal-label">Quote Valid Until</label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="portal-input"
                />
              </div>
              <div className="flex flex-col justify-end p-3 rounded-lg bg-[#EEF3FA] border border-[#23438F]/15">
                <span className="text-[11px] text-[#718096]">Total Quoted Amount</span>
                <span className="text-lg font-bold text-[#23438F]">
                  ₹{quotedTotal.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="sm:col-span-2">
                <label className="portal-label">Terms / Delivery Notes</label>
                <textarea
                  rows={2}
                  value={vendorNotes}
                  onChange={(e) => setVendorNotes(e.target.value)}
                  placeholder="Optional payment or dispatch schedule notes..."
                  className="portal-input"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#E5E9F0]">
              <div className="flex items-center gap-2">
                {selectedRfq.status === 'QUOTED' && (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => handleStatusUpdate(selectedRfq.id, 'ACCEPTED')}
                      leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-[#15966B]" />}
                    >
                      Mark Accepted
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => handleStatusUpdate(selectedRfq.id, 'REJECTED')}
                      leftIcon={<XCircle className="w-3.5 h-3.5 text-[#DC4545]" />}
                    >
                      Mark Rejected
                    </Button>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedRfq(null)}
                >
                  Close
                </Button>
                {selectedRfq.status !== 'ACCEPTED' && selectedRfq.status !== 'REJECTED' && (
                  <Button type="submit" variant="primary" size="sm" isLoading={submitting}>
                    {selectedRfq.status === 'QUOTED' ? 'Update Quotation' : 'Submit Quotation'}
                  </Button>
                )}
              </div>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default VendorQuotationsPage;
