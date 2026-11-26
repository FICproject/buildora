import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Package,
  Truck,
  FileText,
  Clock,
  ArrowRight,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronLeft,
  Building2,
  MapPin,
  CreditCard,
  Download,
  AlertTriangle,
  HelpCircle
} from 'lucide-react';
import { useOrderStore } from '../store/useOrderStore';
import { useCartStore } from '../store/useCartStore';
import { api } from '../services/api';
import { formatCurrency } from '@buildora/utils';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';

export const OrdersPage: React.FC = () => {
  const { orderId } = useParams<{ orderId?: string }>();
  const navigate = useNavigate();
  const { orders, cancelOrder, syncWithBackend } = useOrderStore();
  const { addItem } = useCartStore();

  React.useEffect(() => {
    syncWithBackend();
  }, [syncWithBackend]);

  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [returnModalOrder, setReturnModalOrder] = useState<typeof orders[0] | null>(null);
  const [returnReason, setReturnReason] = useState('SURPLUS');
  const [returnComments, setReturnComments] = useState('');
  const [returnSuccessToast, setReturnSuccessToast] = useState(false);
  const [invoiceDownloadToast, setInvoiceDownloadToast] = useState<string | null>(null);

  // If orderId is present in URL, find specific order for detailed view
  const selectedOrder = orderId
    ? orders.find(
        (o) =>
          o.id.toLowerCase() === orderId.toLowerCase() ||
          o.orderNumber.toLowerCase() === orderId.toLowerCase()
      )
    : null;

  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'ACTIVE') {
      return order.status !== 'DELIVERED' && order.status !== 'CANCELLED';
    }
    if (activeTab === 'COMPLETED') {
      return order.status === 'DELIVERED';
    }
    if (activeTab === 'CANCELLED') {
      return order.status === 'CANCELLED';
    }
    return true;
  });

  const handleReorder = (order: typeof orders[0]) => {
    for (const item of order.items) {
      const mockProd: any = {
        id: item.productId,
        name: item.name,
        slug: item.slug,
        sku: item.sku,
        brand: item.brand,
        images: [item.image],
        unit: item.unit,
        price: item.unitPrice,
        mrp: Math.round(item.unitPrice * 1.15),
        gstRate: 18,
        stockCount: 500,
        inStock: true
      };
      addItem(mockProd, item.quantity);
    }
    navigate('/cart');
  };

  const handleDownloadInvoice = (orderNumber: string) => {
    const order = orders.find((o) => o.orderNumber === orderNumber);
    if (order) {
      const lines = [
        `BUILDORA 60 - TAX INVOICE`,
        `Order Number: ${order.orderNumber}`,
        `Date: ${new Date(order.createdAt).toLocaleString()}`,
        `Customer: ${order.deliveryAddress?.recipientName || 'Customer'} (${order.deliveryAddress?.mobile || ''})`,
        order.gstin ? `GSTIN: ${order.gstin} (${order.companyName || ''})` : '',
        `----------------------------------------`,
        ...order.items.map((it) => `${it.name} (${it.quantity} ${it.unit}) - ₹${it.totalAmount}`),
        `----------------------------------------`,
        `Subtotal: ₹${order.subtotal}`,
        `GST Total: ₹${order.gstTotal}`,
        `Delivery Fee: ₹${order.deliveryFee}`,
        `Grand Total: ₹${order.grandTotal}`,
      ].filter(Boolean);
      const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${orderNumber}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    setInvoiceDownloadToast(orderNumber);
    setTimeout(() => setInvoiceDownloadToast(null), 3000);
  };

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnModalOrder) return;
    await api.requestReturn(returnModalOrder.id, {
      reason: returnReason,
      comments: returnComments,
    });
    await syncWithBackend();
    setReturnSuccessToast(true);
    setReturnModalOrder(null);
    setReturnComments('');
    setTimeout(() => setReturnSuccessToast(false), 4000);
  };

  // --- Render Detailed Single Order View ---
  if (orderId && selectedOrder) {
    const isDelivered = selectedOrder.status === 'DELIVERED';
    const isCancelled = selectedOrder.status === 'CANCELLED';

    return (
      <div className="space-y-6">
        {/* Back Link */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <Link
            to="/account/orders"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-blue-800 hover:underline"
          >
            <ChevronLeft className="w-4 h-4" /> Back to All Orders
          </Link>
          <div className="text-xs text-slate-400">
            Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
          </div>
        </div>

        {invoiceDownloadToast && (
          <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold rounded-xl flex items-center gap-2">
            <Download className="w-4 h-4 text-brand-blue-700" />
            Generating &amp; downloading GST Tax Invoice for Order #{invoiceDownloadToast}...
          </div>
        )}

        {returnSuccessToast && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Return &amp; material inspection request submitted! Site engineer will call within 2 hours.
          </div>
        )}

        {/* Order Main Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Order Reference</span>
              <h1 className="text-2xl font-black text-slate-900 mt-0.5">{selectedOrder.orderNumber}</h1>
              <div className="text-xs text-slate-500 mt-0.5">
                Dispatch Mode: <strong>{selectedOrder.deliveryOption.replace(/_/g, ' ')}</strong> &bull; ETA: {selectedOrder.estimatedDeliveryTime}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`font-black text-xs px-3 py-1.5 rounded-full ${
                  isDelivered
                    ? 'bg-emerald-100 text-emerald-800'
                    : isCancelled
                    ? 'bg-red-100 text-red-800'
                    : 'bg-amber-100 text-amber-800 animate-pulse'
                }`}
              >
                {selectedOrder.status.replace(/_/g, ' ')}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadInvoice(selectedOrder.orderNumber)}
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                Tax Invoice
              </Button>
            </div>
          </div>

          {/* Timeline Progress */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Delivery Progress</h3>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              {selectedOrder.timeline.map((step, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs ${
                    step.completed
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                      : 'bg-slate-50 border-slate-100 text-slate-400'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    {step.completed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                    )}
                    <span className="truncate">{step.title}</span>
                  </div>
                  <div className="text-[10px] mt-1 leading-tight opacity-80">{step.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Itemized Material List */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Itemized Materials</h3>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {selectedOrder.items.map((item, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between gap-4 text-xs bg-white">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-14 h-14 rounded-xl object-cover bg-slate-50 border border-slate-200 flex-shrink-0"
                    />
                    <div>
                      <Link
                        to={`/products/${item.slug}`}
                        className="font-bold text-slate-900 hover:text-brand-blue-900 text-sm"
                      >
                        {item.name}
                      </Link>
                      <div className="text-slate-500 mt-0.5">
                        Brand: <strong>{item.brand}</strong> &bull; SKU: <span className="font-mono">{item.sku}</span>
                      </div>
                      <div className="text-slate-500">
                        Qty: <strong>{item.quantity}</strong> ({item.unit}) &bull; Unit: {formatCurrency(item.unitPrice)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-black text-sm text-slate-900">{formatCurrency(item.totalAmount)}</div>
                    <div className="text-[10px] text-slate-400">Incl. ₹{item.gstAmount} GST</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Details Grid: Address, Driver & Financials */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Site Delivery & Logistics */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3 text-xs">
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-orange-500" /> Site Delivery Address
              </div>
              <div className="text-slate-700 leading-relaxed">
                <div className="font-bold text-slate-900">
                  {selectedOrder.deliveryAddress?.recipientName || 'Site Contact'}
                </div>
                <div>
                  {[selectedOrder.deliveryAddress?.building, selectedOrder.deliveryAddress?.street].filter(Boolean).join(', ') || 'Address on file'}
                </div>
                <div>
                  {[selectedOrder.deliveryAddress?.area, selectedOrder.deliveryAddress?.city].filter(Boolean).join(', ') || 'Bengaluru'}
                  {selectedOrder.deliveryAddress?.state ? `, ${selectedOrder.deliveryAddress.state}` : ''}
                  {selectedOrder.deliveryAddress?.pincode ? ` - ${selectedOrder.deliveryAddress.pincode}` : ''}
                </div>
                {selectedOrder.deliveryAddress?.mobile && (
                  <div className="text-slate-500 mt-1">Phone: +91 {selectedOrder.deliveryAddress.mobile}</div>
                )}
                {selectedOrder.deliveryAddress?.deliveryInstructions && (
                  <div className="mt-2 p-2 bg-amber-50 rounded-lg text-amber-900 text-[11px] font-medium border border-amber-200">
                    <strong>Site Note:</strong> {selectedOrder.deliveryAddress.deliveryInstructions}
                  </div>
                )}
              </div>

              {selectedOrder.deliveryPartner && (
                <div className="pt-3 border-t border-slate-200">
                  <span className="font-bold text-slate-900">Assigned Delivery Vehicle:</span>
                  <div className="text-slate-600 mt-0.5">
                    {selectedOrder.deliveryPartner.name} &bull; {selectedOrder.deliveryPartner.vehicleNumber}
                  </div>
                </div>
              )}
            </div>

            {/* Financial Summary */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div className="font-bold text-slate-900 flex items-center gap-2 pb-1 border-b border-slate-200">
                <CreditCard className="w-4 h-4 text-brand-blue-700" /> Payment &amp; Taxes Breakdown
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Material Subtotal</span>
                <span>{formatCurrency(selectedOrder.subtotal)}</span>
              </div>
              {selectedOrder.couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Coupon Discount</span>
                  <span>- {formatCurrency(selectedOrder.couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Total GST Component</span>
                <span>{formatCurrency(selectedOrder.gstTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Priority Site Delivery Fee</span>
                <span>{selectedOrder.deliveryFee > 0 ? formatCurrency(selectedOrder.deliveryFee) : 'FREE'}</span>
              </div>
              {selectedOrder.walletUsed > 0 && (
                <div className="flex justify-between text-brand-blue-800 font-semibold">
                  <span>Buildora Wallet Deduction</span>
                  <span>- {formatCurrency(selectedOrder.walletUsed)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Paid</span>
                <span>{formatCurrency(selectedOrder.grandTotal)}</span>
              </div>
              <div className="text-[11px] text-slate-400 pt-1">
                Paid via {selectedOrder.paymentMethod.replace(/_/g, ' ')} &bull; Status: {selectedOrder.paymentStatus}
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {!isCancelled && !isDelivered && (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate(`/orders/${selectedOrder.orderNumber}/track`)}
                    leftIcon={<Truck className="w-3.5 h-3.5" />}
                  >
                    Live GPS Tracking
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to cancel this order?')) {
                        cancelOrder(selectedOrder.id);
                        navigate('/account/orders');
                      }
                    }}
                    className="text-red-600 hover:bg-red-50"
                  >
                    Cancel Dispatch
                  </Button>
                </>
              )}

              {isDelivered && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReturnModalOrder(selectedOrder)}
                  className="text-amber-700 border-amber-300 hover:bg-amber-50"
                >
                  Return / Replacement Request
                </Button>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleReorder(selectedOrder)}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Reorder All Materials
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // --- Render Orders List View ---
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900">My Orders &amp; Dispatches</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track site deliveries, download GST tax invoices, and reorder materials.
          </p>
        </div>
      </div>

      {invoiceDownloadToast && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold rounded-xl flex items-center gap-2">
          <Download className="w-4 h-4 text-brand-blue-700" />
          Downloading GST Tax Invoice for Order #{invoiceDownloadToast}...
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold text-slate-500">
        {(['ALL', 'ACTIVE', 'COMPLETED', 'CANCELLED'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`pb-2.5 transition-colors ${
              activeTab === tab
                ? 'text-brand-blue-900 border-b-2 border-brand-blue-900 font-extrabold'
                : 'hover:text-slate-800'
            }`}
          >
            {tab === 'ALL'
              ? `All Orders (${orders.length})`
              : tab === 'ACTIVE'
              ? 'Active Dispatches'
              : tab === 'COMPLETED'
              ? 'Delivered'
              : 'Cancelled'}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Orders Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You don't have any orders matching the selected status. Browse our 28 categories for your construction requirements.
          </p>
          <Button variant="primary" size="sm" onClick={() => navigate('/products')}>
            Shop Construction Materials
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isDelivered = order.status === 'DELIVERED';
            const isCancelled = order.status === 'CANCELLED';

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-card p-5 space-y-4 hover:border-slate-300 transition-colors"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium">Order ID: </span>
                    <strong className="text-slate-900 font-mono text-sm">{order.orderNumber}</strong>
                    <span className="text-slate-400 ml-2">
                      &bull; Placed on {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`font-bold px-2.5 py-1 rounded-full text-[11px] ${
                        isDelivered
                          ? 'bg-emerald-100 text-emerald-800'
                          : isCancelled
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800 animate-pulse'
                      }`}
                    >
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Items Preview */}
                <div className="divide-y divide-slate-100">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between gap-4 text-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 rounded-lg object-cover bg-slate-50 border border-slate-100 flex-shrink-0"
                        />
                        <div className="truncate">
                          <Link
                            to={`/products/${item.slug}`}
                            className="font-bold text-slate-800 hover:text-brand-blue-900 line-clamp-1"
                          >
                            {item.name}
                          </Link>
                          <div className="text-[11px] text-slate-400">
                            Brand: {item.brand} &bull; Qty: {item.quantity} ({item.unit})
                          </div>
                        </div>
                      </div>
                      <div className="font-bold text-slate-900 flex-shrink-0">
                        {formatCurrency(item.totalAmount)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Info & Actions */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-slate-500">Delivering to: </span>
                    <strong className="text-slate-800">
                      {order.deliveryAddress ? (
                        [order.deliveryAddress?.building, order.deliveryAddress?.street, order.deliveryAddress?.area, order.deliveryAddress?.city]
                          .filter(Boolean)
                          .join(', ') + (order.deliveryAddress.pincode ? ` (${order.deliveryAddress.pincode})` : '')
                      ) : (
                        'Registered Site Destination (Bengaluru)'
                      )}
                    </strong>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Grand Total: <strong className="text-slate-900 font-bold">{formatCurrency(order.grandTotal)}</strong>{' '}
                      ({order.paymentMethod ? order.paymentMethod.replace(/_/g, ' ') : 'PREPAID'})
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/account/orders/${order.orderNumber}`)}
                    >
                      View Details &rarr;
                    </Button>

                    {!isCancelled && !isDelivered && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(`/orders/${order.orderNumber}/track`)}
                        leftIcon={<Truck className="w-3.5 h-3.5" />}
                      >
                        Live Track
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReorder(order)}
                      leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                    >
                      Reorder
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Return / Replacement Modal */}
      {returnModalOrder && (
        <Modal
          isOpen={true}
          onClose={() => setReturnModalOrder(null)}
          title={`Return Request for Order #${returnModalOrder.orderNumber}`}
        >
          <form onSubmit={handleSubmitReturn} className="space-y-4 text-xs">
            <p className="text-slate-600">
              BUILDORA 60 provides hassle-free site returns for surplus materials, damaged bags, or incorrect specifications.
            </p>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Return Reason</label>
              <select
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-brand-blue-500"
              >
                <option value="SURPLUS">Surplus Unused Material</option>
                <option value="DAMAGED">Damaged / Moisture Ingress in Packing</option>
                <option value="WRONG_SPEC">Wrong Brand or Specification Received</option>
                <option value="EXPIRED">Manufacturing Date Exceeds 90 Days</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Additional Site Comments</label>
              <textarea
                value={returnComments}
                onChange={(e) => setReturnComments(e.target.value)}
                rows={3}
                placeholder="Mention number of bags/sheets to return and site gate availability..."
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-blue-500"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setReturnModalOrder(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Submit Return Request
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
