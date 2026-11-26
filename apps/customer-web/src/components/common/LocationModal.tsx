import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Plus,
  Home,
  Briefcase,
  HardHat,
  Search,
  Crosshair,
  ChevronRight,
  ArrowLeft,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useLocationStore } from '../../store/useLocationStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Address, AddressType } from '@buildora/types';
import { locationService, LocationSuggestion, GeocodedLocation } from '../../services/locationService';
import { DeliveryLocationMap } from './DeliveryLocationMap';

export type AddressModalStep = 'SELECT_ADDRESS' | 'SEARCH_LOCATION' | 'LOCATION_DETAILS';

export const LocationModal: React.FC = () => {
  const {
    isModalOpen,
    closeLocationModal,
    pincode,
    locality,
    cityName,
    selectedAddressId,
    selectSavedAddress
  } = useLocationStore();

  const { user, addresses, addAddress } = useAuthStore();

  // Active Wizard Step: SELECT_ADDRESS (1) | SEARCH_LOCATION (2 & 3) | LOCATION_DETAILS (4)
  const [step, setStep] = useState<AddressModalStep>('SELECT_ADDRESS');
  const [selectedAddrId, setSelectedAddrId] = useState<string>('');

  // Step 2: Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Step 3: Location Details & Address Form State
  const [selectedLat, setSelectedLat] = useState<number>(12.9647);
  const [selectedLng, setSelectedLng] = useState<number>(77.5113);
  const [selectedAddressText, setSelectedAddressText] = useState('Bengaluru, Karnataka 560072, India');
  const [selectedLocalityText, setSelectedLocalityText] = useState('2nd Stage, Nagarbhavi, Bengaluru, Karnataka 560072');
  const [selectedPincode, setSelectedPincode] = useState('560072');

  // Form Fields (Screenshot 4)
  const [addrType, setAddrType] = useState<AddressType>('HOME');
  const [building, setBuilding] = useState('');
  const [areaLocality, setAreaLocality] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Synchronize state whenever modal opens or addresses change
  useEffect(() => {
    if (isModalOpen) {
      setFormError(null);
      setSearchError(null);
      setSaveSuccessMessage(null);
      setSearchQuery('');
      setSuggestions([]);

      const validAddrs = (addresses || []).filter(Boolean);
      if (validAddrs.length > 0) {
        setStep('SELECT_ADDRESS');
        const active =
          validAddrs.find((a) => a.id === selectedAddressId) ||
          validAddrs.find((a) => a.isDefault) ||
          validAddrs[0];
        setSelectedAddrId(active?.id || '');
      } else {
        // If no addresses yet, present Select Address with prominent Add New Address option
        setStep('SELECT_ADDRESS');
        setSelectedAddrId('');
      }

      // Pre-fill user defaults
      setReceiverName(user?.name || '');
      setReceiverPhone(user?.phone ? user.phone.replace(/\D/g, '').slice(-10) : '');
    }
  }, [isModalOpen, addresses, selectedAddressId, user]);

  // Handle Search Input with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await locationService.searchLocations(searchQuery);
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Focus search input when navigating to SEARCH_LOCATION
  useEffect(() => {
    if (step === 'SEARCH_LOCATION') {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [step]);

  // Handle Suggestion Click (transitions to Step 3: LOCATION_DETAILS)
  const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
    setSelectedLat(suggestion.lat);
    setSelectedLng(suggestion.lng);
    setSelectedAddressText(suggestion.fullAddress);
    setSelectedLocalityText(suggestion.secondaryText || suggestion.locality || `${suggestion.area}, Bengaluru`);
    setSelectedPincode(suggestion.pincode || '560072');
    setAreaLocality(suggestion.secondaryText || suggestion.fullAddress);
    setFormError(null);
    setStep('LOCATION_DETAILS');
  };

  // Handle "Use current location" button click
  const handleUseCurrentLocation = async () => {
    setIsDetectingGps(true);
    setSearchError(null);
    try {
      const result = await locationService.getCurrentPosition();
      if (result.success && result.lat && result.lng) {
        const geocoded = await locationService.reverseGeocode(result.lat, result.lng);
        setSelectedLat(result.lat);
        setSelectedLng(result.lng);
        setSelectedAddressText(geocoded.fullAddress);
        setSelectedLocalityText(geocoded.locality || `${geocoded.area}, ${geocoded.city}`);
        setSelectedPincode(geocoded.pincode || '560072');
        setAreaLocality(geocoded.locality || geocoded.fullAddress);
        setStep('LOCATION_DETAILS');
      } else {
        setSearchError(result.message || 'Unable to access your current GPS location. Please search manually.');
      }
    } catch {
      setSearchError('Location permission denied or timed out. Please search for your delivery location.');
    } finally {
      setIsDetectingGps(false);
    }
  };

  // Handle Map Pin Drag / Click Update
  const handleMapLocationChange = (loc: GeocodedLocation) => {
    setSelectedLat(loc.lat);
    setSelectedLng(loc.lng);
    setSelectedAddressText(loc.fullAddress);
    setSelectedLocalityText(loc.locality || `${loc.area}, ${loc.city}`);
    setSelectedPincode(loc.pincode || '560072');
    setAreaLocality(loc.locality || loc.fullAddress);
  };

  // Step 3: Handle Save Address Submission
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // 1. Validation: Apartment / House / Building
    const cleanBuilding = building.trim();
    if (!cleanBuilding) {
      setFormError('Please enter apartment, house number, or building name.');
      return;
    }

    // 2. Validation: Area / Sector / Locality
    const cleanArea = areaLocality.trim();
    if (!cleanArea) {
      setFormError('Please enter area, sector, or locality.');
      return;
    }

    // 3. Validation: Receiver Name
    const cleanName = receiverName.trim();
    if (!cleanName) {
      setFormError("Please enter the receiver's name.");
      return;
    }

    // 4. Validation: 10-digit Indian mobile number
    const cleanPhone = receiverPhone.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setFormError('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    // 5. Validation: 6-digit Indian PIN code
    const cleanPin = selectedPincode.replace(/\D/g, '').slice(-6);
    if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
      setFormError('Please verify a valid 6-digit Indian PIN code.');
      return;
    }

    setIsSaving(true);
    try {
      const isFirst = !addresses || addresses.length === 0;
      const formattedFull = `${cleanBuilding}, ${cleanArea}, ${cleanPin}`;

      const newAddrPayload: Omit<Address, 'id'> = {
        type: addrType,
        recipientName: cleanName,
        mobile: cleanPhone,
        building: cleanBuilding,
        street: cleanArea.split(',')[0]?.trim() || cleanArea,
        area: cleanArea,
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: cleanPin,
        isDefault: isFirst,
        isConstructionSite: addrType === 'CONSTRUCTION_SITE',
        latitude: selectedLat,
        longitude: selectedLng,
        fullAddress: formattedFull
      };

      await addAddress(newAddrPayload);

      // Fetch the updated addresses to find the new ID or fall back to newest
      const updatedList = useAuthStore.getState().addresses;
      const newlyAdded = updatedList[updatedList.length - 1];

      if (newlyAdded?.id) {
        setSelectedAddrId(newlyAdded.id);
      }

      setSaveSuccessMessage('Address saved successfully!');
      setIsSaving(false);

      // Return to Select Delivery Address screen with the new address pre-selected
      setTimeout(() => {
        setStep('SELECT_ADDRESS');
        setSaveSuccessMessage(null);
      }, 500);
    } catch {
      setIsSaving(false);
      setFormError('Unable to save address. Please try again.');
    }
  };

  // Step 4: Handle "Confirm location and continue"
  const handleConfirmLocationAndContinue = async () => {
    const validAddresses = (addresses || []).filter(Boolean);
    const targetAddr = validAddresses.find((a) => a.id === selectedAddrId) || validAddresses[0];

    if (!targetAddr) {
      // If no address saved, move to search location
      setStep('SEARCH_LOCATION');
      return;
    }

    const label =
      targetAddr.type === 'HOME'
        ? 'Home'
        : targetAddr.type === 'CONSTRUCTION_SITE'
        ? 'Project'
        : targetAddr.type === 'WORK'
        ? 'Office'
        : 'Other';

    const full =
      targetAddr.fullAddress ||
      `${targetAddr.building ? targetAddr.building + ', ' : ''}${targetAddr.area || targetAddr.street || 'Bengaluru'}, ${targetAddr.pincode}`;

    await selectSavedAddress({
      id: targetAddr.id,
      label,
      fullAddress: full,
      pincode: targetAddr.pincode,
      locality: targetAddr.area || targetAddr.street || 'Bengaluru',
      city: targetAddr.city || 'Bengaluru'
    });

    closeLocationModal();
  };

  // Address card icon selector
  const getAddressIcon = (type: AddressType) => {
    switch (type) {
      case 'HOME':
        return Home;
      case 'CONSTRUCTION_SITE':
        return HardHat;
      case 'WORK':
        return Briefcase;
      default:
        return MapPin;
    }
  };

  const getAddressLabel = (type: AddressType) => {
    switch (type) {
      case 'HOME':
        return 'Home';
      case 'CONSTRUCTION_SITE':
        return 'Project';
      case 'WORK':
        return 'Office';
      default:
        return 'Other';
    }
  };

  // Custom modal header matching reference screenshots
  const renderModalHeader = () => {
    if (step === 'SELECT_ADDRESS') {
      return (
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <h3 className="text-lg font-bold text-slate-900 leading-tight">Select Delivery Address</h3>
          <button
            onClick={closeLocationModal}
            className="p-1.5 -mr-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (step === 'LOCATION_DETAILS') {
                setStep('SEARCH_LOCATION');
              } else {
                setStep('SELECT_ADDRESS');
              }
            }}
            className="p-1 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-bold text-slate-900 leading-tight">Add Address Details</h3>
        </div>
        <button
          onClick={closeLocationModal}
          className="p-1.5 -mr-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={closeLocationModal}
      maxWidth={step === 'LOCATION_DETAILS' ? '4xl' : 'md'}
      customHeader={renderModalHeader()}
    >
      <div className="pt-1">
        {/* ========================================================================= */}
        {/* STEP 1: SELECT DELIVERY ADDRESS MODAL (REFERENCE SCREENSHOT 1)            */}
        {/* ========================================================================= */}
        {step === 'SELECT_ADDRESS' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {saveSuccessMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{saveSuccessMessage}</span>
              </div>
            )}

            {/* + Add New Address Button (Green outlined/tinted button matching screenshot 1) */}
            <button
              type="button"
              onClick={() => {
                setStep('SEARCH_LOCATION');
                setSearchQuery('');
                setSuggestions([]);
                setSearchError(null);
              }}
              className="w-full py-3.5 px-4 rounded-xl border border-dashed border-emerald-600 bg-emerald-50/50 hover:bg-emerald-100/70 text-emerald-800 font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-2xs"
            >
              <Plus className="w-4 h-4 text-emerald-700 stroke-[2.5]" />
              <span>+ add new address</span>
            </button>

            {/* "or" divider with center text */}
            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-slate-500 font-semibold">or</span>
              </div>
            </div>

            {/* Saved Addresses List */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {(addresses || []).filter(Boolean).length === 0 ? (
                <div className="text-center py-6 px-4 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                  <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">No saved delivery addresses yet</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Add your site or home address to check 60-minute dispatch availability across Bengaluru.
                  </p>
                </div>
              ) : (
                (addresses || []).filter(Boolean).map((addr) => {
                  const isSelected = selectedAddrId === addr.id;
                  const Icon = getAddressIcon(addr.type);
                  const label = getAddressLabel(addr.type);

                  const fullText =
                    addr.fullAddress ||
                    [addr.building, addr.street, addr.area, addr.city, addr.state, addr.pincode]
                      .filter(Boolean)
                      .join(', ');

                  return (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddrId(addr.id)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                        isSelected
                          ? 'border-emerald-600 bg-white shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      {/* Left icon container with soft background */}
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 text-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5 border border-amber-100">
                        <Icon className="w-5 h-5 text-slate-800" />
                      </div>

                      {/* Address Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                            {label}
                            {addr.isDefault && (
                              <span className="text-[9px] font-black bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                                DEFAULT
                              </span>
                            )}
                          </h4>
                        </div>

                        <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-2">
                          {fullText}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom "Confirm location and continue" Primary Button */}
            <div className="pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={handleConfirmLocationAndContinue}
                className="w-full bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-slate-950 font-bold shadow-md text-sm py-3.5 rounded-2xl transition-all"
              >
                Confirm location and continue
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: SEARCH LOCATION MODAL (REFERENCE SCREENSHOTS 2 & 3)               */}
        {/* ========================================================================= */}
        {step === 'SEARCH_LOCATION' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {searchError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{searchError}</span>
              </div>
            )}

            {/* Location Search Bar with Search Icon / Clear Button */}
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search delivery location or nearby landmark"
                className="w-full pl-4 pr-10 py-3 text-sm font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue-600 focus:border-brand-blue-600 transition-all placeholder:text-slate-400 shadow-2xs"
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-slate-400">
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin text-brand-blue-600" />
                ) : searchQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSuggestions([]);
                    }}
                    className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <Search className="w-4 h-4 text-slate-400" />
                )}
              </div>

              {/* Autocomplete Suggestions Dropdown (Screenshot 3) */}
              {suggestions.length > 0 && (
                <div className="mt-2 border border-slate-200 rounded-xl bg-white shadow-lg overflow-hidden max-h-72 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-150">
                  {suggestions.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectSuggestion(item)}
                      className="p-3 flex items-start gap-3 hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                      <MapPin className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 flex-shrink-0 mt-0.5 transition-colors" />
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-xs text-slate-900 leading-snug">
                          <strong className="font-bold">{item.mainText}</strong>{' '}
                          <span className="text-slate-600">{item.secondaryText}</span>
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Google Attribution (Screenshot 3) */}
                  <div className="p-2.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-end gap-1.5 text-[10px] text-slate-400 font-medium">
                    <span>powered by</span>
                    <span className="font-bold text-slate-600">Google</span>
                  </div>
                </div>
              )}
            </div>

            {/* "Use current location" option (Screenshot 2) */}
            {suggestions.length === 0 && (
              <div
                onClick={handleUseCurrentLocation}
                className="border border-slate-200 hover:border-emerald-500 rounded-2xl p-4 bg-white flex items-center justify-between cursor-pointer group transition-all shadow-2xs hover:shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    {isDetectingGps ? (
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    ) : (
                      <Crosshair className="w-4 h-4 text-emerald-600 group-hover:rotate-45 transition-transform" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-700 group-hover:text-emerald-800">
                      Use current location
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isDetectingGps
                        ? 'Detecting GPS position...'
                        : '2nd Stage, Nagarbhavi, Bengaluru, Karnataka 560072'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: LOCATION SELECTION & ADDRESS DETAILS (SCREENSHOT 4)               */}
        {/* ========================================================================= */}
        {step === 'LOCATION_DETAILS' && (
          <div className="animate-in fade-in duration-150">
            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Responsive 2-Panel Split Layout (Desktop: Side-by-side | Mobile: Stacked) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
              {/* LEFT PANEL: Interactive Map with Pin, Speech Bubble & Search Overlay */}
              <div className="md:col-span-6 lg:col-span-6 flex flex-col min-h-[360px] md:min-h-[460px]">
                <DeliveryLocationMap
                  lat={selectedLat}
                  lng={selectedLng}
                  selectedAddressText={selectedAddressText}
                  localityBadgeText={selectedLocalityText}
                  onLocationChange={handleMapLocationChange}
                  onClearSearch={() => setStep('SEARCH_LOCATION')}
                  className="flex-1 w-full"
                />
              </div>

              {/* RIGHT PANEL: Address Form (Screenshot 4) */}
              <div className="md:col-span-6 lg:col-span-6 flex flex-col justify-between">
                <form onSubmit={handleSaveAddress} className="space-y-4">
                  {/* SAVE ADDRESS AS (Pills: Home, Project, Other) */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                      SAVE ADDRESS AS
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {[
                        { type: 'HOME' as AddressType, label: 'Home', icon: Home },
                        { type: 'CONSTRUCTION_SITE' as AddressType, label: 'Project', icon: Briefcase },
                        { type: 'OTHER' as AddressType, label: 'Other', icon: MapPin }
                      ].map((item) => {
                        const isSel = addrType === item.type;
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.type}
                            type="button"
                            onClick={() => setAddrType(item.type)}
                            className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                              isSel
                                ? 'border-amber-400 bg-amber-100/80 text-slate-900 shadow-2xs ring-1 ring-amber-400'
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

                  {/* APARTMENT / HOUSE NUMBER / BUILDING NAME */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      APARTMENT/HOUSE NUMBER/BUILDING NAME
                    </label>
                    <input
                      type="text"
                      required
                      value={building}
                      onChange={(e) => setBuilding(e.target.value)}
                      placeholder="e.g. Flat 302, Sunshine Heights / Plot 89"
                      className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue-600 focus:border-brand-blue-600"
                    />
                  </div>

                  {/* AREA / SECTOR / LOCALITY */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      AREA/SECTOR/LOCALITY
                    </label>
                    <input
                      type="text"
                      required
                      value={areaLocality}
                      onChange={(e) => setAreaLocality(e.target.value)}
                      placeholder="Kalyan Nagar, Nagarbhavi, Bengaluru, Karnataka 560072"
                      className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue-600 focus:border-brand-blue-600 bg-slate-50/50"
                    />
                  </div>

                  {/* RECEIVER'S NAME */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      RECEIVER'S NAME
                    </label>
                    <input
                      type="text"
                      required
                      value={receiverName}
                      onChange={(e) => setReceiverName(e.target.value)}
                      placeholder="Full Name"
                      className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue-600 focus:border-brand-blue-600"
                    />
                  </div>

                  {/* RECEIVER'S PHONE NUMBER */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      RECEIVER'S PHONE NUMBER
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={receiverPhone}
                        onChange={(e) => setReceiverPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="10-digit mobile number"
                        className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue-600 focus:border-brand-blue-600 font-mono tracking-wider"
                      />
                    </div>
                  </div>

                  {/* Save Address Button (Amber/Yellow Full Width Button) */}
                  <div className="pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      disabled={isSaving}
                      className="w-full bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-slate-950 font-bold shadow-md text-sm py-3.5 rounded-2xl transition-all"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save Address'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
