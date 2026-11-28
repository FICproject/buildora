import PDFDocument from 'pdfkit';
import {
  Order,
  VendorInvoice,
  VendorInvoiceItem,
  VendorOrder,
} from '@buildora/types';
import { dbStore } from '../../../database/store';
import {
  VendorInvoiceModel,
  platformPersistenceService,
} from '../../../database/platform-persistence.service';

const INDIAN_STATE_CODES: Record<string, string> = {
  '01': 'Jammu & Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '26': 'Dadra & Nagar Haveli and Daman & Diu',
  '27': 'Maharashtra',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman & Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh',
};

const STATE_NAME_TO_CODE: Record<string, string> = {
  ...Object.fromEntries(
    Object.entries(INDIAN_STATE_CODES).map(([code, name]) => [
      name.toLowerCase(),
      code,
    ])
  ),
  ka: '29',
  blr: '29',
  bengaluru: '29',
  bangalore: '29',
  mh: '27',
  mumbai: '27',
  pune: '27',
  tn: '33',
  chennai: '33',
  dl: '07',
  'new delhi': '07',
  ts: '36',
  hyderabad: '36',
  ap: '37',
  gj: '24',
  kl: '32',
  hr: '06',
  up: '09',
  rj: '08',
  wb: '19',
};

export function round2(val: number): number {
  return Math.round((Number(val) + Number.EPSILON) * 100) / 100;
}

export function getFinancialYearCode(date = new Date()): string {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const startYear = month >= 4 ? year : year - 1;
  const endYear = startYear + 1;
  return `${String(startYear).slice(-2)}${String(endYear).slice(-2)}`;
}

export function resolveStateAndCode(
  stateStr?: string,
  gstin?: string,
  cityStr?: string
): { stateName: string; stateCode: string } {
  const cleanGstin = String(gstin || '').trim().toUpperCase();
  if (/^\d{2}[A-Z0-9]{13}$/.test(cleanGstin)) {
    const code = cleanGstin.slice(0, 2);
    if (INDIAN_STATE_CODES[code]) {
      return { stateCode: code, stateName: INDIAN_STATE_CODES[code] };
    }
  }
  const normalizedState = String(stateStr || '').trim().toLowerCase();
  if (normalizedState && STATE_NAME_TO_CODE[normalizedState]) {
    const code = STATE_NAME_TO_CODE[normalizedState];
    return { stateCode: code, stateName: INDIAN_STATE_CODES[code] || stateStr! };
  }
  const normalizedCity = String(cityStr || '').trim().toLowerCase();
  if (normalizedCity && STATE_NAME_TO_CODE[normalizedCity]) {
    const code = STATE_NAME_TO_CODE[normalizedCity];
    return { stateCode: code, stateName: INDIAN_STATE_CODES[code] };
  }
  return {
    stateCode: '29',
    stateName: stateStr?.trim() || 'Karnataka',
  };
}

function inferConstructionTaxFallback(nameOrCat = ''): {
  hsnCode: string;
  gstRate: number;
} {
  const s = nameOrCat.toLowerCase();
  if (s.includes('cement') || s.includes('concrete') || s.includes('rmc')) {
    return { hsnCode: '2523', gstRate: 28 };
  }
  if (s.includes('tile') || s.includes('vitrified') || s.includes('ceramic')) {
    return { hsnCode: '6907', gstRate: 18 };
  }
  if (s.includes('adhesive') || s.includes('grout') || s.includes('waterproof')) {
    return { hsnCode: '3214', gstRate: 18 };
  }
  if (s.includes('ply') || s.includes('mdf') || s.includes('hdhmr') || s.includes('wood')) {
    return { hsnCode: '4412', gstRate: 18 };
  }
  if (s.includes('paint') || s.includes('primer') || s.includes('emulsion') || s.includes('putty')) {
    return { hsnCode: '3209', gstRate: 18 };
  }
  if (s.includes('wire') || s.includes('cable')) {
    return { hsnCode: '8544', gstRate: 18 };
  }
  if (s.includes('switch') || s.includes('socket') || s.includes('mcb') || s.includes('board')) {
    return { hsnCode: '8536', gstRate: 18 };
  }
  if (s.includes('light') || s.includes('led') || s.includes('lamp')) {
    return { hsnCode: '9405', gstRate: 18 };
  }
  if (s.includes('pipe') || s.includes('cpvc') || s.includes('upvc') || s.includes('pvc')) {
    return { hsnCode: '3917', gstRate: 18 };
  }
  if (s.includes('sanitary') || s.includes('basin') || s.includes('closet') || s.includes('commode')) {
    return { hsnCode: '6910', gstRate: 18 };
  }
  if (s.includes('tank') || s.includes('sintex')) {
    return { hsnCode: '3925', gstRate: 18 };
  }
  if (s.includes('hinge') || s.includes('channel') || s.includes('handle') || s.includes('lock')) {
    return { hsnCode: '8302', gstRate: 18 };
  }
  if (s.includes('drill') || s.includes('grinder') || s.includes('tool')) {
    return { hsnCode: '8467', gstRate: 18 };
  }
  if (s.includes('steel') || s.includes('tmt') || s.includes('rebar')) {
    return { hsnCode: '7214', gstRate: 18 };
  }
  return { hsnCode: '6815', gstRate: 18 };
}

export function numberToIndianWords(num: number): string {
  const clean = Math.max(0, round2(num));
  const rupees = Math.floor(clean);
  const paise = Math.round((clean - rupees) * 100);

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
  ];

  const twoDigits = (n: number): string => {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    return `${tens[Math.floor(n / 10)]}${n % 10 ? ' ' + ones[n % 10] : ''}`.trim();
  };

  const threeDigits = (n: number): string => {
    if (n === 0) return '';
    const h = Math.floor(n / 100);
    const rem = n % 100;
    return `${h ? ones[h] + ' Hundred' : ''}${h && rem ? ' ' : ''}${twoDigits(rem)}`.trim();
  };

  const intToWords = (n: number): string => {
    if (n === 0) return 'Zero';
    const crore = Math.floor(n / 10000000);
    const lakh = Math.floor((n % 10000000) / 100000);
    const thousand = Math.floor((n % 100000) / 1000);
    const rest = n % 1000;
    const parts: string[] = [];
    if (crore) parts.push(`${twoDigits(crore)} Crore`);
    if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
    if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
    if (rest) parts.push(threeDigits(rest));
    return parts.join(' ').trim();
  };

  const rupeeStr = `Rupees ${intToWords(rupees)}`;
  const paiseStr = paise > 0 ? ` and ${twoDigits(paise)} Paise` : '';
  return `${rupeeStr}${paiseStr} Only`;
}

function formatInr(val: number): string {
  return `Rs. ${round2(val).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

type VendorLookupFn = (vendorId: string) => any;
type InvoiceStoreAccessor = () => VendorInvoice[];

class GstInvoiceService {
  private vendorLookup: VendorLookupFn | null = null;
  private invoiceStoreAccessor: InvoiceStoreAccessor | null = null;

  registerStores(
    vendorLookup: VendorLookupFn,
    invoiceStoreAccessor: InvoiceStoreAccessor
  ) {
    this.vendorLookup = vendorLookup;
    this.invoiceStoreAccessor = invoiceStoreAccessor;
  }

  private getInvoiceList(): VendorInvoice[] {
    return this.invoiceStoreAccessor ? this.invoiceStoreAccessor() : [];
  }

  getVendorRecord(vendorId: string): any {
    if (!vendorId) return undefined;
    return this.vendorLookup ? this.vendorLookup(vendorId) : undefined;
  }

  getExistingVendorInvoice(vendorOrderId: string): VendorInvoice | undefined {
    const list = this.getInvoiceList();
    return list.find(
      (inv) =>
        inv.vendorOrderId === vendorOrderId &&
        String(inv.status || '').toUpperCase() !== 'CANCELLED'
    );
  }

  getOrderInvoices(orderNumber: string, orderId?: string): VendorInvoice[] {
    const list = this.getInvoiceList();
    return list.filter(
      (inv) =>
        inv.orderNumber === orderNumber ||
        (orderId ? inv.orderId === orderId : false)
    );
  }

  private allocateInvoiceNumber(
    vendorId: string,
    vendorName: string,
    fyCode: string
  ): { invoiceNumber: string; sequenceNumber: number } {
    const prefix =
      vendorName
        .replace(/[^A-Za-z0-9]/g, '')
        .slice(0, 4)
        .toUpperCase() || 'VNDR';
    const list = this.getInvoiceList();
    const existingForVendorFy = list.filter(
      (i) =>
        i.vendorId === vendorId &&
        (i.financialYear === fyCode ||
          String(i.invoiceNumber || '').includes(`-${fyCode}-`))
    );
    let maxSeq = 0;
    for (const inv of existingForVendorFy) {
      const m = String(inv.invoiceNumber || '').match(/-(\d+)$/);
      if (m) {
        maxSeq = Math.max(maxSeq, Number(m[1]));
      }
    }
    const sequenceNumber = Math.max(maxSeq, existingForVendorFy.length) + 1;
    const nextSeq = String(sequenceNumber).padStart(4, '0');
    return {
      invoiceNumber: `INV-${prefix}-${fyCode}-${nextSeq}`,
      sequenceNumber,
    };
  }

  async buildVendorGstInvoice(
    vendorOrder: VendorOrder & Record<string, any>,
    masterOrder?: (Order & Record<string, any>) | undefined,
    opts?: {
      vehicleNumber?: string;
      deliveryReference?: string;
      ewayBillNumber?: string;
      irn?: string;
      signedQrCode?: string;
      allocateCharges?: boolean;
    }
  ): Promise<VendorInvoice> {
    const existing = this.getExistingVendorInvoice(vendorOrder.id);
    if (existing) {
      let dirty = false;
      if (opts?.vehicleNumber && !existing.vehicleNumber) {
        existing.vehicleNumber = opts.vehicleNumber;
        dirty = true;
      }
      if (opts?.deliveryReference && !existing.deliveryReference) {
        existing.deliveryReference = opts.deliveryReference;
        dirty = true;
      }
      if (masterOrder?.paymentStatus === 'PAID' && existing.status !== 'PAID') {
        existing.status = 'PAID';
        dirty = true;
      }
      if (dirty) {
        await platformPersistenceService.upsert(VendorInvoiceModel, existing);
      }
      return existing;
    }

    const vendor = this.getVendorRecord(vendorOrder.vendorId);
    const biz = vendor?.businessInfo || {};
    const sellerAddr = biz.address || vendor?.pickupAddress || {};

    const sellerLegalName =
      biz.businessName ||
      vendor?.legalEntityName ||
      vendor?.storeName ||
      vendor?.name ||
      vendorOrder.vendorName ||
      'Authorized Marketplace Vendor';
    const sellerTradeName =
      vendor?.storeName && vendor.storeName !== sellerLegalName
        ? vendor.storeName
        : undefined;

    const sellerGstin = String(
      biz.gstin || vendor?.taxCompliance?.gstin || 'UNREGISTERED'
    )
      .trim()
      .toUpperCase();

    const sellerState = resolveStateAndCode(
      sellerAddr.state,
      sellerGstin,
      sellerAddr.city
    );
    const formattedSellerAddr = [
      sellerAddr.building,
      sellerAddr.street,
      sellerAddr.area,
      sellerAddr.city,
      sellerState.stateName,
      sellerAddr.pincode,
    ]
      .filter(Boolean)
      .join(', ');

    const shipAddr: any =
      masterOrder?.deliveryAddress || vendorOrder.deliveryAddress || {};
    const billAddr: any = masterOrder?.billingAddress || shipAddr;
    const buyerGstinRaw = String(
      masterOrder?.gstin || masterOrder?.buyerGstin || ''
    )
      .trim()
      .toUpperCase();
    const buyerGstin =
      /^\d{2}[A-Z0-9]{13}$/.test(buyerGstinRaw) ? buyerGstinRaw : undefined;

    const buyerState = resolveStateAndCode(
      shipAddr.state || billAddr.state,
      buyerGstin,
      shipAddr.city || billAddr.city
    );
    const isInterState = sellerState.stateCode !== buyerState.stateCode;

    const formatAddr = (a: any) =>
      [
        a?.building || a?.line1 || a?.addressLine1 || a?.street,
        a?.area || a?.landmark || a?.line2,
        a?.city,
        a?.state,
        a?.pincode,
      ]
        .filter(Boolean)
        .join(', ');

    const buyerBillName =
      masterOrder?.companyName ||
      billAddr?.recipientName ||
      masterOrder?.customerName ||
      vendorOrder.customerName ||
      'Buildora Customer';

    const invoiceItems: VendorInvoiceItem[] = [];
    let taxableTotal = 0;
    let totalDiscount = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;
    let linesGrandTotal = 0;

    (vendorOrder.items || []).forEach((rawItem: any, idx: number) => {
      const catalogProd = dbStore.products.find(
        (p: any) => p.id === rawItem.productId || p.sku === rawItem.sku
      ) as any;

      const qty = Math.max(1, Number(rawItem.quantity || 1));
      const fallbackMeta = inferConstructionTaxFallback(
        `${rawItem.name || ''} ${catalogProd?.category || ''} ${
          catalogProd?.subcategory || ''
        }`
      );
      const hsnCode = String(
        rawItem.hsnCode || catalogProd?.hsnCode || fallbackMeta.hsnCode
      ).trim();
      const gstRate = Number(
        rawItem.gstRate ?? catalogProd?.gstRate ?? fallbackMeta.gstRate
      );
      const unit = String(
        rawItem.unit ||
          rawItem.unitLabel ||
          catalogProd?.unit ||
          catalogProd?.packSize ||
          'Unit'
      );

      const unitPrice = round2(Number(rawItem.unitPrice ?? rawItem.price ?? 0));
      const discount = round2(Number(rawItem.discount || 0));
      const storedLineTotal = round2(
        Number(rawItem.totalPrice ?? unitPrice * qty - discount)
      );

      let lineTaxable = 0;
      let lineGst = 0;

      if (
        typeof rawItem.taxableAmount === 'number' &&
        typeof rawItem.gstAmount === 'number'
      ) {
        lineTaxable = round2(rawItem.taxableAmount);
        lineGst = round2(rawItem.gstAmount);
      } else if (rawItem.priceIncludesGst === true) {
        const net = Math.max(0, round2(storedLineTotal));
        lineTaxable = round2(net / (1 + gstRate / 100));
        lineGst = round2(net - lineTaxable);
      } else if (typeof rawItem.gstAmount === 'number' && rawItem.gstAmount > 0) {
        lineGst = round2(rawItem.gstAmount);
        lineTaxable = round2(storedLineTotal);
      } else {
        lineTaxable = Math.max(0, round2(unitPrice * qty - discount));
        lineGst = round2((lineTaxable * gstRate) / 100);
      }

      const cgstRate = isInterState ? 0 : round2(gstRate / 2);
      const sgstRate = isInterState ? 0 : round2(gstRate / 2);
      const igstRate = isInterState ? gstRate : 0;

      const cgstAmount = isInterState ? 0 : round2(lineGst / 2);
      const sgstAmount = isInterState ? 0 : round2(lineGst - cgstAmount);
      const igstAmount = isInterState ? lineGst : 0;
      const itemGst = round2(cgstAmount + sgstAmount + igstAmount);
      const lineTotal = round2(lineTaxable + itemGst);

      taxableTotal = round2(taxableTotal + lineTaxable);
      totalDiscount = round2(totalDiscount + discount);
      cgstTotal = round2(cgstTotal + cgstAmount);
      sgstTotal = round2(sgstTotal + sgstAmount);
      igstTotal = round2(igstTotal + igstAmount);
      linesGrandTotal = round2(linesGrandTotal + lineTotal);

      invoiceItems.push({
        sNo: idx + 1,
        productId: String(rawItem.productId || ''),
        description: String(rawItem.name || 'Construction Material'),
        sku: String(rawItem.sku || catalogProd?.sku || ''),
        hsnCode,
        quantity: qty,
        unit,
        rate: qty > 0 ? round2((lineTaxable + discount) / qty) : unitPrice,
        discount,
        taxableValue: lineTaxable,
        gstRate,
        cgstRate,
        cgstAmount,
        sgstRate,
        sgstAmount,
        igstRate,
        igstAmount,
        gstAmount: itemGst,
        total: lineTotal,
      });
    });

    let deliveryCharges = 0;
    let loadingCharges = 0;
    let unloadingCharges = 0;
    if (masterOrder && opts?.allocateCharges !== false) {
      const siblingCount = Math.max(
        1,
        Array.isArray(masterOrder.vendorOrderIds)
          ? masterOrder.vendorOrderIds.length
          : 1
      );
      if (siblingCount === 1) {
        deliveryCharges = round2(Number(masterOrder.deliveryFee || 0));
        unloadingCharges = round2(Number(masterOrder.unloadingFee || 0));
        loadingCharges = round2(Number(masterOrder.loadingFee || 0));
      }
    }

    const exactGrand = round2(
      linesGrandTotal + deliveryCharges + loadingCharges + unloadingCharges
    );
    const roundedGrand = Math.round(exactGrand);
    const roundOff = round2(roundedGrand - exactGrand);
    const finalTotal = round2(exactGrand + roundOff);

    const now = new Date();
    const nowIso = now.toISOString();
    const fyCode = getFinancialYearCode(now);
    const { invoiceNumber, sequenceNumber } = this.allocateInvoiceNumber(
      vendorOrder.vendorId,
      sellerLegalName,
      fyCode
    );

    const placeOfSupply = `${buyerState.stateName} (${buyerState.stateCode})`;

    const invoice: VendorInvoice = {
      id: `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      invoiceNumber,
      financialYear: fyCode,
      sequenceNumber,
      orderId: masterOrder?.id || vendorOrder.id,
      vendorOrderId: vendorOrder.id,
      orderNumber: vendorOrder.orderNumber,
      vendorId: vendorOrder.vendorId,
      tenantId:
        vendorOrder.tenantId || masterOrder?.tenantId || 'tenant-buildora-blr',
      shipmentId: vendorOrder.shipmentId,
      supplierDetails: {
        legalBusinessName: sellerLegalName,
        tradeName: sellerTradeName,
        address: formattedSellerAddr || 'Bengaluru, Karnataka',
        gstin: sellerGstin,
        stateName: sellerState.stateName,
        stateCode: sellerState.stateCode,
        phone: vendor?.phone || biz.phone,
        email: vendor?.email || biz.email,
      },
      buyerDetails: {
        name: buyerBillName,
        businessName: masterOrder?.companyName || undefined,
        gstin: buyerGstin,
        billingAddress:
          formatAddr(billAddr) || formatAddr(shipAddr) || 'Site Address',
        shippingAddress:
          formatAddr(shipAddr) || formatAddr(billAddr) || 'Job Site',
        stateName: buyerState.stateName,
        stateCode: buyerState.stateCode,
        placeOfSupply,
        phone:
          masterOrder?.customerPhone ||
          shipAddr.mobile ||
          billAddr.mobile ||
          undefined,
      },
      items: invoiceItems,
      isInterState,
      reverseCharge: false,
      customerName: buyerBillName,
      customerGstin: buyerGstin,
      invoiceDate: nowIso,
      subtotal: round2(taxableTotal + totalDiscount),
      discount: totalDiscount,
      taxableAmount: taxableTotal,
      cgstAmount: cgstTotal,
      sgstAmount: sgstTotal,
      igstAmount: igstTotal,
      deliveryCharges,
      loadingCharges,
      unloadingCharges,
      roundOff,
      totalAmount: finalTotal,
      amountInWords: numberToIndianWords(finalTotal),
      paymentMethod: masterOrder?.paymentMethod || 'COD',
      paymentReference: masterOrder?.razorpayPaymentId || undefined,
      deliveryReference:
        opts?.deliveryReference || vendorOrder.shipmentId || undefined,
      vehicleNumber: opts?.vehicleNumber || undefined,
      ewayBillNumber: opts?.ewayBillNumber || undefined,
      irn: opts?.irn || undefined,
      signedQrCode: opts?.signedQrCode || undefined,
      pdfUrl: `/api/v1/orders/${encodeURIComponent(vendorOrder.orderNumber)}/invoices/${encodeURIComponent(invoiceNumber)}/pdf`,
      version: 1,
      status: masterOrder?.paymentStatus === 'PAID' ? 'PAID' : 'FINALIZED',
      createdAt: nowIso,
    };

    const list = this.getInvoiceList();
    list.unshift(invoice);
    await platformPersistenceService.upsert(VendorInvoiceModel, invoice);
    return invoice;
  }

  async issueCreditNote(
    invoice: VendorInvoice,
    reason: string,
    refundAmount?: number
  ): Promise<VendorInvoice> {
    if (!Array.isArray(invoice.creditNotes)) {
      invoice.creditNotes = [];
    }
    const existingCn = invoice.creditNotes.find(
      (c) => c.reason === reason && (!refundAmount || c.amount === refundAmount)
    );
    if (existingCn) return invoice;

    const cnNum = `CN-${invoice.financialYear || getFinancialYearCode()}-${String(
      invoice.creditNotes.length + 1
    ).padStart(4, '0')}`;
    invoice.creditNotes.push({
      creditNoteNumber: cnNum,
      issuedAt: new Date().toISOString(),
      reason: reason || 'Order Cancelled / Material Returned',
      amount: round2(Number(refundAmount ?? invoice.totalAmount)),
    });
    invoice.status = 'CANCELLED';
    await platformPersistenceService.upsert(VendorInvoiceModel, invoice);
    return invoice;
  }

  async renderGstInvoicePdfBuffer(invoice: VendorInvoice): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 32,
        info: {
          Title: `Tax Invoice ${invoice.invoiceNumber}`,
          Author: invoice.supplierDetails?.legalBusinessName || 'Vendor',
          Subject: `GST Tax Invoice for Order ${invoice.orderNumber}`,
        },
      });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(Buffer.from(c)));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageW = doc.page.width - 64;
      const leftX = 32;
      let y = 32;

      const sup = invoice.supplierDetails || ({} as any);
      const buy = invoice.buyerDetails || ({} as any);
      const invDate = invoice.invoiceDate || invoice.createdAt || new Date().toISOString();

      doc.rect(leftX, y, pageW, 48).fillAndStroke('#1e293b', '#1e293b');
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(15).text('TAX INVOICE', leftX + 14, y + 10);
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#cbd5e1')
        .text('ORIGINAL FOR RECIPIENT  •  ISSUED UNDER SECTION 31 OF CGST ACT, 2017', leftX + 14, y + 29);

      doc
        .fillColor('#ffffff')
        .font('Helvetica-Bold')
        .fontSize(10)
        .text(invoice.invoiceNumber, leftX + 300, y + 10, {
          width: pageW - 314,
          align: 'right',
        });
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#e2e8f0')
        .text(
          `Date: ${new Date(invDate).toLocaleDateString('en-IN')}  |  Order: ${invoice.orderNumber}`,
          leftX + 260,
          y + 27,
          { width: pageW - 274, align: 'right' }
        );
      y += 58;

      if (invoice.status === 'CANCELLED') {
        doc.rect(leftX, y, pageW, 20).fillAndStroke('#fee2e2', '#ef4444');
        doc
          .fillColor('#991b1b')
          .font('Helvetica-Bold')
          .fontSize(8.5)
          .text(
            `CANCELLED / CREDIT NOTE ISSUED${
              invoice.creditNotes?.[0] ? ` (${invoice.creditNotes[0].creditNoteNumber})` : ''
            }`,
            leftX + 10,
            y + 6
          );
        y += 26;
      }

      const boxHalfW = (pageW - 10) / 2;
      const metaStartY = y;

      doc.rect(leftX, y, boxHalfW, 108).stroke('#cbd5e1');
      doc
        .fillColor('#475569')
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .text('SUPPLIER / SELLER DETAILS', leftX + 8, y + 7);
      doc
        .fillColor('#0f172a')
        .font('Helvetica-Bold')
        .fontSize(9.5)
        .text(sup.legalBusinessName || 'Authorized Seller', leftX + 8, y + 19, {
          width: boxHalfW - 16,
        });
      let sy = y + 32;
      if (sup.tradeName) {
        doc
          .font('Helvetica')
          .fontSize(7.5)
          .fillColor('#475569')
          .text(`Trade Name: ${sup.tradeName}`, leftX + 8, sy, { width: boxHalfW - 16 });
        sy += 10;
      }
      doc
        .font('Helvetica')
        .fontSize(7.8)
        .fillColor('#334155')
        .text(sup.address || '', leftX + 8, sy, { width: boxHalfW - 16, height: 28 });
      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor('#0f172a')
        .text(`GSTIN: ${sup.gstin || 'UNREGISTERED'}`, leftX + 8, y + 72);
      doc
        .font('Helvetica')
        .fontSize(7.8)
        .fillColor('#334155')
        .text(`State: ${sup.stateName || 'Karnataka'} (Code: ${sup.stateCode || '29'})`, leftX + 8, y + 84);
      doc.text(
        `Ph: ${sup.phone || '-'}  ${sup.email ? `•  ${sup.email}` : ''}`,
        leftX + 8,
        y + 95,
        { width: boxHalfW - 16 }
      );

      const rx = leftX + boxHalfW + 10;
      doc.rect(rx, metaStartY, boxHalfW, 108).stroke('#cbd5e1');
      doc
        .fillColor('#475569')
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .text('INVOICE & DISPATCH REFERENCE', rx + 8, metaStartY + 7);

      const metaRows: Array<[string, string]> = [
        ['Invoice No:', invoice.invoiceNumber],
        ['Invoice Date:', new Date(invDate).toLocaleString('en-IN')],
        ['Financial Year:', `FY 20${String(invoice.financialYear || '2627').slice(0, 2)}-20${String(invoice.financialYear || '2627').slice(2, 4)}`],
        ['Place of Supply:', buy.placeOfSupply || `${buy.stateName} (${buy.stateCode})`],
        ['Supply Type:', invoice.isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'],
        ['Reverse Charge:', invoice.reverseCharge ? 'Yes' : 'No'],
        ['Vehicle / Ref:', invoice.vehicleNumber || invoice.deliveryReference || 'Pending Dispatch'],
        ['Payment:', `${invoice.paymentMethod || 'N/A'}${invoice.paymentReference ? ` (${invoice.paymentReference})` : ''}`],
      ];
      let my = metaStartY + 20;
      for (const [k, v] of metaRows) {
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#475569').text(k, rx + 8, my, { width: 78 });
        doc.font('Helvetica').fontSize(7.5).fillColor('#0f172a').text(String(v || '-'), rx + 88, my, { width: boxHalfW - 96 });
        my += 10.5;
      }

      y += 116;

      doc.rect(leftX, y, boxHalfW, 76).stroke('#cbd5e1');
      doc.fillColor('#475569').font('Helvetica-Bold').fontSize(7.5).text('BILL TO (RECIPIENT)', leftX + 8, y + 6);
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(9).text(buy.businessName || buy.name || invoice.customerName, leftX + 8, y + 18, { width: boxHalfW - 16 });
      doc.font('Helvetica').fontSize(7.8).fillColor('#334155').text(buy.billingAddress || '-', leftX + 8, y + 31, { width: boxHalfW - 16, height: 24 });
      doc.text(
        `State: ${buy.stateName || '-'} (${buy.stateCode || '-'})   ${
          buy.gstin ? `Buyer GSTIN: ${buy.gstin}` : 'Unregistered Buyer'
        }`,
        leftX + 8,
        y + 59,
        { width: boxHalfW - 16 }
      );

      doc.rect(rx, y, boxHalfW, 76).stroke('#cbd5e1');
      doc.fillColor('#475569').font('Helvetica-Bold').fontSize(7.5).text('SHIP TO (JOB SITE / DELIVERY LOCATION)', rx + 8, y + 6);
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(9).text(buy.name || invoice.customerName, rx + 8, y + 18, { width: boxHalfW - 16 });
      doc.font('Helvetica').fontSize(7.8).fillColor('#334155').text(buy.shippingAddress || buy.billingAddress || '-', rx + 8, y + 31, { width: boxHalfW - 16, height: 24 });
      doc.text(
        `State: ${buy.stateName || '-'} (${buy.stateCode || '-'})  •  Ph: ${buy.phone || '-'}`,
        rx + 8,
        y + 59,
        { width: boxHalfW - 16 }
      );

      y += 86;

      const drawTableHeader = (topY: number) => {
        doc.rect(leftX, topY, pageW, 22).fillAndStroke('#f1f5f9', '#cbd5e1');
        doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(7);
        doc.text('#', leftX + 4, topY + 7, { width: 16 });
        doc.text('Material Description / SKU', leftX + 20, topY + 7, { width: 155 });
        doc.text('HSN', leftX + 177, topY + 7, { width: 38 });
        doc.text('Qty', leftX + 215, topY + 7, { width: 36, align: 'right' });
        doc.text('Rate', leftX + 253, topY + 7, { width: 46, align: 'right' });
        doc.text('Taxable', leftX + 301, topY + 7, { width: 52, align: 'right' });
        doc.text('GST%', leftX + 355, topY + 7, { width: 28, align: 'right' });
        doc.text(invoice.isInterState ? 'IGST' : 'CGST+SGST', leftX + 385, topY + 7, { width: 72, align: 'right' });
        doc.text('Total', leftX + 460, topY + 7, { width: 66, align: 'right' });
        return topY + 22;
      };

      y = drawTableHeader(y);

      const items = invoice.items || [];
      items.forEach((item, idx) => {
        if (y > doc.page.height - 170) {
          doc.addPage();
          y = 32;
          y = drawTableHeader(y);
        }
        const rowH = 28;
        doc.rect(leftX, y, pageW, rowH).fillAndStroke(idx % 2 === 0 ? '#ffffff' : '#f8fafc', '#e2e8f0');

        doc.fillColor('#0f172a').font('Helvetica').fontSize(7.3);
        doc.text(String(item.sNo || idx + 1), leftX + 4, y + 7, { width: 16 });
        doc.font('Helvetica-Bold').text(item.description, leftX + 20, y + 5, { width: 155, height: 11, ellipsis: true });
        doc
          .font('Helvetica')
          .fontSize(6.7)
          .fillColor('#64748b')
          .text(`SKU: ${item.sku || '-'}${item.discount > 0 ? ` • Disc: -${round2(item.discount)}` : ''}`, leftX + 20, y + 16, {
            width: 155,
            ellipsis: true,
          });

        doc.fillColor('#0f172a').fontSize(7.3);
        doc.text(item.hsnCode || '-', leftX + 177, y + 9, { width: 38 });
        doc.text(`${item.quantity} ${item.unit || ''}`, leftX + 215, y + 9, { width: 36, align: 'right' });
        doc.text(round2(item.rate).toFixed(2), leftX + 253, y + 9, { width: 46, align: 'right' });
        doc.text(round2(item.taxableValue).toFixed(2), leftX + 301, y + 9, { width: 52, align: 'right' });
        doc.text(`${item.gstRate}%`, leftX + 355, y + 9, { width: 28, align: 'right' });
        const taxColText = invoice.isInterState
          ? `${round2(item.igstAmount).toFixed(2)}`
          : `${round2(item.cgstAmount).toFixed(2)} + ${round2(item.sgstAmount).toFixed(2)}`;
        doc.text(taxColText, leftX + 385, y + 9, { width: 72, align: 'right' });
        doc.font('Helvetica-Bold').text(round2(item.total).toFixed(2), leftX + 460, y + 9, { width: 66, align: 'right' });

        y += rowH;
      });

      y += 10;
      if (y > doc.page.height - 170) {
        doc.addPage();
        y = 32;
      }

      const summaryLeftW = 290;
      const summaryRightX = leftX + summaryLeftW + 10;
      const summaryRightW = pageW - summaryLeftW - 10;

      doc.rect(leftX, y, summaryLeftW, 118).stroke('#cbd5e1');
      doc.fillColor('#475569').font('Helvetica-Bold').fontSize(7.5).text('AMOUNT CHARGEABLE (IN WORDS)', leftX + 8, y + 7);
      doc
        .fillColor('#0f172a')
        .font('Helvetica-Bold')
        .fontSize(8.2)
        .text(invoice.amountInWords || numberToIndianWords(invoice.totalAmount), leftX + 8, y + 19, {
          width: summaryLeftW - 16,
        });

      if (invoice.irn || invoice.ewayBillNumber) {
        doc
          .font('Helvetica')
          .fontSize(7.3)
          .fillColor('#334155')
          .text(
            `${invoice.irn ? `IRN: ${invoice.irn}` : ''} ${
              invoice.ewayBillNumber ? `E-Way Bill: ${invoice.ewayBillNumber}` : ''
            }`.trim(),
            leftX + 8,
            y + 52,
            { width: summaryLeftW - 16 }
          );
      }

      doc.font('Helvetica-Bold').fontSize(7.2).fillColor('#475569').text('DECLARATION & PLATFORM NOTICE', leftX + 8, y + 68);
      doc
        .font('Helvetica')
        .fontSize(6.8)
        .fillColor('#475569')
        .text(
          '1. We declare that this invoice shows the actual price of goods described and all particulars are true and correct.\n' +
            '2. BUILDORA 60 operates solely as an electronic commerce marketplace facilitator; the tax liability rests with the supplying vendor named above.',
          leftX + 8,
          y + 79,
          { width: summaryLeftW - 16 }
        );

      doc.rect(summaryRightX, y, summaryRightW, 118).stroke('#cbd5e1');
      const totalLines: Array<[string, number]> = [
        ['Taxable Subtotal', invoice.taxableAmount],
        ...(invoice.isInterState
          ? ([['IGST Total', invoice.igstAmount]] as Array<[string, number]>)
          : ([
              ['CGST Total', invoice.cgstAmount],
              ['SGST Total', invoice.sgstAmount],
            ] as Array<[string, number]>)),
      ];
      if ((invoice.deliveryCharges || 0) > 0) totalLines.push(['Delivery Charges', invoice.deliveryCharges || 0]);
      if ((invoice.loadingCharges || 0) > 0) totalLines.push(['Loading Charges', invoice.loadingCharges || 0]);
      if ((invoice.unloadingCharges || 0) > 0) totalLines.push(['Unloading Assistance', invoice.unloadingCharges || 0]);
      if ((invoice.roundOff || 0) !== 0) totalLines.push(['Round Off', invoice.roundOff || 0]);

      let ty = y + 8;
      for (const [label, amt] of totalLines) {
        doc.font('Helvetica').fontSize(7.8).fillColor('#334155').text(label, summaryRightX + 8, ty, { width: 120 });
        doc.font('Helvetica').fontSize(7.8).fillColor('#0f172a').text(formatInr(amt), summaryRightX + 128, ty, { width: summaryRightW - 136, align: 'right' });
        ty += 12;
      }

      doc.rect(summaryRightX, y + 92, summaryRightW, 26).fillAndStroke('#1e293b', '#1e293b');
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9.5).text('GRAND TOTAL', summaryRightX + 8, y + 100, { width: 95 });
      doc.font('Helvetica-Bold').fontSize(10).text(formatInr(invoice.totalAmount), summaryRightX + 105, y + 99, { width: summaryRightW - 113, align: 'right' });

      y += 128;
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#0f172a').text(`For ${sup.legalBusinessName || 'Authorized Seller'}`, leftX, y, { width: pageW, align: 'right' });
      doc.font('Helvetica').fontSize(7).fillColor('#64748b').text('Authorised Signatory (Digitally Generated GST Invoice)', leftX, y + 24, { width: pageW, align: 'right' });

      doc.end();
    });
  }

  async renderOrderSummaryPdfBuffer(
    masterOrder: Order & Record<string, any>,
    vendorSplits: any[],
    invoices: VendorInvoice[]
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 32,
        info: {
          Title: `Order Summary ${masterOrder.orderNumber}`,
          Author: 'BUILDORA 60',
        },
      });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(Buffer.from(c)));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageW = doc.page.width - 64;
      const leftX = 32;
      let y = 32;

      doc.rect(leftX, y, pageW, 50).fillAndStroke('#ea580c', '#ea580c');
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(15).text('BUILDORA 60 • ORDER SUMMARY', leftX + 14, y + 10);
      doc.font('Helvetica').fontSize(8).fillColor('#ffedd5').text('CONSOLIDATED CUSTOMER STATEMENT — NOT A GST TAX INVOICE', leftX + 14, y + 30);
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10).text(`Order #${masterOrder.orderNumber}`, leftX + 300, y + 11, { width: pageW - 314, align: 'right' });
      doc.font('Helvetica').fontSize(8).text(`Status: ${masterOrder.status}  |  Payment: ${masterOrder.paymentMethod} (${masterOrder.paymentStatus})`, leftX + 250, y + 29, { width: pageW - 264, align: 'right' });
      y += 62;

      const addr: any = masterOrder.deliveryAddress || {};
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(9.5).text('Customer & Job Site', leftX, y);
      y += 14;
      doc.font('Helvetica').fontSize(8.5).fillColor('#334155').text(`${masterOrder.customerName || addr.recipientName || 'Customer'}  •  Ph: ${masterOrder.customerPhone || addr.mobile || '-'}`, leftX, y);
      y += 12;
      doc.text([addr.building || addr.line1, addr.area, addr.city, addr.state, addr.pincode].filter(Boolean).join(', '), leftX, y);
      y += 22;

      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(9.5).text(`Supplier Fulfilment Splits (${vendorSplits.length || 1})`, leftX, y);
      y += 14;

      if (vendorSplits.length > 0) {
        for (const sp of vendorSplits) {
          const inv = invoices.find((i) => i.vendorOrderId === sp.vendorOrderId || i.vendorId === sp.vendorId);
          doc.rect(leftX, y, pageW, 24).fillAndStroke('#f8fafc', '#cbd5e1');
          doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(8).text(sp.vendorName || sp.vendorId, leftX + 8, y + 7, { width: 180 });
          doc.font('Helvetica').fontSize(8).text(`Stage: ${sp.status}`, leftX + 195, y + 7, { width: 120 });
          doc.text(inv ? `Tax Invoice: ${inv.invoiceNumber}` : 'Tax Invoice pending dispatch', leftX + 320, y + 7, { width: 200, align: 'right' });
          y += 28;
        }
      }

      y += 8;
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(9.5).text('Ordered Construction Materials', leftX, y);
      y += 14;
      for (const item of (masterOrder.items || []) as any[]) {
        if (y > doc.page.height - 90) {
          doc.addPage();
          y = 32;
        }
        doc.font('Helvetica').fontSize(8).fillColor('#1e293b').text(`• ${item.name} (${item.sku || 'SKU'})  ×  ${item.quantity} ${item.unit || 'Units'}`, leftX, y, { width: 390 });
        doc.font('Helvetica-Bold').text(formatInr(Number(item.totalPrice ?? (item.price || item.unitPrice || 0) * (item.quantity || 1))), leftX + 400, y, { width: pageW - 400, align: 'right' });
        y += 14;
      }

      y += 14;
      const summaryLines: Array<[string, number]> = [
        ['Material Subtotal', Number(masterOrder.subtotal || 0)],
        ['GST Total (Across Suppliers)', Number(masterOrder.gstTotal || 0)],
        ['Delivery Fee', Number(masterOrder.deliveryFee || 0)],
        ['Unloading Fee', Number(masterOrder.unloadingFee || 0)],
        ['Coupon / Discount', -Math.abs(Number(masterOrder.discountTotal || 0))],
        ['Wallet Used', -Math.abs(Number(masterOrder.walletUsed || 0))],
        ['Grand Total / Payable', Number(masterOrder.grandTotal ?? masterOrder.payableAmount ?? masterOrder.totalAmount ?? 0)],
      ];
      for (const [k, v] of summaryLines) {
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#0f172a').text(k, leftX + 280, y, { width: 150 });
        doc.text(formatInr(v), leftX + 430, y, { width: pageW - 430, align: 'right' });
        y += 14;
      }

      doc.end();
    });
  }
}

export const gstInvoiceService = new GstInvoiceService();
