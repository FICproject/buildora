import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { calculateCartSummary } from '@buildora/utils';
import { checkBengaluruServiceability } from '@buildora/constants';
import { dbStore } from '../../../database/store';

@Controller('api/v1')
export class CartController {
  @Post('cart/calculate')
  calculateCart(@Body() body: any) {
    let coupon = body.coupon;
    if (typeof coupon === 'string') {
      coupon = dbStore.coupons.find((c) => c.code.toUpperCase() === coupon.toUpperCase()) || null;
    }

    const summary = calculateCartSummary({
      items: body.items || [],
      coupon: coupon || null,
      deliverySpeed: body.deliverySpeed || 'ASAP_60',
      pincode: body.pincode,
      unloadingOptions: body.unloadingOptions,
      walletBalanceToUse: body.walletBalanceToUse || 0
    });

    return {
      success: true,
      data: summary
    };
  }

  @Post('coupons/validate')
  validateCoupon(@Body() body: { code: string; cartSubtotal?: number }) {
    const code = (body.code || '').trim().toUpperCase();
    const coupon = dbStore.coupons.find((c) => c.code.toUpperCase() === code);
    if (!coupon) {
      return {
        success: false,
        message: `Invalid coupon code '${code}'. Try BUILD60, CONSTRUCT10, or BULKPRO20.`
      };
    }

    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
      return {
        success: false,
        message: `Coupon code '${coupon.code}' has expired.`
      };
    }

    const subtotal = body.cartSubtotal || 0;
    if (subtotal > 0 && subtotal < coupon.minOrderValue) {
      return {
        success: false,
        message: `Coupon '${coupon.code}' requires a minimum order value of ₹${coupon.minOrderValue}. Current subtotal is ₹${subtotal}.`
      };
    }

    return {
      success: true,
      message: `Coupon '${coupon.code}' validated successfully!`,
      data: coupon
    };
  }

  @Get('serviceability/check')
  checkServiceability(@Query('pincode') pincode?: string) {
    if (!pincode) {
      return { success: false, message: 'Pincode is required' };
    }

    const cleanCode = pincode.trim();
    const result = checkBengaluruServiceability(cleanCode);

    return {
      success: result.isServiceable,
      data: result,
      ...result
    };
  }

  @Post('estimators/calculate')
  calculateEstimator(@Body() body: { type: string; params: any }) {
    // Estimator calculation API endpoint
    return {
      success: true,
      data: {
        calculatedAt: new Date().toISOString(),
        input: body
      }
    };
  }
}
