import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Box,
  CheckCircle2,
  ClipboardCheck,
  Download,
  Eye,
  FileText,
  Package,
  RefreshCw,
  Search,
  ShieldAlert,
  Truck,
  XCircle,
} from 'lucide-react';
import { useVendorOrderStore } from '../../store/useVendorOrderStore';
import { vendorApi } from '../../services/vendorApi';
import { toast } from '../../store/useToastStore';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { Drawer } from '../../components/common/Drawer';

const TABS = [
  { id: 'ALL', label: 'All Orders' },
  { id: 'NEW', label: 'New Requests' },
  { id: 'ACCEPTED', label: 'Accepted' },
  { id: 'PICKING', label: 'Picking' },
  { id: 'PACKING', label: 'Packing' },
  { id: 'READY_FOR_DISPATCH', label: 'Ready Dispatch' },
  { id: 'TRANSIT', label: 'Dispatched / Transit' },
  { id: 'COMPLETED', label: 'Delivered & Closed' },
  { id: 'CANCELLED', label: 'Rejected / Cancelled' },
];

function getStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  const st = String(status || '').toUpperCase();
  if (['DELIVERED', 'COMPLETED'].includes(st)) return 'success';
  if (['REJECTED', 'CANCELLED', 'FAILED_ATTEMPT'].includes(st)) return 'danger';
  if (['DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'READY_FOR_DISPATCH'].includes(st)) return 'info';
  if (['NEW'].includes(st)) return 'warning';
  return 'neutral';
}

export const VendorOrdersPage: React.FC = () => {
  const {
    orders,
    isLoading,
    fetchOrders,
    acceptOrder,
    rejectOrder,
    confirmPicking,
    confirmPacking,
    markReadyForDispatch,
    handoverToDriver,
  } = useVendorOrderStore();

  const [activeTab, setActiveTab] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Reject Modal
  const [rejectModalOrder, setRejectModalOrder] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Picking Modal
  const [pickingOrder, setPickingOrder] = useState<any>(null);
  const [pickedDraft, setPickedDraft] = useState<
    Array<{ productId: string; sku: string; name: string; ordered: number; pickedQuantity: number; shortageReason: string }>
  >([]);
  const [pickingNotes, setPickingNotes] = useState('');

  // Packing Modal
  const [packingOrder, setPackingOrder] = useState<any>(null);
  const [packingForm, setPackingForm] = useState({
    bagCount: 0,
    boxCount: 1,
    bundleCount: 0,
    pieceCount: 0,
    palletCount: 0,
    totalWeightKg: 25,
    dimensions: 'Standard Commercial Pack',
    fragileHandling: false,
    loadingRequirements: '',
    markReadyForDispatch: true,
  });

  // Handover Modal
  const [handoverOrder, setHandoverOrder] = useState<any>(null);
  const [handoverForm, setHandoverForm] = useState({
    vehicleNumber: '',
    driverName: '',
    driverPhone: '',
    handoverRef: '',
    notes: '',
  });

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const kpis = useMemo(() => {
    const count = (statuses: string[]) =>
      orders.filter((o) => statuses.includes(String(o.status || '').toUpperCase())).length;
    return [
      { label: 'Total Orders', value: orders.length, tab: 'ALL' },
      { label: 'New Orders', value: count(['NEW']), tab: 'NEW' },
      { label: 'Accepted', value: count(['VENDOR_ACCEPTED', 'ACCEPTED']), tab: 'ACCEPTED' },
      { label: 'Picking', value: count(['PICKING_IN_PROGRESS', 'PROCESSING']), tab: 'PICKING' },
      { label: 'Packing', value: count(['PACKING_IN_PROGRESS', 'PACKED']), tab: 'PACKING' },
      { label: 'Ready Dispatch', value: count(['READY_FOR_DISPATCH']), tab: 'READY_FOR_DISPATCH' },
      { label: 'Dispatched / Transit', value: count(['DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY']), tab: 'TRANSIT' },
      { label: 'Delivered & Closed', value: count(['DELIVERED', 'COMPLETED']), tab: 'COMPLETED' },
      { label: 'Rejected / Cancelled', value: count(['REJECTED', 'CANCELLED']), tab: 'CANCELLED' },
    ];
  }, [orders]);

  const filteredOrders = useMemo(() => {
    let list = [...orders];
    if (activeTab === 'NEW') list = list.filter((o) => o.status === 'NEW');
    else if (activeTab === 'ACCEPTED') list = list.filter((o) => ['VENDOR_ACCEPTED', 'ACCEPTED'].includes(o.status));
    else if (activeTab === 'PICKING') list = list.filter((o) => ['PICKING_IN_PROGRESS', 'PROCESSING'].includes(o.status));
    else if (activeTab === 'PACKING') list = list.filter((o) => ['PACKING_IN_PROGRESS', 'PACKED'].includes(o.status));
    else if (activeTab === 'READY_FOR_DISPATCH') list = list.filter((o) => o.status === 'READY_FOR_DISPATCH');
    else if (activeTab === 'TRANSIT') list = list.filter((o) => ['DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(o.status));
    else if (activeTab === 'COMPLETED') list = list.filter((o) => ['DELIVERED', 'COMPLETED'].includes(o.status));
    else if (activeTab === 'CANCELLED') list = list.filter((o) => ['REJECTED', 'CANCELLED'].includes(o.status));

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (o) =>
          String(o.orderNumber || o.id).toLowerCase().includes(q) ||
          String(o.customerName || '').toLowerCase().includes(q) ||
          (o.items || []).some(
            (i: any) =>
              String(i.name || '').toLowerCase().includes(q) ||
              String(i.sku || '').toLowerCase().includes(q)
          )
      );
    }
    return list;
  }, [orders, activeTab, search]);

  const refreshSelected = (id: string) => {
    const fresh = useVendorOrderStore.getState().orders.find((o) => o.id === id);
    if (fresh) setSelectedOrder(fresh);
  };

  const handleAccept = async (order: any) => {
    setBusyId(order.id);
    try {
      await acceptOrder(order.id);
      toast.success(`Accepted #${order.orderNumber} after stock verification.`);
      refreshSelected(order.id);
    } catch (e: any) {
      toast.error(e?.message || 'Unable to accept order.');
    } finally {
      setBusyId(null);
    }
  };

  const submitReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalOrder) return;
    setBusyId(rejectModalOrder.id);
    try {
      await rejectOrder(rejectModalOrder.id, rejectReason);
      toast.success(`Rejected split #${rejectModalOrder.orderNumber}. Stock released.`);
      const id = rejectModalOrder.id;
      setRejectModalOrder(null);
      setRejectReason('');
      refreshSelected(id);
    } catch (err: any) {
      toast.error(err?.message || 'Rejection failed.');
    } finally {
      setBusyId(null);
    }
  };

  const openPickingModal = (order: any) => {
    setPickingOrder(order);
    setPickingNotes('');
    setPickedDraft(
      (order.items || []).map((i: any) => ({
        productId: i.productId,
        sku: i.sku || '',
        name: i.name,
        ordered: Number(i.quantity || 1),
        pickedQuantity: Number(i.pickedQuantity ?? i.quantity ?? 1),
        shortageReason: i.shortageReason || '',
      }))
    );
  };

  const submitPicking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickingOrder) return;
    setBusyId(pickingOrder.id);
    try {
      await confirmPicking(pickingOrder.id, {
        pickedItems: pickedDraft.map((p) => ({
          productId: p.productId,
          sku: p.sku,
          pickedQuantity: Number(p.pickedQuantity),
          shortageReason: p.pickedQuantity < p.ordered ? p.shortageReason : undefined,
        })),
        notes: pickingNotes,
      });
      toast.success(`Picking confirmed for #${pickingOrder.orderNumber}.`);
      const id = pickingOrder.id;
      setPickingOrder(null);
      refreshSelected(id);
    } catch (err: any) {
      toast.error(err?.message || 'Picking submission failed.');
    } finally {
      setBusyId(null);
    }
  };

  const openPackingModal = (order: any) => {
    setPackingOrder(order);
    const estWeight = Math.max(
      10,
      (order.items || []).reduce((s: number, i: any) => s + Number(i.quantity || 1) * 15, 0)
    );
    setPackingForm({
      bagCount: 0,
      boxCount: Math.max(1, (order.items || []).length),
      bundleCount: 0,
      pieceCount: 0,
      palletCount: 0,
      totalWeightKg: order.packingDetails?.totalWeightKg || estWeight,
      dimensions: order.packingDetails?.dimensions || 'Standard Construction Load',
      fragileHandling: Boolean(order.packingDetails?.fragileHandling),
      loadingRequirements: order.packingDetails?.loadingRequirements || '',
      markReadyForDispatch: true,
    });
  };

  const submitPacking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packingOrder) return;
    setBusyId(packingOrder.id);
    try {
      await confirmPacking(packingOrder.id, packingForm);
      toast.success(
        packingForm.markReadyForDispatch
          ? `Packed & staged #${packingOrder.orderNumber} for Dispatch.`
          : `Packing specs saved for #${packingOrder.orderNumber}.`
      );
      const id = packingOrder.id;
      setPackingOrder(null);
      refreshSelected(id);
    } catch (err: any) {
      toast.error(err?.message || 'Packing failed.');
    } finally {
      setBusyId(null);
    }
  };

  const handleMarkReady = async (order: any) => {
    setBusyId(order.id);
    try {
      await markReadyForDispatch(order.id);
      toast.success(`#${order.orderNumber} is Ready for Dispatch.`);
      refreshSelected(order.id);
    } catch (err: any) {
      toast.error(err?.message || 'Unable to stage for dispatch.');
    } finally {
      setBusyId(null);
    }
  };

  const openHandoverModal = (order: any) => {
    setHandoverOrder(order);
    setHandoverForm({
      vehicleNumber: order.shipment?.vehicleNumber || order.vehicleNumber || '',
      driverName: order.shipment?.driverName || order.deliveryPartnerName || '',
      driverPhone: order.shipment?.driverPhone || order.deliveryPartnerPhone || '',
      handoverRef: `GATE-${Date.now().toString().slice(-5)}`,
      notes: '',
    });
  };

  const submitHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoverOrder) return;
    setBusyId(handoverOrder.id);
    try {
      await handoverToDriver(handoverOrder.id, handoverForm);
      toast.success(`Dispatched #${handoverOrder.orderNumber} & generated supplier GST Invoice.`);
      const id = handoverOrder.id;
      setHandoverOrder(null);
      refreshSelected(id);
    } catch (err: any) {
      toast.error(err?.message || 'Handover failed.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDownloadPdf = async (order: any) => {
    const inv = order.invoice;
    if (!inv) {
      toast.error('Tax invoice is generated automatically upon Dispatch.');
      return;
    }
    try {
      await vendorApi.downloadInvoicePdf(inv.id, `${inv.invoiceNumber}.pdf`);
      toast.success(`Downloaded ${inv.invoiceNumber}.pdf`);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to download PDF.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders & Depot Fulfilment"
        description="Verify stock, pick construction materials, record packing weights, handover to vehicles, and issue GST invoices."
        actions={
          <Button variant="outline" size="sm" onClick={() => fetchOrders()} isLoading={isLoading}>
            <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh Orders
          </Button>
        }
      />

      {/* 9 KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-2.5">
        {kpis.map((k) => (
          <button
            key={k.label}
            type="button"
            onClick={() => setActiveTab(k.tab)}
            className={`text-left p-3 rounded-xl border transition ${
              activeTab === k.tab
                ? 'bg-[#FBF3F0] border-[#943D24] shadow-sm'
                : 'bg-white border-[#E7E5E4] hover:border-[#943D24]/50'
            }`}
          >
            <p className="text-[11px] font-medium text-[#78716C] truncate">{k.label}</p>
            <p className="text-xl font-bold text-[#292524] mt-1">{k.value}</p>
          </button>
        ))}
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                activeTab === t.id
                  ? 'bg-[#943D24] text-white border-[#943D24]'
                  : 'bg-white text-[#57534E] border-[#E7E5E4] hover:bg-[#FAF7F4]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-[#A8A29E] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order #, buyer, material, SKU..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#E7E5E4] rounded-lg"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        {filteredOrders.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#78716C]">
            <Package className="w-10 h-10 text-[#D6D3D1] mx-auto mb-2" />
            No vendor orders match the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E7E5E4] text-[#78716C] bg-[#FAF9F7]">
                  <th className="py-3 px-3 font-semibold">Order #</th>
                  <th className="py-3 px-3 font-semibold">Buyer & Site</th>
                  <th className="py-3 px-3 font-semibold">Materials / Weight</th>
                  <th className="py-3 px-3 font-semibold">Vendor Total</th>
                  <th className="py-3 px-3 font-semibold">Stage</th>
                  <th className="py-3 px-3 font-semibold text-right">Fulfilment Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F4]">
                {filteredOrders.map((order: any) => {
                  const st = String(order.status || 'NEW').toUpperCase();
                  return (
                    <tr key={order.id} className="hover:bg-[#FAF9F7]/60">
                      <td className="py-3 px-3">
                        <p className="font-bold text-[#292524]">{order.orderNumber}</p>
                        <p className="text-[11px] text-[#78716C]">
                          {new Date(order.createdAt).toLocaleString('en-IN')}
                        </p>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-semibold text-[#292524]">{order.customerName}</p>
                        <p className="text-[11px] text-[#78716C]">
                          {order.deliveryAddress?.city || 'Bengaluru'} • {order.paymentMethod || 'COD'} ({order.paymentStatus || 'PENDING'})
                        </p>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-medium text-[#292524]">
                          {(order.items || []).length} SKU(s) • {(order.items || []).reduce((s: number, i: any) => s + Number(i.quantity || 1), 0)} qty
                        </p>
                        {order.packingDetails?.totalWeightKg && (
                          <p className="text-[11px] text-[#78716C]">
                            Weight: {order.packingDetails.totalWeightKg} kg
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-3 font-bold text-[#292524]">
                        ₹{Math.round(Number(order.totalAmount || 0)).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant={getStatusVariant(st)}>{st.replace(/_/g, ' ')}</Badge>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {st === 'NEW' && (
                            <>
                              <Button
                                size="sm"
                                isLoading={busyId === order.id}
                                onClick={() => handleAccept(order)}
                              >
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => {
                                  setRejectModalOrder(order);
                                  setRejectReason('');
                                }}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {['VENDOR_ACCEPTED', 'ACCEPTED'].includes(st) && (
                            <Button size="sm" onClick={() => openPickingModal(order)}>
                              <ClipboardCheck className="w-3.5 h-3.5 mr-1" /> Pick
                            </Button>
                          )}
                          {['PICKING_IN_PROGRESS', 'PROCESSING'].includes(st) && (
                            <Button size="sm" onClick={() => openPackingModal(order)}>
                              <Box className="w-3.5 h-3.5 mr-1" /> Pack & Weigh
                            </Button>
                          )}
                          {['PACKING_IN_PROGRESS', 'PACKED'].includes(st) && (
                            <Button size="sm" onClick={() => handleMarkReady(order)} isLoading={busyId === order.id}>
                              Stage Ready
                            </Button>
                          )}
                          {st === 'READY_FOR_DISPATCH' && (
                            <Button size="sm" onClick={() => openHandoverModal(order)}>
                              <Truck className="w-3.5 h-3.5 mr-1" /> Handover
                            </Button>
                          )}
                          {order.invoice && (
                            <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(order)}>
                              <Download className="w-3.5 h-3.5 mr-1" /> GST PDF
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => setSelectedOrder(order)}>
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Order Drawer */}
      <Drawer
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        title={selectedOrder ? `Order ${selectedOrder.orderNumber}` : 'Order Details'}
        subtitle={selectedOrder ? `Current Stage: ${String(selectedOrder.status).replace(/_/g, ' ')}` : undefined}
      >
        {selectedOrder && (
          <div className="space-y-5 text-xs">
            <div className="p-3.5 rounded-xl bg-[#FAF9F7] border border-[#E7E5E4] flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-bold text-[#292524]">{selectedOrder.customerName}</p>
                <p className="text-[#78716C] mt-0.5">
                  Payment: {selectedOrder.paymentMethod || 'COD'} ({selectedOrder.paymentStatus || 'PENDING'}) — Verified on Platform
                </p>
                {selectedOrder.buyerGstin && (
                  <p className="text-[#57534E] font-mono mt-0.5">Buyer GSTIN: {selectedOrder.buyerGstin}</p>
                )}
              </div>
              <Badge variant={getStatusVariant(selectedOrder.status)}>
                {String(selectedOrder.status).replace(/_/g, ' ')}
              </Badge>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap gap-2">
              {selectedOrder.status === 'NEW' && (
                <>
                  <Button size="sm" onClick={() => handleAccept(selectedOrder)} isLoading={busyId === selectedOrder.id}>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Verify Stock & Accept
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setRejectModalOrder(selectedOrder)}>
                    <XCircle className="w-3.5 h-3.5 mr-1" /> Reject (Reason Required)
                  </Button>
                </>
              )}
              {['VENDOR_ACCEPTED', 'ACCEPTED'].includes(selectedOrder.status) && (
                <Button size="sm" onClick={() => openPickingModal(selectedOrder)}>
                  <ClipboardCheck className="w-3.5 h-3.5 mr-1" /> Start / Confirm Picking
                </Button>
              )}
              {['PICKING_IN_PROGRESS', 'PROCESSING', 'VENDOR_ACCEPTED', 'ACCEPTED'].includes(selectedOrder.status) && (
                <Button size="sm" variant="secondary" onClick={() => openPackingModal(selectedOrder)}>
                  <Box className="w-3.5 h-3.5 mr-1" /> Packing & Weight Specs
                </Button>
              )}
              {['PACKING_IN_PROGRESS', 'PACKED'].includes(selectedOrder.status) && (
                <Button size="sm" onClick={() => handleMarkReady(selectedOrder)}>
                  Mark Ready for Dispatch
                </Button>
              )}
              {selectedOrder.status === 'READY_FOR_DISPATCH' && (
                <Button size="sm" onClick={() => openHandoverModal(selectedOrder)}>
                  <Truck className="w-3.5 h-3.5 mr-1" /> Handover to Vehicle
                </Button>
              )}
              {selectedOrder.invoice && (
                <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(selectedOrder)}>
                  <Download className="w-3.5 h-3.5 mr-1" /> Download Tax Invoice PDF
                </Button>
              )}
            </div>

            {['DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(selectedOrder.status) && (
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>
                  Delivery completion is locked to Site OTP confirmation by Logistics / Delivery Control.
                </span>
              </div>
            )}

            {/* Items */}
            <div className="space-y-2">
              <p className="font-bold text-[#57534E] uppercase text-[11px]">Ordered Line Items (No Silent Substitution)</p>
              <div className="border border-[#E7E5E4] rounded-xl divide-y divide-[#F5F5F4]">
                {(selectedOrder.items || []).map((item: any, idx: number) => (
                  <div key={idx} className="p-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-[#292524]">{item.name}</p>
                      <p className="text-[#78716C]">
                        SKU: {item.sku} • Ordered: {item.quantity}
                        {item.pickedQuantity !== undefined ? ` • Picked: ${item.pickedQuantity}` : ''}
                      </p>
                      {item.shortageReason && (
                        <p className="text-amber-700 font-semibold mt-0.5 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Shortage: {item.shortageReason}
                        </p>
                      )}
                    </div>
                    <p className="font-bold text-[#292524]">
                      ₹{Math.round(Number(item.totalAmount || (item.unitPrice || 0) * (item.quantity || 1))).toLocaleString('en-IN')}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Packing & Shipment Info */}
            {selectedOrder.packingDetails && (
              <div className="p-3.5 rounded-xl bg-[#FAF9F7] border border-[#E7E5E4] space-y-1">
                <p className="font-bold text-[#57534E] uppercase text-[11px]">Construction Packing Specs</p>
                <p>
                  Total Weight: <strong>{selectedOrder.packingDetails.totalWeightKg} kg</strong> • Packages:{' '}
                  {selectedOrder.packingDetails.packageCount} (Bags: {selectedOrder.packingDetails.bagCount || 0}, Boxes:{' '}
                  {selectedOrder.packingDetails.boxCount || 0}, Bundles: {selectedOrder.packingDetails.bundleCount || 0})
                </p>
                {selectedOrder.packingDetails.dimensions && <p>Dimensions: {selectedOrder.packingDetails.dimensions}</p>}
                {selectedOrder.packingDetails.loadingRequirements && (
                  <p>Loading Notes: {selectedOrder.packingDetails.loadingRequirements}</p>
                )}
              </div>
            )}

            {selectedOrder.shipment && (
              <div className="p-3.5 rounded-xl bg-[#FAF9F7] border border-[#E7E5E4] space-y-1">
                <p className="font-bold text-[#57534E] uppercase text-[11px]">Shipment & Dispatch</p>
                <p>
                  Vehicle: <strong>{selectedOrder.shipment.vehicleType}</strong> ({selectedOrder.shipment.vehicleNumber || 'Pending'})
                </p>
                <p>
                  Driver: {selectedOrder.shipment.driverName || 'Admin Dispatch Queue'} ({selectedOrder.shipment.driverPhone || '—'})
                </p>
                <p>Shipment Status: {selectedOrder.shipment.status}</p>
              </div>
            )}

            {selectedOrder.invoice && (
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
                <div>
                  <p className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <FileText className="w-4 h-4" /> {selectedOrder.invoice.invoiceNumber}
                  </p>
                  <p className="text-emerald-800">
                    GST Tax Invoice ({selectedOrder.invoice.status}) • Total: ₹{selectedOrder.invoice.totalAmount}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(selectedOrder)}>
                  Download PDF
                </Button>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Reject Modal */}
      <Modal
        isOpen={Boolean(rejectModalOrder)}
        onClose={() => setRejectModalOrder(null)}
        title="Reject Vendor Order Split"
        subtitle="A mandatory reason is required and stock reservation will be released automatically."
      >
        <form onSubmit={submitReject} className="space-y-3 text-xs">
          <textarea
            required
            minLength={3}
            rows={3}
            placeholder="Reason (e.g., Damaged batch / Yard stock discrepancy)..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="w-full px-3 py-2 border border-[#E7E5E4] rounded-lg"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setRejectModalOrder(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" isLoading={Boolean(busyId)}>
              Confirm Rejection
            </Button>
          </div>
        </form>
      </Modal>

      {/* Picking Modal */}
      <Modal
        isOpen={Boolean(pickingOrder)}
        onClose={() => setPickingOrder(null)}
        title={`Depot Picking Verification • ${pickingOrder?.orderNumber || ''}`}
        subtitle="Verify exact picked quantities. Silent SKU substitutions are prohibited—report any shortage explicitly."
      >
        <form onSubmit={submitPicking} className="space-y-3 text-xs">
          {pickedDraft.map((p, idx) => (
            <div key={p.productId} className="p-3 border border-[#E7E5E4] rounded-xl space-y-2 bg-[#FAF9F7]">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-[#292524]">{p.name}</p>
                  <p className="text-[#78716C]">SKU: {p.sku} • Ordered: {p.ordered}</p>
                </div>
                <div className="w-24">
                  <label className="text-[10px] text-[#78716C] block">Picked Qty</label>
                  <input
                    type="number"
                    min={0}
                    max={p.ordered}
                    value={p.pickedQuantity}
                    onChange={(e) => {
                      const next = [...pickedDraft];
                      next[idx].pickedQuantity = Number(e.target.value);
                      setPickedDraft(next);
                    }}
                    className="w-full px-2 py-1.5 border border-[#E7E5E4] rounded-lg bg-white"
                  />
                </div>
              </div>
              {p.pickedQuantity < p.ordered && (
                <input
                  required
                  placeholder="Mandatory shortage reason..."
                  value={p.shortageReason}
                  onChange={(e) => {
                    const next = [...pickedDraft];
                    next[idx].shortageReason = e.target.value;
                    setPickedDraft(next);
                  }}
                  className="w-full px-2.5 py-1.5 border border-amber-300 bg-amber-50 rounded-lg"
                />
              )}
            </div>
          ))}
          <input
            placeholder="Picking batch / yard notes (optional)..."
            value={pickingNotes}
            onChange={(e) => setPickingNotes(e.target.value)}
            className="w-full px-3 py-2 border border-[#E7E5E4] rounded-lg"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setPickingOrder(null)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={Boolean(busyId)}>
              Confirm Picked Quantities
            </Button>
          </div>
        </form>
      </Modal>

      {/* Packing Modal */}
      <Modal
        isOpen={Boolean(packingOrder)}
        onClose={() => setPackingOrder(null)}
        title={`Construction Packing & Weight • ${packingOrder?.orderNumber || ''}`}
        subtitle="Record package counts and verified load weight (kg) so Dispatch assigns the right commercial vehicle."
      >
        <form onSubmit={submitPacking} className="space-y-3 text-xs">
          <div className="grid grid-cols-5 gap-2">
            {[
              { key: 'bagCount', label: 'Bags' },
              { key: 'boxCount', label: 'Boxes' },
              { key: 'bundleCount', label: 'Bundles' },
              { key: 'pieceCount', label: 'Pieces' },
              { key: 'palletCount', label: 'Pallets' },
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-[10px] font-semibold text-[#78716C] mb-1">{f.label}</label>
                <input
                  type="number"
                  min={0}
                  value={(packingForm as any)[f.key]}
                  onChange={(e) => setPackingForm({ ...packingForm, [f.key]: Number(e.target.value) })}
                  className="w-full px-2 py-1.5 border border-[#E7E5E4] rounded-lg"
                />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-[#78716C] mb-1">Total Shipment Weight (kg) *</label>
              <input
                type="number"
                required
                min={0.5}
                step={0.5}
                value={packingForm.totalWeightKg}
                onChange={(e) => setPackingForm({ ...packingForm, totalWeightKg: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-[#E7E5E4] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[#78716C] mb-1">Dimensions / Pallet Size</label>
              <input
                value={packingForm.dimensions}
                onChange={(e) => setPackingForm({ ...packingForm, dimensions: e.target.value })}
                className="w-full px-3 py-2 border border-[#E7E5E4] rounded-lg"
              />
            </div>
          </div>
          <input
            placeholder="Special loading / crane / tarpaulin notes..."
            value={packingForm.loadingRequirements}
            onChange={(e) => setPackingForm({ ...packingForm, loadingRequirements: e.target.value })}
            className="w-full px-3 py-2 border border-[#E7E5E4] rounded-lg"
          />
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 font-medium text-[#57534E]">
              <input
                type="checkbox"
                checked={packingForm.fragileHandling}
                onChange={(e) => setPackingForm({ ...packingForm, fragileHandling: e.target.checked })}
              />
              Fragile Material Handling (Tiles / Sanitary / Glass)
            </label>
            <label className="flex items-center gap-2 font-semibold text-[#943D24]">
              <input
                type="checkbox"
                checked={packingForm.markReadyForDispatch}
                onChange={(e) => setPackingForm({ ...packingForm, markReadyForDispatch: e.target.checked })}
              />
              Mark Ready for Dispatch
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setPackingOrder(null)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={Boolean(busyId)}>
              Save Packing & Stage
            </Button>
          </div>
        </form>
      </Modal>

      {/* Driver Handover Modal */}
      <Modal
        isOpen={Boolean(handoverOrder)}
        onClose={() => setHandoverOrder(null)}
        title={`Gate Handover & Dispatch • ${handoverOrder?.orderNumber || ''}`}
        subtitle="Confirm vehicle handover. Dispatches shipment and issues supplier GST Tax Invoice."
      >
        <form onSubmit={submitHandover} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <input
              required
              placeholder="Vehicle Registration (e.g. KA-01-AB-4412)"
              value={handoverForm.vehicleNumber}
              onChange={(e) => setHandoverForm({ ...handoverForm, vehicleNumber: e.target.value })}
              className="px-3 py-2 border border-[#E7E5E4] rounded-lg font-mono"
            />
            <input
              required
              placeholder="Gate Pass / Handover Ref"
              value={handoverForm.handoverRef}
              onChange={(e) => setHandoverForm({ ...handoverForm, handoverRef: e.target.value })}
              className="px-3 py-2 border border-[#E7E5E4] rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              required
              placeholder="Driver Name"
              value={handoverForm.driverName}
              onChange={(e) => setHandoverForm({ ...handoverForm, driverName: e.target.value })}
              className="px-3 py-2 border border-[#E7E5E4] rounded-lg"
            />
            <input
              required
              placeholder="Driver Mobile"
              value={handoverForm.driverPhone}
              onChange={(e) => setHandoverForm({ ...handoverForm, driverPhone: e.target.value })}
              className="px-3 py-2 border border-[#E7E5E4] rounded-lg"
            />
          </div>
          <input
            placeholder="Handover notes (tarpaulin secured, challan handed)..."
            value={handoverForm.notes}
            onChange={(e) => setHandoverForm({ ...handoverForm, notes: e.target.value })}
            className="w-full px-3 py-2 border border-[#E7E5E4] rounded-lg"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setHandoverOrder(null)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={Boolean(busyId)}>
              Confirm Dispatch & Issue GST Invoice
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
