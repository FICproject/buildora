import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  CheckCircle,
  Clock,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatCard } from '../../components/common/StatCard';

export const VendorReportsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState('30d');

  const topSkus = [
    {
      sku: 'SKU-BLR-001',
      name: 'UltraTech Super Cement OPC 53 Grade (50 Kg)',
      category: 'Cement & Concrete',
      unitsSold: 840,
      revenue: 319200,
      slaRate: '99.1%',
    },
    {
      sku: 'SKU-BLR-002',
      name: 'Tata Tiscon 550D TMT Rebar (12mm)',
      category: 'Steel & Structural Metals',
      unitsSold: 320,
      revenue: 217600,
      slaRate: '98.5%',
    },
    {
      sku: 'SKU-BLR-003',
      name: 'Havells Life Line Plus S3 FRLS Wire (2.5 sq mm)',
      category: 'Electrical Wires & MCBs',
      unitsSold: 110,
      revenue: 294800,
      slaRate: '97.8%',
    },
    {
      sku: 'SKU-BLR-004',
      name: 'Supreme Silencio Low-Noise Drainage Pipe (110mm)',
      category: 'Plumbing & Sanitary',
      unitsSold: 95,
      revenue: 83600,
      slaRate: '98.9%',
    },
  ];

  const exportCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'SKU,Product Name,Category,Units Sold,Revenue (INR),SLA Compliance\n' +
      topSkus.map((e) => `"${e.sku}","${e.name}","${e.category}",${e.unitsSold},${e.revenue},"${e.slaRate}"`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `buildora_vendor_sales_report_${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Performance Analytics & Sales Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Deep dive into fulfillment speeds, fast-moving construction SKUs, and buyer retention.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">This Quarter (90 Days)</option>
          </select>

          <Button
            variant="primary"
            size="sm"
            onClick={exportCsv}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Orders Fulfilled"
          value="184 Orders"
          subtitle="99.4% completed successfully"
          icon={<BarChart3 className="w-5 h-5 text-blue-600" />}
          trend={{ value: 16.5, isPositive: true, period: 'last month' }}
        />

        <StatCard
          title="60-Min SLA On-Time Rate"
          value="98.4%"
          subtitle="Avg rider handoff: 18m"
          icon={<Clock className="w-5 h-5 text-emerald-600" />}
          trend={{ value: 2.1, isPositive: true, period: 'last month' }}
        />

        <StatCard
          title="Average Order Value"
          value="₹14,850"
          subtitle="Contractor bulk orders"
          icon={<TrendingUp className="w-5 h-5 text-indigo-600" />}
          trend={{ value: 8.7, isPositive: true, period: 'last month' }}
        />

        <StatCard
          title="Return / Dispute Rate"
          value="0.4%"
          subtitle="Well below 2% platform cap"
          icon={<CheckCircle className="w-5 h-5 text-emerald-600" />}
        />
      </div>

      {/* Top SKUs Table */}
      <Card>
        <CardHeader
          title="Top Moving Construction Materials"
          subtitle="Ranked by gross sales volume across Bengaluru jobsites"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">SKU & Item Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Units Dispatched</th>
                <th className="py-3 px-4 text-right">Gross Revenue</th>
                <th className="py-3 px-4 text-right">SLA Fulfillment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topSkus.map((item) => (
                <tr key={item.sku} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900">{item.name}</div>
                    <div className="text-[11px] font-mono text-slate-400">{item.sku}</div>
                  </td>

                  <td className="py-3.5 px-4 font-medium text-slate-800">{item.category}</td>

                  <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                    {item.unitsSold.toLocaleString('en-IN')}
                  </td>

                  <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                    ₹{item.revenue.toLocaleString('en-IN')}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {item.slaRate}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
