import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ChevronRight, RotateCcw, PackageOpen } from 'lucide-react';
import {
  SEED_PRODUCTS,
  getAvailableFiltersForCategory,
  applyCategoryFilters,
  ActiveCategoryFilters
} from '@buildora/constants';
import { Product } from '@buildora/types';
import { api } from '../services/api';
import { ProductCard } from '../components/common/ProductCard';
import {
  CategoryHorizontalFilterBar,
  ActiveFilterChips,
  SortOption
} from '../components/catalog';

const NEW_LAUNCHES_SORT_OPTIONS: SortOption[] = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'latest', label: 'Latest Arrivals (Newest)' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'discount', label: 'Discount: High to Low' }
];

export const NewLaunchesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [products, setProducts] = useState<Product[]>(SEED_PRODUCTS);
  const [isLoading, setIsLoading] = useState(false);

  // Active filter state initialized from URL parameters
  const [activeFilters, setActiveFilters] = useState<ActiveCategoryFilters>(() => {
    const brandParam = searchParams.get('brand');
    const sortParam = searchParams.get('sort');
    const minP = searchParams.get('minPrice');
    const maxP = searchParams.get('maxPrice');
    const typeParam = searchParams.get('type');
    const sizeParam = searchParams.get('size');
    const inStock = searchParams.get('inStock') === 'true';
    const asap = searchParams.get('asap') === 'true';

    const specs: Record<string, string[]> = {};
    if (typeParam) specs['type'] = typeParam.split(',').map((s) => s.trim()).filter(Boolean);
    if (sizeParam) specs['size'] = sizeParam.split(',').map((s) => s.trim()).filter(Boolean);

    return {
      brands: brandParam ? brandParam.split(',').map((b) => b.trim()).filter(Boolean) : [],
      subcategories: [],
      inStockOnly: inStock,
      asapOnly: asap,
      minPrice: minP ? Number(minP) : undefined,
      maxPrice: maxP ? Number(maxP) : undefined,
      specifications: specs,
      sortBy: sortParam || 'latest'
    };
  });

  // Load products from API / fallback
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    api.getProducts().then((allProducts) => {
      if (isMounted) {
        if (allProducts && allProducts.length > 0) {
          setProducts(allProducts);
        }
        setIsLoading(false);
      }
    }).catch(() => {
      if (isMounted) setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Update URL search params when active filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeFilters.brands.length > 0) {
      params.set('brand', activeFilters.brands.join(','));
    }
    if (activeFilters.specifications?.['type']?.length > 0) {
      params.set('type', activeFilters.specifications['type'].join(','));
    }
    if (activeFilters.specifications?.['size']?.length > 0) {
      params.set('size', activeFilters.specifications['size'].join(','));
    }
    if (activeFilters.minPrice !== undefined) {
      params.set('minPrice', String(activeFilters.minPrice));
    }
    if (activeFilters.maxPrice !== undefined) {
      params.set('maxPrice', String(activeFilters.maxPrice));
    }
    if (activeFilters.inStockOnly) {
      params.set('inStock', 'true');
    }
    if (activeFilters.asapOnly) {
      params.set('asap', 'true');
    }
    if (activeFilters.sortBy && activeFilters.sortBy !== 'latest') {
      params.set('sort', activeFilters.sortBy);
    }

    setSearchParams(params, { replace: true });
  }, [activeFilters, setSearchParams]);

  // Pool of products for New Launches: products where isNewLaunch is true
  const newLaunchProducts = useMemo(() => {
    return products.filter((p) => p.isNewLaunch);
  }, [products]);

  // Dynamically compute available filters for new-launches (Brand, Type, Price, Size)
  const availableFilters = useMemo(() => {
    return getAvailableFiltersForCategory('new-launches', newLaunchProducts);
  }, [newLaunchProducts]);

  // Apply filters and sorting
  const filteredProducts = useMemo(() => {
    let result = applyCategoryFilters(newLaunchProducts, activeFilters, 'new-launches');

    // Sorting
    const sort = activeFilters.sortBy || 'latest';
    if (sort === 'price-low' || sort === 'price_asc') {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sort === 'price-high' || sort === 'price_desc') {
      result = [...result].sort((a, b) => b.price - a.price);
    } else if (sort === 'discount') {
      result = [...result].sort((a, b) => (b.discount || 0) - (a.discount || 0));
    } else if (sort === 'rating') {
      result = [...result].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sort === 'speed') {
      result = [...result].sort((a, b) => {
        const aAsap = a.deliverySpeedAvailable?.includes('ASAP_60') ? 1 : 0;
        const bAsap = b.deliverySpeedAvailable?.includes('ASAP_60') ? 1 : 0;
        return bAsap - aAsap;
      });
    } else if (sort === 'latest') {
      result = [...result].sort((a, b) => {
        if (a.isNewLaunch && !b.isNewLaunch) return -1;
        if (!a.isNewLaunch && b.isNewLaunch) return 1;
        return b.id.localeCompare(a.id);
      });
    }

    return result;
  }, [newLaunchProducts, activeFilters]);

  // Filter change handlers
  const handleResetFilters = () => {
    setActiveFilters({
      brands: [],
      subcategories: [],
      inStockOnly: false,
      asapOnly: false,
      minPrice: undefined,
      maxPrice: undefined,
      specifications: {},
      sortBy: 'latest'
    });
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
    <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 space-y-5 animate-in fade-in-0 duration-200">
      {/* 1. Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto no-scrollbar whitespace-nowrap">
        <Link to="/" className="hover:text-brand-blue-900 flex-shrink-0 transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <span className="font-semibold text-slate-800 flex-shrink-0">
          New Launches
        </span>
      </nav>

      {/* 2. Category Title Header (HomeRun-Style Parity) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            New Launches
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
            Recently introduced construction materials, direct-from-mill architectural hardware, smart electrical supplies, and modern building fixtures.
          </p>
        </div>
      </div>

      {/* 3. Horizontal Filter Bar (Brand, Type, Price, Size, Sort - Strictly No Category Filter) */}
      <CategoryHorizontalFilterBar
        availableFilters={availableFilters}
        activeFilters={activeFilters}
        onChangeFilters={setActiveFilters}
        onResetFilters={handleResetFilters}
        totalResultsCount={filteredProducts.length}
        sortOptions={NEW_LAUNCHES_SORT_OPTIONS}
      />

      {/* 4. Active Filter Chips */}
      <ActiveFilterChips
        activeFilters={activeFilters}
        availableFilters={availableFilters}
        onRemoveBrand={handleRemoveBrand}
        onRemoveSubcategory={handleRemoveSubcategory}
        onRemoveSpec={handleRemoveSpec}
        onRemovePrice={handleRemovePrice}
        onRemoveInStock={handleRemoveInStock}
        onRemoveAsap={handleRemoveAsap}
        onClearAll={handleResetFilters}
      />

      {/* 5. Full-Width Product Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
            <div key={n} className="bg-white rounded-2xl border border-slate-200 p-4 h-72 animate-pulse space-y-3">
              <div className="bg-slate-100 rounded-xl h-36 w-full" />
              <div className="h-4 bg-slate-100 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
              <div className="h-8 bg-slate-100 rounded w-full mt-4" />
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-16 bg-white rounded-3xl border border-slate-200 text-center space-y-4 shadow-2xs">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
            <PackageOpen className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-lg">
              No new launches match your selected filters
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Try adjusting or clearing your filters to explore all newly launched construction materials.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-brand-blue-900 text-white hover:bg-brand-blue-950 transition-colors shadow-sm cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear All Filters
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};
