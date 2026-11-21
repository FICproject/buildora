import { Product } from '@buildora/types';

export type FilterType = 'checkbox' | 'range' | 'toggle';

export interface CategoryFilterDimension {
  id: string; // Unique identifier for the filter dimension
  name: string; // Human-readable display label
  type: FilterType;
  specKeys?: string[]; // Keys to look for in product.specifications
  catAttrKeys?: string[]; // Keys to look for in product.categoryAttributes
  isStandardField?: 'brand' | 'subcategory' | 'price' | 'packSize' | 'inStock' | 'asap';
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
// CONFIGURATION FOR ALL 28 MASTER CATEGORIES (Based on HomeRun & Buildora Catalog Taxonomy)
// -------------------------------------------------------------------------------------
export const CATEGORY_FILTER_CONFIGS: Record<string, CategoryFilterDimension[]> = {
  // 1. Cement & Concrete
  'cement-concrete': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'subcategory', name: 'Subcategory', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'cementType', name: 'Cement Type', type: 'checkbox', specKeys: ['Cement Type', 'Standard'], catAttrKeys: ['cementType'] },
    { id: 'grade', name: 'Grade', type: 'checkbox', specKeys: ['Grade', 'Compressive Strength (28 Days)'], catAttrKeys: ['grade'] },
    { id: 'colour', name: 'Colour', type: 'checkbox', specKeys: ['Colour', 'Color'] },
    { id: 'packSize', name: 'Pack Size / Weight', type: 'checkbox', isStandardField: 'packSize', specKeys: ['Packaging', 'Bag Type'] },
    { id: 'price', name: 'Price Range', type: 'range', isStandardField: 'price' }
  ],

  // 2. Tiling & Tile Adhesives
  'tiling-tile-adhesives': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'subcategory', name: 'Product Type', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'tileType', name: 'Tile Type', type: 'checkbox', specKeys: ['Tile Type', 'Product Type'] },
    { id: 'tileMaterial', name: 'Tile Material', type: 'checkbox', specKeys: ['Tile Material', 'Material'] },
    { id: 'tileDimensions', name: 'Tile Size / Dimensions', type: 'checkbox', specKeys: ['Tile Dimensions', 'Dimensions', 'Size'] },
    { id: 'surfaceFinish', name: 'Surface Finish', type: 'checkbox', specKeys: ['Surface Finish', 'Finish'] },
    { id: 'colour', name: 'Colour', type: 'checkbox', specKeys: ['Colour', 'Color'] },
    { id: 'adhesiveType', name: 'Adhesive Type', type: 'checkbox', specKeys: ['Adhesive Type', 'Standard'] },
    { id: 'applicationArea', name: 'Application Area', type: 'checkbox', specKeys: ['Application Area', 'Application'] },
    { id: 'packSize', name: 'Pack Size', type: 'checkbox', isStandardField: 'packSize', specKeys: ['Coverage', 'Coverage per Box'] },
    { id: 'price', name: 'Price Range', type: 'range', isStandardField: 'price' }
  ],

  // 3. Plywood, MDF & HDHMR
  'plywood-mdf-hdhmr': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'subcategory', name: 'Board Type', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'grade', name: 'Grade', type: 'checkbox', specKeys: ['Grade', 'Preservative Treatment'] },
    { id: 'thickness', name: 'Thickness', type: 'checkbox', specKeys: ['Thickness'] },
    { id: 'dimensions', name: 'Size / Dimensions', type: 'checkbox', specKeys: ['Dimensions', 'Size'] },
    { id: 'surfaceFinish', name: 'Surface Finish', type: 'checkbox', specKeys: ['Surface Finish', 'Surface'] },
    { id: 'application', name: 'Application', type: 'checkbox', specKeys: ['Application', 'Density'] },
    { id: 'price', name: 'Price Range', type: 'range', isStandardField: 'price' }
  ],

  // 4. Adhesives
  'adhesives': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'subcategory', name: 'Adhesive Type', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'compatibility', name: 'Material Compatibility', type: 'checkbox', specKeys: ['Compatibility', 'Material Compatibility'] },
    { id: 'bondingType', name: 'Bonding Type / Water Resistance', type: 'checkbox', specKeys: ['Water Resistance', 'Setting Time'] },
    { id: 'packSize', name: 'Pack Size / Weight', type: 'checkbox', isStandardField: 'packSize', specKeys: ['Spread Coverage'] },
    { id: 'price', name: 'Price Range', type: 'range', isStandardField: 'price' }
  ],

  // 5. Waterproofing
  'waterproofing': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'subcategory', name: 'Waterproofing Type', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'applicationArea', name: 'Application Area', type: 'checkbox', specKeys: ['Application Area', 'Compatibility'] },
    { id: 'materialBase', name: 'Material / Base Type', type: 'checkbox', specKeys: ['Material', 'Base Type', 'Standard'] },
    { id: 'packSize', name: 'Pack Size / Volume', type: 'checkbox', isStandardField: 'packSize', specKeys: ['Dosage'] },
    { id: 'price', name: 'Price Range', type: 'range', isStandardField: 'price' }
  ],

  // 6. Painting & Finishes
  'painting-finishes': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'subcategory', name: 'Paint Type', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'surfaceFinish', name: 'Finish', type: 'checkbox', specKeys: ['Finish', 'Surface Finish'] },
    { id: 'packSize', name: 'Volume / Pack Size', type: 'checkbox', isStandardField: 'packSize', specKeys: ['Coverage'] },
    { id: 'surfaceType', name: 'Surface Type / Warranty', type: 'checkbox', specKeys: ['Surface Type', 'Warranty', 'Drying Time'] },
    { id: 'price', name: 'Price Range', type: 'range', isStandardField: 'price' }
  ],

  // 7. Hinges, Channels & Handles
  'hinges-channels-handles': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'subcategory', name: 'Hardware Type', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'material', name: 'Material', type: 'checkbox', specKeys: ['Material'] },
    { id: 'finish', name: 'Finish', type: 'checkbox', specKeys: ['Finish'] },
    { id: 'length', name: 'Length / Size', type: 'checkbox', specKeys: ['Length', 'Size'] },
    { id: 'crankType', name: 'Opening / Crank Type', type: 'checkbox', specKeys: ['Crank Type', 'Opening Angle'] },
    { id: 'loadCapacity', name: 'Load Capacity', type: 'checkbox', specKeys: ['Load Capacity', 'Extension'] },
    { id: 'cycleTesting', name: 'Cycle Testing / Damping', type: 'checkbox', specKeys: ['Cycle Testing', 'Damping'] },
    { id: 'price', name: 'Price Range', type: 'range', isStandardField: 'price' }
  ],

  // 8. Kitchen Systems & Accessories
  'kitchen-systems-accessories': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'subcategory', name: 'Product Type', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'material', name: 'Material / Grade', type: 'checkbox', specKeys: ['Grade', 'Material'] },
    { id: 'dimensions', name: 'Dimensions / Width', type: 'checkbox', specKeys: ['Dimensions', 'Slide Length'] },
    { id: 'weightRating', name: 'Weight Rating / Gauge', type: 'checkbox', specKeys: ['Weight Rating', 'Wire Gauge'] },
    { id: 'damping', name: 'Damping / Soft-Close', type: 'checkbox', specKeys: ['Damping', 'Wall Thickness'] },
    { id: 'price', name: 'Price Range', type: 'range', isStandardField: 'price' }
  ],

  // 9. Wardrobe & Bed Fittings
  'wardrobe-bed-fittings': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'subcategory', name: 'Product Type', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'material', name: 'Material', type: 'checkbox', specKeys: ['Material'] },
    { id: 'finish', name: 'Finish', type: 'checkbox', specKeys: ['Finish'] },
    { id: 'loadCapacity', name: 'Load Capacity', type: 'checkbox', specKeys: ['Load Capacity'] },
    { id: 'mountingType', name: 'Mounting Type', type: 'checkbox', specKeys: ['Mounting Type'] },
    { id: 'application', name: 'Application / Bed Size', type: 'checkbox', specKeys: ['Application', 'Size', 'Length'] },
    { id: 'price', name: 'Price Range', type: 'range', isStandardField: 'price' }
  ],

  // 10. Door Locks & Hardware
  'door-locks-hardware': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'subcategory', name: 'Hardware / Lock Type', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'material', name: 'Material', type: 'checkbox', specKeys: ['Material'] },
    { id: 'shackleMaterial', name: 'Shackle / Cylinder Material', type: 'checkbox', specKeys: ['Shackle Material', 'Levers'] },
    { id: 'price', name: 'Price Range', type: 'range', isStandardField: 'price' }
  ],

  // 11. Wires, MCB & Distribution Boards
  'wires-mcb-distribution-boards': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'subcategory', name: 'Product Type', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'conductorSize', name: 'Wire Size / Sq.mm', type: 'checkbox', specKeys: ['Conductor Size'] },
    { id: 'currentCapacity', name: 'Current Rating', type: 'checkbox', specKeys: ['Current Carrying Capacity', 'Current Rating'] },
    { id: 'length', name: 'Coil Length', type: 'checkbox', specKeys: ['Length'] },
    { id: 'insulation', name: 'Insulation / Certifications', type: 'checkbox', specKeys: ['Insulation', 'Certification'] },
    { id: 'price', name: 'Price Range', type: 'range', isStandardField: 'price' }
  ],

  // 12. Switches & Sockets
  'switches-sockets': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'subcategory', name: 'Product Type', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'moduleSize', name: 'Module Size', type: 'checkbox', specKeys: ['Module Size', 'Number of Modules'] },
    { id: 'ampRating', name: 'Amp Rating', type: 'checkbox', specKeys: ['Amp Rating'] },
    { id: 'colour', name: 'Colour', type: 'checkbox', specKeys: ['Colour', 'Color'] },
    { id: 'seriesModel', name: 'Series / Model', type: 'checkbox', specKeys: ['Series / Model', 'Switch Type', 'Socket Type'] },
    { id: 'price', name: 'Price Range', type: 'range', isStandardField: 'price' }
  ],

  // 13. Electrical Conduits
  'electrical-conduits': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'subcategory', name: 'Conduit Type', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'nominalDiameter', name: 'Diameter / Size', type: 'checkbox', specKeys: ['Nominal Diameter', 'Size'] },
    { id: 'stressClass', name: 'Stress Class / Standard', type: 'checkbox', specKeys: ['Stress Class', 'Standard', 'Ways'] },
    { id: 'material', name: 'Material', type: 'checkbox', specKeys: ['Material'] },
    { id: 'price', name: 'Price Range', type: 'range', isStandardField: 'price' }
  ],

  // 14. Lighting
  'lighting': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'subcategory', name: 'Light Type', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'wattage', name: 'Wattage', type: 'checkbox', specKeys: ['Wattage'] },
    { id: 'colorTemperature', name: 'Color Temperature', type: 'checkbox', specKeys: ['Color Temperature', 'Colour Temperature'] },
    { id: 'beamAngle', name: 'Beam Angle / Cutout', type: 'checkbox', specKeys: ['Beam Angle', 'Ceiling Cutout'] },
    { id: 'surgeProtection', name: 'Surge Protection / CRI', type: 'checkbox', specKeys: ['Surge Protection', 'CRI'] },
    { id: 'price', name: 'Price Range', type: 'range', isStandardField: 'price' }
  ],

  // 15. Ceiling Fans & Exhaust
  'ceiling-fans-exhaust': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'subcategory', name: 'Product Type', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'sweepSize', name: 'Sweep Size', type: 'checkbox', specKeys: ['Sweep Size'] },
    { id: 'wattage', name: 'Wattage / Motor', type: 'checkbox', specKeys: ['Wattage'] },
    { id: 'rpm', name: 'RPM / Air Delivery', type: 'checkbox', specKeys: ['RPM', 'Air Delivery'] },
    { id: 'colour', name: 'Colour', type: 'checkbox', specKeys: ['Colour', 'Color'] },
    { id: 'energyEfficiency', name: 'Energy Rating / Control', type: 'checkbox', specKeys: ['Energy Efficiency', 'Control Type'] },
    { id: 'price', name: 'Price Range', type: 'range', isStandardField: 'price' }
  ],

  // 16. CPVC Pipes & Overhead Tanks
  'cpvc-pipes-overhead-tanks': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'subcategory', name: 'Product Type', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'nominalDiameter', name: 'Pipe Diameter / Size', type: 'checkbox', specKeys: ['Nominal Diameter', 'Size'] },
    { id: 'pressureClass', name: 'Pressure Class', type: 'checkbox', specKeys: ['Pressure Class'] },
    { id: 'temperature', name: 'Max Operating Temp', type: 'checkbox', specKeys: ['Max Operating Temp'] },
    { id: 'certification', name: 'Certifications', type: 'checkbox', specKeys: ['Certification'] },
    { id: 'price', name: 'Price Range', type: 'range', isStandardField: 'price' }
  ],

  // 17. Sanitary & Bath Fittings
  'sanitary-bath-fittings': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'subcategory', name: 'Product Type', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'material', name: 'Material', type: 'checkbox', specKeys: ['Material'] },
    { id: 'finish', name: 'Finish / Colour', type: 'checkbox', specKeys: ['Finish', 'Colour'] },
    { id: 'installationType', name: 'Installation Type', type: 'checkbox', specKeys: ['Installation Type'] },
    { id: 'waterFlow', name: 'Water Flow / Flushing', type: 'checkbox', specKeys: ['Water Flow / Operating Type'] },
    { id: 'price', name: 'Price Range', type: 'range', isStandardField: 'price' }
  ],

  // 18. Kitchen Sinks & Faucets
  'kitchen-sinks-faucets': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'subcategory', name: 'Product Type', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'material', name: 'Material / Body', type: 'checkbox', specKeys: ['Material', 'Body Material'] },
    { id: 'dimensions', name: 'Overall Dimensions', type: 'checkbox', specKeys: ['Overall Dimensions', 'Dimensions'] },
    { id: 'sheetThickness', name: 'Sheet Gauge / Cartridge', type: 'checkbox', specKeys: ['Sheet Thickness', 'Cartridge'] },
    { id: 'spoutFeatures', name: 'Spout / Flow Features', type: 'checkbox', specKeys: ['Spout', 'Corner Radius', 'Water Flow Modes'] },
    { id: 'price', name: 'Price Range', type: 'range', isStandardField: 'price' }
  ],

  // 19. Water Storage Tanks
  'water-storage-tanks': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'subcategory', name: 'Tank Type', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'capacity', name: 'Capacity (Litres)', type: 'checkbox', specKeys: ['Capacity'] },
    { id: 'layerConstruction', name: 'Layer Construction', type: 'checkbox', specKeys: ['Layer Construction'] },
    { id: 'dimensions', name: 'Dimensions', type: 'checkbox', specKeys: ['Dimensions'] },
    { id: 'warranty', name: 'Warranty', type: 'checkbox', specKeys: ['Warranty'] },
    { id: 'price', name: 'Price Range', type: 'range', isStandardField: 'price' }
  ],

  // 20. Power Tools & Accessories
  'power-tools-accessories': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'subcategory', name: 'Tool Type', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'ratedPower', name: 'Rated Power / Wattage', type: 'checkbox', specKeys: ['Rated Power', 'Wattage'] },
    { id: 'impactEnergy', name: 'Impact Energy / Tool Holder', type: 'checkbox', specKeys: ['Impact Energy', 'Tool Holder'] },
    { id: 'drillingCapacity', name: 'Drilling Capacity in Concrete', type: 'checkbox', specKeys: ['Drilling Dia in Concrete'] },
    { id: 'price', name: 'Price Range', type: 'range', isStandardField: 'price' }
  ],

  // 21. General Hardware & Tools
  'general-hardware-tools': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'subcategory', name: 'Tool Type', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'material', name: 'Material / Case', type: 'checkbox', specKeys: ['Material', 'Case Material', 'Head Material'] },
    { id: 'dimensions', name: 'Blade Length / Head Weight', type: 'checkbox', specKeys: ['Blade Length', 'Head Weight'] },
    { id: 'accuracyClass', name: 'Accuracy / Hardness', type: 'checkbox', specKeys: ['Accuracy Class', 'Hardness'] },
    { id: 'price', name: 'Price Range', type: 'range', isStandardField: 'price' }
  ],

  // 22. CCTV & Networking
  'cctv-networking': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'subcategory', name: 'Product Type', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'resolution', name: 'Resolution', type: 'checkbox', specKeys: ['Resolution'] },
    { id: 'networkType', name: 'Network Type / Cable Length', type: 'checkbox', specKeys: ['Network Type', 'Cable Length'] },
    { id: 'connectivity', name: 'Connectivity / Storage', type: 'checkbox', specKeys: ['Connectivity', 'Storage Compatibility'] },
    { id: 'indoorOutdoor', name: 'Indoor / Outdoor Protection', type: 'checkbox', specKeys: ['Indoor / Outdoor'] },
    { id: 'price', name: 'Price Range', type: 'range', isStandardField: 'price' }
  ],

  // 23. Home Appliances & Power Backup
  'home-appliances-power-backup': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'subcategory', name: 'Appliance Type', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'capacity', name: 'Capacity / VA Rating', type: 'checkbox', specKeys: ['Capacity'] },
    { id: 'powerRating', name: 'Rated Power Output / Element', type: 'checkbox', specKeys: ['Rated Power Output', 'Heating Element'] },
    { id: 'features', name: 'Features / Waveform', type: 'checkbox', specKeys: ['Waveform', 'Display', 'Energy Rating', 'Pressure Rating'] },
    { id: 'price', name: 'Price Range', type: 'range', isStandardField: 'price' }
  ],

  // 24. Safety & Workwear
  'safety-workwear': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'subcategory', name: 'Product Type', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'safetyCategory', name: 'Safety Standard Category', type: 'checkbox', specKeys: ['Safety Category'] },
    { id: 'size', name: 'Size', type: 'checkbox', specKeys: ['Size'] },
    { id: 'material', name: 'Material', type: 'checkbox', specKeys: ['Material'] },
    { id: 'protectionRating', name: 'Protection Rating', type: 'checkbox', specKeys: ['Protection Rating'] },
    { id: 'colour', name: 'Colour', type: 'checkbox', specKeys: ['Colour', 'Color'] },
    { id: 'price', name: 'Price Range', type: 'range', isStandardField: 'price' }
  ],

  // 25. Glass Door Hardware
  'glass-door-hardware': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'subcategory', name: 'Product Type', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'glassThickness', name: 'Glass Thickness Compatibility', type: 'checkbox', specKeys: ['Glass Thickness Compatibility'] },
    { id: 'material', name: 'Material', type: 'checkbox', specKeys: ['Material'] },
    { id: 'finish', name: 'Finish', type: 'checkbox', specKeys: ['Finish'] },
    { id: 'mountingType', name: 'Mounting Type / Rating', type: 'checkbox', specKeys: ['Mounting Type', 'Size'] },
    { id: 'price', name: 'Price Range', type: 'range', isStandardField: 'price' }
  ],

  // 26. Welding Consumables
  'welding-consumables': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'subcategory', name: 'Product Type', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'electrodeDiameter', name: 'Electrode / Disc Diameter', type: 'checkbox', specKeys: ['Electrode Diameter', 'Size'] },
    { id: 'materialCompatibility', name: 'Material Compatibility', type: 'checkbox', specKeys: ['Material Compatibility'] },
    { id: 'packWeight', name: 'Pack Weight / Quantity', type: 'checkbox', specKeys: ['Pack Weight'] },
    { id: 'weldingType', name: 'Welding Type', type: 'checkbox', specKeys: ['Welding Type'] },
    { id: 'price', name: 'Price Range', type: 'range', isStandardField: 'price' }
  ],

  // 27. Bathroom Renovation Materials
  'bathroom-renovation-materials': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'subcategory', name: 'Product Type', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'sizeLength', name: 'Size / Channel Length', type: 'checkbox', specKeys: ['Length', 'Tank Capacity', 'Size'] },
    { id: 'material', name: 'Material', type: 'checkbox', specKeys: ['Material'] },
    { id: 'grateType', name: 'Grate Type / Features', type: 'checkbox', specKeys: ['Grate Type', 'Installation', 'Actuator Plate'] },
    { id: 'price', name: 'Price Range', type: 'range', isStandardField: 'price' }
  ],

  // 28. Ceiling & Flooring
  'ceiling-flooring': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'subcategory', name: 'Product Type', type: 'checkbox', isStandardField: 'subcategory' },
    { id: 'material', name: 'Material', type: 'checkbox', specKeys: ['Material'] },
    { id: 'thickness', name: 'Thickness', type: 'checkbox', specKeys: ['Thickness'] },
    { id: 'size', name: 'Size / Dimensions', type: 'checkbox', specKeys: ['Size'] },
    { id: 'finish', name: 'Finish / Pattern', type: 'checkbox', specKeys: ['Finish', 'Pattern'] },
    { id: 'coverageArea', name: 'Coverage Area', type: 'checkbox', specKeys: ['Coverage Area'] },
    { id: 'price', name: 'Price Range', type: 'range', isStandardField: 'price' }
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
