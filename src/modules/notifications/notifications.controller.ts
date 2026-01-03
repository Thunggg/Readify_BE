import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { ListNotificationsDto } from './dto/list-notifications.dto';
import { AdminListNotificationsDto } from './dto/admin-list-notifications.dto';
import { NotificationIdDto } from './dto/notification-id.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { AccountRole } from '../staff/constants/staff.enum';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  createNotification(@Body() dto: CreateNotificationDto, @Req() req: any) {
    return this.notificationsService.createNotification(dto, req?.user?.userId);
  }

  @Get()
  getNotificationsList(@Query() query: ListNotificationsDto, @Req() req: any) {
    return this.notificationsService.getNotificationsList(query, req?.user?.userId);
  }

  @Get(':id')
  getNotificationDetail(@Param() params: NotificationIdDto, @Req() req: any) {
    return this.notificationsService.getNotificationDetail(params.id, req?.user?.userId);
  }

  @Patch('mark-all-read')
  markAllAsRead(@Req() req: any) {
    return this.notificationsService.markAllAsRead(req?.user?.userId);
  }

  @Patch(':id')
  updateNotification(
    @Param() params: NotificationIdDto,
    @Body() dto: UpdateNotificationDto,
    @Req() req: any,
  ) {
    return this.notificationsService.updateNotification(params.id, dto, req?.user?.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  deleteNotification(@Param() params: NotificationIdDto, @Req() req: any) {
    return this.notificationsService.deleteNotification(params.id, req?.user?.userId, req?.user?.role);
  }

  // Admin endpoints - Full management capabilities
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AccountRole.ADMIN)
  getAdminNotificationsList(@Query() query: AdminListNotificationsDto) {
    return this.notificationsService.getAdminNotificationsList(query);
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AccountRole.ADMIN)
  getAdminNotificationDetail(@Param() params: NotificationIdDto) {
    return this.notificationsService.getAdminNotificationDetail(params.id);
  }
}

