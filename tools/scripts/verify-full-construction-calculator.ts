import {
  calculateFullConstructionEstimate,
  SUPPORTED_INDIAN_LOCATIONS,
  PROPERTY_TYPE_MULTIPLIERS,
  STAGE_MULTIPLIERS,
  GLOBAL_BASE_RATES,
  CATEGORY_BASE_CONFIG
} from '../../packages/utils/src/index';
import { ConstructionCalculatorService } from '../../services/backend/api/src/modules/construction-calculator/services/construction-calculator.service';
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

console.log('--- RUNNING FULL REFERENCE VERIFICATION FOR BUILDORA 60 HOME CONSTRUCTION CALCULATOR ---');

// 1. Verify HomePage.tsx removals and new promotional banner
const homePagePath = path.resolve(__dirname, '../../apps/customer-web/src/pages/HomePage.tsx');
const homePageContent = fs.readFileSync(homePagePath, 'utf-8');

// Removals
assert(!homePageContent.includes('CONTRACTOR & BUILDER CLUB'), 'Contractor & Builder Club banner comment is removed from HomePage');
assert(!homePageContent.includes('Unlock Tiered Bulk Discounts Up To 15%'), 'Contractor & Builder Club heading is removed from HomePage');
assert(!homePageContent.includes('Procuring for full residential floors or multi-apartment fit-outs?'), 'Contractor & Builder Club body text is removed');
assert(!homePageContent.includes('Request Trade Pricing'), 'Request Trade Pricing button is removed from HomePage');
assert(!homePageContent.includes('Commercial Projects & BOQ Quotations'), 'Commercial Projects & BOQ Quotations card is removed from HomePage');
assert(!homePageContent.includes('Request Bulk Quotation'), 'Request Bulk Quotation button is removed from HomePage');
assert(!homePageContent.includes('Bulk Site Orders &rarr;'), 'Bulk Site Orders button is removed from HomePage');

// New Homepage Section 8 Banner (Phase 2 UI specifications)
assert(homePageContent.includes('SMART CONSTRUCTION PLANNING'), 'Homepage contains SMART CONSTRUCTION PLANNING badge');
assert(homePageContent.includes('Plan Your Dream Home. Know Your Budget.'), 'Homepage contains "Plan Your Dream Home. Know Your Budget." heading');
assert(homePageContent.includes('Estimate your home construction cost, material quantities, labour expenses and category-wise budget before starting construction.'), 'Homepage contains exact description');
assert(homePageContent.includes('Calculate Construction Cost'), 'Homepage contains Calculate Construction Cost CTA');
assert(homePageContent.includes('Explore Materials'), 'Homepage contains Explore Materials CTA');
assert(homePageContent.includes('/tools/home-construction-calculator'), 'Homepage navigates to /tools/home-construction-calculator');

// 2. Verify routes/index.tsx
const routesPath = path.resolve(__dirname, '../../apps/customer-web/src/routes/index.tsx');
const routesContent = fs.readFileSync(routesPath, 'utf-8');

assert(!routesContent.includes('BulkOrdersPage'), 'BulkOrdersPage is completely removed from routes');
assert(!routesContent.includes("path: 'bulk-orders'"), 'bulk-orders route is removed');
assert(!routesContent.includes("path: 'price-lists'"), 'price-lists route is removed');
assert(routesContent.includes("path: 'tools/home-construction-calculator'"), 'tools/home-construction-calculator primary route is registered');
assert(routesContent.includes("path: 'home-construction-calculator'"), 'home-construction-calculator route is registered');
assert(routesContent.includes("path: 'construction-calculator'"), 'construction-calculator alias route is registered');

// 3. Verify Header and Footer Links
const headerPath = path.resolve(__dirname, '../../apps/customer-web/src/components/common/Header.tsx');
const headerContent = fs.readFileSync(headerPath, 'utf-8');
assert(headerContent.includes('/tools/home-construction-calculator'), 'Header has link to /tools/home-construction-calculator');
assert(!headerContent.includes('<span>Construction Calculator</span>'), 'Desktop category nav does not contain Construction Calculator (keeps navigation bar cleanly on single row)');

const footerPath = path.resolve(__dirname, '../../apps/customer-web/src/components/common/Footer.tsx');
const footerContent = fs.readFileSync(footerPath, 'utf-8');
assert(footerContent.includes('/tools/home-construction-calculator'), 'Footer has link to /tools/home-construction-calculator');

// 4. Test 13-Category Calculation Engine
console.log('\n--- TESTING 13-CATEGORY CALCULATION ENGINE ---');

const baseCalc = calculateFullConstructionEstimate({
  state: 'Karnataka',
  city: 'Bengaluru',
  builtUpArea: 1200,
  areaUnit: 'SQ_FT',
  propertyType: 'INDEPENDENT_HOUSE',
  floors: 2,
  stage: 'FULL_CONSTRUCTION',
  globalQuality: 'STANDARD',
  categoryOverrides: {},
  excludedCategories: []
});

assert(baseCalc.summary.builtUpAreaSqFt === 1200, 'Calculates 1,200 sq.ft correctly');
assert(baseCalc.summary.city === 'Bengaluru', 'Recognizes Bengaluru city');
assert(baseCalc.categories.length === 13, `Has all 13 construction categories (got ${baseCalc.categories.length})`);

// Verify all 13 categories exist
const expectedCategories = [
  'cement',
  'steel',
  'bricks',
  'aggregate',
  'sand',
  'tiles_flooring',
  'windows_grills',
  'doors',
  'electrical_wiring',
  'paint_putty',
  'sanitaryware',
  'modular_kitchen',
  'contractor_labour'
];

expectedCategories.forEach((catKey) => {
  const found = baseCalc.categories.find((c) => c.key === catKey);
  assert(!!found, `Category '${catKey}' is present in estimation`);
  assert(found!.cost > 0, `Category '${catKey}' has positive cost: ₹${found?.cost}`);
});

// Deliverable categories count
const deliverableCount = baseCalc.categories.filter((c) => c.isDeliverable).length;
assert(deliverableCount === 7, `7 categories are deliverable via BUILDORA (got ${deliverableCount})`);

// 5. Test Global Quality Tiers (Basic vs Standard vs Premium)
const basicCalc = calculateFullConstructionEstimate({
  state: 'Karnataka',
  city: 'Bengaluru',
  builtUpArea: 1200,
  areaUnit: 'SQ_FT',
  propertyType: 'INDEPENDENT_HOUSE',
  floors: 2,
  stage: 'FULL_CONSTRUCTION',
  globalQuality: 'BASIC'
});

const premiumCalc = calculateFullConstructionEstimate({
  state: 'Karnataka',
  city: 'Bengaluru',
  builtUpArea: 1200,
  areaUnit: 'SQ_FT',
  propertyType: 'INDEPENDENT_HOUSE',
  floors: 2,
  stage: 'FULL_CONSTRUCTION',
  globalQuality: 'PREMIUM'
});

assert(
  basicCalc.summary.totalEstimatedCost < baseCalc.summary.totalEstimatedCost,
  `Basic total (₹${basicCalc.summary.totalEstimatedCost}) < Standard total (₹${baseCalc.summary.totalEstimatedCost})`
);
assert(
  baseCalc.summary.totalEstimatedCost < premiumCalc.summary.totalEstimatedCost,
  `Standard total (₹${baseCalc.summary.totalEstimatedCost}) < Premium total (₹${premiumCalc.summary.totalEstimatedCost})`
);

// 6. Test Per-Category Quality Overrides (Phase 12 & 15)
const overrideCalc = calculateFullConstructionEstimate({
  state: 'Karnataka',
  city: 'Bengaluru',
  builtUpArea: 1200,
  areaUnit: 'SQ_FT',
  propertyType: 'INDEPENDENT_HOUSE',
  floors: 2,
  stage: 'FULL_CONSTRUCTION',
  globalQuality: 'BASIC',
  categoryOverrides: {
    cement: 'PREMIUM', // Override cement to premium
    steel: 'STANDARD' // Override steel to standard
  }
});

const basicCementCost = basicCalc.categories.find((c) => c.key === 'cement')!.cost;
const overrideCementCost = overrideCalc.categories.find((c) => c.key === 'cement')!.cost;
assert(
  overrideCementCost > basicCementCost,
  `Overridden Premium cement (₹${overrideCementCost}) > Basic cement (₹${basicCementCost})`
);
assert(overrideCalc.categories.find((c) => c.key === 'cement')!.hasOverride === true, 'Cement marked as hasOverride');
assert(overrideCalc.categories.find((c) => c.key === 'sand')!.hasOverride === false, 'Sand is not overridden');

// 7. Test Category Exclusion (Include/Exclude feature)
const excludeCalc = calculateFullConstructionEstimate({
  state: 'Karnataka',
  city: 'Bengaluru',
  builtUpArea: 1200,
  areaUnit: 'SQ_FT',
  propertyType: 'INDEPENDENT_HOUSE',
  floors: 2,
  stage: 'FULL_CONSTRUCTION',
  globalQuality: 'STANDARD',
  excludedCategories: ['modular_kitchen']
});

const kitchenCat = excludeCalc.categories.find((c) => c.key === 'modular_kitchen');
assert(kitchenCat!.isExcluded === true, 'Modular kitchen is excluded');
assert(kitchenCat!.cost === 0, 'Excluded modular kitchen has cost 0');
assert(
  excludeCalc.summary.totalEstimatedCost < baseCalc.summary.totalEstimatedCost,
  'Excluding kitchen reduces total cost'
);
assert(excludeCalc.summary.categoriesIncludedCount === 12, 'Includes 12 categories when 1 is excluded');

// 8. Test Location Multipliers (e.g. Mumbai 1.15x vs Bengaluru 1.0x vs Mysuru 0.94x)
const mumbaiCalc = calculateFullConstructionEstimate({
  state: 'Maharashtra',
  city: 'Mumbai',
  builtUpArea: 1200,
  areaUnit: 'SQ_FT',
  propertyType: 'INDEPENDENT_HOUSE',
  floors: 2,
  stage: 'FULL_CONSTRUCTION',
  globalQuality: 'STANDARD'
});

const mysuruCalc = calculateFullConstructionEstimate({
  state: 'Karnataka',
  city: 'Mysuru',
  builtUpArea: 1200,
  areaUnit: 'SQ_FT',
  propertyType: 'INDEPENDENT_HOUSE',
  floors: 2,
  stage: 'FULL_CONSTRUCTION',
  globalQuality: 'STANDARD'
});

assert(
  mumbaiCalc.summary.totalEstimatedCost > baseCalc.summary.totalEstimatedCost,
  `Mumbai cost (₹${mumbaiCalc.summary.totalEstimatedCost}) > Bengaluru cost (₹${baseCalc.summary.totalEstimatedCost}) due to 1.15x multiplier`
);
assert(
  mysuruCalc.summary.totalEstimatedCost < baseCalc.summary.totalEstimatedCost,
  `Mysuru cost (₹${mysuruCalc.summary.totalEstimatedCost}) < Bengaluru cost (₹${baseCalc.summary.totalEstimatedCost}) due to 0.94x multiplier`
);

// 9. Test Sq.M to Sq.Ft conversion
const sqMCalc = calculateFullConstructionEstimate({
  state: 'Karnataka',
  city: 'Bengaluru',
  builtUpArea: 111.48, // 1200 sq.ft
  areaUnit: 'SQ_M',
  propertyType: 'INDEPENDENT_HOUSE',
  floors: 2,
  stage: 'FULL_CONSTRUCTION',
  globalQuality: 'STANDARD'
});

assert(sqMCalc.summary.builtUpAreaSqFt === 1200, `111.48 sq.m converts to 1,200 sq.ft (got ${sqMCalc.summary.builtUpAreaSqFt})`);

// 10. Test Backend Service Integration (Phases 25 & 26)
console.log('\n--- TESTING BACKEND CALCULATOR SERVICE & PERSISTENCE ---');
const service = new ConstructionCalculatorService();

const config = service.getConfig();
assert(config.success === true, 'Backend service getConfig returns success');
assert(config.locations.length > 5, 'Backend service has multiple supported states');
assert(config.categories.length === 13, 'Backend service returns 13 categories config');

const calcResponse = service.calculate({
  state: 'Karnataka',
  city: 'Bengaluru',
  builtUpArea: 1500,
  areaUnit: 'SQ_FT',
  propertyType: 'VILLA',
  floors: 2,
  stage: 'FULL_CONSTRUCTION',
  globalQuality: 'PREMIUM'
});
assert(calcResponse.success === true, 'Backend service calculation succeeds');
assert(calcResponse.data.summary.builtUpAreaSqFt === 1500, 'Calculates 1,500 sq.ft for Villa');

// Project Persistence (Save, Get, Update, Delete)
const saved = service.saveProject({
  projectName: 'Test Villa Whitefield',
  input: {
    state: 'Karnataka',
    city: 'Bengaluru',
    builtUpArea: 1500,
    areaUnit: 'SQ_FT',
    propertyType: 'VILLA',
    floors: 2,
    stage: 'FULL_CONSTRUCTION',
    globalQuality: 'PREMIUM'
  }
});
assert(saved.success === true, 'Project saved successfully in backend store');
assert(saved.data.projectName === 'Test Villa Whitefield', 'Saved project holds correct name');

const projectList = service.getProjects();
assert(projectList.count > 0, 'Saved project appears in project list');

const fetchedProject = service.getProjectById(saved.data.id);
assert(fetchedProject.data.id === saved.data.id, 'Fetched project matches saved ID');

const updated = service.updateProject(saved.data.id, { projectName: 'Updated Villa Whitefield' });
assert(updated.data.projectName === 'Updated Villa Whitefield', 'Project name successfully updated');

const deleted = service.deleteProject(saved.data.id);
assert(deleted.success === true, 'Project deleted successfully');

// Quotation Request
const quote = service.createQuotationRequest({
  customerName: 'Rahul Mehta',
  phone: '9845012345',
  email: 'rahul@mehta.org',
  state: 'Karnataka',
  city: 'Bengaluru',
  builtUpArea: 2000,
  categoriesRequested: ['Bricks & Blocks', 'Aggregate', 'Sand'],
  notes: 'Need 5,000 AAC blocks delivered to Whitefield site.'
});
assert(quote.success === true, 'Quotation request submitted successfully');
assert(quote.data.status === 'PENDING', 'Quotation request has PENDING status');

console.log('\n🎉 ALL REFERENCE IMPLEMENTATION VERIFICATION CHECKS PASSED PERFECTLY!');
