import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { getJwtExpiresIn, getJwtSecret } from '../env';
import { MeterReadingsController } from './meter-readings.controller';
import { MeterReadingsService } from './meter-readings.service';

@Module({
  imports: [
    JwtModule.register({
      secret: getJwtSecret(),
      signOptions: { expiresIn: getJwtExpiresIn() },
    }),
  ],
  controllers: [MeterReadingsController],
  providers: [MeterReadingsService, PrismaService],
})
export class MeterReadingsModule {}
