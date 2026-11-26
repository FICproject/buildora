import { Module } from '@nestjs/common';
import { NotificationsController } from '../notifications/notifications.controller';
import {
  PlatformNotificationService,
  platformNotificationService,
} from '../notifications/platform-notification.service';
import { RealtimeGateway } from './realtime.gateway';

@Module({
  controllers: [NotificationsController],
  providers: [
    RealtimeGateway,
    { provide: PlatformNotificationService, useValue: platformNotificationService },
  ],
  exports: [RealtimeGateway, PlatformNotificationService],
})
export class RealtimeModule {}
