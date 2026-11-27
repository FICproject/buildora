import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Home,
} from 'lucide-react';
import { adminApi, formatINR, formatDate } from '../services/adminApi';
import { NewLaunchesAdminSection } from '../components/NewLaunchesAdminSection';
import {
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
  | 'FILTERS'
  | 'NEW_LAUNCHES';

export const CatalogProductsPage: React.FC<{
  initialSection?: CatalogSectionTab;
  initialStatusFilter?: string;
}> = ({
  initialSection = 'PRODUCTS',
  initialStatusFilter = 'ALL',
}) => {
  const navigate = useNavigate();
  const pushToast = useToastStore((s) => s.push);
  const [sectionTab, setSectionTab] = useState<CatalogSectionTab>(initialSection);
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [taxonomyLoading, setTaxonomyLoading] = useState(true);
  const [taxonomyError, setTaxonomyError] = useState<string | null>(null);

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
    filterConfigs: any[];
    civilMigrationReport?: any;
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
    filterConfigs: [],
    newLaunchCollections: [],
    brands: [],
    attributes: [],
  });

  const [showNavPreview, setShowNavPreview] = useState(true);
  const [previewHoveredMainSlug, setPreviewHoveredMainSlug] = useState<string | null>(null);
  const [previewHoveredChildSlug, setPreviewHoveredChildSlug] = useState<string | null>(null);
  const [draggedMainId, setDraggedMainId] = useState<string | null>(null);
  const [draggedChildId, setDraggedChildId] = useState<string | null>(null);
  const [draggedTypeId, setDraggedTypeId] = useState<string | null>(null);
  const [expandedGroupIds, setExpandedGroupIds] = useState<Record<string, boolean>>({});
  const [selectedMainHierarchyFilter, setSelectedMainHierarchyFilter] = useState('ALL');
  const [filterMainId, setFilterMainId] = useState('ALL');

  // Desktop Navigation & Product Type modals
  const [navModal, setNavModal] = useState<any>(null);
  const [productTypeModal, setProductTypeModal] = useState<any>(null);
  const [deleteTargetModal, setDeleteTargetModal] = useState<{
    kind: 'MAIN' | 'CHILD' | 'TYPE';
    item: any;
    reassignToId: string;
  } | null>(null);
  const [ptMainFilter, setPtMainFilter] = useState('ALL');
  const [ptChildFilter, setPtChildFilter] = useState('ALL');
  const [ptSearch, setPtSearch] = useState('');

  // Category search/filter & modals
  const [catSearch, setCatSearch] = useState('');
  const [catActiveFilter, setCatActiveFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [mainEditModal, setMainEditModal] = useState<any>(null);
  const [childEditModal, setChildEditModal] = useState<any>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Filter Configurator state
  const [selectedFilterChildId, setSelectedFilterChildId] = useState('cat-1');
  const [filterConfigModal, setFilterConfigModal] = useState<any>(null);
  const [categoryProductsModal, setCategoryProductsModal] = useState<{
    title: string;
    subtitle: string;
    loading: boolean;
    products: any[];
  } | null>(null);

  const [editModal, setEditModal] = useState<any>(null);
  const [rejectModal, setRejectModal] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');

  const [mainForm, setMainForm] = useState({ name: '', slug: '', sortOrder: '6', description: '', image: '', showInNavigation: true });
  const [childForm, setChildForm] = useState({ mainCategoryId: 'mc-1', name: '', slug: '', sortOrder: '1', description: '', image: '' });

  useEffect(() => {
    setSectionTab(initialSection);
  }, [initialSection]);

  useEffect(() => {
    setStatusFilter(initialStatusFilter || 'ALL');
  }, [initialStatusFilter]);

  const TAB_ROUTE_MAP: Record<CatalogSectionTab, string> = {
    PRODUCTS: '/products',
    NAVIGATION: '/products/navigation',
    MAIN_CATEGORIES: '/products/main-categories',
    CHILD_CATEGORIES: '/products/child-categories',
    PRODUCT_TYPES: '/products/product-types',
    FILTERS: '/products/filters',
    NEW_LAUNCHES: '/products/new-launches',
  };

  const handleSelectSectionTab = (tab: CatalogSectionTab) => {
    setSectionTab(tab);
    const route = TAB_ROUTE_MAP[tab];
    if (route) navigate(route);
  };

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
    setTaxonomyLoading(true);
    setTaxonomyError(null);
    try {
      const res = await adminApi.getCatalogTaxonomy();
      if (!res || !Array.isArray(res.mainCategories) || !Array.isArray(res.desktopNavigation)) {
        throw new Error(
          'Backend API returned an incomplete catalog taxonomy payload (missing mainCategories / desktopNavigation). Ensure the latest backend API is running and retry.'
        );
      }
      const childCats = res.childCategories || [];
      setTaxonomy({
        categories: res.categories || [],
        mainCategories: res.mainCategories || [],
        childCategories: childCats,
        productTypes: res.productTypes || [],
        desktopNavigation: res.desktopNavigation || [],
        publishMetadata: res.publishMetadata,
        fieldSchemas: res.fieldSchemas || [],
        filterConfigs: res.filterConfigs || [],
        civilMigrationReport: res.civilMigrationReport,
        newLaunchCollections: res.newLaunchCollections || [],
        migrationSummary: res.migrationSummary,
        brands: res.brands || [],
        attributes: res.attributes || [],
      });
      setExpandedGroupIds((prev) => {
        if (Object.keys(prev).length > 0) return prev;
        const initial: Record<string, boolean> = {};
        for (const cc of childCats) initial[cc.id] = true;
        return initial;
      });
    } catch (err: any) {
      setTaxonomyError(err.message || 'Failed to load catalog taxonomy from backend.');
    } finally {
      setTaxonomyLoading(false);
    }
  };

  const openCategoryProductsModal = async (nodeId: string, title: string, subtitle: string) => {
    setCategoryProductsModal({ title, subtitle, loading: true, products: [] });
    try {
      const items = await adminApi.getCategoryNodeProducts(nodeId);
      setCategoryProductsModal({ title, subtitle, loading: false, products: items || [] });
    } catch (err: any) {
      pushToast({ title: 'Load Failed', message: err.message, variant: 'error' });
      setCategoryProductsModal(null);
    }
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

  const handleDropMainCategory = async (targetMainId: string) => {
    if (!draggedMainId || draggedMainId === targetMainId) return;
    const ordered = [...taxonomy.mainCategories].sort((a, b) => a.sortOrder - b.sortOrder);
    const fromIdx = ordered.findIndex((m) => m.id === draggedMainId);
    const toIdx = ordered.findIndex((m) => m.id === targetMainId);
    setDraggedMainId(null);
    if (fromIdx < 0 || toIdx < 0) return;
    const next = [...ordered];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    try {
      await adminApi.reorderMainCategories(next.map((m) => m.id), false);
      pushToast({
        title: 'Saved & Synchronized',
        message: 'Changes saved and synchronized successfully.',
      });
      await loadTaxonomy();
    } catch (err: any) {
      pushToast({ title: 'Reorder Failed', message: err.message, variant: 'error' });
    }
  };

  const handleMoveMainOrder = async (mainId: string, direction: 'UP' | 'DOWN') => {
    const ordered = [...taxonomy.mainCategories].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = ordered.findIndex((m) => m.id === mainId);
    if (idx < 0) return;
    const swapIdx = direction === 'UP' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= ordered.length) return;
    const next = [...ordered];
    const [moved] = next.splice(idx, 1);
    next.splice(swapIdx, 0, moved);
    try {
      await adminApi.reorderMainCategories(next.map((m) => m.id), false);
      pushToast({
        title: 'Saved & Synchronized',
        message: 'Changes saved and synchronized successfully.',
      });
      await loadTaxonomy();
    } catch (err: any) {
      pushToast({ title: 'Reorder Failed', message: err.message, variant: 'error' });
    }
  };

  const handleDropChildCategory = async (targetChildId: string, mainCategoryId: string) => {
    if (!draggedChildId || draggedChildId === targetChildId) return;
    const siblingList = [...taxonomy.childCategories]
      .filter((c) => c.mainCategoryId === mainCategoryId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const fromIdx = siblingList.findIndex((c) => c.id === draggedChildId);
    const toIdx = siblingList.findIndex((c) => c.id === targetChildId);
    setDraggedChildId(null);
    if (fromIdx < 0 || toIdx < 0) return;
    const next = [...siblingList];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    const orderedIds = next.map((c) => c.id);
    try {
      await adminApi.reorderChildCategories(orderedIds, false);
      pushToast({
        title: 'Saved & Synchronized',
        message: 'Changes saved and synchronized successfully.',
      });
      await loadTaxonomy();
    } catch (err: any) {
      pushToast({ title: 'Reorder Failed', message: err.message, variant: 'error' });
    }
  };

  const handleDropProductType = async (targetTypeId: string, childCategoryId: string) => {
    if (!draggedTypeId || draggedTypeId === targetTypeId) return;
    const siblingList = [...taxonomy.productTypes]
      .filter((pt) => pt.childCategoryId === childCategoryId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const fromIdx = siblingList.findIndex((pt) => pt.id === draggedTypeId);
    const toIdx = siblingList.findIndex((pt) => pt.id === targetTypeId);
    setDraggedTypeId(null);
    if (fromIdx < 0 || toIdx < 0) return;
    const next = [...siblingList];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    const orderedIds = next.map((pt) => pt.id);
    try {
      await adminApi.reorderProductTypes(orderedIds, false);
      pushToast({
        title: 'Saved & Synchronized',
        message: 'Changes saved and synchronized successfully.',
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
      <div className="space-y-3">
        <h1 className="text-xl sm:text-2xl font-bold text-[#5E5946] tracking-tight">
          Products & Catalog Management
        </h1>

        <nav
          aria-label="Products & Catalog sections"
          className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[#E5DCD3] whitespace-nowrap"
        >
          {[
            { id: 'PRODUCTS' as CatalogSectionTab, label: 'Products', icon: <Package className="w-3.5 h-3.5" /> },
            { id: 'NAVIGATION' as CatalogSectionTab, label: 'Desktop Navigation', icon: <Monitor className="w-3.5 h-3.5" /> },
            { id: 'MAIN_CATEGORIES' as CatalogSectionTab, label: 'Main Categories', icon: <Layers className="w-3.5 h-3.5" /> },
            { id: 'CHILD_CATEGORIES' as CatalogSectionTab, label: 'Child Categories', icon: <FolderTree className="w-3.5 h-3.5" /> },
            { id: 'PRODUCT_TYPES' as CatalogSectionTab, label: 'Product Types', icon: <Compass className="w-3.5 h-3.5" /> },
            { id: 'FILTERS' as CatalogSectionTab, label: 'Filter Configuration', icon: <Sliders className="w-3.5 h-3.5" /> },
            { id: 'NEW_LAUNCHES' as CatalogSectionTab, label: 'New Launches', icon: <Sparkles className="w-3.5 h-3.5" /> },
          ].map((tab) => {
            const active = sectionTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSelectSectionTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold shrink-0 transition-colors ${
                  active
                    ? 'bg-[#5E5946] text-white border-[#5E5946] shadow-xs'
                    : 'bg-white text-[#5E5946] border-[#E5DCD3] hover:bg-[#FAF7F4]'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {taxonomyError && (
        <div className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-red-900 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{taxonomyError}</span>
          </div>
          <Button size="sm" variant="outline" onClick={loadTaxonomy}>
            Retry
          </Button>
        </div>
      )}

      {sectionTab === 'PRODUCTS' ? (
        <>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'ALL', label: 'All Products', path: '/products' },
                { id: 'PENDING_APPROVAL', label: 'Pending Approvals', path: '/products/pending' },
                { id: 'APPROVED', label: 'Approved', path: '/products/approved' },
                { id: 'REJECTED', label: 'Rejected', path: '/products/rejected' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setStatusFilter(t.id);
                    navigate(t.path);
                  }}
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
                {taxonomyLoading && navBarPreviewItems.length === 0 ? (
                  <p className="text-xs text-[#6E6859] py-4 text-center">Loading desktop navigation preview...</p>
                ) : navBarPreviewItems.length === 0 ? (
                  <div className="py-5 px-4 text-center space-y-2.5 bg-white rounded-lg border border-dashed border-[#E5DCD3]">
                    <p className="text-xs font-semibold text-[#5E5946]">
                      {taxonomyError
                        ? 'Unable to load Customer Desktop Navigation from the backend API.'
                        : 'No visible Desktop Navigation items configured.'}
                    </p>
                    <p className="text-[11px] text-[#6E6859]">
                      {taxonomyError
                        ? 'Verify the backend server is up and retry, or check navigation configuration.'
                        : 'Add a Main Category or Desktop Navigation item to populate the live two-panel customer header.'}
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 pt-1">
                      <Button size="sm" variant="outline" onClick={loadTaxonomy}>
                        <RotateCcw className="w-3.5 h-3.5" /> Retry
                      </Button>
                      <Button size="sm" onClick={() => handleSelectSectionTab('MAIN_CATEGORIES')}>
                        <Plus className="w-3.5 h-3.5" /> Add Category
                      </Button>
                    </div>
                  </div>
                ) : (
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
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs transition-all cursor-default ${nav.highlight
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

                        {isOpen && (linkedMain || nav.itemType === 'NEW_LAUNCHES') && (
                          <div className="absolute left-0 top-full pt-1.5 z-40">
                            <div className="w-[480px] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex text-xs">
                              {nav.itemType === 'NEW_LAUNCHES' ? (
                                <>
                                  <div className="w-56 border-r border-slate-100 p-3 space-y-1 max-h-64 overflow-y-auto">
                                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold px-2 mb-1">
                                      Featured Collections
                                    </p>
                                    {taxonomy.newLaunchCollections
                                      .filter((col) => col.isActive !== false && col.publishStatus !== 'DRAFT')
                                      .map((col) => (
                                        <div
                                          key={col.id}
                                          onMouseEnter={() => setPreviewHoveredChildSlug(col.slug)}
                                          className={`px-2.5 py-1.5 rounded-lg cursor-pointer flex items-center justify-between ${previewHoveredChildSlug === col.slug
                                            ? 'bg-slate-900 text-white font-semibold'
                                            : 'text-slate-700 hover:bg-slate-100'
                                            }`}
                                        >
                                          <span className="truncate">{col.title || col.name}</span>
                                          <span>›</span>
                                        </div>
                                      ))}
                                  </div>
                                  <div className="flex-1 bg-slate-50/70 p-3 space-y-1 max-h-64 overflow-y-auto">
                                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold px-1 mb-1">
                                      Mapped Shortcuts
                                    </p>
                                    {(() => {
                                      const activeCol =
                                        taxonomy.newLaunchCollections.find((c) => c.slug === previewHoveredChildSlug) ||
                                        taxonomy.newLaunchCollections.find((c) => c.isActive !== false && c.publishStatus !== 'DRAFT');
                                      const maps = (activeCol?.categoryMappings || []).filter(
                                        (m: any) => m.isActive !== false && m.mappingStatus === 'MAPPED'
                                      );
                                      if (maps.length === 0) {
                                        return <p className="text-[11px] text-slate-400 p-2">No mapped shortcuts.</p>;
                                      }
                                      return maps.map((m: any) => (
                                        <div
                                          key={m.id}
                                          className="px-2.5 py-1.5 rounded-lg text-slate-700 bg-white border border-slate-100 truncate"
                                        >
                                          {m.displayLabel}
                                        </div>
                                      ));
                                    })()}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="w-56 border-r border-slate-100 p-3 space-y-1 max-h-64 overflow-y-auto">
                                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold px-2 mb-1">
                                      Category Groups
                                    </p>
                                    {taxonomy.childCategories
                                      .filter((c) => c.mainCategoryId === linkedMain!.id && c.isActive !== false)
                                      .map((cc) => (
                                        <div
                                          key={cc.id}
                                          onMouseEnter={() => setPreviewHoveredChildSlug(cc.slug)}
                                          className={`px-2.5 py-1.5 rounded-lg cursor-pointer flex items-center justify-between ${previewHoveredChildSlug === cc.slug
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
                                          (c) => c.mainCategoryId === linkedMain!.id && c.isActive !== false
                                        );
                                      const pts = activeChild
                                        ? taxonomy.productTypes.filter(
                                          (pt) => pt.childCategoryId === activeChild.id && pt.isActive !== false
                                        )
                                        : [];
                                      if (pts.length === 0) {
                                        return <p className="text-[11px] text-slate-400 p-2">No active child categories configured.</p>;
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
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                )}
              </div>
            )}
          </Card>

          {/* Desktop Navigation Order Manager */}
          <Card
            title="Desktop Header Navigation Items"
            subtitle="Manage Customer website navigation labels, Main Category links, and Active / Inactive status"
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
                    childCategoryId: '',
                    productTypeId: '',
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
            {taxonomyLoading && taxonomy.desktopNavigation.length === 0 ? (
              <p className="text-xs text-[#6E6859] py-6 text-center">Loading desktop header navigation items...</p>
            ) : taxonomy.desktopNavigation.length === 0 ? (
              <EmptyState
                icon={<Monitor className="w-6 h-6" />}
                title={taxonomyError ? 'Navigation data failed to load' : 'No Desktop Navigation items configured'}
                description={
                  taxonomyError ||
                  'Add navigation items or Main Categories to build the Customer desktop and mobile navigation.'
                }
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button size="sm" variant="outline" onClick={loadTaxonomy}>
                      Retry
                    </Button>
                    <Button
                      size="sm"
                      onClick={() =>
                        setNavModal({
                          isNew: true,
                          label: '',
                          slug: '',
                          itemType: 'MAIN_CATEGORY',
                          mainCategoryId: taxonomy.mainCategories[0]?.id || '',
                          childCategoryId: '',
                          productTypeId: '',
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
                  </div>
                }
              />
            ) : (
            <div className="space-y-2 text-xs">
              {[...taxonomy.desktopNavigation]
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((nav) => {
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
                      className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 transition-colors ${
                        effectivelyVisible
                          ? 'bg-white border-[#E5DCD3] hover:bg-[#FAF7F4]'
                          : 'bg-slate-50 border-slate-200 opacity-75'
                        }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
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
                          variant={nav.isActive !== false ? 'success' : 'outline'}
                          onClick={async () => {
                            await adminApi.updateDesktopNavItem(nav.id, {
                              isActive: !(nav.isActive !== false),
                              saveAsDraft: false,
                            });
                            pushToast({ title: 'Saved & Synchronized', message: 'Changes saved and synchronized successfully.' });
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
                              await adminApi.deleteDesktopNavItem(nav.id, false);
                              pushToast({ title: 'Saved & Synchronized', message: 'Changes saved and synchronized successfully.' });
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
            )}
          </Card>
        </div>
      ) : sectionTab === 'MAIN_CATEGORIES' ? (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Main Category List */}
            <div className="lg:col-span-8">
              <Card
                title={`Main Categories (${taxonomy.mainCategories.length})`}
                subtitle="Drag to reorder, edit images/slugs, toggle status & control Desktop Header visibility"
                action={
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-[#6E6859] absolute left-2.5 top-2" />
                      <input
                        type="text"
                        placeholder="Filter main categories..."
                        value={catSearch}
                        onChange={(e) => setCatSearch(e.target.value)}
                        className="pl-8 pr-3 py-1.5 text-xs bg-white border border-[#E5DCD3] rounded-lg w-44"
                      />
                    </div>
                    {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setCatActiveFilter(st)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-medium border ${
                          catActiveFilter === st
                            ? 'bg-[#AE887B] text-white border-[#AE887B]'
                            : 'bg-white text-[#5E5946] border-[#E5DCD3]'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                }
              >
                {taxonomyLoading && taxonomy.mainCategories.length === 0 ? (
                  <p className="text-xs text-[#6E6859] py-8 text-center">Loading main categories...</p>
                ) : taxonomy.mainCategories.length === 0 ? (
                  <EmptyState
                    icon={<Layers className="w-6 h-6" />}
                    title={taxonomyError ? 'Unable to load Main Categories' : 'No Main Categories found'}
                    description={
                      taxonomyError ||
                      'No Main Categories exist in the database yet. Retry or add your first Main Category on the right.'
                    }
                    action={
                      <Button size="sm" variant="outline" onClick={loadTaxonomy}>
                        Retry
                      </Button>
                    }
                  />
                ) : (
                <div className="space-y-2.5 text-xs">
                  {taxonomy.mainCategories
                    .filter((mc) => {
                      if (catActiveFilter === 'ACTIVE' && mc.isActive === false) return false;
                      if (catActiveFilter === 'INACTIVE' && mc.isActive !== false) return false;
                      const q = catSearch.trim().toLowerCase();
                      return !q || mc.name.toLowerCase().includes(q) || mc.slug.toLowerCase().includes(q);
                    })
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((mc, idx, arr) => {
                      const groupCount = mc.groupCount ?? mc.childCount ?? taxonomy.childCategories.filter((c) => c.mainCategoryId === mc.id).length;
                      const childCatCount = mc.childCategoryCount ?? taxonomy.productTypes.filter((pt) => pt.mainCategoryId === mc.id).length;
                      return (
                      <div
                        key={mc.id}
                        draggable
                        onDragStart={() => setDraggedMainId(mc.id)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleDropMainCategory(mc.id)}
                        className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 cursor-move transition-colors ${
                          draggedMainId === mc.id
                            ? 'bg-[#F0DED0]/60 border-[#AE887B]'
                            : 'border-[#E5DCD3] bg-white hover:bg-[#FAF7F4]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <GripVertical className="w-4 h-4 text-[#8E8777] shrink-0" />
                          {mc.image ? (
                            <img src={mc.image} alt={mc.name} className="w-10 h-10 rounded-lg object-cover border border-[#E5DCD3]" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-[#F0DED0] text-[#943D24] font-bold flex items-center justify-center">
                              #{mc.sortOrder}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-bold text-[#5E5946] truncate">
                                #{mc.sortOrder} {mc.name}
                              </span>
                              <code className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#FAF7F4] border border-[#E5DCD3] text-[#6E6859]">
                                /{mc.slug}
                              </code>
                              <Badge variant={mc.isActive !== false ? 'success' : 'error'}>
                                {mc.isActive !== false ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            {mc.description && (
                              <p className="text-[11px] text-[#5E5946]/90 truncate mt-0.5">{mc.description}</p>
                            )}
                            <p className="text-[11px] text-[#6E6859] truncate">
                              {groupCount} category groups • {childCatCount} child categories • {mc.productCount ?? 0} products •{' '}
                              {mc.showInNavigation !== false ? 'In Desktop Header' : 'Hidden from Header'} • Created: {formatDate(mc.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={idx === 0}
                            onClick={() => handleMoveMainOrder(mc.id, 'UP')}
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={idx === arr.length - 1}
                            onClick={() => handleMoveMainOrder(mc.id, 'DOWN')}
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedMainHierarchyFilter(mc.id);
                              handleSelectSectionTab('CHILD_CATEGORIES');
                            }}
                          >
                            <FolderTree className="w-3.5 h-3.5" /> View Groups ({mc.childCount ?? 0})
                          </Button>
                          <Button
                            size="sm"
                            variant={mc.showInNavigation !== false ? 'secondary' : 'outline'}
                            onClick={async () => {
                              await adminApi.updateMainCategory(mc.id, {
                                showInNavigation: !(mc.showInNavigation !== false),
                                saveAsDraft: false,
                              });
                              pushToast({ title: 'Saved & Synchronized', message: 'Changes saved and synchronized successfully.' });
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
                                saveAsDraft: false,
                              });
                              pushToast({ title: 'Saved & Synchronized', message: 'Changes saved and synchronized successfully.' });
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
                      );
                    })}
                </div>
                )}
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
                        saveAsDraft: false,
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
                        title: 'Saved & Synchronized',
                        message: 'Changes saved and synchronized successfully.',
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
                    <Plus className="w-3.5 h-3.5" /> Add Category
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        </div>
      ) : sectionTab === 'CHILD_CATEGORIES' ? (
        <div className="space-y-5">
          <div className="p-3.5 rounded-xl bg-[#FAF7F4] border border-[#E5DCD3] text-xs space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="font-semibold text-[#5E5946]">
                  {taxonomy.mainCategories.length} Main Categories •{' '}
                  {taxonomy.childCategories.length} Category Groups •{' '}
                  {taxonomy.productTypes.length} Child Categories
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#6E6859] absolute left-2.5 top-2" />
                  <input
                    type="text"
                    placeholder="Search main, group or child..."
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
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const allOpen = taxonomy.childCategories.every((c) => expandedGroupIds[c.id]);
                    const next: Record<string, boolean> = {};
                    for (const c of taxonomy.childCategories) next[c.id] = !allOpen;
                    setExpandedGroupIds(next);
                  }}
                >
                  {taxonomy.childCategories.every((c) => expandedGroupIds[c.id]) ? 'Collapse All' : 'Expand All'}
                </Button>
              </div>
            </div>

            {/* Main Category Cascading Selector Bar */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#E5DCD3]/70">
              <button
                type="button"
                onClick={() => setSelectedMainHierarchyFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-medium border transition-colors ${
                  selectedMainHierarchyFilter === 'ALL'
                    ? 'bg-[#5E5946] text-white border-[#5E5946]'
                    : 'bg-white text-[#5E5946] border-[#E5DCD3] hover:bg-[#F0DED0]/40'
                }`}
              >
                All Main Categories ({taxonomy.mainCategories.length})
              </button>
              {taxonomy.mainCategories.map((mc) => {
                const grpCount = taxonomy.childCategories.filter((c) => c.mainCategoryId === mc.id).length;
                return (
                  <button
                    key={mc.id}
                    type="button"
                    onClick={() => setSelectedMainHierarchyFilter(mc.id)}
                    className={`px-2.5 py-1 rounded-lg font-medium border transition-colors ${
                      selectedMainHierarchyFilter === mc.id
                        ? 'bg-[#943D24] text-white border-[#943D24]'
                        : 'bg-white text-[#5E5946] border-[#E5DCD3] hover:bg-[#F0DED0]/40'
                    }`}
                  >
                    {mc.name} ({grpCount})
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-8">
              <Card
                title="Main Category → Category Group → Child Categories Hierarchy"
                subtitle="Expand groups to inspect & manage Child Categories (including repeated names with unique parent-scoped IDs), drag to reorder groups, or jump to Filters/Fields"
              >
                <div className="space-y-3 text-xs">
                  {taxonomy.mainCategories
                    .filter((mc) => {
                      if (selectedMainHierarchyFilter !== 'ALL' && mc.id !== selectedMainHierarchyFilter) return false;
                      if (catActiveFilter === 'ACTIVE' && mc.isActive === false) return false;
                      if (catActiveFilter === 'INACTIVE' && mc.isActive !== false) return false;
                      const q = catSearch.trim().toLowerCase();
                      if (!q) return true;
                      const groupMatches = taxonomy.childCategories.some(
                        (c) =>
                          c.mainCategoryId === mc.id &&
                          (c.name.toLowerCase().includes(q) ||
                            taxonomy.productTypes.some(
                              (pt) => pt.childCategoryId === c.id && pt.name.toLowerCase().includes(q)
                            ))
                      );
                      return mc.name.toLowerCase().includes(q) || groupMatches;
                    })
                    .map((mc) => {
                      const q = catSearch.trim().toLowerCase();
                      const children = taxonomy.childCategories.filter((c) => {
                        if (c.mainCategoryId !== mc.id) return false;
                        if (catActiveFilter === 'ACTIVE' && c.isActive === false) return false;
                        if (catActiveFilter === 'INACTIVE' && c.isActive !== false) return false;
                        if (!q) return true;
                        const ptMatch = taxonomy.productTypes.some(
                          (pt) => pt.childCategoryId === c.id && pt.name.toLowerCase().includes(q)
                        );
                        return c.name.toLowerCase().includes(q) || mc.name.toLowerCase().includes(q) || ptMatch;
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
                                  {mc.name} <span className="font-normal text-[#6E6859]">({children.length} groups)</span>
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
                              <Plus className="w-3.5 h-3.5" /> Add Group
                            </Button>
                          </div>
                          <div className="p-2.5 pl-6 space-y-1.5">
                            {children.length === 0 ? (
                              <p className="text-[#8E8777] italic py-1">No matching category groups under this Main Category.</p>
                            ) : (
                              children.map((cc) => {
                                const childSubItems = taxonomy.productTypes
                                  .filter((pt) => {
                                    if (pt.childCategoryId !== cc.id) return false;
                                    if (catActiveFilter === 'ACTIVE' && pt.isActive === false) return false;
                                    if (catActiveFilter === 'INACTIVE' && pt.isActive !== false) return false;
                                    if (q && !cc.name.toLowerCase().includes(q) && !mc.name.toLowerCase().includes(q)) {
                                      return pt.name.toLowerCase().includes(q);
                                    }
                                    return true;
                                  })
                                  .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
                                const isExpanded = Boolean(expandedGroupIds[cc.id]) || Boolean(q);
                                return (
                                  <div
                                    key={cc.id}
                                    draggable
                                    onDragStart={() => setDraggedChildId(cc.id)}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={() => handleDropChildCategory(cc.id, mc.id)}
                                    className={`rounded-lg border transition-colors ${
                                      draggedChildId === cc.id
                                        ? 'bg-[#F0DED0]/50 border-[#AE887B]'
                                        : 'border-[#E5DCD3]/60 hover:bg-[#FAF7F4] hover:border-[#E5DCD3]'
                                    }`}
                                  >
                                    <div className="flex flex-wrap items-center justify-between gap-2 p-2 cursor-move">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <GripVertical className="w-3.5 h-3.5 text-[#8E8777] shrink-0" />
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
                                            {cc.productCount ?? 0} products • {childSubItems.length} child categories • {cc.fieldCount ?? 0} fields
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            setExpandedGroupIds((prev) => ({
                                              ...prev,
                                              [cc.id]: !prev[cc.id],
                                            }))
                                          }
                                        >
                                          <FolderTree className="w-3 h-3" /> {isExpanded ? 'Hide' : 'Children'} ({childSubItems.length})
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            setProductTypeModal({
                                              isNew: true,
                                              childCategoryId: cc.id,
                                              name: '',
                                              slug: '',
                                              sortOrder: childSubItems.length + 1,
                                              isActive: true,
                                            })
                                          }
                                        >
                                          <Plus className="w-3 h-3" /> Add Child
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            openCategoryProductsModal(
                                              cc.id,
                                              `Products in ${cc.name}`,
                                              `/${cc.slug} • Parent: ${mc.name}`
                                            )
                                          }
                                        >
                                          <Package className="w-3 h-3" /> Products ({cc.productCount ?? 0})
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setFilterMainId(cc.mainCategoryId || 'ALL');
                                            setSelectedFilterChildId(cc.id);
                                            handleSelectSectionTab('FILTERS');
                                          }}
                                        >
                                          <Sliders className="w-3 h-3" /> Filters ({cc.filterCount ?? 0})
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
                                              saveAsDraft: false,
                                            });
                                            pushToast({ title: 'Saved & Synchronized', message: 'Changes saved and synchronized successfully.' });
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
                                    {isExpanded && (
                                      <div className="px-6 pb-2.5 pt-1.5 space-y-1 border-t border-[#E5DCD3]/70 bg-[#FAF7F4]/70">
                                        {childSubItems.length === 0 ? (
                                          <p className="text-[11px] text-[#8E8777] italic">No child categories yet.</p>
                                        ) : (
                                          childSubItems.map((subPt) => (
                                            <div key={subPt.id} className="flex flex-wrap items-center justify-between gap-2 py-1 px-2 rounded bg-white/80 border border-[#E5DCD3]/60 text-[11px]">
                                              <span className="text-[#5E5946] font-medium truncate">
                                                • {subPt.name}{' '}
                                                <code className="text-[10px] text-[#8E8777]">/{subPt.slug}</code>{' '}
                                                <span className="text-[10px] text-[#9E9689] font-mono">({subPt.id})</span>
                                              </span>
                                              <div className="flex items-center gap-1 shrink-0">
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  onClick={() =>
                                                    openCategoryProductsModal(
                                                      subPt.id,
                                                      `Products in ${subPt.name}`,
                                                      `Group: ${cc.name}`
                                                    )
                                                  }
                                                >
                                                  {subPt.productCount ?? 0} prods
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant={subPt.isActive !== false ? 'success' : 'outline'}
                                                  onClick={async () => {
                                                    await adminApi.updateProductType(subPt.id, {
                                                      isActive: !(subPt.isActive !== false),
                                                      saveAsDraft: false,
                                                    });
                                                    pushToast({ title: 'Saved & Synchronized', message: 'Changes saved and synchronized successfully.' });
                                                    loadTaxonomy();
                                                  }}
                                                >
                                                  {subPt.isActive !== false ? 'Active' : 'Disabled'}
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => setProductTypeModal({ ...subPt })}>
                                                  <Edit3 className="w-3 h-3" />
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="danger"
                                                  onClick={() =>
                                                    setDeleteTargetModal({
                                                      kind: 'TYPE',
                                                      item: subPt,
                                                      reassignToId:
                                                        taxonomy.productTypes.find(
                                                          (t) => t.id !== subPt.id && t.childCategoryId === subPt.childCategoryId
                                                        )?.id || '',
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
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </Card>
            </div>

            <div className="lg:col-span-4">
              <Card title="Add Category Group" subtitle="Assigns directly under a Main Category">
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
                        saveAsDraft: false,
                      });
                      setChildForm({ ...childForm, name: '', slug: '', description: '', image: '' });
                      pushToast({
                        title: 'Saved & Synchronized',
                        message: 'Changes saved and synchronized successfully.',
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
                    placeholder="New category group name *"
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
                      <Plus className="w-3.5 h-3.5" /> Add Category Group
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          </div>
        </div>
      ) : sectionTab === 'PRODUCT_TYPES' ? (
        <div className="space-y-5">
          {(() => {
            const groupOptions = taxonomy.childCategories.filter(
              (cc) => ptMainFilter === 'ALL' || cc.mainCategoryId === ptMainFilter
            );
            const q = ptSearch.trim().toLowerCase();
            const filteredTypes = taxonomy.productTypes
              .filter((pt) => {
                if (ptMainFilter !== 'ALL' && pt.mainCategoryId !== ptMainFilter) return false;
                if (ptChildFilter !== 'ALL' && pt.childCategoryId !== ptChildFilter) return false;
                if (q) {
                  const grp = taxonomy.childCategories.find((c) => c.id === pt.childCategoryId);
                  return (
                    pt.name.toLowerCase().includes(q) ||
                    pt.slug.toLowerCase().includes(q) ||
                    (grp?.name || '').toLowerCase().includes(q)
                  );
                }
                return true;
              })
              .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

            return (
              <Card
                title={`Product Type Management (${filteredTypes.length}${filteredTypes.length !== taxonomy.productTypes.length ? ` of ${taxonomy.productTypes.length}` : ''})`}
                subtitle="Manage child classifications displayed in navigation second column and product filtering"
                action={
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-[#6E6859] absolute left-2.5 top-2" />
                      <input
                        type="text"
                        placeholder="Search product types..."
                        value={ptSearch}
                        onChange={(e) => setPtSearch(e.target.value)}
                        className="pl-8 pr-3 py-1.5 text-xs bg-white border border-[#E5DCD3] rounded-lg w-48"
                      />
                    </div>
                    <select
                      value={ptMainFilter}
                      onChange={(e) => {
                        const nextMain = e.target.value;
                        setPtMainFilter(nextMain);
                        setPtChildFilter('ALL');
                      }}
                      className="px-2.5 py-1.5 text-xs bg-white border border-[#E5DCD3] rounded-lg"
                    >
                      <option value="ALL">All Main Categories ({taxonomy.mainCategories.length})</option>
                      {taxonomy.mainCategories.map((mc) => (
                        <option key={mc.id} value={mc.id}>
                          {mc.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={ptChildFilter}
                      onChange={(e) => setPtChildFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs bg-white border border-[#E5DCD3] rounded-lg"
                    >
                      <option value="ALL">All Category Groups ({groupOptions.length})</option>
                      {groupOptions.map((cc) => (
                        <option key={cc.id} value={cc.id}>
                          {cc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                }
              >
                {taxonomyLoading && taxonomy.productTypes.length === 0 ? (
                  <p className="text-xs text-[#6E6859] py-8 text-center">Loading product types...</p>
                ) : filteredTypes.length === 0 ? (
                  <EmptyState
                    icon={<Compass className="w-6 h-6" />}
                    title={taxonomyError ? 'Unable to load Product Types' : 'No matching Product Types'}
                    description={
                      taxonomyError ||
                      'Try clearing your search or selecting a different Main Category / Category Group.'
                    }
                    action={
                      taxonomyError ? (
                        <Button size="sm" variant="outline" onClick={loadTaxonomy}>
                          Retry
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setPtSearch('');
                            setPtMainFilter('ALL');
                            setPtChildFilter('ALL');
                          }}
                        >
                          Reset Filters
                        </Button>
                      )
                    }
                  />
                ) : (
                  <div className="divide-y divide-[#E5DCD3] max-h-[620px] overflow-y-auto text-xs">
                    {filteredTypes.map((pt) => {
                      const parentChild = taxonomy.childCategories.find((c) => c.id === pt.childCategoryId);
                      const parentMain = taxonomy.mainCategories.find((m) => m.id === pt.mainCategoryId);
                      return (
                        <div
                          key={pt.id}
                          draggable
                          onDragStart={() => setDraggedTypeId(pt.id)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => handleDropProductType(pt.id, pt.childCategoryId)}
                          className={`py-3 px-2 flex flex-wrap items-center justify-between gap-3 cursor-move ${
                            draggedTypeId === pt.id ? 'bg-[#F0DED0]/50' : 'hover:bg-[#FAF7F4]/60'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <GripVertical className="w-3.5 h-3.5 text-[#8E8777] shrink-0" />
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-semibold text-[#5E5946] truncate">
                                  #{pt.sortOrder} {pt.name}
                                </span>
                                <code className="font-mono text-[10px] text-[#8E8777]">/{pt.slug}</code>
                                <Badge variant={pt.isActive !== false ? 'success' : 'error'}>
                                  {pt.isActive !== false ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                              <p className="text-[11px] text-[#6E6859] truncate">
                                {parentMain ? `${parentMain.name} → ` : ''}
                                Under: {parentChild?.name || pt.childCategorySlug} • {pt.productCount ?? 0} products
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                openCategoryProductsModal(
                                  pt.id,
                                  `Products in ${pt.name}`,
                                  `Parent: ${parentChild?.name || pt.childCategorySlug} (/${pt.slug})`
                                )
                              }
                            >
                              <Package className="w-3 h-3" /> Products ({pt.productCount ?? 0})
                            </Button>
                            <Button
                              size="sm"
                              variant={pt.isActive !== false ? 'success' : 'outline'}
                              onClick={async () => {
                                await adminApi.updateProductType(pt.id, {
                                  isActive: !(pt.isActive !== false),
                                  saveAsDraft: false,
                                });
                                pushToast({ title: 'Saved & Synchronized', message: 'Changes saved and synchronized successfully.' });
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
                )}
              </Card>
            );
          })()}
        </div>
      ) : sectionTab === 'FILTERS' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-4">
              <Card title="1. Main Category → Category Group" subtitle="Select Main Category, then Category Group to configure filters">
                <div className="mb-3">
                  <select
                    value={filterMainId}
                    onChange={(e) => {
                      const mid = e.target.value;
                      setFilterMainId(mid);
                      const firstGrp = taxonomy.childCategories.find(
                        (c) => mid === 'ALL' || c.mainCategoryId === mid
                      );
                      if (firstGrp) setSelectedFilterChildId(firstGrp.id);
                    }}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E5DCD3] rounded-lg font-medium text-[#5E5946]"
                  >
                    <option value="ALL">All Main Categories ({taxonomy.mainCategories.length})</option>
                    {taxonomy.mainCategories.map((mc) => (
                      <option key={mc.id} value={mc.id}>
                        {mc.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5 max-h-[520px] overflow-y-auto text-xs">
                  {taxonomy.childCategories
                    .filter((cc) => filterMainId === 'ALL' || cc.mainCategoryId === filterMainId)
                    .map((cc) => {
                    const count = (taxonomy.filterConfigs || []).filter(
                      (f) => f.childCategoryId === cc.id || f.childCategorySlug === cc.slug
                    ).length;
                    const active = selectedFilterChildId === cc.id;
                    return (
                      <button
                        key={cc.id}
                        type="button"
                        onClick={() => setSelectedFilterChildId(cc.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors flex items-center justify-between gap-2 ${
                          active
                            ? 'bg-[#943D24] text-white border-[#943D24]'
                            : 'bg-white text-[#5E5946] border-[#E5DCD3] hover:bg-[#FAF7F4]'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{cc.name}</p>
                          <p className={`text-[10px] truncate ${active ? 'text-white/80' : 'text-[#8E8777]'}`}>
                            /{cc.slug} • {cc.productCount ?? 0} products
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                            active ? 'bg-white/20 text-white' : 'bg-[#FAF7F4] text-[#6E6859]'
                          }`}
                        >
                          {count} filters
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Card>
            </div>

            <div className="lg:col-span-8">
              {(() => {
                const selectedChild =
                  taxonomy.childCategories.find((c) => c.id === selectedFilterChildId) ||
                  taxonomy.childCategories[0];
                const filtersForChild = (taxonomy.filterConfigs || [])
                  .filter(
                    (f) =>
                      selectedChild &&
                      (f.childCategoryId === selectedChild.id || f.childCategorySlug === selectedChild.slug)
                  )
                  .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

                return (
                  <Card
                    title={`Filter Configuration — ${selectedChild?.name || ''}`}
                    subtitle="Configure category-specific filters, selection modes (Single vs Multi), Vendor attributes, and Customer PLP visibility."
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                      <span className="text-xs text-[#6E6859]">
                        Showing <strong>{filtersForChild.length}</strong> configured filters for{' '}
                        <strong>{selectedChild?.name}</strong>
                      </span>
                      <div className="flex items-center gap-2">
                        {selectedChild && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              openCategoryProductsModal(
                                selectedChild.id,
                                `Products in ${selectedChild.name}`,
                                `/${selectedChild.slug}`
                              )
                            }
                          >
                            <Package className="w-3.5 h-3.5" /> View Products ({selectedChild.productCount ?? 0})
                          </Button>
                        )}
                        {selectedChild && (
                          <Button
                            size="sm"
                            onClick={() =>
                              setFilterConfigModal({
                                isNew: true,
                                mainCategoryId: selectedChild.mainCategoryId || 'mc-1',
                                childCategoryId: selectedChild.id,
                                childCategorySlug: selectedChild.slug,
                                filterName: '',
                                fieldKey: '',
                                fieldType: 'DROPDOWN',
                                optionsCsv: '',
                                selectionMode: 'MULTI',
                                isRequired: false,
                                showInVendor: true,
                                showInCustomer: true,
                                sortOrder: filtersForChild.length + 1,
                                isActive: true,
                              })
                            }
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Filter Rule
                          </Button>
                        )}
                      </div>
                    </div>

                    {filtersForChild.length === 0 ? (
                      <EmptyState
                        title="No custom filters configured"
                        description="Add category-specific filters such as Grade, Thickness, Adhesive Type, or Application Area."
                      />
                    ) : (
                      <div className="space-y-2.5 text-xs">
                        {filtersForChild.map((fc) => (
                          <div
                            key={fc.id}
                            className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              fc.isActive !== false
                                ? 'border-[#E5DCD3] bg-white'
                                : 'border-dashed border-slate-300 bg-slate-50 opacity-75'
                            }`}
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#FAF7F4] border border-[#E5DCD3] text-[#6E6859]">
                                  #{fc.sortOrder}
                                </span>
                                <span className="font-bold text-[#5E5946] text-sm">{fc.filterName}</span>
                                <code className="text-[10px] text-[#6E6859] bg-[#FAF7F4] px-1.5 py-0.5 rounded">
                                  {fc.fieldKey}
                                </code>
                                <Badge variant="info">{fc.fieldType}</Badge>
                                <Badge variant={fc.selectionMode === 'SINGLE' ? 'warning' : 'default'}>
                                  {fc.selectionMode || 'MULTI'} Select
                                </Badge>
                                {fc.isRequired && <Badge variant="warning">Required</Badge>}
                                {fc.showInVendor && <Badge variant="success">Vendor Form</Badge>}
                                {fc.showInCustomer && <Badge variant="info">Customer Filter</Badge>}
                              </div>
                              {Array.isArray(fc.options) && fc.options.length > 0 && (
                                <p className="text-[11px] text-[#6E6859] truncate">
                                  Options ({fc.options.length}): {fc.options.join(', ')}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <Button
                                size="sm"
                                variant={fc.isActive !== false ? 'success' : 'outline'}
                                onClick={async () => {
                                  await adminApi.updateCategoryFilterConfig(fc.id, {
                                    isActive: !(fc.isActive !== false),
                                    saveAsDraft: false,
                                  });
                                  pushToast({ title: 'Saved & Synchronized', message: 'Changes saved and synchronized successfully.' });
                                  loadTaxonomy();
                                }}
                              >
                                {fc.isActive !== false ? 'Active' : 'Inactive'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setFilterConfigModal({
                                    ...fc,
                                    isNew: false,
                                    optionsCsv: (fc.options || []).join(', '),
                                  })
                                }
                              >
                                <Edit3 className="w-3.5 h-3.5" /> Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={async () => {
                                  await adminApi.deleteCategoryFilterConfig(fc.id, false);
                                  pushToast({
                                    title: 'Saved & Synchronized',
                                    message: 'Changes saved and synchronized successfully.',
                                  });
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
        </div>
      ) : (
        <NewLaunchesAdminSection
          onRefreshParentTaxonomy={loadTaxonomy}
          onJumpToCatalogTab={(tab) => handleSelectSectionTab(tab)}
        />
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
                  saveAsDraft: false,
                });
                pushToast({
                  title: 'Saved & Synchronized',
                  message: 'Changes saved and synchronized successfully.',
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

      {/* Create / Edit / Move Category Group Modal */}
      <Modal
        open={Boolean(childEditModal)}
        onClose={() => setChildEditModal(null)}
        title={childEditModal?.isNew ? 'Add Category Group' : `Edit / Move Category Group — ${childEditModal?.name || ''}`}
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
                    saveAsDraft: false,
                  });
                  pushToast({ title: 'Saved & Synchronized', message: 'Changes saved and synchronized successfully.' });
                } else {
                  const updated = await adminApi.updateChildCategory(childEditModal.id, {
                    mainCategoryId: childEditModal.mainCategoryId,
                    name: childEditModal.name,
                    slug: childEditModal.slug || undefined,
                    description: childEditModal.description,
                    image: childEditModal.image,
                    sortOrder: Number(childEditModal.sortOrder) || 1,
                    isActive: childEditModal.isActive !== false,
                    saveAsDraft: false,
                  });
                  pushToast({
                    title: 'Saved & Synchronized',
                    message:
                      updated?.migratedProductsCount > 0
                        ? `Changes saved and synchronized successfully (${updated.migratedProductsCount} products updated).`
                        : 'Changes saved and synchronized successfully.',
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
                  childCategoryId:
                    navModal.itemType === 'MAIN_CATEGORY' && navModal.childCategoryId
                      ? navModal.childCategoryId
                      : undefined,
                  productTypeId:
                    navModal.itemType === 'MAIN_CATEGORY' && navModal.productTypeId
                      ? navModal.productTypeId
                      : undefined,
                  route: navModal.route,
                  hasDropdown: Boolean(navModal.hasDropdown),
                  highlight: Boolean(navModal.highlight),
                  isVisible: navModal.isVisible !== false,
                  isActive: navModal.isActive !== false,
                  saveAsDraft: false,
                };
                if (navModal.isNew) {
                  await adminApi.createDesktopNavItem(payload);
                } else {
                  await adminApi.updateDesktopNavItem(navModal.id, payload);
                }
                pushToast({ title: 'Saved & Synchronized', message: 'Changes saved and synchronized successfully.' });
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
              <div className="space-y-2.5">
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
                        childCategoryId: '',
                        productTypeId: '',
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
                {navModal.mainCategoryId && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-[#5E5946] mb-1">Category Group (Optional)</label>
                      <select
                        value={navModal.childCategoryId || ''}
                        onChange={(e) => {
                          const grp = taxonomy.childCategories.find((c) => c.id === e.target.value);
                          const mc = taxonomy.mainCategories.find((m) => m.id === navModal.mainCategoryId);
                          setNavModal({
                            ...navModal,
                            childCategoryId: e.target.value,
                            productTypeId: '',
                            route: grp ? `/categories/${grp.slug}` : mc ? `/categories/${mc.slug}` : navModal.route,
                          });
                        }}
                        className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                      >
                        <option value="">All Groups under Main Category</option>
                        {taxonomy.childCategories
                          .filter((c) => c.mainCategoryId === navModal.mainCategoryId)
                          .map((cc) => (
                            <option key={cc.id} value={cc.id}>
                              {cc.name}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-[#5E5946] mb-1">Child Category (Optional)</label>
                      <select
                        value={navModal.productTypeId || ''}
                        onChange={(e) => {
                          const pt = taxonomy.productTypes.find((p) => p.id === e.target.value);
                          const grp = pt ? taxonomy.childCategories.find((c) => c.id === pt.childCategoryId) : undefined;
                          const mc = taxonomy.mainCategories.find((m) => m.id === navModal.mainCategoryId);
                          setNavModal({
                            ...navModal,
                            productTypeId: e.target.value,
                            childCategoryId: pt?.childCategoryId || navModal.childCategoryId || '',
                            route: pt
                              ? `/categories/${grp?.slug || mc?.slug}?productType=${encodeURIComponent(pt.slug)}`
                              : grp
                                ? `/categories/${grp.slug}`
                                : mc
                                  ? `/categories/${mc.slug}`
                                  : navModal.route,
                          });
                        }}
                        className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                      >
                        <option value="">All Child Categories</option>
                        {taxonomy.productTypes
                          .filter(
                            (pt) =>
                              pt.mainCategoryId === navModal.mainCategoryId &&
                              (!navModal.childCategoryId || pt.childCategoryId === navModal.childCategoryId)
                          )
                          .map((pt) => (
                            <option key={pt.id} value={pt.id}>
                              {pt.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                )}
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
              <Button type="submit">Save</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Child Category / Product Type Add & Edit Modal */}
      <Modal
        open={Boolean(productTypeModal)}
        onClose={() => setProductTypeModal(null)}
        title={productTypeModal?.isNew ? 'Add Child Category' : `Edit Child Category — ${productTypeModal?.name || ''}`}
      >
        {productTypeModal && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                if (productTypeModal.isNew) {
                  await adminApi.createProductType({
                    childCategoryId: productTypeModal.childCategoryId,
                    name: productTypeModal.name,
                    slug: productTypeModal.slug || undefined,
                    sortOrder: Number(productTypeModal.sortOrder) || 1,
                    saveAsDraft: false,
                  });
                } else {
                  await adminApi.updateProductType(productTypeModal.id, {
                    childCategoryId: productTypeModal.childCategoryId,
                    name: productTypeModal.name,
                    slug: productTypeModal.slug,
                    sortOrder: Number(productTypeModal.sortOrder) || 1,
                    isActive: productTypeModal.isActive !== false,
                    saveAsDraft: false,
                  });
                }
                pushToast({ title: 'Saved & Synchronized', message: 'Changes saved and synchronized successfully.' });
                setProductTypeModal(null);
                loadTaxonomy();
              } catch (err: any) {
                pushToast({ title: 'Save Failed', message: err.message, variant: 'error' });
              }
            }}
            className="space-y-3 text-xs"
          >
            <div>
              <label className="block font-semibold text-[#5E5946] mb-1">Parent Category Group *</label>
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
                <label className="block font-semibold text-[#5E5946] mb-1">Child Category Name *</label>
                <input
                  required
                  value={productTypeModal.name || ''}
                  onChange={(e) => setProductTypeModal({ ...productTypeModal, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#5E5946] mb-1">
                  Slug {productTypeModal.isNew ? '(optional)' : '*'}
                </label>
                <input
                  required={!productTypeModal.isNew}
                  value={productTypeModal.slug || ''}
                  onChange={(e) => setProductTypeModal({ ...productTypeModal, slug: e.target.value })}
                  placeholder={productTypeModal.isNew ? 'Auto-generated if blank' : ''}
                  className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setProductTypeModal(null)}>
                Cancel
              </Button>
              <Button type="submit">{productTypeModal.isNew ? 'Add Child Category' : 'Save Changes'}</Button>
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
                        saveAsDraft: false,
                      });
                    } else if (deleteTargetModal.kind === 'CHILD') {
                      await adminApi.deleteChildCategory(deleteTargetModal.item.id, {
                        reassignToChildId: deleteTargetModal.reassignToId || undefined,
                        saveAsDraft: false,
                      });
                    } else {
                      await adminApi.deleteProductType(deleteTargetModal.item.id, {
                        reassignToTypeId: deleteTargetModal.reassignToId || undefined,
                        saveAsDraft: false,
                      });
                    }
                    pushToast({ title: 'Saved & Synchronized', message: 'Changes saved and synchronized successfully.' });
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

      {/* Add / Edit Centralized Category Filter Configuration Modal */}
      <Modal
        open={Boolean(filterConfigModal)}
        onClose={() => setFilterConfigModal(null)}
        title={filterConfigModal?.isNew ? 'Add Category Filter Rule' : 'Edit Category Filter Rule'}
      >
        {filterConfigModal && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const parsedOptions = String(filterConfigModal.optionsCsv || '')
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean);
                const payload = {
                  childCategoryId: filterConfigModal.childCategoryId,
                  filterName: filterConfigModal.filterName,
                  fieldKey: filterConfigModal.fieldKey || undefined,
                  fieldType: filterConfigModal.fieldType,
                  options: parsedOptions,
                  selectionMode: filterConfigModal.selectionMode || 'MULTI',
                  isRequired: Boolean(filterConfigModal.isRequired),
                  showInVendor: filterConfigModal.showInVendor !== false,
                  showInCustomer: filterConfigModal.showInCustomer !== false,
                  sortOrder: Number(filterConfigModal.sortOrder || 1),
                  isActive: filterConfigModal.isActive !== false,
                  saveAsDraft: false,
                };
                if (filterConfigModal.isNew) {
                  await adminApi.createCategoryFilterConfig(payload);
                } else {
                  await adminApi.updateCategoryFilterConfig(filterConfigModal.id, payload);
                }
                pushToast({
                  title: 'Saved & Synchronized',
                  message: 'Changes saved and synchronized successfully.',
                });
                setFilterConfigModal(null);
                loadTaxonomy();
              } catch (err: any) {
                pushToast({ title: 'Filter Config Error', message: err.message, variant: 'error' });
              }
            }}
            className="space-y-3 text-xs"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-[#5E5946] mb-1">Filter Display Name *</label>
                <input
                  required
                  value={filterConfigModal.filterName || ''}
                  onChange={(e) => setFilterConfigModal({ ...filterConfigModal, filterName: e.target.value })}
                  placeholder="e.g. Adhesive Grade, Thickness"
                  className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#5E5946] mb-1">Field Key</label>
                <input
                  value={filterConfigModal.fieldKey || ''}
                  disabled={!filterConfigModal.isNew}
                  onChange={(e) => setFilterConfigModal({ ...filterConfigModal, fieldKey: e.target.value })}
                  placeholder="auto-generated e.g. grade"
                  className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg font-mono disabled:bg-slate-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-semibold text-[#5E5946] mb-1">Field Type *</label>
                <select
                  value={filterConfigModal.fieldType || 'DROPDOWN'}
                  onChange={(e) => setFilterConfigModal({ ...filterConfigModal, fieldType: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                >
                  <option value="DROPDOWN">DROPDOWN</option>
                  <option value="MULTISELECT">MULTISELECT</option>
                  <option value="CHECKBOX">CHECKBOX</option>
                  <option value="RANGE">RANGE</option>
                  <option value="TEXT">TEXT</option>
                  <option value="NUMBER">NUMBER</option>
                  <option value="BOOLEAN">BOOLEAN</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[#5E5946] mb-1">Selection Mode</label>
                <select
                  value={filterConfigModal.selectionMode || 'MULTI'}
                  onChange={(e) => setFilterConfigModal({ ...filterConfigModal, selectionMode: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                >
                  <option value="MULTI">MULTI (OR within group)</option>
                  <option value="SINGLE">SINGLE</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[#5E5946] mb-1">Sort Order</label>
                <input
                  type="number"
                  min={1}
                  value={filterConfigModal.sortOrder ?? 1}
                  onChange={(e) => setFilterConfigModal({ ...filterConfigModal, sortOrder: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#5E5946] mb-1">
                Filter / Field Options (comma separated)
              </label>
              <textarea
                rows={2}
                value={filterConfigModal.optionsCsv || ''}
                onChange={(e) => setFilterConfigModal({ ...filterConfigModal, optionsCsv: e.target.value })}
                placeholder="e.g. Type 1 Standard, Type 2 High Strength, Epoxy 2-Part"
                className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(filterConfigModal.isRequired)}
                  onChange={(e) => setFilterConfigModal({ ...filterConfigModal, isRequired: e.target.checked })}
                />
                <span>Required Field</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterConfigModal.showInVendor !== false}
                  onChange={(e) => setFilterConfigModal({ ...filterConfigModal, showInVendor: e.target.checked })}
                />
                <span>Show in Vendor</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterConfigModal.showInCustomer !== false}
                  onChange={(e) => setFilterConfigModal({ ...filterConfigModal, showInCustomer: e.target.checked })}
                />
                <span>Show in Customer</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterConfigModal.isActive !== false}
                  onChange={(e) => setFilterConfigModal({ ...filterConfigModal, isActive: e.target.checked })}
                />
                <span>Active</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setFilterConfigModal(null)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* View Assigned Products in Category Modal */}
      <Modal
        open={Boolean(categoryProductsModal)}
        onClose={() => setCategoryProductsModal(null)}
        title={categoryProductsModal?.title || 'Assigned Products'}
      >
        {categoryProductsModal && (
          <div className="space-y-3 text-xs">
            <p className="text-[#6E6859]">{categoryProductsModal.subtitle}</p>
            {categoryProductsModal.loading ? (
              <p className="py-6 text-center text-[#8E8777]">Loading assigned products...</p>
            ) : categoryProductsModal.products.length === 0 ? (
              <EmptyState
                title="No products assigned yet"
                description="Approved and vendor-submitted products mapped to this category will appear here."
              />
            ) : (
              <div className="divide-y divide-[#E5DCD3] max-h-96 overflow-y-auto">
                {categoryProductsModal.products.map((p) => (
                  <div key={p.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {p.images?.[0] && (
                        <img src={p.images[0]} alt={p.name} className="w-9 h-9 rounded object-cover border border-[#E5DCD3]" />
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-[#5E5946] truncate">{p.name}</p>
                        <p className="text-[11px] text-[#6E6859] truncate">
                          SKU: {p.sku} • {p.brand} • {p.productTypeName || p.subcategory}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-[#5E5946]">{formatINR(p.sellingPrice ?? p.price)}</p>
                      <Badge variant={statusBadgeVariant(p.approvalStatus || 'APPROVED')}>
                        {p.approvalStatus || 'APPROVED'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
