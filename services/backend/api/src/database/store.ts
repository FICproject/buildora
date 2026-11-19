import {
  MASTER_CATEGORIES,
  MASTER_BRANDS,
  SEED_PRODUCTS,
  SEED_KNOWLEDGE_ARTICLES,
  SEED_FAQS,
  SERVICEABLE_PINCODES,
  AVAILABLE_COUPONS
} from '@buildora/constants';
import { Product, Order, SupportTicket, Category, Brand, Address, WalletTransaction } from '@buildora/types';

class DataStore {
  public categories: Category[] = [...MASTER_CATEGORIES];
  public brands: Brand[] = [...MASTER_BRANDS];
  public products: Product[] = [...SEED_PRODUCTS];
  public knowledgeArticles = [...SEED_KNOWLEDGE_ARTICLES];
  public faqs = [...SEED_FAQS];
  public pincodes = { ...SERVICEABLE_PINCODES };
  public coupons = [...AVAILABLE_COUPONS];

  public walletBalance: number = 1250;
  public pendingWalletBalance: number = 0;
  public walletTransactions: WalletTransaction[] = [
    {
      id: 'tx-1',
      referenceNumber: 'WTX-2026-98124',
      type: 'DEBIT',
      amount: 200,
      category: 'CHECKOUT',
      status: 'COMPLETED',
      description: 'Applied to Order #BLD-2026-8941',
      orderId: 'BLD-2026-8941',
      createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
      balanceAfter: 1250
    },
    {
      id: 'tx-2',
      referenceNumber: 'WTX-2026-98011',
      type: 'CREDIT',
      amount: 500,
      category: 'CASHBACK',
      status: 'COMPLETED',
      description: 'UltraTech Cement Promo Site Cashback',
      createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      balanceAfter: 1450
    },
    {
      id: 'tx-3',
      referenceNumber: 'WTX-2026-97992',
      type: 'CREDIT',
      amount: 950,
      category: 'TOPUP',
      status: 'COMPLETED',
      description: 'UPI Wallet Top-Up via Google Pay (Ref: 41298402)',
      createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
      balanceAfter: 950
    }
  ];

  public orders: Order[] = [
    {
      id: 'ord-101',
      orderNumber: 'BLD-2026-8941',
      createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
      status: 'OUT_FOR_DELIVERY',
      items: [
        {
          productId: 'prod-cem-1',
          sku: 'CEM-ULT-PPC-50KG',
          name: 'UltraTech Super Cement (PPC)',
          slug: 'ultratech-super-cement-ppc-50kg',
          brand: 'UltraTech Cement',
          image: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=400&q=80',
          unit: '50 kg Bag',
          unitPrice: 395,
          quantity: 10,
          gstAmount: 864,
          totalAmount: 3950
        }
      ],
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
        isDefault: true,
        isConstructionSite: true
      },
      deliveryOption: 'ASAP_60',
      estimatedDeliveryTime: 'Within 25 minutes',
      paymentMethod: 'RAZORPAY_UPI',
      paymentStatus: 'CAPTURED',
      subtotal: 3950,
      itemDiscount: 0,
      couponDiscount: 0,
      gstTotal: 864,
      deliveryFee: 0,
      walletUsed: 0,
      grandTotal: 3950,
      isBusinessOrder: true,
      gstin: '29AABCB1234F1Z8',
      companyName: 'Apex Infra Construction Ltd',
      timeline: [
        {
          status: 'ORDER_PLACED',
          title: 'Order Placed',
          description: 'Payment verified via Razorpay UPI.',
          timestamp: '35 mins ago',
          completed: true
        },
        {
          status: 'CONFIRMED',
          title: 'Inventory Reserved',
          description: 'Allocated from Indiranagar Dark Store (WH-BLR-01).',
          timestamp: '30 mins ago',
          completed: true
        },
        {
          status: 'PACKED',
          title: 'Materials Picked & Palletized',
          description: 'Barcode scanned and loaded onto delivery vehicle.',
          timestamp: '18 mins ago',
          completed: true
        },
        {
          status: 'OUT_FOR_DELIVERY',
          title: 'Out for Delivery',
          description: 'Driver Ramesh Kumar (KA-03-EZ-4412) en route.',
          timestamp: '8 mins ago',
          completed: true
        },
        {
          status: 'DELIVERED',
          title: 'Delivered',
          description: 'Unloaded at site gate.',
          timestamp: 'Pending',
          completed: false
        }
      ],
      deliveryPartner: {
        name: 'Ramesh Kumar',
        phone: '+91-9876543299',
        vehicleNumber: 'KA-03-EZ-4412 (Tata Ace EV)'
      }
    }
  ];

  public tickets: SupportTicket[] = [
    {
      id: 'tkt-1',
      ticketNumber: 'TKT-2026-4410',
      category: 'DELIVERY',
      orderId: 'BLD-2026-8941',
      priority: 'HIGH',
      subject: 'Request offloading assistance for 10 bags of cement',
      description: 'Our site gate has a narrow ramp. Kindly instruct driver to bring a trolley.',
      status: 'IN_PROGRESS',
      createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
      updatedAt: new Date(Date.now() - 10 * 60000).toISOString(),
      messages: [
        {
          sender: 'CUSTOMER',
          message: 'Our site gate has a narrow ramp. Kindly instruct driver to bring a trolley.',
          timestamp: '25 mins ago'
        },
        {
          sender: 'SUPPORT_AGENT',
          message: 'Hello Arjun, driver Ramesh Kumar has been notified and his vehicle is equipped with a tail-lift trolley.',
          timestamp: '10 mins ago'
        }
      ]
    }
  ];

  public contactInquiries: any[] = [];
  public bulkQuotations: any[] = [];
}

export const dbStore = new DataStore();
