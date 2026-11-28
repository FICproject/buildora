import React, { useState, useEffect } from 'react';
import { Plus, Send, LifeBuoy } from 'lucide-react';
import { vendorApi } from '../../services/vendorApi';
import { VendorSupportTicket } from '@buildora/types';
import {
  PageHeader,
  Card,
  CardHeader,
  Button,
  Badge,
  Modal,
  EmptyState,
} from '../../components/common';
import { toast } from '../../store/useToastStore';

export const VendorSupportPage: React.FC = () => {
  const [tickets, setTickets] = useState<VendorSupportTicket[]>([]);
  const [activeTicket, setActiveTicket] = useState<VendorSupportTicket | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<any>('DARK_STORE_LOGISTICS');
  const [priority, setPriority] = useState<any>('MEDIUM');
  const [description, setDescription] = useState('');
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [creating, setCreating] = useState(false);

  const loadTickets = async () => {
    try {
      const data = await vendorApi.getSupportTickets();
      setTickets(data || []);
      if (data?.length > 0 && !activeTicket) {
        setActiveTicket(data[0]);
      } else if (activeTicket) {
        const updated = data.find((t) => t.id === activeTicket.id);
        if (updated) setActiveTicket(updated);
      }
    } catch {}
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim() || creating) return;
    setCreating(true);
    try {
      await vendorApi.createSupportTicket({
        subject: subject.trim(),
        category,
        priority,
        description: description.trim(),
      });
      toast.success('Support ticket submitted.');
      setIsNewModalOpen(false);
      setSubject('');
      setDescription('');
      loadTickets();
    } finally {
      setCreating(false);
    }
  };

  const handleSendReply = async () => {
    if (!activeTicket || !replyText.trim() || sending) return;
    setSending(true);
    try {
      await vendorApi.addSupportTicketMessage(activeTicket.id, replyText.trim());
      setReplyText('');
      toast.success('Message sent.');
      loadTickets();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Support"
        description="Contact BUILDORA 60 partner support for logistics, catalog, or settlement assistance."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsNewModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Ticket
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[480px]">
        {/* Ticket List */}
        <Card className="lg:col-span-5 flex flex-col justify-between">
          <div>
            <CardHeader title={`Tickets (${tickets.length})`} />
            <div className="p-3 space-y-2 max-h-[420px] overflow-y-auto">
              {tickets.length === 0 ? (
                <EmptyState
                  icon={<LifeBuoy className="w-5 h-5" />}
                  title="No support tickets"
                  description="Create a ticket if you need help from our team."
                />
              ) : (
                tickets.map((tkt) => {
                  const isSelected = activeTicket?.id === tkt.id;
                  return (
                    <div
                      key={tkt.id}
                      onClick={() => setActiveTicket(tkt)}
                      className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-[#943D24] bg-[#FBF3F0]/70'
                          : 'border-[#E7E5E4] hover:bg-[#F8F7F5]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-mono font-semibold text-[#292524]">
                          {tkt.ticketNumber}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant={
                              tkt.priority === 'HIGH' || tkt.priority === 'URGENT'
                                ? 'danger'
                                : 'neutral'
                            }
                            size="sm"
                          >
                            {tkt.priority}
                          </Badge>
                          <Badge
                            variant={tkt.status === 'RESOLVED' ? 'success' : 'warning'}
                            size="sm"
                          >
                            {tkt.status.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                      </div>
                      <p className="font-medium text-[#292524] line-clamp-1">{tkt.subject}</p>
                      <p className="text-[11px] text-[#78716C] mt-1">
                        {tkt.category.replace(/_/g, ' ')} •{' '}
                        {new Date(tkt.createdAt).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="px-4 py-3 border-t border-[#E7E5E4] text-xs text-[#78716C] flex flex-wrap items-center justify-between gap-2">
            <span>Partner Helpline: 1800-419-6060</span>
            <span>Mon–Sat, 8 AM–8 PM</span>
          </div>
        </Card>

        {/* Thread */}
        <Card className="lg:col-span-7 flex flex-col justify-between overflow-hidden">
          {activeTicket ? (
            <>
              <div className="p-5 border-b border-[#E7E5E4] bg-[#F8F7F5]">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-mono text-xs font-semibold text-[#943D24]">
                    {activeTicket.ticketNumber}
                  </span>
                  <Badge variant="brand" size="sm">
                    {activeTicket.category.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <h3 className="font-semibold text-sm text-[#292524]">{activeTicket.subject}</h3>
                <p className="text-xs text-[#78716C] mt-1">
                  Priority: {activeTicket.priority} • Created{' '}
                  {new Date(activeTicket.createdAt).toLocaleDateString('en-IN')}
                </p>
              </div>

              <div className="flex-1 p-5 overflow-y-auto space-y-3 max-h-[340px]">
                {activeTicket.messages?.map((msg) => {
                  const isVendor = msg.senderRole === 'VENDOR';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isVendor ? 'items-end' : 'items-start'}`}
                    >
                      <div className="text-[11px] text-[#78716C] mb-1">
                        {msg.sender} •{' '}
                        {new Date(msg.timestamp).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      <div
                        className={`max-w-[85%] px-4 py-2.5 rounded-xl text-xs leading-relaxed ${
                          isVendor
                            ? 'bg-[#943D24] text-white'
                            : 'bg-[#F8F7F5] text-[#292524] border border-[#E7E5E4]'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 border-t border-[#E7E5E4] bg-white flex items-center gap-2.5">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                  placeholder="Write a reply..."
                  className="portal-input flex-1 min-w-0"
                />
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={sending || !replyText.trim()}
                  isLoading={sending}
                  onClick={handleSendReply}
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                >
                  Send
                </Button>
              </div>
            </>
          ) : (
            <EmptyState
              icon={<LifeBuoy className="w-5 h-5" />}
              title="Select a ticket"
              description="Choose a ticket from the list to view the conversation."
            />
          )}
        </Card>
      </div>

      {/* Create Ticket Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Create Support Ticket"
        subtitle="Describe your issue and our partner support team will respond promptly."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateTicket} className="space-y-4">
          <div>
            <label className="portal-label">Subject *</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of the issue"
              className="portal-input"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="portal-label">Category *</label>
              <select
                value={category}
                onChange={(e: any) => setCategory(e.target.value)}
                className="portal-input"
              >
                <option value="DARK_STORE_LOGISTICS">Warehouse & Logistics</option>
                <option value="ORDERS">Orders & Dispatch</option>
                <option value="PAYMENT_SETTLEMENT">Payments & Settlements</option>
                <option value="CATALOG">Catalog & Pricing</option>
                <option value="KYC_COMPLIANCE">KYC & Documents</option>
                <option value="TECHNICAL">Technical Issue</option>
              </select>
            </div>
            <div>
              <label className="portal-label">Priority *</label>
              <select
                value={priority}
                onChange={(e: any) => setPriority(e.target.value)}
                className="portal-input"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>
          <div>
            <label className="portal-label">Description *</label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Include order ID, invoice number, or relevant details..."
              className="portal-input"
            />
          </div>
          <div className="pt-2 flex justify-end gap-2.5 border-t border-[#E7E5E4]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsNewModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={creating}>
              Submit Ticket
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default VendorSupportPage;
