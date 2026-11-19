import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Zap, Plus, Check } from 'lucide-react';
import { Product } from '@buildora/types';
import { formatCurrency } from '@buildora/utils';
import { useCartStore } from '../../store/useCartStore';
import { useWishlistStore } from '../../store/useWishlistStore';
import { RatingStars } from '../ui/RatingStars';
import { Badge } from '../ui/Badge';
import { QuantityControl } from '../ui/QuantityControl';

export interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { items, addItem, updateQuantity } = useCartStore();
  const { isInWishlist, toggleItem } = useWishlistStore();

  const isWishlisted = isInWishlist(product.id);
  const cartItem = items.find((i) => i.productId === product.id && !i.variantId);
  const inCartQty = cartItem ? cartItem.quantity : 0;

  const isAsap = product.deliverySpeedAvailable.includes('ASAP_60');

  return (
    <div className="group relative flex flex-col bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 shadow-card hover:shadow-card-hover transition-all duration-200 overflow-hidden">
      {/* Top badges & Wishlist */}
      <div className="absolute top-2 left-2 right-2 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex flex-col gap-1 pointer-events-auto">
          {product.discount > 0 && (
            <Badge variant="orange" size="sm">
              {product.discount}% OFF
            </Badge>
          )}
          {isAsap && (
            <span className="inline-flex items-center gap-1 bg-amber-500/90 text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
              <Zap className="w-2.5 h-2.5 fill-current" /> 60 MIN
            </span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleItem(product);
          }}
          className={`p-1.5 rounded-full pointer-events-auto transition-colors shadow-sm ${
            isWishlisted
              ? 'bg-rose-50 text-rose-600'
              : 'bg-white/90 text-slate-400 hover:text-rose-500 hover:bg-white'
          }`}
          title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart className={`w-3.5 sm:w-4 h-3.5 sm:h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Product Image */}
      <Link
        to={`/products/${product.slug}`}
        className="block relative aspect-square bg-slate-50 overflow-hidden"
      >
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {!product.inStock && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-red-600 text-white text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* Product Content */}
      <div className="p-2.5 sm:p-3.5 flex flex-col flex-grow justify-between">
        <div>
          {/* Brand */}
          <Link
            to={`/brands/${product.brandSlug}`}
            className="text-[10px] sm:text-[11px] font-bold text-brand-blue-700 uppercase tracking-wider hover:underline line-clamp-1"
          >
            {product.brand}
          </Link>

          {/* Product Title */}
          <Link
            to={`/products/${product.slug}`}
            className="block mt-1 text-xs sm:text-sm font-bold text-slate-800 hover:text-brand-blue-800 line-clamp-2 leading-snug min-h-[32px] sm:min-h-[36px]"
            title={product.name}
          >
            {product.name}
          </Link>

          {/* Unit / Pack Size */}
          <div className="mt-1 text-[11px] sm:text-xs text-slate-500 font-medium">
            Unit: {product.unit}
          </div>

          {/* Rating */}
          <div className="mt-1.5">
            <RatingStars rating={product.rating} count={product.reviewCount} size="sm" />
          </div>
        </div>

        {/* Pricing & Cart Action */}
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-sm sm:text-base font-black text-slate-900">
                {formatCurrency(product.price)}
              </span>
              {product.mrp > product.price && (
                <span className="text-[10px] sm:text-xs text-slate-400 line-through">
                  {formatCurrency(product.mrp)}
                </span>
              )}
            </div>
            <div className="text-[9px] sm:text-[10px] text-slate-400">Incl. GST ({product.gstRate}%)</div>
          </div>

          <div className="flex-shrink-0">
            {inCartQty > 0 ? (
              <QuantityControl
                quantity={inCartQty}
                onIncrease={() => updateQuantity(product.id, inCartQty + 1)}
                onDecrease={() => updateQuantity(product.id, inCartQty - 1)}
                max={product.stockCount}
                size="sm"
              />
            ) : (
              <button
                type="button"
                onClick={() => addItem(product, 1)}
                disabled={!product.inStock}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1 bg-brand-blue-900 hover:bg-brand-blue-800 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5" /> ADD
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
