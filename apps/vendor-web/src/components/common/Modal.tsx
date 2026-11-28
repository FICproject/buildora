import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'lg',
  footer,
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
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div
        className="fixed inset-0 bg-[#292524]/45 transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-3 sm:p-4">
        <div
          className={`relative w-full ${maxWidthClasses[maxWidth]} bg-white rounded-xl shadow-lg border border-[#E7E5E4] overflow-hidden`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start sm:items-center justify-between gap-3 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#E7E5E4] bg-[#F8F7F5]">
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-[#943D24] break-words">{title}</h2>
              {subtitle && <p className="text-xs text-[#78716C] mt-0.5 break-words">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="p-1.5 rounded-lg text-[#78716C] hover:text-[#292524] hover:bg-[#E7E5E4]/60 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 sm:p-6 max-h-[75vh] max-h-[75dvh] overflow-y-auto bg-white">{children}</div>

          {footer && (
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-[#F8F7F5] border-t border-[#E7E5E4] flex flex-wrap items-center justify-end gap-2 sm:gap-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
