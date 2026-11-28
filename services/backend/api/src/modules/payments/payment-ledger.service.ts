import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Order } from '@buildora/types';
import { dbStore } from '../../database/store';
import {
  PlatformOrderModel,
  PlatformPaymentModel,
  PlatformWalletTxnModel,
  platformPersistenceService,
} from '../../database/platform-persistence.service';
import { companyAdminDataService } from '../company-admin/services/company-admin-data.service';
import { platformNotificationService } from '../notifications/platform-notification.service';
import { realtimeBus } from '../realtime/realtime-bus';
import { DEFAULT_TENANT_ID, vendorOrders } from '../vendors/controllers/vendor.controller';
import { orderSyncService } from '../orders/services/order-sync.service';
import { validateAndPriceCheckout, CheckoutPricingInput } from '../checkout/checkout-pricing.util';

export type LedgerPaymentStatus = 'CREATED' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
export type LedgerPaymentMethod = 'COD' | 'UPI' | 'CARD' | 'NETBANKING' | 'WALLET' | 'PAY_LATER' | 'RAZORPAY';

export function normalizeRazorpayPaymentMethod(rawMethod?: string): LedgerPaymentMethod {
  const clean = String(rawMethod || '').trim().toLowerCase();
  if (clean === 'upi') return 'UPI';
  if (clean === 'card') return 'CARD';
  if (clean === 'netbanking') return 'NETBANKING';
  if (clean === 'wallet') return 'WALLET';
  if (clean === 'paylater' || clean === 'pay_later') return 'PAY_LATER';
  if (clean === 'cod') return 'COD';
  return 'RAZORPAY';
}

export interface PaymentRecord {
  id: string;
  tenantId: string;
  customerId: string;
  orderId: string;
  orderNumber: string;
  paymentMethod: LedgerPaymentMethod;
  verifiedGatewayMethod?: string;
  paymentChannelDetails?: string;
  status: LedgerPaymentStatus;
  amount: number;
  amountInPaise: number;
  currency: string;
  receipt?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignatureVerified?: boolean;
  failureReason?: string;
  processedWebhookEventIds: string[];
  createdAt: string;
  paidAt?: string;
  verifiedAt?: string;
  updatedAt: string;
}

export const idempotencyOrderCache = new Map<string, any>();

export function mapMethodToLedger(method?: string): LedgerPaymentMethod {
  const upper = String(method || '').toUpperCase();
  if (upper === 'COD') return 'COD';
  if (upper === 'UPI') return 'UPI';
  if (upper === 'CARD') return 'CARD';
  if (upper === 'NETBANKING') return 'NETBANKING';
  if (upper === 'WALLET') return 'WALLET';
  if (upper === 'PAY_LATER' || upper === 'PAYLATER') return 'PAY_LATER';
  return 'RAZORPAY';
}

export async function savePaymentRecord(payment: PaymentRecord) {
  const existingIdx = dbStore.payments.findIndex(
    (p: any) => p.id === payment.id || (payment.razorpayOrderId && p.razorpayOrderId === payment.razorpayOrderId)
  );
  if (existingIdx >= 0) {
    dbStore.payments[existingIdx] = payment;
  } else {
    dbStore.payments.unshift(payment);
  }
  await platformPersistenceService.upsert(PlatformPaymentModel, payment);
  return payment;
}

export function findPaymentRecord(query: {
  paymentId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  orderId?: string;
  orderNumber?: string;
}): PaymentRecord | undefined {
  return dbStore.payments.find((p: PaymentRecord) => {
    if (query.paymentId && p.id === query.paymentId) return true;
    if (query.razorpayOrderId && p.razorpayOrderId === query.razorpayOrderId) return true;
    if (query.razorpayPaymentId && p.razorpayPaymentId === query.razorpayPaymentId) return true;
    if (query.orderId && p.orderId === query.orderId) return true;
    if (query.orderNumber && p.orderNumber === query.orderNumber) return true;
    return false;
  });
}

/**
 * Authoritatively validates cart items, recalculates pricing server-side,
 * enforces COD/stock/address rules, persists order + payment ledger records,
 * and prevents duplicates via idempotency keys.
 */
export async function createAuthoritativeOrder(params: {
  body: CheckoutPricingInput & Record<string, any>;
  customerId: string;
  customerPhone?: string;
  customerName?: string;
  customerEmail?: string;
  tenantId?: string;
  idempotencyKey?: string;
  paymentMethod: string;
  reserveOnly: boolean;
}) {
  const tenantId = params.tenantId || DEFAULT_TENANT_ID;
  const customerId = params.customerId || 'cust-guest';
  const customerPhone = params.customerPhone || params.body.deliveryAddress?.mobile || '';

  // 0. Check customer account suspension
  orderSyncService.assertCustomerNotSuspended(customerId, customerPhone);

  // 1. Idempotency check
  if (params.idempotencyKey && idempotencyOrderCache.has(params.idempotencyKey)) {
    const cached = idempotencyOrderCache.get(params.idempotencyKey);
    const existingPay = findPaymentRecord({ orderId: cached.id });
    return {
      duplicatePrevented: true,
      order: cached,
      payment: existingPay,
    };
  }

  // 2. Authoritative server-side price, stock, serviceability & coupon validation
  const priced = validateAndPriceCheckout({ ...params.body, customerId }, tenantId);
  if (!priced.success) {
    throw new BadRequestException(priced.errors.join(' '));
  }

  const finalPayable = Number(priced.payableAmount ?? priced.summary.grandTotal ?? 0);
  const tenantCfg = priced.tenantCfg;

  // 3. Enforce COD limits if COD
  const ledgerMethod = mapMethodToLedger(params.paymentMethod);
  if (ledgerMethod === 'COD') {
    if (tenantCfg?.paymentConfig?.codEnabled === false) {
      throw new BadRequestException('Cash on Delivery is currently disabled by Company Admin.');
    }
    const maxCod = Number(tenantCfg?.paymentConfig?.codMaxOrderValue ?? 50000);
    if (maxCod > 0 && finalPayable > maxCod) {
      throw new BadRequestException(
        `Cash on Delivery is available for orders up to ₹${maxCod.toLocaleString('en-IN')} only. Please choose Pay Online.`
      );
    }
  }

  const id = 'ord-' + Date.now() + '-' + Math.floor(100 + Math.random() * 900);
  const orderNumber = 'BLD-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
  const createdAt = new Date().toISOString();
  const reserveOnly = ledgerMethod === 'COD' ? false : Boolean(params.reserveOnly);

  // 4. Atomic stock reservation/deduction
  await orderSyncService.reserveOrDeductItems(priced.validatedItems, reserveOnly, orderNumber);

  // 5. Deduct wallet if applicable
  const walletUsed = Number(priced.summary.walletUsed || 0);
  if (walletUsed > 0) {
    const custRec = companyAdminDataService.customers.get(customerId);
    const currentBal = custRec ? Number(custRec.walletBalance || 0) : Number(dbStore.walletBalance || 0);
    if (walletUsed > currentBal) {
      await orderSyncService.releaseOrderStock({ items: priced.validatedItems, orderNumber, stockReservedOnly: reserveOnly }, 'Wallet check failed');
      throw new BadRequestException('Insufficient Buildora Wallet balance.');
    }
    if (custRec) custRec.walletBalance = Math.max(0, Number(custRec.walletBalance || 0) - walletUsed);
    dbStore.walletBalance = Math.max(0, Number(dbStore.walletBalance || 0) - walletUsed);
    const tx: any = {
      id: 'tx-' + Date.now(),
      customerId,
      referenceNumber: 'WTX-' + Date.now().toString().slice(-6),
      type: 'DEBIT',
      amount: walletUsed,
      category: 'CHECKOUT',
      status: 'COMPLETED',
      description: `Applied to Order #${orderNumber}`,
      orderId: orderNumber,
      createdAt,
      balanceAfter: custRec ? custRec.walletBalance : dbStore.walletBalance,
    };
    dbStore.walletTransactions.unshift(tx);
    await platformPersistenceService.upsert(PlatformWalletTxnModel, tx);
  }

  const deliverySpeed = params.body.deliverySpeed || 'ASAP_60';
  const estimatedDeliveryTime =
    params.body.estimatedDeliveryTime ||
    (deliverySpeed === 'ASAP_60' ? 'Within 60 minutes' : 'Tomorrow 8:00 AM - 11:00 AM');

  const paymentStatus = ledgerMethod === 'COD' ? 'PENDING' : 'PENDING';
  const newOrder: Order & Record<string, any> = {
    id,
    orderNumber,
    tenantId,
    customerId,
    customerName: params.customerName || params.body.deliveryAddress?.recipientName || 'Buildora Customer',
    customerPhone,
    customerEmail: params.customerEmail,
    createdAt,
    updatedAt: createdAt,
    items: priced.validatedItems,
    deliveryAddress: params.body.deliveryAddress as any,
    deliveryOption: deliverySpeed,
    estimatedDeliveryTime,
    paymentMethod: (ledgerMethod === 'COD' ? 'COD' : 'RAZORPAY') as any,
    paymentStatus: paymentStatus as any,
    stockReservedOnly: reserveOnly,
    subtotal: priced.summary.subtotal,
    itemDiscount: priced.summary.itemDiscount,
    couponDiscount: priced.summary.couponDiscount,
    couponCode: priced.coupon?.code || undefined,
    gstTotal: priced.summary.gstTotal,
    deliveryFee: priced.summary.deliveryFee,
    handlingFee: priced.summary.handlingFee,
    handlingBreakdown: priced.summary.handlingBreakdown,
    unloadingFee: priced.summary.unloadingFee,
    unloadingOptions: params.body.unloadingOptions,
    walletUsed,
    grandTotal: priced.summary.grandTotal,
    payableAmount: finalPayable,
    isBusinessOrder: Boolean(params.body.isBusinessOrder),
    gstin: params.body.isBusinessOrder && params.body.gstin ? String(params.body.gstin).trim().toUpperCase() : undefined,
    companyName: params.body.isBusinessOrder && params.body.companyName ? String(params.body.companyName).trim() : undefined,
    status: 'ORDER_PLACED',
    timeline: [
      {
        status: 'ORDER_PLACED',
        title: 'Order Placed',
        description:
          ledgerMethod === 'COD'
            ? 'Pay on Delivery (COD) order confirmed.'
            : 'Order created and stock reserved. Awaiting Razorpay online payment verification.',
        timestamp: createdAt,
        completed: true,
      },
      {
        status: 'CONFIRMED',
        title: 'Vendor Dispatch Allocation',
        description: 'Routed to supplying vendor depot(s).',
        timestamp: createdAt,
        completed: ledgerMethod === 'COD',
      },
    ],
    deliveryPartner: (() => {
      const pin = params.body.deliveryAddress?.pincode || '';
      const partners = Array.from(companyAdminDataService.deliveryPartners.values()).filter(
        (dp) => dp.tenantId === tenantId && dp.status === 'ACTIVE'
      );
      const matchedPartner =
        partners.find((dp) => dp.servicePincodes?.includes(pin)) || partners[0];
      return matchedPartner
        ? {
            name: matchedPartner.name,
            phone: matchedPartner.phone,
            vehicleNumber: matchedPartner.vehicleTypes?.[0] || 'Dispatch Fleet',
          }
        : undefined;
    })(),
  };

  dbStore.orders.unshift(newOrder);
  await orderSyncService.splitAndCreateVendorOrders(newOrder, tenantId);
  await platformPersistenceService.upsert(PlatformOrderModel, newOrder);

  // 6. Create Payment Ledger Record
  const paymentRecord: PaymentRecord = {
    id: 'pay_' + Date.now() + '_' + Math.floor(100 + Math.random() * 900),
    tenantId,
    customerId,
    orderId: id,
    orderNumber,
    paymentMethod: ledgerMethod,
    status: ledgerMethod === 'COD' ? 'PENDING' : 'CREATED',
    amount: finalPayable,
    amountInPaise: Math.round(finalPayable * 100),
    currency: 'INR',
    receipt: 'rcpt_' + orderNumber,
    processedWebhookEventIds: [],
    createdAt,
    updatedAt: createdAt,
  };
  await savePaymentRecord(paymentRecord);

  // 7. For COD orders, immediately update customer KPIs and notify Admin/Customer
  if (ledgerMethod === 'COD') {
    const existingCustomer = companyAdminDataService.customers.get(customerId);
    if (existingCustomer) {
      existingCustomer.totalOrders = (existingCustomer.totalOrders || 0) + 1;
      existingCustomer.totalSpent = (existingCustomer.totalSpent || 0) + finalPayable;
      (existingCustomer as any).lastOrderAt = createdAt;
    }

    await platformNotificationService.dispatch({
      tenantId,
      recipientRole: 'ADMIN',
      recipientId: 'TENANT_ADMIN',
      type: 'ORDER',
      title: `New COD Order #${orderNumber}`,
      message: `${newOrder.customerName} placed a Pay On Delivery order worth ₹${finalPayable.toLocaleString('en-IN')}.`,
      severity: 'INFO',
      actionUrl: '/orders',
      metadata: { orderId: id, orderNumber },
    });
    if (customerId !== 'cust-guest') {
      await platformNotificationService.dispatch({
        tenantId,
        recipientRole: 'CUSTOMER',
        recipientId: customerId,
        type: 'ORDER',
        title: `Order Placed #${orderNumber}`,
        message: `Your Pay On Delivery order for ₹${finalPayable.toLocaleString('en-IN')} has been confirmed.`,
        severity: 'SUCCESS',
        actionUrl: `/orders/${orderNumber}`,
        metadata: { orderId: id, orderNumber },
      });
      realtimeBus.emitToCustomer(customerId, 'order.created', { order: newOrder }, tenantId);
    }
    realtimeBus.emitToAdmin('order.created', { order: newOrder }, tenantId);
  }

  if (params.idempotencyKey) {
    idempotencyOrderCache.set(params.idempotencyKey, newOrder);
  }

  return {
    duplicatePrevented: false,
    order: newOrder,
    payment: paymentRecord,
  };
}

export async function finalizeSuccessfulOnlinePayment(params: {
  order: any;
  payment?: PaymentRecord;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  verifiedBy: 'CALLBACK_SIGNATURE' | 'WEBHOOK' | 'RECONCILIATION';
  verifiedGatewayMethod?: string;
  paymentChannelDetails?: string;
}) {
  const { order, razorpayOrderId, razorpayPaymentId } = params;
  const nowIso = new Date().toISOString();
  const resolvedMethod = params.verifiedGatewayMethod
    ? normalizeRazorpayPaymentMethod(params.verifiedGatewayMethod)
    : params.payment?.paymentMethod && params.payment.paymentMethod !== 'RAZORPAY'
      ? params.payment.paymentMethod
      : 'RAZORPAY';

  // Check idempotency: already paid
  if (
    order.paymentStatus === 'PAID' &&
    order.paymentId === razorpayPaymentId &&
    params.payment?.status === 'SUCCESS'
  ) {
    return { alreadyFinalized: true, order, payment: params.payment };
  }

  // If stock had been temporarily released during a cancelled/failed attempt and now captured/retried
  if (order.stockReleased && !order.stockReservedOnly) {
    await orderSyncService.reserveOrDeductItems(order.items, true, order.orderNumber);
    order.stockReleased = false;
    order.stockReservedOnly = true;
  }

  await orderSyncService.commitReservedOrderStock(order);

  order.paymentStatus = 'PAID';
  order.paymentMethod = resolvedMethod;
  order.paymentChannelDetails = params.paymentChannelDetails || order.paymentChannelDetails;
  order.paymentId = razorpayPaymentId;
  order.razorpayOrderId = razorpayOrderId;
  order.razorpayPaymentId = razorpayPaymentId;
  order.paidAt = order.paidAt || nowIso;
  order.updatedAt = nowIso;
  if (order.status === 'CANCELLED') {
    order.status = 'ORDER_PLACED';
  }
  order.timeline = Array.isArray(order.timeline) ? order.timeline : [];
  if (!order.timeline.some((t: any) => t.title === 'Payment Verified & Stock Committed')) {
    order.timeline.push({
      status: 'CONFIRMED',
      title: 'Payment Verified & Stock Committed',
      description: `Verified ${resolvedMethod} payment via Razorpay Ref: ${razorpayPaymentId} (${params.verifiedBy})`,
      timestamp: nowIso,
      completed: true,
    });
  }
  const confStep = order.timeline.find((t: any) => t.status === 'CONFIRMED');
  if (confStep) confStep.completed = true;

  await platformPersistenceService.upsert(PlatformOrderModel, order);

  const paymentRecord: PaymentRecord = params.payment || findPaymentRecord({ razorpayOrderId, orderId: order.id }) || {
    id: 'pay_' + Date.now(),
    tenantId: order.tenantId || DEFAULT_TENANT_ID,
    customerId: order.customerId || 'cust-guest',
    orderId: order.id,
    orderNumber: order.orderNumber,
    paymentMethod: resolvedMethod,
    status: 'SUCCESS',
    amount: Number(order.payableAmount || order.grandTotal || 0),
    amountInPaise: Math.round(Number(order.payableAmount || order.grandTotal || 0) * 100),
    currency: 'INR',
    razorpayOrderId,
    razorpayPaymentId,
    processedWebhookEventIds: [],
    createdAt: order.createdAt || nowIso,
    updatedAt: nowIso,
  };

  paymentRecord.paymentMethod = resolvedMethod;
  if (params.verifiedGatewayMethod) paymentRecord.verifiedGatewayMethod = params.verifiedGatewayMethod;
  if (params.paymentChannelDetails) paymentRecord.paymentChannelDetails = params.paymentChannelDetails;
  paymentRecord.status = 'SUCCESS';
  paymentRecord.razorpayOrderId = razorpayOrderId;
  paymentRecord.razorpayPaymentId = razorpayPaymentId;
  paymentRecord.razorpaySignatureVerified = true;
  paymentRecord.paidAt = paymentRecord.paidAt || nowIso;
  paymentRecord.verifiedAt = nowIso;
  paymentRecord.updatedAt = nowIso;
  paymentRecord.failureReason = undefined;
  await savePaymentRecord(paymentRecord);

  // Update customer KPI once on payment success
  if (!order.customerKpiCounted) {
    order.customerKpiCounted = true;
    const custRec = order.customerId ? companyAdminDataService.customers.get(order.customerId) : undefined;
    if (custRec) {
      custRec.totalOrders = (custRec.totalOrders || 0) + 1;
      custRec.totalSpent = (custRec.totalSpent || 0) + Number(order.payableAmount || order.grandTotal || 0);
      (custRec as any).lastOrderAt = nowIso;
    }
    await platformPersistenceService.upsert(PlatformOrderModel, order);
  }

  const tenantId = order.tenantId || DEFAULT_TENANT_ID;
  for (const vo of vendorOrders) {
    if (vo.orderNumber === order.orderNumber) {
      (vo as any).paymentStatus = 'PAID';
      (vo as any).paymentMethod = resolvedMethod;
      if (vo.status === 'CANCELLED') vo.status = 'NEW';
      await platformPersistenceService.upsert(PlatformOrderModel, vo);
      realtimeBus.emitToVendor(vo.vendorId, 'payment.status.updated', {
        orderNumber: order.orderNumber,
        paymentStatus: 'PAID',
        paymentMethod: resolvedMethod,
        paymentId: razorpayPaymentId,
      }, tenantId);
    }
  }

  await platformNotificationService.dispatch({
    tenantId,
    recipientRole: 'ADMIN',
    recipientId: 'TENANT_ADMIN',
    type: 'ORDER',
    title: `Online Payment Confirmed #${order.orderNumber}`,
    message: `Razorpay payment ${razorpayPaymentId} verified for ₹${Number(order.payableAmount || order.grandTotal || 0).toLocaleString('en-IN')}.`,
    severity: 'SUCCESS',
    actionUrl: '/orders',
    metadata: { orderId: order.id, orderNumber: order.orderNumber, razorpayPaymentId },
  });

  if (order.customerId && order.customerId !== 'cust-guest') {
    await platformNotificationService.dispatch({
      tenantId,
      recipientRole: 'CUSTOMER',
      recipientId: order.customerId,
      type: 'PAYMENT',
      title: `Payment Successful #${order.orderNumber}`,
      message: `Your Razorpay payment (${razorpayPaymentId}) was verified and your order is confirmed.`,
      severity: 'SUCCESS',
      actionUrl: `/orders/${order.orderNumber}`,
      metadata: { orderId: order.id, orderNumber: order.orderNumber, razorpayPaymentId },
    });
    realtimeBus.emitToCustomer(order.customerId, 'payment.status.updated', {
      orderNumber: order.orderNumber,
      paymentStatus: 'PAID',
      paymentId: razorpayPaymentId,
    }, tenantId);
    realtimeBus.emitToCustomer(order.customerId, 'order.created', { order }, tenantId);
  }
  realtimeBus.emitToAdmin('payment.status.updated', {
    orderNumber: order.orderNumber,
    paymentStatus: 'PAID',
    paymentId: razorpayPaymentId,
  }, tenantId);

  return { alreadyFinalized: false, order, payment: paymentRecord };
}
