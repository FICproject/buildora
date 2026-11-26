import React, { useEffect, useState } from 'react';
import { Boxes, SlidersHorizontal, Warehouse, History, Plus } from 'lucide-react';
import { adminApi, formatDateTime, formatINR } from '../services/adminApi';
import { PageHeader, Card, Badge, Button, Modal, useToastStore } from '../components/ui';

export const InventoryPage: React.FC<{ defaultTab?: 'INVENTORY' | 'WAREHOUSES' }> = ({
  defaultTab = 'INVENTORY',
}) => {
  const pushToast = useToastStore((s) => s.push);
  const [mainTab, setMainTab] = useState<'INVENTORY' | 'WAREHOUSES' | 'MOVEMENTS'>(
    defaultTab === 'WAREHOUSES' ? 'WAREHOUSES' : 'INVENTORY'
  );
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [invData, setInvData] = useState<any>({ items: [], warehouses: [], movements: [] });
  const [warehouses, setWarehouses] = useState<any[]>([]);

  const [adjustModal, setAdjustModal] = useState<any>(null);
  const [adjustForm, setAdjustForm] = useState({
    adjustmentType: 'ADD' as 'ADD' | 'SUBTRACT' | 'SET',
    quantity: 100,
    reason: 'Warehouse cycle count replenishment',
  });

  const [whModal, setWhModal] = useState(false);
  const [editingWhId, setEditingWhId] = useState<string | null>(null);
  const [whForm, setWhForm] = useState({
    name: '',
    address: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '',
    contactPerson: '',
    phone: '',
    servicePincodesCsv: '',
  });

  const loadAll = async () => {
    const [inv, wh] = await Promise.all([
      adminApi.getInventory(filter, search),
      adminApi.getWarehouses(),
    ]);
    setInvData(inv || { items: [], warehouses: [], movements: [] });
    setWarehouses(wh || []);
  };

  useEffect(() => {
    loadAll();
  }, [filter]);

  const submitAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModal) return;
    try {
      await adminApi.adjustInventory({
        productId: adjustModal.id,
        adjustmentType: adjustForm.adjustmentType,
        quantity: Number(adjustForm.quantity),
        reason: adjustForm.reason,
      });
      pushToast({
        title: 'Stock Adjusted',
        message: `${adjustModal.sku} inventory updated & synced to storefront.`,
      });
      setAdjustModal(null);
      await loadAll();
    } catch (err: any) {
      pushToast({ title: 'Adjustment Failed', message: err.message, variant: 'error' });
    }
  };

  const submitWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...whForm,
        servicePincodes: whForm.servicePincodesCsv
          ? whForm.servicePincodesCsv.split(',').map((p) => p.trim()).filter(Boolean)
          : [whForm.pincode].filter(Boolean),
      };
      if (editingWhId) {
        await adminApi.updateWarehouse(editingWhId, payload);
        pushToast({ title: 'Warehouse Updated' });
      } else {
        await adminApi.createWarehouse(payload);
        pushToast({ title: 'Warehouse Added' });
      }
      setWhModal(false);
      setEditingWhId(null);
      setWhForm({
        name: '',
        address: '',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '',
        contactPerson: '',
        phone: '',
        servicePincodesCsv: '',
      });
      await loadAll();
    } catch (err: any) {
      pushToast({ title: 'Error', message: err.message, variant: 'error' });
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={mainTab === 'WAREHOUSES' ? 'Warehouse Management' : 'Inventory Control Center'}
        description="Monitor live stock levels, handle adjustments synced across portals & manage fulfillment hubs."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={mainTab === 'INVENTORY' ? 'primary' : 'outline'}
              onClick={() => setMainTab('INVENTORY')}
            >
              <Boxes className="w-4 h-4" /> Stock Overview
            </Button>
            <Button
              size="sm"
              variant={mainTab === 'WAREHOUSES' ? 'primary' : 'outline'}
              onClick={() => setMainTab('WAREHOUSES')}
            >
              <Warehouse className="w-4 h-4" /> Warehouses ({warehouses.length})
            </Button>
            <Button
              size="sm"
              variant={mainTab === 'MOVEMENTS' ? 'primary' : 'outline'}
              onClick={() => setMainTab('MOVEMENTS')}
            >
              <History className="w-4 h-4" /> Movement Logs
            </Button>
          </div>
        }
      />

      {mainTab === 'INVENTORY' && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'ALL', label: 'All Stock' },
                { id: 'LOW_STOCK', label: 'Low Stock' },
                { id: 'OUT_OF_STOCK', label: 'Out of Stock' },
                { id: 'RESERVED', label: 'Reserved' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setFilter(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${filter === t.id
                      ? 'bg-[#AE887B] text-white border-[#AE887B] shadow-sm'
                      : 'bg-white text-[#5E5946] border-[#E5DCD3] hover:bg-[#F0DED0]/45'
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search SKU or name..."
                className="px-3 py-1.5 text-xs bg-white border border-[#E5DCD3] rounded-lg focus:outline-none focus:border-[#AE887B]"
              />
              <Button size="sm" variant="secondary" onClick={loadAll}>
                Search
              </Button>
            </div>
          </div>

          <Card noPadding>
            <div className="overflow-x-auto rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F0DED0]/75 border-b border-[#E5DCD3] text-[11px] font-semibold text-[#5E5946] uppercase">
                    <th className="py-3 px-4">SKU / Product</th>
                    <th className="py-3 px-3">Vendor</th>
                    <th className="py-3 px-3">Available</th>
                    <th className="py-3 px-3">Reserved</th>
                    <th className="py-3 px-3">Valuation</th>
                    <th className="py-3 px-3">Health</th>
                    <th className="py-3 px-4 text-right">Adjust</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5DCD3] text-xs bg-white">
                  {(invData.items || []).map((item: any) => (
                    <tr key={item.id} className="hover:bg-[#FAF7F4] transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-[#5E5946]">{item.name}</p>
                        <p className="font-mono text-[#6E6859]">{item.sku}</p>
                      </td>
                      <td className="py-3 px-3 text-[#6E6859]">{item.vendorName}</td>
                      <td className="py-3 px-3 font-bold text-[#5E5946]">
                        {item.stock} {item.unit}
                      </td>
                      <td className="py-3 px-3 text-[#6E6859]">{item.reservedStock || 0}</td>
                      <td className="py-3 px-3 font-medium text-[#5E5946]">
                        {formatINR(Number(item.stock || 0) * Number(item.sellingPrice || 0))}
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={
                            item.stock <= 0
                              ? 'error'
                              : item.stock <= (item.lowStockThreshold || 25)
                                ? 'warning'
                                : 'success'
                          }
                        >
                          {item.stock <= 0
                            ? 'Out of Stock'
                            : item.stock <= (item.lowStockThreshold || 25)
                              ? 'Low Stock'
                              : 'Healthy'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button size="sm" variant="outline" onClick={() => setAdjustModal(item)}>
                          <SlidersHorizontal className="w-3.5 h-3.5" /> Adjust
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {mainTab === 'WAREHOUSES' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="dark"
              onClick={() => {
                setEditingWhId(null);
                setWhForm({ name: '', address: '', city: 'Bengaluru', state: 'Karnataka', pincode: '', contactPerson: '', phone: '', servicePincodesCsv: '' });
                setWhModal(true);
              }}
            >
              <Plus className="w-4 h-4" /> Add Fulfillment Warehouse
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {warehouses.map((wh) => (
              <Card
                key={wh.id}
                title={wh.name}
                subtitle={`Pincode: ${wh.pincode} • ${wh.city}`}
                action={<Badge variant={wh.isActive !== false ? 'success' : 'error'}>{wh.isActive !== false ? 'ACTIVE' : 'INACTIVE'}</Badge>}
              >
                <div className="space-y-2 text-xs">
                  <p className="text-[#6E6859]">{wh.address}</p>
                  <div className="flex justify-between pt-2 border-t border-[#E5DCD3]">
                    <span className="text-[#6E6859]">Active SKUs</span>
                    <span className="font-semibold text-[#5E5946]">{wh.skuCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6E6859]">Total Units Stored</span>
                    <span className="font-semibold text-[#5E5946]">{wh.totalUnits}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6E6859]">Manager / Contact</span>
                    <span className="font-medium text-[#5E5946]">{wh.contactPerson || 'Assigned Desk'}</span>
                  </div>
                  <div className="flex gap-1.5 pt-2 border-t border-[#E5DCD3]">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingWhId(wh.id);
                        setWhForm({
                          name: wh.name || '',
                          address: wh.address || '',
                          city: wh.city || 'Bengaluru',
                          state: wh.state || 'Karnataka',
                          pincode: wh.pincode || '',
                          contactPerson: wh.contactPerson || '',
                          phone: wh.phone || '',
                          servicePincodesCsv: (wh.servicePincodes || []).join(', '),
                        });
                        setWhModal(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await adminApi.updateWarehouse(wh.id, { isActive: !(wh.isActive !== false) });
                        pushToast({ title: 'Warehouse Status Updated' });
                        loadAll();
                      }}
                    >
                      {wh.isActive !== false ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await adminApi.deleteWarehouse(wh.id);
                        pushToast({ title: 'Warehouse Deleted' });
                        loadAll();
                      }}
                    >
                      Del
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {mainTab === 'MOVEMENTS' && (
        <Card title="Stock Adjustment & Dispatch Ledger">
          <div className="divide-y divide-[#E5DCD3] text-xs">
            {(invData.movements || []).map((m: any) => (
              <div key={m.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-[#5E5946]">
                    {m.productName} ({m.sku})
                  </p>
                  <p className="text-[#6E6859]">
                    {m.reason} • By {m.performedBy}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant={m.quantityDelta >= 0 ? 'success' : 'warning'}>
                    {m.quantityDelta >= 0 ? `+${m.quantityDelta}` : m.quantityDelta} units
                  </Badge>
                  <p className="text-[11px] text-[#6E6859] mt-0.5">
                    {m.quantityBefore} → {m.quantityAfter} • {formatDateTime(m.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Stock Adjustment Modal */}
      <Modal
        open={Boolean(adjustModal)}
        onClose={() => setAdjustModal(null)}
        title={`Adjust Stock — ${adjustModal?.sku}`}
      >
        <form onSubmit={submitAdjust} className="space-y-4 text-xs">
          <p className="text-[#6E6859]">
            Current Stock: <strong className="text-[#5E5946]">{adjustModal?.stock}</strong>
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#5E5946] mb-1">Action</label>
              <select
                value={adjustForm.adjustmentType}
                onChange={(e) =>
                  setAdjustForm({ ...adjustForm, adjustmentType: e.target.value as any })
                }
                className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
              >
                <option value="ADD">Add Stock (+)</option>
                <option value="SUBTRACT">Deduct Stock (-)</option>
                <option value="SET">Set Exact Count (=)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#5E5946] mb-1">Quantity</label>
              <input
                type="number"
                min={0}
                required
                value={adjustForm.quantity}
                onChange={(e) => setAdjustForm({ ...adjustForm, quantity: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold text-[#5E5946] mb-1">Reason / Audit Reference</label>
            <input
              required
              value={adjustForm.reason}
              onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setAdjustModal(null)}>
              Cancel
            </Button>
            <Button type="submit">Apply & Sync Storefront</Button>
          </div>
        </form>
      </Modal>

      {/* Add/Edit Warehouse Modal */}
      <Modal
        open={whModal}
        onClose={() => {
          setWhModal(false);
          setEditingWhId(null);
        }}
        title={editingWhId ? 'Edit Warehouse Hub' : 'Add Warehouse Hub'}
      >
        <form onSubmit={submitWarehouse} className="space-y-3 text-xs">
          <input
            required
            placeholder="Warehouse Name (e.g. Electronic City Hub)"
            value={whForm.name}
            onChange={(e) => setWhForm({ ...whForm, name: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
          />
          <input
            required
            placeholder="Street Address"
            value={whForm.address}
            onChange={(e) => setWhForm({ ...whForm, address: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              required
              placeholder="City"
              value={whForm.city}
              onChange={(e) => setWhForm({ ...whForm, city: e.target.value })}
              className="px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
            />
            <input
              required
              placeholder="State"
              value={whForm.state}
              onChange={(e) => setWhForm({ ...whForm, state: e.target.value })}
              className="px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
            />
            <input
              required
              placeholder="Pincode"
              value={whForm.pincode}
              onChange={(e) => setWhForm({ ...whForm, pincode: e.target.value })}
              className="px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
            />
          </div>
          <input
            placeholder="Serviceable Pincodes (comma-separated)"
            value={whForm.servicePincodesCsv}
            onChange={(e) => setWhForm({ ...whForm, servicePincodesCsv: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg font-mono"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setWhModal(false)}>
              Cancel
            </Button>
            <Button type="submit">{editingWhId ? 'Save Warehouse' : 'Create Warehouse'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
