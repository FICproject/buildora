import React from 'react';
import { Plus, Minus } from 'lucide-react';

export interface QuantityControlProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  onChangeQuantity?: (newQty: number) => void;
  onIncreaseBy?: (delta: number) => void;
  onDecreaseBy?: (delta: number) => void;
  max?: number;
  min?: number;
  size?: 'sm' | 'md' | 'lg';
  showBulkSteppers?: boolean;
}

export const QuantityControl: React.FC<QuantityControlProps> = ({
  quantity,
  onIncrease,
  onDecrease,
  onChangeQuantity,
  onIncreaseBy,
  onDecreaseBy,
  max = 999,
  min = 0,
  size = 'md',
  showBulkSteppers = false
}) => {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  const handleDecreaseStep = (delta: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDecreaseBy) {
      onDecreaseBy(delta);
    } else if (onChangeQuantity) {
      const next = Math.max(min, quantity - delta);
      onChangeQuantity(next);
    } else {
      if (delta === 1) {
        onDecrease();
      } else {
        const next = Math.max(min, quantity - delta);
        if (next === 0) onDecrease();
        else {
          for (let i = 0; i < delta && quantity - i > min; i++) {
            onDecrease();
          }
        }
      }
    }
  };

  const handleIncreaseStep = (delta: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onIncreaseBy) {
      onIncreaseBy(delta);
    } else if (onChangeQuantity) {
      const next = Math.min(max, quantity + delta);
      onChangeQuantity(next);
    } else {
      for (let i = 0; i < delta && quantity + i < max; i++) {
        onIncrease();
      }
    }
  };

  if (showBulkSteppers) {
    return (
      <div
        className={`inline-flex items-center rounded-xl border border-slate-300 bg-white overflow-hidden shadow-2xs ${
          isSm ? 'h-7' : isLg ? 'h-10' : 'h-8 sm:h-9'
        }`}
      >
        {/* -5 Stepper */}
        <button
          type="button"
          onClick={(e) => handleDecreaseStep(5, e)}
          disabled={quantity <= Math.max(1, min)}
          className="px-2 h-full flex items-center justify-center text-[10px] sm:text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-brand-blue-900 border-r border-slate-200 disabled:opacity-25 disabled:hover:bg-white transition-colors cursor-pointer disabled:cursor-not-allowed select-none"
          title="Decrease by 5"
        >
          -5
        </button>

        {/* -1 Stepper */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDecrease();
          }}
          disabled={quantity <= min}
          className="px-2 h-full flex items-center justify-center text-slate-700 hover:bg-slate-100 hover:text-brand-blue-900 border-r border-slate-200 disabled:opacity-25 disabled:hover:bg-white transition-colors cursor-pointer disabled:cursor-not-allowed select-none"
          title="Decrease by 1"
          aria-label="Decrease by 1"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        {/* Current Quantity */}
        <span
          className={`font-black text-slate-900 text-center select-none px-2.5 ${
            isSm ? 'min-w-[28px] text-xs' : 'min-w-[34px] text-xs sm:text-sm'
          }`}
        >
          {quantity}
        </span>

        {/* +1 Stepper */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onIncrease();
          }}
          disabled={quantity >= max}
          className="px-2 h-full flex items-center justify-center text-slate-700 hover:bg-slate-100 hover:text-brand-blue-900 border-l border-slate-200 disabled:opacity-25 disabled:hover:bg-white transition-colors cursor-pointer disabled:cursor-not-allowed select-none"
          title="Increase by 1"
          aria-label="Increase by 1"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>

        {/* +5 Stepper */}
        <button
          type="button"
          onClick={(e) => handleIncreaseStep(5, e)}
          disabled={quantity >= max}
          className="px-2 h-full flex items-center justify-center text-[10px] sm:text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-brand-blue-900 border-l border-slate-200 disabled:opacity-25 disabled:hover:bg-white transition-colors cursor-pointer disabled:cursor-not-allowed select-none"
          title="Increase by 5"
        >
          +5
        </button>
      </div>
    );
  }

  // Standard Compact 3-element Stepper
  return (
    <div
      className={`inline-flex items-center rounded-lg border border-slate-300 bg-white overflow-hidden shadow-2xs ${
        isSm ? 'h-7' : isLg ? 'h-10' : 'h-9'
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
