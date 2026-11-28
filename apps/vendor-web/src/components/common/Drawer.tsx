import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: 'md' | 'lg' | 'xl' | '2xl';
  footer?: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = 'xl',
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

  const widthClasses = {
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      <div
        className="fixed inset-0 bg-[#292524]/45 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-4 sm:pl-8">
        <div
          className={`w-screen ${widthClasses[width]} h-full h-dvh bg-white border-l border-[#E7E5E4] shadow-xl flex flex-col`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#E7E5E4] bg-[#F8F7F5] flex items-start sm:items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-[#943D24] break-words">{title}</h2>
              {subtitle && <p className="text-xs text-[#78716C] mt-0.5 break-words">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close panel"
              className="p-1.5 rounded-lg text-[#78716C] hover:text-[#292524] hover:bg-[#E7E5E4]/60 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white">{children}</div>

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
