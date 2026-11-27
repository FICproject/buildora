import { CategoryAttributeTemplate } from '@buildora/types';

export const CATEGORY_ATTRIBUTE_TEMPLATES: Record<string, CategoryAttributeTemplate[]> = {
  // 1. Cement & Concrete
  'cement-concrete': [
    {
      id: 'cat-tpl-cem-type',
      categorySlug: 'cement-concrete',
      categoryName: 'Cement & Concrete',
      name: 'Cement Type',
      suggestedUiType: 'pills',
      suggestedOptions: ['OPC 53 Grade', 'OPC 43 Grade', 'PPC (IS 1489)', 'White Portland Cement', 'Sulphate Resistant'],
      description: 'Standard chemical formulation of the cement matrix'
    },
    {
      id: 'cat-tpl-cem-pack',
      categorySlug: 'cement-concrete',
      categoryName: 'Cement & Concrete',
      name: 'Pack Size',
      suggestedUiType: 'cards',
      suggestedOptions: ['50 kg Bag', '25 kg Bag', '5 kg Bucket', '1 kg Pouch'],
      description: 'Physical packaging volume for site delivery'
    },
    {
      id: 'cat-tpl-cem-grade',
      categorySlug: 'cement-concrete',
      categoryName: 'Cement & Concrete',
      name: 'Grade',
      suggestedUiType: 'dropdown',
      suggestedOptions: ['Grade 53', 'Grade 43', 'Pozzolana Blended', 'Super High Strength'],
      description: 'Compressive strength rating in MPa'
    }
  ],

  // 2. Tiling & Tile Adhesives
  'tiling-tile-adhesives': [
    {
      id: 'cat-tpl-tile-size',
      categorySlug: 'tiling-tile-adhesives',
      categoryName: 'Tiling & Tile Adhesives',
      name: 'Tile Size',
      suggestedUiType: 'cards',
      suggestedOptions: ['600x600 mm (2x2 ft)', '600x1200 mm (2x4 ft)', '800x1600 mm (GVT)', '300x450 mm (Wall)'],
      description: 'Surface slab dimensions per piece'
    },
    {
      id: 'cat-tpl-tile-finish',
      categorySlug: 'tiling-tile-adhesives',
      categoryName: 'Tiling & Tile Adhesives',
      name: 'Finish',
      suggestedUiType: 'pills',
      suggestedOptions: ['Glossy / Polished', 'Matt / Satin', 'Sugar Finish', 'Rustic Carving', 'High Gloss Mirror'],
      description: 'Surface texture and light reflection quality'
    },
    {
      id: 'cat-tpl-tile-adh-grade',
      categorySlug: 'tiling-tile-adhesives',
      categoryName: 'Tiling & Tile Adhesives',
      name: 'Adhesive Grade',
      suggestedUiType: 'pills',
      suggestedOptions: ['Type 1 (Interior Floor)', 'Type 2 (Wall & Vitrified)', 'Type 3 (Granite & Outdoor)', 'Type 4 (Glass Mosaic)'],
      description: 'Polymer modified tile adhesive classification (IS 15477)'
    },
    {
      id: 'cat-tpl-tile-pack-weight',
      categorySlug: 'tiling-tile-adhesives',
      categoryName: 'Tiling & Tile Adhesives',
      name: 'Pack Weight',
      suggestedUiType: 'cards',
      suggestedOptions: ['20 kg Bag', '50 kg Bag', '5 kg Box'],
      description: 'Bag weight'
    }
  ],

  // 3. Plywood, MDF & HDHMR
  'plywood-mdf-hdhmr': [
    {
      id: 'cat-tpl-ply-thickness',
      categorySlug: 'plywood-mdf-hdhmr',
      categoryName: 'Plywood, MDF & HDHMR',
      name: 'Thickness',
      suggestedUiType: 'pills',
      suggestedOptions: ['6mm', '8mm', '12mm', '16mm (Maxima)', '18mm', '19mm Blockboard', '25mm Blockboard'],
      description: 'Core caliper thickness of calibrated sheet'
    },
    {
      id: 'cat-tpl-ply-size',
      categorySlug: 'plywood-mdf-hdhmr',
      categoryName: 'Plywood, MDF & HDHMR',
      name: 'Size',
      suggestedUiType: 'cards',
      suggestedOptions: ["8' X 4'", "7' X 4'", "8' X 3'", "7' X 3'"],
      description: 'Standard sheet format in feet'
    },
    {
      id: 'cat-tpl-ply-grade',
      categorySlug: 'plywood-mdf-hdhmr',
      categoryName: 'Plywood, MDF & HDHMR',
      name: 'Grade',
      suggestedUiType: 'dropdown',
      suggestedOptions: ['BWP IS:710 Marine', 'BWR IS:303 Moisture Resistant', 'MR Commercial', 'Fire Retardant IS:5509'],
      description: 'Resin bond boiling water resistance level'
    }
  ],

  // 4. Adhesives
  'adhesives': [
    {
      id: 'cat-tpl-adh-type',
      categorySlug: 'adhesives',
      categoryName: 'Adhesives',
      name: 'Type',
      suggestedUiType: 'pills',
      suggestedOptions: ['PVA Synthetic Resin', 'Fast Setting Marine', 'Contact Neoprene Rubber', 'Epoxy Polyfix'],
      description: 'Adhesive chemical composition'
    },
    {
      id: 'cat-tpl-adh-weight',
      categorySlug: 'adhesives',
      categoryName: 'Adhesives',
      name: 'Pack Size',
      suggestedUiType: 'cards',
      suggestedOptions: ['1 kg', '2 kg', '5 kg', '10 kg Bucket', '20 kg Drum', '50 kg Barrel', '500g Pouch'],
      description: 'Container volume weight'
    }
  ],

  // 5. Waterproofing
  'waterproofing': [
    {
      id: 'cat-tpl-wp-product-type',
      categorySlug: 'waterproofing',
      categoryName: 'Waterproofing',
      name: 'Product Type',
      suggestedUiType: 'pills',
      suggestedOptions: ['Integral Liquid Compound', 'Acrylic Polymer Coating', '2K Cementitious Slurry', 'EPDM/Bitumen Membrane'],
      description: 'Waterproofing technology and application medium'
    },
    {
      id: 'cat-tpl-wp-volume',
      categorySlug: 'waterproofing',
      categoryName: 'Waterproofing',
      name: 'Pack Volume',
      suggestedUiType: 'cards',
      suggestedOptions: ['1 Litre', '5 Litres', '10 Litres', '20 Litres', '200 Litres Barrel'],
      description: 'Liquid volume'
    }
  ],

  // 6. Painting & Finishes
  'painting-finishes': [
    {
      id: 'cat-tpl-paint-colour',
      categorySlug: 'painting-finishes',
      categoryName: 'Painting & Finishes',
      name: 'Colour',
      suggestedUiType: 'color_swatches',
      suggestedOptions: ['Brilliant White', 'Morning Mist Grey', 'Warm Almond', 'Soft Ivory', 'Earthy Beige', 'Slate Blue'],
      description: 'Factory tinted or base shade code'
    },
    {
      id: 'cat-tpl-paint-finish',
      categorySlug: 'painting-finishes',
      categoryName: 'Painting & Finishes',
      name: 'Finish',
      suggestedUiType: 'pills',
      suggestedOptions: ['Ultra Matt', 'Smooth Satin', 'Soft Sheen', 'High Gloss Mirror'],
      description: 'Surface lustre texture'
    },
    {
      id: 'cat-tpl-paint-volume',
      categorySlug: 'painting-finishes',
      categoryName: 'Painting & Finishes',
      name: 'Pack Size',
      suggestedUiType: 'cards',
      suggestedOptions: ['1 Litre', '4 Litres', '10 Litres', '20 Litres Bucket'],
      description: 'Pack quantity'
    }
  ],

  // 7. Hinges, Channels & Handles
  'hinges-channels-handles': [
    {
      id: 'cat-tpl-hrd-size',
      categorySlug: 'hinges-channels-handles',
      categoryName: 'Hinges, Channels & Handles',
      name: 'Size',
      suggestedUiType: 'cards',
      suggestedOptions: ['10 Inch (250mm)', '12 Inch (300mm)', '14 Inch (350mm)', '16 Inch (400mm)', '18 Inch (450mm)', '20 Inch (500mm)', '22 Inch (550mm)'],
      description: 'Slide runner or hinge leaf length'
    },
    {
      id: 'cat-tpl-hrd-finish',
      categorySlug: 'hinges-channels-handles',
      categoryName: 'Hinges, Channels & Handles',
      name: 'Finish',
      suggestedUiType: 'pills',
      suggestedOptions: ['Zinc Plated Silver', 'Matt Black', 'Rose Gold', 'Antique Brass', 'SS Satin'],
      description: 'Surface electroplating'
    },
    {
      id: 'cat-tpl-hrd-model',
      categorySlug: 'hinges-channels-handles',
      categoryName: 'Hinges, Channels & Handles',
      name: 'Model',
      suggestedUiType: 'dropdown',
      suggestedOptions: ['Soft Close Hydraulic', 'Push to Open (Tip-On)', 'Regular Telescopic Ball Bearing', 'Concealed Auto-Hinge 0 Crank', 'Auto-Hinge 8 Crank', 'Auto-Hinge 16 Crank'],
      description: 'Hardware mechanism type'
    }
  ],

  // 8. Kitchen Systems & Accessories
  'kitchen-systems-accessories': [
    {
      id: 'cat-tpl-kitch-size',
      categorySlug: 'kitchen-systems-accessories',
      categoryName: 'Kitchen Systems & Accessories',
      name: 'Size',
      suggestedUiType: 'cards',
      suggestedOptions: ['450mm Cabinet (18 Inch)', '600mm Cabinet (24 Inch)', '900mm Corner Unit'],
      description: 'Standard carcase width'
    },
    {
      id: 'cat-tpl-kitch-material',
      categorySlug: 'kitchen-systems-accessories',
      categoryName: 'Kitchen Systems & Accessories',
      name: 'Material',
      suggestedUiType: 'pills',
      suggestedOptions: ['SS 304 Grade', 'Mild Steel Chrome Plated', 'Anodized Aluminum Anthracite'],
      description: 'Basket wire metal metallurgy'
    }
  ],

  // 9. Wardrobe & Bed Fittings
  'wardrobe-bed-fittings': [
    {
      id: 'cat-tpl-bed-size',
      categorySlug: 'wardrobe-bed-fittings',
      categoryName: 'Wardrobe & Bed Fittings',
      name: 'Size',
      suggestedUiType: 'cards',
      suggestedOptions: ['M6, PLBF-M6K', 'M8, PLBF-M8K', '3 Feet (900mm)', '5 Feet (1500mm) Heavy Lift'],
      description: 'Fitting fastener kit or bracket size'
    },
    {
      id: 'cat-tpl-bed-capacity',
      categorySlug: 'wardrobe-bed-fittings',
      categoryName: 'Wardrobe & Bed Fittings',
      name: 'Load Capacity',
      suggestedUiType: 'pills',
      suggestedOptions: ['75 kg (Single Bed)', '125 kg (Queen Size)', '150 kg (King Size Heavy)', '200 kg (Commercial Storage)'],
      description: 'Gas spring or runner force rating'
    }
  ],

  // 10. Door Locks & Hardware
  'door-locks-hardware': [
    {
      id: 'cat-tpl-lock-type',
      categorySlug: 'door-locks-hardware',
      categoryName: 'Door Locks & Hardware',
      name: 'Lock Type',
      suggestedUiType: 'dropdown',
      suggestedOptions: ['Mortise Sash Lock Set', 'Digital Smart Door Lock (Fingerprint/PIN)', 'Night Latch Rim Lock', 'Cylindrical Knob Lock', 'Padlock Heavy Brass'],
      description: 'Lock body mounting category'
    },
    {
      id: 'cat-tpl-lock-finish',
      categorySlug: 'door-locks-hardware',
      categoryName: 'Door Locks & Hardware',
      name: 'Finish',
      suggestedUiType: 'pills',
      suggestedOptions: ['Satin Nickel', 'Antique Brass', 'Matt Black', 'Rose Gold', 'Polished Chrome'],
      description: 'External escutcheon and handle finish'
    }
  ],

  // 11. Wires, MCB & Distribution Boards
  'wires-mcb-distribution': [
    {
      id: 'cat-tpl-wire-size',
      categorySlug: 'wires-mcb-distribution',
      categoryName: 'Wires, MCB & Distribution Boards',
      name: 'Wire Size',
      suggestedUiType: 'cards',
      suggestedOptions: ['1.0 sq mm (Lighting)', '1.5 sq mm (Power Points)', '2.5 sq mm (Power Sockets/Geysers)', '4.0 sq mm (AC / Heavy Loads)', '6.0 sq mm (Mains Supply)', '10.0 sq mm (Main Incomer)'],
      description: 'Conductor cross-sectional gauge area'
    },
    {
      id: 'cat-tpl-wire-color',
      categorySlug: 'wires-mcb-distribution',
      categoryName: 'Wires, MCB & Distribution Boards',
      name: 'Insulation Colour',
      suggestedUiType: 'pills',
      suggestedOptions: ['Red (Phase 1)', 'Yellow (Phase 2)', 'Blue (Phase 3)', 'Black (Neutral)', 'Green (Earth)'],
      description: 'IS 694 standard colour coding'
    },
    {
      id: 'cat-tpl-wire-length',
      categorySlug: 'wires-mcb-distribution',
      categoryName: 'Wires, MCB & Distribution Boards',
      name: 'Length',
      suggestedUiType: 'cards',
      suggestedOptions: ['90 Metres Coil', '180 Metres Project Drum', '45 Metres Half Coil'],
      description: 'Packaging length'
    },
    {
      id: 'cat-tpl-mcb-poles',
      categorySlug: 'wires-mcb-distribution',
      categoryName: 'Wires, MCB & Distribution Boards',
      name: 'Current Rating',
      suggestedUiType: 'dropdown',
      suggestedOptions: ['6A C-Curve', '10A C-Curve', '16A C-Curve', '20A C-Curve', '25A C-Curve', '32A C-Curve', '40A C-Curve', '63A C-Curve'],
      description: 'Overload breaker trip capacity'
    }
  ],

  // 12. Switches & Sockets
  'switches-sockets': [
    {
      id: 'cat-tpl-switch-module',
      categorySlug: 'switches-sockets',
      categoryName: 'Switches & Sockets',
      name: 'Module Size',
      suggestedUiType: 'dropdown',
      suggestedOptions: ['1 Module (Switch)', '2 Module (Socket / AC)', '3 Module (Plate)', '4 Module', '6 Module', '8 Module Horizontal', '12 Module Grid'],
      description: 'Modular frame slot dimension'
    },
    {
      id: 'cat-tpl-switch-color',
      categorySlug: 'switches-sockets',
      categoryName: 'Switches & Sockets',
      name: 'Colour',
      suggestedUiType: 'pills',
      suggestedOptions: ['Pure White', 'Dark Anthracite / Slate Grey', 'Pearl Silver Metallic', 'Champagne Gold'],
      description: 'Faceplate aesthetic colour'
    }
  ],

  // 13. Electrical Conduits
  'electrical-conduits': [
    {
      id: 'cat-tpl-conduit-color',
      categorySlug: 'electrical-conduits',
      categoryName: 'Electrical Conduits',
      name: 'Colour',
      suggestedUiType: 'pills',
      suggestedOptions: ['Grey', 'White', 'Black'],
      description: 'Conduit sheath colour'
    },
    {
      id: 'cat-tpl-conduit-size',
      categorySlug: 'electrical-conduits',
      categoryName: 'Electrical Conduits',
      name: 'Size',
      suggestedUiType: 'cards',
      suggestedOptions: ['20mm - 50 meters', '25mm - 25 meters', '32mm - 25 meters', '20mm Rigid Pipe (3m)', '25mm Rigid Pipe (3m)'],
      description: 'Internal diameter and roll packaging length'
    }
  ],

  // 14. Lighting
  'lighting': [
    {
      id: 'cat-tpl-light-wattage',
      categorySlug: 'lighting',
      categoryName: 'Lighting',
      name: 'Wattage',
      suggestedUiType: 'cards',
      suggestedOptions: ['7W LED', '12W LED', '15W LED', '18W LED', '22W LED Batten', '36W 2x2 Panel'],
      description: 'Power consumption in Watts'
    },
    {
      id: 'cat-tpl-light-colortemp',
      categorySlug: 'lighting',
      categoryName: 'Lighting',
      name: 'Colour Temperature',
      suggestedUiType: 'pills',
      suggestedOptions: ['6500K Cool White / Daylight', '4000K Natural White', '3000K Warm White / Yellow', 'RGB Tunable'],
      description: 'Kelvin light warmth temperature'
    }
  ],

  // 15. Ceiling Fans & Exhaust
  'ceiling-fans-exhaust': [
    {
      id: 'cat-tpl-fan-sweep',
      categorySlug: 'ceiling-fans-exhaust',
      categoryName: 'Ceiling Fans & Exhaust',
      name: 'Sweep Size',
      suggestedUiType: 'cards',
      suggestedOptions: ['1200 mm (48 Inch Standard)', '1400 mm (56 Inch Hall)', '900 mm (36 Inch Small Room)', '150 mm (6 Inch Exhaust)', '200 mm (8 Inch Exhaust)'],
      description: 'Blade diameter sweep'
    },
    {
      id: 'cat-tpl-fan-color',
      categorySlug: 'ceiling-fans-exhaust',
      categoryName: 'Ceiling Fans & Exhaust',
      name: 'Colour',
      suggestedUiType: 'pills',
      suggestedOptions: ['Luster White', 'Rich Brown / Wood Finish', 'Smoke Grey Metallic', 'Matte Black BLDC'],
      description: 'Motor housing finish'
    }
  ],

  // 16. CPVC Pipes & Overhead Tanks
  'cpvc-pipes-fittings': [
    {
      id: 'cat-tpl-pipe-diameter',
      categorySlug: 'cpvc-pipes-fittings',
      categoryName: 'CPVC Pipes & Overhead Tanks',
      name: 'Diameter',
      suggestedUiType: 'cards',
      suggestedOptions: ['1/2 Inch (15mm)', '3/4 Inch (20mm)', '1 Inch (25mm)', '1-1/4 Inch (32mm)', '1-1/2 Inch (40mm)', '2 Inch (50mm)'],
      description: 'Nominal pipe bore diameter'
    },
    {
      id: 'cat-tpl-pipe-class',
      categorySlug: 'cpvc-pipes-fittings',
      categoryName: 'CPVC Pipes & Overhead Tanks',
      name: 'Pressure Rating',
      suggestedUiType: 'pills',
      suggestedOptions: ['SDR 11 (Class 1 - Hot & Cold)', 'SDR 13.5 (Class 2)', 'SCH 40 Heavy Duty', 'SCH 80 Industrial'],
      description: 'Pressure class standard'
    }
  ],

  // 17. Sanitary & Bath Fittings
  'sanitary-bath-fittings': [
    {
      id: 'cat-tpl-bath-color',
      categorySlug: 'sanitary-bath-fittings',
      categoryName: 'Sanitary & Bath Fittings',
      name: 'Colour / Finish',
      suggestedUiType: 'pills',
      suggestedOptions: ['Polished Chrome', 'Matt Black', 'Rose Gold Brass', 'Alpine White Ceramic', 'Gunmetal Grey'],
      description: 'Fixture exterior finish'
    },
    {
      id: 'cat-tpl-bath-size',
      categorySlug: 'sanitary-bath-fittings',
      categoryName: 'Sanitary & Bath Fittings',
      name: 'Size / Model',
      suggestedUiType: 'dropdown',
      suggestedOptions: ['One Piece Rimless EWC (S-Trap 300mm)', 'Wall Hung EWC with Slim Seat', 'Countertop Table Vessel Basin (450x350)', 'Single Lever Basin Mixer Tall'],
      description: 'Sanitaryware mounting model'
    }
  ],

  // 18. Kitchen Sinks & Faucets
  'kitchen-sinks-faucets': [
    {
      id: 'cat-tpl-sink-size',
      categorySlug: 'kitchen-sinks-faucets',
      categoryName: 'Kitchen Sinks & Faucets',
      name: 'Size',
      suggestedUiType: 'cards',
      suggestedOptions: ['24" x 18" (Single Bowl)', '32" x 20" (Bowl with Drainboard)', '37" x 18" (Double Bowl Heavy)', '45" x 20" (Double Bowl Drainboard)'],
      description: 'Outer sink basin frame dimensions'
    },
    {
      id: 'cat-tpl-sink-finish',
      categorySlug: 'kitchen-sinks-faucets',
      categoryName: 'Kitchen Sinks & Faucets',
      name: 'Finish',
      suggestedUiType: 'pills',
      suggestedOptions: ['Satin Matt SS 304', 'Diamond Cut Glossy', 'Nano Black PVD', 'Quartz Granite Composite'],
      description: 'Sink surface finish'
    }
  ],

  // 19. Overhead Tanks (renamed from Water Storage Tanks)
  'overhead-tanks': [
    {
      id: 'cat-tpl-tank-capacity',
      categorySlug: 'overhead-tanks',
      categoryName: 'Overhead Tanks',
      name: 'Capacity',
      suggestedUiType: 'cards',
      suggestedOptions: ['500 Litres', '1000 Litres (Recommended)', '1500 Litres', '2000 Litres', '3000 Litres Industrial'],
      description: 'Storage capacity in litres'
    },
    {
      id: 'cat-tpl-tank-layers',
      categorySlug: 'overhead-tanks',
      categoryName: 'Overhead Tanks',
      name: 'Layers',
      suggestedUiType: 'pills',
      suggestedOptions: ['3 Layers (UV Stabilized)', '4 Layers (Foam Insulated Anti-Bacterial)', '5 Layers (Triple Foam Heavy All-Weather)'],
      description: 'Rotomoulding polymer wall barrier layers'
    }
  ],

  // 20. Power Tools & Accessories
  'power-tools-accessories': [
    {
      id: 'cat-tpl-tool-model',
      categorySlug: 'power-tools-accessories',
      categoryName: 'Power Tools & Accessories',
      name: 'Model',
      suggestedUiType: 'dropdown',
      suggestedOptions: ['Corded 220V Electric', 'Brushless 18V Cordless (Bare Tool)', 'Brushless 18V Combo (2x 4.0Ah Batteries + Charger)', 'Heavy Industrial SDS-Plus'],
      description: 'Power motor configuration'
    },
    {
      id: 'cat-tpl-tool-power',
      categorySlug: 'power-tools-accessories',
      categoryName: 'Power Tools & Accessories',
      name: 'Power Rating',
      suggestedUiType: 'cards',
      suggestedOptions: ['650W Drill', '850W Angle Grinder (4 Inch)', '1400W Circular Saw (7 Inch)', '1800W Demolition Breaker (11kg)'],
      description: 'Wattage output'
    }
  ],

  // 21. General Hardware & Tools
  'general-hardware-tools': [
    {
      id: 'cat-tpl-gen-size',
      categorySlug: 'general-hardware-tools',
      categoryName: 'General Hardware & Tools',
      name: 'Size',
      suggestedUiType: 'cards',
      suggestedOptions: ['6 Inch (150mm)', '8 Inch (200mm)', '10 Inch (250mm)', '12 Inch (300mm)', '5 Metre Tape', '8 Metre Tape'],
      description: 'Tool size measurement'
    },
    {
      id: 'cat-tpl-gen-pack',
      categorySlug: 'general-hardware-tools',
      categoryName: 'General Hardware & Tools',
      name: 'Pack Quantity',
      suggestedUiType: 'pills',
      suggestedOptions: ['Single Piece', 'Pack of 5', 'Box of 100 Screws', 'Master Pack 500 Pcs'],
      description: 'Unit quantity in box'
    }
  ],

  // 22. CCTV & Networking
  'cctv-networking': [
    {
      id: 'cat-tpl-cctv-resolution',
      categorySlug: 'cctv-networking',
      categoryName: 'CCTV & Networking',
      name: 'Resolution',
      suggestedUiType: 'cards',
      suggestedOptions: ['2MP 1080p Full HD', '4MP QHD ColorVu Night Vision', '8MP 4K Ultra HD IP Camera'],
      description: 'Image sensor optical clarity'
    },
    {
      id: 'cat-tpl-cctv-channel',
      categorySlug: 'cctv-networking',
      categoryName: 'CCTV & Networking',
      name: 'Channel Count',
      suggestedUiType: 'dropdown',
      suggestedOptions: ['4 Channel NVR/DVR Kit', '8 Channel System', '16 Channel Commercial Unit'],
      description: 'Recorder inputs'
    }
  ],

  // 23. Home Appliances & Power Backup
  'appliances-power-backup': [
    {
      id: 'cat-tpl-ups-capacity',
      categorySlug: 'appliances-power-backup',
      categoryName: 'Home Appliances & Power Backup',
      name: 'Capacity',
      suggestedUiType: 'cards',
      suggestedOptions: ['900VA / 12V Inverter', '1100VA Pure Sine Wave', '1500VA / 24V Double Battery', '2200VA Commercial Inverter'],
      description: 'VA power backup capacity'
    },
    {
      id: 'cat-tpl-ups-battery',
      categorySlug: 'appliances-power-backup',
      categoryName: 'Home Appliances & Power Backup',
      name: 'Battery Option',
      suggestedUiType: 'pills',
      suggestedOptions: ['Inverter Unit Only', 'Combo with 150Ah Tubular Battery', 'Combo with 200Ah Tall Tubular Heavy'],
      description: 'Backup battery pairing'
    }
  ],

  // 24. Safety & Workwear
  'safety-workwear': [
    {
      id: 'cat-tpl-safety-size',
      categorySlug: 'safety-workwear',
      categoryName: 'Safety & Workwear',
      name: 'Size',
      suggestedUiType: 'cards',
      suggestedOptions: ['Size 7 (41)', 'Size 8 (42)', 'Size 9 (43)', 'Size 10 (44)', 'Medium (M)', 'Large (L)', 'XL'],
      description: 'Footwear or high-vis vest garment size'
    },
    {
      id: 'cat-tpl-safety-rating',
      categorySlug: 'safety-workwear',
      categoryName: 'Safety & Workwear',
      name: 'Protection Rating',
      suggestedUiType: 'pills',
      suggestedOptions: ['Steel Toe IS 15298 S1P', 'Kevlar Anti-Penetration S3', 'Electrical Resistant 15kV', 'Level 5 Cut Proof'],
      description: 'Site safety certification standard'
    }
  ],

  // 25. Glass Door Hardware
  'glass-door-hardware': [
    {
      id: 'cat-tpl-glass-thickness',
      categorySlug: 'glass-door-hardware',
      categoryName: 'Glass Door Hardware',
      name: 'Glass Thickness Compatibility',
      suggestedUiType: 'pills',
      suggestedOptions: ['10mm Toughened Glass', '12mm Architectural Glass', '8mm Shower Partition Glass'],
      description: 'Clamping gasket compatibility'
    },
    {
      id: 'cat-tpl-glass-finish',
      categorySlug: 'glass-door-hardware',
      categoryName: 'Glass Door Hardware',
      name: 'Finish',
      suggestedUiType: 'pills',
      suggestedOptions: ['SS 304 Satin Brush', 'Mirror Chrome Polish', 'Matte Black PVD', 'Rose Gold Titanium'],
      description: 'Stainless steel cover finish'
    }
  ],

  // 26. Welding Consumables
  'welding-consumables': [
    {
      id: 'cat-tpl-weld-diameter',
      categorySlug: 'welding-consumables',
      categoryName: 'Welding Consumables',
      name: 'Electrode Diameter',
      suggestedUiType: 'cards',
      suggestedOptions: ['2.5 mm (12 Gauge)', '3.15 mm (10 Gauge)', '4.0 mm (8 Gauge Heavy)'],
      description: 'Welding rod core thickness'
    },
    {
      id: 'cat-tpl-weld-pack',
      categorySlug: 'welding-consumables',
      categoryName: 'Welding Consumables',
      name: 'Pack Size',
      suggestedUiType: 'pills',
      suggestedOptions: ['5 kg Box (Approx 150 Rods)', '20 kg Master Carton (4x5kg)', '15 kg MIG Wire Spool'],
      description: 'Packaging weight'
    }
  ],

  // 27. Bathroom Renovation Materials
  'bathroom-renovation': [
    {
      id: 'cat-tpl-bath-drain-size',
      categorySlug: 'bathroom-renovation',
      categoryName: 'Bathroom Renovation Materials',
      name: 'Size',
      suggestedUiType: 'cards',
      suggestedOptions: ['5x5 Inch Square Drain', '600mm Linear Channel Drain', '900mm Tile Insert Linear Drain', '1200mm Heavy Trench'],
      description: 'Drainage channel length'
    },
    {
      id: 'cat-tpl-bath-drain-material',
      categorySlug: 'bathroom-renovation',
      categoryName: 'Bathroom Renovation Materials',
      name: 'Material & Finish',
      suggestedUiType: 'pills',
      suggestedOptions: ['SS 304 Matt Brushed', 'SS 304 Mirror Gloss', 'Matte Black Anti-Corrosion', 'PVD Gold'],
      description: 'Steel grade and electro-finish'
    }
  ],

  // 28. Ceiling & Flooring
  'ceiling-flooring': [
    {
      id: 'cat-tpl-floor-thickness',
      categorySlug: 'ceiling-flooring',
      categoryName: 'Ceiling & Flooring',
      name: 'Thickness',
      suggestedUiType: 'cards',
      suggestedOptions: ['8mm AC4 (Residential)', '12mm AC5 (Heavy Commercial)', '4mm SPC Stone Polymer', '12.5mm Gypsum Board'],
      description: 'Plank core caliper thickness'
    },
    {
      id: 'cat-tpl-floor-finish',
      categorySlug: 'ceiling-flooring',
      categoryName: 'Ceiling & Flooring',
      name: 'Surface Finish',
      suggestedUiType: 'pills',
      suggestedOptions: ['Natural Oak Wood Grain', 'Rustic Walnut Embossed', 'Smoked Grey Ash', 'Marble White Smooth'],
      description: 'Embossed wear layer aesthetics'
    }
  ]
};

/**
 * Returns attribute templates for a given category slug or name.
 */
export function getAttributeTemplatesForCategory(categorySlugOrName: string): CategoryAttributeTemplate[] {
  if (!categorySlugOrName) return [];
  const slug = categorySlugOrName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (CATEGORY_ATTRIBUTE_TEMPLATES[slug]) {
    return CATEGORY_ATTRIBUTE_TEMPLATES[slug];
  }
  // Search by categoryName
  const match = Object.values(CATEGORY_ATTRIBUTE_TEMPLATES).find((tpls) =>
    tpls[0]?.categoryName.toLowerCase() === categorySlugOrName.toLowerCase()
  );
  return match || [];
}
