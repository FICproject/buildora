import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { SERVICEABLE_PINCODES } from '@buildora/constants';

export interface ServiceabilityResponse {
  pincode: string;
  locality: string;
  cityName: string;
  state: string;
  isServiceable: boolean;
  deliveryZone: string;
  warehouseId: string | null;
  warehouseName: string | null;
  etaMinutes: number;
  etaText: string;
  dispatchStatus: 'ACTIVE_DISPATCH' | 'SCHEDULED_DISPATCH' | 'UNDER_VERIFICATION' | 'UNSERVICEABLE';
  deliveryModes: string[];
  message: string;
}

@Controller('api/v1/serviceability')
export class ServiceabilityController {
  @Get('check')
  checkPincode(@Query('pincode') pincode: string): ServiceabilityResponse {
    if (!pincode) {
      throw new BadRequestException('Pincode query parameter is required.');
    }

    const cleaned = pincode.trim();
    if (!/^[1-9][0-9]{5}$/.test(cleaned)) {
      throw new BadRequestException('Please provide a valid 6-digit Indian PIN code.');
    }

    // 1. Direct registry match
    const known = SERVICEABLE_PINCODES[cleaned];
    if (known) {
      return {
        pincode: cleaned,
        locality: known.locality,
        cityName: known.city,
        state: known.state,
        isServiceable: true,
        deliveryZone: known.zone || 'BLR_METRO',
        warehouseId: known.warehouse,
        warehouseName: this.getWarehouseName(known.warehouse),
        etaMinutes: known.etaMinutes,
        etaText: `Estimated delivery: ${known.etaMinutes} minutes`,
        dispatchStatus: known.etaMinutes <= 90 ? 'ACTIVE_DISPATCH' : 'SCHEDULED_DISPATCH',
        deliveryModes: known.etaMinutes <= 60 ? ['EXPRESS_60_MIN', 'SCHEDULED_SLOT'] : ['SCHEDULED_SLOT'],
        message: `Express ${known.etaMinutes}-minute dispatch available to ${known.locality}!`
      };
    }

    // 2. Bengaluru Metro dynamic range (560xxx)
    if (cleaned.startsWith('560')) {
      const subCode = parseInt(cleaned.substring(3), 10);
      let assignedWarehouse = 'WH-BLR-01';
      let zone = 'CENTRAL_BLR';
      let eta = 60;
      let approxArea = 'Bengaluru Urban';

      if (subCode >= 10 && subCode <= 22) {
        assignedWarehouse = 'WH-BLR-04';
        zone = 'WEST_BLR';
        approxArea = 'Bengaluru West';
        eta = 60;
      } else if (subCode >= 24 && subCode <= 33) {
        assignedWarehouse = 'WH-BLR-05';
        zone = 'NORTH_BLR';
        approxArea = 'Bengaluru North';
        eta = 60;
      } else if (subCode >= 34 && subCode <= 45) {
        assignedWarehouse = 'WH-BLR-02';
        zone = 'SOUTH_BLR';
        approxArea = 'Bengaluru South / East';
        eta = 60;
      } else if (subCode >= 60 && subCode <= 75) {
        assignedWarehouse = 'WH-BLR-04';
        zone = 'WEST_BLR';
        approxArea = 'Bengaluru West / Nagarabhavi Region';
        eta = 60;
      } else if (subCode >= 76 && subCode <= 104) {
        assignedWarehouse = 'WH-BLR-02';
        zone = 'SOUTH_BLR';
        approxArea = 'Bengaluru South / Peripheral';
        eta = 90;
      }

      return {
        pincode: cleaned,
        locality: approxArea,
        cityName: 'Bengaluru',
        state: 'Karnataka',
        isServiceable: true,
        deliveryZone: zone,
        warehouseId: assignedWarehouse,
        warehouseName: this.getWarehouseName(assignedWarehouse),
        etaMinutes: eta,
        etaText: `Estimated delivery: ${eta} minutes`,
        dispatchStatus: 'ACTIVE_DISPATCH',
        deliveryModes: ['EXPRESS_60_MIN', 'SCHEDULED_SLOT'],
        message: `Delivery available in ~${eta} minutes from nearest dark store.`
      };
    }

    // 3. Greater Bengaluru Rural / Corridor (562xxx)
    if (cleaned.startsWith('562')) {
      return {
        pincode: cleaned,
        locality: 'Bengaluru Rural Growth Corridor',
        cityName: 'Bengaluru Rural',
        state: 'Karnataka',
        isServiceable: true,
        deliveryZone: 'OUTER_BLR',
        warehouseId: 'WH-BLR-05',
        warehouseName: 'Bengaluru Peripheral Logistics Dark Store',
        etaMinutes: 120,
        etaText: 'Estimated delivery: 120 minutes',
        dispatchStatus: 'SCHEDULED_DISPATCH',
        deliveryModes: ['SCHEDULED_SLOT'],
        message: 'Scheduled site delivery available in 120 minutes.'
      };
    }

    // 4. Outside Bengaluru
    return {
      pincode: cleaned,
      locality: 'Regional Location',
      cityName: 'Regional India',
      state: 'India',
      isServiceable: false,
      deliveryZone: 'NON_BLR',
      warehouseId: null,
      warehouseName: null,
      etaMinutes: 0,
      etaText: 'Verification In Progress',
      dispatchStatus: 'UNDER_VERIFICATION',
      deliveryModes: ['FREIGHT_INQUIRY'],
      message: 'Delivery availability is being verified for your location.'
    };
  }

  @Get('bengaluru-zones')
  getBengaluruZones() {
    return {
      city: 'Bengaluru',
      activeHubs: [
        { id: 'WH-BLR-01', name: 'Bengaluru Central / East Dark Store (Indiranagar)', status: 'ONLINE', capacity: 'HIGH', avgTurnaroundMins: 38 },
        { id: 'WH-BLR-02', name: 'Bengaluru South Dark Store (Koramangala & HSR)', status: 'ONLINE', capacity: 'HIGH', avgTurnaroundMins: 42 },
        { id: 'WH-BLR-03', name: 'Bengaluru IT Corridor Dark Store (Whitefield)', status: 'ONLINE', capacity: 'HIGH', avgTurnaroundMins: 45 },
        { id: 'WH-BLR-04', name: 'Bengaluru West Dark Store (Nagarabhavi / Peenya)', status: 'ONLINE', capacity: 'HIGH', avgTurnaroundMins: 40 },
        { id: 'WH-BLR-05', name: 'Bengaluru North Dark Store (Hebbal / Yelahanka)', status: 'ONLINE', capacity: 'NORMAL', avgTurnaroundMins: 50 },
      ]
    };
  }

  private getWarehouseName(whId: string): string {
    const names: Record<string, string> = {
      'WH-BLR-01': 'Bengaluru Central / East Hub (Indiranagar)',
      'WH-BLR-02': 'Bengaluru South Hub (Koramangala / HSR)',
      'WH-BLR-03': 'Bengaluru IT Corridor Hub (Whitefield)',
      'WH-BLR-04': 'Bengaluru West Hub (Nagarabhavi / Peenya)',
      'WH-BLR-05': 'Bengaluru North Hub (Hebbal / Yelahanka)'
    };
    return names[whId] || 'Bengaluru Master Fulfillment Center';
  }
}
