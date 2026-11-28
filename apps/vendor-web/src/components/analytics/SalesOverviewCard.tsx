import React, { useState } from 'react';
import { Calendar, IndianRupee, TrendingDown, TrendingUp } from 'lucide-react';
import { Card, CardContent, EmptyState } from '../common';
import type { Granularity } from './OrdersOverviewCard';

export interface SalesSeriesBucket {
  key: string;
  label: string;
  startIso: string;
  endIso: string;
  revenue: number;
  prevRevenue: number;
  orderCount: number;
  growthPct: number | null;
}

interface SalesOverviewCardProps {
  loading?: boolean;
  error?: string | null;
  hasData?: boolean;
  totalRevenue: number;
  previousPeriodRevenue: number;
  growthPct: number | null;
  series: SalesSeriesBucket[];
  granularity: Granularity;
  onGranularityChange: (g: Granularity) => void;
  startDate: string;
  endDate: string;
  onDateRangeChange: (start: string, end: string) => void;
  onPointClick: (bucket: SalesSeriesBucket) => void;
  onRetry?: () => void;
}

function formatAxisInr(val: number): string {
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${Math.round(val / 1000)}K`;
  return `₹${val}`;
}

export const SalesOverviewCard: React.FC<SalesOverviewCardProps> = ({
  loading,
  error,
  hasData = true,
  totalRevenue,
  previousPeriodRevenue,
  growthPct,
  series,
  granularity,
  onGranularityChange,
  startDate,
  endDate,
  onDateRangeChange,
  onPointClick,
  onRetry,
}) => {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [showCustomDates, setShowCustomDates] = useState(false);

  const isPositive = (growthPct ?? 0) >= 0;
  const maxRev = Math.max(1000, ...series.map((s) => s.revenue));
  const ceilMax = Math.ceil(maxRev / 1000) * 1000;
  const yTicks = [ceilMax, Math.round(ceilMax * 0.75), Math.round(ceilMax * 0.5), Math.round(ceilMax * 0.25), 0];

  const svgW = 540;
  const svgH = 190;
  const padL = 8;
  const padR = 14;
  const padT = 18;
  const padB = 12;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  const coords = series.map((pt, i) => {
    const x =
      series.length <= 1
        ? padL + plotW / 2
        : padL + (i / (series.length - 1)) * plotW;
    const y = padT + plotH - (pt.revenue / ceilMax) * plotH;
    return { x, y, pt };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
  const areaPath =
    coords.length > 0
      ? `${linePath} L ${coords[coords.length - 1].x} ${padT + plotH} L ${coords[0].x} ${padT + plotH} Z`
      : '';

  const highlightedIdx = activeIdx !== null ? activeIdx : Math.max(0, coords.length - 1);
  const highlighted = coords[highlightedIdx];

  return (
    <Card className="flex flex-col">
      <div className="px-5 py-4 border-b border-[#E7E5E4] flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="text-base font-bold text-[#943D24]">Sales Overview</h3>
            {hasData && !loading && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                }`}
              >
                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {isPositive ? '+' : ''}
                {growthPct ?? 0}% vs prev (₹{previousPeriodRevenue.toLocaleString('en-IN')})
              </span>
            )}
          </div>
          <p className="text-xs text-[#78716C] mt-0.5">
            Revenue trend for selected period:{' '}
            <strong className="text-[#292524]">
              {loading ? '—' : hasData ? `₹${totalRevenue.toLocaleString('en-IN')}` : 'Unavailable'}
            </strong>
          </p>
        </div>

        <select
          aria-label="Sales period filter"
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
          <div className="h-56 rounded-xl bg-[#FAF7F5] animate-pulse flex items-center justify-center text-xs text-[#78716C]">
            Loading revenue trend...
          </div>
        ) : error && !hasData ? (
          <EmptyState
            icon={<IndianRupee className="w-5 h-5 text-red-500" />}
            title="Unable to load sales overview"
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
            icon={<IndianRupee className="w-5 h-5" />}
            title="No sales revenue in this range"
            description="Completed or active non-cancelled orders will populate the revenue curve."
          />
        ) : (
          <div className="relative flex gap-2.5 h-56 pt-2">
            {/* Y Axis labels */}
            <div className="flex flex-col justify-between text-[11px] text-[#78716C] pb-6 select-none min-w-[44px] text-right">
              {yTicks.map((t, i) => (
                <span key={i} className="leading-none">
                  {formatAxisInr(t)}
                </span>
              ))}
            </div>

            {/* Area Chart SVG + X labels */}
            <div className="flex-1 overflow-x-auto scrollbar-none min-w-0">
              <div
                style={{ minWidth: series.length > 6 ? `${series.length * 52}px` : undefined }}
                className="relative h-full flex flex-col"
              >
              {/* Callout badge over active/latest point */}
              {highlighted && (
                <div
                  style={{
                    left: `${Math.min(82, Math.max(18, (highlighted.x / svgW) * 100))}%`,
                  }}
                  className="absolute -top-2 -translate-x-1/2 bg-[#943D24] text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-md whitespace-nowrap z-20 pointer-events-none"
                >
                  ₹{highlighted.pt.revenue.toLocaleString('en-IN')}
                  <span className="ml-1.5 font-normal text-[#F6C453]">
                    ({highlighted.pt.label}{' '}
                    {(highlighted.pt.growthPct ?? 0) >= 0 ? '+' : ''}
                    {highlighted.pt.growthPct ?? 0}%)
                  </span>
                </div>
              )}

              <svg
                viewBox={`0 0 ${svgW} ${svgH}`}
                preserveAspectRatio="none"
                className="w-full h-full overflow-visible"
              >
                <defs>
                  <linearGradient id="salesAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F6C453" stopOpacity="0.48" />
                    <stop offset="100%" stopColor="#F6C453" stopOpacity="0.03" />
                  </linearGradient>
                </defs>

                {/* Horizontal gridlines */}
                {yTicks.map((_, idx) => {
                  const yPos = padT + (idx / (yTicks.length - 1)) * plotH;
                  return (
                    <line
                      key={idx}
                      x1={padL}
                      x2={svgW - padR}
                      y1={yPos}
                      y2={yPos}
                      stroke="#E7E5E4"
                      strokeDasharray="3 3"
                      strokeWidth="1"
                    />
                  );
                })}

                {areaPath && <path d={areaPath} fill="url(#salesAreaGrad)" />}
                {linePath && (
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#E59E22"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {coords.map((c, idx) => {
                  const isActive = idx === highlightedIdx;
                  return (
                    <g
                      key={c.pt.key}
                      className="cursor-pointer"
                      onMouseEnter={() => setActiveIdx(idx)}
                      onMouseLeave={() => setActiveIdx(null)}
                      onClick={() => onPointClick(c.pt)}
                    >
                      <circle cx={c.x} cy={c.y} r="14" fill="transparent" />
                      <circle
                        cx={c.x}
                        cy={c.y}
                        r={isActive ? 5.5 : 4}
                        fill="#FFFFFF"
                        stroke={isActive ? '#943D24' : '#E59E22'}
                        strokeWidth={isActive ? 3 : 2.5}
                      />
                    </g>
                  );
                })}
              </svg>

              {/* X Axis labels */}
              <div className="flex justify-between text-[11px] text-[#78716C] pt-1 px-1">
                {series.map((s, idx) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => onPointClick(s)}
                    className={`truncate cursor-pointer transition-colors ${
                      idx === highlightedIdx ? 'font-bold text-[#943D24]' : 'hover:text-[#292524]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
