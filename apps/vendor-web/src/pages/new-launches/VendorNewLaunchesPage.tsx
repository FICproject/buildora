import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, Trash2, Package } from 'lucide-react';
import { vendorApi } from '../../services/vendorApi';
import { VendorProduct } from '@buildora/types';
import {
  PageHeader,
  Card,
  CardContent,
  Button,
  Badge,
  Modal,
  ConfirmDialog,
  EmptyState,
} from '../../components/common';
import { toast } from '../../store/useToastStore';

export const VendorNewLaunchesPage: React.FC = () => {
  const [newLaunches, setNewLaunches] = useState<VendorProduct[]>([]);
  const [allProducts, setAllProducts] = useState<VendorProduct[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProdId, setSelectedProdId] = useState('');
  const [removeTarget, setRemoveTarget] = useState<VendorProduct | null>(null);

  const loadData = async () => {
    try {
      const [nl, all] = await Promise.all([
        vendorApi.getNewLaunches(),
        vendorApi.getProducts(),
      ]);
      setNewLaunches(nl || []);
      setAllProducts(all || []);
    } catch {}
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddNewLaunch = async () => {
    if (!selectedProdId) return;
    await vendorApi.addNewLaunch(selectedProdId);
    toast.success('Product added to New Launches.');
    setIsModalOpen(false);
    setSelectedProdId('');
    loadData();
  };

  const handleConfirmRemove = async () => {
    if (!removeTarget) return;
    await vendorApi.removeNewLaunch(removeTarget.id);
    toast.success(`"${removeTarget.name}" removed from New Launches.`);
    setRemoveTarget(null);
    loadData();
  };

  const eligibleProducts = allProducts.filter((p) => !p.isNewLaunch);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="New Launches"
        description="Highlight newly introduced products for buyers in the New Launches section."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Product
          </Button>
        }
      />

      {newLaunches.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Sparkles className="w-5 h-5" />}
            title="No featured new launches"
            description="Select products from your catalog to highlight as new launches."
            action={
              <Button size="sm" variant="primary" onClick={() => setIsModalOpen(true)}>
                Add Product
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {newLaunches.map((prod) => (
            <Card key={prod.id}>
              <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <Badge variant="accent" size="sm">
                      New Launch
                    </Badge>
                    <button
                      type="button"
                      onClick={() => setRemoveTarget(prod)}
                      className="p-1 rounded-lg text-[#718096] hover:text-[#DC4545] hover:bg-[#DC4545]/10 cursor-pointer"
                      title="Remove from New Launches"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex gap-3">
                    {prod.images?.[0] ? (
                      <img
                        src={prod.images[0]}
                        alt={prod.name}
                        className="w-14 h-14 rounded-lg object-cover border border-[#E5E9F0] shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-[#EEF3FA] text-[#23438F] flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="text-xs font-semibold text-[#263247] line-clamp-2">
                        {prod.name}
                      </h3>
                      <p className="text-[11px] font-mono text-[#718096] mt-1">{prod.sku}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E5E9F0] flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#263247]">
                    ₹{prod.price.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[#718096]">{prod.stockCount || 0} in stock</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add to New Launches"
        subtitle="Choose a product from your catalog."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="portal-label">Select Product *</label>
            <select
              value={selectedProdId}
              onChange={(e) => setSelectedProdId(e.target.value)}
              className="portal-input"
            >
              <option value="">-- Choose a Product --</option>
              {eligibleProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) - ₹{p.price}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={!selectedProdId}
              onClick={handleAddNewLaunch}
            >
              Add Product
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleConfirmRemove}
        title="Remove from New Launches"
        message={`Remove "${removeTarget?.name}" from the New Launches collection?`}
        confirmLabel="Remove"
      />
    </div>
  );
};

export default VendorNewLaunchesPage;
