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
                <div className="flex justify-between">
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
                <div className="flex justify-between">
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
              <div key={t.id} className="py-3 flex justify-between items-center gap-2">
                <div>
                  <p className="font-semibold text-[#5E5946]">
                    {t.subject || t.ticketNumber}
                  </p>
                  <p className="text-[#6E6859]">
                    {t.source} • Priority: {t.priority}
                  </p>
                </div>
                <div className="flex items-center gap-2">
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
            <div key={tpl.id} className="p-3.5 border border-[#E5DCD3] bg-[#FAF7F4] rounded-lg space-y-1.5">
              <div className="flex justify-between">
                <span className="font-semibold text-[#5E5946]">{tpl.name}</span>
                <Badge variant="info">{tpl.channel}</Badge>
              </div>
              <p className="font-medium text-[#AE887B]">{tpl.subject}</p>
              <p className="text-[#6E6859]">{tpl.body}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export const CompanySettingsPage: React.FC = () => {
  const pushToast = useToastStore((s) => s.push);
  const [settings, setSettings] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi.getSettings().then(setSettings);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await adminApi.updateSettings(settings);
      setSettings(updated);
      pushToast({ title: 'Company Settings Saved', message: 'All tax, payment & delivery policies updated.' });
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
        description="Configure legal registration, GST/tax rules, settlement bank account, shipping fees & security."
        actions={
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        }
      />

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
            <div className="grid grid-cols-2 gap-2">
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
            <div className="grid grid-cols-2 gap-2">
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

        <Card title="Payment, Commission & Delivery Fees">
          <div className="grid grid-cols-2 gap-3">
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
              <label className="block font-semibold text-[#5E5946] mb-1">Standard Delivery Fee (₹)</label>
              <input
                type="number"
                value={settings.deliveryConfig?.defaultShippingCharge ?? 199}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    deliveryConfig: {
                      ...settings.deliveryConfig,
                      defaultShippingCharge: Number(e.target.value),
                    },
                  })
                }
                className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#5E5946] mb-1">Free Shipping Threshold (₹)</label>
              <input
                type="number"
                value={settings.deliveryConfig?.freeShippingThreshold ?? 5000}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    deliveryConfig: {
                      ...settings.deliveryConfig,
                      freeShippingThreshold: Number(e.target.value),
                    },
                  })
                }
                className="w-full px-3 py-2 bg-white border border-[#E5DCD3] rounded-lg"
              />
            </div>
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
    </form>
  );
};
