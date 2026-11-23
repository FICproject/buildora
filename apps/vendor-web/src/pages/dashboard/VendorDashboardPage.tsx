import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  IndianRupee,
  ShoppingCart,
  Boxes,
  TrendingUp,
  Package,
  Layers,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { StatCard } from '../../components/common/StatCard';
import { Card, CardHeader, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useVendorOrderStore } from '../../store/useVendorOrderStore';
import { useVendorProductStore } from '../../store/useVendorProductStore';
import { useVendorInventoryStore } from '../../store/useVendorInventoryStore';
import { vendorApi } from '../../services/vendorApi';

export const VendorDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { orders, fetchOrders, updateOrderStatus } = useVendorOrderStore();
  const { products, fetchProducts } = useVendorProductStore();
  const { inventory, fetchInventory } = useVendorInventoryStore();

  const [metrics, setMetrics] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [metricsData, chartsData] = await Promise.all([
          vendorApi.getDashboardMetrics(),
          vendorApi.getDashboardCharts(),
        ]);
        setMetrics(metricsData);
        setCharts(chartsData);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
    fetchProducts();
    fetchInventory();
    loadData();
  }, []);

  const pendingOrders = orders.filter((o) => o.status === 'NEW');
  const lowStockItems = inventory.filter((i) => i.status === 'LOW_STOCK' || i.status === 'OUT_OF_STOCK');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Store Performance Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time fulfillment metrics for West Bengaluru Dark Store (WH-BLR-04)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/bulk-pricing')}
            leftIcon={<Layers className="w-3.5 h-3.5" />}
          >
            Bulk Pricing
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/inventory')}
            leftIcon={<Boxes className="w-3.5 h-3.5" />}
          >
            Stock Inwarding
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/products')}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add New Product
          </Button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Gross Sales"
          value={`₹${(metrics?.todayRevenue || 48750).toLocaleString('en-IN')}`}
          subtitle="Direct contractor purchases"
          icon={<IndianRupee className="w-5 h-5 text-emerald-600" />}
          trend={{ value: 18.2, isPositive: true, period: 'yesterday' }}
        />

        <StatCard
          title="Active Live Orders"
          value={metrics?.activeOrders || pendingOrders.length || 3}
          subtitle="60-min SLA dispatch pending"
          icon={<ShoppingCart className="w-5 h-5 text-blue-600" />}
          trend={{ value: 5.4, isPositive: true, period: 'last week' }}
          onClick={() => navigate('/orders')}
        />

        <StatCard
          title="Low Stock Items"
          value={lowStockItems.length || metrics?.lowStockCount || 2}
          subtitle="Requires replenishment"
          icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
          onClick={() => navigate('/inventory')}
        />

        <StatCard
          title="Next Payout Due"
          value={`₹${(metrics?.pendingSettlement || 184500).toLocaleString('en-IN')}`}
          subtitle="Scheduled for Friday T+7"
          icon={<TrendingUp className="w-5 h-5 text-indigo-600" />}
          onClick={() => navigate('/earnings')}
        />
      </div>

      {/* Main Grid: Sales Graph & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Chart Card (2 Cols) */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Weekly Dispatch Revenue & Order Volume"
            subtitle="Realized B2B sales across Bengaluru contractor sites"
            action={
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                +24.5% vs Last Week
              </span>
            }
          />
          <CardContent>
            {/* Visual Bar representation of 7-day revenue */}
            <div className="space-y-4">
              <div className="h-56 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-slate-100">
                {(charts?.salesTrend || [
                  { date: 'Mon', revenue: 42000 },
                  { date: 'Tue', revenue: 58000 },
                  { date: 'Wed', revenue: 51000 },
                  { date: 'Thu', revenue: 76000 },
                  { date: 'Fri', revenue: 64000 },
                  { date: 'Sat', revenue: 92000 },
                  { date: 'Sun', revenue: 48750 },
                ]).map((day: any) => {
                  const maxRev = 100000;
                  const heightPercent = Math.min(100, Math.round((day.revenue / maxRev) * 100));

                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-2 group">
                      <div className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                        ₹{(day.revenue / 1000).toFixed(1)}k
                      </div>
                      <div className="w-full bg-slate-100 rounded-t-md h-40 flex items-end p-1">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full bg-blue-600 rounded-t-sm group-hover:bg-blue-700 transition-all duration-300"
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-600">{day.date}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-blue-600" />
                    <span>Materials Revenue</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-amber-500" />
                    <span>Bulk Tier Orders (82%)</span>
                  </div>
                </div>
                <span>Dark Store Dispatch Target: ₹5,00,000 / week</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stock & Warehouse Health (1 Col) */}
        <Card>
          <CardHeader
            title="Dark Store Hub Status"
            subtitle="WH-BLR-04 Nagarabhavi Logistics Hub"
          />
          <CardContent className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Dispatch Readiness:</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> High (60m SLA)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Avg Lead Time:</span>
                <span className="font-semibold text-slate-800">18 minutes</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Live Active SKUs:</span>
                <span className="font-semibold text-slate-800">{products.length} Items</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900">Low Stock Alerts</span>
                <Link to="/inventory" className="text-xs text-blue-600 hover:underline">
                  View All
                </Link>
              </div>

              <div className="space-y-2">
                {lowStockItems.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">All inventory in stock</p>
                ) : (
                  lowStockItems.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/50 flex items-center justify-between text-xs"
                    >
                      <div className="truncate mr-2">
                        <p className="font-semibold text-slate-800 truncate">{item.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">Stock: {item.stock} left</p>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => navigate('/inventory')}
                        className="text-[11px] py-1 px-2 shrink-0"
                      >
                        Restock
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* HomeRun Customer Parity Pill */}
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
              <Layers className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Bulk Pricing Active</p>
                <p className="text-[11px] text-blue-700 mt-0.5">
                  Contractor discounts (10+, 50+ units) are actively driving 74% of orders.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders Section */}
      <Card>
        <CardHeader
          title="Recent Site Orders & Dispatch Queue"
          subtitle="Orders requiring vendor fulfillment and dark store handoff"
          action={
            <Link
              to="/orders"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View All Orders</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer Site</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Delivery SLA</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.slice(0, 5).map((order) => {
                const isPending = order.status === 'NEW';
                const isConfirmed = order.status === 'ACCEPTED';

                return (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                      {order.orderNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{order.customerName || 'Contractor Site'}</div>
                      <div className="text-[11px] text-slate-400">
                        {order.deliveryAddress.city} - {order.deliveryAddress.pincode}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      ₹{(order.totalAmount || order.subtotal || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        <Clock className="w-3 h-3" /> 60 Mins
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          order.status === 'DELIVERED'
                            ? 'success'
                            : order.status === 'DISPATCHED'
                            ? 'brand'
                            : order.status === 'NEW'
                            ? 'warning'
                            : 'info'
                        }
                      >
                        {order.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isPending ? (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => updateOrderStatus(order.id, 'ACCEPTED')}
                          className="text-[11px] py-1 px-2.5"
                        >
                          Accept Order
                        </Button>
                      ) : isConfirmed ? (
                        <Button
                          size="sm"
                          variant="accent"
                          onClick={() => updateOrderStatus(order.id, 'READY_FOR_DISPATCH')}
                          className="text-[11px] py-1 px-2.5"
                        >
                          Ready to Ship
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate('/orders')}
                          className="text-[11px] py-1 px-2.5"
                        >
                          Details
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
