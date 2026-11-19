import { Controller, Get, Post, Param, Body, NotFoundException } from '@nestjs/common';
import { dbStore } from '../../../database/store';
import { Order } from '@buildora/types';

@Controller('api/v1/orders')
export class OrdersController {
  @Get()
  getOrders() {
    return {
      success: true,
      data: dbStore.orders
    };
  }

  @Get(':idOrNumber')
  getOrderById(@Param('idOrNumber') idOrNumber: string) {
    const needle = idOrNumber.trim().toLowerCase();
    const order = dbStore.orders.find(
      (o) => o.id.toLowerCase() === needle || o.orderNumber.toLowerCase() === needle
    );
    if (!order) {
      throw new NotFoundException(`Order ${idOrNumber} not found`);
    }
    return {
      success: true,
      data: order
    };
  }

  @Get(':idOrNumber/track')
  trackOrder(@Param('idOrNumber') idOrNumber: string) {
    const needle = idOrNumber.trim().toLowerCase();
    const order = dbStore.orders.find(
      (o) => o.id.toLowerCase() === needle || o.orderNumber.toLowerCase() === needle
    );
    if (!order) {
      throw new NotFoundException(`Order ${idOrNumber} not found`);
    }
    return {
      success: true,
      data: {
        orderNumber: order.orderNumber,
        status: order.status,
        estimatedDeliveryTime: order.estimatedDeliveryTime,
        timeline: order.timeline,
        deliveryPartner: order.deliveryPartner,
        destination: order.deliveryAddress
      }
    };
  }

  @Post()
  createOrder(@Body() body: any) {
    const id = 'ord-' + Date.now();
    const orderNumber = 'BLD-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    const createdAt = new Date().toISOString();

    const newOrder: Order = {
      ...body,
      id,
      orderNumber,
      createdAt,
      status: 'ORDER_PLACED',
      timeline: [
        {
          status: 'ORDER_PLACED',
          title: 'Order Placed',
          description: 'Payment authorized and verified.',
          timestamp: 'Just now',
          completed: true
        },
        {
          status: 'CONFIRMED',
          title: 'Inventory Reserved',
          description: 'Dark store allocation confirmed.',
          timestamp: 'In progress',
          completed: true
        },
        {
          status: 'PACKED',
          title: 'Picking & Packing',
          description: 'Materials undergo barcode inspection.',
          timestamp: 'Scheduled',
          completed: false
        },
        {
          status: 'OUT_FOR_DELIVERY',
          title: 'Dispatched to Site',
          description: 'Loaded onto mini-truck.',
          timestamp: 'Pending',
          completed: false
        },
        {
          status: 'DELIVERED',
          title: 'Delivered',
          description: 'Materials offloaded at site gate.',
          timestamp: 'Pending',
          completed: false
        }
      ],
      deliveryPartner: {
        name: 'Ramesh Kumar',
        phone: '+91-9876543299',
        vehicleNumber: 'KA-03-EZ-4412 (Tata Ace EV)'
      }
    };

    dbStore.orders.unshift(newOrder);

    return {
      success: true,
      data: newOrder
    };
  }

  @Post(':id/cancel')
  cancelOrder(@Param('id') id: string) {
    const order = dbStore.orders.find((o) => o.id === id);
    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }
    order.status = 'CANCELLED';
    order.timeline.push({
      status: 'CANCELLED',
      title: 'Order Cancelled',
      description: 'Order cancelled. Refund initiated to wallet.',
      timestamp: 'Just now',
      completed: true
    });

    return {
      success: true,
      data: order
    };
  }

  @Post(':id/return')
  requestReturn(
    @Param('id') id: string,
    @Body() body: { reason: string; items?: string[]; comments?: string }
  ) {
    const order = dbStore.orders.find((o) => o.id === id || o.orderNumber === id);
    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    order.timeline.push({
      status: 'CANCELLED',
      title: 'Return / Replacement Requested',
      description: `Reason: ${body.reason}. Site inspection scheduled.`,
      timestamp: 'Just now',
      completed: true
    });

    return {
      success: true,
      message: 'Return request submitted. Site engineer will contact you for pickup.',
      data: order
    };
  }
}
