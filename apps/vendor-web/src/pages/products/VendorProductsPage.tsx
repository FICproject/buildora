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
import { VendorProduct, AttributeSelectorType } from '@buildora/types';
import {
  MASTER_CATEGORIES,
  MAIN_CATEGORIES_SEED,
  CHILD_CATEGORIES_SEED,
  PRODUCT_TYPES_SEED,
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
  const [taxonomyState, setTaxonomyState] = useState<{
    mainCategories: any[];
    childCategories: any[];
    productTypes: any[];
  }>({
    mainCategories: MAIN_CATEGORIES_SEED,
    childCategories: CHILD_CATEGORIES_SEED,
    productTypes: PRODUCT_TYPES_SEED,
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
  const [gstRate, setGstRate] = useState('18');
  const [mrp, setMrp] = useState('420');
  const [price, setPrice] = useState('380');
  const [stock, setStock] = useState('250');
  const [lowStockThreshold, setLowStockThreshold] = useState('40');
  const [productStatus, setProductStatus] = useState<'ACTIVE' | 'DRAFT' | 'OUT_OF_STOCK'>('ACTIVE');
  const [inStock, setInStock] = useState(true);
  const [imageUrlsText, setImageUrlsText] = useState('');
  const [description, setDescription] = useState('');
  const [productType, setProductType] = useState('');
  const [size, setSize] = useState('');
  const [isNewLaunch, setIsNewLaunch] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Variants
  const [hasVariants, setHasVariants] = useState(false);
  const [formAttributes, setFormAttributes] = useState<FormAttribute[]>([
    { id: 'attr-1', name: 'Size', uiType: 'cards', optionsStr: 'M6, M8' },
  ]);
  const [formVariants, setFormVariants] = useState<FormVariant[]>([]);

  useEffect(() => {
    fetchProducts();
    vendorApi.getTaxonomy().then((res) => {
      if (
        res &&
        Array.isArray(res.mainCategories) &&
        res.mainCategories.length > 0 &&
        Array.isArray(res.childCategories) &&
        res.childCategories.length > 0
      ) {
        setTaxonomyState({
          mainCategories: res.mainCategories.filter((m: any) => m.isActive !== false),
          childCategories: res.childCategories.filter((c: any) => c.isActive !== false),
          productTypes: (res.productTypes || PRODUCT_TYPES_SEED).filter((pt: any) => pt.isActive !== false),
        });
      }
    }).catch(() => {});
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
    () => taxonomyState.mainCategories.length > 0 ? taxonomyState.mainCategories : MAIN_CATEGORIES_SEED,
    [taxonomyState.mainCategories]
  );

  const selectedMainCatNode = useMemo(
    () =>
      availableMainCategories.find((m) => m.id === mainCategoryId) ||
      availableMainCategories[0],
    [availableMainCategories, mainCategoryId]
  );

  const availableChildCategories = useMemo(() => {
    const source = taxonomyState.childCategories.length > 0 ? taxonomyState.childCategories : CHILD_CATEGORIES_SEED;
    return source.filter((c) => c.mainCategoryId === selectedMainCatNode?.id);
  }, [taxonomyState.childCategories, selectedMainCatNode]);

  const selectedChildCatNode = useMemo(
    () =>
      availableChildCategories.find((c) => c.id === childCategoryId) ||
      availableChildCategories[0],
    [availableChildCategories, childCategoryId]
  );

  const availableProductTypes = useMemo(() => {
    const source = taxonomyState.productTypes.length > 0 ? taxonomyState.productTypes : PRODUCT_TYPES_SEED;
    return source.filter((pt) => pt.childCategoryId === selectedChildCatNode?.id);
  }, [taxonomyState.productTypes, selectedChildCatNode]);

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

  const openAddModal = () => {
    setEditingProduct(null);
    setFormError(null);
    setName('');
    setSku(`SKU-BLR-${Math.floor(1000 + Math.random() * 9000)}`);
    const defaultMain = availableMainCategories[0] || MAIN_CATEGORIES_SEED[0];
    const defaultChild =
      taxonomyState.childCategories.find((c) => c.mainCategoryId === defaultMain?.id) ||
      CHILD_CATEGORIES_SEED[0];
    const defaultType =
      taxonomyState.productTypes.find((pt) => pt.childCategoryId === defaultChild?.id) ||
      PRODUCT_TYPES_SEED[0];
    setMainCategoryId(defaultMain?.id || 'mc-1');
    setChildCategoryId(defaultChild?.id || 'cat-1');
    setProductTypeId(defaultType?.id || 'sub-1-1');
    setCategory(defaultChild?.name || 'Cement & Concrete');
    setSubCategory(defaultType?.name || 'OPC 53 Grade Cement');
    setBrand('');
    setUnit('50 Kg Bag');
    setGstRate('18');
    setMrp('');
    setPrice('');
    setStock('100');
    setLowStockThreshold('30');
    setProductStatus('ACTIVE');
    setInStock(true);
    setImageUrlsText('');
    setDescription('');
    setProductType('');
    setSize('');
    setIsNewLaunch(false);
    setHasVariants(false);
    setFormAttributes([
      { id: 'attr-1', name: 'Size', uiType: 'cards', optionsStr: 'Standard', required: true },
    ]);
    setFormVariants([]);
    setIsModalOpen(true);
  };

  const openEditModal = (p: VendorProduct) => {
    setEditingProduct(p);
    setFormError(null);
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
    setGstRate(String(p.gstRate ?? 18));
    setMrp(String(p.mrp ?? 0));
    setPrice(String(p.price ?? 0));
    setStock(String(resolvedStock));
    setLowStockThreshold(String(p.lowStockThreshold ?? 30));
    setProductStatus(p.status || (resolvedStock > 0 ? 'ACTIVE' : 'OUT_OF_STOCK'));
    setInStock(p.inStock !== false && resolvedStock > 0);
    setImageUrlsText((p.images || []).join('\n'));
    setDescription(p.description || '');
    setProductType(
      (p as any).productType || p.specifications?.['Product Type'] || p.specifications?.['Type'] || ''
    );
    setSize((p as any).size || p.specifications?.['Size'] || p.packSize || p.unit || '');
    setIsNewLaunch(Boolean(p.isNewLaunch));

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

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    const mrpNum = Number(mrp);
    const priceNum = Number(price);
    const stockNum = Number(stock);

    if (!name.trim() || !sku.trim() || !brand.trim()) {
      setFormError('Please fill in Product Title, SKU, and Brand.');
      return;
    }
    if (priceNum <= 0 || mrpNum <= 0) {
      setFormError('MRP and Selling Price must be greater than 0.');
      return;
    }
    if (priceNum > mrpNum) {
      setFormError('Selling Price cannot exceed MRP.');
      return;
    }

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

      const resolvedStatus =
        stockNum === 0 ? 'OUT_OF_STOCK' : productStatus;
      const resolvedMain = selectedMainCatNode;
      const resolvedChild = selectedChildCatNode;
      const resolvedType = selectedProductTypeNode;
      const fallbackHierarchy = resolveCanonicalCategoryHierarchy(
        resolvedChild?.name || category,
        resolvedType?.name || subCategory
      );
      const canonicalChild = resolvedChild || fallbackHierarchy.matchedMain || MASTER_CATEGORIES[0];
      const canonicalType = resolvedType || fallbackHierarchy.matchedChild || MASTER_CATEGORIES[0].subcategories[0];

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
        isActive: resolvedStatus === 'ACTIVE',
        isNewLaunch,
        productType,
        size,
        specifications: {
          ...(editingProduct?.specifications || {}),
          'Product Type': productType || 'Material',
          Size: size || unit,
          Packaging: unit,
        },
        bulkPricing: editingProduct?.bulkPricing || [
          { minQuantity: 10, discountPercentage: 5, unitPrice: Math.round(priceNum * 0.95) },
          { minQuantity: 50, discountPercentage: 8, unitPrice: Math.round(priceNum * 0.92) },
        ],
        warehouseLocation: editingProduct?.warehouseLocation || 'WH-BLR-04 Peenya Hub',
        attributes: finalAttributes,
        variants: finalVariants,
      };

      if (editingProduct) {
        const ok = await updateProduct(editingProduct.id, productData as any);
        if (ok && finalVariants && finalVariants.length > 0) {
          await vendorApi.updateProductVariants(editingProduct.id, finalVariants, finalAttributes);
        }
        if (ok) toast.success('Product updated successfully.');
      } else {
        const ok = await addProduct(productData as any);
        if (ok) toast.success('New product added to catalog.');
      }
      setIsModalOpen(false);
    } finally {
      setIsSaving(false);
    }
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

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        subtitle="Organize product identity, GST pricing, inventory, and optional variants."
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveProduct} className="space-y-6">
          {formError && (
            <div className="p-3 rounded-lg bg-[#DC4545]/10 border border-[#DC4545]/20 text-[#DC4545] text-xs font-medium">
              {formError}
            </div>
          )}

          {/* Section 1: Basic Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#78716C]">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="portal-label">Product Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. UltraTech Super Cement OPC 53 Grade (50 Kg Bag)"
                  className="portal-input"
                />
              </div>
              <div>
                <label className="portal-label">SKU *</label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  required
                  className="portal-input font-mono"
                />
              </div>
              <div>
                <label className="portal-label">Brand *</label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  required
                  placeholder="e.g. UltraTech, Havells, Astral"
                  className="portal-input"
                />
              </div>
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
                <label className="portal-label">Product Type / Subcategory *</label>
                <select
                  value={selectedProductTypeNode?.id || productTypeId}
                  onChange={(e) => {
                    const nextTypeId = e.target.value;
                    const nextType = availableProductTypes.find((pt) => pt.id === nextTypeId);
                    setProductTypeId(nextTypeId);
                    setSubCategory(nextType?.name || '');
                  }}
                  className="portal-input"
                  required
                >
                  {availableProductTypes.map((pt) => (
                    <option key={pt.id} value={pt.id}>
                      {pt.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Pricing, GST & Availability */}
          <div className="space-y-3 pt-4 border-t border-[#E7E5E4]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#78716C]">
              Pricing, GST & Availability
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="portal-label">MRP (₹) *</label>
                <input
                  type="number"
                  min="1"
                  value={mrp}
                  onChange={(e) => setMrp(e.target.value)}
                  required
                  className="portal-input"
                />
              </div>
              <div>
                <label className="portal-label">Selling Price (₹) *</label>
                <input
                  type="number"
                  min="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  className="portal-input"
                />
              </div>
              <div>
                <label className="portal-label">GST Rate (%) *</label>
                <select
                  value={gstRate}
                  onChange={(e) => setGstRate(e.target.value)}
                  className="portal-input"
                >
                  <option value="0">0% (Exempt)</option>
                  <option value="5">5% GST</option>
                  <option value="12">12% GST</option>
                  <option value="18">18% GST</option>
                  <option value="28">28% GST</option>
                </select>
              </div>
              <div>
                <label className="portal-label">Unit / Pack Size *</label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  required
                  placeholder="e.g. 50 Kg Bag, 90m Coil"
                  className="portal-input"
                />
              </div>
              <div>
                <label className="portal-label">Product Status</label>
                <select
                  value={productStatus}
                  onChange={(e) => setProductStatus(e.target.value as any)}
                  className="portal-input"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="DRAFT">Draft</option>
                  <option value="OUT_OF_STOCK">Out of Stock</option>
                </select>
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-xs font-medium text-[#292524] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStock}
                    onChange={(e) => setInStock(e.target.checked)}
                    className="w-4 h-4 rounded text-[#943D24]"
                  />
                  <span>Available for ordering (In Stock)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Section 3: Stock & Specifications */}
          <div className="space-y-3 pt-4 border-t border-[#E7E5E4]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#78716C]">
              Stock & Specifications
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="portal-label">Available Stock (Units) *</label>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  required
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
                <label className="portal-label">Product Type</label>
                <input
                  type="text"
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  placeholder="e.g. Rotary Hammer, PPC Cement"
                  className="portal-input"
                />
              </div>
              <div>
                <label className="portal-label">Specification Size</label>
                <input
                  type="text"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  placeholder="e.g. 18 Inch, 25 Litres"
                  className="portal-input"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Images & Description */}
          <div className="space-y-3 pt-4 border-t border-[#E7E5E4]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#78716C]">
              Images & Description
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="portal-label">Product Image URLs (one per line)</label>
                <textarea
                  rows={2}
                  value={imageUrlsText}
                  onChange={(e) => setImageUrlsText(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="portal-input"
                />
                {imageUrlsText.trim() && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {imageUrlsText
                      .split(/[\n,]/)
                      .map((u) => u.trim())
                      .filter(Boolean)
                      .slice(0, 4)
                      .map((url, idx) => (
                        <div
                          key={idx}
                          className="w-14 h-14 rounded-lg border border-[#E7E5E4] overflow-hidden bg-[#F8F7F5] flex items-center justify-center"
                        >
                          <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                  </div>
                )}
              </div>
              <div>
                <label className="portal-label">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Key material specifications and usage details..."
                  className="portal-input"
                />
              </div>
              <label className="flex items-center gap-2 text-xs font-medium text-[#292524] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isNewLaunch}
                  onChange={(e) => setIsNewLaunch(e.target.checked)}
                  className="w-4 h-4 rounded text-[#943D24]"
                />
                <span>Feature this product in New Launches</span>
              </label>
            </div>
          </div>

          {/* Section 5: Variants & Configurable Options */}
          <div className="p-4 rounded-xl border border-[#E7E5E4] bg-[#F8F7F5] space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="text-xs font-semibold text-[#292524] flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-[#943D24]" />
                  <span>Product Variants</span>
                </div>
                <p className="text-[11px] text-[#78716C]">
                  Optional size, thickness, or colour options with separate SKUs and pricing.
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
                        Suggested Option Templates for {category}:
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
                    <div
                      key={attr.id}
                      className="p-3 bg-white rounded-lg border border-[#E7E5E4] space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#292524]">
                          Group {idx + 1}
                        </span>
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
                        <div>
                          <label className="block text-[11px] font-medium text-[#78716C] mb-1">
                            Option Name
                          </label>
                          <input
                            type="text"
                            value={attr.name}
                            onChange={(e) => handleOptionGroupChange(idx, 'name', e.target.value)}
                            className="portal-input py-1.5 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-[#78716C] mb-1">
                            Display Type
                          </label>
                          <select
                            value={attr.uiType}
                            onChange={(e) =>
                              handleOptionGroupChange(
                                idx,
                                'uiType',
                                e.target.value as AttributeSelectorType
                              )
                            }
                            className="portal-input py-1.5 text-xs"
                          >
                            <option value="cards">Cards</option>
                            <option value="pills">Pills</option>
                            <option value="dropdown">Dropdown</option>
                            <option value="color_swatches">Colour Swatches</option>
                            <option value="radio">Radio</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-[#78716C] mb-1">
                            Values (comma separated)
                          </label>
                          <input
                            type="text"
                            value={attr.optionsStr}
                            onChange={(e) =>
                              handleOptionGroupChange(idx, 'optionsStr', e.target.value)
                            }
                            className="portal-input py-1.5 text-xs"
                          />
                        </div>
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
                  <div className="overflow-x-auto max-h-64 rounded-lg border border-[#E7E5E4] bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F8F7F5] text-[#78716C] font-semibold border-b border-[#E7E5E4] sticky top-0">
                        <tr>
                          <th className="p-2.5">Variant</th>
                          <th className="p-2.5">SKU</th>
                          <th className="p-2.5">Price (₹)</th>
                          <th className="p-2.5">MRP (₹)</th>
                          <th className="p-2.5">Stock</th>
                          <th className="p-2.5 text-center">Available</th>
                          <th className="p-2.5 text-center">In Stock</th>
                          <th className="p-2.5 text-center">Remove</th>
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
                                className="w-32 px-2 py-1 border border-[#E7E5E4] rounded text-xs"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={v.sku}
                                onChange={(e) => handleVariantChange(vIdx, 'sku', e.target.value)}
                                className="w-28 px-2 py-1 border border-[#E7E5E4] rounded text-xs font-mono"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                value={v.price}
                                onChange={(e) =>
                                  handleVariantChange(vIdx, 'price', Number(e.target.value))
                                }
                                className="w-20 px-2 py-1 border border-[#E7E5E4] rounded text-xs"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                value={v.mrp}
                                onChange={(e) =>
                                  handleVariantChange(vIdx, 'mrp', Number(e.target.value))
                                }
                                className="w-20 px-2 py-1 border border-[#E7E5E4] rounded text-xs"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                value={v.stock}
                                onChange={(e) =>
                                  handleVariantChange(vIdx, 'stock', Number(e.target.value))
                                }
                                className="w-16 px-2 py-1 border border-[#E7E5E4] rounded text-xs"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <input
                                type="checkbox"
                                checked={v.isAvailable !== false}
                                onChange={(e) =>
                                  handleVariantChange(vIdx, 'isAvailable', e.target.checked)
                                }
                              />
                            </td>
                            <td className="p-2 text-center">
                              <input
                                type="checkbox"
                                checked={v.inStock}
                                onChange={(e) =>
                                  handleVariantChange(vIdx, 'inStock', e.target.checked)
                                }
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

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#E7E5E4]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSaving || isLoading}>
              {editingProduct ? 'Save Changes' : 'Add Product'}
            </Button>
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
