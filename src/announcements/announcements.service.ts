import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateAnnouncementDto } from './create-announcement.dto';
import { processInChunks } from '../common/batch';
import { getNotificationBatchSize } from '../env';

@Injectable()
export class AnnouncementsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAnnouncementDto) {
    const announcement = await this.prisma.announcement.create({ data: dto });

    const users = await this.prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true },
    });

    if (users.length) {
      await processInChunks(users, getNotificationBatchSize(), async (chunk) => {
        await this.prisma.notification.createMany({
          data: chunk.map((user) => ({
            userId: user.id,
            title: `Новое объявление: ${dto.title}`,
            body: dto.body,
          })),
        });
      });
    }

    return announcement;
  }

  async findActive() {
    return this.prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllAdmin() {
    return this.prisma.announcement.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async deactivate(id: string) {
    const item = await this.prisma.announcement.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('Объявление не найдено');
    }

    return this.prisma.announcement.update({ where: { id }, data: { isActive: false } });
  }
}
