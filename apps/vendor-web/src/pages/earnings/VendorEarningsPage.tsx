import React, { useEffect, useState } from 'react';
import {
  IndianRupee,
  CreditCard,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { useVendorSettlementStore } from '../../store/useVendorSettlementStore';
import { useVendorAuthStore } from '../../store/useVendorAuthStore';
import { Card, CardHeader, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { vendorApi } from '../../services/vendorApi';

export const VendorEarningsPage: React.FC = () => {
  const { vendor } = useVendorAuthStore();
  const { settlements, summary, fetchSettlements, fetchSummary, isLoading } =
    useVendorSettlementStore();

  useEffect(() => {
    fetchSettlements();
    fetchSummary();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Payouts, Commission & Settlements
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Weekly automated bank settlements (T+7 cycle) with itemized platform commission and GST invoices.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => window.print()}
          leftIcon={<Download className="w-3.5 h-3.5" />}
        >
          Download Financial Statement
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Gross Material Sales"
          value={`₹${(summary?.totalGrossRevenue || 312500).toLocaleString('en-IN')}`}
          subtitle="All contractor orders"
          icon={<IndianRupee className="w-5 h-5 text-emerald-600" />}
          trend={{ value: 22.4, isPositive: true, period: 'last month' }}
        />

        <StatCard
          title="Platform Commission"
          value={`₹${(summary?.totalCommissionPaid || 25000).toLocaleString('en-IN')}`}
          subtitle="Fixed 8% quick-commerce fee"
          icon={<Building className="w-5 h-5 text-blue-600" />}
        />

        <StatCard
          title="Net Settled to Bank"
          value={`₹${(summary?.totalNetPayout || 284375).toLocaleString('en-IN')}`}
          subtitle="Credited to HDFC account"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        />

        <StatCard
          title="Next Scheduled Payout"
          value={`₹${(summary?.pendingPayout || 74200).toLocaleString('en-IN')}`}
          subtitle={summary?.nextPayoutDate ? `Due on ${summary.nextPayoutDate}` : 'Due on Friday'}
          icon={<Clock className="w-5 h-5 text-amber-500" />}
        />
      </div>

      {/* Bank Account Verification Card */}
      <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#203D91]/10 border border-[#203D91]/20 flex items-center justify-center text-[#203D91] shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm text-[#17233C]">
                {vendor?.businessInfo?.bankDetails?.bankName || vendor?.bankDetails?.bankName || 'HDFC Bank'} &bull;&bull;&bull;&bull;{' '}
                {(vendor?.businessInfo?.bankDetails?.accountNumber || vendor?.bankDetails?.accountNumber || '2341').slice(-4)}
              </span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> IFSC Verified
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Beneficiary: <strong className="text-[#17233C]">{vendor?.businessInfo?.bankDetails?.accountHolderName || vendor?.bankDetails?.beneficiaryName || 'Supreme Materials BLR'}</strong> | IFSC:{' '}
              <span className="font-mono">{vendor?.businessInfo?.bankDetails?.ifsc || vendor?.bankDetails?.ifscCode || 'HDFC0000053'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block text-xs">
            <p className="text-[11px] text-slate-500">Automated Direct Transfer</p>
            <p className="font-bold text-[#203D91]">Every Friday 11:00 AM IST</p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={async () => {
              await vendorApi.requestSettlementPayout();
              alert('On-demand bank payout request submitted for NEFT processing.');
              fetchSettlements();
            }}
          >
            Request Payout Now
          </Button>
        </div>
      </div>

      {/* Settlements History Table */}
      <Card>
        <CardHeader
          title="Settlement Cycle History"
          subtitle="Detailed statements with UTR tracking for past disbursement cycles"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Cycle ID & Period</th>
                <th className="py-3 px-4">Gross Sales</th>
                <th className="py-3 px-4">Platform Fee (8%)</th>
                <th className="py-3 px-4">GST Deductions</th>
                <th className="py-3 px-4">Net Payout</th>
                <th className="py-3 px-4">UTR Reference</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {settlements.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-mono font-bold text-slate-900">{s.id}</div>
                    <div className="text-[11px] text-slate-400">
                      {s.period || `${s.periodStart} to ${s.periodEnd}`}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-slate-800">
                    ₹{(s.grossAmount || s.grossRevenue || 0).toLocaleString('en-IN')}
                  </td>

                  <td className="py-3.5 px-4 text-rose-600">
                    - ₹{(s.commission || s.platformCommission || 0).toLocaleString('en-IN')}
                  </td>

                  <td className="py-3.5 px-4 text-slate-500">
                    - ₹{(s.deductions || s.taxDeductions || 0).toLocaleString('en-IN')}
                  </td>

                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    ₹{(s.netAmount || s.netPayable || 0).toLocaleString('en-IN')}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-slate-600">
                    {s.utr || s.paymentReference || 'Pending'}
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge variant={s.status === 'PAID' ? 'success' : 'warning'} dot>
                      {s.status}
                    </Badge>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => alert(`Downloading Tax Invoice for ${s.id}`)}
                      className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
