import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  LifeBuoy,
  Plus,
  Send,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  PhoneCall
} from 'lucide-react';
import { useSupportStore } from '../store/useSupportStore';
import { SupportTicket } from '@buildora/types';
import { Button } from '../components/ui/Button';

export const SupportPage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId?: string }>();
  const { tickets, createTicket, addMessage, getTicket } = useSupportStore();

  const [isCreating, setIsCreating] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string>(ticketId || tickets[0]?.id || '');

  // Form states
  const [category, setCategory] = useState<SupportTicket['category']>('DELIVERY');
  const [priority, setPriority] = useState<SupportTicket['priority']>('MEDIUM');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [replyMessage, setReplyMessage] = useState('');

  const activeTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0];

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    const newTkt = createTicket({
      category,
      priority,
      subject,
      description
    });

    setSelectedTicketId(newTkt.id);
    setIsCreating(false);
    setSubject('');
    setDescription('');
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !activeTicket) return;
    addMessage(activeTicket.id, replyMessage.trim());
    setReplyMessage('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Site Support &amp; Help Desk</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Resolve offloading queries, report material variances, or request emergency deliveries.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsCreating(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Raise Support Ticket
        </Button>
      </div>

      {/* Create Ticket Modal/Form */}
      {isCreating && (
        <form onSubmit={handleCreateTicket} className="bg-white p-6 rounded-2xl border border-brand-blue-200 shadow-card space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900">Raise New Support Ticket</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold block mb-1">Issue Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full p-2 border rounded"
              >
                <option value="DELIVERY">Delivery &amp; Offloading Assistance</option>
                <option value="PRODUCT">Damaged / Incorrect Material</option>
                <option value="ORDER">Order Modification</option>
                <option value="PAYMENT">Payment &amp; GST Invoicing</option>
                <option value="REFUND">Refund Request</option>
                <option value="OTHER">General Inquiry</option>
              </select>
            </div>
            <div>
              <label className="font-bold block mb-1">Site Urgency / Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full p-2 border rounded"
              >
                <option value="HIGH">High (Site Work Stopped)</option>
                <option value="MEDIUM">Medium (Needs Response Today)</option>
                <option value="LOW">Low (General Query)</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="font-bold block mb-1">Subject</label>
              <input
                type="text"
                placeholder="e.g. Need driver contact for gate offloading"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full p-2 border rounded font-medium"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="font-bold block mb-1">Detailed Description</label>
              <textarea
                placeholder="Describe your site requirement or issue..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border rounded h-24"
                required
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="primary" size="sm" type="submit">
              Submit Ticket
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsCreating(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Tickets List & Detail */}
      {tickets.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border text-center space-y-3">
          <LifeBuoy className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800">No Support Tickets</h3>
          <p className="text-xs text-slate-500">
            All your orders are running smoothly! Raise a ticket if you ever need site assistance.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Tickets List */}
          <div className="lg:col-span-5 space-y-2">
            {tickets.map((tkt) => (
              <div
                key={tkt.id}
                onClick={() => setSelectedTicketId(tkt.id)}
                className={`cursor-pointer p-4 rounded-2xl border transition-all text-xs space-y-1.5 ${
                  selectedTicketId === tkt.id
                    ? 'border-brand-blue-600 bg-white shadow-card ring-1 ring-brand-blue-600'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 truncate">{tkt.subject}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      tkt.status === 'RESOLVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {tkt.status}
                  </span>
                </div>
                <div className="text-slate-400 text-[11px] flex items-center justify-between">
                  <span>ID: {tkt.ticketNumber}</span>
                  <span>{new Date(tkt.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Active Ticket Conversation Thread */}
          {activeTicket && (
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 flex flex-col justify-between space-y-6 min-h-[420px]">
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-brand-orange-600 uppercase">
                      {activeTicket.category} &bull; Priority: {activeTicket.priority}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base">{activeTicket.subject}</h3>
                    <div className="text-[11px] text-slate-400">Ticket ID: {activeTicket.ticketNumber}</div>
                  </div>
                </div>

                {/* Message Bubble Thread */}
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {activeTicket.messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col ${
                        msg.sender === 'CUSTOMER' ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div
                        className={`p-3 rounded-2xl max-w-sm text-xs leading-relaxed ${
                          msg.sender === 'CUSTOMER'
                            ? 'bg-brand-blue-900 text-white rounded-tr-none'
                            : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'
                        }`}
                      >
                        <div className="text-[10px] font-bold opacity-75 mb-0.5">
                          {msg.sender === 'CUSTOMER' ? 'You' : 'BUILDORA 60 Support Specialist'}
                        </div>
                        {msg.message}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5 px-1">{msg.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="flex gap-2 pt-3 border-t border-slate-100">
                <input
                  type="text"
                  placeholder="Type your message reply..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="flex-1 p-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-blue-500"
                />
                <Button variant="primary" size="md" type="submit" leftIcon={<Send className="w-3.5 h-3.5" />}>
                  Send
                </Button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
