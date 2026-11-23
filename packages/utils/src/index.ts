// Utility functions for BUILDORA 60
import {
  ConstructionQualityTier,
  ConstructionPropertyType,
  ConstructionStageType,
  ConstructionAreaUnit,
  ConstructionCategoryKey,
  ConstructionCategoryItem,
  ConstructionCalculatorInput,
  ConstructionCalculatorResult,
  ConstructionCostChartSegment,
  SavedConstructionProject,
  ConstructionQuotationRequest
} from '@buildora/types';

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

// ========================================================
// 6. Comprehensive Home Construction Calculator (Civil Standards)
// ========================================================

export type ConstructionType = 'RESIDENTIAL_INDEPENDENT' | 'RESIDENTIAL_APARTMENT' | 'COMMERCIAL';
export type ConstructionQuality = 'STANDARD' | 'PREMIUM' | 'LUXURY';
export type AreaUnit = 'SQ_FT' | 'SQ_M';

export interface ConstructionCalculationInput {
  constructionType: ConstructionType;
  floors: number;
  builtUpArea: number;
  areaUnit: AreaUnit;
  quality: ConstructionQuality;
  customRatePerSqFt?: number;
  location?: string;
  pincode?: string;
  additionalRequirements?: {
    compoundWall?: boolean;
    sumpAndTank?: boolean;
    rooftopSolar?: boolean;
    falseCeiling?: boolean;
  };
}

export interface ConstructionStageBreakdown {
  id: string;
  name: string;
  percentage: number;
  cost: number;
  description: string;
  keyMaterials: string[];
}

export interface MaterialQuantityEstimate {
  id: string;
  material: string;
  quantity: number;
  unit: string;
  estimatedCost: number;
  categorySlug: string;
  recommendedSku?: string;
  productSlug?: string;
}

export interface ConstructionCalculationResult {
  builtUpAreaSqFt: number;
  floors: number;
  quality: ConstructionQuality;
  constructionType: ConstructionType;
  baseRatePerSqFt: number;
  totalEstimatedCost: number;
  costPerSqFt: number;
  materialCost: number;
  labourCost: number;
  architecturalCost: number;
  additionalCost: number;
  stages: ConstructionStageBreakdown[];
  materials: MaterialQuantityEstimate[];
}

export const BASE_RATES_PER_SQFT: Record<ConstructionQuality, number> = {
  STANDARD: 1750,
  PREMIUM: 2150,
  LUXURY: 2850
};

export function calculateHomeConstruction(
  input: ConstructionCalculationInput
): ConstructionCalculationResult {
  const sqFt =
    input.areaUnit === 'SQ_M'
      ? Math.round(input.builtUpArea * 10.7639)
      : Math.round(input.builtUpArea);

  const baseRate =
    input.customRatePerSqFt && input.customRatePerSqFt > 0
      ? input.customRatePerSqFt
      : BASE_RATES_PER_SQFT[input.quality] || 2150;

  // Base structural cost
  const baseTotalCost = sqFt * baseRate;

  // Additional options
  let additionalCost = 0;
  if (input.additionalRequirements?.compoundWall) additionalCost += 120000;
  if (input.additionalRequirements?.sumpAndTank) additionalCost += 95000;
  if (input.additionalRequirements?.rooftopSolar) additionalCost += 75000;
  if (input.additionalRequirements?.falseCeiling) additionalCost += Math.round(sqFt * 85);

  const totalEstimatedCost = baseTotalCost + additionalCost;
  const costPerSqFt = Math.round(totalEstimatedCost / (sqFt || 1));

  // Cost split: Material (62%), Labour (28%), Architecture/Approvals (10%)
  const materialCost = Math.round(totalEstimatedCost * 0.62);
  const labourCost = Math.round(totalEstimatedCost * 0.28);
  const architecturalCost = totalEstimatedCost - materialCost - labourCost;

  // 12 Construction Stages
  const stages: ConstructionStageBreakdown[] = [
    {
      id: 'stg-1',
      name: 'Foundation & Earthwork',
      percentage: 10,
      cost: Math.round(totalEstimatedCost * 0.10),
      description: 'Site excavation, PCC 1:4:8, footing reinforcement, plinth beam, and anti-termite treatment.',
      keyMaterials: ['PPC Cement', 'TMT Steel 12mm & 16mm', 'Coarse Sand', '40mm Aggregates']
    },
    {
      id: 'stg-2',
      name: 'RCC Framework (Columns, Beams & Slabs)',
      percentage: 22,
      cost: Math.round(totalEstimatedCost * 0.22),
      description: 'Casting of RCC columns, roof beams, 5-inch roof slabs, and cantilever chajjas with M20 concrete.',
      keyMaterials: ['UltraTech Super Cement', 'Fe 550D TMT Bars', 'M-Sand', '20mm Blue Metal']
    },
    {
      id: 'stg-3',
      name: 'Masonry & Wall Construction',
      percentage: 12,
      cost: Math.round(totalEstimatedCost * 0.12),
      description: '6-inch external perimeter walls and 4-inch internal partition walls using solid blocks/AAC blocks.',
      keyMaterials: ['AAC Blocks / Solid Blocks', 'Masonry Cement', 'M-Sand Mortar']
    },
    {
      id: 'stg-4',
      name: 'Internal & External Plastering',
      percentage: 7,
      cost: Math.round(totalEstimatedCost * 0.07),
      description: '12mm smooth trowel internal wall plastering and 20mm double-coat sand-face waterproof external plastering.',
      keyMaterials: ['Plastering P-Sand', 'PPC Cement', 'Bonding Agents']
    },
    {
      id: 'stg-5',
      name: 'Waterproofing & Protective Membranes',
      percentage: 4,
      cost: Math.round(totalEstimatedCost * 0.04),
      description: 'Elastomeric acrylic coating on roof terrace slab, underground sump, and bathroom sunken slabs.',
      keyMaterials: ['Dr. Fixit Pidiproof LW+', 'Dr. Fixit Fastflex', 'Polymer Mortar']
    },
    {
      id: 'stg-6',
      name: 'Flooring, Tiling & Cladding',
      percentage: 11,
      cost: Math.round(totalEstimatedCost * 0.11),
      description: 'Double-charge vitrified floor tiles (2x2 ft / 2x4 ft), anti-skid bathroom tiles, and granite staircases.',
      keyMaterials: ['Kajaria Vitrified Tiles', 'Roff T02 Tile Adhesive', 'Epoxy Grout']
    },
    {
      id: 'stg-7',
      name: 'Doors, Windows & Fabrication',
      percentage: 8,
      cost: Math.round(totalEstimatedCost * 0.08),
      description: 'Teakwood/panel main doors, flush bedroom doors, UPVC 3-track sliding windows, and safety grilles.',
      keyMaterials: ['Greenply Marine Plywood', 'UPVC Windows', 'Mild Steel Grilles']
    },
    {
      id: 'stg-8',
      name: 'Electrical Conduits, Wiring & Panels',
      percentage: 7,
      cost: Math.round(totalEstimatedCost * 0.07),
      description: 'Concealed PVC conduit pipe routing, FRLS copper wiring, modular switch boxes, MCB distribution board, and earthing.',
      keyMaterials: ['Havells 2.5 & 1.5 sq.mm Wires', 'Flexible PVC Conduits', 'Anchor GI Metal Boxes', 'Schneider MCBs']
    },
    {
      id: 'stg-9',
      name: 'Plumbing, SWR Drainage & Sanitary',
      percentage: 6,
      cost: Math.round(totalEstimatedCost * 0.06),
      description: 'Concealed CPVC hot & cold water supply lines, PVC SWR soil waste drainage pipes, and overhead storage.',
      keyMaterials: ['Astral CPVC Pro Pipes', 'Prince SWR Drainage', 'Brass Valves']
    },
    {
      id: 'stg-10',
      name: 'Painting, Putty & Wall Finishing',
      percentage: 5,
      cost: Math.round(totalEstimatedCost * 0.05),
      description: '2 coats acrylic wall putty, 1 coat alkali-resistant primer, and 2 coats luxury emulsion paint.',
      keyMaterials: ['Birla White Putty', 'Asian Paints Primer', 'Asian Paints Royale Emulsion']
    },
    {
      id: 'stg-11',
      name: 'Architectural Hardware & Locks',
      percentage: 4,
      cost: Math.round(totalEstimatedCost * 0.04),
      description: 'Main door high-security mortise locks, cylindrical bedroom locks, stainless steel hinges, and fittings.',
      keyMaterials: ['Godrej Tribolt Ultra Locks', 'Ebco Hardware Screws', 'SS 304 Butt Hinges']
    },
    {
      id: 'stg-12',
      name: 'Site Infrastructure & Final Handover',
      percentage: 4,
      cost: Math.round(totalEstimatedCost * 0.04),
      description: 'Compound wall, gate fixing, site debris clearance, deep cleaning, and pre-occupancy inspection.',
      keyMaterials: ['Boundary Blocks', 'Steel Gate Hardware', 'Cement Coping']
    }
  ];

  // Material Quantities based on Civil Engineering Formulae
  const cementBags = Math.ceil(sqFt * 0.42);
  const steelTonnes = +(sqFt * 0.0038).toFixed(2);
  const sandTonnes = Math.ceil(sqFt * 0.075);
  const aggregateTonnes = Math.ceil(sqFt * 0.06);
  const aacBlocks = Math.ceil(sqFt * 1.4);
  const tileSqFt = Math.ceil(sqFt * 1.2);
  const paintLitres = Math.ceil(sqFt * 0.18);
  const waterproofKg = Math.ceil(sqFt * 0.08);
  const wireCoils = Math.ceil(sqFt * 0.016);
  const conduitRolls = Math.max(2, Math.ceil(sqFt * 0.0025));
  const switchBoxes = Math.ceil(sqFt * 0.025);
  const plumbingPipes = Math.ceil(sqFt * 0.03);

  const materials: MaterialQuantityEstimate[] = [
    {
      id: 'mat-cement',
      material: 'Cement (PPC & Waterproof 50kg Bags)',
      quantity: cementBags,
      unit: 'Bags',
      estimatedCost: cementBags * 395,
      categorySlug: 'cement-concrete',
      recommendedSku: 'CEM-ULT-PPC-50KG',
      productSlug: 'ultratech-super-cement-ppc-50kg'
    },
    {
      id: 'mat-steel',
      material: 'TMT Steel Rebar (Fe 550D High Ductility)',
      quantity: steelTonnes,
      unit: 'Tonnes',
      estimatedCost: Math.round(steelTonnes * 68000),
      categorySlug: 'cement-concrete',
      recommendedSku: 'STL-JIN-550D-12MM'
    },
    {
      id: 'mat-sand',
      material: 'M-Sand & P-Sand (Manufactured Sand)',
      quantity: sandTonnes,
      unit: 'Tonnes',
      estimatedCost: sandTonnes * 1600,
      categorySlug: 'cement-concrete'
    },
    {
      id: 'mat-aggregates',
      material: 'Coarse Blue Metal Aggregates (20mm & 40mm)',
      quantity: aggregateTonnes,
      unit: 'Tonnes',
      estimatedCost: aggregateTonnes * 1250,
      categorySlug: 'cement-concrete'
    },
    {
      id: 'mat-blocks',
      material: 'AAC Light-Weight Concrete Masonry Blocks',
      quantity: aacBlocks,
      unit: 'Blocks',
      estimatedCost: aacBlocks * 75,
      categorySlug: 'cement-concrete'
    },
    {
      id: 'mat-tiles',
      material: 'Vitrified Glazed Floor Tiles & Adhesives',
      quantity: Math.ceil(tileSqFt / 16),
      unit: 'Boxes (16 sq.ft/box)',
      estimatedCost: Math.ceil(tileSqFt / 16) * 880,
      categorySlug: 'tiling-tile-adhesives',
      recommendedSku: 'TIL-KAJ-GVT-600',
      productSlug: 'kajaria-double-charge-vitrified-tiles-600x600'
    },
    {
      id: 'mat-waterproof',
      material: 'Integral Waterproofing Admixture & Coating',
      quantity: Math.ceil(waterproofKg / 5),
      unit: 'Cans (5L Can)',
      estimatedCost: Math.ceil(waterproofKg / 5) * 620,
      categorySlug: 'cement-concrete',
      recommendedSku: 'WTR-FIX-LW-5L',
      productSlug: 'dr-fixit-101-lw-plus-integral-waterproofing-5l'
    },
    {
      id: 'mat-wires',
      material: 'FRLS Copper Flexible Wires (1.5 & 2.5 sq.mm, 90m)',
      quantity: wireCoils,
      unit: 'Coils',
      estimatedCost: wireCoils * 2680,
      categorySlug: 'wires-mcb-distribution-boards',
      recommendedSku: 'WIR-HAV-FRLS-25',
      productSlug: 'havells-lifeline-plus-frls-copper-wire-2-5sqmm-90m'
    },
    {
      id: 'mat-conduits',
      material: 'Flexible Corrugated PVC Conduit Pipe Rolls (20mm, 50m)',
      quantity: conduitRolls,
      unit: 'Rolls',
      estimatedCost: conduitRolls * 280,
      categorySlug: 'wires-mcb-distribution-boards',
      recommendedSku: 'CON-PVC-GRY-20MM',
      productSlug: 'flexible-pvc-electrical-conduit-pipe-roll'
    },
    {
      id: 'mat-switch-boxes',
      material: 'Anchor GI Metal Back Box (Modular Concealed)',
      quantity: switchBoxes,
      unit: 'Pieces',
      estimatedCost: switchBoxes * 45,
      categorySlug: 'wires-mcb-distribution-boards',
      recommendedSku: 'ANC-GI-2MOD',
      productSlug: 'anchor-gi-metal-back-box'
    },
    {
      id: 'mat-pipes',
      material: 'Astral CPVC Pro Pipes & Fittings (Class 1, 3m)',
      quantity: plumbingPipes,
      unit: 'Lengths',
      estimatedCost: plumbingPipes * 420,
      categorySlug: 'cpvc-pipes-fittings',
      recommendedSku: 'PIP-AST-CPVC-1IN'
    },
    {
      id: 'mat-locks',
      material: 'High-Security Exterior & Interior Locksets',
      quantity: Math.max(3, input.floors * 3),
      unit: 'Locksets',
      estimatedCost: Math.max(3, input.floors * 3) * 780,
      categorySlug: 'hinges-channels-handles',
      recommendedSku: 'LCK-GOD-NAV-8L',
      productSlug: 'godrej-nav-tal-8-levers-brass-padlock'
    }
  ];

  return {
    builtUpAreaSqFt: sqFt,
    floors: input.floors,
    quality: input.quality,
    constructionType: input.constructionType,
    baseRatePerSqFt: baseRate,
    totalEstimatedCost,
    costPerSqFt,
    materialCost,
    labourCost,
    architecturalCost,
    additionalCost,
    stages,
    materials
  };
}

// ========================================================
// 7. Full Reference-Based 13-Category Home Construction Cost Engine
// ========================================================

export interface CityLocationConfig {
  name: string;
  multiplier: number;
}

export interface StateLocationConfig {
  state: string;
  cities: CityLocationConfig[];
}

export const SUPPORTED_INDIAN_LOCATIONS: StateLocationConfig[] = [
  {
    state: 'Karnataka',
    cities: [
      { name: 'Bengaluru', multiplier: 1.0 },
      { name: 'Mysuru', multiplier: 0.94 },
      { name: 'Hubballi-Dharwad', multiplier: 0.91 },
      { name: 'Mangaluru', multiplier: 0.97 },
      { name: 'Belagavi', multiplier: 0.90 }
    ]
  },
  {
    state: 'Maharashtra',
    cities: [
      { name: 'Mumbai', multiplier: 1.15 },
      { name: 'Pune', multiplier: 1.05 },
      { name: 'Nagpur', multiplier: 0.95 },
      { name: 'Thane', multiplier: 1.12 },
      { name: 'Nashik', multiplier: 0.93 }
    ]
  },
  {
    state: 'Tamil Nadu',
    cities: [
      { name: 'Chennai', multiplier: 1.04 },
      { name: 'Coimbatore', multiplier: 0.98 },
      { name: 'Madurai', multiplier: 0.92 },
      { name: 'Tiruchirappalli', multiplier: 0.91 },
      { name: 'Salem', multiplier: 0.90 }
    ]
  },
  {
    state: 'Telangana',
    cities: [
      { name: 'Hyderabad', multiplier: 1.02 },
      { name: 'Warangal', multiplier: 0.93 },
      { name: 'Nizamabad', multiplier: 0.90 },
      { name: 'Karimnagar', multiplier: 0.91 }
    ]
  },
  {
    state: 'Delhi NCR',
    cities: [
      { name: 'New Delhi', multiplier: 1.10 },
      { name: 'Gurugram', multiplier: 1.12 },
      { name: 'Noida', multiplier: 1.08 },
      { name: 'Faridabad', multiplier: 1.05 },
      { name: 'Ghaziabad', multiplier: 1.04 }
    ]
  },
  {
    state: 'Kerala',
    cities: [
      { name: 'Kochi', multiplier: 1.06 },
      { name: 'Thiruvananthapuram', multiplier: 1.02 },
      { name: 'Kozhikode', multiplier: 0.99 },
      { name: 'Thrissur', multiplier: 0.98 }
    ]
  },
  {
    state: 'Gujarat',
    cities: [
      { name: 'Ahmedabad', multiplier: 0.96 },
      { name: 'Surat', multiplier: 0.98 },
      { name: 'Vadodara', multiplier: 0.94 },
      { name: 'Rajkot', multiplier: 0.92 }
    ]
  },
  {
    state: 'Andhra Pradesh',
    cities: [
      { name: 'Visakhapatnam', multiplier: 0.98 },
      { name: 'Vijayawada', multiplier: 0.96 },
      { name: 'Guntur', multiplier: 0.93 },
      { name: 'Tirupati', multiplier: 0.94 }
    ]
  },
  {
    state: 'West Bengal',
    cities: [
      { name: 'Kolkata', multiplier: 0.98 },
      { name: 'Siliguri', multiplier: 0.93 },
      { name: 'Howrah', multiplier: 0.96 }
    ]
  },
  {
    state: 'Rajasthan',
    cities: [
      { name: 'Jaipur', multiplier: 0.96 },
      { name: 'Jodhpur', multiplier: 0.93 },
      { name: 'Udaipur', multiplier: 0.94 }
    ]
  },
  {
    state: 'Punjab & Chandigarh',
    cities: [
      { name: 'Chandigarh', multiplier: 1.06 },
      { name: 'Ludhiana', multiplier: 0.96 },
      { name: 'Amritsar', multiplier: 0.94 }
    ]
  },
  {
    state: 'Goa',
    cities: [
      { name: 'Panaji', multiplier: 1.08 },
      { name: 'Margao', multiplier: 1.04 }
    ]
  }
];

export const PROPERTY_TYPE_MULTIPLIERS: Record<ConstructionPropertyType, { name: string; multiplier: number }> = {
  INDEPENDENT_HOUSE: { name: 'Independent House', multiplier: 1.0 },
  VILLA: { name: 'Gated Villa', multiplier: 1.15 },
  APARTMENT: { name: 'Apartment Unit', multiplier: 0.95 },
  COMMERCIAL_BUILDING: { name: 'Commercial Building', multiplier: 1.08 },
  RENOVATION: { name: 'Home Renovation', multiplier: 0.65 }
};

export const STAGE_MULTIPLIERS: Record<ConstructionStageType, { name: string; multiplier: number; relevantCategories: ConstructionCategoryKey[] }> = {
  FULL_CONSTRUCTION: {
    name: 'Full Turnkey Construction',
    multiplier: 1.0,
    relevantCategories: [
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
    ]
  },
  FOUNDATION: {
    name: 'Earthwork & Foundation',
    multiplier: 0.16,
    relevantCategories: ['cement', 'steel', 'sand', 'aggregate', 'contractor_labour']
  },
  STRUCTURAL: {
    name: 'RCC Superstructure & Framing',
    multiplier: 0.42,
    relevantCategories: ['cement', 'steel', 'sand', 'aggregate', 'bricks', 'contractor_labour']
  },
  BRICKWORK: {
    name: 'Masonry & Wall Construction',
    multiplier: 0.55,
    relevantCategories: ['bricks', 'cement', 'sand', 'contractor_labour']
  },
  ROOFING: {
    name: 'Slab Casting & Waterproofing',
    multiplier: 0.65,
    relevantCategories: ['cement', 'steel', 'aggregate', 'sand', 'contractor_labour']
  },
  INTERIOR_FINISHING: {
    name: 'Interior & Architectural Finishing',
    multiplier: 0.38,
    relevantCategories: [
      'tiles_flooring',
      'windows_grills',
      'doors',
      'electrical_wiring',
      'paint_putty',
      'sanitaryware',
      'modular_kitchen',
      'contractor_labour'
    ]
  }
};

// Base weight for the 13 categories (sums to 100%)
export const CATEGORY_BASE_CONFIG: Record<
  ConstructionCategoryKey,
  {
    name: string;
    iconName: string;
    weightPercentage: number;
    unit: string;
    color: string;
    isDeliverable: boolean;
    categorySlug?: string;
    recommendedProductSlug?: string;
    specs: Record<ConstructionQualityTier, { label: string; rateMultiplier: number; rateDescription: string }>;
    quantityFormula: (areaSqFt: number, quality: ConstructionQualityTier) => number;
  }
> = {
  cement: {
    name: 'Cement',
    iconName: 'Package',
    weightPercentage: 14.0,
    unit: 'Bags (50kg)',
    color: '#f97316', // Brand orange
    isDeliverable: true,
    categorySlug: 'cement-concrete',
    recommendedProductSlug: 'ultratech-super-cement-ppc-50kg',
    specs: {
      BASIC: { label: 'PPC 53 Grade Blended', rateMultiplier: 0.88, rateDescription: 'Standard PPC Cement @ ₹360/bag' },
      STANDARD: { label: 'UltraTech Super PPC', rateMultiplier: 1.0, rateDescription: 'Micro-fine particle PPC @ ₹395/bag' },
      PREMIUM: { label: 'UltraTech Weather Plus / Birla A1', rateMultiplier: 1.15, rateDescription: 'Water-repellent anti-efflorescence cement @ ₹440/bag' }
    },
    quantityFormula: (areaSqFt) => Math.ceil(areaSqFt * 0.42)
  },
  steel: {
    name: 'TMT Steel',
    iconName: 'Hammer',
    weightPercentage: 15.0,
    unit: 'Kg (Metric)',
    color: '#2563eb', // Blue
    isDeliverable: false,
    specs: {
      BASIC: { label: 'Fe 500 TMT Rebars', rateMultiplier: 0.88, rateDescription: 'Secondary Mill Fe 500 @ ₹62/kg' },
      STANDARD: { label: 'Fe 550D High Ductility TMT', rateMultiplier: 1.0, rateDescription: 'Primary Mill Fe 550D @ ₹68/kg' },
      PREMIUM: { label: 'Jindal Panther / Tata Tiscon 550D', rateMultiplier: 1.18, rateDescription: 'Corrosion resistant Super Ductile @ ₹78/kg' }
    },
    quantityFormula: (areaSqFt) => Math.ceil(areaSqFt * 3.8)
  },
  bricks: {
    name: 'Bricks & Blocks',
    iconName: 'Grid',
    weightPercentage: 5.5,
    unit: 'Units',
    color: '#ea580c',
    isDeliverable: false,
    specs: {
      BASIC: { label: 'Fly-Ash Brick Masonry', rateMultiplier: 0.85, rateDescription: 'Class 1 Fly-ash bricks @ ₹8.5/pc' },
      STANDARD: { label: 'Solid Concrete Blocks (6" & 4")', rateMultiplier: 1.0, rateDescription: 'Machine-pressed solid blocks @ ₹38/block' },
      PREMIUM: { label: 'AAC Light-Weight Thermal Blocks', rateMultiplier: 1.25, rateDescription: 'Autoclaved aerated concrete + joint mortar @ ₹75/block' }
    },
    quantityFormula: (areaSqFt, quality) => (quality === 'BASIC' ? Math.ceil(areaSqFt * 16) : Math.ceil(areaSqFt * 1.4))
  },
  aggregate: {
    name: 'Aggregate',
    iconName: 'Layers',
    weightPercentage: 4.0,
    unit: 'Cu.ft',
    color: '#64748b',
    isDeliverable: false,
    specs: {
      BASIC: { label: '20mm & 40mm Crushed Metal', rateMultiplier: 0.86, rateDescription: 'Standard quarry jelly @ ₹38/cft' },
      STANDARD: { label: 'Machine-Crushed Blue Metal (20mm)', rateMultiplier: 1.0, rateDescription: 'Uniform graded blue granite @ ₹44/cft' },
      PREMIUM: { label: 'VSI Washed Angular Aggregate', rateMultiplier: 1.18, rateDescription: 'Vertical shaft impactor crushed cube jelly @ ₹52/cft' }
    },
    quantityFormula: (areaSqFt) => Math.ceil(areaSqFt * 1.35)
  },
  sand: {
    name: 'Sand (M-Sand & P-Sand)',
    iconName: 'Layers',
    weightPercentage: 6.0,
    unit: 'Cu.ft',
    color: '#d97706',
    isDeliverable: false,
    specs: {
      BASIC: { label: 'Single-Washed M-Sand', rateMultiplier: 0.86, rateDescription: 'Standard manufactured sand @ ₹48/cft' },
      STANDARD: { label: 'Double-Washed M-Sand & Plaster P-Sand', rateMultiplier: 1.0, rateDescription: 'Silt-free engineered sand @ ₹58/cft' },
      PREMIUM: { label: 'Certified River Sand / Robo Sand', rateMultiplier: 1.35, rateDescription: 'Graded fine river sand @ ₹85/cft' }
    },
    quantityFormula: (areaSqFt) => Math.ceil(areaSqFt * 2.1)
  },
  tiles_flooring: {
    name: 'Tiles & Flooring',
    iconName: 'Grid',
    weightPercentage: 8.5,
    unit: 'Sq.ft',
    color: '#0284c7',
    isDeliverable: true,
    categorySlug: 'tiling-tile-adhesives',
    recommendedProductSlug: 'kajaria-double-charge-vitrified-tiles-600x600',
    specs: {
      BASIC: { label: 'Ceramic Floor Tiles (16"x16")', rateMultiplier: 0.75, rateDescription: 'Glazed ceramic tiles @ ₹42/sq.ft' },
      STANDARD: { label: 'Kajaria Double Charge GVT (2x2 ft)', rateMultiplier: 1.0, rateDescription: 'Vitrified high-gloss tiles @ ₹65/sq.ft' },
      PREMIUM: { label: 'Large Format 4x2ft GVT / Italian Marble', rateMultiplier: 1.45, rateDescription: 'Carving matte vitrified & composite marble @ ₹120/sq.ft' }
    },
    quantityFormula: (areaSqFt) => Math.ceil(areaSqFt * 1.25)
  },
  windows_grills: {
    name: 'Windows & Grills',
    iconName: 'Maximize2',
    weightPercentage: 4.5,
    unit: 'Sq.ft',
    color: '#0d9488',
    isDeliverable: false,
    specs: {
      BASIC: { label: 'Aluminium Sliding Windows (2-Track)', rateMultiplier: 0.80, rateDescription: 'Powder-coated anodized aluminium @ ₹280/sq.ft' },
      STANDARD: { label: 'uPVC 2.5-Track with Mesh & MS Grill', rateMultiplier: 1.0, rateDescription: 'Aparna/Kommerling uPVC with safety grill @ ₹480/sq.ft' },
      PREMIUM: { label: 'German uPVC / Thermal-Break Aluminium', rateMultiplier: 1.50, rateDescription: 'Toughened acoustic glass + SS safety grill @ ₹850/sq.ft' }
    },
    quantityFormula: (areaSqFt) => Math.ceil(areaSqFt * 0.12)
  },
  doors: {
    name: 'Doors & Frames',
    iconName: 'DoorClosed',
    weightPercentage: 4.0,
    unit: 'Units',
    color: '#b45309',
    isDeliverable: true,
    categorySlug: 'hinges-channels-handles',
    recommendedProductSlug: 'godrej-nav-tal-8-levers-brass-padlock',
    specs: {
      BASIC: { label: 'Flush Doors & Hardwood Frames', rateMultiplier: 0.78, rateDescription: 'Painted flush doors @ ₹4,500/door' },
      STANDARD: { label: 'Laminated Flush Doors + Godrej Locksets', rateMultiplier: 1.0, rateDescription: 'Sal wood frames & laminated doors @ ₹8,500/door' },
      PREMIUM: { label: 'Teakwood Main Door + Smart Digital Locks', rateMultiplier: 1.60, rateDescription: 'Burma teak carved entrance + digital mortise @ ₹22,000/door' }
    },
    quantityFormula: (areaSqFt) => Math.max(3, Math.ceil(areaSqFt * 0.0055))
  },
  electrical_wiring: {
    name: 'Electrical & Wiring',
    iconName: 'Zap',
    weightPercentage: 7.0,
    unit: 'Sq.ft Point',
    color: '#eab308',
    isDeliverable: true,
    categorySlug: 'wires-mcb-distribution-boards',
    recommendedProductSlug: 'havells-lifeline-plus-frls-copper-wire-2-5sqmm-90m',
    specs: {
      BASIC: { label: 'Standard FRLS Wires & Anchor Modulars', rateMultiplier: 0.80, rateDescription: 'ISI copper wiring + 6A modular switches @ ₹95/sq.ft' },
      STANDARD: { label: 'Havells LifeLine Plus FRLS + PVC Conduits', rateMultiplier: 1.0, rateDescription: 'Flame-retardant 100% copper + Anchor Roma @ ₹145/sq.ft' },
      PREMIUM: { label: 'Zero-Halogen FRLS + Schneider Smart Touch', rateMultiplier: 1.45, rateDescription: 'Smart automation modulars + 3-Phase DB @ ₹230/sq.ft' }
    },
    quantityFormula: (areaSqFt) => areaSqFt
  },
  paint_putty: {
    name: 'Paint & Putty',
    iconName: 'Paintbrush',
    weightPercentage: 5.5,
    unit: 'Sq.ft Surface',
    color: '#ec4899',
    isDeliverable: true,
    categorySlug: 'waterproofing',
    recommendedProductSlug: 'dr-fixit-101-lw-plus-integral-waterproofing-5l',
    specs: {
      BASIC: { label: 'Tractor Acrylic Emulsion + 2 Coats Putty', rateMultiplier: 0.76, rateDescription: 'Standard smooth interior paint @ ₹22/sq.ft' },
      STANDARD: { label: 'Asian Paints Royale + Dr. Fixit LW+', rateMultiplier: 1.0, rateDescription: 'Teflon luxury emulsion + waterproof primer @ ₹36/sq.ft' },
      PREMIUM: { label: 'Royale Aspira / PU Finish + Weather Shield', rateMultiplier: 1.40, rateDescription: 'Anti-fungal elastomeric exterior coat @ ₹58/sq.ft' }
    },
    quantityFormula: (areaSqFt) => Math.ceil(areaSqFt * 3.2)
  },
  sanitaryware: {
    name: 'Sanitaryware & Bath',
    iconName: 'Droplets',
    weightPercentage: 6.0,
    unit: 'Sets',
    color: '#06b6d4',
    isDeliverable: true,
    categorySlug: 'sanitary-bath-fittings',
    recommendedProductSlug: 'jaquar-alive-single-lever-brass-basin-mixer-tap',
    specs: {
      BASIC: { label: 'Hindware / Cera White Ceramics & Taps', rateMultiplier: 0.75, rateDescription: 'Floor-mount WC & quarter-turn taps @ ₹18,000/set' },
      STANDARD: { label: 'Jaquar Wall-Hung WC & Single-Lever Mixers', rateMultiplier: 1.0, rateDescription: 'Concealed cisterns & brass mixers @ ₹38,000/set' },
      PREMIUM: { label: 'Kohler / Grohe Thermostatic & Glass Partitions', rateMultiplier: 1.55, rateDescription: 'Rain showers & frameless glass cubicles @ ₹85,000/set' }
    },
    quantityFormula: (areaSqFt) => Math.max(2, Math.ceil(areaSqFt / 450))
  },
  modular_kitchen: {
    name: 'Modular Kitchen',
    iconName: 'Utensils',
    weightPercentage: 4.5,
    unit: 'Kitchen Set',
    color: '#8b5cf6',
    isDeliverable: true,
    categorySlug: 'kitchen-systems-accessories',
    recommendedProductSlug: 'godrej-kitchen-ss-304-wire-plain-basket-17x20x6',
    specs: {
      BASIC: { label: 'Granite Countertop & Basic SS Sink', rateMultiplier: 0.70, rateDescription: 'Granite top with basic shutters @ ₹45,000' },
      STANDARD: { label: 'BWP Marine Carcass + Godrej SS 304 Baskets', rateMultiplier: 1.0, rateDescription: 'Acrylic finish shutters & quartz sink @ ₹1,20,000' },
      PREMIUM: { label: 'Hafele Soft-Close Tandems & Quartz Island', rateMultiplier: 1.65, rateDescription: 'Imported quartz top & pantry pull-outs @ ₹2,50,000' }
    },
    quantityFormula: (areaSqFt) => Math.max(1, Math.round(areaSqFt / 1400))
  },
  contractor_labour: {
    name: 'Contractor & Labour',
    iconName: 'HardHat',
    weightPercentage: 15.5,
    unit: 'Sq.ft Turnkey',
    color: '#1e293b', // Slate
    isDeliverable: false,
    specs: {
      BASIC: { label: 'Independent Trades & Daily Labour', rateMultiplier: 0.85, rateDescription: 'Daily wage masons & helpers @ ₹310/sq.ft' },
      STANDARD: { label: 'Turnkey Civil Contractor with Site Supervisor', rateMultiplier: 1.0, rateDescription: 'Experienced contractor with safety staging @ ₹420/sq.ft' },
      PREMIUM: { label: 'Grade-A Engineering Contractor + Quality Lab', rateMultiplier: 1.35, rateDescription: 'Dedicated site engineer & structural audits @ ₹580/sq.ft' }
    },
    quantityFormula: (areaSqFt) => areaSqFt
  }
};

// Base cost per sq.ft by quality tier in Bengaluru (Baseline 1.0x)
export const GLOBAL_BASE_RATES: Record<ConstructionQualityTier, number> = {
  BASIC: 1650,
  STANDARD: 2050,
  PREMIUM: 2650
};

export function calculateFullConstructionEstimate(
  input: ConstructionCalculatorInput
): ConstructionCalculatorResult {
  // 1. Resolve Built-up Area in Sq.Ft
  const sqFt =
    input.areaUnit === 'SQ_M'
      ? Math.round(input.builtUpArea * 10.7639)
      : Math.round(input.builtUpArea);

  // 2. Resolve Location Multiplier
  const stateConfig = SUPPORTED_INDIAN_LOCATIONS.find(
    (s) => s.state.toLowerCase() === input.state.toLowerCase()
  );
  const cityConfig = stateConfig?.cities.find(
    (c) => c.name.toLowerCase() === input.city.toLowerCase()
  );
  const locationMultiplier = cityConfig?.multiplier || 1.0;

  // 3. Resolve Property Type & Floor Multiplier
  const propConfig = PROPERTY_TYPE_MULTIPLIERS[input.propertyType] || PROPERTY_TYPE_MULTIPLIERS.INDEPENDENT_HOUSE;
  const propertyMultiplier = propConfig.multiplier;

  let floorMultiplier = 1.0;
  if (input.floors === 2) floorMultiplier = 1.02;
  else if (input.floors === 3) floorMultiplier = 1.05;
  else if (input.floors === 4) floorMultiplier = 1.08;
  else if (input.floors > 4) floorMultiplier = 1.12;

  // 4. Resolve Stage Factor
  const stageConfig = STAGE_MULTIPLIERS[input.stage] || STAGE_MULTIPLIERS.FULL_CONSTRUCTION;
  const stageMultiplier = stageConfig.multiplier;
  const relevantCategories = stageConfig.relevantCategories;

  // 5. Base Per Sq.Ft Rate before category overrides
  const globalBaseRate = GLOBAL_BASE_RATES[input.globalQuality] || GLOBAL_BASE_RATES.STANDARD;
  const unadjustedTotal = sqFt * globalBaseRate * locationMultiplier * propertyMultiplier * floorMultiplier * stageMultiplier;

  // 6. Compute each of the 13 categories with overrides and exclusions
  const excludedSet = new Set(input.excludedCategories || []);
  const overrides = input.categoryOverrides || {};

  const categoryKeys: ConstructionCategoryKey[] = [
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

  let rawTotalCost = 0;
  const categoryItems: ConstructionCategoryItem[] = [];

  categoryKeys.forEach((key) => {
    const config = CATEGORY_BASE_CONFIG[key];
    const isStageRelevant = relevantCategories.includes(key);
    const isExcluded = excludedSet.has(key) || !isStageRelevant;

    const hasOverride = overrides[key] !== undefined && overrides[key] !== input.globalQuality;
    const effectiveQuality: ConstructionQualityTier = overrides[key] || input.globalQuality;
    const spec = config.specs[effectiveQuality];

    // Category base budget share in standard full build
    const categoryBaseCost = unadjustedTotal * (config.weightPercentage / 100);
    // Relative multiplier based on effective quality
    const qualityScale = spec.rateMultiplier / config.specs[input.globalQuality].rateMultiplier;

    const cost = isExcluded ? 0 : Math.round(categoryBaseCost * qualityScale);
    if (!isExcluded) {
      rawTotalCost += cost;
    }

    const quantity = config.quantityFormula(sqFt, effectiveQuality);

    categoryItems.push({
      key,
      name: config.name,
      iconName: config.iconName,
      quantity,
      unit: config.unit,
      specification: spec.label,
      quality: effectiveQuality,
      cost,
      percentage: 0, // will compute below
      isDeliverable: config.isDeliverable,
      categorySlug: config.categorySlug,
      recommendedProductSlug: config.recommendedProductSlug,
      isExcluded,
      hasOverride
    });
  });

  // 7. Add Advanced Extra Civil Options if present
  let additionalCost = 0;
  if (input.advancedDetails?.additionalInclusions?.compoundWall) additionalCost += 120000;
  if (input.advancedDetails?.additionalInclusions?.sumpAndTank) additionalCost += 95000;
  if (input.advancedDetails?.additionalInclusions?.rooftopSolar) additionalCost += 75000;
  if (input.advancedDetails?.additionalInclusions?.falseCeiling) additionalCost += Math.round(sqFt * 85);

  const totalEstimatedCost = rawTotalCost + additionalCost;
  const costPerSqFt = Math.round(totalEstimatedCost / (sqFt || 1));

  // Compute percentage share for each category
  categoryItems.forEach((item) => {
    item.percentage = totalEstimatedCost > 0 ? +((item.cost / totalEstimatedCost) * 100).toFixed(1) : 0;
  });

  // 8. Cost Split: 62% Materials, 28% Labour, 10% Architecture & Approvals
  const materialCost = Math.round(totalEstimatedCost * 0.62);
  const labourCost = Math.round(totalEstimatedCost * 0.28);
  const architecturalCost = Math.max(0, totalEstimatedCost - materialCost - labourCost);

  // 9. SVG Chart Segments (Only included categories with cost > 0)
  const chartData: ConstructionCostChartSegment[] = categoryItems
    .filter((cat) => !cat.isExcluded && cat.cost > 0)
    .map((cat) => ({
      key: cat.key,
      name: cat.name,
      amount: cat.cost,
      percentage: cat.percentage,
      color: CATEGORY_BASE_CONFIG[cat.key].color,
      isDeliverable: cat.isDeliverable
    }));

  const categoriesIncludedCount = categoryItems.filter((c) => !c.isExcluded).length;
  const deliverableCategoriesCount = categoryItems.filter((c) => !c.isExcluded && c.isDeliverable).length;

  return {
    summary: {
      builtUpAreaSqFt: sqFt,
      state: input.state,
      city: input.city,
      propertyType: input.propertyType,
      floors: input.floors,
      stage: input.stage,
      globalQuality: input.globalQuality,
      totalEstimatedCost,
      costPerSqFt,
      materialCost,
      labourCost,
      architecturalCost,
      categoriesIncludedCount,
      deliverableCategoriesCount,
      currency: 'INR'
    },
    categories: categoryItems,
    chartData,
    calculationTimestamp: new Date().toISOString()
  };
}

