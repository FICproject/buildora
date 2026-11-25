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
  const [sectionTab, setSectionTab] = useState<'PRODUCTS' | 'TAXONOMY'>('PRODUCTS');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [taxonomy, setTaxonomy] = useState<{ categories: any[]; brands: any[]; attributes: any[] }>({
    categories: [],
    brands: [],
    attributes: [],
  });

  const [editModal, setEditModal] = useState<any>(null);
  const [rejectModal, setRejectModal] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');

  const [catForm, setCatForm] = useState({ name: '', description: '' });
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
    setTaxonomy(res);
  };

  useEffect(() => {
    if (sectionTab === 'PRODUCTS') loadProducts();
    else loadTaxonomy();
  }, [sectionTab, statusFilter]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleBulkApprove = async () => {
    try {
      const res = await adminApi.bulkApproveProducts(selectedIds);
      pushToast({ title: 'Bulk Approved', message: `${res.count || selectedIds.length} products published to Customer Website.` });
      setSelectedIds([]);
      await loadProducts();
    } catch (err: any) {
      pushToast({ title: 'Bulk Approve Failed', message: err.message, variant: 'error' });
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
          <div className="flex gap-2">
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
              <Layers className="w-4 h-4" /> Categories, Brands & Attributes
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
                          <p className="text-[#6E6859]">{p.categoryName}</p>
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
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Categories */}
          <Card title="Product Categories" subtitle={`${taxonomy.categories.length} active`}>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await adminApi.createCategory(catForm);
                setCatForm({ name: '', description: '' });
                pushToast({ title: 'Category Added' });
                loadTaxonomy();
              }}
              className="flex gap-2 mb-4"
            >
              <input
                required
                placeholder="New category name"
                value={catForm.name}
                onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-[#E5DCD3] rounded-lg"
              />
              <Button size="sm" type="submit">
                <Plus className="w-3.5 h-3.5" /> Add
              </Button>
            </form>
            <div className="divide-y divide-[#E5DCD3] max-h-80 overflow-y-auto text-xs">
              {taxonomy.categories.map((c) => (
                <div key={c.id} className="py-2 flex justify-between">
                  <span className="font-medium text-[#5E5946]">{c.name}</span>
                  <span className="text-[#6E6859]">{c.subcategories?.length || 0} sub</span>
                </div>
              ))}
            </div>
          </Card>

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
