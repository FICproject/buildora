import React, { useState } from 'react';
import { Calendar, TrendingDown, TrendingUp, BarChart2 } from 'lucide-react';
import { Card, CardContent, EmptyState } from '../common';

export type Granularity = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface OrderSeriesBucket {
  key: string;
  label: string;
  startIso: string;
  endIso: string;
  orderCount: number;
  prevOrderCount: number;
  growthPct: number | null;
}

interface OrdersOverviewCardProps {
  loading?: boolean;
  error?: string | null;
  hasData?: boolean;
  totalOrders: number;
  previousPeriodOrders: number;
  growthPct: number | null;
  series: OrderSeriesBucket[];
  granularity: Granularity;
  onGranularityChange: (g: Granularity) => void;
  startDate: string;
  endDate: string;
  onDateRangeChange: (start: string, end: string) => void;
  onBarClick: (bucket: OrderSeriesBucket) => void;
  onRetry?: () => void;
}

export const OrdersOverviewCard: React.FC<OrdersOverviewCardProps> = ({
  loading,
  error,
  hasData = true,
  totalOrders,
  previousPeriodOrders,
  growthPct,
  series,
  granularity,
  onGranularityChange,
  startDate,
  endDate,
  onDateRangeChange,
  onBarClick,
  onRetry,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [showCustomDates, setShowCustomDates] = useState(false);

  const maxCount = Math.max(4, ...series.map((s) => s.orderCount));
  const peakIdx = series.reduce(
    (best, cur, idx, arr) => (cur.orderCount > (arr[best]?.orderCount ?? -1) ? idx : best),
    0
  );
  const yTicks = [maxCount, Math.round(maxCount * 0.75), Math.round(maxCount * 0.5), Math.round(maxCount * 0.25), 0];

  const isPositive = (growthPct ?? 0) >= 0;

  return (
    <Card className="flex flex-col">
      <div className="px-5 py-4 border-b border-[#E7E5E4] flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="text-base font-bold text-[#943D24]">Orders Overview</h3>
            {hasData && !loading && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                }`}
              >
                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {isPositive ? '+' : ''}
                {growthPct ?? 0}% vs prev ({previousPeriodOrders})
              </span>
            )}
          </div>
          <p className="text-xs text-[#78716C] mt-0.5">
            Total orders received in selected period:{' '}
            <strong className="text-[#292524]">
              {loading ? '—' : hasData ? totalOrders.toLocaleString('en-IN') : 'Unavailable'}
            </strong>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            aria-label="Orders period filter"
            value={showCustomDates ? 'custom' : granularity}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'custom') {
                setShowCustomDates(true);
              } else {
                setShowCustomDates(false);
                onDateRangeChange('', '');
                onGranularityChange(val as Granularity);
              }
            }}
            className="px-3 py-1.5 rounded-lg border border-[#E7E5E4] bg-white text-xs font-medium text-[#292524] focus:outline-none focus:border-[#943D24] cursor-pointer"
          >
            <option value="daily">Daily (Last 7 Days)</option>
            <option value="weekly">Weekly (8 Weeks)</option>
            <option value="monthly">Monthly (6 Months)</option>
            <option value="yearly">Yearly</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
      </div>

      {showCustomDates && (
        <div className="px-5 py-2.5 bg-[#FAF7F5] border-b border-[#E7E5E4] flex flex-wrap items-center gap-2 text-xs">
          <Calendar className="w-3.5 h-3.5 text-[#943D24]" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => onDateRangeChange(e.target.value, endDate)}
            className="px-2 py-1 rounded border border-[#E7E5E4] bg-white text-xs"
          />
          <span className="text-[#78716C]">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onDateRangeChange(startDate, e.target.value)}
            className="px-2 py-1 rounded border border-[#E7E5E4] bg-white text-xs"
          />
        </div>
      )}

      <CardContent className="p-5 flex-1">
        {loading ? (
          <div className="h-56 flex items-end gap-4 animate-pulse pt-6">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                style={{ height: `${35 + (i % 4) * 15}%` }}
                className="flex-1 bg-[#F2EDE9] rounded-t-lg"
              />
            ))}
          </div>
        ) : error && !hasData ? (
          <EmptyState
            icon={<BarChart2 className="w-5 h-5 text-red-500" />}
            title="Unable to load orders overview"
            description={error}
            action={
              onRetry ? (
                <button
                  type="button"
                  onClick={onRetry}
                  className="px-3 py-1.5 rounded-lg bg-[#943D24] text-white text-xs font-semibold cursor-pointer"
                >
                  Retry
                </button>
              ) : undefined
            }
          />
        ) : series.length === 0 ? (
          <EmptyState
            icon={<BarChart2 className="w-5 h-5" />}
            title="No orders in this range"
            description="Orders for the selected timeframe will appear here."
          />
        ) : (
          <div className="relative flex gap-2 sm:gap-3 h-56 pt-4">
            {/* Y-axis ticks */}
            <div className="flex flex-col justify-between text-[11px] text-[#78716C] pr-1 pb-6 select-none shrink-0">
              {yTicks.map((t, i) => (
                <span key={i} className="leading-none text-right min-w-[26px]">
                  {t}
                </span>
              ))}
            </div>

            {/* Scrollable Bars canvas */}
            <div className="flex-1 overflow-x-auto scrollbar-none pb-6">
              <div
                style={{ minWidth: series.length > 6 ? `${series.length * 46}px` : undefined }}
                className="relative h-full flex items-end gap-2 sm:gap-3 border-b border-[#E7E5E4]"
              >
              {/* Subtle horizontal gridlines */}
              <div className="absolute inset-0 bottom-6 flex flex-col justify-between pointer-events-none">
                {yTicks.map((_, i) => (
                  <div key={i} className="border-t border-dashed border-[#E7E5E4]/70 w-full" />
                ))}
              </div>

              {series.map((bucket, idx) => {
                const heightPct =
                  bucket.orderCount > 0 ? Math.max(8, Math.round((bucket.orderCount / maxCount) * 100)) : 3;
                const isPeak = idx === peakIdx && bucket.orderCount > 0;
                const isHovered = hoveredIdx === idx;

                return (
                  <div
                    key={bucket.key}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    onClick={() => onBarClick(bucket)}
                    className="relative flex-1 h-full flex flex-col items-center justify-end cursor-pointer group z-10"
                  >
                    {/* Hover tooltip */}
                    {isHovered && (
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#292524] text-white text-[11px] px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap z-30 pointer-events-none">
                        <div className="font-bold">
                          {bucket.label}: {bucket.orderCount} order{bucket.orderCount === 1 ? '' : 's'}
                        </div>
                        <div className="text-[10px] text-[#F6C453]">
                          Prev: {bucket.prevOrderCount} ({(bucket.growthPct ?? 0) >= 0 ? '+' : ''}
                          {bucket.growthPct ?? 0}%) • Click to view
                        </div>
                      </div>
                    )}

                    <span className="text-[11px] font-bold text-[#292524] mb-1">
                      {bucket.orderCount}
                    </span>

                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full max-w-[42px] rounded-t-md transition-all duration-200 ${
                        isHovered || isPeak
                          ? 'bg-[#F6C453] shadow-sm'
                          : 'bg-[#943D24] group-hover:bg-[#7A311C]'
                      }`}
                    />

                    <span className="absolute -bottom-6 text-[11px] text-[#78716C] truncate max-w-full text-center">
                      {bucket.label}
                    </span>
                  </div>
                );
              })}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
