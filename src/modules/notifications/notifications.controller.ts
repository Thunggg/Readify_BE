import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { ListNotificationsDto } from './dto/list-notifications.dto';
import { NotificationIdDto } from './dto/notification-id.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiResponse } from 'src/shared/responses/api-response';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getNotificationsList(@Req() req: any, @Query() query: ListNotificationsDto) {
    const userId = req?.user?.userId as string;
    return this.notificationsService.getNotificationsList(userId, query);
  }

  @Get('unread-count')
  async getUnreadCount(@Req() req: any) {
    const userId = req?.user?.userId as string;
    const count = await this.notificationsService.getUnreadCount(userId);
    return ApiResponse.success({ count }, 'Lấy số lượng thông báo chưa đọc thành công', 200);
  }

  @Post()
  createNotification(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.createNotification(dto);
  }

  @Get(':id')
  getNotificationDetail(@Req() req: any, @Param() params: NotificationIdDto) {
    const userId = req?.user?.userId as string;
    return this.notificationsService.getNotificationDetail(userId, params.id);
  }

  @Delete(':id')
  deleteNotification(@Req() req: any, @Param() params: NotificationIdDto) {
    const userId = req?.user?.userId as string;
    return this.notificationsService.deleteNotification(userId, params.id);
  }
}

