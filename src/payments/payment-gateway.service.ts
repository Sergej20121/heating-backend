import { Injectable } from '@nestjs/common';

type PaymentProvider = 'mock' | 'yookassa';

type PaymentAmountCalculation = {
  originalAmount: number;
  commissionAmount: number;
  finalAmount: number;
  commissionPercent: number;
};

type CreateSbpPaymentResult = {
  success: boolean;
  provider: PaymentProvider;
  paymentUrl: string;
  originalAmount: number;
  commissionAmount: number;
  finalAmount: number;
  commissionPercent: number;
  message: string;
};

@Injectable()
export class PaymentGatewayService {
  private readonly commissionPercent = 1.5;

  calculateFinalAmount(amount: number): PaymentAmountCalculation {
    const safeAmount = Number(amount);

    if (!Number.isFinite(safeAmount) || safeAmount <= 0) {
      throw new Error('Некорректная сумма платежа');
    }

    const commissionAmount = Math.ceil((safeAmount * this.commissionPercent) / 100);
    const finalAmount = safeAmount + commissionAmount;

    return {
      originalAmount: safeAmount,
      commissionAmount,
      finalAmount,
      commissionPercent: this.commissionPercent,
    };
  }

  async createSbpPayment(amount: number): Promise<CreateSbpPaymentResult> {
    const calculation = this.calculateFinalAmount(amount);

    // Пока MOCK. Потом сюда вставим реальную ЮKassa.
    return {
      success: true,
      provider: 'mock',
      paymentUrl: 'https://sbp.nspk.ru/payment/mock',
      originalAmount: calculation.originalAmount,
      commissionAmount: calculation.commissionAmount,
      finalAmount: calculation.finalAmount,
      commissionPercent: calculation.commissionPercent,
      message: 'Тестовая СБП-оплата создана. После подключения ЮKassa здесь будет реальная ссылка.',
    };
  }
}