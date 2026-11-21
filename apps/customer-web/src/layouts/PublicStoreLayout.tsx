import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '../components/common/Header';
import { Footer } from '../components/common/Footer';
import { ScrollToTop } from '../components/common/ScrollToTop';
import { BottomStickyCartBar } from '../components/common/BottomStickyCartBar';
import { useCartStore } from '../store/useCartStore';

export const PublicStoreLayout: React.FC = () => {
  const location = useLocation();
  const items = useCartStore((state) => state.items);
  const isCartOrCheckout =
    location.pathname.startsWith('/cart') ||
    location.pathname.startsWith('/checkout') ||
    location.pathname.startsWith('/orders/confirmation');
  const hasStickyBar = items.length > 0 && !isCartOrCheckout;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <ScrollToTop />
      <Header />
      <main className={`flex-grow ${hasStickyBar ? 'pb-20 sm:pb-24' : ''}`}>
        <Outlet />
      </main>
      <Footer />
      <BottomStickyCartBar />
    </div>
  );
};
