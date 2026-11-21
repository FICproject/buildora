import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface HandlingChargeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HandlingChargeModal: React.FC<HandlingChargeModalProps> = ({
  isOpen,
  onClose
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
      aria-labelledby="handling-charge-title"
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
            id="handling-charge-title"
            className="text-lg sm:text-xl font-bold text-slate-900 leading-tight"
          >
            Handling Charge
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

        {/* Content Description matching HomeRun Reference Screenshot 3 */}
        <div className="mt-6 text-sm sm:text-base text-slate-800 leading-relaxed font-normal">
          For proper handling and delivery of heavy or large products which need additional care.
        </div>
      </div>
    </div>
  );
};
