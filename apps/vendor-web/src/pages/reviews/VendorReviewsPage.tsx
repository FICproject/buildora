import React, { useState, useEffect } from 'react';
import {
  Star,
  MessageSquare,
  CheckCircle2,
  ThumbsUp,
  Filter,
  Send,
  CornerDownRight,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { vendorApi } from '../../services/vendorApi';
import { VendorProductReview } from '@buildora/types';

export const VendorReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<VendorProductReview[]>([]);
  const [avgRating, setAvgRating] = useState(4.8);
  const [totalCount, setTotalCount] = useState(28);
  const [loading, setLoading] = useState(true);

  // Reply state
  const [replyingReview, setReplyingReview] = useState<VendorProductReview | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const res = await vendorApi.getReviews();
      setReviews(res.data || []);
      if (res.averageRating) setAvgRating(res.averageRating);
      if (res.totalCount) setTotalCount(res.totalCount);
    } catch (err) {
      console.error('Failed to load reviews', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleSendReply = async () => {
    if (!replyingReview || !replyMessage) return;
    setSubmitting(true);
    try {
      await vendorApi.replyToReview(replyingReview.id, replyMessage);
      setReplyingReview(null);
      setReplyMessage('');
      loadReviews();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E7E5E4] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#943D24]/10 text-[#943D24] border border-[#943D24]/20">
              CUSTOMER SATISFACTION & REPUTATION
            </span>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Verified Contractor Ratings
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#292524] tracking-tight">
            Customer Reviews & Site Feedback
          </h1>
          <p className="text-xs text-[#78716C] font-medium">
            Monitor feedback from verified civil site engineers, contractors, and builders across Karnataka.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#FBF3F0] px-4 py-2 rounded-xl border border-[#E7E5E4]">
            <div className="flex items-center text-amber-500">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
            <div>
              <p className="text-lg font-black text-[#292524] leading-none">{avgRating}</p>
              <p className="text-[10px] text-[#78716C] font-bold">{totalCount} Ratings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ratings Breakdown Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Score Card */}
        <div className="bg-white p-5 rounded-2xl border border-[#E7E5E4] shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-[#292524]">Overall Store Rating</h3>
            <p className="text-xs text-[#78716C]">Based on batch quality and 60-min delivery punctuality</p>

            <div className="flex items-baseline gap-2 mt-4">
              <span className="text-4xl font-black text-[#943D24]">{avgRating}</span>
              <span className="text-sm font-bold text-[#78716C]">/ 5.0</span>
            </div>

            <div className="flex items-center gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
              <span className="text-xs font-bold text-[#78716C] ml-2">96% Positive Ratings</span>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 mt-4 text-[11px] text-emerald-800 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            Tier-1 Verified Partner badge eligible on Customer PDP
          </div>
        </div>

        {/* Breakdown Bars (2 cols) */}
        <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-[#E7E5E4] shadow-xs space-y-2.5">
          <h3 className="font-extrabold text-sm text-[#292524]">Rating Distribution Breakdown</h3>

          {[
            { stars: '5 Stars', count: 24, pct: 86, color: 'bg-emerald-500' },
            { stars: '4 Stars', count: 3, pct: 11, color: 'bg-blue-500' },
            { stars: '3 Stars', count: 1, pct: 3, color: 'bg-amber-500' },
            { stars: '2 Stars', count: 0, pct: 0, color: 'bg-rose-400' },
            { stars: '1 Star', count: 0, pct: 0, color: 'bg-rose-600' },
          ].map((bar) => (
            <div key={bar.stars} className="flex items-center gap-3 text-xs">
              <span className="w-16 font-bold text-[#78716C]">{bar.stars}</span>
              <div className="flex-1 h-2 bg-[#F8F7F5] rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${bar.color}`} style={{ width: `${bar.pct}%` }} />
              </div>
              <span className="w-12 text-right font-extrabold text-[#292524]">{bar.count} ({bar.pct}%)</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-wider text-[#78716C]">
          Recent Contractor Reviews ({reviews.length})
        </h2>

        {reviews.map((rev) => (
          <div
            key={rev.id}
            className="p-5 rounded-2xl border border-[#E7E5E4] bg-white shadow-xs space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-[#292524]">{rev.customerName}</span>
                  {rev.verifiedPurchase && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified Purchase
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#78716C] mt-0.5 font-medium">
                  Material: <strong className="text-[#292524]">{rev.productName}</strong> ({rev.sku})
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center text-amber-400">
                  {Array.from({ length: rev.rating }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
                <span className="text-[11px] text-[#78716C] font-medium">
                  {new Date(rev.createdAt).toLocaleDateString('en-IN')}
                </span>
              </div>
            </div>

            {rev.title && <h4 className="font-bold text-xs text-[#292524]">{rev.title}</h4>}
            <p className="text-xs text-[#78716C] leading-relaxed">{rev.comment}</p>

            {/* Vendor Reply Thread */}
            {rev.vendorReply ? (
              <div className="p-3.5 rounded-xl bg-[#FBF3F0] border border-[#E7E5E4] space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#943D24] flex items-center gap-1">
                    <CornerDownRight className="w-3.5 h-3.5 text-[#943D24]" />
                    Response from Supreme Materials BLR ({rev.vendorReply.repliedBy})
                  </span>
                  <span className="text-[10px] text-[#78716C]">
                    {new Date(rev.vendorReply.repliedAt).toLocaleDateString('en-IN')}
                  </span>
                </div>
                <p className="text-[#292524] pl-4">{rev.vendorReply.message}</p>
              </div>
            ) : (
              <div className="pt-2">
                <button
                  onClick={() => {
                    setReplyingReview(rev);
                    setReplyMessage('');
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#943D24] hover:underline"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#F6C453]" />
                  Reply to Customer Feedback →
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* REPLY MODAL */}
      {replyingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-[#E7E5E4] shadow-xl space-y-4">
            <div>
              <h3 className="text-lg font-black text-[#292524]">Reply to Contractor Review</h3>
              <p className="text-xs text-[#78716C]">Customer: {replyingReview.customerName} • {replyingReview.productName}</p>
            </div>

            <div className="p-3 bg-[#FBF3F0] rounded-xl border border-[#E7E5E4] text-xs text-[#78716C] italic">
              "{replyingReview.comment}"
            </div>

            <div>
              <label className="block text-xs font-bold text-[#292524] mb-1">Your Store Response</label>
              <textarea
                rows={4}
                required
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Thank you for your business. All our cement and electrical materials undergo strict plant batch testing..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#E7E5E4] focus:border-[#943D24] outline-hidden leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E7E5E4]">
              <button
                type="button"
                onClick={() => setReplyingReview(null)}
                className="px-4 py-2 text-xs font-bold text-[#78716C] hover:bg-[#FBF3F0] rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting || !replyMessage}
                onClick={handleSendReply}
                className="px-5 py-2 text-xs font-bold text-white bg-[#943D24] hover:bg-[#292524] rounded-xl shadow-xs disabled:opacity-50"
              >
                Post Public Reply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default VendorReviewsPage;