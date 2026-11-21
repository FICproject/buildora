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
  RotateCcw,
  Info,
  ChevronDown,
  Building,
  HelpCircle,
  Check
} from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { formatCurrency } from '@buildora/utils';
import { AVAILABLE_COUPONS } from '@buildora/constants';
import { QuantityControl } from '../components/ui/QuantityControl';
import { Button } from '../components/ui/Button';
import { api } from '../services/api';

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
    unloadingOptions,
    setUnloadingOptions,
    walletBalanceToUse,
    setWalletBalanceToUse,
    getSummary
  } = useCartStore();

  const { user } = useAuthStore();
  const summary = getSummary();

  const [couponInput, setCouponInput] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [showHandlingInfo, setShowHandlingInfo] = useState(false);

  // Apply Coupon with Server-side validation
  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = (codeToApply || couponInput).trim();
    if (!code) return;

    setIsApplyingCoupon(true);
    setCouponFeedback(null);

    try {
      const backendRes = await api.validateCoupon(code, summary.discountedSubtotal);
      if (backendRes && backendRes.success && backendRes.data) {
        applyCoupon(code);
        setCouponFeedback({
          type: 'success',
          text: backendRes.message || `Coupon ${code} applied successfully!`
        });
        setCouponInput('');
      } else {
        setCouponFeedback({
          type: 'error',
          text: backendRes?.message || 'Invalid or inapplicable coupon code.'
        });
      }
    } catch {
      // Local fallback validation
      const res = applyCoupon(code);
      setCouponFeedback({
        type: res.success ? 'success' : 'error',
        text: res.message
      });
      if (res.success) setCouponInput('');
    } finally {
      setIsApplyingCoupon(false);
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
            Explore All 28 Master Categories
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-8 space-y-8">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Construction Shopping Cart ({summary.itemCount} items)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent site material pricing with verified B2B GST tax credit. Free delivery unlocked above ₹1,999.
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-slate-400 hover:text-red-600 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Empty Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (8 cols): Items, Delivery Speed, Unloading Service */}
        <div className="lg:col-span-8 space-y-5">
          {/* Cart Item Cards */}
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={`${item.productId}-${item.variantId || 'main'}`}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row gap-4 justify-between transition-all"
              >
                {/* Product Image & Details */}
                <div className="flex gap-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover bg-slate-50 border border-slate-100 flex-shrink-0"
                  />
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1 text-[10px] font-black tracking-wider text-brand-blue-800 uppercase bg-brand-blue-50 px-2 py-0.5 rounded">
                      {item.brand}
                    </div>
                    <Link
                      to={`/products/${item.slug}`}
                      className="text-sm sm:text-base font-bold text-slate-900 hover:text-brand-blue-800 line-clamp-1 block"
                    >
                      {item.name}
                    </Link>
                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-700">Pack / Unit: {item.unit}</span>
                      <span>&bull;</span>
                      <span className="font-mono text-slate-400">SKU: {item.sku}</span>
                    </div>

                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="text-sm font-bold text-slate-900">
                        {formatCurrency(item.effectiveUnitPrice)}
                      </span>
                      {item.mrp > item.effectiveUnitPrice && (
                        <span className="text-xs text-slate-400 line-through">
                          {formatCurrency(item.mrp)}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-normal">/ unit (Incl. GST)</span>
                    </div>

                    {/* Stock & Delivery badges */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                        <Check className="w-3 h-3 text-emerald-600" /> In Stock &bull; WH-BLR
                      </span>
                      <span className="inline-flex items-center gap-1 text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full">
                        <Zap className="w-3 h-3 text-amber-500 fill-current" /> 60-Min Dispatch Available
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quantity Controls & Line Total */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="flex items-center gap-2">
                    <QuantityControl
                      quantity={item.quantity}
                      onIncrease={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                      onDecrease={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                      onChangeQuantity={(newQty) => updateQuantity(item.productId, newQty, item.variantId)}
                      max={item.maxStock}
                      size="md"
                      showBulkSteppers={true}
                    />
                    <button
                      onClick={() => removeItem(item.productId, item.variantId)}
                      className="text-slate-300 hover:text-red-600 transition-colors p-1.5 cursor-pointer rounded-lg hover:bg-slate-50"
                      title="Remove item from cart"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-right">
                    <div className="text-base sm:text-lg font-black text-slate-900">
                      {formatCurrency(item.totalPrice)}
                    </div>
                    {item.bulkDiscountPercentage > 0 && (
                      <div className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                        {item.bulkDiscountPercentage}% Bulk Tier Applied
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Site Delivery Speed Selection */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Truck className="w-4 h-4 text-brand-orange-500" />
              Site Delivery Method
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  deliverySpeed === 'ASAP_60'
                    ? 'border-brand-blue-500 bg-brand-blue-50/50 text-brand-blue-900 font-semibold ring-1 ring-brand-blue-500'
                    : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="deliverySpeed"
                    checked={deliverySpeed === 'ASAP_60'}
                    onChange={() => setDeliverySpeed('ASAP_60')}
                    className="text-brand-blue-900 focus:ring-brand-blue-500 cursor-pointer"
                  />
                  <div>
                    <div className="font-bold flex items-center gap-1 text-slate-900">
                      <Zap className="w-3.5 h-3.5 text-amber-500 fill-current" />
                      60-Minute Quick Dispatch
                    </div>
                    <div className="text-[11px] text-slate-500">Dedicated express mini-truck direct from dark store</div>
                  </div>
                </div>
                <span className="font-bold text-slate-900">
                  {summary.discountedSubtotal >= 1999 ? 'FREE' : '₹149'}
                </span>
              </label>

              <label
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  deliverySpeed === 'SCHEDULED'
                    ? 'border-brand-blue-500 bg-brand-blue-50/50 text-brand-blue-900 font-semibold ring-1 ring-brand-blue-500'
                    : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="deliverySpeed"
                    checked={deliverySpeed === 'SCHEDULED'}
                    onChange={() => setDeliverySpeed('SCHEDULED')}
                    className="text-brand-blue-900 focus:ring-brand-blue-500 cursor-pointer"
                  />
                  <div>
                    <div className="font-bold text-slate-900">Standard / Next Morning Slot</div>
                    <div className="text-[11px] text-slate-500">Tomorrow 8:00 AM - 11:00 AM scheduled slot</div>
                  </div>
                </div>
                <span className="font-bold text-slate-900">
                  {summary.discountedSubtotal >= 1999 ? 'FREE' : '₹99'}
                </span>
              </label>
            </div>
          </div>

          {/* Phase 6: Optional Site Unloading Service */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Building className="w-4 h-4 text-brand-blue-900" />
                  Site Unloading Assistance (Optional)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Request dedicated site labourers for offloading and material staging at your construction site.
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={unloadingOptions.required}
                  onChange={(e) => setUnloadingOptions({ required: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-blue-900 focus:ring-brand-blue-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-800">Add Unloading</span>
              </label>
            </div>

            {unloadingOptions.required && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3.5 text-xs animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Floor Selector */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Delivery Floor Staging</label>
                    <select
                      value={unloadingOptions.floor}
                      onChange={(e) => setUnloadingOptions({ floor: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-blue-500 cursor-pointer"
                    >
                      <option value={0}>Ground Floor / Driveway (Base Fee ₹149)</option>
                      <option value={1}>1st Floor</option>
                      <option value={2}>2nd Floor</option>
                      <option value={3}>3rd Floor</option>
                      <option value={4}>4th Floor or Higher</option>
                    </select>
                  </div>

                  {/* Lift Availability */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Goods Lift / Elevator Available?</label>
                    <div className="flex gap-4 pt-1">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="hasLift"
                          checked={unloadingOptions.hasLift}
                          onChange={() => setUnloadingOptions({ hasLift: true })}
                          className="text-brand-blue-900 cursor-pointer"
                        />
                        <span className="text-slate-700 font-medium">Yes, Lift Available (No Surcharge)</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="hasLift"
                          checked={!unloadingOptions.hasLift}
                          onChange={() => setUnloadingOptions({ hasLift: false })}
                          className="text-brand-blue-900 cursor-pointer"
                        />
                        <span className="text-slate-700 font-medium">No Lift (+₹50/floor)</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Site Instructions */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Site Unloading Instructions (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Stack cement in ground floor dry room, call site engineer upon gate arrival"
                    value={unloadingOptions.siteInstructions || ''}
                    onChange={(e) => setUnloadingOptions({ siteInstructions: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-blue-500 font-medium"
                  />
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                  <span className="text-slate-500">
                    Unloading Fee: Base ₹149{' '}
                    {!unloadingOptions.hasLift && unloadingOptions.floor > 0
                      ? `+ Floor Surcharge (${unloadingOptions.floor} × ₹50 = ₹${unloadingOptions.floor * 50})`
                      : '(No floor surcharge)'}
                  </span>
                  <span className="font-black text-slate-900">
                    Total: {formatCurrency(summary.unloadingFee)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Coupon Box & Transparent Bill Details */}
        <div className="lg:col-span-4 space-y-4">
          {/* Phase 2: Coupon System */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-brand-orange-500" />
              Apply Coupon Code
            </h3>

            {coupon ? (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-emerald-900 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Coupon '{coupon.code}' Applied
                  </div>
                  <div className="text-[11px] text-emerald-700 mt-0.5">{coupon.description}</div>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-xs text-red-600 hover:underline font-bold cursor-pointer"
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleApplyCoupon();
                  }}
                  className="flex-1 px-3 py-2 text-xs font-bold uppercase tracking-wider border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-blue-500 bg-white"
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleApplyCoupon()}
                  disabled={isApplyingCoupon}
                >
                  {isApplyingCoupon ? 'Verifying...' : 'Apply'}
                </Button>
              </div>
            )}

            {couponFeedback && (
              <p
                className={`text-xs font-semibold flex items-center gap-1 ${
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

            {/* Quick Available Coupon Chips */}
            {!coupon && (
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Available Promotions</div>
                {AVAILABLE_COUPONS.map((c) => (
                  <div
                    key={c.code}
                    onClick={() => handleApplyCoupon(c.code)}
                    className="cursor-pointer p-2.5 rounded-lg border border-dashed border-slate-200 hover:border-brand-blue-400 hover:bg-brand-blue-50/40 text-xs flex items-center justify-between transition-colors"
                  >
                    <div>
                      <span className="font-bold text-brand-blue-900">{c.code}</span>
                      <p className="text-[10px] text-slate-500">{c.description}</p>
                    </div>
                    <span className="text-[10px] font-bold text-brand-blue-700 uppercase">Apply</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Phase 18: Wallet Credits Option */}
          {user && user.walletBalance > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-800">Use Buildora Wallet Balance</span>
                <p className="text-[11px] text-slate-500">
                  Available Credits: {formatCurrency(user.walletBalance)}
                </p>
              </div>
              <input
                type="checkbox"
                checked={walletBalanceToUse > 0}
                onChange={handleToggleWallet}
                className="w-4 h-4 rounded text-brand-blue-900 focus:ring-brand-blue-500 cursor-pointer"
              />
            </div>
          )}

          {/* Phase 3 & 5: Complete Transparent Bill Details */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              Bill Details &amp; Breakdown
            </h3>

            <div className="space-y-2.5 text-xs text-slate-600">
              {/* Product Subtotal */}
              <div className="flex justify-between">
                <span>Product Subtotal</span>
                <span className="font-semibold text-slate-900">{formatCurrency(summary.subtotal)}</span>
              </div>

              {/* Bulk / Product Discount */}
              {summary.itemDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Product / Bulk Tier Discount</span>
                  <span>- {formatCurrency(summary.itemDiscount)}</span>
                </div>
              )}

              {/* Coupon Discount */}
              {summary.couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Coupon Discount ({coupon?.code})</span>
                  <span>- {formatCurrency(summary.couponDiscount)}</span>
                </div>
              )}

              {/* Site Delivery Charge */}
              <div className="flex justify-between">
                <span>Site Delivery Charge</span>
                <span className="font-semibold text-slate-900">
                  {summary.deliveryFee === 0 ? (
                    <strong className="text-emerald-700">FREE</strong>
                  ) : (
                    formatCurrency(summary.deliveryFee)
                  )}
                </span>
              </div>

              {/* Handling Charge (Phase 5) */}
              {summary.handlingFee > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1">
                      Material Handling Charge
                      <button
                        type="button"
                        onClick={() => setShowHandlingInfo(!showHandlingInfo)}
                        className="text-slate-400 hover:text-brand-blue-900 cursor-pointer"
                        title="Click to view handling charge details"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </span>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(summary.handlingFee)}
                    </span>
                  </div>

                  {showHandlingInfo && summary.handlingBreakdown && (
                    <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200 text-[11px] text-amber-900 space-y-1">
                      {summary.handlingBreakdown.map((h, i) => (
                        <div key={i} className="flex justify-between gap-2">
                          <div>
                            <strong>{h.title}</strong>
                            <p className="text-[10px] text-amber-800 leading-snug">{h.explanation}</p>
                          </div>
                          <span className="font-bold flex-shrink-0">+{formatCurrency(h.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Unloading Charge (Phase 6) */}
              {summary.unloadingFee > 0 && (
                <div className="flex justify-between">
                  <span>Site Unloading Service</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(summary.unloadingFee)}
                  </span>
                </div>
              )}

              {/* GST / Tax Component */}
              <div className="flex justify-between text-slate-500 pt-1 border-t border-slate-100">
                <span className="flex items-center gap-1">
                  GST / Tax Information
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-semibold">
                    100% Tax Deductible ITC
                  </span>
                </span>
                <span>{formatCurrency(summary.gstTotal)} (Included)</span>
              </div>

              {/* Grand Total */}
              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline text-sm font-black text-slate-900">
                <span>Grand Total</span>
                <span className="text-xl text-brand-blue-900">{formatCurrency(summary.grandTotal)}</span>
              </div>

              {/* Wallet Amount Used */}
              {summary.walletUsed > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold pt-1">
                  <span>Wallet Amount Used</span>
                  <span>- {formatCurrency(summary.walletUsed)}</span>
                </div>
              )}

              {/* Final Payable Amount */}
              {summary.walletUsed > 0 && (
                <div className="pt-2 border-t border-dashed border-slate-200 flex justify-between items-baseline text-sm font-black text-slate-900">
                  <span>Final Payable Amount</span>
                  <span className="text-xl text-emerald-700">{formatCurrency(summary.payableAmount)}</span>
                </div>
              )}
            </div>

            {/* Checkout Action Button */}
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/checkout')}
              className="w-full mt-4 cursor-pointer"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Continue to Site Checkout
            </Button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Razorpay Verified Gateway &bull; Instant GST Tax Invoice</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
