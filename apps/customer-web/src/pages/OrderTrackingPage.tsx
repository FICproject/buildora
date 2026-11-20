import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  PhoneCall,
  ShieldCheck,
  ChevronRight,
  Package,
  AlertCircle
} from 'lucide-react';
import { useOrderStore } from '../store/useOrderStore';
import { formatCurrency } from '@buildora/utils';
import { Button } from '../components/ui/Button';

export const OrderTrackingPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { getOrder } = useOrderStore();

  const order = getOrder(orderId || '');

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Order Not Found</h2>
        <p className="text-xs text-slate-500">
          We could not locate an order matching ID "{orderId}". Check your orders page.
        </p>
        <Button variant="primary" size="sm" onClick={() => navigate('/orders')}>
          View My Orders
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link to="/orders" className="hover:text-brand-blue-900">My Orders</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-semibold text-slate-800">Tracking: {order.orderNumber}</span>
      </nav>

      {/* Hero ETA Card */}
      <div className="bg-gradient-to-r from-brand-blue-950 via-brand-blue-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-4 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-brand-orange-400 font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Live Site Dispatch Status
            </div>
            <h1 className="text-2xl sm:text-3xl font-black mt-1">
              Estimated Site Arrival: {order.estimatedDeliveryTime}
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Order ID: <span className="font-mono font-bold text-white">{order.orderNumber}</span> &bull; 
              Dispatched from Indiranagar Hub (WH-BLR-01)
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 text-center sm:text-right">
            <div className="text-[10px] text-slate-300 uppercase font-semibold">Current State</div>
            <div className="text-sm font-black text-amber-400">{order.status.replace(/_/g, ' ')}</div>
          </div>
        </div>

        {/* Assigned Driver Card */}
        {order.deliveryPartner && (
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-orange-500 text-white font-bold flex items-center justify-center text-sm shadow">
                {order.deliveryPartner.name.charAt(0)}
              </div>
              <div>
                <div className="font-bold text-white text-sm">{order.deliveryPartner.name}</div>
                <div className="text-slate-300 text-[11px]">
                  Assigned Mini-Truck: {order.deliveryPartner.vehicleNumber}
                </div>
              </div>
            </div>

            <a
              href={`tel:${order.deliveryPartner.phone}`}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow"
            >
              <PhoneCall className="w-3.5 h-3.5" /> Call Site Driver
            </a>
          </div>
        )}
      </div>

      {/* Visual Tracking Timeline */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 sm:p-8 space-y-6">
        <h3 className="font-bold text-base text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-blue-900" />
          Dispatch &amp; Delivery Progress Timeline
        </h3>

        <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-2.5 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
          {order.timeline.map((step, idx) => (
            <div key={idx} className="relative flex items-start gap-4">
              {/* Circle Marker */}
              <div
                className={`absolute -left-6 sm:-left-8 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                  step.completed
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-50'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {step.completed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
              </div>

              {/* Step Info */}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4
                    className={`text-sm font-bold ${
                      step.completed ? 'text-slate-900' : 'text-slate-400'
                    }`}
                  >
                    {step.title}
                  </h4>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {step.timestamp}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Destination & Materials Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Delivery Address Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 space-y-3">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-orange-500" />
            Job Site Destination
          </h4>
          <div className="text-xs text-slate-600 space-y-1">
            <div className="font-bold text-slate-900 text-sm">
              {order.deliveryAddress?.recipientName || 'Site Contact'}
            </div>
            <p className="leading-relaxed">
              {order.deliveryAddress ? (
                [order.deliveryAddress.building, order.deliveryAddress.street, order.deliveryAddress.area, order.deliveryAddress.city]
                  .filter(Boolean)
                  .join(', ') + (order.deliveryAddress.pincode ? ` - ${order.deliveryAddress.pincode}` : '')
              ) : (
                'Registered Site Destination (Bengaluru)'
              )}
            </p>
            {order.deliveryAddress?.mobile && (
              <div className="text-slate-500">Phone: +91 {order.deliveryAddress.mobile}</div>
            )}
            {order.deliveryAddress?.deliveryInstructions && (
              <div className="mt-2 p-2 bg-amber-50 rounded-lg text-amber-900 font-medium text-[11px]">
                Offloading Note: {order.deliveryAddress.deliveryInstructions}
              </div>
            )}
          </div>
        </div>

        {/* Materials Manifest Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 space-y-3">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <Package className="w-4 h-4 text-brand-blue-900" />
            Materials Manifest ({order.items.length} items)
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1 text-xs divide-y divide-slate-100">
            {order.items.map((i, idx) => (
              <div key={idx} className="pt-2 flex justify-between items-center">
                <div className="truncate max-w-[200px]">
                  <span className="font-bold text-slate-800">{i.name}</span>
                  <div className="text-[11px] text-slate-400">Qty: {i.quantity} &bull; {i.unit}</div>
                </div>
                <span className="font-bold text-slate-900">{formatCurrency(i.totalAmount)}</span>
              </div>
            ))}
          </div>
          <div className="pt-3 border-t border-slate-200 flex justify-between text-xs font-bold text-slate-900">
            <span>Total Value</span>
            <span>{formatCurrency(order.grandTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
