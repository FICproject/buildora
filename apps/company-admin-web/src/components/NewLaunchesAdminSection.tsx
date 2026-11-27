import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Eye,
  Rocket,
  CheckCircle2,
  Trash2,
  Edit3,
  Search,
  Package,
  Layers,
} from 'lucide-react';
import { adminApi } from '../services/adminApi';
import { Card, Badge, Button, Modal, EmptyState, useToastStore } from './ui';

interface NewLaunchesAdminSectionProps {
  onRefreshParentTaxonomy: () => Promise<void> | void;
  onJumpToCatalogTab: (tab: 'PRODUCT_TYPES' | 'CATEGORY_MANAGEMENT') => void;
}

interface EditModalState {
  id: string;
  title: string;
  badge: string;
  description: string;
  isActive: boolean;
  categoryMappings: any[];
  productIds: string[];
}

export const NewLaunchesAdminSection: React.FC<NewLaunchesAdminSectionProps> = ({
  onRefreshParentTaxonomy,
}) => {
  const pushToast = useToastStore((s) => s.push);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [collections, setCollections] = useState<any[]>([]);
  const [permanentTaxonomy, setPermanentTaxonomy] = useState<{
    desktopNavigation?: any[];
    mainCategories: any[];
    childCategories: any[];
    productTypes: any[];
  }>({ desktopNavigation: [], mainCategories: [], childCategories: [], productTypes: [] });
  const [approvedProducts, setApprovedProducts] = useState<any[]>([]);

  // Modals
  const [viewCollectionId, setViewCollectionId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editModal, setEditModal] = useState<EditModalState | null>(null);
  const [previewCollections, setPreviewCollections] = useState<any[] | null>(null);

  // Add Collection form
  const [createForm, setCreateForm] = useState({
    title: '',
    badge: 'NEW LAUNCH',
    description: '',
    isActive: true,
  });

  // Edit Modal category mapper & product filter
  const [mapMainId, setMapMainId] = useState('');
  const [mapGroupId, setMapGroupId] = useState('');
  const [mapTypeId, setMapTypeId] = useState('');
  const [productSearch, setProductSearch] = useState('');

  const loadState = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getNewLaunchesAdmin();
      const cols = Array.isArray(data?.collections) ? data.collections : [];
      setCollections(cols);
      setPermanentTaxonomy(
        data?.permanentTaxonomy || {
          desktopNavigation: [],
          mainCategories: [],
          childCategories: [],
          productTypes: [],
        }
      );
      setApprovedProducts(Array.isArray(data?.approvedProducts) ? data.approvedProducts : []);
    } catch (err: any) {
      pushToast({
        title: 'Load Failed',
        message: err?.message || 'Unable to load New Launches.',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadState();
  }, []);

  const taxonomyLookups = useMemo(() => {
    const mainMap = new Map(permanentTaxonomy.mainCategories.map((m) => [m.id, m]));
    const childMap = new Map(permanentTaxonomy.childCategories.map((c) => [c.id, c]));
    const typeMap = new Map(permanentTaxonomy.productTypes.map((t) => [t.id, t]));
    const navLabelByMainId = new Map<string, string>();

    permanentTaxonomy.mainCategories.forEach((mc) => {
      const navItem = (permanentTaxonomy.desktopNavigation || []).find(
        (n) => n.itemType === 'MAIN_CATEGORY' && n.mainCategoryId === mc.id
      );
      navLabelByMainId.set(mc.id, navItem?.label || mc.name);
    });

    const eligibleProductMap = new Map(approvedProducts.map((p) => [String(p.id), p]));

    return { mainMap, childMap, typeMap, navLabelByMainId, eligibleProductMap };
  }, [permanentTaxonomy, approvedProducts]);

  const getMappedCategories = (col: any) => {
    const mappings = Array.isArray(col?.categoryMappings) ? col.categoryMappings : [];
    const seenTypeIds = new Set<string>();
    const results: Array<{
      id: string;
      desktopNav: string;
      mainCategory: string;
      childCategory: string;
      childCategoryId: string;
      eligibleCount: number;
    }> = [];

    for (const m of mappings) {
      if (m.mappingStatus !== 'MAPPED' || !m.childCategoryId) continue;
      if (seenTypeIds.has(m.childCategoryId)) continue;
      seenTypeIds.add(m.childCategoryId);

      const pt = taxonomyLookups.typeMap.get(m.childCategoryId);
      const grp = taxonomyLookups.childMap.get(m.categoryGroupId || pt?.childCategoryId);
      const mainId = m.mainCategoryId || grp?.mainCategoryId || pt?.mainCategoryId || '';
      const desktopNav =
        taxonomyLookups.navLabelByMainId.get(mainId) ||
        m.mainCategoryName ||
        '—';
      const mainCategory = grp?.name || m.categoryGroupName || '—';
      const childCategory = pt?.name || m.childCategoryName || m.displayLabel || '—';

      const eligibleCount = approvedProducts.filter(
        (p) => p.productTypeId === m.childCategoryId || (!p.productTypeId && p.childCategoryId === grp?.id)
      ).length;

      results.push({
        id: m.id || m.childCategoryId,
        desktopNav,
        mainCategory,
        childCategory,
        childCategoryId: m.childCategoryId,
        eligibleCount,
      });
    }
    return results;
  };

  const getSelectedEligibleProducts = (col: any) => {
    const ids = Array.from(new Set<string>((col?.productIds || []).map((id: any) => String(id))));
    return ids
      .map((id) => taxonomyLookups.eligibleProductMap.get(id))
      .filter(Boolean);
  };

  const activeMainCategories = useMemo(
    () =>
      permanentTaxonomy.mainCategories
        .filter((m) => m.isActive !== false)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
    [permanentTaxonomy.mainCategories]
  );

  const overviewStats = useMemo(() => {
    const totalCollections = collections.length;
    const activeCollections = collections.filter((c) => c.isActive !== false).length;
    const totalMappedCategories = collections.reduce(
      (sum, col) => sum + getMappedCategories(col).length,
      0
    );
    const totalSelectedProducts = collections.reduce(
      (sum, col) => sum + getSelectedEligibleProducts(col).length,
      0
    );
    return {
      totalCollections,
      activeCollections,
      totalMappedCategories,
      totalSelectedProducts,
    };
  }, [collections, taxonomyLookups, approvedProducts]);

  const viewCollection = useMemo(
    () => collections.find((c) => c.id === viewCollectionId) || null,
    [collections, viewCollectionId]
  );

  const openEditModal = (col: any) => {
    const firstMain = activeMainCategories[0]?.id || permanentTaxonomy.mainCategories[0]?.id || '';
    const firstGroup =
      permanentTaxonomy.childCategories.find(
        (c) => c.mainCategoryId === firstMain && c.isActive !== false
      )?.id || '';
    const firstType =
      permanentTaxonomy.productTypes.find(
        (t) => t.childCategoryId === firstGroup && t.isActive !== false
      )?.id || '';

    setMapMainId(firstMain);
    setMapGroupId(firstGroup);
    setMapTypeId(firstType);
    setProductSearch('');

    const dedupProductIds = Array.from(
      new Set<string>(
        (col.productIds || [])
          .map((id: any) => String(id))
          .filter((id: string) => taxonomyLookups.eligibleProductMap.has(id))
      )
    );

    setEditModal({
      id: col.id,
      title: col.title || '',
      badge: col.badge || '',
      description: col.description || '',
      isActive: col.isActive !== false,
      categoryMappings: Array.isArray(col.categoryMappings) ? [...col.categoryMappings] : [],
      productIds: dedupProductIds,
    });
  };

  const handleToggleStatus = async (col: any) => {
    const nextActive = !(col.isActive !== false);
    try {
      await adminApi.updateNewLaunchCollection(col.id, {
        isActive: nextActive,
        publishStatus: 'PUBLISHED',
        saveAsDraft: false,
        confirmIncompleteMappings: true,
      });
      pushToast({
        title: 'Saved & Synchronized',
        message: `${col.title} marked ${nextActive ? 'Active' : 'Inactive'}.`,
      });
      await loadState();
      await onRefreshParentTaxonomy();
    } catch (err: any) {
      pushToast({
        title: 'Status Update Failed',
        message: err?.message || 'Unable to update collection status.',
        variant: 'error',
      });
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title.trim()) return;
    setSaving(true);
    try {
      await adminApi.createNewLaunchCollection({
        title: createForm.title.trim(),
        badge: createForm.badge.trim() || 'NEW LAUNCH',
        description: createForm.description.trim(),
        isActive: createForm.isActive,
        displayOrder: collections.length + 1,
        saveAsDraft: false,
        confirmIncompleteMappings: true,
      });
      pushToast({
        title: 'Saved & Synchronized',
        message: `Collection "${createForm.title.trim()}" created and synchronized.`,
      });
      setCreateOpen(false);
      setCreateForm({ title: '', badge: 'NEW LAUNCH', description: '', isActive: true });
      await loadState();
      await onRefreshParentTaxonomy();
    } catch (err: any) {
      pushToast({
        title: 'Create Failed',
        message: err?.message || 'Failed to create collection.',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddMappingInEdit = () => {
    if (!editModal || !mapTypeId) return;
    const alreadyMapped = editModal.categoryMappings.some(
      (m) => m.mappingStatus === 'MAPPED' && m.childCategoryId === mapTypeId
    );
    if (alreadyMapped) {
      pushToast({
        title: 'Already Mapped',
        message: 'This category is already mapped to the collection.',
        variant: 'info',
      });
      return;
    }

    const pt = taxonomyLookups.typeMap.get(mapTypeId);
    const grp = taxonomyLookups.childMap.get(mapGroupId || pt?.childCategoryId);
    const main = taxonomyLookups.mainMap.get(mapMainId || grp?.mainCategoryId || pt?.mainCategoryId);
    if (!pt || !grp || !main) return;

    const newMapping = {
      id: `nl-map-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      displayLabel: pt.name,
      mappingStatus: 'MAPPED',
      mainCategoryId: main.id,
      mainCategoryName: taxonomyLookups.navLabelByMainId.get(main.id) || main.name,
      categoryGroupId: grp.id,
      categoryGroupName: grp.name,
      childCategoryId: pt.id,
      childCategoryName: pt.name,
      childCategorySlug: pt.slug,
      isActive: true,
    };

    setEditModal({
      ...editModal,
      categoryMappings: [...editModal.categoryMappings, newMapping],
    });
  };

  const handleRemoveMappingInEdit = (childCategoryId: string) => {
    if (!editModal) return;
    setEditModal({
      ...editModal,
      categoryMappings: editModal.categoryMappings.filter(
        (m) => !(m.mappingStatus === 'MAPPED' && m.childCategoryId === childCategoryId)
      ),
    });
  };

  const handleSaveEditModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal || !editModal.title.trim()) return;
    setSaving(true);
    try {
      const uniqueProductIds = Array.from(
        new Set(
          editModal.productIds.filter((id) => taxonomyLookups.eligibleProductMap.has(String(id)))
        )
      );
      await adminApi.updateNewLaunchCollection(editModal.id, {
        title: editModal.title.trim(),
        name: editModal.title.trim(),
        badge: editModal.badge.trim(),
        description: editModal.description.trim(),
        isActive: editModal.isActive,
        publishStatus: 'PUBLISHED',
        categoryMappings: editModal.categoryMappings,
        productIds: uniqueProductIds,
        saveAsDraft: false,
        confirmIncompleteMappings: true,
      });
      pushToast({
        title: 'Saved & Synchronized',
        message: `Collection "${editModal.title.trim()}" updated and live across Customer & Vendor portals.`,
      });
      setEditModal(null);
      await loadState();
      await onRefreshParentTaxonomy();
    } catch (err: any) {
      pushToast({
        title: 'Save Failed',
        message: err?.message || 'Failed to save collection changes.',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFromEditModal = async () => {
    if (!editModal) return;
    if (!window.confirm(`Delete promotional collection "${editModal.title}"? Permanent categories and products will NOT be affected.`)) {
      return;
    }
    setSaving(true);
    try {
      await adminApi.deleteNewLaunchCollection(editModal.id, false);
      pushToast({
        title: 'Collection Deleted',
        message: `"${editModal.title}" removed.`,
      });
      if (viewCollectionId === editModal.id) setViewCollectionId(null);
      setEditModal(null);
      await loadState();
      await onRefreshParentTaxonomy();
    } catch (err: any) {
      pushToast({
        title: 'Delete Failed',
        message: err?.message || 'Unable to delete collection.',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenPreview = async () => {
    try {
      const list = await adminApi.previewNewLaunches();
      setPreviewCollections(list);
    } catch (err: any) {
      pushToast({
        title: 'Preview Failed',
        message: err?.message || 'Unable to load preview.',
        variant: 'error',
      });
    }
  };

  const editGroupOptions = useMemo(
    () =>
      permanentTaxonomy.childCategories
        .filter((c) => c.mainCategoryId === mapMainId && c.isActive !== false)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
    [permanentTaxonomy.childCategories, mapMainId]
  );

  const editTypeOptions = useMemo(
    () =>
      permanentTaxonomy.productTypes
        .filter((t) => t.childCategoryId === mapGroupId && t.isActive !== false)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
    [permanentTaxonomy.productTypes, mapGroupId]
  );

  const filteredEligibleProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    return approvedProducts.filter((p) => {
      if (!q) return true;
      return (
        String(p.name || '').toLowerCase().includes(q) ||
        String(p.sku || '').toLowerCase().includes(q) ||
        String(p.childCategoryName || '').toLowerCase().includes(q) ||
        String(p.productTypeName || '').toLowerCase().includes(q)
      );
    });
  }, [approvedProducts, productSearch]);

  if (loading && collections.length === 0) {
    return (
      <Card title="New Launches Management">
        <p className="text-xs text-[#6E6859] py-8 text-center">Loading promotional collections...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Compact Overview Strip */}
      <div className="bg-white border border-[#E5DCD3] rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
          <div>
            <p className="text-[11px] font-medium text-[#6E6859]">Total Collections</p>
            <p className="text-lg font-bold text-[#5E5946]">{overviewStats.totalCollections}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-[#6E6859]">Active Collections</p>
            <p className="text-lg font-bold text-[#2F6F4E]">{overviewStats.activeCollections}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-[#6E6859]">Total Mapped Categories</p>
            <p className="text-lg font-bold text-[#5E5946]">{overviewStats.totalMappedCategories}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium text-[#6E6859]">Total Selected Products</p>
            <p className="text-lg font-bold text-[#943D24]">{overviewStats.totalSelectedProducts}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" variant="outline" onClick={handleOpenPreview}>
            <Eye className="w-3.5 h-3.5" /> Preview
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setCreateForm({
                title: '',
                badge: 'NEW LAUNCH',
                description: '',
                isActive: true,
              });
              setCreateOpen(true);
            }}
          >
            <Plus className="w-3.5 h-3.5" /> Add Collection
          </Button>
        </div>
      </div>

      {/* Promotional Collections Table */}
      <Card title={`Promotional Collections (${collections.length})`}>
        {collections.length === 0 ? (
          <EmptyState
            icon={<Rocket className="w-6 h-6" />}
            title="No Promotional Collections Yet"
            description="Create a promotional collection to highlight newly launched categories and products on the Customer Website."
            action={
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="w-3.5 h-3.5" /> Add Collection
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto border border-[#E5DCD3] rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#FAF7F4] border-b border-[#E5DCD3] text-[#6E6859] uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Collection Name</th>
                  <th className="py-2.5 px-4 font-semibold text-center">Mapped Categories</th>
                  <th className="py-2.5 px-4 font-semibold text-center">Products</th>
                  <th className="py-2.5 px-4 font-semibold text-center">Status</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DCD3] bg-white">
                {collections.map((col) => {
                  const mappedList = getMappedCategories(col);
                  const eligibleProducts = getSelectedEligibleProducts(col);
                  const isActive = col.isActive !== false;

                  return (
                    <tr
                      key={col.id}
                      onClick={() => setViewCollectionId(col.id)}
                      className="hover:bg-[#FAF7F4]/80 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-[#5E5946] text-sm">{col.title}</span>
                          {col.badge && (
                            <Badge variant="info">{col.badge}</Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FAF7F4] border border-[#E5DCD3] text-[#5E5946] font-semibold">
                          <Layers className="w-3 h-3 text-[#6E6859]" />
                          {mappedList.length} {mappedList.length === 1 ? 'Category' : 'Categories'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FAF7F4] border border-[#E5DCD3] text-[#5E5946] font-semibold">
                          <Package className="w-3 h-3 text-[#943D24]" />
                          {eligibleProducts.length} {eligibleProducts.length === 1 ? 'Product' : 'Products'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <Badge variant={isActive ? 'success' : 'error'}>
                          {isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td
                        className="py-3 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setViewCollectionId(col.id)}
                          >
                            <Eye className="w-3 h-3" /> View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(col)}
                          >
                            <Edit3 className="w-3 h-3" /> Edit
                          </Button>
                          <Button
                            size="sm"
                            variant={isActive ? 'outline' : 'success'}
                            onClick={() => handleToggleStatus(col)}
                          >
                            {isActive ? 'Deactivate' : 'Activate'}
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

      {/* Collection Details Modal */}
      <Modal
        open={Boolean(viewCollection)}
        onClose={() => setViewCollectionId(null)}
        title={viewCollection ? `${viewCollection.title} — Details` : 'Collection Details'}
        maxWidth="max-w-3xl"
      >
        {viewCollection && (() => {
          const mappedList = getMappedCategories(viewCollection);
          const selectedProducts = getSelectedEligibleProducts(viewCollection);
          const isActive = viewCollection.isActive !== false;

          return (
            <div className="space-y-5 text-xs">
              {/* Section 1: Collection Information */}
              <div className="p-4 rounded-xl bg-[#FAF7F4] border border-[#E5DCD3] space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-bold text-[#5E5946]">{viewCollection.title}</h4>
                    {viewCollection.badge && <Badge variant="info">{viewCollection.badge}</Badge>}
                  </div>
                  <Badge variant={isActive ? 'success' : 'error'}>
                    {isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="text-[#6E6859] leading-relaxed">
                  {viewCollection.description || 'No description provided.'}
                </p>
              </div>

              {/* Section 2: Mapped Categories */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#5E5946]">
                  Mapped Categories ({mappedList.length})
                </h4>
                {mappedList.length === 0 ? (
                  <p className="p-3 rounded-lg bg-[#FAF7F4] border border-dashed border-[#E5DCD3] text-[#6E6859]">
                    No existing categories mapped to this collection yet.
                  </p>
                ) : (
                  <div className="border border-[#E5DCD3] rounded-lg overflow-hidden max-h-52 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-[#FAF7F4] border-b border-[#E5DCD3] text-[#6E6859] text-[11px]">
                        <tr>
                          <th className="py-2 px-3 font-semibold">Desktop Navigation</th>
                          <th className="py-2 px-3 font-semibold">Main Category</th>
                          <th className="py-2 px-3 font-semibold">Child Category</th>
                          <th className="py-2 px-3 font-semibold text-right">Eligible Products</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5DCD3] bg-white">
                        {mappedList.map((m) => (
                          <tr key={m.id}>
                            <td className="py-2 px-3 text-[#6E6859]">{m.desktopNav}</td>
                            <td className="py-2 px-3 text-[#5E5946] font-medium">{m.mainCategory}</td>
                            <td className="py-2 px-3 text-[#5E5946] font-semibold">{m.childCategory}</td>
                            <td className="py-2 px-3 text-right font-semibold text-[#943D24]">
                              {m.eligibleCount}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Section 3: Selected Products */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#5E5946]">
                  Selected Products ({selectedProducts.length})
                </h4>
                {selectedProducts.length === 0 ? (
                  <p className="p-3 rounded-lg bg-[#FAF7F4] border border-dashed border-[#E5DCD3] text-[#6E6859]">
                    No products manually pinned to this collection yet. Use Edit Collection to select eligible products.
                  </p>
                ) : (
                  <div className="border border-[#E5DCD3] rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-[#FAF7F4] border-b border-[#E5DCD3] text-[#6E6859] text-[11px]">
                        <tr>
                          <th className="py-2 px-3 font-semibold">Product</th>
                          <th className="py-2 px-3 font-semibold">SKU</th>
                          <th className="py-2 px-3 font-semibold">Associated Category</th>
                          <th className="py-2 px-3 font-semibold text-center">Approval</th>
                          <th className="py-2 px-3 font-semibold text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5DCD3] bg-white">
                        {selectedProducts.map((prod: any) => (
                          <tr key={prod.id}>
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-2.5">
                                {prod.image ? (
                                  <img
                                    src={prod.image}
                                    alt={prod.name}
                                    className="w-9 h-9 rounded-lg object-cover border border-[#E5DCD3] shrink-0"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-lg bg-[#FAF7F4] border border-[#E5DCD3] flex items-center justify-center shrink-0">
                                    <Package className="w-4 h-4 text-[#8E8777]" />
                                  </div>
                                )}
                                <span className="font-semibold text-[#5E5946]">{prod.name}</span>
                              </div>
                            </td>
                            <td className="py-2 px-3 font-mono text-[11px] text-[#6E6859]">
                              {prod.sku || '—'}
                            </td>
                            <td className="py-2 px-3 text-[#6E6859]">
                              {[prod.childCategoryName, prod.productTypeName].filter(Boolean).join(' → ') || '—'}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <Badge variant="success">{prod.approvalStatus || 'APPROVED'}</Badge>
                            </td>
                            <td className="py-2 px-3 text-center">
                              <Badge variant={prod.isActive !== false ? 'success' : 'error'}>
                                {prod.isActive !== false ? 'Active' : 'Inactive'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E5DCD3]">
                <Button variant="outline" onClick={() => setViewCollectionId(null)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    const target = viewCollection;
                    setViewCollectionId(null);
                    openEditModal(target);
                  }}
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Collection
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* + Add Collection Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add Promotional Collection"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateCollection} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#5E5946] mb-1">Collection Name *</label>
            <input
              required
              placeholder="e.g. Smart Home Electrical"
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#5E5946] mb-1">Badge Label</label>
            <input
              placeholder="e.g. NEW LAUNCH"
              value={createForm.badge}
              onChange={(e) => setCreateForm({ ...createForm, badge: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#5E5946] mb-1">Description (Optional)</label>
            <textarea
              rows={3}
              placeholder="Brief summary of products featured in this promotional collection"
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#5E5946] mb-1">Status</label>
            <select
              value={createForm.isActive ? 'ACTIVE' : 'INACTIVE'}
              onChange={(e) => setCreateForm({ ...createForm, isActive: e.target.value === 'ACTIVE' })}
              className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E5DCD3]">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Creating...' : 'Create Collection'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Collection Modal */}
      <Modal
        open={Boolean(editModal)}
        onClose={() => setEditModal(null)}
        title={editModal ? `Edit Collection — ${editModal.title}` : 'Edit Collection'}
        maxWidth="max-w-3xl"
      >
        {editModal && (() => {
          const mappedItems = getMappedCategories({ categoryMappings: editModal.categoryMappings });
          return (
            <form onSubmit={handleSaveEditModal} className="space-y-5 text-xs">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block font-semibold text-[#5E5946] mb-1">Collection Name *</label>
                  <input
                    required
                    value={editModal.title}
                    onChange={(e) => setEditModal({ ...editModal, title: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#5E5946] mb-1">Status</label>
                  <select
                    value={editModal.isActive ? 'ACTIVE' : 'INACTIVE'}
                    onChange={(e) => setEditModal({ ...editModal, isActive: e.target.value === 'ACTIVE' })}
                    className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#5E5946] mb-1">Badge Label</label>
                  <input
                    value={editModal.badge}
                    onChange={(e) => setEditModal({ ...editModal, badge: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-semibold text-[#5E5946] mb-1">Description</label>
                  <input
                    value={editModal.description}
                    onChange={(e) => setEditModal({ ...editModal, description: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                  />
                </div>
              </div>

              {/* Mapped Existing Categories */}
              <div className="p-3.5 rounded-xl bg-[#FAF7F4] border border-[#E5DCD3] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#5E5946]">
                    Mapped Categories ({mappedItems.length})
                  </span>
                  <span className="text-[11px] text-[#6E6859]">
                    Select existing categories only (Desktop Navigation → Main Category → Child Category)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
                  <div>
                    <label className="block text-[11px] font-medium text-[#6E6859] mb-1">
                      Desktop Navigation
                    </label>
                    <select
                      aria-label="Map Desktop Navigation"
                      value={mapMainId}
                      onChange={(e) => {
                        const nextMain = e.target.value;
                        const nextGroup =
                          permanentTaxonomy.childCategories.find(
                            (c) => c.mainCategoryId === nextMain && c.isActive !== false
                          )?.id || '';
                        const nextType =
                          permanentTaxonomy.productTypes.find(
                            (t) => t.childCategoryId === nextGroup && t.isActive !== false
                          )?.id || '';
                        setMapMainId(nextMain);
                        setMapGroupId(nextGroup);
                        setMapTypeId(nextType);
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#E5DCD3] rounded-lg"
                    >
                      {activeMainCategories.map((m) => (
                        <option key={m.id} value={m.id}>
                          {taxonomyLookups.navLabelByMainId.get(m.id) || m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#6E6859] mb-1">
                      Main Category
                    </label>
                    <select
                      aria-label="Map Main Category"
                      value={mapGroupId}
                      onChange={(e) => {
                        const nextGroup = e.target.value;
                        const nextType =
                          permanentTaxonomy.productTypes.find(
                            (t) => t.childCategoryId === nextGroup && t.isActive !== false
                          )?.id || '';
                        setMapGroupId(nextGroup);
                        setMapTypeId(nextType);
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#E5DCD3] rounded-lg"
                    >
                      {editGroupOptions.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#6E6859] mb-1">
                      Child Category
                    </label>
                    <select
                      aria-label="Map Child Category"
                      value={mapTypeId}
                      onChange={(e) => setMapTypeId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#E5DCD3] rounded-lg"
                    >
                      <option value="">-- Select --</option>
                      {editTypeOptions.map((pt) => (
                        <option key={pt.id} value={pt.id}>
                          {pt.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddMappingInEdit}
                    disabled={!mapTypeId}
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Category
                  </Button>
                </div>

                {mappedItems.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1 max-h-36 overflow-y-auto">
                    {mappedItems.map((m) => (
                      <span
                        key={m.childCategoryId}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-[#E5DCD3] text-[11px] text-[#5E5946]"
                      >
                        <CheckCircle2 className="w-3 h-3 text-[#2F6F4E]" />
                        <span>
                          {m.mainCategory} → <strong>{m.childCategory}</strong>
                        </span>
                        <button
                          type="button"
                          aria-label={`Remove ${m.childCategory}`}
                          onClick={() => handleRemoveMappingInEdit(m.childCategoryId)}
                          className="ml-0.5 text-[#943D24] hover:text-red-700 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Eligible Product Selection */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-[#5E5946]">
                    Selected Products ({editModal.productIds.length})
                  </span>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#6E6859] absolute left-2.5 top-2" />
                    <input
                      type="text"
                      placeholder="Search eligible approved products..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 bg-white border border-[#E5DCD3] rounded-lg w-64"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-[#6E6859]">
                  Showing only Approved, Active products under Active categories ({approvedProducts.length} eligible).
                </p>

                <div className="max-h-52 overflow-y-auto border border-[#E5DCD3] rounded-lg divide-y divide-[#E5DCD3] bg-white">
                  {filteredEligibleProducts.length === 0 ? (
                    <p className="py-6 text-center text-[#6E6859]">
                      No eligible products match your search.
                    </p>
                  ) : (
                    filteredEligibleProducts.map((p) => {
                      const pid = String(p.id);
                      const checked = editModal.productIds.includes(pid);
                      return (
                        <label
                          key={pid}
                          className={`flex items-center justify-between gap-3 px-3 py-2 cursor-pointer transition-colors ${
                            checked ? 'bg-[#F0DED0]/35' : 'hover:bg-[#FAF7F4]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const nextIds = e.target.checked
                                  ? Array.from(new Set([...editModal.productIds, pid]))
                                  : editModal.productIds.filter((id) => id !== pid);
                                setEditModal({ ...editModal, productIds: nextIds });
                              }}
                            />
                            {p.image ? (
                              <img
                                src={p.image}
                                alt={p.name}
                                className="w-8 h-8 rounded object-cover border border-[#E5DCD3] shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded bg-[#FAF7F4] border border-[#E5DCD3] flex items-center justify-center shrink-0">
                                <Package className="w-3.5 h-3.5 text-[#8E8777]" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-semibold text-[#5E5946] truncate">{p.name}</p>
                              <p className="text-[11px] text-[#6E6859] font-mono">{p.sku}</p>
                            </div>
                          </div>
                          <span className="text-[11px] text-[#6E6859] shrink-0">
                            {[p.childCategoryName, p.productTypeName].filter(Boolean).join(' → ')}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#E5DCD3]">
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  onClick={handleDeleteFromEditModal}
                  disabled={saving}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Collection
                </Button>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" onClick={() => setEditModal(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Collection'}
                  </Button>
                </div>
              </div>
            </form>
          );
        })()}
      </Modal>

      {/* Customer Preview Modal */}
      <Modal
        open={Boolean(previewCollections)}
        onClose={() => setPreviewCollections(null)}
        title="Customer Website New Launches Preview"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-3 text-xs max-h-[65vh] overflow-y-auto">
          <p className="text-[#6E6859]">
            Previewing active promotional collections currently synchronized with the Customer Website:
          </p>
          {(previewCollections || []).map((col) => (
            <div key={col.id} className="p-3 rounded-xl border border-[#E5DCD3] bg-[#FAF7F4] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#5E5946]">{col.title}</span>
                <Badge variant="success">
                  {(col.categoryMappings || []).filter((m: any) => m.mappingStatus === 'MAPPED').length} Categories
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(col.categoryMappings || [])
                  .filter((m: any) => m.mappingStatus === 'MAPPED')
                  .map((m: any) => (
                    <span key={m.id} className="px-2 py-0.5 rounded-md bg-white border border-[#E5DCD3] text-[11px]">
                      {m.childCategoryName || m.displayLabel}
                    </span>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};
