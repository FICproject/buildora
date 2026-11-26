import React, { useState, useEffect } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  CheckCircle2,
  ShieldCheck,
  Filter,
  Clock,
  RotateCcw,
  Sparkles,
  Info,
  CreditCard,
  FileText
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { formatCurrency } from '@buildora/utils';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { WalletTransaction } from '@buildora/types';
import { api } from '../services/api';

export const WalletPage: React.FC = () => {
  const { user, addWalletBalance } = useAuthStore();
  const [topupAmount, setTopupAmount] = useState<number | ''>(1000);
  const [isTopupModalOpen, setIsTopupModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'CREDIT' | 'DEBIT' | 'REFUND'>('ALL');
  const [selectedTx, setSelectedTx] = useState<WalletTransaction | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sync wallet ledger from Backend API on mount
  React.useEffect(() => {
    api.getWallet().then((w) => {
      if (w && w.transactions && w.transactions.length > 0) {
        setTransactions(w.transactions);
      }
    });
  }, []);

  // Initial transactions ledger
  const [transactions, setTransactions] = useState<WalletTransaction[]>([
    {
      id: 'tx-1',
      referenceNumber: 'WTX-2026-98124',
      type: 'DEBIT',
      amount: 200,
      category: 'CHECKOUT',
      status: 'COMPLETED',
      description: 'Applied to Order #BLD-2026-8941',
      orderId: 'BLD-2026-8941',
      createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
      balanceAfter: user?.walletBalance || 1250
    },
    {
      id: 'tx-2',
      referenceNumber: 'WTX-2026-98011',
      type: 'CREDIT',
      amount: 500,
      category: 'CASHBACK',
      status: 'COMPLETED',
      description: 'UltraTech Cement Promo Site Cashback',
      createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      balanceAfter: (user?.walletBalance || 1250) + 200
    },
    {
      id: 'tx-3',
      referenceNumber: 'WTX-2026-97992',
      type: 'CREDIT',
      amount: 950,
      category: 'TOPUP',
      status: 'COMPLETED',
      description: 'UPI Wallet Top-Up via Google Pay (Ref: 41298402)',
      createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
      balanceAfter: 950
    }
  ]);

  // Fetch backend transactions if available
  useEffect(() => {
    let isMounted = true;
    api.getWalletTransactions()
      .then((txList) => {
        if (isMounted && Array.isArray(txList) && txList.length > 0) {
          setTransactions(txList);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const handleTopup = (amt: number) => {
    if (amt <= 0) return;
    setIsLoading(true);

    api.topupWallet(amt, 'UPI Instant Top-Up')
      .then((res) => {
        addWalletBalance(amt);
        const createdTx = res?.data?.transaction;
        const newTx: WalletTransaction = createdTx || {
          id: 'tx-' + Date.now(),
          referenceNumber: 'WTX-' + Date.now().toString().slice(-8),
          type: 'CREDIT',
          amount: amt,
          category: 'TOPUP',
          status: 'COMPLETED',
          description: `Instant UPI Wallet Top-Up`,
          createdAt: new Date().toISOString(),
          balanceAfter: (user?.walletBalance || 0) + amt
        };
        setTransactions((prev) => [newTx, ...prev]);
        setIsTopupModalOpen(false);
        setSuccessToast(`₹${amt} added to your Buildora Wallet!`);
        setTimeout(() => setSuccessToast(null), 3000);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (activeFilter === 'CREDIT') return tx.type === 'CREDIT' && tx.category !== 'REFUND';
    if (activeFilter === 'DEBIT') return tx.type === 'DEBIT';
    if (activeFilter === 'REFUND') return tx.category === 'REFUND';
    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">Buildora Cash Wallet</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            1-Click site checkouts, instant refund processing, and exclusive contractor cashbacks.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" /> 100% Escrow Protected
        </div>
      </div>

      {successToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          {successToast}
        </div>
      )}

      {/* Balance Hero Card */}
      <div className="bg-gradient-to-r from-brand-blue-950 via-brand-blue-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300 uppercase tracking-widest font-extrabold">
              Available Wallet Balance
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-500/30">
              Active
            </span>
          </div>
          <div className="text-3xl sm:text-5xl font-black tracking-tight">
            {formatCurrency(user?.walletBalance || 0)}
          </div>
          <p className="text-xs text-slate-300 max-w-md">
            Usable for 100% of material purchases, logistics speed fees, and truck delivery charges at checkout.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 w-full md:w-auto z-10">
          <Button
            variant="secondary"
            size="md"
            onClick={() => setIsTopupModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
            className="w-full sm:w-auto font-black shadow-lg"
          >
            Add Money to Wallet
          </Button>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Pending Clearance: <strong>₹0</strong></span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4 pt-2 border-b border-slate-100 pb-3">
        <div className="flex gap-2 overflow-x-auto text-xs font-bold text-slate-600">
          {(['ALL', 'CREDIT', 'DEBIT', 'REFUND'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveFilter(tab)}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeFilter === tab
                  ? 'bg-brand-blue-900 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {tab === 'ALL'
                ? `All Transactions (${transactions.length})`
                : tab === 'CREDIT'
                ? 'Credits & Cashbacks'
                : tab === 'DEBIT'
                ? 'Order Payments'
                : 'Site Refunds'}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Ledger List */}
      <div className="space-y-3">
        <h3 className="font-extrabold text-sm text-slate-900 flex items-center justify-between">
          <span>Immutable Transaction Ledger</span>
          <span className="text-xs text-slate-400 font-normal">Audit Trail Verified</span>
        </h3>

        {filteredTransactions.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
            No wallet transactions matching this filter.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs border border-slate-100 rounded-2xl overflow-hidden">
            {filteredTransactions.map((tx) => {
              const isCredit = tx.type === 'CREDIT';
              return (
                <div
                  key={tx.id}
                  onClick={() => setSelectedTx(tx)}
                  className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                        isCredit
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="w-5 h-5 text-emerald-700" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-slate-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-black text-slate-900 text-sm">{tx.description}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Ref: {tx.referenceNumber} &bull; {new Date(tx.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`font-black text-sm ${
                        isCredit ? 'text-emerald-700' : 'text-slate-900'
                      }`}
                    >
                      {isCredit ? '+' : '-'} {formatCurrency(tx.amount)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Bal: {formatCurrency(tx.balanceAfter)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Top-Up Modal */}
      {isTopupModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsTopupModalOpen(false)}
          title="Top Up Buildora Cash Wallet"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600">
              Load funds into your contractor wallet for instant site material dispatches without bank OTP delays.
            </p>

            <div className="space-y-2">
              <label className="block font-bold text-slate-800">Select Amount</label>
              <div className="grid grid-cols-4 gap-2">
                {[500, 1000, 2500, 5000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTopupAmount(amt)}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                      topupAmount === amt
                        ? 'border-brand-blue-600 bg-brand-blue-50 text-brand-blue-900 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    +{formatCurrency(amt)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Custom Amount (₹)</label>
              <input
                type="number"
                min={100}
                max={100000}
                value={topupAmount}
                onChange={(e) => setTopupAmount(Number(e.target.value) || '')}
                placeholder="Enter amount (min ₹100)"
                className="w-full p-2.5 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-brand-blue-500"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsTopupModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={isLoading}
                disabled={!topupAmount || topupAmount < 100}
                onClick={() => handleTopup(Number(topupAmount))}
              >
                Proceed to UPI Payment ({formatCurrency(Number(topupAmount) || 0)})
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Transaction Details Modal */}
      {selectedTx && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedTx(null)}
          title="Transaction Details"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <div className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                {selectedTx.type === 'CREDIT' ? 'Credit Amount' : 'Debit Amount'}
              </div>
              <div className={`text-3xl font-black ${
                selectedTx.type === 'CREDIT' ? 'text-emerald-700' : 'text-slate-900'
              }`}>
                {selectedTx.type === 'CREDIT' ? '+' : '-'} {formatCurrency(selectedTx.amount)}
              </div>
              <span className="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {selectedTx.status}
              </span>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
              <div className="p-3 flex justify-between bg-white">
                <span className="text-slate-500">Reference Number</span>
                <span className="font-mono font-bold text-slate-900">{selectedTx.referenceNumber}</span>
              </div>
              <div className="p-3 flex justify-between bg-white">
                <span className="text-slate-500">Transaction Type</span>
                <span className="font-bold text-slate-800">{selectedTx.category}</span>
              </div>
              <div className="p-3 flex justify-between bg-white">
                <span className="text-slate-500">Date &amp; Time</span>
                <span className="text-slate-800">{new Date(selectedTx.createdAt).toLocaleString()}</span>
              </div>
              <div className="p-3 flex justify-between bg-white">
                <span className="text-slate-500">Balance After Transaction</span>
                <span className="font-bold text-slate-900">{formatCurrency(selectedTx.balanceAfter)}</span>
              </div>
              {selectedTx.orderId && (
                <div className="p-3 flex justify-between bg-white">
                  <span className="text-slate-500">Linked Order</span>
                  <span className="font-bold text-brand-blue-800">{selectedTx.orderId}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="primary" size="sm" onClick={() => setSelectedTx(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
