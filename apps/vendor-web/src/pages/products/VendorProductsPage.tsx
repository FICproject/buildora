import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Layers,
  CheckCircle,
  AlertCircle,
  Eye,
  Boxes,
  Sliders,
  Sparkles,
  RefreshCw,
  X
} from 'lucide-react';
import { useVendorProductStore } from '../../store/useVendorProductStore';
import { Card, CardHeader, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { VendorProduct, AttributeSelectorType } from '@buildora/types';
import { getAttributeTemplatesForCategory } from '@buildora/constants';
import { vendorApi } from '../../services/vendorApi';

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

export const VendorProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    products,
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    isLoading,
  } = useVendorProductStore();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<VendorProduct | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Cement & Concrete');
  const [subCategory, setSubCategory] = useState('OPC 53 Grade Cement');
  const [brand, setBrand] = useState('UltraTech Cement');
  const [unit, setUnit] = useState('50 Kg Bag');
  const [mrp, setMrp] = useState('420');
  const [price, setPrice] = useState('380');
  const [stock, setStock] = useState('250');
  const [lowStockThreshold, setLowStockThreshold] = useState('40');
  const [description, setDescription] = useState('');
  const [productType, setProductType] = useState('');
  const [size, setSize] = useState('');
  const [isNewLaunch, setIsNewLaunch] = useState(false);

  // Attribute & Variant configuration states (Phase 7)
  const [hasVariants, setHasVariants] = useState(false);
  const [formAttributes, setFormAttributes] = useState<FormAttribute[]>([
    { id: 'attr-1', name: 'Size', uiType: 'cards', optionsStr: 'M6, M8' }
  ]);
  const [formVariants, setFormVariants] = useState<FormVariant[]>([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setSku(`SKU-BLR-${Math.floor(1000 + Math.random() * 9000)}`);
    setCategory('Cement & Concrete');
    setSubCategory('OPC 53 Grade Cement');
    setBrand('UltraTech Cement');
    setUnit('50 Kg Bag');
    setMrp('420');
    setPrice('380');
    setStock('250');
    setLowStockThreshold('40');
    setDescription('High-strength grade cement manufactured directly at tier-1 plants for structural RCC work.');
    setProductType('');
    setSize('50 Kg Bag');
    setIsNewLaunch(false);
    setHasVariants(false);
    setFormAttributes([
      { id: 'attr-1', name: 'Size', uiType: 'cards', optionsStr: 'Standard', required: true }
    ]);
    setFormVariants([]);
    setIsModalOpen(true);
  };

  const openEditModal = (p: VendorProduct) => {
    setEditingProduct(p);
    setName(p.name);
    setSku(p.sku);
    setCategory(p.category);
    setSubCategory(p.subCategory || '');
    setBrand(p.brand);
    setUnit(p.unit);
    setMrp(p.mrp.toString());
    setPrice(p.price.toString());
    setStock(p.stock.toString());
    setLowStockThreshold((p.lowStockThreshold || 30).toString());
    setDescription(p.description || '');
    setProductType((p as any).productType || p.specifications?.['Product Type'] || p.specifications?.['Type'] || '');
    setSize((p as any).size || p.specifications?.['Size'] || p.packSize || p.unit || '');
    setIsNewLaunch(Boolean(p.isNewLaunch));

    const hasV = Boolean((p.variants && p.variants.length > 1) || (p.attributes && p.attributes.length > 0));
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
          required: a.required ?? true
        }))
      );
    } else {
      setFormAttributes([{ id: 'attr-1', name: 'Size', uiType: 'cards', optionsStr: 'Standard', required: true }]);
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
          image: v.image
        }))
      );
    } else {
      setFormVariants([]);
    }

    setIsModalOpen(true);
  };

  const handleAddOptionGroup = () => {
    const newId = `attr-${Date.now()}`;
    setFormAttributes([
      ...formAttributes,
      { id: newId, name: `Option ${formAttributes.length + 1}`, uiType: 'cards', optionsStr: 'Option A, Option B', required: true }
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
    const newAttr: FormAttribute = {
      id: `attr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: tpl.name,
      uiType: tpl.suggestedUiType || 'cards',
      optionsStr: (tpl.suggestedOptions || []).join(', '),
      required: true
    };
    setFormAttributes([...formAttributes, newAttr]);
  };

  const handleGenerateVariantMatrix = () => {
    const activeAttrs = formAttributes
      .map((a) => ({
        name: a.name.trim(),
        options: a.optionsStr.split(',').map((s) => s.trim()).filter(Boolean)
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
        return {
          ...existing,
          name: comboName,
          attributes: c
        };
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
        isAvailable: true
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
        isAvailable: true
      }
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

    const finalAttributes = hasVariants
      ? formAttributes.map((a) => ({
          id: a.id,
          name: a.name.trim(),
          uiType: a.uiType,
          options: a.optionsStr
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          required: a.required ?? true
        })).filter((a) => a.name && a.options.length > 0)
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
            image: v.image
          }))
        : undefined;

    const productData = {
      name,
      sku,
      category,
      subCategory,
      brand,
      unit,
      mrp: Number(mrp),
      price: Number(price),
      stock: Number(stock),
      lowStockThreshold: Number(lowStockThreshold),
      description,
      status: Number(stock) > 0 ? ('ACTIVE' as const) : ('OUT_OF_STOCK' as const),
      isNewLaunch,
      productType,
      size,
      specifications: {
        ...(editingProduct?.specifications || {}),
        'Product Type': productType || 'Material',
        'Type': productType || 'Material',
        'Size': size || unit,
        'Packaging': unit,
        'Origin': 'Bengaluru Depot'
      },
      bulkPricing: editingProduct?.bulkPricing || [
        { minQuantity: 10, discountPercentage: 5, unitPrice: Math.round(Number(price) * 0.95) },
        { minQuantity: 50, discountPercentage: 8, unitPrice: Math.round(Number(price) * 0.92) },
      ],
      warehouseLocation: 'WH-BLR-04 Peenya Hub',
      attributes: finalAttributes,
      variants: finalVariants
    };

    if (editingProduct) {
      await updateProduct(editingProduct.id, productData as any);
      if (finalVariants && finalVariants.length > 0) {
        await vendorApi.updateProductVariants(editingProduct.id, finalVariants, finalAttributes);
      }
    } else {
      await addProduct(productData as any);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this product from your vendor catalog?')) {
      await deleteProduct(id);
    }
  };

  // Filtered list
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchesStatus = selectedStatus === 'ALL' || p.status === selectedStatus;
    return matchesSearch && matchesCat && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Products & Material Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your SKU catalog, live pricing, specifications, and inventory availability.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/bulk-pricing')}
            leftIcon={<Layers className="w-4 h-4" />}
          >
            Manage Bulk Tiers
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={openAddModal}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add New Product
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products by title, SKU, brand..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Categories</option>
                <option value="Cement & Concrete">Cement & Concrete</option>
                <option value="Steel & Structural Metals">Steel & Structural Metals</option>
                <option value="Electrical Wires & MCBs">Electrical Wires & MCBs</option>
                <option value="Plumbing & Sanitary">Plumbing & Sanitary</option>
                <option value="Hardware & Locks">Hardware & Locks</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3 px-4">SKU & Brand</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Unit Pricing</th>
                <th className="py-3 px-4">Bulk Tiers</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No products found matching your search.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const hasBulk = p.bulkPricing && p.bulkPricing.length > 0;
                  const stockNum = p.stockCount !== undefined ? p.stockCount : p.stock || 0;
                  const isLow = stockNum <= (p.lowStockThreshold || 30);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                            <Package className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-semibold text-slate-900 line-clamp-1">{p.name}</p>
                              {p.isNewLaunch && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                  New Launch
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400">Unit: {p.unit}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-mono text-slate-700">{p.sku}</div>
                        <div className="text-[11px] text-slate-500 font-medium">{p.brand}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-800">{p.category}</span>
                        {p.subCategory && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                            {p.subCategory}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">₹{p.price.toLocaleString('en-IN')}</div>
                        {p.mrp > p.price && (
                          <div className="text-[10px] text-slate-400 line-through">
                            ₹{p.mrp.toLocaleString('en-IN')}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {hasBulk ? (
                          <button
                            onClick={() => navigate('/bulk-pricing')}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 hover:bg-blue-100 transition-colors"
                          >
                            <Layers className="w-3 h-3 text-blue-600" />
                            {p.bulkPricing!.length} Tiers
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate('/bulk-pricing')}
                            className="text-[11px] text-slate-400 hover:text-blue-600 underline"
                          >
                            + Add Tiers
                          </button>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div
                          className={`font-semibold ${
                            stockNum === 0
                              ? 'text-rose-600'
                              : isLow
                              ? 'text-amber-600'
                              : 'text-slate-800'
                          }`}
                        >
                          {stockNum} units
                        </div>
                        {isLow && stockNum > 0 && (
                          <span className="text-[10px] text-amber-600 font-medium">Low Stock</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            p.status === 'ACTIVE'
                              ? 'success'
                              : p.status === 'OUT_OF_STOCK'
                              ? 'danger'
                              : 'neutral'
                          }
                        >
                          {p.status}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(p.id, e)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                            title="Delete Product"
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
      </Card>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Edit Product & Pricing' : 'Add New Material SKU'}
        subtitle="Ensure specifications and bulk tier prices conform to HomeRun customer website parity."
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Product Title *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. UltraTech Super Cement OPC 53 Grade (50 Kg Bag)"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                SKU Identifier *
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Manufacturer / Brand *
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                required
                placeholder="e.g. UltraTech, Havells, Astral"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Master Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Cement & Concrete">Cement & Concrete</option>
                <option value="Steel & Structural Metals">Steel & Structural Metals</option>
                <option value="Electrical Wires & MCBs">Electrical Wires & MCBs</option>
                <option value="Plumbing & Sanitary">Plumbing & Sanitary</option>
                <option value="Hardware & Locks">Hardware & Locks</option>
                <option value="Paints & Primers">Paints & Primers</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pack Size / Unit *
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                required
                placeholder="e.g. 50 Kg Bag, 12m Rod, 90m Coil"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Maximum Retail Price (MRP ₹) *
              </label>
              <input
                type="number"
                value={mrp}
                onChange={(e) => setMrp(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Selling Price (Incl. GST ₹) *
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Available Physical Stock (Units) *
              </label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Low Stock Threshold (Alert)
              </label>
              <input
                type="number"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Product Type (Catalog Filter)
              </label>
              <input
                type="text"
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                placeholder="e.g. Rotary Hammer, Concealed Cistern, Ball Bearing Slide"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Specification Size (Catalog Filter)
              </label>
              <input
                type="text"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="e.g. 18 Inch (450mm), 25 Litres, 25mm"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2 p-3 bg-amber-50/70 rounded-xl border border-amber-200">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isNewLaunch}
                  onChange={(e) => setIsNewLaunch(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900">
                    Feature in New Launches
                  </span>
                  <p className="text-[11px] text-slate-500">
                    When enabled, this material appears immediately in the customer New Launches collection with Brand, Type, Price, and Size filtering.
                  </p>
                </div>
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Product Description & Highlights
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Dedicated Product Variants & Options Configuration Engine (Phases 3 & 4) */}
            <div className="md:col-span-2 p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-blue-600" />
                    <span>Product Variants & Configurable Options</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Configure option groups (Thickness, Size, Colour, Finish, Model) with custom display selectors and price matrix.
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs select-none">
                  <input
                    type="checkbox"
                    checked={hasVariants}
                    onChange={(e) => setHasVariants(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span>Enable Product Options / Variants</span>
                </label>
              </div>

              {hasVariants && (
                <div className="space-y-4 pt-3 border-t border-slate-200">
                  {/* Category Template Suggestions */}
                  {(() => {
                    const templates = getAttributeTemplatesForCategory(category);
                    if (templates.length === 0) return null;
                    return (
                      <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200/80 space-y-1.5">
                        <div className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                          <span>Suggested Option Templates for {category}:</span>
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
                                className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                                  isAdded
                                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                    : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-100 cursor-pointer shadow-2xs'
                                }`}
                              >
                                + {tpl.name} ({tpl.suggestedUiType})
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Option Groups Builder */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Configured Option Groups ({formAttributes.length})
                      </span>
                      <button
                        type="button"
                        onClick={handleAddOptionGroup}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Option Group
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {formAttributes.map((attr, idx) => (
                        <div
                          key={attr.id}
                          className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-800">
                              Option Group {idx + 1}
                            </span>
                            {formAttributes.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveOptionGroup(attr.id)}
                                className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Remove Option Group"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
                            <div className="md:col-span-4">
                              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                                Option Group Name *
                              </label>
                              <input
                                type="text"
                                value={attr.name}
                                onChange={(e) => handleOptionGroupChange(idx, 'name', e.target.value)}
                                placeholder="e.g. Thickness, Size, Colour"
                                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                              />
                            </div>

                            <div className="md:col-span-3">
                              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                                Customer Display Style *
                              </label>
                              <select
                                value={attr.uiType}
                                onChange={(e) =>
                                  handleOptionGroupChange(idx, 'uiType', e.target.value as AttributeSelectorType)
                                }
                                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                              >
                                <option value="cards">Cards with Price (e.g. Size, Pack)</option>
                                <option value="pills">Pill Buttons (e.g. Thickness, Finish)</option>
                                <option value="dropdown">Dropdown Selector (e.g. Modules)</option>
                                <option value="color_swatches">Colour Swatches (e.g. Paint)</option>
                                <option value="radio">Radio Buttons</option>
                              </select>
                            </div>

                            <div className="md:col-span-5">
                              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                                Option Values (Comma Separated) *
                              </label>
                              <input
                                type="text"
                                value={attr.optionsStr}
                                onChange={(e) => handleOptionGroupChange(idx, 'optionsStr', e.target.value)}
                                placeholder="e.g. 6mm, 8mm, 12mm, 16mm, 18mm"
                                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-1 flex items-center justify-between flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleGenerateVariantMatrix}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3.5 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Generate / Sync Variant Combinations Matrix
                      </button>
                      <span className="text-[11px] text-slate-500">
                        Generates combination rows while preserving customized prices and stock.
                      </span>
                    </div>
                  </div>

                  {/* Variant Matrix Table */}
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                          Variant Combination Matrix ({formVariants.length} Combinations)
                        </span>
                        <p className="text-[10px] text-slate-500">
                          Configure price, MRP, stock, and toggle "Available" to disable unsupported combinations (e.g. 25mm in 7' X 4').
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddVariantRow}
                        className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Custom Variant
                      </button>
                    </div>

                    {formVariants.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-300 space-y-2">
                        <Package className="w-8 h-8 mx-auto text-slate-300" />
                        <div>
                          Click <strong>"Generate / Sync Variant Combinations Matrix"</strong> above to auto-create variant rows from your configured option groups.
                        </div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto max-h-80 overflow-y-auto rounded-xl border border-slate-200">
                        <table className="w-full text-left text-xs bg-white">
                          <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200 sticky top-0 z-10">
                            <tr>
                              <th className="p-2.5">Combination</th>
                              <th className="p-2.5">SKU</th>
                              <th className="p-2.5">Selling Price (₹)</th>
                              <th className="p-2.5">MRP (₹)</th>
                              <th className="p-2.5">Stock</th>
                              <th className="p-2.5 text-center" title="If unchecked, combination is marked Unavailable on Customer PDP">
                                Available?
                              </th>
                              <th className="p-2.5 text-center">In Stock?</th>
                              <th className="p-2.5 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {formVariants.map((v, vIdx) => {
                              const isAvail = v.isAvailable !== false;
                              return (
                                <tr
                                  key={v.id || vIdx}
                                  className={`hover:bg-slate-50/80 transition-colors ${
                                    !isAvail ? 'bg-slate-50/50 opacity-60' : ''
                                  }`}
                                >
                                  <td className="p-2 font-semibold text-slate-800">
                                    <input
                                      type="text"
                                      value={v.name}
                                      onChange={(e) => handleVariantChange(vIdx, 'name', e.target.value)}
                                      className="w-36 px-2 py-1 border border-slate-200 rounded text-xs"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={v.sku}
                                      onChange={(e) => handleVariantChange(vIdx, 'sku', e.target.value)}
                                      className="w-32 px-2 py-1 border border-slate-200 rounded text-xs font-mono"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="number"
                                      value={v.price}
                                      onChange={(e) => handleVariantChange(vIdx, 'price', Number(e.target.value))}
                                      className="w-20 px-2 py-1 border border-slate-200 rounded text-xs font-bold"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="number"
                                      value={v.mrp}
                                      onChange={(e) => handleVariantChange(vIdx, 'mrp', Number(e.target.value))}
                                      className="w-20 px-2 py-1 border border-slate-200 rounded text-xs text-slate-500"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="number"
                                      value={v.stock}
                                      onChange={(e) => handleVariantChange(vIdx, 'stock', Number(e.target.value))}
                                      className="w-16 px-2 py-1 border border-slate-200 rounded text-xs"
                                    />
                                  </td>
                                  <td className="p-2 text-center">
                                    <input
                                      type="checkbox"
                                      checked={isAvail}
                                      onChange={(e) => handleVariantChange(vIdx, 'isAvailable', e.target.checked)}
                                      className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                                      title="Toggle whether this combination is sellable"
                                    />
                                  </td>
                                  <td className="p-2 text-center">
                                    <input
                                      type="checkbox"
                                      checked={v.inStock}
                                      onChange={(e) => handleVariantChange(vIdx, 'inStock', e.target.checked)}
                                      className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                                    />
                                  </td>
                                  <td className="p-2 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveVariantRow(vIdx)}
                                      className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                                      title="Delete Variant Row"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Customer PDP Interactive Preview Card */}
                  {formAttributes.length > 0 && formVariants.length > 0 && (
                    <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
                      <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                          <span>Customer PDP Live Preview</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          Simulating how options will render on customer PDP
                        </span>
                      </div>

                      <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 space-y-3">
                        {formAttributes.map((attr) => {
                          const options = attr.optionsStr.split(',').map((s) => s.trim()).filter(Boolean);
                          if (options.length === 0) return null;

                          return (
                            <div key={attr.id} className="space-y-1.5">
                              <span className="text-[11px] font-bold text-slate-800">{attr.name}</span>
                              {attr.uiType === 'pills' ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {options.map((opt, oIdx) => (
                                    <span
                                      key={opt}
                                      className={`px-3 py-1 rounded-full text-[11px] font-semibold border ${
                                        oIdx === 0
                                          ? 'bg-black text-white border-black'
                                          : 'bg-white text-slate-800 border-slate-300'
                                      }`}
                                    >
                                      {opt}
                                    </span>
                                  ))}
                                </div>
                              ) : attr.uiType === 'cards' ? (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                  {options.map((opt, oIdx) => (
                                    <div
                                      key={opt}
                                      className={`p-2 rounded-xl border text-left ${
                                        oIdx === 0
                                          ? 'border-[#f59e0b] bg-[#fef9c3] ring-1 ring-amber-500/20'
                                          : 'border-slate-200 bg-white'
                                      }`}
                                    >
                                      <div className="font-bold text-xs text-slate-900">{opt}</div>
                                      <div className="font-black text-xs text-slate-800 mt-0.5">
                                        ₹{Number(price) || 100}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <select
                                  disabled
                                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                                >
                                  {options.map((opt) => (
                                    <option key={opt}>{opt}</option>
                                  ))}
                                </select>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isLoading}
            >
              {editingProduct ? 'Update Product' : 'Add to Catalog'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
