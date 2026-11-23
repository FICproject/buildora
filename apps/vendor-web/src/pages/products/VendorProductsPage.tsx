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
} from 'lucide-react';
import { useVendorProductStore } from '../../store/useVendorProductStore';
import { Card, CardHeader, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { VendorProduct, AttributeSelectorType } from '@buildora/types';

interface FormAttribute {
  id: string;
  name: string;
  uiType: AttributeSelectorType;
  optionsStr: string;
}

interface FormVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  mrp: number;
  stock: number;
  inStock: boolean;
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
    setHasVariants(false);
    setFormAttributes([{ id: 'attr-1', name: 'Size', uiType: 'cards', optionsStr: 'M6, M8' }]);
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
            .join(', ')
        }))
      );
    } else {
      setFormAttributes([{ id: 'attr-1', name: 'Size', uiType: 'cards', optionsStr: 'Standard' }]);
    }

    if (p.variants && p.variants.length > 0) {
      setFormVariants(
        p.variants.map((v) => ({
          id: v.id,
          name: v.name,
          sku: v.sku,
          price: v.price,
          mrp: v.mrp,
          stock: v.stock || 50,
          inStock: v.inStock !== false
        }))
      );
    } else {
      setFormVariants([]);
    }

    setIsModalOpen(true);
  };

  const handleAddVariantRow = () => {
    const newIdx = formVariants.length + 1;
    setFormVariants([
      ...formVariants,
      {
        id: `v-custom-${Date.now()}-${newIdx}`,
        name: `Option ${newIdx}`,
        sku: `${sku}-V${newIdx}`,
        price: Number(price) || 100,
        mrp: Number(mrp) || 150,
        stock: 50,
        inStock: true
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
          name: a.name,
          uiType: a.uiType,
          options: a.optionsStr
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        }))
      : undefined;

    const finalVariants =
      hasVariants && formVariants.length > 0
        ? formVariants.map((v) => ({
            id: v.id,
            name: v.name,
            sku: v.sku,
            attributes: { [formAttributes[0]?.name || 'Size']: v.name },
            price: Number(v.price),
            mrp: Number(v.mrp),
            stock: Number(v.stock),
            inStock: v.inStock && Number(v.stock) > 0,
            discount: v.mrp > v.price ? Math.round(((v.mrp - v.price) / v.mrp) * 100) : 0
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
      specifications: {
        Grade: '53 Grade IS 12269',
        Packaging: unit,
        Origin: 'Bengaluru Tier-1 Plant',
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
                            <p className="font-semibold text-slate-900 line-clamp-1">{p.name}</p>
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

            {/* Attributes & Variant Configuration (HomeRun Parity) */}
            <div className="md:col-span-2 p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Variant & Attribute Configuration
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Configure selectable sizes, colours, pack sizes, and UI presentation type (Cards, Dropdown, Pills).
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={hasVariants}
                    onChange={(e) => setHasVariants(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span>Has Options / Variants</span>
                </label>
              </div>

              {hasVariants && (
                <div className="space-y-4 pt-2 border-t border-slate-200">
                  {/* Attribute Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Attribute Name
                      </label>
                      <input
                        type="text"
                        value={formAttributes[0]?.name || ''}
                        onChange={(e) => {
                          const updated = [...formAttributes];
                          if (updated[0]) updated[0].name = e.target.value;
                          setFormAttributes(updated);
                        }}
                        placeholder="e.g. Size, Pack Size, Colour"
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        UI Presentation Selector
                      </label>
                      <select
                        value={formAttributes[0]?.uiType || 'cards'}
                        onChange={(e) => {
                          const updated = [...formAttributes];
                          if (updated[0]) updated[0].uiType = e.target.value as AttributeSelectorType;
                          setFormAttributes(updated);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="cards">Option Cards (e.g. Size / Pack Size)</option>
                        <option value="dropdown">Dropdown Selector (e.g. Module Sizes)</option>
                        <option value="pills">Pill Buttons (e.g. Colours, Finish)</option>
                        <option value="radio">Radio Buttons</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Options (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={formAttributes[0]?.optionsStr || ''}
                        onChange={(e) => {
                          const updated = [...formAttributes];
                          if (updated[0]) updated[0].optionsStr = e.target.value;
                          setFormAttributes(updated);
                        }}
                        placeholder="e.g. 2 Module, 4 Module, 6 Module"
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Variant Matrix Table */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700">Variant Inventory & Pricing Matrix</span>
                      <button
                        type="button"
                        onClick={handleAddVariantRow}
                        className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Variant
                      </button>
                    </div>

                    {formVariants.length === 0 ? (
                      <div className="text-center py-3 text-xs text-slate-400 bg-white rounded-lg border border-dashed border-slate-300">
                        No individual variants added yet. Click "+ Add Variant" to configure custom pricing/stock per option.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs bg-white rounded-lg border border-slate-200">
                          <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
                            <tr>
                              <th className="p-2">Variant Name</th>
                              <th className="p-2">SKU</th>
                              <th className="p-2">Price (₹)</th>
                              <th className="p-2">MRP (₹)</th>
                              <th className="p-2">Stock</th>
                              <th className="p-2 text-center">In Stock</th>
                              <th className="p-2 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {formVariants.map((v, vIdx) => (
                              <tr key={v.id || vIdx}>
                                <td className="p-1.5">
                                  <input
                                    type="text"
                                    value={v.name}
                                    onChange={(e) => handleVariantChange(vIdx, 'name', e.target.value)}
                                    className="w-28 px-1.5 py-1 border border-slate-200 rounded text-xs"
                                  />
                                </td>
                                <td className="p-1.5">
                                  <input
                                    type="text"
                                    value={v.sku}
                                    onChange={(e) => handleVariantChange(vIdx, 'sku', e.target.value)}
                                    className="w-28 px-1.5 py-1 border border-slate-200 rounded text-xs font-mono"
                                  />
                                </td>
                                <td className="p-1.5">
                                  <input
                                    type="number"
                                    value={v.price}
                                    onChange={(e) => handleVariantChange(vIdx, 'price', Number(e.target.value))}
                                    className="w-16 px-1.5 py-1 border border-slate-200 rounded text-xs"
                                  />
                                </td>
                                <td className="p-1.5">
                                  <input
                                    type="number"
                                    value={v.mrp}
                                    onChange={(e) => handleVariantChange(vIdx, 'mrp', Number(e.target.value))}
                                    className="w-16 px-1.5 py-1 border border-slate-200 rounded text-xs"
                                  />
                                </td>
                                <td className="p-1.5">
                                  <input
                                    type="number"
                                    value={v.stock}
                                    onChange={(e) => handleVariantChange(vIdx, 'stock', Number(e.target.value))}
                                    className="w-16 px-1.5 py-1 border border-slate-200 rounded text-xs"
                                  />
                                </td>
                                <td className="p-1.5 text-center">
                                  <input
                                    type="checkbox"
                                    checked={v.inStock}
                                    onChange={(e) => handleVariantChange(vIdx, 'inStock', e.target.checked)}
                                    className="w-3.5 h-3.5 text-blue-600 rounded"
                                  />
                                </td>
                                <td className="p-1.5 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveVariantRow(vIdx)}
                                    className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
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
