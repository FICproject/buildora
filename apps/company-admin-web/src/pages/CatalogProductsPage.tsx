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
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { STANDARD_CHECKLIST_FILTERS } from '@buildora/constants';
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
  | 'CATEGORY_MANAGEMENT'
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
  const [draggedChildId, setDraggedChildId] = useState<string | null>(null);
  const [draggedTypeId, setDraggedTypeId] = useState<string | null>(null);
  const [expandedGroupIds, setExpandedGroupIds] = useState<Record<string, boolean>>({});
  const [selectedDesktopNavMainId, setSelectedDesktopNavMainId] = useState('');
  const [filterMainId, setFilterMainId] = useState('mc-1');
  const [selectedFilterChildId, setSelectedFilterChildId] = useState('cat-1');
  const [selectedFilterTypeId, setSelectedFilterTypeId] = useState('ALL');
  const [selectedFilterCollectionId, setSelectedFilterCollectionId] = useState('nl-col-cabinet-hardware');
  const [filterChecklistDraft, setFilterChecklistDraft] = useState<string[] | null>(null);
  const [savingFilters, setSavingFilters] = useState(false);

  // Desktop Navigation, Category Management & Product Type modals
  const [navModal, setNavModal] = useState<any>(null);
  const [addMainCatModal, setAddMainCatModal] = useState<{ mainCategoryId: string; name: string } | null>(null);
  const [addChildCatModal, setAddChildCatModal] = useState<{ mainCategoryId: string; childCategoryId: string; name: string } | null>(null);
  const [productTypeModal, setProductTypeModal] = useState<any>(null);
  const [deleteTargetModal, setDeleteTargetModal] = useState<{
    kind: 'MAIN' | 'CHILD' | 'TYPE';
    item: any;
    reassignToId: string;
  } | null>(null);
  const [ptMainFilter, setPtMainFilter] = useState('ALL');
  const [ptChildFilter, setPtChildFilter] = useState('ALL');
  const [ptStatusFilter, setPtStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [ptSearch, setPtSearch] = useState('');

  // Category search/filter & modals
  const [catSearch, setCatSearch] = useState('');
  const [catActiveFilter, setCatActiveFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [childEditModal, setChildEditModal] = useState<any>(null);

  // Filter Configurator state
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

  useEffect(() => {
    setSectionTab(initialSection);
  }, [initialSection]);

  useEffect(() => {
    setStatusFilter(initialStatusFilter || 'ALL');
  }, [initialStatusFilter]);

  const TAB_ROUTE_MAP: Record<CatalogSectionTab, string> = {
    PRODUCTS: '/products',
    NAVIGATION: '/products/navigation',
    CATEGORY_MANAGEMENT: '/products/categories',
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
      setSelectedDesktopNavMainId((prev) => {
        const navs = (res.desktopNavigation || []).filter(
          (n: any) =>
            n.itemType === 'MAIN_CATEGORY' &&
            n.mainCategoryId &&
            n.isActive !== false &&
            n.isVisible !== false &&
            res.mainCategories.some((m: any) => m.id === n.mainCategoryId && m.isActive !== false)
        );
        if (prev && navs.some((n: any) => n.mainCategoryId === prev)) return prev;
        return navs[0]?.mainCategoryId || res.mainCategories.find((m: any) => m.isActive !== false)?.id || '';
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

    const onRealtime = (evt: Event) => {
      const detail = (evt as CustomEvent).detail || {};
      if (sectionTab === 'PRODUCTS') loadProducts();
      if (
        detail.event === 'filters.updated' ||
        detail.event === 'taxonomy.published' ||
        detail.event === 'newLaunches.updated'
      ) {
        loadTaxonomy();
      }
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

  const activeNavMainOptions = React.useMemo(() => {
    const navItems = taxonomy.desktopNavigation
      .filter((nav) => {
        if (nav.itemType !== 'MAIN_CATEGORY' || !nav.mainCategoryId) return false;
        const mc = taxonomy.mainCategories.find((m) => m.id === nav.mainCategoryId);
        return nav.isActive !== false && nav.isVisible !== false && mc && mc.isActive !== false;
      })
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
      .map((nav) => ({
        navId: nav.id,
        mainCategoryId: nav.mainCategoryId as string,
        label: nav.label,
        slug: nav.mainCategorySlug || nav.slug,
      }));
    if (navItems.length > 0) return navItems;
    return taxonomy.mainCategories
      .filter((m) => m.isActive !== false)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .map((m) => ({
        navId: `nav-${m.id}`,
        mainCategoryId: m.id,
        label: m.name,
        slug: m.slug,
      }));
  }, [taxonomy.desktopNavigation, taxonomy.mainCategories]);

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
            { id: 'CATEGORY_MANAGEMENT' as CatalogSectionTab, label: 'Category Management', icon: <FolderTree className="w-3.5 h-3.5" /> },
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
        <div className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-red-900 text-xs flex flex-wrap items-center justify-between gap-3">
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

            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
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
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                <div className="relative flex-1 sm:flex-initial min-w-0">
                  <Search className="w-4 h-4 text-[#6E6859] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search SKU, name, vendor..."
                    className="pl-9 pr-3 py-2 text-xs bg-white border border-[#E5DCD3] rounded-lg w-full sm:w-60 focus:outline-none focus:border-[#AE887B]"
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
                          <div className="absolute left-0 top-full pt-1.5 z-40 max-w-[calc(100vw-2rem)]">
                            <div className="w-[min(480px,calc(100vw-2rem))] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col sm:flex-row text-xs">
                              {nav.itemType === 'NEW_LAUNCHES' ? (
                                <>
                                  <div className="w-full sm:w-56 sm:border-r border-b sm:border-b-0 border-slate-100 p-3 space-y-1 max-h-56 sm:max-h-64 overflow-y-auto">
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
                                  <div className="w-full sm:w-56 sm:border-r border-b sm:border-b-0 border-slate-100 p-3 space-y-1 max-h-56 sm:max-h-64 overflow-y-auto">
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

          {/* Desktop Navigation Items Manager */}
          <Card
            title="Desktop Header Navigation Items"
            subtitle="Choose which existing categories or custom links appear in the Customer Website header and their display order"
            action={
              <Button
                size="sm"
                onClick={() => {
                  const firstActiveMain =
                    taxonomy.mainCategories.find((m) => m.isActive !== false) || taxonomy.mainCategories[0];
                  setNavModal({
                    isNew: true,
                    label: firstActiveMain?.name || '',
                    slug: '',
                    itemType: 'MAIN_CATEGORY',
                    mainCategoryId: firstActiveMain?.id || '',
                    route: firstActiveMain ? `/categories/${firstActiveMain.slug}` : '',
                    displayOrder: taxonomy.desktopNavigation.length + 1,
                    isActive: true,
                  });
                }}
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
                  'Add navigation items to control the links shown in the Customer Website header.'
                }
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button size="sm" variant="outline" onClick={loadTaxonomy}>
                      Retry
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        const firstActiveMain =
                          taxonomy.mainCategories.find((m) => m.isActive !== false) || taxonomy.mainCategories[0];
                        setNavModal({
                          isNew: true,
                          label: firstActiveMain?.name || '',
                          slug: '',
                          itemType: 'MAIN_CATEGORY',
                          mainCategoryId: firstActiveMain?.id || '',
                          route: firstActiveMain ? `/categories/${firstActiveMain.slug}` : '',
                          displayOrder: taxonomy.desktopNavigation.length + 1,
                          isActive: true,
                        });
                      }}
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
                  const parentMainUnavailable = Boolean(
                    nav.itemType === 'MAIN_CATEGORY' &&
                      (!linkedMain || linkedMain.isActive === false || linkedMain.showInNavigation === false)
                  );
                  const effectivelyVisible =
                    nav.isActive !== false && nav.isVisible !== false && !parentMainUnavailable;
                  const typeLabel =
                    nav.itemType === 'MAIN_CATEGORY'
                      ? 'Main Category'
                      : nav.itemType === 'CUSTOM_LINK'
                        ? 'Custom Link'
                        : nav.itemType === 'NEW_LAUNCHES'
                          ? 'New Launches'
                          : nav.itemType === 'DEALS'
                            ? 'Deals'
                            : 'Home';
                  return (
                    <div
                      key={nav.id}
                      className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 transition-colors ${
                        effectivelyVisible
                          ? 'bg-white border-[#E5DCD3] hover:bg-[#FAF7F4]'
                          : 'bg-slate-50 border-slate-200 opacity-80'
                        }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-7 h-7 rounded-lg bg-[#F0DED0] text-[#5E5946] font-bold flex items-center justify-center shrink-0">
                          #{nav.displayOrder}
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-bold text-[#5E5946]">{nav.label}</span>
                            <Badge variant="info">{typeLabel}</Badge>
                            {parentMainUnavailable ? (
                              <Badge variant="warning">Main Category Unavailable</Badge>
                            ) : (
                              <Badge variant={nav.isActive !== false ? 'success' : 'error'}>
                                {nav.isActive !== false ? 'Active' : 'Inactive'}
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-[#6E6859] truncate mt-0.5">
                            Route: <code className="font-mono">{nav.route}</code>
                            {linkedMain ? ` • Linked Main Category: ${linkedMain.name}` : ''}
                            {parentMainUnavailable ? ' (Hidden in Customer header until Main Category is Active)' : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <Button
                          size="sm"
                          variant={nav.isActive !== false ? 'success' : 'outline'}
                          onClick={async () => {
                            const nextActive = !(nav.isActive !== false);
                            await adminApi.updateDesktopNavItem(nav.id, {
                              isActive: nextActive,
                              isVisible: nextActive,
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
      ) : sectionTab === 'CATEGORY_MANAGEMENT' ? (
        (() => {
          const activeMainId =
            activeNavMainOptions.find((n) => n.mainCategoryId === selectedDesktopNavMainId)?.mainCategoryId ||
            activeNavMainOptions[0]?.mainCategoryId ||
            '';
          const selectedNavOption = activeNavMainOptions.find((n) => n.mainCategoryId === activeMainId);
          const q = catSearch.trim().toLowerCase();

          const allMainCatsUnderNav = taxonomy.childCategories
            .filter((c) => c.mainCategoryId === activeMainId)
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

          const visibleMainCategories = allMainCatsUnderNav.filter((mcNode) => {
            if (catActiveFilter === 'ACTIVE' && mcNode.isActive === false) return false;
            if (catActiveFilter === 'INACTIVE' && mcNode.isActive !== false) return false;
            if (!q) return true;
            const childMatch = taxonomy.productTypes.some(
              (pt) => pt.childCategoryId === mcNode.id && pt.name.toLowerCase().includes(q)
            );
            return mcNode.name.toLowerCase().includes(q) || mcNode.slug.toLowerCase().includes(q) || childMatch;
          });

          const totalChildCategoriesCount = allMainCatsUnderNav.reduce(
            (sum, mcNode) => sum + taxonomy.productTypes.filter((pt) => pt.childCategoryId === mcNode.id).length,
            0
          );
          const allExpanded =
            allMainCatsUnderNav.length > 0 && allMainCatsUnderNav.every((c) => Boolean(expandedGroupIds[c.id]));

          return (
            <div className="space-y-4">
              {/* Top Controls: Desktop Navigation Selector + Search + Add Main/Child Category */}
              <Card>
                <div className="space-y-3 text-xs">
                  <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
                    <div className="flex-1 max-w-md space-y-1">
                      <label
                        htmlFor="category-management-nav-selector"
                        className="block font-semibold text-[#5E5946]"
                      >
                        Select Desktop Navigation
                      </label>
                      <select
                        id="category-management-nav-selector"
                        value={activeMainId}
                        onChange={(e) => setSelectedDesktopNavMainId(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-semibold bg-white border border-[#E5DCD3] rounded-lg text-[#5E5946]"
                      >
                        {activeNavMainOptions.length === 0 ? (
                          <option value="">No active Desktop Navigation items</option>
                        ) : (
                          activeNavMainOptions.map((opt) => (
                            <option key={opt.navId} value={opt.mainCategoryId}>
                              {opt.label}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        disabled={!activeMainId}
                        onClick={() =>
                          setAddMainCatModal({
                            mainCategoryId: activeMainId,
                            name: '',
                          })
                        }
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Main Category
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={!activeMainId || allMainCatsUnderNav.length === 0}
                        onClick={() =>
                          setAddChildCatModal({
                            mainCategoryId: activeMainId,
                            childCategoryId: allMainCatsUnderNav[0]?.id || '',
                            name: '',
                          })
                        }
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Child Category
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E5DCD3]/70">
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      <div className="relative flex-1 sm:flex-initial min-w-0">
                        <Search className="w-3.5 h-3.5 text-[#6E6859] absolute left-2.5 top-2" />
                        <input
                          type="text"
                          placeholder="Search Main or Child categories..."
                          value={catSearch}
                          onChange={(e) => setCatSearch(e.target.value)}
                          className="pl-8 pr-3 py-1.5 text-xs bg-white border border-[#E5DCD3] rounded-lg w-full sm:w-60"
                        />
                      </div>
                      {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setCatActiveFilter(st)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border ${
                            catActiveFilter === st
                              ? 'bg-[#AE887B] text-white border-[#AE887B]'
                              : 'bg-white text-[#5E5946] border-[#E5DCD3]'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const next: Record<string, boolean> = { ...expandedGroupIds };
                        for (const c of allMainCatsUnderNav) next[c.id] = !allExpanded;
                        setExpandedGroupIds(next);
                      }}
                    >
                      {allExpanded ? 'Collapse All' : 'Expand All'}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Hierarchy Panel matching Customer Header Left Panel (Main Categories) -> Right Panel (Child Categories) */}
              <Card
                title={selectedNavOption ? `${selectedNavOption.label}` : 'Category Hierarchy'}
                subtitle={`${allMainCatsUnderNav.length} Main Categories • ${totalChildCategoriesCount} Child Categories`}
              >
                {taxonomyLoading && taxonomy.childCategories.length === 0 ? (
                  <p className="text-xs text-[#6E6859] py-8 text-center">Loading categories...</p>
                ) : activeNavMainOptions.length === 0 ? (
                  <EmptyState
                    icon={<FolderTree className="w-6 h-6" />}
                    title="No active Desktop Navigation items found"
                    description="Activate or add a Main Category item in Desktop Navigation to manage its categories."
                  />
                ) : visibleMainCategories.length === 0 ? (
                  <EmptyState
                    icon={<FolderTree className="w-6 h-6" />}
                    title={q || catActiveFilter !== 'ALL' ? 'No matching categories found' : 'No Main Categories yet'}
                    description={
                      q || catActiveFilter !== 'ALL'
                        ? 'Try clearing your search or status filter.'
                        : `Click "+ Add Main Category" above to add the first Main Category under ${selectedNavOption?.label || 'this Desktop Navigation'}.`
                    }
                    action={
                      q || catActiveFilter !== 'ALL' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setCatSearch('');
                            setCatActiveFilter('ALL');
                          }}
                        >
                          Reset Filters
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => setAddMainCatModal({ mainCategoryId: activeMainId, name: '' })}
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Main Category
                        </Button>
                      )
                    }
                  />
                ) : (
                  <div className="space-y-3 text-xs">
                    {visibleMainCategories.map((mcNode) => {
                      const childItems = taxonomy.productTypes
                        .filter((pt) => {
                          if (pt.childCategoryId !== mcNode.id) return false;
                          if (catActiveFilter === 'ACTIVE' && pt.isActive === false) return false;
                          if (catActiveFilter === 'INACTIVE' && pt.isActive !== false) return false;
                          if (q && !mcNode.name.toLowerCase().includes(q)) {
                            return pt.name.toLowerCase().includes(q);
                          }
                          return true;
                        })
                        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
                      const isExpanded = Boolean(expandedGroupIds[mcNode.id]) || Boolean(q);
                      const isMainNodeActive = mcNode.isActive !== false;

                      return (
                        <div
                          key={mcNode.id}
                          draggable
                          onDragStart={() => setDraggedChildId(mcNode.id)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => handleDropChildCategory(mcNode.id, activeMainId)}
                          className={`rounded-xl border transition-colors overflow-hidden ${
                            draggedChildId === mcNode.id
                              ? 'bg-[#F0DED0]/50 border-[#AE887B]'
                              : isMainNodeActive
                                ? 'bg-white border-[#E5DCD3]'
                                : 'bg-slate-50 border-slate-200 opacity-85'
                          }`}
                        >
                          {/* Main Category Row */}
                          <div className="p-3 bg-[#FAF7F4]/80 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <GripVertical className="w-3.5 h-3.5 text-[#8E8777] shrink-0 cursor-move" />
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedGroupIds((prev) => ({
                                    ...prev,
                                    [mcNode.id]: !prev[mcNode.id],
                                  }))
                                }
                                className="p-1 rounded hover:bg-[#E5DCD3]/50 text-[#5E5946] shrink-0"
                                aria-label={`Toggle ${mcNode.name}`}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </button>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-bold text-[#5E5946] truncate">{mcNode.name}</span>
                                  <Badge variant={isMainNodeActive ? 'success' : 'error'}>
                                    {isMainNodeActive ? 'Active' : 'Inactive'}
                                  </Badge>
                                  <span className="text-[11px] text-[#6E6859]">
                                    ({childItems.length} child {childItems.length === 1 ? 'category' : 'categories'})
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setAddChildCatModal({
                                    mainCategoryId: activeMainId,
                                    childCategoryId: mcNode.id,
                                    name: '',
                                  })
                                }
                              >
                                <Plus className="w-3 h-3" /> Add Child Category
                              </Button>
                              <Button
                                size="sm"
                                variant={isMainNodeActive ? 'success' : 'outline'}
                                onClick={async () => {
                                  await adminApi.updateChildCategory(mcNode.id, {
                                    isActive: !isMainNodeActive,
                                    saveAsDraft: false,
                                  });
                                  pushToast({
                                    title: 'Saved & Synchronized',
                                    message: 'Changes saved and synchronized successfully.',
                                  });
                                  loadTaxonomy();
                                }}
                              >
                                {isMainNodeActive ? 'Active' : 'Inactive'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setChildEditModal({ ...mcNode, originalMainId: mcNode.mainCategoryId })}
                              >
                                <Edit3 className="w-3 h-3" /> Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() =>
                                  setDeleteTargetModal({
                                    kind: 'CHILD',
                                    item: mcNode,
                                    reassignToId:
                                      taxonomy.childCategories.find(
                                        (c) =>
                                          c.id !== mcNode.id &&
                                          c.mainCategoryId === activeMainId &&
                                          c.isActive !== false
                                      )?.id || '',
                                  })
                                }
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Expandable Child Categories List */}
                          {isExpanded && (
                            <div className="px-5 py-2.5 space-y-1.5 border-t border-[#E5DCD3]/70 bg-white">
                              {childItems.length === 0 ? (
                                <p className="text-[11px] text-[#8E8777] italic py-1">
                                  No Child Categories under {mcNode.name} yet.
                                </p>
                              ) : (
                                childItems.map((childNode) => {
                                  const isChildActive = childNode.isActive !== false;
                                  return (
                                    <div
                                      key={childNode.id}
                                      className={`flex flex-wrap items-center justify-between gap-2 py-1.5 px-3 rounded-lg border text-[11px] ${
                                        isChildActive
                                          ? 'bg-[#FAF7F4]/60 border-[#E5DCD3]/70'
                                          : 'bg-slate-50 border-slate-200 opacity-75'
                                      }`}
                                    >
                                      <div className="flex flex-wrap items-center gap-2 min-w-0">
                                        <span className="font-medium text-[#5E5946] truncate">
                                          • {childNode.name}
                                        </span>
                                        <Badge variant={isChildActive ? 'success' : 'error'}>
                                          {isChildActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                      </div>

                                      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                                        <Button
                                          size="sm"
                                          variant={isChildActive ? 'success' : 'outline'}
                                          onClick={async () => {
                                            await adminApi.updateProductType(childNode.id, {
                                              isActive: !isChildActive,
                                              saveAsDraft: false,
                                            });
                                            pushToast({
                                              title: 'Saved & Synchronized',
                                              message: 'Changes saved and synchronized successfully.',
                                            });
                                            loadTaxonomy();
                                          }}
                                        >
                                          {isChildActive ? 'Active' : 'Inactive'}
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => setProductTypeModal({ ...childNode })}
                                        >
                                          <Edit3 className="w-3 h-3" /> Edit
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="danger"
                                          onClick={() =>
                                            setDeleteTargetModal({
                                              kind: 'TYPE',
                                              item: childNode,
                                              reassignToId:
                                                taxonomy.productTypes.find(
                                                  (t) => t.id !== childNode.id && t.childCategoryId === childNode.childCategoryId
                                                )?.id || '',
                                            })
                                          }
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>
          );
        })()
      ) : sectionTab === 'PRODUCT_TYPES' ? (
        <div className="space-y-5">
          {(() => {
            const navLabelByMainId = new Map<string, string>();
            taxonomy.mainCategories.forEach((mc) => {
              const linkedNav = taxonomy.desktopNavigation.find(
                (nav) => nav.itemType === 'MAIN_CATEGORY' && nav.mainCategoryId === mc.id
              );
              navLabelByMainId.set(mc.id, linkedNav?.label || mc.name);
            });
            const childMap = new Map(taxonomy.childCategories.map((c) => [c.id, c]));
            const mainCategoryOptions = [...taxonomy.mainCategories]
              .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
              .map((mc) => ({
                id: mc.id,
                label: navLabelByMainId.get(mc.id) || mc.name,
              }));
            const groupOptions = taxonomy.childCategories
              .filter((cc) => ptMainFilter === 'ALL' || cc.mainCategoryId === ptMainFilter)
              .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

            const q = ptSearch.trim().toLowerCase();
            const filteredTypes = taxonomy.productTypes
              .filter((pt) => {
                if (ptMainFilter !== 'ALL' && pt.mainCategoryId !== ptMainFilter) return false;
                if (ptChildFilter !== 'ALL' && pt.childCategoryId !== ptChildFilter) return false;
                const activeState = pt.isActive !== false;
                if (ptStatusFilter === 'ACTIVE' && !activeState) return false;
                if (ptStatusFilter === 'INACTIVE' && activeState) return false;
                if (q) {
                  const grp = childMap.get(pt.childCategoryId);
                  const navLabel = navLabelByMainId.get(pt.mainCategoryId) || '';
                  return (
                    pt.name.toLowerCase().includes(q) ||
                    (grp?.name || '').toLowerCase().includes(q) ||
                    navLabel.toLowerCase().includes(q)
                  );
                }
                return true;
              })
              .sort((a, b) => {
                const navA = navLabelByMainId.get(a.mainCategoryId) || '';
                const navB = navLabelByMainId.get(b.mainCategoryId) || '';
                const grpA = childMap.get(a.childCategoryId)?.name || '';
                const grpB = childMap.get(b.childCategoryId)?.name || '';
                return (
                  navA.localeCompare(navB) ||
                  grpA.localeCompare(grpB) ||
                  (a.sortOrder || 0) - (b.sortOrder || 0)
                );
              });

            const totalTypesCount = taxonomy.productTypes.length;
            const activeTypesCount = taxonomy.productTypes.filter((pt) => pt.isActive !== false).length;
            const totalAssociatedProducts = taxonomy.productTypes.reduce(
              (sum, pt) => sum + Number(pt.productCount ?? 0),
              0
            );

            return (
              <div className="space-y-4">
                {/* Compact Summary Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white border border-[#E5DCD3] rounded-xl px-4 py-3 flex items-center justify-between">
                    <span className="text-xs font-medium text-[#6E6859]">Total Product Types</span>
                    <span className="text-lg font-bold text-[#5E5946]">{totalTypesCount}</span>
                  </div>
                  <div className="bg-white border border-[#E5DCD3] rounded-xl px-4 py-3 flex items-center justify-between">
                    <span className="text-xs font-medium text-[#6E6859]">Active Product Types</span>
                    <span className="text-lg font-bold text-[#2F6F4E]">{activeTypesCount}</span>
                  </div>
                  <div className="bg-white border border-[#E5DCD3] rounded-xl px-4 py-3 flex items-center justify-between">
                    <span className="text-xs font-medium text-[#6E6859]">Total Associated Products</span>
                    <span className="text-lg font-bold text-[#943D24]">{totalAssociatedProducts}</span>
                  </div>
                </div>

                <Card
                  title={`Product Types (${filteredTypes.length}${filteredTypes.length !== totalTypesCount ? ` of ${totalTypesCount}` : ''})`}
                  action={
                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                      <div className="relative flex-1 sm:flex-initial min-w-0">
                        <Search className="w-3.5 h-3.5 text-[#6E6859] absolute left-2.5 top-2" />
                        <input
                          type="text"
                          placeholder="Search product type, category..."
                          value={ptSearch}
                          onChange={(e) => setPtSearch(e.target.value)}
                          className="pl-8 pr-3 py-1.5 text-xs bg-white border border-[#E5DCD3] rounded-lg w-full sm:w-52"
                        />
                      </div>
                      <select
                        aria-label="Filter by Desktop Navigation"
                        value={ptMainFilter}
                        onChange={(e) => {
                          setPtMainFilter(e.target.value);
                          setPtChildFilter('ALL');
                        }}
                        className="w-full sm:w-auto px-2.5 py-1.5 text-xs bg-white border border-[#E5DCD3] rounded-lg"
                      >
                        <option value="ALL">All Desktop Navigation ({mainCategoryOptions.length})</option>
                        {mainCategoryOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <select
                        aria-label="Filter by Main Category"
                        value={ptChildFilter}
                        onChange={(e) => setPtChildFilter(e.target.value)}
                        className="w-full sm:w-auto px-2.5 py-1.5 text-xs bg-white border border-[#E5DCD3] rounded-lg"
                      >
                        <option value="ALL">All Main Categories ({groupOptions.length})</option>
                        {groupOptions.map((cc) => (
                          <option key={cc.id} value={cc.id}>
                            {cc.name}
                          </option>
                        ))}
                      </select>
                      <select
                        aria-label="Filter by Status"
                        value={ptStatusFilter}
                        onChange={(e) => setPtStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
                        className="w-full sm:w-auto px-2.5 py-1.5 text-xs bg-white border border-[#E5DCD3] rounded-lg"
                      >
                        <option value="ALL">All Status</option>
                        <option value="ACTIVE">Active Only</option>
                        <option value="INACTIVE">Inactive Only</option>
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
                        'Try adjusting your search or filter selections.'
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
                              setPtStatusFilter('ALL');
                            }}
                          >
                            Reset Filters
                          </Button>
                        )
                      }
                    />
                  ) : (
                    <div className="overflow-x-auto max-h-[640px] overflow-y-auto border border-[#E5DCD3] rounded-lg">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-[#FAF7F4] border-b border-[#E5DCD3] sticky top-0 z-10 text-[#6E6859] uppercase tracking-wider text-[11px]">
                          <tr>
                            <th className="py-2.5 px-3 font-semibold">Desktop Navigation</th>
                            <th className="py-2.5 px-3 font-semibold">Main Category</th>
                            <th className="py-2.5 px-3 font-semibold">Child Category / Product Type</th>
                            <th className="py-2.5 px-3 font-semibold text-center">Product Count</th>
                            <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                            <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5DCD3] bg-white">
                          {filteredTypes.map((pt) => {
                            const parentChild = childMap.get(pt.childCategoryId);
                            const desktopNavLabel = navLabelByMainId.get(pt.mainCategoryId) || '—';
                            const count = pt.productCount ?? 0;
                            const activeState = pt.isActive !== false;
                            return (
                              <tr key={pt.id} className="hover:bg-[#FAF7F4]/70 transition-colors">
                                <td className="py-2.5 px-3 text-[#6E6859] font-medium whitespace-nowrap">
                                  {desktopNavLabel}
                                </td>
                                <td className="py-2.5 px-3 text-[#5E5946] font-medium whitespace-nowrap">
                                  {parentChild?.name || '—'}
                                </td>
                                <td className="py-2.5 px-3 text-[#5E5946] font-semibold">
                                  {pt.name}
                                </td>
                                <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openCategoryProductsModal(
                                        pt.id,
                                        `Products in ${pt.name}`,
                                        `${desktopNavLabel} → ${parentChild?.name || ''}`
                                      )
                                    }
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FAF7F4] hover:bg-[#F0DED0] border border-[#E5DCD3] text-[#5E5946] font-semibold transition-colors"
                                  >
                                    <Package className="w-3 h-3 text-[#943D24]" />
                                    <span>Products ({count})</span>
                                  </button>
                                </td>
                                <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                  <Badge variant={activeState ? 'success' : 'error'}>
                                    {activeState ? 'Active' : 'Inactive'}
                                  </Badge>
                                </td>
                                <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                  <div className="inline-flex items-center gap-1.5">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        openCategoryProductsModal(
                                          pt.id,
                                          `Products in ${pt.name}`,
                                          `${desktopNavLabel} → ${parentChild?.name || ''}`
                                        )
                                      }
                                    >
                                      View Products
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setProductTypeModal({ ...pt })}
                                    >
                                      <Edit3 className="w-3 h-3" /> Edit
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant={activeState ? 'outline' : 'success'}
                                      onClick={async () => {
                                        await adminApi.updateProductType(pt.id, {
                                          isActive: !activeState,
                                          saveAsDraft: false,
                                        });
                                        pushToast({
                                          title: 'Saved & Synchronized',
                                          message: `${pt.name} marked ${!activeState ? 'Active' : 'Inactive'} across Vendor & Customer portals.`,
                                        });
                                        loadTaxonomy();
                                      }}
                                    >
                                      {activeState ? 'Deactivate' : 'Activate'}
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              </div>
            );
          })()}
        </div>
      ) : sectionTab === 'FILTERS' ? (
        <div className="space-y-4">
          {(() => {
            const navLabelByMainId = new Map<string, string>();
            taxonomy.mainCategories.forEach((mc) => {
              const linkedNav = taxonomy.desktopNavigation.find(
                (nav) => nav.itemType === 'MAIN_CATEGORY' && nav.mainCategoryId === mc.id
              );
              navLabelByMainId.set(mc.id, linkedNav?.label || mc.name);
            });

            const mainOptions = [...taxonomy.mainCategories].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
            const isNewLaunchesMode = filterMainId === 'NEW_LAUNCHES';
            const effectiveMainId = isNewLaunchesMode
              ? 'NEW_LAUNCHES'
              : mainOptions.find((m) => m.id === filterMainId)?.id || mainOptions[0]?.id || '';

            const allCollections = [...(taxonomy.newLaunchCollections || [])].sort(
              (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)
            );
            const nlMainFilterId =
              isNewLaunchesMode && selectedFilterChildId && selectedFilterChildId !== 'ALL'
                ? selectedFilterChildId
                : 'ALL';
            const filteredCollections = isNewLaunchesMode
              ? allCollections.filter((col) =>
                  nlMainFilterId === 'ALL' ? true : col.mainCategoryId === nlMainFilterId
                )
              : [];
            const selectedCollection = isNewLaunchesMode
              ? filteredCollections.find((c) => c.id === selectedFilterCollectionId) || filteredCollections[0]
              : undefined;

            const childOptions = !isNewLaunchesMode
              ? taxonomy.childCategories
                  .filter((cc) => cc.mainCategoryId === effectiveMainId)
                  .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
              : [];
            const selectedChild = !isNewLaunchesMode
              ? childOptions.find((c) => c.id === selectedFilterChildId) || childOptions[0]
              : undefined;
            const productTypeOptions = selectedChild
              ? taxonomy.productTypes
                  .filter((pt) => pt.childCategoryId === selectedChild.id)
                  .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
              : [];
            const selectedType =
              !isNewLaunchesMode && selectedFilterTypeId !== 'ALL'
                ? productTypeOptions.find((pt) => pt.id === selectedFilterTypeId)
                : undefined;

            const allForSelectedChild = isNewLaunchesMode
              ? (taxonomy.filterConfigs || []).filter(
                  (f) =>
                    selectedCollection &&
                    (f.newLaunchCollectionId === selectedCollection.id ||
                      f.childCategoryId === selectedCollection.id ||
                      f.newLaunchCollectionSlug === selectedCollection.slug)
                )
              : (taxonomy.filterConfigs || []).filter(
                  (f) =>
                    selectedChild &&
                    !f.newLaunchCollectionId &&
                    (f.childCategoryId === selectedChild.id || f.childCategorySlug === selectedChild.slug)
                );
            const hasTypeOverrides =
              !isNewLaunchesMode &&
              Boolean(selectedType) &&
              allForSelectedChild.some((f) => f.productTypeId === selectedType?.id);
            const filtersForScope = (
              isNewLaunchesMode
                ? allForSelectedChild.filter((f) => !f.productTypeId)
                : hasTypeOverrides
                ? allForSelectedChild.filter((f) => f.productTypeId === selectedType?.id)
                : allForSelectedChild.filter((f) => !f.productTypeId)
            ).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

            const checkedKeys =
              filterChecklistDraft !== null
                ? filterChecklistDraft
                : filtersForScope.map((f) => f.fieldKey);
            const checkedKeySet = new Set(checkedKeys.map((k) => k.toLowerCase()));
            const isDirty = filterChecklistDraft !== null;

            const navDisplayName = isNewLaunchesMode
              ? 'New Launches'
              : navLabelByMainId.get(effectiveMainId) || 'Category';
            const selectedPathLabel = isNewLaunchesMode
              ? [navDisplayName, selectedCollection?.title || selectedCollection?.name].filter(Boolean).join(' → ')
              : [navDisplayName, selectedChild?.name, selectedType?.name].filter(Boolean).join(' → ');

            const handleToggleChecklistItem = (fieldKey: string) => {
              const base = [...checkedKeys];
              const idx = base.findIndex((k) => k.toLowerCase() === fieldKey.toLowerCase());
              if (idx >= 0) {
                base.splice(idx, 1);
              } else {
                base.push(fieldKey);
              }
              setFilterChecklistDraft(base);
            };

            const handleSaveChecklistChanges = async () => {
              if (!isNewLaunchesMode && !selectedChild) return;
              if (isNewLaunchesMode && !selectedCollection) return;
              setSavingFilters(true);
              try {
                const payloadFilters: any[] = [];
                // Preserve existing order for currently configured filters that remain checked
                const seenLower = new Set<string>();
                for (const existing of filtersForScope) {
                  const low = existing.fieldKey.toLowerCase();
                  if (checkedKeySet.has(low) && !seenLower.has(low)) {
                    seenLower.add(low);
                    payloadFilters.push({
                      id: isNewLaunchesMode || hasTypeOverrides || !selectedType ? existing.id : undefined,
                      fieldKey: existing.fieldKey,
                      filterName: existing.filterName,
                      fieldType: existing.fieldType,
                      selectionMode: existing.selectionMode,
                      isRequired: existing.isRequired,
                      isActive: existing.isActive !== false,
                      showInVendor: existing.showInVendor,
                      showInCustomer: existing.showInCustomer,
                      hideEmptyOptions: existing.hideEmptyOptions,
                      allowCustomOption: existing.allowCustomOption,
                      options: existing.options || [],
                      specKeys: existing.specKeys,
                      catAttrKeys: existing.catAttrKeys,
                      isStandardField: existing.isStandardField,
                      sortOrder: payloadFilters.length + 1,
                    });
                  }
                }
                // Append newly checked standard checklist items in canonical order
                for (const tmpl of STANDARD_CHECKLIST_FILTERS) {
                  const low = tmpl.fieldKey.toLowerCase();
                  if (checkedKeySet.has(low) && !seenLower.has(low)) {
                    seenLower.add(low);
                    const isCoreField = ['category', 'subcategory', 'brand', 'price'].includes(low);
                    payloadFilters.push({
                      fieldKey: tmpl.fieldKey,
                      filterName: tmpl.filterName,
                      fieldType: tmpl.fieldType,
                      selectionMode: tmpl.selectionMode,
                      isRequired: false,
                      isActive: true,
                      showInVendor: !isCoreField,
                      showInCustomer: true,
                      options: [],
                      specKeys: tmpl.specKeys,
                      catAttrKeys: tmpl.catAttrKeys,
                      isStandardField: tmpl.isStandardField,
                      sortOrder: payloadFilters.length + 1,
                    });
                  }
                }
                await adminApi.syncCategoryFilters({
                  childCategoryId: isNewLaunchesMode ? selectedCollection!.id : selectedChild!.id,
                  newLaunchCollectionId: isNewLaunchesMode ? selectedCollection!.id : undefined,
                  productTypeId: isNewLaunchesMode ? undefined : selectedType?.id,
                  filters: payloadFilters,
                });
                setFilterChecklistDraft(null);
                pushToast({
                  title: 'Saved & Synchronized',
                  message: `Saved ${payloadFilters.length} filter(s) for ${selectedPathLabel}. Configuration updated across Vendor & Customer.`,
                });
                await loadTaxonomy();
              } catch (err: any) {
                pushToast({
                  title: 'Save Failed',
                  message: err?.message ? `${err.message} Failed to save; please retry.` : 'Failed to save; please retry.',
                  variant: 'error',
                });
              } finally {
                setSavingFilters(false);
              }
            };

            return (
              <div className="space-y-4">
                {/* Step 1: Select Category or New Launches Collection */}
                <Card
                  title="Step 1: Select Category or New Launches Collection"
                  subtitle="Choose Desktop Navigation (or New Launches), Main Category, and Child Category / Collection to configure its filters"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-[#5E5946] mb-1">
                        1. Desktop Navigation
                      </label>
                      <select
                        aria-label="Select Desktop Navigation"
                        value={effectiveMainId}
                        onChange={(e) => {
                          const mid = e.target.value;
                          setFilterMainId(mid);
                          if (mid === 'NEW_LAUNCHES') {
                            setSelectedFilterChildId('ALL');
                            setSelectedFilterTypeId('ALL');
                            setSelectedFilterCollectionId(allCollections[0]?.id || '');
                          } else {
                            const firstChild = taxonomy.childCategories
                              .filter((c) => c.mainCategoryId === mid)
                              .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))[0];
                            setSelectedFilterChildId(firstChild?.id || '');
                            setSelectedFilterTypeId('ALL');
                          }
                          setFilterChecklistDraft(null);
                        }}
                        className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg font-medium text-[#5E5946]"
                      >
                        {mainOptions.map((mc) => (
                          <option key={mc.id} value={mc.id}>
                            {navLabelByMainId.get(mc.id) || mc.name}
                          </option>
                        ))}
                        <option value="NEW_LAUNCHES">New Launches (8 Collections)</option>
                      </select>
                    </div>

                    {isNewLaunchesMode ? (
                      <>
                        <div>
                          <label className="block font-semibold text-[#5E5946] mb-1">
                            2. Main Category
                          </label>
                          <select
                            aria-label="Select Main Category"
                            value={nlMainFilterId}
                            onChange={(e) => {
                              const nextMain = e.target.value;
                              setSelectedFilterChildId(nextMain);
                              const nextCols = allCollections.filter((col) =>
                                nextMain === 'ALL' ? true : col.mainCategoryId === nextMain
                              );
                              setSelectedFilterCollectionId(nextCols[0]?.id || '');
                              setFilterChecklistDraft(null);
                            }}
                            className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg font-medium text-[#5E5946]"
                          >
                            <option value="ALL">All New Launches Categories</option>
                            {mainOptions.map((mc) => (
                              <option key={mc.id} value={mc.id}>
                                {mc.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block font-semibold text-[#5E5946] mb-1">
                            3. New Launches Collection
                          </label>
                          <select
                            aria-label="Select New Launches Collection"
                            value={selectedCollection?.id || ''}
                            onChange={(e) => {
                              setSelectedFilterCollectionId(e.target.value);
                              setFilterChecklistDraft(null);
                            }}
                            className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg font-medium text-[#5E5946]"
                          >
                            {filteredCollections.map((col) => (
                              <option key={col.id} value={col.id}>
                                {col.title || col.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="block font-semibold text-[#5E5946] mb-1">
                            2. Main Category
                          </label>
                          <select
                            aria-label="Select Main Category"
                            value={selectedChild?.id || ''}
                            onChange={(e) => {
                              setSelectedFilterChildId(e.target.value);
                              setSelectedFilterTypeId('ALL');
                              setFilterChecklistDraft(null);
                            }}
                            className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg font-medium text-[#5E5946]"
                          >
                            {childOptions.map((cc) => (
                              <option key={cc.id} value={cc.id}>
                                {cc.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block font-semibold text-[#5E5946] mb-1">
                            3. Child Category
                          </label>
                          <select
                            aria-label="Select Child Category"
                            value={selectedType?.id || 'ALL'}
                            onChange={(e) => {
                              setSelectedFilterTypeId(e.target.value);
                              setFilterChecklistDraft(null);
                            }}
                            className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg font-medium text-[#5E5946]"
                          >
                            <option value="ALL">
                              All Child Categories ({selectedChild?.name || 'Default'})
                            </option>
                            {productTypeOptions.map((pt) => (
                              <option key={pt.id} value={pt.id}>
                                {pt.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                </Card>

                {/* Step 2: Configure Filters */}
                <Card
                  title={`Step 2: Configure Filters — ${selectedPathLabel}`}
                  subtitle={
                    isNewLaunchesMode
                      ? 'Configure active filters, options, order, and required fields for this New Launches collection. Vendor & Customer portals sync automatically on Save.'
                      : selectedType && !hasTypeOverrides
                      ? `Currently inheriting rules from ${selectedChild?.name}. Save Changes or Add Filter to customize specifically for ${selectedType.name}.`
                      : 'Select required filters below. Vendor fields and Customer website filters update automatically on Save.'
                  }
                  action={
                    ((!isNewLaunchesMode && selectedChild) || (isNewLaunchesMode && selectedCollection)) && (
                      <div className="flex flex-wrap items-center gap-2">
                        {!isNewLaunchesMode && selectedType && hasTypeOverrides && selectedChild && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              setSavingFilters(true);
                              try {
                                await adminApi.syncCategoryFilters({
                                  childCategoryId: selectedChild.id,
                                  productTypeId: selectedType.id,
                                  resetOverride: true,
                                  filters: [],
                                });
                                setFilterChecklistDraft(null);
                                pushToast({
                                  title: 'Saved & Synchronized',
                                  message: `${selectedType.name} now inherits rules from ${selectedChild.name}.`,
                                });
                                await loadTaxonomy();
                              } finally {
                                setSavingFilters(false);
                              }
                            }}
                            disabled={savingFilters}
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Reset to Main Category Default
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setFilterConfigModal(
                              isNewLaunchesMode && selectedCollection
                                ? {
                                    isNew: true,
                                    mainCategoryId: selectedCollection.mainCategoryId || 'mc-new-launches',
                                    childCategoryId: selectedCollection.id,
                                    childCategorySlug: selectedCollection.slug,
                                    newLaunchCollectionId: selectedCollection.id,
                                    filterName: '',
                                    fieldKey: '',
                                    fieldType: 'MULTISELECT',
                                    optionsCsv: '',
                                    selectionMode: 'MULTI',
                                    isRequired: false,
                                    showInVendor: true,
                                    showInCustomer: true,
                                    sortOrder: filtersForScope.length + 1,
                                    isActive: true,
                                  }
                                : {
                                    isNew: true,
                                    mainCategoryId: selectedChild!.mainCategoryId || effectiveMainId,
                                    childCategoryId: selectedChild!.id,
                                    childCategorySlug: selectedChild!.slug,
                                    productTypeId: selectedType?.id,
                                    filterName: '',
                                    fieldKey: '',
                                    fieldType: 'MULTISELECT',
                                    optionsCsv: '',
                                    selectionMode: 'MULTI',
                                    isRequired: false,
                                    showInVendor: true,
                                    showInCustomer: true,
                                    sortOrder: filtersForScope.length + 1,
                                    isActive: true,
                                  }
                            )
                          }
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Filter
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveChecklistChanges}
                          disabled={savingFilters}
                        >
                          {savingFilters ? 'Saving...' : isDirty ? 'Save Changes *' : 'Save Changes'}
                        </Button>
                      </div>
                    )
                  }
                >
                  {/* Standard Available Filters Checklist */}
                  <div className="p-3.5 rounded-xl bg-[#FAF7F4] border border-[#E5DCD3] mb-4 space-y-2.5 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-[#5E5946]">
                        Available Filters Checklist ({checkedKeySet.size} selected)
                      </span>
                      <span className="text-[11px] text-[#6E6859]">
                        Multi-Select filters support multiple values • Price uses numeric From / To range
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {STANDARD_CHECKLIST_FILTERS.map((item) => {
                        const checked = checkedKeySet.has(item.fieldKey.toLowerCase());
                        return (
                          <label
                            key={item.fieldKey}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors select-none ${
                              checked
                                ? 'bg-white border-[#943D24] text-[#5E5946] font-semibold shadow-2xs'
                                : 'bg-white/70 border-[#E5DCD3] text-[#6E6859] hover:bg-white'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleToggleChecklistItem(item.fieldKey)}
                              className="w-4 h-4 rounded text-[#943D24]"
                            />
                            <span className="truncate">{item.filterName}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Configured Filters Table */}
                  {filtersForScope.length === 0 ? (
                    <EmptyState
                      title="No filters configured for this category"
                      description="Select filters from the checklist above and click Save Changes, or use Add Filter."
                    />
                  ) : (
                    <div className="overflow-x-auto border border-[#E5DCD3] rounded-lg">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-[#FAF7F4] border-b border-[#E5DCD3] text-[#6E6859] uppercase tracking-wider text-[11px]">
                          <tr>
                            <th className="py-2.5 px-3 font-semibold text-center w-16">Order</th>
                            <th className="py-2.5 px-3 font-semibold">Filter Name</th>
                            <th className="py-2.5 px-3 font-semibold">Filter Type</th>
                            <th className="py-2.5 px-3 font-semibold">Selection Type</th>
                            <th className="py-2.5 px-3 font-semibold text-center">Required</th>
                            <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                            <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5DCD3] bg-white">
                          {filtersForScope.map((fc) => {
                            const active = fc.isActive !== false;
                            return (
                              <tr key={fc.id} className={!active ? 'bg-slate-50 opacity-75' : 'hover:bg-[#FAF7F4]/60'}>
                                <td className="py-2.5 px-3 text-center font-semibold text-[#6E6859]">
                                  #{fc.sortOrder}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="font-bold text-[#5E5946]">{fc.filterName}</span>
                                </td>
                                <td className="py-2.5 px-3 text-[#6E6859]">
                                  {fc.fieldType === 'RANGE' ? 'Numeric Range (From / To)' : fc.fieldType}
                                </td>
                                <td className="py-2.5 px-3 text-[#6E6859]">
                                  {fc.selectionMode === 'SINGLE' ? 'Single' : 'Multi-Select'}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <Badge variant={fc.isRequired ? 'warning' : 'default'}>
                                    {fc.isRequired ? 'Required' : 'Optional'}
                                  </Badge>
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <Badge variant={active ? 'success' : 'error'}>
                                    {active ? 'Active' : 'Inactive'}
                                  </Badge>
                                </td>
                                <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                  <div className="inline-flex items-center gap-1.5">
                                      <Button
                                        size="sm"
                                        variant={active ? 'outline' : 'success'}
                                        disabled={savingFilters}
                                        onClick={async () => {
                                          setSavingFilters(true);
                                          try {
                                            if (selectedType && !hasTypeOverrides && selectedChild) {
                                              const cloned = filtersForScope.map((row) => ({
                                                ...row,
                                                id: undefined,
                                                isActive: row.id === fc.id ? !active : row.isActive !== false,
                                              }));
                                              await adminApi.syncCategoryFilters({
                                                childCategoryId: selectedChild.id,
                                                productTypeId: selectedType.id,
                                                filters: cloned,
                                              });
                                            } else {
                                              await adminApi.updateCategoryFilterConfig(fc.id, {
                                                isActive: !active,
                                                saveAsDraft: false,
                                              });
                                            }
                                            setFilterChecklistDraft(null);
                                            pushToast({
                                              title: 'Saved & Synchronized',
                                              message: `${fc.filterName} marked ${!active ? 'Active' : 'Inactive'}.`,
                                            });
                                            await loadTaxonomy();
                                          } catch (err: any) {
                                            pushToast({
                                              title: 'Save Failed',
                                              message: err?.message ? `${err.message} Failed to save; please retry.` : 'Failed to save; please retry.',
                                              variant: 'error',
                                            });
                                          } finally {
                                            setSavingFilters(false);
                                          }
                                        }}
                                      >
                                        {active ? 'Deactivate' : 'Activate'}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          setFilterConfigModal({
                                            ...fc,
                                            isNew: false,
                                            cloneScopeOnInheritedEdit: Boolean(selectedType && !hasTypeOverrides),
                                            baseFiltersForClone:
                                              selectedType && !hasTypeOverrides ? filtersForScope : undefined,
                                            productTypeId: selectedType?.id || fc.productTypeId,
                                            optionsCsv: (fc.options || []).join(', '),
                                          })
                                        }
                                      >
                                        <Edit3 className="w-3 h-3" /> Edit
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="danger"
                                        disabled={savingFilters}
                                        onClick={async () => {
                                          setSavingFilters(true);
                                          try {
                                            if (selectedType && !hasTypeOverrides && selectedChild) {
                                              const cloned = filtersForScope
                                                .filter((row) => row.id !== fc.id)
                                                .map((row, idx) => ({ ...row, id: undefined, sortOrder: idx + 1 }));
                                              await adminApi.syncCategoryFilters({
                                                childCategoryId: selectedChild.id,
                                                productTypeId: selectedType.id,
                                                filters: cloned,
                                              });
                                            } else {
                                              await adminApi.deleteCategoryFilterConfig(fc.id, false);
                                            }
                                            setFilterChecklistDraft(null);
                                            pushToast({
                                              title: 'Saved & Synchronized',
                                              message: `${fc.filterName} removed.`,
                                            });
                                            await loadTaxonomy();
                                          } catch (err: any) {
                                            pushToast({
                                              title: 'Save Failed',
                                              message: err?.message ? `${err.message} Failed to save; please retry.` : 'Failed to save; please retry.',
                                              variant: 'error',
                                            });
                                          } finally {
                                            setSavingFilters(false);
                                          }
                                        }}
                                      >
                                        <Trash2 className="w-3 h-3" /> Remove
                                      </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              </div>
            );
          })()}
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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

      {/* Add Main Category Modal (Desktop Navigation + Main Category Name) */}
      <Modal
        open={Boolean(addMainCatModal)}
        onClose={() => setAddMainCatModal(null)}
        title="Add Main Category"
      >
        {addMainCatModal && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const trimmed = addMainCatModal.name.trim();
                if (!addMainCatModal.mainCategoryId || !trimmed) {
                  pushToast({
                    title: 'Validation Error',
                    message: 'Select a Desktop Navigation item and enter a Main Category Name.',
                    variant: 'error',
                  });
                  return;
                }
                const nextOrder =
                  taxonomy.childCategories.filter((c) => c.mainCategoryId === addMainCatModal.mainCategoryId).length + 1;
                await adminApi.createChildCategory({
                  mainCategoryId: addMainCatModal.mainCategoryId,
                  name: trimmed,
                  sortOrder: nextOrder,
                  saveAsDraft: false,
                });
                setSelectedDesktopNavMainId(addMainCatModal.mainCategoryId);
                pushToast({
                  title: 'Saved & Synchronized',
                  message: 'Changes saved and synchronized successfully.',
                });
                setAddMainCatModal(null);
                await loadTaxonomy();
              } catch (err: any) {
                pushToast({ title: 'Save Failed', message: err.message, variant: 'error' });
              }
            }}
            className="space-y-3 text-xs"
          >
            <div>
              <label className="block font-semibold text-[#5E5946] mb-1">Select Desktop Navigation *</label>
              <select
                required
                value={addMainCatModal.mainCategoryId}
                onChange={(e) => setAddMainCatModal({ ...addMainCatModal, mainCategoryId: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
              >
                {activeNavMainOptions.map((opt) => (
                  <option key={opt.navId} value={opt.mainCategoryId}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#5E5946] mb-1">Main Category Name *</label>
              <input
                required
                autoFocus
                value={addMainCatModal.name}
                onChange={(e) => setAddMainCatModal({ ...addMainCatModal, name: e.target.value })}
                placeholder="e.g. Cement"
                className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setAddMainCatModal(null)}>
                Cancel
              </Button>
              <Button type="submit">Add Main Category</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Add Child Category Modal (Desktop Navigation -> Main Category -> Child Category Name) */}
      <Modal
        open={Boolean(addChildCatModal)}
        onClose={() => setAddChildCatModal(null)}
        title="Add Child Category"
      >
        {addChildCatModal && (() => {
          const scopedMainCategories = taxonomy.childCategories
            .filter((c) => c.mainCategoryId === addChildCatModal.mainCategoryId)
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
          return (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const trimmed = addChildCatModal.name.trim();
                  if (!addChildCatModal.mainCategoryId || !addChildCatModal.childCategoryId || !trimmed) {
                    pushToast({
                      title: 'Validation Error',
                      message: 'Select Desktop Navigation, Main Category, and enter a Child Category Name.',
                      variant: 'error',
                    });
                    return;
                  }
                  const nextOrder =
                    taxonomy.productTypes.filter((pt) => pt.childCategoryId === addChildCatModal.childCategoryId).length + 1;
                  await adminApi.createProductType({
                    mainCategoryId: addChildCatModal.mainCategoryId,
                    childCategoryId: addChildCatModal.childCategoryId,
                    name: trimmed,
                    sortOrder: nextOrder,
                    saveAsDraft: false,
                  });
                  setSelectedDesktopNavMainId(addChildCatModal.mainCategoryId);
                  setExpandedGroupIds((prev) => ({ ...prev, [addChildCatModal.childCategoryId]: true }));
                  pushToast({
                    title: 'Saved & Synchronized',
                    message: 'Changes saved and synchronized successfully.',
                  });
                  setAddChildCatModal(null);
                  await loadTaxonomy();
                } catch (err: any) {
                  pushToast({ title: 'Save Failed', message: err.message, variant: 'error' });
                }
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold text-[#5E5946] mb-1">Select Desktop Navigation *</label>
                <select
                  required
                  value={addChildCatModal.mainCategoryId}
                  onChange={(e) => {
                    const nextNavMainId = e.target.value;
                    const firstMain = taxonomy.childCategories
                      .filter((c) => c.mainCategoryId === nextNavMainId)
                      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))[0];
                    setAddChildCatModal({
                      ...addChildCatModal,
                      mainCategoryId: nextNavMainId,
                      childCategoryId: firstMain?.id || '',
                    });
                  }}
                  className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                >
                  {activeNavMainOptions.map((opt) => (
                    <option key={opt.navId} value={opt.mainCategoryId}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[#5E5946] mb-1">Select Main Category *</label>
                <select
                  required
                  value={addChildCatModal.childCategoryId}
                  onChange={(e) => setAddChildCatModal({ ...addChildCatModal, childCategoryId: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                >
                  {scopedMainCategories.length === 0 ? (
                    <option value="">No Main Categories under selected Desktop Navigation</option>
                  ) : (
                    scopedMainCategories.map((mc) => (
                      <option key={mc.id} value={mc.id}>
                        {mc.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[#5E5946] mb-1">Child Category Name *</label>
                <input
                  required
                  autoFocus
                  value={addChildCatModal.name}
                  onChange={(e) => setAddChildCatModal({ ...addChildCatModal, name: e.target.value })}
                  placeholder="e.g. Cement & Civil Works"
                  className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setAddChildCatModal(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={scopedMainCategories.length === 0}>
                  Add Child Category
                </Button>
              </div>
            </form>
          );
        })()}
      </Modal>

      {/* Edit Main Category Modal */}
      <Modal
        open={Boolean(childEditModal)}
        onClose={() => setChildEditModal(null)}
        title={`Edit Main Category — ${childEditModal?.name || ''}`}
      >
        {childEditModal && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const updated = await adminApi.updateChildCategory(childEditModal.id, {
                  mainCategoryId: childEditModal.mainCategoryId,
                  name: childEditModal.name,
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
                setChildEditModal(null);
                await loadTaxonomy();
              } catch (err: any) {
                pushToast({ title: 'Save Failed', message: err.message, variant: 'error' });
              }
            }}
            className="space-y-3 text-xs"
          >
            <div>
              <label className="block font-semibold text-[#5E5946] mb-1">Desktop Navigation *</label>
              <select
                value={childEditModal.mainCategoryId || ''}
                onChange={(e) => setChildEditModal({ ...childEditModal, mainCategoryId: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                required
              >
                {activeNavMainOptions.map((opt) => (
                  <option key={opt.navId} value={opt.mainCategoryId}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#5E5946] mb-1">Main Category Name *</label>
              <input
                required
                value={childEditModal.name || ''}
                onChange={(e) => setChildEditModal({ ...childEditModal, name: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#5E5946] mb-1">Status</label>
              <select
                value={childEditModal.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                onChange={(e) => setChildEditModal({ ...childEditModal, isActive: e.target.value === 'ACTIVE' })}
                className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setChildEditModal(null)}>
                Cancel
              </Button>
              <Button type="submit">Save Main Category</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Desktop Navigation Item Add / Edit Modal */}
      <Modal
        open={Boolean(navModal)}
        onClose={() => setNavModal(null)}
        title={navModal?.isNew ? 'Add Navigation Item' : `Edit Navigation — ${navModal?.label || ''}`}
      >
        {navModal && (() => {
          const isBuiltInSystem =
            !navModal.isNew &&
            (navModal.itemType === 'HOME' ||
              navModal.itemType === 'NEW_LAUNCHES' ||
              navModal.itemType === 'DEALS');
          const selectedMain =
            navModal.itemType === 'MAIN_CATEGORY' && navModal.mainCategoryId
              ? taxonomy.mainCategories.find((m) => m.id === navModal.mainCategoryId)
              : null;
          return (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const label = String(navModal.label || '').trim();
                if (!label) {
                  pushToast({ title: 'Validation Error', message: 'Navigation Display Name is required.', variant: 'error' });
                  return;
                }
                const routeVal = String(navModal.route || '').trim();
                if (navModal.itemType === 'CUSTOM_LINK') {
                  const isInternal = routeVal.startsWith('/');
                  const isExternal = /^https?:\/\/.+/i.test(routeVal);
                  if (!routeVal || (!isInternal && !isExternal)) {
                    pushToast({
                      title: 'Invalid Destination Route',
                      message: 'Enter a valid route starting with "/" (e.g. /brands) or an https:// URL.',
                      variant: 'error',
                    });
                    return;
                  }
                }
                const activeFlag = navModal.isActive !== false;
                const payload = {
                  label,
                  itemType: navModal.itemType,
                  mainCategoryId: navModal.itemType === 'MAIN_CATEGORY' ? navModal.mainCategoryId : undefined,
                  childCategoryId: undefined,
                  productTypeId: undefined,
                  route:
                    navModal.itemType === 'MAIN_CATEGORY' && selectedMain
                      ? `/categories/${selectedMain.slug}`
                      : routeVal,
                  hasDropdown: navModal.itemType === 'MAIN_CATEGORY' || navModal.itemType === 'NEW_LAUNCHES',
                  isVisible: activeFlag,
                  isActive: activeFlag,
                  displayOrder: Math.max(1, Number(navModal.displayOrder) || 1),
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#5E5946] mb-1">Navigation Display Name *</label>
                <input
                  required
                  value={navModal.label || ''}
                  onChange={(e) => setNavModal({ ...navModal, label: e.target.value })}
                  placeholder="e.g. Civil & Interiors or Deals"
                  className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#5E5946] mb-1">Navigation Type *</label>
                {isBuiltInSystem ? (
                  <input
                    disabled
                    value={
                      navModal.itemType === 'HOME'
                        ? 'Home'
                        : navModal.itemType === 'NEW_LAUNCHES'
                          ? 'New Launches'
                          : 'Deals'
                    }
                    className="w-full px-3 py-2 bg-slate-100 border border-[#E5DCD3] rounded-lg text-slate-600"
                  />
                ) : (
                  <select
                    value={navModal.itemType || 'MAIN_CATEGORY'}
                    onChange={(e) => {
                      const nextType = e.target.value;
                      if (nextType === 'MAIN_CATEGORY') {
                        const firstMc =
                          taxonomy.mainCategories.find((m) => m.id === navModal.mainCategoryId) ||
                          taxonomy.mainCategories.find((m) => m.isActive !== false) ||
                          taxonomy.mainCategories[0];
                        setNavModal({
                          ...navModal,
                          itemType: nextType,
                          mainCategoryId: firstMc?.id || '',
                          label: firstMc?.name || navModal.label || '',
                          route: firstMc ? `/categories/${firstMc.slug}` : '',
                        });
                      } else {
                        setNavModal({
                          ...navModal,
                          itemType: nextType,
                          mainCategoryId: '',
                          route: navModal.route && !navModal.route.startsWith('/categories/') ? navModal.route : '/brands',
                        });
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                  >
                    <option value="MAIN_CATEGORY">Main Category</option>
                    <option value="CUSTOM_LINK">Custom Navigation Link</option>
                  </select>
                )}
              </div>
            </div>

            {navModal.itemType === 'MAIN_CATEGORY' && (
              <div className="space-y-2">
                <div>
                  <label className="block font-semibold text-[#5E5946] mb-1">Linked Main Category *</label>
                  <select
                    required
                    value={navModal.mainCategoryId || ''}
                    onChange={(e) => {
                      const prevMc = taxonomy.mainCategories.find((m) => m.id === navModal.mainCategoryId);
                      const mc = taxonomy.mainCategories.find((m) => m.id === e.target.value);
                      const shouldAutofillLabel =
                        !navModal.label?.trim() || (prevMc && navModal.label?.trim() === prevMc.name);
                      setNavModal({
                        ...navModal,
                        mainCategoryId: e.target.value,
                        label: shouldAutofillLabel ? mc?.name || '' : navModal.label,
                        route: mc ? `/categories/${mc.slug}` : '',
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
                {selectedMain && selectedMain.isActive === false && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                    Selected Main Category "{selectedMain.name}" is currently Inactive. This navigation link will remain hidden on the Customer Website until it is activated in Main Categories.
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-[#5E5946] mb-1">
                  {navModal.itemType === 'CUSTOM_LINK' ? 'Destination Route / URL *' : 'Route (Auto-populated)'}
                </label>
                <input
                  required
                  readOnly={navModal.itemType !== 'CUSTOM_LINK'}
                  value={navModal.route || ''}
                  onChange={(e) => setNavModal({ ...navModal, route: e.target.value })}
                  placeholder={navModal.itemType === 'CUSTOM_LINK' ? '/brands or https://...' : '/categories/...'}
                  className={`w-full px-3 py-2 border border-[#E5DCD3] rounded-lg font-mono ${
                    navModal.itemType !== 'CUSTOM_LINK' ? 'bg-slate-50 text-slate-600' : 'bg-white'
                  }`}
                />
              </div>
              <div>
                <label className="block font-semibold text-[#5E5946] mb-1">Display Order *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={navModal.displayOrder ?? 1}
                  onChange={(e) => setNavModal({ ...navModal, displayOrder: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#5E5946] mb-1">Status *</label>
              <select
                value={navModal.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                onChange={(e) => setNavModal({ ...navModal, isActive: e.target.value === 'ACTIVE' })}
                className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
              >
                <option value="ACTIVE">Active (Visible in Customer Header)</option>
                <option value="INACTIVE">Inactive (Hidden)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setNavModal(null)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
          );
        })()}
      </Modal>

      {/* Child Category Add & Edit Modal */}
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
                    sortOrder: Number(productTypeModal.sortOrder) || 1,
                    saveAsDraft: false,
                  });
                } else {
                  await adminApi.updateProductType(productTypeModal.id, {
                    childCategoryId: productTypeModal.childCategoryId,
                    name: productTypeModal.name,
                    isActive: productTypeModal.isActive !== false,
                    saveAsDraft: false,
                  });
                }
                pushToast({ title: 'Saved & Synchronized', message: 'Changes saved and synchronized successfully.' });
                setProductTypeModal(null);
                await loadTaxonomy();
              } catch (err: any) {
                pushToast({ title: 'Save Failed', message: err.message, variant: 'error' });
              }
            }}
            className="space-y-3 text-xs"
          >
            <div>
              <label className="block font-semibold text-[#5E5946] mb-1">Parent Main Category *</label>
              <select
                value={productTypeModal.childCategoryId || ''}
                onChange={(e) => setProductTypeModal({ ...productTypeModal, childCategoryId: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
              >
                {taxonomy.childCategories
                  .filter(
                    (cc) =>
                      !productTypeModal.mainCategoryId || cc.mainCategoryId === productTypeModal.mainCategoryId
                  )
                  .map((cc) => (
                    <option key={cc.id} value={cc.id}>
                      {cc.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#5E5946] mb-1">Child Category Name *</label>
              <input
                required
                value={productTypeModal.name || ''}
                onChange={(e) => setProductTypeModal({ ...productTypeModal, name: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
              />
            </div>
            {!productTypeModal.isNew && (
              <div>
                <label className="block font-semibold text-[#5E5946] mb-1">Status</label>
                <select
                  value={productTypeModal.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                  onChange={(e) =>
                    setProductTypeModal({ ...productTypeModal, isActive: e.target.value === 'ACTIVE' })
                  }
                  className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            )}
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
        title={`Delete ${deleteTargetModal?.kind === 'MAIN' ? 'Desktop Navigation Category' : deleteTargetModal?.kind === 'CHILD' ? 'Main Category' : 'Child Category'} — ${deleteTargetModal?.item?.name || ''}`}
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
                  newLaunchCollectionId: filterConfigModal.newLaunchCollectionId,
                  productTypeId: filterConfigModal.productTypeId,
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
                } else if (filterConfigModal.cloneScopeOnInheritedEdit && Array.isArray(filterConfigModal.baseFiltersForClone)) {
                  const cloned = filterConfigModal.baseFiltersForClone.map((row: any) => ({
                    ...row,
                    id: undefined,
                    ...(row.id === filterConfigModal.id ? payload : {}),
                  }));
                  await adminApi.syncCategoryFilters({
                    childCategoryId: filterConfigModal.childCategoryId,
                    productTypeId: filterConfigModal.productTypeId,
                    filters: cloned,
                  });
                } else {
                  await adminApi.updateCategoryFilterConfig(filterConfigModal.id, payload);
                }
                pushToast({
                  title: 'Saved & Synchronized',
                  message: 'Saved successfully. Filter configuration updated across Vendor & Customer.',
                });
                setFilterConfigModal(null);
                await loadTaxonomy();
              } catch (err: any) {
                pushToast({
                  title: 'Filter Config Error',
                  message: err?.message ? `${err.message} Failed to save; please retry.` : 'Failed to save; please retry.',
                  variant: 'error',
                });
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
                Options (Optional — auto-synced from catalog products when blank)
              </label>
              <textarea
                rows={2}
                value={filterConfigModal.optionsCsv || ''}
                onChange={(e) => setFilterConfigModal({ ...filterConfigModal, optionsCsv: e.target.value })}
                placeholder="Comma separated options, or leave blank to derive automatically from approved products"
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
