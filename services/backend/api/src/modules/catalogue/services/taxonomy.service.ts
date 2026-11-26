import { BadRequestException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  MAIN_CATEGORIES_SEED,
  CHILD_CATEGORIES_SEED,
  PRODUCT_TYPES_SEED,
  MASTER_BRANDS,
  resolveFullTaxonomy,
} from '@buildora/constants';
import {
  MainCategory,
  ChildCategory,
  ProductTypeNode,
  NewLaunchCollection,
} from '@buildora/types';
import { dbStore } from '../../../database/store';
import {
  MainCategoryModel,
  ChildCategoryModel,
  ProductTypeModel,
  NewLaunchCollectionModel,
  platformPersistenceService,
} from '../../../database/platform-persistence.service';

const DEFAULT_TENANT = 'tenant-buildora-blr';
const GLOBAL_TENANT = 'GLOBAL';

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
  public newLaunchCollections: NewLaunchCollection[] = [];
  public migrationRecords: TaxonomyMigrationRecord[] = [];

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
    this.migrateLegacyCatalogRecords();
  }

  async hydrateFromDatabase() {
    const [dbMains, dbChildren, dbTypes, dbCollections] = await Promise.all([
      platformPersistenceService.loadAll<MainCategory>(MainCategoryModel),
      platformPersistenceService.loadAll<ChildCategory>(ChildCategoryModel),
      platformPersistenceService.loadAll<ProductTypeNode>(ProductTypeModel),
      platformPersistenceService.loadAll<NewLaunchCollection>(NewLaunchCollectionModel),
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

    this.initialized = true;
    this.migrateLegacyCatalogRecords();
    this.syncDbStoreCategories();
    this.logger.log(
      `Taxonomy ready: ${this.mainCategories.length} Main, ${this.childCategories.length} Child, ${this.productTypes.length} Product Types.`
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

  // ==================== ADMIN TAXONOMY CRUD ====================

  async createMainCategory(
    tenantId: string,
    payload: Partial<MainCategory>
  ): Promise<MainCategory> {
    if (!payload.name?.trim()) throw new BadRequestException('Main category name is required.');
    const name = payload.name.trim();
    const slug = (payload.slug?.trim() || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (this.mainCategories.some((m) => m.slug.toLowerCase() === slug && m.tenantId === tenantId)) {
      throw new BadRequestException(`Main category "${slug}" already exists.`);
    }
    const now = new Date().toISOString();
    const record: MainCategory = {
      id: `mc-${Date.now()}`,
      tenantId,
      name,
      slug,
      icon: payload.icon || 'Layers',
      description: payload.description?.trim() || '',
      image: payload.image?.trim() || '',
      sortOrder: Number(payload.sortOrder ?? this.mainCategories.length + 1),
      isActive: payload.isActive !== false,
      showInNavigation: payload.showInNavigation !== false,
      createdAt: now,
      updatedAt: now,
    };
    this.mainCategories.push(record);
    await platformPersistenceService.upsert(MainCategoryModel, record);
    return record;
  }

  async updateMainCategory(
    tenantId: string,
    id: string,
    updates: Partial<MainCategory>
  ): Promise<MainCategory> {
    const existing = this.mainCategories.find(
      (m) => m.id === id && (!m.tenantId || m.tenantId === GLOBAL_TENANT || m.tenantId === tenantId)
    );
    if (!existing) throw new BadRequestException(`Main category ${id} not found.`);
    if (updates.name !== undefined) existing.name = updates.name.trim();
    if (updates.slug !== undefined) {
      existing.slug = updates.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (updates.description !== undefined) existing.description = updates.description;
    if (updates.image !== undefined) existing.image = updates.image;
    if (updates.sortOrder !== undefined) existing.sortOrder = Number(updates.sortOrder);
    if (updates.isActive !== undefined) existing.isActive = Boolean(updates.isActive);
    if (updates.showInNavigation !== undefined) existing.showInNavigation = Boolean(updates.showInNavigation);
    existing.updatedAt = new Date().toISOString();
    await platformPersistenceService.upsert(MainCategoryModel, existing);
    return existing;
  }

  async createChildCategory(
    tenantId: string,
    payload: Partial<ChildCategory>
  ): Promise<ChildCategory> {
    if (!payload.name?.trim()) throw new BadRequestException('Child category name is required.');
    if (!payload.mainCategoryId) throw new BadRequestException('Parent Main Category is required.');
    const parent = this.mainCategories.find((m) => m.id === payload.mainCategoryId || m.slug === payload.mainCategoryId);
    if (!parent) throw new BadRequestException(`Main category "${payload.mainCategoryId}" not found.`);

    const name = payload.name.trim();
    const slug = (payload.slug?.trim() || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (this.childCategories.some((c) => c.slug.toLowerCase() === slug)) {
      throw new BadRequestException(`Child category "${slug}" already exists.`);
    }
    const now = new Date().toISOString();
    const record: ChildCategory = {
      id: `cat-${Date.now()}`,
      tenantId,
      mainCategoryId: parent.id,
      mainCategorySlug: parent.slug,
      name,
      slug,
      icon: payload.icon || 'Layers',
      description: payload.description?.trim() || '',
      image: payload.image?.trim() || '',
      sortOrder: Number(payload.sortOrder ?? this.childCategories.length + 1),
      isActive: payload.isActive !== false,
      createdAt: now,
      updatedAt: now,
    };
    this.childCategories.push(record);
    await platformPersistenceService.upsert(ChildCategoryModel, record);
    this.syncDbStoreCategories(tenantId);
    return record;
  }

  async updateChildCategory(
    tenantId: string,
    id: string,
    updates: Partial<ChildCategory>
  ): Promise<ChildCategory> {
    const existing = this.childCategories.find((c) => c.id === id);
    if (!existing) throw new BadRequestException(`Child category ${id} not found.`);
    if (updates.mainCategoryId !== undefined) {
      const parent = this.mainCategories.find((m) => m.id === updates.mainCategoryId);
      if (!parent) throw new BadRequestException('Valid parent Main Category is required.');
      existing.mainCategoryId = parent.id;
      existing.mainCategorySlug = parent.slug;
    }
    if (updates.name !== undefined) existing.name = updates.name.trim();
    if (updates.slug !== undefined) {
      existing.slug = updates.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (updates.description !== undefined) existing.description = updates.description;
    if (updates.image !== undefined) existing.image = updates.image;
    if (updates.sortOrder !== undefined) existing.sortOrder = Number(updates.sortOrder);
    if (updates.isActive !== undefined) existing.isActive = Boolean(updates.isActive);
    existing.updatedAt = new Date().toISOString();
    await platformPersistenceService.upsert(ChildCategoryModel, existing);
    this.syncDbStoreCategories(tenantId);
    return existing;
  }

  async createProductType(
    tenantId: string,
    payload: Partial<ProductTypeNode>
  ): Promise<ProductTypeNode> {
    if (!payload.name?.trim()) throw new BadRequestException('Product Type name is required.');
    if (!payload.childCategoryId) throw new BadRequestException('Child Category is required.');
    const child = this.childCategories.find(
      (c) => c.id === payload.childCategoryId || c.slug === payload.childCategoryId
    );
    if (!child) throw new BadRequestException(`Child category "${payload.childCategoryId}" not found.`);
    if (payload.mainCategoryId && child.mainCategoryId !== payload.mainCategoryId) {
      throw new BadRequestException('Selected Child Category does not belong to the selected Main Category.');
    }

    const name = payload.name.trim();
    const slug = (payload.slug?.trim() || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (this.productTypes.some((pt) => pt.slug.toLowerCase() === slug && pt.childCategoryId === child.id)) {
      throw new BadRequestException(`Product Type "${slug}" already exists under ${child.name}.`);
    }
    const now = new Date().toISOString();
    const record: ProductTypeNode = {
      id: `sub-${Date.now()}`,
      tenantId,
      mainCategoryId: child.mainCategoryId,
      childCategoryId: child.id,
      childCategorySlug: child.slug,
      name,
      slug,
      sortOrder: Number(payload.sortOrder ?? this.productTypes.length + 1),
      isActive: payload.isActive !== false,
      createdAt: now,
      updatedAt: now,
    };
    this.productTypes.push(record);
    await platformPersistenceService.upsert(ProductTypeModel, record);
    this.syncDbStoreCategories(tenantId);
    return record;
  }

  async updateProductType(
    tenantId: string,
    id: string,
    updates: Partial<ProductTypeNode>
  ): Promise<ProductTypeNode> {
    const existing = this.productTypes.find((pt) => pt.id === id);
    if (!existing) throw new BadRequestException(`Product Type ${id} not found.`);
    if (updates.childCategoryId !== undefined) {
      const child = this.childCategories.find((c) => c.id === updates.childCategoryId);
      if (!child) throw new BadRequestException('Valid Child Category is required.');
      existing.childCategoryId = child.id;
      existing.childCategorySlug = child.slug;
      existing.mainCategoryId = child.mainCategoryId;
    }
    if (updates.name !== undefined) existing.name = updates.name.trim();
    if (updates.slug !== undefined) {
      existing.slug = updates.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (updates.sortOrder !== undefined) existing.sortOrder = Number(updates.sortOrder);
    if (updates.isActive !== undefined) existing.isActive = Boolean(updates.isActive);
    existing.updatedAt = new Date().toISOString();
    await platformPersistenceService.upsert(ProductTypeModel, existing);
    this.syncDbStoreCategories(tenantId);
    return existing;
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
}

export const taxonomyService = new TaxonomyService();
