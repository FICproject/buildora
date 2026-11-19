import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  Share2,
  Zap,
  Truck,
  ShieldCheck,
  Building2,
  Clock,
  CheckCircle2,
  ChevronRight,
  Plus,
  Scale,
  FolderPlus,
  ArrowRight,
  Info,
  HelpCircle,
  RotateCcw,
  Package,
  Layers,
  ChevronDown
} from 'lucide-react';
import { SEED_PRODUCTS, MASTER_CATEGORIES } from '@buildora/constants';
import { api } from '../services/api';
import { formatCurrency, calculateBulkDiscount } from '@buildora/utils';
import { useCartStore } from '../store/useCartStore';
import { useWishlistStore } from '../store/useWishlistStore';
import { useCompareStore } from '../store/useCompareStore';
import { useProjectStore } from '../store/useProjectStore';
import { useLocationStore } from '../store/useLocationStore';
import { RatingStars } from '../components/ui/RatingStars';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { QuantityControl } from '../components/ui/QuantityControl';
import { ProductCard } from '../components/common/ProductCard';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const initialProduct = SEED_PRODUCTS.find((p) => p.slug === slug) || SEED_PRODUCTS[0];
  const [product, setProduct] = useState(initialProduct);

  const { addItem } = useCartStore();
  const { isInWishlist, toggleItem } = useWishlistStore();
  const { isInCompare, addItem: addToCompare } = useCompareStore();
  const { projects, addMaterialToProject } = useProjectStore();
  const { pincode, cityName, etaMinutes } = useLocationStore();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(initialProduct.variants?.[0]);
  const [activeTab, setActiveTab] = useState<'specs' | 'applications' | 'faq' | 'reviews'>('specs');
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

  // Price calculations with variant and bulk tiers
  const basePrice = selectedVariant ? selectedVariant.price : product.price;
  const baseMrp = selectedVariant ? selectedVariant.mrp : product.mrp;
  const bulkDiscount = calculateBulkDiscount(quantity, product.bulkPricing);
  const effectiveUnitPrice = Math.round(basePrice * (1 - bulkDiscount / 100));
  const lineTotal = effectiveUnitPrice * quantity;

  // Companion product for frequently bought together
  const companionProduct = SEED_PRODUCTS.find((p) => p.id !== product.id && p.inStock) || SEED_PRODUCTS[1];
  const bundleTotal = effectiveUnitPrice + companionProduct.price;

  // Related products from same category
  const relatedProducts = SEED_PRODUCTS.filter(
    (p) => p.categorySlug === product.categorySlug && p.id !== product.id
  ).slice(0, 4);

  const handleAddToCart = () => {
    addItem(product, quantity, selectedVariant);
  };

  const handleBuyNow = () => {
    addItem(product, quantity, selectedVariant);
    navigate('/checkout');
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

  const productFaqs = [
    {
      q: `What is the delivery timeline for ${product.brand} materials to my site?`,
      a: `Orders placed in active serviceable zones (e.g., Bengaluru 560038) are dispatched from the nearest Buildora dark store within 60 to 90 minutes using dedicated hydraulic and mini-truck vehicles.`
    },
    {
      q: 'Will I receive a GST Input Tax Credit (ITC) commercial invoice?',
      a: 'Yes. Enter your company GSTIN during checkout or save it in your account profile. A valid B2B tax invoice with HSN code and GST break-up will be issued automatically.'
    },
    {
      q: 'Can I return damaged or excess bags/units at the time of delivery?',
      a: 'Yes. Our delivery partner will conduct an on-site physical inspection before unloading. In the rare event of transit damage or wrong dispatch, you can request an instant return or replacement directly.'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 pb-24 lg:pb-8">
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
          <div className="relative aspect-square rounded-3xl bg-white border border-slate-200/80 overflow-hidden shadow-card">
            <img
              src={product.images[activeImageIndex]}
              alt={product.name}
              className={`w-full h-full object-cover transition-transform duration-300 ${
                isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
              }`}
              onClick={() => setIsZoomed(!isZoomed)}
            />
            {product.discount > 0 && (
              <div className="absolute top-3.5 left-3.5">
                <Badge variant="orange" size="md">
                  {product.discount}% OFF
                </Badge>
              </div>
            )}
            <button
              type="button"
              onClick={() => toggleItem(product)}
              className={`absolute top-3.5 right-3.5 p-2 rounded-full shadow-md transition-colors ${
                isWishlisted
                  ? 'bg-rose-50 text-rose-600'
                  : 'bg-white text-slate-400 hover:text-rose-500'
              }`}
              title="Save to wishlist"
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {product.images.map((img: string, idx: number) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl border-2 overflow-hidden bg-white flex-shrink-0 ${
                    activeImageIndex === idx ? 'border-brand-blue-600 shadow-sm' : 'border-slate-200'
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
                {formatCurrency(effectiveUnitPrice)}
              </span>
              {baseMrp > basePrice && (
                <span className="text-xs sm:text-sm text-slate-400 line-through">
                  MRP {formatCurrency(baseMrp)}
                </span>
              )}
              {product.discount > 0 && (
                <span className="text-xs font-bold text-brand-orange-600">
                  Save {formatCurrency(baseMrp - effectiveUnitPrice)}
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500">
              Unit: <strong className="text-slate-800">{product.unit}</strong> &bull; Price includes {product.gstRate}% GST
            </div>

            {bulkDiscount > 0 && (
              <div className="mt-2 p-2 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 border border-emerald-200">
                <Zap className="w-3.5 h-3.5 fill-current text-emerald-600" />
                <span>Bulk Tier Unlocked: {bulkDiscount}% discount applied!</span>
              </div>
            )}
          </div>

          {/* Bulk Pricing Tiers Table */}
          {product.bulkPricing && product.bulkPricing.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-brand-blue-700" />
                Quantity-Based Contractor Pricing
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                {product.bulkPricing.map((tier: any, idx: number) => (
                  <div
                    key={idx}
                    onClick={() => setQuantity(tier.minQuantity)}
                    className={`cursor-pointer p-2.5 rounded-xl border transition-all text-center ${
                      quantity >= tier.minQuantity
                        ? 'border-brand-blue-500 bg-brand-blue-50/50 text-brand-blue-900 font-semibold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <div className="font-bold">{tier.minQuantity}+ Units</div>
                    <div className="text-[11px] text-emerald-600 font-semibold">{tier.discountPercentage}% OFF</div>
                    <div className="font-bold text-slate-900 mt-0.5">{formatCurrency(tier.unitPrice)}/unit</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pincode Serviceability & Delivery ETA */}
          <div className="p-3.5 sm:p-4 rounded-2xl border border-slate-200 bg-white space-y-1.5 text-xs shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-brand-orange-500" />
                Delivery to {pincode} ({cityName.split(',')[0]})
              </span>
              <span className="text-brand-blue-800 font-bold hover:underline cursor-pointer">
                Change
              </span>
            </div>
            <div className="flex items-center gap-2 text-emerald-700 font-bold">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Available for 60-Min Site Delivery from Indiranagar WH-BLR-01</span>
            </div>
          </div>

          {/* Quantity & CTA Buttons */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
              <span className="text-xs font-bold text-slate-700">Quantity:</span>
              <QuantityControl
                quantity={quantity}
                onIncrease={() => setQuantity(quantity + 1)}
                onDecrease={() => setQuantity(Math.max(1, quantity - 1))}
                max={product.stockCount}
                size="md"
              />
              <span className="text-xs text-slate-500">
                Subtotal: <strong className="text-slate-900 font-black">{formatCurrency(lineTotal)}</strong>
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="primary"
                size="lg"
                onClick={handleAddToCart}
                className="flex-1 font-black"
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add to Cart ({formatCurrency(lineTotal)})
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={handleBuyNow}
                className="flex-1 font-black"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Buy Now
              </Button>
            </div>

            {/* Compare & Project actions */}
            <div className="flex items-center gap-3 pt-1 text-xs">
              <button
                type="button"
                onClick={handleCompareClick}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold transition-colors ${
                  inCompare
                    ? 'border-brand-blue-500 bg-brand-blue-50 text-brand-blue-900'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                {inCompare ? 'In Comparison' : 'Compare Specs'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Detailed Specifications & FAQs Tabs */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-8 shadow-card space-y-6">
        <div className="flex gap-2 border-b border-slate-200 overflow-x-auto no-scrollbar pb-1 text-xs sm:text-sm font-bold">
          <button
            onClick={() => setActiveTab('specs')}
            className={`pb-3 px-3 transition-colors flex-shrink-0 ${
              activeTab === 'specs'
                ? 'border-b-2 border-brand-blue-900 text-brand-blue-900'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            Engineering Specifications
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`pb-3 px-3 transition-colors flex-shrink-0 ${
              activeTab === 'applications'
                ? 'border-b-2 border-brand-blue-900 text-brand-blue-900'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            Site Applications &amp; Standards
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={`pb-3 px-3 transition-colors flex-shrink-0 ${
              activeTab === 'faq'
                ? 'border-b-2 border-brand-blue-900 text-brand-blue-900'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            Frequently Asked Questions
          </button>
        </div>

        {activeTab === 'specs' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {Object.entries(product.specifications || {}).map(([key, val]) => (
              <div key={key} className="flex justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-medium text-slate-500">{key}</span>
                <span className="font-bold text-slate-900 text-right">{val}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <p>
              Suitable for residential towers, commercial RCC foundations, industrial flooring, and heavy-duty structural concrete pours.
              Manufactured in strict compliance with Bureau of Indian Standards (BIS) specifications.
            </p>
          </div>
        )}

        {activeTab === 'faq' && (
          <div className="space-y-3">
            {productFaqs.map((faq, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="text-xs sm:text-sm font-bold text-slate-900">{faq.q}</div>
                <div className="text-xs text-slate-600 leading-relaxed">{faq.a}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Related Materials in Same Category */}
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* 5. Mobile Sticky Add-to-Cart Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 shadow-2xl flex items-center justify-between gap-3">
        <div>
          <div className="text-xs text-slate-400">Total Price</div>
          <div className="text-base font-black text-slate-900">
            {formatCurrency(lineTotal)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="md"
            onClick={handleAddToCart}
            className="font-black px-4 shadow-md"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add to Cart
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={handleBuyNow}
            className="font-black px-4"
          >
            Buy Now
          </Button>
        </div>
      </div>
    </div>
  );
};
