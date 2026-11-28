import { Product, CategoryFilterConfiguration } from '@buildora/types';

export type FilterType = 'checkbox' | 'range' | 'toggle';

export interface CategoryFilterDimension {
  id: string; // Unique identifier for the filter dimension
  name: string; // Human-readable display label
  type: FilterType;
  selectionMode?: 'SINGLE' | 'MULTI';
  configuredOptions?: string[];
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
  selectionMode?: 'SINGLE' | 'MULTI';
  options: FilterOption[];
  minPrice?: number;
  maxPrice?: number;
}

export interface ActiveCategoryFilters {
  categories?: string[]; // Category slugs or names (for catalogue pages)
  childCategories?: string[]; // Child Category slugs/names (when browsing Main Category PLP)
  brands: string[];
  subcategories: string[]; // Product Type slugs/names (OR within selected Product Types)
  inStockOnly: boolean;
  asapOnly: boolean;
  minPrice?: number;
  maxPrice?: number;
  specifications: Record<string, string[]>; // dimensionId -> selectedValues[]
  sortBy?: string;
  searchQuery?: string;
}

export interface StandardChecklistFilterTemplate {
  fieldKey: string;
  filterName: string;
  fieldType: CategoryFilterConfiguration['fieldType'];
  selectionMode: CategoryFilterConfiguration['selectionMode'];
  isStandardField?: CategoryFilterConfiguration['isStandardField'];
  specKeys?: string[];
  catAttrKeys?: string[];
  defaultOptions?: string[];
}

export const STANDARD_CHECKLIST_FILTERS: StandardChecklistFilterTemplate[] = [
  {
    fieldKey: 'category',
    filterName: 'Category',
    fieldType: 'MULTISELECT',
    selectionMode: 'MULTI',
    isStandardField: 'subcategory',
  },
  {
    fieldKey: 'brand',
    filterName: 'Brand',
    fieldType: 'MULTISELECT',
    selectionMode: 'MULTI',
    isStandardField: 'brand',
  },
  {
    fieldKey: 'type',
    filterName: 'Type',
    fieldType: 'MULTISELECT',
    selectionMode: 'MULTI',
    specKeys: [
      'Type',
      'Product Type',
      'Cement Type',
      'Adhesive Type',
      'Material Type',
      'Paint Type',
      'Waterproofing Type',
      'Hardware Type',
      'Hardware Type / Mechanism',
      'Crank Type',
      'Kitchen System Type',
      'Fitting Type',
      'Mounting Type',
      'Lock Type',
      'Cable Type',
      'Switch Type',
      'Socket Type',
      'Conduit Type',
      'Series / Model',
      'Pipe / Fitting Type',
      'Fixture Type',
      'Installation Type',
      'Layer Construction',
      'Application',
    ],
    catAttrKeys: [
      'type',
      'productType',
      'cementType',
      'adhesiveType',
      'materialType',
      'paintType',
      'waterproofingType',
      'hardwareModel',
      'crankType',
      'systemType',
      'fittingType',
      'mountingType',
      'lockType',
      'electricalType',
      'switchType',
      'conduitType',
      'lightingType',
      'pipeOrFittingType',
      'fixtureType',
      'installationType',
      'layers',
    ],
  },
  {
    fieldKey: 'size',
    filterName: 'Size',
    fieldType: 'MULTISELECT',
    selectionMode: 'MULTI',
    specKeys: [
      'Size',
      'Length',
      'Dimensions',
      'Overall Size',
      'Tool Size',
      'Sink Dimensions',
      'Pipe Diameter',
      'Conduit Size',
      'Rated Capacity',
      'Tile Dimensions',
      'Sheet Size',
      'Slide Length',
      'Cabinet Width / Size',
      'Size / Length',
      'Size / Track Length',
      'Lock Size / Door Thickness Support',
      'Conductor Size',
      'Wire Size',
      'Module Size',
      'Number of Modules',
      'Nominal Diameter',
      'Pipe Size',
      'Capacity',
      'Overall Dimensions',
      'Ceiling Cutout',
      'Beam Angle',
    ],
    catAttrKeys: ['size', 'cabinetSize', 'sizeOrLength', 'sizeOrLevers', 'moduleSize', 'nominalDiameter', 'cutoutSize', 'diameter', 'capacity', 'dimensions', 'pipeSize'],
  },
  {
    fieldKey: 'colour',
    filterName: 'Colors',
    fieldType: 'MULTISELECT',
    selectionMode: 'MULTI',
    specKeys: ['Colors', 'Color', 'Colour', 'Whiteness', 'Finish', 'Surface Finish', 'Material & Finish', 'Color Temperature', 'Colour Temperature'],
    catAttrKeys: ['colour', 'color', 'colors', 'finish', 'materialFinish', 'colorTemperature', 'finishColour'],
  },
  {
    fieldKey: 'material',
    filterName: 'Material',
    fieldType: 'MULTISELECT',
    selectionMode: 'MULTI',
    specKeys: ['Material', 'Body Material', 'Sink Material', 'Alloy / Material', 'Tile Material', 'Material Base', 'Material Grade', 'Material Type', 'Material & Finish', 'Composition', 'Insulation'],
    catAttrKeys: ['material', 'materialBase', 'materialType', 'materialFinish'],
  },
  {
    fieldKey: 'grade',
    filterName: 'Grade',
    fieldType: 'MULTISELECT',
    selectionMode: 'MULTI',
    specKeys: ['Grade', 'Standard', 'Steel Grade', 'IS Grade', 'Class / Grade', 'Waterproof Rating', 'Water Resistance', 'Load Capacity', 'Levers', 'Shackle Material', 'Stress Class', 'Certification', 'Voltage Rating', 'Amp Rating', 'Current Carrying Capacity', 'Pressure Class', 'Pressure Rating', 'Rated Power Output', 'Energy Rating'],
    catAttrKeys: ['grade', 'waterproofRating', 'loadCapacity', 'weightRating', 'stressClass', 'voltageOrRating', 'ampVoltageRating', 'pressureRating'],
  },
  {
    fieldKey: 'price',
    filterName: 'Price',
    fieldType: 'RANGE',
    selectionMode: 'SINGLE',
    isStandardField: 'price',
  },
  {
    fieldKey: 'thickness',
    filterName: 'Thickness',
    fieldType: 'MULTISELECT',
    selectionMode: 'MULTI',
    specKeys: ['Thickness', 'Wall Thickness', 'Door Thickness', 'Insulation Thickness', 'Sheet Thickness', 'Sheet Gauge', 'Sink Thickness', 'Plate Thickness', 'Gauge / Thickness'],
    catAttrKeys: ['thickness'],
  },
  {
    fieldKey: 'packSize',
    filterName: 'Pack Size',
    fieldType: 'MULTISELECT',
    selectionMode: 'MULTI',
    isStandardField: 'packSize',
    specKeys: ['Pack Size', 'Packaging', 'Weight', 'Coverage', 'Coverage per Box'],
    catAttrKeys: ['packSize', 'bagWeight'],
  },
  {
    fieldKey: 'numberOfCores',
    filterName: 'Number of Cores',
    fieldType: 'MULTISELECT',
    selectionMode: 'MULTI',
    specKeys: ['Number of Cores', 'Cores'],
    catAttrKeys: ['numberOfCores', 'cores'],
  },
];

export const CIVIL_FILTER_KEYS_BY_CATEGORY: Record<string, string[]> = {
  'cat-1': ['category', 'brand', 'type', 'colour', 'material', 'grade', 'price', 'packSize'],
  'cat-2': ['category', 'brand', 'type', 'size', 'colour', 'material', 'grade', 'price', 'packSize'],
  'cat-3': ['category', 'brand', 'type', 'size', 'colour', 'material', 'grade', 'price', 'thickness'],
  'cat-4': ['category', 'brand', 'type', 'price'],
  'cat-5': ['category', 'brand', 'type', 'colour', 'price'],
  'cat-6': ['category', 'brand', 'type', 'size', 'colour', 'material', 'price'],
};

const TEMPLATE_BY_KEY = new Map(STANDARD_CHECKLIST_FILTERS.map((t) => [t.fieldKey, t]));

function dimsFromKeys(keys: string[]): CategoryFilterDimension[] {
  return keys
    .map((k) => TEMPLATE_BY_KEY.get(k))
    .filter((t): t is StandardChecklistFilterTemplate => Boolean(t))
    .map((t) => ({
      id: t.fieldKey === 'category' ? 'subcategory' : t.fieldKey,
      name: t.filterName,
      type: t.fieldType === 'RANGE' ? 'range' : 'checkbox',
      selectionMode: t.selectionMode,
      specKeys: t.specKeys,
      catAttrKeys: t.catAttrKeys,
      isStandardField: t.isStandardField,
    }));
}

const CEMENT_FILTERS: CategoryFilterDimension[] = dimsFromKeys(CIVIL_FILTER_KEYS_BY_CATEGORY['cat-1']);
const TILING_FILTERS: CategoryFilterDimension[] = dimsFromKeys(CIVIL_FILTER_KEYS_BY_CATEGORY['cat-2']);
const PLYWOOD_FILTERS: CategoryFilterDimension[] = dimsFromKeys(CIVIL_FILTER_KEYS_BY_CATEGORY['cat-3']);
const FEVICOL_FILTERS: CategoryFilterDimension[] = dimsFromKeys(CIVIL_FILTER_KEYS_BY_CATEGORY['cat-4']);
const WATERPROOFING_FILTERS: CategoryFilterDimension[] = dimsFromKeys(CIVIL_FILTER_KEYS_BY_CATEGORY['cat-5']);
const PAINTING_FILTERS: CategoryFilterDimension[] = dimsFromKeys(CIVIL_FILTER_KEYS_BY_CATEGORY['cat-6']);

export const FURNITURE_FILTER_KEYS_BY_CATEGORY: Record<string, string[]> = {
  'cat-7': ['brand', 'type', 'size', 'colour', 'material', 'price'],
  'cat-8': ['brand', 'type', 'size', 'colour', 'material', 'price', 'thickness'],
  'cat-9': ['brand', 'type', 'size', 'colour', 'material', 'price', 'thickness'],
  'cat-10': ['brand', 'type', 'size', 'colour', 'material', 'grade', 'price', 'thickness'],
};

const HINGES_FILTERS: CategoryFilterDimension[] = dimsFromKeys(FURNITURE_FILTER_KEYS_BY_CATEGORY['cat-7']);
const KITCHEN_SYSTEMS_FILTERS: CategoryFilterDimension[] = dimsFromKeys(FURNITURE_FILTER_KEYS_BY_CATEGORY['cat-8']);
const WARDROBE_FITTINGS_FILTERS: CategoryFilterDimension[] = dimsFromKeys(FURNITURE_FILTER_KEYS_BY_CATEGORY['cat-9']);
const DOOR_LOCKS_FILTERS: CategoryFilterDimension[] = dimsFromKeys(FURNITURE_FILTER_KEYS_BY_CATEGORY['cat-10']);

export const ELECTRICAL_FILTER_KEYS_BY_CATEGORY: Record<string, string[]> = {
  'cat-11': ['brand', 'type', 'size', 'colour', 'material', 'grade', 'price', 'thickness', 'numberOfCores'],
  'cat-12': ['brand', 'type', 'size', 'colour', 'material', 'price'],
  'cat-13': ['brand', 'type', 'size', 'colour', 'material', 'grade', 'price'],
  'cat-14': ['brand', 'type', 'size', 'colour', 'price'],
};

const WIRES_MCB_FILTERS: CategoryFilterDimension[] = dimsFromKeys(ELECTRICAL_FILTER_KEYS_BY_CATEGORY['cat-11']);
const SWITCHES_SOCKETS_FILTERS: CategoryFilterDimension[] = dimsFromKeys(ELECTRICAL_FILTER_KEYS_BY_CATEGORY['cat-12']);
const ELECTRICAL_CONDUITS_FILTERS: CategoryFilterDimension[] = dimsFromKeys(ELECTRICAL_FILTER_KEYS_BY_CATEGORY['cat-13']);
const LIGHTING_FILTERS: CategoryFilterDimension[] = dimsFromKeys(ELECTRICAL_FILTER_KEYS_BY_CATEGORY['cat-14']);

export const PLUMBING_FILTER_KEYS_BY_CATEGORY: Record<string, string[]> = {
  'cat-16': ['brand', 'type', 'size', 'colour', 'material', 'grade', 'price'],
  'cat-17': ['brand', 'type', 'size', 'colour', 'material', 'price', 'thickness'],
  'cat-19': ['brand', 'type', 'colour', 'material', 'price'],
};

const CPVC_PIPES_FILTERS: CategoryFilterDimension[] = dimsFromKeys(PLUMBING_FILTER_KEYS_BY_CATEGORY['cat-16']);
const SANITARY_BATH_FILTERS: CategoryFilterDimension[] = dimsFromKeys(PLUMBING_FILTER_KEYS_BY_CATEGORY['cat-17']);
const OVERHEAD_TANKS_FILTERS: CategoryFilterDimension[] = dimsFromKeys(PLUMBING_FILTER_KEYS_BY_CATEGORY['cat-19']);

export const NEW_LAUNCH_FILTER_KEYS_BY_COLLECTION: Record<string, string[]> = {
  'nl-col-cabinet-hardware': ['brand', 'type', 'size', 'colour', 'material', 'grade', 'price', 'thickness'],
  'nl-col-kitchen-systems-hardware': ['brand', 'type', 'size', 'colour', 'material', 'price', 'thickness'],
  'nl-col-general-hardware-tools': ['brand', 'type', 'size', 'colour', 'material', 'grade', 'price', 'thickness'],
  'nl-col-bathroom-renovation-materials': ['brand', 'type', 'size', 'colour', 'material', 'grade', 'price', 'thickness'],
  'nl-col-conduits-piping': ['brand', 'type', 'size', 'colour', 'material', 'grade', 'price'],
  'nl-col-pvc-pipes': ['brand', 'type', 'size', 'material', 'price'],
  'nl-col-kitchen-sinks-faucets': ['brand', 'type', 'size', 'material', 'price', 'thickness'],
  'nl-col-home-appliances-power-backup': ['brand', 'type', 'colour', 'material', 'price'],
};

const NL_CABINET_HARDWARE_FILTERS = dimsFromKeys(NEW_LAUNCH_FILTER_KEYS_BY_COLLECTION['nl-col-cabinet-hardware']);
const NL_KITCHEN_SYSTEMS_FILTERS = dimsFromKeys(NEW_LAUNCH_FILTER_KEYS_BY_COLLECTION['nl-col-kitchen-systems-hardware']);
const NL_GENERAL_TOOLS_FILTERS = dimsFromKeys(NEW_LAUNCH_FILTER_KEYS_BY_COLLECTION['nl-col-general-hardware-tools']);
const NL_BATHROOM_RENO_FILTERS = dimsFromKeys(NEW_LAUNCH_FILTER_KEYS_BY_COLLECTION['nl-col-bathroom-renovation-materials']);
const NL_CONDUITS_PIPING_FILTERS = dimsFromKeys(NEW_LAUNCH_FILTER_KEYS_BY_COLLECTION['nl-col-conduits-piping']);
const NL_PVC_PIPES_FILTERS = dimsFromKeys(NEW_LAUNCH_FILTER_KEYS_BY_COLLECTION['nl-col-pvc-pipes']);
const NL_KITCHEN_SINKS_FILTERS = dimsFromKeys(NEW_LAUNCH_FILTER_KEYS_BY_COLLECTION['nl-col-kitchen-sinks-faucets']);
const NL_HOME_APPLIANCES_FILTERS = dimsFromKeys(NEW_LAUNCH_FILTER_KEYS_BY_COLLECTION['nl-col-home-appliances-power-backup']);

export const CATEGORY_FILTER_CONFIGS: Record<string, CategoryFilterDimension[]> = {
  // 1. Cement
  cement: CEMENT_FILTERS,
  'cement-concrete': CEMENT_FILTERS,

  // 2. Tiling
  tiling: TILING_FILTERS,
  'tiling-tile-adhesives': TILING_FILTERS,

  // 3. Plywood, MDF & HDHMR
  'plywood-mdf-hdhmr': PLYWOOD_FILTERS,

  // 4. Fevicol
  fevicol: FEVICOL_FILTERS,
  adhesives: FEVICOL_FILTERS,

  // 5. Waterproofing
  waterproofing: WATERPROOFING_FILTERS,

  // 6. Painting
  painting: PAINTING_FILTERS,
  'painting-finishes': PAINTING_FILTERS,

  // 7. Hinges, Channels & Handles
  'hinges-channels-handles': HINGES_FILTERS,

  // 8. Kitchen Systems & Accessories
  'kitchen-systems-accessories': KITCHEN_SYSTEMS_FILTERS,

  // 9. Wardrobe & Bed Fittings
  'wardrobe-bed-fittings': WARDROBE_FITTINGS_FILTERS,

  // 10. Door Locks & Hardware
  'door-locks-hardware': DOOR_LOCKS_FILTERS,

  // 11. Wires, MCB & Distribution Boards
  'wires-mcb-distribution-boards': WIRES_MCB_FILTERS,

  // 12. Switches & Sockets
  'switches-sockets': SWITCHES_SOCKETS_FILTERS,

  // 13. Electrical Conduits
  'electrical-conduits': ELECTRICAL_CONDUITS_FILTERS,

  // 14. Lighting
  'lighting': LIGHTING_FILTERS,

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
  'cpvc-pipes-overhead-tanks': CPVC_PIPES_FILTERS,

  // 17. Sanitary & Bath Fittings
  'sanitary-bath-fittings': SANITARY_BATH_FILTERS,

  // 18. Kitchen Sinks & Faucets
  'kitchen-sinks-faucets': NL_KITCHEN_SINKS_FILTERS,

  // 19. Overhead Tanks (renamed from water-storage-tanks)
  'overhead-tanks': OVERHEAD_TANKS_FILTERS,
  // legacy alias kept for backward compat
  'water-storage-tanks': OVERHEAD_TANKS_FILTERS,

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
  'general-hardware-tools': NL_GENERAL_TOOLS_FILTERS,

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
  'home-appliances-power-backup': NL_HOME_APPLIANCES_FILTERS,

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
  'bathroom-renovation-materials': NL_BATHROOM_RENO_FILTERS,

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

  // Main Categories (Top-level Landing Page Filter Sets)
  'civil-interiors': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'grade', name: 'Grade', type: 'checkbox', specKeys: ['Grade', 'Cement Type', 'Adhesive Type', 'Finish'] },
    { id: 'thickness', name: 'Thickness / Finish', type: 'checkbox', specKeys: ['Thickness', 'Finish', 'Surface Finish'] },
    { id: 'packSize', name: 'Pack Size', type: 'checkbox', isStandardField: 'packSize', specKeys: ['Packaging', 'Coverage'] },
    { id: 'rating', name: 'Rating', type: 'checkbox', isStandardField: 'rating' },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],
  'furniture-hardware': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'material', name: 'Material', type: 'checkbox', specKeys: ['Material'] },
    { id: 'finish', name: 'Finish', type: 'checkbox', specKeys: ['Finish'] },
    { id: 'packSize', name: 'Pack Size', type: 'checkbox', isStandardField: 'packSize' },
    { id: 'rating', name: 'Rating', type: 'checkbox', isStandardField: 'rating' },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],
  'electrical': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'wireSize', name: 'Wire Size', type: 'checkbox', specKeys: ['Conductor Size', 'Wire Size', 'Nominal Diameter', 'Wattage'] },
    { id: 'voltage', name: 'Voltage', type: 'checkbox', specKeys: ['Voltage', 'Current Carrying Capacity', 'Amp Rating'] },
    { id: 'cableType', name: 'Cable Type', type: 'checkbox', specKeys: ['Cable Type', 'Insulation', 'Product Type'] },
    { id: 'rating', name: 'Rating', type: 'checkbox', isStandardField: 'rating' },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],
  'plumbing-sanitary': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'pipeSize', name: 'Pipe Size', type: 'checkbox', specKeys: ['Nominal Diameter', 'Pipe Size', 'Capacity', 'Size'] },
    { id: 'pressureRating', name: 'Pressure Rating', type: 'checkbox', specKeys: ['Pressure Class', 'Pressure Rating'] },
    { id: 'material', name: 'Material', type: 'checkbox', specKeys: ['Material', 'Finish'] },
    { id: 'rating', name: 'Rating', type: 'checkbox', isStandardField: 'rating' },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],
  'hardware-appliances': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'capacity', name: 'Power / Capacity', type: 'checkbox', specKeys: ['Rated Power', 'Wattage', 'Capacity', 'Safety Category'] },
    { id: 'material', name: 'Material', type: 'checkbox', specKeys: ['Material'] },
    { id: 'rating', name: 'Rating', type: 'checkbox', isStandardField: 'rating' },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 29. New Launches (Additional Collection Filter Sets + Fallback Aggregate)
  'cabinet-hardware': NL_CABINET_HARDWARE_FILTERS,
  'kitchen-systems-hardware': NL_KITCHEN_SYSTEMS_FILTERS,
  'conduits-piping': NL_CONDUITS_PIPING_FILTERS,
  'pvc-pipes': NL_PVC_PIPES_FILTERS,
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

export function buildMainChildCategoryFilter(
  mainProducts: Product[],
  childList: Array<{ id: string; name: string; slug: string }> = []
): AvailableCategoryFilter | null {
  const countsMap = new Map<string, { value: string; label: string; count: number }>();

  for (const child of childList) {
    countsMap.set(child.slug.toLowerCase(), {
      value: child.slug,
      label: child.name,
      count: 0,
    });
  }

  for (const p of mainProducts) {
    const slug = (p.childCategorySlug || p.categorySlug || '').trim();
    const name = (p.childCategoryName || p.category || '').trim();
    const key = slug.toLowerCase() || name.toLowerCase();
    if (!key) continue;

    const existing =
      countsMap.get(slug.toLowerCase()) ||
      Array.from(countsMap.values()).find(
        (v) => v.label.toLowerCase() === name.toLowerCase() || v.value.toLowerCase() === slug.toLowerCase()
      );
    if (existing) {
      existing.count += 1;
    } else if (childList.length === 0) {
      const val = slug || name;
      const cur = countsMap.get(val.toLowerCase()) || {
        value: val,
        label: name || slug,
        count: 0,
      };
      cur.count += 1;
      countsMap.set(val.toLowerCase(), cur);
    }
  }

  const options = Array.from(countsMap.values());
  if (options.length === 0) return null;
  return {
    id: 'childCategory',
    name: 'Child Category',
    type: 'checkbox',
    options,
  };
}

/**
 * Computes the Product Type filter dimension for an active Child Category (or Main Category),
 * showing ONLY product types belonging to that category with accurate product counts.
 */
export function buildChildCategoryFilter(
  categoryProducts: Product[],
  childCategories: ChildCategoryMeta[] = [],
  dimensionLabel = 'Product Type'
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
    const subSlug = (p.productTypeSlug || p.subcategorySlug || '').trim();
    const subName = (p.productTypeName || p.subcategory || '').trim();
    const key = subSlug.toLowerCase() || subName.toLowerCase();
    if (!key) continue;

    // Match existing taxonomy child category / product type first
    const existing =
      countsMap.get(subSlug.toLowerCase()) ||
      Array.from(countsMap.values()).find(
        (v) => v.label.toLowerCase() === subName.toLowerCase() || v.value.toLowerCase() === subSlug.toLowerCase()
      );

    if (existing) {
      existing.count += 1;
    } else if (childCategories.length === 0) {
      // Fallback only if caller didn't pass canonical options
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

  const options = Array.from(countsMap.values()).filter((o) => o.count > 0);
  if (options.length === 0) return null;

  return {
    id: 'subcategory',
    name: dimensionLabel,
    type: 'checkbox',
    options,
  };
}

export function normalizeFilterOptionLabel(raw: string): string {
  return String(raw || '')
    .trim()
    .replace(/\s+/g, ' ');
}

export function extractProductValuesForDimension(
  p: Product,
  dim: CategoryFilterDimension
): string[] {
  const valuesFound: string[] = [];
  const pushVal = (raw: unknown) => {
    if (Array.isArray(raw)) {
      for (const item of raw) pushVal(item);
      return;
    }
    if (typeof raw === 'string') {
      const cleaned = normalizeFilterOptionLabel(raw);
      if (cleaned) valuesFound.push(cleaned);
    } else if (typeof raw === 'number' && !Number.isNaN(raw)) {
      valuesFound.push(String(raw));
    }
  };

  if (dim.isStandardField === 'brand') {
    pushVal(p.brand);
    return valuesFound;
  }
  if (dim.isStandardField === 'packSize') {
    pushVal(p.packSize);
    if (!p.packSize) pushVal(p.unit);
  }
  if (dim.isStandardField === 'rating') {
    if (p.rating >= 4.5) {
      valuesFound.push('4.5★ & above', '4★ & above', '3★ & above');
    } else if (p.rating >= 4.0) {
      valuesFound.push('4★ & above', '3★ & above');
    } else if (p.rating >= 3.0) {
      valuesFound.push('3★ & above');
    }
    return valuesFound;
  }

  if (dim.specKeys && p.specifications) {
    for (const key of dim.specKeys) {
      pushVal(p.specifications[key]);
    }
  }
  const catAttrCandidates = new Set<string>([dim.id, ...(dim.catAttrKeys || [])]);
  if (p.categoryAttributes) {
    for (const key of catAttrCandidates) {
      pushVal(p.categoryAttributes[key]);
    }
  }

  if (dim.id === 'type' || dim.name.toLowerCase() === 'type') {
    pushVal((p as any).productType);
  }
  if (dim.id === 'size' || dim.name.toLowerCase() === 'size') {
    pushVal((p as any).size);
  }

  if (p.attributes && Array.isArray(p.attributes)) {
    for (const attr of p.attributes) {
      const isMatch =
        attr.name.toLowerCase() === dim.name.toLowerCase() ||
        attr.name.toLowerCase() === dim.id.toLowerCase() ||
        Boolean(dim.specKeys?.some((k) => k.toLowerCase() === attr.name.toLowerCase()));
      if (isMatch && Array.isArray(attr.options)) {
        for (const opt of attr.options) {
          pushVal(typeof opt === 'string' ? opt : opt.value || opt.label);
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
          if (isMatch) pushVal(attrV);
        }
      }
    }
  }

  return valuesFound;
}

export function filterConfigsToDimensions(
  configs: CategoryFilterConfiguration[]
): CategoryFilterDimension[] {
  return [...configs]
    .filter((c) => c.isActive !== false && c.showInCustomer !== false && c.publishedStatus === 'PUBLISHED')
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .map((c) => ({
      id: c.fieldKey === 'category' ? 'subcategory' : c.fieldKey,
      name: c.filterName,
      type: c.fieldType === 'RANGE' ? 'range' : 'checkbox',
      selectionMode: c.selectionMode || 'MULTI',
      configuredOptions: Array.isArray(c.options) && c.options.length > 0 ? c.options : undefined,
      specKeys: c.specKeys && c.specKeys.length > 0 ? c.specKeys : [c.filterName],
      catAttrKeys: c.catAttrKeys && c.catAttrKeys.length > 0 ? c.catAttrKeys : [c.fieldKey],
      isStandardField:
        c.fieldKey === 'category' || c.fieldKey === 'subcategory'
          ? 'subcategory'
          : c.fieldKey === 'brand'
          ? 'brand'
          : c.fieldKey === 'price'
          ? 'price'
          : c.fieldKey === 'packSize'
          ? 'packSize'
          : c.isStandardField,
    }));
}

export const CATEGORY_FILTER_CONFIGS_SEED: CategoryFilterConfiguration[] = (() => {
  const slugToMeta: Record<string, { id: string; name: string; mainCategoryId: string; mainCategoryName: string }> = {
    cement: { id: 'cat-1', name: 'Cement', mainCategoryId: 'mc-1', mainCategoryName: 'Civil & Interiors' },
    tiling: { id: 'cat-2', name: 'Tiling', mainCategoryId: 'mc-1', mainCategoryName: 'Civil & Interiors' },
    'plywood-mdf-hdhmr': { id: 'cat-3', name: 'Plywood, MDF & HDHMR', mainCategoryId: 'mc-1', mainCategoryName: 'Civil & Interiors' },
    fevicol: { id: 'cat-4', name: 'Fevicol', mainCategoryId: 'mc-1', mainCategoryName: 'Civil & Interiors' },
    waterproofing: { id: 'cat-5', name: 'Waterproofing', mainCategoryId: 'mc-1', mainCategoryName: 'Civil & Interiors' },
    painting: { id: 'cat-6', name: 'Painting', mainCategoryId: 'mc-1', mainCategoryName: 'Civil & Interiors' },
    'hinges-channels-handles': { id: 'cat-7', name: 'Hinges, Channels & Handles', mainCategoryId: 'mc-2', mainCategoryName: 'Furniture & Architectural Hardware' },
    'kitchen-systems-accessories': { id: 'cat-8', name: 'Kitchen Systems & Accessories', mainCategoryId: 'mc-2', mainCategoryName: 'Furniture & Architectural Hardware' },
    'wardrobe-bed-fittings': { id: 'cat-9', name: 'Wardrobe & Bed Fittings', mainCategoryId: 'mc-2', mainCategoryName: 'Furniture & Architectural Hardware' },
    'door-locks-hardware': { id: 'cat-10', name: 'Door Locks & Hardware', mainCategoryId: 'mc-2', mainCategoryName: 'Furniture & Architectural Hardware' },
    'wires-mcb-distribution-boards': { id: 'cat-11', name: 'Wires, MCB & Distribution Boards', mainCategoryId: 'mc-3', mainCategoryName: 'Electrical' },
    'switches-sockets': { id: 'cat-12', name: 'Switches & Sockets', mainCategoryId: 'mc-3', mainCategoryName: 'Electrical' },
    'electrical-conduits': { id: 'cat-13', name: 'Electrical Conduits', mainCategoryId: 'mc-3', mainCategoryName: 'Electrical' },
    lighting: { id: 'cat-14', name: 'Lighting', mainCategoryId: 'mc-3', mainCategoryName: 'Electrical' },
    'cpvc-pipes-overhead-tanks': { id: 'cat-16', name: 'CPVC Pipes & Overhead Tanks', mainCategoryId: 'mc-4', mainCategoryName: 'Plumbing, Sanitary & Bath' },
    'sanitary-bath-fittings': { id: 'cat-17', name: 'Sanitary & Bath Fittings', mainCategoryId: 'mc-4', mainCategoryName: 'Plumbing, Sanitary & Bath' },
    'overhead-tanks': { id: 'cat-19', name: 'Overhead Tanks', mainCategoryId: 'mc-4', mainCategoryName: 'Plumbing, Sanitary & Bath' },
  };
  const presetOptions: Record<string, Record<string, { options: string[]; fieldType?: CategoryFilterConfiguration['fieldType']; isRequired?: boolean; showInVendor?: boolean }>> = {
    'cat-1': {
      category: { options: [], fieldType: 'MULTISELECT', isRequired: false, showInVendor: false },
      brand: { options: [], fieldType: 'MULTISELECT', isRequired: false, showInVendor: false },
      type: { options: ['OPC 53 Grade', 'OPC 43 Grade', 'PPC (IS 1489)', 'White Portland Cement', 'Waterproof Cement', 'Ready-Mix Mortar'], fieldType: 'MULTISELECT', isRequired: true, showInVendor: true },
      colour: { options: ['Grey', 'Super White', 'Off White'], fieldType: 'MULTISELECT', isRequired: false, showInVendor: true },
      material: { options: ['Portland Pozzolana', 'Ordinary Portland', 'White Clinker'], fieldType: 'MULTISELECT', isRequired: false, showInVendor: true },
      grade: { options: ['Grade 53', 'Grade 43', 'PPC (IS 1489 Part 1)', 'White Cement 53 Grade', 'Super High Strength'], fieldType: 'MULTISELECT', isRequired: true, showInVendor: true },
      price: { options: [], fieldType: 'RANGE', isRequired: false, showInVendor: false },
      packSize: { options: ['50 Kg', '40 Kg', '25 Kg', '5 Kg', '1 Kg'], fieldType: 'MULTISELECT', isRequired: true, showInVendor: true },
    },
    'cat-2': {
      category: { options: [], fieldType: 'MULTISELECT', isRequired: false, showInVendor: false },
      brand: { options: [], fieldType: 'MULTISELECT', isRequired: false, showInVendor: false },
      type: { options: ['Floor Tile', 'Wall Tile', 'Tile Adhesive', 'Epoxy Grout', 'Tile Spacer'], fieldType: 'MULTISELECT', isRequired: true, showInVendor: true },
      size: { options: ['600 mm x 600 mm (2 ft x 2 ft)', '800 x 1600 mm', '300 x 450 mm'], fieldType: 'MULTISELECT', isRequired: false, showInVendor: true },
      colour: { options: ['Grey', 'White', 'Ivory', 'Terracotta', 'Graphite Black'], fieldType: 'MULTISELECT', isRequired: false, showInVendor: true },
      material: { options: ['Ceramic', 'Double Charge Vitrified', 'Porcelain', 'Cementitious Polymer', 'Epoxy Resin'], fieldType: 'MULTISELECT', isRequired: false, showInVendor: true },
      grade: { options: ['Type 1 Standard', 'Type 2 High Strength', 'PEI Class 4', 'Heavy Duty Commercial'], fieldType: 'MULTISELECT', isRequired: false, showInVendor: true },
      price: { options: [], fieldType: 'RANGE', isRequired: false, showInVendor: false },
      packSize: { options: ['4 Tiles per Box', '30 Kg', '20 Kg', '10 Kg', '5 Kg Bucket', '1 Kg'], fieldType: 'MULTISELECT', isRequired: true, showInVendor: true },
    },
    'cat-3': {
      category: { options: [], fieldType: 'MULTISELECT', isRequired: false, showInVendor: false },
      brand: { options: [], fieldType: 'MULTISELECT', isRequired: false, showInVendor: false },
      type: { options: ['BWP Marine Plywood', 'BWR Commercial Plywood', 'HDHMR Moisture Resistant Board', 'Interior MDF', 'Blockboard', 'WPC Board'], fieldType: 'MULTISELECT', isRequired: true, showInVendor: true },
      size: { options: ["8' X 4'", "7' X 4'", "8' X 3'", "7' X 3'"], fieldType: 'MULTISELECT', isRequired: true, showInVendor: true },
      colour: { options: ['Natural Wood', 'Green Core', 'Brown Teak', 'White'], fieldType: 'MULTISELECT', isRequired: false, showInVendor: true },
      material: { options: ['Hardwood Core', 'Gurjan Timber', 'Eucalyptus Core', 'High Density Wood Fibre', 'WPC Composite'], fieldType: 'MULTISELECT', isRequired: false, showInVendor: true },
      grade: { options: ['IS 710 BWP', 'IS 303 MR Grade', 'BWR IS 303', 'HDHMR High Density', 'IS 1659 Blockboard'], fieldType: 'MULTISELECT', isRequired: true, showInVendor: true },
      price: { options: [], fieldType: 'RANGE', isRequired: false, showInVendor: false },
      thickness: { options: ['6mm', '8mm', '9mm', '12mm', '16mm', '18mm', '19mm', '25mm'], fieldType: 'MULTISELECT', isRequired: true, showInVendor: true },
    },
    'cat-4': {
      category: { options: [], fieldType: 'MULTISELECT', isRequired: false, showInVendor: false },
      brand: { options: [], fieldType: 'MULTISELECT', isRequired: false, showInVendor: false },
      type: { options: ['Synthetic Resin Wood Adhesive', 'Boiling Water Proof Marine Adhesive', 'Epoxy 2-Part Structural', 'Silicone & Hybrid Sealant', 'Contact Rubber Adhesive'], fieldType: 'MULTISELECT', isRequired: true, showInVendor: true },
      price: { options: [], fieldType: 'RANGE', isRequired: false, showInVendor: false },
    },
    'cat-5': {
      category: { options: [], fieldType: 'MULTISELECT', isRequired: false, showInVendor: false },
      brand: { options: [], fieldType: 'MULTISELECT', isRequired: false, showInVendor: false },
      type: { options: ['Integral Liquid Admixture (LW+)', 'Acrylic Elastomeric Coating', '2K Cementitious Slurry Membrane', 'PU Waterproof Coating', 'Crack Seal & Injection Grout'], fieldType: 'MULTISELECT', isRequired: true, showInVendor: true },
      colour: { options: ['White', 'Grey', 'Terracotta', 'Clear / Translucent'], fieldType: 'MULTISELECT', isRequired: false, showInVendor: true },
      price: { options: [], fieldType: 'RANGE', isRequired: false, showInVendor: false },
    },
    'cat-6': {
      category: { options: [], fieldType: 'MULTISELECT', isRequired: false, showInVendor: false },
      brand: { options: [], fieldType: 'MULTISELECT', isRequired: false, showInVendor: false },
      type: { options: ['Exterior Emulsion', 'Interior Emulsion', 'Enamel & Wood Polish', 'Wall Primer & Putty', 'Elastomeric Waterproof Paint'], fieldType: 'MULTISELECT', isRequired: true, showInVendor: true },
      size: { options: ['1 Litre Can', '4 Litre Can', '10 Litre Bucket', '20 Litre Bucket'], fieldType: 'MULTISELECT', isRequired: false, showInVendor: true },
      colour: { options: ['Brilliant White', 'Pastel Ivory', 'Warm Beige', 'Slate Grey', 'Clear / Translucent'], fieldType: 'MULTISELECT', isRequired: false, showInVendor: true },
      material: { options: ['100% Acrylic Emulsion', 'Acrylic Putty', 'Alkyd Resin Enamel', 'Silicone Modified Acrylic'], fieldType: 'MULTISELECT', isRequired: false, showInVendor: true },
      price: { options: [], fieldType: 'RANGE', isRequired: false, showInVendor: false },
    },
    'cat-7': {
      brand: { options: [], fieldType: 'MULTISELECT', isRequired: false, showInVendor: false },
      type: { options: ['Auto Concealed Hinge', 'Soft-Close Hydraulic Auto-Hinge', 'Full-Extension Telescopic Channel', 'Telescopic Drawer Slide', 'Concealed Profile Handle', 'Heavy Tower Bolt & Hinges'], fieldType: 'MULTISELECT', isRequired: true, showInVendor: true },
      size: { options: ['Full Overlay (0 Crank)', '10 Inch (250mm)', '12 Inch (300mm)', '14 Inch (350mm)', '16 Inch (400mm)', '18 Inch (450mm)', '20 Inch (500mm)', '22 Inch (550mm)'], fieldType: 'MULTISELECT', isRequired: true, showInVendor: true },
      colour: { options: ['Nickel / Satin Brush', 'Zinc Plated Silver', 'Matt Black', 'Antique Brass', 'Rose Gold'], fieldType: 'MULTISELECT', isRequired: false, showInVendor: true },
      material: { options: ['Cold Rolled Steel (Zinc Plated)', 'Stainless Steel 304 Grade', 'SS 304 Stainless Steel', 'Anodized Aluminium', 'Zinc Alloy'], fieldType: 'MULTISELECT', isRequired: true, showInVendor: true },
      price: { options: [], fieldType: 'RANGE', isRequired: false, showInVendor: false },
    },
    'cat-8': {
      brand: { options: [], fieldType: 'MULTISELECT', isRequired: false, showInVendor: false },
      type: { options: ['Modular Wire Basket', 'Soft-Close Tandem Drawer Box', 'Tandem Drawer Box', 'Pull-Out Pantry / Tall Unit', 'Corner Carousel & Magic Corner'], fieldType: 'MULTISELECT', isRequired: true, showInVendor: true },
      size: { options: ['450mm (18 Inch)', '500 mm', '600mm (24 Inch)', '17 x 20 x 6 Inch', '900mm Corner Unit'], fieldType: 'MULTISELECT', isRequired: true, showInVendor: true },
      colour: { options: ['Chrome Plated', 'Anthracite Grey', 'Stainless Steel Finish', 'Matt Black'], fieldType: 'MULTISELECT', isRequired: false, showInVendor: true },
      material: { options: ['SS 304 Stainless Steel', 'AISI SS 304 Grade', 'Electroplated Galvanized Steel', 'Aluminium Extruded'], fieldType: 'MULTISELECT', isRequired: true, showInVendor: true },
      price: { options: [], fieldType: 'RANGE', isRequired: false, showInVendor: false },
      thickness: { options: ['13 mm Slim Double Wall', '16mm Double Wall', '6mm Outer Frame', '1.2mm Sheet Gauge'], fieldType: 'MULTISELECT', isRequired: false, showInVendor: true },
    },
    'cat-9': {
      brand: { options: [], fieldType: 'MULTISELECT', isRequired: false, showInVendor: false },
      type: { options: ['Hydraulic Bed Lift Mechanism', 'Wardrobe Sliding Track Set', 'Base Frame Side Mount', 'Pull-Down Closet Lift', 'Trouser & Organizer Rack'], fieldType: 'MULTISELECT', isRequired: true, showInVendor: true },
      size: { options: ['5 ft & 6 ft Bed Storage', '1200mm (4 Feet)', '2.0m (6.5 Feet)', '2.4m (8 Feet)'], fieldType: 'MULTISELECT', isRequired: false, showInVendor: true },
      colour: { options: ['Powder Coated Black', 'Champagne Silver', 'Matt Anthracite', 'Satin Chrome'], fieldType: 'MULTISELECT', isRequired: false, showInVendor: true },
      material: { options: ['Heavy Gauge Cold Rolled Steel', 'Anodized Aluminium', 'SS 304 Stainless Steel', 'Powder Coated MS Black'], fieldType: 'MULTISELECT', isRequired: true, showInVendor: true },
      price: { options: [], fieldType: 'RANGE', isRequired: false, showInVendor: false },
      thickness: { options: ['2.5mm Heavy Steel Frame', '3mm MS Plate', '18mm Door Compatibility', '22mm Track Profile'], fieldType: 'MULTISELECT', isRequired: false, showInVendor: true },
    },
    'cat-10': {
      brand: { options: [], fieldType: 'MULTISELECT', isRequired: false, showInVendor: false },
      type: { options: ['Mortise Handle Lock Set', 'Smart Biometric / PIN', 'Night Latch Rim Lock', 'Cylindrical Knob Lock', 'Brass Padlock', 'Heavy Duty Brass Padlock'], fieldType: 'MULTISELECT', isRequired: true, showInVendor: true },
      size: { options: ['8 Levers (70mm)', '7-Lever (65mm)', '240mm Mortise Plate', '60mm Cylindrical'], fieldType: 'MULTISELECT', isRequired: false, showInVendor: true },
      colour: { options: ['Satin Steel', 'Matt Black', 'Antique Brass', 'Polished Chrome', 'Rose Gold', 'Natural Brass'], fieldType: 'MULTISELECT', isRequired: false, showInVendor: true },
      material: { options: ['Solid Forged Brass Body', 'SS 304 Stainless Steel', 'Zinc Alloy + Hardened Steel Shackle'], fieldType: 'MULTISELECT', isRequired: true, showInVendor: true },
      grade: { options: ['8 Brass Levers', '7-Lever High Security', 'EN 12209 Grade 3', 'Heavy Commercial Grade'], fieldType: 'MULTISELECT', isRequired: false, showInVendor: true },
      price: { options: [], fieldType: 'RANGE', isRequired: false, showInVendor: false },
      thickness: { options: ['32mm - 55mm Door', '35mm - 50mm Door', '12mm Shackle'], fieldType: 'MULTISELECT', isRequired: false, showInVendor: true },
    },
    'cat-11': {
      brand: { options: [], fieldType: 'MULTISELECT', isRequired: false, showInVendor: false },
      type: { options: ['FRLS Flame Retardant PVC Copper Wire', 'FR-LSH Zero Halogen Wire', 'Armoured Power Cable', 'MCB / RCCB Circuit Breaker', 'Metal Distribution Board'], fieldType: 'MULTISELECT', isRequired: true, showInVendor: true },
      size: { options: ['1.0 sq mm', '1.5 sq mm', '2.5 sq mm', '2.5 sq.mm', '4.0 sq mm', '6.0 sq mm', '10.0 sq mm', '8 Way DB', '12 Way DB'], fieldType: 'MULTISELECT', isRequired: true, showInVendor: true },
      colour: { options: ['Red', 'Yellow', 'Blue', 'Black', 'Green', 'Grey'], fieldType: 'MULTISELECT', isRequired: false, showInVendor: true },
      material: { options: ['99.97% Electrolytic Annealed Copper', 'FRLS Grade PVC Compound', 'Tinned Copper XLPE', 'Flame-Retardant Thermoset Housing'], fieldType: 'MULTISELECT', isRequired: true, showInVendor: true },
      grade: { options: ['IS 694 Certified', '1100V Grade', '16A C-Curve (10kA)', '32A C-Curve (10kA)', '63A Isolator'], fieldType: 'MULTISELECT', isRequired: false, showInVendor: true },
      price: { options: [], fieldType: 'RANGE', isRequired: false, showInVendor: false },
      thickness: { options: ['0.7mm Insulation', '0.8mm Insulation', '1.0mm Sheath', '1.4mm Steel Enclosure'], fieldType: 'MULTISELECT', isRequired: false, showInVendor: true },
      numberOfCores: { options: ['Single Core', '2 Core', '3 Core', '4 Core'], fieldType: 'MULTISELECT', isRequired: false, showInVendor: true },
    },
    'cat-12': {
      brand: { options: [], fieldType: 'MULTISELECT', isRequired: false, showInVendor: false },
      type: { options: ['Modular Switch', '1-Way Switch', '2-Way Modular Switch', 'Power Socket', 'Combined Universal Socket', 'Fan Regulator & Dimmer', 'Cover Plate Frame'], fieldType: 'MULTISELECT', isRequired: true, showInVendor: true },
      size: { options: ['1 Module', '2 Module', '3 Module', '4 Module', '6 Module', '8 Module', '12 Module'], fieldType: 'MULTISELECT', isRequired: true, showInVendor: true },
      colour: { options: ['Pure White', 'Anthracite Matt Grey', 'Champagne Gold', 'Brushed Silver', 'Matt Black'], fieldType: 'MULTISELECT', isRequired: false, showInVendor: true },
      material: { options: ['Polycarbonate FR Grade', 'UV Stabilized Polycarbonate', 'Toughened Glass Plate', 'Phosphor Bronze Contacts'], fieldType: 'MULTISELECT', isRequired: false, showInVendor: true },
      price: { options: [], fieldType: 'RANGE', isRequired: false, showInVendor: false },
    },
    'cat-13': {
      brand: { options: [], fieldType: 'MULTISELECT', isRequired: false, showInVendor: false },
      type: { options: ['Rigid PVC Conduit Pipe', 'Flexible Corrugated Conduit', 'PVC Circular Junction Box', 'Deep Junction Box', 'Conduit Bend & Coupler'], fieldType: 'MULTISELECT', isRequired: true, showInVendor: true },
      size: { options: ['20 mm', '25 mm (3 Metres)', '25 mm Outer Diameter', '32 mm', '40 mm'], fieldType: 'MULTISELECT', isRequired: true, showInVendor: true },
      colour: { options: ['White', 'Ivory', 'Grey', 'Black'], fieldType: 'MULTISELECT', isRequired: false, showInVendor: true },
      material: { options: ['FRLS Virgin uPVC', 'High-Impact PVC', 'Galvanized Iron (GI)'], fieldType: 'MULTISELECT', isRequired: true, showInVendor: true },
      grade: { options: ['Medium Mechanical Stress (Concrete Embedded)', 'Heavy Mechanical Stress IS 9537', 'Light Mechanical Stress'], fieldType: 'MULTISELECT', isRequired: false, showInVendor: true },
      price: { options: [], fieldType: 'RANGE', isRequired: false, showInVendor: false },
    },
    'cat-14': {
      brand: { options: [], fieldType: 'MULTISELECT', isRequired: false, showInVendor: false },
      type: { options: ['Recessed LED Downlight', 'COB Directional Spotlight', 'LED Batten Tube', 'Outdoor Flood Light', 'LED Strip & Driver'], fieldType: 'MULTISELECT', isRequired: true, showInVendor: true },
      size: { options: ['75mm Cutout', '135 mm Diameter Cutout', '150mm Cutout', '4 Feet Batten', '12 Watts (135mm)'], fieldType: 'MULTISELECT', isRequired: false, showInVendor: true },
      colour: { options: ['3000K Warm White (1260 Lumens)', '4000K Natural White', '6500K Cool Daylight', 'Tunable White'], fieldType: 'MULTISELECT', isRequired: false, showInVendor: true },
      price: { options: [], fieldType: 'RANGE', isRequired: false, showInVendor: false },
    },
    'cat-16': {
      brand: { options: [], fieldType: 'MULTISELECT', isRequired: false, showInVendor: false },
      type: { options: ['CPVC Plumbing Pipe', 'CPVC Hot & Cold Pipe', 'UPVC Cold Water Pipe', 'SWR Drainage Pipe', 'Elbow / Tee / Brass Threaded Fitting', 'Solvent Cement'], fieldType: 'MULTISELECT', isRequired: true, showInVendor: true },
      size: { options: ['1/2 Inch (15mm)', '3/4 Inch (20mm)', '25 mm (1 Inch)', '1-1/4 Inch (32mm)', '1-1/2 Inch (40mm)', '2 Inch (50mm)', '110mm SWR'], fieldType: 'MULTISELECT', isRequired: true, showInVendor: true },
      colour: { options: ['Off-White / Cream', 'White', 'Grey'], fieldType: 'MULTISELECT', isRequired: false, showInVendor: true },
      material: { options: ['Virgin Lead-Free CPVC (IS 15778)', 'Lead-Free UPVC (ASTM D1785)', 'SWR Type-B uPVC (IS 13592)', 'Dezincification-Resistant Brass', 'PTFE Thread Sealant'], fieldType: 'MULTISELECT', isRequired: true, showInVendor: true },
      grade: { options: ['SDR 11 (Class 1 - High Pressure)', 'SDR 11 (28.1 kg/cm² at 23°C)', 'SDR 13.5 (Class 2)', 'SCH 40 Heavy Duty', 'SCH 80 Industrial'], fieldType: 'MULTISELECT', isRequired: false, showInVendor: true },
      price: { options: [], fieldType: 'RANGE', isRequired: false, showInVendor: false },
    },
    'cat-17': {
      brand: { options: [], fieldType: 'MULTISELECT', isRequired: false, showInVendor: false },
      type: { options: ['Single Piece Water Closet (WC)', 'One-Piece / Wall-Hung Rimless EWC', 'Basin Mixer Faucet', 'Countertop / Pedestal Wash Basin', 'Rain Overhead Shower & Health Faucet', 'Concealed Cistern Frame'], fieldType: 'MULTISELECT', isRequired: true, showInVendor: true },
      size: { options: ['S-Trap 300mm', 'Standard 15mm Inlet', 'P-Trap 180mm', '600 x 450 mm Basin', '450mm Braided Hoses'], fieldType: 'MULTISELECT', isRequired: false, showInVendor: true },
      colour: { options: ['Alpine White', 'Chrome', 'Glossy Glazed Finish', 'Mirror Chrome Plated', 'Matt Black PVD', 'Brushed Gold'], fieldType: 'MULTISELECT', isRequired: false, showInVendor: true },
      material: { options: ['Vitreous China Ceramic', 'Forged Virgin Brass IS 319', 'SS 304 Stainless Steel', 'ABS Engineering Plastic'], fieldType: 'MULTISELECT', isRequired: true, showInVendor: true },
      price: { options: [], fieldType: 'RANGE', isRequired: false, showInVendor: false },
      thickness: { options: ['1.2mm Brass Body', '1.5mm SS Wall', 'Heavy Vitreous Ceramic Wall', '10mm Rimless Profile'], fieldType: 'MULTISELECT', isRequired: false, showInVendor: true },
    },
    'cat-19': {
      brand: { options: [], fieldType: 'MULTISELECT', isRequired: false, showInVendor: false },
      type: { options: ['Overhead Water Tank', '3-Layer UV Stabilized Vertical Tank', '4-Layer Foam Insulated Tank', '5-Layer Anti-Bacterial Heavy Duty', 'Loft Slim Rectangular Tank'], fieldType: 'MULTISELECT', isRequired: true, showInVendor: true },
      colour: { options: ['White', 'Yellow', 'Black', 'Blue'], fieldType: 'MULTISELECT', isRequired: false, showInVendor: true },
      material: { options: ['100% Virgin Food-Grade LLDPE', 'UV-Stabilized Food-Grade Polymer', 'Anti-Microbial Inner Layer PE'], fieldType: 'MULTISELECT', isRequired: true, showInVendor: true },
      price: { options: [], fieldType: 'RANGE', isRequired: false, showInVendor: false },
    },
  };

  const out: CategoryFilterConfiguration[] = [];
  for (const [slug, meta] of Object.entries(slugToMeta)) {
    const dims = CATEGORY_FILTER_CONFIGS[slug] || [];
    dims.forEach((dim, idx) => {
      const lookupKey = dim.isStandardField === 'subcategory' ? 'category' : dim.id;
      const preset = presetOptions[meta.id]?.[lookupKey];
      const normalizedFieldKey = dim.isStandardField === 'subcategory' ? 'category' : dim.id;
      out.push({
        id: `cfc-${meta.id}-${normalizedFieldKey}`,
        mainCategoryId: meta.mainCategoryId,
        mainCategoryName: meta.mainCategoryName,
        childCategoryId: meta.id,
        childCategorySlug: slug,
        childCategoryName: meta.name,
        filterName: dim.name,
        fieldKey: normalizedFieldKey,
        fieldType: preset?.fieldType || (dim.type === 'range' ? 'RANGE' : 'MULTISELECT'),
        options: preset?.options || [],
        specKeys: dim.specKeys,
        catAttrKeys: dim.catAttrKeys,
        isStandardField: dim.isStandardField,
        selectionMode: dim.selectionMode || (dim.isStandardField === 'rating' || dim.type === 'range' ? 'SINGLE' : 'MULTI'),
        isRequired: Boolean(preset?.isRequired),
        showInVendor: preset?.showInVendor !== undefined ? preset.showInVendor : false,
        showInCustomer: true,
        hideEmptyOptions: true,
        sortOrder: idx + 1,
        isActive: true,
        publishedStatus: 'PUBLISHED',
      });
    });
  }
  return out;
})();

export const NEW_LAUNCH_FILTER_CONFIGS_SEED: CategoryFilterConfiguration[] = (() => {
  const collectionsMeta: Array<{
    id: string;
    slug: string;
    title: string;
    mainCategoryId: string;
    mainCategoryName: string;
    presets: Record<string, { options: string[]; isRequired?: boolean }>;
  }> = [
    {
      id: 'nl-col-cabinet-hardware',
      slug: 'cabinet-hardware',
      title: 'Cabinet Hardware',
      mainCategoryId: 'mc-2',
      mainCategoryName: 'Furniture & Architectural Hardware',
      presets: {
        type: { options: ['Auto Concealed Hinge', 'Soft-Close Hydraulic Auto-Hinge', 'Telescopic Drawer Slide', 'Concealed Profile Handle', 'Cylindrical & Mechanical Lock'], isRequired: true },
        size: { options: ['Full Overlay (0 Crank)', 'Half Overlay', 'Inset', '12 Inch (300mm)', '18 Inch (450 mm)', '20 Inch (500mm)'], isRequired: true },
        colour: { options: ['Nickel Plated', 'Zinc Plated', 'Matt Black', 'Satin Steel', 'Antique Brass'] },
        material: { options: ['Stainless Steel 304 Grade', 'Cold Rolled Steel', 'Anodized Aluminium', 'Zinc Alloy'], isRequired: true },
        grade: { options: ['SS 304 Grade', '45 kg Dynamic Load', 'EN 15570 Level 3', 'Heavy Commercial Grade'] },
        thickness: { options: ['1.2mm Hinge Cup', '16mm - 22mm Shutter', '1.5mm Slide Steel'] },
      },
    },
    {
      id: 'nl-col-kitchen-systems-hardware',
      slug: 'kitchen-systems-hardware',
      title: 'Kitchen Systems & Hardware',
      mainCategoryId: 'mc-2',
      mainCategoryName: 'Furniture & Architectural Hardware',
      presets: {
        type: { options: ['Modular Wire Basket', 'Tandem Drawer Box', 'Magic Corner Unit', 'Tall Pantry Pullout', 'Cutlery Tray & Waste Bin'], isRequired: true },
        size: { options: ['17 x 20 x 6 Inch', '450mm Carcass', '500 mm', '600mm Carcass', '900mm Corner Unit'], isRequired: true },
        colour: { options: ['Chrome Plated', 'Anthracite Grey', 'Stainless Steel Finish', 'Matt Black'] },
        material: { options: ['SS 304 Stainless Steel', 'AISI SS 304 Grade', 'Powder Coated Steel', 'Anodized Aluminium'], isRequired: true },
        thickness: { options: ['13 mm Slim Double Wall', '16mm Double Wall', '6mm Outer Rod', '1.2mm Sheet Gauge'] },
      },
    },
    {
      id: 'nl-col-general-hardware-tools',
      slug: 'general-hardware-tools',
      title: 'General Hardware & Tools',
      mainCategoryId: 'mc-2',
      mainCategoryName: 'Furniture & Architectural Hardware',
      presets: {
        type: { options: ['Rotary Hammer Drill', 'Angle Grinder', 'Laser Measuring Tool', 'Tile Cutter & Tiling Trowel', 'Safety Helmet & PPE', 'Sealant & Adhesive'], isRequired: true },
        size: { options: ['100mm (4 Inch)', '125mm (5 Inch)', '20mm SDS-Plus', '30m Laser Range', 'Universal Fit'], isRequired: true },
        colour: { options: ['Industrial Yellow', 'Cobalt Blue', 'Safety Orange', 'Matt Black', 'Steel Grey'] },
        material: { options: ['Chrome Vanadium Steel', 'Tungsten Carbide', 'High-Impact ABS', 'Synthetic Polymer'], isRequired: true },
        grade: { options: ['Heavy Industrial Grade', 'Commercial Pro Grade', 'ISI / CE Certified', '800W - 1200W Rated'] },
        thickness: { options: ['1.6mm Cutting Disc', '2.5mm Steel Jaw', '3.0mm Shell'] },
      },
    },
    {
      id: 'nl-col-bathroom-renovation-materials',
      slug: 'bathroom-renovation-materials',
      title: 'Bathroom Renovation Materials',
      mainCategoryId: 'mc-4',
      mainCategoryName: 'Plumbing, Sanitary & Bath',
      presets: {
        type: { options: ['Single Piece Water Closet (WC)', 'Wall-Hung EWC', 'Basin Mixer Faucet', 'Concealed Diverter & Rain Shower', 'Tile Adhesive & Epoxy Grout', 'Waterproofing Membrane'], isRequired: true },
        size: { options: ['S-Trap 300mm', 'P-Trap 180mm', '1/2 Inch Inlet', '600 x 450 mm Basin', '20 Kg Pack'], isRequired: true },
        colour: { options: ['Alpine White', 'Chrome Plated', 'Matt Black PVD', 'Grey Grout', 'Ivory'] },
        material: { options: ['Vitreous China Ceramic', 'Forged Brass IS 319', 'Polymer Modified Cement', 'SS 304 Stainless Steel'], isRequired: true },
        grade: { options: ['EN 12004 C2TE', 'SS 304 Rust-Proof', 'High-Density Vitreous', 'Type 2 High Bond'] },
        thickness: { options: ['1.2mm Brass Body', '10mm Rimless Ceramic', '2mm Waterproof Coat'] },
      },
    },
    {
      id: 'nl-col-conduits-piping',
      slug: 'conduits-piping',
      title: 'Conduits & Piping',
      mainCategoryId: 'mc-3',
      mainCategoryName: 'Electrical',
      presets: {
        type: { options: ['Rigid PVC Conduit Pipe', 'Flexible Corrugated Conduit', 'PVC Circular Junction Box', 'Deep Fan & Switch Box', 'PVC Pipe Fitting'], isRequired: true },
        size: { options: ['20 mm', '25 mm Outer Diameter', '25 mm (3 Metres)', '32 mm', '40 mm'], isRequired: true },
        colour: { options: ['White', 'Ivory', 'Grey', 'Black'] },
        material: { options: ['FRLS Virgin uPVC', 'High-Impact PVC', 'Galvanized Iron'], isRequired: true },
        grade: { options: ['HMS Heavy Mechanical Stress IS 9537', 'MMS Medium Mechanical Stress', 'FRLS Fire Retardant'] },
      },
    },
    {
      id: 'nl-col-pvc-pipes',
      slug: 'pvc-pipes',
      title: 'PVC Pipes',
      mainCategoryId: 'mc-4',
      mainCategoryName: 'Plumbing, Sanitary & Bath',
      presets: {
        type: { options: ['CPVC Hot & Cold Pipe', 'UPVC Cold Water Pipe', 'SWR Drainage Pipe', 'PVC Pipe & Brass Fitting', 'CPVC Solvent Cement'], isRequired: true },
        size: { options: ['1/2 Inch (15mm)', '3/4 Inch (20mm)', '25 mm (1 Inch)', '32 mm (1-1/4 Inch)', '40 mm (1-1/2 Inch)', '50 mm (2 Inch)', '110mm SWR'], isRequired: true },
        material: { options: ['Virgin Lead-Free CPVC (IS 15778)', 'Lead-Free uPVC (ASTM D1785)', 'SWR Type-B uPVC (IS 13592)', 'Forged Brass'], isRequired: true },
      },
    },
    {
      id: 'nl-col-kitchen-sinks-faucets',
      slug: 'kitchen-sinks-faucets',
      title: 'Kitchen Sinks & Faucets',
      mainCategoryId: 'mc-4',
      mainCategoryName: 'Plumbing, Sanitary & Bath',
      presets: {
        type: { options: ['Single Bowl Handmade Sink', 'Double Bowl SS Sink', 'Quartz Granite Sink', 'Pull-Out Kitchen Mixer Faucet', 'Deck-Mount Swivel Spout Tap'], isRequired: true },
        size: { options: ['24 x 18 x 9 Inch', '30 x 18 x 9 Inch', '37 x 20 x 9 Inch', '45 x 20 x 9 Inch', 'Standard 15mm Inlet'], isRequired: true },
        material: { options: ['SS 304 Stainless Steel', 'AISI 304 Satin Finish', 'Quartz Granite Composite', 'Solid Virgin Brass'], isRequired: true },
        thickness: { options: ['1.0mm (18 Gauge)', '1.2mm (16 Gauge)', '1.5mm Sound-Deadened Steel', '8mm Quartz Wall'] },
      },
    },
    {
      id: 'nl-col-home-appliances-power-backup',
      slug: 'home-appliances-power-backup',
      title: 'Home Appliances & Power Backup',
      mainCategoryId: 'mc-5',
      mainCategoryName: 'Hardware & Appliances',
      presets: {
        type: { options: ['Pure Sine Wave Inverter', 'Tubular Inverter Battery', 'Storage Water Geyser', 'Kitchen Chimney', 'Submersible & Booster Pump', 'BLDC Ceiling Fan'], isRequired: true },
        colour: { options: ['Pearl White', 'Metallic Silver', 'Matt Black', 'Anthracite Grey', 'Graphite Slate'] },
        material: { options: ['Feroglas Enamel Coated Steel', 'Powder Coated CRCA Steel', 'Heat-Resistant ABS Polymer', 'Toughened Glass'], isRequired: true },
      },
    },
  ];

  const out: CategoryFilterConfiguration[] = [];
  for (const col of collectionsMeta) {
    const keys = NEW_LAUNCH_FILTER_KEYS_BY_COLLECTION[col.id] || [];
    keys.forEach((fieldKey, idx) => {
      const tmpl = TEMPLATE_BY_KEY.get(fieldKey);
      if (!tmpl) return;
      const preset = col.presets[fieldKey];
      const isCoreField = fieldKey === 'brand' || fieldKey === 'price';
      out.push({
        id: `cfc-${col.id}-${fieldKey}`,
        mainCategoryId: col.mainCategoryId,
        mainCategoryName: col.mainCategoryName,
        childCategoryId: col.id,
        childCategorySlug: col.slug,
        childCategoryName: col.title,
        newLaunchCollectionId: col.id,
        newLaunchCollectionSlug: col.slug,
        newLaunchCollectionTitle: col.title,
        filterName: tmpl.filterName,
        fieldKey,
        fieldType: fieldKey === 'price' ? 'RANGE' : 'MULTISELECT',
        options: preset?.options || [],
        specKeys: tmpl.specKeys,
        catAttrKeys: tmpl.catAttrKeys,
        isStandardField: tmpl.isStandardField,
        selectionMode: fieldKey === 'price' ? 'SINGLE' : 'MULTI',
        isRequired: Boolean(preset?.isRequired),
        showInVendor: !isCoreField,
        showInCustomer: true,
        hideEmptyOptions: true,
        sortOrder: idx + 1,
        isActive: true,
        publishedStatus: 'PUBLISHED',
      });
    });
  }
  return out;
})();

/**
 * Extracts all valid, available filter options for a category based on the actual products in that category.
 * Supports Admin-published dynamic filter configurations as well as Main Category & Child Category PLPs
 * and computes live faceted product counts respecting other active filter selections.
 */
export function getAvailableFiltersForCategory(
  categorySlug: string,
  categoryProducts: Product[],
  childCategories?: ChildCategoryMeta[],
  mainChildCategories?: Array<{ id: string; name: string; slug: string }>,
  configuredDimensions?: CategoryFilterDimension[],
  activeFilters?: ActiveCategoryFilters,
  strictConfiguredOnly = false
): AvailableCategoryFilter[] {
  const isMainLanding = Array.isArray(mainChildCategories) && mainChildCategories.length > 0;
  const hasExplicitDimensions = Array.isArray(configuredDimensions);
  const rawDimensions =
    hasExplicitDimensions && (configuredDimensions.length > 0 || strictConfiguredOnly)
      ? configuredDimensions
      : CATEGORY_FILTER_CONFIGS[categorySlug] || [
          { id: 'subcategory', name: 'Category', type: 'checkbox', selectionMode: 'MULTI', isStandardField: 'subcategory' },
          { id: 'brand', name: 'Brand', type: 'checkbox', selectionMode: 'MULTI', isStandardField: 'brand' },
          { id: 'price', name: 'Price', type: 'range', selectionMode: 'SINGLE', isStandardField: 'price' }
        ];

  const scopeForDimension = (dimId: string): Product[] => {
    if (!activeFilters) return categoryProducts;
    const partial: ActiveCategoryFilters = {
      ...activeFilters,
      categories: dimId === 'category' ? [] : activeFilters.categories,
      childCategories: dimId === 'childCategory' ? [] : activeFilters.childCategories,
      brands: dimId === 'brand' ? [] : activeFilters.brands,
      subcategories: dimId === 'subcategory' || dimId === 'category' ? [] : activeFilters.subcategories,
      minPrice: dimId === 'price' ? undefined : activeFilters.minPrice,
      maxPrice: dimId === 'price' ? undefined : activeFilters.maxPrice,
      specifications: Object.fromEntries(
        Object.entries(activeFilters.specifications || {}).filter(([k]) => k !== dimId)
      ),
    };
    return applyCategoryFilters(categoryProducts, partial, categorySlug, rawDimensions);
  };

  const availableFilters: AvailableCategoryFilter[] = [];
  if (isMainLanding) {
    const mainChildFilter = buildMainChildCategoryFilter(scopeForDimension('childCategory'), mainChildCategories);
    if (mainChildFilter) availableFilters.push(mainChildFilter);
  }

  const hasCategoryDimInList = rawDimensions.some(
    (dim) => dim.id === 'subcategory' || dim.id === 'category' || dim.isStandardField === 'subcategory'
  );
  if (!strictConfiguredOnly && !hasCategoryDimInList) {
    const childCatFilter = buildChildCategoryFilter(
      scopeForDimension('subcategory'),
      childCategories || [],
      'Category'
    );
    if (childCatFilter) availableFilters.push(childCatFilter);
  }

  for (const dim of rawDimensions) {
    if (dim.id === 'subcategory' || dim.id === 'category' || dim.isStandardField === 'subcategory') {
      const childCatFilter = buildChildCategoryFilter(
        scopeForDimension('subcategory'),
        childCategories || [],
        dim.name || 'Category'
      );
      if (childCatFilter) {
        availableFilters.push({
          ...childCatFilter,
          selectionMode: dim.selectionMode || 'MULTI',
        });
      }
      continue;
    }

    const scopedProducts = scopeForDimension(dim.id);

    if (dim.type === 'range') {
      if (scopedProducts.length > 0) {
        const prices = scopedProducts.map((p) => p.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        availableFilters.push({
          id: dim.id,
          name: dim.name,
          type: 'range',
          selectionMode: dim.selectionMode || 'SINGLE',
          options: [],
          minPrice: Math.floor(minPrice / 10) * 10,
          maxPrice: Math.ceil(maxPrice / 10) * 10
        });
      }
      continue;
    }

    // Checkbox / Multi-select dimension: deduplicate normalized values while preserving crisp label
    const countsMap = new Map<string, { label: string; count: number }>();

    for (const p of scopedProducts) {
      const valuesFound = extractProductValuesForDimension(p, dim);
      const uniqueLowerPerProduct = new Map<string, string>();
      for (const val of valuesFound) {
        const low = val.toLowerCase();
        if (!uniqueLowerPerProduct.has(low)) {
          uniqueLowerPerProduct.set(low, val);
        }
      }
      for (const [low, label] of uniqueLowerPerProduct.entries()) {
        const cur = countsMap.get(low);
        if (cur) {
          cur.count += 1;
        } else {
          countsMap.set(low, { label, count: 1 });
        }
      }
    }

    // Never display an empty filter when zero products in the category carry a value for it
    if (countsMap.size > 0) {
      const options: FilterOption[] = Array.from(countsMap.values())
        .map(({ label, count }) => ({
          value: label,
          label,
          count
        }))
        .sort((a, b) => {
          if (dim.isStandardField === 'rating') {
            return b.value.localeCompare(a.value);
          }
          return b.count - a.count || a.label.localeCompare(b.label);
        });

      availableFilters.push({
        id: dim.id,
        name: dim.name,
        type: 'checkbox',
        selectionMode: dim.selectionMode || 'MULTI',
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
  categorySlug?: string,
  configuredDimensions?: CategoryFilterDimension[]
): Product[] {
  const dimensions =
    configuredDimensions && configuredDimensions.length > 0
      ? configuredDimensions
      : categorySlug
      ? CATEGORY_FILTER_CONFIGS[categorySlug] || []
      : [];
  const dimMap = new Map(dimensions.map((d) => [d.id, d]));

  return products.filter((p) => {
    // 0. Category filter (OR within selected categories, case-insensitive across name/slug/id/mainCategory)
    if (activeFilters.categories && activeFilters.categories.length > 0) {
      const catTargets = activeFilters.categories.map((c) => c.toLowerCase());
      const pCatId = String((p as any).categoryId || '').toLowerCase();
      const pMainSlug = String(p.mainCategorySlug || '').toLowerCase();
      const pMainId = String(p.mainCategoryId || '').toLowerCase();
      const matchCat =
        catTargets.includes((p.category || '').toLowerCase()) ||
        catTargets.includes((p.categorySlug || '').toLowerCase()) ||
        (pCatId && catTargets.includes(pCatId)) ||
        (pMainSlug && catTargets.includes(pMainSlug)) ||
        (pMainId && catTargets.includes(pMainId));
      if (!matchCat) {
        return false;
      }
    }

    // 0b. Child Category filter (OR within selected Child Categories on Main Category PLP)
    if (activeFilters.childCategories && activeFilters.childCategories.length > 0) {
      const ccTargets = activeFilters.childCategories.map((c) => c.toLowerCase());
      const matchCC =
        ccTargets.includes((p.childCategorySlug || p.categorySlug || '').toLowerCase()) ||
        ccTargets.includes((p.childCategoryName || p.category || '').toLowerCase()) ||
        ccTargets.includes(String(p.childCategoryId || (p as any).categoryId || '').toLowerCase());
      if (!matchCC) {
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

    // 2. Product Type / Subcategory filter (OR within selected product types, case-insensitive across name/slug/id)
    if (activeFilters.subcategories && activeFilters.subcategories.length > 0) {
      const normalizeSlug = (val: string) =>
        val.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const subTargets = new Set(
        activeFilters.subcategories.flatMap((s) => [s.toLowerCase(), normalizeSlug(s)])
      );
      const pSubId = String(p.productTypeId || (p as any).subcategoryId || '').toLowerCase();
      const pSubName = String(p.productTypeName || p.subcategory || '').toLowerCase();
      const pSubSlug = String(p.productTypeSlug || p.subcategorySlug || '').toLowerCase();
      const matchSub =
        (pSubName && (subTargets.has(pSubName) || subTargets.has(normalizeSlug(pSubName)))) ||
        (pSubSlug && subTargets.has(pSubSlug)) ||
        (pSubId && subTargets.has(pSubId));
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

        const productValues = extractProductValuesForDimension(p, dim);

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
