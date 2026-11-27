import React, { useEffect, useState } from 'react';
import {
  Plus,
  GripVertical,
  Eye,
  Rocket,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit3,
  Send,
  Link2,
  ExternalLink,
  Search,
} from 'lucide-react';
import { adminApi } from '../services/adminApi';
import { Card, Badge, Button, Modal, useToastStore } from './ui';

interface NewLaunchesAdminSectionProps {
  onRefreshParentTaxonomy: () => Promise<void> | void;
  onJumpToCatalogTab: (tab: 'PRODUCT_TYPES' | 'CHILD_CATEGORIES') => void;
}

export const NewLaunchesAdminSection: React.FC<NewLaunchesAdminSectionProps> = ({
  onRefreshParentTaxonomy,
  onJumpToCatalogTab,
}) => {
  const pushToast = useToastStore((s) => s.push);
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState<any[]>([]);
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(false);
  const [migrationReport, setMigrationReport] = useState<any>(null);
  const [permanentTaxonomy, setPermanentTaxonomy] = useState<{
    mainCategories: any[];
    childCategories: any[];
    productTypes: any[];
  }>({ mainCategories: [], childCategories: [], productTypes: [] });
  const [approvedProducts, setApprovedProducts] = useState<any[]>([]);

  const [workInDraftMode, setWorkInDraftMode] = useState(true);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [uploading, setUploading] = useState(false);

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [previewCollections, setPreviewCollections] = useState<any[] | null>(null);
  const [mappingModal, setMappingModal] = useState<{
    collectionId: string;
    mappingId?: string;
    displayLabel: string;
    mainCategoryId: string;
    categoryGroupId: string;
    childCategoryId: string;
  } | null>(null);

  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    badge: 'NEW LAUNCH',
    image: '',
    bannerImage: '',
    categoryGroupId: '',
    startDate: '',
    endDate: '',
    displayOrder: '9',
    productIds: [] as string[],
  });

  const [editMeta, setEditMeta] = useState<any>(null);

  const loadState = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getNewLaunchesAdmin();
      const cols = Array.isArray(data?.collections) ? data.collections : [];
      setCollections(cols);
      setHasUnpublishedChanges(Boolean(data?.hasUnpublishedChanges));
      setMigrationReport(data?.migrationReport || null);
      setPermanentTaxonomy(
        data?.permanentTaxonomy || { mainCategories: [], childCategories: [], productTypes: [] }
      );
      setApprovedProducts(Array.isArray(data?.approvedProducts) ? data.approvedProducts : []);
      if (cols.length > 0 && (!selectedCollectionId || !cols.some((c: any) => c.id === selectedCollectionId))) {
        setSelectedCollectionId(cols[0].id);
      }
    } catch (err: any) {
      pushToast({ title: 'Load Failed', message: err.message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadState();
  }, []);

  const selectedCollection = collections.find((c) => c.id === selectedCollectionId) || null;

  useEffect(() => {
    if (selectedCollection) {
      setEditMeta({
        id: selectedCollection.id,
        title: selectedCollection.title || selectedCollection.name || '',
        slug: selectedCollection.slug || '',
        description: selectedCollection.description || '',
        badge: selectedCollection.badge || 'NEW LAUNCH',
        image: selectedCollection.image || '',
        bannerImage: selectedCollection.bannerImage || '',
        categoryGroupId: selectedCollection.categoryGroupId || '',
        startDate: selectedCollection.startDate || '',
        endDate: selectedCollection.endDate || '',
        displayOrder: selectedCollection.displayOrder || 1,
        productIds: Array.isArray(selectedCollection.productIds) ? selectedCollection.productIds : [],
      });
    } else {
      setEditMeta(null);
    }
  }, [selectedCollection?.id, selectedCollection?.updatedAt]);

  const handleImageUpload = async (file: File, target: 'create' | 'edit') => {
    setUploading(true);
    try {
      const res = await adminApi.uploadCatalogImage(file);
      const url = res.url;
      if (target === 'create') {
        setCreateForm((prev) => ({ ...prev, image: url, bannerImage: url }));
      } else {
        setEditMeta((prev: any) => ({ ...prev, image: url, bannerImage: url }));
      }
      pushToast({ title: 'Image Uploaded', message: 'Banner/collection image attached.' });
    } catch (err: any) {
      pushToast({ title: 'Upload Failed', message: err.message, variant: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleReorderDrop = async (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    const ids = collections.map((c) => c.id);
    const fromIdx = ids.indexOf(draggedId);
    const toIdx = ids.indexOf(targetId);
    if (fromIdx < 0 || toIdx < 0) return;
    ids.splice(fromIdx, 1);
    ids.splice(toIdx, 0, draggedId);
    setDraggedId(null);
    try {
      await adminApi.reorderNewLaunchCollections(ids, workInDraftMode);
      pushToast({
        title: workInDraftMode ? 'Order Saved in Draft' : 'Display Order Published',
        message: 'Promotional collection order updated.',
      });
      await loadState();
      if (!workInDraftMode) await onRefreshParentTaxonomy();
    } catch (err: any) {
      pushToast({ title: 'Reorder Failed', message: err.message, variant: 'error' });
    }
  };

  const openPreview = async () => {
    try {
      const res = await adminApi.previewNewLaunches();
      setPreviewCollections(res?.collections || []);
    } catch (err: any) {
      pushToast({ title: 'Preview Failed', message: err.message, variant: 'error' });
    }
  };

  const handlePublishAll = async (confirmIncomplete = false) => {
    try {
      await adminApi.publishAllNewLaunches(confirmIncomplete);
      pushToast({
        title: 'New Launches Published',
        message: 'Customer Website navigation & collections updated live.',
      });
      await loadState();
      await onRefreshParentTaxonomy();
    } catch (err: any) {
      if (!confirmIncomplete && String(err.message || '').toLowerCase().includes('unmapped')) {
        if (
          window.confirm(
            `${err.message}\n\nProceed with publishing active mapped shortcuts while keeping unmapped items hidden on Customer Web?`
          )
        ) {
          await handlePublishAll(true);
        }
      } else {
        pushToast({ title: 'Publish Blocked', message: err.message, variant: 'error' });
      }
    }
  };

  const handlePublishSingle = async (colId: string, confirmIncomplete = false) => {
    try {
      await adminApi.publishOneNewLaunch(colId, confirmIncomplete);
      pushToast({ title: 'Collection Published', message: 'Now live on Customer Website.' });
      await loadState();
      await onRefreshParentTaxonomy();
    } catch (err: any) {
      if (!confirmIncomplete && String(err.message || '').toLowerCase().includes('unmapped')) {
        if (
          window.confirm(
            `${err.message}\n\nConfirm publishing anyway? Only mapped shortcuts will display to customers.`
          )
        ) {
          await handlePublishSingle(colId, true);
        }
      } else {
        pushToast({ title: 'Publish Blocked', message: err.message, variant: 'error' });
      }
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Action & Mapping Summary Bar */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 font-bold text-[#5E5946]">
              <Rocket className="w-4 h-4 text-[#943D24]" />
              <span>New Launches Promotional Management</span>
            </div>
            <Badge variant="info">{collections.length} Collections</Badge>
            {migrationReport && (
              <>
                <Badge variant="success">{migrationReport.mappedShortcuts} Mapped Shortcuts</Badge>
                {migrationReport.unmappedShortcuts + migrationReport.groupMatchedShortcuts > 0 && (
                  <Badge variant="warning">
                    {migrationReport.unmappedShortcuts + migrationReport.groupMatchedShortcuts} Unmapped / Needs Review
                  </Badge>
                )}
              </>
            )}
            {hasUnpublishedChanges && <Badge variant="warning">Unpublished Draft Changes</Badge>}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#FAF7F4] border border-[#E5DCD3] cursor-pointer font-semibold text-[#5E5946]">
              <input
                type="checkbox"
                checked={workInDraftMode}
                onChange={(e) => setWorkInDraftMode(e.target.checked)}
              />
              <span>Draft Mode</span>
            </label>
            <Button size="sm" variant="outline" onClick={openPreview}>
              <Eye className="w-3.5 h-3.5" /> Preview Customer View
            </Button>
            <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)}>
              <Plus className="w-3.5 h-3.5" /> New Collection
            </Button>
            <Button size="sm" onClick={() => handlePublishAll(false)}>
              <Send className="w-3.5 h-3.5" /> Publish New Launches
            </Button>
          </div>
        </div>
        <p className="text-[11px] text-[#6E6859] mt-2">
          Promotional navigation layer mapped to permanent Catalog categories without altering Vendor categories or product IDs. Unmapped labels are flagged below so Admin can map them or create permanent categories via Catalog Management.
        </p>
      </Card>

      {/* Main Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Draggable Collection List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <Card title="Promotional Collections (Drag to Reorder)" subtitle="Order controls Customer Header & Showcase">
            {loading ? (
              <p className="text-xs text-[#6E6859] py-6 text-center">Loading promotional collections...</p>
            ) : collections.length === 0 ? (
              <p className="text-xs text-[#6E6859] py-6 text-center">No promotional collections configured.</p>
            ) : (
              <div className="space-y-2 text-xs">
                {collections.map((col) => {
                  const isSelected = col.id === selectedCollectionId;
                  const mappings = col.categoryMappings || [];
                  const mappedCount = mappings.filter((m: any) => m.mappingStatus === 'MAPPED').length;
                  const unmappedCount = mappings.length - mappedCount;
                  const isLive = col.isActive !== false && col.publishStatus !== 'DRAFT';

                  return (
                    <div
                      key={col.id}
                      draggable
                      onDragStart={() => setDraggedId(col.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleReorderDrop(col.id)}
                      onClick={() => setSelectedCollectionId(col.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer space-y-2 ${
                        isSelected
                          ? 'bg-white border-[#943D24] ring-1 ring-[#943D24]/30 shadow-sm'
                          : 'bg-[#FAF7F4] border-[#E5DCD3] hover:bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0">
                          <GripVertical className="w-4 h-4 text-[#9E9689] mt-0.5 shrink-0 cursor-grab" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-[#5E5946]">
                                #{col.displayOrder} {col.title || col.name}
                              </span>
                              <Badge variant={isLive ? 'success' : 'warning'} className="text-[10px]">
                                {isLive ? 'PUBLISHED' : 'DRAFT / HIDDEN'}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-[#6E6859] truncate">
                              /{col.slug} • {mappedCount}/{mappings.length} mapped
                              {unmappedCount > 0 ? ` (${unmappedCount} unmapped)` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          {isLive ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                await adminApi.unpublishOneNewLaunch(col.id);
                                pushToast({ title: 'Collection Unpublished', message: `${col.title} hidden from Customer Web.` });
                                await loadState();
                                await onRefreshParentTaxonomy();
                              }}
                            >
                              Unpublish
                            </Button>
                          ) : (
                            <Button size="sm" onClick={() => handlePublishSingle(col.id, false)}>
                              Publish
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Unmapped Report Box */}
          {migrationReport && migrationReport.unmappedItems?.length > 0 && (
            <Card title="Unmapped Child Category Report" subtitle="Not auto-created; map to existing permanent category or create via Catalog">
              <div className="space-y-1.5 max-h-60 overflow-y-auto text-xs">
                {migrationReport.unmappedItems.map((u: any) => (
                  <div
                    key={`${u.collectionId}-${u.mappingId}`}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg bg-amber-50/70 border border-amber-200"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-[#5E5946] truncate">{u.displayLabel}</p>
                      <p className="text-[10px] text-[#6E6859]">
                        In: {u.collectionTitle} • Status: {u.status}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedCollectionId(u.collectionId);
                        const defaultMain = permanentTaxonomy.mainCategories[0]?.id || 'mc-1';
                        const defaultGrp = u.suggestedCategoryGroupId || permanentTaxonomy.childCategories[0]?.id || 'cat-1';
                        const firstPt = permanentTaxonomy.productTypes.find((pt) => pt.childCategoryId === defaultGrp)?.id || '';
                        setMappingModal({
                          collectionId: u.collectionId,
                          mappingId: u.mappingId,
                          displayLabel: u.displayLabel,
                          mainCategoryId: defaultMain,
                          categoryGroupId: defaultGrp,
                          childCategoryId: firstPt,
                        });
                      }}
                    >
                      Map
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right: Collection Editor & Mapping Inspector (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {!selectedCollection || !editMeta ? (
            <Card>
              <p className="text-xs text-[#6E6859] py-10 text-center">Select a collection on the left to inspect and map categories.</p>
            </Card>
          ) : (
            <>
              <Card
                title={`Configure: ${selectedCollection.title || selectedCollection.name}`}
                subtitle="Promotional label edits never modify permanent product categories"
              >
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      await adminApi.updateNewLaunchCollection(selectedCollection.id, {
                        title: editMeta.title,
                        description: editMeta.description,
                        badge: editMeta.badge,
                        image: editMeta.image,
                        bannerImage: editMeta.bannerImage,
                        categoryGroupId: editMeta.categoryGroupId || undefined,
                        startDate: editMeta.startDate || undefined,
                        endDate: editMeta.endDate || undefined,
                        displayOrder: Number(editMeta.displayOrder || 1),
                        productIds: editMeta.productIds,
                        saveAsDraft: workInDraftMode,
                      });
                      pushToast({
                        title: workInDraftMode ? 'Saved to Draft' : 'Collection Updated',
                        message: workInDraftMode ? 'Click Publish New Launches to push live.' : 'Synced to Customer Website.',
                      });
                      await loadState();
                      if (!workInDraftMode) await onRefreshParentTaxonomy();
                    } catch (err: any) {
                      pushToast({ title: 'Update Failed', message: err.message, variant: 'error' });
                    }
                  }}
                  className="space-y-3 text-xs"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[#5E5946] mb-1">Promotional Collection Name *</label>
                      <input
                        required
                        value={editMeta.title}
                        onChange={(e) => setEditMeta({ ...editMeta, title: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#5E5946] mb-1">Badge Label</label>
                      <input
                        value={editMeta.badge}
                        onChange={(e) => setEditMeta({ ...editMeta, badge: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#5E5946] mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={editMeta.description}
                      onChange={(e) => setEditMeta({ ...editMeta, description: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block font-semibold text-[#5E5946] mb-1">Primary Category Group</label>
                      <select
                        value={editMeta.categoryGroupId}
                        onChange={(e) => setEditMeta({ ...editMeta, categoryGroupId: e.target.value })}
                        className="w-full px-2.5 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                      >
                        <option value="">-- Select Group --</option>
                        {permanentTaxonomy.childCategories.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-[#5E5946] mb-1">Start Date</label>
                      <input
                        type="date"
                        value={editMeta.startDate}
                        onChange={(e) => setEditMeta({ ...editMeta, startDate: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-[#E5DCD3] rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#5E5946] mb-1">End Date</label>
                      <input
                        type="date"
                        value={editMeta.endDate}
                        onChange={(e) => setEditMeta({ ...editMeta, endDate: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-[#E5DCD3] rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex-1 min-w-[200px]">
                      <label className="block font-semibold text-[#5E5946] mb-1">Banner / Collection Image URL</label>
                      <input
                        value={editMeta.image}
                        onChange={(e) => setEditMeta({ ...editMeta, image: e.target.value, bannerImage: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-[#E5DCD3] rounded-lg"
                      />
                    </div>
                    <label className="inline-flex items-center gap-1.5 px-3 py-2 mt-4 rounded-lg border border-[#E5DCD3] bg-[#FAF7F4] cursor-pointer font-semibold hover:bg-white">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'edit')}
                      />
                    </label>
                  </div>

                  {/* Approved Products Picker */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-[#5E5946]">
                        Promotional Approved Products ({editMeta.productIds.length} pinned)
                      </label>
                      <div className="relative">
                        <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-[#6E6859]" />
                        <input
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          placeholder="Filter approved products..."
                          className="pl-6 pr-2 py-1 text-[11px] bg-white border border-[#E5DCD3] rounded-md"
                        />
                      </div>
                    </div>
                    <div className="max-h-36 overflow-y-auto border border-[#E5DCD3] rounded-lg p-2 space-y-1 bg-[#FAF7F4]">
                      {approvedProducts
                        .filter(
                          (p) =>
                            !productSearch.trim() ||
                            p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                            (p.productTypeName || '').toLowerCase().includes(productSearch.toLowerCase())
                        )
                        .slice(0, 80)
                        .map((p) => {
                          const checked = editMeta.productIds.includes(p.id);
                          return (
                            <label key={p.id} className="flex items-center gap-2 py-0.5 px-1 rounded hover:bg-white cursor-pointer">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  setEditMeta((prev: any) => ({
                                    ...prev,
                                    productIds: checked
                                      ? prev.productIds.filter((id: string) => id !== p.id)
                                      : [...prev.productIds, p.id],
                                  }))
                                }
                              />
                              <span className="truncate font-medium text-[#5E5946]">{p.name}</span>
                              <span className="text-[10px] text-[#6E6859] ml-auto shrink-0">
                                {p.childCategoryName} → {p.productTypeName}
                              </span>
                            </label>
                          );
                        })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      onClick={async () => {
                        if (!window.confirm(`Remove promotional collection "${selectedCollection.title}"? Permanent categories and products will NOT be deleted.`)) return;
                        await adminApi.deleteNewLaunchCollection(selectedCollection.id, workInDraftMode);
                        pushToast({ title: 'Promotional Collection Removed', message: 'Permanent categories and products preserved.' });
                        await loadState();
                        if (!workInDraftMode) await onRefreshParentTaxonomy();
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove Collection
                    </Button>
                    <Button type="submit" size="sm">
                      <Edit3 className="w-3.5 h-3.5" /> {workInDraftMode ? 'Save Draft' : 'Save & Sync Live'}
                    </Button>
                  </div>
                </form>
              </Card>

              {/* Child Category Shortcut Mapping Inspector */}
              <Card
                title={`Category Shortcut Mappings (${(selectedCollection.categoryMappings || []).length})`}
                subtitle="Each shortcut links to a real permanent database category ID"
                action={
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onJumpToCatalogTab('PRODUCT_TYPES')}
                    >
                      <ExternalLink className="w-3 h-3" /> Catalog Management
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        const grpId = selectedCollection.categoryGroupId || permanentTaxonomy.childCategories[0]?.id || 'cat-1';
                        const grp = permanentTaxonomy.childCategories.find((c) => c.id === grpId);
                        const pt = permanentTaxonomy.productTypes.find((t) => t.childCategoryId === grpId);
                        setMappingModal({
                          collectionId: selectedCollection.id,
                          displayLabel: '',
                          mainCategoryId: grp?.mainCategoryId || 'mc-1',
                          categoryGroupId: grpId,
                          childCategoryId: pt?.id || '',
                        });
                      }}
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Shortcut
                    </Button>
                  </div>
                }
              >
                <div className="space-y-2 text-xs max-h-[380px] overflow-y-auto pr-1">
                  {(selectedCollection.categoryMappings || []).length === 0 ? (
                    <p className="text-[#6E6859] py-6 text-center">No child category shortcuts mapped yet.</p>
                  ) : (
                    (selectedCollection.categoryMappings || []).map((m: any) => (
                      <div
                        key={m.id}
                        className={`p-2.5 rounded-xl border flex flex-wrap items-center justify-between gap-2 ${
                          m.mappingStatus === 'MAPPED'
                            ? 'bg-white border-[#E5DCD3]'
                            : 'bg-amber-50/60 border-amber-200'
                        }`}
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-[#5E5946]">{m.displayLabel}</span>
                            {m.mappingStatus === 'MAPPED' ? (
                              <Badge variant="success" className="text-[10px]">
                                <CheckCircle2 className="w-3 h-3 mr-0.5 inline" /> MAPPED
                              </Badge>
                            ) : (
                              <Badge variant="warning" className="text-[10px]">
                                <AlertTriangle className="w-3 h-3 mr-0.5 inline" /> {m.mappingStatus}
                              </Badge>
                            )}
                          </div>
                          {m.mappingStatus === 'MAPPED' ? (
                            <p className="text-[11px] text-[#6E6859]">
                              {m.mainCategoryName} → {m.categoryGroupName} → <strong>{m.childCategoryName}</strong>{' '}
                              <span className="text-[10px] opacity-75">({m.childCategoryId})</span>
                            </p>
                          ) : (
                            <p className="text-[11px] text-amber-800">
                              No automatic duplicate created. Map to an existing permanent category or create it in Catalog Management.
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const grpId = m.categoryGroupId || selectedCollection.categoryGroupId || permanentTaxonomy.childCategories[0]?.id || 'cat-1';
                              const grp = permanentTaxonomy.childCategories.find((c) => c.id === grpId);
                              const firstPt = permanentTaxonomy.productTypes.find((t) => t.childCategoryId === grpId);
                              setMappingModal({
                                collectionId: selectedCollection.id,
                                mappingId: m.id,
                                displayLabel: m.displayLabel,
                                mainCategoryId: m.mainCategoryId || grp?.mainCategoryId || 'mc-1',
                                categoryGroupId: grpId,
                                childCategoryId: m.childCategoryId || firstPt?.id || '',
                              });
                            }}
                          >
                            <Link2 className="w-3 h-3" /> {m.mappingStatus === 'MAPPED' ? 'Remap' : 'Map'}
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={async () => {
                              await adminApi.removeNewLaunchMapping(selectedCollection.id, m.id, workInDraftMode);
                              pushToast({
                                title: 'Shortcut Removed',
                                message: 'Removed from New Launches only; original permanent category untouched.',
                              });
                              await loadState();
                              if (!workInDraftMode) await onRefreshParentTaxonomy();
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Create Collection Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create New Launches Collection">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const res = await adminApi.createNewLaunchCollection({
                ...createForm,
                displayOrder: Number(createForm.displayOrder) || collections.length + 1,
                saveAsDraft: workInDraftMode,
              });
              setCreateOpen(false);
              setCreateForm({
                title: '',
                description: '',
                badge: 'NEW LAUNCH',
                image: '',
                bannerImage: '',
                categoryGroupId: '',
                startDate: '',
                endDate: '',
                displayOrder: String(collections.length + 2),
                productIds: [],
              });
              if (res?.id) setSelectedCollectionId(res.id);
              pushToast({ title: 'Collection Created', message: workInDraftMode ? 'Saved to Draft.' : 'Published live.' });
              await loadState();
              if (!workInDraftMode) await onRefreshParentTaxonomy();
            } catch (err: any) {
              pushToast({ title: 'Create Failed', message: err.message, variant: 'error' });
            }
          }}
          className="space-y-3 text-xs"
        >
          <input
            required
            placeholder="Collection Name *"
            value={createForm.title}
            onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
          />
          <textarea
            rows={2}
            placeholder="Description"
            value={createForm.description}
            onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={createForm.categoryGroupId}
              onChange={(e) => setCreateForm({ ...createForm, categoryGroupId: e.target.value })}
              className="px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
            >
              <option value="">-- Primary Group (Optional) --</option>
              {permanentTaxonomy.childCategories.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              value={createForm.displayOrder}
              onChange={(e) => setCreateForm({ ...createForm, displayOrder: e.target.value })}
              placeholder="Display Order"
              className="px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              placeholder="Banner / Image URL"
              value={createForm.image}
              onChange={(e) => setCreateForm({ ...createForm, image: e.target.value, bannerImage: e.target.value })}
              className="flex-1 px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
            />
            <label className="px-3 py-2 rounded-lg border border-[#E5DCD3] bg-[#FAF7F4] cursor-pointer font-semibold">
              Upload
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'create')}
              />
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{workInDraftMode ? 'Create Draft' : 'Create & Publish'}</Button>
          </div>
        </form>
      </Modal>

      {/* Map / Add Shortcut Modal */}
      <Modal
        open={Boolean(mappingModal)}
        onClose={() => setMappingModal(null)}
        title={mappingModal?.mappingId ? 'Map Child Category Shortcut' : 'Add Child Category Shortcut'}
      >
        {mappingModal && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await adminApi.upsertNewLaunchMapping(mappingModal.collectionId, {
                  mappingId: mappingModal.mappingId,
                  displayLabel: mappingModal.displayLabel,
                  mainCategoryId: mappingModal.mainCategoryId,
                  categoryGroupId: mappingModal.categoryGroupId,
                  childCategoryId: mappingModal.childCategoryId,
                  saveAsDraft: workInDraftMode,
                });
                pushToast({
                  title: 'Shortcut Mapped',
                  message: `"${mappingModal.displayLabel}" linked to permanent taxonomy.`,
                });
                setMappingModal(null);
                await loadState();
                if (!workInDraftMode) await onRefreshParentTaxonomy();
              } catch (err: any) {
                pushToast({ title: 'Mapping Failed', message: err.message, variant: 'error' });
              }
            }}
            className="space-y-3 text-xs"
          >
            <div>
              <label className="block font-semibold text-[#5E5946] mb-1">Promotional Display Label *</label>
              <input
                required
                value={mappingModal.displayLabel}
                onChange={(e) => setMappingModal({ ...mappingModal, displayLabel: e.target.value })}
                placeholder="e.g. PVC pipes & hardwares"
                className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#5E5946] mb-1">Permanent Main Category</label>
              <select
                value={mappingModal.mainCategoryId}
                onChange={(e) => {
                  const mainId = e.target.value;
                  const firstGrp = permanentTaxonomy.childCategories.find((c) => c.mainCategoryId === mainId);
                  const firstPt = firstGrp
                    ? permanentTaxonomy.productTypes.find((t) => t.childCategoryId === firstGrp.id)
                    : undefined;
                  setMappingModal({
                    ...mappingModal,
                    mainCategoryId: mainId,
                    categoryGroupId: firstGrp?.id || '',
                    childCategoryId: firstPt?.id || '',
                  });
                }}
                className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
              >
                {permanentTaxonomy.mainCategories.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#5E5946] mb-1">Permanent Category Group</label>
              <select
                value={mappingModal.categoryGroupId}
                onChange={(e) => {
                  const grpId = e.target.value;
                  const firstPt = permanentTaxonomy.productTypes.find((t) => t.childCategoryId === grpId);
                  setMappingModal({
                    ...mappingModal,
                    categoryGroupId: grpId,
                    childCategoryId: firstPt?.id || '',
                  });
                }}
                className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
              >
                {permanentTaxonomy.childCategories
                  .filter((c) => c.mainCategoryId === mappingModal.mainCategoryId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#5E5946] mb-1">Permanent Child Category *</label>
              <select
                required
                value={mappingModal.childCategoryId}
                onChange={(e) => setMappingModal({ ...mappingModal, childCategoryId: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
              >
                <option value="">-- Select Permanent Child Category --</option>
                {permanentTaxonomy.productTypes
                  .filter((pt) => pt.childCategoryId === mappingModal.categoryGroupId)
                  .map((pt) => (
                    <option key={pt.id} value={pt.id}>
                      {pt.name} ({pt.id})
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setMappingModal(null)}>
                Cancel
              </Button>
              <Button type="submit">Save Mapping</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Customer Preview Modal */}
      <Modal
        open={Boolean(previewCollections)}
        onClose={() => setPreviewCollections(null)}
        title="Customer Website New Launches Preview"
      >
        <div className="space-y-3 text-xs max-h-[65vh] overflow-y-auto">
          <p className="text-[#6E6859]">
            Previewing active collections and confirmed mapped shortcuts exactly as Customer Web navigation renders them:
          </p>
          {(previewCollections || []).map((col) => (
            <div key={col.id} className="p-3 rounded-xl border border-[#E5DCD3] bg-[#FAF7F4] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#5E5946]">
                  {col.title} <span className="text-[10px] text-[#6E6859]">(/new-launches/{col.slug})</span>
                </span>
                <Badge variant="success">{(col.categoryMappings || []).length} live shortcuts</Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(col.categoryMappings || []).map((m: any) => (
                  <span key={m.id} className="px-2 py-0.5 rounded-md bg-white border border-[#E5DCD3] text-[11px]">
                    {m.displayLabel} → {m.childCategoryName}
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
