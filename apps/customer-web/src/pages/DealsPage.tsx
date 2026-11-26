import React, { useEffect, useState } from 'react';
import { Sparkles, Zap, Copy, Check } from 'lucide-react';
import { Product } from '@buildora/types';
import { api } from '../services/api';
import { ProductCard } from '../components/common/ProductCard';

export const DealsPage: React.FC = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [discountedProducts, setDiscountedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDeals = async () => {
    setLoading(true);
    try {
      const res = await api.getDeals();
      setCoupons(res?.coupons || []);
      setDiscountedProducts(res?.products || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeals();
    const onRefresh = () => loadDeals();
    window.addEventListener('buildora:realtime:config', onRefresh);
    window.addEventListener('buildora:realtime:catalog', onRefresh);
    return () => {
      window.removeEventListener('buildora:realtime:config', onRefresh);
      window.removeEventListener('buildora:realtime:catalog', onRefresh);
    };
  }, []);

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
      {loading && coupons.length === 0 ? (
        <div className="text-center text-xs text-slate-500 py-8">Loading active offers &amp; vouchers...</div>
      ) : coupons.length === 0 ? (
        <div className="text-center text-xs text-slate-500 bg-white rounded-2xl border p-6">
          No active promo codes at the moment. Check back shortly!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {coupons.map((coupon) => (
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
                <h3 className="font-bold text-slate-800 text-sm mt-1">{coupon.title || coupon.code}</h3>
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
      )}

      {/* Discounted Products Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500 fill-current" />
          Special Price Materials on Promotion
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {discountedProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </div>
  );
};
