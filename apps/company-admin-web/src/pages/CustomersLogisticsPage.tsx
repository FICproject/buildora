import React, { useEffect, useState } from 'react';
import { Users, Truck, MapPin, Plus, Navigation } from 'lucide-react';
import { adminApi, formatINR, formatDateTime } from '../services/adminApi';
import {
  PageHeader,
  Card,
  Badge,
  Button,
  Drawer,
  Modal,
  statusBadgeVariant,
  useToastStore,
} from '../components/ui';

export const CustomersPage: React.FC = () => {
  const pushToast = useToastStore((s) => s.push);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [detail, setDetail] = useState<any>(null);

  const loadCustomers = async () => {
    const list = await adminApi.getCustomers(typeFilter, search);
    setCustomers(list || []);
  };

  useEffect(() => {
    loadCustomers();
  }, [typeFilter]);

  const openDetail = async (id: string) => {
    const res = await adminApi.getCustomerDetail(id);
    setDetail(res);
  };

  const toggleStatus = async (c: any) => {
    const next = c.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    await adminApi.toggleCustomerStatus(c.id, next);
    pushToast({ title: `Customer ${next}` });
    loadCustomers();
    if (detail?.customer?.id === c.id) openDetail(c.id);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Customer Management"
        description="View B2B contractors, builders & homeowner accounts, order histories & wallet balances."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {['ALL', 'CONTRACTOR', 'BUILDER', 'ARCHITECT', 'HOMEOWNER'].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                typeFilter === t
                  ? 'bg-[#AE887B] text-white border-[#AE887B] shadow-sm'
                  : 'bg-white text-[#5E5946] border-[#E5DCD3] hover:bg-[#F0DED0]/45'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, email..."
            className="px-3 py-1.5 text-xs bg-white border border-[#E5DCD3] rounded-lg focus:outline-none focus:border-[#AE887B]"
          />
          <Button size="sm" variant="secondary" onClick={loadCustomers}>
            Search
          </Button>
        </div>
      </div>

      <Card noPadding>
        <div className="overflow-x-auto rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F0DED0]/75 border-b border-[#E5DCD3] text-[11px] font-semibold text-[#5E5946] uppercase">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-3">Segment & City</th>
                <th className="py-3 px-3">Orders / Spend</th>
                <th className="py-3 px-3">Wallet</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DCD3] text-xs bg-white">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-[#FAF7F4] transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-semibold text-[#5E5946]">{c.name}</p>
                    <p className="text-[#6E6859]">
                      {c.email} • {c.phone}
                    </p>
                  </td>
                  <td className="py-3 px-3">
                    <Badge variant="info">{c.customerType}</Badge>
                    <p className="text-[#6E6859] mt-0.5">
                      {c.city} - {c.pincode}
                    </p>
                  </td>
                  <td className="py-3 px-3">
                    <p className="font-semibold text-[#5E5946]">{c.totalOrders} orders</p>
                    <p className="text-[#6E6859]">{formatINR(c.totalSpent)}</p>
                  </td>
                  <td className="py-3 px-3 font-semibold text-[#15966B]">
                    {formatINR(c.walletBalance)}
                  </td>
                  <td className="py-3 px-3">
                    <Badge variant={statusBadgeVariant(c.status)}>{c.status}</Badge>
                  </td>
                  <td className="py-3 px-4 text-right space-x-1.5">
                    <Button size="sm" variant="outline" onClick={() => openDetail(c.id)}>
                      Profile
                    </Button>
                    <Button
                      size="sm"
                      variant={c.status === 'ACTIVE' ? 'danger' : 'success'}
                      onClick={() => toggleStatus(c)}
                    >
                      {c.status === 'ACTIVE' ? 'Block' : 'Activate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Drawer
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail?.customer?.name || 'Customer Detail'}
        subtitle={`${detail?.customer?.customerType || ''} • GSTIN: ${detail?.customer?.gstin || 'Unregistered'}`}
      >
        {detail && (
          <div className="space-y-5 text-xs">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 border border-[#E5DCD3] bg-[#F9F2EC] rounded-lg">
                <p className="text-[#6E6859]">Lifetime Spend</p>
                <p className="text-base font-bold text-[#AE887B]">
                  {formatINR(detail.customer.totalSpent)}
                </p>
              </div>
              <div className="p-3 border border-[#E5DCD3] bg-white rounded-lg">
                <p className="text-[#6E6859]">Wallet Balance</p>
                <p className="text-base font-bold text-[#15966B]">
                  {formatINR(detail.customer.walletBalance)}
                </p>
              </div>
              <div className="p-3 border border-[#E5DCD3] bg-white rounded-lg">
                <p className="text-[#6E6859]">Orders</p>
                <p className="text-base font-bold text-[#5E5946]">{detail.customer.totalOrders}</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-sm text-[#5E5946] mb-2">Recent Activity</h4>
              <ul className="space-y-1.5 list-disc pl-5 text-[#6E6859]">
                {(detail.customer.recentActivity || []).map((act: string, i: number) => (
                  <li key={i}>{act}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm text-[#5E5946] mb-2">Order History</h4>
              <div className="divide-y divide-[#E5DCD3] border border-[#E5DCD3] rounded-lg bg-white">
                {(detail.orders || []).length === 0 ? (
                  <p className="p-3 text-[#6E6859]">No matched recent orders.</p>
                ) : (
                  detail.orders.map((o: any) => (
                    <div key={o.id} className="p-3 flex justify-between">
                      <span className="font-medium text-[#5E5946]">{o.orderNumber || o.id}</span>
                      <span className="font-semibold text-[#5E5946]">{formatINR(o.totalAmount)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export const DeliveryLogisticsPage: React.FC = () => {
  const pushToast = useToastStore((s) => s.push);
  const [data, setData] = useState<any>({
    partners: [],
    dispatches: [],
    readyForDispatchOrders: [],
    pincodes: [],
  });
  const [assignModal, setAssignModal] = useState<any>(null);
  const [assignForm, setAssignForm] = useState({
    partnerId: '',
    vehicleNumber: 'KA-05-BLD-6060',
    driverName: 'Ramesh Kumar',
    driverPhone: '+91 98450 88776',
  });
  const [partnerModal, setPartnerModal] = useState(false);
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);
  const [partnerForm, setPartnerForm] = useState({
    name: '',
    phone: '',
    contactPerson: '',
    baseCharge: 199,
  });
  const [pinModal, setPinModal] = useState(false);
  const [pinForm, setPinForm] = useState({
    pincode: '',
    locality: '',
    city: 'Bengaluru',
    assignedWarehouse: 'Primary Warehouse Hub',
    etaMinutes: 60,
    expressAvailable: true,
    isActive: true,
  });

  const loadData = async () => {
    const res = await adminApi.getDeliveryOverview();
    setData(res || { partners: [], dispatches: [], readyForDispatchOrders: [], pincodes: [] });
    if (res?.partners?.[0]?.id && !assignForm.partnerId) {
      setAssignForm((f) => ({ ...f, partnerId: res.partners[0].id }));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const submitAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModal) return;
    try {
      await adminApi.assignDelivery({
        orderId: assignModal.id,
        ...assignForm,
      });
      pushToast({ title: 'Delivery Dispatched', message: `Partner assigned for ${assignModal.orderNumber || assignModal.id}.` });
      setAssignModal(null);
      loadData();
    } catch (err: any) {
      pushToast({ title: 'Dispatch Failed', message: err.message, variant: 'error' });
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Delivery, Dispatch & Logistics"
        description="Manage fleet partners, dispatch ready orders, track live fulfillment & inspect serviceable zones."
        actions={
          <Button size="sm" variant="accent" onClick={() => setPartnerModal(true)}>
            <Plus className="w-4 h-4" /> Add Fleet Partner
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Dispatch Queue */}
        <Card
          title="Orders Ready for Dispatch"
          subtitle={`${(data.readyForDispatchOrders || []).length} awaiting fleet assignment`}
        >
          <div className="divide-y divide-[#E5DCD3] text-xs">
            {(data.readyForDispatchOrders || []).length === 0 ? (
              <p className="py-6 text-center text-[#6E6859]">All confirmed orders have been dispatched.</p>
            ) : (
              data.readyForDispatchOrders.map((o: any) => (
                <div key={o.id} className="py-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[#AE887B]">{o.orderNumber || o.id}</p>
                    <p className="text-[#6E6859]">{o.customerName} • {o.deliveryAddress}</p>
                  </div>
                  <Button size="sm" variant="dark" onClick={() => setAssignModal(o)}>
                    <Navigation className="w-3.5 h-3.5" /> Assign Fleet
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Active Dispatch Tracking */}
        <Card title="Live Dispatch Tracking" subtitle={`${(data.dispatches || []).length} active shipments`}>
          <div className="divide-y divide-[#E5DCD3] text-xs">
            {(data.dispatches || []).length === 0 ? (
              <p className="py-6 text-center text-[#6E6859]">Assign an order from the left panel to begin live tracking.</p>
            ) : (
              data.dispatches.map((d: any) => (
                <div key={d.orderId} className="py-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[#5E5946]">
                      {d.partnerName} ({d.vehicleNumber})
                    </p>
                    <p className="text-[#6E6859]">
                      Driver: {d.driverName} • Assigned {formatDateTime(d.assignedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusBadgeVariant(d.status)}>{d.status}</Badge>
                    {d.status !== 'DELIVERED' && (
                      <Button
                        size="sm"
                        variant="success"
                        onClick={async () => {
                          await adminApi.updateDeliveryStatus(d.orderId, 'DELIVERED');
                          pushToast({ title: 'Delivered', message: 'Order marked DELIVERED.' });
                          loadData();
                        }}
                      >
                        Mark Delivered
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Fleet Partners & Serviceable Zones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card title="Delivery Partners & SLAs">
          <div className="divide-y divide-[#E5DCD3] text-xs">
            {(data.partners || []).map((p: any) => (
              <div key={p.id} className="py-3 flex justify-between items-center gap-2">
                <div>
                  <p className="font-semibold text-[#5E5946]">{p.name}</p>
                  <p className="text-[#6E6859]">
                    {p.contactPerson} • {p.phone} • Base {formatINR(p.baseCharge)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <Badge variant="success">{p.onTimeRate}% On-Time</Badge>
                    <p className="text-[#6E6859] mt-0.5">{p.completedDeliveries} deliveries</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingPartnerId(p.id);
                      setPartnerForm({
                        name: p.name || '',
                        phone: p.phone || '',
                        contactPerson: p.contactPerson || '',
                        baseCharge: p.baseCharge ?? 199,
                      });
                      setPartnerModal(true);
                    }}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card
          title="Serviceable Pincodes & Delivery Zones"
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setPinForm({ pincode: '', locality: '', city: 'Bengaluru', assignedWarehouse: 'Primary Warehouse Hub', etaMinutes: 60, expressAvailable: true, isActive: true });
                setPinModal(true);
              }}
            >
              <Plus className="w-3.5 h-3.5" /> Add Pincode Zone
            </Button>
          }
        >
          <div className="flex flex-wrap gap-2">
            {(Array.isArray(data.pincodes) ? data.pincodes : []).map((pin: any, idx: number) => {
              const code = typeof pin === 'string' ? pin : pin.pincode || pin.code || '';
              return (
                <div
                  key={code || idx}
                  className="px-3 py-2 border border-[#E5DCD3] rounded-lg text-xs flex items-center gap-2 bg-[#F9F2EC]"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#AE887B]" />
                  <span className="font-mono font-semibold text-[#5E5946]">{code}</span>
                  {(pin?.locality || pin?.area || pin?.zoneName) && (
                    <span className="text-[#6E6859]">
                      {pin.locality || pin.area || pin.zoneName} ({pin.etaMinutes || 60}m)
                    </span>
                  )}
                  <button
                    type="button"
                    className="text-[11px] text-[#AE887B] hover:underline ml-1"
                    onClick={() => {
                      setPinForm({
                        pincode: code,
                        locality: pin.locality || pin.area || '',
                        city: pin.city || 'Bengaluru',
                        assignedWarehouse: pin.assignedWarehouse || pin.warehouse || 'Primary Warehouse Hub',
                        etaMinutes: Number(pin.etaMinutes || 60),
                        expressAvailable: pin.expressAvailable !== false,
                        isActive: pin.isActive !== false,
                      });
                      setPinModal(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-[11px] text-[#C94444] hover:underline"
                    onClick={async () => {
                      await adminApi.deletePincodeZone(code);
                      pushToast({ title: `Removed pincode ${code}` });
                      loadData();
                    }}
                  >
                    Del
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Modal open={Boolean(assignModal)} onClose={() => setAssignModal(null)} title="Assign Fleet & Dispatch">
        <form onSubmit={submitAssign} className="space-y-3 text-xs">
          <select
            required
            value={assignForm.partnerId}
            onChange={(e) => setAssignForm({ ...assignForm, partnerId: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
          >
            {(data.partners || []).map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.code})
              </option>
            ))}
          </select>
          <input
            required
            placeholder="Vehicle Number"
            value={assignForm.vehicleNumber}
            onChange={(e) => setAssignForm({ ...assignForm, vehicleNumber: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              required
              placeholder="Driver Name"
              value={assignForm.driverName}
              onChange={(e) => setAssignForm({ ...assignForm, driverName: e.target.value })}
              className="px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
            />
            <input
              required
              placeholder="Driver Phone"
              value={assignForm.driverPhone}
              onChange={(e) => setAssignForm({ ...assignForm, driverPhone: e.target.value })}
              className="px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setAssignModal(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Confirm Dispatch
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={partnerModal}
        onClose={() => {
          setPartnerModal(false);
          setEditingPartnerId(null);
        }}
        title={editingPartnerId ? 'Edit Delivery Partner' : 'Register Delivery Partner'}
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (editingPartnerId) {
              await adminApi.updateDeliveryPartner(editingPartnerId, partnerForm);
              pushToast({ title: 'Delivery Partner Updated' });
            } else {
              await adminApi.createDeliveryPartner(partnerForm);
              pushToast({ title: 'Delivery Partner Added' });
            }
            setPartnerModal(false);
            setEditingPartnerId(null);
            loadData();
          }}
          className="space-y-3 text-xs"
        >
          <input
            required
            placeholder="Partner Name"
            value={partnerForm.name}
            onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
          />
          <input
            required
            placeholder="Contact Person"
            value={partnerForm.contactPerson}
            onChange={(e) => setPartnerForm({ ...partnerForm, contactPerson: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
          />
          <input
            required
            placeholder="Contact Phone"
            value={partnerForm.phone}
            onChange={(e) => setPartnerForm({ ...partnerForm, phone: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
          />
          <input
            type="number"
            placeholder="Base Delivery Fee (₹)"
            value={partnerForm.baseCharge}
            onChange={(e) => setPartnerForm({ ...partnerForm, baseCharge: Number(e.target.value) })}
            className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setPartnerModal(false)}>
              Cancel
            </Button>
            <Button type="submit">{editingPartnerId ? 'Save Changes' : 'Add Partner'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={pinModal} onClose={() => setPinModal(false)} title="Configure Serviceable Pincode Zone">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await adminApi.upsertPincodeZone(pinForm);
            pushToast({ title: `Pincode ${pinForm.pincode} Saved`, message: 'Customer Web serviceability synced.' });
            setPinModal(false);
            loadData();
          }}
          className="space-y-3 text-xs"
        >
          <div className="grid grid-cols-2 gap-2">
            <input
              required
              pattern="[1-9][0-9]{5}"
              placeholder="6-digit Pincode *"
              value={pinForm.pincode}
              onChange={(e) => setPinForm({ ...pinForm, pincode: e.target.value })}
              className="px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg font-mono"
            />
            <input
              required
              placeholder="Locality / Hub Name *"
              value={pinForm.locality}
              onChange={(e) => setPinForm({ ...pinForm, locality: e.target.value })}
              className="px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="City"
              value={pinForm.city}
              onChange={(e) => setPinForm({ ...pinForm, city: e.target.value })}
              className="px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
            />
            <input
              type="number"
              min={15}
              placeholder="ETA Minutes (e.g. 60)"
              value={pinForm.etaMinutes}
              onChange={(e) => setPinForm({ ...pinForm, etaMinutes: Number(e.target.value) })}
              className="px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
            />
          </div>
          <input
            placeholder="Assigned Warehouse Hub"
            value={pinForm.assignedWarehouse}
            onChange={(e) => setPinForm({ ...pinForm, assignedWarehouse: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
          />
          <div className="flex gap-4">
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={pinForm.expressAvailable}
                onChange={(e) => setPinForm({ ...pinForm, expressAvailable: e.target.checked })}
              />
              <span>60-Min Express Enabled</span>
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={pinForm.isActive}
                onChange={(e) => setPinForm({ ...pinForm, isActive: e.target.checked })}
              />
              <span>Active Zone</span>
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setPinModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Pincode Zone</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
