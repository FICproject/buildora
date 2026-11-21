import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  RotateCcw,
  Search,
  Zap,
  Check
} from 'lucide-react';
import {
  AvailableCategoryFilter,
  ActiveCategoryFilters
} from '@buildora/constants';

interface CategoryFilterSidebarProps {
  availableFilters: AvailableCategoryFilter[];
  activeFilters: ActiveCategoryFilters;
  onChangeFilters: (updated: ActiveCategoryFilters) => void;
  onResetFilters: () => void;
  totalResultsCount: number;
  className?: string;
  isMobileModal?: boolean;
}

export const CategoryFilterSidebar: React.FC<CategoryFilterSidebarProps> = ({
  availableFilters,
  activeFilters,
  onChangeFilters,
  onResetFilters,
  totalResultsCount,
  className = '',
  isMobileModal = false
}) => {
  // Track open/collapsed state of filter sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    // Top 5 sections open by default
    const initial: Record<string, boolean> = {
      price: true,
      availability: true,
      brand: true,
      subcategory: true
    };
    availableFilters.slice(0, 5).forEach((f) => {
      initial[f.id] = true;
    });
    return initial;
  });

  // Local search filter inside long option lists
  const [optionSearches, setOptionSearches] = useState<Record<string, string>>({});

  // Local custom price range inputs
  const [tempMinPrice, setTempMinPrice] = useState<string>(
    activeFilters.minPrice !== undefined ? String(activeFilters.minPrice) : ''
  );
  const [tempMaxPrice, setTempMaxPrice] = useState<string>(
    activeFilters.maxPrice !== undefined ? String(activeFilters.maxPrice) : ''
  );

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleBrandToggle = (brandValue: string) => {
    const current = activeFilters.brands || [];
    const updated = current.includes(brandValue)
      ? current.filter((b) => b !== brandValue)
      : [...current, brandValue];

    onChangeFilters({
      ...activeFilters,
      brands: updated
    });
  };

  const handleSubcategoryToggle = (subValue: string) => {
    const current = activeFilters.subcategories || [];
    const updated = current.includes(subValue)
      ? current.filter((s) => s !== subValue)
      : [...current, subValue];

    onChangeFilters({
      ...activeFilters,
      subcategories: updated
    });
  };

  const handleSpecToggle = (dimensionId: string, val: string) => {
    const currentSpecs = { ...activeFilters.specifications };
    const currentList = currentSpecs[dimensionId] || [];

    const updatedList = currentList.includes(val)
      ? currentList.filter((v) => v !== val)
      : [...currentList, val];

    if (updatedList.length === 0) {
      delete currentSpecs[dimensionId];
    } else {
      currentSpecs[dimensionId] = updatedList;
    }

    onChangeFilters({
      ...activeFilters,
      specifications: currentSpecs
    });
  };

  const handleApplyPrice = (min?: number, max?: number) => {
    onChangeFilters({
      ...activeFilters,
      minPrice: min,
      maxPrice: max
    });
  };

  const countActiveForDimension = (filterId: string): number => {
    if (filterId === 'brand') return activeFilters.brands?.length || 0;
    if (filterId === 'subcategory') return activeFilters.subcategories?.length || 0;
    if (filterId === 'price') return activeFilters.minPrice || activeFilters.maxPrice ? 1 : 0;
    return activeFilters.specifications?.[filterId]?.length || 0;
  };

  const totalActiveFilters =
    (activeFilters.brands?.length || 0) +
    (activeFilters.subcategories?.length || 0) +
    (activeFilters.inStockOnly ? 1 : 0) +
    (activeFilters.asapOnly ? 1 : 0) +
    (activeFilters.minPrice !== undefined || activeFilters.maxPrice !== undefined ? 1 : 0) +
    Object.values(activeFilters.specifications || {}).reduce((acc, arr) => acc + arr.length, 0);

  return (
    <aside
      className={`space-y-4 text-xs ${
        !isMobileModal ? 'bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs h-fit' : ''
      } ${className}`}
    >
      {/* Sidebar Header */}
      {!isMobileModal && (
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-brand-blue-900" />
            <span className="font-black text-sm text-slate-900">Filters</span>
            {totalActiveFilters > 0 && (
              <span className="w-5 h-5 bg-brand-orange-500 text-white rounded-full flex items-center justify-center font-bold text-[10px]">
                {totalActiveFilters}
              </span>
            )}
          </div>
          {totalActiveFilters > 0 && (
            <button
              type="button"
              onClick={onResetFilters}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear All</span>
            </button>
          )}
        </div>
      )}

      {/* QUICK TOGGLES: AVAILABILITY & SPEED */}
      <div className="space-y-2 pb-3 border-b border-slate-100">
        <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors cursor-pointer select-none">
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-brand-orange-500 fill-current" />
            60-Min Quick Dispatch
          </span>
          <input
            type="checkbox"
            checked={activeFilters.asapOnly}
            onChange={(e) =>
              onChangeFilters({
                ...activeFilters,
                asapOnly: e.target.checked
              })
            }
            className="w-4 h-4 rounded text-brand-orange-500 focus:ring-brand-orange-400 border-slate-300 cursor-pointer"
          />
        </label>

        <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors cursor-pointer select-none">
          <span className="font-bold text-slate-800">In-Stock Available</span>
          <input
            type="checkbox"
            checked={activeFilters.inStockOnly}
            onChange={(e) =>
              onChangeFilters({
                ...activeFilters,
                inStockOnly: e.target.checked
              })
            }
            className="w-4 h-4 rounded text-brand-blue-600 focus:ring-brand-blue-500 border-slate-300 cursor-pointer"
          />
        </label>
      </div>

      {/* DYNAMIC CATEGORY-SPECIFIC FILTER DIMENSIONS */}
      <div className="space-y-3 divide-y divide-slate-100">
        {availableFilters.map((filter) => {
          const isOpen = openSections[filter.id] ?? true;
          const activeCount = countActiveForDimension(filter.id);

          // Handle Price Range
          if (filter.type === 'range') {
            return (
              <div key={filter.id} className="pt-3">
                <button
                  type="button"
                  onClick={() => toggleSection(filter.id)}
                  className="w-full flex items-center justify-between py-1.5 font-bold text-slate-800 hover:text-brand-blue-900 transition-colors cursor-pointer select-none text-left"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{filter.name}</span>
                    {activeCount > 0 && (
                      <span className="px-1.5 py-0.2 bg-brand-orange-100 text-brand-orange-700 text-[10px] font-black rounded-md">
                        Active
                      </span>
                    )}
                  </div>
                  {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                </button>

                {isOpen && (
                  <div className="pt-2 space-y-2.5 animate-in fade-in-0 duration-150">
                    {/* Price Range Presets */}
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { label: 'Under ₹500', min: undefined, max: 500 },
                        { label: '₹500 - ₹2,000', min: 500, max: 2000 },
                        { label: '₹2,000 - ₹5,000', min: 2000, max: 5000 },
                        { label: 'Above ₹5,000', min: 5000, max: undefined }
                      ].map((preset, idx) => {
                        const isPresetActive =
                          activeFilters.minPrice === preset.min && activeFilters.maxPrice === preset.max;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              if (isPresetActive) {
                                handleApplyPrice(undefined, undefined);
                                setTempMinPrice('');
                                setTempMaxPrice('');
                              } else {
                                handleApplyPrice(preset.min, preset.max);
                                setTempMinPrice(preset.min !== undefined ? String(preset.min) : '');
                                setTempMaxPrice(preset.max !== undefined ? String(preset.max) : '');
                              }
                            }}
                            className={`p-1.5 text-[11px] font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                              isPresetActive
                                ? 'bg-brand-blue-900 text-white border-brand-blue-900 shadow-2xs font-bold'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Min - Max Input Boxes */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <div className="relative flex-1">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">₹</span>
                        <input
                          type="number"
                          placeholder="Min"
                          value={tempMinPrice}
                          onChange={(e) => setTempMinPrice(e.target.value)}
                          className="w-full pl-5 pr-1 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-brand-blue-500 bg-white"
                        />
                      </div>
                      <span className="text-slate-400 font-bold">-</span>
                      <div className="relative flex-1">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">₹</span>
                        <input
                          type="number"
                          placeholder="Max"
                          value={tempMaxPrice}
                          onChange={(e) => setTempMaxPrice(e.target.value)}
                          className="w-full pl-5 pr-1 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-brand-blue-500 bg-white"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const min = tempMinPrice ? Number(tempMinPrice) : undefined;
                          const max = tempMaxPrice ? Number(tempMaxPrice) : undefined;
                          handleApplyPrice(min, max);
                        }}
                        className="px-2.5 py-1.5 bg-brand-blue-900 hover:bg-brand-blue-800 text-white rounded-lg font-bold text-xs shadow-2xs cursor-pointer transition-colors"
                      >
                        Go
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          }

          // Checkbox Dimension Options
          const searchVal = optionSearches[filter.id] || '';
          const filteredOptions = filter.options.filter((opt) =>
            opt.label.toLowerCase().includes(searchVal.toLowerCase().trim())
          );

          return (
            <div key={filter.id} className="pt-3">
              <button
                type="button"
                onClick={() => toggleSection(filter.id)}
                className="w-full flex items-center justify-between py-1.5 font-bold text-slate-800 hover:text-brand-blue-900 transition-colors cursor-pointer select-none text-left"
              >
                <div className="flex items-center gap-1.5">
                  <span>{filter.name}</span>
                  {activeCount > 0 && (
                    <span className="w-4 h-4 bg-brand-blue-900 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                      {activeCount}
                    </span>
                  )}
                </div>
                {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
              </button>

              {isOpen && (
                <div className="pt-2 space-y-2 animate-in fade-in-0 duration-150">
                  {/* Option search if more than 5 options */}
                  {filter.options.length > 5 && (
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        placeholder={`Search ${filter.name}...`}
                        value={searchVal}
                        onChange={(e) =>
                          setOptionSearches((prev) => ({
                            ...prev,
                            [filter.id]: e.target.value
                          }))
                        }
                        className="w-full pl-6 pr-2 py-1 text-[11px] rounded-lg border border-slate-200 focus:outline-none focus:border-brand-blue-500 bg-slate-50/50"
                      />
                    </div>
                  )}

                  {/* Options List */}
                  <div className="max-h-52 overflow-y-auto space-y-1 pr-1 no-scrollbar">
                    {filteredOptions.length === 0 ? (
                      <div className="py-2 text-[11px] text-slate-400 text-center">
                        No matching options found
                      </div>
                    ) : (
                      filteredOptions.map((opt) => {
                        let isSelected = false;
                        if (filter.id === 'brand') {
                          isSelected = activeFilters.brands?.includes(opt.value) || false;
                        } else if (filter.id === 'subcategory') {
                          isSelected = activeFilters.subcategories?.includes(opt.value) || false;
                        } else {
                          isSelected =
                            activeFilters.specifications?.[filter.id]?.includes(opt.value) || false;
                        }

                        return (
                          <label
                            key={opt.value}
                            className={`flex items-center justify-between p-1.5 rounded-lg transition-colors cursor-pointer select-none group ${
                              isSelected ? 'bg-brand-blue-50/80 font-bold text-brand-blue-900' : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                  if (filter.id === 'brand') {
                                    handleBrandToggle(opt.value);
                                  } else if (filter.id === 'subcategory') {
                                    handleSubcategoryToggle(opt.value);
                                  } else {
                                    handleSpecToggle(filter.id, opt.value);
                                  }
                                }}
                                className="w-3.5 h-3.5 rounded text-brand-blue-900 focus:ring-brand-blue-700 border-slate-300 cursor-pointer flex-shrink-0"
                              />
                              <span className="truncate text-xs">{opt.label}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-semibold flex-shrink-0">
                              ({opt.count})
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Summary & Clear in Sidebar */}
      {!isMobileModal && (
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Results: <strong>{totalResultsCount}</strong> items</span>
          {totalActiveFilters > 0 && (
            <button
              type="button"
              onClick={onResetFilters}
              className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
            >
              Reset All
            </button>
          )}
        </div>
      )}
    </aside>
  );
};
