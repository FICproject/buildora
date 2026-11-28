import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { dbStore } from '../../../database/store';
import { PlatformOrderModel, PlatformWalletTxnModel, platformPersistenceService } from '../../../database/platform-persistence.service';
import { companyAdminDataService } from '../../company-admin/services/company-admin-data.service';
import { platformNotificationService } from '../../notifications/platform-notification.service';
import { realtimeBus } from '../../realtime/realtime-bus';
import { DEFAULT_TENANT_ID, vendorOrders } from '../../vendors/controllers/vendor.controller';
import { orderSyncService } from '../../orders/services/order-sync.service';

interface PendingPaymentRecord {
  razorpayOrderId: string;
  amountInPaise: number;
  buildoraOrderId?: string;
  status: 'CREATED' | 'PAID' | 'FAILED';
  createdAt: string;
}

const pendingPayments = new Map<string, PendingPaymentRecord>();

@Controller('api/v1/payments')
export class PaymentsController {
  @Post('razorpay/order')
  async createRazorpayOrder(
    @Body() body: { amount: number; currency?: string; receipt?: string; buildoraOrderId?: string }
  ) {
    const amount = Number(body.amount || 0);
    if (amount <= 0 || isNaN(amount)) {
      throw new BadRequestException('Payment amount must be greater than zero.');
    }
    const amountInPaise = Math.round(amount * 100);
    const currency = body.currency || 'INR';
    const receipt = body.receipt || 'rcpt_' + Date.now();

    const keyId = process.env.RAZORPAY_KEY_ID?.trim();
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

    if (keyId && keySecret) {
      const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
      const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency,
          receipt,
          ...(body.buildoraOrderId ? { notes: { buildoraOrderId: body.buildoraOrderId } } : {}),
        }),
      });

      if (!rzpRes.ok) {
        let errMessage = 'Failed to create Razorpay order.';
        try {
          const errJson = (await rzpRes.json()) as { error?: { description?: string } };
          if (errJson?.error?.description) {
            errMessage = `Razorpay error: ${errJson.error.description}`;
          }
        } catch {
          // Keep generic error message if response body is not JSON
        }
        throw new BadRequestException(errMessage);
      }

      const rzpOrder = (await rzpRes.json()) as {
        id: string;
        amount: number;
        currency: string;
        receipt?: string;
        status: string;
      };

      pendingPayments.set(rzpOrder.id, {
        razorpayOrderId: rzpOrder.id,
        amountInPaise: rzpOrder.amount,
        buildoraOrderId: body.buildoraOrderId,
        status: 'CREATED',
        createdAt: new Date().toISOString(),
      });

      return {
        success: true,
        data: {
          id: rzpOrder.id,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          receipt: rzpOrder.receipt || receipt,
          status: rzpOrder.status,
          keyId,
        },
      };
    }

    const rzpOrderId = 'order_' + Math.random().toString(36).substring(2, 12);

    pendingPayments.set(rzpOrderId, {
      razorpayOrderId: rzpOrderId,
      amountInPaise,
      buildoraOrderId: body.buildoraOrderId,
      status: 'CREATED',
      createdAt: new Date().toISOString(),
    });

    return {
      success: true,
      data: {
        id: rzpOrderId,
        amount: amountInPaise,
        currency,
        receipt,
        status: 'created',
        keyId: keyId || 'rzp_test_buildora_mock_key',
      },
    };
  }

  @Post('razorpay/verify')
  async verifyPayment(
    @Body()
    body: {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature?: string;
      buildoraOrderId?: string;
    }
  ) {
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
    let isValid = false;

    if (keySecret) {
      if (body.razorpayOrderId && body.razorpayPaymentId && body.razorpaySignature) {
        const expected = crypto
          .createHmac('sha256', keySecret)
          .update(`${body.razorpayOrderId}|${body.razorpayPaymentId}`)
          .digest('hex');
        isValid = expected === body.razorpaySignature;
      }
    } else {
      isValid = Boolean(body.razorpayPaymentId && body.razorpayOrderId);
    }

    if (!isValid) {
      throw new BadRequestException('Payment signature verification failed.');
    }

    const tracked = pendingPayments.get(body.razorpayOrderId);
    if (tracked) tracked.status = 'PAID';

    const linkedOrderId = body.buildoraOrderId || tracked?.buildoraOrderId;
    if (linkedOrderId) {
      const order = dbStore.orders.find(
        (o) => o.id === linkedOrderId || o.orderNumber === linkedOrderId
      ) as any;
      if (order) {
        await orderSyncService.commitReservedOrderStock(order);
        order.paymentStatus = 'PAID';
        order.paymentId = body.razorpayPaymentId;
        order.timeline.push({
          status: 'CONFIRMED',
          title: 'Payment Verified & Stock Committed',
          description: `Razorpay Ref: ${body.razorpayPaymentId}`,
          timestamp: new Date().toISOString(),
          completed: true,
        });
        await platformPersistenceService.upsert(PlatformOrderModel, order);

        const tenantId = order.tenantId || DEFAULT_TENANT_ID;
        for (const vo of vendorOrders) {
          if (vo.orderNumber === order.orderNumber) {
            (vo as any).paymentStatus = 'PAID';
            await platformPersistenceService.upsert(PlatformOrderModel, vo);
            realtimeBus.emitToVendor(vo.vendorId, 'payment.status.updated', {
              orderNumber: order.orderNumber,
              paymentStatus: 'PAID',
              paymentId: body.razorpayPaymentId,
            }, tenantId);
          }
        }
        if (order.customerId) {
          realtimeBus.emitToCustomer(order.customerId, 'payment.status.updated', {
            orderNumber: order.orderNumber,
            paymentStatus: 'PAID',
            paymentId: body.razorpayPaymentId,
          }, tenantId);
        }
        realtimeBus.emitToAdmin('payment.status.updated', {
          orderNumber: order.orderNumber,
          paymentStatus: 'PAID',
          paymentId: body.razorpayPaymentId,
        }, tenantId);
      }
    }

    return {
      success: true,
      data: {
        verified: true,
        paymentId: body.razorpayPaymentId,
        orderId: body.razorpayOrderId,
        buildoraOrderId: linkedOrderId,
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Post('razorpay/fail')
  async failPayment(
    @Body()
    body: {
      razorpayOrderId?: string;
      buildoraOrderId?: string;
      reason?: string;
    }
  ) {
    const tracked = body.razorpayOrderId ? pendingPayments.get(body.razorpayOrderId) : undefined;
    if (tracked) tracked.status = 'FAILED';

    const linkedOrderId = body.buildoraOrderId || tracked?.buildoraOrderId;
    if (linkedOrderId) {
      const order = dbStore.orders.find(
        (o) => o.id === linkedOrderId || o.orderNumber === linkedOrderId
      ) as any;
      if (order) {
        const nowIso = new Date().toISOString();
        order.paymentStatus = 'FAILED';
        order.status = 'CANCELLED';
        order.updatedAt = nowIso;
        order.timeline.push({
          status: 'CANCELLED',
          title: 'Payment Failed — Stock Released',
          description: body.reason || 'Payment gateway declined or cancelled.',
          timestamp: nowIso,
          completed: true,
        });

        await orderSyncService.releaseOrderStock(
          order,
          `Payment failed for order #${order.orderNumber} — reserved stock released`
        );

        // Refund partial wallet if used
        if (order.walletUsed && order.walletUsed > 0 && !order.refundedOnCancel) {
          order.refundedOnCancel = true;
          const custRec = order.customerId ? companyAdminDataService.customers.get(order.customerId) : undefined;
          if (custRec) custRec.walletBalance = Number(custRec.walletBalance || 0) + Number(order.walletUsed);
          dbStore.walletBalance += Number(order.walletUsed);
          const tx: any = {
            id: `tx-rel-${Date.now()}`,
            customerId: order.customerId,
            referenceNumber: `WRL-${Date.now().toString().slice(-6)}`,
            type: 'CREDIT',
            amount: Number(order.walletUsed),
            category: 'REFUND',
            status: 'COMPLETED',
            orderId: order.orderNumber,
            description: `Wallet hold released after payment failure (#${order.orderNumber})`,
            createdAt: nowIso,
            balanceAfter: custRec ? custRec.walletBalance : dbStore.walletBalance,
          };
          dbStore.walletTransactions.unshift(tx);
          await platformPersistenceService.upsert(PlatformWalletTxnModel, tx);
        }

        const tenantId = order.tenantId || DEFAULT_TENANT_ID;
        for (const vo of vendorOrders) {
          if (vo.orderNumber === order.orderNumber) {
            vo.status = 'CANCELLED';
            (vo as any).paymentStatus = 'FAILED';
            await platformPersistenceService.upsert(PlatformOrderModel, vo);
            realtimeBus.emitToVendor(vo.vendorId, 'payment.status.updated', {
              orderNumber: order.orderNumber,
              paymentStatus: 'FAILED',
              status: 'CANCELLED',
            }, tenantId);
          }
        }

        if (order.customerId) {
          await platformNotificationService.dispatch({
            tenantId,
            recipientRole: 'CUSTOMER',
            recipientId: order.customerId,
            type: 'PAYMENT',
            title: `Payment Failed for Order #${order.orderNumber}`,
            message: body.reason || 'Payment failed and reserved items were released back to stock.',
            severity: 'WARNING',
            actionUrl: `/orders/${order.orderNumber}`,
          });
          realtimeBus.emitToCustomer(order.customerId, 'payment.status.updated', {
            orderNumber: order.orderNumber,
            paymentStatus: 'FAILED',
            status: 'CANCELLED',
          }, tenantId);
        }
        realtimeBus.emitToAdmin('payment.status.updated', {
          orderNumber: order.orderNumber,
          paymentStatus: 'FAILED',
          status: 'CANCELLED',
        }, tenantId);
      }
    }

    return {
      success: true,
      message: 'Payment failure recorded and reserved inventory released.',
    };
  }

  @Post('webhook')
  async handleWebhook(@Body() payload: any) {
    const event = payload?.event || 'payment.captured';
    const orderId = payload?.payload?.payment?.entity?.notes?.buildoraOrderId || payload?.buildoraOrderId;
    if (event === 'payment.failed' && orderId) {
      await this.failPayment({ buildoraOrderId: orderId, reason: 'Webhook payment.failed' });
    }
    return {
      received: true,
      event,
    };
  }
}
