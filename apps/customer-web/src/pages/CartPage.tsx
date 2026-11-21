import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Clock,
  Trash2,
  ChevronDown,
  ChevronUp,
  MapPin,
  FileText,
  AlertTriangle,
  RotateCcw,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Truck
} from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useLocationStore } from '../store/useLocationStore';
import { useAuthStore } from '../store/useAuthStore';
import { formatCurrency } from '@buildora/utils';
import { GstinModal } from '../components/cart/GstinModal';
import { api } from '../services/api';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();

  // Stores
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    coupon,
    applyCoupon,
    removeCoupon,
    unloadingOptions,
    setUnloadingOptions,
    walletBalanceToUse,
    setWalletBalanceToUse,
    gstin,
    companyName,
    setGstin,
    removeGstin,
    getSummary
  } = useCartStore();

  const {
    pincode,
    locality,
    selectedAddressLabel,
    selectedAddressFull,
    isServiceable,
    etaMinutes,
    openLocationModal
  } = useLocationStore();

  const { user, updateProfile } = useAuthStore();
  const summary = getSummary();

  // Local State
  const [couponInput, setCouponInput] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // Accordion toggles
  const [isBillDetailsOpen, setIsBillDetailsOpen] = useState(true);
  const [isCancellationPolicyOpen, setIsCancellationPolicyOpen] = useState(true);

  // GSTIN Modal toggle
  const [isGstinModalOpen, setIsGstinModalOpen] = useState(false);

  // Handling charge explanation toggle
  const [showHandlingInfo, setShowHandlingInfo] = useState(false);

  // Address text derivation
  const getDisplayAddress = () => {
    if (selectedAddressFull) return selectedAddressFull;
    if (selectedAddressLabel && pincode) return `${selectedAddressLabel}, ${locality || 'Bengaluru'} - ${pincode}`;
    if (pincode) return `${locality || 'Bengaluru Urban'}, Karnataka - ${pincode}`;
    return 'Select delivery address to check serviceability';
  };

  const getEtaBadgeText = () => {
    if (!isServiceable && pincode) return 'Non-Serviceable';
    if (etaMinutes > 0) return `Delivery in ${etaMinutes} mins`;
    return 'Delivery in 60 mins';
  };

  // Coupon handling with server-side validation
  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    setIsApplyingCoupon(true);
    setCouponFeedback(null);

    try {
      const backendRes = await api.validateCoupon(code, summary.discountedSubtotal);
      if (backendRes && backendRes.success && backendRes.data) {
        applyCoupon(code);
        setCouponFeedback({
          type: 'success',
          text: backendRes.message || `Coupon '${code}' applied successfully!`
        });
        setCouponInput('');
      } else {
        setCouponFeedback({
          type: 'error',
          text: backendRes?.message || 'Invalid or inapplicable coupon code.'
        });
      }
    } catch {
      // Client-side fallback check
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

  // Unloading toggle handler
  const handleToggleUnloading = () => {
    setUnloadingOptions({ required: !unloadingOptions.required });
  };

  // GST confirmation handler
  const handleConfirmGst = (newGstin: string, newCompanyName: string, saveToProfile: boolean) => {
    setGstin(newGstin, newCompanyName, saveToProfile);
    if (saveToProfile && user) {
      updateProfile({ gstin: newGstin, businessName: newCompanyName });
    }
  };

  // Checkout button handler with validations
  const handleContinueToCheckout = () => {
    if (!pincode && !selectedAddressFull) {
      openLocationModal();
      return;
    }
    if (!isServiceable) {
      openLocationModal();
      return;
    }
    navigate('/checkout');
  };

  // If cart is empty
  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-black text-slate-900">Your Shopping Cart is Empty</h1>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          You haven't added any construction materials yet. Explore our catalogue of 28 master categories with 60-minute site delivery across Bengaluru.
        </p>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm cursor-pointer"
          >
            Explore All Materials
          </button>
        </div>
      </div>
    );
  }

  const payableAmount = summary.payableAmount || summary.grandTotal;

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* 1. TOP HEADER ROW: Delivery Estimate Banner */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 flex-shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              {getEtaBadgeText()}
            </h2>
            <p className="text-xs text-slate-500">
              Order of {summary.itemCount} {summary.itemCount === 1 ? 'Item' : 'Items'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={clearCart}
          className="text-xs text-slate-400 hover:text-red-600 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          title="Empty entire cart"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Empty Cart</span>
        </button>
      </div>

      {/* 2. MAIN TWO-COLUMN LAYOUT (Left: Items List | Right: Sticky Summary) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Cart Items Table (col-span-12 lg:col-span-7 xl:col-span-8) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            {/* Table Header Row */}
            <div className="grid grid-cols-12 px-5 py-3.5 bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider select-none">
              <div className="col-span-6 sm:col-span-7">PRODUCT</div>
              <div className="col-span-3 sm:col-span-2 text-right">TOTAL</div>
              <div className="col-span-3 text-right">QUANTITY</div>
            </div>

            {/* Cart Items List */}
            <div className="divide-y divide-slate-100">
              {items.map((item) => {
                const itemMrpTotal = item.mrp * item.quantity;
                const hasDiscount = itemMrpTotal > item.totalPrice;

                return (
                  <div
                    key={`${item.productId}-${item.variantId || 'main'}`}
                    className="grid grid-cols-12 px-4 sm:px-5 py-4 sm:py-5 items-center gap-2 sm:gap-4 transition-colors hover:bg-slate-50/40"
                  >
                    {/* PRODUCT Column */}
                    <div className="col-span-6 sm:col-span-7 flex items-center gap-3 sm:gap-4 min-w-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover bg-slate-50 border border-slate-100 flex-shrink-0"
                      />
                      <div className="min-w-0 space-y-0.5">
                        <Link
                          to={`/products/${item.slug}`}
                          className="text-xs sm:text-sm font-bold text-slate-900 hover:text-emerald-700 truncate block leading-tight"
                          title={item.name}
                        >
                          {item.name}
                        </Link>
                        <div className="text-[11px] sm:text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
                          {item.mrp > item.effectiveUnitPrice && (
                            <span className="line-through text-slate-400">
                              {formatCurrency(item.mrp)}
                            </span>
                          )}
                          <span className="font-semibold text-slate-800">
                            {formatCurrency(item.effectiveUnitPrice)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">/ {item.unit || 'unit'}</span>
                        </div>
                      </div>
                    </div>

                    {/* TOTAL Column */}
                    <div className="col-span-3 sm:col-span-2 text-right">
                      {hasDiscount && (
                        <div className="text-[11px] text-slate-400 line-through leading-tight">
                          {formatCurrency(itemMrpTotal)}
                        </div>
                      )}
                      <div className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                        {formatCurrency(item.totalPrice)}
                      </div>
                    </div>

                    {/* QUANTITY Column */}
                    <div className="col-span-3 flex items-center justify-end gap-1.5 sm:gap-2">
                      {/* Compact Green Stepper Pill matching Reference Screenshot 2 */}
                      <div className="inline-flex items-center rounded-lg bg-emerald-700 text-white shadow-xs overflow-hidden select-none">
                        {/* -5 stepper (if qty > 5) */}
                        {item.quantity > 5 && (
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, item.quantity - 5, item.variantId)}
                            className="px-1.5 py-1 text-[10px] font-bold hover:bg-emerald-800 transition-colors border-r border-emerald-600/60 cursor-pointer"
                            title="Decrease by 5"
                          >
                            &laquo;
                          </button>
                        )}
                        {/* -1 stepper */}
                        <button
                          type="button"
                          onClick={() => {
                            if (item.quantity <= 1) {
                              removeItem(item.productId, item.variantId);
                            } else {
                              updateQuantity(item.productId, item.quantity - 1, item.variantId);
                            }
                          }}
                          className="px-2 py-1 text-xs font-bold hover:bg-emerald-800 transition-colors cursor-pointer"
                          title="Decrease by 1"
                        >
                          -
                        </button>
                        {/* Current Quantity */}
                        <span className="px-2 py-1 text-xs font-black min-w-[20px] text-center bg-emerald-800/80">
                          {item.quantity}
                        </span>
                        {/* +1 stepper */}
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                          disabled={item.quantity >= item.maxStock}
                          className="px-2 py-1 text-xs font-bold hover:bg-emerald-800 transition-colors cursor-pointer disabled:opacity-40"
                          title="Increase by 1"
                        >
                          +
                        </button>
                        {/* +5 stepper (if stock permits) */}
                        {item.quantity + 5 <= item.maxStock && (
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, item.quantity + 5, item.variantId)}
                            className="px-1.5 py-1 text-[10px] font-bold hover:bg-emerald-800 transition-colors border-l border-emerald-600/60 cursor-pointer"
                            title="Increase by 5"
                          >
                            &raquo;
                          </button>
                        )}
                      </div>

                      {/* Trash Button */}
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId, item.variantId)}
                        className="p-1 text-slate-300 hover:text-red-500 transition-colors cursor-pointer rounded"
                        title="Remove item"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* UNLOADING SERVICE ROW (Screenshot 4: Appears in Left Section when added!) */}
              {unloadingOptions.required && (
                <div className="grid grid-cols-12 px-4 sm:px-5 py-4 sm:py-5 items-center gap-2 sm:gap-4 bg-emerald-50/30 border-t-2 border-emerald-500/20 animate-in fade-in duration-150">
                  <div className="col-span-6 sm:col-span-7 flex items-center gap-3 sm:gap-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white border border-emerald-200/80 flex items-center justify-center text-emerald-700 flex-shrink-0 shadow-2xs">
                      <Truck className="w-8 h-8 text-emerald-600" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                        Unloading Service
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {formatCurrency(199)} &bull; Ground floor unloading assistance
                      </p>
                    </div>
                  </div>

                  <div className="col-span-3 sm:col-span-2 text-right font-bold text-xs sm:text-sm text-slate-900">
                    {formatCurrency(summary.unloadingFee || 199)}
                  </div>

                  <div className="col-span-3 text-right">
                    <button
                      type="button"
                      onClick={handleToggleUnloading}
                      className="px-3 py-1 rounded-lg border border-slate-300 hover:border-red-400 hover:text-red-600 bg-white text-xs font-semibold text-slate-700 transition-all cursor-pointer shadow-2xs"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Sticky Summary Panel (col-span-12 lg:col-span-5 xl:col-span-4) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4 lg:sticky lg:top-24">
          {/* CARD 1: Coupons (Screenshot 2) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Coupons
            </h3>

            {coupon ? (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-emerald-900 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Coupon '{coupon.code}' Applied
                  </div>
                  <div className="text-[11px] text-emerald-700 mt-0.5">{coupon.description}</div>
                </div>
                <button
                  type="button"
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
                  placeholder="Enter coupon code"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleApplyCoupon();
                  }}
                  className="flex-1 px-3 py-2 text-xs font-semibold tracking-wider uppercase border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-white"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={isApplyingCoupon || !couponInput.trim()}
                  className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer ${
                    isApplyingCoupon || !couponInput.trim()
                      ? 'bg-emerald-600/60 cursor-not-allowed'
                      : 'bg-emerald-700 hover:bg-emerald-800 shadow-sm'
                  }`}
                >
                  {isApplyingCoupon ? '...' : 'Apply'}
                </button>
              </div>
            )}

            {couponFeedback && (
              <p
                className={`text-[11px] font-semibold flex items-center gap-1 ${
                  couponFeedback.type === 'success' ? 'text-emerald-700' : 'text-red-600'
                }`}
              >
                {couponFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                )}
                {couponFeedback.text}
              </p>
            )}
          </div>

          {/* CARD 2: Bill Details (Collapsible Accordion matching Screenshot 2) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <button
              type="button"
              onClick={() => setIsBillDetailsOpen(!isBillDetailsOpen)}
              className="w-full p-4 sm:p-5 flex items-center justify-between text-left cursor-pointer hover:bg-slate-50/50 transition-colors"
            >
              <h3 className="text-sm font-bold text-slate-900">Bill Details</h3>
              {isBillDetailsOpen ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {isBillDetailsOpen && (
              <div className="px-4 sm:px-5 pb-5 space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                {/* Sub Total */}
                <div className="flex justify-between">
                  <span>Sub Total (Inclusive of GST)</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(summary.subtotal)}</span>
                </div>

                {/* Coupon Discount */}
                {summary.couponDiscount > 0 ? (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Coupon Discount</span>
                    <span>- {formatCurrency(summary.couponDiscount)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span>Coupon Discount</span>
                    <span className="font-semibold text-slate-900">₹0</span>
                  </div>
                )}

                {/* Delivery Charge */}
                <div className="flex justify-between">
                  <span>Delivery Charge</span>
                  <span className="font-semibold text-slate-900">
                    {summary.deliveryFee === 0 ? (
                      <span className="text-emerald-700 font-bold">FREE</span>
                    ) : (
                      formatCurrency(summary.deliveryFee)
                    )}
                  </span>
                </div>

                {/* Handling Charge */}
                <div className="flex justify-between">
                  <span className="flex items-center gap-1">
                    Handling Charge
                    {summary.handlingFee > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowHandlingInfo(!showHandlingInfo)}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer"
                        title="View handling details"
                      >
                        <ShieldCheck className="w-3 h-3 text-amber-500" />
                      </button>
                    )}
                  </span>
                  <span className="font-semibold text-slate-900">
                    {summary.handlingFee > 0 ? formatCurrency(summary.handlingFee) : '₹0'}
                  </span>
                </div>

                {showHandlingInfo && summary.handlingBreakdown && (
                  <div className="p-2 rounded-lg bg-amber-50/70 border border-amber-200 text-[10px] text-amber-900 space-y-1">
                    {summary.handlingBreakdown.map((h, i) => (
                      <div key={i} className="flex justify-between">
                        <span>{h.title}</span>
                        <span className="font-bold">+{formatCurrency(h.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Unloading Charge (if selected) */}
                {unloadingOptions.required && (
                  <div className="flex justify-between text-slate-900 font-semibold">
                    <span>Unloading Charge</span>
                    <span>{formatCurrency(summary.unloadingFee || 199)}</span>
                  </div>
                )}

                <div className="border-t border-slate-200 pt-2.5 my-1" />

                {/* Grand Total */}
                <div className="flex justify-between text-xs font-bold text-slate-900">
                  <span>Grand Total</span>
                  <span className="font-black text-sm">{formatCurrency(summary.grandTotal)}</span>
                </div>

                {/* Paying with Wallet */}
                <div className="flex justify-between text-slate-600">
                  <span>Paying with wallet</span>
                  <span className="font-semibold text-slate-900">
                    {summary.walletUsed > 0 ? `- ${formatCurrency(summary.walletUsed)}` : '₹0'}
                  </span>
                </div>

                {/* Payable Amount */}
                <div className="flex justify-between text-xs font-black text-slate-900 pt-1 border-t border-dashed border-slate-200">
                  <span>Payable Amount</span>
                  <span className="text-base text-emerald-800">{formatCurrency(payableAmount)}</span>
                </div>
              </div>
            )}
          </div>

          {/* CARD 3: Need help with unloading? (Screenshots 2 & 3) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 flex-shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      Need help with unloading?
                    </h4>
                    <span className="text-xs font-bold text-slate-900">{formatCurrency(199)}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    A helper will unload the goods on the ground floor only
                  </p>
                </div>
              </div>

              {unloadingOptions.required ? (
                <button
                  type="button"
                  onClick={handleToggleUnloading}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 hover:border-red-400 hover:text-red-600 bg-white text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-2xs flex-shrink-0"
                >
                  Remove
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleToggleUnloading}
                  className="px-4 py-1.5 rounded-lg border border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs font-bold transition-all cursor-pointer shadow-2xs flex-shrink-0"
                >
                  Add
                </button>
              )}
            </div>

            {/* Warning if unloading is skipped */}
            {!unloadingOptions.required && (
              <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/70 text-[11px] text-amber-900 flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>If you skip this, unloading will be your responsibility</span>
              </div>
            )}
          </div>

          {/* CARD 4: Add GST Number (Screenshots 3 & 5) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 flex-shrink-0">
                <span className="text-[11px] font-black text-emerald-800 bg-emerald-200/60 px-1.5 py-0.5 rounded">
                  GST
                </span>
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                  {gstin ? `GSTIN: ${gstin}` : 'Add GST number'}
                </h4>
                <p className="text-[11px] text-slate-500">
                  {companyName ? companyName : 'Claim GST input credit on your order'}
                </p>
              </div>
            </div>

            {gstin ? (
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsGstinModalOpen(true)}
                  className="text-xs text-brand-blue-900 hover:underline font-bold cursor-pointer"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={removeGstin}
                  className="text-xs text-red-500 hover:underline font-bold cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsGstinModalOpen(true)}
                className="px-4 py-1.5 rounded-lg border border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs font-bold transition-all cursor-pointer shadow-2xs flex-shrink-0"
              >
                Add
              </button>
            )}
          </div>

          {/* CARD 5: Cancellation Policy Accordion (Screenshot 3) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <button
              type="button"
              onClick={() => setIsCancellationPolicyOpen(!isCancellationPolicyOpen)}
              className="w-full p-4 sm:p-5 flex items-center justify-between text-left cursor-pointer hover:bg-slate-50/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">Cancellation Policy</h4>
              </div>
              {isCancellationPolicyOpen ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {isCancellationPolicyOpen && (
              <div className="px-4 sm:px-5 pb-5 border-t border-slate-100 pt-3 text-[11px] text-slate-500 space-y-2 leading-relaxed">
                <p>&bull; Orders cannot be modified once packed</p>
                <p>&bull; Delivery location of an order cannot be changed. INR 199 additional charges in unavoidable cases</p>
                <p>&bull; Orders cannot be cancelled once dispatched. Cancellation charges of INR 199 would apply</p>
              </div>
            )}
          </div>

          {/* CARD 6: Delivering To (Screenshots 2 & 3) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <MapPin className="w-4 h-4 text-slate-600" />
                <span>Delivering To</span>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                {getEtaBadgeText()}
              </span>
            </div>

            <p className="text-xs text-slate-600 line-clamp-2">
              {getDisplayAddress()}
            </p>

            <div className="pt-1">
              <button
                type="button"
                onClick={openLocationModal}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
              >
                Change Address
              </button>
            </div>
          </div>

          {/* CARD 7: Bottom Total & Continue to Checkout CTA (Screenshots 2 & 3) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-md flex items-center justify-between gap-4">
            <div className="select-none">
              <div className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                {formatCurrency(payableAmount)}
              </div>
              <div className="text-[11px] text-slate-400 font-medium">Including GST</div>
            </div>

            <button
              type="button"
              onClick={handleContinueToCheckout}
              disabled={pincode && !isServiceable}
              className={`px-6 py-3 rounded-xl text-xs sm:text-sm font-bold text-white transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                pincode && !isServiceable
                  ? 'bg-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-emerald-700 hover:bg-emerald-800'
              }`}
            >
              <span>Continue to checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* GSTIN Modal Component */}
      <GstinModal
        isOpen={isGstinModalOpen}
        onClose={() => setIsGstinModalOpen(false)}
        initialGstin={gstin || ''}
        initialCompanyName={companyName || ''}
        onConfirm={handleConfirmGst}
      />
    </div>
  );
};
