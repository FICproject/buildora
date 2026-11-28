import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IndianRupee,
  CreditCard,
  Download,
  CheckCircle2,
  Clock,
  Wallet,
  FileText,
} from 'lucide-react';
import { useVendorSettlementStore } from '../../store/useVendorSettlementStore';
import { useVendorAuthStore } from '../../store/useVendorAuthStore';
import { vendorApi } from '../../services/vendorApi';
import { VendorSettlement } from '@buildora/types';
import {
  PageHeader,
  StatCard,
  Card,
  CardHeader,
  CardContent,
  Button,
  Badge,
  Modal,
  EmptyState,
} from '../../components/common';
import { toast } from '../../store/useToastStore';

export const VendorEarningsPage: React.FC = () => {
  const navigate = useNavigate();
  const { vendor } = useVendorAuthStore();
  const { settlements, summary, fetchSettlements, fetchSummary } = useVendorSettlementStore();
  const [selectedSettlement, setSelectedSettlement] = useState<VendorSettlement | null>(null);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    fetchSettlements();
    fetchSummary();
  }, []);

  const handleRequestPayout = async () => {
    if (requesting) return;
    setRequesting(true);
    try {
      await vendorApi.requestSettlementPayout();
      toast.success('Payout request submitted for NEFT transfer.');
      fetchSettlements();
      fetchSummary();
    } catch {
      toast.error('Failed to submit payout request.');
    } finally {
      setRequesting(false);
    }
  };

  const bank = vendor?.businessInfo?.bankDetails || vendor?.bankDetails || {};

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Payments & Settlements"
        description="Track total sales, available balance, pending and completed settlements, and bank payouts."
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/invoices')}
              leftIcon={<FileText className="w-3.5 h-3.5" />}
            >
              GST Invoices
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.print()}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Print Statement
            </Button>
          </>
        }
      />

      {/* 4 Essential Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Sales"
          value={`₹${(summary?.totalGrossRevenue || 0).toLocaleString('en-IN')}`}
          subtitle="Gross order value"
          icon={<IndianRupee className="w-4 h-4" />}
        />
        <StatCard
          title="Available Balance"
          value={`₹${(summary?.pendingPayout || 0).toLocaleString('en-IN')}`}
          subtitle="Ready for payout"
          icon={<Wallet className="w-4 h-4 text-[#15966B]" />}
        />
        <StatCard
          title="Pending Settlements"
          value={`₹${settlements
            .filter((s) => s.status !== 'PAID')
            .reduce((sum, s) => sum + (s.netPayable || s.netAmount || 0), 0)
            .toLocaleString('en-IN')}`}
          subtitle={summary?.nextPayoutDate ? `Next: ${summary.nextPayoutDate}` : 'Scheduled cycle'}
          icon={<Clock className="w-4 h-4 text-[#D99B16]" />}
        />
        <StatCard
          title="Completed Settlements"
          value={`₹${(summary?.totalNetPayout || 0).toLocaleString('en-IN')}`}
          subtitle="Settled to bank account"
          icon={<CheckCircle2 className="w-4 h-4 text-[#15966B]" />}
        />
      </div>

      {/* Bank Account Card */}
      <Card>
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-[#FBF3F0] text-[#943D24] flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm text-[#292524]">
                  {bank.bankName || 'Primary Bank'} {bank.accountNumber ? `•••• ${bank.accountNumber.slice(-4)}` : ''}
                </span>
                <Badge variant={bank.isVerified ? 'success' : 'neutral'} size="sm">
                  {bank.isVerified ? 'Verified' : 'Pending Verification'}
                </Badge>
              </div>
              <p className="text-xs text-[#78716C] mt-0.5">
                Beneficiary: {bank.accountHolderName || bank.beneficiaryName || vendor?.storeName || '—'} • IFSC:{' '}
                <span className="font-mono">{bank.ifsc || bank.ifscCode || '—'}</span>
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleRequestPayout}
            isLoading={requesting}
          >
            Request Payout
          </Button>
        </CardContent>
      </Card>

      {/* Settlements & Transaction History */}
      <Card>
        <CardHeader
          title="Transaction & Settlement History"
          subtitle="Click any settlement row to view itemized deductions and UTR details."
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-xs">
            <thead className="bg-[#F8F7F5] text-[#78716C] font-semibold border-b border-[#E7E5E4]">
              <tr>
                <th className="py-3 px-4">Settlement ID</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4 text-right">Gross Sales</th>
                <th className="py-3 px-4 text-right">Deductions</th>
                <th className="py-3 px-4 text-right">Net Payout</th>
                <th className="py-3 px-4">UTR Reference</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E5E4]">
              {settlements.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      icon={<IndianRupee className="w-5 h-5" />}
                      title="No settlements found"
                      description="Completed and pending payouts will appear here."
                    />
                  </td>
                </tr>
              ) : (
                settlements.map((s) => {
                  const gross = s.grossAmount || s.grossRevenue || 0;
                  const comm = s.commission || s.platformCommission || 0;
                  const tax = s.deductions || s.taxDeductions || 0;
                  const net = s.netAmount || s.netPayable || 0;
                  return (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedSettlement(s)}
                      className="hover:bg-[#F8F7F5] cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-semibold text-[#292524]">
                        {s.settlementNumber || s.id}
                      </td>
                      <td className="py-3.5 px-4 text-[#78716C]">
                        {s.period || `${s.periodStart} - ${s.periodEnd}`}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-[#292524]">
                        ₹{gross.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right text-[#DC4545]">
                        - ₹{(comm + tax).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-[#292524]">
                        ₹{net.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#78716C]">
                        {s.utr || s.paymentReference || 'Pending'}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={s.status === 'PAID' ? 'success' : 'warning'} size="sm">
                          {s.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSettlement(s);
                          }}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Settlement Details Modal */}
      <Modal
        isOpen={Boolean(selectedSettlement)}
        onClose={() => setSelectedSettlement(null)}
        title={`Settlement ${selectedSettlement?.settlementNumber || selectedSettlement?.id || ''}`}
        subtitle={selectedSettlement?.period}
        maxWidth="md"
      >
        {selectedSettlement && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-[#F8F7F5] border border-[#E7E5E4] space-y-2">
              <div className="flex justify-between">
                <span className="text-[#78716C]">Orders Included</span>
                <span className="font-semibold text-[#292524]">
                  {selectedSettlement.orderCount || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#78716C]">Gross Sales</span>
                <span className="font-semibold text-[#292524]">
                  ₹
                  {(
                    selectedSettlement.grossAmount ||
                    selectedSettlement.grossRevenue ||
                    0
                  ).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#78716C]">Platform Commission</span>
                <span className="text-[#DC4545]">
                  - ₹
                  {(
                    selectedSettlement.commission ||
                    selectedSettlement.platformCommission ||
                    0
                  ).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#78716C]">Tax / TDS Deductions</span>
                <span className="text-[#DC4545]">
                  - ₹
                  {(
                    selectedSettlement.deductions ||
                    selectedSettlement.taxDeductions ||
                    0
                  ).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#E7E5E4] text-sm font-bold">
                <span className="text-[#292524]">Net Payout</span>
                <span className="text-[#15966B]">
                  ₹
                  {(
                    selectedSettlement.netAmount ||
                    selectedSettlement.netPayable ||
                    0
                  ).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[#78716C]">
              <span>UTR Reference:</span>
              <span className="font-mono text-[#292524] break-all">
                {selectedSettlement.utr || selectedSettlement.paymentReference || 'Pending'}
              </span>
            </div>

            <div className="pt-2 flex flex-wrap justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedSettlement(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => window.print()}
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                Print Receipt
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default VendorEarningsPage;
