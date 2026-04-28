import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MeterType, PaymentStatus, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma.service';
import { CreateUserByAdminDto } from './dto.create-user.dto';
import { CreateMeterByAdminDto } from './dto.create-meter.dto';
import { CreateReadingByAdminDto } from './dto.create-reading.dto';
import { UpdateMeterByAdminDto } from './dto.update-meter.dto';
import { UpdateReadingByAdminDto } from './dto.update-reading.dto';
import { UpsertHeatingSettingDto } from './dto.upsert-heating-setting.dto';
import { GenerateHeatingPaymentsDto } from './dto.generate-heating-payments.dto';
import { validatePasswordOrThrow } from '../common/password-policy';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  getAllUsers() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        meters: { where: { isActive: true } },
        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
  }

  async createUser(dto: CreateUserByAdminDto) {
    const exists = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (exists) {
      throw new BadRequestException('Пользователь с таким телефоном уже существует');
    }

    validatePasswordOrThrow(dto.password);

    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        phone: dto.phone,
        passwordHash,
        fullAddress: dto.fullAddress,
        contractNumber: dto.contractNumber,
        status: UserStatus.ACTIVE,
        role: UserRole.USER,
      },
    });
  }

  async blockUser(id: string) {
    await this.ensureUser(id);

    return this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.BLOCKED },
    });
  }

  async activateUser(id: string) {
    await this.ensureUser(id);

    return this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.ACTIVE },
    });
  }

  getAllMeters() {
    return this.prisma.meter.findMany({
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            fullAddress: true,
            contractNumber: true,
            heatedArea: true,
          },
        },
        readings: {
          orderBy: { createdAt: 'desc' },
          take: 2,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createMeter(dto: CreateMeterByAdminDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new BadRequestException('Пользователь не найден');
    }

    const existingMeter = await this.prisma.meter.findFirst({
      where: { serialNumber: dto.serialNumber },
    });

    if (existingMeter) {
      throw new BadRequestException('Счётчик с таким серийным номером уже существует');
    }

    return this.prisma.meter.create({
      data: {
        userId: dto.userId,
        title: dto.title,
        serialNumber: dto.serialNumber,
        type: dto.type,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateMeter(id: string, dto: UpdateMeterByAdminDto) {
    await this.ensureMeter(id);

    if (dto.serialNumber) {
      const existingMeter = await this.prisma.meter.findFirst({
        where: {
          serialNumber: dto.serialNumber,
          NOT: { id },
        },
      });

      if (existingMeter) {
        throw new BadRequestException('Счётчик с таким серийным номером уже существует');
      }
    }

    return this.prisma.meter.update({
      where: { id },
      data: {
        title: dto.title,
        serialNumber: dto.serialNumber,
        type: dto.type,
        isActive: dto.isActive,
      },
    });
  }

  async activateMeter(id: string) {
    await this.ensureMeter(id);

    return this.prisma.meter.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async deactivateMeter(id: string) {
    await this.ensureMeter(id);

    return this.prisma.meter.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async deleteMeter(id: string) {
    await this.ensureMeter(id);

    const readingsCount = await this.prisma.meterReading.count({
      where: { meterId: id },
    });

    if (readingsCount > 0) {
      return this.prisma.meter.update({
        where: { id },
        data: { isActive: false },
      });
    }

    return this.prisma.meter.delete({
      where: { id },
    });
  }

  getAllReadings() {
    return this.prisma.meterReading.findMany({
      include: {
        meter: {
          include: {
            user: {
              select: {
                id: true,
                phone: true,
                fullAddress: true,
                contractNumber: true,
                heatedArea: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createReading(dto: CreateReadingByAdminDto) {
    const meter = await this.prisma.meter.findUnique({
      where: { id: dto.meterId },
      include: {
        readings: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!meter) {
      throw new BadRequestException('Счётчик не найден');
    }

    if (!meter.isActive) {
      throw new BadRequestException('Нельзя добавить показание для неактивного счётчика');
    }

    const lastReading = meter.readings[0];
    if (lastReading && dto.value < lastReading.value) {
      throw new BadRequestException('Новое показание не может быть меньше предыдущего');
    }

    return this.prisma.meterReading.create({
      data: {
        meterId: dto.meterId,
        value: Math.round(dto.value),
      },
    });
  }

  async updateReading(id: string, dto: UpdateReadingByAdminDto) {
    const reading = await this.prisma.meterReading.findUnique({
      where: { id },
      include: {
        meter: {
          include: {
            readings: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });

    if (!reading) {
      throw new NotFoundException('Показание не найдено');
    }

    const allReadings = reading.meter.readings;
    const currentIndex = allReadings.findIndex((item) => item.id === id);

    const previous = currentIndex > 0 ? allReadings[currentIndex - 1] : null;
    const next = currentIndex >= 0 && currentIndex < allReadings.length - 1 ? allReadings[currentIndex + 1] : null;
    const nextValue = Math.round(dto.value);

    if (previous && nextValue < previous.value) {
      throw new BadRequestException('Новое значение не может быть меньше предыдущего показания');
    }

    if (next && nextValue > next.value) {
      throw new BadRequestException('Новое значение не может быть больше следующего показания');
    }

    return this.prisma.meterReading.update({
      where: { id },
      data: { value: nextValue },
    });
  }

  async getHeatingSetting(billingMonth: string) {
    const setting = await this.prisma.heatingSetting.findUnique({
      where: { effectiveFromMonth: billingMonth },
    });

    if (!setting) {
      throw new NotFoundException(`Настройки отопления для ${billingMonth} не найдены`);
    }

    return setting;
  }

  async upsertHeatingSetting(dto: UpsertHeatingSettingDto) {
    return this.prisma.heatingSetting.upsert({
      where: { effectiveFromMonth: dto.effectiveFromMonth },
      update: {
        tariffPerUnit: dto.tariffPerUnit,
        normPerSquareMeter: dto.normPerSquareMeter,
        seasonCoefficient: dto.seasonCoefficient,
        commonAreaCoefficient: dto.commonAreaCoefficient,
        lossCoefficient: dto.lossCoefficient,
      },
      create: {
        effectiveFromMonth: dto.effectiveFromMonth,
        tariffPerUnit: dto.tariffPerUnit,
        normPerSquareMeter: dto.normPerSquareMeter,
        seasonCoefficient: dto.seasonCoefficient,
        commonAreaCoefficient: dto.commonAreaCoefficient,
        lossCoefficient: dto.lossCoefficient,
      },
    });
  }

  async getHeatingCalculations(billingMonth: string) {
    return this.prisma.heatingCalculationLine.findMany({
      where: { billingMonth },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            fullAddress: true,
            contractNumber: true,
            heatedArea: true,
          },
        },
        meter: {
          select: {
            id: true,
            title: true,
            serialNumber: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async generateHeatingPayments(dto: GenerateHeatingPaymentsDto) {
    const setting = await this.prisma.heatingSetting.findUnique({
      where: { effectiveFromMonth: dto.billingMonth },
    });

    if (!setting) {
      throw new BadRequestException(`Сначала задайте настройки отопления для ${dto.billingMonth}`);
    }

    const existingPayments = await this.prisma.payment.count({
      where: { billingMonth: dto.billingMonth },
    });

    if (existingPayments > 0) {
      throw new BadRequestException(`Начисления за ${dto.billingMonth} уже существуют`);
    }

    const existingLines = await this.prisma.heatingCalculationLine.count({
      where: { billingMonth: dto.billingMonth },
    });

    if (existingLines > 0) {
      throw new BadRequestException(`Расчётные строки за ${dto.billingMonth} уже существуют`);
    }

    const run = await this.prisma.heatingCalculationRun.create({
      data: {
        billingMonth: dto.billingMonth,
        tariffPerUnit: setting.tariffPerUnit,
        normPerSquareMeter: setting.normPerSquareMeter,
        seasonCoefficient: setting.seasonCoefficient,
        commonAreaCoefficient: setting.commonAreaCoefficient,
        lossCoefficient: setting.lossCoefficient,
      },
    });

    const { start, end } = this.getMonthBounds(dto.billingMonth);
    const previousMonth = this.getPreviousMonth(dto.billingMonth);
    const { start: prevStart, end: prevEnd } = this.getMonthBounds(previousMonth);

    const meters = await this.prisma.meter.findMany({
      where: {
        isActive: true,
        type: MeterType.HEATING,
      },
      include: {
        user: true,
        readings: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    const dueDate = new Date(end);
    dueDate.setDate(dueDate.getDate() + 14);

    let created = 0;
    const skipped: { meterId: string; reason: string }[] = [];

    for (const meter of meters) {
      const area = Number(meter.user.heatedArea || 0);

      const prevReading = meter.readings
        .filter((r) => r.createdAt >= prevStart && r.createdAt < prevEnd)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

      const currentReading = meter.readings
        .filter((r) => r.createdAt >= start && r.createdAt < end)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

      let method: 'BY_METER' | 'BY_NORM' = 'BY_NORM';
      let rawConsumption = 0;
      let previousReadingValue: number | null = null;
      let currentReadingValue: number | null = null;

      if (prevReading && currentReading) {
        const delta = currentReading.value - prevReading.value;

        if (delta >= 0) {
          method = 'BY_METER';
          rawConsumption = delta;
          previousReadingValue = prevReading.value;
          currentReadingValue = currentReading.value;
        }
      }

      if (method === 'BY_NORM') {
        if (area <= 0) {
          skipped.push({
            meterId: meter.id,
            reason: 'Не задана отапливаемая площадь и нет корректных показаний за период',
          });
          continue;
        }

        rawConsumption = area * setting.normPerSquareMeter;
      }

      const finalConsumption =
        rawConsumption *
        setting.seasonCoefficient *
        setting.commonAreaCoefficient *
        setting.lossCoefficient;

      const amountFloat = finalConsumption * setting.tariffPerUnit;
      const amount = Math.round(amountFloat);
      const consumptionForPayment = Math.round(finalConsumption);

      const line = await this.prisma.heatingCalculationLine.create({
        data: {
          runId: run.id,
          userId: meter.userId,
          meterId: meter.id,
          billingMonth: dto.billingMonth,
          method,
          area,
          previousReading: previousReadingValue,
          currentReading: currentReadingValue,
          rawConsumption: Number(rawConsumption.toFixed(4)),
          finalConsumption: Number(finalConsumption.toFixed(4)),
          normPerSquareMeter: setting.normPerSquareMeter,
          seasonCoefficient: setting.seasonCoefficient,
          commonAreaCoefficient: setting.commonAreaCoefficient,
          lossCoefficient: setting.lossCoefficient,
          tariffPerUnit: setting.tariffPerUnit,
          amount,
        },
      });

      await this.prisma.payment.create({
        data: {
          userId: meter.userId,
          billingMonth: dto.billingMonth,
          amount,
          consumption: consumptionForPayment,
          dueDate,
          status: PaymentStatus.PENDING,
          calculationRunId: run.id,
          calculationLineId: line.id,
        },
      });

      created += 1;
    }

    return {
      message: 'Начисления по отоплению сформированы',
      billingMonth: dto.billingMonth,
      created,
      skipped,
      runId: run.id,
    };
  }

  async getDashboard() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      users,
      activeUsers,
      blockedUsers,
      activeMeters,
      sealRequests,
      replacementRequests,
      pendingPayments,
      overduePayments,
      paidPayments,
      totalPaidAgg,
      totalDebtAgg,
      readingsToday,
      readingsThisMonth,
      newUsersThisMonth,
      recentPayments,
      recentReadings,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
      this.prisma.user.count({ where: { status: UserStatus.BLOCKED } }),
      this.prisma.meter.count({ where: { isActive: true } }),
      this.prisma.sealRequest.count({ where: { status: { in: ['CREATED', 'IN_REVIEW'] } } }),
      this.prisma.meterReplacementRequest.count({ where: { status: { in: ['CREATED', 'IN_REVIEW'] } } }),
      this.prisma.payment.count({ where: { status: PaymentStatus.PENDING } }),
      this.prisma.payment.count({ where: { status: PaymentStatus.OVERDUE } }),
      this.prisma.payment.count({ where: { status: PaymentStatus.PAID } }),
      this.prisma.payment.aggregate({ where: { status: PaymentStatus.PAID }, _sum: { amount: true } }),
      this.prisma.payment.aggregate({ where: { status: { in: [PaymentStatus.PENDING, PaymentStatus.OVERDUE] } }, _sum: { amount: true } }),
      this.prisma.meterReading.count({ where: { createdAt: { gte: dayStart } } }),
      this.prisma.meterReading.count({ where: { createdAt: { gte: monthStart } } }),
      this.prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
      this.prisma.payment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { phone: true, fullAddress: true, contractNumber: true } } },
      }),
      this.prisma.meterReading.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          meter: {
            include: {
              user: { select: { phone: true, fullAddress: true, contractNumber: true } },
            },
          },
        },
      }),
    ]);

    return {
      users,
      activeUsers,
      blockedUsers,
      activeMeters,
      openRequests: sealRequests + replacementRequests,
      pendingPayments,
      overduePayments,
      paidPayments,
      totalPaidAmount: totalPaidAgg._sum.amount ?? 0,
      totalDebtAmount: totalDebtAgg._sum.amount ?? 0,
      readingsToday,
      readingsThisMonth,
      newUsersThisMonth,
      recentPayments,
      recentReadings,
    };
  }

  private getMonthBounds(billingMonth: string) {
    const [year, month] = billingMonth.split('-').map(Number);
    const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const end = new Date(year, month, 1, 0, 0, 0, 0);
    return { start, end };
  }

  private getPreviousMonth(billingMonth: string) {
    const [year, month] = billingMonth.split('-').map(Number);
    const date = new Date(year, month - 2, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  private async ensureUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return user;
  }

  private async ensureMeter(id: string) {
    const meter = await this.prisma.meter.findUnique({ where: { id } });

    if (!meter) {
      throw new NotFoundException('Счётчик не найден');
    }

    return meter;
  }
}