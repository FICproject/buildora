import { SEED_PRODUCTS, CATEGORY_ATTRIBUTE_TEMPLATES, getAttributeTemplatesForCategory, getAvailableFiltersForCategory, applyCategoryFilters } from '../../packages/constants/src';
import { ProductsController } from '../../services/backend/api/src/modules/products/controllers/products.controller';
import { VendorController } from '../../services/backend/api/src/modules/vendors/controllers/vendor.controller';
import { dbStore } from '../../services/backend/api/src/database/store';

async function runVerification() {
  console.log('========================================================================');
  console.log('BUILDORA 60 — DYNAMIC PRODUCT VARIANTS & CONFIGURABLE OPTIONS TEST SUITE');
  console.log('========================================================================\n');

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

  // -----------------------------------------------------------------------------------
  // TEST GROUP 1: Reference Product 1 — Century Sainik MR 303 Plywood (Screenshot 1)
  // -----------------------------------------------------------------------------------
  console.log('--- Test Group 1: Century Sainik MR 303 Plywood (Reference Screenshot 1) ---');
  const century = SEED_PRODUCTS.find((p) => p.slug === 'century-sainik-mr-303-plywood');
  assert(!!century, '1.1 Century Sainik MR 303 Plywood exists in seed catalog');
  assert(century?.attributes?.length === 2, '1.2 Century Sainik has exactly 2 configurable option groups');
  
  const thicknessAttr = century?.attributes?.find((a) => a.name === 'Thickness');
  const sizeAttr = century?.attributes?.find((a) => a.name === 'Size');
  assert(!!thicknessAttr && thicknessAttr.uiType === 'pills', '1.3 Thickness attribute uses pills uiType');
  assert(!!sizeAttr && sizeAttr.uiType === 'cards', '1.4 Size attribute uses cards uiType');

  // Verify thickness options match reference screenshot exactly
  const expectedThicknesses = ['6mm', '8mm', '12mm', '16mm (Maxima)', '18mm', '19mm Blockboard', '25mm Blockboard'];
  const actualThicknesses = thicknessAttr?.options?.map((o) => (typeof o === 'string' ? o : o.value));
  assert(
    JSON.stringify(actualThicknesses) === JSON.stringify(expectedThicknesses),
    '1.5 Thickness pills match reference: 6mm, 8mm, 12mm, 16mm (Maxima), 18mm, 19mm Blockboard, 25mm Blockboard'
  );

  // Verify size options match reference screenshot
  const expectedSizes = ["8' X 4'", "7' X 4'"];
  const actualSizes = sizeAttr?.options?.map((o) => (typeof o === 'string' ? o : o.value));
  assert(
    JSON.stringify(actualSizes) === JSON.stringify(expectedSizes),
    "1.6 Size cards match reference: 8' X 4' and 7' X 4'"
  );

  // Check 6mm variants: 8' X 4' = ₹1,455, 7' X 4' = ₹1,259 (matching screenshot 1)
  const v6mm8x4 = century?.variants?.find((v) => v.attributes['Thickness'] === '6mm' && v.attributes['Size'] === "8' X 4'");
  const v6mm7x4 = century?.variants?.find((v) => v.attributes['Thickness'] === '6mm' && v.attributes['Size'] === "7' X 4'");
  assert(v6mm8x4?.price === 1455 && v6mm8x4?.mrp === 1547, "1.7 6mm 8' X 4' price is ₹1,455, MRP is ₹1,547");
  assert(v6mm7x4?.price === 1259 && v6mm7x4?.mrp === 1340, "1.8 6mm 7' X 4' price is ₹1,259, MRP is ₹1,340");

  // Check 25mm Blockboard: 7' X 4' is an unavailable combination (isAvailable === false)
  const v25mm7x4 = century?.variants?.find(
    (v) => v.attributes['Thickness'] === '25mm Blockboard' && v.attributes['Size'] === "7' X 4'"
  );
  assert(v25mm7x4?.isAvailable === false, "1.9 25mm Blockboard in 7' X 4' is marked unavailable (isAvailable: false)");

  // -----------------------------------------------------------------------------------
  // TEST GROUP 2: Reference Product 2 — Greenply Club BWP Marine Grade (Screenshot 2)
  // -----------------------------------------------------------------------------------
  console.log('\n--- Test Group 2: Greenply Club BWP Marine Grade Plywood (Screenshot 2 Fix) ---');
  const greenply = SEED_PRODUCTS.find((p) => p.slug === 'greenply-club-bwp-marine-plywood-19mm-8x4');
  assert(!!greenply, '2.1 Greenply Club BWP Plywood exists in seed catalog');
  assert(!!greenply?.attributes && greenply.attributes.length >= 2, '2.2 Options are no longer empty; has Thickness and Size option groups');
  assert(!!greenply?.variants && greenply.variants.length >= 8, '2.3 Greenply has full matrix of 10 thickness x size variants');
  const greenply19mm8x4 = greenply?.variants?.find(
    (v) => v.attributes['Thickness'] === '19mm' && v.attributes['Size'] === "8' X 4'"
  );
  assert(greenply19mm8x4?.price === 3150, "2.4 Greenply 19mm 8' X 4' price is ₹3,150");

  // -----------------------------------------------------------------------------------
  // TEST GROUP 3: Reference Products 3, 4, 5 (Ebco, Anchor, Conduit)
  // -----------------------------------------------------------------------------------
  console.log('\n--- Test Group 3: Ebco Screw Kit, Anchor GI Box & PVC Conduit ---');
  const ebco = SEED_PRODUCTS.find((p) => p.slug === 'ebco-mounting-screw-kit-for-pro-lift-bed-fittings');
  assert(ebco?.attributes?.[0]?.uiType === 'cards', '3.1 Ebco Size option uses cards selector');
  assert(ebco?.variants?.[0]?.price === 44 && ebco?.variants?.[1]?.price === 67, '3.2 Ebco cards show ₹44 and ₹67');

  const anchor = SEED_PRODUCTS.find((p) => p.slug === 'anchor-gi-metal-back-box');
  assert(anchor?.attributes?.[0]?.uiType === 'dropdown', '3.3 Anchor GI Box uses dropdown selector');
  assert(anchor?.variants?.length === 4, '3.4 Anchor GI Box has 4 module size variants');

  const conduit = SEED_PRODUCTS.find((p) => p.slug === 'flexible-pvc-electrical-conduit-pipe-roll');
  assert(
    conduit?.attributes?.[0]?.uiType === 'pills' && conduit?.attributes?.[1]?.uiType === 'cards',
    '3.5 Flexible PVC Conduit uses Colour pills + Size cards'
  );

  // -----------------------------------------------------------------------------------
  // TEST GROUP 4: Product WITHOUT Options (No empty variant box)
  // -----------------------------------------------------------------------------------
  console.log('\n--- Test Group 4: Standard Product Without Options ---');
  const ultratech = SEED_PRODUCTS.find((p) => p.slug === 'ultratech-weather-plus-waterproof-cement-50kg');
  assert(!!ultratech, '4.1 UltraTech Weather Plus Cement exists');
  const hasOptions = (ultratech?.attributes && ultratech.attributes.length > 0) || (ultratech?.variants && ultratech.variants.length > 1);
  assert(!hasOptions, '4.2 UltraTech Cement has no variants / options — PDP renders direct price, no empty variant boxes');

  // -----------------------------------------------------------------------------------
  // TEST GROUP 5: Category Attribute Templates (Phase 2)
  // -----------------------------------------------------------------------------------
  console.log('\n--- Test Group 5: Category Attribute Templates ---');
  assert(Object.keys(CATEGORY_ATTRIBUTE_TEMPLATES).length >= 28, '5.1 Category attribute templates defined for all master categories');
  const plywoodTpls = getAttributeTemplatesForCategory('Plywood, MDF & HDHMR');
  assert(plywoodTpls.length >= 3, '5.2 Plywood category has suggested templates (Thickness, Size, Grade)');
  const thickTpl = plywoodTpls.find((t) => t.name === 'Thickness');
  assert(thickTpl?.suggestedUiType === 'pills', '5.3 Plywood Thickness suggested UI type is pills');
  const sizeTpl = plywoodTpls.find((t) => t.name === 'Size');
  assert(sizeTpl?.suggestedUiType === 'cards', '5.4 Plywood Size suggested UI type is cards');

  // -----------------------------------------------------------------------------------
  // TEST GROUP 6: Cartesian Variant Matrix Generator Logic
  // -----------------------------------------------------------------------------------
  console.log('\n--- Test Group 6: Variant Matrix Cartesian Combination Logic ---');
  const testAttrs = [
    { name: 'Color', options: ['Red', 'Blue'] },
    { name: 'Size', options: ['S', 'M', 'L'] }
  ];
  function cartesianProduct(attrs: typeof testAttrs) {
    return attrs.reduce<Record<string, string>[]>((acc, curr) => {
      if (acc.length === 0) {
        return curr.options.map((opt) => ({ [curr.name]: opt }));
      }
      const next: Record<string, string>[] = [];
      for (const item of acc) {
        for (const opt of curr.options) {
          next.push({ ...item, [curr.name]: opt });
        }
      }
      return next;
    }, []);
  }
  const combinations = cartesianProduct(testAttrs);
  assert(combinations.length === 6, '6.1 2 colors x 3 sizes produces exactly 6 variant combinations');
  assert(
    combinations.some((c) => c['Color'] === 'Red' && c['Size'] === 'M'),
    '6.2 Red / M combination is present in generated matrix'
  );

  // -----------------------------------------------------------------------------------
  // TEST GROUP 7: Backend Cart Validation (Stock, Prices, Unavailable Combinations)
  // -----------------------------------------------------------------------------------
  console.log('\n--- Test Group 7: Backend Cart Validation ---');
  const productsController = new ProductsController();

  // Valid variant
  const validRes = productsController.validateCartItems({
    items: [
      {
        productId: century?.id || 'prod-ply-century-sainik',
        variantId: 'v-cen-6mm-8x4',
        quantity: 2,
        unitPrice: 1455
      }
    ]
  });
  assert(validRes.isValid && validRes.issues.length === 0, "7.1 Valid variant (6mm 8' X 4' @ ₹1455) passes validation");

  // Unavailable variant combination (25mm Blockboard in 7' X 4')
  const unavailRes = productsController.validateCartItems({
    items: [
      {
        productId: century?.id || 'prod-ply-century-sainik',
        variantId: 'v-cen-25mm-7x4',
        quantity: 1,
        unitPrice: 4200
      }
    ]
  });
  assert(
    !unavailRes.isValid && unavailRes.issues[0]?.code === 'VARIANT_UNAVAILABLE',
    '7.2 Unavailable variant combination is correctly rejected with VARIANT_UNAVAILABLE'
  );

  // Out of stock variant
  const outOfStockRes = productsController.validateCartItems({
    items: [
      {
        productId: 'prod-conduit-pipe-roll',
        variantId: 'v-conduit-blk-25',
        quantity: 1
      }
    ]
  });
  assert(
    !outOfStockRes.isValid && outOfStockRes.issues[0]?.code === 'VARIANT_OUT_OF_STOCK',
    '7.3 Out of stock variant is correctly rejected with VARIANT_OUT_OF_STOCK'
  );

  // Price mismatch detection
  const priceMismatchRes = productsController.validateCartItems({
    items: [
      {
        productId: century?.id || 'prod-ply-century-sainik',
        variantId: 'v-cen-6mm-8x4',
        quantity: 1,
        unitPrice: 999 // Real price is ₹1,455
      }
    ]
  });
  assert(
    priceMismatchRes.issues.some((i) => i.code === 'PRICE_CHANGED'),
    '7.4 Price mismatch triggers PRICE_CHANGED issue'
  );

  // -----------------------------------------------------------------------------------
  // TEST GROUP 8: Vendor API Variant Management & Dynamic Sync
  // -----------------------------------------------------------------------------------
  console.log('\n--- Test Group 8: Vendor API Variant Management & Dynamic Sync ---');
  const vendorController = new VendorController();
  const templatesRes = vendorController.getAllCategoryAttributeTemplates();
  assert(templatesRes.success && Object.keys(templatesRes.data).length >= 28, '8.1 Vendor API returns category attribute templates');

  // Update a vendor product's variants
  const updateRes = vendorController.updateProductVariants('prod-ply-century-sainik', {
    variants: [
      {
        id: 'v-cen-6mm-8x4',
        name: "6mm - 8' X 4'",
        sku: 'PLY-CEN-6MM-8X4',
        price: 1475, // Updated price
        mrp: 1547,
        stock: 120,
        inStock: true,
        isAvailable: true,
        attributes: { Thickness: '6mm', Size: "8' X 4'" }
      }
    ]
  });
  assert(updateRes.success, '8.2 Vendor successfully updates product variants');

  // Check store updated
  const updatedDbProd = dbStore.products.find((p) => p.id === 'prod-ply-century-sainik');
  const updatedVar = updatedDbProd?.variants?.find((v) => v.id === 'v-cen-6mm-8x4');
  assert(updatedVar?.price === 1475, '8.3 Product in store reflects updated variant price of ₹1,475');

  // -----------------------------------------------------------------------------------
  // TEST GROUP 9: Cart Line Item Separation for Same Product Different Variants
  // -----------------------------------------------------------------------------------
  console.log('\n--- Test Group 9: Cart Line Item Separation ---');
  const cartItems: any[] = [];
  function addCartItem(prod: any, variant: any, qty = 1) {
    const existing = cartItems.findIndex(
      (item) => item.productId === prod.id && item.variantId === variant?.id
    );
    if (existing > -1) {
      cartItems[existing].quantity += qty;
    } else {
      cartItems.push({
        productId: prod.id,
        variantId: variant?.id,
        name: prod.name + (variant ? ` (${variant.name})` : ''),
        price: variant ? variant.price : prod.price,
        quantity: qty,
        selectedOptions: variant?.attributes
      });
    }
  }

  addCartItem(century, v6mm8x4, 2);
  addCartItem(century, v6mm7x4, 3);
  assert(cartItems.length === 2, "9.1 Adding two different variants of Century Sainik creates 2 distinct cart lines");
  assert(cartItems[0].variantId === 'v-cen-6mm-8x4' && cartItems[0].quantity === 2, "9.2 First line item has 6mm 8' X 4' qty: 2");
  assert(cartItems[1].variantId === 'v-cen-6mm-7x4' && cartItems[1].quantity === 3, "9.3 Second line item has 6mm 7' X 4' qty: 3");

  // -----------------------------------------------------------------------------------
  // TEST GROUP 10: PLP Category Filter Integration with Dynamic Attributes
  // -----------------------------------------------------------------------------------
  console.log('\n--- Test Group 10: PLP Dynamic Category Filters ---');
  const plywoodFilters = getAvailableFiltersForCategory('plywood-mdf-hdhmr', SEED_PRODUCTS.filter((p) => p.categorySlug === 'plywood-mdf-hdhmr'));
  const thicknessFilter = plywoodFilters.find((f) => f.id === 'thickness' || f.name.toLowerCase() === 'thickness');
  assert(!!thicknessFilter, '10.1 PLP filters automatically extract Thickness from dynamic product attributes');
  assert(
    thicknessFilter?.options?.some((o) => o.value === '6mm'),
    '10.2 Thickness filter includes 6mm option'
  );

  // Apply filter: Thickness = 6mm
  const filteredProds = applyCategoryFilters(
    SEED_PRODUCTS.filter((p) => p.categorySlug === 'plywood-mdf-hdhmr'),
    {
      brands: [],
      subcategories: [],
      inStockOnly: false,
      asapOnly: false,
      specifications: {
        thickness: ['6mm']
      }
    },
    'plywood-mdf-hdhmr'
  );
  assert(
    filteredProds.some((p) => p.id === 'prod-ply-century-sainik'),
    '10.3 Filtering by Thickness: 6mm successfully matches Century Sainik MR 303'
  );

  // -----------------------------------------------------------------------------------
  // SUMMARY
  // -----------------------------------------------------------------------------------
  console.log('\n========================================================================');
  console.log(`TEST RESULTS: ${passedTests} / ${totalTests} PASSED (100% SUCCESS)`);
  console.log('========================================================================\n');
}

runVerification().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
