import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChevronRight,
  RotateCcw,
  PackageOpen
} from 'lucide-react';
import {
  MASTER_CATEGORIES,
  NEW_LAUNCHES_CATEGORIES,
  SEED_PRODUCTS,
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

export const CategoryPage: React.FC = () => {
  const { slug, subcategorySlug } = useParams<{ slug: string; subcategorySlug?: string }>();

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
  const [productList, setProductList] = useState<Product[]>(SEED_PRODUCTS);

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
    const targetSlug = effectiveCategorySlug || slug;
    if (targetSlug) {
      const fallbackCat = MASTER_CATEGORIES.find((c) => c.slug === targetSlug);
      if (fallbackCat) setCategory(fallbackCat);

      api.getCategoryBySlug(targetSlug).then((cat) => {
        if (cat) setCategory(cat);
      });

      api.getProducts({ category: targetSlug }).then((prods) => {
        if (prods && prods.length > 0) {
          setProductList(prods);
        } else {
          // Fallback to seed products for this category
          const categorySeed = SEED_PRODUCTS.filter((p) => p.categorySlug === targetSlug);
          if (categorySeed.length > 0) {
            setProductList(categorySeed);
          }
        }
      });
    }
  }, [slug, effectiveCategorySlug]);

  // Sync subcategory route param with activeFilters
  useEffect(() => {
    if (subcategorySlug && category) {
      const foundSub = category.subcategories?.find(
        (s) => s.slug === subcategorySlug || s.name.toLowerCase() === subcategorySlug.toLowerCase()
      );
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
    ? category.subcategories?.find(
        (s) => s.slug === subcategorySlug || s.name.toLowerCase() === subcategorySlug.toLowerCase()
      )
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

  return (
    <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 space-y-5">
      {/* 1. Breadcrumb Navigation */}
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
        onRemoveBrand={handleRemoveBrand}
        onRemoveSubcategory={handleRemoveSubcategory}
        onRemoveSpec={handleRemoveSpec}
        onRemovePrice={handleRemovePrice}
        onRemoveInStock={handleRemoveInStock}
        onRemoveAsap={handleRemoveAsap}
        onClearAll={handleResetFilters}
      />

      {/* 5. Full-Width Product Grid */}
      {filteredProducts.length === 0 ? (
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
