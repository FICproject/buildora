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
import { taxonomyService } from '../../services/backend/api/src/modules/catalogue/services/taxonomy.service';

const PORT = 3096;
const BASE_URL = `http://localhost:${PORT}/api/v1`;
const TENANT_HEADER = { 'x-tenant-id': 'tenant-buildora-blr' };

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

async function fetchJson(route: string) {
  const res = await fetch(`${BASE_URL}${route}`, { headers: TENANT_HEADER });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${route}: ${text}`);
  const json = JSON.parse(text);
  return json?.data !== undefined ? json.data : json;
}

async function main() {
  const app = await NestFactory.create(AppModule, { logger: false });
  await app.listen(PORT);
  console.log(`Navigation & Category test API listening on port ${PORT}`);

  try {
    const taxonomy = await fetchJson('/taxonomy');
    const navSections = taxonomy.navigationSections || [];
    const desktopNav = taxonomy.desktopNavigation || [];

    assert(desktopNav.length >= 7, 'Desktop navigation must contain Home, 5 departments, New Launches, Deals');
    assert(navSections.length >= 5, 'All 5 Main Navigation sections must be active and present');

    for (const sec of navSections) {
      // Query Level 1 Section via mainCategory & via category
      const viaMain = await fetchJson(`/products?mainCategory=${encodeURIComponent(sec.slug)}&limit=all`);
      const viaCat = await fetchJson(`/products?category=${encodeURIComponent(sec.slug)}&limit=all`);

      assert(Array.isArray(viaMain) && viaMain.length > 0, `${sec.slug}: mainCategory query returned empty`);
      assert(viaMain.length === viaCat.length, `${sec.slug}: ?mainCategory vs ?category count mismatch`);

      // Verify zero duplicate IDs
      const ids = viaMain.map((p: any) => p.id);
      assert(new Set(ids).size === ids.length, `${sec.slug}: duplicate product IDs detected`);

      // Collect products from all active Left-Panel categories ("mainCategories" inside section = childCategories in DB)
      const combinedGroupIds = new Set<string>();
      for (const grp of sec.mainCategories || []) {
        const grpProducts = await fetchJson(`/products?category=${encodeURIComponent(grp.slug)}&limit=all`);
        const grpIds = new Set(grpProducts.map((p: any) => p.id));
        assert(grpIds.size === grpProducts.length, `${grp.slug}: duplicate products in group query`);

        for (const id of grpIds) combinedGroupIds.add(id as string);

        // Verify clicking any Child Category restricts strictly to that child category (productType)
        const activeChildWithProducts = (grp.childCategories || []).find((c: any) => c.productCount > 0);
        if (activeChildWithProducts) {
          const typeProds = await fetchJson(
            `/products?category=${encodeURIComponent(grp.slug)}&productType=${encodeURIComponent(activeChildWithProducts.slug)}&limit=all`
          );
          assert(
            typeProds.length === activeChildWithProducts.productCount,
            `${grp.slug}/${activeChildWithProducts.slug}: expected ${activeChildWithProducts.productCount} products, got ${typeProds.length}`
          );
          assert(
            typeProds.every((p: any) => p.childCategorySlug === grp.slug),
            `${grp.slug}/${activeChildWithProducts.slug}: leaked product from sibling parent category`
          );
        }
      }

      assert(
        combinedGroupIds.size === viaMain.length,
        `${sec.slug}: sum of unique products across groups (${combinedGroupIds.size}) != section total (${viaMain.length})`
      );
      console.log(`[OK] Section "${sec.name}": ${viaMain.length} unique products across ${(sec.mainCategories || []).length} Main Categories`);
    }

    // Specifically verify Kitchen Systems & Accessories combined child category products
    const kitchenProds = await fetchJson('/products?category=kitchen-systems-accessories&limit=all');
    assert(kitchenProds.length >= 2, `Expected >=2 Kitchen Systems products across children, got ${kitchenProds.length}`);
    const kitchenTypeSlugs = new Set(kitchenProds.map((p: any) => p.productTypeSlug));
    assert(
      kitchenTypeSlugs.size >= 2,
      `Kitchen Systems & Accessories should combine multiple child categories, got: ${[...kitchenTypeSlugs].join(', ')}`
    );

    // Specifically verify Drawer & Wardrobe Channels under two different parents do NOT cross-contaminate
    const cabChannels = await fetchJson('/products?category=hinges-channels-handles&productType=drawer-wardrobe-channels&limit=all');
    const wardChannels = await fetchJson('/products?category=wardrobe-bed-fittings&productType=drawer-wardrobe-channels&limit=all');
    assert(
      cabChannels.every((p: any) => p.childCategorySlug === 'hinges-channels-handles'),
      'hinges-channels-handles/drawer-wardrobe-channels leaked sibling product'
    );
    assert(
      wardChannels.every((p: any) => p.childCategorySlug === 'wardrobe-bed-fittings'),
      'wardrobe-bed-fittings/drawer-wardrobe-channels leaked sibling product'
    );
    console.log(`[OK] Parent-scoped Child Category queries isolated cleanly (cab=${cabChannels.length}, ward=${wardChannels.length})`);

    // Verify inactive Child Category exclusion dynamically
    const pool = taxonomyService.getTenantPool('tenant-buildora-blr');
    const targetChild = pool.childCategories.find((c) => c.slug === 'door-locks-hardware');
    assert(targetChild, 'Expected door-locks-hardware child category');
    const originalActive = targetChild.isActive;
    try {
      targetChild.isActive = false;
      const afterDeactivateMain = await fetchJson('/products?mainCategory=furniture-hardware&limit=all');
      assert(
        !afterDeactivateMain.some((p: any) => p.childCategorySlug === 'door-locks-hardware'),
        'Inactive Child Category products must be excluded from Main Category listing'
      );
      const afterDeactivateDirect = await fetchJson('/products?category=door-locks-hardware&limit=all');
      assert(
        afterDeactivateDirect.length === 0,
        'Inactive Child Category direct query must return empty'
      );
      console.log('[OK] Inactive Child Category products excluded from both Main and direct queries');
    } finally {
      targetChild.isActive = originalActive;
    }

    console.log('\nALL NAVIGATION & CATEGORY BACKEND CHECKS PASSED!');
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
