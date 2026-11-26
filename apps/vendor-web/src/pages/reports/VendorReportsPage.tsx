import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BarChart3, Download, IndianRupee, ShoppingCart, Boxes, Search } from 'lucide-react';
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
  TablePagination,
} from '../../components/common';

type ReportTab = 'SALES' | 'BRANDS' | 'ORDERS' | 'PRODUCTS' | 'INVENTORY' | 'SETTLEMENTS';

export const VendorReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as ReportTab) || 'SALES';
  const initialBrandStatus =
    (searchParams.get('brandStatus') as 'ALL' | 'ACTIVE' | 'INACTIVE') || 'ALL';

  const [activeTab, setActiveTab] = useState<ReportTab>(initialTab);
  const [dateRange, setDateRange] = useState('monthly');
  const [salesReport, setSalesReport] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [brandStatus, setBrandStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>(initialBrandStatus);
  const [brandSearch, setBrandSearch] = useState('');
  const [brandPage, setBrandPage] = useState(1);
  const [brandsData, setBrandsData] = useState<{ total: number; items: any[] }>({
    total: 0,
    items: [],
  });

  const { orders, fetchOrders } = useVendorOrderStore();
  const { inventory, fetchInventory } = useVendorInventoryStore();
  const { settlements, fetchSettlements } = useVendorSettlementStore();

  useEffect(() => {
    const qTab = searchParams.get('tab') as ReportTab | null;
    const qStatus = searchParams.get('brandStatus') as 'ALL' | 'ACTIVE' | 'INACTIVE' | null;
    if (qTab) setActiveTab(qTab);
    if (qStatus) setBrandStatus(qStatus);
  }, [searchParams]);

  useEffect(() => {
    const load = async () => {
      try {
        const [sr, m, br] = await Promise.all([
          vendorApi.getSalesReport(dateRange),
          vendorApi.getDashboardMetrics(dateRange),
          vendorApi.getAnalyticsBrands({
            status: brandStatus,
            period: dateRange,
            search: brandSearch,
            page: brandPage,
            limit: 10,
          }),
        ]);
        setSalesReport(sr);
        setMetrics(m);
        setBrandsData({ total: br?.total || 0, items: br?.items || [] });
      } catch {}
    };
    load();
    fetchOrders();
    fetchInventory();
    fetchSettlements();
  }, [dateRange, brandStatus, brandSearch, brandPage]);

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
          icon={<Boxes className="w-4 h-4 text-[#D99B16]" />}
        />
      </div>

      {/* Report Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E7E5E4] pb-2">
        {[
          { id: 'SALES', label: 'Sales Reports' },
          { id: 'BRANDS', label: 'Brand Sales & Overview' },
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
                ? 'bg-[#943D24] text-white'
                : 'text-[#78716C] hover:text-[#292524] hover:bg-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'BRANDS' && (
        <Card>
          <CardHeader
            title="Brand Sales & Catalog Overview"
            subtitle="Sorted by highest vendor sales with active & inactive filtering"
            action={
              <div className="flex flex-wrap items-center gap-2">
                {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      setBrandStatus(st);
                      setBrandPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border cursor-pointer ${
                      brandStatus === st
                        ? 'bg-[#943D24] text-white border-[#943D24]'
                        : 'bg-white text-[#78716C] border-[#E7E5E4]'
                    }`}
                  >
                    {st}
                  </button>
                ))}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#78716C] absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={brandSearch}
                    onChange={(e) => {
                      setBrandSearch(e.target.value);
                      setBrandPage(1);
                    }}
                    placeholder="Filter brands..."
                    className="pl-7 pr-3 py-1 rounded-lg border border-[#E7E5E4] text-xs"
                  />
                </div>
              </div>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F7F5] text-[#78716C] font-semibold border-b border-[#E7E5E4]">
                <tr>
                  <th className="py-3 px-4">Brand</th>
                  <th className="py-3 px-4 text-center">Products (Active / Total)</th>
                  <th className="py-3 px-4 text-center">Orders / Units</th>
                  <th className="py-3 px-4 text-right">Total Sales</th>
                  <th className="py-3 px-4 w-44">Contribution</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E5E4] bg-white">
                {brandsData.items.map((b) => (
                  <tr
                    key={b.brandName}
                    onClick={() =>
                      navigate(`/products?brand=${encodeURIComponent(b.brandName)}`)
                    }
                    className="hover:bg-[#FAF7F5] cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md border border-[#E7E5E4] bg-[#FAF7F5] overflow-hidden shrink-0 flex items-center justify-center text-[10px] font-bold text-[#943D24]">
                          {b.logo ? (
                            <img src={b.logo} alt={b.brandName} className="w-full h-full object-cover" />
                          ) : (
                            b.brandName.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <span className="font-semibold text-[#292524]">{b.brandName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-[#292524]">
                      {b.activeProducts} / {b.totalProducts}
                    </td>
                    <td className="py-3 px-4 text-center text-[#78716C]">
                      {b.orderCount} orders ({b.unitsSold} units)
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#292524]">
                      ₹{Number(b.totalSales || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-[#F2EDE9] rounded-full overflow-hidden">
                          <div
                            style={{ width: `${Math.min(100, b.contributionPct || 0)}%` }}
                            className="h-full rounded-full bg-[#943D24]"
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-[#78716C] w-10 text-right">
                          {b.contributionPct}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Badge variant={b.isActive ? 'success' : 'warning'} size="sm">
                        {b.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {brandsData.items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#78716C]">
                      No brands match the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <TablePagination
            page={brandPage}
            pageSize={10}
            totalItems={brandsData.total}
            onPageChange={setBrandPage}
          />
        </Card>
      )}

      {activeTab === 'SALES' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader title="Daily Sales Trend" subtitle="Gross revenue by day" />
            <CardContent>
              <div className="h-56 flex items-end gap-4 pt-4 pb-2 border-b border-[#E7E5E4]">
                {dailySummary.map((d, idx) => {
                  const pct = Math.max(12, Math.round((d.sales / maxSales) * 100));
                  return (
                    <div
                      key={d.date}
                      className="flex-1 flex flex-col items-center justify-end gap-1.5 h-full"
                    >
                      <span className="text-[11px] font-medium text-[#78716C]">
                        ₹{Math.round(d.sales / 1000)}k
                      </span>
                      <div
                        style={{ height: `${pct}%` }}
                        className={`w-full max-w-[44px] rounded-t-md ${
                          idx % 2 === 0 ? 'bg-[#943D24]' : 'bg-[#F6C453]'
                        }`}
                      />
                      <span className="text-[11px] text-[#78716C]">{d.date.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Category Breakdown" subtitle="Revenue share by category" />
            <CardContent className="space-y-4">
              {topCategories.map((cat, idx) => (
                <div key={cat.name} className="space-y-1.5 text-xs">
                  <div className="flex justify-between font-medium text-[#292524]">
                    <span>{cat.name}</span>
                    <span>₹{cat.revenue.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="h-2 bg-[#F8F7F5] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${idx % 2 === 0 ? 'bg-[#943D24]' : 'bg-[#F6C453]'}`}
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
              <thead className="bg-[#F8F7F5] text-[#78716C] font-semibold border-b border-[#E7E5E4]">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E5E4]">
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="py-3 px-4 font-mono font-semibold text-[#292524]">
                      {o.orderNumber}
                    </td>
                    <td className="py-3 px-4 text-[#292524]">{o.customerName}</td>
                    <td className="py-3 px-4 text-[#78716C]">
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
              <thead className="bg-[#F8F7F5] text-[#78716C] font-semibold border-b border-[#E7E5E4]">
                <tr>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Revenue</th>
                  <th className="py-3 px-4 text-right">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E5E4]">
                {topCategories.map((c) => (
                  <tr key={c.name}>
                    <td className="py-3 px-4 font-medium text-[#292524]">{c.name}</td>
                    <td className="py-3 px-4 text-right font-semibold text-[#292524]">
                      ₹{c.revenue.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right text-[#78716C]">{c.percentage}%</td>
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
              <thead className="bg-[#F8F7F5] text-[#78716C] font-semibold border-b border-[#E7E5E4]">
                <tr>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4 text-right">Available</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E5E4]">
                {inventory.map((i) => (
                  <tr key={i.id}>
                    <td className="py-3 px-4 font-medium text-[#292524]">{i.name}</td>
                    <td className="py-3 px-4 font-mono text-[#78716C]">{i.sku}</td>
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
              <thead className="bg-[#F8F7F5] text-[#78716C] font-semibold border-b border-[#E7E5E4]">
                <tr>
                  <th className="py-3 px-4">Settlement ID</th>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4 text-right">Net Payable</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E5E4]">
                {settlements.map((s) => (
                  <tr key={s.id}>
                    <td className="py-3 px-4 font-mono font-semibold text-[#292524]">
                      {s.settlementNumber || s.id}
                    </td>
                    <td className="py-3 px-4 text-[#78716C]">{s.period}</td>
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
