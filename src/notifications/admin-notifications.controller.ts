import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './create-notification.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/notifications')
export class AdminNotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('broadcast')
  broadcast(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.createForAll(dto);
  }

  @Post('user')
  createForUser(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.createForUser(dto.userId!, dto);
  }
}
