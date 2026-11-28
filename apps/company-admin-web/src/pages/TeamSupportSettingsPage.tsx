import React, { useEffect, useState } from 'react';
import { UserCheck, Plus, BellRing, Settings, Shield } from 'lucide-react';
import { adminApi, formatDateTime } from '../services/adminApi';
import {
  PageHeader,
  Card,
  Badge,
  Button,
  Modal,
  statusBadgeVariant,
  useToastStore,
} from '../components/ui';

export const TeamAccessPage: React.FC = () => {
  const pushToast = useToastStore((s) => s.push);
  const [team, setTeam] = useState<{ members: any[]; roles: string[]; permissionMatrix: any }>({
    members: [],
    roles: [],
    permissionMatrix: {},
  });
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '+91 ',
    role: 'OPERATIONS_MANAGER',
    department: 'Operations',
  });

  const loadData = async () => {
    const [t, logs] = await Promise.all([adminApi.getTeam(), adminApi.getAuditLogs()]);
    setTeam(t || { members: [], roles: [], permissionMatrix: {} });
    setAuditLogs(logs || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.inviteTeamMember(form);
      pushToast({ title: 'Team Member Added', message: `${form.email} assigned ${form.role}.` });
      setInviteOpen(false);
      setForm({ name: '', email: '', phone: '+91 ', role: 'OPERATIONS_MANAGER', department: 'Operations' });
      loadData();
    } catch (err: any) {
      pushToast({ title: 'Failed', message: err.message, variant: 'error' });
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Employees, Roles & Audit Logs"
        description="Manage company admin staff, enforce granular RBAC permissions & inspect immutable security logs."
        actions={
          <Button size="sm" variant="accent" onClick={() => setInviteOpen(true)}>
            <Plus className="w-4 h-4" /> Invite Admin User
          </Button>
        }
      />

      <Card noPadding title="Company Admin Team Members">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F0DED0]/75 border-b border-[#E5DCD3] text-[11px] font-semibold text-[#5E5946] uppercase">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DCD3] text-xs bg-white">
              {team.members.map((m) => (
                <tr key={m.id} className="hover:bg-[#FAF7F4] transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-semibold text-[#5E5946]">{m.name}</p>
                    <p className="text-[#6E6859]">{m.email}</p>
                  </td>
                  <td className="py-3 px-3 text-[#6E6859]">{m.department}</td>
                  <td className="py-3 px-3">
                    <select
                      disabled={m.role === 'COMPANY_OWNER'}
                      value={m.role}
                      onChange={async (e) => {
                        await adminApi.updateTeamMember(m.id, { role: e.target.value });
                        pushToast({ title: 'Role Updated' });
                        loadData();
                      }}
                      className="px-2 py-1 border border-[#E5DCD3] rounded-lg bg-white text-xs text-[#5E5946]"
                    >
                      {team.roles.map((r) => (
                        <option key={r} value={r}>
                          {r.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-3">
                    <Badge variant={statusBadgeVariant(m.status)}>{m.status}</Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {m.role !== 'COMPANY_OWNER' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          const next = m.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
                          await adminApi.updateTeamMember(m.id, { status: next });
                          pushToast({ title: `Account ${next}` });
                          loadData();
                        }}
                      >
                        {m.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card title="RBAC Permission Matrix">
          <div className="space-y-2.5 text-xs">
            {team.roles.map((role) => (
              <div key={role} className="p-2.5 bg-[#FAF7F4] rounded-lg border border-[#E5DCD3]">
                <p className="font-semibold text-[#AE887B]">{role.replace(/_/g, ' ')}</p>
                <p className="text-[#6E6859] mt-0.5">
                  {(team.permissionMatrix?.[role] || []).join(', ')}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Security & Activity Audit Logs">
          <div className="divide-y divide-[#E5DCD3] max-h-96 overflow-y-auto text-xs">
            {auditLogs.slice(0, 25).map((l) => (
              <div key={l.id} className="py-2.5">
                <div className="flex flex-wrap justify-between gap-1">
                  <span className="font-semibold text-[#5E5946]">{l.action}</span>
                  <span className="text-[#6E6859]">{formatDateTime(l.createdAt)}</span>
                </div>
                <p className="text-[#6E6859] mt-0.5">{l.details}</p>
                <p className="text-[11px] text-[#AE887B] font-medium">
                  {l.actorName} ({l.actorRole})
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite Company Admin">
        <form onSubmit={handleInvite} className="space-y-3 text-xs">
          <input
            required
            placeholder="Full Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
          />
          <input
            required
            type="email"
            placeholder="Work Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
          >
            {team.roles.map((r) => (
              <option key={r} value={r}>
                {r.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create & Send Invite</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export const SupportNotificationsPage: React.FC = () => {
  const pushToast = useToastStore((s) => s.push);
  const [data, setData] = useState<any>({ alerts: [], tickets: [], templates: [] });
  const [tplModal, setTplModal] = useState(false);
  const [editingTplId, setEditingTplId] = useState<string | null>(null);
  const [tplForm, setTplForm] = useState({
    name: '',
    channel: 'EMAIL',
    eventKey: 'ORDER_DISPATCHED',
    subject: '',
    body: '',
    isActive: true,
  });

  const loadData = async () => {
    const res = await adminApi.getSupportNotifications();
    setData(res || { alerts: [], tickets: [], templates: [] });
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Notifications, Support & Templates"
        description="Respond to customer/vendor tickets, review system alerts & customize automated messaging."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                await adminApi.markAllAlertsRead();
                pushToast({ title: 'All Alerts Marked Read' });
                loadData();
              }}
            >
              Mark All Read
            </Button>
            <Button
              size="sm"
              variant="accent"
              onClick={() => {
                setEditingTplId(null);
                setTplForm({ name: '', channel: 'EMAIL', eventKey: 'ORDER_DISPATCHED', subject: '', body: '', isActive: true });
                setTplModal(true);
              }}
            >
              <Plus className="w-4 h-4" /> New Template
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card title="System Alerts & Escalations">
          <div className="space-y-2.5 text-xs">
            {(data.alerts || []).map((a: any) => (
              <div
                key={a.id}
                className={`p-3 rounded-lg border ${
                  a.isRead ? 'bg-white border-[#E5DCD3]' : 'bg-[#F0DED0]/60 border-[#AE887B]/45'
                }`}
              >
                <div className="flex flex-wrap justify-between gap-1">
                  <span className="font-semibold text-[#5E5946]">{a.title}</span>
                  <Badge variant={a.severity === 'WARNING' ? 'warning' : 'info'}>{a.type}</Badge>
                </div>
                <p className="text-[#6E6859] mt-1">{a.message}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Customer & Vendor Support Tickets">
          <div className="divide-y divide-[#E5DCD3] text-xs">
            {(data.tickets || []).map((t: any) => (
              <div key={t.id} className="py-3 flex flex-wrap justify-between items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[#5E5946] break-words">
                    {t.subject || t.ticketNumber}
                  </p>
                  <p className="text-[#6E6859]">
                    {t.source} • Priority: {t.priority}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Badge variant={statusBadgeVariant(t.status)}>{t.status}</Badge>
                  {t.status !== 'RESOLVED' && (
                    <Button
                      size="sm"
                      variant="success"
                      onClick={async () => {
                        await adminApi.updateTicket(t.id, 'RESOLVED', 'Resolved by Company Admin');
                        pushToast({ title: 'Ticket Resolved' });
                        loadData();
                      }}
                    >
                      Resolve
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Email & SMS Notification Templates">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {(data.templates || []).map((tpl: any) => (
            <div key={tpl.id} className="p-3.5 border border-[#E5DCD3] bg-[#FAF7F4] rounded-lg space-y-1.5 flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap justify-between items-center gap-1.5">
                  <span className="font-semibold text-[#5E5946] min-w-0 break-words">{tpl.name}</span>
                  <Badge variant="info">{tpl.channel}</Badge>
                </div>
                <p className="font-medium text-[#AE887B] mt-1">{tpl.subject}</p>
                <p className="text-[#6E6859] mt-0.5">{tpl.body}</p>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-[#E5DCD3]">
                <Badge variant={tpl.isActive !== false ? 'success' : 'error'}>
                  {tpl.isActive !== false ? 'Active' : 'Paused'}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingTplId(tpl.id);
                    setTplForm({
                      name: tpl.name || '',
                      channel: tpl.channel || 'EMAIL',
                      eventKey: tpl.eventKey || 'CUSTOM_EVENT',
                      subject: tpl.subject || '',
                      body: tpl.body || '',
                      isActive: tpl.isActive !== false,
                    });
                    setTplModal(true);
                  }}
                >
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal
        open={tplModal}
        onClose={() => {
          setTplModal(false);
          setEditingTplId(null);
        }}
        title={editingTplId ? 'Edit Notification Template' : 'Create Notification Template'}
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (editingTplId) {
              await adminApi.updateTemplate(editingTplId, tplForm);
              pushToast({ title: 'Template Updated' });
            } else {
              await adminApi.createTemplate(tplForm);
              pushToast({ title: 'Template Created' });
            }
            setTplModal(false);
            setEditingTplId(null);
            loadData();
          }}
          className="space-y-3 text-xs"
        >
          <input
            required
            placeholder="Template Name"
            value={tplForm.name}
            onChange={(e) => setTplForm({ ...tplForm, name: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select
              value={tplForm.channel}
              onChange={(e) => setTplForm({ ...tplForm, channel: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
            >
              <option value="EMAIL">EMAIL</option>
              <option value="SMS">SMS</option>
              <option value="WHATSAPP">WHATSAPP</option>
            </select>
            <input
              required
              placeholder="Event Key"
              value={tplForm.eventKey}
              onChange={(e) => setTplForm({ ...tplForm, eventKey: e.target.value })}
              className="px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg font-mono"
            />
          </div>
          <input
            required
            placeholder="Subject / Header"
            value={tplForm.subject}
            onChange={(e) => setTplForm({ ...tplForm, subject: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
          />
          <textarea
            required
            rows={4}
            placeholder="Message body ({{variables}} supported)"
            value={tplForm.body}
            onChange={(e) => setTplForm({ ...tplForm, body: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={tplForm.isActive}
              onChange={(e) => setTplForm({ ...tplForm, isActive: e.target.checked })}
            />
            <span>Template Active</span>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setTplModal(false)}>
              Cancel
            </Button>
            <Button type="submit">{editingTplId ? 'Save Changes' : 'Create Template'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export const CompanySettingsPage: React.FC = () => {
  const pushToast = useToastStore((s) => s.push);
  const [settings, setSettings] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'COMPANY' | 'PAYMENTS_TAX' | 'DELIVERY' | 'VENDOR_SECURITY'>('COMPANY');

  useEffect(() => {
    adminApi.getSettings().then(setSettings);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await adminApi.updateSettings(settings);
      setSettings(updated);
      pushToast({ title: 'Company Settings Saved', message: 'All payment, tax, delivery & approval policies synced across portals.' });
    } catch (err: any) {
      pushToast({ title: 'Save Failed', message: err.message, variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return <div className="text-xs text-[#6E6859] p-4">Loading company configuration...</div>;

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <PageHeader
        title="Company Settings & Configuration"
        description="Configure legal registration, COD/commission/GST rules, delivery ETAs & fees, vendor approval requirements & security."
        actions={
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2 border-b border-[#E5DCD3] pb-2 text-xs">
        {[
          { id: 'COMPANY', label: 'Company & Bank Details' },
          { id: 'PAYMENTS_TAX', label: 'Payments, COD & Tax' },
          { id: 'DELIVERY', label: 'Delivery Rules & ETA' },
          { id: 'VENDOR_SECURITY', label: 'Vendor Approval & Security' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSettingsTab(t.id as any)}
            className={`px-3.5 py-1.5 rounded-lg font-medium border transition-colors ${
              settingsTab === t.id
                ? 'bg-[#AE887B] text-white border-[#AE887B]'
                : 'bg-white text-[#5E5946] border-[#E5DCD3] hover:bg-[#FAF7F4]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {settingsTab === 'COMPANY' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
          <Card title="Company Profile & Tax Registration">
            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-[#5E5946] mb-1">Display Workspace Name</label>
                <input
                  value={settings.name || ''}
                  onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-2">
                <div>
                  <label className="block font-semibold text-[#5E5946] mb-1">GSTIN</label>
                  <input
                    value={settings.gstin || ''}
                    onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#5E5946] mb-1">Support Email</label>
                  <input
                    value={settings.supportEmail || ''}
                    onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-2">
                <div>
                  <label className="block font-semibold text-[#5E5946] mb-1">Support Phone</label>
                  <input
                    value={settings.supportPhone || ''}
                    onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#5E5946] mb-1">City</label>
                  <input
                    value={settings.city || ''}
                    onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card title="Company Bank Account (Settlement Source)">
            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-[#5E5946] mb-1">Bank Name</label>
                <input
                  value={settings.bankDetails?.bankName || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      bankDetails: { ...settings.bankDetails, bankName: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-2">
                <div>
                  <label className="block font-semibold text-[#5E5946] mb-1">Account Number</label>
                  <input
                    value={settings.bankDetails?.accountNumber || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        bankDetails: { ...settings.bankDetails, accountNumber: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#5E5946] mb-1">IFSC Code</label>
                  <input
                    value={settings.bankDetails?.ifscCode || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        bankDetails: { ...settings.bankDetails, ifscCode: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg font-mono"
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {settingsTab === 'PAYMENTS_TAX' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
          <Card title="Payments, COD & Platform Commission">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#5E5946] mb-1">Commission Rate (%)</label>
                <input
                  type="number"
                  value={settings.paymentConfig?.platformCommissionPercent ?? 6}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      paymentConfig: {
                        ...settings.paymentConfig,
                        platformCommissionPercent: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#5E5946] mb-1">Settlement Cycle (Days)</label>
                <input
                  type="number"
                  value={settings.paymentConfig?.settlementCycleDays ?? 7}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      paymentConfig: {
                        ...settings.paymentConfig,
                        settlementCycleDays: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#5E5946] mb-1">COD Max Order Value (₹)</label>
                <input
                  type="number"
                  value={settings.paymentConfig?.codMaxOrderValue ?? 50000}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      paymentConfig: {
                        ...settings.paymentConfig,
                        codMaxOrderValue: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                />
              </div>
              <div className="flex flex-col justify-end gap-2 pb-1">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.paymentConfig?.codEnabled !== false}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        paymentConfig: { ...settings.paymentConfig, codEnabled: e.target.checked },
                      })
                    }
                  />
                  <span>Enable Pay on Delivery (COD)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.paymentConfig?.razorpayEnabled !== false}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        paymentConfig: { ...settings.paymentConfig, razorpayEnabled: e.target.checked },
                      })
                    }
                  />
                  <span>Enable Online Payment (Razorpay)</span>
                </label>
              </div>
            </div>
          </Card>

          <Card title="GST & TDS Tax Configuration">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#5E5946] mb-1">Default GST Rate (%)</label>
                <input
                  type="number"
                  value={settings.taxConfig?.defaultGstRate ?? 18}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      taxConfig: { ...settings.taxConfig, defaultGstRate: Number(e.target.value) },
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#5E5946] mb-1">Vendor TDS Deduction (decimal e.g. 0.01 = 1%)</label>
                <input
                  type="number"
                  step="0.005"
                  value={settings.taxConfig?.tdsRate ?? 0.01}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      taxConfig: { ...settings.taxConfig, tdsRate: Number(e.target.value) },
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                />
              </div>
              <div className="col-span-2">
                <label className="block font-semibold text-[#5E5946] mb-1">Allowed GST Slabs (comma-separated %)</label>
                <input
                  value={(settings.taxConfig?.gstSlabs || [0, 5, 12, 18, 28]).join(', ')}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      taxConfig: {
                        ...settings.taxConfig,
                        gstSlabs: e.target.value
                          .split(',')
                          .map((x) => Number(x.trim()))
                          .filter((x) => !Number.isNaN(x)),
                      },
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {settingsTab === 'DELIVERY' && (
        <Card title="Delivery Charges, Free Shipping Threshold & ETA Policies">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#5E5946] mb-1">Standard Delivery Fee (₹)</label>
              <input
                type="number"
                value={settings.deliveryConfig?.defaultShippingCharge ?? 199}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    deliveryConfig: { ...settings.deliveryConfig, defaultShippingCharge: Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#5E5946] mb-1">Express 60-Min Delivery Fee (₹)</label>
              <input
                type="number"
                value={settings.deliveryConfig?.expressDeliveryFee ?? 249}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    deliveryConfig: { ...settings.deliveryConfig, expressDeliveryFee: Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#5E5946] mb-1">Base Unloading Fee (₹)</label>
              <input
                type="number"
                value={settings.deliveryConfig?.baseUnloadingFee ?? 199}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    deliveryConfig: { ...settings.deliveryConfig, baseUnloadingFee: Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#5E5946] mb-1">Free Shipping Threshold (₹)</label>
              <input
                type="number"
                value={settings.deliveryConfig?.freeShippingThreshold ?? 1000}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    deliveryConfig: { ...settings.deliveryConfig, freeShippingThreshold: Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#5E5946] mb-1">Express ETA Text</label>
              <input
                value={settings.deliveryConfig?.expressEtaText || 'Delivery in 60 mins'}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    deliveryConfig: { ...settings.deliveryConfig, expressEtaText: e.target.value },
                  })
                }
                className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#5E5946] mb-1">Standard ETA Text</label>
              <input
                value={settings.deliveryConfig?.standardEtaText || 'Standard Next-Day Delivery'}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    deliveryConfig: { ...settings.deliveryConfig, standardEtaText: e.target.value },
                  })
                }
                className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
              />
            </div>
          </div>
        </Card>
      )}

      {settingsTab === 'VENDOR_SECURITY' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
          <Card title="Vendor Onboarding & Approval Policy">
            <div className="space-y-2.5">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.vendorApprovalConfig?.requireGstDoc !== false}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      vendorApprovalConfig: { ...settings.vendorApprovalConfig, requireGstDoc: e.target.checked },
                    })
                  }
                />
                <span>Require GST Registration Certificate</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.vendorApprovalConfig?.requirePanDoc !== false}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      vendorApprovalConfig: { ...settings.vendorApprovalConfig, requirePanDoc: e.target.checked },
                    })
                  }
                />
                <span>Require Company PAN Verification</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.vendorApprovalConfig?.requireBankProof !== false}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      vendorApprovalConfig: { ...settings.vendorApprovalConfig, requireBankProof: e.target.checked },
                    })
                  }
                />
                <span>Require Cancelled Cheque / Bank Passbook Proof</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(settings.vendorApprovalConfig?.autoApproveVerifiedGst)}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      vendorApprovalConfig: { ...settings.vendorApprovalConfig, autoApproveVerifiedGst: e.target.checked },
                    })
                  }
                />
                <span>Auto-approve vendors upon verified GST match</span>
              </label>
            </div>
          </Card>

          <Card title="Security & Notification Policies">
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(settings.securitySettings?.enforce2FA)}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      securitySettings: {
                        ...settings.securitySettings,
                        enforce2FA: e.target.checked,
                      },
                    })
                  }
                />
                <span>Enforce Two-Factor Authentication for Finance Managers</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(settings.notificationPrefs?.emailAlerts)}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      notificationPrefs: {
                        ...settings.notificationPrefs,
                        emailAlerts: e.target.checked,
                      },
                    })
                  }
                />
                <span>Send real-time Email Alerts for Vendor KYC & Low Stock</span>
              </label>
            </div>
          </Card>
        </div>
      )}
    </form>
  );
};
