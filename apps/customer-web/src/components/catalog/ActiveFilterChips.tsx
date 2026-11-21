import React from 'react';
import { X, RotateCcw } from 'lucide-react';
import { ActiveCategoryFilters, AvailableCategoryFilter } from '@buildora/constants';

interface ActiveFilterChipsProps {
  activeFilters: ActiveCategoryFilters;
  availableFilters?: AvailableCategoryFilter[];
  onRemoveBrand: (brand: string) => void;
  onRemoveSubcategory: (sub: string) => void;
  onRemoveSpec: (dimId: string, val: string) => void;
  onRemovePrice: () => void;
  onRemoveInStock: () => void;
  onRemoveAsap: () => void;
  onClearAll: () => void;
  className?: string;
}

export const ActiveFilterChips: React.FC<ActiveFilterChipsProps> = ({
  activeFilters,
  availableFilters = [],
  onRemoveBrand,
  onRemoveSubcategory,
  onRemoveSpec,
  onRemovePrice,
  onRemoveInStock,
  onRemoveAsap,
  onClearAll,
  className = ''
}) => {
  // Map dimension id to dimension name
  const dimNameMap = React.useMemo(() => {
    const map = new Map<string, string>();
    availableFilters.forEach((f) => map.set(f.id, f.name));
    return map;
  }, [availableFilters]);

  const hasBrands = (activeFilters.brands || []).length > 0;
  const hasSubcategories = (activeFilters.subcategories || []).length > 0;
  const hasPrice = activeFilters.minPrice !== undefined || activeFilters.maxPrice !== undefined;
  const hasInStock = !!activeFilters.inStockOnly;
  const hasAsap = !!activeFilters.asapOnly;

  const specEntries = Object.entries(activeFilters.specifications || {}).filter(
    ([, values]) => values && values.length > 0
  );
  const hasSpecs = specEntries.length > 0;

  const hasAnyFilter =
    hasBrands ||
    hasSubcategories ||
    hasPrice ||
    hasInStock ||
    hasAsap ||
    hasSpecs;

  if (!hasAnyFilter) {
    return null;
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 py-2 ${className}`}>
      <span className="text-xs font-semibold text-slate-500 mr-1">Active Filters:</span>

      {/* ASAP 60-min toggle chip */}
      {hasAsap && (
        <button
          onClick={onRemoveAsap}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-orange-50 text-brand-orange-700 border border-brand-orange-200 hover:bg-brand-orange-100 transition-colors"
          title="Remove 60-Min Dispatch filter"
        >
          <span>⚡ 60-Min Dispatch</span>
          <X className="w-3.5 h-3.5 text-brand-orange-600" />
        </button>
      )}

      {/* In Stock toggle chip */}
      {hasInStock && (
        <button
          onClick={onRemoveInStock}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
          title="Remove In-Stock filter"
        >
          <span>In-Stock Only</span>
          <X className="w-3.5 h-3.5 text-emerald-600" />
        </button>
      )}

      {/* Price Range chip */}
      {hasPrice && (
        <button
          onClick={onRemovePrice}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors"
          title="Remove Price filter"
        >
          <span>
            Price: {activeFilters.minPrice ? `₹${activeFilters.minPrice}` : '₹0'} -{' '}
            {activeFilters.maxPrice ? `₹${activeFilters.maxPrice}` : 'Above'}
          </span>
          <X className="w-3.5 h-3.5 text-slate-500" />
        </button>
      )}

      {/* Subcategory chips */}
      {activeFilters.subcategories?.map((sub) => (
        <button
          key={`sub-${sub}`}
          onClick={() => onRemoveSubcategory(sub)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-blue-50 text-brand-blue-900 border border-brand-blue-200 hover:bg-brand-blue-100 transition-colors"
          title={`Remove subcategory ${sub}`}
        >
          <span>Sub: {sub}</span>
          <X className="w-3.5 h-3.5 text-brand-blue-700" />
        </button>
      ))}

      {/* Brand chips */}
      {activeFilters.brands?.map((brand) => (
        <button
          key={`brand-${brand}`}
          onClick={() => onRemoveBrand(brand)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-blue-50 text-brand-blue-900 border border-brand-blue-200 hover:bg-brand-blue-100 transition-colors"
          title={`Remove brand ${brand}`}
        >
          <span>Brand: {brand}</span>
          <X className="w-3.5 h-3.5 text-brand-blue-700" />
        </button>
      ))}

      {/* Specification chips */}
      {specEntries.flatMap(([dimId, values]) =>
        values.map((val) => {
          const dimLabel = dimNameMap.get(dimId) || dimId;
          return (
            <button
              key={`spec-${dimId}-${val}`}
              onClick={() => onRemoveSpec(dimId, val)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200 transition-colors"
              title={`Remove ${dimLabel}: ${val}`}
            >
              <span>
                {dimLabel}: {val}
              </span>
              <X className="w-3.5 h-3.5 text-slate-500" />
            </button>
          );
        })
      )}

      {/* Clear All button */}
      <button
        onClick={onClearAll}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-red-600 hover:bg-red-50 transition-colors ml-1"
      >
        <RotateCcw className="w-3 h-3" />
        <span>Clear All</span>
      </button>
    </div>
  );
};
