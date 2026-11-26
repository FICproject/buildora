import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ChevronRight, RotateCcw, PackageOpen } from 'lucide-react';
import {
  MASTER_CATEGORIES,
  getAvailableFiltersForCatalog,
  applyCategoryFilters,
  ActiveCategoryFilters
} from '@buildora/constants';
import { Category, Product } from '@buildora/types';
import { api } from '../services/api';
import { ProductCard } from '../components/common/ProductCard';
import {
  CategoryHorizontalFilterBar,
  ActiveFilterChips
} from '../components/catalog';

function parseCatalogUrlFilters(searchParams: URLSearchParams): ActiveCategoryFilters {
  const categories = (searchParams.get('category') || '')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);
  const subcategories = (searchParams.get('sub') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const brands = (searchParams.get('brand') || '')
    .split(',')
    .map((b) => b.trim())
    .filter(Boolean);
  const inStockOnly = searchParams.get('inStock') === 'true';
  const asapOnly = searchParams.get('asap') === 'true';
  const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
  const sortBy = searchParams.get('sort') || 'relevance';
  const searchQuery = searchParams.get('search') || '';

  let specifications: Record<string, string[]> = {};
  const specsParam = searchParams.get('specs');
  if (specsParam) {
    try {
      const parsed = JSON.parse(specsParam);
      if (parsed && typeof parsed === 'object') {
        specifications = parsed;
      }
    } catch {
      specifications = {};
    }
  }

  return {
    categories,
    subcategories,
    brands,
    inStockOnly,
    asapOnly,
    minPrice: Number.isFinite(minPrice) ? minPrice : undefined,
    maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
    specifications,
    sortBy,
    searchQuery,
  };
}

export const ProductListingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Products and Category list state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>(MASTER_CATEGORIES);
  const [loading, setLoading] = useState(true);

  const [activeFilters, setActiveFilters] = useState<ActiveCategoryFilters>(() =>
    parseCatalogUrlFilters(searchParams)
  );

  // Fetch categories & live customer-visible products (updates automatically on admin approvals)
  useEffect(() => {
    let active = true;
    const loadCatalog = async () => {
      setLoading(true);
      try {
        const [cats, prods] = await Promise.all([api.getCategories(), api.getProducts()]);
        if (!active) return;
        if (cats && cats.length) setCategories(cats);
        setProducts(Array.isArray(prods) ? prods : []);
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadCatalog();

    const onRealtime = () => {
      void loadCatalog();
    };
    window.addEventListener('buildora:realtime:catalog', onRealtime);
    return () => {
      active = false;
      window.removeEventListener('buildora:realtime:catalog', onRealtime);
    };
  }, []);

  // Synchronize URL changes (initial load + browser Back/Forward) into filter state
  useEffect(() => {
    setActiveFilters(parseCatalogUrlFilters(searchParams));
  }, [searchParams]);

  const commitFiltersToUrl = useCallback(
    (next: ActiveCategoryFilters) => {
      setActiveFilters(next);
      const params = new URLSearchParams();
      if (next.categories && next.categories.length > 0) {
        params.set('category', next.categories.join(','));
      }
      if (next.subcategories && next.subcategories.length > 0) {
        params.set('sub', next.subcategories.join(','));
      }
      if (next.brands && next.brands.length > 0) {
        params.set('brand', next.brands.join(','));
      }
      if (next.inStockOnly) params.set('inStock', 'true');
      if (next.asapOnly) params.set('asap', 'true');
      if (next.minPrice !== undefined) params.set('minPrice', String(next.minPrice));
      if (next.maxPrice !== undefined) params.set('maxPrice', String(next.maxPrice));
      if (next.sortBy && next.sortBy !== 'relevance') params.set('sort', next.sortBy);
      if (next.searchQuery && next.searchQuery.trim()) params.set('search', next.searchQuery.trim());
      if (next.specifications && Object.keys(next.specifications).length > 0) {
        params.set('specs', JSON.stringify(next.specifications));
      }
      setSearchParams(params);
    },
    [setSearchParams]
  );

  // Identify active category slug if a single category is selected
  const activeCategorySlug = useMemo(() => {
    if (!activeFilters.categories || activeFilters.categories.length !== 1) {
      return undefined;
    }
    const catNameOrSlug = activeFilters.categories[0];
    const found = categories.find(
      (c) =>
        c.slug.toLowerCase() === catNameOrSlug.toLowerCase() ||
        c.name.toLowerCase() === catNameOrSlug.toLowerCase()
    );
    return found ? found.slug : undefined;
  }, [activeFilters.categories, categories]);

  const activeCategory = useMemo(() => {
    if (!activeCategorySlug) return null;
    return categories.find((c) => c.slug === activeCategorySlug) || null;
  }, [activeCategorySlug, categories]);

  // Dynamically compute available filters for the catalog (with active Main Category's Child Categories when selected)
  const availableFilters = useMemo(() => {
    return getAvailableFiltersForCatalog(
      products,
      activeCategorySlug,
      activeCategory?.subcategories
    );
  }, [products, activeCategorySlug, activeCategory?.subcategories]);

  // Filter & Sort Products
  const filteredProducts = useMemo(() => {
    let result = applyCategoryFilters(products, activeFilters, activeCategorySlug);

    // Sort
    if (activeFilters.sortBy === 'price-low') {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (activeFilters.sortBy === 'price-high') {
      result = [...result].sort((a, b) => b.price - a.price);
    } else if (activeFilters.sortBy === 'rating') {
      result = [...result].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (activeFilters.sortBy === 'discount') {
      result = [...result].sort((a, b) => (b.discount || 0) - (a.discount || 0));
    } else if (activeFilters.sortBy === 'speed') {
      result = [...result].sort((a, b) => {
        const aAsap = a.deliverySpeedAvailable?.includes('ASAP_60') ? 1 : 0;
        const bAsap = b.deliverySpeedAvailable?.includes('ASAP_60') ? 1 : 0;
        return bAsap - aAsap;
      });
    }

    return result;
  }, [products, activeFilters, activeCategorySlug]);

  // Filter change handlers
  const handleResetFilters = () => {
    commitFiltersToUrl({
      categories: [],
      brands: [],
      subcategories: [],
      inStockOnly: false,
      asapOnly: false,
      specifications: {},
      sortBy: activeFilters.sortBy,
      searchQuery: ''
    });
  };

  const handleRemoveCategory = (cat: string) => {
    commitFiltersToUrl({
      ...activeFilters,
      categories: (activeFilters.categories || []).filter((c) => c !== cat),
      subcategories: [],
      specifications: {}
    });
  };

  const handleRemoveBrand = (brand: string) => {
    commitFiltersToUrl({
      ...activeFilters,
      brands: activeFilters.brands.filter((b) => b !== brand)
    });
  };

  const handleRemoveSubcategory = (sub: string) => {
    commitFiltersToUrl({
      ...activeFilters,
      subcategories: activeFilters.subcategories.filter((s) => s !== sub)
    });
  };

  const handleRemoveSpec = (dimId: string, val: string) => {
    const currentList = activeFilters.specifications[dimId] || [];
    const updatedList = currentList.filter((v) => v !== val);
    const updatedSpecs = { ...activeFilters.specifications };
    if (updatedList.length === 0) {
      delete updatedSpecs[dimId];
    } else {
      updatedSpecs[dimId] = updatedList;
    }
    commitFiltersToUrl({
      ...activeFilters,
      specifications: updatedSpecs
    });
  };

  const handleRemovePrice = () => {
    commitFiltersToUrl({
      ...activeFilters,
      minPrice: undefined,
      maxPrice: undefined
    });
  };

  const handleRemoveInStock = () => {
    commitFiltersToUrl({
      ...activeFilters,
      inStockOnly: false
    });
  };

  const handleRemoveAsap = () => {
    commitFiltersToUrl({
      ...activeFilters,
      asapOnly: false
    });
  };

  return (
    <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 space-y-5">
      {/* 1. Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto no-scrollbar whitespace-nowrap">
        <Link to="/" className="hover:text-brand-blue-900 flex-shrink-0">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <span className="font-semibold text-slate-800 flex-shrink-0">
          {activeCategory ? activeCategory.name : 'All Products'}
        </span>
      </nav>

      {/* 2. Page Title Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {activeCategory ? activeCategory.name : 'Construction Materials Catalogue'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
            {activeCategory
              ? activeCategory.description
              : 'Direct-from-mill construction materials dispatched to your job site in 60 minutes.'}
          </p>
        </div>
      </div>

      {/* 3. Horizontal Filter Bar */}
      <CategoryHorizontalFilterBar
        availableFilters={availableFilters}
        activeFilters={activeFilters}
        onChangeFilters={commitFiltersToUrl}
        onResetFilters={handleResetFilters}
        totalResultsCount={filteredProducts.length}
      />

      {/* 4. Active Filter Chips */}
      <ActiveFilterChips
        activeFilters={activeFilters}
        availableFilters={availableFilters}
        onRemoveCategory={handleRemoveCategory}
        onRemoveBrand={handleRemoveBrand}
        onRemoveSubcategory={handleRemoveSubcategory}
        onRemoveSpec={handleRemoveSpec}
        onRemovePrice={handleRemovePrice}
        onRemoveInStock={handleRemoveInStock}
        onRemoveAsap={handleRemoveAsap}
        onClearAll={handleResetFilters}
      />

      {/* 5. Full-Width High-Density Product Grid */}
      {loading && products.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 animate-pulse">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="h-72 rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-16 bg-white rounded-3xl border border-slate-200 text-center space-y-4 shadow-2xs">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
            <PackageOpen className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-lg">No Materials Found</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              No items match your currently applied filters. Try adjusting or clearing your filters
              to view more construction materials.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-brand-blue-900 text-white hover:bg-brand-blue-950 transition-colors shadow-sm cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset All Filters
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {filteredProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
};
