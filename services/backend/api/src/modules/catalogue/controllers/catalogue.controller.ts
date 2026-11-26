import { Controller, Get, Param } from '@nestjs/common';
import { resolveCanonicalCategoryHierarchy } from '@buildora/constants';
import { dbStore } from '../../../database/store';
import { isProductCustomerVisible } from '../../products/controllers/products.controller';

function buildEnrichedCategories() {
  const visibleProducts = dbStore.products.filter(isProductCustomerVisible);
  const mainCounts = new Map<string, number>();
  const subCounts = new Map<string, number>();

  for (const p of visibleProducts) {
    const h = resolveCanonicalCategoryHierarchy(
      p.categorySlug || (p as any).categoryId || p.category,
      p.subcategorySlug || (p as any).subcategoryId || p.subcategory
    );
    const catSlug = (h.categorySlug || p.categorySlug || '').toLowerCase();
    const subSlug = (h.subcategorySlug || p.subcategorySlug || '').toLowerCase();
    if (catSlug) {
      mainCounts.set(catSlug, (mainCounts.get(catSlug) || 0) + 1);
    }
    if (catSlug && subSlug) {
      const composite = `${catSlug}::${subSlug}`;
      subCounts.set(composite, (subCounts.get(composite) || 0) + 1);
    }
  }

  return dbStore.categories.map((cat) => {
    const catKey = cat.slug.toLowerCase();
    const count = mainCounts.get(catKey) || 0;
    return {
      ...cat,
      itemCount: count,
      productCount: count,
      subcategories: (cat.subcategories || []).map((sub) => {
        const subCount = subCounts.get(`${catKey}::${sub.slug.toLowerCase()}`) || 0;
        return {
          ...sub,
          categoryId: cat.id,
          categorySlug: cat.slug,
          itemCount: subCount,
          productCount: subCount,
        };
      }),
    };
  });
}

@Controller('api/v1')
export class CatalogueController {
  @Get('categories')
  getCategories() {
    return {
      success: true,
      data: buildEnrichedCategories()
    };
  }

  @Get('categories/:slug')
  getCategoryBySlug(@Param('slug') slug: string) {
    const needle = slug.toLowerCase();
    const category = buildEnrichedCategories().find(
      (c) => c.slug.toLowerCase() === needle || c.id.toLowerCase() === needle
    );
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
