import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, Cloud, Sparkles } from 'lucide-react';
import { useWishlistStore } from '../store/useWishlistStore';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { ProductCard } from '../components/common/ProductCard';
import { Button } from '../components/ui/Button';
import { ProtectedRouteGate } from '../components/common/ProtectedRouteGate';

export const WishlistPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, removeItem } = useWishlistStore();
  const { addItem } = useCartStore();
  const { isAuthenticated, openAuthModal } = useAuthStore();

  return (
    <ProtectedRouteGate
      title="Saved Materials Wishlist"
      description="Sign in with your mobile number to view and manage your saved Wishlist items."
      reason="Sign in to view your saved Wishlist items."
    >
      {items.length === 0 ? (
        <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Heart className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">Your Wishlist is Empty</h1>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Save construction materials, tools, or finishes here to track price drops and order when your project reaches that stage.
          </p>
          <Button variant="primary" size="md" onClick={() => navigate('/products')}>
            Browse Materials
          </Button>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h1 className="text-2xl font-black text-slate-900">
                Saved Materials Wishlist ({items.length} items)
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Materials saved for upcoming renovation stages.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {items.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </div>
      )}
    </ProtectedRouteGate>
  );
};
