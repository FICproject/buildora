import React, { useState, useEffect } from 'react';
import {
  MapPin,
  CheckCircle2,
  AlertCircle,
  Navigation,
  Clock,
  Loader2,
  Plus,
  Home,
  Briefcase,
  HardHat
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useLocationStore } from '../../store/useLocationStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Address, AddressType } from '@buildora/types';

export const LocationModal: React.FC = () => {
  const {
    isModalOpen,
    closeLocationModal,
    pincode,
    locality,
    isServiceable,
    etaMinutes,
    isLoading,
    checkAndSetPincode,
    detectCurrentLocation,
    selectSavedAddress,
    selectedAddressId
  } = useLocationStore();

  const { user, addresses, addAddress } = useAuthStore();

  // Modal view modes: 'CHECK_PINCODE' (Reference 2) | 'SAVED_ADDRESSES' (Reference 3) | 'ADD_ADDRESS'
  const [modalMode, setModalMode] = useState<'SAVED_ADDRESSES' | 'CHECK_PINCODE' | 'ADD_ADDRESS'>('CHECK_PINCODE');
  const [selectedAddrId, setSelectedAddrId] = useState<string>('');
  const [inputPincode, setInputPincode] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'warning'; message: string; data?: any } | null>(null);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Add Address Form State
  const [newAddrType, setNewAddrType] = useState<AddressType>('CONSTRUCTION_SITE');
  const [newRecipient, setNewRecipient] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newBuilding, setNewBuilding] = useState('');
  const [newStreet, setNewStreet] = useState('');
  const [newArea, setNewArea] = useState('');
  const [newPincode, setNewPincode] = useState('');
  const [newInstructions, setNewInstructions] = useState('');
  const [formError, setFormError] = useState('');

  // Sync state whenever the modal opens or addresses change
  useEffect(() => {
    if (isModalOpen) {
      setInputPincode(pincode || '');
      setFeedback(null);
      setFormError('');

      // If user has saved addresses, show saved addresses view (Reference Screenshot 3)
      if (addresses && addresses.length > 0) {
        setModalMode('SAVED_ADDRESSES');
        const activeAddr =
          addresses.find((a) => a && a.id === selectedAddressId) ||
          addresses.find((a) => a && a.isDefault) ||
          addresses[0];
        setSelectedAddrId(activeAddr?.id || '');
      } else {
        // First-time visitor / no saved addresses: show clean Pincode-Only modal (Reference Screenshot 2)
        setModalMode('CHECK_PINCODE');
      }
    }
  }, [isModalOpen, pincode, addresses, selectedAddressId]);

  // Handle Verify Pincode
  const handleVerify = async (codeToVerify?: string) => {
    const code = (codeToVerify || inputPincode || '').trim();
    if (!/^[1-9][0-9]{5}$/.test(code)) {
      setFeedback({ type: 'error', message: 'Please enter a valid 6-digit Indian PIN code.' });
      return;
    }

    try {
      const res = await checkAndSetPincode(code);
      if (res && res.serviceable) {
        setFeedback({
          type: 'success',
          message: res.message || `Delivery available in ${res.etaMinutes || 60} mins to ${res.locality || code}!`,
          data: res
        });
        setTimeout(() => {
          closeLocationModal();
        }, 800);
      } else {
        setFeedback({
          type: 'warning',
          message: res?.message || 'Delivery is currently not available for this pincode. Buildora 60 operates across Bengaluru.',
          data: res
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        message: 'Unable to verify this location right now. Please try again.'
      });
    }
  };

  // Handle GPS detection (requested explicitly by user click)
  const handleDetectGPS = async () => {
    setIsGpsLoading(true);
    setFeedback(null);
    try {
      const result = await detectCurrentLocation();
      if (result && result.success) {
        setFeedback({ type: 'success', message: result.message || 'Location detected within Bengaluru site dispatch network!' });
        setTimeout(() => {
          closeLocationModal();
        }, 1000);
      } else {
        setFeedback({
          type: 'error',
          message: result?.message || 'Unable to detect GPS position. Please enter pincode manually.'
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        message: 'Unable to access device location. Please enter pincode manually.'
      });
    } finally {
      setIsGpsLoading(false);
    }
  };

  // Confirm selected saved address (Reference Screenshot 3)
  const handleConfirmSavedAddress = async () => {
    const validAddresses = (addresses || []).filter(Boolean);
    const targetAddr = validAddresses.find((a) => a.id === selectedAddrId) || validAddresses[0];
    if (targetAddr) {
      const area = targetAddr.area || targetAddr.street || 'Bengaluru';
      const label = targetAddr.type === 'HOME' ? 'Home' : targetAddr.type === 'WORK' ? 'Office' : 'Job Site';
      const full = `${label} - ${area}, ${targetAddr.pincode}`;
      await selectSavedAddress({
        id: targetAddr.id,
        label,
        fullAddress: full,
        pincode: targetAddr.pincode,
        locality: area,
        city: targetAddr.city || 'Bengaluru'
      });
      closeLocationModal();
    }
  };

  // Save new site delivery address
  const handleSaveNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanPin = newPincode.trim();
    if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
      setFormError('Please enter a valid 6-digit Indian PIN code.');
      return;
    }
    if (!newBuilding.trim() || !newStreet.trim() || !newArea.trim()) {
      setFormError('Please fill in building, street, and area details.');
      return;
    }

    setIsSavingAddress(true);
    try {
      const isFirst = !addresses || addresses.length === 0;
      const newAddr: Omit<Address, 'id'> = {
        type: newAddrType,
        recipientName: newRecipient.trim() || user?.name || 'Site Contact',
        mobile: newMobile.trim() || user?.phone || '9876543210',
        building: newBuilding.trim(),
        street: newStreet.trim(),
        area: newArea.trim(),
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: cleanPin,
        deliveryInstructions: newInstructions.trim(),
        isDefault: isFirst,
        isConstructionSite: newAddrType === 'CONSTRUCTION_SITE'
      };

      await addAddress(newAddr);

      const label = newAddrType === 'HOME' ? 'Home' : newAddrType === 'WORK' ? 'Office' : 'Job Site';
      const full = `${label} - ${newArea.trim()}, ${cleanPin}`;

      await selectSavedAddress({
        label,
        fullAddress: full,
        pincode: cleanPin,
        locality: newArea.trim(),
        city: 'Bengaluru'
      });

      setIsSavingAddress(false);
      closeLocationModal();
    } catch {
      setIsSavingAddress(false);
      setFormError('Failed to save address. Please try again.');
    }
  };

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={closeLocationModal}
      title={
        modalMode === 'SAVED_ADDRESSES'
          ? 'Select Delivery Address'
          : modalMode === 'ADD_ADDRESS'
          ? 'Add Delivery Address'
          : 'Delivery Time'
      }
      subtitle={
        modalMode === 'SAVED_ADDRESSES'
          ? 'Select a delivery address or add a new address'
          : modalMode === 'ADD_ADDRESS'
          ? 'Enter your address details for material dispatch'
          : 'Please enter Pincode to check delivery time & serviceability'
      }
      maxWidth={modalMode === 'CHECK_PINCODE' ? 'md' : 'md'}
    >
      <div className="pt-1">
        {/* ========================================================================= */}
        {/* VIEW 1: FIRST-TIME VISITOR — PINCODE-ONLY MODAL (REFERENCE SCREENSHOT 2)  */}
        {/* ========================================================================= */}
        {modalMode === 'CHECK_PINCODE' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Pincode Input & Apply Row */}
            <div className="flex gap-2.5 items-stretch">
              <div className="relative flex-1">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  maxLength={6}
                  value={inputPincode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setInputPincode(val);
                    setFeedback(null);
                  }}
                  placeholder="Enter Pincode"
                  className="w-full pl-10 pr-3 py-3 text-sm font-semibold tracking-wider border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue-600 focus:border-brand-blue-600 transition-all placeholder:text-slate-400"
                  onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                />
              </div>
              <Button
                onClick={() => handleVerify()}
                disabled={isLoading || inputPincode.length !== 6}
                className="px-6 py-3 font-black text-sm bg-brand-blue-900 hover:bg-brand-blue-800 text-white rounded-xl shadow-xs transition-all flex items-center justify-center min-w-[96px]"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
              </Button>
            </div>

            {/* GPS Detection Button */}
            <button
              type="button"
              onClick={handleDetectGPS}
              disabled={isGpsLoading || isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 border border-slate-200 hover:border-brand-blue-400 bg-slate-50/50 hover:bg-brand-blue-50/30 rounded-xl text-xs font-bold text-slate-700 hover:text-brand-blue-900 transition-all shadow-2xs group"
            >
              {isGpsLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 text-brand-blue-700 animate-spin" />
                  <span>Detecting device GPS...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-3.5 h-3.5 text-brand-orange-500 group-hover:rotate-45 transition-transform" />
                  <span>Detect My Current Location (GPS)</span>
                </>
              )}
            </button>

            {/* Feedback Status Box */}
            {feedback && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-medium space-y-2 border transition-all ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-950 border-emerald-300 animate-in fade-in'
                    : feedback.type === 'warning'
                    ? 'bg-amber-50 text-amber-950 border-amber-300 animate-in fade-in'
                    : 'bg-rose-50 text-rose-950 border-rose-300 animate-in fade-in'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : feedback.type === 'warning' ? (
                    <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-extrabold text-sm">{feedback.message}</p>
                    {feedback.type === 'success' && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="bg-emerald-700 text-white font-black text-[10px] px-2 py-0.5 rounded-md">
                          🟢 {etaMinutes > 0 ? `${etaMinutes}-minute delivery` : 'Serviceable'}
                        </span>
                        <span className="text-emerald-800 text-[11px] font-semibold">
                          Available for direct site material dispatch
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* If customer has saved addresses, provide navigation back to saved addresses view */}
            {addresses && addresses.length > 0 && (
              <div className="pt-2 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={() => setModalMode('SAVED_ADDRESSES')}
                  className="text-xs font-bold text-brand-blue-800 hover:text-brand-blue-900 hover:underline inline-flex items-center gap-1"
                >
                  <span>&larr; Back to saved delivery addresses</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: RETURNING CUSTOMER — SAVED ADDRESS SELECTION (SCREENSHOT 3)       */}
        {/* ========================================================================= */}
        {modalMode === 'SAVED_ADDRESSES' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Top '+ Add new address' Button (HomeRun reference style) */}
            <button
              type="button"
              onClick={() => {
                setModalMode('ADD_ADDRESS');
                setNewPincode(pincode || '');
                setFormError('');
              }}
              className="w-full py-3 px-4 rounded-xl border border-dashed border-brand-blue-600 bg-brand-blue-50/70 hover:bg-brand-blue-100/70 text-brand-blue-900 font-extrabold text-xs flex items-center justify-center gap-2 transition-colors shadow-2xs"
            >
              <Plus className="w-4 h-4 text-brand-blue-900 stroke-[2.5]" />
              <span>+ Add new address</span>
            </button>

            {/* Saved Addresses List */}
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {(addresses || []).filter(Boolean).map((addr) => {
                const isSelected = selectedAddrId === addr.id;
                const Icon =
                  addr.type === 'HOME'
                    ? Home
                    : addr.type === 'WORK'
                    ? Briefcase
                    : HardHat;

                const addressLine = [addr.building, addr.street, addr.area, addr.city, addr.state]
                  .filter(Boolean)
                  .join(', ');

                return (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddrId(addr.id)}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'border-brand-blue-700 bg-brand-blue-50/50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-brand-blue-900 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                          {addr.type === 'HOME' ? 'Home' : addr.type === 'WORK' ? 'Office / Commercial' : 'Job Site'}
                          {addr.isDefault && (
                            <span className="text-[9px] font-black bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                              DEFAULT
                            </span>
                          )}
                        </span>
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            isSelected
                              ? 'border-brand-blue-700 bg-brand-blue-700'
                              : 'border-slate-300'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                        {addressLine || 'Address on file'} <strong className="text-slate-900 font-extrabold">{addr.pincode}</strong>
                      </p>

                      {addr.recipientName && (
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Contact: {addr.recipientName} {addr.mobile ? `(${addr.mobile})` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Confirm Action Button */}
            <div className="pt-2 space-y-2">
              <Button
                variant="primary"
                size="lg"
                onClick={handleConfirmSavedAddress}
                className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-black shadow-md text-sm py-3 rounded-xl transition-all"
              >
                Confirm location and continue
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setModalMode('CHECK_PINCODE');
                    setInputPincode(pincode || '');
                  }}
                  className="text-xs font-bold text-brand-blue-800 hover:underline inline-flex items-center gap-1"
                >
                  <MapPin className="w-3.5 h-3.5 text-brand-orange-500" />
                  <span>Change Pincode / Enter another location &rarr;</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: ADD NEW DELIVERY ADDRESS                                          */}
        {/* ========================================================================= */}
        {modalMode === 'ADD_ADDRESS' && (
          <form onSubmit={handleSaveNewAddress} className="space-y-3.5 animate-in fade-in duration-150">
            {formError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            {/* Address Type Tag */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Location Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { type: 'CONSTRUCTION_SITE', label: 'Job Site', icon: HardHat },
                  { type: 'HOME', label: 'Home', icon: Home },
                  { type: 'WORK', label: 'Office', icon: Briefcase }
                ].map((item) => {
                  const isSel = newAddrType === item.type;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setNewAddrType(item.type as AddressType)}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        isSel
                          ? 'border-brand-blue-700 bg-brand-blue-50 text-brand-blue-900 shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recipient & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contact Name / Site Engineer</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arjun Verma"
                  value={newRecipient}
                  onChange={(e) => setNewRecipient(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="10-digit mobile"
                  value={newMobile}
                  onChange={(e) => setNewMobile(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-blue-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Building & Street */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Building / Plot / Flat No.</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Plot 89, 2nd Stage"
                  value={newBuilding}
                  onChange={(e) => setNewBuilding(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Street / Landmark</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Near BDA Complex"
                  value={newStreet}
                  onChange={(e) => setNewStreet(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-blue-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Locality & Pincode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Area / Locality</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nagarabhavi"
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pincode (Bengaluru)</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="6-digit PIN (e.g. 560072)"
                  value={newPincode}
                  onChange={(e) => setNewPincode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono font-bold tracking-wider focus:ring-2 focus:ring-brand-blue-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Unloading / Gate Instructions */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Unloading / Site Instructions (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Enter via Gate 2, crane unloading space ready"
                value={newInstructions}
                onChange={(e) => setNewInstructions(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-blue-600 focus:outline-none"
              />
            </div>

            {/* Form Actions */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSavingAddress}
                className="flex-1 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs py-2.5"
              >
                {isSavingAddress ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save & Deliver Here'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setModalMode(addresses.length > 0 ? 'SAVED_ADDRESSES' : 'CHECK_PINCODE')}
                className="text-xs px-4"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
