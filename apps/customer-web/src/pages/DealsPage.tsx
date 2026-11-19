import React, { useState } from 'react';
import { Tag, Sparkles, Zap, Copy, Check } from 'lucide-react';
import { AVAILABLE_COUPONS, SEED_PRODUCTS } from '@buildora/constants';
import { ProductCard } from '../components/common/ProductCard';

export const DealsPage: React.FC = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const discountedProducts = SEED_PRODUCTS.filter((p) => p.discount >= 10 || p.isDealOfTheDay);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-8 space-y-10">
      <div className="text-center max-w-xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 bg-brand-orange-100 text-brand-orange-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-brand-orange-500" /> Deals &amp; Vouchers
        </div>
        <h1 className="text-3xl font-black text-slate-900">
          Construction Offers &amp; Promo Codes
        </h1>
        <p className="text-xs text-slate-500">
          Active discount codes, first order site coupons, and bulk pricing promotions.
        </p>
      </div>

      {/* Coupons Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {AVAILABLE_COUPONS.map((coupon) => (
          <div
            key={coupon.code}
            className="bg-white rounded-2xl border-2 border-dashed border-brand-orange-300 p-5 shadow-sm space-y-3 relative overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-black text-brand-orange-600 tracking-wider">
                  {coupon.code}
                </span>
                <span className="text-[10px] bg-brand-orange-50 text-brand-orange-800 font-bold px-2 py-0.5 rounded">
                  {coupon.discountType === 'FIXED' ? `₹${coupon.discountValue} OFF` : `${coupon.discountValue}% OFF`}
                </span>
              </div>
              <h3 className="font-bold text-slate-800 text-sm mt-1">{coupon.title}</h3>
              <p className="text-xs text-slate-500 mt-1">{coupon.description}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Min Order: ₹{coupon.minOrderValue}</span>
              <button
                onClick={() => handleCopy(coupon.code)}
                className="flex items-center gap-1 text-xs font-bold text-brand-blue-900 bg-brand-blue-50 px-3 py-1.5 rounded-lg hover:bg-brand-blue-100 transition-colors"
              >
                {copiedCode === coupon.code ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy Code
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Discounted Products Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500 fill-current" />
          Special Price Materials on Promotion
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {discountedProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </div>
  );
};
