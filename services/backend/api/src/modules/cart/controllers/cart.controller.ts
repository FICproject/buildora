import { Controller, Post, Get, Body, Query, Headers } from '@nestjs/common';
import { calculateCartSummary } from '@buildora/utils';
import { dbStore } from '../../../database/store';
import { companyAdminDataService } from '../../company-admin/services/company-admin-data.service';
import { DEFAULT_TENANT_ID } from '../../vendors/controllers/vendor.controller';

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
}
