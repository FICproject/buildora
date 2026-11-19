// Shared Configuration for BUILDORA 60

export const APP_CONFIG = {
  name: 'BUILDORA 60',
  tagline: 'BUILD SMART. DELIVER FAST.',
  version: '1.0.0',
  defaultTenantId: 'buildora-master',
  defaultCurrency: 'INR',
  currencySymbol: '₹',
  contact: {
    email: 'support@buildora.com',
    phone: '1800-60-BUILD',
    whatsapp: '+91-9876543210',
    addressPlaceholder: 'BUILDORA 60 Technologies Pvt Ltd, Outer Ring Road, Tech Corridor, Bengaluru - 560103, Karnataka, India'
  },
  features: {
    enableAsapDelivery: true,
    enableScheduledDelivery: true,
    enableGstBilling: true,
    enableWallet: true,
    enableRewards: true,
    enableMaterialEstimator: true,
    enableBulkQuotation: true,
    enableProjectShopping: true,
    enableRealTimeTracking: true
  },
  deliveryThresholds: {
    freeDeliveryAbove: 1999,
    standardDeliveryFee: 99,
    priorityAsapFee: 149,
    asapPrioritySupplementAboveThreshold: 49
  }
};
