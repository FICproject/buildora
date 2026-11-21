import React, { useEffect } from 'react';
import { X, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { AvailableCategoryFilter, ActiveCategoryFilters } from '@buildora/constants';
import { CategoryFilterSidebar } from './CategoryFilterSidebar';

interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  availableFilters: AvailableCategoryFilter[];
  activeFilters: ActiveCategoryFilters;
  onChangeFilters: (updated: ActiveCategoryFilters) => void;
  onResetFilters: () => void;
  totalResultsCount: number;
}

export const MobileFilterDrawer: React.FC<MobileFilterDrawerProps> = ({
  isOpen,
  onClose,
  availableFilters,
  activeFilters,
  onChangeFilters,
  onResetFilters,
  totalResultsCount
}) => {
  // Prevent background scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Calculate active filter count
  const activeCount =
    (activeFilters.brands?.length || 0) +
    (activeFilters.subcategories?.length || 0) +
    (activeFilters.inStockOnly ? 1 : 0) +
    (activeFilters.asapOnly ? 1 : 0) +
    (activeFilters.minPrice !== undefined || activeFilters.maxPrice !== undefined ? 1 : 0) +
    Object.values(activeFilters.specifications || {}).reduce((acc, v) => acc + (v ? v.length : 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <div className="relative z-10 w-full max-w-sm bg-white flex flex-col h-full shadow-2xl animate-in slide-in-from-left duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-brand-blue-900" />
            <h3 className="font-bold text-slate-900 text-base">Filter Materials</h3>
            {activeCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-brand-orange-500 text-white">
                {activeCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close filters drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Filters Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <CategoryFilterSidebar
            availableFilters={availableFilters}
            activeFilters={activeFilters}
            onChangeFilters={onChangeFilters}
            onResetFilters={onResetFilters}
            totalResultsCount={totalResultsCount}
            isMobileModal={true}
          />
        </div>

        {/* Sticky Footer CTA */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center gap-3 shadow-lg">
          <button
            type="button"
            onClick={onResetFilters}
            disabled={activeCount === 0}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
              activeCount > 0
                ? 'border-slate-300 text-slate-700 hover:bg-slate-50'
                : 'border-slate-200 text-slate-300 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear All
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-brand-blue-900 text-white hover:bg-brand-blue-950 transition-colors shadow-md flex items-center justify-center"
          >
            Show ({totalResultsCount}) Materials
          </button>
        </div>
      </div>
    </div>
  );
};
