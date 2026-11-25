import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IndianRupee,
  ShoppingCart,
  Store,
  Package,
  AlertTriangle,
  Truck,
  FileSpreadsheet,
  Clock,
  CheckCircle2,
  ArrowRight,
  Activity,
  Bell,
  Calendar,
} from 'lucide-react';
import { adminApi, formatINR, formatDateTime } from '../services/adminApi';
import { PageHeader, StatCard, Card, Badge, Button, statusBadgeVariant } from '../components/ui';

const DATE_PRESETS = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: '7d', label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days' },
  { id: 'month', label: 'This Month' },
  { id: 'custom', label: 'Custom Range' },
];

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [viewTab, setViewTab] = useState<'DASHBOARD' | 'BUSINESS_OVERVIEW' | 'ACTIVITY' | 'PENDING'>('DASHBOARD');
  const [period, setPeriod] = useState('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const loadDashboard = async (p = period, f = customFrom, t = customTo) => {
    setLoading(true);
    try {
      const res = await adminApi.getDashboard(p, f || undefined, t || undefined);
      setData(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (period !== 'custom') {
      loadDashboard(period);
    }
  }, [period]);

  const kpis = data?.kpis || {};
  const sections = data?.sections || {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company Overview"
        description={
          data?.tenant
            ? `${data.tenant.name} — Live operations across vendors, catalog, orders & finance`
            : 'Live company operations overview'
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-white border border-[#E5DCD3] rounded-lg p-1 shadow-card">
              {DATE_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    period === p.id
                      ? 'bg-[#AE887B] text-white'
                      : 'text-[#6E6859] hover:text-[#5E5946] hover:bg-[#F0DED0]/40'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        }
      />

      {period === 'custom' && (
        <div className="bg-white border border-[#E5DCD3] rounded-xl p-3 flex flex-wrap items-center gap-3">
          <Calendar className="w-4 h-4 text-[#AE887B]" />
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-white border border-[#E5DCD3] rounded-lg"
          />
          <span className="text-xs text-[#6E6859]">to</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-white border border-[#E5DCD3] rounded-lg"
          />
          <Button size="sm" onClick={() => loadDashboard('custom', customFrom, customTo)}>
            Apply Range
          </Button>
        </div>
      )}

      {/* Overview Sub-Views */}
      <div className="flex flex-wrap gap-2 border-b border-[#E5DCD3] pb-2">
        {[
          { id: 'DASHBOARD', label: 'Dashboard' },
          { id: 'BUSINESS_OVERVIEW', label: 'Business Overview' },
          { id: 'PENDING', label: `Pending Actions (${(kpis.pendingVendorApprovals || 0) + (kpis.pendingProductApprovals || 0) + (kpis.pendingOrders || 0)})` },
          { id: 'ACTIVITY', label: 'Daily Activity' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setViewTab(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewTab === tab.id
                ? 'bg-[#F0DED0] text-[#5E5946] font-semibold border border-[#AE887B]/35'
                : 'text-[#6E6859] hover:bg-white hover:text-[#5E5946]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && !data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white border border-[#E5DCD3] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Primary KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              title={`Total Revenue (${data?.dateRange?.label || 'Period'})`}
              value={formatINR(kpis.totalRevenue)}
              hint={`${kpis.totalOrders || 0} orders in selected period`}
              icon={<IndianRupee className="w-5 h-5" />}
              tone="blue"
              onClick={() => navigate('/finance')}
            />
            <StatCard
              title="Orders Needing Action"
              value={kpis.pendingOrders || 0}
              hint={`${kpis.activeDispatches || 0} active in 60-min dispatch`}
              icon={<ShoppingCart className="w-5 h-5" />}
              tone="orange"
              onClick={() => navigate('/orders')}
            />
            <StatCard
              title="Pending Vendor Approvals"
              value={kpis.pendingVendorApprovals || 0}
              hint={`${kpis.activeVendors || 0} of ${kpis.totalVendors || 0} vendors active`}
              icon={<Store className="w-5 h-5" />}
              tone="amber"
              onClick={() => navigate('/vendors?status=PENDING_VERIFICATION')}
            />
            <StatCard
              title="Pending Product Approvals"
              value={kpis.pendingProductApprovals || 0}
              hint={`${kpis.liveProducts || 0} live SKUs on Customer Web`}
              icon={<Package className="w-5 h-5" />}
              tone="green"
              onClick={() => navigate('/products?status=PENDING_APPROVAL')}
            />
          </div>

          {/* Secondary KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              title="Low / Out of Stock SKUs"
              value={(kpis.lowStockCount || 0) + (kpis.outOfStockCount || 0)}
              hint={`${kpis.outOfStockCount || 0} out of stock`}
              icon={<AlertTriangle className="w-5 h-5" />}
              tone="red"
              onClick={() => navigate('/inventory')}
            />
            <StatCard
              title="Pending Vendor Settlements"
              value={formatINR(kpis.pendingSettlementAmount)}
              hint={`${kpis.pendingSettlementCount || 0} settlement batch(es) pending`}
              icon={<Clock className="w-5 h-5" />}
              tone="amber"
              onClick={() => navigate('/finance')}
            />
            <StatCard
              title="Bulk Quotations (RFQs)"
              value={kpis.pendingQuotations || 0}
              hint="Incoming & under negotiation"
              icon={<FileSpreadsheet className="w-5 h-5" />}
              tone="blue"
              onClick={() => navigate('/quotations')}
            />
            <StatCard
              title="Active Dispatches"
              value={kpis.activeDispatches || 0}
              hint={`${kpis.deliveredOrders || 0} delivered in period`}
              icon={<Truck className="w-5 h-5" />}
              tone="green"
              onClick={() => navigate('/delivery')}
            />
          </div>

          {viewTab === 'BUSINESS_OVERVIEW' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card title="Company Profile">
                <dl className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-[#6E6859]">Legal Name</dt>
                    <dd className="font-medium text-right text-[#5E5946]">{data?.tenant?.legalName}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#6E6859]">GSTIN</dt>
                    <dd className="font-mono font-medium text-[#5E5946]">{data?.tenant?.gstin}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#6E6859]">Region</dt>
                    <dd className="font-medium text-[#5E5946]">
                      {data?.tenant?.city}, {data?.tenant?.state}
                    </dd>
                  </div>
                </dl>
              </Card>
              <Card title="Catalog & Marketplace Health">
                <dl className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-[#6E6859]">Total SKUs</dt>
                    <dd className="font-semibold text-[#5E5946]">{kpis.totalProducts}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#6E6859]">Live Customer Web SKUs</dt>
                    <dd className="font-semibold text-[#15966B]">{kpis.liveProducts}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#6E6859]">Registered B2B Customers</dt>
                    <dd className="font-semibold text-[#5E5946]">{kpis.totalCustomers}</dd>
                  </div>
                </dl>
              </Card>
              <Card title="Service & Returns Health">
                <dl className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-[#6E6859]">Pending Returns</dt>
                    <dd className="font-semibold text-[#C9821E]">{kpis.pendingReturns}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#6E6859]">Open Support Tickets</dt>
                    <dd className="font-semibold text-[#5E5946]">{kpis.openTickets}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#6E6859]">Settlement Cycle</dt>
                    <dd className="font-semibold text-[#5E5946]">
                      Every {data?.tenant?.paymentConfig?.settlementCycleDays || 7} Days
                    </dd>
                  </div>
                </dl>
              </Card>
            </div>
          )}

          {/* 10 Dashboard Sections Grid */}
          {(viewTab === 'DASHBOARD' || viewTab === 'PENDING') && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* 1. Orders Requiring Attention */}
              <Card
                title="1. Orders Requiring Attention"
                subtitle="New, accepted & dispatch-ready orders"
                action={
                  <Button variant="ghost" size="sm" onClick={() => navigate('/orders')}>
                    View All <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                }
              >
                <div className="divide-y divide-[#E5DCD3]">
                  {(sections.ordersRequiringAttention || []).length === 0 ? (
                    <p className="text-xs text-[#6E6859] py-4">No urgent orders pending.</p>
                  ) : (
                    sections.ordersRequiringAttention.map((o: any) => (
                      <div key={o.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                        <div>
                          <p className="font-semibold text-[#5E5946]">{o.orderNumber || o.id}</p>
                          <p className="text-[#6E6859]">{o.customerName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-[#5E5946]">{formatINR(o.totalAmount)}</p>
                          <Badge variant={statusBadgeVariant(o.status)}>{o.status}</Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {/* 2. Pending Vendor Approvals */}
              <Card
                title="2. Pending Vendor Approvals"
                subtitle="Applications waiting KYC & GST verification"
                action={
                  <Button variant="ghost" size="sm" onClick={() => navigate('/vendors')}>
                    Review Queue <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                }
              >
                <div className="divide-y divide-[#E5DCD3]">
                  {(sections.pendingVendorApprovals || []).length === 0 ? (
                    <p className="text-xs text-[#6E6859] py-4 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#15966B]" /> All vendor applications verified.
                    </p>
                  ) : (
                    sections.pendingVendorApprovals.map((v: any) => (
                      <div key={v.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                        <div>
                          <p className="font-semibold text-[#5E5946]">{v.businessName}</p>
                          <p className="text-[#6E6859]">
                            {v.city} • GST: {v.gstin || 'Pending'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={statusBadgeVariant(v.approvalStatus)}>
                            {v.approvalStatus}
                          </Badge>
                          <Button size="sm" onClick={() => navigate('/vendors')}>
                            Review
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {/* 3. Pending Product Approvals */}
              <Card
                title="3. Pending Product Approvals"
                subtitle="Vendor SKUs awaiting Customer Web publishing"
                action={
                  <Button variant="ghost" size="sm" onClick={() => navigate('/products')}>
                    Moderate <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                }
              >
                <div className="divide-y divide-[#E5DCD3]">
                  {(sections.pendingProductApprovals || []).length === 0 ? (
                    <p className="text-xs text-[#6E6859] py-4 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#15966B]" /> No pending product submissions.
                    </p>
                  ) : (
                    sections.pendingProductApprovals.map((p: any) => (
                      <div key={p.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                        <div className="min-w-0">
                          <p className="font-semibold text-[#5E5946] truncate">{p.name}</p>
                          <p className="text-[#6E6859]">
                            {p.vendorName} • SKU: {p.sku}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-semibold text-[#5E5946]">{formatINR(p.sellingPrice)}</span>
                          <Button size="sm" variant="dark" onClick={() => navigate('/products')}>
                            Inspect
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {/* 4. Low Stock Alerts */}
              <Card
                title="4. Low Stock & Out-of-Stock Alerts"
                subtitle="Thresholds requiring immediate replenishment"
                action={
                  <Button variant="ghost" size="sm" onClick={() => navigate('/inventory')}>
                    Manage Stock <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                }
              >
                <div className="divide-y divide-[#E5DCD3]">
                  {(sections.lowStockAlerts || []).length === 0 ? (
                    <p className="text-xs text-[#6E6859] py-4">All SKUs well stocked.</p>
                  ) : (
                    sections.lowStockAlerts.map((p: any) => (
                      <div key={p.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                        <div className="min-w-0">
                          <p className="font-semibold text-[#5E5946] truncate">{p.name}</p>
                          <p className="text-[#6E6859]">{p.sku}</p>
                        </div>
                        <Badge variant={p.stock <= 0 ? 'error' : 'warning'}>
                          {p.stock} left
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          )}

          {viewTab === 'DASHBOARD' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* 5. Recent Orders */}
              <Card
                title="5. Recent Customer Orders"
                action={
                  <Button variant="ghost" size="sm" onClick={() => navigate('/orders')}>
                    All Orders <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                }
              >
                <div className="divide-y divide-[#E5DCD3]">
                  {(sections.recentOrders || []).map((o: any) => (
                    <div key={o.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-[#5E5946]">{o.orderNumber || o.id}</p>
                        <p className="text-[#6E6859]">{formatDateTime(o.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-[#5E5946]">{formatINR(o.totalAmount)}</span>
                        <Badge variant={statusBadgeVariant(o.status)}>{o.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* 6. Recent Bulk Quotations */}
              <Card
                title="6. Bulk Quotations & Negotiations"
                action={
                  <Button variant="ghost" size="sm" onClick={() => navigate('/quotations')}>
                    RFQ Desk <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                }
              >
                <div className="divide-y divide-[#E5DCD3]">
                  {(sections.recentQuotations || []).map((q: any) => (
                    <div key={q.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-[#5E5946]">{q.quoteNumber}</p>
                        <p className="text-[#6E6859]">
                          {q.customerName} — {q.projectName}
                        </p>
                      </div>
                      <Badge variant={statusBadgeVariant(q.status)}>{q.status}</Badge>
                    </div>
                  ))}
                </div>
              </Card>

              {/* 7. Recent Payments & Settlements */}
              <Card
                title="7. Vendor Settlements & Payouts"
                action={
                  <Button variant="ghost" size="sm" onClick={() => navigate('/finance')}>
                    Finance Desk <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                }
              >
                <div className="divide-y divide-[#E5DCD3]">
                  {(sections.recentPayments || []).map((s: any) => (
                    <div key={s.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-[#5E5946]">
                          {s.settlementNumber || s.id}
                        </p>
                        <p className="text-[#6E6859]">{s.vendorName}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-[#5E5946]">{formatINR(s.netAmount)}</span>
                        <Badge variant={statusBadgeVariant(s.status)}>{s.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* 8 & 9 & 10: Customer Feedback + Notifications + Daily Activity */}
              <Card
                title="8–10. Notifications, Feedback & Alerts"
                action={
                  <Button variant="ghost" size="sm" onClick={() => navigate('/support')}>
                    Support Center <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                }
              >
                <div className="space-y-2.5">
                  {(sections.systemNotifications || []).map((n: any) => (
                    <div
                      key={n.id}
                      onClick={() => n.link && navigate(n.link)}
                      className="p-2.5 rounded-lg bg-[#F9F2EC] border border-[#E5DCD3] flex items-start gap-2.5 cursor-pointer hover:border-[#AE887B] transition-colors"
                    >
                      <Bell className="w-4 h-4 text-[#AE887B] mt-0.5 shrink-0" />
                      <div className="text-xs">
                        <p className="font-semibold text-[#5E5946]">{n.title}</p>
                        <p className="text-[#6E6859] mt-0.5">{n.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {(viewTab === 'ACTIVITY' || viewTab === 'DASHBOARD') && (
            <Card
              title="Daily Activity Audit Trail"
              subtitle="Verified actions logged across Company Admin modules"
              action={
                <Button variant="ghost" size="sm" onClick={() => navigate('/team')}>
                  Full Audit Logs <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              }
            >
              <div className="divide-y divide-[#E5DCD3]">
                {(sections.dailyActivitySummary || []).map((log: any) => (
                  <div key={log.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Activity className="w-4 h-4 text-[#AE887B] shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-[#5E5946] truncate">
                          <span className="font-semibold">{log.action}</span> — {log.details}
                        </p>
                        <p className="text-[#6E6859]">
                          {log.actorName} ({log.actorRole}) • {log.module}
                        </p>
                      </div>
                    </div>
                    <span className="text-[#6E6859] shrink-0">{formatDateTime(log.createdAt)}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
