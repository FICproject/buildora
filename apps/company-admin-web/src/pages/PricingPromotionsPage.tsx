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
  const [couponForm, setCouponForm] = useState({
    code: '',
    type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    value: 10,
    minOrderValue: 2500,
    maxDiscount: 1500,
    description: '',
  });

  const loadData = async () => {
    const res = await adminApi.getPricingPromotions();
    setData(res);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.createCoupon(couponForm);
      pushToast({ title: 'Coupon Created', message: `${couponForm.code.toUpperCase()} is active on Customer Web checkout.` });
      setCouponModal(false);
      setCouponForm({ code: '', type: 'PERCENTAGE', value: 10, minOrderValue: 2500, maxDiscount: 1500, description: '' });
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
          <Button size="sm" variant="accent" onClick={() => setCouponModal(true)}>
            <Plus className="w-4 h-4" /> Create Storefront Coupon
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Coupons */}
        <Card title="Active Storefront Coupons" subtitle="Live at Customer Website checkout">
          <div className="divide-y divide-[#E5DCD3] text-xs">
            {(data.coupons || []).map((c: any) => (
              <div key={c.code} className="py-3 flex items-center justify-between gap-2">
                <div>
                  <p className="font-mono font-bold text-[#AE887B]">{c.code}</p>
                  <p className="text-[#6E6859]">{c.description}</p>
                </div>
                <div className="text-right">
                  <Badge variant="orange">
                    {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% OFF` : `${formatINR(c.discountValue)} OFF`}
                  </Badge>
                  <p className="text-[11px] text-[#6E6859] mt-0.5">
                    Min {formatINR(c.minOrderValue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Vendor Promotional Campaigns */}
        <Card title="Vendor Promotional Campaigns" subtitle="Approve or pause vendor offers">
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
      <Card title="Bulk Tiered Pricing Matrix" subtitle="SKUs offering contractor volume discounts">
        <div className="divide-y divide-[#E5DCD3] text-xs">
          {(data.productsWithBulkPricing || []).slice(0, 12).map((p: any) => (
            <div key={p.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-[#5E5946]">{p.name}</p>
                <p className="text-[#6E6859]">Base: {formatINR(p.sellingPrice)} / {p.unit}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(p.bulkPricing || []).map((tier: any, idx: number) => (
                  <Badge key={idx} variant="info">
                    {tier.minQuantity || tier.minQty}+ units: {formatINR(tier.unitPrice || tier.pricePerUnit)}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal open={couponModal} onClose={() => setCouponModal(false)} title="Create Storefront Coupon">
        <form onSubmit={handleCreateCoupon} className="space-y-3 text-xs">
          <input
            required
            placeholder="Coupon Code (e.g. STEEL500)"
            value={couponForm.code}
            onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg uppercase font-mono"
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
              placeholder="Value"
              value={couponForm.value}
              onChange={(e) => setCouponForm({ ...couponForm, value: Number(e.target.value) })}
              className="px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
            />
          </div>
          <input
            required
            placeholder="Description"
            value={couponForm.description}
            onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setCouponModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Publish Coupon</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
