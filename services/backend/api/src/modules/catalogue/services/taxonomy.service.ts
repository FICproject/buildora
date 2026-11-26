import { BadRequestException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  MAIN_CATEGORIES_SEED,
  CHILD_CATEGORIES_SEED,
  PRODUCT_TYPES_SEED,
  CATEGORY_FIELD_SCHEMAS_SEED,
  MASTER_BRANDS,
  resolveFullTaxonomy,
} from '@buildora/constants';
import {
  MainCategory,
  ChildCategory,
  ProductTypeNode,
  NewLaunchCollection,
  CategoryFieldSchema,
  CategoryFieldType,
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
  deletedMainIds: string[];
  deletedChildIds: string[];
  deletedProductTypeIds: string[];
  deletedNavIds: string[];
  hasUnpublishedChanges: boolean;
  publishedVersion: number;
  draftVersion: number;
  lastPublishedAt?: string;
  lastPublishedBy?: string;
  lastDraftSavedAt?: string;
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

@Injectable()
export class TaxonomyService implements OnModuleInit {
  private readonly logger = new Logger(TaxonomyService.name);
  private initialized = false;

  public mainCategories: MainCategory[] = [];
  public childCategories: ChildCategory[] = [];
  public productTypes: ProductTypeNode[] = [];
  public desktopNavigation: DesktopNavItem[] = [];
  public categoryFieldSchemas: CategoryFieldSchema[] = [];
  public newLaunchCollections: NewLaunchCollection[] = [];
  public migrationRecords: TaxonomyMigrationRecord[] = [];
  private drafts = new Map<string, TenantCatalogDraft>();
  private publishMeta = new Map<string, CatalogPublishMetadata>();

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
    if (this.newLaunchCollections.length === 0) {
      const now = new Date().toISOString();
      const seedLaunchIds = dbStore.products
        .filter((p) => p.isNewLaunch)
        .map((p) => p.id);
      this.newLaunchCollections = [
        {
          id: 'nl-col-default',
          tenantId,
          title: 'BUILDORA 60 New Launches',
          slug: 'featured-new-launches',
          description:
            'Admin-curated showcase of newly onboarded certified building materials.',
          badge: 'NEW ARRIVAL',
          productIds: seedLaunchIds,
          displayOrder: 1,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
      ];
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
    if (this.desktopNavigation.length === 0) {
      this.desktopNavigation = this.buildDefaultDesktopNav(tenantId);
    }
    this.migrateLegacyCatalogRecords();
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
    const [dbMains, dbChildren, dbTypes, dbCollections, dbFields, dbNavs, dbSnapshots] = await Promise.all([
      platformPersistenceService.loadAll<MainCategory>(MainCategoryModel),
      platformPersistenceService.loadAll<ChildCategory>(ChildCategoryModel),
      platformPersistenceService.loadAll<ProductTypeNode>(ProductTypeModel),
      platformPersistenceService.loadAll<NewLaunchCollection>(NewLaunchCollectionModel),
      platformPersistenceService.loadAll<CategoryFieldSchema>(CategoryFieldSchemaModel),
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

    if (dbNavs.length > 0) this.desktopNavigation = dbNavs;
    else {
      for (const nav of this.desktopNavigation) {
        await platformPersistenceService.upsert(DesktopNavItemModel, nav);
      }
    }

    if (dbSnapshots.length > 0) {
      for (const snap of dbSnapshots) {
        if (snap?.tenantId) {
          this.drafts.set(snap.tenantId, snap);
          this.publishMeta.set(snap.tenantId, {
            tenantId: snap.tenantId,
            hasUnpublishedChanges: Boolean(snap.hasUnpublishedChanges),
            publishedVersion: Number(snap.publishedVersion || 1),
            draftVersion: Number(snap.draftVersion || 1),
            lastPublishedAt: snap.lastPublishedAt,
            lastPublishedBy: snap.lastPublishedBy,
            lastDraftSavedAt: snap.lastDraftSavedAt,
          });
        }
      }
    }

    this.initialized = true;
    this.migrateLegacyCatalogRecords();
    this.syncDbStoreCategories();
    this.logger.log(
      `Taxonomy ready: ${this.mainCategories.length} Main, ${this.childCategories.length} Child, ${this.productTypes.length} Product Types, ${this.desktopNavigation.length} Desktop Nav items.`
    );
  }

  public getTenantPool(tenantId = DEFAULT_TENANT) {
    const cleanTenant = tenantId || DEFAULT_TENANT;
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

  public getPublishedDesktopNavigation(tenantId = DEFAULT_TENANT, includeHidden = false): DesktopNavItem[] {
    const cleanTenant = tenantId || DEFAULT_TENANT;
    const pool = this.getTenantPool(cleanTenant);
    const tenantSpecific = this.desktopNavigation.filter((n) => n.tenantId === cleanTenant);
    const baseItems =
      tenantSpecific.length > 0
        ? tenantSpecific
        : this.desktopNavigation.filter((n) => !n.tenantId || n.tenantId === GLOBAL_TENANT);

    const hydrated = baseItems.map((nav) => {
      if (nav.itemType === 'MAIN_CATEGORY' && nav.mainCategoryId) {
        const linkedMain = pool.mainCategories.find((m) => m.id === nav.mainCategoryId);
        if (linkedMain) {
          return {
            ...nav,
            mainCategorySlug: linkedMain.slug,
            route: `/categories/${linkedMain.slug}`,
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
    const existing = this.drafts.get(cleanTenant);
    if (existing) return existing;

    const pool = this.getTenantPool(cleanTenant);
    const navs = this.getPublishedDesktopNavigation(cleanTenant, true);
    const meta = this.getPublishMetadata(cleanTenant);
    const draft: TenantCatalogDraft = {
      tenantId: cleanTenant,
      mainCategories: this.cloneRecord(pool.mainCategories),
      childCategories: this.cloneRecord(pool.childCategories),
      productTypes: this.cloneRecord(pool.productTypes),
      desktopNavigation: this.cloneRecord(navs),
      deletedMainIds: [],
      deletedChildIds: [],
      deletedProductTypeIds: [],
      deletedNavIds: [],
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
    // Default tenant can edit global nav rows directly; non-default tenants clone into tenant-scoped rows
    const hasOwn = this.desktopNavigation.some((n) => n.tenantId === cleanTenant);
    if (!hasOwn && cleanTenant !== DEFAULT_TENANT) {
      const globals = this.desktopNavigation.filter((n) => !n.tenantId || n.tenantId === GLOBAL_TENANT);
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
    let route = String(payload.route || '').trim();

    if (itemType === 'MAIN_CATEGORY') {
      if (!mainCategoryId) throw new BadRequestException('Assign a Main Category for this navigation item.');
      const linkedMain = draft.mainCategories.find((m) => m.id === mainCategoryId || m.slug === mainCategoryId);
      if (!linkedMain) throw new BadRequestException(`Main Category "${mainCategoryId}" not found.`);
      mainCategoryId = linkedMain.id;
      mainCategorySlug = linkedMain.slug;
      route = `/categories/${linkedMain.slug}`;
    } else if (itemType === 'HOME') {
      route = '/';
    } else if (itemType === 'NEW_LAUNCHES') {
      route = '/new-launches';
    } else if (itemType === 'DEALS') {
      route = '/deals';
    } else {
      if (!route || !route.startsWith('/')) {
        throw new BadRequestException('Custom navigation route must start with "/".');
      }
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
      route,
      icon: payload.icon?.trim() || (itemType === 'HOME' ? 'Home' : itemType === 'DEALS' ? 'Sparkles' : itemType === 'NEW_LAUNCHES' ? 'Rocket' : MAIN_CATEGORY_NAV_ICONS[mainCategorySlug || ''] || 'Layers'),
      hasDropdown: payload.hasDropdown !== undefined ? Boolean(payload.hasDropdown) : itemType === 'MAIN_CATEGORY' || itemType === 'NEW_LAUNCHES',
      highlight: payload.highlight !== undefined ? Boolean(payload.highlight) : itemType === 'DEALS',
      displayOrder: Number(payload.displayOrder ?? draft.desktopNavigation.length + 1),
      isVisible: payload.isVisible !== false,
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
    if (updates.itemType !== undefined) existing.itemType = updates.itemType;
    if (updates.mainCategoryId !== undefined) {
      if (updates.mainCategoryId) {
        const mc = draft.mainCategories.find(
          (m) => m.id === updates.mainCategoryId || m.slug === updates.mainCategoryId
        );
        if (!mc) throw new BadRequestException(`Main Category "${updates.mainCategoryId}" not found.`);
        existing.mainCategoryId = mc.id;
        existing.mainCategorySlug = mc.slug;
        if (existing.itemType === 'MAIN_CATEGORY') {
          existing.route = `/categories/${mc.slug}`;
        }
      } else {
        existing.mainCategoryId = undefined;
        existing.mainCategorySlug = undefined;
      }
    }
    if (updates.route !== undefined && existing.itemType !== 'MAIN_CATEGORY') {
      const nextRoute = String(updates.route).trim();
      if (!nextRoute.startsWith('/')) throw new BadRequestException('Navigation route must start with "/".');
      existing.route = nextRoute;
    }
    if (updates.icon !== undefined) existing.icon = updates.icon.trim();
    if (updates.hasDropdown !== undefined) existing.hasDropdown = Boolean(updates.hasDropdown);
    if (updates.highlight !== undefined) existing.highlight = Boolean(updates.highlight);
    if (updates.displayOrder !== undefined) existing.displayOrder = Number(updates.displayOrder);
    if (updates.isVisible !== undefined) existing.isVisible = Boolean(updates.isVisible);
    if (updates.isActive !== undefined) existing.isActive = Boolean(updates.isActive);

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
      const slugKey = c.slug.toLowerCase();
      const nameKey = c.name.trim().toLowerCase();
      if (childSlugs.has(slugKey)) throw new BadRequestException(`Duplicate Child Category slug "${c.slug}".`);
      if (childNames.has(nameKey)) throw new BadRequestException(`Duplicate Child Category name "${c.name}".`);
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
      const idx = this.mainCategories.findIndex((m) => m.id === delMainId);
      if (idx >= 0) {
        this.mainCategories.splice(idx, 1);
        await platformPersistenceService.remove(MainCategoryModel, delMainId);
      }
    }
    for (const delChildId of draft.deletedChildIds) {
      const idx = this.childCategories.findIndex((c) => c.id === delChildId);
      if (idx >= 0) {
        this.childCategories.splice(idx, 1);
        await platformPersistenceService.remove(ChildCategoryModel, delChildId);
      }
    }
    for (const delPtId of draft.deletedProductTypeIds) {
      const idx = this.productTypes.findIndex((pt) => pt.id === delPtId);
      if (idx >= 0) {
        this.productTypes.splice(idx, 1);
        await platformPersistenceService.remove(ProductTypeModel, delPtId);
      }
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

    // 3. Promote Upserts cleanly into Live Pools
    for (const mc of draft.mainCategories) {
      this.upsertArrayById(this.mainCategories, mc);
      await platformPersistenceService.upsert(MainCategoryModel, mc);
    }
    for (const cc of draft.childCategories) {
      this.upsertArrayById(this.childCategories, cc);
      await platformPersistenceService.upsert(ChildCategoryModel, cc);
    }
    for (const pt of draft.productTypes) {
      this.upsertArrayById(this.productTypes, pt);
      await platformPersistenceService.upsert(ProductTypeModel, pt);
    }
    this.ensureTenantScopedNavItemsPublished(cleanTenant);
    for (const nav of draft.desktopNavigation) {
      const pubId = cleanTenant !== DEFAULT_TENANT && nav.id.startsWith('nav-') && !nav.id.includes('::')
        ? `${cleanTenant}::${nav.id}`
        : nav.id;
      const pubNav: DesktopNavItem = {
        ...this.cloneRecord(nav),
        id: pubId,
        tenantId: cleanTenant === DEFAULT_TENANT ? (nav.tenantId || GLOBAL_TENANT) : cleanTenant,
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

    this.upsertArrayById(this.mainCategories, record);
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
        nav.route = `/categories/${existing.slug}`;
        if (nav.label === oldName) nav.label = existing.name;
        if (updates.showInNavigation !== undefined) nav.isVisible = Boolean(updates.showInNavigation);
        if (updates.isActive !== undefined) nav.isActive = Boolean(updates.isActive);
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

    this.upsertArrayById(this.mainCategories, existing);
    await platformPersistenceService.upsert(MainCategoryModel, existing);
    for (const cc of draft.childCategories) {
      if (cc.mainCategoryId === existing.id) {
        this.upsertArrayById(this.childCategories, cc);
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

    this.mainCategories = this.mainCategories.filter((m) => m.id !== target.id);
    await platformPersistenceService.remove(MainCategoryModel, target.id);
    for (const nav of navIndices) {
      this.desktopNavigation = this.desktopNavigation.filter((n) => n.id !== nav.id);
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
        (c) => c.slug.toLowerCase() === slug || c.name.trim().toLowerCase() === name.toLowerCase()
      )
    ) {
      throw new BadRequestException(`Child category "${name}" (${slug}) already exists.`);
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

    this.upsertArrayById(this.childCategories, record);
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
            this.upsertArrayById(this.productTypes, pt);
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
      if (draft.childCategories.some((c) => c.id !== existing.id && c.name.trim().toLowerCase() === nextName.toLowerCase())) {
        throw new BadRequestException(`Child category "${nextName}" already exists.`);
      }
      existing.name = nextName;
    }
    if (updates.slug !== undefined) {
      const nextSlug = this.toSlug(updates.slug);
      if (!nextSlug) throw new BadRequestException('Child category slug cannot be empty.');
      if (draft.childCategories.some((c) => c.id !== existing.id && c.slug.toLowerCase() === nextSlug.toLowerCase())) {
        throw new BadRequestException(`Child category slug "${nextSlug}" already exists.`);
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

    this.upsertArrayById(this.childCategories, existing);
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

    this.childCategories = this.childCategories.filter((c) => c.id !== target.id);
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

    this.upsertArrayById(this.productTypes, record);
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
    updates: Partial<ProductTypeNode> & { saveAsDraft?: boolean }
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

    this.upsertArrayById(this.productTypes, existing);
    await platformPersistenceService.upsert(ProductTypeModel, existing);
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

    this.productTypes = this.productTypes.filter((pt) => pt.id !== target.id);
    await platformPersistenceService.remove(ProductTypeModel, target.id);
    this.syncDbStoreCategories(cleanTenant);
    draft.publishedVersion += 1;
    draft.lastPublishedAt = now;
    await this.persistDraftSnapshot(draft);
    return { id: target.id, deleted: true, reassignedProductsCount };
  }

  // ==================== NEW LAUNCHES PROMOTIONAL COLLECTIONS ====================

  getNewLaunchCollections(tenantId: string, onlyActiveAndInWindow = false): NewLaunchCollection[] {
    const now = Date.now();
    const cleanTenant = tenantId || DEFAULT_TENANT;
    return this.newLaunchCollections
      .filter((col) => !col.tenantId || col.tenantId === GLOBAL_TENANT || col.tenantId === cleanTenant)
      .filter((col) => {
        if (!onlyActiveAndInWindow) return true;
        if (!col.isActive) return false;
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
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async createNewLaunchCollection(
    tenantId: string,
    payload: Partial<NewLaunchCollection> & { name?: string; isVisible?: boolean }
  ): Promise<NewLaunchCollection> {
    const resolvedTitle = (payload.title || payload.name || '').trim();
    if (!resolvedTitle) throw new BadRequestException('Collection title is required.');
    const now = new Date().toISOString();
    const record: NewLaunchCollection = {
      id: `nl-col-${Date.now()}`,
      tenantId,
      title: resolvedTitle,
      slug: (payload.slug?.trim() || resolvedTitle)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, ''),
      description: payload.description || '',
      bannerImage: payload.bannerImage || '',
      badge: payload.badge || 'NEW LAUNCH',
      productIds: Array.isArray(payload.productIds) ? payload.productIds : [],
      displayOrder: Number(payload.displayOrder ?? this.newLaunchCollections.length + 1),
      startDate: payload.startDate || undefined,
      endDate: payload.endDate || undefined,
      isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : payload.isVisible !== false,
      createdAt: now,
      updatedAt: now,
    };
    this.newLaunchCollections.push(record);
    await platformPersistenceService.upsert(NewLaunchCollectionModel, record);
    return record;
  }

  async updateNewLaunchCollection(
    tenantId: string,
    id: string,
    updates: Partial<NewLaunchCollection> & { name?: string; isVisible?: boolean }
  ): Promise<NewLaunchCollection> {
    const existing = this.newLaunchCollections.find(
      (c) => c.id === id && (!c.tenantId || c.tenantId === GLOBAL_TENANT || c.tenantId === tenantId)
    );
    if (!existing) throw new BadRequestException(`New Launch collection ${id} not found.`);
    const nextTitle = updates.title !== undefined ? updates.title : updates.name;
    if (nextTitle !== undefined) existing.title = nextTitle.trim();
    if (updates.description !== undefined) existing.description = updates.description;
    if (updates.bannerImage !== undefined) existing.bannerImage = updates.bannerImage;
    if (updates.badge !== undefined) existing.badge = updates.badge;
    if (updates.productIds !== undefined && Array.isArray(updates.productIds)) {
      existing.productIds = updates.productIds;
    }
    if (updates.displayOrder !== undefined) existing.displayOrder = Number(updates.displayOrder);
    if (updates.startDate !== undefined) existing.startDate = updates.startDate || undefined;
    if (updates.endDate !== undefined) existing.endDate = updates.endDate || undefined;
    const nextActive = updates.isActive !== undefined ? updates.isActive : updates.isVisible;
    if (nextActive !== undefined) existing.isActive = Boolean(nextActive);
    existing.updatedAt = new Date().toISOString();
    await platformPersistenceService.upsert(NewLaunchCollectionModel, existing);
    return existing;
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
  public validateAndNormalizeCategoryAttributes(
    tenantId: string,
    childCategoryIdOrSlug: string,
    rawAttributes: Record<string, any> | undefined,
    options: { strictRequired?: boolean } = {}
  ): {
    validatedAttributes: Record<string, any>;
    specificationEntries: Record<string, string>;
    fieldErrors: Record<string, string>;
  } {
    const schemas = this.getTenantFieldSchemas(tenantId, childCategoryIdOrSlug, false);
    const input = rawAttributes && typeof rawAttributes === 'object' ? rawAttributes : {};
    const validatedAttributes: Record<string, any> = {};
    const specificationEntries: Record<string, string> = {};
    const fieldErrors: Record<string, string> = {};

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
          ? rawVal.map((v) => String(v).trim()).filter(Boolean)
          : String(rawVal).split(',').map((v) => v.trim()).filter(Boolean);
        if (options.strictRequired && schema.required && list.length === 0) {
          fieldErrors[schema.fieldKey] = `Select at least one option for ${schema.label}.`;
          continue;
        }
        validatedAttributes[schema.fieldKey] = list;
        specificationEntries[schema.label] = list.join(', ');
      } else if (schema.fieldType === 'dropdown') {
        const str = String(rawVal).trim();
        if (schema.options && schema.options.length > 0 && !schema.options.includes(str)) {
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

    if (Object.keys(fieldErrors).length > 0) {
      const firstErr = Object.values(fieldErrors)[0];
      throw new BadRequestException({
        message: firstErr,
        fieldErrors,
      });
    }

    return { validatedAttributes, specificationEntries, fieldErrors };
  }
}

export const taxonomyService = new TaxonomyService();
