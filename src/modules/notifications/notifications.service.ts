import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument, NotificationType } from './schemas/notification.schema';
import { ListNotificationsDto, NotificationSortBy, SortOrder } from './dto/list-notifications.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { ApiResponse } from 'src/shared/responses/api-response';
import { ErrorResponse } from 'src/shared/responses/error.response';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  async getNotificationsList(userId: string, query: ListNotificationsDto) {
    // Validate userId
    if (!Types.ObjectId.isValid(userId)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'userId', message: 'Invalid user ID' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    const {
      isRead,
      type,
      q,
      sortBy = NotificationSortBy.CREATED_AT,
      order = SortOrder.DESC,
      page = 1,
      limit = 10,
    } = query;

    // PAGINATION
    const validPage = Math.max(1, page);
    const validLimit = Math.min(50, Math.max(1, limit));
    const skip = (validPage - 1) * validLimit;

    // FILTER
    const filter: any = {
      userId: new Types.ObjectId(userId),
      isDeleted: { $ne: true },
    };

    if (isRead !== undefined) {
      filter.isRead = isRead;
    }

    if (type !== undefined) {
      filter.type = type;
    }

    // SEARCH
    if (q?.trim()) {
      const searchTerm = q.trim();
      filter.$or = [
        { title: { $regex: searchTerm, $options: 'i' } },
        { message: { $regex: searchTerm, $options: 'i' } },
      ];
    }

    // SORT
    const sortMap: Record<string, any> = {
      [NotificationSortBy.CREATED_AT]: { createdAt: order === SortOrder.ASC ? 1 : -1 },
      [NotificationSortBy.TITLE]: { title: order === SortOrder.ASC ? 1 : -1 },
      [NotificationSortBy.TYPE]: { type: order === SortOrder.ASC ? 1 : -1 },
    };

    const sort = {
      ...(sortMap[sortBy] ?? { createdAt: -1 }),
      _id: 1,
    };

    // QUERY
    const [items, total] = await Promise.all([
      this.notificationModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(validLimit)
        .select({
          _id: 1,
          title: 1,
          message: 1,
          type: 1,
          isRead: 1,
          metadata: 1,
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

  async createNotification(dto: CreateNotificationDto) {
    // Validate userId
    if (!Types.ObjectId.isValid(dto.userId)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'userId', message: 'Invalid user ID' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    // Create notification
    const notification = await this.notificationModel.create({
      userId: new Types.ObjectId(dto.userId),
      title: dto.title.trim(),
      message: dto.message.trim(),
      type: dto.type ?? NotificationType.SYSTEM,
      isRead: false,
      metadata: dto.metadata ?? {},
      isDeleted: false,
    });

    const notificationData = notification.toObject();

    return ApiResponse.success(notificationData, 'Tạo thông báo thành công', 201);
  }

  async getNotificationDetail(userId: string, notificationId: string) {
    // Validate userId
    if (!Types.ObjectId.isValid(userId)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'userId', message: 'Invalid user ID' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate notificationId
    if (!Types.ObjectId.isValid(notificationId)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Invalid notification ID' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    // Find notification that belongs to the user
    const notification = await this.notificationModel
      .findOne({
        _id: new Types.ObjectId(notificationId),
        userId: new Types.ObjectId(userId),
        isDeleted: { $ne: true },
      })
      .select({
        _id: 1,
        title: 1,
        message: 1,
        type: 1,
        isRead: 1,
        metadata: 1,
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

    return ApiResponse.success(notification, 'Lấy chi tiết thông báo thành công', 200);
  }

  async deleteNotification(userId: string, notificationId: string) {
    // Validate userId
    if (!Types.ObjectId.isValid(userId)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'userId', message: 'Invalid user ID' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate notificationId
    if (!Types.ObjectId.isValid(notificationId)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Invalid notification ID' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    // Find and soft delete notification
    const notification = await this.notificationModel.findOne({
      _id: new Types.ObjectId(notificationId),
      userId: new Types.ObjectId(userId),
      isDeleted: { $ne: true },
    });

    if (!notification) {
      throw new HttpException(
        ErrorResponse.notFound('Notification not found'),
        HttpStatus.NOT_FOUND,
      );
    }

    // Soft delete
    notification.isDeleted = true;
    await notification.save();

    return ApiResponse.success({ _id: notificationId }, 'Xóa thông báo thành công', 200);
  }

  async getUnreadCount(userId: string): Promise<number> {
    if (!Types.ObjectId.isValid(userId)) {
      return 0;
    }

    return this.notificationModel.countDocuments({
      userId: new Types.ObjectId(userId),
      isRead: false,
      isDeleted: { $ne: true },
    });
  }
}

