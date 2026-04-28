import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { RequestStatus } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateMeterReplacementDto } from './create-meter-replacement.dto';
import { UpdateMeterReplacementStatusDto } from './update-meter-replacement-status.dto';

@Injectable()
export class MeterReplacementsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateMeterReplacementDto) {
    const oldMeter = await this.prisma.meter.findFirst({
      where: { id: dto.oldMeterId, userId, isActive: true },
    });

    if (!oldMeter) {
      throw new BadRequestException('Старый счётчик не найден');
    }

    const existingNewMeter = await this.prisma.meter.findFirst({
      where: { serialNumber: dto.newSerialNumber, isActive: true },
    });

    if (existingNewMeter) {
      throw new BadRequestException('Новый серийный номер уже используется');
    }

    return this.prisma.meterReplacementRequest.create({
      data: {
        userId,
        oldMeterId: dto.oldMeterId,
        newTitle: dto.newTitle,
        newSerialNumber: dto.newSerialNumber,
        newType: dto.newType,
        initialReading: dto.initialReading,
        reason: dto.reason,
        comment: dto.comment ?? null,
      },
      include: { oldMeter: true },
    });
  }

  async findMy(userId: string) {
    return this.prisma.meterReplacementRequest.findMany({
      where: { userId },
      include: { oldMeter: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneMy(userId: string, id: string) {
    const request = await this.prisma.meterReplacementRequest.findFirst({
      where: { id, userId },
      include: { oldMeter: true },
    });

    if (!request) {
      throw new NotFoundException('Заявка на замену не найдена');
    }

    return request;
  }

  async findAllAdmin() {
    return this.prisma.meterReplacementRequest.findMany({
      include: { oldMeter: true, user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatusAdmin(id: string, dto: UpdateMeterReplacementStatusDto) {
    const request = await this.prisma.meterReplacementRequest.findUnique({ where: { id } });

    if (!request) {
      throw new NotFoundException('Заявка на замену не найдена');
    }

    if (dto.status === RequestStatus.APPROVED) {
      return this.prisma.$transaction(async (tx) => {
        await tx.meter.update({ where: { id: request.oldMeterId }, data: { isActive: false } });
        const newMeter = await tx.meter.create({
          data: {
            userId: request.userId,
            title: request.newTitle,
            serialNumber: request.newSerialNumber,
            type: request.newType,
          },
        });
        await tx.meterReading.create({ data: { meterId: newMeter.id, value: request.initialReading } });
        await tx.notification.create({
          data: {
            userId: request.userId,
            title: 'Заявка на замену одобрена',
            body: `Счётчик ${request.newSerialNumber} успешно добавлен в систему.`,
          },
        });
        return tx.meterReplacementRequest.update({
          where: { id },
          data: {
            status: dto.status,
            adminComment: dto.adminComment ?? null,
            approvedAt: new Date(),
          },
        });
      });
    }

    if (dto.status === RequestStatus.REJECTED || dto.status === RequestStatus.COMPLETED) {
      await this.prisma.notification.create({
        data: {
          userId: request.userId,
          title: 'Статус заявки на замену обновлён',
          body: dto.adminComment || `Новый статус заявки: ${dto.status}`,
        },
      });
    }

    return this.prisma.meterReplacementRequest.update({
      where: { id },
      data: { status: dto.status, adminComment: dto.adminComment ?? null },
    });
  }
}
