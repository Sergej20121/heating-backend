import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { getJwtExpiresIn, getJwtSecret } from '../env';
import { PrismaService } from '../prisma.service';
import { NotificationsController } from './notifications.controller';
import { AdminNotificationsController } from './admin-notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    JwtModule.register({
      secret: getJwtSecret(),
      signOptions: { expiresIn: getJwtExpiresIn() },
    }),
  ],
  controllers: [NotificationsController, AdminNotificationsController],
  providers: [NotificationsService, PrismaService],
})
export class NotificationsModule {}
