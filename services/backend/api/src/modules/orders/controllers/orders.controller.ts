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
import { Res as NestRes } from '@nestjs/common';
import type { Response as ExpressResponse } from 'express';
import { dbStore } from '../../../database/store';
import { Order, VendorReturnRequest } from '@buildora/types';
import { gstInvoiceService } from '../services/gst-invoice.service';
import { fulfilmentLifecycleService } from '../services/fulfilment-lifecycle.service';
import { vendorRecords } from '../../vendors/controllers/vendor.controller';
import { requireCustomer } from '../../../common/customer-auth.util';
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
import { createAuthoritativeOrder } from '../../payments/payment-ledger.service';

@Controller('api/v1/orders')
export class OrdersController {
  private assertOrderAccess(order: any, customerId: string) {
    const isSeedDemo = customerId === 'cust-9876543210' || customerId === 'cust-demo-1';
    const owner = order?.customerId;
    if (owner) {
      if (owner !== customerId) {
        throw new ForbiddenException('You do not have permission to access another customer order.');
      }
      return;
    }
    if (!isSeedDemo) {
      throw new ForbiddenException('You do not have permission to access this order.');
    }
  }

  @Get()
  getOrders(@Headers('authorization') authHeader?: string) {
    const cust = requireCustomer(authHeader);
    const isSeedDemo = cust.sub === 'cust-9876543210' || cust.sub === 'cust-demo-1';
    const rawOrders = dbStore.orders.filter((o: any) =>
      o.customerId ? o.customerId === cust.sub : isSeedDemo
    );
    const orders = rawOrders.map((o: any) => ({
      ...o,
      shipments: fulfilmentLifecycleService.getOrderShipments(o.orderNumber),
      invoices: gstInvoiceService.getOrderInvoices(o.orderNumber, o.id),
      vendorSplits: vendorOrders
        .filter((vo) => vo.orderNumber === o.orderNumber)
        .map((vo: any) => {
          const rec = vendorRecords.get(vo.vendorId);
          return {
            vendorOrderId: vo.id,
            vendorId: vo.vendorId,
            vendorName: rec?.storeName || rec?.businessInfo?.businessName || 'Verified Supplier',
            status: vo.status,
            items: vo.items || [],
            timeline: vo.timeline || [],
            updatedAt: vo.updatedAt,
          };
        }),
    }));
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
    const cust = requireCustomer(authHeader);
    const needle = idOrNumber.trim().toLowerCase();
    const order = dbStore.orders.find(
      (o) => o.id.toLowerCase() === needle || o.orderNumber.toLowerCase() === needle
    ) as any;
    if (!order) {
      throw new NotFoundException(`Order ${idOrNumber} not found`);
    }
    this.assertOrderAccess(order, cust.sub);
    const shipments = fulfilmentLifecycleService.getOrderShipments(order.orderNumber);
    const invoices = gstInvoiceService.getOrderInvoices(order.orderNumber, order.id);
    const splits = vendorOrders
      .filter((vo) => vo.orderNumber === order.orderNumber)
      .map((vo: any) => {
        const rec = vendorRecords.get(vo.vendorId);
        const shipment = shipments.find((s) => s.vendorOrderId === vo.id) || null;
        return {
          vendorOrderId: vo.id,
          vendorId: vo.vendorId,
          vendorName: rec?.storeName || rec?.businessInfo?.businessName || 'Verified Supplier',
          status: vo.status,
          items: vo.items || [],
          timeline: vo.timeline || [],
          updatedAt: vo.updatedAt,
          packingDetails: vo.packingDetails,
          hasShortage: vo.hasShortage,
          shortageReport: vo.shortageReport || [],
          shipment,
          driver: (vo as any).driver || (shipment?.driverName ? { name: shipment.driverName, phone: shipment.driverPhone, vehicleNumber: shipment.vehicleNumber, vehicleType: shipment.vehicleType } : null),
          invoice: invoices.find((inv) => inv.vendorOrderId === vo.id || inv.vendorId === vo.vendorId) || null,
        };
      });
    return {
      success: true,
      data: {
        ...order,
        shipments,
        invoices,
        vendorSplits: splits,
        canCancel: fulfilmentLifecycleService.isPreDispatchStatus(order.status) &&
          !splits.some((s: any) =>
            ['DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(
              String(s.status || '').toUpperCase()
            )
          ),
      },
    };
  }

  @Get(':idOrNumber/track')
  trackOrder(
    @Param('idOrNumber') idOrNumber: string,
    @Headers('authorization') authHeader?: string
  ) {
    const cust = requireCustomer(authHeader);
    const needle = idOrNumber.trim().toLowerCase();
    const order = dbStore.orders.find(
      (o) => o.id.toLowerCase() === needle || o.orderNumber.toLowerCase() === needle
    ) as any;
    if (!order) {
      throw new NotFoundException(`Order ${idOrNumber} not found`);
    }
    this.assertOrderAccess(order, cust.sub);
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
        statusHistory: order.statusHistory || [],
        deliveryPartner: order.deliveryPartner,
        destination: order.deliveryAddress,
        shipments: fulfilmentLifecycleService.getOrderShipments(order.orderNumber),
        invoices: gstInvoiceService.getOrderInvoices(order.orderNumber, order.id),
        vendorSplits: vendorSplits.map((vs: any) => {
          const rec = vendorRecords.get(vs.vendorId);
          return {
            ...vs,
            vendorName: rec?.storeName || rec?.businessInfo?.businessName || vs.vendorName || 'Verified Supplier',
          };
        }),
      },
    };
  }

  @Get(':idOrNumber/details')
  getEnrichedOrderDetails(
    @Param('idOrNumber') idOrNumber: string,
    @Headers('authorization') authHeader?: string
  ) {
    const cust = requireCustomer(authHeader);
    const order = dbStore.orders.find(
      (o) => o.id === idOrNumber || o.orderNumber === idOrNumber
    ) as any;
    if (!order) {
      throw new NotFoundException(`Order ${idOrNumber} not found`);
    }
    this.assertOrderAccess(order, cust.sub);

    const splits = vendorOrders
      .filter((vo) => vo.orderNumber === order.orderNumber)
      .map((vo: any) => {
        const rec = vendorRecords.get(vo.vendorId);
        const shipments = fulfilmentLifecycleService.getOrderShipments(order.orderNumber, vo.id);
        const invoices = gstInvoiceService.getOrderInvoices(order.orderNumber, order.id).filter(
          (inv) => inv.vendorOrderId === vo.id || inv.vendorId === vo.vendorId
        );
        return {
          vendorOrderId: vo.id,
          vendorId: vo.vendorId,
          vendorName: rec?.storeName || rec?.businessInfo?.businessName || 'Verified Supplier',
          legalName: rec?.businessInfo?.businessName,
          vendorCity: rec?.businessInfo?.address?.city || 'Bengaluru',
          status: vo.status,
          items: vo.items || [],
          packingDetails: vo.packingDetails,
          hasShortage: vo.hasShortage,
          shortageReport: vo.shortageReport || [],
          timeline: vo.timeline || [],
          statusHistory: vo.statusHistory || [],
          acceptedAt: vo.acceptedAt,
          pickedAt: vo.pickedAt,
          packedAt: vo.packedAt,
          readyForDispatchAt: vo.readyForDispatchAt,
          dispatchedAt: vo.dispatchedAt,
          deliveredAt: vo.deliveredAt,
          updatedAt: vo.updatedAt,
          shipment: shipments[0] || null,
          driver: (vo as any).driver || (shipments[0]?.driverName ? { name: shipments[0].driverName, phone: shipments[0].driverPhone, vehicleNumber: shipments[0].vehicleNumber, vehicleType: shipments[0].vehicleType } : null),
          invoice: invoices[0] || null,
        };
      });

    const shipments = fulfilmentLifecycleService.getOrderShipments(order.orderNumber);
    const invoices = gstInvoiceService.getOrderInvoices(order.orderNumber, order.id);

    return {
      success: true,
      data: {
        ...order,
        shipments,
        invoices,
        vendorSplits: splits,
        canCancel: fulfilmentLifecycleService.isPreDispatchStatus(order.status) &&
          !splits.some((s: any) =>
            ['DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(
              String(s.status || '').toUpperCase()
            )
          ),
      },
    };
  }

  @Get(':idOrNumber/invoices')
  getOrderInvoices(
    @Param('idOrNumber') idOrNumber: string,
    @Headers('authorization') authHeader?: string
  ) {
    const cust = requireCustomer(authHeader);
    const order = dbStore.orders.find(
      (o) => o.id === idOrNumber || o.orderNumber === idOrNumber
    ) as any;
    if (!order) {
      throw new NotFoundException(`Order ${idOrNumber} not found`);
    }
    this.assertOrderAccess(order, cust.sub);
    const invoices = gstInvoiceService.getOrderInvoices(order.orderNumber, order.id);
    return {
      success: true,
      data: invoices,
    };
  }

  @Get(':idOrNumber/invoices/:invoiceId/pdf')
  async downloadInvoicePdf(
    @Param('idOrNumber') idOrNumber: string,
    @Param('invoiceId') invoiceId: string,
    @NestRes() res: ExpressResponse,
    @Headers('authorization') authHeader?: string
  ) {
    const cust = requireCustomer(authHeader);
    const order = dbStore.orders.find(
      (o) => o.id === idOrNumber || o.orderNumber === idOrNumber
    ) as any;
    if (!order) {
      throw new NotFoundException(`Order ${idOrNumber} not found`);
    }
    this.assertOrderAccess(order, cust.sub);

    let invoices = gstInvoiceService.getOrderInvoices(order.orderNumber, order.id);
    if (invoices.length === 0) {
      // Auto-build tax invoice on demand only for dispatched/delivered splits, otherwise generate preview-safe split
      const splits = vendorOrders.filter((vo) => vo.orderNumber === order.orderNumber);
      for (const vo of splits) {
        await gstInvoiceService.buildVendorGstInvoice(vo as any, order);
      }
      invoices = gstInvoiceService.getOrderInvoices(order.orderNumber, order.id);
    }

    const invoice =
      invoices.find((i) => i.id === invoiceId || i.invoiceNumber === invoiceId) ||
      (invoiceId === 'primary' ? invoices[0] : undefined);
    if (!invoice) {
      throw new NotFoundException(`Invoice ${invoiceId} not found for order ${order.orderNumber}`);
    }

    const pdfBuf = await gstInvoiceService.renderGstInvoicePdfBuffer(invoice);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      'Content-Length': pdfBuf.length,
    });
    res.end(pdfBuf);
  }

  @Get(':idOrNumber/summary/pdf')
  async downloadOrderSummaryPdf(
    @Param('idOrNumber') idOrNumber: string,
    @NestRes() res: ExpressResponse,
    @Headers('authorization') authHeader?: string
  ) {
    const cust = requireCustomer(authHeader);
    const order = dbStore.orders.find(
      (o) => o.id === idOrNumber || o.orderNumber === idOrNumber
    ) as any;
    if (!order) {
      throw new NotFoundException(`Order ${idOrNumber} not found`);
    }
    this.assertOrderAccess(order, cust.sub);

    const splits = vendorOrders.filter((vo) => vo.orderNumber === order.orderNumber).map((vo: any) => {
      const rec = vendorRecords.get(vo.vendorId);
      return {
        vendorOrderId: vo.id,
        vendorId: vo.vendorId,
        vendorName: rec?.storeName || rec?.businessInfo?.businessName || vo.vendorId,
        status: vo.status,
      };
    });
    const invoices = gstInvoiceService.getOrderInvoices(order.orderNumber, order.id);
    const pdfBuf = await gstInvoiceService.renderOrderSummaryPdfBuffer(order, splits, invoices);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Order-Summary-${order.orderNumber}.pdf"`,
      'Content-Length': pdfBuf.length,
    });
    res.end(pdfBuf);
  }

  @Post(':idOrNumber/report-issue')
  async reportOrderIssue(
    @Param('idOrNumber') idOrNumber: string,
    @Body() body: { type: 'DAMAGED' | 'MISSING_ITEM' | 'WRONG_MATERIAL' | 'OTHER'; description: string; affectedSku?: string },
    @Headers('authorization') authHeader?: string
  ) {
    const cust = requireCustomer(authHeader);
    const order = dbStore.orders.find(
      (o) => o.id === idOrNumber || o.orderNumber === idOrNumber
    ) as any;
    if (!order) {
      throw new NotFoundException(`Order ${idOrNumber} not found`);
    }
    this.assertOrderAccess(order, cust.sub);
    if (!body?.description || body.description.trim().length < 5) {
      throw new BadRequestException('Please describe the damaged or missing material issue (min 5 chars).');
    }
    const nowIso = new Date().toISOString();
    order.issueReported = {
      type: body.type || 'DAMAGED',
      description: body.description.trim(),
      affectedSku: body.affectedSku,
      reportedBy: cust.sub,
      reportedAt: nowIso,
      status: 'OPEN',
    };
    order.updatedAt = nowIso;
    await platformPersistenceService.upsert(PlatformOrderModel, order);

    await platformNotificationService.dispatch({
      tenantId: order.tenantId || DEFAULT_TENANT_ID,
      recipientRole: 'ADMIN',
      recipientId: 'TENANT_ADMIN',
      type: 'ORDER',
      title: `Delivery Issue Reported #${order.orderNumber}`,
      message: `${body.type || 'DAMAGED'}: ${body.description.trim()}`,
      severity: 'WARNING',
      actionUrl: '/orders',
      metadata: { orderNumber: order.orderNumber, type: body.type },
    });

    return {
      success: true,
      message: 'Delivery issue logged with Buildora Quality & Claims Desk.',
      data: order.issueReported,
    };
  }

  @Post()
  async createOrder(
    @Body() body: any,
    @Headers('authorization') authHeader?: string,
    @Headers('idempotency-key') idempotencyHeader?: string,
    @Headers('x-tenant-id') headerTenantId?: string
  ) {
    const cust = requireCustomer(authHeader);
    const customerId = cust.sub;
    const customerPhone = cust.phone || body.deliveryAddress?.mobile || '';
    const tenantId = headerTenantId || cust.tenantId || DEFAULT_TENANT_ID;
    const idemKey = idempotencyHeader || body.idempotencyKey;

    if (!Array.isArray(body.items) || body.items.length === 0) {
      throw new BadRequestException('Order items array is required.');
    }

    const paymentMethod = body.paymentMethod || 'COD';
    const reserveOnly = Boolean(body.reserveOnly && paymentMethod !== 'COD');

    const result = await createAuthoritativeOrder({
      body: {
        items: body.items,
        couponCode: body.couponCode || null,
        deliverySpeed: body.deliverySpeed || body.deliveryOption || 'ASAP_60',
        deliveryAddress: body.deliveryAddress,
        isBusinessOrder: body.isBusinessOrder,
        gstin: body.gstin,
        companyName: body.companyName,
        unloadingOptions: body.unloadingOptions,
        walletBalanceToUse: body.walletBalanceToUse ?? body.walletUsed ?? 0,
        estimatedDeliveryTime: body.estimatedDeliveryTime,
      },
      customerId,
      customerPhone,
      customerName: cust?.name || body.deliveryAddress?.recipientName || 'Buildora Customer',
      customerEmail: cust?.email || body.customerEmail,
      tenantId,
      idempotencyKey: idemKey,
      paymentMethod,
      reserveOnly,
    });

    return {
      success: true,
      duplicatePrevented: result.duplicatePrevented || undefined,
      data: result.order,
    };
  }

  @Post(':id/cancel')
  async cancelOrder(
    @Param('id') id: string,
    @Body() body?: { reason?: string },
    @Headers('authorization') authHeader?: string
  ) {
    const cust = requireCustomer(authHeader);
    const order = dbStore.orders.find((o) => o.id === id || o.orderNumber === id) as any;
    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }
    this.assertOrderAccess(order, cust.sub);

    const siblingVOs = vendorOrders.filter((vo) => vo.orderNumber === order.orderNumber);
    const anyDispatched = siblingVOs.some((vo) =>
      ['DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(
        String(vo.status || '').toUpperCase()
      )
    );
    if (!fulfilmentLifecycleService.isPreDispatchStatus(order.status) || anyDispatched) {
      return {
        success: false,
        message:
          'Direct cancellation is allowed only before dispatch. This order is already dispatched or delivered—please submit a Return request upon delivery.',
      };
    }

    // Issue Credit Notes for any finalized GST invoices linked to cancelled order
    const existingInvoices = gstInvoiceService.getOrderInvoices(order.orderNumber, order.id);
    for (const inv of existingInvoices) {
      await gstInvoiceService.issueCreditNote(inv, body?.reason || 'Customer Pre-Dispatch Cancellation');
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
    const cust = requireCustomer(authHeader);
    const order = dbStore.orders.find((o) => o.id === id || o.orderNumber === id) as any;
    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }
    this.assertOrderAccess(order, cust.sub);

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
