import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { ListNotificationsDto } from './dto/list-notifications.dto';
import { ApiResponse } from 'src/shared/responses/api-response';
import { ErrorResponse } from 'src/shared/responses/error.response';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  async createNotification(dto: CreateNotificationDto, currentUserId?: string) {
    const userId = dto.userId ? new Types.ObjectId(dto.userId) : new Types.ObjectId(currentUserId);

    if (!userId) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'userId', message: 'User ID is required' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    const notification = await this.notificationModel.create({
      userId,
      title: dto.title.trim(),
      content: dto.content.trim(),
      type: dto.type || 'SYSTEM',
      isRead: false,
      relatedOrderId: dto.relatedOrderId ? new Types.ObjectId(dto.relatedOrderId) : undefined,
      relatedPromotionId: dto.relatedPromotionId ? new Types.ObjectId(dto.relatedPromotionId) : undefined,
      isActive: true,
    });

    const notificationData = notification.toObject();

    return ApiResponse.success(notificationData, 'Tạo thông báo thành công', 201);
  }

  async getNotificationsList(query: ListNotificationsDto, currentUserId: string) {
    const { type, isRead, page = 1, limit = 10 } = query;

    // PAGINATION
    const validPage = Math.max(1, page);
    const validLimit = Math.min(50, Math.max(1, limit));
    const skip = (validPage - 1) * validLimit;

    // FILTER
    const filter: any = {
      userId: new Types.ObjectId(currentUserId),
      isActive: true,
    };

    if (type) {
      filter.type = type;
    }

    if (isRead !== undefined) {
      filter.isRead = isRead;
    }

    // QUERY
    const [items, total] = await Promise.all([
      this.notificationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(validLimit)
        .populate('relatedOrderId', 'orderCode status')
        .populate('relatedPromotionId', 'code name')
        .select({
          _id: 1,
          userId: 1,
          title: 1,
          content: 1,
          type: 1,
          isRead: 1,
          readAt: 1,
          relatedOrderId: 1,
          relatedPromotionId: 1,
          createdAt: 1,
          updatedAt: 1,
        })
        .lean(),

      this.notificationModel.countDocuments(filter),
    ]);

    return ApiResponse.paginated(
      items,
      {
        page: validPage,
        limit: validLimit,
        total,
      },
      'Lấy danh sách thông báo thành công',
    );
  }

  async getNotificationDetail(notificationId: string, currentUserId: string) {
    // Validate notificationId
    if (!Types.ObjectId.isValid(notificationId)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Invalid notification ID' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    const notification = await this.notificationModel
      .findOne({
        _id: new Types.ObjectId(notificationId),
        userId: new Types.ObjectId(currentUserId),
        isActive: true,
      })
      .populate('relatedOrderId', 'orderCode status totalAmount finalAmount')
      .populate('relatedPromotionId', 'code name discountType discountValue')
      .select({
        _id: 1,
        userId: 1,
        title: 1,
        content: 1,
        type: 1,
        isRead: 1,
        readAt: 1,
        relatedOrderId: 1,
        relatedPromotionId: 1,
        createdAt: 1,
        updatedAt: 1,
      })
      .lean();

    if (!notification) {
      throw new HttpException(
        ErrorResponse.notFound('Notification not found'),
        HttpStatus.NOT_FOUND,
      );
    }

    // Mark as read if not already read
    if (!notification.isRead) {
      await this.notificationModel.findByIdAndUpdate(notificationId, {
        isRead: true,
        readAt: new Date(),
      });
      notification.isRead = true;
      notification.readAt = new Date();
    }

    return ApiResponse.success(notification, 'Lấy chi tiết thông báo thành công', 200);
  }

  async updateNotification(notificationId: string, dto: UpdateNotificationDto, currentUserId: string) {
    // Validate notificationId
    if (!Types.ObjectId.isValid(notificationId)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Invalid notification ID' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    const notification = await this.notificationModel.findOne({
      _id: new Types.ObjectId(notificationId),
      userId: new Types.ObjectId(currentUserId),
      isActive: true,
    });

    if (!notification) {
      throw new HttpException(
        ErrorResponse.notFound('Notification not found'),
        HttpStatus.NOT_FOUND,
      );
    }

    if (dto.isRead !== undefined) {
      notification.isRead = dto.isRead;
      if (dto.isRead && !notification.readAt) {
        notification.readAt = new Date();
      } else if (!dto.isRead) {
        notification.readAt = undefined;
      }
    }

    const saved = await notification.save();
    const notificationData = saved.toObject();

    return ApiResponse.success(notificationData, 'Cập nhật thông báo thành công', 200);
  }

  async deleteNotification(notificationId: string, currentUserId: string) {
    // Validate notificationId
    if (!Types.ObjectId.isValid(notificationId)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Invalid notification ID' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    const notification = await this.notificationModel.findOne({
      _id: new Types.ObjectId(notificationId),
      userId: new Types.ObjectId(currentUserId),
      isActive: true,
    });

    if (!notification) {
      throw new HttpException(
        ErrorResponse.notFound('Notification not found'),
        HttpStatus.NOT_FOUND,
      );
    }

    // Soft delete
    notification.isActive = false;
    await notification.save();

    return ApiResponse.success({ _id: notificationId }, 'Xóa thông báo thành công', 200);
  }

  async markAllAsRead(currentUserId: string) {
    const result = await this.notificationModel.updateMany(
      {
        userId: new Types.ObjectId(currentUserId),
        isRead: false,
        isActive: true,
      },
      {
        isRead: true,
        readAt: new Date(),
      },
    );

    return ApiResponse.success(
      { updatedCount: result.modifiedCount },
      'Đánh dấu tất cả thông báo đã đọc thành công',
      200,
    );
  }
}

