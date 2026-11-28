import { calculateBulkDiscount, calculateCartSummary } from '@buildora/utils';
import { dbStore } from '../../database/store';
import { companyAdminDataService } from '../company-admin/services/company-admin-data.service';
import { isProductCustomerVisible } from '../products/controllers/products.controller';
import { DEFAULT_TENANT_ID, DEFAULT_VENDOR_ID, vendorProducts, vendorRecords } from '../vendors/controllers/vendor.controller';

export interface CheckoutPricingInput {
  items?: {
    productId: string;
    variantId?: string;
    quantity: number;
  }[];
  couponCode?: string | null;
  deliverySpeed?: 'ASAP_60' | 'EXPRESS_90' | 'SCHEDULED' | 'NEXT_DAY' | 'STANDARD';
  deliveryAddress?: {
    recipientName?: string;
    mobile?: string;
    building?: string;
    street?: string;
    area?: string;
    city?: string;
    state?: string;
    pincode?: string;
    type?: string;
    landmark?: string;
    deliveryInstructions?: string;
  };
  isBusinessOrder?: boolean;
  gstin?: string;
  companyName?: string;
  unloadingOptions?: {
    required: boolean;
    floor: number;
    hasLift: boolean;
    siteInstructions?: string;
  };
  walletBalanceToUse?: number;
  customerId?: string;
}

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

function resolveCatalogProduct(productId: string) {
  const cleanId = String(productId || '').trim();
  const custProd = dbStore.products.find(
    (p) => p.id === cleanId || `vp-${p.id}` === cleanId || p.id === cleanId.replace(/^vp-/, '')
  ) as any;
  const vendProd = vendorProducts.find(
    (vp) => vp.id === cleanId || vp.id === `vp-${cleanId}` || vp.id.replace(/^vp-/, '') === cleanId || (custProd && vp.sku === custProd.sku)
  ) as any;
  return { custProd, vendProd, primary: (custProd || vendProd) as any };
}

/**
 * Authoritatively validates cart items, stock, delivery address serviceability,
 * coupons, and recalculates all line prices and totals server-side.
 */
export function validateAndPriceCheckout(
  body: CheckoutPricingInput,
  tenantId: string = DEFAULT_TENANT_ID
) {
  const cleanTenant = tenantId || DEFAULT_TENANT_ID;
  const tenantCfg = companyAdminDataService.getTenantConfig(cleanTenant);
  const errors: string[] = [];

  if (!body.items || body.items.length === 0) {
    errors.push('Your cart is empty. Please add items to proceed.');
    return { success: false as const, errors };
  }

  const enrichedItems: any[] = [];
  for (const item of body.items) {
    const qty = Math.floor(Number(item.quantity || 0));
    if (qty <= 0 || !Number.isFinite(qty)) {
      errors.push('Quantity for all cart items must be at least 1.');
      continue;
    }

    const { custProd, vendProd, primary } = resolveCatalogProduct(item.productId);
    if (!primary || !isProductCustomerVisible(primary)) {
      errors.push(`Material with ID ${item.productId} is currently unavailable or not approved in catalog.`);
      continue;
    }

    const vendorId = primary.vendorId || vendProd?.vendorId || DEFAULT_VENDOR_ID;
    const vendor = vendorRecords.get(vendorId);
    if (vendor && vendor.status !== 'APPROVED' && (vendor.status as string) !== 'ACTIVE') {
      errors.push(`Supplier for '${primary.name}' is currently unavailable.`);
      continue;
    }

    const totalStock = Number(vendProd?.stockCount ?? custProd?.stockCount ?? 0);
    const reservedStock = Number(vendProd?.reservedStock ?? custProd?.reservedStock ?? 0);
    let availableStock = Math.max(0, totalStock - reservedStock);

    if (!primary.inStock || availableStock <= 0) {
      errors.push(`'${primary.name}' is currently out of stock at your local dispatch hub.`);
      continue;
    }

    let price = Number(primary.price || 0);
    let mrp = Number(primary.mrp || price);
    let sku = primary.sku;
    let name = primary.name;
    let unit = primary.unit;

    if (item.variantId) {
      const variant = (primary.variants || []).find((v: any) => v.id === item.variantId);
      if (!variant) {
        errors.push(`Selected option for '${primary.name}' was not found.`);
        continue;
      }
      if (!variant.inStock || (variant as any).isAvailable === false) {
        errors.push(`Selected option '${variant.name}' for '${primary.name}' is currently out of stock.`);
        continue;
      }
      price = Number(variant.price || price);
      mrp = Number(variant.mrp || price);
      sku = variant.sku || sku;
      name = `${primary.name} (${variant.name})`;
      unit = variant.name;
      availableStock = Math.min(availableStock, Number(variant.stock ?? availableStock));
    }

    if (qty > availableStock) {
      errors.push(`Requested quantity ${qty} for '${name}' exceeds available warehouse stock (${availableStock} units).`);
      continue;
    }

    const bulkDiscountPercentage = calculateBulkDiscount(qty, primary.bulkPricing);
    const effectiveUnitPrice = Math.round(price * (1 - bulkDiscountPercentage / 100));
    const totalAmount = Math.round(effectiveUnitPrice * qty);
    const gstRate = Number(primary.gstRate ?? 18);
    const gstAmount = Math.round(totalAmount * (gstRate / (100 + gstRate)));

    enrichedItems.push({
      productId: primary.id,
      vendorId,
      variantId: item.variantId,
      sku,
      name,
      categorySlug: primary.categorySlug,
      slug: primary.slug,
      brand: primary.brand,
      image: primary.images?.[0] || '',
      unit,
      price,
      unitPrice: effectiveUnitPrice,
      effectiveUnitPrice,
      mrp,
      gstRate,
      gstAmount,
      bulkDiscountPercentage,
      totalAmount,
      totalPrice: totalAmount,
      quantity: qty,
      bulkPricing: primary.bulkPricing,
    });
  }

  // Delivery Address & Serviceability validation
  if (!body.deliveryAddress) {
    errors.push('Delivery address is mandatory before proceeding to payment.');
  } else {
    const addr = body.deliveryAddress;
    if (!addr.recipientName || !addr.recipientName.trim()) {
      errors.push('Recipient contact name is required on the delivery address.');
    }
    if (!addr.mobile || addr.mobile.replace(/\D/g, '').length < 10) {
      errors.push('A valid 10-digit mobile number is required for site delivery dispatch coordination.');
    }
    if (!addr.building && !addr.street && !addr.area) {
      errors.push('Complete delivery address details are required.');
    }
    if (!addr.pincode || !addr.pincode.trim()) {
      errors.push('Delivery pincode is required.');
    } else {
      const pin = addr.pincode.trim();
      const pinCheck = companyAdminDataService.checkTenantPincodeServiceability(cleanTenant, pin);
      if (!pinCheck.isServiceable) {
        errors.push(pinCheck.message || `Pincode ${pin} is currently outside our delivery network.`);
      }
    }
  }

  // GSTIN validation
  if (body.isBusinessOrder && body.gstin) {
    const cleanGst = body.gstin.trim().toUpperCase();
    if (!GSTIN_REGEX.test(cleanGst)) {
      errors.push(`Invalid GSTIN format: '${cleanGst}'. GSTIN must be a 15-character alphanumeric tax identifier.`);
    }
    if (!body.companyName || !body.companyName.trim()) {
      errors.push('Registered company/business name is required when specifying a GSTIN for tax invoice.');
    }
  }

  // Coupon validation
  let validatedCoupon: any = null;
  if (body.couponCode) {
    const cCode = body.couponCode.trim().toUpperCase();
    const found = companyAdminDataService
      .getActiveCoupons(cleanTenant)
      .find((c: any) => c.code.toUpperCase() === cCode);
    if (!found) {
      errors.push(`Coupon '${cCode}' is invalid, inactive, or expired.`);
    } else {
      validatedCoupon = found;
    }
  }

  // Wallet balance verification
  let walletToUse = Math.max(0, Number(body.walletBalanceToUse || 0));
  if (walletToUse > 0 && body.customerId) {
    const custRec = companyAdminDataService.customers.get(body.customerId);
    const availableWallet = custRec ? Number(custRec.walletBalance || 0) : Number(dbStore.walletBalance || 0);
    if (walletToUse > availableWallet) {
      errors.push(`Requested wallet usage (₹${walletToUse}) exceeds available balance (₹${availableWallet}).`);
    }
  }

  if (errors.length > 0) {
    return { success: false as const, errors };
  }

  const summary = calculateCartSummary({
    items: enrichedItems,
    coupon: validatedCoupon,
    deliverySpeed: body.deliverySpeed || 'ASAP_60',
    unloadingOptions: body.unloadingOptions,
    walletBalanceToUse: walletToUse,
    freeDeliveryThreshold: Number(tenantCfg?.deliveryConfig?.freeShippingThreshold ?? 1000),
    standardDeliveryFee: Number(tenantCfg?.deliveryConfig?.defaultShippingCharge ?? 199),
    baseUnloadingFee: Number(tenantCfg?.deliveryConfig?.baseUnloadingFee ?? 199),
  });

  const payableAmount = summary.payableAmount !== undefined ? summary.payableAmount : summary.grandTotal;

  return {
    success: true as const,
    tenantCfg,
    validatedItems: enrichedItems,
    coupon: validatedCoupon,
    summary,
    payableAmount,
  };
}
