import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { getJwtExpiresIn, getJwtSecret } from '../env';
import { MetersController } from './meters.controller';
import { MetersService } from './meters.service';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [
    JwtModule.register({
      secret: getJwtSecret(),
      signOptions: { expiresIn: getJwtExpiresIn() },
    }),
  ],
  controllers: [MetersController],
  providers: [MetersService, PrismaService],
})
export class MetersModule {}
