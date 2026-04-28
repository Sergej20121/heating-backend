import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MetersModule } from './meters/meters.module';
import { SealRequestsModule } from './seal-requests/seal-requests.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MeterReplacementsModule } from './meter-replacements/meter-replacements.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { MeterReadingsModule } from './meter-readings/meter-readings.module';
import { AdminModule } from './admin/admin.module';
import { PaymentsModule } from './payments/payments.module';
import { HealthController } from './health.controller';
import { PublicController } from './public/public.controller';

@Module({
  controllers: [HealthController, PublicController],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    MetersModule,
    SealRequestsModule,
    NotificationsModule,
    MeterReplacementsModule,
    AnnouncementsModule,
    MeterReadingsModule,
    PaymentsModule,
    AdminModule,
  ],
})
export class AppModule {}
