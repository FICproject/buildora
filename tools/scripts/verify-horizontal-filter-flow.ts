import {
  MASTER_CATEGORIES,
  SEED_PRODUCTS,
  CATEGORY_FILTER_CONFIGS,
  getAvailableFiltersForCategory,
  getAvailableFiltersForCatalog,
  applyCategoryFilters,
  ActiveCategoryFilters
} from '../../packages/constants/src';
import * as fs from 'fs';
import * as path from 'path';

console.log('================================================================');
console.log('BUILDORA 60 — HORIZONTAL FILTERS & SEQUENTIAL CATEGORY AUDIT');
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
// TEST 1: GLOBAL FILTER LAYOUT RULE (ZERO VERTICAL SIDEBARS)
// -----------------------------------------------------------------------------
console.log('--- TEST 1: Global Filter Layout Rule (No Vertical Sidebars) ---');

const productListingCode = fs.readFileSync(
  path.resolve(__dirname, '../../apps/customer-web/src/pages/ProductListingPage.tsx'),
  'utf-8'
);
const categoryPageCode = fs.readFileSync(
  path.resolve(__dirname, '../../apps/customer-web/src/pages/CategoryPage.tsx'),
  'utf-8'
);

assert(!productListingCode.includes('<aside'), 'ProductListingPage has NO <aside> filter sidebar');
assert(!productListingCode.includes('Filter Products'), 'ProductListingPage has NO "Filter Products" sidebar title');
assert(!productListingCode.includes('isMobileFilterOpen'), 'ProductListingPage has NO duplicate vertical mobile filter drawer');
assert(productListingCode.includes('CategoryHorizontalFilterBar'), 'ProductListingPage uses CategoryHorizontalFilterBar');
assert(productListingCode.includes('ActiveFilterChips'), 'ProductListingPage uses ActiveFilterChips');
assert(productListingCode.includes('grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'), 'ProductListingPage has full-width responsive 6-col product grid');

assert(!categoryPageCode.includes('<aside'), 'CategoryPage has NO <aside> filter sidebar');
assert(!categoryPageCode.includes('EXPLORE SUBCATEGORIES'), 'CategoryPage has NO "EXPLORE SUBCATEGORIES" redundant block');
assert(categoryPageCode.includes('CategoryHorizontalFilterBar'), 'CategoryPage uses CategoryHorizontalFilterBar');
assert(categoryPageCode.includes('ActiveFilterChips'), 'CategoryPage uses ActiveFilterChips');

// -----------------------------------------------------------------------------
// TEST 2: CATALOGUE HORIZONTAL FILTERS (/products)
// -----------------------------------------------------------------------------
console.log('\n--- TEST 2: Catalogue Horizontal Filters Engine (/products) ---');

const catalogFilters = getAvailableFiltersForCatalog(SEED_PRODUCTS);
const catDimension = catalogFilters.find((f) => f.id === 'category');
const brandDimension = catalogFilters.find((f) => f.id === 'brand');
const priceDimension = catalogFilters.find((f) => f.id === 'price');

assert(!!catDimension && catDimension.options.length > 0, `Catalogue has 'Category' dropdown with ${catDimension?.options.length} categories`);
assert(!!brandDimension && brandDimension.options.length > 0, `Catalogue has 'Brand' dropdown with ${brandDimension?.options.length} brands`);
assert(!!priceDimension && priceDimension.type === 'range', `Catalogue has 'Price' range slider/inputs (Min: ₹${priceDimension?.minPrice}, Max: ₹${priceDimension?.maxPrice})`);

// -----------------------------------------------------------------------------
// TEST 3: CATEGORY 1 — CEMENT & CONCRETE (cement-concrete)
// -----------------------------------------------------------------------------
console.log('\n--- TEST 3: Category 1 — Cement & Concrete (cement-concrete) ---');

const cementConfig = CATEGORY_FILTER_CONFIGS['cement-concrete'];
assert(!!cementConfig, 'Cement & Concrete has filter configuration');

const cementProds = SEED_PRODUCTS.filter((p) => p.categorySlug === 'cement-concrete');
const cementFilters = getAvailableFiltersForCategory('cement-concrete', cementProds);
console.log(`  Cement Filters Produced: ${cementFilters.map((f) => f.name).join(', ')}`);

assert(cementFilters.some((f) => f.name === 'Category'), 'Cement has Category/Subcategory filter');
assert(cementFilters.some((f) => f.name === 'Brand'), 'Cement has Brand filter');
assert(cementFilters.some((f) => f.name === 'Type'), 'Cement has Type filter');
assert(cementFilters.some((f) => f.name === 'Grade'), 'Cement has Grade filter');
assert(cementFilters.some((f) => f.name === 'Pack Size'), 'Cement has Pack Size filter');
assert(cementFilters.some((f) => f.name === 'Price'), 'Cement has Price filter');

// Test interaction: Filter by Grade 'PPC (IS 1489 Part 1)'
const filterPPC: ActiveCategoryFilters = {
  brands: [],
  subcategories: [],
  inStockOnly: false,
  asapOnly: false,
  specifications: {
    grade: ['PPC (IS 1489 Part 1)']
  }
};
const ppcResult = applyCategoryFilters(cementProds, filterPPC, 'cement-concrete');
assert(ppcResult.length === 1 && ppcResult[0].name.includes('PPC'), `Grade filter matches exactly PPC cement product (${ppcResult[0]?.name})`);

// Test interaction: Filter by Brand 'UltraTech Cement'
const filterBrand: ActiveCategoryFilters = {
  brands: ['UltraTech Cement'],
  subcategories: [],
  inStockOnly: false,
  asapOnly: false,
  specifications: {}
};
const brandResult = applyCategoryFilters(cementProds, filterBrand, 'cement-concrete');
assert(brandResult.length === 2, `Brand filter matches 2 UltraTech cement products`);

// -----------------------------------------------------------------------------
// TEST 4: CATEGORY 2 — TILING & TILE ADHESIVES (tiling-tile-adhesives)
// -----------------------------------------------------------------------------
console.log('\n--- TEST 4: Category 2 — Tiling & Tile Adhesives (tiling-tile-adhesives) ---');

const tilingConfig = CATEGORY_FILTER_CONFIGS['tiling-tile-adhesives'];
assert(!!tilingConfig, 'Tiling & Tile Adhesives has filter configuration');

const tilingProds = SEED_PRODUCTS.filter((p) => p.categorySlug === 'tiling-tile-adhesives');
const tilingFilters = getAvailableFiltersForCategory('tiling-tile-adhesives', tilingProds);
console.log(`  Tiling Filters Produced: ${tilingFilters.map((f) => f.name).join(', ')}`);

// HomeRun Tiling reference filter names: Category, Brand, Type, Size, Colors, Material, Grade, Price, Pack Size
assert(tilingFilters.some((f) => f.name === 'Category'), 'Tiling has Category filter');
assert(tilingFilters.some((f) => f.name === 'Brand'), 'Tiling has Brand filter');
assert(tilingFilters.some((f) => f.name === 'Size'), 'Tiling has Size filter');
assert(tilingFilters.some((f) => f.name === 'Colors'), 'Tiling has Colors filter');
assert(tilingFilters.some((f) => f.name === 'Grade'), 'Tiling has Grade filter');
assert(tilingFilters.some((f) => f.name === 'Pack Size'), 'Tiling has Pack Size filter');
assert(tilingFilters.some((f) => f.name === 'Price'), 'Tiling has Price filter');

// Test interaction: Filter by Brand 'Kajaria Ceramics'
const filterKajaria: ActiveCategoryFilters = {
  brands: ['Kajaria Ceramics'],
  subcategories: [],
  inStockOnly: false,
  asapOnly: false,
  specifications: {}
};
const kajariaResult = applyCategoryFilters(tilingProds, filterKajaria, 'tiling-tile-adhesives');
assert(kajariaResult.length === 1 && kajariaResult[0].name.includes('Kajaria'), `Brand filter matches Kajaria product (${kajariaResult[0]?.name})`);

// Test interaction: Filter by Brand 'Pidilite (Fevicol & Dr. Fixit)'
const filterRoff: ActiveCategoryFilters = {
  brands: ['Pidilite (Fevicol & Dr. Fixit)'],
  subcategories: [],
  inStockOnly: false,
  asapOnly: false,
  specifications: {}
};
const roffResult = applyCategoryFilters(tilingProds, filterRoff, 'tiling-tile-adhesives');
assert(roffResult.length >= 1 && roffResult[0].name.includes('Roff'), `Brand filter matches Roff Tile Adhesive product`);

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`SEQUENTIAL VALIDATION SUMMARY: ${totalPassed} PASSED, ${totalFailed} FAILED`);
console.log('================================================================');
if (totalFailed > 0) process.exit(1);
