import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Eye,
  Search,
  Printer,
  CheckCircle2,
  Calendar,
  Building2,
  IndianRupee,
  ShieldCheck,
  X,
} from 'lucide-react';
import { vendorApi } from '../../services/vendorApi';
import { VendorInvoice } from '@buildora/types';

export const VendorInvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<VendorInvoice[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewingInvoice, setViewingInvoice] = useState<VendorInvoice | null>(null);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const data = await vendorApi.getInvoices();
      setInvoices(data);
    } catch (err) {
      console.error('Failed to load invoices', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const filteredInvoices = invoices.filter((inv) => {
    const q = search.toLowerCase();
    return (
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.orderNumber.toLowerCase().includes(q) ||
      inv.customerName.toLowerCase().includes(q) ||
      (inv.customerGstin && inv.customerGstin.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#203D91]/10 text-[#203D91] border border-[#203D91]/20">
              TAX COMPLIANCE & GST ITC
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Form GSTR-1 Verified
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#17233C] tracking-tight">
            GST Tax Invoices & ITC Documents
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Generate and download B2B tax invoices with CGST, SGST, IGST breakup for full contractor Input Tax Credit.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-600 bg-[#F4F7FC] px-3.5 py-2 rounded-xl border border-[#E2E8F0]">
            Vendor GSTIN: <strong className="text-[#203D91]">29AABCB9876F1Z2</strong>
          </span>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#E2E8F0] shadow-xs">
        <div className="relative min-w-[300px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice #, order #, customer, GSTIN..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-[#E2E8F0] focus:border-[#203D91] outline-hidden"
          />
        </div>

        <span className="text-xs font-semibold text-slate-500">
          Showing <strong>{filteredInvoices.length}</strong> Tax Invoices
        </span>
      </div>

      {/* Invoices Table Card */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F7FC] border-b border-[#E2E8F0] text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Order Ref</th>
                <th className="py-3 px-4">Billed Customer</th>
                <th className="py-3 px-4">Customer GSTIN</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Taxable (₹)</th>
                <th className="py-3 px-4 text-right">CGST + SGST (₹)</th>
                <th className="py-3 px-4 text-right">Total (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-[#F4F7FC]/60 transition-colors">
                  <td className="py-3.5 px-4 font-black text-[#203D91]">
                    {inv.invoiceNumber}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-[#17233C]">
                    #{inv.orderNumber}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-700">
                    {inv.customerName}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                    {inv.customerGstin || 'B2C / Unregistered'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {new Date(inv.invoiceDate).toLocaleDateString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                    ₹{inv.taxableAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                    ₹{(inv.cgstAmount + inv.sgstAmount).toFixed(1)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-[#17233C]">
                    ₹{inv.totalAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-blue-50 text-[#203D91] border-blue-200'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1">
                    <button
                      onClick={() => setViewingInvoice(inv)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-[#203D91] hover:bg-white transition-colors"
                      title="View Tax Invoice"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setViewingInvoice(inv)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-[#FF7417] hover:bg-white transition-colors"
                      title="Print Invoice"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PRINTABLE INVOICE VIEW MODAL */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 border border-[#E2E8F0] shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#203D91]" />
                <h3 className="text-base font-black text-[#17233C]">Tax Invoice Preview — Form GST INV-1</h3>
              </div>
              <button
                onClick={() => setViewingInvoice(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Invoice Printable Sheet */}
            <div className="p-6 rounded-xl border border-slate-300 bg-white space-y-4 text-xs font-sans">
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-lg font-black text-[#203D91]">BUILDORA 60</h2>
                  <p className="text-[11px] font-bold text-slate-700">Supreme Building Materials Pvt Ltd</p>
                  <p className="text-[10px] text-slate-500">Plot 88, Peenya 2nd Stage, Bengaluru, Karnataka 560058</p>
                  <p className="text-[10px] font-semibold text-slate-700 mt-1">GSTIN: 29AABCB9876F1Z2 • PAN: AABCB9876F</p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded bg-slate-100 font-extrabold text-[10px] text-slate-700 uppercase">ORIGINAL FOR RECIPIENT</span>
                  <p className="font-black text-sm text-[#17233C] mt-1">{viewingInvoice.invoiceNumber}</p>
                  <p className="text-[10px] text-slate-500">Date: {new Date(viewingInvoice.invoiceDate).toLocaleDateString('en-IN')}</p>
                  <p className="text-[10px] text-slate-500">Order: #{viewingInvoice.orderNumber}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-3 text-xs">
                <div>
                  <span className="font-bold text-slate-400 text-[10px] block uppercase">Billed To (Customer):</span>
                  <p className="font-black text-[#17233C]">{viewingInvoice.customerName}</p>
                  <p className="text-[11px] text-slate-600 font-mono mt-0.5">GSTIN: {viewingInvoice.customerGstin || 'Not Registered'}</p>
                  <p className="text-[10px] text-slate-500">Place of Supply: Karnataka (Code: 29)</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-400 text-[10px] block uppercase">Dispatch Details:</span>
                  <p className="font-bold text-slate-700">WH-BLR-04 Peenya Central Hub</p>
                  <p className="text-[10px] text-slate-500">Carrier: BUILDORA 60 EV Mini-Truck Fleet</p>
                  <p className="text-[10px] text-emerald-700 font-bold">Reverse Charge (RCM): NO</p>
                </div>
              </div>

              {/* Tax Calculations Breakup */}
              <div className="space-y-1.5 pt-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Taxable Value (Before GST):</span>
                  <span className="font-bold text-slate-800">₹{viewingInvoice.taxableAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Central GST (CGST @ 9%):</span>
                  <span className="font-bold text-slate-800">₹{viewingInvoice.cgstAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>State GST (SGST @ 9%):</span>
                  <span className="font-bold text-slate-800">₹{viewingInvoice.sgstAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-[#17233C] border-t border-slate-300 pt-2">
                  <span>Total Invoice Amount (INR):</span>
                  <span className="text-[#203D91]">₹{viewingInvoice.totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setViewingInvoice(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-[#F4F7FC] rounded-xl"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#203D91] hover:bg-[#17233C] rounded-xl shadow-xs"
              >
                <Printer className="w-3.5 h-3.5 text-[#FF7417]" />
                Print / Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default VendorInvoicesPage;