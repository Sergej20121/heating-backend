import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateNotificationDto } from './create-notification.dto';
import { processInChunks } from '../common/batch';
import { getMaxNotificationHistory, getNotificationBatchSize } from '../env';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createForUser(userId: string, dto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: { userId, title: dto.title, body: dto.body },
    });
  }

  async createForAll(dto: CreateNotificationDto) {
    const users = await this.prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true },
    });

    if (!users.length) {
      return { message: 'Нет активных пользователей для рассылки', count: 0 };
    }

    await processInChunks(users, getNotificationBatchSize(), async (chunk) => {
      await this.prisma.notification.createMany({
        data: chunk.map((user) => ({ userId: user.id, title: dto.title, body: dto.body })),
      });
    });

    return { message: 'Уведомления успешно отправлены', count: users.length };
  }

  async findMy(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: getMaxNotificationHistory(),
    });
  }

  async unreadCount(userId: string) {
    const count = await this.prisma.notification.count({ where: { userId, isRead: false } });
    return { unreadCount: count };
  }

  async markAsRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({ where: { id, userId } });

    if (!notification) {
      throw new NotFoundException('Уведомление не найдено');
    }

    return this.prisma.notification.update({ where: { id }, data: { isRead: true } });
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { message: 'Все уведомления отмечены как прочитанные', updated: result.count };
  }
}
