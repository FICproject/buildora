import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronRight,
  RotateCcw,
  PackageOpen
} from 'lucide-react';
import {
  MASTER_CATEGORIES,
  MAIN_CATEGORIES_SEED,
  CHILD_CATEGORIES_SEED,
  NEW_LAUNCHES_CATEGORIES,
  LEGACY_CATEGORY_SLUG_ALIASES,
  filterConfigsToDimensions,
  getAvailableFiltersForCategory,
  applyCategoryFilters,
  ActiveCategoryFilters,
  CategoryFilterDimension
} from '@buildora/constants';
import { Category, Product, CategoryFilterConfiguration } from '@buildora/types';
import { api } from '../services/api';
import { ProductCard } from '../components/common/ProductCard';
import {
  CategoryHorizontalFilterBar,
  ActiveFilterChips
} from '../components/catalog';

function parseCategoryPageUrlFilters(
  searchParams: URLSearchParams
): ActiveCategoryFilters {
  const urlChildCats = (searchParams.get('child') || '')
    .split(',')
    .map((s) => s.trim())
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
    childCategories: urlChildCats,
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

  // Resolve canonical slug if a legacy new-launch or legacy category alias slug was passed
  const effectiveCategorySlug = useMemo(() => {
    if (!slug) return '';
    const nlCat = NEW_LAUNCHES_CATEGORIES.find((c) => c.slug === slug);
    const base = nlCat ? nlCat.masterCategorySlug : slug;
    return LEGACY_CATEGORY_SLUG_ALIASES[base.toLowerCase()] || base;
  }, [slug]);

  const [category, setCategory] = useState<any>(null);
  const [categoryUnavailable, setCategoryUnavailable] = useState(false);
  const [productList, setProductList] = useState<Product[]>([]);
  const [dynamicFilterDimensions, setDynamicFilterDimensions] = useState<CategoryFilterDimension[]>([]);
  const [hasConfiguredFilters, setHasConfiguredFilters] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const isMainCategoryPage = Boolean(
    category?.level === 'MAIN' ||
      (Array.isArray(category?.childCategories) && !category?.mainCategoryId)
  );

  const subQueryParam = useMemo(() => {
    if (subcategorySlug) return subcategorySlug;
    const raw = searchParams.get('sub') || '';
    const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
    return parts.length === 1 ? parts[0] : undefined;
  }, [subcategorySlug, searchParams]);

  const [activeFilters, setActiveFilters] = useState<ActiveCategoryFilters>(() =>
    parseCategoryPageUrlFilters(searchParams)
  );

  // Load category details and live products (supports both Main Category and Child Category pages)
  useEffect(() => {
    let active = true;
    const targetSlug = effectiveCategorySlug || slug;
    if (!targetSlug) return;

    const loadCategoryData = async (silent = false) => {
      if (!silent) setLoadingProducts(true);
      try {
        const cat = await api.getCategoryBySlug(targetSlug);
        if (!active) return;

        if (!cat || cat.isActive === false) {
          setCategory(null);
          setCategoryUnavailable(true);
          setProductList([]);
          setDynamicFilterDimensions([]);
          setHasConfiguredFilters(false);
          return;
        }

        if (subcategorySlug) {
          const subLow = subcategorySlug.toLowerCase();
          const hasActiveSub = (cat.subcategories || []).some(
            (s: any) =>
              s.isActive !== false &&
              (String(s.slug || '').toLowerCase() === subLow ||
                String(s.name || '').toLowerCase() === subLow)
          );
          if (!hasActiveSub) {
            setCategory(null);
            setCategoryUnavailable(true);
            setProductList([]);
            setDynamicFilterDimensions([]);
            setHasConfiguredFilters(false);
            return;
          }
        }

        const isMain = Boolean(cat.level === 'MAIN' || (Array.isArray(cat.childCategories) && !cat.mainCategoryId));
        const [prods, filtersRes] = await Promise.all([
          api.getProducts(isMain ? { mainCategory: targetSlug } : { category: targetSlug }),
          api.getFilters(targetSlug, subQueryParam),
        ]);
        if (!active) return;
        setCategory(cat);
        setCategoryUnavailable(false);
        setProductList(Array.isArray(prods) ? prods : []);
        const cfgs: CategoryFilterConfiguration[] = Array.isArray(filtersRes?.filterConfigs)
          ? filtersRes.filterConfigs
          : [];
        const nextDims = filterConfigsToDimensions(cfgs);
        const nextHasConfig =
          typeof filtersRes?.hasFilterConfiguration === 'boolean'
            ? filtersRes.hasFilterConfiguration
            : !isMain && cfgs.length > 0;
        setDynamicFilterDimensions(nextDims);
        setHasConfiguredFilters(nextHasConfig);

        // Validate active URL filter parameters cleanly against category taxonomy & active configured dimensions
        const validSubNeedles = new Set(
          (cat.subcategories || []).flatMap((s: any) =>
            [s.slug, s.name, s.id].filter(Boolean).map((v: string) => String(v).toLowerCase())
          )
        );
        const validChildNeedles = new Set(
          (cat.childCategories || []).flatMap((c: any) =>
            [c.slug, c.name, c.id].filter(Boolean).map((v: string) => String(v).toLowerCase())
          )
        );
        const activeDimIds = new Set(nextDims.map((d) => d.id.toLowerCase()));
        setActiveFilters((prev) => {
          let changed = false;
          const nextSubs = prev.subcategories.filter((s) => {
            const ok = validSubNeedles.size === 0 || validSubNeedles.has(s.toLowerCase());
            if (!ok) changed = true;
            return ok;
          });
          const nextChildCats = (prev.childCategories || []).filter((c) => {
            const ok = !isMain || validChildNeedles.size === 0 || validChildNeedles.has(c.toLowerCase());
            if (!ok) changed = true;
            return ok;
          });
          const nextSpecs: Record<string, string[]> = {};
          for (const [k, vals] of Object.entries(prev.specifications || {})) {
            if (!nextHasConfig || activeDimIds.has(k.toLowerCase())) {
              nextSpecs[k] = vals;
            } else {
              changed = true;
            }
          }
          const nextBrands = !nextHasConfig || activeDimIds.has('brand') || !cfgs.length ? prev.brands : [];
          if (nextBrands.length !== prev.brands.length) changed = true;
          return changed
            ? {
                ...prev,
                childCategories: nextChildCats,
                subcategories: nextSubs,
                brands: nextBrands,
                specifications: nextSpecs,
              }
            : prev;
        });
      } finally {
        if (active && !silent) setLoadingProducts(false);
      }
    };

    void loadCategoryData(false);

    const onRealtime = () => {
      void loadCategoryData(true);
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void loadCategoryData(true);
    };
    window.addEventListener('buildora:realtime:catalog', onRealtime);
    window.addEventListener('buildora:realtime:config', onRealtime);
    window.addEventListener('focus', onRealtime);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      active = false;
      window.removeEventListener('buildora:realtime:catalog', onRealtime);
      window.removeEventListener('buildora:realtime:config', onRealtime);
      window.removeEventListener('focus', onRealtime);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [slug, effectiveCategorySlug, subcategorySlug, subQueryParam]);

  // Synchronize URL changes (initial load + browser Back/Forward navigation) into filter state
  useEffect(() => {
    setActiveFilters(parseCategoryPageUrlFilters(searchParams));
  }, [searchParams]);

  // Push filter changes cleanly to URL so selections persist across navigation & browser Back/Forward
  const commitFiltersToUrl = useCallback(
    (next: ActiveCategoryFilters) => {
      setActiveFilters(next);

      const params = new URLSearchParams();
      if (next.childCategories && next.childCategories.length > 0) {
        params.set('child', next.childCategories.join(','));
      }
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

      setSearchParams(params);
    },
    [setSearchParams]
  );

  const activeSubcategory =
    activeFilters.subcategories?.length === 1
      ? category?.subcategories?.find(
          (s: any) =>
            s.slug.toLowerCase() === activeFilters.subcategories[0].toLowerCase() ||
            s.name.toLowerCase() === activeFilters.subcategories[0].toLowerCase()
        )
      : subcategorySlug
      ? category?.subcategories?.find(
          (s: any) =>
            s.slug.toLowerCase() === subcategorySlug.toLowerCase() ||
            s.name.toLowerCase() === subcategorySlug.toLowerCase()
        )
      : null;

  const mainChildCategories: Category[] = useMemo(() => {
    if (!isMainCategoryPage || !category) return [];
    if (Array.isArray(category?.childCategories) && category.childCategories.length > 0) {
      return category.childCategories;
    }
    return [];
  }, [isMainCategoryPage, category]);

  const parentMainCategory = useMemo(() => {
    if (isMainCategoryPage || !category) return null;
    if (category?.mainCategory?.slug) return category.mainCategory;
    return null;
  }, [isMainCategoryPage, category]);

  // All products belonging to this Main Category, Child Category, or Route Product Type
  const allCategoryProducts = useMemo(() => {
    if (!category) return [];
    if (isMainCategoryPage) {
      const childSlugs = mainChildCategories.map((c) => c.slug.toLowerCase());
      return productList.filter(
        (p) =>
          p.mainCategorySlug?.toLowerCase() === category.slug?.toLowerCase() ||
          p.mainCategoryId === category.id ||
          childSlugs.includes((p.childCategorySlug || p.categorySlug || '').toLowerCase())
      );
    }
    const childScoped = productList.filter(
      (p) =>
        (p.childCategorySlug || p.categorySlug || '').toLowerCase() === String(category.slug || '').toLowerCase() ||
        (p.childCategoryId || p.categoryId) === category.id
    );
    if (!subcategorySlug) return childScoped;

    const normalizeSlug = (val?: string) =>
      String(val || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    const routeNeedles = new Set(
      [
        subcategorySlug,
        normalizeSlug(subcategorySlug),
        activeSubcategory?.id,
        activeSubcategory?.slug,
        activeSubcategory?.name,
        normalizeSlug(activeSubcategory?.name),
      ]
        .filter(Boolean)
        .map((v) => String(v).toLowerCase())
    );
    return childScoped.filter((p: any) => {
      const candidates = [
        p.productTypeId,
        p.productTypeSlug,
        p.productTypeName,
        normalizeSlug(p.productTypeName),
        p.subcategoryId,
        p.subcategorySlug,
        p.subcategory,
        normalizeSlug(p.subcategory),
        p.productType,
        normalizeSlug(p.productType),
      ]
        .filter(Boolean)
        .map((v) => String(v).toLowerCase());
      return candidates.some((c) => routeNeedles.has(c));
    });
  }, [isMainCategoryPage, mainChildCategories, productList, category, subcategorySlug, activeSubcategory]);

  // Compute Child Category + Admin-configured dynamic specification filters with live faceted option counts
  const availableFilters = useMemo(() => {
    return getAvailableFiltersForCategory(
      category?.slug || '',
      allCategoryProducts,
      category?.subcategories || [],
      mainChildCategories,
      dynamicFilterDimensions,
      activeFilters,
      hasConfiguredFilters
    );
  }, [category, mainChildCategories, allCategoryProducts, dynamicFilterDimensions, activeFilters, hasConfiguredFilters]);

  // Apply active filters and sorting
  const filteredProducts = useMemo(() => {
    let result = applyCategoryFilters(
      allCategoryProducts,
      activeFilters,
      category?.slug || '',
      dynamicFilterDimensions
    );

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
  }, [allCategoryProducts, activeFilters, category, dynamicFilterDimensions]);

  // Filter change handlers
  const handleResetFilters = () => {
    commitFiltersToUrl({
      childCategories: [],
      brands: [],
      subcategories: [],
      inStockOnly: false,
      asapOnly: false,
      specifications: {},
      sortBy: activeFilters.sortBy
    });
  };

  const handleRemoveChildCategory = (childCat: string) => {
    commitFiltersToUrl({
      ...activeFilters,
      childCategories: (activeFilters.childCategories || []).filter((c) => c !== childCat)
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

  if (loadingProducts && !category && !categoryUnavailable) {
    return (
      <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-10">
        <div className="h-8 w-64 rounded-xl bg-slate-100 animate-pulse mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 animate-pulse">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="h-72 rounded-2xl bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  if (categoryUnavailable || !category) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <div className="p-10 sm:p-14 bg-white rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
            <PackageOpen className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              Category Currently Unavailable
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              This category is currently inactive or unavailable. Please explore our active building material categories.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/products"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-brand-blue-900 text-white hover:bg-brand-blue-950 transition-colors shadow-sm"
            >
              Browse Active Categories
            </Link>
            <Link
              to="/"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-4 space-y-3.5">
      {/* 1. Breadcrumb Navigation (Main Category -> Child Category -> Product Type; No "Categories") */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto no-scrollbar whitespace-nowrap">
        <Link to="/" className="hover:text-brand-blue-900 flex-shrink-0">
          Home
        </Link>
        {parentMainCategory && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <Link
              to={`/categories/${parentMainCategory.slug}`}
              className="hover:text-brand-blue-900 flex-shrink-0"
            >
              {parentMainCategory.name}
            </Link>
          </>
        )}
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

      {/* Child Category Quick Navigation Pills (on Main Category landing page) */}
      {isMainCategoryPage && mainChildCategories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {mainChildCategories.map((child: any) => (
            <Link
              key={child.id}
              to={`/categories/${child.slug}`}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:border-brand-blue-900 hover:text-brand-blue-900 hover:bg-brand-blue-50/40 whitespace-nowrap transition-colors shadow-2xs"
            >
              {child.name}
            </Link>
          ))}
        </div>
      )}

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
        onRemoveChildCategory={handleRemoveChildCategory}
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
