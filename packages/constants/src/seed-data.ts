import { Product, KnowledgeArticle, FaqItem } from '@buildora/types';

export const SEED_PRODUCTS: Product[] = [
  // 1. Cement & Concrete
  {
    id: 'prod-cem-1',
    name: 'UltraTech Super Cement (PPC)',
    slug: 'ultratech-super-cement-ppc-50kg',
    sku: 'CEM-ULT-PPC-50KG',
    brand: 'UltraTech Cement',
    brandSlug: 'ultratech',
    category: 'Cement & Concrete',
    categorySlug: 'cement-concrete',
    subcategory: 'PPC Portland Pozzolana',
    subcategorySlug: 'ppc-cement',
    description: 'UltraTech Super is a premium blended Portland Pozzolana Cement engineered with micro-fine particles providing exceptional impermeability, high early strength, and protection against chemical attacks in foundations and RCC structures.',
    shortDescription: 'Premium PPC cement with micro-fine particles for damp-proof construction.',
    images: [
      'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80'
    ],
    price: 395,
    mrp: 440,
    discount: 10,
    unit: '50 kg Bag',
    packSize: '50 Kilograms',
    gstRate: 28,
    rating: 4.8,
    reviewCount: 342,
    inStock: true,
    stockCount: 1500,
    isBulkEligible: true,
    bulkPricing: [
      { minQuantity: 20, discountPercentage: 3, unitPrice: 383 },
      { minQuantity: 50, discountPercentage: 5, unitPrice: 375 },
      { minQuantity: 100, discountPercentage: 8, unitPrice: 363 }
    ],
    variants: [
      { id: 'v-cem-1-1', sku: 'CEM-ULT-PPC-50KG', name: '50 kg Bag', attributes: { 'Weight': '50 kg' }, price: 395, mrp: 440, stock: 1500, inStock: true }
    ],
    specifications: {
      'Grade': 'PPC (IS 1489 Part 1)',
      'Bag Type': 'HDPE Laminated Bag',
      'Compressive Strength (28 Days)': 'Min 33 MPa (Typical 53+ MPa)',
      'Setting Time (Initial)': 'Min 30 minutes',
      'Setting Time (Final)': 'Max 600 minutes',
      'Country of Origin': 'India'
    },
    categoryAttributes: {
      cementType: 'PPC',
      bagWeight: '50 kg',
      grade: 'Pozzolana Blended'
    },
    applications: ['RCC Roofing & Slabs', 'Foundation Footings', 'External Plastering', 'Brick Masonry'],
    installationTips: ['Store on wooden pallets 150mm above floor level away from moist walls', 'Use within 90 days of manufacturing'],
    safetyInstructions: ['Wear dust respirator mask and rubber hand gloves while unloading and mixing'],
    warranty: 'Manufacturer Fresh Stock Guarantee (Under 30 days from packing)',
    certifications: ['ISI Certified (IS 1489 Part 1)', 'ISO 9001:2015'],
    deliverySpeedAvailable: ['ASAP_60', 'EXPRESS_90', 'SCHEDULED', 'NEXT_DAY'],
    isFeatured: true,
    isBestSeller: true,
    isTrending: true
  },
  {
    id: 'prod-cem-2',
    name: 'UltraTech Weather Plus Waterproof Cement',
    slug: 'ultratech-weather-plus-waterproof-cement-50kg',
    sku: 'CEM-ULT-WTR-50KG',
    brand: 'UltraTech Cement',
    brandSlug: 'ultratech',
    category: 'Cement & Concrete',
    categorySlug: 'cement-concrete',
    subcategory: 'PPC Portland Pozzolana',
    subcategorySlug: 'ppc-cement',
    description: 'Specially formulated water-repellent cement containing active organo-silicon micro-compounds that prevent moisture seepage and efflorescence from Day 1 of construction.',
    shortDescription: 'Active water-repellent cement for waterproof roofing and basements.',
    images: [
      'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=800&q=80'
    ],
    price: 435,
    mrp: 480,
    discount: 9,
    unit: '50 kg Bag',
    packSize: '50 Kilograms',
    gstRate: 28,
    rating: 4.9,
    reviewCount: 188,
    inStock: true,
    stockCount: 800,
    isBulkEligible: true,
    bulkPricing: [
      { minQuantity: 25, discountPercentage: 4, unitPrice: 417 },
      { minQuantity: 50, discountPercentage: 7, unitPrice: 404 }
    ],
    specifications: {
      'Water Permeability': 'Up to 50% lower than normal cement',
      'Packaging': 'Tamper-Proof Laminated Poly Pack',
      'Standard': 'IS 1489 Compliant with water repellent admixtures'
    },
    applications: ['Basement Retaining Walls', 'Terrace Slabs', 'Water Tanks & Bathrooms'],
    deliverySpeedAvailable: ['EXPRESS_90', 'SCHEDULED', 'NEXT_DAY'],
    isDealOfTheDay: true
  },

  // 2. Tiling & Adhesives
  {
    id: 'prod-tile-1',
    name: 'Kajaria Double Charge Glazed Vitrified Tiles (2x2 ft)',
    slug: 'kajaria-double-charge-vitrified-tiles-600x600',
    sku: 'TIL-KAJ-DC-600',
    brand: 'Kajaria Ceramics',
    brandSlug: 'kajaria',
    category: 'Tiling & Tile Adhesives',
    categorySlug: 'tiling-tile-adhesives',
    subcategory: 'Vitrified Floor Tiles',
    subcategorySlug: 'vitrified-floor-tiles',
    description: 'High gloss double charge vitrified porcelain floor tile with 3-4mm top design layer offering exceptional wear resistance, stain repellency, and zero porosity for living rooms and commercial foyers.',
    shortDescription: 'Mirror-finish double charge vitrified tiles (600x600 mm).',
    images: [
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80'
    ],
    price: 880,
    mrp: 1100,
    discount: 20,
    unit: 'Box (4 Tiles / 15.5 Sq.ft)',
    packSize: '4 Tiles per Box',
    gstRate: 18,
    rating: 4.7,
    reviewCount: 94,
    inStock: true,
    stockCount: 450,
    isBulkEligible: true,
    bulkPricing: [
      { minQuantity: 15, discountPercentage: 6, unitPrice: 827 },
      { minQuantity: 50, discountPercentage: 10, unitPrice: 792 }
    ],
    specifications: {
      'Tile Dimensions': '600 mm x 600 mm (2 ft x 2 ft)',
      'Thickness': '9.5 mm',
      'Surface Finish': 'Nano Polished Ultra Gloss',
      'Coverage per Box': '15.5 sq.ft (1.44 sq.m)',
      'Water Absorption': '< 0.05%'
    },
    applications: ['Living Rooms', 'Bedrooms', 'Office Spaces', 'Retail Showrooms'],
    deliverySpeedAvailable: ['EXPRESS_90', 'SCHEDULED', 'NEXT_DAY'],
    isFeatured: true
  },
  {
    id: 'prod-tile-2',
    name: 'Roff T01 Tile Bonder Polymer Adhesive (20 kg)',
    slug: 'roff-t01-tile-bonder-adhesive-20kg',
    sku: 'TIL-ROF-T01-20KG',
    brand: 'Pidilite (Fevicol & Dr. Fixit)',
    brandSlug: 'pidilite',
    category: 'Tiling & Tile Adhesives',
    categorySlug: 'tiling-tile-adhesives',
    subcategory: 'Polymer Tile Adhesives',
    subcategorySlug: 'tile-adhesives',
    description: 'Ready-to-use polymer-modified cementitious tile adhesive for fixing ceramic, terracotta, and vitrified tiles on internal floors and masonry walls with sag resistance.',
    shortDescription: 'Heavy-duty polymer-modified tile adhesive for floor and wall tiles.',
    images: [
      'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80'
    ],
    price: 360,
    mrp: 420,
    discount: 14,
    unit: '20 kg Bag',
    packSize: '20 kg',
    gstRate: 18,
    rating: 4.8,
    reviewCount: 162,
    inStock: true,
    stockCount: 600,
    isBulkEligible: true,
    bulkPricing: [
      { minQuantity: 10, discountPercentage: 5, unitPrice: 342 },
      { minQuantity: 30, discountPercentage: 8, unitPrice: 331 }
    ],
    specifications: {
      'Coverage': 'Approx 45-50 sq.ft at 3mm bed thickness',
      'Pot Life': 'Approx 2 hours',
      'Open Time': 'Approx 20 minutes',
      'Standard': 'IS 15477 : 2019 Type 1'
    },
    deliverySpeedAvailable: ['ASAP_60', 'EXPRESS_90', 'SCHEDULED', 'NEXT_DAY'],
    isBestSeller: true
  },

  // 3. Plywood, MDF & HDHMR
  {
    id: 'prod-ply-1',
    name: 'Greenply Club BWP Marine Grade Plywood (19mm, 8x4 ft)',
    slug: 'greenply-club-bwp-marine-plywood-19mm-8x4',
    sku: 'PLY-GRE-BWP-19MM',
    brand: 'Greenply',
    brandSlug: 'greenply',
    category: 'Plywood, MDF & HDHMR',
    categorySlug: 'plywood-mdf-hdhmr',
    subcategory: 'BWP Marine Grade Plywood',
    subcategorySlug: 'bwp-marine-plywood',
    description: 'Green Club Plywood is made from select hardwood veneers bonded with unextended phenol formaldehyde resin under high temperature and hydraulic pressure. Calibrated to precision thickness, 100% borer and termite proof with 300% lifetime guarantee.',
    shortDescription: 'Calibrated boiling waterproof marine plywood for kitchens and luxury wardrobes.',
    images: [
      'https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?auto=format&fit=crop&w=800&q=80'
    ],
    price: 3150,
    mrp: 3600,
    discount: 12,
    unit: 'Sheet (8x4 ft)',
    packSize: '32 Sq.ft Sheet',
    gstRate: 18,
    rating: 4.9,
    reviewCount: 78,
    inStock: true,
    stockCount: 220,
    isBulkEligible: true,
    bulkPricing: [
      { minQuantity: 5, discountPercentage: 4, unitPrice: 3024 },
      { minQuantity: 15, discountPercentage: 7, unitPrice: 2929 }
    ],
    specifications: {
      'Dimensions': '2440 mm x 1220 mm (8 ft x 4 ft)',
      'Thickness': '19 mm',
      'Grade': 'IS 710 BWP Marine',
      'Glue Shear Strength': '> 1450 N',
      'Preservative Treatment': 'Borer, Termite & Fungi Proof with Microbe Shield'
    },
    applications: ['Modular Kitchen Cabinets', 'Bathroom Vanities', 'Heavy-Load Wardrobes', 'Wall Paneling'],
    deliverySpeedAvailable: ['EXPRESS_90', 'SCHEDULED', 'NEXT_DAY'],
    isFeatured: true
  },
  {
    id: 'prod-ply-2',
    name: 'Action TESA HDHMR Moisture Resistant Board (18mm, 8x4 ft)',
    slug: 'action-tesa-hdhmr-moisture-resistant-18mm',
    sku: 'PLY-TES-HDHMR-18MM',
    brand: 'Greenply',
    brandSlug: 'greenply',
    category: 'Plywood, MDF & HDHMR',
    categorySlug: 'plywood-mdf-hdhmr',
    subcategory: 'HDHMR Moisture Proof Boards',
    subcategorySlug: 'hdhmr-boards',
    description: 'High Density High Moisture Resistance (HDHMR) solid core board engineered with German wood technology, offering ultra-smooth finish for routering, CNC carving, and acrylic lamination.',
    shortDescription: 'High density moisture resistant board for CNC routing and modern cabinetry.',
    images: [
      'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80'
    ],
    price: 2180,
    mrp: 2450,
    discount: 11,
    unit: 'Sheet (8x4 ft)',
    packSize: '32 Sq.ft Sheet',
    gstRate: 18,
    rating: 4.8,
    reviewCount: 112,
    inStock: true,
    stockCount: 310,
    isBulkEligible: true,
    bulkPricing: [
      { minQuantity: 10, discountPercentage: 5, unitPrice: 2071 }
    ],
    specifications: {
      'Density': '> 850 kg/m³',
      'Thickness': '18 mm',
      'Internal Bond Strength': '> 0.85 N/mm²',
      'Surface': 'Sanded Ultra-Smooth'
    },
    deliverySpeedAvailable: ['SCHEDULED', 'NEXT_DAY']
  },

  // 4. Adhesives
  {
    id: 'prod-adh-1',
    name: 'Fevicol Marine Waterproof Wood Adhesive (5 kg)',
    slug: 'fevicol-marine-waterproof-wood-adhesive-5kg',
    sku: 'ADH-FEV-MAR-5KG',
    brand: 'Pidilite (Fevicol & Dr. Fixit)',
    brandSlug: 'pidilite',
    category: 'Adhesives',
    categorySlug: 'adhesives',
    subcategory: 'Fast Setting Marine Adhesives',
    subcategorySlug: 'fast-setting-marine',
    description: 'Fevicol Marine is a specialized synthetic resin adhesive providing waterproof bond that withstands 48 hours of continuous boiling water and 7 days of cold water immersion.',
    shortDescription: 'Boiling waterproof synthetic resin adhesive for marine plywood furniture.',
    images: [
      'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80'
    ],
    price: 1390,
    mrp: 1560,
    discount: 11,
    unit: '5 kg Bucket',
    packSize: '5 Kilograms',
    gstRate: 18,
    rating: 4.9,
    reviewCount: 230,
    inStock: true,
    stockCount: 500,
    isBulkEligible: true,
    bulkPricing: [
      { minQuantity: 4, discountPercentage: 4, unitPrice: 1334 }
    ],
    specifications: {
      'Setting Time': '4 to 6 hours',
      'Water Resistance': 'Boiling water proof (IS 4835)',
      'Spread Coverage': 'Approx 45 sq.ft per kg'
    },
    deliverySpeedAvailable: ['ASAP_60', 'EXPRESS_90', 'SCHEDULED', 'NEXT_DAY'],
    isBestSeller: true
  },

  // 5. Waterproofing
  {
    id: 'prod-wat-1',
    name: 'Dr. Fixit 101 LW+ Integral Liquid Waterproofing Compound (5 Litre)',
    slug: 'dr-fixit-101-lw-plus-integral-waterproofing-5l',
    sku: 'WAT-FIX-101LW-5L',
    brand: 'Pidilite (Fevicol & Dr. Fixit)',
    brandSlug: 'pidilite',
    category: 'Waterproofing',
    categorySlug: 'waterproofing',
    subcategory: 'Integral Cement Waterproofing',
    subcategorySlug: 'integral-cement-waterproofing',
    description: 'Specially engineered liquid integral waterproofing compound composed of surface active plasticising agents and corrosion-inhibiting polymers to be mixed with cement mortar and concrete.',
    shortDescription: 'Integral liquid waterproofing additive for plaster, mortar, and concrete.',
    images: [
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80'
    ],
    price: 740,
    mrp: 870,
    discount: 15,
    unit: '5 Litre Can',
    packSize: '5 Litres',
    gstRate: 18,
    rating: 4.9,
    reviewCount: 410,
    inStock: true,
    stockCount: 750,
    isBulkEligible: true,
    bulkPricing: [
      { minQuantity: 4, discountPercentage: 5, unitPrice: 703 },
      { minQuantity: 10, discountPercentage: 9, unitPrice: 673 }
    ],
    specifications: {
      'Dosage': '200 ml per 50 kg bag of cement',
      'Compatibility': 'All standard Portland cements',
      'Standard': 'IS 2645 : 2003'
    },
    deliverySpeedAvailable: ['ASAP_60', 'EXPRESS_90', 'SCHEDULED', 'NEXT_DAY'],
    isBestSeller: true
  },

  // 6. Painting & Finishes
  {
    id: 'prod-pnt-1',
    name: 'Asian Paints Apex Ultima Weatherproof Exterior Emulsion (20 Litre)',
    slug: 'asian-paints-apex-ultima-exterior-emulsion-20l',
    sku: 'PNT-AP-ULT-20L',
    brand: 'Asian Paints',
    brandSlug: 'asian-paints',
    category: 'Painting & Finishes',
    categorySlug: 'painting-finishes',
    subcategory: 'Exterior Weatherproof Paints',
    subcategorySlug: 'exterior-weatherproof',
    description: 'High performance water-based exterior wall finish with silicone additives and dirt-pick-up resistance, protecting exterior walls against harsh sun, heavy rainfall, algae, and fungal attacks for 7 years.',
    shortDescription: '7-year warranty anti-algae silicone exterior wall emulsion (Brilliant White).',
    images: [
      'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=800&q=80'
    ],
    price: 6850,
    mrp: 7800,
    discount: 12,
    unit: '20 Litre Bucket',
    packSize: '20 Litres',
    gstRate: 18,
    rating: 4.8,
    reviewCount: 156,
    inStock: true,
    stockCount: 180,
    isBulkEligible: true,
    bulkPricing: [
      { minQuantity: 3, discountPercentage: 5, unitPrice: 6507 }
    ],
    specifications: {
      'Finish': 'Rich Sheen',
      'Coverage': '55 - 60 sq.ft / Litre for 2 coats',
      'Drying Time': '30 minutes to touch',
      'Warranty': '7 Year Performance Warranty'
    },
    deliverySpeedAvailable: ['EXPRESS_90', 'SCHEDULED', 'NEXT_DAY'],
    isFeatured: true
  },

  // 11. Wires & Electrical
  {
    id: 'prod-elec-1',
    name: 'Havells Life Line Plus S3 FRLS Single Core Copper Wire (2.5 sq mm, 90m)',
    slug: 'havells-lifeline-plus-frls-copper-wire-2-5sqmm-90m',
    sku: 'ELE-HAV-2.5-RED',
    brand: 'Havells',
    brandSlug: 'havells',
    category: 'Wires, MCB & Distribution Boards',
    categorySlug: 'wires-mcb-distribution-boards',
    subcategory: 'FRLS Insulated Copper Wires (90m)',
    subcategorySlug: 'frls-copper-wires',
    description: 'Engineered with 100% pure electrolytic high-conductivity grade copper with specially formulated Flame Retardant Low Smoke (FRLS) insulation for high-load home circuits and air conditioners.',
    shortDescription: '100% electrolytic oxygen-free copper wire with S3 safety insulation.',
    images: [
      'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&w=800&q=80'
    ],
    price: 2680,
    mrp: 3150,
    discount: 15,
    unit: 'Coil (90 Metres)',
    packSize: '90 Metres',
    gstRate: 18,
    rating: 4.9,
    reviewCount: 295,
    inStock: true,
    stockCount: 600,
    isBulkEligible: true,
    bulkPricing: [
      { minQuantity: 5, discountPercentage: 4, unitPrice: 2572 },
      { minQuantity: 20, discountPercentage: 8, unitPrice: 2465 }
    ],
    specifications: {
      'Conductor Size': '2.5 sq.mm',
      'Current Carrying Capacity': '24 Amperes',
      'Length': '90 Metres Box Coil',
      'Insulation': 'FRLS Grade PVC Compound',
      'Certification': 'IS 694 Certified with CE Mark'
    },
    applications: ['Air Conditioning Points', 'Kitchen Power Sockets', 'Geyser Wiring', 'Inverter Lines'],
    deliverySpeedAvailable: ['ASAP_60', 'EXPRESS_90', 'SCHEDULED', 'NEXT_DAY'],
    isBestSeller: true,
    isFeatured: true
  },

  // 16. CPVC Pipes & Plumbing
  {
    id: 'prod-plumb-1',
    name: 'Astral CPVC PRO SDR 11 Hot & Cold Water Pipe (1 Inch, 3 Metres)',
    slug: 'astral-cpvc-pro-sdr11-pipe-1inch-3m',
    sku: 'PLU-AST-CPVC-1IN-3M',
    brand: 'Astral Pipes',
    brandSlug: 'astral',
    category: 'CPVC Pipes & Overhead Tanks',
    categorySlug: 'cpvc-pipes-overhead-tanks',
    subcategory: 'SDR 11 CPVC Hot & Cold Water Pipes',
    subcategorySlug: 'cpvc-pipes-overhead-tanks',
    description: 'Astral CPVC PRO pipes are manufactured from specialty chlorinated polyvinyl chloride compound conforming to ASTM D2846 with high pressure rating (up to 28 bar) for both hot and cold potable water plumbing.',
    shortDescription: 'Lead-free SDR 11 CPVC plumbing pipe with NSF certification.',
    images: [
      'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=800&q=80'
    ],
    price: 385,
    mrp: 450,
    discount: 14,
    unit: 'Pipe (3 Metres / 10 ft)',
    packSize: '3 Metres Length',
    gstRate: 18,
    rating: 4.8,
    reviewCount: 180,
    inStock: true,
    stockCount: 900,
    isBulkEligible: true,
    bulkPricing: [
      { minQuantity: 10, discountPercentage: 5, unitPrice: 365 },
      { minQuantity: 30, discountPercentage: 9, unitPrice: 350 }
    ],
    specifications: {
      'Nominal Diameter': '25 mm (1 Inch)',
      'Pressure Class': 'SDR 11 (28.1 kg/cm² at 23°C)',
      'Max Operating Temp': 'Up to 93°C',
      'Certification': 'NSF-61 and BIS (IS 15778)'
    },
    deliverySpeedAvailable: ['ASAP_60', 'EXPRESS_90', 'SCHEDULED', 'NEXT_DAY'],
    isBestSeller: true,
    isNewLaunch: true
  },

  // 20. Power Tools
  {
    id: 'prod-tool-1',
    name: 'Bosch GBH 2-26 DRE Professional Rotary Hammer Drill (800W)',
    slug: 'bosch-gbh-2-26-dre-rotary-hammer-drill-800w',
    sku: 'TOL-BOS-GBH2-26',
    brand: 'Bosch Power Tools',
    brandSlug: 'bosch',
    category: 'Power Tools & Accessories',
    categorySlug: 'power-tools-accessories',
    subcategory: 'Rotary Hammer Drills (800W)',
    subcategorySlug: 'rotary-hammers',
    description: 'The contractor benchmark 800W SDS-plus rotary hammer with 2.7 Joules impact energy, variable speed trigger, and 3-mode operation (drilling, hammer drilling, and chiseling).',
    shortDescription: 'Heavy-duty 800W 3-mode SDS-plus rotary hammer for reinforced concrete.',
    images: [
      'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80'
    ],
    price: 7850,
    mrp: 9600,
    discount: 18,
    unit: 'Unit (with Carrying Case)',
    packSize: '1 Complete Kit',
    gstRate: 18,
    rating: 4.9,
    reviewCount: 310,
    inStock: true,
    stockCount: 120,
    isBulkEligible: false,
    specifications: {
      'Rated Power': '800 Watts',
      'Impact Energy': '2.7 Joules',
      'Impact Rate': '0 - 4000 bpm',
      'Drilling Dia in Concrete': '4 - 26 mm',
      'Tool Holder': 'SDS-plus with rotation stop'
    },
    warranty: '1 Year Bosch India Official Warranty',
    deliverySpeedAvailable: ['ASAP_60', 'EXPRESS_90', 'SCHEDULED', 'NEXT_DAY'],
    isFeatured: true,
    isNewLaunch: true
  },

  // 10. Door Locks & Hardware
  {
    id: 'prod-lock-1',
    name: 'Godrej Nav-Tal 8 Levers Brass Padlock (Heavy Duty)',
    slug: 'godrej-nav-tal-8-levers-brass-padlock',
    sku: 'LCK-GOD-NAV-8L',
    brand: 'Godrej Locks',
    brandSlug: 'godrej',
    category: 'Door Locks & Hardware',
    categorySlug: 'door-locks-hardware',
    subcategory: 'Main Door Mortise Handle Sets',
    subcategorySlug: 'mortise-locks',
    description: 'Timeless solid brass construction with 8 high-precision brass levers and hardened steel electroplated shackle resistant to hacksaw attacks and corrosion.',
    shortDescription: 'Classic 8-lever solid brass padlock with 3 keys.',
    images: [
      'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=800&q=80'
    ],
    price: 640,
    mrp: 750,
    discount: 15,
    unit: 'Unit (3 Brass Keys)',
    packSize: '1 Unit',
    gstRate: 18,
    rating: 4.9,
    reviewCount: 420,
    inStock: true,
    stockCount: 850,
    isBulkEligible: true,
    specifications: {
      'Material': 'Solid Forged Brass Body',
      'Shackle Material': 'Hardened Electroplated Steel',
      'Levers': '8 Brass Levers'
    },
    deliverySpeedAvailable: ['ASAP_60', 'EXPRESS_90', 'SCHEDULED', 'NEXT_DAY'],
    isBestSeller: true,
    isNewLaunch: true
  },

  // 19. Water Storage Tanks
  {
    id: 'prod-tank-1',
    name: 'Supreme Silpulin 4-Layer Anti-Bacterial Overhead Water Tank (1000 Litres)',
    slug: 'supreme-silpulin-4-layer-overhead-water-tank-1000l',
    sku: 'TNK-SUP-1000L-4L',
    brand: 'Supreme Industries',
    brandSlug: 'supreme',
    category: 'Water Storage Tanks',
    categorySlug: 'water-storage-tanks',
    subcategory: '1000L 4-Layer Anti-Bacterial Tanks',
    subcategorySlug: '1000l-tanks',
    description: '4-layer virgin food-grade polymer tank with Microban anti-bacterial inner layer, carbon black UV barrier, and titanium dioxide reflective insulation keeping water clean and cool.',
    shortDescription: '10-year warranty 4-layer UV-stabilized food-grade water tank.',
    images: [
      'https://images.unsplash.com/photo-1521747116042-5a810fda9664?auto=format&fit=crop&w=800&q=80'
    ],
    price: 7200,
    mrp: 8500,
    discount: 15,
    unit: 'Unit (1000 Litres)',
    packSize: '1000L Vertical Tank',
    gstRate: 18,
    rating: 4.8,
    reviewCount: 87,
    inStock: true,
    stockCount: 60,
    isBulkEligible: true,
    specifications: {
      'Capacity': '1000 Litres',
      'Layer Construction': '4 Layers (Anti-Microbial + Foam Insulation + UV Barrier + Weather Layer)',
      'Dimensions': 'Height 1320 mm x Diameter 1050 mm',
      'Warranty': '10 Years Replacement Warranty'
    },
    deliverySpeedAvailable: ['SCHEDULED', 'NEXT_DAY'],
    isNewLaunch: true
  },

  // 20. New Launches - Cabinet Hardware
  {
    id: 'prod-cabhw-1',
    name: 'Hafele Metalla 304 Soft-Close Hydraulic Auto Concealed Hinges (Full Overlay, Pack of 2)',
    slug: 'hafele-metalla-304-soft-close-hydraulic-hinges',
    sku: 'HNG-HAF-MET-304-FO',
    brand: 'Godrej Locks',
    brandSlug: 'godrej',
    category: 'Hinges, Channels & Handles',
    categorySlug: 'hinges-channels-handles',
    subcategory: 'Soft-Close Auto Hinges (SS 304)',
    subcategorySlug: 'auto-hinges',
    description: 'German engineered SS 304 grade soft-close hydraulic clip-on hinges with 110-degree opening angle and integrated silent damping cylinder.',
    shortDescription: 'SS 304 rust-proof silent soft-close hydraulic cabinet hinges.',
    images: [
      'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80'
    ],
    price: 385,
    mrp: 480,
    discount: 20,
    unit: 'Pair (2 Pcs)',
    packSize: 'Pack of 2 Hinges with Mounting Plates & Screws',
    gstRate: 18,
    rating: 4.9,
    reviewCount: 114,
    inStock: true,
    stockCount: 450,
    isBulkEligible: true,
    deliverySpeedAvailable: ['ASAP_60', 'EXPRESS_90', 'SCHEDULED'],
    isFeatured: true,
    isNewLaunch: true,
    specifications: {
      'Material': 'Stainless Steel 304 Grade',
      'Crank Type': 'Full Overlay (0 Crank)',
      'Opening Angle': '110 Degrees',
      'Cycle Testing': 'Passed 50,000 Silent Cycles'
    }
  },
  {
    id: 'prod-cabhw-2',
    name: 'Ebco Heavy Duty Telescopic Ball Bearing Drawer Slides (45kg Capacity, 18 Inch / 450mm)',
    slug: 'ebco-heavy-duty-telescopic-drawer-slides-18-inch',
    sku: 'CHN-EBC-45KG-18IN',
    brand: 'Godrej Locks',
    brandSlug: 'godrej',
    category: 'Hinges, Channels & Handles',
    categorySlug: 'hinges-channels-handles',
    subcategory: 'Telescopic Drawer Channels',
    subcategorySlug: 'telescopic-channels',
    description: 'Full-extension triple-fold zinc-plated cold rolled steel telescopic channels with high-grade solid carbon steel ball bearings.',
    shortDescription: '45kg rated triple-extension ball bearing drawer slide channels.',
    images: [
      'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80'
    ],
    price: 620,
    mrp: 750,
    discount: 17,
    unit: 'Set (Pair for 1 Drawer)',
    packSize: 'Left & Right Slide (18 Inch / 450mm)',
    gstRate: 18,
    rating: 4.8,
    reviewCount: 92,
    inStock: true,
    stockCount: 320,
    isBulkEligible: true,
    deliverySpeedAvailable: ['ASAP_60', 'EXPRESS_90', 'SCHEDULED'],
    isNewLaunch: true,
    specifications: {
      'Length': '450 mm (18 Inch)',
      'Load Capacity': '45 kg Dynamic Load',
      'Extension': 'Full 100% Extension',
      'Finish': 'Electrophoretic Zinc Plated'
    }
  },

  // 21. New Launches - Kitchen Systems & Hardware
  {
    id: 'prod-kithw-1',
    name: 'Godrej Kitchen SS 304 Heavy Duty Modular Wire Plain Basket (17x20x6 Inch)',
    slug: 'godrej-kitchen-ss-304-wire-plain-basket-17x20x6',
    sku: 'KIT-GDJ-BSK-172006',
    brand: 'Godrej Locks',
    brandSlug: 'godrej',
    category: 'Kitchen Systems & Accessories',
    categorySlug: 'kitchen-systems-accessories',
    subcategory: 'SS 304 Modular Wire Baskets',
    subcategorySlug: 'wire-baskets',
    description: 'Precision argon-welded pure SS 304 stainless steel kitchen wire basket designed for standard 450mm base modular carcasses.',
    shortDescription: 'Lifetime rust-free SS 304 modular kitchen pullout basket.',
    images: [
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80'
    ],
    price: 1850,
    mrp: 2300,
    discount: 20,
    unit: 'Unit (1 Basket)',
    packSize: '1 Basket with Universal Slide Clamps',
    gstRate: 18,
    rating: 4.8,
    reviewCount: 78,
    inStock: true,
    stockCount: 160,
    isBulkEligible: true,
    deliverySpeedAvailable: ['ASAP_60', 'EXPRESS_90', 'SCHEDULED'],
    isFeatured: true,
    isNewLaunch: true,
    specifications: {
      'Dimensions': 'Width 430mm x Depth 500mm x Height 150mm (17x20x6 Inch)',
      'Grade': 'SS 304 Nickel-Chromium Stainless Steel',
      'Wire Gauge': '6mm Outer Frame, 3mm Inner Wire Grid'
    }
  },
  {
    id: 'prod-kithw-2',
    name: 'Hafele Matrix Box Slim Soft-Close Tandem Drawer Box System (500mm, Anthracite Grey)',
    slug: 'hafele-matrix-box-slim-soft-close-tandem-drawer-500mm',
    sku: 'KIT-HAF-MTX-500-ANT',
    brand: 'Godrej Locks',
    brandSlug: 'godrej',
    category: 'Kitchen Systems & Accessories',
    categorySlug: 'kitchen-systems-accessories',
    subcategory: 'Soft-Close Tandem Drawer Boxes',
    subcategorySlug: 'tandem-boxes',
    description: 'Ultra-thin 13mm straight double-wall metal drawer side system with synchronized rack-and-pinion undermount soft-close slides.',
    shortDescription: '13mm slim profile luxury soft-close tandem kitchen drawer box.',
    images: [
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80'
    ],
    price: 2450,
    mrp: 2990,
    discount: 18,
    unit: 'Set (Drawer Box + Runners)',
    packSize: 'Complete Set (Drawer Sides, Synchronized Runners, Back Fixings)',
    gstRate: 18,
    rating: 4.9,
    reviewCount: 63,
    inStock: true,
    stockCount: 120,
    isBulkEligible: true,
    deliverySpeedAvailable: ['ASAP_60', 'EXPRESS_90', 'SCHEDULED'],
    isNewLaunch: true,
    specifications: {
      'Slide Length': '500 mm',
      'Wall Thickness': '13 mm Slim Double Wall',
      'Weight Rating': '40 kg Dynamic Weight',
      'Damping': 'Integrated Fluid Soft-Close Mechanism'
    }
  },

  // 22. New Launches - General Hardware & Tools
  {
    id: 'prod-gentool-1',
    name: 'Stanley Short Steel Tape Rule (5m / 16ft Metric & Imperial with Tru-Zero Hook)',
    slug: 'stanley-short-steel-tape-rule-5m',
    sku: 'TLS-STA-TP-5M',
    brand: 'Bosch Power Tools',
    brandSlug: 'bosch',
    category: 'General Hardware & Tools',
    categorySlug: 'general-hardware-tools',
    subcategory: 'Measuring Tapes (5m/30m) & Spirit Levels',
    subcategorySlug: 'measuring-tools',
    description: 'High-impact yellow ABS case with polymer-coated wear-resistant spring steel blade and Tru-Zero hook for accurate internal and external measurements.',
    shortDescription: '5m jobsite measuring tape with polymer-coated durable blade.',
    images: [
      'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=800&q=80'
    ],
    price: 299,
    mrp: 399,
    discount: 25,
    unit: 'Piece',
    packSize: '1 Tape Rule (5m / 16ft)',
    gstRate: 18,
    rating: 4.8,
    reviewCount: 210,
    inStock: true,
    stockCount: 600,
    isBulkEligible: true,
    deliverySpeedAvailable: ['ASAP_60', 'EXPRESS_90', 'SCHEDULED'],
    isFeatured: true,
    isNewLaunch: true,
    specifications: {
      'Blade Length': '5 Metres (16 Feet)',
      'Blade Width': '19 mm',
      'Case Material': 'High Impact Ergonomic ABS Polymer',
      'Accuracy Class': 'Class II Metric & Imperial Dual Markings'
    }
  },
  {
    id: 'prod-gentool-2',
    name: 'Taparia Drop-Forged Steel Claw Hammer with Fiberglass Handle (450g / 16 oz)',
    slug: 'taparia-drop-forged-steel-claw-hammer-450g',
    sku: 'TLS-TAP-HAM-450G',
    brand: 'Bosch Power Tools',
    brandSlug: 'bosch',
    category: 'General Hardware & Tools',
    categorySlug: 'general-hardware-tools',
    subcategory: 'Hardened Hand Tools & Hammer Sets',
    subcategorySlug: 'hand-tools',
    description: 'Drop-forged carbon steel head hardened to 50-58 HRC with ergonomic vibration-damping fiberglass rubber-grip handle and curved claw for nail extraction.',
    shortDescription: '450g drop-forged steel claw hammer with shockproof fiberglass grip.',
    images: [
      'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=800&q=80'
    ],
    price: 445,
    mrp: 550,
    discount: 19,
    unit: 'Piece',
    packSize: '1 Claw Hammer (450 Grams)',
    gstRate: 18,
    rating: 4.7,
    reviewCount: 145,
    inStock: true,
    stockCount: 400,
    isBulkEligible: true,
    deliverySpeedAvailable: ['ASAP_60', 'EXPRESS_90', 'SCHEDULED'],
    isNewLaunch: true,
    specifications: {
      'Head Weight': '450 Grams (16 oz)',
      'Head Material': 'Drop-Forged High Carbon Steel',
      'Shaft Material': 'Solid Fiberglass Core with TPR Non-Slip Rubber Grip',
      'Hardness': 'Induction Hardened Striking Face 50-58 HRC'
    }
  },

  // 23. New Launches - Bathroom Renovation Materials
  {
    id: 'prod-bathreno-1',
    name: 'Jaquar Dual-Flush Concealed Water Cistern with Chrome Actuator Flush Plate',
    slug: 'jaquar-dual-flush-concealed-water-cistern',
    sku: 'SAN-JAQ-CST-DF',
    brand: 'Astral Pipes',
    brandSlug: 'astral',
    category: 'Bathroom Renovation Materials',
    categorySlug: 'bathroom-renovation-materials',
    subcategory: 'Concealed Dual-Flush Water Cisterns',
    subcategorySlug: 'concealed-cisterns',
    description: 'High-density blow-molded 6/3L dual-flush HDPE tank with front actuation plate, condensation insulation sleeve, and silent fill hydraulic inlet valve.',
    shortDescription: 'In-wall slim concealed dual-flush water cistern with actuator plate.',
    images: [
      'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=800&q=80'
    ],
    price: 4150,
    mrp: 5200,
    discount: 20,
    unit: 'Complete Set',
    packSize: 'Cistern Tank + Chrome Flush Plate + Wall Brackets',
    gstRate: 18,
    rating: 4.9,
    reviewCount: 88,
    inStock: true,
    stockCount: 95,
    isBulkEligible: true,
    deliverySpeedAvailable: ['ASAP_60', 'EXPRESS_90', 'SCHEDULED'],
    isFeatured: true,
    isNewLaunch: true,
    specifications: {
      'Tank Capacity': '6 / 3 Litre Dual Flush Operation',
      'Installation': 'Brick / Drywall In-Wall Concealed Mount (80mm Slim Frame)',
      'Actuator Plate': 'Dual-Button Chrome Finish Included',
      'Operating Pressure': '0.5 to 10 Bar Water Pressure'
    }
  },
  {
    id: 'prod-bathreno-2',
    name: 'Chilly SS 304 Anti-Cockroach Linear Floor Drain Channel with Tile-Insert Grate (600mm)',
    slug: 'chilly-ss-304-linear-floor-drain-channel-600mm',
    sku: 'SAN-CHL-FDR-600MM',
    brand: 'Astral Pipes',
    brandSlug: 'astral',
    category: 'Bathroom Renovation Materials',
    categorySlug: 'bathroom-renovation-materials',
    subcategory: 'Stainless Steel Linear Floor Drain Channels',
    subcategorySlug: 'floor-drains',
    description: 'Architectural frameless linear shower drain channel made of 1.5mm AISI 304 stainless steel with reversible tile-insert top and mechanical anti-odour trap.',
    shortDescription: '600mm stainless steel linear shower drain with anti-cockroach trap.',
    images: [
      'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=800&q=80'
    ],
    price: 1680,
    mrp: 2100,
    discount: 20,
    unit: 'Set',
    packSize: '1 Drain Channel + Reversible Grate + Odour Seal Trap',
    gstRate: 18,
    rating: 4.8,
    reviewCount: 72,
    inStock: true,
    stockCount: 140,
    isBulkEligible: true,
    deliverySpeedAvailable: ['ASAP_60', 'EXPRESS_90', 'SCHEDULED'],
    isNewLaunch: true,
    specifications: {
      'Length': '600 mm (24 Inch) x 70 mm Width',
      'Material': 'AISI 304 Electro-Polished Stainless Steel (1.5mm)',
      'Outlet Diameter': '50 mm High Flow Center Drain Outlet',
      'Grate Type': '2-in-1 Reversible Tile Insert & Brushed Satin SS'
    }
  },

  // 24. New Launches - Conduits & Piping
  {
    id: 'prod-conduit-1',
    name: 'Supreme Medium Mechanical Stress Rigid PVC Electrical Conduit Pipe (25mm, 3 Metres, Ivory)',
    slug: 'supreme-rigid-pvc-electrical-conduit-pipe-25mm',
    sku: 'CON-SUP-PVC-25MM-3M',
    brand: 'Supreme Industries',
    brandSlug: 'supreme',
    category: 'Electrical Conduits',
    categorySlug: 'electrical-conduits',
    subcategory: 'Rigid PVC Electrical Conduits (20mm/25mm)',
    subcategorySlug: 'pvc-conduits',
    description: 'Fire retardant, non-conductive, chemical resistant unplasticized PVC electrical conduit pipe certified to IS 9537 Part 3 standards for embedded concrete slab casting.',
    shortDescription: '25mm ISI rigid PVC electrical conduit pipe for concealed slab wiring.',
    images: [
      'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?auto=format&fit=crop&w=800&q=80'
    ],
    price: 115,
    mrp: 145,
    discount: 21,
    unit: 'Length (3 Metres)',
    packSize: '3 Metre Pipe (25mm Outer Diameter)',
    gstRate: 18,
    rating: 4.8,
    reviewCount: 195,
    inStock: true,
    stockCount: 1200,
    isBulkEligible: true,
    deliverySpeedAvailable: ['ASAP_60', 'EXPRESS_90', 'SCHEDULED'],
    isFeatured: true,
    isNewLaunch: true,
    specifications: {
      'Nominal Diameter': '25 mm Outer Diameter',
      'Length': '3 Metres Standard',
      'Stress Class': 'Medium Mechanical Stress (Concrete Embedded)',
      'Standard': 'IS 9537 (Part 3) Certified Fire-Retardant PVC'
    }
  },
  {
    id: 'prod-conduit-2',
    name: 'Havells 25mm 4-Way Deep PVC Circular Junction Box with Inspection Lid',
    slug: 'havells-25mm-4-way-deep-pvc-circular-junction-box',
    sku: 'CON-HAV-JBOX-25MM-4W',
    brand: 'Havells',
    brandSlug: 'havells',
    category: 'Electrical Conduits',
    categorySlug: 'electrical-conduits',
    subcategory: 'Conduit Bends & Deep Junction Boxes',
    subcategorySlug: 'conduit-accessories',
    description: 'Deep circular intersection junction box molded from heavy-duty impact-resistant PVC with 4 knockouts for 25mm conduit pipes and brass threaded screw inserts.',
    shortDescription: '25mm 4-way deep PVC junction box with lid for roof casting.',
    images: [
      'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?auto=format&fit=crop&w=800&q=80'
    ],
    price: 42,
    mrp: 55,
    discount: 24,
    unit: 'Piece',
    packSize: '1 Junction Box with Top Lid & Brass Screws',
    gstRate: 18,
    rating: 4.7,
    reviewCount: 130,
    inStock: true,
    stockCount: 850,
    isBulkEligible: true,
    deliverySpeedAvailable: ['ASAP_60', 'EXPRESS_90', 'SCHEDULED'],
    isNewLaunch: true,
    specifications: {
      'Size': '25 mm Conduits (Deep Slab Box 65mm Depth)',
      'Ways': '4-Way Intersection Entry Ports',
      'Material': 'High-Impact Flame-Retardant Unplasticized PVC'
    }
  },

  // 25. New Launches - Kitchen Sinks & Faucets
  {
    id: 'prod-sink-1',
    name: 'Franke Maris Handmade SS 304 Single Bowl Kitchen Sink with Sound Deadening Pads (24x18 Inch)',
    slug: 'franke-maris-handmade-ss-304-single-bowl-sink-24x18',
    sku: 'SNK-FRK-SS-2418',
    brand: 'Astral Pipes',
    brandSlug: 'astral',
    category: 'Kitchen Sinks & Faucets',
    categorySlug: 'kitchen-sinks-faucets',
    subcategory: 'SS 304 Handmade Single Bowl Sinks',
    subcategorySlug: 'ss-kitchen-sinks',
    description: 'Heavy 1.2mm gauge 18/10 surgical grade stainless steel handmade kitchen sink with R10 tight radius corners, deep 9-inch bowl, and under-bowl anti-condensation coating.',
    shortDescription: '1.2mm thick SS 304 handmade single bowl sink with waste coupling.',
    images: [
      'https://images.unsplash.com/photo-1588854337236-6889d631faa8?auto=format&fit=crop&w=800&q=80'
    ],
    price: 5850,
    mrp: 7500,
    discount: 22,
    unit: 'Unit',
    packSize: 'Sink Bowl + 4-Inch SS Waste Coupling + Drain Pipe Kit',
    gstRate: 18,
    rating: 4.9,
    reviewCount: 94,
    inStock: true,
    stockCount: 85,
    isBulkEligible: true,
    deliverySpeedAvailable: ['ASAP_60', 'EXPRESS_90', 'SCHEDULED'],
    isFeatured: true,
    isNewLaunch: true,
    specifications: {
      'Overall Dimensions': '610mm x 457mm x 230mm (24 x 18 x 9 Inch)',
      'Sheet Thickness': '1.2 mm Heavy Gauge (18 Gauge)',
      'Material': 'AISI 304 Grade Surgical Stainless Steel',
      'Corner Radius': 'R10 Precision Laser Welded Corners'
    }
  },
  {
    id: 'prod-sink-2',
    name: 'Kohler Purist Flexible Silicone Spout 360-Degree Swivel Kitchen Sink Mixer Tap',
    slug: 'kohler-purist-flexible-silicone-spout-sink-mixer-tap',
    sku: 'FAU-KOH-PUR-MIX',
    brand: 'Astral Pipes',
    brandSlug: 'astral',
    category: 'Kitchen Sinks & Faucets',
    categorySlug: 'kitchen-sinks-faucets',
    subcategory: 'Flexible Pull-Out Kitchen Sink Faucets',
    subcategorySlug: 'kitchen-faucets',
    description: 'Solid forged brass body finished in multi-layer mirror chrome with magnetic docking food-grade black silicone flexible gooseneck spout and dual spray aerator.',
    shortDescription: 'Flexible gooseneck silicone spout brass kitchen sink mixer tap.',
    images: [
      'https://images.unsplash.com/photo-1588854337236-6889d631faa8?auto=format&fit=crop&w=800&q=80'
    ],
    price: 3990,
    mrp: 5100,
    discount: 22,
    unit: 'Piece',
    packSize: '1 Faucet + 2 Braided SS Inlet Hoses (450mm) + Mounting Clamp',
    gstRate: 18,
    rating: 4.8,
    reviewCount: 76,
    inStock: true,
    stockCount: 110,
    isBulkEligible: true,
    deliverySpeedAvailable: ['ASAP_60', 'EXPRESS_90', 'SCHEDULED'],
    isNewLaunch: true,
    specifications: {
      'Body Material': 'Forged Virgin Brass (IS 319 Grade)',
      'Spout': '360° Omnidirectional Flexible Black Silicone Hose',
      'Cartridge': 'High-Durability 35mm Ceramic Disc Cartridge (500,000 cycles)',
      'Water Flow Modes': 'Stream & High-Pressure Rinse Spray Modes'
    }
  },

  // 26. New Launches - Home Appliances & Power Backup
  {
    id: 'prod-appliance-1',
    name: 'Luminous Zelio+ 1100 Pure Sine Wave Intelligent Home Inverter UPS (900VA / 12V)',
    slug: 'luminous-zelio-1100-pure-sine-wave-home-inverter',
    sku: 'APP-LUM-ZEL-1100',
    brand: 'Havells',
    brandSlug: 'havells',
    category: 'Home Appliances & Power Backup',
    categorySlug: 'home-appliances-power-backup',
    subcategory: 'Pure Sine Wave Inverters (1100VA)',
    subcategorySlug: 'inverters',
    description: 'India most intelligent sine wave UPS with 32-bit DSP processor, smart intuitive LCD display showing battery charge percentage and backup time in hours & minutes.',
    shortDescription: '900VA / 12V pure sine wave inverter with digital backup time display.',
    images: [
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'
    ],
    price: 6950,
    mrp: 8500,
    discount: 18,
    unit: 'Unit',
    packSize: '1 Inverter Unit with Battery Connecting Cables',
    gstRate: 18,
    rating: 4.9,
    reviewCount: 142,
    inStock: true,
    stockCount: 75,
    isBulkEligible: true,
    deliverySpeedAvailable: ['ASAP_60', 'EXPRESS_90', 'SCHEDULED'],
    isFeatured: true,
    isNewLaunch: true,
    specifications: {
      'Capacity': '900 VA / 12V DC Input',
      'Rated Power Output': '756 Watts Peak Capacity',
      'Waveform': 'Grid-Quality Pure Sine Wave Output (Safe for sensitive electronics)',
      'Display': 'Digital LCD Display (Backup Time in Hours/Mins, Battery Level %)'
    }
  },
  {
    id: 'prod-appliance-2',
    name: 'Havells Monza EC 25 Litre 5-Star Storage Electric Water Geyser with Feroglas Technology',
    slug: 'havells-monza-ec-25-litre-storage-electric-water-geyser',
    sku: 'APP-HAV-MNZ-25L',
    brand: 'Havells',
    brandSlug: 'havells',
    category: 'Home Appliances & Power Backup',
    categorySlug: 'home-appliances-power-backup',
    subcategory: 'Storage Electric Water Geysers (25L)',
    subcategorySlug: 'water-geysers',
    description: 'Feroglas-coated ultra-thick cold rolled steel tank with heavy Incoloy 800 heating element, whirlpool technology for 20% more hot water, and 8-bar pressure rating suitable for high-rise buildings.',
    shortDescription: '25L 5-star BEE rated storage water heater with Feroglas tank.',
    images: [
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'
    ],
    price: 8499,
    mrp: 11200,
    discount: 24,
    unit: 'Unit',
    packSize: '1 Water Geyser + Multi-Function Safety Valve + Wall Mount Bracket',
    gstRate: 18,
    rating: 4.8,
    reviewCount: 96,
    inStock: true,
    stockCount: 65,
    isBulkEligible: true,
    deliverySpeedAvailable: ['ASAP_60', 'EXPRESS_90', 'SCHEDULED'],
    isNewLaunch: true,
    specifications: {
      'Capacity': '25 Litres Storage Tank',
      'Energy Rating': 'BEE 5-Star Energy Efficiency (PUF Insulation)',
      'Pressure Rating': '8 Bar (Suitable for high-rise apartments up to 35 floors)',
      'Heating Element': '2000W Incoloy 800 Glass-Coated Element'
    }
  },

  // 27. New Launches - Modern Architectural Lighting
  {
    id: 'prod-light-1',
    name: 'Havells Adore 12W Round Slim Recessed LED Downlight (Warm White 3000K, Die-Cast Aluminum)',
    slug: 'havells-adore-12w-round-slim-recessed-led-downlight',
    sku: 'LGT-HAV-ADR-12W-WW',
    brand: 'Havells',
    brandSlug: 'havells',
    category: 'Lighting',
    categorySlug: 'lighting',
    subcategory: 'Slim LED Recessed Downlights',
    subcategorySlug: 'recessed-downlights',
    description: 'Ultra-slim profile recessed false ceiling downlight with high lumen efficacy of 105 lm/W, integrated surge protection up to 4kV, and glare-free opal diffuser.',
    shortDescription: '12W slim false ceiling LED downlight with 4kV surge protector.',
    images: [
      'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=800&q=80'
    ],
    price: 425,
    mrp: 575,
    discount: 26,
    unit: 'Piece',
    packSize: '1 LED Downlight with Pre-wired Driver & Spring Clips',
    gstRate: 18,
    rating: 4.8,
    reviewCount: 220,
    inStock: true,
    stockCount: 750,
    isBulkEligible: true,
    deliverySpeedAvailable: ['ASAP_60', 'EXPRESS_90', 'SCHEDULED'],
    isFeatured: true,
    isNewLaunch: true,
    specifications: {
      'Wattage': '12 Watts',
      'Color Temperature': '3000K Warm White (1260 Lumens)',
      'Ceiling Cutout': '135 mm Diameter Cutout',
      'Surge Protection': 'Up to 4.0 kV Surge Defense'
    }
  },
  {
    id: 'prod-light-2',
    name: 'Wipro Garnet 7W Trimless COB Deep Recessed Directional Spotlight (Natural White 4000K)',
    slug: 'wipro-garnet-7w-trimless-cob-deep-recessed-spotlight',
    sku: 'LGT-WIP-COB-7W-NW',
    brand: 'Havells',
    brandSlug: 'havells',
    category: 'Lighting',
    categorySlug: 'lighting',
    subcategory: 'COB Directional Spotlights',
    subcategorySlug: 'cob-spotlights',
    description: 'Deep-set anti-glare architectural COB spotlight with 30-degree tilt angle and faceted optical reflector for accent lighting on textured walls and artwork.',
    shortDescription: '7W anti-glare tiltable COB architectural spotlight.',
    images: [
      'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=800&q=80'
    ],
    price: 560,
    mrp: 750,
    discount: 25,
    unit: 'Piece',
    packSize: '1 Spotlight with Constant Current Driver',
    gstRate: 18,
    rating: 4.9,
    reviewCount: 165,
    inStock: true,
    stockCount: 420,
    isBulkEligible: true,
    deliverySpeedAvailable: ['ASAP_60', 'EXPRESS_90', 'SCHEDULED'],
    isNewLaunch: true,
    specifications: {
      'Wattage': '7 Watts COB LED',
      'Beam Angle': '24-Degree Focused Beam with 30-Degree Tilt',
      'Color Temperature': '4000K Natural White (700 Lumens)',
      'CRI': '> 85 CRI for accurate interior color rendition'
    }
  }
];

export const SEED_KNOWLEDGE_ARTICLES: KnowledgeArticle[] = [
  {
    id: 'art-1',
    slug: 'difference-between-opc-53-and-ppc-cement',
    title: 'OPC 53 vs PPC Cement: Which One Should You Choose for RCC Slabs?',
    category: 'Civil & Interiors',
    summary: 'A definitive engineer guide comparing Ordinary Portland Cement Grade 53 and Portland Pozzolana Cement for building foundations, columns, and roofs.',
    content: `When building your home, choosing the right cement type between OPC 53 and PPC is one of the most critical structural decisions.

### Understanding OPC 53
Ordinary Portland Cement (OPC) 53 Grade achieves high initial compressive strength within the first 7 days. It is ideally suited for structural frameworks, pre-cast concrete beams, and multi-storey commercial frames where early shuttering removal is necessary.

### Understanding PPC
Portland Pozzolana Cement (PPC) blends clinker with calcined pozzolana fly ash. While its strength gain is gradual, its ultimate 28-day and 90-day compressive strength matches or exceeds OPC. Crucially, PPC has lower heat of hydration, drastically minimizing thermal shrinkage cracks on roof slabs, and resists chemical attacks in coastal or moist soils.

### Verdict for Residential Slabs
For residential roofs, foundation footings, and external plastering, PPC or specialized water-repellent cement (like UltraTech Weather Plus) is strongly recommended by structural engineers for long-term crack-free durability.`,
    readTimeMinutes: 5,
    author: 'Er. Rajesh Kulkarni (Chief Structural Consultant)',
    image: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=800&q=80',
    tags: ['Cement', 'RCC Slabs', 'Civil Engineering', 'Structural Safety'],
    publishedAt: '2026-10-15'
  },
  {
    id: 'art-2',
    slug: 'essential-waterproofing-checklist-for-bathrooms-and-terraces',
    title: 'The Complete Bathroom & Terrace Waterproofing Checklist Before Tiling',
    category: 'Waterproofing',
    summary: 'Prevent costly seepage, peeling paint, and ceiling dampness with these 5 crucial waterproofing steps before laying floor tiles.',
    content: `Waterproofing failures cost 5x more to repair once tiles and sanitaryware are fixed. Here is the field-tested checklist:

1. **Surface Preparation**: Chisel off loose mortar, honeycombed concrete, and dust. Wash with clean water.
2. **Coving / Filleting**: Form a 45-degree angle cove at all wall-to-floor junctions using polymer-modified mortar (Dr. Fixit Pidicrete URP).
3. **Pipe Penetration Collars**: Seal the perimeter of all plumbing drain collars with polyurethane sealant.
4. **Polymer Membrane Coating**: Apply 2 coats of elastomeric waterproof coating in criss-cross directions.
5. **Ponding Test (Crucial)**: Pond 50mm of water for 48 hours and inspect the floor beneath before laying any tile adhesives.`,
    readTimeMinutes: 4,
    author: 'Sunil Rao (Senior Waterproofing Specialist)',
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
    tags: ['Waterproofing', 'Bathroom Renovation', 'Dr. Fixit', 'Plumbing'],
    publishedAt: '2026-10-28'
  },
  {
    id: 'art-3',
    slug: 'choosing-correct-wire-gauges-for-home-electricals',
    title: 'How to Choose the Right Copper Wire Gauge (sq.mm) for Each Room',
    category: 'Electrical',
    summary: 'A simple room-by-room guide to selecting 1.0, 1.5, 2.5, 4.0, and 6.0 sq.mm FRLS copper wires to avoid electrical hazards.',
    content: `Using undersized wires causes overheating, tripped breakers, and severe fire hazards. Here is the recommended sizing standard:

- **1.0 sq.mm**: LED lights, exhaust fans, and general lighting circuits.
- **1.5 sq.mm**: 6A socket points, TV, computers, table lamps, and ceiling fans.
- **2.5 sq.mm**: 16A power points for 1.5 Ton AC, refrigerators, microwaves, and washing machines.
- **4.0 sq.mm**: Instant water geysers, 2.0 Ton AC units, and high-wattage kitchen hubs.
- **6.0 sq.mm**: Main supply line from distribution board to sub-boards.`,
    readTimeMinutes: 6,
    author: 'Vikram Joshi (Licensed Electrical Inspector)',
    image: 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&w=800&q=80',
    tags: ['Electrical Wiring', 'Havells', 'Safety Standards', 'Home Renovation'],
    publishedAt: '2026-11-02'
  }
];

export const SEED_FAQS: FaqItem[] = [
  {
    id: 'faq-1',
    category: 'Delivery',
    question: 'How fast can BUILDORA 60 deliver materials to my construction site?',
    answer: 'We offer multiple delivery options based on your location and items ordered: 1) ASAP 60-Minute Delivery for express tools, fittings, fasteners, adhesives, and light electrical items; 2) Express 90-120 Minute Delivery for standard materials; and 3) Scheduled Delivery slots for bulk cement, sand, and large boards with dedicated crane-unloading trucks.'
  },
  {
    id: 'faq-2',
    category: 'Ordering',
    question: 'Can I place bulk orders for my commercial or residential project?',
    answer: 'Yes! We have dedicated bulk pricing tiers on products. For orders exceeding ₹35,000 or requiring multi-truck dispatches, you can also submit a material list quotation directly through our /bulk-orders portal to receive customized institutional pricing and a dedicated project manager.'
  },
  {
    id: 'faq-3',
    category: 'Payments',
    question: 'What payment methods do you accept?',
    answer: 'We support all major payment modes including UPI (Google Pay, PhonePe, Paytm), Credit & Debit Cards (Visa, MasterCard, RuPay), Net Banking across 50+ banks, Cash/UPI on Delivery (COD) for eligible items, and BUILDORA Wallet credits.'
  },
  {
    id: 'faq-4',
    category: 'Billing',
    question: 'Can I get a GST Input Tax Credit (ITC) invoice for my company?',
    answer: 'Absolutely. During checkout Step 4, simply select "Business / GST Billing" and enter your registered 15-digit GSTIN and company legal name. A compliant GST tax invoice will be generated automatically and emailed with your order dispatch.'
  },
  {
    id: 'faq-5',
    category: 'Returns',
    question: 'What is your return and cancellation policy for unused materials?',
    answer: 'Unused, sealed, and undamaged materials in original packaging (such as unopened tile adhesive bags, unopened paint buckets, switches, locks, and tools) can be returned within 48 hours of delivery. Custom-cut wires, mixed paint shades, and unpacked cement are non-returnable.'
  }
];
