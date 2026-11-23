import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  BadRequestException,
  NotFoundException
} from '@nestjs/common';
import {
  VendorProfile,
  VendorProduct,
  VendorOrder,
  VendorSettlement,
  VendorNotification,
  VendorDashboardMetrics,
  BulkPriceTier
} from '@buildora/types';
import { SEED_PRODUCTS, MASTER_CATEGORIES, BENGALURU_WAREHOUSES } from '@buildora/constants';

// Initial Demo Vendor Profile
const DEFAULT_VENDOR_ID = 'vnd-apex-01';
const DEFAULT_TENANT_ID = 'tenant-buildora-blr';

let currentVendor: VendorProfile = {
  id: DEFAULT_VENDOR_ID,
  tenantId: DEFAULT_TENANT_ID,
  status: 'ACTIVE',
  rating: 4.8,
  productCount: 12,
  orderCount: 48,
  createdAt: '2026-01-10T09:00:00.000Z',
  updatedAt: new Date().toISOString(),
  businessInfo: {
    businessName: 'Apex Building Solutions Pvt Ltd',
    contactPerson: 'Vikramaditya Rao',
    phone: '9845012345',
    email: 'vendor.apex@buildora.com',
    businessType: 'PRIVATE_LIMITED',
    description: 'Premier authorized distributor of tier-1 cement, plumbing fittings, and architectural hardware across Karnataka.',
    logo: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=300&q=80',
    gstin: '29AABCB9876F1Z2',
    pan: 'AABCB9876F',
    businessRegNumber: 'U45200KA2020PTC123456',
    address: {
      building: 'Shed 14, Peenya Industrial Area',
      street: '4th Phase, 2nd Cross Road',
      area: 'Peenya',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560058',
      lat: 13.0285,
      lng: 77.5195
    },
    bankDetails: {
      accountHolderName: 'Apex Building Solutions Pvt Ltd',
      bankName: 'HDFC Bank',
      accountNumber: '50200049182341',
      ifsc: 'HDFC0000053',
      branch: 'Peenya Industrial Branch, Bengaluru',
      isVerified: true
    },
    categories: ['cement-concrete', 'tiling-tile-adhesives', 'cpvc-pipes-fittings', 'hinges-channels-handles'],
    storeName: 'Apex Direct Plant Depot',
    storeDescription: 'Direct plant certified building materials with guaranteed batch test certificates.',
    warehouseAddress: 'Plot 88, Peenya 2nd Stage, Bengaluru, Karnataka 560058',
    pickupPincode: '560058',
    assignedDarkStoreId: 'WH-BLR-04',
    dispatchCutoff: '18:00',
    preparationTimeMins: 30,
    documents: [
      { type: 'GST_CERTIFICATE', name: 'GST_Registration_Certificate.pdf', url: '/docs/gst.pdf', uploadedAt: '2026-01-10T10:00:00Z' },
      { type: 'PAN_CARD', name: 'Company_PAN_Card.pdf', url: '/docs/pan.pdf', uploadedAt: '2026-01-10T10:05:00Z' }
    ]
  }
};

// Seed Vendor Products derived from SEED_PRODUCTS
let vendorProducts: VendorProduct[] = SEED_PRODUCTS.slice(0, 12).map((p, idx) => ({
  id: `vp-${p.id}`,
  vendorId: DEFAULT_VENDOR_ID,
  tenantId: DEFAULT_TENANT_ID,
  name: p.name,
  slug: p.slug,
  sku: p.sku,
  brand: p.brand,
  brandSlug: p.brandSlug,
  category: p.category,
  categorySlug: p.categorySlug,
  subcategory: p.subcategory,
  subcategorySlug: p.subcategorySlug,
  description: p.description,
  shortDescription: p.shortDescription,
  images: p.images,
  price: p.price,
  mrp: p.mrp,
  discount: p.discount,
  unit: p.unit,
  packSize: p.packSize,
  gstRate: p.gstRate,
  rating: p.rating,
  reviewCount: p.reviewCount,
  inStock: p.inStock,
  stockCount: p.stockCount || 150,
  lowStockThreshold: 20,
  isBulkEligible: p.isBulkEligible,
  bulkPricing: p.bulkPricing || [
    { minQuantity: 10, discountPercentage: 5, unitPrice: Math.round(p.price * 0.95) },
    { minQuantity: 30, discountPercentage: 8, unitPrice: Math.round(p.price * 0.92) },
    { minQuantity: 60, discountPercentage: 12, unitPrice: Math.round(p.price * 0.88) }
  ],
  variants: p.variants,
  specifications: p.specifications || {},
  deliverySpeedAvailable: p.deliverySpeedAvailable,
  approvalStatus: idx === 11 ? 'PENDING_APPROVAL' : 'APPROVED',
  isActive: true,
  createdAt: '2026-01-15T10:00:00.000Z',
  updatedAt: new Date().toISOString()
}));

// Seed Vendor Orders
let vendorOrders: VendorOrder[] = [
  {
    id: 'vo-101',
    orderNumber: 'BLD-2026-8941',
    customerOrderId: 'ord-101',
    vendorId: DEFAULT_VENDOR_ID,
    tenantId: DEFAULT_TENANT_ID,
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    status: 'READY_FOR_DISPATCH',
    items: [
      {
        productId: 'prod-cem-1',
        sku: 'CEM-ULT-PPC-50KG',
        name: 'UltraTech Super Cement (PPC)',
        image: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=400&q=80',
        unitPrice: 395,
        quantity: 10,
        gstAmount: 864,
        totalAmount: 3950,
        commissionRate: 5,
        commissionAmount: 197.5,
        netPayout: 3752.5
      }
    ],
    subtotal: 3950,
    gstTotal: 864,
    commissionTotal: 197.5,
    netPayout: 3752.5,
    deliveryAddress: {
      id: 'addr-1',
      type: 'CONSTRUCTION_SITE',
      recipientName: 'Arjun Verma (Site Engineer)',
      mobile: '9876543210',
      building: 'Plot 42, Green Horizon Enclave',
      street: '14th Cross, 4th Main Road',
      area: 'Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
      isDefault: true
    },
    deliveryOption: 'ASAP_60',
    estimatedDispatchTime: 'Ready in 10 mins',
    timeline: [
      { status: 'NEW', title: 'Order Placed by Customer', timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString() },
      { status: 'ACCEPTED', title: 'Accepted by Vendor Depot', timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
      { status: 'PROCESSING', title: 'Loading & Pallet Packing', timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString() },
      { status: 'READY_FOR_DISPATCH', title: 'Material Ready at Peenya Depot Gate', timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString() }
    ]
  },
  {
    id: 'vo-102',
    orderNumber: 'BLD-2026-8920',
    customerOrderId: 'ord-102',
    vendorId: DEFAULT_VENDOR_ID,
    tenantId: DEFAULT_TENANT_ID,
    createdAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    status: 'DELIVERED',
    items: [
      {
        productId: 'prod-tile-1',
        sku: 'TIL-KAJ-GVT-600',
        name: 'Kajaria Double Charge Glazed Vitrified Tiles (2x2 ft)',
        image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80',
        unitPrice: 880,
        quantity: 5,
        gstAmount: 792,
        totalAmount: 4400,
        commissionRate: 6,
        commissionAmount: 264,
        netPayout: 4136
      }
    ],
    subtotal: 4400,
    gstTotal: 792,
    commissionTotal: 264,
    netPayout: 4136,
    deliveryAddress: {
      id: 'addr-2',
      type: 'HOME',
      recipientName: 'Suresh Kumar',
      mobile: '9845099887',
      building: 'Villa 18, Palm Meadows',
      street: 'Nallurahalli Road',
      area: 'Whitefield',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560066',
      isDefault: true
    },
    deliveryOption: 'SCHEDULED',
    estimatedDispatchTime: 'Delivered',
    timeline: [
      { status: 'NEW', title: 'Order Placed', timestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString() },
      { status: 'ACCEPTED', title: 'Accepted by Depot', timestamp: new Date(Date.now() - 170 * 60 * 1000).toISOString() },
      { status: 'DISPATCHED', title: 'Dispatched via EV Mini-Truck', timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString() },
      { status: 'DELIVERED', title: 'Delivered at Site Gate', timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString() }
    ]
  }
];

// Seed Settlements
let vendorSettlements: VendorSettlement[] = [
  {
    id: 'stl-2026-04',
    settlementNumber: 'SETTL-BLD-09241',
    vendorId: DEFAULT_VENDOR_ID,
    period: '11 Nov 2026 - 17 Nov 2026',
    orderCount: 22,
    grossRevenue: 98500,
    platformCommission: 4925,
    taxDeductions: 985,
    netPayable: 92590,
    status: 'PAID',
    paidAt: '2026-11-18T14:30:00Z',
    paymentReference: 'NEFT-HDFC-9128491024',
    createdAt: '2026-11-18T14:30:00Z'
  },
  {
    id: 'stl-2026-05',
    settlementNumber: 'SETTL-BLD-09242',
    vendorId: DEFAULT_VENDOR_ID,
    period: '18 Nov 2026 - 24 Nov 2026',
    orderCount: 14,
    grossRevenue: 54200,
    platformCommission: 2710,
    taxDeductions: 542,
    netPayable: 50948,
    status: 'PENDING',
    createdAt: '2026-11-23T10:00:00Z'
  }
];

// Seed Notifications
let vendorNotifications: VendorNotification[] = [
  {
    id: 'notif-1',
    vendorId: DEFAULT_VENDOR_ID,
    type: 'ORDER',
    title: 'New High-Value Order #BLD-2026-8941',
    message: 'Customer requested 60-min express dispatch for 10 bags of UltraTech PPC Cement.',
    read: false,
    actionUrl: '/orders',
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString()
  },
  {
    id: 'notif-2',
    vendorId: DEFAULT_VENDOR_ID,
    type: 'STOCK',
    title: 'Low Stock Alert: CPVC Hot & Cold Pipes',
    message: 'Current inventory has fallen below the safety threshold (12 units remaining).',
    read: false,
    actionUrl: '/inventory',
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
  },
  {
    id: 'notif-3',
    vendorId: DEFAULT_VENDOR_ID,
    type: 'SETTLEMENT',
    title: 'Payout Processed: ₹92,590 Credited',
    message: 'Settlement SETTL-BLD-09241 has been credited to your verified HDFC Bank account.',
    read: true,
    actionUrl: '/earnings',
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
  }
];

@Controller('api/v1/vendor')
export class VendorController {
  // ==========================================
  // 1. AUTHENTICATION & SESSION
  // ==========================================
  @Post('auth/login')
  login(@Body() body: { email: string; password?: string; otp?: string }) {
    if (!body.email) {
      throw new BadRequestException('Email or phone number is required.');
    }
    return {
      success: true,
      message: 'Vendor signed in successfully',
      token: 'jwt-vendor-token-buildora-60',
      vendor: currentVendor
    };
  }

  @Post('auth/register')
  register(@Body() body: any) {
    if (!body.businessName || !body.phone || !body.email) {
      throw new BadRequestException('Business name, phone, and email are required.');
    }
    currentVendor = {
      ...currentVendor,
      status: 'KYC_PENDING',
      businessInfo: {
        ...currentVendor.businessInfo,
        businessName: body.businessName,
        phone: body.phone,
        email: body.email,
        contactPerson: body.contactPerson || body.businessName
      }
    };
    return {
      success: true,
      message: 'Vendor registered successfully. Please complete KYC onboarding.',
      vendor: currentVendor
    };
  }

  @Get('auth/me')
  getProfile() {
    return {
      success: true,
      vendor: currentVendor
    };
  }

  @Post('auth/logout')
  logout() {
    return {
      success: true,
      message: 'Vendor logged out successfully'
    };
  }

  // ==========================================
  // 2. ONBOARDING
  // ==========================================
  @Get('onboarding')
  getOnboarding() {
    return {
      success: true,
      status: currentVendor.status,
      businessInfo: currentVendor.businessInfo,
      rejectionReason: currentVendor.rejectionReason
    };
  }

  @Put('onboarding')
  updateOnboarding(@Body() body: Partial<typeof currentVendor.businessInfo>) {
    currentVendor.businessInfo = {
      ...currentVendor.businessInfo,
      ...body
    };
    currentVendor.updatedAt = new Date().toISOString();
    return {
      success: true,
      message: 'Onboarding draft saved successfully',
      data: currentVendor.businessInfo
    };
  }

  @Post('onboarding/submit')
  submitOnboarding() {
    currentVendor.status = 'PENDING_APPROVAL';
    currentVendor.updatedAt = new Date().toISOString();
    return {
      success: true,
      message: 'Onboarding submitted for compliance review.',
      status: currentVendor.status
    };
  }

  // ==========================================
  // 3. DASHBOARD METRICS
  // ==========================================
  @Get('dashboard/metrics')
  getDashboardMetrics(): { success: boolean; data: VendorDashboardMetrics } {
    const totalProducts = vendorProducts.length;
    const activeProducts = vendorProducts.filter((p) => p.isActive && p.approvalStatus === 'APPROVED').length;
    const pendingApprovalProducts = vendorProducts.filter((p) => p.approvalStatus === 'PENDING_APPROVAL').length;
    const lowStockCount = vendorProducts.filter((p) => p.stockCount <= p.lowStockThreshold && p.stockCount > 0).length;
    const outOfStockCount = vendorProducts.filter((p) => p.stockCount === 0 || !p.inStock).length;

    const totalOrders = vendorOrders.length;
    const pendingOrders = vendorOrders.filter((o) => o.status === 'NEW' || o.status === 'ACCEPTED').length;
    const processingOrders = vendorOrders.filter((o) => o.status === 'PROCESSING' || o.status === 'READY_FOR_DISPATCH').length;
    const dispatchedOrders = vendorOrders.filter((o) => o.status === 'DISPATCHED').length;
    const deliveredOrders = vendorOrders.filter((o) => o.status === 'DELIVERED').length;

    const grossRevenue = vendorOrders.reduce((sum, o) => sum + o.subtotal, 0) + 152700;
    const netEarnings = vendorOrders.reduce((sum, o) => sum + o.netPayout, 0) + 143538;
    const pendingSettlement = vendorSettlements.filter((s) => s.status === 'PENDING').reduce((sum, s) => sum + s.netPayable, 0);
    const completedPayouts = vendorSettlements.filter((s) => s.status === 'PAID').reduce((sum, s) => sum + s.netPayable, 0);

    return {
      success: true,
      data: {
        totalProducts,
        activeProducts,
        pendingApprovalProducts,
        lowStockCount,
        outOfStockCount,
        totalOrders: totalOrders + 46,
        pendingOrders,
        processingOrders,
        dispatchedOrders,
        deliveredOrders: deliveredOrders + 46,
        grossRevenue,
        netEarnings,
        pendingSettlement,
        completedPayouts
      }
    };
  }

  @Get('dashboard/charts')
  getDashboardCharts() {
    return {
      success: true,
      revenueTrends: [
        { date: '17 Nov', revenue: 14200, orders: 4 },
        { date: '18 Nov', revenue: 18500, orders: 6 },
        { date: '19 Nov', revenue: 16800, orders: 5 },
        { date: '20 Nov', revenue: 22400, orders: 8 },
        { date: '21 Nov', revenue: 26900, orders: 9 },
        { date: '22 Nov', revenue: 31200, orders: 11 },
        { date: '23 Nov', revenue: 22700, orders: 7 }
      ],
      recentOrders: vendorOrders.slice(0, 5)
    };
  }

  // ==========================================
  // 4. PRODUCTS & VARIANTS
  // ==========================================
  @Get('products')
  getProducts(
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('search') search?: string
  ) {
    let prods = [...vendorProducts];

    if (category) {
      prods = prods.filter((p) => p.categorySlug === category);
    }
    if (status === 'ACTIVE') {
      prods = prods.filter((p) => p.isActive && p.approvalStatus === 'APPROVED');
    } else if (status === 'PENDING_APPROVAL') {
      prods = prods.filter((p) => p.approvalStatus === 'PENDING_APPROVAL');
    } else if (status === 'LOW_STOCK') {
      prods = prods.filter((p) => p.stockCount <= p.lowStockThreshold);
    } else if (status === 'OUT_OF_STOCK') {
      prods = prods.filter((p) => p.stockCount === 0 || !p.inStock);
    }

    if (search) {
      const q = search.toLowerCase();
      prods = prods.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
    }

    return {
      success: true,
      total: prods.length,
      data: prods
    };
  }

  @Get('products/:id')
  getProductById(@Param('id') id: string) {
    const prod = vendorProducts.find((p) => p.id === id || p.sku === id);
    if (!prod) {
      throw new NotFoundException(`Product ${id} not found in vendor catalog.`);
    }
    return {
      success: true,
      data: prod
    };
  }

  @Post('products')
  createProduct(@Body() body: Partial<VendorProduct>) {
    if (!body.name || !body.sku || !body.categorySlug || !body.price || !body.mrp) {
      throw new BadRequestException('Product name, SKU, category, price, and MRP are required.');
    }
    if (body.price > body.mrp) {
      throw new BadRequestException('Selling price cannot exceed MRP.');
    }

    const id = `vp-prod-${Date.now()}`;
    const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const newProd: VendorProduct = {
      id,
      vendorId: DEFAULT_VENDOR_ID,
      tenantId: DEFAULT_TENANT_ID,
      name: body.name,
      slug,
      sku: body.sku,
      brand: body.brand || 'Apex Certified',
      brandSlug: (body.brand || 'Apex Certified').toLowerCase().replace(/\s+/g, '-'),
      category: body.category || 'Civil & Interiors',
      categorySlug: body.categorySlug,
      subcategory: body.subcategory || body.categorySlug,
      subcategorySlug: body.subcategorySlug || body.categorySlug,
      description: body.description || '',
      shortDescription: body.shortDescription || '',
      images: body.images && body.images.length > 0 ? body.images : ['https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=400&q=80'],
      price: Number(body.price),
      mrp: Number(body.mrp),
      discount: Math.round(((Number(body.mrp) - Number(body.price)) / Number(body.mrp)) * 100),
      unit: body.unit || 'Piece',
      packSize: body.packSize || '1 Unit',
      gstRate: Number(body.gstRate) || 18,
      rating: 5.0,
      reviewCount: 0,
      inStock: (body.stockCount || 0) > 0,
      stockCount: Number(body.stockCount) || 50,
      lowStockThreshold: Number(body.lowStockThreshold) || 10,
      isBulkEligible: Boolean(body.isBulkEligible),
      bulkPricing: body.bulkPricing || [
        { minQuantity: 10, discountPercentage: 5, unitPrice: Math.round(Number(body.price) * 0.95) }
      ],
      variants: body.variants || [],
      specifications: body.specifications || {},
      deliverySpeedAvailable: body.deliverySpeedAvailable || ['ASAP_60', 'STANDARD'],
      approvalStatus: 'PENDING_APPROVAL',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    vendorProducts.unshift(newProd);
    return {
      success: true,
      message: 'Product submitted for review successfully.',
      data: newProd
    };
  }

  @Put('products/:id')
  updateProduct(@Param('id') id: string, @Body() body: Partial<VendorProduct>) {
    const idx = vendorProducts.findIndex((p) => p.id === id);
    if (idx === -1) {
      throw new NotFoundException(`Product ${id} not found.`);
    }

    if (body.price && body.mrp && body.price > body.mrp) {
      throw new BadRequestException('Selling price cannot exceed MRP.');
    }

    vendorProducts[idx] = {
      ...vendorProducts[idx],
      ...body,
      id,
      updatedAt: new Date().toISOString()
    };

    return {
      success: true,
      message: 'Product updated successfully',
      data: vendorProducts[idx]
    };
  }

  @Delete('products/:id')
  deleteProduct(@Param('id') id: string) {
    vendorProducts = vendorProducts.filter((p) => p.id !== id);
    return {
      success: true,
      message: 'Product removed from vendor catalog'
    };
  }

  // ==========================================
  // 5. BULK PRICING TIERS
  // ==========================================
  @Get('products/:id/bulk-pricing')
  getBulkPricing(@Param('id') id: string) {
    const prod = vendorProducts.find((p) => p.id === id);
    if (!prod) throw new NotFoundException('Product not found');
    return {
      success: true,
      productName: prod.name,
      basePrice: prod.price,
      bulkPricing: prod.bulkPricing || []
    };
  }

  @Put('products/:id/bulk-pricing')
  updateBulkPricing(
    @Param('id') id: string,
    @Body() body: { bulkPricing: BulkPriceTier[]; isBulkEligible?: boolean }
  ) {
    const prod = vendorProducts.find((p) => p.id === id);
    if (!prod) throw new NotFoundException('Product not found');

    // Validation
    for (const tier of body.bulkPricing || []) {
      if (tier.minQuantity < 2) {
        throw new BadRequestException('Minimum quantity must be 2 or greater.');
      }
      if (tier.unitPrice >= prod.price) {
        throw new BadRequestException(`Bulk unit price (₹${tier.unitPrice}) must be lower than base price (₹${prod.price}).`);
      }
    }

    prod.bulkPricing = body.bulkPricing;
    if (body.isBulkEligible !== undefined) {
      prod.isBulkEligible = body.isBulkEligible;
    }
    prod.updatedAt = new Date().toISOString();

    return {
      success: true,
      message: 'Bulk pricing tiers updated successfully',
      data: prod.bulkPricing
    };
  }

  // ==========================================
  // 6. INVENTORY & STOCK
  // ==========================================
  @Get('inventory')
  getInventory() {
    const items = vendorProducts.map((p) => ({
      productId: p.id,
      name: p.name,
      sku: p.sku,
      category: p.category,
      unit: p.unit,
      stockCount: p.stockCount,
      lowStockThreshold: p.lowStockThreshold,
      status: p.stockCount === 0 ? 'OUT_OF_STOCK' : p.stockCount <= p.lowStockThreshold ? 'LOW_STOCK' : 'IN_STOCK',
      warehouse: currentVendor.businessInfo.warehouseAddress || 'Peenya Central Hub'
    }));

    return {
      success: true,
      total: items.length,
      data: items
    };
  }

  @Post('inventory/adjust')
  adjustStock(@Body() body: { productId: string; adjustmentType: 'ADD' | 'SUBTRACT' | 'SET'; quantity: number; reason: string }) {
    const prod = vendorProducts.find((p) => p.id === body.productId);
    if (!prod) throw new NotFoundException('Product not found');

    const qty = Number(body.quantity);
    if (isNaN(qty) || qty < 0) {
      throw new BadRequestException('Valid adjustment quantity is required.');
    }

    if (body.adjustmentType === 'ADD') {
      prod.stockCount += qty;
    } else if (body.adjustmentType === 'SUBTRACT') {
      prod.stockCount = Math.max(0, prod.stockCount - qty);
    } else {
      prod.stockCount = qty;
    }

    prod.inStock = prod.stockCount > 0;
    prod.updatedAt = new Date().toISOString();

    return {
      success: true,
      message: `Stock updated for ${prod.name}. New count: ${prod.stockCount}`,
      data: {
        productId: prod.id,
        newStock: prod.stockCount,
        inStock: prod.inStock
      }
    };
  }

  // ==========================================
  // 7. ORDERS & FULFILLMENT
  // ==========================================
  @Get('orders')
  getOrders(@Query('status') status?: string) {
    let orders = [...vendorOrders];
    if (status) {
      orders = orders.filter((o) => o.status === status);
    }
    return {
      success: true,
      total: orders.length,
      data: orders
    };
  }

  @Get('orders/:id')
  getOrderById(@Param('id') id: string) {
    const order = vendorOrders.find((o) => o.id === id || o.orderNumber === id);
    if (!order) throw new NotFoundException('Order not found');
    return {
      success: true,
      data: order
    };
  }

  @Put('orders/:id/status')
  updateOrderStatus(
    @Param('id') id: string,
    @Body() body: { status: VendorOrder['status']; note?: string }
  ) {
    const order = vendorOrders.find((o) => o.id === id || o.orderNumber === id);
    if (!order) throw new NotFoundException('Order not found');

    order.status = body.status;
    order.timeline.push({
      status: body.status,
      title: `Status marked as ${body.status}`,
      description: body.note,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      message: `Order status updated to ${body.status}`,
      data: order
    };
  }

  // ==========================================
  // 8. DELIVERY & SETTINGS
  // ==========================================
  @Get('delivery/settings')
  getDeliverySettings() {
    return {
      success: true,
      warehouseAddress: currentVendor.businessInfo.warehouseAddress,
      pickupPincode: currentVendor.businessInfo.pickupPincode,
      assignedDarkStoreId: currentVendor.businessInfo.assignedDarkStoreId,
      assignedWarehouseName: BENGALURU_WAREHOUSES[currentVendor.businessInfo.assignedDarkStoreId || 'WH-BLR-04']?.name || 'Bengaluru West Dark Store',
      dispatchCutoff: currentVendor.businessInfo.dispatchCutoff,
      preparationTimeMins: currentVendor.businessInfo.preparationTimeMins
    };
  }

  @Put('delivery/settings')
  updateDeliverySettings(@Body() body: any) {
    currentVendor.businessInfo = {
      ...currentVendor.businessInfo,
      ...body
    };
    return {
      success: true,
      message: 'Delivery settings saved successfully',
      data: currentVendor.businessInfo
    };
  }

  // ==========================================
  // 9. SETTLEMENTS & FINANCIALS
  // ==========================================
  @Get('settlements')
  getSettlements() {
    return {
      success: true,
      data: vendorSettlements
    };
  }

  @Get('settlements/summary')
  getSettlementsSummary() {
    return {
      success: true,
      grossSales: 152700,
      platformCommission: 7635,
      taxDeducted: 1527,
      netEarnings: 143538,
      pendingPayout: 50948,
      completedPayout: 92590,
      bankAccount: currentVendor.businessInfo.bankDetails
    };
  }

  // ==========================================
  // 10. NOTIFICATIONS
  // ==========================================
  @Get('notifications')
  getNotifications() {
    return {
      success: true,
      unreadCount: vendorNotifications.filter((n) => !n.read).length,
      data: vendorNotifications
    };
  }

  @Put('notifications/:id/read')
  markNotificationRead(@Param('id') id: string) {
    const notif = vendorNotifications.find((n) => n.id === id);
    if (notif) notif.read = true;
    return { success: true };
  }

  @Put('notifications/read-all')
  markAllNotificationsRead() {
    vendorNotifications.forEach((n) => (n.read = true));
    return { success: true };
  }
}
