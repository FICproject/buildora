import mongoose from 'mongoose';
import { MASTER_BRANDS } from '@buildora/constants';
import { dbStore } from '../../../database/store';
import {
  PlatformOrderModel,
  PlatformProductModel,
  PlatformSettlementModel,
} from '../../../database/platform-persistence.service';

export type AnalyticsGranularity = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface AnalyticsFilterInput {
  vendorId: string;
  ordersFilter?: AnalyticsGranularity;
  salesFilter?: AnalyticsGranularity;
  ordersStartDate?: string;
  ordersEndDate?: string;
  salesStartDate?: string;
  salesEndDate?: string;
  brandFilter?: string;
}

interface BucketDef {
  key: string;
  label: string;
  start: Date;
  end: Date;
  prevStart: Date;
  prevEnd: Date;
}

function calcGrowthPct(current: number, previous: number): number | null {
  if (previous <= 0) {
    return current > 0 ? 100 : 0;
  }
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function resolveBrandMeta(brandName: string): { name: string; slug: string; logo: string } {
  const clean = (brandName || 'Unbranded').trim();
  const lower = clean.toLowerCase();
  const pool = [...(dbStore.brands || []), ...(MASTER_BRANDS || [])];
  const matched = pool.find(
    (b: any) =>
      b.name?.toLowerCase() === lower ||
      b.slug?.toLowerCase() === lower ||
      lower.includes(b.slug?.toLowerCase()) ||
      b.name?.toLowerCase().includes(lower)
  );
  return {
    name: matched?.name || clean,
    slug: matched?.slug || clean.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    logo: matched?.logo || '',
  };
}

function buildBuckets(
  granularity: AnalyticsGranularity,
  startDateStr?: string,
  endDateStr?: string
): {
  buckets: BucketDef[];
  currentStart: Date;
  currentEnd: Date;
  prevStart: Date;
  prevEnd: Date;
} {
  const now = new Date();
  let customStart: Date | null = null;
  let customEnd: Date | null = null;

  if (startDateStr) {
    const d = new Date(startDateStr);
    if (!Number.isNaN(d.getTime())) {
      d.setHours(0, 0, 0, 0);
      customStart = d;
    }
  }
  if (endDateStr) {
    const d = new Date(endDateStr);
    if (!Number.isNaN(d.getTime())) {
      d.setHours(23, 59, 59, 999);
      customEnd = d;
    }
  }

  const end = customEnd || new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const buckets: BucketDef[] = [];

  if (customStart && customEnd && customEnd > customStart) {
    const spanMs = customEnd.getTime() - customStart.getTime();
    const totalDays = Math.max(1, Math.ceil(spanMs / 86400000));
    const stepDays = totalDays <= 14 ? 1 : totalDays <= 60 ? 7 : 30;
    const count = Math.min(12, Math.max(1, Math.ceil(totalDays / stepDays)));
    for (let i = 0; i < count; i++) {
      const bStart = new Date(customStart.getTime() + i * stepDays * 86400000);
      const bEnd =
        i === count - 1
          ? new Date(customEnd)
          : new Date(Math.min(customEnd.getTime(), bStart.getTime() + stepDays * 86400000 - 1));
      const pStart = new Date(bStart.getTime() - spanMs - 1);
      const pEnd = new Date(bEnd.getTime() - spanMs - 1);
      const label = bStart.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      buckets.push({
        key: `custom-${i}`,
        label,
        start: bStart,
        end: bEnd,
        prevStart: pStart,
        prevEnd: pEnd,
      });
    }
    return {
      buckets,
      currentStart: customStart,
      currentEnd: customEnd,
      prevStart: new Date(customStart.getTime() - spanMs - 1),
      prevEnd: new Date(customStart.getTime() - 1),
    };
  }

  if (granularity === 'daily') {
    const days = 7;
    const currentStart = new Date(end);
    currentStart.setDate(end.getDate() - (days - 1));
    currentStart.setHours(0, 0, 0, 0);
    const spanMs = days * 86400000;

    for (let i = 0; i < days; i++) {
      const bStart = new Date(currentStart.getTime() + i * 86400000);
      const bEnd = new Date(bStart);
      bEnd.setHours(23, 59, 59, 999);
      const pStart = new Date(bStart.getTime() - spanMs);
      const pEnd = new Date(bEnd.getTime() - spanMs);
      buckets.push({
        key: bStart.toISOString().slice(0, 10),
        label: bStart.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        start: bStart,
        end: bEnd,
        prevStart: pStart,
        prevEnd: pEnd,
      });
    }
    return {
      buckets,
      currentStart,
      currentEnd: end,
      prevStart: new Date(currentStart.getTime() - spanMs),
      prevEnd: new Date(currentStart.getTime() - 1),
    };
  }

  if (granularity === 'weekly') {
    const weeks = 8;
    const weekMs = 7 * 86400000;
    const currentStart = new Date(end.getTime() - weeks * weekMs + 1);
    currentStart.setHours(0, 0, 0, 0);
    const spanMs = end.getTime() - currentStart.getTime() + 1;

    for (let i = 0; i < weeks; i++) {
      const bStart = new Date(currentStart.getTime() + i * weekMs);
      const bEnd =
        i === weeks - 1 ? new Date(end) : new Date(bStart.getTime() + weekMs - 1);
      buckets.push({
        key: `wk-${i + 1}`,
        label: bStart.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        start: bStart,
        end: bEnd,
        prevStart: new Date(bStart.getTime() - spanMs),
        prevEnd: new Date(bEnd.getTime() - spanMs),
      });
    }
    return {
      buckets,
      currentStart,
      currentEnd: end,
      prevStart: new Date(currentStart.getTime() - spanMs),
      prevEnd: new Date(currentStart.getTime() - 1),
    };
  }

  if (granularity === 'monthly') {
    const months = 6;
    const currentStart = new Date(end.getFullYear(), end.getMonth() - (months - 1), 1, 0, 0, 0, 0);
    const prevStart = new Date(end.getFullYear(), end.getMonth() - (months * 2 - 1), 1, 0, 0, 0, 0);
    const prevEnd = new Date(currentStart.getTime() - 1);

    for (let i = 0; i < months; i++) {
      const mStart = new Date(currentStart.getFullYear(), currentStart.getMonth() + i, 1, 0, 0, 0, 0);
      const mEnd =
        i === months - 1
          ? new Date(end)
          : new Date(mStart.getFullYear(), mStart.getMonth() + 1, 0, 23, 59, 59, 999);
      const pmStart = new Date(mStart.getFullYear(), mStart.getMonth() - months, 1, 0, 0, 0, 0);
      const pmEnd = new Date(pmStart.getFullYear(), pmStart.getMonth() + 1, 0, 23, 59, 59, 999);
      buckets.push({
        key: `${mStart.getFullYear()}-${String(mStart.getMonth() + 1).padStart(2, '0')}`,
        label: mStart.toLocaleDateString('en-IN', { month: 'short' }),
        start: mStart,
        end: mEnd,
        prevStart: pmStart,
        prevEnd: pmEnd,
      });
    }
    return { buckets, currentStart, currentEnd: end, prevStart, prevEnd };
  }

  // yearly (last 4 years)
  const years = 4;
  const currentStart = new Date(end.getFullYear() - (years - 1), 0, 1, 0, 0, 0, 0);
  const prevStart = new Date(end.getFullYear() - (years * 2 - 1), 0, 1, 0, 0, 0, 0);
  const prevEnd = new Date(currentStart.getTime() - 1);
  for (let i = 0; i < years; i++) {
    const y = currentStart.getFullYear() + i;
    const yStart = new Date(y, 0, 1, 0, 0, 0, 0);
    const yEnd = i === years - 1 ? new Date(end) : new Date(y, 11, 31, 23, 59, 59, 999);
    const pyStart = new Date(y - years, 0, 1, 0, 0, 0, 0);
    const pyEnd = new Date(y - years, 11, 31, 23, 59, 59, 999);
    buckets.push({
      key: String(y),
      label: String(y),
      start: yStart,
      end: yEnd,
      prevStart: pyStart,
      prevEnd: pyEnd,
    });
  }
  return { buckets, currentStart, currentEnd: end, prevStart, prevEnd };
}

function isOrderValidForSales(o: any): boolean {
  const status = String(o?.status || '').toUpperCase();
  return status !== 'CANCELLED' && status !== 'REJECTED';
}

function getOrderRevenue(o: any): number {
  return Math.round(Number(o?.subtotal ?? o?.totalAmount ?? 0));
}

export class VendorAnalyticsService {
  async loadVendorDataset(
    vendorId: string,
    memProducts: any[],
    memOrders: any[],
    memSettlements: any[]
  ) {
    const prodMap = new Map<string, any>();
    const ordMap = new Map<string, any>();
    const stlMap = new Map<string, any>();

    if (mongoose.connection.readyState === 1) {
      const [dbProds, dbOrds, dbSettls] = await Promise.all([
        PlatformProductModel.find({ vendorId }).lean().exec(),
        PlatformOrderModel.find({ vendorId }).lean().exec(),
        PlatformSettlementModel.find({ vendorId }).lean().exec(),
      ]);
      for (const p of dbProds) if (p?.id) prodMap.set(p.id, p);
      for (const o of dbOrds) if (o?.id) ordMap.set(o.id, o);
      for (const s of dbSettls) if (s?.id) stlMap.set(s.id, s);
    }

    // Merge strict vendor-scoped in-memory records
    for (const p of memProducts) if (p.vendorId === vendorId) prodMap.set(p.id, p);
    for (const o of memOrders) if (o.vendorId === vendorId) ordMap.set(o.id, o);
    for (const s of memSettlements) if (s.vendorId === vendorId) stlMap.set(s.id, s);

    return {
      products: Array.from(prodMap.values()),
      orders: Array.from(ordMap.values()),
      settlements: Array.from(stlMap.values()),
    };
  }

  buildOverview(
    vendorId: string,
    products: any[],
    orders: any[],
    settlements: any[],
    filters: Partial<AnalyticsFilterInput>
  ) {
    const ordersGranularity: AnalyticsGranularity = filters.ordersFilter || 'daily';
    const salesGranularity: AnalyticsGranularity = filters.salesFilter || 'daily';

    const ordersWindow = buildBuckets(
      ordersGranularity,
      filters.ordersStartDate,
      filters.ordersEndDate
    );
    const salesWindow = buildBuckets(
      salesGranularity,
      filters.salesStartDate,
      filters.salesEndDate
    );

    const parsedOrders = orders.map((o) => ({
      raw: o,
      ts: new Date(o.createdAt || 0).getTime(),
    }));

    const countInRange = (start: Date, end: Date, validOnly = false) =>
      parsedOrders.filter(
        (x) =>
          x.ts >= start.getTime() &&
          x.ts <= end.getTime() &&
          (!validOnly || isOrderValidForSales(x.raw))
      );

    // 1. Orders Overview Series & Totals
    const currentOrders = countInRange(ordersWindow.currentStart, ordersWindow.currentEnd);
    const prevOrders = countInRange(ordersWindow.prevStart, ordersWindow.prevEnd);

    const ordersSeries = ordersWindow.buckets.map((b) => {
      const curr = countInRange(b.start, b.end);
      const prev = countInRange(b.prevStart, b.prevEnd);
      return {
        key: b.key,
        label: b.label,
        startIso: b.start.toISOString(),
        endIso: b.end.toISOString(),
        orderCount: curr.length,
        prevOrderCount: prev.length,
        growthPct: calcGrowthPct(curr.length, prev.length),
      };
    });

    // 2. Sales Overview Series & Totals
    const currentSalesOrders = countInRange(salesWindow.currentStart, salesWindow.currentEnd, true);
    const prevSalesOrders = countInRange(salesWindow.prevStart, salesWindow.prevEnd, true);
    const currentSalesTotal = currentSalesOrders.reduce((s, x) => s + getOrderRevenue(x.raw), 0);
    const prevSalesTotal = prevSalesOrders.reduce((s, x) => s + getOrderRevenue(x.raw), 0);

    const salesSeries = salesWindow.buckets.map((b) => {
      const curr = countInRange(b.start, b.end, true);
      const prev = countInRange(b.prevStart, b.prevEnd, true);
      const revenue = curr.reduce((s, x) => s + getOrderRevenue(x.raw), 0);
      const prevRevenue = prev.reduce((s, x) => s + getOrderRevenue(x.raw), 0);
      return {
        key: b.key,
        label: b.label,
        startIso: b.start.toISOString(),
        endIso: b.end.toISOString(),
        revenue,
        prevRevenue,
        orderCount: curr.length,
        growthPct: calcGrowthPct(revenue, prevRevenue),
      };
    });

    // 3. Product & Brand Overview (Vendor-isolated)
    const totalProducts = products.length;
    const activeProducts = products.filter(
      (p) => p.isActive !== false && p.approvalStatus === 'APPROVED' && !p.isSuspended
    ).length;
    const inactiveProducts = Math.max(0, totalProducts - activeProducts);

    const brandAgg = new Map<
      string,
      {
        brandName: string;
        brandSlug: string;
        logo: string;
        totalProducts: number;
        activeProducts: number;
        totalSales: number;
        orderIds: Set<string>;
        unitsSold: number;
      }
    >();

    const prodLookup = new Map<string, any>();
    for (const p of products) {
      prodLookup.set(p.id, p);
      if (p.sku) prodLookup.set(p.sku, p);
      if (p.id.startsWith('vp-')) prodLookup.set(p.id.replace(/^vp-/, ''), p);

      const meta = resolveBrandMeta(p.brand);
      const key = meta.name.toLowerCase();
      const entry = brandAgg.get(key) || {
        brandName: meta.name,
        brandSlug: meta.slug,
        logo: meta.logo,
        totalProducts: 0,
        activeProducts: 0,
        totalSales: 0,
        orderIds: new Set<string>(),
        unitsSold: 0,
      };
      entry.totalProducts += 1;
      if (p.isActive !== false && p.approvalStatus === 'APPROVED' && !p.isSuspended) {
        entry.activeProducts += 1;
      }
      brandAgg.set(key, entry);
    }

    // Aggregate Sales by Brand from valid sales orders in the selected Sales period
    for (const x of currentSalesOrders) {
      const ord = x.raw;
      const items = Array.isArray(ord.items) ? ord.items : [];
      if (items.length === 0) continue;

      const orderSub = getOrderRevenue(ord);
      const rawLineSum = items.reduce(
        (s: number, it: any) =>
          s + Number(it.totalPrice ?? it.totalAmount ?? (it.unitPrice || 0) * (it.quantity || 1)),
        0
      );

      for (const it of items) {
        const matchedProd = prodLookup.get(it.productId) || prodLookup.get(it.sku);
        const meta = resolveBrandMeta(it.brand || matchedProd?.brand || 'Other Brand');
        const key = meta.name.toLowerCase();
        const entry = brandAgg.get(key) || {
          brandName: meta.name,
          brandSlug: meta.slug,
          logo: meta.logo,
          totalProducts: 0,
          activeProducts: 0,
          totalSales: 0,
          orderIds: new Set<string>(),
          unitsSold: 0,
        };
        const rawLine = Number(
          it.totalPrice ?? it.totalAmount ?? (it.unitPrice || 0) * (it.quantity || 1)
        );
        const lineRevenue =
          rawLineSum > 0 && orderSub > 0
            ? Math.round((rawLine / rawLineSum) * orderSub)
            : rawLine;

        entry.totalSales += lineRevenue;
        entry.unitsSold += Number(it.quantity || 1);
        if (ord.id || ord.orderNumber) entry.orderIds.add(ord.id || ord.orderNumber);
        brandAgg.set(key, entry);
      }
    }

    const brandList = Array.from(brandAgg.values());
    const totalBrands = brandList.length;
    const activeBrands = brandList.filter((b) => b.activeProducts > 0).length;
    const inactiveBrands = Math.max(0, totalBrands - activeBrands);

    const totalBrandSalesSum = brandList.reduce((s, b) => s + b.totalSales, 0) || 1;
    const allBrandsRanked = brandList
      .map((b) => ({
        brandName: b.brandName,
        brandSlug: b.brandSlug,
        logo: b.logo,
        totalProducts: b.totalProducts,
        activeProducts: b.activeProducts,
        isActive: b.activeProducts > 0,
        totalSales: Math.round(b.totalSales),
        orderCount: b.orderIds.size,
        unitsSold: b.unitsSold,
        contributionPct:
          b.totalSales > 0 ? Number(((b.totalSales / totalBrandSalesSum) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.totalSales - a.totalSales || b.activeProducts - a.activeProducts);

    // 4. Operational Alerts & Settlements
    const lowStockCount = products.filter(
      (p) => Number(p.stockCount ?? 0) <= Number(p.lowStockThreshold ?? 10)
    ).length;
    const pendingSettlement = settlements
      .filter((s) => s.status !== 'PAID')
      .reduce((s, x) => s + Number(x.netPayable ?? x.netAmount ?? 0), 0);

    return {
      vendorId,
      kpis: {
        totalOrders: currentOrders.length,
        prevOrders: prevOrders.length,
        ordersGrowthPct: calcGrowthPct(currentOrders.length, prevOrders.length),
        totalSales: currentSalesTotal,
        prevSales: prevSalesTotal,
        salesGrowthPct: calcGrowthPct(currentSalesTotal, prevSalesTotal),
        totalProducts,
        activeProducts,
        inactiveProducts,
        productsGrowthPct: calcGrowthPct(activeProducts, Math.max(1, totalProducts - inactiveProducts)),
        totalBrands,
        activeBrands,
        inactiveBrands,
        lowStockCount,
        pendingSettlement,
      },
      ordersOverview: {
        filter: ordersGranularity,
        totalOrders: currentOrders.length,
        previousPeriodOrders: prevOrders.length,
        growthPct: calcGrowthPct(currentOrders.length, prevOrders.length),
        series: ordersSeries,
      },
      salesOverview: {
        filter: salesGranularity,
        totalRevenue: currentSalesTotal,
        previousPeriodRevenue: prevSalesTotal,
        growthPct: calcGrowthPct(currentSalesTotal, prevSalesTotal),
        series: salesSeries,
      },
      productBrandOverview: {
        products: {
          total: totalProducts,
          active: activeProducts,
          inactive: inactiveProducts,
          activePct: totalProducts > 0 ? Number(((activeProducts / totalProducts) * 100).toFixed(1)) : 0,
          inactivePct: totalProducts > 0 ? Number(((inactiveProducts / totalProducts) * 100).toFixed(1)) : 0,
        },
        brands: {
          total: totalBrands,
          active: activeBrands,
          inactive: inactiveBrands,
          activePct: totalBrands > 0 ? Number(((activeBrands / totalBrands) * 100).toFixed(1)) : 0,
          inactivePct: totalBrands > 0 ? Number(((inactiveBrands / totalBrands) * 100).toFixed(1)) : 0,
        },
      },
      topBrandsBySales: allBrandsRanked.filter((b) => b.totalSales > 0).slice(0, 4),
      allBrandsRanked,
    };
  }

  getBucketOrders(
    orders: any[],
    startIso: string,
    endIso: string,
    metric: 'orders' | 'sales',
    page = 1,
    limit = 10
  ) {
    const startMs = new Date(startIso).getTime();
    const endMs = new Date(endIso).getTime();
    const matching = orders
      .filter((o) => {
        const t = new Date(o.createdAt || 0).getTime();
        if (t < startMs || t > endMs) return false;
        if (metric === 'sales' && !isOrderValidForSales(o)) return false;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(50, Math.max(1, limit));
    const offset = (safePage - 1) * safeLimit;

    return {
      total: matching.length,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.max(1, Math.ceil(matching.length / safeLimit)),
      totalRevenue: matching
        .filter(isOrderValidForSales)
        .reduce((s, o) => s + getOrderRevenue(o), 0),
      items: matching.slice(offset, offset + safeLimit),
    };
  }
}

export const vendorAnalyticsService = new VendorAnalyticsService();
