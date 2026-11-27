import { Controller, Get, Headers, NotFoundException, Param, Query } from '@nestjs/common';
import { LEGACY_CATEGORY_SLUG_ALIASES } from '@buildora/constants';
import { dbStore } from '../../../database/store';
import { isProductCustomerVisible } from '../../products/controllers/products.controller';
import { taxonomyService } from '../services/taxonomy.service';
import { companyAdminDataService } from '../../company-admin/services/company-admin-data.service';
import { vendorPromotions } from '../../vendors/controllers/vendor.controller';

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

function resolveCustomerProductsWithTaxonomy(tenantId?: string) {
  const visibleProducts = dbStore.products.filter(isProductCustomerVisible);
  return visibleProducts.map((p) => {
    const taxonomy = taxonomyService.resolveAndValidateProductTaxonomy(p, {
      strictChildMatch: false,
      tenantId,
    });
    return { ...p, ...taxonomy };
  });
}

function buildHydratedNewLaunchCollections(tenantId?: string, preResolvedProducts?: any[]) {
  const collections = taxonomyService.getNewLaunchCollections(
    tenantId || 'tenant-buildora-blr',
    true
  );
  const resolvedProducts = preResolvedProducts || resolveCustomerProductsWithTaxonomy(tenantId);

  return collections.map((col) => {
    const curatedSet = new Set(col.productIds || []);
    const mappings = (col.categoryMappings || []).map((m) => {
      const count = resolvedProducts.filter(
        (p) =>
          (m.childCategoryId && (p.productTypeId === m.childCategoryId || p.subcategoryId === m.childCategoryId)) ||
          (m.childCategorySlug && (p.productTypeSlug === m.childCategorySlug || p.subcategorySlug === m.childCategorySlug))
      ).length;
      return { ...m, productCount: count };
    });
    const mappedTypeIds = new Set(mappings.filter((m) => m.childCategoryId).map((m) => m.childCategoryId!));
    const colProducts = resolvedProducts.filter(
      (p) => curatedSet.has(p.id) || (p.productTypeId && mappedTypeIds.has(p.productTypeId))
    );
    return {
      ...col,
      categoryMappings: mappings,
      productCount: colProducts.length,
    };
  });
}

@Controller('api/v1')
export class CatalogueController {
  @Get('taxonomy')
  getTaxonomyTree(@Headers('x-tenant-id') tenantId?: string) {
    const cleanTenant = tenantId || 'tenant-buildora-blr';
    const { mainCategories, allChildren } = buildTaxonomyData(cleanTenant, false);
    const navMainCategories = mainCategories.filter((m) => m.showInNavigation !== false);
    const desktopNavigation = taxonomyService.getPublishedDesktopNavigation(cleanTenant, false);
    const publishMetadata = taxonomyService.getPublishMetadata(cleanTenant);
    const allProductTypes = allChildren.flatMap((c) => c.productTypes || []);
    const navigationSections = navMainCategories.map((section) => ({
      id: section.id,
      name: section.name,
      slug: section.slug,
      sortOrder: section.sortOrder,
      mainCategories: (section.childCategories || []).map((mainCat) => ({
        id: mainCat.id,
        name: mainCat.name,
        slug: mainCat.slug,
        sortOrder: mainCat.sortOrder,
        departmentId: section.id,
        departmentSlug: section.slug,
        departmentName: section.name,
        productCount: mainCat.productCount,
        childCategories: (mainCat.productTypes || mainCat.subcategories || []).map((childCat) => ({
          id: childCat.id,
          name: childCat.name,
          slug: childCat.slug,
          sortOrder: childCat.sortOrder,
          parentMainSlug: mainCat.slug,
          parentMainName: mainCat.name,
          productCount: childCat.productCount,
        })),
      })),
    }));
    return {
      success: true,
      data: {
        mainCategories: navMainCategories,
        allMainCategories: mainCategories,
        childCategories: allChildren,
        productTypes: allProductTypes,
        navigationSections,
        desktopNavigation,
        publishMetadata,
        tree: navMainCategories,
        newLaunchCollections: buildHydratedNewLaunchCollections(cleanTenant),
        brands: dbStore.brands,
      },
    };
  }

  @Get('navigation')
  getDesktopNavigation(@Headers('x-tenant-id') tenantId?: string) {
    const cleanTenant = tenantId || 'tenant-buildora-blr';
    return {
      success: true,
      data: taxonomyService.getPublishedDesktopNavigation(cleanTenant, false),
      metadata: taxonomyService.getPublishMetadata(cleanTenant),
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
    const rawNeedle = slug.toLowerCase();
    const needle = LEGACY_CATEGORY_SLUG_ALIASES[rawNeedle] || rawNeedle;
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
    @Query('collection') collectionSlug?: string,
    @Query('child') childNeedle?: string,
    @Query('search') search?: string
  ) {
    const cleanTenant = tenantId || 'tenant-buildora-blr';
    const resolvedProducts = resolveCustomerProductsWithTaxonomy(cleanTenant);
    const collections = buildHydratedNewLaunchCollections(cleanTenant, resolvedProducts);

    let activeCollection = collectionSlug
      ? collections.find(
          (c) =>
            c.slug.toLowerCase() === collectionSlug.toLowerCase() ||
            c.id.toLowerCase() === collectionSlug.toLowerCase()
        ) || null
      : null;

    if (collectionSlug && !activeCollection) {
      return {
        success: true,
        data: {
          collections,
          activeCollection: null,
          shortcuts: [],
          activeShortcut: null,
          products: [],
        },
      };
    }

    const targetCollections = activeCollection ? [activeCollection] : collections;
    const allShortcuts = targetCollections.flatMap((c) => c.categoryMappings || []);
    const cleanChild = childNeedle?.trim().toLowerCase();
    const matchedShortcut = cleanChild
      ? allShortcuts.find(
          (m) =>
            m.id.toLowerCase() === cleanChild ||
            (m.childCategoryId || '').toLowerCase() === cleanChild ||
            (m.childCategorySlug || '').toLowerCase() === cleanChild ||
            m.displayLabel.trim().toLowerCase() === cleanChild
        ) || null
      : null;

    const curatedIdSet = new Set(targetCollections.flatMap((c) => c.productIds || []));
    const allowedTypeIds = new Set(
      (matchedShortcut ? [matchedShortcut] : allShortcuts)
        .filter((m) => m.childCategoryId)
        .map((m) => m.childCategoryId!)
    );

    let matched = resolvedProducts.filter((p) => {
      if (matchedShortcut) {
        return Boolean(matchedShortcut.childCategoryId && p.productTypeId === matchedShortcut.childCategoryId);
      }
      if (activeCollection) {
        return curatedIdSet.has(p.id) || Boolean(p.productTypeId && allowedTypeIds.has(p.productTypeId));
      }
      return (
        p.isNewLaunch ||
        curatedIdSet.has(p.id) ||
        Boolean(p.productTypeId && allowedTypeIds.has(p.productTypeId))
      );
    });

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      matched = matched.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.childCategoryName?.toLowerCase().includes(q) ||
          p.productTypeName?.toLowerCase().includes(q)
      );
    }

    return {
      success: true,
      data: {
        collections,
        activeCollection,
        shortcuts: activeCollection ? activeCollection.categoryMappings || [] : [],
        activeShortcut: matchedShortcut,
        products: matched,
      },
    };
  }

  @Get('new-launches/:slug')
  getNewLaunchCollectionBySlug(
    @Param('slug') slug: string,
    @Headers('x-tenant-id') tenantId?: string,
    @Query('child') childNeedle?: string,
    @Query('search') search?: string
  ) {
    const cleanTenant = tenantId || 'tenant-buildora-blr';
    const resolvedProducts = resolveCustomerProductsWithTaxonomy(cleanTenant);
    const collections = buildHydratedNewLaunchCollections(cleanTenant, resolvedProducts);
    const collection = collections.find(
      (c) => c.slug.toLowerCase() === slug.toLowerCase() || c.id.toLowerCase() === slug.toLowerCase()
    );
    if (!collection) {
      throw new NotFoundException(`New Launches collection "${slug}" not found or unpublished.`);
    }

    const res = this.getPromotionalNewLaunches(cleanTenant, collection.slug, childNeedle, search);
    return {
      success: true,
      data: {
        collection,
        collections,
        shortcuts: collection.categoryMappings || [],
        activeShortcut: res.data.activeShortcut,
        products: res.data.products,
      },
    };
  }

  @Get('brands')
  getBrands(@Headers('x-tenant-id') tenantId?: string) {
    const cleanTenant = tenantId || 'tenant-buildora-blr';
    const list = dbStore.brands.filter(
      (b: any) => (!b.tenantId || b.tenantId === cleanTenant) && b.isActive !== false
    );
    return {
      success: true,
      data: list,
    };
  }

  @Get('brands/:slug')
  getBrandBySlug(@Param('slug') slug: string, @Headers('x-tenant-id') tenantId?: string) {
    const cleanTenant = tenantId || 'tenant-buildora-blr';
    const brand = dbStore.brands.find(
      (b: any) =>
        b.slug === slug &&
        b.isActive !== false &&
        (!b.tenantId || b.tenantId === cleanTenant)
    );
    return {
      success: !!brand,
      data: brand,
    };
  }

  @Get('config/store')
  getPublicStoreConfig(@Headers('x-tenant-id') tenantId?: string) {
    const cleanTenant = tenantId || 'tenant-buildora-blr';
    return {
      success: true,
      data: companyAdminDataService.getPublicStoreConfig(cleanTenant),
    };
  }

  @Get('storefront/config')
  getStorefrontConfigAlias(@Headers('x-tenant-id') tenantId?: string) {
    const cleanTenant = tenantId || 'tenant-buildora-blr';
    return {
      success: true,
      data: companyAdminDataService.getPublicStoreConfig(cleanTenant),
    };
  }

  @Get('filters')
  getPublicFilters(
    @Headers('x-tenant-id') tenantId?: string,
    @Query('category') category?: string,
    @Query('subcategory') subcategory?: string
  ) {
    const cleanTenant = tenantId || 'tenant-buildora-blr';
    const rawNeedle = (category || '').trim().toLowerCase();
    const canonicalSlug = LEGACY_CATEGORY_SLUG_ALIASES[rawNeedle] || rawNeedle;
    const { mainCategories, allChildren } = buildTaxonomyData(cleanTenant, false);
    const matchedChild = canonicalSlug
      ? allChildren.find((c) => c.slug.toLowerCase() === canonicalSlug || c.id.toLowerCase() === rawNeedle)
      : undefined;
    const matchedMain = !matchedChild && canonicalSlug
      ? mainCategories.find((m) => m.slug.toLowerCase() === canonicalSlug || m.id.toLowerCase() === rawNeedle)
      : undefined;

    const attributes = companyAdminDataService.attributes.filter(
      (a) =>
        (!a.tenantId || a.tenantId === cleanTenant) &&
        a.isFilterable !== false &&
        (!category ||
          a.categoryName?.toLowerCase() === category.toLowerCase() ||
          a.categoryName?.toLowerCase() === canonicalSlug ||
          a.code?.toLowerCase() === category.toLowerCase())
    );
    const fieldSchemas = taxonomyService.getTenantFieldSchemas(cleanTenant, canonicalSlug || category, false);

    // Filter customer-visible approved products scoped to matched category/subcategory
    const visibleProducts = dbStore.products.filter(isProductCustomerVisible).map((p) => ({
      ...p,
      ...taxonomyService.resolveAndValidateProductTaxonomy(p, { strictChildMatch: false, tenantId: cleanTenant }),
    }));
    const categoryProducts = matchedChild
      ? visibleProducts.filter((p) => {
          const sameChild = p.childCategoryId === matchedChild.id || p.childCategorySlug === matchedChild.slug;
          if (!sameChild) return false;
          if (subcategory) {
            const subLow = subcategory.trim().toLowerCase();
            return (
              p.productTypeSlug?.toLowerCase() === subLow ||
              p.subcategorySlug?.toLowerCase() === subLow ||
              p.productTypeName?.toLowerCase() === subLow ||
              p.productTypeId?.toLowerCase() === subLow
            );
          }
          return true;
        })
      : matchedMain
      ? visibleProducts.filter((p) => p.mainCategoryId === matchedMain.id || p.mainCategorySlug === matchedMain.slug)
      : visibleProducts;

    const childCategoriesForFilter = matchedChild
      ? matchedChild.productTypes || matchedChild.subcategories || []
      : [];
    const mainChildCategoriesForFilter = matchedMain ? matchedMain.childCategories || [] : [];

    const { filterConfigs, availableFilters } = taxonomyService.getCustomerAvailableFilters(
      cleanTenant,
      matchedChild?.slug || matchedMain?.slug || canonicalSlug,
      categoryProducts,
      childCategoriesForFilter,
      mainChildCategoriesForFilter
    );

    return {
      success: true,
      data: {
        filterConfigs,
        availableFilters,
        attributes,
        fieldSchemas,
        totalMatchingProducts: categoryProducts.length,
      },
    };
  }

  @Get('deals')
  getPublicDeals(@Headers('x-tenant-id') tenantId?: string) {
    const cleanTenant = tenantId || 'tenant-buildora-blr';
    const coupons = companyAdminDataService.getActiveCoupons(cleanTenant);
    const activePromos = vendorPromotions.filter((p: any) => p.status === 'ACTIVE');
    const visibleProducts = dbStore.products.filter(isProductCustomerVisible);
    const discountedProducts = visibleProducts.filter(
      (p) => Number(p.mrp || 0) > Number(p.price || 0)
    );
    return {
      success: true,
      data: {
        coupons,
        promotions: activePromos,
        products: discountedProducts,
      },
    };
  }
}
