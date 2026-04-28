import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateMeterReadingDto } from './create-meter-reading.dto';

@Injectable()
export class MeterReadingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateMeterReadingDto) {
    if (!this.isSubmissionWindowOpen()) {
      throw new BadRequestException(this.getSubmissionWindowMessage());
    }

    const meter = await this.prisma.meter.findFirst({
      where: {
        id: dto.meterId,
        userId,
        isActive: true,
      },
    });

    if (!meter) {
      throw new NotFoundException('Активный счётчик не найден');
    }

    const lastReading = await this.prisma.meterReading.findFirst({
      where: { meterId: dto.meterId },
      orderBy: { createdAt: 'desc' },
    });

    if (lastReading && dto.value <= lastReading.value) {
      throw new BadRequestException('Новое показание должно быть больше предыдущего');
    }

    const reading = await this.prisma.meterReading.create({
      data: {
        meterId: dto.meterId,
        value: dto.value,
      },
      include: { meter: true },
    });

    await this.prisma.notification.create({
      data: {
        userId,
        title: 'Показания приняты',
        body: `Вы успешно передали показание ${dto.value} по счётчику №${meter.serialNumber}.`,
        isRead: false,
      },
    });

    return reading;
  }

  async findMyMetersWithLastReading(userId: string) {
    const meters = await this.prisma.meter.findMany({
      where: { userId, isActive: true },
      include: {
        readings: {
          orderBy: { createdAt: 'desc' },
          take: 2,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return meters.map((meter) => ({
      id: meter.id,
      title: meter.title,
      serialNumber: meter.serialNumber,
      type: meter.type,
      isActive: meter.isActive,
      lastReading: meter.readings[0] ?? null,
      previousReading: meter.readings[1] ?? null,
    }));
  }

  async findHistoryByMeter(userId: string, meterId: string) {
    const meter = await this.prisma.meter.findFirst({
      where: { id: meterId, userId },
    });

    if (!meter) {
      throw new NotFoundException('Счётчик не найден');
    }

    const [readings, calculationLines] = await Promise.all([
      this.prisma.meterReading.findMany({
        where: { meterId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.heatingCalculationLine.findMany({
        where: { meterId, userId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return [
      ...readings.map((item) => ({
        id: item.id,
        value: item.value,
        createdAt: item.createdAt,
        source: 'READING',
        amount: null,
        billingMonth: null,
      })),
      ...calculationLines.map((item) => ({
        id: item.id,
        value: Math.round(item.finalConsumption * 100) / 100,
        createdAt: item.createdAt,
        source: 'CALCULATION',
        amount: item.amount,
        billingMonth: item.billingMonth,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getSubmissionWindowInfo() {
    return {
      isOpen: this.isSubmissionWindowOpen(),
      startDay: this.getStartDay(),
      endDay: this.getEndDay(),
      message: this.getSubmissionWindowMessage(),
      forceOpen: this.isSubmissionWindowForced(),
    };
  }

  private isSubmissionWindowOpen(date = new Date()) {
    if (this.isSubmissionWindowForced()) {
      return true;
    }

    const day = date.getDate();
    return day >= this.getStartDay() && day <= this.getEndDay();
  }

  private isSubmissionWindowForced() {
    return ['1', 'true', 'yes'].includes(String(process.env.ALLOW_READINGS_ANY_DAY || '').toLowerCase());
  }

  private getStartDay() {
    const value = Number(process.env.READINGS_START_DAY || 20);
    return Number.isInteger(value) && value >= 1 && value <= 31 ? value : 20;
  }

  private getEndDay() {
    const value = Number(process.env.READINGS_END_DAY || 25);
    return Number.isInteger(value) && value >= 1 && value <= 31 ? value : 25;
  }

  private getSubmissionWindowMessage() {
    return this.isSubmissionWindowForced()
      ? 'Окно передачи показаний принудительно открыто для тестирования.'
      : `Передача показаний доступна только с ${this.getStartDay()} по ${this.getEndDay()} число месяца`;
  }
}
