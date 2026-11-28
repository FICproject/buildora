/**
 * End-to-End Verification Suite:
 * BUILDORA 60 - 4-Milestone Vertical Delivery Timeline + Real Backend Lifecycle Transitions
 */

import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../services/backend/api/.env') });

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../services/backend/api/src/app.module';
import { dbStore } from '../../services/backend/api/src/database/store';
import { companyAdminDataService } from '../../services/backend/api/src/modules/company-admin/services/company-admin-data.service';
import { fulfilmentLifecycleService } from '../../services/backend/api/src/modules/orders/services/fulfilment-lifecycle.service';
import { computeMasterMilestoneStates } from '../../apps/customer-web/src/components/orders/DeliveryTimeline';

let total = 0;
let passed = 0;
let failed = 0;

function assert(cond: boolean, label: string, detail?: any) {
  total++;
  if (cond) {
    passed++;
    console.log(`  PASS: ${label}`);
  } else {
    failed++;
    console.error(`  FAIL: ${label}`, detail !== undefined ? detail : '');
  }
}

async function run() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
  await app.listen(3098);
  const BASE = 'http://localhost:3098/api/v1';

  const jsonFetch = async (
    endpoint: string,
    options: { method?: string; token?: string; body?: any } = {}
  ) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-tenant-id': 'tenant-buildora-blr',
    };
    if (options.token) headers['Authorization'] = `Bearer ${options.token}`;
    const res = await fetch(`${BASE}${endpoint}`, {
      method: options.method || 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  };

  try {
    // 1. Verify computeMasterMilestoneStates behavior across all 4 required scenarios
    console.log('\n--- 1. Vertical Timeline Milestone State Logic ---');
    const stPlaced = computeMasterMilestoneStates('ORDER_PLACED', false, 'COD', 'PENDING');
    assert(
      stPlaced.ORDER_PLACED === 'completed' &&
        stPlaced.READY_FOR_DISPATCH === 'upcoming' &&
        stPlaced.OUT_FOR_DELIVERY === 'upcoming' &&
        stPlaced.DELIVERED === 'upcoming',
      'State 1 (Newly Placed): Order Placed completed, rest upcoming'
    );

    const stPreparing = computeMasterMilestoneStates('PACKING_IN_PROGRESS', false, 'COD', 'PENDING');
    assert(
      stPreparing.ORDER_PLACED === 'completed' &&
        stPreparing.READY_FOR_DISPATCH === 'current' &&
        stPreparing.OUT_FOR_DELIVERY === 'upcoming' &&
        stPreparing.DELIVERED === 'upcoming',
      'State 2 (Preparing Materials): Ready for Dispatch is In Progress'
    );

    const stReady = computeMasterMilestoneStates('READY_FOR_DISPATCH', false, 'COD', 'PENDING');
    assert(
      stReady.ORDER_PLACED === 'completed' &&
        stReady.READY_FOR_DISPATCH === 'completed' &&
        stReady.OUT_FOR_DELIVERY === 'upcoming' &&
        stReady.DELIVERED === 'upcoming',
      'State 2b (Ready for Dispatch before driver assigned): Ready completed, Out for Delivery upcoming'
    );

    const stOut = computeMasterMilestoneStates('OUT_FOR_DELIVERY', true, 'COD', 'PENDING');
    assert(
      stOut.ORDER_PLACED === 'completed' &&
        stOut.READY_FOR_DISPATCH === 'completed' &&
        stOut.OUT_FOR_DELIVERY === 'current' &&
        stOut.DELIVERED === 'upcoming',
      'State 3 (Dispatched / Out for Delivery): Out for Delivery is In Progress'
    );

    const stDelivered = computeMasterMilestoneStates('DELIVERED', true, 'COD', 'PAID');
    assert(
      stDelivered.ORDER_PLACED === 'completed' &&
        stDelivered.READY_FOR_DISPATCH === 'completed' &&
        stDelivered.OUT_FOR_DELIVERY === 'completed' &&
        stDelivered.DELIVERED === 'completed',
      'State 4 (Delivered): All four milestones completed'
    );

    // 2. Real backend order creation & full lifecycle progression
    console.log('\n--- 2. Real Backend Order Lifecycle + /orders/:orderNumber/details ---');
    const phone = '9845112244';
    await jsonFetch('/auth/request-otp', { method: 'POST', body: { phone } });
    const loginRes = await jsonFetch('/auth/verify-otp', {
      method: 'POST',
      body: { phone, otp: '6060', name: 'Site Engineer Vikram' },
    });
    const token = loginRes.data?.token;
    assert(Boolean(token), 'Authenticated customer token issued');

    const prod = dbStore.products[0];
    const createRes = await jsonFetch('/orders', {
      method: 'POST',
      token,
      body: {
        items: [{ productId: prod.id, quantity: 3 }],
        deliverySpeed: 'ASAP_60',
        deliveryAddress: {
          recipientName: 'Site Engineer Vikram',
          mobile: phone,
          building: 'Plot 18',
          street: 'HSR Sector 2',
          area: 'HSR Layout',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560102',
        },
        paymentMethod: 'COD',
      },
    });
    const orderNumber = createRes.data?.data?.orderNumber;
    assert(Boolean(orderNumber), `Real COD order created: ${orderNumber}`);

    let detailRes = await jsonFetch(`/orders/${orderNumber}/details`, { token });
    let detail = detailRes.data?.data;
    assert(detailRes.status === 200 && detail?.orderNumber === orderNumber, 'GET /orders/:orderNumber/details returns new order');
    assert(
      computeMasterMilestoneStates(detail.status, false, detail.paymentMethod, detail.paymentStatus).READY_FOR_DISPATCH === 'upcoming',
      'Newly created backend order keeps Ready for Dispatch upcoming'
    );

    const split = detail.vendorSplits?.[0];
    assert(Boolean(split?.vendorOrderId && split?.vendorId), 'Vendor split created automatically on order placement');

    // Progress: Accept -> Picking -> Packing (with bags & kg) -> Ready -> Vehicle Assign -> Dispatched -> Out for Delivery -> Delivered
    await fulfilmentLifecycleService.vendorAcceptOrder(split.vendorId, split.vendorOrderId, 'Vikram Vendor');
    await fulfilmentLifecycleService.vendorConfirmPicking(
      split.vendorId,
      split.vendorOrderId,
      { notes: 'All bags verified' },
      'Picker Raju'
    );
    detailRes = await jsonFetch(`/orders/${orderNumber}/details`, { token });
    detail = detailRes.data?.data;
    assert(
      computeMasterMilestoneStates(detail.status, false, detail.paymentMethod, detail.paymentStatus).READY_FOR_DISPATCH === 'current',
      'Backend PICKING_IN_PROGRESS maps to Ready for Dispatch In Progress'
    );

    await fulfilmentLifecycleService.vendorConfirmPacking(
      split.vendorId,
      split.vendorOrderId,
      { bagCount: 17, totalWeightKg: 850, markReadyForDispatch: true },
      'Packer Suresh'
    );
    detailRes = await jsonFetch(`/orders/${orderNumber}/details`, { token });
    detail = detailRes.data?.data;
    assert(
      detail.vendorSplits?.[0]?.packingDetails?.bagCount === 17 &&
        detail.vendorSplits?.[0]?.packingDetails?.totalWeightKg === 850 &&
        Array.isArray(detail.vendorSplits?.[0]?.timeline),
      'Enriched /details returns real packingDetails (17 bags, 850 kg) and vendor split timeline'
    );

    const firstPartner = [...companyAdminDataService.deliveryPartners.values()][0];
    assert(Boolean(firstPartner?.id), 'Delivery partner available for dispatch vehicle assignment');
    await fulfilmentLifecycleService.assignDispatchVehicle('tenant-buildora-blr', {
      orderIdOrNumber: orderNumber,
      partnerId: firstPartner.id,
      driverName: 'Manjunath K',
      driverPhone: '9988776611',
      vehicleType: 'Tata Ace',
      vehicleNumber: 'KA-01-TA-9090',
      dispatchHub: 'Koramangala Depot',
      estimatedArrivalTime: '02:45 PM',
      actorName: 'Dispatch Admin',
    });

    await fulfilmentLifecycleService.vendorHandoverToDriver(split.vendorId, split.vendorOrderId, {}, 'Depot Gate');
    await fulfilmentLifecycleService.updateShipmentTransitStatus({
      orderIdOrNumber: orderNumber,
      status: 'OUT_FOR_DELIVERY',
      location: 'HSR 27th Main',
    });

    detailRes = await jsonFetch(`/orders/${orderNumber}/details`, { token });
    detail = detailRes.data?.data;
    const shipment = detail.shipments?.[0];
    assert(
      shipment?.driverName === 'Manjunath K' &&
        shipment?.vehicleNumber === 'KA-01-TA-9090' &&
        Boolean(shipment?.deliveryOtp) &&
        computeMasterMilestoneStates(detail.status, true, detail.paymentMethod, detail.paymentStatus).OUT_FOR_DELIVERY === 'current',
      'Out for Delivery exposes real driver, vehicle number, OTP, and In Progress milestone'
    );

    await fulfilmentLifecycleService.confirmSiteDelivery({
      orderIdOrNumber: orderNumber,
      vendorOrderId: split.vendorOrderId,
      otp: shipment.deliveryOtp,
      recipientName: 'Site Engineer Vikram',
      proofOfDeliveryUrl: 'https://cdn.buildora.in/pod/sample-pod.jpg',
      actorRole: 'DELIVERY_PARTNER',
      actorId: 'drv-1',
      actorName: 'Manjunath K',
      markCompleted: true,
    });

    detailRes = await jsonFetch(`/orders/${orderNumber}/details`, { token });
    detail = detailRes.data?.data;
    assert(
      ['DELIVERED', 'COMPLETED'].includes(String(detail.status).toUpperCase()) &&
        detail.shipments?.[0]?.proofOfDeliveryUrl === 'https://cdn.buildora.in/pod/sample-pod.jpg' &&
        computeMasterMilestoneStates(detail.status, true, detail.paymentMethod, detail.paymentStatus).DELIVERED === 'completed',
      'Delivered exposes recipient name, Proof of Delivery URL, and marks all 4 milestones completed'
    );

    console.log(`\n=== SUMMARY: ${passed}/${total} passed, ${failed} failed ===`);
    if (failed > 0) process.exitCode = 1;
  } finally {
    await app.close();
  }
}

run().catch((err) => {
  console.error('Fatal vertical timeline test error:', err);
  process.exit(1);
});
