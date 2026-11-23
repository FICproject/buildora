import React from 'react';
import { Truck, Clock, IndianRupee } from 'lucide-react';
import { Product } from '@buildora/types';
import { formatCurrency, DEFAULT_FREE_DELIVERY_THRESHOLD } from '@buildora/utils';
import { useLocationStore } from '../../store/useLocationStore';

export interface ProductDeliveryInfoBarProps {
  product: Product;
}

export const ProductDeliveryInfoBar: React.FC<ProductDeliveryInfoBarProps> = ({ product }) => {
  const { isServiceable, etaMinutes, dispatchStatus } = useLocationStore();

  // 1. Dynamic Delivery Offer Threshold from existing configuration
  const freeThreshold =
    (product.categoryAttributes as any)?.freeDeliveryThreshold || DEFAULT_FREE_DELIVERY_THRESHOLD;

  // 2. Dynamic Estimated Delivery Time based on location store and product availability
  const getEstimatedDeliveryTime = (): string => {
    if (!isServiceable || dispatchStatus === 'UNSERVICEABLE') {
      return 'Delivery time calculated at checkout';
    }

    const speeds = product.deliverySpeedAvailable || [];
    if (speeds.includes('ASAP_60')) {
      return `${etaMinutes || 60} Mins`;
    }
    if (speeds.includes('EXPRESS_90')) {
      return '90 Mins';
    }
    if (speeds.includes('SCHEDULED')) {
      return 'Scheduled Delivery';
    }
    if (speeds.includes('NEXT_DAY')) {
      return 'Tomorrow';
    }
    if (speeds.includes('STANDARD')) {
      return '2-3 Days';
    }

    return etaMinutes ? `${etaMinutes} Mins` : '60 Mins';
  };

  const estimatedTimeText = getEstimatedDeliveryTime();

  // 3. Dynamic Payment Information based on order eligibility and serviceability
  const getPaymentInfoText = (): string => {
    if (!isServiceable || dispatchStatus === 'UNSERVICEABLE') {
      return 'Payment options at checkout';
    }

    // COD is enabled in BUILDORA 60 for orders up to ₹50,000 in serviceable dark-store zones
    const isCodEligible = product.price <= 50000;
    if (isCodEligible) {
      return 'Pay on Delivery';
    }
    return 'Online Payment (UPI / Card)';
  };

  const paymentText = getPaymentInfoText();

  return (
    <div
      aria-label="Delivery and payment quick info"
      className="flex flex-wrap items-center gap-y-2 gap-x-3 text-xs select-none"
    >
      {/* 1. Delivery Offer */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="inline-flex items-center gap-1 bg-[#00897b] text-white text-[10px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 rounded-sm shadow-2xs">
          <Truck className="w-3 h-3 text-white fill-current" />
          <span>Free Delivery</span>
        </span>
        <span className="text-[11px] sm:text-xs text-slate-700 font-medium">
          on orders above {formatCurrency(freeThreshold)}
        </span>
      </div>

      {/* Subtle Separator */}
      <span className="text-slate-300 font-light select-none hidden sm:inline" aria-hidden="true">
        |
      </span>

      {/* 2. Estimated Delivery Time */}
      <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-slate-800 flex-shrink-0">
        <Clock className="w-3.5 h-3.5 text-slate-600" />
        <span>{estimatedTimeText}</span>
      </div>

      {/* Subtle Separator */}
      <span className="text-slate-300 font-light select-none hidden sm:inline" aria-hidden="true">
        |
      </span>

      {/* 3. Payment Information */}
      <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-slate-800 flex-shrink-0">
        <IndianRupee className="w-3.5 h-3.5 text-slate-800" />
        <span>{paymentText}</span>
      </div>
    </div>
  );
};
