import { CategoryFieldSchema, CategoryFieldType, CategoryFieldValidation } from '@buildora/types';

type RawFieldDef = {
  key: string;
  label: string;
  type: CategoryFieldType;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  helpText?: string;
  unitSuffix?: string;
  group?: string;
  validation?: CategoryFieldValidation;
};

function makeSchemas(
  childCategoryId: string,
  childCategorySlug: string,
  fields: RawFieldDef[]
): CategoryFieldSchema[] {
  return fields.map((f, idx) => ({
    id: `cfs-${childCategoryId}-${f.key}`,
    childCategoryId,
    childCategorySlug,
    fieldKey: f.key,
    label: f.label,
    fieldType: f.type,
    options: f.options,
    required: Boolean(f.required),
    placeholder: f.placeholder,
    helpText: f.helpText,
    unitSuffix: f.unitSuffix,
    group: f.group || 'Core Product Attributes',
    validation: f.validation,
    displayOrder: idx + 1,
    isActive: true,
  }));
}

export const CATEGORY_FIELD_SCHEMAS_SEED: CategoryFieldSchema[] = [
  // cat-1: Cement & Concrete
  ...makeSchemas('cat-1', 'cement-concrete', [
    { key: 'cementType', label: 'Cement Type', type: 'dropdown', required: true, options: ['OPC 53 Grade', 'OPC 43 Grade', 'PPC (IS 1489)', 'White Portland Cement', 'Sulphate Resistant', 'Ready-Mix Mortar'] },
    { key: 'grade', label: 'Grade', type: 'dropdown', required: true, options: ['Grade 53', 'Grade 43', 'PPC (IS 1489 Part 1)', 'White Cement 53 Grade', 'Super High Strength'] },
    { key: 'packSize', label: 'Pack Size', type: 'dropdown', required: true, options: ['50 Kg Bag', '40 Kg Bag', '25 Kg Bag', '5 Kg Pouch', '1 Kg Pouch'], group: 'Dimensions & Packaging' },
    { key: 'weightKg', label: 'Weight (Kg)', type: 'number', required: true, placeholder: 'e.g. 50', unitSuffix: 'Kg', group: 'Dimensions & Packaging', validation: { min: 0.5, max: 5000 } },
    { key: 'colour', label: 'Colour', type: 'text', required: false, placeholder: 'e.g. Grey / Super White' },
    { key: 'compressiveStrength', label: 'Compressive Strength (28 Days)', type: 'text', required: false, placeholder: 'e.g. Min 53 MPa', group: 'Performance & Compliance' },
    { key: 'standard', label: 'IS / Compliance Standard', type: 'text', required: false, placeholder: 'e.g. IS 1489 Part 1 / IS 269', group: 'Performance & Compliance' },
  ]),

  // cat-2: Tiling & Tile Adhesives
  ...makeSchemas('cat-2', 'tiling-tile-adhesives', [
    { key: 'productCategoryType', label: 'Tiling Product Type', type: 'dropdown', required: true, options: ['Vitrified Floor Tile', 'Ceramic Wall Tile', 'Polymer Tile Adhesive', 'Epoxy Grout & Spacers'] },
    { key: 'adhesiveOrFinish', label: 'Adhesive Type / Surface Finish', type: 'dropdown', required: true, options: ['Type 1 Polymer-Modified (Floor)', 'Type 2 Wall & Vitrified', 'Type 3 Granite & Outdoor', 'High Gloss / Polished', 'Matt / Satin', 'Epoxy 2-Part Grout'] },
    { key: 'dimensionsOrCoverage', label: 'Tile Dimensions / Spread Coverage', type: 'text', required: true, placeholder: 'e.g. 600 x 600 mm or 35-40 sq.ft / 20kg bag', group: 'Dimensions & Packaging' },
    { key: 'packSize', label: 'Pack Size', type: 'dropdown', required: true, options: ['20 Kg Bag', '25 Kg Bag', '50 Kg Bag', '5 Kg Bucket', '4 Pcs Box (15.5 sq.ft)'], group: 'Dimensions & Packaging' },
    { key: 'colour', label: 'Colour', type: 'text', required: false, placeholder: 'e.g. Grey / White / Statuario' },
    { key: 'waterResistant', label: 'Water & Frost Resistant', type: 'checkbox', required: false, group: 'Performance & Compliance' },
  ]),

  // cat-3: Plywood, MDF & HDHMR
  ...makeSchemas('cat-3', 'plywood-mdf-hdhmr', [
    { key: 'materialType', label: 'Material Type', type: 'dropdown', required: true, options: ['BWP Marine Plywood', 'BWR Commercial Plywood', 'HDHMR Board', 'Interior MDF', 'Blockboard'] },
    { key: 'thickness', label: 'Thickness', type: 'dropdown', required: true, options: ['6mm', '8mm', '12mm', '16mm', '18mm', '19mm', '25mm'], group: 'Dimensions & Packaging' },
    { key: 'sheetSize', label: 'Sheet Size (Length x Width)', type: 'dropdown', required: true, options: ["8' x 4' (2440 x 1220 mm)", "7' x 4' (2135 x 1220 mm)", "8' x 3'", "7' x 3'"], group: 'Dimensions & Packaging' },
    { key: 'grade', label: 'Grade', type: 'dropdown', required: true, options: ['BWP IS:710 Marine', 'BWR IS:303 Moisture Resistant', 'MR Commercial IS:303', 'High Density 850 kg/m3', 'Fire Retardant IS:5509'], group: 'Performance & Compliance' },
    { key: 'finish', label: 'Surface Finish / Treatment', type: 'text', required: false, placeholder: 'e.g. Calibrated Double-Side Sanded, Termite Proof' },
  ]),

  // cat-4: Adhesives
  ...makeSchemas('cat-4', 'adhesives', [
    { key: 'adhesiveType', label: 'Adhesive Type', type: 'dropdown', required: true, options: ['Synthetic Resin Wood Adhesive (PVA)', 'Fast Setting Marine Adhesive', 'Contact Neoprene Rubber', 'Epoxy Polyfix / Anchor'] },
    { key: 'applications', label: 'Recommended Substrates', type: 'multiselect', required: true, options: ['Wood to Wood', 'Laminate to Plywood', 'MDF & Veneer', 'Metal & PVC', 'Wet / Bathroom Area'] },
    { key: 'packSize', label: 'Pack Size', type: 'dropdown', required: true, options: ['500g Pouch', '1 Kg Container', '2 Kg Container', '5 Kg Bucket', '10 Kg Bucket', '20 Kg Drum', '50 Kg Barrel'], group: 'Dimensions & Packaging' },
    { key: 'settingTime', label: 'Setting / Handling Time', type: 'text', required: false, placeholder: 'e.g. 2 - 4 Hours Initial Set', group: 'Performance & Compliance' },
    { key: 'spreadCoverage', label: 'Spread Coverage', type: 'text', required: false, placeholder: 'e.g. 40 - 45 sq.ft / Kg', group: 'Performance & Compliance' },
  ]),

  // cat-5: Waterproofing
  ...makeSchemas('cat-5', 'waterproofing', [
    { key: 'waterproofingType', label: 'Product Type', type: 'dropdown', required: true, options: ['Integral Liquid Compound (LW+)', 'Acrylic Polymer Elastomeric Coating', '2K Cementitious Slurry', 'EPDM / Bitumen Membrane'] },
    { key: 'packVolume', label: 'Pack Size / Volume', type: 'dropdown', required: true, options: ['1 Litre Bottle', '5 Litre Can', '10 Litre Bucket', '20 Litre Drum', '200 Litre Barrel'], group: 'Dimensions & Packaging' },
    { key: 'dosageOrCoverage', label: 'Dosage / Coverage Area', type: 'text', required: true, placeholder: 'e.g. 200 ml per 50 kg Cement Bag or 1.4 sq.m / Litre', group: 'Performance & Compliance' },
    { key: 'applicationAreas', label: 'Application Zones', type: 'multiselect', required: true, options: ['Terrace & Roof Slab', 'Bathrooms & Wet Areas', 'Water Tanks & Sumps', 'Exterior Walls', 'Basement & Foundation'] },
    { key: 'standard', label: 'IS Standard', type: 'text', required: false, placeholder: 'e.g. IS 2645 Compliant', group: 'Performance & Compliance' },
  ]),

  // cat-6: Painting & Finishes
  ...makeSchemas('cat-6', 'painting-finishes', [
    { key: 'paintType', label: 'Paint Type', type: 'dropdown', required: true, options: ['Exterior Weatherproof Emulsion', 'Interior Luxury Emulsion', 'Wall Primer / Putty', 'Synthetic Enamel & Wood Coat'] },
    { key: 'finish', label: 'Finish', type: 'dropdown', required: true, options: ['Ultra Matt', 'Smooth Satin', 'Soft Sheen', 'High Gloss', 'Matte Silk'] },
    { key: 'colour', label: 'Colour / Base Shade', type: 'text', required: true, placeholder: 'e.g. Brilliant White / Morning Mist Grey' },
    { key: 'packSize', label: 'Pack Size', type: 'dropdown', required: true, options: ['1 Litre Tin', '4 Litre Bucket', '10 Litre Bucket', '20 Litre Drum', '40 Kg Putty Bag'], group: 'Dimensions & Packaging' },
    { key: 'coverage', label: 'Coverage (2 Coats)', type: 'text', required: true, placeholder: 'e.g. 55 - 65 sq.ft / Litre (2 coats)', group: 'Performance & Compliance' },
    { key: 'dryingTime', label: 'Drying Time', type: 'text', required: false, placeholder: 'e.g. Surface dry 30 mins, Recoat 4 hrs', group: 'Performance & Compliance' },
  ]),

  // cat-7: Hinges, Channels & Handles
  ...makeSchemas('cat-7', 'hinges-channels-handles', [
    { key: 'hardwareModel', label: 'Hardware Type / Mechanism', type: 'dropdown', required: true, options: ['Soft-Close Hydraulic Auto-Hinge', 'Full-Extension Telescopic Channel', 'Concealed Profile Handle', 'Heavy Tower Bolt & Hinges'] },
    { key: 'size', label: 'Size / Length', type: 'dropdown', required: true, options: ['10 Inch (250mm)', '12 Inch (300mm)', '14 Inch (350mm)', '16 Inch (400mm)', '18 Inch (450mm)', '20 Inch (500mm)', '22 Inch (550mm)'], group: 'Dimensions & Packaging' },
    { key: 'material', label: 'Material', type: 'dropdown', required: true, options: ['Cold Rolled Steel (Zinc Plated)', 'SS 304 Stainless Steel', 'Anodized Aluminium', 'Zinc Alloy'] },
    { key: 'finish', label: 'Finish', type: 'dropdown', required: true, options: ['Nickel / Satin Brush', 'Zinc Plated Silver', 'Matt Black', 'Antique Brass', 'Rose Gold'] },
    { key: 'loadCapacity', label: 'Load Capacity / Cycle Rating', type: 'text', required: false, placeholder: 'e.g. 45 Kg Dynamic Load / 50,000 Cycles', group: 'Performance & Compliance' },
  ]),

  // cat-8: Kitchen Systems & Accessories
  ...makeSchemas('cat-8', 'kitchen-systems-accessories', [
    { key: 'systemType', label: 'Kitchen System Type', type: 'dropdown', required: true, options: ['SS 304 Modular Wire Basket', 'Soft-Close Tandem Drawer Box', 'Pull-Out Pantry / Tall Unit', 'Corner Carousel & Magic Corner'] },
    { key: 'cabinetSize', label: 'Cabinet Width / Size', type: 'dropdown', required: true, options: ['450mm (18 Inch)', '500mm Depth', '600mm (24 Inch)', '900mm Corner Unit'], group: 'Dimensions & Packaging' },
    { key: 'material', label: 'Material Grade', type: 'dropdown', required: true, options: ['AISI SS 304 Grade', 'Electroplated Galvanized Steel', 'Aluminium Extruded'] },
    { key: 'weightRating', label: 'Load Rating (Kg)', type: 'text', required: false, placeholder: 'e.g. 40 Kg Soft-Close Undermount', group: 'Performance & Compliance' },
    { key: 'softCloseIncluded', label: 'Includes Soft-Close Runners', type: 'checkbox', required: false },
  ]),

  // cat-9: Wardrobe & Bed Fittings
  ...makeSchemas('cat-9', 'wardrobe-bed-fittings', [
    { key: 'fittingType', label: 'Fitting Type', type: 'dropdown', required: true, options: ['Hydraulic Bed Lift Mechanism', 'Wardrobe Sliding Track Set', 'Pull-Down Closet Lift', 'Trouser & Organizer Rack'] },
    { key: 'sizeOrLength', label: 'Size / Track Length', type: 'text', required: true, placeholder: 'e.g. 1200mm (4 Feet) or 2.4m (8 Feet)', group: 'Dimensions & Packaging' },
    { key: 'loadCapacity', label: 'Gas Spring / Load Capacity', type: 'dropdown', required: true, options: ['75 Kg (Single Bed)', '100 Kg (2-Door Wardrobe)', '125 Kg (Queen Bed)', '150 Kg (King Bed Heavy)'], group: 'Performance & Compliance' },
    { key: 'materialFinish', label: 'Material & Finish', type: 'text', required: true, placeholder: 'e.g. Powder Coated MS Black / Anodized Aluminium' },
  ]),

  // cat-10: Door Locks & Hardware
  ...makeSchemas('cat-10', 'door-locks-hardware', [
    { key: 'lockType', label: 'Lock Type', type: 'dropdown', required: true, options: ['Mortise Handle Lock Set', 'Smart Biometric / Digital Lock', 'Night Latch Rim Lock', 'Cylindrical Knob Lock', 'Heavy Duty Brass Padlock'] },
    { key: 'material', label: 'Body Material', type: 'dropdown', required: true, options: ['SS 304 Stainless Steel', 'Solid Brass Forged', 'Zinc Alloy + Hardened Steel Shackle'] },
    { key: 'finish', label: 'Finish', type: 'dropdown', required: true, options: ['Satin Steel', 'Matt Black', 'Antique Brass', 'Polished Chrome', 'Rose Gold'] },
    { key: 'sizeOrLevers', label: 'Lock Size / Door Thickness Support', type: 'text', required: false, placeholder: 'e.g. 7-Lever / 32mm - 55mm Door', group: 'Dimensions & Packaging' },
    { key: 'smartEnabled', label: 'Fingerprint / PIN Access', type: 'checkbox', required: false },
  ]),

  // cat-11: Wires, MCB & Distribution Boards
  ...makeSchemas('cat-11', 'wires-mcb-distribution-boards', [
    { key: 'electricalType', label: 'Wire / Product Type', type: 'dropdown', required: true, options: ['FRLS Flame Retardant PVC Copper Wire', 'FR-LSH Zero Halogen Wire', 'Armoured Power Cable', 'MCB / RCCB Circuit Breaker', 'Metal Distribution Board'] },
    { key: 'size', label: 'Conductor Size / Modules', type: 'dropdown', required: true, options: ['1.0 sq mm', '1.5 sq mm', '2.5 sq mm', '4.0 sq mm', '6.0 sq mm', '10.0 sq mm', 'SP / DP / TPN Breaker', '8 Way / 12 Way DB'], group: 'Dimensions & Packaging' },
    { key: 'voltageOrRating', label: 'Voltage / Current Rating', type: 'text', required: true, placeholder: 'e.g. 1100V Grade / 16A-32A C-Curve (10kA)' },
    { key: 'coilLengthOrWays', label: 'Length / Configuration', type: 'text', required: true, placeholder: 'e.g. 90 Metres Coil / 4-Pole', group: 'Dimensions & Packaging' },
    { key: 'material', label: 'Conductor & Insulation Material', type: 'dropdown', required: true, options: ['99.97% Electrolytic Annealed Copper (FRLS PVC)', 'Tinned Copper XLPE', 'Flame-Retardant Thermoset Housing'] },
    { key: 'certification', label: 'Standard / Certification', type: 'text', required: false, placeholder: 'e.g. IS 694 / IS/IEC 60898-1', group: 'Performance & Compliance' },
  ]),

  // cat-12: Switches & Sockets
  ...makeSchemas('cat-12', 'switches-sockets', [
    { key: 'switchType', label: 'Switch / Socket Type', type: 'dropdown', required: true, options: ['1-Way / 2-Way Modular Switch', '6A / 16A Combined Power Socket', 'USB Fast Charger Module', 'Fan Regulator & Dimmer', 'Cover Plate Frame'] },
    { key: 'moduleSize', label: 'Module Size', type: 'dropdown', required: true, options: ['1 Module', '2 Module', '3 Module', '4 Module', '6 Module', '8 Module', '12 Module'], group: 'Dimensions & Packaging' },
    { key: 'ampVoltageRating', label: 'Amp & Voltage Rating', type: 'text', required: true, placeholder: 'e.g. 16A / 240V AC 50Hz', group: 'Performance & Compliance' },
    { key: 'colour', label: 'Colour', type: 'dropdown', required: true, options: ['Pure White', 'Anthracite Matt Grey', 'Champagne Gold', 'Brushed Silver'] },
    { key: 'seriesModel', label: 'Series / Model', type: 'text', required: false, placeholder: 'e.g. Roma Urban / Penta Modular' },
  ]),

  // cat-13: Electrical Conduits
  ...makeSchemas('cat-13', 'electrical-conduits', [
    { key: 'conduitType', label: 'Conduit / Fitting Type', type: 'dropdown', required: true, options: ['Rigid PVC FRLS Conduit Pipe', 'Flexible Corrugated Conduit', 'PVC Circular Junction Box', 'Bends, Couplers & Saddles'] },
    { key: 'nominalDiameter', label: 'Diameter / Size', type: 'dropdown', required: true, options: ['20mm (HMS Heavy)', '25mm (HMS Heavy)', '32mm Heavy Duty', '40mm Industrial'], group: 'Dimensions & Packaging' },
    { key: 'length', label: 'Length / Pack', type: 'text', required: true, placeholder: 'e.g. 3 Metres Pipe or 50 Metres Roll', group: 'Dimensions & Packaging' },
    { key: 'stressClass', label: 'Stress Class & Material', type: 'dropdown', required: true, options: ['FRLS Virgin uPVC (Heavy Mechanical Stress IS 9537)', 'Medium Stress IS 9537 Part 3', 'Galvanized GI Conduit'], group: 'Performance & Compliance' },
    { key: 'colour', label: 'Colour', type: 'dropdown', required: false, options: ['Grey', 'Black', 'White'] },
  ]),

  // cat-14: Lighting
  ...makeSchemas('cat-14', 'lighting', [
    { key: 'lightingType', label: 'Luminaire Type', type: 'dropdown', required: true, options: ['Recessed LED Downlight', 'COB Architectural Spotlight', 'LED Batten Tube', 'Outdoor Flood / Street Light', 'LED Strip & Driver'] },
    { key: 'wattage', label: 'Wattage', type: 'dropdown', required: true, options: ['7W', '12W', '15W', '18W', '20W', '24W', '36W', '50W'], group: 'Performance & Compliance' },
    { key: 'colorTemperature', label: 'Colour Temperature', type: 'dropdown', required: true, options: ['6500K Cool Daylight', '4000K Natural White', '3000K Warm White', '3-in-1 CCT Tunable'] },
    { key: 'cutoutSize', label: 'Ceiling Cutout / Size', type: 'text', required: false, placeholder: 'e.g. 125mm Cutout / 4 Feet Batten', group: 'Dimensions & Packaging' },
    { key: 'surgeProtection', label: 'Built-in 4kV Surge Protection', type: 'checkbox', required: false, group: 'Performance & Compliance' },
  ]),

  // cat-15: Ceiling Fans & Exhaust
  ...makeSchemas('cat-15', 'ceiling-fans-exhaust', [
    { key: 'fanType', label: 'Fan Type', type: 'dropdown', required: true, options: ['BLDC Remote Energy-Saving Ceiling Fan', 'High-Speed Induction Ceiling Fan', 'Bathroom / Kitchen Exhaust Fan', 'Wall Mounted Fan'] },
    { key: 'sweepSize', label: 'Sweep Size', type: 'dropdown', required: true, options: ['150 mm (6 Inch Exhaust)', '200 mm (8 Inch Exhaust)', '900 mm (36 Inch)', '1200 mm (48 Inch Standard)', '1400 mm (56 Inch Hall)'], group: 'Dimensions & Packaging' },
    { key: 'wattage', label: 'Rated Wattage (W)', type: 'number', required: true, placeholder: 'e.g. 28', unitSuffix: 'W', group: 'Performance & Compliance', validation: { min: 5, max: 300 } },
    { key: 'airDelivery', label: 'Air Delivery / RPM', type: 'text', required: false, placeholder: 'e.g. 220 CMM / 370 RPM', group: 'Performance & Compliance' },
    { key: 'colour', label: 'Finish / Colour', type: 'dropdown', required: true, options: ['Luster White', 'Espresso Brown', 'Matte Black', 'Metallic Grey'] },
    { key: 'remoteIncluded', label: 'Includes RF Remote Control', type: 'checkbox', required: false },
  ]),

  // cat-16: CPVC Pipes & Overhead Tanks
  ...makeSchemas('cat-16', 'cpvc-pipes-overhead-tanks', [
    { key: 'pipeOrFittingType', label: 'Pipe / Fitting Type', type: 'dropdown', required: true, options: ['CPVC Hot & Cold Pipe', 'UPVC Cold Water Pipe', 'SWR Drainage Pipe', 'Elbow / Tee / Brass Threaded Fitting', 'Solvent Cement'] },
    { key: 'diameter', label: 'Nominal Diameter', type: 'dropdown', required: true, options: ['1/2 Inch (15mm)', '3/4 Inch (20mm)', '1 Inch (25mm)', '1-1/4 Inch (32mm)', '1-1/2 Inch (40mm)', '2 Inch (50mm)', '110mm SWR'], group: 'Dimensions & Packaging' },
    { key: 'length', label: 'Pipe Length / Size', type: 'text', required: true, placeholder: 'e.g. 3 Metres (10 Feet)', group: 'Dimensions & Packaging' },
    { key: 'pressureRating', label: 'Pressure Rating / Class', type: 'dropdown', required: true, options: ['SDR 11 (Class 1 - High Pressure)', 'SDR 13.5 (Class 2)', 'SCH 40 Heavy Duty', 'SCH 80 Industrial'], group: 'Performance & Compliance' },
    { key: 'material', label: 'Polymer Material', type: 'dropdown', required: true, options: ['Virgin Lead-Free CPVC (IS 15778)', 'Lead-Free UPVC (ASTM D1785)', 'SWR Type-B uPVC (IS 13592)'] },
    { key: 'maxTemp', label: 'Max Operating Temperature', type: 'text', required: false, placeholder: 'e.g. Up to 93°C', group: 'Performance & Compliance' },
  ]),

  // cat-17: Sanitary & Bath Fittings
  ...makeSchemas('cat-17', 'sanitary-bath-fittings', [
    { key: 'fixtureType', label: 'Sanitary / Fitting Type', type: 'dropdown', required: true, options: ['One-Piece / Wall-Hung Rimless EWC', 'Countertop / Pedestal Wash Basin', 'Single-Lever Basin / Diverter Mixer', 'Rain Overhead Shower & Health Faucet'] },
    { key: 'material', label: 'Material', type: 'dropdown', required: true, options: ['Vitreous Ceramic Porcelain', 'Solid Cast Brass Alloy', 'SS 304 Stainless Steel'] },
    { key: 'finishColour', label: 'Colour / Finish', type: 'dropdown', required: true, options: ['Alpine White Ceramic', 'Polished Chrome', 'Matt Black PVD', 'Brushed Gold'] },
    { key: 'installationType', label: 'Installation / Mounting Type', type: 'dropdown', required: true, options: ['Wall Mounted', 'Floor Mounted S-Trap', 'Concealed In-Wall', 'Table Top'] },
    { key: 'trapOrFlowSpec', label: 'Trap Distance / Flow Spec', type: 'text', required: false, placeholder: 'e.g. S-Trap 220mm / 3/6L Dual Flush', group: 'Dimensions & Packaging' },
  ]),

  // cat-18: Kitchen Sinks & Faucets
  ...makeSchemas('cat-18', 'kitchen-sinks-faucets', [
    { key: 'sinkOrFaucetType', label: 'Product Type', type: 'dropdown', required: true, options: ['Handmade SS 304 Kitchen Sink', 'Quartz Granite Composite Sink', 'Flexible Pull-Out Kitchen Faucet', 'Swivel Deck Sink Mixer'] },
    { key: 'dimensions', label: 'Size / Bowl Dimensions', type: 'dropdown', required: true, options: ['24" x 18" Single Bowl', '32" x 20" Bowl with Drainboard', '37" x 18" Double Bowl', 'Standard Brass Pillar/Deck Mount'], group: 'Dimensions & Packaging' },
    { key: 'material', label: 'Material & Thickness', type: 'dropdown', required: true, options: ['SS 304 Grade (1.2mm 18-Gauge)', 'SS 304 Heavy Handmade (1.5mm)', 'Quartz Stone Composite', 'Forged Brass Body'] },
    { key: 'finish', label: 'Surface Finish', type: 'dropdown', required: true, options: ['Satin Matt Brushed', 'Nano Black Matte PVD', 'Polished Chrome', 'Matt Charcoal Quartz'] },
    { key: 'accessoriesIncluded', label: 'Includes Waste Coupling & Drain Pipe', type: 'checkbox', required: false },
  ]),

  // cat-19: Water Storage Tanks
  ...makeSchemas('cat-19', 'water-storage-tanks', [
    { key: 'capacity', label: 'Storage Capacity', type: 'dropdown', required: true, options: ['500 Litres', '1000 Litres', '1500 Litres', '2000 Litres', '3000 Litres', '5000 Litres'], group: 'Dimensions & Packaging' },
    { key: 'layers', label: 'Layer Construction', type: 'dropdown', required: true, options: ['3-Layer UV Stabilized', '4-Layer Foam Insulated', '5-Layer Anti-Bacterial Heavy Duty'] },
    { key: 'dimensions', label: 'Dimensions (Dia x Height)', type: 'text', required: true, placeholder: 'e.g. 1100mm x 1250mm', group: 'Dimensions & Packaging' },
    { key: 'foodGradeVirgin', label: '100% Virgin Food-Grade LLDPE', type: 'checkbox', required: false, group: 'Performance & Compliance' },
    { key: 'warrantyYears', label: 'Manufacturer Warranty (Years)', type: 'number', required: false, placeholder: 'e.g. 10', unitSuffix: 'Years', validation: { min: 1, max: 25 } },
  ]),

  // cat-20: Power Tools & Accessories
  ...makeSchemas('cat-20', 'power-tools-accessories', [
    { key: 'toolCategory', label: 'Tool / Accessory Type', type: 'dropdown', required: true, options: ['4-Inch Angle Grinder', 'SDS-Plus Rotary Hammer Drill', 'Cordless Brushless Impact Driver', 'Marble / Wood Circular Saw', 'Diamond Cutting Blades & Bits'] },
    { key: 'powerRating', label: 'Rated Power / Voltage', type: 'dropdown', required: true, options: ['650W - 850W Corded 230V', '1200W - 1800W Heavy Duty', '18V Li-Ion Brushless Cordless', '4-Inch / 110mm Accessory'], group: 'Performance & Compliance' },
    { key: 'chuckOrDiscSize', label: 'Chuck / Disc / Drill Diameter', type: 'text', required: true, placeholder: 'e.g. 100mm Wheel / 26mm SDS-Plus', group: 'Dimensions & Packaging' },
    { key: 'noLoadRpm', label: 'Speed / Impact Rate', type: 'text', required: false, placeholder: 'e.g. 11,000 RPM / 2.7 Joules', group: 'Performance & Compliance' },
    { key: 'brushlessCordless', label: 'Cordless Brushless Technology', type: 'checkbox', required: false },
  ]),

  // cat-21: General Hardware & Tools
  ...makeSchemas('cat-21', 'general-hardware-tools', [
    { key: 'toolOrFastenerType', label: 'Hardware / Tool Type', type: 'dropdown', required: true, options: ['Measuring Tape & Spirit Level', 'Hammer, Chisel & Pliers', 'Drywall Screws & Anchor Fasteners', 'Silicone Gun & Masonry Trowel'] },
    { key: 'size', label: 'Size / Length', type: 'dropdown', required: true, options: ['5 Metre Tape', '8 Metre Tape', '30 Metre Fibreglass Tape', '6" / 8" / 10" Hand Tool', '35mm / 50mm / M8 Fasteners'], group: 'Dimensions & Packaging' },
    { key: 'material', label: 'Material & Metallurgy', type: 'text', required: true, placeholder: 'e.g. Drop-Forged Carbon Steel 50-58 HRC / SS Screws' },
    { key: 'packQuantity', label: 'Pack Quantity', type: 'dropdown', required: true, options: ['Single Unit', 'Set of 5 Pcs', 'Box of 100 Screws', 'Master Carton 500 Pcs'], group: 'Dimensions & Packaging' },
  ]),

  // cat-22: CCTV & Networking
  ...makeSchemas('cat-22', 'cctv-networking', [
    { key: 'deviceType', label: 'Security / Network Type', type: 'dropdown', required: true, options: ['IP Night-Vision Bullet/Dome Camera', 'HD NVR / DVR Recorder', 'CAT6 Ethernet UTP Cable', 'PoE Network Switch & Connectors'] },
    { key: 'resolutionOrSpeed', label: 'Resolution / Bandwidth Spec', type: 'dropdown', required: true, options: ['2MP 1080p Full HD', '4MP QHD ColorVu', '8MP 4K Ultra HD', 'Gigabit 1000 Mbps CAT6 (23 AWG)'], group: 'Performance & Compliance' },
    { key: 'channelOrLength', label: 'Channels / Cable Length', type: 'text', required: true, placeholder: 'e.g. 8 Channel NVR or 305 Metres Box', group: 'Dimensions & Packaging' },
    { key: 'connectivity', label: 'Connectivity Type', type: 'dropdown', required: false, options: ['PoE Wired RJ45', 'Dual-Band Wi-Fi', 'BNC Coaxial HD'] },
    { key: 'ip67Weatherproof', label: 'IP67 Outdoor Weatherproof Rated', type: 'checkbox', required: false },
  ]),

  // cat-23: Home Appliances & Power Backup
  ...makeSchemas('cat-23', 'home-appliances-power-backup', [
    { key: 'applianceType', label: 'Appliance / Backup Type', type: 'dropdown', required: true, options: ['Pure Sine Wave Inverter / UPS', 'Tubular Inverter Battery', 'Storage / Instant Water Geyser', 'Air Circulator & Exhaust'] },
    { key: 'capacityRating', label: 'Capacity / Power Rating', type: 'dropdown', required: true, options: ['900VA / 12V Inverter', '1100VA / 150Ah Combo', '1500VA / 24V Heavy UPS', '15 Litre 5-Star Geyser', '25 Litre Storage Geyser'], group: 'Performance & Compliance' },
    { key: 'voltageOrEnergy', label: 'Voltage / BEE Star Rating', type: 'text', required: true, placeholder: 'e.g. 230V AC / 5-Star 8 Bar Pressure', group: 'Performance & Compliance' },
    { key: 'batteryOrElement', label: 'Waveform / Heating Element', type: 'dropdown', required: false, options: ['Pure Sine Wave', 'Tall Tubular Plate Battery', 'Glassline Coated Incoloy Element'] },
  ]),

  // cat-24: Safety & Workwear
  ...makeSchemas('cat-24', 'safety-workwear', [
    { key: 'safetyCategory', label: 'Safety PPE Type', type: 'dropdown', required: true, options: ['Steel-Toe Safety Shoes', 'HDPE Ratchet Safety Helmet', 'Full-Body Safety Harness', 'High-Visibility Jacket & Cut Gloves'] },
    { key: 'size', label: 'Size', type: 'dropdown', required: true, options: ['Size 7 (UK 7)', 'Size 8 (UK 8)', 'Size 9 (UK 9)', 'Size 10 (UK 10)', 'Free Size Ratchet', 'Large / XL'], group: 'Dimensions & Packaging' },
    { key: 'protectionRating', label: 'Protection Rating', type: 'dropdown', required: true, options: ['200J Steel Toe IS 15298 S1P', 'S3 Water & Puncture Resistant', 'IS 2925 Industrial Impact Resistant', 'EN 361 Fall Arrest Certified'], group: 'Performance & Compliance' },
    { key: 'material', label: 'Outer & Core Material', type: 'text', required: true, placeholder: 'e.g. Genuine Buff Barton Leather / Dual-Density PU Sole' },
    { key: 'isiCertified', label: 'ISI / CE Certified', type: 'checkbox', required: false },
  ]),

  // cat-25: Glass Door Hardware
  ...makeSchemas('cat-25', 'glass-door-hardware', [
    { key: 'glassHardwareType', label: 'Hardware Type', type: 'dropdown', required: true, options: ['Hydraulic Floor Spring (100-120kg)', 'Top & Bottom Patch Fitting Set', 'SS Glass Door Pull Handle', 'Shower Glass Hinge & Spider Fitting'] },
    { key: 'glassThickness', label: 'Glass Thickness Compatibility', type: 'dropdown', required: true, options: ['8mm Shower Glass', '10mm Toughened Glass', '12mm Architectural Glass', '10mm - 12mm Adjustable'], group: 'Dimensions & Packaging' },
    { key: 'material', label: 'Material', type: 'dropdown', required: true, options: ['AISI SS 304 Stainless Steel', 'Forged Aluminium Body + SS Cover'] },
    { key: 'finish', label: 'Finish', type: 'dropdown', required: true, options: ['Satin Brushed SS', 'Mirror Gloss Chrome', 'Matte Black PVD', 'Rose Gold Titanium'] },
    { key: 'mountingSpec', label: 'Hold-Open / Opening Angle', type: 'text', required: false, placeholder: 'e.g. 90° Hold-Open Double Action', group: 'Performance & Compliance' },
  ]),

  // cat-26: Welding Consumables
  ...makeSchemas('cat-26', 'welding-consumables', [
    { key: 'consumableType', label: 'Welding Consumable Type', type: 'dropdown', required: true, options: ['Mild Steel Welding Electrodes (E6013)', 'SS / Cast Iron Welding Rods', 'Abrasive Metal Cutting Disc', 'Grinding Wheel & Welding PPE'] },
    { key: 'electrodeOrDiscSize', label: 'Diameter / Disc Size', type: 'dropdown', required: true, options: ['2.50mm x 350mm', '3.15mm x 350mm (10G)', '4.00mm x 450mm (8G)', '4-Inch (105mm x 1.0mm) Disc', '14-Inch (355mm) Chop Saw Wheel'], group: 'Dimensions & Packaging' },
    { key: 'materialCompatibility', label: 'Metal Compatibility', type: 'multiselect', required: true, options: ['Mild Steel (MS)', 'Structural Steel & TMT', 'Stainless Steel (SS 304/316)', 'Galvanized Iron (GI)', 'Cast Iron'] },
    { key: 'packWeight', label: 'Pack Weight / Box Size', type: 'dropdown', required: true, options: ['5 Kg Packet (~150 Rods)', '20 Kg Master Carton (4 x 5 Kg)', 'Box of 25 Cutting Discs', 'Box of 50 Discs'], group: 'Dimensions & Packaging' },
  ]),

  // cat-27: Bathroom Renovation Materials
  ...makeSchemas('cat-27', 'bathroom-renovation-materials', [
    { key: 'renovationItemType', label: 'Renovation Product Type', type: 'dropdown', required: true, options: ['Concealed Dual-Flush Water Cistern', 'Linear SS Floor Drain Channel', 'Cockroach Trap Square Grating', 'Frameless Glass Partition Profile'] },
    { key: 'sizeOrLength', label: 'Size / Channel Length', type: 'dropdown', required: true, options: ['5" x 5" Square Drain', '600mm Linear Channel', '900mm Tile-Insert Linear Drain', '6/3 Litre Concealed Cistern Frame'], group: 'Dimensions & Packaging' },
    { key: 'materialGrade', label: 'Material Grade', type: 'dropdown', required: true, options: ['1.5mm AISI SS 304', 'High-Density Blow-Molded HDPE', 'Anodized Aluminium Profile'] },
    { key: 'finish', label: 'Finish', type: 'dropdown', required: true, options: ['Brushed Matt SS', 'Tile-Insert Invisible Finish', 'Matte Black PVD', 'Alpine White Actuator Plate'] },
    { key: 'outletSpec', label: 'Outlet Pipe / Load Spec', type: 'text', required: false, placeholder: 'e.g. 50mm / 75mm Vertical Outlet', group: 'Performance & Compliance' },
  ]),

  // cat-28: Ceiling & Flooring
  ...makeSchemas('cat-28', 'ceiling-flooring', [
    { key: 'ceilingOrFlooringType', label: 'Ceiling / Flooring Type', type: 'dropdown', required: true, options: ['Moisture-Resistant Gypsum Board', 'Calcium Silicate / Mineral Acoustic Tile', 'AC4/AC5 Laminate Wooden Flooring', 'SPC Waterproof Stone Polymer Flooring'] },
    { key: 'thickness', label: 'Core Thickness', type: 'dropdown', required: true, options: ['4mm SPC', '5mm SPC + IXPE Pad', '8mm AC4 HDF', '12mm AC5 Commercial', '12.5mm Gypsum Board'], group: 'Dimensions & Packaging' },
    { key: 'panelDimensions', label: 'Board / Plank Size', type: 'text', required: true, placeholder: 'e.g. 1220 x 2440 mm Board or 1218 x 198 mm Plank', group: 'Dimensions & Packaging' },
    { key: 'finishPattern', label: 'Surface Finish & Pattern', type: 'dropdown', required: true, options: ['Natural Oak Wood Grain', 'Smoked Grey Walnut', 'Tapered Smooth Paper Face', 'Marble Matte Texture'] },
    { key: 'coverageArea', label: 'Coverage Area per Pack', type: 'text', required: true, placeholder: 'e.g. 24.16 sq.ft per Box / 32 sq.ft per Sheet', group: 'Dimensions & Packaging' },
    { key: 'moistureOrFireRated', label: 'Moisture / Acoustic / Fire Rated', type: 'checkbox', required: false, group: 'Performance & Compliance' },
  ]),
];

export function getDefaultFieldSchemasForCategory(childCategoryIdOrSlug: string): CategoryFieldSchema[] {
  const needle = (childCategoryIdOrSlug || '').trim().toLowerCase();
  return CATEGORY_FIELD_SCHEMAS_SEED.filter(
    (f) => f.childCategoryId.toLowerCase() === needle || f.childCategorySlug.toLowerCase() === needle
  ).sort((a, b) => a.displayOrder - b.displayOrder);
}
