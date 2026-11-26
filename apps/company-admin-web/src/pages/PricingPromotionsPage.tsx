import React, { useEffect, useState } from 'react';
import { Tags, Plus, Percent, Layers } from 'lucide-react';
import { adminApi, formatINR } from '../services/adminApi';
import { PageHeader, Card, Badge, Button, Modal, statusBadgeVariant, useToastStore } from '../components/ui';

export const PricingPromotionsPage: React.FC = () => {
  const pushToast = useToastStore((s) => s.push);
  const [data, setData] = useState<any>({
    productsWithBulkPricing: [],
    discountedProducts: [],
    coupons: [],
    vendorPromotions: [],
  });
  const [couponModal, setCouponModal] = useState(false);
  const [editingCouponCode, setEditingCouponCode] = useState<string | null>(null);
  const [couponForm, setCouponForm] = useState({
    code: '',
    type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    value: 10,
    minOrderValue: 2500,
    maxDiscount: 1500,
    description: '',
    isActive: true,
  });
  const [promoModal, setPromoModal] = useState(false);
  const [promoForm, setPromoForm] = useState({
    title: '',
    description: '',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FLAT',
    discountValue: 10,
    bannerText: '',
    startDate: '',
    endDate: '',
  });
  const [bulkModal, setBulkModal] = useState<any>(null);
  const [bulkTiers, setBulkTiers] = useState<Array<{ minQty: number; pricePerUnit: number }>>([]);

  const loadData = async () => {
    const res = await adminApi.getPricingPromotions();
    setData(res);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCouponCode) {
        await adminApi.updateCoupon(editingCouponCode, couponForm);
        pushToast({ title: 'Coupon Updated', message: `${editingCouponCode} saved.` });
      } else {
        await adminApi.createCoupon(couponForm);
        pushToast({ title: 'Coupon Created', message: `${couponForm.code.toUpperCase()} is active on Customer Web checkout.` });
      }
      setCouponModal(false);
      setEditingCouponCode(null);
      setCouponForm({ code: '', type: 'PERCENTAGE', value: 10, minOrderValue: 2500, maxDiscount: 1500, description: '', isActive: true });
      loadData();
    } catch (err: any) {
      pushToast({ title: 'Failed', message: err.message, variant: 'error' });
    }
  };

  const handleCreatePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.createPromotion(promoForm);
      pushToast({ title: 'Campaign Published', message: `${promoForm.title} is live.` });
      setPromoModal(false);
      setPromoForm({ title: '', description: '', discountType: 'PERCENTAGE', discountValue: 10, bannerText: '', startDate: '', endDate: '' });
      loadData();
    } catch (err: any) {
      pushToast({ title: 'Failed', message: err.message, variant: 'error' });
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pricing, Bulk Tiers & Promotions"
        description="Manage storefront coupon codes, bulk volume pricing ladders & vendor promotional campaigns."
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setPromoModal(true)}>
              <Percent className="w-4 h-4" /> Create Campaign
            </Button>
            <Button
              size="sm"
              variant="accent"
              onClick={() => {
                setEditingCouponCode(null);
                setCouponForm({ code: '', type: 'PERCENTAGE', value: 10, minOrderValue: 2500, maxDiscount: 1500, description: '', isActive: true });
                setCouponModal(true);
              }}
            >
              <Plus className="w-4 h-4" /> Create Storefront Coupon
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Coupons */}
        <Card title="Storefront Coupons" subtitle="Live at Customer Website checkout">
          <div className="divide-y divide-[#E5DCD3] text-xs">
            {(data.coupons || []).map((c: any) => (
              <div key={c.code} className="py-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-bold text-[#AE887B]">{c.code}</p>
                    <Badge variant={c.isActive !== false ? 'success' : 'error'}>
                      {c.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                    </Badge>
                  </div>
                  <p className="text-[#6E6859]">{c.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right mr-1">
                    <Badge variant="orange">
                      {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% OFF` : `${formatINR(c.discountValue)} OFF`}
                    </Badge>
                    <p className="text-[11px] text-[#6E6859] mt-0.5">
                      Min {formatINR(c.minOrderValue)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingCouponCode(c.code);
                      setCouponForm({
                        code: c.code,
                        type: c.discountType || 'PERCENTAGE',
                        value: c.discountValue || 10,
                        minOrderValue: c.minOrderValue || 0,
                        maxDiscount: c.maxDiscount || 0,
                        description: c.description || '',
                        isActive: c.isActive !== false,
                      });
                      setCouponModal(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await adminApi.updateCoupon(c.code, { isActive: !(c.isActive !== false) });
                      pushToast({ title: `Coupon ${c.isActive !== false ? 'Disabled' : 'Activated'}` });
                      loadData();
                    }}
                  >
                    {c.isActive !== false ? 'Disable' : 'Enable'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await adminApi.deleteCoupon(c.code);
                      pushToast({ title: 'Coupon Deleted' });
                      loadData();
                    }}
                  >
                    Del
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Vendor Promotional Campaigns */}
        <Card title="Platform & Vendor Campaigns" subtitle="Approve or pause active promotional offers">
          <div className="divide-y divide-[#E5DCD3] text-xs">
            {(data.vendorPromotions || []).map((vp: any) => (
              <div key={vp.id} className="py-3 flex items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-[#5E5946]">{vp.title}</p>
                  <p className="text-[#6E6859]">{vp.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={statusBadgeVariant(vp.status)}>{vp.status}</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      const next = vp.status === 'ACTIVE' ? 'EXPIRED' : 'ACTIVE';
                      await adminApi.updatePromotionStatus(vp.id, next);
                      pushToast({ title: `Campaign marked ${next}` });
                      loadData();
                    }}
                  >
                    {vp.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bulk Pricing Catalog Overview */}
      <Card title="Bulk Tiered Pricing Matrix" subtitle="Edit contractor volume discount ladders per SKU">
        <div className="divide-y divide-[#E5DCD3] text-xs">
          {(data.productsWithBulkPricing || []).slice(0, 15).map((p: any) => (
            <div key={p.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-[#5E5946]">{p.name}</p>
                <p className="text-[#6E6859]">Base: {formatINR(p.sellingPrice || p.price)} / {p.unit}</p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {(p.bulkPricing || []).map((tier: any, idx: number) => (
                  <Badge key={idx} variant="info">
                    {tier.minQuantity || tier.minQty}+ units: {formatINR(tier.unitPrice || tier.pricePerUnit)}
                  </Badge>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setBulkModal(p);
                    setBulkTiers(
                      (p.bulkPricing || []).map((t: any) => ({
                        minQty: Number(t.minQty ?? t.minQuantity ?? 10),
                        pricePerUnit: Number(t.pricePerUnit ?? t.unitPrice ?? p.sellingPrice ?? p.price ?? 0),
                      }))
                    );
                  }}
                >
                  <Layers className="w-3.5 h-3.5" /> Edit Tiers
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal
        open={couponModal}
        onClose={() => {
          setCouponModal(false);
          setEditingCouponCode(null);
        }}
        title={editingCouponCode ? `Edit Coupon — ${editingCouponCode}` : 'Create Storefront Coupon'}
      >
        <form onSubmit={handleSaveCoupon} className="space-y-3 text-xs">
          <input
            required
            disabled={Boolean(editingCouponCode)}
            placeholder="Coupon Code (e.g. STEEL500)"
            value={couponForm.code}
            onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg uppercase font-mono disabled:bg-[#FAF7F4]"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={couponForm.type}
              onChange={(e) => setCouponForm({ ...couponForm, type: e.target.value as any })}
              className="px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
            >
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FIXED">Flat (₹)</option>
            </select>
            <input
              type="number"
              required
              placeholder="Discount Value"
              value={couponForm.value}
              onChange={(e) => setCouponForm({ ...couponForm, value: Number(e.target.value) })}
              className="px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-[#6E6859] mb-0.5">Min Order Value (₹)</label>
              <input
                type="number"
                value={couponForm.minOrderValue}
                onChange={(e) => setCouponForm({ ...couponForm, minOrderValue: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#6E6859] mb-0.5">Max Discount Cap (₹)</label>
              <input
                type="number"
                value={couponForm.maxDiscount}
                onChange={(e) => setCouponForm({ ...couponForm, maxDiscount: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
              />
            </div>
          </div>
          <input
            required
            placeholder="Description"
            value={couponForm.description}
            onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={couponForm.isActive}
              onChange={(e) => setCouponForm({ ...couponForm, isActive: e.target.checked })}
            />
            <span>Active on Customer Checkout</span>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setCouponModal(false)}>
              Cancel
            </Button>
            <Button type="submit">{editingCouponCode ? 'Save Changes' : 'Publish Coupon'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={promoModal} onClose={() => setPromoModal(false)} title="Create Platform Promotional Campaign">
        <form onSubmit={handleCreatePromotion} className="space-y-3 text-xs">
          <input
            required
            placeholder="Campaign Title (e.g. Monsoon Waterproofing Sale)"
            value={promoForm.title}
            onChange={(e) => setPromoForm({ ...promoForm, title: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
          />
          <input
            required
            placeholder="Description"
            value={promoForm.description}
            onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={promoForm.discountType}
              onChange={(e) => setPromoForm({ ...promoForm, discountType: e.target.value as any })}
              className="px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
            >
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FLAT">Flat Discount (₹)</option>
            </select>
            <input
              type="number"
              required
              placeholder="Discount Value"
              value={promoForm.discountValue}
              onChange={(e) => setPromoForm({ ...promoForm, discountValue: Number(e.target.value) })}
              className="px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={promoForm.startDate}
              onChange={(e) => setPromoForm({ ...promoForm, startDate: e.target.value })}
              className="px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
            />
            <input
              type="date"
              value={promoForm.endDate}
              onChange={(e) => setPromoForm({ ...promoForm, endDate: e.target.value })}
              className="px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setPromoModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Publish Campaign</Button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(bulkModal)} onClose={() => setBulkModal(null)} title={`Edit Bulk Pricing Tiers — ${bulkModal?.name || ''}`}>
        {bulkModal && (
          <div className="space-y-3 text-xs">
            {bulkTiers.map((t, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <input
                  type="number"
                  min={2}
                  value={t.minQty}
                  onChange={(e) => {
                    const next = [...bulkTiers];
                    next[idx].minQty = Number(e.target.value);
                    setBulkTiers(next);
                  }}
                  placeholder="Min Qty"
                  className="col-span-5 px-2.5 py-1.5 border border-[#E5DCD3] rounded-lg"
                />
                <input
                  type="number"
                  min={1}
                  value={t.pricePerUnit}
                  onChange={(e) => {
                    const next = [...bulkTiers];
                    next[idx].pricePerUnit = Number(e.target.value);
                    setBulkTiers(next);
                  }}
                  placeholder="Unit Price (₹)"
                  className="col-span-5 px-2.5 py-1.5 border border-[#E5DCD3] rounded-lg"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="col-span-2"
                  onClick={() => setBulkTiers(bulkTiers.filter((_, i) => i !== idx))}
                >
                  Del
                </Button>
              </div>
            ))}
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setBulkTiers([
                  ...bulkTiers,
                  { minQty: (bulkTiers[bulkTiers.length - 1]?.minQty || 10) + 15, pricePerUnit: Number(bulkModal.sellingPrice || bulkModal.price || 100) },
                ])
              }
            >
              <Plus className="w-3.5 h-3.5" /> Add Tier
            </Button>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setBulkModal(null)}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  await adminApi.updateProductBulkPricing(bulkModal.id, bulkTiers);
                  pushToast({ title: 'Bulk Tiers Saved', message: 'Customer Web and Vendor catalog updated.' });
                  setBulkModal(null);
                  loadData();
                }}
              >
                Save Tiers
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
