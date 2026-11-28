import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  HardHat,
  Home,
  Loader2,
  MapPin,
  RefreshCw,
  ShieldCheck,
  X,
} from 'lucide-react';
import { formatCurrency } from '@buildora/utils';
import { Order } from '@buildora/types';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useCartStore } from '../../store/useCartStore';
import { useOrderStore } from '../../store/useOrderStore';
import { loadRazorpayCheckoutScript } from '../../utils/razorpay';

export interface CheckoutAddressSummary {
  type?: string;
  label?: string;
  recipientName: string;
  mobile: string;
  email?: string;
  building: string;
  street: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  deliveryInstructions?: string;
}

export interface CheckoutPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: CheckoutAddressSummary;
  payableAmount: number;
  onEditAddress: () => void;
  onOrderConfirmed: (order: Order) => void;
}

type PaymentUiState =
  | 'SELECT'
  | 'PREPARING_COD'
  | 'CREATING_RZP_ORDER'
  | 'RAZORPAY_OPEN'
  | 'VERIFYING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED'
  | 'CONFIG_ERROR';

export const CheckoutPaymentModal: React.FC<CheckoutPaymentModalProps> = ({
  isOpen,
  onClose,
  address,
  payableAmount,
  onEditAddress,
  onOrderConfirmed,
}) => {
  const { items, coupon, deliverySpeed, unloadingOptions, walletBalanceToUse, gstin, companyName, clearCart } =
    useCartStore();
  const { user } = useAuthStore();
  const { placeOrder, addConfirmedOrder } = useOrderStore();

  const [uiState, setUiState] = useState<PaymentUiState>('SELECT');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [pendingOrderNumber, setPendingOrderNumber] = useState<string | null>(null);
  const [pendingRazorpayOrderId, setPendingRazorpayOrderId] = useState<string | null>(null);
  const [confirmedSnapshot, setConfirmedSnapshot] = useState<{
    order: Order;
    paymentId?: string;
  } | null>(null);

  const attemptIdemKeyRef = useRef<string>('');
  const lockRef = useRef<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setUiState('SELECT');
      setStatusMessage('');
      setPendingOrderId(null);
      setPendingOrderNumber(null);
      setPendingRazorpayOrderId(null);
      setConfirmedSnapshot(null);
      attemptIdemKeyRef.current = `chk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      lockRef.current = false;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !lockRef.current && uiState !== 'VERIFYING' && uiState !== 'CREATING_RZP_ORDER' && uiState !== 'PREPARING_COD') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose, uiState]);

  if (!isOpen) return null;

  const isBusy = uiState === 'PREPARING_COD' || uiState === 'CREATING_RZP_ORDER' || uiState === 'VERIFYING';

  const getAddressIcon = () => {
    const t = String(address.type || '').toUpperCase();
    if (t === 'WORK' || t === 'OFFICE') return <Briefcase className="w-4 h-4 text-slate-700" />;
    if (t === 'CONSTRUCTION_SITE') return <HardHat className="w-4 h-4 text-slate-700" />;
    return <Home className="w-4 h-4 text-slate-700" />;
  };

  const fullAddressLine = [address.building, address.street, address.area, address.city, address.pincode]
    .filter((v, idx, arr) => Boolean(v) && arr.indexOf(v) === idx)
    .join(', ');

  const handlePayOnDelivery = async () => {
    if (lockRef.current || isBusy) return;
    lockRef.current = true;
    setUiState('PREPARING_COD');
    setStatusMessage('Validating items, delivery zone and placing your COD order...');

    try {
      const codIdemKey = `${attemptIdemKeyRef.current}_cod`;
      const order = await placeOrder(
        {
          status: 'ORDER_PLACED',
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            sku: i.sku,
            name: i.name,
            slug: i.slug,
            brand: i.brand,
            image: i.image,
            unit: i.unit,
            unitPrice: i.effectiveUnitPrice,
            quantity: i.quantity,
            gstAmount: Math.round(i.totalPrice * 0.18),
            totalAmount: i.totalPrice,
          })),
          deliveryAddress: {
            id: 'addr-active',
            type: (address.type as any) || 'HOME',
            recipientName: address.recipientName,
            mobile: address.mobile,
            building: address.building,
            street: address.street,
            area: address.area,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            landmark: address.landmark,
            deliveryInstructions: address.deliveryInstructions,
            isDefault: true,
          },
          deliveryOption: deliverySpeed,
          estimatedDeliveryTime:
            deliverySpeed === 'ASAP_60' ? 'Within 60 minutes' : 'Tomorrow 8:00 AM - 11:00 AM',
          paymentMethod: 'COD',
          paymentStatus: 'PENDING',
          subtotal: payableAmount,
          itemDiscount: 0,
          couponDiscount: 0,
          couponCode: coupon?.code,
          gstTotal: 0,
          deliveryFee: 0,
          unloadingOptions,
          walletUsed: walletBalanceToUse,
          grandTotal: payableAmount,
          payableAmount,
          isBusinessOrder: Boolean(gstin),
          gstin: gstin ? gstin.trim().toUpperCase() : undefined,
          companyName: companyName ? companyName.trim() : undefined,
        },
        codIdemKey
      );

      clearCart();
      setConfirmedSnapshot({ order });
      setUiState('SUCCESS');
      setStatusMessage('Pay On Delivery order placed successfully!');
      lockRef.current = false;
      onOrderConfirmed(order);
    } catch (err: any) {
      lockRef.current = false;
      setUiState('FAILED');
      setStatusMessage(err?.message || 'Unable to place COD order. Please review your cart and try again.');
    }
  };

  const launchRazorpayCheckout = async (retryExistingOrderId?: string | null) => {
    if (lockRef.current || isBusy) return;
    lockRef.current = true;
    setUiState('CREATING_RZP_ORDER');
    setStatusMessage('Preparing secure payment...');

    try {
      // 1. Load official Razorpay script dynamically
      const scriptLoaded = await loadRazorpayCheckoutScript();
      if (!scriptLoaded || typeof (window as any).Razorpay !== 'function') {
        lockRef.current = false;
        setUiState('FAILED');
        setStatusMessage(
          'Razorpay Checkout script failed to load from checkout.razorpay.com. Check your internet/ad-blocker and retry.'
        );
        return;
      }

      // 2. Create or retry Razorpay order from backend (never trust client amount)
      const rzpRes = await api.createRazorpayOrder(
        retryExistingOrderId
          ? { buildoraOrderId: retryExistingOrderId }
          : {
              items: items.map((i) => ({
                productId: i.productId,
                variantId: i.variantId,
                quantity: i.quantity,
              })),
              couponCode: coupon?.code || null,
              deliverySpeed,
              deliveryAddress: {
                type: address.type || 'HOME',
                recipientName: address.recipientName,
                mobile: address.mobile,
                building: address.building,
                street: address.street,
                area: address.area,
                city: address.city,
                state: address.state,
                pincode: address.pincode,
                landmark: address.landmark,
                deliveryInstructions: address.deliveryInstructions,
              },
              isBusinessOrder: Boolean(gstin),
              gstin: gstin ? gstin.trim().toUpperCase() : undefined,
              companyName: companyName ? companyName.trim() : undefined,
              unloadingOptions,
              walletBalanceToUse,
              customerEmail: user?.email || address.email,
              paymentMethod: 'RAZORPAY',
              idempotencyKey: attemptIdemKeyRef.current,
            }
      );

      if (!rzpRes?.success || !rzpRes?.data?.id || !rzpRes?.data?.keyId) {
        lockRef.current = false;
        const code = rzpRes?.code || '';
        const isConfigIssue =
          code === 'RAZORPAY_CONFIG_INVALID' ||
          code === 'RAZORPAY_AUTH_FAILED' ||
          /credentials|RAZORPAY_KEY_ID|Authentication failed/i.test(rzpRes?.message || '');
        setUiState(isConfigIssue ? 'CONFIG_ERROR' : 'FAILED');
        setStatusMessage(
          rzpRes?.message || 'Could not initiate Razorpay order. Please check configuration and try again.'
        );
        return;
      }

      const {
        id: razorpayOrderId,
        amount: amountInPaise,
        currency,
        keyId,
        buildoraOrderId,
        orderNumber,
      } = rzpRes.data;

      if (buildoraOrderId) setPendingOrderId(buildoraOrderId);
      if (orderNumber) setPendingOrderNumber(orderNumber);
      setPendingRazorpayOrderId(razorpayOrderId);
      setUiState('RAZORPAY_OPEN');

      const options = {
        key: keyId,
        amount: amountInPaise,
        currency: currency || 'INR',
        name: 'BUILDORA 60',
        description: orderNumber
          ? `Order #${orderNumber} (${items.length} construction items)`
          : `BUILDORA 60 Site Order (${items.length} items)`,
        order_id: razorpayOrderId,
        prefill: {
          name: address.recipientName || user?.name || '',
          email: user?.email || address.email || '',
          contact: (() => {
            const digits = String(address.mobile || user?.phone || '').replace(/\D/g, '').slice(-10);
            return digits.length === 10 ? `+91${digits}` : '';
          })(),
        },
        notes: {
          buildoraOrderId: buildoraOrderId || '',
          orderNumber: orderNumber || '',
        },
        theme: { color: '#15803d' },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          setUiState('VERIFYING');
          setStatusMessage('Verifying your payment...');
          try {
            const verifyRes = await api.verifyRazorpayPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              buildoraOrderId: buildoraOrderId || pendingOrderId || undefined,
            });

            if (verifyRes?.success && verifyRes?.data?.verified && verifyRes?.data?.order) {
              const verifiedOrder = verifyRes.data.order;
              addConfirmedOrder(verifiedOrder);
              clearCart();
              setConfirmedSnapshot({ order: verifiedOrder, paymentId: response.razorpay_payment_id });
              setUiState('SUCCESS');
              setStatusMessage('Payment Successful!');
              lockRef.current = false;
              onOrderConfirmed(verifiedOrder);
            } else {
              lockRef.current = false;
              setUiState('FAILED');
              setStatusMessage(
                verifyRes?.message ||
                  'Payment could not be verified on the server. Use Check Payment Status or retry safely.'
              );
            }
          } catch (err: any) {
            lockRef.current = false;
            setUiState('FAILED');
            setStatusMessage(
              err?.message ||
                'Network interruption during payment verification. Your order was not marked paid — click Check Status or Retry.'
            );
          }
        },
        modal: {
          ondismiss: () => {
            void api.failRazorpayPayment({
              razorpayOrderId,
              buildoraOrderId: buildoraOrderId || undefined,
              cancelled: true,
              reason: 'Customer closed Razorpay Checkout modal.',
            });
            lockRef.current = false;
            setUiState('CANCELLED');
            setStatusMessage('Payment was cancelled. Your order has not been marked as paid.');
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (resp: any) => {
        const desc = resp?.error?.description || 'Payment failed inside Razorpay Checkout.';
        void api.failRazorpayPayment({
          razorpayOrderId,
          buildoraOrderId: buildoraOrderId || undefined,
          cancelled: false,
          reason: desc,
        });
        lockRef.current = false;
        setUiState('FAILED');
        setStatusMessage(`Payment could not be completed. ${desc}`);
      });
      rzp.open();
    } catch (err: any) {
      lockRef.current = false;
      setUiState('FAILED');
      setStatusMessage(err?.message || 'Unable to start online payment. Please retry.');
    }
  };

  const handleReconcile = async () => {
    const targetId = pendingOrderId || pendingOrderNumber;
    if (!targetId || isBusy) return;
    setUiState('VERIFYING');
    setStatusMessage('Checking payment status with Razorpay...');
    const res = await api.reconcileRazorpayPayment(targetId);
    if (res?.reconciled && res?.order) {
      addConfirmedOrder(res.order);
      clearCart();
      setConfirmedSnapshot({ order: res.order, paymentId: res.payment?.razorpayPaymentId });
      setUiState('SUCCESS');
      setStatusMessage('Payment Successful!');
      onOrderConfirmed(res.order);
    } else {
      setUiState('FAILED');
      setStatusMessage('Payment is still incomplete on Razorpay. You can retry payment or switch to Pay On Delivery.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/55 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delivering-to-modal-title"
    >
      <div className="relative w-full max-w-[440px] max-h-[90vh] max-h-[90dvh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-5 pb-3 flex-shrink-0">
          <h2 id="delivering-to-modal-title" className="text-base sm:text-lg font-bold text-slate-900">
            Delivering To
          </h2>
          <button
            type="button"
            onClick={() => {
              if (!isBusy) onClose();
            }}
            disabled={isBusy}
            aria-label="Close checkout popup"
            className="p-1.5 -mr-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 sm:px-6 pb-5 sm:pb-6 space-y-4 sm:space-y-5 overflow-y-auto">
          {/* Selected Delivery Address Box */}
          <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/80 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#FAF6EE] border border-amber-100 flex items-center justify-center flex-shrink-0">
                {getAddressIcon()}
              </div>
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-bold text-slate-900 truncate">
                    {address.label || (address.type === 'WORK' ? 'Office' : address.type === 'CONSTRUCTION_SITE' ? 'Site' : 'Home')}
                  </span>
                  <span className="text-xs font-semibold text-slate-600 truncate">
                    &bull; {address.recipientName}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-snug break-words">
                  {fullAddressLine}
                </p>
                <div className="text-[11px] text-slate-500 font-medium">
                  {address.city} - {address.pincode} &bull; +91 {address.mobile}
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={isBusy}
              onClick={() => {
                onClose();
                onEditAddress();
              }}
              className="text-xs font-bold text-[#15803d] hover:text-[#166534] hover:underline flex-shrink-0 cursor-pointer disabled:opacity-40"
            >
              Change
            </button>
          </div>

          {/* Center Payable Total + Status Prompt */}
          <div className="text-center space-y-1 py-1">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Total: {formatCurrency(payableAmount)}
            </div>

            {uiState === 'SELECT' && (
              <p className="text-xs text-slate-500 font-medium">
                Select payment method and place order
              </p>
            )}

            {(uiState === 'PREPARING_COD' || uiState === 'CREATING_RZP_ORDER' || uiState === 'VERIFYING') && (
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#15803d] pt-1">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{statusMessage}</span>
              </div>
            )}

            {uiState === 'RAZORPAY_OPEN' && (
              <p className="text-xs text-emerald-700 font-semibold">
                Razorpay Secure Checkout is open...
              </p>
            )}
          </div>

          {/* Feedback Banners for Failure / Cancellation / Config Errors / Success */}
          {uiState === 'SUCCESS' && confirmedSnapshot && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1 text-center">
              <div className="font-bold flex items-center justify-center gap-1.5 text-emerald-800">
                <CheckCircle2 className="w-4 h-4" />
                <span>Payment Successful!</span>
              </div>
              <div>
                Order ID: <strong className="font-mono">{confirmedSnapshot.order.orderNumber}</strong>
              </div>
            </div>
          )}

          {(uiState === 'FAILED' || uiState === 'CANCELLED' || uiState === 'CONFIG_ERROR') && (
            <div
              className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                uiState === 'CANCELLED'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              <div className="flex items-start gap-2">
                <AlertCircle
                  className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                    uiState === 'CANCELLED' ? 'text-amber-600' : 'text-red-600'
                  }`}
                />
                <div className="space-y-1">
                  <div className="font-bold">
                    {uiState === 'CANCELLED'
                      ? 'Payment Cancelled'
                      : uiState === 'CONFIG_ERROR'
                      ? 'Razorpay Gateway Configuration Required'
                      : 'Payment Could Not Be Completed'}
                  </div>
                  <p className="leading-snug">{statusMessage}</p>
                  {pendingOrderNumber && (
                    <p className="text-[11px] opacity-85">
                      Pending Reference: <span className="font-mono font-semibold">{pendingOrderNumber}</span> (no duplicate order will be created on retry)
                    </p>
                  )}
                </div>
              </div>

              {(pendingOrderId || pendingRazorpayOrderId) && uiState !== 'CONFIG_ERROR' && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => void launchRazorpayCheckout(pendingOrderId)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#15803d] hover:bg-[#166534] text-white font-bold text-xs cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Retry Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleReconcile()}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs cursor-pointer"
                  >
                    Check Payment Status
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Primary Payment Choice Buttons */}
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-2.5 sm:gap-3 pt-1">
            <button
              type="button"
              disabled={isBusy}
              onClick={handlePayOnDelivery}
              className="w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl bg-white border border-[#15803d] text-[#15803d] hover:bg-emerald-50 font-bold text-xs sm:text-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Pay On Delivery
            </button>

            <button
              type="button"
              disabled={isBusy}
              onClick={() => void launchRazorpayCheckout(pendingOrderId)}
              className="w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl bg-[#15803d] hover:bg-[#166534] text-white font-bold text-xs sm:text-sm shadow-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isBusy && (uiState === 'CREATING_RZP_ORDER' || uiState === 'VERIFYING') ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{uiState === 'VERIFYING' ? 'Verifying...' : 'Preparing...'}</span>
                </>
              ) : (
                <span>{pendingOrderId && (uiState === 'FAILED' || uiState === 'CANCELLED') ? 'Retry Online' : 'Pay Online'}</span>
              )}
            </button>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-[#15803d]" />
            <span>Razorpay Secured &bull; Price &amp; Stock Verified Server-Side</span>
          </div>
        </div>
      </div>
    </div>
  );
};
