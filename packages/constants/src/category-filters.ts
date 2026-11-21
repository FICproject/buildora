import { Product } from '@buildora/types';

export type FilterType = 'checkbox' | 'range' | 'toggle';

export interface CategoryFilterDimension {
  id: string; // Unique identifier for the filter dimension
  name: string; // Human-readable display label
  type: FilterType;
  specKeys?: string[]; // Keys to look for in product.specifications
  catAttrKeys?: string[]; // Keys to look for in product.categoryAttributes
  isStandardField?: 'category' | 'brand' | 'subcategory' | 'price' | 'packSize' | 'inStock' | 'asap';
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
// -------------------------------------------------------------------------------------
export const CATEGORY_FILTER_CONFIGS: Record<string, CategoryFilterDimension[]> = {
  // 1. Cement & Concrete
  'cement-concrete': [
    { id: 'subcategory', name: 'Category', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'cementType', name: 'Type', type: 'checkbox', specKeys: ['Cement Type', 'Standard'], catAttrKeys: ['cementType'] },
    { id: 'grade', name: 'Grade', type: 'checkbox', specKeys: ['Grade', 'Compressive Strength (28 Days)'], catAttrKeys: ['grade'] },
    { id: 'colour', name: 'Colors', type: 'checkbox', specKeys: ['Colour', 'Color'] },
    { id: 'packSize', name: 'Pack Size', type: 'checkbox', isStandardField: 'packSize', specKeys: ['Packaging', 'Bag Type'] },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 2. Tiling & Tile Adhesives (Matches HomeRun Tiling reference exactly)
  'tiling-tile-adhesives': [
    { id: 'subcategory', name: 'Category', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'tileType', name: 'Type', type: 'checkbox', specKeys: ['Tile Type', 'Product Type'] },
    { id: 'tileDimensions', name: 'Size', type: 'checkbox', specKeys: ['Tile Dimensions', 'Dimensions', 'Size'] },
    { id: 'colour', name: 'Colors', type: 'checkbox', specKeys: ['Colour', 'Color'] },
    { id: 'tileMaterial', name: 'Material', type: 'checkbox', specKeys: ['Tile Material', 'Material'] },
    { id: 'grade', name: 'Grade', type: 'checkbox', specKeys: ['Grade', 'Standard'] },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' },
    { id: 'packSize', name: 'Pack Size', type: 'checkbox', isStandardField: 'packSize', specKeys: ['Coverage', 'Coverage per Box', 'Packaging'] }
  ],

  // 3. Plywood, MDF & HDHMR
  'plywood-mdf-hdhmr': [
    { id: 'subcategory', name: 'Category', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'grade', name: 'Grade', type: 'checkbox', specKeys: ['Grade', 'Preservative Treatment'] },
    { id: 'thickness', name: 'Thickness', type: 'checkbox', specKeys: ['Thickness'] },
    { id: 'dimensions', name: 'Size', type: 'checkbox', specKeys: ['Dimensions', 'Size'] },
    { id: 'surfaceFinish', name: 'Finish', type: 'checkbox', specKeys: ['Surface Finish', 'Surface'] },
    { id: 'application', name: 'Application', type: 'checkbox', specKeys: ['Application', 'Density'] },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 4. Adhesives
  'adhesives': [
    { id: 'subcategory', name: 'Category', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'compatibility', name: 'Material', type: 'checkbox', specKeys: ['Compatibility', 'Material Compatibility'] },
    { id: 'bondingType', name: 'Type', type: 'checkbox', specKeys: ['Water Resistance', 'Setting Time'] },
    { id: 'packSize', name: 'Pack Size', type: 'checkbox', isStandardField: 'packSize', specKeys: ['Spread Coverage', 'Packaging'] },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 5. Waterproofing
  'waterproofing': [
    { id: 'subcategory', name: 'Category', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'applicationArea', name: 'Application', type: 'checkbox', specKeys: ['Application Area', 'Compatibility'] },
    { id: 'materialBase', name: 'Material', type: 'checkbox', specKeys: ['Material', 'Base Type', 'Standard'] },
    { id: 'packSize', name: 'Pack Size', type: 'checkbox', isStandardField: 'packSize', specKeys: ['Dosage', 'Packaging'] },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 6. Painting & Finishes
  'painting-finishes': [
    { id: 'subcategory', name: 'Category', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'surfaceFinish', name: 'Finish', type: 'checkbox', specKeys: ['Finish', 'Surface Finish'] },
    { id: 'packSize', name: 'Pack Size', type: 'checkbox', isStandardField: 'packSize', specKeys: ['Coverage', 'Packaging'] },
    { id: 'surfaceType', name: 'Application', type: 'checkbox', specKeys: ['Surface Type', 'Warranty', 'Drying Time'] },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 7. Hinges, Channels & Handles
  'hinges-channels-handles': [
    { id: 'subcategory', name: 'Category', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'material', name: 'Material', type: 'checkbox', specKeys: ['Material'] },
    { id: 'finish', name: 'Finish', type: 'checkbox', specKeys: ['Finish'] },
    { id: 'length', name: 'Size', type: 'checkbox', specKeys: ['Length', 'Size'] },
    { id: 'crankType', name: 'Type', type: 'checkbox', specKeys: ['Crank Type', 'Opening Angle'] },
    { id: 'loadCapacity', name: 'Load Capacity', type: 'checkbox', specKeys: ['Load Capacity', 'Extension'] },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 8. Kitchen Systems & Accessories
  'kitchen-systems-accessories': [
    { id: 'subcategory', name: 'Category', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'material', name: 'Material', type: 'checkbox', specKeys: ['Grade', 'Material'] },
    { id: 'dimensions', name: 'Size', type: 'checkbox', specKeys: ['Dimensions', 'Slide Length'] },
    { id: 'weightRating', name: 'Load Capacity', type: 'checkbox', specKeys: ['Weight Rating', 'Wire Gauge'] },
    { id: 'damping', name: 'Features', type: 'checkbox', specKeys: ['Damping', 'Wall Thickness'] },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 9. Wardrobe & Bed Fittings
  'wardrobe-bed-fittings': [
    { id: 'subcategory', name: 'Category', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'material', name: 'Material', type: 'checkbox', specKeys: ['Material'] },
    { id: 'finish', name: 'Finish', type: 'checkbox', specKeys: ['Finish'] },
    { id: 'loadCapacity', name: 'Load Capacity', type: 'checkbox', specKeys: ['Load Capacity'] },
    { id: 'mountingType', name: 'Type', type: 'checkbox', specKeys: ['Mounting Type', 'Application', 'Size'] },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 10. Door Locks & Hardware
  'door-locks-hardware': [
    { id: 'subcategory', name: 'Category', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'material', name: 'Material', type: 'checkbox', specKeys: ['Material'] },
    { id: 'shackleMaterial', name: 'Type', type: 'checkbox', specKeys: ['Shackle Material', 'Levers'] },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 11. Wires, MCB & Distribution Boards
  'wires-mcb-distribution-boards': [
    { id: 'subcategory', name: 'Category', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'conductorSize', name: 'Size', type: 'checkbox', specKeys: ['Conductor Size'] },
    { id: 'currentCapacity', name: 'Rating', type: 'checkbox', specKeys: ['Current Carrying Capacity', 'Current Rating'] },
    { id: 'length', name: 'Length', type: 'checkbox', specKeys: ['Length'] },
    { id: 'insulation', name: 'Insulation', type: 'checkbox', specKeys: ['Insulation', 'Certification'] },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 12. Switches & Sockets
  'switches-sockets': [
    { id: 'subcategory', name: 'Category', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'moduleSize', name: 'Size', type: 'checkbox', specKeys: ['Module Size', 'Number of Modules'] },
    { id: 'ampRating', name: 'Rating', type: 'checkbox', specKeys: ['Amp Rating'] },
    { id: 'colour', name: 'Colors', type: 'checkbox', specKeys: ['Colour', 'Color'] },
    { id: 'seriesModel', name: 'Type', type: 'checkbox', specKeys: ['Series / Model', 'Switch Type', 'Socket Type'] },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 13. Electrical Conduits
  'electrical-conduits': [
    { id: 'subcategory', name: 'Category', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'nominalDiameter', name: 'Size', type: 'checkbox', specKeys: ['Nominal Diameter', 'Size'] },
    { id: 'stressClass', name: 'Grade', type: 'checkbox', specKeys: ['Stress Class', 'Standard', 'Ways'] },
    { id: 'material', name: 'Material', type: 'checkbox', specKeys: ['Material'] },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 14. Lighting
  'lighting': [
    { id: 'subcategory', name: 'Category', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'wattage', name: 'Wattage', type: 'checkbox', specKeys: ['Wattage'] },
    { id: 'colorTemperature', name: 'Color Temperature', type: 'checkbox', specKeys: ['Color Temperature', 'Colour Temperature'] },
    { id: 'beamAngle', name: 'Size', type: 'checkbox', specKeys: ['Beam Angle', 'Ceiling Cutout'] },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 15. Ceiling Fans & Exhaust
  'ceiling-fans-exhaust': [
    { id: 'subcategory', name: 'Category', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'sweepSize', name: 'Size', type: 'checkbox', specKeys: ['Sweep Size'] },
    { id: 'wattage', name: 'Wattage', type: 'checkbox', specKeys: ['Wattage'] },
    { id: 'rpm', name: 'RPM', type: 'checkbox', specKeys: ['RPM', 'Air Delivery'] },
    { id: 'colour', name: 'Colors', type: 'checkbox', specKeys: ['Colour', 'Color'] },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 16. CPVC Pipes & Overhead Tanks
  'cpvc-pipes-overhead-tanks': [
    { id: 'subcategory', name: 'Category', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'nominalDiameter', name: 'Size', type: 'checkbox', specKeys: ['Nominal Diameter', 'Size'] },
    { id: 'pressureClass', name: 'Grade', type: 'checkbox', specKeys: ['Pressure Class'] },
    { id: 'temperature', name: 'Features', type: 'checkbox', specKeys: ['Max Operating Temp', 'Certification'] },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 17. Sanitary & Bath Fittings
  'sanitary-bath-fittings': [
    { id: 'subcategory', name: 'Category', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'material', name: 'Material', type: 'checkbox', specKeys: ['Material'] },
    { id: 'finish', name: 'Finish', type: 'checkbox', specKeys: ['Finish', 'Colour'] },
    { id: 'installationType', name: 'Type', type: 'checkbox', specKeys: ['Installation Type'] },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 18. Kitchen Sinks & Faucets
  'kitchen-sinks-faucets': [
    { id: 'subcategory', name: 'Category', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'material', name: 'Material', type: 'checkbox', specKeys: ['Material', 'Body Material'] },
    { id: 'dimensions', name: 'Size', type: 'checkbox', specKeys: ['Overall Dimensions', 'Dimensions'] },
    { id: 'sheetThickness', name: 'Type', type: 'checkbox', specKeys: ['Sheet Thickness', 'Cartridge'] },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 19. Water Storage Tanks
  'water-storage-tanks': [
    { id: 'subcategory', name: 'Category', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'capacity', name: 'Capacity', type: 'checkbox', specKeys: ['Capacity'] },
    { id: 'layerConstruction', name: 'Type', type: 'checkbox', specKeys: ['Layer Construction'] },
    { id: 'dimensions', name: 'Size', type: 'checkbox', specKeys: ['Dimensions'] },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 20. Power Tools & Accessories
  'power-tools-accessories': [
    { id: 'subcategory', name: 'Category', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'ratedPower', name: 'Wattage', type: 'checkbox', specKeys: ['Rated Power', 'Wattage'] },
    { id: 'impactEnergy', name: 'Type', type: 'checkbox', specKeys: ['Impact Energy', 'Tool Holder'] },
    { id: 'drillingCapacity', name: 'Capacity', type: 'checkbox', specKeys: ['Drilling Dia in Concrete'] },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 21. General Hardware & Tools
  'general-hardware-tools': [
    { id: 'subcategory', name: 'Category', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'material', name: 'Material', type: 'checkbox', specKeys: ['Material', 'Case Material', 'Head Material'] },
    { id: 'dimensions', name: 'Size', type: 'checkbox', specKeys: ['Blade Length', 'Head Weight'] },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 22. CCTV & Networking
  'cctv-networking': [
    { id: 'subcategory', name: 'Category', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'resolution', name: 'Resolution', type: 'checkbox', specKeys: ['Resolution'] },
    { id: 'networkType', name: 'Type', type: 'checkbox', specKeys: ['Network Type', 'Cable Length'] },
    { id: 'connectivity', name: 'Features', type: 'checkbox', specKeys: ['Connectivity', 'Storage Compatibility', 'Indoor / Outdoor'] },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 23. Home Appliances & Power Backup
  'home-appliances-power-backup': [
    { id: 'subcategory', name: 'Category', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'capacity', name: 'Capacity', type: 'checkbox', specKeys: ['Capacity'] },
    { id: 'powerRating', name: 'Power Rating', type: 'checkbox', specKeys: ['Rated Power Output', 'Heating Element'] },
    { id: 'features', name: 'Features', type: 'checkbox', specKeys: ['Waveform', 'Display', 'Energy Rating', 'Pressure Rating'] },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 24. Safety & Workwear
  'safety-workwear': [
    { id: 'subcategory', name: 'Category', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'safetyCategory', name: 'Grade', type: 'checkbox', specKeys: ['Safety Category'] },
    { id: 'size', name: 'Size', type: 'checkbox', specKeys: ['Size'] },
    { id: 'material', name: 'Material', type: 'checkbox', specKeys: ['Material'] },
    { id: 'colour', name: 'Colors', type: 'checkbox', specKeys: ['Colour', 'Color'] },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 25. Glass Door Hardware
  'glass-door-hardware': [
    { id: 'subcategory', name: 'Category', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'glassThickness', name: 'Thickness', type: 'checkbox', specKeys: ['Glass Thickness Compatibility'] },
    { id: 'material', name: 'Material', type: 'checkbox', specKeys: ['Material'] },
    { id: 'finish', name: 'Finish', type: 'checkbox', specKeys: ['Finish'] },
    { id: 'mountingType', name: 'Type', type: 'checkbox', specKeys: ['Mounting Type', 'Size'] },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 26. Welding Consumables
  'welding-consumables': [
    { id: 'subcategory', name: 'Category', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'electrodeDiameter', name: 'Size', type: 'checkbox', specKeys: ['Electrode Diameter', 'Size'] },
    { id: 'materialCompatibility', name: 'Material', type: 'checkbox', specKeys: ['Material Compatibility'] },
    { id: 'packWeight', name: 'Pack Size', type: 'checkbox', specKeys: ['Pack Weight'] },
    { id: 'weldingType', name: 'Type', type: 'checkbox', specKeys: ['Welding Type'] },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 27. Bathroom Renovation Materials
  'bathroom-renovation-materials': [
    { id: 'subcategory', name: 'Category', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'sizeLength', name: 'Size', type: 'checkbox', specKeys: ['Length', 'Tank Capacity', 'Size'] },
    { id: 'material', name: 'Material', type: 'checkbox', specKeys: ['Material'] },
    { id: 'grateType', name: 'Type', type: 'checkbox', specKeys: ['Grate Type', 'Installation', 'Actuator Plate'] },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 28. Ceiling & Flooring
  'ceiling-flooring': [
    { id: 'subcategory', name: 'Category', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'material', name: 'Material', type: 'checkbox', specKeys: ['Material'] },
    { id: 'thickness', name: 'Thickness', type: 'checkbox', specKeys: ['Thickness'] },
    { id: 'size', name: 'Size', type: 'checkbox', specKeys: ['Size'] },
    { id: 'finish', name: 'Finish', type: 'checkbox', specKeys: ['Finish', 'Pattern'] },
    { id: 'coverageArea', name: 'Features', type: 'checkbox', specKeys: ['Coverage Area'] },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ]
};

// -------------------------------------------------------------------------------------
// DYNAMIC OPTION EXTRACTION ENGINE (PHASE 5: NO EMPTY / IRRELEVANT FILTERS)
// -------------------------------------------------------------------------------------

/**
 * Extracts all valid, available filter options for a category based on the actual products in that category.
 * If an attribute dimension has 0 options among the products, it is automatically omitted.
 */
export function getAvailableFiltersForCategory(
  categorySlug: string,
  categoryProducts: Product[]
): AvailableCategoryFilter[] {
  const dimensions = CATEGORY_FILTER_CONFIGS[categorySlug] || [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'subcategory', name: 'Subcategory', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'price', name: 'Price Range', type: 'range', isStandardField: 'price' }
  ];

  const availableFilters: AvailableCategoryFilter[] = [];

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
      } else if (dim.isStandardField === 'subcategory') {
        if (p.subcategory) valuesFound.push(p.subcategory);
      } else if (dim.isStandardField === 'packSize') {
        if (p.packSize) valuesFound.push(p.packSize);
        else if (p.unit) valuesFound.push(p.unit);
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
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

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
 * If a single category is active, includes that category's specific specification filters.
 */
export function getAvailableFiltersForCatalog(
  allProducts: Product[],
  selectedCategorySlug?: string
): AvailableCategoryFilter[] {
  const availableFilters: AvailableCategoryFilter[] = [];

  // 1. Category Filter Dimension (HomeRun has Category dropdown first)
  const categoryCounts = new Map<string, number>();
  for (const p of allProducts) {
    if (p.category) {
      categoryCounts.set(p.category, (categoryCounts.get(p.category) || 0) + 1);
    }
  }
  if (categoryCounts.size > 0) {
    availableFilters.push({
      id: 'category',
      name: 'Category',
      type: 'checkbox',
      options: Array.from(categoryCounts.entries())
        .map(([value, count]) => ({ value, label: value, count }))
        .sort((a, b) => b.count - a.count)
    });
  }

  // If a single category is selected, extract its specific filters (Brand, Type, Size, etc.)
  if (selectedCategorySlug && CATEGORY_FILTER_CONFIGS[selectedCategorySlug]) {
    const catProducts = allProducts.filter(
      (p) => p.categorySlug === selectedCategorySlug || p.category === selectedCategorySlug
    );
    const catFilters = getAvailableFiltersForCategory(selectedCategorySlug, catProducts);
    for (const f of catFilters) {
      // Do not duplicate Category dropdown or Price (handled below)
      if (f.id !== 'category' && f.id !== 'price') {
        availableFilters.push(f);
      }
    }
  } else {
    // Catalogue overview (no single category selected): Brand filter
    const brandCounts = new Map<string, number>();
    for (const p of allProducts) {
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
          .map(([value, count]) => ({ value, label: value, count }))
          .sort((a, b) => b.count - a.count)
      });
    }
  }

  // Price Range
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
    // 0. Category filter (OR within selected categories)
    if (activeFilters.categories && activeFilters.categories.length > 0) {
      const matchCat =
        activeFilters.categories.includes(p.category) ||
        activeFilters.categories.includes(p.categorySlug);
      if (!matchCat) {
        return false;
      }
    }

    // 1. Brand filter (OR within brands)
    if (activeFilters.brands && activeFilters.brands.length > 0) {
      if (!activeFilters.brands.includes(p.brand) && !activeFilters.brands.includes(p.brandSlug)) {
        return false;
      }
    }

    // 2. Subcategory filter (OR within subcategories)
    if (activeFilters.subcategories && activeFilters.subcategories.length > 0) {
      const matchSub =
        activeFilters.subcategories.includes(p.subcategory) ||
        activeFilters.subcategories.includes(p.subcategorySlug);
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

    // 6. Dynamic Specification Filters (AND between different dimensions, OR within same dimension)
    if (activeFilters.specifications) {
      for (const [dimId, selectedValues] of Object.entries(activeFilters.specifications)) {
        if (!selectedValues || selectedValues.length === 0) continue;

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
