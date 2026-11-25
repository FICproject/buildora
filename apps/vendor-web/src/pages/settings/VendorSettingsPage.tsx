import React, { useState, useEffect } from 'react';
import { Users, ShieldCheck, Bell, Clock, Plus, Trash2, Save } from 'lucide-react';
import { vendorApi } from '../../services/vendorApi';
import { VendorEmployee, VendorRole } from '@buildora/types';
import {
  PageHeader,
  Card,
  CardHeader,
  CardContent,
  Button,
  Badge,
  Modal,
  ConfirmDialog,
  EmptyState,
} from '../../components/common';
import { toast } from '../../store/useToastStore';

type SettingsTab = 'TEAM' | 'SECURITY' | 'NOTIFICATIONS' | 'HOURS';

export const VendorSettingsPage: React.FC<{ initialTab?: SettingsTab }> = ({
  initialTab = 'TEAM',
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  // Team & RBAC
  const [team, setTeam] = useState<VendorEmployee[]>([]);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<VendorEmployee | null>(null);
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empRole, setEmpRole] = useState<VendorRole>('INVENTORY_MANAGER');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    'INVENTORY_MANAGE',
    'ORDERS_MANAGE',
  ]);
  const [inviting, setInviting] = useState(false);

  // Security
  const [enable2FA, setEnable2FA] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingSecurity, setSavingSecurity] = useState(false);

  // Notifications
  const [notifPrefs, setNotifPrefs] = useState({
    smsDispatch: true,
    whatsappDispatch: true,
    emailSettlement: true,
    stockWarning: true,
  });
  const [savingNotifs, setSavingNotifs] = useState(false);

  const loadTeam = async () => {
    try {
      const members = await vendorApi.getTeam();
      setTeam(members || []);
    } catch {}
  };

  useEffect(() => {
    loadTeam();
  }, []);

  const rolesConfig: { role: VendorRole; title: string; desc: string }[] = [
    { role: 'VENDOR_OWNER', title: 'Store Owner', desc: 'Full access across all modules.' },
    { role: 'VENDOR_ADMIN', title: 'General Admin', desc: 'Manages catalog, orders, and team.' },
    { role: 'CATALOG_MANAGER', title: 'Catalog Manager', desc: 'Manages products and pricing.' },
    { role: 'INVENTORY_MANAGER', title: 'Inventory Manager', desc: 'Manages stock and warehouses.' },
    { role: 'ORDER_MANAGER', title: 'Order Manager', desc: 'Handles orders and dispatch.' },
    { role: 'FINANCE_MANAGER', title: 'Finance Manager', desc: 'Handles settlements and invoices.' },
    { role: 'SUPPORT_STAFF', title: 'Support Staff', desc: 'Handles reviews and support tickets.' },
  ];

  const permissionsList = [
    { id: 'CATALOG_MANAGE', label: 'Manage Catalog & Pricing' },
    { id: 'INVENTORY_MANAGE', label: 'Adjust Stock & Warehouses' },
    { id: 'ORDERS_MANAGE', label: 'Manage Orders & Dispatch' },
    { id: 'FINANCE_MANAGE', label: 'View Settlements & Payouts' },
    { id: 'INVOICES_EXPORT', label: 'Export GST Invoices' },
    { id: 'SUPPORT_TICKETS', label: 'Manage Support Tickets' },
  ];

  const handleTogglePerm = (id: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName.trim() || !empEmail.trim() || inviting) return;
    setInviting(true);
    try {
      await vendorApi.inviteTeamMember({
        name: empName.trim(),
        email: empEmail.trim(),
        phone: empPhone.trim(),
        role: empRole,
        permissions: selectedPermissions,
      });
      toast.success(`Invitation sent to ${empName.trim()}.`);
      setIsInviteOpen(false);
      setEmpName('');
      setEmpEmail('');
      setEmpPhone('');
      loadTeam();
    } finally {
      setInviting(false);
    }
  };

  const handleConfirmRemove = async () => {
    if (!removeTarget) return;
    await vendorApi.removeTeamMember(removeTarget.id);
    toast.success(`${removeTarget.name} removed from team.`);
    setRemoveTarget(null);
    loadTeam();
  };

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingSecurity) return;
    if (newPassword && newPassword.length < 8) {
      toast.error('New password must be at least 8 characters.');
      return;
    }
    setSavingSecurity(true);
    try {
      await vendorApi.updateSecuritySettings({
        enable2FA,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });
      toast.success('Security settings updated.');
      setCurrentPassword('');
      setNewPassword('');
    } finally {
      setSavingSecurity(false);
    }
  };

  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingNotifs) return;
    setSavingNotifs(true);
    try {
      await vendorApi.updateNotificationSettings(notifPrefs);
      toast.success('Notification preferences saved.');
    } finally {
      setSavingNotifs(false);
    }
  };

  return (
    <div className="space-y-6 pb-8 max-w-5xl">
      <PageHeader
        title="Settings"
        description="Manage team access roles, account security, notification preferences, and operating hours."
      />

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E5E9F0] pb-2">
        {[
          { id: 'TEAM', label: 'Team & Access', icon: Users },
          { id: 'SECURITY', label: 'Security & 2FA', icon: ShieldCheck },
          { id: 'NOTIFICATIONS', label: 'Notifications', icon: Bell },
          { id: 'HOURS', label: 'Operating Hours', icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#23438F] text-white'
                  : 'text-[#718096] hover:text-[#263247] hover:bg-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Team & Access */}
      {activeTab === 'TEAM' && (
        <Card>
          <CardHeader
            title="Team Members & Roles"
            subtitle="Invite team members and assign role-based permissions."
            action={
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsInviteOpen(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Invite Member
              </Button>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F8FA] text-[#718096] font-semibold border-b border-[#E5E9F0]">
                <tr>
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E9F0]">
                {team.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState
                        icon={<Users className="w-5 h-5" />}
                        title="No team members"
                        description="Invite staff members to help manage orders and inventory."
                      />
                    </td>
                  </tr>
                ) : (
                  team.map((emp) => (
                    <tr key={emp.id} className="hover:bg-[#F7F8FA]">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#263247]">{emp.name}</div>
                        <div className="text-[11px] text-[#718096]">{emp.email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="brand" size="sm">
                          {emp.role.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#718096]">
                        {emp.phone || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={emp.status === 'ACTIVE' ? 'success' : 'warning'} size="sm">
                          {emp.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {emp.role !== 'VENDOR_OWNER' && (
                          <button
                            type="button"
                            onClick={() => setRemoveTarget(emp)}
                            className="p-1.5 rounded-lg text-[#718096] hover:text-[#DC4545] hover:bg-[#DC4545]/10 cursor-pointer"
                            title="Revoke Access"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 2: Security */}
      {activeTab === 'SECURITY' && (
        <form onSubmit={handleSaveSecurity}>
          <Card>
            <CardHeader
              title="Security & Two-Factor Authentication"
              subtitle="Protect your vendor account with 2FA and strong passwords."
            />
            <CardContent className="space-y-5">
              <label className="flex items-center justify-between p-4 rounded-xl bg-[#F7F8FA] border border-[#E5E9F0] cursor-pointer">
                <div>
                  <p className="text-xs font-semibold text-[#263247]">
                    Two-Factor Authentication (SMS OTP)
                  </p>
                  <p className="text-[11px] text-[#718096] mt-0.5">
                    Require an OTP verification code when signing in from new devices.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={enable2FA}
                  onChange={(e) => setEnable2FA(e.target.checked)}
                  className="w-4 h-4 rounded text-[#23438F]"
                />
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="portal-label">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="portal-input"
                  />
                </div>
                <div>
                  <label className="portal-label">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="portal-input"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={savingSecurity}
                  leftIcon={<Save className="w-4 h-4" />}
                >
                  Save Security Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}

      {/* Tab 3: Notifications */}
      {activeTab === 'NOTIFICATIONS' && (
        <form onSubmit={handleSaveNotifications}>
          <Card>
            <CardHeader
              title="Notification Preferences"
              subtitle="Choose how you receive order, stock, and settlement alerts."
            />
            <CardContent className="space-y-3">
              {[
                { key: 'smsDispatch', label: 'SMS alerts for new incoming orders' },
                { key: 'whatsappDispatch', label: 'WhatsApp updates for order dispatch' },
                { key: 'emailSettlement', label: 'Email statements for weekly settlements & GST invoices' },
                { key: 'stockWarning', label: 'Low-stock alert notifications' },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-[#E5E9F0] hover:bg-[#F7F8FA] cursor-pointer text-xs"
                >
                  <span className="font-medium text-[#263247]">{item.label}</span>
                  <input
                    type="checkbox"
                    checked={(notifPrefs as any)[item.key]}
                    onChange={(e) =>
                      setNotifPrefs((prev) => ({ ...prev, [item.key]: e.target.checked }))
                    }
                    className="w-4 h-4 rounded text-[#23438F]"
                  />
                </label>
              ))}
              <div className="flex justify-end pt-3">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={savingNotifs}
                  leftIcon={<Save className="w-4 h-4" />}
                >
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}

      {/* Tab 4: Operating Hours */}
      {activeTab === 'HOURS' && (
        <Card>
          <CardHeader
            title="Operating Hours"
            subtitle="Standard dispatch windows for order fulfillment."
          />
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E5E9F0]">
              <span className="text-[#718096] block">Monday – Saturday</span>
              <span className="text-sm font-semibold text-[#263247] mt-1 block">
                07:00 AM – 09:00 PM
              </span>
            </div>
            <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E5E9F0]">
              <span className="text-[#718096] block">Sunday</span>
              <span className="text-sm font-semibold text-[#263247] mt-1 block">
                08:00 AM – 06:00 PM
              </span>
            </div>
            <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E5E9F0]">
              <span className="text-[#718096] block">Primary Hub</span>
              <span className="text-sm font-semibold text-[#23438F] mt-1 block">
                WH-BLR-04 Peenya
              </span>
            </div>
            <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E5E9F0]">
              <span className="text-[#718096] block">Express SLA</span>
              <span className="text-sm font-semibold text-[#15966B] mt-1 block">
                60 Minutes
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invite Member Modal */}
      <Modal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        title="Invite Team Member"
        subtitle="Assign a role and permissions for this portal user."
        maxWidth="lg"
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="portal-label">Full Name *</label>
              <input
                type="text"
                required
                value={empName}
                onChange={(e) => setEmpName(e.target.value)}
                className="portal-input"
              />
            </div>
            <div>
              <label className="portal-label">Phone Number</label>
              <input
                type="tel"
                value={empPhone}
                onChange={(e) => setEmpPhone(e.target.value)}
                className="portal-input"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="portal-label">Email Address *</label>
              <input
                type="email"
                required
                value={empEmail}
                onChange={(e) => setEmpEmail(e.target.value)}
                className="portal-input"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="portal-label">Role *</label>
              <select
                value={empRole}
                onChange={(e: any) => setEmpRole(e.target.value)}
                className="portal-input"
              >
                {rolesConfig.map((r) => (
                  <option key={r.role} value={r.role}>
                    {r.title}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-[#718096] mt-1">
                {rolesConfig.find((r) => r.role === empRole)?.desc}
              </p>
            </div>
          </div>

          <div>
            <label className="portal-label">Permissions</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-xl bg-[#F7F8FA] border border-[#E5E9F0]">
              {permissionsList.map((perm) => (
                <label
                  key={perm.id}
                  className="flex items-center gap-2 text-xs text-[#263247] cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes(perm.id)}
                    onChange={() => handleTogglePerm(perm.id)}
                    className="w-3.5 h-3.5 rounded text-[#23438F]"
                  />
                  <span>{perm.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2.5 border-t border-[#E5E9F0]">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsInviteOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={inviting}>
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleConfirmRemove}
        title="Remove Team Member"
        message={`Revoke portal access for ${removeTarget?.name}?`}
        confirmLabel="Remove Member"
      />
    </div>
  );
};

export default VendorSettingsPage;
