import React, { useEffect, useState } from 'react';
import {
  Search,
  Package,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Edit3,
  Plus,
  Layers,
  Sparkles,
} from 'lucide-react';
import { adminApi, formatINR } from '../services/adminApi';
import {
  PageHeader,
  Card,
  Badge,
  Button,
  Modal,
  EmptyState,
  statusBadgeVariant,
  useToastStore,
} from '../components/ui';

export const CatalogProductsPage: React.FC = () => {
  const pushToast = useToastStore((s) => s.push);
  const [sectionTab, setSectionTab] = useState<'PRODUCTS' | 'TAXONOMY' | 'NEW_LAUNCHES'>('PRODUCTS');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [taxonomy, setTaxonomy] = useState<{
    categories: any[];
    mainCategories: any[];
    childCategories: any[];
    productTypes: any[];
    newLaunchCollections: any[];
    migrationSummary?: { totalRecords: number; migrated: number; unmapped: number };
    brands: any[];
    attributes: any[];
  }>({
    categories: [],
    mainCategories: [],
    childCategories: [],
    productTypes: [],
    newLaunchCollections: [],
    brands: [],
    attributes: [],
  });

  const [editModal, setEditModal] = useState<any>(null);
  const [rejectModal, setRejectModal] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');

  const [mainForm, setMainForm] = useState({ name: '', sortOrder: '6', description: '' });
  const [childForm, setChildForm] = useState({ mainCategoryId: 'mc-1', name: '', sortOrder: '1', description: '' });
  const [typeForm, setTypeForm] = useState({ childCategoryId: 'cat-1', name: '', sortOrder: '1' });
  const [newLaunchForm, setNewLaunchForm] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    displayOrder: '1',
    productIds: [] as string[],
  });
  const [brandForm, setBrandForm] = useState({ name: '', description: '' });
  const [attrForm, setAttrForm] = useState({ name: '', categoryName: 'Cement & Concrete', valuesCsv: '' });

  const loadProducts = async (st = statusFilter, q = search) => {
    setLoading(true);
    try {
      const list = await adminApi.getProducts(st, q);
      setProducts(list || []);
    } finally {
      setLoading(false);
    }
  };

  const loadTaxonomy = async () => {
    const res = await adminApi.getCatalogTaxonomy();
    setTaxonomy({
      categories: res?.categories || [],
      mainCategories: res?.mainCategories || [],
      childCategories: res?.childCategories || [],
      productTypes: res?.productTypes || [],
      newLaunchCollections: res?.newLaunchCollections || [],
      migrationSummary: res?.migrationSummary,
      brands: res?.brands || [],
      attributes: res?.attributes || [],
    });
  };

  useEffect(() => {
    loadTaxonomy();
    if (sectionTab === 'PRODUCTS' || sectionTab === 'NEW_LAUNCHES') loadProducts();

    const onRealtime = () => {
      if (sectionTab === 'PRODUCTS') loadProducts();
    };
    window.addEventListener('buildora:admin:realtime', onRealtime);
    return () => window.removeEventListener('buildora:admin:realtime', onRealtime);
  }, [sectionTab, statusFilter]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleBulkApprove = async () => {
    try {
      const res = await adminApi.bulkApproveProducts(selectedIds);
      const count = Array.isArray(res) ? res.length : res?.count || selectedIds.length;
      pushToast({ title: 'Bulk Approved', message: `${count} products published to Customer Website.` });
      setSelectedIds([]);
      await loadProducts();
    } catch (err: any) {
      pushToast({ title: 'Bulk Approve Failed', message: err.message, variant: 'error' });
    }
  };

  const handleSuspendToggle = async (p: any) => {
    try {
      if (p.isSuspended) {
        await adminApi.unsuspendProduct(p.id);
        pushToast({ title: 'Product Unsuspended', message: `${p.name} suspension lifted.` });
      } else {
        await adminApi.suspendProduct(p.id, 'Suspended by Company Admin moderation');
        pushToast({ title: 'Product Suspended', message: `${p.name} is now blocked from customer purchases.` });
      }
      await loadProducts();
    } catch (err: any) {
      pushToast({ title: 'Error', message: err.message, variant: 'error' });
    }
  };

  const handleApproveOne = async (p: any) => {
    try {
      await adminApi.approveProduct(p.id);
      pushToast({ title: 'Product Approved', message: `${p.name} is now live on Customer Website.` });
      await loadProducts();
    } catch (err: any) {
      pushToast({ title: 'Error', message: err.message, variant: 'error' });
    }
  };

  const handleVisibilityToggle = async (p: any) => {
    try {
      await adminApi.toggleProductVisibility(p.id, !p.isActive);
      pushToast({
        title: !p.isActive ? 'Product Visible' : 'Product Hidden',
        message: `${p.name} storefront status updated.`,
      });
      await loadProducts();
    } catch (err: any) {
      pushToast({ title: 'Failed', message: err.message, variant: 'error' });
    }
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal) return;
    try {
      await adminApi.updateProduct(editModal.id, {
        name: editModal.name,
        mrp: Number(editModal.mrp),
        sellingPrice: Number(editModal.sellingPrice),
        gstRate: Number(editModal.gstRate),
        mainCategoryId: editModal.mainCategoryId,
        childCategoryId: editModal.childCategoryId,
        productTypeId: editModal.productTypeId,
        categoryName: editModal.categoryName,
        brand: editModal.brand,
        description: editModal.description,
      });
      pushToast({ title: 'Product Updated', message: 'Storefront catalog synced immediately.' });
      setEditModal(null);
      await loadProducts();
    } catch (err: any) {
      pushToast({ title: 'Update Failed', message: err.message, variant: 'error' });
    }
  };

  const submitReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModal) return;
    try {
      await adminApi.rejectProduct(rejectModal.id, rejectReason);
      pushToast({ title: 'Product Rejected', variant: 'warning' });
      setRejectModal(null);
      setRejectReason('');
      await loadProducts();
    } catch (err: any) {
      pushToast({ title: 'Error', message: err.message, variant: 'error' });
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Product & Catalog Management"
        description="Approve vendor product submissions, control Customer Website visibility, pricing & catalog taxonomy."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant={sectionTab === 'PRODUCTS' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSectionTab('PRODUCTS')}
            >
              <Package className="w-4 h-4" /> Products & Moderation
            </Button>
            <Button
              variant={sectionTab === 'TAXONOMY' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSectionTab('TAXONOMY')}
            >
              <Layers className="w-4 h-4" /> 4-Level Taxonomy
            </Button>
            <Button
              variant={sectionTab === 'NEW_LAUNCHES' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSectionTab('NEW_LAUNCHES')}
            >
              <Sparkles className="w-4 h-4" /> New Launches
            </Button>
          </div>
        }
      />

      {sectionTab === 'PRODUCTS' ? (
        <>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'ALL', label: 'All Products' },
                { id: 'PENDING_APPROVAL', label: 'Pending Approvals' },
                { id: 'APPROVED', label: 'Approved' },
                { id: 'REJECTED', label: 'Rejected' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setStatusFilter(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    statusFilter === t.id
                      ? 'bg-[#AE887B] text-white border-[#AE887B] shadow-sm'
                      : 'bg-white text-[#5E5946] border-[#E5DCD3] hover:bg-[#F0DED0]/45'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {selectedIds.length > 0 && (
                <Button size="sm" variant="dark" onClick={handleBulkApprove}>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Bulk Approve ({selectedIds.length})
                </Button>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  loadProducts();
                }}
                className="flex items-center gap-2"
              >
                <div className="relative">
                  <Search className="w-4 h-4 text-[#6E6859] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search SKU, name, vendor..."
                    className="pl-9 pr-3 py-2 text-xs bg-white border border-[#E5DCD3] rounded-lg w-60 focus:outline-none focus:border-[#AE887B]"
                  />
                </div>
                <Button type="submit" size="sm" variant="secondary">
                  Filter
                </Button>
              </form>
            </div>
          </div>

          <Card noPadding>
            {loading ? (
              <div className="py-12 text-center text-xs text-[#6E6859]">Loading catalog...</div>
            ) : products.length === 0 ? (
              <EmptyState
                icon={<Package className="w-5 h-5" />}
                title="No products found"
                description="Try switching the approval filter or search keyword."
              />
            ) : (
              <div className="overflow-x-auto rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F0DED0]/75 border-b border-[#E5DCD3] text-[11px] font-semibold text-[#5E5946] uppercase">
                      <th className="py-3 px-3 w-8"></th>
                      <th className="py-3 px-3">Product / SKU</th>
                      <th className="py-3 px-3">Vendor & Category</th>
                      <th className="py-3 px-3">MRP / Selling (GST)</th>
                      <th className="py-3 px-3">Stock</th>
                      <th className="py-3 px-3">Status & Visibility</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5DCD3] text-xs bg-white">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-[#FAF7F4] transition-colors">
                        <td className="py-3 px-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(p.id)}
                            onChange={() => toggleSelect(p.id)}
                            className="rounded border-[#E5DCD3]"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-semibold text-[#5E5946]">{p.name}</p>
                          <p className="text-[#6E6859] font-mono">
                            {p.sku} • {p.brand}
                          </p>
                        </td>
                        <td className="py-3 px-3">
                          <p className="text-[#5E5946] font-medium">{p.vendorName}</p>
                          <p className="text-[#6E6859] text-[11px]">
                            {p.mainCategoryName ? `${p.mainCategoryName} → ` : ''}
                            {p.childCategoryName || p.categoryName}
                            {p.productTypeName ? ` • ${p.productTypeName}` : ''}
                          </p>
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-semibold text-[#5E5946]">
                            {formatINR(p.sellingPrice)}{' '}
                            <span className="line-through text-[#8E8777] font-normal">
                              {formatINR(p.mrp)}
                            </span>
                          </p>
                          <p className="text-[#6E6859]">GST {p.gstRate}%</p>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold">{p.stock}</span> {p.unit}
                        </td>
                        <td className="py-3 px-3 space-y-1">
                          <div>
                            <Badge variant={statusBadgeVariant(p.approvalStatus)}>
                              {p.approvalStatus}
                            </Badge>
                          </div>
                          <div>
                            <Badge variant={p.isActive ? 'info' : 'error'}>
                              {p.isActive ? 'Storefront Visible' : 'Hidden'}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right space-x-1 whitespace-nowrap">
                          {p.approvalStatus === 'PENDING_APPROVAL' && (
                            <>
                              <Button size="sm" variant="success" onClick={() => handleApproveOne(p)}>
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => setRejectModal(p)}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVisibilityToggle(p)}
                            title="Toggle Customer Website Visibility"
                          >
                            {p.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </Button>
                          <Button
                            size="sm"
                            variant={p.isSuspended ? 'success' : 'danger'}
                            onClick={() => handleSuspendToggle(p)}
                          >
                            {p.isSuspended ? 'Unsuspend' : 'Suspend'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditModal({ ...p })}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      ) : sectionTab === 'TAXONOMY' ? (
        <div className="space-y-5">
          {taxonomy.migrationSummary && (
            <div className="p-3 rounded-xl bg-[#FAF7F4] border border-[#E5DCD3] text-xs flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-[#5E5946]">
                Catalog Hierarchy Sync: {taxonomy.mainCategories.length} Main Categories •{' '}
                {taxonomy.childCategories.length} Child Categories • {taxonomy.productTypes.length} Product Types
              </span>
              <span className="text-[#6E6859]">
                Migrated Records: <strong>{taxonomy.migrationSummary.migrated}</strong> /{' '}
                {taxonomy.migrationSummary.totalRecords} (Unmapped: {taxonomy.migrationSummary.unmapped})
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Level 1: Main Categories */}
            <Card title="1. Main Categories" subtitle={`${taxonomy.mainCategories.length} top-level sections`}>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    await adminApi.createMainCategory({
                      name: mainForm.name,
                      sortOrder: Number(mainForm.sortOrder) || 99,
                      description: mainForm.description,
                    });
                    setMainForm({ name: '', sortOrder: String(taxonomy.mainCategories.length + 2), description: '' });
                    pushToast({ title: 'Main Category Added' });
                    loadTaxonomy();
                  } catch (err: any) {
                    pushToast({ title: 'Error', message: err.message, variant: 'error' });
                  }
                }}
                className="flex gap-2 mb-4"
              >
                <input
                  required
                  placeholder="New main category"
                  value={mainForm.name}
                  onChange={(e) => setMainForm({ ...mainForm, name: e.target.value })}
                  className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-[#E5DCD3] rounded-lg"
                />
                <input
                  type="number"
                  min={1}
                  placeholder="Order"
                  value={mainForm.sortOrder}
                  onChange={(e) => setMainForm({ ...mainForm, sortOrder: e.target.value })}
                  className="w-16 px-2 py-1.5 text-xs bg-white border border-[#E5DCD3] rounded-lg"
                />
                <Button size="sm" type="submit">
                  <Plus className="w-3.5 h-3.5" /> Add
                </Button>
              </form>
              <div className="divide-y divide-[#E5DCD3] max-h-80 overflow-y-auto text-xs">
                {taxonomy.mainCategories.map((mc) => (
                  <div key={mc.id} className="py-2 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-[#5E5946] truncate">
                        #{mc.sortOrder} {mc.name}
                      </p>
                      <p className="text-[11px] text-[#6E6859] font-mono truncate">{mc.slug}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant={mc.showInNavigation !== false ? 'success' : 'outline'}
                        onClick={async () => {
                          await adminApi.updateMainCategory(mc.id, { showInNavigation: !(mc.showInNavigation !== false) });
                          loadTaxonomy();
                        }}
                      >
                        {mc.showInNavigation !== false ? 'In Nav' : 'Hidden'}
                      </Button>
                      <Button
                        size="sm"
                        variant={mc.isActive !== false ? 'success' : 'danger'}
                        onClick={async () => {
                          await adminApi.updateMainCategory(mc.id, { isActive: !(mc.isActive !== false) });
                          loadTaxonomy();
                        }}
                      >
                        {mc.isActive !== false ? 'Active' : 'Off'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Level 2: Child Categories */}
            <Card title="2. Child Categories" subtitle={`${taxonomy.childCategories.length} categories`}>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    await adminApi.createChildCategory({
                      mainCategoryId: childForm.mainCategoryId,
                      name: childForm.name,
                      sortOrder: Number(childForm.sortOrder) || 99,
                      description: childForm.description,
                    });
                    setChildForm({ ...childForm, name: '', description: '' });
                    pushToast({ title: 'Child Category Added' });
                    loadTaxonomy();
                  } catch (err: any) {
                    pushToast({ title: 'Error', message: err.message, variant: 'error' });
                  }
                }}
                className="space-y-2 mb-4"
              >
                <select
                  value={childForm.mainCategoryId}
                  onChange={(e) => setChildForm({ ...childForm, mainCategoryId: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E5DCD3] rounded-lg"
                >
                  {taxonomy.mainCategories.map((mc) => (
                    <option key={mc.id} value={mc.id}>
                      Parent: {mc.name}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <input
                    required
                    placeholder="New child category name"
                    value={childForm.name}
                    onChange={(e) => setChildForm({ ...childForm, name: e.target.value })}
                    className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-[#E5DCD3] rounded-lg"
                  />
                  <Button size="sm" type="submit">
                    <Plus className="w-3.5 h-3.5" /> Add
                  </Button>
                </div>
              </form>
              <div className="divide-y divide-[#E5DCD3] max-h-80 overflow-y-auto text-xs">
                {taxonomy.childCategories.map((cc) => (
                  <div key={cc.id} className="py-2 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-[#5E5946] truncate">{cc.name}</p>
                      <p className="text-[11px] text-[#6E6859] truncate">{cc.mainCategoryName || cc.mainCategorySlug}</p>
                    </div>
                    <Button
                      size="sm"
                      variant={cc.isActive !== false ? 'success' : 'outline'}
                      onClick={async () => {
                        await adminApi.updateChildCategory(cc.id, { isActive: !(cc.isActive !== false) });
                        loadTaxonomy();
                      }}
                    >
                      {cc.isActive !== false ? 'Active' : 'Off'}
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

            {/* Level 3: Product Types */}
            <Card title="3. Product Types" subtitle={`${taxonomy.productTypes.length} product types`}>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    await adminApi.createProductType({
                      childCategoryId: typeForm.childCategoryId,
                      name: typeForm.name,
                      sortOrder: Number(typeForm.sortOrder) || 99,
                    });
                    setTypeForm({ ...typeForm, name: '' });
                    pushToast({ title: 'Product Type Added' });
                    loadTaxonomy();
                  } catch (err: any) {
                    pushToast({ title: 'Error', message: err.message, variant: 'error' });
                  }
                }}
                className="space-y-2 mb-4"
              >
                <select
                  value={typeForm.childCategoryId}
                  onChange={(e) => setTypeForm({ ...typeForm, childCategoryId: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E5DCD3] rounded-lg"
                >
                  {taxonomy.childCategories.map((cc) => (
                    <option key={cc.id} value={cc.id}>
                      Child: {cc.name}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <input
                    required
                    placeholder="New product type (e.g. PPC Cement)"
                    value={typeForm.name}
                    onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                    className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-[#E5DCD3] rounded-lg"
                  />
                  <Button size="sm" type="submit">
                    <Plus className="w-3.5 h-3.5" /> Add
                  </Button>
                </div>
              </form>
              <div className="divide-y divide-[#E5DCD3] max-h-80 overflow-y-auto text-xs">
                {taxonomy.productTypes.map((pt) => (
                  <div key={pt.id} className="py-2 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-[#5E5946] truncate">{pt.name}</p>
                      <p className="text-[11px] text-[#6E6859] truncate">{pt.childCategoryName || pt.childCategorySlug}</p>
                    </div>
                    <Button
                      size="sm"
                      variant={pt.isActive !== false ? 'success' : 'outline'}
                      onClick={async () => {
                        await adminApi.updateProductType(pt.id, { isActive: !(pt.isActive !== false) });
                        loadTaxonomy();
                      }}
                    >
                      {pt.isActive !== false ? 'Active' : 'Off'}
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Brands */}
            <Card title="Approved Brands" subtitle={`${taxonomy.brands.length} listed`}>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await adminApi.createBrand(brandForm);
                  setBrandForm({ name: '', description: '' });
                  pushToast({ title: 'Brand Added' });
                  loadTaxonomy();
                }}
                className="flex gap-2 mb-4"
              >
                <input
                  required
                  placeholder="Brand name (e.g. ACC, Finolex)"
                  value={brandForm.name}
                  onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                  className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-[#E5DCD3] rounded-lg"
                />
                <Button size="sm" type="submit">
                  <Plus className="w-3.5 h-3.5" /> Add
                </Button>
              </form>
              <div className="divide-y divide-[#E5DCD3] max-h-80 overflow-y-auto text-xs">
                {taxonomy.brands.map((b) => (
                  <div key={b.id} className="py-2 flex justify-between">
                    <span className="font-medium text-[#5E5946]">{b.name}</span>
                    <Badge variant="info">{b.slug}</Badge>
                  </div>
                ))}
              </div>
            </Card>

            {/* Attributes */}
            <Card title="Specification Attributes" subtitle={`${taxonomy.attributes.length} schemas`}>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await adminApi.createAttribute({
                    name: attrForm.name,
                    categoryName: attrForm.categoryName,
                    values: attrForm.valuesCsv.split(',').map((s) => s.trim()).filter(Boolean),
                    isRequired: true,
                  });
                  setAttrForm({ name: '', categoryName: 'Cement & Concrete', valuesCsv: '' });
                  pushToast({ title: 'Attribute Added' });
                  loadTaxonomy();
                }}
                className="space-y-2 mb-4"
              >
                <input
                  required
                  placeholder="Attribute name (e.g. Fineness)"
                  value={attrForm.name}
                  onChange={(e) => setAttrForm({ ...attrForm, name: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E5DCD3] rounded-lg"
                />
                <div className="flex gap-2">
                  <input
                    placeholder="Values (comma separated)"
                    value={attrForm.valuesCsv}
                    onChange={(e) => setAttrForm({ ...attrForm, valuesCsv: e.target.value })}
                    className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-[#E5DCD3] rounded-lg"
                  />
                  <Button size="sm" type="submit">
                    Add
                  </Button>
                </div>
              </form>
              <div className="space-y-2 max-h-72 overflow-y-auto text-xs">
                {taxonomy.attributes.map((a) => (
                  <div key={a.id} className="p-2.5 border border-[#E5DCD3] bg-[#FAF7F4] rounded-lg">
                    <p className="font-semibold text-[#5E5946]">{a.name}</p>
                    <p className="text-[#6E6859]">{a.categoryName} • {(a.values || []).join(', ')}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Create New Launches Promotional Collection */}
          <Card title="Create New Launches Collection" subtitle="Promotional showcase without altering product taxonomy">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await adminApi.createNewLaunchCollection({
                    title: newLaunchForm.name,
                    description: newLaunchForm.description,
                    startDate: newLaunchForm.startDate || undefined,
                    endDate: newLaunchForm.endDate || undefined,
                    displayOrder: Number(newLaunchForm.displayOrder) || 1,
                    productIds: newLaunchForm.productIds,
                    isActive: true,
                  });
                  setNewLaunchForm({ name: '', description: '', startDate: '', endDate: '', displayOrder: '1', productIds: [] });
                  pushToast({ title: 'Collection Created', message: 'Promotional New Launches synced to Customer Web.' });
                  loadTaxonomy();
                } catch (err: any) {
                  pushToast({ title: 'Failed', message: err.message, variant: 'error' });
                }
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold text-[#5E5946] mb-1">Collection Title *</label>
                <input
                  required
                  placeholder="e.g. Monsoon Waterproofing & Smart Electrical Launches"
                  value={newLaunchForm.name}
                  onChange={(e) => setNewLaunchForm({ ...newLaunchForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#5E5946] mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newLaunchForm.description}
                  onChange={(e) => setNewLaunchForm({ ...newLaunchForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-[#5E5946] mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newLaunchForm.startDate}
                    onChange={(e) => setNewLaunchForm({ ...newLaunchForm, startDate: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E5DCD3] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#5E5946] mb-1">End Date</label>
                  <input
                    type="date"
                    value={newLaunchForm.endDate}
                    onChange={(e) => setNewLaunchForm({ ...newLaunchForm, endDate: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E5DCD3] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#5E5946] mb-1">Display Order</label>
                  <input
                    type="number"
                    min={1}
                    value={newLaunchForm.displayOrder}
                    onChange={(e) => setNewLaunchForm({ ...newLaunchForm, displayOrder: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E5DCD3] rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-[#5E5946] mb-1">
                  Select Featured Products ({newLaunchForm.productIds.length} selected)
                </label>
                <div className="max-h-44 overflow-y-auto border border-[#E5DCD3] rounded-lg p-2 space-y-1 bg-[#FAF7F4]">
                  {products.map((p) => {
                    const checked = newLaunchForm.productIds.includes(p.id);
                    return (
                      <label key={p.id} className="flex items-center gap-2 py-1 px-1.5 rounded hover:bg-white cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setNewLaunchForm((prev) => ({
                              ...prev,
                              productIds: checked
                                ? prev.productIds.filter((id) => id !== p.id)
                                : [...prev.productIds, p.id],
                            }))
                          }
                        />
                        <span className="truncate font-medium text-[#5E5946]">{p.name}</span>
                        <span className="text-[10px] text-[#6E6859] ml-auto shrink-0">{p.childCategoryName || p.categoryName}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <Button type="submit" size="sm">
                <Plus className="w-3.5 h-3.5" /> Create Promotional Collection
              </Button>
            </form>
          </Card>

          {/* Existing Collections */}
          <Card title="Active & Scheduled Collections" subtitle={`${taxonomy.newLaunchCollections.length} collections`}>
            <div className="space-y-3 text-xs">
              {taxonomy.newLaunchCollections.length === 0 ? (
                <p className="text-[#6E6859] py-6 text-center">No promotional collections configured yet.</p>
              ) : (
                taxonomy.newLaunchCollections.map((col) => (
                  <div key={col.id} className="p-3 rounded-xl border border-[#E5DCD3] bg-[#FAF7F4] space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-[#5E5946]">
                          #{col.displayOrder || 1} {col.title || col.name}
                        </p>
                        <p className="text-[#6E6859]">{col.description || col.slug}</p>
                        <p className="text-[11px] text-[#6E6859] mt-1">
                          Products linked: <strong>{(col.productIds || []).length}</strong>
                          {col.startDate || col.endDate ? ` • Window: ${col.startDate || 'Now'} to ${col.endDate || 'Open'}` : ''}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant={col.isActive !== false ? 'success' : 'outline'}
                        onClick={async () => {
                          await adminApi.updateNewLaunchCollection(col.id, {
                            isActive: !(col.isActive !== false),
                          });
                          loadTaxonomy();
                        }}
                      >
                        {col.isActive !== false ? 'Visible' : 'Hidden'}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Edit Product Modal */}
      <Modal
        open={Boolean(editModal)}
        onClose={() => setEditModal(null)}
        title="Edit Catalog Product & Storefront Sync"
      >
        {editModal && (
          <form onSubmit={submitEdit} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-[#5E5946] mb-1">Product Title</label>
              <input
                required
                value={editModal.name}
                onChange={(e) => setEditModal({ ...editModal, name: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block font-semibold text-[#5E5946] mb-1">Main Category</label>
                <select
                  value={editModal.mainCategoryId || ''}
                  onChange={(e) => {
                    const nextMain = e.target.value;
                    const nextChild = taxonomy.childCategories.find((c) => c.mainCategoryId === nextMain);
                    const nextType = nextChild
                      ? taxonomy.productTypes.find((pt) => pt.childCategoryId === nextChild.id)
                      : undefined;
                    setEditModal({
                      ...editModal,
                      mainCategoryId: nextMain,
                      childCategoryId: nextChild?.id || '',
                      productTypeId: nextType?.id || '',
                      categoryName: nextChild?.name || '',
                    });
                  }}
                  className="w-full px-2.5 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                >
                  <option value="">Select Main</option>
                  {taxonomy.mainCategories.map((mc) => (
                    <option key={mc.id} value={mc.id}>
                      {mc.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[#5E5946] mb-1">Child Category</label>
                <select
                  value={editModal.childCategoryId || ''}
                  onChange={(e) => {
                    const nextChildId = e.target.value;
                    const nextChild = taxonomy.childCategories.find((c) => c.id === nextChildId);
                    const nextType = taxonomy.productTypes.find((pt) => pt.childCategoryId === nextChildId);
                    setEditModal({
                      ...editModal,
                      childCategoryId: nextChildId,
                      productTypeId: nextType?.id || '',
                      categoryName: nextChild?.name || editModal.categoryName,
                    });
                  }}
                  className="w-full px-2.5 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                >
                  <option value="">Select Child</option>
                  {taxonomy.childCategories
                    .filter((c) => !editModal.mainCategoryId || c.mainCategoryId === editModal.mainCategoryId)
                    .map((cc) => (
                      <option key={cc.id} value={cc.id}>
                        {cc.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[#5E5946] mb-1">Product Type</label>
                <select
                  value={editModal.productTypeId || ''}
                  onChange={(e) => setEditModal({ ...editModal, productTypeId: e.target.value })}
                  className="w-full px-2.5 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                >
                  <option value="">Select Type</option>
                  {taxonomy.productTypes
                    .filter((pt) => !editModal.childCategoryId || pt.childCategoryId === editModal.childCategoryId)
                    .map((pt) => (
                      <option key={pt.id} value={pt.id}>
                        {pt.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-semibold text-[#5E5946] mb-1">MRP (₹)</label>
                <input
                  type="number"
                  value={editModal.mrp}
                  onChange={(e) => setEditModal({ ...editModal, mrp: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#5E5946] mb-1">Selling Price (₹)</label>
                <input
                  type="number"
                  value={editModal.sellingPrice}
                  onChange={(e) => setEditModal({ ...editModal, sellingPrice: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#5E5946] mb-1">GST (%)</label>
                <input
                  type="number"
                  value={editModal.gstRate}
                  onChange={(e) => setEditModal({ ...editModal, gstRate: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-[#5E5946] mb-1">Description</label>
              <textarea
                rows={3}
                value={editModal.description || ''}
                onChange={(e) => setEditModal({ ...editModal, description: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditModal(null)}>
                Cancel
              </Button>
              <Button type="submit">Save & Sync Customer Web</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Reject Product Modal */}
      <Modal
        open={Boolean(rejectModal)}
        onClose={() => setRejectModal(null)}
        title="Reject Product Submission"
      >
        <form onSubmit={submitReject} className="space-y-4 text-xs">
          <p className="text-[#6E6859]">
            Rejecting <strong className="text-[#5E5946]">{rejectModal?.name}</strong> hides it from Customer Storefront.
          </p>
          <textarea
            required
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason (e.g. incorrect GST HSN code, missing specification sheet)..."
            className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setRejectModal(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger">
              Reject Product
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
