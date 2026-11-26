import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  Search,
  X,
  RotateCcw,
  Zap,
  Check,
  SlidersHorizontal,
  ArrowUpDown
} from 'lucide-react';
import {
  AvailableCategoryFilter,
  ActiveCategoryFilters
} from '@buildora/constants';

export interface SortOption {
  value: string;
  label: string;
}

interface CategoryHorizontalFilterBarProps {
  availableFilters: AvailableCategoryFilter[];
  activeFilters: ActiveCategoryFilters;
  onChangeFilters: (updated: ActiveCategoryFilters) => void;
  onResetFilters: () => void;
  totalResultsCount: number;
  sortOptions?: SortOption[];
  className?: string;
}

export const CategoryHorizontalFilterBar: React.FC<CategoryHorizontalFilterBarProps> = ({
  availableFilters,
  activeFilters,
  onChangeFilters,
  onResetFilters,
  totalResultsCount,
  sortOptions,
  className = ''
}) => {
  // Track which dropdown popover is currently open
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Local search query per filter dimension
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});

  // Local price inputs
  const [tempMinPrice, setTempMinPrice] = useState<string>(
    activeFilters.minPrice !== undefined ? String(activeFilters.minPrice) : ''
  );
  const [tempMaxPrice, setTempMaxPrice] = useState<string>(
    activeFilters.maxPrice !== undefined ? String(activeFilters.maxPrice) : ''
  );

  // Sync temp price when activeFilters change externally
  useEffect(() => {
    setTempMinPrice(activeFilters.minPrice !== undefined ? String(activeFilters.minPrice) : '');
    setTempMaxPrice(activeFilters.maxPrice !== undefined ? String(activeFilters.maxPrice) : '');
  }, [activeFilters.minPrice, activeFilters.maxPrice]);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenDropdownId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleDropdown = (id: string) => {
    setOpenDropdownId((prev) => (prev === id ? null : id));
  };

  const handleCategoryToggle = (catValue: string, selectionMode?: 'SINGLE' | 'MULTI') => {
    const current = activeFilters.categories || [];
    const updated = current.includes(catValue)
      ? current.filter((c) => c !== catValue)
      : selectionMode === 'SINGLE'
      ? [catValue]
      : [...current, catValue];

    onChangeFilters({
      ...activeFilters,
      categories: updated
    });
  };

  const handleChildCategoryToggle = (childValue: string, selectionMode?: 'SINGLE' | 'MULTI') => {
    const current = activeFilters.childCategories || [];
    const updated = current.includes(childValue)
      ? current.filter((c) => c !== childValue)
      : selectionMode === 'SINGLE'
      ? [childValue]
      : [...current, childValue];

    onChangeFilters({
      ...activeFilters,
      childCategories: updated
    });
  };

  const handleBrandToggle = (brandValue: string, selectionMode?: 'SINGLE' | 'MULTI') => {
    const current = activeFilters.brands || [];
    const updated = current.includes(brandValue)
      ? current.filter((b) => b !== brandValue)
      : selectionMode === 'SINGLE'
      ? [brandValue]
      : [...current, brandValue];

    onChangeFilters({
      ...activeFilters,
      brands: updated
    });
  };

  const handleSubcategoryToggle = (subValue: string, selectionMode?: 'SINGLE' | 'MULTI') => {
    const current = activeFilters.subcategories || [];
    const updated = current.includes(subValue)
      ? current.filter((s) => s !== subValue)
      : selectionMode === 'SINGLE'
      ? [subValue]
      : [...current, subValue];

    onChangeFilters({
      ...activeFilters,
      subcategories: updated
    });
  };

  const handleSpecToggle = (dimensionId: string, val: string, selectionMode?: 'SINGLE' | 'MULTI') => {
    const currentSpecs = { ...activeFilters.specifications };
    const currentList = currentSpecs[dimensionId] || [];

    const updatedList = currentList.includes(val)
      ? currentList.filter((v) => v !== val)
      : selectionMode === 'SINGLE'
      ? [val]
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

  const handleApplyCustomPrice = () => {
    const min = tempMinPrice.trim() !== '' ? Number(tempMinPrice) : undefined;
    const max = tempMaxPrice.trim() !== '' ? Number(tempMaxPrice) : undefined;

    onChangeFilters({
      ...activeFilters,
      minPrice: min,
      maxPrice: max
    });
    setOpenDropdownId(null);
  };

  const handleApplyPresetPrice = (min?: number, max?: number) => {
    setTempMinPrice(min !== undefined ? String(min) : '');
    setTempMaxPrice(max !== undefined ? String(max) : '');
    onChangeFilters({
      ...activeFilters,
      minPrice: min,
      maxPrice: max
    });
    setOpenDropdownId(null);
  };

  // Check if a filter dimension has active selections
  const getActiveCountForDimension = (filter: AvailableCategoryFilter): number => {
    if (filter.id === 'category') {
      return activeFilters.categories?.length || 0;
    }
    if (filter.id === 'childCategory') {
      return activeFilters.childCategories?.length || 0;
    }
    if (filter.id === 'brand') {
      return activeFilters.brands?.length || 0;
    }
    if (filter.id === 'subcategory') {
      return activeFilters.subcategories?.length || 0;
    }
    if (filter.id === 'price') {
      return activeFilters.minPrice !== undefined || activeFilters.maxPrice !== undefined ? 1 : 0;
    }
    return activeFilters.specifications?.[filter.id]?.length || 0;
  };

  // Clear single dimension
  const handleClearDimension = (filter: AvailableCategoryFilter) => {
    if (filter.id === 'category') {
      onChangeFilters({ ...activeFilters, categories: [] });
    } else if (filter.id === 'childCategory') {
      onChangeFilters({ ...activeFilters, childCategories: [] });
    } else if (filter.id === 'brand') {
      onChangeFilters({ ...activeFilters, brands: [] });
    } else if (filter.id === 'subcategory') {
      onChangeFilters({ ...activeFilters, subcategories: [] });
    } else if (filter.id === 'price') {
      setTempMinPrice('');
      setTempMaxPrice('');
      onChangeFilters({ ...activeFilters, minPrice: undefined, maxPrice: undefined });
    } else {
      const copy = { ...activeFilters.specifications };
      delete copy[filter.id];
      onChangeFilters({ ...activeFilters, specifications: copy });
    }
  };

  const hasAnyActiveFilters =
    (activeFilters.categories?.length || 0) > 0 ||
    (activeFilters.childCategories?.length || 0) > 0 ||
    (activeFilters.subcategories?.length || 0) > 0 ||
    (activeFilters.brands?.length || 0) > 0 ||
    !!activeFilters.inStockOnly ||
    !!activeFilters.asapOnly ||
    activeFilters.minPrice !== undefined ||
    activeFilters.maxPrice !== undefined ||
    Object.values(activeFilters.specifications || {}).some((v) => v && v.length > 0);

  return (
    <div className={`relative ${className}`}>
      {/* Click-away backdrop overlay when a dropdown is open */}
      {openDropdownId && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setOpenDropdownId(null)}
          aria-hidden="true"
        />
      )}

      {/* Main Horizontal Filter Bar Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs py-2 px-3 sm:px-4 flex flex-wrap items-center justify-between gap-2.5">
        {/* Left Side: 'Filter:' Label + Horizontal Filter Dropdown Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1 min-w-0 py-1">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 flex-shrink-0 mr-1 select-none">
            <SlidersHorizontal className="w-3.5 h-3.5 text-brand-blue-900" />
            <span>Filter:</span>
          </div>

          {/* Dynamic Category & Specification Dropdowns (Category lists only active Main Category's Child Categories) */}
          {availableFilters.map((filter) => {
            const activeCount = getActiveCountForDimension(filter);
            const isOpen = openDropdownId === filter.id;

            return (
              <div key={filter.id} className="relative flex-shrink-0">
                {/* Dropdown Trigger Button */}
                <button
                  type="button"
                  onClick={() => toggleDropdown(filter.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border select-none cursor-pointer ${
                    activeCount > 0
                      ? 'bg-brand-blue-50 text-brand-blue-900 border-brand-blue-300 font-bold shadow-2xs'
                      : isOpen
                      ? 'bg-slate-100 text-slate-900 border-slate-400'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate max-w-[130px]">{filter.name}</span>
                  {activeCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-brand-blue-900 text-white text-[10px] font-black flex items-center justify-center">
                      {activeCount}
                    </span>
                  )}
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-brand-blue-900' : ''
                    }`}
                  />
                </button>

                {/* Popover Dropdown Panel */}
                {isOpen && (
                  <div
                    className="absolute top-full left-0 mt-2 z-30 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 min-w-[260px] max-w-xs animate-in fade-in zoom-in-95 duration-150"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Popover Header */}
                    <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
                      <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <span>{activeCount} selected</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleClearDimension(filter)}
                        disabled={activeCount === 0}
                        className={`text-[11px] font-semibold transition-colors ${
                          activeCount > 0
                            ? 'text-brand-blue-900 hover:underline cursor-pointer'
                            : 'text-slate-300 cursor-default'
                        }`}
                      >
                        Reset
                      </button>
                    </div>

                    {/* Checkbox Options List */}
                    {filter.type === 'checkbox' && (
                      <div className="space-y-2">
                        {/* Option Search Input (if > 5 options) */}
                        {filter.options && filter.options.length > 5 && (
                          <div className="relative mb-2">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              placeholder={`Search ${filter.name}...`}
                              value={searchQueries[filter.id] || ''}
                              onChange={(e) =>
                                setSearchQueries((prev) => ({
                                  ...prev,
                                  [filter.id]: e.target.value
                                }))
                              }
                              className="w-full pl-8 pr-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-blue-500 bg-slate-50"
                            />
                          </div>
                        )}

                        {/* List */}
                        <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                          {filter.options
                            .filter((opt) => {
                              const q = searchQueries[filter.id]?.toLowerCase().trim();
                              return !q || opt.label.toLowerCase().includes(q);
                            })
                            .map((opt) => {
                              let isChecked = false;
                              if (filter.id === 'category') {
                                isChecked = (activeFilters.categories || []).includes(opt.value);
                              } else if (filter.id === 'childCategory') {
                                isChecked = (activeFilters.childCategories || []).includes(opt.value);
                              } else if (filter.id === 'brand') {
                                isChecked = (activeFilters.brands || []).includes(opt.value);
                              } else if (filter.id === 'subcategory') {
                                isChecked = (activeFilters.subcategories || []).includes(opt.value);
                              } else {
                                isChecked = (
                                  activeFilters.specifications?.[filter.id] || []
                                ).includes(opt.value);
                              }

                               const onToggle = () => {
                                 if (filter.id === 'category') {
                                   handleCategoryToggle(opt.value, filter.selectionMode);
                                 } else if (filter.id === 'childCategory') {
                                   handleChildCategoryToggle(opt.value, filter.selectionMode);
                                 } else if (filter.id === 'brand') {
                                   handleBrandToggle(opt.value, filter.selectionMode);
                                 } else if (filter.id === 'subcategory') {
                                   handleSubcategoryToggle(opt.value, filter.selectionMode);
                                 } else {
                                   handleSpecToggle(filter.id, opt.value, filter.selectionMode);
                                 }
                               };

                               return (
                                 <label
                                   key={opt.value}
                                   className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 text-xs text-slate-700 cursor-pointer select-none transition-colors"
                                 >
                                   <div className="flex items-center gap-2 min-w-0 pr-2">
                                     <input
                                       type={filter.selectionMode === 'SINGLE' ? 'radio' : 'checkbox'}
                                       name={filter.selectionMode === 'SINGLE' ? `filter-${filter.id}` : undefined}
                                       checked={isChecked}
                                       onChange={onToggle}
                                       className={`w-3.5 h-3.5 text-brand-blue-900 focus:ring-brand-blue-500 border-slate-300 cursor-pointer ${
                                         filter.selectionMode === 'SINGLE' ? 'rounded-full' : 'rounded'
                                       }`}
                                     />
                                    <span className="truncate" title={opt.label}>
                                      {opt.label}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-semibold flex-shrink-0">
                                    ({opt.count})
                                  </span>
                                </label>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* Price Range Selector */}
                    {filter.type === 'range' && (
                      <div className="space-y-3">
                        {/* Quick Preset Buttons */}
                        <div className="grid grid-cols-2 gap-1.5 text-xs">
                          <button
                            type="button"
                            onClick={() => handleApplyPresetPrice(undefined, 500)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:border-brand-blue-400 hover:bg-brand-blue-50 text-[11px] font-semibold text-center transition-colors cursor-pointer"
                          >
                            Under ₹500
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplyPresetPrice(500, 2000)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:border-brand-blue-400 hover:bg-brand-blue-50 text-[11px] font-semibold text-center transition-colors cursor-pointer"
                          >
                            ₹500 - ₹2,000
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplyPresetPrice(2000, 5000)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:border-brand-blue-400 hover:bg-brand-blue-50 text-[11px] font-semibold text-center transition-colors cursor-pointer"
                          >
                            ₹2,000 - ₹5,000
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplyPresetPrice(5000, undefined)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:border-brand-blue-400 hover:bg-brand-blue-50 text-[11px] font-semibold text-center transition-colors cursor-pointer"
                          >
                            Above ₹5,000
                          </button>
                        </div>

                        {/* Min / Max Inputs */}
                        <div className="space-y-1.5 pt-1 border-t border-slate-100">
                          <div className="text-[10px] font-bold text-slate-500 uppercase">
                            Custom Range (₹)
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              placeholder="Min"
                              value={tempMinPrice}
                              onChange={(e) => setTempMinPrice(e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-blue-500 font-medium"
                            />
                            <span className="text-slate-400 text-xs">-</span>
                            <input
                              type="number"
                              placeholder="Max"
                              value={tempMaxPrice}
                              onChange={(e) => setTempMaxPrice(e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-blue-500 font-medium"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleApplyCustomPrice}
                          className="w-full py-1.5 rounded-lg bg-brand-blue-900 text-white text-xs font-bold hover:bg-brand-blue-950 transition-colors cursor-pointer shadow-2xs"
                        >
                          Apply Price
                        </button>
                      </div>
                    )}

                    {/* Popover Footer Done Button */}
                    <div className="pt-2.5 mt-2.5 border-t border-slate-100 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => setOpenDropdownId(null)}
                        className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Quick Toggles: 60-Min Dispatch & In Stock */}
          <div className="h-4 w-px bg-slate-200 mx-1 flex-shrink-0" />

          {/* 60-Min Quick Dispatch Toggle */}
          <button
            type="button"
            onClick={() =>
              onChangeFilters({
                ...activeFilters,
                asapOnly: !activeFilters.asapOnly
              })
            }
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all select-none cursor-pointer flex-shrink-0 ${
              activeFilters.asapOnly
                ? 'bg-amber-500 text-white border-amber-600 font-bold shadow-2xs'
                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${activeFilters.asapOnly ? 'fill-current' : 'text-amber-500 fill-amber-500'}`} />
            <span>60-Min Delivery</span>
          </button>

          {/* In Stock Available Toggle */}
          <button
            type="button"
            onClick={() =>
              onChangeFilters({
                ...activeFilters,
                inStockOnly: !activeFilters.inStockOnly
              })
            }
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all select-none cursor-pointer flex-shrink-0 ${
              activeFilters.inStockOnly
                ? 'bg-emerald-600 text-white border-emerald-700 font-bold shadow-2xs'
                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>In Stock</span>
          </button>

          {hasAnyActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all select-none cursor-pointer flex-shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear All</span>
            </button>
          )}
        </div>

        {/* Right Side: Product Count + Sort Dropdown */}
        <div className="flex items-center gap-3 ml-auto flex-shrink-0 pl-2">
          {/* Product Count (e.g. '20 products') */}
          <div className="text-xs font-bold text-slate-500 whitespace-nowrap">
            <strong className="text-slate-900 font-black">{totalResultsCount}</strong> products
          </div>

          <div className="h-4 w-px bg-slate-200" />

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1 text-xs text-slate-600">
            <span className="font-semibold text-slate-500 hidden sm:inline whitespace-nowrap">
              Sort by:
            </span>
            <select
              aria-label="Sort products by"
              value={activeFilters.sortBy || (sortOptions && sortOptions.length > 0 ? sortOptions[0].value : 'relevance')}
              onChange={(e) =>
                onChangeFilters({
                  ...activeFilters,
                  sortBy: e.target.value
                })
              }
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-blue-500 cursor-pointer"
            >
              {sortOptions && sortOptions.length > 0 ? (
                sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))
              ) : (
                <>
                  <option value="relevance">Relevance</option>
                  <option value="latest">Latest Arrivals (Newest)</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="discount">Discount: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="speed">Fastest Delivery (60 Mins)</option>
                </>
              )}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
