import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Plus,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  User,
  ShieldAlert,
  ChevronRight,
  LifeBuoy,
} from 'lucide-react';
import { vendorApi } from '../../services/vendorApi';
import { VendorSupportTicket } from '@buildora/types';

export const VendorSupportPage: React.FC = () => {
  const [tickets, setTickets] = useState<VendorSupportTicket[]>([]);
  const [activeTicket, setActiveTicket] = useState<VendorSupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Form states
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<any>('DARK_STORE_LOGISTICS');
  const [priority, setPriority] = useState<any>('MEDIUM');
  const [description, setDescription] = useState('');
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await vendorApi.getSupportTickets();
      setTickets(data);
      if (data.length > 0 && !activeTicket) {
        setActiveTicket(data[0]);
      } else if (activeTicket) {
        const updated = data.find((t) => t.id === activeTicket.id);
        if (updated) setActiveTicket(updated);
      }
    } catch (err) {
      console.error('Failed to load tickets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !description) return;

    await vendorApi.createSupportTicket({
      subject,
      category,
      priority,
      description,
    });

    setIsNewModalOpen(false);
    setSubject('');
    setDescription('');
    loadTickets();
  };

  const handleSendReply = async () => {
    if (!activeTicket || !replyText.trim()) return;
    setSending(true);
    try {
      await vendorApi.addSupportTicketMessage(activeTicket.id, replyText);
      setReplyText('');
      loadTickets();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#203D91]/10 text-[#203D91] border border-[#203D91]/20">
              SUPPLIER RELATIONS & HELPDESK
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              4-Hour SLA Response Time
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#17233C] tracking-tight">
            Vendor Helpdesk & Support Tickets
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Direct communication channel with BUILDORA 60 dark store warehouse leads, finance auditors, and catalog team.
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#203D91] text-white rounded-xl text-xs font-bold hover:bg-[#17233C] transition-all shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4 text-[#FF7417]" />
          Create Support Ticket
        </button>
      </div>

      {/* Two-Column Split (Ticket List + Thread) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
        {/* Left Column: Tickets List (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E2E8F0] shadow-xs p-4 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
              All Tickets ({tickets.length})
            </h2>

            <div className="space-y-2 max-h-[480px] overflow-y-auto">
              {tickets.map((tkt) => {
                const isSelected = activeTicket?.id === tkt.id;
                return (
                  <div
                    key={tkt.id}
                    onClick={() => setActiveTicket(tkt)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#203D91] bg-[#203D91]/5 shadow-2xs'
                        : 'border-[#E2E8F0] hover:bg-[#F4F7FC]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-extrabold text-[#17233C]">{tkt.ticketNumber}</span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                            tkt.priority === 'HIGH' || tkt.priority === 'URGENT'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {tkt.priority}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            tkt.status === 'RESOLVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {tkt.status}
                        </span>
                      </div>
                    </div>

                    <h4 className="font-bold text-[#17233C] line-clamp-1">{tkt.subject}</h4>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Category: {tkt.category.replace(/_/g, ' ')} • {new Date(tkt.createdAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-[#E2E8F0] text-[11px] text-slate-500 flex items-center justify-between">
            <span>Direct Partner Line: <strong>1800-419-6060</strong></span>
            <span className="text-[#203D91] font-bold">Mon - Sat (8am - 8pm)</span>
          </div>
        </div>

        {/* Right Column: Ticket Conversation Thread (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col justify-between overflow-hidden">
          {activeTicket ? (
            <>
              {/* Ticket Top Meta */}
              <div className="p-5 border-b border-[#E2E8F0] bg-[#F4F7FC]">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-black text-[#203D91]">{activeTicket.ticketNumber}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#203D91]">
                    {activeTicket.category.replace(/_/g, ' ')}
                  </span>
                </div>
                <h3 className="font-black text-sm text-[#17233C]">{activeTicket.subject}</h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  Priority: <strong className="text-[#17233C]">{activeTicket.priority}</strong> • Created: {new Date(activeTicket.createdAt).toLocaleString('en-IN')}
                </p>
              </div>

              {/* Chat Thread Messages */}
              <div className="flex-1 p-5 overflow-y-auto space-y-3.5 max-h-[380px] min-h-[280px]">
                {activeTicket.messages?.map((msg) => {
                  const isVendor = msg.senderRole === 'VENDOR';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isVendor ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400">
                        <span className="font-bold text-slate-700">{msg.sender}</span>
                        <span>({isVendor ? 'Store Representative' : 'BUILDORA Support'})</span>
                        <span>•</span>
                        <span>{new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div
                        className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                          isVendor
                            ? 'bg-[#203D91] text-white rounded-tr-xs'
                            : 'bg-[#F4F7FC] text-[#17233C] border border-[#E2E8F0] rounded-tl-xs'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Message Input Box */}
              <div className="p-4 border-t border-[#E2E8F0] bg-white flex items-center gap-3">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                  placeholder="Type message to BUILDORA Support Team..."
                  className="flex-1 px-4 py-2 text-xs rounded-xl border border-[#E2E8F0] focus:border-[#203D91] outline-hidden"
                />
                <button
                  type="button"
                  disabled={sending || !replyText.trim()}
                  onClick={handleSendReply}
                  className="px-4 py-2 bg-[#203D91] text-white rounded-xl text-xs font-bold hover:bg-[#17233C] transition-colors shadow-xs disabled:opacity-50 shrink-0 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 text-xs">
              <LifeBuoy className="w-10 h-10 text-slate-300 mb-2" />
              Select a support ticket to view conversation thread.
            </div>
          )}
        </div>
      </div>

      {/* CREATE TICKET MODAL */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-[#E2E8F0] shadow-xl space-y-4">
            <div>
              <h3 className="text-lg font-black text-[#17233C]">Raise Partner Support Ticket</h3>
              <p className="text-xs text-slate-500">
                Log an escalation for warehouse operations, logistics access, or finance reconciliation.
              </p>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Ticket Subject</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Priority dispatch RFID pass for Whitefield dark store gate 2"
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] outline-hidden font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Issue Category</label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] bg-white outline-hidden font-medium"
                  >
                    <option value="DARK_STORE_LOGISTICS">Dark Store Logistics & Unloading</option>
                    <option value="ORDERS">Orders & 60-Min Dispatch SLAs</option>
                    <option value="PAYMENT_SETTLEMENT">Bank Settlements & Payouts</option>
                    <option value="CATALOG">Catalog Specifications & Pricing</option>
                    <option value="KYC_COMPLIANCE">KYC & Document Vault</option>
                    <option value="TECHNICAL">Technical Portal Issue</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority Level</label>
                  <select
                    value={priority}
                    onChange={(e: any) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] bg-white outline-hidden font-bold"
                  >
                    <option value="LOW">Low (Within 24 Hours)</option>
                    <option value="MEDIUM">Medium (Within 8 Hours)</option>
                    <option value="HIGH">High (Within 4 Hours)</option>
                    <option value="URGENT">Urgent (Immediate Callback)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Detailed Description</label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide vehicle registration #, order ID, or batch invoice number..."
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] outline-hidden leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-[#F4F7FC] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-[#203D91] hover:bg-[#17233C] rounded-xl shadow-xs"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default VendorSupportPage;