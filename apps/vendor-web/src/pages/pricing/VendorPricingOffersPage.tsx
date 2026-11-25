import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Tag, Package, Plus, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { useVendorProductStore } from '../../store/useVendorProductStore';
import { vendorApi } from '../../services/vendorApi';
import { BulkPricingTier, VendorPromotion } from '@buildora/types';
import {
  PageHeader,
  Card,
  CardHeader,
  CardContent,
  Button,
  Badge,
  Modal,
  EmptyState,
} from '../../components/common';
import { toast } from '../../store/useToastStore';

type PricingTab = 'PRICING' | 'BULK_TIERS' | 'PROMOTIONS';

export const VendorPricingOffersPage: React.FC<{ initialTab?: PricingTab }> = ({
  initialTab = 'BULK_TIERS',
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<PricingTab>(initialTab);
  const { products, fetchProducts, saveBulkPricing, isLoading } = useVendorProductStore();

  // Bulk Pricing State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [tiers, setTiers] = useState<BulkPricingTier[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Promotions State
  const [promotions, setPromotions] = useState<VendorPromotion[]>([]);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FLAT'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('10');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().slice(0, 10)
  );
  const [bannerText, setBannerText] = useState('SPECIAL OFFER - 10% OFF');
  const [creatingPromo, setCreatingPromo] = useState(false);

  const loadPromotions = async () => {
    try {
      const data = await vendorApi.getPromotions();
      setPromotions(data || []);
    } catch {}
  };

  useEffect(() => {
    fetchProducts();
    loadPromotions();
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
              {
                minQuantity: 10,
                discountPercentage: 5,
                unitPrice: Math.round(selectedProduct.price * 0.95),
              },
              {
                minQuantity: 50,
                discountPercentage: 8,
                unitPrice: Math.round(selectedProduct.price * 0.92),
              },
            ]
      );
      setValidationError(null);
    }
  }, [selectedProductId]);

  const handleTierChange = (
    index: number,
    field: 'minQuantity' | 'discountPercentage',
    value: number
  ) => {
    if (!selectedProduct) return;
    const newTiers = [...tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    if (field === 'discountPercentage') {
      const ratio = Math.max(0, Math.min(50, value)) / 100;
      newTiers[index].unitPrice = Math.round(selectedProduct.price * (1 - ratio));
    }
    setTiers(newTiers);
    setValidationError(null);
  };

  const addTier = () => {
    if (!selectedProduct) return;
    const last = tiers[tiers.length - 1];
    const newMin = last ? last.minQuantity * 2 : 10;
    const newDisc = last ? Math.min(30, last.discountPercentage + 3) : 5;
    setTiers([
      ...tiers,
      {
        minQuantity: newMin,
        discountPercentage: newDisc,
        unitPrice: Math.round(selectedProduct.price * (1 - newDisc / 100)),
      },
    ]);
  };

  const removeTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index));
    setValidationError(null);
  };

  const handleSaveTiers = async () => {
    if (!selectedProduct) return;
    if (tiers.length === 0) {
      setValidationError('At least one bulk pricing tier is required.');
      return;
    }
    for (let i = 0; i < tiers.length; i++) {
      const t = tiers[i];
      if (t.minQuantity < 2) {
        setValidationError(`Tier ${i + 1}: Minimum quantity must be at least 2.`);
        return;
      }
      if (t.discountPercentage <= 0 || t.discountPercentage > 50) {
        setValidationError(`Tier ${i + 1}: Discount must be between 1% and 50%.`);
        return;
      }
      if (i > 0 && t.minQuantity <= tiers[i - 1].minQuantity) {
        setValidationError(`Tier ${i + 1}: Quantity must be greater than previous tier.`);
        return;
      }
    }
    const ok = await saveBulkPricing(selectedProduct.id, tiers);
    if (ok) {
      toast.success('Bulk pricing tiers saved successfully.');
    }
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !discountValue || creatingPromo) return;
    setCreatingPromo(true);
    try {
      await vendorApi.createPromotion({
        title: title.trim(),
        description: description.trim(),
        discountType,
        discountValue: Number(discountValue),
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        bannerText,
        applicableProductIds: selectedProduct ? [selectedProduct.id] : [],
      });
      toast.success('Promotional offer created.');
      setIsPromoModalOpen(false);
      setTitle('');
      setDescription('');
      loadPromotions();
    } finally {
      setCreatingPromo(false);
    }
  };

  const handleTogglePromo = async (id: string, currentStatus: string) => {
    const next = currentStatus === 'ACTIVE' ? 'SCHEDULED' : 'ACTIVE';
    await vendorApi.updatePromotionStatus(id, next);
    toast.success(`Offer ${next === 'ACTIVE' ? 'activated' : 'paused'}.`);
    loadPromotions();
  };

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Pricing & Offers"
        description="Manage product pricing, bulk quantity tiers, and promotional discount campaigns."
        actions={
          activeTab === 'BULK_TIERS' ? (
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveTiers}
              isLoading={isLoading}
              leftIcon={<CheckCircle className="w-4 h-4" />}
            >
              Save Bulk Tiers
            </Button>
          ) : activeTab === 'PROMOTIONS' ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsPromoModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create Offer
            </Button>
          ) : null
        }
      />

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E7E5E4] pb-2">
        {[
          { id: 'BULK_TIERS', label: 'Bulk Pricing Tiers', icon: Layers },
          { id: 'PROMOTIONS', label: 'Discounts & Promotional Offers', icon: Tag },
          { id: 'PRICING', label: 'Product & Variant Pricing', icon: Package },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as PricingTab)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#943D24] text-white'
                  : 'text-[#78716C] hover:text-[#292524] hover:bg-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Bulk Pricing */}
      {activeTab === 'BULK_TIERS' && (
        <div className="space-y-5">
          {validationError && (
            <div className="p-3.5 rounded-xl bg-[#DC4545]/10 border border-[#DC4545]/20 text-[#DC4545] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="portal-label">Select Product</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="portal-input"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                </div>
                {selectedProduct && (
                  <div className="flex flex-wrap gap-6 text-xs md:pl-4 md:border-l border-[#E7E5E4]">
                    <div>
                      <span className="text-[#78716C] block">Base Price</span>
                      <span className="text-base font-bold text-[#292524]">
                        ₹{selectedProduct.price.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#78716C] block">MRP</span>
                      <span className="text-base font-semibold text-[#78716C]">
                        ₹{selectedProduct.mrp.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#78716C] block">Unit</span>
                      <span className="text-sm font-medium text-[#292524]">
                        {selectedProduct.unit}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="Quantity Discount Tiers"
              subtitle="Set volume discounts for contractors and bulk orders."
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
            <CardContent className="space-y-3">
              {tiers.map((tier, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-[#E7E5E4] bg-[#F8F7F5] grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
                >
                  <div>
                    <label className="portal-label">Min Quantity</label>
                    <input
                      type="number"
                      min="2"
                      value={tier.minQuantity}
                      onChange={(e) =>
                        handleTierChange(idx, 'minQuantity', parseInt(e.target.value, 10) || 0)
                      }
                      className="portal-input"
                    />
                  </div>
                  <div>
                    <label className="portal-label">Discount (%)</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={tier.discountPercentage}
                      onChange={(e) =>
                        handleTierChange(
                          idx,
                          'discountPercentage',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="portal-input"
                    />
                  </div>
                  <div>
                    <label className="portal-label">Effective Unit Price (₹)</label>
                    <input
                      type="number"
                      disabled
                      value={tier.unitPrice}
                      className="portal-input font-semibold"
                    />
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-2 pb-1">
                    {tiers.length > 1 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeTier(idx)}
                        leftIcon={<Trash2 className="w-3.5 h-3.5 text-[#DC4545]" />}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 2: Promotional Offers */}
      {activeTab === 'PROMOTIONS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {promotions.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl border border-[#E7E5E4]">
              <EmptyState
                icon={<Tag className="w-5 h-5" />}
                title="No active offers"
                description="Create a promotional discount with effective dates."
                action={
                  <Button size="sm" variant="primary" onClick={() => setIsPromoModalOpen(true)}>
                    Create Offer
                  </Button>
                }
              />
            </div>
          ) : (
            promotions.map((p) => (
              <Card key={p.id}>
                <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant={p.status === 'ACTIVE' ? 'success' : 'brand'} size="sm">
                        {p.status}
                      </Badge>
                      <span className="text-sm font-bold text-[#943D24]">
                        {p.discountType === 'PERCENTAGE'
                          ? `${p.discountValue}% OFF`
                          : `₹${p.discountValue} OFF`}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-[#292524] mt-3">{p.title}</h3>
                    <p className="text-xs text-[#78716C] mt-1 line-clamp-2">{p.description}</p>
                    <div className="mt-3 pt-3 border-t border-[#E7E5E4] text-xs text-[#78716C] space-y-1">
                      <div className="flex justify-between">
                        <span>Effective Dates:</span>
                        <span className="text-[#292524] font-medium">
                          {new Date(p.startDate).toLocaleDateString('en-IN')} –{' '}
                          {new Date(p.endDate).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Orders Used:</span>
                        <span className="text-[#292524] font-medium">{p.usageCount || 0}</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[#E7E5E4] flex justify-end">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleTogglePromo(p.id, p.status)}
                    >
                      {p.status === 'ACTIVE' ? 'Pause Offer' : 'Activate Offer'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Product & Variant Pricing */}
      {activeTab === 'PRICING' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F7F5] text-[#78716C] font-semibold border-b border-[#E7E5E4]">
                <tr>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4 text-right">MRP</th>
                  <th className="py-3 px-4 text-right">Selling Price</th>
                  <th className="py-3 px-4 text-right">Variants</th>
                  <th className="py-3 px-4 text-right">Bulk Tiers</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E5E4]">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F8F7F5]">
                    <td className="py-3.5 px-4 font-medium text-[#292524]">{p.name}</td>
                    <td className="py-3.5 px-4 font-mono text-[#78716C]">{p.sku}</td>
                    <td className="py-3.5 px-4 text-right text-[#78716C]">
                      ₹{(p.mrp || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-[#292524]">
                      ₹{(p.price || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right text-[#78716C]">
                      {p.variants?.length || 0}
                    </td>
                    <td className="py-3.5 px-4 text-right text-[#78716C]">
                      {p.bulkPricing?.length || 0}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => navigate(`/products?search=${encodeURIComponent(p.sku)}`)}
                      >
                        Edit Price
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create Offer Modal */}
      <Modal
        isOpen={isPromoModalOpen}
        onClose={() => setIsPromoModalOpen(false)}
        title="Create Promotional Offer"
        subtitle="Set discount rules and effective dates."
        maxWidth="md"
      >
        <form onSubmit={handleCreatePromo} className="space-y-4">
          <div>
            <label className="portal-label">Offer Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Monsoon Cement Discount"
              className="portal-input"
            />
          </div>
          <div>
            <label className="portal-label">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="portal-input"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="portal-label">Discount Type *</label>
              <select
                value={discountType}
                onChange={(e: any) => setDiscountType(e.target.value)}
                className="portal-input"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FLAT">Flat Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="portal-label">Value *</label>
              <input
                type="number"
                required
                min={1}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="portal-input"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="portal-label">Start Date *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="portal-input"
              />
            </div>
            <div>
              <label className="portal-label">End Date *</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="portal-input"
              />
            </div>
          </div>
          <div>
            <label className="portal-label">Offer Tagline</label>
            <input
              type="text"
              value={bannerText}
              onChange={(e) => setBannerText(e.target.value)}
              className="portal-input"
            />
          </div>
          <div className="pt-2 flex justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPromoModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={creatingPromo}>
              Publish Offer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default VendorPricingOffersPage;
