import { Controller, Post, Body, Headers } from '@nestjs/common';
import { DEFAULT_TENANT_ID } from '../../vendors/controllers/vendor.controller';
import { CheckoutPricingInput, validateAndPriceCheckout } from '../checkout-pricing.util';

export type CheckoutValidatePayload = CheckoutPricingInput;

@Controller('api/v1/checkout')
export class CheckoutController {
  @Post('validate')
  validateCheckout(
    @Body() body: CheckoutValidatePayload,
    @Headers('x-tenant-id') tenantId?: string
  ) {
    const res = validateAndPriceCheckout(body, tenantId || DEFAULT_TENANT_ID);
    if (!res.success) {
      return {
        success: false,
        errors: res.errors,
      };
    }

    return {
      success: true,
      data: {
        summary: res.summary,
        validatedItems: res.validatedItems,
        coupon: res.coupon,
        deliverySpeed: body.deliverySpeed || 'ASAP_60',
        payableAmount: res.payableAmount,
      },
    };
  }
}
