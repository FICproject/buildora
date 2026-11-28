import React, { useState } from 'react';
import { MapPin, Plus, Trash2, CheckCircle2, Check, Navigation } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useLocationStore } from '../store/useLocationStore';
import { Button } from '../components/ui/Button';
import { AddressType } from '@buildora/types';
import { checkBengaluruServiceability } from '@buildora/constants';

export const AddressesPage: React.FC = () => {
  const { addresses, addAddress, deleteAddress, setDefaultAddress } = useAuthStore();
  const { selectSavedAddress, selectedAddressId } = useLocationStore();

  const [isAdding, setIsAdding] = useState(false);
  const [newAddr, setNewAddr] = useState({
    recipientName: '',
    mobile: '',
    type: 'CONSTRUCTION_SITE' as AddressType,
    building: '',
    street: '',
    area: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560038',
    deliveryInstructions: ''
  });

  const handleSelectActive = (addr: any) => {
    const label = addr.type === 'HOME' ? 'Home' : addr.type === 'WORK' ? 'Office' : 'Job Site';
    const loc = addr.area || addr.street;
    selectSavedAddress({
      id: addr.id,
      label,
      fullAddress: `${label} - ${loc}, ${addr.pincode}`,
      pincode: addr.pincode,
      locality: loc,
      city: addr.city || 'Bengaluru'
    });
  };

  const handleSetDefault = (addr: any) => {
    setDefaultAddress(addr.id);
    handleSelectActive(addr);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAddr.building && newAddr.street && newAddr.pincode) {
      const isFirst = addresses.length === 0;
      addAddress({
        ...newAddr,
        isDefault: isFirst,
        isConstructionSite: newAddr.type === 'CONSTRUCTION_SITE'
      });
      setIsAdding(false);

      if (isFirst) {
        const label = newAddr.type === 'HOME' ? 'Home' : newAddr.type === 'WORK' ? 'Office' : 'Job Site';
        selectSavedAddress({
          label,
          fullAddress: `${label} - ${newAddr.area || newAddr.street}, ${newAddr.pincode}`,
          pincode: newAddr.pincode,
          locality: newAddr.area || newAddr.street,
          city: newAddr.city
        });
      }

      setNewAddr({
        recipientName: '',
        mobile: '',
        type: 'CONSTRUCTION_SITE',
        building: '',
        street: '',
        area: '',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
        deliveryInstructions: ''
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-black text-slate-900">Saved Delivery Addresses</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Add multiple construction site gates, warehouse drops, and office addresses.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsAdding(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add New Site Address
        </Button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="p-5 bg-slate-50 rounded-2xl border border-brand-blue-200 space-y-4 text-xs">
          <h3 className="font-bold text-slate-900 text-sm">New Delivery Address</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold block mb-1">Site Contact Name</label>
              <input
                type="text"
                value={newAddr.recipientName}
                onChange={(e) => setNewAddr({ ...newAddr, recipientName: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="font-bold block mb-1">Site Mobile</label>
              <input
                type="tel"
                value={newAddr.mobile}
                onChange={(e) => setNewAddr({ ...newAddr, mobile: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="font-bold block mb-1">Address Type</label>
              <select
                value={newAddr.type}
                onChange={(e) => setNewAddr({ ...newAddr, type: e.target.value as any })}
                className="w-full p-2 border rounded"
              >
                <option value="CONSTRUCTION_SITE">Construction Site / Project Gate</option>
                <option value="WORK">Office / Commercial</option>
                <option value="HOME">Residential Home</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="font-bold block mb-1">Plot / Gate / Building / Complex</label>
              <input
                type="text"
                placeholder="Plot 42, Green Horizon Enclave"
                value={newAddr.building}
                onChange={(e) => setNewAddr({ ...newAddr, building: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="font-bold block mb-1">Street / Cross Road</label>
              <input
                type="text"
                placeholder="14th Cross, 4th Main Road"
                value={newAddr.street}
                onChange={(e) => setNewAddr({ ...newAddr, street: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="font-bold block mb-1">Area / Locality</label>
              <input
                type="text"
                placeholder="Indiranagar"
                value={newAddr.area}
                onChange={(e) => setNewAddr({ ...newAddr, area: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="font-bold block mb-1">City</label>
              <input
                type="text"
                value={newAddr.city}
                onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="font-bold block mb-1">State</label>
              <input
                type="text"
                value={newAddr.state}
                onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="font-bold block mb-1">Pincode</label>
              <input
                type="text"
                maxLength={6}
                value={newAddr.pincode}
                onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value })}
                className="w-full p-2 border rounded font-bold"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="font-bold block mb-1">Truck Offloading Instructions</label>
              <input
                type="text"
                placeholder="e.g. Enter through Gate 2, driver must bring hand trolley"
                value={newAddr.deliveryInstructions}
                onChange={(e) => setNewAddr({ ...newAddr, deliveryInstructions: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="primary" size="sm" type="submit">
              Save Address
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Address Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {addresses.filter(Boolean).map((addr) => (
          <div
            key={addr.id}
            className={`p-5 rounded-2xl border text-xs space-y-3 flex flex-col justify-between ${
              addr.isDefault
                ? 'border-brand-blue-600 bg-brand-blue-50/20 shadow-sm'
                : 'border-slate-200 bg-white'
            }`}
          >
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-slate-900 text-sm break-words">{addr.recipientName || 'Site Contact'}</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {addr.pincode && checkBengaluruServiceability(addr.pincode).isServiceable ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Serviceable
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      Non-Serviceable
                    </span>
                  )}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                    {(addr.type || 'SITE').replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
              <p className="text-slate-600 leading-relaxed">
                {[addr.building, addr.street, addr.area, addr.city].filter(Boolean).join(', ')} {addr.pincode ? `- ${addr.pincode}` : ''}
              </p>
              {addr.mobile && <div className="text-slate-500">Contact: +91 {addr.mobile}</div>}
              {addr.deliveryInstructions && (
                <div className="p-2 bg-amber-50 rounded-lg text-amber-900 font-medium text-[11px]">
                  Note: {addr.deliveryInstructions}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {addr.isDefault ? (
                  <span className="text-brand-blue-900 font-extrabold flex items-center gap-1 text-[11px] bg-brand-blue-50 px-2 py-0.5 rounded-lg border border-brand-blue-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-blue-700" /> Default Address
                  </span>
                ) : (
                  <button
                    onClick={() => handleSetDefault(addr)}
                    className="text-brand-blue-800 font-bold hover:underline text-[11px]"
                  >
                    Set as Default
                  </button>
                )}

                {selectedAddressId === addr.id ? (
                  <span className="text-emerald-700 font-extrabold text-[10px] bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 flex items-center gap-1">
                    <Check className="w-3 h-3 stroke-[3]" /> Active in Header
                  </span>
                ) : (
                  <button
                    onClick={() => handleSelectActive(addr)}
                    className="text-brand-orange-600 font-bold hover:underline text-[11px]"
                  >
                    Deliver to this site
                  </button>
                )}
              </div>

              <button
                onClick={() => {
                  if (window.confirm('Delete this address?')) {
                    deleteAddress(addr.id);
                  }
                }}
                className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                title="Delete address"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
