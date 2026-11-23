// Shared TypeScript definitions for BUILDORA 60

export type DeliverySpeed = 'ASAP_60' | 'EXPRESS_90' | 'SCHEDULED' | 'NEXT_DAY' | 'STANDARD';

export type OrderStatus =
  | 'ORDER_PLACED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_CONFIRMED'
  | 'PROCESSING'
  | 'CONFIRMED'
  | 'WAREHOUSE_ASSIGNED'
  | 'PICKING'
  | 'PACKED'
  | 'READY_FOR_DISPATCH'
  | 'DISPATCHED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURN_REQUESTED'
  | 'RETURNED'
  | 'REFUND_PROCESSING'
  | 'REFUNDED'
  | 'FAILED';

export type PaymentMethod = 'RAZORPAY_UPI' | 'RAZORPAY_CARD' | 'RAZORPAY_NETBANKING' | 'COD' | 'WALLET';

export type PaymentStatus = 'PENDING' | 'AUTHORIZED' | 'CAPTURED' | 'FAILED' | 'REFUNDED';

export type AddressType = 'HOME' | 'WORK' | 'CONSTRUCTION_SITE' | 'OTHER';

export type ProjectType =
  | 'NEW_HOUSE_CONSTRUCTION'
  | 'HOME_RENOVATION'
  | 'BATHROOM_RENOVATION'
  | 'KITCHEN_RENOVATION'
  | 'PAINTING'
  | 'ELECTRICAL_WORK'
  | 'PLUMBING'
  | 'FLOORING'
  | 'OTHER';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  image: string;
  banner?: string;
  description: string;
  itemCount?: number;
  featured?: boolean;
  subcategories: Subcategory[];
}

export interface Subcategory {
  id: string;
  name: string;
  slug: string;
  categorySlug: string;
  description?: string;
  image?: string;
  itemCount?: number;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string;
  banner?: string;
  description: string;
  featured?: boolean;
  categories: string[]; // category slugs
  productCount?: number;
}

export interface BulkPriceTier {
  minQuantity: number;
  discountPercentage: number;
  unitPrice: number;
}

export interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  attributes: Record<string, string>; // e.g., { "Bag Weight": "50 kg", "Grade": "OPC 53" }
  price: number;
  mrp: number;
  stock: number;
  inStock: boolean;
  image?: string;
}

export interface ProductFaq {
  question: string;
  answer: string;
}

export interface Product {
  id: string;
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
  shortDescription?: string;
  images: string[];
  price: number;
  mrp: number;
  discount: number;
  unit: string; // e.g. "50kg Bag", "Sheet", "Coil (90m)", "Litre", "Box"
  packSize?: string;
  gstRate: number; // e.g. 18 or 28
  rating: number;
  reviewCount: number;
  inStock: boolean;
  stockCount: number;
  isBulkEligible: boolean;
  bulkPricing?: BulkPriceTier[];
  variants?: ProductVariant[];
  specifications: Record<string, string>;
  categoryAttributes?: Record<string, any>;
  applications?: string[];
  installationTips?: string[];
  safetyInstructions?: string[];
  warranty?: string;
  certifications?: string[];
  faqs?: ProductFaq[];
  returnPolicy?: string;
  deliverySpeedAvailable: DeliverySpeed[];
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isTrending?: boolean;
  isDealOfTheDay?: boolean;
  isNewLaunch?: boolean;
}

export interface NewLaunchCategory {
  id: string;
  name: string;
  slug: string;
  masterCategorySlug: string;
  icon: string;
  image: string;
  description: string;
  badge?: string;
}

export interface CartItem {
  productId: string;
  variantId?: string;
  categorySlug?: string;
  sku: string;
  name: string;
  slug: string;
  brand: string;
  image: string;
  unit: string;
  price: number;
  mrp: number;
  gstRate: number;
  quantity: number;
  bulkDiscountPercentage: number;
  effectiveUnitPrice: number;
  totalPrice: number;
  maxStock: number;
}

export interface Coupon {
  code: string;
  title: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  expiryDate: string;
}

export interface Address {
  id: string;
  type: AddressType;
  recipientName: string;
  mobile: string;
  alternatePhone?: string;
  building: string;
  street: string;
  area: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  deliveryInstructions?: string;
  isDefault: boolean;
  isConstructionSite?: boolean;
  latitude?: number;
  longitude?: number;
  fullAddress?: string;
}

export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatarUrl?: string;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  gstin?: string;
  businessName?: string;
  walletBalance: number;
  rewardPoints: number;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  variantId?: string;
  sku: string;
  name: string;
  slug: string;
  brand: string;
  image: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  gstAmount: number;
  totalAmount: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: OrderStatus;
  items: OrderItem[];
  deliveryAddress: Address;
  deliveryOption: DeliverySpeed;
  estimatedDeliveryTime: string;
  actualDeliveryTime?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  subtotal: number;
  itemDiscount: number;
  couponDiscount: number;
  couponCode?: string;
  gstTotal: number;
  deliveryFee: number;
  handlingFee?: number;
  handlingBreakdown?: {
    type: string;
    title: string;
    amount: number;
    explanation: string;
  }[];
  unloadingFee?: number;
  unloadingOptions?: {
    required: boolean;
    floor: number;
    hasLift: boolean;
    siteInstructions?: string;
  };
  walletUsed: number;
  grandTotal: number;
  payableAmount?: number;
  isBusinessOrder: boolean;
  gstin?: string;
  companyName?: string;
  timeline: {
    status: OrderStatus;
    title: string;
    description: string;
    timestamp: string;
    completed: boolean;
  }[];
  deliveryPartner?: {
    name: string;
    phone: string;
    vehicleNumber: string;
  };
}

export interface ServiceabilityArea {
  pincode: string;
  city: string;
  state: string;
  serviceable: boolean;
  supportedSpeeds: DeliverySpeed[];
  estimatedMinutes: number;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  warehouseCode: string;
}

export interface WalletTransaction {
  id: string;
  referenceNumber: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string;
  category: 'CASHBACK' | 'REFUND' | 'CHECKOUT' | 'TOPUP' | 'PROMO';
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  orderId?: string;
  createdAt: string;
  balanceAfter: number;
}

export interface RewardTransaction {
  id: string;
  type: 'EARNED' | 'REDEEMED' | 'EXPIRED';
  points: number;
  description: string;
  orderId?: string;
  createdAt: string;
}

export interface ProjectMaterialItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  brand: string;
  unit: string;
  price: number;
  estimatedQuantity: number;
  totalCost: number;
  image: string;
}

export interface Project {
  id: string;
  title: string;
  type: ProjectType;
  location: string;
  pincode: string;
  startDate: string;
  budget: number;
  notes?: string;
  materials: ProjectMaterialItem[];
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  authorName: string;
  rating: number;
  title: string;
  comment: string;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  images?: string[];
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  category: 'ORDER' | 'PRODUCT' | 'PAYMENT' | 'DELIVERY' | 'REFUND' | 'ACCOUNT' | 'OTHER';
  orderId?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  messages: {
    sender: 'CUSTOMER' | 'SUPPORT_AGENT';
    message: string;
    timestamp: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeArticle {
  id: string;
  slug: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  readTimeMinutes: number;
  author: string;
  image: string;
  tags: string[];
  publishedAt: string;
}

export interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

// ========================================================
// VENDOR PORTAL TYPES & INTERFACES (BUILDORA 60)
// ========================================================

export type BulkPricingTier = BulkPriceTier;

export type VendorAccountStatus =
  | 'DRAFT'
  | 'REGISTERED'
  | 'PENDING_VERIFICATION'
  | 'KYC_PENDING'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'ACTIVE'
  | 'REJECTED'
  | 'SUSPENDED'
  | 'DISABLED';

export type VendorRole =
  | 'VENDOR_OWNER'
  | 'VENDOR_ADMIN'
  | 'CATALOG_MANAGER'
  | 'INVENTORY_MANAGER'
  | 'ORDER_MANAGER'
  | 'FINANCE_VIEWER';

export interface VendorBankDetails {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  branch: string;
  isVerified: boolean;
}

export interface VendorBusinessAddress {
  building: string;
  street: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  lat?: number;
  lng?: number;
}

export interface VendorBusinessInfo {
  businessName: string;
  contactPerson: string;
  phone: string;
  email: string;
  businessType: 'PROPRIETORSHIP' | 'PARTNERSHIP' | 'LLP' | 'PRIVATE_LIMITED' | 'PUBLIC_LIMITED';
  description?: string;
  logo?: string;
  gstin?: string;
  pan?: string;
  businessRegNumber?: string;
  address: VendorBusinessAddress;
  bankDetails: VendorBankDetails;
  categories: string[]; // category slugs from master catalog
  storeName: string;
  storeDescription?: string;
  warehouseAddress?: string;
  pickupPincode?: string;
  assignedDarkStoreId?: string;
  dispatchCutoff?: string;
  preparationTimeMins?: number;
  documents?: {
    type: string;
    name: string;
    url: string;
    uploadedAt: string;
  }[];
}

export interface VendorProfile {
  id: string;
  tenantId: string;
  businessInfo: VendorBusinessInfo;
  status: VendorAccountStatus;
  rejectionReason?: string;
  rating: number;
  productCount: number;
  orderCount: number;
  createdAt: string;
  updatedAt: string;
  // Convenience top-level mirrors
  storeName?: string;
  name?: string;
  email?: string;
  phone?: string;
  categories?: string[];
  business?: any;
  bankDetails?: any;
}

export interface VendorProduct {
  id: string;
  vendorId: string;
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
  subCategory?: string;
  description: string;
  shortDescription?: string;
  images: string[];
  price: number;
  mrp: number;
  discount: number;
  unit: string;
  packSize?: string;
  gstRate: number;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  stockCount: number;
  stock?: number;
  lowStockThreshold: number;
  isBulkEligible: boolean;
  bulkPricing?: BulkPriceTier[];
  variants?: ProductVariant[];
  specifications: Record<string, string>;
  deliverySpeedAvailable: DeliverySpeed[];
  approvalStatus: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  isActive: boolean;
  status?: 'ACTIVE' | 'DRAFT' | 'OUT_OF_STOCK';
  warehouseLocation?: string;
  createdAt: string;
  updatedAt: string;
}

export type VendorOrderStatus =
  | 'NEW'
  | 'ACCEPTED'
  | 'PROCESSING'
  | 'READY_FOR_DISPATCH'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED';

export interface VendorOrderItem {
  productId: string;
  sku: string;
  name: string;
  variantName?: string;
  image: string;
  unitPrice: number;
  quantity: number;
  gstAmount: number;
  totalAmount: number;
  commissionRate: number;
  commissionAmount: number;
  netPayout: number;
}

export interface VendorOrder {
  id: string;
  orderNumber: string;
  customerOrderId: string;
  vendorId: string;
  tenantId: string;
  createdAt: string;
  status: VendorOrderStatus;
  items: VendorOrderItem[];
  subtotal: number;
  gstTotal: number;
  commissionTotal: number;
  netPayout: number;
  deliveryAddress: Address;
  pickupAddress?: Address;
  deliveryOption: DeliverySpeed;
  estimatedDispatchTime?: string;
  totalAmount?: number;
  customerName?: string;
  customerPhone?: string;
  timeline: {
    status: VendorOrderStatus;
    title: string;
    description?: string;
    timestamp: string;
  }[];
}

export interface VendorSettlement {
  id: string;
  settlementNumber: string;
  vendorId: string;
  period: string;
  orderCount: number;
  grossRevenue: number;
  platformCommission: number;
  taxDeductions: number;
  netPayable: number;
  status: 'PENDING' | 'PROCESSING' | 'PAID';
  paidAt?: string;
  paymentReference?: string;
  createdAt: string;
  periodStart?: string;
  periodEnd?: string;
  grossAmount?: number;
  commission?: number;
  deductions?: number;
  netAmount?: number;
  utr?: string;
}

export interface VendorNotification {
  id: string;
  vendorId: string;
  type: 'ORDER' | 'STOCK' | 'PRODUCT_APPROVAL' | 'SETTLEMENT' | 'SYSTEM';
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}

export interface VendorDashboardMetrics {
  totalProducts: number;
  activeProducts: number;
  pendingApprovalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  dispatchedOrders: number;
  deliveredOrders: number;
  grossRevenue: number;
  netEarnings: number;
  pendingSettlement: number;
  completedPayouts: number;
}

