import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { formatCurrency } from '@buildora/utils';

export interface DeliveryChargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  freeThreshold?: number;
  standardFee?: number;
}

export const DeliveryChargeModal: React.FC<DeliveryChargeModalProps> = ({
  isOpen,
  onClose,
  freeThreshold = 1000,
  standardFee = 199
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delivery-charge-title"
    >
      {/* Dark overlay backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        className="relative w-full max-w-sm sm:max-w-md bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-7 shadow-xl z-10 transform transition-all animate-in fade-in zoom-in-95 duration-150 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: Title and Close (X) */}
        <div className="flex items-center justify-between">
          <h3
            id="delivery-charge-title"
            className="text-lg sm:text-xl font-bold text-slate-900 leading-tight"
          >
            Delivery Charge
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 -mr-1 text-slate-800 hover:text-black hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Rows */}
        <div className="mt-6 space-y-3.5 text-sm sm:text-base text-slate-800">
          <div className="flex items-center justify-between">
            <span className="font-normal text-slate-800">
              Orders above {formatCurrency(freeThreshold)}
            </span>
            <span className="font-medium text-slate-900">₹0</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-normal text-slate-800">
              Orders below {formatCurrency(freeThreshold)}
            </span>
            <span className="font-medium text-slate-900">
              {formatCurrency(standardFee)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
