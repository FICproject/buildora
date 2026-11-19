import { Controller, Get, Param, Query } from '@nestjs/common';
import { dbStore } from '../../../database/store';

@Controller('api/v1')
export class ProductsController {
  @Get('products')
  getProducts(
    @Query('category') category?: string,
    @Query('subcategory') subcategory?: string,
    @Query('brand') brand?: string,
    @Query('search') search?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('inStockOnly') inStockOnly?: string,
    @Query('sortBy') sortBy?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    let result = [...dbStore.products];

    if (category) {
      result = result.filter((p) => p.categorySlug === category);
    }
    if (subcategory) {
      result = result.filter((p) => p.subcategorySlug === subcategory);
    }
    if (brand) {
      result = result.filter((p) => p.brandSlug === brand);
    }
    if (inStockOnly === 'true') {
      result = result.filter((p) => p.inStock);
    }
    if (minPrice) {
      result = result.filter((p) => p.price >= Number(minPrice));
    }
    if (maxPrice) {
      result = result.filter((p) => p.price <= Number(maxPrice));
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

    if (sortBy === 'price_asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'discount') {
      result.sort((a, b) => b.discount - a.discount);
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
  getProductBySlug(@Param('slug') slug: string) {
    const product = dbStore.products.find((p) => p.slug === slug);
    return {
      success: !!product,
      data: product
    };
  }

  @Get('search')
  searchGlobal(@Query('q') q?: string) {
    if (!q || !q.trim()) {
      return { success: true, data: { products: [], categories: [], brands: [] } };
    }

    const needle = q.toLowerCase().trim();

    const matchedProducts = dbStore.products.filter(
      (p) =>
        p.name.toLowerCase().includes(needle) ||
        p.brand.toLowerCase().includes(needle) ||
        p.category.toLowerCase().includes(needle)
    ).slice(0, 6);

    const matchedCategories = dbStore.categories.filter((c) =>
      c.name.toLowerCase().includes(needle)
    ).slice(0, 4);

    const matchedBrands = dbStore.brands.filter((b) =>
      b.name.toLowerCase().includes(needle)
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
}
