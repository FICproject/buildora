import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronRight,
  RotateCcw,
  PackageOpen,
  Rocket,
  Search,
  ExternalLink,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';
import {
  getAvailableFiltersForCategory,
  applyCategoryFilters,
  ActiveCategoryFilters,
} from '@buildora/constants';
import { Product } from '@buildora/types';
import { api } from '../services/api';
import { ProductCard } from '../components/common/ProductCard';
import {
  CategoryHorizontalFilterBar,
  ActiveFilterChips,
  SortOption,
} from '../components/catalog';

const NEW_LAUNCHES_SORT_OPTIONS: SortOption[] = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'latest', label: 'Latest Arrivals (Newest)' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'discount', label: 'Discount: High to Low' },
];

const PAGE_SIZE = 24;

export const NewLaunchesPage: React.FC = () => {
  const { collectionSlug, childSlug } = useParams<{
    collectionSlug?: string;
    childSlug?: string;
  }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const selectedChildQuery = childSlug || searchParams.get('child') || '';

  const [collections, setCollections] = useState<any[]>([]);
  const [activeCollection, setActiveCollection] = useState<any | null>(null);
  const [shortcuts, setShortcuts] = useState<any[]>([]);
  const [activeShortcut, setActiveShortcut] = useState<any | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchText, setSearchText] = useState(() => searchParams.get('q') || '');
  const [currentPage, setCurrentPage] = useState(1);

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
      sortBy: sortParam || 'latest',
    };
  });

  const loadNewLaunchesData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      if (collectionSlug) {
        const res = await api.getNewLaunchCollectionBySlug(collectionSlug, {
          child: selectedChildQuery || undefined,
          search: searchText || undefined,
        });
        if (res.notFound || !res.collection) {
          setActiveCollection(null);
          setCollections(res.collections || []);
          setShortcuts([]);
          setProducts([]);
          setErrorMsg('This New Launches promotional collection is unavailable or unpublished.');
        } else {
          setCollections(res.collections || []);
          setActiveCollection(res.collection);
          setShortcuts(res.shortcuts || []);
          setActiveShortcut(res.activeShortcut || null);
          setProducts(res.products || []);
        }
      } else {
        const res = await api.getNewLaunches({
          child: selectedChildQuery || undefined,
          search: searchText || undefined,
        });
        setCollections(res.collections || []);
        setActiveCollection(null);
        setShortcuts([]);
        setActiveShortcut(null);
        setProducts(res.products || []);
      }
    } catch {
      setErrorMsg('Unable to load New Launches collections at the moment.');
    } finally {
      setIsLoading(false);
    }
  }, [collectionSlug, selectedChildQuery, searchText]);

  useEffect(() => {
    setCurrentPage(1);
    void loadNewLaunchesData();
  }, [loadNewLaunchesData]);

  useEffect(() => {
    const onRealtime = () => {
      void loadNewLaunchesData();
    };
    window.addEventListener('buildora:realtime:catalog', onRealtime);
    window.addEventListener('buildora:realtime:config', onRealtime);
    return () => {
      window.removeEventListener('buildora:realtime:catalog', onRealtime);
      window.removeEventListener('buildora:realtime:config', onRealtime);
    };
  }, [loadNewLaunchesData]);

  // Keep filter query params synced in URL
  const syncFilterUrl = useCallback(
    (next: ActiveCategoryFilters, nextChild = selectedChildQuery, nextSearch = searchText) => {
      const params = new URLSearchParams();
      if (nextChild && !childSlug) params.set('child', nextChild);
      if (nextSearch.trim()) params.set('q', nextSearch.trim());
      if (next.brands.length > 0) params.set('brand', next.brands.join(','));
      if (next.specifications?.['type']?.length > 0) {
        params.set('type', next.specifications['type'].join(','));
      }
      if (next.specifications?.['size']?.length > 0) {
        params.set('size', next.specifications['size'].join(','));
      }
      if (next.minPrice !== undefined) params.set('minPrice', String(next.minPrice));
      if (next.maxPrice !== undefined) params.set('maxPrice', String(next.maxPrice));
      if (next.inStockOnly) params.set('inStock', 'true');
      if (next.asapOnly) params.set('asap', 'true');
      if (next.sortBy && next.sortBy !== 'latest') params.set('sort', next.sortBy);
      setSearchParams(params, { replace: true });
    },
    [selectedChildQuery, childSlug, searchText, setSearchParams]
  );

  const handleFiltersChange = (next: ActiveCategoryFilters) => {
    setActiveFilters(next);
    setCurrentPage(1);
    syncFilterUrl(next);
  };

  const availableFilters = useMemo(() => {
    return getAvailableFiltersForCategory('new-launches', products);
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = applyCategoryFilters(products, activeFilters, 'new-launches');
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.childCategoryName?.toLowerCase().includes(q)
      );
    }

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
  }, [products, activeFilters, searchText]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleResetFilters = () => {
    const empty: ActiveCategoryFilters = {
      brands: [],
      subcategories: [],
      inStockOnly: false,
      asapOnly: false,
      minPrice: undefined,
      maxPrice: undefined,
      specifications: {},
      sortBy: 'latest',
    };
    setSearchText('');
    setActiveFilters(empty);
    setCurrentPage(1);
    syncFilterUrl(empty, selectedChildQuery, '');
  };

  return (
    <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 space-y-6 animate-in fade-in-0 duration-200">
      {/* 1. Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto no-scrollbar whitespace-nowrap">
        <Link to="/" className="hover:text-brand-blue-900 flex-shrink-0 transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <Link
          to="/new-launches"
          className={`flex-shrink-0 transition-colors ${
            !activeCollection ? 'font-semibold text-slate-800' : 'hover:text-brand-blue-900'
          }`}
        >
          New Launches
        </Link>
        {activeCollection && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="font-semibold text-slate-800 flex-shrink-0">
              {activeCollection.title || activeCollection.name}
            </span>
          </>
        )}
        {activeShortcut && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="font-semibold text-brand-orange-600 flex-shrink-0">
              {activeShortcut.displayLabel}
            </span>
          </>
        )}
      </nav>

      {/* Error / Unpublished Collection Guard */}
      {errorMsg && !isLoading ? (
        <div className="py-12 px-6 bg-white rounded-2xl border border-amber-200 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black text-slate-900">{errorMsg}</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Browse all active Admin-published New Launches promotional collections or explore our permanent product categories.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              to="/new-launches"
              className="px-4 py-2 rounded-xl bg-brand-blue-900 text-white text-xs font-bold inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              View All New Launches
            </Link>
            <Link
              to="/products"
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold"
            >
              Browse Catalog
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* 2. Collection Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Rocket className="w-5 h-5 text-brand-orange-500" />
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {activeCollection
                    ? activeCollection.title || activeCollection.name
                    : 'New Launches Showcase'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                  {activeCollection?.badge || 'Promotional Collection'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 max-w-3xl">
                {activeCollection?.description ||
                  'Admin-curated promotional launch collections linking directly to our permanent category hierarchy and approved products.'}
              </p>
            </div>

            {/* Inline collection search */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search in New Launches..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-blue-900/20"
              />
            </div>
          </div>

          {/* 3. Promotional Collections Grid (shown on /new-launches root OR compact switcher) */}
          {!activeCollection && collections.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-700">
                  Promotional Collections ({collections.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {collections.map((col) => {
                  const activeShortcuts = (col.categoryMappings || []).filter(
                    (m: any) => m.isActive !== false && m.mappingStatus === 'MAPPED'
                  );
                  return (
                    <Link
                      key={col.id}
                      to={`/new-launches/${col.slug}`}
                      className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden hover:border-brand-blue-900 hover:shadow-md transition-all flex flex-col"
                    >
                      <div className="h-32 bg-slate-100 relative overflow-hidden">
                        {col.image || col.bannerImage ? (
                          <img
                            src={col.image || col.bannerImage}
                            alt={col.title || col.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-white">
                            <Rocket className="w-8 h-8 text-brand-orange-400" />
                          </div>
                        )}
                        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-slate-900/80 text-white text-[10px] font-bold">
                          {col.badge || 'NEW LAUNCH'}
                        </span>
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                        <div>
                          <h3 className="font-black text-sm text-slate-900 group-hover:text-brand-blue-900">
                            {col.title || col.name}
                          </h3>
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                            {col.description}
                          </p>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                          <span className="font-semibold text-slate-600">
                            {activeShortcuts.length} category shortcuts
                          </span>
                          <span className="font-bold text-brand-blue-900 inline-flex items-center gap-1">
                            Explore <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* 4. Child Category Shortcuts inside active collection */}
          {activeCollection && (
            <section className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Category Shortcuts ({shortcuts.length})
                  </span>
                  {activeCollection.categoryGroupName && (
                    <span className="text-[11px] text-slate-400">
                      • Primary group: {activeCollection.categoryGroupName}
                    </span>
                  )}
                </div>
                {activeShortcut && activeShortcut.categoryGroupSlug && activeShortcut.childCategorySlug && (
                  <Link
                    to={`/categories/${activeShortcut.categoryGroupSlug}/${activeShortcut.childCategorySlug}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-brand-blue-900 hover:underline"
                  >
                    Open full {activeShortcut.childCategoryName || activeShortcut.displayLabel} catalog
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>

              {shortcuts.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No active child category shortcuts configured for this collection yet.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/new-launches/${activeCollection.slug}`)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      !activeShortcut
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    All in {activeCollection.title || activeCollection.name}
                  </button>

                  {shortcuts.map((m) => {
                    const isSelected = activeShortcut?.id === m.id;
                    return (
                      <div key={m.id} className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => {
                            const nextParams = new URLSearchParams(searchParams);
                            nextParams.set('child', m.childCategorySlug || m.id);
                            navigate(`/new-launches/${activeCollection.slug}?${nextParams.toString()}`);
                          }}
                          className={`px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-brand-blue-900 text-white font-bold'
                              : 'text-slate-700 hover:bg-white'
                          }`}
                        >
                          {m.displayLabel}
                          {typeof m.productCount === 'number' && (
                            <span
                              className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {m.productCount}
                            </span>
                          )}
                        </button>
                        {m.categoryGroupSlug && m.childCategorySlug && (
                          <Link
                            to={`/categories/${m.categoryGroupSlug}/${m.childCategorySlug}`}
                            title={`Open ${m.displayLabel} product listing page`}
                            className="px-2 py-1.5 border-l border-slate-200 text-slate-400 hover:text-brand-blue-900 hover:bg-white"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* 5. Horizontal Filter Bar & Chips */}
          <CategoryHorizontalFilterBar
            availableFilters={availableFilters}
            activeFilters={activeFilters}
            onChangeFilters={handleFiltersChange}
            onResetFilters={handleResetFilters}
            totalResultsCount={filteredProducts.length}
            sortOptions={NEW_LAUNCHES_SORT_OPTIONS}
          />

          <ActiveFilterChips
            activeFilters={activeFilters}
            availableFilters={availableFilters}
            onRemoveBrand={(brand) =>
              handleFiltersChange({
                ...activeFilters,
                brands: activeFilters.brands.filter((b) => b !== brand),
              })
            }
            onRemoveSubcategory={(sub) =>
              handleFiltersChange({
                ...activeFilters,
                subcategories: activeFilters.subcategories.filter((s) => s !== sub),
              })
            }
            onRemoveSpec={(dimId, val) => {
              const cur = activeFilters.specifications[dimId] || [];
              const nextSpecs = { ...activeFilters.specifications };
              const filtered = cur.filter((v) => v !== val);
              if (filtered.length === 0) delete nextSpecs[dimId];
              else nextSpecs[dimId] = filtered;
              handleFiltersChange({ ...activeFilters, specifications: nextSpecs });
            }}
            onRemovePrice={() =>
              handleFiltersChange({ ...activeFilters, minPrice: undefined, maxPrice: undefined })
            }
            onRemoveInStock={() => handleFiltersChange({ ...activeFilters, inStockOnly: false })}
            onRemoveAsap={() => handleFiltersChange({ ...activeFilters, asapOnly: false })}
            onClearAll={handleResetFilters}
          />

          {/* 6. Product Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                <div
                  key={n}
                  className="bg-white rounded-2xl border border-slate-200 p-4 h-72 animate-pulse space-y-3"
                >
                  <div className="bg-slate-100 rounded-xl h-36 w-full" />
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                  <div className="h-8 bg-slate-100 rounded w-full mt-4" />
                </div>
              ))}
            </div>
          ) : paginatedProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                {paginatedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold disabled:opacity-40 cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="text-xs font-semibold text-slate-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold disabled:opacity-40 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="py-16 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <PackageOpen className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                No approved products match this selection
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Only Admin-approved &amp; published products mapped to this collection appear here. Try resetting filters or choosing another category shortcut.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-blue-900 hover:bg-brand-blue-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Filters
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
