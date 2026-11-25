import React, { useEffect, useState } from 'react';
import { FileSpreadsheet, Send, CheckCircle2, ArrowRightCircle, MessageSquare } from 'lucide-react';
import { adminApi, formatINR, formatDateTime } from '../services/adminApi';
import {
  PageHeader,
  Card,
  Badge,
  Button,
  Drawer,
  Modal,
  statusBadgeVariant,
  useToastStore,
} from '../components/ui';

export const QuotationsPage: React.FC = () => {
  const pushToast = useToastStore((s) => s.push);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [quotes, setQuotes] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);

  const [assignVendorId, setAssignVendorId] = useState('');
  const [vendorQuoteAmount, setVendorQuoteAmount] = useState('');
  const [negNote, setNegNote] = useState('');

  const [newModal, setNewModal] = useState(false);
  const [newForm, setNewForm] = useState({
    customerName: '',
    customerPhone: '+91 ',
    projectName: '',
    siteAddress: '',
    pincode: '560034',
    itemName: 'UltraTech OPC 53 Cement',
    unit: 'Bag',
    quantity: 300,
    targetPrice: 370,
  });

  const loadData = async () => {
    const [qList, vList] = await Promise.all([
      adminApi.getQuotations(statusFilter),
      adminApi.getVendors('APPROVED'),
    ]);
    setQuotes(qList || []);
    setVendors(vList || []);
    if (vList?.[0]?.id && !assignVendorId) setAssignVendorId(vList[0].id);
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const refreshSelected = (updated: any) => {
    setSelectedQuote(updated);
    setQuotes((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
  };

  const handleAssignVendor = async () => {
    if (!selectedQuote || !assignVendorId) return;
    try {
      const updated = await adminApi.assignVendorsToQuote(selectedQuote.id, [assignVendorId]);
      refreshSelected(updated);
      pushToast({ title: 'Vendor Assigned to RFQ' });
    } catch (err: any) {
      pushToast({ title: 'Failed', message: err.message, variant: 'error' });
    }
  };

  const handleRecordVendorQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuote || !assignVendorId || !vendorQuoteAmount) return;
    try {
      const updated = await adminApi.recordVendorQuote(selectedQuote.id, {
        vendorId: assignVendorId,
        totalQuotedAmount: Number(vendorQuoteAmount),
        deliveryDays: 2,
        notes: 'Vendor rate submitted for Company Admin review',
      });
      refreshSelected(updated);
      setVendorQuoteAmount('');
      pushToast({ title: 'Vendor Quote Logged' });
    } catch (err: any) {
      pushToast({ title: 'Failed', message: err.message, variant: 'error' });
    }
  };

  const handleApproveAndConvert = async (quoteId: string, vendorId?: string, amount?: number) => {
    try {
      const approved = await adminApi.approveQuotation(quoteId, vendorId, amount);
      const converted = await adminApi.convertQuotationToOrder(quoteId);
      refreshSelected(converted.quotation || approved);
      pushToast({
        title: 'Converted to Bulk Order',
        message: `Order ${converted.order?.orderNumber} created in Orders module.`,
      });
      loadData();
    } catch (err: any) {
      pushToast({ title: 'Conversion Failed', message: err.message, variant: 'error' });
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Bulk Orders & Quotations (RFQ)"
        description="Assign incoming customer RFQs to verified vendors, compare quotes, negotiate & convert to bulk orders."
        actions={
          <Button size="sm" variant="accent" onClick={() => setNewModal(true)}>
            + Log Customer RFQ
          </Button>
        }
      />

      <div className="flex flex-wrap gap-1.5">
        {[
          { id: 'ALL', label: 'All RFQs' },
          { id: 'INCOMING', label: 'Incoming Requests' },
          { id: 'VENDOR_ASSIGNED', label: 'Vendor Assigned' },
          { id: 'QUOTES_RECEIVED', label: 'Quotes Received' },
          { id: 'UNDER_NEGOTIATION', label: 'Negotiation' },
          { id: 'APPROVED', label: 'Approved' },
          { id: 'CONVERTED_TO_ORDER', label: 'Converted Orders' },
        ].map((t) => (
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

      <Card noPadding>
        <div className="overflow-x-auto rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F0DED0]/75 border-b border-[#E5DCD3] text-[11px] font-semibold text-[#5E5946] uppercase">
                <th className="py-3 px-4">RFQ # & Project</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Materials Summary</th>
                <th className="py-3 px-3">Vendor Quotes</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Workflow</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DCD3] text-xs bg-white">
              {quotes.map((q) => (
                <tr key={q.id} className="hover:bg-[#FAF7F4] transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-semibold text-[#AE887B]">{q.quoteNumber}</p>
                    <p className="text-[#6E6859]">{q.projectName}</p>
                  </td>
                  <td className="py-3 px-3">
                    <p className="font-medium text-[#5E5946]">{q.customerName}</p>
                    <p className="text-[#6E6859]">Pincode: {q.pincode}</p>
                  </td>
                  <td className="py-3 px-3">
                    {q.items?.length || 0} line item(s) —{' '}
                    {q.items?.[0] ? `${q.items[0].name} (${q.items[0].quantity} ${q.items[0].unit})` : ''}
                  </td>
                  <td className="py-3 px-3">
                    {q.vendorQuotes?.length || 0} quote(s)
                  </td>
                  <td className="py-3 px-3">
                    <Badge variant={statusBadgeVariant(q.status)}>{q.status}</Badge>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Button size="sm" variant="outline" onClick={() => setSelectedQuote(q)}>
                      Compare & Manage
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* RFQ Detail Drawer */}
      <Drawer
        open={Boolean(selectedQuote)}
        onClose={() => setSelectedQuote(null)}
        title={selectedQuote?.quoteNumber || 'RFQ Workflow'}
        subtitle={`${selectedQuote?.customerName || ''} — ${selectedQuote?.projectName || ''}`}
      >
        {selectedQuote && (
          <div className="space-y-6 text-xs">
            {/* Material BOQ */}
            <div>
              <h4 className="font-semibold text-sm text-[#5E5946] mb-2">Customer Material Request</h4>
              <div className="border border-[#E5DCD3] rounded-lg divide-y divide-[#E5DCD3] bg-white">
                {(selectedQuote.items || []).map((it: any, i: number) => (
                  <div key={i} className="p-3 flex justify-between">
                    <div>
                      <p className="font-medium text-[#5E5946]">{it.name}</p>
                      <p className="text-[#6E6859]">
                        {it.quantity} {it.unit} • Target {formatINR(it.targetPrice)}/{it.unit}
                      </p>
                    </div>
                    <p className="font-semibold text-[#5E5946]">{formatINR(it.quantity * it.targetPrice)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Assign & Record Vendor Quote */}
            {selectedQuote.status !== 'CONVERTED_TO_ORDER' && (
              <div className="p-4 bg-[#F9F2EC] border border-[#E5DCD3] rounded-xl space-y-3">
                <h4 className="font-semibold text-sm text-[#5E5946]">Assign Vendor & Log Quote</h4>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={assignVendorId}
                    onChange={(e) => setAssignVendorId(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                  >
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.businessName} ({v.city})
                      </option>
                    ))}
                  </select>
                  <Button size="sm" onClick={handleAssignVendor}>
                    <Send className="w-3.5 h-3.5" /> Assign Vendor
                  </Button>
                </div>
                <form onSubmit={handleRecordVendorQuote} className="flex flex-wrap gap-2">
                  <input
                    type="number"
                    required
                    placeholder="Vendor Quote Total (₹)"
                    value={vendorQuoteAmount}
                    onChange={(e) => setVendorQuoteAmount(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                  />
                  <Button size="sm" variant="outline" type="submit">
                    Log Vendor Quote
                  </Button>
                </form>
              </div>
            )}

            {/* Vendor Price Comparison */}
            <div>
              <h4 className="font-semibold text-sm text-[#5E5946] mb-2">Vendor Quote Comparison</h4>
              {(selectedQuote.vendorQuotes || []).length === 0 ? (
                <p className="text-[#6E6859] p-3 border border-[#E5DCD3] rounded-lg bg-[#FAF7F4]">
                  No vendor quotes assigned yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedQuote.vendorQuotes.map((vq: any) => (
                    <div
                      key={vq.vendorId}
                      className="p-3.5 border border-[#E5DCD3] rounded-lg flex flex-wrap items-center justify-between gap-2 bg-white"
                    >
                      <div>
                        <p className="font-semibold text-[#5E5946]">{vq.vendorName}</p>
                        <p className="text-[#6E6859]">
                          Lead time: {vq.deliveryDays}d • {vq.notes}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#AE887B]">
                          {vq.totalQuotedAmount > 0 ? formatINR(vq.totalQuotedAmount) : 'Pending'}
                        </span>
                        <Badge variant={statusBadgeVariant(vq.status)}>{vq.status}</Badge>
                        {selectedQuote.status !== 'CONVERTED_TO_ORDER' && vq.totalQuotedAmount > 0 && (
                          <Button
                            size="sm"
                            variant="dark"
                            onClick={() =>
                              handleApproveAndConvert(
                                selectedQuote.id,
                                vq.vendorId,
                                vq.totalQuotedAmount
                              )
                            }
                          >
                            <ArrowRightCircle className="w-3.5 h-3.5" /> Approve & Convert
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {selectedQuote.convertedOrderId && (
                <div className="mt-3 p-3 rounded-lg bg-[#ECFDF5] border border-[#BCEAD5] text-[#15966B] font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Converted to Order {selectedQuote.convertedOrderId}
                </div>
              )}
            </div>

            {/* Negotiation History */}
            <div>
              <h4 className="font-semibold text-sm text-[#5E5946] mb-2">Negotiation Log</h4>
              <div className="space-y-2 mb-3">
                {(selectedQuote.negotiationHistory || []).map((n: any) => (
                  <div key={n.id} className="p-2.5 bg-[#FAF7F4] rounded-lg border border-[#E5DCD3]">
                    <div className="flex justify-between text-[11px] text-[#6E6859]">
                      <span className="font-semibold text-[#5E5946]">
                        {n.actor} ({n.role})
                      </span>
                      <span>{formatDateTime(n.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-[#3D392C]">{n.message}</p>
                  </div>
                ))}
              </div>
              {selectedQuote.status !== 'CONVERTED_TO_ORDER' && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!negNote.trim()) return;
                    const updated = await adminApi.negotiateQuotation(selectedQuote.id, negNote);
                    refreshSelected(updated);
                    setNegNote('');
                    pushToast({ title: 'Negotiation Note Logged' });
                  }}
                  className="flex gap-2"
                >
                  <input
                    value={negNote}
                    onChange={(e) => setNegNote(e.target.value)}
                    placeholder="Add internal/negotiation remark..."
                    className="flex-1 px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                  />
                  <Button size="sm" type="submit">
                    <MessageSquare className="w-3.5 h-3.5" /> Post
                  </Button>
                </form>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* New RFQ Modal */}
      <Modal open={newModal} onClose={() => setNewModal(false)} title="Create Bulk RFQ">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await adminApi.createQuotation({
              customerName: newForm.customerName,
              customerPhone: newForm.customerPhone,
              projectName: newForm.projectName,
              siteAddress: newForm.siteAddress,
              pincode: newForm.pincode,
              items: [
                {
                  name: newForm.itemName,
                  unit: newForm.unit,
                  quantity: Number(newForm.quantity),
                  targetPrice: Number(newForm.targetPrice),
                },
              ],
            });
            pushToast({ title: 'Bulk RFQ Logged' });
            setNewModal(false);
            loadData();
          }}
          className="space-y-3 text-xs"
        >
          <input
            required
            placeholder="Builder / Contractor Name"
            value={newForm.customerName}
            onChange={(e) => setNewForm({ ...newForm, customerName: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
          />
          <input
            required
            placeholder="Project Name"
            value={newForm.projectName}
            onChange={(e) => setNewForm({ ...newForm, projectName: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              required
              placeholder="Material"
              value={newForm.itemName}
              onChange={(e) => setNewForm({ ...newForm, itemName: e.target.value })}
              className="col-span-2 px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
            />
            <input
              type="number"
              required
              placeholder="Qty"
              value={newForm.quantity}
              onChange={(e) => setNewForm({ ...newForm, quantity: Number(e.target.value) })}
              className="px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setNewModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Save RFQ</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
