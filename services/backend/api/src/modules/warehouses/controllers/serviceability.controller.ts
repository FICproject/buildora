import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { checkBengaluruServiceability, ServiceabilityResult, BENGALURU_WAREHOUSES } from '@buildora/constants';

@Controller('api/v1/serviceability')
export class ServiceabilityController {
  @Get('check')
  checkPincode(@Query('pincode') pincode: string): any {
    if (!pincode) {
      throw new BadRequestException('Pincode query parameter is required.');
    }

    const cleaned = pincode.trim();
    if (!/^[1-9][0-9]{5}$/.test(cleaned)) {
      throw new BadRequestException('Please provide a valid 6-digit Indian PIN code.');
    }

    const result = checkBengaluruServiceability(cleaned);

    return {
      success: result.isServiceable,
      data: result,
      ...result
    };
  }

  @Get('bengaluru-zones')
  getBengaluruZones() {
    return {
      city: 'Bengaluru',
      activeHubs: Object.values(BENGALURU_WAREHOUSES).map((wh) => ({
        id: wh.id,
        name: wh.name,
        status: 'ONLINE',
        capacity: 'HIGH',
        avgTurnaroundMins: wh.avgDispatchMins
      }))
    };
  }
}
