import { Controller, Get, Headers, Param, Query } from '@nestjs/common';
import { dbStore } from '../../../database/store';
import { isProductCustomerVisible } from '../../products/controllers/products.controller';
import { taxonomyService } from '../services/taxonomy.service';

function buildTaxonomyData(tenantId?: string, includeHidden = false) {
  const pool = taxonomyService.getTenantPool(tenantId);
  const visibleProducts = dbStore.products.filter(isProductCustomerVisible);

  const mainCounts = new Map<string, number>();
  const childCounts = new Map<string, number>();
  const typeCounts = new Map<string, number>();

  for (const p of visibleProducts) {
    const resolved = taxonomyService.resolveAndValidateProductTaxonomy(p, {
      strictChildMatch: false,
      tenantId,
    });
    if (resolved.mainCategoryId) {
      mainCounts.set(resolved.mainCategoryId, (mainCounts.get(resolved.mainCategoryId) || 0) + 1);
    }
    if (resolved.childCategoryId) {
      childCounts.set(resolved.childCategoryId, (childCounts.get(resolved.childCategoryId) || 0) + 1);
    }
    if (resolved.productTypeId) {
      typeCounts.set(resolved.productTypeId, (typeCounts.get(resolved.productTypeId) || 0) + 1);
    }
  }

  const mainCategories = pool.mainCategories
    .filter((m) => includeHidden || m.isActive !== false)
    .map((main) => {
      const childCategories = pool.childCategories
        .filter((c) => c.mainCategoryId === main.id && (includeHidden || c.isActive !== false))
        .map((child) => {
          const productTypes = pool.productTypes
            .filter((pt) => pt.childCategoryId === child.id && (includeHidden || pt.isActive !== false))
            .map((pt) => {
              const count = typeCounts.get(pt.id) || 0;
              return {
                ...pt,
                categorySlug: child.slug,
                productCount: count,
                itemCount: count,
              };
            });
          const count = childCounts.get(child.id) || 0;
          return {
            ...child,
            mainCategorySlug: main.slug,
            mainCategoryName: main.name,
            productCount: count,
            itemCount: count,
            subcategories: productTypes,
            productTypes,
          };
        });

      const count = mainCounts.get(main.id) || 0;
      return {
        ...main,
        childCount: childCategories.length,
        productCount: count,
        itemCount: count,
        childCategories,
      };
    });

  const allChildren = mainCategories.flatMap((m) => m.childCategories);
  return { mainCategories, allChildren };
}

@Controller('api/v1')
export class CatalogueController {
  @Get('taxonomy')
  getTaxonomyTree(@Headers('x-tenant-id') tenantId?: string) {
    const { mainCategories, allChildren } = buildTaxonomyData(tenantId, false);
    const navMainCategories = mainCategories.filter((m) => m.showInNavigation !== false);
    const allProductTypes = allChildren.flatMap((c) => c.productTypes || []);
    return {
      success: true,
      data: {
        mainCategories: navMainCategories,
        allMainCategories: mainCategories,
        childCategories: allChildren,
        productTypes: allProductTypes,
        tree: navMainCategories,
        newLaunchCollections: taxonomyService.getNewLaunchCollections(tenantId, true),
        brands: dbStore.brands,
      },
    };
  }

  @Get('categories')
  getCategories(@Headers('x-tenant-id') tenantId?: string) {
    const { mainCategories, allChildren } = buildTaxonomyData(tenantId, false);
    return {
      success: true,
      data: allChildren,
      mainCategories,
    };
  }

  @Get('categories/:slug')
  getCategoryBySlug(
    @Param('slug') slug: string,
    @Headers('x-tenant-id') tenantId?: string
  ) {
    const needle = slug.toLowerCase();
    const { mainCategories, allChildren } = buildTaxonomyData(tenantId, false);

    // Match Child Category first
    const child = allChildren.find(
      (c) => c.slug.toLowerCase() === needle || c.id.toLowerCase() === needle
    );
    if (child) {
      const parentMain = mainCategories.find((m) => m.id === child.mainCategoryId);
      return {
        success: true,
        level: 'CHILD',
        data: {
          ...child,
          level: 'CHILD',
          mainCategory: parentMain
            ? { id: parentMain.id, name: parentMain.name, slug: parentMain.slug }
            : null,
        },
      };
    }

    // Also match Main Category directly (landing page shows products from all its Child Categories)
    const main = mainCategories.find(
      (m) => m.slug.toLowerCase() === needle || m.id.toLowerCase() === needle
    );
    if (main) {
      const allChildTypes = main.childCategories.flatMap((c) => c.productTypes || []);
      return {
        success: true,
        level: 'MAIN',
        data: {
          ...main,
          level: 'MAIN',
          subcategories: allChildTypes,
        },
      };
    }

    return {
      success: false,
      data: undefined,
    };
  }

  @Get('new-launches')
  getPromotionalNewLaunches(
    @Headers('x-tenant-id') tenantId?: string,
    @Query('collection') collectionSlug?: string
  ) {
    const collections = taxonomyService.getNewLaunchCollections(
      tenantId || 'tenant-buildora-blr',
      true
    );
    const activeCollection = collectionSlug
      ? collections.find((c) => c.slug === collectionSlug || c.id === collectionSlug) || collections[0]
      : collections[0];

    const visibleProducts = dbStore.products.filter(isProductCustomerVisible);
    const targetCollections = collectionSlug && activeCollection ? [activeCollection] : collections;
    const curatedIdSet = new Set(targetCollections.flatMap((c) => c.productIds || []));
    const matched = visibleProducts
      .filter((p) => (curatedIdSet.size > 0 ? curatedIdSet.has(p.id) || p.isNewLaunch : p.isNewLaunch))
      .map((p) => {
        const taxonomy = taxonomyService.resolveAndValidateProductTaxonomy(p, {
          strictChildMatch: false,
          tenantId,
        });
        return { ...p, ...taxonomy };
      });

    return {
      success: true,
      data: {
        collections,
        activeCollection: activeCollection || null,
        products: matched,
      },
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
