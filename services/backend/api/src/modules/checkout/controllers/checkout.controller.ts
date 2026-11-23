import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { calculateCartSummary } from '@buildora/utils';
import { checkBengaluruServiceability } from '@buildora/constants';
import { dbStore } from '../../../database/store';

export interface CheckoutValidatePayload {
  items: {
    productId: string;
    variantId?: string;
    quantity: number;
  }[];
  couponCode?: string | null;
  deliverySpeed?: 'ASAP_60' | 'EXPRESS_90' | 'SCHEDULED' | 'NEXT_DAY' | 'STANDARD';
  deliveryAddress?: {
    recipientName: string;
    mobile: string;
    building: string;
    street: string;
    area: string;
    city: string;
    state: string;
    pincode: string;
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
}

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

@Controller('api/v1/checkout')
export class CheckoutController {
  @Post('validate')
  validateCheckout(@Body() body: CheckoutValidatePayload) {
    const errors: string[] = [];

    // 1. Validate Cart Items
    if (!body.items || body.items.length === 0) {
      errors.push('Your cart is empty. Please add items to proceed.');
      return { success: false, errors };
    }

    // 2. Validate Product Stock & Prices against master dbStore
    const enrichedItems: any[] = [];
    for (const item of body.items) {
      const prod = dbStore.products.find((p) => p.id === item.productId);
      if (!prod) {
        errors.push(`Material with ID ${item.productId} was not found in our live dark store catalogue.`);
        continue;
      }

      if (!prod.inStock) {
        errors.push(`'${prod.name}' is currently out of stock at your local dispatch hub.`);
        continue;
      }

      let price = prod.price;
      let mrp = prod.mrp;
      let sku = prod.sku;
      let name = prod.name;
      let unit = prod.unit;
      let availableStock = prod.stockCount;

      if (item.variantId) {
        const variant = (prod.variants || []).find((v) => v.id === item.variantId);
        if (!variant) {
          errors.push(`Selected option for '${prod.name}' was not found.`);
          continue;
        }
        if (!variant.inStock) {
          errors.push(`Selected option '${variant.name}' for '${prod.name}' is currently out of stock.`);
          continue;
        }
        price = variant.price;
        mrp = variant.mrp;
        sku = variant.sku;
        name = `${prod.name} (${variant.name})`;
        unit = variant.name;
        availableStock = variant.stock;
      }

      if (item.quantity > availableStock) {
        errors.push(`Requested quantity ${item.quantity} for '${name}' exceeds available warehouse stock (${availableStock} units).`);
        continue;
      }

      enrichedItems.push({
        productId: prod.id,
        variantId: item.variantId,
        sku,
        name,
        categorySlug: prod.categorySlug,
        slug: prod.slug,
        brand: prod.brand,
        image: prod.images[0] || '',
        unit,
        price,
        mrp,
        gstRate: prod.gstRate,
        quantity: item.quantity,
        bulkPricing: prod.bulkPricing
      });
    }

    // 3. Validate Delivery Address & Pincode Serviceability
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
      if (!addr.building || !addr.street) {
        errors.push('Complete building name/number and street address are required.');
      }
      if (!addr.pincode || !addr.pincode.trim()) {
        errors.push('Delivery pincode is required.');
      } else {
        const pin = addr.pincode.trim();
        const pinCheck = checkBengaluruServiceability(pin);
        if (!pinCheck.isServiceable) {
          errors.push(pinCheck.message || `Pincode ${pin} is outside our Bengaluru delivery network. Please select an eligible Bengaluru site address.`);
        }
      }
    }

    // 4. Validate GSTIN (if business order)
    if (body.isBusinessOrder && body.gstin) {
      const cleanGst = body.gstin.trim().toUpperCase();
      if (!GSTIN_REGEX.test(cleanGst)) {
        errors.push(`Invalid GSTIN format: '${cleanGst}'. GSTIN must be a 15-character alphanumeric tax identifier.`);
      }
      if (!body.companyName || !body.companyName.trim()) {
        errors.push('Registered company/business name is required when specifying a GSTIN for tax invoice.');
      }
    }

    // 5. Validate Coupon
    let validatedCoupon = null;
    if (body.couponCode) {
      const cCode = body.couponCode.trim().toUpperCase();
      const found = dbStore.coupons.find((c) => c.code.toUpperCase() === cCode);
      if (!found) {
        errors.push(`Coupon '${cCode}' is invalid or expired.`);
      } else if (found.expiryDate && new Date(found.expiryDate) < new Date()) {
        errors.push(`Coupon '${cCode}' has expired.`);
      } else {
        validatedCoupon = found;
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        errors
      };
    }

    // 6. Recalculate bill summary server-side
    const summary = calculateCartSummary({
      items: enrichedItems,
      coupon: validatedCoupon,
      deliverySpeed: body.deliverySpeed || 'ASAP_60',
      unloadingOptions: body.unloadingOptions,
      walletBalanceToUse: body.walletBalanceToUse || 0
    });

    return {
      success: true,
      data: {
        summary,
        validatedItems: enrichedItems,
        coupon: validatedCoupon,
        deliverySpeed: body.deliverySpeed || 'ASAP_60',
        payableAmount: summary.payableAmount || summary.grandTotal
      }
    };
  }
}
