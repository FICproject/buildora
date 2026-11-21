import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, Award, ShieldCheck } from 'lucide-react';
import { MASTER_BRANDS, SEED_PRODUCTS, MASTER_CATEGORIES } from '@buildora/constants';
import { BrandCard } from '../components/common/BrandCard';
import { ProductCard } from '../components/common/ProductCard';

export const BrandsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  // If specific brand slug selected
  const activeBrand = slug ? MASTER_BRANDS.find((b) => b.slug === slug) : null;
  const brandProducts = activeBrand
    ? SEED_PRODUCTS.filter((p) => p.brandSlug === activeBrand.slug)
    : [];

  if (activeBrand) {
    return (
      <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-8 space-y-8">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link to="/" className="hover:text-brand-blue-900">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link to="/brands" className="hover:text-brand-blue-900">Brands</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-800">{activeBrand.name}</span>
        </nav>

        {/* Brand Banner */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-card flex flex-col sm:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center p-3 flex-shrink-0 shadow-sm">
            <img src={activeBrand.logo} alt={activeBrand.name} className="w-full h-full object-contain" />
          </div>
          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" /> Authorized Direct Brand Partner
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{activeBrand.name}</h1>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              {activeBrand.description}
            </p>
          </div>
        </div>

        {/* Products by this brand */}
        <div className="space-y-4">
          <h2 className="text-xl font-black text-slate-900">
            {activeBrand.name} Materials ({brandProducts.length} items)
          </h2>
          {brandProducts.length === 0 ? (
            <div className="p-8 bg-white rounded-2xl border text-center text-xs text-slate-500">
              All materials for {activeBrand.name} are currently undergoing batch testing at our warehouse. Check back shortly.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {brandProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Brands Directory Overview
  return (
    <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-8 space-y-8">
      <div className="text-center max-w-xl mx-auto space-y-2">
        <h1 className="text-3xl font-black text-slate-900">Authorized Manufacturer Directory</h1>
        <p className="text-xs text-slate-500">
          We source 100% of our catalogue directly from primary manufacturing facilities with strict quality adherence.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {MASTER_BRANDS.map((brand) => (
          <BrandCard key={brand.id} brand={brand} />
        ))}
      </div>
    </div>
  );
};
