import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronRight,
  RotateCcw,
  PackageOpen
} from 'lucide-react';
import {
  MASTER_CATEGORIES,
  NEW_LAUNCHES_CATEGORIES,
  getAvailableFiltersForCategory,
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

function parseCategoryPageUrlFilters(
  searchParams: URLSearchParams,
  subcategoryParam?: string,
  category?: Category
): ActiveCategoryFilters {
  const urlSubs = (searchParams.get('sub') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  let subcategories: string[] = [];
  if (urlSubs.length > 0) {
    subcategories = urlSubs;
  } else if (subcategoryParam) {
    const matchedSub = category?.subcategories?.find(
      (s) =>
        s.slug.toLowerCase() === subcategoryParam.toLowerCase() ||
        s.name.toLowerCase() === subcategoryParam.toLowerCase()
    );
    subcategories = [matchedSub ? matchedSub.slug : subcategoryParam];
  }

  const brands = (searchParams.get('brand') || '')
    .split(',')
    .map((b) => b.trim())
    .filter(Boolean);
  const inStockOnly = searchParams.get('inStock') === 'true';
  const asapOnly = searchParams.get('asap') === 'true';
  const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
  const sortBy = searchParams.get('sort') || 'relevance';

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
    brands,
    subcategories,
    inStockOnly,
    asapOnly,
    minPrice: Number.isFinite(minPrice) ? minPrice : undefined,
    maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
    specifications,
    sortBy,
  };
}

export const CategoryPage: React.FC = () => {
  const { slug, subcategorySlug } = useParams<{ slug: string; subcategorySlug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Resolve master category slug if a new launch category slug was passed
  const effectiveCategorySlug = useMemo(() => {
    if (!slug) return '';
    const nlCat = NEW_LAUNCHES_CATEGORIES.find((c) => c.slug === slug);
    return nlCat ? nlCat.masterCategorySlug : slug;
  }, [slug]);

  const [category, setCategory] = useState<Category>(() => {
    const targetSlug = effectiveCategorySlug || slug;
    return (
      MASTER_CATEGORIES.find((c) => c.slug === targetSlug) ||
      MASTER_CATEGORIES[0]
    );
  });
  const [productList, setProductList] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [activeFilters, setActiveFilters] = useState<ActiveCategoryFilters>(() =>
    parseCategoryPageUrlFilters(searchParams, subcategorySlug)
  );

  // Load category details and live products (re-fetches on admin approvals/updates)
  useEffect(() => {
    let active = true;
    const targetSlug = effectiveCategorySlug || slug;
    if (!targetSlug) return;

    const fallbackCat = MASTER_CATEGORIES.find((c) => c.slug === targetSlug);
    if (fallbackCat) setCategory(fallbackCat);

    const loadCategoryData = async () => {
      setLoadingProducts(true);
      try {
        const [cat, prods] = await Promise.all([
          api.getCategoryBySlug(targetSlug),
          api.getProducts({ category: targetSlug }),
        ]);
        if (!active) return;
        if (cat) setCategory(cat);
        setProductList(Array.isArray(prods) ? prods : []);
      } finally {
        if (active) setLoadingProducts(false);
      }
    };

    void loadCategoryData();

    const onRealtime = () => {
      void loadCategoryData();
    };
    window.addEventListener('buildora:realtime:catalog', onRealtime);
    return () => {
      active = false;
      window.removeEventListener('buildora:realtime:catalog', onRealtime);
    };
  }, [slug, effectiveCategorySlug]);

  // Synchronize URL changes (initial load + browser Back/Forward navigation) into filter state
  useEffect(() => {
    setActiveFilters(parseCategoryPageUrlFilters(searchParams, subcategorySlug, category));
  }, [searchParams, subcategorySlug, category]);

  // Push filter changes cleanly to URL so selections persist across navigation & browser Back/Forward
  const commitFiltersToUrl = useCallback(
    (next: ActiveCategoryFilters) => {
      setActiveFilters(next);

      const params = new URLSearchParams();
      if (next.subcategories && next.subcategories.length > 0) {
        params.set('sub', next.subcategories.join(','));
      }
      if (next.brands && next.brands.length > 0) {
        params.set('brand', next.brands.join(','));
      }
      if (next.inStockOnly) {
        params.set('inStock', 'true');
      }
      if (next.asapOnly) {
        params.set('asap', 'true');
      }
      if (next.minPrice !== undefined) {
        params.set('minPrice', String(next.minPrice));
      }
      if (next.maxPrice !== undefined) {
        params.set('maxPrice', String(next.maxPrice));
      }
      if (next.sortBy && next.sortBy !== 'relevance') {
        params.set('sort', next.sortBy);
      }
      if (next.specifications && Object.keys(next.specifications).length > 0) {
        params.set('specs', JSON.stringify(next.specifications));
      }

      if (subcategorySlug) {
        // Move to main category base path with explicit URL filter state when filters are adjusted
        const basePath = `/categories/${slug}`;
        const nextUrl = params.toString() ? `${basePath}?${params.toString()}` : basePath;
        navigate(nextUrl);
      } else {
        setSearchParams(params);
      }
    },
    [slug, subcategorySlug, navigate, setSearchParams]
  );

  const activeSubcategory =
    activeFilters.subcategories?.length === 1
      ? category.subcategories?.find(
          (s) =>
            s.slug.toLowerCase() === activeFilters.subcategories[0].toLowerCase() ||
            s.name.toLowerCase() === activeFilters.subcategories[0].toLowerCase()
        )
      : subcategorySlug
      ? category.subcategories?.find(
          (s) =>
            s.slug.toLowerCase() === subcategorySlug.toLowerCase() ||
            s.name.toLowerCase() === subcategorySlug.toLowerCase()
        )
      : null;

  // All products belonging to this Main Category
  const allCategoryProducts = useMemo(() => {
    return productList.filter(
      (p) => p.categorySlug === category.slug || (p as any).categoryId === category.id
    );
  }, [productList, category.slug, category.id]);

  // Compute Child Category ("Category") + specification filters strictly scoped to active Main Category
  const availableFilters = useMemo(() => {
    return getAvailableFiltersForCategory(
      category.slug,
      allCategoryProducts,
      category.subcategories || []
    );
  }, [category.slug, category.subcategories, allCategoryProducts]);

  // Apply active filters and sorting
  const filteredProducts = useMemo(() => {
    let result = applyCategoryFilters(allCategoryProducts, activeFilters, category.slug);

    // Apply sorting
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
  }, [allCategoryProducts, activeFilters, category.slug]);

  // Filter change handlers
  const handleResetFilters = () => {
    commitFiltersToUrl({
      brands: [],
      subcategories: [],
      inStockOnly: false,
      asapOnly: false,
      specifications: {},
      sortBy: activeFilters.sortBy
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
      {/* 1. Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto no-scrollbar whitespace-nowrap">
        <Link to="/" className="hover:text-brand-blue-900 flex-shrink-0">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <Link
          to={`/categories/${category.slug}`}
          className="font-semibold text-slate-800 flex-shrink-0 hover:text-brand-blue-900"
        >
          {category.name}
        </Link>
        {activeSubcategory && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="font-semibold text-brand-blue-900 flex-shrink-0">
              {activeSubcategory.name}
            </span>
          </>
        )}
      </nav>

      {/* 2. Category Title Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {activeSubcategory ? activeSubcategory.name : category.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
            {category.description}
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
        onRemoveBrand={handleRemoveBrand}
        onRemoveSubcategory={handleRemoveSubcategory}
        onRemoveSpec={handleRemoveSpec}
        onRemovePrice={handleRemovePrice}
        onRemoveInStock={handleRemoveInStock}
        onRemoveAsap={handleRemoveAsap}
        onClearAll={handleResetFilters}
      />

      {/* 5. Full-Width Product Grid */}
      {loadingProducts && productList.length === 0 ? (
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
            <h3 className="font-bold text-slate-900 text-lg">
              No materials match your selected filters
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Try adjusting or clearing your filters to view more products in {category.name}.
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
          {filteredProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
};
