import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  Download,
  KeyRound,
  MapPin,
  PackageCheck,
  Phone,
  RefreshCw,
  Truck,
} from 'lucide-react';
import { api } from '../services/api';
import { useOrderStore } from '../store/useOrderStore';
import { Button } from '../components/ui/Button';

const TRACK_STAGES = [
  { key: 'ORDER_PLACED', label: 'Order Placed' },
  { key: 'PAYMENT_VERIFIED', label: 'Payment Verified' },
  { key: 'VENDOR_ACCEPTED', label: 'Vendor Accepted' },
  { key: 'PICKING_IN_PROGRESS', label: 'Depot Picking' },
  { key: 'PACKING_IN_PROGRESS', label: 'Packed & Weighed' },
  { key: 'READY_FOR_DISPATCH', label: 'Ready for Dispatch' },
  { key: 'DISPATCHED', label: 'Dispatched' },
  { key: 'IN_TRANSIT', label: 'In Transit' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { key: 'DELIVERED', label: 'Delivered to Site' },
  { key: 'COMPLETED', label: 'Completed' },
];

const STAGE_INDEX: Record<string, number> = Object.fromEntries(
  TRACK_STAGES.map((s, idx) => [s.key, idx])
);
STAGE_INDEX['ACCEPTED'] = 2;
STAGE_INDEX['CONFIRMED'] = 2;
STAGE_INDEX['PARTIALLY_ACCEPTED'] = 2;
STAGE_INDEX['PROCESSING'] = 3;
STAGE_INDEX['PACKED'] = 4;
STAGE_INDEX['PARTIALLY_DISPATCHED'] = 6;
STAGE_INDEX['PARTIALLY_DELIVERED'] = 9;

export const OrderTrackingPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { getOrder } = useOrderStore();
  const [order, setOrder] = useState<any>(() => (orderId ? getOrder(orderId) : null));
  const [loading, setLoading] = useState(false);

  const loadTracking = async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const details = await api.getOrderDetails(orderId);
      if (details) {
        setOrder(details);
      } else {
        const track = await api.trackOrder(orderId);
        if (track) setOrder(track);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTracking();
  }, [orderId]);

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <PackageCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h1 className="text-lg font-bold text-slate-900">
          {loading ? 'Loading live site dispatch...' : 'Order tracking unavailable'}
        </h1>
        <Link to="/orders" className="text-sm font-semibold text-orange-600 hover:underline mt-2 inline-block">
          Return to My Orders
        </Link>
      </div>
    );
  }

  const shipments: any[] = order.shipments || [];
  const splits: any[] = order.vendorSplits || [];
  const primaryShipment = shipments[0];
  const invoices: any[] = order.invoices || [];
  const activeIdx = STAGE_INDEX[String(order.status || 'ORDER_PLACED').toUpperCase()] ?? 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to={`/orders/${order.orderNumber || orderId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Order Details
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadTracking}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() =>
              api.downloadOrderInvoicePdf(
                order.orderNumber,
                invoices[0]?.id || 'primary',
                invoices[0]?.invoiceNumber ? `${invoices[0].invoiceNumber}.pdf` : undefined
              )
            }
          >
            <Download className="w-3.5 h-3.5 mr-1" /> Tax Invoice PDF
          </Button>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">LIVE DISPATCH TRACKER</p>
            <h1 className="text-2xl font-extrabold text-slate-900">{order.orderNumber}</h1>
            <p className="text-xs text-slate-500 mt-1">
              Status:{' '}
              <span className="font-bold text-slate-900">{String(order.status).replace(/_/g, ' ')}</span>
              {' • '}ETA: <span className="font-semibold">{order.estimatedDeliveryTime || 'Within 60 mins'}</span>
            </p>
          </div>
          {primaryShipment?.deliveryOtp && order.status !== 'DELIVERED' && order.status !== 'COMPLETED' && (
            <div className="px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900">
              <p className="text-[10px] font-bold uppercase">SITE HANDOVER OTP</p>
              <p className="text-xl font-black tracking-widest flex items-center gap-1.5">
                <KeyRound className="w-4 h-4" /> {primaryShipment.deliveryOtp}
              </p>
            </div>
          )}
        </div>

        {/* Stepper */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 mt-6">
          {TRACK_STAGES.map((st, idx) => {
            const done = idx <= activeIdx;
            return (
              <div
                key={st.key}
                className={`p-2.5 rounded-xl border text-xs ${
                  done
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-1 font-bold">
                  {done ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <Clock className="w-3.5 h-3.5 shrink-0" />}
                  <span className="truncate">{st.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Multi-vendor shipments or single shipment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Truck className="w-4 h-4 text-blue-600" />
            <span>Vehicle & Driver Assignment</span>
          </div>
          {primaryShipment || order.deliveryPartner ? (
            <div className="text-xs text-slate-600 space-y-1.5">
              <p>
                Partner:{' '}
                <span className="font-bold text-slate-900">
                  {primaryShipment?.partnerName || order.deliveryPartner?.name || 'Buildora Fleet'}
                </span>
              </p>
              <p>
                Vehicle: <span className="font-semibold">{primaryShipment?.vehicleType || 'Commercial'}</span> •{' '}
                <span className="font-mono font-bold text-slate-900">
                  {primaryShipment?.vehicleNumber || order.deliveryPartner?.vehicleNumber || 'Assigned at bay'}
                </span>
              </p>
              <p className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                Driver: {primaryShipment?.driverName || 'Fleet Driver'} ({primaryShipment?.driverPhone || order.deliveryPartner?.phone || '—'})
              </p>
              {primaryShipment?.lastKnownLocation && (
                <p className="text-blue-700 font-semibold">Latest Verified Location: {primaryShipment.lastKnownLocation}</p>
              )}
              {primaryShipment?.delayReason && (
                <p className="text-amber-700 font-semibold">Delay / Update: {primaryShipment.delayReason}</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500">Dispatch assignment queued after vendor packing confirmation.</p>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <MapPin className="w-4 h-4 text-orange-600" />
            <span>Job Site Destination</span>
          </div>
          <div className="text-xs text-slate-600 space-y-1">
            <p className="font-bold text-slate-900">
              {order.deliveryAddress?.recipientName || order.customerName || 'Site Contact'}
            </p>
            <p>
              {[
                order.deliveryAddress?.building || order.deliveryAddress?.line1,
                order.deliveryAddress?.area,
                order.deliveryAddress?.city,
                order.deliveryAddress?.state,
                order.deliveryAddress?.pincode,
              ]
                .filter(Boolean)
                .join(', ')}
            </p>
            <p>Mobile: {order.deliveryAddress?.mobile || order.customerPhone || '—'}</p>
          </div>
        </div>
      </div>

      {/* Supplier Split Tracking */}
      {splits.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-900">Supplier Fulfilment & Tracking Events</h2>
          <div className="space-y-3">
            {splits.map((sp: any) => (
              <div key={sp.vendorOrderId} className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-slate-500" />
                    {sp.vendorName}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-[10px] font-bold">
                    {String(sp.status).replace(/_/g, ' ')}
                  </span>
                </div>
                {(sp.shipment?.trackingEvents || sp.timeline || []).length > 0 && (
                  <div className="space-y-1.5 pl-2 border-l-2 border-slate-300 mt-2">
                    {(sp.shipment?.trackingEvents || sp.timeline).map((ev: any, idx: number) => (
                      <div key={idx} className="text-xs text-slate-600">
                        <span className="font-semibold text-slate-800">{ev.title}</span>
                        {ev.location ? ` (${ev.location})` : ''} — {ev.description}
                        <span className="text-[10px] text-slate-400 ml-2">
                          {ev.timestamp ? new Date(ev.timestamp).toLocaleString('en-IN') : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
