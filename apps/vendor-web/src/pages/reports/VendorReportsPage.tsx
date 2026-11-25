import React, { useState, useEffect } from 'react';
import { BarChart3, Download, IndianRupee, ShoppingCart, Package, Boxes } from 'lucide-react';
import { vendorApi } from '../../services/vendorApi';
import { useVendorOrderStore } from '../../store/useVendorOrderStore';
import { useVendorInventoryStore } from '../../store/useVendorInventoryStore';
import { useVendorSettlementStore } from '../../store/useVendorSettlementStore';
import {
  PageHeader,
  StatCard,
  Card,
  CardHeader,
  CardContent,
  Button,
  Badge,
} from '../../components/common';

type ReportTab = 'SALES' | 'ORDERS' | 'PRODUCTS' | 'INVENTORY' | 'SETTLEMENTS';

export const VendorReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('SALES');
  const [dateRange, setDateRange] = useState('30d');
  const [salesReport, setSalesReport] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);

  const { orders, fetchOrders } = useVendorOrderStore();
  const { inventory, fetchInventory } = useVendorInventoryStore();
  const { settlements, fetchSettlements } = useVendorSettlementStore();

  useEffect(() => {
    const load = async () => {
      try {
        const [sr, m] = await Promise.all([
          vendorApi.getSalesReport(dateRange),
          vendorApi.getDashboardMetrics(dateRange),
        ]);
        setSalesReport(sr);
        setMetrics(m);
      } catch {}
    };
    load();
    fetchOrders();
    fetchInventory();
    fetchSettlements();
  }, [dateRange]);

  const dailySummary: { date: string; sales: number; orders: number }[] =
    salesReport?.dailySummary || [];
  const maxSales = Math.max(1, ...dailySummary.map((d) => d.sales || 0));

  const topCategories: { name: string; revenue: number; percentage: number }[] =
    salesReport?.topCategories || [];

  const exportCsv = () => {
    const rows = [
      'Date,Sales (INR),Orders',
      ...dailySummary.map((d) => `${d.date},${d.sales},${d.orders}`),
    ];
    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + rows.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `buildora_vendor_report_${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Reports & Analytics"
        description="Review sales trends, order fulfillment, product performance, inventory health, and settlement summaries."
        actions={
          <>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="portal-input w-40 py-1.5 text-xs"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
            <Button
              variant="primary"
              size="sm"
              onClick={exportCsv}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export CSV
            </Button>
          </>
        }
      />

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={`₹${(salesReport?.totalRevenue || metrics?.grossRevenue || 0).toLocaleString('en-IN')}`}
          subtitle="Selected period"
          icon={<IndianRupee className="w-4 h-4 text-[#15966B]" />}
        />
        <StatCard
          title="Total Orders"
          value={salesReport?.totalOrders || metrics?.totalOrders || orders.length}
          subtitle="Fulfilled & in progress"
          icon={<ShoppingCart className="w-4 h-4" />}
        />
        <StatCard
          title="Average Order Value"
          value={`₹${(salesReport?.averageOrderValue || 3238).toLocaleString('en-IN')}`}
          subtitle="Per order"
          icon={<BarChart3 className="w-4 h-4" />}
        />
        <StatCard
          title="Low / Out of Stock"
          value={inventory.filter((i) => i.status !== 'IN_STOCK').length}
          subtitle="Items needing attention"
          icon={<Boxes className="w-4 h-4 text-[#E6A23C]" />}
        />
      </div>

      {/* Report Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E5E9F0] pb-2">
        {[
          { id: 'SALES', label: 'Sales Reports' },
          { id: 'ORDERS', label: 'Order Reports' },
          { id: 'PRODUCTS', label: 'Product Performance' },
          { id: 'INVENTORY', label: 'Inventory Reports' },
          { id: 'SETTLEMENTS', label: 'Settlement Reports' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as ReportTab)}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#23438F] text-white'
                : 'text-[#718096] hover:text-[#263247] hover:bg-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'SALES' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader title="Daily Sales Trend" subtitle="Gross revenue by day" />
            <CardContent>
              <div className="h-56 flex items-end gap-4 pt-4 pb-2 border-b border-[#E5E9F0]">
                {dailySummary.map((d) => {
                  const pct = Math.max(12, Math.round((d.sales / maxSales) * 100));
                  return (
                    <div
                      key={d.date}
                      className="flex-1 flex flex-col items-center justify-end gap-1.5 h-full"
                    >
                      <span className="text-[11px] font-medium text-[#718096]">
                        ₹{Math.round(d.sales / 1000)}k
                      </span>
                      <div
                        style={{ height: `${pct}%` }}
                        className="w-full max-w-[44px] bg-[#23438F] rounded-t-md"
                      />
                      <span className="text-[11px] text-[#718096]">{d.date.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Category Breakdown" subtitle="Revenue share by category" />
            <CardContent className="space-y-4">
              {topCategories.map((cat) => (
                <div key={cat.name} className="space-y-1.5 text-xs">
                  <div className="flex justify-between font-medium text-[#263247]">
                    <span>{cat.name}</span>
                    <span>₹{cat.revenue.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="h-2 bg-[#F7F8FA] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#23438F] rounded-full"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'ORDERS' && (
        <Card>
          <CardHeader title="Order Summary" />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F8FA] text-[#718096] font-semibold border-b border-[#E5E9F0]">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E9F0]">
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="py-3 px-4 font-mono font-semibold text-[#263247]">
                      {o.orderNumber}
                    </td>
                    <td className="py-3 px-4 text-[#263247]">{o.customerName}</td>
                    <td className="py-3 px-4 text-[#718096]">
                      {new Date(o.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold">
                      ₹{(o.totalAmount || o.subtotal || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Badge variant="brand" size="sm">
                        {o.status.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'PRODUCTS' && (
        <Card>
          <CardHeader title="Top Performing Categories" />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F8FA] text-[#718096] font-semibold border-b border-[#E5E9F0]">
                <tr>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Revenue</th>
                  <th className="py-3 px-4 text-right">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E9F0]">
                {topCategories.map((c) => (
                  <tr key={c.name}>
                    <td className="py-3 px-4 font-medium text-[#263247]">{c.name}</td>
                    <td className="py-3 px-4 text-right font-semibold text-[#263247]">
                      ₹{c.revenue.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right text-[#718096]">{c.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'INVENTORY' && (
        <Card>
          <CardHeader title="Inventory Health Report" />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F8FA] text-[#718096] font-semibold border-b border-[#E5E9F0]">
                <tr>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4 text-right">Available</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E9F0]">
                {inventory.map((i) => (
                  <tr key={i.id}>
                    <td className="py-3 px-4 font-medium text-[#263247]">{i.name}</td>
                    <td className="py-3 px-4 font-mono text-[#718096]">{i.sku}</td>
                    <td className="py-3 px-4 text-right font-semibold">{i.stock}</td>
                    <td className="py-3 px-4 text-right">
                      <Badge
                        variant={
                          i.status === 'IN_STOCK'
                            ? 'success'
                            : i.status === 'LOW_STOCK'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {i.status.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'SETTLEMENTS' && (
        <Card>
          <CardHeader title="Settlements Summary" />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F8FA] text-[#718096] font-semibold border-b border-[#E5E9F0]">
                <tr>
                  <th className="py-3 px-4">Settlement ID</th>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4 text-right">Net Payable</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E9F0]">
                {settlements.map((s) => (
                  <tr key={s.id}>
                    <td className="py-3 px-4 font-mono font-semibold text-[#263247]">
                      {s.settlementNumber || s.id}
                    </td>
                    <td className="py-3 px-4 text-[#718096]">{s.period}</td>
                    <td className="py-3 px-4 text-right font-semibold">
                      ₹{(s.netPayable || s.netAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Badge variant={s.status === 'PAID' ? 'success' : 'warning'} size="sm">
                        {s.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default VendorReportsPage;
