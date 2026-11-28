import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Check,
  ChevronDown,
  ChevronUp,
  CircleDot,
  ExternalLink,
  PackageCheck,
  ShoppingBag,
  Truck,
} from 'lucide-react';

export type MilestoneState = 'completed' | 'current' | 'upcoming';

interface SubDetailItem {
  label: string;
  detail?: string;
  timestamp?: string;
  badge?: string;
}

interface MilestoneConfig {
  id: 'ORDER_PLACED' | 'READY_FOR_DISPATCH' | 'OUT_FOR_DELIVERY' | 'DELIVERED';
  title: string;
  description: string;
  state: MilestoneState;
  timestamp?: string;
  subDetails: SubDetailItem[];
  proofOfDeliveryUrl?: string;
  showTrackLink?: boolean;
}

export interface DeliveryTimelineProps {
  order: any;
  activeSplit?: any | null;
  activeSplitIdx?: number;
  onSelectSplit?: (idx: number) => void;
}

function formatDateTime(ts?: string): string {
  if (!ts) return '';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return String(ts);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatShortTime(ts?: string): string {
  if (!ts) return '';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return String(ts);
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildPackingSummary(packing: any): string | null {
  if (!packing || typeof packing !== 'object') return null;
  const counts = [
    packing.bagCount ? `${packing.bagCount} bags` : '',
    packing.boxCount ? `${packing.boxCount} boxes` : '',
    packing.bundleCount ? `${packing.bundleCount} bundles` : '',
    packing.pieceCount ? `${packing.pieceCount} pcs` : '',
    packing.palletCount ? `${packing.palletCount} pallets` : '',
  ].filter(Boolean);
  const pkgText =
    counts.length > 0
      ? `${counts.join(', ')} verified`
      : packing.packageCount
      ? `${packing.packageCount} package${packing.packageCount > 1 ? 's' : ''} verified`
      : '';
  const weightText = packing.totalWeightKg ? `Total weight: ${packing.totalWeightKg} kg` : '';
  const parts = [pkgText, weightText].filter(Boolean);
  return parts.length > 0 ? parts.join(' • ') : null;
}

export function computeMasterMilestoneStates(
  rawStatus: string,
  hasAssignedShipment = false,
  paymentMethod?: string,
  paymentStatus?: string
): Record<MilestoneConfig['id'], MilestoneState> {
  const st = String(rawStatus || 'ORDER_PLACED').toUpperCase();
  const isDelivered = ['DELIVERED', 'COMPLETED'].includes(st);
  if (isDelivered) {
    return {
      ORDER_PLACED: 'completed',
      READY_FOR_DISPATCH: 'completed',
      OUT_FOR_DELIVERY: 'completed',
      DELIVERED: 'completed',
    };
  }

  const isTransitOrDispatch = [
    'DISPATCHED',
    'PARTIALLY_DISPATCHED',
    'IN_TRANSIT',
    'OUT_FOR_DELIVERY',
    'PARTIALLY_DELIVERED',
    'FAILED_ATTEMPT',
    'PICKED_UP',
  ].includes(st);
  if (isTransitOrDispatch) {
    return {
      ORDER_PLACED: 'completed',
      READY_FOR_DISPATCH: 'completed',
      OUT_FOR_DELIVERY: 'current',
      DELIVERED: 'upcoming',
    };
  }

  if (st === 'READY_FOR_DISPATCH') {
    return {
      ORDER_PLACED: 'completed',
      READY_FOR_DISPATCH: 'completed',
      OUT_FOR_DELIVERY: hasAssignedShipment ? 'current' : 'upcoming',
      DELIVERED: 'upcoming',
    };
  }

  const isPreparing = [
    'PICKING_IN_PROGRESS',
    'PICKING',
    'PROCESSING',
    'PACKING_IN_PROGRESS',
    'PACKED',
  ].includes(st);
  if (isPreparing) {
    return {
      ORDER_PLACED: 'completed',
      READY_FOR_DISPATCH: 'current',
      OUT_FOR_DELIVERY: 'upcoming',
      DELIVERED: 'upcoming',
    };
  }

  const awaitOnlinePay =
    st === 'PAYMENT_PENDING' &&
    String(paymentMethod || '').toUpperCase() !== 'COD' &&
    !['PAID', 'CAPTURED'].includes(String(paymentStatus || '').toUpperCase());

  return {
    ORDER_PLACED: awaitOnlinePay ? 'current' : 'completed',
    READY_FOR_DISPATCH: 'upcoming',
    OUT_FOR_DELIVERY: 'upcoming',
    DELIVERED: 'upcoming',
  };
}

export const DeliveryTimeline: React.FC<DeliveryTimelineProps> = ({
  order,
  activeSplit,
  activeSplitIdx = -1,
  onSelectSplit,
}) => {
  const target = activeSplit || order;
  const vendorSplits: any[] = Array.isArray(order?.vendorSplits) ? order.vendorSplits : [];
  const activeShipment: any =
    activeSplit?.shipment || (Array.isArray(order?.shipments) ? order.shipments[0] : null) || null;
  const packingDetails: any = activeSplit?.packingDetails || order?.packingDetails || null;

  const rawStatus = String(target?.status || order?.status || 'ORDER_PLACED').toUpperCase();
  const timelineEvents: any[] = useMemo(() => {
    const base = Array.isArray(target?.timeline) ? target.timeline : [];
    const fallback = Array.isArray(order?.timeline) ? order.timeline : [];
    const hist = Array.isArray(target?.statusHistory)
      ? target.statusHistory
      : Array.isArray(order?.statusHistory)
      ? order.statusHistory
      : [];
    const shipEvts = Array.isArray(activeShipment?.trackingEvents) ? activeShipment.trackingEvents : [];

    const normalizedHist = hist.map((h: any) => ({
      status: h.newStatus || h.status,
      description: h.remarks || h.description,
      timestamp: h.timestamp,
    }));

    return [...base, ...fallback, ...normalizedHist, ...shipEvts].filter((e) => e && e.status);
  }, [target, order, activeShipment]);

  const findLatestEvent = (statuses: string[]) => {
    const upper = statuses.map((s) => s.toUpperCase());
    return [...timelineEvents].reverse().find((e) => upper.includes(String(e.status).toUpperCase()));
  };

  const hasAssignedVehicle = Boolean(
    activeShipment?.driverName ||
      activeShipment?.vehicleNumber ||
      activeSplit?.driver?.name ||
      order?.deliveryPartner?.vehicleNumber ||
      (activeShipment?.status && ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(String(activeShipment.status).toUpperCase()))
  );

  const states = useMemo(
    () => computeMasterMilestoneStates(rawStatus, hasAssignedVehicle, order?.paymentMethod, order?.paymentStatus),
    [rawStatus, hasAssignedVehicle, order?.paymentMethod, order?.paymentStatus]
  );

  const milestones: MilestoneConfig[] = useMemo(() => {
    const isCod = String(order?.paymentMethod || '').toUpperCase() === 'COD';
    const isPaid = ['PAID', 'CAPTURED'].includes(String(order?.paymentStatus || '').toUpperCase());

    // Events lookup
    const placedEvt = findLatestEvent(['ORDER_PLACED', 'NEW']);
    const paymentEvt = findLatestEvent(['PAYMENT_VERIFIED', 'CONFIRMED']);
    const vendorAcceptedEvt = findLatestEvent(['VENDOR_ACCEPTED', 'ACCEPTED', 'PARTIALLY_ACCEPTED']);
    const pickingEvt = findLatestEvent(['PICKING_IN_PROGRESS', 'PICKING', 'PROCESSING']);
    const packingEvt = findLatestEvent(['PACKING_IN_PROGRESS', 'PACKED']);
    const readyEvt = findLatestEvent(['READY_FOR_DISPATCH']);
    const assignedEvt = findLatestEvent(['ASSIGNED']);
    const dispatchedEvt = findLatestEvent(['DISPATCHED', 'PICKED_UP', 'PARTIALLY_DISPATCHED']);
    const transitEvt = findLatestEvent(['IN_TRANSIT']);
    const outEvt = findLatestEvent(['OUT_FOR_DELIVERY']);
    const deliveredEvt = findLatestEvent(['DELIVERED', 'COMPLETED', 'PARTIALLY_DELIVERED']);

    // 1. Order Placed Sub-details
    const orderPlacedSubs: SubDetailItem[] = [];
    orderPlacedSubs.push({
      label: 'Order created',
      timestamp: placedEvt?.timestamp || order?.createdAt,
    });
    if (isCod) {
      orderPlacedSubs.push({
        label: 'COD confirmed',
        detail: 'Pay on delivery selected',
        timestamp: paymentEvt?.timestamp || placedEvt?.timestamp || order?.createdAt,
      });
    } else if (isPaid || paymentEvt) {
      orderPlacedSubs.push({
        label: 'Payment verified',
        detail: order?.paymentChannelDetails || order?.paymentMethod || undefined,
        timestamp: paymentEvt?.timestamp || order?.updatedAt || order?.createdAt,
      });
    } else {
      orderPlacedSubs.push({
        label: 'Awaiting payment verification',
      });
    }
    if (vendorAcceptedEvt || target?.acceptedAt || ['VENDOR_ACCEPTED', 'ACCEPTED', 'PICKING_IN_PROGRESS', 'PACKING_IN_PROGRESS', 'READY_FOR_DISPATCH', 'DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(rawStatus)) {
      orderPlacedSubs.push({
        label: 'Vendor accepted',
        detail: activeSplit?.vendorName ? `${activeSplit.vendorName} accepted your order` : vendorAcceptedEvt?.description,
        timestamp: target?.acceptedAt || vendorAcceptedEvt?.timestamp,
      });
    }

    // 2. Ready for Dispatch Sub-details
    const readySubs: SubDetailItem[] = [];
    const pastPicking = Boolean(
      target?.packedAt ||
        packingEvt ||
        target?.readyForDispatchAt ||
        readyEvt ||
        states.READY_FOR_DISPATCH === 'completed'
    );
    if (pickingEvt || target?.pickedAt || pastPicking) {
      readySubs.push({
        label: pastPicking ? 'Picking completed' : 'Material picking in progress',
        timestamp: target?.pickedAt || pickingEvt?.timestamp,
      });
    }
    if (packingEvt || target?.packedAt || packingDetails || states.READY_FOR_DISPATCH === 'completed') {
      readySubs.push({
        label:
          target?.readyForDispatchAt || readyEvt || states.READY_FOR_DISPATCH === 'completed'
            ? 'Packing completed'
            : 'Material packing in progress',
        timestamp: target?.packedAt || packingDetails?.packedAt || packingEvt?.timestamp,
      });
    }
    const pkgSummary = buildPackingSummary(packingDetails);
    if (pkgSummary) {
      readySubs.push({
        label: 'Weight & quantity verified',
        detail: pkgSummary,
      });
    }
    if (readyEvt || target?.readyForDispatchAt) {
      readySubs.push({
        label: 'Ready for Dispatch',
        detail: activeShipment?.dispatchHub ? `Staged at ${activeShipment.dispatchHub}` : undefined,
        timestamp: target?.readyForDispatchAt || readyEvt?.timestamp,
      });
    }

    // 3. Out for Delivery Sub-details (never fabricate driver, vehicle, or ETA)
    const deliverySubs: SubDetailItem[] = [];
    const driverName = activeShipment?.driverName || activeSplit?.driver?.name || order?.driverName;
    const driverPhone = activeShipment?.driverPhone || activeSplit?.driver?.phone || order?.deliveryPartner?.phone;
    const partnerName = activeShipment?.partnerName || order?.deliveryPartner?.name;
    const vehicleNumber =
      activeShipment?.vehicleNumber || activeSplit?.driver?.vehicleNumber || order?.deliveryPartner?.vehicleNumber;
    const vehicleType = activeShipment?.vehicleType || activeSplit?.driver?.vehicleType || order?.vehicleType;

    if (driverName || partnerName) {
      deliverySubs.push({
        label: 'Driver & partner assigned',
        detail: [driverName || partnerName, driverPhone ? `(${driverPhone})` : ''].filter(Boolean).join(' '),
        timestamp: assignedEvt?.timestamp,
      });
    }
    if (vehicleNumber || vehicleType) {
      deliverySubs.push({
        label: 'Vehicle assigned',
        detail: [vehicleType, vehicleNumber].filter(Boolean).join(' • '),
      });
    }
    if (dispatchedEvt || target?.dispatchedAt || activeShipment?.dispatchedAt) {
      deliverySubs.push({
        label: 'Dispatched from supplier',
        detail: activeShipment?.dispatchHub ? `From ${activeShipment.dispatchHub}` : undefined,
        timestamp: activeShipment?.dispatchedAt || target?.dispatchedAt || dispatchedEvt?.timestamp,
      });
    }
    if (transitEvt || activeShipment?.lastKnownLocation) {
      deliverySubs.push({
        label: 'In Transit',
        detail: activeShipment?.lastKnownLocation ? `Latest location: ${activeShipment.lastKnownLocation}` : transitEvt?.description,
        timestamp: activeShipment?.lastLocationUpdatedAt || transitEvt?.timestamp,
      });
    }
    if (outEvt || rawStatus === 'OUT_FOR_DELIVERY') {
      deliverySubs.push({
        label: 'Out for Delivery',
        detail: outEvt?.description || 'Delivery partner approaching your site',
        timestamp: outEvt?.timestamp,
        badge:
          activeShipment?.deliveryOtp && states.DELIVERED !== 'completed'
            ? `Site OTP: ${activeShipment.deliveryOtp}`
            : undefined,
      });
    }
    const etaText = activeShipment?.estimatedArrivalTime || (states.OUT_FOR_DELIVERY === 'current' ? order?.estimatedDeliveryTime : '');
    if (etaText && states.OUT_FOR_DELIVERY !== 'upcoming') {
      deliverySubs.push({
        label: 'Estimated Arrival',
        detail: etaText,
      });
    }

    // 4. Delivered Sub-details
    const deliveredSubs: SubDetailItem[] = [];
    const isDelivered = states.DELIVERED === 'completed';
    if (isDelivered) {
      deliveredSubs.push({
        label: 'Site delivery confirmed',
        detail: deliveredEvt?.description || 'Materials handed over at construction site',
      });
      deliveredSubs.push({
        label: 'Delivery OTP verified',
      });
      const recipient = activeShipment?.recipientName || order?.deliveryAddress?.recipientName;
      if (recipient) {
        deliveredSubs.push({
          label: 'Recipient',
          detail: recipient,
        });
      }
      const delTs = activeShipment?.deliveredAt || target?.deliveredAt || deliveredEvt?.timestamp;
      if (delTs) {
        deliveredSubs.push({
          label: 'Delivery completed',
          timestamp: delTs,
        });
      }
    }

    const proofUrl = activeShipment?.proofOfDeliveryUrl || order?.proofOfDeliveryUrl;

    return [
      {
        id: 'ORDER_PLACED',
        title: 'Order Placed',
        description:
          states.ORDER_PLACED === 'current'
            ? 'Order created and awaiting payment confirmation.'
            : 'Your order has been successfully placed.',
        state: states.ORDER_PLACED,
        timestamp: placedEvt?.timestamp || order?.createdAt,
        subDetails: orderPlacedSubs,
      },
      {
        id: 'READY_FOR_DISPATCH',
        title: 'Ready for Dispatch',
        description:
          states.READY_FOR_DISPATCH === 'completed'
            ? 'Your materials have been checked, packed, and are ready for delivery.'
            : states.READY_FOR_DISPATCH === 'current'
            ? 'Your materials are being picked, weighed, and packed by the supplier.'
            : 'Materials will be picked and packed once order preparation begins.',
        state: states.READY_FOR_DISPATCH,
        timestamp:
          target?.readyForDispatchAt ||
          readyEvt?.timestamp ||
          target?.packedAt ||
          packingEvt?.timestamp ||
          target?.pickedAt ||
          pickingEvt?.timestamp,
        subDetails: readySubs,
      },
      {
        id: 'OUT_FOR_DELIVERY',
        title: 'Out for Delivery',
        description:
          states.OUT_FOR_DELIVERY === 'completed'
            ? 'Your shipment arrived at the delivery destination.'
            : states.OUT_FOR_DELIVERY === 'current'
            ? 'Your materials are on the way to your construction site.'
            : 'Driver, vehicle, and dispatch details will appear once shipped.',
        state: states.OUT_FOR_DELIVERY,
        timestamp:
          outEvt?.timestamp ||
          transitEvt?.timestamp ||
          activeShipment?.dispatchedAt ||
          target?.dispatchedAt ||
          dispatchedEvt?.timestamp,
        subDetails: deliverySubs,
        showTrackLink:
          Boolean(order?.orderNumber) &&
          (states.OUT_FOR_DELIVERY === 'current' || Boolean(activeShipment)),
      },
      {
        id: 'DELIVERED',
        title: 'Delivered',
        description:
          states.DELIVERED === 'completed'
            ? 'Your construction materials have been successfully delivered.'
            : 'Site handover, OTP verification, and delivery confirmation will appear here.',
        state: states.DELIVERED,
        timestamp: activeShipment?.deliveredAt || target?.deliveredAt || deliveredEvt?.timestamp,
        subDetails: deliveredSubs,
        proofOfDeliveryUrl: isDelivered ? proofUrl : undefined,
      },
    ];
  }, [order, activeSplit, target, activeShipment, packingDetails, rawStatus, states, timelineEvents]);

  // Keep current milestone and milestones with recorded backend sub-details expanded by default
  const [collapsedMap, setCollapsedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setCollapsedMap((prev) => {
      const next = { ...prev };
      for (const m of milestones) {
        if (m.state === 'current') {
          next[m.id] = false;
        }
      }
      return next;
    });
  }, [rawStatus]);

  const isExpanded = (m: MilestoneConfig): boolean => {
    if (m.id in collapsedMap) {
      return !collapsedMap[m.id];
    }
    return m.state === 'current' || m.subDetails.length > 0 || Boolean(m.proofOfDeliveryUrl);
  };

  const toggleMilestone = (id: string, currentlyExpanded: boolean) => {
    setCollapsedMap((prev) => ({ ...prev, [id]: currentlyExpanded }));
  };

  const getMilestoneIcon = (m: MilestoneConfig) => {
    if (m.state === 'completed') return <Check className="w-4 h-4 stroke-[2.75]" />;
    if (m.state === 'current') {
      if (m.id === 'ORDER_PLACED') return <ShoppingBag className="w-4 h-4" />;
      if (m.id === 'READY_FOR_DISPATCH') return <PackageCheck className="w-4 h-4" />;
      if (m.id === 'OUT_FOR_DELIVERY') return <Truck className="w-4 h-4" />;
      return <Check className="w-4 h-4" />;
    }
    return <CircleDot className="w-4 h-4" />;
  };

  return (
    <div className="space-y-5">
      {/* Vertical 4-Milestone Timeline */}
      <div className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-4 sm:p-6">
        <div className="relative">
          {milestones.map((m, idx) => {
            const isLast = idx === milestones.length - 1;
            const hasDetails = m.subDetails.length > 0 || Boolean(m.proofOfDeliveryUrl) || m.showTrackLink;
            const expanded = isExpanded(m);

            const circleClass =
              m.state === 'completed'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : m.state === 'current'
                ? 'bg-brand-blue-900 text-white border-brand-blue-900 ring-4 ring-brand-blue-100 shadow-sm'
                : 'bg-white text-slate-400 border-slate-300';

            const lineClass = m.state === 'completed' ? 'bg-emerald-500' : 'bg-slate-200';

            return (
              <div key={m.id} className={`relative flex gap-3.5 sm:gap-4 ${isLast ? '' : 'pb-6 sm:pb-7'}`}>
                {/* Left Track: Circle Icon + Vertical Line */}
                <div className="relative flex flex-col items-center shrink-0">
                  <div
                    className={`w-9 h-9 rounded-full border-2 flex items-center justify-center z-10 transition-colors ${circleClass}`}
                  >
                    {getMilestoneIcon(m)}
                  </div>
                  {!isLast && (
                    <div className={`w-0.5 flex-1 mt-1.5 rounded-full ${lineClass}`} />
                  )}
                </div>

                {/* Right Content */}
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4
                          className={`text-sm sm:text-base font-extrabold tracking-tight ${
                            m.state === 'upcoming'
                              ? 'text-slate-400'
                              : m.state === 'current'
                              ? 'text-brand-blue-950'
                              : 'text-slate-900'
                          }`}
                        >
                          {m.title}
                        </h4>

                        {m.state === 'current' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-brand-blue-100 text-brand-blue-900">
                            In Progress
                          </span>
                        )}
                      </div>

                      <p
                        className={`text-xs mt-0.5 leading-relaxed ${
                          m.state === 'upcoming' ? 'text-slate-400' : 'text-slate-600'
                        }`}
                      >
                        {m.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {m.timestamp && (
                        <span className="text-[11px] font-medium text-slate-500 tabular-nums">
                          {formatDateTime(m.timestamp)}
                        </span>
                      )}
                      {hasDetails && (
                        <button
                          type="button"
                          onClick={() => toggleMilestone(m.id, expanded)}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
                          aria-label={expanded ? `Collapse ${m.title} details` : `Expand ${m.title} details`}
                        >
                          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Sub-details underneath the milestone */}
                  {expanded && hasDetails && (
                    <div className="mt-2.5 pl-3 border-l-2 border-slate-200 space-y-1.5">
                      {m.subDetails.map((sub, sIdx) => (
                        <div
                          key={sIdx}
                          className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-xs"
                        >
                          <div className="text-slate-700 leading-snug">
                            <span className="font-semibold text-slate-800">{sub.label}</span>
                            {sub.detail && <span className="text-slate-500"> — {sub.detail}</span>}
                            {sub.badge && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px] border border-amber-200">
                                {sub.badge}
                              </span>
                            )}
                          </div>
                          {sub.timestamp && (
                            <span className="text-[11px] text-slate-400 tabular-nums shrink-0">
                              {formatShortTime(sub.timestamp)}
                            </span>
                          )}
                        </div>
                      ))}

                      {m.showTrackLink && (
                        <div className="pt-1">
                          <Link
                            to={`/orders/${encodeURIComponent(order.orderNumber)}/track`}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-blue-800 hover:underline"
                          >
                            Track Delivery <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      )}

                      {m.proofOfDeliveryUrl && (
                        <div className="pt-1.5">
                          <a
                            href={m.proofOfDeliveryUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-brand-blue-900 transition"
                          >
                            <img
                              src={m.proofOfDeliveryUrl}
                              alt="Proof of Delivery"
                              className="w-8 h-8 rounded object-cover border border-slate-200"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <span>View Proof of Delivery</span>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Multi-Vendor Split Progress Overview (when viewing Master Order across multiple vendors) */}
      {activeSplitIdx === -1 && vendorSplits.length > 1 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Supplier-Wise Shipment Progress ({vendorSplits.length} Vendors)
            </p>
            <span className="text-[11px] text-slate-400">Select a supplier above for detailed timeline</span>
          </div>
          <div className="divide-y divide-slate-100">
            {vendorSplits.map((sp: any, idx: number) => {
              const spStatus = String(sp.status || 'NEW').toUpperCase();
              const spStates = computeMasterMilestoneStates(
                spStatus,
                Boolean(sp.shipment?.driverName || sp.shipment?.vehicleNumber),
                order?.paymentMethod,
                order?.paymentStatus
              );
              const stageSteps = [
                { key: 'ORDER_PLACED', label: 'Placed', state: spStates.ORDER_PLACED },
                { key: 'READY_FOR_DISPATCH', label: 'Ready', state: spStates.READY_FOR_DISPATCH },
                { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', state: spStates.OUT_FOR_DELIVERY },
                { key: 'DELIVERED', label: 'Delivered', state: spStates.DELIVERED },
              ];
              return (
                <div
                  key={sp.vendorOrderId || idx}
                  className="py-2.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-bold text-slate-900 truncate">{sp.vendorName}</span>
                    <span className="text-slate-400 truncate">
                      ({(sp.items || []).length} {(sp.items || []).length === 1 ? 'item' : 'items'})
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {stageSteps.map((stItem) => (
                      <span
                        key={stItem.key}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          stItem.state === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : stItem.state === 'current'
                            ? 'bg-brand-blue-50 text-brand-blue-900 border border-brand-blue-200'
                            : 'bg-slate-50 text-slate-400 border border-slate-200'
                        }`}
                      >
                        {stItem.label}
                      </span>
                    ))}
                    {onSelectSplit && (
                      <button
                        type="button"
                        onClick={() => onSelectSplit(idx)}
                        className="text-[11px] font-bold text-brand-blue-800 hover:underline ml-1 cursor-pointer"
                      >
                        Details
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
