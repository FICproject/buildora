import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Headers,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { requireCustomer } from '../../../common/customer-auth.util';
import {
  PlatformProductModel,
  PlatformReviewModel,
  platformPersistenceService,
} from '../../../database/platform-persistence.service';
import { platformNotificationService } from '../../notifications/platform-notification.service';
import {
  DEFAULT_VENDOR_ID,
  vendorProducts,
  vendorReviews,
} from '../../vendors/controllers/vendor.controller';
import { dbStore } from '../../../database/store';

@Controller('api/v1/products/:idOrSlug/reviews')
export class ReviewsController {
  @Get()
  getProductReviews(@Param('idOrSlug') idOrSlug: string) {
    const prod =
      dbStore.products.find((p) => p.id === idOrSlug || p.slug === idOrSlug) ||
      vendorProducts.find((vp) => vp.id === idOrSlug || vp.slug === idOrSlug);

    const list = vendorReviews.filter(
      (r) =>
        r.productId === idOrSlug ||
        (prod && (r.productId === prod.id || r.productId === `vp-${prod.id}` || r.productName === prod.name))
    );

    const averageRating =
      list.length > 0
        ? Number((list.reduce((sum, r) => sum + Number(r.rating || 5), 0) / list.length).toFixed(1))
        : prod?.rating || 4.8;

    return {
      success: true,
      data: {
        averageRating,
        totalCount: list.length,
        reviews: list,
      },
    };
  }

  @Post()
  async createProductReview(
    @Param('idOrSlug') idOrSlug: string,
    @Body() body: { rating: number; comment: string; title?: string; customerName?: string },
    @Headers('authorization') authHeader?: string
  ) {
    const cust = requireCustomer(authHeader);
    const prod =
      vendorProducts.find((vp) => vp.id === idOrSlug || vp.slug === idOrSlug || vp.id === `vp-${idOrSlug}`) ||
      (dbStore.products.find((p) => p.id === idOrSlug || p.slug === idOrSlug) as any);

    if (!prod) {
      throw new NotFoundException('Product not found');
    }

    const rating = Math.min(5, Math.max(1, Number(body.rating || 0)));
    if (!rating || !body.comment?.trim()) {
      throw new BadRequestException('Rating (1-5) and review comment are required.');
    }

    const vendorId = prod.vendorId || DEFAULT_VENDOR_ID;
    const rev: any = {
      id: `rev-${Date.now()}`,
      vendorId,
      customerId: cust?.sub || 'cust-verified',
      productId: prod.id,
      productName: prod.name,
      customerName: cust?.name || body.customerName || 'Verified Contractor',
      rating,
      title: body.title || 'Verified Site Material Review',
      comment: body.comment.trim(),
      isVerifiedPurchase: true,
      createdAt: new Date().toISOString(),
    };

    vendorReviews.unshift(rev);
    await platformPersistenceService.upsert(PlatformReviewModel, rev);

    // Recalculate product rating
    const prodReviews = vendorReviews.filter(
      (r) => r.productId === prod.id || r.productName === prod.name
    );
    const avg = Number(
      (prodReviews.reduce((s, r) => s + Number(r.rating || 5), 0) / prodReviews.length).toFixed(1)
    );
    prod.rating = avg;
    prod.reviewCount = prodReviews.length;
    await platformPersistenceService.upsert(PlatformProductModel, prod);

    const cp = dbStore.products.find((p) => p.id === prod.id || p.slug === prod.slug || p.sku === prod.sku);
    if (cp) {
      cp.rating = avg;
      cp.reviewCount = prodReviews.length;
    }

    await platformNotificationService.dispatch({
      recipientRole: 'VENDOR',
      recipientId: vendorId,
      type: 'PRODUCT',
      title: `New ${rating}★ Review on ${prod.name}`,
      message: body.comment.trim().slice(0, 120),
      severity: 'INFO',
      actionUrl: '/reviews',
      metadata: { reviewId: rev.id, productId: prod.id },
    });

    return {
      success: true,
      message: 'Review published successfully.',
      data: rev,
    };
  }
}
