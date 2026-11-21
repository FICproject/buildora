import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PhoneCall,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  Truck,
  CheckCircle2,
  ArrowRight,
  User,
  Wallet,
  Heart,
  Package,
  HelpCircle,
  Building2
} from 'lucide-react';
import { MASTER_CATEGORIES } from '@buildora/constants';

export const Footer: React.FC = () => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.includes('@')) {
      setIsSubscribed(true);
      setNewsletterEmail('');
    }
  };

  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-8 border-t border-slate-800">
      <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* Value Proposition Badges */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-12 border-b border-slate-800 text-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-orange-500/20 text-brand-orange-400 flex items-center justify-center flex-shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white">60-Min Quick Dispatch</div>
              <div className="text-xs text-slate-400">Direct from local dark stores</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white">100% Genuine Materials</div>
              <div className="text-xs text-slate-400">Direct from authorized brands</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white">Instant GST ITC Invoicing</div>
              <div className="text-xs text-slate-400">Automatic business billing</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white">Site Support Desk</div>
              <div className="text-xs text-slate-400">1800-60-BUILD (7am - 11pm)</div>
            </div>
          </div>
        </div>

        {/* Main Footer Links Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 py-12">
          {/* Brand & Newsletter Column (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-brand-blue-600 flex items-center justify-center text-white font-black text-xl">
                B
              </div>
              <span className="font-black text-2xl tracking-tight text-white">
                BUILDORA<span className="text-brand-orange-500 ml-0.5">60</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              BUILDORA 60 is India's premier multi-tenant construction materials quick-commerce SaaS platform.
              Delivering cement, plumbing, electrical, tiles, plywood, and power tools straight to your job site
              in as fast as 60 minutes.
            </p>
            <div className="space-y-1.5 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-orange-500" />
                <span>Outer Ring Road Tech Hub, Bengaluru - 560103</span>
              </div>
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-brand-orange-500" />
                <a href="tel:18006028453" className="hover:text-white">
                  1800-60-BUILD (1800-60-28453)
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-orange-500" />
                <a href="mailto:support@buildora.com" className="hover:text-white">
                  support@buildora.com
                </a>
              </div>
            </div>

            {/* Newsletter */}
            <div className="pt-2">
              <div className="text-xs font-bold text-white mb-2">
                Subscribe for Contractor Deals &amp; Material Price Indexes
              </div>
              {isSubscribed ? (
                <div className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Thank you for subscribing!
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2 max-w-sm">
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-blue-500"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-brand-orange-500 hover:bg-brand-orange-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-colors"
                  >
                    Join
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* 1. Shopping Column */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-white mb-3">
              Shopping
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/products" className="text-slate-400 hover:text-white transition-colors">
                  All Materials &amp; Products
                </Link>
              </li>
              <li>
                <Link to="/deals" className="text-slate-400 hover:text-white transition-colors">
                  Deals of the Day
                </Link>
              </li>
              <li>
                <Link to="/new-launches" className="text-slate-400 hover:text-white transition-colors">
                  New Launches &amp; Innovations
                </Link>
              </li>
              <li>
                <Link to="/bulk-orders" className="text-slate-400 hover:text-white transition-colors">
                  Bulk Commercial Orders
                </Link>
              </li>
              <li>
                <Link to="/brands" className="text-slate-400 hover:text-white transition-colors">
                  Direct Authorized Brands
                </Link>
              </li>
              <li>
                <Link to="/price-lists" className="text-slate-400 hover:text-white transition-colors">
                  Daily Price Lists
                </Link>
              </li>
              <li>
                <Link to="/tools/material-estimator" className="text-slate-400 hover:text-white transition-colors">
                  Civil Material Estimator
                </Link>
              </li>
            </ul>
          </div>

          {/* 2. Customer Account Column */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-white mb-3">
              Customer Account
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/account" className="text-slate-400 hover:text-white transition-colors">
                  Account Dashboard
                </Link>
              </li>
              <li>
                <Link to="/account/orders" className="text-slate-400 hover:text-white transition-colors">
                  My Orders &amp; Dispatches
                </Link>
              </li>
              <li>
                <Link to="/orders/BLD-2026-8941/track" className="text-slate-400 hover:text-white transition-colors">
                  Live Dispatch Tracking
                </Link>
              </li>
              <li>
                <Link to="/account/wallet" className="text-slate-400 hover:text-white transition-colors">
                  Buildora Cash Wallet
                </Link>
              </li>
              <li>
                <Link to="/account/wishlist" className="text-slate-400 hover:text-white transition-colors">
                  Saved Materials (Wishlist)
                </Link>
              </li>
              <li>
                <Link to="/account/projects" className="text-slate-400 hover:text-white transition-colors">
                  Project Shopping Lists
                </Link>
              </li>
              <li>
                <Link to="/account/support" className="text-slate-400 hover:text-white transition-colors">
                  Dedicated Site Support
                </Link>
              </li>
            </ul>
          </div>

          {/* 3. Company & Advice Column */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-white mb-3">
              Company
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/about" className="text-slate-400 hover:text-white transition-colors">
                  About BUILDORA 60
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-slate-400 hover:text-white transition-colors">
                  Contact Customer Care
                </Link>
              </li>
              <li>
                <Link to="/knowledge-hub" className="text-slate-400 hover:text-white transition-colors">
                  Knowledge Hub &amp; Guides
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-slate-400 hover:text-white transition-colors">
                  Help &amp; FAQs
                </Link>
              </li>
              <li>
                <Link to="/serviceability" className="text-slate-400 hover:text-white transition-colors">
                  Dark Store Serviceability
                </Link>
              </li>
            </ul>
          </div>

          {/* 4. Policies & Legal Column */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-white mb-3">
              Policies
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/shipping-policy" className="text-slate-400 hover:text-white transition-colors">
                  Shipping &amp; Delivery Policy
                </Link>
              </li>
              <li>
                <Link to="/return-policy" className="text-slate-400 hover:text-white transition-colors">
                  Return &amp; Replacement Policy
                </Link>
              </li>
              <li>
                <Link to="/refund-policy" className="text-slate-400 hover:text-white transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link to="/cancellation-policy" className="text-slate-400 hover:text-white transition-colors">
                  Cancellation Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-and-conditions" className="text-slate-400 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="text-slate-400 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/payment-information" className="text-slate-400 hover:text-white transition-colors">
                  Payment Security &amp; Razorpay
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright & Disclaimer */}
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} BUILDORA 60 Technologies Pvt Ltd. All rights reserved.
          </div>
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-400">Payment Modes:</span>
            <span>Razorpay Secure</span>
            <span>•</span>
            <span>UPI</span>
            <span>•</span>
            <span>Visa &amp; MasterCard</span>
            <span>•</span>
            <span>RuPay</span>
            <span>•</span>
            <span>Cash on Delivery</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
