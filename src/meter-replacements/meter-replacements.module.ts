import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { getJwtExpiresIn, getJwtSecret } from '../env';
import { PrismaService } from '../prisma.service';
import { MeterReplacementsController } from './meter-replacements.controller';
import { AdminMeterReplacementsController } from './admin-meter-replacements.controller';
import { MeterReplacementsService } from './meter-replacements.service';

@Module({
  imports: [
    JwtModule.register({
      secret: getJwtSecret(),
      signOptions: { expiresIn: getJwtExpiresIn() },
    }),
  ],
  controllers: [MeterReplacementsController, AdminMeterReplacementsController],
  providers: [MeterReplacementsService, PrismaService],
})
export class MeterReplacementsModule {}
