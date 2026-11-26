import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { verifyCustomerToken } from '../../common/customer-auth.util';
import { companyAdminSecurityService } from '../company-admin/services/company-admin-security.service';
import { vendorSecurityService } from '../vendors/services/vendor-security.service';
import { realtimeBus } from './realtime-bus';

@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin: true,
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  afterInit(server: Server) {
    realtimeBus.attachServer(server);
    this.logger.log('Socket.IO /realtime gateway initialized.');
  }

  handleConnection(client: Socket) {
    const authToken =
      (client.handshake.auth?.token as string) ||
      (client.handshake.headers?.authorization as string) ||
      (client.handshake.query?.token as string) ||
      '';
    const requestedTenant =
      (client.handshake.auth?.tenantId as string) ||
      (client.handshake.headers?.['x-tenant-id'] as string) ||
      (client.handshake.query?.tenantId as string) ||
      'tenant-buildora-blr';
    const portalHint =
      (client.handshake.auth?.portal as string) ||
      (client.handshake.query?.portal as string) ||
      '';

    client.join('public');
    client.join(`tenant:${requestedTenant}:public`);

    if (!authToken) {
      client.data.role = 'GUEST';
      client.data.tenantId = requestedTenant;
      client.emit('realtime:connected', { role: 'GUEST', tenantId: requestedTenant, rooms: ['public'] });
      return;
    }

    const bearer = authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`;
    const joinedRooms = ['public', `tenant:${requestedTenant}:public`];

    if (portalHint === 'COMPANY_ADMIN' || !portalHint) {
      try {
        const admin = companyAdminSecurityService.verifyAccessToken(bearer);
        client.data.role = 'COMPANY_ADMIN';
        client.data.userId = admin.sub;
        client.data.tenantId = admin.tenantId;
        const room = `tenant:${admin.tenantId}:admin`;
        client.join(room);
        joinedRooms.push(room);
        client.emit('realtime:connected', {
          role: 'COMPANY_ADMIN',
          userId: admin.sub,
          tenantId: admin.tenantId,
          rooms: joinedRooms,
        });
        return;
      } catch {
        if (portalHint === 'COMPANY_ADMIN') {
          client.emit('realtime:error', { message: 'Invalid Company Admin token.' });
          client.disconnect(true);
          return;
        }
      }
    }

    if (portalHint === 'VENDOR' || !portalHint) {
      const vendor = vendorSecurityService.verifyToken(bearer);
      if (vendor?.vendorId) {
        client.data.role = 'VENDOR';
        client.data.vendorId = vendor.vendorId;
        client.data.tenantId = requestedTenant;
        const r1 = `vendor:${vendor.vendorId}`;
        const r2 = `tenant:${requestedTenant}:vendor:${vendor.vendorId}`;
        client.join(r1);
        client.join(r2);
        joinedRooms.push(r1, r2);
        client.emit('realtime:connected', {
          role: 'VENDOR',
          vendorId: vendor.vendorId,
          tenantId: requestedTenant,
          rooms: joinedRooms,
        });
        return;
      } else if (portalHint === 'VENDOR') {
        client.emit('realtime:error', { message: 'Invalid Vendor token.' });
        client.disconnect(true);
        return;
      }
    }

    const customer = verifyCustomerToken(bearer);
    if (customer?.sub) {
      client.data.role = 'CUSTOMER';
      client.data.customerId = customer.sub;
      client.data.tenantId = customer.tenantId || requestedTenant;
      const r1 = `customer:${customer.sub}`;
      const r2 = `tenant:${client.data.tenantId}:customer:${customer.sub}`;
      client.join(r1);
      client.join(r2);
      joinedRooms.push(r1, r2);
      client.emit('realtime:connected', {
        role: 'CUSTOMER',
        customerId: customer.sub,
        tenantId: client.data.tenantId,
        rooms: joinedRooms,
      });
      return;
    }

    // Legacy customer fallback only joins public storefront room
    client.data.role = 'GUEST';
    client.data.tenantId = requestedTenant;
    client.emit('realtime:connected', { role: 'GUEST', tenantId: requestedTenant, rooms: ['public'] });
  }

  handleDisconnect(client: Socket) {
    // Cleanup handled automatically by Socket.IO
    if (client.data?.role && client.data.role !== 'GUEST') {
      this.logger.debug(`Socket disconnected: ${client.id} (${client.data.role})`);
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    client.emit('pong', { ts: Date.now(), echo: payload || null });
  }
}
