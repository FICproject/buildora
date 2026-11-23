import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Eye,
  Info,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useVendorProductStore } from '../../store/useVendorProductStore';
import { Card, CardHeader, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { BulkPricingTier, VendorProduct } from '@buildora/types';

export const VendorBulkPricingPage: React.FC = () => {
  const { products, fetchProducts, saveBulkPricing, isLoading } = useVendorProductStore();

  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [tiers, setTiers] = useState<BulkPricingTier[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showCustomerPreview, setShowCustomerPreview] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
  }, [products]);

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  useEffect(() => {
    if (selectedProduct) {
      setTiers(
        selectedProduct.bulkPricing && selectedProduct.bulkPricing.length > 0
          ? [...selectedProduct.bulkPricing]
          : [
              { minQuantity: 10, discountPercentage: 5, unitPrice: Math.round(selectedProduct.price * 0.95) },
              { minQuantity: 50, discountPercentage: 8, unitPrice: Math.round(selectedProduct.price * 0.92) },
            ]
      );
      setValidationError(null);
      setSuccessMessage(null);
    }
  }, [selectedProductId]);

  const handleTierChange = (index: number, field: 'minQuantity' | 'discountPercentage', value: number) => {
    if (!selectedProduct) return;
    const newTiers = [...tiers];
    newTiers[index] = {
      ...newTiers[index],
      [field]: value,
    };

    // Auto-calculate unitPrice if discount changed
    if (field === 'discountPercentage') {
      const discountRatio = Math.max(0, Math.min(50, value)) / 100;
      newTiers[index].unitPrice = Math.round(selectedProduct.price * (1 - discountRatio));
    }

    setTiers(newTiers);
    setValidationError(null);
  };

  const addTier = () => {
    if (!selectedProduct) return;
    const lastTier = tiers[tiers.length - 1];
    const newMin = lastTier ? lastTier.minQuantity * 2 : 10;
    const newDiscount = lastTier ? Math.min(30, lastTier.discountPercentage + 3) : 5;
    const unitPrice = Math.round(selectedProduct.price * (1 - newDiscount / 100));

    setTiers([
      ...tiers,
      { minQuantity: newMin, discountPercentage: newDiscount, unitPrice },
    ]);
  };

  const removeTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index));
    setValidationError(null);
  };

  const validateTiers = (): boolean => {
    if (tiers.length === 0) {
      setValidationError('At least one bulk pricing tier is required.');
      return false;
    }

    for (let i = 0; i < tiers.length; i++) {
      const t = tiers[i];
      if (t.minQuantity < 2) {
        setValidationError(`Tier ${i + 1}: Minimum quantity must be at least 2 units.`);
        return false;
      }
      if (t.discountPercentage <= 0 || t.discountPercentage > 50) {
        setValidationError(`Tier ${i + 1}: Discount must be between 1% and 50%.`);
        return false;
      }
      if (i > 0 && t.minQuantity <= tiers[i - 1].minQuantity) {
        setValidationError(
          `Tier ${i + 1}: Minimum quantity (${t.minQuantity}) must be greater than previous tier (${tiers[i - 1].minQuantity}).`
        );
        return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateTiers() || !selectedProduct) return;
    const success = await saveBulkPricing(selectedProduct.id, tiers);
    if (success) {
      setSuccessMessage('Bulk pricing tiers successfully saved and synced to the Customer Website!');
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Bulk Pricing & Contractor Discounts
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure quantity discount tiers displayed in the HomeRun-style bulk price popup on the Customer Website.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCustomerPreview(true)}
            leftIcon={<Eye className="w-4 h-4" />}
          >
            Live Customer Preview
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            isLoading={isLoading}
            leftIcon={<CheckCircle className="w-4 h-4" />}
          >
            Save & Publish Tiers
          </Button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            &times;
          </button>
        </div>
      )}

      {validationError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Product Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-full sm:w-1/3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Product to Configure:
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>

            {selectedProduct && (
              <div className="flex-1 flex flex-wrap items-center gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-slate-200 sm:pl-6 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Base Selling Price</span>
                  <span className="text-base font-bold text-slate-900">
                    ₹{selectedProduct.price.toLocaleString('en-IN')}
                  </span>
                  <span className="text-slate-400 text-[11px] ml-1">/ {selectedProduct.unit}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Category</span>
                  <span className="font-semibold text-slate-700">{selectedProduct.category}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Active Stock</span>
                  <span className="font-semibold text-slate-700">
                    {selectedProduct.stockCount || selectedProduct.stock || 0} units
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Contractor Interest</span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                    <Sparkles className="w-3 h-3" /> High Volume
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Tiers Editor & Live Preview Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tier Configuration Form (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card>
            <CardHeader
              title="Quantity Tier Rules"
              subtitle="Define volume discounts for registered building contractors and bulk job sites."
              action={
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={addTier}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add Tier
                </Button>
              }
            />
            <CardContent className="space-y-4">
              {tiers.map((tier, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 relative space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Tier #{idx + 1}
                    </span>
                    {tiers.length > 1 && (
                      <button
                        onClick={() => removeTier(idx)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        title="Delete Tier"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Min Quantity (Units)
                      </label>
                      <input
                        type="number"
                        min="2"
                        value={tier.minQuantity}
                        onChange={(e) =>
                          handleTierChange(idx, 'minQuantity', parseInt(e.target.value) || 0)
                        }
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Discount (% OFF)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={tier.discountPercentage}
                        onChange={(e) =>
                          handleTierChange(idx, 'discountPercentage', parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Bulk Unit Price (₹)
                      </label>
                      <input
                        type="number"
                        disabled
                        value={tier.unitPrice}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-100 font-bold text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <span>
                      Orders of <strong>{tier.minQuantity}+ units</strong> get{' '}
                      <strong>{tier.discountPercentage}% OFF</strong>
                    </span>
                    <span className="font-semibold text-emerald-700">
                      Savings: ₹
                      {selectedProduct
                        ? (selectedProduct.price - tier.unitPrice).toLocaleString('en-IN')
                        : 0}
                      /unit
                    </span>
                  </div>
                </div>
              ))}

              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  On the BUILDORA 60 customer website, when a contractor adds quantity exceeding any
                  tier threshold, the bulk discount is automatically applied to their cart.
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customer Modal Live Preview (5 Cols) */}
        <div className="lg:col-span-5">
          <Card className="sticky top-20 border-blue-200 shadow-md">
            <CardHeader
              title="Customer Website Popup Preview"
              subtitle="Exact replica of the HomeRun reference modal seen by buyers"
              action={<Badge variant="brand">HomeRun Parity</Badge>}
            />
            <CardContent>
              {/* Mock HomeRun Bulk Prices Modal */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Bulk Prices</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{selectedProduct?.name}</p>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    &times;
                  </div>
                </div>

                <div className="space-y-2.5">
                  {tiers.map((tier, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {tier.minQuantity}+ Units
                        </div>
                        <div className="text-[11px] font-semibold text-emerald-600">
                          {tier.discountPercentage}% OFF
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-extrabold text-slate-900">
                          ₹{tier.unitPrice.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-slate-400">per unit</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 text-[11px] text-slate-400 text-center">
                  Applicable across all Bengaluru job site orders with 60-min delivery.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Customer Modal Full Dialog Preview */}
      {showCustomerPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Bulk Prices</h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedProduct?.name}</p>
              </div>
              <button
                onClick={() => setShowCustomerPreview(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              {tiers.map((tier, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {tier.minQuantity}+ Units
                    </div>
                    <div className="text-xs font-semibold text-emerald-600 mt-0.5">
                      {tier.discountPercentage}% OFF
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-extrabold text-slate-900">
                      ₹{tier.unitPrice.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] text-slate-400">per {selectedProduct?.unit}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowCustomerPreview(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
