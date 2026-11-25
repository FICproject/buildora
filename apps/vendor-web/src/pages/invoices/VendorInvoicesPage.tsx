import React, { useState, useEffect } from 'react';
import { FileText, Eye, Search, Printer } from 'lucide-react';
import { vendorApi } from '../../services/vendorApi';
import { VendorInvoice } from '@buildora/types';
import {
  PageHeader,
  Card,
  CardContent,
  Button,
  Badge,
  Modal,
  EmptyState,
} from '../../components/common';

export const VendorInvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<VendorInvoice[]>([]);
  const [search, setSearch] = useState('');
  const [viewingInvoice, setViewingInvoice] = useState<VendorInvoice | null>(null);

  useEffect(() => {
    const loadInvoices = async () => {
      try {
        const data = await vendorApi.getInvoices();
        setInvoices(data || []);
      } catch {}
    };
    loadInvoices();
  }, []);

  const filteredInvoices = invoices.filter((inv) => {
    const q = search.toLowerCase();
    return (
      !q ||
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.orderNumber.toLowerCase().includes(q) ||
      inv.customerName.toLowerCase().includes(q) ||
      (inv.customerGstin && inv.customerGstin.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="GST Tax Invoices"
        description="View, download, and print B2B GST tax invoices for customer orders."
      />

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="w-4 h-4 text-[#718096] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by invoice #, order #, customer, or GSTIN..."
              className="portal-input pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F8FA] text-[#718096] font-semibold border-b border-[#E5E9F0]">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Order Ref</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">GSTIN</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Total (₹)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E9F0]">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      icon={<FileText className="w-5 h-5" />}
                      title="No invoices found"
                      description="Generated tax invoices will appear here."
                    />
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#F7F8FA]">
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#23438F]">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#263247]">#{inv.orderNumber}</td>
                    <td className="py-3.5 px-4 text-[#263247]">{inv.customerName}</td>
                    <td className="py-3.5 px-4 font-mono text-[#718096]">
                      {inv.customerGstin || 'Unregistered'}
                    </td>
                    <td className="py-3.5 px-4 text-[#718096]">
                      {new Date(inv.invoiceDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-[#263247]">
                      ₹{inv.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={inv.status === 'PAID' ? 'success' : 'brand'} size="sm">
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setViewingInvoice(inv)}
                          className="p-1.5 rounded-lg text-[#718096] hover:text-[#23438F] hover:bg-[#EEF3FA] cursor-pointer"
                          title="View Invoice"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewingInvoice(inv)}
                          className="p-1.5 rounded-lg text-[#718096] hover:text-[#23438F] hover:bg-[#EEF3FA] cursor-pointer"
                          title="Print Invoice"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={Boolean(viewingInvoice)}
        onClose={() => setViewingInvoice(null)}
        title={`Tax Invoice — ${viewingInvoice?.invoiceNumber || ''}`}
        subtitle={viewingInvoice ? `Order #${viewingInvoice.orderNumber}` : ''}
        maxWidth="2xl"
      >
        {viewingInvoice && (
          <div className="space-y-5 text-xs">
            <div className="p-5 rounded-xl border border-[#E5E9F0] bg-white space-y-4">
              <div className="flex justify-between items-start border-b border-[#E5E9F0] pb-4">
                <div>
                  <h3 className="text-base font-bold text-[#23438F]">BUILDORA 60</h3>
                  <p className="font-medium text-[#263247]">Supreme Building Materials Pvt Ltd</p>
                  <p className="text-[#718096]">GSTIN: 29AABCB9876F1Z2</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[#263247]">{viewingInvoice.invoiceNumber}</p>
                  <p className="text-[#718096]">
                    Date: {new Date(viewingInvoice.invoiceDate).toLocaleDateString('en-IN')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-[#E5E9F0] pb-3">
                <div>
                  <span className="text-[#718096] block">Billed To</span>
                  <p className="font-semibold text-[#263247]">{viewingInvoice.customerName}</p>
                  <p className="font-mono text-[#718096]">
                    {viewingInvoice.customerGstin || 'Unregistered'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[#718096] block">Order Reference</span>
                  <p className="font-semibold text-[#263247]">#{viewingInvoice.orderNumber}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[#718096]">
                  <span>Taxable Value:</span>
                  <span className="font-medium text-[#263247]">
                    ₹{viewingInvoice.taxableAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-[#718096]">
                  <span>CGST:</span>
                  <span className="font-medium text-[#263247]">
                    ₹{viewingInvoice.cgstAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-[#718096]">
                  <span>SGST:</span>
                  <span className="font-medium text-[#263247]">
                    ₹{viewingInvoice.sgstAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#263247] border-t border-[#E5E9F0] pt-2">
                  <span>Total Invoice Amount:</span>
                  <span className="text-[#23438F]">
                    ₹{viewingInvoice.totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5">
              <Button variant="secondary" size="sm" onClick={() => setViewingInvoice(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => window.print()}
                leftIcon={<Printer className="w-3.5 h-3.5" />}
              >
                Print / Download PDF
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default VendorInvoicesPage;
