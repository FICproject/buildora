import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShoppingCart,
  Package,
  AlertTriangle,
  IndianRupee,
  RefreshCw,
  ArrowRight,
  Bell,
  Layers,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { vendorApi } from '../../services/vendorApi';
import { useVendorOrderStore } from '../../store/useVendorOrderStore';
import { useVendorInventoryStore } from '../../store/useVendorInventoryStore';
import { useVendorNotificationStore } from '../../store/useVendorNotificationStore';
import { useVendorSettlementStore } from '../../store/useVendorSettlementStore';
import {
  PageHeader,
  Card,
  CardHeader,
  CardContent,
  Badge,
  Button,
  EmptyState,
} from '../../components/common';
import { OrdersOverviewCard, Granularity } from '../../components/analytics/OrdersOverviewCard';
import { SalesOverviewCard } from '../../components/analytics/SalesOverviewCard';
import { ProductBrandOverviewCard } from '../../components/analytics/ProductBrandOverviewCard';
import { TopBrandsCard } from '../../components/analytics/TopBrandsCard';
import {
  AnalyticsDrilldownDrawer,
  BucketTarget,
} from '../../components/analytics/AnalyticsDrilldownDrawer';
import { toast } from '../../store/useToastStore';

export const VendorDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const [ordersGranularity, setOrdersGranularity] = useState<Granularity>('daily');
  const [salesGranularity, setSalesGranularity] = useState<Granularity>('daily');
  const [ordersDateRange, setOrdersDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });
  const [salesDateRange, setSalesDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });

  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [drilldown, setDrilldown] = useState<BucketTarget | null>(null);

  const { orders, fetchOrders, updateOrderStatus } = useVendorOrderStore();
  const { inventory, fetchInventory } = useVendorInventoryStore();
  const { notifications, fetchNotifications, markAsRead } = useVendorNotificationStore();
  const { settlements, fetchSettlements } = useVendorSettlementStore();

  const loadAnalytics = useCallback(async () => {
    try {
      setRefreshing(true);
      setAnalyticsError(null);
      const data = await vendorApi.getAnalyticsOverview({
        ordersFilter: ordersGranularity,
        salesFilter: salesGranularity,
        ordersStartDate: ordersDateRange.start || undefined,
        ordersEndDate: ordersDateRange.end || undefined,
        salesStartDate: salesDateRange.start || undefined,
        salesEndDate: salesDateRange.end || undefined,
      });
      setAnalytics(data);
    } catch (err: any) {
      setAnalyticsError(err?.message || 'Unable to load dashboard analytics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [
    ordersGranularity,
    salesGranularity,
    ordersDateRange.start,
    ordersDateRange.end,
    salesDateRange.start,
    salesDateRange.end,
  ]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  useEffect(() => {
    fetchOrders();
    fetchInventory();
    fetchSettlements();
    fetchNotifications();

    const onRealtime = () => loadAnalytics();
    window.addEventListener('buildora:vendor:realtime', onRealtime);
    return () => window.removeEventListener('buildora:vendor:realtime', onRealtime);
  }, [loadAnalytics]);

  const kpis = analytics?.kpis || {
    totalOrders: orders.length,
    ordersGrowthPct: 0,
    totalSales: 0,
    salesGrowthPct: 0,
    totalProducts: inventory.length,
    productsGrowthPct: 0,
    totalBrands: 0,
    activeProducts: 0,
    lowStockCount: 0,
  };

  const ordersOv = analytics?.ordersOverview || {
    totalOrders: 0,
    previousPeriodOrders: 0,
    growthPct: 0,
    series: [],
  };

  const salesOv = analytics?.salesOverview || {
    totalRevenue: 0,
    previousPeriodRevenue: 0,
    growthPct: 0,
    series: [],
  };

  const pbOv = analytics?.productBrandOverview || {
    products: { total: 0, active: 0, inactive: 0, activePct: 0, inactivePct: 0 },
    brands: { total: 0, active: 0, inactive: 0, activePct: 0, inactivePct: 0 },
  };

  const topBrands = analytics?.topBrandsBySales || [];

  const actionOrders = orders.filter(
    (o) => o.status === 'NEW' || o.status === 'ACCEPTED' || o.status === 'READY_FOR_DISPATCH'
  );
  const lowStockItems = inventory.filter(
    (i) => i.status === 'LOW_STOCK' || i.status === 'OUT_OF_STOCK'
  );

  const getOrderBadgeVariant = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'success';
      case 'NEW':
        return 'accent';
      case 'CANCELLED':
      case 'RETURNED':
      case 'REJECTED':
        return 'danger';
      case 'ACCEPTED':
      case 'PROCESSING':
      case 'READY_FOR_DISPATCH':
        return 'warning';
      default:
        return 'brand';
    }
  };

  const handleQuickOrderAction = async (orderId: string, nextStatus: any, label: string) => {
    const ok = await updateOrderStatus(orderId, nextStatus);
    if (ok) {
      toast.success(`Order ${label.toLowerCase()} successfully.`);
      loadAnalytics();
    }
  };

  const renderGrowth = (pct?: number | null) => {
    if (pct === undefined || pct === null) return null;
    const pos = pct >= 0;
    return (
      <span
        className={`mt-1.5 inline-flex items-center gap-1 text-xs font-semibold ${
          pos ? 'text-emerald-600' : 'text-red-600'
        }`}
      >
        {pos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {pos ? '+' : ''}
        {pct}%
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Overview"
        description="Real-time vendor analytics for orders, sales revenue, catalog brands, and inventory alerts."
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={loadAnalytics}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        }
      />

      {analyticsError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between gap-3 text-xs text-red-800">
          <span>{analyticsError}</span>
          <Button size="sm" variant="secondary" onClick={loadAnalytics}>
            Retry
          </Button>
        </div>
      )}

      {/* Row 1: 6 KPI Cards matching screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div
          onClick={() => navigate('/orders')}
          className="bg-white rounded-xl border border-[#E7E5E4] p-4 shadow-card hover:border-[#943D24]/60 cursor-pointer transition-colors"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-[#FBF3F0] flex items-center justify-center text-[#943D24] shrink-0">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#78716C]">Total Orders</p>
              <p className="text-xl font-bold text-[#292524] mt-0.5">
                {loading ? '—' : kpis.totalOrders.toLocaleString('en-IN')}
              </p>
              {!loading && renderGrowth(kpis.ordersGrowthPct)}
            </div>
          </div>
        </div>

        <div
          onClick={() => navigate('/reports')}
          className="bg-white rounded-xl border border-[#E7E5E4] p-4 shadow-card hover:border-[#943D24]/60 cursor-pointer transition-colors"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-[#FBF3F0] flex items-center justify-center text-[#943D24] shrink-0">
              <IndianRupee className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#78716C]">Total Sales</p>
              <p className="text-xl font-bold text-[#292524] mt-0.5 truncate">
                {loading ? '—' : `₹${Number(kpis.totalSales || 0).toLocaleString('en-IN')}`}
              </p>
              {!loading && renderGrowth(kpis.salesGrowthPct)}
            </div>
          </div>
        </div>

        <div
          onClick={() => navigate('/products')}
          className="bg-white rounded-xl border border-[#E7E5E4] p-4 shadow-card hover:border-[#943D24]/60 cursor-pointer transition-colors"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-[#FBF3F0] flex items-center justify-center text-[#943D24] shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#78716C]">Total Products</p>
              <p className="text-xl font-bold text-[#292524] mt-0.5">
                {loading ? '—' : kpis.totalProducts.toLocaleString('en-IN')}
              </p>
              {!loading && renderGrowth(kpis.productsGrowthPct)}
            </div>
          </div>
        </div>

        <div
          onClick={() => navigate('/reports?tab=BRANDS')}
          className="bg-white rounded-xl border-2 border-[#F6C453] p-4 shadow-card hover:border-[#943D24] cursor-pointer transition-colors"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-[#FFF7E0] flex items-center justify-center text-[#B45309] shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#78716C]">Total Brands</p>
              <p className="text-xl font-bold text-[#292524] mt-0.5">
                {loading ? '—' : kpis.totalBrands.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        <div
          onClick={() => navigate('/products?status=ACTIVE')}
          className="bg-white rounded-xl border border-[#E7E5E4] p-4 shadow-card hover:border-[#943D24]/60 cursor-pointer transition-colors"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#78716C]">Active Products</p>
              <p className="text-xl font-bold text-[#292524] mt-0.5">
                {loading ? '—' : kpis.activeProducts.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        <div
          onClick={() => navigate('/inventory?status=LOW_STOCK')}
          className="bg-white rounded-xl border border-[#E7E5E4] p-4 shadow-card hover:border-[#943D24]/60 cursor-pointer transition-colors"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center text-red-600 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#78716C]">Low Stock</p>
              <p className="text-xl font-bold text-[#292524] mt-0.5">
                {loading ? '—' : kpis.lowStockCount.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Section 1 (Orders Overview) & Section 2 (Sales Overview) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OrdersOverviewCard
          loading={loading}
          totalOrders={ordersOv.totalOrders}
          previousPeriodOrders={ordersOv.previousPeriodOrders}
          growthPct={ordersOv.growthPct}
          series={ordersOv.series || []}
          granularity={ordersGranularity}
          onGranularityChange={setOrdersGranularity}
          startDate={ordersDateRange.start}
          endDate={ordersDateRange.end}
          onDateRangeChange={(start, end) => setOrdersDateRange({ start, end })}
          onBarClick={(b) =>
            setDrilldown({
              label: b.label,
              startIso: b.startIso,
              endIso: b.endIso,
              metric: 'orders',
            })
          }
        />

        <SalesOverviewCard
          loading={loading}
          totalRevenue={salesOv.totalRevenue}
          previousPeriodRevenue={salesOv.previousPeriodRevenue}
          growthPct={salesOv.growthPct}
          series={salesOv.series || []}
          granularity={salesGranularity}
          onGranularityChange={setSalesGranularity}
          startDate={salesDateRange.start}
          endDate={salesDateRange.end}
          onDateRangeChange={(start, end) => setSalesDateRange({ start, end })}
          onPointClick={(b) =>
            setDrilldown({
              label: b.label,
              startIso: b.startIso,
              endIso: b.endIso,
              metric: 'sales',
            })
          }
        />
      </div>

      {/* Row 3: Section 3 (Product & Brand Overview) & Section 4 (Top Brands by Sales) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProductBrandOverviewCard
            loading={loading}
            products={pbOv.products}
            brands={pbOv.brands}
            onSelectProductsFilter={(status) => navigate(`/products?status=${status}`)}
            onSelectBrandsFilter={(status) =>
              navigate(`/reports?tab=BRANDS&brandStatus=${status}`)
            }
          />
        </div>

        <TopBrandsCard
          loading={loading}
          brands={topBrands}
          onBrandClick={(brandName) =>
            navigate(`/products?brand=${encodeURIComponent(brandName)}`)
          }
        />
      </div>

      {/* Row 4: Orders Requiring Action & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader
            title="Orders Requiring Action"
            subtitle="New and in-progress orders awaiting dispatch"
            action={
              <Link
                to="/orders"
                className="text-xs font-medium text-[#943D24] hover:underline inline-flex items-center gap-1"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
          />
          <CardContent className="p-0">
            {actionOrders.length === 0 ? (
              <EmptyState
                title="All caught up"
                description="No orders require immediate action right now."
              />
            ) : (
              <div className="divide-y divide-[#E7E5E4]">
                {actionOrders.slice(0, 4).map((ord) => (
                  <div
                    key={ord.id}
                    className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-[#F8F7F5] transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#292524]">
                          {ord.orderNumber}
                        </span>
                        <Badge variant={getOrderBadgeVariant(ord.status)} size="sm">
                          {ord.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <p className="text-xs text-[#78716C] truncate mt-0.5">
                        {ord.customerName} • ₹
                        {(ord.totalAmount || ord.subtotal || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {ord.status === 'NEW' ? (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleQuickOrderAction(ord.id, 'ACCEPTED', 'Accepted')}
                        >
                          Accept
                        </Button>
                      ) : ord.status === 'ACCEPTED' ? (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() =>
                            handleQuickOrderAction(ord.id, 'READY_FOR_DISPATCH', 'Marked Ready')
                          }
                        >
                          Mark Ready
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleQuickOrderAction(ord.id, 'DISPATCHED', 'Dispatched')}
                        >
                          Dispatch
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Low Stock Alerts"
            subtitle="Items at or below reorder threshold"
            action={
              <Link
                to="/inventory?status=LOW_STOCK"
                className="text-xs font-medium text-[#943D24] hover:underline inline-flex items-center gap-1"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
          />
          <CardContent className="p-0">
            {lowStockItems.length === 0 ? (
              <EmptyState
                title="Stock levels are healthy"
                description="All catalog products are above their low-stock threshold."
              />
            ) : (
              <div className="divide-y divide-[#E7E5E4]">
                {lowStockItems.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-[#F8F7F5] transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#292524] truncate">{item.name}</p>
                      <p className="text-xs text-[#78716C] mt-0.5">
                        SKU: {item.sku} • Threshold: {item.lowStockThreshold}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant={item.stock === 0 ? 'danger' : 'warning'} size="sm">
                        {item.stock} left
                      </Badge>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => navigate('/inventory?status=LOW_STOCK')}
                      >
                        Restock
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 5: Recent Orders, Recent Payments & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader
            title="Recent Orders"
            action={
              <Link
                to="/orders"
                className="text-xs font-medium text-[#943D24] hover:underline inline-flex items-center gap-1"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F7F5] text-[#78716C] font-medium border-b border-[#E7E5E4]">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E5E4]">
                {orders.slice(0, 5).map((ord) => (
                  <tr
                    key={ord.id}
                    onClick={() => navigate(`/orders?search=${encodeURIComponent(ord.orderNumber)}`)}
                    className="hover:bg-[#F8F7F5] cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold text-[#292524]">{ord.orderNumber}</td>
                    <td className="py-3 px-4 text-right font-semibold text-[#292524]">
                      ₹{(ord.totalAmount || ord.subtotal || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Badge variant={getOrderBadgeVariant(ord.status)} size="sm">
                        {ord.status.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-[#78716C]">
                      No orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Recent Payments"
            action={
              <Link
                to="/earnings"
                className="text-xs font-medium text-[#943D24] hover:underline inline-flex items-center gap-1"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F7F5] text-[#78716C] font-medium border-b border-[#E7E5E4]">
                <tr>
                  <th className="py-3 px-4">Settlement</th>
                  <th className="py-3 px-4 text-right">Net Payout</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E5E4]">
                {settlements.slice(0, 5).map((stl) => (
                  <tr
                    key={stl.id}
                    onClick={() => navigate('/earnings')}
                    className="hover:bg-[#F8F7F5] cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold text-[#292524]">
                      {stl.settlementNumber || stl.id}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-[#292524]">
                      ₹{(stl.netPayable || stl.netAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Badge variant={stl.status === 'PAID' ? 'success' : 'warning'} size="sm">
                        {stl.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {settlements.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-[#78716C]">
                      No settlement records yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Important Notifications"
            action={
              <Link
                to="/notifications"
                className="text-xs font-medium text-[#943D24] hover:underline inline-flex items-center gap-1"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
          />
          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <EmptyState
                icon={<Bell className="w-5 h-5" />}
                title="No notifications"
                description="You're up to date on all store alerts."
              />
            ) : (
              <div className="divide-y divide-[#E7E5E4]">
                {notifications.slice(0, 4).map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      markAsRead(n.id);
                      if (n.actionUrl) navigate(n.actionUrl);
                    }}
                    className={`px-5 py-3.5 cursor-pointer hover:bg-[#F8F7F5] transition-colors ${
                      !n.read ? 'bg-[#FBF3F0]/50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-[#292524] line-clamp-1">{n.title}</p>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-[#F6C453] shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-xs text-[#78716C] line-clamp-2 mt-0.5">{n.message}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bar / Line Point Drilldown Drawer */}
      <AnalyticsDrilldownDrawer target={drilldown} onClose={() => setDrilldown(null)} />
    </div>
  );
};

export default VendorDashboardPage;
