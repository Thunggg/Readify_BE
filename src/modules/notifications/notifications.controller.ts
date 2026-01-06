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
import { JwtUtil } from '../../shared/utils/jwt';
import { ConfigService } from '@nestjs/config';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly jwtUtil: JwtUtil,
    private readonly configService: ConfigService,
  ) {}

  private getUserIdFromToken(req: any): string {
    const token = req?.cookies?.accessToken;
    if (!token) {
      return req?.user?.userId; // Fallback to req.user if no token
    }
    try {
      const payload = this.jwtUtil.verifyAccessToken(
        token,
        this.configService.get<string>('jwt.accessTokenSecret') as string,
      );
      return payload.sub.toString();
    } catch {
      return req?.user?.userId; // Fallback to req.user if decode fails
    }
  }

  @Post()
  createNotification(@Body() dto: CreateNotificationDto, @Req() req: any) {
    const userId = this.getUserIdFromToken(req);
    return this.notificationsService.createNotification(dto, userId);
  }

  @Get()
  getNotificationsList(
    @Query() query: ListNotificationsDto,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Req() req: any,
  ) {
    const userId = this.getUserIdFromToken(req);
    return this.notificationsService.getNotificationsList(query, userId, page, limit);
  }

  // Admin endpoints - Must be before :id routes to avoid route conflicts
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

  @Get(':id')
  getNotificationDetail(@Param() params: NotificationIdDto, @Req() req: any) {
    const userId = this.getUserIdFromToken(req);
    return this.notificationsService.getNotificationDetail(params.id, userId);
  }

  @Patch('mark-all-read')
  markAllAsRead(@Req() req: any) {
    const userId = this.getUserIdFromToken(req);
    return this.notificationsService.markAllAsRead(userId);
  }

  @Patch(':id')
  updateNotification(
    @Param() params: NotificationIdDto,
    @Body() dto: UpdateNotificationDto,
    @Req() req: any,
  ) {
    const userId = this.getUserIdFromToken(req);
    const role = req?.user?.role;
    return this.notificationsService.updateNotification(params.id, dto, userId, role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  deleteNotification(@Param() params: NotificationIdDto, @Req() req: any) {
    const userId = this.getUserIdFromToken(req);
    const role = req?.user?.role;
    return this.notificationsService.deleteNotification(params.id, userId, role);
  }

  @Delete('read/:id')
  @UseGuards(JwtAuthGuard)
  deleteNotificationRead(@Param() params: NotificationIdDto, @Req() req: any) {
    const userId = this.getUserIdFromToken(req);
    return this.notificationsService.deleteNotificationRead(params.id, userId);
  }
}

