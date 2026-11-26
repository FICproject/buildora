import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Boxes,
  Search,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  SlidersHorizontal,
  History,
  Warehouse,
} from 'lucide-react';
import { useVendorInventoryStore } from '../../store/useVendorInventoryStore';
import { vendorApi } from '../../services/vendorApi';
import { VendorStockMovement } from '@buildora/types';
import {
  PageHeader,
  StatCard,
  Card,
  CardContent,
  Button,
  Badge,
  Modal,
  EmptyState,
  TablePagination,
} from '../../components/common';
import { toast } from '../../store/useToastStore';

type InventoryTab = 'STOCK' | 'WAREHOUSES' | 'HISTORY';

export const VendorInventoryPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { inventory, fetchInventory, adjustStock, isLoading } = useVendorInventoryStore();

  const [activeTab, setActiveTab] = useState<InventoryTab>('STOCK');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [movements, setMovements] = useState<VendorStockMovement[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);

  // Stock adjustment modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [adjustmentType, setAdjustmentType] = useState<'ADD' | 'SUBTRACT' | 'SET'>('ADD');
  const [adjustmentQty, setAdjustmentQty] = useState('50');
  const [reason, setReason] = useState('Batch inward from plant');
  const [submitting, setSubmitting] = useState(false);

  const loadAuxData = async () => {
    try {
      const [mvs, whRes] = await Promise.all([
        vendorApi.getStockMovements(),
        vendorApi.getWarehouses(),
      ]);
      setMovements(mvs || []);
      setWarehouses(Array.isArray(whRes) ? whRes : whRes?.data || []);
    } catch {}
  };

  useEffect(() => {
    fetchInventory();
    loadAuxData();
  }, []);

  useEffect(() => {
    const st = searchParams.get('status');
    if (st) setStatusFilter(st);
  }, [searchParams]);

  const openAdjustModal = (item: any) => {
    setSelectedItem(item);
    setAdjustmentType('ADD');
    setAdjustmentQty('50');
    setReason('Batch inward received');
    setIsModalOpen(true);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || submitting) return;
    const qty = parseInt(adjustmentQty, 10) || 0;
    setSubmitting(true);
    try {
      const ok = await adjustStock(selectedItem.id, adjustmentType, qty, reason);
      if (ok) {
        toast.success(`Stock updated for ${selectedItem.name}.`);
        setIsModalOpen(false);
        loadAuxData();
      } else {
        toast.error('Failed to update stock.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const totalAvailable = inventory.reduce((s, i) => s + i.stock, 0);
  const totalReserved = inventory.reduce((s, i) => s + (i.reservedStock || 0), 0);
  const lowStockCount = inventory.filter((i) => i.status === 'LOW_STOCK').length;
  const outOfStockCount = inventory.filter((i) => i.status === 'OUT_OF_STOCK').length;

  const filteredInventory = inventory.filter((item) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.sku.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const paginatedInventory = filteredInventory.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Inventory"
        description="Monitor available and reserved stock, perform adjustments, and track warehouse movements."
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              fetchInventory();
              loadAuxData();
            }}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
        }
      />

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Available Stock"
          value={totalAvailable.toLocaleString('en-IN')}
          subtitle="Total sellable units"
          icon={<Boxes className="w-4 h-4" />}
        />
        <StatCard
          title="Reserved Stock"
          value={totalReserved.toLocaleString('en-IN')}
          subtitle="Allocated to open orders"
          icon={<CheckCircle2 className="w-4 h-4" />}
        />
        <StatCard
          title="Low Stock Items"
          value={lowStockCount}
          subtitle="At or below threshold"
          icon={<AlertTriangle className="w-4 h-4 text-[#D99B16]" />}
          onClick={() => {
            setActiveTab('STOCK');
            setStatusFilter('LOW_STOCK');
          }}
        />
        <StatCard
          title="Out of Stock"
          value={outOfStockCount}
          subtitle="Unavailable SKUs"
          icon={<AlertTriangle className="w-4 h-4 text-[#DC4545]" />}
          onClick={() => {
            setActiveTab('STOCK');
            setStatusFilter('OUT_OF_STOCK');
          }}
        />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E7E5E4] pb-2">
        {[
          { id: 'STOCK', label: 'Stock Levels', icon: Boxes },
          { id: 'WAREHOUSES', label: 'Warehouse-wise Stock', icon: Warehouse },
          { id: 'HISTORY', label: 'Stock History', icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as InventoryTab)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#943D24] text-white'
                  : 'text-[#78716C] hover:text-[#292524] hover:bg-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'STOCK' && (
        <>
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search by product name, SKU, or category..."
                    className="portal-input pl-9"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="portal-input sm:w-48"
                >
                  <option value="ALL">All Stock Statuses</option>
                  <option value="IN_STOCK">Available (In Stock)</option>
                  <option value="LOW_STOCK">Low Stock</option>
                  <option value="OUT_OF_STOCK">Out of Stock</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F7F5] text-[#78716C] font-semibold border-b border-[#E7E5E4]">
                  <tr>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4">Available</th>
                    <th className="py-3 px-4">Reserved</th>
                    <th className="py-3 px-4">Threshold</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E5E4]">
                  {paginatedInventory.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <EmptyState
                          icon={<Boxes className="w-5 h-5" />}
                          title="No inventory items found"
                          description="Adjust your search or status filter."
                        />
                      </td>
                    </tr>
                  ) : (
                    paginatedInventory.map((item) => (
                      <tr key={item.id} className="hover:bg-[#F8F7F5] transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[#292524]">{item.name}</div>
                          <div className="text-[11px] text-[#78716C]">{item.category}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[#292524]">{item.sku}</td>
                        <td className="py-3.5 px-4 font-semibold text-[#292524]">
                          {item.stock} units
                        </td>
                        <td className="py-3.5 px-4 text-[#78716C]">
                          {item.reservedStock ?? 0} units
                        </td>
                        <td className="py-3.5 px-4 text-[#78716C]">
                          {item.lowStockThreshold} units
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge
                            variant={
                              item.status === 'IN_STOCK'
                                ? 'success'
                                : item.status === 'LOW_STOCK'
                                ? 'warning'
                                : 'danger'
                            }
                            size="sm"
                          >
                            {item.status === 'IN_STOCK'
                              ? 'In Stock'
                              : item.status === 'LOW_STOCK'
                              ? 'Low Stock'
                              : 'Out of Stock'}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openAdjustModal(item)}
                            leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
                          >
                            Adjust
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <TablePagination
              page={page}
              pageSize={pageSize}
              totalItems={filteredInventory.length}
              onPageChange={setPage}
            />
          </Card>
        </>
      )}

      {activeTab === 'WAREHOUSES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {warehouses.map((wh: any) => {
            const whItems = inventory.filter((item: any) => {
              const ws = item.warehouseStocks;
              if (ws && typeof ws === 'object' && Object.keys(ws).length > 0) {
                return ws[wh.id] !== undefined;
              }
              return wh.isPrimary || item.warehouseId === wh.id;
            });
            const whStock =
              typeof wh.totalUnits === 'number'
                ? wh.totalUnits
                : whItems.reduce((sum: number, i: any) => sum + Number(i.warehouseStocks?.[wh.id] ?? i.stock ?? 0), 0);
            const whLow = whItems.filter((i: any) => i.status !== 'IN_STOCK').length;
            return (
              <Card key={wh.id}>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-[#292524]">{wh.name}</h3>
                      <p className="text-xs text-[#78716C]">
                        {wh.city} - {wh.pincode}
                      </p>
                    </div>
                    <Badge variant={wh.isPrimary ? 'brand' : 'neutral'} size="sm">
                      {wh.isPrimary ? 'Primary' : 'Secondary'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#E7E5E4] text-xs">
                    <div>
                      <span className="text-[#78716C] block">SKUs</span>
                      <span className="text-base font-bold text-[#292524]">{whItems.length}</span>
                    </div>
                    <div>
                      <span className="text-[#78716C] block">Available Units</span>
                      <span className="text-base font-bold text-[#292524]">{whStock}</span>
                    </div>
                    <div>
                      <span className="text-[#78716C] block">Alerts</span>
                      <span className="text-base font-bold text-[#D99B16]">{whLow}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {activeTab === 'HISTORY' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F7F5] text-[#78716C] font-semibold border-b border-[#E7E5E4]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Change</th>
                  <th className="py-3 px-4">Balance</th>
                  <th className="py-3 px-4">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E5E4]">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState
                        icon={<History className="w-5 h-5" />}
                        title="No stock movements recorded"
                        description="Adjustments and order dispatches will appear here."
                      />
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => (
                    <tr key={m.id} className="hover:bg-[#F8F7F5]">
                      <td className="py-3 px-4 text-[#78716C] whitespace-nowrap">
                        {new Date(m.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#292524]">{m.productName}</div>
                        <div className="text-[11px] font-mono text-[#78716C]">{m.sku}</div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            m.type === 'INWARD' || m.type === 'RETURN'
                              ? 'success'
                              : m.type === 'DAMAGED'
                              ? 'danger'
                              : 'brand'
                          }
                          size="sm"
                        >
                          {m.type}
                        </Badge>
                      </td>
                      <td
                        className={`py-3 px-4 font-semibold ${
                          m.quantityDelta >= 0 ? 'text-[#15966B]' : 'text-[#DC4545]'
                        }`}
                      >
                        {m.quantityDelta >= 0 ? `+${m.quantityDelta}` : m.quantityDelta}
                      </td>
                      <td className="py-3 px-4 text-[#292524] font-medium">
                        {m.quantityAfter} units
                      </td>
                      <td className="py-3 px-4 text-[#78716C]">{m.reason}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Adjust Stock"
        subtitle={selectedItem ? `${selectedItem.name} (${selectedItem.sku})` : ''}
        maxWidth="md"
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-4">
          <div>
            <label className="portal-label">Adjustment Type</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: 'ADD', label: 'Add Stock' },
                { type: 'SUBTRACT', label: 'Remove Stock' },
                { type: 'SET', label: 'Set Exact' },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.type}
                  onClick={() => setAdjustmentType(opt.type as any)}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                    adjustmentType === opt.type
                      ? 'border-[#943D24] bg-[#FBF3F0] text-[#943D24]'
                      : 'border-[#E7E5E4] text-[#78716C] hover:text-[#292524]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="portal-label">
              {adjustmentType === 'SET' ? 'New Stock Count *' : 'Quantity *'}
            </label>
            <input
              type="number"
              min="0"
              value={adjustmentQty}
              onChange={(e) => setAdjustmentQty(e.target.value)}
              required
              className="portal-input"
            />
          </div>

          <div>
            <label className="portal-label">Reason *</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              placeholder="e.g. Plant receipt or physical audit"
              className="portal-input"
            />
          </div>

          <div className="p-3 bg-[#F8F7F5] rounded-lg border border-[#E7E5E4] text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-[#78716C]">Current Stock:</span>
              <span className="font-semibold text-[#292524]">{selectedItem?.stock} units</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#78716C]">Updated Stock:</span>
              <span className="font-semibold text-[#943D24]">
                {adjustmentType === 'ADD'
                  ? (selectedItem?.stock || 0) + (parseInt(adjustmentQty, 10) || 0)
                  : adjustmentType === 'SUBTRACT'
                  ? Math.max(0, (selectedItem?.stock || 0) - (parseInt(adjustmentQty, 10) || 0))
                  : parseInt(adjustmentQty, 10) || 0}{' '}
                units
              </span>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={submitting || isLoading}
            >
              Save Adjustment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
