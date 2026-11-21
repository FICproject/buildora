/**
 * Comprehensive Integration & Verification Test Suite
 * BUILDORA 60: Cart, Checkout, Payment & Order Workflow
 */

const BASE_URL = 'http://localhost:3000/api/v1';

let passed = 0;
let failed = 0;

function assert(condition: boolean, desc: string) {
  if (condition) {
    console.log(`  [PASS] ${desc}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${desc}`);
    failed++;
  }
}

async function request(path: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('================================================================');
  console.log('BUILDORA 60: END-TO-END CART, CHECKOUT, PAYMENT & ORDER TEST SUITE');
  console.log('================================================================\n');

  // ---------------------------------------------------------------------------
  // 1. HEALTH CHECK & CATALOG DATA
  // ---------------------------------------------------------------------------
  console.log('--- 1. Health & Service Availability ---');
  const healthRes = await request('/health');
  assert(healthRes.status === 200 && healthRes.data?.status === 'UP', 'API health check is UP');

  // Fetch product for testing
  const productsRes = await request('/products');
  const products = productsRes.data?.data || [];
  assert(products.length > 0, `Fetched catalog products (Found: ${products.length})`);

  const cementProduct = products.find((p: any) => p.categorySlug === 'cement-concrete') || products[0];
  const initialStock = cementProduct.stockCount;
  console.log(`  Target product: "${cementProduct.name}", Stock: ${initialStock}`);

  // ---------------------------------------------------------------------------
  // 2. PINCODE SERVICEABILITY
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Delivery Serviceability Checks ---');
  const servValid = await request('/serviceability/check?pincode=560001');
  assert(servValid.data?.data?.serviceable === true, 'Bengaluru central pincode 560001 is serviceable');
  assert(servValid.data?.data?.estimatedMinutes === 60, 'Promised delivery time is 60 minutes');

  const servInvalid = await request('/serviceability/check?pincode=110001'); // Delhi pincode
  assert(servInvalid.data?.data?.serviceable === false, 'Non-Bengaluru pincode 110001 is correctly marked non-serviceable');

  // ---------------------------------------------------------------------------
  // 3. COUPON VALIDATION ENGINE
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Coupon Validation System ---');
  // Flat coupon below minimum
  const cBelow = await request('/coupons/validate', {
    method: 'POST',
    body: JSON.stringify({ code: 'BUILD60', cartSubtotal: 1500 })
  });
  assert(cBelow.data?.success === false, 'BUILD60 rejected when order amount (₹1,500) < minimum (₹2,500)');
  assert(typeof cBelow.data?.message === 'string' && cBelow.data.message.includes('minimum order value'), 'Clear min-order error message returned');

  // Flat coupon valid
  const cValid = await request('/coupons/validate', {
    method: 'POST',
    body: JSON.stringify({ code: 'BUILD60', cartSubtotal: 3000 })
  });
  assert(cValid.data?.success === true && cValid.data?.data?.discountValue === 300, 'BUILD60 successfully validated for ₹300 discount on ₹3,000 subtotal');

  // Percentage coupon with cap
  const cCap = await request('/coupons/validate', {
    method: 'POST',
    body: JSON.stringify({ code: 'CONSTRUCT10', cartSubtotal: 20000 })
  });
  assert(cCap.data?.success === true && cCap.data?.data?.maxDiscount === 1500, 'CONSTRUCT10 (10% capped at ₹1,500) configuration validated');

  // Invalid coupon code
  const cInvalid = await request('/coupons/validate', {
    method: 'POST',
    body: JSON.stringify({ code: 'INVALID_CODE_XYZ', cartSubtotal: 5000 })
  });
  assert(cInvalid.data?.success === false, 'Unrecognized coupon code is rejected');

  // ---------------------------------------------------------------------------
  // 4. CHECKOUT PRE-ORDER VALIDATION (/checkout/validate)
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. Checkout Pre-Order Validation Endpoint ---');

  // Empty items test
  const vEmpty = await request('/checkout/validate', {
    method: 'POST',
    body: JSON.stringify({ items: [] })
  });
  assert(vEmpty.data?.success === false && vEmpty.data?.errors?.length > 0, 'Rejects checkout with empty cart');

  // Missing address
  const vNoAddress = await request('/checkout/validate', {
    method: 'POST',
    body: JSON.stringify({
      items: [{ productId: cementProduct.id, quantity: 2 }]
    })
  });
  assert(vNoAddress.data?.success === false && vNoAddress.data?.errors?.some((e: string) => e.includes('address')), 'Rejects checkout with missing delivery address');

  // Invalid address pincode
  const vBadAddress = await request('/checkout/validate', {
    method: 'POST',
    body: JSON.stringify({
      items: [{ productId: cementProduct.id, quantity: 2 }],
      deliveryAddress: {
        recipientName: 'Arjun',
        mobile: '9876543210',
        building: 'Flat 101',
        street: 'Main Rd',
        area: 'Test',
        city: 'Nowhere',
        state: 'Unknown',
        pincode: '999999'
      }
    })
  });
  assert(vBadAddress.data?.success === false && vBadAddress.data?.errors?.some((e: string) => e.includes('Pincode')), 'Rejects checkout with non-serviceable delivery pincode');

  // Invalid GSTIN format
  const vBadGst = await request('/checkout/validate', {
    method: 'POST',
    body: JSON.stringify({
      items: [{ productId: cementProduct.id, quantity: 2 }],
      deliveryAddress: {
        recipientName: 'Arjun',
        mobile: '9876543210',
        building: 'Plot 42',
        street: 'Brigade Metropolis',
        area: 'Mahadevapura',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001'
      },
      isBusinessOrder: true,
      gstin: 'INVALIDGSTIN123',
      companyName: 'Test Corp'
    })
  });
  assert(vBadGst.data?.success === false && vBadGst.data?.errors?.some((e: string) => e.includes('GSTIN')), 'Rejects malformed GSTIN format');

  // Full valid pre-order check with Unloading & Heavy Handling
  const vValid = await request('/checkout/validate', {
    method: 'POST',
    body: JSON.stringify({
      items: [{ productId: cementProduct.id, quantity: 4 }],
      deliveryAddress: {
        recipientName: 'Arjun Builders',
        mobile: '9876543210',
        building: 'Plot 42, Floor 3',
        street: 'Brigade Metropolis',
        area: 'Mahadevapura',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001'
      },
      deliverySpeed: 'STANDARD',
      isBusinessOrder: true,
      gstin: '29ABCDE1234F1Z5',
      companyName: 'Buildora Infra Tech Pvt Ltd',
      unloadingOptions: { required: true, floor: 3, hasLift: false }, // Base ₹199 + (3 floors * ₹50) = ₹349
      walletBalanceToUse: 0
    })
  });

  assert(vValid.data?.success === true, 'Pre-order validation succeeds with valid cart, address, and GSTIN');
  const serverSummary = vValid.data?.data?.summary;
  assert(serverSummary?.subtotal === 395 * 4, `Server recalculated subtotal: ₹${serverSummary?.subtotal} (Expected: 1580)`);
  assert(serverSummary?.deliveryFee === 0, `Subtotal >= ₹1,000 gets free standard delivery (Actual: ${serverSummary?.deliveryFee})`);
  assert(serverSummary?.handlingFee === 99, `Heavy cement gets ₹99 handling fee (Actual: ${serverSummary?.handlingFee})`);
  assert(serverSummary?.unloadingFee === 349, `Floor 3 without lift gets ₹349 unloading fee (Actual: ${serverSummary?.unloadingFee})`);
  // Grand total: 1580 + 0 + 99 + 349 = 2028
  assert(serverSummary?.grandTotal === 1580 + 0 + 99 + 349, `Grand total accurately computed: ₹${serverSummary?.grandTotal} (Expected: 2028)`);

  // ---------------------------------------------------------------------------
  // 5. PAYMENT ORDER & VERIFICATION (RAZORPAY)
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. Online Payment (Razorpay) Flow ---');
  const rzpOrderRes = await request('/payments/razorpay/order', {
    method: 'POST',
    body: JSON.stringify({ amount: serverSummary.grandTotal, currency: 'INR', receipt: 'rcpt_test_1' })
  });
  assert(rzpOrderRes.ok && rzpOrderRes.data?.data?.id, `Razorpay order created with ID: ${rzpOrderRes.data?.data?.id}`);

  const testRzpOrderId = rzpOrderRes.data?.data?.id;
  const rzpVerifyRes = await request('/payments/razorpay/verify', {
    method: 'POST',
    body: JSON.stringify({
      razorpayOrderId: testRzpOrderId,
      razorpayPaymentId: 'pay_test_' + Date.now(),
      razorpaySignature: 'test_signature_mock_for_audit'
    })
  });
  assert(rzpVerifyRes.ok && rzpVerifyRes.data?.data?.verified === true, 'Razorpay signature / payment verified server-side');

  // ---------------------------------------------------------------------------
  // 6. ORDER PLACEMENT (COD & LIMITS)
  // ---------------------------------------------------------------------------
  console.log('\n--- 6. Order Placement & Stock Depletion ---');

  // Check COD limit check (limit is ₹50,000)
  const codOverLimit = await request('/orders', {
    method: 'POST',
    body: JSON.stringify({
      orderNumber: 'ORD-OVERLIMIT',
      customerName: 'Test Customer',
      customerPhone: '+91 98765 43210',
      customerEmail: 'test@buildora60.com',
      deliveryAddress: { fullAddress: 'Bangalore', pincode: '560001' },
      items: [{ productId: cementProduct.id, name: cementProduct.name, price: 60000, quantity: 1, categorySlug: 'cement-concrete' }],
      totalAmount: 60000,
      payableAmount: 60000,
      paymentMethod: 'COD',
      paymentStatus: 'PENDING'
    })
  });
  assert(codOverLimit.data?.success === false, 'COD orders > ₹50,000 are rejected with clear message');
  assert(codOverLimit.data?.message?.includes('₹50,000'), 'Error specifies ₹50,000 COD limit threshold');

  // Valid Order Placement with Wallet usage
  const walletPreRes = await request('/wallet');
  const walletBalanceBefore = walletPreRes.data?.data?.availableBalance ?? 1250;
  console.log(`  Current Wallet balance: ₹${walletBalanceBefore}`);

  const orderPayload = {
    customerName: 'Arjun Builders',
    customerPhone: '+91 98765 43210',
    customerEmail: 'arjun@buildora60.com',
    deliveryAddress: {
      recipientName: 'Arjun',
      recipientPhone: '+91 98765 43210',
      tag: 'SITE',
      streetAddress: 'Plot 42, Brigade Metropolis, Mahadevapura',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
      fullAddress: 'Plot 42, Brigade Metropolis, Mahadevapura, Bengaluru - 560001'
    },
    items: [
      {
        productId: cementProduct.id,
        name: cementProduct.name,
        price: 395,
        quantity: 2,
        categorySlug: cementProduct.categorySlug
      }
    ],
    deliverySpeed: 'STANDARD',
    totalAmount: 790,
    handlingFee: 99,
    handlingBreakdown: [{ type: 'HEAVY', label: 'Heavy Material Handling', fee: 99, description: 'Bulky civil material' }],
    unloadingFee: 149,
    unloadingOptions: { requested: true, floor: 0, hasLift: true },
    deliveryFee: 99,
    walletUsed: 200,
    payableAmount: 790 + 99 + 149 + 99 - 200,
    paymentMethod: 'COD',
    paymentStatus: 'PENDING',
    gstin: '29ABCDE1234F1Z5',
    companyName: 'Buildora Infra Tech Pvt Ltd'
  };

  const createOrderRes = await request('/orders', {
    method: 'POST',
    body: JSON.stringify(orderPayload)
  });

  assert(createOrderRes.ok && createOrderRes.data?.success === true, 'Order created successfully');
  const placedOrder = createOrderRes.data?.data;
  assert(placedOrder?.orderNumber && placedOrder.orderNumber.startsWith('BLD-'), `Order Number generated: #${placedOrder?.orderNumber}`);
  assert(placedOrder?.status === 'ORDER_PLACED', `Initial order status is ORDER_PLACED`);
  assert(placedOrder?.handlingFee === 99, `Handling fee stored in order: ₹${placedOrder?.handlingFee}`);
  assert(placedOrder?.unloadingFee === 149, `Unloading fee stored in order: ₹${placedOrder?.unloadingFee}`);
  assert(placedOrder?.walletUsed === 200, `Wallet deduction recorded: ₹${placedOrder?.walletUsed}`);

  // Check inventory decremented by 2
  const productsAfterOrder = await request('/products');
  const cementAfter = productsAfterOrder.data?.data?.find((p: any) => p.id === cementProduct.id);
  assert(cementAfter?.stockCount === initialStock - 2, `Inventory decremented from ${initialStock} to ${cementAfter?.stockCount}`);

  // Check wallet debited by ₹200
  const walletAfterOrder = await request('/wallet');
  const walletBalanceAfterOrder = walletAfterOrder.data?.data?.availableBalance;
  assert(walletBalanceAfterOrder === walletBalanceBefore - 200, `Wallet balance debited by ₹200 (Now: ₹${walletBalanceAfterOrder})`);

  // ---------------------------------------------------------------------------
  // 7. ORDER CANCELLATION & RESTORATION
  // ---------------------------------------------------------------------------
  console.log('\n--- 7. Order Cancellation & Stock/Wallet Restoration ---');
  const cancelRes = await request(`/orders/${placedOrder.id}/cancel`, {
    method: 'POST'
  });
  assert(cancelRes.ok && cancelRes.data?.success === true, 'Order cancelled successfully before dispatch');

  // Verify stock restored
  const productsAfterCancel = await request('/products');
  const cementRestored = productsAfterCancel.data?.data?.find((p: any) => p.id === cementProduct.id);
  assert(cementRestored?.stockCount === initialStock, `Inventory restored to initial stock: ${cementRestored?.stockCount}`);

  // Verify wallet refunded
  const walletAfterCancel = await request('/wallet');
  const walletBalanceRestored = walletAfterCancel.data?.data?.availableBalance;
  assert(walletBalanceRestored === walletBalanceBefore, `Wallet balance restored to ₹${walletBalanceBefore} (Actual: ₹${walletBalanceRestored})`);

  // Check wallet refund transaction entry
  const walletTxRes = await request('/wallet/transactions');
  const lastTx = walletTxRes.data?.data?.[0];
  assert(lastTx?.category === 'REFUND' && lastTx?.type === 'CREDIT' && lastTx?.amount === 200, 'Wallet refund transaction logged in ledger');

  // ---------------------------------------------------------------------------
  // 8. CANCELLATION RESTRICTION POLICY
  // ---------------------------------------------------------------------------
  console.log('\n--- 8. Cancellation Policy Restriction ---');
  // Attempt to cancel a dispatched or delivered order
  const existingOrders = await request('/orders');
  const restrictedOrder = existingOrders.data?.data?.find(
    (o: any) => o.status === 'OUT_FOR_DELIVERY' || o.status === 'DELIVERED'
  );
  if (restrictedOrder) {
    const cancelRestrictedRes = await request(`/orders/${restrictedOrder.id}/cancel`, { method: 'POST' });
    assert(cancelRestrictedRes.data?.success === false, `Cancellation blocked for ${restrictedOrder.status} order with policy message`);
    assert(cancelRestrictedRes.data?.message?.includes('cannot be cancelled directly'), 'Return guidance provided when cancellation blocked');
  } else {
    console.log('  [SKIP] No dispatched/delivered order found in seed data to test rejection');
  }

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test run failed with error:', err);
  process.exit(1);
});
