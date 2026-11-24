import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Calendar,
  Percent,
  IndianRupee,
  CheckCircle2,
  Clock,
  ExternalLink,
  Edit2,
  Trash2,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { vendorApi } from '../../services/vendorApi';
import { VendorPromotion } from '@buildora/types';

export const VendorPromotionsPage: React.FC = () => {
  const [promotions, setPromotions] = useState<VendorPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FLAT'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('10');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().slice(0, 10));
  const [bannerText, setBannerText] = useState('SPECIAL SITE PROMO - 10% OFF');

  const loadPromotions = async () => {
    setLoading(true);
    try {
      const data = await vendorApi.getPromotions();
      setPromotions(data);
    } catch (err) {
      console.error('Failed to load promotions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPromotions();
  }, []);

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !discountValue) return;

    await vendorApi.createPromotion({
      title,
      description,
      discountType,
      discountValue: Number(discountValue),
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      bannerText,
      applicableProductIds: ['vp-prod-cem-1'],
    });

    setIsModalOpen(false);
    setTitle('');
    loadPromotions();
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SCHEDULED' : 'ACTIVE';
    await vendorApi.updatePromotionStatus(id, nextStatus);
    loadPromotions();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#203D91]/10 text-[#203D91] border border-[#203D91]/20">
              GROWTH & MARKETING
            </span>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#FF7417]" />
              Synced to Customer Deals Section
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#17233C] tracking-tight">
            Promotions & Flash Deals
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Create promotional discount campaigns that display in the customer website deals bar and homepage spotlight.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#203D91] text-white rounded-xl text-xs font-bold hover:bg-[#17233C] transition-all shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4 text-[#FF7417]" />
          Create Promotion
        </button>
      </div>

      {/* Promotions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {promotions.map((p) => (
          <div
            key={p.id}
            className={`p-5 rounded-2xl border bg-white shadow-xs flex flex-col justify-between transition-all ${
              p.status === 'ACTIVE' ? 'border-[#203D91] ring-1 ring-[#203D91]/20' : 'border-[#E2E8F0]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                    p.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : p.status === 'SCHEDULED'
                      ? 'bg-blue-50 text-[#203D91] border-blue-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  {p.status}
                </span>

                <span className="text-sm font-black text-[#FF7417] flex items-center gap-0.5">
                  {p.discountType === 'PERCENTAGE' ? `${p.discountValue}% OFF` : `₹${p.discountValue} FLAT OFF`}
                </span>
              </div>

              <h3 className="font-extrabold text-sm text-[#17233C] mt-2 line-clamp-1">{p.title}</h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.description}</p>

              {p.bannerText && (
                <div className="mt-3 px-2.5 py-1 rounded-lg bg-[#FF7417]/10 text-[#FF7417] text-[10px] font-black uppercase tracking-wider inline-block border border-[#FF7417]/20">
                  {p.bannerText}
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-[#E2E8F0] text-xs text-slate-500 space-y-1">
                <div className="flex items-center justify-between">
                  <span>Sales Generated:</span>
                  <strong className="text-[#17233C]">₹{(p.salesGenerated || 184500).toLocaleString('en-IN')}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Usage Count:</span>
                  <strong className="text-[#17233C]">{p.usageCount || 42} site orders</strong>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Valid Until:</span>
                  <span>{new Date(p.endDate).toLocaleDateString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#E2E8F0] text-xs">
              <button
                onClick={() => handleToggleStatus(p.id, p.status)}
                className={`text-[11px] font-bold px-3 py-1 rounded-lg border transition-colors ${
                  p.status === 'ACTIVE'
                    ? 'border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100'
                    : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                }`}
              >
                {p.status === 'ACTIVE' ? 'Pause Offer' : 'Activate Deal'}
              </button>

              <span className="text-[11px] font-bold text-[#203D91] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Live on Deals Tab
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE PROMOTION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-[#E2E8F0] shadow-xl">
            <h3 className="text-lg font-black text-[#17233C] mb-1">Create Customer Promotion Deal</h3>
            <p className="text-xs text-slate-500 mb-4">
              Discounts are immediately synced to customer checkout calculation.
            </p>

            <form onSubmit={handleCreatePromo} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Promotion Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Monsoon Structural Cement Mega Discount"
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] focus:border-[#203D91] outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Campaign Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Applies to all contractor orders above minimum quantity..."
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] focus:border-[#203D91] outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e: any) => setDiscountType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] bg-white outline-hidden font-medium"
                  >
                    <option value="PERCENTAGE">Percentage (%) Off</option>
                    <option value="FLAT">Flat Rupee (₹) Off</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Discount Amount</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] outline-hidden font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Badge / Banner Text</label>
                <input
                  type="text"
                  value={bannerText}
                  onChange={(e) => setBannerText(e.target.value)}
                  placeholder="e.g. EXTRA 10% SITE SAVINGS"
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] outline-hidden uppercase font-bold text-[#FF7417]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-[#F4F7FC] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-[#203D91] hover:bg-[#17233C] rounded-xl shadow-xs"
                >
                  Publish Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default VendorPromotionsPage;