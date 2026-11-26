import {
  Controller,
  Get,
  Patch,
  Post,
  Put,
  Param,
  Query,
  Body,
  Headers,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { verifyCustomerToken } from '../../common/customer-auth.util';
import { companyAdminSecurityService } from '../company-admin/services/company-admin-security.service';
import { vendorSecurityService } from '../vendors/services/vendor-security.service';
import {
  NotificationRecipientRole,
  platformNotificationService,
} from './platform-notification.service';

@Controller('api/v1/notifications')
export class NotificationsController {
  private resolveCaller(
    authHeader?: string,
    tenantHeader?: string,
    portalHint?: string
  ): { tenantId: string; role: NotificationRecipientRole; recipientId: string } {
    const tenantId = tenantHeader || 'tenant-buildora-blr';
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authorization bearer token is required.');
    }

    if (portalHint === 'COMPANY_ADMIN' || !portalHint) {
      try {
        const admin = companyAdminSecurityService.verifyAccessToken(authHeader);
        return { tenantId: admin.tenantId, role: 'ADMIN', recipientId: admin.sub };
      } catch {
        if (portalHint === 'COMPANY_ADMIN') {
          throw new UnauthorizedException('Invalid Company Admin token.');
        }
      }
    }

    if (portalHint === 'VENDOR' || !portalHint) {
      const vendor = vendorSecurityService.verifyToken(authHeader);
      if (vendor?.vendorId) {
        return { tenantId, role: 'VENDOR', recipientId: vendor.vendorId };
      } else if (portalHint === 'VENDOR') {
        throw new UnauthorizedException('Invalid Vendor token.');
      }
    }

    const customer = verifyCustomerToken(authHeader);
    if (customer?.sub) {
      return {
        tenantId: customer.tenantId || tenantId,
        role: 'CUSTOMER',
        recipientId: customer.sub,
      };
    }

    throw new UnauthorizedException('Invalid or expired session token.');
  }

  @Get()
  list(
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') tenantId?: string,
    @Headers('x-portal') portalHint?: string,
    @Query('unreadOnly') unreadOnly?: string
  ) {
    const caller = this.resolveCaller(authHeader, tenantId, portalHint);
    const data = platformNotificationService.listForRecipient(
      caller.tenantId,
      caller.role,
      caller.recipientId,
      unreadOnly === 'true'
    );
    return { success: true, data };
  }

  @Get('unread-count')
  unreadCount(
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') tenantId?: string,
    @Headers('x-portal') portalHint?: string
  ) {
    const caller = this.resolveCaller(authHeader, tenantId, portalHint);
    const data = platformNotificationService.listForRecipient(
      caller.tenantId,
      caller.role,
      caller.recipientId,
      true
    );
    return { success: true, data: { unreadCount: data.unreadCount } };
  }

  @Patch(':id/read')
  async markRead(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') tenantId?: string,
    @Headers('x-portal') portalHint?: string
  ) {
    const caller = this.resolveCaller(authHeader, tenantId, portalHint);
    const updated = await platformNotificationService.markRead(
      id,
      caller.tenantId,
      caller.role,
      caller.recipientId
    );
    if (!updated) {
      throw new NotFoundException('Notification not found for current account.');
    }
    return { success: true, data: updated };
  }

  @Post('mark-all-read')
  async markAllRead(
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') tenantId?: string,
    @Headers('x-portal') portalHint?: string
  ) {
    const caller = this.resolveCaller(authHeader, tenantId, portalHint);
    const count = await platformNotificationService.markAllRead(
      caller.tenantId,
      caller.role,
      caller.recipientId
    );
    return { success: true, data: { markedCount: count } };
  }

  @Get('preferences')
  getPreferences(
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') tenantId?: string,
    @Headers('x-portal') portalHint?: string
  ) {
    const caller = this.resolveCaller(authHeader, tenantId, portalHint);
    const data = platformNotificationService.getPreferences(
      caller.tenantId,
      caller.role,
      caller.recipientId
    );
    return { success: true, data };
  }

  @Put('preferences')
  async updatePreferences(
    @Body() body: Record<string, any>,
    @Headers('authorization') authHeader?: string,
    @Headers('x-tenant-id') tenantId?: string,
    @Headers('x-portal') portalHint?: string
  ) {
    const caller = this.resolveCaller(authHeader, tenantId, portalHint);
    const data = await platformNotificationService.updatePreferences(
      caller.tenantId,
      caller.role,
      caller.recipientId,
      body || {}
    );
    return { success: true, data };
  }
}
