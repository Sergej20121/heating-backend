import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { PaymentsService } from './payments.service';

@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('current')
  current(@CurrentUser() user: { sub: string }) {
    return this.paymentsService.getCurrentPayment(user.sub);
  }

  @Get('history')
  history(@CurrentUser() user: { sub: string }) {
    return this.paymentsService.getHistory(user.sub);
  }

  @Post('pay')
  pay(@CurrentUser() user: { sub: string }) {
    return this.paymentsService.payCurrent(user.sub);
  }
}
