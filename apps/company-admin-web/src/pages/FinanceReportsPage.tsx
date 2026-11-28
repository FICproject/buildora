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
  const [rzpConfig, setRzpConfig] = useState<any>(null);
  const [showDevGuide, setShowDevGuide] = useState(false);
  const [payoutModal, setPayoutModal] = useState<any>(null);
  const [payoutForm, setPayoutForm] = useState({
    paymentReference: '',
    paymentMode: 'NEFT',
    remarks: 'Weekly vendor payout cleared',
  });

  const loadFinance = async () => {
    const [fin, vnds, rzp] = await Promise.all([
      adminApi.getFinanceOverview(),
      adminApi.getVendors('APPROVED'),
      adminApi.getRazorpayConfig().catch(() => null),
    ]);
    setData(fin || { summary: {}, settlements: [], invoices: [], transactions: [] });
    setVendors(vnds || []);
    setRzpConfig(rzp);
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
          {data.paymentMethodBreakdown && Object.keys(data.paymentMethodBreakdown).length > 0 && (
            <div className="flex flex-wrap gap-1.5 pb-3 mb-2 border-b border-[#E5DCD3] text-[11px]">
              {Object.entries(data.paymentMethodBreakdown).map(([method, info]: [string, any]) => (
                <span
                  key={method}
                  className="px-2 py-0.5 rounded-md bg-[#F9F2EC] border border-[#E5DCD3] text-[#5E5946] font-medium"
                >
                  {method}: {info.count} ({formatINR(info.amount)})
                </span>
              ))}
            </div>
          )}
          <div className="divide-y divide-[#E5DCD3] text-xs">
            {(data.transactions || []).slice(0, 8).map((t: any) => (
              <div key={t.id} className="py-2.5 flex flex-wrap justify-between items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[#5E5946]">{t.orderNumber}</p>
                  <p className="text-[#6E6859] break-words">
                    {t.customerName} • {t.paymentChannelDetails || t.method}
                  </p>
                  {t.razorpayPaymentId && (
                    <p className="text-[10px] font-mono text-[#8A8373] break-all">{t.razorpayPaymentId}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
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
              <div key={inv.id} className="py-2.5 flex flex-wrap justify-between items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-mono font-semibold text-[#AE887B] break-all">{inv.invoiceNumber}</p>
                  <p className="text-[#6E6859] truncate">{inv.customerName}</p>
                </div>
                <div className="text-right shrink-0">
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

      {/* Razorpay Test Mode – Developer Testing Guide (Visible only in Dev or Test Mode for Authorized Admins) */}
      {((import.meta as any).env?.DEV || rzpConfig?.mode === 'TEST') && (
        <Card
          title="Razorpay Test Mode – Developer Testing Guide"
          subtitle="Authorized Dev / Test Mode reference for verifying UPI, Card, Netbanking & webhook flows"
          action={
            <Button size="sm" variant="outline" onClick={() => setShowDevGuide((v) => !v)}>
              {showDevGuide ? 'Hide Guide' : 'Show Testing Details'}
            </Button>
          }
        >
          <div className="text-xs text-[#5E5946] space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={rzpConfig?.mode === 'TEST' ? 'warning' : 'error'}>
                Mode: {rzpConfig?.mode || 'UNKNOWN'}
              </Badge>
              <span className="font-mono bg-[#FAF7F4] border border-[#E5DCD3] px-2 py-0.5 rounded break-all max-w-full">
                Key ID: {rzpConfig?.maskedKeyId || 'Not Configured'}
              </span>
              {rzpConfig?.enabledMethods && (
                <>
                  <Badge variant={rzpConfig.enabledMethods.upi ? 'success' : 'error'}>
                    UPI: {rzpConfig.enabledMethods.upi ? 'Enabled' : 'Disabled on Razorpay Account'}
                  </Badge>
                  <Badge variant={rzpConfig.enabledMethods.card ? 'success' : 'default'}>Cards</Badge>
                  <Badge variant={rzpConfig.enabledMethods.netbanking ? 'success' : 'default'}>Netbanking</Badge>
                  <Badge variant={rzpConfig.enabledMethods.wallet ? 'success' : 'default'}>Wallet</Badge>
                  <Badge variant={rzpConfig.enabledMethods.paylater ? 'success' : 'default'}>Pay Later</Badge>
                </>
              )}
            </div>

            {rzpConfig?.upiUnavailableReason && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
                <strong>Why UPI is hidden in Razorpay Checkout:</strong> {rzpConfig.upiUnavailableReason}
              </div>
            )}

            {showDevGuide && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#E5DCD3]">
                <div className="space-y-1.5">
                  <p className="font-semibold">Official Test Mode Payment Details</p>
                  <ul className="list-disc list-inside space-y-1 text-[#6E6859]">
                    <li>Test UPI ID (Success): <code className="font-mono text-[#5E5946]">success@razorpay</code></li>
                    <li>Test UPI ID (Failure): <code className="font-mono text-[#5E5946]">failure@razorpay</code></li>
                    <li>Test Netbanking / Wallet / Pay Later: Select option inside Razorpay Test modal and choose <strong>Success</strong> or <strong>Failure</strong> on bank simulator.</li>
                  </ul>
                  <p className="pt-1">
                    Official Docs:{' '}
                    <a
                      href="https://razorpay.com/docs/payments/payments/test-card-upi-details/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#AE887B] underline font-semibold"
                    >
                      Razorpay Test Cards &amp; UPI Details
                    </a>
                  </p>
                </div>
                <div className="space-y-1.5">
                  <p className="font-semibold">Failure, Retry &amp; Verification Scenarios</p>
                  <ul className="list-disc list-inside space-y-1 text-[#6E6859]">
                    <li><strong>Success:</strong> Complete payment &rarr; <code>POST /payments/razorpay/verify</code> checks HMAC-SHA256 + Razorpay payment API &rarr; status becomes <code>PAID</code>/<code>SUCCESS</code>.</li>
                    <li><strong>Failed / Cancelled:</strong> Close modal or select bank Failure &rarr; releases reserved stock cleanly; <strong>Retry Payment</strong> reuses the same Order ID.</li>
                    <li><strong>Duplicate / Replay / Bad Signature:</strong> Tampered signature returns <code>400</code>; repeat callbacks and duplicate webhook IDs return idempotently without double stock deduction.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

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
  { id: 'payments', label: 'Payment Reports' },
  { id: 'vendors', label: 'Vendor Performance' },
  { id: 'products', label: 'Product Reports' },
  { id: 'inventory', label: 'Inventory Reports' },
  { id: 'customers', label: 'Customer Reports' },
  { id: 'delivery', label: 'Delivery Reports' },
  { id: 'financial', label: 'Financial Reports' },
];

export const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState('sales');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    adminApi.getReports(reportType, fromDate || undefined, toDate || undefined).then(setData);
  }, [reportType, fromDate, toDate]);

  const exportCsv = () => {
    if (!data) return;
    const rowsData: any[] = data.reportRows || data.salesSummary?.salesByCategory || [];
    if (rowsData.length === 0) return;
    const headers = Object.keys(rowsData[0]);
    const lines = rowsData.map((r) => headers.map((h) => JSON.stringify(r[h] ?? '')).join(','));
    const blob = new Blob([`${headers.join(',')}\n${lines.join('\n')}`], {
      type: 'text/csv',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `buildora-${reportType}-report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeRows: any[] = data?.reportRows || [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports & Business Analytics"
        description="Cross-portal intelligence across sales, vendors, catalog, stock valuation, customers & logistics."
        actions={
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full xs:w-auto px-2.5 py-1.5 text-xs bg-white border border-[#E5DCD3] rounded-lg"
            />
            <span className="text-xs text-[#6E6859]">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full xs:w-auto px-2.5 py-1.5 text-xs bg-white border border-[#E5DCD3] rounded-lg"
            />
            <Button size="sm" variant="outline" onClick={exportCsv}>
              <Download className="w-4 h-4" /> Export CSV
            </Button>
          </div>
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

      {data && activeRows.length > 0 && (
        <Card title={`${REPORT_TYPES.find((r) => r.id === reportType)?.label || reportType} Table`} subtitle={`${activeRows.length} rows matching filters`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E5DCD3] text-[11px] uppercase text-[#5E5946]">
                  {Object.keys(activeRows[0]).map((col) => (
                    <th key={col} className="py-2 px-3">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DCD3]">
                {activeRows.slice(0, 30).map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#FAF7F4]">
                    {Object.keys(activeRows[0]).map((col) => (
                      <td key={col} className="py-2 px-3 text-[#5E5946] whitespace-nowrap">
                        {typeof row[col] === 'number' && /amount|value|revenue|spend|commission/i.test(col)
                          ? formatINR(row[col])
                          : String(row[col] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card title="Category Valuation & Catalog Depth">
            <div className="divide-y divide-[#E5DCD3] text-xs">
              {(data.salesSummary?.salesByCategory || []).map((c: any) => (
                <div key={c.category} className="py-2.5 flex flex-wrap justify-between gap-2">
                  <span className="font-medium text-[#5E5946] min-w-0">
                    {c.category} ({c.skuCount} SKUs)
                  </span>
                  <span className="font-semibold text-[#AE887B] shrink-0">{formatINR(c.stockValue)}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Vendor SLA & Fulfillment Benchmarks">
            <div className="divide-y divide-[#E5DCD3] text-xs">
              {(data.vendorPerformance || []).map((v: any) => (
                <div key={v.id} className="py-2.5 flex flex-wrap justify-between items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#5E5946] break-words">{v.businessName}</p>
                    <p className="text-[#6E6859]">{v.skuCount} SKUs listed</p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant="success">{v.fulfillmentRate}% Fulfillment</Badge>
                    <p className="text-[11px] text-[#6E6859] mt-0.5">{v.onTimeDispatchRate}% On-Time</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Inventory & Financial Snapshot">
            <dl className="space-y-2.5 text-xs">
              <div className="flex flex-wrap justify-between gap-2">
                <dt className="text-[#6E6859]">Total Inventory Valuation</dt>
                <dd className="font-bold text-[#AE887B]">
                  {formatINR(data.inventorySummary?.totalStockValue)}
                </dd>
              </div>
              <div className="flex flex-wrap justify-between gap-2">
                <dt className="text-[#6E6859]">Average Order Value</dt>
                <dd className="font-semibold text-[#5E5946]">{formatINR(data.salesSummary?.averageOrderValue)}</dd>
              </div>
              <div className="flex flex-wrap justify-between gap-2">
                <dt className="text-[#6E6859]">Settled Payouts</dt>
                <dd className="font-semibold text-[#15966B]">
                  {formatINR(data.financialSummary?.paidSettlements)}
                </dd>
              </div>
              <div className="flex flex-wrap justify-between gap-2">
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
                <div key={dm.id} className="py-2.5 flex flex-wrap justify-between gap-2">
                  <span className="font-medium text-[#5E5946] min-w-0">{dm.name}</span>
                  <span className="text-[#15966B] font-semibold shrink-0">
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
