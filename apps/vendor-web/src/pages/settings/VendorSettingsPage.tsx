import React, { useState } from 'react';
import {
  Settings,
  Store,
  Building,
  CreditCard,
  Clock,
  Users,
  ShieldCheck,
  Save,
  CheckCircle2,
  Warehouse,
} from 'lucide-react';
import { useVendorAuthStore } from '../../store/useVendorAuthStore';
import { Card, CardHeader, CardContent, CardFooter } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const VendorSettingsPage: React.FC = () => {
  const { vendor } = useVendorAuthStore();

  const [storeName, setStoreName] = useState(vendor?.businessInfo?.storeName || vendor?.storeName || 'Supreme Materials BLR');
  const [email, setEmail] = useState(vendor?.businessInfo?.email || vendor?.email || 'vendor@buildora.in');
  const [phone, setPhone] = useState(vendor?.businessInfo?.phone || vendor?.phone || '+91 98450 12345');
  const [legalName, setLegalName] = useState(vendor?.businessInfo?.businessName || vendor?.business?.legalName || 'Supreme Materials Private Limited');
  const [gstin, setGstin] = useState(vendor?.businessInfo?.gstin || vendor?.business?.gstin || '29AAAAA0000A1Z5');
  const [pan, setPan] = useState(vendor?.businessInfo?.pan || vendor?.business?.pan || 'AAAAA0000A');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Store Profile & Partner Settings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your legal entity, contact information, settlement accounts, and operating team.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="success" dot>Store Verified & Live</Badge>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Store settings updated successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Store Information */}
        <Card>
          <CardHeader
            title="Business Identification"
            subtitle="Display name and legal registered details in Karnataka"
          />
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Store Display Name
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Legal Entity Name
                </label>
                <input
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dispatch Hotline / WhatsApp
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  GSTIN (Karnataka)
                </label>
                <input
                  type="text"
                  value={gstin}
                  disabled
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 font-mono text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  PAN Identifier
                </label>
                <input
                  type="text"
                  value={pan}
                  disabled
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 font-mono text-slate-600"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operating Hours */}
        <Card>
          <CardHeader
            title="Operating Hours & Dispatch Window"
            subtitle="Timeframes when your dark store warehouse confirms and packs material"
          />
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Monday - Saturday</span>
                <span className="font-bold text-slate-800">07:00 AM – 09:00 PM</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Sunday Express</span>
                <span className="font-bold text-slate-800">08:00 AM – 06:00 PM</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Primary Dark Store</span>
                <span className="font-bold text-blue-700">WH-BLR-04 Peenya</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Fulfillment SLA</span>
                <span className="font-bold text-emerald-700">60-Min Express</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Members */}
        <Card>
          <CardHeader
            title="Authorized Team & Roles"
            subtitle="Personnel with access to catalog, dispatch and settlement statements"
          />
          <CardContent>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">{vendor?.businessInfo?.contactPerson || vendor?.name || 'Arjun Vendor'}</p>
                  <p className="text-[11px] text-slate-400">{vendor?.businessInfo?.email || vendor?.email || 'vendor@buildora.in'}</p>
                </div>
                <Badge variant="brand">Store Owner / Admin</Badge>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Ramesh Kumar (Peenya Warehouse)</p>
                  <p className="text-[11px] text-slate-400">dispatch.peenya@supremematerials.com</p>
                </div>
                <Badge variant="neutral">Warehouse Dispatcher</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save All Changes
          </Button>
        </div>
      </form>
    </div>
  );
};
