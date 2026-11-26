import React, { useState } from 'react';
import { Package, Tag, AlertCircle } from 'lucide-react';
import { Card, CardContent, EmptyState } from '../common';

interface DonutSegment {
  label: string;
  count: number;
  pct: number;
  color: string;
  onClick: () => void;
}

interface SingleDonutProps {
  centerTitle: string;
  centerCount: number;
  icon: React.ReactNode;
  segments: DonutSegment[];
}

const InteractiveDonut: React.FC<SingleDonutProps> = ({
  centerTitle,
  centerCount,
  icon,
  segments,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const size = 152;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const total = segments.reduce((s, x) => s + x.count, 0);
  let cumulative = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative w-[152px] h-[152px] shrink-0">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#F2EDE9"
            strokeWidth={strokeWidth}
          />
          {total > 0 &&
            segments.map((seg, idx) => {
              const frac = seg.count / total;
              const dashLen = frac * circumference;
              const dashOffset = -cumulative * circumference;
              cumulative += frac;
              if (seg.count <= 0) return null;
              return (
                <circle
                  key={seg.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={hoveredIdx === idx ? strokeWidth + 3 : strokeWidth}
                  strokeDasharray={`${dashLen} ${circumference}`}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="butt"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={seg.onClick}
                  className="cursor-pointer transition-all duration-200"
                />
              );
            })}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
          <div className="text-[#78716C] mb-0.5">{icon}</div>
          <span className="text-[11px] text-[#78716C] leading-tight">{centerTitle}</span>
          <span className="text-2xl font-bold text-[#292524] leading-tight mt-0.5">
            {centerCount.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-3 flex-1 min-w-[140px]">
        {segments.map((seg, idx) => (
          <button
            key={seg.label}
            type="button"
            onClick={seg.onClick}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            className={`w-full text-left flex items-start gap-2.5 p-2 rounded-lg transition-colors cursor-pointer ${
              hoveredIdx === idx ? 'bg-[#FAF7F5]' : 'hover:bg-[#FAF7F5]'
            }`}
          >
            <span
              style={{ backgroundColor: seg.color }}
              className="w-3.5 h-3.5 rounded shrink-0 mt-0.5"
            />
            <div>
              <div className="text-xs font-semibold text-[#292524]">{seg.label}</div>
              <div className="text-sm font-bold text-[#292524]">
                {seg.count.toLocaleString('en-IN')}{' '}
                <span className="text-xs font-normal text-[#78716C]">({seg.pct}%)</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

interface ProductBrandOverviewCardProps {
  loading?: boolean;
  error?: string | null;
  hasData?: boolean;
  products: { total: number; active: number; inactive: number; activePct: number; inactivePct: number };
  brands: { total: number; active: number; inactive: number; activePct: number; inactivePct: number };
  onSelectProductsFilter: (status: 'ACTIVE' | 'INACTIVE') => void;
  onSelectBrandsFilter: (status: 'ACTIVE' | 'INACTIVE') => void;
  onRetry?: () => void;
}

export const ProductBrandOverviewCard: React.FC<ProductBrandOverviewCardProps> = ({
  loading,
  error,
  hasData = true,
  products,
  brands,
  onSelectProductsFilter,
  onSelectBrandsFilter,
  onRetry,
}) => {
  return (
    <Card>
      <div className="px-5 py-4 border-b border-[#E7E5E4]">
        <h3 className="text-base font-bold text-[#943D24]">Product &amp; Brand Overview</h3>
      </div>
      <CardContent className="p-5">
        {loading ? (
          <div className="h-40 bg-[#FAF7F5] rounded-xl animate-pulse" />
        ) : error && !hasData ? (
          <EmptyState
            icon={<AlertCircle className="w-5 h-5 text-red-500" />}
            title="Unable to load product & brand overview"
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <InteractiveDonut
              centerTitle="Total Products"
              centerCount={products.total}
              icon={<Package className="w-4 h-4 text-[#943D24]" />}
              segments={[
                {
                  label: 'Active Products',
                  count: products.active,
                  pct: products.activePct,
                  color: '#943D24',
                  onClick: () => onSelectProductsFilter('ACTIVE'),
                },
                {
                  label: 'Inactive Products',
                  count: products.inactive,
                  pct: products.inactivePct,
                  color: '#F6C453',
                  onClick: () => onSelectProductsFilter('INACTIVE'),
                },
              ]}
            />

            <InteractiveDonut
              centerTitle="Total Brands"
              centerCount={brands.total}
              icon={<Tag className="w-4 h-4 text-[#943D24]" />}
              segments={[
                {
                  label: 'Active Brands',
                  count: brands.active,
                  pct: brands.activePct,
                  color: '#E59E22',
                  onClick: () => onSelectBrandsFilter('ACTIVE'),
                },
                {
                  label: 'Inactive Brands',
                  count: brands.inactive,
                  pct: brands.inactivePct,
                  color: '#F6D7B8',
                  onClick: () => onSelectBrandsFilter('INACTIVE'),
                },
              ]}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
