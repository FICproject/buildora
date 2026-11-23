import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Heart,
  ShieldCheck,
  Building2,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Plus,
  Scale
} from 'lucide-react';
import { SEED_PRODUCTS } from '@buildora/constants';
import { api } from '../services/api';
import { formatCurrency } from '@buildora/utils';
import { useCartStore } from '../store/useCartStore';
import { useWishlistStore } from '../store/useWishlistStore';
import { useCompareStore } from '../store/useCompareStore';
import { RatingStars } from '../components/ui/RatingStars';
import { Button } from '../components/ui/Button';
import { ProductCard } from '../components/common/ProductCard';
import { ProductInfoAccordion } from '../components/common/ProductInfoAccordion';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const initialProduct = SEED_PRODUCTS.find((p) => p.slug === slug) || SEED_PRODUCTS[0];
  const [product, setProduct] = useState(initialProduct);

  const { addItem } = useCartStore();
  const { isInWishlist, toggleItem } = useWishlistStore();
  const { isInCompare, addItem: addToCompare } = useCompareStore();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(initialProduct.variants?.[0]);
  const [compareAlert, setCompareAlert] = useState<string | null>(null);
  const [bundleAdded, setBundleAdded] = useState(false);

  // Fetch real product details from Backend API when slug changes
  useEffect(() => {
    if (slug) {
      api.getProductBySlug(slug).then((liveProd) => {
        if (liveProd) {
          setProduct(liveProd);
          setSelectedVariant(liveProd.variants?.[0]);
        }
      });
    }
  }, [slug]);

  const isWishlisted = isInWishlist(product.id);
  const inCompare = isInCompare(product.id);

  // Price calculations with variant
  const basePrice = selectedVariant ? selectedVariant.price : product.price;
  const baseMrp = selectedVariant ? selectedVariant.mrp : product.mrp;

  // Companion product for frequently bought together
  const companionProduct = SEED_PRODUCTS.find((p) => p.id !== product.id && p.inStock) || SEED_PRODUCTS[1];
  const bundleTotal = basePrice + companionProduct.price;

  // Related products from same category
  const relatedProducts = SEED_PRODUCTS.filter(
    (p) => p.categorySlug === product.categorySlug && p.id !== product.id
  ).slice(0, 4);

  const handleAddToCart = () => {
    addItem(product, 1, selectedVariant);
  };

  const handleAddBundle = () => {
    addItem(product, 1, selectedVariant);
    addItem(companionProduct, 1);
    setBundleAdded(true);
    setTimeout(() => setBundleAdded(false), 3000);
  };

  const handleCompareClick = () => {
    const res = addToCompare(product);
    setCompareAlert(res.message);
    setTimeout(() => setCompareAlert(null), 2500);
  };

  return (
    <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8 space-y-8 pb-24 lg:pb-8">
      {/* 1. Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto no-scrollbar whitespace-nowrap">
        <Link to="/" className="hover:text-brand-blue-900 flex-shrink-0">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <Link to="/products" className="hover:text-brand-blue-900 flex-shrink-0">Catalog</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <Link to={`/categories/${product.categorySlug}`} className="hover:text-brand-blue-900 flex-shrink-0">
          {product.category}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <span className="font-semibold text-slate-800 truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* 2. Top Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12">
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative aspect-square rounded-3xl bg-white border border-slate-200/80 overflow-hidden shadow-card flex items-center justify-center p-4">
            <img
              src={product.images[activeImageIndex] || product.images[0]}
              alt={product.name}
              className={`max-h-full max-w-full object-contain transition-transform duration-300 ${isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
                }`}
              onClick={() => setIsZoomed(!isZoomed)}
            />
            {product.discount > 0 && (
              <div className="absolute top-3.5 left-3.5">
                <span className="bg-blue-600 text-white text-[10px] sm:text-xs font-black px-2 py-0.5 rounded shadow-xs">
                  Save {product.discount}%
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={() => toggleItem(product)}
              className={`absolute top-3.5 right-3.5 p-2 rounded-full shadow-md transition-colors ${isWishlisted
                  ? 'bg-rose-50 text-rose-600'
                  : 'bg-white text-slate-400 hover:text-rose-500'
                }`}
              title="Save to wishlist"
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>

            {/* Prev / Next Buttons */}
            {product.images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : product.images.length - 1));
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-md flex items-center justify-center transition-all cursor-pointer"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIndex((prev) => (prev < product.images.length - 1 ? prev + 1 : 0));
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-md flex items-center justify-center transition-all cursor-pointer"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {product.images.map((img: string, idx: number) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl border-2 overflow-hidden bg-white flex-shrink-0 ${activeImageIndex === idx ? 'border-brand-blue-600 shadow-sm' : 'border-slate-200'
                    }`}
                >
                  <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Safety & Authenticity Guarantees */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>100% Brand Certified Fresh Stock</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand-blue-700 flex-shrink-0" />
              <span>Instant B2B GST ITC Invoicing</span>
            </div>
          </div>
        </div>

        {/* Right Column: Details & Purchasing */}
        <div className="lg:col-span-7 space-y-5 sm:space-y-6">
          {/* Brand & Title */}
          <div>
            <Link
              to={`/brands/${product.brandSlug}`}
              className="text-xs font-black text-brand-blue-800 uppercase tracking-widest hover:underline"
            >
              {product.brand}
            </Link>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 mt-1 leading-tight">
              {product.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 sm:gap-3">
              <RatingStars rating={product.rating} count={product.reviewCount} size="md" />
              <span className="text-slate-300">|</span>
              <span className="text-xs text-slate-500 font-mono">SKU: {product.sku}</span>
              <span className="text-slate-300">|</span>
              <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> In Stock ({product.stockCount} available)
              </span>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="flex items-baseline gap-2.5 sm:gap-3 flex-wrap">
              <span className="text-2xl sm:text-3xl font-black text-slate-900">
                {formatCurrency(basePrice)}
              </span>
              {baseMrp > basePrice && (
                <span className="text-xs sm:text-sm text-slate-400 line-through">
                  MRP {formatCurrency(baseMrp)}
                </span>
              )}
              {product.discount > 0 && (
                <span className="text-xs font-bold text-brand-orange-600">
                  Save {formatCurrency(baseMrp - basePrice)}
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500">
              Unit: <strong className="text-slate-800">{product.unit}</strong> &bull; Price includes {product.gstRate}% GST
            </div>
          </div>

          {/* Product Variant Options Selector */}
          {product.variants && product.variants.length > 1 && (
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                <span>Select Available Option / Pack Size:</span>
                <span className="text-[#1e7e34] font-bold">{selectedVariant?.name}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {product.variants.map((v) => {
                  const isSelected = (selectedVariant?.id || '') === v.id;
                  const vDiscount = v.mrp > v.price ? Math.round(((v.mrp - v.price) / v.mrp) * 100) : 0;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        setSelectedVariant(v);
                        if (v.image) {
                          const idx = product.images.indexOf(v.image);
                          if (idx >= 0) setActiveImageIndex(idx);
                        }
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${isSelected
                          ? 'border-[#1e7e34] bg-emerald-50/60 ring-2 ring-emerald-600/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                    >
                      {vDiscount > 0 && (
                        <span className="absolute top-2 right-2 text-[9px] font-black bg-blue-600 text-white px-1.5 py-0.2 rounded-xs">
                          {vDiscount}% OFF
                        </span>
                      )}
                      <div className="font-bold text-sm text-slate-900">{v.name}</div>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="font-black text-sm text-slate-900">{formatCurrency(v.price)}</span>
                        {v.mrp > v.price && (
                          <span className="text-[10px] text-slate-400 line-through">{formatCurrency(v.mrp)}</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {v.inStock ? 'In Stock' : 'Out of Stock'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons & Quick Actions */}
          <div className="space-y-4 pt-1">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button
                variant="primary"
                size="lg"
                onClick={handleAddToCart}
                className="w-full sm:w-auto min-w-[220px] font-black shadow-md justify-center"
                leftIcon={<Plus className="w-5 h-5" />}
              >
                Add to Cart
              </Button>
            </div>

            {/* Compare action */}
            <div className="flex items-center gap-3 pt-1 text-xs">
              <button
                type="button"
                onClick={handleCompareClick}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold transition-colors ${inCompare
                    ? 'border-brand-blue-500 bg-brand-blue-50 text-brand-blue-900'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
              >
                <Scale className="w-3.5 h-3.5" />
                {inCompare ? 'In Comparison' : 'Compare Specs'}
              </button>
            </div>
          </div>

          {/* Product Information Accordions (Highlights, Description, FAQs, Returns & Exchange Policy) */}
          <div className="pt-2">
            <ProductInfoAccordion product={product} />
          </div>
        </div>
      </div>

      {/* 3. Related Materials in Same Category */}
      {relatedProducts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              Related Materials in {product.category}
            </h2>
            <Link to={`/categories/${product.categorySlug}`} className="text-xs font-bold text-brand-blue-800 hover:underline">
              View All &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* 4. Mobile Sticky Add-to-Cart Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 shadow-2xl flex items-center justify-between gap-3">
        <div>
          <div className="text-xs text-slate-400">Price</div>
          <div className="text-base font-black text-slate-900">
            {formatCurrency(basePrice)}
          </div>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={handleAddToCart}
          className="font-black px-6 shadow-md"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add to Cart
        </Button>
      </div>
    </div>
  );
};
