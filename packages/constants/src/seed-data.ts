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
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=800&q=80'
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
  {
    id: 'prod-cem-3',
    name: 'Birla White Cement',
    slug: 'birla-white-cement',
    sku: 'CEM-BIR-WHT-50KG',
    brand: 'Birla White',
    brandSlug: 'birla-white',
    category: 'Cement & Concrete',
    categorySlug: 'cement-concrete',
    subcategory: 'White Cement & Putty',
    subcategorySlug: 'white-cement-putty',
    description: 'Birla White Cement is India’s foremost white portland cement manufactured using superior limestone and state-of-the-art technology, offering ultimate whiteness (>89% Hunter), high compressive strength, and versatile applications across terrazzo flooring, decorative plasters, and tile joint fixing.',
    shortDescription: 'Super-white portland cement with >89% whiteness for architectural finishes.',
    images: [
      'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=800&q=80'
    ],
    price: 1240,
    mrp: 1350,
    discount: 8,
    unit: '1 Kg',
    packSize: '1 Kg, 5 Kg, 50 Kg',
    gstRate: 28,
    rating: 4.9,
    reviewCount: 312,
    inStock: true,
    stockCount: 1200,
    isBulkEligible: true,
    bulkPricing: [
      { minQuantity: 10, discountPercentage: 5, unitPrice: 38 },
      { minQuantity: 50, discountPercentage: 8, unitPrice: 36 }
    ],
    attributes: [
      {
        id: 'attr-pack-size',
        name: 'Pack Size',
        uiType: 'cards',
        options: ['50 Kg', '5 Kg', '1 Kg']
      }
    ],
    variants: [
      {
        id: 'v-birla-50kg',
        sku: 'CEM-BIR-WHT-50KG',
        name: '50 Kg',
        attributes: { 'Pack Size': '50 Kg' },
        price: 1240,
        mrp: 1350,
        stock: 500,
        inStock: true,
        image: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 'v-birla-5kg',
        sku: 'CEM-BIR-WHT-5KG',
        name: '5 Kg',
        attributes: { 'Pack Size': '5 Kg' },
        price: 140,
        mrp: 150,
        stock: 1200,
        inStock: true,
        image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 'v-birla-1kg',
        sku: 'CEM-BIR-WHT-1KG',
        name: '1 Kg',
        attributes: { 'Pack Size': '1 Kg' },
        price: 40,
        mrp: 40,
        stock: 2500,
        inStock: true,
        image: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=800&q=80'
      }
    ],
    specifications: {
      'Cement Type': 'White Portland Cement',
      'Whiteness': '> 89% (Hunter Scale)',
      'Grade': 'White Cement 53 Grade',
      'Standard': 'IS 8042 Compliant',
      'Compressive Strength (28 Days)': 'Min 30 MPa (Typical 60+ MPa)'
    },
    categoryAttributes: {
      cementType: 'White Cement',
      grade: 'White Portland'
    },
    applications: ['Architectural Finish Plaster', 'Designer Terrazzo Flooring', 'Tile Joint Grouting', 'Ornamental Mouldings'],
    deliverySpeedAvailable: ['ASAP_60', 'EXPRESS_90', 'SCHEDULED', 'NEXT_DAY'],
    isFeatured: true,
    isBestSeller: true
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
    name: 'Roff T01 NCA Tile Adhesive, Grey, 30 Kg Bag',
    slug: 'roff-t01-nca-tile-adhesive-30kg',
    sku: 'TIL-ROF-T01-30KG',
    brand: 'Pidilite (Fevicol & Dr. Fixit)',
    brandSlug: 'pidilite',
    category: 'Tiling & Tile Adhesives',
    categorySlug: 'tiling-tile-adhesives',
    subcategory: 'Polymer Tile Adhesives',
    subcategorySlug: 'tile-adhesives',
    description: 'Roff T01 New Construction Adhesive is a polymer-modified cementitious tile adhesive for fixing ceramic, vitrified tiles and natural stone on interior floors and walls with exceptional bond strength.',
    shortDescription: 'Polymer-modified cementitious tile adhesive for durable floor and wall tiling.',
    images: [
      'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=800&q=80'
    ],
    price: 430,
    mrp: 460,
    discount: 7,
    unit: '30 Kg Bag',
    packSize: '30 kg',
    gstRate: 18,
    rating: 4.8,
    reviewCount: 162,
    inStock: true,
    stockCount: 600,
    isBulkEligible: true,
    bulkPricing: [
      { minQuantity: 10, discountPercentage: 5, unitPrice: 410 },
      { minQuantity: 30, discountPercentage: 8, unitPrice: 395 }
    ],
    specifications: {
      'Adhesive Type': 'Polymer-modified',
      'Standard': 'IS 15477 : 2019 Type 1',
      'Coverage': 'Approx 55-65 sq.ft at 3mm bed thickness',
      'Colour': 'Grey'
    },
    deliverySpeedAvailable: ['ASAP_60', 'EXPRESS_90', 'SCHEDULED', 'NEXT_DAY'],
    isBestSeller: true
  },
  {
    id: 'prod-tile-3',
    name: 'MYK Laticrete 303 Grey Tile Adhesive, 20Kg Bag',
    slug: 'myk-laticrete-303-grey-tile-adhesive-20kg',
    sku: 'TIL-MYK-303-20KG',
    brand: 'MYK Laticrete',
    brandSlug: 'myk-laticrete',
    category: 'Tiling & Tile Adhesives',
    categorySlug: 'tiling-tile-adhesives',
    subcategory: 'Polymer Tile Adhesives',
    subcategorySlug: 'tile-adhesives',
    description: 'MYK Laticrete 303 is an engineered polymer-modified cementitious thin-set mortar designed for installation of ceramic, vitrified and quarry tiles on interior dry walls and floors.',
    shortDescription: 'High strength polymer thin-set tile mortar for indoor floors and walls.',
    images: [
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80'
    ],
    price: 255,
    mrp: 300,
    discount: 15,
    unit: '20 kg Bag',
    packSize: '20 kg',
    gstRate: 18,
    rating: 4.7,
    reviewCount: 89,
    inStock: true,
    stockCount: 400,
    isBulkEligible: true,
    bulkPricing: [
      { minQuantity: 10, discountPercentage: 8, unitPrice: 235 },
      { minQuantity: 30, discountPercentage: 12, unitPrice: 224 }
    ],
    specifications: {
      'Adhesive Type': 'Polymer-modified',
      'Colour': 'Grey',
      'Standard': 'IS 15477 : 2019 Type 1',
      'Interior / Exterior': 'Interior Dry'
    },
    deliverySpeedAvailable: ['ASAP_60', 'EXPRESS_90', 'SCHEDULED', 'NEXT_DAY'],
    isFeatured: true
  },
  {
    id: 'prod-tile-4',
    name: 'MYK Laticrete DWA 215 Tile Adhesive, 10 Kg',
    slug: 'myk-laticrete-dwa-215-tile-adhesive-10kg',
    sku: 'TIL-MYK-DWA-10KG',
    brand: 'MYK Laticrete',
    brandSlug: 'myk-laticrete',
    category: 'Tiling & Tile Adhesives',
    categorySlug: 'tiling-tile-adhesives',
    subcategory: 'Polymer Tile Adhesives',
    subcategorySlug: 'tile-adhesives',
    description: 'MYK Laticrete DWA 215 is a premium water-resistant modified acrylic adhesive paste engineered for fixing tiles and stones on drywall, plywood, and plastered surfaces.',
    shortDescription: 'Ready-to-use modified acrylic tile adhesive paste for drywalls and wood.',
    images: [
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80'
    ],
    price: 2025,
    mrp: 3165,
    discount: 36,
    unit: '10 kg Bucket',
    packSize: '10 kg',
    gstRate: 18,
    rating: 4.8,
    reviewCount: 45,
    inStock: true,
    stockCount: 150,
    isBulkEligible: false,
    specifications: {
      'Tile Dimensions': '600 x 600 mm',
      'Adhesive Type': 'Polymer-modified Paste',
      'Water Resistance': 'High'
    },
    deliverySpeedAvailable: ['ASAP_60', 'EXPRESS_90', 'SCHEDULED', 'NEXT_DAY']
  },

  // 3. Plywood, MDF & HDHMR
  {
    id: 'prod-ply-century-sainik',
    name: 'Century Sainik MR 303 Plywood',
    slug: 'century-sainik-mr-303-plywood',
    sku: 'PLY-CEN-SAINIK-303',
    brand: 'CenturyPly',
    brandSlug: 'centuryply',
    category: 'Plywood, MDF & HDHMR',
    categorySlug: 'plywood-mdf-hdhmr',
    subcategory: 'BWR Commercial Plywood',
    subcategorySlug: 'bwr-commercial-plywood',
    description: 'Century Sainik MR 303 is an authentic moisture resistant commercial plywood manufactured with chemically treated select hardwood and high-grade resin. Borer and termite resistant with 5 years warranty.',
    shortDescription: 'Original Century Sainik MR 303 plywood with calibrated thickness for furniture and interiors.',
    images: [
      'https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=800&q=80'
    ],
    price: 1455,
    mrp: 1547,
    discount: 6,
    unit: 'Sheet',
    packSize: "8' X 4' Sheet",
    gstRate: 18,
    rating: 4.8,
    reviewCount: 142,
    inStock: true,
    stockCount: 120,
    isBulkEligible: true,
    bulkPricing: [
      { minQuantity: 10, discountPercentage: 5, unitPrice: 1382 },
      { minQuantity: 25, discountPercentage: 8, unitPrice: 1338 }
    ],
    attributes: [
      {
        id: 'attr-ply-thickness',
        name: 'Thickness',
        uiType: 'pills',
        options: ['6mm', '8mm', '12mm', '16mm (Maxima)', '18mm', '19mm Blockboard', '25mm Blockboard']
      },
      {
        id: 'attr-ply-size',
        name: 'Size',
        uiType: 'cards',
        options: ["8' X 4'", "7' X 4'"]
      }
    ],
    variants: [
      { id: 'v-cen-6mm-8x4', sku: 'PLY-CEN-6MM-8X4', name: "6mm, 8' X 4'", attributes: { 'Thickness': '6mm', 'Size': "8' X 4'" }, price: 1455, mrp: 1547, discount: 6, stock: 120, inStock: true },
      { id: 'v-cen-6mm-7x4', sku: 'PLY-CEN-6MM-7X4', name: "6mm, 7' X 4'", attributes: { 'Thickness': '6mm', 'Size': "7' X 4'" }, price: 1259, mrp: 1340, discount: 6, stock: 80, inStock: true },
      { id: 'v-cen-8mm-8x4', sku: 'PLY-CEN-8MM-8X4', name: "8mm, 8' X 4'", attributes: { 'Thickness': '8mm', 'Size': "8' X 4'" }, price: 1820, mrp: 1950, discount: 7, stock: 95, inStock: true },
      { id: 'v-cen-8mm-7x4', sku: 'PLY-CEN-8MM-7X4', name: "8mm, 7' X 4'", attributes: { 'Thickness': '8mm', 'Size': "7' X 4'" }, price: 1560, mrp: 1680, discount: 7, stock: 60, inStock: true },
      { id: 'v-cen-12mm-8x4', sku: 'PLY-CEN-12MM-8X4', name: "12mm, 8' X 4'", attributes: { 'Thickness': '12mm', 'Size': "8' X 4'" }, price: 2220, mrp: 2380, discount: 7, stock: 75, inStock: true },
      { id: 'v-cen-12mm-7x4', sku: 'PLY-CEN-12MM-7X4', name: "12mm, 7' X 4'", attributes: { 'Thickness': '12mm', 'Size': "7' X 4'" }, price: 1910, mrp: 2050, discount: 7, stock: 45, inStock: true },
      { id: 'v-cen-16mm-8x4', sku: 'PLY-CEN-16MM-8X4', name: "16mm (Maxima), 8' X 4'", attributes: { 'Thickness': '16mm (Maxima)', 'Size': "8' X 4'" }, price: 2690, mrp: 2890, discount: 7, stock: 50, inStock: true },
      { id: 'v-cen-16mm-7x4', sku: 'PLY-CEN-16MM-7X4', name: "16mm (Maxima), 7' X 4'", attributes: { 'Thickness': '16mm (Maxima)', 'Size': "7' X 4'" }, price: 2320, mrp: 2490, discount: 7, stock: 30, inStock: true },
      { id: 'v-cen-18mm-8x4', sku: 'PLY-CEN-18MM-8X4', name: "18mm, 8' X 4'", attributes: { 'Thickness': '18mm', 'Size': "8' X 4'" }, price: 2980, mrp: 3200, discount: 7, stock: 110, inStock: true },
      { id: 'v-cen-18mm-7x4', sku: 'PLY-CEN-18MM-7X4', name: "18mm, 7' X 4'", attributes: { 'Thickness': '18mm', 'Size': "7' X 4'" }, price: 2560, mrp: 2750, discount: 7, stock: 40, inStock: true },
      { id: 'v-cen-19mm-8x4', sku: 'PLY-CEN-19MM-8X4', name: "19mm Blockboard, 8' X 4'", attributes: { 'Thickness': '19mm Blockboard', 'Size': "8' X 4'" }, price: 3190, mrp: 3450, discount: 8, stock: 65, inStock: true },
      { id: 'v-cen-19mm-7x4', sku: 'PLY-CEN-19MM-7X4', name: "19mm Blockboard, 7' X 4'", attributes: { 'Thickness': '19mm Blockboard', 'Size': "7' X 4'" }, price: 2750, mrp: 2980, discount: 8, stock: 25, inStock: true },
      { id: 'v-cen-25mm-8x4', sku: 'PLY-CEN-25MM-8X4', name: "25mm Blockboard, 8' X 4'", attributes: { 'Thickness': '25mm Blockboard', 'Size': "8' X 4'" }, price: 3890, mrp: 4200, discount: 7, stock: 40, inStock: true },
      { id: 'v-cen-25mm-7x4', sku: 'PLY-CEN-25MM-7X4', name: "25mm Blockboard, 7' X 4'", attributes: { 'Thickness': '25mm Blockboard', 'Size': "7' X 4'" }, price: 3350, mrp: 3600, discount: 7, stock: 0, inStock: false, isAvailable: false }
    ],
    specifications: {
      'Dimensions': "8' X 4'",
      'Thickness': '6mm',
      'Grade': 'IS:303 Moisture Resistant',
      'Preservative Treatment': 'Borer and Termite Resistant'
    },
    applications: ['Home Furniture', 'Wardrobes & Shelves', 'Partitions', 'Panelling Work'],
    deliverySpeedAvailable: ['ASAP_60', 'EXPRESS_90', 'SCHEDULED'],
    isFeatured: true
  },
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
    discount: 13,
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
    attributes: [
      {
        id: 'attr-gre-thickness',
        name: 'Thickness',
        uiType: 'pills',
        options: ['6mm', '9mm', '12mm', '16mm', '19mm']
      },
      {
        id: 'attr-gre-size',
        name: 'Size',
        uiType: 'cards',
        options: ["8' X 4'", "7' X 4'"]
      }
    ],
    variants: [
      { id: 'v-gre-6mm-8x4', sku: 'PLY-GRE-6MM-8X4', name: "6mm, 8' X 4'", attributes: { 'Thickness': '6mm', 'Size': "8' X 4'" }, price: 1680, mrp: 1920, discount: 13, stock: 80, inStock: true },
      { id: 'v-gre-6mm-7x4', sku: 'PLY-GRE-6MM-7X4', name: "6mm, 7' X 4'", attributes: { 'Thickness': '6mm', 'Size': "7' X 4'" }, price: 1450, mrp: 1650, discount: 12, stock: 50, inStock: true },
      { id: 'v-gre-9mm-8x4', sku: 'PLY-GRE-9MM-8X4', name: "9mm, 8' X 4'", attributes: { 'Thickness': '9mm', 'Size': "8' X 4'" }, price: 2100, mrp: 2400, discount: 13, stock: 90, inStock: true },
      { id: 'v-gre-9mm-7x4', sku: 'PLY-GRE-9MM-7X4', name: "9mm, 7' X 4'", attributes: { 'Thickness': '9mm', 'Size': "7' X 4'" }, price: 1820, mrp: 2080, discount: 13, stock: 40, inStock: true },
      { id: 'v-gre-12mm-8x4', sku: 'PLY-GRE-12MM-8X4', name: "12mm, 8' X 4'", attributes: { 'Thickness': '12mm', 'Size': "8' X 4'" }, price: 2550, mrp: 2900, discount: 12, stock: 70, inStock: true },
      { id: 'v-gre-12mm-7x4', sku: 'PLY-GRE-12MM-7X4', name: "12mm, 7' X 4'", attributes: { 'Thickness': '12mm', 'Size': "7' X 4'" }, price: 2200, mrp: 2500, discount: 12, stock: 35, inStock: true },
      { id: 'v-gre-16mm-8x4', sku: 'PLY-GRE-16MM-8X4', name: "16mm, 8' X 4'", attributes: { 'Thickness': '16mm', 'Size': "8' X 4'" }, price: 2850, mrp: 3250, discount: 12, stock: 60, inStock: true },
      { id: 'v-gre-16mm-7x4', sku: 'PLY-GRE-16MM-7X4', name: "16mm, 7' X 4'", attributes: { 'Thickness': '16mm', 'Size': "7' X 4'" }, price: 2480, mrp: 2800, discount: 11, stock: 30, inStock: true },
      { id: 'v-gre-19mm-8x4', sku: 'PLY-GRE-BWP-19MM', name: "19mm, 8' X 4'", attributes: { 'Thickness': '19mm', 'Size': "8' X 4'" }, price: 3150, mrp: 3600, discount: 13, stock: 220, inStock: true },
      { id: 'v-gre-19mm-7x4', sku: 'PLY-GRE-19MM-7X4', name: "19mm, 7' X 4'", attributes: { 'Thickness': '19mm', 'Size': "7' X 4'" }, price: 2720, mrp: 3100, discount: 12, stock: 65, inStock: true }
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
    attributes: [
      {
        id: 'attr-pnt-finish',
        name: 'Finish',
        uiType: 'pills',
        options: ['Rich Sheen', 'Matt Finish']
      },
      {
        id: 'attr-pnt-pack',
        name: 'Pack Size',
        uiType: 'cards',
        options: ['20 Litre Bucket', '10 Litre Bucket', '4 Litre Can', '1 Litre Can']
      }
    ],
    variants: [
      { id: 'v-pnt-sheen-20l', sku: 'PNT-AP-ULT-20L-SHN', name: 'Rich Sheen, 20 Litre Bucket', attributes: { 'Finish': 'Rich Sheen', 'Pack Size': '20 Litre Bucket' }, price: 6850, mrp: 7800, discount: 12, stock: 180, inStock: true },
      { id: 'v-pnt-sheen-10l', sku: 'PNT-AP-ULT-10L-SHN', name: 'Rich Sheen, 10 Litre Bucket', attributes: { 'Finish': 'Rich Sheen', 'Pack Size': '10 Litre Bucket' }, price: 3650, mrp: 4150, discount: 12, stock: 120, inStock: true },
      { id: 'v-pnt-sheen-4l', sku: 'PNT-AP-ULT-4L-SHN', name: 'Rich Sheen, 4 Litre Can', attributes: { 'Finish': 'Rich Sheen', 'Pack Size': '4 Litre Can' }, price: 1540, mrp: 1750, discount: 12, stock: 95, inStock: true },
      { id: 'v-pnt-sheen-1l', sku: 'PNT-AP-ULT-1L-SHN', name: 'Rich Sheen, 1 Litre Can', attributes: { 'Finish': 'Rich Sheen', 'Pack Size': '1 Litre Can' }, price: 420, mrp: 480, discount: 12, stock: 150, inStock: true },
      { id: 'v-pnt-matt-20l', sku: 'PNT-AP-ULT-20L-MAT', name: 'Matt Finish, 20 Litre Bucket', attributes: { 'Finish': 'Matt Finish', 'Pack Size': '20 Litre Bucket' }, price: 6650, mrp: 7600, discount: 12, stock: 80, inStock: true },
      { id: 'v-pnt-matt-10l', sku: 'PNT-AP-ULT-10L-MAT', name: 'Matt Finish, 10 Litre Bucket', attributes: { 'Finish': 'Matt Finish', 'Pack Size': '10 Litre Bucket' }, price: 3520, mrp: 4000, discount: 12, stock: 60, inStock: true },
      { id: 'v-pnt-matt-4l', sku: 'PNT-AP-ULT-4L-MAT', name: 'Matt Finish, 4 Litre Can', attributes: { 'Finish': 'Matt Finish', 'Pack Size': '4 Litre Can' }, price: 1480, mrp: 1680, discount: 11, stock: 45, inStock: true },
      { id: 'v-pnt-matt-1l', sku: 'PNT-AP-ULT-1L-MAT', name: 'Matt Finish, 1 Litre Can', attributes: { 'Finish': 'Matt Finish', 'Pack Size': '1 Litre Can' }, price: 395, mrp: 450, discount: 12, stock: 70, inStock: true }
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
      'Product Type': 'CPVC Plumbing Pipe',
      'Size': '25 mm (1 Inch)',
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
      'Product Type': 'Rotary Hammer Drill',
      'Size': '800 Watts (26mm)',
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
      'Product Type': 'Brass Padlock',
      'Size': '8 Levers (70mm)',
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
      'Product Type': 'Overhead Water Tank',
      'Size': '1000 Litres',
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
    brand: 'Hafele',
    brandSlug: 'hafele',
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
      'Product Type': 'Auto Concealed Hinge',
      'Size': 'Full Overlay (0 Crank)',
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
    brand: 'Ebco',
    brandSlug: 'ebco',
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
      'Product Type': 'Telescopic Drawer Slide',
      'Size': '18 Inch (450 mm)',
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
      'Product Type': 'Modular Wire Basket',
      'Size': '17 x 20 x 6 Inch',
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
    brand: 'Hafele',
    brandSlug: 'hafele',
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
      'Product Type': 'Tandem Drawer Box',
      'Size': '500 mm',
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
    brand: 'Stanley',
    brandSlug: 'stanley',
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
      'Product Type': 'Steel Tape Rule',
      'Size': '5 Metres (16 ft)',
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
    brand: 'Taparia',
    brandSlug: 'taparia',
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
      'Product Type': 'Claw Hammer',
      'Size': '450 Grams (16 oz)',
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
    brand: 'Jaquar',
    brandSlug: 'jaquar',
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
      'Product Type': 'Concealed Cistern Tank',
      'Size': '6 / 3 Litres',
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
    brand: 'Chilly',
    brandSlug: 'chilly',
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
      'Product Type': 'Linear Floor Drain',
      'Size': '600 mm (24 Inch)',
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
      'Product Type': 'Rigid PVC Conduit Pipe',
      'Size': '25 mm (3 Metres)',
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
      'Product Type': 'Deep Junction Box',
      'Size': '25 mm (4-Way)',
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
    brand: 'Franke',
    brandSlug: 'franke',
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
      'Product Type': 'Single Bowl Sink',
      'Size': '24 x 18 Inch',
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
    brand: 'Kohler',
    brandSlug: 'kohler',
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
      'Product Type': 'Flexible Sink Faucet',
      'Size': '450 mm',
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
    brand: 'Luminous',
    brandSlug: 'luminous',
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
      'Product Type': 'Pure Sine Wave Inverter',
      'Size': '900 VA / 12V',
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
      'Product Type': 'Storage Water Geyser',
      'Size': '25 Litres',
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
      'Product Type': 'Recessed LED Downlight',
      'Size': '12 Watts (135mm)',
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
    brand: 'Wipro',
    brandSlug: 'wipro',
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
      'Product Type': 'Directional COB Spotlight',
      'Size': '7 Watts COB',
      'Wattage': '7 Watts COB LED',
      'Beam Angle': '24-Degree Focused Beam with 30-Degree Tilt',
      'Color Temperature': '4000K Natural White (700 Lumens)',
      'CRI': '> 85 CRI for accurate interior color rendition'
    }
  },

  // 28. Wardrobe & Bed Fittings
  {
    id: 'prod-ward-1',
    name: 'Ebco Heavy-Duty Hydraulic Bed Lift-Up Mechanism with 120kg Gas Springs (Set of 2)',
    slug: 'ebco-heavy-duty-hydraulic-bed-lift-up-mechanism-120kg',
    sku: 'WRD-EBC-LIFT-120KG',
    brand: 'Godrej Locks',
    brandSlug: 'godrej',
    category: 'Wardrobe & Bed Fittings',
    categorySlug: 'wardrobe-bed-fittings',
    subcategory: 'Heavy Duty Bed Lift-Up Mechanisms',
    subcategorySlug: 'bed-lift-ups',
    description: 'Precision engineered carbon steel bed lifting frame with German nitrogen gas pressurized cylinders rated at 120kg lift capacity for queen and king storage beds.',
    shortDescription: '120kg rated hydraulic gas spring bed storage lift mechanism.',
    images: ['https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80'],
    price: 3450,
    mrp: 4200,
    discount: 18,
    unit: 'Pair (Left & Right)',
    packSize: '1 Pair with 2x 120kg Gas Struts',
    gstRate: 18,
    rating: 4.8,
    reviewCount: 94,
    inStock: true,
    stockCount: 130,
    isBulkEligible: true,
    deliverySpeedAvailable: ['ASAP_60', 'EXPRESS_90', 'SCHEDULED'],
    specifications: {
      'Material': 'Heavy Gauge Cold Rolled Steel',
      'Finish': 'Powder Coated Black',
      'Load Capacity': '120 kg Gas Springs',
      'Size': '5 ft & 6 ft Bed Storage',
      'Mounting Type': 'Base Frame Side Mount',
      'Application': 'Hydraulic Storage Beds'
    }
  },
  {
    id: 'prod-ward-2',
    name: 'Hafele Classic Top-Hung Heavy Sliding Wardrobe Track & Roller System (2-Door, 2 Metre)',
    slug: 'hafele-classic-top-hung-sliding-wardrobe-track-2m',
    sku: 'WRD-HAF-SLD-2M',
    brand: 'Godrej Locks',
    brandSlug: 'godrej',
    category: 'Wardrobe & Bed Fittings',
    categorySlug: 'wardrobe-bed-fittings',
    subcategory: 'Sliding Wardrobe Track Systems',
    subcategorySlug: 'sliding-tracks',
    description: 'Extruded architectural aluminium top and bottom track profile with high-density ball bearing nylon rollers supporting wardrobe doors up to 60kg each.',
    shortDescription: '2-metre top-hung silent sliding wardrobe track and roller hardware.',
    images: ['https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80'],
    price: 2850,
    mrp: 3500,
    discount: 19,
    unit: 'Complete Kit',
    packSize: 'Top Track + Bottom Guide + 4x Roller Assemblies',
    gstRate: 18,
    rating: 4.9,
    reviewCount: 78,
    inStock: true,
    stockCount: 85,
    isBulkEligible: true,
    deliverySpeedAvailable: ['ASAP_60', 'EXPRESS_90', 'SCHEDULED'],
    specifications: {
      'Material': 'Aluminium Alloy Track with Ball Bearing Rollers',
      'Finish': 'Anodized Silver',
      'Length': '2000 mm (2 Metre)',
      'Load Capacity': '60 kg per Door',
      'Mounting Type': 'Top-Hung Sliding',
      'Application': 'Sliding Wardrobe Closets'
    }
  },

  // 29. Switches & Sockets
  {
    id: 'prod-sw-1',
    name: 'Havells Fabio 6A 1-Way Modular Switch with Silver Inlay (1 Module, White)',
    slug: 'havells-fabio-6a-1-way-modular-switch-white',
    sku: 'SWT-HAV-FAB-6A-1W',
    brand: 'Havells',
    brandSlug: 'havells',
    category: 'Switches & Sockets',
    categorySlug: 'switches-sockets',
    subcategory: 'Modular Switches (6A/16A)',
    subcategorySlug: 'modular-switches',
    description: 'Engineered with silver-cadmium oxide contacts for arc suppression, captive screws, and flame-retardant UV-stabilized polycarbonate face.',
    shortDescription: '6A 1-way smooth rocker modular switch with silver contacts.',
    images: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'],
    price: 88,
    mrp: 115,
    discount: 23,
    unit: 'Piece',
    packSize: '1 Switch (Box of 20 available)',
    gstRate: 18,
    rating: 4.8,
    reviewCount: 310,
    inStock: true,
    stockCount: 1500,
    isBulkEligible: true,
    deliverySpeedAvailable: ['ASAP_60', 'EXPRESS_90', 'SCHEDULED'],
    specifications: {
      'Product Type': 'Modular Switch',
      'Switch Type': '1-Way Switch',
      'Module Size': '1 Module',
      'Amp Rating': '6 Amp',
      'Voltage Rating': '240V AC',
      'Colour': 'Pure White',
      'Series / Model': 'Fabio'
    }
  },
  {
    id: 'prod-sw-2',
    name: 'Havells Fabio 16A/6A Heavy Duty Universal Combined Socket with Safety Shutter (2 Module, White)',
    slug: 'havells-fabio-16a-universal-socket-with-shutter',
    sku: 'SWT-HAV-FAB-16A-SKT',
    brand: 'Havells',
    brandSlug: 'havells',
    category: 'Switches & Sockets',
    categorySlug: 'switches-sockets',
    subcategory: 'Power Sockets & Shuttered Plugs',
    subcategorySlug: 'power-sockets',
    description: 'Universal combined 6A/16A socket with child safety shutter protection and phosphor bronze contact terminals designed for heavy appliances.',
    shortDescription: '16A heavy-duty shuttered universal power socket.',
    images: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'],
    price: 185,
    mrp: 235,
    discount: 21,
    unit: 'Piece',
    packSize: '1 Socket Module',
    gstRate: 18,
    rating: 4.9,
    reviewCount: 220,
    inStock: true,
    stockCount: 950,
    isBulkEligible: true,
    deliverySpeedAvailable: ['ASAP_60', 'EXPRESS_90', 'SCHEDULED'],
    specifications: {
      'Product Type': 'Power Socket',
      'Socket Type': '16A/6A Combined Universal',
      'Module Size': '2 Module',
      'Amp Rating': '16 Amp',
      'Voltage Rating': '240V AC',
      'Colour': 'Pure White',
      'Series / Model': 'Fabio'
    }
  },

  // 30. Ceiling Fans & Exhaust
  {
    id: 'prod-fan-1',
    name: 'Havells Stealth Air 1200mm BLDC 5-Star Energy Saving Ceiling Fan with Remote (Pearl White)',
    slug: 'havells-stealth-air-1200mm-bldc-ceiling-fan-white',
    sku: 'FAN-HAV-STL-BLDC-1200',
    brand: 'Havells',
    brandSlug: 'havells',
    category: 'Ceiling Fans & Exhaust',
    categorySlug: 'ceiling-fans-exhaust',
    subcategory: 'BLDC Energy Saving Ceiling Fans (1200mm)',
    subcategorySlug: 'bldc-ceiling-fans',
    description: 'Premium BLDC motor consuming only 28W at peak speed, aerodynamically contoured blades for 240 m³/min air delivery and RF remote control.',
    shortDescription: '28W BLDC 5-star super energy efficient ceiling fan with remote.',
    images: ['https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=800&q=80'],
    price: 3899,
    mrp: 5200,
    discount: 25,
    unit: 'Unit',
    packSize: '1 Fan Motor + 3 Blades + Downrod + RF Remote Kit',
    gstRate: 18,
    rating: 4.8,
    reviewCount: 160,
    inStock: true,
    stockCount: 110,
    isBulkEligible: true,
    deliverySpeedAvailable: ['ASAP_60', 'EXPRESS_90', 'SCHEDULED'],
    specifications: {
      'Product Type': 'Ceiling Fan',
      'Sweep Size': '1200mm (48 Inch)',
      'Wattage': '28W BLDC Motor',
      'RPM': '350 RPM',
      'Air Delivery': '240 m³/min',
      'Number of Blades': '3 Aerodynamic Blades',
      'Colour': 'Pearl White',
      'Control Type': 'RF Remote Control',
      'Energy Efficiency': '5-Star BEE Rated'
    }
  },
  {
    id: 'prod-fan-2',
    name: 'Havells Ventil Air DX 150mm High-Speed Silent Bathroom Exhaust Fan (White)',
    slug: 'havells-ventil-air-dx-150mm-bathroom-exhaust-fan',
    sku: 'FAN-HAV-VNT-150MM',
    brand: 'Havells',
    brandSlug: 'havells',
    category: 'Ceiling Fans & Exhaust',
    categorySlug: 'ceiling-fans-exhaust',
    subcategory: 'Bathroom & Kitchen High-Speed Exhaust Fans',
    subcategorySlug: 'exhaust-fans',
    description: 'Louvered shutter high-speed exhaust fan molded from engineering grade plastic with copper motor and bird-guard gravity shutters.',
    shortDescription: '150mm (6-inch) high-velocity silent bathroom ventilation fan.',
    images: ['https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=800&q=80'],
    price: 1150,
    mrp: 1450,
    discount: 21,
    unit: 'Unit',
    packSize: '1 Exhaust Fan Unit with Back Shutter',
    gstRate: 18,
    rating: 4.7,
    reviewCount: 185,
    inStock: true,
    stockCount: 220,
    isBulkEligible: true,
    deliverySpeedAvailable: ['ASAP_60', 'EXPRESS_90', 'SCHEDULED'],
    specifications: {
      'Product Type': 'Exhaust Fan',
      'Sweep Size': '150mm (6 Inch)',
      'Wattage': '22W',
      'RPM': '1350 RPM',
      'Air Delivery': '210 m³/hr',
      'Number of Blades': '5 Blades',
      'Colour': 'White',
      'Control Type': 'Wall Switch',
      'Energy Efficiency': 'Standard'
    }
  },

  // 31. Sanitary & Bath Fittings
  {
    id: 'prod-san-1',
    name: 'Jaquar Continental Rimless Single-Piece Ceramic Water Closet with Soft-Close Seat (S-Trap 300mm)',
    slug: 'jaquar-continental-rimless-single-piece-water-closet',
    sku: 'SAN-JAQ-CNT-WC',
    brand: 'Astral Pipes',
    brandSlug: 'astral',
    category: 'Sanitary & Bath Fittings',
    categorySlug: 'sanitary-bath-fittings',
    subcategory: 'Single Piece Ceramic Water Closets',
    subcategorySlug: 'water-closets',
    description: 'Aesthetic European style single-piece vitreous china commode with rimless vortex flushing technology, anti-bacterial glaze, and heavy UF soft-close seat cover.',
    shortDescription: 'Rimless single-piece toilet with tornado flush & soft-close seat.',
    images: ['https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=800&q=80'],
    price: 9850,
    mrp: 12500,
    discount: 21,
    unit: 'Set',
    packSize: '1 Single Piece WC + Soft-Close UF Seat Cover + Wax Seal',
    gstRate: 18,
    rating: 4.9,
    reviewCount: 104,
    inStock: true,
    stockCount: 45,
    isBulkEligible: true,
    deliverySpeedAvailable: ['ASAP_60', 'EXPRESS_90', 'SCHEDULED'],
    specifications: {
      'Product Type': 'Single Piece Water Closet (WC)',
      'Material': 'Vitreous China Ceramic',
      'Finish': 'Glossy Glazed Finish',
      'Colour': 'Alpine White',
      'Installation Type': 'Floor Mounted S-Trap (300mm)',
      'Water Flow / Operating Type': 'Rimless Tornado Vortex Flush',
      'Bathroom Application': 'Master Bathroom Ensuite'
    }
  },
  {
    id: 'prod-san-2',
    name: 'Jaquar Alive Single Lever Quarter-Turn Brass Chrome Basin Mixer Tap with 450mm Braided Hoses',
    slug: 'jaquar-alive-single-lever-brass-basin-mixer-tap',
    sku: 'SAN-JAQ-ALV-BSN',
    brand: 'Astral Pipes',
    brandSlug: 'astral',
    category: 'Sanitary & Bath Fittings',
    categorySlug: 'sanitary-bath-fittings',
    subcategory: 'Quarter Turn Brass Chrome Basin Mixers',
    subcategorySlug: 'basin-mixers',
    description: 'Solid forged virgin brass body finished in multi-layer mirror chrome with smooth 35mm ceramic cartridge and aerated water-saving foam flow.',
    shortDescription: 'Single-lever hot and cold quarter-turn brass basin mixer tap.',
    images: ['https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=800&q=80'],
    price: 2650,
    mrp: 3400,
    discount: 22,
    unit: 'Piece',
    packSize: '1 Basin Mixer + 2x Braided SS Inlets',
    gstRate: 18,
    rating: 4.8,
    reviewCount: 140,
    inStock: true,
    stockCount: 95,
    isBulkEligible: true,
    deliverySpeedAvailable: ['ASAP_60', 'EXPRESS_90', 'SCHEDULED'],
    specifications: {
      'Product Type': 'Basin Mixer Faucet',
      'Material': 'Forged Virgin Brass IS 319',
      'Finish': 'Mirror Chrome Plated',
      'Colour': 'Chrome',
      'Installation Type': 'Tabletop Counter Mount',
      'Water Flow / Operating Type': 'Soft Aerated Foam Flow',
      'Bathroom Application': 'Ensuite Vanity Basin'
    }
  },

  // 32. CCTV & Networking
  {
    id: 'prod-cctv-1',
    name: 'Hikvision 4MP ColorVu Outdoor IP PoE Bullet Surveillance Camera with Built-in Mic',
    slug: 'hikvision-4mp-colorvu-outdoor-ip-poe-bullet-camera',
    sku: 'SEC-HIK-CLR-4MP-BLT',
    brand: 'Havells',
    brandSlug: 'havells',
    category: 'CCTV & Networking',
    categorySlug: 'cctv-networking',
    subcategory: 'HD Outdoor IP Bullet & Dome Cameras',
    subcategorySlug: 'ip-cameras',
    description: '24/7 full-colour imaging with F1.0 super-aperture, 4MP QHD resolution, PoE connectivity, and IP67 weather-sealed metallic bullet housing.',
    shortDescription: '4MP ColorVu 24/7 full-colour night vision outdoor IP bullet camera.',
    images: ['https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80'],
    price: 3650,
    mrp: 4700,
    discount: 22,
    unit: 'Piece',
    packSize: '1 Bullet Camera + Weatherproof Connector + Mounting Screws',
    gstRate: 18,
    rating: 4.9,
    reviewCount: 84,
    inStock: true,
    stockCount: 65,
    isBulkEligible: true,
    deliverySpeedAvailable: ['ASAP_60', 'EXPRESS_90', 'SCHEDULED'],
    specifications: {
      'Product Type': 'Outdoor Bullet Camera',
      'Camera Type': 'IP Network Camera',
      'Resolution': '4MP Ultra HD ColorVu (2560x1440)',
      'Connectivity': 'PoE Wired RJ45',
      'Network Type': 'CAT6 Ethernet',
      'Storage Compatibility': 'Up to 256GB MicroSD / NVR',
      'Indoor / Outdoor': 'Outdoor IP67 Weatherproof',
      'Accessories': 'Mounting Bracket & Weatherproof Gland'
    }
  },
  {
    id: 'prod-cctv-2',
    name: 'D-Link 4-Pair CAT6 Pure Copper UTP Solid Unshielded Ethernet Cable (305 Metre Box)',
    slug: 'dlink-cat6-pure-copper-utp-solid-cable-305m',
    sku: 'SEC-DLK-CAT6-305M',
    brand: 'Havells',
    brandSlug: 'havells',
    category: 'CCTV & Networking',
    categorySlug: 'cctv-networking',
    subcategory: 'CAT6 Pure Copper Ethernet Cables (305m)',
    subcategorySlug: 'cat6-cables',
    description: 'High-frequency 250 MHz 23 AWG 100% solid electrolytic copper conductors in easy-pull dispense box verified for Gigabit CCTV and networking.',
    shortDescription: '305m pure copper solid CAT6 UTP structured networking cable.',
    images: ['https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80'],
    price: 7450,
    mrp: 9200,
    discount: 19,
    unit: 'Box (305 Metres)',
    packSize: '1 Easy-Pull Box (1000 Feet / 305 Metres)',
    gstRate: 18,
    rating: 4.9,
    reviewCount: 110,
    inStock: true,
    stockCount: 50,
    isBulkEligible: true,
    deliverySpeedAvailable: ['ASAP_60', 'EXPRESS_90', 'SCHEDULED'],
    specifications: {
      'Product Type': 'Network Cable',
      'Network Type': 'CAT6 1000Base-T Pure Copper',
      'Cable Length': '305 Metres (1000 ft)',
      'Material': '100% Solid Bare Electrolytic Copper (23 AWG)',
      'Indoor / Outdoor': 'Indoor Concealed Conduit Wiring'
    }
  },

  // 33. Safety & Workwear
  {
    id: 'prod-safe-1',
    name: 'Karam FS 05 Steel-Toe Genuine Leather Industrial Safety Shoes with Double-Density PU Sole (Size 8)',
    slug: 'karam-fs05-steel-toe-leather-safety-shoes-size8',
    sku: 'SAF-KRM-SHO-SZ8',
    brand: 'Bosch Power Tools',
    brandSlug: 'bosch',
    category: 'Safety & Workwear',
    categorySlug: 'safety-workwear',
    subcategory: 'Steel-Toe Protective Safety Shoes',
    subcategorySlug: 'safety-shoes',
    description: 'EN ISO 20345 certified full-grain buff leather safety shoes equipped with 200J impact-resistant steel toe cap, oil/acid resistant anti-slip double density PU sole.',
    shortDescription: '200J steel toe impact leather safety shoes with anti-static PU sole.',
    images: ['https://images.unsplash.com/photo-1578873375969-d65275e89647?auto=format&fit=crop&w=800&q=80'],
    price: 1450,
    mrp: 1850,
    discount: 22,
    unit: 'Pair',
    packSize: '1 Pair Safety Shoes (Size 8 / Euro 42)',
    gstRate: 18,
    rating: 4.8,
    reviewCount: 142,
    inStock: true,
    stockCount: 120,
    isBulkEligible: true,
    deliverySpeedAvailable: ['ASAP_60', 'EXPRESS_90', 'SCHEDULED'],
    specifications: {
      'Product Type': 'Steel-Toe Safety Shoes',
      'Safety Category': 'Foot Protection EN ISO 20345 (S1)',
      'Size': 'Size 8 / Euro 42',
      'Material': 'Water-Repellent Full Grain Buff Leather',
      'Protection Rating': '200 Joules Impact Steel Toe Cap',
      'Colour': 'Black',
      'Application': 'Active Construction & Structural Sites'
    }
  },
  {
    id: 'prod-safe-2',
    name: 'Karam Shelmet ISI Certified High-Impact Industrial Safety Hard Hat with Ratchet Headband (Yellow)',
    slug: 'karam-shelmet-isi-industrial-safety-hard-hat-yellow',
    sku: 'SAF-KRM-HLM-YEL',
    brand: 'Bosch Power Tools',
    brandSlug: 'bosch',
    category: 'Safety & Workwear',
    categorySlug: 'safety-workwear',
    subcategory: 'Industrial Hard Hats & Helmets',
    subcategorySlug: 'safety-helmets',
    description: 'IS 2925 certified high-impact HDPE construction helmet with 6-point textile suspension harness, manual ratchet adjustment, and sweatband.',
    shortDescription: 'ISI certified impact-resistant construction hard hat with ratchet dial.',
    images: ['https://images.unsplash.com/photo-1578873375969-d65275e89647?auto=format&fit=crop&w=800&q=80'],
    price: 295,
    mrp: 380,
    discount: 22,
    unit: 'Piece',
    packSize: '1 Hard Hat Helmet with 6-Point Suspension',
    gstRate: 18,
    rating: 4.8,
    reviewCount: 280,
    inStock: true,
    stockCount: 650,
    isBulkEligible: true,
    deliverySpeedAvailable: ['ASAP_60', 'EXPRESS_90', 'SCHEDULED'],
    specifications: {
      'Product Type': 'Safety Helmet',
      'Safety Category': 'Head Protection IS 2925',
      'Size': 'Universal Adjustable Ratchet (53-60 cm)',
      'Material': 'High-Density Impact Polyethylene (HDPE)',
      'Protection Rating': 'Class C Electrical / Impact Protection',
      'Colour': 'Safety Yellow',
      'Application': 'Building Sites & Scaffolding Zones'
    }
  },

  // 34. Glass Door Hardware
  {
    id: 'prod-glass-1',
    name: 'Godrej Heavy-Duty Double-Cylinder Hydraulic Floor Spring for Frameless Glass Doors (EN 3, 100kg)',
    slug: 'godrej-heavy-duty-hydraulic-floor-spring-en3-100kg',
    sku: 'GLS-GDJ-FLS-EN3',
    brand: 'Godrej Locks',
    brandSlug: 'godrej',
    category: 'Glass Door Hardware',
    categorySlug: 'glass-door-hardware',
    subcategory: 'Heavy Duty Hydraulic Floor Springs',
    subcategorySlug: 'floor-springs',
    description: 'Double cylinder cam-action hydraulic floor spring tested to 500,000 cycles with dual speed regulation valves and 90-degree hold-open for glass doors up to 100kg.',
    shortDescription: 'EN 3 rated double-action floor spring for 10-12mm frameless glass doors.',
    images: ['https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80'],
    price: 4850,
    mrp: 6200,
    discount: 22,
    unit: 'Set',
    packSize: '1 Floor Spring Unit + SS 304 Cover Plate + Cement Box',
    gstRate: 18,
    rating: 4.9,
    reviewCount: 52,
    inStock: true,
    stockCount: 40,
    isBulkEligible: true,
    deliverySpeedAvailable: ['ASAP_60', 'EXPRESS_90', 'SCHEDULED'],
    specifications: {
      'Product Type': 'Hydraulic Floor Spring',
      'Hardware Type': 'Floor Spring Mechanism',
      'Glass Thickness Compatibility': '10mm - 12mm Toughened Glass',
      'Material': 'Cast Iron Body with SS 304 Cover Plate',
      'Finish': 'Satin Stainless Steel (SSS)',
      'Size': 'EN 3 Rating (Up to 100kg Door)',
      'Mounting Type': 'Floor Recessed Mortise Cement Box',
      'Application': 'Office & Commercial Frameless Glass Doors'
    }
  },
  {
    id: 'prod-glass-2',
    name: 'Godrej SS 304 Top & Bottom Pivot Patch Fitting Set for Frameless Glass Door',
    slug: 'godrej-ss-304-top-bottom-patch-fitting-set',
    sku: 'GLS-GDJ-PTC-SET',
    brand: 'Godrej Locks',
    brandSlug: 'godrej',
    category: 'Glass Door Hardware',
    categorySlug: 'glass-door-hardware',
    subcategory: 'Stainless Steel Top & Bottom Patch Fittings',
    subcategorySlug: 'patch-fittings',
    description: 'High-strength drop-forged aluminum alloy core with brushed SS 304 outer covers and high-density neoprene gaskets designed for 10mm to 12mm glass panels.',
    shortDescription: 'Pair of top & bottom SS 304 patch fittings for glass doors.',
    images: ['https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80'],
    price: 2150,
    mrp: 2750,
    discount: 22,
    unit: 'Pair (Top & Bottom)',
    packSize: '1 Top Patch + 1 Bottom Patch with Pivot Bush',
    gstRate: 18,
    rating: 4.8,
    reviewCount: 46,
    inStock: true,
    stockCount: 65,
    isBulkEligible: true,
    deliverySpeedAvailable: ['ASAP_60', 'EXPRESS_90', 'SCHEDULED'],
    specifications: {
      'Product Type': 'Patch Fitting Set',
      'Hardware Type': 'Frameless Patch Fitting',
      'Glass Thickness Compatibility': '10mm - 12mm Toughened Glass',
      'Material': 'Drop-Forged Aluminium Alloy with SS 304 Skin',
      'Finish': 'Satin Stainless Steel (SSS)',
      'Mounting Type': 'Clamp-on Clamp Fitting (No Frame)',
      'Application': 'Main Entrance Frameless Glass Doors'
    }
  },

  // 35. Welding Consumables
  {
    id: 'prod-weld-1',
    name: 'Ador Welding Superbond E6013 Rutile Mild Steel Welding Electrodes (3.15mm x 350mm, 5 kg Box)',
    slug: 'ador-superbond-e6013-mild-steel-welding-electrodes-3-15mm',
    sku: 'WLD-ADR-6013-315',
    brand: 'Bosch Power Tools',
    brandSlug: 'bosch',
    category: 'Welding Consumables',
    categorySlug: 'welding-consumables',
    subcategory: 'Mild Steel Welding Electrodes (3.15mm)',
    subcategorySlug: 'welding-electrodes',
    description: 'Medium coated all-position rutile electrode for smooth arc, low spatter, easy slag detachability, and radiographic quality welds on structural steel.',
    shortDescription: '3.15mm E6013 general purpose mild steel welding electrodes (5kg).',
    images: ['https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80'],
    price: 890,
    mrp: 1100,
    discount: 19,
    unit: 'Box (5 kg)',
    packSize: '5 Kilogram Box (Approx. 150 Rods)',
    gstRate: 18,
    rating: 4.9,
    reviewCount: 165,
    inStock: true,
    stockCount: 240,
    isBulkEligible: true,
    deliverySpeedAvailable: ['ASAP_60', 'EXPRESS_90', 'SCHEDULED'],
    specifications: {
      'Product Type': 'Welding Electrode',
      'Welding Type': 'Shielded Metal Arc Welding (SMAW / Stick)',
      'Material Compatibility': 'Structural Mild Steel (IS 2062)',
      'Electrode Diameter': '3.15 mm (10 SWG)',
      'Size': '350 mm Length',
      'Pack Weight': '5 kg Box (Approx 150 Rods)',
      'Application': 'Structural Steel Trusses, Columns & Rebar Laps'
    }
  },
  {
    id: 'prod-weld-2',
    name: 'Bosch Professional 100mm (4 Inch) Thin Stainless Steel & Metal Abrasive Cutting Discs (Pack of 25)',
    slug: 'bosch-100mm-thin-metal-cutting-discs-pack-25',
    sku: 'WLD-BOS-CUT-100MM',
    brand: 'Bosch Power Tools',
    brandSlug: 'bosch',
    category: 'Welding Consumables',
    categorySlug: 'welding-consumables',
    subcategory: 'Industrial Abrasive Cutting Discs',
    subcategorySlug: 'cutting-discs',
    description: 'Bonded premium aluminum oxide abrasive grains with fiberglass reinforcement mesh for burr-free fast cutting of rebar, angle iron, and stainless steel.',
    shortDescription: '100mm (4-inch) thin abrasive cut-off wheels for angle grinders (Pack of 25).',
    images: ['https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80'],
    price: 750,
    mrp: 950,
    discount: 21,
    unit: 'Pack (25 Discs)',
    packSize: 'Pack of 25 Cutting Wheels',
    gstRate: 18,
    rating: 4.8,
    reviewCount: 190,
    inStock: true,
    stockCount: 300,
    isBulkEligible: true,
    deliverySpeedAvailable: ['ASAP_60', 'EXPRESS_90', 'SCHEDULED'],
    specifications: {
      'Product Type': 'Abrasive Cutting Disc',
      'Material Compatibility': 'Stainless Steel & Mild Steel Rebar',
      'Size': '100 mm (4 Inch) x 1.2 mm Thin Kerf',
      'Pack Weight': 'Pack of 25 Discs',
      'Application': 'Rapid Grinder Metal Cutting & Rebar Trimming'
    }
  },

  // 36. Ceiling & Flooring
  {
    id: 'prod-ceil-1',
    name: 'Saint-Gobain Gyproc 12.5mm Tapered-Edge Gypsum False Ceiling Board (6x4 ft)',
    slug: 'saint-gobain-gyproc-12-5mm-gypsum-ceiling-board-6x4',
    sku: 'CLG-SGB-GYP-125-64',
    brand: 'UltraTech Cement',
    brandSlug: 'ultratech',
    category: 'Ceiling & Flooring',
    categorySlug: 'ceiling-flooring',
    subcategory: 'Tapered Edge Gypsum Plaster Boards',
    subcategorySlug: 'gypsum-boards',
    description: 'High-purity natural gypsum plasterboard with multi-layer calendered paper facing and recessed tapered longitudinal edges for crack-free seamless flush jointing.',
    shortDescription: '12.5mm standard tapered edge gypsum false ceiling plasterboard (24 sq.ft).',
    images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'],
    price: 360,
    mrp: 440,
    discount: 18,
    unit: 'Board (6x4 ft)',
    packSize: '1 Board (1830 x 1220 x 12.5 mm / 24 sq.ft)',
    gstRate: 18,
    rating: 4.8,
    reviewCount: 220,
    inStock: true,
    stockCount: 850,
    isBulkEligible: true,
    deliverySpeedAvailable: ['SCHEDULED', 'NEXT_DAY'],
    specifications: {
      'Product Type': 'Gypsum False Ceiling Board',
      'Material': 'Natural Mineral Gypsum Core with Heavy Calendered Paper',
      'Flooring / Ceiling Type': 'False Ceiling Grid System',
      'Size': '6x4 ft Board (1830 x 1220 mm)',
      'Thickness': '12.5 mm Heavy Duty',
      'Colour': 'Ivory White Paper',
      'Finish': 'Tapered Recessed Edge for Jointing',
      'Coverage Area': '24 sq.ft per Board',
      'Application': 'Living Room & Bedroom Designer False Ceilings'
    }
  },
  {
    id: 'prod-ceil-2',
    name: 'Greenpanel AC4 Grade Click-Lock Interlocking Wooden Laminate Flooring Planks (8mm, Natural Oak)',
    slug: 'greenpanel-ac4-click-lock-wooden-laminate-flooring-oak',
    sku: 'FLR-GPN-AC4-OAK-8MM',
    brand: 'Greenply',
    brandSlug: 'greenply',
    category: 'Ceiling & Flooring',
    categorySlug: 'ceiling-flooring',
    subcategory: 'AC4 Grade Wooden Laminate Flooring',
    subcategorySlug: 'laminate-flooring',
    description: 'European AC4 commercial grade scratch-resistant wooden laminate flooring with moisture-resistant HDF core and glue-free click interlocking tongue-and-groove joints.',
    shortDescription: '8mm AC4 grade commercial scratch-resistant wooden laminate flooring (21.5 sq.ft/box).',
    images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'],
    price: 1890,
    mrp: 2400,
    discount: 21,
    unit: 'Box (8 Planks)',
    packSize: 'Box of 8 Planks (21.5 sq.ft Coverage)',
    gstRate: 18,
    rating: 4.9,
    reviewCount: 135,
    inStock: true,
    stockCount: 180,
    isBulkEligible: true,
    deliverySpeedAvailable: ['ASAP_60', 'EXPRESS_90', 'SCHEDULED'],
    specifications: {
      'Product Type': 'Wooden Laminate Flooring Plank',
      'Material': 'HDF High-Density Moisture-Resistant Fiberboard Core',
      'Flooring / Ceiling Type': 'Interlocking AC4 Click Laminate Flooring',
      'Size': '1200 x 195 mm Planks',
      'Thickness': '8.0 mm AC4 Grade',
      'Colour': 'Natural Oak Woodgrain',
      'Finish': 'Embossed-in-Register (EIR) Textured Woodgrain',
      'Pattern': 'Wood Plank Grain',
      'Coverage Area': '21.5 sq.ft per Box (8 Planks)',
      'Application': 'Residential Bedroom & Living Room Floors'
    }
  },

  // 52. Reference Product A: Ebco Mounting Screw Kit (Option Cards UI)
  {
    id: 'prod-ebco-screw-kit',
    name: 'Ebco Mounting Screw Kit for Pro-Lift Bed Fittings',
    slug: 'ebco-mounting-screw-kit-for-pro-lift-bed-fittings',
    sku: 'PLBF-M6K',
    brand: 'Ebco',
    brandSlug: 'ebco',
    category: 'Wardrobe & Bed Fittings',
    categorySlug: 'wardrobe-bed-fittings',
    subcategory: 'Bed & Cabinet Hydraulics',
    subcategorySlug: 'bed-cabinet-hydraulics',
    description: 'High-tensile zinc-plated carbon steel hex bolts, nylon-insert lock nuts, and load-spreading washers manufactured specifically for Ebco Pro-Lift and Pro-Lift Heavy Bed Fittings. Engineered to withstand cyclic hydraulic gas lift stress without shearing or loosening.',
    shortDescription: 'High-tensile mounting hardware kit for hydraulic bed lift mechanisms.',
    images: [
      'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=800&q=80'
    ],
    price: 44,
    mrp: 64,
    discount: 31,
    unit: '1 Set (6N Bolt, 6N Nut, 6N Washer)',
    packSize: '1 Set',
    gstRate: 18,
    rating: 4.8,
    reviewCount: 142,
    inStock: true,
    stockCount: 250,
    isBulkEligible: true,
    bulkPricing: [
      { minQuantity: 10, discountPercentage: 5, unitPrice: 42 },
      { minQuantity: 50, discountPercentage: 10, unitPrice: 39 }
    ],
    deliverySpeedAvailable: ['ASAP_60', 'EXPRESS_90', 'SCHEDULED'],
    attributes: [
      {
        id: 'attr-screw-size',
        name: 'Size',
        uiType: 'cards',
        options: ['M6, PLBF-M6K', 'M8, PLBF-M8K']
      }
    ],
    variants: [
      {
        id: 'v-ebco-m6',
        sku: 'PLBF-M6K',
        name: 'M6, PLBF-M6K',
        attributes: { 'Size': 'M6, PLBF-M6K' },
        price: 44,
        mrp: 64,
        discount: 31,
        stock: 150,
        inStock: true,
        image: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 'v-ebco-m8',
        sku: 'PLBF-M8K',
        name: 'M8, PLBF-M8K',
        attributes: { 'Size': 'M8, PLBF-M8K' },
        price: 67,
        mrp: 85,
        discount: 21,
        stock: 100,
        inStock: true,
        image: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=800&q=80'
      }
    ],
    specifications: {
      'Product Type': 'Mounting Screw Kit for Pro-Lift Bed Fittings',
      'Material': 'Grade 8.8 High-Tensile Carbon Steel',
      'Finish': 'Yellow Zinc Passivated Anti-Corrosion',
      'Thread Type': 'Metric Coarse ISO Thread',
      'Contents': '6 N Hex Bolts, 6 N Nyloc Nuts, 6 N Flat Washers',
      'Application': 'Pro-Lift Bed Frame & Gas Spring Mounting'
    }
  },

  // 53. Reference Product B: Anchor GI Metal Back Box (Dropdown Selector UI)
  {
    id: 'prod-anchor-gi-box',
    name: 'Anchor GI Metal Back Box',
    slug: 'anchor-gi-metal-back-box',
    sku: 'ANC-GI-2MOD',
    brand: 'Anchor',
    brandSlug: 'anchor',
    category: 'Wires, MCB & Distribution Boards',
    categorySlug: 'wires-mcb-distribution-boards',
    subcategory: 'Electrical Conduits & GI Boxes',
    subcategorySlug: 'conduits-gi-boxes',
    description: 'Heavy gauge 20-SWG pre-galvanized sheet steel electrical flush concealed modular metal box. Features rust-inhibiting zinc coating, precision brass earth terminal, multiple 20mm and 25mm conduit knockouts, and standard modular mounting screws for modular switch plates.',
    shortDescription: 'Heavy-duty 20-SWG pre-galvanized concealed modular switch box.',
    images: [
      'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'
    ],
    price: 45,
    mrp: 93,
    discount: 52,
    unit: '1 Piece',
    packSize: '1 Piece',
    gstRate: 18,
    rating: 4.7,
    reviewCount: 189,
    inStock: true,
    stockCount: 400,
    isBulkEligible: true,
    bulkPricing: [
      { minQuantity: 20, discountPercentage: 6, unitPrice: 42 },
      { minQuantity: 100, discountPercentage: 12, unitPrice: 39 }
    ],
    deliverySpeedAvailable: ['ASAP_60', 'EXPRESS_90', 'SCHEDULED'],
    attributes: [
      {
        id: 'attr-anchor-size',
        name: 'Size',
        uiType: 'dropdown',
        options: ['2 Module', '4 Module', '6 Module', '8 Module']
      }
    ],
    variants: [
      {
        id: 'v-anchor-2m',
        sku: 'ANC-GI-2MOD',
        name: '2 Module',
        attributes: { 'Size': '2 Module' },
        price: 45,
        mrp: 93,
        discount: 52,
        stock: 400,
        inStock: true
      },
      {
        id: 'v-anchor-4m',
        sku: 'ANC-GI-4MOD',
        name: '4 Module',
        attributes: { 'Size': '4 Module' },
        price: 75,
        mrp: 130,
        discount: 42,
        stock: 250,
        inStock: true
      },
      {
        id: 'v-anchor-6m',
        sku: 'ANC-GI-6MOD',
        name: '6 Module',
        attributes: { 'Size': '6 Module' },
        price: 110,
        mrp: 180,
        discount: 39,
        stock: 180,
        inStock: true
      },
      {
        id: 'v-anchor-8m',
        sku: 'ANC-GI-8MOD',
        name: '8 Module',
        attributes: { 'Size': '8 Module' },
        price: 145,
        mrp: 220,
        discount: 34,
        stock: 0,
        inStock: false // Out of stock example
      }
    ],
    specifications: {
      'Product Type': 'Concealed Metal Switch Back Box',
      'Material': '20-SWG Pre-Galvanized Sheet Steel',
      'Coating': '120 GSM Zinc Galvanization',
      'Earthing': 'Solid Brass M4 Grounding Terminal Screw',
      'Knockouts': '4x 20mm, 2x 25mm Conduit Entry Knockouts',
      'Standard': 'IS 513 / IS 277 Compliant'
    }
  },

  // 54. Reference Product C: Flexible PVC Electrical Conduit Pipe Roll (Multi-attribute: Pills + Cards)
  {
    id: 'prod-conduit-pipe-roll',
    name: 'Flexible PVC Electrical Conduit Pipe Roll',
    slug: 'flexible-pvc-electrical-conduit-pipe-roll',
    sku: 'CON-PVC-GRY-20MM',
    brand: 'Astral',
    brandSlug: 'astral',
    category: 'Wires, MCB & Distribution Boards',
    categorySlug: 'wires-mcb-distribution-boards',
    subcategory: 'Electrical Conduits & GI Boxes',
    subcategorySlug: 'conduits-gi-boxes',
    description: 'Heavy duty corrugated flexible PVC electrical conduit pipe roll with high compressive strength, UV stabilization, and flame-retardant properties. Ideal for false ceiling electrical wiring, slab drops, curved column runs, and surface conduit routing without requiring angle bends.',
    shortDescription: 'Corrugated flame-retardant flexible PVC conduit pipe roll.',
    images: [
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'
    ],
    price: 280,
    mrp: 350,
    discount: 20,
    unit: '1 Roll',
    packSize: '50 Metres Roll',
    gstRate: 18,
    rating: 4.8,
    reviewCount: 97,
    inStock: true,
    stockCount: 145,
    isBulkEligible: true,
    bulkPricing: [
      { minQuantity: 5, discountPercentage: 5, unitPrice: 266 },
      { minQuantity: 20, discountPercentage: 10, unitPrice: 252 }
    ],
    deliverySpeedAvailable: ['ASAP_60', 'EXPRESS_90', 'SCHEDULED'],
    attributes: [
      {
        id: 'attr-conduit-color',
        name: 'Colour',
        uiType: 'pills',
        options: ['Grey', 'White', 'Black']
      },
      {
        id: 'attr-conduit-size',
        name: 'Size',
        uiType: 'cards',
        options: ['20mm - 50 meters', '25mm - 25 meters']
      }
    ],
    variants: [
      {
        id: 'v-conduit-gry-20',
        sku: 'CON-PVC-GRY-20MM',
        name: 'Grey / 20mm - 50 meters',
        attributes: { 'Colour': 'Grey', 'Size': '20mm - 50 meters' },
        price: 280,
        mrp: 350,
        discount: 20,
        stock: 80,
        inStock: true
      },
      {
        id: 'v-conduit-gry-25',
        sku: 'CON-PVC-GRY-25MM',
        name: 'Grey / 25mm - 25 meters',
        attributes: { 'Colour': 'Grey', 'Size': '25mm - 25 meters' },
        price: 260,
        mrp: 320,
        discount: 19,
        stock: 65,
        inStock: true
      },
      {
        id: 'v-conduit-wht-20',
        sku: 'CON-PVC-WHT-20MM',
        name: 'White / 20mm - 50 meters',
        attributes: { 'Colour': 'White', 'Size': '20mm - 50 meters' },
        price: 290,
        mrp: 360,
        discount: 19,
        stock: 50,
        inStock: true
      },
      {
        id: 'v-conduit-wht-25',
        sku: 'CON-PVC-WHT-25MM',
        name: 'White / 25mm - 25 meters',
        attributes: { 'Colour': 'White', 'Size': '25mm - 25 meters' },
        price: 270,
        mrp: 330,
        discount: 18,
        stock: 40,
        inStock: true
      },
      {
        id: 'v-conduit-blk-20',
        sku: 'CON-PVC-BLK-20MM',
        name: 'Black / 20mm - 50 meters',
        attributes: { 'Colour': 'Black', 'Size': '20mm - 50 meters' },
        price: 280,
        mrp: 350,
        discount: 20,
        stock: 35,
        inStock: true
      },
      {
        id: 'v-conduit-blk-25',
        sku: 'CON-PVC-BLK-25MM',
        name: 'Black / 25mm - 25 meters',
        attributes: { 'Colour': 'Black', 'Size': '25mm - 25 meters' },
        price: 260,
        mrp: 320,
        discount: 19,
        stock: 0,
        inStock: false // Out of stock combination
      }
    ],
    specifications: {
      'Product Type': 'Corrugated Flexible Electrical Conduit Pipe',
      'Material': 'Rigid Unplasticized PVC (uPVC) with Flame Retardant Additives',
      'Fire Rating': 'Self-Extinguishing V-0 Grade as per UL 94',
      'Working Temperature': '-5°C to +60°C',
      'Compressive Strength': '> 750 N Medium Duty',
      'Standard': 'IS 9537 Part-3 / IEC 61386 Compliant'
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
