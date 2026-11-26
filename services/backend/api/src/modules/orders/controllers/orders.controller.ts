import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Headers,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { dbStore } from '../../../database/store';
import { Order, VendorReturnRequest } from '@buildora/types';
import { verifyCustomerToken } from '../../../common/customer-auth.util';
import {
  PlatformOrderModel,
  PlatformReturnModel,
  PlatformWalletTxnModel,
  platformPersistenceService,
} from '../../../database/platform-persistence.service';
import { companyAdminDataService } from '../../company-admin/services/company-admin-data.service';
import { platformNotificationService } from '../../notifications/platform-notification.service';
import { realtimeBus } from '../../realtime/realtime-bus';
import {
  DEFAULT_TENANT_ID,
  DEFAULT_VENDOR_ID,
  vendorOrders,
  vendorReturns,
} from '../../vendors/controllers/vendor.controller';
import { orderSyncService } from '../services/order-sync.service';

const idempotencyOrderCache = new Map<string, any>();

@Controller('api/v1/orders')
export class OrdersController {
  @Get()
  getOrders(@Headers('authorization') authHeader?: string) {
    const cust = verifyCustomerToken(authHeader);
    let orders = [...dbStore.orders];
    if (cust?.sub) {
      const owned = orders.filter((o: any) => !o.customerId || o.customerId === cust.sub);
      orders = owned;
    }
    return {
      success: true,
      data: orders,
    };
  }

  @Get(':idOrNumber')
  getOrderById(
    @Param('idOrNumber') idOrNumber: string,
    @Headers('authorization') authHeader?: string
  ) {
    const cust = verifyCustomerToken(authHeader);
    const needle = idOrNumber.trim().toLowerCase();
    const order = dbStore.orders.find(
      (o) => o.id.toLowerCase() === needle || o.orderNumber.toLowerCase() === needle
    ) as any;
    if (!order) {
      throw new NotFoundException(`Order ${idOrNumber} not found`);
    }
    if (cust?.sub && order.customerId && order.customerId !== cust.sub) {
      throw new ForbiddenException('You do not have permission to view another customer order.');
    }
    return {
      success: true,
      data: order,
    };
  }

  @Get(':idOrNumber/track')
  trackOrder(
    @Param('idOrNumber') idOrNumber: string,
    @Headers('authorization') authHeader?: string
  ) {
    const cust = verifyCustomerToken(authHeader);
    const needle = idOrNumber.trim().toLowerCase();
    const order = dbStore.orders.find(
      (o) => o.id.toLowerCase() === needle || o.orderNumber.toLowerCase() === needle
    ) as any;
    if (!order) {
      throw new NotFoundException(`Order ${idOrNumber} not found`);
    }
    if (cust?.sub && order.customerId && order.customerId !== cust.sub) {
      throw new ForbiddenException('You do not have permission to track another customer order.');
    }
    const vendorSplits = vendorOrders
      .filter((vo) => vo.orderNumber === order.orderNumber)
      .map((vo) => ({
        vendorOrderId: vo.id,
        vendorId: vo.vendorId,
        status: vo.status,
        timeline: vo.timeline,
      }));
    return {
      success: true,
      data: {
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus || 'PAID',
        estimatedDeliveryTime: order.estimatedDeliveryTime,
        timeline: order.timeline,
        deliveryPartner: order.deliveryPartner,
        destination: order.deliveryAddress,
        vendorSplits,
      },
    };
  }

  @Post()
  async createOrder(
    @Body() body: any,
    @Headers('authorization') authHeader?: string,
    @Headers('idempotency-key') idempotencyHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string
  ) {
    const cust = verifyCustomerToken(authHeader);
    const customerId = cust?.sub || body.customerId || 'cust-guest';
    const customerPhone = cust?.phone || body.deliveryAddress?.mobile || '';
    const tenantId = headerTenantId || cust?.tenantId || DEFAULT_TENANT_ID;

    // 0. Check customer account suspension
    orderSyncService.assertCustomerNotSuspended(customerId, customerPhone);

    // 1. Idempotency / duplicate submission guard
    const idemKey = idempotencyHeader || body.idempotencyKey;
    if (idemKey && idempotencyOrderCache.has(idemKey)) {
      return {
        success: true,
        duplicatePrevented: true,
        data: idempotencyOrderCache.get(idemKey),
      };
    }

    // 2. Dynamic COD & Payment Configuration Check from Tenant Settings
    const tenantCfg = companyAdminDataService.getTenantConfig(tenantId);
    const amountToCheck = Number(body.payableAmount ?? body.grandTotal ?? body.totalAmount ?? 0);
    if (body.paymentMethod === 'COD') {
      if (tenantCfg?.paymentConfig?.codEnabled === false) {
        throw new BadRequestException('Cash on Delivery is currently disabled by Company Admin.');
      }
      const maxCod = Number(tenantCfg?.paymentConfig?.codMaxOrderValue ?? 50000);
      if (maxCod > 0 && amountToCheck > maxCod) {
        throw new BadRequestException(
          `Cash on Delivery is available for orders up to ₹${maxCod.toLocaleString('en-IN')} only. Please choose an online payment method.`
        );
      }
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      throw new BadRequestException('Order items array is required.');
    }

    const id = 'ord-' + Date.now();
    const orderNumber =
      'BLD-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    const createdAt = new Date().toISOString();
    const reserveOnly = Boolean(body.reserveOnly && body.paymentMethod !== 'COD');

    // 3. Atomic availability & visibility validation + stock reservation/deduction
    await orderSyncService.reserveOrDeductItems(body.items, reserveOnly, orderNumber);

    // 4. Wallet deduction
    const walletUsed = Number(body.walletUsed || 0);
    if (walletUsed > 0) {
      const custRec = companyAdminDataService.customers.get(customerId);
      const currentBal = custRec ? custRec.walletBalance : dbStore.walletBalance;
      if (walletUsed > currentBal) {
        throw new BadRequestException('Insufficient Buildora Wallet balance.');
      }
      if (custRec) custRec.walletBalance = Math.max(0, custRec.walletBalance - walletUsed);
      dbStore.walletBalance = Math.max(0, dbStore.walletBalance - walletUsed);
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

    // 5. Create primary customer order
    const paymentStatus = reserveOnly
      ? 'PENDING_PAYMENT'
      : body.paymentMethod === 'COD'
        ? 'PENDING'
        : 'PAID';

    const newOrder: Order & Record<string, any> = {
      ...body,
      id,
      orderNumber,
      tenantId,
      customerId,
      customerName: cust?.name || body.deliveryAddress?.recipientName || 'Buildora Customer',
      customerPhone,
      createdAt,
      paymentStatus,
      stockReservedOnly: reserveOnly,
      status: 'ORDER_PLACED',
      timeline: [
        {
          status: 'ORDER_PLACED',
          title: 'Order Placed',
          description: reserveOnly
            ? 'Inventory reserved. Awaiting online payment verification.'
            : body.paymentMethod === 'COD'
              ? 'Cash on Delivery confirmed.'
              : 'Payment authorized and verified.',
          timestamp: createdAt,
          completed: true,
        },
        {
          status: 'CONFIRMED',
          title: 'Vendor Dispatch Allocation',
          description: 'Routed to supplying vendor depot(s).',
          timestamp: createdAt,
          completed: !reserveOnly,
        },
      ],
      deliveryPartner: (() => {
        const pin = body.deliveryAddress?.pincode || '';
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

    // 6. Split cart items by vendor & dispatch VendorOrders
    await orderSyncService.splitAndCreateVendorOrders(newOrder, tenantId);
    await platformPersistenceService.upsert(PlatformOrderModel, newOrder);

    // 7. Update customer lifetime KPI in Company Admin registry
    const existingCustomer = companyAdminDataService.customers.get(customerId);
    if (existingCustomer) {
      existingCustomer.totalOrders = (existingCustomer.totalOrders || 0) + 1;
      existingCustomer.totalSpent = (existingCustomer.totalSpent || 0) + amountToCheck;
      (existingCustomer as any).lastOrderAt = createdAt;
    }

    // 8. Notify Admin + Customer & emit real-time order.created
    await platformNotificationService.dispatch({
      tenantId,
      recipientRole: 'ADMIN',
      recipientId: 'TENANT_ADMIN',
      type: 'ORDER',
      title: `New Order #${orderNumber}`,
      message: `${newOrder.customerName} placed an order worth ₹${amountToCheck.toLocaleString()}.`,
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
        message: `Your order for ₹${amountToCheck.toLocaleString()} has been received and sent to supplier(s).`,
        severity: 'SUCCESS',
        actionUrl: `/orders/${orderNumber}`,
        metadata: { orderId: id, orderNumber },
      });
      realtimeBus.emitToCustomer(customerId, 'order.created', { order: newOrder }, tenantId);
    }
    realtimeBus.emitToAdmin('order.created', { order: newOrder }, tenantId);

    if (idemKey) {
      idempotencyOrderCache.set(idemKey, newOrder);
    }

    return {
      success: true,
      data: newOrder,
    };
  }

  @Post(':id/cancel')
  async cancelOrder(
    @Param('id') id: string,
    @Body() body?: { reason?: string },
    @Headers('authorization') authHeader?: string
  ) {
    const cust = verifyCustomerToken(authHeader);
    const order = dbStore.orders.find((o) => o.id === id || o.orderNumber === id) as any;
    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }
    if (cust?.sub && order.customerId && order.customerId !== cust.sub) {
      throw new ForbiddenException('You can only cancel your own orders.');
    }

    if (order.status === 'OUT_FOR_DELIVERY' || order.status === 'DELIVERED') {
      return {
        success: false,
        message:
          'This order is already out for delivery or delivered and cannot be cancelled directly. Please submit a Return request upon arrival.',
      };
    }

    const nowIso = new Date().toISOString();
    order.status = 'CANCELLED';
    order.updatedAt = nowIso;
    order.timeline.push({
      status: 'CANCELLED',
      title: 'Order Cancelled',
      description: body?.reason || 'Order cancelled by customer before dispatch. Inventory released.',
      timestamp: nowIso,
      completed: true,
    });

    // Release inventory across customer & vendor catalogs
    await orderSyncService.releaseOrderStock(order, `Customer cancelled order #${order.orderNumber}`);

    // Update vendor split orders to CANCELLED and notify each vendor
    const tenantId = order.tenantId || DEFAULT_TENANT_ID;
    for (const vo of vendorOrders) {
      const anyVo = vo as any;
      if (vo.orderNumber === order.orderNumber || anyVo.parentOrderId === order.id) {
        vo.status = 'CANCELLED';
        vo.timeline.push({
          status: 'CANCELLED',
          title: 'Cancelled by Customer',
          description: body?.reason || 'Customer cancelled order before dispatch.',
          timestamp: nowIso,
        });
        await platformPersistenceService.upsert(PlatformOrderModel, vo);
        await platformNotificationService.dispatch({
          tenantId,
          recipientRole: 'VENDOR',
          recipientId: vo.vendorId,
          type: 'ORDER',
          title: `Order Cancelled #${order.orderNumber}`,
          message: `Customer cancelled order #${order.orderNumber}. Reserved/allocated inventory released.`,
          severity: 'WARNING',
          actionUrl: '/orders',
          metadata: { orderId: vo.id, orderNumber: order.orderNumber },
        });
        realtimeBus.emitToVendor(vo.vendorId, 'order.status.updated', { orderId: vo.id, orderNumber: order.orderNumber, status: 'CANCELLED' }, tenantId);
      }
    }

    // Refund wallet or paid amount
    const refundAmount =
      order.paymentStatus === 'PAID'
        ? Number(order.grandTotal ?? order.payableAmount ?? order.totalAmount ?? 0)
        : Number(order.walletUsed || 0);
    if (refundAmount > 0 && !order.refundedOnCancel) {
      order.refundedOnCancel = true;
      order.paymentStatus = 'REFUNDED';
      const custRec = order.customerId ? companyAdminDataService.customers.get(order.customerId) : undefined;
      if (custRec) custRec.walletBalance = Number(custRec.walletBalance || 0) + refundAmount;
      dbStore.walletBalance += refundAmount;
      const refundTx: any = {
        id: 'tx-ref-' + Date.now(),
        customerId: order.customerId,
        referenceNumber: 'WTX-REF-' + Date.now().toString().slice(-6),
        type: 'CREDIT',
        amount: refundAmount,
        category: 'REFUND',
        status: 'COMPLETED',
        description: `Refund for Cancelled Order #${order.orderNumber}`,
        orderId: order.orderNumber,
        createdAt: nowIso,
        balanceAfter: custRec ? custRec.walletBalance : dbStore.walletBalance,
      };
      dbStore.walletTransactions.unshift(refundTx);
      await platformPersistenceService.upsert(PlatformWalletTxnModel, refundTx);
    }

    await platformPersistenceService.upsert(PlatformOrderModel, order);
    if (order.customerId) {
      realtimeBus.emitToCustomer(order.customerId, 'order.status.updated', { orderNumber: order.orderNumber, status: 'CANCELLED', order }, tenantId);
    }
    realtimeBus.emitToAdmin('order.status.updated', { orderNumber: order.orderNumber, status: 'CANCELLED', order }, tenantId);

    return {
      success: true,
      message: 'Order cancelled successfully. Stock released and refund initiated.',
      data: order,
    };
  }

  @Post(':id/return')
  async requestReturn(
    @Param('id') id: string,
    @Body() body: { reason: string; items?: string[]; comments?: string },
    @Headers('authorization') authHeader?: string
  ) {
    const cust = verifyCustomerToken(authHeader);
    const order = dbStore.orders.find((o) => o.id === id || o.orderNumber === id) as any;
    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }
    if (cust?.sub && order.customerId && order.customerId !== cust.sub) {
      throw new ForbiddenException('You can only request returns for your own orders.');
    }

    const nowIso = new Date().toISOString();
    order.status = 'RETURN_REQUESTED';
    order.updatedAt = nowIso;
    order.timeline.push({
      status: 'RETURN_REQUESTED',
      title: 'Return / Replacement Requested',
      description: `Reason: ${body.reason}. ${body.comments || 'Pickup inspection queued.'}`,
      timestamp: nowIso,
      completed: true,
    });

    const tenantId = order.tenantId || DEFAULT_TENANT_ID;
    const matchingVendorOrders = vendorOrders.filter((vo) => vo.orderNumber === order.orderNumber);
    const targetVendors =
      matchingVendorOrders.length > 0
        ? matchingVendorOrders
        : [{ vendorId: DEFAULT_VENDOR_ID, items: order.items || [] }];

    const createdReturns: VendorReturnRequest[] = [];
    for (const vo of targetVendors) {
      const items = (vo.items || []).map((it: any) => ({
        productId: it.productId,
        sku: it.sku || '',
        name: it.name,
        quantity: Number(it.quantity || 1),
        reason: body.reason || 'Site Surplus / Defect',
        condition: 'SEALED' as const,
      }));
      const refundAmount = (vo.items || []).reduce(
        (s: number, it: any) => s + Number(it.totalPrice ?? (it.unitPrice || it.price || 0) * (it.quantity || 1)),
        0
      );

      const retReq: VendorReturnRequest & Record<string, any> = {
        id: `ret-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        orderId: order.id,
        orderNumber: order.orderNumber,
        vendorId: vo.vendorId,
        customerId: order.customerId,
        customerName: order.customerName || 'Customer',
        pickupAddress: order.deliveryAddress || {},
        items,
        totalRefundAmount: refundAmount,
        status: 'REQUESTED',
        comments: body.comments,
        requestedAt: nowIso,
      };
      vendorReturns.unshift(retReq);
      createdReturns.push(retReq);
      await platformPersistenceService.upsert(PlatformReturnModel, retReq);

      if ((vo as any).id) {
        (vo as any).status = 'RETURN_REQUESTED';
        await platformPersistenceService.upsert(PlatformOrderModel, vo);
      }

      await platformNotificationService.dispatch({
        tenantId,
        recipientRole: 'VENDOR',
        recipientId: vo.vendorId,
        type: 'ORDER',
        title: `Return Requested #${order.orderNumber}`,
        message: `Reason: ${body.reason}. Value: ₹${refundAmount.toLocaleString()}.`,
        severity: 'WARNING',
        actionUrl: '/returns',
        metadata: { returnId: retReq.id, orderNumber: order.orderNumber },
      });
      realtimeBus.emitToVendor(vo.vendorId, 'order.status.updated', { orderNumber: order.orderNumber, status: 'RETURN_REQUESTED', returnRequest: retReq }, tenantId);
    }

    await platformPersistenceService.upsert(PlatformOrderModel, order);
    realtimeBus.emitToAdmin('order.status.updated', { orderNumber: order.orderNumber, status: 'RETURN_REQUESTED', returns: createdReturns }, tenantId);

    return {
      success: true,
      message: 'Return request submitted to supplier & compliance desk.',
      data: order,
      returns: createdReturns,
    };
  }
}
