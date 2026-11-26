// Master constants for BUILDORA 60
import { NewLaunchCategory } from '@buildora/types';

export const APP_NAME = 'BUILDORA 60';
export const APP_TAGLINE = 'BUILD SMART. DELIVER FAST.';
export const SUPPORT_EMAIL = 'support@buildora.com';
export const SUPPORT_PHONE = '1800-60-BUILD (1800-60-28453)';

// The 28 Master Categories required for Buildora 60
export const MASTER_CATEGORIES = [
  {
    id: 'cat-1',
    name: 'Cement & Concrete',
    slug: 'cement-concrete',
    icon: 'Package',
    image: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=600&q=80',
    description: 'High-grade OPC 53, PPC, white cement, ready-mix concrete, and aggregates.',
    featured: true,
    subcategories: [
      { id: 'sub-1-1', name: 'OPC 53 Grade Cement', slug: 'opc-53-grade', categorySlug: 'cement-concrete' },
      { id: 'sub-1-2', name: 'PPC Portland Pozzolana', slug: 'ppc-cement', categorySlug: 'cement-concrete' },
      { id: 'sub-1-3', name: 'White Cement & Putty', slug: 'white-cement-putty', categorySlug: 'cement-concrete' },
      { id: 'sub-1-4', name: 'Ready-Mix Concrete Mortar', slug: 'ready-mix-mortar', categorySlug: 'cement-concrete' }
    ]
  },
  {
    id: 'cat-2',
    name: 'Tiling & Tile Adhesives',
    slug: 'tiling-tile-adhesives',
    icon: 'Grid',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
    description: 'Vitrified tiles, ceramic wall tiles, heavy-duty tile adhesives, and epoxy grouts.',
    featured: true,
    subcategories: [
      { id: 'sub-2-1', name: 'Vitrified Floor Tiles', slug: 'vitrified-floor-tiles', categorySlug: 'tiling-tile-adhesives' },
      { id: 'sub-2-2', name: 'Ceramic Wall Tiles', slug: 'ceramic-wall-tiles', categorySlug: 'tiling-tile-adhesives' },
      { id: 'sub-2-3', name: 'Polymer Tile Adhesives', slug: 'tile-adhesives', categorySlug: 'tiling-tile-adhesives' },
      { id: 'sub-2-4', name: 'Epoxy Tile Grouts & Spacers', slug: 'epoxy-grouts', categorySlug: 'tiling-tile-adhesives' }
    ]
  },
  {
    id: 'cat-3',
    name: 'Plywood, MDF & HDHMR',
    slug: 'plywood-mdf-hdhmr',
    icon: 'Layers',
    image: 'https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?auto=format&fit=crop&w=600&q=80',
    description: 'Calibrated BWP waterproof marine plywood, BWR, HDHMR moisture-resistant boards, and MDF.',
    featured: true,
    subcategories: [
      { id: 'sub-3-1', name: 'BWP Marine Grade Plywood', slug: 'bwp-marine-plywood', categorySlug: 'plywood-mdf-hdhmr' },
      { id: 'sub-3-2', name: 'BWR Commercial Plywood', slug: 'bwr-commercial-plywood', categorySlug: 'plywood-mdf-hdhmr' },
      { id: 'sub-3-3', name: 'HDHMR Moisture Proof Boards', slug: 'hdhmr-boards', categorySlug: 'plywood-mdf-hdhmr' },
      { id: 'sub-3-4', name: 'Interior MDF Sheets', slug: 'interior-mdf-sheets', categorySlug: 'plywood-mdf-hdhmr' }
    ]
  },
  {
    id: 'cat-4',
    name: 'Adhesives',
    slug: 'adhesives',
    icon: 'Flame',
    image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=600&q=80',
    description: 'Woodworking adhesives, instant cyanoacrylate glues, PU sealants, and contact adhesives.',
    featured: true,
    subcategories: [
      { id: 'sub-4-1', name: 'Synthetic Resin Wood Adhesives', slug: 'wood-adhesives', categorySlug: 'adhesives' },
      { id: 'sub-4-2', name: 'Fast Setting Marine Adhesives', slug: 'fast-setting-marine', categorySlug: 'adhesives' },
      { id: 'sub-4-3', name: 'Contact Rubber Adhesives', slug: 'contact-rubber-adhesives', categorySlug: 'adhesives' }
    ]
  },
  {
    id: 'cat-5',
    name: 'Waterproofing',
    slug: 'waterproofing',
    icon: 'Droplets',
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80',
    description: 'Integral liquid waterproofing compounds, acrylic polymer coatings, and terrace membrane systems.',
    featured: true,
    subcategories: [
      { id: 'sub-5-1', name: 'Integral Cement Waterproofing', slug: 'integral-cement-waterproofing', categorySlug: 'waterproofing' },
      { id: 'sub-5-2', name: 'Terrace & Roof Coatings', slug: 'terrace-roof-coatings', categorySlug: 'waterproofing' },
      { id: 'sub-5-3', name: 'Bathroom & Sump Polymers', slug: 'bathroom-sump-polymers', categorySlug: 'waterproofing' }
    ]
  },
  {
    id: 'cat-6',
    name: 'Painting & Finishes',
    slug: 'painting-finishes',
    icon: 'Paintbrush',
    image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=600&q=80',
    description: 'Interior emulsions, exterior weather-guard coatings, enamel paints, primers, and rollers.',
    featured: true,
    subcategories: [
      { id: 'sub-6-1', name: 'Interior Emulsion Paints', slug: 'interior-emulsions', categorySlug: 'painting-finishes' },
      { id: 'sub-6-2', name: 'Exterior Weatherproof Paints', slug: 'exterior-weatherproof', categorySlug: 'painting-finishes' },
      { id: 'sub-6-3', name: 'Wall Primers & Putty', slug: 'primers-putty', categorySlug: 'painting-finishes' },
      { id: 'sub-6-4', name: 'Brushes, Rollers & Trays', slug: 'painting-tools', categorySlug: 'painting-finishes' }
    ]
  },
  {
    id: 'cat-7',
    name: 'Hinges, Channels & Handles',
    slug: 'hinges-channels-handles',
    icon: 'Cpu',
    image: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=600&q=80',
    description: 'Soft-close hydraulic auto hinges, telescopic drawer slides, and architectural cabinet handles.',
    subcategories: [
      { id: 'sub-7-1', name: 'Soft-Close Auto Hinges (SS 304)', slug: 'auto-hinges', categorySlug: 'hinges-channels-handles' },
      { id: 'sub-7-2', name: 'Telescopic Drawer Channels', slug: 'telescopic-channels', categorySlug: 'hinges-channels-handles' },
      { id: 'sub-7-3', name: 'Cabinet Knobs & Pull Handles', slug: 'cabinet-handles', categorySlug: 'hinges-channels-handles' }
    ]
  },
  {
    id: 'cat-8',
    name: 'Kitchen Systems & Accessories',
    slug: 'kitchen-systems-accessories',
    icon: 'Box',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80',
    description: 'Modular SS 304 wire baskets, tandem boxes, corner carousels, and pantry pull-outs.',
    subcategories: [
      { id: 'sub-8-1', name: 'SS 304 Modular Wire Baskets', slug: 'wire-baskets', categorySlug: 'kitchen-systems-accessories' },
      { id: 'sub-8-2', name: 'Soft-Close Tandem Drawer Boxes', slug: 'tandem-boxes', categorySlug: 'kitchen-systems-accessories' },
      { id: 'sub-8-3', name: 'Corner Carousel Units', slug: 'corner-carousels', categorySlug: 'kitchen-systems-accessories' }
    ]
  },
  {
    id: 'cat-9',
    name: 'Wardrobe & Bed Fittings',
    slug: 'wardrobe-bed-fittings',
    icon: 'Shield',
    image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=600&q=80',
    description: 'Sliding wardrobe systems, hydraulic bed lifters, cloth hanging rods, and tie racks.',
    subcategories: [
      { id: 'sub-9-1', name: 'Heavy Duty Bed Lift-Up Mechanisms', slug: 'bed-lift-ups', categorySlug: 'wardrobe-bed-fittings' },
      { id: 'sub-9-2', name: 'Sliding Wardrobe Track Systems', slug: 'sliding-tracks', categorySlug: 'wardrobe-bed-fittings' },
      { id: 'sub-9-3', name: 'Wardrobe Organizers & Rods', slug: 'wardrobe-rods', categorySlug: 'wardrobe-bed-fittings' }
    ]
  },
  {
    id: 'cat-10',
    name: 'Door Locks & Hardware',
    slug: 'door-locks-hardware',
    icon: 'Key',
    image: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=600&q=80',
    description: 'Mortise lock handles, computerized cylinder door locks, tower bolts, and hydraulic door closers.',
    subcategories: [
      { id: 'sub-10-1', name: 'Main Door Mortise Handle Sets', slug: 'mortise-locks', categorySlug: 'door-locks-hardware' },
      { id: 'sub-10-2', name: 'Computerized Cylindrical Locks', slug: 'cylindrical-locks', categorySlug: 'door-locks-hardware' },
      { id: 'sub-10-3', name: 'Hydraulic Overhead Door Closers', slug: 'door-closers', categorySlug: 'door-locks-hardware' }
    ]
  },
  {
    id: 'cat-11',
    name: 'Wires, MCB & Distribution Boards',
    slug: 'wires-mcb-distribution-boards',
    icon: 'Zap',
    image: 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&w=600&q=80',
    description: 'FR/FRLS copper flexible wires, miniature circuit breakers (MCBs), RCCBs, and metallic DB boxes.',
    featured: true,
    subcategories: [
      { id: 'sub-11-1', name: 'FRLS Insulated Copper Wires (90m)', slug: 'frls-copper-wires', categorySlug: 'wires-mcb-distribution-boards' },
      { id: 'sub-11-2', name: 'Single & Double Pole MCBs', slug: 'mcbs', categorySlug: 'wires-mcb-distribution-boards' },
      { id: 'sub-11-3', name: 'Distribution Boards & Enclosures', slug: 'distribution-boards', categorySlug: 'wires-mcb-distribution-boards' }
    ]
  },
  {
    id: 'cat-12',
    name: 'Switches & Sockets',
    slug: 'switches-sockets',
    icon: 'ToggleRight',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    description: 'Modular switches, power sockets, designer glass cover plates, and USB charger modules.',
    subcategories: [
      { id: 'sub-12-1', name: 'Modular Switches (6A/16A)', slug: 'modular-switches', categorySlug: 'switches-sockets' },
      { id: 'sub-12-2', name: 'Power Sockets & Shuttered Plugs', slug: 'power-sockets', categorySlug: 'switches-sockets' },
      { id: 'sub-12-3', name: 'Designer Modular Cover Plates', slug: 'cover-plates', categorySlug: 'switches-sockets' }
    ]
  },
  {
    id: 'cat-13',
    name: 'Electrical Conduits',
    slug: 'electrical-conduits',
    icon: 'Columns',
    image: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?auto=format&fit=crop&w=600&q=80',
    description: 'Medium and heavy mechanical stress PVC conduit pipes, circular junction boxes, and bends.',
    subcategories: [
      { id: 'sub-13-1', name: 'Rigid PVC Electrical Conduits (20mm/25mm)', slug: 'pvc-conduits', categorySlug: 'electrical-conduits' },
      { id: 'sub-13-2', name: 'Conduit Bends & Deep Junction Boxes', slug: 'conduit-accessories', categorySlug: 'electrical-conduits' }
    ]
  },
  {
    id: 'cat-14',
    name: 'Lighting',
    slug: 'lighting',
    icon: 'Sun',
    image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=600&q=80',
    description: 'Recessed LED downlights, COB spotlights, LED batten tube lights, and cove strip lighting.',
    subcategories: [
      { id: 'sub-14-1', name: 'Slim LED Recessed Downlights', slug: 'recessed-downlights', categorySlug: 'lighting' },
      { id: 'sub-14-2', name: 'COB Directional Spotlights', slug: 'cob-spotlights', categorySlug: 'lighting' },
      { id: 'sub-14-3', name: 'LED Batten Surface Lights', slug: 'led-battens', categorySlug: 'lighting' }
    ]
  },
  {
    id: 'cat-15',
    name: 'Ceiling Fans & Exhaust',
    slug: 'ceiling-fans-exhaust',
    icon: 'Wind',
    image: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=600&q=80',
    description: 'Energy-saving BLDC ceiling fans, heavy-duty ventilation fans, and silent exhaust systems.',
    subcategories: [
      { id: 'sub-15-1', name: 'BLDC Energy Saving Ceiling Fans (1200mm)', slug: 'bldc-ceiling-fans', categorySlug: 'ceiling-fans-exhaust' },
      { id: 'sub-15-2', name: 'Bathroom & Kitchen High-Speed Exhaust Fans', slug: 'exhaust-fans', categorySlug: 'ceiling-fans-exhaust' }
    ]
  },
  {
    id: 'cat-16',
    name: 'CPVC Pipes & Overhead Tanks',
    slug: 'cpvc-pipes-overhead-tanks',
    icon: 'Compass',
    image: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=600&q=80',
    description: 'Hot & cold potable water CPVC pipes, fittings, ball valves, solvent cements, and storage tanks.',
    featured: true,
    subcategories: [
      { id: 'sub-16-1', name: 'SDR 11 CPVC Hot & Cold Water Pipes', slug: 'cpvc-pipes', categorySlug: 'cpvc-pipes-overhead-tanks' },
      { id: 'sub-16-2', name: 'Brass Elbows, Tees & Couplers', slug: 'cpvc-brass-fittings', categorySlug: 'cpvc-pipes-overhead-tanks' },
      { id: 'sub-16-3', name: 'Heavy Duty CPVC Solvent Cement', slug: 'cpvc-solvent', categorySlug: 'cpvc-pipes-overhead-tanks' }
    ]
  },
  {
    id: 'cat-17',
    name: 'Sanitary & Bath Fittings',
    slug: 'sanitary-bath-fittings',
    icon: 'Anchor',
    image: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=600&q=80',
    description: 'Ceramic single-piece water closets, wall-hung toilets, brass chrome faucets, and overhead showers.',
    featured: true,
    subcategories: [
      { id: 'sub-17-1', name: 'Single Piece Ceramic Water Closets', slug: 'water-closets', categorySlug: 'sanitary-bath-fittings' },
      { id: 'sub-17-2', name: 'Quarter Turn Brass Chrome Basin Mixers', slug: 'basin-mixers', categorySlug: 'sanitary-bath-fittings' },
      { id: 'sub-17-3', name: 'Overhead Rain Showers & Arms', slug: 'rain-showers', categorySlug: 'sanitary-bath-fittings' }
    ]
  },
  {
    id: 'cat-18',
    name: 'Kitchen Sinks & Faucets',
    slug: 'kitchen-sinks-faucets',
    icon: 'Coffee',
    image: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?auto=format&fit=crop&w=600&q=80',
    description: 'Stainless steel grade 304 handmade sinks, quartz granite composite sinks, and flexible spout mixers.',
    subcategories: [
      { id: 'sub-18-1', name: 'SS 304 Handmade Single Bowl Sinks', slug: 'ss-kitchen-sinks', categorySlug: 'kitchen-sinks-faucets' },
      { id: 'sub-18-2', name: 'Flexible Pull-Out Kitchen Sink Faucets', slug: 'kitchen-faucets', categorySlug: 'kitchen-sinks-faucets' }
    ]
  },
  {
    id: 'cat-19',
    name: 'Water Storage Tanks',
    slug: 'water-storage-tanks',
    icon: 'Database',
    image: 'https://images.unsplash.com/photo-1521747116042-5a810fda9664?auto=format&fit=crop&w=600&q=80',
    description: 'Triple and 4-layer UV stabilized anti-bacterial overhead water storage tanks.',
    subcategories: [
      { id: 'sub-19-1', name: '1000L 4-Layer Anti-Bacterial Tanks', slug: '1000l-tanks', categorySlug: 'water-storage-tanks' },
      { id: 'sub-19-2', name: '500L Multi-Layer Overhead Tanks', slug: '500l-tanks', categorySlug: 'water-storage-tanks' }
    ]
  },
  {
    id: 'cat-20',
    name: 'Power Tools & Accessories',
    slug: 'power-tools-accessories',
    icon: 'Wrench',
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80',
    description: 'Heavy rotary hammer drills, 4-inch angle grinders, marble tile cutters, and drill bit sets.',
    featured: true,
    subcategories: [
      { id: 'sub-20-1', name: 'Rotary Hammer Drills (800W)', slug: 'rotary-hammers', categorySlug: 'power-tools-accessories' },
      { id: 'sub-20-2', name: 'Heavy Duty 4-Inch Angle Grinders', slug: 'angle-grinders', categorySlug: 'power-tools-accessories' },
      { id: 'sub-20-3', name: 'Diamond Marble Cutting Blades', slug: 'cutting-blades', categorySlug: 'power-tools-accessories' }
    ]
  },
  {
    id: 'cat-21',
    name: 'General Hardware & Tools',
    slug: 'general-hardware-tools',
    icon: 'Tool',
    image: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=600&q=80',
    description: 'Steel measuring tapes, spirit levels, claw hammers, screwdrivers, pliers, and drywall screws.',
    subcategories: [
      { id: 'sub-21-1', name: 'Measuring Tapes (5m/30m) & Spirit Levels', slug: 'measuring-tools', categorySlug: 'general-hardware-tools' },
      { id: 'sub-21-2', name: 'Hardened Hand Tools & Hammer Sets', slug: 'hand-tools', categorySlug: 'general-hardware-tools' },
      { id: 'sub-21-3', name: 'Fasteners, Screws & Anchor Bolts', slug: 'fasteners-screws', categorySlug: 'general-hardware-tools' }
    ]
  },
  {
    id: 'cat-22',
    name: 'CCTV & Networking',
    slug: 'cctv-networking',
    icon: 'Camera',
    image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=600&q=80',
    description: 'High-definition IP surveillance cameras, NVRs, CAT6 networking cables, and server patch panels.',
    subcategories: [
      { id: 'sub-22-1', name: 'HD Outdoor IP Bullet & Dome Cameras', slug: 'ip-cameras', categorySlug: 'cctv-networking' },
      { id: 'sub-22-2', name: 'CAT6 Pure Copper Ethernet Cables (305m)', slug: 'cat6-cables', categorySlug: 'cctv-networking' }
    ]
  },
  {
    id: 'cat-23',
    name: 'Home Appliances & Power Backup',
    slug: 'home-appliances-power-backup',
    icon: 'BatteryCharging',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    description: 'Pure sine wave home inverters, tubular power backup batteries, and digital water geysers.',
    subcategories: [
      { id: 'sub-23-1', name: 'Pure Sine Wave Inverters (1100VA)', slug: 'inverters', categorySlug: 'home-appliances-power-backup' },
      { id: 'sub-23-2', name: 'Storage Electric Water Geysers (25L)', slug: 'water-geysers', categorySlug: 'home-appliances-power-backup' }
    ]
  },
  {
    id: 'cat-24',
    name: 'Safety & Workwear',
    slug: 'safety-workwear',
    icon: 'LifeBuoy',
    image: 'https://images.unsplash.com/photo-1578873375969-d65275e89647?auto=format&fit=crop&w=600&q=80',
    description: 'ISI certified construction helmets, steel-toe safety shoes, high-visibility reflective jackets, and gloves.',
    subcategories: [
      { id: 'sub-24-1', name: 'Steel-Toe Protective Safety Shoes', slug: 'safety-shoes', categorySlug: 'safety-workwear' },
      { id: 'sub-24-2', name: 'Industrial Hard Hats & Helmets', slug: 'safety-helmets', categorySlug: 'safety-workwear' },
      { id: 'sub-24-3', name: 'Reflective Safety Vests & Eyewear', slug: 'safety-vests', categorySlug: 'safety-workwear' }
    ]
  },
  {
    id: 'cat-25',
    name: 'Glass Door Hardware',
    slug: 'glass-door-hardware',
    icon: 'Maximize',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
    description: 'Hydraulic floor springs for frameless glass doors, patch fittings, and D-pull glass handles.',
    subcategories: [
      { id: 'sub-25-1', name: 'Heavy Duty Hydraulic Floor Springs', slug: 'floor-springs', categorySlug: 'glass-door-hardware' },
      { id: 'sub-25-2', name: 'Stainless Steel Top & Bottom Patch Fittings', slug: 'patch-fittings', categorySlug: 'glass-door-hardware' }
    ]
  },
  {
    id: 'cat-26',
    name: 'Welding Consumables',
    slug: 'welding-consumables',
    icon: 'Crosshair',
    image: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=600&q=80',
    description: 'General purpose mild steel welding electrodes (E6013), cutting wheels, and welding goggles.',
    subcategories: [
      { id: 'sub-26-1', name: 'Mild Steel Welding Electrodes (3.15mm)', slug: 'welding-electrodes', categorySlug: 'welding-consumables' },
      { id: 'sub-26-2', name: 'Industrial Abrasive Cutting Discs', slug: 'cutting-discs', categorySlug: 'welding-consumables' }
    ]
  },
  {
    id: 'cat-27',
    name: 'Bathroom Renovation Materials',
    slug: 'bathroom-renovation-materials',
    icon: 'Feather',
    image: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=600&q=80',
    description: 'Shower glass partition channels, concealed cistern flushing tanks, and anti-cockroach floor drains.',
    subcategories: [
      { id: 'sub-27-1', name: 'Concealed Dual-Flush Water Cisterns', slug: 'concealed-cisterns', categorySlug: 'bathroom-renovation-materials' },
      { id: 'sub-27-2', name: 'Stainless Steel Linear Floor Drain Channels', slug: 'floor-drains', categorySlug: 'bathroom-renovation-materials' }
    ]
  },
  {
    id: 'cat-28',
    name: 'Ceiling & Flooring',
    slug: 'ceiling-flooring',
    icon: 'Layout',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
    description: 'Gypsum false ceiling boards, GI perimeter channels, wooden laminate flooring, and underlays.',
    subcategories: [
      { id: 'sub-28-1', name: 'Tapered Edge Gypsum Plaster Boards', slug: 'gypsum-boards', categorySlug: 'ceiling-flooring' },
      { id: 'sub-28-2', name: 'Galvanized GI Ceiling Framework Channels', slug: 'ceiling-channels', categorySlug: 'ceiling-flooring' },
      { id: 'sub-28-3', name: 'AC4 Grade Wooden Laminate Flooring', slug: 'laminate-flooring', categorySlug: 'ceiling-flooring' }
    ]
  }
];

export const CONSTRUCTION_DEPARTMENTS = [
  {
    id: 'dept-1',
    name: 'Civil & Interiors',
    slug: 'civil-interiors',
    icon: 'Building2',
    description: 'Cement, waterproof plaster, plywood, decorative boards, paints, tiles and structural adhesives.',
    categorySlugs: [
      'cement-concrete',
      'tiling-tile-adhesives',
      'plywood-mdf-hdhmr',
      'adhesives',
      'waterproofing',
      'painting-finishes',
      'bathroom-renovation-materials',
      'ceiling-flooring'
    ]
  },
  {
    id: 'dept-2',
    name: 'Furniture & Architectural Hardware',
    slug: 'furniture-hardware',
    icon: 'Layers',
    description: 'Concealed auto-hinges, telescopic channels, handles, mortise locks, sliding systems and glass fittings.',
    categorySlugs: [
      'hinges-channels-handles',
      'kitchen-systems-accessories',
      'wardrobe-bed-fittings',
      'door-locks-hardware',
      'glass-door-hardware'
    ]
  },
  {
    id: 'dept-3',
    name: 'Electrical',
    slug: 'electrical',
    icon: 'Zap',
    description: 'FRLS building wires, MCBs, distribution boards, modular switches, PVC conduits, LEDs and surveillance.',
    categorySlugs: [
      'wires-mcb-distribution-boards',
      'switches-sockets',
      'electrical-conduits',
      'lighting',
      'ceiling-fans-exhaust',
      'cctv-networking'
    ]
  },
  {
    id: 'dept-4',
    name: 'Plumbing, Sanitary & Bath',
    slug: 'plumbing-sanitary',
    icon: 'Compass',
    description: 'CPVC hot & cold pipes, overhead tanks, sanitary ceramics, chrome brass faucets and handmade sinks.',
    categorySlugs: [
      'cpvc-pipes-overhead-tanks',
      'sanitary-bath-fittings',
      'kitchen-sinks-faucets',
      'water-storage-tanks'
    ]
  },
  {
    id: 'dept-5',
    name: 'Hardware & Appliances',
    slug: 'hardware-appliances',
    icon: 'Wrench',
    description: 'Rotary hammer drills, angle grinders, site safety PPE, inverters, geysers and welding electrodes.',
    categorySlugs: [
      'power-tools-accessories',
      'general-hardware-tools',
      'home-appliances-power-backup',
      'safety-workwear',
      'welding-consumables'
    ]
  }
];

// Curated New Launches Category Hierarchy mapped directly to Master Categories
export const NEW_LAUNCHES_CATEGORIES: NewLaunchCategory[] = [
  {
    id: 'nl-1',
    name: 'Cabinet Hardware',
    slug: 'cabinet-hardware',
    masterCategorySlug: 'hinges-channels-handles',
    icon: 'Layers',
    image: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=600&q=80',
    description: 'Soft-close hydraulic auto hinges, telescopic drawer slides, and architectural cabinet handles.',
    badge: 'NEW ARRIVAL'
  },
  {
    id: 'nl-2',
    name: 'Kitchen Systems & Hardware',
    slug: 'kitchen-systems-hardware',
    masterCategorySlug: 'kitchen-systems-accessories',
    icon: 'Box',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80',
    description: 'Modular SS 304 wire baskets, soft-close tandem boxes, corner carousels, and pantry pull-outs.',
    badge: 'NEW ARRIVAL'
  },
  {
    id: 'nl-3',
    name: 'General Hardware & Tools',
    slug: 'general-hardware-tools',
    masterCategorySlug: 'general-hardware-tools',
    icon: 'Wrench',
    image: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=600&q=80',
    description: 'Precision measuring tapes, spirit levels, claw hammers, screwdrivers, and fasteners.',
    badge: 'JOB SITE ESSENTIAL'
  },
  {
    id: 'nl-4',
    name: 'Bathroom Renovation Materials',
    slug: 'bathroom-renovation-materials',
    masterCategorySlug: 'bathroom-renovation-materials',
    icon: 'Feather',
    image: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=600&q=80',
    description: 'Concealed dual-flush cisterns, linear stainless steel floor drains, and partition channels.',
    badge: 'HOT LAUNCH'
  },
  {
    id: 'nl-5',
    name: 'Conduits & Piping',
    slug: 'conduits-piping',
    masterCategorySlug: 'electrical-conduits',
    icon: 'Columns',
    image: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?auto=format&fit=crop&w=600&q=80',
    description: 'Rigid PVC mechanical electrical conduits, circular junction boxes, and installation bends.',
    badge: 'FRESH BATCH'
  },
  {
    id: 'nl-6',
    name: 'PVC Pipes',
    slug: 'pvc-pipes',
    masterCategorySlug: 'cpvc-pipes-overhead-tanks',
    icon: 'Compass',
    image: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=600&q=80',
    description: 'Hot and cold potable CPVC pipes, SDR 11 fittings, brass couplers, and heavy solvent cements.',
    badge: '60M DISPATCH'
  },
  {
    id: 'nl-7',
    name: 'Kitchen Sinks & Faucets',
    slug: 'kitchen-sinks-faucets',
    masterCategorySlug: 'kitchen-sinks-faucets',
    icon: 'Coffee',
    image: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?auto=format&fit=crop&w=600&q=80',
    description: 'Handmade SS 304 satin finish sinks, flexible silicone spout pull-out mixer faucets.',
    badge: 'NEW ARRIVAL'
  },
  {
    id: 'nl-8',
    name: 'Home Appliances & Power Backup',
    slug: 'home-appliances-power-backup',
    masterCategorySlug: 'home-appliances-power-backup',
    icon: 'BatteryCharging',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    description: 'Pure sine wave digital inverters, storage electric water heaters, and backup systems.',
    badge: 'DIRECT FROM BRAND'
  },
  {
    id: 'nl-9',
    name: 'Power Tools & Equipment',
    slug: 'power-tools-accessories',
    masterCategorySlug: 'power-tools-accessories',
    icon: 'Wrench',
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80',
    description: 'Rotary hammer drills, heavy 4-inch angle grinders, and diamond marble cutting blades.',
    badge: 'CONTRACTOR CHOICE'
  },
  {
    id: 'nl-10',
    name: 'Modern Architectural Lighting',
    slug: 'lighting',
    masterCategorySlug: 'lighting',
    icon: 'Sun',
    image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=600&q=80',
    description: 'Slim recessed LED downlights, COB directional spotlights, and continuous cove lighting.',
    badge: 'NEW ARRIVAL'
  }
];

export const getNewLaunchCategoryBySlug = (slug?: string): NewLaunchCategory | undefined => {
  if (!slug) return undefined;
  return NEW_LAUNCHES_CATEGORIES.find((c) => c.slug === slug || c.masterCategorySlug === slug);
};

// Shared 4-level BUILDORA Taxonomy Seeds (Main Category -> Child Category -> Product Type)
const DEPT_TO_MAIN_ID: Record<string, string> = {
  'dept-1': 'mc-1',
  'dept-2': 'mc-2',
  'dept-3': 'mc-3',
  'dept-4': 'mc-4',
  'dept-5': 'mc-5',
};

export const MAIN_CATEGORIES_SEED = CONSTRUCTION_DEPARTMENTS.map((dept, idx) => ({
  id: DEPT_TO_MAIN_ID[dept.id] || `mc-${idx + 1}`,
  name: dept.name,
  slug: dept.slug,
  icon: dept.icon,
  description: dept.description,
  image:
    MASTER_CATEGORIES.find((c) => dept.categorySlugs.includes(c.slug))?.image ||
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80',
  sortOrder: idx + 1,
  isActive: true,
  showInNavigation: true,
}));

export const CHILD_CATEGORIES_SEED = MASTER_CATEGORIES.map((cat, idx) => {
  const dept = CONSTRUCTION_DEPARTMENTS.find((d) => d.categorySlugs.includes(cat.slug));
  const mainId = dept ? DEPT_TO_MAIN_ID[dept.id] || dept.id : 'mc-1';
  return {
    id: cat.id,
    mainCategoryId: mainId,
    mainCategorySlug: dept?.slug || 'civil-interiors',
    name: cat.name,
    slug: cat.slug,
    icon: cat.icon,
    description: cat.description,
    image: cat.image,
    sortOrder: idx + 1,
    isActive: true,
  };
});

export const PRODUCT_TYPES_SEED = MASTER_CATEGORIES.flatMap((cat) => {
  const dept = CONSTRUCTION_DEPARTMENTS.find((d) => d.categorySlugs.includes(cat.slug));
  const mainId = dept ? DEPT_TO_MAIN_ID[dept.id] || dept.id : 'mc-1';
  return (cat.subcategories || []).map((sub, idx) => ({
    id: sub.id,
    mainCategoryId: mainId,
    childCategoryId: cat.id,
    childCategorySlug: cat.slug,
    name: sub.name,
    slug: sub.slug,
    sortOrder: idx + 1,
    isActive: true,
  }));
});

export interface TaxonomyPool {
  mainCategories: Array<{ id: string; name: string; slug: string; sortOrder?: number; isActive?: boolean; showInNavigation?: boolean }>;
  childCategories: Array<{ id: string; mainCategoryId: string; name: string; slug: string; isActive?: boolean }>;
  productTypes: Array<{ id: string; mainCategoryId: string; childCategoryId: string; name: string; slug: string; isActive?: boolean }>;
}

const DEFAULT_TAXONOMY_POOL: TaxonomyPool = {
  mainCategories: MAIN_CATEGORIES_SEED,
  childCategories: CHILD_CATEGORIES_SEED,
  productTypes: PRODUCT_TYPES_SEED,
};

export function resolveFullTaxonomy(
  inputs: { mainInput?: string; childInput?: string; typeInput?: string },
  pool: TaxonomyPool = DEFAULT_TAXONOMY_POOL
) {
  const cleanMain = (inputs.mainInput || '').trim().toLowerCase();
  const cleanChild = (inputs.childInput || '').trim().toLowerCase();
  const cleanType = (inputs.typeInput || '').trim().toLowerCase();

  let mainCategory = cleanMain
    ? pool.mainCategories.find(
        (m) =>
          m.id.toLowerCase() === cleanMain ||
          m.slug.toLowerCase() === cleanMain ||
          m.name.toLowerCase() === cleanMain
      ) || null
    : null;

  let childCategory = cleanChild
    ? pool.childCategories.find(
        (c) =>
          (!mainCategory || c.mainCategoryId === mainCategory.id) &&
          (c.id.toLowerCase() === cleanChild ||
            c.slug.toLowerCase() === cleanChild ||
            c.name.toLowerCase() === cleanChild)
      ) || null
    : null;

  // Backwards compatibility: if child was passed alone or main didn't match, resolve main from unique child
  if (!childCategory && cleanChild && !mainCategory) {
    childCategory =
      pool.childCategories.find(
        (c) =>
          c.id.toLowerCase() === cleanChild ||
          c.slug.toLowerCase() === cleanChild ||
          c.name.toLowerCase() === cleanChild
      ) || null;
  }

  if (childCategory && !mainCategory) {
    mainCategory = pool.mainCategories.find((m) => m.id === childCategory!.mainCategoryId) || null;
  }

  let productType = cleanType
    ? pool.productTypes.find(
        (pt) =>
          (!childCategory || pt.childCategoryId === childCategory.id) &&
          (!mainCategory || pt.mainCategoryId === mainCategory.id) &&
          (pt.id.toLowerCase() === cleanType ||
            pt.slug.toLowerCase() === cleanType ||
            pt.name.toLowerCase() === cleanType)
      ) || null
    : null;

  if (!productType && cleanType && !childCategory && !mainCategory) {
    productType =
      pool.productTypes.find(
        (pt) =>
          pt.id.toLowerCase() === cleanType ||
          pt.slug.toLowerCase() === cleanType ||
          pt.name.toLowerCase() === cleanType
      ) || null;
    if (productType) {
      childCategory = pool.childCategories.find((c) => c.id === productType!.childCategoryId) || null;
      mainCategory = pool.mainCategories.find((m) => m.id === productType!.mainCategoryId) || null;
    }
  }

  return {
    mainCategory,
    childCategory,
    productType,
    mainCategoryId: mainCategory?.id || '',
    mainCategorySlug: mainCategory?.slug || '',
    mainCategoryName: mainCategory?.name || '',
    childCategoryId: childCategory?.id || '',
    childCategorySlug: childCategory?.slug || '',
    childCategoryName: childCategory?.name || '',
    productTypeId: productType?.id || '',
    productTypeSlug: productType?.slug || '',
    productTypeName: productType?.name || '',
  };
}

export function resolveCanonicalCategoryHierarchy(
  categoryInput?: string,
  subcategoryInput?: string,
  mainInput?: string
) {
  const full = resolveFullTaxonomy({
    mainInput,
    childInput: categoryInput,
    typeInput: subcategoryInput,
  });

  const matchedMain = full.childCategory
    ? MASTER_CATEGORIES.find((c) => c.id === full.childCategory!.id || c.slug === full.childCategory!.slug) || null
    : null;
  const matchedChild =
    matchedMain && full.productType
      ? matchedMain.subcategories.find(
          (s) => s.id === full.productType!.id || s.slug === full.productType!.slug
        ) || null
      : null;

  return {
    ...full,
    matchedMain,
    matchedChild,
    categoryId: full.childCategoryId,
    categoryName: full.childCategoryName,
    categorySlug: full.childCategorySlug,
    subcategoryId: full.productTypeId,
    subcategoryName: full.productTypeName,
    subcategorySlug: full.productTypeSlug,
  };
}

export const MASTER_BRANDS = [
  {
    id: 'brand-1',
    name: 'UltraTech Cement',
    slug: 'ultratech',
    logo: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=200&q=80',
    description: "The Engineer's Choice - India's leading manufacturer of grey cement, ready-mix concrete, and building solutions.",
    featured: true,
    categories: ['cement-concrete', 'tiling-tile-adhesives']
  },
  {
    id: 'brand-2',
    name: 'Asian Paints',
    slug: 'asian-paints',
    logo: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=200&q=80',
    description: 'Leading decorative coatings and finishes for interior walls, exterior facades, primers, and wood stains.',
    featured: true,
    categories: ['painting-finishes', 'waterproofing']
  },
  {
    id: 'brand-3',
    name: 'Astral Pipes',
    slug: 'astral',
    logo: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=200&q=80',
    description: 'Pioneers in CPVC plumbing systems, solvent cements, drainage pipes, and water storage solutions.',
    featured: true,
    categories: ['cpvc-pipes-overhead-tanks', 'sanitary-bath-fittings']
  },
  {
    id: 'brand-4',
    name: 'Havells',
    slug: 'havells',
    logo: 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&w=200&q=80',
    description: 'Top-tier electrical goods: FRLS building wires, MCBs, modular switches, and LED downlights.',
    featured: true,
    categories: ['wires-mcb-distribution-boards', 'switches-sockets', 'lighting', 'ceiling-fans-exhaust']
  },
  {
    id: 'brand-5',
    name: 'Pidilite (Fevicol & Dr. Fixit)',
    slug: 'pidilite',
    logo: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=200&q=80',
    description: 'Unmatched construction adhesives, waterproofing chemicals, sealants, and tile fixing polymers.',
    featured: true,
    categories: ['adhesives', 'waterproofing', 'tiling-tile-adhesives']
  },
  {
    id: 'brand-6',
    name: 'Greenply',
    slug: 'greenply',
    logo: 'https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?auto=format&fit=crop&w=200&q=80',
    description: 'Premium quality BWP marine plywood, calibrated architectural boards, and decorative veneers.',
    featured: true,
    categories: ['plywood-mdf-hdhmr', 'wardrobe-bed-fittings']
  },
  {
    id: 'brand-7',
    name: 'Bosch Power Tools',
    slug: 'bosch',
    logo: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=200&q=80',
    description: 'German precision engineering in rotary hammer drills, angle grinders, and industrial accessories.',
    featured: true,
    categories: ['power-tools-accessories', 'general-hardware-tools']
  },
  {
    id: 'brand-8',
    name: 'Kajaria Ceramics',
    slug: 'kajaria',
    logo: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=200&q=80',
    description: "India's No. 1 tile company with glazed vitrified floor tiles and designer ceramic wall tiles.",
    featured: true,
    categories: ['tiling-tile-adhesives']
  },
  {
    id: 'brand-9',
    name: 'Godrej Locks',
    slug: 'godrej',
    logo: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=200&q=80',
    description: 'Trusted architectural locks, digital smart locks, mortise handles, and door security hardware.',
    featured: true,
    categories: ['door-locks-hardware', 'hinges-channels-handles']
  },
  {
    id: 'brand-10',
    name: 'Supreme Industries',
    slug: 'supreme',
    logo: 'https://images.unsplash.com/photo-1521747116042-5a810fda9664?auto=format&fit=crop&w=200&q=80',
    description: 'Multi-layer anti-bacterial water storage tanks, PVC conduits, and drainage piping systems.',
    featured: true,
    categories: ['water-storage-tanks', 'electrical-conduits', 'cpvc-pipes-overhead-tanks']
  }
];

export const SERVICEABLE_PINCODES: Record<string, { city: string; locality: string; state: string; etaMinutes: number; warehouse: string; zone: string }> = {
  // Central Bengaluru (WH-BLR-01 - Central Indiranagar Hub)
  '560001': { city: 'Bengaluru', locality: 'Bengaluru GPO / MG Road', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-01', zone: 'CENTRAL_BLR' },
  '560002': { city: 'Bengaluru', locality: 'City Market / Chickpet', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-01', zone: 'CENTRAL_BLR' },
  '560005': { city: 'Bengaluru', locality: 'Frazer Town / Pulikeshi Nagar', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-01', zone: 'CENTRAL_BLR' },
  '560008': { city: 'Bengaluru', locality: 'Ulsoor / Halasuru', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-01', zone: 'CENTRAL_BLR' },
  '560025': { city: 'Bengaluru', locality: 'Richmond Town / Ashok Nagar', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-01', zone: 'CENTRAL_BLR' },
  '560038': { city: 'Bengaluru', locality: 'Indiranagar', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-01', zone: 'CENTRAL_BLR' },
  '560042': { city: 'Bengaluru', locality: 'Halasuru / Cambridge Layout', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-01', zone: 'CENTRAL_BLR' },
  '560043': { city: 'Bengaluru', locality: 'Banaswadi / Kalyan Nagar', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-01', zone: 'CENTRAL_BLR' },
  '560051': { city: 'Bengaluru', locality: 'Shivaji Nagar', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-01', zone: 'CENTRAL_BLR' },
  '560071': { city: 'Bengaluru', locality: 'Domlur / Amarjyoti Layout', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-01', zone: 'CENTRAL_BLR' },
  '560075': { city: 'Bengaluru', locality: 'HAL 3rd Stage / Tippasandra', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-01', zone: 'CENTRAL_BLR' },
  '560084': { city: 'Bengaluru', locality: 'Richards Town / Cooke Town', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-01', zone: 'CENTRAL_BLR' },

  // South & South-East Bengaluru (WH-BLR-02 - Koramangala & HSR Hub)
  '560029': { city: 'Bengaluru', locality: 'Tavarekere / SG Palya / Hosur Road', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-02', zone: 'SOUTH_BLR' },
  '560030': { city: 'Bengaluru', locality: 'Adugodi / Dairy Circle', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-02', zone: 'SOUTH_BLR' },
  '560034': { city: 'Bengaluru', locality: 'Koramangala', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-02', zone: 'SOUTH_BLR' },
  '560041': { city: 'Bengaluru', locality: 'Jayanagar 4th Block', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-02', zone: 'SOUTH_BLR' },
  '560062': { city: 'Bengaluru', locality: 'Doddakallasandra / Konanakunte', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-02', zone: 'SOUTH_BLR' },
  '560068': { city: 'Bengaluru', locality: 'Madivala / Bommanahalli', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-02', zone: 'SOUTH_BLR' },
  '560069': { city: 'Bengaluru', locality: 'Jayanagar East / Byrasandra', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-02', zone: 'SOUTH_BLR' },
  '560076': { city: 'Bengaluru', locality: 'Bannerghatta Road / Hulimavu', state: 'Karnataka', etaMinutes: 90, warehouse: 'WH-BLR-02', zone: 'SOUTH_BLR' },
  '560078': { city: 'Bengaluru', locality: 'JP Nagar (Phases 1-6)', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-02', zone: 'SOUTH_BLR' },
  '560083': { city: 'Bengaluru', locality: 'Gottigere / Bannerghatta', state: 'Karnataka', etaMinutes: 90, warehouse: 'WH-BLR-02', zone: 'SOUTH_BLR' },
  '560095': { city: 'Bengaluru', locality: 'Koramangala 4th Block', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-02', zone: 'SOUTH_BLR' },
  '560099': { city: 'Bengaluru', locality: 'Electronic City Phase 2', state: 'Karnataka', etaMinutes: 90, warehouse: 'WH-BLR-02', zone: 'SOUTH_BLR' },
  '560100': { city: 'Bengaluru', locality: 'Electronic City Phase 1', state: 'Karnataka', etaMinutes: 90, warehouse: 'WH-BLR-02', zone: 'SOUTH_BLR' },
  '560102': { city: 'Bengaluru', locality: 'HSR Layout', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-02', zone: 'SOUTH_BLR' },
  '560103': { city: 'Bengaluru', locality: 'Bellandur / Outer Ring Road', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-02', zone: 'SOUTH_BLR' },
  '560104': { city: 'Bengaluru', locality: 'Begur / Hongasandra', state: 'Karnataka', etaMinutes: 90, warehouse: 'WH-BLR-02', zone: 'SOUTH_BLR' },
  '560105': { city: 'Bengaluru', locality: 'Bellandur EcoWorld / Sarjapur', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-02', zone: 'SOUTH_BLR' },
  '560106': { city: 'Bengaluru', locality: 'BTM Layout 2nd Stage', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-02', zone: 'SOUTH_BLR' },
  '560109': { city: 'Bengaluru', locality: 'Kanakapura Road / Thalaghattapura', state: 'Karnataka', etaMinutes: 90, warehouse: 'WH-BLR-02', zone: 'SOUTH_BLR' },
  '560110': { city: 'Bengaluru', locality: 'ISRO Layout / Bikasipura', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-02', zone: 'SOUTH_BLR' },

  // East & North-East Bengaluru (WH-BLR-03 - Whitefield & IT Corridor Hub)
  '560016': { city: 'Bengaluru', locality: 'Ramamurthy Nagar', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-03', zone: 'EAST_BLR' },
  '560017': { city: 'Bengaluru', locality: 'Old Airport Road / Vimanapura', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-03', zone: 'EAST_BLR' },
  '560035': { city: 'Bengaluru', locality: 'Sarjapur Road / Doddakannelli', state: 'Karnataka', etaMinutes: 90, warehouse: 'WH-BLR-03', zone: 'EAST_BLR' },
  '560036': { city: 'Bengaluru', locality: 'KR Puram / Dooravani Nagar', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-03', zone: 'EAST_BLR' },
  '560037': { city: 'Bengaluru', locality: 'Marathahalli / HAL', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-03', zone: 'EAST_BLR' },
  '560048': { city: 'Bengaluru', locality: 'Mahadevapura / Hoodi', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-03', zone: 'EAST_BLR' },
  '560049': { city: 'Bengaluru', locality: 'Bhattarahalli / TC Palya', state: 'Karnataka', etaMinutes: 90, warehouse: 'WH-BLR-03', zone: 'EAST_BLR' },
  '560066': { city: 'Bengaluru', locality: 'Whitefield', state: 'Karnataka', etaMinutes: 90, warehouse: 'WH-BLR-03', zone: 'EAST_BLR' },
  '560067': { city: 'Bengaluru', locality: 'Kadugodi / ITPL', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-03', zone: 'EAST_BLR' },
  '560087': { city: 'Bengaluru', locality: 'Varthur / Gunjur', state: 'Karnataka', etaMinutes: 90, warehouse: 'WH-BLR-03', zone: 'EAST_BLR' },
  '560093': { city: 'Bengaluru', locality: 'CV Raman Nagar', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-03', zone: 'EAST_BLR' },
  '560111': { city: 'Bengaluru', locality: 'Doddakannelli / Carmelaram', state: 'Karnataka', etaMinutes: 90, warehouse: 'WH-BLR-03', zone: 'EAST_BLR' },
  '560113': { city: 'Bengaluru', locality: 'Babusapalya / Horamavu', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-03', zone: 'EAST_BLR' },

  // West & North-West Bengaluru (WH-BLR-04 - Nagarabhavi & Rajajinagar Hub)
  '560003': { city: 'Bengaluru', locality: 'Malleshwaram', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-04', zone: 'WEST_BLR' },
  '560004': { city: 'Bengaluru', locality: 'Basavanagudi / Gandhi Bazaar', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-04', zone: 'WEST_BLR' },
  '560010': { city: 'Bengaluru', locality: 'Rajajinagar 1st Block', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-04', zone: 'WEST_BLR' },
  '560019': { city: 'Bengaluru', locality: 'Hanumanthanagar / Gavipuram', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-04', zone: 'WEST_BLR' },
  '560021': { city: 'Bengaluru', locality: 'Rajajinagar 2nd Stage', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-04', zone: 'WEST_BLR' },
  '560022': { city: 'Bengaluru', locality: 'Yeshwanthpur', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-04', zone: 'WEST_BLR' },
  '560040': { city: 'Bengaluru', locality: 'Vijayanagar / RPC Layout', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-04', zone: 'WEST_BLR' },
  '560050': { city: 'Bengaluru', locality: 'Basavanagudi', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-04', zone: 'WEST_BLR' },
  '560056': { city: 'Bengaluru', locality: 'Bangalore University / Jnana Bharati', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-04', zone: 'WEST_BLR' },
  '560058': { city: 'Bengaluru', locality: 'Peenya Industrial Area', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-04', zone: 'WEST_BLR' },
  '560060': { city: 'Bengaluru', locality: 'Kengeri Satellite Town', state: 'Karnataka', etaMinutes: 90, warehouse: 'WH-BLR-04', zone: 'WEST_BLR' },
  '560061': { city: 'Bengaluru', locality: 'Subramanyapura / Uttarahalli', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-04', zone: 'WEST_BLR' },
  '560070': { city: 'Bengaluru', locality: 'Banashankari 2nd Stage', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-04', zone: 'WEST_BLR' },
  '560072': { city: 'Bengaluru', locality: 'Nagarabhavi / Bengaluru West', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-04', zone: 'WEST_BLR' },
  '560073': { city: 'Bengaluru', locality: 'Bagalagunte / Nagasandra', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-04', zone: 'WEST_BLR' },
  '560074': { city: 'Bengaluru', locality: 'Kumbalgodu Industrial Area', state: 'Karnataka', etaMinutes: 90, warehouse: 'WH-BLR-04', zone: 'WEST_BLR' },
  '560079': { city: 'Bengaluru', locality: 'Basaveshwaranagar', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-04', zone: 'WEST_BLR' },
  '560085': { city: 'Bengaluru', locality: 'Banashankari 3rd Stage', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-04', zone: 'WEST_BLR' },
  '560086': { city: 'Bengaluru', locality: 'Mahalakshmipuram / West of Chord Road', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-04', zone: 'WEST_BLR' },
  '560091': { city: 'Bengaluru', locality: 'Viswaneedam / Magadi Road', state: 'Karnataka', etaMinutes: 90, warehouse: 'WH-BLR-04', zone: 'WEST_BLR' },
  '560096': { city: 'Bengaluru', locality: 'Mahalakshmi Layout', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-04', zone: 'WEST_BLR' },
  '560098': { city: 'Bengaluru', locality: 'Rajarajeshwari Nagar', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-04', zone: 'WEST_BLR' },
  '560107': { city: 'Bengaluru', locality: 'Rajagopalnagar / Peenya 3rd Phase', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-04', zone: 'WEST_BLR' },
  '560108': { city: 'Bengaluru', locality: 'Peenya 2nd Stage / NTTF', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-04', zone: 'WEST_BLR' },

  // North Bengaluru (WH-BLR-05 - Hebbal & Yelahanka Hub)
  '560024': { city: 'Bengaluru', locality: 'Hebbal / Ganganagar', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-05', zone: 'NORTH_BLR' },
  '560032': { city: 'Bengaluru', locality: 'RT Nagar', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-05', zone: 'NORTH_BLR' },
  '560054': { city: 'Bengaluru', locality: 'Mathikere / MSRIT', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-05', zone: 'NORTH_BLR' },
  '560057': { city: 'Bengaluru', locality: 'Dasarahalli / Tumkur Road', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-05', zone: 'NORTH_BLR' },
  '560063': { city: 'Bengaluru', locality: 'Jalahalli', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-05', zone: 'NORTH_BLR' },
  '560064': { city: 'Bengaluru', locality: 'Yelahanka New Town', state: 'Karnataka', etaMinutes: 90, warehouse: 'WH-BLR-05', zone: 'NORTH_BLR' },
  '560065': { city: 'Bengaluru', locality: 'Yelahanka Old Town', state: 'Karnataka', etaMinutes: 90, warehouse: 'WH-BLR-05', zone: 'NORTH_BLR' },
  '560077': { city: 'Bengaluru', locality: 'Kothanur / Hennur Road', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-05', zone: 'NORTH_BLR' },
  '560090': { city: 'Bengaluru', locality: 'Chikkabanavara / Hessarghatta Road', state: 'Karnataka', etaMinutes: 90, warehouse: 'WH-BLR-05', zone: 'NORTH_BLR' },
  '560092': { city: 'Bengaluru', locality: 'Sahakara Nagar / Byatarayanapura', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-05', zone: 'NORTH_BLR' },
  '560094': { city: 'Bengaluru', locality: 'Sanjaynagar / RMV 2nd Stage', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-05', zone: 'NORTH_BLR' },
  '560097': { city: 'Bengaluru', locality: 'Vidyaranyapura', state: 'Karnataka', etaMinutes: 90, warehouse: 'WH-BLR-05', zone: 'NORTH_BLR' },
  '560112': { city: 'Bengaluru', locality: 'Thanisandra / Kogilu', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-05', zone: 'NORTH_BLR' },
  '560114': { city: 'Bengaluru', locality: 'Manyata Tech Park / Nagavara', state: 'Karnataka', etaMinutes: 60, warehouse: 'WH-BLR-05', zone: 'NORTH_BLR' },

  // Outer Bengaluru & Key Construction Corridors
  '562110': { city: 'Bengaluru Rural', locality: 'Devanahalli Airport Corridor', state: 'Karnataka', etaMinutes: 120, warehouse: 'WH-BLR-05', zone: 'OUTER_BLR' },
  '562125': { city: 'Bengaluru Rural', locality: 'Hosakote Industrial Area', state: 'Karnataka', etaMinutes: 120, warehouse: 'WH-BLR-03', zone: 'OUTER_BLR' },
  '562157': { city: 'Bengaluru Rural', locality: 'Nelamangala Highway Corridor', state: 'Karnataka', etaMinutes: 120, warehouse: 'WH-BLR-04', zone: 'OUTER_BLR' },
  '562106': { city: 'Bengaluru Rural', locality: 'Anekal / Attibele Industrial Area', state: 'Karnataka', etaMinutes: 120, warehouse: 'WH-BLR-02', zone: 'OUTER_BLR' }
};

export const BENGALURU_WAREHOUSES: Record<string, { id: string; name: string; zone: string; avgDispatchMins: number }> = {
  'WH-BLR-01': { id: 'WH-BLR-01', name: 'Bengaluru Central / East Dark Store (Indiranagar)', zone: 'CENTRAL_BLR', avgDispatchMins: 38 },
  'WH-BLR-02': { id: 'WH-BLR-02', name: 'Bengaluru South Dark Store (Koramangala & HSR)', zone: 'SOUTH_BLR', avgDispatchMins: 42 },
  'WH-BLR-03': { id: 'WH-BLR-03', name: 'Bengaluru IT Corridor Dark Store (Whitefield)', zone: 'EAST_BLR', avgDispatchMins: 45 },
  'WH-BLR-04': { id: 'WH-BLR-04', name: 'Bengaluru West Dark Store (Nagarabhavi / Peenya)', zone: 'WEST_BLR', avgDispatchMins: 40 },
  'WH-BLR-05': { id: 'WH-BLR-05', name: 'Bengaluru North Dark Store (Hebbal / Yelahanka)', zone: 'NORTH_BLR', avgDispatchMins: 50 }
};

export interface ServiceabilityResult {
  pincode: string;
  locality: string;
  cityName: string;
  city: string;
  state: string;
  isServiceable: boolean;
  serviceable: boolean;
  deliveryZone: string;
  zone: string;
  warehouseId: string | null;
  warehouse: string | null;
  warehouseName: string | null;
  etaMinutes: number;
  estimatedMinutes: number;
  etaText: string;
  dispatchStatus: 'ACTIVE_DISPATCH' | 'SCHEDULED_DISPATCH' | 'UNDER_VERIFICATION' | 'UNSERVICEABLE';
  deliveryModes: string[];
  freeDeliveryThreshold: number;
  message: string;
}

export function checkBengaluruServiceability(pincode: string): ServiceabilityResult {
  const cleaned = (pincode || '').toString().trim();

  // 1. Format check: Must be a valid 6-digit Indian PIN code
  if (!/^[1-9][0-9]{5}$/.test(cleaned)) {
    return {
      pincode: cleaned,
      locality: '',
      cityName: '',
      city: '',
      state: '',
      isServiceable: false,
      serviceable: false,
      deliveryZone: 'INVALID',
      zone: 'INVALID',
      warehouseId: null,
      warehouse: null,
      warehouseName: null,
      etaMinutes: 0,
      estimatedMinutes: 0,
      etaText: 'Invalid PIN code',
      dispatchStatus: 'UNSERVICEABLE',
      deliveryModes: [],
      freeDeliveryThreshold: 1000,
      message: 'Please provide a valid 6-digit Indian Pincode.'
    };
  }

  // 2. Direct match in curated high-precision registry
  const known = SERVICEABLE_PINCODES[cleaned];
  if (known) {
    const whInfo = BENGALURU_WAREHOUSES[known.warehouse];
    const whName = whInfo ? whInfo.name : 'Bengaluru Quick Commerce Dark Store';
    return {
      pincode: cleaned,
      locality: known.locality,
      cityName: known.city,
      city: known.city,
      state: known.state,
      isServiceable: true,
      serviceable: true,
      deliveryZone: known.zone || 'BLR_METRO',
      zone: known.zone || 'BLR_METRO',
      warehouseId: known.warehouse,
      warehouse: known.warehouse,
      warehouseName: whName,
      etaMinutes: known.etaMinutes,
      estimatedMinutes: known.etaMinutes,
      etaText: `Estimated delivery: ${known.etaMinutes} minutes`,
      dispatchStatus: known.etaMinutes <= 90 ? 'ACTIVE_DISPATCH' : 'SCHEDULED_DISPATCH',
      deliveryModes: known.etaMinutes <= 60 ? ['EXPRESS_60_MIN', 'SCHEDULED_SLOT'] : ['SCHEDULED_SLOT'],
      freeDeliveryThreshold: 1000,
      message: `Express ${known.etaMinutes}-minute dispatch available to ${known.locality}!`
    };
  }

  // 3. All Bengaluru Urban / BBMP / Metropolitan PIN codes (560001 - 560114+)
  if (cleaned.startsWith('560')) {
    const subCode = parseInt(cleaned.substring(3), 10);
    let assignedWarehouse = 'WH-BLR-01';
    let zone = 'CENTRAL_BLR';
    let eta = 60;
    let approxArea = 'Bengaluru Urban';

    if (subCode >= 1 && subCode <= 9) {
      assignedWarehouse = 'WH-BLR-01';
      zone = 'CENTRAL_BLR';
      approxArea = 'Bengaluru Central / Core Metro';
      eta = 60;
    } else if (subCode >= 10 && subCode <= 22) {
      assignedWarehouse = 'WH-BLR-04';
      zone = 'WEST_BLR';
      approxArea = 'Bengaluru West / Rajajinagar Region';
      eta = 60;
    } else if (subCode >= 23 && subCode <= 33) {
      assignedWarehouse = 'WH-BLR-05';
      zone = 'NORTH_BLR';
      approxArea = 'Bengaluru North / Hebbal Region';
      eta = 60;
    } else if (subCode >= 34 && subCode <= 45) {
      assignedWarehouse = 'WH-BLR-02';
      zone = 'SOUTH_BLR';
      approxArea = 'Bengaluru South / Koramangala Region';
      eta = 60;
    } else if (subCode >= 46 && subCode <= 55) {
      assignedWarehouse = 'WH-BLR-03';
      zone = 'EAST_BLR';
      approxArea = 'Bengaluru East / Outer Ring Road';
      eta = 60;
    } else if (subCode >= 56 && subCode <= 75) {
      assignedWarehouse = 'WH-BLR-04';
      zone = 'WEST_BLR';
      approxArea = 'Bengaluru West / Nagarabhavi Region';
      eta = 60;
    } else if (subCode >= 76 && subCode <= 105) {
      assignedWarehouse = 'WH-BLR-02';
      zone = 'SOUTH_BLR';
      approxArea = 'Bengaluru South / Electronic City Corridor';
      eta = 90;
    } else {
      assignedWarehouse = 'WH-BLR-05';
      zone = 'NORTH_BLR';
      approxArea = 'Bengaluru Metropolitan Area';
      eta = 90;
    }

    const whInfo = BENGALURU_WAREHOUSES[assignedWarehouse];
    const whName = whInfo ? whInfo.name : 'Bengaluru Quick Commerce Dark Store';

    return {
      pincode: cleaned,
      locality: approxArea,
      cityName: 'Bengaluru',
      city: 'Bengaluru',
      state: 'Karnataka',
      isServiceable: true,
      serviceable: true,
      deliveryZone: zone,
      zone: zone,
      warehouseId: assignedWarehouse,
      warehouse: assignedWarehouse,
      warehouseName: whName,
      etaMinutes: eta,
      estimatedMinutes: eta,
      etaText: `Estimated delivery: ${eta} minutes`,
      dispatchStatus: 'ACTIVE_DISPATCH',
      deliveryModes: ['EXPRESS_60_MIN', 'SCHEDULED_SLOT'],
      freeDeliveryThreshold: 1000,
      message: `Delivery available in ~${eta} minutes to ${approxArea} from nearest hub.`
    };
  }

  // 4. Greater Bengaluru Rural / Metropolitan Corridor (562xxx)
  if (cleaned.startsWith('562')) {
    return {
      pincode: cleaned,
      locality: 'Bengaluru Rural Growth Corridor',
      cityName: 'Bengaluru Rural',
      city: 'Bengaluru Rural',
      state: 'Karnataka',
      isServiceable: true,
      serviceable: true,
      deliveryZone: 'OUTER_BLR',
      zone: 'OUTER_BLR',
      warehouseId: 'WH-BLR-05',
      warehouse: 'WH-BLR-05',
      warehouseName: 'Bengaluru Peripheral Logistics Dark Store',
      etaMinutes: 120,
      estimatedMinutes: 120,
      etaText: 'Estimated delivery: 120 minutes',
      dispatchStatus: 'SCHEDULED_DISPATCH',
      deliveryModes: ['SCHEDULED_SLOT'],
      freeDeliveryThreshold: 1000,
      message: 'Scheduled site delivery available in 120 minutes across Bengaluru Rural Corridor.'
    };
  }

  // 5. Outside Bengaluru (Non-serviceable)
  return {
    pincode: cleaned,
    locality: 'Outside Bengaluru Delivery Zone',
    cityName: 'Outside Bengaluru',
    city: 'Outside Bengaluru',
    state: 'India',
    isServiceable: false,
    serviceable: false,
    deliveryZone: 'NON_BLR',
    zone: 'NON_BLR',
    warehouseId: null,
    warehouse: null,
    warehouseName: null,
    etaMinutes: 0,
    estimatedMinutes: 0,
    etaText: 'Non-Serviceable Location',
    dispatchStatus: 'UNSERVICEABLE',
    deliveryModes: ['FREIGHT_INQUIRY'],
    freeDeliveryThreshold: 1000,
    message: `Pincode ${cleaned} is outside our Bengaluru delivery network. Buildora 60 currently serves all Bengaluru Urban & Metropolitan site locations.`
  };
}

export const AVAILABLE_COUPONS = [
  {
    code: 'BUILD60',
    title: 'First Order Discount',
    description: 'Flat ₹300 off on your first order above ₹2,500',
    discountType: 'FIXED' as const,
    discountValue: 300,
    minOrderValue: 2500,
    expiryDate: '2027-12-31'
  },
  {
    code: 'CONSTRUCT10',
    title: 'Site Special 10%',
    description: '10% discount up to ₹1,500 for orders above ₹10,000',
    discountType: 'PERCENTAGE' as const,
    discountValue: 10,
    minOrderValue: 10000,
    maxDiscount: 1500,
    expiryDate: '2027-12-31'
  },
  {
    code: 'BULKPRO20',
    title: 'Commercial Bulk Discount',
    description: 'Flat ₹2,500 off on large bulk orders above ₹35,000',
    discountType: 'FIXED' as const,
    discountValue: 2500,
    minOrderValue: 35000,
    expiryDate: '2027-12-31'
  }
];

export * from './seed-data.js';
export * from './category-filters.js';
export * from './category-attribute-templates.js';
export * from './category-field-schemas.js';
