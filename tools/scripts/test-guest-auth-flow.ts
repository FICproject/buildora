/**
 * End-to-End Verification Suite:
 * BUILDORA 60 - Guest Browsing, Action-Based Sign In, Guest Cart/Wishlist Merge,
 * OTP Security & Customer Isolation (401/403).
 */

import * as path from 'path';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../services/backend/api/.env') });

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../services/backend/api/src/app.module';
import { dbStore } from '../../services/backend/api/src/database/store';

let total = 0;
let passed = 0;
let failed = 0;

function assert(cond: boolean, label: string, detail?: any) {
  total++;
  if (cond) {
    passed++;
    console.log(`  PASS: ${label}`);
  } else {
    failed++;
    console.error(`  FAIL: ${label}`, detail !== undefined ? detail : '');
  }
}

async function run() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
  await app.listen(3099);
  const BASE = 'http://localhost:3099/api/v1';

  const jsonFetch = async (
    endpoint: string,
    options: { method?: string; token?: string; body?: any } = {}
  ) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-tenant-id': 'tenant-buildora-blr',
    };
    if (options.token) {
      headers['Authorization'] = `Bearer ${options.token}`;
    }
    const res = await fetch(`${BASE}${endpoint}`, {
      method: options.method || 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  };

  try {
    console.log('\n--- 1. Guest Public Storefront & Browsing APIs ---');
    const [prodRes, taxRes, dealRes, calcRes, servRes] = await Promise.all([
      jsonFetch('/products'),
      jsonFetch('/taxonomy'),
      jsonFetch('/deals'),
      jsonFetch('/cart/calculate', {
        method: 'POST',
        body: {
          items: dbStore.products.slice(0, 1).map((p) => ({
            productId: p.id,
            price: p.price,
            effectiveUnitPrice: p.price,
            quantity: 2,
          })),
        },
      }),
      jsonFetch('/serviceability/check?pincode=560038'),
    ]);

    assert(prodRes.status === 200 && Array.isArray(prodRes.data?.data || prodRes.data), 'Guests can browse product catalog without login');
    assert(taxRes.status === 200, 'Guests can browse navigation taxonomy without login');
    assert(dealRes.status === 200, 'Guests can browse deals without login');
    assert((calcRes.status === 200 || calcRes.status === 201) && calcRes.data?.data?.grandTotal > 0, 'Guests can calculate cart totals without login', calcRes);
    assert(servRes.status === 200 && servRes.data?.isServiceable === true, 'Guests can check delivery pincode serviceability without login');

    const sampleProd = dbStore.products[0];
    const secondProd = dbStore.products[1];
    assert(Boolean(sampleProd && secondProd), 'Seed products available for cart/wishlist merge testing');

    const prodRevGet = await jsonFetch(`/products/${sampleProd.slug}/reviews`);
    assert(prodRevGet.status === 200, 'Guests can view product reviews without login');

    console.log('\n--- 2. Restricted APIs Reject Unauthenticated Guests (401) ---');
    const unauthChecks = await Promise.all([
      jsonFetch('/customer/profile'),
      jsonFetch('/customer/addresses'),
      jsonFetch('/customer/wishlist'),
      jsonFetch('/cart'),
      jsonFetch('/cart/merge', { method: 'POST', body: { guestItems: [] } }),
      jsonFetch('/wallet'),
      jsonFetch('/wallet/transactions'),
      jsonFetch('/wallet/topup', { method: 'POST', body: { amount: 500 } }),
      jsonFetch('/orders'),
      jsonFetch('/orders/BLD-2026-8941'),
      jsonFetch('/orders/BLD-2026-8941/track'),
      jsonFetch('/orders', {
        method: 'POST',
        body: { items: [{ productId: sampleProd.id, quantity: 1 }], paymentMethod: 'COD' },
      }),
      jsonFetch('/payments/razorpay/order', {
        method: 'POST',
        body: { items: [{ productId: sampleProd.id, quantity: 1 }] },
      }),
      jsonFetch('/support/tickets'),
      jsonFetch(`/products/${sampleProd.id}/reviews`, {
        method: 'POST',
        body: { rating: 5, comment: 'Guest review attempt' },
      }),
    ]);

    const restrictedLabels = [
      'GET /customer/profile',
      'GET /customer/addresses',
      'GET /customer/wishlist',
      'GET /cart',
      'POST /cart/merge',
      'GET /wallet',
      'GET /wallet/transactions',
      'POST /wallet/topup',
      'GET /orders',
      'GET /orders/:id',
      'GET /orders/:id/track',
      'POST /orders',
      'POST /payments/razorpay/order',
      'GET /support/tickets',
      'POST /products/:id/reviews',
    ];
    unauthChecks.forEach((r, i) => {
      assert(r.status === 401, `Guest blocked (401) on ${restrictedLabels[i]}`, r.status);
    });

    console.log('\n--- 3. Invalid & Expired JWT Rejection ---');
    const secret =
      process.env.CUSTOMER_JWT_SECRET ||
      process.env.JWT_SECRET ||
      'buildora-customer-enterprise-secret-key-2026';
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const expiredPayload = Buffer.from(
      JSON.stringify({
        sub: 'cust-9876543210',
        phone: '9876543210',
        tenantId: 'tenant-buildora-blr',
        role: 'CONTRACTOR',
        tokenType: 'CUSTOMER',
        iat: Math.floor(Date.now() / 1000) - 7200,
        exp: Math.floor(Date.now() / 1000) - 3600,
      })
    ).toString('base64url');
    const expiredSig = crypto
      .createHmac('sha256', secret)
      .update(`${header}.${expiredPayload}`)
      .digest('base64url');
    const expiredJwt = `${header}.${expiredPayload}.${expiredSig}`;

    const [badTokProfile, expiredTokOrders, expiredSess] = await Promise.all([
      jsonFetch('/customer/profile', { token: 'invalid.jwt.token' }),
      jsonFetch('/orders', { token: expiredJwt }),
      jsonFetch('/auth/session', { token: expiredJwt }),
    ]);
    assert(badTokProfile.status === 401, 'Malformed JWT rejected with 401');
    assert(expiredTokOrders.status === 401, 'Expired JWT rejected with 401');
    assert(expiredSess.status === 200 && expiredSess.data?.authenticated === false, '/auth/session reports authenticated=false for expired JWT');

    console.log('\n--- 4. OTP Flow, Invalid OTP & Single-Use Replay Protection ---');
    const phoneA = '9845112233';
    const phoneB = '9845998877';

    const invalidPhoneRes = await jsonFetch('/auth/request-otp', {
      method: 'POST',
      body: { phone: '12345' },
    });
    assert(invalidPhoneRes.data?.success === false, 'Rejects invalid mobile number on request-otp');

    const otpReqA = await jsonFetch('/auth/request-otp', {
      method: 'POST',
      body: { phone: phoneA },
    });
    assert(otpReqA.status === 201 && otpReqA.data?.success === true, 'OTP issued cleanly for Customer A');

    const wrongOtp = await jsonFetch('/auth/verify-otp', {
      method: 'POST',
      body: { phone: phoneA, otp: '9999' },
    });
    assert(wrongOtp.status === 401, 'Wrong OTP (9999) rejected with 401');

    const validVerifyA = await jsonFetch('/auth/verify-otp', {
      method: 'POST',
      body: { phone: phoneA, otp: '6060', name: 'Customer Alpha' },
    });
    assert(validVerifyA.status === 201 && Boolean(validVerifyA.data?.token), 'Valid OTP verifies and issues Customer A JWT');
    const tokenA: string = validVerifyA.data.token;

    const replayVerifyA = await jsonFetch('/auth/verify-otp', {
      method: 'POST',
      body: { phone: phoneA, otp: '6060' },
    });
    assert(replayVerifyA.status === 401, 'Duplicate OTP replay rejected after consumption (requires Resend OTP)');

    // Resend OTP works again
    const resendReqA = await jsonFetch('/auth/request-otp', {
      method: 'POST',
      body: { phone: phoneA },
    });
    assert(resendReqA.data?.success === true, 'Resend OTP succeeds and issues fresh challenge');

    const sessionA = await jsonFetch('/auth/session', { token: tokenA });
    assert(sessionA.data?.authenticated === true && sessionA.data?.user?.phone === phoneA, '/auth/session validates Customer A');

    // Login Customer B
    await jsonFetch('/auth/request-otp', { method: 'POST', body: { phone: phoneB } });
    const validVerifyB = await jsonFetch('/auth/verify-otp', {
      method: 'POST',
      body: { phone: phoneB, otp: '6060', name: 'Customer Beta' },
    });
    const tokenB: string = validVerifyB.data.token;
    assert(Boolean(tokenB), 'Customer B verified and issued isolated JWT');

    console.log('\n--- 5. Server Cart Merge & Revalidation ---');
    // Seed server cart for Customer A with sampleProd qty 2
    await jsonFetch('/cart', {
      method: 'PUT',
      token: tokenA,
      body: { items: [{ productId: sampleProd.id, quantity: 2 }] },
    });

    // Merge guest cart containing sampleProd qty 3 (tampered unit price 1) + secondProd qty 1 + nonexistent sku
    const mergeRes = await jsonFetch('/cart/merge', {
      method: 'POST',
      token: tokenA,
      body: {
        guestItems: [
          { productId: sampleProd.id, quantity: 3, effectiveUnitPrice: 1 },
          { productId: secondProd.id, quantity: 1 },
          { productId: 'nonexistent-prod-999', name: 'Ghost Cement', quantity: 2 },
        ],
      },
    });
    const mergedItems: any[] = mergeRes.data?.data?.items || [];
    const adjustments: string[] = mergeRes.data?.data?.adjustments || [];
    const mergedSample = mergedItems.find((i) => i.productId === sampleProd.id);
    const mergedSecond = mergedItems.find((i) => i.productId === secondProd.id);
    assert((mergeRes.status === 200 || mergeRes.status === 201) && mergedItems.length === 2, 'Cart merge deduplicates items & drops nonexistent SKU', mergeRes.data);
    assert(mergedSample?.quantity === Math.min(5, sampleProd.stockCount), 'Same product+variant quantities merged without duplicate rows');
    assert(mergedSample?.effectiveUnitPrice === sampleProd.price, 'Tampered guest unit price re-validated against server catalog');
    assert(Boolean(mergedSecond), 'Guest-only item added cleanly to merged server cart');
    assert(adjustments.length >= 1, 'Adjustments reported for unavailable/price-changed guest items');

    console.log('\n--- 6. Wishlist Persistence & Guest Merge ---');
    const wlMerge = await jsonFetch('/customer/wishlist/merge', {
      method: 'POST',
      token: tokenA,
      body: { items: [sampleProd, sampleProd, { id: secondProd.id }] },
    });
    assert(wlMerge.status === 201 && wlMerge.data?.data?.length === 2, 'Wishlist merge deduplicates guest items');

    const wlToggle = await jsonFetch('/customer/wishlist/toggle', {
      method: 'POST',
      token: tokenA,
      body: { productId: secondProd.id },
    });
    assert(wlToggle.data?.wishlisted === false && wlToggle.data?.data?.length === 1, 'Authenticated wishlist toggle updates server state');

    console.log('\n--- 7. Authenticated COD Checkout & Cross-Customer 403 Isolation ---');
    const codOrderRes = await jsonFetch('/orders', {
      method: 'POST',
      token: tokenA,
      body: {
        items: [{ productId: sampleProd.id, quantity: 1 }],
        deliverySpeed: 'ASAP_60',
        deliveryAddress: {
          recipientName: 'Customer Alpha',
          mobile: phoneA,
          building: 'Plot 12',
          street: '80 Feet Road',
          area: 'Indiranagar',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560038',
        },
        paymentMethod: 'COD',
      },
    });
    assert(codOrderRes.status === 201 && Boolean(codOrderRes.data?.data?.orderNumber), 'Authenticated Customer A placed COD order cleanly');
    const orderNumA = codOrderRes.data?.data?.orderNumber;

    // Customer A can inspect & track own order (with timeline + vendorSplits)
    const [aOrders, aOrderDetail, aTrack] = await Promise.all([
      jsonFetch('/orders', { token: tokenA }),
      jsonFetch(`/orders/${orderNumA}`, { token: tokenA }),
      jsonFetch(`/orders/${orderNumA}/track`, { token: tokenA }),
    ]);
    assert(
      aOrders.status === 200 && aOrders.data?.data?.some((o: any) => o.orderNumber === orderNumA),
      'Customer A sees own COD order in GET /orders'
    );
    assert(
      aOrderDetail.status === 200 &&
        aOrderDetail.data?.data?.orderNumber === orderNumA &&
        Array.isArray(aOrderDetail.data?.data?.timeline) &&
        aOrderDetail.data?.data?.timeline.length >= 1 &&
        Boolean(aOrderDetail.data?.data?.timeline[0]?.timestamp) &&
        Array.isArray(aOrderDetail.data?.data?.vendorSplits),
      'GET /orders/:orderNumber returns full order details, delivery timeline timestamps, and vendorSplits'
    );
    assert(aTrack.status === 200 && aTrack.data?.data?.orderNumber === orderNumA, 'Customer A can track own order');

    // Customer B cannot see, view, track, pay, or cancel Customer A's order!
    const [bOrders, bOrderGet, bTrack, bCancel, bWallet, bAddresses] = await Promise.all([
      jsonFetch('/orders', { token: tokenB }),
      jsonFetch(`/orders/${orderNumA}`, { token: tokenB }),
      jsonFetch(`/orders/${orderNumA}/track`, { token: tokenB }),
      jsonFetch(`/orders/${orderNumA}/cancel`, { method: 'POST', token: tokenB, body: { reason: 'Attack' } }),
      jsonFetch('/wallet', { token: tokenB }),
      jsonFetch('/customer/addresses', { token: tokenB }),
    ]);
    assert(
      bOrders.status === 200 && !bOrders.data?.data?.some((o: any) => o.orderNumber === orderNumA),
      'Customer B GET /orders isolates out Customer A orders'
    );
    assert(bOrderGet.status === 403, 'Customer B blocked (403) from viewing Customer A order');
    assert(bTrack.status === 403, 'Customer B blocked (403) from tracking Customer A order');
    assert(bCancel.status === 403, 'Customer B blocked (403) from cancelling Customer A order');
    assert(bWallet.data?.data?.currentBalance === 0, 'Customer B wallet is isolated (₹0, does not leak seed ₹1250)');
    assert(Array.isArray(bAddresses.data?.data) && bAddresses.data.data.length === 0, 'Customer B addresses isolated (does not leak Arjun mockAddresses)');

    console.log('\n--- 8. Razorpay Payment Auth & Cross-Customer Isolation ---');
    const bRzpRetry = await jsonFetch('/payments/razorpay/order', {
      method: 'POST',
      token: tokenB,
      body: { buildoraOrderId: orderNumA },
    });
    assert(bRzpRetry.status === 403 || bRzpRetry.status === 400, 'Customer B blocked from paying for Customer A order via Razorpay', bRzpRetry.status);

    // Logout verification
    const logoutRes = await jsonFetch('/auth/logout', { method: 'POST', token: tokenA });
    assert(logoutRes.status === 201 && logoutRes.data?.success === true, 'Customer logout endpoint returns success');

    console.log(`\n=== SUMMARY: ${passed}/${total} passed, ${failed} failed ===`);
    if (failed > 0) {
      process.exitCode = 1;
    }
  } finally {
    await app.close();
  }
}

run().catch((err) => {
  console.error('Fatal E2E runner error:', err);
  process.exit(1);
});
