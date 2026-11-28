import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  KeyRound,
  Package,
  RefreshCw,
  Search,
  Truck,
} from 'lucide-react';
import { adminApi, formatDateTime, formatINR } from '../services/adminApi';
import {
  Badge,
  Button,
  Card,
  Drawer,
  EmptyState,
  Modal,
  PageHeader,
  StatCard,
  TablePagination,
  inputClassName,
  statusBadgeVariant,
  tableHeadClassName,
  useToastStore,
} from '../components/ui';

const ORDER_TABS = [
  { id: 'ALL', label: 'All Orders' },
  { id: 'ORDER_PLACED', label: 'Placed' },
  { id: 'VENDOR_ACCEPTED', label: 'Accepted' },
  { id: 'PICKING_IN_PROGRESS', label: 'Picking' },
  { id: 'PACKING_IN_PROGRESS', label: 'Packing' },
  { id: 'READY_FOR_DISPATCH', label: 'Ready Dispatch' },
  { id: 'DISPATCHED', label: 'Dispatched' },
  { id: 'IN_TRANSIT', label: 'In Transit' },
  { id: 'OUT_FOR_DELIVERY', label: 'Out For Delivery' },
  { id: 'DELIVERED', label: 'Delivered' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'EXCEPTIONS', label: 'SLA Exceptions' },
  { id: 'CANCELLED', label: 'Cancelled' },
  { id: 'RETURNS', label: 'Returns' },
];

export const OrdersPage: React.FC = () => {
  const pushToast = useToastStore((s) => s.push);
  const [activeTab, setActiveTab] = useState('ALL');
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [returnsList, setReturnsList] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [otpModalOrder, setOtpModalOrder] = useState<any>(null);
  const [otpForm, setOtpForm] = useState({ otp: '', recipientName: '', notes: '', markCompleted: true });
  const [transitModalOrder, setTransitModalOrder] = useState<any>(null);
  const [transitForm, setTransitForm] = useState({ status: 'IN_TRANSIT', location: '', note: '', delayReason: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersData, kpisData, returnsData] = await Promise.all([
        adminApi.getOrders(activeTab === 'RETURNS' ? 'ALL' : activeTab, search),
        adminApi.getOrdersKpis(),
        adminApi.getReturns(),
      ]);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setKpis(kpisData || null);
      setReturnsList(Array.isArray(returnsData) ? returnsData : []);
    } catch (e: any) {
      pushToast({ title: 'Failed to load orders', message: e.message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [activeTab]);

  const openDetail = async (ord: any) => {
    setSelectedOrder(ord);
    try {
      const full = await adminApi.getOrderDetail(ord.orderNumber || ord.id);
      if (full) setSelectedOrder(full);
    } catch {
      // keep summary fallback
    }
  };

  const handleConfirmDeliveryOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpModalOrder) return;
    try {
      await adminApi.confirmSiteDelivery(otpModalOrder.orderNumber || otpModalOrder.id, otpForm);
      pushToast({ title: `Verified site delivery for #${otpModalOrder.orderNumber}` });
      setOtpModalOrder(null);
      await loadData();
      if (selectedOrder) void openDetail(selectedOrder);
    } catch (err: any) {
      pushToast({ title: 'OTP Verification Failed', message: err.message, variant: 'error' });
    }
  };

  const handleTransitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transitModalOrder) return;
    try {
      await adminApi.updateDeliveryStatus(transitModalOrder.orderNumber || transitModalOrder.id, transitForm);
      pushToast({ title: `Updated transit status to ${transitForm.status}` });
      setTransitModalOrder(null);
      await loadData();
      if (selectedOrder) void openDetail(selectedOrder);
    } catch (err: any) {
      pushToast({ title: 'Update Failed', message: err.message, variant: 'error' });
    }
  };

  const pagedOrders = useMemo(() => {
    const start = (page - 1) * pageSize;
    return orders.slice(start, start + pageSize);
  }, [orders, page]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Orders, Fulfilment & Exceptions"
        description="Monitor multi-vendor order splits, warehouse picking/packing, commercial dispatch, OTP site delivery, and GST Tax Invoices."
        actions={
          <Button variant="outline" size="sm" onClick={loadData} loading={loading}>
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        }
      />

      {/* 8 Summary KPIs covering 12 lifecycle buckets */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
        <StatCard label="Total Orders" value={kpis?.totalOrders ?? orders.length} icon={<Package className="w-4 h-4" />} onClick={() => setActiveTab('ALL')} />
        <StatCard label="Awaiting Vendor" value={kpis?.pendingAcceptance ?? 0} tone="amber" icon={<Package className="w-4 h-4" />} onClick={() => setActiveTab('ORDER_PLACED')} />
        <StatCard label="Picking & Packing" value={kpis?.pickingPacking ?? 0} tone="primary" icon={<Package className="w-4 h-4" />} onClick={() => setActiveTab('PICKING_IN_PROGRESS')} />
        <StatCard label="Ready Dispatch" value={kpis?.readyForDispatch ?? 0} tone="blue" icon={<Truck className="w-4 h-4" />} onClick={() => setActiveTab('READY_FOR_DISPATCH')} />
        <StatCard label="In Transit / OFD" value={kpis?.inTransit ?? 0} tone="orange" icon={<Truck className="w-4 h-4" />} onClick={() => setActiveTab('IN_TRANSIT')} />
        <StatCard label="Delivered" value={kpis?.deliveredCompleted ?? 0} tone="green" icon={<CheckCircle2 className="w-4 h-4" />} onClick={() => setActiveTab('DELIVERED')} />
        <StatCard label="Cancelled" value={kpis?.cancelledRejected ?? 0} tone="red" icon={<AlertTriangle className="w-4 h-4" />} onClick={() => setActiveTab('CANCELLED')} />
        <StatCard label="SLA Exceptions" value={kpis?.exceptionsCount ?? 0} tone="red" icon={<AlertTriangle className="w-4 h-4" />} onClick={() => setActiveTab('EXCEPTIONS')} />
      </div>

      {/* Live SLA Exceptions Banner */}
      {kpis?.exceptions && kpis.exceptions.length > 0 && (
        <Card title={`Active Fulfilment Exceptions (${kpis.exceptions.length})`} tone="soft">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
            {kpis.exceptions.slice(0, 6).map((ex: any) => (
              <div key={ex.id} className="p-2.5 bg-white border border-amber-200 rounded-lg flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-[#5E5946]">
                    {ex.orderNumber} • {ex.type.replace(/_/g, ' ')}
                  </p>
                  <p className="text-[#6E6859] mt-0.5">{ex.message}</p>
                </div>
                <Badge variant={ex.severity === 'CRITICAL' ? 'error' : 'warning'}>{ex.severity}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Search & Filter Tabs */}
      <div className="flex flex-col lg:flex-row gap-3 justify-between lg:items-center">
        <div className="flex flex-wrap gap-1.5">
          {ORDER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setPage(1);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                activeTab === tab.id
                  ? 'bg-[#5E5946] text-white border-[#5E5946]'
                  : 'bg-white text-[#6E6859] border-[#E5DCD3] hover:bg-[#FAF7F4]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            void loadData();
          }}
          className="flex gap-2 w-full lg:w-80"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#6E6859] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Order #, buyer, phone, GSTIN, vendor, SKU, pincode..."
              className={`${inputClassName} pl-9`}
            />
          </div>
          <Button type="submit" size="sm">Go</Button>
        </form>
      </div>

      {activeTab === 'RETURNS' ? (
        <Card title="Site Return & Surplus Requests">
          {returnsList.length === 0 ? (
            <EmptyState title="No active returns" description="Site returns and quality claims will appear here." />
          ) : (
            <div className="space-y-2 text-xs">
              {returnsList.map((r: any) => (
                <div key={r.id} className="p-3 border border-[#E5DCD3] rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-bold text-[#5E5946]">{r.orderNumber} • {r.customerName}</p>
                    <p className="text-[#6E6859]">{r.comments || r.items?.[0]?.reason} • {formatINR(r.totalRefundAmount)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusBadgeVariant(r.status)}>{r.status}</Badge>
                    {r.status === 'REQUESTED' && (
                      <Button
                        size="sm"
                        onClick={async () => {
                          await adminApi.reviewReturn(r.id, 'APPROVED', 'Approved by Operations');
                          void loadData();
                        }}
                      >
                        Approve
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : (
        <Card noPadding>
          {orders.length === 0 ? (
            <EmptyState title="No orders found" description="Try another status tab or search term." />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className={tableHeadClassName}>
                      <th className="py-3 px-4">Order # & Time</th>
                      <th className="py-3 px-4">Customer & Site</th>
                      <th className="py-3 px-4">Vendor Splits</th>
                      <th className="py-3 px-4">Total & Payment</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5DCD3]">
                    {pagedOrders.map((ord) => {
                      const splits: any[] = ord.vendorSplits || [];
                      return (
                        <tr key={ord.id} className="hover:bg-[#FAF7F4]/60">
                          <td className="py-3 px-4">
                            <p className="font-bold text-[#5E5946]">{ord.orderNumber}</p>
                            <p className="text-[11px] text-[#6E6859]">{formatDateTime(ord.createdAt)}</p>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-semibold text-[#5E5946]">{ord.customerName}</p>
                            <p className="text-[11px] text-[#6E6859]">
                              {ord.deliveryAddress?.city || 'Bengaluru'} {ord.deliveryAddress?.pincode || ''}
                              {ord.gstin ? ` • GSTIN: ${ord.gstin}` : ''}
                            </p>
                          </td>
                          <td className="py-3 px-4">
                            {splits.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {splits.map((sp) => (
                                  <span
                                    key={sp.vendorOrderId}
                                    className="px-2 py-0.5 rounded bg-[#F9F2EC] border border-[#E5DCD3] text-[10px] font-medium"
                                  >
                                    {sp.vendorName}: {sp.status}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[#6E6859]">1 Supplier</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-[#5E5946]">
                              {formatINR(ord.grandTotal ?? ord.payableAmount ?? ord.totalAmount)}
                            </p>
                            <p className="text-[11px] text-[#6E6859]">
                              {ord.paymentMethod} • {ord.paymentStatus}
                            </p>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={statusBadgeVariant(ord.status)}>
                              {String(ord.status).replace(/_/g, ' ')}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {['DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(String(ord.status).toUpperCase()) && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => {
                                    setOtpModalOrder(ord);
                                    setOtpForm({ otp: ord.shipments?.[0]?.deliveryOtp || '', recipientName: ord.customerName || '', notes: '', markCompleted: true });
                                  }}
                                >
                                  <KeyRound className="w-3.5 h-3.5" /> Confirm OTP
                                </Button>
                              )}
                              <Button size="sm" variant="outline" onClick={() => openDetail(ord)}>
                                <Eye className="w-3.5 h-3.5" /> Inspect
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <TablePagination total={orders.length} page={page} pageSize={pageSize} onPageChange={setPage} />
            </>
          )}
        </Card>
      )}

      {/* Detailed Admin Drawer */}
      <Drawer
        open={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        title={selectedOrder ? `Order #${selectedOrder.orderNumber}` : 'Order Detail'}
        subtitle={selectedOrder ? `Status: ${String(selectedOrder.status).replace(/_/g, ' ')}` : undefined}
      >
        {selectedOrder && (
          <div className="space-y-5 text-xs">
            {/* Customer + Actions */}
            <div className="p-3.5 rounded-xl bg-[#FAF7F4] border border-[#E5DCD3] flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-bold text-[#5E5946]">{selectedOrder.customerName} ({selectedOrder.customerPhone})</p>
                <p className="text-[#6E6859]">
                  {[selectedOrder.deliveryAddress?.line1 || selectedOrder.deliveryAddress?.building, selectedOrder.deliveryAddress?.city, selectedOrder.deliveryAddress?.pincode]
                    .filter(Boolean)
                    .join(', ')}
                </p>
                {selectedOrder.gstin && <p className="font-mono text-[#5E5946] mt-0.5">Buyer GSTIN: {selectedOrder.gstin}</p>}
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setTransitModalOrder(selectedOrder);
                    setTransitForm({ status: 'IN_TRANSIT', location: 'Bengaluru Outer Ring Corridor', note: '', delayReason: '' });
                  }}
                >
                  Update Transit
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setOtpModalOrder(selectedOrder);
                    setOtpForm({
                      otp: selectedOrder.shipments?.[0]?.deliveryOtp || '',
                      recipientName: selectedOrder.customerName || '',
                      notes: '',
                      markCompleted: true,
                    });
                  }}
                >
                  Verify Delivery OTP
                </Button>
              </div>
            </div>

            {/* Vendor Fulfilment Splits */}
            <div className="space-y-2">
              <p className="font-bold uppercase text-[11px] text-[#6E6859]">
                Vendor Fulfilment Splits ({(selectedOrder.vendorSplits || []).length})
              </p>
              {(selectedOrder.vendorSplits || []).map((sp: any) => (
                <div key={sp.vendorOrderId} className="p-3 border border-[#E5DCD3] rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#5E5946] flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-[#AE887B]" /> {sp.vendorName}
                      {sp.vendorGstin ? <span className="font-mono text-[10px] text-[#6E6859]">({sp.vendorGstin})</span> : null}
                    </span>
                    <Badge variant={statusBadgeVariant(sp.status)}>{sp.status}</Badge>
                  </div>
                  <div className="text-[#6E6859]">
                    {(sp.items || []).map((it: any) => `${it.name} × ${it.quantity}`).join(', ')}
                  </div>
                  {sp.packingDetails && (
                    <p className="text-[11px] text-[#5E5946]">
                      Packed Weight: <strong>{sp.packingDetails.totalWeightKg} kg</strong> • Packages: {sp.packingDetails.packageCount}
                    </p>
                  )}
                  {sp.shipment && (
                    <p className="text-[11px] text-[#6E6859]">
                      Shipment: {sp.shipment.vehicleType} ({sp.shipment.vehicleNumber || 'Unassigned'}) • OTP: <strong>{sp.shipment.deliveryOtp}</strong>
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* GST Invoices */}
            <div className="space-y-2">
              <p className="font-bold uppercase text-[11px] text-[#6E6859]">
                Vendor GST Tax Invoices ({(selectedOrder.invoices || []).length})
              </p>
              {(selectedOrder.invoices || []).length === 0 ? (
                <p className="text-[#6E6859]">Invoices generate upon vendor dispatch or delivery confirmation.</p>
              ) : (
                <div className="space-y-2">
                  {(selectedOrder.invoices || []).map((inv: any) => (
                    <div key={inv.id} className="p-3 border border-[#E5DCD3] rounded-xl flex items-center justify-between bg-[#FAF7F4]">
                      <div>
                        <p className="font-bold text-[#5E5946] flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" /> {inv.invoiceNumber}
                        </p>
                        <p className="text-[11px] text-[#6E6859]">
                          {inv.supplierDetails?.legalBusinessName} ({inv.supplierDetails?.gstin}) • {formatINR(inv.totalAmount)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => adminApi.downloadOrderInvoicePdf(selectedOrder.orderNumber, inv.id, `${inv.invoiceNumber}.pdf`)}
                      >
                        <Download className="w-3.5 h-3.5" /> A4 PDF
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* History Timeline */}
            {Array.isArray(selectedOrder.timeline) && selectedOrder.timeline.length > 0 && (
              <div className="space-y-1.5">
                <p className="font-bold uppercase text-[11px] text-[#6E6859]">Audit & Timeline</p>
                <div className="border-l-2 border-[#E5DCD3] pl-3 space-y-2">
                  {selectedOrder.timeline.map((t: any, i: number) => (
                    <div key={i}>
                      <p className="font-semibold text-[#5E5946]">{t.title || t.status}</p>
                      <p className="text-[#6E6859]">{t.description}</p>
                      <p className="text-[10px] text-[#8E8577]">{formatDateTime(t.timestamp)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Transit Update Modal */}
      <Modal
        open={Boolean(transitModalOrder)}
        onClose={() => setTransitModalOrder(null)}
        title={`Update Transit Milestone • ${transitModalOrder?.orderNumber || ''}`}
      >
        <form onSubmit={handleTransitUpdate} className="space-y-3 text-xs">
          <select
            value={transitForm.status}
            onChange={(e) => setTransitForm({ ...transitForm, status: e.target.value })}
            className={inputClassName}
          >
            <option value="IN_TRANSIT">In Transit (Checked Hub / Corridor)</option>
            <option value="OUT_FOR_DELIVERY">Out For Delivery (Notify Site OTP)</option>
            <option value="DELIVERY_DELAYED">Delivery Delayed (Provide Reason)</option>
            <option value="FAILED_ATTEMPT">Failed Delivery Attempt</option>
          </select>
          <input
            placeholder="Verified Hub / Road Corridor (never fake GPS)..."
            value={transitForm.location}
            onChange={(e) => setTransitForm({ ...transitForm, location: e.target.value })}
            className={inputClassName}
          />
          <input
            placeholder="Delay / Failure reason (required if delayed/failed)..."
            value={transitForm.delayReason}
            onChange={(e) => setTransitForm({ ...transitForm, delayReason: e.target.value })}
            className={inputClassName}
          />
          <input
            placeholder="Operations note..."
            value={transitForm.note}
            onChange={(e) => setTransitForm({ ...transitForm, note: e.target.value })}
            className={inputClassName}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setTransitModalOrder(null)}>Cancel</Button>
            <Button type="submit">Update Transit</Button>
          </div>
        </form>
      </Modal>

      {/* Site OTP Delivery Confirmation Modal */}
      <Modal
        open={Boolean(otpModalOrder)}
        onClose={() => setOtpModalOrder(null)}
        title={`Verify Site Delivery OTP • ${otpModalOrder?.orderNumber || ''}`}
      >
        <form onSubmit={handleConfirmDeliveryOtp} className="space-y-3 text-xs">
          <p className="text-[#6E6859]">
            Delivery completion is enforced via the customer 4-digit site OTP. Issuing confirmation finalizes GST Tax Invoices and closes COD/settlement.
          </p>
          <input
            required
            placeholder="4-Digit Site Delivery OTP *"
            value={otpForm.otp}
            onChange={(e) => setOtpForm({ ...otpForm, otp: e.target.value })}
            className={`${inputClassName} font-mono tracking-widest`}
          />
          <input
            required
            placeholder="Receiving Site Engineer / Recipient Name *"
            value={otpForm.recipientName}
            onChange={(e) => setOtpForm({ ...otpForm, recipientName: e.target.value })}
            className={inputClassName}
          />
          <input
            placeholder="Unloading / Proof notes..."
            value={otpForm.notes}
            onChange={(e) => setOtpForm({ ...otpForm, notes: e.target.value })}
            className={inputClassName}
          />
          <label className="flex items-center gap-2 font-semibold text-[#5E5946]">
            <input
              type="checkbox"
              checked={otpForm.markCompleted}
              onChange={(e) => setOtpForm({ ...otpForm, markCompleted: e.target.checked })}
            />
            Mark Order Completed Immediately After Delivery
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOtpModalOrder(null)}>Cancel</Button>
            <Button type="submit">Verify OTP & Mark Delivered</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
