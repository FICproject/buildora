import { calculateCartSummary, UnloadingServiceOptions } from '../../packages/utils/src';
import { AVAILABLE_COUPONS, SEED_PRODUCTS } from '../../packages/constants/src';

console.log('================================================================');
console.log('BUILDORA 60 — STEP 2: CART & PRICING ENGINE VERIFICATION');
console.log('================================================================\n');

let totalPassed = 0;
let totalFailed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    totalPassed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    totalFailed++;
  }
}

// -----------------------------------------------------------------------------
// TEST 1: PRODUCT INFO & BASIC CART SUMMARY
// -----------------------------------------------------------------------------
console.log('--- TEST 1: Cart Items Subtotal & Pricing Accuracy ---');

const cement = SEED_PRODUCTS.find((p) => p.categorySlug === 'cement-concrete')!;
const tile = SEED_PRODUCTS.find((p) => p.categorySlug === 'tiling-tile-adhesives')!;

const summary1 = calculateCartSummary({
  items: [
    {
      productId: cement.id,
      categorySlug: cement.categorySlug,
      name: cement.name,
      price: 395,
      quantity: 2,
      gstRate: 28,
      bulkDiscountPercentage: 0
    }
  ],
  deliverySpeed: 'STANDARD'
});

assert(summary1.subtotal === 790, `Subtotal is 395 * 2 = 790 (Actual: ${summary1.subtotal})`);
assert(summary1.deliveryFee === 199, `Below ₹1,000 standard delivery fee is ₹199 (Actual: ${summary1.deliveryFee})`);
assert(summary1.handlingFee === 99, `Cement triggers Heavy Material Handling fee ₹99 (Actual: ${summary1.handlingFee})`);
assert(summary1.grandTotal === 790 + 199 + 99, `Grand Total = 790 + 199 + 99 = 1088 (Actual: ${summary1.grandTotal})`);

// -----------------------------------------------------------------------------
// TEST 2: COUPON CALCULATIONS & RESTRICTIONS
// -----------------------------------------------------------------------------
console.log('\n--- TEST 2: Coupon Calculations & Restrictions ---');

const build60 = AVAILABLE_COUPONS.find((c) => c.code === 'BUILD60')!; // ₹300 off min ₹2500
const construct10 = AVAILABLE_COUPONS.find((c) => c.code === 'CONSTRUCT10')!; // 10% off min ₹10,000 max ₹1500

// Below min order value: coupon should give 0 discount
const summaryCouponBelow = calculateCartSummary({
  items: [{ price: 1000, quantity: 2, gstRate: 18 }], // subtotal 2000 < 2500
  coupon: build60
});
assert(summaryCouponBelow.couponDiscount === 0, `Below min order value ₹2500 gives ₹0 discount (Actual: ${summaryCouponBelow.couponDiscount})`);

// Above min order value: flat ₹300 off
const summaryCouponAbove = calculateCartSummary({
  items: [{ price: 1000, quantity: 3, gstRate: 18 }], // subtotal 3000 >= 2500
  coupon: build60
});
assert(summaryCouponAbove.couponDiscount === 300, `Flat coupon BUILD60 gives ₹300 discount on ₹3000 order (Actual: ${summaryCouponAbove.couponDiscount})`);

// Percentage coupon with maxDiscount cap
const summaryCouponCap = calculateCartSummary({
  items: [{ price: 20000, quantity: 1, gstRate: 18 }], // 10% of 20000 = 2000, but cap is 1500
  coupon: construct10
});
assert(summaryCouponCap.couponDiscount === 1500, `10% coupon capped at max ₹1500 (Actual: ${summaryCouponCap.couponDiscount})`);

// -----------------------------------------------------------------------------
// TEST 3: DELIVERY CHARGE ENGINE
// -----------------------------------------------------------------------------
console.log('\n--- TEST 3: Delivery Charge Engine ---');

// Cart above ₹1,999 threshold -> Free delivery
const summaryFreeDel = calculateCartSummary({
  items: [{ price: 2500, quantity: 1, gstRate: 18 }],
  deliverySpeed: 'STANDARD'
});
assert(summaryFreeDel.deliveryFee === 0, `Orders >= ₹1,999 get free standard delivery (Actual: ${summaryFreeDel.deliveryFee})`);

// ASAP_60 above threshold -> ₹49 priority dispatch
const summaryAsapThreshold = calculateCartSummary({
  items: [{ price: 2500, quantity: 1, gstRate: 18 }],
  deliverySpeed: 'ASAP_60'
});
assert(summaryAsapThreshold.deliveryFee === 49, `ASAP_60 orders >= ₹1,999 pay nominal ₹49 priority dispatch (Actual: ${summaryAsapThreshold.deliveryFee})`);

// Below threshold -> ₹149 for ASAP_60
const summaryAsapBelow = calculateCartSummary({
  items: [{ price: 500, quantity: 1, gstRate: 18 }],
  deliverySpeed: 'ASAP_60'
});
assert(summaryAsapBelow.deliveryFee === 149, `ASAP_60 orders < ₹1,999 pay ₹149 express delivery (Actual: ${summaryAsapBelow.deliveryFee})`);

// -----------------------------------------------------------------------------
// TEST 4: HANDLING CHARGES FOR CONSTRUCTION MATERIALS
// -----------------------------------------------------------------------------
console.log('\n--- TEST 4: Handling Charges Engine ---');

const summaryFragile = calculateCartSummary({
  items: [{ name: 'Vitrified Wall Tiles', categorySlug: 'tiling-tile-adhesives', price: 880, quantity: 1, isFragile: true }]
});
assert(summaryFragile.handlingFee === 49, `Fragile tiles trigger ₹49 transit protection (Actual: ${summaryFragile.handlingFee})`);
assert(summaryFragile.handlingBreakdown.some((h) => h.type === 'FRAGILE'), `Breakdown lists Fragile protection`);

const summaryHeavyAndFragile = calculateCartSummary({
  items: [
    { name: 'UltraTech Super Cement', categorySlug: 'cement-concrete', price: 395, quantity: 5, isHeavy: true },
    { name: 'Double Charge Tiles', categorySlug: 'tiling-tile-adhesives', price: 880, quantity: 2, isFragile: true }
  ]
});
assert(summaryHeavyAndFragile.handlingFee === 99 + 49, `Heavy (₹99) + Fragile (₹49) = ₹148 handling fee (Actual: ${summaryHeavyAndFragile.handlingFee})`);

// -----------------------------------------------------------------------------
// TEST 5: OPTIONAL SITE UNLOADING SERVICE
// -----------------------------------------------------------------------------
console.log('\n--- TEST 5: Optional Site Unloading Service ---');

// Ground floor unloading -> ₹199
const unloadingGround: UnloadingServiceOptions = {
  required: true,
  floor: 0,
  hasLift: true
};
const summaryUnloadGround = calculateCartSummary({
  items: [{ price: 1000, quantity: 1 }],
  unloadingOptions: unloadingGround
});
assert(summaryUnloadGround.unloadingFee === 199, `Ground floor unloading base fee is ₹199 (Actual: ${summaryUnloadGround.unloadingFee})`);

// 3rd floor with lift -> ₹199 (no surcharge)
const unloadingLift: UnloadingServiceOptions = {
  required: true,
  floor: 3,
  hasLift: true
};
const summaryUnloadLift = calculateCartSummary({
  items: [{ price: 1000, quantity: 1 }],
  unloadingOptions: unloadingLift
});
assert(summaryUnloadLift.unloadingFee === 199, `3rd floor WITH lift has NO floor surcharge: ₹199 (Actual: ${summaryUnloadLift.unloadingFee})`);

// 3rd floor NO lift -> ₹199 + (3 * 50) = ₹349
const unloadingNoLift: UnloadingServiceOptions = {
  required: true,
  floor: 3,
  hasLift: false
};
const summaryUnloadNoLift = calculateCartSummary({
  items: [{ price: 1000, quantity: 1 }],
  unloadingOptions: unloadingNoLift
});
assert(summaryUnloadNoLift.unloadingFee === 199 + 150, `3rd floor WITHOUT lift has surcharge 3 * 50 = ₹150; Total = ₹349 (Actual: ${summaryUnloadNoLift.unloadingFee})`);

// -----------------------------------------------------------------------------
// TEST 6: COMPLETE BILL BREAKDOWN & WALLET DEDUCTION
// -----------------------------------------------------------------------------
console.log('\n--- TEST 6: Complete Bill Details & Wallet Calculation ---');

const fullBillSummary = calculateCartSummary({
  items: [
    {
      price: 500,
      quantity: 10, // subtotal 5000
      bulkDiscountPercentage: 10, // discount 500 -> discountedSubtotal 4500
      isHeavy: true // handling 99
    }
  ],
  coupon: build60, // 300 off min 2500 -> 4500 - 300 = 4200
  deliverySpeed: 'STANDARD', // subtotal 4500 >= 1000 -> delivery 0
  unloadingOptions: unloadingNoLift, // 349
  walletBalanceToUse: 500 // wallet deduction
});

// Grand Total before wallet: 4500 - 300 + 0 + 99 + 349 = 4648
assert(fullBillSummary.grandTotal === 4648, `Grand Total is 4648 (Actual: ${fullBillSummary.grandTotal})`);
assert(fullBillSummary.walletUsed === 500, `Wallet used is 500 (Actual: ${fullBillSummary.walletUsed})`);
assert(fullBillSummary.payableAmount === 4648 - 500, `Payable amount is 4148 (Actual: ${fullBillSummary.payableAmount})`);

console.log('\n================================================================');
console.log(`STEP 2 VALIDATION SUMMARY: ${totalPassed} PASSED, ${totalFailed} FAILED`);
console.log('================================================================');

if (totalFailed > 0) process.exit(1);
