import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShoppingCart,
  Clock,
  Package,
  AlertTriangle,
  IndianRupee,
  Wallet,
  RefreshCw,
  ArrowRight,
  Bell,
} from 'lucide-react';
import { vendorApi } from '../../services/vendorApi';
import { useVendorOrderStore } from '../../store/useVendorOrderStore';
import { useVendorInventoryStore } from '../../store/useVendorInventoryStore';
import { useVendorNotificationStore } from '../../store/useVendorNotificationStore';
import { useVendorSettlementStore } from '../../store/useVendorSettlementStore';
import {
  PageHeader,
  StatCard,
  Card,
  CardHeader,
  CardContent,
  Badge,
  Button,
  EmptyState,
} from '../../components/common';
import { toast } from '../../store/useToastStore';

type PeriodType = 'today' | '7d' | '30d' | 'month';

export const VendorDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('7d');
  const [metrics, setMetrics] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { orders, fetchOrders, updateOrderStatus } = useVendorOrderStore();
  const { inventory, fetchInventory } = useVendorInventoryStore();
  const { notifications, markAsRead } = useVendorNotificationStore();
  const { settlements, fetchSettlements } = useVendorSettlementStore();

  const loadData = async (period: PeriodType) => {
    try {
      setRefreshing(true);
      const [m, c] = await Promise.all([
        vendorApi.getDashboardMetrics(period),
        vendorApi.getDashboardCharts(period),
      ]);
      setMetrics(m);
      setCharts(c);
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(selectedPeriod);
    fetchOrders();
    fetchInventory();
    fetchSettlements();
  }, [selectedPeriod]);

  const periods: { id: PeriodType; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: '7d', label: '7 Days' },
    { id: '30d', label: '30 Days' },
    { id: 'month', label: 'This Month' },
  ];

  const actionOrders = orders.filter(
    (o) => o.status === 'NEW' || o.status === 'ACCEPTED' || o.status === 'READY_FOR_DISPATCH'
  );
  const lowStockItems = inventory.filter(
    (i) => i.status === 'LOW_STOCK' || i.status === 'OUT_OF_STOCK'
  );
  const salesPoints: { date: string; revenue: number; orders?: number }[] =
    charts?.revenueTrends || charts?.salesTrend || [];
  const maxRevenue = Math.max(1, ...salesPoints.map((p) => p.revenue || 0));

  const getOrderBadgeVariant = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'success';
      case 'NEW':
        return 'accent';
      case 'CANCELLED':
      case 'RETURNED':
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
      loadData(selectedPeriod);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <PageHeader
        title="Overview"
        description="Track your daily orders, stock health, sales performance, and upcoming settlements."
        actions={
          <>
            <div className="flex items-center bg-white p-1 rounded-lg border border-[#E7E5E4]">
              {periods.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPeriod(p.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    selectedPeriod === p.id
                      ? 'bg-[#943D24] text-white'
                      : 'text-[#78716C] hover:text-[#292524]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => loadData(selectedPeriod)}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
          </>
        }
      />

      {/* 6 Essential KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Orders"
          value={loading ? '—' : metrics?.totalOrders ?? orders.length}
          subtitle="All received orders"
          icon={<ShoppingCart className="w-4 h-4" />}
          onClick={() => navigate('/orders')}
        />
        <StatCard
          title="Pending Orders"
          value={loading ? '—' : actionOrders.length || metrics?.pendingOrders || 0}
          subtitle="Need action today"
          icon={<Clock className="w-4 h-4 text-[#943D24]" />}
          onClick={() => navigate('/orders?status=NEW')}
        />
        <StatCard
          title="Products"
          value={loading ? '—' : metrics?.totalProducts ?? inventory.length}
          subtitle={`${metrics?.activeProducts ?? inventory.length} active in catalog`}
          icon={<Package className="w-4 h-4" />}
          onClick={() => navigate('/products')}
        />
        <StatCard
          title="Low Stock Items"
          value={loading ? '—' : lowStockItems.length || metrics?.lowStockCount || 0}
          subtitle="Needs replenishment"
          icon={<AlertTriangle className="w-4 h-4 text-[#D99B16]" />}
          onClick={() => navigate('/inventory?status=LOW_STOCK')}
        />
        <StatCard
          title="Total Sales"
          value={loading ? '—' : `₹${(metrics?.grossRevenue || 0).toLocaleString('en-IN')}`}
          subtitle="Gross order value"
          icon={<IndianRupee className="w-4 h-4 text-[#943D24]" />}
          onClick={() => navigate('/reports')}
        />
        <StatCard
          title="Pending Settlements"
          value={loading ? '—' : `₹${(metrics?.pendingSettlement || 0).toLocaleString('en-IN')}`}
          subtitle="Next payout cycle"
          icon={<Wallet className="w-4 h-4" />}
          onClick={() => navigate('/earnings')}
        />
      </div>

      {/* Row 1: Orders Requiring Action & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 2. Orders Requiring Action */}
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
                        {ord.customerName} • ₹{(ord.totalAmount || ord.subtotal || 0).toLocaleString('en-IN')}
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
                          onClick={() =>
                            handleQuickOrderAction(ord.id, 'DISPATCHED', 'Dispatched')
                          }
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

        {/* 3. Low Stock Alerts */}
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

      {/* Row 2: Sales Overview & Important Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 5. Sales Overview */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Sales Overview"
            subtitle="Revenue trend for the selected period"
            action={
              <Link
                to="/reports"
                className="text-xs font-medium text-[#943D24] hover:underline inline-flex items-center gap-1"
              >
                Full Report <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
          />
          <CardContent>
            {salesPoints.length === 0 ? (
              <EmptyState title="No sales data yet" description="Sales trend will appear once orders arrive." />
            ) : (
              <div className="h-52 flex items-end gap-3 pt-4 pb-1 border-b border-[#E7E5E4]">
                {salesPoints.map((point, idx) => {
                  const pct = Math.max(12, Math.round(((point.revenue || 0) / maxRevenue) * 100));
                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group"
                    >
                      <span className="text-[11px] font-medium text-[#78716C] group-hover:text-[#943D24]">
                        ₹{Math.round((point.revenue || 0) / 1000)}k
                      </span>
                      <div
                        style={{ height: `${pct}%` }}
                        className={`w-full max-w-[44px] rounded-t-md transition-colors ${
                          idx % 2 === 0
                            ? 'bg-[#943D24] group-hover:bg-[#7D331E]'
                            : 'bg-[#F6C453] group-hover:bg-[#E5B342]'
                        }`}
                        title={`${point.date}: ₹${(point.revenue || 0).toLocaleString('en-IN')}`}
                      />
                      <span className="text-[11px] text-[#78716C] truncate w-full text-center">
                        {point.date}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 6. Important Notifications */}
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

      {/* Row 3: Recent Orders & Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Recent Orders */}
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
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E5E4]">
                {orders.slice(0, 5).map((ord) => (
                  <tr
                    key={ord.id}
                    onClick={() => navigate('/orders')}
                    className="hover:bg-[#F8F7F5] cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold text-[#292524]">{ord.orderNumber}</td>
                    <td className="py-3 px-4 text-[#78716C] truncate max-w-[160px]">
                      {ord.customerName}
                    </td>
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
                    <td colSpan={4} className="py-8 text-center text-[#78716C]">
                      No orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* 4. Recent Payments */}
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
                  <th className="py-3 px-4">Period</th>
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
                    <td className="py-3 px-4 text-[#78716C]">{stl.period}</td>
                    <td className="py-3 px-4 text-right font-semibold text-[#292524]">
                      ₹{(stl.netPayable || stl.netAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Badge
                        variant={stl.status === 'PAID' ? 'success' : 'warning'}
                        size="sm"
                      >
                        {stl.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {settlements.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-[#78716C]">
                      No settlement records yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default VendorDashboardPage;
