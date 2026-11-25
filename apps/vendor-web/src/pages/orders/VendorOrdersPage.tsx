import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ShoppingCart,
  Search,
  MapPin,
  Printer,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { useVendorOrderStore } from '../../store/useVendorOrderStore';
import {
  PageHeader,
  Card,
  CardContent,
  Button,
  Badge,
  Drawer,
  ConfirmDialog,
  EmptyState,
  TablePagination,
} from '../../components/common';
import { VendorOrder, VendorOrderStatus } from '@buildora/types';
import { toast } from '../../store/useToastStore';

export const VendorOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    orders,
    fetchOrders,
    updateOrderStatus,
    selectedOrder,
    setSelectedOrder,
    isLoading,
  } = useVendorOrderStore();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [activeTab, setActiveTab] = useState<string>(searchParams.get('status') || 'ALL');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<VendorOrder | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const qSearch = searchParams.get('search');
    const qStatus = searchParams.get('status');
    if (qSearch !== null) setSearch(qSearch);
    if (qStatus !== null) setActiveTab(qStatus);
  }, [searchParams]);

  const openDetails = (order: VendorOrder) => {
    setSelectedOrder(order);
    setIsDrawerOpen(true);
  };

  const handleStatusChange = async (orderId: string, status: VendorOrderStatus) => {
    const ok = await updateOrderStatus(orderId, status);
    if (ok) {
      toast.success(`Order updated to ${status.replace(/_/g, ' ').toLowerCase()}.`);
    } else {
      toast.error('Failed to update order status.');
    }
  };

  const tabs: { id: string; label: string }[] = [
    { id: 'ALL', label: 'All' },
    { id: 'NEW', label: 'New' },
    { id: 'ACCEPTED', label: 'Accepted' },
    { id: 'PROCESSING', label: 'Processing' },
    { id: 'READY_FOR_DISPATCH', label: 'Ready for Dispatch' },
    { id: 'DISPATCHED', label: 'Dispatched' },
    { id: 'DELIVERED', label: 'Delivered' },
    { id: 'CANCELLED', label: 'Cancelled' },
    { id: 'RETURNED', label: 'Returned' },
  ];

  const getBadgeVariant = (status: VendorOrderStatus) => {
    switch (status) {
      case 'DELIVERED':
        return 'success';
      case 'NEW':
        return 'accent';
      case 'ACCEPTED':
      case 'PROCESSING':
      case 'READY_FOR_DISPATCH':
        return 'warning';
      case 'DISPATCHED':
        return 'brand';
      case 'CANCELLED':
      case 'RETURNED':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesTab = activeTab === 'ALL' || o.status === activeTab;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      o.orderNumber.toLowerCase().includes(q) ||
      (o.customerName || '').toLowerCase().includes(q) ||
      (o.deliveryAddress?.pincode || '').includes(q);
    return matchesTab && matchesSearch;
  });

  const paginatedOrders = filteredOrders.slice((page - 1) * pageSize, page * pageSize);

  const renderPrimaryAction = (order: VendorOrder) => {
    switch (order.status) {
      case 'NEW':
        return (
          <Button
            size="sm"
            variant="accent"
            onClick={() => handleStatusChange(order.id, 'ACCEPTED')}
            disabled={isLoading}
          >
            Accept
          </Button>
        );
      case 'ACCEPTED':
        return (
          <Button
            size="sm"
            variant="primary"
            onClick={() => handleStatusChange(order.id, 'PROCESSING')}
            disabled={isLoading}
          >
            Start Processing
          </Button>
        );
      case 'PROCESSING':
        return (
          <Button
            size="sm"
            variant="primary"
            onClick={() => handleStatusChange(order.id, 'READY_FOR_DISPATCH')}
            disabled={isLoading}
          >
            Mark Ready
          </Button>
        );
      case 'READY_FOR_DISPATCH':
        return (
          <Button
            size="sm"
            variant="primary"
            onClick={() => handleStatusChange(order.id, 'DISPATCHED')}
            disabled={isLoading}
          >
            Dispatch
          </Button>
        );
      case 'DISPATCHED':
        return (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleStatusChange(order.id, 'DELIVERED')}
            disabled={isLoading}
          >
            Mark Delivered
          </Button>
        );
      default:
        return (
          <button
            type="button"
            onClick={() => openDetails(order)}
            className="text-xs font-medium text-[#943D24] hover:underline inline-flex items-center gap-0.5 cursor-pointer"
          >
            View <ChevronRight className="w-3.5 h-3.5" />
          </button>
        );
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Orders"
        description="Manage incoming orders from acceptance through dispatch and delivery."
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/returns')}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Returns & Inspections
          </Button>
        }
      />

      {/* Tabs & Search */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap gap-1.5 border-b border-[#E7E5E4] pb-3">
            {tabs.map((tab) => {
              const count =
                tab.id === 'ALL'
                  ? orders.length
                  : orders.filter((o) => o.status === tab.id).length;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-[#943D24] text-white'
                      : 'text-[#78716C] hover:text-[#292524] hover:bg-[#F8F7F5]'
                  }`}
                >
                  <span>{tab.label}</span>
                  {count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                        activeTab === tab.id
                          ? 'bg-white/20 text-white'
                          : 'bg-[#FBF3F0] text-[#943D24]'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by Order ID, customer name, or pincode..."
              className="portal-input pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8F7F5] text-[#78716C] font-semibold border-b border-[#E7E5E4]">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E5E4]">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={<ShoppingCart className="w-5 h-5" />}
                      title="No orders found"
                      description="No orders match the selected status or search filter."
                    />
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => openDetails(order)}
                    className="hover:bg-[#F8F7F5] cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-semibold text-[#292524]">
                        {order.orderNumber}
                      </div>
                      <div className="text-[11px] text-[#78716C]">
                        {new Date(order.createdAt).toLocaleDateString('en-IN')}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-[#292524]">{order.customerName}</div>
                      <div className="text-[11px] text-[#78716C] flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span>
                          {order.deliveryAddress?.city} - {order.deliveryAddress?.pincode}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-[#292524] font-medium line-clamp-1">
                        {order.items[0]?.name}
                        {order.items.length > 1 ? ` +${order.items.length - 1} more` : ''}
                      </div>
                      <div className="text-[11px] text-[#78716C]">
                        {order.items.reduce((sum, item) => sum + item.quantity, 0)} units
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-[#292524]">
                      ₹{(order.totalAmount || order.subtotal || 0).toLocaleString('en-IN')}
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge variant={getBadgeVariant(order.status)} size="sm">
                        {order.status.replace(/_/g, ' ')}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      {renderPrimaryAction(order)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <TablePagination
          page={page}
          pageSize={pageSize}
          totalItems={filteredOrders.length}
          onPageChange={setPage}
        />
      </Card>

      {/* Order Details Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={`Order ${selectedOrder?.orderNumber || ''}`}
        subtitle={
          selectedOrder ? `Placed ${new Date(selectedOrder.createdAt).toLocaleString('en-IN')}` : ''
        }
        width="xl"
      >
        {selectedOrder && (
          <div className="space-y-6 text-xs text-[#292524]">
            <div className="p-4 rounded-xl bg-[#F8F7F5] border border-[#E7E5E4] flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[#78716C] block text-[11px]">Status</span>
                <div className="mt-1">
                  <Badge variant={getBadgeVariant(selectedOrder.status)}>
                    {selectedOrder.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {renderPrimaryAction(selectedOrder)}
                {(selectedOrder.status === 'NEW' || selectedOrder.status === 'ACCEPTED') && (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => setCancelTarget(selectedOrder)}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-sm text-[#292524] mb-2">Delivery Address</h4>
              <div className="p-4 rounded-xl border border-[#E7E5E4] bg-white space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{selectedOrder.customerName || 'Customer'}</span>
                  <span className="text-[#78716C] font-mono">
                    {selectedOrder.customerPhone || '—'}
                  </span>
                </div>
                <p className="text-[#78716C]">
                  {selectedOrder.deliveryAddress?.building}, {selectedOrder.deliveryAddress?.street},{' '}
                  {selectedOrder.deliveryAddress?.city}, {selectedOrder.deliveryAddress?.state} -{' '}
                  <strong className="text-[#292524]">
                    {selectedOrder.deliveryAddress?.pincode}
                  </strong>
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-sm text-[#292524] mb-2">Order Items</h4>
              <div className="border border-[#E7E5E4] rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-[#F8F7F5] text-[#78716C] font-semibold border-b border-[#E7E5E4]">
                    <tr>
                      <th className="py-2.5 px-3">Item</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3 text-right">Qty</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7E5E4]">
                    {selectedOrder.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 font-medium">{item.name}</td>
                        <td className="py-2.5 px-3 font-mono text-[#78716C]">{item.sku}</td>
                        <td className="py-2.5 px-3 text-right font-semibold">{item.quantity}</td>
                        <td className="py-2.5 px-3 text-right font-semibold">
                          ₹
                          {(
                            item.totalAmount ||
                            item.unitPrice * item.quantity ||
                            0
                          ).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-sm text-[#292524] mb-2">Payout Breakdown</h4>
              <div className="p-4 rounded-xl bg-[#F8F7F5] border border-[#E7E5E4] space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#78716C]">Order Subtotal:</span>
                  <span className="font-semibold">
                    ₹{(selectedOrder.subtotal || selectedOrder.totalAmount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#78716C]">Platform Commission:</span>
                  <span className="text-[#DC4545]">
                    - ₹
                    {(
                      selectedOrder.commissionTotal ??
                      Math.round((selectedOrder.subtotal || 0) * 0.08)
                    ).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#E7E5E4] text-sm font-bold">
                  <span>Net Vendor Payout:</span>
                  <span className="text-[#15966B]">
                    ₹
                    {(
                      selectedOrder.netPayout ??
                      Math.round((selectedOrder.subtotal || 0) * 0.92)
                    ).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                leftIcon={<Printer className="w-4 h-4" />}
              >
                Print Packing Slip
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Cancel Order Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={async () => {
          if (!cancelTarget) return;
          await handleStatusChange(cancelTarget.id, 'CANCELLED');
          setCancelTarget(null);
        }}
        title="Cancel Order"
        message={`Are you sure you want to cancel order ${cancelTarget?.orderNumber}?`}
        confirmLabel="Cancel Order"
      />
    </div>
  );
};
