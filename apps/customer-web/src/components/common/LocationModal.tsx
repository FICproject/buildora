import React, { useState, useEffect } from 'react';
import {
  MapPin,
  CheckCircle2,
  AlertCircle,
  Navigation,
  Clock,
  Building2,
  Sparkles,
  Loader2,
  Check
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useLocationStore } from '../../store/useLocationStore';
import { useAuthStore } from '../../store/useAuthStore';
import { SERVICEABLE_PINCODES } from '@buildora/constants';
import { Address } from '@buildora/types';
import { api } from '../../services/api';

const POPULAR_BENGALURU_HUBS = [
  { code: '560072', name: 'Nagarabhavi / Bengaluru West', eta: 60, tag: 'West Hub' },
  { code: '560038', name: 'Indiranagar / Central', eta: 60, tag: 'Central Hub' },
  { code: '560102', name: 'HSR Layout / South-East', eta: 60, tag: 'South Hub' },
  { code: '560034', name: 'Koramangala', eta: 60, tag: 'South Hub' },
  { code: '560066', name: 'Whitefield IT Corridor', eta: 60, tag: 'East Hub' },
  { code: '560010', name: 'Rajajinagar 1st Block', eta: 60, tag: 'West Hub' },
  { code: '560024', name: 'Hebbal / North Corridor', eta: 60, tag: 'North Hub' },
  { code: '560076', name: 'Bannerghatta Road', eta: 90, tag: 'South Hub' },
];

export const LocationModal: React.FC = () => {
  const {
    isModalOpen,
    closeLocationModal,
    pincode,
    locality,
    cityName,
    isServiceable,
    etaMinutes,
    etaText,
    warehouseName,
    isLoading,
    checkAndSetPincode,
    detectCurrentLocation,
    selectSavedAddress
  } = useLocationStore();

  const { isAuthenticated, user } = useAuthStore();

  const [inputPincode, setInputPincode] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);

  useEffect(() => {
    if (isModalOpen) {
      setInputPincode(pincode || '');
      setFeedback(null);
      if (isAuthenticated) {
        api.getAddresses().then((addrs) => setSavedAddresses(addrs || [])).catch(() => { });
      }
    }
  }, [isModalOpen, pincode, isAuthenticated]);

  const handleVerify = async (codeToVerify?: string) => {
    const code = (codeToVerify || inputPincode || '').trim();
    if (!/^[1-9][0-9]{5}$/.test(code)) {
      setFeedback({ type: 'error', message: 'Please enter a valid 6-digit Indian PIN code.' });
      return;
    }

    try {
      const res = await checkAndSetPincode(code);
      if (res && res.serviceable) {
        setFeedback({ type: 'success', message: res.message || 'Location verified successfully!' });
        setTimeout(() => {
          closeLocationModal();
          setFeedback(null);
        }, 1200);
      } else {
        setFeedback({
          type: 'warning',
          message: res?.message || 'Delivery availability is being verified for this location.'
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        message: 'Unable to verify this location right now. Please try again.'
      });
    }
  };

  const handleDetectGPS = async () => {
    setIsGpsLoading(true);
    setFeedback(null);
    try {
      const result = await detectCurrentLocation();
      if (result && result.success) {
        setFeedback({ type: 'success', message: result.message || 'Location detected successfully!' });
        setTimeout(() => {
          closeLocationModal();
          setFeedback(null);
        }, 1200);
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

  return (
    <Modal isOpen={isModalOpen} onClose={closeLocationModal} title="Select Delivery Location">
      <div className="space-y-4 pt-1">
        {/* Header Title with Pin Icon */}
        <div className="flex items-start gap-3 p-3 bg-brand-blue-50/70 border border-brand-blue-100/80 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-brand-orange-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-sm text-slate-900 leading-tight">Where should we deliver?</h3>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              Enter your job site or construction project pincode for instant material stock check &amp; dispatch ETA across Bengaluru.
            </p>
          </div>
        </div>

        {/* Pincode Input Form */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">Enter Site Pincode</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                maxLength={6}
                value={inputPincode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setInputPincode(val);
                  setFeedback(null);
                  if (val.length === 6) {
                    handleVerify(val);
                  }
                }}
                placeholder="Enter 6-digit PIN (e.g. 560072)"
                className="w-full pl-10 pr-3 py-2.5 text-sm font-semibold tracking-wider border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue-600 focus:border-brand-blue-600"
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              />
            </div>
            <Button
              onClick={() => handleVerify()}
              size="md"
              disabled={isLoading || inputPincode.length !== 6}
              className="px-5 font-black text-xs"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
            </Button>
          </div>
        </div>

        {/* GPS Detection Button */}
        <button
          type="button"
          onClick={handleDetectGPS}
          disabled={isGpsLoading || isLoading}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 border border-slate-200 hover:border-brand-blue-400 bg-white hover:bg-brand-blue-50/40 rounded-xl text-xs font-bold text-brand-blue-900 transition-all shadow-sm group"
        >
          {isGpsLoading ? (
            <>
              <Loader2 className="w-4 h-4 text-brand-blue-700 animate-spin" />
              <span>Detecting GPS Coordinates...</span>
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4 text-brand-orange-500 group-hover:rotate-45 transition-transform" />
              <span>Detect My Current Site Location (GPS)</span>
            </>
          )}
        </button>

        {/* Feedback / Verification Status */}
        {feedback && (
          <div
            className={`p-3 rounded-xl text-xs font-medium flex items-start gap-2.5 ${feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : feedback.type === 'warning'
                  ? 'bg-amber-50 text-amber-900 border border-amber-200'
                  : 'bg-rose-50 text-rose-900 border border-rose-200'
              }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : feedback.type === 'warning' ? (
              <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            )}
            <span className="leading-relaxed">{feedback.message}</span>
          </div>
        )}

        {/* Current Active Location Info Card */}
        {pincode && (
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs">
            <div className="min-w-0 pr-2">
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Selected Location</span>
              <div className="font-extrabold text-slate-900 truncate">
                {pincode} &bull; {locality || cityName}
              </div>
              <div className="text-[11px] text-slate-500 truncate mt-0.5">
                {isServiceable ? etaText : 'Availability being verified'}
              </div>
            </div>
            {isServiceable && (
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-1 rounded-lg flex-shrink-0 flex items-center gap-1 border border-emerald-300/40">
                <Check className="w-3 h-3 stroke-[3]" /> {etaMinutes}m ETA
              </span>
            )}
          </div>
        )}

        {/* Saved Addresses (for Logged-in Users) */}
        {isAuthenticated && savedAddresses.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Saved Site Addresses
            </span>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {savedAddresses.map((addr) => (
                <button
                  key={addr.id}
                  type="button"
                  onClick={() => selectSavedAddress({ pincode: addr.pincode, locality: addr.area || addr.street, city: addr.city })}
                  className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-brand-blue-400 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-bold text-slate-800 truncate block">{addr.building}, {addr.street}</span>
                    <span className="text-slate-500 text-[11px]">{addr.area}, {addr.city} &bull; <strong>{addr.pincode}</strong></span>
                  </div>
                  <span className="text-[11px] text-brand-blue-700 font-bold hover:underline flex-shrink-0">Select</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Popular Active Bengaluru Hubs */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-brand-orange-500" />
              Popular Bengaluru Hubs
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              Active Fleet
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-0.5">
            {POPULAR_BENGALURU_HUBS.map((hub) => {
              const isSelected = pincode === hub.code;
              return (
                <button
                  key={hub.code}
                  type="button"
                  onClick={() => handleVerify(hub.code)}
                  className={`text-left p-2 rounded-xl border text-xs transition-all ${isSelected
                      ? 'border-brand-blue-600 bg-brand-blue-50/70 text-brand-blue-900 shadow-sm'
                      : 'border-slate-200 hover:border-brand-blue-300 hover:bg-slate-50 text-slate-700'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900">{hub.code}</span>
                    <span className="text-[9.5px] font-extrabold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded">
                      {hub.eta}m
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 truncate mt-0.5 font-medium">{hub.name}</div>
                  <span className="text-[9px] text-slate-400 block font-normal">{hub.tag}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
};
