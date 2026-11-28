import {
  Controller,
  Get,
  Post,
  Body,
  Header,
  Headers,
  Param,
  Query,
  BadRequestException,
  NotFoundException
} from '@nestjs/common';
import { dbStore } from '../../../database/store';
import {
  CATEGORY_ATTRIBUTE_TEMPLATES,
  LEGACY_CATEGORY_SLUG_ALIASES,
  LEGACY_PRODUCT_TYPE_SLUG_ALIASES,
  getAttributeTemplatesForCategory,
} from '@buildora/constants';
import { vendorRecords, vendorProducts } from '../../vendors/controllers/vendor.controller';
import { taxonomyService } from '../../catalogue/services/taxonomy.service';
import { companyAdminDataService } from '../../company-admin/services/company-admin-data.service';

export function isProductCustomerVisible(p: any, tenantId = 'tenant-buildora-blr'): boolean {
  if (!p) return false;
  if (p.tenantId && tenantId && p.tenantId !== tenantId) return false;
  if (p.isActive === false) return false;
  if (p.isSuspended === true) return false;
  if (p.approvalStatus && p.approvalStatus !== 'APPROVED') return false;

  const vp = vendorProducts.find((v) => v.id === p.id || v.sku === p.sku) as any;
  if (vp) {
    if (vp.isActive === false || vp.isSuspended === true) return false;
    if (vp.approvalStatus && vp.approvalStatus !== 'APPROVED') return false;
  }

  const vendorId = p.vendorId || vp?.vendorId;
  if (vendorId) {
    const vendor = vendorRecords.get(vendorId);
    if (vendor && vendor.status !== 'APPROVED' && (vendor.status as string) !== 'ACTIVE') {
      return false;
    }
  }

  if (!taxonomyService.isProductCategoryHierarchyActive(p, tenantId || 'tenant-buildora-blr')) {
    return false;
  }
  return true;
}

function enrichStorefrontProduct(p: any, tenantId = 'tenant-buildora-blr') {
  const vp = vendorProducts.find((v) => v.id === p.id || v.sku === p.sku) as any;
  const vendorId = p.vendorId || vp?.vendorId || 'vnd-apex-01';
  const vendor = vendorRecords.get(vendorId);
  const totalStock = Number(p.stockCount ?? vp?.stockCount ?? 0);
  const reserved = Number(p.reservedStock ?? vp?.reservedStock ?? 0);
  const availableStock = Math.max(0, totalStock - reserved);
  const hierarchy = taxonomyService.resolveAndValidateProductTaxonomy(p, {
    strictChildMatch: false,
    tenantId,
  });

  const {
    auditLogs: _auditLogs,
    versionHistory: _versionHistory,
    pendingRevision: _pendingRevision,
    commissionRate: _commissionRate,
    commissionAmount: _commissionAmount,
    netPayout: _netPayout,
    lowStockThreshold: _lowStockThreshold,
    revisionStatus: _revisionStatus,
    hasPendingChanges: _hasPendingChanges,
    rejectedBy: _rejectedBy,
    rejectedAt: _rejectedAt,
    rejectionReason: _rejectionReason,
    ...publicProduct
  } = p;

  return {
    ...publicProduct,
    mainCategoryId: hierarchy.mainCategoryId || p.mainCategoryId,
    mainCategorySlug: hierarchy.mainCategorySlug || p.mainCategorySlug,
    mainCategoryName: hierarchy.mainCategoryName || p.mainCategoryName,
    childCategoryId: hierarchy.childCategoryId || p.childCategoryId,
    childCategorySlug: hierarchy.childCategorySlug || p.childCategorySlug,
    childCategoryName: hierarchy.childCategoryName || p.childCategoryName,
    productTypeId: hierarchy.productTypeId || p.productTypeId,
    productTypeSlug: hierarchy.productTypeSlug || p.productTypeSlug,
    productTypeName: hierarchy.productTypeName || p.productTypeName,
    brandId: p.brandId || hierarchy.brandId,
    categoryId: hierarchy.childCategoryId || p.categoryId,
    categorySlug: hierarchy.childCategorySlug || p.categorySlug,
    category: hierarchy.childCategoryName || p.category,
    subcategoryId: hierarchy.productTypeId || p.subcategoryId,
    subcategorySlug: hierarchy.productTypeSlug || p.subcategorySlug,
    subcategory: hierarchy.productTypeName || p.subcategory,
    categoryAttributes: p.categoryAttributes || vp?.categoryAttributes || {},
    specifications: p.specifications || vp?.specifications || {},
    moq: p.moq ?? vp?.moq ?? 1,
    vendorId,
    vendorName: p.vendorName || vendor?.storeName || vendor?.businessInfo?.businessName || 'Buildora Verified Supplier',
    vendorCity: vendor?.businessInfo?.address?.city || 'Bengaluru',
    vendorVerified: vendor ? vendor.status === 'APPROVED' || (vendor.status as string) === 'ACTIVE' : true,
    reservedStock: reserved,
    availableStock,
    inStock: availableStock > 0 && p.isActive !== false
  };
}

@Controller('api/v1')
export class ProductsController {
  private buildDynamicAttributeTemplates(tenantId?: string) {
    const merged: Record<string, any[]> = { ...CATEGORY_ATTRIBUTE_TEMPLATES };
    const attrs = companyAdminDataService.attributes.filter(
      (a) => !tenantId || !a.tenantId || a.tenantId === tenantId
    );
    for (const attr of attrs) {
      const catKey = (attr.categoryName || 'general').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const existing = merged[catKey] ? [...merged[catKey]] : [];
      if (!existing.some((x) => x.name?.toLowerCase() === attr.name.toLowerCase())) {
        existing.push({
          name: attr.name,
          code: attr.code,
          uiType: 'pills',
          options: attr.values || [],
          required: Boolean(attr.isRequired),
        });
      }
      merged[catKey] = existing;
    }
    return merged;
  }

  @Get('categories/:slug/attribute-templates')
  getCategoryAttributeTemplates(@Param('slug') slug: string) {
    const all = this.buildDynamicAttributeTemplates();
    const templates = all[slug.toLowerCase()] || getAttributeTemplatesForCategory(slug);
    return {
      success: true,
      categorySlug: slug,
      data: templates
    };
  }

  @Get('category-attribute-templates')
  getAllCategoryAttributeTemplates(@Query('category') category?: string) {
    const all = this.buildDynamicAttributeTemplates();
    if (category) {
      return {
        success: true,
        data: all[category.toLowerCase()] || getAttributeTemplatesForCategory(category)
      };
    }
    return {
      success: true,
      data: all
    };
  }
  @Get('products')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  getProducts(
    @Headers('x-tenant-id') tenantId?: string,
    @Query('mainCategory') mainCategory?: string,
    @Query('childCategory') childCategory?: string,
    @Query('category') category?: string,
    @Query('productType') productType?: string,
    @Query('subcategory') subcategory?: string,
    @Query('brand') brand?: string,
    @Query('search') search?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('inStockOnly') inStockOnly?: string,
    @Query('asapOnly') asapOnly?: string,
    @Query('rating') rating?: string,
    @Query('specifications') specifications?: string,
    @Query('newLaunch') newLaunch?: string,
    @Query('type') type?: string,
    @Query('size') size?: string,
    @Query('sortBy') sortBy?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const cleanTenant = tenantId || 'tenant-buildora-blr';
    let result = dbStore.products
      .filter((p) => isProductCustomerVisible(p, cleanTenant))
      .map((p) => enrichStorefrontProduct(p, cleanTenant));

    if (mainCategory) {
      const mains = mainCategory.split(',').map((m) => m.trim().toLowerCase()).filter(Boolean);
      result = result.filter(
        (p) =>
          mains.includes(String(p.mainCategorySlug || '').toLowerCase()) ||
          mains.includes(String(p.mainCategoryName || '').toLowerCase()) ||
          mains.includes(String(p.mainCategoryId || '').toLowerCase())
      );
    }

    if (childCategory) {
      const rawChildren = childCategory.split(',').map((c) => c.trim().toLowerCase()).filter(Boolean);
      const children = Array.from(
        new Set(rawChildren.flatMap((c) => [c, LEGACY_CATEGORY_SLUG_ALIASES[c] || c]))
      );
      result = result.filter(
        (p) =>
          children.includes(String(p.childCategorySlug || p.categorySlug || '').toLowerCase()) ||
          children.includes(String(p.childCategoryName || p.category || '').toLowerCase()) ||
          children.includes(String(p.childCategoryId || (p as any).categoryId || '').toLowerCase())
      );
    }

    if (category) {
      const rawCats = category.split(',').map((c) => c.trim().toLowerCase()).filter(Boolean);
      const cats = Array.from(
        new Set(rawCats.flatMap((c) => [c, LEGACY_CATEGORY_SLUG_ALIASES[c] || c]))
      );
      result = result.filter(
        (p) =>
          cats.includes((p.childCategorySlug || p.categorySlug || '').toLowerCase()) ||
          cats.includes((p.childCategoryName || p.category || '').toLowerCase()) ||
          cats.includes(String(p.childCategoryId || (p as any).categoryId || '').toLowerCase()) ||
          cats.includes((p.categorySlug || '').toLowerCase()) ||
          cats.includes((p.category || '').toLowerCase()) ||
          cats.includes(String((p as any).categoryId || '').toLowerCase()) ||
          cats.includes(String(p.mainCategorySlug || '').toLowerCase()) ||
          cats.includes(String(p.mainCategoryName || '').toLowerCase()) ||
          cats.includes(String(p.mainCategoryId || '').toLowerCase())
      );
    }
    const effectiveSubOrType = productType || subcategory;
    if (effectiveSubOrType) {
      const rawSubs = effectiveSubOrType.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
      const subs = Array.from(
        new Set(
          rawSubs.flatMap((s) => {
            const alias = LEGACY_PRODUCT_TYPE_SLUG_ALIASES[s];
            return alias ? [s, alias.slug, alias.productTypeId.toLowerCase()] : [s];
          })
        )
      );
      result = result.filter(
        (p) =>
          subs.includes((p.productTypeSlug || p.subcategorySlug || '').toLowerCase()) ||
          subs.includes((p.productTypeName || p.subcategory || '').toLowerCase()) ||
          subs.includes(String(p.productTypeId || (p as any).subcategoryId || '').toLowerCase())
      );
    }
    if (brand) {
      const brands = brand.split(',').map((b) => b.trim().toLowerCase());
      result = result.filter(
        (p) => brands.includes(p.brandSlug.toLowerCase()) || brands.includes(p.brand.toLowerCase())
      );
    }
    if (inStockOnly === 'true') {
      result = result.filter((p) => p.inStock);
    }
    if (asapOnly === 'true') {
      result = result.filter((p) => p.deliverySpeedAvailable?.includes('ASAP_60'));
    }
    if (rating) {
      const minRating = Number(rating);
      if (!isNaN(minRating)) {
        result = result.filter((p) => p.rating >= minRating);
      }
    }
    if (newLaunch === 'true') {
      result = result.filter((p) => p.isNewLaunch);
    }
    if (type) {
      const types = type.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
      const normalizeSlug = (val: string) => val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      result = result.filter((p) => {
        const candidates = [
          (p as any).productType,
          p.productTypeName,
          p.productTypeSlug,
          p.subcategory,
          p.subcategorySlug,
          p.specifications?.['Product Type'],
          p.specifications?.['Type'],
        ].filter(Boolean);
        return types.some((t) => {
          const tNorm = normalizeSlug(t);
          return candidates.some((c) => {
            const cStr = String(c).toLowerCase();
            return cStr.includes(t) || normalizeSlug(cStr) === tNorm;
          });
        });
      });
    }
    if (size) {
      const sizes = size.split(',').map((s) => s.trim().toLowerCase());
      result = result.filter((p) => {
        const prodSize = (p as any).size || p.specifications?.['Size'] || p.packSize || p.unit;
        return sizes.some((s) => prodSize && String(prodSize).toLowerCase().includes(s));
      });
    }
    if (minPrice) {
      result = result.filter((p) => p.price >= Number(minPrice));
    }
    if (maxPrice) {
      result = result.filter((p) => p.price <= Number(maxPrice));
    }
    if (specifications) {
      try {
        const parsed = JSON.parse(specifications);
        for (const [key, values] of Object.entries(parsed)) {
          if (Array.isArray(values) && values.length > 0) {
            result = result.filter((p) => {
              const specVal = p.specifications?.[key];
              const attrVal = p.categoryAttributes?.[key];
              return values.some(
                (v) =>
                  (specVal && String(specVal).toLowerCase() === String(v).toLowerCase()) ||
                  (attrVal && String(attrVal).toLowerCase() === String(v).toLowerCase())
              );
            });
          }
        }
      } catch {
        // Ignore invalid specifications JSON
      }
    }
    if (search) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'price_asc' || sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc' || sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'discount') {
      result.sort((a, b) => (b.discount || 0) - (a.discount || 0));
    } else if (sortBy === 'latest') {
      result.sort((a, b) => {
        if (a.isNewLaunch && !b.isNewLaunch) return -1;
        if (!a.isNewLaunch && b.isNewLaunch) return 1;
        return b.id.localeCompare(a.id);
      });
    }

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 50;
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = result.slice(startIndex, startIndex + limitNum);

    return {
      success: true,
      data: paginated,
      meta: {
        total: result.length,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(result.length / limitNum)
      }
    };
  }

  @Get('products/:slug')
  getProductBySlug(
    @Param('slug') slug: string,
    @Headers('x-tenant-id') tenantId?: string
  ) {
    const cleanTenant = tenantId || 'tenant-buildora-blr';
    const raw = dbStore.products.find((p) => p.slug === slug || p.id === slug);
    if (!raw || !isProductCustomerVisible(raw, cleanTenant)) {
      throw new NotFoundException('Product not found or currently unavailable.');
    }
    return {
      success: true,
      data: enrichStorefrontProduct(raw, cleanTenant)
    };
  }

  @Get('search')
  searchGlobal(
    @Query('q') q?: string,
    @Headers('x-tenant-id') tenantId?: string
  ) {
    if (!q || !q.trim()) {
      return { success: true, data: { products: [], categories: [], brands: [] } };
    }

    const cleanTenant = tenantId || 'tenant-buildora-blr';
    const needle = q.toLowerCase().trim();

    const matchedProducts = dbStore.products
      .filter((p) => isProductCustomerVisible(p, cleanTenant))
      .filter(
        (p) =>
          p.name.toLowerCase().includes(needle) ||
          p.brand.toLowerCase().includes(needle) ||
          p.category.toLowerCase().includes(needle)
      )
      .slice(0, 6)
      .map((p) => enrichStorefrontProduct(p, cleanTenant));

    const activePool = taxonomyService.getTenantPool(cleanTenant);
    const matchedCategories = activePool.childCategories
      .filter(
        (c) =>
          c.isActive !== false &&
          taxonomyService.isMainCategoryActiveForPortals(cleanTenant, c.mainCategoryId) &&
          c.name.toLowerCase().includes(needle)
      )
      .slice(0, 4);

    const matchedBrands = dbStore.brands.filter(
      (b: any) => b.isActive !== false && (!b.tenantId || b.tenantId === cleanTenant) && b.name.toLowerCase().includes(needle)
    ).slice(0, 4);

    return {
      success: true,
      data: {
        products: matchedProducts,
        categories: matchedCategories,
        brands: matchedBrands
      }
    };
  }

  @Post('cart/validate')
  validateCartItems(
    @Headers('x-tenant-id') tenantId?: string,
    @Body()
    body?: {
      items: Array<{
        productId: string;
        variantId?: string;
        quantity: number;
        unitPrice?: number;
      }>;
    }
  ) {
    if (!body || !Array.isArray(body.items)) {
      throw new BadRequestException('Items array is required for cart validation.');
    }

    const cleanTenant = tenantId || 'tenant-buildora-blr';
    const issues: Array<{ productId: string; variantId?: string; code: string; message: string }> = [];
    const validatedItems: any[] = [];

    for (const item of body.items) {
      const rawProd = dbStore.products.find(
        (p) => p.id === item.productId || p.sku === item.productId || `vp-${p.id}` === item.productId
      );
      if (!rawProd || !isProductCustomerVisible(rawProd, cleanTenant)) {
        issues.push({
          productId: item.productId,
          variantId: item.variantId,
          code: 'PRODUCT_NOT_FOUND',
          message: `Product is no longer available or is currently suspended.`
        });
        continue;
      }

      const prod = enrichStorefrontProduct(rawProd, cleanTenant);
      if (!prod.inStock || prod.availableStock <= 0) {
        issues.push({
          productId: prod.id,
          variantId: item.variantId,
          code: 'OUT_OF_STOCK',
          message: `${prod.name} is currently out of stock.`
        });
        continue;
      }

      let currentPrice = prod.price;
      let availableStock = prod.availableStock;

      if (item.variantId && prod.variants) {
        const variant = prod.variants.find((v) => v.id === item.variantId || v.sku === item.variantId);
        if (!variant) {
          issues.push({
            productId: prod.id,
            variantId: item.variantId,
            code: 'VARIANT_NOT_FOUND',
            message: `Selected option for ${prod.name} is no longer available.`
          });
          continue;
        }

        if (variant.isAvailable === false) {
          issues.push({
            productId: prod.id,
            variantId: variant.id,
            code: 'VARIANT_UNAVAILABLE',
            message: `${prod.name} (${variant.name}) is no longer an available option.`
          });
          continue;
        }

        if (!variant.inStock || (variant.stock !== undefined && variant.stock <= 0)) {
          issues.push({
            productId: prod.id,
            variantId: variant.id,
            code: 'VARIANT_OUT_OF_STOCK',
            message: `${prod.name} (${variant.name}) is out of stock.`
          });
          continue;
        }

        currentPrice = variant.price;
        if (variant.stock !== undefined) {
          availableStock = variant.stock;
        }
      }

      if (item.quantity > availableStock) {
        issues.push({
          productId: prod.id,
          variantId: item.variantId,
          code: 'INSUFFICIENT_STOCK',
          message: `Only ${availableStock} units available for ${prod.name}. Requested: ${item.quantity}.`
        });
      }

      if (item.unitPrice !== undefined && item.unitPrice !== currentPrice) {
        issues.push({
          productId: prod.id,
          variantId: item.variantId,
          code: 'PRICE_CHANGED',
          message: `Price for ${prod.name} changed from ₹${item.unitPrice} to ₹${currentPrice}.`
        });
      }

      validatedItems.push({
        productId: prod.id,
        variantId: item.variantId,
        name: prod.name,
        currentPrice,
        availableStock,
        inStock: true
      });
    }

    return {
      success: true,
      isValid: issues.length === 0,
      issues,
      validatedItems
    };
  }
}
