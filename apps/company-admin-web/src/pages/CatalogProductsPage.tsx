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
  Sliders,
  Trash2,
  FolderTree,
  Upload,
  AlertTriangle,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Rocket,
  RotateCcw,
  Monitor,
  Compass,
  Send,
  Home,
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

export type CatalogSectionTab =
  | 'PRODUCTS'
  | 'NAVIGATION'
  | 'MAIN_CATEGORIES'
  | 'CHILD_CATEGORIES'
  | 'PRODUCT_TYPES'
  | 'FIELDS'
  | 'NEW_LAUNCHES';

export const CatalogProductsPage: React.FC<{ initialSection?: CatalogSectionTab }> = ({
  initialSection = 'PRODUCTS',
}) => {
  const pushToast = useToastStore((s) => s.push);
  const [sectionTab, setSectionTab] = useState<CatalogSectionTab>(initialSection);
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
    desktopNavigation: any[];
    publishMetadata?: {
      hasUnpublishedChanges: boolean;
      publishedVersion: number;
      draftVersion: number;
      lastPublishedAt?: string;
      lastPublishedBy?: string;
    };
    fieldSchemas: any[];
    newLaunchCollections: any[];
    migrationSummary?: { totalRecords: number; migrated: number; unmapped: number };
    brands: any[];
    attributes: any[];
  }>({
    categories: [],
    mainCategories: [],
    childCategories: [],
    productTypes: [],
    desktopNavigation: [],
    fieldSchemas: [],
    newLaunchCollections: [],
    brands: [],
    attributes: [],
  });

  // Draft / Publish Workflow state
  const [workInDraftMode, setWorkInDraftMode] = useState(true);
  const [showNavPreview, setShowNavPreview] = useState(true);
  const [previewHoveredMainSlug, setPreviewHoveredMainSlug] = useState<string | null>(null);
  const [previewHoveredChildSlug, setPreviewHoveredChildSlug] = useState<string | null>(null);
  const [draggedNavId, setDraggedNavId] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  // Desktop Navigation & Product Type modals
  const [navModal, setNavModal] = useState<any>(null);
  const [productTypeModal, setProductTypeModal] = useState<any>(null);
  const [deleteTargetModal, setDeleteTargetModal] = useState<{
    kind: 'MAIN' | 'CHILD' | 'TYPE';
    item: any;
    reassignToId: string;
  } | null>(null);
  const [ptChildFilter, setPtChildFilter] = useState('ALL');

  // Category search/filter & modals
  const [catSearch, setCatSearch] = useState('');
  const [catActiveFilter, setCatActiveFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [mainEditModal, setMainEditModal] = useState<any>(null);
  const [childEditModal, setChildEditModal] = useState<any>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Dynamic Field Configurator state
  const [selectedFieldChildId, setSelectedFieldChildId] = useState('cat-1');
  const [fieldModal, setFieldModal] = useState<any>(null);

  const [editModal, setEditModal] = useState<any>(null);
  const [rejectModal, setRejectModal] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');

  const [mainForm, setMainForm] = useState({ name: '', slug: '', sortOrder: '6', description: '', image: '', showInNavigation: true });
  const [childForm, setChildForm] = useState({ mainCategoryId: 'mc-1', name: '', slug: '', sortOrder: '1', description: '', image: '' });
  const [typeForm, setTypeForm] = useState({ childCategoryId: 'cat-1', name: '', slug: '', sortOrder: '1' });
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

  useEffect(() => {
    setSectionTab(initialSection);
  }, [initialSection]);

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
      desktopNavigation: res?.desktopNavigation || [],
      publishMetadata: res?.publishMetadata,
      fieldSchemas: res?.fieldSchemas || [],
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

  const handlePublishCatalog = async () => {
    setPublishing(true);
    try {
      const res = await adminApi.publishCatalogChanges();
      pushToast({
        title: 'Published Successfully',
        message: `Catalog & Desktop Navigation v${res?.metadata?.publishedVersion || ''} is now live on Vendor & Customer apps.`,
      });
      await loadTaxonomy();
    } catch (err: any) {
      pushToast({ title: 'Publish Failed', message: err.message, variant: 'error' });
    } finally {
      setPublishing(false);
    }
  };

  const handleDiscardDraft = async () => {
    try {
      await adminApi.discardCatalogDraft();
      pushToast({ title: 'Draft Discarded', message: 'Reverted to last published catalog state.' });
      await loadTaxonomy();
    } catch (err: any) {
      pushToast({ title: 'Discard Failed', message: err.message, variant: 'error' });
    }
  };

  const handleMoveNavOrder = async (navId: string, direction: 'UP' | 'DOWN') => {
    const ordered = [...taxonomy.desktopNavigation].sort((a, b) => a.displayOrder - b.displayOrder);
    const idx = ordered.findIndex((n) => n.id === navId);
    if (idx < 0) return;
    const swapIdx = direction === 'UP' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= ordered.length) return;
    const next = [...ordered];
    const [moved] = next.splice(idx, 1);
    next.splice(swapIdx, 0, moved);
    const orderedIds = next.map((n) => n.id);
    setTaxonomy((prev) => ({
      ...prev,
      desktopNavigation: next.map((n, i) => ({ ...n, displayOrder: i + 1 })),
    }));
    try {
      await adminApi.reorderDesktopNav(orderedIds, workInDraftMode);
      pushToast({
        title: workInDraftMode ? 'Navigation Order Saved as Draft' : 'Navigation Order Published',
      });
      await loadTaxonomy();
    } catch (err: any) {
      pushToast({ title: 'Reorder Failed', message: err.message, variant: 'error' });
    }
  };

  const handleDropNav = async (targetNavId: string) => {
    if (!draggedNavId || draggedNavId === targetNavId) return;
    const ordered = [...taxonomy.desktopNavigation].sort((a, b) => a.displayOrder - b.displayOrder);
    const fromIdx = ordered.findIndex((n) => n.id === draggedNavId);
    const toIdx = ordered.findIndex((n) => n.id === targetNavId);
    if (fromIdx < 0 || toIdx < 0) return;
    const next = [...ordered];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setDraggedNavId(null);
    const orderedIds = next.map((n) => n.id);
    setTaxonomy((prev) => ({
      ...prev,
      desktopNavigation: next.map((n, i) => ({ ...n, displayOrder: i + 1 })),
    }));
    try {
      await adminApi.reorderDesktopNav(orderedIds, workInDraftMode);
      pushToast({
        title: workInDraftMode ? 'Drag & Drop Order Saved to Draft' : 'Desktop Navigation Published',
      });
      await loadTaxonomy();
    } catch (err: any) {
      pushToast({ title: 'Reorder Failed', message: err.message, variant: 'error' });
    }
  };

  const navBarPreviewItems = React.useMemo(() => {
    const mainMap = new Map(taxonomy.mainCategories.map((m) => [m.id, m]));
    return [...taxonomy.desktopNavigation]
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .filter((nav) => {
        if (nav.isActive === false || nav.isVisible === false) return false;
        if (nav.itemType === 'MAIN_CATEGORY' && nav.mainCategoryId) {
          const mc = mainMap.get(nav.mainCategoryId);
          if (!mc || mc.isActive === false || mc.showInNavigation === false) return false;
        }
        return true;
      });
  }, [taxonomy.desktopNavigation, taxonomy.mainCategories]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Centralized Catalog & Navigation Management"
        description="Single source of truth for Customer Desktop Navigation, Main Categories, Child Categories, Product Types, Dynamic Fields & Vendor approvals."
        actions={
          <div className="flex flex-wrap gap-1.5">
            <Button variant={sectionTab === 'NAVIGATION' ? 'primary' : 'outline'} size="sm" onClick={() => setSectionTab('NAVIGATION')}>
              <Monitor className="w-4 h-4" /> Desktop Navigation
            </Button>
            <Button variant={sectionTab === 'MAIN_CATEGORIES' ? 'primary' : 'outline'} size="sm" onClick={() => setSectionTab('MAIN_CATEGORIES')}>
              <Layers className="w-4 h-4" /> Main Categories
            </Button>
            <Button variant={sectionTab === 'CHILD_CATEGORIES' ? 'primary' : 'outline'} size="sm" onClick={() => setSectionTab('CHILD_CATEGORIES')}>
              <FolderTree className="w-4 h-4" /> Child Categories
            </Button>
            <Button variant={sectionTab === 'PRODUCT_TYPES' ? 'primary' : 'outline'} size="sm" onClick={() => setSectionTab('PRODUCT_TYPES')}>
              <Compass className="w-4 h-4" /> Product Types
            </Button>
            <Button variant={sectionTab === 'FIELDS' ? 'primary' : 'outline'} size="sm" onClick={() => setSectionTab('FIELDS')}>
              <Sliders className="w-4 h-4" /> Dynamic Fields
            </Button>
            <Button variant={sectionTab === 'PRODUCTS' ? 'primary' : 'outline'} size="sm" onClick={() => setSectionTab('PRODUCTS')}>
              <Package className="w-4 h-4" /> Products
            </Button>
            <Button variant={sectionTab === 'NEW_LAUNCHES' ? 'primary' : 'outline'} size="sm" onClick={() => setSectionTab('NEW_LAUNCHES')}>
              <Sparkles className="w-4 h-4" /> New Launches
            </Button>
          </div>
        }
      />

      {/* Centralized Draft & Publish Synchronization Bar */}
      {(sectionTab === 'NAVIGATION' ||
        sectionTab === 'MAIN_CATEGORIES' ||
        sectionTab === 'CHILD_CATEGORIES' ||
        sectionTab === 'PRODUCT_TYPES') && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${
            taxonomy.publishMetadata?.hasUnpublishedChanges
              ? 'bg-amber-50 border-amber-300 text-amber-950'
              : 'bg-[#FAF7F4] border-[#E5DCD3] text-[#5E5946]'
          }`}
        >
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={taxonomy.publishMetadata?.hasUnpublishedChanges ? 'warning' : 'success'}>
                {taxonomy.publishMetadata?.hasUnpublishedChanges ? 'Unpublished Draft Changes' : `Published Live (v${taxonomy.publishMetadata?.publishedVersion || 1})`}
              </Badge>
              {taxonomy.publishMetadata?.lastPublishedAt && (
                <span className="text-[11px] text-[#6E6859]">
                  Last published: {new Date(taxonomy.publishMetadata.lastPublishedAt).toLocaleString()}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#6E6859]">
              Changes saved in Draft Mode can be previewed in Desktop Navigation before publishing atomically to Vendor Portal & Customer Website.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-[#E5DCD3] cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={workInDraftMode}
                onChange={(e) => setWorkInDraftMode(e.target.checked)}
              />
              <span>Stage as Draft First</span>
            </label>
            {taxonomy.publishMetadata?.hasUnpublishedChanges && (
              <Button size="sm" variant="outline" onClick={handleDiscardDraft}>
                <RotateCcw className="w-3.5 h-3.5" /> Discard Draft
              </Button>
            )}
            <Button size="sm" variant="dark" onClick={handlePublishCatalog} disabled={publishing}>
              <Send className="w-3.5 h-3.5" />
              {publishing ? 'Publishing...' : 'Publish to Vendor & Customer'}
            </Button>
          </div>
        </div>
      )}

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
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${statusFilter === t.id
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
      ) : sectionTab === 'NAVIGATION' ? (
        <div className="space-y-5">
          {/* Interactive Desktop Header Preview (Before Publishing) */}
          <Card
            title="Customer Desktop Header Preview"
            subtitle="Hover over Main Categories below to preview live two-column Child Category dropdowns exactly as Customers will see them"
            action={
              <Button size="sm" variant="outline" onClick={() => setShowNavPreview((p) => !p)}>
                <Eye className="w-3.5 h-3.5" /> {showNavPreview ? 'Hide Preview' : 'Show Preview'}
              </Button>
            }
          >
            {showNavPreview && (
              <div className="rounded-xl border border-[#E5DCD3] bg-slate-50 p-3 relative">
                <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs font-bold text-slate-700">
                  {navBarPreviewItems.map((nav) => {
                    const linkedMain = nav.mainCategoryId
                      ? taxonomy.mainCategories.find((m) => m.id === nav.mainCategoryId)
                      : null;
                    const isOpen = nav.hasDropdown && previewHoveredMainSlug === nav.slug;
                    return (
                      <div
                        key={nav.id}
                        onMouseEnter={() => {
                          if (nav.hasDropdown && (linkedMain || nav.itemType === 'NEW_LAUNCHES')) {
                            setPreviewHoveredMainSlug(nav.slug);
                            setPreviewHoveredChildSlug(null);
                          } else {
                            setPreviewHoveredMainSlug(null);
                          }
                        }}
                        onMouseLeave={() => {
                          setPreviewHoveredMainSlug(null);
                          setPreviewHoveredChildSlug(null);
                        }}
                        className="relative"
                      >
                        <div
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs transition-all cursor-default ${
                            nav.highlight
                              ? 'bg-orange-50 text-orange-700 border-orange-200'
                              : isOpen
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-white text-slate-700 border-slate-200'
                          }`}
                        >
                          {nav.itemType === 'HOME' && <Home className="w-3.5 h-3.5 text-orange-500" />}
                          {nav.itemType === 'NEW_LAUNCHES' && <Rocket className="w-3.5 h-3.5 text-orange-500" />}
                          {nav.itemType === 'DEALS' && <Sparkles className="w-3.5 h-3.5 text-orange-500" />}
                          <span>{nav.label}</span>
                          {nav.hasDropdown && <span className="text-[10px] opacity-70">▼</span>}
                        </div>

                        {isOpen && linkedMain && (
                          <div className="absolute left-0 top-full pt-1.5 z-40">
                            <div className="w-[480px] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex text-xs">
                              <div className="w-56 border-r border-slate-100 p-3 space-y-1 max-h-64 overflow-y-auto">
                                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold px-2 mb-1">
                                  Main Categories
                                </p>
                                {taxonomy.childCategories
                                  .filter((c) => c.mainCategoryId === linkedMain.id && c.isActive !== false)
                                  .map((cc) => (
                                    <div
                                      key={cc.id}
                                      onMouseEnter={() => setPreviewHoveredChildSlug(cc.slug)}
                                      className={`px-2.5 py-1.5 rounded-lg cursor-pointer flex items-center justify-between ${
                                        previewHoveredChildSlug === cc.slug
                                          ? 'bg-slate-900 text-white font-semibold'
                                          : 'text-slate-700 hover:bg-slate-100'
                                      }`}
                                    >
                                      <span className="truncate">{cc.name}</span>
                                      <span>›</span>
                                    </div>
                                  ))}
                              </div>
                              <div className="flex-1 bg-slate-50/70 p-3 space-y-1 max-h-64 overflow-y-auto">
                                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold px-1 mb-1">
                                  Child Categories
                                </p>
                                {(() => {
                                  const activeChild =
                                    taxonomy.childCategories.find((c) => c.slug === previewHoveredChildSlug) ||
                                    taxonomy.childCategories.find(
                                      (c) => c.mainCategoryId === linkedMain.id && c.isActive !== false
                                    );
                                  const pts = activeChild
                                    ? taxonomy.productTypes.filter(
                                        (pt) => pt.childCategoryId === activeChild.id && pt.isActive !== false
                                      )
                                    : [];
                                  if (pts.length === 0) {
                                    return <p className="text-[11px] text-slate-400 p-2">No active child types configured.</p>;
                                  }
                                  return pts.map((pt) => (
                                    <div
                                      key={pt.id}
                                      className="px-2.5 py-1.5 rounded-lg text-slate-700 bg-white border border-slate-100 truncate"
                                    >
                                      {pt.name}
                                    </div>
                                  ));
                                })()}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>

          {/* Drag & Drop Desktop Navigation Order Manager */}
          <Card
            title="Desktop Header Navigation Items"
            subtitle="Drag and drop rows (or use arrows) to reorder Customer website navigation, edit labels, assign Main Categories, or toggle visibility"
            action={
              <Button
                size="sm"
                onClick={() =>
                  setNavModal({
                    isNew: true,
                    label: '',
                    slug: '',
                    itemType: 'MAIN_CATEGORY',
                    mainCategoryId: taxonomy.mainCategories[0]?.id || '',
                    route: '',
                    hasDropdown: true,
                    highlight: false,
                    isVisible: true,
                    isActive: true,
                  })
                }
              >
                <Plus className="w-3.5 h-3.5" /> Add Navigation Item
              </Button>
            }
          >
            <div className="space-y-2 text-xs">
              {[...taxonomy.desktopNavigation]
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((nav, idx, arr) => {
                  const linkedMain = nav.mainCategoryId
                    ? taxonomy.mainCategories.find((m) => m.id === nav.mainCategoryId)
                    : null;
                  const effectivelyVisible =
                    nav.isActive !== false &&
                    nav.isVisible !== false &&
                    (!linkedMain || (linkedMain.isActive !== false && linkedMain.showInNavigation !== false));
                  return (
                    <div
                      key={nav.id}
                      draggable
                      onDragStart={() => setDraggedNavId(nav.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDropNav(nav.id)}
                      className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 transition-colors cursor-move ${
                        draggedNavId === nav.id
                          ? 'bg-[#F0DED0]/60 border-[#AE887B]'
                          : effectivelyVisible
                          ? 'bg-white border-[#E5DCD3] hover:bg-[#FAF7F4]'
                          : 'bg-slate-50 border-slate-200 opacity-75'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <GripVertical className="w-4 h-4 text-[#8E8777] shrink-0" />
                        <span className="w-7 h-7 rounded-lg bg-[#F0DED0] text-[#5E5946] font-bold flex items-center justify-center shrink-0">
                          #{nav.displayOrder}
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-bold text-[#5E5946]">{nav.label}</span>
                            <Badge variant="info">{nav.itemType}</Badge>
                            {nav.hasDropdown && <Badge variant="default">Dropdown ▼</Badge>}
                            <Badge variant={effectivelyVisible ? 'success' : 'error'}>
                              {effectivelyVisible ? 'Visible in Header' : 'Hidden'}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-[#6E6859] truncate">
                            Route: <code className="font-mono">{nav.route}</code>
                            {linkedMain ? ` • Linked Main Category: ${linkedMain.name}` : ''}
                            {linkedMain && linkedMain.isActive === false ? ' (Parent Main Inactive)' : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={idx === 0}
                          onClick={() => handleMoveNavOrder(nav.id, 'UP')}
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={idx === arr.length - 1}
                          onClick={() => handleMoveNavOrder(nav.id, 'DOWN')}
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            await adminApi.updateDesktopNavItem(nav.id, {
                              isVisible: !(nav.isVisible !== false),
                              saveAsDraft: workInDraftMode,
                            });
                            loadTaxonomy();
                          }}
                          title="Toggle Header Visibility"
                        >
                          {nav.isVisible !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </Button>
                        <Button
                          size="sm"
                          variant={nav.isActive !== false ? 'success' : 'outline'}
                          onClick={async () => {
                            await adminApi.updateDesktopNavItem(nav.id, {
                              isActive: !(nav.isActive !== false),
                              saveAsDraft: workInDraftMode,
                            });
                            loadTaxonomy();
                          }}
                        >
                          {nav.isActive !== false ? 'Active' : 'Inactive'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setNavModal({ ...nav })}>
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={async () => {
                            try {
                              await adminApi.deleteDesktopNavItem(nav.id, workInDraftMode);
                              pushToast({ title: 'Navigation Item Removed' });
                              loadTaxonomy();
                            } catch (err: any) {
                              pushToast({ title: 'Delete Failed', message: err.message, variant: 'error' });
                            }
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>
        </div>
      ) : sectionTab === 'MAIN_CATEGORIES' ? (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Main Category List */}
            <div className="lg:col-span-8">
              <Card
                title={`Main Categories (${taxonomy.mainCategories.length})`}
                subtitle="Manage top-level categories, slugs, images, sort order, status & header visibility"
                action={
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#6E6859] absolute left-2.5 top-2" />
                    <input
                      type="text"
                      placeholder="Filter main categories..."
                      value={catSearch}
                      onChange={(e) => setCatSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs bg-white border border-[#E5DCD3] rounded-lg w-48"
                    />
                  </div>
                }
              >
                <div className="space-y-2.5 text-xs">
                  {taxonomy.mainCategories
                    .filter((mc) => {
                      const q = catSearch.trim().toLowerCase();
                      return !q || mc.name.toLowerCase().includes(q) || mc.slug.toLowerCase().includes(q);
                    })
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((mc) => (
                      <div
                        key={mc.id}
                        className="p-3 rounded-xl border border-[#E5DCD3] bg-white flex flex-wrap items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {mc.image ? (
                            <img src={mc.image} alt={mc.name} className="w-10 h-10 rounded-lg object-cover border border-[#E5DCD3]" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-[#F0DED0] text-[#943D24] font-bold flex items-center justify-center">
                              #{mc.sortOrder}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-[#5E5946] truncate">
                              #{mc.sortOrder} {mc.name}{' '}
                              <code className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#FAF7F4] border border-[#E5DCD3] text-[#6E6859]">
                                /{mc.slug}
                              </code>
                            </p>
                            <p className="text-[11px] text-[#6E6859] truncate">
                              {mc.childCount ?? 0} child categories • {mc.productCount ?? 0} products •{' '}
                              {mc.showInNavigation !== false ? 'In Desktop Header' : 'Hidden from Header'}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Button
                            size="sm"
                            variant={mc.showInNavigation !== false ? 'secondary' : 'outline'}
                            onClick={async () => {
                              await adminApi.updateMainCategory(mc.id, {
                                showInNavigation: !(mc.showInNavigation !== false),
                                saveAsDraft: workInDraftMode,
                              });
                              loadTaxonomy();
                            }}
                          >
                            {mc.showInNavigation !== false ? 'In Header' : 'Nav Off'}
                          </Button>
                          <Button
                            size="sm"
                            variant={mc.isActive !== false ? 'success' : 'outline'}
                            onClick={async () => {
                              await adminApi.updateMainCategory(mc.id, {
                                isActive: !(mc.isActive !== false),
                                saveAsDraft: workInDraftMode,
                              });
                              loadTaxonomy();
                            }}
                          >
                            {mc.isActive !== false ? 'Active' : 'Inactive'}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setMainEditModal({ ...mc })}>
                            <Edit3 className="w-3.5 h-3.5" /> Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() =>
                              setDeleteTargetModal({
                                kind: 'MAIN',
                                item: mc,
                                reassignToId: taxonomy.mainCategories.find((m) => m.id !== mc.id && m.isActive !== false)?.id || '',
                              })
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </Card>
            </div>

            {/* Add Main Category Form */}
            <div className="lg:col-span-4">
              <Card title="Add Main Category" subtitle="Create new top-level navigation category">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      await adminApi.createMainCategory({
                        name: mainForm.name,
                        slug: mainForm.slug || undefined,
                        sortOrder: Number(mainForm.sortOrder) || 99,
                        description: mainForm.description,
                        image: mainForm.image,
                        showInNavigation: mainForm.showInNavigation,
                        saveAsDraft: workInDraftMode,
                      });
                      setMainForm({
                        name: '',
                        slug: '',
                        sortOrder: String(taxonomy.mainCategories.length + 2),
                        description: '',
                        image: '',
                        showInNavigation: true,
                      });
                      pushToast({
                        title: workInDraftMode ? 'Main Category Staged in Draft' : 'Main Category Published',
                      });
                      loadTaxonomy();
                    } catch (err: any) {
                      pushToast({ title: 'Error', message: err.message, variant: 'error' });
                    }
                  }}
                  className="space-y-2.5 text-xs"
                >
                  <input
                    required
                    placeholder="Main category name *"
                    value={mainForm.name}
                    onChange={(e) => setMainForm({ ...mainForm, name: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E5DCD3] rounded-lg"
                  />
                  <input
                    placeholder="Custom URL slug (optional)"
                    value={mainForm.slug}
                    onChange={(e) => setMainForm({ ...mainForm, slug: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E5DCD3] rounded-lg font-mono"
                  />
                  <textarea
                    rows={2}
                    placeholder="Description"
                    value={mainForm.description}
                    onChange={(e) => setMainForm({ ...mainForm, description: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E5DCD3] rounded-lg"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      placeholder="Image URL or upload"
                      value={mainForm.image}
                      onChange={(e) => setMainForm({ ...mainForm, image: e.target.value })}
                      className="flex-1 px-2.5 py-1.5 bg-white border border-[#E5DCD3] rounded-lg"
                    />
                    <label className="px-2.5 py-1.5 rounded-lg border border-[#E5DCD3] bg-[#FAF7F4] cursor-pointer font-semibold">
                      <Upload className="w-3.5 h-3.5 inline mr-1" /> Upload
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          try {
                            const res = await adminApi.uploadCatalogImage(f);
                            setMainForm((prev) => ({ ...prev, image: res.url }));
                          } catch (err: any) {
                            pushToast({ title: 'Upload Failed', message: err.message, variant: 'error' });
                          }
                        }}
                      />
                    </label>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="number"
                      min={1}
                      placeholder="Order"
                      value={mainForm.sortOrder}
                      onChange={(e) => setMainForm({ ...mainForm, sortOrder: e.target.value })}
                      className="w-20 px-2 py-1.5 bg-white border border-[#E5DCD3] rounded-lg"
                    />
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={mainForm.showInNavigation}
                        onChange={(e) => setMainForm({ ...mainForm, showInNavigation: e.target.checked })}
                      />
                      <span>Show in Header</span>
                    </label>
                  </div>
                  <Button size="sm" type="submit" className="w-full">
                    <Plus className="w-3.5 h-3.5" /> {workInDraftMode ? 'Save Main Category Draft' : 'Add & Publish Main Category'}
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        </div>
      ) : sectionTab === 'CHILD_CATEGORIES' ? (
        <div className="space-y-5">
          <div className="p-3.5 rounded-xl bg-[#FAF7F4] border border-[#E5DCD3] text-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="font-semibold text-[#5E5946]">
                Category Hierarchy: {taxonomy.mainCategories.length} Main Categories •{' '}
                {taxonomy.childCategories.length} Child Categories
              </p>
              {taxonomy.migrationSummary && (
                <p className="text-[#6E6859]">
                  Catalog Synced: <strong>{taxonomy.migrationSummary.migrated}</strong> /{' '}
                  {taxonomy.migrationSummary.totalRecords} records (Unmapped: {taxonomy.migrationSummary.unmapped})
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#6E6859] absolute left-2.5 top-2" />
                <input
                  type="text"
                  placeholder="Search main or child categories..."
                  value={catSearch}
                  onChange={(e) => setCatSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-white border border-[#E5DCD3] rounded-lg w-56"
                />
              </div>
              {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setCatActiveFilter(st)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border ${catActiveFilter === st
                    ? 'bg-[#AE887B] text-white border-[#AE887B]'
                    : 'bg-white text-[#5E5946] border-[#E5DCD3]'
                    }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-8">
              <Card
                title="Main Category └── Child Categories Hierarchy"
                subtitle="Assign Child Categories to Main Categories, edit images/order, move parents safely, or configure dynamic fields"
              >
                <div className="space-y-3 text-xs">
                  {taxonomy.mainCategories
                    .filter((mc) => {
                      if (catActiveFilter === 'ACTIVE' && mc.isActive === false) return false;
                      if (catActiveFilter === 'INACTIVE' && mc.isActive !== false) return false;
                      const q = catSearch.trim().toLowerCase();
                      if (!q) return true;
                      const childMatches = taxonomy.childCategories.some(
                        (c) => c.mainCategoryId === mc.id && c.name.toLowerCase().includes(q)
                      );
                      return mc.name.toLowerCase().includes(q) || childMatches;
                    })
                    .map((mc) => {
                      const q = catSearch.trim().toLowerCase();
                      const children = taxonomy.childCategories.filter((c) => {
                        if (c.mainCategoryId !== mc.id) return false;
                        if (catActiveFilter === 'ACTIVE' && c.isActive === false) return false;
                        if (catActiveFilter === 'INACTIVE' && c.isActive !== false) return false;
                        if (q && !c.name.toLowerCase().includes(q) && !mc.name.toLowerCase().includes(q)) return false;
                        return true;
                      });
                      return (
                        <div key={mc.id} className="rounded-xl border border-[#E5DCD3] bg-white overflow-hidden">
                          <div className="p-3 bg-[#FAF7F4] flex flex-wrap items-center justify-between gap-2 border-b border-[#E5DCD3]">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-[#F0DED0] flex items-center justify-center text-[#943D24] font-bold">
                                #{mc.sortOrder}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-[#5E5946] truncate">
                                  {mc.name} <span className="font-normal text-[#6E6859]">({children.length} child)</span>
                                </p>
                                <p className="text-[11px] text-[#6E6859] truncate">/{mc.slug}</p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                setChildEditModal({
                                  isNew: true,
                                  mainCategoryId: mc.id,
                                  name: '',
                                  slug: '',
                                  description: '',
                                  image: '',
                                  sortOrder: children.length + 1,
                                  isActive: true,
                                })
                              }
                            >
                              <Plus className="w-3.5 h-3.5" /> Add Child
                            </Button>
                          </div>
                          <div className="p-2.5 pl-6 space-y-1.5">
                            {children.length === 0 ? (
                              <p className="text-[#8E8777] italic py-1">No matching child categories under this Main Category.</p>
                            ) : (
                              children.map((cc) => (
                                <div
                                  key={cc.id}
                                  className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg hover:bg-[#FAF7F4] border border-transparent hover:border-[#E5DCD3]"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <span className="text-[#8E8777] font-mono">└──</span>
                                    {cc.image ? (
                                      <img src={cc.image} alt={cc.name} className="w-7 h-7 rounded object-cover border border-[#E5DCD3]" />
                                    ) : null}
                                    <div className="min-w-0">
                                      <p className="font-semibold text-[#5E5946] truncate">
                                        #{cc.sortOrder} {cc.name}{' '}
                                        <span className="font-mono text-[10px] text-[#8E8777]">/{cc.slug}</span>
                                      </p>
                                      <p className="text-[11px] text-[#6E6859]">
                                        {cc.productCount ?? 0} products • {cc.fieldCount ?? 0} fields
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedFieldChildId(cc.id);
                                        setSectionTab('FIELDS');
                                      }}
                                    >
                                      <Sliders className="w-3 h-3" /> Fields
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setChildEditModal({ ...cc, originalMainId: cc.mainCategoryId })}
                                    >
                                      <Edit3 className="w-3 h-3" /> Edit / Move
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant={cc.isActive !== false ? 'success' : 'outline'}
                                      onClick={async () => {
                                        await adminApi.updateChildCategory(cc.id, {
                                          isActive: !(cc.isActive !== false),
                                          saveAsDraft: workInDraftMode,
                                        });
                                        loadTaxonomy();
                                      }}
                                    >
                                      {cc.isActive !== false ? 'Active' : 'Inactive'}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="danger"
                                      onClick={() =>
                                        setDeleteTargetModal({
                                          kind: 'CHILD',
                                          item: cc,
                                          reassignToId: taxonomy.childCategories.find((c) => c.id !== cc.id && c.isActive !== false)?.id || '',
                                        })
                                      }
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </Card>
            </div>

            <div className="lg:col-span-4">
              <Card title="Add Child Category" subtitle="Must belong to a Main Category">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      await adminApi.createChildCategory({
                        mainCategoryId: childForm.mainCategoryId,
                        name: childForm.name,
                        slug: childForm.slug || undefined,
                        sortOrder: Number(childForm.sortOrder) || 99,
                        description: childForm.description,
                        image: childForm.image,
                        saveAsDraft: workInDraftMode,
                      });
                      setChildForm({ ...childForm, name: '', slug: '', description: '', image: '' });
                      pushToast({
                        title: workInDraftMode ? 'Child Category Saved to Draft' : 'Child Category Published',
                      });
                      loadTaxonomy();
                    } catch (err: any) {
                      pushToast({ title: 'Error', message: err.message, variant: 'error' });
                    }
                  }}
                  className="space-y-2.5 text-xs"
                >
                  <select
                    value={childForm.mainCategoryId}
                    onChange={(e) => setChildForm({ ...childForm, mainCategoryId: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E5DCD3] rounded-lg"
                  >
                    {taxonomy.mainCategories.map((mc) => (
                      <option key={mc.id} value={mc.id}>
                        Parent: {mc.name}
                      </option>
                    ))}
                  </select>
                  <input
                    required
                    placeholder="New child category name *"
                    value={childForm.name}
                    onChange={(e) => setChildForm({ ...childForm, name: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E5DCD3] rounded-lg"
                  />
                  <input
                    placeholder="Custom URL slug (optional)"
                    value={childForm.slug}
                    onChange={(e) => setChildForm({ ...childForm, slug: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E5DCD3] rounded-lg font-mono"
                  />
                  <textarea
                    rows={2}
                    placeholder="Description"
                    value={childForm.description}
                    onChange={(e) => setChildForm({ ...childForm, description: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E5DCD3] rounded-lg"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={1}
                      placeholder="Order"
                      value={childForm.sortOrder}
                      onChange={(e) => setChildForm({ ...childForm, sortOrder: e.target.value })}
                      className="w-20 px-2 py-1.5 bg-white border border-[#E5DCD3] rounded-lg"
                    />
                    <Button size="sm" type="submit" className="flex-1">
                      <Plus className="w-3.5 h-3.5" /> Add Child Category
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          </div>
        </div>
      ) : sectionTab === 'PRODUCT_TYPES' ? (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-8">
              <Card
                title={`Product Type Management (${taxonomy.productTypes.length})`}
                subtitle="Manage child classifications displayed in navigation second column and product filtering"
                action={
                  <select
                    value={ptChildFilter}
                    onChange={(e) => setPtChildFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs bg-white border border-[#E5DCD3] rounded-lg"
                  >
                    <option value="ALL">All Child Categories ({taxonomy.childCategories.length})</option>
                    {taxonomy.childCategories.map((cc) => (
                      <option key={cc.id} value={cc.id}>
                        {cc.name}
                      </option>
                    ))}
                  </select>
                }
              >
                <div className="divide-y divide-[#E5DCD3] max-h-[520px] overflow-y-auto text-xs">
                  {taxonomy.productTypes
                    .filter((pt) => ptChildFilter === 'ALL' || pt.childCategoryId === ptChildFilter)
                    .map((pt) => {
                      const parentChild = taxonomy.childCategories.find((c) => c.id === pt.childCategoryId);
                      return (
                        <div key={pt.id} className="py-2.5 flex flex-wrap items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-[#5E5946] truncate">
                              #{pt.sortOrder} {pt.name}{' '}
                              <code className="font-mono text-[10px] text-[#8E8777]">/{pt.slug}</code>
                            </p>
                            <p className="text-[11px] text-[#6E6859]">
                              Under: {parentChild?.name || pt.childCategorySlug} • {pt.productCount ?? 0} products
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant={pt.isActive !== false ? 'success' : 'outline'}
                              onClick={async () => {
                                await adminApi.updateProductType(pt.id, {
                                  isActive: !(pt.isActive !== false),
                                  saveAsDraft: workInDraftMode,
                                });
                                loadTaxonomy();
                              }}
                            >
                              {pt.isActive !== false ? 'Active' : 'Inactive'}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setProductTypeModal({ ...pt })}>
                              <Edit3 className="w-3 h-3" /> Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() =>
                                setDeleteTargetModal({
                                  kind: 'TYPE',
                                  item: pt,
                                  reassignToId:
                                    taxonomy.productTypes.find(
                                      (t) => t.id !== pt.id && t.childCategoryId === pt.childCategoryId
                                    )?.id || '',
                                })
                              }
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </Card>
            </div>

            <div className="lg:col-span-4 space-y-5">
              <Card title="Add Product Type" subtitle="Create classification under a Child Category">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      await adminApi.createProductType({
                        childCategoryId: typeForm.childCategoryId,
                        name: typeForm.name,
                        slug: typeForm.slug || undefined,
                        sortOrder: Number(typeForm.sortOrder) || 99,
                        saveAsDraft: workInDraftMode,
                      });
                      setTypeForm({ ...typeForm, name: '', slug: '' });
                      pushToast({ title: 'Product Type Added' });
                      loadTaxonomy();
                    } catch (err: any) {
                      pushToast({ title: 'Error', message: err.message, variant: 'error' });
                    }
                  }}
                  className="space-y-2.5 text-xs"
                >
                  <select
                    value={typeForm.childCategoryId}
                    onChange={(e) => setTypeForm({ ...typeForm, childCategoryId: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E5DCD3] rounded-lg"
                  >
                    {taxonomy.childCategories.map((cc) => (
                      <option key={cc.id} value={cc.id}>
                        Child: {cc.name}
                      </option>
                    ))}
                  </select>
                  <input
                    required
                    placeholder="Product Type name *"
                    value={typeForm.name}
                    onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E5DCD3] rounded-lg"
                  />
                  <input
                    placeholder="Custom slug (optional)"
                    value={typeForm.slug}
                    onChange={(e) => setTypeForm({ ...typeForm, slug: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E5DCD3] rounded-lg font-mono"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={1}
                      placeholder="Order"
                      value={typeForm.sortOrder}
                      onChange={(e) => setTypeForm({ ...typeForm, sortOrder: e.target.value })}
                      className="w-20 px-2 py-1.5 bg-white border border-[#E5DCD3] rounded-lg"
                    />
                    <Button size="sm" type="submit" className="flex-1">
                      <Plus className="w-3.5 h-3.5" /> Add Product Type
                    </Button>
                  </div>
                </form>
              </Card>

              <Card title="Approved Brands" subtitle={`${taxonomy.brands.length} listed`}>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await adminApi.createBrand(brandForm);
                    setBrandForm({ name: '', description: '' });
                    pushToast({ title: 'Brand Added' });
                    loadTaxonomy();
                  }}
                  className="flex gap-2 mb-3"
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
                <div className="divide-y divide-[#E5DCD3] max-h-40 overflow-y-auto text-xs">
                  {taxonomy.brands.map((b) => (
                    <div key={b.id} className="py-1.5 flex justify-between">
                      <span className="font-medium text-[#5E5946]">{b.name}</span>
                      <Badge variant="info">{b.slug}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      ) : sectionTab === 'FIELDS' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Select Child Category */}
          <div className="lg:col-span-4">
            <Card title="Child Categories" subtitle="Select a category to configure its dynamic Vendor fields">
              <div className="space-y-1.5 max-h-[540px] overflow-y-auto text-xs">
                {taxonomy.childCategories.map((cc) => {
                  const count = (taxonomy.fieldSchemas || []).filter(
                    (f) => f.childCategoryId === cc.id || f.childCategorySlug === cc.slug
                  ).length;
                  const active = selectedFieldChildId === cc.id;
                  return (
                    <button
                      key={cc.id}
                      type="button"
                      onClick={() => setSelectedFieldChildId(cc.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors flex items-center justify-between gap-2 ${active
                        ? 'bg-[#943D24] text-white border-[#943D24]'
                        : 'bg-white text-[#5E5946] border-[#E5DCD3] hover:bg-[#FAF7F4]'
                        }`}
                    >
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{cc.name}</p>
                        <p className={`text-[10px] truncate ${active ? 'text-white/80' : 'text-[#8E8777]'}`}>
                          {cc.mainCategoryName || cc.mainCategorySlug}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${active ? 'bg-white/20 text-white' : 'bg-[#FAF7F4] text-[#6E6859]'
                          }`}
                      >
                        {count} fields
                      </span>
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Right: Fields List + Add/Edit/Delete */}
          <div className="lg:col-span-8">
            {(() => {
              const selectedChild =
                taxonomy.childCategories.find((c) => c.id === selectedFieldChildId) ||
                taxonomy.childCategories[0];
              const fieldsForChild = (taxonomy.fieldSchemas || [])
                .filter(
                  (f) =>
                    selectedChild &&
                    (f.childCategoryId === selectedChild.id || f.childCategorySlug === selectedChild.slug)
                )
                .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

              return (
                <Card
                  title={`Dynamic Form Fields — ${selectedChild?.name || ''}`}
                  subtitle="Changes sync immediately to Vendor Product Creation Step 2 without code deployments"
                >
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="text-xs text-[#6E6859]">
                      Showing <strong>{fieldsForChild.length}</strong> configured fields for{' '}
                      <strong>{selectedChild?.name}</strong>
                    </span>
                    {selectedChild && (
                      <Button
                        size="sm"
                        onClick={() =>
                          setFieldModal({
                            isNew: true,
                            childCategoryId: selectedChild.id,
                            childCategorySlug: selectedChild.slug,
                            label: '',
                            fieldKey: '',
                            fieldType: 'text',
                            optionsCsv: '',
                            required: false,
                            placeholder: '',
                            helpText: '',
                            unitSuffix: '',
                            group: 'Core Product Attributes',
                            displayOrder: fieldsForChild.length + 1,
                            validation: {},
                            isActive: true,
                          })
                        }
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Field
                      </Button>
                    )}
                  </div>

                  {fieldsForChild.length === 0 ? (
                    <EmptyState
                      icon={<Sliders className="w-5 h-5" />}
                      title="No fields configured yet"
                      description="Click Add Field to configure category-specific fields for Vendors."
                    />
                  ) : (
                    <div className="space-y-2.5 text-xs">
                      {fieldsForChild.map((f) => (
                        <div
                          key={f.id}
                          className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${f.isActive !== false ? 'bg-white border-[#E5DCD3]' : 'bg-slate-50 border-slate-200 opacity-70'
                            }`}
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#FAF7F4] border border-[#E5DCD3] text-[#6E6859]">
                                #{f.displayOrder}
                              </span>
                              <span className="font-bold text-[#5E5946]">{f.label}</span>
                              <Badge variant="info">{f.fieldType}</Badge>
                              {f.required ? <Badge variant="warning">Required</Badge> : <Badge variant="default">Optional</Badge>}
                              {f.isActive === false && <Badge variant="error">Inactive</Badge>}
                            </div>
                            <p className="text-[11px] text-[#6E6859]">
                              Key: <code className="font-mono">{f.fieldKey}</code> • Section: {f.group || 'Core Product Attributes'}
                              {f.unitSuffix ? ` • Unit: ${f.unitSuffix}` : ''}
                            </p>
                            {Array.isArray(f.options) && f.options.length > 0 && (
                              <p className="text-[11px] text-[#8E8777] truncate">
                                Options: {f.options.join(', ')}
                              </p>
                            )}
                            {f.validation && Object.keys(f.validation).length > 0 && (
                              <p className="text-[11px] text-[#8E8777]">
                                Validation: {JSON.stringify(f.validation)}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setFieldModal({
                                  ...f,
                                  optionsCsv: Array.isArray(f.options) ? f.options.join(', ') : '',
                                  validation: f.validation || {},
                                })
                              }
                            >
                              <Edit3 className="w-3.5 h-3.5" /> Edit
                            </Button>
                            <Button
                              size="sm"
                              variant={f.isActive !== false ? 'success' : 'outline'}
                              onClick={async () => {
                                await adminApi.updateCategoryField(f.id, { isActive: !(f.isActive !== false) });
                                loadTaxonomy();
                              }}
                            >
                              {f.isActive !== false ? 'Active' : 'Off'}
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={async () => {
                                await adminApi.deleteCategoryField(f.id);
                                pushToast({ title: 'Field Removed', message: `${f.label} deleted.` });
                                loadTaxonomy();
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })()}
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

      {/* Edit Main Category Modal */}
      <Modal
        open={Boolean(mainEditModal)}
        onClose={() => setMainEditModal(null)}
        title={`Edit Main Category — ${mainEditModal?.name || ''}`}
      >
        {mainEditModal && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await adminApi.updateMainCategory(mainEditModal.id, {
                  name: mainEditModal.name,
                  slug: mainEditModal.slug,
                  description: mainEditModal.description,
                  image: mainEditModal.image,
                  sortOrder: Number(mainEditModal.sortOrder) || 1,
                  isActive: mainEditModal.isActive !== false,
                  showInNavigation: mainEditModal.showInNavigation !== false,
                  saveAsDraft: workInDraftMode,
                });
                pushToast({
                  title: workInDraftMode ? 'Main Category Staged in Draft' : 'Main Category Published',
                });
                setMainEditModal(null);
                loadTaxonomy();
              } catch (err: any) {
                pushToast({ title: 'Update Failed', message: err.message, variant: 'error' });
              }
            }}
            className="space-y-3 text-xs"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-[#5E5946] mb-1">Category Name *</label>
                <input
                  required
                  value={mainEditModal.name || ''}
                  onChange={(e) => setMainEditModal({ ...mainEditModal, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#5E5946] mb-1">URL Slug *</label>
                <input
                  required
                  value={mainEditModal.slug || ''}
                  onChange={(e) => setMainEditModal({ ...mainEditModal, slug: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-[#5E5946] mb-1">Description</label>
              <textarea
                rows={2}
                value={mainEditModal.description || ''}
                onChange={(e) => setMainEditModal({ ...mainEditModal, description: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#5E5946] mb-1">Category Image</label>
              <div className="flex items-center gap-2">
                <input
                  value={mainEditModal.image || ''}
                  onChange={(e) => setMainEditModal({ ...mainEditModal, image: e.target.value })}
                  placeholder="https://... or upload below"
                  className="flex-1 px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                />
                <label className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-[#E5DCD3] bg-[#FAF7F4] cursor-pointer font-semibold">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingImage ? 'Uploading...' : 'Upload'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setUploadingImage(true);
                      try {
                        const res = await adminApi.uploadCatalogImage(f);
                        setMainEditModal((prev: any) => ({ ...prev, image: res.url }));
                      } catch (err: any) {
                        pushToast({ title: 'Upload Failed', message: err.message, variant: 'error' });
                      } finally {
                        setUploadingImage(false);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-semibold text-[#5E5946] mb-1">Display Order</label>
                <input
                  type="number"
                  min={1}
                  value={mainEditModal.sortOrder ?? 1}
                  onChange={(e) => setMainEditModal({ ...mainEditModal, sortOrder: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                />
              </div>
              <label className="flex items-center gap-2 pt-5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mainEditModal.isActive !== false}
                  onChange={(e) => setMainEditModal({ ...mainEditModal, isActive: e.target.checked })}
                />
                <span className="font-semibold text-[#5E5946]">Active</span>
              </label>
              <label className="flex items-center gap-2 pt-5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mainEditModal.showInNavigation !== false}
                  onChange={(e) => setMainEditModal({ ...mainEditModal, showInNavigation: e.target.checked })}
                />
                <span className="font-semibold text-[#5E5946]">Show in Header</span>
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setMainEditModal(null)}>
                Cancel
              </Button>
              <Button type="submit">Save Main Category</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Create / Edit / Move Child Category Modal */}
      <Modal
        open={Boolean(childEditModal)}
        onClose={() => setChildEditModal(null)}
        title={childEditModal?.isNew ? 'Add Child Category' : `Edit / Move Child Category — ${childEditModal?.name || ''}`}
      >
        {childEditModal && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                if (childEditModal.isNew) {
                  await adminApi.createChildCategory({
                    mainCategoryId: childEditModal.mainCategoryId,
                    name: childEditModal.name,
                    slug: childEditModal.slug || undefined,
                    description: childEditModal.description,
                    image: childEditModal.image,
                    sortOrder: Number(childEditModal.sortOrder) || 1,
                    isActive: childEditModal.isActive !== false,
                    saveAsDraft: workInDraftMode,
                  });
                  pushToast({ title: workInDraftMode ? 'Child Category Staged in Draft' : 'Child Category Created' });
                } else {
                  const updated = await adminApi.updateChildCategory(childEditModal.id, {
                    mainCategoryId: childEditModal.mainCategoryId,
                    name: childEditModal.name,
                    slug: childEditModal.slug || undefined,
                    description: childEditModal.description,
                    image: childEditModal.image,
                    sortOrder: Number(childEditModal.sortOrder) || 1,
                    isActive: childEditModal.isActive !== false,
                    saveAsDraft: workInDraftMode,
                  });
                  pushToast({
                    title: workInDraftMode ? 'Child Category Staged in Draft' : 'Child Category Updated',
                    message:
                      updated?.migratedProductsCount > 0
                        ? `Updated ${updated.migratedProductsCount} linked products cleanly.`
                        : 'Saved cleanly.',
                  });
                }
                setChildEditModal(null);
                loadTaxonomy();
              } catch (err: any) {
                pushToast({ title: 'Save Failed', message: err.message, variant: 'error' });
              }
            }}
            className="space-y-3 text-xs"
          >
            <div>
              <label className="block font-semibold text-[#5E5946] mb-1">Parent Main Category *</label>
              <select
                value={childEditModal.mainCategoryId || ''}
                onChange={(e) => setChildEditModal({ ...childEditModal, mainCategoryId: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                required
              >
                {taxonomy.mainCategories.map((mc) => (
                  <option key={mc.id} value={mc.id}>
                    {mc.name}
                  </option>
                ))}
              </select>
              {!childEditModal.isNew &&
                childEditModal.originalMainId &&
                childEditModal.mainCategoryId !== childEditModal.originalMainId && (
                  <p className="mt-1.5 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Moving this Child Category will update {childEditModal.productCount ?? 0} linked product(s) to the new Main Category.
                    </span>
                  </p>
                )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-[#5E5946] mb-1">Child Category Name *</label>
                <input
                  required
                  value={childEditModal.name || ''}
                  onChange={(e) => setChildEditModal({ ...childEditModal, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#5E5946] mb-1">URL Slug</label>
                <input
                  value={childEditModal.slug || ''}
                  onChange={(e) => setChildEditModal({ ...childEditModal, slug: e.target.value })}
                  placeholder="auto-generated"
                  className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-[#5E5946] mb-1">Description</label>
              <textarea
                rows={2}
                value={childEditModal.description || ''}
                onChange={(e) => setChildEditModal({ ...childEditModal, description: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#5E5946] mb-1">Category Image</label>
              <div className="flex items-center gap-2">
                <input
                  value={childEditModal.image || ''}
                  onChange={(e) => setChildEditModal({ ...childEditModal, image: e.target.value })}
                  placeholder="https://... or upload"
                  className="flex-1 px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                />
                <label className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-[#E5DCD3] bg-[#FAF7F4] cursor-pointer font-semibold">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingImage ? 'Uploading...' : 'Upload'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setUploadingImage(true);
                      try {
                        const res = await adminApi.uploadCatalogImage(f);
                        setChildEditModal((prev: any) => ({ ...prev, image: res.url }));
                      } catch (err: any) {
                        pushToast({ title: 'Upload Failed', message: err.message, variant: 'error' });
                      } finally {
                        setUploadingImage(false);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-[#5E5946] mb-1">Display Order</label>
                <input
                  type="number"
                  min={1}
                  value={childEditModal.sortOrder ?? 1}
                  onChange={(e) => setChildEditModal({ ...childEditModal, sortOrder: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                />
              </div>
              <label className="flex items-center gap-2 pt-5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={childEditModal.isActive !== false}
                  onChange={(e) => setChildEditModal({ ...childEditModal, isActive: e.target.checked })}
                />
                <span className="font-semibold text-[#5E5946]">Active</span>
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setChildEditModal(null)}>
                Cancel
              </Button>
              <Button type="submit">{childEditModal.isNew ? 'Create Child Category' : 'Save Child Category'}</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Add / Edit Dynamic Category Field Schema Modal */}
      <Modal
        open={Boolean(fieldModal)}
        onClose={() => setFieldModal(null)}
        title={fieldModal?.isNew ? 'Add Dynamic Category Field' : `Edit Field — ${fieldModal?.label || ''}`}
      >
        {fieldModal && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const payload = {
                  childCategoryId: fieldModal.childCategoryId,
                  label: fieldModal.label,
                  fieldKey: fieldModal.fieldKey || undefined,
                  fieldType: fieldModal.fieldType,
                  options:
                    fieldModal.fieldType === 'dropdown' || fieldModal.fieldType === 'multiselect'
                      ? String(fieldModal.optionsCsv || '')
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean)
                      : undefined,
                  required: Boolean(fieldModal.required),
                  placeholder: fieldModal.placeholder || undefined,
                  helpText: fieldModal.helpText || undefined,
                  unitSuffix: fieldModal.unitSuffix || undefined,
                  group: fieldModal.group || 'Core Product Attributes',
                  displayOrder: Number(fieldModal.displayOrder) || 1,
                  isActive: fieldModal.isActive !== false,
                  validation: {
                    ...(fieldModal.validation?.min !== undefined && fieldModal.validation?.min !== '' ? { min: Number(fieldModal.validation.min) } : {}),
                    ...(fieldModal.validation?.max !== undefined && fieldModal.validation?.max !== '' ? { max: Number(fieldModal.validation.max) } : {}),
                    ...(fieldModal.validation?.minLength !== undefined && fieldModal.validation?.minLength !== '' ? { minLength: Number(fieldModal.validation.minLength) } : {}),
                    ...(fieldModal.validation?.maxLength !== undefined && fieldModal.validation?.maxLength !== '' ? { maxLength: Number(fieldModal.validation.maxLength) } : {}),
                    ...(fieldModal.validation?.pattern ? { pattern: fieldModal.validation.pattern } : {}),
                  },
                };
                if (fieldModal.isNew) {
                  await adminApi.createCategoryField(payload);
                  pushToast({ title: 'Dynamic Field Added', message: 'Reflected immediately in Vendor product form.' });
                } else {
                  await adminApi.updateCategoryField(fieldModal.id, payload);
                  pushToast({ title: 'Dynamic Field Updated' });
                }
                setFieldModal(null);
                loadTaxonomy();
              } catch (err: any) {
                pushToast({ title: 'Save Failed', message: err.message, variant: 'error' });
              }
            }}
            className="space-y-3 text-xs"
          >
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-[#5E5946] mb-1">Field Label *</label>
                <input
                  required
                  value={fieldModal.label || ''}
                  onChange={(e) => setFieldModal({ ...fieldModal, label: e.target.value })}
                  placeholder="e.g. Compressive Strength"
                  className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#5E5946] mb-1">Field Type *</label>
                <select
                  value={fieldModal.fieldType || 'text'}
                  onChange={(e) => setFieldModal({ ...fieldModal, fieldType: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="dropdown">Dropdown</option>
                  <option value="multiselect">Multi-Select</option>
                  <option value="checkbox">Checkbox (Yes / No)</option>
                  <option value="textarea">Multi-line Text</option>
                </select>
              </div>
            </div>

            {(fieldModal.fieldType === 'dropdown' || fieldModal.fieldType === 'multiselect') && (
              <div>
                <label className="block font-semibold text-[#5E5946] mb-1">Options (comma separated) *</label>
                <input
                  required
                  value={fieldModal.optionsCsv || ''}
                  onChange={(e) => setFieldModal({ ...fieldModal, optionsCsv: e.target.value })}
                  placeholder="e.g. Grade 43, Grade 53, PPC"
                  className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-[#5E5946] mb-1">Section Group</label>
                <select
                  value={fieldModal.group || 'Core Product Attributes'}
                  onChange={(e) => setFieldModal({ ...fieldModal, group: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                >
                  <option value="Core Product Attributes">Core Product Attributes</option>
                  <option value="Dimensions & Packaging">Dimensions & Packaging</option>
                  <option value="Performance & Compliance">Performance & Compliance</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[#5E5946] mb-1">Display Order</label>
                <input
                  type="number"
                  min={1}
                  value={fieldModal.displayOrder ?? 1}
                  onChange={(e) => setFieldModal({ ...fieldModal, displayOrder: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-[#5E5946] mb-1">Placeholder</label>
                <input
                  value={fieldModal.placeholder || ''}
                  onChange={(e) => setFieldModal({ ...fieldModal, placeholder: e.target.value })}
                  placeholder="Helpful vendor hint"
                  className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#5E5946] mb-1">Unit Suffix (optional)</label>
                <input
                  value={fieldModal.unitSuffix || ''}
                  onChange={(e) => setFieldModal({ ...fieldModal, unitSuffix: e.target.value })}
                  placeholder="e.g. Kg, mm, W"
                  className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                />
              </div>
            </div>

            {fieldModal.fieldType === 'number' ? (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-[#5E5946] mb-1">Min Value</label>
                  <input
                    type="number"
                    value={fieldModal.validation?.min ?? ''}
                    onChange={(e) =>
                      setFieldModal({
                        ...fieldModal,
                        validation: { ...fieldModal.validation, min: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#5E5946] mb-1">Max Value</label>
                  <input
                    type="number"
                    value={fieldModal.validation?.max ?? ''}
                    onChange={(e) =>
                      setFieldModal({
                        ...fieldModal,
                        validation: { ...fieldModal.validation, max: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-[#5E5946] mb-1">Min Length</label>
                  <input
                    type="number"
                    value={fieldModal.validation?.minLength ?? ''}
                    onChange={(e) =>
                      setFieldModal({
                        ...fieldModal,
                        validation: { ...fieldModal.validation, minLength: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#5E5946] mb-1">Regex Pattern (optional)</label>
                  <input
                    value={fieldModal.validation?.pattern || ''}
                    onChange={(e) =>
                      setFieldModal({
                        ...fieldModal,
                        validation: { ...fieldModal.validation, pattern: e.target.value },
                      })
                    }
                    placeholder="e.g. ^[A-Z0-9-]+$"
                    className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg font-mono"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-6 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(fieldModal.required)}
                  onChange={(e) => setFieldModal({ ...fieldModal, required: e.target.checked })}
                />
                <span className="font-semibold text-[#5E5946]">Required Field</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fieldModal.isActive !== false}
                  onChange={(e) => setFieldModal({ ...fieldModal, isActive: e.target.checked })}
                />
                <span className="font-semibold text-[#5E5946]">Active</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setFieldModal(null)}>
                Cancel
              </Button>
              <Button type="submit">{fieldModal.isNew ? 'Add Field' : 'Save Field'}</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Desktop Navigation Item Add / Edit Modal */}
      <Modal
        open={Boolean(navModal)}
        onClose={() => setNavModal(null)}
        title={navModal?.isNew ? 'Add Desktop Navigation Item' : `Edit Navigation — ${navModal?.label || ''}`}
      >
        {navModal && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const payload = {
                  label: navModal.label,
                  slug: navModal.slug || undefined,
                  itemType: navModal.itemType,
                  mainCategoryId: navModal.itemType === 'MAIN_CATEGORY' ? navModal.mainCategoryId : undefined,
                  route: navModal.route,
                  hasDropdown: Boolean(navModal.hasDropdown),
                  highlight: Boolean(navModal.highlight),
                  isVisible: navModal.isVisible !== false,
                  isActive: navModal.isActive !== false,
                  saveAsDraft: workInDraftMode,
                };
                if (navModal.isNew) {
                  await adminApi.createDesktopNavItem(payload);
                  pushToast({ title: workInDraftMode ? 'Navigation Item Added to Draft' : 'Navigation Item Published' });
                } else {
                  await adminApi.updateDesktopNavItem(navModal.id, payload);
                  pushToast({ title: workInDraftMode ? 'Navigation Draft Updated' : 'Navigation Updated' });
                }
                setNavModal(null);
                loadTaxonomy();
              } catch (err: any) {
                pushToast({ title: 'Save Failed', message: err.message, variant: 'error' });
              }
            }}
            className="space-y-3 text-xs"
          >
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-[#5E5946] mb-1">Navigation Label *</label>
                <input
                  required
                  value={navModal.label || ''}
                  onChange={(e) => setNavModal({ ...navModal, label: e.target.value })}
                  placeholder="e.g. Civil & Interiors"
                  className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#5E5946] mb-1">Item Type *</label>
                <select
                  value={navModal.itemType || 'MAIN_CATEGORY'}
                  onChange={(e) =>
                    setNavModal({
                      ...navModal,
                      itemType: e.target.value,
                      hasDropdown: e.target.value === 'MAIN_CATEGORY' || e.target.value === 'NEW_LAUNCHES',
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                >
                  <option value="MAIN_CATEGORY">Main Category</option>
                  <option value="HOME">Home</option>
                  <option value="NEW_LAUNCHES">New Launches</option>
                  <option value="DEALS">Deals</option>
                  <option value="CUSTOM_LINK">Custom Route Link</option>
                </select>
              </div>
            </div>

            {navModal.itemType === 'MAIN_CATEGORY' ? (
              <div>
                <label className="block font-semibold text-[#5E5946] mb-1">Assigned Main Category *</label>
                <select
                  required
                  value={navModal.mainCategoryId || ''}
                  onChange={(e) => {
                    const mc = taxonomy.mainCategories.find((m) => m.id === e.target.value);
                    setNavModal({
                      ...navModal,
                      mainCategoryId: e.target.value,
                      label: navModal.label || mc?.name || '',
                      route: mc ? `/categories/${mc.slug}` : navModal.route,
                    });
                  }}
                  className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                >
                  <option value="">Select Main Category</option>
                  {taxonomy.mainCategories.map((mc) => (
                    <option key={mc.id} value={mc.id}>
                      {mc.name} ({mc.isActive !== false ? 'Active' : 'Inactive'})
                    </option>
                  ))}
                </select>
              </div>
            ) : navModal.itemType === 'CUSTOM_LINK' ? (
              <div>
                <label className="block font-semibold text-[#5E5946] mb-1">Target Route Path *</label>
                <input
                  required
                  value={navModal.route || ''}
                  onChange={(e) => setNavModal({ ...navModal, route: e.target.value })}
                  placeholder="/brands or /offers"
                  className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg font-mono"
                />
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-5 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(navModal.hasDropdown)}
                  onChange={(e) => setNavModal({ ...navModal, hasDropdown: e.target.checked })}
                />
                <span>Show Hover Dropdown</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={navModal.isVisible !== false}
                  onChange={(e) => setNavModal({ ...navModal, isVisible: e.target.checked })}
                />
                <span>Visible in Desktop Header</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={navModal.isActive !== false}
                  onChange={(e) => setNavModal({ ...navModal, isActive: e.target.checked })}
                />
                <span>Active</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setNavModal(null)}>
                Cancel
              </Button>
              <Button type="submit">{workInDraftMode ? 'Save Navigation Draft' : 'Save & Publish Nav'}</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Product Type Edit Modal */}
      <Modal
        open={Boolean(productTypeModal)}
        onClose={() => setProductTypeModal(null)}
        title={`Edit Product Type — ${productTypeModal?.name || ''}`}
      >
        {productTypeModal && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await adminApi.updateProductType(productTypeModal.id, {
                  childCategoryId: productTypeModal.childCategoryId,
                  name: productTypeModal.name,
                  slug: productTypeModal.slug,
                  sortOrder: Number(productTypeModal.sortOrder) || 1,
                  isActive: productTypeModal.isActive !== false,
                  saveAsDraft: workInDraftMode,
                });
                pushToast({ title: workInDraftMode ? 'Product Type Staged in Draft' : 'Product Type Updated' });
                setProductTypeModal(null);
                loadTaxonomy();
              } catch (err: any) {
                pushToast({ title: 'Update Failed', message: err.message, variant: 'error' });
              }
            }}
            className="space-y-3 text-xs"
          >
            <div>
              <label className="block font-semibold text-[#5E5946] mb-1">Parent Child Category *</label>
              <select
                value={productTypeModal.childCategoryId || ''}
                onChange={(e) => setProductTypeModal({ ...productTypeModal, childCategoryId: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
              >
                {taxonomy.childCategories.map((cc) => (
                  <option key={cc.id} value={cc.id}>
                    {cc.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-[#5E5946] mb-1">Product Type Name *</label>
                <input
                  required
                  value={productTypeModal.name || ''}
                  onChange={(e) => setProductTypeModal({ ...productTypeModal, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#5E5946] mb-1">Slug *</label>
                <input
                  required
                  value={productTypeModal.slug || ''}
                  onChange={(e) => setProductTypeModal({ ...productTypeModal, slug: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setProductTypeModal(null)}>
                Cancel
              </Button>
              <Button type="submit">Save Product Type</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Safe Delete with Product / Category Reassignment Modal */}
      <Modal
        open={Boolean(deleteTargetModal)}
        onClose={() => setDeleteTargetModal(null)}
        title={`Delete ${deleteTargetModal?.kind === 'MAIN' ? 'Main Category' : deleteTargetModal?.kind === 'CHILD' ? 'Child Category' : 'Product Type'} — ${deleteTargetModal?.item?.name || ''}`}
      >
        {deleteTargetModal && (
          <div className="space-y-3 text-xs">
            <p className="text-[#6E6859]">
              Deletion is blocked if categories or products depend on this node unless you select a target to migrate linked items safely.
            </p>
            <div>
              <label className="block font-semibold text-[#5E5946] mb-1">
                Reassign Linked Items To (Required if items exist)
              </label>
              <select
                value={deleteTargetModal.reassignToId}
                onChange={(e) => setDeleteTargetModal({ ...deleteTargetModal, reassignToId: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
              >
                <option value="">No Reassignment (Fail if non-empty)</option>
                {deleteTargetModal.kind === 'MAIN' &&
                  taxonomy.mainCategories
                    .filter((m) => m.id !== deleteTargetModal.item.id && m.isActive !== false)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        Move children & products to: {m.name}
                      </option>
                    ))}
                {deleteTargetModal.kind === 'CHILD' &&
                  taxonomy.childCategories
                    .filter((c) => c.id !== deleteTargetModal.item.id && c.isActive !== false)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        Move product types & products to: {c.name}
                      </option>
                    ))}
                {deleteTargetModal.kind === 'TYPE' &&
                  taxonomy.productTypes
                    .filter((pt) => pt.id !== deleteTargetModal.item.id)
                    .map((pt) => (
                      <option key={pt.id} value={pt.id}>
                        Move products to: {pt.name}
                      </option>
                    ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDeleteTargetModal(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={async () => {
                  try {
                    if (deleteTargetModal.kind === 'MAIN') {
                      await adminApi.deleteMainCategory(deleteTargetModal.item.id, {
                        reassignToMainId: deleteTargetModal.reassignToId || undefined,
                        saveAsDraft: workInDraftMode,
                      });
                    } else if (deleteTargetModal.kind === 'CHILD') {
                      await adminApi.deleteChildCategory(deleteTargetModal.item.id, {
                        reassignToChildId: deleteTargetModal.reassignToId || undefined,
                        saveAsDraft: workInDraftMode,
                      });
                    } else {
                      await adminApi.deleteProductType(deleteTargetModal.item.id, {
                        reassignToTypeId: deleteTargetModal.reassignToId || undefined,
                        saveAsDraft: workInDraftMode,
                      });
                    }
                    pushToast({ title: 'Removed & Migrated Safely' });
                    setDeleteTargetModal(null);
                    loadTaxonomy();
                  } catch (err: any) {
                    pushToast({ title: 'Delete Blocked', message: err.message, variant: 'error' });
                  }
                }}
              >
                Confirm Delete
              </Button>
            </div>
          </div>
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
