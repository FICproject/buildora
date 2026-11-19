import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, Layers, ArrowRight } from 'lucide-react';
import { MASTER_CATEGORIES, SEED_PRODUCTS } from '@buildora/constants';
import { Category, Product } from '@buildora/types';
import { api } from '../services/api';
import { ProductCard } from '../components/common/ProductCard';

export const CategoryPage: React.FC = () => {
  const { slug, subcategorySlug } = useParams<{ slug: string; subcategorySlug?: string }>();

  const [category, setCategory] = useState<Category>(
    MASTER_CATEGORIES.find((c) => c.slug === slug) || MASTER_CATEGORIES[0]
  );
  const [productList, setProductList] = useState<Product[]>(SEED_PRODUCTS);

  useEffect(() => {
    if (slug) {
      api.getCategoryBySlug(slug).then((cat) => {
        if (cat) setCategory(cat);
      });
      api.getProducts({ category: slug }).then((prods) => {
        if (prods && prods.length > 0) setProductList(prods);
      });
    }
  }, [slug]);

  const activeSubcategory = subcategorySlug
    ? category.subcategories.find((s) => s.slug === subcategorySlug)
    : null;

  // Filter products by category and optional subcategory
  const products = productList.filter((p) => {
    if (activeSubcategory) {
      return p.categorySlug === category.slug && p.subcategorySlug === activeSubcategory.slug;
    }
    return p.categorySlug === category.slug;
  });

  return (
    <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-8 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto no-scrollbar whitespace-nowrap">
        <Link to="/" className="hover:text-brand-blue-900 flex-shrink-0">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <Link to="/products" className="hover:text-brand-blue-900 flex-shrink-0">Categories</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <Link to={`/categories/${category.slug}`} className="font-semibold text-slate-800 flex-shrink-0">
          {category.name}
        </Link>
        {activeSubcategory && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="font-semibold text-brand-blue-900 flex-shrink-0">{activeSubcategory.name}</span>
          </>
        )}
      </nav>

      {/* Category Header Card */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-900 text-white min-h-[160px] flex items-center p-6 sm:p-10 shadow-lg">
        <img
          src={category.image}
          alt={category.name}
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="text-xs font-bold text-brand-orange-400 uppercase tracking-widest">
            {activeSubcategory ? `${category.name} Subcategory` : 'Master Construction Category'}
          </div>
          <h1 className="text-2xl sm:text-4xl font-black">
            {activeSubcategory ? activeSubcategory.name : category.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {category.description}
          </p>
        </div>
      </div>

      {/* Subcategories Horizontal Scroll/Grid */}
      <div className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Explore Subcategories
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 text-xs whitespace-nowrap">
          <Link
            to={`/categories/${category.slug}`}
            className={`px-3 py-1.5 rounded-xl border font-bold transition-all flex-shrink-0 ${
              !activeSubcategory
                ? 'bg-brand-blue-900 text-white border-brand-blue-900 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
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
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              {sub.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <h2 className="text-lg font-black text-slate-900">
            Available Materials ({products.length} items)
          </h2>
          <span className="text-xs text-slate-400">⚡ 60-Minute Site Delivery Available</span>
        </div>

        {products.length === 0 ? (
          <div className="p-12 bg-white rounded-2xl border text-center space-y-3">
            <h3 className="font-bold text-slate-800">Additional SKUs Being Stocked</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              We are actively restocking this specific subcategory at our regional hub. Check other subcategories in {category.name}.
            </p>
            <Link
              to={`/categories/${category.slug}`}
              className="inline-block text-xs font-bold text-brand-blue-800 hover:underline"
            >
              View All {category.name} Materials &rarr;
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
