import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Flame,
  Plus,
  Heart,
  ChevronRight,
  TrendingUp,
  History,
  CheckCircle2,
  Package
} from 'lucide-react';
import { Product, Category, Brand } from '@buildora/types';
import { api } from '../../services/api';
import { formatCurrency } from '@buildora/utils';
import { useCartStore } from '../../store/useCartStore';
import { useWishlistStore } from '../../store/useWishlistStore';

const POPULAR_SEARCH_TERMS = [
  'Cement',
  'Wires',
  'CPVC Pipes',
  'Waterproofing',
  'Vitrified Tiles',
  'Marine Plywood',
  'Interior Paint',
  'Power Tools',
];

export const SmartSearchBar: React.FC = () => {
  const navigate = useNavigate();
  const { addItem } = useCartStore();
  const { isInWishlist, toggleItem } = useWishlistStore();

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  // Fetch real catalog entities from backend & refresh on realtime catalog updates
  useEffect(() => {
    let active = true;
    const loadSearchCatalog = () => {
      Promise.all([api.getProducts(), api.getCategories(), api.getBrands()]).then(([p, c, b]) => {
        if (!active) return;
        if (Array.isArray(p)) setProducts(p);
        if (Array.isArray(c)) setCategories(c);
        if (Array.isArray(b)) setBrands(b);
      });
    };
    loadSearchCatalog();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') loadSearchCatalog();
    };
    window.addEventListener('buildora:realtime:catalog', loadSearchCatalog);
    window.addEventListener('focus', loadSearchCatalog);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      active = false;
      window.removeEventListener('buildora:realtime:catalog', loadSearchCatalog);
      window.removeEventListener('focus', loadSearchCatalog);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // Search History from LocalStorage
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('buildora_search_history');
      return saved ? JSON.parse(saved) : ['UltraTech PPC', 'Havells 2.5 sq mm', 'Waterproofing'];
    } catch {
      return ['UltraTech PPC', 'Havells 2.5 sq mm'];
    }
  });

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  // Build sequential data-driven placeholder phrases
  const placeholderPhrases = useMemo(() => {
    const list = [
      'Search for Cement',
      'Search for Tiles',
      'Search for Plywood',
      'Search for Paint',
      'Search for Waterproofing',
      'Search for Electrical Wires',
      'Search for Switches & Sockets',
      'Search for Plumbing Pipes',
      'Search for Bathroom Fittings',
      'Search for Kitchen Accessories',
      'Search for Power Tools',
      'Search for Door Locks',
      'Search for Ceiling Fans',
      'Search for Lighting',
      'Search for General Hardware'
    ];
    categories.forEach((cat) => {
      (cat.subcategories || []).slice(0, 2).forEach((sub) => {
        list.push(`Search for ${sub.name}`);
      });
    });
    return list;
  }, [categories]);

  // Rotating placeholder interval
  useEffect(() => {
    if (isFocused || query.trim().length > 0) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) return;

    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholderPhrases.length);
    }, 2800);

    return () => clearInterval(interval);
  }, [isFocused, query, placeholderPhrases.length]);

  // Click outside to close desktop dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setIsMobileSearchOpen(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Auto-focus mobile input when mobile overlay opens
  useEffect(() => {
    if (isMobileSearchOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => mobileInputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileSearchOpen]);

  const saveHistory = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    const updated = [trimmed, ...searchHistory.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 5);
    setSearchHistory(updated);
    try {
      localStorage.setItem('buildora_search_history', JSON.stringify(updated));
    } catch {}
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (query.trim()) {
      saveHistory(query);
      setIsOpen(false);
      setIsMobileSearchOpen(false);
      inputRef.current?.blur();
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleTermClick = (term: string) => {
    setQuery(term);
    saveHistory(term);
    setIsOpen(false);
    setIsMobileSearchOpen(false);
    navigate(`/search?q=${encodeURIComponent(term)}`);
  };

  // Filtered live results when user types
  const filteredProducts = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return products.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    ).slice(0, 4);
  }, [query, products]);

  const filteredCategories = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return categories.filter((c) =>
      c.name.toLowerCase().includes(q) || c.slug.includes(q)
    ).slice(0, 3);
  }, [query, categories]);

  const filteredBrands = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return brands.filter((b) =>
      b.name.toLowerCase().includes(q) || b.slug.includes(q)
    ).slice(0, 2);
  }, [query, brands]);

  // Section 2: New Launches Products
  const newLaunches = useMemo(() => {
    return products.slice(4, 8);
  }, [products]);

  const handleDesktopInputFocus = () => {
    if (window.innerWidth < 768) {
      setIsMobileSearchOpen(true);
    } else {
      setIsFocused(true);
      setIsOpen(true);
    }
  };

  return (
    <div ref={searchContainerRef} className="relative w-full">
      {/* 1. DESKTOP & TABLET INLINE SEARCH BAR */}
      <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={handleDesktopInputFocus}
          onBlur={() => setIsFocused(false)}
          placeholder=""
          aria-label="Search construction materials"
          className="w-full h-10 sm:h-11 pl-10 pr-24 text-xs sm:text-sm bg-slate-100/90 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-brand-blue-500 rounded-2xl focus:outline-none transition-all shadow-inner font-medium text-slate-900"
        />

        {/* Animated Rotating Placeholder overlay */}
        {query.length === 0 && (
          <div
            onClick={handleDesktopInputFocus}
            className="absolute left-10 right-24 pointer-events-none overflow-hidden h-5 flex items-center text-xs sm:text-sm text-slate-400 font-medium cursor-text"
          >
            <span
              key={placeholderIndex}
              className="truncate animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              {placeholderPhrases[placeholderIndex]}
            </span>
          </div>
        )}

        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />

        {query.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-20 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 rounded-full"
            aria-label="Clear search input"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          type="submit"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-brand-blue-900 hover:bg-brand-blue-800 text-white text-xs font-bold px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-colors shadow-sm flex items-center justify-center"
        >
          Search
        </button>
      </form>

      {/* 2. DESKTOP & TABLET ANCHORED SEARCH PANEL (>= 768px) */}
      {isOpen && (
        <div className="hidden md:block absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 max-h-[520px] overflow-y-auto">
          {query.trim().length > 0 ? (
            /* LIVE TYPED SUGGESTIONS */
            <div className="p-4 space-y-4">
              {filteredCategories.length > 0 && (
                <div className="space-y-1.5 pb-3 border-b border-slate-100">
                  <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                    Categories
                  </div>
                  {filteredCategories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/categories/${cat.slug}`}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-800"
                    >
                      <span>{cat.name}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </Link>
                  ))}
                </div>
              )}

              {filteredBrands.length > 0 && (
                <div className="space-y-1.5 pb-3 border-b border-slate-100">
                  <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                    Brands
                  </div>
                  {filteredBrands.map((brand) => (
                    <Link
                      key={brand.id}
                      to={`/brands/${brand.slug}`}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2.5 p-2 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-800"
                    >
                      <img src={brand.logo} alt={brand.name} className="w-6 h-6 object-contain rounded-md" />
                      <span>{brand.name}</span>
                    </Link>
                  ))}
                </div>
              )}

              {filteredProducts.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                    Matching Materials
                  </div>
                  <div className="divide-y divide-slate-100">
                    {filteredProducts.map((prod) => (
                      <Link
                        key={prod.id}
                        to={`/products/${prod.slug}`}
                        onClick={() => setIsOpen(false)}
                        className="py-2.5 flex items-center justify-between hover:bg-slate-50 rounded-xl px-2 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={prod.images[0]}
                            alt={prod.name}
                            className="w-11 h-11 object-cover rounded-xl bg-slate-100 flex-shrink-0 border border-slate-100"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate">
                              {prod.name}
                            </div>
                            <div className="text-[11px] text-brand-blue-700 font-semibold">
                              {prod.brand} &bull; <span className="font-mono text-slate-400">{prod.sku}</span>
                            </div>
                          </div>
                        </div>
                        <div className="font-black text-xs text-slate-900 flex-shrink-0 pl-3">
                          {formatCurrency(prod.price)}
                        </div>
                      </Link>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSearchSubmit()}
                    className="w-full text-center py-2.5 text-xs font-black text-brand-blue-900 hover:bg-slate-50 rounded-xl border-t border-slate-100 mt-2"
                  >
                    View all matching results for "{query}" &rarr;
                  </button>
                </div>
              ) : (
                filteredCategories.length === 0 && (
                  <div className="py-8 text-center text-xs text-slate-500">
                    No materials found for "{query}". Try checking our 28 categories below.
                  </div>
                )
              )}
            </div>
          ) : (
            /* PRE-TYPING INTERACTION PANEL */
            <div className="p-4 sm:p-5 space-y-6">
              {/* Popular & Recent Searches */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-brand-orange-500" /> Popular Searches
                  </span>
                  {searchHistory.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchHistory([]);
                        localStorage.removeItem('buildora_search_history');
                      }}
                      className="text-slate-400 hover:text-red-500 font-semibold lowercase"
                    >
                      clear recent
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_SEARCH_TERMS.map((term, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleTermClick(term)}
                      className="text-xs bg-slate-100 hover:bg-brand-blue-50 hover:text-brand-blue-900 text-slate-700 px-3 py-1.5 rounded-xl transition-all font-semibold flex items-center gap-1 border border-transparent hover:border-brand-blue-200"
                    >
                      <Search className="w-3 h-3 text-slate-400" />
                      <span>{term}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Shop by Category */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-brand-blue-700" /> Shop by Category
                  </span>
                  <Link
                    to="/products"
                    onClick={() => setIsOpen(false)}
                    className="text-xs font-bold text-brand-blue-800 hover:underline"
                  >
                    See All 28 &rarr;
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {categories.slice(0, 8).map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/categories/${cat.slug}`}
                      onClick={() => setIsOpen(false)}
                      className="group flex items-center gap-2 p-2 rounded-xl bg-slate-50 hover:bg-brand-blue-50/60 border border-slate-200/60 transition-colors"
                    >
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                      />
                      <span className="text-xs font-bold text-slate-800 group-hover:text-brand-blue-900 truncate">
                        {cat.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Newly Launched Materials */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="bg-brand-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                      New
                    </span>
                    <span className="text-xs font-black text-slate-900">
                      Newly Launched Materials
                    </span>
                  </div>
                  <Link
                    to="/products?sort=newest"
                    onClick={() => setIsOpen(false)}
                    className="text-xs font-bold text-brand-blue-800 hover:underline"
                  >
                    View All &rarr;
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {newLaunches.map((item) => {
                    const wishlisted = isInWishlist(item.id);
                    return (
                      <div
                        key={item.id}
                        className="group bg-slate-50/80 hover:bg-white rounded-2xl p-2.5 border border-slate-200/80 transition-all flex flex-col justify-between"
                      >
                        <div className="relative aspect-square rounded-xl bg-white overflow-hidden mb-2 border border-slate-100">
                          <img
                            src={item.images[0]}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleItem(item);
                            }}
                            className={`absolute top-1.5 right-1.5 p-1.5 rounded-full shadow-sm ${
                              wishlisted ? 'bg-rose-50 text-rose-600' : 'bg-white/90 text-slate-400 hover:text-rose-500'
                            }`}
                          >
                            <Heart className={`w-3.5 h-3.5 ${wishlisted ? 'fill-current' : ''}`} />
                          </button>
                        </div>

                        <Link
                          to={`/products/${item.slug}`}
                          onClick={() => setIsOpen(false)}
                          className="font-bold text-xs text-slate-900 group-hover:text-brand-blue-900 line-clamp-2 leading-tight"
                        >
                          {item.name}
                        </Link>

                        <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                          <div className="font-black text-xs text-slate-900">
                            {formatCurrency(item.price)}
                          </div>
                          <button
                            type="button"
                            onClick={() => addItem(item, 1)}
                            className="p-1 rounded-lg bg-brand-orange-500 hover:bg-brand-orange-600 text-white shadow-sm transition-colors"
                            title="Add to cart"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. DEDICATED FULL-SCREEN MOBILE SEARCH OVERLAY (< 768px) */}
      {isMobileSearchOpen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col md:hidden animate-in fade-in duration-150">
          {/* Mobile Search Header */}
          <div className="p-3 bg-white border-b border-slate-200 flex items-center gap-2 shadow-sm">
            <button
              type="button"
              onClick={() => setIsMobileSearchOpen(false)}
              className="p-2 -ml-1 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100"
              aria-label="Close search"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <form onSubmit={handleSearchSubmit} className="relative flex-1 flex items-center">
              <input
                ref={mobileInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search cement, wires, pipes, plywood..."
                className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-100 focus:bg-white border border-transparent focus:border-brand-blue-500 rounded-xl focus:outline-none font-medium"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              {query.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    mobileInputRef.current?.focus();
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>

            <button
              type="button"
              onClick={() => handleSearchSubmit()}
              className="bg-brand-blue-900 text-white font-bold text-xs px-3 py-2.5 rounded-xl shadow-sm"
            >
              Search
            </button>
          </div>

          {/* Mobile Search Body (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {query.trim().length > 0 ? (
              /* Mobile Live Results */
              <div className="space-y-4">
                {filteredCategories.length > 0 && (
                  <div className="space-y-1.5 pb-3 border-b border-slate-100">
                    <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                      Categories
                    </div>
                    {filteredCategories.map((cat) => (
                      <Link
                        key={cat.id}
                        to={`/categories/${cat.slug}`}
                        onClick={() => setIsMobileSearchOpen(false)}
                        className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-800"
                      >
                        <span>{cat.name}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </Link>
                    ))}
                  </div>
                )}

                {filteredBrands.length > 0 && (
                  <div className="space-y-1.5 pb-3 border-b border-slate-100">
                    <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                      Brands
                    </div>
                    {filteredBrands.map((brand) => (
                      <Link
                        key={brand.id}
                        to={`/brands/${brand.slug}`}
                        onClick={() => setIsMobileSearchOpen(false)}
                        className="flex items-center gap-2.5 p-2 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-800"
                      >
                        <img src={brand.logo} alt={brand.name} className="w-6 h-6 object-contain rounded-md" />
                        <span>{brand.name}</span>
                      </Link>
                    ))}
                  </div>
                )}

                {filteredProducts.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                      Matching Materials
                    </div>
                    <div className="divide-y divide-slate-100">
                      {filteredProducts.map((prod) => (
                        <Link
                          key={prod.id}
                          to={`/products/${prod.slug}`}
                          onClick={() => setIsMobileSearchOpen(false)}
                          className="py-2.5 flex items-center justify-between hover:bg-slate-50 rounded-xl px-1"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={prod.images[0]}
                              alt={prod.name}
                              className="w-12 h-12 object-cover rounded-xl bg-slate-100 flex-shrink-0 border border-slate-100"
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 truncate">
                                {prod.name}
                              </div>
                              <div className="text-[11px] text-brand-blue-700 font-semibold">
                                {prod.brand} &bull; <span className="font-mono text-slate-400">{prod.sku}</span>
                              </div>
                            </div>
                          </div>
                          <div className="font-black text-xs text-slate-900 flex-shrink-0 pl-2">
                            {formatCurrency(prod.price)}
                          </div>
                        </Link>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSearchSubmit()}
                      className="w-full text-center py-3 text-xs font-black text-brand-blue-900 bg-slate-50 rounded-xl border border-slate-200 mt-3"
                    >
                      View all matching results for "{query}" &rarr;
                    </button>
                  </div>
                ) : (
                  filteredCategories.length === 0 && (
                    <div className="py-12 text-center text-xs text-slate-500">
                      No materials found matching "{query}". Try checking our categories below.
                    </div>
                  )
                )}
              </div>
            ) : (
              /* Mobile Pre-Typing Discovery */
              <div className="space-y-6">
                {/* Popular Searches */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] font-black text-slate-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-brand-orange-500" /> Popular Searches
                    </span>
                    {searchHistory.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchHistory([]);
                          localStorage.removeItem('buildora_search_history');
                        }}
                        className="text-slate-400 hover:text-red-500 font-semibold lowercase"
                      >
                        clear recent
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_SEARCH_TERMS.map((term, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleTermClick(term)}
                        className="text-xs bg-slate-100 active:bg-brand-blue-100 text-slate-700 px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1"
                      >
                        <Search className="w-3 h-3 text-slate-400" />
                        <span>{term}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Shop by Category */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-brand-blue-700" /> Shop by Category
                    </span>
                    <Link
                      to="/products"
                      onClick={() => setIsMobileSearchOpen(false)}
                      className="text-xs font-bold text-brand-blue-800"
                    >
                      All 28 &rarr;
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {categories.slice(0, 6).map((cat) => (
                      <Link
                        key={cat.id}
                        to={`/categories/${cat.slug}`}
                        onClick={() => setIsMobileSearchOpen(false)}
                        className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200/60"
                      >
                        <img
                          src={cat.image}
                          alt={cat.name}
                          className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                        />
                        <span className="text-xs font-bold text-slate-800 truncate">
                          {cat.name}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Newly Launched */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">
                      Newly Launched Materials
                    </span>
                    <Link
                      to="/products?sort=newest"
                      onClick={() => setIsMobileSearchOpen(false)}
                      className="text-xs font-bold text-brand-blue-800"
                    >
                      View All &rarr;
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {newLaunches.map((item) => (
                      <div
                        key={item.id}
                        className="bg-slate-50 rounded-2xl p-2 border border-slate-200/70 flex flex-col justify-between"
                      >
                        <Link
                          to={`/products/${item.slug}`}
                          onClick={() => setIsMobileSearchOpen(false)}
                        >
                          <img
                            src={item.images[0]}
                            alt={item.name}
                            className="aspect-square w-full rounded-xl object-cover bg-white mb-1.5"
                          />
                          <div className="font-bold text-xs text-slate-900 line-clamp-1">
                            {item.name}
                          </div>
                        </Link>
                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-200/60">
                          <span className="text-xs font-black text-slate-900">
                            {formatCurrency(item.price)}
                          </span>
                          <button
                            type="button"
                            onClick={() => addItem(item, 1)}
                            className="p-1 rounded-lg bg-brand-orange-500 text-white"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
