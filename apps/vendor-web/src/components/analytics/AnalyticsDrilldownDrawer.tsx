import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { Drawer, Badge, TablePagination, EmptyState } from '../common';
import { vendorApi } from '../../services/vendorApi';

export interface BucketTarget {
  label: string;
  startIso: string;
  endIso: string;
  metric: 'orders' | 'sales';
}

interface AnalyticsDrilldownDrawerProps {
  target: BucketTarget | null;
  onClose: () => void;
}

export const AnalyticsDrilldownDrawer: React.FC<AnalyticsDrilldownDrawerProps> = ({
  target,
  onClose,
}) => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{
    total: number;
    totalRevenue: number;
    items: any[];
  }>({ total: 0, totalRevenue: 0, items: [] });

  useEffect(() => {
    setPage(1);
  }, [target?.startIso, target?.endIso, target?.metric]);

  useEffect(() => {
    if (!target) return;
    setLoading(true);
    vendorApi
      .getAnalyticsBucketDetails({
        startIso: target.startIso,
        endIso: target.endIso,
        metric: target.metric,
        page,
        limit: 8,
      })
      .then((res) => {
        setData({
          total: res?.total || 0,
          totalRevenue: res?.totalRevenue || 0,
          items: res?.items || [],
        });
      })
      .finally(() => setLoading(false));
  }, [target, page]);

  return (
    <Drawer
      isOpen={Boolean(target)}
      onClose={onClose}
      title={
        target
          ? `${target.metric === 'sales' ? 'Sales Breakdown' : 'Orders Breakdown'} — ${target.label}`
          : 'Period Details'
      }
      subtitle={`Orders: ${data.total} • Valid Sales Revenue: ₹${data.totalRevenue.toLocaleString('en-IN')}`}
      width="lg"
    >
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-[#FAF7F5]" />
          ))}
        </div>
      ) : data.items.length === 0 ? (
        <EmptyState
          title="No orders in this bucket"
          description="Try selecting a wider timeframe or another chart point."
        />
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-[#E7E5E4]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F5] text-[#78716C] border-b border-[#E7E5E4]">
                <tr>
                  <th className="py-2.5 px-3">Order</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Items</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E5E4] bg-white">
                {data.items.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => {
                      onClose();
                      navigate(`/orders?search=${encodeURIComponent(o.orderNumber || o.id)}`);
                    }}
                    className="hover:bg-[#FAF7F5] cursor-pointer"
                  >
                    <td className="py-2.5 px-3 font-semibold text-[#943D24] inline-flex items-center gap-1">
                      {o.orderNumber}
                      <ExternalLink className="w-3 h-3" />
                    </td>
                    <td className="py-2.5 px-3 text-[#292524]">{o.customerName || 'Customer'}</td>
                    <td className="py-2.5 px-3 text-[#78716C]">
                      {(o.items || []).map((it: any) => `${it.name} ×${it.quantity}`).join(', ')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#292524]">
                      ₹{Number(o.subtotal ?? o.totalAmount ?? 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Badge variant={o.status === 'DELIVERED' ? 'success' : 'brand'} size="sm">
                        {o.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <TablePagination
            page={page}
            pageSize={8}
            totalItems={data.total}
            onPageChange={setPage}
          />
        </div>
      )}
    </Drawer>
  );
};
