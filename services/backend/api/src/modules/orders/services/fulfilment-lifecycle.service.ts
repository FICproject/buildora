import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  Order,
  OrderPackingDetails,
  OrderStatus,
  OrderStatusHistoryEntry,
  ShipmentRecord,
  ShipmentStatus,
  VendorInvoice,
  VendorOrder,
  VendorOrderStatus,
} from '@buildora/types';
import { dbStore } from '../../../database/store';
import {
  DispatchAssignmentModel,
  PlatformOrderModel,
  PlatformShipmentModel,
  platformPersistenceService,
} from '../../../database/platform-persistence.service';
import { companyAdminDataService } from '../../company-admin/services/company-admin-data.service';
import { companyAdminPersistenceService } from '../../company-admin/services/company-admin-persistence.service';
import { platformNotificationService } from '../../notifications/platform-notification.service';
import { realtimeBus } from '../../realtime/realtime-bus';
import { gstInvoiceService } from './gst-invoice.service';

export interface VehicleCapacitySpec {
  code: string;
  label: string;
  maxWeightKg: number;
  suitability: string;
}

export const VEHICLE_CAPACITY_SPECS: VehicleCapacitySpec[] = [
  {
    code: 'TWO_WHEELER',
    label: '2-Wheeler Express',
    maxWeightKg: 25,
    suitability: 'Small hardware, adhesives, switches & fasteners (up to 25 kg)',
  },
  {
    code: 'MINI_TRUCK',
    label: 'Mini Truck',
    maxWeightKg: 800,
    suitability: 'Up to 800 kg (15 cement bags, paint buckets, fittings)',
  },
  {
    code: 'TATA_ACE',
    label: 'Tata Ace',
    maxWeightKg: 1000,
    suitability: 'Up to 1,000 kg (tiles, CPVC pipes, medium site loads)',
  },
  {
    code: 'PICKUP_VEHICLE',
    label: 'Pickup Vehicle',
    maxWeightKg: 1500,
    suitability: 'Up to 1,500 kg (multi-pallet hardware & waterproofing)',
  },
  {
    code: 'LIGHT_COMMERCIAL_VEHICLE',
    label: 'Light Commercial Vehicle',
    maxWeightKg: 3500,
    suitability: 'Up to 3,500 kg (plywood, sanitaryware, bulk site supply)',
  },
  {
    code: 'HEAVY_GOODS_VEHICLE',
    label: 'Heavy Goods Vehicle',
    maxWeightKg: 12000,
    suitability: 'Up to 12,000 kg (bulk cement, TMT steel & project freight)',
  },
];

export function normalizeVehicleType(raw?: string): VehicleCapacitySpec {
  const s = String(raw || 'TATA_ACE')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
  if (s.includes('2W') || s.includes('BIKE') || s.includes('TWO')) {
    return VEHICLE_CAPACITY_SPECS[0];
  }
  if (s.includes('MINI')) return VEHICLE_CAPACITY_SPECS[1];
  if (s.includes('TATA') || s.includes('ACE')) return VEHICLE_CAPACITY_SPECS[2];
  if (s.includes('PICKUP')) return VEHICLE_CAPACITY_SPECS[3];
  if (s.includes('LCV') || s.includes('LIGHT')) return VEHICLE_CAPACITY_SPECS[4];
  if (s.includes('HGV') || s.includes('HEAVY') || s.includes('TRUCK')) {
    return VEHICLE_CAPACITY_SPECS[5];
  }
  return VEHICLE_CAPACITY_SPECS[2];
}

export function estimateItemWeightKg(item: any, catalogProd?: any): number {
  const explicitUnitKg = Number(
    item?.weightKg ?? catalogProd?.weightKg ?? catalogProd?.weight ?? 0
  );
  if (explicitUnitKg > 0) {
    return explicitUnitKg * Math.max(1, Number(item.quantity || 1));
  }
  const text = `${item?.name || ''} ${item?.unit || ''} ${
    catalogProd?.unit || ''
  }`.toLowerCase();
  const qty = Math.max(1, Number(item?.quantity || 1));
  if (text.includes('50 kg') || text.includes('50kg') || text.includes('cement')) {
    return 50 * qty;
  }
  if (text.includes('25 kg') || text.includes('25kg')) return 25 * qty;
  if (text.includes('20 l') || text.includes('20l') || text.includes('20 kg')) {
    return 20 * qty;
  }
  if (text.includes('box') || text.includes('tile')) return 18 * qty;
  if (text.includes('sheet') || text.includes('ply')) return 22 * qty;
  return 4 * qty;
}

export function validateVehicleCapacity(
  vehicleTypeInput: string | undefined,
  totalWeightKg: number
): VehicleCapacitySpec {
  const spec = normalizeVehicleType(vehicleTypeInput);
  if (totalWeightKg > spec.maxWeightKg) {
    const recommended = VEHICLE_CAPACITY_SPECS.filter(
      (v) => v.maxWeightKg >= totalWeightKg
    ).map((v) => `${v.label} (max ${v.maxWeightKg} kg)`);
    throw new BadRequestException(
      `Selected vehicle "${spec.label}" (max ${spec.maxWeightKg} kg) cannot safely carry this ${Math.round(
        totalWeightKg
      )} kg construction load. Assign: ${
        recommended.join(', ') || 'Heavy Goods Vehicle split load'
      }.`
    );
  }
  return spec;
}

interface StoreBindings {
  getVendorOrders: () => (VendorOrder & Record<string, any>)[];
  getVendorProducts: () => any[];
  getVendorRecords: () => Map<string, any>;
  getVendorWarehouses: () => any[];
  getVendorInvoices: () => VendorInvoice[];
  releaseStockForVendorOrder: (vo: VendorOrder & Record<string, any>, reason: string) => Promise<void>;
  ensureFinancials: (vo: VendorOrder & Record<string, any>, master?: Order) => Promise<void>;
}

const PRE_DISPATCH_STATUSES = new Set([
  'ORDER_PLACED',
  'PAYMENT_PENDING',
  'PAYMENT_VERIFIED',
  'NEW',
  'VENDOR_ACCEPTED',
  'PARTIALLY_ACCEPTED',
  'ACCEPTED',
  'CONFIRMED',
  'PICKING_IN_PROGRESS',
  'PACKING_IN_PROGRESS',
  'PROCESSING',
  'PACKED',
  'READY_FOR_DISPATCH',
]);

class FulfilmentLifecycleService {
  private bindings: StoreBindings | null = null;

  registerStores(bindings: StoreBindings) {
    this.bindings = bindings;
  }

  private getBindings(): StoreBindings {
    if (!this.bindings) {
      throw new Error('FulfilmentLifecycleService stores are not registered yet.');
    }
    return this.bindings;
  }

  public isPreDispatchStatus(status?: string): boolean {
    return PRE_DISPATCH_STATUSES.has(String(status || '').toUpperCase());
  }

  public appendHistory(
    target: Record<string, any>,
    entry: {
      previousStatus?: string;
      newStatus: string;
      updatedBy: string;
      role: 'CUSTOMER' | 'VENDOR' | 'ADMIN' | 'DELIVERY_PARTNER' | 'SYSTEM';
      remarks?: string;
      source?: string;
      timestamp?: string;
    }
  ) {
    if (!Array.isArray(target.statusHistory)) {
      target.statusHistory = [];
    }
    const hist: OrderStatusHistoryEntry = {
      previousStatus: entry.previousStatus || String(target.status || 'NEW'),
      newStatus: entry.newStatus,
      updatedBy: entry.updatedBy,
      role: entry.role,
      timestamp: entry.timestamp || new Date().toISOString(),
      remarks: entry.remarks,
      source: entry.source,
    };
    target.statusHistory.push(hist);
  }

  public getOrderShipments(orderNumber: string, vendorOrderId?: string): ShipmentRecord[] {
    return (dbStore.shipments || []).filter(
      (s: ShipmentRecord) =>
        s.orderNumber === orderNumber &&
        (!vendorOrderId || s.vendorOrderId === vendorOrderId)
    );
  }

  public async ensureShipmentForVendorOrder(
    vo: VendorOrder & Record<string, any>,
    masterOrder?: Order & Record<string, any>
  ): Promise<ShipmentRecord> {
    let shipment = (dbStore.shipments || []).find(
      (s: ShipmentRecord) => s.vendorOrderId === vo.id
    ) as ShipmentRecord | undefined;

    if (!shipment) {
      const b = this.getBindings();
      const vendor = b.getVendorRecords().get(vo.vendorId);
      const warehouse = b.getVendorWarehouses().find((w) => w.vendorId === vo.vendorId);
      const totalWeightKg =
        Number(vo.packingDetails?.totalWeightKg || 0) ||
        (vo.items || []).reduce((sum: number, it: any) => {
          const prod = dbStore.products.find(
            (p: any) => p.id === it.productId || p.sku === it.sku
          );
          return sum + estimateItemWeightKg(it, prod);
        }, 0);

      const recommendedVehicle =
        VEHICLE_CAPACITY_SPECS.find((v) => v.maxWeightKg >= totalWeightKg)?.label ||
        'Heavy Goods Vehicle';

      const vendorAddr = vendor?.businessInfo?.address || warehouse || {};
      const pickupAddrStr = [
        warehouse?.name || vendor?.storeName,
        vendorAddr.street || warehouse?.addressLine1,
        vendorAddr.city || warehouse?.city || 'Bengaluru',
        vendorAddr.pincode || warehouse?.pincode,
      ]
        .filter(Boolean)
        .join(', ');

      const shipAddr: any = masterOrder?.deliveryAddress || vo.deliveryAddress || {};
      const dropAddrStr = [
        shipAddr.building || shipAddr.line1 || shipAddr.street,
        shipAddr.area || shipAddr.landmark,
        shipAddr.city,
        shipAddr.state,
        shipAddr.pincode,
      ]
        .filter(Boolean)
        .join(', ');

      const otp = String(Math.floor(1000 + Math.random() * 9000));
      const nowIso = new Date().toISOString();
      shipment = {
        id: `shp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        tenantId: vo.tenantId || masterOrder?.tenantId || 'tenant-buildora-blr',
        orderId: masterOrder?.id || vo.id,
        orderNumber: vo.orderNumber,
        vendorOrderId: vo.id,
        vendorId: vo.vendorId,
        pickupAddress: pickupAddrStr || 'Vendor Dispatch Hub, Bengaluru',
        siteAddress: dropAddrStr || 'Customer Job Site',
        dispatchHub: warehouse?.name || vendor?.storeName || 'Vendor Depot',
        vehicleType: recommendedVehicle,
        packageCount: vo.packingDetails?.packageCount,
        totalWeightKg: Math.round(totalWeightKg * 10) / 10,
        status: 'CREATED',
        deliveryOtp: otp,
        trackingEvents: [
          {
            status: 'CREATED',
            title: 'Packed & Staged for Dispatch',
            description: `Estimated load weight: ${Math.round(totalWeightKg)} kg (${recommendedVehicle})`,
            location: warehouse?.name || vendor?.storeName || 'Vendor Depot',
            timestamp: nowIso,
            actor: vendor?.storeName || 'Vendor',
          },
        ],
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      dbStore.shipments.unshift(shipment);
      vo.shipmentId = shipment.id;
      vo.deliveryOtp = otp;
      await platformPersistenceService.upsert(PlatformShipmentModel, shipment);
      await platformPersistenceService.upsert(PlatformOrderModel, vo);
    }

    return shipment;
  }

  public computeMasterOrderStatus(
    siblingOrders: (VendorOrder & Record<string, any>)[],
    masterOrder: Order & Record<string, any>
  ): OrderStatus {
    if (!siblingOrders || siblingOrders.length === 0) {
      return masterOrder.status;
    }
    const statuses = siblingOrders.map((s) => String(s.status || '').toUpperCase());

    if (statuses.every((s) => s === 'CANCELLED' || s === 'REJECTED')) {
      return 'CANCELLED';
    }
    const active = statuses.filter((s) => s !== 'CANCELLED' && s !== 'REJECTED');
    if (active.length === 0) return 'CANCELLED';

    if (active.every((s) => s === 'COMPLETED')) return 'COMPLETED';
    if (active.every((s) => s === 'DELIVERED' || s === 'COMPLETED')) return 'DELIVERED';
    if (active.some((s) => s === 'DELIVERED' || s === 'COMPLETED')) {
      return 'PARTIALLY_DELIVERED';
    }
    if (active.every((s) => s === 'FAILED_ATTEMPT' || s === 'FAILED_DELIVERY' || s === 'FAILED')) {
      return 'FAILED';
    }
    if (active.every((s) => s === 'OUT_FOR_DELIVERY')) return 'OUT_FOR_DELIVERY';
    if (active.every((s) => s === 'IN_TRANSIT' || s === 'OUT_FOR_DELIVERY')) {
      return 'IN_TRANSIT';
    }
    if (
      active.every((s) =>
        ['DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(s)
      )
    ) {
      return 'DISPATCHED';
    }
    if (
      active.some((s) =>
        ['DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(s)
      )
    ) {
      return 'PARTIALLY_DISPATCHED';
    }
    if (active.every((s) => s === 'READY_FOR_DISPATCH')) {
      return 'READY_FOR_DISPATCH';
    }
    if (active.some((s) => ['PACKING_IN_PROGRESS', 'PACKED'].includes(s))) {
      return 'PACKING_IN_PROGRESS';
    }
    if (active.some((s) => ['PICKING_IN_PROGRESS', 'PROCESSING'].includes(s))) {
      return 'PICKING_IN_PROGRESS';
    }
    if (active.every((s) => ['VENDOR_ACCEPTED', 'ACCEPTED'].includes(s))) {
      return 'VENDOR_ACCEPTED';
    }
    if (active.some((s) => ['VENDOR_ACCEPTED', 'ACCEPTED'].includes(s))) {
      return 'PARTIALLY_ACCEPTED';
    }
    return masterOrder.paymentStatus === 'PAID'
      ? 'PAYMENT_VERIFIED'
      : 'ORDER_PLACED';
  }

  public async recomputeAndBroadcastMasterOrder(
    orderNumber: string,
    actor: { role: 'CUSTOMER' | 'VENDOR' | 'ADMIN' | 'DELIVERY_PARTNER' | 'SYSTEM'; name: string },
    note: string
  ) {
    const b = this.getBindings();
    const masterOrder = dbStore.orders.find(
      (o) => o.orderNumber === orderNumber
    ) as (Order & Record<string, any>) | undefined;
    if (!masterOrder) return;

    const siblings = b
      .getVendorOrders()
      .filter((vo) => vo.orderNumber === orderNumber);
    const nextMasterStatus = this.computeMasterOrderStatus(siblings, masterOrder);
    const prevMasterStatus = String(masterOrder.status || 'ORDER_PLACED');
    const nowIso = new Date().toISOString();

    masterOrder.status = nextMasterStatus;
    masterOrder.updatedAt = nowIso;
    this.appendHistory(masterOrder, {
      previousStatus: prevMasterStatus,
      newStatus: nextMasterStatus,
      updatedBy: actor.name,
      role: actor.role,
      remarks: note,
      timestamp: nowIso,
    });

    if (!Array.isArray(masterOrder.timeline)) masterOrder.timeline = [];
    const lastEntry = masterOrder.timeline[masterOrder.timeline.length - 1];
    if (!lastEntry || lastEntry.status !== nextMasterStatus || lastEntry.description !== note) {
      masterOrder.timeline.push({
        status: nextMasterStatus,
        title: this.formatHumanStatus(nextMasterStatus),
        description: note,
        timestamp: nowIso,
        completed: true,
      });
    }

    await platformPersistenceService.upsert(PlatformOrderModel, masterOrder);

    const tenantId = masterOrder.tenantId || 'tenant-buildora-blr';
    if (masterOrder.customerId) {
      realtimeBus.emitToCustomer(
        masterOrder.customerId,
        'order.status.updated',
        { orderNumber: masterOrder.orderNumber, status: nextMasterStatus, order: masterOrder },
        tenantId
      );
    }
    realtimeBus.emitToAdmin(
      'order.status.updated',
      { orderNumber: masterOrder.orderNumber, status: nextMasterStatus, order: masterOrder },
      tenantId
    );
  }

  public formatHumanStatus(status: string): string {
    const map: Record<string, string> = {
      ORDER_PLACED: 'Order Placed',
      PAYMENT_PENDING: 'Awaiting Payment Verification',
      PAYMENT_VERIFIED: 'Payment Verified / COD Confirmed',
      PARTIALLY_ACCEPTED: 'Partially Accepted by Vendors',
      VENDOR_ACCEPTED: 'Vendor Accepted',
      ACCEPTED: 'Vendor Accepted',
      CONFIRMED: 'Order Confirmed',
      PICKING_IN_PROGRESS: 'Picking Materials at Depot',
      PACKING_IN_PROGRESS: 'Packing & Weight Inspection',
      PACKED: 'Packed & Ready',
      READY_FOR_DISPATCH: 'Ready for Dispatch',
      PARTIALLY_DISPATCHED: 'Partially Dispatched',
      DISPATCHED: 'Handed Over & Dispatched',
      IN_TRANSIT: 'In Transit to Site',
      OUT_FOR_DELIVERY: 'Out for Delivery',
      PARTIALLY_DELIVERED: 'Partially Delivered',
      DELIVERED: 'Delivered to Site',
      COMPLETED: 'Order Completed',
      CANCELLED: 'Cancelled',
      REJECTED: 'Rejected by Vendor',
      FAILED_DELIVERY: 'Delivery Attempt Failed',
      FAILED_ATTEMPT: 'Delivery Attempt Failed',
      PICKED_UP: 'Picked Up from Vendor Depot',
      CREATED: 'Shipment Staged',
      ASSIGNED: 'Vehicle & Driver Assigned',
    };
    return map[String(status).toUpperCase()] || status.replace(/_/g, ' ');
  }

  private getOwnedVendorOrder(vendorId: string, vendorOrderId: string) {
    const b = this.getBindings();
    const anyMatch = b
      .getVendorOrders()
      .find((o) => o.id === vendorOrderId || o.orderNumber === vendorOrderId);
    const owned = b
      .getVendorOrders()
      .find(
        (o) =>
          (o.id === vendorOrderId || o.orderNumber === vendorOrderId) &&
          o.vendorId === vendorId
      );
    if (!owned) {
      if (anyMatch && anyMatch.vendorId !== vendorId) {
        throw new ForbiddenException(
          'Access denied: you cannot modify another vendor order.'
        );
      }
      throw new NotFoundException(`Vendor order ${vendorOrderId} not found.`);
    }
    return owned;
  }

  async vendorAcceptOrder(
    vendorId: string,
    vendorOrderId: string,
    actorName = 'Vendor Manager',
    note?: string
  ) {
    const b = this.getBindings();
    const vo = this.getOwnedVendorOrder(vendorId, vendorOrderId);
    const cur = String(vo.status || '').toUpperCase();
    if (!['NEW', 'ORDER_PLACED', 'PAYMENT_VERIFIED'].includes(cur)) {
      throw new BadRequestException(
        `Cannot accept order from status "${vo.status}".`
      );
    }

    const masterOrder = dbStore.orders.find((o) => o.orderNumber === vo.orderNumber) as any;
    for (const item of vo.items || []) {
      const catProd = dbStore.products.find(
        (p: any) => p.id === item.productId || p.sku === item.sku
      ) as any;
      const vendProd = b
        .getVendorProducts()
        .find((p: any) => p.vendorId === vendorId && (p.id === item.productId || p.sku === item.sku));
      const available = Number(vendProd?.stock ?? catProd?.stockQuantity ?? catProd?.stock ?? 999);
      if (!masterOrder?.stockReserved && available < Number(item.quantity || 1)) {
        throw new BadRequestException(
          `Insufficient live stock for "${item.name}" (available: ${available}, required: ${item.quantity}). Report shortage or reject with reason.`
        );
      }
    }

    const nowIso = new Date().toISOString();
    const prev = vo.status;
    vo.status = 'VENDOR_ACCEPTED';
    vo.acceptedAt = nowIso;
    vo.updatedAt = nowIso;
    this.appendHistory(vo, {
      previousStatus: prev,
      newStatus: 'VENDOR_ACCEPTED',
      updatedBy: actorName,
      role: 'VENDOR',
      remarks: note || 'Vendor verified stock & accepted order for fulfilment.',
      timestamp: nowIso,
    });
    await platformPersistenceService.upsert(PlatformOrderModel, vo);

    await this.recomputeAndBroadcastMasterOrder(
      vo.orderNumber,
      { role: 'VENDOR', name: actorName },
      `Supplier (${vo.vendorName || actorName}) accepted order #${vo.orderNumber}.`
    );

    if (masterOrder?.customerId) {
      await platformNotificationService.dispatch({
        tenantId: vo.tenantId || 'tenant-buildora-blr',
        recipientRole: 'CUSTOMER',
        recipientId: masterOrder.customerId,
        type: 'ORDER',
        title: `Vendor Accepted #${vo.orderNumber}`,
        message: 'Your materials are scheduled for depot picking.',
        severity: 'INFO',
        actionUrl: '/orders',
        metadata: { orderNumber: vo.orderNumber, vendorOrderId: vo.id },
      });
    }
    return vo;
  }

  async vendorRejectOrder(
    vendorId: string,
    vendorOrderId: string,
    reason: string,
    actorName = 'Vendor Manager'
  ) {
    const cleanReason = String(reason || '').trim();
    if (cleanReason.length < 3) {
      throw new BadRequestException(
        'A valid rejection reason is mandatory (minimum 3 characters).'
      );
    }
    const b = this.getBindings();
    const vo = this.getOwnedVendorOrder(vendorId, vendorOrderId);
    const cur = String(vo.status || '').toUpperCase();
    if (!this.isPreDispatchStatus(cur) || ['DISPATCHED', 'IN_TRANSIT', 'DELIVERED'].includes(cur)) {
      throw new BadRequestException(
        `Cannot reject order once it is "${vo.status}".`
      );
    }

    const nowIso = new Date().toISOString();
    const prev = vo.status;
    vo.status = 'REJECTED';
    vo.rejectionReason = cleanReason;
    vo.rejectedAt = nowIso;
    vo.updatedAt = nowIso;
    this.appendHistory(vo, {
      previousStatus: prev,
      newStatus: 'REJECTED',
      updatedBy: actorName,
      role: 'VENDOR',
      remarks: `Rejected by vendor: ${cleanReason}`,
      timestamp: nowIso,
    });
    await platformPersistenceService.upsert(PlatformOrderModel, vo);

    await b.releaseStockForVendorOrder(vo, cleanReason);

    await this.recomputeAndBroadcastMasterOrder(
      vo.orderNumber,
      { role: 'VENDOR', name: actorName },
      `Supplier (${vo.vendorName || vendorId}) rejected split: ${cleanReason}`
    );

    await platformNotificationService.dispatch({
      tenantId: vo.tenantId || 'tenant-buildora-blr',
      recipientRole: 'ADMIN',
      recipientId: 'TENANT_ADMIN',
      type: 'ORDER',
      title: `Vendor Rejected Split #${vo.orderNumber}`,
      message: `${vo.vendorName || vendorId} rejected order #${vo.orderNumber}. Reason: ${cleanReason}`,
      severity: 'WARNING',
      actionUrl: '/orders',
      metadata: { orderNumber: vo.orderNumber, vendorOrderId: vo.id, reason: cleanReason },
    });
    return vo;
  }

  async vendorConfirmPicking(
    vendorId: string,
    vendorOrderId: string,
    payload: {
      pickedItems?: Array<{
        productId: string;
        sku?: string;
        pickedQuantity: number;
        shortageReason?: string;
      }>;
      notes?: string;
    },
    actorName = 'Depot Picker'
  ) {
    const vo = this.getOwnedVendorOrder(vendorId, vendorOrderId);
    const cur = String(vo.status || '').toUpperCase();
    if (!['VENDOR_ACCEPTED', 'ACCEPTED', 'NEW', 'PICKING_IN_PROGRESS'].includes(cur)) {
      throw new BadRequestException(
        `Picking is only valid after acceptance (current status: ${vo.status}).`
      );
    }

    const shortages: Array<{ productId: string; name: string; ordered: number; picked: number; reason: string }> = [];
    if (Array.isArray(payload?.pickedItems) && payload.pickedItems.length > 0) {
      for (const reqItem of payload.pickedItems) {
        const line = (vo.items || []).find(
          (i: any) => i.productId === reqItem.productId || (reqItem.sku && i.sku === reqItem.sku)
        ) as any;
        if (!line) {
          throw new BadRequestException(
            `Silent SKU substitution prohibited: unknown productId "${reqItem.productId}" is not in this order.`
          );
        }
        const pickedQty = Number(reqItem.pickedQuantity ?? line.quantity);
        if (pickedQty < line.quantity) {
          if (!reqItem.shortageReason || !reqItem.shortageReason.trim()) {
            throw new BadRequestException(
              `Shortage reason is required when picked quantity (${pickedQty}) is less than ordered (${line.quantity}) for ${line.name}.`
            );
          }
          line.pickedQuantity = pickedQty;
          line.shortageQuantity = line.quantity - pickedQty;
          line.shortageReason = reqItem.shortageReason.trim();
          shortages.push({
            productId: line.productId,
            name: line.name,
            ordered: line.quantity,
            picked: pickedQty,
            reason: reqItem.shortageReason.trim(),
          });
        } else {
          line.pickedQuantity = line.quantity;
          line.shortageQuantity = 0;
        }
      }
    } else {
      for (const line of vo.items || []) {
        (line as any).pickedQuantity = line.quantity;
      }
    }

    const nowIso = new Date().toISOString();
    const prev = vo.status;
    vo.status = 'PICKING_IN_PROGRESS';
    vo.pickingStartedAt = vo.pickingStartedAt || nowIso;
    vo.pickingCompletedAt = nowIso;
    vo.hasShortage = shortages.length > 0;
    vo.shortageReport = shortages;
    vo.updatedAt = nowIso;

    const noteMsg =
      shortages.length > 0
        ? `Picking recorded with ${shortages.length} shortage flag(s): ${shortages
            .map((s) => `${s.name} (${s.picked}/${s.ordered}: ${s.reason})`)
            .join('; ')}`
        : payload?.notes || 'All ordered construction materials picked and batch-verified.';

    this.appendHistory(vo, {
      previousStatus: prev,
      newStatus: 'PICKING_IN_PROGRESS',
      updatedBy: actorName,
      role: 'VENDOR',
      remarks: noteMsg,
      timestamp: nowIso,
    });
    await platformPersistenceService.upsert(PlatformOrderModel, vo);

    if (shortages.length > 0) {
      await platformNotificationService.dispatch({
        tenantId: vo.tenantId || 'tenant-buildora-blr',
        recipientRole: 'ADMIN',
        recipientId: 'TENANT_ADMIN',
        type: 'ORDER',
        title: `Picking Shortage Alert #${vo.orderNumber}`,
        message: noteMsg,
        severity: 'CRITICAL',
        actionUrl: '/orders',
        metadata: { orderNumber: vo.orderNumber, vendorOrderId: vo.id, shortages },
      });
    }

    await this.recomputeAndBroadcastMasterOrder(
      vo.orderNumber,
      { role: 'VENDOR', name: actorName },
      noteMsg
    );
    return vo;
  }

  async vendorConfirmPacking(
    vendorId: string,
    vendorOrderId: string,
    packing: {
      bags?: number;
      bagCount?: number;
      boxes?: number;
      boxCount?: number;
      bundles?: number;
      bundleCount?: number;
      pieces?: number;
      pieceCount?: number;
      pallets?: number;
      palletCount?: number;
      totalWeightKg: number;
      dimensions?: string;
      fragile?: boolean;
      fragileHandling?: boolean;
      loadingNotes?: string;
      loadingRequirements?: string;
      notes?: string;
      markReadyForDispatch?: boolean;
    },
    actorName = 'Packing Supervisor'
  ) {
    const vo = this.getOwnedVendorOrder(vendorId, vendorOrderId);
    const cur = String(vo.status || '').toUpperCase();
    if (
      ![
        'VENDOR_ACCEPTED',
        'ACCEPTED',
        'PICKING_IN_PROGRESS',
        'PROCESSING',
        'PACKING_IN_PROGRESS',
        'PACKED',
      ].includes(cur)
    ) {
      throw new BadRequestException(
        `Packing cannot be performed in status "${vo.status}".`
      );
    }

    const totalWeightKg = Number(packing?.totalWeightKg || 0);
    if (totalWeightKg <= 0) {
      throw new BadRequestException(
        'Verified shipment totalWeightKg (> 0 kg) is required for vehicle allocation.'
      );
    }

    const bagCount = Number(packing.bagCount ?? packing.bags ?? 0);
    const boxCount = Number(packing.boxCount ?? packing.boxes ?? 0);
    const bundleCount = Number(packing.bundleCount ?? packing.bundles ?? 0);
    const pieceCount = Number(packing.pieceCount ?? packing.pieces ?? 0);
    const palletCount = Number(packing.palletCount ?? packing.pallets ?? 0);
    const packageCount = bagCount + boxCount + bundleCount + pieceCount + palletCount || 1;
    const fragileHandling = Boolean(packing.fragileHandling ?? packing.fragile);
    const loadingRequirements = packing.loadingRequirements || packing.loadingNotes || '';

    const nowIso = new Date().toISOString();
    const cleanPacking: OrderPackingDetails = {
      packageCount,
      bagCount,
      boxCount,
      bundleCount,
      pieceCount,
      palletCount,
      totalWeightKg: Math.round(totalWeightKg * 100) / 100,
      dimensions: packing.dimensions || '',
      fragileHandling,
      loadingRequirements,
      notes: packing.notes || loadingRequirements,
      packedAt: nowIso,
    };

    const prev = vo.status;
    vo.packingDetails = cleanPacking;
    vo.status = packing.markReadyForDispatch
      ? 'READY_FOR_DISPATCH'
      : 'PACKING_IN_PROGRESS';
    vo.packedAt = nowIso;
    vo.updatedAt = nowIso;

    const pkgParts = [
      bagCount ? `${bagCount} bags` : '',
      boxCount ? `${boxCount} boxes` : '',
      bundleCount ? `${bundleCount} bundles` : '',
      pieceCount ? `${pieceCount} pcs` : '',
      palletCount ? `${palletCount} pallets` : '',
    ]
      .filter(Boolean)
      .join(', ');

    const noteMsg = `Packed (${pkgParts || `${packageCount} packages`}) • Total Weight: ${cleanPacking.totalWeightKg} kg${
      fragileHandling ? ' • FRAGILE' : ''
    }.`;

    this.appendHistory(vo, {
      previousStatus: prev,
      newStatus: vo.status,
      updatedBy: actorName,
      role: 'VENDOR',
      remarks: noteMsg,
      timestamp: nowIso,
    });
    await platformPersistenceService.upsert(PlatformOrderModel, vo);

    if (packing.markReadyForDispatch) {
      const masterOrder = dbStore.orders.find(
        (o) => o.orderNumber === vo.orderNumber
      ) as any;
      await this.ensureShipmentForVendorOrder(vo, masterOrder);
    }

    await this.recomputeAndBroadcastMasterOrder(
      vo.orderNumber,
      { role: 'VENDOR', name: actorName },
      noteMsg
    );
    return vo;
  }

  async vendorMarkReadyForDispatch(
    vendorId: string,
    vendorOrderId: string,
    actorName = 'Dispatch Coordinator'
  ) {
    const vo = this.getOwnedVendorOrder(vendorId, vendorOrderId);
    const cur = String(vo.status || '').toUpperCase();
    if (
      ![
        'VENDOR_ACCEPTED',
        'ACCEPTED',
        'PICKING_IN_PROGRESS',
        'PACKING_IN_PROGRESS',
        'PROCESSING',
        'PACKED',
      ].includes(cur)
    ) {
      throw new BadRequestException(
        `Cannot mark Ready for Dispatch from "${vo.status}".`
      );
    }

    const nowIso = new Date().toISOString();
    const prev = vo.status;
    vo.status = 'READY_FOR_DISPATCH';
    vo.readyForDispatchAt = nowIso;
    vo.updatedAt = nowIso;

    const masterOrder = dbStore.orders.find(
      (o) => o.orderNumber === vo.orderNumber
    ) as any;
    const shipment = await this.ensureShipmentForVendorOrder(vo, masterOrder);

    this.appendHistory(vo, {
      previousStatus: prev,
      newStatus: 'READY_FOR_DISPATCH',
      updatedBy: actorName,
      role: 'VENDOR',
      remarks: `Material staged at bay (${shipment.totalWeightKg} kg). Shipment ${shipment.id} ready for vehicle assignment.`,
      timestamp: nowIso,
    });
    await platformPersistenceService.upsert(PlatformOrderModel, vo);

    await platformNotificationService.dispatch({
      tenantId: vo.tenantId || 'tenant-buildora-blr',
      recipientRole: 'ADMIN',
      recipientId: 'TENANT_ADMIN',
      type: 'ORDER',
      title: `Ready for Dispatch #${vo.orderNumber}`,
      message: `${vo.vendorName || vendorId} staged ${shipment.totalWeightKg} kg (${shipment.vehicleType}). Assign vehicle & driver.`,
      severity: 'INFO',
      actionUrl: '/delivery',
      metadata: { orderNumber: vo.orderNumber, vendorOrderId: vo.id, shipmentId: shipment.id },
    });

    await this.recomputeAndBroadcastMasterOrder(
      vo.orderNumber,
      { role: 'VENDOR', name: actorName },
      `Materials packed & ready for vehicle dispatch (${shipment.id}).`
    );
    return { vendorOrder: vo, shipment };
  }

  async vendorHandoverToDriver(
    vendorId: string,
    vendorOrderId: string,
    payload: {
      vehicleNumber?: string;
      driverName?: string;
      driverPhone?: string;
      handoverRef?: string;
      notes?: string;
    },
    actorName = 'Gate Security / Dispatcher'
  ) {
    const vo = this.getOwnedVendorOrder(vendorId, vendorOrderId);
    const cur = String(vo.status || '').toUpperCase();
    if (!['READY_FOR_DISPATCH', 'PACKED', 'PACKING_IN_PROGRESS'].includes(cur)) {
      throw new BadRequestException(
        `Order must be READY_FOR_DISPATCH before driver handover (current: ${vo.status}).`
      );
    }

    const masterOrder = dbStore.orders.find(
      (o) => o.orderNumber === vo.orderNumber
    ) as any;
    const shipment = await this.ensureShipmentForVendorOrder(vo, masterOrder);

    const nowIso = new Date().toISOString();
    const prev = vo.status;
    vo.status = 'DISPATCHED';
    vo.dispatchedAt = nowIso;
    vo.updatedAt = nowIso;

    shipment.status = 'PICKED_UP';
    shipment.dispatchedAt = nowIso;
    if (payload.vehicleNumber) shipment.vehicleNumber = payload.vehicleNumber;
    if (payload.driverName) shipment.driverName = payload.driverName;
    if (payload.driverPhone) shipment.driverPhone = payload.driverPhone;
    if (payload.handoverRef) shipment.dispatchReference = payload.handoverRef;
    shipment.updatedAt = nowIso;
    shipment.trackingEvents.push({
      status: 'PICKED_UP',
      title: 'Dispatched from Vendor Depot',
      location: shipment.pickupAddress,
      description:
        payload.notes ||
        `Handed over to ${shipment.driverName || payload.driverName || 'Assigned Driver'}${
          shipment.vehicleNumber ? ` (${shipment.vehicleNumber})` : ''
        }.`,
      timestamp: nowIso,
      actor: actorName,
    });

    const existingAssign = companyAdminDataService.dispatchAssignments.get(vo.orderNumber);
    if (existingAssign) {
      existingAssign.status = 'PICKED_UP';
      existingAssign.updatedAt = nowIso;
      void companyAdminPersistenceService.upsert(DispatchAssignmentModel, existingAssign);
    }

    await platformPersistenceService.upsert(PlatformShipmentModel, shipment);
    await platformPersistenceService.upsert(PlatformOrderModel, vo);

    const invoice = await gstInvoiceService.buildVendorGstInvoice(vo, masterOrder, {
      vehicleNumber: shipment.vehicleNumber,
      deliveryReference: shipment.id,
    });

    this.appendHistory(vo, {
      previousStatus: prev,
      newStatus: 'DISPATCHED',
      updatedBy: actorName,
      role: 'VENDOR',
      remarks: `Dispatched (${shipment.id}) & GST Invoice ${invoice.invoiceNumber} generated.`,
      timestamp: nowIso,
    });
    await platformPersistenceService.upsert(PlatformOrderModel, vo);

    await this.recomputeAndBroadcastMasterOrder(
      vo.orderNumber,
      { role: 'VENDOR', name: actorName },
      `Dispatched from depot (${shipment.vehicleNumber || shipment.vehicleType}). Tax Invoice ${invoice.invoiceNumber} ready.`
    );

    if (masterOrder?.customerId) {
      await platformNotificationService.dispatch({
        tenantId: vo.tenantId || 'tenant-buildora-blr',
        recipientRole: 'CUSTOMER',
        recipientId: masterOrder.customerId,
        type: 'ORDER',
        title: `Order Dispatched #${vo.orderNumber}`,
        message: `Vehicle ${shipment.vehicleNumber || shipment.vehicleType} left depot. Delivery OTP: ${shipment.deliveryOtp}`,
        severity: 'INFO',
        actionUrl: '/orders',
        metadata: {
          orderNumber: vo.orderNumber,
          shipmentId: shipment.id,
          invoiceNumber: invoice.invoiceNumber,
        },
      });
    }

    return { vendorOrder: vo, shipment, invoice };
  }

  async assignDispatchVehicle(
    tenantId: string,
    payload: {
      orderIdOrNumber: string;
      vendorOrderId?: string;
      partnerId: string;
      driverName?: string;
      driverPhone?: string;
      vehicleNumber: string;
      vehicleType?: string;
      dispatchHub?: string;
      estimatedDispatchTime?: string;
      estimatedArrivalTime?: string;
      reassignReason?: string;
      actorName?: string;
    }
  ) {
    const b = this.getBindings();
    const masterOrder = dbStore.orders.find(
      (o) =>
        o.orderNumber === payload.orderIdOrNumber || o.id === payload.orderIdOrNumber
    ) as (Order & Record<string, any>) | undefined;
    const siblingVOs = b
      .getVendorOrders()
      .filter((vo) =>
        payload.vendorOrderId
          ? vo.id === payload.vendorOrderId
          : vo.orderNumber === (masterOrder?.orderNumber || payload.orderIdOrNumber) ||
            vo.id === payload.orderIdOrNumber
      );

    if (!masterOrder && siblingVOs.length === 0) {
      throw new NotFoundException(`Order ${payload.orderIdOrNumber} not found.`);
    }

    const partner = companyAdminDataService.deliveryPartners.get(payload.partnerId);
    if (!partner) {
      throw new BadRequestException('Selected delivery partner was not found.');
    }

    const targetVOs = siblingVOs;
    const totalWeightKg = targetVOs.reduce((sum, vo) => {
      return (
        sum +
        (Number(vo.packingDetails?.totalWeightKg || 0) ||
          (vo.items || []).reduce((s: number, it: any) => {
            const p = dbStore.products.find(
              (prod: any) => prod.id === it.productId || prod.sku === it.sku
            );
            return s + estimateItemWeightKg(it, p);
          }, 0))
      );
    }, 0);

    const spec = validateVehicleCapacity(
      payload.vehicleType || partner.vehicleTypes?.[0] || 'Tata Ace',
      totalWeightKg
    );

    const orderKey = masterOrder?.orderNumber || targetVOs[0].orderNumber;
    const existingAssign = companyAdminDataService.dispatchAssignments.get(orderKey);
    if (existingAssign && !String(payload.reassignReason || '').trim()) {
      throw new BadRequestException(
        'A reassignment reason is required when changing an already-assigned vehicle or partner.'
      );
    }

    const nowIso = new Date().toISOString();
    const driverName = payload.driverName || partner.contactPerson || `${partner.name} Driver`;
    const driverPhone = payload.driverPhone || partner.phone;

    const assignment: any = {
      orderId: orderKey,
      tenantId,
      partnerId: partner.id,
      partnerName: partner.name,
      driverName,
      driverPhone,
      vehicleType: spec.label,
      vehicleNumber: payload.vehicleNumber.trim().toUpperCase(),
      dispatchHub: payload.dispatchHub || 'Bengaluru Primary Logistics Hub',
      estimatedDispatchTime: payload.estimatedDispatchTime || nowIso,
      estimatedArrivalTime:
        payload.estimatedArrivalTime ||
        new Date(Date.now() + 50 * 60 * 1000).toISOString(),
      reassignReason: payload.reassignReason,
      assignedAt: nowIso,
      updatedAt: nowIso,
      status: 'ASSIGNED',
      eta: 'Within 60 mins',
    };
    companyAdminDataService.dispatchAssignments.set(orderKey, assignment);
    void companyAdminPersistenceService.upsert(DispatchAssignmentModel, assignment);

    const updatedShipments: ShipmentRecord[] = [];
    for (const vo of targetVOs) {
      const shipment = await this.ensureShipmentForVendorOrder(vo, masterOrder);
      shipment.partnerId = partner.id;
      shipment.partnerName = partner.name;
      shipment.driverName = driverName;
      shipment.driverPhone = driverPhone;
      shipment.vehicleType = spec.label;
      shipment.vehicleNumber = assignment.vehicleNumber;
      shipment.dispatchHub = assignment.dispatchHub;
      shipment.estimatedDispatchTime = assignment.estimatedDispatchTime;
      shipment.estimatedArrivalTime = assignment.estimatedArrivalTime;
      if (shipment.status === 'CREATED') shipment.status = 'ASSIGNED';
      shipment.updatedAt = nowIso;
      shipment.trackingEvents.push({
        status: shipment.status,
        title: existingAssign ? 'Vehicle / Partner Reassigned' : 'Delivery Vehicle Assigned',
        location: assignment.dispatchHub,
        description: `${partner.name} • ${spec.label} (${assignment.vehicleNumber})${
          payload.reassignReason ? ` • Reason: ${payload.reassignReason}` : ''
        }`,
        timestamp: nowIso,
        actor: payload.actorName || 'Dispatch Admin',
      });
      await platformPersistenceService.upsert(PlatformShipmentModel, shipment);
      updatedShipments.push(shipment);
    }

    if (masterOrder) {
      masterOrder.deliveryPartner = {
        name: partner.name,
        phone: driverPhone,
        vehicleNumber: assignment.vehicleNumber,
      };
      (masterOrder as any).driverName = driverName;
      (masterOrder as any).vehicleType = spec.label;
      await platformPersistenceService.upsert(PlatformOrderModel, masterOrder);
    }

    for (const vo of targetVOs) {
      realtimeBus.emitToVendor(
        vo.vendorId,
        'order.status.updated',
        { orderNumber: orderKey, vendorOrderId: vo.id, assignment },
        tenantId
      );
      await platformNotificationService.dispatch({
        tenantId,
        recipientRole: 'VENDOR',
        recipientId: vo.vendorId,
        type: 'ORDER',
        title: `Vehicle Assigned #${orderKey}`,
        message: `${spec.label} (${assignment.vehicleNumber}) via ${partner.name} assigned for pickup.`,
        severity: 'INFO',
        actionUrl: '/orders',
        metadata: { orderNumber: orderKey, vendorOrderId: vo.id },
      });
    }

    if (masterOrder?.customerId) {
      realtimeBus.emitToCustomer(
        masterOrder.customerId,
        'order.status.updated',
        { orderNumber: orderKey, deliveryPartner: masterOrder.deliveryPartner },
        tenantId
      );
    }

    return { assignment, shipments: updatedShipments };
  }

  async updateShipmentTransitStatus(payload: {
    orderIdOrNumber: string;
    vendorOrderId?: string;
    status: string;
    location?: string;
    note?: string;
    delayReason?: string;
    failureReason?: string;
    actorName?: string;
  }) {
    const b = this.getBindings();
    const rawUpper = String(payload.status || 'IN_TRANSIT').toUpperCase();
    if (rawUpper === 'DELIVERED') {
      throw new BadRequestException(
        'DELIVERED requires OTP & site proof confirmation via confirmDelivery.'
      );
    }

    const mappedShipmentStatus: ShipmentStatus =
      rawUpper === 'DISPATCHED' || rawUpper === 'PICKED_UP'
        ? 'PICKED_UP'
        : rawUpper === 'OUT_FOR_DELIVERY'
        ? 'OUT_FOR_DELIVERY'
        : rawUpper === 'FAILED' || rawUpper === 'FAILED_ATTEMPT' || rawUpper === 'FAILED_DELIVERY'
        ? 'FAILED_DELIVERY'
        : 'IN_TRANSIT';

    const targetVOs = b
      .getVendorOrders()
      .filter(
        (vo) =>
          (vo.orderNumber === payload.orderIdOrNumber || vo.id === payload.orderIdOrNumber) &&
          (!payload.vendorOrderId || vo.id === payload.vendorOrderId)
      );

    const masterOrder = dbStore.orders.find(
      (o) =>
        o.orderNumber === payload.orderIdOrNumber || o.id === payload.orderIdOrNumber
    ) as (Order & Record<string, any>) | undefined;

    if (targetVOs.length === 0 && !masterOrder) {
      throw new NotFoundException(`Order / Shipment ${payload.orderIdOrNumber} not found.`);
    }

    const nowIso = new Date().toISOString();
    const voStatusMap: Record<string, VendorOrderStatus> = {
      PICKED_UP: 'DISPATCHED',
      IN_TRANSIT: 'IN_TRANSIT',
      OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
    };

    const updatedShipments: ShipmentRecord[] = [];
    for (const vo of targetVOs) {
      const sh = await this.ensureShipmentForVendorOrder(vo, masterOrder);
      sh.status = mappedShipmentStatus;
      sh.updatedAt = nowIso;
      if (mappedShipmentStatus === 'PICKED_UP' && !sh.dispatchedAt) sh.dispatchedAt = nowIso;
      if (payload.location) {
        sh.lastKnownLocation = payload.location;
        sh.lastLocationUpdatedAt = nowIso;
      }
      if (payload.delayReason) sh.delayReason = payload.delayReason;
      if (payload.failureReason) sh.deliveryRemarks = payload.failureReason;

      sh.trackingEvents.push({
        status: mappedShipmentStatus,
        title: this.formatHumanStatus(rawUpper),
        location: payload.location || sh.lastKnownLocation || sh.pickupAddress,
        description:
          payload.note ||
          payload.delayReason ||
          payload.failureReason ||
          `Shipment moved to ${rawUpper}`,
        timestamp: nowIso,
        actor: payload.actorName || 'Logistics Control',
      });
      await platformPersistenceService.upsert(PlatformShipmentModel, sh);
      updatedShipments.push(sh);

      const nextVoStatus = voStatusMap[mappedShipmentStatus];
      if (nextVoStatus) {
        const prev = vo.status;
        vo.status = nextVoStatus;
        vo.updatedAt = nowIso;
        this.appendHistory(vo, {
          previousStatus: prev,
          newStatus: nextVoStatus,
          updatedBy: payload.actorName || 'Dispatch Team',
          role: 'ADMIN',
          remarks:
            payload.note ||
            payload.delayReason ||
            payload.failureReason ||
            this.formatHumanStatus(nextVoStatus),
          timestamp: nowIso,
        });
        await platformPersistenceService.upsert(PlatformOrderModel, vo);
      }

      if (mappedShipmentStatus === 'PICKED_UP') {
        await gstInvoiceService.buildVendorGstInvoice(vo, masterOrder, {
          vehicleNumber: sh.vehicleNumber,
          deliveryReference: sh.id,
        });
      }
    }

    const orderNum = masterOrder?.orderNumber || targetVOs[0]?.orderNumber || payload.orderIdOrNumber;
    const assign = companyAdminDataService.dispatchAssignments.get(orderNum);
    if (assign) {
      assign.status =
        mappedShipmentStatus === 'FAILED_DELIVERY'
          ? 'FAILED'
          : mappedShipmentStatus === 'PICKED_UP'
          ? 'PICKED_UP'
          : 'IN_TRANSIT';
      assign.updatedAt = nowIso;
      void companyAdminPersistenceService.upsert(DispatchAssignmentModel, assign);
    }

    await this.recomputeAndBroadcastMasterOrder(
      orderNum,
      { role: 'ADMIN', name: payload.actorName || 'Dispatch Control' },
      payload.note ||
        payload.delayReason ||
        payload.failureReason ||
        `${this.formatHumanStatus(rawUpper)}${payload.location ? ` (${payload.location})` : ''}`
    );

    if (masterOrder?.customerId && mappedShipmentStatus === 'OUT_FOR_DELIVERY') {
      const otpList = updatedShipments.map((s) => s.deliveryOtp).filter(Boolean).join(', ');
      await platformNotificationService.dispatch({
        tenantId: masterOrder.tenantId || 'tenant-buildora-blr',
        recipientRole: 'CUSTOMER',
        recipientId: masterOrder.customerId,
        type: 'ORDER',
        title: `Out for Delivery #${orderNum}`,
        message: `Your construction materials are arriving soon. Share Delivery OTP (${otpList || 'see Order Details'}) at handover.`,
        severity: 'INFO',
        actionUrl: '/orders',
        metadata: { orderNumber: orderNum },
      });
    }

    return { orderNumber: orderNum, status: mappedShipmentStatus, shipments: updatedShipments };
  }

  async confirmSiteDelivery(payload: {
    orderIdOrNumber: string;
    vendorOrderId?: string;
    otp?: string;
    recipientName: string;
    proofOfDeliveryUrl?: string;
    notes?: string;
    actorRole: 'ADMIN' | 'DELIVERY_PARTNER' | 'CUSTOMER';
    actorId: string;
    actorName: string;
    markCompleted?: boolean;
  }) {
    if (!String(payload.recipientName || '').trim()) {
      throw new BadRequestException('Recipient / Site Engineer name is required at handover.');
    }

    const b = this.getBindings();
    const targetVOs = b
      .getVendorOrders()
      .filter(
        (vo) =>
          (vo.orderNumber === payload.orderIdOrNumber || vo.id === payload.orderIdOrNumber) &&
          (!payload.vendorOrderId || vo.id === payload.vendorOrderId)
      );
    const masterOrder = dbStore.orders.find(
      (o) =>
        o.orderNumber === payload.orderIdOrNumber || o.id === payload.orderIdOrNumber
    ) as (Order & Record<string, any>) | undefined;

    if (targetVOs.length === 0 && !masterOrder) {
      throw new NotFoundException(`Order ${payload.orderIdOrNumber} not found.`);
    }

    const nowIso = new Date().toISOString();
    const invoices: VendorInvoice[] = [];

    for (const vo of targetVOs) {
      const shipment = await this.ensureShipmentForVendorOrder(vo, masterOrder);
      if (
        shipment.deliveryOtp &&
        String(payload.otp || '').trim() !== String(shipment.deliveryOtp)
      ) {
        throw new BadRequestException(
          `Invalid Delivery OTP for shipment ${shipment.id}. Ask customer/site engineer for the 4-digit OTP.`
        );
      }

      const finalVoStatus: VendorOrderStatus =
        payload.markCompleted ? 'COMPLETED' : 'DELIVERED';
      const prev = vo.status;
      shipment.status = 'DELIVERED';
      shipment.deliveredAt = nowIso;
      shipment.recipientName = payload.recipientName.trim();
      shipment.proofOfDeliveryUrl = payload.proofOfDeliveryUrl || shipment.proofOfDeliveryUrl;
      shipment.deliveryRemarks = payload.notes || 'OTP verified handover';
      shipment.updatedAt = nowIso;
      shipment.trackingEvents.push({
        status: 'DELIVERED',
        title: 'Delivered at Construction Site',
        location: shipment.siteAddress,
        description: `Received by ${payload.recipientName.trim()} (OTP Verified). ${payload.notes || ''}`.trim(),
        timestamp: nowIso,
        actor: payload.actorName,
      });
      await platformPersistenceService.upsert(PlatformShipmentModel, shipment);

      vo.status = finalVoStatus;
      vo.deliveredAt = nowIso;
      if (finalVoStatus === 'COMPLETED') vo.completedAt = nowIso;
      vo.updatedAt = nowIso;
      this.appendHistory(vo, {
        previousStatus: prev,
        newStatus: finalVoStatus,
        updatedBy: payload.actorName,
        role: payload.actorRole,
        remarks: `Site delivery confirmed via OTP for ${payload.recipientName.trim()}.`,
        timestamp: nowIso,
      });
      await platformPersistenceService.upsert(PlatformOrderModel, vo);

      const inv = await gstInvoiceService.buildVendorGstInvoice(vo, masterOrder, {
        vehicleNumber: shipment.vehicleNumber,
        deliveryReference: shipment.id,
      });
      await b.ensureFinancials(vo, masterOrder);
      invoices.push(inv);

      realtimeBus.emitToVendor(
        vo.vendorId,
        'order.status.updated',
        { orderNumber: vo.orderNumber, vendorOrderId: vo.id, status: finalVoStatus, invoiceNumber: inv.invoiceNumber },
        vo.tenantId || 'tenant-buildora-blr'
      );
    }

    const orderNum = masterOrder?.orderNumber || targetVOs[0].orderNumber;
    const assign = companyAdminDataService.dispatchAssignments.get(orderNum);
    if (assign) {
      assign.status = 'DELIVERED';
      assign.updatedAt = nowIso;
      void companyAdminPersistenceService.upsert(DispatchAssignmentModel, assign);
    }

    if (masterOrder) {
      if (masterOrder.paymentMethod === 'COD' && masterOrder.paymentStatus !== 'PAID') {
        masterOrder.paymentStatus = 'PAID';
        masterOrder.paidAt = nowIso;
      }
      masterOrder.deliveredAt = nowIso;
    }

    await this.recomputeAndBroadcastMasterOrder(
      orderNum,
      { role: payload.actorRole, name: payload.actorName },
      `Delivered & verified with site OTP (Recipient: ${payload.recipientName.trim()}).`
    );

    if (masterOrder?.customerId) {
      await platformNotificationService.dispatch({
        tenantId: masterOrder.tenantId || 'tenant-buildora-blr',
        recipientRole: 'CUSTOMER',
        recipientId: masterOrder.customerId,
        type: 'ORDER',
        title: `Delivered #${orderNum}`,
        message: `Materials handed over to ${payload.recipientName.trim()}. GST Tax Invoice is available for download.`,
        severity: 'SUCCESS',
        actionUrl: '/orders',
        metadata: { orderNumber: orderNum },
      });
    }

    return { orderNumber: orderNum, invoices };
  }

  async completeVendorOrder(vendorOrderId: string, actorName = 'System / Admin') {
    const b = this.getBindings();
    const vo = b
      .getVendorOrders()
      .find((o) => o.id === vendorOrderId || o.orderNumber === vendorOrderId);
    if (!vo) throw new NotFoundException(`Order ${vendorOrderId} not found.`);
    if (!['DELIVERED', 'COMPLETED'].includes(String(vo.status).toUpperCase())) {
      throw new BadRequestException('Only delivered orders can be marked COMPLETED.');
    }
    const nowIso = new Date().toISOString();
    const prev = vo.status;
    vo.status = 'COMPLETED';
    vo.completedAt = nowIso;
    vo.updatedAt = nowIso;
    this.appendHistory(vo, {
      previousStatus: prev,
      newStatus: 'COMPLETED',
      updatedBy: actorName,
      role: 'ADMIN',
      remarks: 'Order lifecycle closed & settlement finalized.',
      timestamp: nowIso,
    });
    await platformPersistenceService.upsert(PlatformOrderModel, vo);
    await this.recomputeAndBroadcastMasterOrder(
      vo.orderNumber,
      { role: 'ADMIN', name: actorName },
      'Order completed & financially closed.'
    );
    return vo;
  }

  public detectOrderExceptions(tenantId: string) {
    const b = this.getBindings();
    const nowMs = Date.now();
    const exceptions: Array<{
      id: string;
      type: string;
      severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
      orderNumber: string;
      vendorOrderId?: string;
      vendorName?: string;
      message: string;
      detectedAt: string;
    }> = [];

    const tenantOrders = dbStore.orders.filter(
      (o: any) => !tenantId || o.tenantId === tenantId || !o.tenantId
    );
    for (const o of tenantOrders as any[]) {
      const ageMins = (nowMs - new Date(o.createdAt || nowMs).getTime()) / 60000;
      if (o.paymentStatus === 'PENDING' && o.paymentMethod !== 'COD' && ageMins > 15) {
        exceptions.push({
          id: `exc-pay-${o.orderNumber}`,
          type: 'PAYMENT_PENDING',
          severity: 'MEDIUM',
          orderNumber: o.orderNumber,
          message: `Online payment unverified for ${Math.round(ageMins)} mins`,
          detectedAt: o.createdAt,
        });
      }
      if (o.issueReported) {
        exceptions.push({
          id: `exc-iss-${o.orderNumber}`,
          type: 'DISPUTED_ISSUE',
          severity: 'CRITICAL',
          orderNumber: o.orderNumber,
          message: `Customer reported ${o.issueReported.type}: ${o.issueReported.description}`,
          detectedAt: o.issueReported.reportedAt || o.updatedAt,
        });
      }
    }

    const tenantVOs = b
      .getVendorOrders()
      .filter((vo) => !tenantId || vo.tenantId === tenantId || !vo.tenantId);

    for (const vo of tenantVOs) {
      const status = String(vo.status || '').toUpperCase();
      const updatedMs = new Date(vo.updatedAt || vo.createdAt || nowMs).getTime();
      const ageMins = (nowMs - updatedMs) / 60000;

      if (status === 'NEW' && ageMins > 15) {
        exceptions.push({
          id: `exc-acc-${vo.id}`,
          type: 'VENDOR_ACCEPTANCE_SLA',
          severity: 'HIGH',
          orderNumber: vo.orderNumber,
          vendorOrderId: vo.id,
          vendorName: vo.vendorName || vo.vendorId,
          message: `Vendor acceptance overdue by ${Math.round(ageMins - 15)} mins`,
          detectedAt: vo.createdAt,
        });
      }
      if (status === 'READY_FOR_DISPATCH' && ageMins > 30) {
        exceptions.push({
          id: `exc-disp-${vo.id}`,
          type: 'DISPATCH_SLA_DELAY',
          severity: 'HIGH',
          orderNumber: vo.orderNumber,
          vendorOrderId: vo.id,
          vendorName: vo.vendorName || vo.vendorId,
          message: `Staged for dispatch > 30 mins without driver handover`,
          detectedAt: vo.updatedAt,
        });
      }
      if (vo.hasShortage) {
        exceptions.push({
          id: `exc-short-${vo.id}`,
          type: 'PICKING_SHORTAGE',
          severity: 'HIGH',
          orderNumber: vo.orderNumber,
          vendorOrderId: vo.id,
          vendorName: vo.vendorName || vo.vendorId,
          message: `Partial stock shortage reported during depot picking`,
          detectedAt: vo.updatedAt,
        });
      }
      if (status === 'FAILED_DELIVERY') {
        exceptions.push({
          id: `exc-fail-${vo.id}`,
          type: 'DELIVERY_FAILED',
          severity: 'CRITICAL',
          orderNumber: vo.orderNumber,
          vendorOrderId: vo.id,
          vendorName: vo.vendorName || vo.vendorId,
          message: `Site delivery failed — requires rescheduling`,
          detectedAt: vo.updatedAt,
        });
      }
    }

    return exceptions;
  }
}

export const fulfilmentLifecycleService = new FulfilmentLifecycleService();
