import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/useCartStore';
import { formatCurrency } from '@buildora/utils';

export const BottomStickyCartBar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { items, getSummary } = useCartStore();

  // Hide when cart is empty, or when already on cart, checkout or confirmation pages
  const hideOnRoutes = ['/cart', '/checkout', '/orders/confirmation'];
  const shouldHide =
    items.length === 0 ||
    hideOnRoutes.some((route) => location.pathname.startsWith(route));

  if (shouldHide) return null;

  const summary = getSummary();
  const payableAmount = summary.payableAmount || summary.grandTotal;

  return (
    <aside
      aria-label="Sticky shopping cart summary bar"
      className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] animate-in slide-in-from-bottom duration-200 print:hidden"
    >
      <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-4">
        {/* Left Section: Total Items & Total Price */}
        <div className="flex flex-col select-none leading-tight">
          <span className="text-xs sm:text-sm font-semibold text-slate-600">
            {summary.itemCount} {summary.itemCount === 1 ? 'item' : 'items'}
          </span>
          <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            {formatCurrency(payableAmount)}
          </span>
        </div>

        {/* Right Section: View Cart CTA */}
        <button
          type="button"
          onClick={() => navigate('/cart')}
          className="bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold text-xs sm:text-sm px-6 sm:px-8 py-2 sm:py-2.5 rounded-full shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-2"
        >
          <span>View Cart</span>
        </button>
      </div>
    </aside>
  );
};
