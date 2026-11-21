import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, ChevronRight, Sparkles } from 'lucide-react';
import { SEED_PRODUCTS, MASTER_CATEGORIES } from '@buildora/constants';
import { Category, Product } from '@buildora/types';
import { api } from '../services/api';
import { ProductCard } from '../components/common/ProductCard';

export const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const [products, setProducts] = useState<Product[]>(SEED_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(MASTER_CATEGORIES);

  useEffect(() => {
    if (query) {
      api.getProducts({ search: query }).then((prods) => {
        if (prods && prods.length > 0) setProducts(prods);
      });
    }
    api.getCategories().then((cats) => {
      if (cats && cats.length > 0) setCategories(cats);
    });
  }, [query]);

  const matchedProducts = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.subcategory.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
    );
  }, [query, products]);

  const matchedCategories = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [query, categories]);

  return (
    <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-8 space-y-6">
      <nav className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link to="/" className="hover:text-brand-blue-900">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-semibold text-slate-800">Search Results</span>
      </nav>

      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-black text-slate-900">
          Search Results for "{query}"
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Found <strong className="text-slate-800">{matchedProducts.length}</strong> matching materials ready for delivery
        </p>
      </div>

      {/* Matched Categories */}
      {matchedCategories.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Matching Categories
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {matchedCategories.map((c) => (
              <Link
                key={c.id}
                to={`/categories/${c.slug}`}
                className="bg-brand-blue-50 text-brand-blue-900 border border-brand-blue-200 px-3 py-1 rounded-full font-bold hover:bg-brand-blue-100"
              >
                {c.name} &rarr;
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Products Results */}
      {matchedProducts.length === 0 ? (
        <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
          <Search className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800">No Materials Found Matching "{query}"</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try checking for typos or searching for generic terms such as 'cement', 'wire', 'adhesive', 'paint', or 'tools'.
          </p>
          <div className="pt-2">
            <Link
              to="/products"
              className="inline-block text-xs font-bold text-brand-blue-900 bg-brand-blue-50 px-4 py-2 rounded-xl hover:bg-brand-blue-100"
            >
              Browse Full Catalogue
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {matchedProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
};
