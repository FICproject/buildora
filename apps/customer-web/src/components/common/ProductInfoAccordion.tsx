import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  PackageCheck
} from 'lucide-react';
import { Product } from '@buildora/types';

export interface ProductInfoAccordionProps {
  product: Product;
}

type AccordionSectionId = 'highlights' | 'description' | 'faqs' | 'returns';

interface AccordionItemProps {
  id: AccordionSectionId;
  title: string;
  isOpen: boolean;
  onToggle: (id: AccordionSectionId) => void;
  panelClassName?: string;
  children: React.ReactNode;
}

const AccordionItem: React.FC<AccordionItemProps> = ({
  id,
  title,
  isOpen,
  onToggle,
  panelClassName = '',
  children,
}) => (
  <div>
    <button
      type="button"
      id={`accordion-header-${id}`}
      aria-expanded={isOpen}
      aria-controls={`accordion-panel-${id}`}
      onClick={() => onToggle(id)}
      className="w-full py-4 px-4 sm:px-5 flex items-center justify-between text-left font-bold text-sm sm:text-[15px] text-slate-900 hover:text-brand-blue-900 transition-colors cursor-pointer select-none"
    >
      <span className="flex items-center gap-2">
        <span>{title}</span>
      </span>
      <ChevronDown
        className={`w-4 h-4 text-slate-400 transition-transform duration-300 ease-out flex-shrink-0 ${isOpen ? 'rotate-180 text-brand-blue-700' : ''
          }`}
        aria-hidden="true"
      />
    </button>

    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key={`panel-${id}`}
          id={`accordion-panel-${id}`}
          role="region"
          aria-labelledby={`accordion-header-${id}`}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden"
        >
          <div
            className={`px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 border-t border-slate-100 ${panelClassName}`}
          >
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export const ProductInfoAccordion: React.FC<ProductInfoAccordionProps> = ({ product }) => {
  // Single active accordion section ensures only one dropdown is open at any time
  const [activeAccordion, setActiveAccordion] = useState<AccordionSectionId | null>(null);

  const toggleSection = (section: AccordionSectionId) => {
    setActiveAccordion((prev) => (prev === section ? null : section));
  };

  // 1. Dynamic Product Highlights Assembly (only existing, non-empty attributes)
  const highlights: { label: string; value: string }[] = [];

  if (product.brand) {
    highlights.push({ label: 'Brand', value: product.brand });
  }
  if (product.subcategory || product.category) {
    highlights.push({
      label: 'Product Type',
      value: product.subcategory ? `${product.category} • ${product.subcategory}` : product.category
    });
  }
  if (product.packSize || product.unit) {
    highlights.push({ label: 'Size / Pack Size', value: product.packSize || product.unit });
  }
  if (product.sku) {
    highlights.push({ label: 'SKU / Item Code', value: product.sku });
  }
  if (product.warranty) {
    highlights.push({ label: 'Warranty', value: product.warranty });
  }
  if (product.certifications && product.certifications.length > 0) {
    highlights.push({ label: 'Certifications & Standards', value: product.certifications.join(', ') });
  }
  if (product.applications && product.applications.length > 0) {
    highlights.push({ label: 'Recommended Applications', value: product.applications.join(', ') });
  }

  // Include technical specifications
  if (product.specifications && typeof product.specifications === 'object') {
    Object.entries(product.specifications).forEach(([key, val]) => {
      if (val && typeof val === 'string' && val.trim() !== '') {
        const isDuplicate = highlights.some(
          (h) => h.label.toLowerCase() === key.toLowerCase()
        );
        if (!isDuplicate) {
          highlights.push({ label: key, value: val });
        }
      }
    });
  }

  // Include category attributes
  if (product.categoryAttributes && typeof product.categoryAttributes === 'object') {
    Object.entries(product.categoryAttributes).forEach(([key, val]) => {
      if (val && typeof val === 'string' && val.trim() !== '') {
        const formattedKey = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, (str) => str.toUpperCase());
        const isDuplicate = highlights.some(
          (h) => h.label.toLowerCase() === formattedKey.toLowerCase()
        );
        if (!isDuplicate) {
          highlights.push({ label: formattedKey, value: val });
        }
      }
    });
  }

  // 2. Dynamic FAQs Assembly
  const productFaqs =
    product.faqs && product.faqs.length > 0
      ? product.faqs
      : [
        ...(product.warranty
          ? [
            {
              question: `What is the warranty coverage for this ${product.brand} product?`,
              answer: product.warranty
            }
          ]
          : []),
        ...(product.installationTips && product.installationTips.length > 0
          ? [
            {
              question: `How should ${product.name} be handled and stored on site?`,
              answer: product.installationTips.join('. ')
            }
          ]
          : []),
        ...(product.variants && product.variants.length > 1
          ? [
            {
              question: `What pack sizes or variants are available for ${product.name}?`,
              answer: `Available in ${product.variants.map((v) => v.name).join(', ')}. Select your preferred pack size above.`
            }
          ]
          : []),
        {
          question: `What is the delivery timeline for ${product.brand} materials to my site?`,
          answer: `Orders placed in active serviceable zones are dispatched from the nearest Buildora dark store within 60 to 90 minutes using dedicated vehicles.`
        },
        {
          question: 'Will I receive a GST Input Tax Credit (ITC) commercial invoice?',
          answer: `Yes. Enter your company GSTIN during checkout or save it in your account profile. A valid B2B tax invoice with HSN code and ${product.gstRate}% GST break-up will be issued automatically.`
        },
        {
          question: 'Can I return damaged or excess bags/units at the time of delivery?',
          answer: 'Yes. Our delivery partner will conduct an on-site physical inspection before unloading. In the event of transit damage or wrong dispatch, you can request an instant return or replacement directly.'
        }
      ];

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden divide-y divide-slate-100">
      {/* ---------------- 1. PRODUCT HIGHLIGHTS ---------------- */}
      <AccordionItem
        id="highlights"
        title="Product Highlights"
        isOpen={activeAccordion === 'highlights'}
        onToggle={toggleSection}
      >
        {highlights.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            {highlights.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col p-2.5 rounded-xl bg-slate-50 border border-slate-100"
              >
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {item.label}
                </span>
                <span className="text-xs font-bold text-slate-800 mt-0.5">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic py-2">
            Detailed highlights will be updated shortly for this product.
          </p>
        )}
      </AccordionItem>

      {/* ---------------- 2. PRODUCT DESCRIPTION ---------------- */}
      <AccordionItem
        id="description"
        title="Product Description"
        isOpen={activeAccordion === 'description'}
        onToggle={toggleSection}
        panelClassName="space-y-4"
      >
        {/* Overview / Short Description */}
        {product.shortDescription && (
          <div className="pt-2">
            <p className="font-semibold text-slate-800 leading-relaxed">
              {product.shortDescription}
            </p>
          </div>
        )}

        {/* Main Detailed Description */}
        {product.description && (
          <div className={product.shortDescription ? '' : 'pt-2'}>
            <p className="leading-relaxed text-slate-600 whitespace-pre-line">
              {product.description}
            </p>
          </div>
        )}

        {/* Applications & Usage */}
        {product.applications && product.applications.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Applications &amp; Site Usage:
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
              {product.applications.map((app, i) => (
                <li key={i} className="flex items-center gap-1.5 text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>{app}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Installation & Storage Instructions */}
        {product.installationTips && product.installationTips.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Installation &amp; Handling Guidelines:
            </h4>
            <ul className="space-y-1 text-xs text-slate-600">
              {product.installationTips.map((tip, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-brand-blue-700 font-bold">&bull;</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Important Product Safety Notes */}
        {product.safetyInstructions && product.safetyInstructions.length > 0 && (
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1 text-xs text-amber-900">
            <div className="font-bold flex items-center gap-1.5 text-amber-800">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <span>Important Product Notes &amp; Safety:</span>
            </div>
            <ul className="space-y-0.5 text-amber-900/90 pl-5 list-disc">
              {product.safetyInstructions.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          </div>
        )}
      </AccordionItem>

      {/* ---------------- 3. FAQs ---------------- */}
      <AccordionItem
        id="faqs"
        title="FAQs"
        isOpen={activeAccordion === 'faqs'}
        onToggle={toggleSection}
        panelClassName="space-y-3"
      >
        {productFaqs.length > 0 ? (
          <div className="space-y-2.5 pt-2">
            {productFaqs.map((faq, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1"
              >
                <h5 className="text-xs font-bold text-slate-900">
                  {faq.question}
                </h5>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic py-2">
            Frequently Asked Questions coming soon for this product.
          </p>
        )}
      </AccordionItem>

      {/* ---------------- 4. RETURNS & EXCHANGE POLICY ---------------- */}
      <AccordionItem
        id="returns"
        title="Returns & Exchange Policy"
        isOpen={activeAccordion === 'returns'}
        onToggle={toggleSection}
        panelClassName="space-y-3.5"
      >
        {/* Key Policy Summary Points */}
        <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
            <RotateCcw className="w-4 h-4 text-brand-blue-700 flex-shrink-0 mt-0.5" />
            <div>
              <h5 className="text-xs font-bold text-slate-900">48-Hour Return Window</h5>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Unused, factory-sealed materials in resalable condition can be returned within 48 hours of site delivery.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
            <PackageCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <h5 className="text-xs font-bold text-slate-900">Eligible Conditions</h5>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Surplus unopened items, transit damage, moisture ingress, or wrong brand/specification delivered.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h5 className="text-xs font-bold text-slate-900">Non-Returnable Items</h5>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Custom-cut electrical wires, open cement sacks, mixed paint shades, and unpacked chemicals cannot be returned once opened unless transit-damaged upon arrival.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
            <CreditCard className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div>
              <h5 className="text-xs font-bold text-slate-900">Fast Refund &amp; Exchange</h5>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Refunds are credited to the original payment source within 3–5 business days or credited instantly to your BUILDORA Wallet.
              </p>
            </div>
          </div>
        </div>

        {/* How to initiate support */}
        <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-blue-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div>
            <span className="font-bold">Need assistance with a return or exchange?</span>
            <p className="text-[11px] text-blue-900/80 mt-0.5">
              Submit a request from your My Orders page or connect with our construction material desk.
            </p>
          </div>
          <Link
            to="/account/orders"
            className="text-xs font-bold text-brand-blue-800 hover:underline flex-shrink-0"
          >
            Go to My Orders &rarr;
          </Link>
        </div>
      </AccordionItem>
    </div>
  );
};
