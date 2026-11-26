import { Controller, Get, Query, Headers, BadRequestException } from '@nestjs/common';
import { BENGALURU_WAREHOUSES } from '@buildora/constants';
import { companyAdminDataService } from '../../company-admin/services/company-admin-data.service';
import { DEFAULT_TENANT_ID } from '../../vendors/controllers/vendor.controller';

@Controller('api/v1/serviceability')
export class ServiceabilityController {
  @Get('check')
  checkPincode(
    @Query('pincode') pincode: string,
    @Headers('x-tenant-id') tenantId?: string
  ): any {
    if (!pincode) {
      throw new BadRequestException('Pincode query parameter is required.');
    }

    const cleaned = pincode.trim();
    if (!/^[1-9][0-9]{5}$/.test(cleaned)) {
      throw new BadRequestException('Please provide a valid 6-digit Indian PIN code.');
    }

    const cleanTenant = tenantId || DEFAULT_TENANT_ID;
    const result = companyAdminDataService.checkTenantPincodeServiceability(cleanTenant, cleaned);

    return {
      success: result.isServiceable,
      data: result,
      ...result,
    };
  }

  @Get('bengaluru-zones')
  getBengaluruZones(@Headers('x-tenant-id') tenantId?: string) {
    const cleanTenant = tenantId || DEFAULT_TENANT_ID;
    const tenant = companyAdminDataService.getTenantConfig(cleanTenant);
    const liveWarehouses = companyAdminDataService.getTenantWarehouses(cleanTenant);
    const hubs =
      liveWarehouses.length > 0
        ? liveWarehouses.map((wh: any) => ({
            id: wh.id,
            name: wh.name,
            city: wh.city || tenant.city,
            pincode: wh.pincode || '',
            status: wh.isActive !== false ? 'ONLINE' : 'OFFLINE',
            capacity: wh.capacity || 'HIGH',
            avgTurnaroundMins: Number(wh.avgDispatchMins || 45),
          }))
        : Object.values(BENGALURU_WAREHOUSES).map((wh) => ({
            id: wh.id,
            name: wh.name,
            status: 'ONLINE',
            capacity: 'HIGH',
            avgTurnaroundMins: wh.avgDispatchMins,
          }));

    return {
      city: tenant.city || 'Bengaluru',
      activeHubs: hubs,
    };
  }
}
