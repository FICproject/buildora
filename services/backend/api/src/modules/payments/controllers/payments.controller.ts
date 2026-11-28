import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Headers,
  Req,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { dbStore } from '../../../database/store';
import {
  PlatformOrderModel,
  PlatformPaymentModel,
  platformPersistenceService,
} from '../../../database/platform-persistence.service';
import { requireCustomer, verifyCustomerToken } from '../../../common/customer-auth.util';
import { platformNotificationService } from '../../notifications/platform-notification.service';
import { realtimeBus } from '../../realtime/realtime-bus';
import { DEFAULT_TENANT_ID, vendorOrders } from '../../vendors/controllers/vendor.controller';
import { orderSyncService } from '../../orders/services/order-sync.service';
import {
  PaymentRecord,
  createAuthoritativeOrder,
  finalizeSuccessfulOnlinePayment,
  findPaymentRecord,
  idempotencyOrderCache,
  savePaymentRecord,
} from '../payment-ledger.service';

const processedWebhookEvents = new Set<string>();
const methodsCapabilityCache = new Map<
  string,
  {
    fetchedAt: number;
    enabledMethods: {
      upi: boolean;
      upiIntent: boolean;
      card: boolean;
      netbanking: boolean;
      wallet: boolean;
      paylater: boolean;
    };
  }
>();

function timingSafeHexEqual(a: string, b: string): boolean {
  const cleanA = String(a || '').trim().toLowerCase();
  const cleanB = String(b || '').trim().toLowerCase();
  if (!cleanA || !cleanB || cleanA.length !== cleanB.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(cleanA, 'utf8'), Buffer.from(cleanB, 'utf8'));
  } catch {
    return false;
  }
}

function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim() || '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim() || '';
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim() || '';
  const isValidKeyFormat = keyId.startsWith('rzp_test_') || keyId.startsWith('rzp_live_');
  const configured = Boolean(keyId && keySecret && isValidKeyFormat);
  const mode = keyId.startsWith('rzp_live_') ? 'LIVE' : keyId.startsWith('rzp_test_') ? 'TEST' : 'UNCONFIGURED';
  return { keyId, keySecret, webhookSecret, configured, mode };
}

function maskVpa(vpa?: string): string {
  const clean = String(vpa || '').trim();
  const atIdx = clean.indexOf('@');
  if (atIdx <= 1) return clean;
  const local = clean.slice(0, atIdx);
  const domain = clean.slice(atIdx);
  const visible = local.slice(0, 2);
  return `${visible}${'•'.repeat(Math.max(2, Math.min(4, local.length - 2)))}${domain}`;
}

function formatChannelDetails(entity: any): string | undefined {
  if (!entity || !entity.method) return undefined;
  const m = String(entity.method).toLowerCase();
  if (m === 'upi') {
    return entity.vpa ? `UPI (${maskVpa(entity.vpa)})` : 'UPI';
  }
  if (m === 'card') {
    const net = entity.card?.network || '';
    const last4 = entity.card?.last4 ? `•••• ${entity.card.last4}` : '';
    return [net, entity.card?.type || 'Card', last4].filter(Boolean).join(' ').trim();
  }
  if (m === 'netbanking') {
    return entity.bank ? `Netbanking (${entity.bank})` : 'Netbanking';
  }
  if (m === 'wallet') {
    return entity.wallet ? `Wallet (${entity.wallet})` : 'Wallet';
  }
  if (m === 'paylater') {
    return entity.wallet ? `Pay Later (${entity.wallet})` : 'Pay Later';
  }
  return String(entity.method).toUpperCase();
}

async function fetchRazorpayEnabledMethods(keyId: string) {
  const cached = methodsCapabilityCache.get(keyId);
  if (cached && Date.now() - cached.fetchedAt < 60_000) {
    return cached.enabledMethods;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`https://api.razorpay.com/v1/methods?key_id=${encodeURIComponent(keyId)}`, {
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const j = (await res.json()) as any;
    const enabledMethods = {
      upi: Boolean(j.upi),
      upiIntent: Boolean(j.upi_intent),
      card: Boolean(j.card),
      netbanking: Boolean(j.netbanking),
      wallet: Boolean(j.wallet),
      paylater: Boolean(j.paylater),
    };
    methodsCapabilityCache.set(keyId, { fetchedAt: Date.now(), enabledMethods });
    return enabledMethods;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchUpstreamRazorpayPayment(params: {
  keyId: string;
  keySecret: string;
  paymentId: string;
}) {
  const authHeader = 'Basic ' + Buffer.from(`${params.keyId}:${params.keySecret}`).toString('base64');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(
      `https://api.razorpay.com/v1/payments/${encodeURIComponent(params.paymentId)}`,
      {
        headers: { Authorization: authHeader },
        signal: controller.signal,
      }
    );
    if (!res.ok) return null;
    return (await res.json()) as any;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function createUpstreamRazorpayOrder(params: {
  keyId: string;
  keySecret: string;
  amountInPaise: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}) {
  const authHeader = 'Basic ' + Buffer.from(`${params.keyId}:${params.keySecret}`).toString('base64');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  let rzpRes: Response;
  try {
    rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        amount: params.amountInPaise,
        currency: params.currency,
        receipt: params.receipt,
        notes: params.notes || {},
      }),
      signal: controller.signal,
    });
  } catch (err: any) {
    throw new BadRequestException({
      code: 'RAZORPAY_UNREACHABLE',
      message:
        err?.name === 'AbortError'
          ? 'Razorpay gateway timed out while creating payment order. Please try again.'
          : 'Unable to reach Razorpay payment gateway. Check internet connectivity and retry.',
    });
  } finally {
    clearTimeout(timer);
  }

  if (!rzpRes.ok) {
    let errDescription = 'Failed to create Razorpay order.';
    try {
      const errJson = (await rzpRes.json()) as { error?: { description?: string; code?: string } };
      if (errJson?.error?.description) {
        errDescription = errJson.error.description;
      }
    } catch {
      // ignore non-json upstream body
    }

    if (rzpRes.status === 401) {
      throw new BadRequestException({
        code: 'RAZORPAY_AUTH_FAILED',
        message:
          'Razorpay Test Mode credentials rejected (Authentication failed). Update RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in services/backend/api/.env with active Test Mode keys and restart the backend.',
      });
    }

    throw new BadRequestException({
      code: 'RAZORPAY_ORDER_FAILED',
      message: `Razorpay error: ${errDescription}`,
    });
  }

  return (await rzpRes.json()) as {
    id: string;
    amount: number;
    currency: string;
    receipt?: string;
    status: string;
  };
}

@Controller('api/v1/payments')
export class PaymentsController implements OnModuleInit {
  private readonly logger = new Logger(PaymentsController.name);

  async onModuleInit() {
    try {
      const persisted = await platformPersistenceService.loadAll<PaymentRecord>(PlatformPaymentModel);
      if (persisted.length > 0) {
        const seen = new Set(dbStore.payments.map((p: any) => p.id));
        for (const row of persisted) {
          if (!seen.has(row.id)) {
            dbStore.payments.push(row);
          }
          for (const evId of row.processedWebhookEventIds || []) {
            processedWebhookEvents.add(evId);
          }
        }
      }
    } catch (err: any) {
      this.logger.warn(`Failed to load persisted payments: ${err.message}`);
    }
  }

  @Get('razorpay/config')
  async getRazorpayConfig() {
    const { keyId, configured, mode } = getRazorpayCredentials();
    const enabledMethods = configured ? await fetchRazorpayEnabledMethods(keyId) : null;
    const maskedKeyId = configured ? `${keyId.slice(0, 10)}••••${keyId.slice(-4)}` : null;

    const upiUnavailableReason =
      enabledMethods && enabledMethods.upi === false
        ? 'UPI is currently disabled (upi: false) on this Razorpay merchant key. Complete basic KYC/business profile or enable UPI under Razorpay Dashboard -> Account & Settings -> Payment Methods.'
        : null;

    return {
      success: true,
      data: {
        configured,
        mode,
        keyId: configured ? keyId : null,
        maskedKeyId,
        enabledMethods: enabledMethods || {
          upi: false,
          upiIntent: false,
          card: configured,
          netbanking: configured,
          wallet: configured,
          paylater: configured,
        },
        upiUnavailableReason,
        message: configured
          ? `Razorpay ${mode === 'TEST' ? 'Test Mode' : 'Live Mode'} configured.`
          : 'Razorpay credentials missing or invalid. Configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in services/backend/api/.env.',
      },
    };
  }

  @Post('razorpay/order')
  async createRazorpayOrder(
    @Body()
    body: {
      buildoraOrderId?: string;
      items?: Array<{ productId: string; variantId?: string; quantity: number }>;
      couponCode?: string | null;
      deliverySpeed?: 'ASAP_60' | 'EXPRESS_90' | 'SCHEDULED' | 'NEXT_DAY' | 'STANDARD';
      deliveryAddress?: any;
      isBusinessOrder?: boolean;
      gstin?: string;
      companyName?: string;
      unloadingOptions?: any;
      walletBalanceToUse?: number;
      customerEmail?: string;
      paymentMethod?: string;
      receipt?: string;
      idempotencyKey?: string;
    },
    @Headers('authorization') authHeader?: string,
    @Headers('idempotency-key') idempotencyHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string
  ) {
    const creds = getRazorpayCredentials();
    if (!creds.configured) {
      throw new BadRequestException({
        code: 'RAZORPAY_CONFIG_INVALID',
        message:
          'Razorpay payment gateway is not configured on the server. Configure RAZORPAY_KEY_ID (rzp_test_...) and RAZORPAY_KEY_SECRET in services/backend/api/.env and restart the backend.',
      });
    }

    const cust = requireCustomer(authHeader);
    const tenantId = headerTenantId || cust.tenantId || DEFAULT_TENANT_ID;
    const idemKey = idempotencyHeader || body.idempotencyKey;

    // Flow A: Retry payment for an existing pending Buildora Order (never create duplicate order)
    if (body.buildoraOrderId) {
      const needle = String(body.buildoraOrderId).trim().toLowerCase();
      const order = dbStore.orders.find(
        (o) => o.id.toLowerCase() === needle || o.orderNumber.toLowerCase() === needle
      ) as any;
      if (!order) {
        throw new NotFoundException(`Order ${body.buildoraOrderId} not found.`);
      }
      const isSeedDemo = cust.sub === 'cust-9876543210' || cust.sub === 'cust-demo-1';
      if (order.customerId ? order.customerId !== cust.sub : !isSeedDemo) {
        throw new ForbiddenException('You do not have permission to pay for another customer order.');
      }
      if ((order.tenantId || DEFAULT_TENANT_ID) !== tenantId) {
        throw new ForbiddenException('Tenant mismatch for payment order.');
      }

      const existingPay = findPaymentRecord({ orderId: order.id, orderNumber: order.orderNumber });
      if (order.paymentStatus === 'PAID' || existingPay?.status === 'SUCCESS') {
        throw new BadRequestException('This order has already been paid.');
      }

      if (order.stockReleased && !order.stockReservedOnly) {
        await orderSyncService.reserveOrDeductItems(order.items, true, order.orderNumber);
        order.stockReleased = false;
        order.stockReservedOnly = true;
      }

      const amount = Number(order.payableAmount ?? order.grandTotal ?? 0);
      if (amount <= 0) {
        throw new BadRequestException('Order payable amount must be greater than zero.');
      }
      const amountInPaise = Math.round(amount * 100);
      const receipt = (body.receipt || `rcpt_${order.orderNumber}_${Date.now().toString().slice(-4)}`).slice(0, 40);

      const rzpOrder = await createUpstreamRazorpayOrder({
        keyId: creds.keyId,
        keySecret: creds.keySecret,
        amountInPaise,
        currency: 'INR',
        receipt,
        notes: {
          buildoraOrderId: order.id,
          orderNumber: order.orderNumber,
          tenantId,
          customerId: order.customerId || cust?.sub || 'cust-guest',
        },
      });

      const nowIso = new Date().toISOString();
      order.razorpayOrderId = rzpOrder.id;
      order.paymentStatus = 'PENDING';
      order.updatedAt = nowIso;
      if (order.status === 'CANCELLED') order.status = 'ORDER_PLACED';
      await platformPersistenceService.upsert(PlatformOrderModel, order);

      const retryPayment: PaymentRecord = {
        id: 'pay_' + Date.now() + '_' + Math.floor(100 + Math.random() * 900),
        tenantId,
        customerId: order.customerId || cust?.sub || 'cust-guest',
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentMethod: 'RAZORPAY',
        status: 'CREATED',
        amount,
        amountInPaise: rzpOrder.amount,
        currency: rzpOrder.currency,
        receipt: rzpOrder.receipt || receipt,
        razorpayOrderId: rzpOrder.id,
        processedWebhookEventIds: existingPay?.processedWebhookEventIds || [],
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      await savePaymentRecord(retryPayment);

      return {
        success: true,
        data: {
          id: rzpOrder.id,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          receipt: rzpOrder.receipt || receipt,
          status: rzpOrder.status,
          keyId: creds.keyId,
          buildoraOrderId: order.id,
          orderNumber: order.orderNumber,
          order,
        },
      };
    }

    // Flow B: Create authoritative pending order from cart items + Razorpay order
    if (!Array.isArray(body.items) || body.items.length === 0) {
      throw new BadRequestException('Cart items or an existing buildoraOrderId are required.');
    }

    if (idemKey && idempotencyOrderCache.has(idemKey)) {
      const cachedOrder = idempotencyOrderCache.get(idemKey);
      const cachedPay = findPaymentRecord({ orderId: cachedOrder.id });
      if (cachedOrder.paymentStatus !== 'PAID' && cachedPay?.razorpayOrderId && cachedPay.status === 'CREATED') {
        return {
          success: true,
          duplicatePrevented: true,
          data: {
            id: cachedPay.razorpayOrderId,
            amount: cachedPay.amountInPaise,
            currency: cachedPay.currency,
            receipt: cachedPay.receipt,
            status: 'created',
            keyId: creds.keyId,
            buildoraOrderId: cachedOrder.id,
            orderNumber: cachedOrder.orderNumber,
            order: cachedOrder,
          },
        };
      }
    }

    const customerId = cust.sub;
    const customerPhone = cust.phone || body.deliveryAddress?.mobile || '';
    const created = await createAuthoritativeOrder({
      body,
      customerId,
      customerPhone,
      customerName: cust.name || body.deliveryAddress?.recipientName || 'Buildora Customer',
      customerEmail: cust.email || body.customerEmail,
      tenantId,
      idempotencyKey: idemKey,
      paymentMethod: body.paymentMethod || 'RAZORPAY',
      reserveOnly: true,
    });

    const { order, payment } = created;
    const amountInPaise = Math.round(Number(order.payableAmount ?? order.grandTotal) * 100);
    const receipt = (body.receipt || `rcpt_${order.orderNumber}`).slice(0, 40);

    try {
      const rzpOrder = await createUpstreamRazorpayOrder({
        keyId: creds.keyId,
        keySecret: creds.keySecret,
        amountInPaise,
        currency: 'INR',
        receipt,
        notes: {
          buildoraOrderId: order.id,
          orderNumber: order.orderNumber,
          tenantId,
          customerId,
        },
      });

      const nowIso = new Date().toISOString();
      order.razorpayOrderId = rzpOrder.id;
      order.updatedAt = nowIso;
      await platformPersistenceService.upsert(PlatformOrderModel, order);

      if (payment) {
        payment.razorpayOrderId = rzpOrder.id;
        payment.receipt = rzpOrder.receipt || receipt;
        payment.status = 'CREATED';
        payment.updatedAt = nowIso;
        await savePaymentRecord(payment);
      }

      return {
        success: true,
        data: {
          id: rzpOrder.id,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          receipt: rzpOrder.receipt || receipt,
          status: rzpOrder.status,
          keyId: creds.keyId,
          buildoraOrderId: order.id,
          orderNumber: order.orderNumber,
          order,
        },
      };
    } catch (err) {
      await orderSyncService.releaseOrderStock(order, 'Razorpay order creation aborted');
      const idx = dbStore.orders.findIndex((o) => o.id === order.id);
      if (idx >= 0) dbStore.orders.splice(idx, 1);
      if (payment) {
        payment.status = 'FAILED';
        payment.failureReason = (err as any)?.message || 'Razorpay order initialization failed';
        payment.updatedAt = new Date().toISOString();
        await savePaymentRecord(payment);
      }
      if (idemKey) idempotencyOrderCache.delete(idemKey);
      throw err;
    }
  }

  @Post('razorpay/verify')
  async verifyPayment(
    @Body()
    body: {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
      buildoraOrderId?: string;
    },
    @Headers('authorization') authHeader?: string
  ) {
    const creds = getRazorpayCredentials();
    if (!creds.configured) {
      throw new BadRequestException('Razorpay secret is not configured on the backend.');
    }

    if (!body.razorpayOrderId || !body.razorpayPaymentId || !body.razorpaySignature) {
      throw new BadRequestException(
        'Missing required Razorpay verification parameters (razorpayOrderId, razorpayPaymentId, razorpaySignature).'
      );
    }

    const cust = requireCustomer(authHeader);
    const payment = findPaymentRecord({
      razorpayOrderId: body.razorpayOrderId,
      orderId: body.buildoraOrderId,
    });

    const linkedOrderId = body.buildoraOrderId || payment?.orderId;
    const order = linkedOrderId
      ? (dbStore.orders.find((o) => o.id === linkedOrderId || o.orderNumber === linkedOrderId) as any)
      : (dbStore.orders.find((o: any) => o.razorpayOrderId === body.razorpayOrderId) as any);

    const isSeedDemo = cust.sub === 'cust-9876543210' || cust.sub === 'cust-demo-1';
    if (order && (order.customerId ? order.customerId !== cust.sub : !isSeedDemo)) {
      throw new ForbiddenException('You are not authorized to verify payment for this order.');
    }

    const expected = crypto
      .createHmac('sha256', creds.keySecret)
      .update(`${body.razorpayOrderId}|${body.razorpayPaymentId}`)
      .digest('hex');

    if (!timingSafeHexEqual(expected, body.razorpaySignature)) {
      if (payment && payment.status !== 'SUCCESS') {
        payment.status = 'FAILED';
        payment.failureReason = 'Invalid Razorpay HMAC-SHA256 payment signature';
        payment.updatedAt = new Date().toISOString();
        await savePaymentRecord(payment);
      }
      throw new BadRequestException('Payment signature verification failed.');
    }

    if (!order) {
      throw new NotFoundException('Corresponding order record could not be located for this payment.');
    }

    // Fetch authoritative payment entity from Razorpay to verify order/amount/currency & capture exact method (UPI, card, netbanking, wallet, paylater)
    const rzpPaymentEntity = await fetchUpstreamRazorpayPayment({
      keyId: creds.keyId,
      keySecret: creds.keySecret,
      paymentId: body.razorpayPaymentId,
    });

    if (rzpPaymentEntity) {
      if (rzpPaymentEntity.order_id && rzpPaymentEntity.order_id !== body.razorpayOrderId) {
        throw new BadRequestException('Razorpay payment order ID mismatch.');
      }
      if (rzpPaymentEntity.currency && rzpPaymentEntity.currency !== 'INR') {
        throw new BadRequestException(`Unexpected payment currency: ${rzpPaymentEntity.currency}`);
      }
      const expectedPaise = Math.round(Number(order.payableAmount ?? order.grandTotal ?? 0) * 100);
      if (typeof rzpPaymentEntity.amount === 'number' && expectedPaise > 0 && rzpPaymentEntity.amount !== expectedPaise) {
        throw new BadRequestException('Razorpay payment amount mismatch against server order total.');
      }
    }

    const finalized = await finalizeSuccessfulOnlinePayment({
      order,
      payment,
      razorpayOrderId: body.razorpayOrderId,
      razorpayPaymentId: body.razorpayPaymentId,
      verifiedBy: 'CALLBACK_SIGNATURE',
      verifiedGatewayMethod: rzpPaymentEntity?.method,
      paymentChannelDetails: formatChannelDetails(rzpPaymentEntity),
    });

    return {
      success: true,
      duplicatePrevented: finalized.alreadyFinalized || undefined,
      data: {
        verified: true,
        paymentId: body.razorpayPaymentId,
        orderId: body.razorpayOrderId,
        buildoraOrderId: order.id,
        orderNumber: order.orderNumber,
        paymentMethod: finalized.order.paymentMethod,
        paymentChannelDetails: finalized.order.paymentChannelDetails,
        order: finalized.order,
        payment: finalized.payment,
        timestamp: finalized.payment.paidAt || new Date().toISOString(),
      },
    };
  }

  @Post('razorpay/fail')
  async failPayment(
    @Body()
    body: {
      razorpayOrderId?: string;
      buildoraOrderId?: string;
      cancelled?: boolean;
      reason?: string;
    },
    @Headers('authorization') authHeader?: string
  ) {
    const cust = requireCustomer(authHeader);
    const payment = findPaymentRecord({
      razorpayOrderId: body.razorpayOrderId,
      orderId: body.buildoraOrderId,
    });
    const linkedOrderId = body.buildoraOrderId || payment?.orderId;
    const order = linkedOrderId
      ? (dbStore.orders.find((o) => o.id === linkedOrderId || o.orderNumber === linkedOrderId) as any)
      : (dbStore.orders.find((o: any) => o.razorpayOrderId === body.razorpayOrderId) as any);

    const isSeedDemo = cust.sub === 'cust-9876543210' || cust.sub === 'cust-demo-1';
    if (order && (order.customerId ? order.customerId !== cust.sub : !isSeedDemo)) {
      throw new ForbiddenException('Unauthorized payment state update.');
    }

    if (order?.paymentStatus === 'PAID' || payment?.status === 'SUCCESS') {
      return {
        success: true,
        alreadyPaid: true,
        message: 'Order payment is already confirmed.',
        data: { order, payment },
      };
    }

    const nowIso = new Date().toISOString();
    const targetPayStatus = body.cancelled ? 'CANCELLED' : 'FAILED';
    const cleanReason =
      body.reason || (body.cancelled ? 'Customer closed or cancelled Razorpay Checkout.' : 'Payment failed at gateway.');

    if (payment) {
      payment.status = targetPayStatus;
      payment.failureReason = cleanReason;
      payment.updatedAt = nowIso;
      await savePaymentRecord(payment);
    }

    if (order) {
      order.paymentStatus = targetPayStatus;
      order.canRetryPayment = true;
      order.updatedAt = nowIso;
      order.timeline = Array.isArray(order.timeline) ? order.timeline : [];
      order.timeline.push({
        status: order.status,
        title: body.cancelled ? 'Payment Cancelled — Retry Available' : 'Payment Failed — Retry Available',
        description: cleanReason,
        timestamp: nowIso,
        completed: true,
      });

      await orderSyncService.releaseOrderStock(
        order,
        `${targetPayStatus} for order #${order.orderNumber} — reserved stock released`
      );
      await platformPersistenceService.upsert(PlatformOrderModel, order);

      const tenantId = order.tenantId || DEFAULT_TENANT_ID;
      for (const vo of vendorOrders) {
        if (vo.orderNumber === order.orderNumber) {
          (vo as any).paymentStatus = targetPayStatus;
          await platformPersistenceService.upsert(PlatformOrderModel, vo);
          realtimeBus.emitToVendor(vo.vendorId, 'payment.status.updated', {
            orderNumber: order.orderNumber,
            paymentStatus: targetPayStatus,
          }, tenantId);
        }
      }

      if (order.customerId && order.customerId !== 'cust-guest') {
        await platformNotificationService.dispatch({
          tenantId,
          recipientRole: 'CUSTOMER',
          recipientId: order.customerId,
          type: 'PAYMENT',
          title: `${body.cancelled ? 'Payment Cancelled' : 'Payment Failed'}: #${order.orderNumber}`,
          message: `${cleanReason} You can safely retry payment from Checkout or My Orders.`,
          severity: 'WARNING',
          actionUrl: `/orders/${order.orderNumber}`,
        });
        realtimeBus.emitToCustomer(order.customerId, 'payment.status.updated', {
          orderNumber: order.orderNumber,
          paymentStatus: targetPayStatus,
        }, tenantId);
      }
      realtimeBus.emitToAdmin('payment.status.updated', {
        orderNumber: order.orderNumber,
        paymentStatus: targetPayStatus,
      }, tenantId);
    }

    return {
      success: true,
      message: body.cancelled
        ? 'Payment cancellation recorded and reserved stock released.'
        : 'Payment failure recorded and reserved stock released.',
      data: {
        buildoraOrderId: order?.id,
        orderNumber: order?.orderNumber,
        paymentStatus: targetPayStatus,
        canRetryPayment: true,
      },
    };
  }

  @Get('razorpay/reconcile/:orderId')
  async reconcileOrderPayment(
    @Param('orderId') orderId: string,
    @Headers('authorization') authHeader?: string
  ) {
    const creds = getRazorpayCredentials();
    if (!creds.configured) {
      throw new BadRequestException('Razorpay credentials are not configured on backend.');
    }

    const cust = requireCustomer(authHeader);
    const needle = orderId.trim().toLowerCase();
    const order = dbStore.orders.find(
      (o) => o.id.toLowerCase() === needle || o.orderNumber.toLowerCase() === needle
    ) as any;
    if (!order) throw new NotFoundException(`Order ${orderId} not found.`);
    const isSeedDemo = cust.sub === 'cust-9876543210' || cust.sub === 'cust-demo-1';
    if (order.customerId ? order.customerId !== cust.sub : !isSeedDemo) {
      throw new ForbiddenException('Unauthorized access to order payment reconciliation.');
    }

    const payment = findPaymentRecord({ orderId: order.id, razorpayOrderId: order.razorpayOrderId });
    const rzpOrderId = order.razorpayOrderId || payment?.razorpayOrderId;
    if (!rzpOrderId) {
      return {
        success: true,
        data: { order, payment, reconciled: false, status: order.paymentStatus },
      };
    }

    if (order.paymentStatus === 'PAID' && payment?.status === 'SUCCESS') {
      return {
        success: true,
        data: { order, payment, reconciled: true, status: 'PAID' },
      };
    }

    const authHeaderRzp = 'Basic ' + Buffer.from(`${creds.keyId}:${creds.keySecret}`).toString('base64');
    const res = await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(rzpOrderId)}/payments`, {
      headers: { Authorization: authHeaderRzp },
    });
    if (!res.ok) {
      throw new BadRequestException('Unable to query Razorpay payment reconciliation status right now.');
    }

    const json = (await res.json()) as { items?: any[] };
    const captured = (json.items || []).find((p: any) => p.status === 'captured');
    if (captured) {
      const finalized = await finalizeSuccessfulOnlinePayment({
        order,
        payment,
        razorpayOrderId: rzpOrderId,
        razorpayPaymentId: captured.id,
        verifiedBy: 'RECONCILIATION',
        verifiedGatewayMethod: captured.method,
        paymentChannelDetails: formatChannelDetails(captured),
      });
      return {
        success: true,
        data: {
          order: finalized.order,
          payment: finalized.payment,
          reconciled: true,
          status: 'PAID',
        },
      };
    }

    const failed = (json.items || []).find((p: any) => p.status === 'failed');
    if (failed && order.paymentStatus !== 'PAID') {
      await this.failPayment({
        razorpayOrderId: rzpOrderId,
        buildoraOrderId: order.id,
        reason: failed.error_description || 'Razorpay reported payment failure',
      });
    }

    return {
      success: true,
      data: {
        order,
        payment: findPaymentRecord({ orderId: order.id }),
        reconciled: false,
        status: order.paymentStatus,
      },
    };
  }

  @Post('webhook')
  async handleWebhook(
    @Body() payload: any,
    @Headers('x-razorpay-signature') rzpSignature?: string,
    @Headers('x-razorpay-event-id') rzpEventId?: string,
    @Req() req?: any
  ) {
    const creds = getRazorpayCredentials();
    const webhookSecret = creds.webhookSecret || creds.keySecret;
    if (!webhookSecret) {
      throw new BadRequestException('Webhook secret is not configured on backend.');
    }

    if (!rzpSignature) {
      throw new ForbiddenException('Missing x-razorpay-signature webhook header.');
    }

    const rawBodyStr = req?.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(payload || {});
    const expectedSig = crypto.createHmac('sha256', webhookSecret).update(rawBodyStr).digest('hex');

    if (!timingSafeHexEqual(expectedSig, rzpSignature)) {
      this.logger.warn('Rejected Razorpay webhook with invalid HMAC signature.');
      throw new ForbiddenException('Invalid Razorpay webhook signature.');
    }

    const event = String(payload?.event || '');
    const payEntity = payload?.payload?.payment?.entity;
    const ordEntity = payload?.payload?.order?.entity;
    const entityId = payEntity?.id || ordEntity?.id || '';
    const eventKey = rzpEventId || `${event}:${entityId}`;

    if (eventKey && processedWebhookEvents.has(eventKey)) {
      this.logger.log(`Duplicate Razorpay webhook ignored cleanly: ${eventKey}`);
      return { received: true, duplicatePrevented: true, event, eventId: eventKey };
    }

    const rzpOrderId = payEntity?.order_id || ordEntity?.id;
    const buildoraOrderId = payEntity?.notes?.buildoraOrderId || ordEntity?.notes?.buildoraOrderId;
    const payment = findPaymentRecord({ razorpayOrderId: rzpOrderId, orderId: buildoraOrderId });
    const order = buildoraOrderId
      ? (dbStore.orders.find((o) => o.id === buildoraOrderId || o.orderNumber === buildoraOrderId) as any)
      : rzpOrderId
        ? (dbStore.orders.find((o: any) => o.razorpayOrderId === rzpOrderId) as any)
        : undefined;

    if (event === 'payment.captured' || event === 'order.paid') {
      if (order && payEntity?.id) {
        const finalized = await finalizeSuccessfulOnlinePayment({
          order,
          payment,
          razorpayOrderId: rzpOrderId || order.razorpayOrderId,
          razorpayPaymentId: payEntity.id,
          verifiedBy: 'WEBHOOK',
          verifiedGatewayMethod: payEntity.method,
          paymentChannelDetails: formatChannelDetails(payEntity),
        });
        if (eventKey) {
          processedWebhookEvents.add(eventKey);
          if (finalized.payment) {
            finalized.payment.processedWebhookEventIds = Array.from(
              new Set([...(finalized.payment.processedWebhookEventIds || []), eventKey])
            );
            await savePaymentRecord(finalized.payment);
          }
        }
      }
      this.logger.log(`Processed webhook ${event} (${eventKey}) cleanly.`);
    } else if (event === 'payment.failed') {
      if (order && order.paymentStatus !== 'PAID') {
        await this.failPayment({
          razorpayOrderId: rzpOrderId,
          buildoraOrderId: order.id,
          reason: payEntity?.error_description || 'Webhook reported payment.failed',
        });
      }
      if (eventKey) processedWebhookEvents.add(eventKey);
      this.logger.log(`Processed webhook payment.failed (${eventKey}) cleanly.`);
    } else if (event === 'refund.processed') {
      if (payment) {
        payment.status = 'REFUNDED';
        payment.updatedAt = new Date().toISOString();
        payment.processedWebhookEventIds = Array.from(new Set([...(payment.processedWebhookEventIds || []), eventKey]));
        await savePaymentRecord(payment);
      }
      if (order) {
        order.paymentStatus = 'REFUNDED';
        order.updatedAt = new Date().toISOString();
        await platformPersistenceService.upsert(PlatformOrderModel, order);
      }
      if (eventKey) processedWebhookEvents.add(eventKey);
      this.logger.log(`Processed webhook refund.processed (${eventKey}) cleanly.`);
    } else {
      if (eventKey) processedWebhookEvents.add(eventKey);
      this.logger.log(`Acknowledged unhandled Razorpay webhook event ${event} (${eventKey}).`);
    }

    return {
      received: true,
      event,
      eventId: eventKey,
    };
  }
}
