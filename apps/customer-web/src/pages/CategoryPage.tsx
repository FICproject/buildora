import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChevronRight,
  SlidersHorizontal,
  ArrowUpDown,
  RotateCcw,
  PackageOpen,
  Zap
} from 'lucide-react';
import {
  MASTER_CATEGORIES,
  SEED_PRODUCTS,
  getAvailableFiltersForCategory,
  applyCategoryFilters,
  ActiveCategoryFilters
} from '@buildora/constants';
import { Category, Product } from '@buildora/types';
import { api } from '../services/api';
import { ProductCard } from '../components/common/ProductCard';
import {
  CategoryFilterSidebar,
  ActiveFilterChips,
  MobileFilterDrawer
} from '../components/catalog';

export const CategoryPage: React.FC = () => {
  const { slug, subcategorySlug } = useParams<{ slug: string; subcategorySlug?: string }>();

  const [category, setCategory] = useState<Category>(
    MASTER_CATEGORIES.find((c) => c.slug === slug) || MASTER_CATEGORIES[0]
  );
  const [productList, setProductList] = useState<Product[]>(SEED_PRODUCTS);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Active filter state
  const [activeFilters, setActiveFilters] = useState<ActiveCategoryFilters>({
    brands: [],
    subcategories: [],
    inStockOnly: false,
    asapOnly: false,
    specifications: {},
    sortBy: 'relevance'
  });

  // Load category details and products
  useEffect(() => {
    if (slug) {
      const fallbackCat = MASTER_CATEGORIES.find((c) => c.slug === slug);
      if (fallbackCat) setCategory(fallbackCat);

      api.getCategoryBySlug(slug).then((cat) => {
        if (cat) setCategory(cat);
      });

      api.getProducts({ category: slug }).then((prods) => {
        if (prods && prods.length > 0) {
          setProductList(prods);
        } else {
          // Fallback to seed products for this category
          const categorySeed = SEED_PRODUCTS.filter((p) => p.categorySlug === slug);
          if (categorySeed.length > 0) {
            setProductList(categorySeed);
          }
        }
      });
    }
  }, [slug]);

  // Sync subcategory route param with activeFilters
  useEffect(() => {
    if (subcategorySlug && category) {
      const foundSub = category.subcategories?.find((s) => s.slug === subcategorySlug);
      const subValue = foundSub ? foundSub.name : subcategorySlug;
      setActiveFilters((prev) => ({
        ...prev,
        subcategories: [subValue]
      }));
    } else {
      setActiveFilters((prev) => ({
        ...prev,
        subcategories: []
      }));
    }
  }, [subcategorySlug, category]);

  const activeSubcategory = subcategorySlug
    ? category.subcategories?.find((s) => s.slug === subcategorySlug)
    : null;

  // All products belonging to this category
  const allCategoryProducts = useMemo(() => {
    return productList.filter((p) => p.categorySlug === category.slug);
  }, [productList, category.slug]);

  // Compute domain-specific available filters for this category
  const availableFilters = useMemo(() => {
    return getAvailableFiltersForCategory(category.slug, allCategoryProducts);
  }, [category.slug, allCategoryProducts]);

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
    setActiveFilters({
      brands: [],
      subcategories: [],
      inStockOnly: false,
      asapOnly: false,
      specifications: {},
      sortBy: activeFilters.sortBy
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

  const activeFilterCount =
    (activeFilters.brands?.length || 0) +
    (activeFilters.subcategories?.length || 0) +
    (activeFilters.inStockOnly ? 1 : 0) +
    (activeFilters.asapOnly ? 1 : 0) +
    (activeFilters.minPrice !== undefined || activeFilters.maxPrice !== undefined ? 1 : 0) +
    Object.values(activeFilters.specifications || {}).reduce(
      (acc, v) => acc + (v ? v.length : 0),
      0
    );

  return (
    <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto no-scrollbar whitespace-nowrap">
        <Link to="/" className="hover:text-brand-blue-900 flex-shrink-0">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <Link to="/products" className="hover:text-brand-blue-900 flex-shrink-0">
          Categories
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

      {/* Category Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-slate-900 text-white min-h-[150px] flex items-center p-6 sm:p-8 shadow-md">
        <img
          src={category.image}
          alt={category.name}
          className="absolute inset-0 w-full h-full object-cover opacity-25"
        />
        <div className="relative z-10 max-w-2xl space-y-1.5">
          <div className="text-[11px] font-bold text-brand-orange-400 uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-orange-500 animate-pulse" />
            {activeSubcategory ? `${category.name} Subcategory` : 'Master Construction Category'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {activeSubcategory ? activeSubcategory.name : category.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
            {category.description}
          </p>
        </div>
      </div>

      {/* Explore Subcategories Horizontal Selector */}
      {category.subcategories && category.subcategories.length > 0 && (
        <div className="space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Explore Subcategories
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 text-xs whitespace-nowrap">
            <Link
              to={`/categories/${category.slug}`}
              className={`px-3 py-1.5 rounded-xl border font-bold transition-all flex-shrink-0 ${
                !activeSubcategory
                  ? 'bg-brand-blue-900 text-white border-brand-blue-900 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              All {category.name}
            </Link>
            {category.subcategories.map((sub) => (
              <Link
                key={sub.id}
                to={`/categories/${category.slug}/${sub.slug}`}
                className={`px-3 py-1.5 rounded-xl border font-bold transition-all flex-shrink-0 ${
                  activeSubcategory?.slug === sub.slug
                    ? 'bg-brand-blue-900 text-white border-brand-blue-900 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {sub.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Main 2-Column Catalog Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Column: Desktop Filter Sidebar */}
        <div className="hidden lg:block lg:col-span-1 sticky top-24 self-start">
          <CategoryFilterSidebar
            availableFilters={availableFilters}
            activeFilters={activeFilters}
            onChangeFilters={setActiveFilters}
            onResetFilters={handleResetFilters}
            totalResultsCount={filteredProducts.length}
          />
        </div>

        {/* Right Column: Listing Header, Active Chips & Product Grid */}
        <div className="lg:col-span-3 space-y-4">
          {/* Header Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            {/* Left: Mobile Filter Button & Items Count */}
            <div className="flex items-center gap-3">
              {/* Mobile Filter Button */}
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(true)}
                className="lg:hidden inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-blue-900 text-white shadow-sm hover:bg-brand-blue-950 transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-brand-orange-500 text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <div className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>Available Materials</span>
                <span className="text-xs font-bold text-slate-500 px-2 py-0.5 rounded-full bg-slate-100">
                  {filteredProducts.length} items
                </span>
              </div>
            </div>

            {/* Right: 60-Min Badge & Sort Dropdown */}
            <div className="flex items-center gap-3 ml-auto">
              <span className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                <Zap className="w-3.5 h-3.5 text-brand-orange-500 fill-brand-orange-500" />
                60-Min Delivery Active
              </span>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline font-semibold">Sort By:</span>
                <select
                  aria-label="Sort products by"
                  value={activeFilters.sortBy || 'relevance'}
                  onChange={(e) =>
                    setActiveFilters((prev) => ({
                      ...prev,
                      sortBy: e.target.value
                    }))
                  }
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-blue-500 cursor-pointer"
                >
                  <option value="relevance">Relevance</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Customer Rating</option>
                  <option value="speed">Fastest Dispatch (60-Min)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Filter Chips */}
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

          {/* Products Grid or Empty Filter State */}
          {filteredProducts.length === 0 ? (
            <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                <PackageOpen className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-base">
                  No materials match your selected filters
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Try adjusting or clearing your filters to view more products in {category.name}.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-brand-blue-900 text-white hover:bg-brand-blue-950 transition-colors shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Clear All Filters
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4">
              {filteredProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile / Tablet Filter Drawer */}
      <MobileFilterDrawer
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        availableFilters={availableFilters}
        activeFilters={activeFilters}
        onChangeFilters={setActiveFilters}
        onResetFilters={handleResetFilters}
        totalResultsCount={filteredProducts.length}
      />
    </div>
  );
};
