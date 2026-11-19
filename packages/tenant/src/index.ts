// Multi-Tenant context management for BUILDORA 60

export interface TenantConfig {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  tagline?: string;
  isWhiteLabel: boolean;
  activeFeatures: string[];
}

export const DEFAULT_TENANT: TenantConfig = {
  id: 'buildora-master',
  name: 'BUILDORA 60',
  slug: 'buildora',
  primaryColor: '#1E3A8A',
  secondaryColor: '#EA580C',
  tagline: 'BUILD SMART. DELIVER FAST.',
  isWhiteLabel: false,
  activeFeatures: [
    'quick_commerce_60m',
    'scheduled_delivery',
    'bulk_quotations',
    'project_shopping',
    'material_estimator',
    'wallet_rewards',
    'razorpay_gateway'
  ]
};

export function resolveTenantFromHost(host?: string): TenantConfig {
  // Structure ready for subdomain / custom domain resolution
  return DEFAULT_TENANT;
}
