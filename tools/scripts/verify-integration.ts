import assert from 'assert';

const BASE_URL = 'http://localhost:3000';
const TENANT_ID = 'tenant-buildora-blr';

async function runIntegrationAudit() {
  console.log('\n======================================================');
  console.log('🔗 BUILDORA 60 — LIVE FRONTEND ↔ BACKEND INTEGRATION AUDIT');
  console.log('======================================================\n');

  let passed = 0;
  let total = 0;

  async function check(name: string, fn: () => Promise<void>) {
    total++;
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`❌ [FAIL] ${name}:`, err.message);
    }
  }

  // 1. Health Endpoints
  await check('Health Endpoint (/api/health) returns 200 with database status', async () => {
    const res = await fetch(`${BASE_URL}/api/health`, {
      headers: { 'x-tenant-id': TENANT_ID }
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.status, 'UP');
    assert.strictEqual(json.database.driver, 'mongoose');
    assert.strictEqual(json.database.uriConfigured, true);
    assert.strictEqual(json.database.hasPlaceholderCredentials, true);
    assert.strictEqual(json.database.fallbackMode, 'IN_MEMORY_PERSISTED');
  });

  await check('Versioned Health Endpoint (/api/v1/health) is accessible', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/health`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.status, 'UP');
  });

  // 2. Tenant Context
  await check('Tenants API (/api/v1/tenants) resolves multi-tenant configuration', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/tenants`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data[0].id, TENANT_ID);
  });

  // 3. Auth Flow (OTP)
  await check('Auth Request OTP (/api/v1/auth/request-otp)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '9876543210' })
    });
    assert.ok(res.status === 200 || res.status === 201);
    const json = await res.json();
    assert.strictEqual(json.success, true);
  });

  let authToken = '';
  await check('Auth Verify OTP (/api/v1/auth/verify-otp) returns JWT token and customer', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '9876543210', otp: '6060' })
    });
    assert.ok(res.status === 200 || res.status === 201);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.token);
    assert.strictEqual(json.user.phone, '9876543210');
    authToken = json.token;
  });

  // 4. Products & Categories
  await check('Categories API returns all 28 master categories', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/categories`, {
      headers: { 'x-tenant-id': TENANT_ID }
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    const items = json.data || json;
    assert.strictEqual(items.length, 28);
  });

  await check('Products API returns catalog with filter support', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/products?category=cement-concrete`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    const items = json.data || json;
    assert.ok(items.length > 0);
    assert.ok(items.every((p: any) => p.categorySlug === 'cement-concrete'));
  });

  // 5. Server-Side Cart Calculation
  await check('Server-Side Cart Calculation (/api/v1/cart/calculate)', async () => {
    const payload = {
      items: [
        {
          productId: 'prod-cem-1',
          name: 'UltraTech Super Cement (PPC)',
          slug: 'ultratech-super-cement-ppc-50kg',
          brand: 'UltraTech Cement',
          image: '',
          unit: '50 kg Bag',
          basePrice: 395,
          effectiveUnitPrice: 395,
          mrp: 440,
          quantity: 25,
          bulkDiscountPercentage: 3,
          gstRate: 28,
          totalPrice: 9575
        }
      ],
      coupon: 'BUILD60',
      deliverySpeed: 'ASAP_60',
      walletBalanceToUse: 500
    };

    const res = await fetch(`${BASE_URL}/api/v1/cart/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    assert.ok(res.status === 200 || res.status === 201);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.data.grandTotal > 0);
    assert.strictEqual(json.data.deliveryFee, 49); // Priority ASAP_60 fee on large cart is ₹49
  });

  // 6. Order Placement & Tracking
  let createdOrderNumber = '';
  await check('Order Creation (/api/v1/orders) creates order in backend', async () => {
    const orderPayload = {
      customerId: 'cust-demo-1',
      items: [
        {
          productId: 'prod-cem-1',
          sku: 'CEM-ULT-PPC-50KG',
          name: 'UltraTech Super Cement (PPC)',
          slug: 'ultratech-super-cement-ppc-50kg',
          brand: 'UltraTech Cement',
          image: '',
          unit: '50 kg Bag',
          unitPrice: 395,
          quantity: 10,
          gstAmount: 864,
          totalAmount: 3950
        }
      ],
      deliveryAddress: {
        id: 'addr-site-1',
        type: 'CONSTRUCTION_SITE',
        recipientName: 'Arjun Verma (Site Engineer)',
        mobile: '9876543210',
        building: 'Plot 42, Green Horizon Enclave',
        street: '14th Cross, 4th Main Road',
        area: 'Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
        isDefault: true,
        isConstructionSite: true
      },
      deliveryOption: 'ASAP_60',
      paymentMethod: 'COD',
      paymentStatus: 'PENDING',
      subtotal: 3950,
      itemDiscount: 0,
      couponDiscount: 0,
      gstTotal: 864,
      deliveryFee: 0,
      walletUsed: 0,
      grandTotal: 3950,
      isBusinessOrder: true,
      gstin: '29AABCB1234F1Z8',
      companyName: 'Apex Infra Construction Ltd'
    };

    const res = await fetch(`${BASE_URL}/api/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify(orderPayload)
    });
    assert.ok(res.status === 200 || res.status === 201);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.data.orderNumber);
    createdOrderNumber = json.data.orderNumber;
  });

  await check('Order Tracking (/api/v1/orders/:id/track) tracks created order', async () => {
    assert.ok(createdOrderNumber);
    const res = await fetch(`${BASE_URL}/api/v1/orders/${createdOrderNumber}/track`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.status, 'ORDER_PLACED');
    assert.ok(json.data.timeline.length > 0);
  });

  // 7. Wallet API
  await check('Wallet API (/api/v1/wallet) returns ledger and balance', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/wallet`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.currentBalance, 1250);
  });

  // 8. Customer Profile & Addresses
  await check('Customer Profile API (/api/v1/customer/profile)', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/customer/profile`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.name, 'Arjun Verma');
  });

  console.log('\n======================================================');
  console.log(`📊 INTEGRATION AUDIT SUMMARY: ${passed} / ${total} TESTS PASSED`);
  console.log('======================================================\n');
}

runIntegrationAudit().catch((err) => {
  console.error('Fatal Integration Audit Error:', err);
  process.exit(1);
});
