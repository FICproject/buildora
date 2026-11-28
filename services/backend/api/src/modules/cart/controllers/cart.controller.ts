import { Controller, Post, Get, Put, Delete, Body, Query, Headers } from '@nestjs/common';
import { calculateCartSummary } from '@buildora/utils';
import { dbStore } from '../../../database/store';
import { requireCustomer } from '../../../common/customer-auth.util';
import {
  PlatformCustomerCartModel,
  platformPersistenceService,
} from '../../../database/platform-persistence.service';
import { companyAdminDataService } from '../../company-admin/services/company-admin-data.service';
import { DEFAULT_TENANT_ID, vendorProducts } from '../../vendors/controllers/vendor.controller';

function resolveCartCatalogEntry(productId: string, variantId?: string) {
  const prod =
    (dbStore.products.find((p) => p.id === productId || p.slug === productId) as any) ||
    (vendorProducts.find((vp) => vp.id === productId || vp.slug === productId) as any);
  if (!prod || prod.isActive === false || prod.status === 'REJECTED' || prod.status === 'DRAFT') {
    return null;
  }
  const variant = variantId && Array.isArray(prod.variants)
    ? prod.variants.find((v: any) => v.id === variantId)
    : undefined;
  const maxStock = Number(variant?.stock ?? (prod as any).stock ?? prod.stockCount ?? 0);
  const effectiveUnitPrice = Number(
    variant?.sellingPrice ?? variant?.price ?? prod.sellingPrice ?? prod.price ?? 0
  );
  const mrp = Number(variant?.mrp ?? prod.mrp ?? effectiveUnitPrice);
  const unit = variant?.unit || variant?.size || prod.unit || 'Unit';
  return {
    productId: prod.id,
    variantId: variant?.id,
    sku: variant?.sku || prod.sku || prod.id,
    name: prod.name,
    slug: prod.slug,
    brand: prod.brand || 'Buildora Verified',
    image: Array.isArray(prod.images) && prod.images.length > 0 ? prod.images[0] : (prod.image || ''),
    unit,
    unitPrice: effectiveUnitPrice,
    effectiveUnitPrice,
    mrp,
    maxStock,
    category: prod.category || '',
    categorySlug: prod.categorySlug || '',
  };
}

function revalidateAndNormalizeCart(rawItems: any[]): {
  items: any[];
  adjustments: string[];
} {
  const mergedMap = new Map<string, any>();
  const adjustments: string[] = [];

  for (const raw of Array.isArray(rawItems) ? rawItems : []) {
    if (!raw || !raw.productId) continue;
    const key = `${raw.productId}::${raw.variantId || ''}`;
    const catalog = resolveCartCatalogEntry(raw.productId, raw.variantId);
    if (!catalog || catalog.maxStock <= 0) {
      adjustments.push(`${raw.name || raw.productId} is currently unavailable and was removed.`);
      continue;
    }

    const reqQty = Math.max(1, Math.floor(Number(raw.quantity || 1)));
    const existing = mergedMap.get(key);
    const combinedQty = (existing ? existing.quantity : 0) + reqQty;
    const finalQty = Math.min(combinedQty, catalog.maxStock);

    if (finalQty < combinedQty) {
      adjustments.push(`${catalog.name} quantity adjusted to available stock (${catalog.maxStock}).`);
    }
    if (
      typeof raw.effectiveUnitPrice === 'number' &&
      raw.effectiveUnitPrice > 0 &&
      Math.abs(raw.effectiveUnitPrice - catalog.effectiveUnitPrice) > 0.01 &&
      !adjustments.some((a) => a.includes(catalog.name) && a.includes('price'))
    ) {
      adjustments.push(`${catalog.name} unit price updated to ₹${catalog.effectiveUnitPrice}.`);
    }

    mergedMap.set(key, {
      ...catalog,
      quantity: finalQty,
      totalPrice: Number((finalQty * catalog.effectiveUnitPrice).toFixed(2)),
    });
  }

  return {
    items: Array.from(mergedMap.values()),
    adjustments,
  };
}

@Controller('api/v1')
export class CartController {
  @Post('cart/calculate')
  calculateCart(@Body() body: any, @Headers('x-tenant-id') tenantId?: string) {
    const cleanTenant = tenantId || DEFAULT_TENANT_ID;
    const tenantCfg = companyAdminDataService.getTenantConfig(cleanTenant);

    let coupon = body.coupon;
    if (typeof coupon === 'string') {
      coupon =
        companyAdminDataService
          .getActiveCoupons(cleanTenant)
          .find((c: any) => c.code.toUpperCase() === coupon.toUpperCase()) || null;
    }

    const summary = calculateCartSummary({
      items: body.items || [],
      coupon: coupon || null,
      deliverySpeed: body.deliverySpeed || 'ASAP_60',
      pincode: body.pincode,
      unloadingOptions: body.unloadingOptions,
      walletBalanceToUse: body.walletBalanceToUse || 0,
      freeDeliveryThreshold: Number(tenantCfg?.deliveryConfig?.freeShippingThreshold ?? 1000),
      standardDeliveryFee: Number(tenantCfg?.deliveryConfig?.defaultShippingCharge ?? 199),
      baseUnloadingFee: Number(tenantCfg?.deliveryConfig?.baseUnloadingFee ?? 199),
    });

    return {
      success: true,
      data: summary,
    };
  }

  @Get('coupons')
  listActiveCoupons(@Headers('x-tenant-id') tenantId?: string) {
    const cleanTenant = tenantId || DEFAULT_TENANT_ID;
    return {
      success: true,
      data: companyAdminDataService.getActiveCoupons(cleanTenant),
    };
  }

  @Post('coupons/validate')
  validateCoupon(
    @Body() body: { code: string; cartSubtotal?: number },
    @Headers('x-tenant-id') tenantId?: string
  ) {
    const cleanTenant = tenantId || DEFAULT_TENANT_ID;
    const code = (body.code || '').trim().toUpperCase();
    const coupon = dbStore.coupons.find(
      (c: any) => c.code.toUpperCase() === code && (!c.tenantId || c.tenantId === cleanTenant)
    ) as any;
    if (!coupon || coupon.isActive === false) {
      return {
        success: false,
        message: `Coupon code '${code}' is not valid or has been deactivated.`,
      };
    }

    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
      return {
        success: false,
        message: `Coupon code '${coupon.code}' has expired.`,
      };
    }

    const subtotal = body.cartSubtotal || 0;
    if (subtotal > 0 && subtotal < Number(coupon.minOrderValue || 0)) {
      return {
        success: false,
        message: `Coupon '${coupon.code}' requires a minimum order value of ₹${coupon.minOrderValue}. Current subtotal is ₹${subtotal}.`,
      };
    }

    return {
      success: true,
      message: `Coupon '${coupon.code}' validated successfully!`,
      data: coupon,
    };
  }

  @Get('serviceability/check')
  checkServiceability(
    @Query('pincode') pincode?: string,
    @Headers('x-tenant-id') tenantId?: string
  ) {
    if (!pincode) {
      return { success: false, message: 'Pincode is required' };
    }

    const cleanTenant = tenantId || DEFAULT_TENANT_ID;
    const cleanCode = pincode.trim();
    const result = companyAdminDataService.checkTenantPincodeServiceability(cleanTenant, cleanCode);

    return {
      success: result.isServiceable,
      data: result,
      ...result,
    };
  }

  @Post('estimators/calculate')
  calculateEstimator(@Body() body: { type: string; params: any }) {
    return {
      success: true,
      data: {
        calculatedAt: new Date().toISOString(),
        input: body,
      },
    };
  }

  // ========================================================
  // AUTHENTICATED SERVER-SIDE CUSTOMER CART & GUEST MERGE
  // ========================================================

  @Get('cart')
  getCustomerCart(@Headers('authorization') authHeader?: string) {
    const cust = requireCustomer(authHeader);
    const existing = dbStore.customerCarts.get(cust.sub) || [];
    const { items, adjustments } = revalidateAndNormalizeCart(existing);
    dbStore.customerCarts.set(cust.sub, items);
    return {
      success: true,
      data: {
        items,
        adjustments,
        itemCount: items.reduce((s, it) => s + Number(it.quantity || 0), 0),
      },
    };
  }

  @Put('cart')
  async saveCustomerCart(
    @Body() body: { items: any[] },
    @Headers('authorization') authHeader?: string
  ) {
    const cust = requireCustomer(authHeader);
    const { items, adjustments } = revalidateAndNormalizeCart(body?.items || []);
    dbStore.customerCarts.set(cust.sub, items);
    await platformPersistenceService.upsert(PlatformCustomerCartModel, {
      id: `cart-${cust.sub}`,
      customerId: cust.sub,
      items,
      updatedAt: new Date().toISOString(),
    });
    return {
      success: true,
      data: {
        items,
        adjustments,
        itemCount: items.reduce((s, it) => s + Number(it.quantity || 0), 0),
      },
    };
  }

  @Post('cart/merge')
  async mergeGuestCart(
    @Body() body: { guestItems?: any[]; items?: any[] },
    @Headers('authorization') authHeader?: string
  ) {
    const cust = requireCustomer(authHeader);
    const serverItems = dbStore.customerCarts.get(cust.sub) || [];
    const guestItems = Array.isArray(body?.guestItems)
      ? body.guestItems
      : Array.isArray(body?.items)
        ? body.items
        : [];

    const { items, adjustments } = revalidateAndNormalizeCart([...serverItems, ...guestItems]);
    dbStore.customerCarts.set(cust.sub, items);
    await platformPersistenceService.upsert(PlatformCustomerCartModel, {
      id: `cart-${cust.sub}`,
      customerId: cust.sub,
      items,
      updatedAt: new Date().toISOString(),
    });

    return {
      success: true,
      data: {
        items,
        adjustments,
        itemCount: items.reduce((s, it) => s + Number(it.quantity || 0), 0),
      },
    };
  }

  @Delete('cart')
  async clearCustomerCart(@Headers('authorization') authHeader?: string) {
    const cust = requireCustomer(authHeader);
    dbStore.customerCarts.set(cust.sub, []);
    await platformPersistenceService.upsert(PlatformCustomerCartModel, {
      id: `cart-${cust.sub}`,
      customerId: cust.sub,
      items: [],
      updatedAt: new Date().toISOString(),
    });
    return {
      success: true,
      data: { items: [] },
    };
  }
}
