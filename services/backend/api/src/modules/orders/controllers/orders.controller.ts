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
    // 0. COD Limit Check (Max ₹50,000 for Cash on Delivery)
    const amountToCheck = body.payableAmount ?? body.totalAmount ?? 0;
    if (body.paymentMethod === 'COD' && amountToCheck > 50000) {
      return {
        success: false,
        message: 'Cash on Delivery is available for orders up to ₹50,000 only. Please choose an online payment method for this order.'
      };
    }

    // 1. Inventory reservation and stock depletion
    if (body.items && Array.isArray(body.items)) {
      for (const item of body.items) {
        const prod = dbStore.products.find((p) => p.id === item.productId);
        if (prod) {
          if (item.variantId && prod.variants) {
            const v = prod.variants.find((vr) => vr.id === item.variantId);
            if (v) {
              v.stock = Math.max(0, v.stock - (item.quantity || 1));
              v.inStock = v.stock > 0;
            }
          }
          prod.stockCount = Math.max(0, prod.stockCount - (item.quantity || 1));
          prod.inStock = prod.stockCount > 0;
        }
      }
    }

    const id = 'ord-' + Date.now();
    const orderNumber = 'BLD-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    const createdAt = new Date().toISOString();

    // 2. Wallet ledger deduction if wallet was used
    if (body.walletUsed && body.walletUsed > 0) {
      dbStore.walletBalance = Math.max(0, dbStore.walletBalance - body.walletUsed);
      dbStore.walletTransactions.unshift({
        id: 'tx-' + Date.now(),
        referenceNumber: 'WTX-' + Date.now().toString().slice(-6),
        type: 'DEBIT',
        amount: body.walletUsed,
        category: 'CHECKOUT',
        status: 'COMPLETED',
        description: `Applied to Order #${orderNumber}`,
        orderId: orderNumber,
        createdAt,
        balanceAfter: dbStore.walletBalance
      });
    }

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
          description: body.paymentMethod === 'COD' ? 'Cash on Delivery confirmed.' : 'Payment authorized and verified.',
          timestamp: 'Just now',
          completed: true
        },
        {
          status: 'CONFIRMED',
          title: 'Inventory Reserved',
          description: 'Dark store WH-BLR-01 allocation confirmed.',
          timestamp: 'In progress',
          completed: true
        },
        {
          status: 'PACKED',
          title: 'Picking & Packing',
          description: 'Materials undergo barcode inspection and pallet strapping.',
          timestamp: 'Scheduled',
          completed: false
        },
        {
          status: 'OUT_FOR_DELIVERY',
          title: 'Dispatched to Site',
          description: 'Loaded onto express mini-truck.',
          timestamp: 'Pending',
          completed: false
        },
        {
          status: 'DELIVERED',
          title: 'Delivered',
          description: 'Materials offloaded at job site gate.',
          timestamp: 'Pending',
          completed: false
        }
      ],
      deliveryPartner: {
        name: 'Ramesh Kumar (Bengaluru Fleet)',
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
    const order = dbStore.orders.find((o) => o.id === id || o.orderNumber === id);
    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    // Cancellation Policy check
    if (order.status === 'OUT_FOR_DELIVERY' || order.status === 'DELIVERED') {
      return {
        success: false,
        message: 'This order is already out for delivery or delivered and cannot be cancelled directly. Please submit a Return request upon arrival.'
      };
    }

    order.status = 'CANCELLED';
    order.timeline.push({
      status: 'CANCELLED',
      title: 'Order Cancelled',
      description: 'Order cancelled by customer before dispatch. Materials returned to inventory.',
      timestamp: 'Just now',
      completed: true
    });

    // 1. Restore Inventory
    if (order.items && Array.isArray(order.items)) {
      for (const item of order.items) {
        const prod = dbStore.products.find((p) => p.id === item.productId);
        if (prod) {
          if (item.variantId && prod.variants) {
            const v = prod.variants.find((vr) => vr.id === item.variantId);
            if (v) {
              v.stock += (item.quantity || 1);
              v.inStock = true;
            }
          }
          prod.stockCount += (item.quantity || 1);
          prod.inStock = true;
        }
      }
    }

    // 2. Restore Wallet Funds if wallet was used
    if (order.walletUsed && order.walletUsed > 0) {
      dbStore.walletBalance += order.walletUsed;
      dbStore.walletTransactions.unshift({
        id: 'tx-ref-' + Date.now(),
        referenceNumber: 'WTX-REF-' + Date.now().toString().slice(-6),
        type: 'CREDIT',
        amount: order.walletUsed,
        category: 'REFUND',
        status: 'COMPLETED',
        description: `Refund for Cancelled Order #${order.orderNumber}`,
        orderId: order.orderNumber,
        createdAt: new Date().toISOString(),
        balanceAfter: dbStore.walletBalance
      });
    }

    return {
      success: true,
      message: 'Order cancelled successfully. Full refund initiated.',
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
