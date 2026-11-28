import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { formatCurrency } from '@buildora/utils';
import { useBulkPricingStore } from '../../store/useBulkPricingStore';

export const BulkPricingModal: React.FC = () => {
  const { isOpen, product, closeBulkPricing } = useBulkPricingStore();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Prevent background scrolling while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Focus close button for accessibility
      setTimeout(() => closeButtonRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeBulkPricing();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeBulkPricing]);

  if (!isOpen || !product || !product.bulkPricing || product.bulkPricing.length === 0) {
    return null;
  }

  // Sort tiers ascending by minQuantity
  const sortedTiers = [...product.bulkPricing].sort((a, b) => a.minQuantity - b.minQuantity);
  const maxMinQty = Math.max(...sortedTiers.map((t) => t.minQuantity));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-prices-title"
    >
      {/* Dimmed Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={closeBulkPricing}
        aria-hidden="true"
      />

      {/* Centered Modal Card */}
      <div
        className="relative z-10 w-full max-w-sm sm:max-w-md max-h-[90vh] max-h-[90dvh] bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col animate-in fade-in zoom-in-95 duration-200 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Blue Header Area */}
        <div className="bg-brand-blue-700 bg-gradient-to-r from-brand-blue-800 to-blue-600 text-white p-4 sm:p-5 relative">
          <div className="pr-8">
            <h2 id="bulk-prices-title" className="text-lg sm:text-xl font-bold tracking-tight text-white">
              Bulk Prices
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 mt-1 line-clamp-1 font-medium">
              {product.name}
            </p>
          </div>

          {/* Close Icon Button */}
          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeBulkPricing}
            className="absolute top-3.5 right-3.5 text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close bulk prices popup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content: Bulk Pricing Tiers List */}
        <div className="p-4 sm:p-6 space-y-3.5 bg-white overflow-y-auto">
          <ul className="space-y-3 text-sm sm:text-base text-slate-800">
            {sortedTiers.map((tier, idx) => {
              const isBestTier = tier.minQuantity === maxMinQty;

              return (
                <li key={idx} className="flex flex-wrap items-center gap-2 select-none">
                  {/* Bullet */}
                  <span className="text-slate-800 text-lg leading-none">&bull;</span>

                  {/* Tier Condition */}
                  <span className="text-slate-800">
                    Buy <strong className="font-bold text-slate-900">{tier.minQuantity}+</strong> at{' '}
                  </span>

                  {/* Tier Price (highlight best tier) */}
                  {isBestTier ? (
                    <span className="inline-flex items-center gap-1.5 bg-sky-100 text-sky-800 px-2.5 py-0.5 rounded-lg font-bold border border-sky-200">
                      <span>{formatCurrency(tier.unitPrice)}/unit</span>
                      {tier.discountPercentage > 0 && (
                        <span className="text-[10px] font-black uppercase text-sky-700 bg-white/60 px-1 py-0.2 rounded">
                          {tier.discountPercentage}% OFF
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 font-bold text-slate-900">
                      <span>{formatCurrency(tier.unitPrice)}/unit</span>
                      {tier.discountPercentage > 0 && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {tier.discountPercentage}% OFF
                        </span>
                      )}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed">
            Tiered volume discounts apply automatically to your order as item quantities increase in the cart.
          </div>
        </div>
      </div>
    </div>
  );
};
