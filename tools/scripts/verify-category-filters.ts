import {
  MASTER_CATEGORIES,
  SEED_PRODUCTS,
  CATEGORY_FILTER_CONFIGS,
  getAvailableFiltersForCategory,
  applyCategoryFilters,
  ActiveCategoryFilters
} from '../../packages/constants/src';

console.log('================================================================');
console.log('BUILDORA 60 — 28 MASTER CATEGORIES PRODUCT FILTERS AUDIT & TEST');
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
// TEST 1: ALL 28 MASTER CATEGORIES CONFIGURATION & GENERATION
// -----------------------------------------------------------------------------
console.log('--- TEST 1: Auditing Filter Configurations Across All 28 Master Categories ---');

assert(MASTER_CATEGORIES.length === 28, `Expected exactly 28 master categories, found ${MASTER_CATEGORIES.length}`);

for (const category of MASTER_CATEGORIES) {
  const config = CATEGORY_FILTER_CONFIGS[category.slug];
  assert(!!config && config.length > 0, `Category '${category.name}' (${category.slug}) has dedicated filter config with ${config?.length || 0} dimensions`);

  const categoryProducts = SEED_PRODUCTS.filter((p) => p.categorySlug === category.slug);
  const availableFilters = getAvailableFiltersForCategory(category.slug, categoryProducts);

  assert(
    categoryProducts.length >= 1,
    `Category '${category.name}' has seed products (count: ${categoryProducts.length})`
  );

  assert(
    availableFilters.length > 0,
    `Category '${category.name}' dynamically produces ${availableFilters.length} non-empty filter sections: ${availableFilters.map((f) => f.name).join(', ')}`
  );

  // Verify no dimension has 0 options (no dead-end filters)
  const emptyFilters = availableFilters.filter((f) => f.type === 'checkbox' && (!f.options || f.options.length === 0));
  assert(
    emptyFilters.length === 0,
    `Category '${category.name}' has 0 dead-end empty filter blocks`
  );
}

// -----------------------------------------------------------------------------
// TEST 2: DOMAIN-SPECIFIC ATTRIBUTES VERIFICATION
// -----------------------------------------------------------------------------
console.log('\n--- TEST 2: Verifying Domain-Specific Specification Dimensions ---');

// Cement -> Grade
const cementFilters = getAvailableFiltersForCategory(
  'cement-concrete',
  SEED_PRODUCTS.filter((p) => p.categorySlug === 'cement-concrete')
);
const gradeFilter = cementFilters.find((f) => f.id === 'grade');
assert(!!gradeFilter && gradeFilter.options.length > 0, `Cement category includes Grade filter with options: ${gradeFilter?.options.map(o => o.label).join(', ')}`);

// Plywood -> Thickness
const plyFilters = getAvailableFiltersForCategory(
  'plywood-mdf-hdhmr',
  SEED_PRODUCTS.filter((p) => p.categorySlug === 'plywood-mdf-hdhmr')
);
const thicknessFilter = plyFilters.find((f) => f.id === 'thickness');
assert(!!thicknessFilter && thicknessFilter.options.length > 0, `Plywood category includes Thickness filter with options: ${thicknessFilter?.options.map(o => o.label).join(', ')}`);

// Electrical Wires -> Conductor Size
const wireFilters = getAvailableFiltersForCategory(
  'wires-mcb-distribution-boards',
  SEED_PRODUCTS.filter((p) => p.categorySlug === 'wires-mcb-distribution-boards')
);
const conductorFilter = wireFilters.find((f) => f.id === 'conductorSize');
assert(!!conductorFilter && conductorFilter.options.length > 0, `Wires category includes Wire Size filter with options: ${conductorFilter?.options.map(o => o.label).join(', ')}`);

// Power Tools -> Rated Power / Wattage
const powerToolsFilters = getAvailableFiltersForCategory(
  'power-tools-accessories',
  SEED_PRODUCTS.filter((p) => p.categorySlug === 'power-tools-accessories')
);
const powerFilter = powerToolsFilters.find((f) => f.id === 'ratedPower');
assert(!!powerFilter && powerFilter.options.length > 0, `Power Tools category includes Rated Power filter with options: ${powerFilter?.options.map(o => o.label).join(', ')}`);

// -----------------------------------------------------------------------------
// TEST 3: MULTI-DIMENSIONAL FILTERING ENGINE (applyCategoryFilters)
// -----------------------------------------------------------------------------
console.log('\n--- TEST 3: Multi-Dimensional Filtering Engine Execution ---');

const cementProds = SEED_PRODUCTS.filter((p) => p.categorySlug === 'cement-concrete');

// Filter by Brand
const brandFilterResult = applyCategoryFilters(cementProds, {
  brands: ['UltraTech Cement'],
  subcategories: [],
  inStockOnly: false,
  asapOnly: false,
  specifications: {}
}, 'cement-concrete');
assert(
  brandFilterResult.length > 0 && brandFilterResult.every((p) => p.brand === 'UltraTech Cement'),
  `Filtering by Brand 'UltraTech Cement' returns matching items (${brandFilterResult.length} items)`
);

// Filter by Grade (Specification)
const gradeFilterResult = applyCategoryFilters(cementProds, {
  brands: [],
  subcategories: [],
  inStockOnly: false,
  asapOnly: false,
  specifications: {
    grade: ['PPC (IS 1489 Part 1)']
  }
}, 'cement-concrete');
assert(
  gradeFilterResult.length === 1 && gradeFilterResult[0].sku === 'CEM-ULT-PPC-50KG',
  `Filtering by Specification Grade 'PPC (IS 1489 Part 1)' returns exact matching product (${gradeFilterResult[0]?.name})`
);

// Filter by 60-Min ASAP
const asapFilterResult = applyCategoryFilters(cementProds, {
  brands: [],
  subcategories: [],
  inStockOnly: false,
  asapOnly: true,
  specifications: {}
}, 'cement-concrete');
assert(
  asapFilterResult.every((p) => p.deliverySpeedAvailable.includes('ASAP_60')),
  `Filtering by 60-Min ASAP dispatch returns only ASAP_60 enabled products (${asapFilterResult.length} items)`
);

// Combined Multi-Filter: Brand + InStock + Price Range
const multiFilterResult = applyCategoryFilters(SEED_PRODUCTS, {
  brands: ['Havells'],
  subcategories: [],
  inStockOnly: true,
  asapOnly: false,
  minPrice: 1000,
  maxPrice: 3000,
  specifications: {}
});
assert(
  multiFilterResult.length > 0 &&
  multiFilterResult.every((p) => p.brand === 'Havells' && p.inStock && p.price >= 1000 && p.price <= 3000),
  `Combined multi-filter (Brand + InStock + Min/Max Price) returned ${multiFilterResult.length} matching products`
);

console.log('\n================================================================');
console.log(`VERIFICATION SUMMARY: ${totalPassed} PASSED, ${totalFailed} FAILED`);
console.log('================================================================\n');

if (totalFailed > 0) {
  process.exit(1);
}
