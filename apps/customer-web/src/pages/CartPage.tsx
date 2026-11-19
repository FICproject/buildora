import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Trash2,
  Tag,
  Zap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Truck,
  RotateCcw
} from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { formatCurrency } from '@buildora/utils';
import { AVAILABLE_COUPONS } from '@buildora/constants';
import { QuantityControl } from '../components/ui/QuantityControl';
import { Button } from '../components/ui/Button';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    coupon,
    applyCoupon,
    removeCoupon,
    deliverySpeed,
    setDeliverySpeed,
    walletBalanceToUse,
    setWalletBalanceToUse,
    getSummary
  } = useCartStore();

  const { user } = useAuthStore();
  const summary = getSummary();

  const [couponInput, setCouponInput] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleApplyCoupon = (codeToApply?: string) => {
    const code = (codeToApply || couponInput).trim();
    if (!code) return;
    const res = applyCoupon(code);
    if (res.success) {
      setCouponFeedback({ type: 'success', text: res.message });
      setCouponInput('');
    } else {
      setCouponFeedback({ type: 'error', text: res.message });
    }
  };

  const handleToggleWallet = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked && user) {
      setWalletBalanceToUse(user.walletBalance);
    } else {
      setWalletBalanceToUse(0);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-black text-slate-900">Your Construction Cart is Empty</h1>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          You haven't added any construction materials yet. Browse our catalogue of 28 categories with quick 60-minute site delivery.
        </p>
        <div className="pt-2">
          <Button variant="primary" size="lg" onClick={() => navigate('/products')}>
            Browse 28 Material Categories
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Shopping Cart ({summary.itemCount} items)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Prices include GST. Free delivery unlocked above ₹1,999.
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-slate-400 hover:text-red-600 font-semibold flex items-center gap-1"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Empty Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          {items.map((item) => (
            <div
              key={`${item.productId}-${item.variantId || 'main'}`}
              className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-card flex flex-col sm:flex-row gap-4 justify-between"
            >
              {/* Product Info */}
              <div className="flex gap-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-20 h-20 rounded-xl object-cover bg-slate-50 border border-slate-100 flex-shrink-0"
                />
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-brand-blue-800 uppercase tracking-wider">
                    {item.brand}
                  </div>
                  <Link
                    to={`/products/${item.slug}`}
                    className="text-sm font-bold text-slate-900 hover:text-brand-blue-800 line-clamp-1"
                  >
                    {item.name}
                  </Link>
                  <div className="text-xs text-slate-400">Unit: {item.unit} &bull; SKU: {item.sku}</div>
                  <div className="text-xs font-semibold text-slate-700">
                    {formatCurrency(item.effectiveUnitPrice)}{' '}
                    <span className="text-[10px] text-slate-400 font-normal">/ unit</span>
                  </div>
                </div>
              </div>

              {/* Quantity & Item Total */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <div className="flex items-center gap-2">
                  <QuantityControl
                    quantity={item.quantity}
                    onIncrease={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                    onDecrease={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                    max={item.maxStock}
                    size="md"
                  />
                  <button
                    onClick={() => removeItem(item.productId, item.variantId)}
                    className="text-slate-300 hover:text-red-600 transition-colors p-1"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-right">
                  <div className="text-base font-black text-slate-900">
                    {formatCurrency(item.totalPrice)}
                  </div>
                  {item.bulkDiscountPercentage > 0 && (
                    <div className="text-[11px] text-emerald-600 font-bold">
                      {item.bulkDiscountPercentage}% Bulk Discount
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Delivery Speed Selector Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-card space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Truck className="w-4 h-4 text-brand-orange-500" />
              Select Site Delivery Speed
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  deliverySpeed === 'ASAP_60'
                    ? 'border-brand-blue-500 bg-brand-blue-50/50 text-brand-blue-900 font-semibold'
                    : 'border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="deliverySpeed"
                    checked={deliverySpeed === 'ASAP_60'}
                    onChange={() => setDeliverySpeed('ASAP_60')}
                    className="text-brand-blue-900"
                  />
                  <div>
                    <div className="font-bold flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-500 fill-current" />
                      60-Min Quick Dispatch
                    </div>
                    <div className="text-[11px] text-slate-500">Dedicated express mini-truck</div>
                  </div>
                </div>
                <span className="font-bold">{summary.discountedSubtotal >= 1999 ? 'FREE' : '₹149'}</span>
              </label>

              <label
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  deliverySpeed === 'SCHEDULED'
                    ? 'border-brand-blue-500 bg-brand-blue-50/50 text-brand-blue-900 font-semibold'
                    : 'border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="deliverySpeed"
                    checked={deliverySpeed === 'SCHEDULED'}
                    onChange={() => setDeliverySpeed('SCHEDULED')}
                    className="text-brand-blue-900"
                  />
                  <div>
                    <div className="font-bold">Scheduled / Standard Slot</div>
                    <div className="text-[11px] text-slate-500">Tomorrow morning 8:00 AM</div>
                  </div>
                </div>
                <span className="font-bold">{summary.discountedSubtotal >= 1999 ? 'FREE' : '₹99'}</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right: Order Summary & Coupon */}
        <div className="lg:col-span-4 space-y-4">
          {/* Coupon Box */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-card space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-brand-orange-500" />
              Apply Coupon Code
            </h3>

            {coupon ? (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-emerald-800">{coupon.code} Applied</div>
                  <div className="text-[11px] text-emerald-600">{coupon.description}</div>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-slate-400 hover:text-red-600 font-bold"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter code (e.g. BUILD60)"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-2 text-xs font-bold uppercase tracking-wider border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-blue-500"
                />
                <Button variant="primary" size="sm" onClick={() => handleApplyCoupon()}>
                  Apply
                </Button>
              </div>
            )}

            {couponFeedback && (
              <p
                className={`text-xs font-medium flex items-center gap-1 ${
                  couponFeedback.type === 'success' ? 'text-emerald-700' : 'text-red-600'
                }`}
              >
                {couponFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5" />
                )}
                {couponFeedback.text}
              </p>
            )}

            {/* Quick Coupon Chips */}
            {!coupon && (
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Available Coupons</div>
                {AVAILABLE_COUPONS.map((c) => (
                  <div
                    key={c.code}
                    onClick={() => handleApplyCoupon(c.code)}
                    className="cursor-pointer p-2 rounded-lg border border-dashed border-slate-200 hover:border-brand-blue-400 hover:bg-brand-blue-50/30 text-xs flex items-center justify-between transition-colors"
                  >
                    <div>
                      <span className="font-bold text-brand-blue-900">{c.code}</span>
                      <p className="text-[10px] text-slate-500">{c.description}</p>
                    </div>
                    <span className="text-[10px] font-bold text-brand-blue-700">TAP TO APPLY</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Wallet Balance Usage */}
          {user && user.walletBalance > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-card flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-800">Use Buildora Wallet Balance</span>
                <p className="text-[11px] text-slate-500">Available: {formatCurrency(user.walletBalance)}</p>
              </div>
              <input
                type="checkbox"
                checked={walletBalanceToUse > 0}
                onChange={handleToggleWallet}
                className="w-4 h-4 rounded text-brand-blue-900"
              />
            </div>
          )}

          {/* Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-card space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              Order Bill Summary
            </h3>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span>{formatCurrency(summary.subtotal)}</span>
              </div>
              {summary.itemDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Bulk Discount</span>
                  <span>- {formatCurrency(summary.itemDiscount)}</span>
                </div>
              )}
              {summary.couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Coupon Discount</span>
                  <span>- {formatCurrency(summary.couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>GST Tax (Included)</span>
                <span>{formatCurrency(summary.gstTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Site Delivery Fee</span>
                <span>{summary.deliveryFee === 0 ? 'FREE' : formatCurrency(summary.deliveryFee)}</span>
              </div>
              {summary.walletUsed > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Wallet Credits Used</span>
                  <span>- {formatCurrency(summary.walletUsed)}</span>
                </div>
              )}
              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline text-sm font-black text-slate-900">
                <span>Grand Total</span>
                <span className="text-xl text-brand-blue-900">{formatCurrency(summary.grandTotal)}</span>
              </div>
            </div>

            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/checkout')}
              className="w-full mt-4"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Proceed to Site Checkout
            </Button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Razorpay Verified Gateway &bull; Tax Invoice Issued</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
