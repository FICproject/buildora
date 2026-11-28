import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Store,
  ShieldCheck,
  Package,
  Users,
  ShoppingCart,
  IndianRupee,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Bell,
  RefreshCw,
} from 'lucide-react';
import { adminApi, formatINR, formatDate, formatDateTime } from '../services/adminApi';
import { PageHeader, Card, Badge, Button, statusBadgeVariant } from '../components/ui';

const DATE_PRESETS = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days' },
  { id: 'month', label: 'This Month' },
];

interface SummaryCardProps {
  title: string;
  primaryValue: string | number;
  metrics: Array<{ label: string; value: string | number; emphasize?: 'warning' | 'danger' | 'success' }>;
  icon: React.ReactNode;
  toneClass: string;
  onClick: () => void;
}

const OverviewSummaryCard: React.FC<SummaryCardProps> = ({
  title,
  primaryValue,
  metrics,
  icon,
  toneClass,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full text-left bg-white border border-[#E5DCD3] rounded-xl p-4 shadow-card hover:border-[#AE887B] hover:shadow-elevated transition-all cursor-pointer flex flex-col justify-between gap-3"
  >
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-medium text-[#6E6859]">{title}</p>
        <p className="text-2xl font-bold text-[#5E5946] mt-1 tracking-tight">{primaryValue}</p>
      </div>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${toneClass}`}>
        {icon}
      </div>
    </div>
    <div className="pt-2.5 border-t border-[#F0EAE2] flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
      {metrics.map((m) => (
        <span key={m.label} className="text-[#6E6859]">
          {m.label}:{' '}
          <span
            className={`font-semibold ${
              m.emphasize === 'danger'
                ? 'text-[#C94444]'
                : m.emphasize === 'warning'
                  ? 'text-[#B45309]'
                  : m.emphasize === 'success'
                    ? 'text-[#15966B]'
                    : 'text-[#5E5946]'
            }`}
          >
            {m.value}
          </span>
        </span>
      ))}
    </div>
  </button>
);

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const loadDashboard = async (selectedPeriod = period) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getDashboard(selectedPeriod);
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Unable to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard(period);
  }, [period]);

  useEffect(() => {
    const onRealtime = () => {
      void loadDashboard(period);
    };
    window.addEventListener('buildora:admin:realtime', onRealtime);
    return () => window.removeEventListener('buildora:admin:realtime', onRealtime);
  }, [period]);

  const kpis = data?.kpis || {};
  const pendingActions: any[] = data?.pendingActions || [];
  const recentOrders: any[] = data?.recentOrders || [];
  const recentVendors: any[] = data?.recentVendors || [];
  const paymentSummary = data?.paymentSummary || {};
  const recentNotifications: any[] = data?.recentNotifications || [];
  const periodLabel = data?.dateRange?.label || 'Selected Period';

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <PageHeader
        title="Company Overview"
        description="Monitor your vendors, approvals, orders and payments in one place."
        actions={
          <div className="flex flex-wrap items-center gap-1 bg-white border border-[#E5DCD3] rounded-lg p-1 shadow-card max-w-full">
            {DATE_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  period === p.id
                    ? 'bg-[#AE887B] text-white'
                    : 'text-[#6E6859] hover:text-[#5E5946] hover:bg-[#F0DED0]/40'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      />

      {error && (
        <div className="bg-white border border-[#C94444]/35 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-[#C94444]">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
          <Button size="sm" variant="outline" onClick={() => loadDashboard(period)}>
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </Button>
        </div>
      )}

      {loading && !data ? (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-32 bg-white border border-[#E5DCD3] rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="h-52 bg-white border border-[#E5DCD3] rounded-xl animate-pulse" />
        </div>
      ) : (
        <>
          {/* Row 1 – Business Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <OverviewSummaryCard
              title="Total Vendors"
              primaryValue={kpis.totalVendors ?? 0}
              metrics={[
                { label: 'Active', value: kpis.activeVendors ?? 0, emphasize: 'success' },
                { label: 'Inactive', value: kpis.inactiveVendors ?? 0 },
              ]}
              icon={<Store className="w-5 h-5" />}
              toneClass="bg-[#F0DED0] text-[#5E5946]"
              onClick={() => navigate('/vendors')}
            />

            <OverviewSummaryCard
              title="Pending KYC"
              primaryValue={kpis.pendingKycCount ?? 0}
              metrics={[
                {
                  label: 'Awaiting KYC',
                  value: kpis.pendingKycCount ?? 0,
                  emphasize: (kpis.pendingKycCount || 0) > 0 ? 'warning' : undefined,
                },
                { label: 'New Applications', value: kpis.newVendorApplications ?? 0 },
              ]}
              icon={<ShieldCheck className="w-5 h-5" />}
              toneClass="bg-[#FFFBEB] text-[#B45309]"
              onClick={() => navigate('/vendors?status=PENDING_VERIFICATION')}
            />

            <OverviewSummaryCard
              title="Product Approvals"
              primaryValue={kpis.pendingProductApprovals ?? 0}
              metrics={[
                { label: 'Approved', value: kpis.approvedProducts ?? 0, emphasize: 'success' },
                {
                  label: 'Rejected',
                  value: kpis.rejectedProducts ?? 0,
                  emphasize: (kpis.rejectedProducts || 0) > 0 ? 'danger' : undefined,
                },
              ]}
              icon={<Package className="w-5 h-5" />}
              toneClass="bg-[#ECFDF5] text-[#15966B]"
              onClick={() => navigate('/products/pending')}
            />

            <OverviewSummaryCard
              title="Total Customers"
              primaryValue={kpis.totalCustomers ?? 0}
              metrics={[
                { label: 'Active Customers', value: kpis.activeCustomers ?? 0, emphasize: 'success' },
              ]}
              icon={<Users className="w-5 h-5" />}
              toneClass="bg-[#AE887B]/15 text-[#AE887B]"
              onClick={() => navigate('/customers')}
            />
          </div>

          {/* Row 2 – Operations & Finance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <OverviewSummaryCard
              title={`Total Orders (${periodLabel})`}
              primaryValue={kpis.totalOrders ?? 0}
              metrics={[
                {
                  label: 'Pending Orders',
                  value: kpis.pendingOrders ?? 0,
                  emphasize: (kpis.pendingOrders || 0) > 0 ? 'warning' : undefined,
                },
              ]}
              icon={<ShoppingCart className="w-5 h-5" />}
              toneClass="bg-[#AE887B]/15 text-[#AE887B]"
              onClick={() => navigate('/orders')}
            />

            <OverviewSummaryCard
              title={`Revenue (${periodLabel})`}
              primaryValue={formatINR(kpis.totalRevenue)}
              metrics={[
                { label: 'Successful Orders', value: kpis.revenueOrderCount ?? 0, emphasize: 'success' },
              ]}
              icon={<IndianRupee className="w-5 h-5" />}
              toneClass="bg-[#ECFDF5] text-[#15966B]"
              onClick={() => navigate('/finance')}
            />

            <OverviewSummaryCard
              title="Pending Payments & Settlements"
              primaryValue={formatINR(kpis.pendingSettlementAmount)}
              metrics={[
                { label: 'Pending Batches', value: kpis.pendingSettlementCount ?? 0, emphasize: 'warning' },
                ...(Number(kpis.failedPaymentsCount || 0) > 0
                  ? [{ label: 'Failed', value: kpis.failedPaymentsCount, emphasize: 'danger' as const }]
                  : []),
              ]}
              icon={<Wallet className="w-5 h-5" />}
              toneClass="bg-[#FFFBEB] text-[#B45309]"
              onClick={() => navigate('/finance')}
            />

            <OverviewSummaryCard
              title="Inventory Alerts"
              primaryValue={(kpis.lowStockCount || 0) + (kpis.outOfStockCount || 0)}
              metrics={[
                {
                  label: 'Low Stock',
                  value: kpis.lowStockCount ?? 0,
                  emphasize: (kpis.lowStockCount || 0) > 0 ? 'warning' : undefined,
                },
                {
                  label: 'Out of Stock',
                  value: kpis.outOfStockCount ?? 0,
                  emphasize: (kpis.outOfStockCount || 0) > 0 ? 'danger' : undefined,
                },
              ]}
              icon={<AlertTriangle className="w-5 h-5" />}
              toneClass="bg-[#FEF2F2] text-[#C94444]"
              onClick={() => navigate('/inventory')}
            />
          </div>

          {/* Row 3 – Pending Actions – Requires Your Attention */}
          <Card
            title="Pending Actions – Requires Your Attention"
            subtitle="Consolidated operational queue across vendors, catalog, orders, payments and support"
            noPadding
          >
            {pendingActions.length === 0 ? (
              <div className="p-6 flex items-center gap-2.5 text-sm text-[#15966B] font-medium">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>You're all caught up. No pending actions.</span>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-b-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#FAF7F4] border-b border-[#E5DCD3] text-[11px] font-semibold text-[#5E5946] uppercase">
                      <th className="py-3 px-5">Pending Action</th>
                      <th className="py-3 px-4">Item / Reference</th>
                      <th className="py-3 px-4">Pending Since</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Count</th>
                      <th className="py-3 px-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5DCD3] bg-white">
                    {pendingActions.map((item: any) => (
                      <tr key={item.id} className="hover:bg-[#FAF7F4] transition-colors">
                        <td className="py-3 px-5 font-semibold text-[#5E5946]">{item.actionType}</td>
                        <td className="py-3 px-4 text-[#6E6859]">{item.reference || '—'}</td>
                        <td className="py-3 px-4 text-[#6E6859]">
                          {item.pendingSince ? formatDate(item.pendingSince) : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={statusBadgeVariant(item.status)}>
                            {String(item.status || '').replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-[#5E5946]">{item.count}</td>
                        <td className="py-3 px-5 text-right">
                          <Button size="sm" variant="outline" onClick={() => navigate(item.route)}>
                            {item.actionLabel || 'Review'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Row 4 – Recent Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Left: Recent Orders */}
            <Card
              title="Recent Orders"
              subtitle="Latest 5 customer orders"
              action={
                <Button variant="ghost" size="sm" onClick={() => navigate('/orders')}>
                  View All Orders <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              }
              noPadding
            >
              {recentOrders.length === 0 ? (
                <p className="p-5 text-xs text-[#6E6859]">No orders placed yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#FAF7F4] border-b border-[#E5DCD3] text-[11px] font-semibold text-[#6E6859] uppercase">
                        <th className="py-2.5 px-4">Order ID</th>
                        <th className="py-2.5 px-3">Customer</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                        <th className="py-2.5 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5DCD3]">
                      {recentOrders.map((o: any) => (
                        <tr
                          key={o.id}
                          onClick={() =>
                            navigate(
                              `/orders?orderId=${encodeURIComponent(o.id)}&q=${encodeURIComponent(
                                o.orderNumber || o.id
                              )}`
                            )
                          }
                          className="hover:bg-[#FAF7F4] cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-4 font-semibold text-[#AE887B]">
                            {o.orderNumber || o.id}
                          </td>
                          <td className="py-3 px-3 text-[#5E5946] font-medium">{o.customerName}</td>
                          <td className="py-3 px-3 text-[#6E6859] whitespace-nowrap">
                            {formatDate(o.createdAt)}
                          </td>
                          <td className="py-3 px-3 text-right font-semibold text-[#5E5946]">
                            {formatINR(o.totalAmount)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Badge variant={statusBadgeVariant(o.status)}>{o.status}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Right: Recently Registered Vendors */}
            <Card
              title="Recently Registered Vendors"
              subtitle="Latest 5 vendor registrations"
              action={
                <Button variant="ghost" size="sm" onClick={() => navigate('/vendors')}>
                  View All Vendors <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              }
              noPadding
            >
              {recentVendors.length === 0 ? (
                <p className="p-5 text-xs text-[#6E6859]">No vendor registrations found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#FAF7F4] border-b border-[#E5DCD3] text-[11px] font-semibold text-[#6E6859] uppercase">
                        <th className="py-2.5 px-4">Business Name</th>
                        <th className="py-2.5 px-3">Registered</th>
                        <th className="py-2.5 px-3">KYC / Status</th>
                        <th className="py-2.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5DCD3]">
                      {recentVendors.map((v: any) => (
                        <tr key={v.id} className="hover:bg-[#FAF7F4] transition-colors">
                          <td className="py-3 px-4">
                            <p className="font-semibold text-[#5E5946]">{v.businessName}</p>
                            {v.contactPerson && (
                              <p className="text-[11px] text-[#6E6859]">{v.contactPerson}</p>
                            )}
                          </td>
                          <td className="py-3 px-3 text-[#6E6859] whitespace-nowrap">
                            {formatDate(v.createdAt)}
                          </td>
                          <td className="py-3 px-3 space-y-1">
                            <div>
                              <Badge variant={statusBadgeVariant(v.kycStatus)}>
                                KYC: {String(v.kycStatus || '').replace(/_/g, ' ')}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-[#6E6859]">
                              Account: {String(v.accountStatus || '').replace(/_/g, ' ')}
                            </p>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {v.needsVerification ? (
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() =>
                                  navigate(
                                    `/vendors?status=PENDING_VERIFICATION&vendorId=${encodeURIComponent(v.id)}`
                                  )
                                }
                              >
                                Review
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/vendors?vendorId=${encodeURIComponent(v.id)}`)}
                              >
                                View
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
          </div>

          {/* Row 5 – Financial & Important Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Compact Payment & Settlement Summary */}
            <Card
              title="Payments & Settlements"
              subtitle={`Customer collections, refunds (${periodLabel}) & current vendor payouts`}
              action={
                <Button variant="ghost" size="sm" onClick={() => navigate('/finance')}>
                  Payments & Finance <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              }
            >
              <div className="divide-y divide-[#E5DCD3] text-xs">
                <div className="py-2.5 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[#5E5946]">Total Successful Payments</p>
                    <p className="text-[11px] text-[#6E6859]">
                      {paymentSummary.successfulPaymentsCount ?? 0} captured customer payment(s) in {periodLabel}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-[#15966B] shrink-0">
                    {formatINR(paymentSummary.successfulPaymentsAmount)}
                  </span>
                </div>

                <div className="py-2.5 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[#5E5946]">Total Refunded Amount</p>
                    <p className="text-[11px] text-[#6E6859]">
                      {paymentSummary.refundedCount ?? 0} processed customer refund(s) in {periodLabel}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-[#5E5946] shrink-0">
                    {formatINR(paymentSummary.totalRefundedAmount)}
                  </span>
                </div>

                <div className="py-2.5 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[#5E5946]">Pending Vendor Settlements</p>
                    <p className="text-[11px] text-[#6E6859]">
                      {paymentSummary.pendingSettlementCount ?? 0} payout batch(es) awaiting transfer
                    </p>
                  </div>
                  <span className="text-sm font-bold text-[#B45309] shrink-0">
                    {formatINR(paymentSummary.pendingSettlementAmount)}
                  </span>
                </div>

                <div className="py-2.5 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[#5E5946]">Completed Settlements</p>
                    <p className="text-[11px] text-[#6E6859]">
                      {paymentSummary.completedSettlementCount ?? 0} settled vendor payout batch(es)
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-[#5E5946] shrink-0">
                    {formatINR(paymentSummary.completedSettlementAmount)}
                  </span>
                </div>

                {(paymentSummary.failedTransactionsCount ?? 0) > 0 && (
                  <div className="py-2.5 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[#C94444]">Failed Transactions</p>
                      <p className="text-[11px] text-[#6E6859]">Requires investigation in Payments & Finance</p>
                    </div>
                    <Badge variant="error">{paymentSummary.failedTransactionsCount} failed</Badge>
                  </div>
                )}
              </div>
            </Card>

            {/* Recent Alerts & Notifications */}
            <Card
              title="Recent Alerts & Notifications"
              subtitle="Important operational & escalation alerts"
              action={
                <Button variant="ghost" size="sm" onClick={() => navigate('/support')}>
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              }
            >
              {recentNotifications.length === 0 ? (
                <p className="py-6 text-xs text-[#6E6859]">No recent important alerts.</p>
              ) : (
                <div className="space-y-2.5">
                  {recentNotifications.map((n: any) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => navigate(n.link || '/support')}
                      className="w-full text-left p-3 rounded-lg bg-[#FAF7F4] border border-[#E5DCD3] hover:border-[#AE887B] flex items-start gap-2.5 text-xs transition-colors cursor-pointer"
                    >
                      <Bell className="w-4 h-4 text-[#AE887B] mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-[#5E5946] truncate">{n.title}</p>
                          <span className="text-[11px] text-[#6E6859] shrink-0">
                            {formatDateTime(n.createdAt)}
                          </span>
                        </div>
                        <p className="text-[#6E6859] mt-0.5 line-clamp-2">{n.message}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
