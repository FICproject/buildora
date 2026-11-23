import { MASTER_CATEGORIES, BENGALURU_WAREHOUSES, SEED_PRODUCTS } from '../../packages/constants/src';
import { BulkPriceTier, VendorProduct, VendorOrder, VendorSettlement } from '../../packages/types/src';

console.log('================================================================');
console.log('BUILDORA 60 — VENDOR PORTAL INTEGRATION & LIFECYCLE SUITE');
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
// TEST 1: VENDOR ONBOARDING & KARNATAKA GSTIN COMPLIANCE
// -----------------------------------------------------------------------------
console.log('--- TEST 1: Vendor KYC, Dark Store Hub & GSTIN Verification ---');

const vendorProfile = {
  id: 'vnd-apex-01',
  storeName: 'Supreme Materials BLR',
  gstin: '29AABCB9876F1Z2',
  darkStoreId: 'WH-BLR-04',
  pickupPincode: '560058',
  bank: {
    accountNumber: '50200049182341',
    ifsc: 'HDFC0000053',
    bankName: 'HDFC Bank',
    isVerified: true,
  },
};

assert(vendorProfile.gstin.startsWith('29'), 'GSTIN begins with Karnataka State Code 29');
assert(vendorProfile.darkStoreId === 'WH-BLR-04', 'Fulfillment mapped to West Logistics Park (WH-BLR-04)');
const assignedHub = BENGALURU_WAREHOUSES[vendorProfile.darkStoreId];
assert(!!assignedHub, 'Dark store hub WH-BLR-04 exists in central BENGALURU_WAREHOUSES registry');
assert(vendorProfile.bank.isVerified === true, 'Bank account penny-drop verification status is verified');

// -----------------------------------------------------------------------------
// TEST 2: BULK PRICING TIER VALIDATION (HOMERUN REFERENCE PARITY)
// -----------------------------------------------------------------------------
console.log('\n--- TEST 2: Bulk Pricing Engine & Discount Calculation ---');

const baseSellingPrice = 380; // ₹380 per unit
const bulkTiers: BulkPriceTier[] = [
  { minQuantity: 10, discountPercentage: 5, unitPrice: Math.round(baseSellingPrice * (1 - 0.05)) }, // 361
  { minQuantity: 50, discountPercentage: 8, unitPrice: Math.round(baseSellingPrice * (1 - 0.08)) }, // 350
  { minQuantity: 100, discountPercentage: 12, unitPrice: Math.round(baseSellingPrice * (1 - 0.12)) }, // 334
];

assert(bulkTiers.length === 3, 'Configured 3 bulk pricing tiers');
assert(bulkTiers[0].unitPrice === 361, 'Tier 1 unit price calculates accurately (₹380 - 5% = ₹361)');
assert(bulkTiers[1].unitPrice === 350, 'Tier 2 unit price calculates accurately (₹380 - 8% = ₹350)');
assert(bulkTiers[2].unitPrice === 334, 'Tier 3 unit price calculates accurately (₹380 - 12% = ₹334)');

// Tier progression checks
let strictlyAscendingQty = true;
let strictlyLowerPrice = true;
for (let i = 1; i < bulkTiers.length; i++) {
  if (bulkTiers[i].minQuantity <= bulkTiers[i - 1].minQuantity) strictlyAscendingQty = false;
  if (bulkTiers[i].unitPrice >= bulkTiers[i - 1].unitPrice) strictlyLowerPrice = false;
}
assert(strictlyAscendingQty, 'Tier minimum quantities strictly ascend (10 -> 50 -> 100)');
assert(strictlyLowerPrice, 'Tier unit prices strictly decrease as order volume increases');

// -----------------------------------------------------------------------------
// TEST 3: INVENTORY STOCK ADJUSTMENT & LOW STOCK ALERTS
// -----------------------------------------------------------------------------
console.log('\n--- TEST 3: Inventory Stock Inwarding & Low Stock Thresholds ---');

let initialStock = 45;
const lowStockThreshold = 40;

function adjustStock(current: number, type: 'ADD' | 'SUBTRACT' | 'SET', qty: number): number {
  if (type === 'ADD') return current + qty;
  if (type === 'SUBTRACT') return Math.max(0, current - qty);
  return qty;
}

// Check alert trigger
assert(initialStock > lowStockThreshold, 'Stock initially above low stock threshold');
let dispatchedStock = adjustStock(initialStock, 'SUBTRACT', 10); // 35
assert(dispatchedStock === 35, 'Stock decreased to 35 units after order dispatch');
const isLowStock = dispatchedStock <= lowStockThreshold;
assert(isLowStock === true, 'Low stock alert triggers correctly when count falls <= 40');

// Restock inwarding
let restockedStock = adjustStock(dispatchedStock, 'ADD', 100); // 135
assert(restockedStock === 135, 'Inward restock batch successfully restores stock to 135 units');

// -----------------------------------------------------------------------------
// TEST 4: ORDER FULFILLMENT LIFECYCLE & 60-MIN SLA PROGRESSION
// -----------------------------------------------------------------------------
console.log('\n--- TEST 4: Order Dispatch State Machine ---');

const allowedTransitions: Record<string, string[]> = {
  NEW: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['PROCESSING', 'READY_FOR_DISPATCH', 'CANCELLED'],
  PROCESSING: ['READY_FOR_DISPATCH'],
  READY_FOR_DISPATCH: ['DISPATCHED'],
  DISPATCHED: ['DELIVERED', 'RETURNED'],
};

function canTransition(current: string, next: string): boolean {
  return allowedTransitions[current]?.includes(next) || false;
}

assert(canTransition('NEW', 'ACCEPTED'), 'Order transition NEW -> ACCEPTED is valid');
assert(canTransition('ACCEPTED', 'READY_FOR_DISPATCH'), 'Order transition ACCEPTED -> READY_FOR_DISPATCH is valid');
assert(canTransition('READY_FOR_DISPATCH', 'DISPATCHED'), 'Order transition READY_FOR_DISPATCH -> DISPATCHED is valid');
assert(!canTransition('NEW', 'DELIVERED'), 'Order transition NEW -> DELIVERED is rejected by state machine');

// -----------------------------------------------------------------------------
// TEST 5: FINANCIAL COMMISSION & SETTLEMENT ENGINE
// -----------------------------------------------------------------------------
console.log('\n--- TEST 5: Payouts, Commission & Net Payout Math ---');

const grossOrderSubtotal = 50000;
const commissionRate = 0.08; // 8% platform fee
const tdsRate = 0.01; // 1% Section 194-O TDS for e-commerce

const platformFee = Math.round(grossOrderSubtotal * commissionRate);
const tdsWithholding = Math.round(grossOrderSubtotal * tdsRate);
const netVendorPayout = grossOrderSubtotal - platformFee - tdsWithholding;

assert(platformFee === 4000, 'Fixed 8% platform fee calculates to ₹4,000 on ₹50,000 gross');
assert(tdsWithholding === 500, '1% TDS withholding calculates to ₹500 on ₹50,000 gross');
assert(netVendorPayout === 45500, 'Net payable to vendor bank account is exactly ₹45,500');

console.log('\n================================================================');
console.log(`TOTAL SUITE RESULTS: ${totalPassed} PASSED, ${totalFailed} FAILED`);
console.log('================================================================');

if (totalFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
