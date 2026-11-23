import { checkBengaluruServiceability, SERVICEABLE_PINCODES } from '../../packages/constants/src';
import { calculateCartSummary } from '../../packages/utils/src';

console.log('====================================================');
console.log('BUILDORA 60: Serviceability & Checkout Validation Test');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, extra?: any) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`[PASS] ${testName}`);
  } else {
    console.error(`[FAIL] ${testName}`, extra || '');
  }
}

// 1. Target Pincode 560072 (From user screenshot)
console.log('--- 1. Pincode 560072 (Nagarabhavi / User Screenshot) ---');
const r560072 = checkBengaluruServiceability('560072');
assert(r560072.isServiceable === true, '560072 isServiceable should be true');
assert(r560072.serviceable === true, '560072 serviceable (backward compat) should be true');
assert(r560072.warehouseId === 'WH-BLR-04', '560072 served by West Hub WH-BLR-04');
assert(r560072.etaMinutes === 60, '560072 has 60 min ETA');
assert(r560072.city === 'Bengaluru', '560072 city is Bengaluru');

// 2. Curated & Core Bengaluru Hubs
console.log('\n--- 2. Key Bengaluru Dark Store Zones ---');
const rCentral = checkBengaluruServiceability('560038'); // Indiranagar
assert(rCentral.isServiceable === true && rCentral.warehouseId === 'WH-BLR-01', '560038 Indiranagar -> WH-BLR-01');

const rSouth = checkBengaluruServiceability('560034'); // Koramangala
assert(rSouth.isServiceable === true && rSouth.warehouseId === 'WH-BLR-02', '560034 Koramangala -> WH-BLR-02');

const rEast = checkBengaluruServiceability('560066'); // Whitefield
assert(rEast.isServiceable === true && rEast.warehouseId === 'WH-BLR-03', '560066 Whitefield -> WH-BLR-03');

const rNorth = checkBengaluruServiceability('560024'); // Hebbal
assert(rNorth.isServiceable === true && rNorth.warehouseId === 'WH-BLR-05', '560024 Hebbal -> WH-BLR-05');

const rSouthAdded = checkBengaluruServiceability('560029'); // Tavarekere / SG Palya
assert(rSouthAdded.isServiceable === true && rSouthAdded.warehouseId === 'WH-BLR-02', '560029 Tavarekere -> WH-BLR-02');

// 3. Dynamic Bengaluru Pincodes (560xxx)
console.log('\n--- 3. Dynamic Bengaluru Metro Coverage (560xxx) ---');
const rDynamic1 = checkBengaluruServiceability('560015'); // Jalahalli West / West zone
assert(rDynamic1.isServiceable === true && rDynamic1.city === 'Bengaluru', '560015 dynamically covered in Bengaluru');

const rDynamic2 = checkBengaluruServiceability('560088'); // HAL 2nd Stage / Outer Ring Road
assert(rDynamic2.isServiceable === true && rDynamic2.city === 'Bengaluru', '560088 dynamically covered in Bengaluru');

const rWhitespace = checkBengaluruServiceability('  560072  ');
assert(rWhitespace.isServiceable === true && rWhitespace.pincode === '560072', 'Pincode trimming works correctly');

// 4. Bengaluru Rural Corridors (562xxx)
console.log('\n--- 4. Bengaluru Rural Corridor Coverage (562xxx) ---');
const rRural1 = checkBengaluruServiceability('562110'); // Devanahalli
assert(rRural1.isServiceable === true && rRural1.etaMinutes === 120, '562110 Devanahalli 120m dispatch');

const rRural2 = checkBengaluruServiceability('562125'); // Hosakote
assert(rRural2.isServiceable === true && rRural2.etaMinutes === 120, '562125 Hosakote 120m dispatch');

const rRuralDynamic = checkBengaluruServiceability('562130'); // Magadi corridor dynamic
assert(rRuralDynamic.isServiceable === true && rRuralDynamic.city === 'Bengaluru Rural', '562130 dynamic Rural corridor');

// 5. Invalid PIN formats
console.log('\n--- 5. Invalid Format Rejection ---');
const rShort = checkBengaluruServiceability('56007');
assert(rShort.isServiceable === false && rShort.deliveryZone === 'INVALID', 'Short pincode 56007 rejected');

const rAlpha = checkBengaluruServiceability('56007A');
assert(rAlpha.isServiceable === false, 'Alphanumeric pincode rejected');

const rEmpty = checkBengaluruServiceability('');
assert(rEmpty.isServiceable === false, 'Empty pincode rejected');

const rZero = checkBengaluruServiceability('060072');
assert(rZero.isServiceable === false, 'Pincode starting with 0 rejected');

// 6. Non-Bengaluru pincodes (Must NOT be marked serviceable)
console.log('\n--- 6. Non-Bengaluru Rejection (Strict boundary check) ---');
const rDelhi = checkBengaluruServiceability('110001'); // New Delhi
assert(rDelhi.isServiceable === false, '110001 (New Delhi) marked Non-Serviceable');

const rMumbai = checkBengaluruServiceability('400001'); // Mumbai
assert(rMumbai.isServiceable === false, '400001 (Mumbai) marked Non-Serviceable');

const rChennai = checkBengaluruServiceability('600001'); // Chennai
assert(rChennai.isServiceable === false, '600001 (Chennai) marked Non-Serviceable');

const rHyderabad = checkBengaluruServiceability('500001'); // Hyderabad
assert(rHyderabad.isServiceable === false, '500001 (Hyderabad) marked Non-Serviceable');

const rMysuru = checkBengaluruServiceability('570001'); // Mysuru (Karnataka outside Bengaluru)
assert(rMysuru.isServiceable === false, '570001 (Mysuru) marked Non-Serviceable');

const rMangaluru = checkBengaluruServiceability('575001'); // Mangaluru (Karnataka outside Bengaluru)
assert(rMangaluru.isServiceable === false, '575001 (Mangaluru) marked Non-Serviceable');

// 7. Cart Calculation Preservation with Serviceable Pincode
console.log('\n--- 7. Cart Pricing & Calculation Preservation ---');
const sampleCart = {
  items: [
    {
      productId: 'prod-ultratech-ppc-50kg',
      name: 'UltraTech Super Cement (PPC), 50 Kg Bag',
      price: 395,
      quantity: 5,
      gstRate: 28,
      bulkDiscountPercentage: 0
    }
  ],
  deliverySpeed: 'ASAP_60' as const,
  pincode: '560072'
};
const summary = calculateCartSummary(sampleCart);
assert(summary.subtotal === 1975, 'Cart subtotal matches 5 * 395');
assert(summary.grandTotal > 0, 'Grand total calculated correctly');
assert(summary.deliveryFee === 0, 'Free delivery threshold applied for orders > 1000');

console.log(`\n====================================================`);
console.log(`Result: ${passedTests} / ${totalTests} assertions passed (${Math.round((passedTests / totalTests) * 100)}%)`);
console.log(`====================================================`);

if (passedTests !== totalTests) {
  process.exit(1);
}
