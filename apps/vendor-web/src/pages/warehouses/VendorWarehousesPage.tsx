import React, { useState, useEffect } from 'react';
import {
  Warehouse,
  Plus,
  MapPin,
  Phone,
  User,
  CheckCircle2,
  Clock,
  Truck,
  Edit2,
  Trash2,
  AlertCircle,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { vendorApi } from '../../services/vendorApi';
import { VendorWarehouse } from '@buildora/types';

export const VendorWarehousesPage: React.FC = () => {
  const [warehouses, setWarehouses] = useState<VendorWarehouse[]>([]);
  const [darkStores, setDarkStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingWh, setEditingWh] = useState<VendorWarehouse | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [state, setState] = useState('Karnataka');
  const [pincode, setPincode] = useState('560058');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await vendorApi.getWarehouses();
      setWarehouses(res.data || []);
      setDarkStores(res.darkStores || []);
    } catch (err) {
      console.error('Failed to load warehouses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingWh(null);
    setName('');
    setAddress('');
    setCity('Bengaluru');
    setState('Karnataka');
    setPincode('560058');
    setContactPerson('Ramesh Gowda');
    setPhone('9845012348');
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
    if (!name || !address || !pincode) return;

    if (editingWh) {
      await vendorApi.updateWarehouse(editingWh.id, {
        name,
        address,
        city,
        state,
        pincode,
        contactPerson,
        phone,
        isPrimary,
      });
    } else {
      await vendorApi.createWarehouse({
        name,
        address,
        city,
        state,
        pincode,
        contactPerson,
        phone,
        isPrimary,
      });
    }
    setIsAddModalOpen(false);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this warehouse depot?')) {
      await vendorApi.deleteWarehouse(id);
      loadData();
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#203D91]/10 text-[#203D91] border border-[#203D91]/20">
              SUPPLY CHAIN LOGISTICS
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Multi-Depot Enabled
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#17233C] tracking-tight">
            Warehouse & Dark Store Network
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Manage your merchant dispatch depots and view interconnected Bengaluru quick-commerce dark stores.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#203D91] text-white rounded-xl text-xs font-bold hover:bg-[#17233C] transition-all shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4 text-[#FF7417]" />
          Add Warehouse Depot
        </button>
      </div>

      {/* SECTION 1: VENDOR'S DISPATCH DEPOTS */}
      <div className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
          Your Merchant Dispatch Depots ({warehouses.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {warehouses.map((wh) => (
            <div
              key={wh.id}
              className={`p-5 rounded-2xl border bg-white shadow-xs flex flex-col justify-between transition-all ${
                wh.isPrimary ? 'border-[#203D91] ring-1 ring-[#203D91]/20' : 'border-[#E2E8F0]'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#203D91]/10 text-[#203D91] flex items-center justify-center shrink-0">
                      <Warehouse className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-[#17233C] truncate">{wh.name}</h3>
                      <p className="text-[10px] text-slate-400">Pincode: {wh.pincode}</p>
                    </div>
                  </div>

                  {wh.isPrimary ? (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      Primary Depot
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                      Secondary
                    </span>
                  )}
                </div>

                <div className="space-y-2 mt-3 text-xs text-slate-600">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{wh.address}, {wh.city}, {wh.state}</span>
                  </div>
                  {wh.contactPerson && (
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Manager: <strong className="text-[#17233C]">{wh.contactPerson}</strong></span>
                    </div>
                  )}
                  {wh.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{wh.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#E2E8F0] text-xs">
                <span className="text-[11px] font-bold text-[#203D91] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Dispatch Active
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(wh)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-[#203D91] hover:bg-[#F4F7FC]"
                    title="Edit Depot"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {!wh.isPrimary && (
                    <button
                      onClick={() => handleDelete(wh.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                      title="Delete Depot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: BENGALURU QUICK-COMMERCE DARK STORE HUBS */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Interconnected Bengaluru Dark Store Network (5 Hubs)
            </h2>
            <p className="text-xs text-slate-500">
              Site orders are routed through the closest dark store for guaranteed 60-minute delivery.
            </p>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            All 5 Hubs Online
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              id: 'WH-BLR-01',
              name: 'Hebbal North Logistics Center',
              area: 'Hebbal / Sahakar Nagar',
              pincode: '560024',
              sla: '60 Mins',
              evTrucks: 14,
              status: 'ACTIVE',
            },
            {
              id: 'WH-BLR-02',
              name: 'Whitefield Tech Corridor Hub',
              area: 'Whitefield / ITPL / Hoodi',
              pincode: '560066',
              sla: '60 Mins',
              evTrucks: 18,
              status: 'ACTIVE',
            },
            {
              id: 'WH-BLR-03',
              name: 'Electronic City Express Depot',
              area: 'Electronic City Phase 1 & 2',
              pincode: '560100',
              sla: '60 Mins',
              evTrucks: 12,
              status: 'ACTIVE',
            },
            {
              id: 'WH-BLR-04',
              name: 'Bengaluru West Mega Dark Store',
              area: 'Peenya / Nagarabhavi / Rajajinagar',
              pincode: '560058',
              sla: '60 Mins (Primary Merchant Link)',
              evTrucks: 24,
              status: 'ALLOCATED',
            },
            {
              id: 'WH-BLR-05',
              name: 'Koramangala Central Quick Store',
              area: 'Koramangala / HSR / BTM',
              pincode: '560034',
              sla: '60 Mins',
              evTrucks: 16,
              status: 'ACTIVE',
            },
          ].map((hub) => (
            <div
              key={hub.id}
              className={`p-4 rounded-2xl border bg-white shadow-xs ${
                hub.status === 'ALLOCATED'
                  ? 'border-[#203D91] ring-2 ring-[#203D91]/15 bg-[#203D91]/2'
                  : 'border-[#E2E8F0]'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-[#17233C]">
                      {hub.id}
                    </span>
                    {hub.status === 'ALLOCATED' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF7417] text-white">
                        Your Linked Hub
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-xs text-[#17233C] mt-1">{hub.name}</h3>
                </div>
                <Truck className="w-4 h-4 text-[#203D91]" />
              </div>

              <div className="text-[11px] text-slate-500 space-y-1 mt-2">
                <p>Coverage: <strong className="text-[#17233C]">{hub.area}</strong></p>
                <p>Hub Pincode: {hub.pincode}</p>
                <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0] mt-2 font-bold">
                  <span className="text-emerald-700">{hub.sla}</span>
                  <span className="text-slate-600">{hub.evTrucks} EV Trucks Active</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ADD/EDIT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-[#E2E8F0] shadow-xl">
            <h3 className="text-lg font-black text-[#17233C] mb-1">
              {editingWh ? 'Edit Warehouse Depot' : 'Add Merchant Dispatch Depot'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter the physical yard/godown location where contractor materials are packed.
            </p>

            <form onSubmit={handleSaveWarehouse} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Depot / Yard Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Peenya Central Dispatch Depot"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E2E8F0] focus:border-[#203D91] focus:ring-1 focus:ring-[#203D91] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Street Address</label>
                <textarea
                  required
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Plot number, industrial cross road, landmark"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E2E8F0] focus:border-[#203D91] focus:ring-1 focus:ring-[#203D91] outline-hidden"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E2E8F0] outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E2E8F0] outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    required
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E2E8F0] outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Yard Manager</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="Manager Name"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E2E8F0] outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Manager Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9845012348"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E2E8F0] outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="primaryDepot"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="w-4 h-4 rounded text-[#203D91] focus:ring-[#203D91]"
                />
                <label htmlFor="primaryDepot" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Set as Primary Dispatch Depot for Bangalore Dark Store Network
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-[#F4F7FC] rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#203D91] hover:bg-[#17233C] rounded-xl transition-colors shadow-xs"
                >
                  {editingWh ? 'Update Depot' : 'Save Depot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default VendorWarehousesPage;