import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/useCartStore';
import { formatCurrency } from '@buildora/utils';

export const BottomStickyCartBar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { items, getSummary } = useCartStore();

  // Hide when cart is empty, or when already on cart, checkout, or confirmation pages.
  // Displays identically across Desktop, Laptop, Tablet, and Mobile (including Product Detail Pages).
  const hideOnRoutes = ['/cart', '/checkout', '/orders/confirmation'];
  const shouldHide =
    items.length === 0 ||
    hideOnRoutes.some((route) => location.pathname.startsWith(route));

  if (shouldHide) return null;

  const summary = getSummary();
  const payableAmount = summary.payableAmount ?? summary.grandTotal;

  return (
    <aside
      aria-label="Sticky shopping cart summary bar"
      data-testid="bottom-sticky-cart-bar"
      className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] animate-in slide-in-from-bottom duration-200 print:hidden safe-pb"
    >
      <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-2.5 sm:py-3 flex items-center justify-between gap-3 sm:gap-4">
        {/* Left Section: Total Items & Total Price */}
        <div className="flex items-baseline sm:flex-col gap-2 sm:gap-0 select-none leading-tight min-w-0">
          <span
            data-testid="sticky-cart-count"
            className="text-xs sm:text-sm font-semibold text-slate-600 whitespace-nowrap"
          >
            {summary.itemCount} {summary.itemCount === 1 ? 'Item' : 'Items'}
          </span>
          <span
            data-testid="sticky-cart-amount"
            className="text-base sm:text-lg font-black text-slate-900 tracking-tight whitespace-nowrap"
          >
            {formatCurrency(payableAmount)}
          </span>
        </div>

        {/* Right Section: Single Primary Go to Cart CTA */}
        <button
          type="button"
          data-testid="sticky-go-to-cart"
          onClick={() => navigate('/cart')}
          className="bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold text-xs sm:text-sm px-6 sm:px-8 min-h-[44px] py-2 sm:py-2.5 rounded-full shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap flex-shrink-0"
        >
          <span>Go to Cart</span>
        </button>
      </div>
    </aside>
  );
};
