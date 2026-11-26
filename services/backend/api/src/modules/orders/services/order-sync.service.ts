import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Order, VendorInvoice, VendorOrder, VendorSettlement } from '@buildora/types';
import { dbStore } from '../../../database/store';
import {
  PlatformOrderModel,
  PlatformProductModel,
  PlatformSettlementModel,
  PlatformStockMovementModel,
  VendorInvoiceModel,
  platformPersistenceService,
} from '../../../database/platform-persistence.service';
import { companyAdminDataService } from '../../company-admin/services/company-admin-data.service';
import { platformNotificationService } from '../../notifications/platform-notification.service';
import { isProductCustomerVisible } from '../../products/controllers/products.controller';
import { realtimeBus } from '../../realtime/realtime-bus';
import {
  DEFAULT_TENANT_ID,
  DEFAULT_VENDOR_ID,
  syncVendorProductToCustomerCatalog,
  vendorInvoices,
  vendorOrders,
  vendorProducts,
  vendorRecords,
  vendorSettlements,
  vendorStockMovements,
  vendorWarehouses,
} from '../../vendors/controllers/vendor.controller';

function resolveProductWarehouseMeta(product: any, vendorId: string) {
  const whId = product?.warehouseId || '';
  const wh =
    vendorWarehouses.find((w: any) => w.id === whId) ||
    vendorWarehouses.find((w: any) => w.vendorId === vendorId && w.isPrimary) ||
    vendorWarehouses.find((w: any) => w.vendorId === vendorId) ||
    vendorWarehouses[0];
  return {
    warehouseId: wh?.id || whId || 'wh-default',
    warehouseName: wh?.name || product?.warehouseLocation || 'Primary Fulfillment Hub',
  };
}

export const ALLOWED_VENDOR_ORDER_TRANSITIONS: Record<string, string[]> = {
  NEW: ['ACCEPTED', 'REJECTED', 'CANCELLED', 'PROCESSING'],
  ACCEPTED: ['PROCESSING', 'PACKED', 'READY_FOR_DISPATCH', 'CANCELLED'],
  PROCESSING: ['PACKED', 'READY_FOR_DISPATCH', 'DISPATCHED', 'CANCELLED'],
  PACKED: ['READY_FOR_DISPATCH', 'DISPATCHED', 'CANCELLED'],
  READY_FOR_DISPATCH: ['DISPATCHED', 'CANCELLED'],
  DISPATCHED: ['DELIVERED', 'RETURN_REQUESTED'],
  DELIVERED: ['RETURN_REQUESTED', 'RETURNED'],
  RETURN_REQUESTED: ['RETURNED'],
  REJECTED: [],
  CANCELLED: [],
  RETURNED: [],
};

class OrderSyncService {
  findVendorProductMatch(productId: string, sku?: string) {
    return vendorProducts.find(
      (vp) =>
        vp.id === productId ||
        vp.id === `vp-${productId}` ||
        vp.id.replace(/^vp-/, '') === productId ||
        (sku && vp.sku === sku)
    ) as any;
  }

  findCustomerProductMatch(productId: string, sku?: string) {
    return dbStore.products.find(
      (p) =>
        p.id === productId ||
        `vp-${p.id}` === productId ||
        p.id === productId.replace(/^vp-/, '') ||
        (sku && p.sku === sku)
    ) as any;
  }

  assertCustomerNotSuspended(customerId?: string, phone?: string) {
    const cleanPhone = (phone || '').replace(/\D/g, '').slice(-10);
    for (const c of companyAdminDataService.customers.values()) {
      if (
        (customerId && c.id === customerId) ||
        (cleanPhone && c.phone === cleanPhone)
      ) {
        if (c.status === 'BLOCKED' || (c.status as string) === 'SUSPENDED') {
          throw new ForbiddenException(
            'Your account is currently suspended and cannot place orders. Contact support.'
          );
        }
      }
    }
  }

  async reserveOrDeductItems(
    items: Array<{ productId: string; variantId?: string; quantity: number }>,
    reserveOnly: boolean,
    orderNumber: string
  ) {
    // 1. Atomic pre-validation pass across every line item before any mutation
    const resolvedLines: Array<{
      custProd: any;
      vendProd: any;
      variantId?: string;
      qty: number;
      vendorId: string;
    }> = [];

    for (const item of items) {
      const qty = Math.max(1, Number(item.quantity || 1));
      const custProd = this.findCustomerProductMatch(item.productId);
      const vendProd = this.findVendorProductMatch(item.productId, custProd?.sku);

      const effectiveProd = custProd || vendProd;
      if (!effectiveProd || !isProductCustomerVisible(effectiveProd)) {
        throw new BadRequestException(
          `Product "${effectiveProd?.name || item.productId}" is unavailable, draft, pending approval, or suspended.`
        );
      }

      const vendorId = effectiveProd.vendorId || vendProd?.vendorId || DEFAULT_VENDOR_ID;
      const vendor = vendorRecords.get(vendorId);
      if (vendor && vendor.status !== 'APPROVED' && (vendor.status as string) !== 'ACTIVE') {
        throw new BadRequestException(
          `Supplier for "${effectiveProd.name}" is currently unavailable (${vendor.status}).`
        );
      }

      const totalStock = Number(vendProd?.stockCount ?? custProd?.stockCount ?? 0);
      const reservedStock = Number(vendProd?.reservedStock ?? custProd?.reservedStock ?? 0);
      let availableStock = Math.max(0, totalStock - reservedStock);

      if (item.variantId && Array.isArray(effectiveProd.variants)) {
        const vr = effectiveProd.variants.find((v: any) => v.id === item.variantId);
        if (!vr || vr.isAvailable === false) {
          throw new BadRequestException(`Selected variant for "${effectiveProd.name}" is unavailable.`);
        }
        availableStock = Math.min(availableStock, Number(vr.stock ?? availableStock));
      }

      if (qty > availableStock) {
        throw new BadRequestException(
          `Insufficient stock for "${effectiveProd.name}". Only ${availableStock} unit(s) remaining.`
        );
      }

      resolvedLines.push({ custProd, vendProd, variantId: item.variantId, qty, vendorId });
    }

    // 2. Apply atomic stock mutation now that all checks passed
    const nowIso = new Date().toISOString();
    for (const line of resolvedLines) {
      const { custProd, vendProd, variantId, qty, vendorId } = line;
      const primary = vendProd || custProd;
      const prevStock = Number(primary.stockCount ?? 0);
      const prevReserved = Number(primary.reservedStock ?? 0);

      if (reserveOnly) {
        const nextReserved = prevReserved + qty;
        if (vendProd) {
          vendProd.reservedStock = nextReserved;
          vendProd.inStock = Math.max(0, vendProd.stockCount - nextReserved) > 0;
          vendProd.updatedAt = nowIso;
        }
        if (custProd) {
          custProd.reservedStock = nextReserved;
          custProd.inStock = Math.max(0, custProd.stockCount - nextReserved) > 0;
        }
      } else {
        const nextStock = Math.max(0, prevStock - qty);
        if (vendProd) {
          vendProd.stockCount = nextStock;
          vendProd.stock = nextStock;
          vendProd.inStock = Math.max(0, nextStock - prevReserved) > 0;
          vendProd.updatedAt = nowIso;
        }
        if (custProd) {
          custProd.stockCount = nextStock;
          custProd.inStock = Math.max(0, nextStock - prevReserved) > 0;
        }
      }

      if (variantId) {
        for (const holder of [custProd, vendProd].filter(Boolean)) {
          const v = (holder.variants || []).find((vr: any) => vr.id === variantId);
          if (v && !reserveOnly) {
            v.stock = Math.max(0, Number(v.stock || 0) - qty);
            v.inStock = v.stock > 0;
          }
        }
      }

      if (vendProd) {
        syncVendorProductToCustomerCatalog(vendProd);
        await platformPersistenceService.upsert(PlatformProductModel, vendProd);
      }

      const afterStock = vendProd ? vendProd.stockCount : custProd.stockCount;
      const whMeta = resolveProductWarehouseMeta(primary, vendorId);
      const movement: any = {
        id: `sm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        vendorId,
        productId: primary.id,
        productName: primary.name,
        sku: primary.sku,
        warehouseId: whMeta.warehouseId,
        warehouseName: whMeta.warehouseName,
        type: reserveOnly ? 'ADJUSTMENT' : 'OUTWARD',
        quantityDelta: reserveOnly ? 0 : -qty,
        quantityBefore: prevStock,
        quantityAfter: afterStock,
        reason: reserveOnly
          ? `Stock reserved (${qty} units) for pending online payment #${orderNumber}`
          : `Deducted for confirmed order #${orderNumber}`,
        referenceNumber: orderNumber,
        performedBy: 'Checkout Engine',
        createdAt: nowIso,
      };
      vendorStockMovements.unshift(movement);
      await platformPersistenceService.upsert(PlatformStockMovementModel, movement);

      const effectiveAvail = Math.max(0, afterStock - Number(primary.reservedStock || 0));
      realtimeBus.emitPublic('inventory.updated', {
        productId: primary.id,
        sku: primary.sku,
        stockCount: afterStock,
        availableStock: effectiveAvail,
        inStock: effectiveAvail > 0,
      });
      realtimeBus.emitVendorAndAdmin(vendorId, 'inventory.updated', {
        productId: primary.id,
        sku: primary.sku,
        stockCount: afterStock,
        availableStock: effectiveAvail,
        movement,
      });

      const threshold = Number(primary.lowStockThreshold ?? 10);
      if (effectiveAvail <= threshold) {
        await platformNotificationService.dispatch({
          recipientRole: 'VENDOR',
          recipientId: vendorId,
          type: 'STOCK',
          title: effectiveAvail === 0 ? `Out of Stock: ${primary.name}` : `Low Stock Alert: ${primary.name}`,
          message: `Order #${orderNumber} left ${effectiveAvail} available unit(s) for SKU ${primary.sku}.`,
          severity: effectiveAvail === 0 ? 'CRITICAL' : 'WARNING',
          actionUrl: '/inventory',
          metadata: { productId: primary.id, availableStock: effectiveAvail },
        });
      }
    }

    return resolvedLines;
  }

  async commitReservedOrderStock(order: any) {
    if (!order?.items?.length || !order.stockReservedOnly) return;
    const nowIso = new Date().toISOString();

    for (const item of order.items) {
      const qty = Math.max(1, Number(item.quantity || 1));
      const custProd = this.findCustomerProductMatch(item.productId, item.sku);
      const vendProd = this.findVendorProductMatch(item.productId, item.sku || custProd?.sku);
      const primary = vendProd || custProd;
      if (!primary) continue;

      const before = Number(primary.stockCount ?? 0);
      const nextStock = Math.max(0, before - qty);
      const nextReserved = Math.max(0, Number(primary.reservedStock ?? 0) - qty);

      if (vendProd) {
        vendProd.stockCount = nextStock;
        vendProd.stock = nextStock;
        vendProd.reservedStock = nextReserved;
        vendProd.inStock = Math.max(0, nextStock - nextReserved) > 0;
        vendProd.updatedAt = nowIso;
        syncVendorProductToCustomerCatalog(vendProd);
        await platformPersistenceService.upsert(PlatformProductModel, vendProd);
      }
      if (custProd) {
        custProd.stockCount = nextStock;
        custProd.reservedStock = nextReserved;
        custProd.inStock = Math.max(0, nextStock - nextReserved) > 0;
      }

      if (item.variantId) {
        for (const holder of [custProd, vendProd].filter(Boolean)) {
          const v = (holder.variants || []).find((vr: any) => vr.id === item.variantId);
          if (v) {
            v.stock = Math.max(0, Number(v.stock || 0) - qty);
            v.inStock = v.stock > 0;
          }
        }
      }

      const vendorId = primary.vendorId || DEFAULT_VENDOR_ID;
      const whMeta = resolveProductWarehouseMeta(primary, vendorId);
      const movement: any = {
        id: `sm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        vendorId,
        productId: primary.id,
        productName: primary.name,
        sku: primary.sku,
        warehouseId: whMeta.warehouseId,
        warehouseName: whMeta.warehouseName,
        type: 'OUTWARD',
        quantityDelta: -qty,
        quantityBefore: before,
        quantityAfter: nextStock,
        reason: `Reserved stock committed after payment confirmation (#${order.orderNumber})`,
        referenceNumber: order.orderNumber,
        performedBy: 'Payment Verification',
        createdAt: nowIso,
      };
      vendorStockMovements.unshift(movement);
      await platformPersistenceService.upsert(PlatformStockMovementModel, movement);

      const avail = Math.max(0, nextStock - nextReserved);
      realtimeBus.emitPublic('inventory.updated', {
        productId: primary.id,
        sku: primary.sku,
        stockCount: nextStock,
        availableStock: avail,
        inStock: avail > 0,
      });
    }

    order.stockReservedOnly = false;
    order.paymentStatus = 'PAID';
    await platformPersistenceService.upsert(PlatformOrderModel, order);
  }

  async releaseOrderStock(order: any, reason: string) {
    if (!order?.items?.length || order.stockReleased) return;
    const nowIso = new Date().toISOString();
    const wasReservedOnly = Boolean(order.stockReservedOnly);

    for (const item of order.items) {
      const qty = Math.max(1, Number(item.quantity || 1));
      const custProd = this.findCustomerProductMatch(item.productId, item.sku);
      const vendProd = this.findVendorProductMatch(item.productId, item.sku || custProd?.sku);
      const primary = vendProd || custProd;
      if (!primary) continue;

      const before = Number(primary.stockCount ?? 0);
      const prevReserved = Number(primary.reservedStock ?? 0);

      if (wasReservedOnly) {
        const nextReserved = Math.max(0, prevReserved - qty);
        if (vendProd) {
          vendProd.reservedStock = nextReserved;
          vendProd.inStock = Math.max(0, vendProd.stockCount - nextReserved) > 0;
          vendProd.updatedAt = nowIso;
        }
        if (custProd) {
          custProd.reservedStock = nextReserved;
          custProd.inStock = Math.max(0, custProd.stockCount - nextReserved) > 0;
        }
      } else {
        const nextStock = before + qty;
        if (vendProd) {
          vendProd.stockCount = nextStock;
          vendProd.stock = nextStock;
          vendProd.inStock = Math.max(0, nextStock - prevReserved) > 0;
          vendProd.updatedAt = nowIso;
        }
        if (custProd) {
          custProd.stockCount = nextStock;
          custProd.inStock = Math.max(0, nextStock - prevReserved) > 0;
        }
        if (item.variantId) {
          for (const holder of [custProd, vendProd].filter(Boolean)) {
            const v = (holder.variants || []).find((vr: any) => vr.id === item.variantId);
            if (v) {
              v.stock = Number(v.stock || 0) + qty;
              v.inStock = true;
            }
          }
        }
      }

      if (vendProd) {
        syncVendorProductToCustomerCatalog(vendProd);
        await platformPersistenceService.upsert(PlatformProductModel, vendProd);
      }

      const vendorId = primary.vendorId || DEFAULT_VENDOR_ID;
      const after = vendProd ? vendProd.stockCount : custProd.stockCount;
      const whMeta = resolveProductWarehouseMeta(primary, vendorId);
      const movement: any = {
        id: `sm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        vendorId,
        productId: primary.id,
        productName: primary.name,
        sku: primary.sku,
        warehouseId: whMeta.warehouseId,
        warehouseName: whMeta.warehouseName,
        type: 'RETURN',
        quantityDelta: wasReservedOnly ? 0 : qty,
        quantityBefore: before,
        quantityAfter: after,
        reason,
        referenceNumber: order.orderNumber,
        performedBy: 'Order Sync Engine',
        createdAt: nowIso,
      };
      vendorStockMovements.unshift(movement);
      await platformPersistenceService.upsert(PlatformStockMovementModel, movement);

      const avail = Math.max(0, after - Number(primary.reservedStock || 0));
      realtimeBus.emitPublic('inventory.updated', {
        productId: primary.id,
        sku: primary.sku,
        stockCount: after,
        availableStock: avail,
        inStock: avail > 0,
      });
    }

    order.stockReleased = true;
    order.stockReservedOnly = false;
    await platformPersistenceService.upsert(PlatformOrderModel, order);
  }

  async splitAndCreateVendorOrders(order: any, tenantId = DEFAULT_TENANT_ID) {
    const byVendor = new Map<string, any[]>();
    for (const item of order.items || []) {
      const custProd = this.findCustomerProductMatch(item.productId, item.sku);
      const vendProd = this.findVendorProductMatch(item.productId, item.sku || custProd?.sku);
      const vendorId = item.vendorId || vendProd?.vendorId || custProd?.vendorId || DEFAULT_VENDOR_ID;
      const list = byVendor.get(vendorId) || [];
      list.push({ ...item, vendorId, gstRate: item.gstRate ?? vendProd?.gstRate ?? custProd?.gstRate ?? 18 });
      byVendor.set(vendorId, list);
    }

    const createdVendorOrders: VendorOrder[] = [];
    const addr = order.deliveryAddress || {};
    const addressText =
      typeof addr === 'string'
        ? addr
        : [addr.building, addr.street, addr.area, addr.city, addr.pincode].filter(Boolean).join(', ');

    for (const [vendorId, items] of byVendor.entries()) {
      const tenantCfg = companyAdminDataService.getTenantConfig(tenantId);
      const vendorRec = vendorRecords.get(vendorId) as any;
      const commissionRatePercent = Number(
        vendorRec?.commissionRate ?? tenantCfg?.paymentConfig?.platformCommissionPercent ?? 6
      );
      const defaultGstRate = Number(tenantCfg?.taxConfig?.defaultGstRate ?? 18);

      const subtotal = items.reduce(
        (sum, it) => sum + Number(it.unitPrice ?? it.price ?? 0) * Number(it.quantity ?? 1),
        0
      );
      const gstAmount = Math.round(
        items.reduce((sum, it) => {
          const line = Number(it.unitPrice ?? it.price ?? 0) * Number(it.quantity ?? 1);
          return sum + (line * Number(it.gstRate ?? defaultGstRate)) / 100;
        }, 0)
      );
      const platformFee = Math.round((subtotal * commissionRatePercent) / 100);
      const netPayout = Math.max(0, subtotal - platformFee);

      const vOrder: VendorOrder & Record<string, any> = {
        id: `vord-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        parentOrderId: order.id,
        customerOrderId: order.id,
        orderNumber: order.orderNumber,
        vendorId,
        tenantId,
        customerId: order.customerId,
        customerName: order.customerName || addr.recipientName || 'Site Customer',
        customerPhone: order.customerPhone || addr.mobile || '',
        deliveryAddress:
          typeof addr === 'object'
            ? addr
            : {
                id: 'addr-order',
                type: 'WORK',
                recipientName: order.customerName || 'Site Customer',
                mobile: order.customerPhone || '',
                building: addressText,
                street: '',
                area: '',
                city: 'Bengaluru',
                state: 'Karnataka',
                pincode: '560001',
                fullAddress: addressText,
                isDefault: true,
              },
        deliveryAddressText: addressText,
        pincode: addr.pincode || '560001',
        deliveryOption: order.deliverySpeed || 'ASAP_60',
        deliverySpeed: order.deliverySpeed || 'ASAP_60',
        items: items.map((it) => {
          const unitPrice = Number(it.unitPrice ?? it.price ?? 0);
          const quantity = Number(it.quantity || 1);
          const lineSubtotal = unitPrice * quantity;
          const gstAmt = Math.round((lineSubtotal * Number(it.gstRate ?? defaultGstRate)) / 100);
          const commAmt = Math.round((lineSubtotal * commissionRatePercent) / 100);
          return {
            productId: it.productId,
            variantId: it.variantId,
            sku: it.sku || '',
            name: it.name,
            image: it.image || '',
            quantity,
            unitPrice,
            gstAmount: gstAmt,
            totalPrice: lineSubtotal,
            totalAmount: lineSubtotal + gstAmt,
            commissionRate: commissionRatePercent,
            commissionAmount: commAmt,
            netPayout: Math.max(0, lineSubtotal - commAmt),
            unit: it.unit || 'Unit',
            packSize: it.packSize || 'Standard',
          };
        }),
        subtotal,
        gstTotal: gstAmount,
        gstAmount,
        commissionTotal: platformFee,
        deliveryCharge: order.deliveryFee || 0,
        platformFee,
        netPayout,
        totalAmount: subtotal + gstAmount,
        paymentMethod: order.paymentMethod || 'COD',
        paymentStatus: order.paymentStatus || (order.paymentMethod === 'COD' ? 'PENDING' : 'PAID'),
        status: 'NEW',
        createdAt: order.createdAt || new Date().toISOString(),
        timeline: [
          {
            status: 'NEW',
            title: 'New Customer Order Received',
            description: `Customer order #${order.orderNumber} allocated for vendor fulfillment.`,
            timestamp: new Date().toISOString(),
          },
        ],
      };

      vendorOrders.unshift(vOrder);
      createdVendorOrders.push(vOrder);
      await platformPersistenceService.upsert(PlatformOrderModel, vOrder);

      await platformNotificationService.dispatch({
        tenantId,
        recipientRole: 'VENDOR',
        recipientId: vendorId,
        type: 'ORDER',
        title: `New Order #${order.orderNumber}`,
        message: `${items.length} line item(s) worth ₹${subtotal.toLocaleString()} awaiting confirmation.`,
        severity: 'INFO',
        actionUrl: '/orders',
        metadata: { orderId: vOrder.id, orderNumber: order.orderNumber },
      });

      realtimeBus.emitToVendor(vendorId, 'order.created', { order: vOrder }, tenantId);
    }

    order.vendorSplits = createdVendorOrders.map((vo) => ({
      vendorOrderId: vo.id,
      vendorId: vo.vendorId,
      status: vo.status,
      subtotal: vo.subtotal,
    }));

    return createdVendorOrders;
  }

  async syncVendorOrderStatusToCustomer(
    vendorOrder: VendorOrder & Record<string, any>,
    nextVendorStatus: string,
    note?: string
  ) {
    const allowed = ALLOWED_VENDOR_ORDER_TRANSITIONS[vendorOrder.status] || [];
    if (nextVendorStatus !== vendorOrder.status && !allowed.includes(nextVendorStatus)) {
      throw new BadRequestException(
        `Invalid order state transition from ${vendorOrder.status} to ${nextVendorStatus}.`
      );
    }

    const nowIso = new Date().toISOString();
    vendorOrder.status = nextVendorStatus as any;
    vendorOrder.updatedAt = nowIso;
    if (!Array.isArray(vendorOrder.timeline)) vendorOrder.timeline = [];
    vendorOrder.timeline.push({
      status: nextVendorStatus as any,
      title: `Vendor status: ${nextVendorStatus}`,
      description: note || `Order moved to ${nextVendorStatus}`,
      timestamp: nowIso,
    });
    await platformPersistenceService.upsert(PlatformOrderModel, vendorOrder);

    const custStatusMap: Record<string, Order['status']> = {
      NEW: 'ORDER_PLACED',
      ACCEPTED: 'CONFIRMED',
      PROCESSING: 'CONFIRMED',
      PACKED: 'PACKED',
      READY_FOR_DISPATCH: 'PACKED',
      DISPATCHED: 'OUT_FOR_DELIVERY',
      DELIVERED: 'DELIVERED',
      REJECTED: 'CANCELLED',
      CANCELLED: 'CANCELLED',
    };

    const custOrder = dbStore.orders.find(
      (o) =>
        o.id === vendorOrder.parentOrderId ||
        o.orderNumber === vendorOrder.orderNumber ||
        o.id === vendorOrder.id
    ) as any;

    if (custOrder) {
      const siblingOrders = vendorOrders.filter(
        (vo) => vo.orderNumber === vendorOrder.orderNumber
      );

      // Compute aggregate status if multi-vendor
      let aggregateStatus: string = custStatusMap[nextVendorStatus] || nextVendorStatus;
      if (siblingOrders.length > 1) {
        const allCancelled = siblingOrders.every(
          (vo) => vo.status === 'CANCELLED' || vo.status === 'REJECTED'
        );
        const allDelivered = siblingOrders.every((vo) => vo.status === 'DELIVERED');
        if (allCancelled) aggregateStatus = 'CANCELLED';
        else if (allDelivered) aggregateStatus = 'DELIVERED';
        else if (siblingOrders.some((vo) => vo.status === 'DISPATCHED')) aggregateStatus = 'OUT_FOR_DELIVERY';
        else if (siblingOrders.some((vo) => vo.status === 'PACKED' || vo.status === 'READY_FOR_DISPATCH')) aggregateStatus = 'PACKED';
        else if (siblingOrders.some((vo) => vo.status === 'ACCEPTED' || vo.status === 'PROCESSING')) aggregateStatus = 'CONFIRMED';
      }

      custOrder.status = aggregateStatus;
      custOrder.updatedAt = nowIso;
      if (!Array.isArray(custOrder.timeline)) custOrder.timeline = [];
      custOrder.timeline.push({
        status: aggregateStatus,
        title: `Order ${nextVendorStatus.replace(/_/g, ' ')}`,
        description: note || `Supplier update: ${nextVendorStatus}`,
        timestamp: nowIso,
        completed: true,
      });

      if (nextVendorStatus === 'DELIVERED' && custOrder.paymentMethod === 'COD') {
        custOrder.paymentStatus = 'PAID';
        vendorOrder.paymentStatus = 'PAID';
      }

      // Generate invoice & settlement accrual on DELIVERED if not created yet
      if (nextVendorStatus === 'DELIVERED') {
        await this.ensureDeliveredFinancials(vendorOrder, custOrder);
      }

      // Release stock & refund wallet if REJECTED/CANCELLED by vendor
      if ((nextVendorStatus === 'REJECTED' || nextVendorStatus === 'CANCELLED') && siblingOrders.every((vo) => vo.status === 'CANCELLED' || vo.status === 'REJECTED')) {
        await this.releaseOrderStock(
          custOrder,
          `Order #${custOrder.orderNumber} ${nextVendorStatus.toLowerCase()} by supplier`
        );
        if (custOrder.paymentStatus === 'PAID' || (custOrder.walletUsed && custOrder.walletUsed > 0)) {
          const refundAmt = custOrder.paymentStatus === 'PAID'
            ? Number(custOrder.grandTotal || custOrder.payableAmount || custOrder.totalAmount || 0)
            : Number(custOrder.walletUsed || 0);
          if (refundAmt > 0 && !custOrder.refundedOnCancel) {
            custOrder.refundedOnCancel = true;
            dbStore.walletBalance += refundAmt;
            dbStore.walletTransactions.unshift({
              id: `tx-ref-${Date.now()}`,
              customerId: custOrder.customerId,
              referenceNumber: `WRF-${Date.now().toString().slice(-6)}`,
              type: 'CREDIT',
              amount: refundAmt,
              category: 'REFUND',
              status: 'COMPLETED',
              orderId: custOrder.orderNumber,
              description: `Automatic refund for rejected/cancelled order #${custOrder.orderNumber}`,
              createdAt: nowIso,
              balanceAfter: dbStore.walletBalance,
            } as any);
          }
        }
      }

      await platformPersistenceService.upsert(PlatformOrderModel, custOrder);
    }

    const tenantId = vendorOrder.tenantId || DEFAULT_TENANT_ID;
    const customerId = custOrder?.customerId || vendorOrder.customerId;
    if (customerId) {
      await platformNotificationService.dispatch({
        tenantId,
        recipientRole: 'CUSTOMER',
        recipientId: customerId,
        type: 'ORDER',
        title: `Order #${vendorOrder.orderNumber}: ${nextVendorStatus.replace(/_/g, ' ')}`,
        message: note || `Your order status is now ${nextVendorStatus.replace(/_/g, ' ')}.`,
        severity: nextVendorStatus === 'CANCELLED' || nextVendorStatus === 'REJECTED' ? 'WARNING' : 'INFO',
        actionUrl: `/orders/${vendorOrder.orderNumber}`,
        metadata: { orderNumber: vendorOrder.orderNumber, status: nextVendorStatus },
      });
      realtimeBus.emitToCustomer(
        customerId,
        'order.status.updated',
        { orderNumber: vendorOrder.orderNumber, status: custOrder?.status || nextVendorStatus, vendorStatus: nextVendorStatus, order: custOrder },
        tenantId
      );
    }

    realtimeBus.emitVendorAndAdmin(
      vendorOrder.vendorId,
      'order.status.updated',
      { orderId: vendorOrder.id, orderNumber: vendorOrder.orderNumber, status: nextVendorStatus, order: vendorOrder },
      tenantId
    );
  }

  private async ensureDeliveredFinancials(vendorOrder: any, custOrder: any) {
    const existingInv = vendorInvoices.find((i) => i.orderNumber === vendorOrder.orderNumber && i.vendorId === vendorOrder.vendorId);
    if (!existingInv) {
      const gstHalf = Math.round((vendorOrder.gstAmount || 0) / 2);
      const inv: VendorInvoice = {
        id: `inv-${Date.now()}`,
        invoiceNumber: `INV-BLD-${Date.now().toString().slice(-6)}`,
        orderId: vendorOrder.id,
        orderNumber: vendorOrder.orderNumber,
        vendorId: vendorOrder.vendorId,
        customerName: vendorOrder.customerName || 'Customer',
        invoiceDate: new Date().toISOString().split('T')[0],
        subtotal: vendorOrder.subtotal || 0,
        discount: 0,
        taxableAmount: vendorOrder.subtotal || 0,
        cgstAmount: gstHalf,
        sgstAmount: (vendorOrder.gstAmount || 0) - gstHalf,
        igstAmount: 0,
        totalAmount: (vendorOrder.subtotal || 0) + (vendorOrder.gstAmount || 0),
        pdfUrl: `/api/v1/vendor/invoices/${vendorOrder.orderNumber}`,
        status: 'GENERATED',
      };
      vendorInvoices.unshift(inv);
      await platformPersistenceService.upsert(VendorInvoiceModel, inv);
    }

    const existingSettl = vendorSettlements.find(
      (s: any) => s.orderNumber === vendorOrder.orderNumber && s.vendorId === vendorOrder.vendorId
    );
    if (!existingSettl) {
      const tenantCfg = companyAdminDataService.getTenantConfig(vendorOrder.tenantId || DEFAULT_TENANT_ID);
      const vendorRec = vendorRecords.get(vendorOrder.vendorId) as any;
      const commRate = Number(vendorRec?.commissionRate ?? tenantCfg?.paymentConfig?.platformCommissionPercent ?? 6);
      const tdsRate = Number(tenantCfg?.taxConfig?.tdsRate ?? 1);
      const gross = Number(vendorOrder.subtotal || 0);
      const commission = Number(vendorOrder.platformFee || Math.round((gross * commRate) / 100));
      const taxDeductions = Math.round((gross * tdsRate) / 100);
      const netPayable = Math.max(0, gross - commission - taxDeductions);
      const settl: VendorSettlement & Record<string, any> = {
        id: `stl-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        settlementNumber: `SETTL-BLD-${Math.floor(10000 + Math.random() * 90000)}`,
        vendorId: vendorOrder.vendorId,
        orderNumber: vendorOrder.orderNumber,
        period: 'Order Fulfillment Settlement',
        orderCount: 1,
        ordersCount: 1,
        grossRevenue: gross,
        grossAmount: gross,
        platformCommission: commission,
        commissionAmount: commission,
        taxDeductions,
        tdsAmount: taxDeductions,
        netPayable,
        netAmount: netPayable,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      };
      vendorSettlements.unshift(settl);
      await platformPersistenceService.upsert(PlatformSettlementModel, settl);
    }
  }
}

export const orderSyncService = new OrderSyncService();
