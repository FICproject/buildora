import React, { useState } from 'react';
import {
  Truck,
  MapPin,
  Clock,
  Warehouse,
  CheckCircle2,
  AlertCircle,
  Save,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

const BENGALURU_HUBS = [
  {
    id: 'WH-BLR-04',
    name: 'West Logistics Park (Nagarabhavi / Peenya)',
    status: 'ACTIVE',
    sla: '60 Mins',
    coverage: ['560072', '560058', '560079', '560091', '560096', '560086'],
    address: 'Plot 44, 2nd Stage, Peenya Industrial Area, Bengaluru 560058',
  },
  {
    id: 'WH-BLR-01',
    name: 'Central Distribution Hub (Shivajinagar / MG Road)',
    status: 'AVAILABLE',
    sla: '60 Mins',
    coverage: ['560001', '560025', '560020', '560052', '560002'],
    address: 'Shed 12, Queens Road Goods Yard, Bengaluru 560001',
  },
  {
    id: 'WH-BLR-02',
    name: 'South Mega Hub (Electronic City / Bommanahalli)',
    status: 'AVAILABLE',
    sla: '60 Mins',
    coverage: ['560100', '560068', '560076', '560069', '560102'],
    address: 'Phase 1, Hosur Main Road, Electronic City, Bengaluru 560100',
  },
  {
    id: 'WH-BLR-03',
    name: 'East Tech Hub (Whitefield / Mahadevapura)',
    status: 'AVAILABLE',
    sla: '60 Mins',
    coverage: ['560066', '560048', '560037', '560067', '560036'],
    address: 'ITPB Road, Hoodi Industrial Area, Whitefield, Bengaluru 560066',
  },
  {
    id: 'WH-BLR-05',
    name: 'North Airport Corridor Hub (Hebbal / Yelahanka)',
    status: 'AVAILABLE',
    sla: '60 Mins',
    coverage: ['560024', '560092', '560064', '560097'],
    address: 'Bellary Road, Near Hebbal Flyover, Bengaluru 560024',
  },
];

export const VendorDeliveryPage: React.FC = () => {
  const [selectedHub, setSelectedHub] = useState('WH-BLR-04');
  const [leadTime, setLeadTime] = useState('20');
  const [cutoffTime, setCutoffTime] = useState('20:00');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Delivery Hub & Warehousing Network
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure your inwarding dark store hub and order packaging dispatch SLA for 60-min delivery.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          leftIcon={<Save className="w-3.5 h-3.5" />}
        >
          Save Configuration
        </Button>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Warehouse dispatch preferences updated successfully!</span>
        </div>
      )}

      {/* SLA & Lead Time Settings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Packaging Lead Time</span>
            </div>
            <div className="flex items-baseline gap-2">
              <input
                type="number"
                value={leadTime}
                onChange={(e) => setLeadTime(e.target.value)}
                className="w-20 px-2 py-1 text-sm font-bold border border-slate-300 rounded"
              />
              <span className="text-xs text-slate-600">Minutes</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Time from order confirmation until rider handoff.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Daily Order Cutoff Time</span>
            </div>
            <div className="flex items-baseline gap-2">
              <input
                type="time"
                value={cutoffTime}
                onChange={(e) => setCutoffTime(e.target.value)}
                className="px-2 py-1 text-sm font-bold border border-slate-300 rounded"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Orders placed after this time deliver next day morning.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>SLA Compliance Score</span>
            </div>
            <div className="text-xl font-bold text-slate-900">98.4%</div>
            <p className="text-[11px] text-emerald-600 font-medium">
              Excellent &bull; Eligible for Top-Tier Badge
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Hub Allocation Cards */}
      <Card>
        <CardHeader
          title="Bengaluru 60-Minute Dark Store Allocation"
          subtitle="Your primary fulfillment warehouse determines customer pincode serviceability."
        />
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {BENGALURU_HUBS.map((hub) => {
              const isSelected = selectedHub === hub.id;

              return (
                <div
                  key={hub.id}
                  onClick={() => setSelectedHub(hub.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Warehouse className="w-4 h-4 text-blue-600" />
                      <span className="font-bold text-slate-900 text-sm">{hub.name}</span>
                    </div>
                    <Badge variant={isSelected ? 'success' : 'neutral'}>
                      {isSelected ? 'Primary Hub' : 'Available'}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-500 mt-2">{hub.address}</p>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Serviceable Pincodes:</span>
                    <span className="font-mono text-slate-700">
                      {hub.coverage.join(', ')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
