import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { calculateCartSummary } from '@buildora/utils';
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
      walletBalanceToUse: body.walletBalanceToUse || 0
    });

    return {
      success: true,
      data: summary
    };
  }

  @Get('serviceability/check')
  checkServiceability(@Query('pincode') pincode?: string) {
    if (!pincode) {
      return { success: false, message: 'Pincode is required' };
    }

    const cleanCode = pincode.trim();
    const info = dbStore.pincodes[cleanCode];

    if (info) {
      return {
        success: true,
        data: {
          pincode: cleanCode,
          city: info.city,
          state: info.state,
          serviceable: true,
          estimatedMinutes: info.etaMinutes,
          warehouse: info.warehouse,
          freeDeliveryThreshold: 1999
        }
      };
    } else {
      return {
        success: true,
        data: {
          pincode: cleanCode,
          serviceable: false,
          message: 'Pincode currently outside 60-minute quick-commerce delivery zone.'
        }
      };
    }
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
