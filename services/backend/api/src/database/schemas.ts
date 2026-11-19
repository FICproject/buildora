// Mongoose Schemas and Models for BUILDORA 60

export interface TenantDocument {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  primaryColor: string;
  secondaryColor: string;
  isWhiteLabel: boolean;
  activeFeatures: string[];
  createdAt: Date;
}

export interface CustomerDocument {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email?: string;
  businessName?: string;
  gstin?: string;
  walletBalance: number;
  rewardPoints: number;
  createdAt: Date;
}

export interface ProductDocument {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  sku: string;
  brand: string;
  brandSlug: string;
  category: string;
  categorySlug: string;
  subcategory: string;
  subcategorySlug: string;
  description: string;
  images: string[];
  price: number;
  mrp: number;
  discount: number;
  unit: string;
  gstRate: number;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  stockCount: number;
  isBulkEligible: boolean;
  bulkPricing?: { minQuantity: number; discountPercentage: number; unitPrice: number }[];
  specifications: Record<string, string>;
  deliverySpeedAvailable: string[];
  createdAt: Date;
}

export interface OrderDocument {
  id: string;
  tenantId: string;
  orderNumber: string;
  customerId: string;
  status: string;
  items: any[];
  deliveryAddress: any;
  deliveryOption: string;
  paymentMethod: string;
  paymentStatus: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  subtotal: number;
  itemDiscount: number;
  couponDiscount: number;
  couponCode?: string;
  gstTotal: number;
  deliveryFee: number;
  walletUsed: number;
  grandTotal: number;
  isBusinessOrder: boolean;
  gstin?: string;
  companyName?: string;
  timeline: any[];
  deliveryPartner?: any;
  createdAt: Date;
}

export interface SupportTicketDocument {
  id: string;
  tenantId: string;
  ticketNumber: string;
  customerId: string;
  category: string;
  priority: string;
  subject: string;
  description: string;
  status: string;
  messages: any[];
  createdAt: Date;
}

export interface ContactInquiryDocument {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  createdAt: Date;
}

export interface BulkQuotationDocument {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  companyName: string;
  gstin?: string;
  location: string;
  pincode: string;
  notes: string;
  status: 'PENDING' | 'CONTACTED' | 'QUOTED' | 'CLOSED';
  createdAt: Date;
}
