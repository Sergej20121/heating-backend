import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { getJwtExpiresIn, getJwtSecret } from '../env';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { AdminPaymentsController } from './admin-payments.controller';

@Module({
  imports: [
    JwtModule.register({
      secret: getJwtSecret(),
      signOptions: { expiresIn: getJwtExpiresIn() },
    }),
  ],
  controllers: [PaymentsController, AdminPaymentsController],
  providers: [PaymentsService, PrismaService],
})
export class PaymentsModule {}
