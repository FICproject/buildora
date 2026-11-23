import { calculateHomeConstruction, BASE_RATES_PER_SQFT, ConstructionQuality } from '../../packages/utils/src/index';
import { SEED_PRODUCTS } from '../../packages/constants/src/index';
import * as fs from 'fs';
import * as path from 'path';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ ${message}`);
  }
}

console.log('--- RUNNING VERIFICATION FOR HOME CONSTRUCTION CALCULATOR & REMOVALS ---');

// 1. Verify HomePage.tsx content
const homePagePath = path.resolve(__dirname, '../../apps/customer-web/src/pages/HomePage.tsx');
const homePageContent = fs.readFileSync(homePagePath, 'utf-8');

assert(!homePageContent.includes('CONTRACTOR & BUILDER CLUB'), 'Contractor & Builder Club banner comment is removed from HomePage');
assert(!homePageContent.includes('Unlock Tiered Bulk Discounts Up To 15%'), 'Contractor & Builder Club heading is removed from HomePage');
assert(!homePageContent.includes('Procuring for full residential floors or multi-apartment fit-outs?'), 'Contractor & Builder Club body text is removed');
assert(!homePageContent.includes('Request Trade Pricing'), 'Request Trade Pricing button is removed from HomePage');
assert(!homePageContent.includes('Commercial Projects & BOQ Quotations'), 'Commercial Projects & BOQ Quotations card is removed from HomePage');
assert(!homePageContent.includes('Request Bulk Quotation'), 'Request Bulk Quotation button is removed from HomePage');
assert(!homePageContent.includes('Bulk Site Orders'), 'Bulk Site Orders button is removed from HomePage');

assert(homePageContent.includes('/home-construction-calculator'), 'HomePage references /home-construction-calculator');
assert(homePageContent.includes('Home Construction Calculator'), 'HomePage contains Home Construction Calculator CTA');
assert(homePageContent.includes('Calculate Construction Cost'), 'HomePage contains Calculate Construction Cost CTA');

// 2. Verify routes/index.tsx
const routesPath = path.resolve(__dirname, '../../apps/customer-web/src/routes/index.tsx');
const routesContent = fs.readFileSync(routesPath, 'utf-8');

assert(!routesContent.includes('BulkOrdersPage'), 'BulkOrdersPage is completely removed from routes');
assert(!routesContent.includes("path: 'bulk-orders'"), 'bulk-orders route is removed');
assert(!routesContent.includes("path: 'price-lists'"), 'price-lists route is removed');
assert(routesContent.includes("path: 'home-construction-calculator'"), 'home-construction-calculator route is registered');
assert(routesContent.includes("path: 'construction-calculator'"), 'construction-calculator alias route is registered');

// 3. Verify BulkOrdersPage.tsx is deleted
const bulkOrdersPagePath = path.resolve(__dirname, '../../apps/customer-web/src/pages/BulkOrdersPage.tsx');
assert(!fs.existsSync(bulkOrdersPagePath), 'BulkOrdersPage.tsx file has been deleted');

// 4. Verify HomeConstructionCalculatorPage.tsx exists and is populated
const calcPagePath = path.resolve(__dirname, '../../apps/customer-web/src/pages/HomeConstructionCalculatorPage.tsx');
assert(fs.existsSync(calcPagePath), 'HomeConstructionCalculatorPage.tsx exists');
const calcPageContent = fs.readFileSync(calcPagePath, 'utf-8');
assert(calcPageContent.includes('calculateHomeConstruction'), 'Page imports and uses calculateHomeConstruction');
assert(calcPageContent.includes('useCartStore'), 'Page imports useCartStore for ecommerce integration');
assert(calcPageContent.includes('matchedCatalogProducts'), 'Page matches catalog products with SEED_PRODUCTS');
assert(calcPageContent.includes('Add All Materials to Cart'), 'Page provides 1-click batch cart addition');

// 5. Test Civil Engineering Calculation Engine
const calc1500Premium = calculateHomeConstruction({
  constructionType: 'RESIDENTIAL_INDEPENDENT',
  floors: 2,
  builtUpArea: 1500,
  areaUnit: 'SQ_FT',
  quality: 'PREMIUM',
  additionalRequirements: {
    compoundWall: true,
    sumpAndTank: true,
    rooftopSolar: false,
    falseCeiling: false
  }
});

assert(calc1500Premium.builtUpAreaSqFt === 1500, 'Calculates 1500 sq.ft correctly');
assert(calc1500Premium.baseRatePerSqFt === 2150, 'Uses Premium rate ₹2,150/sq.ft');
// Base cost: 1500 * 2150 = 3,225,000. Additions: 120,000 + 95,000 = 215,000. Total = 3,440,000
assert(calc1500Premium.totalEstimatedCost === 3440000, `Total cost correctly computed: ₹${calc1500Premium.totalEstimatedCost}`);
assert(calc1500Premium.stages.length === 12, 'Includes 12 distinct construction stages');

// Sum of stage percentages should be 100%
const totalStagePercentage = calc1500Premium.stages.reduce((acc, s) => acc + s.percentage, 0);
assert(totalStagePercentage === 100, `Total stage percentage is 100% (got ${totalStagePercentage}%)`);

// Verify materials
const cementMat = calc1500Premium.materials.find(m => m.id === 'mat-cement');
assert(!!cementMat && cementMat.quantity === Math.ceil(1500 * 0.42), `Cement bags calculated: ${cementMat?.quantity} bags`);

const steelMat = calc1500Premium.materials.find(m => m.id === 'mat-steel');
assert(!!steelMat && steelMat.quantity === +(1500 * 0.0038).toFixed(2), `Steel tonnage calculated: ${steelMat?.quantity} tonnes`);

// 6. Test Square Metres conversion
const calcSqM = calculateHomeConstruction({
  constructionType: 'RESIDENTIAL_INDEPENDENT',
  floors: 1,
  builtUpArea: 100,
  areaUnit: 'SQ_M',
  quality: 'STANDARD'
});
// 100 sq.m ≈ 1076 sq.ft
assert(calcSqM.builtUpAreaSqFt === 1076, `100 sq.m converted to 1076 sq.ft (got ${calcSqM.builtUpAreaSqFt})`);
assert(calcSqM.baseRatePerSqFt === 1750, 'Standard package rate is ₹1,750');

// 7. Test Custom Rate Per Sq.Ft
const calcCustom = calculateHomeConstruction({
  constructionType: 'COMMERCIAL',
  floors: 3,
  builtUpArea: 2000,
  areaUnit: 'SQ_FT',
  quality: 'LUXURY',
  customRatePerSqFt: 3200
});
assert(calcCustom.baseRatePerSqFt === 3200, 'Custom rate 3200 is respected');
assert(calcCustom.totalEstimatedCost === 2000 * 3200, 'Custom total cost is 2000 * 3200 = 6,400,000');

// 8. Verify Matched Catalog Products in SEED_PRODUCTS
calc1500Premium.materials.forEach(m => {
  if (m.productSlug) {
    const found = SEED_PRODUCTS.find(p => p.slug === m.productSlug);
    assert(!!found, `Product slug '${m.productSlug}' exists in SEED_PRODUCTS catalog`);
  }
});

console.log('\n🎉 ALL VERIFICATION CHECKS PASSED PERFECTLY!');
