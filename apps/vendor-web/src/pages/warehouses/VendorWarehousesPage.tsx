import React, { useState, useEffect } from 'react';
import { Warehouse, Plus, MapPin, Phone, User, Edit2, Trash2 } from 'lucide-react';
import { vendorApi } from '../../services/vendorApi';
import { useVendorInventoryStore } from '../../store/useVendorInventoryStore';
import { VendorWarehouse } from '@buildora/types';
import {
  PageHeader,
  Card,
  CardContent,
  Button,
  Badge,
  Modal,
  ConfirmDialog,
  EmptyState,
} from '../../components/common';
import { toast } from '../../store/useToastStore';

export const VendorWarehousesPage: React.FC = () => {
  const { inventory, fetchInventory } = useVendorInventoryStore();
  const [warehouses, setWarehouses] = useState<VendorWarehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingWh, setEditingWh] = useState<VendorWarehouse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VendorWarehouse | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [state, setState] = useState('Karnataka');
  const [pincode, setPincode] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await vendorApi.getWarehouses();
      setWarehouses(res.data || []);
    } catch {
      toast.error('Failed to load warehouses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    fetchInventory();
  }, []);

  const openAddModal = () => {
    setEditingWh(null);
    setName('');
    setAddress('');
    setCity('Bengaluru');
    setState('Karnataka');
    setPincode('');
    setContactPerson('');
    setPhone('');
    setIsPrimary(false);
    setIsAddModalOpen(true);
  };

  const openEditModal = (wh: VendorWarehouse) => {
    setEditingWh(wh);
    setName(wh.name);
    setAddress(wh.address);
    setCity(wh.city);
    setState(wh.state);
    setPincode(wh.pincode);
    setContactPerson(wh.contactPerson || '');
    setPhone(wh.phone || '');
    setIsPrimary(Boolean(wh.isPrimary));
    setIsAddModalOpen(true);
  };

  const handleSaveWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim() || !pincode.trim() || saving) return;
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        contactPerson: contactPerson.trim(),
        phone: phone.trim(),
        isPrimary,
      };
      if (editingWh) {
        await vendorApi.updateWarehouse(editingWh.id, payload);
        toast.success('Warehouse updated.');
      } else {
        await vendorApi.createWarehouse(payload);
        toast.success('Warehouse added.');
      }
      setIsAddModalOpen(false);
      loadData();
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await vendorApi.deleteWarehouse(deleteTarget.id);
    toast.success(`Warehouse "${deleteTarget.name}" removed.`);
    setDeleteTarget(null);
    loadData();
  };

  const totalUnits = inventory.reduce((sum, i) => sum + i.stock, 0);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Warehouses"
        description="Manage your warehouse locations, pincodes, operating status, and stock distribution."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={openAddModal}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Warehouse
          </Button>
        }
      />

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center text-xs text-[#78716C]">
            Loading warehouses...
          </CardContent>
        </Card>
      ) : warehouses.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Warehouse className="w-5 h-5" />}
            title="No warehouses added"
            description="Add your first warehouse or dispatch depot to start fulfilling orders."
            action={
              <Button size="sm" variant="primary" onClick={openAddModal}>
                Add Warehouse
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {warehouses.map((wh, idx) => {
            const whUnits =
              warehouses.length <= 1
                ? totalUnits
                : Math.round(totalUnits * (wh.isPrimary ? 0.65 : 0.35 / Math.max(1, warehouses.length - 1)));
            return (
              <Card key={wh.id} className={wh.isPrimary ? 'border-[#943D24]/50' : ''}>
                <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-[#FBF3F0] text-[#943D24] flex items-center justify-center shrink-0">
                          <Warehouse className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-[#292524] truncate">
                            {wh.name}
                          </h3>
                          <p className="text-xs text-[#78716C]">Pincode: {wh.pincode}</p>
                        </div>
                      </div>
                      <Badge variant="success" size="sm">
                        Active
                      </Badge>
                    </div>

                    <div className="space-y-2 mt-4 text-xs text-[#78716C]">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>
                          {wh.address}, {wh.city}, {wh.state}
                        </span>
                      </div>
                      {wh.contactPerson && (
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 shrink-0" />
                          <span>{wh.contactPerson}</span>
                        </div>
                      )}
                      {wh.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                          <span>{wh.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E7E5E4] flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[#78716C]">Stock: </span>
                      <strong className="text-[#292524]">{whUnits} units</strong>
                      {wh.isPrimary && (
                        <Badge variant="brand" size="sm" className="ml-2">
                          Primary
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(wh)}
                        className="p-1.5 rounded-lg text-[#78716C] hover:text-[#943D24] hover:bg-[#FBF3F0] cursor-pointer"
                        title="Edit Warehouse"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {!wh.isPrimary && (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(wh)}
                          className="p-1.5 rounded-lg text-[#78716C] hover:text-[#DC4545] hover:bg-[#DC4545]/10 cursor-pointer"
                          title="Delete Warehouse"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingWh ? 'Edit Warehouse' : 'Add Warehouse'}
        subtitle="Enter warehouse address, pincode, and manager contact."
        maxWidth="lg"
      >
        <form onSubmit={handleSaveWarehouse} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="portal-label">Warehouse Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Peenya Central Depot"
                className="portal-input"
              />
            </div>
            <div className="md:col-span-2">
              <label className="portal-label">Address *</label>
              <textarea
                required
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Plot number, street, industrial area"
                className="portal-input"
              />
            </div>
            <div>
              <label className="portal-label">City *</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="portal-input"
              />
            </div>
            <div>
              <label className="portal-label">State *</label>
              <input
                type="text"
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="portal-input"
              />
            </div>
            <div>
              <label className="portal-label">Pincode *</label>
              <input
                type="text"
                required
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                placeholder="560058"
                className="portal-input font-mono"
              />
            </div>
            <div>
              <label className="portal-label">Manager Name</label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="portal-input"
              />
            </div>
            <div>
              <label className="portal-label">Manager Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="portal-input"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-xs font-medium text-[#292524] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="w-4 h-4 rounded text-[#943D24]"
                />
                <span>Set as Primary Warehouse</span>
              </label>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2.5 border-t border-[#E7E5E4]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={saving}>
              {editingWh ? 'Save Changes' : 'Save Warehouse'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Warehouse"
        message={`Are you sure you want to remove "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
      />
    </div>
  );
};

export default VendorWarehousesPage;
