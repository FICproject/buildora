import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation, useSearchParams } from 'react-router-dom';
import {
  MapPin,
  Truck,
  Building2,
  CreditCard,
  CheckCircle2,
  ShieldCheck,
  Plus,
  ArrowRight,
  Phone,
  Lock,
  Zap,
  ShoppingBag,
  FileText,
  AlertCircle,
  HelpCircle,
  Check,
  RefreshCw,
  Info,
  Calendar,
  X
} from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { useStoreConfigStore } from '../store/useStoreConfigStore';
import { useOrderStore } from '../store/useOrderStore';
import { useLocationStore } from '../store/useLocationStore';
import { formatCurrency } from '@buildora/utils';
import { checkBengaluruServiceability } from '@buildora/constants';
import { Address, PaymentMethod, DeliverySpeed, Order } from '@buildora/types';
import { Button } from '../components/ui/Button';
import { api } from '../services/api';
import { loadRazorpayCheckoutScript } from '../utils/razorpay';

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

function formatVerifiedPaymentMethod(method?: string, details?: string): string {
  const m = String(method || '').toUpperCase();
  if (m === 'COD') return 'Pay On Delivery (COD)';
  if (details) return details;
  if (m === 'UPI' || m === 'RAZORPAY_UPI') return 'UPI (Razorpay)';
  if (m === 'CARD' || m === 'RAZORPAY_CARD') return 'Card (Razorpay)';
  if (m === 'NETBANKING' || m === 'RAZORPAY_NETBANKING') return 'Netbanking (Razorpay)';
  if (m === 'WALLET') return 'Wallet (Razorpay)';
  if (m === 'PAY_LATER') return 'Pay Later (Razorpay)';
  return 'Pay Online (Razorpay)';
}

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const {
    items,
    coupon,
    deliverySpeed,
    unloadingOptions,
    walletBalanceToUse,
    getSummary,
    clearCart
  } = useCartStore();

  const { isAuthenticated, user, addresses, addAddress, updateProfile, verifyOtp } = useAuthStore();
  const { placeOrder, addConfirmedOrder, getOrder } = useOrderStore();
  const { pincode: defaultPincode, cityName: defaultCity, selectedAddressId: locationSelectedAddrId, selectSavedAddress } = useLocationStore();

  const summary = getSummary();

  // Steps: 1: Auth, 2: Checkout Review & Payment
  const [currentStep, setCurrentStep] = useState<number>(isAuthenticated ? 2 : 1);

  // Auth Phone/OTP
  const [phoneInput, setPhoneInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);

  // Address State (Phase 8) - synchronize with locationSelectedAddrId if available
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    (locationSelectedAddrId && addresses.some((a) => a && a.id === locationSelectedAddrId) ? locationSelectedAddrId : null) ||
    addresses.find((a) => a && a.isDefault)?.id ||
    addresses[0]?.id ||
    ''
  );
  const [isChangingAddress, setIsChangingAddress] = useState(false);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);

  const [newAddress, setNewAddress] = useState({
    recipientName: user?.name || '',
    mobile: user?.phone || '',
    alternatePhone: '',
    building: '',
    street: '',
    area: '',
    city: (defaultCity ? defaultCity.split(',')[0].trim() : '') || 'Bengaluru',
    state: 'Karnataka',
    pincode: defaultPincode || '560038',
    landmark: '',
    deliveryInstructions: '',
    type: 'CONSTRUCTION_SITE' as 'CONSTRUCTION_SITE' | 'WORK' | 'HOME'
  });

  // GSTIN State (Phase 7)
  const cartGstin = useCartStore((s) => s.gstin);
  const cartCompanyName = useCartStore((s) => s.companyName);
  const cartSaveGst = useCartStore((s) => s.saveGstToProfile);

  const [isBusinessOrder, setIsBusinessOrder] = useState<boolean>(!!cartGstin || !!user?.gstin);
  const [gstin, setGstin] = useState<string>(cartGstin || user?.gstin || '');
  const [companyName, setCompanyName] = useState<string>(cartCompanyName || user?.businessName || '');
  const [saveGstToProfile, setSaveGstToProfile] = useState<boolean>(cartSaveGst ?? false);
  const [gstError, setGstError] = useState<string | null>(null);

  useEffect(() => {
    if (cartGstin) {
      setIsBusinessOrder(true);
      setGstin(cartGstin);
      if (cartCompanyName) setCompanyName(cartCompanyName);
      if (cartSaveGst !== undefined) setSaveGstToProfile(cartSaveGst);
    }
  }, [cartGstin, cartCompanyName, cartSaveGst]);

  // Payment Method Selection (Phase 10)
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('RAZORPAY_UPI');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStatusText, setPaymentStatusText] = useState<string>('');
  const [pendingOnlineOrderId, setPendingOnlineOrderId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const idempotencyKeyRef = useRef<string>(`chkpage_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);

  // Order Confirmed Snapshot (Phase 14) - restore from router state or ?order= query param
  const routeConfirmed = (location.state as any)?.confirmedOrder as Order | undefined;
  const queryOrderNumber = searchParams.get('order');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(
    () => routeConfirmed || (queryOrderNumber ? getOrder(queryOrderNumber) || null : null)
  );

  useEffect(() => {
    if (!confirmedOrder && queryOrderNumber) {
      const fromStore = getOrder(queryOrderNumber);
      if (fromStore) {
        setConfirmedOrder(fromStore);
      } else {
        void api.getOrderById(queryOrderNumber).then((fetched) => {
          if (fetched) setConfirmedOrder(fetched);
        });
      }
    }
  }, [confirmedOrder, queryOrderNumber, getOrder]);

  // Sync default address
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const def = addresses.find((a) => a && a.isDefault) || addresses[0];
      if (def) setSelectedAddressId(def.id);
    }
  }, [addresses, selectedAddressId]);

  // Selected Address object
  const activeAddress = addresses.find((a) => a.id === selectedAddressId) || addresses[0] || null;

  if (items.length === 0 && !confirmedOrder) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Your shopping cart is empty</h2>
        <p className="text-xs text-slate-500">
          Add construction materials to proceed with fast 60-minute site dispatch.
        </p>
        <Button variant="primary" size="md" onClick={() => navigate('/products')}>
          Go to Catalogue
        </Button>
      </div>
    );
  }

  // Handle Step 1 Login
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpInput.length === 4) {
      await verifyOtp(phoneInput, otpInput);
      setCurrentStep(2);
    }
  };

  // Handle Save New Address (Phase 8)
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newAddress.building && newAddress.street && newAddress.pincode) {
      const isFirst = addresses.length === 0;
      await addAddress({
        type: newAddress.type,
        recipientName: newAddress.recipientName,
        mobile: newAddress.mobile,
        alternatePhone: newAddress.alternatePhone,
        building: newAddress.building,
        street: newAddress.street,
        area: newAddress.area,
        landmark: newAddress.landmark,
        city: newAddress.city,
        state: newAddress.state,
        pincode: newAddress.pincode,
        deliveryInstructions: newAddress.deliveryInstructions,
        isDefault: isFirst,
        isConstructionSite: newAddress.type === 'CONSTRUCTION_SITE'
      });

      const updatedAddrs = useAuthStore.getState().addresses;
      const latest = updatedAddrs[updatedAddrs.length - 1];
      if (latest) {
        setSelectedAddressId(latest.id);
        const area = latest.area || latest.street || 'Bengaluru';
        const label = latest.type === 'HOME' ? 'Home' : latest.type === 'WORK' ? 'Office' : 'Job Site';
        await selectSavedAddress({
          id: latest.id,
          label,
          fullAddress: `${label} - ${area}, ${latest.pincode}`,
          pincode: latest.pincode,
          locality: area,
          city: latest.city || 'Bengaluru'
        });
      }
      setIsAddingNewAddress(false);
      setIsChangingAddress(false);
    }
  };

  // Phase 9 & 10: Pre-order validation and order placement flow
  const handleProceedToPayment = async () => {
    setValidationErrors([]);
    setPaymentError(null);

    // 1. Client GSTIN validation if enabled
    if (isBusinessOrder && gstin.trim()) {
      const cleanGst = gstin.trim().toUpperCase();
      if (!GSTIN_REGEX.test(cleanGst)) {
        setGstError('Invalid GSTIN format. Must be 15 alphanumeric characters (e.g. 29AABCB1234F1Z8).');
        return;
      }
      setGstError(null);

      // Save GSTIN to profile ONLY if user explicitly checked the option
      if (saveGstToProfile) {
        await updateProfile({
          gstin: cleanGst,
          businessName: companyName.trim()
        });
      }
    }

    // 2. Address must be selected and serviceable
    const deliveryAddr = activeAddress || (addresses.length > 0 ? addresses[0] : null);
    if (!deliveryAddr) {
      setValidationErrors(['Please add or select a delivery address before proceeding to payment.']);
      return;
    }

    const pinCheck = checkBengaluruServiceability(deliveryAddr.pincode);
    if (!pinCheck.isServiceable) {
      setValidationErrors([pinCheck.message || `PIN code ${deliveryAddr.pincode} is outside our Bengaluru delivery zone. Please choose a serviceable address.`]);
      return;
    }

    setIsProcessingPayment(true);
    setPaymentStatusText(selectedPayment === 'COD' ? 'Placing COD order...' : 'Preparing secure payment...');

    try {
      // 3. Phase 9: Server-Side Pre-Order Validation via Backend API
      const valRes = await api.validateCheckout({
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity
        })),
        couponCode: coupon?.code || null,
        deliverySpeed,
        deliveryAddress: {
          recipientName: deliveryAddr.recipientName,
          mobile: deliveryAddr.mobile,
          building: deliveryAddr.building,
          street: deliveryAddr.street,
          area: deliveryAddr.area,
          city: deliveryAddr.city,
          state: deliveryAddr.state,
          pincode: deliveryAddr.pincode
        },
        isBusinessOrder,
        gstin: isBusinessOrder ? gstin.trim().toUpperCase() : undefined,
        companyName: isBusinessOrder ? companyName.trim() : undefined,
        unloadingOptions,
        walletBalanceToUse
      });

      if (!valRes.success && valRes.errors && valRes.errors.length > 0) {
        setValidationErrors(valRes.errors);
        setIsProcessingPayment(false);
        setPaymentStatusText('');
        return;
      }

      // 4. Phase 10: Payment Routing using authoritative server-calculated payableAmount
      const finalPayable =
        valRes.data?.payableAmount ??
        valRes.data?.summary?.payableAmount ??
        valRes.data?.summary?.grandTotal ??
        (summary.payableAmount !== undefined ? summary.payableAmount : summary.grandTotal);

      const paymentCfg = useStoreConfigStore.getState().config?.paymentConfig;
      const codEnabled = paymentCfg?.codEnabled !== false;
      const codMax = paymentCfg?.codMaxOrderValue ?? 50000;

      if (selectedPayment === 'COD') {
        if (!codEnabled) {
          setValidationErrors(['Cash on Delivery is currently disabled by store configuration.']);
          setIsProcessingPayment(false);
          setPaymentStatusText('');
          return;
        }
        // Pay on Delivery Flow
        if (finalPayable > codMax) {
          setValidationErrors([`Cash on Delivery is limited to orders up to ₹${codMax.toLocaleString('en-IN')} for site delivery security.`]);
          setIsProcessingPayment(false);
          setPaymentStatusText('');
          return;
        }

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
              totalAmount: i.totalPrice
            })),
            deliveryAddress: deliveryAddr,
            deliveryOption: deliverySpeed,
            estimatedDeliveryTime: deliverySpeed === 'ASAP_60' ? 'Within 60 minutes' : 'Tomorrow 8:00 AM - 11:00 AM',
            paymentMethod: 'COD',
            paymentStatus: 'PENDING',
            subtotal: summary.subtotal,
            itemDiscount: summary.itemDiscount,
            couponDiscount: summary.couponDiscount,
            couponCode: coupon?.code,
            gstTotal: summary.gstTotal,
            deliveryFee: summary.deliveryFee,
            handlingFee: summary.handlingFee,
            handlingBreakdown: summary.handlingBreakdown,
            unloadingFee: summary.unloadingFee,
            unloadingOptions,
            walletUsed: summary.walletUsed,
            grandTotal: summary.grandTotal,
            payableAmount: finalPayable,
            isBusinessOrder,
            gstin: isBusinessOrder ? gstin.trim().toUpperCase() : undefined,
            companyName: isBusinessOrder ? companyName.trim() : undefined
          },
          `${idempotencyKeyRef.current}_cod`
        );

        setIsProcessingPayment(false);
        setPaymentStatusText('');
        setConfirmedOrder(order);
        clearCart();
      } else {
        // Online Payment Flow (Official Razorpay Test Mode Gateway Integration)
        const scriptLoaded = await loadRazorpayCheckoutScript();
        if (!scriptLoaded || typeof (window as any).Razorpay !== 'function') {
          setIsProcessingPayment(false);
          setPaymentStatusText('');
          setPaymentError('Razorpay Checkout script failed to load. Please check your connection and retry.');
          return;
        }

        const rzpData = await api.createRazorpayOrder(
          pendingOnlineOrderId
            ? { buildoraOrderId: pendingOnlineOrderId }
            : {
              items: items.map((i) => ({
                productId: i.productId,
                variantId: i.variantId,
                quantity: i.quantity
              })),
              couponCode: coupon?.code || null,
              deliverySpeed,
              deliveryAddress: deliveryAddr,
              isBusinessOrder,
              gstin: isBusinessOrder ? gstin.trim().toUpperCase() : undefined,
              companyName: isBusinessOrder ? companyName.trim() : undefined,
              unloadingOptions,
              walletBalanceToUse,
              customerEmail: user?.email,
              paymentMethod: 'RAZORPAY',
              idempotencyKey: idempotencyKeyRef.current
            }
        );

        if (!rzpData?.success || !rzpData?.data?.id || !rzpData?.data?.keyId) {
          setIsProcessingPayment(false);
          setPaymentStatusText('');
          setPaymentError(rzpData?.message || 'Could not initiate Razorpay payment order. Please check configuration and try again.');
          return;
        }

        const rzpOrderId = rzpData.data.id;
        const rzpKeyId = rzpData.data.keyId;
        const buildoraOrderId = rzpData.data.buildoraOrderId || pendingOnlineOrderId || '';
        if (buildoraOrderId) setPendingOnlineOrderId(buildoraOrderId);

        const options = {
          key: rzpKeyId,
          amount: rzpData.data.amount || Math.round(finalPayable * 100),
          currency: rzpData.data.currency || 'INR',
          name: 'BUILDORA 60',
          description: `Payment for Site Order (${items.length} materials)`,
          order_id: rzpOrderId,
          prefill: {
            name: deliveryAddr.recipientName || user?.name || '',
            email: user?.email || '',
            contact: deliveryAddr.mobile || user?.phone || ''
          },
          theme: { color: '#15803d' },
          handler: async function (response: any) {
            setPaymentStatusText('Verifying your payment...');
            try {
              const verifyJson = await api.verifyRazorpayPayment({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                buildoraOrderId: buildoraOrderId || undefined
              });

              if (verifyJson.success && verifyJson.data?.verified && verifyJson.data?.order) {
                addConfirmedOrder(verifyJson.data.order);
                setIsProcessingPayment(false);
                setPaymentStatusText('');
                setConfirmedOrder(verifyJson.data.order);
                clearCart();
              } else {
                setIsProcessingPayment(false);
                setPaymentStatusText('');
                setPaymentError(verifyJson.message || 'Payment verification failed on the server. Your cart items are preserved.');
              }
            } catch (err: any) {
              setIsProcessingPayment(false);
              setPaymentStatusText('');
              setPaymentError(err?.message || 'Verification failed due to network error. Please retry.');
            }
          },
          modal: {
            ondismiss: function () {
              void api.failRazorpayPayment({
                razorpayOrderId: rzpOrderId,
                buildoraOrderId: buildoraOrderId || undefined,
                cancelled: true,
                reason: 'Customer cancelled payment'
              });
              setIsProcessingPayment(false);
              setPaymentStatusText('');
              setPaymentError('Payment was cancelled. Your order has not been marked as paid. Click Pay & Confirm to retry or switch to COD.');
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          const reason = response?.error?.description || 'Payment failed in Razorpay checkout.';
          void api.failRazorpayPayment({
            razorpayOrderId: rzpOrderId,
            buildoraOrderId: buildoraOrderId || undefined,
            cancelled: false,
            reason
          });
          setIsProcessingPayment(false);
          setPaymentStatusText('');
          setPaymentError(`Payment could not be completed. ${reason} You can safely retry.`);
        });
        rzp.open();
      }
    } catch (err: any) {
      setIsProcessingPayment(false);
      setPaymentStatusText('');
      setPaymentError(err.message || 'Payment processing error. Your cart items are intact.');
    }
  };

  // Phase 14: Comprehensive Order Confirmation Screen
  if (confirmedOrder) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4 space-y-6">
        {/* Success Header */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">
              Order Confirmed &bull; Dark Store WH-BLR-01
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 pt-1">
              Order Confirmed for Site Delivery!
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              Thank you for ordering with BUILDORA 60. Your materials are being palletized and loaded.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-left">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Order ID</span>
              <strong className="text-brand-blue-900 font-mono text-xs sm:text-sm">
                {confirmedOrder.orderNumber}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Amount</span>
              <strong className="text-slate-900 text-xs sm:text-sm">
                {formatCurrency(confirmedOrder.payableAmount || confirmedOrder.grandTotal)}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Payment</span>
              <span className="font-semibold text-slate-800 block">
                {formatVerifiedPaymentMethod(confirmedOrder.paymentMethod, (confirmedOrder as any).paymentChannelDetails)}
              </span>
              <span className="text-[10px] font-bold uppercase text-emerald-700">
                {String(confirmedOrder.paymentStatus) === 'PAID' || confirmedOrder.paymentStatus === 'CAPTURED'
                  ? `Paid • Ref ${confirmedOrder.razorpayPaymentId || 'Verified'}`
                  : 'Payable on Delivery'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Estimated Arrival</span>
              <span className="font-bold text-amber-700 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 fill-current" />
                {confirmedOrder.estimatedDeliveryTime}
              </span>
            </div>
          </div>

          {/* Delivery Address Summary */}
          {confirmedOrder.deliveryAddress && (
            <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 text-xs text-left flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-slate-900">
                  Delivering to: {confirmedOrder.deliveryAddress.recipientName} (+91 {confirmedOrder.deliveryAddress.mobile})
                </div>
                <div className="text-slate-600 mt-0.5">
                  {[
                    confirmedOrder.deliveryAddress.building,
                    confirmedOrder.deliveryAddress.street,
                    confirmedOrder.deliveryAddress.area,
                    confirmedOrder.deliveryAddress.city,
                    confirmedOrder.deliveryAddress.pincode,
                  ]
                    .filter((v, idx, arr): v is string => Boolean(v) && arr.indexOf(v) === idx)
                    .join(', ')}
                </div>
              </div>
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={() =>
                navigate(`/account/orders/${encodeURIComponent(confirmedOrder.orderNumber)}?focus=delivery`, {
                  state: { focusDelivery: true, fromCheckout: true, orderId: confirmedOrder.id },
                })
              }
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Track Real-Time Delivery
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/products')}
            >
              Continue Shopping
            </Button>
          </div>
        </div>

        {/* Order Details & Bill Snapshot */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm text-xs">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center justify-between">
            <span>Ordered Materials ({confirmedOrder.items.length} items)</span>
            <span className="text-slate-400 font-normal">Delivering to: {confirmedOrder.deliveryAddress.recipientName}</span>
          </h2>

          <div className="space-y-3 divide-y divide-slate-100">
            {confirmedOrder.items.map((item, idx) => (
              <div key={idx} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-12 h-12 rounded-lg object-cover bg-slate-50 border border-slate-100 flex-shrink-0"
                  />
                  <div>
                    <h3 className="font-bold text-slate-900">{item.name}</h3>
                    <p className="text-[11px] text-slate-500">
                      Unit: {item.unit} &bull; Qty: {item.quantity} &bull; {formatCurrency(item.unitPrice)} each
                    </p>
                  </div>
                </div>
                <span className="font-bold text-slate-900 text-sm">
                  {formatCurrency(item.totalAmount)}
                </span>
              </div>
            ))}
          </div>

          {/* Bill Snapshot */}
          <div className="pt-4 border-t border-slate-200 space-y-2 text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(confirmedOrder.subtotal)}</span>
            </div>
            {confirmedOrder.couponDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Coupon Discount ({confirmedOrder.couponCode})</span>
                <span>- {formatCurrency(confirmedOrder.couponDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Site Delivery Fee</span>
              <span>{confirmedOrder.deliveryFee === 0 ? 'FREE' : formatCurrency(confirmedOrder.deliveryFee)}</span>
            </div>
            {(confirmedOrder.handlingFee || 0) > 0 && (
              <div className="flex justify-between">
                <span>Material Handling Charges</span>
                <span>{formatCurrency(confirmedOrder.handlingFee!)}</span>
              </div>
            )}
            {(confirmedOrder.unloadingFee || 0) > 0 && (
              <div className="flex justify-between">
                <span>Site Unloading Service</span>
                <span>{formatCurrency(confirmedOrder.unloadingFee!)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-400">
              <span>GST Included (B2B Tax Credit)</span>
              <span>{formatCurrency(confirmedOrder.gstTotal)}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline text-sm font-black text-slate-900">
              <span>Total Paid / Payable</span>
              <span className="text-lg text-brand-blue-900">
                {formatCurrency(confirmedOrder.payableAmount || confirmedOrder.grandTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-8 space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link to="/" className="hover:text-brand-blue-900">Home</Link>
        <span>&rarr;</span>
        <Link to="/cart" className="hover:text-brand-blue-900">Shopping Cart</Link>
        <span>&rarr;</span>
        <span className="font-semibold text-slate-900">Secure Site Checkout</span>
      </nav>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (8 cols): Step Review, Address, GST, Payment */}
        <div className="lg:col-span-8 space-y-5">
          {/* Validation Errors Banner */}
          {validationErrors.length > 0 && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-1.5 animate-in fade-in">
              <div className="font-bold flex items-center gap-1.5 text-red-700">
                <AlertCircle className="w-4 h-4" />
                Please address the following items to proceed:
              </div>
              <ul className="list-disc list-inside space-y-1 text-red-700">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Payment Error / Cancellation Banner (Phase 11) */}
          {paymentError && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start justify-between gap-3 animate-in fade-in">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Payment Notice:</strong> {paymentError}
                </div>
              </div>
              <button
                onClick={() => setPaymentError(null)}
                className="text-amber-700 hover:text-amber-900 font-bold"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Phase 8: Mandatory Delivery Address Section */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-orange-500" />
                1. Delivery Job Site Address
              </h2>
              {activeAddress && !isChangingAddress && (
                <button
                  type="button"
                  onClick={() => setIsChangingAddress(true)}
                  className="text-xs font-bold text-brand-blue-900 hover:underline cursor-pointer"
                >
                  Change Address
                </button>
              )}
            </div>

            {/* If Active Address Exists and Not Changing -> Compact Delivery View (Phase 8) */}
            {activeAddress && !isChangingAddress && !isAddingNewAddress ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-black text-slate-900 text-sm">{activeAddress.recipientName}</span>
                    <span className="font-mono text-slate-500">({activeAddress.mobile})</span>
                    <span className="bg-brand-blue-50 text-brand-blue-900 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                      {activeAddress.type === 'CONSTRUCTION_SITE' ? 'Job Site' : activeAddress.type}
                    </span>
                  </div>
                  <p className="text-slate-600">
                    {activeAddress.building}, {activeAddress.street}, {activeAddress.area}, {activeAddress.city} -{' '}
                    <strong>{activeAddress.pincode}</strong>
                  </p>
                  {(() => {
                    const pinStatus = checkBengaluruServiceability(activeAddress.pincode);
                    return pinStatus.isServiceable ? (
                      <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 pt-0.5">
                        <Zap className="w-3.5 h-3.5 text-amber-500 fill-current" />
                        <span>Serviceable by {pinStatus.warehouseName || pinStatus.warehouseId} &bull; ETA: Within {pinStatus.etaMinutes || 60} Mins</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-amber-700 font-semibold flex items-center gap-1 pt-0.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>{pinStatus.message}</span>
                      </div>
                    );
                  })()}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsChangingAddress(true)}
                  className="flex-shrink-0"
                >
                  Change
                </Button>
              </div>
            ) : (
              // Address Selector / Add Form
              <div className="space-y-4">
                {addresses.length > 0 && !isAddingNewAddress && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700">Choose from Saved Addresses:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {addresses.map((a) => (
                        <div
                          key={a.id}
                          onClick={() => {
                            setSelectedAddressId(a.id);
                            setIsChangingAddress(false);
                            const area = a.area || a.street || 'Bengaluru';
                            const label = a.type === 'HOME' ? 'Home' : a.type === 'WORK' ? 'Office' : 'Job Site';
                            selectSavedAddress({
                              id: a.id,
                              label,
                              fullAddress: `${label} - ${area}, ${a.pincode}`,
                              pincode: a.pincode,
                              locality: area,
                              city: a.city || 'Bengaluru'
                            });
                          }}
                          className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all space-y-1 ${selectedAddressId === a.id
                            ? 'border-brand-blue-500 bg-brand-blue-50/50 ring-1 ring-brand-blue-500 font-medium'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <strong className="text-slate-900">{a.recipientName}</strong>
                            <span className="text-[10px] uppercase font-bold text-slate-400">{a.type}</span>
                          </div>
                          <p className="text-slate-500 text-[11px] line-clamp-2">
                            {a.building}, {a.street}, {a.city} - {a.pincode}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add New Address Toggle / Form */}
                {!isAddingNewAddress ? (
                  <button
                    type="button"
                    onClick={() => setIsAddingNewAddress(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-blue-900 hover:underline cursor-pointer pt-1"
                  >
                    <Plus className="w-4 h-4" /> Add a New Job Site / Delivery Address
                  </button>
                ) : (
                  <form onSubmit={handleSaveAddress} className="space-y-3 pt-2 text-xs">
                    <div className="font-bold text-slate-900">Add New Site Delivery Address</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">Site Contact Name *</label>
                        <input
                          type="text"
                          required
                          value={newAddress.recipientName}
                          onChange={(e) => setNewAddress({ ...newAddress, recipientName: e.target.value })}
                          className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                          placeholder="e.g. Ramesh Kumar (Site Supervisor)"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">Mobile Number (10 digits) *</label>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={newAddress.mobile}
                          onChange={(e) => setNewAddress({ ...newAddress, mobile: e.target.value.replace(/\D/g, '') })}
                          className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                          placeholder="9876543210"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">Building / Project Name *</label>
                        <input
                          type="text"
                          required
                          value={newAddress.building}
                          onChange={(e) => setNewAddress({ ...newAddress, building: e.target.value })}
                          className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                          placeholder="e.g. Plot 42, Prestige Green Horizon"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">Street / Cross Road *</label>
                        <input
                          type="text"
                          required
                          value={newAddress.street}
                          onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                          className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                          placeholder="e.g. 14th Cross, 4th Main"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">Area / Locality *</label>
                        <input
                          type="text"
                          required
                          value={newAddress.area}
                          onChange={(e) => setNewAddress({ ...newAddress, area: e.target.value })}
                          className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                          placeholder="e.g. Indiranagar"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">Pincode *</label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={newAddress.pincode}
                          onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value.replace(/\D/g, '') })}
                          className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                          placeholder="560038"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button variant="primary" size="sm" type="submit">
                        Save &amp; Use Address
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => {
                          setIsAddingNewAddress(false);
                          if (addresses.length > 0) setIsChangingAddress(false);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Phase 7: GSTIN Flow */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-brand-blue-900" />
                  2. GST Number &amp; B2B Tax Invoice (Optional)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Claim full Input Tax Credit (ITC) with valid corporate GST invoice.
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isBusinessOrder}
                  onChange={(e) => setIsBusinessOrder(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-blue-900 focus:ring-brand-blue-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-800">Add GST Number</span>
              </label>
            </div>

            {isBusinessOrder && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3.5 text-xs animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">GSTIN Number (15 Digits) *</label>
                    <input
                      type="text"
                      maxLength={15}
                      placeholder="e.g. 29AABCB1234F1Z8"
                      value={gstin}
                      onChange={(e) => {
                        setGstin(e.target.value.toUpperCase());
                        setGstError(null);
                      }}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold tracking-wider text-slate-900 uppercase focus:outline-none focus:ring-1 focus:ring-brand-blue-500"
                    />
                    {gstError && <p className="text-[11px] text-red-600 font-semibold mt-1">{gstError}</p>}
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Company / Business Legal Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Apex Infra Construction Ltd"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-blue-500"
                    />
                  </div>
                </div>

                {/* Explicit Two-Choice Storage (Phase 7 Requirement) */}
                <div className="space-y-1.5 pt-1 border-t border-slate-200">
                  <div className="font-bold text-slate-700">GST Profile Preference:</div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="gstSaveOption"
                        checked={saveGstToProfile}
                        onChange={() => setSaveGstToProfile(true)}
                        className="text-brand-blue-900 cursor-pointer"
                      />
                      <span className="text-slate-700 font-medium">Save GSTIN to my profile for future orders</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="gstSaveOption"
                        checked={!saveGstToProfile}
                        onChange={() => setSaveGstToProfile(false)}
                        className="text-brand-blue-900 cursor-pointer"
                      />
                      <span className="text-slate-700 font-medium">Use GSTIN for this order only</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Phase 10: Payment Method Selection */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              3. Payment Method Selection
            </h2>

            <div className="space-y-3 text-xs">
              {/* Online Payment (Razorpay UPI, Cards, NetBanking) */}
              <label
                className={`p-3.5 sm:p-4 rounded-xl border flex flex-wrap sm:flex-nowrap items-start justify-between gap-2 cursor-pointer transition-all ${selectedPayment === 'RAZORPAY_UPI'
                  ? 'border-brand-blue-500 bg-brand-blue-50/40 ring-1 ring-brand-blue-500'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={selectedPayment === 'RAZORPAY_UPI'}
                    onChange={() => setSelectedPayment('RAZORPAY_UPI')}
                    className="mt-0.5 text-brand-blue-900 cursor-pointer flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <strong className="text-sm text-slate-900 block">
                      Pay Online (Instant UPI, Cards &amp; NetBanking)
                    </strong>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Secure Razorpay gateway with instant ITC tax invoice generation and priority dark-store dispatch.
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-2 text-[10px] font-bold text-slate-500">
                      <span className="bg-white border px-1.5 py-0.5 rounded">Google Pay</span>
                      <span className="bg-white border px-1.5 py-0.5 rounded">PhonePe</span>
                      <span className="bg-white border px-1.5 py-0.5 rounded">Paytm UPI</span>
                      <span className="bg-white border px-1.5 py-0.5 rounded">Visa / MC</span>
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex-shrink-0">
                  Recommended
                </span>
              </label>

              {/* Pay on Delivery (COD) */}
              <label
                className={`p-3.5 sm:p-4 rounded-xl border flex flex-wrap items-start justify-between gap-2 cursor-pointer transition-all ${selectedPayment === 'COD'
                  ? 'border-brand-blue-500 bg-brand-blue-50/40 ring-1 ring-brand-blue-500'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={selectedPayment === 'COD'}
                    onChange={() => setSelectedPayment('COD')}
                    className="mt-0.5 text-brand-blue-900 cursor-pointer"
                  />
                  <div>
                    <strong className="text-sm text-slate-900 block">
                      Cash / Cheque on Site Delivery (COD)
                    </strong>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Pay to site delivery executive upon material offload. Eligible for orders up to ₹
                      {(useStoreConfigStore.getState().config?.paymentConfig?.codMaxOrderValue ?? 50000).toLocaleString('en-IN')}.
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-slate-500">Site Verified</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Order Summary, Transparent Bill & Place Order CTA */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4 sticky top-24">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>Order Review</span>
              <span className="text-xs text-slate-400 font-normal">{items.length} materials</span>
            </h3>

            {/* Quick Item List */}
            <div className="max-h-48 overflow-y-auto space-y-2.5 pr-1 divide-y divide-slate-100 text-xs">
              {items.map((i) => (
                <div key={`${i.productId}-${i.variantId || 'main'}`} className="pt-2 first:pt-0 flex items-center justify-between gap-2">
                  <div className="truncate pr-2">
                    <span className="font-bold text-slate-800 truncate block">{i.name}</span>
                    <span className="text-[11px] text-slate-400">Qty: {i.quantity} &bull; {formatCurrency(i.effectiveUnitPrice)}</span>
                  </div>
                  <span className="font-bold text-slate-900 flex-shrink-0">{formatCurrency(i.totalPrice)}</span>
                </div>
              ))}
            </div>

            {/* Phase 3 & 5: Transparent Final Bill Breakdown */}
            <div className="pt-3 border-t border-slate-200 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Product Subtotal</span>
                <span>{formatCurrency(summary.subtotal)}</span>
              </div>
              {summary.itemDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Product / Bulk Discount</span>
                  <span>- {formatCurrency(summary.itemDiscount)}</span>
                </div>
              )}
              {summary.couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Coupon Discount ({coupon?.code})</span>
                  <span>- {formatCurrency(summary.couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Site Delivery Fee</span>
                <span>{summary.deliveryFee === 0 ? <strong className="text-emerald-700">FREE</strong> : formatCurrency(summary.deliveryFee)}</span>
              </div>
              {summary.handlingFee > 0 && (
                <div className="flex justify-between">
                  <span>Material Handling Charges</span>
                  <span>{formatCurrency(summary.handlingFee)}</span>
                </div>
              )}
              {summary.unloadingFee > 0 && (
                <div className="flex justify-between">
                  <span>Site Unloading Assistance</span>
                  <span>{formatCurrency(summary.unloadingFee)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-100">
                <span>GST Tax (Included)</span>
                <span>{formatCurrency(summary.gstTotal)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline text-sm font-black text-slate-900">
                <span>Grand Total</span>
                <span className="text-xl text-brand-blue-900">{formatCurrency(summary.grandTotal)}</span>
              </div>
              {summary.walletUsed > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Wallet Credits Used</span>
                  <span>- {formatCurrency(summary.walletUsed)}</span>
                </div>
              )}
              {summary.walletUsed > 0 && (
                <div className="pt-2 border-t border-dashed border-slate-200 flex justify-between items-baseline text-sm font-black text-slate-900">
                  <span>Final Amount Payable</span>
                  <span className="text-xl text-emerald-700">{formatCurrency(summary.payableAmount)}</span>
                </div>
              )}
            </div>

            {/* Phase 17: Concise Cancellation Policy Notice */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <strong className="text-slate-800 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-blue-900" /> Cancellation Policy:
              </strong>
              <p className="leading-snug">
                Free cancellation allowed within 10 minutes of placement or before dark-store picking begins. Full refund instantly credited.
              </p>
            </div>

            {/* Place Order CTA Button */}
            <Button
              variant="secondary"
              size="lg"
              onClick={handleProceedToPayment}
              disabled={isProcessingPayment}
              className="w-full mt-2 cursor-pointer font-black text-sm"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {isProcessingPayment
                ? paymentStatusText || 'Securing Order...'
                : selectedPayment === 'COD'
                  ? `Confirm Site Order (${formatCurrency(summary.payableAmount || summary.grandTotal)})`
                  : `Pay & Confirm Order (${formatCurrency(summary.payableAmount || summary.grandTotal)})`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
