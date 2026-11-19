import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Scale, X, ShoppingCart, Trash2, CheckCircle2, Zap } from 'lucide-react';
import { useCompareStore } from '../store/useCompareStore';
import { useCartStore } from '../store/useCartStore';
import { formatCurrency } from '@buildora/utils';
import { RatingStars } from '../components/ui/RatingStars';
import { Button } from '../components/ui/Button';

export const ComparePage: React.FC = () => {
  const navigate = useNavigate();
  const { items, removeItem, clearCompare } = useCompareStore();
  const { addItem } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
          <Scale className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-slate-800">No Products in Comparison</h1>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Add up to 4 construction materials from any category to compare grades, technical specifications, prices, and delivery speeds side-by-side.
        </p>
        <Button variant="primary" size="md" onClick={() => navigate('/products')}>
          Explore Catalogue
        </Button>
      </div>
    );
  }

  // Collect all unique specification keys across compared products
  const allSpecKeys = Array.from(
    new Set(items.flatMap((item) => Object.keys(item.specifications || {})))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Compare Material Specifications ({items.length}/4)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Side-by-side engineering specifications and prices.
          </p>
        </div>
        <button
          onClick={clearCompare}
          className="text-xs font-semibold text-slate-400 hover:text-red-600 flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" /> Clear All
        </button>
      </div>

      <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-card">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50">
              <th className="p-4 w-44 font-bold text-slate-400 uppercase tracking-wider">
                Product Details
              </th>
              {items.map((prod) => (
                <th key={prod.id} className="p-4 min-w-[220px] max-w-[280px] align-top">
                  <div className="space-y-3">
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                      <img src={prod.images[0]} alt={prod.name} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeItem(prod.id)}
                        className="absolute top-2 right-2 p-1 rounded-full bg-white/90 text-slate-400 hover:text-red-600 shadow"
                        title="Remove"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-brand-blue-800 uppercase">
                        {prod.brand}
                      </span>
                      <Link
                        to={`/products/${prod.slug}`}
                        className="block font-bold text-slate-900 hover:text-brand-blue-900 mt-0.5 line-clamp-2"
                      >
                        {prod.name}
                      </Link>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-black text-slate-900">
                        {formatCurrency(prod.price)}
                      </span>
                      {prod.mrp > prod.price && (
                        <span className="text-slate-400 line-through text-[11px]">
                          {formatCurrency(prod.mrp)}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => addItem(prod, 1)}
                      className="w-full"
                      leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}
                    >
                      Add to Cart
                    </Button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* Category */}
            <tr className="hover:bg-slate-50/50">
              <td className="p-4 font-bold text-slate-700 bg-slate-50/30">Category</td>
              {items.map((prod) => (
                <td key={prod.id} className="p-4 font-medium text-slate-800">
                  {prod.category}
                </td>
              ))}
            </tr>

            {/* Rating */}
            <tr className="hover:bg-slate-50/50">
              <td className="p-4 font-bold text-slate-700 bg-slate-50/30">Customer Rating</td>
              {items.map((prod) => (
                <td key={prod.id} className="p-4">
                  <RatingStars rating={prod.rating} count={prod.reviewCount} />
                </td>
              ))}
            </tr>

            {/* Delivery Speed */}
            <tr className="hover:bg-slate-50/50">
              <td className="p-4 font-bold text-slate-700 bg-slate-50/30">Delivery Dispatch</td>
              {items.map((prod) => (
                <td key={prod.id} className="p-4">
                  {prod.deliverySpeedAvailable.includes('ASAP_60') ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                      <Zap className="w-3.5 h-3.5 fill-current" /> 60-Minute Site Dispatch
                    </span>
                  ) : (
                    <span className="text-slate-600 font-medium">Standard / Scheduled</span>
                  )}
                </td>
              ))}
            </tr>

            {/* Stock Availability */}
            <tr className="hover:bg-slate-50/50">
              <td className="p-4 font-bold text-slate-700 bg-slate-50/30">Stock Availability</td>
              {items.map((prod) => (
                <td key={prod.id} className="p-4">
                  {prod.inStock ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> In Stock ({prod.stockCount} units)
                    </span>
                  ) : (
                    <span className="text-red-600 font-bold">Out of Stock</span>
                  )}
                </td>
              ))}
            </tr>

            {/* Dynamic Specifications */}
            {allSpecKeys.map((key) => (
              <tr key={key} className="hover:bg-slate-50/50">
                <td className="p-4 font-bold text-slate-700 bg-slate-50/30">{key}</td>
                {items.map((prod) => (
                  <td key={prod.id} className="p-4 text-slate-800">
                    {prod.specifications[key] || '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
