import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { NotificationRead, NotificationReadDocument } from './schemas/notification-read.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { ListNotificationsDto } from './dto/list-notifications.dto';
import { AdminListNotificationsDto } from './dto/admin-list-notifications.dto';
import { ApiResponse } from 'src/shared/responses/api-response';
import { ErrorResponse } from 'src/shared/responses/error.response';
import { AccountRole } from '../staff/constants/staff.enum';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(NotificationRead.name)
    private readonly notificationReadModel: Model<NotificationReadDocument>,
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
      relatedOrderId: dto.relatedOrderId ? new Types.ObjectId(dto.relatedOrderId) : undefined,
      relatedPromotionId: dto.relatedPromotionId ? new Types.ObjectId(dto.relatedPromotionId) : undefined,
      metadata: dto.metadata || {},
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

    const currentUserIdObj = new Types.ObjectId(currentUserId);

    // BASE FILTER
    const baseFilter: any = {
      userId: currentUserIdObj,
      isActive: true,
    };

    if (type) {
      baseFilter.type = type;
    }

    // HANDLE isRead FILTER
    let notificationIdsFilter: Types.ObjectId[] | null = null;

    if (isRead !== undefined) {
      if (isRead === true) {
        // Get all read notification IDs
        const readRecords = await this.notificationReadModel
          .find({ userId: currentUserIdObj })
          .select('notificationId')
          .lean();
        notificationIdsFilter = readRecords.map((r) => r.notificationId as Types.ObjectId);
      } else {
        // Get all notification IDs
        const allNotifications = await this.notificationModel
          .find(baseFilter)
          .select('_id')
          .lean();
        const allNotificationIds = allNotifications.map((n) => n._id as Types.ObjectId);

        // Get read notification IDs
        const readRecords = await this.notificationReadModel
          .find({ userId: currentUserIdObj })
          .select('notificationId')
          .lean();
        const readNotificationIds = new Set(
          readRecords.map((r) => r.notificationId.toString()),
        );

        // Filter out read notifications
        notificationIdsFilter = allNotificationIds.filter(
          (id) => !readNotificationIds.has(id.toString()),
        );
      }

      // If no notifications match the isRead filter, return empty result
      if (notificationIdsFilter.length === 0) {
        return ApiResponse.paginated(
          [],
          {
            page: validPage,
            limit: validLimit,
            total: 0,
          },
          'Lấy danh sách thông báo thành công',
        );
      }

      baseFilter._id = { $in: notificationIdsFilter };
    }

    // QUERY NOTIFICATIONS
    const [items, total] = await Promise.all([
      this.notificationModel
        .find(baseFilter)
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
          relatedOrderId: 1,
          relatedPromotionId: 1,
          createdAt: 1,
          updatedAt: 1,
        })
        .lean(),

      this.notificationModel.countDocuments(baseFilter),
    ]);

    // GET READ STATUS FOR EACH NOTIFICATION
    const notificationIds = items.map((item) => item._id);
    const readRecords = await this.notificationReadModel
      .find({
        notificationId: { $in: notificationIds },
        userId: currentUserIdObj,
      })
      .lean();

    const readMap = new Map(
      readRecords.map((record) => [record.notificationId.toString(), record.readAt]),
    );

    // ADD isRead AND readAt TO EACH ITEM
    const itemsWithReadStatus = items.map((item) => {
      const readAt = readMap.get(item._id.toString());
      return {
        ...item,
        isRead: !!readAt,
        readAt: readAt || null,
      };
    });

    return ApiResponse.paginated(
      itemsWithReadStatus,
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

    // Check if already read
    let readRecord = await this.notificationReadModel.findOne({
      notificationId: new Types.ObjectId(notificationId),
      userId: new Types.ObjectId(currentUserId),
    });

    // Mark as read if not already read (chỉ xét khi xem chi tiết thông báo)
    if (!readRecord) {
      readRecord = await this.notificationReadModel.create({
        notificationId: new Types.ObjectId(notificationId),
        userId: new Types.ObjectId(currentUserId),
        readAt: new Date(),
      });
    }

    const notificationData = {
      ...notification,
      isRead: true,
      readAt: readRecord.readAt,
    };

    return ApiResponse.success(notificationData, 'Lấy chi tiết thông báo thành công', 200);
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

    // Handle isRead update using NotificationRead collection
    if (dto.isRead !== undefined) {
      if (dto.isRead) {
        // Mark as read - create or update NotificationRead record
        await this.notificationReadModel.findOneAndUpdate(
          {
            notificationId: new Types.ObjectId(notificationId),
            userId: new Types.ObjectId(currentUserId),
          },
          {
            notificationId: new Types.ObjectId(notificationId),
            userId: new Types.ObjectId(currentUserId),
            readAt: new Date(),
          },
          { upsert: true, new: true },
        );
      } else {
        // Mark as unread - delete NotificationRead record
        await this.notificationReadModel.deleteOne({
          notificationId: new Types.ObjectId(notificationId),
          userId: new Types.ObjectId(currentUserId),
        });
      }
    }

    const notificationData = notification.toObject();

    // Get read status
    const readRecord = await this.notificationReadModel.findOne({
      notificationId: new Types.ObjectId(notificationId),
      userId: new Types.ObjectId(currentUserId),
    });

    return ApiResponse.success(
      {
        ...notificationData,
        isRead: !!readRecord,
        readAt: readRecord?.readAt || null,
      },
      'Cập nhật thông báo thành công',
      200,
    );
  }

  async deleteNotification(notificationId: string) {
    // Validate notificationId
    if (!Types.ObjectId.isValid(notificationId)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Invalid notification ID' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    const notification = await this.notificationModel.findOne({
      _id: new Types.ObjectId(notificationId),
      isActive: true,
    });

    if (!notification) {
      throw new HttpException(
        ErrorResponse.notFound('Notification not found'),
        HttpStatus.NOT_FOUND,
      );
    }

    // Role check is handled by @Roles(AccountRole.ADMIN) decorator in controller
    // Only admin can reach this point

    // Soft delete
    notification.isActive = false;
    await notification.save();

    return ApiResponse.success({ _id: notificationId }, 'Xóa thông báo thành công', 200);
  }

  async markAllAsRead(currentUserId: string) {
    // Get all unread notifications for this user
    const unreadNotifications = await this.notificationModel
      .find({
        userId: new Types.ObjectId(currentUserId),
        isActive: true,
      })
      .select('_id')
      .lean();

    const notificationIds = unreadNotifications.map((n) => n._id);

    // Get already read notifications
    const alreadyRead = await this.notificationReadModel
      .find({
        notificationId: { $in: notificationIds },
        userId: new Types.ObjectId(currentUserId),
      })
      .select('notificationId')
      .lean();

    const alreadyReadIds = new Set(
      alreadyRead.map((r) => r.notificationId.toString()),
    );

    // Filter out already read notifications
    const toMarkAsRead = notificationIds.filter(
      (id) => !alreadyReadIds.has(id.toString()),
    );

    // Create NotificationRead records for unread notifications
    const readRecords = toMarkAsRead.map((notificationId) => ({
      notificationId: new Types.ObjectId(notificationId),
      userId: new Types.ObjectId(currentUserId),
      readAt: new Date(),
    }));

    if (readRecords.length > 0) {
      await this.notificationReadModel.insertMany(readRecords);
    }

    return ApiResponse.success(
      { updatedCount: readRecords.length },
      'Đánh dấu tất cả thông báo đã đọc thành công',
      200,
    );
  }

  async getAdminNotificationsList(query: AdminListNotificationsDto) {
    // Role check is handled by @Roles(AccountRole.ADMIN) decorator in controller
    // Only admin can reach this point

    const { userId, type, isRead, page = 1, limit = 10 } = query;

    // PAGINATION
    const validPage = Math.max(1, page);
    const validLimit = Math.min(50, Math.max(1, limit));
    const skip = (validPage - 1) * validLimit;

    // BASE FILTER
    const baseFilter: any = {
      isActive: true,
    };

    if (userId) {
      if (!Types.ObjectId.isValid(userId)) {
        throw new HttpException(
          ErrorResponse.validationError([{ field: 'userId', message: 'Invalid user ID' }]),
          HttpStatus.BAD_REQUEST,
        );
      }
      baseFilter.userId = new Types.ObjectId(userId);
    }

    if (type) {
      baseFilter.type = type;
    }

    // HANDLE isRead FILTER (if userId is provided)
    let notificationIdsFilter: Types.ObjectId[] | null = null;

    if (isRead !== undefined && userId) {
      const userIdObj = new Types.ObjectId(userId);
      if (isRead === true) {
        // Get all read notification IDs for this user
        const readRecords = await this.notificationReadModel
          .find({ userId: userIdObj })
          .select('notificationId')
          .lean();
        notificationIdsFilter = readRecords.map((r) => r.notificationId as Types.ObjectId);
      } else {
        // Get all notification IDs for this user
        const allNotifications = await this.notificationModel
          .find(baseFilter)
          .select('_id')
          .lean();
        const allNotificationIds = allNotifications.map((n) => n._id as Types.ObjectId);

        // Get read notification IDs
        const readRecords = await this.notificationReadModel
          .find({ userId: userIdObj })
          .select('notificationId')
          .lean();
        const readNotificationIds = new Set(
          readRecords.map((r) => r.notificationId.toString()),
        );

        // Filter out read notifications
        notificationIdsFilter = allNotificationIds.filter(
          (id) => !readNotificationIds.has(id.toString()),
        );
      }

      // If no notifications match the isRead filter, return empty result
      if (notificationIdsFilter.length === 0) {
        return ApiResponse.paginated(
          [],
          {
            page: validPage,
            limit: validLimit,
            total: 0,
          },
          'Lấy danh sách thông báo thành công',
        );
      }

      baseFilter._id = { $in: notificationIdsFilter };
    }

    // QUERY NOTIFICATIONS
    const [items, total] = await Promise.all([
      this.notificationModel
        .find(baseFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(validLimit)
        .populate('userId', 'email firstName lastName')
        .populate('relatedOrderId', 'orderCode status totalAmount finalAmount')
        .populate('relatedPromotionId', 'code name discountType discountValue')
        .select({
          _id: 1,
          userId: 1,
          title: 1,
          content: 1,
          type: 1,
          relatedOrderId: 1,
          relatedPromotionId: 1,
          metadata: 1,
          createdAt: 1,
          updatedAt: 1,
        })
        .lean() as any,

      this.notificationModel.countDocuments(baseFilter),
    ]);

    // GET READ STATUS FOR EACH NOTIFICATION (if userId is provided)
    let itemsWithReadStatus: any[] = items;
    if (userId) {
      const notificationIds = items.map((item) => item._id);
      const userIdObj = new Types.ObjectId(userId);
      const readRecords = await this.notificationReadModel
        .find({
          notificationId: { $in: notificationIds },
          userId: userIdObj,
        })
        .lean();

      const readMap = new Map(
        readRecords.map((record) => [record.notificationId.toString(), record.readAt]),
      );

      itemsWithReadStatus = items.map((item: any) => {
        const readAt = readMap.get(item._id.toString());
        return {
          ...item,
          isRead: !!readAt,
          readAt: readAt || null,
        };
      });
    } else {
      // If no userId filter, mark all as not read (admin view)
      itemsWithReadStatus = items.map((item: any) => ({
        ...item,
        isRead: false,
        readAt: null,
      }));
    }

    return ApiResponse.paginated(
      itemsWithReadStatus,
      {
        page: validPage,
        limit: validLimit,
        total,
      },
      'Lấy danh sách thông báo thành công',
    );
  }

  async getAdminNotificationDetail(notificationId: string) {
    // Role check is handled by @Roles(AccountRole.ADMIN) decorator in controller
    // Only admin can reach this point

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
        isActive: true,
      })
      .populate('userId', 'email firstName lastName role')
      .populate('relatedOrderId', 'orderCode status totalAmount finalAmount')
      .populate('relatedPromotionId', 'code name discountType discountValue')
      .select({
        _id: 1,
        userId: 1,
        title: 1,
        content: 1,
        type: 1,
        relatedOrderId: 1,
        relatedPromotionId: 1,
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

    // Get read status for the notification owner
    const userId = notification.userId as any;
    if (userId && userId._id) {
      const readRecord = await this.notificationReadModel.findOne({
        notificationId: new Types.ObjectId(notificationId),
        userId: userId._id,
      });

      const notificationData = {
        ...notification,
        isRead: !!readRecord,
        readAt: readRecord?.readAt || null,
      };

      return ApiResponse.success(notificationData, 'Lấy chi tiết thông báo thành công', 200);
    }

    return ApiResponse.success(
      {
        ...notification,
        isRead: false,
        readAt: null,
      },
      'Lấy chi tiết thông báo thành công',
      200,
    );
  }
}

