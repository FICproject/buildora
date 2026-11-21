import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ChevronRight, RotateCcw, PackageOpen, Search } from 'lucide-react';
import {
  MASTER_CATEGORIES,
  SEED_PRODUCTS,
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

export const ProductListingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL query params
  const initialCategory = searchParams.get('category') || '';
  const initialBrand = searchParams.get('brand') || '';
  const initialSearch = searchParams.get('search') || '';

  // Products and Category list state
  const [products, setProducts] = useState<Product[]>(SEED_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(MASTER_CATEGORIES);

  // Active filter state
  const [activeFilters, setActiveFilters] = useState<ActiveCategoryFilters>({
    categories: initialCategory
      ? [
          MASTER_CATEGORIES.find((c) => c.slug === initialCategory)?.name || initialCategory
        ]
      : [],
    brands: initialBrand ? [initialBrand] : [],
    subcategories: [],
    inStockOnly: false,
    asapOnly: false,
    specifications: {},
    sortBy: 'relevance',
    searchQuery: initialSearch
  });

  // Fetch categories from Backend API on mount
  useEffect(() => {
    api.getCategories().then((c) => {
      if (c && c.length) setCategories(c);
    });
    api.getProducts().then((p) => {
      if (p && p.length) setProducts(p);
    });
  }, []);

  // Synchronize when URL changes
  useEffect(() => {
    const urlCat = searchParams.get('category');
    const urlBrand = searchParams.get('brand');
    const urlSearch = searchParams.get('search');

    setActiveFilters((prev) => ({
      ...prev,
      categories: urlCat
        ? [categories.find((c) => c.slug === urlCat)?.name || urlCat]
        : prev.categories,
      brands: urlBrand ? [urlBrand] : prev.brands,
      searchQuery: urlSearch || prev.searchQuery
    }));
  }, [searchParams, categories]);

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

  // Dynamically compute available filters for the catalog (with category-specific specs if category selected)
  const availableFilters = useMemo(() => {
    return getAvailableFiltersForCatalog(products, activeCategorySlug);
  }, [products, activeCategorySlug]);

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
    setActiveFilters({
      categories: [],
      brands: [],
      subcategories: [],
      inStockOnly: false,
      asapOnly: false,
      specifications: {},
      sortBy: activeFilters.sortBy,
      searchQuery: ''
    });
    setSearchParams({});
  };

  const handleRemoveCategory = (cat: string) => {
    setActiveFilters((prev) => ({
      ...prev,
      categories: (prev.categories || []).filter((c) => c !== cat),
      specifications: {} // clear category-specific specs when category removed
    }));
  };

  const handleRemoveBrand = (brand: string) => {
    setActiveFilters((prev) => ({
      ...prev,
      brands: prev.brands.filter((b) => b !== brand)
    }));
  };

  const handleRemoveSubcategory = (sub: string) => {
    setActiveFilters((prev) => ({
      ...prev,
      subcategories: prev.subcategories.filter((s) => s !== sub)
    }));
  };

  const handleRemoveSpec = (dimId: string, val: string) => {
    setActiveFilters((prev) => {
      const currentList = prev.specifications[dimId] || [];
      const updatedList = currentList.filter((v) => v !== val);
      const updatedSpecs = { ...prev.specifications };
      if (updatedList.length === 0) {
        delete updatedSpecs[dimId];
      } else {
        updatedSpecs[dimId] = updatedList;
      }
      return {
        ...prev,
        specifications: updatedSpecs
      };
    });
  };

  const handleRemovePrice = () => {
    setActiveFilters((prev) => ({
      ...prev,
      minPrice: undefined,
      maxPrice: undefined
    }));
  };

  const handleRemoveInStock = () => {
    setActiveFilters((prev) => ({
      ...prev,
      inStockOnly: false
    }));
  };

  const handleRemoveAsap = () => {
    setActiveFilters((prev) => ({
      ...prev,
      asapOnly: false
    }));
  };

  return (
    <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 space-y-5">
      {/* 1. Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto no-scrollbar whitespace-nowrap">
        <Link to="/" className="hover:text-brand-blue-900 flex-shrink-0">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <Link to="/products" className="hover:text-brand-blue-900 flex-shrink-0">
          Categories
        </Link>
        {activeCategory && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="font-semibold text-slate-800 flex-shrink-0">
              {activeCategory.name}
            </span>
          </>
        )}
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

      {/* 3. Horizontal Filter Bar (HomeRun-Style) */}
      <CategoryHorizontalFilterBar
        availableFilters={availableFilters}
        activeFilters={activeFilters}
        onChangeFilters={setActiveFilters}
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
      {filteredProducts.length === 0 ? (
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
