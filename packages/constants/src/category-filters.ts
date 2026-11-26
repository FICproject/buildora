import { Product } from '@buildora/types';

export type FilterType = 'checkbox' | 'range' | 'toggle';

export interface CategoryFilterDimension {
  id: string; // Unique identifier for the filter dimension
  name: string; // Human-readable display label
  type: FilterType;
  specKeys?: string[]; // Keys to look for in product.specifications
  catAttrKeys?: string[]; // Keys to look for in product.categoryAttributes
  isStandardField?: 'category' | 'brand' | 'subcategory' | 'price' | 'packSize' | 'rating' | 'inStock' | 'asap';
}

export interface FilterOption {
  value: string;
  label: string;
  count: number;
}

export interface AvailableCategoryFilter {
  id: string;
  name: string;
  type: FilterType;
  options: FilterOption[];
  minPrice?: number;
  maxPrice?: number;
}

export interface ActiveCategoryFilters {
  categories?: string[]; // Category slugs or names (for catalogue pages)
  brands: string[];
  subcategories: string[];
  inStockOnly: boolean;
  asapOnly: boolean;
  minPrice?: number;
  maxPrice?: number;
  specifications: Record<string, string[]>; // dimensionId -> selectedValues[]
  sortBy?: string;
  searchQuery?: string;
}

// -------------------------------------------------------------------------------------
// CONFIGURATION FOR ALL 28 MASTER CATEGORIES (HomeRun Strict Reference Filter Taxonomy)
// STRICT REQUIREMENT: NO REDUNDANT CATEGORY FILTER ON PLP (Rule 2 & Rule 9)
// -------------------------------------------------------------------------------------
export const CATEGORY_FILTER_CONFIGS: Record<string, CategoryFilterDimension[]> = {
  // 1. Cement & Concrete
  'cement-concrete': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'cementType', name: 'Type', type: 'checkbox', specKeys: ['Cement Type', 'Standard'], catAttrKeys: ['cementType'] },
    { id: 'grade', name: 'Grade', type: 'checkbox', specKeys: ['Grade', 'Compressive Strength (28 Days)'], catAttrKeys: ['grade'] },
    { id: 'packSize', name: 'Pack Size', type: 'checkbox', isStandardField: 'packSize', specKeys: ['Packaging', 'Bag Type'] },
    { id: 'colour', name: 'Colors', type: 'checkbox', specKeys: ['Colour', 'Color', 'Whiteness'] },
    { id: 'rating', name: 'Rating', type: 'checkbox', isStandardField: 'rating' },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 2. Tiling & Tile Adhesives
  'tiling-tile-adhesives': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'tileType', name: 'Type', type: 'checkbox', specKeys: ['Tile Type', 'Product Type', 'Adhesive Type'] },
    { id: 'tileDimensions', name: 'Size', type: 'checkbox', specKeys: ['Tile Dimensions', 'Dimensions', 'Size'] },
    { id: 'tileMaterial', name: 'Material', type: 'checkbox', specKeys: ['Tile Material', 'Material'] },
    { id: 'surfaceFinish', name: 'Finish', type: 'checkbox', specKeys: ['Surface Finish', 'Finish'] },
    { id: 'colour', name: 'Colors', type: 'checkbox', specKeys: ['Colour', 'Color'] },
    { id: 'grade', name: 'Grade', type: 'checkbox', specKeys: ['Grade', 'Standard'] },
    { id: 'packSize', name: 'Pack Size', type: 'checkbox', isStandardField: 'packSize', specKeys: ['Coverage', 'Coverage per Box', 'Packaging'] },
    { id: 'rating', name: 'Rating', type: 'checkbox', isStandardField: 'rating' },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 3. Plywood, MDF & HDHMR
  'plywood-mdf-hdhmr': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'grade', name: 'Grade', type: 'checkbox', specKeys: ['Grade', 'Preservative Treatment'] },
    { id: 'thickness', name: 'Thickness', type: 'checkbox', specKeys: ['Thickness'] },
    { id: 'dimensions', name: 'Size', type: 'checkbox', specKeys: ['Dimensions', 'Size'] },
    { id: 'surfaceFinish', name: 'Finish', type: 'checkbox', specKeys: ['Surface Finish', 'Surface'] },
    { id: 'application', name: 'Application', type: 'checkbox', specKeys: ['Application', 'Density'] },
    { id: 'rating', name: 'Rating', type: 'checkbox', isStandardField: 'rating' },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 4. Adhesives
  'adhesives': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'compatibility', name: 'Material', type: 'checkbox', specKeys: ['Compatibility', 'Material Compatibility'] },
    { id: 'bondingType', name: 'Type', type: 'checkbox', specKeys: ['Water Resistance', 'Setting Time', 'Product Type'] },
    { id: 'packSize', name: 'Pack Size', type: 'checkbox', isStandardField: 'packSize', specKeys: ['Spread Coverage', 'Packaging'] },
    { id: 'rating', name: 'Rating', type: 'checkbox', isStandardField: 'rating' },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 5. Waterproofing
  'waterproofing': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'applicationArea', name: 'Application', type: 'checkbox', specKeys: ['Application Area', 'Compatibility'] },
    { id: 'materialBase', name: 'Material', type: 'checkbox', specKeys: ['Material', 'Base Type', 'Standard'] },
    { id: 'packSize', name: 'Pack Size', type: 'checkbox', isStandardField: 'packSize', specKeys: ['Dosage', 'Packaging'] },
    { id: 'rating', name: 'Rating', type: 'checkbox', isStandardField: 'rating' },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 6. Painting & Finishes
  'painting-finishes': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'surfaceFinish', name: 'Finish', type: 'checkbox', specKeys: ['Finish', 'Surface Finish'] },
    { id: 'packSize', name: 'Pack Size', type: 'checkbox', isStandardField: 'packSize', specKeys: ['Coverage', 'Packaging'] },
    { id: 'surfaceType', name: 'Application', type: 'checkbox', specKeys: ['Surface Type', 'Warranty', 'Drying Time', 'Application'] },
    { id: 'rating', name: 'Rating', type: 'checkbox', isStandardField: 'rating' },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 7. Hinges, Channels & Handles
  'hinges-channels-handles': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'material', name: 'Material', type: 'checkbox', specKeys: ['Material'] },
    { id: 'finish', name: 'Finish', type: 'checkbox', specKeys: ['Finish'] },
    { id: 'length', name: 'Size', type: 'checkbox', specKeys: ['Length', 'Size'] },
    { id: 'crankType', name: 'Type', type: 'checkbox', specKeys: ['Crank Type', 'Opening Angle', 'Product Type'] },
    { id: 'loadCapacity', name: 'Load Capacity', type: 'checkbox', specKeys: ['Load Capacity', 'Extension'] },
    { id: 'rating', name: 'Rating', type: 'checkbox', isStandardField: 'rating' },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 8. Kitchen Systems & Accessories
  'kitchen-systems-accessories': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'material', name: 'Material', type: 'checkbox', specKeys: ['Grade', 'Material'] },
    { id: 'dimensions', name: 'Size', type: 'checkbox', specKeys: ['Dimensions', 'Slide Length'] },
    { id: 'weightRating', name: 'Load Capacity', type: 'checkbox', specKeys: ['Weight Rating', 'Wire Gauge'] },
    { id: 'damping', name: 'Features', type: 'checkbox', specKeys: ['Damping', 'Wall Thickness'] },
    { id: 'rating', name: 'Rating', type: 'checkbox', isStandardField: 'rating' },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 9. Wardrobe & Bed Fittings
  'wardrobe-bed-fittings': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'material', name: 'Material', type: 'checkbox', specKeys: ['Material'] },
    { id: 'finish', name: 'Finish', type: 'checkbox', specKeys: ['Finish'] },
    { id: 'loadCapacity', name: 'Load Capacity', type: 'checkbox', specKeys: ['Load Capacity'] },
    { id: 'mountingType', name: 'Type', type: 'checkbox', specKeys: ['Mounting Type', 'Application', 'Size'] },
    { id: 'rating', name: 'Rating', type: 'checkbox', isStandardField: 'rating' },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 10. Door Locks & Hardware
  'door-locks-hardware': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'material', name: 'Material', type: 'checkbox', specKeys: ['Material'] },
    { id: 'shackleMaterial', name: 'Type', type: 'checkbox', specKeys: ['Shackle Material', 'Levers', 'Locking Mechanism'] },
    { id: 'finish', name: 'Finish', type: 'checkbox', specKeys: ['Finish'] },
    { id: 'rating', name: 'Rating', type: 'checkbox', isStandardField: 'rating' },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 11. Wires, MCB & Distribution Boards
  'wires-mcb-distribution-boards': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'conductorSize', name: 'Size', type: 'checkbox', specKeys: ['Conductor Size'] },
    { id: 'currentCapacity', name: 'Rating', type: 'checkbox', specKeys: ['Current Carrying Capacity', 'Current Rating'] },
    { id: 'length', name: 'Length', type: 'checkbox', specKeys: ['Length'] },
    { id: 'insulation', name: 'Insulation', type: 'checkbox', specKeys: ['Insulation', 'Certification'] },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 12. Switches & Sockets
  'switches-sockets': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'moduleSize', name: 'Size', type: 'checkbox', specKeys: ['Module Size', 'Number of Modules'] },
    { id: 'ampRating', name: 'Rating', type: 'checkbox', specKeys: ['Amp Rating'] },
    { id: 'colour', name: 'Colors', type: 'checkbox', specKeys: ['Colour', 'Color'] },
    { id: 'seriesModel', name: 'Type', type: 'checkbox', specKeys: ['Series / Model', 'Switch Type', 'Socket Type', 'Product Type'] },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 13. Electrical Conduits
  'electrical-conduits': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'nominalDiameter', name: 'Size', type: 'checkbox', specKeys: ['Nominal Diameter', 'Size'] },
    { id: 'stressClass', name: 'Grade', type: 'checkbox', specKeys: ['Stress Class', 'Standard', 'Ways'] },
    { id: 'material', name: 'Material', type: 'checkbox', specKeys: ['Material'] },
    { id: 'rating', name: 'Rating', type: 'checkbox', isStandardField: 'rating' },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 14. Lighting
  'lighting': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'wattage', name: 'Wattage', type: 'checkbox', specKeys: ['Wattage'] },
    { id: 'colorTemperature', name: 'Color Temperature', type: 'checkbox', specKeys: ['Color Temperature', 'Colour Temperature'] },
    { id: 'beamAngle', name: 'Size', type: 'checkbox', specKeys: ['Beam Angle', 'Ceiling Cutout'] },
    { id: 'productType', name: 'Type', type: 'checkbox', specKeys: ['Product Type'] },
    { id: 'rating', name: 'Rating', type: 'checkbox', isStandardField: 'rating' },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 15. Ceiling Fans & Exhaust
  'ceiling-fans-exhaust': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'sweepSize', name: 'Size', type: 'checkbox', specKeys: ['Sweep Size'] },
    { id: 'wattage', name: 'Wattage', type: 'checkbox', specKeys: ['Wattage'] },
    { id: 'rpm', name: 'RPM', type: 'checkbox', specKeys: ['RPM', 'Air Delivery'] },
    { id: 'colour', name: 'Colors', type: 'checkbox', specKeys: ['Colour', 'Color'] },
    { id: 'productType', name: 'Type', type: 'checkbox', specKeys: ['Product Type', 'Control Type'] },
    { id: 'rating', name: 'Rating', type: 'checkbox', isStandardField: 'rating' },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 16. CPVC Pipes & Overhead Tanks
  'cpvc-pipes-overhead-tanks': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'nominalDiameter', name: 'Size', type: 'checkbox', specKeys: ['Nominal Diameter', 'Size'] },
    { id: 'pressureClass', name: 'Grade', type: 'checkbox', specKeys: ['Pressure Class'] },
    { id: 'temperature', name: 'Features', type: 'checkbox', specKeys: ['Max Operating Temp', 'Certification'] },
    { id: 'rating', name: 'Rating', type: 'checkbox', isStandardField: 'rating' },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 17. Sanitary & Bath Fittings
  'sanitary-bath-fittings': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'material', name: 'Material', type: 'checkbox', specKeys: ['Material'] },
    { id: 'finish', name: 'Finish', type: 'checkbox', specKeys: ['Finish', 'Colour'] },
    { id: 'installationType', name: 'Type', type: 'checkbox', specKeys: ['Installation Type', 'Product Type', 'Water Flow / Operating Type'] },
    { id: 'rating', name: 'Rating', type: 'checkbox', isStandardField: 'rating' },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 18. Kitchen Sinks & Faucets
  'kitchen-sinks-faucets': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'material', name: 'Material', type: 'checkbox', specKeys: ['Material', 'Body Material'] },
    { id: 'dimensions', name: 'Size', type: 'checkbox', specKeys: ['Overall Dimensions', 'Dimensions'] },
    { id: 'sheetThickness', name: 'Type', type: 'checkbox', specKeys: ['Sheet Thickness', 'Cartridge', 'Product Type'] },
    { id: 'rating', name: 'Rating', type: 'checkbox', isStandardField: 'rating' },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 19. Water Storage Tanks
  'water-storage-tanks': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'capacity', name: 'Capacity', type: 'checkbox', specKeys: ['Capacity'] },
    { id: 'layerConstruction', name: 'Type', type: 'checkbox', specKeys: ['Layer Construction'] },
    { id: 'dimensions', name: 'Size', type: 'checkbox', specKeys: ['Dimensions'] },
    { id: 'rating', name: 'Rating', type: 'checkbox', isStandardField: 'rating' },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 20. Power Tools & Accessories
  'power-tools-accessories': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'ratedPower', name: 'Wattage', type: 'checkbox', specKeys: ['Rated Power', 'Wattage'] },
    { id: 'impactEnergy', name: 'Type', type: 'checkbox', specKeys: ['Impact Energy', 'Tool Holder', 'Product Type'] },
    { id: 'drillingCapacity', name: 'Capacity', type: 'checkbox', specKeys: ['Drilling Dia in Concrete'] },
    { id: 'rating', name: 'Rating', type: 'checkbox', isStandardField: 'rating' },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 21. General Hardware & Tools
  'general-hardware-tools': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'material', name: 'Material', type: 'checkbox', specKeys: ['Material', 'Case Material', 'Head Material', 'Shaft Material'] },
    { id: 'dimensions', name: 'Size', type: 'checkbox', specKeys: ['Blade Length', 'Head Weight', 'Blade Width'] },
    { id: 'productType', name: 'Type', type: 'checkbox', specKeys: ['Product Type', 'Accuracy Class'] },
    { id: 'rating', name: 'Rating', type: 'checkbox', isStandardField: 'rating' },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 22. CCTV & Networking
  'cctv-networking': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'resolution', name: 'Resolution', type: 'checkbox', specKeys: ['Resolution'] },
    { id: 'networkType', name: 'Type', type: 'checkbox', specKeys: ['Network Type', 'Cable Length', 'Product Type', 'Camera Type'] },
    { id: 'connectivity', name: 'Features', type: 'checkbox', specKeys: ['Connectivity', 'Storage Compatibility', 'Indoor / Outdoor'] },
    { id: 'rating', name: 'Rating', type: 'checkbox', isStandardField: 'rating' },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 23. Home Appliances & Power Backup
  'home-appliances-power-backup': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'capacity', name: 'Capacity', type: 'checkbox', specKeys: ['Capacity'] },
    { id: 'powerRating', name: 'Power Rating', type: 'checkbox', specKeys: ['Rated Power Output', 'Heating Element'] },
    { id: 'features', name: 'Features', type: 'checkbox', specKeys: ['Waveform', 'Display', 'Energy Rating', 'Pressure Rating'] },
    { id: 'rating', name: 'Rating', type: 'checkbox', isStandardField: 'rating' },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 24. Safety & Workwear
  'safety-workwear': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'safetyCategory', name: 'Grade', type: 'checkbox', specKeys: ['Safety Category', 'Protection Rating'] },
    { id: 'size', name: 'Size', type: 'checkbox', specKeys: ['Size'] },
    { id: 'material', name: 'Material', type: 'checkbox', specKeys: ['Material'] },
    { id: 'colour', name: 'Colors', type: 'checkbox', specKeys: ['Colour', 'Color'] },
    { id: 'rating', name: 'Rating', type: 'checkbox', isStandardField: 'rating' },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 25. Glass Door Hardware
  'glass-door-hardware': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'glassThickness', name: 'Thickness', type: 'checkbox', specKeys: ['Glass Thickness Compatibility'] },
    { id: 'material', name: 'Material', type: 'checkbox', specKeys: ['Material'] },
    { id: 'finish', name: 'Finish', type: 'checkbox', specKeys: ['Finish'] },
    { id: 'mountingType', name: 'Type', type: 'checkbox', specKeys: ['Mounting Type', 'Size', 'Hardware Type'] },
    { id: 'rating', name: 'Rating', type: 'checkbox', isStandardField: 'rating' },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 26. Welding Consumables
  'welding-consumables': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'electrodeDiameter', name: 'Size', type: 'checkbox', specKeys: ['Electrode Diameter', 'Size'] },
    { id: 'materialCompatibility', name: 'Material', type: 'checkbox', specKeys: ['Material Compatibility'] },
    { id: 'packWeight', name: 'Pack Size', type: 'checkbox', specKeys: ['Pack Weight'] },
    { id: 'weldingType', name: 'Type', type: 'checkbox', specKeys: ['Welding Type', 'Product Type'] },
    { id: 'rating', name: 'Rating', type: 'checkbox', isStandardField: 'rating' },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 27. Bathroom Renovation Materials
  'bathroom-renovation-materials': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'sizeLength', name: 'Size', type: 'checkbox', specKeys: ['Length', 'Tank Capacity', 'Size'] },
    { id: 'material', name: 'Material', type: 'checkbox', specKeys: ['Material'] },
    { id: 'grateType', name: 'Type', type: 'checkbox', specKeys: ['Grate Type', 'Installation', 'Actuator Plate'] },
    { id: 'rating', name: 'Rating', type: 'checkbox', isStandardField: 'rating' },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 28. Ceiling & Flooring
  'ceiling-flooring': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'material', name: 'Material', type: 'checkbox', specKeys: ['Material'] },
    { id: 'thickness', name: 'Thickness', type: 'checkbox', specKeys: ['Thickness'] },
    { id: 'size', name: 'Size', type: 'checkbox', specKeys: ['Size'] },
    { id: 'finish', name: 'Finish', type: 'checkbox', specKeys: ['Finish', 'Pattern'] },
    { id: 'coverageArea', name: 'Features', type: 'checkbox', specKeys: ['Coverage Area'] },
    { id: 'productType', name: 'Type', type: 'checkbox', specKeys: ['Flooring / Ceiling Type', 'Product Type'] },
    { id: 'rating', name: 'Rating', type: 'checkbox', isStandardField: 'rating' },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 29. New Launches (HomeRun Reference Parity: Brand, Type, Price, Size)
  // Strictly omit Category filter as customers navigate directly via Desktop Category Navigation
  'new-launches': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    {
      id: 'type',
      name: 'Type',
      type: 'checkbox',
      specKeys: ['Product Type', 'Type', 'Crank Type', 'Bonding Type', 'Tile Type', 'Mounting Type'],
      catAttrKeys: ['type', 'productType']
    },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' },
    {
      id: 'size',
      name: 'Size',
      type: 'checkbox',
      specKeys: ['Size'],
      catAttrKeys: ['size']
    }
  ]
};

// -------------------------------------------------------------------------------------
// DYNAMIC OPTION EXTRACTION ENGINE (PHASE 5: NO EMPTY / IRRELEVANT FILTERS)
// -------------------------------------------------------------------------------------

export interface ChildCategoryMeta {
  id: string;
  name: string;
  slug: string;
  categorySlug?: string;
}

/**
 * Computes the Child Category ("Category") filter dimension for an active Main Category,
 * showing ONLY child categories belonging to that Main Category with accurate product counts.
 */
export function buildChildCategoryFilter(
  categoryProducts: Product[],
  childCategories: ChildCategoryMeta[] = []
): AvailableCategoryFilter | null {
  const countsMap = new Map<string, { label: string; value: string; count: number }>();

  for (const child of childCategories) {
    countsMap.set(child.slug.toLowerCase(), {
      value: child.slug,
      label: child.name,
      count: 0,
    });
  }

  for (const p of categoryProducts) {
    const subSlug = (p.subcategorySlug || '').trim();
    const subName = (p.subcategory || '').trim();
    const key = subSlug.toLowerCase() || subName.toLowerCase();
    if (!key) continue;

    // Match existing taxonomy child category first
    const existing =
      countsMap.get(subSlug.toLowerCase()) ||
      Array.from(countsMap.values()).find(
        (v) => v.label.toLowerCase() === subName.toLowerCase() || v.value.toLowerCase() === subSlug.toLowerCase()
      );

    if (existing) {
      existing.count += 1;
    } else if (childCategories.length === 0) {
      // Fallback only if caller didn't pass canonical childCategories
      const val = subSlug || subName;
      const cur = countsMap.get(val.toLowerCase()) || {
        value: val,
        label: subName || subSlug,
        count: 0,
      };
      cur.count += 1;
      countsMap.set(val.toLowerCase(), cur);
    }
  }

  const options = Array.from(countsMap.values());
  if (options.length === 0) return null;

  return {
    id: 'subcategory',
    name: 'Category',
    type: 'checkbox',
    options,
  };
}

/**
 * Extracts all valid, available filter options for a category based on the actual products in that category.
 * Prepends the active Main Category's Child Categories ("Category") filter when child categories exist.
 */
export function getAvailableFiltersForCategory(
  categorySlug: string,
  categoryProducts: Product[],
  childCategories?: ChildCategoryMeta[]
): AvailableCategoryFilter[] {
  const rawDimensions = CATEGORY_FILTER_CONFIGS[categorySlug] || [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'price', name: 'Price Range', type: 'range', isStandardField: 'price' }
  ];

  const dimensions = rawDimensions.filter(
    (dim) => dim.id !== 'subcategory' && dim.id !== 'category' && dim.name.toLowerCase() !== 'category'
  );

  const availableFilters: AvailableCategoryFilter[] = [];
  const childCatFilter = buildChildCategoryFilter(categoryProducts, childCategories || []);
  if (childCatFilter) {
    availableFilters.push(childCatFilter);
  }

  for (const dim of dimensions) {
    if (dim.type === 'range') {
      // Calculate min and max price among category products
      if (categoryProducts.length > 0) {
        const prices = categoryProducts.map((p) => p.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        availableFilters.push({
          id: dim.id,
          name: dim.name,
          type: 'range',
          options: [],
          minPrice: Math.floor(minPrice / 10) * 10,
          maxPrice: Math.ceil(maxPrice / 10) * 10
        });
      }
      continue;
    }

    // Checkbox dimension: collect counts per value
    const countsMap = new Map<string, number>();

    for (const p of categoryProducts) {
      let valuesFound: string[] = [];

      if (dim.isStandardField === 'brand') {
        if (p.brand) valuesFound.push(p.brand);
      } else if (dim.isStandardField === 'packSize') {
        if (p.packSize) valuesFound.push(p.packSize);
        else if (p.unit) valuesFound.push(p.unit);
      } else if (dim.isStandardField === 'rating') {
        if (p.rating >= 4.5) {
          valuesFound.push('4.5★ & above');
          valuesFound.push('4★ & above');
          valuesFound.push('3★ & above');
        } else if (p.rating >= 4.0) {
          valuesFound.push('4★ & above');
          valuesFound.push('3★ & above');
        } else if (p.rating >= 3.0) {
          valuesFound.push('3★ & above');
        }
      } else {
        // Check specifications
        if (dim.specKeys && p.specifications) {
          for (const key of dim.specKeys) {
            const val = p.specifications[key];
            if (val && typeof val === 'string' && val.trim()) {
              valuesFound.push(val.trim());
            }
          }
        }
        // Check categoryAttributes
        if (dim.catAttrKeys && p.categoryAttributes) {
          for (const key of dim.catAttrKeys) {
            const val = p.categoryAttributes[key];
            if (val && typeof val === 'string' && val.trim()) {
              valuesFound.push(val.trim());
            }
          }
        }

        // Direct product properties (Vendor / dynamic models)
        if (dim.id === 'type' || dim.name.toLowerCase() === 'type') {
          if ((p as any).productType && typeof (p as any).productType === 'string' && (p as any).productType.trim()) {
            valuesFound.push((p as any).productType.trim());
          }
        }
        if (dim.id === 'size' || dim.name.toLowerCase() === 'size') {
          if ((p as any).size && typeof (p as any).size === 'string' && (p as any).size.trim()) {
            valuesFound.push((p as any).size.trim());
          }
        }

        // Check dynamic product attributes & variants
        if (p.attributes && Array.isArray(p.attributes)) {
          for (const attr of p.attributes) {
            const isMatch =
              attr.name.toLowerCase() === dim.name.toLowerCase() ||
              attr.name.toLowerCase() === dim.id.toLowerCase() ||
              Boolean(dim.specKeys?.some((k) => k.toLowerCase() === attr.name.toLowerCase()));
            if (isMatch && Array.isArray(attr.options)) {
              for (const opt of attr.options) {
                const optStr = typeof opt === 'string' ? opt : opt.value || opt.label;
                if (optStr && typeof optStr === 'string' && optStr.trim()) {
                  valuesFound.push(optStr.trim());
                }
              }
            }
          }
        }

        if (p.variants && Array.isArray(p.variants)) {
          for (const v of p.variants) {
            if (v.attributes) {
              for (const [attrK, attrV] of Object.entries(v.attributes)) {
                const isMatch =
                  attrK.toLowerCase() === dim.name.toLowerCase() ||
                  attrK.toLowerCase() === dim.id.toLowerCase() ||
                  Boolean(dim.specKeys?.some((k) => k.toLowerCase() === attrK.toLowerCase()));
                if (isMatch && typeof attrV === 'string' && attrV.trim()) {
                  valuesFound.push(attrV.trim());
                }
              }
            }
          }
        }
      }

      // De-duplicate within the same product
      const uniquePerProduct = new Set(valuesFound);
      for (const val of uniquePerProduct) {
        countsMap.set(val, (countsMap.get(val) || 0) + 1);
      }
    }

    // Only include this filter if at least 1 option exists!
    if (countsMap.size > 0) {
      const options: FilterOption[] = Array.from(countsMap.entries())
        .map(([value, count]) => ({
          value,
          label: value,
          count
        }))
        .sort((a, b) => {
          if (dim.isStandardField === 'rating') {
            // Sort rating descending (4.5, 4, 3)
            return b.value.localeCompare(a.value);
          }
          return b.count - a.count || a.label.localeCompare(b.label);
        });

      availableFilters.push({
        id: dim.id,
        name: dim.name,
        type: 'checkbox',
        options
      });
    }
  }

  return availableFilters;
}

/**
 * Extracts available filters across the entire product catalogue or when browsing /products.
 * If a single category is active, includes that category's specific specification filters without redundant category dropdown.
 */
export function getAvailableFiltersForCatalog(
  allProducts: Product[],
  selectedCategorySlug?: string,
  childCategories?: ChildCategoryMeta[]
): AvailableCategoryFilter[] {
  const availableFilters: AvailableCategoryFilter[] = [];

  // 1. Category Filter Dimension:
  // When a single Main Category is selected, show ONLY its Child Categories with counts;
  // otherwise show all Main Categories present in the catalogue.
  if (selectedCategorySlug) {
    const matchingMainProducts = allProducts.filter(
      (p) => p.categorySlug === selectedCategorySlug || p.category === selectedCategorySlug
    );
    const childFilter = buildChildCategoryFilter(matchingMainProducts, childCategories || []);
    if (childFilter) {
      availableFilters.push(childFilter);
    }
  } else {
    const categoryCounts = new Map<string, { label: string; count: number }>();
    for (const p of allProducts) {
      if (p.category) {
        const key = p.categorySlug || p.category;
        const cur = categoryCounts.get(key) || { label: p.category, count: 0 };
        cur.count += 1;
        categoryCounts.set(key, cur);
      }
    }
    if (categoryCounts.size > 0) {
      availableFilters.push({
        id: 'category',
        name: 'Category',
        type: 'checkbox',
        options: Array.from(categoryCounts.entries())
          .map(([value, entry]) => ({
            value,
            label: entry.label,
            count: entry.count
          }))
          .sort((a, b) => b.count - a.count)
      });
    }
  }

  // 2. Brand Filter Dimension
  const scopedForBrands = selectedCategorySlug
    ? allProducts.filter((p) => p.categorySlug === selectedCategorySlug || p.category === selectedCategorySlug)
    : allProducts;
  const brandCounts = new Map<string, number>();
  for (const p of scopedForBrands) {
    if (p.brand) {
      brandCounts.set(p.brand, (brandCounts.get(p.brand) || 0) + 1);
    }
  }
  if (brandCounts.size > 0) {
    availableFilters.push({
      id: 'brand',
      name: 'Brand',
      type: 'checkbox',
      options: Array.from(brandCounts.entries())
        .map(([value, count]) => ({
          value,
          label: value,
          count
        }))
        .sort((a, b) => b.count - a.count)
    });
  }

  // 3. Category-Specific Specification Filters (when a single category is active)
  if (selectedCategorySlug && CATEGORY_FILTER_CONFIGS[selectedCategorySlug]) {
    const specificFilters = getAvailableFiltersForCategory(selectedCategorySlug, scopedForBrands, childCategories);
    for (const sf of specificFilters) {
      if (sf.id !== 'brand' && sf.id !== 'price' && sf.id !== 'subcategory') {
        availableFilters.push(sf);
      }
    }
  }

  // 4. Price Range
  if (allProducts.length > 0) {
    const prices = allProducts.map((p) => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    availableFilters.push({
      id: 'price',
      name: 'Price',
      type: 'range',
      options: [],
      minPrice: Math.floor(minPrice / 10) * 10,
      maxPrice: Math.ceil(maxPrice / 10) * 10
    });
  }

  return availableFilters;
}

// -------------------------------------------------------------------------------------
// MULTI-DIMENSIONAL FILTERING ENGINE (PHASE 4)
// -------------------------------------------------------------------------------------

/**
 * Filters products based on active multi-dimensional filter constraints.
 */
export function applyCategoryFilters(
  products: Product[],
  activeFilters: ActiveCategoryFilters,
  categorySlug?: string
): Product[] {
  const dimensions = categorySlug ? CATEGORY_FILTER_CONFIGS[categorySlug] || [] : [];
  const dimMap = new Map(dimensions.map((d) => [d.id, d]));

  return products.filter((p) => {
    // 0. Category filter (OR within selected categories, case-insensitive across name/slug/id)
    if (activeFilters.categories && activeFilters.categories.length > 0) {
      const catTargets = activeFilters.categories.map((c) => c.toLowerCase());
      const pCatId = String((p as any).categoryId || '').toLowerCase();
      const matchCat =
        catTargets.includes((p.category || '').toLowerCase()) ||
        catTargets.includes((p.categorySlug || '').toLowerCase()) ||
        (pCatId && catTargets.includes(pCatId));
      if (!matchCat) {
        return false;
      }
    }

    // 1. Brand filter (OR within brands, case-insensitive)
    if (activeFilters.brands && activeFilters.brands.length > 0) {
      const brandTargets = activeFilters.brands.map((b) => b.toLowerCase());
      if (
        !brandTargets.includes((p.brand || '').toLowerCase()) &&
        !brandTargets.includes((p.brandSlug || '').toLowerCase())
      ) {
        return false;
      }
    }

    // 2. Subcategory / Child Category filter (OR within subcategories, case-insensitive across name/slug/id)
    if (activeFilters.subcategories && activeFilters.subcategories.length > 0) {
      const subTargets = activeFilters.subcategories.map((s) => s.toLowerCase());
      const pSubId = String((p as any).subcategoryId || '').toLowerCase();
      const matchSub =
        subTargets.includes((p.subcategory || '').toLowerCase()) ||
        subTargets.includes((p.subcategorySlug || '').toLowerCase()) ||
        (pSubId && subTargets.includes(pSubId));
      if (!matchSub) {
        return false;
      }
    }

    // 3. In-Stock Only
    if (activeFilters.inStockOnly && !p.inStock) {
      return false;
    }

    // 4. ASAP 60-min delivery
    if (activeFilters.asapOnly && !p.deliverySpeedAvailable.includes('ASAP_60')) {
      return false;
    }

    // 5. Price Range
    if (activeFilters.minPrice !== undefined && p.price < activeFilters.minPrice) {
      return false;
    }
    if (activeFilters.maxPrice !== undefined && p.price > activeFilters.maxPrice) {
      return false;
    }

    // 6. Dynamic Specification & Rating Filters (AND between different dimensions, OR within same dimension)
    if (activeFilters.specifications) {
      for (const [dimId, selectedValues] of Object.entries(activeFilters.specifications)) {
        if (!selectedValues || selectedValues.length === 0) continue;

        // Special handling for Star Rating
        if (dimId === 'rating') {
          const matchesRating = selectedValues.some((rStr) => {
            if (rStr.includes('4.5')) return p.rating >= 4.5;
            if (rStr.includes('4')) return p.rating >= 4.0;
            if (rStr.includes('3')) return p.rating >= 3.0;
            return false;
          });
          if (!matchesRating) {
            return false;
          }
          continue;
        }

        const dim = dimMap.get(dimId);
        if (!dim) continue;

        // Gather all values this product has for this dimension
        const productValues: string[] = [];

        if (dim.isStandardField === 'packSize') {
          if (p.packSize) productValues.push(p.packSize);
          if (p.unit) productValues.push(p.unit);
        }

        if (dim.specKeys && p.specifications) {
          for (const key of dim.specKeys) {
            const val = p.specifications[key];
            if (val && typeof val === 'string') {
              productValues.push(val.trim());
            }
          }
        }

        if (dim.catAttrKeys && p.categoryAttributes) {
          for (const key of dim.catAttrKeys) {
            const val = p.categoryAttributes[key];
            if (val && typeof val === 'string') {
              productValues.push(val.trim());
            }
          }
        }

        if (dim.id === 'type' || dim.name.toLowerCase() === 'type') {
          if ((p as any).productType && typeof (p as any).productType === 'string') {
            productValues.push((p as any).productType.trim());
          }
          if (p.subcategory && typeof p.subcategory === 'string') {
            productValues.push(p.subcategory.trim());
          }
        }

        if (dim.id === 'size' || dim.name.toLowerCase() === 'size') {
          if ((p as any).size && typeof (p as any).size === 'string') {
            productValues.push((p as any).size.trim());
          }
        }

        // Check dynamic product attributes & variants
        if (p.attributes && Array.isArray(p.attributes)) {
          for (const attr of p.attributes) {
            const isMatch =
              attr.name.toLowerCase() === dim.name.toLowerCase() ||
              attr.name.toLowerCase() === dim.id.toLowerCase() ||
              Boolean(dim.specKeys?.some((k) => k.toLowerCase() === attr.name.toLowerCase()));
            if (isMatch && Array.isArray(attr.options)) {
              for (const opt of attr.options) {
                const optStr = typeof opt === 'string' ? opt : opt.value || opt.label;
                if (optStr && typeof optStr === 'string' && optStr.trim()) {
                  productValues.push(optStr.trim());
                }
              }
            }
          }
        }

        if (p.variants && Array.isArray(p.variants)) {
          for (const v of p.variants) {
            if (v.attributes) {
              for (const [attrK, attrV] of Object.entries(v.attributes)) {
                const isMatch =
                  attrK.toLowerCase() === dim.name.toLowerCase() ||
                  attrK.toLowerCase() === dim.id.toLowerCase() ||
                  Boolean(dim.specKeys?.some((k) => k.toLowerCase() === attrK.toLowerCase()));
                if (isMatch && typeof attrV === 'string' && attrV.trim()) {
                  productValues.push(attrV.trim());
                }
              }
            }
          }
        }

        // Must match at least one of the selected values
        const matchesDimension = selectedValues.some((sv) =>
          productValues.some((pv) => pv.toLowerCase() === sv.toLowerCase())
        );

        if (!matchesDimension) {
          return false;
        }
      }
    }

    // 7. Search query
    if (activeFilters.searchQuery && activeFilters.searchQuery.trim()) {
      const q = activeFilters.searchQuery.toLowerCase().trim();
      const inName = p.name.toLowerCase().includes(q);
      const inBrand = p.brand.toLowerCase().includes(q);
      const inSku = p.sku.toLowerCase().includes(q);
      const inSub = p.subcategory.toLowerCase().includes(q);
      if (!inName && !inBrand && !inSku && !inSub) {
        return false;
      }
    }

    return true;
  });
}
