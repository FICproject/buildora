import React, { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  SlidersHorizontal,
  X,
  ChevronRight,
  RotateCcw,
  Search,
  Zap,
  Star
} from 'lucide-react';
import { MASTER_CATEGORIES, MASTER_BRANDS, SEED_PRODUCTS } from '@buildora/constants';
import { Category, Brand, Product } from '@buildora/types';
import { api } from '../services/api';
import { ProductCard } from '../components/common/ProductCard';
import { Button } from '../components/ui/Button';

export const ProductListingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL query params
  const initialCategory = searchParams.get('category') || '';
  const initialBrand = searchParams.get('brand') || '';
  const initialSearch = searchParams.get('search') || '';

  // Dynamic live backend data states
  const [products, setProducts] = useState<Product[]>(SEED_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(MASTER_CATEGORIES);
  const [brands, setBrands] = useState<Brand[]>(MASTER_BRANDS);
  const [isLoading, setIsLoading] = useState(false);

  // Local filter states
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedBrand, setSelectedBrand] = useState(initialBrand);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [asapOnly, setAsapOnly] = useState(false);
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState('relevance');
  const [localSearch, setLocalSearch] = useState(initialSearch);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Fetch categories and brands from Backend API on mount
  React.useEffect(() => {
    api.getCategories().then((c) => { if (c && c.length) setCategories(c); });
    api.getBrands().then((b) => { if (b && b.length) setBrands(b); });
  }, []);

  // Fetch products from Backend API whenever filters change
  React.useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    api.getProducts({
      category: selectedCategory || undefined,
      brand: selectedBrand || undefined,
      search: localSearch || undefined
    }).then((data) => {
      if (isMounted) {
        if (data && data.length > 0) setProducts(data);
        setIsLoading(false);
      }
    }).catch(() => {
      if (isMounted) setIsLoading(false);
    });
    return () => { isMounted = false; };
  }, [selectedCategory, selectedBrand, localSearch]);

  // Synchronize when URL changes
  React.useEffect(() => {
    if (searchParams.get('category')) setSelectedCategory(searchParams.get('category')!);
    if (searchParams.get('brand')) setSelectedBrand(searchParams.get('brand')!);
    if (searchParams.get('search')) setLocalSearch(searchParams.get('search')!);
  }, [searchParams]);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (selectedCategory) {
      result = result.filter((p) => p.categorySlug === selectedCategory);
    }
    if (selectedBrand) {
      result = result.filter((p) => p.brandSlug === selectedBrand);
    }
    if (inStockOnly) {
      result = result.filter((p) => p.inStock);
    }
    if (asapOnly) {
      result = result.filter((p) => p.deliverySpeedAvailable.includes('ASAP_60'));
    }
    if (minPrice !== '') {
      result = result.filter((p) => p.price >= Number(minPrice));
    }
    if (maxPrice !== '') {
      result = result.filter((p) => p.price <= Number(maxPrice));
    }
    if (minRating > 0) {
      result = result.filter((p) => p.rating >= minRating);
    }
    if (localSearch.trim()) {
      const q = localSearch.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortBy === 'price_asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'discount') {
      result.sort((a, b) => b.discount - a.discount);
    }

    return result;
  }, [
    selectedCategory,
    selectedBrand,
    inStockOnly,
    asapOnly,
    minPrice,
    maxPrice,
    minRating,
    sortBy,
    localSearch
  ]);

  const handleResetFilters = () => {
    setSelectedCategory('');
    setSelectedBrand('');
    setInStockOnly(false);
    setAsapOnly(false);
    setMinPrice('');
    setMaxPrice('');
    setMinRating(0);
    setLocalSearch('');
    setSearchParams({});
  };

  const activeFilterCount =
    (selectedCategory ? 1 : 0) +
    (selectedBrand ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (asapOnly ? 1 : 0) +
    (minPrice !== '' || maxPrice !== '' ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (localSearch ? 1 : 0);

  return (
    <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link to="/" className="hover:text-brand-blue-900">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-semibold text-slate-800">
          {selectedCategory
            ? categories.find((c) => c.slug === selectedCategory)?.name || 'Category'
            : 'All Construction Materials'}
        </span>
      </nav>

      {/* Listing Title & Sort Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            {selectedCategory
              ? categories.find((c) => c.slug === selectedCategory)?.name
              : 'Construction Materials Catalogue'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Showing <strong className="text-slate-800">{filteredProducts.length}</strong> items ready for site dispatch
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Mobile Filter Trigger */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMobileFilterOpen(true)}
            className="lg:hidden flex-1 sm:flex-initial"
            leftIcon={<SlidersHorizontal className="w-4 h-4" />}
          >
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </Button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            <span className="text-xs text-slate-500 hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue-500 w-full sm:w-auto"
            >
              <option value="relevance">Relevance</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Highest Customer Rating</option>
              <option value="discount">Biggest Discount %</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-slate-400 font-medium">Active:</span>
          {selectedCategory && (
            <span className="inline-flex items-center gap-1 bg-brand-blue-50 text-brand-blue-900 border border-brand-blue-200 text-xs px-2.5 py-1 rounded-full font-semibold">
              Category: {categories.find((c) => c.slug === selectedCategory)?.name}
              <X className="w-3.5 h-3.5 cursor-pointer" onClick={() => setSelectedCategory('')} />
            </span>
          )}
          {selectedBrand && (
            <span className="inline-flex items-center gap-1 bg-brand-blue-50 text-brand-blue-900 border border-brand-blue-200 text-xs px-2.5 py-1 rounded-full font-semibold">
              Brand: {brands.find((b) => b.slug === selectedBrand)?.name}
              <X className="w-3.5 h-3.5 cursor-pointer" onClick={() => setSelectedBrand('')} />
            </span>
          )}
          {asapOnly && (
            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 text-xs px-2.5 py-1 rounded-full font-semibold">
              ⚡ 60-Min Delivery Only
              <X className="w-3.5 h-3.5 cursor-pointer" onClick={() => setAsapOnly(false)} />
            </span>
          )}
          {inStockOnly && (
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs px-2.5 py-1 rounded-full font-semibold">
              In Stock Only
              <X className="w-3.5 h-3.5 cursor-pointer" onClick={() => setInStockOnly(false)} />
            </span>
          )}
          <button
            onClick={handleResetFilters}
            className="text-xs font-semibold text-red-600 hover:underline flex items-center gap-1 ml-2"
          >
            <RotateCcw className="w-3 h-3" /> Clear All
          </button>
        </div>
      )}

      {/* Main Grid + Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Filter Sidebar */}
        <aside className="hidden lg:block lg:col-span-1 space-y-6 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card h-fit sticky top-24">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-brand-blue-900" />
              Filter Products
            </h3>
            {activeFilterCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-slate-400 hover:text-red-600 font-semibold"
              >
                Reset
              </button>
            )}
          </div>

          {/* Quick Delivery Checkbox */}
          <div className="space-y-2">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={asapOnly}
                onChange={(e) => setAsapOnly(e.target.checked)}
                className="w-4 h-4 rounded text-brand-orange-500 focus:ring-brand-orange-400 border-slate-300"
              />
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-current" />
                60-Min Quick Dispatch
              </span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 rounded text-brand-blue-600 focus:ring-brand-blue-500 border-slate-300"
              />
              <span className="text-xs font-medium text-slate-700">In Stock Available</span>
            </label>
          </div>

          {/* Categories Selector */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Master Categories
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1 pr-1 text-xs">
              <button
                onClick={() => setSelectedCategory('')}
                className={`w-full text-left py-1.5 px-2 rounded-lg font-medium transition-colors ${
                  !selectedCategory
                    ? 'bg-brand-blue-50 text-brand-blue-900 font-bold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                All 28 Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`w-full text-left py-1.5 px-2 rounded-lg font-medium transition-colors truncate ${
                    selectedCategory === cat.slug
                      ? 'bg-brand-blue-50 text-brand-blue-900 font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Brands Selector */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Authorized Brands
            </div>
            <div className="space-y-1 text-xs">
              <button
                onClick={() => setSelectedBrand('')}
                className={`w-full text-left py-1.5 px-2 rounded-lg font-medium transition-colors ${
                  !selectedBrand
                    ? 'bg-brand-blue-50 text-brand-blue-900 font-bold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                All Brands
              </button>
              {brands.map((brand) => (
                <button
                  key={brand.id}
                  onClick={() => setSelectedBrand(brand.slug)}
                  className={`w-full text-left py-1.5 px-2 rounded-lg font-medium transition-colors truncate ${
                    selectedBrand === brand.slug
                      ? 'bg-brand-blue-50 text-brand-blue-900 font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {brand.name}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Price Range (₹)
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-blue-500 font-medium"
              />
              <span className="text-slate-400 text-xs">-</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-blue-500 font-medium"
              />
            </div>
          </div>

          {/* Customer Rating */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Minimum Rating
            </div>
            <div className="space-y-1 text-xs">
              {[4, 3, 2].map((r) => (
                <button
                  key={r}
                  onClick={() => setMinRating(minRating === r ? 0 : r)}
                  className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg transition-colors ${
                    minRating === r
                      ? 'bg-amber-50 text-amber-900 font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {r} Stars &amp; Above
                  </span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Product Grid Area */}
        <main className="lg:col-span-3">
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">No Materials Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No items match your currently applied filters. Try clearing your filters or searching for alternative construction materials.
              </p>
              <Button variant="primary" size="sm" onClick={handleResetFilters}>
                Reset All Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filter Drawer */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex justify-end lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="relative w-full max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 p-5 space-y-6 overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Filters</h3>
              <button onClick={() => setIsMobileFilterOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Same filter controls for mobile */}
            <div className="space-y-4 text-xs">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={asapOnly}
                  onChange={(e) => setAsapOnly(e.target.checked)}
                />
                <span className="font-bold">⚡ 60-Min Quick Dispatch</span>
              </label>

              <div>
                <div className="font-bold mb-1">Categories</div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="font-bold mb-1">Brands</div>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">All Brands</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.slug}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="flex-1"
              >
                Reset
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1"
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
