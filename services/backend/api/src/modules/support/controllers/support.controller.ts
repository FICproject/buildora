import { Controller, Get, Post, Param, Body, NotFoundException, ForbiddenException, Headers } from '@nestjs/common';
import { dbStore } from '../../../database/store';
import { SupportTicket } from '@buildora/types';
import { requireCustomer } from '../../../common/customer-auth.util';
import {
  PlatformSupportTicketModel,
  platformPersistenceService,
} from '../../../database/platform-persistence.service';
import { platformNotificationService } from '../../notifications/platform-notification.service';
import { realtimeBus } from '../../realtime/realtime-bus';

@Controller('api/v1/support')
export class SupportController {
  @Get('tickets')
  getTickets(@Headers('authorization') authHeader?: string) {
    const cust = requireCustomer(authHeader);
    const isSeedDemo = cust.sub === 'cust-9876543210' || cust.sub === 'cust-demo-1';
    const list = dbStore.tickets.filter((t: any) =>
      t.customerId ? t.customerId === cust.sub : isSeedDemo
    );
    return {
      success: true,
      data: list,
    };
  }

  @Get('tickets/:id')
  getTicketById(@Param('id') id: string, @Headers('authorization') authHeader?: string) {
    const cust = requireCustomer(authHeader);
    const isSeedDemo = cust.sub === 'cust-9876543210' || cust.sub === 'cust-demo-1';
    const tkt = dbStore.tickets.find((t) => t.id === id || t.ticketNumber === id) as any;
    if (!tkt) throw new NotFoundException('Ticket not found');
    if (tkt.customerId ? tkt.customerId !== cust.sub : !isSeedDemo) {
      throw new ForbiddenException('You do not have permission to view this support ticket.');
    }
    return { success: true, data: tkt };
  }

  @Post('tickets')
  async createTicket(@Body() body: any, @Headers('authorization') authHeader?: string) {
    const cust = requireCustomer(authHeader);
    const id = 'tkt-' + Date.now();
    const ticketNumber =
      'TKT-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    const now = new Date().toISOString();

    const newTicket: SupportTicket & { customerId?: string; customerName?: string; tenantId?: string } = {
      id,
      ticketNumber,
      customerId: cust.sub,
      customerName: cust.name || body.customerName || 'Customer',
      tenantId: cust.tenantId || 'tenant-buildora-blr',
      category: body.category || 'OTHER',
      orderId: body.orderId,
      priority: body.priority || 'MEDIUM',
      subject: body.subject,
      description: body.description,
      status: 'OPEN',
      createdAt: now,
      updatedAt: now,
      messages: [
        {
          sender: 'CUSTOMER',
          message: body.description,
          timestamp: now,
        },
      ],
    };

    dbStore.tickets.unshift(newTicket);
    await platformPersistenceService.upsert(PlatformSupportTicketModel, newTicket);

    await platformNotificationService.dispatch({
      tenantId: newTicket.tenantId,
      recipientRole: 'ADMIN',
      recipientId: 'TENANT_ADMIN',
      type: 'SUPPORT',
      title: `New Customer Ticket ${ticketNumber}`,
      message: `${newTicket.customerName}: ${newTicket.subject}`,
      severity: newTicket.priority === 'HIGH' ? 'WARNING' : 'INFO',
      actionUrl: '/notifications',
      metadata: { ticketId: id, ticketNumber },
    });

    return { success: true, data: newTicket };
  }

  @Post('tickets/:id/messages')
  async addMessage(
    @Param('id') id: string,
    @Body() body: { message: string },
    @Headers('authorization') authHeader?: string
  ) {
    const cust = requireCustomer(authHeader);
    const isSeedDemo = cust.sub === 'cust-9876543210' || cust.sub === 'cust-demo-1';
    const tkt = dbStore.tickets.find((t) => t.id === id || t.ticketNumber === id) as any;
    if (!tkt) throw new NotFoundException('Ticket not found');
    if (tkt.customerId ? tkt.customerId !== cust.sub : !isSeedDemo) {
      throw new ForbiddenException('You do not have permission to post to this support ticket.');
    }

    tkt.messages.push({
      sender: 'CUSTOMER',
      message: body.message,
      timestamp: new Date().toISOString(),
    });
    tkt.updatedAt = new Date().toISOString();
    await platformPersistenceService.upsert(PlatformSupportTicketModel, tkt);

    realtimeBus.emitToAdmin(
      'notification.created',
      { ticketId: tkt.id, ticketNumber: tkt.ticketNumber, replyFrom: 'CUSTOMER' },
      tkt.tenantId || 'tenant-buildora-blr'
    );

    return { success: true, data: tkt };
  }
}
