import React from 'react';
import { Award, Gift, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/ui/Button';

export const RewardsPage: React.FC = () => {
  const { user } = useAuthStore();

  const rewardVouchers = [
    { title: '₹200 Instant Tool Discount', points: 200, category: 'Power Tools', code: 'REW200' },
    { title: '₹500 Paint & Putty Voucher', points: 500, category: 'Painting', code: 'REW500' },
    { title: 'Free Express Crane Offloading', points: 750, category: 'Logistics', code: 'CRANEFREE' }
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 sm:p-8 space-y-6">
      <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900">Buildora Contractor Rewards</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Earn 1 point for every ₹100 spent on construction materials. Redeem for direct billing discounts.
          </p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
          <Award className="w-6 h-6" />
        </div>
      </div>

      {/* Rewards Status Card */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6 sm:p-8 rounded-3xl shadow-lg flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs text-amber-100 uppercase tracking-widest font-bold">
            Accumulated Reward Points
          </span>
          <div className="text-3xl sm:text-4xl font-black">
            {user?.rewardPoints || 480} <span className="text-lg font-bold">Points</span>
          </div>
          <p className="text-[11px] text-amber-100">
            Equivalent value: ₹{(user?.rewardPoints || 480) * 1} in material purchase credits.
          </p>
        </div>
      </div>

      {/* Redeemable Vouchers */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-slate-900">Available Reward Redemptions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {rewardVouchers.map((voucher, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-3 text-xs"
            >
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-orange-600 tracking-wider">
                  {voucher.category}
                </span>
                <h4 className="font-bold text-slate-900 text-sm mt-0.5">{voucher.title}</h4>
                <div className="text-slate-500 mt-1">{voucher.points} Points required</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => alert(`Voucher redeemed! Use coupon code: ${voucher.code}`)}
              >
                Redeem Voucher
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
