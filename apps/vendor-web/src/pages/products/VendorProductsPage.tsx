import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Layers,
  Eye,
  Sliders,
  Sparkles,
  RefreshCw,
  X,
  Image as ImageIcon,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Upload,
} from 'lucide-react';
import { useVendorProductStore } from '../../store/useVendorProductStore';
import {
  PageHeader,
  Card,
  CardContent,
  Button,
  Badge,
  Modal,
  ConfirmDialog,
  EmptyState,
  TablePagination,
} from '../../components/common';
import { VendorProduct, AttributeSelectorType, CategoryFieldSchema } from '@buildora/types';
import {
  MASTER_CATEGORIES,
  MAIN_CATEGORIES_SEED,
  CHILD_CATEGORIES_SEED,
  PRODUCT_TYPES_SEED,
  CATEGORY_FIELD_SCHEMAS_SEED,
  getDefaultFieldSchemasForCategory,
  getAttributeTemplatesForCategory,
  resolveCanonicalCategoryHierarchy,
  resolveFullTaxonomy,
} from '@buildora/constants';
import { vendorApi } from '../../services/vendorApi';
import { toast } from '../../store/useToastStore';

interface FormAttribute {
  id: string;
  name: string;
  uiType: AttributeSelectorType;
  optionsStr: string;
  required?: boolean;
}

interface FormVariant {
  id: string;
  name: string;
  sku: string;
  attributes: Record<string, string>;
  price: number;
  mrp: number;
  stock: number;
  inStock: boolean;
  isAvailable?: boolean;
  barcode?: string;
  weight?: string;
  dimensions?: string;
  image?: string;
}

const DEFAULT_CATEGORIES = MASTER_CATEGORIES.map((c) => c.name);

export const VendorProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    products,
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    isLoading,
  } = useVendorProductStore();

  const [search, setSearch] = useState(searchParams.get('search') || searchParams.get('brand') || '');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || 'ALL');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Modal & Delete confirmation
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<VendorProduct | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VendorProduct | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [hasLoadedTaxonomy, setHasLoadedTaxonomy] = useState(false);
  const [taxonomyState, setTaxonomyState] = useState<{
    mainCategories: any[];
    childCategories: any[];
    productTypes: any[];
    desktopNavigation?: any[];
    fieldSchemas: CategoryFieldSchema[];
    warehouses: any[];
    brands: any[];
    gstSlabs: number[];
    commissionRate?: number;
  }>({
    mainCategories: MAIN_CATEGORIES_SEED,
    childCategories: CHILD_CATEGORIES_SEED,
    productTypes: PRODUCT_TYPES_SEED,
    desktopNavigation: [],
    fieldSchemas: CATEGORY_FIELD_SCHEMAS_SEED,
    warehouses: [],
    brands: [],
    gstSlabs: [0, 5, 12, 18, 28],
  });
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [mainCategoryId, setMainCategoryId] = useState(MAIN_CATEGORIES_SEED[0]?.id || 'mc-1');
  const [childCategoryId, setChildCategoryId] = useState(CHILD_CATEGORIES_SEED[0]?.id || 'cat-1');
  const [productTypeId, setProductTypeId] = useState(PRODUCT_TYPES_SEED[0]?.id || 'sub-1-1');
  const [category, setCategory] = useState('Cement & Concrete');
  const [subCategory, setSubCategory] = useState('OPC 53 Grade Cement');
  const [brand, setBrand] = useState('UltraTech Cement');
  const [unit, setUnit] = useState('50 Kg Bag');
  const [moq, setMoq] = useState('1');
  const [gstRate, setGstRate] = useState('18');
  const [mrp, setMrp] = useState('420');
  const [price, setPrice] = useState('380');
  const [stock, setStock] = useState('250');
  const [lowStockThreshold, setLowStockThreshold] = useState('40');
  const [warehouseId, setWarehouseId] = useState('WH-BLR-04');
  const [deliveryModes, setDeliveryModes] = useState<string[]>(['ASAP_60', 'STANDARD']);
  const [enableBulkPricing, setEnableBulkPricing] = useState(true);
  const [bulkTier10Discount, setBulkTier10Discount] = useState('5');
  const [bulkTier50Discount, setBulkTier50Discount] = useState('8');
  const [productStatus, setProductStatus] = useState<'ACTIVE' | 'DRAFT' | 'OUT_OF_STOCK'>('ACTIVE');
  const [inStock, setInStock] = useState(true);
  const [imageUrlsText, setImageUrlsText] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [description, setDescription] = useState('');
  const [productType, setProductType] = useState('');
  const [size, setSize] = useState('');
  const [isNewLaunch, setIsNewLaunch] = useState(false);
  const [categoryAttributes, setCategoryAttributes] = useState<Record<string, any>>({});
  const [extraSpecRows, setExtraSpecRows] = useState<Array<{ key: string; value: string }>>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Variants
  const [hasVariants, setHasVariants] = useState(false);
  const [formAttributes, setFormAttributes] = useState<FormAttribute[]>([
    { id: 'attr-1', name: 'Size', uiType: 'cards', optionsStr: 'M6, M8' },
  ]);
  const [formVariants, setFormVariants] = useState<FormVariant[]>([]);

  const refreshVendorTaxonomy = () => {
    vendorApi.getTaxonomy().then((res) => {
      if (
        res &&
        Array.isArray(res.mainCategories) &&
        Array.isArray(res.childCategories)
      ) {
        setHasLoadedTaxonomy(true);
        setTaxonomyState((prev) => ({
          ...prev,
          mainCategories: res.mainCategories.filter((m: any) => m.isActive !== false),
          childCategories: res.childCategories.filter((c: any) => c.isActive !== false),
          productTypes: (res.productTypes || []).filter((pt: any) => pt.isActive !== false),
          desktopNavigation: res.desktopNavigation || [],
          fieldSchemas: (res.fieldSchemas && res.fieldSchemas.length > 0
            ? res.fieldSchemas
            : CATEGORY_FIELD_SCHEMAS_SEED).filter((f: any) => f.isActive !== false),
          warehouses: res.warehouses || [],
          brands: res.brands || [],
          gstSlabs: res.config?.gstSlabs?.length ? res.config.gstSlabs : [0, 5, 12, 18, 28],
          commissionRate: res.config?.commissionRate,
        }));
      }
    }).catch(() => {});
  };

  useEffect(() => {
    fetchProducts();
    refreshVendorTaxonomy();

    const onVendorRealtime = (evt: Event) => {
      const detail = (evt as CustomEvent).detail || {};
      if (
        detail.event === 'taxonomy.published' ||
        detail.event === 'settings.updated' ||
        detail.event === 'filters.updated' ||
        detail.event === 'product.approved' ||
        detail.event === 'product.rejected' ||
        detail.event === 'product.updated'
      ) {
        refreshVendorTaxonomy();
        fetchProducts();
      }
    };
    const onFocusRefresh = () => {
      if (document.visibilityState === 'visible') refreshVendorTaxonomy();
    };
    window.addEventListener('buildora:vendor:realtime', onVendorRealtime);
    window.addEventListener('focus', refreshVendorTaxonomy);
    document.addEventListener('visibilitychange', onFocusRefresh);
    return () => {
      window.removeEventListener('buildora:vendor:realtime', onVendorRealtime);
      window.removeEventListener('focus', refreshVendorTaxonomy);
      document.removeEventListener('visibilitychange', onFocusRefresh);
    };
  }, []);

  useEffect(() => {
    const qSearch = searchParams.get('search');
    const qStatus = searchParams.get('status');
    if (qSearch !== null) setSearch(qSearch);
    if (qStatus !== null) setSelectedStatus(qStatus);
  }, [searchParams]);

  const categoryOptions = useMemo(() => {
    const set = new Set(DEFAULT_CATEGORIES);
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  const availableMainCategories = useMemo(
    () =>
      [...(hasLoadedTaxonomy ? taxonomyState.mainCategories : MAIN_CATEGORIES_SEED)]
        .filter((m) => m.isActive !== false)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
    [hasLoadedTaxonomy, taxonomyState.mainCategories]
  );

  const selectedMainCatNode = useMemo(
    () =>
      availableMainCategories.find((m) => m.id === mainCategoryId) ||
      availableMainCategories[0],
    [availableMainCategories, mainCategoryId]
  );

  const availableChildCategories = useMemo(() => {
    const source = hasLoadedTaxonomy ? taxonomyState.childCategories : CHILD_CATEGORIES_SEED;
    return source
      .filter((c) => c.mainCategoryId === selectedMainCatNode?.id && c.isActive !== false)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }, [hasLoadedTaxonomy, taxonomyState.childCategories, selectedMainCatNode]);

  const selectedChildCatNode = useMemo(
    () =>
      availableChildCategories.find((c) => c.id === childCategoryId) ||
      availableChildCategories[0],
    [availableChildCategories, childCategoryId]
  );

  const availableProductTypes = useMemo(() => {
    const source = hasLoadedTaxonomy ? taxonomyState.productTypes : PRODUCT_TYPES_SEED;
    return source
      .filter((pt) => pt.childCategoryId === selectedChildCatNode?.id && pt.isActive !== false)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }, [hasLoadedTaxonomy, taxonomyState.productTypes, selectedChildCatNode]);

  const selectedProductTypeNode = useMemo(
    () =>
      availableProductTypes.find((pt) => pt.id === productTypeId) ||
      availableProductTypes[0],
    [availableProductTypes, productTypeId]
  );

  const selectedMainCategoryObj = useMemo(() => {
    const found = MASTER_CATEGORIES.find(
      (c) =>
        c.id === selectedChildCatNode?.id ||
        c.slug === selectedChildCatNode?.slug ||
        c.name.toLowerCase() === category.toLowerCase()
    );
    return found || MASTER_CATEGORIES[0];
  }, [selectedChildCatNode, category]);

  const activeCategoryFields = useMemo(() => {
    const cid = selectedChildCatNode?.id || childCategoryId;
    const cslug = selectedChildCatNode?.slug || '';
    const liveMatches = taxonomyState.fieldSchemas
      .filter(
        (f) =>
          f.isActive !== false &&
          (f.childCategoryId === cid || (cslug && f.childCategorySlug === cslug))
      )
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    if (liveMatches.length > 0) return liveMatches;
    return getDefaultFieldSchemasForCategory(cid || cslug);
  }, [taxonomyState.fieldSchemas, selectedChildCatNode, childCategoryId]);

  const groupedCategoryFields = useMemo(() => {
    const groups: Record<string, CategoryFieldSchema[]> = {};
    for (const f of activeCategoryFields) {
      const grp = f.group || 'Core Product Attributes';
      groups[grp] = groups[grp] || [];
      groups[grp].push(f);
    }
    return Object.entries(groups);
  }, [activeCategoryFields]);

  // Refresh dynamic field schema when vendor switches Child Category inside the modal
  useEffect(() => {
    if (!isModalOpen || !childCategoryId) return;
    vendorApi.getCategoryFields(childCategoryId).then((fields) => {
      if (Array.isArray(fields) && fields.length > 0) {
        setTaxonomyState((prev) => ({
          ...prev,
          fieldSchemas: [
            ...prev.fieldSchemas.filter((f) => f.childCategoryId !== childCategoryId),
            ...fields,
          ],
        }));
      }
    }).catch(() => {});
  }, [isModalOpen, childCategoryId]);

  const validateDynamicFieldsClient = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    for (const schema of activeCategoryFields) {
      const rawVal = categoryAttributes[schema.fieldKey];
      const missing =
        rawVal === undefined ||
        rawVal === null ||
        (typeof rawVal === 'string' && rawVal.trim() === '') ||
        (Array.isArray(rawVal) && rawVal.length === 0);
      if (missing) {
        if (schema.required) errs[schema.fieldKey] = `${schema.label} is required.`;
        continue;
      }
      if (schema.fieldType === 'number') {
        const num = Number(rawVal);
        if (Number.isNaN(num)) errs[schema.fieldKey] = `${schema.label} must be a valid number.`;
        else if (schema.validation?.min !== undefined && num < schema.validation.min) {
          errs[schema.fieldKey] = `${schema.label} must be at least ${schema.validation.min}.`;
        } else if (schema.validation?.max !== undefined && num > schema.validation.max) {
          errs[schema.fieldKey] = `${schema.label} cannot exceed ${schema.validation.max}.`;
        }
      } else if (schema.fieldType === 'text' || schema.fieldType === 'textarea') {
        const s = String(rawVal).trim();
        if (schema.validation?.minLength !== undefined && s.length < schema.validation.minLength) {
          errs[schema.fieldKey] = `${schema.label} requires at least ${schema.validation.minLength} characters.`;
        } else if (schema.validation?.pattern) {
          try {
            if (!new RegExp(schema.validation.pattern).test(s)) {
              errs[schema.fieldKey] = schema.validation.patternMessage || `${schema.label} format is invalid.`;
            }
          } catch {}
        }
      }
    }
    return errs;
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setWizardStep(1);
    setFormError(null);
    setFieldErrors({});
    setName('');
    setSku(`SKU-BLR-${Math.floor(1000 + Math.random() * 9000)}`);
    const defaultMain = availableMainCategories[0] || MAIN_CATEGORIES_SEED[0];
    const defaultChild =
      taxonomyState.childCategories.find((c) => c.mainCategoryId === defaultMain?.id) ||
      CHILD_CATEGORIES_SEED[0];
    const defaultType =
      taxonomyState.productTypes.find((pt) => pt.childCategoryId === defaultChild?.id) ||
      PRODUCT_TYPES_SEED[0];
    setMainCategoryId(defaultMain?.id || '');
    setChildCategoryId(defaultChild?.id || '');
    setProductTypeId(defaultType?.id || '');
    setCategory(defaultChild?.name || '');
    setSubCategory(defaultType?.name || '');
    setBrand('');
    setUnit('50 Kg Bag');
    setMoq('1');
    setGstRate('18');
    setMrp('');
    setPrice('');
    setStock('100');
    setLowStockThreshold('30');
    setWarehouseId(taxonomyState.warehouses[0]?.id || 'WH-BLR-04');
    setDeliveryModes(['ASAP_60', 'STANDARD']);
    setEnableBulkPricing(true);
    setBulkTier10Discount('5');
    setBulkTier50Discount('8');
    setProductStatus('ACTIVE');
    setInStock(true);
    setImageUrlsText('');
    setDescription('');
    setProductType('');
    setSize('');
    setIsNewLaunch(false);
    setCategoryAttributes({});
    setExtraSpecRows([]);
    setHasVariants(false);
    setFormAttributes([
      { id: 'attr-1', name: 'Size', uiType: 'cards', optionsStr: 'Standard', required: true },
    ]);
    setFormVariants([]);
    setIsModalOpen(true);
  };

  const openEditModal = (p: VendorProduct) => {
    setEditingProduct(p);
    setWizardStep(1);
    setFormError(null);
    setFieldErrors({});
    const resolvedStock = p.stockCount ?? p.stock ?? 0;
    const resolvedTax = resolveFullTaxonomy(p as any, {
      mainCategories: availableMainCategories,
      childCategories: taxonomyState.childCategories,
      productTypes: taxonomyState.productTypes,
    });
    const mId = (p as any).mainCategoryId || resolvedTax.mainCategory?.id || 'mc-1';
    const cId = (p as any).childCategoryId || resolvedTax.childCategory?.id || 'cat-1';
    const ptId =
      (p as any).productTypeId ||
      resolvedTax.productType?.id ||
      taxonomyState.productTypes.find((pt) => pt.childCategoryId === cId)?.id ||
      '';

    setName(p.name);
    setSku(p.sku);
    setMainCategoryId(mId);
    setChildCategoryId(cId);
    setProductTypeId(ptId);
    setCategory(resolvedTax.childCategory?.name || p.category);
    setSubCategory(resolvedTax.productType?.name || p.subCategory || p.subcategory || '');
    setBrand(p.brand);
    setUnit(p.unit);
    setMoq(String((p as any).moq ?? 1));
    setGstRate(String(p.gstRate ?? 18));
    setMrp(String(p.mrp ?? 0));
    setPrice(String(p.price ?? 0));
    setStock(String(resolvedStock));
    setLowStockThreshold(String(p.lowStockThreshold ?? 30));
    setWarehouseId((p as any).warehouseId || taxonomyState.warehouses[0]?.id || 'WH-BLR-04');
    setDeliveryModes(
      Array.isArray(p.deliverySpeedAvailable) && p.deliverySpeedAvailable.length > 0
        ? p.deliverySpeedAvailable
        : ['ASAP_60', 'STANDARD']
    );
    setEnableBulkPricing(Boolean(p.bulkPricing && p.bulkPricing.length > 0));
    setBulkTier10Discount(String(p.bulkPricing?.[0]?.discountPercentage ?? 5));
    setBulkTier50Discount(String(p.bulkPricing?.[1]?.discountPercentage ?? 8));
    setProductStatus(p.status || (resolvedStock > 0 ? 'ACTIVE' : 'OUT_OF_STOCK'));
    setInStock(p.inStock !== false && resolvedStock > 0);
    setImageUrlsText((p.images || []).join('\n'));
    setDescription(p.description || '');
    setProductType(
      (p as any).productType || p.specifications?.['Product Type'] || p.specifications?.['Type'] || ''
    );
    setSize((p as any).size || p.specifications?.['Size'] || p.packSize || p.unit || '');
    setIsNewLaunch(Boolean(p.isNewLaunch));
    setCategoryAttributes((p as any).categoryAttributes || {});
    const specEntries = Object.entries(p.specifications || {}).filter(
      ([k]) => !['Product Type', 'Size', 'Packaging'].includes(k)
    );
    setExtraSpecRows(specEntries.map(([key, value]) => ({ key, value: String(value || '') })));

    const hasV = Boolean(
      (p.variants && p.variants.length > 1) || (p.attributes && p.attributes.length > 0)
    );
    setHasVariants(hasV);

    if (p.attributes && p.attributes.length > 0) {
      setFormAttributes(
        p.attributes.map((a, i) => ({
          id: a.id || `attr-${i}`,
          name: a.name,
          uiType: a.uiType || 'cards',
          optionsStr: a.options
            .map((o: any) => (typeof o === 'string' ? o : o.value || ''))
            .join(', '),
          required: a.required ?? true,
        }))
      );
    } else {
      setFormAttributes([
        { id: 'attr-1', name: 'Size', uiType: 'cards', optionsStr: 'Standard', required: true },
      ]);
    }

    if (p.variants && p.variants.length > 0) {
      setFormVariants(
        p.variants.map((v) => ({
          id: v.id,
          name: v.name,
          sku: v.sku,
          attributes: v.attributes || { [p.attributes?.[0]?.name || 'Option']: v.name },
          price: v.price,
          mrp: v.mrp,
          stock: v.stock || 50,
          inStock: v.inStock !== false,
          isAvailable: v.isAvailable !== false,
          barcode: v.barcode,
          weight: v.weight,
          dimensions: v.dimensions,
          image: v.image,
        }))
      );
    } else {
      setFormVariants([]);
    }

    setIsModalOpen(true);
  };

  const handleAddOptionGroup = () => {
    setFormAttributes([
      ...formAttributes,
      {
        id: `attr-${Date.now()}`,
        name: `Option ${formAttributes.length + 1}`,
        uiType: 'cards',
        optionsStr: 'Option A, Option B',
        required: true,
      },
    ]);
  };

  const handleRemoveOptionGroup = (id: string) => {
    setFormAttributes(formAttributes.filter((a) => a.id !== id));
  };

  const handleOptionGroupChange = (idx: number, field: keyof FormAttribute, val: any) => {
    const updated = [...formAttributes];
    updated[idx] = { ...updated[idx], [field]: val };
    setFormAttributes(updated);
  };

  const handleAddTemplateOption = (tpl: any) => {
    setFormAttributes([
      ...formAttributes,
      {
        id: `attr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: tpl.name,
        uiType: tpl.suggestedUiType || 'cards',
        optionsStr: (tpl.suggestedOptions || []).join(', '),
        required: true,
      },
    ]);
  };

  const handleGenerateVariantMatrix = () => {
    const activeAttrs = formAttributes
      .map((a) => ({
        name: a.name.trim(),
        options: a.optionsStr
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      }))
      .filter((a) => a.name && a.options.length > 0);

    if (activeAttrs.length === 0) return;

    let combos: Array<Record<string, string>> = [{}];
    for (const attr of activeAttrs) {
      const nextCombos: Array<Record<string, string>> = [];
      for (const combo of combos) {
        for (const opt of attr.options) {
          nextCombos.push({ ...combo, [attr.name]: opt });
        }
      }
      combos = nextCombos;
    }

    const generated: FormVariant[] = combos.map((c, idx) => {
      const comboName = Object.values(c).join(' / ');
      const existing = formVariants.find((v) => {
        if (!v.attributes) return v.name === comboName;
        return Object.entries(c).every(([k, val]) => v.attributes[k] === val);
      });
      if (existing) {
        return { ...existing, name: comboName, attributes: c };
      }
      const cleanSkuPart = Object.values(c)
        .join('-')
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase();
      return {
        id: `v-matrix-${Date.now()}-${idx + 1}`,
        name: comboName,
        sku: `${sku || 'SKU'}-${cleanSkuPart || idx + 1}`,
        attributes: c,
        price: Number(price) || 100,
        mrp: Number(mrp) || 150,
        stock: Number(stock) || 50,
        inStock: true,
        isAvailable: true,
      };
    });
    setFormVariants(generated);
  };

  const handleAddVariantRow = () => {
    const newIdx = formVariants.length + 1;
    setFormVariants([
      ...formVariants,
      {
        id: `v-custom-${Date.now()}-${newIdx}`,
        name: `Option ${newIdx}`,
        sku: `${sku}-V${newIdx}`,
        attributes: { [formAttributes[0]?.name || 'Option']: `Option ${newIdx}` },
        price: Number(price) || 100,
        mrp: Number(mrp) || 150,
        stock: 50,
        inStock: true,
        isAvailable: true,
      },
    ]);
  };

  const handleRemoveVariantRow = (idx: number) => {
    setFormVariants(formVariants.filter((_, i) => i !== idx));
  };

  const handleVariantChange = (idx: number, field: keyof FormVariant, val: any) => {
    const updated = [...formVariants];
    updated[idx] = { ...updated[idx], [field]: val };
    setFormVariants(updated);
  };

  const submitWizardProduct = async (submitAsDraft = false) => {
    if (isSaving) return;

    const mrpNum = Number(mrp);
    const priceNum = Number(price);
    const stockNum = Number(stock);

    const nextFieldErrors: Record<string, string> = submitAsDraft ? {} : validateDynamicFieldsClient();
    if (!name.trim()) nextFieldErrors.name = 'Product Name is required.';
    if (!brand.trim()) nextFieldErrors.brand = 'Brand is required.';
    if (!sku.trim()) nextFieldErrors.sku = 'SKU / Product Code is required.';
    if (priceNum <= 0 || Number.isNaN(priceNum)) nextFieldErrors.price = 'Selling Price must be greater than 0.';
    if (mrpNum <= 0 || Number.isNaN(mrpNum)) nextFieldErrors.mrp = 'MRP must be greater than 0.';
    if (priceNum > mrpNum) nextFieldErrors.price = 'Selling Price cannot exceed MRP.';

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      const firstMsg = Object.values(nextFieldErrors)[0];
      setFormError(firstMsg);
      if (nextFieldErrors.name || nextFieldErrors.brand || Object.keys(validateDynamicFieldsClient()).some((k) => nextFieldErrors[k])) {
        setWizardStep(2);
      } else if (nextFieldErrors.sku || nextFieldErrors.price || nextFieldErrors.mrp) {
        setWizardStep(3);
      }
      return;
    }

    setFieldErrors({});
    setFormError(null);
    setIsSaving(true);

    try {
      const parsedImages = imageUrlsText
        .split(/[\n,]/)
        .map((u) => u.trim())
        .filter(Boolean);

      const finalAttributes = hasVariants
        ? formAttributes
            .map((a) => ({
              id: a.id,
              name: a.name.trim(),
              uiType: a.uiType,
              options: a.optionsStr
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
              required: a.required ?? true,
            }))
            .filter((a) => a.name && a.options.length > 0)
        : undefined;

      const finalVariants =
        hasVariants && formVariants.length > 0
          ? formVariants.map((v) => ({
              id: v.id,
              name: v.name,
              sku: v.sku,
              attributes: v.attributes || { [formAttributes[0]?.name || 'Option']: v.name },
              price: Number(v.price),
              mrp: Number(v.mrp),
              stock: Number(v.stock),
              inStock: Boolean(v.inStock && Number(v.stock) > 0),
              isAvailable: v.isAvailable !== false,
              discount: v.mrp > v.price ? Math.round(((v.mrp - v.price) / v.mrp) * 100) : 0,
              barcode: v.barcode,
              weight: v.weight,
              dimensions: v.dimensions,
              image: v.image,
            }))
          : undefined;

      const resolvedStatus = submitAsDraft
        ? 'DRAFT'
        : stockNum === 0
        ? 'OUT_OF_STOCK'
        : productStatus;
      const resolvedMain = selectedMainCatNode;
      const resolvedChild = selectedChildCatNode;
      const resolvedType = selectedProductTypeNode;
      const fallbackHierarchy = resolveCanonicalCategoryHierarchy(
        resolvedChild?.name || category,
        resolvedType?.name || subCategory
      );
      const canonicalChild = resolvedChild || fallbackHierarchy.matchedMain || MASTER_CATEGORIES[0];
      const canonicalType = resolvedType || fallbackHierarchy.matchedChild || MASTER_CATEGORIES[0].subcategories[0];

      // Build human-readable specifications from dynamic CategoryFieldSchema + manual extra specs
      const dynamicSpecs: Record<string, string> = {};
      for (const f of activeCategoryFields) {
        const val = categoryAttributes[f.fieldKey];
        if (val === undefined || val === null || val === '') continue;
        if (Array.isArray(val)) {
          if (val.length > 0) dynamicSpecs[f.label] = val.join(', ');
        } else if (typeof val === 'boolean') {
          if (val) dynamicSpecs[f.label] = 'Yes';
        } else {
          dynamicSpecs[f.label] = f.unitSuffix ? `${val} ${f.unitSuffix}` : String(val);
        }
      }
      for (const row of extraSpecRows) {
        if (row.key.trim() && row.value.trim()) {
          dynamicSpecs[row.key.trim()] = row.value.trim();
        }
      }

      const selectedWh = taxonomyState.warehouses.find((w) => w.id === warehouseId);
      const t10 = Math.max(1, Number(bulkTier10Discount) || 5);
      const t50 = Math.max(t10, Number(bulkTier50Discount) || 8);

      const productData = {
        name: name.trim(),
        sku: sku.trim(),
        mainCategoryId: resolvedMain?.id || canonicalChild.mainCategoryId || 'mc-1',
        mainCategoryName: resolvedMain?.name || 'Civil & Interiors',
        mainCategorySlug: resolvedMain?.slug || 'civil-interiors',
        childCategoryId: canonicalChild.id,
        childCategoryName: canonicalChild.name,
        childCategorySlug: canonicalChild.slug,
        productTypeId: canonicalType?.id || '',
        productTypeName: canonicalType?.name || '',
        productTypeSlug: canonicalType?.slug || '',
        categoryId: canonicalChild.id,
        category: canonicalChild.name,
        categorySlug: canonicalChild.slug,
        subcategoryId: canonicalType?.id || '',
        subCategory: canonicalType?.name || '',
        subcategory: canonicalType?.name || '',
        subcategorySlug: canonicalType?.slug || '',
        brand: brand.trim(),
        unit: unit.trim(),
        packSize: String(categoryAttributes.packSize || categoryAttributes.packVolume || unit.trim()),
        moq: Math.max(1, Number(moq) || 1),
        gstRate: Number(gstRate),
        mrp: mrpNum,
        price: priceNum,
        discount: mrpNum > priceNum ? Math.round(((mrpNum - priceNum) / mrpNum) * 100) : 0,
        stock: stockNum,
        stockCount: stockNum,
        inStock: inStock && stockNum > 0,
        lowStockThreshold: Number(lowStockThreshold) || 30,
        images: parsedImages.length > 0 ? parsedImages : editingProduct?.images || [],
        description: description.trim(),
        status: resolvedStatus,
        isDraft: submitAsDraft,
        submitForApproval: !submitAsDraft,
        enforceCategoryFields: !submitAsDraft,
        isActive: resolvedStatus === 'ACTIVE',
        isNewLaunch,
        productType: productType || canonicalType?.name || '',
        size: size || unit,
        categoryAttributes,
        specifications: {
          ...dynamicSpecs,
          Packaging: unit.trim(),
        },
        isBulkEligible: enableBulkPricing,
        bulkPricing: enableBulkPricing
          ? [
              { minQuantity: 10, discountPercentage: t10, unitPrice: Math.round(priceNum * (1 - t10 / 100)) },
              { minQuantity: 50, discountPercentage: t50, unitPrice: Math.round(priceNum * (1 - t50 / 100)) },
            ]
          : [],
        warehouseId,
        warehouseLocation: selectedWh?.name || editingProduct?.warehouseLocation || 'WH-BLR-04 Peenya Hub',
        deliverySpeedAvailable: deliveryModes.length > 0 ? deliveryModes : ['STANDARD'],
        attributes: finalAttributes,
        variants: finalVariants,
      };

      if (editingProduct) {
        const ok = await updateProduct(editingProduct.id, productData as any);
        if (ok && finalVariants && finalVariants.length > 0) {
          await vendorApi.updateProductVariants(editingProduct.id, finalVariants, finalAttributes);
        }
        if (ok) toast.success('Product updated and synced for review.');
      } else {
        const ok = await addProduct(productData as any);
        if (ok) {
          toast.success(
            submitAsDraft
              ? 'Product saved as Draft.'
              : 'Product submitted for Company Admin approval.'
          );
        }
      }
      setIsModalOpen(false);
    } catch (err: any) {
      const msg = err?.message || 'Unable to save product.';
      setFormError(msg);
      if (err?.errors) setFieldErrors(err.errors);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitWizardProduct(productStatus === 'DRAFT');
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const ok = await deleteProduct(deleteTarget.id);
    if (ok) {
      toast.success(`"${deleteTarget.name}" removed from catalog.`);
    }
    setDeleteTarget(null);
  };

  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.brand || '').toLowerCase().includes(q);
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    const isProdActive =
      p.isActive !== false && p.approvalStatus === 'APPROVED' && !(p as any).isSuspended;
    const resolvedStatus =
      p.status || ((p.stockCount ?? p.stock ?? 0) > 0 ? 'ACTIVE' : 'OUT_OF_STOCK');
    const matchesStatus =
      selectedStatus === 'ALL' ||
      (selectedStatus === 'ACTIVE' && isProdActive) ||
      (selectedStatus === 'INACTIVE' && !isProdActive) ||
      resolvedStatus === selectedStatus ||
      p.approvalStatus === selectedStatus;
    return matchesSearch && matchesCat && matchesStatus;
  });

  const paginatedProducts = filteredProducts.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Products"
        description="Manage your catalog SKUs, GST rates, pricing, variants, and availability."
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/new-launches')}
              leftIcon={<Sparkles className="w-4 h-4 text-[#943D24]" />}
            >
              New Launches
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/pricing-offers')}
              leftIcon={<Layers className="w-4 h-4" />}
            >
              Bulk Pricing
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={openAddModal}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Product
            </Button>
          </>
        }
      />

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by product name, SKU, or brand..."
                className="portal-input pl-9"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className="portal-input sm:w-48"
              >
                <option value="ALL">All Categories</option>
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className="portal-input sm:w-40"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
                <option value="DRAFT">Draft</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8F7F5] text-[#78716C] font-semibold border-b border-[#E7E5E4]">
              <tr>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">SKU & Brand</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price / MRP</th>
                <th className="py-3 px-4">GST</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E5E4]">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      icon={<Package className="w-5 h-5" />}
                      title="No products found"
                      description="Try clearing your filters or add a new product to your catalog."
                      action={
                        <Button size="sm" variant="primary" onClick={openAddModal}>
                          Add Product
                        </Button>
                      }
                    />
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => {
                  const stockNum = p.stockCount ?? p.stock ?? 0;
                  const isLow = stockNum > 0 && stockNum <= (p.lowStockThreshold || 30);
                  const statusLabel = p.status || (stockNum > 0 ? 'ACTIVE' : 'OUT_OF_STOCK');

                  return (
                    <tr key={p.id} className="hover:bg-[#F8F7F5] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {p.images?.[0] ? (
                            <img
                              src={p.images[0]}
                              alt={p.name}
                              className="w-10 h-10 rounded-lg object-cover border border-[#E7E5E4] shrink-0 bg-[#F8F7F5]"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-[#FBF3F0] flex items-center justify-center text-[#943D24] shrink-0">
                              <Package className="w-4 h-4" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-[#292524] line-clamp-1">{p.name}</p>
                            <p className="text-[11px] text-[#78716C]">
                              {p.unit}
                              {p.variants && p.variants.length > 0
                                ? ` • ${p.variants.length} variants`
                                : ''}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-mono text-[#292524]">{p.sku}</div>
                        <div className="text-[11px] text-[#78716C]">{p.brand}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-[#292524] font-medium">
                          {(p as any).childCategoryName || p.category}
                        </div>
                        <div className="text-[11px] text-[#78716C]">
                          {((p as any).mainCategoryName || (p as any).department || '')}
                          {(p as any).productTypeName || p.subCategory || p.subcategory
                            ? ` • ${(p as any).productTypeName || p.subCategory || p.subcategory}`
                            : ''}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#292524]">
                          ₹{(p.price || 0).toLocaleString('en-IN')}
                        </div>
                        {p.mrp > p.price && (
                          <div className="text-[11px] text-[#78716C] line-through">
                            ₹{p.mrp.toLocaleString('en-IN')}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-[#78716C]">{p.gstRate ?? 18}%</td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`font-semibold ${
                            stockNum === 0
                              ? 'text-[#DC4545]'
                              : isLow
                              ? 'text-[#D99B16]'
                              : 'text-[#292524]'
                          }`}
                        >
                          {stockNum}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            statusLabel === 'ACTIVE'
                              ? 'success'
                              : statusLabel === 'OUT_OF_STOCK'
                              ? 'danger'
                              : 'neutral'
                          }
                          size="sm"
                        >
                          {statusLabel.replace(/_/g, ' ')}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(p)}
                            className="p-1.5 rounded-lg text-[#78716C] hover:text-[#943D24] hover:bg-[#FBF3F0] transition-colors cursor-pointer"
                            title="Edit Product"
                            aria-label={`Edit ${p.name}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(p)}
                            className="p-1.5 rounded-lg text-[#78716C] hover:text-[#DC4545] hover:bg-[#DC4545]/10 transition-colors cursor-pointer"
                            title="Delete Product"
                            aria-label={`Delete ${p.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <TablePagination
          page={page}
          pageSize={pageSize}
          totalItems={filteredProducts.length}
          onPageChange={setPage}
        />
      </Card>

      {/* Add / Edit 4-Step Product Wizard Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? `Edit Product — ${editingProduct.name}` : 'Create New Product'}
        subtitle="Select your category hierarchy, enter category-specific product details, set pricing & stock, and submit for Admin approval."
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveProduct} className="space-y-5">
          {/* Stepper Header */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#F8F7F5] p-2 rounded-xl border border-[#E7E5E4]">
            {[
              { step: 1, label: 'Category' },
              { step: 2, label: 'Product & Fields' },
              { step: 3, label: 'Pricing & Stock' },
              { step: 4, label: 'Review & Submit' },
            ].map((item) => {
              const isCurrent = wizardStep === item.step;
              const isCompleted = wizardStep > item.step;
              return (
                <button
                  key={item.step}
                  type="button"
                  onClick={() => setWizardStep(item.step as 1 | 2 | 3 | 4)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                    isCurrent
                      ? 'bg-[#943D24] text-white shadow-xs'
                      : isCompleted
                      ? 'bg-white text-[#292524] border border-emerald-200'
                      : 'text-[#78716C] hover:bg-white/70'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      isCurrent
                        ? 'bg-[#F6C453] text-[#292524]'
                        : isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#E7E5E4] text-[#57534E]'
                    }`}
                  >
                    {isCompleted ? '✓' : item.step}
                  </span>
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>

          {formError && (
            <div className="p-3 rounded-lg bg-[#DC4545]/10 border border-[#DC4545]/20 text-[#DC4545] text-xs font-medium">
              {formError}
            </div>
          )}

          {/* STEP 1: CATEGORY SELECTION */}
          {wizardStep === 1 && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-[#FBF3F0] border border-[#943D24]/20 text-xs flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-[#943D24]">Selected Category Hierarchy</p>
                  <p className="text-[#292524] mt-0.5 font-medium">
                    Main Category: <strong>{selectedMainCatNode?.name || '—'}</strong> &rarr; Child Category:{' '}
                    <strong>{selectedChildCatNode?.name || '—'}</strong>
                    {selectedProductTypeNode ? ` → ${selectedProductTypeNode.name}` : ''}
                  </p>
                </div>
                <Badge variant="info">{activeCategoryFields.length} Category Fields Loaded</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="portal-label">Main Category *</label>
                  <select
                    value={selectedMainCatNode?.id || mainCategoryId}
                    onChange={(e) => {
                      const nextMainId = e.target.value;
                      setMainCategoryId(nextMainId);
                      const nextChild =
                        taxonomyState.childCategories.find((c) => c.mainCategoryId === nextMainId) ||
                        CHILD_CATEGORIES_SEED.find((c) => c.mainCategoryId === nextMainId);
                      const nextType = nextChild
                        ? taxonomyState.productTypes.find((pt) => pt.childCategoryId === nextChild.id) ||
                          PRODUCT_TYPES_SEED.find((pt) => pt.childCategoryId === nextChild.id)
                        : undefined;
                      setChildCategoryId(nextChild?.id || '');
                      setProductTypeId(nextType?.id || '');
                      setCategory(nextChild?.name || '');
                      setSubCategory(nextType?.name || '');
                      setCategoryAttributes({});
                      setFieldErrors({});
                    }}
                    className="portal-input"
                    required
                  >
                    {availableMainCategories.map((mc) => (
                      <option key={mc.id} value={mc.id}>
                        {mc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="portal-label">Child Category *</label>
                  <select
                    value={selectedChildCatNode?.id || childCategoryId}
                    onChange={(e) => {
                      const nextChildId = e.target.value;
                      const nextChild = availableChildCategories.find((c) => c.id === nextChildId);
                      const nextType = taxonomyState.productTypes.find(
                        (pt) => pt.childCategoryId === nextChildId
                      );
                      setChildCategoryId(nextChildId);
                      setProductTypeId(nextType?.id || '');
                      setCategory(nextChild?.name || '');
                      setSubCategory(nextType?.name || '');
                      setCategoryAttributes({});
                      setFieldErrors({});
                    }}
                    className="portal-input"
                    required
                  >
                    {availableChildCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="portal-label">Subcategory / Product Type (Optional)</label>
                  <select
                    value={selectedProductTypeNode?.id || productTypeId}
                    onChange={(e) => {
                      const nextTypeId = e.target.value;
                      const nextType = availableProductTypes.find((pt) => pt.id === nextTypeId);
                      setProductTypeId(nextTypeId);
                      setSubCategory(nextType?.name || '');
                    }}
                    className="portal-input"
                  >
                    {availableProductTypes.length === 0 ? (
                      <option value="">General</option>
                    ) : (
                      availableProductTypes.map((pt) => (
                        <option key={pt.id} value={pt.id}>
                          {pt.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PRODUCT INFORMATION + DYNAMIC CATEGORY FIELDS */}
          {wizardStep === 2 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="portal-label">Product Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setFieldErrors((p) => ({ ...p, name: '' }));
                    }}
                    placeholder="e.g. UltraTech Super Cement OPC 53 Grade (50 Kg Bag)"
                    className="portal-input"
                  />
                  {fieldErrors.name && <p className="text-[11px] text-[#DC4545] mt-1">{fieldErrors.name}</p>}
                </div>
                <div>
                  <label className="portal-label">Brand *</label>
                  <input
                    type="text"
                    list="buildora-approved-brands"
                    value={brand}
                    onChange={(e) => {
                      setBrand(e.target.value);
                      setFieldErrors((p) => ({ ...p, brand: '' }));
                    }}
                    placeholder="e.g. UltraTech Cement, Asian Paints, Astral Pipes"
                    className="portal-input"
                  />
                  <datalist id="buildora-approved-brands">
                    {taxonomyState.brands.map((b) => (
                      <option key={b.id} value={b.name} />
                    ))}
                  </datalist>
                  {fieldErrors.brand && <p className="text-[11px] text-[#DC4545] mt-1">{fieldErrors.brand}</p>}
                </div>
              </div>

              {/* DYNAMIC ADMIN-CONFIGURED CATEGORY FIELDS */}
              <div className="space-y-4">
                {groupedCategoryFields.map(([groupName, fields]) => (
                  <div
                    key={groupName}
                    className="p-4 rounded-xl border border-[#E7E5E4] bg-[#F8F7F5]/70 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#943D24]">
                        {selectedChildCatNode?.name} — {groupName}
                      </h4>
                      <span className="text-[10px] text-[#78716C]">{fields.length} field(s)</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {fields.map((field) => {
                        const val = categoryAttributes[field.fieldKey];
                        const err = fieldErrors[field.fieldKey];
                        const isFullWidth = field.fieldType === 'textarea' || field.fieldType === 'multiselect';
                        return (
                          <div key={field.id} className={isFullWidth ? 'md:col-span-2' : ''}>
                            <label className="portal-label">
                              {field.label} {field.required && <span className="text-[#DC4545]">*</span>}
                              {field.unitSuffix && (
                                <span className="ml-1 text-[10px] text-[#78716C] font-normal">({field.unitSuffix})</span>
                              )}
                            </label>

                            {field.fieldType === 'dropdown' ? (
                              <select
                                value={val || ''}
                                onChange={(e) => {
                                  setCategoryAttributes((prev) => ({ ...prev, [field.fieldKey]: e.target.value }));
                                  setFieldErrors((p) => ({ ...p, [field.fieldKey]: '' }));
                                }}
                                className="portal-input"
                              >
                                <option value="">Select {field.label}...</option>
                                {(field.options || []).map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            ) : field.fieldType === 'multiselect' ? (
                              <div className="flex flex-wrap gap-2 p-2.5 bg-white rounded-lg border border-[#E7E5E4]">
                                {(field.options || []).map((opt) => {
                                  const selectedArr: string[] = Array.isArray(val) ? val : [];
                                  const checked = selectedArr.includes(opt);
                                  return (
                                    <label
                                      key={opt}
                                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs cursor-pointer border ${
                                        checked
                                          ? 'bg-[#943D24] text-white border-[#943D24]'
                                          : 'bg-[#F8F7F5] text-[#292524] border-[#E7E5E4]'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={checked}
                                        onChange={() => {
                                          const next = checked
                                            ? selectedArr.filter((x) => x !== opt)
                                            : [...selectedArr, opt];
                                          setCategoryAttributes((prev) => ({ ...prev, [field.fieldKey]: next }));
                                          setFieldErrors((p) => ({ ...p, [field.fieldKey]: '' }));
                                        }}
                                      />
                                      <span>{opt}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            ) : field.fieldType === 'checkbox' ? (
                              <label className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-[#E7E5E4] text-xs text-[#292524] cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={Boolean(val)}
                                  onChange={(e) =>
                                    setCategoryAttributes((prev) => ({
                                      ...prev,
                                      [field.fieldKey]: e.target.checked,
                                    }))
                                  }
                                  className="w-4 h-4 rounded text-[#943D24]"
                                />
                                <span>{field.helpText || `Yes, includes ${field.label}`}</span>
                              </label>
                            ) : field.fieldType === 'textarea' ? (
                              <textarea
                                rows={2}
                                value={val || ''}
                                onChange={(e) => {
                                  setCategoryAttributes((prev) => ({ ...prev, [field.fieldKey]: e.target.value }));
                                  setFieldErrors((p) => ({ ...p, [field.fieldKey]: '' }));
                                }}
                                placeholder={field.placeholder || `Enter ${field.label}`}
                                className="portal-input"
                              />
                            ) : (
                              <input
                                type={field.fieldType === 'number' ? 'number' : 'text'}
                                step="any"
                                min={field.validation?.min}
                                max={field.validation?.max}
                                value={val ?? ''}
                                onChange={(e) => {
                                  setCategoryAttributes((prev) => ({ ...prev, [field.fieldKey]: e.target.value }));
                                  setFieldErrors((p) => ({ ...p, [field.fieldKey]: '' }));
                                }}
                                placeholder={field.placeholder || `Enter ${field.label}`}
                                className="portal-input"
                              />
                            )}
                            {err && <p className="text-[11px] text-[#DC4545] mt-1">{err}</p>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Extra Technical Specifications & Description & Images */}
              <div className="space-y-3 pt-2 border-t border-[#E7E5E4]">
                <div className="flex items-center justify-between">
                  <label className="portal-label mb-0">Additional Technical Specifications (Optional)</label>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setExtraSpecRows((p) => [...p, { key: '', value: '' }])}
                  >
                    + Add Spec Row
                  </Button>
                </div>
                {extraSpecRows.map((row, rIdx) => (
                  <div key={rIdx} className="grid grid-cols-12 gap-2">
                    <input
                      placeholder="Spec Label (e.g. Country of Origin)"
                      value={row.key}
                      onChange={(e) =>
                        setExtraSpecRows((prev) =>
                          prev.map((r, i) => (i === rIdx ? { ...r, key: e.target.value } : r))
                        )
                      }
                      className="col-span-5 portal-input text-xs py-1.5"
                    />
                    <input
                      placeholder="Spec Value (e.g. India)"
                      value={row.value}
                      onChange={(e) =>
                        setExtraSpecRows((prev) =>
                          prev.map((r, i) => (i === rIdx ? { ...r, value: e.target.value } : r))
                        )
                      }
                      className="col-span-6 portal-input text-xs py-1.5"
                    />
                    <button
                      type="button"
                      onClick={() => setExtraSpecRows((prev) => prev.filter((_, i) => i !== rIdx))}
                      className="col-span-1 text-[#DC4545] flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <div>
                  <label className="portal-label">Product Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Key material highlights, site applications, and installation guidelines..."
                    className="portal-input"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="portal-label mb-0">Product Images (Upload or paste URLs)</label>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#FBF3F0] border border-[#943D24]/30 text-[#943D24] text-xs font-semibold cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length === 0) return;
                          setUploadingImage(true);
                          try {
                            const uploadedUrls: string[] = [];
                            for (const file of files) {
                              const res = await vendorApi.uploadProductImage(file);
                              if (res.url) uploadedUrls.push(res.url);
                            }
                            setImageUrlsText((prev) =>
                              [prev.trim(), ...uploadedUrls].filter(Boolean).join('\n')
                            );
                            toast.success(`${uploadedUrls.length} image(s) uploaded.`);
                          } catch (err: any) {
                            toast.error(err?.message || 'Image upload failed');
                          } finally {
                            setUploadingImage(false);
                          }
                        }}
                      />
                    </label>
                  </div>
                  <textarea
                    rows={2}
                    value={imageUrlsText}
                    onChange={(e) => setImageUrlsText(e.target.value)}
                    placeholder="https://... (one URL per line)"
                    className="portal-input"
                  />
                  {imageUrlsText.trim() && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {imageUrlsText
                        .split(/[\n,]/)
                        .map((u) => u.trim())
                        .filter(Boolean)
                        .slice(0, 6)
                        .map((url, idx) => (
                          <div
                            key={idx}
                            className="relative w-14 h-14 rounded-lg border border-[#E7E5E4] overflow-hidden bg-[#F8F7F5]"
                          >
                            <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Variants Section inside Step 2 */}
              <div className="p-4 rounded-xl border border-[#E7E5E4] bg-[#F8F7F5] space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="text-xs font-semibold text-[#292524] flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-[#943D24]" />
                      <span>Product Variants (Optional)</span>
                    </div>
                    <p className="text-[11px] text-[#78716C]">
                      Add pack sizes, dimensions, or colour options with separate SKUs.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#292524] bg-white px-3 py-1.5 rounded-lg border border-[#E7E5E4]">
                    <input
                      type="checkbox"
                      checked={hasVariants}
                      onChange={(e) => setHasVariants(e.target.checked)}
                      className="w-4 h-4 text-[#943D24] rounded"
                    />
                    <span>Enable Variants</span>
                  </label>
                </div>

                {hasVariants && (
                  <div className="space-y-4 pt-3 border-t border-[#E7E5E4]">
                    {(() => {
                      const templates = getAttributeTemplatesForCategory(category);
                      if (templates.length === 0) return null;
                      return (
                        <div className="p-3 bg-[#FBF3F0] rounded-lg border border-[#943D24]/15 space-y-1.5">
                          <div className="text-[11px] font-semibold text-[#943D24]">
                            Suggested Variant Templates for {category}:
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {templates.map((tpl) => {
                              const isAdded = formAttributes.some(
                                (a) => a.name.toLowerCase() === tpl.name.toLowerCase()
                              );
                              return (
                                <button
                                  key={tpl.id}
                                  type="button"
                                  disabled={isAdded}
                                  onClick={() => handleAddTemplateOption(tpl)}
                                  className={`text-[11px] font-medium px-2.5 py-1 rounded-md border ${
                                    isAdded
                                      ? 'bg-[#F8F7F5] text-[#78716C] border-[#E7E5E4] cursor-not-allowed'
                                      : 'bg-white text-[#943D24] border-[#E7E5E4] hover:border-[#943D24] cursor-pointer'
                                  }`}
                                >
                                  + {tpl.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#292524]">
                          Option Groups ({formAttributes.length})
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={handleAddOptionGroup}
                          leftIcon={<Plus className="w-3.5 h-3.5" />}
                        >
                          Add Option Group
                        </Button>
                      </div>

                      {formAttributes.map((attr, idx) => (
                        <div key={attr.id} className="p-3 bg-white rounded-lg border border-[#E7E5E4] space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-[#292524]">Group {idx + 1}</span>
                            {formAttributes.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveOptionGroup(attr.id)}
                                className="text-[#DC4545] p-1 rounded hover:bg-[#DC4545]/10 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                            <input
                              type="text"
                              value={attr.name}
                              onChange={(e) => handleOptionGroupChange(idx, 'name', e.target.value)}
                              className="portal-input py-1.5 text-xs"
                              placeholder="Option Name"
                            />
                            <select
                              value={attr.uiType}
                              onChange={(e) => handleOptionGroupChange(idx, 'uiType', e.target.value as AttributeSelectorType)}
                              className="portal-input py-1.5 text-xs"
                            >
                              <option value="cards">Cards</option>
                              <option value="pills">Pills</option>
                              <option value="dropdown">Dropdown</option>
                              <option value="color_swatches">Colour Swatches</option>
                              <option value="radio">Radio</option>
                            </select>
                            <input
                              type="text"
                              value={attr.optionsStr}
                              onChange={(e) => handleOptionGroupChange(idx, 'optionsStr', e.target.value)}
                              className="portal-input py-1.5 text-xs"
                              placeholder="Values (comma separated)"
                            />
                          </div>
                        </div>
                      ))}

                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="primary"
                          onClick={handleGenerateVariantMatrix}
                          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                        >
                          Generate Variant Matrix
                        </Button>
                        <button
                          type="button"
                          onClick={handleAddVariantRow}
                          className="text-xs font-medium text-[#943D24] hover:underline cursor-pointer"
                        >
                          + Add Custom Row
                        </button>
                      </div>
                    </div>

                    {formVariants.length > 0 && (
                      <div className="overflow-x-auto max-h-56 rounded-lg border border-[#E7E5E4] bg-white">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#F8F7F5] text-[#78716C] font-semibold border-b border-[#E7E5E4] sticky top-0">
                            <tr>
                              <th className="p-2">Variant</th>
                              <th className="p-2">SKU</th>
                              <th className="p-2">Price (₹)</th>
                              <th className="p-2">MRP (₹)</th>
                              <th className="p-2">Stock</th>
                              <th className="p-2 text-center">Remove</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E7E5E4]">
                            {formVariants.map((v, vIdx) => (
                              <tr key={v.id || vIdx}>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={v.name}
                                    onChange={(e) => handleVariantChange(vIdx, 'name', e.target.value)}
                                    className="w-28 px-2 py-1 border border-[#E7E5E4] rounded text-xs"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={v.sku}
                                    onChange={(e) => handleVariantChange(vIdx, 'sku', e.target.value)}
                                    className="w-24 px-2 py-1 border border-[#E7E5E4] rounded text-xs font-mono"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="number"
                                    value={v.price}
                                    onChange={(e) => handleVariantChange(vIdx, 'price', Number(e.target.value))}
                                    className="w-20 px-2 py-1 border border-[#E7E5E4] rounded text-xs"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="number"
                                    value={v.mrp}
                                    onChange={(e) => handleVariantChange(vIdx, 'mrp', Number(e.target.value))}
                                    className="w-20 px-2 py-1 border border-[#E7E5E4] rounded text-xs"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="number"
                                    value={v.stock}
                                    onChange={(e) => handleVariantChange(vIdx, 'stock', Number(e.target.value))}
                                    className="w-16 px-2 py-1 border border-[#E7E5E4] rounded text-xs"
                                  />
                                </td>
                                <td className="p-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveVariantRow(vIdx)}
                                    className="text-[#DC4545] p-1 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: PRICING & INVENTORY */}
          {wizardStep === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="portal-label">SKU / Product Code *</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => {
                      setSku(e.target.value);
                      setFieldErrors((p) => ({ ...p, sku: '' }));
                    }}
                    className="portal-input font-mono"
                  />
                  {fieldErrors.sku && <p className="text-[11px] text-[#DC4545] mt-1">{fieldErrors.sku}</p>}
                </div>
                <div>
                  <label className="portal-label">Pack / Unit *</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="e.g. 50 Kg Bag, 90m Coil, Piece"
                    className="portal-input"
                  />
                </div>
                <div>
                  <label className="portal-label">MRP (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    value={mrp}
                    onChange={(e) => {
                      setMrp(e.target.value);
                      setFieldErrors((p) => ({ ...p, mrp: '' }));
                    }}
                    className="portal-input"
                  />
                  {fieldErrors.mrp && <p className="text-[11px] text-[#DC4545] mt-1">{fieldErrors.mrp}</p>}
                </div>
                <div>
                  <label className="portal-label">
                    Selling Price (₹) *{' '}
                    {Number(mrp) > Number(price) && Number(price) > 0 && (
                      <span className="ml-2 text-emerald-700 font-bold">
                        ({Math.round(((Number(mrp) - Number(price)) / Number(mrp)) * 100)}% Discount)
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={price}
                    onChange={(e) => {
                      setPrice(e.target.value);
                      setFieldErrors((p) => ({ ...p, price: '' }));
                    }}
                    className="portal-input"
                  />
                  {fieldErrors.price && <p className="text-[11px] text-[#DC4545] mt-1">{fieldErrors.price}</p>}
                </div>
                <div>
                  <label className="portal-label">GST Rate (%) *</label>
                  <select
                    value={gstRate}
                    onChange={(e) => setGstRate(e.target.value)}
                    className="portal-input"
                  >
                    {(taxonomyState.gstSlabs || [0, 5, 12, 18, 28]).map((slab: number) => (
                      <option key={slab} value={String(slab)}>
                        {slab === 0 ? '0% (Exempt)' : `${slab}% GST`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="portal-label">Minimum Order Quantity (MOQ)</label>
                  <input
                    type="number"
                    min="1"
                    value={moq}
                    onChange={(e) => setMoq(e.target.value)}
                    className="portal-input"
                  />
                </div>
                <div>
                  <label className="portal-label">Available Stock (Units) *</label>
                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="portal-input"
                  />
                </div>
                <div>
                  <label className="portal-label">Low Stock Alert Threshold</label>
                  <input
                    type="number"
                    min="0"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(e.target.value)}
                    className="portal-input"
                  />
                </div>
                <div>
                  <label className="portal-label">Dispatch Warehouse</label>
                  <select
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                    className="portal-input"
                  >
                    {taxonomyState.warehouses.length === 0 ? (
                      <option value="WH-BLR-04">WH-BLR-04 Peenya Hub</option>
                    ) : (
                      taxonomyState.warehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({w.pincode})
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="portal-label">Delivery Availability</label>
                  <div className="flex items-center gap-4 pt-2 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={deliveryModes.includes('ASAP_60')}
                        onChange={(e) =>
                          setDeliveryModes((prev) =>
                            e.target.checked
                              ? Array.from(new Set([...prev, 'ASAP_60']))
                              : prev.filter((x) => x !== 'ASAP_60')
                          )
                        }
                      />
                      <span>60-Min Dispatch</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={deliveryModes.includes('STANDARD')}
                        onChange={(e) =>
                          setDeliveryModes((prev) =>
                            e.target.checked
                              ? Array.from(new Set([...prev, 'STANDARD']))
                              : prev.filter((x) => x !== 'STANDARD')
                          )
                        }
                      />
                      <span>Standard Delivery</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F8F7F5] border border-[#E7E5E4] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 font-semibold text-[#292524] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableBulkPricing}
                      onChange={(e) => setEnableBulkPricing(e.target.checked)}
                    />
                    <span>Enable B2B Bulk Pricing Tiers</span>
                  </label>
                  <span className="text-[11px] text-[#78716C]">
                    Promotional New Launches curation is managed by Company Admin after approval.
                  </span>
                </div>
                {enableBulkPricing && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="portal-label">10+ Units Discount (%)</label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={bulkTier10Discount}
                        onChange={(e) => setBulkTier10Discount(e.target.value)}
                        className="portal-input py-1.5"
                      />
                    </div>
                    <div>
                      <label className="portal-label">50+ Units Discount (%)</label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={bulkTier50Discount}
                        onChange={(e) => setBulkTier50Discount(e.target.value)}
                        className="portal-input py-1.5"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & SUBMIT */}
          {wizardStep === 4 && (
            <div className="space-y-4 text-xs">
              {editingProduct && (
                <div className="p-3 rounded-xl bg-[#F8F7F5] border border-[#E7E5E4] flex items-center justify-between">
                  <span className="font-semibold text-[#292524]">Current Submission Status</span>
                  <Badge
                    variant={
                      editingProduct.approvalStatus === 'APPROVED'
                        ? 'success'
                        : editingProduct.approvalStatus === 'REJECTED'
                        ? 'danger'
                        : 'warning'
                    }
                  >
                    {editingProduct.approvalStatus || 'PENDING_APPROVAL'}
                  </Badge>
                </div>
              )}

              <div className="p-4 rounded-xl border border-[#E7E5E4] bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#943D24] uppercase tracking-wider">1. Category Selection</h4>
                  <button type="button" onClick={() => setWizardStep(1)} className="text-[#943D24] font-semibold hover:underline">
                    Edit
                  </button>
                </div>
                <p className="text-[#292524]">
                  {selectedMainCatNode?.name} &rarr; <strong>{selectedChildCatNode?.name}</strong>
                  {selectedProductTypeNode ? ` → ${selectedProductTypeNode.name}` : ''}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-[#E7E5E4] bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#943D24] uppercase tracking-wider">2. Product Information & Specs</h4>
                  <button type="button" onClick={() => setWizardStep(2)} className="text-[#943D24] font-semibold hover:underline">
                    Edit
                  </button>
                </div>
                <p className="font-bold text-sm text-[#292524]">{name || '—'}</p>
                <p className="text-[#78716C]">Brand: {brand || '—'}</p>
                {activeCategoryFields.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E7E5E4]">
                    {activeCategoryFields.map((f) => {
                      const v = categoryAttributes[f.fieldKey];
                      const disp = Array.isArray(v)
                        ? v.join(', ')
                        : typeof v === 'boolean'
                        ? v
                          ? 'Yes'
                          : 'No'
                        : v || '—';
                      return (
                        <div key={f.id}>
                          <span className="text-[#78716C]">{f.label}: </span>
                          <span className="font-semibold text-[#292524]">{disp}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl border border-[#E7E5E4] bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#943D24] uppercase tracking-wider">3. Pricing & Inventory</h4>
                  <button type="button" onClick={() => setWizardStep(3)} className="text-[#943D24] font-semibold hover:underline">
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[#292524]">
                  <div>SKU: <strong className="font-mono">{sku}</strong></div>
                  <div>Selling Price: <strong>₹{price || 0}</strong></div>
                  <div>MRP: <strong>₹{mrp || 0}</strong></div>
                  <div>GST Rate: <strong>{gstRate}%</strong></div>
                  <div>Unit / MOQ: <strong>{unit} (Min {moq})</strong></div>
                  <div>Stock: <strong>{stock} units</strong></div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Navigation Controls */}
          <div className="pt-3 flex items-center justify-between gap-3 border-t border-[#E7E5E4]">
            <div>
              {wizardStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setWizardStep((s) => Math.max(1, s - 1) as 1 | 2 | 3 | 4)}
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                >
                  Back
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              {wizardStep < 4 ? (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    if (wizardStep === 2) {
                      const errs = validateDynamicFieldsClient();
                      if (!name.trim()) errs.name = 'Product Name is required.';
                      if (!brand.trim()) errs.brand = 'Brand is required.';
                      if (Object.keys(errs).length > 0) {
                        setFieldErrors(errs);
                        setFormError(Object.values(errs)[0]);
                        return;
                      }
                      setFieldErrors({});
                      setFormError(null);
                    }
                    if (wizardStep === 3) {
                      const errs: Record<string, string> = {};
                      if (!sku.trim()) errs.sku = 'SKU is required.';
                      if (!(Number(mrp) > 0)) errs.mrp = 'MRP must be greater than 0.';
                      if (!(Number(price) > 0)) errs.price = 'Selling Price must be greater than 0.';
                      if (Number(price) > Number(mrp)) errs.price = 'Selling Price cannot exceed MRP.';
                      if (Object.keys(errs).length > 0) {
                        setFieldErrors(errs);
                        setFormError(Object.values(errs)[0]);
                        return;
                      }
                      setFieldErrors({});
                      setFormError(null);
                    }
                    setWizardStep((s) => Math.min(4, s + 1) as 1 | 2 | 3 | 4);
                  }}
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  Next Step
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    isLoading={isSaving || isLoading}
                    onClick={() => submitWizardProduct(true)}
                  >
                    Save as Draft
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    isLoading={isSaving || isLoading}
                    leftIcon={<CheckCircle2 className="w-4 h-4" />}
                    onClick={() => submitWizardProduct(false)}
                  >
                    {editingProduct ? 'Save & Submit Update' : 'Submit for Approval'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteTarget?.name}" (${deleteTarget?.sku}) from your catalog?`}
        confirmLabel="Delete Product"
      />
    </div>
  );
};
