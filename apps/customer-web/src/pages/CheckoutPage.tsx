import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  FileText
} from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { useOrderStore } from '../store/useOrderStore';
import { useLocationStore } from '../store/useLocationStore';
import { formatCurrency } from '@buildora/utils';
import { Address, PaymentMethod, DeliverySpeed } from '@buildora/types';
import { Button } from '../components/ui/Button';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();

  const { items, coupon, deliverySpeed, walletBalanceToUse, getSummary, clearCart } = useCartStore();
  const { isAuthenticated, user, addresses, addAddress, verifyOtp } = useAuthStore();
  const { placeOrder } = useOrderStore();
  const { pincode: defaultPincode, cityName: defaultCity } = useLocationStore();

  const summary = getSummary();

  // Checkout Steps: 1: Auth, 2: Address, 3: Delivery, 4: GST/Billing, 5: Payment
  const [currentStep, setCurrentStep] = useState<number>(isAuthenticated ? 2 : 1);

  // Step 1: Guest / Login phone
  const [phoneInput, setPhoneInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);

  // Step 2: Selected address
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    addresses.find((a) => a.isDefault)?.id || addresses[0]?.id || ''
  );
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    recipientName: user?.name || 'Arjun Verma',
    mobile: user?.phone || '9876543210',
    building: '',
    street: '',
    area: '',
    city: (defaultCity ? defaultCity.split(',')[0].trim() : '') || 'Bengaluru',
    state: 'Karnataka',
    pincode: defaultPincode || '560038',
    deliveryInstructions: '',
    isConstructionSite: true
  });

  // Step 3: Delivery Speed
  const [selectedSpeed, setSelectedSpeed] = useState<DeliverySpeed>(deliverySpeed);

  // Step 4: GST Billing
  const [isBusinessOrder, setIsBusinessOrder] = useState<boolean>(true);
  const [gstin, setGstin] = useState<string>(user?.gstin || '29AABCB1234F1Z8');
  const [companyName, setCompanyName] = useState<string>(user?.businessName || 'Apex Infra Construction Ltd');

  // Step 5: Payment Method
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('RAZORPAY_UPI');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);

  if (items.length === 0 && !confirmedOrderId) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Your cart is empty</h2>
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

  // Handle Save New Address
  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAddress.building && newAddress.street && newAddress.pincode) {
      addAddress({
        type: newAddress.isConstructionSite ? 'CONSTRUCTION_SITE' : 'WORK',
        recipientName: newAddress.recipientName,
        mobile: newAddress.mobile,
        building: newAddress.building,
        street: newAddress.street,
        area: newAddress.area,
        city: newAddress.city,
        state: newAddress.state,
        pincode: newAddress.pincode,
        deliveryInstructions: newAddress.deliveryInstructions,
        isDefault: false,
        isConstructionSite: newAddress.isConstructionSite
      });
      setIsAddingNewAddress(false);
    }
  };

  // Final Order Placement with Backend API integration
  const handleCompleteOrder = async () => {
    setIsProcessingPayment(true);

    const deliveryAddr = addresses.find((a) => a.id === selectedAddressId) || addresses[0] || {
      id: 'addr-default-' + Date.now(),
      type: 'CONSTRUCTION_SITE',
      recipientName: user?.name || newAddress.recipientName || 'Site Contact',
      mobile: user?.phone || newAddress.mobile || '9876543210',
      building: newAddress.building || 'Bengaluru Project Site',
      street: newAddress.street || 'Main Road',
      area: newAddress.area || 'Bengaluru',
      city: newAddress.city || defaultCity || 'Bengaluru',
      state: 'Karnataka',
      pincode: newAddress.pincode || defaultPincode || '560072',
      isDefault: true,
      isConstructionSite: true
    };

    try {
      const order = await placeOrder({
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
        deliveryOption: selectedSpeed,
        estimatedDeliveryTime: selectedSpeed === 'ASAP_60' ? 'Within 60 minutes' : 'Tomorrow 9:00 AM',
        paymentMethod: selectedPayment,
        paymentStatus: selectedPayment === 'COD' ? 'PENDING' : 'CAPTURED',
        razorpayOrderId: 'order_rzp_' + Math.floor(100000 + Math.random() * 900000),
        razorpayPaymentId: selectedPayment === 'COD' ? undefined : 'pay_rzp_' + Math.floor(100000 + Math.random() * 900000),
        subtotal: summary.subtotal,
        itemDiscount: summary.itemDiscount,
        couponDiscount: summary.couponDiscount,
        couponCode: coupon?.code,
        gstTotal: summary.gstTotal,
        deliveryFee: summary.deliveryFee,
        walletUsed: summary.walletUsed,
        grandTotal: summary.grandTotal,
        isBusinessOrder,
        gstin: isBusinessOrder ? gstin : undefined,
        companyName: isBusinessOrder ? companyName : undefined
      });

      setIsProcessingPayment(false);
      setConfirmedOrderId(order.orderNumber);
      clearCart();
    } catch {
      setIsProcessingPayment(false);
      alert('Order placement failed. Please try again.');
    }
  };

  // STEP 7: ORDER CONFIRMATION SCREEN
  if (confirmedOrderId) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Order Confirmed &amp; Dispatched!
          </h1>
          <p className="text-sm text-slate-600">
            Your materials have been confirmed. Order ID:{' '}
            <strong className="text-brand-blue-900 font-mono text-base">{confirmedOrderId}</strong>
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
          <div className="font-bold flex items-center justify-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-600 fill-current" />
            Estimated Site Arrival: Within 60 Minutes
          </div>
          <p className="text-slate-600">
            Our Indiranagar dark store (WH-BLR-01) is currently picking and palletizing your order.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate(`/orders/${confirmedOrderId}/track`)}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Track Delivery in Real-Time
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/orders')}
          >
            View Order Invoice
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left: Step Form Content */}
      <div className="lg:col-span-8 space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-between px-2 text-xs font-bold text-slate-400">
          <span className={currentStep >= 1 ? 'text-brand-blue-900' : ''}>1. Account</span>
          <span>&rarr;</span>
          <span className={currentStep >= 2 ? 'text-brand-blue-900' : ''}>2. Site Address</span>
          <span>&rarr;</span>
          <span className={currentStep >= 3 ? 'text-brand-blue-900' : ''}>3. Delivery Speed</span>
          <span>&rarr;</span>
          <span className={currentStep >= 4 ? 'text-brand-blue-900' : ''}>4. GST &amp; Billing</span>
          <span>&rarr;</span>
          <span className={currentStep >= 5 ? 'text-brand-blue-900' : ''}>5. Payment</span>
        </div>

        {/* Step 1: Authentication */}
        {currentStep === 1 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Phone className="w-4 h-4 text-brand-orange-500" />
              Step 1: Sign In for Site Delivery Updates
            </h2>
            {!isOtpSent ? (
              <div className="space-y-4 max-w-sm">
                <p className="text-xs text-slate-600">
                  Enter your 10-digit mobile number to receive live tracking and driver contact updates.
                </p>
                <input
                  type="tel"
                  maxLength={10}
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="98765 43210"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                />
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setIsOtpSent(true)}
                  disabled={phoneInput.length !== 10}
                >
                  Send OTP Code
                </Button>
              </div>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4 max-w-sm">
                <p className="text-xs text-slate-600">
                  Enter the 4-digit code sent to +91 {phoneInput} (Dev code: <strong>6060</strong>)
                </p>
                <input
                  type="text"
                  maxLength={4}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="6060"
                  className="w-32 tracking-widest text-center text-lg font-bold py-2 border rounded-lg"
                />
                <div>
                  <Button variant="primary" size="md" type="submit">
                    Verify &amp; Continue
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Step 2: Site Address Selection */}
        {currentStep >= 2 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-orange-500" />
                Step 2: Construction Site Delivery Address
              </h2>
              {currentStep > 2 && (
                <button
                  onClick={() => setCurrentStep(2)}
                  className="text-xs text-brand-blue-800 font-bold hover:underline"
                >
                  Change
                </button>
              )}
            </div>

            {currentStep === 2 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`cursor-pointer p-4 rounded-xl border transition-all text-xs space-y-1.5 ${
                        selectedAddressId === addr.id
                          ? 'border-brand-blue-600 bg-brand-blue-50/40 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{addr.recipientName}</span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {addr.type}
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        {addr.building}, {addr.street}, {addr.area}, {addr.city} - {addr.pincode}
                      </p>
                      <div className="text-[11px] text-slate-500">Phone: +91 {addr.mobile}</div>
                      {addr.deliveryInstructions && (
                        <div className="text-[10px] text-amber-800 italic">
                          Note: {addr.deliveryInstructions}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {!isAddingNewAddress ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddingNewAddress(true)}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Add New Site Address
                  </Button>
                ) : (
                  <form onSubmit={handleSaveAddress} className="p-4 bg-slate-50 rounded-xl space-y-3 text-xs border border-slate-200">
                    <div className="font-bold text-slate-800">New Construction Site Address</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                      <input
                        type="text"
                        placeholder="Site Contact Name"
                        value={newAddress.recipientName}
                        onChange={(e) => setNewAddress({ ...newAddress, recipientName: e.target.value })}
                        className="p-2 border rounded"
                        required
                      />
                      <input
                        type="tel"
                        placeholder="Site Contact Mobile"
                        value={newAddress.mobile}
                        onChange={(e) => setNewAddress({ ...newAddress, mobile: e.target.value })}
                        className="p-2 border rounded"
                        required
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Plot No / Building Name / Site Gate"
                      value={newAddress.building}
                      onChange={(e) => setNewAddress({ ...newAddress, building: e.target.value })}
                      className="w-full p-2 border rounded"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Street / Cross / Main Road"
                      value={newAddress.street}
                      onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                      className="w-full p-2 border rounded"
                      required
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                      <input
                        type="text"
                        placeholder="Area / Locality"
                        value={newAddress.area}
                        onChange={(e) => setNewAddress({ ...newAddress, area: e.target.value })}
                        className="p-2 border rounded"
                        required
                      />
                      <input
                        type="text"
                        placeholder="City"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        className="p-2 border rounded"
                        required
                      />
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="Pincode"
                        value={newAddress.pincode}
                        onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                        className="p-2 border rounded font-bold"
                        required
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Unloading Instructions (e.g. Bring hydraulic tail-lift, contact gate security)"
                      value={newAddress.deliveryInstructions}
                      onChange={(e) => setNewAddress({ ...newAddress, deliveryInstructions: e.target.value })}
                      className="w-full p-2 border rounded"
                    />
                    <div className="flex gap-2">
                      <Button variant="primary" size="sm" type="submit">
                        Save Site Address
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setIsAddingNewAddress(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}

                <div className="pt-2">
                  <Button variant="primary" size="md" onClick={() => setCurrentStep(3)}>
                    Continue to Delivery Options &rarr;
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-600">
                Delivering to:{' '}
                <strong className="text-slate-800">
                  {addresses.find((a) => a.id === selectedAddressId)?.building},{' '}
                  {addresses.find((a) => a.id === selectedAddressId)?.city} -{' '}
                  {addresses.find((a) => a.id === selectedAddressId)?.pincode}
                </strong>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Delivery Speed */}
        {currentStep >= 3 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-brand-orange-500" />
                Step 3: Select Site Delivery Speed
              </h2>
              {currentStep > 3 && (
                <button
                  onClick={() => setCurrentStep(3)}
                  className="text-xs text-brand-blue-800 font-bold hover:underline"
                >
                  Change
                </button>
              )}
            </div>

            {currentStep === 3 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label
                    className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer ${
                      selectedSpeed === 'ASAP_60'
                        ? 'border-brand-blue-600 bg-brand-blue-50/50 text-brand-blue-900 font-semibold'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        checked={selectedSpeed === 'ASAP_60'}
                        onChange={() => setSelectedSpeed('ASAP_60')}
                      />
                      <div>
                        <div className="font-bold flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-amber-500 fill-current" />
                          60-Min Quick Dispatch
                        </div>
                        <div className="text-[11px] text-slate-500">Fastest site delivery</div>
                      </div>
                    </div>
                    <span className="font-bold">
                      {summary.discountedSubtotal >= 1999 ? 'FREE' : '₹149'}
                    </span>
                  </label>

                  <label
                    className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer ${
                      selectedSpeed === 'SCHEDULED'
                        ? 'border-brand-blue-600 bg-brand-blue-50/50 text-brand-blue-900 font-semibold'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        checked={selectedSpeed === 'SCHEDULED'}
                        onChange={() => setSelectedSpeed('SCHEDULED')}
                      />
                      <div>
                        <div className="font-bold">Scheduled Morning Slot</div>
                        <div className="text-[11px] text-slate-500">Tomorrow 8:00 AM - 11:00 AM</div>
                      </div>
                    </div>
                    <span className="font-bold">
                      {summary.discountedSubtotal >= 1999 ? 'FREE' : '₹99'}
                    </span>
                  </label>
                </div>

                <Button variant="primary" size="md" onClick={() => setCurrentStep(4)}>
                  Continue to GST &amp; Billing &rarr;
                </Button>
              </div>
            ) : (
              <div className="text-xs text-slate-600">
                Speed:{' '}
                <strong className="text-slate-800">
                  {selectedSpeed === 'ASAP_60' ? '⚡ 60-Min Express Site Dispatch' : 'Scheduled Morning Slot'}
                </strong>
              </div>
            )}
          </div>
        )}

        {/* Step 4: GST Billing */}
        {currentStep >= 4 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-blue-800" />
                Step 4: GST &amp; Business Invoicing Details
              </h2>
              {currentStep > 4 && (
                <button
                  onClick={() => setCurrentStep(4)}
                  className="text-xs text-brand-blue-800 font-bold hover:underline"
                >
                  Change
                </button>
              )}
            </div>

            {currentStep === 4 ? (
              <div className="space-y-4 text-xs">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer font-bold">
                    <input
                      type="radio"
                      checked={isBusinessOrder}
                      onChange={() => setIsBusinessOrder(true)}
                    />
                    <span>Business / GST Input Tax Credit (ITC)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold">
                    <input
                      type="radio"
                      checked={!isBusinessOrder}
                      onChange={() => setIsBusinessOrder(false)}
                    />
                    <span>Individual / Retail Consumer</span>
                  </label>
                </div>

                {isBusinessOrder && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <label className="font-bold block mb-1">Company Legal Name</label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full p-2 border rounded font-semibold"
                        required
                      />
                    </div>
                    <div>
                      <label className="font-bold block mb-1">15-Digit GSTIN</label>
                      <input
                        type="text"
                        maxLength={15}
                        value={gstin}
                        onChange={(e) => setGstin(e.target.value.toUpperCase())}
                        className="w-full p-2 border rounded font-mono font-bold"
                        required
                      />
                    </div>
                  </div>
                )}

                <Button variant="primary" size="md" onClick={() => setCurrentStep(5)}>
                  Proceed to Secure Payment &rarr;
                </Button>
              </div>
            ) : (
              <div className="text-xs text-slate-600">
                Invoicing:{' '}
                <strong className="text-slate-800">
                  {isBusinessOrder ? `B2B GST Invoice (${gstin})` : 'Individual Retail'}
                </strong>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Payment Method */}
        {currentStep >= 5 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-brand-orange-500" />
              Step 5: Select Payment Method (Razorpay Secure)
            </h2>

            <div className="space-y-3 text-xs">
              <label
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer ${
                  selectedPayment === 'RAZORPAY_UPI'
                    ? 'border-brand-blue-600 bg-brand-blue-50/50 font-bold'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    checked={selectedPayment === 'RAZORPAY_UPI'}
                    onChange={() => setSelectedPayment('RAZORPAY_UPI')}
                  />
                  <span>Instant UPI (Google Pay, PhonePe, Paytm, QR Code)</span>
                </div>
                <span className="text-emerald-700 font-bold">Fastest</span>
              </label>

              <label
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer ${
                  selectedPayment === 'RAZORPAY_CARD'
                    ? 'border-brand-blue-600 bg-brand-blue-50/50 font-bold'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    checked={selectedPayment === 'RAZORPAY_CARD'}
                    onChange={() => setSelectedPayment('RAZORPAY_CARD')}
                  />
                  <span>Corporate &amp; Personal Credit / Debit Cards</span>
                </div>
              </label>

              <label
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer ${
                  selectedPayment === 'RAZORPAY_NETBANKING'
                    ? 'border-brand-blue-600 bg-brand-blue-50/50 font-bold'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    checked={selectedPayment === 'RAZORPAY_NETBANKING'}
                    onChange={() => setSelectedPayment('RAZORPAY_NETBANKING')}
                  />
                  <span>Net Banking (SBI, HDFC, ICICI, Axis, 50+ banks)</span>
                </div>
              </label>

              <label
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer ${
                  selectedPayment === 'COD'
                    ? 'border-brand-blue-600 bg-brand-blue-50/50 font-bold'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    checked={selectedPayment === 'COD'}
                    onChange={() => setSelectedPayment('COD')}
                  />
                  <span>Cash / UPI on Site Delivery (Pay to Truck Driver)</span>
                </div>
              </label>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <Button
                variant="secondary"
                size="lg"
                onClick={handleCompleteOrder}
                isLoading={isProcessingPayment}
                className="w-full text-base font-bold"
                leftIcon={<Lock className="w-4 h-4" />}
              >
                Authorize &amp; Place Order ({formatCurrency(summary.grandTotal)})
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Right: Order Summary Sidebar */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card space-y-4 sticky top-24">
          <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-brand-blue-900" />
            Order Summary ({items.length} items)
          </h3>

          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between text-xs py-1">
                <div className="truncate max-w-[180px]">
                  <span className="font-semibold text-slate-800">{item.name}</span>
                  <div className="text-[10px] text-slate-400">Qty: {item.quantity} &bull; {item.unit}</div>
                </div>
                <span className="font-bold text-slate-900">{formatCurrency(item.totalPrice)}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-200 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(summary.subtotal)}</span>
            </div>
            {summary.itemDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Bulk Savings</span>
                <span>- {formatCurrency(summary.itemDiscount)}</span>
              </div>
            )}
            {summary.couponDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Coupon ({coupon?.code})</span>
                <span>- {formatCurrency(summary.couponDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>GST Tax (Included)</span>
              <span>{formatCurrency(summary.gstTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Charges</span>
              <span>{summary.deliveryFee === 0 ? 'FREE' : formatCurrency(summary.deliveryFee)}</span>
            </div>
            {summary.walletUsed > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Wallet Balance</span>
                <span>- {formatCurrency(summary.walletUsed)}</span>
              </div>
            )}
            <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline text-sm font-black text-slate-900">
              <span>Total Payable</span>
              <span className="text-xl text-brand-blue-900">{formatCurrency(summary.grandTotal)}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              BUILDORA 60 Buyer Assurance
            </div>
            <p>Full refund if items damaged during truck offloading or if not as specified.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
