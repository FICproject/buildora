import React, { useState } from 'react';
import { MapPin, CheckCircle2, AlertCircle, Navigation } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useLocationStore } from '../../store/useLocationStore';
import { SERVICEABLE_PINCODES } from '@buildora/constants';

export const LocationModal: React.FC = () => {
  const {
    isModalOpen,
    closeLocationModal,
    pincode,
    cityName,
    isServiceable,
    checkAndSetPincode
  } = useLocationStore();

  const [inputPincode, setInputPincode] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleVerify = (codeToVerify?: string) => {
    const code = (codeToVerify || inputPincode).trim();
    if (!/^[1-9][0-9]{5}$/.test(code)) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid 6-digit Indian PIN code.' });
      return;
    }

    const result = checkAndSetPincode(code);
    if (result.serviceable) {
      setStatusMessage({ type: 'success', text: result.message });
      setTimeout(() => {
        closeLocationModal();
        setStatusMessage(null);
      }, 1200);
    } else {
      setStatusMessage({ type: 'error', text: result.message });
    }
  };

  const handleUseCurrentLocation = () => {
    // Simulated GPS lookup to Indiranagar, Bengaluru
    handleVerify('560038');
  };

  return (
    <Modal isOpen={isModalOpen} onClose={closeLocationModal} title="Select Delivery Location">
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Enter your delivery pincode to check instant material availability and warehouse dispatch ETA.
        </p>

        {/* Pincode Input Form */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              maxLength={6}
              value={inputPincode}
              onChange={(e) => {
                setInputPincode(e.target.value.replace(/\D/g, ''));
                setStatusMessage(null);
              }}
              placeholder="Enter 6-digit pincode (e.g. 560038)"
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500 font-medium"
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
            />
          </div>
          <Button onClick={() => handleVerify()} size="md">
            Verify
          </Button>
        </div>

        {/* Current / Detected Location Button */}
        <button
          onClick={handleUseCurrentLocation}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 border border-slate-200 rounded-lg text-sm text-brand-blue-900 font-semibold hover:bg-brand-blue-50/50 transition-colors"
        >
          <Navigation className="w-4 h-4 text-brand-blue-700" />
          Detect My Current Site Location (GPS)
        </button>

        {/* Feedback Message */}
        {statusMessage && (
          <div
            className={`p-3 rounded-lg text-xs font-medium flex items-start gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Popular Active Delivery Hubs */}
        <div className="pt-3 border-t border-slate-100">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Active 60-Min Quick Hubs
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(SERVICEABLE_PINCODES)
              .slice(0, 6)
              .map(([code, data]) => (
                <button
                  key={code}
                  onClick={() => handleVerify(code)}
                  className={`text-left p-2 rounded-lg border text-xs transition-colors ${
                    pincode === code && isServiceable
                      ? 'border-brand-blue-500 bg-brand-blue-50/60 font-semibold text-brand-blue-900'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="font-bold">{code}</div>
                  <div className="text-[11px] text-slate-500 truncate">{data.city}</div>
                </button>
              ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};
