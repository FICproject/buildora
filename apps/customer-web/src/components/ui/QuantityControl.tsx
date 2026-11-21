import React from 'react';
import { Plus, Minus } from 'lucide-react';

export interface QuantityControlProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  max?: number;
  min?: number;
  size?: 'sm' | 'md';
}

export const QuantityControl: React.FC<QuantityControlProps> = ({
  quantity,
  onIncrease,
  onDecrease,
  max = 999,
  min = 0,
  size = 'md'
}) => {
  const isSm = size === 'sm';

  return (
    <div
      className={`inline-flex items-center rounded-lg border border-slate-300 bg-white overflow-hidden shadow-2xs ${
        isSm ? 'h-7' : 'h-9'
      }`}
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (quantity > min) {
            onDecrease();
          }
        }}
        disabled={quantity <= min}
        className={`flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-brand-blue-900 disabled:opacity-30 disabled:hover:bg-white transition-colors cursor-pointer disabled:cursor-not-allowed select-none ${
          isSm ? 'w-7 h-7' : 'w-9 h-9'
        }`}
        aria-label="Decrease quantity"
      >
        <Minus className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      </button>
      <span
        className={`font-semibold text-slate-800 text-center select-none ${
          isSm ? 'w-8 text-xs' : 'w-10 text-sm'
        }`}
      >
        {quantity}
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (quantity < max) {
            onIncrease();
          }
        }}
        disabled={quantity >= max}
        className={`flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-brand-blue-900 disabled:opacity-30 disabled:hover:bg-white transition-colors cursor-pointer disabled:cursor-not-allowed select-none ${
          isSm ? 'w-7 h-7' : 'w-9 h-9'
        }`}
        aria-label="Increase quantity"
      >
        <Plus className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      </button>
    </div>
  );
};
