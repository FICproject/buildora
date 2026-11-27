import { BadRequestException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  MAIN_CATEGORIES_SEED,
  CHILD_CATEGORIES_SEED,
  PRODUCT_TYPES_SEED,
  CATEGORY_FIELD_SCHEMAS_SEED,
  CATEGORY_FILTER_CONFIGS_SEED,
  NEW_LAUNCH_FILTER_CONFIGS_SEED,
  STANDARD_CHECKLIST_FILTERS,
  CIVIL_FILTER_KEYS_BY_CATEGORY,
  LEGACY_CATEGORY_SLUG_ALIASES,
  LEGACY_PRODUCT_TYPE_SLUG_ALIASES,
  filterConfigsToDimensions,
  getAvailableFiltersForCategory,
  extractProductValuesForDimension,
  normalizeFilterOptionLabel,
  MASTER_BRANDS,
  resolveFullTaxonomy,
  SUPPLIED_NEW_LAUNCH_DEFINITIONS,
  resolveNewLaunchCategoryMapping,
} from '@buildora/constants';
import {
  MainCategory,
  ChildCategory,
  ProductTypeNode,
  NewLaunchCollection,
  NewLaunchCategoryMapping,
  CategoryFieldSchema,
  CategoryFieldType,
  CategoryFilterConfiguration,
  FilterFieldType,
  FilterSelectionMode,
  DesktopNavItem,
  DesktopNavItemType,
  CatalogPublishMetadata,
} from '@buildora/types';
import { dbStore } from '../../../database/store';
import {
  MainCategoryModel,
  ChildCategoryModel,
  ProductTypeModel,
  NewLaunchCollectionModel,
  CategoryFieldSchemaModel,
  CategoryFilterConfigModel,
  DesktopNavItemModel,
  CatalogPublishSnapshotModel,
  platformPersistenceService,
} from '../../../database/platform-persistence.service';

interface TenantCatalogDraft {
  tenantId: string;
  mainCategories: MainCategory[];
  childCategories: ChildCategory[];
  productTypes: ProductTypeNode[];
  desktopNavigation: DesktopNavItem[];
  categoryFilterConfigs?: CategoryFilterConfiguration[];
  deletedMainIds: string[];
  deletedChildIds: string[];
  deletedProductTypeIds: string[];
  deletedNavIds: string[];
  deletedFilterConfigIds?: string[];
  hasUnpublishedChanges: boolean;
  publishedVersion: number;
  draftVersion: number;
  lastPublishedAt?: string;
  lastPublishedBy?: string;
  lastDraftSavedAt?: string;
}

export interface CivilMigrationReport {
  executedAt: string;
  idempotentRun: boolean;
  matchedExistingCategories: number;
  updatedCategories: number;
  createdCategories: number;
  matchedSubcategories: number;
  createdSubcategories: number;
  migratedLegacySubcategories: number;
  reassignedExtraCategories: number;
  productsPreserved: number;
  productsRemapped: number;
  filterConfigsSeeded: number;
}

const DEFAULT_TENANT = 'tenant-buildora-blr';
const GLOBAL_TENANT = 'GLOBAL';

const MAIN_CATEGORY_NAV_ICONS: Record<string, string> = {
  'civil-interiors': 'Building2',
  'furniture-hardware': 'Layers',
  electrical: 'Zap',
  'plumbing-sanitary': 'Compass',
  'hardware-appliances': 'Wrench',
};

export interface TaxonomyMigrationRecord {
  productId: string;
  sku: string;
  previousCategory: string;
  previousSubcategory: string;
  mainCategoryId: string;
  childCategoryId: string;
  productTypeId: string;
  status: 'MIGRATED' | 'UNMAPPED';
}

export interface NewLaunchesMigrationReport {
  executedAt: string;
  idempotentRun: boolean;
  totalCollections: number;
  createdCollections: number;
  matchedCollections: number;
  totalShortcuts: number;
  mappedShortcuts: number;
  groupMatchedShortcuts: number;
  unmappedShortcuts: number;
  unmappedItems: Array<{
    collectionId: string;
    collectionTitle: string;
    displayLabel: string;
    mappingId: string;
    status: 'UNMAPPED' | 'GROUP_MATCH';
    suggestedCategoryGroupId?: string;
  }>;
}

@Injectable()
export class TaxonomyService implements OnModuleInit {
  private readonly logger = new Logger(TaxonomyService.name);
  private initialized = false;

  public mainCategories: MainCategory[] = [];
  public childCategories: ChildCategory[] = [];
  public productTypes: ProductTypeNode[] = [];
  public desktopNavigation: DesktopNavItem[] = [];
  public categoryFieldSchemas: CategoryFieldSchema[] = [];
  public categoryFilterConfigs: CategoryFilterConfiguration[] = [];
  public newLaunchCollections: NewLaunchCollection[] = [];
  public migrationRecords: TaxonomyMigrationRecord[] = [];
  public civilMigrationReport: CivilMigrationReport | null = null;
  public furnitureMigrationReport: CivilMigrationReport | null = null;
  public electricalMigrationReport: CivilMigrationReport | null = null;
  public plumbingMigrationReport: CivilMigrationReport | null = null;
  public newLaunchesMigrationReport: NewLaunchesMigrationReport | null = null;
  private drafts = new Map<string, TenantCatalogDraft>();
  private publishMeta = new Map<string, CatalogPublishMetadata>();
  private newLaunchDrafts = new Map<string, NewLaunchCollection[]>();
  private newLaunchDraftDirty = new Set<string>();
  private baselineMainCategories: MainCategory[] = [];
  private baselineChildCategories: ChildCategory[] = [];
  private baselineProductTypes: ProductTypeNode[] = [];
  private baselineDesktopNav: DesktopNavItem[] = [];
  private baselineFilterConfigs: CategoryFilterConfiguration[] = [];
  private tenantFilterBootstrapped = new Set<string>();
  private deletedFilterIdsByTenant = new Map<string, Set<string>>();
  private filterSyncVersions = new Map<string, number>();
  private filterConfigCache = new Map<string, { version: number; data: any }>();
  private tenantIsolatedPools = new Map<
    string,
    {
      mainCategories: MainCategory[];
      childCategories: ChildCategory[];
      productTypes: ProductTypeNode[];
    }
  >();

  constructor() {
    this.seedDefaultsIfEmpty();
  }

  async onModuleInit() {
    await this.hydrateFromDatabase();
  }

  private seedDefaultsIfEmpty(tenantId = GLOBAL_TENANT) {
    if (this.mainCategories.length === 0) {
      const now = new Date().toISOString();
      this.mainCategories = MAIN_CATEGORIES_SEED.map((m) => ({
        ...m,
        tenantId,
        createdAt: now,
        updatedAt: now,
      }));
    }
    if (this.childCategories.length === 0) {
      const now = new Date().toISOString();
      this.childCategories = CHILD_CATEGORIES_SEED.map((c) => ({
        ...c,
        tenantId,
        createdAt: now,
        updatedAt: now,
      }));
    }
    if (this.productTypes.length === 0) {
      const now = new Date().toISOString();
      this.productTypes = PRODUCT_TYPES_SEED.map((pt) => ({
        ...pt,
        tenantId,
        createdAt: now,
        updatedAt: now,
      }));
    }
    if (this.categoryFieldSchemas.length === 0) {
      const now = new Date().toISOString();
      this.categoryFieldSchemas = CATEGORY_FIELD_SCHEMAS_SEED.map((f) => ({
        ...f,
        tenantId,
        createdAt: now,
        updatedAt: now,
      }));
    }
    if (this.categoryFilterConfigs.length === 0) {
      const now = new Date().toISOString();
      this.categoryFilterConfigs = CATEGORY_FILTER_CONFIGS_SEED.map((fc) => ({
        ...fc,
        tenantId,
        createdAt: now,
        updatedAt: now,
      }));
    }
    if (this.desktopNavigation.length === 0) {
      this.desktopNavigation = this.buildDefaultDesktopNav(tenantId);
    }
    this.reconcileCivilAndInteriorsTaxonomySync(tenantId);
    this.reconcileFurnitureHardwareTaxonomySync(tenantId);
    this.reconcileElectricalTaxonomySync(tenantId);
    this.reconcilePlumbingTaxonomySync(tenantId);
    this.reconcileNewLaunchesCollectionsSync(tenantId);
    this.migrateLegacyCatalogRecords();
  }

  /**
   * Idempotently reconciles the exact Civil & Interiors 6 categories (cat-1..cat-6)
   * and their 34 supplied child categories (ProductTypeNode records), reusing IDs and
   * preserving 100% of existing products, images, variants, pricing, and stock.
   */
  public reconcileCivilAndInteriorsTaxonomySync(tenantId = GLOBAL_TENANT): CivilMigrationReport {
    const now = new Date().toISOString();
    const report: CivilMigrationReport = {
      executedAt: now,
      idempotentRun: Boolean(this.civilMigrationReport),
      matchedExistingCategories: 0,
      updatedCategories: 0,
      createdCategories: 0,
      matchedSubcategories: 0,
      createdSubcategories: 0,
      migratedLegacySubcategories: 0,
      reassignedExtraCategories: 0,
      productsPreserved: dbStore.products.length,
      productsRemapped: 0,
      filterConfigsSeeded: 0,
    };

    const civilSeedMain = MAIN_CATEGORIES_SEED.find((m) => m.id === 'mc-1');
    if (civilSeedMain) {
      const existingMain = this.mainCategories.find((m) => m.id === 'mc-1' || m.slug === 'civil-interiors');
      if (!existingMain) {
        this.mainCategories.unshift({ ...civilSeedMain, tenantId, createdAt: now, updatedAt: now });
      }
    }

    const civilSeedChildren = CHILD_CATEGORIES_SEED.filter((c) => c.mainCategoryId === 'mc-1');
    const civilChildIds = new Set(civilSeedChildren.map((c) => c.id));

    // Move cat-27 (Bathroom Renovation Materials -> mc-4) & cat-28 (Ceiling & Flooring -> mc-2) out of mc-1 cleanly
    for (const cc of this.childCategories) {
      if (cc.mainCategoryId === 'mc-1' && !civilChildIds.has(cc.id)) {
        if (cc.id === 'cat-27' || cc.slug === 'bathroom-renovation-materials') {
          cc.mainCategoryId = 'mc-4';
          cc.mainCategorySlug = 'plumbing-sanitary';
          cc.updatedAt = now;
          report.reassignedExtraCategories += 1;
        } else if (cc.id === 'cat-28' || cc.slug === 'ceiling-flooring') {
          cc.mainCategoryId = 'mc-2';
          cc.mainCategorySlug = 'furniture-hardware';
          cc.updatedAt = now;
          report.reassignedExtraCategories += 1;
        }
      }
    }

    // Reconcile the 6 exact categories under Civil & Interiors (reusing cat-1..cat-6)
    for (const seedChild of civilSeedChildren) {
      const existing = this.childCategories.find(
        (c) =>
          c.id === seedChild.id ||
          (c.mainCategoryId === 'mc-1' &&
            (c.slug === seedChild.slug || c.name.toLowerCase() === seedChild.name.toLowerCase()))
      );
      if (existing) {
        report.matchedExistingCategories += 1;
        if (
          existing.name !== seedChild.name ||
          existing.slug !== seedChild.slug ||
          existing.sortOrder !== seedChild.sortOrder ||
          existing.mainCategoryId !== 'mc-1'
        ) {
          existing.name = seedChild.name;
          existing.slug = seedChild.slug;
          existing.mainCategoryId = 'mc-1';
          existing.mainCategorySlug = 'civil-interiors';
          existing.description = seedChild.description;
          existing.sortOrder = seedChild.sortOrder;
          existing.isActive = true;
          existing.updatedAt = now;
          report.updatedCategories += 1;
        }
      } else {
        this.childCategories.push({ ...seedChild, tenantId, createdAt: now, updatedAt: now });
        report.createdCategories += 1;
      }
    }

    // Migrate stale legacy sub-1-* .. sub-6-* entries under cat-1..cat-6 and insert missing 34 supplied child categories
    const civilSeedTypes = PRODUCT_TYPES_SEED.filter((pt) => civilChildIds.has(pt.childCategoryId));
    const seedTypeIdSet = new Set(civilSeedTypes.map((pt) => pt.id));

    for (const pt of [...this.productTypes]) {
      if (civilChildIds.has(pt.childCategoryId) && !seedTypeIdSet.has(pt.id)) {
        const mapped = LEGACY_PRODUCT_TYPE_SLUG_ALIASES[pt.slug?.toLowerCase() || ''];
        if (mapped) {
          report.migratedLegacySubcategories += 1;
          this.productTypes = this.productTypes.filter((x) => x.id !== pt.id);
        }
      }
    }

    for (const seedType of civilSeedTypes) {
      const existing = this.productTypes.find(
        (pt) =>
          pt.id === seedType.id ||
          (pt.childCategoryId === seedType.childCategoryId &&
            (pt.slug.toLowerCase() === seedType.slug.toLowerCase() ||
              pt.name.trim().toLowerCase() === seedType.name.trim().toLowerCase()))
      );
      if (existing) {
        report.matchedSubcategories += 1;
        existing.mainCategoryId = 'mc-1';
        existing.childCategoryId = seedType.childCategoryId;
        existing.childCategorySlug = seedType.childCategorySlug;
        existing.name = seedType.name;
        existing.slug = seedType.slug;
        existing.sortOrder = seedType.sortOrder;
        existing.isActive = true;
        existing.updatedAt = now;
      } else {
        this.productTypes.push({ ...seedType, tenantId, createdAt: now, updatedAt: now });
        report.createdSubcategories += 1;
      }
    }

    // Reconcile Civil & Interiors CategoryFieldSchemas slugs/defaults without losing Admin custom fields
    for (const seedSchema of CATEGORY_FIELD_SCHEMAS_SEED.filter((f) => civilChildIds.has(f.childCategoryId))) {
      const match = this.categoryFieldSchemas.find((f) => f.id === seedSchema.id);
      if (match) {
        match.childCategorySlug = seedSchema.childCategorySlug;
      } else if (
        !this.categoryFieldSchemas.some(
          (f) => f.childCategoryId === seedSchema.childCategoryId && f.fieldKey === seedSchema.fieldKey
        )
      ) {
        this.categoryFieldSchemas.push({ ...seedSchema, tenantId, createdAt: now, updatedAt: now });
      }
    }

    // Remove obsolete pre-migration static Civil & Interiors seed filter rows so exact Phase 2 configs apply
    const legacyCivilFilterIds = new Set([
      'cfc-cat-1-cementType', 'cfc-cat-1-rating',
      'cfc-cat-2-application', 'cfc-cat-2-adhesiveType', 'cfc-cat-2-finish', 'cfc-cat-2-rating',
      'cfc-cat-3-materialType', 'cfc-cat-3-finish', 'cfc-cat-3-waterproofRating', 'cfc-cat-3-rating',
      'cfc-cat-4-adhesiveType', 'cfc-cat-4-bondingApplication', 'cfc-cat-4-waterResistance', 'cfc-cat-4-settingTime', 'cfc-cat-4-packSize', 'cfc-cat-4-rating',
      'cfc-cat-5-waterproofingType', 'cfc-cat-5-applicationArea', 'cfc-cat-5-materialBase', 'cfc-cat-5-packSize', 'cfc-cat-5-rating',
      'cfc-cat-6-paintType', 'cfc-cat-6-finish', 'cfc-cat-6-applicationSurface', 'cfc-cat-6-packSize', 'cfc-cat-6-rating',
    ]);
    if (!this.civilMigrationReport) {
      this.categoryFilterConfigs = this.categoryFilterConfigs.filter((c) => !legacyCivilFilterIds.has(c.id));
    }

    // Seed missing CategoryFilterConfiguration defaults cleanly without overwriting customized rows
    const deletedSet = this.deletedFilterIdsByTenant.get(tenantId === GLOBAL_TENANT ? DEFAULT_TENANT : tenantId);
    for (const seedCfg of CATEGORY_FILTER_CONFIGS_SEED) {
      if (deletedSet?.has(seedCfg.id)) continue;
      const match = this.categoryFilterConfigs.find(
        (c) =>
          c.id === seedCfg.id ||
          (!c.productTypeId && c.childCategoryId === seedCfg.childCategoryId && c.fieldKey === seedCfg.fieldKey)
      );
      if (match) {
        match.childCategorySlug = seedCfg.childCategorySlug;
        match.childCategoryName = seedCfg.childCategoryName;
      } else {
        this.categoryFilterConfigs.push({ ...seedCfg, tenantId, createdAt: now, updatedAt: now });
        report.filterConfigsSeeded += 1;
      }
    }

    // Upgrade existing products' legacy Civil & Interiors slugs/names while preserving all product fields
    const childById = new Map(this.childCategories.map((c) => [c.id, c]));
    const ptById = new Map(this.productTypes.map((t) => [t.id, t]));
    for (const p of dbStore.products as any[]) {
      const rawCatSlug = (p.categorySlug || p.childCategorySlug || '').toLowerCase();
      const rawSubSlug = (p.subcategorySlug || p.productTypeSlug || '').toLowerCase();
      const aliasCatSlug = LEGACY_CATEGORY_SLUG_ALIASES[rawCatSlug];
      const aliasSub = LEGACY_PRODUCT_TYPE_SLUG_ALIASES[rawSubSlug];

      if (aliasCatSlug || aliasSub || civilChildIds.has(p.childCategoryId || p.categoryId)) {
        const targetChildId = aliasSub?.childId || (aliasCatSlug ? this.childCategories.find((c) => c.slug === aliasCatSlug)?.id : undefined) || p.childCategoryId || p.categoryId;
        const cc = targetChildId ? childById.get(targetChildId) : undefined;
        if (cc) {
          p.mainCategoryId = cc.mainCategoryId;
          p.mainCategorySlug = cc.mainCategorySlug || 'civil-interiors';
          p.mainCategoryName = 'Civil & Interiors';
          p.childCategoryId = cc.id;
          p.childCategorySlug = cc.slug;
          p.childCategoryName = cc.name;
          p.categoryId = cc.id;
          p.categorySlug = cc.slug;
          p.category = cc.name;
          report.productsRemapped += 1;
        }
        const pt = aliasSub ? ptById.get(aliasSub.productTypeId) : ptById.get(p.productTypeId || p.subcategoryId);
        if (pt) {
          p.productTypeId = pt.id;
          p.productTypeSlug = pt.slug;
          p.productTypeName = pt.name;
          p.subcategoryId = pt.id;
          p.subcategorySlug = pt.slug;
          p.subcategory = pt.name;
        }
      }
    }

    this.civilMigrationReport = report;
    return report;
  }

  /**
   * Idempotently reconciles the exact Furniture & Architectural Hardware 4 Category Groups
   * (cat-7..cat-10) and their 27 supplied Child Categories (ProductTypeNode records),
   * reusing existing IDs and preserving 100% of existing products, variants, images & stock.
   */
  public reconcileFurnitureHardwareTaxonomySync(tenantId = GLOBAL_TENANT): CivilMigrationReport {
    const now = new Date().toISOString();
    const report: CivilMigrationReport = {
      executedAt: now,
      idempotentRun: Boolean(this.furnitureMigrationReport),
      matchedExistingCategories: 0,
      updatedCategories: 0,
      createdCategories: 0,
      matchedSubcategories: 0,
      createdSubcategories: 0,
      migratedLegacySubcategories: 0,
      reassignedExtraCategories: 0,
      productsPreserved: dbStore.products.length,
      productsRemapped: 0,
      filterConfigsSeeded: 0,
    };

    const seedMain = MAIN_CATEGORIES_SEED.find((m) => m.id === 'mc-2');
    if (seedMain) {
      const existingMain = this.mainCategories.find((m) => m.id === 'mc-2' || m.slug === 'furniture-hardware');
      if (!existingMain) {
        this.mainCategories.push({ ...seedMain, tenantId, createdAt: now, updatedAt: now });
      }
    }

    const seedGroups = CHILD_CATEGORIES_SEED.filter((c) => c.mainCategoryId === 'mc-2');
    const groupIdSet = new Set(seedGroups.map((c) => c.id));

    // Reassign non-supplied groups (cat-25 Glass Door Hardware, cat-28 Ceiling & Flooring) to mc-5
    for (const cc of this.childCategories) {
      if (cc.mainCategoryId === 'mc-2' && !groupIdSet.has(cc.id)) {
        cc.mainCategoryId = 'mc-5';
        cc.mainCategorySlug = 'hardware-appliances';
        cc.updatedAt = now;
        report.reassignedExtraCategories += 1;
      }
    }

    // Reconcile the 4 exact Category Groups under Furniture & Architectural Hardware
    for (const seedGroup of seedGroups) {
      const existing = this.childCategories.find(
        (c) =>
          c.id === seedGroup.id ||
          (c.mainCategoryId === 'mc-2' &&
            (c.slug === seedGroup.slug || c.name.toLowerCase() === seedGroup.name.toLowerCase()))
      );
      if (existing) {
        report.matchedExistingCategories += 1;
        if (
          existing.name !== seedGroup.name ||
          existing.slug !== seedGroup.slug ||
          existing.sortOrder !== seedGroup.sortOrder ||
          existing.mainCategoryId !== 'mc-2'
        ) {
          existing.name = seedGroup.name;
          existing.slug = seedGroup.slug;
          existing.mainCategoryId = 'mc-2';
          existing.mainCategorySlug = 'furniture-hardware';
          existing.description = seedGroup.description;
          existing.sortOrder = seedGroup.sortOrder;
          existing.isActive = true;
          existing.updatedAt = now;
          report.updatedCategories += 1;
        }
      } else {
        this.childCategories.push({ ...seedGroup, tenantId, createdAt: now, updatedAt: now });
        report.createdCategories += 1;
      }
    }

    // Migrate legacy sub-7-*..sub-10-* entries under cat-7..cat-10 and upsert the 27 supplied Child Categories
    const seedTypes = PRODUCT_TYPES_SEED.filter((pt) => groupIdSet.has(pt.childCategoryId));
    const seedTypeIdSet = new Set(seedTypes.map((pt) => pt.id));

    for (const pt of [...this.productTypes]) {
      if (groupIdSet.has(pt.childCategoryId) && !seedTypeIdSet.has(pt.id)) {
        const mapped = LEGACY_PRODUCT_TYPE_SLUG_ALIASES[pt.slug?.toLowerCase() || ''];
        if (mapped) {
          report.migratedLegacySubcategories += 1;
          this.productTypes = this.productTypes.filter((x) => x.id !== pt.id);
        }
      }
    }

    for (const seedType of seedTypes) {
      const existing = this.productTypes.find(
        (pt) =>
          pt.id === seedType.id ||
          (pt.childCategoryId === seedType.childCategoryId &&
            (pt.slug.toLowerCase() === seedType.slug.toLowerCase() ||
              pt.name.trim().toLowerCase() === seedType.name.trim().toLowerCase()))
      );
      if (existing) {
        report.matchedSubcategories += 1;
        existing.mainCategoryId = 'mc-2';
        existing.childCategoryId = seedType.childCategoryId;
        existing.childCategorySlug = seedType.childCategorySlug;
        existing.name = seedType.name;
        existing.slug = seedType.slug;
        existing.sortOrder = seedType.sortOrder;
        existing.isActive = true;
        existing.updatedAt = now;
      } else {
        this.productTypes.push({ ...seedType, tenantId, createdAt: now, updatedAt: now });
        report.createdSubcategories += 1;
      }
    }

    // Remove obsolete pre-migration static Furniture & Hardware seed filter rows so exact Phase 1 configs apply
    const legacyFurnitureFilterIds = new Set([
      'cfc-cat-7-finish', 'cfc-cat-7-crankType', 'cfc-cat-7-loadCapacity', 'cfc-cat-7-rating',
      'cfc-cat-8-cabinetSize', 'cfc-cat-8-weightRating', 'cfc-cat-8-damping', 'cfc-cat-8-rating',
      'cfc-cat-9-finish', 'cfc-cat-9-loadCapacity', 'cfc-cat-9-mountingType', 'cfc-cat-9-rating',
      'cfc-cat-10-lockType', 'cfc-cat-10-finish', 'cfc-cat-10-rating',
    ]);
    if (!this.furnitureMigrationReport) {
      this.categoryFilterConfigs = this.categoryFilterConfigs.filter(
        (c) => !legacyFurnitureFilterIds.has(c.id)
      );
    }

    // Ensure filter configs exist for cat-7..cat-10 without overwriting customized entries
    const deletedFurnSet = this.deletedFilterIdsByTenant.get(tenantId === GLOBAL_TENANT ? DEFAULT_TENANT : tenantId);
    for (const seedCfg of CATEGORY_FILTER_CONFIGS_SEED.filter((fc) => fc.mainCategoryId === 'mc-2')) {
      if (deletedFurnSet?.has(seedCfg.id)) continue;
      const match = this.categoryFilterConfigs.find(
        (c) =>
          c.id === seedCfg.id ||
          (!c.productTypeId && c.childCategoryId === seedCfg.childCategoryId && c.fieldKey === seedCfg.fieldKey)
      );
      if (!match) {
        this.categoryFilterConfigs.push({ ...seedCfg, tenantId, createdAt: now, updatedAt: now });
        report.filterConfigsSeeded += 1;
      }
    }

    // Safely upgrade existing products under Furniture & Architectural Hardware groups while preserving all product fields
    const childById = new Map(this.childCategories.map((c) => [c.id, c]));
    const ptById = new Map(this.productTypes.map((t) => [t.id, t]));
    for (const p of dbStore.products as any[]) {
      const catId = p.childCategoryId || p.categoryId;
      const rawSubSlug = (p.subcategorySlug || p.productTypeSlug || '').toLowerCase();
      const aliasSub = LEGACY_PRODUCT_TYPE_SLUG_ALIASES[rawSubSlug];

      if (catId && groupIdSet.has(catId)) {
        const cc = childById.get(catId);
        if (cc) {
          p.mainCategoryId = 'mc-2';
          p.mainCategorySlug = 'furniture-hardware';
          p.mainCategoryName = 'Furniture & Architectural Hardware';
          p.childCategoryId = cc.id;
          p.childCategorySlug = cc.slug;
          p.childCategoryName = cc.name;
          p.categoryId = cc.id;
          p.categorySlug = cc.slug;
          p.category = cc.name;
          report.productsRemapped += 1;
        }
        const pt = aliasSub ? ptById.get(aliasSub.productTypeId) : ptById.get(p.productTypeId || p.subcategoryId);
        if (pt) {
          p.productTypeId = pt.id;
          p.productTypeSlug = pt.slug;
          p.productTypeName = pt.name;
          p.subcategoryId = pt.id;
          p.subcategorySlug = pt.slug;
          p.subcategory = pt.name;
        }
      } else if (p.categorySlug === 'glass-door-hardware' || p.categorySlug === 'ceiling-flooring') {
        p.mainCategoryId = 'mc-5';
        p.mainCategorySlug = 'hardware-appliances';
        p.mainCategoryName = 'Hardware & Appliances';
      }
    }

    this.furnitureMigrationReport = report;
    return report;
  }

  /**
   * Idempotently reconciles the exact Electrical 4 Category Groups
   * (cat-11..cat-14) and their 24 supplied Child Categories (ProductTypeNode records),
   * reusing existing IDs and preserving 100% of existing products, variants, images & stock.
   */
  public reconcileElectricalTaxonomySync(tenantId = GLOBAL_TENANT): CivilMigrationReport {
    const now = new Date().toISOString();
    const report: CivilMigrationReport = {
      executedAt: now,
      idempotentRun: Boolean(this.electricalMigrationReport),
      matchedExistingCategories: 0,
      updatedCategories: 0,
      createdCategories: 0,
      matchedSubcategories: 0,
      createdSubcategories: 0,
      migratedLegacySubcategories: 0,
      reassignedExtraCategories: 0,
      productsPreserved: dbStore.products.length,
      productsRemapped: 0,
      filterConfigsSeeded: 0,
    };

    const seedMain = MAIN_CATEGORIES_SEED.find((m) => m.id === 'mc-3');
    if (seedMain) {
      const existingMain = this.mainCategories.find((m) => m.id === 'mc-3' || m.slug === 'electrical');
      if (!existingMain) {
        this.mainCategories.push({ ...seedMain, tenantId, createdAt: now, updatedAt: now });
      }
    }

    const seedGroups = CHILD_CATEGORIES_SEED.filter((c) => c.mainCategoryId === 'mc-3');
    const groupIdSet = new Set(seedGroups.map((c) => c.id));

    // Reassign non-supplied groups (e.g. cat-15 Ceiling Fans & Exhaust, cat-22 CCTV & Networking) to mc-5
    for (const cc of this.childCategories) {
      if (cc.mainCategoryId === 'mc-3' && !groupIdSet.has(cc.id)) {
        cc.mainCategoryId = 'mc-5';
        cc.mainCategorySlug = 'hardware-appliances';
        cc.updatedAt = now;
        report.reassignedExtraCategories += 1;
      }
    }

    // Reconcile the 4 exact Category Groups under Electrical
    for (const seedGroup of seedGroups) {
      const existing = this.childCategories.find(
        (c) =>
          c.id === seedGroup.id ||
          (c.mainCategoryId === 'mc-3' &&
            (c.slug === seedGroup.slug || c.name.toLowerCase() === seedGroup.name.toLowerCase()))
      );
      if (existing) {
        report.matchedExistingCategories += 1;
        if (
          existing.name !== seedGroup.name ||
          existing.slug !== seedGroup.slug ||
          existing.sortOrder !== seedGroup.sortOrder ||
          existing.mainCategoryId !== 'mc-3'
        ) {
          existing.name = seedGroup.name;
          existing.slug = seedGroup.slug;
          existing.mainCategoryId = 'mc-3';
          existing.mainCategorySlug = 'electrical';
          existing.description = seedGroup.description;
          existing.sortOrder = seedGroup.sortOrder;
          existing.isActive = true;
          existing.updatedAt = now;
          report.updatedCategories += 1;
        }
      } else {
        this.childCategories.push({ ...seedGroup, tenantId, createdAt: now, updatedAt: now });
        report.createdCategories += 1;
      }
    }

    // Migrate legacy sub-11-*..sub-14-* entries under cat-11..cat-14 and upsert the 24 supplied Child Categories
    const seedTypes = PRODUCT_TYPES_SEED.filter((pt) => groupIdSet.has(pt.childCategoryId));
    const seedTypeIdSet = new Set(seedTypes.map((pt) => pt.id));

    for (const pt of [...this.productTypes]) {
      if (groupIdSet.has(pt.childCategoryId) && !seedTypeIdSet.has(pt.id)) {
        const mapped = LEGACY_PRODUCT_TYPE_SLUG_ALIASES[pt.slug?.toLowerCase() || ''];
        if (mapped) {
          report.migratedLegacySubcategories += 1;
          this.productTypes = this.productTypes.filter((x) => x.id !== pt.id);
        }
      }
    }

    for (const seedType of seedTypes) {
      const existing = this.productTypes.find(
        (pt) =>
          pt.id === seedType.id ||
          (pt.childCategoryId === seedType.childCategoryId &&
            (pt.slug.toLowerCase() === seedType.slug.toLowerCase() ||
              pt.name.trim().toLowerCase() === seedType.name.trim().toLowerCase()))
      );
      if (existing) {
        report.matchedSubcategories += 1;
        existing.mainCategoryId = 'mc-3';
        existing.childCategoryId = seedType.childCategoryId;
        existing.childCategorySlug = seedType.childCategorySlug;
        existing.name = seedType.name;
        existing.slug = seedType.slug;
        existing.sortOrder = seedType.sortOrder;
        existing.isActive = true;
        existing.updatedAt = now;
      } else {
        this.productTypes.push({ ...seedType, tenantId, createdAt: now, updatedAt: now });
        report.createdSubcategories += 1;
      }
    }

    // Remove obsolete pre-migration static Electrical seed filter rows so exact Phase 1 configs apply
    const legacyElectricalFilterIds = new Set([
      'cfc-cat-11-voltageOrRating', 'cfc-cat-11-electricalType', 'cfc-cat-11-rating',
      'cfc-cat-12-moduleSize', 'cfc-cat-12-ampVoltageRating', 'cfc-cat-12-switchType',
      'cfc-cat-13-nominalDiameter', 'cfc-cat-13-stressClass', 'cfc-cat-13-conduitType', 'cfc-cat-13-rating',
      'cfc-cat-14-wattage', 'cfc-cat-14-colorTemperature', 'cfc-cat-14-cutoutSize', 'cfc-cat-14-lightingType', 'cfc-cat-14-rating',
    ]);
    if (!this.electricalMigrationReport) {
      this.categoryFilterConfigs = this.categoryFilterConfigs.filter(
        (c) => !legacyElectricalFilterIds.has(c.id)
      );
    }

    // Ensure filter configs exist for cat-11..cat-14 without overwriting customized entries
    const deletedElecSet = this.deletedFilterIdsByTenant.get(tenantId === GLOBAL_TENANT ? DEFAULT_TENANT : tenantId);
    for (const seedCfg of CATEGORY_FILTER_CONFIGS_SEED.filter((fc) => fc.mainCategoryId === 'mc-3')) {
      if (deletedElecSet?.has(seedCfg.id)) continue;
      const match = this.categoryFilterConfigs.find(
        (c) =>
          c.id === seedCfg.id ||
          (!c.productTypeId && c.childCategoryId === seedCfg.childCategoryId && c.fieldKey === seedCfg.fieldKey)
      );
      if (!match) {
        this.categoryFilterConfigs.push({ ...seedCfg, tenantId, createdAt: now, updatedAt: now });
        report.filterConfigsSeeded += 1;
      }
    }

    // Safely upgrade existing products under Electrical groups while preserving all product fields
    const childById = new Map(this.childCategories.map((c) => [c.id, c]));
    const ptById = new Map(this.productTypes.map((t) => [t.id, t]));
    for (const p of dbStore.products as any[]) {
      const catId = p.childCategoryId || p.categoryId;
      const rawSubSlug = (p.subcategorySlug || p.productTypeSlug || '').toLowerCase();
      const aliasSub = LEGACY_PRODUCT_TYPE_SLUG_ALIASES[rawSubSlug];

      if (catId && groupIdSet.has(catId)) {
        const cc = childById.get(catId);
        if (cc) {
          p.mainCategoryId = 'mc-3';
          p.mainCategorySlug = 'electrical';
          p.mainCategoryName = 'Electrical';
          p.childCategoryId = cc.id;
          p.childCategorySlug = cc.slug;
          p.childCategoryName = cc.name;
          p.categoryId = cc.id;
          p.categorySlug = cc.slug;
          p.category = cc.name;
          report.productsRemapped += 1;
        }
        const pt = aliasSub ? ptById.get(aliasSub.productTypeId) : ptById.get(p.productTypeId || p.subcategoryId);
        if (pt) {
          p.productTypeId = pt.id;
          p.productTypeSlug = pt.slug;
          p.productTypeName = pt.name;
          p.subcategoryId = pt.id;
          p.subcategorySlug = pt.slug;
          p.subcategory = pt.name;
        }
      } else if (
        catId === 'cat-15' ||
        catId === 'cat-22' ||
        p.categorySlug === 'ceiling-fans-exhaust' ||
        p.categorySlug === 'cctv-networking'
      ) {
        p.mainCategoryId = 'mc-5';
        p.mainCategorySlug = 'hardware-appliances';
        p.mainCategoryName = 'Hardware & Appliances';
      }
    }

    this.electricalMigrationReport = report;
    return report;
  }

  /**
   * Idempotently reconciles the exact Plumbing, Sanitary & Bath 3 Category Groups
   * (cat-16, cat-17, cat-19) and their 15 supplied Child Categories (ProductTypeNode records),
   * reusing existing IDs and preserving 100% of existing products, variants, images & stock.
   * Reassigns cat-18 (Kitchen Sinks & Faucets) and cat-27 (Bathroom Renovation Materials) to mc-5.
   */
  public reconcilePlumbingTaxonomySync(tenantId = GLOBAL_TENANT): CivilMigrationReport {
    const now = new Date().toISOString();
    const report: CivilMigrationReport = {
      executedAt: now,
      idempotentRun: Boolean(this.plumbingMigrationReport),
      matchedExistingCategories: 0,
      updatedCategories: 0,
      createdCategories: 0,
      matchedSubcategories: 0,
      createdSubcategories: 0,
      migratedLegacySubcategories: 0,
      reassignedExtraCategories: 0,
      productsPreserved: dbStore.products.length,
      productsRemapped: 0,
      filterConfigsSeeded: 0,
    };

    const seedMain = MAIN_CATEGORIES_SEED.find((m) => m.id === 'mc-4');
    if (seedMain) {
      const existingMain = this.mainCategories.find((m) => m.id === 'mc-4' || m.slug === 'plumbing-sanitary');
      if (!existingMain) {
        this.mainCategories.push({ ...seedMain, tenantId, createdAt: now, updatedAt: now });
      }
    }

    const seedGroups = CHILD_CATEGORIES_SEED.filter((c) => c.mainCategoryId === 'mc-4');
    const groupIdSet = new Set(seedGroups.map((c) => c.id));

    // Reassign non-supplied groups (cat-18 Kitchen Sinks & Faucets, cat-27 Bathroom Renovation) to mc-5
    for (const cc of this.childCategories) {
      if (cc.mainCategoryId === 'mc-4' && !groupIdSet.has(cc.id)) {
        cc.mainCategoryId = 'mc-5';
        cc.mainCategorySlug = 'hardware-appliances';
        cc.updatedAt = now;
        report.reassignedExtraCategories += 1;
      }
    }

    // Reconcile the 3 exact Category Groups under Plumbing, Sanitary & Bath
    for (const seedGroup of seedGroups) {
      const existing = this.childCategories.find(
        (c) =>
          c.id === seedGroup.id ||
          (c.mainCategoryId === 'mc-4' &&
            (c.slug === seedGroup.slug || c.name.toLowerCase() === seedGroup.name.toLowerCase()))
      );
      if (existing) {
        report.matchedExistingCategories += 1;
        if (
          existing.name !== seedGroup.name ||
          existing.slug !== seedGroup.slug ||
          existing.sortOrder !== seedGroup.sortOrder ||
          existing.mainCategoryId !== 'mc-4'
        ) {
          existing.name = seedGroup.name;
          existing.slug = seedGroup.slug;
          existing.mainCategoryId = 'mc-4';
          existing.mainCategorySlug = 'plumbing-sanitary';
          existing.description = seedGroup.description;
          existing.sortOrder = seedGroup.sortOrder;
          existing.isActive = true;
          existing.updatedAt = now;
          report.updatedCategories += 1;
        }
      } else {
        this.childCategories.push({ ...seedGroup, tenantId, createdAt: now, updatedAt: now });
        report.createdCategories += 1;
      }
    }

    // Migrate legacy sub-16-*..sub-19-* entries under cat-16..cat-19 and upsert the 15 supplied Child Categories
    const seedTypes = PRODUCT_TYPES_SEED.filter((pt) => groupIdSet.has(pt.childCategoryId));
    const seedTypeIdSet = new Set(seedTypes.map((pt) => pt.id));

    for (const pt of [...this.productTypes]) {
      if (groupIdSet.has(pt.childCategoryId) && !seedTypeIdSet.has(pt.id)) {
        const mapped = LEGACY_PRODUCT_TYPE_SLUG_ALIASES[pt.slug?.toLowerCase() || ''];
        if (mapped) {
          report.migratedLegacySubcategories += 1;
          this.productTypes = this.productTypes.filter((x) => x.id !== pt.id);
        }
      }
    }

    for (const seedType of seedTypes) {
      const existing = this.productTypes.find(
        (pt) =>
          pt.id === seedType.id ||
          (pt.childCategoryId === seedType.childCategoryId &&
            (pt.slug.toLowerCase() === seedType.slug.toLowerCase() ||
              pt.name.trim().toLowerCase() === seedType.name.trim().toLowerCase()))
      );
      if (existing) {
        report.matchedSubcategories += 1;
        existing.mainCategoryId = 'mc-4';
        existing.childCategoryId = seedType.childCategoryId;
        existing.childCategorySlug = seedType.childCategorySlug;
        existing.name = seedType.name;
        existing.slug = seedType.slug;
        existing.sortOrder = seedType.sortOrder;
        existing.isActive = true;
        existing.updatedAt = now;
      } else {
        this.productTypes.push({ ...seedType, tenantId, createdAt: now, updatedAt: now });
        report.createdSubcategories += 1;
      }
    }

    // Remove obsolete pre-migration static Plumbing, Sanitary & Bath seed filter rows so exact Phase 1 configs apply
    const legacyPlumbingFilterIds = new Set([
      'cfc-cat-16-diameter', 'cfc-cat-16-pressureRating', 'cfc-cat-16-pipeOrFittingType', 'cfc-cat-16-rating',
      'cfc-cat-17-finishColour', 'cfc-cat-17-installationType', 'cfc-cat-17-fixtureType', 'cfc-cat-17-rating',
      'cfc-cat-19-capacity', 'cfc-cat-19-layers', 'cfc-cat-19-shape', 'cfc-cat-19-rating',
    ]);
    if (!this.plumbingMigrationReport) {
      this.categoryFilterConfigs = this.categoryFilterConfigs.filter(
        (c) => !legacyPlumbingFilterIds.has(c.id)
      );
    }

    // Ensure filter configs exist for cat-16, cat-17, cat-19 without overwriting customized entries
    const deletedPlumbSet = this.deletedFilterIdsByTenant.get(tenantId === GLOBAL_TENANT ? DEFAULT_TENANT : tenantId);
    for (const seedCfg of CATEGORY_FILTER_CONFIGS_SEED.filter((fc) => fc.mainCategoryId === 'mc-4')) {
      if (deletedPlumbSet?.has(seedCfg.id)) continue;
      const match = this.categoryFilterConfigs.find(
        (c) =>
          c.id === seedCfg.id ||
          (!c.productTypeId && c.childCategoryId === seedCfg.childCategoryId && c.fieldKey === seedCfg.fieldKey)
      );
      if (!match) {
        this.categoryFilterConfigs.push({ ...seedCfg, tenantId, createdAt: now, updatedAt: now });
        report.filterConfigsSeeded += 1;
      }
    }

    // Safely upgrade existing products under Plumbing groups while preserving all product fields
    const childById = new Map(this.childCategories.map((c) => [c.id, c]));
    const ptById = new Map(this.productTypes.map((t) => [t.id, t]));
    for (const p of dbStore.products as any[]) {
      const catId = p.childCategoryId || p.categoryId;
      const rawSubSlug = (p.subcategorySlug || p.productTypeSlug || '').toLowerCase();
      const aliasSub = LEGACY_PRODUCT_TYPE_SLUG_ALIASES[rawSubSlug];

      if (catId && groupIdSet.has(catId)) {
        const cc = childById.get(catId);
        if (cc) {
          p.mainCategoryId = 'mc-4';
          p.mainCategorySlug = 'plumbing-sanitary';
          p.mainCategoryName = 'Plumbing, Sanitary & Bath';
          p.childCategoryId = cc.id;
          p.childCategorySlug = cc.slug;
          p.childCategoryName = cc.name;
          p.categoryId = cc.id;
          p.categorySlug = cc.slug;
          p.category = cc.name;
          report.productsRemapped += 1;
        }
        const pt = aliasSub ? ptById.get(aliasSub.productTypeId) : ptById.get(p.productTypeId || p.subcategoryId);
        if (pt) {
          p.productTypeId = pt.id;
          p.productTypeSlug = pt.slug;
          p.productTypeName = pt.name;
          p.subcategoryId = pt.id;
          p.subcategorySlug = pt.slug;
          p.subcategory = pt.name;
        }
      } else if (
        catId === 'cat-18' ||
        catId === 'cat-27' ||
        p.categorySlug === 'kitchen-sinks-faucets' ||
        p.categorySlug === 'bathroom-renovation-materials'
      ) {
        p.mainCategoryId = 'mc-5';
        p.mainCategorySlug = 'hardware-appliances';
        p.mainCategoryName = 'Hardware & Appliances';
      }
    }

    this.plumbingMigrationReport = report;
    return report;
  }

  /**
   * Idempotently reconciles the exact 8 supplied New Launches promotional collections
   * (Cabinet Hardware .. Home Appliances & Power Backup) and maps their shortcuts to
   * real permanent taxonomy IDs WITHOUT creating duplicate permanent categories or modifying
   * any product's original categoryIds. Preserves unmapped labels transparently for Admin review.
   */
  public reconcileNewLaunchesCollectionsSync(tenantId = GLOBAL_TENANT): NewLaunchesMigrationReport {
    const now = new Date().toISOString();
    const isIdempotent = Boolean(this.newLaunchesMigrationReport);
    const pool = {
      mainCategories: this.mainCategories,
      childCategories: this.childCategories,
      productTypes: this.productTypes,
    };

    // Migrate away pure legacy nl-col-default once real 8 promotional collections are seeded
    const onlyLegacyDefault =
      this.newLaunchCollections.length === 1 &&
      this.newLaunchCollections[0]?.id === 'nl-col-default';
    const preservedLegacyProductIds = onlyLegacyDefault
      ? [...(this.newLaunchCollections[0]?.productIds || [])]
      : [];
    if (onlyLegacyDefault) {
      this.newLaunchCollections = [];
    }

    let createdCollections = 0;
    let matchedCollections = 0;

    for (const def of SUPPLIED_NEW_LAUNCH_DEFINITIONS) {
      const existing = this.newLaunchCollections.find(
        (c) =>
          c.id === def.id ||
          c.slug.toLowerCase() === def.slug.toLowerCase() ||
          c.title.trim().toLowerCase() === def.title.trim().toLowerCase()
      );
      const grp = this.childCategories.find((c) => c.id === def.categoryGroupId);
      const main = grp ? this.mainCategories.find((m) => m.id === grp.mainCategoryId) : undefined;

      const existingMappings = Array.isArray(existing?.categoryMappings) ? existing!.categoryMappings! : [];
      const reconciledMappings: NewLaunchCategoryMapping[] = def.childLabels.map((label, idx) => {
        const existingMap = existingMappings.find(
          (m) => m.displayLabel.trim().toLowerCase() === label.trim().toLowerCase()
        );
        if (existingMap && existingMap.mappingStatus === 'MAPPED' && existingMap.childCategoryId) {
          const validPt = this.productTypes.find((pt) => pt.id === existingMap.childCategoryId);
          if (validPt) {
            const validGrp = this.childCategories.find((c) => c.id === validPt.childCategoryId);
            const validMain = validGrp ? this.mainCategories.find((m) => m.id === validGrp.mainCategoryId) : undefined;
            return {
              ...existingMap,
              displayLabel: label,
              mainCategoryId: validMain?.id || validPt.mainCategoryId,
              mainCategorySlug: validMain?.slug || '',
              mainCategoryName: validMain?.name || '',
              categoryGroupId: validGrp?.id || validPt.childCategoryId,
              categoryGroupSlug: validGrp?.slug || '',
              categoryGroupName: validGrp?.name || '',
              childCategoryId: validPt.id,
              childCategorySlug: validPt.slug,
              childCategoryName: validPt.name,
              sortOrder: existingMap.sortOrder || idx + 1,
            };
          }
        }
        return resolveNewLaunchCategoryMapping(label, pool, def.categoryGroupId, idx + 1, existingMap?.id);
      });

      // Keep any extra Admin-added shortcuts beyond the supplied labels
      const suppliedLower = new Set(def.childLabels.map((l) => l.trim().toLowerCase()));
      for (const extraMap of existingMappings) {
        if (!suppliedLower.has(extraMap.displayLabel.trim().toLowerCase())) {
          reconciledMappings.push(extraMap);
        }
      }

      if (existing) {
        matchedCollections += 1;
        existing.categoryGroupId = existing.categoryGroupId || grp?.id || def.categoryGroupId;
        existing.categoryGroupSlug = existing.categoryGroupSlug || grp?.slug;
        existing.categoryGroupName = existing.categoryGroupName || grp?.name;
        existing.mainCategoryId = existing.mainCategoryId || main?.id;
        existing.mainCategoryName = existing.mainCategoryName || main?.name;
        existing.categoryMappings = reconciledMappings;
        if (!existing.image) existing.image = def.image;
        if (!existing.bannerImage) existing.bannerImage = def.bannerImage;
        if (!existing.publishStatus) existing.publishStatus = existing.isActive !== false ? 'PUBLISHED' : 'DRAFT';
        existing.updatedAt = now;
      } else {
        const eligibleProdIds = dbStore.products
          .filter((p: any) => {
            if (!p.isNewLaunch && !preservedLegacyProductIds.includes(p.id)) return false;
            return reconciledMappings.some(
              (m) =>
                m.mappingStatus === 'MAPPED' &&
                ((m.childCategoryId && (p.productTypeId === m.childCategoryId || p.subcategoryId === m.childCategoryId)) ||
                  (m.categoryGroupId && (p.childCategoryId === m.categoryGroupId || p.categoryId === m.categoryGroupId)))
            );
          })
          .map((p) => p.id);

        this.newLaunchCollections.push({
          id: def.id,
          tenantId,
          title: def.title,
          name: def.title,
          slug: def.slug,
          description: def.description,
          image: def.image,
          bannerImage: def.bannerImage,
          badge: def.badge,
          mainCategoryId: main?.id || 'mc-2',
          mainCategoryName: main?.name || '',
          categoryGroupId: grp?.id || def.categoryGroupId,
          categoryGroupSlug: grp?.slug || '',
          categoryGroupName: grp?.name || '',
          categoryMappings: reconciledMappings,
          productIds: eligibleProdIds,
          displayOrder: def.displayOrder,
          isActive: true,
          publishStatus: 'PUBLISHED',
          createdAt: now,
          updatedAt: now,
        });
        createdCollections += 1;
      }
    }

    // Seed missing New Launches collection FilterConfigurations without overwriting customized rows
    const deletedNlSet = this.deletedFilterIdsByTenant.get(tenantId === GLOBAL_TENANT ? DEFAULT_TENANT : tenantId);
    for (const seedCfg of NEW_LAUNCH_FILTER_CONFIGS_SEED) {
      if (deletedNlSet?.has(seedCfg.id)) continue;
      const match = this.categoryFilterConfigs.find(
        (c) =>
          c.id === seedCfg.id ||
          (!c.productTypeId &&
            (c.newLaunchCollectionId || c.childCategoryId) === seedCfg.newLaunchCollectionId &&
            c.fieldKey === seedCfg.fieldKey)
      );
      if (!match) {
        this.categoryFilterConfigs.push({ ...seedCfg, tenantId, createdAt: now, updatedAt: now });
      }
    }

    const report = this.buildNewLaunchesReport(this.newLaunchCollections, createdCollections, matchedCollections, isIdempotent);
    this.newLaunchesMigrationReport = report;
    return report;
  }

  private buildNewLaunchesReport(
    collections: NewLaunchCollection[],
    createdCollections = 0,
    matchedCollections = collections.length,
    idempotentRun = true
  ): NewLaunchesMigrationReport {
    const unmappedItems: NewLaunchesMigrationReport['unmappedItems'] = [];
    let totalShortcuts = 0;
    let mappedShortcuts = 0;
    let groupMatchedShortcuts = 0;
    let unmappedShortcuts = 0;

    for (const col of collections) {
      for (const m of col.categoryMappings || []) {
        if (m.isActive === false) continue;
        totalShortcuts += 1;
        if (m.mappingStatus === 'MAPPED') mappedShortcuts += 1;
        else if (m.mappingStatus === 'GROUP_MATCH') {
          groupMatchedShortcuts += 1;
          unmappedItems.push({
            collectionId: col.id,
            collectionTitle: col.title || col.name || col.slug,
            displayLabel: m.displayLabel,
            mappingId: m.id,
            status: 'GROUP_MATCH',
            suggestedCategoryGroupId: m.categoryGroupId,
          });
        } else {
          unmappedShortcuts += 1;
          unmappedItems.push({
            collectionId: col.id,
            collectionTitle: col.title || col.name || col.slug,
            displayLabel: m.displayLabel,
            mappingId: m.id,
            status: 'UNMAPPED',
            suggestedCategoryGroupId: col.categoryGroupId,
          });
        }
      }
    }

    return {
      executedAt: new Date().toISOString(),
      idempotentRun,
      totalCollections: collections.length,
      createdCollections,
      matchedCollections,
      totalShortcuts,
      mappedShortcuts,
      groupMatchedShortcuts,
      unmappedShortcuts,
      unmappedItems,
    };
  }

  private buildDefaultDesktopNav(tenantId = GLOBAL_TENANT): DesktopNavItem[] {
    const now = new Date().toISOString();
    const sortedMains = [...this.mainCategories].sort((a, b) => a.sortOrder - b.sortOrder);
    const items: DesktopNavItem[] = [
      {
        id: 'nav-home',
        tenantId,
        label: 'Home',
        slug: 'home',
        itemType: 'HOME',
        route: '/',
        icon: 'Home',
        hasDropdown: false,
        displayOrder: 1,
        isVisible: true,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ];
    let order = 2;
    for (const mc of sortedMains) {
      items.push({
        id: `nav-${mc.id}`,
        tenantId,
        label: mc.name,
        slug: mc.slug,
        itemType: 'MAIN_CATEGORY',
        mainCategoryId: mc.id,
        mainCategorySlug: mc.slug,
        route: `/categories/${mc.slug}`,
        icon: MAIN_CATEGORY_NAV_ICONS[mc.slug] || 'Layers',
        hasDropdown: true,
        displayOrder: order++,
        isVisible: mc.showInNavigation !== false,
        isActive: mc.isActive !== false,
        createdAt: now,
        updatedAt: now,
      });
    }
    items.push(
      {
        id: 'nav-new-launches',
        tenantId,
        label: 'New Launches',
        slug: 'new-launches',
        itemType: 'NEW_LAUNCHES',
        route: '/new-launches',
        icon: 'Rocket',
        hasDropdown: true,
        displayOrder: order++,
        isVisible: true,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'nav-deals',
        tenantId,
        label: 'Deals',
        slug: 'deals',
        itemType: 'DEALS',
        route: '/deals',
        icon: 'Sparkles',
        hasDropdown: false,
        highlight: true,
        displayOrder: order++,
        isVisible: true,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }
    );
    return items;
  }

  async hydrateFromDatabase() {
    const [dbMains, dbChildren, dbTypes, dbCollections, dbFields, dbFilters, dbNavs, dbSnapshots] = await Promise.all([
      platformPersistenceService.loadAll<MainCategory>(MainCategoryModel),
      platformPersistenceService.loadAll<ChildCategory>(ChildCategoryModel),
      platformPersistenceService.loadAll<ProductTypeNode>(ProductTypeModel),
      platformPersistenceService.loadAll<NewLaunchCollection>(NewLaunchCollectionModel),
      platformPersistenceService.loadAll<CategoryFieldSchema>(CategoryFieldSchemaModel),
      platformPersistenceService.loadAll<CategoryFilterConfiguration>(CategoryFilterConfigModel),
      platformPersistenceService.loadAll<DesktopNavItem>(DesktopNavItemModel),
      platformPersistenceService.loadAll<any>(CatalogPublishSnapshotModel),
    ]);

    if (dbMains.length > 0) this.mainCategories = dbMains;
    else {
      for (const m of this.mainCategories) {
        await platformPersistenceService.upsert(MainCategoryModel, m);
      }
    }

    if (dbChildren.length > 0) this.childCategories = dbChildren;
    else {
      for (const c of this.childCategories) {
        await platformPersistenceService.upsert(ChildCategoryModel, c);
      }
    }

    if (dbTypes.length > 0) this.productTypes = dbTypes;
    else {
      for (const pt of this.productTypes) {
        await platformPersistenceService.upsert(ProductTypeModel, pt);
      }
    }

    if (dbCollections.length > 0) this.newLaunchCollections = dbCollections;
    else {
      for (const col of this.newLaunchCollections) {
        await platformPersistenceService.upsert(NewLaunchCollectionModel, col);
      }
    }

    if (dbFields.length > 0) this.categoryFieldSchemas = dbFields;
    else {
      for (const f of this.categoryFieldSchemas) {
        await platformPersistenceService.upsert(CategoryFieldSchemaModel, f);
      }
    }

    if (dbFilters.length > 0) this.categoryFilterConfigs = dbFilters;
    else {
      for (const fc of this.categoryFilterConfigs) {
        await platformPersistenceService.upsert(CategoryFilterConfigModel, fc);
      }
    }

    if (dbNavs.length > 0) this.desktopNavigation = dbNavs;
    else {
      for (const nav of this.desktopNavigation) {
        await platformPersistenceService.upsert(DesktopNavItemModel, nav);
      }
    }

    // Restore deleted filter tombstones BEFORE seed reconciliation so deleted filters never resurrect on restart
    if (dbSnapshots.length > 0) {
      for (const snap of dbSnapshots) {
        if (snap?.tenantId && Array.isArray(snap.deletedFilterConfigIds)) {
          for (const delId of snap.deletedFilterConfigIds) {
            this.recordDeletedFilterTombstone(snap.tenantId, undefined, delId);
          }
        }
      }
    }

    this.reconcileCivilAndInteriorsTaxonomySync(GLOBAL_TENANT);
    this.reconcileFurnitureHardwareTaxonomySync(GLOBAL_TENANT);
    this.reconcileElectricalTaxonomySync(GLOBAL_TENANT);
    this.reconcilePlumbingTaxonomySync(GLOBAL_TENANT);
    this.reconcileNewLaunchesCollectionsSync(GLOBAL_TENANT);

    this.captureBaselineSeedSnapshot();

    // Persist reconciled Civil, Furniture, Electrical, Plumbing & New Launches changes idempotently if MongoDB is connected
    if (platformPersistenceService.isDbConnected()) {
      for (const c of this.childCategories.filter((x) => ['mc-1', 'mc-2', 'mc-3', 'mc-4', 'mc-5'].includes(x.mainCategoryId))) {
        await platformPersistenceService.upsert(ChildCategoryModel, c);
      }
      for (const pt of this.productTypes.filter((x) => ['mc-1', 'mc-2', 'mc-3', 'mc-4', 'mc-5'].includes(x.mainCategoryId))) {
        await platformPersistenceService.upsert(ProductTypeModel, pt);
      }
      for (const fc of this.categoryFilterConfigs) {
        await platformPersistenceService.upsert(CategoryFilterConfigModel, fc);
      }
      for (const col of this.newLaunchCollections) {
        await platformPersistenceService.upsert(NewLaunchCollectionModel, col);
      }
    }

    if (dbSnapshots.length > 0) {
      for (const snap of dbSnapshots) {
        if (snap?.tenantId) {
          // If an old persisted draft has pre-migration slugs or had no unpublished draft changes, refresh cleanly from reconciled live taxonomy
          const hasLegacyCement = Array.isArray(snap.childCategories) && snap.childCategories.some((c: any) => c.id === 'cat-1' && c.slug === 'cement-concrete');
          const hasLegacyFurniture = Array.isArray(snap.productTypes) && snap.productTypes.some((pt: any) => pt.id === 'sub-7-1');
          const hasLegacyElectrical = Array.isArray(snap.productTypes) && snap.productTypes.some((pt: any) => pt.id === 'sub-11-1');
          const hasLegacyPlumbing =
            (Array.isArray(snap.productTypes) && snap.productTypes.some((pt: any) => pt.id === 'sub-16-1')) ||
            (Array.isArray(snap.childCategories) &&
              snap.childCategories.some(
                (c: any) =>
                  (c.id === 'cat-19' && c.slug === 'water-storage-tanks') ||
                  (c.id === 'cat-18' && c.mainCategoryId === 'mc-4')
              ));
          this.publishMeta.set(snap.tenantId, {
            tenantId: snap.tenantId,
            hasUnpublishedChanges: Boolean(snap.hasUnpublishedChanges && !hasLegacyCement && !hasLegacyFurniture && !hasLegacyElectrical && !hasLegacyPlumbing),
            publishedVersion: Number(snap.publishedVersion || 1),
            draftVersion: Number(snap.draftVersion || 1),
            lastPublishedAt: snap.lastPublishedAt,
            lastPublishedBy: snap.lastPublishedBy,
            lastDraftSavedAt: snap.lastDraftSavedAt,
          });
          if (snap.hasUnpublishedChanges && !hasLegacyCement && !hasLegacyFurniture && !hasLegacyElectrical && !hasLegacyPlumbing) {
            if (!Array.isArray(snap.categoryFilterConfigs)) {
              snap.categoryFilterConfigs = this.cloneRecord(this.categoryFilterConfigs);
            }
            if (!Array.isArray(snap.deletedFilterConfigIds)) {
              snap.deletedFilterConfigIds = [];
            }
            this.drafts.set(snap.tenantId, snap);
          }
        }
      }
    }

    this.initialized = true;
    this.migrateLegacyCatalogRecords();
    this.syncDbStoreCategories();
    this.logger.log(
      `Taxonomy ready: ${this.mainCategories.length} Main, ${this.childCategories.length} Child, ${this.productTypes.length} Product Types, ${this.categoryFilterConfigs.length} Filter Configs.`
    );
  }

  private captureBaselineSeedSnapshot() {
    this.baselineMainCategories = this.cloneRecord(
      this.mainCategories.filter((m) => !m.tenantId || m.tenantId === GLOBAL_TENANT)
    );
    this.baselineChildCategories = this.cloneRecord(
      this.childCategories.filter((c) => !c.tenantId || c.tenantId === GLOBAL_TENANT)
    );
    this.baselineProductTypes = this.cloneRecord(
      this.productTypes.filter((pt) => !pt.tenantId || pt.tenantId === GLOBAL_TENANT)
    );
    this.baselineDesktopNav = this.cloneRecord(
      this.desktopNavigation.filter((n) => !n.tenantId || n.tenantId === GLOBAL_TENANT)
    );
    this.baselineFilterConfigs = this.cloneRecord(
      this.categoryFilterConfigs.filter((fc) => !fc.tenantId || fc.tenantId === GLOBAL_TENANT)
    );
  }

  public getFilterSyncVersion(tenantId = DEFAULT_TENANT): number {
    const cleanTenant = tenantId || DEFAULT_TENANT;
    return this.filterSyncVersions.get(cleanTenant) || 1;
  }

  public invalidateFilterCache(
    tenantId = DEFAULT_TENANT,
    scope?: { childCategoryId?: string; mainCategoryId?: string; newLaunchCollectionId?: string }
  ): number {
    const cleanTenant = tenantId || DEFAULT_TENANT;
    const nextVersion = (this.filterSyncVersions.get(cleanTenant) || 1) + 1;
    this.filterSyncVersions.set(cleanTenant, nextVersion);

    const targetChild = scope?.childCategoryId?.toLowerCase();
    const targetMain = scope?.mainCategoryId?.toLowerCase();
    const targetCol = scope?.newLaunchCollectionId?.toLowerCase();

    for (const key of Array.from(this.filterConfigCache.keys())) {
      if (!key.startsWith(`${cleanTenant}::`)) continue;
      if (
        !scope ||
        (!targetChild && !targetMain && !targetCol) ||
        key.includes('::MAIN:') ||
        (targetChild && key.includes(targetChild)) ||
        (targetMain && key.includes(targetMain)) ||
        (targetCol && key.includes(targetCol))
      ) {
        this.filterConfigCache.delete(key);
      }
    }
    return nextVersion;
  }

  private ensureTenantScopedFilterConfigs(cleanTenant: string) {
    if (!cleanTenant || cleanTenant === DEFAULT_TENANT || cleanTenant === GLOBAL_TENANT) {
      return;
    }
    if (this.tenantFilterBootstrapped.has(cleanTenant)) {
      return;
    }
    const hasOwn = this.categoryFilterConfigs.some((fc) => fc.tenantId === cleanTenant);
    if (!hasOwn) {
      if (this.baselineFilterConfigs.length === 0) {
        this.captureBaselineSeedSnapshot();
      }
      const source =
        this.baselineFilterConfigs.length > 0
          ? this.baselineFilterConfigs
          : this.categoryFilterConfigs.filter((fc) => !fc.tenantId || fc.tenantId === GLOBAL_TENANT);
      const deletedSet = this.deletedFilterIdsByTenant.get(cleanTenant);
      for (const baseCfg of source) {
        const scopedId = `${cleanTenant}::${baseCfg.id}`;
        if (deletedSet?.has(baseCfg.id) || deletedSet?.has(scopedId)) continue;
        this.categoryFilterConfigs.push({
          ...this.cloneRecord(baseCfg),
          id: scopedId,
          tenantId: cleanTenant,
        });
      }
    }
    this.tenantFilterBootstrapped.add(cleanTenant);
  }

  private recordDeletedFilterTombstone(tenantId: string, scopeId?: string, id?: string) {
    const cleanTenant = tenantId || DEFAULT_TENANT;
    let set = this.deletedFilterIdsByTenant.get(cleanTenant);
    if (!set) {
      set = new Set<string>();
      this.deletedFilterIdsByTenant.set(cleanTenant, set);
    }
    if (id) set.add(id);
    if (scopeId) set.add(`scope:${scopeId.toLowerCase()}`);
  }

  private hasDeletedFilterTombstones(tenantId: string, scopeId?: string): boolean {
    if (!scopeId) return false;
    const cleanTenant = tenantId || DEFAULT_TENANT;
    return Boolean(this.deletedFilterIdsByTenant.get(cleanTenant)?.has(`scope:${scopeId.toLowerCase()}`));
  }

  private ensureTenantIsolatedPool(cleanTenant: string) {
    let existing = this.tenantIsolatedPools.get(cleanTenant);
    if (existing) return existing;

    if (this.baselineMainCategories.length === 0) {
      this.captureBaselineSeedSnapshot();
    }

    const baseMains = this.cloneRecord(this.baselineMainCategories).map((m) => ({ ...m, tenantId: cleanTenant }));
    const baseChildren = this.cloneRecord(this.baselineChildCategories).map((c) => ({ ...c, tenantId: cleanTenant }));
    const baseTypes = this.cloneRecord(this.baselineProductTypes).map((pt) => ({ ...pt, tenantId: cleanTenant }));

    for (const m of this.mainCategories.filter((x) => x.tenantId === cleanTenant)) {
      this.upsertArrayById(baseMains, m);
    }
    for (const c of this.childCategories.filter((x) => x.tenantId === cleanTenant)) {
      this.upsertArrayById(baseChildren, c);
    }
    for (const pt of this.productTypes.filter((x) => x.tenantId === cleanTenant)) {
      this.upsertArrayById(baseTypes, pt);
    }

    existing = {
      mainCategories: baseMains,
      childCategories: baseChildren,
      productTypes: baseTypes,
    };
    this.tenantIsolatedPools.set(cleanTenant, existing);
    return existing;
  }

  private upsertPublishedMain(cleanTenant: string, record: MainCategory) {
    if (cleanTenant !== DEFAULT_TENANT) {
      const iso = this.ensureTenantIsolatedPool(cleanTenant);
      this.upsertArrayById(iso.mainCategories, { ...record, tenantId: cleanTenant });
      return;
    }
    this.upsertArrayById(this.mainCategories, record);
  }

  private upsertPublishedChild(cleanTenant: string, record: ChildCategory) {
    if (cleanTenant !== DEFAULT_TENANT) {
      const iso = this.ensureTenantIsolatedPool(cleanTenant);
      this.upsertArrayById(iso.childCategories, { ...record, tenantId: cleanTenant });
      return;
    }
    this.upsertArrayById(this.childCategories, record);
  }

  private removePublishedMain(cleanTenant: string, id: string) {
    if (cleanTenant !== DEFAULT_TENANT) {
      const iso = this.ensureTenantIsolatedPool(cleanTenant);
      iso.mainCategories = iso.mainCategories.filter((m) => m.id !== id);
      return;
    }
    this.mainCategories = this.mainCategories.filter((m) => m.id !== id);
  }

  private removePublishedChild(cleanTenant: string, id: string) {
    if (cleanTenant !== DEFAULT_TENANT) {
      const iso = this.ensureTenantIsolatedPool(cleanTenant);
      iso.childCategories = iso.childCategories.filter((c) => c.id !== id);
      return;
    }
    this.childCategories = this.childCategories.filter((c) => c.id !== id);
  }

  private removePublishedType(cleanTenant: string, id: string) {
    if (cleanTenant !== DEFAULT_TENANT) {
      const iso = this.ensureTenantIsolatedPool(cleanTenant);
      iso.productTypes = iso.productTypes.filter((pt) => pt.id !== id);
      return;
    }
    this.productTypes = this.productTypes.filter((pt) => pt.id !== id);
  }

  private upsertPublishedType(cleanTenant: string, record: ProductTypeNode) {
    if (cleanTenant !== DEFAULT_TENANT) {
      const iso = this.ensureTenantIsolatedPool(cleanTenant);
      this.upsertArrayById(iso.productTypes, { ...record, tenantId: cleanTenant });
      return;
    }
    this.upsertArrayById(this.productTypes, record);
  }

  public getTenantPool(tenantId = DEFAULT_TENANT) {
    const cleanTenant = tenantId || DEFAULT_TENANT;
    if (cleanTenant !== DEFAULT_TENANT) {
      const iso = this.ensureTenantIsolatedPool(cleanTenant);
      return {
        mainCategories: [...iso.mainCategories].sort((a, b) => a.sortOrder - b.sortOrder),
        childCategories: [...iso.childCategories].sort((a, b) => a.sortOrder - b.sortOrder),
        productTypes: [...iso.productTypes].sort((a, b) => a.sortOrder - b.sortOrder),
      };
    }
    const mains = this.mainCategories.filter(
      (m) => !m.tenantId || m.tenantId === GLOBAL_TENANT || m.tenantId === cleanTenant
    );
    const children = this.childCategories.filter(
      (c) => !c.tenantId || c.tenantId === GLOBAL_TENANT || c.tenantId === cleanTenant
    );
    const types = this.productTypes.filter(
      (pt) => !pt.tenantId || pt.tenantId === GLOBAL_TENANT || pt.tenantId === cleanTenant
    );
    return {
      mainCategories: mains.sort((a, b) => a.sortOrder - b.sortOrder),
      childCategories: children.sort((a, b) => a.sortOrder - b.sortOrder),
      productTypes: types.sort((a, b) => a.sortOrder - b.sortOrder),
    };
  }

  public getInactiveNavMainCategoryIds(tenantId = DEFAULT_TENANT): Set<string> {
    const navs = this.getPublishedDesktopNavigation(tenantId, true);
    const byMain = new Map<string, DesktopNavItem[]>();
    for (const n of navs) {
      if (n.itemType === 'MAIN_CATEGORY' && n.mainCategoryId) {
        const list = byMain.get(n.mainCategoryId) || [];
        list.push(n);
        byMain.set(n.mainCategoryId, list);
      }
    }
    const disabledIds = new Set<string>();
    for (const [mainId, list] of byMain.entries()) {
      if (list.length > 0 && list.every((n) => n.isActive === false)) {
        disabledIds.add(mainId);
      }
    }
    return disabledIds;
  }

  public isMainCategoryActiveForPortals(tenantId = DEFAULT_TENANT, mainCategoryId?: string): boolean {
    if (!mainCategoryId) return false;
    const pool = this.getTenantPool(tenantId);
    const mc = pool.mainCategories.find((m) => m.id === mainCategoryId);
    if (!mc || mc.isActive === false) return false;
    const inactiveByNav = this.getInactiveNavMainCategoryIds(tenantId);
    return !inactiveByNav.has(mc.id);
  }

  /**
   * Authoritative 4-level parent-child effective status check for Customer discovery & Vendor selection.
   * Ensures any product/reference under an inactive Main Category, inactive Desktop Nav link,
   * inactive Category Group (ChildCategory), or inactive Child Category (ProductTypeNode) is treated as inactive.
   */
  public isProductCategoryHierarchyActive(product: any, tenantId = DEFAULT_TENANT): boolean {
    if (!product) return false;
    const cleanTenant = tenantId || DEFAULT_TENANT;
    const pool = this.getTenantPool(cleanTenant);

    const rawChild = String(
      product.childCategoryId || product.categoryId || product.childCategorySlug || product.categorySlug || product.category || ''
    ).trim().toLowerCase();
    const rawType = String(
      product.productTypeId || product.subcategoryId || product.productTypeSlug || product.subcategorySlug || product.subcategory || ''
    ).trim().toLowerCase();
    const rawMain = String(product.mainCategoryId || product.mainCategorySlug || product.mainCategoryName || '').trim().toLowerCase();

    const childNeedle = LEGACY_CATEGORY_SLUG_ALIASES[rawChild] || rawChild;
    const typeNeedle = LEGACY_PRODUCT_TYPE_SLUG_ALIASES[rawType] || rawType;

    // 1. Direct explicit ID checks first so inactive IDs are never masked by fallback resolution
    if (product.mainCategoryId) {
      const explicitMain = pool.mainCategories.find((m) => m.id === product.mainCategoryId);
      if (explicitMain && !this.isMainCategoryActiveForPortals(cleanTenant, explicitMain.id)) {
        return false;
      }
    }
    if (product.childCategoryId || product.categoryId) {
      const explicitChildId = product.childCategoryId || product.categoryId;
      const explicitChild = pool.childCategories.find((c) => c.id === explicitChildId);
      if (explicitChild) {
        if (explicitChild.isActive === false) return false;
        if (!this.isMainCategoryActiveForPortals(cleanTenant, explicitChild.mainCategoryId)) return false;
      }
    }
    if (product.productTypeId || product.subcategoryId) {
      const explicitTypeId = product.productTypeId || product.subcategoryId;
      const explicitType = pool.productTypes.find((pt) => pt.id === explicitTypeId);
      if (explicitType) {
        if (explicitType.isActive === false) return false;
        const parentGroup = pool.childCategories.find((c) => c.id === explicitType.childCategoryId);
        if (!parentGroup || parentGroup.isActive === false) return false;
        if (!this.isMainCategoryActiveForPortals(cleanTenant, parentGroup.mainCategoryId)) return false;
      }
    }

    // 2. Canonical slug/name lookup across the full active hierarchy chain
    const matchedChild = childNeedle
      ? pool.childCategories.find(
          (c) =>
            c.id.toLowerCase() === childNeedle ||
            c.slug.toLowerCase() === childNeedle ||
            c.name.trim().toLowerCase() === childNeedle
        )
      : undefined;

    const matchedMain =
      (rawMain
        ? pool.mainCategories.find(
            (m) =>
              m.id.toLowerCase() === rawMain ||
              m.slug.toLowerCase() === rawMain ||
              m.name.trim().toLowerCase() === rawMain
          )
        : undefined) ||
      (matchedChild ? pool.mainCategories.find((m) => m.id === matchedChild.mainCategoryId) : undefined);

    if (!matchedMain || !this.isMainCategoryActiveForPortals(cleanTenant, matchedMain.id)) {
      return false;
    }

    if (matchedChild) {
      if (matchedChild.isActive === false) return false;
      if (matchedChild.mainCategoryId !== matchedMain.id) return false;
    }

    if (typeNeedle) {
      const matchedType = pool.productTypes.find(
        (pt) =>
          (!matchedChild || pt.childCategoryId === matchedChild.id) &&
          (pt.id.toLowerCase() === typeNeedle ||
            pt.slug.toLowerCase() === typeNeedle ||
            pt.name.trim().toLowerCase() === typeNeedle)
      );
      if (matchedType && matchedType.isActive === false) {
        return false;
      }
    }

    return true;
  }

  public getPublishedDesktopNavigation(tenantId = DEFAULT_TENANT, includeHidden = false): DesktopNavItem[] {
    const cleanTenant = tenantId || DEFAULT_TENANT;
    const pool = this.getTenantPool(cleanTenant);
    const sourceNavs =
      cleanTenant === DEFAULT_TENANT
        ? this.desktopNavigation.filter((n) => !n.tenantId || n.tenantId === GLOBAL_TENANT || n.tenantId === cleanTenant)
        : [
            ...(this.baselineDesktopNav.length > 0
              ? this.baselineDesktopNav
              : this.desktopNavigation.filter((n) => !n.tenantId || n.tenantId === GLOBAL_TENANT)),
            ...this.desktopNavigation.filter((n) => n.tenantId === cleanTenant),
          ];
    const tenantSpecific = sourceNavs.filter((n) => n.tenantId === cleanTenant);
    const globalItems = sourceNavs.filter((n) => !n.tenantId || n.tenantId === GLOBAL_TENANT);
    const mergedMap = new Map<string, DesktopNavItem>();
    for (const g of globalItems) {
      mergedMap.set(g.id, g);
    }
    for (const t of tenantSpecific) {
      const baseKey = t.id.startsWith(`${cleanTenant}::`) ? t.id.slice(cleanTenant.length + 2) : t.id;
      mergedMap.set(baseKey, t);
    }
    const baseItems = Array.from(mergedMap.values());

    const hydrated = baseItems.map((nav) => {
      if (nav.itemType === 'MAIN_CATEGORY' && nav.mainCategoryId) {
        const linkedMain = pool.mainCategories.find((m) => m.id === nav.mainCategoryId);
        if (linkedMain) {
          return {
            ...nav,
            mainCategorySlug: linkedMain.slug,
            route:
              nav.childCategoryId || nav.productTypeId
                ? nav.route
                : `/categories/${linkedMain.slug}`,
          };
        }
      }
      return nav;
    });

    return hydrated
      .filter((nav) => {
        if (includeHidden) return true;
        if (nav.isActive === false || nav.isVisible === false) return false;
        if (nav.itemType === 'MAIN_CATEGORY' && nav.mainCategoryId) {
          const linkedMain = pool.mainCategories.find((m) => m.id === nav.mainCategoryId);
          if (!linkedMain || linkedMain.isActive === false || linkedMain.showInNavigation === false) {
            return false;
          }
          if (nav.childCategoryId) {
            const linkedChild = pool.childCategories.find((c) => c.id === nav.childCategoryId);
            if (!linkedChild || linkedChild.isActive === false || linkedChild.mainCategoryId !== linkedMain.id) {
              return false;
            }
          }
          if (nav.productTypeId) {
            const linkedType = pool.productTypes.find((pt) => pt.id === nav.productTypeId);
            if (
              !linkedType ||
              linkedType.isActive === false ||
              (nav.childCategoryId && linkedType.childCategoryId !== nav.childCategoryId)
            ) {
              return false;
            }
          }
        }
        return true;
      })
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  public getPublishMetadata(tenantId = DEFAULT_TENANT): CatalogPublishMetadata {
    const cleanTenant = tenantId || DEFAULT_TENANT;
    const existing = this.publishMeta.get(cleanTenant);
    if (existing) return existing;
    const draft = this.drafts.get(cleanTenant);
    const meta: CatalogPublishMetadata = {
      tenantId: cleanTenant,
      hasUnpublishedChanges: Boolean(draft?.hasUnpublishedChanges),
      publishedVersion: Number(draft?.publishedVersion || 1),
      draftVersion: Number(draft?.draftVersion || 1),
      lastPublishedAt: draft?.lastPublishedAt,
      lastPublishedBy: draft?.lastPublishedBy,
      lastDraftSavedAt: draft?.lastDraftSavedAt,
    };
    this.publishMeta.set(cleanTenant, meta);
    return meta;
  }

  private cloneRecord<T>(val: T): T {
    return JSON.parse(JSON.stringify(val));
  }

  public getDraftState(tenantId = DEFAULT_TENANT): TenantCatalogDraft {
    const cleanTenant = tenantId || DEFAULT_TENANT;
    this.ensureTenantScopedFilterConfigs(cleanTenant);
    const existing = this.drafts.get(cleanTenant);
    if (existing) return existing;

    const pool = this.getTenantPool(cleanTenant);
    const navs = this.getPublishedDesktopNavigation(cleanTenant, true);
    const filterCfgs = this.categoryFilterConfigs.filter((fc) =>
      cleanTenant === DEFAULT_TENANT
        ? !fc.tenantId || fc.tenantId === GLOBAL_TENANT || fc.tenantId === cleanTenant
        : fc.tenantId === cleanTenant
    );
    const meta = this.getPublishMetadata(cleanTenant);
    const draft: TenantCatalogDraft = {
      tenantId: cleanTenant,
      mainCategories: this.cloneRecord(pool.mainCategories),
      childCategories: this.cloneRecord(pool.childCategories),
      productTypes: this.cloneRecord(pool.productTypes),
      desktopNavigation: this.cloneRecord(navs),
      categoryFilterConfigs: this.cloneRecord(filterCfgs),
      deletedMainIds: [],
      deletedChildIds: [],
      deletedProductTypeIds: [],
      deletedNavIds: [],
      deletedFilterConfigIds: [],
      hasUnpublishedChanges: meta.hasUnpublishedChanges,
      publishedVersion: meta.publishedVersion,
      draftVersion: meta.draftVersion,
      lastPublishedAt: meta.lastPublishedAt,
      lastPublishedBy: meta.lastPublishedBy,
      lastDraftSavedAt: meta.lastDraftSavedAt,
    };
    this.drafts.set(cleanTenant, draft);
    return draft;
  }

  private async persistDraftSnapshot(draft: TenantCatalogDraft) {
    this.publishMeta.set(draft.tenantId, {
      tenantId: draft.tenantId,
      hasUnpublishedChanges: draft.hasUnpublishedChanges,
      publishedVersion: draft.publishedVersion,
      draftVersion: draft.draftVersion,
      lastPublishedAt: draft.lastPublishedAt,
      lastPublishedBy: draft.lastPublishedBy,
      lastDraftSavedAt: draft.lastDraftSavedAt,
    });
    await platformPersistenceService.upsert(CatalogPublishSnapshotModel, {
      id: `draft-${draft.tenantId}`,
      ...draft,
    });
  }

  /**
   * Resolves brandId from brand name/slug consistently.
   */
  public resolveBrandId(brandNameOrSlug?: string): string {
    const needle = (brandNameOrSlug || '').trim().toLowerCase();
    if (!needle) return '';
    const match = (dbStore.brands || MASTER_BRANDS).find(
      (b: any) =>
        b.id?.toLowerCase() === needle ||
        b.slug?.toLowerCase() === needle ||
        b.name?.toLowerCase() === needle
    );
    return match?.id || `brand-${needle.replace(/[^a-z0-9]+/g, '-')}`;
  }

  /**
   * Validates and resolves full 4-level hierarchy for product creation/update/sync.
   */
  public resolveAndValidateProductTaxonomy(
    input: {
      mainCategoryId?: string;
      mainCategorySlug?: string;
      mainCategoryName?: string;
      childCategoryId?: string;
      categoryId?: string;
      categorySlug?: string;
      category?: string;
      categoryName?: string;
      productTypeId?: string;
      productTypeSlug?: string;
      productTypeName?: string;
      subcategoryId?: string;
      subcategorySlug?: string;
      subcategory?: string;
      subCategory?: string;
      brand?: string;
      brandId?: string;
    },
    options: { strictChildMatch?: boolean; tenantId?: string } = {}
  ) {
    const pool = this.getTenantPool(options.tenantId);
    const mainInput = input.mainCategoryId || input.mainCategorySlug || input.mainCategoryName;
    const childInput =
      input.childCategoryId ||
      input.categoryId ||
      input.categorySlug ||
      input.category ||
      input.categoryName;
    const typeInput =
      input.productTypeId ||
      input.productTypeSlug ||
      input.productTypeName ||
      input.subcategoryId ||
      input.subcategorySlug ||
      input.subcategory ||
      input.subCategory;

    const resolved = resolveFullTaxonomy(
      { mainInput, childInput, typeInput },
      {
        mainCategories: pool.mainCategories,
        childCategories: pool.childCategories,
        productTypes: pool.productTypes,
      }
    );

    if (options.strictChildMatch) {
      if (!resolved.mainCategory || !resolved.childCategory) {
        throw new BadRequestException(
          'Valid Main Category and Child Category belonging to it are required.'
        );
      }
      if (resolved.childCategory.mainCategoryId !== resolved.mainCategory.id) {
        throw new BadRequestException(
          `Child category "${resolved.childCategory.name}" does not belong to Main Category "${resolved.mainCategory.name}".`
        );
      }
      if (typeInput && !resolved.productType) {
        throw new BadRequestException(
          `Product Type "${typeInput}" does not belong to Child Category "${resolved.childCategory.name}".`
        );
      }
    }

    const fallbackChild =
      resolved.childCategory ||
      (resolved.mainCategory
        ? pool.childCategories.find((c) => c.mainCategoryId === resolved.mainCategory!.id) || null
        : null);
    const fallbackType =
      resolved.productType ||
      (fallbackChild
        ? pool.productTypes.find((pt) => pt.childCategoryId === fallbackChild.id) || null
        : null);
    const finalMain =
      resolved.mainCategory ||
      (fallbackChild
        ? pool.mainCategories.find((m) => m.id === fallbackChild.mainCategoryId) || null
        : null);

    return {
      mainCategoryId: finalMain?.id || '',
      mainCategorySlug: finalMain?.slug || '',
      mainCategoryName: finalMain?.name || '',
      childCategoryId: fallbackChild?.id || '',
      childCategorySlug: fallbackChild?.slug || '',
      childCategoryName: fallbackChild?.name || '',
      productTypeId: fallbackType?.id || '',
      productTypeSlug: fallbackType?.slug || '',
      productTypeName: fallbackType?.name || '',
      brandId: input.brandId || this.resolveBrandId(input.brand),
    };
  }

  /**
   * Safely migrates all existing dbStore.products and legacy vendorProducts records
   * to include full 4-level taxonomy IDs without deleting or altering prices, stock, or ownership.
   */
  public migrateLegacyCatalogRecords(extraVendorProducts: any[] = []): TaxonomyMigrationRecord[] {
    const records: TaxonomyMigrationRecord[] = [];
    const seen = new Set<string>();

    const migrateItem = (p: any) => {
      if (!p || !p.id) return;
      const prevCat = p.categorySlug || p.category || '';
      const prevSub = p.subcategorySlug || p.subcategory || '';
      const resolved = this.resolveAndValidateProductTaxonomy(p, { strictChildMatch: false });

      if (resolved.mainCategoryId && resolved.childCategoryId) {
        p.mainCategoryId = resolved.mainCategoryId;
        p.mainCategorySlug = resolved.mainCategorySlug;
        p.mainCategoryName = resolved.mainCategoryName;
        p.childCategoryId = resolved.childCategoryId;
        p.childCategorySlug = resolved.childCategorySlug;
        p.childCategoryName = resolved.childCategoryName;
        p.productTypeId = resolved.productTypeId;
        p.productTypeSlug = resolved.productTypeSlug;
        p.productTypeName = resolved.productTypeName;
        p.brandId = resolved.brandId || p.brandId;
        // Preserve backward-compatible fields cleanly
        p.categoryId = resolved.childCategoryId;
        p.categorySlug = resolved.childCategorySlug;
        p.category = resolved.childCategoryName;
        if (resolved.productTypeId) {
          p.subcategoryId = resolved.productTypeId;
          p.subcategorySlug = resolved.productTypeSlug;
          p.subcategory = resolved.productTypeName;
        }
      }

      if (!seen.has(p.id)) {
        seen.add(p.id);
        records.push({
          productId: p.id,
          sku: p.sku || '',
          previousCategory: prevCat,
          previousSubcategory: prevSub,
          mainCategoryId: p.mainCategoryId || '',
          childCategoryId: p.childCategoryId || '',
          productTypeId: p.productTypeId || '',
          status: p.mainCategoryId && p.childCategoryId ? 'MIGRATED' : 'UNMAPPED',
        });
      }
    };

    for (const p of dbStore.products) migrateItem(p);
    for (const vp of extraVendorProducts) migrateItem(vp);

    this.migrationRecords = records;
    return records;
  }

  /**
   * Synchronizes dbStore.categories with ChildCategory + ProductType records
   * so existing category endpoints remain live & consistent when Admin edits taxonomy.
   */
  public syncDbStoreCategories(tenantId = DEFAULT_TENANT) {
    if (tenantId !== DEFAULT_TENANT) return;
    const pool = this.getTenantPool(tenantId);
    dbStore.categories = pool.childCategories
      .filter((c) => c.isActive !== false)
      .map((child) => {
        const types = pool.productTypes
          .filter((pt) => pt.childCategoryId === child.id && pt.isActive !== false)
          .map((pt) => ({
            id: pt.id,
            name: pt.name,
            slug: pt.slug,
            categorySlug: child.slug,
            mainCategoryId: child.mainCategoryId,
            childCategoryId: child.id,
            sortOrder: pt.sortOrder,
            isActive: pt.isActive,
          }));
        return {
          id: child.id,
          name: child.name,
          slug: child.slug,
          icon: child.icon || 'Layers',
          image: child.image || '',
          description: child.description || '',
          mainCategoryId: child.mainCategoryId,
          sortOrder: child.sortOrder,
          isActive: child.isActive,
          subcategories: types,
        } as any;
      });
  }

  private toSlug(raw: string): string {
    return String(raw || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  private resolveNavTenantId(tenantId: string): string {
    return tenantId || DEFAULT_TENANT;
  }

  private ensureTenantScopedNavItemsPublished(cleanTenant: string) {
    // Default tenant edits base nav rows directly; non-default tenants clone from baseline into tenant-scoped rows
    const hasOwn = this.desktopNavigation.some((n) => n.tenantId === cleanTenant);
    if (!hasOwn && cleanTenant !== DEFAULT_TENANT) {
      const globals =
        this.baselineDesktopNav.length > 0
          ? this.baselineDesktopNav
          : this.desktopNavigation.filter((n) => !n.tenantId || n.tenantId === GLOBAL_TENANT);
      for (const g of globals) {
        const cloned: DesktopNavItem = {
          ...this.cloneRecord(g),
          id: `${cleanTenant}::${g.id}`,
          tenantId: cleanTenant,
        };
        this.desktopNavigation.push(cloned);
      }
    }
  }

  private upsertArrayById<T extends { id: string }>(arr: T[], record: T) {
    const idx = arr.findIndex((item) => item.id === record.id);
    if (idx >= 0) arr[idx] = this.cloneRecord(record);
    else arr.push(this.cloneRecord(record));
  }

  // ==================== DESKTOP NAVIGATION MANAGEMENT ====================

  async createDesktopNavItem(
    tenantId: string,
    payload: Partial<DesktopNavItem> & { saveAsDraft?: boolean }
  ): Promise<DesktopNavItem> {
    const cleanTenant = this.resolveNavTenantId(tenantId);
    const label = String(payload.label || '').trim();
    if (!label) throw new BadRequestException('Navigation label is required.');
    const slug = this.toSlug(payload.slug || label);
    if (!slug) throw new BadRequestException('Valid navigation slug could not be generated.');

    const draft = this.getDraftState(cleanTenant);
    if (
      draft.desktopNavigation.some(
        (n) => n.label.toLowerCase() === label.toLowerCase() || n.slug.toLowerCase() === slug.toLowerCase()
      )
    ) {
      throw new BadRequestException(`Navigation item "${label}" (${slug}) already exists.`);
    }

    const itemType: DesktopNavItemType = payload.itemType || (payload.mainCategoryId ? 'MAIN_CATEGORY' : 'CUSTOM_LINK');
    let mainCategoryId = payload.mainCategoryId?.trim() || undefined;
    let mainCategorySlug = payload.mainCategorySlug?.trim() || undefined;
    let childCategoryId = payload.childCategoryId?.trim() || undefined;
    let productTypeId = payload.productTypeId?.trim() || undefined;
    let route = String(payload.route || '').trim();

    if (itemType === 'MAIN_CATEGORY') {
      if (!mainCategoryId) throw new BadRequestException('Assign a Main Category for this navigation item.');
      const linkedMain = draft.mainCategories.find((m) => m.id === mainCategoryId || m.slug === mainCategoryId);
      if (!linkedMain) throw new BadRequestException(`Main Category "${mainCategoryId}" not found.`);
      mainCategoryId = linkedMain.id;
      mainCategorySlug = linkedMain.slug;
      const linkedGroup = childCategoryId
        ? draft.childCategories.find(
            (c) => c.mainCategoryId === linkedMain.id && (c.id === childCategoryId || c.slug === childCategoryId)
          )
        : undefined;
      childCategoryId = linkedGroup?.id;
      const linkedType = productTypeId
        ? draft.productTypes.find(
            (pt) =>
              pt.mainCategoryId === linkedMain.id &&
              (!linkedGroup || pt.childCategoryId === linkedGroup.id) &&
              (pt.id === productTypeId || pt.slug === productTypeId)
          )
        : undefined;
      productTypeId = linkedType?.id;
      route = linkedType
        ? `/categories/${linkedGroup?.slug || linkedMain.slug}?productType=${encodeURIComponent(linkedType.slug)}`
        : linkedGroup
          ? `/categories/${linkedGroup.slug}`
          : `/categories/${linkedMain.slug}`;
    } else if (itemType === 'HOME') {
      route = '/';
      childCategoryId = undefined;
      productTypeId = undefined;
    } else if (itemType === 'NEW_LAUNCHES') {
      route = '/new-launches';
      childCategoryId = undefined;
      productTypeId = undefined;
    } else if (itemType === 'DEALS') {
      route = '/deals';
      childCategoryId = undefined;
      productTypeId = undefined;
    } else {
      const isInternal = route.startsWith('/');
      let isExternal = false;
      if (!isInternal && /^https?:\/\//i.test(route)) {
        try {
          new URL(route);
          isExternal = true;
        } catch {
          isExternal = false;
        }
      }
      if (!route || (!isInternal && !isExternal)) {
        throw new BadRequestException(
          'Custom navigation destination must start with "/" or be a valid http(s):// URL.'
        );
      }
      mainCategoryId = undefined;
      mainCategorySlug = undefined;
      childCategoryId = undefined;
      productTypeId = undefined;
    }

    const now = new Date().toISOString();
    const record: DesktopNavItem = {
      id: `nav-${cleanTenant === DEFAULT_TENANT ? '' : `${cleanTenant}-`}${Date.now()}`,
      tenantId: cleanTenant,
      label,
      slug,
      itemType,
      mainCategoryId,
      mainCategorySlug,
      childCategoryId,
      productTypeId,
      route,
      icon: payload.icon?.trim() || (itemType === 'HOME' ? 'Home' : itemType === 'DEALS' ? 'Sparkles' : itemType === 'NEW_LAUNCHES' ? 'Rocket' : MAIN_CATEGORY_NAV_ICONS[mainCategorySlug || ''] || 'Layers'),
      hasDropdown: payload.hasDropdown !== undefined ? Boolean(payload.hasDropdown) : itemType === 'MAIN_CATEGORY' || itemType === 'NEW_LAUNCHES',
      highlight: payload.highlight !== undefined ? Boolean(payload.highlight) : itemType === 'DEALS',
      displayOrder: Math.max(1, Number(payload.displayOrder ?? draft.desktopNavigation.length + 1)),
      isVisible: payload.isVisible !== undefined ? Boolean(payload.isVisible) : payload.isActive !== false,
      isActive: payload.isActive !== false,
      createdAt: now,
      updatedAt: now,
    };

    draft.desktopNavigation.push(record);
    draft.desktopNavigation.sort((a, b) => a.displayOrder - b.displayOrder);
    draft.draftVersion += 1;
    draft.lastDraftSavedAt = now;

    if (payload.saveAsDraft) {
      draft.hasUnpublishedChanges = true;
      await this.persistDraftSnapshot(draft);
      return this.cloneRecord(record);
    }

    this.ensureTenantScopedNavItemsPublished(cleanTenant);
    const pubRecord: DesktopNavItem = {
      ...record,
      tenantId: cleanTenant === DEFAULT_TENANT ? GLOBAL_TENANT : cleanTenant,
    };
    this.upsertArrayById(this.desktopNavigation, pubRecord);
    draft.publishedVersion += 1;
    draft.lastPublishedAt = now;
    await platformPersistenceService.upsert(DesktopNavItemModel, pubRecord);
    await this.persistDraftSnapshot(draft);
    return this.cloneRecord(record);
  }

  async updateDesktopNavItem(
    tenantId: string,
    id: string,
    updates: Partial<DesktopNavItem> & { saveAsDraft?: boolean }
  ): Promise<DesktopNavItem> {
    const cleanTenant = this.resolveNavTenantId(tenantId);
    const draft = this.getDraftState(cleanTenant);
    const existing = draft.desktopNavigation.find((n) => n.id === id || n.id === `${cleanTenant}::${id}`);
    if (!existing) throw new BadRequestException(`Navigation item ${id} not found.`);

    if (updates.label !== undefined) {
      const nextLabel = updates.label.trim();
      if (!nextLabel) throw new BadRequestException('Navigation label cannot be empty.');
      if (
        draft.desktopNavigation.some(
          (n) => n.id !== existing.id && n.label.toLowerCase() === nextLabel.toLowerCase()
        )
      ) {
        throw new BadRequestException(`Navigation label "${nextLabel}" already exists.`);
      }
      existing.label = nextLabel;
    }
    if (updates.slug !== undefined) {
      const nextSlug = this.toSlug(updates.slug);
      if (!nextSlug) throw new BadRequestException('Navigation slug cannot be empty.');
      if (
        draft.desktopNavigation.some(
          (n) => n.id !== existing.id && n.slug.toLowerCase() === nextSlug.toLowerCase()
        )
      ) {
        throw new BadRequestException(`Navigation slug "${nextSlug}" already exists.`);
      }
      existing.slug = nextSlug;
    }
    if (updates.itemType !== undefined) {
      existing.itemType = updates.itemType;
      if (updates.itemType === 'CUSTOM_LINK') {
        existing.mainCategoryId = undefined;
        existing.mainCategorySlug = undefined;
        existing.childCategoryId = undefined;
        existing.productTypeId = undefined;
        existing.hasDropdown = false;
      } else if (updates.itemType === 'MAIN_CATEGORY') {
        existing.hasDropdown = true;
      }
    }
    if (updates.mainCategoryId !== undefined) {
      if (updates.mainCategoryId) {
        const mc = draft.mainCategories.find(
          (m) => m.id === updates.mainCategoryId || m.slug === updates.mainCategoryId
        );
        if (!mc) throw new BadRequestException(`Main Category "${updates.mainCategoryId}" not found.`);
        existing.mainCategoryId = mc.id;
        existing.mainCategorySlug = mc.slug;
        existing.childCategoryId = undefined;
        existing.productTypeId = undefined;
        if (existing.itemType === 'MAIN_CATEGORY') {
          existing.route = `/categories/${mc.slug}`;
        }
      } else {
        existing.mainCategoryId = undefined;
        existing.mainCategorySlug = undefined;
        existing.childCategoryId = undefined;
        existing.productTypeId = undefined;
      }
    }
    if (updates.childCategoryId !== undefined) {
      if (updates.childCategoryId && existing.mainCategoryId) {
        const cc = draft.childCategories.find(
          (c) => c.mainCategoryId === existing.mainCategoryId && (c.id === updates.childCategoryId || c.slug === updates.childCategoryId)
        );
        existing.childCategoryId = cc?.id;
        if (cc && existing.itemType === 'MAIN_CATEGORY') {
          existing.route = `/categories/${cc.slug}`;
        }
      } else {
        existing.childCategoryId = undefined;
        existing.productTypeId = undefined;
        if (existing.itemType === 'MAIN_CATEGORY' && existing.mainCategorySlug) {
          existing.route = `/categories/${existing.mainCategorySlug}`;
        }
      }
    }
    if (updates.productTypeId !== undefined) {
      if (updates.productTypeId && existing.mainCategoryId) {
        const pt = draft.productTypes.find(
          (p) =>
            p.mainCategoryId === existing.mainCategoryId &&
            (!existing.childCategoryId || p.childCategoryId === existing.childCategoryId) &&
            (p.id === updates.productTypeId || p.slug === updates.productTypeId)
        );
        existing.productTypeId = pt?.id;
        const grp = pt ? draft.childCategories.find((c) => c.id === pt.childCategoryId) : undefined;
        if (pt && existing.itemType === 'MAIN_CATEGORY') {
          existing.route = `/categories/${grp?.slug || existing.mainCategorySlug}?productType=${encodeURIComponent(pt.slug)}`;
        }
      } else {
        existing.productTypeId = undefined;
      }
    }
    if (updates.route !== undefined && existing.itemType === 'CUSTOM_LINK') {
      const nextRoute = String(updates.route).trim();
      const isInternal = nextRoute.startsWith('/');
      let isExternal = false;
      if (!isInternal && /^https?:\/\//i.test(nextRoute)) {
        try {
          new URL(nextRoute);
          isExternal = true;
        } catch {
          isExternal = false;
        }
      }
      if (!nextRoute || (!isInternal && !isExternal)) {
        throw new BadRequestException(
          'Custom navigation destination must start with "/" or be a valid http(s):// URL.'
        );
      }
      existing.route = nextRoute;
    }
    if (updates.icon !== undefined) existing.icon = updates.icon.trim();
    if (updates.hasDropdown !== undefined) existing.hasDropdown = Boolean(updates.hasDropdown);
    if (updates.highlight !== undefined) existing.highlight = Boolean(updates.highlight);
    if (updates.displayOrder !== undefined) existing.displayOrder = Math.max(1, Number(updates.displayOrder) || 1);
    if (updates.isActive !== undefined) {
      existing.isActive = Boolean(updates.isActive);
      if (updates.isVisible === undefined) {
        existing.isVisible = Boolean(updates.isActive);
      }
    }
    if (updates.isVisible !== undefined) existing.isVisible = Boolean(updates.isVisible);

    const now = new Date().toISOString();
    existing.updatedAt = now;
    draft.desktopNavigation.sort((a, b) => a.displayOrder - b.displayOrder);
    draft.draftVersion += 1;
    draft.lastDraftSavedAt = now;

    if (updates.saveAsDraft) {
      draft.hasUnpublishedChanges = true;
      await this.persistDraftSnapshot(draft);
      return this.cloneRecord(existing);
    }

    this.ensureTenantScopedNavItemsPublished(cleanTenant);
    const pubId = cleanTenant !== DEFAULT_TENANT && existing.id.startsWith('nav-') && !existing.id.includes('::')
      ? `${cleanTenant}::${existing.id}`
      : existing.id;
    const pubRecord: DesktopNavItem = {
      ...this.cloneRecord(existing),
      id: pubId,
      tenantId: cleanTenant === DEFAULT_TENANT ? (existing.tenantId || GLOBAL_TENANT) : cleanTenant,
    };
    this.upsertArrayById(this.desktopNavigation, pubRecord);
    draft.publishedVersion += 1;
    draft.lastPublishedAt = now;
    await platformPersistenceService.upsert(DesktopNavItemModel, pubRecord);
    await this.persistDraftSnapshot(draft);
    return this.cloneRecord(existing);
  }

  async deleteDesktopNavItem(
    tenantId: string,
    id: string,
    options: { saveAsDraft?: boolean } = {}
  ): Promise<{ id: string; deleted: boolean }> {
    const cleanTenant = this.resolveNavTenantId(tenantId);
    const draft = this.getDraftState(cleanTenant);
    const idx = draft.desktopNavigation.findIndex((n) => n.id === id || n.id === `${cleanTenant}::${id}`);
    if (idx < 0) throw new BadRequestException(`Navigation item ${id} not found.`);
    const [removed] = draft.desktopNavigation.splice(idx, 1);
    if (!draft.deletedNavIds.includes(removed.id)) draft.deletedNavIds.push(removed.id);

    // Renumber displayOrder cleanly
    draft.desktopNavigation
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .forEach((item, index) => {
        item.displayOrder = index + 1;
      });

    const now = new Date().toISOString();
    draft.draftVersion += 1;
    draft.lastDraftSavedAt = now;

    if (options.saveAsDraft) {
      draft.hasUnpublishedChanges = true;
      await this.persistDraftSnapshot(draft);
      return { id: removed.id, deleted: true };
    }

    this.ensureTenantScopedNavItemsPublished(cleanTenant);
    const pubIdx = this.desktopNavigation.findIndex(
      (n) => n.id === removed.id || n.id === `${cleanTenant}::${removed.id}`
    );
    if (pubIdx >= 0) {
      const [pubRemoved] = this.desktopNavigation.splice(pubIdx, 1);
      await platformPersistenceService.remove(DesktopNavItemModel, pubRemoved.id);
    }
    for (const item of draft.desktopNavigation) {
      const pubMatch = this.desktopNavigation.find((n) => n.id === item.id || n.id === `${cleanTenant}::${item.id}`);
      if (pubMatch) {
        pubMatch.displayOrder = item.displayOrder;
        await platformPersistenceService.upsert(DesktopNavItemModel, pubMatch);
      }
    }
    draft.publishedVersion += 1;
    draft.lastPublishedAt = now;
    await this.persistDraftSnapshot(draft);
    return { id: removed.id, deleted: true };
  }

  async reorderDesktopNavItems(
    tenantId: string,
    orderedIds: string[],
    options: { saveAsDraft?: boolean } = {}
  ): Promise<DesktopNavItem[]> {
    const cleanTenant = this.resolveNavTenantId(tenantId);
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      throw new BadRequestException('orderedIds array is required.');
    }
    const draft = this.getDraftState(cleanTenant);
    const orderMap = new Map<string, number>();
    orderedIds.forEach((navId, index) => orderMap.set(navId, index + 1));

    let fallbackOrder = orderedIds.length + 1;
    for (const item of draft.desktopNavigation) {
      const nextOrder = orderMap.get(item.id) ?? fallbackOrder++;
      item.displayOrder = nextOrder;
      item.updatedAt = new Date().toISOString();
    }
    draft.desktopNavigation.sort((a, b) => a.displayOrder - b.displayOrder);
    const now = new Date().toISOString();
    draft.draftVersion += 1;
    draft.lastDraftSavedAt = now;

    if (options.saveAsDraft) {
      draft.hasUnpublishedChanges = true;
      await this.persistDraftSnapshot(draft);
      return this.cloneRecord(draft.desktopNavigation);
    }

    this.ensureTenantScopedNavItemsPublished(cleanTenant);
    for (const item of draft.desktopNavigation) {
      const pubId = cleanTenant !== DEFAULT_TENANT && item.id.startsWith('nav-') && !item.id.includes('::')
        ? `${cleanTenant}::${item.id}`
        : item.id;
      const pubMatch = this.desktopNavigation.find((n) => n.id === item.id || n.id === pubId);
      if (pubMatch) {
        pubMatch.displayOrder = item.displayOrder;
        pubMatch.updatedAt = now;
        await platformPersistenceService.upsert(DesktopNavItemModel, pubMatch);
      }
    }
    draft.publishedVersion += 1;
    draft.lastPublishedAt = now;
    await this.persistDraftSnapshot(draft);
    return this.cloneRecord(draft.desktopNavigation);
  }

  // ==================== ADMIN DRAFT PUBLISH / DISCARD WORKFLOW ====================

  async publishCatalogDraft(
    tenantId: string,
    publishedBy = 'COMPANY_ADMIN',
    extraVendorProducts: any[] = []
  ): Promise<{
    metadata: CatalogPublishMetadata;
    mainCategoriesCount: number;
    childCategoriesCount: number;
    productTypesCount: number;
    desktopNavigationCount: number;
  }> {
    const cleanTenant = this.resolveNavTenantId(tenantId);
    const draft = this.getDraftState(cleanTenant);
    const now = new Date().toISOString();

    // 1. Validate uniqueness & relationship integrity across entire Draft
    const mainSlugs = new Set<string>();
    const mainNames = new Set<string>();
    for (const m of draft.mainCategories) {
      if (!m.name?.trim()) throw new BadRequestException('Every Main Category must have a name.');
      const slugKey = m.slug.toLowerCase();
      const nameKey = m.name.trim().toLowerCase();
      if (mainSlugs.has(slugKey)) throw new BadRequestException(`Duplicate Main Category slug "${m.slug}".`);
      if (mainNames.has(nameKey)) throw new BadRequestException(`Duplicate Main Category name "${m.name}".`);
      mainSlugs.add(slugKey);
      mainNames.add(nameKey);
    }

    const childSlugs = new Set<string>();
    const childNames = new Set<string>();
    for (const c of draft.childCategories) {
      if (!c.name?.trim()) throw new BadRequestException('Every Child Category must have a name.');
      const parentMain = draft.mainCategories.find((m) => m.id === c.mainCategoryId);
      if (!parentMain) {
        throw new BadRequestException(`Child Category "${c.name}" references missing Main Category.`);
      }
      const slugKey = `${c.mainCategoryId}::${c.slug.toLowerCase()}`;
      const nameKey = `${c.mainCategoryId}::${c.name.trim().toLowerCase()}`;
      if (childSlugs.has(slugKey)) throw new BadRequestException(`Duplicate Child Category slug "${c.slug}" under ${parentMain.name}.`);
      if (childNames.has(nameKey)) throw new BadRequestException(`Duplicate Child Category name "${c.name}" under ${parentMain.name}.`);
      childSlugs.add(slugKey);
      childNames.add(nameKey);
      c.mainCategorySlug = parentMain.slug;
    }

    for (const pt of draft.productTypes) {
      const parentChild = draft.childCategories.find((c) => c.id === pt.childCategoryId);
      if (!parentChild) {
        throw new BadRequestException(`Product Type "${pt.name}" references missing Child Category.`);
      }
      pt.mainCategoryId = parentChild.mainCategoryId;
      pt.childCategorySlug = parentChild.slug;
    }

    for (const nav of draft.desktopNavigation) {
      if (nav.itemType === 'MAIN_CATEGORY' && nav.mainCategoryId) {
        const mc = draft.mainCategories.find((m) => m.id === nav.mainCategoryId);
        if (!mc) {
          throw new BadRequestException(`Navigation item "${nav.label}" references missing Main Category.`);
        }
        nav.mainCategorySlug = mc.slug;
        nav.route = `/categories/${mc.slug}`;
      }
    }

    // 2. Promote Deletions
    for (const delMainId of draft.deletedMainIds) {
      this.removePublishedMain(cleanTenant, delMainId);
      await platformPersistenceService.remove(MainCategoryModel, delMainId);
    }
    for (const delChildId of draft.deletedChildIds) {
      this.removePublishedChild(cleanTenant, delChildId);
      await platformPersistenceService.remove(ChildCategoryModel, delChildId);
    }
    for (const delPtId of draft.deletedProductTypeIds) {
      this.removePublishedType(cleanTenant, delPtId);
      await platformPersistenceService.remove(ProductTypeModel, delPtId);
    }
    for (const delNavId of draft.deletedNavIds) {
      const idx = this.desktopNavigation.findIndex(
        (n) => n.id === delNavId || n.id === `${cleanTenant}::${delNavId}`
      );
      if (idx >= 0) {
        const [removed] = this.desktopNavigation.splice(idx, 1);
        await platformPersistenceService.remove(DesktopNavItemModel, removed.id);
      }
    }
    for (const delFilterId of draft.deletedFilterConfigIds || []) {
      const idx = this.categoryFilterConfigs.findIndex((fc) => fc.id === delFilterId);
      if (idx >= 0) {
        this.categoryFilterConfigs.splice(idx, 1);
        await platformPersistenceService.remove(CategoryFilterConfigModel, delFilterId);
      }
    }

    // 3. Promote Upserts cleanly into Live Pools
    for (const mc of draft.mainCategories) {
      this.upsertPublishedMain(cleanTenant, mc);
      await platformPersistenceService.upsert(MainCategoryModel, mc);
    }
    for (const cc of draft.childCategories) {
      this.upsertPublishedChild(cleanTenant, cc);
      await platformPersistenceService.upsert(ChildCategoryModel, cc);
    }
    for (const pt of draft.productTypes) {
      this.upsertPublishedType(cleanTenant, pt);
      await platformPersistenceService.upsert(ProductTypeModel, pt);
    }
    for (const fc of draft.categoryFilterConfigs || []) {
      fc.publishedStatus = 'PUBLISHED';
      fc.updatedAt = now;
      this.upsertArrayById(this.categoryFilterConfigs, fc);
      await platformPersistenceService.upsert(CategoryFilterConfigModel, fc);
    }
    this.ensureTenantScopedNavItemsPublished(cleanTenant);
    for (const nav of draft.desktopNavigation) {
      const pubId = cleanTenant !== DEFAULT_TENANT && nav.id.startsWith('nav-') && !nav.id.includes('::')
        ? `${cleanTenant}::${nav.id}`
        : nav.id;
      const pubNav: DesktopNavItem = {
        ...this.cloneRecord(nav),
        id: pubId,
        tenantId: cleanTenant === DEFAULT_TENANT ? GLOBAL_TENANT : cleanTenant,
      };
      this.upsertArrayById(this.desktopNavigation, pubNav);
      await platformPersistenceService.upsert(DesktopNavItemModel, pubNav);
    }

    // 4. Cascade category name/slug/parent changes onto existing catalog & vendor products
    const syncProductRefs = (p: any) => {
      if (!p) return;
      const cc = draft.childCategories.find(
        (c) => c.id === p.childCategoryId || c.id === p.categoryId || c.slug === p.childCategorySlug
      );
      const mc = cc
        ? draft.mainCategories.find((m) => m.id === cc.mainCategoryId)
        : draft.mainCategories.find((m) => m.id === p.mainCategoryId || m.slug === p.mainCategorySlug);
      const pt = draft.productTypes.find((t) => t.id === p.productTypeId || t.id === p.subcategoryId);

      if (mc) {
        p.mainCategoryId = mc.id;
        p.mainCategorySlug = mc.slug;
        p.mainCategoryName = mc.name;
      }
      if (cc) {
        p.childCategoryId = cc.id;
        p.childCategorySlug = cc.slug;
        p.childCategoryName = cc.name;
        p.categoryId = cc.id;
        p.categorySlug = cc.slug;
        p.category = cc.name;
      }
      if (pt) {
        p.productTypeId = pt.id;
        p.productTypeSlug = pt.slug;
        p.productTypeName = pt.name;
        p.subcategoryId = pt.id;
        p.subcategorySlug = pt.slug;
        p.subcategory = pt.name;
      }
    };
    for (const p of dbStore.products) syncProductRefs(p);
    for (const vp of extraVendorProducts) syncProductRefs(vp);

    this.syncDbStoreCategories(cleanTenant);

    draft.deletedMainIds = [];
    draft.deletedChildIds = [];
    draft.deletedProductTypeIds = [];
    draft.deletedNavIds = [];
    draft.deletedFilterConfigIds = [];
    draft.hasUnpublishedChanges = false;
    draft.publishedVersion = Number(draft.publishedVersion || 1) + 1;
    draft.draftVersion = draft.publishedVersion;
    draft.lastPublishedAt = now;
    draft.lastPublishedBy = publishedBy;
    await this.persistDraftSnapshot(draft);

    return {
      metadata: this.getPublishMetadata(cleanTenant),
      mainCategoriesCount: draft.mainCategories.length,
      childCategoriesCount: draft.childCategories.length,
      productTypesCount: draft.productTypes.length,
      desktopNavigationCount: draft.desktopNavigation.length,
    };
  }

  async discardCatalogDraft(tenantId: string): Promise<TenantCatalogDraft> {
    const cleanTenant = this.resolveNavTenantId(tenantId);
    const currentMeta = this.getPublishMetadata(cleanTenant);
    this.drafts.delete(cleanTenant);
    const fresh = this.getDraftState(cleanTenant);
    fresh.hasUnpublishedChanges = false;
    fresh.publishedVersion = currentMeta.publishedVersion;
    fresh.draftVersion = currentMeta.publishedVersion;
    await this.persistDraftSnapshot(fresh);
    return fresh;
  }

  // ==================== ADMIN TAXONOMY CRUD ====================

  async createMainCategory(
    tenantId: string,
    payload: Partial<MainCategory> & { saveAsDraft?: boolean }
  ): Promise<MainCategory> {
    if (!payload.name?.trim()) throw new BadRequestException('Main category name is required.');
    const cleanTenant = this.resolveNavTenantId(tenantId);
    const draft = this.getDraftState(cleanTenant);
    const name = payload.name.trim();
    const slug = this.toSlug(payload.slug?.trim() || name);
    if (!slug) throw new BadRequestException('Valid slug is required.');
    if (
      draft.mainCategories.some(
        (m) =>
          (m.slug.toLowerCase() === slug || m.name.trim().toLowerCase() === name.toLowerCase()) &&
          (m.tenantId === cleanTenant || m.tenantId === GLOBAL_TENANT || !m.tenantId)
      )
    ) {
      throw new BadRequestException(`Main category "${name}" (${slug}) already exists.`);
    }

    const now = new Date().toISOString();
    const record: MainCategory = {
      id: `mc-${Date.now()}`,
      tenantId: cleanTenant,
      name,
      slug,
      icon: payload.icon || 'Layers',
      description: payload.description?.trim() || '',
      image: payload.image?.trim() || '',
      sortOrder: Number(payload.sortOrder ?? draft.mainCategories.length + 1),
      isActive: payload.isActive !== false,
      showInNavigation: payload.showInNavigation !== false,
      createdAt: now,
      updatedAt: now,
    };
    draft.mainCategories.push(record);

    // Automatically add linked Desktop Navigation item when showInNavigation is enabled
    let autoNavItem: DesktopNavItem | null = null;
    if (record.showInNavigation !== false && !draft.desktopNavigation.some((n) => n.mainCategoryId === record.id)) {
      const promoNavs = draft.desktopNavigation.filter(
        (n) => n.itemType === 'NEW_LAUNCHES' || n.itemType === 'DEALS'
      );
      const minPromoOrder = promoNavs.length > 0 ? Math.min(...promoNavs.map((p) => p.displayOrder)) : draft.desktopNavigation.length + 1;
      for (const n of draft.desktopNavigation) {
        if (n.displayOrder >= minPromoOrder) n.displayOrder += 1;
      }
      autoNavItem = {
        id: `nav-${record.id}`,
        tenantId: cleanTenant,
        label: record.name,
        slug: record.slug,
        itemType: 'MAIN_CATEGORY',
        mainCategoryId: record.id,
        mainCategorySlug: record.slug,
        route: `/categories/${record.slug}`,
        icon: MAIN_CATEGORY_NAV_ICONS[record.slug] || record.icon || 'Layers',
        hasDropdown: true,
        displayOrder: minPromoOrder,
        isVisible: record.isActive !== false && Boolean(record.showInNavigation),
        isActive: record.isActive !== false,
        createdAt: now,
        updatedAt: now,
      };
      draft.desktopNavigation.push(autoNavItem);
      draft.desktopNavigation.sort((a, b) => a.displayOrder - b.displayOrder);
    }

    draft.draftVersion += 1;
    draft.lastDraftSavedAt = now;

    if (payload.saveAsDraft) {
      draft.hasUnpublishedChanges = true;
      await this.persistDraftSnapshot(draft);
      return this.cloneRecord(record);
    }

    this.upsertPublishedMain(cleanTenant, record);
    await platformPersistenceService.upsert(MainCategoryModel, record);
    if (autoNavItem) {
      this.ensureTenantScopedNavItemsPublished(cleanTenant);
      const pubNav: DesktopNavItem = {
        ...this.cloneRecord(autoNavItem),
        tenantId: cleanTenant === DEFAULT_TENANT ? GLOBAL_TENANT : cleanTenant,
      };
      this.upsertArrayById(this.desktopNavigation, pubNav);
      await platformPersistenceService.upsert(DesktopNavItemModel, pubNav);
      for (const n of draft.desktopNavigation) {
        const pubMatch = this.desktopNavigation.find((p) => p.id === n.id || p.id === `${cleanTenant}::${n.id}`);
        if (pubMatch) {
          pubMatch.displayOrder = n.displayOrder;
          await platformPersistenceService.upsert(DesktopNavItemModel, pubMatch);
        }
      }
    }
    draft.publishedVersion += 1;
    draft.lastPublishedAt = now;
    await this.persistDraftSnapshot(draft);
    return this.cloneRecord(record);
  }

  async updateMainCategory(
    tenantId: string,
    id: string,
    updates: Partial<MainCategory> & { saveAsDraft?: boolean }
  ): Promise<MainCategory> {
    const cleanTenant = this.resolveNavTenantId(tenantId);
    const draft = this.getDraftState(cleanTenant);
    const existing = draft.mainCategories.find(
      (m) => m.id === id && (!m.tenantId || m.tenantId === GLOBAL_TENANT || m.tenantId === cleanTenant)
    );
    if (!existing) throw new BadRequestException(`Main category ${id} not found.`);

    const oldName = existing.name;
    const oldSlug = existing.slug;
    if (updates.name !== undefined) {
      const nextName = updates.name.trim();
      if (!nextName) throw new BadRequestException('Main category name cannot be empty.');
      if (draft.mainCategories.some((m) => m.id !== existing.id && m.name.trim().toLowerCase() === nextName.toLowerCase())) {
        throw new BadRequestException(`Main category "${nextName}" already exists.`);
      }
      existing.name = nextName;
    }
    if (updates.slug !== undefined) {
      const nextSlug = this.toSlug(updates.slug);
      if (!nextSlug) throw new BadRequestException('Main category slug cannot be empty.');
      if (draft.mainCategories.some((m) => m.id !== existing.id && m.slug.toLowerCase() === nextSlug.toLowerCase())) {
        throw new BadRequestException(`Main category slug "${nextSlug}" already exists.`);
      }
      existing.slug = nextSlug;
    }
    if (updates.description !== undefined) existing.description = updates.description;
    if (updates.image !== undefined) existing.image = updates.image;
    if (updates.sortOrder !== undefined) existing.sortOrder = Number(updates.sortOrder);
    if (updates.isActive !== undefined) existing.isActive = Boolean(updates.isActive);
    if (updates.showInNavigation !== undefined) existing.showInNavigation = Boolean(updates.showInNavigation);
    const now = new Date().toISOString();
    existing.updatedAt = now;

    // Sync child slug refs & linked desktop nav item in Draft
    if (existing.slug !== oldSlug) {
      for (const cc of draft.childCategories) {
        if (cc.mainCategoryId === existing.id) cc.mainCategorySlug = existing.slug;
      }
    }
    const touchedNavs: DesktopNavItem[] = [];
    for (const nav of draft.desktopNavigation) {
      if (nav.mainCategoryId === existing.id) {
        nav.mainCategorySlug = existing.slug;
        if (!nav.childCategoryId && !nav.productTypeId) {
          nav.route = `/categories/${existing.slug}`;
        }
        if (nav.label === oldName) nav.label = existing.name;
        if (updates.showInNavigation !== undefined) nav.isVisible = Boolean(updates.showInNavigation);
        nav.updatedAt = now;
        touchedNavs.push(nav);
      }
    }

    draft.draftVersion += 1;
    draft.lastDraftSavedAt = now;

    if (updates.saveAsDraft) {
      draft.hasUnpublishedChanges = true;
      await this.persistDraftSnapshot(draft);
      return this.cloneRecord(existing);
    }

    this.upsertPublishedMain(cleanTenant, existing);
    await platformPersistenceService.upsert(MainCategoryModel, existing);
    for (const cc of draft.childCategories) {
      if (cc.mainCategoryId === existing.id) {
        this.upsertPublishedChild(cleanTenant, cc);
        await platformPersistenceService.upsert(ChildCategoryModel, cc);
      }
    }
    for (const nav of touchedNavs) {
      const pubMatch = this.desktopNavigation.find((n) => n.id === nav.id || n.id === `${cleanTenant}::${nav.id}`);
      if (pubMatch) {
        Object.assign(pubMatch, {
          mainCategorySlug: nav.mainCategorySlug,
          route: nav.route,
          label: nav.label,
          isVisible: nav.isVisible,
          isActive: nav.isActive,
          updatedAt: now,
        });
        await platformPersistenceService.upsert(DesktopNavItemModel, pubMatch);
      }
    }
    for (const p of dbStore.products as any[]) {
      if (p.mainCategoryId === existing.id || p.mainCategorySlug === oldSlug) {
        p.mainCategoryId = existing.id;
        p.mainCategorySlug = existing.slug;
        p.mainCategoryName = existing.name;
      }
    }
    this.syncDbStoreCategories(cleanTenant);
    draft.publishedVersion += 1;
    draft.lastPublishedAt = now;
    await this.persistDraftSnapshot(draft);
    return this.cloneRecord(existing);
  }

  async deleteMainCategory(
    tenantId: string,
    id: string,
    options: { reassignToMainId?: string; saveAsDraft?: boolean } = {},
    extraVendorProducts: any[] = []
  ): Promise<{ id: string; deleted: boolean; reassignedChildCount: number }> {
    const cleanTenant = this.resolveNavTenantId(tenantId);
    const draft = this.getDraftState(cleanTenant);
    const idx = draft.mainCategories.findIndex((m) => m.id === id);
    if (idx < 0) throw new BadRequestException(`Main category ${id} not found.`);
    const target = draft.mainCategories[idx];

    const linkedChildren = draft.childCategories.filter((c) => c.mainCategoryId === target.id);
    const linkedProductsCount = [...dbStore.products, ...extraVendorProducts].filter(
      (p: any) => p.mainCategoryId === target.id || p.mainCategorySlug === target.slug
    ).length;

    if ((linkedChildren.length > 0 || linkedProductsCount > 0) && !options.reassignToMainId) {
      throw new BadRequestException(
        `Cannot delete "${target.name}": it contains ${linkedChildren.length} child categories and ${linkedProductsCount} products. Reassign them to another Main Category first.`
      );
    }

    let reassignedChildCount = 0;
    if (options.reassignToMainId) {
      const destMain = draft.mainCategories.find(
        (m) => m.id === options.reassignToMainId && m.id !== target.id
      );
      if (!destMain || destMain.isActive === false) {
        throw new BadRequestException('Valid active target Main Category is required for reassignment.');
      }
      for (const cc of linkedChildren) {
        cc.mainCategoryId = destMain.id;
        cc.mainCategorySlug = destMain.slug;
        reassignedChildCount += 1;
        if (!options.saveAsDraft) {
          this.upsertArrayById(this.childCategories, cc);
          await platformPersistenceService.upsert(ChildCategoryModel, cc);
        }
      }
      for (const pt of draft.productTypes) {
        if (pt.mainCategoryId === target.id) {
          pt.mainCategoryId = destMain.id;
          if (!options.saveAsDraft) {
            this.upsertArrayById(this.productTypes, pt);
            await platformPersistenceService.upsert(ProductTypeModel, pt);
          }
        }
      }
      if (!options.saveAsDraft) {
        for (const p of [...dbStore.products, ...extraVendorProducts] as any[]) {
          if (p.mainCategoryId === target.id || p.mainCategorySlug === target.slug) {
            p.mainCategoryId = destMain.id;
            p.mainCategorySlug = destMain.slug;
            p.mainCategoryName = destMain.name;
          }
        }
      }
    }

    draft.mainCategories.splice(idx, 1);
    if (!draft.deletedMainIds.includes(target.id)) draft.deletedMainIds.push(target.id);
    // Remove auto-linked nav items pointing to deleted main category
    const navIndices = draft.desktopNavigation.filter((n) => n.mainCategoryId === target.id);
    for (const nav of navIndices) {
      draft.desktopNavigation = draft.desktopNavigation.filter((n) => n.id !== nav.id);
      if (!draft.deletedNavIds.includes(nav.id)) draft.deletedNavIds.push(nav.id);
    }

    const now = new Date().toISOString();
    draft.draftVersion += 1;
    draft.lastDraftSavedAt = now;

    if (options.saveAsDraft) {
      draft.hasUnpublishedChanges = true;
      await this.persistDraftSnapshot(draft);
      return { id: target.id, deleted: true, reassignedChildCount };
    }

    this.removePublishedMain(cleanTenant, target.id);
    await platformPersistenceService.remove(MainCategoryModel, target.id);
    this.ensureTenantScopedNavItemsPublished(cleanTenant);
    for (const nav of navIndices) {
      this.desktopNavigation = this.desktopNavigation.filter(
        (n) => n.id !== nav.id && n.id !== `${cleanTenant}::${nav.id}`
      );
      await platformPersistenceService.remove(DesktopNavItemModel, nav.id);
    }
    this.syncDbStoreCategories(cleanTenant);
    draft.publishedVersion += 1;
    draft.lastPublishedAt = now;
    await this.persistDraftSnapshot(draft);
    return { id: target.id, deleted: true, reassignedChildCount };
  }

  async createChildCategory(
    tenantId: string,
    payload: Partial<ChildCategory> & { saveAsDraft?: boolean }
  ): Promise<ChildCategory> {
    if (!payload.name?.trim()) throw new BadRequestException('Child category name is required.');
    if (!payload.mainCategoryId) throw new BadRequestException('Parent Main Category is required.');
    const cleanTenant = this.resolveNavTenantId(tenantId);
    const draft = this.getDraftState(cleanTenant);
    const parent = draft.mainCategories.find(
      (m) => m.id === payload.mainCategoryId || m.slug === payload.mainCategoryId
    );
    if (!parent) throw new BadRequestException(`Main category "${payload.mainCategoryId}" not found.`);

    const name = payload.name.trim();
    const slug = this.toSlug(payload.slug?.trim() || name);
    if (!slug) throw new BadRequestException('Valid slug is required.');
    if (
      draft.childCategories.some(
        (c) =>
          c.mainCategoryId === parent.id &&
          (c.slug.toLowerCase() === slug || c.name.trim().toLowerCase() === name.toLowerCase())
      )
    ) {
      throw new BadRequestException(`Child category "${name}" (${slug}) already exists under ${parent.name}.`);
    }

    const now = new Date().toISOString();
    const record: ChildCategory = {
      id: `cat-${Date.now()}`,
      tenantId: cleanTenant,
      mainCategoryId: parent.id,
      mainCategorySlug: parent.slug,
      name,
      slug,
      icon: payload.icon || 'Layers',
      description: payload.description?.trim() || '',
      image: payload.image?.trim() || '',
      sortOrder: Number(payload.sortOrder ?? draft.childCategories.length + 1),
      isActive: payload.isActive !== false,
      createdAt: now,
      updatedAt: now,
    };
    draft.childCategories.push(record);
    draft.draftVersion += 1;
    draft.lastDraftSavedAt = now;

    if (payload.saveAsDraft) {
      draft.hasUnpublishedChanges = true;
      await this.persistDraftSnapshot(draft);
      return this.cloneRecord(record);
    }

    this.upsertPublishedChild(cleanTenant, record);
    await platformPersistenceService.upsert(ChildCategoryModel, record);
    this.syncDbStoreCategories(cleanTenant);
    draft.publishedVersion += 1;
    draft.lastPublishedAt = now;
    await this.persistDraftSnapshot(draft);
    return this.cloneRecord(record);
  }

  async updateChildCategory(
    tenantId: string,
    id: string,
    updates: Partial<ChildCategory> & { saveAsDraft?: boolean },
    extraVendorProducts: any[] = []
  ): Promise<ChildCategory & { migratedProductsCount?: number }> {
    const cleanTenant = this.resolveNavTenantId(tenantId);
    const draft = this.getDraftState(cleanTenant);
    const existing = draft.childCategories.find(
      (c) => c.id === id && (!c.tenantId || c.tenantId === GLOBAL_TENANT || c.tenantId === cleanTenant)
    );
    if (!existing) throw new BadRequestException(`Child category ${id} not found.`);

    const oldSlug = existing.slug;
    let migratedProductsCount = 0;
    if (updates.mainCategoryId !== undefined && updates.mainCategoryId !== existing.mainCategoryId) {
      const parent = draft.mainCategories.find(
        (m) =>
          (m.id === updates.mainCategoryId || m.slug === updates.mainCategoryId) &&
          (!m.tenantId || m.tenantId === GLOBAL_TENANT || m.tenantId === cleanTenant)
      );
      if (!parent) throw new BadRequestException('Valid active target Main Category is required.');
      if (parent.isActive === false) {
        throw new BadRequestException(`Target Main Category "${parent.name}" is inactive.`);
      }
      existing.mainCategoryId = parent.id;
      existing.mainCategorySlug = parent.slug;

      for (const pt of draft.productTypes) {
        if (pt.childCategoryId === existing.id) {
          pt.mainCategoryId = parent.id;
          if (!updates.saveAsDraft) {
            this.upsertPublishedType(cleanTenant, pt);
            await platformPersistenceService.upsert(ProductTypeModel, pt);
          }
        }
      }
      const updateProdMainRef = (p: any) => {
        if (p && (p.childCategoryId === existing.id || p.categoryId === existing.id || p.categorySlug === existing.slug)) {
          p.mainCategoryId = parent.id;
          p.mainCategorySlug = parent.slug;
          p.mainCategoryName = parent.name;
          migratedProductsCount += 1;
        }
      };
      if (!updates.saveAsDraft) {
        for (const p of dbStore.products) updateProdMainRef(p);
        for (const vp of extraVendorProducts) updateProdMainRef(vp);
      }
    }

    if (updates.name !== undefined) {
      const nextName = updates.name.trim();
      if (!nextName) throw new BadRequestException('Child category name cannot be empty.');
      if (
        draft.childCategories.some(
          (c) =>
            c.id !== existing.id &&
            c.mainCategoryId === existing.mainCategoryId &&
            c.name.trim().toLowerCase() === nextName.toLowerCase()
        )
      ) {
        throw new BadRequestException(`Child category "${nextName}" already exists under this parent category.`);
      }
      existing.name = nextName;
    }
    if (updates.slug !== undefined) {
      const nextSlug = this.toSlug(updates.slug);
      if (!nextSlug) throw new BadRequestException('Child category slug cannot be empty.');
      if (
        draft.childCategories.some(
          (c) =>
            c.id !== existing.id &&
            c.mainCategoryId === existing.mainCategoryId &&
            c.slug.toLowerCase() === nextSlug.toLowerCase()
        )
      ) {
        throw new BadRequestException(`Child category slug "${nextSlug}" already exists under this parent category.`);
      }
      existing.slug = nextSlug;
    }
    if (updates.description !== undefined) existing.description = updates.description;
    if (updates.image !== undefined) existing.image = updates.image;
    if (updates.sortOrder !== undefined) existing.sortOrder = Number(updates.sortOrder);
    if (updates.isActive !== undefined) existing.isActive = Boolean(updates.isActive);
    const now = new Date().toISOString();
    existing.updatedAt = now;

    if (existing.slug !== oldSlug) {
      for (const pt of draft.productTypes) {
        if (pt.childCategoryId === existing.id) pt.childCategorySlug = existing.slug;
      }
    }

    draft.draftVersion += 1;
    draft.lastDraftSavedAt = now;

    if (updates.saveAsDraft) {
      draft.hasUnpublishedChanges = true;
      await this.persistDraftSnapshot(draft);
      return { ...this.cloneRecord(existing), migratedProductsCount };
    }

    this.upsertPublishedChild(cleanTenant, existing);
    await platformPersistenceService.upsert(ChildCategoryModel, existing);
    for (const p of [...dbStore.products, ...extraVendorProducts] as any[]) {
      if (p.childCategoryId === existing.id || p.categoryId === existing.id || p.categorySlug === oldSlug) {
        p.childCategorySlug = existing.slug;
        p.childCategoryName = existing.name;
        p.categorySlug = existing.slug;
        p.category = existing.name;
      }
    }
    this.syncDbStoreCategories(cleanTenant);
    draft.publishedVersion += 1;
    draft.lastPublishedAt = now;
    await this.persistDraftSnapshot(draft);
    return { ...this.cloneRecord(existing), migratedProductsCount };
  }

  async deleteChildCategory(
    tenantId: string,
    id: string,
    options: { reassignToChildId?: string; saveAsDraft?: boolean } = {},
    extraVendorProducts: any[] = []
  ): Promise<{ id: string; deleted: boolean; reassignedProductsCount: number }> {
    const cleanTenant = this.resolveNavTenantId(tenantId);
    const draft = this.getDraftState(cleanTenant);
    const idx = draft.childCategories.findIndex((c) => c.id === id);
    if (idx < 0) throw new BadRequestException(`Child category ${id} not found.`);
    const target = draft.childCategories[idx];

    const linkedTypes = draft.productTypes.filter((pt) => pt.childCategoryId === target.id);
    const linkedProducts = [...dbStore.products, ...extraVendorProducts].filter(
      (p: any) => p.childCategoryId === target.id || p.categoryId === target.id || p.categorySlug === target.slug
    );

    if ((linkedProducts.length > 0 || linkedTypes.length > 0) && !options.reassignToChildId) {
      throw new BadRequestException(
        `Cannot delete "${target.name}": ${linkedProducts.length} product(s) and ${linkedTypes.length} product type(s) depend on it. Reassign to another Child Category first.`
      );
    }

    let reassignedProductsCount = 0;
    if (options.reassignToChildId) {
      const destChild = draft.childCategories.find(
        (c) => c.id === options.reassignToChildId && c.id !== target.id
      );
      if (!destChild || destChild.isActive === false) {
        throw new BadRequestException('Valid active destination Child Category is required for reassignment.');
      }
      const destMain = draft.mainCategories.find((m) => m.id === destChild.mainCategoryId);
      for (const pt of linkedTypes) {
        pt.childCategoryId = destChild.id;
        pt.childCategorySlug = destChild.slug;
        pt.mainCategoryId = destChild.mainCategoryId;
        if (!options.saveAsDraft) {
          this.upsertArrayById(this.productTypes, pt);
          await platformPersistenceService.upsert(ProductTypeModel, pt);
        }
      }
      if (!options.saveAsDraft) {
        for (const p of linkedProducts as any[]) {
          p.mainCategoryId = destMain?.id || destChild.mainCategoryId;
          p.mainCategorySlug = destMain?.slug || destChild.mainCategorySlug || '';
          p.mainCategoryName = destMain?.name || '';
          p.childCategoryId = destChild.id;
          p.childCategorySlug = destChild.slug;
          p.childCategoryName = destChild.name;
          p.categoryId = destChild.id;
          p.categorySlug = destChild.slug;
          p.category = destChild.name;
          reassignedProductsCount += 1;
        }
      } else {
        reassignedProductsCount = linkedProducts.length;
      }
    }

    draft.childCategories.splice(idx, 1);
    if (!draft.deletedChildIds.includes(target.id)) draft.deletedChildIds.push(target.id);
    const now = new Date().toISOString();
    draft.draftVersion += 1;
    draft.lastDraftSavedAt = now;

    if (options.saveAsDraft) {
      draft.hasUnpublishedChanges = true;
      await this.persistDraftSnapshot(draft);
      return { id: target.id, deleted: true, reassignedProductsCount };
    }

    this.removePublishedChild(cleanTenant, target.id);
    await platformPersistenceService.remove(ChildCategoryModel, target.id);
    this.syncDbStoreCategories(cleanTenant);
    draft.publishedVersion += 1;
    draft.lastPublishedAt = now;
    await this.persistDraftSnapshot(draft);
    return { id: target.id, deleted: true, reassignedProductsCount };
  }

  async createProductType(
    tenantId: string,
    payload: Partial<ProductTypeNode> & { saveAsDraft?: boolean }
  ): Promise<ProductTypeNode> {
    if (!payload.name?.trim()) throw new BadRequestException('Product Type name is required.');
    if (!payload.childCategoryId) throw new BadRequestException('Child Category is required.');
    const cleanTenant = this.resolveNavTenantId(tenantId);
    const draft = this.getDraftState(cleanTenant);
    const child = draft.childCategories.find(
      (c) => c.id === payload.childCategoryId || c.slug === payload.childCategoryId
    );
    if (!child) throw new BadRequestException(`Child category "${payload.childCategoryId}" not found.`);
    if (payload.mainCategoryId && child.mainCategoryId !== payload.mainCategoryId) {
      throw new BadRequestException('Selected Child Category does not belong to the selected Main Category.');
    }

    const name = payload.name.trim();
    const slug = this.toSlug(payload.slug?.trim() || name);
    if (
      draft.productTypes.some(
        (pt) =>
          pt.childCategoryId === child.id &&
          (pt.slug.toLowerCase() === slug || pt.name.trim().toLowerCase() === name.toLowerCase())
      )
    ) {
      throw new BadRequestException(`Product Type "${name}" already exists under ${child.name}.`);
    }

    const now = new Date().toISOString();
    const record: ProductTypeNode = {
      id: `sub-${Date.now()}`,
      tenantId: cleanTenant,
      mainCategoryId: child.mainCategoryId,
      childCategoryId: child.id,
      childCategorySlug: child.slug,
      name,
      slug,
      sortOrder: Number(payload.sortOrder ?? draft.productTypes.length + 1),
      isActive: payload.isActive !== false,
      createdAt: now,
      updatedAt: now,
    };
    draft.productTypes.push(record);
    draft.draftVersion += 1;
    draft.lastDraftSavedAt = now;

    if (payload.saveAsDraft) {
      draft.hasUnpublishedChanges = true;
      await this.persistDraftSnapshot(draft);
      return this.cloneRecord(record);
    }

    this.upsertPublishedType(cleanTenant, record);
    await platformPersistenceService.upsert(ProductTypeModel, record);
    this.syncDbStoreCategories(cleanTenant);
    draft.publishedVersion += 1;
    draft.lastPublishedAt = now;
    await this.persistDraftSnapshot(draft);
    return this.cloneRecord(record);
  }

  async updateProductType(
    tenantId: string,
    id: string,
    updates: Partial<ProductTypeNode> & { saveAsDraft?: boolean },
    extraVendorProducts: any[] = []
  ): Promise<ProductTypeNode> {
    const cleanTenant = this.resolveNavTenantId(tenantId);
    const draft = this.getDraftState(cleanTenant);
    const existing = draft.productTypes.find((pt) => pt.id === id);
    if (!existing) throw new BadRequestException(`Product Type ${id} not found.`);
    if (updates.childCategoryId !== undefined) {
      const child = draft.childCategories.find((c) => c.id === updates.childCategoryId);
      if (!child) throw new BadRequestException('Valid Child Category is required.');
      existing.childCategoryId = child.id;
      existing.childCategorySlug = child.slug;
      existing.mainCategoryId = child.mainCategoryId;
    }
    if (updates.name !== undefined) {
      const nextName = updates.name.trim();
      if (!nextName) throw new BadRequestException('Product Type name cannot be empty.');
      if (
        draft.productTypes.some(
          (pt) =>
            pt.id !== existing.id &&
            pt.childCategoryId === existing.childCategoryId &&
            pt.name.trim().toLowerCase() === nextName.toLowerCase()
        )
      ) {
        throw new BadRequestException(`Product Type "${nextName}" already exists under this Child Category.`);
      }
      existing.name = nextName;
    }
    if (updates.slug !== undefined) {
      const nextSlug = this.toSlug(updates.slug);
      if (!nextSlug) throw new BadRequestException('Product Type slug cannot be empty.');
      if (
        draft.productTypes.some(
          (pt) =>
            pt.id !== existing.id &&
            pt.childCategoryId === existing.childCategoryId &&
            pt.slug.toLowerCase() === nextSlug.toLowerCase()
        )
      ) {
        throw new BadRequestException(`Product Type slug "${nextSlug}" already exists under this Child Category.`);
      }
      existing.slug = nextSlug;
    }
    if (updates.sortOrder !== undefined) existing.sortOrder = Number(updates.sortOrder);
    if (updates.isActive !== undefined) existing.isActive = Boolean(updates.isActive);
    const now = new Date().toISOString();
    existing.updatedAt = now;
    draft.draftVersion += 1;
    draft.lastDraftSavedAt = now;

    if (updates.saveAsDraft) {
      draft.hasUnpublishedChanges = true;
      await this.persistDraftSnapshot(draft);
      return this.cloneRecord(existing);
    }

    this.upsertPublishedType(cleanTenant, existing);
    await platformPersistenceService.upsert(ProductTypeModel, existing);
    for (const p of [...dbStore.products, ...extraVendorProducts] as any[]) {
      if (p.productTypeId === existing.id || p.subcategoryId === existing.id) {
        p.productTypeId = existing.id;
        p.productTypeSlug = existing.slug;
        p.productTypeName = existing.name;
        p.subcategoryId = existing.id;
        p.subcategorySlug = existing.slug;
        p.subcategory = existing.name;
      }
    }
    this.syncDbStoreCategories(cleanTenant);
    draft.publishedVersion += 1;
    draft.lastPublishedAt = now;
    await this.persistDraftSnapshot(draft);
    return this.cloneRecord(existing);
  }

  async deleteProductType(
    tenantId: string,
    id: string,
    options: { reassignToTypeId?: string; saveAsDraft?: boolean } = {},
    extraVendorProducts: any[] = []
  ): Promise<{ id: string; deleted: boolean; reassignedProductsCount: number }> {
    const cleanTenant = this.resolveNavTenantId(tenantId);
    const draft = this.getDraftState(cleanTenant);
    const idx = draft.productTypes.findIndex((pt) => pt.id === id);
    if (idx < 0) throw new BadRequestException(`Product Type ${id} not found.`);
    const target = draft.productTypes[idx];

    const linkedProducts = [...dbStore.products, ...extraVendorProducts].filter(
      (p: any) => p.productTypeId === target.id || p.subcategoryId === target.id
    );
    if (linkedProducts.length > 0 && !options.reassignToTypeId) {
      throw new BadRequestException(
        `Cannot delete "${target.name}": ${linkedProducts.length} product(s) use this Product Type. Reassign or deactivate it instead.`
      );
    }
    let reassignedProductsCount = 0;
    if (options.reassignToTypeId) {
      const destType = draft.productTypes.find((pt) => pt.id === options.reassignToTypeId && pt.id !== target.id);
      if (!destType) throw new BadRequestException('Valid destination Product Type is required.');
      if (!options.saveAsDraft) {
        for (const p of linkedProducts as any[]) {
          p.productTypeId = destType.id;
          p.productTypeSlug = destType.slug;
          p.productTypeName = destType.name;
          p.subcategoryId = destType.id;
          p.subcategorySlug = destType.slug;
          p.subcategory = destType.name;
          reassignedProductsCount += 1;
        }
      } else {
        reassignedProductsCount = linkedProducts.length;
      }
    }

    draft.productTypes.splice(idx, 1);
    if (!draft.deletedProductTypeIds.includes(target.id)) draft.deletedProductTypeIds.push(target.id);
    const now = new Date().toISOString();
    draft.draftVersion += 1;
    draft.lastDraftSavedAt = now;

    if (options.saveAsDraft) {
      draft.hasUnpublishedChanges = true;
      await this.persistDraftSnapshot(draft);
      return { id: target.id, deleted: true, reassignedProductsCount };
    }

    this.removePublishedType(cleanTenant, target.id);
    await platformPersistenceService.remove(ProductTypeModel, target.id);
    this.syncDbStoreCategories(cleanTenant);
    draft.publishedVersion += 1;
    draft.lastPublishedAt = now;
    await this.persistDraftSnapshot(draft);
    return { id: target.id, deleted: true, reassignedProductsCount };
  }

  async reorderMainCategories(
    tenantId: string,
    orderedIds: string[],
    options: { saveAsDraft?: boolean } = {}
  ): Promise<MainCategory[]> {
    const cleanTenant = this.resolveNavTenantId(tenantId);
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      throw new BadRequestException('orderedIds array is required.');
    }
    const draft = this.getDraftState(cleanTenant);
    const orderMap = new Map<string, number>();
    orderedIds.forEach((mid, idx) => orderMap.set(mid, idx + 1));
    const now = new Date().toISOString();

    for (const mc of draft.mainCategories) {
      const nextOrder = orderMap.get(mc.id);
      if (nextOrder !== undefined) {
        mc.sortOrder = nextOrder;
        mc.updatedAt = now;
      }
    }
    draft.mainCategories.sort((a, b) => a.sortOrder - b.sortOrder);
    draft.draftVersion += 1;
    draft.lastDraftSavedAt = now;

    if (options.saveAsDraft) {
      draft.hasUnpublishedChanges = true;
      await this.persistDraftSnapshot(draft);
      return this.cloneRecord(draft.mainCategories);
    }

    for (const mc of draft.mainCategories) {
      if (orderMap.has(mc.id)) {
        this.upsertPublishedMain(cleanTenant, mc);
        await platformPersistenceService.upsert(MainCategoryModel, mc);
      }
    }
    draft.publishedVersion += 1;
    draft.lastPublishedAt = now;
    await this.persistDraftSnapshot(draft);
    return this.cloneRecord(draft.mainCategories);
  }

  async reorderChildCategories(
    tenantId: string,
    orderedIds: string[],
    options: { saveAsDraft?: boolean } = {}
  ): Promise<ChildCategory[]> {
    const cleanTenant = this.resolveNavTenantId(tenantId);
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      throw new BadRequestException('orderedIds array is required.');
    }
    const draft = this.getDraftState(cleanTenant);
    const orderMap = new Map<string, number>();
    orderedIds.forEach((cid, idx) => orderMap.set(cid, idx + 1));
    const now = new Date().toISOString();

    for (const cc of draft.childCategories) {
      const nextOrder = orderMap.get(cc.id);
      if (nextOrder !== undefined) {
        cc.sortOrder = nextOrder;
        cc.updatedAt = now;
      }
    }
    draft.childCategories.sort((a, b) => a.sortOrder - b.sortOrder);
    draft.draftVersion += 1;
    draft.lastDraftSavedAt = now;

    if (options.saveAsDraft) {
      draft.hasUnpublishedChanges = true;
      await this.persistDraftSnapshot(draft);
      return this.cloneRecord(draft.childCategories);
    }

    for (const cc of draft.childCategories) {
      if (orderMap.has(cc.id)) {
        this.upsertPublishedChild(cleanTenant, cc);
        await platformPersistenceService.upsert(ChildCategoryModel, cc);
      }
    }
    this.syncDbStoreCategories(cleanTenant);
    draft.publishedVersion += 1;
    draft.lastPublishedAt = now;
    await this.persistDraftSnapshot(draft);
    return this.cloneRecord(draft.childCategories);
  }

  async reorderProductTypes(
    tenantId: string,
    orderedIds: string[],
    options: { saveAsDraft?: boolean } = {}
  ): Promise<ProductTypeNode[]> {
    const cleanTenant = this.resolveNavTenantId(tenantId);
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      throw new BadRequestException('orderedIds array is required.');
    }
    const draft = this.getDraftState(cleanTenant);
    const orderMap = new Map<string, number>();
    orderedIds.forEach((ptId, idx) => orderMap.set(ptId, idx + 1));
    const now = new Date().toISOString();

    for (const pt of draft.productTypes) {
      const nextOrder = orderMap.get(pt.id);
      if (nextOrder !== undefined) {
        pt.sortOrder = nextOrder;
        pt.updatedAt = now;
      }
    }
    draft.productTypes.sort((a, b) => a.sortOrder - b.sortOrder);
    draft.draftVersion += 1;
    draft.lastDraftSavedAt = now;

    if (options.saveAsDraft) {
      draft.hasUnpublishedChanges = true;
      await this.persistDraftSnapshot(draft);
      return this.cloneRecord(draft.productTypes);
    }

    for (const pt of draft.productTypes) {
      if (orderMap.has(pt.id)) {
        this.upsertPublishedType(cleanTenant, pt);
        await platformPersistenceService.upsert(ProductTypeModel, pt);
      }
    }
    this.syncDbStoreCategories(cleanTenant);
    draft.publishedVersion += 1;
    draft.lastPublishedAt = now;
    await this.persistDraftSnapshot(draft);
    return this.cloneRecord(draft.productTypes);
  }

  // ==================== NEW LAUNCHES PROMOTIONAL COLLECTIONS ====================

  private getNewLaunchTargetPool(tenantId: string, useDraft: boolean): NewLaunchCollection[] {
    const cleanTenant = this.resolveNavTenantId(tenantId);
    if (useDraft && this.newLaunchDrafts.has(cleanTenant)) {
      return this.newLaunchDrafts.get(cleanTenant)!;
    }
    return this.newLaunchCollections.filter(
      (col) => !col.tenantId || col.tenantId === GLOBAL_TENANT || col.tenantId === cleanTenant
    );
  }

  private ensureNewLaunchDraft(tenantId: string): NewLaunchCollection[] {
    const cleanTenant = this.resolveNavTenantId(tenantId);
    if (!this.newLaunchDrafts.has(cleanTenant)) {
      const live = this.getNewLaunchTargetPool(cleanTenant, false);
      this.newLaunchDrafts.set(cleanTenant, this.cloneRecord(live));
    }
    return this.newLaunchDrafts.get(cleanTenant)!;
  }

  private validateAndNormalizeMappings(
    rawMappings: any[] | undefined,
    preferredGroupId?: string
  ): NewLaunchCategoryMapping[] {
    if (!Array.isArray(rawMappings)) return [];
    const pool = {
      mainCategories: this.mainCategories,
      childCategories: this.childCategories,
      productTypes: this.productTypes,
    };

    return rawMappings.map((raw, idx) => {
      const displayLabel = String(raw?.displayLabel || raw?.name || raw?.label || '').trim();
      if (!displayLabel) {
        throw new BadRequestException('Every New Launches category shortcut must have a displayLabel.');
      }
      const sortOrder = Number(raw?.sortOrder ?? idx + 1);
      const isActive = raw?.isActive !== false;
      const mappingId = raw?.id || `nl-map-${Date.now()}-${idx + 1}`;

      if (raw?.childCategoryId) {
        const pt = this.productTypes.find((t) => t.id === raw.childCategoryId);
        if (!pt) {
          throw new BadRequestException(`Invalid child category reference "${raw.childCategoryId}" in New Launches mapping "${displayLabel}".`);
        }
        const grp = this.childCategories.find((c) => c.id === pt.childCategoryId);
        if (!grp) {
          throw new BadRequestException(`Category group missing for child category "${pt.name}".`);
        }
        if (raw.categoryGroupId && raw.categoryGroupId !== grp.id) {
          throw new BadRequestException(`Child category "${pt.name}" does not belong to category group "${raw.categoryGroupId}".`);
        }
        const main = this.mainCategories.find((m) => m.id === grp.mainCategoryId);
        if (raw.mainCategoryId && main && raw.mainCategoryId !== main.id) {
          throw new BadRequestException(`Category group "${grp.name}" does not belong to main category "${raw.mainCategoryId}".`);
        }
        return {
          id: mappingId,
          displayLabel,
          mainCategoryId: main?.id || grp.mainCategoryId,
          mainCategorySlug: main?.slug || '',
          mainCategoryName: main?.name || '',
          categoryGroupId: grp.id,
          categoryGroupSlug: grp.slug,
          categoryGroupName: grp.name,
          childCategoryId: pt.id,
          childCategorySlug: pt.slug,
          childCategoryName: pt.name,
          mappingStatus: 'MAPPED',
          suggestedPermanentCategoryIds: raw?.suggestedPermanentCategoryIds || [pt.id],
          sortOrder,
          isActive,
        };
      }

      if (raw?.categoryGroupId) {
        const grp = this.childCategories.find((c) => c.id === raw.categoryGroupId);
        if (!grp) {
          throw new BadRequestException(`Invalid category group "${raw.categoryGroupId}" in New Launches mapping "${displayLabel}".`);
        }
        const main = this.mainCategories.find((m) => m.id === grp.mainCategoryId);
        if (raw.mainCategoryId && main && raw.mainCategoryId !== main.id) {
          throw new BadRequestException(`Category group "${grp.name}" does not belong to main category "${raw.mainCategoryId}".`);
        }
        return {
          id: mappingId,
          displayLabel,
          mainCategoryId: main?.id || grp.mainCategoryId,
          mainCategorySlug: main?.slug || '',
          mainCategoryName: main?.name || '',
          categoryGroupId: grp.id,
          categoryGroupSlug: grp.slug,
          categoryGroupName: grp.name,
          mappingStatus: raw?.mappingStatus === 'UNMAPPED' ? 'UNMAPPED' : 'GROUP_MATCH',
          sortOrder,
          isActive,
        };
      }

      const resolved = resolveNewLaunchCategoryMapping(displayLabel, pool, preferredGroupId, sortOrder, mappingId);
      return { ...resolved, isActive };
    });
  }

  private validateProductIds(productIds: any): string[] {
    if (!Array.isArray(productIds)) return [];
    const validSet = new Set(dbStore.products.map((p) => p.id));
    const clean: string[] = [];
    for (const rawId of productIds) {
      const id = String(rawId || '').trim();
      if (!id) continue;
      if (!validSet.has(id)) {
        throw new BadRequestException(`Invalid product ID "${id}" in New Launches collection.`);
      }
      if (!clean.includes(id)) clean.push(id);
    }
    return clean;
  }

  private hydrateCollectionLiveShortcuts(
    col: NewLaunchCollection,
    customerOnly: boolean,
    tenantId = DEFAULT_TENANT
  ): NewLaunchCollection {
    const cleanTenant = tenantId || DEFAULT_TENANT;
    const pool = this.getTenantPool(cleanTenant);
    const cloned = this.cloneRecord(col);
    const activePts = new Map(pool.productTypes.map((pt) => [pt.id, pt]));
    const activeGroups = new Map(pool.childCategories.map((c) => [c.id, c]));
    const activeMains = new Map(pool.mainCategories.map((m) => [m.id, m]));

    const rawMappings = Array.isArray(cloned.categoryMappings) ? cloned.categoryMappings : [];
    cloned.categoryMappings = rawMappings
      .map((m) => {
        if (m.mappingStatus === 'MAPPED' && m.childCategoryId) {
          const pt = activePts.get(m.childCategoryId);
          const grp = pt ? activeGroups.get(pt.childCategoryId) : undefined;
          const main = grp ? activeMains.get(grp.mainCategoryId) : undefined;
          if (
            !pt ||
            !grp ||
            !main ||
            pt.isActive === false ||
            grp.isActive === false ||
            !this.isMainCategoryActiveForPortals(cleanTenant, main.id)
          ) {
            return null;
          }
          return {
            ...m,
            mainCategoryId: main.id,
            mainCategorySlug: main.slug,
            mainCategoryName: main.name,
            categoryGroupId: grp.id,
            categoryGroupSlug: grp.slug,
            categoryGroupName: grp.name,
            childCategoryId: pt.id,
            childCategorySlug: pt.slug,
            childCategoryName: pt.name,
          };
        }
        return customerOnly ? null : m;
      })
      .filter((m): m is NewLaunchCategoryMapping => Boolean(m && (!customerOnly || m.isActive !== false)))
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    return cloned;
  }

  getNewLaunchCollections(tenantId: string, onlyActiveAndInWindow = false): NewLaunchCollection[] {
    const now = Date.now();
    const cleanTenant = this.resolveNavTenantId(tenantId);
    const pool = this.getTenantPool(cleanTenant);
    return this.newLaunchCollections
      .filter((col) => !col.tenantId || col.tenantId === GLOBAL_TENANT || col.tenantId === cleanTenant)
      .filter((col) => {
        if (!onlyActiveAndInWindow) return true;
        if (!col.isActive) return false;
        if (col.publishStatus === 'DRAFT') return false;
        if (col.mainCategoryId) {
          const linkedMain = pool.mainCategories.find((m) => m.id === col.mainCategoryId);
          if (linkedMain && !this.isMainCategoryActiveForPortals(cleanTenant, linkedMain.id)) {
            return false;
          }
        }
        if (col.categoryGroupId) {
          const linkedGroup = pool.childCategories.find((c) => c.id === col.categoryGroupId);
          if (
            linkedGroup &&
            (linkedGroup.isActive === false || !this.isMainCategoryActiveForPortals(cleanTenant, linkedGroup.mainCategoryId))
          ) {
            return false;
          }
        }
        if (col.startDate) {
          const s = new Date(col.startDate).getTime();
          if (!Number.isNaN(s) && now < s) return false;
        }
        if (col.endDate) {
          const e = new Date(col.endDate).getTime();
          if (!Number.isNaN(e) && now > e) return false;
        }
        return true;
      })
      .map((col) => this.hydrateCollectionLiveShortcuts(col, onlyActiveAndInWindow, cleanTenant))
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  getNewLaunchAdminState(tenantId: string) {
    const cleanTenant = this.resolveNavTenantId(tenantId);
    const hasDraft = this.newLaunchDraftDirty.has(cleanTenant) && this.newLaunchDrafts.has(cleanTenant);
    const draftCols = this.getNewLaunchTargetPool(cleanTenant, hasDraft).sort(
      (a, b) => a.displayOrder - b.displayOrder
    );
    const liveCols = this.getNewLaunchCollections(cleanTenant, false);
    const report = this.buildNewLaunchesReport(draftCols, 0, draftCols.length, true);
    this.newLaunchesMigrationReport = report;
    return {
      collections: this.cloneRecord(draftCols),
      liveCollections: liveCols,
      hasUnpublishedChanges: hasDraft,
      migrationReport: report,
    };
  }

  getNewLaunchPreview(tenantId: string): NewLaunchCollection[] {
    const cleanTenant = this.resolveNavTenantId(tenantId);
    const hasDraft = this.newLaunchDraftDirty.has(cleanTenant) && this.newLaunchDrafts.has(cleanTenant);
    return this.getNewLaunchTargetPool(cleanTenant, hasDraft)
      .filter((col) => col.isActive !== false)
      .map((col) => this.hydrateCollectionLiveShortcuts(col, true))
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async createNewLaunchCollection(
    tenantId: string,
    payload: Partial<NewLaunchCollection> & { name?: string; isVisible?: boolean; saveAsDraft?: boolean; confirmIncompleteMappings?: boolean }
  ): Promise<NewLaunchCollection> {
    const cleanTenant = this.resolveNavTenantId(tenantId);
    const resolvedTitle = (payload.title || payload.name || '').trim();
    if (!resolvedTitle) throw new BadRequestException('Collection title is required.');
    const saveAsDraft = Boolean(payload.saveAsDraft);
    const publishStatus: 'DRAFT' | 'PUBLISHED' =
      saveAsDraft || payload.publishStatus === 'DRAFT' ? 'DRAFT' : 'PUBLISHED';

    const slug = (payload.slug?.trim() || resolvedTitle)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const targetList = saveAsDraft ? this.ensureNewLaunchDraft(cleanTenant) : this.newLaunchCollections;
    if (targetList.some((c) => c.slug.toLowerCase() === slug && (!c.tenantId || c.tenantId === GLOBAL_TENANT || c.tenantId === cleanTenant))) {
      throw new BadRequestException(`New Launch collection slug "${slug}" already exists.`);
    }

    const grp = payload.categoryGroupId
      ? this.childCategories.find((c) => c.id === payload.categoryGroupId)
      : undefined;
    if (payload.categoryGroupId && !grp) {
      throw new BadRequestException(`Invalid categoryGroupId "${payload.categoryGroupId}".`);
    }
    const main = grp ? this.mainCategories.find((m) => m.id === grp.mainCategoryId) : undefined;

    const categoryMappings = this.validateAndNormalizeMappings(
      payload.categoryMappings,
      payload.categoryGroupId
    );
    if (publishStatus === 'PUBLISHED' && !payload.confirmIncompleteMappings) {
      const bad = categoryMappings.filter((m) => m.isActive !== false && m.mappingStatus === 'UNMAPPED');
      if (bad.length > 0) {
        throw new BadRequestException(
          `Cannot publish collection with unmapped child categories: ${bad.map((b) => b.displayLabel).join(', ')}. Map them or pass confirmIncompleteMappings.`
        );
      }
    }

    const productIds = this.validateProductIds(payload.productIds);
    const now = new Date().toISOString();
    const record: NewLaunchCollection = {
      id: `nl-col-${Date.now()}`,
      tenantId: cleanTenant,
      title: resolvedTitle,
      name: resolvedTitle,
      slug,
      description: payload.description || '',
      image: payload.image || payload.bannerImage || grp?.image || '',
      bannerImage: payload.bannerImage || payload.image || '',
      badge: payload.badge || 'NEW LAUNCH',
      mainCategoryId: main?.id || payload.mainCategoryId,
      mainCategoryName: main?.name || payload.mainCategoryName,
      categoryGroupId: grp?.id || payload.categoryGroupId,
      categoryGroupSlug: grp?.slug || payload.categoryGroupSlug,
      categoryGroupName: grp?.name || payload.categoryGroupName,
      categoryMappings,
      productIds,
      displayOrder: Number(payload.displayOrder ?? targetList.length + 1),
      startDate: payload.startDate || undefined,
      endDate: payload.endDate || undefined,
      isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : payload.isVisible !== false,
      publishStatus,
      createdAt: now,
      updatedAt: now,
    };

    if (saveAsDraft) {
      targetList.push(record);
      this.newLaunchDraftDirty.add(cleanTenant);
    } else {
      this.newLaunchCollections.push(record);
      await platformPersistenceService.upsert(NewLaunchCollectionModel, record);
      if (this.newLaunchDrafts.has(cleanTenant) && !this.newLaunchDraftDirty.has(cleanTenant)) {
        this.newLaunchDrafts.set(cleanTenant, this.cloneRecord(this.getNewLaunchTargetPool(cleanTenant, false)));
      }
    }
    return record;
  }

  async updateNewLaunchCollection(
    tenantId: string,
    id: string,
    updates: Partial<NewLaunchCollection> & { name?: string; isVisible?: boolean; saveAsDraft?: boolean; confirmIncompleteMappings?: boolean }
  ): Promise<NewLaunchCollection> {
    const cleanTenant = this.resolveNavTenantId(tenantId);
    const saveAsDraft = Boolean(updates.saveAsDraft);
    const pool = saveAsDraft ? this.ensureNewLaunchDraft(cleanTenant) : this.newLaunchCollections;

    const existing = pool.find(
      (c) => c.id === id && (!c.tenantId || c.tenantId === GLOBAL_TENANT || c.tenantId === cleanTenant)
    );
    if (!existing) throw new BadRequestException(`New Launch collection ${id} not found.`);

    const nextTitle = updates.title !== undefined ? updates.title : updates.name;
    if (nextTitle !== undefined) {
      if (!nextTitle.trim()) throw new BadRequestException('Collection title cannot be empty.');
      existing.title = nextTitle.trim();
      existing.name = nextTitle.trim();
    }
    if (updates.slug !== undefined && updates.slug.trim()) {
      existing.slug = this.toSlug(updates.slug);
    }
    if (updates.description !== undefined) existing.description = updates.description;
    if (updates.image !== undefined) existing.image = updates.image;
    if (updates.bannerImage !== undefined) existing.bannerImage = updates.bannerImage;
    if (updates.badge !== undefined) existing.badge = updates.badge;
    if (updates.categoryGroupId !== undefined) {
      if (updates.categoryGroupId) {
        const grp = this.childCategories.find((c) => c.id === updates.categoryGroupId);
        if (!grp) throw new BadRequestException(`Invalid categoryGroupId "${updates.categoryGroupId}".`);
        const main = this.mainCategories.find((m) => m.id === grp.mainCategoryId);
        existing.categoryGroupId = grp.id;
        existing.categoryGroupSlug = grp.slug;
        existing.categoryGroupName = grp.name;
        existing.mainCategoryId = main?.id;
        existing.mainCategoryName = main?.name;
      } else {
        existing.categoryGroupId = undefined;
        existing.categoryGroupSlug = undefined;
        existing.categoryGroupName = undefined;
      }
    }
    if (updates.categoryMappings !== undefined) {
      const normalized = this.validateAndNormalizeMappings(
        updates.categoryMappings,
        existing.categoryGroupId
      );
      if (!saveAsDraft && updates.publishStatus === 'PUBLISHED' && !updates.confirmIncompleteMappings) {
        const bad = normalized.filter((m) => m.isActive !== false && m.mappingStatus === 'UNMAPPED');
        if (bad.length > 0) {
          throw new BadRequestException(
            `Unmapped categories require Admin confirmation before publishing: ${bad.map((b) => b.displayLabel).join(', ')}`
          );
        }
      }
      existing.categoryMappings = normalized;
    }
    if (updates.productIds !== undefined) {
      existing.productIds = this.validateProductIds(updates.productIds);
    }
    if (updates.displayOrder !== undefined) existing.displayOrder = Number(updates.displayOrder);
    if (updates.startDate !== undefined) existing.startDate = updates.startDate || undefined;
    if (updates.endDate !== undefined) existing.endDate = updates.endDate || undefined;
    const nextActive = updates.isActive !== undefined ? updates.isActive : updates.isVisible;
    if (nextActive !== undefined) existing.isActive = Boolean(nextActive);
    if (updates.publishStatus !== undefined) existing.publishStatus = updates.publishStatus;
    existing.updatedAt = new Date().toISOString();

    if (saveAsDraft) {
      this.newLaunchDraftDirty.add(cleanTenant);
    } else {
      await platformPersistenceService.upsert(NewLaunchCollectionModel, existing);
    }
    return existing;
  }

  async reorderNewLaunchCollections(
    tenantId: string,
    orderedIds: string[],
    saveAsDraft = false
  ): Promise<NewLaunchCollection[]> {
    const cleanTenant = this.resolveNavTenantId(tenantId);
    const pool = saveAsDraft ? this.ensureNewLaunchDraft(cleanTenant) : this.newLaunchCollections;
    const now = new Date().toISOString();
    const orderMap = new Map(orderedIds.map((id, idx) => [id, idx + 1]));

    for (const col of pool) {
      if (orderMap.has(col.id)) {
        col.displayOrder = orderMap.get(col.id)!;
        col.updatedAt = now;
        if (!saveAsDraft) {
          await platformPersistenceService.upsert(NewLaunchCollectionModel, col);
        }
      }
    }
    if (saveAsDraft) {
      this.newLaunchDraftDirty.add(cleanTenant);
    }
    return pool.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async upsertNewLaunchMapping(
    tenantId: string,
    collectionId: string,
    mappingPayload: {
      mappingId?: string;
      displayLabel: string;
      mainCategoryId?: string;
      categoryGroupId?: string;
      childCategoryId?: string;
      sortOrder?: number;
      isActive?: boolean;
      saveAsDraft?: boolean;
    }
  ): Promise<NewLaunchCollection> {
    const cleanTenant = this.resolveNavTenantId(tenantId);
    const saveAsDraft = Boolean(mappingPayload.saveAsDraft);
    const pool = saveAsDraft ? this.ensureNewLaunchDraft(cleanTenant) : this.newLaunchCollections;
    const col = pool.find((c) => c.id === collectionId);
    if (!col) throw new BadRequestException(`New Launch collection ${collectionId} not found.`);

    const [normalized] = this.validateAndNormalizeMappings(
      [
        {
          id: mappingPayload.mappingId,
          displayLabel: mappingPayload.displayLabel,
          mainCategoryId: mappingPayload.mainCategoryId,
          categoryGroupId: mappingPayload.categoryGroupId,
          childCategoryId: mappingPayload.childCategoryId,
          sortOrder: mappingPayload.sortOrder ?? (col.categoryMappings?.length || 0) + 1,
          isActive: mappingPayload.isActive !== false,
        },
      ],
      col.categoryGroupId
    );

    const list = [...(col.categoryMappings || [])];
    const idx = list.findIndex(
      (m) =>
        (mappingPayload.mappingId && m.id === mappingPayload.mappingId) ||
        m.displayLabel.trim().toLowerCase() === normalized.displayLabel.trim().toLowerCase()
    );
    if (idx >= 0) {
      list[idx] = { ...normalized, id: list[idx].id };
    } else {
      list.push(normalized);
    }
    col.categoryMappings = list;
    col.updatedAt = new Date().toISOString();

    if (saveAsDraft) {
      this.newLaunchDraftDirty.add(cleanTenant);
    } else {
      await platformPersistenceService.upsert(NewLaunchCollectionModel, col);
    }
    return col;
  }

  async removeNewLaunchMapping(
    tenantId: string,
    collectionId: string,
    mappingId: string,
    saveAsDraft = false
  ): Promise<NewLaunchCollection> {
    const cleanTenant = this.resolveNavTenantId(tenantId);
    const pool = saveAsDraft ? this.ensureNewLaunchDraft(cleanTenant) : this.newLaunchCollections;
    const col = pool.find((c) => c.id === collectionId);
    if (!col) throw new BadRequestException(`New Launch collection ${collectionId} not found.`);

    col.categoryMappings = (col.categoryMappings || []).filter((m) => m.id !== mappingId);
    col.updatedAt = new Date().toISOString();

    if (saveAsDraft) {
      this.newLaunchDraftDirty.add(cleanTenant);
    } else {
      await platformPersistenceService.upsert(NewLaunchCollectionModel, col);
    }
    return col;
  }

  async publishNewLaunchCollection(
    tenantId: string,
    collectionId: string,
    options: { confirmIncompleteMappings?: boolean } = {}
  ): Promise<NewLaunchCollection> {
    const cleanTenant = this.resolveNavTenantId(tenantId);
    const draftList = this.newLaunchDrafts.get(cleanTenant);
    const draftCol = draftList?.find((c) => c.id === collectionId);
    const target = draftCol || this.newLaunchCollections.find((c) => c.id === collectionId);
    if (!target) throw new BadRequestException(`New Launch collection ${collectionId} not found.`);

    const validatedMappings = this.validateAndNormalizeMappings(
      target.categoryMappings || [],
      target.categoryGroupId
    );
    const unmapped = validatedMappings.filter(
      (m) => m.isActive !== false && m.mappingStatus === 'UNMAPPED'
    );
    if (unmapped.length > 0 && !options.confirmIncompleteMappings) {
      throw new BadRequestException(
        `Cannot publish "${target.title}": unmapped child categories (${unmapped.map((u) => u.displayLabel).join(', ')}) must be mapped, removed, or explicitly confirmed.`
      );
    }

    const published: NewLaunchCollection = {
      ...this.cloneRecord(target),
      categoryMappings: validatedMappings,
      publishStatus: 'PUBLISHED',
      isActive: true,
      updatedAt: new Date().toISOString(),
    };
    this.upsertArrayById(this.newLaunchCollections, published);
    await platformPersistenceService.upsert(NewLaunchCollectionModel, published);

    if (draftCol && draftList) {
      const idx = draftList.findIndex((c) => c.id === collectionId);
      if (idx >= 0) draftList[idx] = this.cloneRecord(published);
    }
    this.newLaunchesMigrationReport = this.buildNewLaunchesReport(this.newLaunchCollections);
    return published;
  }

  async publishAllNewLaunchDrafts(
    tenantId: string,
    options: { confirmIncompleteMappings?: boolean } = {}
  ): Promise<NewLaunchCollection[]> {
    const cleanTenant = this.resolveNavTenantId(tenantId);
    const draftList = this.ensureNewLaunchDraft(cleanTenant);
    const now = new Date().toISOString();

    for (const col of draftList) {
      const validated = this.validateAndNormalizeMappings(col.categoryMappings || [], col.categoryGroupId);
      const unmapped = validated.filter((m) => m.isActive !== false && m.mappingStatus === 'UNMAPPED');
      if (unmapped.length > 0 && !options.confirmIncompleteMappings) {
        throw new BadRequestException(
          `Cannot publish "${col.title}": unmapped shortcuts remain (${unmapped.map((u) => u.displayLabel).join(', ')}). Confirm or map them first.`
        );
      }
      col.categoryMappings = validated;
      if (col.isActive !== false) col.publishStatus = 'PUBLISHED';
      col.updatedAt = now;
    }

    const draftIds = new Set(draftList.map((d) => d.id));
    for (const existing of [...this.newLaunchCollections]) {
      if ((existing.tenantId === cleanTenant || existing.tenantId === GLOBAL_TENANT) && !draftIds.has(existing.id)) {
        this.newLaunchCollections = this.newLaunchCollections.filter((c) => c.id !== existing.id);
        await platformPersistenceService.remove(NewLaunchCollectionModel, existing.id);
      }
    }
    for (const col of draftList) {
      this.upsertArrayById(this.newLaunchCollections, this.cloneRecord(col));
      await platformPersistenceService.upsert(NewLaunchCollectionModel, col);
    }
    this.newLaunchDraftDirty.delete(cleanTenant);
    this.newLaunchDrafts.set(cleanTenant, this.cloneRecord(draftList));
    this.newLaunchesMigrationReport = this.buildNewLaunchesReport(this.newLaunchCollections);
    return this.getNewLaunchCollections(cleanTenant, false);
  }

  async unpublishNewLaunchCollection(tenantId: string, collectionId: string): Promise<NewLaunchCollection> {
    const cleanTenant = this.resolveNavTenantId(tenantId);
    const live = this.newLaunchCollections.find((c) => c.id === collectionId);
    if (!live) throw new BadRequestException(`New Launch collection ${collectionId} not found.`);
    live.publishStatus = 'DRAFT';
    live.isActive = false;
    live.updatedAt = new Date().toISOString();
    await platformPersistenceService.upsert(NewLaunchCollectionModel, live);

    if (this.newLaunchDrafts.has(cleanTenant)) {
      const draftCol = this.newLaunchDrafts.get(cleanTenant)!.find((c) => c.id === collectionId);
      if (draftCol) {
        draftCol.publishStatus = 'DRAFT';
        draftCol.isActive = false;
        draftCol.updatedAt = live.updatedAt;
      }
    }
    return live;
  }

  async deleteNewLaunchCollection(tenantId: string, id: string, saveAsDraft = false) {
    const cleanTenant = this.resolveNavTenantId(tenantId);
    if (saveAsDraft) {
      const draftPool = this.ensureNewLaunchDraft(cleanTenant);
      const dIdx = draftPool.findIndex((c) => c.id === id);
      if (dIdx < 0) throw new BadRequestException(`New Launch collection ${id} not found.`);
      const [removed] = draftPool.splice(dIdx, 1);
      this.newLaunchDraftDirty.add(cleanTenant);
      return removed;
    }
    const idx = this.newLaunchCollections.findIndex(
      (c) => c.id === id && (!c.tenantId || c.tenantId === GLOBAL_TENANT || c.tenantId === cleanTenant)
    );
    if (idx < 0) throw new BadRequestException(`New Launch collection ${id} not found.`);
    const [removed] = this.newLaunchCollections.splice(idx, 1);
    await platformPersistenceService.remove(NewLaunchCollectionModel, id);
    if (this.newLaunchDrafts.has(cleanTenant)) {
      this.newLaunchDrafts.set(
        cleanTenant,
        this.newLaunchDrafts.get(cleanTenant)!.filter((c) => c.id !== id)
      );
    }
    return removed;
  }

  // ==================== DYNAMIC CATEGORY FIELD SCHEMAS ====================

  getTenantFieldSchemas(
    tenantId = DEFAULT_TENANT,
    childCategoryIdOrSlug?: string,
    includeInactive = false
  ): CategoryFieldSchema[] {
    const cleanTenant = tenantId || DEFAULT_TENANT;
    let targetChildId = '';
    let targetChildSlug = '';
    if (childCategoryIdOrSlug) {
      const needle = childCategoryIdOrSlug.trim().toLowerCase();
      const child = this.childCategories.find(
        (c) =>
          (c.id.toLowerCase() === needle || c.slug.toLowerCase() === needle) &&
          (!c.tenantId || c.tenantId === GLOBAL_TENANT || c.tenantId === cleanTenant)
      );
      targetChildId = child?.id || childCategoryIdOrSlug;
      targetChildSlug = child?.slug || childCategoryIdOrSlug;
    }

    return this.categoryFieldSchemas
      .filter((f) => !f.tenantId || f.tenantId === GLOBAL_TENANT || f.tenantId === cleanTenant)
      .filter((f) => includeInactive || f.isActive !== false)
      .filter((f) => {
        if (!childCategoryIdOrSlug) return true;
        return (
          f.childCategoryId.toLowerCase() === targetChildId.toLowerCase() ||
          f.childCategorySlug.toLowerCase() === targetChildSlug.toLowerCase()
        );
      })
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async createCategoryField(
    tenantId: string,
    payload: Partial<CategoryFieldSchema>
  ): Promise<CategoryFieldSchema> {
    if (!payload.childCategoryId && !payload.childCategorySlug) {
      throw new BadRequestException('Child category is required.');
    }
    const needle = String(payload.childCategoryId || payload.childCategorySlug).toLowerCase();
    const child = this.childCategories.find(
      (c) => c.id.toLowerCase() === needle || c.slug.toLowerCase() === needle
    );
    if (!child) throw new BadRequestException('Valid Child Category not found.');
    const label = (payload.label || '').trim();
    if (!label) throw new BadRequestException('Field label is required.');
    const validTypes: CategoryFieldType[] = ['text', 'number', 'dropdown', 'multiselect', 'checkbox', 'textarea'];
    const fieldType: CategoryFieldType = validTypes.includes(payload.fieldType as CategoryFieldType)
      ? (payload.fieldType as CategoryFieldType)
      : 'text';
    const fieldKey = (payload.fieldKey?.trim() || label)
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
      .replace(/[^a-zA-Z0-9]/g, '')
      .replace(/^(.)/, (m) => m.toLowerCase());
    if (!fieldKey) throw new BadRequestException('Valid field key could not be derived.');

    const existingForChild = this.getTenantFieldSchemas(tenantId, child.id, true);
    if (existingForChild.some((f) => f.fieldKey.toLowerCase() === fieldKey.toLowerCase())) {
      throw new BadRequestException(`Field "${label}" already exists on ${child.name}.`);
    }

    if ((fieldType === 'dropdown' || fieldType === 'multiselect') && (!Array.isArray(payload.options) || payload.options.length === 0)) {
      throw new BadRequestException(`Dropdown / Multi-select fields require at least one option.`);
    }

    const now = new Date().toISOString();
    const record: CategoryFieldSchema = {
      id: `cfs-${child.id}-${Date.now()}`,
      tenantId,
      childCategoryId: child.id,
      childCategorySlug: child.slug,
      fieldKey,
      label,
      fieldType,
      options: Array.isArray(payload.options) ? payload.options.map((o) => String(o).trim()).filter(Boolean) : undefined,
      required: Boolean(payload.required),
      placeholder: payload.placeholder?.trim() || undefined,
      helpText: payload.helpText?.trim() || undefined,
      unitSuffix: payload.unitSuffix?.trim() || undefined,
      group: payload.group?.trim() || 'Core Product Attributes',
      validation: payload.validation,
      displayOrder: Number(payload.displayOrder ?? existingForChild.length + 1),
      isActive: payload.isActive !== false,
      createdAt: now,
      updatedAt: now,
    };
    this.categoryFieldSchemas.push(record);
    await platformPersistenceService.upsert(CategoryFieldSchemaModel, record);
    return record;
  }

  async updateCategoryField(
    tenantId: string,
    id: string,
    updates: Partial<CategoryFieldSchema>
  ): Promise<CategoryFieldSchema> {
    const existing = this.categoryFieldSchemas.find(
      (f) => f.id === id && (!f.tenantId || f.tenantId === GLOBAL_TENANT || f.tenantId === tenantId)
    );
    if (!existing) throw new BadRequestException(`Field configuration ${id} not found.`);
    if (updates.label !== undefined) {
      if (!updates.label.trim()) throw new BadRequestException('Field label cannot be empty.');
      existing.label = updates.label.trim();
    }
    if (updates.fieldType !== undefined) existing.fieldType = updates.fieldType;
    if (updates.options !== undefined) {
      existing.options = Array.isArray(updates.options)
        ? updates.options.map((o) => String(o).trim()).filter(Boolean)
        : [];
    }
    if ((existing.fieldType === 'dropdown' || existing.fieldType === 'multiselect') && (!existing.options || existing.options.length === 0)) {
      throw new BadRequestException('Dropdown / Multi-select fields require at least one option.');
    }
    if (updates.required !== undefined) existing.required = Boolean(updates.required);
    if (updates.placeholder !== undefined) existing.placeholder = updates.placeholder?.trim() || undefined;
    if (updates.helpText !== undefined) existing.helpText = updates.helpText?.trim() || undefined;
    if (updates.unitSuffix !== undefined) existing.unitSuffix = updates.unitSuffix?.trim() || undefined;
    if (updates.group !== undefined) existing.group = updates.group?.trim() || 'Core Product Attributes';
    if (updates.validation !== undefined) existing.validation = updates.validation;
    if (updates.displayOrder !== undefined) existing.displayOrder = Number(updates.displayOrder);
    if (updates.isActive !== undefined) existing.isActive = Boolean(updates.isActive);
    existing.updatedAt = new Date().toISOString();
    await platformPersistenceService.upsert(CategoryFieldSchemaModel, existing);
    return existing;
  }

  async deleteCategoryField(tenantId: string, id: string): Promise<{ id: string; deleted: boolean }> {
    const idx = this.categoryFieldSchemas.findIndex(
      (f) => f.id === id && (!f.tenantId || f.tenantId === GLOBAL_TENANT || f.tenantId === tenantId)
    );
    if (idx < 0) throw new BadRequestException(`Field configuration ${id} not found.`);
    this.categoryFieldSchemas.splice(idx, 1);
    await platformPersistenceService.remove(CategoryFieldSchemaModel, id);
    return { id, deleted: true };
  }

  /**
   * Validates Vendor product categoryAttributes against Admin-configured CategoryFieldSchema
   * and normalizes values into Customer PDP-ready specifications entries.
   */
  public resolveNewLaunchCollectionScope(
    tenantId: string,
    needle?: string,
    useDraft = false,
    onlyActive = false
  ): NewLaunchCollection | undefined {
    const cleanNeedle = String(needle || '').trim().toLowerCase();
    if (!cleanNeedle) return undefined;
    const cleanTenant = this.resolveNavTenantId(tenantId);
    const pool = useDraft && this.newLaunchDrafts.has(cleanTenant)
      ? this.newLaunchDrafts.get(cleanTenant)!
      : this.newLaunchCollections;
    return pool.find((col) => {
      if (col.tenantId && col.tenantId !== GLOBAL_TENANT && col.tenantId !== cleanTenant) return false;
      if (onlyActive && (col.isActive === false || col.publishStatus === 'DRAFT')) return false;
      return (
        col.id.toLowerCase() === cleanNeedle ||
        (col.slug || '').toLowerCase() === cleanNeedle ||
        (col.title || col.name || '').trim().toLowerCase() === cleanNeedle
      );
    });
  }

  public async attachProductToNewLaunchCollection(tenantId: string, product: any): Promise<void> {
    const colId = String(product?.newLaunchCollectionId || '').trim();
    if (!colId || !product?.id) return;
    const col = this.resolveNewLaunchCollectionScope(tenantId, colId, false, false);
    if (!col) return;
    const cleanProdId = String(product.id).replace(/^vp-/, '');
    const ids = new Set(col.productIds || []);
    let changed = false;
    for (const candidate of [String(product.id), cleanProdId]) {
      if (candidate && !ids.has(candidate)) {
        ids.add(candidate);
        changed = true;
      }
    }
    if (changed) {
      col.productIds = Array.from(ids);
      col.updatedAt = new Date().toISOString();
      await platformPersistenceService.upsert(NewLaunchCollectionModel, col);
    }
  }

  public validateAndNormalizeCategoryAttributes(
    tenantId: string,
    childCategoryIdOrSlug: string,
    rawAttributes: Record<string, any> | undefined,
    options: {
      strictRequired?: boolean;
      productTypeId?: string;
      newLaunchCollectionId?: string;
      existingAttributes?: Record<string, any>;
    } = {}
  ): {
    validatedAttributes: Record<string, any>;
    specificationEntries: Record<string, string>;
    fieldErrors: Record<string, string>;
  } {
    const matchedCollection = options.newLaunchCollectionId
      ? this.resolveNewLaunchCollectionScope(tenantId, options.newLaunchCollectionId, false, true)
      : undefined;
    if (options.newLaunchCollectionId && !matchedCollection) {
      throw new BadRequestException('Selected New Launches collection is currently inactive or unavailable.');
    }

    const allFilterConfigs = this.getCategoryFilterConfigs(tenantId, {
      childCategoryId: matchedCollection ? undefined : childCategoryIdOrSlug,
      newLaunchCollectionId: matchedCollection?.id,
      productTypeId: matchedCollection ? undefined : options.productTypeId,
      useDraft: false,
      includeInactive: true,
    });
    const schemas = this.getVendorCombinedCategoryFields(
      tenantId,
      childCategoryIdOrSlug,
      options.productTypeId,
      matchedCollection?.id
    );
    const input = rawAttributes && typeof rawAttributes === 'object' ? rawAttributes : {};
    const existingInput =
      options.existingAttributes && typeof options.existingAttributes === 'object' ? options.existingAttributes : {};
    const validatedAttributes: Record<string, any> = {};
    const specificationEntries: Record<string, string> = {};
    const fieldErrors: Record<string, string> = {};
    const activeSchemaKeys = new Set(schemas.map((s) => s.fieldKey.toLowerCase()));

    // Reject newly submitted or modified values targeting an explicitly inactive/disabled or unconfigured filter rule
    for (const [k, v] of Object.entries(input)) {
      const isNonEmpty =
        v !== undefined &&
        v !== null &&
        !(typeof v === 'string' && v.trim() === '') &&
        !(Array.isArray(v) && v.length === 0);
      if (!isNonEmpty) continue;
      if (JSON.stringify(v) === JSON.stringify(existingInput[k])) continue;
      const inactiveRule = allFilterConfigs.find(
        (fc) => fc.fieldKey.toLowerCase() === k.toLowerCase() && (fc.isActive === false || fc.showInVendor === false)
      );
      if (inactiveRule) {
        fieldErrors[k] = `${inactiveRule.filterName} is inactive for this ${matchedCollection ? 'collection' : 'category'} and cannot be submitted.`;
      } else if (matchedCollection && !activeSchemaKeys.has(k.toLowerCase())) {
        fieldErrors[k] = `Field "${k}" is not configured for New Launches collection "${matchedCollection.title}".`;
      }
    }

    for (const schema of schemas) {
      const rawVal = input[schema.fieldKey];
      const isMissing =
        rawVal === undefined ||
        rawVal === null ||
        (typeof rawVal === 'string' && rawVal.trim() === '') ||
        (Array.isArray(rawVal) && rawVal.length === 0);

      if (isMissing) {
        if (options.strictRequired && schema.required) {
          fieldErrors[schema.fieldKey] = `${schema.label} is required.`;
        }
        continue;
      }

      if (schema.fieldType === 'number') {
        const num = Number(rawVal);
        if (Number.isNaN(num)) {
          fieldErrors[schema.fieldKey] = `${schema.label} must be a valid number.`;
          continue;
        }
        if (schema.validation?.min !== undefined && num < schema.validation.min) {
          fieldErrors[schema.fieldKey] = `${schema.label} must be at least ${schema.validation.min}.`;
          continue;
        }
        if (schema.validation?.max !== undefined && num > schema.validation.max) {
          fieldErrors[schema.fieldKey] = `${schema.label} cannot exceed ${schema.validation.max}.`;
          continue;
        }
        validatedAttributes[schema.fieldKey] = num;
        specificationEntries[schema.label] = schema.unitSuffix ? `${num} ${schema.unitSuffix}` : String(num);
      } else if (schema.fieldType === 'checkbox') {
        const boolVal = rawVal === true || rawVal === 'true' || rawVal === 1 || rawVal === 'Yes';
        validatedAttributes[schema.fieldKey] = boolVal;
        if (boolVal) {
          specificationEntries[schema.label] = 'Yes';
        }
      } else if (schema.fieldType === 'multiselect') {
        const list = Array.isArray(rawVal)
          ? rawVal.map((v) => normalizeFilterOptionLabel(String(v))).filter(Boolean)
          : String(rawVal).split(',').map((v) => normalizeFilterOptionLabel(v)).filter(Boolean);
        const deduped = Array.from(new Map(list.map((v) => [v.toLowerCase(), v])).values());
        if (options.strictRequired && schema.required && deduped.length === 0) {
          fieldErrors[schema.fieldKey] = `Select at least one option for ${schema.label}.`;
          continue;
        }
        if (
          schema.allowCustomOption === false &&
          Array.isArray(schema.options) &&
          schema.options.length > 0
        ) {
          const allowedLower = new Set(schema.options.map((o) => o.toLowerCase()));
          const invalidItem = deduped.find((item) => !allowedLower.has(item.toLowerCase()));
          if (invalidItem) {
            fieldErrors[schema.fieldKey] = `Option "${invalidItem}" is not permitted for ${schema.label}.`;
            continue;
          }
        }
        validatedAttributes[schema.fieldKey] = deduped;
        specificationEntries[schema.label] = deduped.join(', ');
      } else if (schema.fieldType === 'dropdown') {
        const str = normalizeFilterOptionLabel(String(rawVal));
        if (
          schema.allowCustomOption === false &&
          schema.options &&
          schema.options.length > 0 &&
          !schema.options.some((o) => o.toLowerCase() === str.toLowerCase())
        ) {
          fieldErrors[schema.fieldKey] = `Invalid option "${str}" for ${schema.label}.`;
          continue;
        }
        validatedAttributes[schema.fieldKey] = str;
        specificationEntries[schema.label] = str;
      } else {
        const str = String(rawVal).trim();
        if (schema.validation?.minLength !== undefined && str.length < schema.validation.minLength) {
          fieldErrors[schema.fieldKey] = `${schema.label} must be at least ${schema.validation.minLength} characters.`;
          continue;
        }
        if (schema.validation?.maxLength !== undefined && str.length > schema.validation.maxLength) {
          fieldErrors[schema.fieldKey] = `${schema.label} cannot exceed ${schema.validation.maxLength} characters.`;
          continue;
        }
        if (schema.validation?.pattern) {
          try {
            const re = new RegExp(schema.validation.pattern);
            if (!re.test(str)) {
              fieldErrors[schema.fieldKey] = schema.validation.patternMessage || `${schema.label} format is invalid.`;
              continue;
            }
          } catch {
            // Ignore malformed admin regex defensively
          }
        }
        validatedAttributes[schema.fieldKey] = str;
        specificationEntries[schema.label] = str;
      }
    }

    // Preserve historical attribute entries on product edit when Admin deactivated a filter later
    for (const [oldKey, oldVal] of Object.entries(existingInput)) {
      if (validatedAttributes[oldKey] === undefined && !fieldErrors[oldKey]) {
        validatedAttributes[oldKey] = oldVal;
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      const firstErr = Object.values(fieldErrors)[0];
      throw new BadRequestException({
        message: firstErr,
        fieldErrors,
      });
    }

    return { validatedAttributes, specificationEntries, fieldErrors };
  }

  // ==================== CENTRALIZED FILTER CONFIGURATIONS ====================

  private deriveFieldKey(raw: string): string {
    return String(raw || '')
      .trim()
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
      .replace(/[^a-zA-Z0-9]/g, '')
      .replace(/^(.)/, (m) => m.toLowerCase());
  }

  getCategoryFilterConfigs(
    tenantId = DEFAULT_TENANT,
    options: {
      childCategoryId?: string;
      newLaunchCollectionId?: string;
      productTypeId?: string;
      useDraft?: boolean;
      showInCustomer?: boolean;
      showInVendor?: boolean;
      includeInactive?: boolean;
    } = {}
  ): CategoryFilterConfiguration[] {
    const cleanTenant = this.resolveNavTenantId(tenantId);
    this.ensureTenantScopedFilterConfigs(cleanTenant);
    const source = options.useDraft
      ? this.getDraftState(cleanTenant).categoryFilterConfigs || this.categoryFilterConfigs
      : this.categoryFilterConfigs;

    const matchedCollection =
      this.resolveNewLaunchCollectionScope(
        cleanTenant,
        options.newLaunchCollectionId || options.childCategoryId,
        options.useDraft,
        false
      );

    if (options.newLaunchCollectionId && !matchedCollection) {
      return [];
    }

    const matchesTenant = (fc: CategoryFilterConfiguration) =>
      cleanTenant === DEFAULT_TENANT
        ? !fc.tenantId || fc.tenantId === GLOBAL_TENANT || fc.tenantId === cleanTenant
        : fc.tenantId === cleanTenant;

    if (matchedCollection) {
      const colIdLow = matchedCollection.id.toLowerCase();
      const colSlugLow = (matchedCollection.slug || '').toLowerCase();
      const tenantScoped = [...source]
        .filter(matchesTenant)
        .filter((fc) => options.useDraft || fc.publishedStatus === 'PUBLISHED')
        .filter(
          (fc) =>
            (fc.newLaunchCollectionId && fc.newLaunchCollectionId.toLowerCase() === colIdLow) ||
            (fc.childCategoryId && fc.childCategoryId.toLowerCase() === colIdLow) ||
            (fc.newLaunchCollectionSlug && fc.newLaunchCollectionSlug.toLowerCase() === colSlugLow)
        );
      return tenantScoped
        .filter((fc) => !fc.productTypeId)
        .filter((fc) => options.includeInactive || fc.isActive !== false)
        .filter((fc) => options.showInCustomer === undefined || fc.showInCustomer === options.showInCustomer)
        .filter((fc) => options.showInVendor === undefined || fc.showInVendor === options.showInVendor)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    }

    let targetChildId = '';
    let targetChildSlug = '';
    if (options.childCategoryId) {
      const rawNeedle = options.childCategoryId.trim().toLowerCase();
      const needle = LEGACY_CATEGORY_SLUG_ALIASES[rawNeedle] || rawNeedle;
      const pool = options.useDraft
        ? this.getDraftState(cleanTenant).childCategories
        : this.getTenantPool(cleanTenant).childCategories;
      const child = pool.find(
        (c) =>
          (c.id.toLowerCase() === needle || c.slug.toLowerCase() === needle || c.name.trim().toLowerCase() === needle) &&
          (!c.tenantId || c.tenantId === GLOBAL_TENANT || c.tenantId === cleanTenant)
      );
      targetChildId = child?.id || options.childCategoryId;
      targetChildSlug = child?.slug || needle;
    }

    const tenantScoped = [...source]
      .filter(matchesTenant)
      .filter((fc) => options.useDraft || fc.publishedStatus === 'PUBLISHED')
      .filter((fc) => {
        if (!options.childCategoryId) return true;
        if (fc.newLaunchCollectionId) return false;
        return (
          fc.childCategoryId.toLowerCase() === targetChildId.toLowerCase() ||
          (fc.childCategorySlug && fc.childCategorySlug.toLowerCase() === targetChildSlug.toLowerCase())
        );
      });

    let scopedBySubLevel = tenantScoped;
    if (options.productTypeId && options.productTypeId !== 'ALL') {
      const ptLow = options.productTypeId.trim().toLowerCase();
      const hasSubOverrides = tenantScoped.some((fc) => (fc.productTypeId || '').toLowerCase() === ptLow);
      scopedBySubLevel = hasSubOverrides
        ? tenantScoped.filter((fc) => (fc.productTypeId || '').toLowerCase() === ptLow)
        : tenantScoped.filter((fc) => !fc.productTypeId);
    } else if (options.childCategoryId) {
      scopedBySubLevel = tenantScoped.filter((fc) => !fc.productTypeId);
    }

    return scopedBySubLevel
      .filter((fc) => options.includeInactive || fc.isActive !== false)
      .filter((fc) => options.showInCustomer === undefined || fc.showInCustomer === options.showInCustomer)
      .filter((fc) => options.showInVendor === undefined || fc.showInVendor === options.showInVendor)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }

  getRealCatalogOptionsMap(
    tenantId = DEFAULT_TENANT,
    childCategoryId?: string,
    productTypeId?: string,
    newLaunchCollectionId?: string
  ): Record<string, string[]> {
    const cleanTenant = this.resolveNavTenantId(tenantId);
    const matchedCollection = this.resolveNewLaunchCollectionScope(
      cleanTenant,
      newLaunchCollectionId || childCategoryId,
      false,
      false
    );
    const pool = this.getTenantPool(cleanTenant);
    const matchedChild =
      !matchedCollection && childCategoryId
        ? pool.childCategories.find(
            (c) => c.id.toLowerCase() === childCategoryId.toLowerCase() || c.slug.toLowerCase() === childCategoryId.toLowerCase()
          )
        : undefined;

    const curatedSet = matchedCollection ? new Set(matchedCollection.productIds || []) : null;
    const mappedTypeIds = matchedCollection
      ? new Set((matchedCollection.categoryMappings || []).filter((m) => m.childCategoryId).map((m) => m.childCategoryId!))
      : null;

    const matchingProducts = dbStore.products.filter((p: any) => {
      if (p.approvalStatus === 'REJECTED' || p.approvalStatus === 'PENDING_APPROVAL') return false;
      if (p.isActive === false || p.isSuspended === true) return false;
      if (matchedCollection) {
        return Boolean(
          curatedSet?.has(p.id) ||
            p.newLaunchCollectionId === matchedCollection.id ||
            (p.productTypeId && mappedTypeIds?.has(p.productTypeId))
        );
      }
      if (!matchedChild) return true;
      const sameChild =
        p.childCategoryId === matchedChild.id ||
        p.categoryId === matchedChild.id ||
        p.childCategorySlug === matchedChild.slug ||
        p.categorySlug === matchedChild.slug;
      if (!sameChild) return false;
      if (productTypeId && productTypeId !== 'ALL') {
        const ptLow = productTypeId.toLowerCase();
        return (
          (p.productTypeId || '').toLowerCase() === ptLow ||
          (p.subcategoryId || '').toLowerCase() === ptLow
        );
      }
      return true;
    });

    const configs = this.getCategoryFilterConfigs(cleanTenant, {
      childCategoryId: matchedCollection ? undefined : matchedChild?.id || childCategoryId,
      newLaunchCollectionId: matchedCollection?.id,
      productTypeId,
      useDraft: true,
      includeInactive: true,
    });
    const dimensions = filterConfigsToDimensions(configs.map((c) => ({ ...c, isActive: true, showInCustomer: true, publishedStatus: 'PUBLISHED' })));
    const dimByKey = new Map(dimensions.map((d) => [d.id, d]));

    const result: Record<string, string[]> = {};
    for (const fc of configs) {
      const dim = dimByKey.get(fc.fieldKey === 'category' ? 'subcategory' : fc.fieldKey);
      const uniqueMap = new Map<string, string>();
      for (const opt of fc.options || []) {
        const norm = normalizeFilterOptionLabel(opt);
        if (norm && !uniqueMap.has(norm.toLowerCase())) uniqueMap.set(norm.toLowerCase(), norm);
      }
      if (dim && fc.fieldKey !== 'category' && fc.fieldKey !== 'price') {
        for (const prod of matchingProducts) {
          for (const val of extractProductValuesForDimension(prod, dim)) {
            const norm = normalizeFilterOptionLabel(val);
            if (norm && !uniqueMap.has(norm.toLowerCase())) uniqueMap.set(norm.toLowerCase(), norm);
          }
        }
      }
      result[fc.fieldKey] = Array.from(uniqueMap.values()).sort((a, b) => a.localeCompare(b));
    }
    return result;
  }

  async createCategoryFilterConfig(
    tenantId: string,
    payload: Partial<CategoryFilterConfiguration> & { saveAsDraft?: boolean }
  ): Promise<CategoryFilterConfiguration> {
    const cleanTenant = this.resolveNavTenantId(tenantId);
    const draft = this.getDraftState(cleanTenant);
    draft.categoryFilterConfigs = draft.categoryFilterConfigs || this.cloneRecord(this.categoryFilterConfigs);
    draft.deletedFilterConfigIds = draft.deletedFilterConfigIds || [];

    const colNeedle = String(payload.newLaunchCollectionId || payload.childCategoryId || payload.childCategorySlug || '').trim();
    const matchedCollection = this.resolveNewLaunchCollectionScope(cleanTenant, colNeedle, true, false);
    const childNeedle = String(payload.childCategoryId || payload.childCategorySlug || '').trim().toLowerCase();
    if (!childNeedle && !matchedCollection) {
      throw new BadRequestException('Main Category or New Launches Collection is required for filter configuration.');
    }
    const child = !matchedCollection
      ? draft.childCategories.find(
          (c) => c.id.toLowerCase() === childNeedle || c.slug.toLowerCase() === childNeedle
        )
      : undefined;
    if (!matchedCollection && !child) throw new BadRequestException(`Category "${childNeedle}" not found.`);

    const cleanPtId =
      !matchedCollection && payload.productTypeId && payload.productTypeId !== 'ALL' ? payload.productTypeId.trim() : undefined;
    const pt = cleanPtId && child ? draft.productTypes.find((t) => t.id === cleanPtId && t.childCategoryId === child.id) : undefined;
    if (cleanPtId && !pt && child) throw new BadRequestException(`Child Category "${cleanPtId}" does not belong to ${child.name}.`);

    const filterName = String(payload.filterName || '').trim();
    if (!filterName) throw new BadRequestException('Filter name is required.');
    const fieldKey = this.deriveFieldKey(payload.fieldKey || filterName);
    if (!fieldKey) throw new BadRequestException('Valid field key could not be derived.');

    const scopeId = matchedCollection ? matchedCollection.id : child!.id;
    const existingForScope = draft.categoryFilterConfigs.filter(
      (f) =>
        (matchedCollection
          ? (f.newLaunchCollectionId || f.childCategoryId) === matchedCollection.id
          : f.childCategoryId === child!.id && !f.newLaunchCollectionId) &&
        (f.productTypeId || undefined) === (pt?.id || undefined)
    );
    if (existingForScope.some((f) => f.fieldKey.toLowerCase() === fieldKey.toLowerCase())) {
      throw new BadRequestException(`Filter "${filterName}" (${fieldKey}) already exists for this scope.`);
    }

    const validFieldTypes: FilterFieldType[] = ['CHECKBOX', 'MULTISELECT', 'DROPDOWN', 'RANGE', 'TEXT', 'NUMBER', 'BOOLEAN'];
    const fieldType: FilterFieldType = validFieldTypes.includes(payload.fieldType as FilterFieldType)
      ? (payload.fieldType as FilterFieldType)
      : 'MULTISELECT';

    const rawOpts = Array.isArray(payload.options)
      ? payload.options.map((o) => normalizeFilterOptionLabel(String(o))).filter(Boolean)
      : [];
    const optionsList = Array.from(new Map(rawOpts.map((o) => [o.toLowerCase(), o])).values());

    const tmpl = STANDARD_CHECKLIST_FILTERS.find((t) => t.fieldKey === fieldKey);
    const parentMain = matchedCollection
      ? draft.mainCategories.find((m) => m.id === matchedCollection.mainCategoryId)
      : draft.mainCategories.find((m) => m.id === child!.mainCategoryId);
    const now = new Date().toISOString();
    const saveAsDraft = payload.saveAsDraft === true;
    const isCoreField = ['category', 'subcategory', 'brand', 'price'].includes(fieldKey);

    const record: CategoryFilterConfiguration = {
      id: `cfc-${scopeId}${pt ? `-${pt.id}` : ''}-${fieldKey}-${Date.now()}`,
      tenantId: cleanTenant,
      mainCategoryId: matchedCollection?.mainCategoryId || child?.mainCategoryId || 'mc-new-launches',
      mainCategoryName: matchedCollection?.mainCategoryName || parentMain?.name || 'New Launches',
      childCategoryId: scopeId,
      childCategorySlug: matchedCollection?.slug || child!.slug,
      childCategoryName: matchedCollection?.title || child!.name,
      newLaunchCollectionId: matchedCollection?.id,
      newLaunchCollectionSlug: matchedCollection?.slug,
      newLaunchCollectionTitle: matchedCollection?.title,
      productTypeId: pt?.id || undefined,
      productTypeSlug: pt?.slug || undefined,
      filterName,
      fieldKey,
      fieldType: fieldKey === 'price' ? 'RANGE' : fieldType,
      options: optionsList,
      specKeys: Array.isArray(payload.specKeys) && payload.specKeys.length > 0 ? payload.specKeys : tmpl?.specKeys || [filterName],
      catAttrKeys: Array.isArray(payload.catAttrKeys) && payload.catAttrKeys.length > 0 ? payload.catAttrKeys : tmpl?.catAttrKeys || [fieldKey],
      isStandardField: payload.isStandardField || tmpl?.isStandardField,
      selectionMode: fieldType === 'RANGE' ? 'SINGLE' : payload.selectionMode === 'SINGLE' ? 'SINGLE' : 'MULTI',
      isRequired: Boolean(payload.isRequired),
      showInVendor: isCoreField ? false : payload.showInVendor !== false,
      showInCustomer: payload.showInCustomer !== false,
      hideEmptyOptions: payload.hideEmptyOptions !== false,
      allowCustomOption: payload.allowCustomOption !== false,
      sortOrder: Number(payload.sortOrder ?? existingForScope.length + 1),
      isActive: payload.isActive !== false,
      publishedStatus: saveAsDraft ? 'DRAFT' : 'PUBLISHED',
      createdAt: now,
      updatedAt: now,
    };

    if (saveAsDraft) {
      draft.categoryFilterConfigs.push(record);
      draft.draftVersion += 1;
      draft.lastDraftSavedAt = now;
      draft.hasUnpublishedChanges = true;
      await this.persistDraftSnapshot(draft);
      return this.cloneRecord(record);
    }

    await platformPersistenceService.upsert(CategoryFilterConfigModel, record, 'id', { throwOnError: true });
    draft.categoryFilterConfigs.push(record);
    this.upsertArrayById(this.categoryFilterConfigs, record);
    draft.draftVersion += 1;
    draft.publishedVersion += 1;
    draft.lastDraftSavedAt = now;
    draft.lastPublishedAt = now;
    await this.persistDraftSnapshot(draft);
    this.invalidateFilterCache(cleanTenant, {
      childCategoryId: record.childCategoryId,
      mainCategoryId: record.mainCategoryId,
      newLaunchCollectionId: record.newLaunchCollectionId,
    });
    return this.cloneRecord(record);
  }

  async updateCategoryFilterConfig(
    tenantId: string,
    id: string,
    updates: Partial<CategoryFilterConfiguration> & { saveAsDraft?: boolean }
  ): Promise<CategoryFilterConfiguration> {
    const cleanTenant = this.resolveNavTenantId(tenantId);
    const draft = this.getDraftState(cleanTenant);
    draft.categoryFilterConfigs = draft.categoryFilterConfigs || this.cloneRecord(this.categoryFilterConfigs);
    const existing = draft.categoryFilterConfigs.find(
      (f) => f.id === id || (cleanTenant !== DEFAULT_TENANT && f.id === `${cleanTenant}::${id}`)
    );
    if (!existing) throw new BadRequestException(`Filter configuration ${id} not found.`);

    const updated = this.cloneRecord(existing);
    if (updates.filterName !== undefined) {
      const nextName = String(updates.filterName).trim();
      if (!nextName) throw new BadRequestException('Filter name cannot be empty.');
      const prevName = updated.filterName;
      updated.filterName = nextName;
      if (!updated.isStandardField) {
        updated.specKeys =
          Array.isArray(updates.specKeys) && updates.specKeys.length > 0
            ? updates.specKeys
            : Array.from(new Set([...(updated.specKeys || []), prevName, nextName].filter(Boolean)));
      }
    }
    if (updates.fieldType !== undefined) updated.fieldType = updates.fieldType;
    if (updates.options !== undefined) {
      const rawOpts = Array.isArray(updates.options)
        ? updates.options.map((o) => normalizeFilterOptionLabel(String(o))).filter(Boolean)
        : [];
      updated.options = Array.from(new Map(rawOpts.map((o) => [o.toLowerCase(), o])).values());
    }
    if (updates.selectionMode !== undefined) {
      updated.selectionMode = updates.selectionMode === 'SINGLE' ? 'SINGLE' : 'MULTI';
    }
    if (updated.fieldType === 'RANGE') {
      updated.selectionMode = 'SINGLE';
    }
    if (updates.isRequired !== undefined) updated.isRequired = Boolean(updates.isRequired);
    if (updates.showInVendor !== undefined) updated.showInVendor = Boolean(updates.showInVendor);
    if (updates.showInCustomer !== undefined) updated.showInCustomer = Boolean(updates.showInCustomer);
    if (updates.hideEmptyOptions !== undefined) updated.hideEmptyOptions = Boolean(updates.hideEmptyOptions);
    if (updates.allowCustomOption !== undefined) updated.allowCustomOption = Boolean(updates.allowCustomOption);
    if (updates.sortOrder !== undefined) updated.sortOrder = Number(updates.sortOrder);
    if (updates.isActive !== undefined) updated.isActive = Boolean(updates.isActive);

    const now = new Date().toISOString();
    updated.updatedAt = now;
    const saveAsDraft = updates.saveAsDraft === true;
    updated.publishedStatus = saveAsDraft ? 'DRAFT' : 'PUBLISHED';

    if (saveAsDraft) {
      Object.assign(existing, updated);
      draft.draftVersion += 1;
      draft.lastDraftSavedAt = now;
      draft.hasUnpublishedChanges = true;
      await this.persistDraftSnapshot(draft);
      return this.cloneRecord(updated);
    }

    await platformPersistenceService.upsert(CategoryFilterConfigModel, updated, 'id', { throwOnError: true });
    Object.assign(existing, updated);
    this.upsertArrayById(this.categoryFilterConfigs, updated);
    draft.draftVersion += 1;
    draft.publishedVersion += 1;
    draft.lastDraftSavedAt = now;
    draft.lastPublishedAt = now;
    await this.persistDraftSnapshot(draft);
    this.invalidateFilterCache(cleanTenant, {
      childCategoryId: updated.childCategoryId,
      mainCategoryId: updated.mainCategoryId,
      newLaunchCollectionId: updated.newLaunchCollectionId,
    });
    return this.cloneRecord(updated);
  }

  async syncCategoryFilters(
    tenantId: string,
    payload: {
      childCategoryId?: string;
      newLaunchCollectionId?: string;
      productTypeId?: string;
      resetOverride?: boolean;
      filters: Array<Partial<CategoryFilterConfiguration> & { fieldKey: string; filterName: string }>;
    }
  ): Promise<CategoryFilterConfiguration[]> {
    const cleanTenant = this.resolveNavTenantId(tenantId);
    const draft = this.getDraftState(cleanTenant);
    draft.categoryFilterConfigs = draft.categoryFilterConfigs || this.cloneRecord(this.categoryFilterConfigs);

    const matchedCollection = this.resolveNewLaunchCollectionScope(
      cleanTenant,
      payload.newLaunchCollectionId || payload.childCategoryId,
      true,
      false
    );

    const childNeedle = String(payload.childCategoryId || '').trim().toLowerCase();
    const child = !matchedCollection
      ? draft.childCategories.find(
          (c) => c.id.toLowerCase() === childNeedle || c.slug.toLowerCase() === childNeedle
        )
      : undefined;
    if (!matchedCollection && !child) {
      throw new BadRequestException(`Category "${payload.newLaunchCollectionId || payload.childCategoryId}" not found.`);
    }

    const cleanPtId =
      !matchedCollection && payload.productTypeId && payload.productTypeId !== 'ALL' ? payload.productTypeId.trim() : undefined;
    const pt = cleanPtId && child ? draft.productTypes.find((t) => t.id === cleanPtId && t.childCategoryId === child.id) : undefined;
    if (cleanPtId && !pt && child) throw new BadRequestException(`Child Category "${cleanPtId}" not found under ${child.name}.`);

    const parentMain = matchedCollection
      ? draft.mainCategories.find((m) => m.id === matchedCollection.mainCategoryId)
      : draft.mainCategories.find((m) => m.id === child!.mainCategoryId);
    const now = new Date().toISOString();
    const scopeId = matchedCollection ? matchedCollection.id : child!.id;

    const scopeMatch = (fc: CategoryFilterConfiguration) =>
      (matchedCollection
        ? (fc.newLaunchCollectionId || fc.childCategoryId) === matchedCollection.id
        : fc.childCategoryId === child!.id && !fc.newLaunchCollectionId) &&
      (fc.productTypeId || undefined) === (pt?.id || undefined);

    const existingScoped = draft.categoryFilterConfigs.filter(scopeMatch);

    if (pt && payload.resetOverride === true) {
      for (const old of existingScoped) {
        await platformPersistenceService.remove(CategoryFilterConfigModel, old.id, 'id', { throwOnError: true });
        draft.categoryFilterConfigs = draft.categoryFilterConfigs.filter((f) => f.id !== old.id);
        this.categoryFilterConfigs = this.categoryFilterConfigs.filter((f) => f.id !== old.id);
      }
      draft.draftVersion += 1;
      draft.publishedVersion += 1;
      draft.lastDraftSavedAt = now;
      draft.lastPublishedAt = now;
      await this.persistDraftSnapshot(draft);
      this.invalidateFilterCache(cleanTenant, {
        childCategoryId: scopeId,
        mainCategoryId: child?.mainCategoryId,
      });
      return [];
    }

    const incomingList = Array.isArray(payload.filters) ? payload.filters : [];
    const incomingKeys = new Set(incomingList.map((f) => this.deriveFieldKey(f.fieldKey || f.filterName).toLowerCase()));

    // Remove deselected filters for this exact scope
    for (const old of existingScoped) {
      if (!incomingKeys.has(old.fieldKey.toLowerCase())) {
        await platformPersistenceService.remove(CategoryFilterConfigModel, old.id, 'id', { throwOnError: true });
        draft.categoryFilterConfigs = draft.categoryFilterConfigs.filter((f) => f.id !== old.id);
        this.categoryFilterConfigs = this.categoryFilterConfigs.filter((f) => f.id !== old.id);
        draft.deletedFilterConfigIds = draft.deletedFilterConfigIds || [];
        if (!draft.deletedFilterConfigIds.includes(old.id)) draft.deletedFilterConfigIds.push(old.id);
        this.recordDeletedFilterTombstone(cleanTenant, scopeId, old.id);
      }
    }

    const savedRecords: CategoryFilterConfiguration[] = [];
    for (let i = 0; i < incomingList.length; i++) {
      const item = incomingList[i];
      const fieldKey = this.deriveFieldKey(item.fieldKey || item.filterName);
      if (!fieldKey) continue;
      const tmpl = STANDARD_CHECKLIST_FILTERS.find((t) => t.fieldKey === fieldKey);
      const isCoreField = ['category', 'subcategory', 'brand', 'price'].includes(fieldKey);
      const prev = existingScoped.find((f) => f.fieldKey.toLowerCase() === fieldKey.toLowerCase());

      const rawOpts = Array.isArray(item.options)
        ? item.options.map((o) => normalizeFilterOptionLabel(String(o))).filter(Boolean)
        : prev?.options || [];
      const dedupOpts = Array.from(new Map(rawOpts.map((o) => [o.toLowerCase(), o])).values());

      const record: CategoryFilterConfiguration = {
        id:
          prev?.id ||
          item.id ||
          (cleanTenant !== DEFAULT_TENANT
            ? `${cleanTenant}::cfc-${scopeId}${pt ? `-${pt.id}` : ''}-${fieldKey}`
            : `cfc-${scopeId}${pt ? `-${pt.id}` : ''}-${fieldKey}`),
        tenantId: cleanTenant,
        mainCategoryId: matchedCollection?.mainCategoryId || child?.mainCategoryId || 'mc-new-launches',
        mainCategoryName: matchedCollection?.mainCategoryName || parentMain?.name || 'New Launches',
        childCategoryId: scopeId,
        childCategorySlug: matchedCollection?.slug || child!.slug,
        childCategoryName: matchedCollection?.title || child!.name,
        newLaunchCollectionId: matchedCollection?.id,
        newLaunchCollectionSlug: matchedCollection?.slug,
        newLaunchCollectionTitle: matchedCollection?.title,
        productTypeId: pt?.id || undefined,
        productTypeSlug: pt?.slug || undefined,
        filterName: String(item.filterName || tmpl?.filterName || fieldKey).trim(),
        fieldKey,
        fieldType:
          fieldKey === 'price'
            ? 'RANGE'
            : (item.fieldType as FilterFieldType) || prev?.fieldType || tmpl?.fieldType || 'MULTISELECT',
        options: dedupOpts,
        specKeys:
          item.specKeys && item.specKeys.length > 0
            ? item.specKeys
            : prev?.specKeys || tmpl?.specKeys || [String(item.filterName || fieldKey)],
        catAttrKeys:
          item.catAttrKeys && item.catAttrKeys.length > 0
            ? item.catAttrKeys
            : prev?.catAttrKeys || tmpl?.catAttrKeys || [fieldKey],
        isStandardField: item.isStandardField || prev?.isStandardField || tmpl?.isStandardField,
        selectionMode:
          fieldKey === 'price'
            ? 'SINGLE'
            : item.selectionMode === 'SINGLE'
            ? 'SINGLE'
            : 'MULTI',
        isRequired: Boolean(item.isRequired ?? prev?.isRequired ?? false),
        showInVendor: isCoreField ? false : item.showInVendor !== undefined ? Boolean(item.showInVendor) : true,
        showInCustomer: item.showInCustomer !== undefined ? Boolean(item.showInCustomer) : true,
        hideEmptyOptions: true,
        allowCustomOption: item.allowCustomOption !== undefined ? Boolean(item.allowCustomOption) : prev?.allowCustomOption !== false,
        sortOrder: Number(item.sortOrder ?? i + 1),
        isActive: item.isActive !== undefined ? Boolean(item.isActive) : true,
        publishedStatus: 'PUBLISHED',
        createdAt: prev?.createdAt || now,
        updatedAt: now,
      };

      this.upsertArrayById(draft.categoryFilterConfigs, record);
      this.upsertArrayById(this.categoryFilterConfigs, record);
      await platformPersistenceService.upsert(CategoryFilterConfigModel, record, 'id', { throwOnError: true });
      this.upsertArrayById(draft.categoryFilterConfigs, record);
      this.upsertArrayById(this.categoryFilterConfigs, record);
      savedRecords.push(this.cloneRecord(record));
    }

    draft.draftVersion += 1;
    draft.publishedVersion += 1;
    draft.lastDraftSavedAt = now;
    draft.lastPublishedAt = now;
    draft.hasUnpublishedChanges = false;
    await this.persistDraftSnapshot(draft);
    this.invalidateFilterCache(cleanTenant, {
      childCategoryId: scopeId,
      mainCategoryId: matchedCollection?.mainCategoryId || child?.mainCategoryId,
      newLaunchCollectionId: matchedCollection?.id,
    });

    return savedRecords.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async deleteCategoryFilterConfig(
    tenantId: string,
    id: string,
    options: { saveAsDraft?: boolean } = {}
  ): Promise<{ id: string; deleted: boolean }> {
    const cleanTenant = this.resolveNavTenantId(tenantId);
    const draft = this.getDraftState(cleanTenant);
    draft.categoryFilterConfigs = draft.categoryFilterConfigs || this.cloneRecord(this.categoryFilterConfigs);
    draft.deletedFilterConfigIds = draft.deletedFilterConfigIds || [];
    const idx = draft.categoryFilterConfigs.findIndex(
      (f) => f.id === id || (cleanTenant !== DEFAULT_TENANT && f.id === `${cleanTenant}::${id}`)
    );
    if (idx < 0) throw new BadRequestException(`Filter configuration ${id} not found.`);

    const target = draft.categoryFilterConfigs[idx];
    const now = new Date().toISOString();

    if (options.saveAsDraft) {
      draft.categoryFilterConfigs.splice(idx, 1);
      if (!draft.deletedFilterConfigIds.includes(target.id)) draft.deletedFilterConfigIds.push(target.id);
      draft.draftVersion += 1;
      draft.lastDraftSavedAt = now;
      draft.hasUnpublishedChanges = true;
      await this.persistDraftSnapshot(draft);
      return { id: target.id, deleted: true };
    }

    await platformPersistenceService.remove(CategoryFilterConfigModel, target.id, 'id', { throwOnError: true });
    draft.categoryFilterConfigs.splice(idx, 1);
    if (!draft.deletedFilterConfigIds.includes(target.id)) draft.deletedFilterConfigIds.push(target.id);
    this.recordDeletedFilterTombstone(cleanTenant, target.newLaunchCollectionId || target.childCategoryId, target.id);
    this.categoryFilterConfigs = this.categoryFilterConfigs.filter((f) => f.id !== target.id);
    draft.draftVersion += 1;
    draft.publishedVersion += 1;
    draft.lastDraftSavedAt = now;
    draft.lastPublishedAt = now;
    await this.persistDraftSnapshot(draft);
    this.invalidateFilterCache(cleanTenant, {
      childCategoryId: target.childCategoryId,
      mainCategoryId: target.mainCategoryId,
      newLaunchCollectionId: target.newLaunchCollectionId,
    });
    return { id: target.id, deleted: true };
  }

  /**
   * Resolves Vendor dynamic fields strictly from Admin-published CategoryFilterConfiguration
   * combined with live catalog-backed option values (preventing obsolete static defaults from leaking).
   */
  getVendorCombinedCategoryFields(
    tenantId = DEFAULT_TENANT,
    childCategoryIdOrSlug?: string,
    productTypeId?: string,
    newLaunchCollectionId?: string
  ): CategoryFieldSchema[] {
    const cleanTenant = this.resolveNavTenantId(tenantId);
    const matchedCollection = newLaunchCollectionId
      ? this.resolveNewLaunchCollectionScope(cleanTenant, newLaunchCollectionId, false, true)
      : undefined;
    if (newLaunchCollectionId && !matchedCollection) {
      return [];
    }

    const rawConfigs = this.getCategoryFilterConfigs(cleanTenant, {
      childCategoryId: matchedCollection ? undefined : childCategoryIdOrSlug,
      newLaunchCollectionId: matchedCollection?.id,
      productTypeId: matchedCollection ? undefined : productTypeId,
      useDraft: false,
      includeInactive: true,
    });
    const allConfigsForCat = childCategoryIdOrSlug || matchedCollection
      ? rawConfigs
      : rawConfigs.filter((fc) => !fc.productTypeId && !fc.newLaunchCollectionId);

    const activeVendorConfigs = allConfigsForCat.filter(
      (fc) =>
        fc.isActive !== false &&
        fc.showInVendor !== false &&
        !['category', 'subcategory', 'brand', 'price', 'rating'].includes(fc.fieldKey)
    );

    const mapFilterType = (ft: FilterFieldType, mode: FilterSelectionMode): CategoryFieldType => {
      if (ft === 'NUMBER' || ft === 'RANGE') return 'number';
      if (ft === 'BOOLEAN') return 'checkbox';
      if (ft === 'DROPDOWN' && mode === 'SINGLE') return 'dropdown';
      if (ft === 'TEXT') return 'text';
      return 'multiselect';
    };

    const byKey = new Map<string, CategoryFieldSchema>();

    if (allConfigsForCat.length > 0) {
      const catalogOptsByCat = new Map<string, Record<string, string[]>>();
      const getOpts = (catId: string, fKey: string) => {
        if (!catalogOptsByCat.has(catId)) {
          catalogOptsByCat.set(
            catId,
            this.getRealCatalogOptionsMap(cleanTenant, catId, matchedCollection ? undefined : productTypeId, matchedCollection?.id)
          );
        }
        return catalogOptsByCat.get(catId)?.[fKey] || [];
      };

      for (const fc of activeVendorConfigs) {
        const mergedOptions = Array.from(
          new Map(
            [...getOpts(fc.childCategoryId, fc.fieldKey), ...(fc.options || [])]
              .map((o) => normalizeFilterOptionLabel(o))
              .filter(Boolean)
              .map((o) => [o.toLowerCase(), o])
          ).values()
        );
        const key = `${fc.childCategoryId}::${fc.fieldKey.toLowerCase()}`;
        byKey.set(key, {
          id: fc.id,
          tenantId: fc.tenantId,
          childCategoryId: fc.childCategoryId,
          childCategorySlug: fc.childCategorySlug || '',
          newLaunchCollectionId: fc.newLaunchCollectionId,
          productTypeId: fc.productTypeId,
          fieldKey: fc.fieldKey,
          label: fc.filterName,
          fieldType: mapFilterType(fc.fieldType, fc.selectionMode),
          options: mergedOptions,
          required: Boolean(fc.isRequired),
          selectionMode: fc.selectionMode,
          allowCustomOption: fc.allowCustomOption !== false,
          showInVendor: true,
          showInCustomer: fc.showInCustomer,
          group: matchedCollection ? `${matchedCollection.title} Attributes` : 'Category Filter Attributes',
          displayOrder: fc.sortOrder,
          isActive: fc.isActive,
          createdAt: fc.createdAt,
          updatedAt: fc.updatedAt,
        });
      }

      if (!matchedCollection) {
        // Include any manual Admin custom CategoryFieldSchemas (non-seed) whose key is not inactive
        const inactiveKeys = new Set(
          allConfigsForCat.filter((f) => f.isActive === false || f.showInVendor === false).map((f) => f.fieldKey.toLowerCase())
        );
        const customSchemas = this.getTenantFieldSchemas(cleanTenant, childCategoryIdOrSlug, false).filter(
          (bs) => !bs.id.startsWith('cfs-') && !inactiveKeys.has(bs.fieldKey.toLowerCase())
        );
        for (const cs of customSchemas) {
          const key = `${cs.childCategoryId}::${cs.fieldKey.toLowerCase()}`;
          if (!byKey.has(key)) byKey.set(key, { ...cs });
        }
      }
    } else if (!matchedCollection) {
      const pool = this.getTenantPool(cleanTenant);
      const needleLow = (childCategoryIdOrSlug || '').trim().toLowerCase();
      const resolvedChild = needleLow
        ? pool.childCategories.find((c) => c.id.toLowerCase() === needleLow || c.slug.toLowerCase() === needleLow)
        : undefined;
      const scopeId = resolvedChild?.id || childCategoryIdOrSlug;
      const isSeedManaged =
        scopeId ? CATEGORY_FILTER_CONFIGS_SEED.some((s) => s.childCategoryId === scopeId) : false;
      const hasTombstones = scopeId ? this.hasDeletedFilterTombstones(cleanTenant, scopeId) : false;
      if (!isSeedManaged && !hasTombstones) {
        const baseSchemas = this.getTenantFieldSchemas(cleanTenant, childCategoryIdOrSlug, false);
        for (const bs of baseSchemas) {
          byKey.set(`${bs.childCategoryId}::${bs.fieldKey.toLowerCase()}`, { ...bs });
        }
      }
    }

    return Array.from(byKey.values()).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  /**
   * Computes dynamic Customer PLP filters strictly from Admin-published CategoryFilterConfiguration
   * paired with live approved/published product counts (supporting Main Categories, Child Categories,
   * Product Type overrides, and New Launches Collections).
   */
  getCustomerAvailableFilters(
    tenantId = DEFAULT_TENANT,
    categorySlugOrId: string,
    matchingProducts: any[],
    childCategories: any[] = [],
    mainChildCategories: any[] = [],
    productTypeId?: string,
    newLaunchCollectionId?: string,
    activeFilters?: any
  ) {
    const cleanTenant = this.resolveNavTenantId(tenantId);
    const matchedCollection = this.resolveNewLaunchCollectionScope(
      cleanTenant,
      newLaunchCollectionId || categorySlugOrId,
      false,
      true
    );

    if (matchedCollection) {
      const allColConfigs = this.getCategoryFilterConfigs(cleanTenant, {
        newLaunchCollectionId: matchedCollection.id,
        useDraft: false,
        includeInactive: true,
      });
      const configs = allColConfigs.filter((c) => c.isActive !== false && c.showInCustomer !== false);
      const dimensions = filterConfigsToDimensions(configs);
      const computedFilters = getAvailableFiltersForCategory(
        matchedCollection.slug,
        matchingProducts,
        [],
        [],
        dimensions,
        activeFilters,
        true
      );
      return {
        filterConfigs: configs,
        availableFilters: computedFilters,
        hasFilterConfiguration: true,
      };
    }

    const rawNeedle = (categorySlugOrId || '').trim().toLowerCase();
    const canonicalSlug = LEGACY_CATEGORY_SLUG_ALIASES[rawNeedle] || rawNeedle;
    const pool = this.getTenantPool(cleanTenant);
    const matchedChild = pool.childCategories.find(
      (c) => c.id.toLowerCase() === rawNeedle || c.slug.toLowerCase() === canonicalSlug
    );
    if (matchedChild) {
      const allCatConfigs = this.getCategoryFilterConfigs(cleanTenant, {
        childCategoryId: matchedChild.id,
        productTypeId,
        useDraft: false,
        includeInactive: true,
      });
      const hasManagedConfig =
        allCatConfigs.length > 0 ||
        this.hasDeletedFilterTombstones(cleanTenant, matchedChild.id) ||
        CATEGORY_FILTER_CONFIGS_SEED.some((s) => s.childCategoryId === matchedChild.id);
      const configs = allCatConfigs.filter((c) => c.isActive !== false && c.showInCustomer !== false);
      const dimensions = filterConfigsToDimensions(configs);
      const computedFilters = getAvailableFiltersForCategory(
        matchedChild.slug,
        matchingProducts,
        childCategories,
        mainChildCategories,
        dimensions,
        activeFilters,
        hasManagedConfig
      );
      return {
        filterConfigs: configs,
        availableFilters: computedFilters,
        hasFilterConfiguration: hasManagedConfig,
      };
    }

    const matchedMain = pool.mainCategories.find(
      (m) => m.id.toLowerCase() === rawNeedle || m.slug.toLowerCase() === canonicalSlug
    );
    if (matchedMain) {
      const activeChildren = pool.childCategories.filter(
        (c) => c.mainCategoryId === matchedMain.id && c.isActive !== false
      );
      const activeChildIds = new Set(activeChildren.map((c) => c.id));
      const allMainConfigs = this.getCategoryFilterConfigs(cleanTenant, {
        useDraft: false,
        includeInactive: false,
        showInCustomer: true,
      }).filter((fc) => !fc.newLaunchCollectionId && !fc.productTypeId && activeChildIds.has(fc.childCategoryId));

      const mergedByKey = new Map<string, CategoryFilterConfiguration>();
      for (const fc of allMainConfigs) {
        const key = fc.fieldKey.toLowerCase();
        const existing = mergedByKey.get(key);
        if (!existing) {
          mergedByKey.set(key, {
            ...this.cloneRecord(fc),
            specKeys: [...(fc.specKeys || [fc.filterName])],
            catAttrKeys: [...(fc.catAttrKeys || [fc.fieldKey])],
            options: [...(fc.options || [])],
          });
        } else {
          existing.specKeys = Array.from(new Set([...(existing.specKeys || []), ...(fc.specKeys || [fc.filterName])]));
          existing.catAttrKeys = Array.from(new Set([...(existing.catAttrKeys || []), ...(fc.catAttrKeys || [fc.fieldKey])]));
          existing.options = Array.from(new Set([...(existing.options || []), ...(fc.options || [])]));
          if ((fc.sortOrder || 999) < (existing.sortOrder || 999)) {
            existing.sortOrder = fc.sortOrder;
          }
        }
      }

      const configs = Array.from(mergedByKey.values()).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      const hasManagedMain =
        configs.length > 0 ||
        activeChildren.some(
          (c) =>
            this.hasDeletedFilterTombstones(cleanTenant, c.id) ||
            CATEGORY_FILTER_CONFIGS_SEED.some((s) => s.childCategoryId === c.id)
        );
      const dimensions = filterConfigsToDimensions(configs);
      const computedFilters = getAvailableFiltersForCategory(
        matchedMain.slug,
        matchingProducts,
        childCategories,
        mainChildCategories.length > 0 ? mainChildCategories : activeChildren,
        dimensions,
        activeFilters,
        hasManagedMain
      );
      return {
        filterConfigs: configs,
        availableFilters: computedFilters,
        hasFilterConfiguration: hasManagedMain,
      };
    }

    const computedFilters = getAvailableFiltersForCategory(
      canonicalSlug,
      matchingProducts,
      childCategories,
      mainChildCategories,
      undefined,
      activeFilters,
      false
    );
    return {
      filterConfigs: [],
      availableFilters: computedFilters,
      hasFilterConfiguration: false,
    };
  }
}

export const taxonomyService = new TaxonomyService();
