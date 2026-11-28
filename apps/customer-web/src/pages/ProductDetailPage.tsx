import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Heart,
  ShieldCheck,
  Building2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  AlertCircle,
  Plus,
  Minus,
  Loader2,
  Scale
} from 'lucide-react';
import { Product, ProductVariant } from '@buildora/types';
import { api } from '../services/api';
import { formatCurrency } from '@buildora/utils';
import { useCartStore } from '../store/useCartStore';
import { useWishlistStore } from '../store/useWishlistStore';
import { useCompareStore } from '../store/useCompareStore';
import { useAuthStore } from '../store/useAuthStore';
import { ProductCard } from '../components/common/ProductCard';
import { ProductInfoAccordion } from '../components/common/ProductInfoAccordion';
import { ProductDeliveryInfoBar } from '../components/common/ProductDeliveryInfoBar';
import { BulkPriceTrigger } from '../components/common/BulkPriceTrigger';

function getOptVal(opt: any): string {
  if (!opt) return '';
  return typeof opt === 'string' ? opt : (opt.value || '');
}

function getOptLabel(opt: any): string {
  if (!opt) return '';
  return typeof opt === 'string' ? opt : (opt.label || opt.value || '');
}

function findVariantForAttributes(
  attrs: Record<string, string>,
  variants?: ProductVariant[]
): ProductVariant | undefined {
  if (!variants || variants.length === 0) return undefined;

  // 1. Exact match where every key in attrs matches variant.attributes
  const exact = variants.find((v) => {
    if (!v.attributes) return false;
    const entries = Object.entries(attrs);
    if (entries.length === 0) return false;
    return entries.every(([k, val]) => v.attributes[k] === val);
  });
  if (exact) return exact;

  // 2. Reverse exact match
  const rev = variants.find((v) => {
    if (!v.attributes) return false;
    const entries = Object.entries(v.attributes);
    if (entries.length === 0) return false;
    return entries.every(([k, val]) => attrs[k] === val);
  });
  if (rev) return rev;

  // 3. Score-based fallback only among valid and available variants
  let best: ProductVariant | undefined = undefined;
  let maxScore = 0;
  for (const v of variants) {
    if (!v.attributes || v.isAvailable === false) continue;
    let score = 0;
    for (const [k, val] of Object.entries(attrs)) {
      if (v.attributes[k] === val) score++;
    }
    if (score > maxScore) {
      maxScore = score;
      best = v;
    }
  }
  return best;
}

function getExactVariantForAttrs(
  attrs: Record<string, string>,
  variants?: ProductVariant[]
): ProductVariant | undefined {
  if (!variants || variants.length === 0) return undefined;
  const entries = Object.entries(attrs);
  if (entries.length === 0) return undefined;
  return variants.find((v) => {
    if (!v.attributes) return false;
    return entries.every(([k, val]) => v.attributes[k] === val);
  });
}

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loadingProduct, setLoadingProduct] = useState(true);

  const {
    items,
    addItem,
    updateQuantity,
    removeItem,
    isSyncing,
    cartError,
    clearCartError,
  } = useCartStore();
  const { isInWishlist, toggleItem } = useWishlistStore();
  const { isInCompare, addItem: addToCompare } = useCompareStore();
  const { requireAuth } = useAuthStore();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(undefined);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});

  const [compareAlert, setCompareAlert] = useState<string | null>(null);
  const [stockAlert, setStockAlert] = useState<string | null>(null);

  // Fetch product details & related category products from Backend API
  useEffect(() => {
    if (!slug) return;
    let active = true;
    const loadProductDetail = () => {
      setLoadingProduct(true);
      api
        .getProductBySlug(slug)
        .then((liveProd) => {
          if (!active) return;
          if (liveProd) {
            setProduct(liveProd);
            const initAttrs: Record<string, string> = {};
            if (liveProd.attributes && liveProd.attributes.length > 0) {
              for (const attr of liveProd.attributes) {
                const firstOpt = getOptVal(attr.options[0]);
                initAttrs[attr.name] = firstOpt;
              }
            } else if (liveProd.variants?.[0]?.attributes) {
              Object.assign(initAttrs, liveProd.variants[0].attributes);
            }
            setSelectedAttributes(initAttrs);
            const matched = findVariantForAttributes(initAttrs, liveProd.variants);
            setSelectedVariant(matched || liveProd.variants?.[0]);
            if (liveProd.categorySlug) {
              api.getProducts({ category: liveProd.categorySlug }).then((rel) => {
                if (active && Array.isArray(rel)) {
                  setRelatedProducts(rel.filter((r) => r.id !== liveProd.id).slice(0, 4));
                }
              });
            }
          } else {
            setProduct(null);
            setRelatedProducts([]);
          }
        })
        .finally(() => {
          if (active) setLoadingProduct(false);
        });
    };

    loadProductDetail();
    const onRealtime = () => loadProductDetail();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') loadProductDetail();
    };
    window.addEventListener('buildora:realtime:catalog', onRealtime);
    window.addEventListener('focus', onRealtime);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      active = false;
      window.removeEventListener('buildora:realtime:catalog', onRealtime);
      window.removeEventListener('focus', onRealtime);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [slug]);

  // Cross-tab synchronization listener for real-time customer-vendor catalog updates
  useEffect(() => {
    if (typeof BroadcastChannel !== 'undefined' && product) {
      const bc = new BroadcastChannel('buildora_product_sync');
      bc.onmessage = (event) => {
        if (event.data?.productId === product.id || event.data?.slug === product.slug) {
          if (slug) {
            api.getProductBySlug(slug).then((liveProd) => {
              if (liveProd) {
                setProduct(liveProd);
                const matched = findVariantForAttributes(selectedAttributes, liveProd.variants);
                setSelectedVariant(matched || liveProd.variants?.[0]);
              }
            });
          }
        }
      };
      return () => {
        bc.close();
      };
    }
  }, [product?.id, product?.slug, slug, selectedAttributes]);

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-sm text-slate-500">
        {loadingProduct ? 'Loading material specifications...' : 'Product not found.'}
      </div>
    );
  }

  const isWishlisted = isInWishlist(product.id);
  const inCompare = isInCompare(product.id);

  // Price & Stock calculations
  const activePrice = selectedVariant ? selectedVariant.price : product.price;
  const activeMrp = selectedVariant ? selectedVariant.mrp : product.mrp;
  const activeDiscount =
    activeMrp > activePrice
      ? Math.round(((activeMrp - activePrice) / activeMrp) * 100)
      : (product.discount || 0);

  const isUnavailableCombination = Boolean(
    product.variants &&
    product.variants.length > 0 &&
    (!selectedVariant || selectedVariant.isAvailable === false || selectedVariant.status === 'INACTIVE')
  );

  const isOutOfStock =
    !product.inStock ||
    product.stockCount <= 0 ||
    (selectedVariant &&
      (!selectedVariant.inStock ||
        (selectedVariant.stock !== undefined && selectedVariant.stock <= 0)));

  const effectiveStock = Math.max(
    0,
    Number(selectedVariant?.stock !== undefined ? selectedVariant.stock : product.stockCount) || 0
  );
  const minOrderQty = Math.max(1, Number((selectedVariant as any)?.moq ?? product.moq ?? 1));
  const activeVariantId = selectedVariant?.id || undefined;
  const isSingleOrNoVariant = !product.variants || product.variants.length <= 1;
  const matchingCartItem = items.find((item) => {
    if (item.productId !== product.id) return false;
    if ((item.variantId || undefined) === activeVariantId) return true;
    if (isSingleOrNoVariant && !item.variantId) return true;
    return false;
  });
  const cartQuantity = matchingCartItem?.quantity || 0;
  const targetCartVariantId = matchingCartItem?.variantId;

  const handleAttributeChange = (attrName: string, val: string) => {
    setStockAlert(null);
    clearCartError();
    const next = { ...selectedAttributes, [attrName]: val };
    setSelectedAttributes(next);
    const matched = getExactVariantForAttrs(next, product.variants) || findVariantForAttributes(next, product.variants);
    if (matched) {
      setSelectedVariant(matched);
      if (matched.image) {
        const idx = product.images.indexOf(matched.image);
        if (idx >= 0) setActiveImageIndex(idx);
      }
    } else {
      setSelectedVariant(undefined);
    }
  };

  const handleAddToCart = () => {
    if (isUnavailableCombination || isOutOfStock) return;
    setStockAlert(null);
    clearCartError();
    addItem(product, minOrderQty, selectedVariant);
  };

  const handleIncreaseQuantity = () => {
    if (isUnavailableCombination || isOutOfStock) return;
    clearCartError();
    if (cartQuantity >= effectiveStock) {
      setStockAlert(`Only ${effectiveStock} unit${effectiveStock === 1 ? '' : 's'} available in stock.`);
      return;
    }
    setStockAlert(null);
    updateQuantity(product.id, cartQuantity + 1, targetCartVariantId);
  };

  const handleDecreaseQuantity = () => {
    setStockAlert(null);
    clearCartError();
    const nextQty = cartQuantity - 1;
    if (nextQty <= 0 || nextQty < minOrderQty) {
      removeItem(product.id, targetCartVariantId);
      return;
    }
    updateQuantity(product.id, nextQty, targetCartVariantId);
  };

  const handleCompareClick = () => {
    const res = addToCompare(product);
    setCompareAlert(res.message);
    setTimeout(() => setCompareAlert(null), 2500);
  };

  const hasBottomStickyBar = items.length > 0;

  return (
    <div className={`w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8 space-y-8 ${hasBottomStickyBar ? 'pb-24 sm:pb-28' : 'pb-10'}`}>
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
            {activeDiscount > 0 && (
              <div className="absolute top-3.5 left-3.5">
                <span className="bg-blue-600 text-white text-[10px] sm:text-xs font-black px-2 py-0.5 rounded shadow-xs">
                  {activeDiscount}% OFF
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                if (
                  !requireAuth(
                    { type: 'WISHLIST_ADD', product },
                    { reason: `Sign in to save "${product.name}" to your Wishlist.` }
                  )
                ) {
                  return;
                }
                toggleItem(product);
              }}
              className={`absolute top-3.5 right-3.5 p-2 rounded-full shadow-md transition-colors cursor-pointer ${isWishlisted
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
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl border-2 overflow-hidden bg-white flex-shrink-0 cursor-pointer ${activeImageIndex === idx ? 'border-brand-blue-600 shadow-sm' : 'border-slate-200'
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
        <div className="lg:col-span-7 space-y-5">
          {/* Quick Delivery & Payment Information Bar (Above Title) */}
          <ProductDeliveryInfoBar product={product} />

          {/* Brand & Title (Cleanly reorganized - Phase 8: rating/SKU/stock row removed) */}
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
          </div>

          {/* Pricing Row (Matching HomeRun Reference PDP Style) */}
          <div className="space-y-1">
            <div className="flex items-baseline gap-2.5 sm:gap-3 flex-wrap">
              {activeMrp > activePrice && (
                <span className="text-base sm:text-lg text-slate-400 line-through">
                  {formatCurrency(activeMrp)}
                </span>
              )}
              <span className="text-2xl sm:text-3xl font-black text-slate-900">
                {formatCurrency(activePrice)}
              </span>
              {activeDiscount > 0 && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {activeDiscount}% OFF
                </span>
              )}
            </div>

            <div className="text-xs text-slate-500">
              Incl GST Shipping calculated at checkout.
            </div>

            {/* Bulk Price Link (if bulk pricing tiers are available) */}
            {product.bulkPricing && product.bulkPricing.length > 0 && (
              <div className="pt-0.5">
                <BulkPriceTrigger product={product} />
              </div>
            )}
          </div>

          {/* Dynamic Attribute & Variant Presentation Engine (Phases 1, 2 & 5) */}
          {product.attributes && product.attributes.length > 0 ? (
            <div className="space-y-4 pt-1">
              {product.attributes.map((attr) => {
                const options = attr.options;

                if (attr.uiType === 'pills') {
                  // Pills UI (e.g. Thickness: 6mm, 8mm, 12mm - Screenshot 1; Colour: Grey, White, Black - Screenshot 5)
                  return (
                    <div key={attr.id} className="space-y-2">
                      <div className="text-xs font-bold text-slate-900">{attr.name}</div>
                      <div className="flex flex-wrap gap-2">
                        {options.map((optRaw: any) => {
                          const optVal = getOptVal(optRaw);
                          const optLabel = getOptLabel(optRaw);
                          const isSelected = selectedAttributes[attr.name] === optVal;

                          const prospectiveAttrs = { ...selectedAttributes, [attr.name]: optVal };
                          const prospectiveVariant =
                            getExactVariantForAttrs(prospectiveAttrs, product.variants) ||
                            findVariantForAttributes(prospectiveAttrs, product.variants);
                          const isAvailable = prospectiveVariant
                            ? prospectiveVariant.isAvailable !== false && prospectiveVariant.status !== 'INACTIVE'
                            : true;

                          return (
                            <button
                              key={optVal}
                              type="button"
                              onClick={() => handleAttributeChange(attr.name, optVal)}
                              className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all select-none ${isSelected
                                  ? 'bg-black text-white shadow-xs cursor-pointer'
                                  : isAvailable
                                    ? 'bg-white text-slate-800 border border-slate-300 hover:border-slate-500 cursor-pointer'
                                    : 'bg-slate-50 text-slate-400 border border-slate-200 line-through opacity-50 cursor-pointer'
                                }`}
                            >
                              {optLabel}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                if (attr.uiType === 'color_swatches') {
                  // Colour Swatches UI
                  const colorMap: Record<string, string> = {
                    'grey': '#6b7280',
                    'white': '#ffffff',
                    'black': '#1f2937',
                    'red': '#ef4444',
                    'blue': '#3b82f6',
                    'yellow': '#eab308',
                    'green': '#22c55e',
                    'brilliant white': '#f8fafc',
                    'morning mist grey': '#94a3b8',
                    'warm almond': '#fed7aa',
                    'soft ivory': '#fef3c7',
                    'earthy beige': '#d7ccc8',
                    'slate blue': '#475569'
                  };

                  return (
                    <div key={attr.id} className="space-y-2">
                      <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                        <span>{attr.name}</span>
                        <span className="text-xs text-brand-blue-700 font-semibold">{selectedAttributes[attr.name]}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        {options.map((optRaw: any) => {
                          const optVal = getOptVal(optRaw);
                          const optLabel = getOptLabel(optRaw);
                          const isSelected = selectedAttributes[attr.name] === optVal;
                          const hex = (optRaw as any)?.colorHex || colorMap[optVal.toLowerCase()] || '#cbd5e1';

                          return (
                            <button
                              key={optVal}
                              type="button"
                              onClick={() => handleAttributeChange(attr.name, optVal)}
                              title={optLabel}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer select-none ${isSelected
                                  ? 'border-brand-blue-600 bg-brand-blue-50 text-brand-blue-900 ring-2 ring-brand-blue-500/20'
                                  : 'border-slate-300 hover:border-slate-400 bg-white text-slate-700'
                                }`}
                            >
                              <span
                                className="w-4 h-4 rounded-full border border-slate-300 flex-shrink-0"
                                style={{ backgroundColor: hex }}
                              />
                              <span>{optLabel}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                if (attr.uiType === 'dropdown') {
                  // Dropdown Selector UI (e.g. Size: 2 Module, 4 Module - Screenshot 4)
                  return (
                    <div key={attr.id} className="space-y-1.5 max-w-md">
                      <label htmlFor={`attr-select-${attr.id}`} className="block text-xs font-bold text-slate-900">
                        {attr.name}
                      </label>
                      <div className="relative">
                        <select
                          id={`attr-select-${attr.id}`}
                          value={selectedAttributes[attr.name] || ''}
                          onChange={(e) => handleAttributeChange(attr.name, e.target.value)}
                          className="w-full appearance-none bg-white border border-slate-300 hover:border-slate-400 focus:border-[#1e7e34] focus:ring-2 focus:ring-emerald-600/20 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 cursor-pointer transition-colors shadow-2xs pr-10"
                        >
                          {options.map((optRaw: any) => {
                            const optVal = getOptVal(optRaw);
                            const optLabel = getOptLabel(optRaw);
                            const prospectiveAttrs = { ...selectedAttributes, [attr.name]: optVal };
                            const prospectiveVariant =
                              getExactVariantForAttrs(prospectiveAttrs, product.variants) ||
                              findVariantForAttributes(prospectiveAttrs, product.variants);

                            const isVOutOfStock =
                              prospectiveVariant &&
                              (!prospectiveVariant.inStock ||
                                (prospectiveVariant.stock !== undefined && prospectiveVariant.stock <= 0));
                            const isVUnavailable = prospectiveVariant && prospectiveVariant.isAvailable === false;

                            return (
                              <option key={optVal} value={optVal}>
                                {optLabel} {isVUnavailable ? '(Unavailable)' : isVOutOfStock ? '(Out of Stock)' : ''}
                              </option>
                            );
                          })}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  );
                }

                if (attr.uiType === 'radio') {
                  // Radio Selection UI
                  return (
                    <div key={attr.id} className="space-y-2">
                      <div className="text-xs font-bold text-slate-900">{attr.name}</div>
                      <div className="space-y-2">
                        {options.map((optRaw: any) => {
                          const optVal = getOptVal(optRaw);
                          const optLabel = getOptLabel(optRaw);
                          const isSelected = selectedAttributes[attr.name] === optVal;
                          return (
                            <label
                              key={optVal}
                              onClick={() => handleAttributeChange(attr.name, optVal)}
                              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-brand-blue-500 bg-brand-blue-50/50' : 'border-slate-200 bg-white'
                                }`}
                            >
                              <input
                                type="radio"
                                name={`attr-${attr.id}`}
                                checked={isSelected}
                                onChange={() => handleAttributeChange(attr.name, optVal)}
                                className="w-4 h-4 text-brand-blue-600 focus:ring-brand-blue-500"
                              />
                              <span className="text-xs font-bold text-slate-800">{optLabel}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                // Default: 'cards' UI (Screenshot 1: Size 8' X 4' ₹1,455, 7' X 4' ₹1,259; Screenshot 3 & 5)
                return (
                  <div key={attr.id} className="space-y-2">
                    <div className="text-xs font-bold text-slate-900">{attr.name}</div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {options.map((optRaw: any) => {
                        const optVal = getOptVal(optRaw);
                        const optLabel = getOptLabel(optRaw);
                        const isSelected = selectedAttributes[attr.name] === optVal;

                        const prospectiveAttrs = { ...selectedAttributes, [attr.name]: optVal };
                        const prospectiveVariant =
                          getExactVariantForAttrs(prospectiveAttrs, product.variants) ||
                          findVariantForAttributes(prospectiveAttrs, product.variants);

                        const isCombinationValid =
                          prospectiveVariant &&
                          prospectiveVariant.isAvailable !== false &&
                          prospectiveVariant.status !== 'INACTIVE';
                        const cardPrice = prospectiveVariant ? prospectiveVariant.price : activePrice;
                        const cardMrp = prospectiveVariant ? prospectiveVariant.mrp : activeMrp;
                        const cardInStock = prospectiveVariant
                          ? prospectiveVariant.inStock &&
                          (prospectiveVariant.stock === undefined || prospectiveVariant.stock > 0)
                          : true;
                        const cardDiscount =
                          cardMrp > cardPrice ? Math.round(((cardMrp - cardPrice) / cardMrp) * 100) : 0;

                        return (
                          <button
                            key={optVal}
                            type="button"
                            disabled={!isCombinationValid}
                            onClick={() => handleAttributeChange(attr.name, optVal)}
                            className={`p-3 rounded-2xl border text-left transition-all relative ${!isCombinationValid
                                ? 'border-dashed border-slate-200 bg-slate-50 opacity-40 cursor-not-allowed'
                                : isSelected
                                  ? 'border-[#f59e0b] bg-[#fef9c3]/70 ring-2 ring-amber-500/20 shadow-xs cursor-pointer'
                                  : 'border-slate-200 hover:border-slate-300 bg-white cursor-pointer'
                              }`}
                          >
                            {cardDiscount > 0 && isCombinationValid && (
                              <span className="absolute top-2 right-2 text-[9px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded-xs">
                                {cardDiscount}% OFF
                              </span>
                            )}
                            <div className="font-bold text-xs sm:text-sm text-slate-900 pr-8">{optLabel}</div>
                            {isCombinationValid ? (
                              <div className="flex items-baseline gap-1.5 mt-1">
                                <span className="font-black text-sm sm:text-base text-slate-900">
                                  {formatCurrency(cardPrice)}
                                </span>
                                {cardMrp > cardPrice && (
                                  <span className="text-[10px] sm:text-xs text-slate-400 line-through">
                                    {formatCurrency(cardMrp)}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="text-[10px] text-slate-400 font-medium mt-1">Unavailable</div>
                            )}
                            {isCombinationValid && !cardInStock && (
                              <div className="text-[10px] text-rose-600 font-bold mt-0.5">
                                Out of Stock
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : product.variants && product.variants.length > 1 ? (
            // Fallback: Multi-Variant Option Cards
            <div className="space-y-2.5 pt-1">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                <span>Select Available Option / Pack Size:</span>
                <span className="text-[#1e7e34] font-bold">{selectedVariant?.name}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {product.variants.map((v) => {
                  const isSelected = (selectedVariant?.id || '') === v.id;
                  const vDiscount = v.mrp > v.price ? Math.round(((v.mrp - v.price) / v.mrp) * 100) : 0;
                  const vInStock = v.inStock && (v.stock === undefined || v.stock > 0);
                  const isAvail = v.isAvailable !== false && v.status !== 'INACTIVE';

                  return (
                    <button
                      key={v.id}
                      type="button"
                      disabled={!isAvail}
                      onClick={() => {
                        setSelectedVariant(v);
                        if (v.image) {
                          const idx = product.images.indexOf(v.image);
                          if (idx >= 0) setActiveImageIndex(idx);
                        }
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all relative ${!isAvail
                          ? 'border-dashed border-slate-200 bg-slate-50 opacity-40 cursor-not-allowed'
                          : isSelected
                            ? 'border-[#f59e0b] bg-[#fef9c3]/70 ring-2 ring-amber-500/20 shadow-xs cursor-pointer'
                            : 'border-slate-200 hover:border-slate-300 bg-white cursor-pointer'
                        }`}
                    >
                      {vDiscount > 0 && isAvail && (
                        <span className="absolute top-2 right-2 text-[9px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded-xs">
                          {vDiscount}% OFF
                        </span>
                      )}
                      <div className="font-bold text-sm text-slate-900 pr-8">{v.name}</div>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="font-black text-sm text-slate-900">{formatCurrency(v.price)}</span>
                        {v.mrp > v.price && (
                          <span className="text-[10px] text-slate-400 line-through">{formatCurrency(v.mrp)}</span>
                        )}
                      </div>
                      <div className={`text-[10px] font-semibold mt-0.5 ${!isAvail ? 'text-slate-400' : vInStock ? 'text-slate-500' : 'text-rose-600 font-bold'}`}>
                        {!isAvail ? 'Unavailable' : vInStock ? 'In Stock' : 'Out of Stock'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Full-Width Add to Cart -> Unified Quantity Selector Interaction */}
          <div className="space-y-3 pt-2">
            {isUnavailableCombination ? (
              <div className="space-y-2">
                <button
                  type="button"
                  disabled
                  className="w-full py-3.5 sm:py-4 rounded-xl text-base font-bold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed flex items-center justify-center gap-2 select-none shadow-2xs"
                >
                  Selected Option Unavailable
                </button>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>This specific combination of options is not manufactured or currently unavailable. Please select another combination.</span>
                </div>
              </div>
            ) : isOutOfStock ? (
              <div className="space-y-2">
                <button
                  type="button"
                  disabled
                  className="w-full py-3.5 sm:py-4 rounded-xl text-base font-bold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed flex items-center justify-center gap-2 select-none shadow-2xs"
                >
                  Out of Stock
                </button>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>This product / selected variant is currently out of stock. Please select another option or contact us for site restock.</span>
                </div>
              </div>
            ) : cartQuantity > 0 ? (
              <div className="space-y-2">
                <div
                  data-testid="pdp-quantity-selector"
                  role="group"
                  aria-label={`Quantity selector for ${product.name}`}
                  className="w-full h-12 sm:h-14 rounded-xl border-2 border-slate-200 bg-white shadow-sm flex items-center justify-between overflow-hidden"
                >
                  <button
                    type="button"
                    data-testid="pdp-qty-decrease"
                    onClick={handleDecreaseQuantity}
                    disabled={isSyncing}
                    aria-label="Decrease quantity"
                    className="w-16 sm:w-20 h-full flex items-center justify-center text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Minus className="w-5 h-5" />
                  </button>

                  <div className="flex items-center justify-center gap-2 min-w-[3rem] select-none">
                    <span
                      data-testid="pdp-qty-value"
                      className="text-base sm:text-lg font-black text-slate-900"
                    >
                      {cartQuantity}
                    </span>
                    {isSyncing && <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />}
                  </div>

                  <button
                    type="button"
                    data-testid="pdp-qty-increase"
                    onClick={handleIncreaseQuantity}
                    disabled={isSyncing || cartQuantity >= effectiveStock}
                    aria-label="Increase quantity"
                    className="w-16 sm:w-20 h-full flex items-center justify-center text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {(matchingCartItem?.bulkDiscountPercentage ?? 0) > 0 && (
                  <p className="text-xs font-semibold text-emerald-700">
                    Bulk discount applied: {matchingCartItem!.bulkDiscountPercentage}% off ({formatCurrency(matchingCartItem!.effectiveUnitPrice)} / {product.unit})
                  </p>
                )}

                {cartQuantity >= effectiveStock && effectiveStock > 0 && (
                  <p className="text-xs font-semibold text-amber-700">
                    Maximum available stock ({effectiveStock}) in cart.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <button
                  type="button"
                  data-testid="pdp-add-to-cart"
                  onClick={handleAddToCart}
                  className="w-full h-12 sm:h-14 rounded-xl text-base font-bold bg-[#1e7e34] hover:bg-[#166527] active:scale-[0.99] text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer select-none"
                >
                  <Plus className="w-5 h-5" />
                  Add to Cart
                </button>
                {minOrderQty > 1 && (
                  <p className="text-[11px] font-medium text-slate-500">
                    Minimum order quantity: {minOrderQty} {product.unit}
                  </p>
                )}
              </div>
            )}

            {(stockAlert || cartError) && (
              <div
                role="alert"
                className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800 flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>{stockAlert || cartError}</span>
              </div>
            )}

            {/* Compare Specs link */}
            <div className="flex items-center justify-between pt-0.5 text-xs">
              <button
                type="button"
                onClick={handleCompareClick}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold transition-colors cursor-pointer ${inCompare
                    ? 'border-brand-blue-500 bg-brand-blue-50 text-brand-blue-900'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
              >
                <Scale className="w-3.5 h-3.5" />
                {inCompare ? 'In Comparison' : 'Compare Specs'}
              </button>
              {compareAlert && <span className="text-emerald-700 font-bold">{compareAlert}</span>}
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
    </div>
  );
};
