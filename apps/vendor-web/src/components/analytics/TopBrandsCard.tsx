import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award } from 'lucide-react';
import { Card, CardContent, EmptyState } from '../common';

export interface TopBrandSalesRow {
  brandName: string;
  brandSlug: string;
  logo?: string;
  totalSales: number;
  contributionPct: number;
  orderCount: number;
}

interface TopBrandsCardProps {
  loading?: boolean;
  brands: TopBrandSalesRow[];
  onBrandClick: (brandName: string) => void;
}

export const TopBrandsCard: React.FC<TopBrandsCardProps> = ({
  loading,
  brands,
  onBrandClick,
}) => {
  const maxSales = Math.max(1, ...brands.map((b) => b.totalSales));

  return (
    <Card className="flex flex-col">
      <div className="px-5 py-4 border-b border-[#E7E5E4] flex items-center justify-between gap-2">
        <h3 className="text-base font-bold text-[#943D24]">Top Brands by Sales</h3>
        <Link
          to="/reports?tab=BRANDS"
          className="text-xs font-medium text-[#943D24] hover:underline inline-flex items-center gap-1"
        >
          View All <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <CardContent className="p-5 flex-1">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 bg-[#FAF7F5] rounded-lg" />
            ))}
          </div>
        ) : brands.length === 0 ? (
          <EmptyState
            icon={<Award className="w-5 h-5" />}
            title="No brand sales yet"
            description="Brand contribution breakdown appears once orders are placed."
          />
        ) : (
          <div className="space-y-4">
            {brands.map((brand) => {
              const barPct = Math.max(8, Math.round((brand.totalSales / maxSales) * 100));
              return (
                <button
                  key={brand.brandName}
                  type="button"
                  onClick={() => onBrandClick(brand.brandName)}
                  className="w-full text-left flex items-center gap-3 group cursor-pointer"
                >
                  {/* Brand Logo */}
                  <div className="w-8 h-8 rounded-lg border border-[#E7E5E4] bg-[#FAF7F5] overflow-hidden shrink-0 flex items-center justify-center text-[11px] font-bold text-[#943D24]">
                    {brand.logo ? (
                      <img
                        src={brand.logo}
                        alt={brand.brandName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      brand.brandName.slice(0, 2).toUpperCase()
                    )}
                  </div>

                  {/* Name + Amount + Progress */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-[#292524] group-hover:text-[#943D24] truncate">
                        {brand.brandName}
                      </span>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="font-bold text-[#292524]">
                          ₹{brand.totalSales.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[#78716C] w-11 text-right">
                          {brand.contributionPct}%
                        </span>
                      </div>
                    </div>
                    <div className="mt-1.5 h-2 w-full rounded-full bg-[#F2EDE9] overflow-hidden">
                      <div
                        style={{ width: `${barPct}%` }}
                        className="h-full rounded-full bg-[#943D24] group-hover:bg-[#7A311C] transition-all duration-300"
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
