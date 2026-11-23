import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Search,
  Clock,
  MapPin,
  CheckCircle2,
  Truck,
  FileText,
  AlertCircle,
  ExternalLink,
  Phone,
  Printer,
  ChevronRight,
} from 'lucide-react';
import { useVendorOrderStore } from '../../store/useVendorOrderStore';
import { Card, CardHeader, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Drawer } from '../../components/common/Drawer';
import { VendorOrder, VendorOrderStatus } from '@buildora/types';

export const VendorOrdersPage: React.FC = () => {
  const {
    orders,
    fetchOrders,
    updateOrderStatus,
    selectedOrder,
    setSelectedOrder,
    isLoading,
  } = useVendorOrderStore();

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const openDetails = (order: VendorOrder) => {
    setSelectedOrder(order);
    setIsDrawerOpen(true);
  };

  const handleStatusChange = async (orderId: string, status: VendorOrderStatus) => {
    await updateOrderStatus(orderId, status);
  };

  const tabs = [
    { id: 'ALL', label: 'All Orders' },
    { id: 'NEW', label: 'New Orders' },
    { id: 'ACCEPTED', label: 'Packing' },
    { id: 'READY_FOR_DISPATCH', label: 'Ready for Pickup' },
    { id: 'DISPATCHED', label: 'In Transit' },
    { id: 'DELIVERED', label: 'Delivered' },
  ];

  const filteredOrders = orders.filter((o) => {
    const matchesTab = activeTab === 'ALL' || o.status === activeTab;
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.deliveryAddress.pincode.includes(search);
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Order Fulfillment & Dispatch Queue
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage incoming contractor orders, pack items, and hand over to Bengaluru express riders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="brand" dot>
            60-Min Express Hub Active
          </Badge>
        </div>
      </div>

      {/* Tabs & Search */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap gap-1.5 border-b border-slate-100 pb-3">
            {tabs.map((tab) => {
              const count =
                tab.id === 'ALL'
                  ? orders.length
                  : orders.filter((o) => o.status === tab.id).length;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                    activeTab === tab.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>{tab.label}</span>
                  {count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        activeTab === tab.id
                          ? 'bg-slate-800 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Order ID (e.g. ORD-BLR-), customer name, or pincode..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Order ID & Date</th>
                <th className="py-3 px-4">Delivery Site (Bengaluru)</th>
                <th className="py-3 px-4">Items Summary</th>
                <th className="py-3 px-4">Order Value</th>
                <th className="py-3 px-4">Fulfillment SLA</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No orders in this status category.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  return (
                    <tr
                      key={order.id}
                      onClick={() => openDetails(order)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900">{order.orderNumber}</div>
                        <div className="text-[11px] text-slate-400">
                          {new Date(order.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          , {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">{order.customerName}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>
                            {order.deliveryAddress.city} - {order.deliveryAddress.pincode}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 font-medium">
                          {order.items[0]?.name}{' '}
                          {order.items.length > 1 && (
                            <span className="text-slate-400 font-normal">
                              +{order.items.length - 1} more
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Qty: {order.items.reduce((sum, item) => sum + item.quantity, 0)} units total
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          ₹{(order.totalAmount || order.subtotal || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-emerald-600 font-semibold">Paid Online</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          <Clock className="w-3 h-3 text-blue-600" /> 60 Mins Express
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            order.status === 'DELIVERED'
                              ? 'success'
                              : order.status === 'DISPATCHED'
                              ? 'brand'
                              : order.status === 'READY_FOR_DISPATCH'
                              ? 'info'
                              : order.status === 'ACCEPTED'
                              ? 'brand'
                              : 'warning'
                          }
                        >
                          {order.status.replace(/_/g, ' ')}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        {order.status === 'NEW' ? (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleStatusChange(order.id, 'ACCEPTED')}
                            className="text-[11px] py-1 px-2.5"
                          >
                            Accept Order
                          </Button>
                        ) : order.status === 'ACCEPTED' ? (
                          <Button
                            size="sm"
                            variant="accent"
                            onClick={() => handleStatusChange(order.id, 'READY_FOR_DISPATCH')}
                            className="text-[11px] py-1 px-2.5"
                          >
                            Ready to Ship
                          </Button>
                        ) : order.status === 'READY_FOR_DISPATCH' ? (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleStatusChange(order.id, 'DISPATCHED')}
                            className="text-[11px] py-1 px-2.5"
                          >
                            Handover Rider
                          </Button>
                        ) : (
                          <button
                            onClick={() => openDetails(order)}
                            className="text-xs text-blue-600 font-semibold hover:underline inline-flex items-center gap-0.5"
                          >
                            <span>View</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Order Details Slide-over Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={`Order ${selectedOrder?.orderNumber}`}
        subtitle={`Placed on ${selectedOrder ? new Date(selectedOrder.createdAt).toLocaleString() : ''}`}
        width="xl"
      >
        {selectedOrder && (
          <div className="space-y-6 text-xs text-slate-700">
            {/* Status & Quick Action Banner */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">
                  Current Status
                </span>
                <span className="text-sm font-bold text-slate-900 mt-0.5">
                  {selectedOrder.status.replace(/_/g, ' ')}
                </span>
              </div>

              {selectedOrder.status === 'NEW' && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleStatusChange(selectedOrder.id, 'ACCEPTED')}
                >
                  Accept Order
                </Button>
              )}

              {selectedOrder.status === 'ACCEPTED' && (
                <Button
                  size="sm"
                  variant="accent"
                  onClick={() => handleStatusChange(selectedOrder.id, 'READY_FOR_DISPATCH')}
                >
                  Mark Ready for Pickup
                </Button>
              )}

              {selectedOrder.status === 'READY_FOR_DISPATCH' && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleStatusChange(selectedOrder.id, 'DISPATCHED')}
                >
                  Handover to Rider
                </Button>
              )}
            </div>

            {/* Customer & Delivery Site Info */}
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-2">Delivery Job Site Address</h4>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">
                    {selectedOrder.customerName || 'Contractor Site'}
                  </span>
                  <span className="text-slate-400 font-mono">
                    {selectedOrder.customerPhone || '+91 98450 11223'}
                  </span>
                </div>
                <p className="text-slate-600">
                  {selectedOrder.deliveryAddress.street}, {selectedOrder.deliveryAddress.city},{' '}
                  {selectedOrder.deliveryAddress.state} -{' '}
                  <strong>{selectedOrder.deliveryAddress.pincode}</strong>
                </p>
                <div className="text-[11px] text-blue-600 bg-blue-50 p-2 rounded-lg flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Verified Bengaluru Serviceable Pincode Zone</span>
                </div>
              </div>
            </div>

            {/* Ordered Materials Table */}
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-2">Ordered Materials</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Item</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3 text-right">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedOrder.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 font-medium text-slate-900">{item.name}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{item.sku}</td>
                        <td className="py-2.5 px-3 text-right font-bold">{item.quantity}</td>
                        <td className="py-2.5 px-3 text-right">
                          ₹{(item.unitPrice || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          ₹{(item.totalAmount || (item.unitPrice * item.quantity) || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Price & Payout Breakdown */}
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-2">Financial Breakdown</h4>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Gross Material Subtotal:</span>
                  <span className="font-semibold text-slate-900">
                    ₹{(selectedOrder.totalAmount || selectedOrder.subtotal || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Platform Commission (8%):</span>
                  <span>
                    - ₹{Math.round((selectedOrder.totalAmount || selectedOrder.subtotal || 0) * 0.08).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>TDS / GST Withholding (1%):</span>
                  <span>
                    - ₹{Math.round((selectedOrder.totalAmount || selectedOrder.subtotal || 0) * 0.01).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold">
                  <span className="text-slate-900">Estimated Vendor Payout:</span>
                  <span className="text-emerald-700">
                    ₹{Math.round((selectedOrder.totalAmount || selectedOrder.subtotal || 0) * 0.91).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Print Slip Action */}
            <div className="pt-2 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                leftIcon={<Printer className="w-4 h-4" />}
              >
                Print Dispatch Note & Handoff Slip
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
