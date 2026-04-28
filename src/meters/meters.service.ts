import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateMeterDto } from './create-meter.dto';

@Injectable()
export class MetersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateMeterDto) {
    const exists = await this.prisma.meter.findFirst({
      where: {
        serialNumber: dto.serialNumber,
        isActive: true,
      },
    });

    if (exists) {
      throw new BadRequestException('Счётчик с таким серийным номером уже существует');
    }

    return this.prisma.meter.create({
      data: {
        userId,
        title: dto.title,
        serialNumber: dto.serialNumber,
        type: dto.type,
      },
    });
  }

  async findAllMy(userId: string) {
    return this.prisma.meter.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneMy(userId: string, meterId: string) {
    const meter = await this.prisma.meter.findFirst({
      where: { id: meterId, userId },
    });

    if (!meter) {
      throw new NotFoundException('Счётчик не найден');
    }

    return meter;
  }

  async deactivate(userId: string, meterId: string) {
    const meter = await this.prisma.meter.findFirst({
      where: { id: meterId, userId },
    });

    if (!meter) {
      throw new NotFoundException('Счётчик не найден');
    }

    return this.prisma.meter.update({
      where: { id: meterId },
      data: { isActive: false },
    });
  }
}
