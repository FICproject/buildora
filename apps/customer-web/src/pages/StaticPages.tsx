import React, { useEffect, useState } from 'react';
import {
  PhoneCall,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  Truck,
  CheckCircle2,
  ChevronDown,
  Search,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { useStoreConfigStore } from '../store/useStoreConfigStore';
import { Button } from '../components/ui/Button';

// 1. ABOUT US PAGE
export const AboutPage: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
    <div className="space-y-3 text-center max-w-2xl mx-auto">
      <div className="text-xs font-bold uppercase tracking-wider text-brand-orange-600 bg-brand-orange-50 px-3 py-1 rounded-full inline-block">
        About BUILDORA 60
      </div>
      <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
        Reimagining Construction Materials Supply in India
      </h1>
      <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
        We eliminate site downtime, delivery delays, and middleman markups by connecting contractors, builders, and homeowners directly to regional automated dark stores.
      </p>
    </div>

    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-card space-y-6 text-sm text-slate-700 leading-relaxed">
      <h2 className="text-xl font-bold text-slate-900">Our Mission</h2>
      <p>
        In modern construction, time is money. A delay in receiving 10 bags of cement or a few coils of wire can halt an entire team of masons or electricians for an entire workday. BUILDORA 60 was built on a singular promise: <strong>Build Smart. Deliver Fast.</strong>
      </p>

      <h2 className="text-xl font-bold text-slate-900 pt-2">Hyperlocal Dark Store Infrastructure</h2>
      <p>
        Operating through dense networks of mechanized fulfillment hubs across top urban centers, our electric mini-trucks and heavy crane carriers ensure materials reach your exact job site gate in as fast as 60 minutes.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
          <div className="text-2xl font-black text-brand-blue-900">60 Mins</div>
          <div className="text-xs text-slate-500 mt-1">Average Site Dispatch Window</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
          <div className="text-2xl font-black text-brand-orange-500">28+</div>
          <div className="text-xs text-slate-500 mt-1">Core Construction Categories</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
          <div className="text-2xl font-black text-emerald-600">100%</div>
          <div className="text-xs text-slate-500 mt-1">Direct Brand Genuine Materials</div>
        </div>
      </div>
    </div>
  </div>
);

// 2. CONTACT US PAGE
export const ContactPage: React.FC = () => {
  const storeCfg = useStoreConfigStore((s) => s.config);
  const supportPhone = storeCfg?.supportPhone || '1800-60-28453';
  const supportEmail = storeCfg?.supportEmail || 'support@buildora.com';
  const legalName = storeCfg?.legalName || 'BUILDORA 60 Technologies Pvt Ltd';
  const cityState = storeCfg?.city ? `${storeCfg.city}, ${storeCfg.state || 'Karnataka'}` : 'Bengaluru, Karnataka';

  const [sent, setSent] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', subject: '', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
    } catch {}
    setSent(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center max-w-xl mx-auto space-y-2">
        <h1 className="text-3xl font-black text-slate-900">Contact BUILDORA 60</h1>
        <p className="text-xs text-slate-500">
          Our construction material advisors and dispatch coordinators are ready to assist.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-5 bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-6">
          <h2 className="text-lg font-bold">Headquarters &amp; Hub</h2>
          <div className="space-y-4 text-xs text-slate-300">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-brand-orange-500 flex-shrink-0 mt-0.5" />
              <span>{legalName}, {cityState}</span>
            </div>
            <div className="flex items-center gap-3">
              <PhoneCall className="w-4 h-4 text-brand-orange-500 flex-shrink-0" />
              <a href={`tel:${supportPhone.replace(/[^+\d]/g, '')}`} className="hover:text-white font-bold text-sm">
                {supportPhone}
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-brand-orange-500 flex-shrink-0" />
              <a href={`mailto:${supportEmail}`} className="hover:text-white">{supportEmail}</a>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{storeCfg?.deliveryConfig?.standardEtaText || 'Dispatch Operating Hours: 7:00 AM - 11:00 PM'}</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-card">
          {sent ? (
            <div className="py-12 text-center space-y-3 text-emerald-800">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="font-bold text-base">Message Sent Successfully!</h3>
              <p className="text-xs text-slate-600">Our customer team will reply via SMS/Email within 30 minutes.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <h3 className="font-bold text-slate-900 text-sm">Send a Direct Message</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Your Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="p-2.5 border rounded-lg"
                  required
                />
                <input
                  type="tel"
                  placeholder="Mobile Number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="p-2.5 border rounded-lg"
                  required
                />
              </div>
              <input
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2.5 border rounded-lg"
                required
              />
              <input
                type="text"
                placeholder="Subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full p-2.5 border rounded-lg font-medium"
                required
              />
              <textarea
                placeholder="How can we assist your construction project today?"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full p-2.5 border rounded-lg h-24"
                required
              />
              <Button variant="primary" size="md" type="submit" className="w-full font-bold">
                Submit Inquiry
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// 3. FAQ PAGE
export const FaqPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [faqs, setFaqs] = useState<any[]>([]);

  useEffect(() => {
    api.getFaqs().then((list) => setFaqs(Array.isArray(list) ? list : []));
  }, []);

  const filteredFaqs = faqs.filter(
    (f) =>
      String(f.question || '').toLowerCase().includes(search.toLowerCase()) ||
      String(f.answer || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center max-w-xl mx-auto space-y-3">
        <h1 className="text-3xl font-black text-slate-900">Frequently Asked Questions</h1>
        <p className="text-xs text-slate-500">
          Everything you need to know about 60-minute delivery, GST invoices, and bulk pricing.
        </p>
        <div className="relative max-w-md mx-auto pt-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search FAQs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-blue-500"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filteredFaqs.map((faq, idx) => (
          <div
            key={faq.id}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-all"
          >
            <button
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              className="w-full text-left p-4 flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-slate-800 hover:text-brand-blue-900"
            >
              <span>{faq.question}</span>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform ${
                  openIndex === idx ? 'rotate-180 text-brand-blue-900' : ''
                }`}
              />
            </button>
            {openIndex === idx && (
              <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// 4. POLICIES (Shipping, Returns, Privacy, Terms)
export const PolicyPage: React.FC<{ type: 'SHIPPING' | 'RETURN' | 'REFUND' | 'PRIVACY' | 'TERMS' | 'SERVICEABILITY' }> = ({
  type
}) => {
  const content = {
    SHIPPING: {
      title: 'Shipping & Site Delivery Policy',
      body: `### 1. Delivery Speeds & Windows
BUILDORA 60 provides two primary fulfillment models:
- **ASAP 60-Minute Site Dispatch**: Designed for tools, fasteners, electrical conduits, plumbing fittings, adhesives, and quick-replacement materials. Dispatched within 15 minutes of payment verification from regional dark stores.
- **Scheduled Slot Deliveries**: Suitable for large-volume cement, multi-sheet plywood, and overhead water tanks requiring specialized offloading trucks.

### 2. Vehicle Access & Offloading
Delivery drivers will transport materials to the nearest vehicular site gate or access point. Heavy material unloading requires appropriate site labor or can be arranged with our hydraulic tail-lift fleet upon prior notice.`
    },
    RETURN: {
      title: 'Return & Replacement Policy',
      body: `### 1. Return Window
Unused, factory-sealed materials in resalable condition can be returned within 48 hours of delivery.

### 2. Non-Returnable Items
Due to chemical hydration and perishable factors, custom-cut electrical wires, open cement sacks, mixed paint shades, and unpacked chemicals cannot be returned unless verified as damaged upon arrival.`
    },
    REFUND: {
      title: 'Refund & Cancellation Policy',
      body: `### 1. Order Cancellation
Orders may be cancelled free of charge prior to warehouse picking. Once dispatched with a site driver, cancellation will incur a nominal restocking charge.

### 2. Refund Processing
Refunds for prepaid orders (UPI/Card/NetBanking) are credited back to the original payment source within 3-5 business days or credited instantly to the customer's Buildora Wallet.`
    },
    PRIVACY: {
      title: 'Privacy & Data Protection Policy',
      body: `### 1. Information Collection
We collect customer contact credentials, site delivery coordinates, and GSTIN identifiers solely to fulfill material delivery and generate compliant tax invoices.

### 2. Payment Security
BUILDORA 60 does not store credit/debit card numbers or UPI MPINs. All transactions are securely routed through PCI-DSS compliant Razorpay infrastructure.`
    },
    TERMS: {
      title: 'Terms of Service',
      body: `### 1. General Agreement
By placing orders on BUILDORA 60, customers agree to our serviceability terms, site offloading guidelines, and payment schedules.

### 2. Commercial Pricing
All listed rates are inclusive of GST at prevailing rates (18% or 28% depending on material classification).`
    },
    SERVICEABILITY: {
      title: 'Pincode Serviceability Map',
      body: `### Active 60-Minute Quick Commerce Zones
BUILDORA 60 currently operates high-speed delivery hubs across top regional clusters including Bengaluru (Central, Indiranagar, Koramangala, Whitefield, Electronic City, HSR Layout), Mumbai, New Delhi, Chennai, and Hyderabad.

Enter your 6-digit pincode in the top location selector to check exact delivery promise times.`
    }
  }[type];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
      <h1 className="text-3xl font-black text-slate-900">{content.title}</h1>
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-card text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
        {content.body}
      </div>
    </div>
  );
};
