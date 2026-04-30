import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { PaymentsService } from './payments.service';
import { PaymentGatewayService } from './payment-gateway.service';

@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly paymentGateway: PaymentGatewayService,
  ) {}

  @Get('current')
  async current(@CurrentUser() user: { sub: string }) {
    return this.paymentsService.getCurrentPayment(user.sub);
  }

  @Get('history')
  async history(@CurrentUser() user: { sub: string }) {
    return this.paymentsService.getHistory(user.sub);
  }

  @Post('pay')
  async pay(@CurrentUser() user: { sub: string }) {
    const current = await this.paymentsService.getCurrentPayment(user.sub);

    if (!current?.isVisible) {
      return {
        success: false,
        provider: 'mock',
        message: current?.message || 'Начисление пока недоступно для оплаты',
      };
    }

    if (!current.totalAmount || current.totalAmount <= 0) {
      return {
        success: false,
        provider: 'mock',
        message: 'Нет суммы для оплаты',
      };
    }

    if (current.payment?.status === 'PAID') {
      return {
        success: false,
        provider: 'mock',
        message: 'Этот платёж уже оплачен',
      };
    }

    return this.paymentGateway.createSbpPayment(current.totalAmount);
  }
}