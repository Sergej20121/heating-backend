import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateSealRequestDto } from './create-seal-request.dto';
import { UpdateSealRequestStatusDto } from './update-seal-request-status.dto';

@Injectable()
export class SealRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateSealRequestDto) {
    const cleanedComment = dto.comment?.trim() || '';
    const cleanedPreferredDate = dto.preferredDate?.trim() || '';

    if (!cleanedComment) {
      throw new BadRequestException('Комментарий к заявке обязателен');
    }

    if (dto.meterId) {
      const meter = await this.prisma.meter.findFirst({
        where: { id: dto.meterId, userId, isActive: true },
      });

      if (!meter) {
        throw new BadRequestException('Указанный счётчик не найден или не активен');
      }
    }

    let parsedPreferredDate: Date | null = null;

    if (cleanedPreferredDate) {
      const date = new Date(cleanedPreferredDate);

      if (Number.isNaN(date.getTime())) {
        throw new BadRequestException('Некорректная предпочтительная дата');
      }

      parsedPreferredDate = date;
    }

    return this.prisma.sealRequest.create({
      data: {
        userId,
        meterId: dto.meterId ?? null,
        comment: cleanedComment,
        preferredDate: parsedPreferredDate,
      },
      include: { meter: true },
    });
  }

  async findMy(userId: string) {
    return this.prisma.sealRequest.findMany({
      where: { userId },
      include: { meter: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneMy(userId: string, id: string) {
    const request = await this.prisma.sealRequest.findFirst({
      where: { id, userId },
      include: { meter: true },
    });

    if (!request) {
      throw new NotFoundException('Заявка не найдена');
    }

    return request;
  }

  async findAllAdmin() {
    return this.prisma.sealRequest.findMany({
      include: { meter: true, user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatusAdmin(id: string, dto: UpdateSealRequestStatusDto) {
    const request = await this.prisma.sealRequest.findUnique({ where: { id } });

    if (!request) {
      throw new NotFoundException('Заявка не найдена');
    }

    const updated = await this.prisma.sealRequest.update({
      where: { id },                                                                                        
      data: { status: dto.status, adminComment: dto.adminComment ?? null },
    });

    await this.prisma.notification.create({
      data: {
        userId: request.userId,
        title: 'Статус заявки на пломбировку обновлён',
        body: dto.adminComment || `Новый статус заявки: ${dto.status}`,
      },
    });

    return updated;
  }
}                                                                                                                                                         