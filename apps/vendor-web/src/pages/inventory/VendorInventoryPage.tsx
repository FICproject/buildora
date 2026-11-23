import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Search,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import { useVendorInventoryStore } from '../../store/useVendorInventoryStore';
import { Card, CardHeader, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

export const VendorInventoryPage: React.FC = () => {
  const { inventory, fetchInventory, adjustStock, isLoading } = useVendorInventoryStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [adjustmentType, setAdjustmentType] = useState<'ADD' | 'SUBTRACT' | 'SET'>('ADD');
  const [adjustmentQty, setAdjustmentQty] = useState('50');
  const [reason, setReason] = useState('Batch inward from plant');

  useEffect(() => {
    fetchInventory();
  }, []);

  const openAdjustModal = (item: any) => {
    setSelectedItem(item);
    setAdjustmentType('ADD');
    setAdjustmentQty('50');
    setReason('Batch inward received at WH-BLR-04');
    setIsModalOpen(true);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    const qty = parseInt(adjustmentQty) || 0;
    await adjustStock(selectedItem.id, adjustmentType, qty, reason);
    setIsModalOpen(false);
  };

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Real-Time Inventory & Dark Store Stock
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor physical stock units at WH-BLR-04 (Peenya/Nagarabhavi) and log inward receipts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchInventory()}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh Levels
          </Button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search inventory by title, SKU, category..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Stock Statuses</option>
                <option value="IN_STOCK">In Stock (Healthy)</option>
                <option value="LOW_STOCK">Low Stock (Alert)</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Item Details</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Hub Location</th>
                <th className="py-3 px-4">Physical Stock</th>
                <th className="py-3 px-4">Alert Threshold</th>
                <th className="py-3 px-4">Stock Health</th>
                <th className="py-3 px-4 text-right">Adjustment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No inventory records found.
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => {
                  const isLow = item.stock <= item.lowStockThreshold;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{item.name}</div>
                        <div className="text-[11px] text-slate-400">{item.category}</div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                        {item.sku}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-800">{item.warehouseLocation}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`text-sm font-bold ${
                            item.stock === 0
                              ? 'text-rose-600'
                              : isLow
                              ? 'text-amber-600'
                              : 'text-slate-900'
                          }`}
                        >
                          {item.stock}
                        </span>{' '}
                        <span className="text-[11px] text-slate-400">units</span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500">
                        &le; {item.lowStockThreshold} units
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
                          dot
                        >
                          {item.status === 'IN_STOCK'
                            ? 'Optimal'
                            : item.status === 'LOW_STOCK'
                            ? 'Low Stock Alert'
                            : 'Stockout'}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openAdjustModal(item)}
                          className="text-[11px] py-1 px-2.5"
                          leftIcon={<SlidersHorizontal className="w-3 h-3" />}
                        >
                          Adjust Stock
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Adjust Inventory Stock"
        subtitle={`Update physical count for ${selectedItem?.name} (${selectedItem?.sku})`}
        maxWidth="md"
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Adjustment Type:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: 'ADD', label: '+ Inward Add' },
                { type: 'SUBTRACT', label: '- Outward' },
                { type: 'SET', label: '= Set Count' },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.type}
                  onClick={() => setAdjustmentType(opt.type as any)}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                    adjustmentType === opt.type
                      ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {adjustmentType === 'SET' ? 'New Total Stock Count' : 'Quantity Units'} *
            </label>
            <input
              type="number"
              min="1"
              value={adjustmentQty}
              onChange={(e) => setAdjustmentQty(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Reason / Audit Reference *
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              placeholder="e.g. Factory delivery Challan #CH-8829"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-lg text-[11px] text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Current Stock:</span>
              <span className="font-bold text-slate-800">{selectedItem?.stock} units</span>
            </div>
            <div className="flex justify-between">
              <span>Projected Stock:</span>
              <span className="font-bold text-blue-700">
                {adjustmentType === 'ADD'
                  ? (selectedItem?.stock || 0) + (parseInt(adjustmentQty) || 0)
                  : adjustmentType === 'SUBTRACT'
                  ? Math.max(0, (selectedItem?.stock || 0) - (parseInt(adjustmentQty) || 0))
                  : parseInt(adjustmentQty) || 0}{' '}
                units
              </span>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
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
              Apply Adjustment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
