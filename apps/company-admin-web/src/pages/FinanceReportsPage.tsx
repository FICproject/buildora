import React, { useEffect, useState } from 'react';
import {
  IndianRupee,
  CheckCircle2,
  Receipt,
  Download,
  BarChart3,
  Plus,
} from 'lucide-react';
import { adminApi, formatINR, formatDateTime } from '../services/adminApi';
import { PageHeader, Card, StatCard, Badge, Button, Modal, statusBadgeVariant, useToastStore } from '../components/ui';

export const FinancePage: React.FC = () => {
  const pushToast = useToastStore((s) => s.push);
  const [data, setData] = useState<any>({
    summary: {},
    settlements: [],
    invoices: [],
    transactions: [],
  });
  const [vendors, setVendors] = useState<any[]>([]);
  const [payoutModal, setPayoutModal] = useState<any>(null);
  const [payoutForm, setPayoutForm] = useState({
    paymentReference: '',
    paymentMode: 'NEFT',
    remarks: 'Weekly vendor payout cleared',
  });

  const loadFinance = async () => {
    const [fin, vnds] = await Promise.all([
      adminApi.getFinanceOverview(),
      adminApi.getVendors('APPROVED'),
    ]);
    setData(fin || { summary: {}, settlements: [], invoices: [], transactions: [] });
    setVendors(vnds || []);
  };

  useEffect(() => {
    loadFinance();
  }, []);

  const handleGenerateBatch = async () => {
    const vid = vendors[0]?.id;
    if (!vid) return;
    try {
      const batch = await adminApi.generateSettlement(vid);
      pushToast({
        title: 'Settlement Batch Generated',
        message: `${batch.settlementNumber} created (${formatINR(batch.netAmount)}).`,
      });
      loadFinance();
    } catch (err: any) {
      pushToast({ title: 'Failed', message: err.message, variant: 'error' });
    }
  };

  const submitMarkPaid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutModal) return;
    try {
      await adminApi.markSettlementPaid(payoutModal.id, payoutForm);
      pushToast({
        title: 'Settlement Marked Paid',
        message: `UTR ${payoutForm.paymentReference} verified & vendor notified.`,
      });
      setPayoutModal(null);
      setPayoutForm({ paymentReference: '', paymentMode: 'NEFT', remarks: 'Weekly vendor payout cleared' });
      loadFinance();
    } catch (err: any) {
      pushToast({ title: 'Validation Failed', message: err.message, variant: 'error' });
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Payments, Settlements & GST Finance"
        description="Track company revenue, platform commission, GST output tax & verify vendor bank settlements via UTR."
        actions={
          <Button size="sm" variant="accent" onClick={handleGenerateBatch}>
            <Plus className="w-4 h-4" /> Generate Settlement Batch
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Gross Merchandise Sales"
          value={formatINR(data.summary?.grossSales)}
          icon={<IndianRupee className="w-5 h-5" />}
          tone="blue"
        />
        <StatCard
          title="Company Commission Earned"
          value={formatINR(data.summary?.totalCommission)}
          icon={<CheckCircle2 className="w-5 h-5" />}
          tone="green"
        />
        <StatCard
          title="Pending Vendor Settlements"
          value={formatINR(data.summary?.totalPendingPayout)}
          hint={`${data.summary?.pendingSettlementCount || 0} batch(es) pending`}
          icon={<IndianRupee className="w-5 h-5" />}
          tone="amber"
        />
        <StatCard
          title="Estimated GST Output (18%)"
          value={formatINR(data.summary?.gstCollected)}
          icon={<Receipt className="w-5 h-5" />}
          tone="blue"
        />
      </div>

      {/* Vendor Settlements */}
      <Card
        noPadding
        title="Vendor Settlements Ledger"
        subtitle="UTR/NEFT bank reference is strictly required before completing payouts"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F0DED0]/75 border-b border-[#E5DCD3] text-[11px] font-semibold text-[#5E5946] uppercase">
                <th className="py-3 px-4">Settlement #</th>
                <th className="py-3 px-3">Vendor</th>
                <th className="py-3 px-3">Gross / Commission</th>
                <th className="py-3 px-3">Net Payable</th>
                <th className="py-3 px-3">Status & UTR</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DCD3] text-xs bg-white">
              {(data.settlements || []).map((s: any) => (
                <tr key={s.id} className="hover:bg-[#FAF7F4] transition-colors">
                  <td className="py-3 px-4 font-semibold text-[#AE887B]">
                    {s.settlementNumber || s.id}
                  </td>
                  <td className="py-3 px-3 text-[#5E5946] font-medium">{s.vendorName}</td>
                  <td className="py-3 px-3 text-[#6E6859]">
                    {formatINR(s.grossAmount)} (−{formatINR(s.commissionAmount)})
                  </td>
                  <td className="py-3 px-3 font-bold text-[#5E5946]">{formatINR(s.netAmount)}</td>
                  <td className="py-3 px-3">
                    <Badge variant={statusBadgeVariant(s.status)}>{s.status}</Badge>
                    {s.utrNumber && (
                      <p className="text-[11px] font-mono text-[#6E6859] mt-0.5">
                        UTR: {s.utrNumber}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {s.status !== 'PAID' ? (
                      <Button size="sm" variant="success" onClick={() => setPayoutModal(s)}>
                        Verify & Pay
                      </Button>
                    ) : (
                      <span className="text-[11px] text-[#15966B] font-medium">Completed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Customer Payment Transactions & GST Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card title="Recent Payment Transactions">
          <div className="divide-y divide-[#E5DCD3] text-xs">
            {(data.transactions || []).slice(0, 8).map((t: any) => (
              <div key={t.id} className="py-2.5 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-[#5E5946]">{t.orderNumber}</p>
                  <p className="text-[#6E6859]">
                    {t.customerName} • {t.method}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[#5E5946]">{formatINR(t.amount)}</p>
                  <Badge variant={statusBadgeVariant(t.paymentStatus)}>{t.paymentStatus}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="GST Tax Invoices">
          <div className="divide-y divide-[#E5DCD3] text-xs">
            {(data.invoices || []).slice(0, 8).map((inv: any) => (
              <div key={inv.id} className="py-2.5 flex justify-between items-center">
                <div>
                  <p className="font-mono font-semibold text-[#AE887B]">{inv.invoiceNumber}</p>
                  <p className="text-[#6E6859]">{inv.customerName}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[#5E5946]">{formatINR(inv.totalAmount)}</p>
                  <p className="text-[11px] text-[#6E6859]">
                    GST: {formatINR((inv.cgstAmount || 0) + (inv.sgstAmount || 0) + (inv.igstAmount || 0))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Verified UTR Payout Modal */}
      <Modal
        open={Boolean(payoutModal)}
        onClose={() => setPayoutModal(null)}
        title={`Confirm Bank Settlement — ${payoutModal?.settlementNumber || ''}`}
      >
        <form onSubmit={submitMarkPaid} className="space-y-4 text-xs">
          <div className="p-3 bg-[#F0DED0]/60 rounded-lg border border-[#E5DCD3]">
            <p className="text-[#5E5946] font-semibold">
              Payable Amount: {formatINR(payoutModal?.netAmount)} to {payoutModal?.vendorName}
            </p>
            <p className="text-[#6E6859] mt-0.5">
              Settlements cannot be finalized without a verified bank UTR reference.
            </p>
          </div>
          <div>
            <label className="block font-semibold text-[#5E5946] mb-1">Transfer Mode</label>
            <select
              value={payoutForm.paymentMode}
              onChange={(e) => setPayoutForm({ ...payoutForm, paymentMode: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
            >
              <option value="NEFT">NEFT</option>
              <option value="IMPS">IMPS</option>
              <option value="RTGS">RTGS</option>
              <option value="RAZORPAYX">RazorpayX Payout</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold text-[#5E5946] mb-1">Bank UTR / Payout Reference (min 6 chars)</label>
            <input
              required
              minLength={6}
              placeholder="e.g. HDFC261125998811"
              value={payoutForm.paymentReference}
              onChange={(e) => setPayoutForm({ ...payoutForm, paymentReference: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg font-mono"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setPayoutModal(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="success">
              Confirm & Mark Paid
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const REPORT_TYPES = [
  { id: 'sales', label: 'Sales Reports' },
  { id: 'orders', label: 'Order Reports' },
  { id: 'vendors', label: 'Vendor Performance' },
  { id: 'products', label: 'Product Reports' },
  { id: 'inventory', label: 'Inventory Reports' },
  { id: 'customers', label: 'Customer Reports' },
  { id: 'delivery', label: 'Delivery Reports' },
  { id: 'financial', label: 'Financial Reports' },
];

export const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState('sales');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    adminApi.getReports(reportType).then(setData);
  }, [reportType]);

  const exportCsv = () => {
    if (!data) return;
    const rows = (data.salesSummary?.salesByCategory || []).map(
      (r: any) => `${r.category},${r.skuCount},${r.stockValue}`
    );
    const blob = new Blob([`Category,SKUs,StockValue\n${rows.join('\n')}`], {
      type: 'text/csv',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `buildora-${reportType}-report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports & Business Analytics"
        description="Cross-portal intelligence across sales, vendors, catalog, stock valuation, customers & logistics."
        actions={
          <Button size="sm" variant="outline" onClick={exportCsv}>
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        }
      />

      <div className="flex flex-wrap gap-1.5">
        {REPORT_TYPES.map((r) => (
          <button
            key={r.id}
            onClick={() => setReportType(r.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              reportType === r.id
                ? 'bg-[#AE887B] text-white border-[#AE887B] shadow-sm'
                : 'bg-white text-[#5E5946] border-[#E5DCD3] hover:bg-[#F0DED0]/45'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card title="Category Valuation & Catalog Depth">
            <div className="divide-y divide-[#E5DCD3] text-xs">
              {(data.salesSummary?.salesByCategory || []).map((c: any) => (
                <div key={c.category} className="py-2.5 flex justify-between">
                  <span className="font-medium text-[#5E5946]">
                    {c.category} ({c.skuCount} SKUs)
                  </span>
                  <span className="font-semibold text-[#AE887B]">{formatINR(c.stockValue)}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Vendor SLA & Fulfillment Benchmarks">
            <div className="divide-y divide-[#E5DCD3] text-xs">
              {(data.vendorPerformance || []).map((v: any) => (
                <div key={v.id} className="py-2.5 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-[#5E5946]">{v.businessName}</p>
                    <p className="text-[#6E6859]">{v.skuCount} SKUs listed</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="success">{v.fulfillmentRate}% Fulfillment</Badge>
                    <p className="text-[11px] text-[#6E6859] mt-0.5">{v.onTimeDispatchRate}% On-Time</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Inventory & Financial Snapshot">
            <dl className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <dt className="text-[#6E6859]">Total Inventory Valuation</dt>
                <dd className="font-bold text-[#AE887B]">
                  {formatINR(data.inventorySummary?.totalStockValue)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#6E6859]">Average Order Value</dt>
                <dd className="font-semibold text-[#5E5946]">{formatINR(data.salesSummary?.averageOrderValue)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#6E6859]">Settled Payouts</dt>
                <dd className="font-semibold text-[#15966B]">
                  {formatINR(data.financialSummary?.paidSettlements)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#6E6859]">Pending Payouts</dt>
                <dd className="font-semibold text-[#C9821E]">
                  {formatINR(data.financialSummary?.pendingSettlements)}
                </dd>
              </div>
            </dl>
          </Card>

          <Card title="Fleet & Delivery Summary">
            <div className="divide-y divide-[#E5DCD3] text-xs">
              {(data.deliveryMetrics || []).map((dm: any) => (
                <div key={dm.id} className="py-2.5 flex justify-between">
                  <span className="font-medium text-[#5E5946]">{dm.name}</span>
                  <span className="text-[#15966B] font-semibold">
                    {dm.onTimeRate}% On-Time ({dm.completedDeliveries} trips)
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
