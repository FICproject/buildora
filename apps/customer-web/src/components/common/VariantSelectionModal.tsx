import React, { useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Product, ProductVariant } from '@buildora/types';
import { formatCurrency } from '@buildora/utils';
import { useCartStore } from '../../store/useCartStore';
import { QuantityControl } from '../ui/QuantityControl';

export interface VariantSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export const VariantSelectionModal: React.FC<VariantSelectionModalProps> = ({
  isOpen,
  onClose,
  product
}) => {
  const { items, addItem, updateQuantity, removeItem } = useCartStore();

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const variants: ProductVariant[] = product.variants && product.variants.length > 0
    ? product.variants
    : [
        {
          id: `${product.id}-default`,
          sku: product.sku,
          name: product.unit || 'Standard Unit',
          attributes: {},
          price: product.price,
          mrp: product.mrp,
          stock: product.stockCount,
          inStock: product.inStock,
          image: product.images[0]
        }
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dimmed Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Centered Modal Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="variant-modal-title"
        className="relative z-10 w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2
            id="variant-modal-title"
            className="text-base sm:text-lg font-black text-slate-900 truncate pr-3"
            title={product.name}
          >
            {product.name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close variant selector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Variant Items List */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-3 flex-1">
          {variants.map((v) => {
            const variantCartItem = items.find(
              (i) => i.productId === product.id && (i.variantId || undefined) === (v.id || undefined)
            );
            const inCartQty = variantCartItem ? variantCartItem.quantity : 0;
            const variantImg = v.image || product.images[0];
            const hasDiscount = v.mrp > v.price;

            return (
              <div
                key={v.id}
                className="rounded-2xl border border-slate-200 p-3 sm:p-4 flex items-center justify-between gap-3 hover:border-slate-300 transition-colors bg-white shadow-2xs"
              >
                {/* Left: Thumbnail and Variant Info */}
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-slate-50 border border-slate-100 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    <img
                      src={variantImg}
                      alt={v.name}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  </div>

                  <div className="min-w-0 space-y-1">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 truncate">
                      {v.name}
                    </h3>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      {hasDiscount && (
                        <span className="text-xs text-slate-400 line-through font-normal">
                          {formatCurrency(v.mrp)}
                        </span>
                      )}
                      <span className="font-black text-sm sm:text-base text-slate-900">
                        {formatCurrency(v.price)}
                      </span>
                      {hasDiscount && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          Save {formatCurrency(v.mrp - v.price)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Add Button or Variant-Specific Quantity Control */}
                <div className="flex-shrink-0">
                  {inCartQty > 0 ? (
                    <div className="flex items-center gap-1.5">
                      <QuantityControl
                        quantity={inCartQty}
                        onIncrease={() => updateQuantity(product.id, inCartQty + 1, v.id)}
                        onDecrease={() => {
                          if (inCartQty <= 1) {
                            removeItem(product.id, v.id);
                          } else {
                            updateQuantity(product.id, inCartQty - 1, v.id);
                          }
                        }}
                        max={v.stock}
                        min={0}
                        size="md"
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={!v.inStock}
                      onClick={() => addItem(product, 1, v)}
                      className="w-24 sm:w-28 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#1e7e34] hover:bg-[#18682a] text-white transition-colors shadow-xs flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed select-none cursor-pointer"
                    >
                      Add
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info note */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>All variants include {product.gstRate}% GST</span>
          <span className="font-semibold text-emerald-700 flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> 60-Min Site Delivery
          </span>
        </div>
      </div>
    </div>
  );
};
