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
  RotateCcw,
  Star,
  FileText,
  Warehouse,
  Sparkles,
  HelpCircle,
  Users,
  ShieldCheck,
  Calendar,
  Filter,
  Check,
  ArrowRight,
  Truck,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { vendorApi } from '../../services/vendorApi';

type PeriodType = 'today' | 'yesterday' | '7d' | '30d' | 'month';

export const VendorDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('7d');
  const [metrics, setMetrics] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (period: PeriodType) => {
    try {
      setRefreshing(true);
      const [m, c] = await Promise.all([
        vendorApi.getDashboardMetrics(),
        vendorApi.getDashboardCharts(),
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
  }, [selectedPeriod]);

  const periods: { id: PeriodType; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: '7d', label: 'Last 7 Days' },
    { id: '30d', label: 'Last 30 Days' },
    { id: 'month', label: 'This Month' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Top Header & Period Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#203D91]/10 text-[#203D91] border border-[#203D91]/20">
              SUPPLIER LIVE OPERATIONS
            </span>
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              WH-BLR-04 Peenya Central Connected
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#17233C]">
            Enterprise Vendor Performance
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Unified analytics, 60-minute site order dispatch tracking, and live catalog inventory sync.
          </p>
        </div>

        {/* Multi-Period Selector & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-[#F4F7FC] p-1 rounded-xl border border-[#E2E8F0]">
            {periods.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPeriod(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedPeriod === p.id
                    ? 'bg-[#203D91] text-white shadow-xs'
                    : 'text-slate-600 hover:text-[#203D91]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => loadData(selectedPeriod)}
            title="Refresh Metrics"
            className="p-2 rounded-xl border border-[#E2E8F0] text-slate-600 hover:text-[#203D91] hover:bg-[#F4F7FC] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#203D91]' : ''}`} />
          </button>
        </div>
      </div>

      {/* QUICK SHORTCUT ACTIONS BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          onClick={() => navigate('/products')}
          className="flex items-center gap-2 p-3 bg-white rounded-xl border border-[#E2E8F0] hover:border-[#203D91] hover:shadow-xs transition-all text-left group"
        >
          <div className="w-8 h-8 rounded-lg bg-[#203D91]/10 text-[#203D91] flex items-center justify-center shrink-0 group-hover:bg-[#203D91] group-hover:text-white transition-colors">
            <Plus className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#17233C] truncate">Add Product</p>
            <p className="text-[10px] text-slate-400 truncate">New Catalog Spec</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/inventory')}
          className="flex items-center gap-2 p-3 bg-white rounded-xl border border-[#E2E8F0] hover:border-[#203D91] hover:shadow-xs transition-all text-left group"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <Boxes className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#17233C] truncate">Stock Inward</p>
            <p className="text-[10px] text-slate-400 truncate">Atomic Movements</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/orders')}
          className="flex items-center gap-2 p-3 bg-white rounded-xl border border-[#E2E8F0] hover:border-[#FF7417] hover:shadow-xs transition-all text-left group"
        >
          <div className="w-8 h-8 rounded-lg bg-[#FF7417]/10 text-[#FF7417] flex items-center justify-center shrink-0 group-hover:bg-[#FF7417] group-hover:text-white transition-colors">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#17233C] truncate">Live Orders</p>
            <p className="text-[10px] text-slate-400 truncate">60-Min Dispatch</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/bulk-pricing')}
          className="flex items-center gap-2 p-3 bg-white rounded-xl border border-[#E2E8F0] hover:border-[#203D91] hover:shadow-xs transition-all text-left group"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <Layers className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#17233C] truncate">Bulk Pricing</p>
            <p className="text-[10px] text-slate-400 truncate">Tier Discounts</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/earnings')}
          className="flex items-center gap-2 p-3 bg-white rounded-xl border border-[#E2E8F0] hover:border-[#203D91] hover:shadow-xs transition-all text-left group"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
            <IndianRupee className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#17233C] truncate">Payouts</p>
            <p className="text-[10px] text-slate-400 truncate">Request Payout</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/support')}
          className="flex items-center gap-2 p-3 bg-white rounded-xl border border-[#E2E8F0] hover:border-[#203D91] hover:shadow-xs transition-all text-left group"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#17233C] truncate">Support Desk</p>
            <p className="text-[10px] text-slate-400 truncate">Raise Ticket</p>
          </div>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 17 ENTERPRISE KPI CARDS (Grouped with Clickable Drilldowns) */}
      {/* ======================================================== */}

      {/* 1. REVENUE & FINANCIAL KPIS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
            1. Financial Health & Settlements (3 KPIs)
          </h2>
          <span className="text-[11px] font-bold text-[#203D91]">
            7-Day Rolling Payout Cycle
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* KPI 1: Gross Sales */}
          <div
            onClick={() => navigate('/earnings')}
            className="p-5 bg-white rounded-2xl border border-[#E2E8F0] hover:border-[#203D91] hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Gross Sales Revenue</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-[#17233C] mt-2">
              ₹{(metrics?.grossRevenue || 168400).toLocaleString('en-IN')}
            </p>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#E2E8F0] text-[11px]">
              <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" /> +18.4% vs last cycle
              </span>
              <span className="text-slate-400 group-hover:text-[#203D91] flex items-center gap-0.5 font-bold">
                View Ledger <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* KPI 2: Net Earnings */}
          <div
            onClick={() => navigate('/earnings')}
            className="p-5 bg-white rounded-2xl border border-[#E2E8F0] hover:border-[#203D91] hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Net Vendor Payout (Post-Commission)</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#203D91] flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-[#17233C] mt-2">
              ₹{(metrics?.netEarnings || 158296).toLocaleString('en-IN')}
            </p>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#E2E8F0] text-[11px]">
              <span className="text-slate-500 font-medium">Platform Fee: 5% flat</span>
              <span className="text-slate-400 group-hover:text-[#203D91] flex items-center gap-0.5 font-bold">
                Breakdown <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* KPI 3: Pending Settlements */}
          <div
            onClick={() => navigate('/earnings')}
            className="p-5 bg-white rounded-2xl border border-[#E2E8F0] hover:border-[#203D91] hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Pending Bank Settlement</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-amber-700 mt-2">
              ₹{(metrics?.pendingSettlement || 50948).toLocaleString('en-IN')}
            </p>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#E2E8F0] text-[11px]">
              <span className="text-slate-500 font-medium">NEFT to HDFC Bank ****2341</span>
              <span className="text-amber-700 font-bold group-hover:underline">
                Request Payout →
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ORDER FULFILLMENT KPIS (6 KPIs) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
            2. Order Dispatch & 60-Minute SLA Tracking (6 KPIs)
          </h2>
          <span className="text-[11px] font-bold text-emerald-600">
            98.6% On-Time Site Dispatch
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Total Orders */}
          <div
            onClick={() => navigate('/orders')}
            className="p-4 bg-white rounded-xl border border-[#E2E8F0] hover:border-[#203D91] hover:shadow-xs transition-all cursor-pointer group"
          >
            <span className="text-[11px] font-bold text-slate-500">Total Orders</span>
            <p className="text-xl font-black text-[#17233C] mt-1">{metrics?.totalOrders || 52}</p>
            <p className="text-[10px] text-slate-400 mt-1 group-hover:text-[#203D91] font-semibold">View All →</p>
          </div>

          {/* New Live Orders */}
          <div
            onClick={() => navigate('/orders?status=NEW')}
            className="p-4 bg-white rounded-xl border border-[#FF7417] bg-[#FF7417]/5 hover:shadow-xs transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-[#FF7417]">New Orders</span>
              <span className="w-2 h-2 rounded-full bg-[#FF7417] animate-ping" />
            </div>
            <p className="text-xl font-black text-[#FF7417] mt-1">{metrics?.newOrders || 2}</p>
            <p className="text-[10px] text-[#FF7417] font-bold mt-1">Action Required →</p>
          </div>

          {/* Processing / Packing */}
          <div
            onClick={() => navigate('/orders?status=PROCESSING')}
            className="p-4 bg-white rounded-xl border border-[#E2E8F0] hover:border-[#203D91] hover:shadow-xs transition-all cursor-pointer group"
          >
            <span className="text-[11px] font-bold text-slate-500">Processing & Packed</span>
            <p className="text-xl font-black text-amber-600 mt-1">{metrics?.processingOrders || 3}</p>
            <p className="text-[10px] text-slate-400 mt-1 font-semibold">In Packing Bay →</p>
          </div>

          {/* Shipped / En Route */}
          <div
            onClick={() => navigate('/orders?status=DISPATCHED')}
            className="p-4 bg-white rounded-xl border border-[#E2E8F0] hover:border-[#203D91] hover:shadow-xs transition-all cursor-pointer group"
          >
            <span className="text-[11px] font-bold text-slate-500">Shipped (EV Mini-Truck)</span>
            <p className="text-xl font-black text-[#203D91] mt-1">{metrics?.dispatchedOrders || metrics?.shippedOrders || 2}</p>
            <p className="text-[10px] text-slate-400 mt-1 font-semibold">60-Min En Route →</p>
          </div>

          {/* Delivered */}
          <div
            onClick={() => navigate('/orders?status=DELIVERED')}
            className="p-4 bg-white rounded-xl border border-[#E2E8F0] hover:border-emerald-600 hover:shadow-xs transition-all cursor-pointer group"
          >
            <span className="text-[11px] font-bold text-slate-500">Delivered</span>
            <p className="text-xl font-black text-emerald-600 mt-1">{metrics?.deliveredOrders || 44}</p>
            <p className="text-[10px] text-slate-400 mt-1 font-semibold">Site Gate Received →</p>
          </div>

          {/* Cancelled */}
          <div
            onClick={() => navigate('/orders?status=CANCELLED')}
            className="p-4 bg-white rounded-xl border border-[#E2E8F0] hover:border-rose-500 hover:shadow-xs transition-all cursor-pointer group"
          >
            <span className="text-[11px] font-bold text-slate-500">Cancelled</span>
            <p className="text-xl font-black text-rose-600 mt-1">{metrics?.cancelledOrders || 1}</p>
            <p className="text-[10px] text-slate-400 mt-1 font-semibold">View Rejections →</p>
          </div>
        </div>
      </div>

      {/* 3. PRODUCTS & STOCK & OPERATIONS (8 KPIs) */}
      <div className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
          3. Products, Dark Store Stock & Operations (8 KPIs)
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {/* Total Catalog Products */}
          <div
            onClick={() => navigate('/products')}
            className="p-3 bg-white rounded-xl border border-[#E2E8F0] hover:border-[#203D91] hover:shadow-xs transition-all cursor-pointer group"
          >
            <span className="text-[10px] font-bold text-slate-500">Total Products</span>
            <p className="text-lg font-black text-[#17233C] mt-1">{metrics?.totalProducts || 12}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">Catalog Listed</p>
          </div>

          {/* Active Products */}
          <div
            onClick={() => navigate('/products?status=ACTIVE')}
            className="p-3 bg-white rounded-xl border border-[#E2E8F0] hover:border-emerald-600 hover:shadow-xs transition-all cursor-pointer group"
          >
            <span className="text-[10px] font-bold text-emerald-700">Active Live</span>
            <p className="text-lg font-black text-emerald-600 mt-1">{metrics?.activeProducts || 11}</p>
            <p className="text-[9px] text-emerald-600 font-semibold">Customer PDP Live</p>
          </div>

          {/* Pending Approval */}
          <div
            onClick={() => navigate('/products?status=PENDING_APPROVAL')}
            className="p-3 bg-white rounded-xl border border-[#E2E8F0] hover:border-amber-500 hover:shadow-xs transition-all cursor-pointer group"
          >
            <span className="text-[10px] font-bold text-amber-700">Pending Review</span>
            <p className="text-lg font-black text-amber-600 mt-1">{metrics?.pendingApprovalProducts || 1}</p>
            <p className="text-[9px] text-amber-600 font-semibold">QA Compliance</p>
          </div>

          {/* Rejected Products */}
          <div
            onClick={() => navigate('/products?status=REJECTED')}
            className="p-3 bg-white rounded-xl border border-[#E2E8F0] hover:border-rose-500 hover:shadow-xs transition-all cursor-pointer group"
          >
            <span className="text-[10px] font-bold text-slate-500">Rejected</span>
            <p className="text-lg font-black text-slate-700 mt-1">{metrics?.rejectedProducts || 0}</p>
            <p className="text-[9px] text-slate-400">Needs Revision</p>
          </div>

          {/* Low Stock Items */}
          <div
            onClick={() => navigate('/inventory?status=LOW_STOCK')}
            className="p-3 bg-white rounded-xl border border-amber-300 bg-amber-50/30 hover:shadow-xs transition-all cursor-pointer group"
          >
            <span className="text-[10px] font-bold text-amber-800">Low Stock Alert</span>
            <p className="text-lg font-black text-amber-700 mt-1">{metrics?.lowStockCount || 2}</p>
            <p className="text-[9px] text-amber-800 font-bold">Below Threshold →</p>
          </div>

          {/* Out of Stock Items */}
          <div
            onClick={() => navigate('/inventory?status=OUT_OF_STOCK')}
            className="p-3 bg-white rounded-xl border border-rose-300 bg-rose-50/30 hover:shadow-xs transition-all cursor-pointer group"
          >
            <span className="text-[10px] font-bold text-rose-800">Out of Stock</span>
            <p className="text-lg font-black text-rose-700 mt-1">{metrics?.outOfStockCount || 0}</p>
            <p className="text-[9px] text-rose-700 font-bold">Blocked PDPs →</p>
          </div>

          {/* Return Requests */}
          <div
            onClick={() => navigate('/returns')}
            className="p-3 bg-white rounded-xl border border-[#E2E8F0] hover:border-[#203D91] hover:shadow-xs transition-all cursor-pointer group"
          >
            <span className="text-[10px] font-bold text-slate-500">Return Requests</span>
            <p className="text-lg font-black text-[#203D91] mt-1">{metrics?.returnRequests || 3}</p>
            <p className="text-[9px] text-slate-400">Inspection Pending</p>
          </div>

          {/* Customer Rating */}
          <div
            onClick={() => navigate('/reviews')}
            className="p-3 bg-white rounded-xl border border-[#E2E8F0] hover:border-amber-400 hover:shadow-xs transition-all cursor-pointer group"
          >
            <span className="text-[10px] font-bold text-slate-500">Customer Rating</span>
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <p className="text-lg font-black text-[#17233C]">{metrics?.customerRating || 4.8}</p>
            </div>
            <p className="text-[9px] text-slate-400">{metrics?.reviewCount || 28} Verified Reviews</p>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* CHARTS & VISUAL ANALYTICS ROW */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & Revenue Trend (2 cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-[#17233C]">Sales Revenue & Order Volumes</h3>
              <p className="text-xs text-slate-500">Period trend: {selectedPeriod.toUpperCase()}</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Live Stream Active
            </span>
          </div>

          {/* Simulated Visual Area Chart */}
          <div className="h-56 flex items-end gap-3 pt-6 pb-2 border-b border-[#E2E8F0]">
            {(charts?.revenueTrends || [
              { date: '18 Nov', revenue: 18500, orders: 6 },
              { date: '19 Nov', revenue: 16800, orders: 5 },
              { date: '20 Nov', revenue: 22400, orders: 8 },
              { date: '21 Nov', revenue: 26900, orders: 9 },
              { date: '22 Nov', revenue: 31200, orders: 11 },
              { date: '23 Nov', revenue: 22700, orders: 7 },
              { date: '24 Nov', revenue: 34100, orders: 12 },
            ]).map((point: any, idx: number) => {
              const heightPct = Math.min(100, Math.max(15, Math.round((point.revenue / 35000) * 100)));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <div className="text-[10px] font-bold text-slate-400 group-hover:text-[#203D91] transition-colors">
                    ₹{Math.round(point.revenue / 1000)}k
                  </div>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full bg-gradient-to-t from-[#203D91] to-[#FF7417] rounded-t-lg transition-all group-hover:brightness-110 shadow-xs relative"
                  >
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#17233C] text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      {point.orders} orders
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 truncate w-full text-center">
                    {point.date}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-1">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-[#203D91]"></span> Gross Revenue
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-[#FF7417]"></span> Peak Volume Hours
              </span>
            </div>
            <Link to="/reports" className="font-bold text-[#203D91] hover:underline flex items-center gap-1">
              Download CSV Report <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Order Status Distribution (Donut style) */}
        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-extrabold text-[#17233C]">Order Status Pipeline</h3>
              <span className="text-[10px] font-bold text-slate-400">Total: 52</span>
            </div>

            <div className="space-y-2.5 mt-4">
              {(charts?.statusDistribution || [
                { status: 'DELIVERED', label: 'Delivered to Site', count: 44, color: '#10B981' },
                { status: 'PROCESSING', label: 'Packing at Depot', count: 4, color: '#F59E0B' },
                { status: 'NEW', label: 'New Live Orders', count: 2, color: '#FF7417' },
                { status: 'DISPATCHED', label: '60-Min Express Transit', count: 2, color: '#203D91' },
              ]).map((item: any) => (
                <div key={item.status} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.label}
                    </span>
                    <span>{item.count} orders</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.round((item.count / 52) * 100)}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-[#F4F7FC] rounded-xl border border-[#E2E8F0] mt-4 text-[11px] text-slate-600">
            <span className="font-bold text-[#203D91]">Dark Store SLA:</span> 98.6% of orders packed within 15 minutes of customer checkout.
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TOP SELLING PRODUCTS & RECENT ORDERS STREAM */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Products Table */}
        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-[#17233C]">Top 5 High-Demand Materials</h3>
              <p className="text-xs text-slate-500">Ranked by volume sold and depot turnaround</p>
            </div>
            <Link to="/products" className="text-xs font-bold text-[#203D91] hover:underline">
              Full Catalog →
            </Link>
          </div>

          <div className="divide-y divide-[#E2E8F0]">
            {(charts?.topProducts || [
              { id: 'vp-prod-cem-1', name: 'UltraTech Super Cement (PPC)', sku: 'CEM-ULT-PPC-50KG', unitsSold: 420, revenue: 165900, stock: 240 },
              { id: 'vp-prod-plumb-1', name: 'Astral CPVC PRO Class 1 Pipe 1"', sku: 'PLM-AST-CPVC-1IN', unitsSold: 180, revenue: 79200, stock: 70 },
              { id: 'vp-prod-ele-1', name: 'Finolex FR 2.5 sq mm Wire (90m)', sku: 'ELE-FIN-25-RED', unitsSold: 95, revenue: 163875, stock: 30 },
              { id: 'vp-prod-ply-1', name: 'Greenply Marine 710 Plywood 18mm', sku: 'PLY-GRN-BWP-18', unitsSold: 64, revenue: 147200, stock: 44 },
              { id: 'vp-prod-pnt-1', name: 'Asian Paints Apex Ultima White 20L', sku: 'PNT-APX-ULT-20L', unitsSold: 48, revenue: 196800, stock: 22 },
            ]).map((p: any, idx: number) => (
              <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-extrabold flex items-center justify-center text-[10px] shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-[#17233C] truncate">{p.name}</p>
                    <p className="text-[10px] text-slate-400">SKU: {p.sku}</p>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-3">
                  <p className="font-extrabold text-[#17233C]">₹{p.revenue.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-slate-500 font-medium">{p.unitsSold} units • {p.stock} in stock</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Order Stream */}
        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-[#17233C]">Live Dispatch Stream</h3>
              <p className="text-xs text-slate-500">60-minute quick commerce site orders</p>
            </div>
            <Link to="/orders" className="text-xs font-bold text-[#203D91] hover:underline">
              All Orders →
            </Link>
          </div>

          <div className="space-y-3">
            {[
              {
                orderNumber: 'BLD-2026-8941',
                customer: 'Arjun Sharma (Site Engineer)',
                item: '10 bags UltraTech Super Cement PPC',
                amount: 3950,
                status: 'READY_FOR_DISPATCH',
                statusLabel: 'Packing Completed',
                badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
                slaTime: '18 mins remaining',
              },
              {
                orderNumber: 'BLD-2026-8942',
                customer: 'Suresh Kumar',
                item: '5 rolls Astral CPVC PRO Pipe 1"',
                amount: 4400,
                status: 'DISPATCHED',
                statusLabel: 'En Route on EV Truck',
                badgeBg: 'bg-blue-50 text-[#203D91] border-blue-200',
                slaTime: '32 mins to Indiranagar site',
              },
              {
                orderNumber: 'BLD-2026-8940',
                customer: 'Raghavan Pillai',
                item: '2 coils Finolex FR 2.5 sq mm Wire',
                amount: 3450,
                status: 'DELIVERED',
                statusLabel: 'Delivered at Gate',
                badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                slaTime: 'Completed in 44 mins',
              },
            ].map((ord) => (
              <div
                key={ord.orderNumber}
                className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F4F7FC]/50 hover:bg-[#F4F7FC] transition-colors flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-extrabold text-[#17233C]">#{ord.orderNumber}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ord.badgeBg}`}>
                      {ord.statusLabel}
                    </span>
                  </div>
                  <p className="text-slate-600 truncate font-medium">{ord.item}</p>
                  <p className="text-[10px] text-slate-400">Customer: {ord.customer}</p>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-black text-[#17233C]">₹{ord.amount.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] font-semibold text-emerald-700">{ord.slaTime}</p>
                  <button
                    onClick={() => navigate('/orders')}
                    className="text-[10px] font-bold text-[#203D91] hover:underline mt-1 inline-block"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default VendorDashboardPage;