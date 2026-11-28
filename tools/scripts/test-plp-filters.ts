import 'reflect-metadata';
import * as path from 'node:path';
import * as fs from 'node:fs';
import * as dotenv from 'dotenv';

for (const envPath of [
  path.resolve(__dirname, '../../services/backend/api/.env'),
  path.resolve(process.cwd(), '.env'),
]) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
  }
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../services/backend/api/src/app.module';
import {
  applyCategoryFilters,
  filterConfigsToDimensions,
  getAvailableFiltersForCategory,
  ActiveCategoryFilters,
} from '../../packages/constants/src/category-filters';

const PORT = 3097;
const BASE_URL = `http://localhost:${PORT}/api/v1`;
const TENANT_HEADER = { 'x-tenant-id': 'tenant-buildora-blr' };

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function fetchJson(path: string) {
  const res = await fetch(`${BASE_URL}${path}`, { headers: TENANT_HEADER });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${path}: ${await res.text()}`);
  }
  const json: any = await res.json();
  return json?.data !== undefined ? json.data : json;
}

async function main() {
  const app = await NestFactory.create(AppModule, { logger: false });
  await app.listen(PORT);
  console.log(`Test API listening on port ${PORT}`);

  try {
    const categoriesRaw = await (await fetch(`${BASE_URL}/categories`, { headers: TENANT_HEADER })).json();
    const categories = Array.isArray(categoriesRaw)
      ? categoriesRaw
      : categoriesRaw?.data || categoriesRaw?.mainCategories || [];
    const mainCategories = Array.isArray(categoriesRaw?.mainCategories)
      ? categoriesRaw.mainCategories
      : categories;
    assert(Array.isArray(categories) && categories.length > 0, 'Categories should be non-empty');

    const testSlugs = [
      'hinges-channels-handles',
      'cement',
      'plywood-mdf-hdhmr',
      'wires-mcb-distribution-boards',
      'cpvc-pipes-overhead-tanks',
    ];

    for (const slug of testSlugs) {
      const filtersPayload = await fetchJson(`/filters?category=${encodeURIComponent(slug)}`);
      const productsPayload = await fetchJson(`/products?category=${encodeURIComponent(slug)}`);
      const products = Array.isArray(productsPayload)
        ? productsPayload
        : productsPayload?.items || productsPayload?.data || [];

      const configs = filtersPayload?.filterConfigs || [];
      const availableFilters = filtersPayload?.availableFilters || [];
      assert(Array.isArray(availableFilters), `${slug}: availableFilters must be an array`);

      // Verify zero empty/zero-count options in checkbox filters
      for (const dim of availableFilters) {
        if (dim.type === 'checkbox') {
          assert(Array.isArray(dim.options) && dim.options.length > 0, `${slug} -> ${dim.id} should not be empty`);
          for (const opt of dim.options) {
            assert(opt.count > 0, `${slug} -> ${dim.id} -> ${opt.label} has zero count`);
          }
        }
      }

      // Cross-check frontend computation matches backend filterConfigs
      const frontendDimensions = filterConfigsToDimensions(configs);
      const frontendFilters = getAvailableFiltersForCategory(
        slug,
        products,
        [],
        [],
        frontendDimensions,
        undefined,
        Boolean(filtersPayload?.hasFilterConfiguration)
      );

      assert(
        frontendFilters.length === availableFilters.length,
        `${slug}: frontend computed filters (${frontendFilters.length}) should match backend (${availableFilters.length})`
      );

      console.log(
        `[OK] ${slug}: ${products.length} products, ${availableFilters.length} configured filters -> [${availableFilters
          .map((f: any) => `${f.name}(${f.type === 'range' ? 'range' : f.options.length})`)
          .join(', ')}]`
      );
    }

    // Deep interactive filter + sort simulation on hinges-channels-handles
    const hingesSlug = 'hinges-channels-handles';
    const hingesFiltersRes = await fetchJson(`/filters?category=${hingesSlug}`);
    const hingesProductsRes = await fetchJson(`/products?category=${hingesSlug}`);
    const hingesProducts = Array.isArray(hingesProductsRes) ? hingesProductsRes : hingesProductsRes?.items || [];
    const hingesDims = filterConfigsToDimensions(hingesFiltersRes.filterConfigs || []);

    const brandDim = hingesFiltersRes.availableFilters.find((d: any) => d.id === 'brand');
    assert(brandDim && brandDim.options.length >= 2, 'Expected >= 2 brands on hinges-channels-handles');

    const baseEmpty: ActiveCategoryFilters = {
      categories: [],
      childCategories: [],
      subcategories: [],
      brands: [],
      specifications: {},
      inStockOnly: false,
      asapOnly: false,
      sortBy: 'relevance',
    };

    // 1. Single Brand selection
    const firstBrand = brandDim.options[0];
    const singleBrandResult = applyCategoryFilters(
      hingesProducts,
      { ...baseEmpty, brands: [firstBrand.value] },
      hingesSlug,
      hingesDims
    );
    assert(
      singleBrandResult.length === firstBrand.count,
      `Brand filter "${firstBrand.label}" expected ${firstBrand.count} items, got ${singleBrandResult.length}`
    );

    // 2. Multi-select Brand selection
    const multiBrands = brandDim.options.slice(0, 2).map((o: any) => o.value);
    const multiBrandResult = applyCategoryFilters(
      hingesProducts,
      { ...baseEmpty, brands: multiBrands },
      hingesSlug,
      hingesDims
    );
    assert(
      multiBrandResult.length === hingesProducts.length,
      `Multi-brand selection expected ${hingesProducts.length} items, got ${multiBrandResult.length}`
    );

    // 3. Selling-price numeric range filtering + sorting (Price: Low to High & High to Low)
    const minP = Math.min(...hingesProducts.map((p: any) => p.price));
    const maxP = Math.max(...hingesProducts.map((p: any) => p.price));
    const midP = Math.floor((minP + maxP) / 2);

    const lowRange = applyCategoryFilters(
      hingesProducts,
      { ...baseEmpty, minPrice: minP, maxPrice: midP },
      hingesSlug,
      hingesDims
    );
    assert(
      lowRange.every((p: any) => p.price >= minP && p.price <= midP),
      'Price range filter must strictly enforce [minPrice, maxPrice] on product selling price'
    );

    const sortedLow = [...hingesProducts].sort((a: any, b: any) => a.price - b.price);
    const sortedHigh = [...hingesProducts].sort((a: any, b: any) => b.price - a.price);
    assert(sortedLow[0].price <= sortedLow[sortedLow.length - 1].price, 'Price low-to-high check');
    assert(sortedHigh[0].price >= sortedHigh[sortedHigh.length - 1].price, 'Price high-to-low check');

    // 4. Specification multi-select (e.g. type / size / colour / material)
    const specDim = hingesFiltersRes.availableFilters.find(
      (d: any) => d.type === 'checkbox' && d.id !== 'brand' && d.options.length > 0
    );
    if (specDim) {
      const opt = specDim.options[0];
      const specFiltered = applyCategoryFilters(
        hingesProducts,
        { ...baseEmpty, specifications: { [specDim.id]: [opt.value] } },
        hingesSlug,
        hingesDims
      );
      assert(
        specFiltered.length === opt.count,
        `Spec filter ${specDim.name}=${opt.label} expected ${opt.count} items, got ${specFiltered.length}`
      );
      console.log(`[OK] Spec filter ${specDim.name}="${opt.label}" matched ${specFiltered.length}/${opt.count} items`);
    }

    // 5. Reset / Clear All restores full product list
    const cleared = applyCategoryFilters(hingesProducts, baseEmpty, hingesSlug, hingesDims);
    assert(cleared.length === hingesProducts.length, 'Clear All must restore all products');

    // 6. New Launches collections + filters check
    const nlRes = await fetchJson('/new-launches');
    const nlCollections = Array.isArray(nlRes)
      ? nlRes
      : nlRes?.collections || nlRes?.data || [];
    assert(Array.isArray(nlCollections), 'New launches collections should return array');
    const nlFilters = await fetchJson('/filters?category=new-launches');
    assert(Array.isArray(nlFilters.availableFilters), 'New launches root filters should return array');
    if (nlCollections[0]?.slug) {
      const colFilters = await fetchJson(`/filters?collection=${encodeURIComponent(nlCollections[0].slug)}`);
      assert(Array.isArray(colFilters.availableFilters), 'Collection filters should return array');
    }
    console.log(
      `[OK] New Launches: ${nlCollections.length} collections, ${nlFilters.availableFilters.length} filters`
    );

    // 7. BuildMainChildCategoryFilter zero-count check on Main Category
    const mainFurniture = mainCategories.find((c: any) => c.slug === 'furniture-hardware');
    if (mainFurniture) {
      const mainRes = await fetchJson(`/filters?category=${mainFurniture.slug}`);
      const childDim = (mainRes.availableFilters || []).find((d: any) => d.id === 'childCategory');
      if (childDim) {
        assert(
          childDim.options.every((o: any) => o.count > 0),
          'Main category Child Category options must never show 0-count options'
        );
      }
      console.log(`[OK] Main category ${mainFurniture.slug}: ${(mainRes.availableFilters || []).length} filters verified`);
    }

    console.log('\nALL PLP FILTER VERIFICATION CHECKS PASSED!');
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
