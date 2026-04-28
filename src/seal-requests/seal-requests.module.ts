import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { getJwtExpiresIn, getJwtSecret } from '../env';
import { PrismaService } from '../prisma.service';
import { SealRequestsController } from './seal-requests.controller';
import { AdminSealRequestsController } from './admin-seal-requests.controller';
import { SealRequestsService } from './seal-requests.service';

@Module({
  imports: [
    JwtModule.register({
      secret: getJwtSecret(),
      signOptions: { expiresIn: getJwtExpiresIn() },
    }),
  ],
  controllers: [SealRequestsController, AdminSealRequestsController],
  providers: [SealRequestsService, PrismaService],
})
export class SealRequestsModule {}
