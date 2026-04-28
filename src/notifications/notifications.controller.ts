import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { NotificationsService } from './notifications.service';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findMy(@CurrentUser() user: { sub: string; phone: string }) {
    return this.notificationsService.findMy(user.sub);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() user: { sub: string; phone: string }) {
    return this.notificationsService.unreadCount(user.sub);
  }

  @Patch(':id/read')
  markAsRead(
    @CurrentUser() user: { sub: string; phone: string },
    @Param('id') id: string,
  ) {
    return this.notificationsService.markAsRead(user.sub, id);
  }

  @Post('read-all')
  markAllAsRead(@CurrentUser() user: { sub: string; phone: string }) {
    return this.notificationsService.markAllAsRead(user.sub);
  }
}
