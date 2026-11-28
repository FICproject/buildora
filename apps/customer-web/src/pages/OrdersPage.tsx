import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  CreditCard,
  Download,
  FileText,
  KeyRound,
  MapPin,
  Package,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Truck,
  XCircle,
} from 'lucide-react';
import { useOrderStore } from '../store/useOrderStore';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { DeliveryTimeline } from '../components/orders/DeliveryTimeline';

const STAGE_ORDER: Record<string, number> = {
  ORDER_PLACED: 0,
  PAYMENT_PENDING: 0,
  PAYMENT_VERIFIED: 1,
  CONFIRMED: 2,
  PARTIALLY_ACCEPTED: 2,
  VENDOR_ACCEPTED: 2,
  ACCEPTED: 2,
  PICKING_IN_PROGRESS: 3,
  PICKING: 3,
  PROCESSING: 3,
  PACKING_IN_PROGRESS: 4,
  PACKED: 4,
  READY_FOR_DISPATCH: 5,
  PARTIALLY_DISPATCHED: 6,
  DISPATCHED: 6,
  IN_TRANSIT: 7,
  OUT_FOR_DELIVERY: 8,
  PARTIALLY_DELIVERED: 9,
  DELIVERED: 9,
  COMPLETED: 10,
};

function formatCurrency(val: number | undefined): string {
  return `₹${Math.round(Number(val || 0)).toLocaleString('en-IN')}`;
}

function formatStatusLabel(status?: string): string {
  return String(status || 'ORDER_PLACED').replace(/_/g, ' ');
}

function getStatusPillClass(status?: string): string {
  const st = String(status || '').toUpperCase();
  if (['DELIVERED', 'COMPLETED'].includes(st)) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (['CANCELLED', 'REJECTED', 'FAILED', 'FAILED_DELIVERY'].includes(st)) return 'bg-red-50 text-red-700 border-red-200';
  if (['DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'PARTIALLY_DISPATCHED'].includes(st)) {
    return 'bg-blue-50 text-blue-700 border-blue-200';
  }
  return 'bg-amber-50 text-amber-800 border-amber-200';
}

export const OrdersPage: React.FC = () => {
  const { orderId } = useParams<{ orderId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { orders, syncWithBackend, cancelOrder } = useOrderStore();

  const routeState = (location.state as {
    focusDelivery?: boolean;
    fromCheckout?: boolean;
  } | null) || null;
  const shouldFocusDelivery =
    Boolean(routeState?.focusDelivery) || searchParams.get('focus') === 'delivery';

  const deliverySectionRef = useRef<HTMLDivElement | null>(null);
  const scrolledForOrderRef = useRef<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [detailedOrder, setDetailedOrder] = useState<any>(null);
  const [activeSplitIdx, setActiveSplitIdx] = useState<number>(-1); // -1 = Master Order
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [toastMsg, setToastMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Modals
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [issueForm, setIssueForm] = useState<{ type: 'DAMAGED' | 'MISSING_ITEM' | 'WRONG_MATERIAL' | 'OTHER'; description: string }>({
    type: 'DAMAGED',
    description: '',
  });
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnForm, setReturnForm] = useState({ reason: 'Excess site material', comments: '' });

  const showToast = (type: 'ok' | 'err', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  useEffect(() => {
    void syncWithBackend();
  }, [syncWithBackend]);

  useEffect(() => {
    if (!orderId) {
      setDetailedOrder(null);
      setActiveSplitIdx(-1);
      return;
    }
    let mounted = true;
    const loadDetail = async () => {
      setLoading(true);
      try {
        const res = await api.getOrderDetails(orderId);
        if (mounted && res) {
          setDetailedOrder(res);
        } else if (mounted) {
          const fallback = await api.getOrderById(orderId);
          if (mounted && fallback) setDetailedOrder(fallback);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void loadDetail();

    const handleRealtimeRefresh = () => {
      void loadDetail();
    };
    window.addEventListener('buildora:realtime:order', handleRealtimeRefresh);
    window.addEventListener('buildora:realtime:payment', handleRealtimeRefresh);

    // Lightweight background revalidation every 15s while order is active
    const pollTimer = setInterval(() => {
      void loadDetail();
    }, 15000);

    return () => {
      mounted = false;
      clearInterval(pollTimer);
      window.removeEventListener('buildora:realtime:order', handleRealtimeRefresh);
      window.removeEventListener('buildora:realtime:payment', handleRealtimeRefresh);
    };
  }, [orderId]);

  useEffect(() => {
    if (
      orderId &&
      detailedOrder &&
      shouldFocusDelivery &&
      scrolledForOrderRef.current !== orderId
    ) {
      scrolledForOrderRef.current = orderId;
      const t = setTimeout(() => {
        deliverySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return () => clearTimeout(t);
    }
  }, [orderId, detailedOrder, shouldFocusDelivery]);

  const currentOrder: any = useMemo(() => {
    if (!orderId) return null;
    if (detailedOrder) return detailedOrder;
    return orders.find(
      (o) =>
        o.id.toLowerCase() === orderId.toLowerCase() ||
        o.orderNumber.toLowerCase() === orderId.toLowerCase()
    );
  }, [orderId, detailedOrder, orders]);

  const filteredOrders = useMemo(() => {
    let list = [...orders];
    if (statusFilter === 'ACTIVE') {
      list = list.filter(
        (o) => !['DELIVERED', 'COMPLETED', 'CANCELLED', 'REJECTED'].includes(String(o.status).toUpperCase())
      );
    } else if (statusFilter === 'IN_TRANSIT') {
      list = list.filter((o) =>
        ['DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'PARTIALLY_DISPATCHED'].includes(String(o.status).toUpperCase())
      );
    } else if (statusFilter === 'DELIVERED') {
      list = list.filter((o) => ['DELIVERED', 'COMPLETED', 'PARTIALLY_DELIVERED'].includes(String(o.status).toUpperCase()));
    } else if (statusFilter === 'CANCELLED') {
      list = list.filter((o) => ['CANCELLED', 'REJECTED', 'RETURNED'].includes(String(o.status).toUpperCase()));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (o: any) =>
          String(o.orderNumber || '').toLowerCase().includes(q) ||
          (o.items || []).some((i: any) => String(i.name || '').toLowerCase().includes(q))
      );
    }
    return list;
  }, [orders, statusFilter, searchQuery]);

  const handleDownloadInvoice = async (invId?: string, invNumber?: string) => {
    if (!currentOrder) return;
    const invoices: any[] = currentOrder.invoices || [];
    if (!invId && invoices.length > 1) {
      setInvoiceModalOpen(true);
      return;
    }
    const targetId = invId || invoices[0]?.id || invoices[0]?.invoiceNumber || 'primary';
    const fname = invNumber ? `${invNumber}.pdf` : `Tax-Invoice-${currentOrder.orderNumber}.pdf`;
    setDownloadingId(targetId);
    try {
      await api.downloadOrderInvoicePdf(currentOrder.orderNumber, targetId, fname);
      showToast('ok', `Downloaded ${fname}`);
    } catch (e: any) {
      showToast('err', e.message || 'Unable to generate PDF invoice.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadSummaryPdf = async () => {
    if (!currentOrder) return;
    setDownloadingId('summary');
    try {
      await api.downloadOrderSummaryPdf(currentOrder.orderNumber);
      showToast('ok', `Downloaded Order-Summary-${currentOrder.orderNumber}.pdf`);
    } catch (e: any) {
      showToast('err', e.message || 'Failed to download summary PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleCancel = async () => {
    if (!currentOrder) return;
    try {
      await api.cancelOrder(currentOrder.orderNumber, 'Customer requested pre-dispatch cancellation');
      await cancelOrder(currentOrder.id);
      const updated = await api.getOrderDetails(currentOrder.orderNumber);
      if (updated) setDetailedOrder(updated);
      showToast('ok', `Order #${currentOrder.orderNumber} cancelled and refund initiated.`);
    } catch (err: any) {
      showToast('err', err.message || 'Cannot cancel this order at current stage.');
    }
  };

  const handleReportIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrder) return;
    const res = await api.reportOrderIssue(currentOrder.orderNumber, issueForm);
    if (res?.success) {
      showToast('ok', 'Damaged / missing material claim submitted.');
      setIssueModalOpen(false);
      const updated = await api.getOrderDetails(currentOrder.orderNumber);
      if (updated) setDetailedOrder(updated);
    } else {
      showToast('err', res?.message || 'Failed to submit issue.');
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrder) return;
    await api.requestReturn(currentOrder.orderNumber, returnForm);
    showToast('ok', 'Return request logged.');
    setReturnModalOpen(false);
    const updated = await api.getOrderDetails(currentOrder.orderNumber);
    if (updated) setDetailedOrder(updated);
  };

  // DETAIL VIEW
  if (orderId) {
    if (loading && !currentOrder) {
      return (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-sm text-slate-500">
          Loading order details & GST invoices...
        </div>
      );
    }
    if (!currentOrder) {
      return (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
          <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-800">Order not found</h2>
          <p className="text-xs text-slate-500 mt-1 mb-4">We could not locate order {orderId}.</p>
          <Button onClick={() => navigate('/account/orders')}>Back to All Orders</Button>
        </div>
      );
    }

    const vendorSplits: any[] = currentOrder.vendorSplits || [];
    const activeSplit = activeSplitIdx >= 0 ? vendorSplits[activeSplitIdx] : null;
    const displayStatus = String(activeSplit ? activeSplit.status : currentOrder.status || 'ORDER_PLACED').toUpperCase();
    const currentStageIdx = STAGE_ORDER[displayStatus] ?? 0;
    const isCancelled = ['CANCELLED', 'REJECTED'].includes(displayStatus);

    const activeShipment = activeSplit?.shipment || (currentOrder.shipments && currentOrder.shipments[0]) || null;
    const activeInvoice =
      activeSplit?.invoice ||
      (currentOrder.invoices && currentOrder.invoices[0]) ||
      null;
    const allInvoices: any[] = currentOrder.invoices || [];
    const displayItems: any[] = activeSplit ? activeSplit.items : currentOrder.items || [];
    const deliveryAddr: any = currentOrder.deliveryAddress || {};

    const timelineEntries: any[] = Array.isArray(currentOrder.timeline) ? currentOrder.timeline : [];

    return (
      <div className="space-y-5">
        {toastMsg && (
          <div
            className={`px-4 py-3 rounded-xl border text-xs font-medium flex items-center justify-between ${
              toastMsg.type === 'ok'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <span>{toastMsg.text}</span>
            <button onClick={() => setToastMsg(null)} className="ml-3 underline">Dismiss</button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <Link
            to="/account/orders"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to All Orders
          </Link>
          <span className="text-xs text-slate-500">
            Placed on {new Date(currentOrder.createdAt).toLocaleString('en-IN')}
          </span>
        </div>

        {/* Main Order Header Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <p className="text-[11px] font-bold tracking-wider uppercase text-slate-400">ORDER REFERENCE</p>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                {currentOrder.orderNumber}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Dispatch Mode:{' '}
                <span className="font-semibold text-slate-700">
                  {String(currentOrder.deliverySpeed || 'ASAP 60').replace('_', ' ')}
                </span>
                {' • '}ETA:{' '}
                <span className="font-semibold text-slate-700">
                  {currentOrder.estimatedDeliveryTime || 'Within 60 minutes'}
                </span>
                {vendorSplits.length > 1 && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold text-[10px]">
                    {vendorSplits.length} Supplier Shipments
                  </span>
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full border text-[11px] font-bold uppercase ${getStatusPillClass(
                  currentOrder.status
                )}`}
              >
                {formatStatusLabel(currentOrder.status)}
              </span>

              <button
                type="button"
                disabled={downloadingId !== null}
                onClick={() => handleDownloadInvoice()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-sm transition"
              >
                <Download className="w-3.5 h-3.5" />
                {downloadingId && downloadingId !== 'summary'
                  ? 'Downloading...'
                  : allInvoices.length > 1
                  ? `Tax Invoices (${allInvoices.length})`
                  : 'Tax Invoice'}
              </button>

              <button
                type="button"
                disabled={downloadingId === 'summary'}
                onClick={handleDownloadSummaryPdf}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium transition"
                title="Consolidated customer summary statement (not a tax invoice)"
              >
                <FileText className="w-3.5 h-3.5" />
                Order Summary
              </button>
            </div>
          </div>

          {/* Multi-vendor split selector */}
          {vendorSplits.length > 1 && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
              <p className="text-[11px] font-bold uppercase text-slate-500">
                Multi-Vendor Fulfilment Splits ({vendorSplits.length} Suppliers)
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSplitIdx(-1)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                    activeSplitIdx === -1
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  All Suppliers ({vendorSplits.length})
                </button>
                {vendorSplits.map((sp: any, idx: number) => (
                  <button
                    key={sp.vendorOrderId}
                    type="button"
                    onClick={() => setActiveSplitIdx(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-2 transition ${
                      activeSplitIdx === idx
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{sp.vendorName}</span>
                    <span className="text-[10px] opacity-80">({formatStatusLabel(sp.status)})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* VERTICAL DELIVERY PROGRESS TIMELINE */}
          <div ref={deliverySectionRef} id="delivery-progress" className="space-y-3 scroll-mt-24">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-wider uppercase text-slate-500">
                DELIVERY PROGRESS {activeSplit ? `• ${activeSplit.vendorName}` : ''}
              </p>
              <button
                type="button"
                onClick={async () => {
                  const updated = await api.getOrderDetails(currentOrder.orderNumber);
                  if (updated) setDetailedOrder(updated);
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue-800 hover:underline cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh Status
              </button>
            </div>

            {isCancelled ? (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-800 text-xs">
                <XCircle className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-bold">Order {formatStatusLabel(displayStatus)}</p>
                  <p className="text-red-700 mt-0.5">
                    {timelineEntries[timelineEntries.length - 1]?.description ||
                      'This order was cancelled / rejected prior to delivery.'}
                  </p>
                </div>
              </div>
            ) : (
              <DeliveryTimeline
                order={currentOrder}
                activeSplit={activeSplit}
                activeSplitIdx={activeSplitIdx}
                onSelectSplit={setActiveSplitIdx}
              />
            )}
          </div>

          {/* ITEMIZED MATERIALS */}
          <div className="space-y-3 pt-2">
            <p className="text-[11px] font-bold tracking-wider uppercase text-slate-500">
              ITEMIZED MATERIALS ({displayItems.length})
            </p>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {displayItems.map((item: any, idx: number) => {
                const qty = Number(item.quantity || 1);
                const unitPrice = Number(item.unitPrice ?? item.price ?? 0);
                const total = Number(item.totalPrice ?? unitPrice * qty);
                return (
                  <div key={`${item.productId}-${idx}`} className="p-3.5 sm:p-4 bg-white flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <img
                        src={item.image || item.thumbnail || 'https://placehold.co/80x80?text=Material'}
                        alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-50"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{item.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {item.brand ? `Brand: ${item.brand} • ` : ''}
                          SKU: {item.sku || '—'}
                          {item.hsnCode ? ` • HSN: ${item.hsnCode}` : ''}
                        </p>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Qty: <span className="font-semibold">{qty}</span> {item.unit || 'Unit'} • Unit: {formatCurrency(unitPrice)}
                        </p>
                        {item.shortageQuantity > 0 && (
                          <p className="text-[11px] font-semibold text-amber-700 mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Shortage reported ({item.pickedQuantity}/{qty}): {item.shortageReason}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-extrabold text-slate-900">{formatCurrency(total)}</p>
                      <p className="text-[11px] text-slate-500">
                        {item.gstRate ? `GST ${item.gstRate}%` : 'Incl. applicable GST'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SITE ADDRESS + DISPATCH / VENDOR / OTP + PAYMENT BREAKDOWN */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
            {/* Left column: Address + Dispatch + OTP */}
            <div className="space-y-4">
              <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <MapPin className="w-4 h-4 text-orange-600" />
                  <span>Site Delivery Address</span>
                </div>
                <p className="text-xs font-bold text-slate-900">
                  {deliveryAddr.recipientName || currentOrder.customerName || 'Site Contact'}
                </p>
                <p className="text-xs text-slate-600">
                  {[deliveryAddr.building || deliveryAddr.line1, deliveryAddr.area, deliveryAddr.city, deliveryAddr.state, deliveryAddr.pincode]
                    .filter(Boolean)
                    .join(', ')}
                </p>
                <p className="text-xs text-slate-500">
                  Phone: {deliveryAddr.mobile || currentOrder.customerPhone || '—'}
                </p>
                {currentOrder.gstin && (
                  <p className="text-xs font-semibold text-slate-700">
                    Buyer GSTIN: {currentOrder.gstin} {currentOrder.companyName ? `(${currentOrder.companyName})` : ''}
                  </p>
                )}
              </div>

              <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <Truck className="w-4 h-4 text-blue-600" />
                    <span>Assigned Delivery Vehicle & Supplier</span>
                  </div>
                  {activeShipment?.deliveryOtp && displayStatus !== 'DELIVERED' && displayStatus !== 'COMPLETED' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 border border-amber-300 text-amber-900 text-xs font-extrabold">
                      <KeyRound className="w-3.5 h-3.5" />
                      Site OTP: {activeShipment.deliveryOtp}
                    </span>
                  )}
                </div>

                {activeSplit && (
                  <p className="text-xs text-slate-700">
                    Supplier: <span className="font-semibold">{activeSplit.vendorName}</span>
                  </p>
                )}

                {activeShipment || currentOrder.deliveryPartner ? (
                  <div className="text-xs text-slate-600 space-y-1">
                    <p>
                      Fleet Partner:{' '}
                      <span className="font-semibold text-slate-900">
                        {activeShipment?.partnerName || currentOrder.deliveryPartner?.name || 'Buildora Heavy Fleet'}
                      </span>
                      {' • '}
                      {activeShipment?.vehicleType || currentOrder.vehicleType || 'Commercial Vehicle'}
                    </p>
                    <p>
                      Driver:{' '}
                      <span className="font-semibold text-slate-900">
                        {activeShipment?.driverName || currentOrder.driverName || 'Assigned at Dispatch'}
                      </span>
                      {(activeShipment?.driverPhone || currentOrder.deliveryPartner?.phone) && (
                        <span> • {activeShipment?.driverPhone || currentOrder.deliveryPartner?.phone}</span>
                      )}
                    </p>
                    <p>
                      Vehicle No:{' '}
                      <span className="font-mono font-semibold text-slate-800">
                        {activeShipment?.vehicleNumber || currentOrder.deliveryPartner?.vehicleNumber || 'Pending assignment'}
                      </span>
                      {activeShipment?.totalWeightKg ? ` • Load: ${activeShipment.totalWeightKg} kg` : ''}
                    </p>
                    {activeShipment?.lastKnownLocation && (
                      <p className="text-blue-700 font-medium">
                        Latest Checkpoint: {activeShipment.lastKnownLocation}
                      </p>
                    )}
                    {activeShipment?.delayReason && (
                      <p className="text-amber-700 font-medium">
                        Transit Note: {activeShipment.delayReason}
                      </p>
                    )}
                    {activeShipment?.recipientName && (
                      <p className="text-emerald-700 font-semibold">
                        Handed over to: {activeShipment.recipientName}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    Vehicle & driver details will appear once vendor completes packing and staging.
                  </p>
                )}
              </div>
            </div>

            {/* Right column: Payment & Taxes Breakdown */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>Payment & Taxes Breakdown</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Material Subtotal</span>
                  <span className="font-medium text-slate-900">{formatCurrency(currentOrder.subtotal)}</span>
                </div>
                {Number(currentOrder.discountTotal || 0) > 0 && (
                  <div className="flex justify-between text-xs text-emerald-700">
                    <span>Promo / Discount</span>
                    <span>-{formatCurrency(currentOrder.discountTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-slate-600">
                  <span>
                    {activeInvoice?.isInterState
                      ? 'IGST Tax Component'
                      : 'GST Component (CGST + SGST)'}
                  </span>
                  <span className="font-medium text-slate-900">{formatCurrency(currentOrder.gstTotal)}</span>
                </div>
                {activeInvoice && (
                  <div className="flex justify-between text-[11px] text-slate-500 pl-2">
                    <span>
                      {activeInvoice.isInterState
                        ? `IGST: ₹${activeInvoice.igstAmount}`
                        : `CGST: ₹${activeInvoice.cgstAmount} • SGST: ₹${activeInvoice.sgstAmount}`}
                    </span>
                    <span>{activeInvoice.invoiceNumber}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Priority Site Delivery Fee</span>
                  <span className="font-medium text-slate-900">{formatCurrency(currentOrder.deliveryFee)}</span>
                </div>
                {Number(currentOrder.unloadingFee || 0) > 0 && (
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Ground-Floor Unloading Assistance</span>
                    <span className="font-medium text-slate-900">{formatCurrency(currentOrder.unloadingFee)}</span>
                  </div>
                )}
                {Number(currentOrder.walletUsed || 0) > 0 && (
                  <div className="flex justify-between text-xs text-emerald-700">
                    <span>Buildora Wallet Applied</span>
                    <span>-{formatCurrency(currentOrder.walletUsed)}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 pt-3 space-y-1.5">
                <div className="flex justify-between items-center text-sm font-extrabold text-slate-900">
                  <span>{currentOrder.paymentStatus === 'PAID' ? 'Total Paid' : 'Total Payable'}</span>
                  <span>
                    {formatCurrency(
                      currentOrder.grandTotal ?? currentOrder.payableAmount ?? currentOrder.totalAmount
                    )}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Method: <span className="font-semibold text-slate-700">{currentOrder.paymentMethod || 'COD'}</span>
                  {' • '}Status:{' '}
                  <span className="font-semibold text-slate-700">{currentOrder.paymentStatus || 'PENDING'}</span>
                </p>
                {currentOrder.razorpayPaymentId && (
                  <p className="text-[11px] font-mono text-slate-400">
                    Payment Ref: {currentOrder.razorpayPaymentId}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Footer Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="flex flex-wrap gap-2">
              {currentOrder.canCancel !== false && !isCancelled && currentStageIdx < 6 && (
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  <XCircle className="w-3.5 h-3.5 mr-1.5 text-red-600" />
                  Cancel Order (Pre-Dispatch)
                </Button>
              )}
              {!isCancelled && currentStageIdx >= 6 && currentStageIdx < 9 && (
                <span className="text-[11px] text-slate-500 inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-lg">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                  Dispatched — direct cancellation closed
                </span>
              )}
              <Button variant="outline" size="sm" onClick={() => setIssueModalOpen(true)}>
                <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                Report Damaged / Missing
              </Button>
              {(displayStatus === 'DELIVERED' || displayStatus === 'COMPLETED') && (
                <Button variant="outline" size="sm" onClick={() => setReturnModalOpen(true)}>
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5 text-slate-700" />
                  Request Return
                </Button>
              )}
            </div>
            {currentOrder.issueReported && (
              <span className="text-xs text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg font-medium">
                Issue Open ({currentOrder.issueReported.type}): {currentOrder.issueReported.description}
              </span>
            )}
          </div>
        </div>

        {/* Multi-Vendor Tax Invoices Modal */}
        <Modal
          isOpen={invoiceModalOpen}
          onClose={() => setInvoiceModalOpen(false)}
          title="Download Supplier GST Tax Invoices"
        >
          <div className="space-y-3 text-xs">
            <p className="text-slate-600">
              In multi-vendor orders, each supplying vendor issues a separate legal GST Tax Invoice under their own registered GSTIN.
            </p>
            <div className="space-y-2">
              {allInvoices.map((inv: any) => (
                <div
                  key={inv.id}
                  className="p-3 border border-slate-200 rounded-xl flex items-center justify-between gap-3 bg-slate-50"
                >
                  <div>
                    <p className="font-bold text-slate-900">{inv.invoiceNumber}</p>
                    <p className="text-slate-600 mt-0.5">
                      Supplier: {inv.supplierDetails?.legalBusinessName || inv.vendorId}
                    </p>
                    <p className="text-[11px] font-mono text-slate-500">
                      GSTIN: {inv.supplierDetails?.gstin || '—'} • Total: {formatCurrency(inv.totalAmount)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleDownloadInvoice(inv.id, inv.invoiceNumber)}
                  >
                    <Download className="w-3.5 h-3.5 mr-1" />
                    PDF
                  </Button>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
              <span className="text-[11px] text-slate-500">Need a single non-tax order receipt?</span>
              <Button variant="outline" size="sm" onClick={handleDownloadSummaryPdf}>
                Order Summary PDF
              </Button>
            </div>
          </div>
        </Modal>

        {/* Report Damaged/Missing Modal */}
        <Modal
          isOpen={issueModalOpen}
          onClose={() => setIssueModalOpen(false)}
          title="Report Damaged or Missing Material"
        >
          <form onSubmit={handleReportIssue} className="space-y-3 text-xs">
            <label className="block font-semibold text-slate-700">Issue Type</label>
            <select
              value={issueForm.type}
              onChange={(e) => setIssueForm({ ...issueForm, type: e.target.value as any })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="DAMAGED">Damaged Material on Arrival</option>
              <option value="MISSING_ITEM">Missing Units / Shortage</option>
              <option value="WRONG_MATERIAL">Wrong Grade / Material Delivered</option>
              <option value="OTHER">Other Quality Concern</option>
            </select>
            <label className="block font-semibold text-slate-700">Description</label>
            <textarea
              required
              rows={3}
              placeholder="Mention item SKU, damaged quantity, and site condition..."
              value={issueForm.description}
              onChange={(e) => setIssueForm({ ...issueForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIssueModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Submit Claim</Button>
            </div>
          </form>
        </Modal>

        {/* Return Modal */}
        <Modal
          isOpen={returnModalOpen}
          onClose={() => setReturnModalOpen(false)}
          title="Request Site Return / Surplus Pickup"
        >
          <form onSubmit={handleReturnSubmit} className="space-y-3 text-xs">
            <input
              required
              placeholder="Primary reason (e.g., Unopened surplus bags)"
              value={returnForm.reason}
              onChange={(e) => setReturnForm({ ...returnForm, reason: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
            <textarea
              rows={3}
              placeholder="Additional notes (seal condition, pickup window)..."
              value={returnForm.comments}
              onChange={(e) => setReturnForm({ ...returnForm, comments: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setReturnModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Submit Return Request</Button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">My Site Orders</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track live material dispatch, supplier splits, delivery OTPs, and download GST Tax Invoices.
          </p>
        </div>
        <button
          type="button"
          onClick={() => syncWithBackend()}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Orders
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'ALL', label: 'All Orders' },
            { id: 'ACTIVE', label: 'In Progress' },
            { id: 'IN_TRANSIT', label: 'Dispatched / Transit' },
            { id: 'DELIVERED', label: 'Delivered' },
            { id: 'CANCELLED', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order # or material..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
          />
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-800">No matching orders found</p>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Browse verified construction materials and place your first order.
          </p>
          <Link to="/products">
            <Button>Browse Materials</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order: any) => {
            const splitCount = Array.isArray(order.vendorSplits) ? order.vendorSplits.length : 1;
            const total = order.grandTotal ?? order.payableAmount ?? order.totalAmount ?? 0;
            return (
              <div
                key={order.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 hover:border-slate-300 transition shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-sm font-extrabold text-slate-900">{order.orderNumber}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase ${getStatusPillClass(
                        order.status
                      )}`}
                    >
                      {formatStatusLabel(order.status)}
                    </span>
                    {splitCount > 1 && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-semibold">
                        {splitCount} Suppliers
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(order.createdAt).toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3">
                  <div className="text-xs text-slate-600 space-y-1">
                    <p className="font-medium text-slate-800">
                      {(order.items || []).slice(0, 2).map((i: any) => `${i.name} × ${i.quantity}`).join(', ')}
                      {(order.items || []).length > 2 ? ` +${order.items.length - 2} more` : ''}
                    </p>
                    <p>
                      Payment: <span className="font-semibold">{order.paymentMethod || 'COD'}</span> ({order.paymentStatus || 'PENDING'}) • Total:{' '}
                      <span className="font-bold text-slate-900">{formatCurrency(total)}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to={`/account/orders/${encodeURIComponent(order.orderNumber)}?focus=delivery`}
                      state={{ focusDelivery: true }}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Track
                    </Link>
                    <Link
                      to={`/account/orders/${encodeURIComponent(order.orderNumber)}`}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
                    >
                      Order Details &amp; Invoice
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
