import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  ExternalLink,
  Package,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { vendorApi } from '../../services/vendorApi';
import { VendorProduct } from '@buildora/types';

export const VendorNewLaunchesPage: React.FC = () => {
  const [newLaunches, setNewLaunches] = useState<VendorProduct[]>([]);
  const [allProducts, setAllProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProdId, setSelectedProdId] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [nl, all] = await Promise.all([
        vendorApi.getNewLaunches(),
        vendorApi.getProducts(),
      ]);
      setNewLaunches(nl);
      setAllProducts(all);
    } catch (err) {
      console.error('Failed to load new launches', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddNewLaunch = async () => {
    if (!selectedProdId) return;
    await vendorApi.addNewLaunch(selectedProdId);
    setIsModalOpen(false);
    setSelectedProdId('');
    loadData();
  };

  const handleRemove = async (id: string) => {
    if (confirm('Remove this product from the New Launches collection?')) {
      await vendorApi.removeNewLaunch(id);
      loadData();
    }
  };

  const eligibleProducts = allProducts.filter((p) => !p.isNewLaunch);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FF7417]/10 text-[#FF7417] border border-[#FF7417]/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#FF7417]" />
              60-MIN EXPRESS DISPATCH SPOTLIGHT
            </span>
            <span className="text-xs font-bold text-[#203D91] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              Live Customer Sync
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#17233C] tracking-tight">
            New Launches Spotlight Showcase
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Products enrolled here are featured with the orange "JUST INTRODUCED" badge on the customer New Launches portal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="http://localhost:5173/new-launches"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-[#E2E8F0] text-xs font-bold text-[#203D91] rounded-xl hover:bg-[#F4F7FC] transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View Live Customer Page
          </a>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#203D91] text-white rounded-xl text-xs font-bold hover:bg-[#17233C] transition-all shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4 text-[#FF7417]" />
            Spotlight Product
          </button>
        </div>
      </div>

      {/* Grid of New Launch Products */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {newLaunches.map((prod) => (
          <div
            key={prod.id}
            className="p-5 rounded-2xl border border-[#E2E8F0] hover:border-[#FF7417] bg-white shadow-xs flex flex-col justify-between transition-all group"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-[#FF7417]/10 text-[#FF7417] border border-[#FF7417]/20 uppercase">
                  JUST INTRODUCED • 60-MIN DISPATCH
                </span>

                <button
                  onClick={() => handleRemove(prod.id)}
                  title="Remove from New Launches"
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex gap-3">
                <div className="w-16 h-16 rounded-xl bg-slate-50 border border-[#E2E8F0] overflow-hidden shrink-0">
                  <img
                    src={prod.images?.[0] || 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=400&q=80'}
                    alt={prod.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-xs text-[#17233C] line-clamp-2 leading-tight">{prod.name}</h3>
                  <p className="text-[10px] text-slate-400 mt-1">SKU: {prod.sku}</p>
                  <p className="text-[10px] text-slate-500 font-semibold">{prod.category}</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block">Selling Price</span>
                  <span className="font-black text-[#17233C] text-sm">₹{prod.price.toLocaleString('en-IN')}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[10px] block">Depot Stock</span>
                  <span className="font-extrabold text-emerald-700">{prod.stockCount || 50} units</span>
                </div>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] font-bold text-slate-500">
              <span className="flex items-center gap-1 text-emerald-700">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Live on Customer PDP
              </span>
              <a
                href={`http://localhost:5173/product/${prod.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#203D91] hover:underline flex items-center gap-0.5"
              >
                Preview PDP <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* ENROLL PRODUCT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#E2E8F0] shadow-xl">
            <h3 className="text-lg font-black text-[#17233C] mb-1">Spotlight Product in New Launches</h3>
            <p className="text-xs text-slate-500 mb-4">
              Select an approved catalog material to feature with express 60-min delivery priority.
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Catalog Material</label>
                <select
                  value={selectedProdId}
                  onChange={(e) => setSelectedProdId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] bg-white outline-hidden font-medium"
                >
                  <option value="">-- Choose a Product --</option>
                  {eligibleProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) - ₹{p.price}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-relaxed">
                <strong>Instant Customer Synchronization:</strong> Marking this product as New Launch immediately updates its customer tag and includes it on the customer New Launches collection page.
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
                  type="button"
                  disabled={!selectedProdId}
                  onClick={handleAddNewLaunch}
                  className="px-5 py-2 font-bold text-white bg-[#203D91] hover:bg-[#17233C] rounded-xl shadow-xs disabled:opacity-50"
                >
                  Confirm Spotlight
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default VendorNewLaunchesPage;