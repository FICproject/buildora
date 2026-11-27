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

const CEMENT_FILTERS: CategoryFilterDimension[] = [
  { id: 'brand', name: 'Brand', type: 'checkbox', selectionMode: 'MULTI', isStandardField: 'brand' },
  {
    id: 'cementType',
    name: 'Cement Type',
    type: 'checkbox',
    selectionMode: 'MULTI',
    specKeys: ['Cement Type', 'Grade', 'Standard'],
    catAttrKeys: ['cementType'],
  },
  {
    id: 'grade',
    name: 'Grade',
    type: 'checkbox',
    selectionMode: 'MULTI',
    specKeys: ['Grade', 'Compressive Strength (28 Days)'],
    catAttrKeys: ['grade'],
  },
  {
    id: 'packSize',
    name: 'Pack Size',
    type: 'checkbox',
    selectionMode: 'MULTI',
    isStandardField: 'packSize',
    specKeys: ['Packaging', 'Bag Type', 'Weight'],
    catAttrKeys: ['packSize'],
  },
  {
    id: 'colour',
    name: 'Color',
    type: 'checkbox',
    selectionMode: 'MULTI',
    specKeys: ['Colour', 'Color', 'Whiteness'],
    catAttrKeys: ['colour'],
  },
  { id: 'rating', name: 'Rating', type: 'checkbox', selectionMode: 'SINGLE', isStandardField: 'rating' },
  { id: 'price', name: 'Price', type: 'range', selectionMode: 'SINGLE', isStandardField: 'price' },
];

const TILING_FILTERS: CategoryFilterDimension[] = [
  { id: 'brand', name: 'Brand', type: 'checkbox', selectionMode: 'MULTI', isStandardField: 'brand' },
  {
    id: 'application',
    name: 'Application',
    type: 'checkbox',
    selectionMode: 'MULTI',
    specKeys: ['Application', 'Interior / Exterior', 'Tile Type'],
    catAttrKeys: ['application'],
  },
  {
    id: 'adhesiveType',
    name: 'Adhesive Type',
    type: 'checkbox',
    selectionMode: 'MULTI',
    specKeys: ['Adhesive Type', 'Product Type', 'Standard'],
    catAttrKeys: ['adhesiveType'],
  },
  {
    id: 'material',
    name: 'Material',
    type: 'checkbox',
    selectionMode: 'MULTI',
    specKeys: ['Tile Material', 'Material'],
    catAttrKeys: ['material'],
  },
  {
    id: 'size',
    name: 'Size',
    type: 'checkbox',
    selectionMode: 'MULTI',
    specKeys: ['Tile Dimensions', 'Dimensions', 'Size'],
    catAttrKeys: ['size'],
  },
  {
    id: 'finish',
    name: 'Surface Finish',
    type: 'checkbox',
    selectionMode: 'MULTI',
    specKeys: ['Surface Finish', 'Finish'],
    catAttrKeys: ['finish'],
  },
  {
    id: 'packSize',
    name: 'Pack Size',
    type: 'checkbox',
    selectionMode: 'MULTI',
    isStandardField: 'packSize',
    specKeys: ['Coverage', 'Coverage per Box', 'Packaging'],
    catAttrKeys: ['packSize'],
  },
  {
    id: 'colour',
    name: 'Color',
    type: 'checkbox',
    selectionMode: 'MULTI',
    specKeys: ['Colour', 'Color'],
    catAttrKeys: ['colour'],
  },
  { id: 'rating', name: 'Rating', type: 'checkbox', selectionMode: 'SINGLE', isStandardField: 'rating' },
  { id: 'price', name: 'Price', type: 'range', selectionMode: 'SINGLE', isStandardField: 'price' },
];

const PLYWOOD_FILTERS: CategoryFilterDimension[] = [
  { id: 'brand', name: 'Brand', type: 'checkbox', selectionMode: 'MULTI', isStandardField: 'brand' },
  {
    id: 'materialType',
    name: 'Material Type',
    type: 'checkbox',
    selectionMode: 'MULTI',
    specKeys: ['Material Type', 'Material', 'Grade'],
    catAttrKeys: ['materialType'],
  },
  {
    id: 'grade',
    name: 'Grade',
    type: 'checkbox',
    selectionMode: 'MULTI',
    specKeys: ['Grade', 'Preservative Treatment', 'Standard'],
    catAttrKeys: ['grade'],
  },
  {
    id: 'thickness',
    name: 'Thickness',
    type: 'checkbox',
    selectionMode: 'MULTI',
    specKeys: ['Thickness'],
    catAttrKeys: ['thickness'],
  },
  {
    id: 'size',
    name: 'Size',
    type: 'checkbox',
    selectionMode: 'MULTI',
    specKeys: ['Size', 'Dimensions'],
    catAttrKeys: ['size'],
  },
  {
    id: 'finish',
    name: 'Finish',
    type: 'checkbox',
    selectionMode: 'MULTI',
    specKeys: ['Surface Finish', 'Finish', 'Surface'],
    catAttrKeys: ['finish'],
  },
  {
    id: 'waterproofRating',
    name: 'Waterproof Rating',
    type: 'checkbox',
    selectionMode: 'SINGLE',
    specKeys: ['Water Resistance', 'Preservative Treatment', 'Waterproof Rating'],
    catAttrKeys: ['waterproofRating'],
  },
  { id: 'rating', name: 'Rating', type: 'checkbox', selectionMode: 'SINGLE', isStandardField: 'rating' },
  { id: 'price', name: 'Price', type: 'range', selectionMode: 'SINGLE', isStandardField: 'price' },
];

const FEVICOL_FILTERS: CategoryFilterDimension[] = [
  { id: 'brand', name: 'Brand', type: 'checkbox', selectionMode: 'MULTI', isStandardField: 'brand' },
  {
    id: 'adhesiveType',
    name: 'Adhesive Type',
    type: 'checkbox',
    selectionMode: 'MULTI',
    specKeys: ['Adhesive Type', 'Product Type', 'Water Resistance'],
    catAttrKeys: ['adhesiveType'],
  },
  {
    id: 'bondingApplication',
    name: 'Bonding Application',
    type: 'checkbox',
    selectionMode: 'MULTI',
    specKeys: ['Compatibility', 'Material Compatibility', 'Applications'],
    catAttrKeys: ['bondingApplication', 'applications'],
  },
  {
    id: 'waterResistance',
    name: 'Water Resistance',
    type: 'checkbox',
    selectionMode: 'SINGLE',
    specKeys: ['Water Resistance'],
    catAttrKeys: ['waterResistance'],
  },
  {
    id: 'settingTime',
    name: 'Setting Time',
    type: 'checkbox',
    selectionMode: 'MULTI',
    specKeys: ['Setting Time'],
    catAttrKeys: ['settingTime'],
  },
  {
    id: 'packSize',
    name: 'Pack Size',
    type: 'checkbox',
    selectionMode: 'MULTI',
    isStandardField: 'packSize',
    specKeys: ['Spread Coverage', 'Packaging'],
    catAttrKeys: ['packSize'],
  },
  { id: 'rating', name: 'Rating', type: 'checkbox', selectionMode: 'SINGLE', isStandardField: 'rating' },
  { id: 'price', name: 'Price', type: 'range', selectionMode: 'SINGLE', isStandardField: 'price' },
];

const WATERPROOFING_FILTERS: CategoryFilterDimension[] = [
  { id: 'brand', name: 'Brand', type: 'checkbox', selectionMode: 'MULTI', isStandardField: 'brand' },
  {
    id: 'waterproofingType',
    name: 'Product Type',
    type: 'checkbox',
    selectionMode: 'MULTI',
    specKeys: ['Product Type', 'Standard', 'Waterproofing Properties'],
    catAttrKeys: ['waterproofingType'],
  },
  {
    id: 'applicationArea',
    name: 'Application Area',
    type: 'checkbox',
    selectionMode: 'MULTI',
    specKeys: ['Application Area', 'Compatibility'],
    catAttrKeys: ['applicationArea', 'applicationAreas'],
  },
  {
    id: 'materialBase',
    name: 'Material Base',
    type: 'checkbox',
    selectionMode: 'MULTI',
    specKeys: ['Material', 'Base Type', 'Standard'],
    catAttrKeys: ['materialBase'],
  },
  {
    id: 'packSize',
    name: 'Pack Size',
    type: 'checkbox',
    selectionMode: 'MULTI',
    isStandardField: 'packSize',
    specKeys: ['Dosage', 'Packaging'],
    catAttrKeys: ['packSize'],
  },
  { id: 'rating', name: 'Rating', type: 'checkbox', selectionMode: 'SINGLE', isStandardField: 'rating' },
  { id: 'price', name: 'Price', type: 'range', selectionMode: 'SINGLE', isStandardField: 'price' },
];

const PAINTING_FILTERS: CategoryFilterDimension[] = [
  { id: 'brand', name: 'Brand', type: 'checkbox', selectionMode: 'MULTI', isStandardField: 'brand' },
  {
    id: 'paintType',
    name: 'Paint Type',
    type: 'checkbox',
    selectionMode: 'MULTI',
    specKeys: ['Paint Type', 'Warranty'],
    catAttrKeys: ['paintType'],
  },
  {
    id: 'finish',
    name: 'Finish',
    type: 'checkbox',
    selectionMode: 'MULTI',
    specKeys: ['Finish', 'Surface Finish'],
    catAttrKeys: ['finish'],
  },
  {
    id: 'applicationSurface',
    name: 'Application Surface',
    type: 'checkbox',
    selectionMode: 'MULTI',
    specKeys: ['Surface Type', 'Application', 'Warranty'],
    catAttrKeys: ['applicationSurface'],
  },
  {
    id: 'colour',
    name: 'Color',
    type: 'checkbox',
    selectionMode: 'MULTI',
    specKeys: ['Colour', 'Color'],
    catAttrKeys: ['colour'],
  },
  {
    id: 'packSize',
    name: 'Pack Size',
    type: 'checkbox',
    selectionMode: 'MULTI',
    isStandardField: 'packSize',
    specKeys: ['Coverage', 'Packaging'],
    catAttrKeys: ['packSize'],
  },
  { id: 'rating', name: 'Rating', type: 'checkbox', selectionMode: 'SINGLE', isStandardField: 'rating' },
  { id: 'price', name: 'Price', type: 'range', selectionMode: 'SINGLE', isStandardField: 'price' },
];

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
  'hinges-channels-handles': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'material', name: 'Material', type: 'checkbox', specKeys: ['Material'], catAttrKeys: ['material'] },
    { id: 'finish', name: 'Finish', type: 'checkbox', specKeys: ['Finish'], catAttrKeys: ['finish'] },
    { id: 'size', name: 'Size', type: 'checkbox', specKeys: ['Length', 'Size'], catAttrKeys: ['size'] },
    { id: 'crankType', name: 'Type', type: 'checkbox', specKeys: ['Crank Type', 'Opening Angle', 'Product Type', 'Hardware Type / Mechanism'], catAttrKeys: ['hardwareModel', 'crankType'] },
    { id: 'loadCapacity', name: 'Load Capacity', type: 'checkbox', specKeys: ['Load Capacity', 'Extension'], catAttrKeys: ['loadCapacity'] },
    { id: 'rating', name: 'Rating', type: 'checkbox', isStandardField: 'rating' },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 8. Kitchen Systems & Accessories
  'kitchen-systems-accessories': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'material', name: 'Material', type: 'checkbox', specKeys: ['Grade', 'Material', 'Material Grade'], catAttrKeys: ['material'] },
    { id: 'cabinetSize', name: 'Size', type: 'checkbox', specKeys: ['Dimensions', 'Slide Length', 'Cabinet Width / Size'], catAttrKeys: ['cabinetSize'] },
    { id: 'weightRating', name: 'Load Capacity', type: 'checkbox', specKeys: ['Weight Rating', 'Wire Gauge'], catAttrKeys: ['weightRating'] },
    { id: 'damping', name: 'Features', type: 'checkbox', specKeys: ['Damping', 'Wall Thickness'], catAttrKeys: ['damping'] },
    { id: 'rating', name: 'Rating', type: 'checkbox', isStandardField: 'rating' },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 9. Wardrobe & Bed Fittings
  'wardrobe-bed-fittings': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'material', name: 'Material', type: 'checkbox', specKeys: ['Material', 'Material & Finish'], catAttrKeys: ['material', 'materialFinish'] },
    { id: 'finish', name: 'Finish', type: 'checkbox', specKeys: ['Finish', 'Material & Finish'], catAttrKeys: ['finish', 'materialFinish'] },
    { id: 'loadCapacity', name: 'Load Capacity', type: 'checkbox', specKeys: ['Load Capacity', 'Gas Spring / Load Capacity'], catAttrKeys: ['loadCapacity'] },
    { id: 'mountingType', name: 'Type', type: 'checkbox', specKeys: ['Mounting Type', 'Application', 'Size', 'Fitting Type'], catAttrKeys: ['fittingType', 'mountingType'] },
    { id: 'rating', name: 'Rating', type: 'checkbox', isStandardField: 'rating' },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 10. Door Locks & Hardware
  'door-locks-hardware': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'material', name: 'Material', type: 'checkbox', specKeys: ['Material', 'Body Material'], catAttrKeys: ['material'] },
    { id: 'lockType', name: 'Type', type: 'checkbox', specKeys: ['Shackle Material', 'Levers', 'Locking Mechanism', 'Lock Type'], catAttrKeys: ['lockType'] },
    { id: 'finish', name: 'Finish', type: 'checkbox', specKeys: ['Finish'], catAttrKeys: ['finish'] },
    { id: 'rating', name: 'Rating', type: 'checkbox', isStandardField: 'rating' },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 11. Wires, MCB & Distribution Boards
  'wires-mcb-distribution-boards': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'size', name: 'Wire Size / Modules', type: 'checkbox', specKeys: ['Conductor Size', 'Wire Size', 'Size'], catAttrKeys: ['size'] },
    { id: 'voltageOrRating', name: 'Voltage / Rating', type: 'checkbox', specKeys: ['Voltage', 'Voltage Rating', 'Current Carrying Capacity', 'Current Rating'], catAttrKeys: ['voltageOrRating'] },
    { id: 'electricalType', name: 'Type', type: 'checkbox', specKeys: ['Cable Type', 'Insulation', 'Certification', 'Product Type'], catAttrKeys: ['electricalType'] },
    { id: 'material', name: 'Material', type: 'checkbox', specKeys: ['Material'], catAttrKeys: ['material'] },
    { id: 'rating', name: 'Rating', type: 'checkbox', isStandardField: 'rating' },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 12. Switches & Sockets
  'switches-sockets': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'moduleSize', name: 'Size', type: 'checkbox', specKeys: ['Module Size', 'Number of Modules'], catAttrKeys: ['moduleSize'] },
    { id: 'ampVoltageRating', name: 'Rating', type: 'checkbox', specKeys: ['Amp Rating', 'Voltage Rating'], catAttrKeys: ['ampVoltageRating'] },
    { id: 'colour', name: 'Colors', type: 'checkbox', specKeys: ['Colour', 'Color'], catAttrKeys: ['colour'] },
    { id: 'switchType', name: 'Type', type: 'checkbox', specKeys: ['Series / Model', 'Switch Type', 'Socket Type', 'Product Type'], catAttrKeys: ['switchType'] },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 13. Electrical Conduits
  'electrical-conduits': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'nominalDiameter', name: 'Size', type: 'checkbox', specKeys: ['Nominal Diameter', 'Size'], catAttrKeys: ['nominalDiameter'] },
    { id: 'stressClass', name: 'Grade', type: 'checkbox', specKeys: ['Stress Class', 'Standard', 'Ways'], catAttrKeys: ['stressClass'] },
    { id: 'conduitType', name: 'Type', type: 'checkbox', specKeys: ['Conduit Type', 'Product Type', 'Material'], catAttrKeys: ['conduitType'] },
    { id: 'rating', name: 'Rating', type: 'checkbox', isStandardField: 'rating' },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 14. Lighting
  'lighting': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'wattage', name: 'Wattage', type: 'checkbox', specKeys: ['Wattage'], catAttrKeys: ['wattage'] },
    { id: 'colorTemperature', name: 'Color Temperature', type: 'checkbox', specKeys: ['Color Temperature', 'Colour Temperature'], catAttrKeys: ['colorTemperature'] },
    { id: 'cutoutSize', name: 'Size', type: 'checkbox', specKeys: ['Beam Angle', 'Ceiling Cutout'], catAttrKeys: ['cutoutSize'] },
    { id: 'lightingType', name: 'Type', type: 'checkbox', specKeys: ['Product Type'], catAttrKeys: ['lightingType'] },
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
    { id: 'diameter', name: 'Pipe Size', type: 'checkbox', specKeys: ['Nominal Diameter', 'Pipe Size', 'Size'], catAttrKeys: ['diameter'] },
    { id: 'pressureRating', name: 'Pressure Rating', type: 'checkbox', specKeys: ['Pressure Class', 'Pressure Rating'], catAttrKeys: ['pressureRating'] },
    { id: 'material', name: 'Material', type: 'checkbox', specKeys: ['Material', 'Max Operating Temp', 'Certification'], catAttrKeys: ['material'] },
    { id: 'pipeOrFittingType', name: 'Type', type: 'checkbox', specKeys: ['Product Type', 'Pipe / Fitting Type'], catAttrKeys: ['pipeOrFittingType'] },
    { id: 'rating', name: 'Rating', type: 'checkbox', isStandardField: 'rating' },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],

  // 17. Sanitary & Bath Fittings
  'sanitary-bath-fittings': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'material', name: 'Material', type: 'checkbox', specKeys: ['Material'], catAttrKeys: ['material'] },
    { id: 'finishColour', name: 'Finish', type: 'checkbox', specKeys: ['Finish', 'Colour'], catAttrKeys: ['finishColour'] },
    { id: 'installationType', name: 'Installation', type: 'checkbox', specKeys: ['Installation Type', 'Mounting Type'], catAttrKeys: ['installationType'] },
    { id: 'fixtureType', name: 'Type', type: 'checkbox', specKeys: ['Product Type', 'Water Flow / Operating Type'], catAttrKeys: ['fixtureType'] },
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

  // 19. Overhead Tanks (renamed from water-storage-tanks)
  'overhead-tanks': [
    { id: 'brand', name: 'Brand', type: 'checkbox', isStandardField: 'brand' },
    { id: 'capacity', name: 'Capacity', type: 'checkbox', specKeys: ['Capacity', 'Volume'], catAttrKeys: ['capacity'] },
    { id: 'layers', name: 'Layer Construction', type: 'checkbox', specKeys: ['Layer Construction', 'Layers'], catAttrKeys: ['layers'] },
    { id: 'shape', name: 'Shape', type: 'checkbox', specKeys: ['Shape', 'Tank Shape'], catAttrKeys: ['shape'] },
    { id: 'material', name: 'Material', type: 'checkbox', specKeys: ['Material', 'Grade'] },
    { id: 'rating', name: 'Rating', type: 'checkbox', isStandardField: 'rating' },
    { id: 'price', name: 'Price', type: 'range', isStandardField: 'price' }
  ],
  // legacy alias kept for backward compat
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

  // 29. New Launches (Promotional Collection Filter Set)
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

  const options = Array.from(countsMap.values());
  if (options.length === 0) return null;

  return {
    id: 'subcategory',
    name: dimensionLabel,
    type: 'checkbox',
    options,
  };
}

export function filterConfigsToDimensions(
  configs: CategoryFilterConfiguration[]
): CategoryFilterDimension[] {
  return [...configs]
    .filter((c) => c.isActive !== false && c.showInCustomer !== false && c.publishedStatus === 'PUBLISHED')
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .map((c) => ({
      id: c.fieldKey,
      name: c.filterName,
      type: c.fieldType === 'RANGE' ? 'range' : 'checkbox',
      selectionMode: c.selectionMode || 'MULTI',
      configuredOptions: Array.isArray(c.options) && c.options.length > 0 ? c.options : undefined,
      specKeys: c.specKeys && c.specKeys.length > 0 ? c.specKeys : [c.filterName],
      catAttrKeys: c.catAttrKeys && c.catAttrKeys.length > 0 ? c.catAttrKeys : [c.fieldKey],
      isStandardField: c.isStandardField,
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
      cementType: { options: ['OPC 53 Grade', 'OPC 43 Grade', 'PPC (IS 1489)', 'White Portland Cement', 'Waterproof Cement', 'Ready-Mix Mortar'], fieldType: 'DROPDOWN', isRequired: true, showInVendor: true },
      grade: { options: ['Grade 53', 'Grade 43', 'PPC (IS 1489 Part 1)', 'White Cement 53 Grade', 'Super High Strength'], fieldType: 'DROPDOWN', isRequired: true, showInVendor: true },
      packSize: { options: ['50 Kg', '50 Kilograms', '40 Kg', '25 Kg', '5 Kg', '1 Kg'], fieldType: 'DROPDOWN', isRequired: true, showInVendor: true },
      colour: { options: ['Grey', 'Super White', 'Off White'], fieldType: 'DROPDOWN', isRequired: false, showInVendor: true },
    },
    'cat-2': {
      application: { options: ['Floor', 'Wall', 'Drywall & Wood', 'Swimming Pool & Wet Area', 'Outdoor Facade', 'Stone & Marble'], fieldType: 'MULTISELECT', isRequired: true, showInVendor: true },
      adhesiveType: { options: ['Polymer-modified', 'Polymer-modified Paste', 'Epoxy 2-Part', 'Type 1 Standard', 'Type 2 High Strength', 'Cementitious Grout'], fieldType: 'DROPDOWN', isRequired: true, showInVendor: true },
      material: { options: ['Ceramic', 'Double Charge Vitrified', 'Porcelain', 'Cementitious Polymer', 'Epoxy Resin'], fieldType: 'DROPDOWN', isRequired: false, showInVendor: true },
      size: { options: ['600 mm x 600 mm (2 ft x 2 ft)', '600 x 600 mm', '800 x 1600 mm', '300 x 450 mm'], fieldType: 'DROPDOWN', isRequired: false, showInVendor: true },
      finish: { options: ['Nano Polished Ultra Gloss', 'Matt', 'Satin', 'Rustic Anti-Skid', 'Smooth Grey'], fieldType: 'DROPDOWN', isRequired: false, showInVendor: true },
      packSize: { options: ['4 Tiles per Box', '30 kg', '20 kg', '10 kg', '5 Kg Bucket', '1 Kg'], fieldType: 'DROPDOWN', isRequired: true, showInVendor: true },
      colour: { options: ['Grey', 'White', 'Ivory', 'Terracotta', 'Graphite Black'], fieldType: 'DROPDOWN', isRequired: false, showInVendor: true },
    },
    'cat-3': {
      materialType: { options: ['BWP Marine Plywood', 'BWR Commercial Plywood', 'HDHMR Moisture Resistant Board', 'Interior MDF', 'Blockboard', 'WPC Board'], fieldType: 'DROPDOWN', isRequired: true, showInVendor: true },
      grade: { options: ['IS 710 BWP', 'IS 303 MR Grade', 'BWR IS 303', 'HDHMR High Density', 'IS 1659 Blockboard'], fieldType: 'DROPDOWN', isRequired: true, showInVendor: true },
      thickness: { options: ['6mm', '8mm', '9mm', '12mm', '16mm', '18mm', '19mm', '25mm'], fieldType: 'DROPDOWN', isRequired: true, showInVendor: true },
      size: { options: ["8' X 4'", "7' X 4'", "8' X 3'", "7' X 3'"], fieldType: 'DROPDOWN', isRequired: true, showInVendor: true },
      finish: { options: ['Calibrated Double Sanded', 'Smooth Uncoated', 'Pre-Laminated Matt', 'Veneer Face'], fieldType: 'DROPDOWN', isRequired: false, showInVendor: true },
      waterproofRating: { options: ['Boiling Water Proof (BWP)', 'Moisture Resistant (BWR/MR)', 'High Moisture Proof (HDHMR)', '100% Termite & Waterproof (WPC)'], fieldType: 'DROPDOWN', isRequired: false, showInVendor: true },
    },
    'cat-4': {
      adhesiveType: { options: ['Synthetic Resin Wood Adhesive', 'Boiling Water Proof Marine Adhesive', 'Epoxy 2-Part Structural', 'Silicone & Hybrid Sealant', 'Contact Rubber Adhesive'], fieldType: 'DROPDOWN', isRequired: true, showInVendor: true },
      bondingApplication: { options: ['Woodworking & Veneer', 'Marine Plywood & Wet Areas', 'Acrylic & Laminates', 'Glass, Metal & Ceramic', 'Marble & Stone Crack Repair'], fieldType: 'MULTISELECT', isRequired: true, showInVendor: true },
      waterResistance: { options: ['Boiling water proof (IS 4835)', 'D3 Water Resistant', 'Standard Interior Bond', 'Marine Grade Waterproof'], fieldType: 'DROPDOWN', isRequired: false, showInVendor: true },
      settingTime: { options: ['Quick Set (5 - 30 mins)', '4 to 6 hours', '6 to 8 hours Curing'], fieldType: 'DROPDOWN', isRequired: false, showInVendor: true },
      packSize: { options: ['500 g', '1 Kg', '2 Kg', '5 Kilograms', '10 Kg', '20 Kg', '50 Kg Drum'], fieldType: 'DROPDOWN', isRequired: true, showInVendor: true },
    },
    'cat-5': {
      waterproofingType: { options: ['Integral Liquid Admixture (LW+)', 'Acrylic Elastomeric Coating', '2K Cementitious Slurry Membrane', 'PU Waterproof Coating', 'Crack Seal & Injection Grout'], fieldType: 'DROPDOWN', isRequired: true, showInVendor: true },
      applicationArea: { options: ['Roof & Terrace Slab', 'Bathroom & Wet Zone', 'Water Tank & Sump', 'Foundation & Retaining Wall', 'Exterior Damp Walls'], fieldType: 'MULTISELECT', isRequired: true, showInVendor: true },
      materialBase: { options: ['Polymer-Modified Plasticiser', '100% Acrylic Elastomeric', 'Two-Component Cementitious', 'Polyurethane Resin'], fieldType: 'DROPDOWN', isRequired: false, showInVendor: true },
      packSize: { options: ['1 Litre', '5 Litres', '10 Litres', '20 Litres', '25 Kg Bag'], fieldType: 'DROPDOWN', isRequired: true, showInVendor: true },
    },
    'cat-6': {
      paintType: { options: ['Exterior Emulsion', 'Interior Emulsion', 'Enamel & Wood Polish', 'Wall Primer & Putty', 'Elastomeric Waterproof Paint'], fieldType: 'DROPDOWN', isRequired: true, showInVendor: true },
      finish: { options: ['Rich Sheen', 'Matt Finish', 'Satin Silk', 'Ultra Gloss Enamel', 'Dead Flat Primer'], fieldType: 'DROPDOWN', isRequired: true, showInVendor: true },
      applicationSurface: { options: ['Exterior Walls & Facades', 'Interior Living Walls', 'Metal & Wood Trim', 'Plaster & Ceiling'], fieldType: 'MULTISELECT', isRequired: true, showInVendor: true },
      colour: { options: ['Brilliant White', 'Pastel Ivory', 'Warm Beige', 'Slate Grey', 'Clear / Translucent'], fieldType: 'DROPDOWN', isRequired: false, showInVendor: true },
      packSize: { options: ['1 Litre Can', '4 Litre Can', '10 Litre Bucket', '20 Litre Bucket', '20 Litres'], fieldType: 'DROPDOWN', isRequired: true, showInVendor: true },
    },
    'cat-7': {
      material: { options: ['Cold Rolled Steel (Zinc Plated)', 'SS 304 Stainless Steel', 'Anodized Aluminium', 'Zinc Alloy'], fieldType: 'DROPDOWN', isRequired: true, showInVendor: true },
      finish: { options: ['Nickel / Satin Brush', 'Zinc Plated Silver', 'Matt Black', 'Antique Brass', 'Rose Gold'], fieldType: 'DROPDOWN', isRequired: true, showInVendor: true },
      size: { options: ['10 Inch (250mm)', '12 Inch (300mm)', '14 Inch (350mm)', '16 Inch (400mm)', '18 Inch (450mm)', '20 Inch (500mm)', '22 Inch (550mm)'], fieldType: 'DROPDOWN', isRequired: true, showInVendor: true },
      crankType: { options: ['0-Crank (Full Overlay)', '8-Crank (Half Overlay)', '16-Crank (Inset)', 'Soft-Close Ball Bearing'], fieldType: 'DROPDOWN', isRequired: false, showInVendor: true },
      loadCapacity: { options: ['35 Kg Standard', '45 Kg Dynamic Load', '60 Kg Heavy Duty'], fieldType: 'DROPDOWN', isRequired: false, showInVendor: true },
    },
    'cat-8': {
      material: { options: ['SS 304 Stainless Steel', 'AISI SS 304 Grade', 'Electroplated Galvanized Steel', 'Aluminium Extruded'], fieldType: 'DROPDOWN', isRequired: true, showInVendor: true },
      cabinetSize: { options: ['450mm (18 Inch)', '500mm Depth', '600mm (24 Inch)', '900mm Corner Unit'], fieldType: 'DROPDOWN', isRequired: true, showInVendor: true },
      weightRating: { options: ['25 Kg Wire Basket', '40 Kg Soft-Close Undermount', '75 Kg Tall Pantry'], fieldType: 'DROPDOWN', isRequired: false, showInVendor: true },
      damping: { options: ['Soft-Close Synchronized', 'Push-to-Open', 'Standard Ball Bearing'], fieldType: 'DROPDOWN', isRequired: false, showInVendor: true },
    },
    'cat-9': {
      material: { options: ['Powder Coated MS Black', 'Anodized Aluminium', 'SS 304 Stainless Steel'], fieldType: 'DROPDOWN', isRequired: false, showInVendor: false },
      finish: { options: ['Powder Coated Black', 'Champagne Silver', 'Matt Anthracite', 'Satin Chrome'], fieldType: 'DROPDOWN', isRequired: false, showInVendor: false },
      loadCapacity: { options: ['75 Kg (Single Bed)', '100 Kg (2-Door Wardrobe)', '125 Kg (Queen Bed)', '150 Kg (King Bed Heavy)'], fieldType: 'DROPDOWN', isRequired: true, showInVendor: true },
      mountingType: { options: ['Hydraulic Gas Lift', 'Top-Hung Sliding Track', 'Side-Mounted Organizer'], fieldType: 'DROPDOWN', isRequired: false, showInVendor: true },
    },
    'cat-10': {
      material: { options: ['SS 304 Stainless Steel', 'Solid Brass Forged', 'Zinc Alloy + Hardened Steel Shackle'], fieldType: 'DROPDOWN', isRequired: true, showInVendor: true },
      lockType: { options: ['Mortise Handle Lock Set', 'Cylindrical Knob Lock', 'Heavy Duty Brass Padlock', 'Smart Biometric / PIN'], fieldType: 'DROPDOWN', isRequired: true, showInVendor: true },
      finish: { options: ['Satin Steel', 'Matt Black', 'Antique Brass', 'Polished Chrome', 'Rose Gold'], fieldType: 'DROPDOWN', isRequired: true, showInVendor: true },
    },
    'cat-11': {
      electricalType: { options: ['FRLS Flame Retardant PVC Copper Wire', 'FR-LSH Zero Halogen Wire', 'Armoured Power Cable', 'MCB / RCCB Circuit Breaker', 'Metal Distribution Board'], fieldType: 'DROPDOWN', isRequired: true, showInVendor: true },
      size: { options: ['1.0 sq mm', '1.5 sq mm', '2.5 sq mm', '4.0 sq mm', '6.0 sq mm', '10.0 sq mm', 'SP / DP / TPN Breaker', '8 Way / 12 Way DB'], fieldType: 'DROPDOWN', isRequired: true, showInVendor: true },
      material: { options: ['99.97% Electrolytic Annealed Copper (FRLS PVC)', 'Tinned Copper XLPE', 'Flame-Retardant Thermoset Housing'], fieldType: 'DROPDOWN', isRequired: true, showInVendor: true },
      voltageOrRating: { options: ['1100V Grade', '16A C-Curve (10kA)', '32A C-Curve (10kA)', '40A / 63A Isolator'], fieldType: 'TEXT', isRequired: true, showInVendor: true },
    },
    'cat-12': {
      switchType: { options: ['1-Way / 2-Way Modular Switch', '6A / 16A Combined Power Socket', 'USB Fast Charger Module', 'Fan Regulator & Dimmer', 'Cover Plate Frame'], fieldType: 'DROPDOWN', isRequired: true, showInVendor: true },
      moduleSize: { options: ['1 Module', '2 Module', '3 Module', '4 Module', '6 Module', '8 Module', '12 Module'], fieldType: 'DROPDOWN', isRequired: true, showInVendor: true },
      colour: { options: ['Pure White', 'Anthracite Matt Grey', 'Champagne Gold', 'Brushed Silver'], fieldType: 'DROPDOWN', isRequired: true, showInVendor: true },
      ampVoltageRating: { options: ['6A / 240V AC', '16A / 240V AC 50Hz', '32A DP Switch'], fieldType: 'TEXT', isRequired: true, showInVendor: true },
    },
    'cat-13': {
      conduitType: { options: ['Rigid PVC FRLS Conduit Pipe', 'Flexible Corrugated Conduit', 'PVC Circular Junction Box', 'Bends, Couplers & Saddles'], fieldType: 'DROPDOWN', isRequired: true, showInVendor: true },
      nominalDiameter: { options: ['20mm (HMS Heavy)', '25mm (HMS Heavy)', '32mm Heavy Duty', '40mm Industrial'], fieldType: 'DROPDOWN', isRequired: true, showInVendor: true },
      stressClass: { options: ['FRLS Virgin uPVC (Heavy Mechanical Stress IS 9537)', 'Medium Stress IS 9537 Part 3', 'Galvanized GI Conduit'], fieldType: 'DROPDOWN', isRequired: true, showInVendor: true },
    },
    'cat-14': {
      lightingType: { options: ['Recessed LED Downlight', 'COB Architectural Spotlight', 'LED Batten Tube', 'Outdoor Flood / Street Light', 'LED Strip & Driver'], fieldType: 'DROPDOWN', isRequired: true, showInVendor: true },
      wattage: { options: ['7W', '12W', '15W', '18W', '20W', '24W', '36W', '50W'], fieldType: 'DROPDOWN', isRequired: true, showInVendor: true },
      colorTemperature: { options: ['6500K Cool Daylight', '4000K Natural White', '3000K Warm White', '3-in-1 CCT Tunable'], fieldType: 'DROPDOWN', isRequired: true, showInVendor: true },
      cutoutSize: { options: ['75mm Cutout', '125mm Cutout', '150mm Cutout', '4 Feet Batten', '5m Strip'], fieldType: 'TEXT', isRequired: false, showInVendor: true },
    },
    'cat-16': {
      pipeOrFittingType: { options: ['CPVC Hot & Cold Pipe', 'UPVC Cold Water Pipe', 'SWR Drainage Pipe', 'Elbow / Tee / Brass Threaded Fitting', 'Solvent Cement'], fieldType: 'DROPDOWN', isRequired: true, showInVendor: true },
      diameter: { options: ['1/2 Inch (15mm)', '3/4 Inch (20mm)', '1 Inch (25mm)', '1-1/4 Inch (32mm)', '1-1/2 Inch (40mm)', '2 Inch (50mm)', '110mm SWR'], fieldType: 'DROPDOWN', isRequired: true, showInVendor: true },
      pressureRating: { options: ['SDR 11 (Class 1 - High Pressure)', 'SDR 13.5 (Class 2)', 'SCH 40 Heavy Duty', 'SCH 80 Industrial'], fieldType: 'DROPDOWN', isRequired: true, showInVendor: true },
      material: { options: ['Virgin Lead-Free CPVC (IS 15778)', 'Lead-Free UPVC (ASTM D1785)', 'SWR Type-B uPVC (IS 13592)', 'Dezincification-Resistant Brass', 'PTFE Thread Sealant'], fieldType: 'DROPDOWN', isRequired: true, showInVendor: true },
    },
    'cat-17': {
      fixtureType: { options: ['One-Piece / Wall-Hung Rimless EWC', 'Countertop / Pedestal Wash Basin', 'Single-Lever Basin / Diverter Mixer', 'Rain Overhead Shower & Health Faucet', 'Shower Enclosure & Accessories', 'WC Concealed Cistern Frame'], fieldType: 'DROPDOWN', isRequired: true, showInVendor: true },
      material: { options: ['Vitreous Ceramic Porcelain', 'Solid Cast Brass Alloy', 'SS 304 Stainless Steel', 'ABS Engineering Plastic'], fieldType: 'DROPDOWN', isRequired: true, showInVendor: true },
      finishColour: { options: ['Alpine White Ceramic', 'Polished Chrome', 'Matt Black PVD', 'Brushed Gold', 'Rose Gold PVD'], fieldType: 'DROPDOWN', isRequired: true, showInVendor: true },
      installationType: { options: ['Wall Mounted', 'Floor Mounted S-Trap', 'Concealed In-Wall', 'Table Top', 'Deck Mounted', 'Column Freestanding'], fieldType: 'DROPDOWN', isRequired: true, showInVendor: true },
    },
    'cat-19': {
      capacity: { options: ['500 Litres', '1000 Litres', '1500 Litres', '2000 Litres', '3000 Litres', '5000 Litres'], fieldType: 'DROPDOWN', isRequired: true, showInVendor: true },
      layers: { options: ['3-Layer UV Stabilized', '4-Layer Foam Insulated', '5-Layer Anti-Bacterial Heavy Duty'], fieldType: 'DROPDOWN', isRequired: true, showInVendor: true },
      shape: { options: ['Vertical Cylindrical', 'Horizontal Cylindrical', 'Rectangular', 'Loft (Slim Vertical)'], fieldType: 'DROPDOWN', isRequired: true, showInVendor: true },
    },
  };

  const out: CategoryFilterConfiguration[] = [];
  for (const [slug, meta] of Object.entries(slugToMeta)) {
    const dims = CATEGORY_FILTER_CONFIGS[slug] || [];
    dims.forEach((dim, idx) => {
      const preset = presetOptions[meta.id]?.[dim.id];
      out.push({
        id: `cfc-${meta.id}-${dim.id}`,
        mainCategoryId: meta.mainCategoryId,
        mainCategoryName: meta.mainCategoryName,
        childCategoryId: meta.id,
        childCategorySlug: slug,
        childCategoryName: meta.name,
        filterName: dim.name,
        fieldKey: dim.id,
        fieldType: preset?.fieldType || (dim.type === 'range' ? 'RANGE' : 'CHECKBOX'),
        options: preset?.options || [],
        specKeys: dim.specKeys,
        catAttrKeys: dim.catAttrKeys,
        isStandardField: dim.isStandardField,
        selectionMode: dim.selectionMode || (dim.isStandardField === 'rating' || dim.type === 'range' ? 'SINGLE' : 'MULTI'),
        isRequired: Boolean(preset?.isRequired),
        showInVendor: Boolean(preset?.showInVendor),
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
 * Supports Admin-published dynamic filter configurations as well as Main Category & Child Category PLPs.
 */
export function getAvailableFiltersForCategory(
  categorySlug: string,
  categoryProducts: Product[],
  childCategories?: ChildCategoryMeta[],
  mainChildCategories?: Array<{ id: string; name: string; slug: string }>,
  configuredDimensions?: CategoryFilterDimension[]
): AvailableCategoryFilter[] {
  const isMainLanding = Array.isArray(mainChildCategories) && mainChildCategories.length > 0;
  const rawDimensions =
    configuredDimensions && configuredDimensions.length > 0
      ? configuredDimensions
      : CATEGORY_FILTER_CONFIGS[categorySlug] || [
          { id: 'brand', name: 'Brand', type: 'checkbox', selectionMode: 'MULTI', isStandardField: 'brand' },
          { id: 'packSize', name: 'Pack Size', type: 'checkbox', selectionMode: 'MULTI', isStandardField: 'packSize', specKeys: ['Packaging'] },
          { id: 'rating', name: 'Rating', type: 'checkbox', selectionMode: 'SINGLE', isStandardField: 'rating' },
          { id: 'price', name: 'Price', type: 'range', selectionMode: 'SINGLE', isStandardField: 'price' }
        ];

  const dimensions = rawDimensions.filter(
    (dim) => dim.id !== 'subcategory' && dim.id !== 'category' && dim.name.toLowerCase() !== 'category'
  );

  const availableFilters: AvailableCategoryFilter[] = [];
  if (isMainLanding) {
    const mainChildFilter = buildMainChildCategoryFilter(categoryProducts, mainChildCategories);
    if (mainChildFilter) availableFilters.push(mainChildFilter);
  }
  const childCatFilter = buildChildCategoryFilter(
    categoryProducts,
    childCategories || [],
    'Category'
  );
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
          selectionMode: dim.selectionMode || 'SINGLE',
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
        // Check categoryAttributes (supports both string and string[])
        const catAttrCandidates = new Set<string>([dim.id, ...(dim.catAttrKeys || [])]);
        if (p.categoryAttributes) {
          for (const key of catAttrCandidates) {
            const val = p.categoryAttributes[key];
            if (Array.isArray(val)) {
              for (const item of val) {
                if (typeof item === 'string' && item.trim()) valuesFound.push(item.trim());
              }
            } else if (val && typeof val === 'string' && val.trim()) {
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

    // Only include this filter if at least 1 matching option exists!
    if (countsMap.size > 0) {
      const options: FilterOption[] = Array.from(countsMap.entries())
        .map(([value, count]) => ({
          value,
          label: value,
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
      const subTargets = activeFilters.subcategories.map((s) => s.toLowerCase());
      const pSubId = String(p.productTypeId || (p as any).subcategoryId || '').toLowerCase();
      const matchSub =
        subTargets.includes((p.productTypeName || p.subcategory || '').toLowerCase()) ||
        subTargets.includes((p.productTypeSlug || p.subcategorySlug || '').toLowerCase()) ||
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

        const catAttrCandidates = new Set<string>([dim.id, ...(dim.catAttrKeys || [])]);
        if (p.categoryAttributes) {
          for (const key of catAttrCandidates) {
            const val = p.categoryAttributes[key];
            if (Array.isArray(val)) {
              for (const item of val) {
                if (typeof item === 'string' && item.trim()) productValues.push(item.trim());
              }
            } else if (val && typeof val === 'string') {
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
