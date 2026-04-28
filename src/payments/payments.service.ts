import { BadRequestException, Injectable } from '@nestjs/common';
import { MeterType, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { isMockPaymentsEnabled } from '../env';

const TARIFFS: Record<MeterType, number> = {
  COLD_WATER: 15,
  HOT_WATER: 15,
  HEATING: 15,
};

const PAYMENT_VISIBLE_FROM_DAY = 5;
const PAYMENT_DUE_DAY = 10;

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrentPayment(userId: string) {
    await this.refreshOverdueStatusesForUser(userId);

    const now = new Date();
    const day = now.getDate();
    const billingMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const dueDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      PAYMENT_DUE_DAY,
      23,
      59,
      59,
      999,
    );

    const meters = await this.prisma.meter.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        readings: {
          orderBy: { createdAt: 'desc' },
          take: 2,
        },
      },
    });

    const lines = meters.map((meter) => {
      const latest = meter.readings[0]?.value ?? null;
      const previous = meter.readings[1]?.value ?? null;

      const consumption = latest !== null && previous !== null ? Math.max(0, latest - previous) : 0;
      const tariff = TARIFFS[meter.type] ?? 0;

      return {
        meterId: meter.id,
        meterTitle: meter.title,
        serialNumber: meter.serialNumber,
        meterType: meter.type,
        tariff,
        latest,
        previous,
        consumption,
        amount: consumption * tariff,
      };
    });

    const totalConsumption = lines.reduce((sum, item) => sum + item.consumption, 0);
    const totalAmount = lines.reduce((sum, item) => sum + item.amount, 0);
    const isVisible = day >= PAYMENT_VISIBLE_FROM_DAY;

    const payment = await this.ensureCurrentPayment({
      userId,
      billingMonth,
      dueDate,
      isVisible,
      totalAmount,
      totalConsumption,
      day,
    });

    const canPay =
      isVisible &&
      !!payment &&
      payment.amount > 0 &&
      payment.status !== PaymentStatus.PAID;

    return {
      tariffs: TARIFFS,
      billingMonth,
      visibleFromDay: PAYMENT_VISIBLE_FROM_DAY,
      dueDay: PAYMENT_DUE_DAY,
      isVisible,
      canPay,
      message: !isVisible
        ? `Начисление появится ${PAYMENT_VISIBLE_FROM_DAY} числа текущего месяца`
        : totalAmount <= 0
          ? 'Начисление за текущий месяц сформировано, но для оплаты пока недостаточно расхода по счётчикам'
          : payment?.status === PaymentStatus.PAID
            ? 'Счёт оплачен'
            : day > PAYMENT_DUE_DAY
              ? 'Срок оплаты истёк. Платёж отмечен как просроченный'
              : 'Счёт сформирован',
      payment,
      lines,
      totalConsumption,
      totalAmount,
    };
  }

  async getHistory(userId: string) {
    await this.refreshOverdueStatusesForUser(userId);

    const items = await this.prisma.payment.findMany({
      where: { userId },
      orderBy: [{ billingMonth: 'desc' }, { createdAt: 'desc' }],
    });

    const totalPaid = items
      .filter((item) => item.status === PaymentStatus.PAID)
      .reduce((sum, item) => sum + item.amount, 0);

    const pendingAmount = items
      .filter((item) => item.status !== PaymentStatus.PAID)
      .reduce((sum, item) => sum + item.amount, 0);

    const overdueCount = items.filter((item) => item.status === PaymentStatus.OVERDUE).length;

    return {
      items,
      summary: {
        total: items.length,
        paid: items.filter((item) => item.status === PaymentStatus.PAID).length,
        pending: items.filter((item) => item.status === PaymentStatus.PENDING).length,
        overdue: overdueCount,
        totalPaid,
        pendingAmount,
      },
    };
  }

  async payCurrent(userId: string) {
    const summary = await this.getCurrentPayment(userId);

    if (!summary.isVisible || !summary.payment || !summary.canPay) {
      throw new BadRequestException('Оплата пока недоступна');
    }

    if (!isMockPaymentsEnabled()) {
      throw new BadRequestException('Онлайн-оплата в продакшене ещё не подключена. Подключите платёжный шлюз или временно отключите кнопку оплаты.');
    }

    const payment = await this.prisma.payment.update({
      where: { id: summary.payment.id },
      data: {
        status: PaymentStatus.PAID,
        paidAt: new Date(),
      },
    });

    await this.prisma.notification.create({
      data: {
        userId,
        title: 'Оплата проведена',
        body: `Платёж за ${summary.billingMonth} на сумму ${summary.totalAmount} ₽ отмечен как оплаченный.`,
      },
    });

    return payment;
  }

  async findAllAdmin() {
    await this.refreshAllOverdueStatuses();

    return this.prisma.payment.findMany({
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            fullAddress: true,
            contractNumber: true,
            status: true,
          },
        },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
  }

  private async ensureCurrentPayment(params: {
    userId: string;
    billingMonth: string;
    dueDate: Date;
    isVisible: boolean;
    totalAmount: number;
    totalConsumption: number;
    day: number;
  }) {
    const { userId, billingMonth, dueDate, isVisible, totalAmount, totalConsumption, day } = params;

    let payment = await this.prisma.payment.findUnique({
      where: {
        userId_billingMonth: {
          userId,
          billingMonth,
        },
      },
    });

    if (!isVisible) {
      return payment;
    }

    const nextStatus = payment?.paidAt
      ? PaymentStatus.PAID
      : day > PAYMENT_DUE_DAY && totalAmount > 0
        ? PaymentStatus.OVERDUE
        : PaymentStatus.PENDING;

    if (!payment) {
      payment = await this.prisma.payment.create({
        data: {
          userId,
          billingMonth,
          amount: totalAmount,
          consumption: totalConsumption,
          dueDate,
          status: nextStatus,
          paidAt: null,
        },
      });

      return payment;
    }

    if (
      payment.amount !== totalAmount ||
      payment.consumption !== totalConsumption ||
      payment.dueDate.getTime() !== dueDate.getTime() ||
      (payment.status !== PaymentStatus.PAID && payment.status !== nextStatus)
    ) {
      payment = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          amount: totalAmount,
          consumption: totalConsumption,
          dueDate,
          status: payment.status === PaymentStatus.PAID ? PaymentStatus.PAID : nextStatus,
        },
      });
    }

    return payment;
  }

  private async refreshOverdueStatusesForUser(userId: string) {
    await this.prisma.payment.updateMany({
      where: {
        userId,
        status: PaymentStatus.PENDING,
        paidAt: null,
        amount: { gt: 0 },
        dueDate: { lt: new Date() },
      },
      data: {
        status: PaymentStatus.OVERDUE,
      },
    });
  }

  private async refreshAllOverdueStatuses() {
    await this.prisma.payment.updateMany({
      where: {
        status: PaymentStatus.PENDING,
        paidAt: null,
        amount: { gt: 0 },
        dueDate: { lt: new Date() },
      },
      data: {
        status: PaymentStatus.OVERDUE,
      },
    });
  }
}