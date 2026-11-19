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

export interface CartCalculationInput {
  items: {
    price?: number;
    unitPrice?: number;
    effectiveUnitPrice?: number;
    basePrice?: number;
    quantity: number;
    gstRate?: number;
    bulkDiscountPercentage?: number;
  }[];
  coupon?: {
    code: string;
    discountType: 'PERCENTAGE' | 'FIXED';
    discountValue: number;
    minOrderValue: number;
    maxDiscount?: number;
  } | null;
  deliverySpeed?: 'ASAP_60' | 'EXPRESS_90' | 'SCHEDULED' | 'NEXT_DAY' | 'STANDARD';
  walletBalanceToUse?: number;
}

export function calculateCartSummary(input: CartCalculationInput) {
  let subtotal = 0;
  let itemDiscount = 0;
  let gstTotal = 0;

  for (const item of input.items || []) {
    const itemPrice = item.price ?? item.effectiveUnitPrice ?? item.unitPrice ?? item.basePrice ?? 0;
    const rawTotal = itemPrice * (item.quantity || 1);
    const bulkPct = item.bulkDiscountPercentage || 0;
    const discountAmount = rawTotal * (bulkPct / 100);
    const effectiveTotal = rawTotal - discountAmount;
    
    // In Indian e-commerce, prices on consumer items usually include GST or GST is calculated on effective base
    // Here we compute GST portion
    const gstRate = item.gstRate ?? 18;
    const gstPortion = Math.round(effectiveTotal * (gstRate / (100 + gstRate)));
    
    subtotal += rawTotal;
    itemDiscount += discountAmount;
    gstTotal += gstPortion;
  }

  const discountedSubtotal = subtotal - itemDiscount;

  // Coupon calculation
  let couponDiscount = 0;
  if (input.coupon && discountedSubtotal >= input.coupon.minOrderValue) {
    if (input.coupon.discountType === 'PERCENTAGE') {
      couponDiscount = Math.round(discountedSubtotal * (input.coupon.discountValue / 100));
      if (input.coupon.maxDiscount && couponDiscount > input.coupon.maxDiscount) {
        couponDiscount = input.coupon.maxDiscount;
      }
    } else {
      couponDiscount = input.coupon.discountValue;
    }
  }

  // Delivery fee calculation
  // Free delivery above ₹1,999
  let deliveryFee = 0;
  if (discountedSubtotal > 0) {
    if (discountedSubtotal < 1999) {
      deliveryFee = input.deliverySpeed === 'ASAP_60' ? 149 : 99;
    } else if (input.deliverySpeed === 'ASAP_60') {
      deliveryFee = 49; // Nominal priority fee
    } else {
      deliveryFee = 0; // Free delivery
    }
  }

  const taxableTotal = Math.max(0, discountedSubtotal - couponDiscount + deliveryFee);
  
  // Wallet usage
  const availableWallet = input.walletBalanceToUse || 0;
  const walletUsed = Math.min(taxableTotal, availableWallet);
  const grandTotal = Math.max(0, taxableTotal - walletUsed);

  return {
    subtotal: Math.round(subtotal),
    itemDiscount: Math.round(itemDiscount),
    discountedSubtotal: Math.round(discountedSubtotal),
    couponDiscount: Math.round(couponDiscount),
    gstTotal: Math.round(gstTotal),
    deliveryFee: Math.round(deliveryFee),
    walletUsed: Math.round(walletUsed),
    grandTotal: Math.round(grandTotal),
    itemCount: input.items.reduce((acc, curr) => acc + curr.quantity, 0)
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
