import React from 'react';
import { Product } from '@buildora/types';
import { formatCurrency } from '@buildora/utils';
import { useBulkPricingStore } from '../../store/useBulkPricingStore';

export interface BulkPriceTriggerProps {
  product: Product;
  className?: string;
}

export const BulkPriceTrigger: React.FC<BulkPriceTriggerProps> = ({
  product,
  className = ''
}) => {
  const openBulkPricing = useBulkPricingStore((state) => state.openBulkPricing);

  if (!product.bulkPricing || product.bulkPricing.length === 0) {
    return null;
  }

  // Calculate the lowest bulk tier unit price
  const lowestBulkPrice = Math.min(...product.bulkPricing.map((t) => t.unitPrice));

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openBulkPricing(product);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer truncate text-left select-none inline-flex items-center gap-0.5 ${className}`}
      title={`View bulk prices for ${product.name}`}
      aria-label={`View bulk prices starting at ${formatCurrency(lowestBulkPrice)}`}
    >
      <span>Bulk price {formatCurrency(lowestBulkPrice)} &gt;</span>
    </button>
  );
};
