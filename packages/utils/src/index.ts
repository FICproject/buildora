// Utility functions for BUILDORA 60

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

export function calculateBulkDiscount(
  quantity: number,
  tiers?: { minQuantity: number; discountPercentage: number }[]
): number {
  if (!tiers || tiers.length === 0) return 0;
  // sort descending by minQuantity
  const sorted = [...tiers].sort((a, b) => b.minQuantity - a.minQuantity);
  for (const tier of sorted) {
    if (quantity >= tier.minQuantity) {
      return tier.discountPercentage;
    }
  }
  return 0;
}

export interface UnloadingServiceOptions {
  required: boolean;
  floor: number; // 0 = Ground floor, 1 = 1st floor, etc.
  hasLift: boolean;
  siteInstructions?: string;
  vehicleAccess?: 'MINI_TRUCK' | 'LARGE_TRUCK' | 'RESTRICTED_NARROW_LANE';
}

export interface HandlingFeeItem {
  type: 'HEAVY' | 'FRAGILE' | 'OVERSIZED';
  title: string;
  amount: number;
  explanation: string;
}

export interface CartCalculationInput {
  items: {
    productId?: string;
    categorySlug?: string;
    sku?: string;
    name?: string;
    price?: number;
    unitPrice?: number;
    effectiveUnitPrice?: number;
    basePrice?: number;
    quantity: number;
    gstRate?: number;
    bulkDiscountPercentage?: number;
    unit?: string;
    isHeavy?: boolean;
    isFragile?: boolean;
    isOversized?: boolean;
  }[];
  coupon?: {
    code: string;
    discountType: 'PERCENTAGE' | 'FIXED';
    discountValue: number;
    minOrderValue: number;
    maxDiscount?: number;
    expiryDate?: string;
  } | null;
  deliverySpeed?: 'ASAP_60' | 'EXPRESS_90' | 'SCHEDULED' | 'NEXT_DAY' | 'STANDARD';
  pincode?: string;
  unloadingOptions?: UnloadingServiceOptions;
  walletBalanceToUse?: number;
  freeDeliveryThreshold?: number;
  standardDeliveryFee?: number;
  baseUnloadingFee?: number;
}

export const DEFAULT_FREE_DELIVERY_THRESHOLD = 1000;
export const DEFAULT_STANDARD_DELIVERY_FEE = 199;
export const DEFAULT_BASE_UNLOADING_FEE = 199;

export function calculateCartSummary(input: CartCalculationInput) {
  let subtotal = 0;
  let itemDiscount = 0;
  let gstTotal = 0;

  let hasHeavyItems = false;
  let hasFragileItems = false;
  let hasOversizedItems = false;

  for (const item of input.items || []) {
    const itemPrice = item.price ?? item.effectiveUnitPrice ?? item.unitPrice ?? item.basePrice ?? 0;
    const rawTotal = itemPrice * (item.quantity || 1);
    const bulkPct = item.bulkDiscountPercentage || 0;
    const discountAmount = rawTotal * (bulkPct / 100);
    const effectiveTotal = rawTotal - discountAmount;

    // Detect handling characteristics
    const cat = (item.categorySlug || '').toLowerCase();
    const name = (item.name || '').toLowerCase();
    const unit = (item.unit || '').toLowerCase();

    if (
      item.isHeavy ||
      cat.includes('cement') ||
      cat.includes('concrete') ||
      name.includes('cement') ||
      unit.includes('50 kg') ||
      unit.includes('25 kg') ||
      unit.includes('ton') ||
      unit.includes('bag')
    ) {
      hasHeavyItems = true;
    }

    if (
      item.isFragile ||
      cat.includes('tiling') ||
      cat.includes('glass') ||
      name.includes('vitrified') ||
      name.includes('tile') ||
      name.includes('mirror') ||
      name.includes('glass')
    ) {
      hasFragileItems = true;
    }

    if (
      item.isOversized ||
      cat.includes('tank') ||
      cat.includes('plywood') ||
      name.includes('tank') ||
      name.includes('plywood') ||
      name.includes('sheet (8x4')
    ) {
      hasOversizedItems = true;
    }

    // In Indian e-commerce, consumer and B2B catalog prices are GST-inclusive
    const gstRate = item.gstRate ?? 18;
    const gstPortion = effectiveTotal * (gstRate / (100 + gstRate));

    subtotal += rawTotal;
    itemDiscount += discountAmount;
    gstTotal += gstPortion;
  }

  const discountedSubtotal = Math.max(0, subtotal - itemDiscount);

  // 1. Coupon validation & calculation
  let couponDiscount = 0;
  if (input.coupon && discountedSubtotal >= input.coupon.minOrderValue) {
    if (input.coupon.discountType === 'PERCENTAGE') {
      couponDiscount = discountedSubtotal * (input.coupon.discountValue / 100);
      if (input.coupon.maxDiscount && couponDiscount > input.coupon.maxDiscount) {
        couponDiscount = input.coupon.maxDiscount;
      }
    } else {
      couponDiscount = Math.min(discountedSubtotal, input.coupon.discountValue);
    }
  }

  // 2. Delivery charge calculation
  // Reference behavior: Order value >= ₹1,000 -> Free delivery; below ₹1,000 -> ₹199 delivery (configurable)
  let deliveryFee = 0;
  const freeThreshold = input.freeDeliveryThreshold ?? DEFAULT_FREE_DELIVERY_THRESHOLD;
  const stdDeliveryFee = input.standardDeliveryFee ?? DEFAULT_STANDARD_DELIVERY_FEE;

  // Delivery rule:
  // - Order value >= ₹1,000 -> ₹0 delivery charge (Free delivery)
  // - Order value < ₹1,000 -> ₹199 delivery charge
  // Threshold basis is product subtotal after item/bulk discounts, before coupon discounts
  const deliveryEligibleSubtotal = discountedSubtotal;

  if (deliveryEligibleSubtotal > 0) {
    if (deliveryEligibleSubtotal < freeThreshold) {
      deliveryFee = stdDeliveryFee;
    } else {
      deliveryFee = 0;
    }
  }

  // 3. Handling charge engine
  const handlingBreakdown: HandlingFeeItem[] = [];
  let handlingFee = 0;

  if (hasHeavyItems) {
    const fee = 99;
    handlingFee += fee;
    handlingBreakdown.push({
      type: 'HEAVY',
      title: 'Heavy Material Handling',
      amount: fee,
      explanation: 'Applies to bagged cement, mortar, or high-density civil loads requiring tail-lift mini-truck loading.'
    });
  }

  if (hasFragileItems) {
    const fee = 49;
    handlingFee += fee;
    handlingBreakdown.push({
      type: 'FRAGILE',
      title: 'Fragile Material Transit Protection',
      amount: fee,
      explanation: 'Corner-cushioned packaging & vertical pallet bracing for ceramic/vitrified tiles and architectural glass fittings.'
    });
  }

  if (hasOversizedItems) {
    const fee = 79;
    handlingFee += fee;
    handlingBreakdown.push({
      type: 'OVERSIZED',
      title: 'Oversized Material Handling',
      amount: fee,
      explanation: 'Dedicated tie-down strapping and rack support for 8x4 sheets, water tanks, and long conduit bundles.'
    });
  }

  // 4. Optional Unloading service engine
  // Reference price: ₹199 (Ground-floor unloading assistance only)
  let unloadingFee = 0;
  if (input.unloadingOptions?.required && discountedSubtotal > 0) {
    const baseUnloading = input.baseUnloadingFee ?? 199;
    const floorSurcharge =
      !input.unloadingOptions.hasLift && input.unloadingOptions.floor > 0
        ? input.unloadingOptions.floor * 50
        : 0;
    unloadingFee = baseUnloading + floorSurcharge;
  }

  // 5. Grand Total (Before Wallet)
  // Subtotal - Item Discount - Coupon Discount + Delivery + Handling + Unloading
  const grandTotal = Math.max(
    0,
    discountedSubtotal - couponDiscount + deliveryFee + handlingFee + unloadingFee
  );

  // 6. Wallet usage
  const availableWallet = Math.max(0, input.walletBalanceToUse || 0);
  const walletUsed = Math.min(grandTotal, availableWallet);
  const payableAmount = Math.max(0, grandTotal - walletUsed);

  return {
    subtotal: Math.round(subtotal),
    itemDiscount: Math.round(itemDiscount),
    discountedSubtotal: Math.round(discountedSubtotal),
    couponDiscount: Math.round(couponDiscount),
    deliveryFee: Math.round(deliveryFee),
    handlingFee: Math.round(handlingFee),
    handlingBreakdown,
    unloadingFee: Math.round(unloadingFee),
    gstTotal: Math.round(gstTotal),
    grandTotal: Math.round(grandTotal),
    walletUsed: Math.round(walletUsed),
    payableAmount: Math.round(payableAmount),
    itemCount: (input.items || []).reduce((acc, curr) => acc + (curr.quantity || 1), 0)
  };
}

// Construction Material Estimation Formulas
export const MaterialEstimators = {
  // 1. Cement & Concrete
  // Formula: Concrete slab volume = Length * Width * Thickness (in feet converted to cu.m)
  // 1 cu.m M20 concrete requires approx 8 bags of cement, 0.45 cu.m sand, 0.9 cu.m aggregate
  calculateConcrete(lengthFt: number, widthFt: number, thicknessInches: number) {
    const areaSqFt = lengthFt * widthFt;
    const volumeCuFt = areaSqFt * (thicknessInches / 12);
    const volumeCuM = volumeCuFt * 0.0283168;
    const cementBags = Math.ceil(volumeCuM * 8.2 * 1.05); // 5% wastage
    const sandTons = +(volumeCuM * 0.8 * 1.05).toFixed(1);
    const aggregateTons = +(volumeCuM * 1.5 * 1.05).toFixed(1);
    const estCost = cementBags * 395 + sandTons * 1600 + aggregateTons * 1200;

    return {
      areaSqFt,
      volumeCuM: +volumeCuM.toFixed(2),
      cementBags,
      sandTons,
      aggregateTons,
      estimatedCost: Math.round(estCost)
    };
  },

  // 2. Paint Estimation
  // 1 Litre of emulsion paint covers approx 130 sq.ft for 2 coats
  calculatePaint(carpetAreaSqFt: number, coats: number = 2) {
    // Wall surface is approx 3.2 times the carpet area
    const wallAreaSqFt = carpetAreaSqFt * 3.2;
    const primerLitres = Math.ceil((wallAreaSqFt / 140) * 1.05);
    const puttyKg = Math.ceil((wallAreaSqFt / 16) * 1.05);
    const paintLitres = Math.ceil(((wallAreaSqFt * coats) / (130 * 2)) * 1.05);
    const estCost = primerLitres * 180 + puttyKg * 28 + paintLitres * 380;

    return {
      carpetAreaSqFt,
      wallAreaSqFt: Math.round(wallAreaSqFt),
      primerLitres,
      puttyKg,
      paintLitres,
      estimatedCost: Math.round(estCost)
    };
  },

  // 3. Tile & Adhesives Estimation
  // Room floor area in sq.ft + 10% cutting wastage
  calculateTiles(lengthFt: number, widthFt: number, tileSizeInches: number = 24) {
    const floorAreaSqFt = lengthFt * widthFt;
    const tileAreaSqFt = (tileSizeInches * tileSizeInches) / 144;
    const netTiles = Math.ceil((floorAreaSqFt / tileAreaSqFt) * 1.1); // 10% wastage
    // 2x2 vitrified tiles usually come 4 tiles per box (16 sq.ft)
    const boxes = Math.ceil(netTiles / 4);
    // 1 bag (20kg) tile adhesive covers ~45 sq.ft
    const adhesiveBags = Math.ceil(floorAreaSqFt / 45);
    // Epoxy grout: 1 kg per 60 sq.ft
    const groutKg = Math.ceil(floorAreaSqFt / 60);
    const estCost = boxes * 1150 + adhesiveBags * 460 + groutKg * 350;

    return {
      floorAreaSqFt,
      tileBoxes: boxes,
      totalTiles: netTiles,
      adhesiveBags20Kg: adhesiveBags,
      groutKg,
      estimatedCost: Math.round(estCost)
    };
  },

  // 4. Waterproofing Estimation
  // 1 kg Dr. Fixit or polymer covers ~18-20 sq.ft for 2 coats
  calculateWaterproofing(terraceLengthFt: number, terraceWidthFt: number) {
    const areaSqFt = terraceLengthFt * terraceWidthFt;
    const coatingKg = Math.ceil((areaSqFt / 18) * 1.08); // 8% wastage
    const fiberglassMeshSqM = Math.ceil((areaSqFt * 0.0929) * 1.1);
    const estCost = coatingKg * 290 + fiberglassMeshSqM * 65;

    return {
      areaSqFt,
      waterproofingCompoundKg: coatingKg,
      fiberglassMeshSqM,
      estimatedCost: Math.round(estCost)
    };
  },

  // 5. Plywood Estimation
  // Standard sheet is 8ft x 4ft = 32 sq.ft
  calculatePlywood(wardrobeWidthFt: number, wardrobeHeightFt: number, depthFt: number = 2) {
    // Surface area of 6 panels
    const totalPanelSqFt = 2 * (wardrobeWidthFt * wardrobeHeightFt) +
                           2 * (wardrobeHeightFt * depthFt) +
                           2 * (wardrobeWidthFt * depthFt) +
                           (wardrobeWidthFt * depthFt * 3); // 3 internal shelves
    const sheets = Math.ceil((totalPanelSqFt / 32) * 1.15); // 15% cutting wastage
    const fevicolKg = Math.ceil(sheets * 1.5);
    const estCost = sheets * 2850 + fevicolKg * 260;

    return {
      totalPanelSqFt: Math.round(totalPanelSqFt),
      plywoodSheets8x4: sheets,
      fevicolKg,
      estimatedCost: Math.round(estCost)
    };
  }
};
