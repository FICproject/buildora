import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Zap, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { Product } from '@buildora/types';
import { formatCurrency } from '@buildora/utils';
import { useCartStore } from '../../store/useCartStore';
import { useWishlistStore } from '../../store/useWishlistStore';
import { useStoreConfigStore } from '../../store/useStoreConfigStore';
import { useAuthStore } from '../../store/useAuthStore';
import { QuantityControl } from '../ui/QuantityControl';
import { VariantSelectionModal } from './VariantSelectionModal';
import { BulkPriceTrigger } from './BulkPriceTrigger';

export interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const navigate = useNavigate();
  const { items, addItem, updateQuantity, removeItem } = useCartStore();
  const { isInWishlist, toggleItem } = useWishlistStore();
  const { requireAuth } = useAuthStore();
  const freeThreshold = useStoreConfigStore((s) => s.config?.deliveryConfig?.freeShippingThreshold ?? 1000);

  const isWishlisted = isInWishlist(product.id);

  // Multi-image gallery state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Variant selector modal state
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);

  const images = product.images && product.images.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80'];

  const hasMultipleImages = images.length > 1;
  const hasMultipleVariants = !!(product.variants && product.variants.length > 1);

  // Cart state for single-variant products
  const singleCartItem =
    items.find((i) => i.productId === product.id && !i.variantId) ||
    items.find((i) => i.productId === product.id);
  const singleCartQty = singleCartItem ? singleCartItem.quantity : 0;

  // Cart count for multi-variant products
  const variantCartItems = items.filter((i) => i.productId === product.id);
  const totalVariantCartQty = variantCartItems.reduce((sum, i) => sum + i.quantity, 0);

  // Image Navigation Handlers
  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handleDotClick = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex(index);
  };

  // Mobile Touch Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        // Swiped left -> next
        setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
      } else {
        // Swiped right -> prev
        setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
      }
    }
    setTouchStartX(null);
  };

  // Cart Handlers for single variant
  const handleDecreaseSingle = () => {
    if (singleCartQty <= 1) {
      removeItem(product.id, singleCartItem?.variantId);
    } else {
      updateQuantity(product.id, singleCartQty - 1, singleCartItem?.variantId);
    }
  };

  const handleIncreaseSingle = () => {
    updateQuantity(product.id, singleCartQty + 1, singleCartItem?.variantId);
  };

  const handleAddSingle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const singleVariant = product.variants && product.variants.length === 1 ? product.variants[0] : undefined;
    addItem(product, 1, singleVariant);
  };

  const handleOpenOptions = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOptionsModalOpen(true);
  };

  const isAsap = product.deliverySpeedAvailable?.includes('ASAP_60');

  // Subtitle / specification highlight
  const specSubtitle =
    product.specifications?.['Grade'] ||
    product.specifications?.['Tile Dimensions'] ||
    product.specifications?.['Thickness'] ||
    product.specifications?.['Standard'] ||
    product.unit ||
    '';

  return (
    <>
      <div className="group relative flex flex-col bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-md transition-all duration-200 overflow-hidden text-left h-full justify-between">
        {/* Top Badges & Wishlist */}
        <div className="absolute top-2 left-2 right-2 z-10 flex items-center justify-between pointer-events-none">
          <div className="flex flex-col gap-1 pointer-events-auto">
            {product.discount > 0 && (
              <span className="inline-flex items-center text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-sm bg-blue-600 text-white shadow-2xs">
                Save {product.discount}%
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (
                !requireAuth(
                  { type: 'WISHLIST_ADD', product },
                  { reason: `Sign in to save "${product.name}" to your Wishlist.` }
                )
              ) {
                return;
              }
              toggleItem(product);
            }}
            className={`p-1.5 rounded-full pointer-events-auto transition-colors shadow-2xs ${
              isWishlisted
                ? 'bg-rose-50 text-rose-600'
                : 'bg-white/90 text-slate-400 hover:text-rose-500 hover:bg-white'
            }`}
            title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
          >
            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Product Image Area with Multi-Image Carousel */}
        <div
          className="relative aspect-square bg-white flex items-center justify-center p-2.5 sm:p-3 overflow-hidden select-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <Link
            to={`/products/${product.slug}`}
            className="w-full h-full flex items-center justify-center cursor-pointer"
          >
            <img
              src={images[currentImageIndex] || images[0]}
              alt={product.name}
              className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </Link>

          {!product.inStock && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
              <span className="bg-red-600 text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Out of Stock
              </span>
            </div>
          )}

          {/* Carousel Prev/Next Buttons (Visible on desktop hover) */}
          {hasMultipleImages && (
            <>
              <button
                type="button"
                onClick={handlePrevImage}
                className="absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNextImage}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer"
                aria-label="Next image"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              {/* Dots Indicator in bottom-right corner */}
              <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1 bg-black/25 backdrop-blur-xs px-1.5 py-0.5 rounded-full pointer-events-auto">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => handleDotClick(e, idx)}
                    className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${
                      currentImageIndex === idx
                        ? 'bg-white w-3 scale-110'
                        : 'bg-white/50 hover:bg-white/80'
                    }`}
                    aria-label={`View image ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Product Details Content */}
        <div className="p-2.5 sm:p-3 flex flex-col flex-1 justify-between gap-2 border-t border-slate-100">
          <div className="space-y-1 min-w-0">
            {/* Pricing Row */}
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-sm sm:text-base font-black text-slate-900">
                {formatCurrency(product.price)}
              </span>
              {product.mrp > product.price && (
                <span className="text-[10px] sm:text-xs text-slate-400 line-through">
                  {formatCurrency(product.mrp)}
                </span>
              )}
              <span className="text-[9px] text-slate-400 font-normal">
                (Incl GST)
              </span>
            </div>

            {/* Bulk Price Link (opens centralized BulkPricingModal) */}
            <BulkPriceTrigger product={product} />

            {/* Product Title */}
            <Link
              to={`/products/${product.slug}`}
              className="block text-xs sm:text-[13px] font-semibold text-slate-800 hover:text-brand-blue-800 line-clamp-2 leading-snug min-h-[32px] sm:min-h-[34px]"
              title={product.name}
            >
              {product.name}
            </Link>

            {/* Badges & Delivery Info */}
            <div className="space-y-1 pt-0.5">
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
                <span className="font-bold text-[9px] text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">
                  Assured 1% cashback
                </span>
                <span>Free Delivery on ₹{freeThreshold.toLocaleString('en-IN')}+</span>
              </div>

              {/* Spec tag & Delivery time */}
              <div className="flex items-center justify-between text-[10px] text-slate-500 gap-1 pt-0.5 min-w-0">
                <span className="truncate min-w-0 flex-1" title={specSubtitle}>
                  {specSubtitle}
                </span>
                {isAsap && (
                  <span className="font-semibold text-slate-700 flex items-center gap-0.5 flex-shrink-0">
                    <Zap className="w-3 h-3 text-brand-orange-500 fill-brand-orange-500" />
                    60 Mins
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Button: Options vs Add vs Quantity Selector vs Out of Stock */}
          <div className="pt-1.5">
            {!product.inStock || product.stockCount <= 0 || (hasMultipleVariants && product.variants?.every((v) => !v.inStock || (v.stock !== undefined && v.stock <= 0))) ? (
              // Entire Product or All Variants are Out of Stock
              <button
                type="button"
                disabled
                className="w-full py-1.5 sm:py-2 px-3 rounded-xl text-xs sm:text-sm font-bold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed flex items-center justify-center select-none shadow-2xs"
              >
                Out of Stock
              </button>
            ) : hasMultipleVariants ? (
              // Multi-Variant: Show '[N] Options' Button
              <button
                type="button"
                onClick={handleOpenOptions}
                className="w-full py-1.5 sm:py-2 px-3 rounded-xl text-xs sm:text-sm font-bold border border-[#1e7e34] text-[#1e7e34] hover:bg-emerald-50/70 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs select-none"
              >
                <span>{product.variants!.length} Options</span>
                {totalVariantCartQty > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[#1e7e34] text-white text-[10px] font-black flex items-center justify-center">
                    {totalVariantCartQty}
                  </span>
                )}
              </button>
            ) : singleCartQty > 0 ? (
              // Single-Variant in cart: Show Universal Quantity Control
              <div className="flex justify-center w-full">
                <QuantityControl
                  quantity={singleCartQty}
                  onIncrease={handleIncreaseSingle}
                  onDecrease={handleDecreaseSingle}
                  max={product.stockCount}
                  min={0}
                  size="sm"
                />
              </div>
            ) : (
              // Single-Variant: Show '+ Add' Button
              <button
                type="button"
                onClick={handleAddSingle}
                disabled={!product.inStock}
                className="w-full py-1.5 sm:py-2 px-3 rounded-xl text-xs sm:text-sm font-bold border border-[#1e7e34] text-[#1e7e34] hover:bg-[#1e7e34] hover:text-white transition-colors flex items-center justify-center cursor-pointer shadow-2xs select-none disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Add
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Product Options Modal */}
      {hasMultipleVariants && (
        <VariantSelectionModal
          isOpen={isOptionsModalOpen}
          onClose={() => setIsOptionsModalOpen(false)}
          product={product}
        />
      )}
    </>
  );
};
