/**
 * BUILDORA 60 — Comprehensive Verification for New Launches Navigation & Page
 */
import {
  MASTER_CATEGORIES,
  CONSTRUCTION_DEPARTMENTS,
  NEW_LAUNCHES_CATEGORIES,
  getNewLaunchCategoryBySlug,
  SEED_PRODUCTS,
  MASTER_BRANDS
} from '@buildora/constants';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, failureDetail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASSED: ${testName}`);
  } else {
    console.error(`  ❌ FAILED: ${testName}`);
    if (failureDetail) console.error(`     Detail: ${failureDetail}`);
    process.exitCode = 1;
  }
}

console.log('\n===============================================================');
console.log('🧪 BUILDORA 60 — NEW LAUNCHES VERIFICATION SUITE');
console.log('===============================================================\n');

// 1. Navigation Structure & Position
console.log('🔹 Check 1: New Launches Categories configured');
assert(
  NEW_LAUNCHES_CATEGORIES.length >= 8,
  `At least 8 New Launches categories exist (actual: ${NEW_LAUNCHES_CATEGORIES.length})`
);

// 2. Reference Categories Present
console.log('\n🔹 Check 2: All Reference Categories from HomeRun are mapped');
const requiredReferenceNames = [
  'Cabinet Hardware',
  'Kitchen Systems & Hardware',
  'General Hardware & Tools',
  'Bathroom Renovation Materials',
  'Conduits & Piping',
  'PVC Pipes',
  'Kitchen Sinks & Faucets',
  'Home Appliances & Power Backup'
];

requiredReferenceNames.forEach((name) => {
  const found = NEW_LAUNCHES_CATEGORIES.some((c) => c.name === name);
  assert(found, `Category "${name}" is present in NEW_LAUNCHES_CATEGORIES`);
});

// 3. Mapping to Master Categories without duplication
console.log('\n🔹 Check 3: Mapping points to valid existing master categories');
NEW_LAUNCHES_CATEGORIES.forEach((nlCat) => {
  const masterCat = MASTER_CATEGORIES.find((m) => m.slug === nlCat.masterCategorySlug);
  assert(
    !!masterCat,
    `New Launch category "${nlCat.name}" maps to master category "${nlCat.masterCategorySlug}"`
  );
  if (masterCat) {
    assert(
      masterCat.subcategories && masterCat.subcategories.length > 0,
      `Master category "${masterCat.name}" provides ${masterCat.subcategories?.length || 0} child subcategories`
    );
  }
});

// 4. Products Integration & No Duplication
console.log('\n🔹 Check 4: Product taxonomy integrity and New Launches tag');
const newLaunchProducts = SEED_PRODUCTS.filter((p) => p.isNewLaunch);
assert(
  newLaunchProducts.length >= 10,
  `At least 10 products marked as isNewLaunch (actual: ${newLaunchProducts.length})`
);

// Verify no duplicate product IDs
const productIds = SEED_PRODUCTS.map((p) => p.id);
const uniqueIds = new Set(productIds);
assert(
  uniqueIds.size === productIds.length,
  `Zero duplicate product IDs in SEED_PRODUCTS (${uniqueIds.size}/${productIds.length})`
);

// Verify product categorySlugs match existing MASTER_CATEGORIES
const masterCategorySlugs = new Set(MASTER_CATEGORIES.map((c) => c.slug));
const allCategoriesValid = SEED_PRODUCTS.every((p) => masterCategorySlugs.has(p.categorySlug));
assert(
  allCategoriesValid,
  'All product category slugs point to valid master categories (original 28 intact)'
);

// 5. Original Master Categories Preserved
console.log('\n🔹 Check 5: Original 28 Master Categories intact');
assert(
  MASTER_CATEGORIES.length === 28,
  `Exact 28 master categories preserved (actual: ${MASTER_CATEGORIES.length})`
);

assert(
  CONSTRUCTION_DEPARTMENTS.length === 5,
  `All 5 construction departments preserved (actual: ${CONSTRUCTION_DEPARTMENTS.length})`
);

// 6. Brands Functionality Preserved
console.log('\n🔹 Check 6: Brands database and directory preserved');
assert(
  MASTER_BRANDS.length === 10,
  `All 10 authorized brand partners preserved (actual: ${MASTER_BRANDS.length})`
);

// 7. Category by slug lookup helper
console.log('\n🔹 Check 7: Category helper functions');
const cabinetHw = getNewLaunchCategoryBySlug('cabinet-hardware');
assert(
  cabinetHw?.masterCategorySlug === 'hinges-channels-handles',
  'getNewLaunchCategoryBySlug resolves cabinet-hardware to hinges-channels-handles'
);

const pvcPipes = getNewLaunchCategoryBySlug('pvc-pipes');
assert(
  pvcPipes?.masterCategorySlug === 'cpvc-pipes-overhead-tanks',
  'getNewLaunchCategoryBySlug resolves pvc-pipes to cpvc-pipes-overhead-tanks'
);

// 8. Product Pricing, Delivery & Cart attributes
console.log('\n🔹 Check 8: Product card attribute completeness');
const sampleNewProduct = newLaunchProducts[0];
assert(
  !!sampleNewProduct.images && sampleNewProduct.images.length > 0,
  'Products have valid high-resolution images'
);
assert(
  sampleNewProduct.price > 0 && sampleNewProduct.mrp >= sampleNewProduct.price,
  'Pricing and MRP properly defined'
);
assert(
  sampleNewProduct.gstRate === 18 || sampleNewProduct.gstRate === 28,
  'GST rate defined compliant with standard construction tax tiers'
);
assert(
  sampleNewProduct.deliverySpeedAvailable.includes('ASAP_60') ||
    sampleNewProduct.deliverySpeedAvailable.includes('SCHEDULED'),
  'Delivery speed flags populated'
);

console.log('\n===============================================================');
console.log(`🎉 TEST SUMMARY: ${passedTests} OF ${totalTests} TESTS PASSED!`);
console.log('===============================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
