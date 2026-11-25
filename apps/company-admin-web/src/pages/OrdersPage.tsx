import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShoppingCart, RotateCcw, Search, CheckCircle2 } from 'lucide-react';
import { adminApi, formatINR, formatDateTime } from '../services/adminApi';
import {
  PageHeader,
  Card,
  Badge,
  Button,
  Drawer,
  EmptyState,
  statusBadgeVariant,
  useToastStore,
} from '../components/ui';

const ORDER_TABS = [
  { id: 'ALL', label: 'All Orders' },
  { id: 'ORDER_PLACED', label: 'New / Placed' },
  { id: 'CONFIRMED', label: 'Accepted' },
  { id: 'PROCESSING', label: 'Processing' },
  { id: 'READY_FOR_DISPATCH', label: 'Ready for Dispatch' },
  { id: 'DISPATCHED', label: 'Dispatched' },
  { id: 'DELIVERED', label: 'Delivered' },
  { id: 'CANCELLED', label: 'Cancelled' },
  { id: 'RETURNED', label: 'Returned' },
];

export const OrdersPage: React.FC = () => {
  const pushToast = useToastStore((s) => s.push);
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<'ORDERS' | 'RETURNS'>('ORDERS');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [orders, setOrders] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const loadData = async () => {
    if (view === 'ORDERS') {
      const list = await adminApi.getOrders(statusFilter, search);
      setOrders(list || []);
    } else {
      const ret = await adminApi.getReturns();
      setReturns(ret || []);
    }
  };

  useEffect(() => {
    loadData();
  }, [view, statusFilter]);

  const handleStatusChange = async (orderId: string, nextStatus: string) => {
    try {
      await adminApi.updateOrderStatus(orderId, nextStatus);
      pushToast({ title: 'Order Updated', message: `Order moved to ${nextStatus}.` });
      await loadData();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev: any) => ({ ...prev, status: nextStatus }));
      }
    } catch (err: any) {
      pushToast({ title: 'Update Failed', message: err.message, variant: 'error' });
    }
  };

  const handleReviewReturn = async (id: string, status: 'APPROVED' | 'REJECTED' | 'REFUNDED') => {
    try {
      await adminApi.reviewReturn(id, status, `Processed by Company Admin (${status})`);
      pushToast({ title: `Return ${status}` });
      await loadData();
    } catch (err: any) {
      pushToast({ title: 'Error', message: err.message, variant: 'error' });
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Order & Return Management"
        description="Coordinate order fulfillment across vendors, dispatch hubs & customer return/refund claims."
        actions={
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={view === 'ORDERS' ? 'primary' : 'outline'}
              onClick={() => setView('ORDERS')}
            >
              <ShoppingCart className="w-4 h-4" /> Orders
            </Button>
            <Button
              size="sm"
              variant={view === 'RETURNS' ? 'primary' : 'outline'}
              onClick={() => setView('RETURNS')}
            >
              <RotateCcw className="w-4 h-4" /> Returns & Refunds
            </Button>
          </div>
        }
      />

      {view === 'ORDERS' ? (
        <>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {ORDER_TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setStatusFilter(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    statusFilter === t.id
                      ? 'bg-[#AE887B] text-white border-[#AE887B] shadow-sm'
                      : 'bg-white text-[#5E5946] border-[#E5DCD3] hover:bg-[#F0DED0]/45'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                loadData();
              }}
              className="flex gap-2"
            >
              <div className="relative">
                <Search className="w-4 h-4 text-[#6E6859] absolute left-3 top-2.5" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Order #, customer..."
                  className="pl-9 pr-3 py-2 text-xs bg-white border border-[#E5DCD3] rounded-lg focus:outline-none focus:border-[#AE887B]"
                />
              </div>
              <Button size="sm" variant="secondary" type="submit">
                Filter
              </Button>
            </form>
          </div>

          <Card noPadding>
            {orders.length === 0 ? (
              <EmptyState
                icon={<ShoppingCart className="w-5 h-5" />}
                title="No orders in this status"
                description="Orders placed on Customer Website or converted from Bulk RFQs appear here."
              />
            ) : (
              <div className="overflow-x-auto rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F0DED0]/75 border-b border-[#E5DCD3] text-[11px] font-semibold text-[#5E5946] uppercase">
                      <th className="py-3 px-4">Order #</th>
                      <th className="py-3 px-3">Customer</th>
                      <th className="py-3 px-3">Payment</th>
                      <th className="py-3 px-3">Total</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-4 text-right">Manage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5DCD3] text-xs bg-white">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-[#FAF7F4] transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-[#AE887B]">{o.orderNumber || o.id}</p>
                          <p className="text-[#6E6859]">{formatDateTime(o.createdAt)}</p>
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-medium text-[#5E5946]">{o.customerName}</p>
                          <p className="text-[#6E6859]">{o.customerPhone}</p>
                        </td>
                        <td className="py-3 px-3">
                          <p className="text-[#5E5946]">{o.paymentMethod || 'RAZORPAY'}</p>
                          <Badge variant={statusBadgeVariant(o.paymentStatus)} className="mt-0.5">
                            {o.paymentStatus || 'PAID'}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 font-semibold text-[#5E5946]">{formatINR(o.totalAmount)}</td>
                        <td className="py-3 px-3">
                          <Badge variant={statusBadgeVariant(o.status)}>{o.status}</Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button size="sm" variant="outline" onClick={() => setSelectedOrder(o)}>
                            Manage Order
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      ) : (
        <Card title="Customer Return & Refund Requests">
          {returns.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 className="w-5 h-5" />}
              title="No return claims"
              description="Customer return requests synced with Vendor Portal will appear here."
            />
          ) : (
            <div className="divide-y divide-[#E5DCD3] text-xs">
              {returns.map((r) => (
                <div key={r.id} className="py-3.5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#5E5946]">
                      Order {r.orderNumber} — {r.customerName}
                    </p>
                    <p className="text-[#6E6859]">
                      Vendor: {r.vendorName} • Refund: {formatINR(r.totalRefundAmount)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusBadgeVariant(r.status)}>{r.status}</Badge>
                    {r.status === 'REQUESTED' && (
                      <>
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handleReviewReturn(r.id, 'APPROVED')}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleReviewReturn(r.id, 'REJECTED')}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    {r.status === 'APPROVED' && (
                      <Button
                        size="sm"
                        variant="dark"
                        onClick={() => handleReviewReturn(r.id, 'REFUNDED')}
                      >
                        Issue Refund
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Order Drawer */}
      <Drawer
        open={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        title={`Order ${selectedOrder?.orderNumber || selectedOrder?.id || ''}`}
        subtitle={`${selectedOrder?.customerName || ''} • ${formatINR(selectedOrder?.totalAmount)}`}
      >
        {selectedOrder && (
          <div className="space-y-5 text-xs">
            <div className="p-4 rounded-xl bg-[#F9F2EC] border border-[#E5DCD3] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[#6E6859]">Current Order Stage</span>
                <Badge variant={statusBadgeVariant(selectedOrder.status)}>
                  {selectedOrder.status}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'CONFIRMED',
                  'PROCESSING',
                  'READY_FOR_DISPATCH',
                  'DISPATCHED',
                  'DELIVERED',
                  'CANCELLED',
                ].map((st) => (
                  <Button
                    key={st}
                    size="sm"
                    variant={selectedOrder.status === st ? 'primary' : 'outline'}
                    onClick={() => handleStatusChange(selectedOrder.id, st)}
                  >
                    {st.replace(/_/g, ' ')}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-sm text-[#5E5946] mb-2">Delivery Destination</h4>
              <p className="p-3 border border-[#E5DCD3] bg-[#FAF7F4] rounded-lg text-[#6E6859]">
                {selectedOrder.deliveryAddress || 'Site address on file'}
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-sm text-[#5E5946] mb-2">Line Items</h4>
              <div className="divide-y divide-[#E5DCD3] border border-[#E5DCD3] rounded-lg bg-white">
                {(selectedOrder.items || []).map((it: any, idx: number) => (
                  <div key={idx} className="p-3 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-[#5E5946]">{it.name}</p>
                      <p className="text-[#6E6859]">
                        Qty: {it.quantity} {it.unit || ''}
                      </p>
                    </div>
                    <p className="font-semibold text-[#5E5946]">
                      {formatINR((it.totalAmount ?? (it.unitPrice || it.price || 0) * it.quantity))}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
