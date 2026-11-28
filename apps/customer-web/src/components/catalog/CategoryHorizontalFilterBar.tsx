import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronDown,
  Search,
  RotateCcw,
  Zap,
  Check,
  SlidersHorizontal
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
  const [alignRightId, setAlignRightId] = useState<string | null>(null);

  // Local search query per filter dimension
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});

  // Local price inputs + validation message
  const [tempMinPrice, setTempMinPrice] = useState<string>(
    activeFilters.minPrice !== undefined ? String(activeFilters.minPrice) : ''
  );
  const [tempMaxPrice, setTempMaxPrice] = useState<string>(
    activeFilters.maxPrice !== undefined ? String(activeFilters.maxPrice) : ''
  );
  const [priceError, setPriceError] = useState<string | null>(null);

  // Detect <640px mobile viewport so dropdowns render in a Portal bottom sheet above overflow containers
  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 639px)').matches : false
  );

  const barRef = useRef<HTMLDivElement>(null);
  const portalPanelRef = useRef<HTMLDivElement>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Track viewport breakpoint for desktop popover vs mobile portal sheet
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 639px)');
    const onChange = (e: MediaQueryListEvent) => setIsMobileViewport(e.matches);
    setIsMobileViewport(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Sync temp price when activeFilters change externally
  useEffect(() => {
    setTempMinPrice(activeFilters.minPrice !== undefined ? String(activeFilters.minPrice) : '');
    setTempMaxPrice(activeFilters.maxPrice !== undefined ? String(activeFilters.maxPrice) : '');
    setPriceError(null);
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

  // Close dropdown on outside click (without an intercepting overlay blocking adjacent triggers)
  useEffect(() => {
    if (!openDropdownId) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (barRef.current?.contains(target)) return;
      if (portalPanelRef.current?.contains(target)) return;
      setOpenDropdownId(null);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [openDropdownId]);

  const toggleDropdown = (id: string) => {
    setPriceError(null);
    setOpenDropdownId((prev) => {
      const next = prev === id ? null : id;
      if (next && typeof window !== 'undefined') {
        const rect = triggerRefs.current[next]?.getBoundingClientRect();
        if (rect && rect.left + 320 > window.innerWidth - 16) {
          setAlignRightId(next);
        } else {
          setAlignRightId(null);
        }
      } else {
        setAlignRightId(null);
      }
      return next;
    });
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

  const parsePriceInput = (raw: string): number | undefined | 'invalid' => {
    const trimmed = raw.trim();
    if (!trimmed) return undefined;
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || parsed < 0) return 'invalid';
    return parsed;
  };

  const handleApplyCustomPrice = () => {
    const min = parsePriceInput(tempMinPrice);
    const max = parsePriceInput(tempMaxPrice);

    if (min === 'invalid' || max === 'invalid') {
      setPriceError('Please enter valid non-negative numeric amounts.');
      return;
    }

    if (min !== undefined && max !== undefined && min > max) {
      setPriceError('From amount cannot be greater than To amount.');
      return;
    }

    setPriceError(null);
    onChangeFilters({
      ...activeFilters,
      minPrice: min,
      maxPrice: max
    });
    setOpenDropdownId(null);
  };

  const handleResetCustomPrice = () => {
    setTempMinPrice('');
    setTempMaxPrice('');
    setPriceError(null);
    onChangeFilters({
      ...activeFilters,
      minPrice: undefined,
      maxPrice: undefined
    });
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
      setPriceError(null);
      onChangeFilters({ ...activeFilters, minPrice: undefined, maxPrice: undefined });
    } else {
      const copy = { ...activeFilters.specifications };
      delete copy[filter.id];
      onChangeFilters({ ...activeFilters, specifications: copy });
    }
  };

  const getPillLabel = (filter: AvailableCategoryFilter): string => {
    if (
      filter.id === 'price' &&
      (activeFilters.minPrice !== undefined || activeFilters.maxPrice !== undefined)
    ) {
      if (activeFilters.minPrice !== undefined && activeFilters.maxPrice !== undefined) {
        return `Price: ₹${activeFilters.minPrice} - ₹${activeFilters.maxPrice}`;
      }
      if (activeFilters.minPrice !== undefined) {
        return `Price: ₹${activeFilters.minPrice}+`;
      }
      return `Price: ≤ ₹${activeFilters.maxPrice}`;
    }
    return filter.name;
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

  const openFilterObj = openDropdownId
    ? availableFilters.find((f) => f.id === openDropdownId) || null
    : null;

  const renderDropdownBody = (filter: AvailableCategoryFilter, activeCount: number) => {
    const query = searchQueries[filter.id]?.toLowerCase().trim() || '';
    const filteredOptions = (filter.options || []).filter(
      (opt) => !query || opt.label.toLowerCase().includes(query)
    );

    return (
      <>
        {/* Popover Header */}
        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
          <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <span>{filter.name}</span>
            {activeCount > 0 && (
              <span className="text-[11px] font-semibold text-brand-blue-900">
                ({activeCount} selected)
              </span>
            )}
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

        {/* Checkbox / Radio Options List */}
        {filter.type === 'checkbox' && (
          <div className="space-y-2">
            {(filter.options || []).length > 0 && (
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
                  className="w-full pl-8 pr-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-blue-500 bg-slate-50"
                />
              </div>
            )}

            <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
              {filteredOptions.length === 0 ? (
                <div className="py-3 text-center text-xs text-slate-400">
                  No matching {filter.name.toLowerCase()} options
                </div>
              ) : (
                filteredOptions.map((opt) => {
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
                    isChecked = (activeFilters.specifications?.[filter.id] || []).includes(opt.value);
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
                })
              )}
            </div>
          </div>
        )}

        {/* Custom Numeric Price Range Selector (From / To, no fixed slabs) */}
        {filter.type === 'range' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  From
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  inputMode="numeric"
                  placeholder="Enter amount"
                  value={tempMinPrice}
                  onChange={(e) => {
                    setTempMinPrice(e.target.value);
                    if (priceError) setPriceError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleApplyCustomPrice();
                  }}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-blue-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  To
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  inputMode="numeric"
                  placeholder="Enter amount"
                  value={tempMaxPrice}
                  onChange={(e) => {
                    setTempMaxPrice(e.target.value);
                    if (priceError) setPriceError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleApplyCustomPrice();
                  }}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-blue-500 font-medium"
                />
              </div>
            </div>

            {priceError && (
              <p className="text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5">
                {priceError}
              </p>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleApplyCustomPrice}
                className="flex-1 py-1.5 rounded-lg bg-brand-blue-900 text-white text-xs font-bold hover:bg-brand-blue-950 transition-colors cursor-pointer shadow-2xs"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={handleResetCustomPrice}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Reset
              </button>
            </div>
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
      </>
    );
  };

  return (
    <div ref={barRef} className={`relative z-30 ${className}`}>
      {/* Main Horizontal Filter Bar Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm py-2 px-3 sm:px-4 flex flex-wrap items-center justify-between gap-2.5">
        {/* Left Side: 'Filter:' Label + Horizontal Filter Dropdown Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto sm:overflow-visible sm:flex-wrap no-scrollbar flex-1 min-w-0 py-1">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 flex-shrink-0 mr-1 select-none">
            <SlidersHorizontal className="w-3.5 h-3.5 text-brand-blue-900" />
            <span>Filter:</span>
          </div>

          {/* Dynamic Category & Specification Dropdowns (Category lists only active Main Category's Child Categories) */}
          {availableFilters.map((filter) => {
            const activeCount = getActiveCountForDimension(filter);
            const isOpen = openDropdownId === filter.id;
            const alignRight = alignRightId === filter.id;

            return (
              <div
                key={filter.id}
                className={`relative flex-shrink-0 ${isOpen ? 'z-50' : ''}`}
              >
                {/* Dropdown Trigger Button */}
                <button
                  ref={(el) => {
                    triggerRefs.current[filter.id] = el;
                  }}
                  type="button"
                  aria-expanded={isOpen}
                  aria-haspopup="dialog"
                  onClick={() => toggleDropdown(filter.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border select-none cursor-pointer ${
                    activeCount > 0
                      ? 'bg-brand-blue-50 text-brand-blue-900 border-brand-blue-300 font-bold shadow-2xs'
                      : isOpen
                      ? 'bg-slate-100 text-slate-900 border-slate-400'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate max-w-[180px]">{getPillLabel(filter)}</span>
                  {activeCount > 0 && filter.id !== 'price' && (
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

                {/* Desktop Popover Panel (>= 640px) anchored directly below button */}
                {isOpen && !isMobileViewport && (
                  <div
                    role="dialog"
                    aria-label={`${filter.name} filter`}
                    className={`absolute top-full mt-2 z-50 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 w-[280px] max-w-[calc(100vw-2rem)] ${
                      alignRight ? 'right-0' : 'left-0'
                    }`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {renderDropdownBody(filter, activeCount)}
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
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Sheet Portal (< 640px) so overflow-x-auto never clips open dropdowns */}
      {openFilterObj &&
        isMobileViewport &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-900/40 backdrop-blur-[1px] sm:hidden"
            onClick={() => setOpenDropdownId(null)}
          >
            <div
              ref={portalPanelRef}
              role="dialog"
              aria-label={`${openFilterObj.name} filter`}
              className="w-full max-w-lg max-h-[80dvh] overflow-y-auto bg-white rounded-t-2xl border-t border-slate-200 shadow-2xl p-4 pb-6 safe-pb"
              onClick={(e) => e.stopPropagation()}
            >
              {renderDropdownBody(openFilterObj, getActiveCountForDimension(openFilterObj))}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
