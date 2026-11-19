import { Controller, Get, Param } from '@nestjs/common';
import { dbStore } from '../../../database/store';

@Controller('api/v1')
export class CatalogueController {
  @Get('categories')
  getCategories() {
    return {
      success: true,
      data: dbStore.categories
    };
  }

  @Get('categories/:slug')
  getCategoryBySlug(@Param('slug') slug: string) {
    const category = dbStore.categories.find((c) => c.slug === slug);
    return {
      success: !!category,
      data: category
    };
  }

  @Get('brands')
  getBrands() {
    return {
      success: true,
      data: dbStore.brands
    };
  }

  @Get('brands/:slug')
  getBrandBySlug(@Param('slug') slug: string) {
    const brand = dbStore.brands.find((b) => b.slug === slug);
    return {
      success: !!brand,
      data: brand
    };
  }
}
