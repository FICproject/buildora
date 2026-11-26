import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  ShieldCheck,
  Mail,
  Phone,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  Key,
  Shield,
  FileText,
  UserCheck,
} from 'lucide-react';
import { vendorApi } from '../../services/vendorApi';
import { VendorEmployee, VendorRole } from '@buildora/types';

export const VendorTeamPage: React.FC = () => {
  const [team, setTeam] = useState<VendorEmployee[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'MEMBERS' | 'AUDIT_LOGS'>('MEMBERS');
  const [loading, setLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<VendorRole>('INVENTORY_MANAGER');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    'INVENTORY_MANAGE',
    'STOCK_INWARD',
  ]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [members, logs] = await Promise.all([
        vendorApi.getTeam(),
        vendorApi.getTeamAuditLogs(),
      ]);
      setTeam(members);
      setAuditLogs(logs || []);
    } catch (err) {
      console.error('Failed to load team data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const rolesConfig: { role: VendorRole; title: string; desc: string }[] = [
    { role: 'VENDOR_OWNER', title: 'Store Owner', desc: 'Full administrative access, bank accounts, financial settlements, legal docs.' },
    { role: 'VENDOR_ADMIN', title: 'Depot General Admin', desc: 'Manages products, pricing, orders, warehouse dispatch, team members.' },
    { role: 'CATALOG_MANAGER', title: 'Catalog Specialist', desc: 'Adds products, sets dynamic specifications, variant prices, and technical specs.' },
    { role: 'INVENTORY_MANAGER', title: 'Inventory Yard Manager', desc: 'Performs stock inwarding, cycle count adjustments, dark store link.' },
    { role: 'ORDER_MANAGER', title: 'Order Fulfillment Lead', desc: 'Accepts orders, generates packing slips, coordinates 60-min express dispatch.' },
    { role: 'FINANCE_MANAGER', title: 'Finance & Accounts', desc: 'Manages 7-day settlements, TDS/TCS tax invoices, bank payout requests.' },
    { role: 'SUPPORT_STAFF', title: 'Customer Support Rep', desc: 'Answers contractor inquiries, replies to reviews, handles support tickets.' },
  ];

  const permissionsList = [
    { id: 'CATALOG_MANAGE', label: 'Create & Edit Catalog Products' },
    { id: 'INVENTORY_MANAGE', label: 'Perform Stock Inward & Adjustments' },
    { id: 'ORDERS_MANAGE', label: 'Accept / Reject Orders & Dispatch' },
    { id: 'FINANCE_MANAGE', label: 'View Payouts & Request Settlements' },
    { id: 'INVOICES_EXPORT', label: 'Download B2B GST Tax Invoices' },
    { id: 'REVIEWS_REPLY', label: 'Reply to Contractor Feedback' },
    { id: 'SUPPORT_TICKETS', label: 'Manage Helpdesk & Support Tickets' },
  ];

  const handleTogglePerm = (id: string) => {
    if (selectedPermissions.includes(id)) {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== id));
    } else {
      setSelectedPermissions([...selectedPermissions, id]);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    await vendorApi.inviteTeamMember({
      name,
      email,
      phone,
      role,
      permissions: selectedPermissions,
    });

    setIsInviteModalOpen(false);
    setName('');
    setEmail('');
    setPhone('');
    loadData();
  };

  const handleRemove = async (id: string) => {
    if (confirm('Are you sure you want to revoke this employee access?')) {
      await vendorApi.removeTeamMember(id);
      loadData();
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E7E5E4] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#943D24]/10 text-[#943D24] border border-[#943D24]/20">
              ROLE-BASED ACCESS CONTROL (RBAC)
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              7 Enterprise Roles
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#292524] tracking-tight">
            Team & Employee Permissions
          </h1>
          <p className="text-xs text-[#78716C] font-medium">
            Grant granular permissions to yard managers, order packers, catalog specialists, and finance accountants.
          </p>
        </div>

        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#943D24] text-white rounded-xl text-xs font-bold hover:bg-[#292524] transition-all shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4 text-[#F6C453]" />
          Invite Team Member
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E7E5E4] pb-2 text-xs">
        <button
          onClick={() => setActiveTab('MEMBERS')}
          className={`px-4 py-2 rounded-xl font-bold transition-all ${
            activeTab === 'MEMBERS'
              ? 'bg-[#943D24] text-white shadow-xs'
              : 'text-[#78716C] hover:text-[#943D24] hover:bg-white'
          }`}
        >
          Active Team Members ({team.length})
        </button>
        <button
          onClick={() => setActiveTab('AUDIT_LOGS')}
          className={`px-4 py-2 rounded-xl font-bold transition-all ${
            activeTab === 'AUDIT_LOGS'
              ? 'bg-[#943D24] text-white shadow-xs'
              : 'text-[#78716C] hover:text-[#943D24] hover:bg-white'
          }`}
        >
          Security Audit Trail ({auditLogs.length})
        </button>
      </div>

      {activeTab === 'MEMBERS' ? (
        <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FBF3F0] border-b border-[#E7E5E4] text-[#78716C] font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Role & Designation</th>
                <th className="py-3 px-4">Contact Phone</th>
                <th className="py-3 px-4">Invited / Active Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E5E4]">
              {team.map((emp) => (
                <tr key={emp.id} className="hover:bg-[#FBF3F0]/60 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#943D24]/10 text-[#943D24] font-black text-xs flex items-center justify-center">
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-extrabold text-[#292524]">{emp.name}</p>
                        <p className="text-[10px] text-[#78716C]">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-black text-[11px] px-2.5 py-0.5 rounded-full bg-[#FBF3F0] text-[#943D24] border border-[#943D24]/25">
                      {emp.role.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[#78716C]">
                    {emp.phone || '—'}
                  </td>
                  <td className="py-3.5 px-4 text-[#78716C]">
                    {new Date(emp.invitedAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        emp.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {emp.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {emp.role !== 'VENDOR_OWNER' && (
                      <button
                        onClick={() => handleRemove(emp.id)}
                        className="p-1.5 rounded-lg text-[#78716C] hover:text-rose-600 hover:bg-rose-50"
                        title="Revoke Access"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-xs p-5 space-y-3">
          <h3 className="font-extrabold text-sm text-[#292524]">Administrative Security Logs</h3>
          <div className="space-y-2">
            {auditLogs.length === 0 ? (
              <p className="text-xs text-[#78716C] py-4">No administrative security logs recorded yet.</p>
            ) : (
              auditLogs.map((log: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#FBF3F0] border border-[#E7E5E4] flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs"
                >
                  <div>
                    <span className="font-extrabold text-[#943D24]">{log.action}: </span>
                    <span className="text-[#292524] font-medium">{log.details}</span>
                    <p className="text-[10px] text-[#78716C] mt-0.5">By: {log.performedBy}</p>
                  </div>
                  <span className="text-[10px] font-mono text-[#78716C] shrink-0">
                    {new Date(log.performedAt).toLocaleString('en-IN')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* INVITE MODAL */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-[#E7E5E4] shadow-xl space-y-4">
            <div>
              <h3 className="text-lg font-black text-[#292524]">Invite Employee & Assign Role</h3>
              <p className="text-xs text-[#78716C]">
                The member will receive an activation email with login instructions.
              </p>
            </div>

            <form onSubmit={handleInvite} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#292524] mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Gowda"
                    className="w-full px-3 py-2 rounded-xl border border-[#E7E5E4] outline-hidden font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#292524] mb-1">Mobile Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9845012348"
                    className="w-full px-3 py-2 rounded-xl border border-[#E7E5E4] outline-hidden font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#292524] mb-1">Corporate Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ramesh.gowda@supremebuild.com"
                  className="w-full px-3 py-2 rounded-xl border border-[#E7E5E4] outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-[#292524] mb-1">Select Enterprise Role (1 of 7)</label>
                <select
                  value={role}
                  onChange={(e: any) => setRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E7E5E4] bg-white outline-hidden font-bold text-[#943D24]"
                >
                  {rolesConfig.map((r) => (
                    <option key={r.role} value={r.role}>
                      {r.title} ({r.role})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-[#78716C] mt-1">
                  {rolesConfig.find((r) => r.role === role)?.desc}
                </p>
              </div>

              {/* Permissions Checklist */}
              <div>
                <label className="block font-bold text-[#292524] mb-1.5">Custom Granted Permissions</label>
                <div className="grid grid-cols-2 gap-2 bg-[#FBF3F0] p-3 rounded-xl border border-[#E7E5E4]">
                  {permissionsList.map((perm) => (
                    <label key={perm.id} className="flex items-center gap-2 cursor-pointer text-[11px]">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(perm.id)}
                        onChange={() => handleTogglePerm(perm.id)}
                        className="w-3.5 h-3.5 rounded text-[#943D24]"
                      />
                      <span className="text-[#292524]">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E7E5E4]">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 font-bold text-[#78716C] hover:bg-[#FBF3F0] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-[#943D24] hover:bg-[#292524] rounded-xl shadow-xs"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default VendorTeamPage;