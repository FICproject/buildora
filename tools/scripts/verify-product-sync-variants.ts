import { SEED_PRODUCTS } from '../../packages/constants/src/seed-data';
import { dbStore } from '../../services/backend/api/src/database/store';
import { ProductsController } from '../../services/backend/api/src/modules/products/controllers/products.controller';
import { VendorController } from '../../services/backend/api/src/modules/vendors/controllers/vendor.controller';

async function runVerification() {
  console.log('=====================================================');
  console.log('BUILDORA 60 — PRODUCT CONFIGURATION & SYNC VERIFIER');
  console.log('=====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string) {
    totalTests++;
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`  [FAIL] ${testName}`);
      process.exitCode = 1;
    }
  }

  // 1. Screenshot 1 Verification: Ebco Mounting Screw Kit (Option Cards UI)
  console.log('1. Checking Ebco Mounting Screw Kit (Screenshot 1 Reference):');
  const ebco = SEED_PRODUCTS.find((p) => p.slug === 'ebco-mounting-screw-kit-for-pro-lift-bed-fittings');
  assert(!!ebco, 'Ebco Screw Kit exists in catalog');
  assert(ebco?.attributes?.[0]?.uiType === 'cards', 'Ebco Size attribute uses cards uiType');
  assert(ebco?.variants?.length === 2, 'Ebco has 2 variants (M6 ₹44, M8 ₹67)');
  assert(ebco?.variants?.[0]?.price === 44 && ebco?.variants?.[1]?.price === 67, 'Ebco variant prices match ₹44 and ₹67');

  // 2. Screenshot 2 Verification: Anchor GI Metal Back Box (Dropdown Selector UI)
  console.log('\n2. Checking Anchor GI Metal Back Box (Screenshot 2 Reference):');
  const anchor = SEED_PRODUCTS.find((p) => p.slug === 'anchor-gi-metal-back-box');
  assert(!!anchor, 'Anchor GI Back Box exists in catalog');
  assert(anchor?.attributes?.[0]?.uiType === 'dropdown', 'Anchor Size attribute uses dropdown uiType');
  assert(anchor?.variants?.length === 4, 'Anchor has 4 module size variants');
  const outOfStockVariant = anchor?.variants?.find((v) => !v.inStock || v.stock === 0);
  assert(!!outOfStockVariant && outOfStockVariant.name === '8 Module', 'Anchor has 8 Module marked out of stock');

  // 3. Screenshot 3 Verification: Conduit Pipe Roll (Multi-attribute Pills + Cards)
  console.log('\n3. Checking Flexible PVC Conduit Pipe Roll (Screenshot 3 Reference):');
  const conduit = SEED_PRODUCTS.find((p) => p.slug === 'flexible-pvc-electrical-conduit-pipe-roll');
  assert(!!conduit, 'Flexible PVC Conduit exists in catalog');
  assert(conduit?.attributes?.length === 2, 'Conduit has 2 attributes (Colour & Size)');
  assert(conduit?.attributes?.[0]?.name === 'Colour' && conduit?.attributes?.[0]?.uiType === 'pills', 'Colour attribute uses pills uiType');
  assert(conduit?.attributes?.[1]?.name === 'Size' && conduit?.attributes?.[1]?.uiType === 'cards', 'Size attribute uses cards uiType');
  assert(conduit?.variants?.length === 6, 'Conduit has full variant matrix (3 colors x 2 sizes)');
  const black25 = conduit?.variants?.find((v) => v.attributes['Colour'] === 'Black' && v.attributes['Size'] === '25mm - 25 meters');
  assert(!!black25 && !black25.inStock, 'Black / 25mm variant correctly marked out-of-stock');

  // 4. Screenshot 4 Verification: Birla White Cement (Pack Size Cards)
  console.log('\n4. Checking Birla White Cement (Screenshot 4 Reference):');
  const birla = SEED_PRODUCTS.find((p) => p.slug === 'birla-white-cement');
  assert(!!birla, 'Birla White Cement exists in catalog');
  assert(birla?.variants?.length === 3, 'Birla has 3 pack size variants (50 Kg, 5 Kg, 1 Kg)');
  assert(birla?.variants?.[0]?.name === '50 Kg' && birla?.variants?.[0]?.price === 1240, '50 Kg variant price is ₹1,240');

  // 5. Backend Cart Validation Endpoint Verification
  console.log('\n5. Checking Backend Cart Item Validation (Phase 11):');
  const prodController = new ProductsController();
  const validCartRes = prodController.validateCartItems({
    items: [
      { productId: 'prod-cem-1', quantity: 2, unitPrice: 395 },
      { productId: 'prod-ebco-screw-kit', variantId: 'v-ebco-m6', quantity: 5, unitPrice: 44 }
    ]
  });
  assert(validCartRes.success && validCartRes.isValid && validCartRes.issues.length === 0, 'In-stock cart items validate as valid');

  const invalidCartRes = prodController.validateCartItems({
    items: [
      { productId: 'prod-conduit-pipe-roll', variantId: 'v-conduit-blk-25', quantity: 1 } // Out of stock variant
    ]
  });
  assert(invalidCartRes.success && !invalidCartRes.isValid && invalidCartRes.issues[0]?.code === 'VARIANT_OUT_OF_STOCK', 'Out-of-stock variant is rejected during cart validation');

  // 6. Vendor to Customer Catalog Live Sync Verification (Phase 10)
  console.log('\n6. Checking Vendor to Customer Catalog Live Synchronization (Phase 10):');
  const vendorController = new VendorController();
  const targetProdId = 'vp-prod-cem-1';
  
  // Adjust stock via vendor controller
  vendorController.adjustStock({
    productId: targetProdId,
    adjustmentType: 'SET',
    quantity: 888,
    reason: 'Depot Stock Audit'
  });

  const syncedCustProd = dbStore.products.find((p) => p.id === 'prod-cem-1');
  assert(syncedCustProd?.stockCount === 888, 'Vendor adjustStock instantly synced to customer catalog stockCount (888)');

  // Update product price via vendor controller
  vendorController.updateProduct(targetProdId, {
    price: 389,
    mrp: 440
  });
  assert(syncedCustProd?.price === 389, 'Vendor price update instantly synced to customer catalog price (₹389)');

  console.log('\n=====================================================');
  console.log(`SUMMARY: ${passedTests}/${totalTests} TESTS PASSED!`);
  console.log('=====================================================');
}

runVerification().catch((err) => {
  console.error('Verification failed with unhandled error:', err);
  process.exit(1);
});
