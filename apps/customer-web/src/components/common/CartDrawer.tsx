import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Trash2, ShoppingBag, ArrowRight, Zap, ShieldCheck } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import { useStoreConfigStore } from '../../store/useStoreConfigStore';
import { useAuthStore } from '../../store/useAuthStore';
import { formatCurrency } from '@buildora/utils';
import { QuantityControl } from '../ui/QuantityControl';
import { Button } from '../ui/Button';

export interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, getSummary, deliverySpeed } = useCartStore();
  const { requireAuth } = useAuthStore();
  const freeThreshold = useStoreConfigStore((s) => s.config?.deliveryConfig?.freeShippingThreshold ?? 1000);
  const summary = getSummary();

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-brand-blue-900" />
            <h3 className="font-bold text-slate-900">Your Construction Cart</h3>
            <span className="text-xs bg-brand-blue-100 text-brand-blue-800 font-semibold px-2 py-0.5 rounded-full">
              {summary.itemCount} items
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Delivery Bar */}
        <div className="bg-amber-50 px-4 py-2 border-b border-amber-100 text-xs text-amber-800 flex flex-wrap items-center justify-between gap-1 font-medium">
          {summary.discountedSubtotal >= freeThreshold ? (
            <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <Zap className="w-3.5 h-3.5 fill-current text-emerald-600" />
              You unlocked FREE site delivery!
            </span>
          ) : (
            <span>
              Add <strong className="text-amber-900">{formatCurrency(Math.max(0, freeThreshold - summary.discountedSubtotal))}</strong> more for FREE delivery
            </span>
          )}
          <span className="text-[10px] text-amber-600 uppercase font-bold">Standard min {formatCurrency(freeThreshold)}</span>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-slate-800">Your Cart is Empty</h4>
              <p className="text-xs text-slate-500 max-w-xs">
                Browse our 28 construction categories and add cement, electrical, plumbing, or tools to your cart.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose();
                  navigate('/products');
                }}
              >
                Start Shopping Materials
              </Button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={`${item.productId}-${item.variantId || 'main'}`}
                className="flex gap-3 p-3 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 transition-colors"
              >
                {/* Item Image */}
                <div className="w-16 h-16 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden flex-shrink-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-semibold text-brand-blue-700 uppercase">
                        {item.brand}
                      </div>
                      <Link
                        to={`/products/${item.slug}`}
                        onClick={onClose}
                        className="text-xs font-semibold text-slate-800 hover:text-brand-blue-800 line-clamp-1"
                      >
                        {item.name}
                      </Link>
                      <div className="text-[11px] text-slate-400">{item.unit}</div>
                    </div>
                    <button
                      onClick={() => removeItem(item.productId, item.variantId)}
                      className="text-slate-300 hover:text-red-500 transition-colors p-1"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <QuantityControl
                      quantity={item.quantity}
                      onIncrease={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                      onDecrease={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                      max={item.maxStock}
                      size="sm"
                    />
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-900">
                        {formatCurrency(item.totalPrice)}
                      </div>
                      {item.bulkDiscountPercentage > 0 && (
                        <div className="text-[10px] text-emerald-600 font-semibold">
                          {item.bulkDiscountPercentage}% Bulk Disc.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer / Summary */}
        {items.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50/50 space-y-3">
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(summary.subtotal)}</span>
              </div>
              {summary.itemDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Bulk Discount</span>
                  <span>- {formatCurrency(summary.itemDiscount)}</span>
                </div>
              )}
              {summary.couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Coupon Discount</span>
                  <span>- {formatCurrency(summary.couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Fee ({deliverySpeed === 'ASAP_60' ? '60-Min Express' : 'Standard'})</span>
                <span>{summary.deliveryFee === 0 ? 'FREE' : formatCurrency(summary.deliveryFee)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
                <span>Total Amount (Incl. GST)</span>
                <span className="text-brand-blue-900 text-base">
                  {formatCurrency(summary.grandTotal)}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  onClose();
                  navigate('/cart');
                }}
                className="flex-1"
              >
                View Cart
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  onClose();
                  if (
                    !requireAuth(
                      { type: 'CHECKOUT', source: 'CART_DRAWER' },
                      { reason: 'Sign in to continue with your checkout.' }
                    )
                  ) {
                    return;
                  }
                  navigate('/cart?autoCheckout=1');
                }}
                className="flex-1"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Checkout
              </Button>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Razorpay Verified &amp; GST Tax Invoice Guaranteed</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
