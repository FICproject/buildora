import {
  SEED_PRODUCTS
} from '../../packages/constants/src';
import { calculateCartSummary } from '../../packages/utils/src';
import { CartItem, Product, ProductVariant } from '../../packages/types/src';

console.log('================================================================');
console.log('BUILDORA 60 — PRODUCT CARDS, MULTI-IMAGE & VARIANTS AUDIT & TEST');
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
// TEST 1: MULTI-IMAGE PRODUCTS AUDIT
// -----------------------------------------------------------------------------
console.log('--- TEST 1: Multi-Image Products Audit ---');

const multiImageProducts = SEED_PRODUCTS.filter((p) => p.images && p.images.length > 1);
assert(
  multiImageProducts.length >= 5,
  `Multiple products have multi-image galleries (found ${multiImageProducts.length} multi-image products)`
);

const roffProduct = SEED_PRODUCTS.find((p) => p.slug === 'roff-t01-nca-tile-adhesive-30kg');
assert(
  !!roffProduct && roffProduct.images.length === 4,
  `Roff T01 NCA Tile Adhesive has 4 images for multi-dot carousel (count: ${roffProduct?.images.length})`
);

const birlaProduct = SEED_PRODUCTS.find((p) => p.slug === 'birla-white-cement');
assert(
  !!birlaProduct && birlaProduct.images.length === 3,
  `Birla White Cement has 3 images for carousel (count: ${birlaProduct?.images.length})`
);

// -----------------------------------------------------------------------------
// TEST 2: MULTI-VARIANT PRODUCTS AUDIT (Options Button)
// -----------------------------------------------------------------------------
console.log('\n--- TEST 2: Multi-Variant Products Audit (Options Button) ---');

assert(
  !!birlaProduct && !!birlaProduct.variants && birlaProduct.variants.length === 3,
  `Birla White Cement has exactly 3 options (50 Kg, 5 Kg, 1 Kg) matching reference screenshot 1 & 2`
);

if (birlaProduct?.variants) {
  const v50 = birlaProduct.variants.find((v) => v.name === '50 Kg');
  const v5 = birlaProduct.variants.find((v) => v.name === '5 Kg');
  const v1 = birlaProduct.variants.find((v) => v.name === '1 Kg');

  assert(
    !!v50 && v50.price === 1240 && v50.mrp === 1350,
    `50 Kg variant has selling price ₹1,240 and MRP ₹1,350`
  );
  assert(
    !!v5 && v5.price === 140 && v5.mrp === 150,
    `5 Kg variant has selling price ₹140 and MRP ₹150`
  );
  assert(
    !!v1 && v1.price === 40 && v1.mrp === 40,
    `1 Kg variant has selling price ₹40 and MRP ₹40`
  );
}

// -----------------------------------------------------------------------------
// TEST 3: CART ISOLATION FOR MULTIPLE VARIANTS
// -----------------------------------------------------------------------------
console.log('\n--- TEST 3: Cart Line Isolation for Multiple Variants ---');

// Simulate adding 50 Kg (qty 1) and 5 Kg (qty 2) of Birla White Cement
const cartItems: CartItem[] = [];

function addItem(product: Product, quantity: number, variant?: ProductVariant) {
  const effectivePrice = variant ? variant.price : product.price;
  const effectiveMrp = variant ? variant.mrp : product.mrp;
  const variantId = variant?.id;

  const existingIndex = cartItems.findIndex(
    (item) => item.productId === product.id && item.variantId === variantId
  );

  if (existingIndex > -1) {
    cartItems[existingIndex].quantity += quantity;
    cartItems[existingIndex].totalPrice = cartItems[existingIndex].quantity * effectivePrice;
  } else {
    cartItems.push({
      productId: product.id,
      variantId,
      sku: variant ? variant.sku : product.sku,
      name: product.name + (variant ? ` (${variant.name})` : ''),
      slug: product.slug,
      brand: product.brand,
      image: variant?.image || product.images[0] || '',
      unit: variant?.name || product.unit,
      price: effectivePrice,
      mrp: effectiveMrp,
      gstRate: product.gstRate,
      quantity,
      bulkDiscountPercentage: 0,
      effectiveUnitPrice: effectivePrice,
      totalPrice: effectivePrice * quantity,
      maxStock: variant ? variant.stock : product.stockCount
    });
  }
}

// Add 50 Kg
addItem(birlaProduct!, 1, birlaProduct!.variants![0]);
// Add 5 Kg (qty 2)
addItem(birlaProduct!, 2, birlaProduct!.variants![1]);

assert(
  cartItems.length === 2,
  `Adding 50 Kg and 5 Kg variants creates 2 distinct cart lines (found: ${cartItems.length})`
);

assert(
  cartItems[0].variantId === 'v-birla-50kg' && cartItems[0].totalPrice === 1240,
  `Variant 1 line: 50 Kg (qty 1) = ₹1,240`
);

assert(
  cartItems[1].variantId === 'v-birla-5kg' && cartItems[1].totalPrice === 280,
  `Variant 2 line: 5 Kg (qty 2) = ₹280 (₹140 * 2)`
);

const summary = calculateCartSummary({ items: cartItems, coupon: null, walletBalanceToUse: 0 });
assert(
  summary.itemCount === 3 && summary.subtotal === 1520,
  `Cart summary correctly calculates total items (3) and subtotal (₹1,520: 1240 + 280)`
);

// Test independent decrement: remove 50 Kg
const remIndex = cartItems.findIndex((i) => i.variantId === 'v-birla-50kg');
cartItems.splice(remIndex, 1);

assert(
  cartItems.length === 1 && cartItems[0].variantId === 'v-birla-5kg',
  `Removing 50 Kg preserves 5 Kg variant independently in cart`
);

console.log('\n================================================================');
console.log(`VERIFICATION SUMMARY: ${totalPassed} PASSED, ${totalFailed} FAILED`);
console.log('================================================================\n');

if (totalFailed > 0) {
  process.exit(1);
}
