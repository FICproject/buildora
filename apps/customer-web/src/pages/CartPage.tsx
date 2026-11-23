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
  Truck,
  Loader2,
  X
} from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useLocationStore } from '../store/useLocationStore';
import { useAuthStore } from '../store/useAuthStore';
import { formatCurrency, DEFAULT_FREE_DELIVERY_THRESHOLD, DEFAULT_STANDARD_DELIVERY_FEE } from '@buildora/utils';
import { GstinModal, DeliveryChargeModal, HandlingChargeModal } from '../components/cart';
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
    deliverySpeed,
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
    selectedAddressId,
    selectedAddressLabel,
    selectedAddressFull,
    isServiceable,
    etaMinutes,
    isLoading: isLocationLoading,
    openLocationModal
  } = useLocationStore();

  const { user, addresses, updateProfile } = useAuthStore();
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

  // Delivery & Handling Charge info modals
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [isHandlingModalOpen, setIsHandlingModalOpen] = useState(false);

  // Address text derivation matching HomeRun reference layout
  const getDisplayAddress = () => {
    if (selectedAddressFull) return selectedAddressFull;
    if (selectedAddressLabel && pincode) return `${selectedAddressLabel} · ${locality || 'Bengaluru'} - ${pincode}`;
    if (pincode) return `${pincode} · ${locality || 'Bengaluru Urban'}`;
    return 'Select delivery address to check serviceability';
  };

  const getEtaBadgeText = () => {
    if (isLocationLoading) return 'Verifying...';
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

  // Checkout validation state & comprehensive checkout action
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isValidatingCheckout, setIsValidatingCheckout] = useState(false);

  const handleContinueToCheckout = async () => {
    setCheckoutError(null);

    // 1. Validate cart has items
    if (!items || items.length === 0) {
      setCheckoutError('Your shopping cart is empty. Please add items to proceed.');
      return;
    }

    // 2. Validate quantities & stock
    for (const item of items) {
      if (item.quantity <= 0) {
        setCheckoutError(`Invalid quantity for '${item.name}'. Quantity must be at least 1.`);
        return;
      }
      if (item.maxStock && item.quantity > item.maxStock) {
        setCheckoutError(`Quantity ${item.quantity} for '${item.name}' exceeds available warehouse stock (${item.maxStock} units).`);
        return;
      }
    }

    // 3. Validate address & serviceability
    if (!pincode && !selectedAddressFull) {
      setCheckoutError('Please enter a delivery PIN code or select a saved address.');
      openLocationModal();
      return;
    }

    if (pincode && !isServiceable) {
      setCheckoutError(`PIN code ${pincode} is currently outside our 60-minute quick delivery zone. Please choose a serviceable address.`);
      openLocationModal();
      return;
    }

    // 4. Server-Side Pre-Order Validation via API (centralized authoritative check)
    setIsValidatingCheckout(true);
    try {
      const targetSaved = addresses?.find((a) => a && a.id === selectedAddressId);
      const activeAddr = targetSaved
        ? {
            recipientName: targetSaved.recipientName || user?.name || 'Customer',
            mobile: targetSaved.mobile || user?.phone || '9876543210',
            building: targetSaved.building || 'Site Project',
            street: targetSaved.street || locality || 'Main Road',
            area: targetSaved.area || locality || 'Bengaluru',
            city: targetSaved.city || 'Bengaluru',
            state: targetSaved.state || 'Karnataka',
            pincode: targetSaved.pincode || pincode || '560072'
          }
        : {
            recipientName: user?.name || 'Customer',
            mobile: user?.phone || '9876543210',
            building: selectedAddressFull ? selectedAddressFull.split(',')[0].trim() : 'Site Location',
            street: locality || 'Main Road',
            area: locality || 'Bengaluru',
            city: 'Bengaluru',
            state: 'Karnataka',
            pincode: pincode || '560072'
          };

      const valRes = await api.validateCheckout({
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity
        })),
        couponCode: coupon?.code || null,
        deliverySpeed,
        deliveryAddress: activeAddr,
        isBusinessOrder: !!gstin,
        gstin: gstin ? gstin.trim().toUpperCase() : undefined,
        companyName: companyName ? companyName.trim() : undefined,
        unloadingOptions,
        walletBalanceToUse
      });

      if (!valRes.success && valRes.errors && valRes.errors.length > 0) {
        setCheckoutError(valRes.errors.join('. '));
        setIsValidatingCheckout(false);
        return;
      }

      setCheckoutError(null);
      navigate('/checkout');
    } catch {
      // Offline / fallback transition
      navigate('/checkout');
    } finally {
      setIsValidatingCheckout(false);
    }
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

        {/* RIGHT COLUMN: Unified Scrollable Panel & Sticky Checkout Section (col-span-12 lg:col-span-5 xl:col-span-4) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-3 lg:sticky lg:top-20">
          {/* Validation Error Banner (if checkout pre-validation fails) */}
          {checkoutError && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-start justify-between gap-2 shadow-xs animate-in fade-in">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span className="font-medium leading-snug">{checkoutError}</span>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutError(null)}
                className="text-red-400 hover:text-red-700 p-0.5 rounded cursor-pointer"
                aria-label="Dismiss alert"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 1. UNIFIED RIGHT-SIDE SCROLLABLE PANEL (Parent Container for Sections 1-5) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs divide-y divide-slate-100 max-h-[calc(100vh-270px)] overflow-y-auto overscroll-contain">
            {/* SECTION 1: Coupons */}
            <div className="p-4 sm:p-5 space-y-3">
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

            {/* SECTION 2: Bill Details (Collapsible Accordion) */}
            <div className="overflow-hidden">
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

                  {/* Delivery Charge with clickable dotted underline */}
                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => setIsDeliveryModalOpen(true)}
                      className="text-slate-600 hover:text-slate-900 border-b border-dotted border-slate-400 pb-0.5 cursor-pointer text-left transition-colors"
                      title="Click for Delivery Charge details"
                    >
                      Delivery Charge
                    </button>
                    <span className="font-semibold text-slate-900">
                      {summary.deliveryFee === 0 ? (
                        <span className="text-emerald-700 font-bold">FREE</span>
                      ) : (
                        formatCurrency(summary.deliveryFee)
                      )}
                    </span>
                  </div>

                  {/* Handling Charge with clickable dotted underline */}
                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => setIsHandlingModalOpen(true)}
                      className="text-slate-600 hover:text-slate-900 border-b border-dotted border-slate-400 pb-0.5 cursor-pointer text-left transition-colors"
                      title="Click for Handling Charge details"
                    >
                      Handling Charge
                    </button>
                    <span className="font-semibold text-slate-900">
                      {summary.handlingFee > 0 ? formatCurrency(summary.handlingFee) : '₹0'}
                    </span>
                  </div>

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

            {/* SECTION 3: Need help with unloading? */}
            <div className="p-4 sm:p-5 space-y-3">
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

            {/* SECTION 4: Add GST Number */}
            <div className="p-4 sm:p-5 flex items-center justify-between gap-3">
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

            {/* SECTION 5: Cancellation Policy Accordion */}
            <div className="overflow-hidden">
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
          </div>

          {/* 2. STICKY BOTTOM CHECKOUT SECTION (Separate card below unified panel) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-md divide-y divide-slate-100 overflow-hidden">
            {/* Delivering To Block */}
            <div className="p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <MapPin className="w-4 h-4 text-slate-700" />
                  <span>Delivering To</span>
                </div>
                {/* Delivery ETA badge positioned clearly above Change Address */}
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide shadow-2xs flex items-center gap-1 ${
                    isLocationLoading
                      ? 'bg-slate-200 text-slate-700'
                      : !isServiceable && pincode
                      ? 'bg-amber-600 text-white'
                      : 'bg-[#14532d] text-white'
                  }`}
                >
                  {isLocationLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                  {getEtaBadgeText()}
                </span>
              </div>

              {/* Short address/locality */}
              <p className="text-xs text-slate-600 line-clamp-1">
                {getDisplayAddress()}
              </p>

              {/* Non-serviceable explanation banner */}
              {!isServiceable && pincode && !isLocationLoading && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-600" />
                  <span className="leading-snug">
                    PIN code <strong>{pincode}</strong> is currently outside our 60-minute quick delivery zone. Please choose an address within our Bengaluru network to proceed.
                  </span>
                </div>
              )}

              {/* Change Address action aligned right */}
              <div className="flex justify-end pt-0.5">
                <button
                  type="button"
                  onClick={openLocationModal}
                  className="text-xs font-bold text-[#15803d] hover:text-[#166534] hover:underline cursor-pointer"
                >
                  Change Address
                </button>
              </div>
            </div>

            {/* Payable Amount & Continue to Checkout CTA */}
            <div className="p-4 bg-slate-50/60 flex items-center justify-between gap-3">
              <div className="select-none">
                <div className="text-xs text-slate-400 font-semibold leading-tight">Payable Amount</div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                  {formatCurrency(payableAmount)}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">Including GST</div>
              </div>

              <button
                type="button"
                onClick={handleContinueToCheckout}
                disabled={isValidatingCheckout || isLocationLoading || (!isServiceable && Boolean(pincode))}
                className="px-5 sm:px-6 py-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-700"
              >
                {isValidatingCheckout ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Validating...</span>
                  </>
                ) : isLocationLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Checking Area...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
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

      {/* Delivery Charge Rules Modal (HomeRun Screenshot 2) */}
      <DeliveryChargeModal
        isOpen={isDeliveryModalOpen}
        onClose={() => setIsDeliveryModalOpen(false)}
        freeThreshold={DEFAULT_FREE_DELIVERY_THRESHOLD}
        standardFee={DEFAULT_STANDARD_DELIVERY_FEE}
      />

      {/* Handling Charge Information Modal (HomeRun Screenshot 3) */}
      <HandlingChargeModal
        isOpen={isHandlingModalOpen}
        onClose={() => setIsHandlingModalOpen(false)}
      />
    </div>
  );
};
