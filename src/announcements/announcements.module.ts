import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { getJwtExpiresIn, getJwtSecret } from '../env';
import { PrismaService } from '../prisma.service';
import { AnnouncementsController } from './announcements.controller';
import { AdminAnnouncementsController } from './admin-announcements.controller';
import { AnnouncementsService } from './announcements.service';

@Module({
  imports: [
    JwtModule.register({
      secret: getJwtSecret(),
      signOptions: { expiresIn: getJwtExpiresIn() },
    }),
  ],
  controllers: [AnnouncementsController, AdminAnnouncementsController],
  providers: [AnnouncementsService, PrismaService],
})
export class AnnouncementsModule {}
