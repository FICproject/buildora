import React, { useState } from 'react';
import {
  Truck,
  Building2,
  FileSpreadsheet,
  CheckCircle2,
  Download,
  PhoneCall,
  Clock,
  ShieldCheck,
  Send
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export const BulkOrdersPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: 'Arjun Verma',
    phone: '9876543210',
    email: 'arjun.verma@apexinfra.com',
    companyName: 'Apex Infra Construction Ltd',
    gstin: '29AABCB1234F1Z8',
    projectLocation: 'Indiranagar, Bengaluru',
    pincode: '560038',
    category: 'Cement & Concrete',
    estimatedOrderValue: '₹1,50,000+',
    deliveryTimeline: 'Within 48 hours',
    materialListNotes: 'Require 350 bags of UltraTech PPC cement, 25 sheets of 19mm Marine Plywood, and 40 coils of Havells 2.5 sq.mm wire.'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const priceLists = [
    { title: 'Cement & Structural Steel Daily Index', date: 'Updated Today 08:00 AM', size: '240 KB' },
    { title: 'FRLS Copper Wires & Electrical Master Price List', date: 'Updated Yesterday', size: '380 KB' },
    { title: 'CPVC Pipes & Plumbing Fittings Index', date: 'Updated 2 Days Ago', size: '190 KB' },
    { title: 'Calibrated Plywood & Marine Boards Price Matrix', date: 'Updated This Week', size: '310 KB' },
    { title: 'Vitrified Tiles & Polymer Adhesives Rates', date: 'Updated This Week', size: '420 KB' }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 bg-brand-blue-100 text-brand-blue-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          <Truck className="w-3.5 h-3.5 text-brand-orange-500" /> Commercial &amp; Project Sales
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
          Bulk Material Procurement &amp; Price Lists
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Dedicated wholesale rates, multi-truck coordinated logistics, and 30-day corporate billing lines for licensed builders and project contractors.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Bulk Quotation Form */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-card space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand-blue-800" />
              Request Institutional Site Quotation
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Our B2B project team will contact you within 60 minutes with wholesale price discounts.
            </p>
          </div>

          {submitted ? (
            <div className="p-8 text-center space-y-4 bg-emerald-50 rounded-2xl border border-emerald-200">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-emerald-900">
                Quotation Request Submitted Successfully!
              </h3>
              <p className="text-xs text-emerald-700 max-w-md mx-auto">
                Reference ID: <strong className="font-mono">QUO-2026-9812</strong>. Senior Commercial Manager (South Region) has been assigned to your project.
              </p>
              <Button variant="outline" size="sm" onClick={() => setSubmitted(false)}>
                Submit Another Request
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Contractor / Manager Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Site Mobile Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Company / Firm Name</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full p-2.5 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    maxLength={15}
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    className="w-full p-2.5 border rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Project Site Location</label>
                  <input
                    type="text"
                    value={formData.projectLocation}
                    onChange={(e) => setFormData({ ...formData, projectLocation: e.target.value })}
                    className="w-full p-2.5 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Site Pincode</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full p-2.5 border rounded-lg font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Required Materials &amp; Estimated Quantities</label>
                <textarea
                  value={formData.materialListNotes}
                  onChange={(e) => setFormData({ ...formData, materialListNotes: e.target.value })}
                  className="w-full p-2.5 border rounded-lg h-24 font-medium"
                  placeholder="Paste your material bill of quantities (e.g. 500 bags OPC cement, 10 bundles 12mm TMT steel, 15 coils 4 sq.mm wire)..."
                  required
                />
              </div>

              <Button
                variant="secondary"
                size="lg"
                type="submit"
                className="w-full font-bold"
                leftIcon={<Send className="w-4 h-4" />}
              >
                Submit Site Quotation Request
              </Button>
            </form>
          )}
        </div>

        {/* Right Column: Downloadable Category Price Lists */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-card space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-900">
                Official Category Price Lists (PDF)
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Download indexed wholesale rates updated in accordance with current manufacturer factory prices.
            </p>

            <div className="space-y-2.5">
              {priceLists.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-slate-200 hover:border-brand-blue-300 hover:bg-slate-50 flex items-center justify-between text-xs transition-colors"
                >
                  <div className="truncate max-w-[240px]">
                    <div className="font-bold text-slate-800 truncate">{item.title}</div>
                    <div className="text-[11px] text-slate-400">{item.date} &bull; {item.size}</div>
                  </div>
                  <button
                    onClick={() => alert(`Downloading: ${item.title}`)}
                    className="flex items-center gap-1 text-brand-blue-800 hover:text-brand-blue-900 font-bold p-1"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Dedicated Manager Contact */}
          <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-3">
            <h4 className="font-bold text-sm">Need Urgent Site Offloading?</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              For immediate breakdown replacements, contractor credit lines, or concrete pump trucks, contact our Commercial Desk:
            </p>
            <div className="pt-2 flex items-center gap-3">
              <a
                href="tel:18006028453"
                className="inline-flex items-center gap-2 bg-brand-orange-500 hover:bg-brand-orange-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5" /> Call 1800-60-BUILD
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
