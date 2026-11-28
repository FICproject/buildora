import React, { useEffect, useState } from 'react';
import { Download, Eye, FileText, RefreshCw, ShieldCheck } from 'lucide-react';
import { VendorInvoice } from '@buildora/types';
import { vendorApi } from '../../services/vendorApi';
import { toast } from '../../store/useToastStore';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

export const VendorInvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<VendorInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewInv, setPreviewInv] = useState<VendorInvoice | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const list = await vendorApi.getInvoices();
      setInvoices(Array.isArray(list) ? list : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadInvoices();
  }, []);

  const handleDownloadPdf = async (inv: VendorInvoice) => {
    setDownloadingId(inv.id);
    try {
      await vendorApi.downloadInvoicePdf(inv.id, `${inv.invoiceNumber}.pdf`);
      toast.success(`Downloaded ${inv.invoiceNumber}.pdf`);
    } catch (e: any) {
      toast.error(e?.message || 'Unable to download PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="GST Tax Invoices"
        description="Immutable supplier GST Tax Invoices generated strictly under your registered GSTIN upon dispatch."
        actions={
          <Button variant="outline" size="sm" onClick={loadInvoices} isLoading={loading}>
            <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh Ledger
          </Button>
        }
      />

      <Card>
        {invoices.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#78716C]">
            <FileText className="w-10 h-10 text-[#D6D3D1] mx-auto mb-2" />
            No GST Tax Invoices issued yet. Invoices generate automatically when an order is Dispatched or Delivered.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E7E5E4] text-[#78716C] bg-[#FAF9F7]">
                  <th className="py-3 px-3 font-semibold">Invoice # / FY</th>
                  <th className="py-3 px-3 font-semibold">Order #</th>
                  <th className="py-3 px-3 font-semibold">Recipient / Buyer GSTIN</th>
                  <th className="py-3 px-3 font-semibold">Supply Type</th>
                  <th className="py-3 px-3 font-semibold text-right">Taxable</th>
                  <th className="py-3 px-3 font-semibold text-right">GST</th>
                  <th className="py-3 px-3 font-semibold text-right">Total</th>
                  <th className="py-3 px-3 font-semibold">Status</th>
                  <th className="py-3 px-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F4]">
                {invoices.map((inv) => {
                  const totalTax = Number(inv.cgstAmount || 0) + Number(inv.sgstAmount || 0) + Number(inv.igstAmount || 0);
                  return (
                    <tr key={inv.id} className="hover:bg-[#FAF9F7]/60">
                      <td className="py-3 px-3">
                        <p className="font-bold text-[#292524]">{inv.invoiceNumber}</p>
                        <p className="text-[11px] text-[#78716C]">
                          FY {inv.financialYear || '2627'} • {new Date(inv.invoiceDate || inv.createdAt || '').toLocaleDateString('en-IN')}
                        </p>
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-[#57534E]">{inv.orderNumber}</td>
                      <td className="py-3 px-3">
                        <p className="font-semibold text-[#292524]">{inv.customerName}</p>
                        <p className="text-[11px] font-mono text-[#78716C]">
                          {inv.customerGstin || inv.buyerDetails?.gstin || 'B2C Unregistered'}
                        </p>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[#57534E]">
                          {inv.isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST+SGST)'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">₹{Number(inv.taxableAmount || 0).toFixed(2)}</td>
                      <td className="py-3 px-3 text-right">₹{totalTax.toFixed(2)}</td>
                      <td className="py-3 px-3 text-right font-bold text-[#292524]">
                        ₹{Number(inv.totalAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={
                            inv.status === 'PAID'
                              ? 'success'
                              : inv.status === 'CANCELLED'
                              ? 'danger'
                              : 'info'
                          }
                        >
                          {inv.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button size="sm" variant="outline" onClick={() => setPreviewInv(inv)}>
                            <Eye className="w-3.5 h-3.5 mr-1" /> Preview
                          </Button>
                          <Button
                            size="sm"
                            isLoading={downloadingId === inv.id}
                            onClick={() => handleDownloadPdf(inv)}
                          >
                            <Download className="w-3.5 h-3.5 mr-1" /> A4 PDF
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Legal Invoice Preview Modal (Read-only & Immutable) */}
      <Modal
        isOpen={Boolean(previewInv)}
        onClose={() => setPreviewInv(null)}
        title={previewInv ? `Tax Invoice ${previewInv.invoiceNumber}` : 'Tax Invoice'}
        subtitle="Legal GST Tax Invoice issued under supplying vendor GSTIN (immutable once finalized)."
        maxWidth="2xl"
      >
        {previewInv && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#FAF9F7] border border-[#E7E5E4]">
              <div>
                <p className="text-[10px] font-bold uppercase text-[#78716C]">Supplier (Your Legal Entity)</p>
                <p className="font-bold text-[#292524] mt-0.5">{previewInv.supplierDetails?.legalBusinessName}</p>
                <p className="text-[#57534E]">{previewInv.supplierDetails?.address}</p>
                <p className="font-mono font-bold text-[#943D24] mt-1 break-all">
                  GSTIN: {previewInv.supplierDetails?.gstin} (State Code: {previewInv.supplierDetails?.stateCode})
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase text-[#78716C]">Buyer & Place of Supply</p>
                <p className="font-bold text-[#292524] mt-0.5 break-words">
                  {previewInv.buyerDetails?.businessName || previewInv.buyerDetails?.name || previewInv.customerName}
                </p>
                <p className="text-[#57534E] break-words">{previewInv.buyerDetails?.shippingAddress}</p>
                <p className="text-[#57534E] mt-1">
                  Place of Supply: <strong>{previewInv.buyerDetails?.placeOfSupply}</strong>
                </p>
                {previewInv.buyerDetails?.gstin && (
                  <p className="font-mono font-semibold text-[#292524] break-all">Buyer GSTIN: {previewInv.buyerDetails.gstin}</p>
                )}
              </div>
            </div>

            <div className="border border-[#E7E5E4] rounded-xl overflow-x-auto">
              <table className="w-full min-w-[540px] text-left text-[11px]">
                <thead className="bg-[#FAF9F7] border-b border-[#E7E5E4]">
                  <tr>
                    <th className="py-2 px-2.5">Material</th>
                    <th className="py-2 px-2.5">HSN</th>
                    <th className="py-2 px-2.5 text-right">Qty</th>
                    <th className="py-2 px-2.5 text-right">Taxable</th>
                    <th className="py-2 px-2.5 text-right">Tax</th>
                    <th className="py-2 px-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5F5F4]">
                  {(previewInv.items || []).map((it) => (
                    <tr key={it.sNo}>
                      <td className="py-2 px-2.5">
                        <p className="font-semibold text-[#292524]">{it.description}</p>
                        <p className="text-[10px] text-[#78716C]">SKU: {it.sku}</p>
                      </td>
                      <td className="py-2 px-2.5 font-mono">{it.hsnCode}</td>
                      <td className="py-2 px-2.5 text-right">{it.quantity} {it.unit}</td>
                      <td className="py-2 px-2.5 text-right">₹{it.taxableValue.toFixed(2)}</td>
                      <td className="py-2 px-2.5 text-right">
                        {previewInv.isInterState
                          ? `IGST ${it.igstRate}% (₹${it.igstAmount.toFixed(2)})`
                          : `CGST ${it.cgstRate}%+SGST ${it.sgstRate}% (₹${it.gstAmount.toFixed(2)})`}
                      </td>
                      <td className="py-2 px-2.5 text-right font-bold">₹{it.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-[#FAF9F7] border border-[#E7E5E4]">
              <p className="text-[11px] text-[#57534E]">
                <ShieldCheck className="w-3.5 h-3.5 inline mr-1 text-emerald-600" />
                {previewInv.amountInWords}
              </p>
              <div className="text-right">
                <p className="text-sm font-extrabold text-[#292524]">Grand Total: ₹{previewInv.totalAmount.toLocaleString('en-IN')}</p>
                <p className="text-[10px] text-[#78716C]">
                  CGST: ₹{previewInv.cgstAmount} • SGST: ₹{previewInv.sgstAmount} • IGST: ₹{previewInv.igstAmount}
                </p>
              </div>
            </div>

            {previewInv.creditNotes && previewInv.creditNotes.length > 0 && (
              <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-[11px]">
                Credit Note Issued: <strong>{previewInv.creditNotes[0].creditNoteNumber}</strong> — {previewInv.creditNotes[0].reason}
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={() => setPreviewInv(null)}>Close</Button>
              <Button onClick={() => handleDownloadPdf(previewInv)}>
                <Download className="w-3.5 h-3.5 mr-1.5" /> Download A4 PDF
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
