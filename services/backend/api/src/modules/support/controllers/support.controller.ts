import { Controller, Get, Post, Param, Body, NotFoundException } from '@nestjs/common';
import { dbStore } from '../../../database/store';
import { SupportTicket } from '@buildora/types';

@Controller('api/v1/support')
export class SupportController {
  @Get('tickets')
  getTickets() {
    return {
      success: true,
      data: dbStore.tickets
    };
  }

  @Get('tickets/:id')
  getTicketById(@Param('id') id: string) {
    const tkt = dbStore.tickets.find((t) => t.id === id);
    if (!tkt) throw new NotFoundException('Ticket not found');
    return { success: true, data: tkt };
  }

  @Post('tickets')
  createTicket(@Body() body: any) {
    const id = 'tkt-' + Date.now();
    const ticketNumber = 'TKT-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    const now = new Date().toISOString();

    const newTicket: SupportTicket = {
      id,
      ticketNumber,
      category: body.category || 'OTHER',
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
          timestamp: 'Just now'
        }
      ]
    };

    dbStore.tickets.unshift(newTicket);
    return { success: true, data: newTicket };
  }

  @Post('tickets/:id/messages')
  addMessage(@Param('id') id: string, @Body() body: { message: string }) {
    const tkt = dbStore.tickets.find((t) => t.id === id);
    if (!tkt) throw new NotFoundException('Ticket not found');

    tkt.messages.push({
      sender: 'CUSTOMER',
      message: body.message,
      timestamp: 'Just now'
    });
    tkt.updatedAt = new Date().toISOString();

    return { success: true, data: tkt };
  }
}
