import React, { useState, useEffect } from 'react';
import { Users, Search, Star, MessageSquare, Phone, Mail, MapPin } from 'lucide-react';
import { vendorApi } from '../../services/vendorApi';
import { VendorProductReview } from '@buildora/types';
import {
  PageHeader,
  Card,
  CardContent,
  Button,
  Badge,
  Modal,
  Drawer,
  EmptyState,
} from '../../components/common';
import { toast } from '../../store/useToastStore';

type CustomersTab = 'DIRECTORY' | 'REVIEWS';

export const VendorCustomersPage: React.FC<{ initialTab?: CustomersTab }> = ({
  initialTab = 'DIRECTORY',
}) => {
  const [activeTab, setActiveTab] = useState<CustomersTab>(initialTab);
  const [customers, setCustomers] = useState<any[]>([]);
  const [reviews, setReviews] = useState<VendorProductReview[]>([]);
  const [avgRating, setAvgRating] = useState(4.8);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  // Review reply modal
  const [replyTarget, setReplyTarget] = useState<VendorProductReview | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const loadData = async () => {
    try {
      const [custs, revRes] = await Promise.all([
        vendorApi.getCustomers(),
        vendorApi.getReviews(),
      ]);
      setCustomers(custs || []);
      setReviews(revRes?.data || []);
      if (revRes?.averageRating) setAvgRating(revRes.averageRating);
    } catch {}
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyTarget || !replyText.trim() || submittingReply) return;
    setSubmittingReply(true);
    try {
      await vendorApi.replyToReview(replyTarget.id, replyText.trim());
      toast.success('Reply posted successfully.');
      setReplyTarget(null);
      setReplyText('');
      loadData();
    } finally {
      setSubmittingReply(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const q = search.toLowerCase();
    return (
      !q ||
      c.name.toLowerCase().includes(q) ||
      (c.company || '').toLowerCase().includes(q) ||
      (c.pincode || '').includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Customers"
        description="View your contractor and B2B buyers, order activity, and customer reviews."
      />

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E7E5E4] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('DIRECTORY')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeTab === 'DIRECTORY'
              ? 'bg-[#943D24] text-white'
              : 'text-[#78716C] hover:text-[#292524] hover:bg-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Customer Directory ({customers.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('REVIEWS')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeTab === 'REVIEWS'
              ? 'bg-[#943D24] text-white'
              : 'text-[#78716C] hover:text-[#292524] hover:bg-white'
          }`}
        >
          <Star className="w-3.5 h-3.5" />
          Reviews & Ratings ({avgRating} ★)
        </button>
      </div>

      {activeTab === 'DIRECTORY' && (
        <>
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="w-4 h-4 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by customer name, company, or pincode..."
                  className="portal-input pl-9"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F7F5] text-[#78716C] font-semibold border-b border-[#E7E5E4]">
                  <tr>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4 text-right">Orders</th>
                    <th className="py-3 px-4 text-right">Total Spend</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E5E4]">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <EmptyState
                          icon={<Users className="w-5 h-5" />}
                          title="No customers found"
                          description="Customers who place orders will appear here."
                        />
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedCustomer(c)}
                        className="hover:bg-[#F8F7F5] cursor-pointer transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[#292524]">{c.name}</div>
                          <div className="text-[11px] text-[#78716C]">{c.company}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant="brand" size="sm">
                            {c.type}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-[#78716C]">
                          {c.city} - {c.pincode}
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-[#292524]">
                          {c.totalOrders}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-[#292524]">
                          ₹{(c.totalSpend || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCustomer(c);
                            }}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {activeTab === 'REVIEWS' && (
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <Card>
              <EmptyState
                icon={<Star className="w-5 h-5" />}
                title="No reviews yet"
                description="Verified buyer reviews will appear here."
              />
            </Card>
          ) : (
            reviews.map((rev) => (
              <Card key={rev.id}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#292524]">
                          {rev.customerName}
                        </span>
                        {rev.verifiedPurchase && (
                          <Badge variant="success" size="sm">
                            Verified Purchase
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-[#78716C] mt-0.5">
                        {rev.productName} ({rev.sku})
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-[#D99B16]">
                      {Array.from({ length: rev.rating }).map((_, idx) => (
                        <Star key={idx} className="w-4 h-4 fill-[#D99B16]" />
                      ))}
                    </div>
                  </div>

                  {rev.title && (
                    <h4 className="text-xs font-semibold text-[#292524]">{rev.title}</h4>
                  )}
                  <p className="text-xs text-[#78716C] leading-relaxed">{rev.comment}</p>

                  {rev.vendorReply ? (
                    <div className="p-3 rounded-lg bg-[#F8F7F5] border border-[#E7E5E4] text-xs">
                      <p className="font-semibold text-[#943D24]">
                        Your Reply ({rev.vendorReply.repliedBy})
                      </p>
                      <p className="text-[#292524] mt-1">{rev.vendorReply.message}</p>
                    </div>
                  ) : (
                    <div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setReplyTarget(rev);
                          setReplyText('');
                        }}
                        leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
                      >
                        Reply to Review
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Customer Details Drawer */}
      <Drawer
        isOpen={Boolean(selectedCustomer)}
        onClose={() => setSelectedCustomer(null)}
        title={selectedCustomer?.name || 'Customer Details'}
        subtitle={selectedCustomer?.company}
        width="md"
      >
        {selectedCustomer && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-[#F8F7F5] border border-[#E7E5E4] space-y-2.5">
              <div className="flex items-center gap-2 text-[#292524]">
                <Phone className="w-3.5 h-3.5 text-[#78716C]" />
                <span>{selectedCustomer.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-[#292524]">
                <Mail className="w-3.5 h-3.5 text-[#78716C]" />
                <span>{selectedCustomer.email}</span>
              </div>
              <div className="flex items-center gap-2 text-[#292524]">
                <MapPin className="w-3.5 h-3.5 text-[#78716C]" />
                <span>
                  {selectedCustomer.city} - {selectedCustomer.pincode}
                </span>
              </div>
              {selectedCustomer.gstin && (
                <div className="pt-2 border-t border-[#E7E5E4]">
                  <span className="text-[#78716C]">GSTIN: </span>
                  <span className="font-mono font-semibold text-[#292524]">
                    {selectedCustomer.gstin}
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl border border-[#E7E5E4] bg-white">
                <span className="text-[#78716C] block">Total Orders</span>
                <span className="text-lg font-bold text-[#292524]">
                  {selectedCustomer.totalOrders}
                </span>
              </div>
              <div className="p-4 rounded-xl border border-[#E7E5E4] bg-white">
                <span className="text-[#78716C] block">Total Spend</span>
                <span className="text-lg font-bold text-[#943D24]">
                  ₹{(selectedCustomer.totalSpend || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Reply Modal */}
      <Modal
        isOpen={Boolean(replyTarget)}
        onClose={() => setReplyTarget(null)}
        title="Reply to Customer Review"
        subtitle={replyTarget ? `${replyTarget.customerName} • ${replyTarget.productName}` : ''}
        maxWidth="md"
      >
        <form onSubmit={handleSendReply} className="space-y-4">
          <div className="p-3 rounded-lg bg-[#F8F7F5] border border-[#E7E5E4] text-xs text-[#78716C]">
            "{replyTarget?.comment}"
          </div>
          <div>
            <label className="portal-label">Your Response *</label>
            <textarea
              rows={3}
              required
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a helpful response..."
              className="portal-input"
            />
          </div>
          <div className="flex justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReplyTarget(null)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={submittingReply}>
              Post Reply
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default VendorCustomersPage;
