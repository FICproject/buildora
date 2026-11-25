import React, { useState, useEffect } from 'react';
import { Truck, Clock, Warehouse, Save, MapPin, CheckCircle2 } from 'lucide-react';
import { vendorApi } from '../../services/vendorApi';
import {
  PageHeader,
  Card,
  CardHeader,
  CardContent,
  Button,
  Badge,
  Modal,
  EmptyState,
} from '../../components/common';
import { toast } from '../../store/useToastStore';

type DeliveryTab = 'DISPATCH' | 'HISTORY' | 'SETTINGS';

const BENGALURU_HUBS = [
  {
    id: 'WH-BLR-04',
    name: 'West Logistics Park (Peenya / Nagarabhavi)',
    address: 'Plot 44, 2nd Stage, Peenya Industrial Area, Bengaluru 560058',
    coverage: '560072, 560058, 560079, 560091',
  },
  {
    id: 'WH-BLR-01',
    name: 'Central Distribution Hub (Shivajinagar / MG Road)',
    address: 'Shed 12, Queens Road Goods Yard, Bengaluru 560001',
    coverage: '560001, 560025, 560020, 560052',
  },
  {
    id: 'WH-BLR-02',
    name: 'South Mega Hub (Electronic City)',
    address: 'Phase 1, Hosur Main Road, Electronic City, Bengaluru 560100',
    coverage: '560100, 560068, 560076, 560102',
  },
  {
    id: 'WH-BLR-03',
    name: 'East Tech Hub (Whitefield)',
    address: 'ITPB Road, Hoodi Industrial Area, Whitefield, Bengaluru 560066',
    coverage: '560066, 560048, 560037, 560036',
  },
];

export const VendorDeliveryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DeliveryTab>('DISPATCH');
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [selectedHub, setSelectedHub] = useState('WH-BLR-04');
  const [leadTime, setLeadTime] = useState('30');
  const [cutoffTime, setCutoffTime] = useState('18:00');
  const [savingSettings, setSavingSettings] = useState(false);

  // Assign Delivery Modal
  const [assignTarget, setAssignTarget] = useState<any | null>(null);
  const [driverName, setDriverName] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [assigning, setAssigning] = useState(false);

  const loadData = async () => {
    try {
      const [list, settings] = await Promise.all([
        vendorApi.getDispatches(),
        vendorApi.getDeliverySettings(),
      ]);
      setDispatches(list || []);
      if (settings) {
        if (settings.assignedDarkStoreId) setSelectedHub(settings.assignedDarkStoreId);
        if (settings.preparationTimeMins) setLeadTime(String(settings.preparationTimeMins));
        if (settings.dispatchCutoff) setCutoffTime(settings.dispatchCutoff);
      }
    } catch {}
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingSettings) return;
    setSavingSettings(true);
    try {
      await vendorApi.updateDeliverySettings({
        assignedDarkStoreId: selectedHub,
        preparationTimeMins: Number(leadTime) || 30,
        dispatchCutoff: cutoffTime,
      });
      toast.success('Delivery and SLA settings saved.');
    } finally {
      setSavingSettings(false);
    }
  };

  const openAssignModal = (ord: any) => {
    setAssignTarget(ord);
    setDriverName(ord.driverName || 'Raju Nayak');
    setVehicleNumber(ord.vehicleNumber || 'KA-04-EV-4819');
    setDriverPhone(ord.driverPhone || '+91 98801 44556');
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTarget || !driverName.trim() || !vehicleNumber.trim() || assigning) return;
    setAssigning(true);
    try {
      await vendorApi.assignDelivery(assignTarget.id, {
        driverName: driverName.trim(),
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        driverPhone: driverPhone.trim(),
        hubName: selectedHub,
      });
      toast.success(`Delivery assigned for ${assignTarget.orderNumber}.`);
      setAssignTarget(null);
      loadData();
    } finally {
      setAssigning(false);
    }
  };

  const activeDispatches = dispatches.filter(
    (d) =>
      d.status === 'NEW' ||
      d.status === 'ACCEPTED' ||
      d.status === 'PROCESSING' ||
      d.status === 'READY_FOR_DISPATCH' ||
      d.status === 'DISPATCHED'
  );
  const completedDispatches = dispatches.filter(
    (d) => d.status === 'DELIVERED' || d.status === 'CANCELLED' || d.status === 'RETURNED'
  );

  const renderDispatchTable = (rows: any[], showAssign: boolean) => (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F8F7F5] text-[#78716C] font-semibold border-b border-[#E7E5E4]">
            <tr>
              <th className="py-3 px-4">Order ID</th>
              <th className="py-3 px-4">Customer & Destination</th>
              <th className="py-3 px-4">Assigned Vehicle / Rider</th>
              <th className="py-3 px-4">Dispatch Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7E5E4]">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <EmptyState
                    icon={<Truck className="w-5 h-5" />}
                    title="No dispatch records"
                    description="Orders ready for dispatch or delivery tracking will appear here."
                  />
                </td>
              </tr>
            ) : (
              rows.map((d) => (
                <tr key={d.id} className="hover:bg-[#F8F7F5]">
                  <td className="py-3.5 px-4 font-mono font-semibold text-[#292524]">
                    {d.orderNumber}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-[#292524]">{d.customerName}</div>
                    <div className="text-[11px] text-[#78716C] flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span>
                        {d.deliveryAddress?.area || d.deliveryAddress?.city} -{' '}
                        {d.deliveryAddress?.pincode}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    {d.driverName ? (
                      <div>
                        <div className="font-medium text-[#292524]">{d.driverName}</div>
                        <div className="text-[11px] font-mono text-[#78716C]">
                          {d.vehicleNumber}
                        </div>
                      </div>
                    ) : (
                      <span className="text-[#78716C]">Unassigned</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge
                      variant={
                        d.status === 'DELIVERED'
                          ? 'success'
                          : d.status === 'DISPATCHED'
                          ? 'brand'
                          : d.status === 'CANCELLED'
                          ? 'danger'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {d.status.replace(/_/g, ' ')}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {showAssign && d.status !== 'DISPATCHED' ? (
                      <Button
                        size="sm"
                        variant="accent"
                        onClick={() => openAssignModal(d)}
                      >
                        Assign Delivery
                      </Button>
                    ) : d.status === 'DISPATCHED' ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={async () => {
                          await vendorApi.updateOrderStatus(d.id, 'DELIVERED');
                          toast.success(`Order ${d.orderNumber} marked delivered.`);
                          loadData();
                        }}
                        leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-[#15966B]" />}
                      >
                        Mark Delivered
                      </Button>
                    ) : (
                      <span className="text-[#78716C]">
                        {new Date(d.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Delivery & Dispatch"
        description="Assign delivery partners, track live dispatches, and configure hub dispatch timings."
      />

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E7E5E4] pb-2">
        {[
          { id: 'DISPATCH', label: 'Dispatch Requests & Tracking' },
          { id: 'HISTORY', label: 'Delivery History' },
          { id: 'SETTINGS', label: 'Hub & SLA Settings' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as DeliveryTab)}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#943D24] text-white'
                : 'text-[#78716C] hover:text-[#292524] hover:bg-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'DISPATCH' && renderDispatchTable(activeDispatches, true)}
      {activeTab === 'HISTORY' && renderDispatchTable(completedDispatches, false)}

      {activeTab === 'SETTINGS' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-5 space-y-2">
                <label className="portal-label flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#943D24]" />
                  <span>Preparation Lead Time (Minutes)</span>
                </label>
                <input
                  type="number"
                  min="5"
                  value={leadTime}
                  onChange={(e) => setLeadTime(e.target.value)}
                  className="portal-input"
                />
                <p className="text-xs text-[#78716C]">
                  Time from order confirmation until rider handoff.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 space-y-2">
                <label className="portal-label flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#F6C453]" />
                  <span>Daily Dispatch Cutoff Time</span>
                </label>
                <input
                  type="time"
                  value={cutoffTime}
                  onChange={(e) => setCutoffTime(e.target.value)}
                  className="portal-input"
                />
                <p className="text-xs text-[#78716C]">
                  Orders placed after cutoff are scheduled for next morning.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader
              title="Primary Fulfillment Hub"
              subtitle="Select the Bengaluru hub linked to your dispatch facility."
            />
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {BENGALURU_HUBS.map((hub) => {
                const isSelected = selectedHub === hub.id;
                return (
                  <div
                    key={hub.id}
                    onClick={() => setSelectedHub(hub.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-[#943D24] bg-[#FBF3F0]/60'
                        : 'border-[#E7E5E4] hover:border-[#943D24]/40 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Warehouse className="w-4 h-4 text-[#943D24]" />
                        <span className="font-semibold text-sm text-[#292524]">{hub.name}</span>
                      </div>
                      <Badge variant={isSelected ? 'brand' : 'neutral'} size="sm">
                        {isSelected ? 'Selected' : hub.id}
                      </Badge>
                    </div>
                    <p className="text-xs text-[#78716C] mt-2">{hub.address}</p>
                    <p className="text-[11px] text-[#78716C] mt-2">Pincodes: {hub.coverage}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              isLoading={savingSettings}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Dispatch Settings
            </Button>
          </div>
        </form>
      )}

      {/* Assign Delivery Modal */}
      <Modal
        isOpen={Boolean(assignTarget)}
        onClose={() => setAssignTarget(null)}
        title={`Assign Delivery — ${assignTarget?.orderNumber || ''}`}
        subtitle="Enter rider and vehicle details to mark order as dispatched."
        maxWidth="md"
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <div>
            <label className="portal-label">Driver / Rider Name *</label>
            <input
              type="text"
              required
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              className="portal-input"
            />
          </div>
          <div>
            <label className="portal-label">Vehicle Number *</label>
            <input
              type="text"
              required
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              placeholder="KA-04-EV-4819"
              className="portal-input font-mono uppercase"
            />
          </div>
          <div>
            <label className="portal-label">Driver Contact Phone</label>
            <input
              type="tel"
              value={driverPhone}
              onChange={(e) => setDriverPhone(e.target.value)}
              className="portal-input"
            />
          </div>
          <div className="pt-2 flex justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAssignTarget(null)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={assigning}>
              Confirm Dispatch
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default VendorDeliveryPage;
